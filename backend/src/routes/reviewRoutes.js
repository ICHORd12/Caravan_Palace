const express = require("express");

const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();


router.get("/:productId/reviews", reviewController.getReviewsByProductId);
router.get("/pending", authMiddleware, reviewController.getPendingReviews);
router.get("/:productId/review-eligibility", authMiddleware, reviewController.checkReviewEligibility);
router.patch("/:reviewId/approve", authMiddleware, reviewController.approveReview);
router.patch("/:reviewId/reject", authMiddleware, reviewController.rejectReview);
router.post("/:productId/reviews", authMiddleware, reviewController.createReview);
router.delete("/:reviewId", authMiddleware, reviewController.deleteReview);
router.patch("/:reviewId", authMiddleware, reviewController.updateReview);

module.exports = router;
