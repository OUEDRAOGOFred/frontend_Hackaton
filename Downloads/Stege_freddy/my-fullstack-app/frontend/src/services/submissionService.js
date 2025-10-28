import api from './api';

export const submissionService = {
    // Créer une nouvelle soumission
    create: async (submissionData) => {
        try {
            console.log('Envoi de soumission vers le backend:', submissionData);
            const response = await api.post('/submissions', submissionData);
            console.log('Réponse du backend pour soumission:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            if (error.response) {
                console.error('Données d\'erreur:', error.response.data);
                throw new Error(error.response.data.message || 'Erreur lors de la soumission');
            }
            throw new Error('Erreur réseau lors de la soumission');
        }
    },

    // Récupérer les soumissions d'un étudiant
    getByStudent: async (studentId) => {
        try {
            const response = await api.get(`/submissions?studentId=${studentId}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des soumissions:', error);
            throw error;
        }
    },

    // Récupérer une soumission spécifique
    getById: async (id) => {
        try {
            const response = await api.get(`/submissions/${id}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération de la soumission:', error);
            throw error;
        }
    },

    // Récupérer les soumissions d'un devoir
    getByAssignment: async (assignmentId) => {
        try {
            const response = await api.get(`/submissions?assignmentId=${assignmentId}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des soumissions du devoir:', error);
            throw error;
        }
    }
};

export default submissionService;