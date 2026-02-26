const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// GET chat history for logged‑in user
router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT sender, message, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// POST a new message (user or bot)
router.post('/', auth, async (req, res) => {
    const { sender, message } = req.body;
    if (!['user', 'bot'].includes(sender) || !message) {
        return res.status(400).json({ error: 'Invalid data.' });
    }
    try {
        await db.query(
            'INSERT INTO chat_messages (user_id, sender, message) VALUES (?, ?, ?)',
            [req.user.id, sender, message]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

module.exports = router;