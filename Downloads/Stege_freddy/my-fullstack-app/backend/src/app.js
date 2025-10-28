const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./config/db');
const routes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const swaggerRouter = require('./routes/swagger');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection and sync
const initRoles = require('./db/initRoles');
const createTestUser = require('./db/createTestUser');

async function initializeDatabase() {
    try {
        await db.authenticate();
        console.log('Database connected successfully');
        
        // CAUTION: Using force:true will drop and recreate tables - only use in development
        await db.sync({ force: true });
        console.log('Database tables dropped and recreated');
        
        await initRoles();
        console.log('Roles initialized');
        
        await createTestUser();
        console.log('Test user setup completed');
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

initializeDatabase();

// Routes
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// API Routes
app.use('/api', routes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calendar', calendarRoutes);

// Documentation
app.use('/api', swaggerRouter);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});