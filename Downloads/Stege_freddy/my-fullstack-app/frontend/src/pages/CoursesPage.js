import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useHistory } from 'react-router-dom';
import { courseService, enrollmentService } from '../services/api';
import './CoursesPage.css';

const CoursesPage = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user.role === 'teacher') {
        // Charger les cours de l'enseignant
        const response = await courseService.getAll();
        // Filtrer par professeur
        const teacherCourses = response.data?.filter(course => course.teacherId === user.id) || [];
        setCourses(teacherCourses);
      } else if (user.role === 'student') {
        // Charger tous les cours et les inscriptions de l'étudiant
        const [coursesResponse, enrollmentsResponse] = await Promise.all([
          courseService.getAll(),
          enrollmentService.getByStudent(user.id)
        ]);
        
        setCourses(coursesResponse.data || []);
        setEnrollments(enrollmentsResponse.data || []);
      } else {
        // Admin - charger tous les cours
        const response = await courseService.getAll();
        setCourses(response.data || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des cours:', err);
      setError('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId) => {
    try {
      console.log('🔄 Tentative d\'inscription au cours:', courseId);
      console.log('👤 Utilisateur:', user);
      
      const response = await enrollmentService.create({
        studentId: user.id,
        courseId: courseId
      });
      
      console.log('📥 Réponse inscription:', response);
      
      if (response.success) {
        // Marquer qu'il y a eu une inscription récente pour forcer le rechargement
        localStorage.setItem('recentEnrollment', 'true');
        localStorage.setItem('enrollmentTime', Date.now().toString());
        
        // Afficher un message de succès
        alert('✅ Inscription réussie ! Vos statistiques vont être mises à jour...');
        
        // Rediriger vers le dashboard étudiant
        history.push('/student');
        
        // Forcer le rechargement de la page après un court délai
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        alert(response.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      console.error('❌ Erreur lors de l\'inscription:', err);
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert('Erreur lors de l\'inscription');
      }
    }
  };

  const isEnrolled = (courseId) => {
    return enrollments.some(enrollment => enrollment.courseId === courseId);
  };

  const handleEditCourse = async (course) => {
    const newTitle = prompt('Nouveau titre du cours:', course.title);
    if (!newTitle) return;
    
    const newDescription = prompt('Nouvelle description:', course.description);
    if (!newDescription) return;
    
    const newCredits = prompt('Nombre de crédits:', course.credits);
    if (!newCredits) return;
    
    try {
      const response = await courseService.update(course.id, {
        title: newTitle,
        description: newDescription,
        credits: parseInt(newCredits),
        semester: course.semester,
        teacherId: course.teacherId
      });
      
      if (response.success) {
        alert('Cours modifié avec succès!');
        loadCourses();
      } else {
        alert(response.message || 'Erreur lors de la modification');
      }
    } catch (err) {
      console.error('Erreur modification cours:', err);
      alert('Erreur lors de la modification du cours');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours?')) {
      return;
    }
    
    try {
      const response = await courseService.delete(courseId);
      
      if (response.success) {
        alert('Cours supprimé avec succès!');
        loadCourses();
      } else {
        alert(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Erreur suppression cours:', err);
      alert('Erreur lors de la suppression du cours');
    }
  };

  if (loading) {
    return (
      <div className="courses-page">
        <div className="loading">Chargement des cours...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courses-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <div className="page-header">
        <h1>
          {user.role === 'teacher' ? 'Mes Cours' : 
           user.role === 'student' ? 'Cours Disponibles' : 
           'Tous les Cours'}
        </h1>
        <p>
          {user.role === 'teacher' ? 'Gérez vos cours et assignments' : 
           user.role === 'student' ? 'Découvrez et rejoignez des cours' : 
           'Vue d\'ensemble de tous les cours'}
        </p>
      </div>

      <div className="courses-grid">
        {Array.isArray(courses) && courses.length > 0 ? (
          courses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-header">
                <h3>{course.name || course.title}</h3>
                <span className="course-code">{course.code}</span>
              </div>
              
              <div className="course-content">
                <p className="course-description">{course.description}</p>
                
                <div className="course-meta">
                  <div className="meta-item">
                    <span className="meta-label">Semestre:</span>
                    <span className="meta-value">{course.semester}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Crédits:</span>
                    <span className="meta-value">{course.credits || 3}</span>
                  </div>
                  {course.teacher && (
                    <div className="meta-item">
                      <span className="meta-label">Enseignant:</span>
                      <span className="meta-value">
                        {course.teacher.firstName} {course.teacher.lastName}
                      </span>
                    </div>
                  )}
                </div>

                {course.assignments && course.assignments.length > 0 && (
                  <div className="course-assignments">
                    <h4>Devoirs ({course.assignments.length})</h4>
                    <ul>
                      {course.assignments.slice(0, 3).map(assignment => (
                        <li key={assignment.id}>{assignment.title}</li>
                      ))}
                      {course.assignments.length > 3 && (
                        <li>... et {course.assignments.length - 3} de plus</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="course-actions">
                {user.role === 'student' && (
                  <>
                    {isEnrolled(course.id) ? (
                      <span className="enrolled-badge">✓ Inscrit</span>
                    ) : (
                      <button 
                        className="btn btn-primary"
                        onClick={() => enrollInCourse(course.id)}
                      >
                        S'inscrire
                      </button>
                    )}
                  </>
                )}
                
                {user.role === 'teacher' && (
                  <div className="teacher-actions">
                    <button className="btn btn-secondary">
                      Gérer le cours
                    </button>
                    <button className="btn btn-primary">
                      Voir les étudiants
                    </button>
                  </div>
                )}

                {user.role === 'admin' && (
                  <div className="admin-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleEditCourse(course)}
                    >
                      Modifier
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-courses">
            <h3>Aucun cours disponible</h3>
            <p>
              {user.role === 'teacher' 
                ? 'Vous n\'avez pas encore de cours assignés.' 
                : 'Aucun cours n\'est actuellement disponible.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesPage;