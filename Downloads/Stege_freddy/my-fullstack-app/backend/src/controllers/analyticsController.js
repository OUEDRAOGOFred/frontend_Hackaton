const { User, Course, Assignment, Submission, Grade, Enrollment, Notification } = require('../models/businessModels');
const { Op, fn, col, literal } = require('sequelize');

// GET /api/analytics/dashboard - Tableau de bord global
const getDashboardStats = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period);
        
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        // Statistiques générales
        const totalUsers = await User.count();
        const totalCourses = await Course.count();
        const totalAssignments = await Assignment.count();
        const totalSubmissions = await Submission.count();

        // Statistiques récentes
        const recentEnrollments = await Enrollment.count({
            where: {
                created_at: { [Op.gte]: dateLimit }
            }
        });

        const recentSubmissions = await Submission.count({
            where: {
                submitted_at: { [Op.gte]: dateLimit }
            }
        });

        const recentGrades = await Grade.count({
            where: {
                graded_at: { [Op.gte]: dateLimit }
            }
        });

        // Répartition par rôle
        const usersByRole = await User.findAll({
            attributes: [
                'role',
                [fn('COUNT', col('id')), 'count']
            ],
            group: ['role'],
            raw: true
        });

        // Cours les plus populaires
        const popularCourses = await Course.findAll({
            attributes: [
                'id',
                'title',
                'code',
                [fn('COUNT', col('enrollments.id')), 'enrollment_count']
            ],
            include: [{
                model: Enrollment,
                as: 'enrollments',
                attributes: [],
                where: { status: 'active' }
            }],
            group: ['Course.id'],
            order: [[literal('enrollment_count'), 'DESC']],
            limit: 5,
            raw: true
        });

        // Taux de soumission
        const assignmentsWithStats = await Assignment.findAll({
            attributes: [
                'id',
                'title',
                [fn('COUNT', col('submissions.id')), 'submission_count']
            ],
            include: [{
                model: Submission,
                as: 'submissions',
                attributes: []
            }],
            group: ['Assignment.id'],
            having: literal('submission_count > 0'),
            raw: true
        });

        const submissionRate = assignmentsWithStats.length > 0 ?
            assignmentsWithStats.reduce((sum, a) => sum + parseInt(a.submission_count), 0) / totalAssignments * 100 : 0;

        // Moyennes des notes
        const gradeStats = await Grade.findOne({
            attributes: [
                [fn('AVG', col('grade_value')), 'average_grade'],
                [fn('MIN', col('grade_value')), 'min_grade'],
                [fn('MAX', col('grade_value')), 'max_grade']
            ],
            raw: true
        });

        res.status(200).json({
            success: true,
            data: {
                period: `${days} derniers jours`,
                overview: {
                    total_users: totalUsers,
                    total_courses: totalCourses,
                    total_assignments: totalAssignments,
                    total_submissions: totalSubmissions
                },
                recent_activity: {
                    new_enrollments: recentEnrollments,
                    new_submissions: recentSubmissions,
                    new_grades: recentGrades
                },
                users_by_role: usersByRole,
                popular_courses: popularCourses,
                performance: {
                    submission_rate: parseFloat(submissionRate.toFixed(2)),
                    average_grade: gradeStats?.average_grade ? parseFloat(gradeStats.average_grade).toFixed(2) : 0,
                    min_grade: gradeStats?.min_grade || 0,
                    max_grade: gradeStats?.max_grade || 0
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques du tableau de bord:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des statistiques',
            error: error.message
        });
    }
};

