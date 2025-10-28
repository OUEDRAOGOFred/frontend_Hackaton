const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const { authMiddleware: protect, authorize } = require('../middleware/auth');

// Validation middleware
const updateValidation = [
    check('username').optional().notEmpty(),
    check('email').optional().isEmail(),
    check('roleId').optional().isNumeric(),
    check('isActive').optional().isBoolean()
];

// Routes
router.get('/', [protect, authorize('admin')], userController.getUsers);
router.get('/me', protect, userController.getProfile);
router.get('/:id', protect, userController.getUserById);
router.put('/:id', [protect, updateValidation], userController.updateUser);
router.delete('/:id', [protect, authorize('admin')], userController.deleteUser);

module.exports = router;