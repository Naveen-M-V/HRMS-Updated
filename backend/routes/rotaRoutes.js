const express = require('express');
const router = express.Router();
const rotaController = require('../controllers/rotaController');

/**
 * Rota Management Routes
 * Handles shift scheduling and rotation management
 */

// Generate new rota for a date range
router.post('/generate', rotaController.generateRota);

// Initialize default shifts (one-time setup)
router.post('/init-shifts', rotaController.initializeShifts);

// Get all rota entries (Admin view)
router.get('/', rotaController.getAllRota);

// Get specific employee's rota
router.get('/:employeeId', rotaController.getEmployeeRota);

// Update a rota entry
router.put('/:rotaId', rotaController.updateRota);

// Delete a rota entry
router.delete('/:rotaId', rotaController.deleteRota);

module.exports = router;
