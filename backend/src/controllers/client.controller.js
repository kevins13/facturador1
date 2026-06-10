const db = require('../db');
const { clients } = require('../db/schema');
const { eq, desc } = require('drizzle-orm');

const getAll = async (req, res) => {
    try {
        const result = await db.select().from(clients).orderBy(desc(clients.createdAt));
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener clientes' });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.select().from(clients).where(eq(clients.id, parseInt(id)));

        if (result.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
        
        res.json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener cliente' });
    }
};

const create = async (req, res) => {
    try {
        const { name, email, phone, address, cuit } = req.body;

        // Validación de campos requeridos (TC-CLIENT-007)
        const missing = ['name', 'email', 'phone', 'address', 'cuit'].filter(f => !req.body[f]);
        if (missing.length > 0) {
            return res.status(400).json({
                message: 'Faltan campos requeridos',
                fields: missing
            });
        }

        const result = await db.insert(clients).values({
            name, email, phone, address, cuit
        }).returning();
        res.status(201).json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear cliente' });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, address, cuit } = req.body;

        // Validación de campos requeridos
        const missing = ['name', 'email', 'phone', 'address', 'cuit'].filter(f => !req.body[f]);
        if (missing.length > 0) {
            return res.status(400).json({
                message: 'Faltan campos requeridos',
                fields: missing
            });
        }

        const result = await db.update(clients)
            .set({ name, email, phone, address, cuit })
            .where(eq(clients.id, parseInt(id)))
            .returning();

        if (result.length === 0) return res.status(404).json({ message: 'Cliente no encontrado' });
            
        res.json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar cliente' });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        await db.delete(clients).where(eq(clients.id, parseInt(id)));
        res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar cliente' });
    }
};

module.exports = { getAll, getById, create, update, remove };
