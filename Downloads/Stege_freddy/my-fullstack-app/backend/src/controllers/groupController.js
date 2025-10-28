const { Group, User, GroupMember, Course, TokenTransaction, Notification } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * @desc    Obtenir tous les groupes
 * @route   GET /api/groups
 * @access  Authentifié
 */
exports.getGroups = async (req, res) => {
    try {
        const { courseId, status, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};
        if (courseId) whereClause.courseId = courseId;
        if (status) whereClause.status = status;

        // Si l'utilisateur est étudiant, ne montrer que les groupes de ses cours
        if (req.user.role === 'student') {
            const { CourseEnrollment } = require('../models');
            const enrolledCourses = await CourseEnrollment.findAll({
                where: { userId: req.user.id, status: 'active' },
                attributes: ['courseId']
            });
            const courseIds = enrolledCourses.map(e => e.courseId);
            whereClause.courseId = { [Op.in]: courseIds };
        }

        const { rows: groups, count } = await Group.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Course,
                    as: 'Course',
                    attributes: ['id', 'title', 'code']
                },
                {
                    model: User,
                    as: 'Leader',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                },
                {
                    model: GroupMember,
                    as: 'Members',
                    attributes: ['id', 'userId', 'status'],
                    include: [{
                        model: User,
                        as: 'User',
                        attributes: ['id', 'firstName', 'lastName', 'email']
                    }]
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        // Ajouter des statistiques pour chaque groupe
        const groupsWithStats = groups.map(group => {
            const activeMembers = group.Members ? group.Members.filter(m => m.status === 'active').length : 0;
            return {
                ...group.toJSON(),
                memberCount: activeMembers,
                hasSpots: group.maxMembers ? activeMembers < group.maxMembers : true
            };
        });

        res.json({
            success: true,
            groups: groupsWithStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(count / limit),
                totalGroups: count
            }
        });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des groupes',
            error: error.message
        });
    }
};

/**
 * @desc    Créer un nouveau groupe
 * @route   POST /api/groups
 * @access  Étudiant/Professeur/Admin
 */
exports.createGroup = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Données invalides',
                errors: errors.array()
            });
        }

        const { name, description, courseId, maxMembers } = req.body;
        const userId = req.user.id;

        // Vérifier que le cours existe
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Cours non trouvé'
            });
        }

        // Vérifier que l'utilisateur est inscrit au cours (si étudiant)
        if (req.user.role === 'student') {
            const { CourseEnrollment } = require('../models');
            const enrollment = await CourseEnrollment.findOne({
                where: { courseId, userId, status: 'active' }
            });

            if (!enrollment) {
                return res.status(403).json({
                    success: false,
                    message: 'Vous devez être inscrit au cours pour créer un groupe'
                });
            }
        }

        // Créer le groupe
        const group = await Group.create({
            name,
            description,
            courseId,
            leaderId: userId,
            maxMembers: maxMembers || 5,
            status: 'active'
        });

        // Ajouter le créateur comme membre
        await GroupMember.create({
            groupId: group.id,
            userId,
            status: 'active',
            role: 'leader'
        });

        // Attribuer des tokens pour la création de groupe
        await TokenTransaction.create({
            userId,
            type: 'group_created',
            amount: 25,
            description: `Création du groupe: ${name}`,
            metadata: { groupId: group.id }
        });

        const groupWithDetails = await Group.findByPk(group.id, {
            include: [
                {
                    model: Course,
                    as: 'Course',
                    attributes: ['id', 'title', 'code']
                },
                {
                    model: User,
                    as: 'Leader',
                    attributes: ['id', 'firstName', 'lastName']
                },
                {
                    model: GroupMember,
                    as: 'Members',
                    include: [{
                        model: User,
                        as: 'User',
                        attributes: ['id', 'firstName', 'lastName']
                    }]
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Groupe créé avec succès',
            group: groupWithDetails
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du groupe',
            error: error.message
        });
    }
};

/**
 * @desc    Rejoindre un groupe
 * @route   POST /api/groups/:id/join
 * @access  Étudiant
 */
