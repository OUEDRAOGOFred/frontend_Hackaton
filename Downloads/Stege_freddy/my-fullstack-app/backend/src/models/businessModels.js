const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Modèle User (étendu de newModels.js)
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
    total_points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    current_level: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    last_login: DataTypes.DATE
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
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    max_students: DataTypes.INTEGER,
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'archived'),
        defaultValue: 'active'
    },
    syllabus: DataTypes.TEXT,
    prerequisites: DataTypes.TEXT
}, {
    tableName: 'courses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Modèle Enrollment (Inscription)
const Enrollment = sequelize.define('Enrollment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'courses',
            key: 'id'
        }
    },
    enrollment_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'dropped', 'pending'),
        defaultValue: 'active'
    },
    final_grade: DataTypes.DECIMAL(5, 2)
}, {
    tableName: 'course_enrollments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['student_id', 'course_id']
        }
    ]
});

// Modèle Assignment (Devoir)
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
    submission_format: {
        type: DataTypes.ENUM('file', 'text', 'url', 'mixed'),
        defaultValue: 'file'
    },
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

// Modèle Submission (Soumission)
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
    file_url: DataTypes.STRING(500),
    attachments: DataTypes.JSON,
    status: {
        type: DataTypes.ENUM('draft', 'submitted', 'graded', 'returned'),
        defaultValue: 'draft'
    },
    submitted_at: DataTypes.DATE,
    is_late: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'submissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['assignment_id', 'student_id']
        }
    ]
});

// Modèle Grade (Note)
const Grade = sequelize.define('Grade', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    submission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'submissions',
            key: 'id'
        }
    },
    grade_value: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 0,
            max: 100
        }
    },
    comment: DataTypes.TEXT,
    graded_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    graded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'grades',
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
    action_url: DataTypes.STRING(500)
}, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Définition des associations
// User - Role
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Course - Teacher
Course.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
User.hasMany(Course, { foreignKey: 'teacher_id', as: 'courses' });

// Enrollment associations
Enrollment.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
User.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });

// Assignment - Course
Assignment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Course.hasMany(Assignment, { foreignKey: 'course_id', as: 'assignments' });

// Submission associations
Submission.belongsTo(Assignment, { foreignKey: 'assignment_id', as: 'assignment' });
Submission.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Assignment.hasMany(Submission, { foreignKey: 'assignment_id', as: 'submissions' });
User.hasMany(Submission, { foreignKey: 'student_id', as: 'submissions' });

// Grade associations
Grade.belongsTo(Submission, { foreignKey: 'submission_id', as: 'submission' });
Grade.belongsTo(User, { foreignKey: 'graded_by', as: 'grader' });
Submission.hasOne(Grade, { foreignKey: 'submission_id', as: 'grade' });

// Notification - User
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

module.exports = {
    User,
    Role,
    Course,
    Enrollment,
    Assignment,
    Submission,
    Grade,
    Notification,
    sequelize
};