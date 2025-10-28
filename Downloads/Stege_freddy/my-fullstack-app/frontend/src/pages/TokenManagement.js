import React, { useState, useEffect } from 'react';
import { tokenService } from '../services/api';
import './TokenManagement.css';

const TokenManagement = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedType, setSelectedType] = useState('');
    const [awardForm, setAwardForm] = useState({
        userId: '',
        type: '',
        value: ''
    });
    const [loading, setLoading] = useState(true);

    const tokenTypes = ['quiz', 'forum', 'peer_review', 'help'];

    useEffect(() => {
        loadTokenData();
    }, [selectedType]);

    const loadTokenData = async () => {
        try {
            const [leaderboardRes, statsRes] = await Promise.all([
                tokenService.getLeaderboard(selectedType),
                tokenService.getTokenStats()
            ]);

            setLeaderboard(leaderboardRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error loading token data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAwardSubmit = async (e) => {
        e.preventDefault();
        try {
            await tokenService.awardTokens(awardForm);
            setAwardForm({ userId: '', type: '', value: '' });
            loadTokenData();
        } catch (error) {
            console.error('Error awarding tokens:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAwardForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="token-management">
            <h1>Token Management</h1>

            <div className="token-grid">
                <section className="award-tokens">
                    <h2>Award Tokens</h2>
                    <form onSubmit={handleAwardSubmit}>
                        <div className="form-group">
                            <label>User ID</label>
                            <input
                                type="number"
                                name="userId"
                                value={awardForm.userId}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Token Type</label>
                            <select
                                name="type"
                                value={awardForm.type}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select type</option>
                                {tokenTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type.replace('_', ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Value</label>
                            <input
                                type="number"
                                name="value"
                                value={awardForm.value}
                                onChange={handleInputChange}
                                min="1"
                                required
                            />
                        </div>
                        <button type="submit">Award Tokens</button>
                    </form>
                </section>

                <section className="token-leaderboard">
                    <h2>Leaderboard</h2>
                    <div className="filter-section">
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {tokenTypes.map(type => (
                                <option key={type} value={type}>
                                    {type.replace('_', ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="leaderboard-list">
                        {leaderboard.map((entry, index) => (
                            <div key={entry.userId} className="leaderboard-item">
                                <div className="rank">#{index + 1}</div>
                                <div className="user-info">
                                    <div className="username">{entry.User.username}</div>
                                    <div className="role">{entry.User.Role.name}</div>
                                </div>
                                <div className="tokens">{entry.total} tokens</div>
                            </div>
                        ))}
                    </div>
                </section>

                {stats && (
                    <section className="token-stats">
                        <h2>Token Statistics</h2>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>Total Users</h3>
                                <div className="stat-value">{stats.totalUsers}</div>
                            </div>
                            {stats.stats.map(stat => (
                                <div key={stat.type} className="stat-card">
                                    <h3>{stat.type.replace('_', ' ').toUpperCase()}</h3>
                                    <div className="stat-details">
                                        <div>Count: {stat.count}</div>
                                        <div>Total: {stat.total}</div>
                                        <div>Average: {parseFloat(stat.average).toFixed(2)}</div>
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

export default TokenManagement;