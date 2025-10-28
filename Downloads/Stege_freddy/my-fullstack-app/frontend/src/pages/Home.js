import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home-wrapper">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        <span className="highlight">Plateforme</span> de Formation en Ligne
                    </h1>
                    <p className="hero-subtitle">
                        Transformez votre apprentissage avec notre plateforme innovante. 
                        Accédez à des cours de qualité, suivez votre progression en temps réel 
                        et bénéficiez d'un accompagnement personnalisé.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="cta-primary">
                            Commencer maintenant
                        </Link>
                        <Link to="/login" className="cta-secondary">
                            Se connecter
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-number">500+</span>
                            <span className="stat-label">Étudiants</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">50+</span>
                            <span className="stat-label">Cours</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">95%</span>
                            <span className="stat-label">Satisfaction</span>
                        </div>
                    </div>
                </div>
                <div className="hero-image">
                    <div className="hero-illustration">
                        <div className="illustration-card card-1">📚 Cours interactifs</div>
                        <div className="illustration-card card-2">📊 Suivi progression</div>
                        <div className="illustration-card card-3">🎯 Objectifs personnalisés</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <h2 className="section-title">Pourquoi choisir notre plateforme ?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🎓</div>
                            <h3>Formation de qualité</h3>
                            <p>Accédez à des cours créés par des experts et mis à jour régulièrement.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📈</div>
                            <h3>Suivi personnalisé</h3>
                            <p>Suivez votre progression en temps réel avec des statistiques détaillées.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔔</div>
                            <h3>Notifications intelligentes</h3>
                            <p>Restez informé par email, SMS ou calendrier selon vos préférences.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🛡️</div>
                            <h3>Sécurité avancée</h3>
                            <p>Vos données sont protégées avec un système anti-fraude et conformité RGPD.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔗</div>
                            <h3>Intégrations</h3>
                            <p>Compatible avec Google Calendar, Moodle, Teams et bien d'autres.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🏆</div>
                            <h3>Gamification</h3>
                            <p>Gagnez des badges et débloquez des récompenses pour rester motivé.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technologies Section */}
            <section className="tech-section">
                <div className="container">
                    <h2 className="section-title">Technologies utilisées</h2>
                    <div className="tech-stack">
                        <div className="tech-item">
                            <div className="tech-logo">⚛️</div>
                            <span>React</span>
                        </div>
                        <div className="tech-item">
                            <div className="tech-logo">🟢</div>
                            <span>Node.js</span>
                        </div>
                        <div className="tech-item">
                            <div className="tech-logo">🐬</div>
                            <span>MySQL</span>
                        </div>
                        <div className="tech-item">
                            <div className="tech-logo">📡</div>
                            <span>API REST</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Prêt à commencer votre formation ?</h2>
                        <p>Rejoignez des milliers d'étudiants qui ont déjà transformé leur carrière.</p>
                        <div className="cta-buttons">
                            <Link to="/register" className="cta-primary large">
                                Créer un compte gratuit
                            </Link>
                            <Link to="/login" className="cta-secondary large">
                                J'ai déjà un compte
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="home-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h4>Plateforme de Formation</h4>
                            <p>Une solution complète pour l'apprentissage en ligne.</p>
                        </div>
                        <div className="footer-section">
                            <h4>Liens rapides</h4>
                            <ul>
                                <li><Link to="/login">Connexion</Link></li>
                                <li><Link to="/register">Inscription</Link></li>
                                <li><Link to="/calendar">Calendrier</Link></li>
                            </ul>
                        </div>
                        <div className="footer-section">
                            <h4>Support</h4>
                            <ul>
                                <li><a href="/api/docs" target="_blank">Documentation API</a></li>
                                <li><span>Contact: support@formation.com</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2025 Plateforme de Formation. Tous droits réservés.</p>
                        <p>React • Node.js • MySQL</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;