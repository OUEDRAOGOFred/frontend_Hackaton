import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const api = {
  auth: {
    login: async (credentials) => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
    register: async (userData) => {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    }
  }
};

// Services individuels pour l'export nommé
export const courseService = {
  getAll: async () => {
    const response = await apiClient.get('/courses');
    return response.data;
  },
  create: async (courseData) => {
    const response = await apiClient.post('/courses', courseData);
    return response.data;
  },
  update: async (id, courseData) => {
    const response = await apiClient.put(`/courses/${id}`, courseData);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/courses/${id}`);
    return response.data;
  },
  getTeacherCourses: async (teacherId) => {
    const response = await apiClient.get(`/courses/teacher/${teacherId}`);
    return response.data;
  }
};

export const assignmentService = {
  getAll: async () => {
    const response = await apiClient.get('/assignments');
    return response.data;
  },
  create: async (assignmentData) => {
    const response = await apiClient.post('/assignments', assignmentData);
    return response.data;
  },
  update: async (id, assignmentData) => {
    const response = await apiClient.put(`/assignments/${id}`, assignmentData);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/assignments/${id}`);
    return response.data;
  },
  getAssignments: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await apiClient.get(`/assignments?${params}`);
    return response.data;
  }
};

export const analyticsService = {
  getStats: async () => {
    try {
      console.log('📊 Récupération des statistiques...');
      const response = await apiClient.get('/analytics/stats');
      console.log('✅ Statistiques récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      throw error;
    }
  },
  getChartData: async () => {
    try {
      console.log('📈 Récupération données graphiques...');
      const response = await apiClient.get('/analytics/charts');
      console.log('✅ Données graphiques récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération données graphiques:', error);
      throw error;
    }
  },
  getTeacherAnalytics: async (teacherId) => {
    try {
      console.log('👨‍🏫 Récupération analytiques enseignant ID:', teacherId);
      const response = await apiClient.get(`/analytics/teacher/${teacherId}`);
      console.log('✅ Analytiques enseignant récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération analytiques enseignant:', error);
      throw error;
    }
  }
};

export const submissionService = {
  getAll: async () => {
    try {
      console.log('📋 Récupération de toutes les soumissions...');
      const response = await apiClient.get('/submissions');
      console.log('✅ Soumissions récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération soumissions:', error);
      throw error;
    }
  },
  
  getByStudent: async (studentId) => {
    try {
      console.log('📋 Récupération soumissions étudiant ID:', studentId);
      const response = await apiClient.get(`/submissions?studentId=${studentId}`);
      console.log('✅ Soumissions étudiant récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération soumissions étudiant:', error);
      throw error;
    }
  },
  
  getByAssignment: async (assignmentId) => {
    try {
      console.log('📋 Récupération soumissions devoir ID:', assignmentId);
      const response = await apiClient.get(`/submissions/assignment/${assignmentId}`);
      console.log('✅ Soumissions devoir récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération soumissions devoir:', error);
      throw error;
    }
  },
  
  create: async (submissionData) => {
    try {
      console.log('📝 Envoi de soumission:', submissionData);
      const response = await apiClient.post('/submissions', submissionData);
      console.log('✅ Soumission envoyée avec succès:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur envoi soumission:', error);
      if (error.response) {
        console.error('Détails erreur:', error.response.data);
      }
      throw error;
    }
  },
  
  grade: async (submissionId, grade) => {
    try {
      console.log('📊 Attribution note:', { submissionId, grade });
      const response = await apiClient.put(`/submissions/${submissionId}/grade`, { grade });
      console.log('✅ Note attribuée:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur attribution note:', error);
      throw error;
    }
  }
};

export const gradeService = {
  getAll: async () => {
    const response = await apiClient.get('/grades');
    return response.data;
  },
  getGrades: async (params) => {
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');
    const response = await apiClient.get(`/grades?${queryString}`);
    return response.data;
  },
  create: async (gradeData) => {
    const response = await apiClient.post('/grades', gradeData);
    return response.data;
  },
  update: async (id, gradeData) => {
    const response = await apiClient.put(`/grades/${id}`, gradeData);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/grades/${id}`);
    return response.data;
  }
};

export const enrollmentService = {
  getAll: async () => {
    try {
      console.log('📋 Récupération de toutes les inscriptions...');
      const response = await apiClient.get('/enrollments');
      console.log('✅ Inscriptions récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération inscriptions:', error);
      throw error;
    }
  },
  getByStudent: async (studentId) => {
    try {
      console.log('📋 Récupération inscriptions étudiant ID:', studentId);
      const response = await apiClient.get(`/enrollments?studentId=${studentId}`);
      console.log('✅ Inscriptions étudiant récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération inscriptions étudiant:', error);
      throw error;
    }
  },
  getByCourse: async (courseId) => {
    try {
      console.log('📋 Récupération inscriptions cours ID:', courseId);
      const response = await apiClient.get(`/enrollments?courseId=${courseId}`);
      console.log('✅ Inscriptions cours récupérées:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération inscriptions cours:', error);
      throw error;
    }
  },
  create: async (enrollmentData) => {
    try {
      console.log('🔄 Création inscription:', enrollmentData);
      const response = await apiClient.post('/enrollments', enrollmentData);
      console.log('✅ Inscription créée:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création inscription:', error);
      throw error;
    }
  },
  delete: async (id) => {
    try {
      console.log('🗑️ Suppression inscription ID:', id);
      const response = await apiClient.delete(`/enrollments/${id}`);
      console.log('✅ Inscription supprimée:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur suppression inscription:', error);
      throw error;
    }
  }
};

export const userService = {
  getAll: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },
  getById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },
  create: async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },
  update: async (id, userData) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  }
};

export const projectService = {
  getAll: async () => {
    const response = await apiClient.get('/projects');
    return response.data;
  },
  create: async (projectData) => {
    const response = await apiClient.post('/projects', projectData);
    return response.data;
  },
  update: async (id, projectData) => {
    const response = await apiClient.put(`/projects/${id}`, projectData);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/projects/${id}`);
    return response.data;
  }
};

export const tokenService = {
  getAll: async () => {
    const response = await apiClient.get('/tokens');
    return response.data;
  },
  create: async (tokenData) => {
    const response = await apiClient.post('/tokens', tokenData);
    return response.data;
  },
  revoke: async (id) => {
    const response = await apiClient.delete(`/tokens/${id}`);
    return response.data;
  }
};

export const notificationService = {
  getAll: async () => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },
  delete: async (id) => {
    const response = await apiClient.delete(`/notifications/${id}`);
    return response.data;
  }
};

export default api;