// GET /api/analytics/course/:id - Analyses détaillées d'un cours
const getCourseAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que le cours existe
        const course = await Course.findByPk(id, {
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

        // Statistiques d'inscription
        const enrollmentStats = await Enrollment.findAll({
            where: { course_id: id },
            attributes: [
                'status',
                [fn('COUNT', col('id')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        const totalEnrollments = enrollmentStats.reduce((sum, stat) => sum + parseInt(stat.count), 0);

        // Étudiants actifs
        const activeStudents = await Enrollment.findAll({
            where: {
                course_id: id,
                status: 'active'
            },
            include: [{
                model: User,
                as: 'student',
                attributes: ['id', 'first_name', 'last_name', 'email']
            }]
        });

        // Statistiques des devoirs
        const assignments = await Assignment.findAll({
            where: { course_id: id },
            attributes: [
                'id',
                'title',
                'due_date',
                'max_points',
                [fn('COUNT', col('submissions.id')), 'submission_count'],
                [fn('AVG', col('submissions.grade.grade_value')), 'average_grade']
            ],
            include: [{
                model: Submission,
                as: 'submissions',
                attributes: [],
                include: [{
                    model: Grade,
                    as: 'grade',
                    attributes: []
                }]
            }],
            group: ['Assignment.id'],
            raw: true
        });

        // Performance des étudiants
        const studentPerformances = await User.findAll({
            attributes: [
                'id',
                'first_name',
                'last_name',
                [fn('COUNT', col('submissions.id')), 'total_submissions'],
                [fn('AVG', col('submissions.grade.grade_value')), 'average_grade'],
                [fn('COUNT', col('submissions.grade.id')), 'graded_submissions']
            ],
            include: [
                {
                    model: Enrollment,
                    as: 'enrollments',
                    where: {
                        course_id: id,
                        status: 'active'
                    },
                    attributes: []
                },
                {
                    model: Submission,
                    as: 'submissions',
                    attributes: [],
                    include: [{
                        model: Assignment,
                        as: 'assignment',
                        where: { course_id: id },
                        attributes: []
                    }, {
                        model: Grade,
                        as: 'grade',
                        attributes: []
                    }]
                }
            ],
            group: ['User.id'],
            raw: true
        });

        // Tendance des soumissions dans le temps
        const submissionTrend = await Submission.findAll({
            attributes: [
                [fn('DATE', col('submitted_at')), 'date'],
                [fn('COUNT', col('id')), 'submissions']
            ],
            include: [{
                model: Assignment,
                as: 'assignment',
                where: { course_id: id },
                attributes: []
            }],
            where: {
                submitted_at: {
                    [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 30))
                }
            },
            group: [fn('DATE', col('submitted_at'))],
            order: [[fn('DATE', col('submitted_at')), 'ASC']],
            raw: true
        });

        res.status(200).json({
            success: true,
            data: {
                course: {
                    id: course.id,
                    title: course.title,
                    code: course.code,
                    teacher: course.teacher
                },
                enrollments: {
                    total: totalEnrollments,
                    by_status: enrollmentStats,
                    active_students: activeStudents.length
                },
                assignments: {
                    total: assignments.length,
                    details: assignments.map(a => ({
                        id: a.id,
                        title: a.title,
                        due_date: a.due_date,
                        max_points: a.max_points,
                        submission_count: parseInt(a.submission_count) || 0,
                        average_grade: a.average_grade ? parseFloat(a.average_grade).toFixed(2) : null,
                        submission_rate: totalEnrollments > 0 ? 
                            ((parseInt(a.submission_count) || 0) / totalEnrollments * 100).toFixed(2) : 0
                    }))
                },
                student_performances: studentPerformances.map(s => ({
                    student: {
                        id: s.id,
                        name: `${s.first_name} ${s.last_name}`
                    },
                    total_submissions: parseInt(s.total_submissions) || 0,
                    graded_submissions: parseInt(s.graded_submissions) || 0,
                    average_grade: s.average_grade ? parseFloat(s.average_grade).toFixed(2) : null,
                    completion_rate: assignments.length > 0 ? 
                        ((parseInt(s.total_submissions) || 0) / assignments.length * 100).toFixed(2) : 0
                })),
                submission_trend: submissionTrend
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des analyses du cours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des analyses',
            error: error.message
        });
    }
};

// GET /api/analytics/student/:id - Analyses de performance d'un étudiant
const getStudentAnalytics = async (req, res) => {
    try {
        const { id } = req.params;
        const { course_id } = req.query;

        // Vérifier que l'étudiant existe
        const student = await User.findByPk(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Étudiant non trouvé'
            });
        }

        // Construire les conditions pour les cours
        const courseWhere = course_id ? { id: course_id } : {};

        // Inscriptions de l'étudiant
        const enrollments = await Enrollment.findAll({
            where: { student_id: id },
            include: [{
                model: Course,
                as: 'course',
                where: courseWhere,
                include: [{
                    model: User,
                    as: 'teacher',
                    attributes: ['id', 'first_name', 'last_name']
                }]
            }]
        });

        // Statistiques des soumissions
        const submissionStats = await Submission.findAll({
            where: { student_id: id },
            attributes: [
                [fn('COUNT', col('id')), 'total_submissions'],
                [fn('COUNT', col('grade.id')), 'graded_submissions'],
                [fn('AVG', col('grade.grade_value')), 'average_grade'],
                [fn('MIN', col('grade.grade_value')), 'min_grade'],
                [fn('MAX', col('grade.grade_value')), 'max_grade']
            ],
            include: [{
                model: Assignment,
                as: 'assignment',
                include: [{
                    model: Course,
                    as: 'course',
                    where: courseWhere,
                    attributes: []
                }],
                attributes: []
            }, {
                model: Grade,
                as: 'grade',
                attributes: []
            }],
            raw: true
        });

        // Performance par cours
        const performancesByCourse = await Course.findAll({
            where: courseWhere,
            attributes: [
                'id',
                'title',
                'code',
                [fn('COUNT', col('assignments.submissions.id')), 'total_submissions'],
                [fn('COUNT', col('assignments.submissions.grade.id')), 'graded_submissions'],
                [fn('AVG', col('assignments.submissions.grade.grade_value')), 'average_grade']
            ],
            include: [
                {
                    model: Enrollment,
                    as: 'enrollments',
                    where: { student_id: id },
                    attributes: []
                },
                {
                    model: Assignment,
                    as: 'assignments',
                    attributes: [],
                    include: [{
                        model: Submission,
                        as: 'submissions',
                        where: { student_id: id },
                        attributes: [],
                        include: [{
                            model: Grade,
                            as: 'grade',
                            attributes: []
                        }]
                    }]
                }
            ],
            group: ['Course.id'],
            raw: true
        });

        // Évolution des notes dans le temps
        const gradeEvolution = await Grade.findAll({
            attributes: [
                'grade_value',
                'graded_at',
                [literal('assignment.title'), 'assignment_title'],
                [literal('assignment.course.title'), 'course_title']
            ],
            include: [{
                model: Submission,
                as: 'submission',
                where: { student_id: id },
                attributes: [],
                include: [{
                    model: Assignment,
                    as: 'assignment',
                    attributes: [],
                    include: [{
                        model: Course,
                        as: 'course',
                        where: courseWhere,
                        attributes: []
                    }]
                }]
            }],
            order: [['graded_at', 'ASC']],
            raw: true
        });

        // Statistiques de ponctualité
        const lateSubmissions = await Submission.count({
            where: {
                student_id: id,
                is_late: true
            },
            include: [{
                model: Assignment,
                as: 'assignment',
                include: [{
                    model: Course,
                    as: 'course',
                    where: courseWhere,
                    attributes: []
                }],
                attributes: []
            }]
        });

        const totalSubmissions = parseInt(submissionStats[0]?.total_submissions) || 0;

        res.status(200).json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    name: `${student.first_name} ${student.last_name}`,
                    email: student.email
                },
                enrollments: {
                    total: enrollments.length,
                    courses: enrollments.map(e => ({
                        course_id: e.course.id,
                        course_title: e.course.title,
                        course_code: e.course.code,
                        teacher: e.course.teacher,
                        status: e.status,
                        enrolled_at: e.created_at
                    }))
                },
                performance: {
                    total_submissions: totalSubmissions,
                    graded_submissions: parseInt(submissionStats[0]?.graded_submissions) || 0,
                    average_grade: submissionStats[0]?.average_grade ? 
                        parseFloat(submissionStats[0].average_grade).toFixed(2) : null,
                    min_grade: submissionStats[0]?.min_grade || null,
                    max_grade: submissionStats[0]?.max_grade || null,
                    late_submissions: lateSubmissions,
                    punctuality_rate: totalSubmissions > 0 ? 
                        ((totalSubmissions - lateSubmissions) / totalSubmissions * 100).toFixed(2) : 100
                },
                performance_by_course: performancesByCourse.map(course => ({
                    course_id: course.id,
                    course_title: course.title,
                    course_code: course.code,
                    total_submissions: parseInt(course.total_submissions) || 0,
                    graded_submissions: parseInt(course.graded_submissions) || 0,
                    average_grade: course.average_grade ? 
                        parseFloat(course.average_grade).toFixed(2) : null
                })),
                grade_evolution: gradeEvolution
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des analyses de l\'étudiant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des analyses',
            error: error.message
        });
    }
};

