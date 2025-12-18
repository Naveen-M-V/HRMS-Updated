const { canScheduleEmployeeForShift } = require('../services/absenceDetectionService');

/**
 * SHIFT VALIDATION MIDDLEWARE
 * Prevents shift creation for employees on approved leave
 */

/**
 * Validate shift assignment before creation
 * Checks if employee has approved leave on the shift date
 */
async function validateShiftAssignment(req, res, next) {
  try {
    const { employeeId, date } = req.body;

    if (!employeeId || !date) {
      return next(); // Let the controller handle validation
    }

    const validation = await canScheduleEmployeeForShift(employeeId, date);

    if (!validation.canSchedule) {
      return res.status(400).json({
        success: false,
        message: validation.reason,
        canSchedule: false
      });
    }

    next();
  } catch (error) {
    console.error('Shift validation error:', error);
    next(); // Continue even if validation fails
  }
}

/**
 * Validate bulk shift assignments
 */
async function validateBulkShiftAssignments(req, res, next) {
  try {
    const { assignments } = req.body;

    if (!Array.isArray(assignments)) {
      return next();
    }

    const validationResults = [];
    const invalidAssignments = [];

    for (const assignment of assignments) {
      if (assignment.employeeId && assignment.date) {
        const validation = await canScheduleEmployeeForShift(assignment.employeeId, assignment.date);
        
        if (!validation.canSchedule) {
          invalidAssignments.push({
            employeeId: assignment.employeeId,
            date: assignment.date,
            reason: validation.reason
          });
        }
      }
    }

    if (invalidAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some employees cannot be scheduled due to approved leave',
        invalidAssignments
      });
    }

    next();
  } catch (error) {
    console.error('Bulk shift validation error:', error);
    next(); // Continue even if validation fails
  }
}

module.exports = {
  validateShiftAssignment,
  validateBulkShiftAssignments
};
