const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));

// Test simple
app.get('/api/test', (req, res) => {
    res.json({ message: 'API fonctionne !', timestamp: new Date().toISOString() });
});

// Test des modèles
app.get('/api/test-models', async (req, res) => {
    try {
        const { User } = require('./src/models/businessModels');
        res.json({ message: 'Modèles chargés avec succès', User: !!User });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Route non trouvée',
        path: req.originalUrl 
    });
});

// Gestion des erreurs globales
app.use((error, req, res, next) => {
    console.error('Erreur serveur:', error);
    res.status(500).json({ 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📋 API de test disponible sur http://localhost:${PORT}/api/test`);
});