// GET /api/analytics/teacher/:id - Analyses pour un enseignant
const getTeacherAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que l'enseignant existe
        const teacher = await User.findByPk(id);
        if (!teacher) {
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé'
            });
        }

        // Cours de l'enseignant
        const courses = await Course.findAll({
            where: { teacher_id: id },
            include: [
                {
                    model: Enrollment,
                    as: 'enrollments',
                    where: { status: 'active' },
                    required: false
                },
                {
                    model: Assignment,
                    as: 'assignments',
                    include: [{
                        model: Submission,
                        as: 'submissions',
                        include: [{
                            model: Grade,
                            as: 'grade'
                        }]
                    }]
                }
            ]
        });

        // Statistiques globales
        const totalStudents = courses.reduce((sum, course) => sum + course.enrollments.length, 0);
        const totalAssignments = courses.reduce((sum, course) => sum + course.assignments.length, 0);
        const totalSubmissions = courses.reduce((sum, course) => 
            sum + course.assignments.reduce((subSum, assignment) => subSum + assignment.submissions.length, 0), 0);

        // Devoirs nécessitant une correction
        const pendingGrading = courses.reduce((sum, course) => 
            sum + course.assignments.reduce((subSum, assignment) => 
                subSum + assignment.submissions.filter(sub => sub.status === 'submitted' && !sub.grade).length, 0), 0);

        // Performance moyenne par cours
        const coursePerformances = courses.map(course => {
            const assignments = course.assignments;
            const allGrades = assignments.flatMap(a => 
                a.submissions.filter(s => s.grade).map(s => parseFloat(s.grade.grade_value)));
            
            return {
                course_id: course.id,
                course_title: course.title,
                course_code: course.code,
                students: course.enrollments.length,
                assignments: assignments.length,
                submissions: assignments.reduce((sum, a) => sum + a.submissions.length, 0),
                average_grade: allGrades.length > 0 ? 
                    (allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length).toFixed(2) : null,
                pending_grading: assignments.reduce((sum, a) => 
                    sum + a.submissions.filter(s => s.status === 'submitted' && !s.grade).length, 0)
            };
        });

        // Activité récente (30 derniers jours)
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 30);

        const recentActivity = {
            new_submissions: await Submission.count({
                where: {
                    submitted_at: { [Op.gte]: dateLimit }
                },
                include: [{
                    model: Assignment,
                    as: 'assignment',
                    where: { course_id: { [Op.in]: courses.map(c => c.id) } },
                    attributes: []
                }]
            }),
            grades_given: await Grade.count({
                where: {
                    graded_at: { [Op.gte]: dateLimit },
                    graded_by: id
                }
            })
        };

        res.status(200).json({
            success: true,
            data: {
                teacher: {
                    id: teacher.id,
                    name: `${teacher.first_name} ${teacher.last_name}`,
                    email: teacher.email
                },
                overview: {
                    total_courses: courses.length,
                    total_students: totalStudents,
                    total_assignments: totalAssignments,
                    total_submissions: totalSubmissions,
                    pending_grading: pendingGrading
                },
                courses: coursePerformances,
                recent_activity: recentActivity
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des analyses de l\'enseignant:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des analyses',
            error: error.message
        });
    }
};

