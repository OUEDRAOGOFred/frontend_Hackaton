const { Assignment, Course, User, Submission, Group, TokenTransaction, Notification } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * @desc    Obtenir tous les devoirs
 * @route   GET /api/assignments
 * @access  Authentifié
 */
exports.getAssignments = async (req, res) => {
    try {
        const { courseId, status, groupId, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (courseId) whereClause.courseId = courseId;
        if (status) whereClause.status = status;
        if (groupId) whereClause.groupId = groupId;

        // Si l'utilisateur est étudiant, ne montrer que les devoirs de ses cours
        if (req.user.role === 'student') {
            const { CourseEnrollment } = require('../models');
            const enrolledCourses = await CourseEnrollment.findAll({
                where: { userId: req.user.id, status: 'active' },
                attributes: ['courseId']
            });
            const courseIds = enrolledCourses.map(e => e.courseId);
            whereClause.courseId = { [Op.in]: courseIds };
        }

        const { rows: assignments, count } = await Assignment.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Course,
                    as: 'Course',
                    attributes: ['id', 'title', 'code'],
                    include: [{
                        model: User,
                        as: 'Teacher',
                        attributes: ['firstName', 'lastName']
                    }]
                },
                {
                    model: Group,
                    as: 'Group',
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: Submission,
                    as: 'Submissions',
                    attributes: ['id', 'userId', 'status', 'score'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['dueDate', 'ASC']]
        });

        // Ajouter des statistiques pour chaque devoir
        const assignmentsWithStats = assignments.map(assignment => {
            const submissions = assignment.Submissions || [];
            const submissionCount = submissions.length;
            const completedSubmissions = submissions.filter(s => s.status === 'graded').length;
            const averageScore = completedSubmissions > 0 ? 
                submissions.filter(s => s.score !== null)
                          .reduce((sum, s) => sum + s.score, 0) / completedSubmissions : 0;

            return {
                ...assignment.toJSON(),
                stats: {
                    totalSubmissions: submissionCount,
                    gradedSubmissions: completedSubmissions,
                    averageScore: averageScore.toFixed(1)
                }
            };
        });

        res.json({
            success: true,
            assignments: assignmentsWithStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalAssignments: count
            }
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des devoirs',
            error: error.message
        });
    }
};

/**
 * @desc    Créer un nouveau devoir
 * @route   POST /api/assignments
 * @access  Professeur/Admin
 */
exports.createAssignment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { title, description, courseId, dueDate, maxPoints, type, groupId } = req.body;

        // Vérifier que l'utilisateur peut créer des devoirs
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Seuls les professeurs et administrateurs peuvent créer des devoirs'
            });
        }

        // Vérifier que le cours existe et que l'utilisateur y a accès
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        if (req.user.role === 'teacher' && course.teacherId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez créer des devoirs que pour vos propres cours'
            });
        }

        const assignment = await Assignment.create({
            title,
            description,
            courseId,
            dueDate,
            maxPoints,
            type: type || 'individual',
            groupId: groupId || null,
            status: 'active'
        });

        // Créer des notifications pour tous les étudiants inscrits
        const { CourseEnrollment } = require('../models');
        const enrollments = await CourseEnrollment.findAll({
            where: { courseId, status: 'active' }
        });

        const notifications = enrollments.map(enrollment => ({
            userId: enrollment.userId,
            type: 'assignment_created',
            title: 'Nouveau devoir',
            message: `Un nouveau devoir "${title}" a été ajouté dans le cours ${course.title}`,
            metadata: { assignmentId: assignment.id, courseId }
        }));

        await Notification.bulkCreate(notifications);

        const assignmentWithDetails = await Assignment.findByPk(assignment.id, {
            include: [
                {
                    model: Course,
                    as: 'Course',
                    attributes: ['id', 'title', 'code']
                },
                {
                    model: Group,
                    as: 'Group',
                    attributes: ['id', 'name'],
                    required: false
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Devoir créé avec succès',
            assignment: assignmentWithDetails
        });
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du devoir',
            error: error.message
        });
    }
};

/**
 * @desc    Soumettre un devoir
 * @route   POST /api/assignments/:id/submit
 * @access  Étudiant
 */
