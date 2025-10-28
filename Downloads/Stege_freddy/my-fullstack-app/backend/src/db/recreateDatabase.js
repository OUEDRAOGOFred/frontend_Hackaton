const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function recreateDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Freddy1243.',
        multipleStatements: true
    });

    try {
        console.log('🔗 Connexion à MySQL établie');
        
        // Supprimer la base existante et la recréer
        console.log('🗑️ Suppression de la base de données existante...');
        await connection.query('DROP DATABASE IF EXISTS learning_platform');
        
        console.log('🆕 Création d\'une nouvelle base de données...');
        await connection.query('CREATE DATABASE learning_platform');
        await connection.query('USE learning_platform');
        
        // Lire le fichier SQL complet
        const schemaPath = path.join(__dirname, 'complete_schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        // Retirer la partie CREATE DATABASE du schéma puisqu'on l'a déjà fait
        const schemaWithoutCreate = schema
            .replace(/CREATE DATABASE IF NOT EXISTS learning_platform;/g, '')
            .replace(/USE learning_platform;/g, '');
        
        console.log('📖 Exécution du nouveau schéma...');
        
        // Exécuter le schéma
        await connection.query(schemaWithoutCreate);
        
        console.log('✅ Nouveau schéma de base de données exécuté avec succès !');
        
        // Vérifier les tables créées
        const [tables] = await connection.query('SHOW TABLES FROM learning_platform');
        console.log(`📊 ${tables.length} tables créées:`);
        tables.forEach((table, index) => {
            console.log(`  ${index + 1}. ${Object.values(table)[0]}`);
        });
        
        // Vérifier les données initiales
        const [roles] = await connection.query('SELECT * FROM learning_platform.roles');
        console.log(`\n👥 ${roles.length} rôles initialisés:`);
        roles.forEach(role => {
            console.log(`  - ${role.name}: ${role.description}`);
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la recréation de la base:', error);
        throw error;
    } finally {
        await connection.end();
        console.log('🔚 Connexion fermée');
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    recreateDatabase().catch(console.error);
}

module.exports = recreateDatabase;