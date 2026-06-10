const db = require('../db');
const { invoices, invoiceItems, clients } = require('../db/schema');
const { eq, desc, and, gte, sum, sql } = require('drizzle-orm');
const pdfService = require('../services/pdf.service');
const nodemailer = require('nodemailer');

const getAll = async (req, res) => {
    try {
        const result = await db.query.invoices.findMany({
            with: { client: true },
            orderBy: [desc(invoices.createdAt)]
        });
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener facturas' });
    }
};

const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query.invoices.findFirst({
            where: eq(invoices.id, parseInt(id)),
            with: {
                client: true,
                items: true
            }
        });

        if (!result) return res.status(404).json({ message: 'Factura no encontrada' });
        
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener factura' });
    }
};

const create = async (req, res) => {
    try {
        const { clientId, items, type = 'invoice', discount = 0 } = req.body;

        if (!clientId) {
            return res.status(400).json({ message: 'El campo clientId es requerido' });
        }
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Se requiere al menos un ítem en la factura' });
        }
        for (const item of items) {
            if (!item.description || !item.quantity || !item.price) {
                return res.status(400).json({
                    message: 'Cada ítem debe tener description, quantity y price'
                });
            }
        }
        
        let subtotalAccum = 0;
        let taxTotalAccum = 0;
        const processedItems = items.map(item => {
            const itemSubtotal = parseInt(item.quantity) * parseFloat(item.price);
            const itemTaxRate = parseFloat(item.taxRate) || 0;
            const itemTaxAmount = itemSubtotal * (itemTaxRate / 100);
            
            subtotalAccum += itemSubtotal;
            taxTotalAccum += itemTaxAmount;
            
            return {
                description: item.description,
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price),
                taxRate: itemTaxRate,
                taxAmount: itemTaxAmount,
                subtotal: itemSubtotal
            };
        });

        const discountValue = parseFloat(discount) || 0;
        const totalAccum = subtotalAccum + taxTotalAccum - discountValue;

        const invoiceData = await db.transaction(async (tx) => {
            const newInvoiceRes = await tx.insert(invoices).values({
                clientId: parseInt(clientId),
                type,
                discount: discountValue,
                subtotal: subtotalAccum,
                taxTotal: taxTotalAccum,
                total: totalAccum
            }).returning();
            
            const newInvoiceId = newInvoiceRes[0].id;
            
            const itemsToInsert = processedItems.map(item => ({
                ...item,
                invoiceId: newInvoiceId
            }));

            await tx.insert(invoiceItems).values(itemsToInsert);
            
            return newInvoiceId;
        });

        // Obtener comprobante totalmente creado usando relational query
        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.id, invoiceData),
            with: {
                client: true,
                items: true
            }
        });

        res.status(201).json(invoice);
    } catch (error) {
        console.error(error);
        // FK violation: clientId inexistente
        if (error.code === '23503') {
            return res.status(400).json({ message: 'El cliente especificado no existe' });
        }
        res.status(500).json({ message: 'Error al crear factura' });
    }
};

const markAsPaid = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la factura existe antes de actualizar
        const existing = await db.query.invoices.findFirst({
            where: eq(invoices.id, parseInt(id))
        });
        if (!existing) return res.status(404).json({ message: 'Factura no encontrada' });

        const result = await db.update(invoices)
            .set({ status: 'paid' })
            .where(eq(invoices.id, parseInt(id)))
            .returning();
        res.json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar estado de factura' });
    }
};

const downloadPDF = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.id, parseInt(id)),
            with: {
                client: true,
                items: true
            }
        });

        if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });

        const pdfBuffer = await pdfService.generateInvoicePDF(invoice);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura-${invoice.id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar el PDF' });
    }
};

const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.delete(invoices)
            .where(eq(invoices.id, parseInt(id)))
            .returning();
        if (result.length === 0) return res.status(404).json({ message: 'Factura no encontrada' });
        res.json({ message: 'Factura eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar factura' });
    }
};

const convertToInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.update(invoices)
            .set({ type: 'invoice', date: new Date() })
            .where(eq(invoices.id, parseInt(id)))
            .returning();
        if (result.length === 0) return res.status(404).json({ message: 'Presupuesto no encontrado' });
        res.json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al convertir a factura' });
    }
};

const sendInvoiceEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.id, parseInt(id)),
            with: { client: true, items: true }
        });

        if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });

        const pdfBuffer = await pdfService.generateInvoicePDF(invoice);

        // Send with ethereal email for testing
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });

        const info = await transporter.sendMail({
            from: '"AuraLink" <no-reply@auralink.com>',
            to: invoice.client.email,
            subject: `Factura #${invoice.id} - AuraLink`,
            text: `Hola ${invoice.client.name}, adjuntamos su factura.`,
            attachments: [{
                filename: `factura-${invoice.id}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }]
        });

        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        res.json({ message: 'Email enviado exitosamente', previewUrl: nodemailer.getTestMessageUrl(info) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al enviar el email' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        
        // Use raw SQL or simple logic since complex Drizzle aggregations can be tricky
        const allInvoices = await db.query.invoices.findMany({
            where: eq(invoices.type, 'invoice')
        });

        let totalThisMonth = 0;
        let totalLastMonth = 0;
        let pendingTotal = 0;
        let paidTotal = 0;
        const last6Months = {};

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            last6Months[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0;
        }

        for (const inv of allInvoices) {
            const invDate = new Date(inv.date || inv.createdAt);
            const amt = inv.total;

            if (invDate >= startOfMonth) totalThisMonth += amt;
            else if (invDate >= startOfLastMonth && invDate < startOfMonth) totalLastMonth += amt;

            if (inv.status === 'pending') pendingTotal += amt;
            if (inv.status === 'paid') paidTotal += amt;

            const monthKey = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}`;
            if (last6Months[monthKey] !== undefined) {
                last6Months[monthKey] += amt;
            }
        }

        const chartData = Object.keys(last6Months).map(key => ({
            name: key,
            income: last6Months[key]
        }));

        res.json({
            totalThisMonth,
            totalLastMonth,
            pendingTotal,
            paidTotal,
            chartData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
};

module.exports = { getAll, getById, create, markAsPaid, downloadPDF, remove, convertToInvoice, sendInvoiceEmail, getDashboardStats };
