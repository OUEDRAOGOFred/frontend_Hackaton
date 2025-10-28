import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { gradeService, assignmentService, courseService } from '../services/api';
import './GradesPage.css';

const GradesPage = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [stats, setStats] = useState({
    average: 0,
    totalPoints: 0,
    maxPoints: 0,
    gradeCount: 0
  });

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [grades, selectedCourse]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les données selon le rôle
      if (user.role === 'student') {
        await loadStudentData();
      } else if (user.role === 'teacher') {
        await loadTeacherData();
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentData = async () => {
    // Charger les notes de l'étudiant
    const gradesResponse = await gradeService.getAll();
    const studentGrades = gradesResponse.data?.filter(g => g.studentId === user.id) || [];
    setGrades(studentGrades);

    // Charger les devoirs pour avoir les détails
    const assignmentsResponse = await assignmentService.getAll();
    setAssignments(assignmentsResponse.data || []);

    // Charger les cours
    const coursesResponse = await courseService.getAll();
    setCourses(coursesResponse.data || []);
  };

  const loadTeacherData = async () => {
    // Pour un prof, charger toutes les notes de ses devoirs
    const assignmentsResponse = await assignmentService.getAssignments({ teacher_id: user.id });
    const teacherAssignments = assignmentsResponse.data || [];
    setAssignments(teacherAssignments);

    // Charger toutes les notes liées à ces devoirs
    const gradesResponse = await gradeService.getAll();
    const relevantGrades = gradesResponse.data?.filter(g => 
      teacherAssignments.some(a => a.id === g.assignmentId)
    ) || [];
    setGrades(relevantGrades);

    // Charger les cours du prof
    const coursesResponse = await courseService.getAll();
    const teacherCourses = coursesResponse.data?.filter(c => c.teacherId === user.id) || [];
    setCourses(teacherCourses);
  };

  const calculateStats = () => {
    let filteredGrades = grades;
    
    if (selectedCourse !== 'all') {
      const courseAssignments = assignments.filter(a => a.courseId === parseInt(selectedCourse));
      filteredGrades = grades.filter(g => 
        courseAssignments.some(a => a.id === g.assignmentId)
      );
    }

    if (filteredGrades.length === 0) {
      setStats({ average: 0, totalPoints: 0, maxPoints: 0, gradeCount: 0 });
      return;
    }

    const totalPoints = filteredGrades.reduce((sum, grade) => sum + grade.points, 0);
    const maxPoints = filteredGrades.reduce((sum, grade) => {
      const assignment = assignments.find(a => a.id === grade.assignmentId);
      return sum + (assignment?.maxPoints || 0);
    }, 0);

    setStats({
      average: maxPoints > 0 ? ((totalPoints / maxPoints) * 20).toFixed(1) : 0,
      totalPoints,
      maxPoints,
      gradeCount: filteredGrades.length
    });
  };

  const getAssignmentDetails = (assignmentId) => {
    return assignments.find(a => a.id === assignmentId) || {};
  };

  const getCourseDetails = (courseId) => {
    return courses.find(c => c.id === courseId) || {};
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGradeColor = (points, maxPoints) => {
    const percentage = (points / maxPoints) * 100;
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'average';
    return 'poor';
  };

  const filteredGrades = selectedCourse === 'all' 
    ? grades 
    : grades.filter(g => {
        const assignment = getAssignmentDetails(g.assignmentId);
        return assignment.courseId === parseInt(selectedCourse);
      });

  if (loading) {
    return (
      <div className="grades-page">
        <div className="loading">Chargement des notes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grades-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="grades-page">
      <div className="page-header">
        <h1>
          {user.role === 'student' ? 'Mes Notes' : 'Notes des Étudiants'}
        </h1>
        <p>
          {user.role === 'student' 
            ? 'Consultez vos résultats et votre progression'
            : 'Suivez les performances de vos étudiants'}
        </p>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="course-filter">Filtrer par cours:</label>
          <select
            id="course-filter"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les cours</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistiques */}
      {user.role === 'student' && stats.gradeCount > 0 && (
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.average}/20</div>
              <div className="stat-label">Moyenne générale</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.gradeCount}</div>
              <div className="stat-label">Notes obtenues</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalPoints}/{stats.maxPoints}</div>
              <div className="stat-label">Points total</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {stats.maxPoints > 0 ? Math.round((stats.totalPoints / stats.maxPoints) * 100) : 0}%
              </div>
              <div className="stat-label">Pourcentage</div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des notes */}
      <div className="grades-section">
        {Array.isArray(filteredGrades) && filteredGrades.length > 0 ? (
          <div className="grades-grid">
            {filteredGrades.map(grade => {
              const assignment = getAssignmentDetails(grade.assignmentId);
              const course = getCourseDetails(assignment.courseId);
              const gradeClass = getGradeColor(grade.points, assignment.maxPoints);

              return (
                <div key={grade.id} className={`grade-card ${gradeClass}`}>
                  <div className="grade-header">
                    <h3>{assignment.title}</h3>
                    <div className="course-badge">
                      {course.name || course.code}
                    </div>
                  </div>

                  <div className="grade-content">
                    <div className="grade-score">
                      <span className="points">{grade.points}</span>
                      <span className="separator">/</span>
                      <span className="max-points">{assignment.maxPoints}</span>
                    </div>

                    <div className="grade-percentage">
                      {assignment.maxPoints > 0 ? 
                        Math.round((grade.points / assignment.maxPoints) * 100) : 0}%
                    </div>

                    <div className="grade-note">
                      Note: {assignment.maxPoints > 0 ? 
                        ((grade.points / assignment.maxPoints) * 20).toFixed(1) : 0}/20
                    </div>
                  </div>

                  <div className="grade-meta">
                    <div className="meta-item">
                      <span className="meta-label">Date:</span>
                      <span className="meta-value">{formatDate(grade.gradedAt)}</span>
                    </div>
                    {user.role === 'teacher' && (
                      <div className="meta-item">
                        <span className="meta-label">Étudiant:</span>
                        <span className="meta-value">ID: {grade.studentId}</span>
                      </div>
                    )}
                  </div>

                  {grade.feedback && (
                    <div className="grade-feedback">
                      <h4>Commentaire:</h4>
                      <p>{grade.feedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-grades">
            <h3>Aucune note disponible</h3>
            <p>
              {user.role === 'student' 
                ? selectedCourse === 'all'
                  ? 'Vous n\'avez pas encore de notes.'
                  : 'Aucune note pour ce cours.'
                : 'Aucune note trouvée pour vos devoirs.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradesPage;