const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM ai_projects ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

module.exports = router;