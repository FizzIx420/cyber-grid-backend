const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

const router = express.Router();

router.post('/',
    [
        body('name').notEmpty().trim().escape(),
        body('email').isEmail().normalizeEmail(),
        body('message').notEmpty().trim().escape()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, message } = req.body;
        try {
            await db.query(
                'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
                [name, email, message]
            );
            // Optional: send an email notification here
            res.status(201).json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Database error.' });
        }
    }
);

module.exports = router;