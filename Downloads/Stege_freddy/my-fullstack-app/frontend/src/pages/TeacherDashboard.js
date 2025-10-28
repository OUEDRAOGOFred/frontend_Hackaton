import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { courseService, assignmentService, analyticsService, submissionService } from '../services/api';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
    const history = useHistory();
    const [teacherData, setTeacherData] = useState(null);
    const [courses, setCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [pendingGrading, setPendingGrading] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState('all');

    useEffect(() => {
        loadTeacherDashboard();
    }, []);

    const loadTeacherDashboard = async () => {
        try {
            setLoading(true);
            setError(null);

            // Récupérer l'utilisateur connecté depuis le localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                setError('Utilisateur non connecté');
                return;
            }

            // Charger les données de l'enseignant
            const [teacherAnalytics, teacherCourses, allAssignments] = await Promise.all([
                analyticsService.getTeacherAnalytics(user.id),
                courseService.getTeacherCourses(user.id),
                assignmentService.getAssignments({ teacher_id: user.id })
            ]);

            setTeacherData(teacherAnalytics?.data || {});
            const coursesArray = teacherCourses?.courses || teacherCourses?.data || [];
            setCourses(Array.isArray(coursesArray) ? coursesArray : []);
            const assignmentsArray = allAssignments?.assignments || allAssignments?.data || [];
            setAssignments(Array.isArray(assignmentsArray) ? assignmentsArray : []);

            // Charger les soumissions en attente de correction
            if (teacherCourses?.courses?.length > 0 || teacherCourses?.data?.length > 0) {
                const coursesData = teacherCourses?.courses || teacherCourses?.data || [];
                const pendingSubmissions = [];
                for (const course of coursesData) {
                    // Récupérer les assignments de ce cours
                    const courseAssignments = allAssignments?.assignments?.filter(
                        assignment => assignment.course_id === course.id
                    ) || [];
                    
                    // Pour chaque assignment, récupérer les soumissions non notées
                    for (const assignment of courseAssignments) {
                        try {
                            const submissions = await submissionService.getAssignmentSubmissions(
                                assignment.id, 
                                { status: 'submitted' }
                            );
                            
                            if (submissions.data?.submissions) {
                                submissions.data.submissions.forEach(submission => {
                                    if (!submission.grade) {
                                        pendingSubmissions.push({
                                            ...submission,
                                            assignment_title: assignment.title,
                                            course_title: course.title
                                        });
                                    }
                                });
                            }
                        } catch (err) {
                            console.error(`Erreur lors du chargement des soumissions pour ${assignment.title}:`, err);
                        }
                    }
                }
                setPendingGrading(pendingSubmissions);
            }

        } catch (err) {
            console.error('Erreur lors du chargement du dashboard enseignant:', err);
            setError('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const createNewAssignment = async () => {
        if (!Array.isArray(courses) || courses.length === 0) {
            alert('Vous devez d\'abord créer un cours');
            return;
        }

        const courseId = prompt(`ID du cours (${courses.map(c => `${c.id}: ${c.title || c.name}`).join(', ')}):`);
        const title = prompt('Titre du devoir:');
        const description = prompt('Description du devoir:');
        const maxPoints = prompt('Points maximum (par défaut 100):') || '100';
        const dueDate = prompt('Date limite (YYYY-MM-DD HH:MM):');

        if (courseId && title && description) {
            try {
                await assignmentService.createAssignment({
                    course_id: parseInt(courseId),
                    title,
                    description,
                    max_points: parseInt(maxPoints),
                    due_date: dueDate || null,
                    status: 'draft'
                });
                
                alert('Devoir créé avec succès');
                loadTeacherDashboard(); // Recharger les données
            } catch (error) {
                console.error('Erreur lors de la création du devoir:', error);
                alert('Erreur lors de la création du devoir');
            }
        }
    };

    const publishAssignment = async (assignmentId) => {
        try {
            await assignmentService.publishAssignment(assignmentId);
            alert('Devoir publié avec succès');
            loadTeacherDashboard();
        } catch (error) {
            console.error('Erreur lors de la publication:', error);
            alert('Erreur lors de la publication du devoir');
        }
    };

    const gradeSubmission = async (submissionId) => {
        const grade = prompt('Note (0-100):');
        const comment = prompt('Commentaire (optionnel):');

        if (grade !== null && !isNaN(grade) && grade >= 0 && grade <= 100) {
            try {
                await submissionService.gradeSubmission({
                    submission_id: submissionId,
                    grade_value: parseFloat(grade),
                    comment: comment || ''
                });
                
                alert('Note attribuée avec succès');
                loadTeacherDashboard();
            } catch (error) {
                console.error('Erreur lors de la notation:', error);
                alert('Erreur lors de l\'attribution de la note');
            }
        }
    };

    if (loading) return <div className="teacher-dashboard-loading">Chargement...</div>;
    if (error) return <div className="teacher-dashboard-error">{error}</div>;

    // Filtrer les cours selon la sélection
    const filteredCourses = selectedCourse === 'all' 
        ? (Array.isArray(courses) ? courses : [])
        : (Array.isArray(courses) ? courses.filter(c => c.id === parseInt(selectedCourse)) : []);
    const filteredAssignments = selectedCourse === 'all' ? assignments : assignments.filter(a => a.course_id === parseInt(selectedCourse));

    return (
        <div className="teacher-dashboard">
            <div className="dashboard-header">
                <h1>Dashboard Enseignant</h1>
                <div className="dashboard-controls">
                    <select 
                        value={selectedCourse} 
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="course-filter"
                    >
                        <option value="all">Tous les cours</option>
                        {Array.isArray(courses) && courses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.title || course.name} ({course.code})
                            </option>
                        ))}
                    </select>
                    <button onClick={createNewAssignment} className="btn btn-primary">
                        ➕ Nouveau Devoir
                    </button>
                </div>
            </div>

            {/* Statistiques rapides */}
            {teacherData && (
                <div className="teacher-stats">
                    <div className="stat-card">
                        <div className="stat-icon">📚</div>
                        <div className="stat-content">
                            <h3>{teacherData.overview.total_courses}</h3>
                            <p>Cours</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <h3>{teacherData.overview.total_students}</h3>
                            <p>Étudiants</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📝</div>
                        <div className="stat-content">
                            <h3>{teacherData.overview.total_assignments}</h3>
                            <p>Devoirs</p>
                        </div>
                    </div>
                    <div className="stat-card urgent">
                        <div className="stat-icon">⏰</div>
                        <div className="stat-content">
                            <h3>{teacherData.overview.pending_grading}</h3>
                            <p>À Corriger</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid">
                {/* Mes Cours */}
                <div className="dashboard-section">
                    <h2>Mes Cours</h2>
                    <div className="courses-list">
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map(course => (
                                <div key={course.id} className="course-card">
                                    <div className="course-header">
                                        <h3>{course.title}</h3>
                                        <span className="course-code">{course.code}</span>
                                    </div>
                                    <p className="course-description">{course.description}</p>
                                    <div className="course-stats">
                                        <span>👥 {course.enrollments?.length || 0} étudiants</span>
                                        <span>📝 {assignments.filter(a => a.course_id === course.id).length} devoirs</span>
                                    </div>
                                    <div className="course-actions">
                                        <button 
                                            onClick={() => history.push('/courses')}
                                            className="btn btn-outline"
                                        >
                                            Voir Détails
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state">Aucun cours trouvé</p>
                        )}
                    </div>
                </div>

                {/* Devoirs */}
                <div className="dashboard-section">
                    <h2>Mes Devoirs</h2>
                    <div className="assignments-list">
                        {filteredAssignments.length > 0 ? (
                            filteredAssignments.map(assignment => (
                                <div key={assignment.id} className="assignment-card">
                                    <div className="assignment-header">
                                        <h4>{assignment.title}</h4>
                                        <span className={`assignment-status ${assignment.status}`}>
                                            {assignment.status === 'draft' ? 'Brouillon' : 
                                             assignment.status === 'published' ? 'Publié' : 
                                             assignment.status}
                                        </span>
                                    </div>
                                    <p className="assignment-course">
                                        Cours: {courses.find(c => c.id === assignment.course_id)?.title}
                                    </p>
                                    <div className="assignment-meta">
                                        <span>📅 {assignment.due_date ? 
                                            new Date(assignment.due_date).toLocaleDateString('fr-FR') : 
                                            'Pas de date limite'}
                                        </span>
                                        <span>🎯 {assignment.max_points} points</span>
                                    </div>
                                    <div className="assignment-actions">
                                        {assignment.status === 'draft' && (
                                            <button 
                                                onClick={() => publishAssignment(assignment.id)}
                                                className="btn btn-success"
                                            >
                                                Publier
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => history.push('/assignments')}
                                            className="btn btn-outline"
                                        >
                                            Voir Soumissions
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state">Aucun devoir trouvé</p>
                        )}
                    </div>
                </div>

                {/* Soumissions à corriger */}
                <div className="dashboard-section">
                    <h2>À Corriger ({pendingGrading.length})</h2>
                    <div className="pending-list">
                        {pendingGrading.length > 0 ? (
                            pendingGrading.slice(0, 5).map(submission => (
                                <div key={submission.id} className="pending-item">
                                    <div className="pending-header">
                                        <h4>{submission.assignment_title}</h4>
                                        <span className="pending-course">{submission.course_title}</span>
                                    </div>
                                    <p className="pending-student">
                                        Étudiant: {submission.student.first_name} {submission.student.last_name}
                                    </p>
                                    <p className="pending-date">
                                        Soumis le: {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                                    </p>
                                    <div className="pending-actions">
                                        <button 
                                            onClick={() => gradeSubmission(submission.id)}
                                            className="btn btn-primary"
                                        >
                                            Noter
                                        </button>
                                        <button className="btn btn-outline">
                                            Voir Détails
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="empty-state">Aucune soumission en attente</p>
                        )}
                        
                        {pendingGrading.length > 5 && (
                            <div className="see-more">
                                <button className="btn btn-outline">
                                    Voir toutes les soumissions ({pendingGrading.length})
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Activité récente */}
                {teacherData && (
                    <div className="dashboard-section">
                        <h2>Activité Récente</h2>
                        <div className="activity-summary">
                            <div className="activity-item">
                                <span className="activity-label">Nouvelles soumissions:</span>
                                <span className="activity-value">{teacherData.recent_activity.new_submissions}</span>
                            </div>
                            <div className="activity-item">
                                <span className="activity-label">Notes attribuées:</span>
                                <span className="activity-value">{teacherData.recent_activity.grades_given}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;