const authController = require('./authController');
const userController = require('./userController');
const projectController = require('./projectController');
const notificationController = require('./notificationController');
const tokenController = require('./tokenController');

module.exports = {
    auth: authController,
    user: userController,
    project: projectController,
    notification: notificationController,
    token: tokenController
};