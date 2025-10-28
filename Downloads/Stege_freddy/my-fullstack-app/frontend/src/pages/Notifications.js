import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Notifications.css';

const Notifications = () => {
    const { user, isAdmin, isTeacher } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [sendForm, setSendForm] = useState({
        userId: '',
        message: '',
        type: 'email',
        scheduledFor: ''
    });

    useEffect(() => {
        loadNotifications();
    }, [page]);

    const loadNotifications = async () => {
        try {
            const response = await notificationService.getNotifications(page);
            setNotifications(response.data.notifications);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSendForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await notificationService.sendNotification(sendForm);
            setSendForm({
                userId: '',
                message: '',
                type: 'email',
                scheduledFor: ''
            });
            loadNotifications();
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'sent':
                return 'status-sent';
            case 'failed':
                return 'status-failed';
            default:
                return 'status-pending';
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="notifications">
            <h1>Notifications Center</h1>

            {(isAdmin || isTeacher) && (
                <section className="send-notification">
                    <h2>Send Notification</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Recipient User ID</label>
                            <input
                                type="number"
                                name="userId"
                                value={sendForm.userId}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Message</label>
                            <textarea
                                name="message"
                                value={sendForm.message}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Notification Type</label>
                            <select
                                name="type"
                                value={sendForm.type}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="push">Push Notification</option>
                                <option value="calendar">Calendar Event</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Schedule For (Optional)</label>
                            <input
                                type="datetime-local"
                                name="scheduledFor"
                                value={sendForm.scheduledFor}
                                onChange={handleInputChange}
                            />
                        </div>
                        <button type="submit">Send Notification</button>
                    </form>
                </section>
            )}

            <section className="notifications-list">
                <h2>Your Notifications</h2>
                <div className="notifications-grid">
                    {notifications.map(notification => (
                        <div key={notification.id} className="notification-card">
                            <div className="notification-header">
                                <span className={`notification-type ${notification.type}`}>
                                    {notification.type}
                                </span>
                                <span className={`notification-status ${getStatusColor(notification.status)}`}>
                                    {notification.status}
                                </span>
                            </div>
                            <div className="notification-message">
                                {notification.message}
                            </div>
                            <div className="notification-footer">
                                <span>Sent: {formatDate(notification.createdAt)}</span>
                                {notification.scheduledFor && (
                                    <span>Scheduled: {formatDate(notification.scheduledFor)}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pagination">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Notifications;