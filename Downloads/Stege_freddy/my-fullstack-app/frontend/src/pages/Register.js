import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../services/api';
import './Register.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('student'); // Par défaut étudiant
  const [error, setError] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !email || !password || !confirm) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      const roleId = role === 'admin' ? 1 : 2; // Supposons admin=1, student=2
      const data = await api.auth.register({ username, email, password, roleId });
      // Supposons que le backend renvoie { role: 'admin' | 'student' }
      if (data.role === 'admin') {
        history.push('/admin');
      } else {
        history.push('/student');
      }
    } catch (err) {
      setError(err.message || 'Erreur d\'inscription');
    }
  };

  return (
    <div className="register-container">
      <h2>Inscription</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="student">Étudiant</option>
          <option value="admin">Administrateur</option>
        </select>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        <button type="submit">S'inscrire</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Register;
