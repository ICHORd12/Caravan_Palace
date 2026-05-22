const { describe, test, expect, beforeEach, afterEach } = require("@jest/globals");

const reviewService = require("../services/reviewService");
const reviewModel = require("../models/reviewModel");

describe("review moderation workflow", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("createReview stores new reviews as pending", async () => {
    jest.spyOn(reviewModel, "hasUserReceivedProduct").mockResolvedValue(true);
    jest.spyOn(reviewModel, "getReviewByUserAndProduct").mockResolvedValue(null);
    const createSpy = jest.spyOn(reviewModel, "createReview").mockResolvedValue({
      reviewId: "review-1",
      status: "pending",
      moderationComment: null,
    });

    const result = await reviewService.createReview({
      userId: "user-1",
      productId: "product-1",
      rating: "5",
      commentText: "Great product",
    });

    expect(createSpy).toHaveBeenCalledWith({
      userId: "user-1",
      productId: "product-1",
      rating: 5,
      commentText: "Great product",
    });
    expect(result.review.status).toBe("pending");
    expect(result.review.moderationComment).toBeNull();
  });

  test("getPendingReviews rejects non product managers", async () => {
    await expect(
      reviewService.getPendingReviews({ userRole: "sales_manager" })
    ).rejects.toThrow(/product managers/i);
  });

  test("moderateReview rejects non product managers", async () => {
    await expect(
      reviewService.moderateReview({
        reviewId: "review-1",
        status: "approved",
        moderationComment: "Looks fine",
        userRole: "customer",
      })
    ).rejects.toThrow(/product managers/i);
  });

  test("moderateReview requires a comment when rejecting", async () => {
    await expect(
      reviewService.moderateReview({
        reviewId: "review-1",
        status: "rejected",
        moderationComment: "   ",
        userRole: "product_manager",
      })
    ).rejects.toThrow(/moderationComment is required/i);
  });

  test("moderateReview approves pending reviews", async () => {
    jest.spyOn(reviewModel, "getReviewById").mockResolvedValue({
      reviewId: "review-1",
      status: "pending",
    });

    const updateSpy = jest.spyOn(reviewModel, "updateReviewModeration").mockResolvedValue({
      reviewId: "review-1",
      status: "approved",
      moderationComment: "Looks good",
    });

    const result = await reviewService.moderateReview({
      reviewId: "review-1",
      status: "approved",
      moderationComment: "Looks good",
      userRole: "product_manager",
    });

    expect(updateSpy).toHaveBeenCalledWith({
      reviewId: "review-1",
      status: "approved",
      moderationComment: "Looks good",
    });
    expect(result.message).toBe("Review approved successfully");
    expect(result.review.status).toBe("approved");
  });

  test("moderateReview blocks already moderated reviews", async () => {
    jest.spyOn(reviewModel, "getReviewById").mockResolvedValue({
      reviewId: "review-1",
      status: "approved",
    });

    await expect(
      reviewService.moderateReview({
        reviewId: "review-1",
        status: "rejected",
        moderationComment: "No longer valid",
        userRole: "product_manager",
      })
    ).rejects.toThrow(/Only pending reviews can be moderated/i);
  });

  test("updateReview resets a review back to pending", async () => {
    jest.spyOn(reviewModel, "getReviewById").mockResolvedValue({
      reviewId: "review-1",
      userId: "user-1",
      status: "approved",
    });

    const updateSpy = jest.spyOn(reviewModel, "updateReview").mockResolvedValue({
      reviewId: "review-1",
      status: "pending",
      moderationComment: null,
    });

    const result = await reviewService.updateReview("user-1", "review-1", {
      comment: "Updated comment",
      rating: 4,
    });

    expect(updateSpy).toHaveBeenCalledWith("review-1", {
      comment: "Updated comment",
      rating: 4,
      approvalStatus: "pending",
    });
    expect(result.review.status).toBe("pending");
  });
});