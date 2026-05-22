  const reviewModel = require("../models/reviewModel");
const ApiError = require("../utils/ApiError");

  const REVIEW_STATUSES = new Set(["pending", "approved", "rejected"]);

exports.getReviewsByProductId = async (productId) => {
  const reviews = await reviewModel.getReviewsByProductId(productId);

  return {
    message: "Reviews fetched successfully",
    reviews,
  };
};


exports.checkReviewEligibility = async ({ userId, productId }) => {
  const hasDeliveredProduct = await reviewModel.hasUserReceivedProduct({
    userId,
    productId,
  });

  if (!hasDeliveredProduct) {
    return {
      message: "User is not eligible to review this product",
      canReview: false,
    };
  }

  const existingReview = await reviewModel.getReviewByUserAndProduct({
    userId,
    productId,
  });

  if (existingReview) {
    return {
      message: "User has already reviewed this product",
      canReview: false,
    };
  }

  return {
    message: "User is eligible to review this product",
    canReview: true,
  };
};


exports.createReview = async ({ userId, productId, rating, commentText }) => {
  const numericRating = Number(rating);

  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new ApiError(400, "Rating must be an integer between 1 and 5");
  }

  const hasDeliveredProduct = await reviewModel.hasUserReceivedProduct({
    userId,
    productId,
  });

  if (!hasDeliveredProduct) {
    throw new ApiError(
      403,
      "You can only review products that you have received"
    );
  }

  const existingReview = await reviewModel.getReviewByUserAndProduct({
    userId,
    productId,
  });

   if (existingReview) {
    throw new ApiError(409, "You have already reviewed this product");
  }

  const review = await reviewModel.createReview({
    userId,
    productId,
    rating: numericRating,
    commentText,
  });

  return {
    message: "Review created successfully and is pending approval",
    review,
  };
};


exports.deleteReview = async ({ reviewId, userId, userRole }) => {
  const review = await reviewModel.getReviewById(reviewId);

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  const isOwner = review.userId === userId;
  const isProductManager = userRole === "product_manager";

  if (!isOwner && !isProductManager) {
    throw new ApiError(403, "You are not allowed to delete this review");
  }

  await reviewModel.deleteReview(reviewId);

  return {
    message: "Review deleted successfully",
  };
};


exports.getPendingReviews = async ({ userRole }) => {
  if (userRole !== "product_manager") {
    throw new ApiError(403, "Only product managers can view pending reviews");
  }

  const reviews = await reviewModel.getPendingReviews();

  return {
    message: "Pending reviews fetched successfully",
    reviews,
  };
};


exports.moderateReview = async ({ reviewId, status, moderationComment, userRole }) => {
  if (userRole !== "product_manager") {
    throw new ApiError(403, "Only product managers can moderate reviews");
  }

  const normalizedStatus = typeof status === "string" ? status.trim().toLowerCase() : "";

  if (!REVIEW_STATUSES.has(normalizedStatus) || normalizedStatus === "pending") {
    throw new ApiError(400, "Status must be approved or rejected");
  }

  const normalizedComment =
    typeof moderationComment === "string" ? moderationComment.trim() : "";

  if (normalizedStatus === "rejected" && normalizedComment === "") {
    throw new ApiError(400, "moderationComment is required when rejecting a review");
  }

  const existingReview = await reviewModel.getReviewById(reviewId);

  if (!existingReview) {
    throw new ApiError(404, "Review not found");
  }

  if (existingReview.status && existingReview.status !== "pending") {
    throw new ApiError(409, "Only pending reviews can be moderated");
  }

  const moderatedReview = await reviewModel.updateReviewModeration({
    reviewId,
    status: normalizedStatus,
    moderationComment: normalizedComment || null,
  });

  if (!moderatedReview) {
    throw new ApiError(409, "Only pending reviews can be moderated");
  }

  return {
    message: `Review ${normalizedStatus} successfully`,
    review: moderatedReview,
  };
};


exports.updateReview = async (userId, reviewId, { comment, rating }) => {
  if (!comment && rating === undefined) {
    throw new ApiError(400, "At least one field must be provided");
  }

  const existingReview = await reviewModel.getReviewById(reviewId);

  if (!existingReview) {
    throw new ApiError(404, "Review not found");
  }

  if (existingReview.userId !== userId) {
    throw new ApiError(403, "You can only update your own review");
  }

  const updatedReview = await reviewModel.updateReview(reviewId, {
    comment,
    rating,
    approvalStatus: "pending",
  });

  return {
    message: "Review updated successfully and is pending approval",
    review: updatedReview,
  };
};