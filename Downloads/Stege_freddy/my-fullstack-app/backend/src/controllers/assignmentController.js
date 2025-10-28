const { validationResult } = require('express-validator');

/**
 * @desc    Get all assignments for a student
 * @route   GET /api/assignments
 * @access  Private (Student)
 */
exports.getAssignments = async (req, res) => {
    try {
        // Dans une application réelle, nous récupérerions les données de la base de données
        // Pour l'instant, nous utilisons des données simulées
        const assignments = [
            {
                id: 1,
                title: 'Projet React Components',
                courseId: 1,
                courseName: 'Introduction à React',
                description: 'Créer 5 composants React réutilisables avec documentation',
                dueDate: '2025-10-15',
                status: 'pending',
                maxScore: 100,
                attachments: [
                    { id: 1, name: 'Assignment_Instructions.pdf', url: '#' }
                ]
            },
            {
                id: 2,
                title: 'API REST avec Express',
                courseId: 2,
                courseName: 'Node.js Avancé',
                description: 'Développer une API RESTful avec authentification JWT',
                dueDate: '2025-10-20',
                status: 'submitted',
                submittedDate: '2025-10-18',
                maxScore: 100,
                score: 92,
                feedback: 'Excellent travail! La documentation API pourrait être améliorée.',
                attachments: [
                    { id: 2, name: 'API_Project_Requirements.pdf', url: '#' }
                ]
            }
        ];
        
        res.status(200).json({ assignments });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Get assignment details
 * @route   GET /api/assignments/:id
 * @access  Private (Student)
 */
exports.getAssignmentDetails = async (req, res) => {
    try {
        const assignmentId = parseInt(req.params.id);
        
        // Données simulées
        const assignments = [
            {
                id: 1,
                title: 'Projet React Components',
                courseId: 1,
                courseName: 'Introduction à React',
                description: 'Créer 5 composants React réutilisables avec documentation complète.\n\nExigences:\n- Chaque composant doit être hautement personnalisable via props\n- Documentation avec exemples d\'utilisation\n- Tests unitaires\n- Styles modulaires',
                dueDate: '2025-10-15',
                status: 'pending',
                maxScore: 100,
                attachments: [
                    { id: 1, name: 'Assignment_Instructions.pdf', url: '#', size: '1.2 MB' },
                    { id: 2, name: 'Component_Examples.zip', url: '#', size: '3.5 MB' }
                ],
                submissions: []
            },
            {
                id: 2,
                title: 'API REST avec Express',
                courseId: 2,
                courseName: 'Node.js Avancé',
                description: 'Développer une API RESTful avec authentification JWT, validation des entrées et documentation Swagger.\n\nFonctionnalités requises:\n- CRUD complet pour au moins 3 ressources\n- Authentification JWT\n- Gestion des erreurs\n- Tests avec Jest\n- Documentation Swagger',
                dueDate: '2025-10-20',
                status: 'submitted',
                submittedDate: '2025-10-18',
                maxScore: 100,
                score: 92,
                feedback: 'Excellent travail! La documentation API pourrait être améliorée. Les tests sont très complets et la structure du code est propre.',
                attachments: [
                    { id: 3, name: 'API_Project_Requirements.pdf', url: '#', size: '850 KB' }
                ],
                submissions: [
                    { 
                        id: 1, 
                        date: '2025-10-18', 
                        files: [
                            { id: 1, name: 'project_submission.zip', url: '#', size: '4.7 MB' }
                        ],
                        comment: 'J\'ai implémenté toutes les fonctionnalités demandées.'
                    }
                ]
            }
        ];
        
        const assignment = assignments.find(a => a.id === assignmentId);
        
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        
        res.status(200).json({ assignment });
    } catch (error) {
        console.error('Get assignment details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Submit assignment
 * @route   POST /api/assignments/:id/submit
 * @access  Private (Student)
 */
exports.submitAssignment = async (req, res) => {
    try {
        const assignmentId = parseInt(req.params.id);
        const { files, comment } = req.body;
        
        // Validation
        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ message: 'Please upload at least one file' });
        }
        
        // Dans une application réelle, nous enregistrerions les données dans la base de données
        // et gèrerions le téléchargement des fichiers
        // Pour l'instant, nous simulons une réponse positive
        
        const submission = {
            id: Math.floor(Math.random() * 1000),
            date: new Date().toISOString().split('T')[0],
            files,
            comment
        };
        
        res.status(201).json({ 
            message: 'Assignment submitted successfully',
            submission
        });
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};