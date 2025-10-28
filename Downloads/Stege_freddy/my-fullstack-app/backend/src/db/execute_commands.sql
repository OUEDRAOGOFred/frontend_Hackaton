-- ============================================================================
-- COMMANDES À EXÉCUTER DANS L'ORDRE
-- ============================================================================

-- 1. Se connecter à MySQL (dans PowerShell/Terminal)
mysql -u root -p

-- 2. Exécuter le schéma complet (structure de la base)
SOURCE C:\Users\hp\Downloads\Stege_freddy\my-fullstack-app\backend\src\db\complete_schema.sql;

-- 3. Exécuter les données d'initialisation
SOURCE C:\Users\hp\Downloads\Stege_freddy\my-fullstack-app\backend\src\db\init_data.sql;

-- 4. Vérifier que tout s'est bien passé
USE learning_platform;
SHOW TABLES;
SELECT COUNT(*) as 'Nombre d\'utilisateurs' FROM users;
SELECT COUNT(*) as 'Nombre de cours' FROM courses;
SELECT COUNT(*) as 'Nombre d\'inscriptions' FROM course_enrollments;

-- ============================================================================
-- OU EXÉCUTION DIRECTE DEPUIS LE TERMINAL
-- ============================================================================

# Depuis PowerShell (dans le dossier du projet):
mysql -u root -p < "C:\Users\hp\Downloads\Stege_freddy\my-fullstack-app\backend\src\db\complete_schema.sql"
mysql -u root -p < "C:\Users\hp\Downloads\Stege_freddy\my-fullstack-app\backend\src\db\init_data.sql"

-- ============================================================================
-- COMPTES DE TEST CRÉÉS
-- ============================================================================

/*
ADMINISTRATEUR:
- Email: admin@test.com
- Mot de passe: password123

PROFESSEUR:
- Email: prof.martin@test.com  
- Mot de passe: password123

ÉTUDIANTS:
- Email: student@test.com / password123 (Marie Dupont)
- Email: alice@test.com / password123 (Alice Bernard)  
- Email: thomas@test.com / password123 (Thomas Leroy)

ASSISTANT:
- Email: julie@test.com / password123 (Julie Rousseau)

TOUS LES MOTS DE PASSE SONT: password123
*/