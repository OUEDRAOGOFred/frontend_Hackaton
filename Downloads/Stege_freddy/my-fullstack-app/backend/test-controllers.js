// Test d'import des contrôleurs
console.log('=== Test des imports des contrôleurs ===');

try {
    console.log('1. Test authController...');
    const authController = require('./src/controllers/authControllerNew');
    console.log('✅ authController:', Object.keys(authController));
    console.log('Type register:', typeof authController.register);
} catch (error) {
    console.error('❌ Erreur authController:', error.message);
}

try {
    console.log('\n2. Test courseController...');
    const courseController = require('./src/controllers/courseControllerNew');
    console.log('✅ courseController:', Object.keys(courseController));
    console.log('Type getAllCourses:', typeof courseController.getAllCourses);
} catch (error) {
    console.error('❌ Erreur courseController:', error.message);
}

try {
    console.log('\n3. Test enrollmentController...');
    const enrollmentController = require('./src/controllers/enrollmentController');
    console.log('✅ enrollmentController:', Object.keys(enrollmentController));
} catch (error) {
    console.error('❌ Erreur enrollmentController:', error.message);
}

try {
    console.log('\n4. Test assignmentController...');
    const assignmentController = require('./src/controllers/assignmentControllerNew');
    console.log('✅ assignmentController:', Object.keys(assignmentController));
} catch (error) {
    console.error('❌ Erreur assignmentController:', error.message);
}

try {
    console.log('\n5. Test submissionController...');
    const submissionController = require('./src/controllers/submissionController');
    console.log('✅ submissionController:', Object.keys(submissionController));
} catch (error) {
    console.error('❌ Erreur submissionController:', error.message);
}

try {
    console.log('\n6. Test notificationController...');
    const notificationController = require('./src/controllers/notificationControllerNew');
    console.log('✅ notificationController:', Object.keys(notificationController));
} catch (error) {
    console.error('❌ Erreur notificationController:', error.message);
}

try {
    console.log('\n7. Test analyticsController...');
    const analyticsController = require('./src/controllers/analyticsController');
    console.log('✅ analyticsController:', Object.keys(analyticsController));
} catch (error) {
    console.error('❌ Erreur analyticsController:', error.message);
}

console.log('\n=== Test terminé ===');