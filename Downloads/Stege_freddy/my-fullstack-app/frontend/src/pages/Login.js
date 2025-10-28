import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const history = useHistory();
  const { login } = useAuth();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return;
    }
    
    try {
      await login({ email, password });
      
      // La redirection se fera automatiquement grâce à AuthContext
      // Mais on peut forcer selon le rôle si nécessaire
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.role === 'admin') {
        history.push('/admin');
      } else if (userData.role === 'teacher') {
        history.push('/teacher');
      } else {
        history.push('/student');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message || 'Erreur de connexion');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Connexion</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      
      {/* Informations de test */}
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h4>Compte de test :</h4>
        <p>Email: student@test.com</p>
        <p>Mot de passe: password123</p>
      </div>
    </div>
  );
};

export default Login;
