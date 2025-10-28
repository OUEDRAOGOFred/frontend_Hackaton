import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectService, tokenService } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const { user, isAdmin, isTeacher } = useAuth();
    const [projects, setProjects] = useState([]);
    const [tokens, setTokens] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [projectsRes, tokensRes] = await Promise.all([
                projectService.getProjects(1, 5),
                tokenService.getUserTokens(user.id)
            ]);

            setProjects(projectsRes.data.projects);
            setTokens(tokensRes.data.tokens);

            if (isAdmin) {
                const statsRes = await tokenService.getTokenStats();
                setStats(statsRes.data);
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Welcome, {user.username}!</h1>
                <div className="user-role">{user.role}</div>
            </header>

            <div className="dashboard-grid">
                <section className="dashboard-section">
                    <h2>Recent Projects</h2>
                    <div className="project-list">
                        {projects.map(project => (
                            <div key={project.id} className="project-card">
                                <h3>{project.title}</h3>
                                <p>{project.description}</p>
                                <div className={`project-status status-${project.status}`}>
                                    {project.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="dashboard-section">
                    <h2>Your Tokens</h2>
                    <div className="token-summary">
                        {Object.entries(tokens.summary || {}).map(([type, value]) => (
                            <div key={type} className="token-type">
                                <span className="token-label">{type}</span>
                                <span className="token-value">{value}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {isAdmin && stats && (
                    <section className="dashboard-section">
                        <h2>Platform Statistics</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h4>Total Users</h4>
                                <div className="stat-value">{stats.totalUsers}</div>
                            </div>
                            {stats.stats.map(stat => (
                                <div key={stat.type} className="stat-card">
                                    <h4>{stat.type}</h4>
                                    <div className="stat-details">
                                        <div>Count: {stat.count}</div>
                                        <div>Total: {stat.total}</div>
                                        <div>Avg: {parseFloat(stat.average).toFixed(2)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default Dashboard;