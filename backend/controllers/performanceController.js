const Goal = require('../models/Goal');
const Review = require('../models/Review');
const EmployeesHub = require('../models/EmployeesHub');

// ==================== GOAL CONTROLLERS ====================

// Get all goals
exports.getAllGoals = async (req, res) => {
    try {
        const { status, assignee, search } = req.query;

        let query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by assignee
        if (assignee && assignee !== 'all') {
            query.assignee = assignee;
        }

        // Search by goal name
        if (search) {
            query.goalName = { $regex: search, $options: 'i' };
        }

        const goals = await Goal.find(query)
            .populate('assignee', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(goals);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ message: 'Error fetching goals', error: error.message });
    }
};

// Get goals by user (for "My goals" view)
exports.getMyGoals = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find employee record for this user
        const employee = await EmployeesHub.findOne({ userId });

        if (!employee) {
            return res.status(404).json({ message: 'Employee record not found' });
        }

        const goals = await Goal.find({ assignee: employee._id })
            .populate('assignee', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(goals);
    } catch (error) {
        console.error('Error fetching my goals:', error);
        res.status(500).json({ message: 'Error fetching goals', error: error.message });
    }
};

// Get single goal
exports.getGoalById = async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.id)
            .populate('assignee', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName');

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        res.json(goal);
    } catch (error) {
        console.error('Error fetching goal:', error);
        res.status(500).json({ message: 'Error fetching goal', error: error.message });
    }
};

// Create new goal
exports.createGoal = async (req, res) => {
    try {
        const { goalName, description, assignee, startDate, dueDate, measurementType } = req.body;

        // Validate required fields
        if (!goalName || !description || !assignee || !startDate || !dueDate || !measurementType) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Create goal
        const goal = new Goal({
            goalName,
            description,
            assignee,
            startDate,
            dueDate,
            measurementType,
            createdBy: req.user.id
        });

        await goal.save();

        // Get assignee details to find manager
        const assigneeEmployee = await EmployeesHub.findById(assignee);

        // Create linked review
        const review = new Review({
            reviewTitle: goalName,
            assignedTo: assignee,
            manager: assigneeEmployee?.managerId || null,
            startDate,
            dueDate,
            status: 'Not complete',
            linkedGoal: goal._id,
            reviewType: 'Goal-based'
        });

        await review.save();

        // Populate and return the created goal
        const populatedGoal = await Goal.findById(goal._id)
            .populate('assignee', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName');

        res.status(201).json({
            message: 'Goal created successfully',
            goal: populatedGoal,
            review
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ message: 'Error creating goal', error: error.message });
    }
};

// Update goal
exports.updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const goal = await Goal.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        )
            .populate('assignee', 'firstName lastName email')
            .populate('createdBy', 'firstName lastName');

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Update linked review if goal name or dates changed
        if (updates.goalName || updates.startDate || updates.dueDate) {
            const reviewUpdates = {};
            if (updates.goalName) reviewUpdates.reviewTitle = updates.goalName;
            if (updates.startDate) reviewUpdates.startDate = updates.startDate;
            if (updates.dueDate) reviewUpdates.dueDate = updates.dueDate;

            await Review.findOneAndUpdate(
                { linkedGoal: id },
                { $set: reviewUpdates }
            );
        }

        res.json({ message: 'Goal updated successfully', goal });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ message: 'Error updating goal', error: error.message });
    }
};

// Delete goal
exports.deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;

        const goal = await Goal.findByIdAndDelete(id);

        if (!goal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        // Delete linked review
        await Review.findOneAndDelete({ linkedGoal: id });

        res.json({ message: 'Goal and linked review deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ message: 'Error deleting goal', error: error.message });
    }
};

// ==================== REVIEW CONTROLLERS ====================

// Get all reviews
exports.getAllReviews = async (req, res) => {
    try {
        const { status, assignedTo } = req.query;

        let query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by assignedTo
        if (assignedTo && assignedTo !== 'all') {
            query.assignedTo = assignedTo;
        }

        const reviews = await Review.find(query)
            .populate('assignedTo', 'firstName lastName email')
            .populate('manager', 'firstName lastName')
            .populate('linkedGoal', 'goalName')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Get reviews assigned to me
exports.getMyReviews = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find employee record for this user
        const employee = await EmployeesHub.findOne({ userId });

        if (!employee) {
            return res.status(404).json({ message: 'Employee record not found' });
        }

        const reviews = await Review.find({ assignedTo: employee._id })
            .populate('assignedTo', 'firstName lastName email')
            .populate('manager', 'firstName lastName')
            .populate('linkedGoal', 'goalName')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching my reviews:', error);
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

// Get single review
exports.getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('assignedTo', 'firstName lastName email')
            .populate('manager', 'firstName lastName')
            .populate('linkedGoal', 'goalName');

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.json(review);
    } catch (error) {
        console.error('Error fetching review:', error);
        res.status(500).json({ message: 'Error fetching review', error: error.message });
    }
};

// Update review
exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // If marking as completed, set completedDate
        if (updates.status === 'Completed' && !updates.completedDate) {
            updates.completedDate = new Date();
        }

        const review = await Review.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        )
            .populate('assignedTo', 'firstName lastName email')
            .populate('manager', 'firstName lastName')
            .populate('linkedGoal', 'goalName');

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.json({ message: 'Review updated successfully', review });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'Error updating review', error: error.message });
    }
};

// Delete review
exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;

        const review = await Review.findByIdAndDelete(id);

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Error deleting review', error: error.message });
    }
};
