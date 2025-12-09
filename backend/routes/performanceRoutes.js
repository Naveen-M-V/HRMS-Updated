const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');

// Goal routes
router.get('/goals', performanceController.getAllGoals);
router.get('/goals/my-goals', performanceController.getMyGoals);
router.get('/goals/:id', performanceController.getGoalById);
router.post('/goals', performanceController.createGoal);
router.put('/goals/:id', performanceController.updateGoal);
router.delete('/goals/:id', performanceController.deleteGoal);

// Review routes
router.get('/reviews', performanceController.getAllReviews);
router.get('/reviews/my-reviews', performanceController.getMyReviews);
router.get('/reviews/:id', performanceController.getReviewById);
router.put('/reviews/:id', performanceController.updateReview);
router.delete('/reviews/:id', performanceController.deleteReview);

module.exports = router;
