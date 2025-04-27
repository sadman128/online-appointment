const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from ../src
app.use(express.static(path.join(__dirname, '../src')));

// Routes
const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

const doctorRoutes = require('./routes/doctor');
app.use('/doctor', doctorRoutes);

const patientRoutes = require('./routes/patient');
app.use('/patient', patientRoutes);

// MySQL connection
const pool = mysql.createPool({
    host: 'mysql-taskmanger-d-taskmanager-discord.i.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_Yv7-InPPJR6qBVfgU0W',
    database: 'hospital_appointment',
    port: 18996,
    ssl: {
        rejectUnauthorized: false
    }
}).promise();

// Test DB connection
pool.query('SELECT 1')
    .then(() => console.log('✅ Connected to MySQL'))
    .catch(err => console.error('❌ Failed to connect to MySQL:', err));

// Login API
app.post('/api/login', async (req, res) => {
    const { username, password, role } = req.body;

    try {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE username = ? AND password = ? AND role = ?',
            [username, password, role]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials or role' });
        }

        const user = rows[0];
        let redirectTo = '';

        switch (user.role) {
            case 'admin':
                redirectTo = '/admin/dashboard.html';
                break;
            case 'doctor':
                redirectTo = '/doctor/dashboard.html';
                break;
            case 'patient':
                redirectTo = '/patient/dashboard.html';
                break;
            default:
                return res.status(400).json({ message: 'Unknown role' });
        }

        res.json({ redirect: redirectTo });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
