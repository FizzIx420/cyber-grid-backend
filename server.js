require('dotenv').config();              // Read secrets from .env
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();                   // Create the brain

// Middleware (guards)
app.use(helmet());                        // Put a helmet on
app.use(cors({})); // Allow your frontend to talk
app.use(express.json());                   // Understand JSON messages

// Rate limiter – don't let anyone spam too many requests
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100                  // each IP can make 100 requests per 15 minutes
});
app.use('/api/', limiter);

// Connect to the database (we'll create this file next)
const db = require('./config/db');

// Plug in the routes (different parts of the brain)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/product'));
app.use('/api/ai-projects', require('./routes/aiProjects'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/contact', require('./routes/contact'));

// Error handling (if something goes wrong)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the brain listening (only locally)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export the app for Vercel
module.exports = app;