const { Enrollment, Course, User, Role, Notification } = require('../models/businessModels');
const { Op } = require('sequelize');

// POST /api/enrollments - Inscrire un étudiant à un cours
const createEnrollment = async (req, res) => {
    try {
        const { student_id, course_id } = req.body;

        // Validation des données requises
        if (!student_id || !course_id) {
            return res.status(400).json({
                success: false,
                message: 'L\'ID de l\'étudiant et l\'ID du cours sont requis'
            });
        }

        // Vérifier que l'étudiant existe et a le bon rôle
        const student = await User.findByPk(student_id, {
            include: [{
                model: Role,
                as: 'role'
            }]
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        if (student.role.name !== 'student') {
            return res.status(400).json({
                success: false,
                message: 'L\'utilisateur sélectionné n\'est pas un étudiant'
            });
        }

        // Vérifier que le cours existe et est actif
        const course = await Course.findByPk(course_id, {
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name']
            }]
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        if (course.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Ce cours n\'est pas disponible pour l\'inscription'
            });
        }

        // Vérifier si l'étudiant n'est pas déjà inscrit
        const existingEnrollment = await Enrollment.findOne({
            where: { student_id, course_id }
        });

        if (existingEnrollment) {
            return res.status(400).json({
                success: false,
                message: 'L\'étudiant est déjà inscrit à ce cours'
            });
        }

        // Vérifier la limite d'étudiants
        if (course.max_students) {
            const currentEnrollments = await Enrollment.count({
                where: { 
                    course_id,
                    status: 'active'
                }
            });

            if (currentEnrollments >= course.max_students) {
                return res.status(400).json({
                    success: false,
                    message: 'Ce cours a atteint sa capacité maximale d\'étudiants'
                });
            }
        }

        // Créer l'inscription
        const enrollment = await Enrollment.create({
            student_id,
            course_id,
            enrollment_date: new Date(),
            status: 'active'
        });

        // Récupérer l'inscription avec les relations
        const enrollmentWithDetails = await Enrollment.findByPk(enrollment.id, {
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'code', 'description'],
                    include: [{
                        model: User,
                        as: 'teacher',
                        attributes: ['id', 'first_name', 'last_name']
                    }]
                }
            ]
        });

        // Créer une notification pour l'étudiant
        await Notification.create({
            user_id: student_id,
            title: 'Inscription confirmée',
            message: `Vous avez été inscrit avec succès au cours "${course.title}"`,
            type: 'success',
            priority: 'medium',
            related_entity_type: 'course',
            related_entity_id: course_id
        });

        res.status(201).json({
            success: true,
            message: 'Inscription créée avec succès',
            data: { enrollment: enrollmentWithDetails }
        });

    } catch (error) {
        console.error('Erreur lors de la création de l\'inscription:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création de l\'inscription',
            error: error.message
        });
    }
};

// GET /api/enrollments/:student_id - Récupérer les inscriptions d'un étudiant
const getStudentEnrollments = async (req, res) => {
    try {
        const { student_id } = req.params;
        const { status } = req.query;

        // Vérifier que l'étudiant existe
        const student = await User.findByPk(student_id, {
            include: [{
                model: Role,
                as: 'role'
            }]
        });

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

        const enrollments = await Enrollment.findAll({
            where,
            include: [
                {
                    model: Course,
                    as: 'course',
                    include: [
                        {
                            model: User,
                            as: 'teacher',
                            attributes: ['id', 'first_name', 'last_name', 'email']
                        }
                    ]
                }
            ],
            order: [['enrollment_date', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    name: `${student.first_name} ${student.last_name}`,
                    email: student.email
                },
                enrollments
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des inscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des inscriptions',
            error: error.message
        });
    }
};

// GET /api/courses/:course_id/enrollments - Récupérer les étudiants inscrits à un cours
const getCourseEnrollments = async (req, res) => {
    try {
        const { course_id } = req.params;
        const { status = 'active' } = req.query;

        // Vérifier que le cours existe
        const course = await Course.findByPk(course_id, {
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name']
            }]
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Construire les conditions de recherche
        const where = { course_id };
        if (status !== 'all') {
            where.status = status;
        }

        const enrollments = await Enrollment.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture', 'total_points', 'current_level']
                }
            ],
            order: [['enrollment_date', 'ASC']]
        });

        // Calculer les statistiques
        const stats = {
            total_enrolled: enrollments.length,
            active_students: enrollments.filter(e => e.status === 'active').length,
            completed_students: enrollments.filter(e => e.status === 'completed').length,
            dropped_students: enrollments.filter(e => e.status === 'dropped').length
        };

        res.status(200).json({
            success: true,
            data: {
                course: {
                    id: course.id,
                    title: course.title,
                    code: course.code,
                    teacher: course.teacher
                },
                enrollments,
                stats
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des inscriptions du cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des inscriptions',
            error: error.message
        });
    }
};

