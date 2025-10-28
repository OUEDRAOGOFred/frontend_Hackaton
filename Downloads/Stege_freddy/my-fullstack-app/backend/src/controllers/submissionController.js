const { Submission, Assignment, Course, User, Grade, Notification } = require('../models/businessModels');
const { Op } = require('sequelize');

// POST /api/submissions - Créer ou mettre à jour une soumission
const createOrUpdateSubmission = async (req, res) => {
    try {
        const {
            assignment_id,
            student_id,
            content,
            file_url,
            attachments
        } = req.body;

        // Validation des données requises
        if (!assignment_id || !student_id) {
            return res.status(400).json({
                success: false,
                message: 'L\'ID du devoir et l\'ID de l\'étudiant sont requis'
            });
        }

        // Vérifier que l'assignment existe et est publié
        const assignment = await Assignment.findByPk(assignment_id, {
            include: [{
                model: Course,
                as: 'course'
            }]
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Devoir non trouvé'
            });
        }

        if (assignment.status !== 'published') {
            return res.status(400).json({
                success: false,
                message: 'Ce devoir n\'est pas encore disponible pour soumission'
            });
        }

        // Vérifier que l'étudiant existe et est inscrit au cours
        const student = await User.findByPk(student_id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Vérifier l'inscription au cours
        const { Enrollment } = require('../models/businessModels');
        const enrollment = await Enrollment.findOne({
            where: {
                student_id,
                course_id: assignment.course_id,
                status: 'active'
            }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'L\'étudiant n\'est pas inscrit à ce cours'
            });
        }

        // Vérifier si la date limite est dépassée
        const now = new Date();
        const isLate = assignment.due_date && now > new Date(assignment.due_date);

        if (isLate && !assignment.allow_late_submission) {
            return res.status(400).json({
                success: false,
                message: 'La date limite de soumission est dépassée'
            });
        }

        // Chercher une soumission existante
        let submission = await Submission.findOne({
            where: { assignment_id, student_id }
        });

        if (submission) {
            // Mettre à jour la soumission existante
            if (submission.status === 'graded') {
                return res.status(400).json({
                    success: false,
                    message: 'Cette soumission a déjà été notée et ne peut plus être modifiée'
                });
            }

            await submission.update({
                content: content || submission.content,
                file_url: file_url || submission.file_url,
                attachments: attachments || submission.attachments,
                is_late: isLate
            });

        } else {
            // Créer une nouvelle soumission
            submission = await Submission.create({
                assignment_id,
                student_id,
                content,
                file_url,
                attachments,
                status: 'draft',
                is_late: isLate
            });
        }

        // Récupérer la soumission avec les relations
        const submissionWithDetails = await Submission.findByPk(submission.id, {
            include: [
                {
                    model: Assignment,
                    as: 'assignment',
                    attributes: ['id', 'title', 'due_date', 'max_points']
                },
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }
            ]
        });

        res.status(submission.created_at === submission.updated_at ? 201 : 200).json({
            success: true,
            message: submission.created_at === submission.updated_at ? 'Soumission créée avec succès' : 'Soumission mise à jour avec succès',
            data: { submission: submissionWithDetails }
        });

    } catch (error) {
        console.error('Erreur lors de la création/mise à jour de la soumission:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la soumission',
            error: error.message
        });
    }
};

// POST /api/submissions/:id/submit - Soumettre définitivement un devoir
const submitAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const submission = await Submission.findByPk(id, {
            include: [
                {
                    model: Assignment,
                    as: 'assignment',
                    include: [{
                        model: Course,
                        as: 'course',
                        include: [{
                            model: User,
                            as: 'teacher',
                            attributes: ['id', 'first_name', 'last_name']
                        }]
                    }]
                },
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name']
                }
            ]
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Soumission non trouvée'
            });
        }

        if (submission.status === 'submitted' || submission.status === 'graded') {
            return res.status(400).json({
                success: false,
                message: 'Cette soumission a déjà été remise'
            });
        }

        // Vérifier si du contenu a été fourni
        if (!submission.content && !submission.file_url) {
            return res.status(400).json({
                success: false,
                message: 'La soumission doit contenir du contenu ou un fichier'
            });
        }

        // Soumettre définitivement
        await submission.update({
            status: 'submitted',
            submitted_at: new Date()
        });

        // Notifier l'enseignant
        await Notification.create({
            user_id: submission.assignment.course.teacher.id,
            title: 'Nouvelle soumission reçue',
            message: `${submission.student.first_name} ${submission.student.last_name} a soumis le devoir "${submission.assignment.title}"`,
            type: 'info',
            priority: 'medium',
            related_entity_type: 'submission',
            related_entity_id: submission.id
        });

        res.status(200).json({
            success: true,
            message: 'Devoir soumis avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la soumission du devoir:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la soumission',
            error: error.message
        });
    }
};

