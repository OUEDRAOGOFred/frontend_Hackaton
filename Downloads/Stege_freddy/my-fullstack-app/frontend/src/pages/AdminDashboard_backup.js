import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    loadNotifications();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Simuler des données utilisateurs pour le moment
      setUsers([
        { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
        { id: 2, username: 'student1', email: 'student1@test.com', role: 'student' }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      // Simuler des notifications
      setNotifications([
        { id: 1, message: 'Nouveau cours ajouté', date: '2025-10-06' },
        { id: 2, message: 'Mise à jour système', date: '2025-10-05' }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const sendNotification = async () => {
    try {
      alert('Notification envoyée avec succès !');
      loadNotifications();
    } catch (error) {
      alert('Erreur lors de l\'envoi de la notification');
    }
  };

  const renderUsers = () => (
    <div className="dashboard-section">
      <h3>Gestion des utilisateurs</h3>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom d'utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button onClick={() => alert(`Modifier ${user.username}`)}>Modifier</button>
                  <button onClick={() => alert(`Supprimer ${user.username}`)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderCourses = () => (
    <div className="dashboard-section">
      <h3>Gestion des cours</h3>
      <button onClick={() => alert('Créer un nouveau cours')}>Nouveau cours</button>
      <div className="courses-list">
        <div className="course-item">
          <h4>Introduction à React</h4>
          <p>Cours de base sur React.js</p>
          <button>Modifier</button>
        </div>
        <div className="course-item">
          <h4>Node.js Avancé</h4>
          <p>Développement backend avec Node.js</p>
          <button>Modifier</button>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="dashboard-section">
      <h3>Notifications</h3>
      <button onClick={sendNotification}>Envoyer nouvelle notification</button>
      <div className="notifications-list">
        {notifications.map(notif => (
          <div key={notif.id} className="notification-item">
            <p>{notif.message}</p>
            <small>{notif.date}</small>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="dashboard-section">
      <h3>Statistiques</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Utilisateurs totaux</h4>
          <p className="stat-number">{users.length}</p>
        </div>
        <div className="stat-card">
          <h4>Cours actifs</h4>
          <p className="stat-number">2</p>
        </div>
        <div className="stat-card">
          <h4>Notifications envoyées</h4>
          <p className="stat-number">{notifications.length}</p>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="dashboard-section">
      <h3>Paramètres</h3>
      <div className="settings-group">
        <h4>Sécurité</h4>
        <button onClick={() => alert('Configuration de sécurité')}>Configurer</button>
      </div>
      <div className="settings-group">
        <h4>RGPD</h4>
        <button onClick={() => alert('Audit trail RGPD')}>Voir audit trail</button>
      </div>
      <div className="settings-group">
        <h4>Intégrations</h4>
        <button onClick={() => window.open('/calendar', '_blank')}>Google Calendar</button>
        <button onClick={() => alert('Configuration Twilio')}>Twilio SMS</button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return renderUsers();
      case 'courses': return renderCourses();
      case 'notifications': return renderNotifications();
      case 'stats': return renderStats();
      case 'settings': return renderSettings();
      default: return renderUsers();
    }
  };

  return (
    <div className="dashboard-container">
      <h2>Dashboard Administrateur</h2>
      <div className="dashboard-menu">
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          Gestion des utilisateurs
        </button>
        <button 
          className={activeTab === 'courses' ? 'active' : ''} 
          onClick={() => setActiveTab('courses')}
        >
          Gestion des cours
        </button>
        <button 
          className={activeTab === 'notifications' ? 'active' : ''} 
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''} 
          onClick={() => setActiveTab('stats')}
        >
          Statistiques
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          Paramètres
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;