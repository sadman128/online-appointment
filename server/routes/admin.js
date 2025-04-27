const express = require('express');
const router = express.Router();
const pool = require('../db'); // assuming you export pool from a db.js file

// Create User
router.post('/create-user', async (req, res) => {
    const { name, username, password, role } = req.body;
    try {
        await pool.query('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', [name, username, password, role]);
        res.json({ message: 'User created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Edit User (update- password issue fixed)
// Update user name
router.put('/edit-user-name', async (req, res) => {
    const { username, newName } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedName = newName.trim();

        await pool.query('UPDATE users SET name = ? WHERE username = ?', [updatedName, username]);

        res.json({ message: 'Name updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating name' });
    }
});

// Update user password
router.put('/edit-user-password', async (req, res) => {
    const { username, newPassword } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedPassword = newPassword.trim();

        await pool.query('UPDATE users SET password = ? WHERE username = ?', [updatedPassword, username]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating password' });
    }
});

// Delete user
router.delete('/delete-user', async (req, res) => {
    const { username } = req.body;

    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await pool.query('DELETE FROM users WHERE username = ?', [username]);

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting user' });
    }
});



// View All Appointments
router.get('/appointments', async (req, res) => {
    try {
        const [appointments] = await pool.query(
            `SELECT id, doctor_username, patient_username, appointment_date, appointment_time, status FROM appointments`
        );
        if (appointments.length === 0) {
            return res.status(404).json({ message: 'Appointments not found' });
        }

        // Format the appointment date and time before sending to the frontend (optional)
        const formattedAppointments = appointments.map(app => ({
            ...app,
            formattedDate: new Date(app.appointment_date).toLocaleDateString(),
            formattedTime: new Date(`1970-01-01T${app.appointment_time}`).toLocaleTimeString(),
        }));

        res.json(formattedAppointments); // Send formatted data to the frontend
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving appointments' });
    }
});


// Edit Appointment
router.put('/edit-appointment', async (req, res) => {
    const { id, date, time, status } = req.body;
    try {
        await pool.query(
            'UPDATE appointments SET appointment_date = ?, appointment_time = ?, status = ? WHERE id = ?',
            [date, time, status, id]
        );
        res.json({ message: 'Appointment updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating appointment' });
    }
});



// Admin fetch booked slots for a date
router.get('/booked-slots', async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Missing date' });

    try {
        const [appointments] = await pool.query(
            'SELECT appointment_time FROM appointments WHERE appointment_date = ?',
            [date]
        );
        const bookedSlots = appointments.map(row => row.appointment_time.slice(0,5));
        res.json(bookedSlots);
    } catch (err) {
        console.error('Error fetching booked slots:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Fetch appointment details by ID
router.get('/appointment/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            'SELECT appointment_date, appointment_time, status FROM appointments WHERE id = ?',
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching appointment details' });
    }
});


// Delete Appointment
router.delete('/delete-appointment', async (req, res) => {
    const { id } = req.body;
    try {
        await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
        res.json({ message: 'Appointment deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting appointment' });
    }
});

module.exports = router;
