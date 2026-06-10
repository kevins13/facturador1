const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { authMiddleware, isAdmin } = require('../middleware/auth.middleware');

router.use(authMiddleware); // Protect all client routes

router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.post('/', clientController.create);
router.put('/:id', clientController.update);
router.delete('/:id', isAdmin, clientController.remove);

module.exports = router;
