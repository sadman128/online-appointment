const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all doctors
router.get('/doctors', async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT username, name FROM users WHERE role = 'doctor'");
        res.json(rows);
    } catch (err) {
        console.error('Error fetching doctors:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get available slots for a doctor on a specific date
router.get('/available-slots', async (req, res) => {
    const { doctor, date } = req.query;
    if (!doctor || !date) return res.status(400).json({ message: 'Missing doctor or date' });

    const allSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
        '20:00', '20:30', '21:00', '21:30', '22:00'
    ];

    try {
        const [appointments] = await pool.query(
            'SELECT appointment_time FROM appointments WHERE doctor_username = ? AND appointment_date = ?',
            [doctor, date]
        );

        const bookedSlots = appointments.map(row => row.appointment_time.slice(0, 5));

        // If today, remove past time slots
        const today = new Date().toISOString().split('T')[0];
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();

        let filteredSlots = allSlots;
        if (date === today) {
            filteredSlots = allSlots.filter(slot => {
                const [hour, minute] = slot.split(':').map(Number);
                return hour > currentHour || (hour === currentHour && minute > currentMinute);
            });
        }

        const availableSlots = filteredSlots.filter(slot => !bookedSlots.includes(slot));

        res.json(availableSlots);
    } catch (err) {
        console.error('Error checking available slots:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Book an appointment (edited again with phone number -sajid)
router.post('/book-appointment', async (req, res) => {
    const { username, doctor, date, time, description, phone } = req.body;

    if (!username || !doctor || !date || !time || !phone) {
        return res.status(400).json({ message: 'All fields are required, including phone number' });
    }

    try {
        const [existing] = await pool.query(
            'SELECT * FROM appointments WHERE doctor_username = ? AND appointment_date = ? AND appointment_time = ?',
            [doctor, date, time]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Time slot already booked' });
        }

        await pool.query(
            'INSERT INTO appointments (patient_username, doctor_username, appointment_date, appointment_time, status, description, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, doctor, date, time, 'pending', description || null, phone]
        );

        res.json({ message: 'Appointment booked successfully' });
    } catch (err) {
        console.error('Booking error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});



// Get appointments for a patient
router.get('/my-appointments', async (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).json({ message: 'Missing username' });

    try {
        const [appointments] = await pool.query(
            `SELECT 
        a.appointment_date, 
        a.appointment_time, 
        a.status, 
        u.name AS doctor_name 
       FROM appointments a
       JOIN users u ON a.doctor_username = u.username
       WHERE a.patient_username = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
            [username]
        );

        res.json(appointments);
    } catch (err) {
        console.error('Error fetching patient appointments:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all doctor profiles for patients to view
router.get('/doctor-info', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT username, name, contact_number, email, preferred_hour, education, expertise FROM doctor_profiles ;'
        );
        res.json(rows);
    } catch (err) {
        console.error('Error fetching doctor profiles:', err);
        res.status(500).json({ message: 'Failed to load doctor profiles' });
    }
});

module.exports = router;