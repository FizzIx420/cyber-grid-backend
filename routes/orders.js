const express = require('express');
const auth = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

// POST /api/orders – create a new order from a list of product IDs
router.post('/', auth, async (req, res) => {
    const { productIds } = req.body; // e.g., [1, 5, 7]
    if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: 'No products provided.' });
    }

    const connection = await db.getConnection(); // start a transaction
    try {
        await connection.beginTransaction();

        // Get prices for all products in the list
        const placeholders = productIds.map(() => '?').join(',');
        const [products] = await connection.query(
            `SELECT id, price FROM products WHERE id IN (${placeholders})`,
            productIds
        );
        if (products.length === 0) {
            throw new Error('No valid products found.');
        }

        // Calculate total price
        const total = products.reduce((sum, p) => sum + parseFloat(p.price), 0);

        // Create the order
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total) VALUES (?, ?)',
            [req.user.id, total]
        );

        // Insert each product into order_items
        for (const prod of products) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, price) VALUES (?, ?, ?)',
                [orderResult.insertId, prod.id, prod.price]
            );
        }

        await connection.commit(); // save everything
        res.status(201).json({ orderId: orderResult.insertId, total });
    } catch (err) {
        await connection.rollback(); // undo if something failed
        console.error(err);
        res.status(500).json({ error: 'Order creation failed.' });
    } finally {
        connection.release();
    }
});

// GET /api/orders – get all orders for the logged‑in user
router.get('/', auth, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.*, 
                (SELECT JSON_ARRAYAGG(
                    JSON_OBJECT('product_id', oi.product_id, 'price', oi.price)
                ) FROM order_items oi WHERE oi.order_id = o.id) AS items
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Database error.' });
    }
});

module.exports = router;