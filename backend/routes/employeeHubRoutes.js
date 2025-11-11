const express = require('express');
const router = express.Router();
const employeeHubController = require('../controllers/employeeHubController');

// Employee CRUD operations
router.get('/', employeeHubController.getAllEmployees);
router.get('/unregistered-brighthr', employeeHubController.getUnregisteredBrightHR);
router.get('/without-team', employeeHubController.getEmployeesWithoutTeam);
router.get('/team/:teamName', employeeHubController.getEmployeesByTeam);
router.get('/:id', employeeHubController.getEmployeeById);
router.post('/', employeeHubController.createEmployee);
router.put('/:id', employeeHubController.updateEmployee);
router.delete('/:id', employeeHubController.deleteEmployee);

module.exports = router;
