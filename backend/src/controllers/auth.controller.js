const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { users, clients, invoices, invoiceItems: invoice_items } = require('../db/schema');
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

const populate = async (req, res) => {
    try {
        // Create 20 mock clients
        const clientIds = [];
        for (let i = 1; i <= 20; i++) {
            const newClient = await db.insert(clients).values({
                name: `Cliente Empresa ${i} SA`,
                email: `contacto${i}@empresa${i}.com`,
                phone: `11223344${i.toString().padStart(2, '0')}`,
                address: `Av. Siempre Viva ${100 + i}`,
                cuit: `30-12345678-${i % 9}`,
                createdAt: new Date()
            }).returning({ id: clients.id });
            clientIds.push(newClient[0].id);
        }

        // Generate invoices over the last 6 months to simulate growth
        // Month 0 (current): 20 clients
        // Month -1: 19 clients
        // Month -2: 18 clients
        // Month -3: 17 clients
        // Month -4: 16 clients
        // Month -5: 15 clients

        const amounts = [30000, 35000, 40000];

        for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
            const targetClients = 20 - monthOffset;
            
            // For each of the target clients, create an invoice for this month
            for (let i = 0; i < targetClients; i++) {
                const clientId = clientIds[i];
                const date = new Date();
                date.setMonth(date.getMonth() - monthOffset);
                date.setDate(Math.floor(Math.random() * 28) + 1); // Random day

                const amount = amounts[Math.floor(Math.random() * amounts.length)];

                const inv = await db.insert(invoices).values({
                    clientId: clientId,
                    date: date,
                    status: 'paid',
                    total: amount,
                    createdAt: new Date()
                }).returning({ id: invoices.id });

                await db.insert(invoice_items).values({
                    invoiceId: inv[0].id,
                    description: `Servicios Profesionales - Mes ${date.getMonth() + 1}`,
                    quantity: 1,
                    price: amount,
                    subtotal: amount
                });
            }
        }

        res.json({ message: '20 clientes y facturas generados con éxito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generando datos', details: error.message, stack: error.stack });
    }
};

module.exports = { login, me, populate };
