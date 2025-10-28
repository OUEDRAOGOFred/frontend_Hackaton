import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState({});

  useEffect(() => {
    loadCourses();
    loadProgress();
    loadNotifications();
    loadProfile();
  }, []);

  const loadCourses = async () => {
    try {
      // Simuler des cours
      setCourses([
        { id: 1, title: 'Introduction à React', description: 'Cours de base sur React.js', progress: 75 },
        { id: 2, title: 'Node.js Avancé', description: 'Développement backend avec Node.js', progress: 45 }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
    }
  };

  const loadProgress = async () => {
    try {
      setProgress({
        totalCourses: 2,
        completedCourses: 1,
        averageScore: 85,
        totalHours: 25
      });
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      setNotifications([
        { id: 1, message: 'Nouveau devoir disponible', date: '2025-10-06', type: 'info' },
        { id: 2, message: 'Félicitations pour votre note !', date: '2025-10-05', type: 'success' }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setProfile({
        username: 'etudiant1',
        email: 'etudiant1@test.com',
        joinDate: '2025-01-15',
        level: 'Intermédiaire'
      });
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const renderCourses = () => (
    <div className="dashboard-section">
      <h3>Mes cours</h3>
      <div className="courses-grid">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <h4>{course.title}</h4>
            <p>{course.description}</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
            <p>Progression: {course.progress}%</p>
            <button onClick={() => alert(`Accéder au cours: ${course.title}`)}>
              Continuer
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProgress = () => (
    <div className="dashboard-section">
      <h3>Ma progression</h3>
      <div className="progress-stats">
        <div className="stat-card">
          <h4>Cours total</h4>
          <p className="stat-number">{progress.totalCourses}</p>
        </div>
        <div className="stat-card">
          <h4>Cours terminés</h4>
          <p className="stat-number">{progress.completedCourses}</p>
        </div>
        <div className="stat-card">
          <h4>Note moyenne</h4>
          <p className="stat-number">{progress.averageScore}%</p>
        </div>
        <div className="stat-card">
          <h4>Heures d'étude</h4>
          <p className="stat-number">{progress.totalHours}h</p>
        </div>
      </div>
      <div className="achievements">
        <h4>Badges obtenus</h4>
        <div className="badge">🎯 Premier cours terminé</div>
        <div className="badge">⭐ Note excellente</div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="dashboard-section">
      <h3>Mes notifications</h3>
      <div className="notifications-list">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification-item ${notif.type}`}>
            <p>{notif.message}</p>
            <small>{notif.date}</small>
          </div>
        ))}
      </div>
      <button onClick={() => alert('Marquer toutes comme lues')}>
        Marquer toutes comme lues
      </button>
    </div>
  );

  const renderProfile = () => (
    <div className="dashboard-section">
      <h3>Mon profil</h3>
      <div className="profile-info">
        <div className="profile-field">
          <label>Nom d'utilisateur:</label>
          <span>{profile.username}</span>
        </div>
        <div className="profile-field">
          <label>Email:</label>
          <span>{profile.email}</span>
        </div>
        <div className="profile-field">
          <label>Membre depuis:</label>
          <span>{profile.joinDate}</span>
        </div>
        <div className="profile-field">
          <label>Niveau:</label>
          <span>{profile.level}</span>
        </div>
      </div>
      <button onClick={() => alert('Modifier le profil')}>
        Modifier le profil
      </button>
      <button onClick={() => alert('Changer le mot de passe')}>
        Changer le mot de passe
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'courses': return renderCourses();
      case 'progress': return renderProgress();
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      default: return renderCourses();
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard Étudiant</h2>
      <div className="dashboard-menu">
        <button 
          className={activeTab === 'courses' ? 'active' : ''} 
          onClick={() => setActiveTab('courses')}
        >
          Mes cours
        </button>
        <button 
          className={activeTab === 'progress' ? 'active' : ''} 
          onClick={() => setActiveTab('progress')}
        >
          Progression
        </button>
        <button 
          className={activeTab === 'notifications' ? 'active' : ''} 
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button 
          className={activeTab === 'profile' ? 'active' : ''} 
          onClick={() => setActiveTab('profile')}
        >
          Profil
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default StudentDashboard;