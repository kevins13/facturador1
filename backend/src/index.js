const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = 3000;

// ─── Security Headers (TC-SEC-004) ─────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// ─── Body Parser (limit payload size) ───────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Rate Limiting Global (TC-SEC-005) ──────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiadas solicitudes, por favor intente más tarde.' },
});
app.use(globalLimiter);

// ─── Rate Limiting estricto en Auth (Anti Brute-Force) ──────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados intentos de login, intente nuevamente en 15 minutos.' },
    skipSuccessfulRequests: true, // solo cuenta los fallos
});

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/auth.routes'));
app.use('/api/clients', require('./routes/client.routes'));
app.use('/api/invoices', require('./routes/invoice.routes'));
app.use('/api/products', require('./routes/product.routes'));

app.get('/ping', (req, res) => {
    res.json({ pong: true, message: 'Backend successfully running!' });
});

app.get('/', (req, res) => {
    res.send('AuraLink Facturación API');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} at 0.0.0.0`);
});
