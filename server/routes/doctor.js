// doctor.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get appointments for a doctor
router.get('/appointments', async (req, res) => {
    const { username } = req.query;
    try {
        const [rows] = await pool.query(
            `SELECT a.id, a.appointment_date, a.appointment_time, a.status, a.description, a.phone_number, u.name as patient_name
             FROM appointments a JOIN users u ON a.patient_username = u.username
             WHERE a.doctor_username = ? ORDER BY a.appointment_date, a.appointment_time`,
            [username]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update appointment status
router.put('/appointments/:id/status', async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!status) return res.status(400).json({ message: 'Status required' });

    try {
        await pool.query(
            'UPDATE appointments SET status = ? WHERE id = ?',
            [status, id]
        );
        res.json({ message: 'Status updated successfully' });
    } catch (err) {
        console.error('Error updating status:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all doctor profiles for patients to view
router.get('/patient/doctor-info', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                d.username,
                u.name,
                d.contact_number,
                d.email,
                d.preferred_hour,
                d.education,
                d.expertise
            FROM doctor_profiles d
            JOIN users u ON d.username = u.username
        `);

        res.json(rows);
    } catch (err) {
        console.error('Error fetching doctor profiles:', err);
        res.status(500).json({ message: 'Failed to load doctor profiles' });
    }
});

// Get a doctor's profile (for pre-filling the form)
router.get('/profile', async (req, res) => {
    const { username } = req.query;
    try {
        const [rows] = await pool.query('SELECT * FROM doctor_profiles WHERE username = ?', [username]);
        if (rows.length === 0) {
            return res.json(null);
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching doctor profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Insert or update doctor profile
router.post('/update-profile', async (req, res) => {
    const { username, name, contact, email, hours, education, expertise } = req.body;

    try {
        const [rows] = await pool.query('SELECT username FROM doctor_profiles WHERE username = ?', [username]);
        if (rows.length > 0) {
            // Update existing profile
            await pool.query(
                'UPDATE doctor_profiles SET name = ?, contact_number = ?, email = ?, preferred_hour = ?, education = ?, expertise = ? WHERE username = ?',
                [name, contact, email, hours, education, expertise, username]
            );
        } else {
            // Insert new profile
            await pool.query(
                'INSERT INTO doctor_profiles (username, contact_number, email, preferred_hour, education, expertise) VALUES (?, ?, ?, ?, ?, ?)',
                [username, contact, email, hours, education, expertise]
            );
        }

        // Update name in users table
        await pool.query(
            'UPDATE users SET name = ? WHERE username = ?',
            [name, username]
        );

        res.json({ message: 'Profile saved successfully' });
    } catch (err) {
        console.error('Error saving doctor profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;
