const express = require('express');
const router = express.Router();
const db = require('../db/database');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/contact — public: submit contact message or book an appointment
router.post('/', (req, res) => {
  const {
    type = 'inquiry',
    name,
    email,
    phone,
    studentId,
    subject,
    message,
    preferredDate,
    preferredTime,
    purpose,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO contact_submissions (
        type, name, email, phone, student_id, subject, message, preferred_date, preferred_time, purpose, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      type === 'booking' ? 'booking' : 'inquiry',
      name.trim(),
      email.trim(),
      phone ? phone.trim() : null,
      studentId ? studentId.trim() : null,
      subject ? subject.trim() : (type === 'booking' ? `Office Hour Booking: ${purpose || 'Consultation'}` : 'General Inquiry'),
      message ? message.trim() : null,
      preferredDate ? preferredDate.trim() : null,
      preferredTime ? preferredTime.trim() : null,
      purpose ? purpose.trim() : null
    );

    const isBooking = type === 'booking';
    res.status(201).json({
      message: isBooking
        ? 'Your booking request has been received! Dr. Alhassan will review and follow up with you.'
        : 'Thank you! Your message has been sent to Dr. Alhassan.',
      id: result.lastInsertRowid,
    });
  } catch (err) {
    console.error('Contact submission error:', err);
    res.status(500).json({ error: 'Failed to submit message. Please try again.' });
  }
});

// GET /api/contact — admin only: view all contact inquiries and bookings
router.get('/', authMiddleware, (req, res) => {
  try {
    const { type, status } = req.query;
    let query = 'SELECT * FROM contact_submissions';
    const conditions = [];
    const params = [];

    if (type) {
      conditions.push('type = ?');
      params.push(type);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching contact submissions:', err);
    res.status(500).json({ error: 'Could not fetch submissions.' });
  }
});

// PATCH /api/contact/:id/status — admin only: update status (e.g., reviewed, confirmed, archived)
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  try {
    const stmt = db.prepare('UPDATE contact_submissions SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    res.json({ message: 'Status updated successfully.', status });
  } catch (err) {
    console.error('Error updating status:', err);
    res.status(500).json({ error: 'Could not update status.' });
  }
});

// DELETE /api/contact/:id — admin only: delete a submission
router.delete('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  try {
    const result = db.prepare('DELETE FROM contact_submissions WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }
    res.json({ message: 'Submission deleted.' });
  } catch (err) {
    console.error('Error deleting submission:', err);
    res.status(500).json({ error: 'Could not delete submission.' });
  }
});

module.exports = router;
