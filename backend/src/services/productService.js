const productModel = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const ApiError = require("../utils/ApiError");
const { normalizeSort } = require("../utils/sorter");

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
