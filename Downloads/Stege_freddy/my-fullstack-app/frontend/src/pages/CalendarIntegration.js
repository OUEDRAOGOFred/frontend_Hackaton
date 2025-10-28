import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CalendarIntegration.css';

const CalendarIntegration = () => {
  const [sessions, setSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadMessage, setDownloadMessage] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Charger les sessions
      const sessionsRes = await axios.get('http://localhost:5000/api/sessions');
      console.log('Sessions response:', sessionsRes.data);
      const sessionsData = sessionsRes.data?.data || sessionsRes.data || [];
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      
      // Charger les assignments
      const assignmentsRes = await axios.get('http://localhost:5000/api/assignments');
      console.log('Assignments response:', assignmentsRes.data);
      const assignmentsData = assignmentsRes.data?.data || assignmentsRes.data || [];
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      
    } catch (error) {
      console.error('Erreur chargement:', error);
      // En cas d'erreur, définir des tableaux vides
      setSessions([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadSessionICS = (sessionId) => {
    window.location.href = `http://localhost:5000/api/calendar/session/${sessionId}/ics`;
    showDownloadMessage('Fichier téléchargé !');
  };

  const downloadAssignmentICS = (assignmentId) => {
    window.location.href = `http://localhost:5000/api/calendar/assignment/${assignmentId}/ics`;
    showDownloadMessage('Rappel téléchargé !');
  };

  const downloadFullCalendar = () => {
    window.location.href = `http://localhost:5000/api/calendar/student/${user.id}/ics`;
    showDownloadMessage('Calendrier complet téléchargé !');
  };

  const showDownloadMessage = (message) => {
    setDownloadMessage(message);
    setTimeout(() => setDownloadMessage(''), 5000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className='calendar-integration'>
        <div className='loading-spinner'>
          <div className='spinner'></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='calendar-integration'>
      <div className='calendar-header'>
        <h1> Intégration Calendrier</h1>
        <p>Synchronisez avec Google Calendar, Outlook, Apple Calendar</p>
      </div>

      {downloadMessage && (
        <div className='download-message'>{downloadMessage}</div>
      )}

      <div className='instructions-card'>
        <h3> Comment ça marche ?</h3>
        <div className='steps'>
          <div className='step'>
            <span className='step-number'>1</span>
            <div className='step-content'>
              <h4>Téléchargez</h4>
              <p>Cliquez sur Ajouter au calendrier</p>
            </div>
          </div>
          <div className='step'>
            <span className='step-number'>2</span>
            <div className='step-content'>
              <h4>Ouvrez</h4>
              <p>Double-cliquez sur le fichier .ics</p>
            </div>
          </div>
          <div className='step'>
            <span className='step-number'>3</span>
            <div className='step-content'>
              <h4>Confirmez</h4>
              <p>Votre calendrier s'ouvre automatiquement</p>
            </div>
          </div>
        </div>
        <div className='compatible-apps'>
          <p><strong>Compatible avec :</strong></p>
          <div className='apps-list'>
            <span className='app-badge'> Google Calendar</span>
            <span className='app-badge'> Outlook</span>
            <span className='app-badge'> Apple Calendar</span>
          </div>
        </div>
      </div>

      <div className='full-calendar-section'>
        <button className='btn-full-calendar' onClick={downloadFullCalendar}>
          <span className='icon'></span>
          <div className='btn-text'>
            <strong>Télécharger mon calendrier complet</strong>
            <small>Sessions et assignments en un fichier</small>
          </div>
        </button>
      </div>

      <div className='events-section'>
        <h2>📅 Sessions Synchrones</h2>
        {!sessions || sessions.length === 0 ? (
          <p className='no-events'>Aucune session planifiée</p>
        ) : (
          <div className='events-grid'>
            {Array.isArray(sessions) && sessions.map(session => (
              <div key={session.id} className='event-card session-card'>
                <div className='event-header'>
                  <h3>{session.title}</h3>
                  <span className='event-type'>Session en direct</span>
                </div>
                <div className='event-body'>
                  <p className='event-description'>{session.description}</p>
                  <div className='event-details'>
                    <div className='detail-item'>
                      <span className='icon'></span>
                      <span>{formatDate(session.scheduledDate)}</span>
                    </div>
                    <div className='detail-item'>
                      <span className='icon'></span>
                      <span>{session.duration} minutes</span>
                    </div>
                    {session.meetingLink && (
                      <div className='detail-item'>
                        <span className='icon'></span>
                        <a href={session.meetingLink} target='_blank' rel='noopener noreferrer'>
                          Lien de réunion
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  className='btn-add-calendar'
                  onClick={() => downloadSessionICS(session.id)}
                >
                   Ajouter au calendrier
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='events-section'>
        <h2>📝 Assignments à rendre</h2>
        {!assignments || assignments.length === 0 ? (
          <p className='no-events'>Aucun assignment en attente</p>
        ) : (
          <div className='events-grid'>
            {Array.isArray(assignments) && assignments.map(assignment => (
              <div key={assignment.id} className='event-card assignment-card'>
                <div className='event-header'>
                  <h3>{assignment.title}</h3>
                  <span className='event-type assignment-type'>À rendre</span>
                </div>
                <div className='event-body'>
                  <p className='event-description'>{assignment.description}</p>
                  <div className='event-details'>
                    <div className='detail-item'>
                      <span className='icon'></span>
                      <span>Date limite: {formatDate(assignment.dueDate)}</span>
                    </div>
                    <div className='detail-item'>
                      <span className='icon'></span>
                      <span>{assignment.points} points</span>
                    </div>
                  </div>
                </div>
                <button 
                  className='btn-add-calendar assignment-btn'
                  onClick={() => downloadAssignmentICS(assignment.id)}
                >
                   Créer un rappel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='info-footer'>
        <h4> Astuce</h4>
        <p>
          Les fichiers .ics incluent des rappels automatiques : 
          <strong> 24h et 1h avant</strong> pour les sessions, 
          <strong> 48h et 24h avant</strong> pour les assignments !
        </p>
      </div>
    </div>
  );
};

export default CalendarIntegration;
