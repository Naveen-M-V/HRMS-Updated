const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const { authenticateSession } = require('../middleware/authenticateSession');
const {
  canAccessReview,
  canEditSelfAssessment,
  canSubmitManagerFeedback,
  preventAdminFieldsEdit
} = require('../middleware/goalsReviewsRBAC');

// All routes require authentication
router.use(authenticateSession);

/**
 * User review endpoints
 */

// Get user's reviews (history)
router.get('/my', reviewsController.getUserReviews);

// Get specific review
router.get('/:id', canAccessReview, reviewsController.getReview);

// Submit self-assessment
router.post('/:id/self', canEditSelfAssessment, reviewsController.submitSelfAssessment);

/**
 * Admin-only endpoints
 */

// Initiate review for employee (admin only)
router.post('/initiate', reviewsController.initiateReview);

// Submit manager feedback (admin only)
router.post('/:id/manager', canSubmitManagerFeedback, reviewsController.submitManagerFeedback);

// Advance review status (admin only)
router.post('/:id/status', reviewsController.advanceReviewStatus);

// Get all reviews with filters (admin only)
router.get('/', reviewsController.getAllReviews);

module.exports = router;
 * Query params: status?, reviewType?, employeeId?
 */
router.get('/', reviewController.getAllReviews);

/**
 * GET /api/reviews/:id
 * Get single review by ID (Admin and Employee)
 * Employee can only view if status is SUBMITTED or COMPLETED and it's their review
 */
router.get('/:id', reviewController.getReviewById);

/**
 * DELETE /api/reviews/:id
 * Delete a review (Admin only, DRAFT only)
 */
router.delete('/:id', reviewController.deleteReview);

// ==================== EMPLOYEE ROUTES ====================

/**
 * GET /api/reviews/my/list
 * Get all reviews for the authenticated employee
 * Only returns SUBMITTED or COMPLETED reviews
 */
router.get('/my/list', reviewController.getMyReviews);

/**
 * POST /api/reviews/:id/comment
 * Add or update comment on a review (Employee only)
 * Body: { comment, acknowledged? }
 */
router.post('/:id/comment', reviewController.addComment);

/**
 * POST /api/reviews/:id/acknowledge
 * Acknowledge a review (Employee only)
 * Sets acknowledged flag to true
 */
router.post('/:id/acknowledge', reviewController.acknowledgeReview);

module.exports = router;
