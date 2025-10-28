const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Define User model
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

// Define Role model
const Role = sequelize.define('Role', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

// Define Project model
const Project = sequelize.define('Project', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    }
});

// Define Token model
const Token = sequelize.define('Token', {
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    }
});

// Define Notification model
const Notification = sequelize.define('Notification', {
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('email', 'sms', 'push', 'calendar'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed'),
        defaultValue: 'pending'
    },
    scheduledFor: {
        type: DataTypes.DATE,
        allowNull: true
    }
});

// Define associations
User.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(User, { foreignKey: 'roleId' });

// Export models
module.exports = {
    User,
    Role,
    Project,
    Token,
    Notification
};