const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Modèle User
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    phone: DataTypes.STRING(20),
    date_of_birth: DataTypes.DATE,
    profile_picture: DataTypes.STRING(500),
    role_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id'
        }
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    phone_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    gdpr_consent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    gdpr_consent_date: DataTypes.DATE,
    last_login: DataTypes.DATE,
    last_activity: DataTypes.DATE,
    password_changed_at: DataTypes.DATE,
    total_points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    current_level: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    badges_earned: DataTypes.JSON,
    notification_preferences: DataTypes.JSON,
    timezone: {
        type: DataTypes.STRING(50),
        defaultValue: 'UTC'
    },
    language_preference: {
        type: DataTypes.STRING(10),
        defaultValue: 'fr'
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Modèle Role
const Role = sequelize.define('Role', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    description: DataTypes.TEXT,
    permissions: DataTypes.JSON
}, {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Modèle Course
const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: DataTypes.TEXT,
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    credits: {
        type: DataTypes.INTEGER,
        defaultValue: 3
    },
    teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    department_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'departments',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'archived'),
        defaultValue: 'active'
    },
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    max_students: DataTypes.INTEGER,
    syllabus: DataTypes.TEXT,
    prerequisites: DataTypes.TEXT
}, {
    tableName: 'courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Modèle Assignment
const Assignment = sequelize.define('Assignment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: DataTypes.TEXT,
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'courses',
            key: 'id'
        }
    },
    due_date: DataTypes.DATE,
    max_points: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    type: {
        type: DataTypes.ENUM('individual', 'group', 'exam', 'project'),
        defaultValue: 'individual'
    },
    status: {
        type: DataTypes.ENUM('draft', 'published', 'closed'),
        defaultValue: 'draft'
    },
    instructions: DataTypes.TEXT,
    attachments: DataTypes.JSON,
    submission_format: DataTypes.ENUM('file', 'text', 'url', 'mixed'),
    allow_late_submission: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    late_penalty: DataTypes.DECIMAL(5, 2)
}, {
    tableName: 'assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Modèle Submission
const Submission = sequelize.define('Submission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'assignments',
            key: 'id'
        }
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    content: DataTypes.TEXT,
    attachments: DataTypes.JSON,
    status: {
        type: DataTypes.ENUM('draft', 'submitted', 'graded', 'returned'),
        defaultValue: 'draft'
    },
    points_earned: DataTypes.INTEGER,
    feedback: DataTypes.TEXT,
    graded_by: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    graded_at: DataTypes.DATE,
    is_late: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'submissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Modèle Notification
const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('info', 'warning', 'success', 'error', 'assignment', 'grade', 'system'),
        defaultValue: 'info'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    read_at: DataTypes.DATE,
    related_entity_type: DataTypes.STRING(50),
    related_entity_id: DataTypes.INTEGER,
    action_url: DataTypes.STRING(500),
    expires_at: DataTypes.DATE
}, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Définir les associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

Course.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
User.hasMany(Course, { foreignKey: 'teacher_id', as: 'courses' });

Assignment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Course.hasMany(Assignment, { foreignKey: 'course_id', as: 'assignments' });

Submission.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' });
Submission.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Submission.belongsTo(User, { foreignKey: 'graded_by', as: 'grader' });

Assignment.hasMany(Submission, { foreignKey: 'assignment_id', as: 'submissions' });
User.hasMany(Submission, { foreignKey: 'student_id', as: 'submissions' });

Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

module.exports = {
    User,
    Role,
    Course,
    Assignment,
    Submission,
    Notification,
    sequelize
};