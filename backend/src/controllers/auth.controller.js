const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { users, clients, invoices, invoiceItems: invoice_items, products } = require('../db/schema');
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
        // Clear existing mock data to avoid duplicates
        await db.delete(invoice_items);
        await db.delete(invoices);
        await db.delete(clients);
        await db.delete(products);

        // Insert products
        const productData = [
            { name: 'Aplicación ERP', code: 'APP-ERP', price: 300000, stock: 99 },
            { name: 'E-commerce', code: 'ECOMM', price: 40000, stock: 99 },
            { name: 'Bot', code: 'BOT-01', price: 35000, stock: 99 },
            { name: 'Landing Page', code: 'LANDING', price: 30000, stock: 99 },
            { name: 'Soporte Técnico', code: 'SOPORTE', price: 35000, stock: 99 }
        ];
        
        const insertedProducts = [];
        for (const p of productData) {
            const res = await db.insert(products).values(p).returning({ id: products.id, name: products.name, price: products.price });
            insertedProducts.push(res[0]);
        }

        // Realistic client names
        const clientNames = [
            'Juan Pérez', 'TechSolutions SRL', 'María Gómez', 'Consultora Integral', 
            'Carlos Rodríguez', 'Laura Fernández', 'Innovación Digital', 'Agencia Creativa', 
            'Martín Soler', 'Lucía Blanco', 'Estudio Jurídico López', 'Distribuidora Central', 
            'Andrés Martínez', 'Sofía Castillo', 'Global Imports', 'Gastronomía Gourmet', 
            'Diego Herrera', 'Valeria Romero', 'Farmacia del Centro', 'Constructora Moderna'
        ];

        // Create 20 mock clients
        const clientIds = [];
        for (let i = 0; i < 20; i++) {
            const newClient = await db.insert(clients).values({
                name: clientNames[i],
                email: `contacto${i}@dominio.com`,
                phone: `11223344${i.toString().padStart(2, '0')}`,
                address: `Av. Falsa 12${i}`,
                cuit: `30-12345678-${i % 9}`,
                createdAt: new Date()
            }).returning({ id: clients.id });
            clientIds.push(newClient[0].id);
        }

        // Generate incremental invoices over the last 6 months
        for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
            const targetClients = 20 - monthOffset;
            
            for (let i = 0; i < targetClients; i++) {
                const clientId = clientIds[i];
                const date = new Date();
                date.setMonth(date.getMonth() - monthOffset);
                date.setDate(Math.floor(Math.random() * 28) + 1);

                // Pick a random product
                const product = insertedProducts[Math.floor(Math.random() * insertedProducts.length)];
                const amount = product.price;

                const taxRate = 21;
                const taxAmount = amount * (taxRate / 100);
                const totalAmount = amount + taxAmount;

                const inv = await db.insert(invoices).values({
                    clientId: clientId,
                    date: date,
                    status: 'paid',
                    subtotal: amount,
                    taxTotal: taxAmount,
                    total: totalAmount,
                    createdAt: new Date()
                }).returning({ id: invoices.id });

                await db.insert(invoice_items).values({
                    invoiceId: inv[0].id,
                    description: product.name,
                    quantity: 1,
                    price: amount,
                    taxRate: taxRate,
                    taxAmount: taxAmount,
                    subtotal: amount
                });
            }
        }

        res.json({ message: '20 clientes reales, catálogo de productos y facturas generadas incrementalmente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generando datos', details: error.message, stack: error.stack });
    }
};

module.exports = { login, me, populate };
