const express = require('express');
const router = express.Router();
const pool = require('../db'); // db.js exports your mysql2 pool

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

// Edit User (name)
router.put('/edit-user-name', async (req, res) => {
    const { username, newName } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        await pool.query('UPDATE users SET name = ? WHERE username = ?', [newName.trim(), username]);
        res.json({ message: 'Name updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating name' });
    }
});

// Edit User (password)
router.put('/edit-user-password', async (req, res) => {
    const { username, newPassword } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        await pool.query('UPDATE users SET password = ? WHERE username = ?', [newPassword.trim(), username]);
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating password' });
    }
});

// Delete User
router.delete('/delete-user', async (req, res) => {
    const { username } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

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
            'SELECT id, doctor_username, patient_username, appointment_date, appointment_time, status FROM appointments'
        );

        // Format the appointment date as yyyy-MM-dd for HTML input compatibility
        appointments.forEach(appointment => {
            const localDate = new Date(appointment.appointment_date);
            const formattedDate = localDate.getFullYear() + '-' +
                String(localDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(localDate.getDate()).padStart(2, '0');
            appointment.appointment_date = formattedDate;
        });

        res.json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error retrieving appointments' });
    }
});




// Edit Appointment
router.put('/edit-appointment', async (req, res) => {
    const { id, date, time, status } = req.body;
    try {
        const [current] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
        if (current.length === 0) return res.status(404).json({ message: 'Appointment not found' });

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

// Fetch Booked Slots
router.get('/booked-slots', async (req, res) => {
    const { date, doctor } = req.query;
    if (!date || !doctor) return res.status(400).json({ message: 'Missing date or doctor' });

    try {
        const [appointments] = await pool.query(
            'SELECT appointment_time FROM appointments WHERE appointment_date = ? AND doctor_username = ?',
            [date, doctor]
        );
        const bookedSlots = appointments.map(a => a.appointment_time.slice(0,5));
        res.json(bookedSlots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching booked slots' });
    }
});

module.exports = router;