exports.submitAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, attachments } = req.body;
        const userId = req.user.id;

        // Vérifier que l'utilisateur est un étudiant
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Seuls les étudiants peuvent soumettre des devoirs'
            });
        }

        // Vérifier que le devoir existe
        const assignment = await Assignment.findByPk(id, {
            include: [{
                model: Course,
                as: 'Course',
                attributes: ['id', 'title']
            }]
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Devoir non trouvé'
            });
        }

        // Vérifier que l'étudiant est inscrit au cours
        const { CourseEnrollment } = require('../models');
        const enrollment = await CourseEnrollment.findOne({
            where: { courseId: assignment.courseId, userId, status: 'active' }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'êtes pas inscrit à ce cours'
            });
        }

        // Vérifier si la date limite n'est pas dépassée
        if (new Date() > new Date(assignment.dueDate)) {
            return res.status(400).json({
                success: false,
                message: 'La date limite de soumission est dépassée'
            });
        }

        // Vérifier s'il y a déjà une soumission
        const existingSubmission = await Submission.findOne({
            where: { assignmentId: id, userId }
        });

        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'Vous avez déjà soumis ce devoir'
            });
        }

        // Créer la soumission
        const submission = await Submission.create({
            assignmentId: id,
            userId,
            content,
            attachments: attachments || [],
            status: 'submitted',
            submittedAt: new Date()
        });

        // Attribuer des tokens pour la soumission
        const tokensEarned = 10; // Points de base pour soumission
        await TokenTransaction.create({
            userId,
            type: 'assignment_submitted',
            amount: tokensEarned,
            description: `Soumission du devoir: ${assignment.title}`,
            metadata: { assignmentId: id }
        });

        // Notification au professeur
        await Notification.create({
            userId: assignment.Course.teacherId,
            type: 'assignment_submitted',
            title: 'Nouvelle soumission',
            message: `${req.user.firstName} ${req.user.lastName} a soumis le devoir "${assignment.title}"`,
            metadata: { assignmentId: id, submissionId: submission.id }
        });

        res.status(201).json({
            success: true,
            message: 'Devoir soumis avec succès',
            submission,
            tokensEarned
        });
    } catch (error) {
        console.error('Error submitting assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la soumission du devoir',
            error: error.message
        });
    }
};

/**
 * @desc    Noter un devoir
 * @route   PUT /api/assignments/:id/grade
 * @access  Professeur/Admin
 */
exports.gradeAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { submissionId, score, feedback } = req.body;

        // Vérifier que l'utilisateur peut noter
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Seuls les professeurs et administrateurs peuvent noter'
            });
        }

        const submission = await Submission.findByPk(submissionId, {
            include: [
                {
                    model: Assignment,
                    as: 'Assignment',
                    include: [{
                        model: Course,
                        as: 'Course'
                    }]
                },
                {
                    model: User,
                    as: 'User',
                    attributes: ['id', 'firstName', 'lastName']
                }
            ]
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Soumission non trouvée'
            });
        }

        // Vérifier que le professeur enseigne ce cours
        if (req.user.role === 'teacher' && submission.Assignment.Course.teacherId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez noter que les devoirs de vos propres cours'
            });
        }

        // Mettre à jour la soumission
        await submission.update({
            score,
            feedback,
            status: 'graded',
            gradedAt: new Date()
        });

        // Calculer les tokens bonus basés sur la note
        const percentage = (score / submission.Assignment.maxPoints) * 100;
        let bonusTokens = 0;
        if (percentage >= 90) bonusTokens = 50;
        else if (percentage >= 80) bonusTokens = 30;
        else if (percentage >= 70) bonusTokens = 20;
        else if (percentage >= 60) bonusTokens = 10;

        if (bonusTokens > 0) {
            await TokenTransaction.create({
                userId: submission.userId,
                type: 'assignment_graded',
                amount: bonusTokens,
                description: `Bonus pour excellente note: ${score}/${submission.Assignment.maxPoints}`,
                metadata: { assignmentId: id, submissionId }
            });
        }

        // Notification à l'étudiant
        await Notification.create({
            userId: submission.userId,
            type: 'assignment_graded',
            title: 'Devoir noté',
            message: `Votre devoir "${submission.Assignment.title}" a été noté: ${score}/${submission.Assignment.maxPoints}`,
            metadata: { assignmentId: id, submissionId, score }
        });

        res.json({
            success: true,
            message: 'Devoir noté avec succès',
            submission: await Submission.findByPk(submissionId, {
                include: [
                    {
                        model: Assignment,
                        as: 'Assignment',
                        attributes: ['title', 'maxPoints']
                    },
                    {
                        model: User,
                        as: 'User',
                        attributes: ['firstName', 'lastName']
                    }
                ]
            }),
            bonusTokens
        });
    } catch (error) {
        console.error('Error grading assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la notation du devoir',
            error: error.message
        });
    }
};