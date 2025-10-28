const { Course, User, Enrollment, Assignment, Role } = require('../models/businessModels');
const { Op } = require('sequelize');

// GET /api/courses - Récupérer tous les cours
const getAllCourses = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', teacher_id, status } = req.query;
        const offset = (page - 1) * limit;

        // Construire les conditions de recherche
        const where = {};
        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { code: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } }
            ];
        }
        if (teacher_id) where.teacher_id = teacher_id;
        if (status) where.status = status;

        const courses = await Course.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'teacher',
                    attributes: ['id', 'first_name', 'last_name', 'email'],
                    include: [{
                        model: Role,
                        as: 'role',
                        attributes: ['name']
                    }]
                },
                {
                    model: Enrollment,
                    as: 'enrollments',
                    attributes: ['id', 'student_id', 'status'],
                    include: [{
                        model: User,
                        as: 'student',
                        attributes: ['id', 'first_name', 'last_name']
                    }]
                },
                {
                    model: Assignment,
                    as: 'assignments',
                    attributes: ['id', 'title', 'due_date', 'status']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        // Calculer les statistiques pour chaque cours
        const coursesWithStats = courses.rows.map(course => {
            const courseData = course.toJSON();
            courseData.stats = {
                total_students: courseData.enrollments?.length || 0,
                active_students: courseData.enrollments?.filter(e => e.status === 'active').length || 0,
                total_assignments: courseData.assignments?.length || 0,
                published_assignments: courseData.assignments?.filter(a => a.status === 'published').length || 0
            };
            return courseData;
        });

        res.status(200).json({
            success: true,
            data: {
                courses: coursesWithStats,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(courses.count / limit),
                    total_items: courses.count,
                    items_per_page: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des cours',
            error: error.message
        });
    }
};

// GET /api/courses/:id - Récupérer un cours spécifique
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'teacher',
                    attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture']
                },
                {
                    model: Enrollment,
                    as: 'enrollments',
                    include: [{
                        model: User,
                        as: 'student',
                        attributes: ['id', 'first_name', 'last_name', 'email']
                    }]
                },
                {
                    model: Assignment,
                    as: 'assignments',
                    order: [['due_date', 'ASC']]
                }
            ]
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: { course }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération du cours',
            error: error.message
        });
    }
};

// POST /api/courses - Créer un nouveau cours (admin/teacher)
const createCourse = async (req, res) => {
    try {
        const {
            title,
            description,
            code,
            credits,
            teacher_id,
            start_date,
            end_date,
            max_students,
            syllabus,
            prerequisites
        } = req.body;

        // Validation des données requises
        if (!title || !code || !teacher_id) {
            return res.status(400).json({
                success: false,
                message: 'Le titre, le code et l\'enseignant sont requis'
            });
        }

        // Vérifier que l'enseignant existe et a le bon rôle
        const teacher = await User.findByPk(teacher_id, {
            include: [{
                model: Role,
                as: 'role'
            }]
        });

        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé'
            });
        }

        if (!['teacher', 'admin'].includes(teacher.role.name)) {
            return res.status(400).json({
                success: false,
                message: 'L\'utilisateur sélectionné n\'est pas un enseignant'
            });
        }

        // Vérifier l'unicité du code de cours
        const existingCourse = await Course.findOne({ where: { code } });
        if (existingCourse) {
            return res.status(400).json({
                success: false,
                message: 'Un cours avec ce code existe déjà'
            });
        }

        // Créer le cours
        const newCourse = await Course.create({
            title,
            description,
            code,
            credits: credits || 3,
            teacher_id,
            start_date,
            end_date,
            max_students,
            syllabus,
            prerequisites,
            status: 'active'
        });

        // Récupérer le cours créé avec les relations
        const courseWithDetails = await Course.findByPk(newCourse.id, {
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }]
        });

        res.status(201).json({
            success: true,
            message: 'Cours créé avec succès',
            data: { course: courseWithDetails }
        });

    } catch (error) {
        console.error('Erreur lors de la création du cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création du cours',
            error: error.message
        });
    }
};

