const productModel = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const { normalizeSort } = require("../utils/sorter");
const discountNotificationService = require("./discountNotificationService");

const assertSalesManager = (userRole) => {
  if (userRole !== "sales_manager") {
    throw new ApiError(403, "Only sales managers can update discounts");
  }
};

const normalizeDiscountRate = (discountRate) => {
  const parsedRate = Number(discountRate);

  if (!Number.isFinite(parsedRate)) {
    throw new ApiError(400, "discountRate must be a number");
  }

  if (parsedRate < 0 || parsedRate > 100) {
    throw new ApiError(400, "discountRate must be between 0 and 100");
  }

  return Number(parsedRate.toFixed(2));
};

exports.getAllProducts = async({sort}) => {
    const normalizedSort = normalizeSort(sort);
    const products = await productModel.getAllProducts(normalizedSort);
    if (!products) {
        throw new ApiError(404, "There is no product in database");
    }

    return {
        message: "Products fetched successfully",
        products
    };  
};

exports.getProductsByCategoryName = async ({category_name, sort}) => {
    const normalizedSort = normalizeSort(sort);
    const products = await productModel.getProductsByCategoryName(category_name, normalizedSort);

    if (products.length === 0) {
        throw new ApiError(404, "There is no product with given category name in database ");
    }

    return {
        message: "Products fetched successfully",
        products
    };
};


exports.getProductsByIds = async ({productIds, sort}) => {
  if (!Array.isArray(productIds)) {
    throw new ApiError(400, "productIds must be an array");
  }

  if (productIds.length === 0) {
    return {
      message: "Products fetched successfully",
      products: [],
    };
  }

  const normalizedSort = normalizeSort(sort);
  const products = await productModel.getProductsByIds(productIds, normalizedSort);

  return {
    message: "Products fetched successfully",
    products,
  };
};


exports.getProductDetails = async ({ productId, userId }) => {
  const product = await productModel.getProductDetailsById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  let reviewEligibility = {
    canReview: false,
    reason: "User is not logged in",
  };

  let userReview = null;
  let reviews = [];

  if (!userId) {
    reviews = await reviewModel.getApprovedReviewsByProductId(productId);

    return {
      message: "Product details fetched successfully",
      product,
      reviewEligibility,
      userReview,
      reviews,
    };
  }

  userReview = await reviewModel.getReviewByUserAndProductWithUser({
    userId,
    productId,
  });

  reviews = await reviewModel.getApprovedReviewsByProductIdExceptUser({
    productId,
    userId,
  });

  if (userReview) {
    reviewEligibility = {
      canReview: false,
      reason: "User has already reviewed this product",
    };
  } else {
    const hasDeliveredProduct = await reviewModel.hasUserReceivedProduct({
      userId,
      productId,
    });

    reviewEligibility = hasDeliveredProduct
      ? {
          canReview: true,
          reason: "User is eligible to review this product",
        }
      : {
          canReview: false,
          reason: "User has not received this product",
        };
  }

  return {
    message: "Product details fetched successfully",
    product,
    reviewEligibility,
    userReview,
    reviews,
  };
};


exports.searchProductsByNameOrDescription = async ({q, sort}) => {
    const normalizedSort = normalizeSort(sort);
    const searchTerm = typeof q === "string" ? q.trim() : "";
    
    if (!searchTerm) {
        throw new ApiError(400, "Query parameter q is required");
    }

    const products = await productModel.searchProductsByNameOrDescription(searchTerm, normalizedSort);

    return {
        message: "Products fetched successfully",
        products,
    };
};

exports.updateProductDiscount = async ({ productId, discountRate, userRole }) => {
  assertSalesManager(userRole);

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const normalizedDiscountRate = normalizeDiscountRate(discountRate);
  const client = await pool.connect();

  let previousDiscountRate = 0;
  let updatedProduct = null;

  try {
    await client.query("BEGIN");

    const existingProduct = await productModel.getProductDiscountForUpdate(
      productId,
      client
    );

    if (!existingProduct) {
      throw new ApiError(404, "Product not found");
    }

    previousDiscountRate = Number(existingProduct.discountRate || 0);
    updatedProduct = await productModel.updateProductDiscount(
      {
        productId,
        discountRate: normalizedDiscountRate,
      },
      client
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  let notificationSummary = {
    triggered: false,
    productId,
    attempted: 0,
    sent: 0,
    failed: 0,
  };

  if (
    normalizedDiscountRate > 0 &&
    normalizedDiscountRate > previousDiscountRate
  ) {
    try {
      notificationSummary =
        await discountNotificationService.notifyWishlistUsersForDiscountIncrease({
        product: updatedProduct,
        previousDiscountRate,
        newDiscountRate: normalizedDiscountRate,
      });
    } catch (_err) {
      notificationSummary = {
        triggered: true,
        productId,
        attempted: 0,
        sent: 0,
        failed: 0,
        error: "Discount updated, but wishlist notification emails could not be sent",
      };
    }
  }

  return {
    message: "Product discount updated successfully",
    product: updatedProduct,
    previousDiscountRate,
    notificationSummary,
  };
};
