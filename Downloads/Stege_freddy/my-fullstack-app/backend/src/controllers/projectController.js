const { Project, User, Role } = require('../models');
const { validationResult } = require('express-validator');

/**
 * @desc    Create new project
 * @route   POST /api/projects
 * @access  Teacher, Admin
 */
exports.createProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, deadline } = req.body;

        const project = await Project.create({
            title,
            description,
            deadline,
            userId: req.user.id
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get all projects (with pagination and filters)
 * @route   GET /api/projects
 * @access  Private
 */
exports.getProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        let where = {};
        
        // Filter by status if provided
        if (req.query.status) {
            where.status = req.query.status;
        }

        // If user is not admin, show only their projects
        if (req.user.Role.name !== 'admin') {
            where.userId = req.user.id;
        }

        const { rows: projects, count } = await Project.findAndCountAll({
            where,
            include: [{
                model: User,
                attributes: ['username', 'email'],
                include: [{ model: Role, attributes: ['name'] }]
            }],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            projects,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalProjects: count
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id, {
            include: [{
                model: User,
                attributes: ['username', 'email'],
                include: [{ model: Role, attributes: ['name'] }]
            }]
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user has access to project
        if (req.user.Role.name !== 'admin' && project.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private
 */
exports.updateProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const project = await Project.findByPk(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user has access to update project
        if (req.user.Role.name !== 'admin' && project.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { title, description, status, deadline, isArchived } = req.body;

        const updatedProject = await project.update({
            title: title || project.title,
            description: description || project.description,
            status: status || project.status,
            deadline: deadline || project.deadline,
            isArchived: isArchived !== undefined ? isArchived : project.isArchived
        });

        res.json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user has access to delete project
        if (req.user.Role.name !== 'admin' && project.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await project.destroy();
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Archive project
 * @route   PUT /api/projects/:id/archive
 * @access  Private
 */
exports.archiveProject = async (req, res) => {
    try {
        const project = await Project.findByPk(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user has access to archive project
        if (req.user.Role.name !== 'admin' && project.userId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        project.isArchived = true;
        await project.save();

        res.json({ message: 'Project archived successfully' });
    } catch (error) {
        console.error('Archive project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};