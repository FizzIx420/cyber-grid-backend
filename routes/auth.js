const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

const router = express.Router();

// Signup
router.post('/signup',
    [
        body('username').isLength({ min: 3 }).trim().escape(),
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;
        try {
            // Check if user already exists
            const [rows] = await db.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
            if (rows.length > 0) {
                return res.status(409).json({ error: 'User already exists.' });
            }

            // Hash password (scramble it)
            const hashedPassword = await bcrypt.hash(password, 10);
            // Insert new user
            const [result] = await db.query(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                [username, email, hashedPassword]
            );

            // Create a ticket (JWT)
            const token = jwt.sign(
                { id: result.insertId, username, is_admin: false },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                token,
                user: { id: result.insertId, username, email, is_admin: false }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error.' });
        }
    }
);

// Login – similar, checks password and gives a ticket
router.post('/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        try {
            const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (rows.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password.' });
            }

            const user = rows[0];
            const validPassword = await bcrypt.compare(password, user.password_hash);
            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid email or password.' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, is_admin: user.is_admin },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                token,
                user: { id: user.id, username: user.username, email: user.email, is_admin: user.is_admin }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error.' });
        }
    }
);

module.exports = router;