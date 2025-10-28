import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignmentService, submissionService } from '../services/api';
import './AssignmentsPage.css';

const AssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    loadAssignments();
    if (user.role === 'student') {
      loadSubmissions();
    }
  }, [user]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (user.role === 'teacher') {
        response = await assignmentService.getAssignments({ teacher_id: user.id });
      } else {
        response = await assignmentService.getAll();
      }
      
      setAssignments(response.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des devoirs:', err);
      setError('Erreur lors du chargement des devoirs');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const response = await submissionService.getAll();
      const userSubmissions = response.data?.filter(s => s.studentId === user.id) || [];
      setSubmissions(userSubmissions);
    } catch (err) {
      console.error('Erreur lors du chargement des soumissions:', err);
    }
  };

  const openSubmitModal = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionContent('');
    setShowSubmitModal(true);
  };

  const submitAssignment = async () => {
    if (!submissionContent.trim()) {
      alert('Veuillez saisir votre réponse');
      return;
    }

    const submissionData = {
      assignmentId: selectedAssignment.id,
      studentId: user.id,
      content: submissionContent,
      fileUrl: null
    };

    console.log('🚀 Tentative de soumission:', submissionData);
    console.log('👤 Utilisateur connecté:', user);

    try {
      const result = await submissionService.create(submissionData);
      
      console.log('✅ Soumission réussie:', result);
      alert('Devoir soumis avec succès!');
      setShowSubmitModal(false);
      setSubmissionContent('');
      loadSubmissions(); // Recharger les soumissions
    } catch (err) {
      console.error('❌ Erreur lors de la soumission:', err);
      console.error('Détails erreur:', err.response?.data);
      alert(`Erreur lors de la soumission: ${err.response?.data?.message || err.message}`);
    }
  };

  const hasSubmitted = (assignmentId) => {
    return submissions.some(sub => sub.assignmentId === assignmentId);
  };

  const getSubmissionStatus = (assignmentId) => {
    const submission = submissions.find(sub => sub.assignmentId === assignmentId);
    if (!submission) return null;
    return submission;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="assignments-page">
        <div className="loading">Chargement des devoirs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assignments-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="assignments-page">
      <div className="page-header">
        <h1>
          {user.role === 'teacher' ? 'Mes Devoirs' : 'Devoirs à Faire'}
        </h1>
        <p>
          {user.role === 'teacher' 
            ? 'Gérez vos devoirs et suivez les soumissions'
            : 'Consultez et soumettez vos devoirs'}
        </p>
      </div>

      <div className="assignments-grid">
        {Array.isArray(assignments) && assignments.length > 0 ? (
          assignments.map(assignment => {
            const submission = getSubmissionStatus(assignment.id);
            const overdue = isOverdue(assignment.dueDate);

            return (
              <div key={assignment.id} className={`assignment-card ${overdue && !submission ? 'overdue' : ''}`}>
                <div className="assignment-header">
                  <h3>{assignment.title}</h3>
                  <div className="assignment-course">
                    {assignment.course?.name || assignment.course?.code}
                  </div>
                </div>

                <div className="assignment-content">
                  <p className="assignment-description">{assignment.description}</p>
                  
                  <div className="assignment-meta">
                    <div className="meta-item">
                      <span className="meta-label">Date limite:</span>
                      <span className={`meta-value ${overdue ? 'overdue-text' : ''}`}>
                        {formatDate(assignment.dueDate)}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Points max:</span>
                      <span className="meta-value">{assignment.maxPoints}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Statut:</span>
                      <span className={`status-badge ${assignment.status}`}>
                        {assignment.status === 'active' ? 'Actif' : assignment.status}
                      </span>
                    </div>
                  </div>

                  {user.role === 'student' && submission && (
                    <div className="submission-info">
                      <h4>Votre soumission:</h4>
                      <div className="submission-details">
                        <p><strong>Soumis le:</strong> {formatDate(submission.submittedAt)}</p>
                        <p><strong>Statut:</strong> 
                          <span className={`status-badge ${submission.status}`}>
                            {submission.status === 'submitted' ? 'Soumis' : 
                             submission.status === 'graded' ? 'Noté' : submission.status}
                          </span>
                        </p>
                        {submission.grade && (
                          <p><strong>Note:</strong> {submission.grade}/{assignment.maxPoints}</p>
                        )}
                        {submission.feedback && (
                          <div className="feedback">
                            <strong>Commentaire:</strong>
                            <p>{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="assignment-actions">
                  {user.role === 'student' && (
                    <>
                      {hasSubmitted(assignment.id) ? (
                        <span className="submitted-badge">✓ Soumis</span>
                      ) : overdue ? (
                        <span className="overdue-badge">⚠ En retard</span>
                      ) : (
                        <button 
                          className="btn btn-primary"
                          onClick={() => openSubmitModal(assignment)}
                        >
                          Soumettre
                        </button>
                      )}
                    </>
                  )}

                  {user.role === 'teacher' && (
                    <div className="teacher-actions">
                      <button className="btn btn-secondary">
                        Voir soumissions
                      </button>
                      <button className="btn btn-primary">
                        Modifier
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-assignments">
            <h3>Aucun devoir disponible</h3>
            <p>
              {user.role === 'teacher' 
                ? 'Vous n\'avez pas encore créé de devoirs.' 
                : 'Aucun devoir n\'est actuellement assigné.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de soumission */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Soumettre: {selectedAssignment?.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSubmitModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="assignment-info">
                <p><strong>Description:</strong> {selectedAssignment?.description}</p>
                <p><strong>Date limite:</strong> {formatDate(selectedAssignment?.dueDate)}</p>
                <p><strong>Points:</strong> {selectedAssignment?.maxPoints}</p>
              </div>

              <div className="submission-form">
                <label htmlFor="submission-content">Votre réponse:</label>
                <textarea
                  id="submission-content"
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder="Tapez votre réponse ici..."
                  rows="10"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowSubmitModal(false)}
              >
                Annuler
              </button>
              <button 
                className="btn btn-primary"
                onClick={submitAssignment}
              >
                Soumettre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;