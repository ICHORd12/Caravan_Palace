const reviewService = require("../services/reviewService");

exports.getReviewsByProductId = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await reviewService.getReviewsByProductId(productId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


exports.checkReviewEligibility = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const result = await reviewService.checkReviewEligibility({
      userId,
      productId,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


exports.createReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { rating, commentText } = req.body;

    const result = await reviewService.createReview({
      userId,
      productId,
      rating,
      commentText,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};


exports.deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { reviewId } = req.params;

    const result = await reviewService.deleteReview({
      reviewId,
      userId,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


exports.getPendingReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getPendingReviews({
      userRole: req.user.role,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


exports.moderateReview = async (req, res, next) => {
  try {
    const moderationComment = req.body.moderationComment ?? req.body.moderation_comment;
    const result = await reviewService.moderateReview({
      reviewId: req.params.reviewId,
      status: req.body.status,
      moderationComment,
      userRole: req.user.role,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


exports.updateReview = async (req, res, next) => {
  try {
    const result = await reviewService.updateReview(
      req.user.userId,
      req.params.reviewId,
      req.body
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};