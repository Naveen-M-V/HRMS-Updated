const express = require('express');
const router = express.Router();
const rotaController = require('../controllers/rotaController');

router.post('/generate', rotaController.generateRota);
router.post('/init-shifts', rotaController.initializeShifts);

router.post('/shift-assignments/bulk', rotaController.bulkCreateShifts);
router.post('/shift-assignments', rotaController.assignShiftToEmployee);

router.get('/shift-assignments/all', rotaController.getAllShiftAssignments);
router.get('/shift-assignments/statistics', rotaController.getShiftStatistics);
router.get('/shift-assignments/location/:location', rotaController.getShiftsByLocation);
router.get('/shift-assignments/employee/:employeeId', rotaController.getEmployeeShifts);

router.put('/shift-assignments/:shiftId', rotaController.updateShiftAssignment);
router.delete('/shift-assignments/:shiftId', rotaController.deleteShiftAssignment);

router.post('/shift-assignments/:shiftId/swap-request', rotaController.requestShiftSwap);
router.post('/shift-assignments/:shiftId/swap-approve', rotaController.approveShiftSwap);

router.get('/', rotaController.getAllRota);
router.get('/:employeeId', rotaController.getEmployeeRota);
router.put('/:rotaId', rotaController.updateRota);
router.delete('/:rotaId', rotaController.deleteRota);

module.exports = router;
