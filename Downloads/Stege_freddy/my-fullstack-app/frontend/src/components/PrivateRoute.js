import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ component: Component, roles = [], ...rest }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div>Chargement...</div>
            </div>
        );
    }

    return (
        <Route
            {...rest}
            render={(props) => {
                // Si pas d'utilisateur connecté, rediriger vers login
                if (!user) {
                    return <Redirect to="/login" />;
                }

                // Si des rôles sont requis et l'utilisateur n'a pas le bon rôle
                if (roles.length > 0 && !roles.includes(user.role)) {
                    return <Redirect to="/login" />;
                }

                // Utilisateur connecté avec le bon rôle
                return <Component {...props} />;
            }}
        />
    );
};

export default PrivateRoute;