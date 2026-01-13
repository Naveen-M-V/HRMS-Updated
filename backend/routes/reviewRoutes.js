const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

/**
 * Review Routes
 * 
 * Role-Based Access:
 * - Admin/Super-Admin: Can create, edit (DRAFT only), submit, complete, and delete reviews
 * - Employee: Can view (SUBMITTED/COMPLETED only) and add comments
 * 
 * Note: Authentication is handled by authenticateSession middleware in server.js
 * Role checking is done in controller methods
 */

// ==================== ADMIN ROUTES ====================

/**
 * POST /api/reviews
 * Create a new review (Admin only)
 * Body: { employeeId, reviewType, reviewPeriodStart?, reviewPeriodEnd?, performanceSummary?, strengths?, improvements?, rating? }
 */
router.post('/', reviewController.createReview);

/**
 * PUT /api/reviews/:id
 * Update a review (Admin only, DRAFT only)
 * Body: { performanceSummary?, strengths?, improvements?, rating?, reviewPeriodStart?, reviewPeriodEnd? }
 */
router.put('/:id', reviewController.updateReview);

/**
 * POST /api/reviews/:id/submit
 * Submit a review (Admin only)
 * Transitions: DRAFT -> SUBMITTED
 * Makes review visible to employee
 */
router.post('/:id/submit', reviewController.submitReview);

/**
 * POST /api/reviews/:id/complete
 * Complete a review (Admin only)
 * Transitions: SUBMITTED -> COMPLETED
 * Makes review immutable
 */
router.post('/:id/complete', reviewController.completeReview);

/**
 * GET /api/reviews
 * Get all reviews (Admin only)
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
