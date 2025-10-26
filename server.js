const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'justinstruments',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

let pool;

// Initialize database connection
async function initDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('✅ Database connection established');
        
        // Test connection
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        console.log('✅ Database ping successful');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        // Continue without database for static file serving
    }
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        
        // Demo credentials for development
        const demoCredentials = {
            admin: { email: 'admin@justinstruments.com', password: 'admin123' },
            staff: { username: 'staff001', password: 'staff123' }
        };

        let isValid = false;
        let user = null;

        if (email && password) {
            // Admin login
            if (email === demoCredentials.admin.email && password === demoCredentials.admin.password) {
                isValid = true;
                user = { id: 1, email, role: 'admin', name: 'System Administrator' };
            }
        } else if (username && password) {
            // Staff login
            if (username === demoCredentials.staff.username && password === demoCredentials.staff.password) {
                isValid = true;
                user = { id: 2, username, role: 'staff', name: 'Calibration Technician' };
            }
        }

        if (isValid) {
            const token = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    email: user.email || null,
                    username: user.username || null
                }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dashboard data route
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const dashboardData = {
            stats: {
                totalCertificates: 1247,
                validCertificates: 1156,
                expiringCertificates: 23,
                expiredCertificates: 68,
                totalCustomers: 247,
                totalInstruments: 189,
                monthlyRevenue: 43630,
                growthRate: 15.2
            },
            recentActivity: [
                { id: 1, type: 'certificate', message: 'Certificate JIC-20241201-001 created', timestamp: '2024-12-01T10:30:00Z' },
                { id: 2, type: 'customer', message: 'New customer ABC Industries added', timestamp: '2024-12-01T09:15:00Z' },
                { id: 3, type: 'instrument', message: 'Digital Multimeter calibrated', timestamp: '2024-12-01T08:45:00Z' }
            ],
            upcomingRenewals: [
                { id: 1, certificate: 'JIC-20241115-089', customer: 'XYZ Corp', expiryDate: '2024-12-15' },
                { id: 2, certificate: 'JIC-20241120-134', customer: 'DEF Ltd', expiryDate: '2024-12-20' }
            ]
        };

        res.json(dashboardData);
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'modern-login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'modern-dashboard.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
    await initDatabase();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📱 Application: http://localhost:${PORT}`);
        console.log(`🔧 API: http://localhost:${PORT}/api`);
        console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    if (pool) {
        pool.end();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    if (pool) {
        pool.end();
    }
    process.exit(0);
});

startServer().catch(console.error);