const express = require('express');
const router = express.Router();

// Import des middlewares
const { authMiddleware: auth, authorize } = require('../middleware/auth');

// Import des contrôleurs
const authController = require('../controllers/authControllerNew');
const courseController = require('../controllers/courseController');
const enrollmentController = require('../controllers/enrollmentController');
const assignmentController = require('../controllers/assignmentControllerNew');
const submissionController = require('../controllers/submissionController');
const notificationController = require('../controllers/notificationControllerNew');
const analyticsController = require('../controllers/analyticsController');

// Middleware de vérification des rôles
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé - Permissions insuffisantes'
            });
        }

        next();
    };
};

// ========== Routes d'authentification ==========
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/logout', auth, authController.logout);
router.get('/auth/profile', auth, authController.getProfile);
router.put('/auth/profile', auth, authController.updateProfile);
router.put('/auth/change-password', auth, authController.changePassword);

// ========== Routes des cours ==========
// Récupération des cours
router.get('/courses', auth, courseController.getAllCourses);
router.get('/courses/:id', auth, courseController.getCourseById);
router.get('/courses/teacher/:teacher_id', auth, courseController.getTeacherCourses);
router.get('/courses/:id/students', auth, checkRole(['admin', 'teacher']), courseController.getCourseStudents);

// Gestion des cours (admin et enseignants)
router.post('/courses', auth, checkRole(['admin', 'teacher']), courseController.createCourse);
router.put('/courses/:id', auth, checkRole(['admin', 'teacher']), courseController.updateCourse);
router.delete('/courses/:id', auth, checkRole(['admin']), courseController.deleteCourse);

// ========== Routes des inscriptions ==========
// Gestion des inscriptions
router.post('/enrollments', auth, enrollmentController.createEnrollment);
router.get('/enrollments/student/:student_id', auth, enrollmentController.getStudentEnrollments);
router.get('/enrollments/course/:course_id', auth, checkRole(['admin', 'teacher']), enrollmentController.getCourseEnrollments);
router.put('/enrollments/:id/status', auth, checkRole(['admin', 'teacher']), enrollmentController.updateEnrollmentStatus);
router.delete('/enrollments/:id', auth, checkRole(['admin', 'teacher']), enrollmentController.deleteEnrollment);

// ========== Routes des devoirs ==========
// Récupération des devoirs
router.get('/assignments', auth, assignmentController.getAssignments);
router.get('/assignments/:id', auth, assignmentController.getAssignmentById);

// Gestion des devoirs (admin et enseignants)
router.post('/assignments', auth, checkRole(['admin', 'teacher']), assignmentController.createAssignment);
router.put('/assignments/:id', auth, checkRole(['admin', 'teacher']), assignmentController.updateAssignment);
router.post('/assignments/:id/publish', auth, checkRole(['admin', 'teacher']), assignmentController.publishAssignment);
router.delete('/assignments/:id', auth, checkRole(['admin', 'teacher']), assignmentController.deleteAssignment);

// ========== Routes des soumissions ==========
// Gestion des soumissions (étudiants)
router.post('/submissions', auth, checkRole(['student', 'admin']), submissionController.createOrUpdateSubmission);
router.post('/submissions/:id/submit', auth, checkRole(['student', 'admin']), submissionController.submitAssignment);

// Récupération des soumissions
router.get('/assignments/:assignment_id/submissions', auth, checkRole(['admin', 'teacher']), submissionController.getAssignmentSubmissions);
router.get('/students/:student_id/submissions', auth, submissionController.getStudentSubmissions);

// ========== Routes des notes ==========
// Notation (admin et enseignants)
router.post('/grades', auth, checkRole(['admin', 'teacher']), submissionController.gradeSubmission);
router.get('/grades/student/:student_id', auth, submissionController.getStudentGrades);

// ========== Routes des notifications ==========
// Création de notifications
router.post('/notifications', auth, checkRole(['admin', 'teacher']), notificationController.createNotification);
router.post('/notifications/bulk', auth, checkRole(['admin', 'teacher']), notificationController.createBulkNotifications);
router.post('/notifications/system', auth, checkRole(['admin']), notificationController.createSystemNotification);

// Gestion des notifications utilisateur
router.get('/notifications/user/:user_id', auth, notificationController.getUserNotifications);
router.put('/notifications/:id/read', auth, notificationController.markAsRead);
router.put('/notifications/user/:user_id/mark-all-read', auth, notificationController.markAllAsRead);
router.delete('/notifications/:id', auth, notificationController.deleteNotification);
router.get('/notifications/stats/user/:user_id', auth, notificationController.getNotificationStats);

// ========== Routes d'analyses et statistiques ==========
// Tableau de bord général
router.get('/analytics/dashboard', auth, checkRole(['admin']), analyticsController.getDashboardStats);

// Analyses par entité
router.get('/analytics/course/:id', auth, checkRole(['admin', 'teacher']), analyticsController.getCourseAnalytics);
router.get('/analytics/student/:id', auth, analyticsController.getStudentAnalytics);
router.get('/analytics/teacher/:id', auth, checkRole(['admin', 'teacher']), analyticsController.getTeacherAnalytics);
router.get('/analytics/system', auth, checkRole(['admin']), analyticsController.getSystemAnalytics);

// ========== Routes de test et santé ==========
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API fonctionne correctement',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Middleware de gestion des erreurs 404
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} non trouvée`
    });
});

module.exports = router;