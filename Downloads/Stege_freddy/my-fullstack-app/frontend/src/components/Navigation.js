import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  const getNavigationItems = () => {
    const commonItems = [
      { path: '/courses', label: 'Cours', icon: '📚' },
      { path: '/assignments', label: 'Devoirs', icon: '📝' },
      { path: '/grades', label: 'Notes', icon: '📊' },
      { path: '/calendar', label: 'Calendrier', icon: '📅' }
    ];

    const roleSpecificItems = {
      admin: [
        { path: '/admin', label: 'Administration', icon: '⚙️' },
        ...commonItems
      ],
      teacher: [
        { path: '/teacher', label: 'Dashboard Prof', icon: '👩‍🏫' },
        ...commonItems
      ],
      student: [
        { path: '/student', label: 'Dashboard Étudiant', icon: '👨‍🎓' },
        ...commonItems
      ]
    };

    return roleSpecificItems[user.role] || commonItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">🎓</span>
            <span className="brand-text">Plateforme Éducative</span>
          </Link>
        </div>

        <div className="nav-menu">
          {navigationItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="nav-user">
          <div className="user-info">
            <span className="user-name">{user.name || user.email}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Déconnexion</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;