// GET /api/analytics/system - Analyses système avancées
const getSystemAnalytics = async (req, res) => {
    try {
        const { period = '90' } = req.query;
        const days = parseInt(period);
        
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - days);

        // Tendances d'utilisation
        const userGrowth = await User.findAll({
            attributes: [
                [fn('DATE', col('created_at')), 'date'],
                [fn('COUNT', col('id')), 'new_users']
            ],
            where: {
                created_at: { [Op.gte]: dateLimit }
            },
            group: [fn('DATE', col('created_at'))],
            order: [[fn('DATE', col('created_at')), 'ASC']],
            raw: true
        });

        // Taux d'engagement
        const engagementStats = await User.findAll({
            attributes: [
                'role',
                [fn('COUNT', col('User.id')), 'total_users'],
                [fn('COUNT', col('submissions.id')), 'active_users']
            ],
            include: [{
                model: Submission,
                as: 'submissions',
                where: {
                    created_at: { [Op.gte]: dateLimit }
                },
                attributes: [],
                required: false
            }],
            group: ['User.role'],
            raw: true
        });

        // Performance globale du système
        const systemPerformance = {
            total_courses: await Course.count(),
            active_courses: await Course.count({
                include: [{
                    model: Assignment,
                    as: 'assignments',
                    where: {
                        created_at: { [Op.gte]: dateLimit }
                    },
                    required: true
                }]
            }),
            completion_rate: await Submission.count({
                where: { status: 'graded' }
            }) / await Submission.count() * 100
        };

        res.status(200).json({
            success: true,
            data: {
                period: `${days} derniers jours`,
                user_growth: userGrowth,
                engagement: engagementStats.map(stat => ({
                    role: stat.role,
                    total_users: parseInt(stat.total_users),
                    active_users: parseInt(stat.active_users) || 0,
                    engagement_rate: parseInt(stat.total_users) > 0 ? 
                        ((parseInt(stat.active_users) || 0) / parseInt(stat.total_users) * 100).toFixed(2) : 0
                })),
                system_performance: {
                    ...systemPerformance,
                    completion_rate: systemPerformance.completion_rate.toFixed(2)
                }
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des analyses système:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la récupération des analyses système',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getCourseAnalytics,
    getStudentAnalytics,
    getTeacherAnalytics,
    getSystemAnalytics
};