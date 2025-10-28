const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function executeSchema() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Freddy1243.',
        multipleStatements: true
    });

    try {
        console.log('🔗 Connexion à MySQL établie');
        
        // Lire le fichier SQL complet
        const schemaPath = path.join(__dirname, 'complete_schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        
        console.log('📖 Lecture du schéma complet...');
        
        // Exécuter le schéma
        await connection.query(schema);
        
        console.log('✅ Schéma de base de données exécuté avec succès !');
        
        // Vérifier les tables créées
        const [tables] = await connection.query('SHOW TABLES FROM learning_platform');
        console.log(`📊 ${tables.length} tables créées:`);
        tables.forEach(table => {
            console.log(`  - ${Object.values(table)[0]}`);
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution du schéma:', error);
        throw error;
    } finally {
        await connection.end();
        console.log('🔚 Connexion fermée');
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    executeSchema().catch(console.error);
}

module.exports = executeSchema;