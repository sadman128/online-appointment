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


// --------------------------------------------------------------------------------------------------------------

const axios = require('axios');

// Telegram Bot Token (replace with your actual bot token)
const TELEGRAM_BOT_TOKEN = '7917966818:AAFolB7yBFrVfGRs1HvVNN2upZ1ERqYfz44';  // Replace with your bot token

// Webhook for receiving Telegram messages
app.post('/telegram/webhook', async (req, res) => {
    const update = req.body;

    if (!update.message || !update.message.chat) {
        return res.sendStatus(200); // Ignore non-message updates
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();

    console.log(`📩 Message received from chat ID ${chatId}: ${text}`);

    try {
        // Check if the user is sending a phone number
        const phoneNumber = text

        // Search for a doctor with the given phone number
        const [doctorRows] = await pool.query(
            'SELECT * FROM doctor_profiles WHERE contact_number = ?',
            [phoneNumber]
        );

        if (doctorRows.length > 0) {
            // If the doctor exists, save the chat ID to their profile
            await pool.query(
                'UPDATE doctor_profiles SET telegram = ? WHERE contact_number = ?',
                [chatId, phoneNumber]
            );

            console.log(`✅ Saved chat ID for phone number: ${phoneNumber}.`);

            // Notify the doctor
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: `✅ Hey ${doctorRows[0].name} Your Telegram account has been linked successfully! You will receive all appointments notification here. You dont need to message unless you want to change your number`
            });

        } else {
            // If no doctor found, notify the user
            console.log(`❌ No doctor found with phone number: ${phoneNumber}`);

            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: `❌ Phone number not found in the system. Please register your phone number bye typing your number with country code (eg: +88018XXXXXXXXX). `
            });
        }
    } catch (err) {
        console.error('❌ Error handling message:', err);
    }

    res.sendStatus(200);
});