// PUT /api/enrollments/:id - Modifier le statut d'une inscription
const updateEnrollmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, final_grade } = req.body;

        // Valider le statut
        const validStatuses = ['active', 'completed', 'dropped', 'pending'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide. Utilisez: active, completed, dropped, ou pending'
            });
        }

        const enrollment = await Enrollment.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name']
                },
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'teacher_id']
                }
            ]
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Inscription non trouvée'
            });
        }

        // Vérifier les permissions (admin ou enseignant du cours)
        const userRole = req.user.role;
        if (userRole !== 'admin' && enrollment.course.teacher_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Seul l\'enseignant du cours ou un administrateur peut modifier cette inscription'
            });
        }

        // Valider la note finale si fournie
        if (final_grade !== undefined) {
            if (isNaN(final_grade) || final_grade < 0 || final_grade > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'La note finale doit être un nombre entre 0 et 100'
                });
            }
        }

        // Mettre à jour l'inscription
        const updateData = {};
        if (status) updateData.status = status;
        if (final_grade !== undefined) updateData.final_grade = final_grade;

        await enrollment.update(updateData);

        // Créer une notification pour l'étudiant si changement de statut
        if (status) {
            let notificationMessage = '';
            let notificationType = 'info';

            switch (status) {
                case 'completed':
                    notificationMessage = `Félicitations ! Vous avez terminé le cours "${enrollment.course.title}"`;
                    notificationType = 'success';
                    break;
                case 'dropped':
                    notificationMessage = `Vous avez été désinscrit du cours "${enrollment.course.title}"`;
                    notificationType = 'warning';
                    break;
                case 'active':
                    notificationMessage = `Votre inscription au cours "${enrollment.course.title}" est maintenant active`;
                    notificationType = 'success';
                    break;
            }

            if (notificationMessage) {
                await Notification.create({
                    user_id: enrollment.student_id,
                    title: 'Changement de statut d\'inscription',
                    message: notificationMessage,
                    type: notificationType,
                    priority: 'medium',
                    related_entity_type: 'enrollment',
                    related_entity_id: enrollment.id
                });
            }
        }

        // Récupérer l'inscription mise à jour
        const updatedEnrollment = await Enrollment.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'code']
                }
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Inscription mise à jour avec succès',
            data: { enrollment: updatedEnrollment }
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'inscription:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour de l\'inscription',
            error: error.message
        });
    }
};

// DELETE /api/enrollments/:id - Supprimer une inscription
const deleteEnrollment = async (req, res) => {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findByPk(id, {
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'title', 'teacher_id']
                },
                {
                    model: User,
                    as: 'student',
                    attributes: ['id', 'first_name', 'last_name']
                }
            ]
        });

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Inscription non trouvée'
            });
        }

        // Vérifier les permissions (admin ou enseignant du cours)
        const userRole = req.user.role;
        if (userRole !== 'admin' && enrollment.course.teacher_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Seul l\'enseignant du cours ou un administrateur peut supprimer cette inscription'
            });
        }

        await enrollment.destroy();

        // Créer une notification pour l'étudiant
        await Notification.create({
            user_id: enrollment.student_id,
            title: 'Inscription supprimée',
            message: `Votre inscription au cours "${enrollment.course.title}" a été supprimée`,
            type: 'warning',
            priority: 'high',
            related_entity_type: 'course',
            related_entity_id: enrollment.course_id
        });

        res.status(200).json({
            success: true,
            message: 'Inscription supprimée avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'inscription:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression de l\'inscription',
            error: error.message
        });
    }
};

module.exports = {
    createEnrollment,
    getStudentEnrollments,
    getCourseEnrollments,
    updateEnrollmentStatus,
    deleteEnrollment
};