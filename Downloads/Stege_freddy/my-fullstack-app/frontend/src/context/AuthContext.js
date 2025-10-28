import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                // Si on a un token, on considère que l'utilisateur est connecté
                // On pourrait faire un appel API pour vérifier, mais pour l'instant on simplifie
                const userData = localStorage.getItem('userData');
                if (userData) {
                    setUser(JSON.parse(userData));
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userData');
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        try {
            const data = await api.auth.login(credentials);
            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('userData', JSON.stringify(data.user));
                setUser(data.user);
            } else {
                throw new Error('Token non reçu du serveur');
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            await api.auth.register(userData);
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userData');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isTeacher: user?.role === 'teacher'
    };

    if (loading) {
        return <div>Loading...</div>; // You can replace this with a proper loading component
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;