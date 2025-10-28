import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Styles inline modernes pour un dashboard attractif
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
      alignItems: 'center',
      backdropFilter: 'blur(10px)'
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
      backdropFilter: 'blur(10px)'
    },
    navTab: {
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '10px',
      padding: '12px 20px',
      color: 'white',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: '500'
    },
    navTabActive: {
      background: 'rgba(255, 255, 255, 0.9)',
      color: '#3b82f6',
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)'
    },
    content: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    },
    statCard: {
      background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
      borderRadius: '15px',
      padding: '25px',
      color: 'white',
      textAlign: 'center',
      boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)',
      transition: 'transform 0.3s ease'
    },
    statNumber: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      margin: '10px 0'
    },
    statLabel: {
      fontSize: '1rem',
      opacity: 0.9
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
    },
    tableHeader: {
      background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
      color: 'white'
    },
    th: {
      padding: '15px',
      textAlign: 'left',
      fontWeight: '600'
    },
    td: {
      padding: '15px',
      borderBottom: '1px solid #e2e8f0'
    },
    tr: {
      background: 'white',
      transition: 'background-color 0.3s ease'
    },
    trHover: {
      backgroundColor: '#f7fafc'
    },
    btn: {
      background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '500',
      transition: 'all 0.3s ease'
    },
    btnOutline: {
      background: 'transparent',
      color: '#3b82f6',
      border: '2px solid #3b82f6'
    },
    loading: {
      textAlign: 'center',
      fontSize: '1.2rem',
      color: '#3b82f6',
      padding: '50px'
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('Récupération des données...');
      
      const usersResponse = await userService.getAll();
      console.log('Utilisateurs:', usersResponse);
      setUsers(usersResponse || []);
      
      // Simulation des cours et notifications
      setCourses([
        { id: 1, title: 'React Avancé', students: 25, status: 'Actif' },
        { id: 2, title: 'Node.js Backend', students: 18, status: 'Actif' },
        { id: 3, title: 'Database Design', students: 32, status: 'Inactif' }
      ]);
      
      setNotifications([
        { id: 1, type: 'info', message: 'Nouveau utilisateur inscrit', date: new Date().toLocaleDateString() },
        { id: 2, type: 'warning', message: 'Maintenance prévue demain', date: new Date().toLocaleDateString() },
        { id: 3, type: 'success', message: 'Backup terminé avec succès', date: new Date().toLocaleDateString() }
      ]);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStats = () => (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#2d3748' }}>Vue d'ensemble</h3>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{users.length}</div>
          <div style={styles.statLabel}>Utilisateurs</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{courses.length}</div>
          <div style={styles.statLabel}>Cours</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{notifications.length}</div>
          <div style={styles.statLabel}>Notifications</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>87%</div>
          <div style={styles.statLabel}>Engagement</div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#2d3748' }}>Gestion des utilisateurs</h3>
        <button style={styles.btn} onClick={fetchData}>
          Actualiser
        </button>
      </div>
      
      {loading ? (
        <div style={styles.loading}>Chargement...</div>
      ) : (
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Rôle</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={styles.tr}>
                <td style={styles.td}>{user.id}</td>
                <td style={styles.td}>{user.nom || 'N/A'}</td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>{user.role || 'Utilisateur'}</td>
                <td style={styles.td}>
                  <button style={{...styles.btn, ...styles.btnOutline, marginRight: '5px'}}>
                    Éditer
                  </button>
                  <button style={{...styles.btn, background: '#e53e3e'}}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderCourses = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#2d3748' }}>Gestion des cours</h3>
        <button style={styles.btn} onClick={() => alert('Nouveau cours')}>
          Nouveau cours
        </button>
      </div>
      
      <table style={styles.table}>
        <thead style={styles.tableHeader}>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Titre</th>
            <th style={styles.th}>Étudiants</th>
            <th style={styles.th}>Statut</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.id} style={styles.tr}>
              <td style={styles.td}>{course.id}</td>
              <td style={styles.td}>{course.title}</td>
              <td style={styles.td}>{course.students}</td>
              <td style={styles.td}>
                <span style={{
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  background: course.status === 'Actif' ? '#48bb78' : '#ed8936',
                  color: 'white'
                }}>
                  {course.status}
                </span>
              </td>
              <td style={styles.td}>
                <button style={{...styles.btn, ...styles.btnOutline, marginRight: '5px'}}>
                  Voir
                </button>
                <button style={{...styles.btn, ...styles.btnOutline}}>
                  Éditer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderNotifications = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: '#2d3748' }}>Centre de notifications</h3>
        <button style={styles.btn} onClick={() => alert('Nouvelle notification')}>
          Nouvelle notification
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '15px' }}>
        {notifications.map(notification => (
          <div key={notification.id} style={{
            background: 'white',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
            borderLeft: `5px solid ${
              notification.type === 'info' ? '#3182ce' :
              notification.type === 'warning' ? '#ed8936' :
              '#48bb78'
            }`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: '#2d3748' }}>{notification.message}</span>
              <span style={{ color: '#718096', fontSize: '0.9rem' }}>{notification.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#2d3748' }}>Paramètres système</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🔒</div>
          <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>Sécurité</h4>
          <p style={{ color: '#718096', marginBottom: '20px' }}>Configuration des paramètres de sécurité</p>
          <button style={{...styles.btn, ...styles.btnOutline}} onClick={() => alert('Configuration de sécurité')}>
            Configurer
          </button>
        </div>
        
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🛡️</div>
          <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>RGPD</h4>
          <p style={{ color: '#718096', marginBottom: '20px' }}>Gestion des données et conformité</p>
          <button style={{...styles.btn, ...styles.btnOutline}} onClick={() => alert('Audit trail RGPD')}>
            Voir audit trail
          </button>
        </div>
        
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '15px' }}>📅</div>
          <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>Google Calendar</h4>
          <p style={{ color: '#718096', marginBottom: '20px' }}>Intégration calendrier</p>
          <button style={{...styles.btn, ...styles.btnOutline}} onClick={() => window.open('/calendar', '_blank')}>
            Ouvrir
          </button>
        </div>
        
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '15px' }}>📱</div>
          <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>Twilio SMS</h4>
          <p style={{ color: '#718096', marginBottom: '20px' }}>Configuration des notifications SMS</p>
          <button style={{...styles.btn, ...styles.btnOutline}} onClick={() => alert('Configuration Twilio')}>
            Configurer
          </button>
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
          <button 
            style={{...styles.btn, background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '2px solid rgba(255, 255, 255, 0.2)'}} 
            onClick={() => window.location.reload()}
          >
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

      <div style={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
