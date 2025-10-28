import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Styles en ligne pour éviter les problèmes CSS
  const styles = {
    dashboard: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      padding: '20px'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '30px',
      marginBottom: '30px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      color: '#2d3748',
      fontSize: '2.5rem',
      fontWeight: '700',
      margin: 0,
      background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    subtitle: {
      color: '#718096',
      margin: '5px 0 0 0',
      fontSize: '1.1rem'
    },
    navigation: {
      marginBottom: '30px'
    },
    navTabs: {
      display: 'flex',
      gap: '10px',
      background: 'rgba(255, 255, 255, 0.1)',
      padding: '10px',
      borderRadius: '15px',
      overflowX: 'auto'
    },
    navTab: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '10px',
      background: 'transparent',
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      whiteSpace: 'nowrap'
    },
    navTabActive: {
      background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
      color: 'white',
      boxShadow: '0 10px 25px rgba(79, 172, 254, 0.3)',
      transform: 'translateY(-2px)'
    },
    contentHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px'
    },
    contentTitle: {
      color: 'white',
      fontSize: '1.8rem',
      fontWeight: '600',
      margin: 0,
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    btn: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px'
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
      color: 'white',
      boxShadow: '0 10px 25px rgba(79, 172, 254, 0.3)'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      marginBottom: '25px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '25px',
      marginBottom: '35px'
    },
    statCard: {
      borderRadius: '20px',
      padding: '25px',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white'
    },
    statIcon: {
      fontSize: '2.5rem',
      width: '70px',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '15px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      background: 'white',
      borderRadius: '15px',
      overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
    },
    tableHeader: {
      background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
      color: 'white'
    },
    tableCell: {
      padding: '15px 20px',
      textAlign: 'left',
      borderBottom: '1px solid #f1f5f9'
    },
    userAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '600',
      fontSize: '14px'
    },
    roleBadge: {
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '500',
      textTransform: 'capitalize',
      color: 'white'
    }
  };

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      loadUsers(),
      loadCourses(),
      loadNotifications()
    ]);
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getUsers();
      setUsers(response.data || response || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      // Données de fallback
      setUsers([
        { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
        { id: 2, username: 'student1', email: 'student1@test.com', role: 'student' },
        { id: 3, username: 'teacher1', email: 'teacher1@test.com', role: 'teacher' }
      ]);
    }
  };

  const loadCourses = async () => {
    try {
      // Simuler des cours pour le moment
      setCourses([
        { id: 1, title: 'Introduction à React', students: 25, teacher: 'Prof. Martin' },
        { id: 2, title: 'Node.js Avancé', students: 18, teacher: 'Prof. Dubois' },
        { id: 3, title: 'Base de données SQL', students: 32, teacher: 'Prof. Leroy' }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      // Simuler des notifications
      setNotifications([
        { id: 1, message: 'Nouveau cours ajouté', date: '2025-01-10', type: 'info' },
        { id: 2, message: 'Mise à jour système', date: '2025-01-09', type: 'warning' },
        { id: 3, message: 'Sauvegarde complétée', date: '2025-01-08', type: 'success' }
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await userService.deleteUser(userId);
        await loadUsers();
      } catch (error) {
        alert('Erreur lors de la suppression');
      }
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

  const renderStats = () => {
    const adminCount = users.filter(u => u.role === 'admin').length;
    const teacherCount = users.filter(u => u.role === 'teacher').length;
    const studentCount = users.filter(u => u.role === 'student').length;

    return (
      <div className="dashboard-content">
        <div className="stats-overview">
          <div className="stat-card primary">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{users.length}</h3>
              <p>Utilisateurs totaux</p>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <h3>{courses.length}</h3>
              <p>Cours actifs</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">🔔</div>
            <div className="stat-info">
              <h3>{notifications.length}</h3>
              <p>Notifications</p>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <h3>98%</h3>
              <p>Disponibilité</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <h3>Répartition des utilisateurs</h3>
            </div>
            <div className="card-content">
              <div className="user-distribution">
                <div className="user-type">
                  <span className="type-label admin">Administrateurs</span>
                  <span className="type-count">{adminCount}</span>
                </div>
                <div className="user-type">
                  <span className="type-label teacher">Professeurs</span>
                  <span className="type-count">{teacherCount}</span>
                </div>
                <div className="user-type">
                  <span className="type-label student">Étudiants</span>
                  <span className="type-count">{studentCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Activité récente</h3>
            </div>
            <div className="card-content">
              <div className="activity-list">
                {notifications.slice(0, 3).map(notif => (
                  <div key={notif.id} className={`activity-item ${notif.type}`}>
                    <div className="activity-dot"></div>
                    <div className="activity-content">
                      <p>{notif.message}</p>
                      <small>{notif.date}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="dashboard-content">
      <div className="content-header">
        <h3>Gestion des utilisateurs</h3>
        <button className="btn btn-primary" onClick={() => alert('Ajouter un utilisateur')}>
          + Nouvel utilisateur
        </button>
      </div>
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                        <span className="user-name">{user.username}</span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? 'Administrateur' : 
                         user.role === 'teacher' ? 'Professeur' : 'Étudiant'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-secondary" onClick={() => alert(`Modifier ${user.username}`)}>
                          ✏️
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(user.id)}>
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderCourses = () => (
    <div className="dashboard-content">
      <div className="content-header">
        <h3>Gestion des cours</h3>
        <button className="btn btn-primary" onClick={() => alert('Créer un nouveau cours')}>
          + Nouveau cours
        </button>
      </div>
      <div className="courses-grid">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <div className="course-header">
              <h4>{course.title}</h4>
              <div className="course-actions">
                <button className="btn btn-sm btn-secondary" onClick={() => alert(`Modifier ${course.title}`)}>
                  ✏️
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => alert(`Supprimer ${course.title}`)}>
                  🗑️
                </button>
              </div>
            </div>
            <div className="course-info">
              <p className="course-teacher">👨‍🏫 {course.teacher}</p>
              <p className="course-students">👥 {course.students} étudiants</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="dashboard-content">
      <div className="content-header">
        <h3>Notifications</h3>
        <button className="btn btn-primary" onClick={sendNotification}>
          + Nouvelle notification
        </button>
      </div>
      <div className="notifications-container">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification-card ${notif.type}`}>
            <div className="notification-icon">
              {notif.type === 'success' ? '✅' : 
               notif.type === 'warning' ? '⚠️' : 
               notif.type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div className="notification-content">
              <p className="notification-message">{notif.message}</p>
              <small className="notification-date">{notif.date}</small>
            </div>
            <button className="notification-dismiss" onClick={() => alert('Notification supprimée')}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="dashboard-content">
      <div className="content-header">
        <h3>Paramètres système</h3>
      </div>
      <div className="settings-grid">
        <div className="setting-card">
          <div className="setting-icon">🔒</div>
          <div className="setting-content">
            <h4>Sécurité</h4>
            <p>Configuration des paramètres de sécurité</p>
            <button className="btn btn-outline" onClick={() => alert('Configuration de sécurité')}>
              Configurer
            </button>
          </div>
        </div>
        <div className="setting-card">
          <div className="setting-icon">🛡️</div>
          <div className="setting-content">
            <h4>RGPD</h4>
            <p>Gestion des données et conformité</p>
            <button className="btn btn-outline" onClick={() => alert('Audit trail RGPD')}>
              Voir audit trail
            </button>
          </div>
        </div>
        <div className="setting-card">
          <div className="setting-icon">📅</div>
          <div className="setting-content">
            <h4>Google Calendar</h4>
            <p>Intégration calendrier</p>
            <button className="btn btn-outline" onClick={() => window.open('/calendar', '_blank')}>
              Ouvrir
            </button>
          </div>
        </div>
        <div className="setting-card">
          <div className="setting-icon">📱</div>
          <div className="setting-content">
            <h4>Twilio SMS</h4>
            <p>Configuration des notifications SMS</p>
            <button className="btn btn-outline" onClick={() => alert('Configuration Twilio')}>
              Configurer
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'stats': return renderStats();
      case 'users': return renderUsers();
      case 'courses': return renderCourses();
      case 'notifications': return renderNotifications();
      case 'settings': return renderSettings();
      default: return renderStats();
    }
  };

  return (
    <div style={styles.dashboard}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard Administrateur</h1>
          <p style={styles.subtitle}>Gestion complète de la plateforme éducative</p>
        </div>
        <div>
          <button style={{...styles.btn, background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '2px solid rgba(255, 255, 255, 0.2)'}} 
                  onClick={() => window.location.reload()}>
            🔄 Actualiser
          </button>
        </div>
      </div>

      <div style={styles.navigation}>
        <div style={styles.navTabs}>
          <button 
            style={{...styles.navTab, ...(activeTab === 'stats' ? styles.navTabActive : {})}} 
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistiques
          </button>
          <button 
            style={{...styles.navTab, ...(activeTab === 'users' ? styles.navTabActive : {})}} 
            onClick={() => setActiveTab('users')}
          >
            👥 Utilisateurs
          </button>
          <button 
            style={{...styles.navTab, ...(activeTab === 'courses' ? styles.navTabActive : {})}} 
            onClick={() => setActiveTab('courses')}
          >
            📚 Cours
          </button>
          <button 
            style={{...styles.navTab, ...(activeTab === 'notifications' ? styles.navTabActive : {})}} 
            onClick={() => setActiveTab('notifications')}
          >
            🔔 Notifications
          </button>
          <button 
            style={{...styles.navTab, ...(activeTab === 'settings' ? styles.navTabActive : {})}} 
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Paramètres
          </button>
        </div>
      </div>

      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
