const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { authMiddleware, isAdmin } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', isAdmin, productController.deleteProduct);

module.exports = router;