exports.joinGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Vérifier que l'utilisateur est un étudiant
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Seuls les étudiants peuvent rejoindre des groupes'
            });
        }

        // Vérifier que le groupe existe
        const group = await Group.findByPk(id, {
            include: [
                {
                    model: Course,
                    as: 'Course',
                    attributes: ['id', 'title']
                },
                {
                    model: GroupMember,
                    as: 'Members',
                    where: { status: 'active' },
                    required: false
                }
            ]
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Groupe non trouvé'
            });
        }

        if (group.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Ce groupe n\'est pas ouvert aux nouveaux membres'
            });
        }

        // Vérifier que l'étudiant est inscrit au cours
        const { CourseEnrollment } = require('../models');
        const enrollment = await CourseEnrollment.findOne({
            where: { courseId: group.courseId, userId, status: 'active' }
        });

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'Vous devez être inscrit au cours pour rejoindre ce groupe'
            });
        }

        // Vérifier que l'étudiant n'est pas déjà membre
        const existingMember = await GroupMember.findOne({
            where: { groupId: id, userId }
        });

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'Vous êtes déjà membre de ce groupe'
            });
        }

        // Vérifier la capacité maximale
        const currentMembers = group.Members ? group.Members.length : 0;
        if (currentMembers >= group.maxMembers) {
            return res.status(400).json({
                success: false,
                message: 'Ce groupe a atteint sa capacité maximale'
            });
        }

        // Ajouter le membre
        const membership = await GroupMember.create({
            groupId: id,
            userId,
            status: 'active',
            role: 'member'
        });

        // Attribuer des tokens
        await TokenTransaction.create({
            userId,
            type: 'group_joined',
            amount: 15,
            description: `Adhésion au groupe: ${group.name}`,
            metadata: { groupId: id }
        });

        // Notification au leader du groupe
        await Notification.create({
            userId: group.leaderId,
            type: 'group_member_joined',
            title: 'Nouveau membre',
            message: `${req.user.firstName} ${req.user.lastName} a rejoint votre groupe "${group.name}"`,
            metadata: { groupId: id, newMemberId: userId }
        });

        res.status(201).json({
            success: true,
            message: 'Vous avez rejoint le groupe avec succès',
            membership
        });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'adhésion au groupe',
            error: error.message
        });
    }
};

/**
 * @desc    Quitter un groupe
 * @route   DELETE /api/groups/:id/leave
 * @access  Étudiant
 */
exports.leaveGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Vérifier que le membre existe
        const membership = await GroupMember.findOne({
            where: { groupId: id, userId, status: 'active' },
            include: [{
                model: Group,
                as: 'Group',
                attributes: ['id', 'name', 'leaderId']
            }]
        });

        if (!membership) {
            return res.status(404).json({
                success: false,
                message: 'Vous n\'êtes pas membre de ce groupe'
            });
        }

        // Vérifier si l'utilisateur est le leader
        if (membership.Group.leaderId === userId) {
            // Compter les autres membres
            const otherMembers = await GroupMember.count({
                where: { 
                    groupId: id, 
                    userId: { [Op.ne]: userId },
                    status: 'active' 
                }
            });

            if (otherMembers > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'En tant que leader, vous devez d\'abord transférer le leadership ou dissoudre le groupe'
                });
            }
        }

        // Supprimer le membre
        await membership.update({ status: 'left' });

        // Si c'était le leader et qu'il n'y a plus de membres, marquer le groupe comme inactif
        if (membership.Group.leaderId === userId) {
            await Group.update(
                { status: 'inactive' },
                { where: { id } }
            );
        }

        // Notification aux autres membres
        const activeMembers = await GroupMember.findAll({
            where: { groupId: id, status: 'active' }
        });

        const notifications = activeMembers.map(member => ({
            userId: member.userId,
            type: 'group_member_left',
            title: 'Membre parti',
            message: `${req.user.firstName} ${req.user.lastName} a quitté le groupe "${membership.Group.name}"`,
            metadata: { groupId: id, leftMemberId: userId }
        }));

        if (notifications.length > 0) {
            await Notification.bulkCreate(notifications);
        }

        res.json({
            success: true,
            message: 'Vous avez quitté le groupe avec succès'
        });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la sortie du groupe',
            error: error.message
        });
    }
};

/**
 * @desc    Obtenir les groupes d'un utilisateur
 * @route   GET /api/groups/my-groups
 * @access  Authentifié
 */
exports.getMyGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        const memberships = await GroupMember.findAll({
            where: { userId, status: 'active' },
            include: [
                {
                    model: Group,
                    as: 'Group',
                    include: [
                        {
                            model: Course,
                            as: 'Course',
                            attributes: ['id', 'title', 'code']
                        },
                        {
                            model: User,
                            as: 'Leader',
                            attributes: ['id', 'firstName', 'lastName']
                        },
                        {
                            model: GroupMember,
                            as: 'Members',
                            attributes: ['id', 'userId', 'role'],
                            where: { status: 'active' },
                            include: [{
                                model: User,
                                as: 'User',
                                attributes: ['id', 'firstName', 'lastName']
                            }]
                        }
                    ]
                }
            ]
        });

        const groups = memberships.map(membership => ({
            ...membership.Group.toJSON(),
            myRole: membership.role,
            memberCount: membership.Group.Members.length
        }));

        res.json({
            success: true,
            groups,
            totalGroups: groups.length
        });
    } catch (error) {
        console.error('Error fetching my groups:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de vos groupes',
            error: error.message
        });
    }
};