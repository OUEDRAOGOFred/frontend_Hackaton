import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        roleId: '',
        isActive: true
    });

    useEffect(() => {
        loadUsers();
    }, [page]);

    const loadUsers = async () => {
        try {
            const response = await userService.getUsers(page);
            // response est déjà les données grâce à l'intercepteur
            setUsers(response.data.users);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            roleId: user.roleId,
            isActive: user.isActive
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedUser) {
                await userService.updateUser(selectedUser.id, formData);
            }
            loadUsers();
            setSelectedUser(null);
            setFormData({
                username: '',
                email: '',
                roleId: '',
                isActive: true
            });
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await userService.deleteUser(userId);
                loadUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="user-management">
            <h1>User Management</h1>

            {selectedUser && (
                <div className="edit-form">
                    <h2>Edit User</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <select
                                name="roleId"
                                value={formData.roleId}
                                onChange={handleInputChange}
                            >
                                <option value="1">Admin</option>
                                <option value="2">Teacher</option>
                                <option value="3">Student</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                Active
                            </label>
                        </div>
                        <div className="form-actions">
                            <button type="submit">Save Changes</button>
                            <button 
                                type="button" 
                                onClick={() => setSelectedUser(null)}
                                className="cancel"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="users-list">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{user.Role.name}</td>
                                <td>
                                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="edit"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="delete"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        </div>
    );
};

export default UserManagement;