// GET /api/assignments/:assignment_id/submissions - Récupérer toutes les soumissions d'un devoir
const getAssignmentSubmissions = async (req, res) => {
    try {
        const { assignment_id } = req.params;
        const { status, page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;

        // Vérifier que le devoir existe
        const assignment = await Assignment.findByPk(assignment_id, {
            include: [{
                model: Course,
                as: 'course',
                attributes: ['teacher_id']
            }]
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Devoir non trouvé'
            });
        }

        // Vérifier les permissions (admin ou enseignant du cours)
        const userRole = req.user.role;
        if (userRole !== 'admin' && assignment.course.teacher_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        // Construire les conditions de recherche
        const where = { assignment_id };
        if (status) {
            where.status = status;
        }

        const submissions = await Submission.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Grade,
                    as: 'grade',
                    include: [{
                        model: User,
                        as: 'grader',
                        attributes: ['id', 'first_name', 'last_name']
                    }]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['submitted_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: {
                assignment: {
                    id: assignment.id,
                    title: assignment.title,
                    due_date: assignment.due_date,
                    max_points: assignment.max_points
                },
                submissions: submissions.rows,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(submissions.count / limit),
                    total_items: submissions.count,
                    items_per_page: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des soumissions:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des soumissions',
            error: error.message
        });
    }
};

// GET /api/students/:student_id/submissions - Récupérer les soumissions d'un étudiant
const getStudentSubmissions = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { course_id, status } = req.query;

        // Vérifier que l'étudiant existe
        const student = await User.findByPk(student_id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Construire les conditions de recherche
        const where = { student_id };
        if (status) {
            where.status = status;
        }

        // Inclure les conditions pour le cours si spécifié
        const include = [
            {
                model: Assignment,
                as: 'assignment',
                include: [{
                    model: Course,
                    as: 'course',
                    where: course_id ? { id: course_id } : {},
                    include: [{
                        model: User,
                        as: 'teacher',
                        attributes: ['id', 'first_name', 'last_name']
                    }]
                }]
            },
            {
                model: Grade,
                as: 'grade',
                include: [{
                    model: User,
                    as: 'grader',
                    attributes: ['id', 'first_name', 'last_name']
                }]
            }
        ];

        const submissions = await Submission.findAll({
            where,
            include,
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    name: `${student.first_name} ${student.last_name}`,
                    email: student.email
                },
                submissions
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des soumissions de l\'étudiant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des soumissions',
            error: error.message
        });
    }
};

