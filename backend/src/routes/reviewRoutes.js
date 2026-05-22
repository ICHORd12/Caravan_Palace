const express = require("express");

const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();


router.get("/pending", authMiddleware, reviewController.getPendingReviews);
router.get("/:productId/reviews", reviewController.getReviewsByProductId);
router.get("/:productId/review-eligibility", authMiddleware, reviewController.checkReviewEligibility);
router.post("/:productId/reviews", authMiddleware, reviewController.createReview);
router.delete("/:reviewId", authMiddleware, reviewController.deleteReview);
router.patch("/:reviewId", authMiddleware, reviewController.updateReview);
router.patch("/:reviewId/moderate", authMiddleware, reviewController.moderateReview);

module.exports = router;