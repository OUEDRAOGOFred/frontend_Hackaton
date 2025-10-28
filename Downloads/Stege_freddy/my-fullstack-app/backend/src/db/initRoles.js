const { Role } = require('../models');

async function initRoles() {
    try {
        // Define default roles
        const defaultRoles = [
            { name: 'admin' },
            { name: 'student' },
            { name: 'teacher' }
        ];

        // Create roles if they don't exist
        for (const role of defaultRoles) {
            await Role.findOrCreate({
                where: { name: role.name },
                defaults: role
            });
        }

        console.log('Roles initialized successfully');
    } catch (error) {
        console.error('Error initializing roles:', error);
    }
}

module.exports = initRoles;
