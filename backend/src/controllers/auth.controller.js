const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { users } = require('../db/schema');
const { eq } = require('drizzle-orm');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const userRes = await db.select().from(users).where(eq(users.email, email));
        if (userRes.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
        
        const user = userRes[0];
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret_token_123',
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

const me = async (req, res) => {
    try {
        const userRes = await db.select({ id: users.id, email: users.email, role: users.role })
            .from(users).where(eq(users.id, req.user.id));
            
        if (userRes.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
        
        res.json({ user: userRes[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = { login, me };