// PUT /api/courses/:id - Modifier un cours (admin ou enseignant propriétaire)
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            code,
            credits,
            start_date,
            end_date,
            max_students,
            syllabus,
            prerequisites,
            status
        } = req.body;

        const course = await Course.findByPk(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Vérifier les permissions (admin ou enseignant propriétaire)
        const userRole = req.user.role;
        if (userRole !== 'admin' && course.teacher_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Seul l\'enseignant du cours ou un administrateur peut modifier ce cours'
            });
        }

        // Vérifier l'unicité du code si modifié
        if (code && code !== course.code) {
            const existingCourse = await Course.findOne({ 
                where: { 
                    code,
                    id: { [Op.ne]: id }
                }
            });
            if (existingCourse) {
                return res.status(400).json({
                    success: false,
                    message: 'Un cours avec ce code existe déjà'
                });
            }
        }

        // Mettre à jour le cours
        await course.update({
            title: title || course.title,
            description: description !== undefined ? description : course.description,
            code: code || course.code,
            credits: credits || course.credits,
            start_date: start_date || course.start_date,
            end_date: end_date || course.end_date,
            max_students: max_students || course.max_students,
            syllabus: syllabus !== undefined ? syllabus : course.syllabus,
            prerequisites: prerequisites !== undefined ? prerequisites : course.prerequisites,
            status: status || course.status
        });

        // Récupérer le cours mis à jour
        const updatedCourse = await Course.findByPk(id, {
            include: [{
                model: User,
                as: 'teacher',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }]
        });

        res.status(200).json({
            success: true,
            message: 'Cours mis à jour avec succès',
            data: { course: updatedCourse }
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la mise à jour du cours',
            error: error.message
        });
    }
};

// DELETE /api/courses/:id - Supprimer un cours (admin seulement)
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findByPk(id, {
            include: [
                { model: Enrollment, as: 'enrollments' },
                { model: Assignment, as: 'assignments' }
            ]
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Vérifier s'il y a des inscriptions ou des devoirs
        if (course.enrollments?.length > 0 || course.assignments?.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer ce cours car il contient des inscriptions ou des devoirs. Archivez-le plutôt.'
            });
        }

        await course.destroy();

        res.status(200).json({
            success: true,
            message: 'Cours supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la suppression du cours',
            error: error.message
        });
    }
};

// GET /api/teacher/:id/courses - Récupérer les cours d'un enseignant
const getTeacherCourses = async (req, res) => {
    try {
        const { id } = req.params;
        const { status = 'active' } = req.query;

        // Vérifier que l'utilisateur est un enseignant
        const teacher = await User.findByPk(id, {
            include: [{
                model: Role,
                as: 'role'
            }]
        });

        if (!teacher || !['teacher', 'admin'].includes(teacher.role.name)) {
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé'
            });
        }

        const whereClause = { teacher_id: id };
        if (status !== 'all') {
            whereClause.status = status;
        }

        const courses = await Course.findAll({
            where: whereClause,
            include: [
                {
                    model: Enrollment,
                    as: 'enrollments',
                    include: [{
                        model: User,
                        as: 'student',
                        attributes: ['id', 'first_name', 'last_name']
                    }]
                },
                {
                    model: Assignment,
                    as: 'assignments',
                    attributes: ['id', 'title', 'due_date', 'status']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: { 
                teacher: {
                    id: teacher.id,
                    name: `${teacher.first_name} ${teacher.last_name}`,
                    email: teacher.email
                },
                courses 
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des cours de l\'enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des cours',
            error: error.message
        });
    }
};

// GET /api/courses/:id/students - Récupérer les étudiants d'un cours
const getCourseStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const { status = 'active' } = req.query;

        // Vérifier que le cours existe
        const course = await Course.findByPk(id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Vérifier les permissions (admin ou enseignant du cours)
        const userRole = req.user.role;
        if (userRole !== 'admin' && course.teacher_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        // Récupérer les étudiants inscrits
        const enrollments = await Enrollment.findAll({
            where: {
                course_id: id,
                ...(status && { status })
            },
            include: [{
                model: User,
                as: 'student',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }],
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: {
                course: {
                    id: course.id,
                    title: course.title,
                    code: course.code
                },
                students: enrollments.map(enrollment => ({
                    enrollment_id: enrollment.id,
                    status: enrollment.status,
                    enrolled_at: enrollment.created_at,
                    student: enrollment.student
                })),
                total_students: enrollments.length
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des étudiants du cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des étudiants',
            error: error.message
        });
    }
};

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getTeacherCourses,
    getCourseStudents
};