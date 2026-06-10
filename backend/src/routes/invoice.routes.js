const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { authMiddleware, isAdmin } = require('../middleware/auth.middleware');

router.use(authMiddleware); // Protect all invoice routes

router.get('/', invoiceController.getAll);
router.get('/stats', invoiceController.getDashboardStats); // Must be before /:id
router.get('/:id', invoiceController.getById);
router.post('/', invoiceController.create);
router.put('/:id/pay', invoiceController.markAsPaid);
router.put('/:id/convert', invoiceController.convertToInvoice);
router.post('/:id/send', invoiceController.sendInvoiceEmail);
router.get('/:id/pdf', invoiceController.downloadPDF);
router.delete('/:id', isAdmin, invoiceController.remove);

module.exports = router;
