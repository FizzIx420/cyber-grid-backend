const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const db = require('../config/db');

const router = express.Router();

// GET all products – anyone can see
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products ORDER BY id DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// GET one product – anyone can see
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// POST new product – only admin (needs auth + admin)
router.post('/', auth, admin, async (req, res) => {
    const { title, category, tag, img, description, price } = req.body;
    if (!title || !price) {
        return res.status(400).json({ error: 'Title and price are required.' });
    }
    try {
        const [result] = await db.query(
            'INSERT INTO products (title, category, tag, img, description, price) VALUES (?, ?, ?, ?, ?, ?)',
            [title, category, tag, img, description, price]
        );
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// PUT (update) product – admin only
router.put('/:id', auth, admin, async (req, res) => {
    const { title, category, tag, img, description, price } = req.body;
    try {
        await db.query(
            'UPDATE products SET title=?, category=?, tag=?, img=?, description=?, price=? WHERE id=?',
            [title, category, tag, img, description, price, req.params.id]
        );
        res.json({ message: 'Product updated.' });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

// DELETE product – admin only
router.delete('/:id', auth, admin, async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

module.exports = router;