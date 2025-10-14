const Rota = require('../models/Rota');
const Employee = require('../models/Employee');
const Shift = require('../models/Shift');

/**
 * Helper function to move to the next day
 * @param {Date} date - Current date
 * @returns {Date} Next day
 */
const nextDay = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
};

/**
 * Helper function to check if a date is a weekend (Saturday or Sunday)
 * @param {Date} date - Date to check
 * @returns {Boolean} True if weekend
 */
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

/**
 * Generate Rota
 * Auto-generates shift assignments for all employees within a date range
 * Uses round-robin rotation algorithm, skips weekends
 * 
 * @route POST /api/rota/generate
 * @body {String} startDate - Start date (YYYY-MM-DD)
 * @body {String} endDate - End date (YYYY-MM-DD)
 */
exports.generateRota = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Fetch all active employees and all shifts
    const employees = await Employee.find({ isActive: true });
    const shifts = await Shift.find().sort({ name: 1 });

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees found'
      });
    }

    if (shifts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No shifts found. Please create shifts first.'
      });
    }

    // Delete existing rotas in the date range to avoid duplicates
    await Rota.deleteMany({
      date: { $gte: start, $lte: end }
    });

    // Round-robin rotation algorithm
    let shiftIndex = 0;
    const rotaEntries = [];

    for (let date = new Date(start); date <= end; date = nextDay(date)) {
      // Skip weekends
      if (isWeekend(date)) continue;

      // Assign shifts to each employee
      for (const emp of employees) {
        const shift = shifts[shiftIndex % shifts.length];
        
        rotaEntries.push({
          employee: emp._id,
          shift: shift._id,
          date: new Date(date),
          status: 'Assigned'
        });

        // Update employee's last shift
        emp.lastShift = shift._id;
        
        // Move to next shift in rotation
        shiftIndex++;
      }
    }

    // Bulk insert all rota entries
    await Rota.insertMany(rotaEntries);

    // Save all employee last shift updates
    await Promise.all(employees.map(emp => emp.save()));

    res.status(201).json({
      success: true,
      message: `Rota generated successfully for ${rotaEntries.length} assignments`,
      count: rotaEntries.length
    });

  } catch (error) {
    console.error('Generate Rota Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate rota',
      error: error.message
    });
  }
};

/**
 * Get Employee Rota
 * Fetches all rota entries for a specific employee
 * 
 * @route GET /api/rota/:employeeId
 * @param {String} employeeId - Employee ID
 */
exports.getEmployeeRota = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }

    // Build query
    const query = { employee: employeeId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Fetch rota entries with populated shift details
    const rotas = await Rota.find(query)
      .populate('shift', 'name startTime endTime color')
      .populate('employee', 'name email department')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: rotas.length,
      data: rotas
    });

  } catch (error) {
    console.error('Get Employee Rota Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee rota',
      error: error.message
    });
  }
};

/**
 * Get All Rota
 * Fetches all rota entries (Admin view)
 * Optional: Filter by date range
 * 
 * @route GET /api/rota
 * @query {String} startDate - Optional start date filter
 * @query {String} endDate - Optional end date filter
 */
exports.getAllRota = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build query
    const query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Fetch all rota entries with populated details
    const rotas = await Rota.find(query)
      .populate('employee', 'name email department')
      .populate('shift', 'name startTime endTime color')
      .sort({ date: 1, employee: 1 });

    res.status(200).json({
      success: true,
      count: rotas.length,
      data: rotas
    });

  } catch (error) {
    console.error('Get All Rota Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rota',
      error: error.message
    });
  }
};

/**
 * Update Rota Entry
 * Updates a specific rota entry (for manual adjustments)
 * 
 * @route PUT /api/rota/:rotaId
 * @param {String} rotaId - Rota entry ID
 */
exports.updateRota = async (req, res) => {
  try {
    const { rotaId } = req.params;
    const { shift, status, notes } = req.body;

    const updateData = {};
    if (shift) updateData.shift = shift;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const rota = await Rota.findByIdAndUpdate(
      rotaId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('employee', 'name email department')
      .populate('shift', 'name startTime endTime color');

    if (!rota) {
      return res.status(404).json({
        success: false,
        message: 'Rota entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rota updated successfully',
      data: rota
    });

  } catch (error) {
    console.error('Update Rota Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rota',
      error: error.message
    });
  }
};

/**
 * Delete Rota Entry
 * Deletes a specific rota entry
 * 
 * @route DELETE /api/rota/:rotaId
 * @param {String} rotaId - Rota entry ID
 */
exports.deleteRota = async (req, res) => {
  try {
    const { rotaId } = req.params;

    const rota = await Rota.findByIdAndDelete(rotaId);

    if (!rota) {
      return res.status(404).json({
        success: false,
        message: 'Rota entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rota entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete Rota Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rota',
      error: error.message
    });
  }
};

/**
 * Initialize Shifts
 * Helper function to create default shifts if they don't exist
 * 
 * @route POST /api/rota/init-shifts
 */
exports.initializeShifts = async (req, res) => {
  try {
    const existingShifts = await Shift.countDocuments();

    if (existingShifts > 0) {
      return res.status(200).json({
        success: true,
        message: 'Shifts already initialized',
        count: existingShifts
      });
    }

    const defaultShifts = [
      { name: 'Morning', startTime: '09:00', endTime: '17:00', color: '#3b82f6' },
      { name: 'Evening', startTime: '17:00', endTime: '01:00', color: '#f59e0b' },
      { name: 'Night', startTime: '01:00', endTime: '09:00', color: '#8b5cf6' }
    ];

    await Shift.insertMany(defaultShifts);

    res.status(201).json({
      success: true,
      message: 'Default shifts created successfully',
      count: defaultShifts.length
    });

  } catch (error) {
    console.error('Initialize Shifts Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize shifts',
      error: error.message
    });
  }
};