// POST /api/grades - Noter une soumission
const gradeSubmission = async (req, res) => {
    try {
        const {
            submission_id,
            grade_value,
            comment
        } = req.body;

        // Validation des données requises
        if (!submission_id || grade_value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'L\'ID de la soumission et la note sont requis'
            });
        }

        // Valider la note
        if (isNaN(grade_value) || grade_value < 0 || grade_value > 100) {
            return res.status(400).json({
                success: false,
                message: 'La note doit être un nombre entre 0 et 100'
            });
        }

        // Vérifier que la soumission existe
        const submission = await Submission.findByPk(submission_id, {
            include: [
                {
                    model: Assignment,
                    as: 'assignment',
                    include: [{
                        model: Course,
                        as: 'course',
                        attributes: ['teacher_id']
                    }]
                },
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Grade,
                    as: 'grade'
                }
            ]
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Soumission non trouvée'
            });
        }

        if (submission.status !== 'submitted') {
            return res.status(400).json({
                success: false,
                message: 'Seules les soumissions remises peuvent être notées'
            });
        }

        // Vérifier les permissions (admin ou enseignant du cours)
        const userRole = req.user.role;
        if (userRole !== 'admin' && submission.assignment.course.teacher_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Seul l\'enseignant du cours peut noter cette soumission'
            });
        }

        let grade;
        if (submission.grade) {
            // Mettre à jour la note existante
            await submission.grade.update({
                grade_value,
                comment,
                graded_by: req.user.userId,
                graded_at: new Date()
            });
            grade = submission.grade;
        } else {
            // Créer une nouvelle note
            grade = await Grade.create({
                submission_id,
                grade_value,
                comment,
                graded_by: req.user.userId,
                graded_at: new Date()
            });
        }

        // Mettre à jour le statut de la soumission
        await submission.update({ status: 'graded' });

        // Notifier l'étudiant
        await Notification.create({
            user_id: submission.student.id,
            title: 'Note disponible',
            message: `Votre soumission pour "${submission.assignment.title}" a été notée (${grade_value}/100)`,
            type: 'grade',
            priority: 'medium',
            related_entity_type: 'grade',
            related_entity_id: grade.id
        });

        // Récupérer la note avec tous les détails
        const gradeWithDetails = await Grade.findByPk(grade.id, {
            include: [
                {
                    model: Submission,
                    as: 'submission',
                    include: [
                        {
                            model: Assignment,
                            as: 'assignment',
                            attributes: ['id', 'title', 'max_points']
                        },
                        {
                            model: User,
                            as: 'student',
                            attributes: ['id', 'first_name', 'last_name']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'grader',
                    attributes: ['id', 'first_name', 'last_name']
                }
            ]
        });

        res.status(grade.created_at === grade.updated_at ? 201 : 200).json({
            success: true,
            message: grade.created_at === grade.updated_at ? 'Note ajoutée avec succès' : 'Note mise à jour avec succès',
            data: { grade: gradeWithDetails }
        });

    } catch (error) {
        console.error('Erreur lors de la notation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la notation',
            error: error.message
        });
    }
};

// GET /api/grades/student/:student_id - Récupérer toutes les notes d'un étudiant
const getStudentGrades = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { course_id } = req.query;

        // Vérifier que l'étudiant existe
        const student = await User.findByPk(student_id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Construire la requête pour les notes
        const whereSubmission = { student_id };
        
        const include = [
            {
                model: Submission,
                as: 'submission',
                where: whereSubmission,
                include: [
                    {
                        model: Assignment,
                        as: 'assignment',
                        include: [{
                            model: Course,
                            as: 'course',
                            where: course_id ? { id: course_id } : {},
                            attributes: ['id', 'title', 'code'],
                            include: [{
                                model: User,
                                as: 'teacher',
                                attributes: ['id', 'first_name', 'last_name']
                            }]
                        }]
                    },
                    {
                        model: User,
                        as: 'student',
                        attributes: ['id', 'first_name', 'last_name']
                    }
                ]
            },
            {
                model: User,
                as: 'grader',
                attributes: ['id', 'first_name', 'last_name']
            }
        ];

        const grades = await Grade.findAll({
            include,
            order: [['graded_at', 'DESC']]
        });

        // Calculer les statistiques
        const stats = {
            total_grades: grades.length,
            average_grade: grades.length > 0 ? 
                grades.reduce((sum, grade) => sum + parseFloat(grade.grade_value), 0) / grades.length : 0,
            highest_grade: grades.length > 0 ? 
                Math.max(...grades.map(grade => parseFloat(grade.grade_value))) : 0,
            lowest_grade: grades.length > 0 ? 
                Math.min(...grades.map(grade => parseFloat(grade.grade_value))) : 0
        };

        res.status(200).json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    name: `${student.first_name} ${student.last_name}`,
                    email: student.email
                },
                grades,
                stats
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des notes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des notes',
            error: error.message
        });
    }
};

module.exports = {
    createOrUpdateSubmission,
    submitAssignment,
    getAssignmentSubmissions,
    getStudentSubmissions,
    gradeSubmission,
    getStudentGrades
};