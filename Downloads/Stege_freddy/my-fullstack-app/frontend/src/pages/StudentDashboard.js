import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHistory, useLocation } from 'react-router-dom';
import { enrollmentService, assignmentService, submissionService, gradeService } from '../services/api';
import './StudentDashboardNew.css';

const StudentDashboard = () => {
  const { user } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États des données
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Statistiques calculées
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    pendingAssignments: 0,
    submittedAssignments: 0,
    averageGrade: 0,
    unreadNotifications: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Recharger les données quand on navigue vers le dashboard
  useEffect(() => {
    if (location.pathname === '/student' || location.pathname === '/dashboard' || location.pathname === '/') {
      console.log('🔄 Navigation vers dashboard étudiant - rechargement des données');
      
      // Vérifier s'il y a eu une inscription récente
      const recentEnrollment = localStorage.getItem('recentEnrollment');
      const enrollmentTime = localStorage.getItem('enrollmentTime');
      
      if (recentEnrollment) {
        console.log('🆕 Inscription récente détectée - rechargement forcé des statistiques');
        localStorage.removeItem('recentEnrollment'); // Nettoyer le flag
        localStorage.removeItem('enrollmentTime');
        
        // Forcer un rechargement complet avec un délai pour être sûr que les données sont à jour
        setTimeout(() => {
          loadDashboardData();
        }, 500);
      } else {
        loadDashboardData();
      }
    }
  }, [location.pathname]);

  // Recharger les données quand la page devient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 Page visible - rechargement des données du dashboard');
        loadDashboardData();
      }
    };

    const handleFocus = () => {
      console.log('🔄 Page focus - rechargement des données du dashboard');
      loadDashboardData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les vraies données depuis les APIs
      const [enrollmentsResponse, assignmentsResponse, submissionsResponse, gradesResponse] = await Promise.all([
        enrollmentService.getByStudent(user.id),
        assignmentService.getAll(),
        submissionService.getByStudent(user.id),
        gradeService.getAll()
      ]);

      console.log('📊 Réponses API:', {
        enrollments: enrollmentsResponse,
        assignments: assignmentsResponse,
        submissions: submissionsResponse,
        grades: gradesResponse
      });

      // Normaliser les données selon les différents formats de réponse
      const enrollments = Array.isArray(enrollmentsResponse) ? enrollmentsResponse : (enrollmentsResponse.data || []);
      const allAssignments = assignmentsResponse.data || assignmentsResponse || [];
      const submissions = submissionsResponse.data || submissionsResponse || [];
      const grades = gradesResponse.data || gradesResponse || [];

      console.log('📋 Données normalisées:', {
        enrollments: enrollments,
        assignments: allAssignments,
        submissions: submissions,
        grades: grades
      });

      // Filtrer les devoirs selon les cours auxquels l'étudiant est inscrit
      const enrolledCourseIds = enrollments.map(e => e.courseId);
      const studentAssignments = allAssignments.filter(a => enrolledCourseIds.includes(a.courseId));

      // Les soumissions et grades sont déjà filtrés par l'API ou dans la normalisation
      setEnrollments(enrollments);
      setAssignments(studentAssignments);
      setSubmissions(submissions);
      setGrades(grades);
      setNotifications([]); // Pas de notifications pour l'instant

      // Calculer les statistiques
      calculateStats(enrollments, studentAssignments, submissions, grades, []);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (enrollments, assignments, submissions, grades, notifications) => {
    // Les données sont déjà normalisées, pas besoin d'extraire .data
    const enrollmentsArray = Array.isArray(enrollments) ? enrollments : [];
    const assignmentsArray = Array.isArray(assignments) ? assignments : [];
    const submissionsArray = Array.isArray(submissions) ? submissions : [];
    const gradesArray = Array.isArray(grades) ? grades : [];
    const notificationsArray = Array.isArray(notifications) ? notifications : [];
    
    console.log('📊 Calcul des statistiques:', {
      enrollments: enrollmentsArray.length,
      assignments: assignmentsArray.length,
      submissions: submissionsArray.length,
      grades: gradesArray.length
    });
    
    const submittedIds = submissionsArray.map(s => s.assignmentId);
    const pendingAssignments = assignmentsArray.filter(a => !submittedIds.includes(a.id));
    
    const totalGrades = gradesArray.reduce((sum, grade) => sum + parseFloat(grade.value || grade.grade || 0), 0);
    const averageGrade = gradesArray.length > 0 ? (totalGrades / gradesArray.length).toFixed(1) : 0;
    
    const unreadNotifications = notificationsArray.filter(n => !n.isRead).length;

    setStats({
      enrolledCourses: enrollmentsArray.length,
      pendingAssignments: pendingAssignments.length,
      submittedAssignments: submissionsArray.length,
      averageGrade: averageGrade,
      unreadNotifications: unreadNotifications
    });
  };

  const forceRefresh = () => {
    console.log('🔄 Rechargement forcé du dashboard');
    loadDashboardData();
  };

  const handleSubmitAssignment = async (assignmentId) => {
    try {
      // Rediriger vers la page des devoirs
      history.push('/assignments');
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
    }
  };

  const handleViewSubmission = async (submissionId) => {
    try {
      // Rediriger vers la page des devoirs pour voir les soumissions
      history.push('/assignments');
    } catch (err) {
      console.error('Erreur lors de la visualisation:', err);
    }
  };

  const handleViewCourse = (courseId) => {
    history.push('/courses');
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await api.notification.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      // Recalculer les stats
      const updatedNotifications = Array.isArray(notifications) ? notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      ) : [];
      setStats(prev => ({
        ...prev,
        unreadNotifications: updatedNotifications.filter(n => !n.isRead).length
      }));
    } catch (err) {
      console.error('Erreur lors du marquage de la notification:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeColor = (grade) => {
    const value = parseFloat(grade);
    if (value >= 16) return 'excellent';
    if (value >= 14) return 'good';
    if (value >= 10) return 'average';
    return 'below-average';
  };

  if (loading) {
    return (
      <div className="student-dashboard-loading">
        <div className="loading-spinner"></div>
        Chargement de votre tableau de bord...
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-dashboard-error">
        <h2>❌ {error}</h2>
        <button onClick={loadDashboardData} className="btn btn-primary">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Tableau de Bord Étudiant</h1>
          <p>Bienvenue, {user?.firstName} {user?.lastName}</p>
        </div>
        <div className="dashboard-actions">
          <button onClick={loadDashboardData} className="btn btn-outline">
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Navigation rapide */}
      <div className="quick-navigation">
        <button 
          onClick={() => history.push('/courses')} 
          className="nav-btn courses"
        >
          <span className="nav-icon">📚</span>
          <span className="nav-text">Consulter Cours</span>
        </button>
        <button 
          onClick={() => history.push('/assignments')} 
          className="nav-btn assignments"
        >
          <span className="nav-icon">📝</span>
          <span className="nav-text">Soumettre Devoirs</span>
        </button>
        <button 
          onClick={() => history.push('/grades')} 
          className="nav-btn grades"
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">Voir Notes</span>
        </button>
        <button 
          onClick={() => history.push('/calendar')} 
          className="nav-btn calendar"
        >
          <span className="nav-icon">📅</span>
          <span className="nav-text">Calendrier</span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="student-stats">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>{stats.enrolledCourses}</h3>
            <p>Cours suivis</p>
          </div>
        </div>
        
        <div className={`stat-card ${stats.pendingAssignments > 0 ? 'urgent' : ''}`}>
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.pendingAssignments}</h3>
            <p>Devoirs en attente</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.submittedAssignments}</h3>
            <p>Devoirs soumis</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{stats.averageGrade}/20</h3>
            <p>Moyenne générale</p>
          </div>
        </div>
        
        <div className={`stat-card ${stats.unreadNotifications > 0 ? 'urgent' : ''}`}>
          <div className="stat-icon">🔔</div>
          <div className="stat-content">
            <h3>{stats.unreadNotifications}</h3>
            <p>Notifications</p>
          </div>
        </div>
      </div>

      {/* Section Mes Cours Inscrits */}
      <div className="dashboard-section courses-enrolled">
        <h2>📚 Mes Cours Inscrits</h2>
        {console.log('🔍 État dans le template:', { enrollments, assignments, submissions })}
        {Array.isArray(enrollments) && enrollments.length > 0 ? (
          <div className="courses-grid">
            {enrollments.map(enrollment => {
              console.log('🎯 Traitement inscription:', enrollment);
              const courseAssignments = assignments.filter(a => a.courseId === enrollment.courseId);
              const submittedAssignments = courseAssignments.filter(a => 
                submissions.find(s => s.assignmentId === a.id)
              );
              const pendingAssignments = courseAssignments.filter(a => 
                !submissions.find(s => s.assignmentId === a.id)
              );

              console.log('📋 Devoirs du cours:', {
                courseId: enrollment.courseId,
                totalAssignments: courseAssignments.length,
                submitted: submittedAssignments.length,
                pending: pendingAssignments.length
              });

              return (
                <div key={enrollment.id} className="course-card">
                  <div className="course-header">
                    <h3>{enrollment.Course?.name}</h3>
                    <span className="course-status active">✅ Inscrit</span>
                  </div>
                  
                  <div className="course-stats">
                    <div className="course-stat">
                      <span className="stat-number">{courseAssignments.length}</span>
                      <span className="stat-label">Total devoirs</span>
                    </div>
                    <div className="course-stat submitted">
                      <span className="stat-number">{submittedAssignments.length}</span>
                      <span className="stat-label">Soumis</span>
                    </div>
                    <div className="course-stat pending">
                      <span className="stat-number">{pendingAssignments.length}</span>
                      <span className="stat-label">À faire</span>
                    </div>
                  </div>

                  {courseAssignments.length > 0 && (
                    <div className="course-assignments-preview">
                      <h4>Devoirs récents :</h4>
                      {courseAssignments.slice(0, 3).map(assignment => {
                        const isSubmitted = submissions.find(s => s.assignmentId === assignment.id);
                        return (
                          <div key={assignment.id} className={`assignment-preview ${isSubmitted ? 'submitted' : 'pending'}`}>
                            <span className="assignment-title">{assignment.title}</span>
                            <span className={`assignment-status ${isSubmitted ? 'submitted' : 'pending'}`}>
                              {isSubmitted ? '✅ Soumis' : '⏳ À faire'}
                            </span>
                          </div>
                        );
                      })}
                      {courseAssignments.length > 3 && (
                        <p className="more-assignments">
                          +{courseAssignments.length - 3} autres devoirs...
                        </p>
                      )}
                    </div>
                  )}
                  
                  <div className="course-actions">
                    <button 
                      onClick={() => history.push('/assignments')}
                      className="btn btn-outline"
                    >
                      Voir les devoirs
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Vous n'êtes inscrit à aucun cours pour le moment</p>
            <button onClick={() => history.push('/courses')} className="btn btn-primary">
              Explorer les cours
            </button>
          </div>
        )}
      </div>

      {/* Grille principale */}
      <div className="dashboard-grid">
        {/* Devoirs à faire */}
        <div className="dashboard-section">
          <h2>📝 Devoirs à Faire</h2>
          {Array.isArray(assignments) && Array.isArray(submissions) && 
           assignments.filter(a => !submissions.find(s => s.assignmentId === a.id)).length > 0 ? (
            <div className="assignments-list">
              {assignments
                .filter(a => !submissions.find(s => s.assignmentId === a.id))
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 5)
                .map(assignment => (
                  <div key={assignment.id} className="assignment-card pending">
                    <div className="assignment-header">
                      <h4>{assignment.title}</h4>
                      <div className="assignment-due">
                        {new Date(assignment.dueDate) < new Date() ? (
                          <span className="status overdue">En retard</span>
                        ) : (
                          <span className="status pending">À faire</span>
                        )}
                      </div>
                    </div>
                    <p className="assignment-course">{assignment.Course?.name}</p>
                    <p className="assignment-description">{assignment.description}</p>
                    <div className="assignment-meta">
                      <span>📅 Échéance: {formatDate(assignment.dueDate)}</span>
                      <span>📊 Points: {assignment.maxPoints}</span>
                    </div>
                    <div className="assignment-actions">
                      <button 
                        onClick={() => handleSubmitAssignment(assignment.id)}
                        className="btn btn-primary"
                      >
                        Soumettre le devoir
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>🎉 Aucun devoir en attente !</p>
            </div>
          )}
        </div>

        {/* Mes cours */}
        <div className="dashboard-section">
          <h2>📚 Mes Cours</h2>
          {Array.isArray(enrollments) && enrollments.length > 0 ? (
            <div className="courses-list">
              {enrollments.slice(0, 4).map(enrollment => (
                <div key={enrollment.id} className="course-card">
                  <div className="course-header">
                    <h3>{enrollment.Course?.name}</h3>
                    <span className="course-code">{enrollment.Course?.code}</span>
                  </div>
                  <p className="course-description">{enrollment.Course?.description}</p>
                  <div className="course-meta">
                    <span>👨‍🏫 {enrollment.Course?.User?.firstName} {enrollment.Course?.User?.lastName}</span>
                    <span>📅 {enrollment.Course?.semester}</span>
                  </div>
                  <div className="course-actions">
                    <button 
                      onClick={() => handleViewCourse(enrollment.Course?.id)}
                      className="btn btn-outline"
                    >
                      Voir le cours
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Aucun cours inscrit pour le moment</p>
            </div>
          )}
        </div>

        {/* Dernières notes */}
        <div className="dashboard-section">
          <h2>🎯 Dernières Notes</h2>
          {Array.isArray(grades) && grades.length > 0 ? (
            <div className="grades-list">
              {grades
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map(grade => (
                  <div key={grade.id} className={`grade-card ${getGradeColor(grade.value)}`}>
                    <div className="grade-header">
                      <h4>{grade.Assignment?.title}</h4>
                      <div className={`grade-value ${getGradeColor(grade.value)}`}>
                        {grade.value}/20
                      </div>
                    </div>
                    <p className="grade-course">{grade.Assignment?.Course?.name}</p>
                    {grade.feedback && (
                      <p className="grade-feedback">💬 {grade.feedback}</p>
                    )}
                    <p className="grade-date">📅 {formatDate(grade.createdAt)}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Aucune note disponible pour le moment</p>
            </div>
          )}
        </div>

        {/* Notifications récentes */}
        <div className="dashboard-section">
          <h2>🔔 Notifications Récentes</h2>
          {Array.isArray(notifications) && notifications.length > 0 ? (
            <div className="notifications-list">
              {notifications
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-card ${!notification.isRead ? 'unread' : ''}`}
                  >
                    <div className="notification-header">
                      <h4>{notification.title}</h4>
                      {!notification.isRead && (
                        <button 
                          onClick={() => handleMarkNotificationRead(notification.id)}
                          className="btn-mark-read"
                        >
                          ✓
                        </button>
                      )}
                    </div>
                    <p className="notification-message">{notification.message}</p>
                    <p className="notification-date">{formatDate(notification.createdAt)}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Aucune notification</p>
            </div>
          )}
        </div>
      </div>

      {/* Section progression */}
      <div className="dashboard-section full-width">
        <h2>📈 Ma Progression</h2>
        <div className="progress-summary">
          <div className="progress-item">
            <div className="progress-label">Cours terminés</div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{width: `${Array.isArray(enrollments) && enrollments.length > 0 ? (enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100 : 0}%`}}
              ></div>
            </div>
            <div className="progress-value">
              {Array.isArray(enrollments) ? enrollments.filter(e => e.status === 'completed').length : 0} / {Array.isArray(enrollments) ? enrollments.length : 0}
            </div>
          </div>
          
          <div className="progress-item">
            <div className="progress-label">Devoirs soumis</div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{width: `${assignments.length > 0 ? (submissions.length / assignments.length) * 100 : 0}%`}}
              ></div>
            </div>
            <div className="progress-value">
              {submissions.length} / {assignments.length}
            </div>
          </div>
          
          <div className="progress-item">
            <div className="progress-label">Moyenne générale</div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{width: `${(stats.averageGrade / 20) * 100}%`}}
              ></div>
            </div>
            <div className="progress-value">
              {stats.averageGrade} / 20
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;