const productModel = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const { normalizeSort } = require("../utils/sorter");
const discountNotificationService = require("./discountNotificationService");

const assertProductManager = (userRole, action = "manage products") => {
  if (userRole !== "product_manager") {
    throw new ApiError(403, `Only product managers can ${action}`);
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

const validateString = (value, fieldName) => {
  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new ApiError(400, `${fieldName} cannot be empty`);
  }

  return trimmedValue;
};

const validateOptionalString = (value, fieldName) => {
  if (value === undefined || value === null) {
    return null;
  }

  return validateString(value, fieldName);
};

const validateNumber = (value, fieldName, { min, integer = false } = {}) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new ApiError(400, `${fieldName} must be a number`);
  }

  if (integer && !Number.isInteger(parsedValue)) {
    throw new ApiError(400, `${fieldName} must be an integer`);
  }

  if (min !== undefined && parsedValue < min) {
    throw new ApiError(400, `${fieldName} must be at least ${min}`);
  }

  return parsedValue;
};

const normalizeProductImages = (images) => {
  if (images === undefined) {
    return [];
  }

  if (!Array.isArray(images)) {
    throw new ApiError(400, "images must be an array");
  }

  let primaryAlreadySet = false;

  return images.map((image, index) => {
    const imagePayload =
      typeof image === "string" ? { url: image } : image;

    if (!imagePayload || typeof imagePayload !== "object" || Array.isArray(imagePayload)) {
      throw new ApiError(400, "Each image must be a URL string or an image object");
    }

    const isPrimaryRequested = imagePayload.isPrimary === true;
    const isPrimary =
      isPrimaryRequested && !primaryAlreadySet
        ? true
        : images.length > 0 && index === 0 && !images.some((item) => item?.isPrimary === true);

    if (isPrimary) {
      primaryAlreadySet = true;
    }

    return {
      url: validateString(imagePayload.url, "image.url"),
      isPrimary,
    };
  });
};

const normalizeProductPayload = (payload) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError(400, "Request body must be a JSON object");
  }

  const basePrice = validateNumber(payload.basePrice, "basePrice", { min: 0.01 });
  const discountRate = payload.discountRate === undefined
    ? 0
    : normalizeDiscountRate(payload.discountRate);

  return {
    categoryId: validateString(payload.categoryId, "categoryId"),
    name: validateString(payload.name, "name"),
    model: validateString(payload.model, "model"),
    serialNumber: validateString(payload.serialNumber, "serialNumber"),
    description: validateString(payload.description, "description"),
    quantityInStocks: validateNumber(payload.quantityInStocks, "quantityInStocks", {
      min: 0,
      integer: true,
    }),
    basePrice,
    currentPrice: Number((basePrice * (1 - discountRate / 100)).toFixed(2)),
    warrantyStatus: validateString(payload.warrantyStatus, "warrantyStatus"),
    distributorInfo: validateOptionalString(payload.distributorInfo, "distributorInfo"),
    berthCount: validateNumber(payload.berthCount, "berthCount", {
      min: 0,
      integer: true,
    }),
    fuelType: validateString(payload.fuelType, "fuelType"),
    weightKg: validateNumber(payload.weightKg, "weightKg", { min: 0.01 }),
    hasKitchen: payload.hasKitchen,
    discountRate,
    images: normalizeProductImages(payload.images),
  };
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

exports.createProduct = async ({ payload, userRole }) => {
  assertProductManager(userRole, "add products");

  const productPayload = normalizeProductPayload(payload);

  if (typeof productPayload.hasKitchen !== "boolean") {
    throw new ApiError(400, "hasKitchen must be a boolean");
  }

  const categoryExists = await productModel.categoryExists(productPayload.categoryId);

  if (!categoryExists) {
    throw new ApiError(404, "Category not found");
  }

  const client = await pool.connect();
  let product;

  try {
    await client.query("BEGIN");

    const createdProduct = await productModel.createProduct(productPayload, client);

    if (productPayload.images.length > 0) {
      await productModel.createProductImages(
        {
          productId: createdProduct.productId,
          images: productPayload.images,
        },
        client
      );
    }

    product = await productModel.getProductDetailsById(
      createdProduct.productId,
      client
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");

    if (err.code === "23505") {
      throw new ApiError(409, "Product serial number already exists");
    }

    throw err;
  } finally {
    client.release();
  }

  return {
    message: "Product created successfully",
    product,
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
  assertProductManager(userRole, "update discounts");

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

exports.updateProductStock = async ({ productId, quantityInStocks, userRole }) => {
  assertProductManager(userRole, "update stock");

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const normalizedQuantity = validateNumber(
    quantityInStocks,
    "quantityInStocks",
    {
      min: 0,
      integer: true,
    }
  );

  const client = await pool.connect();
  let previousQuantityInStocks = 0;
  let updatedProduct = null;

  try {
    await client.query("BEGIN");

    const existingProduct = await productModel.getProductByIdForUpdate(
      productId,
      client
    );

    if (!existingProduct) {
      throw new ApiError(404, "Product not found");
    }

    previousQuantityInStocks = Number(existingProduct.quantityInStocks || 0);

    await productModel.updateProductStock(
      {
        productId,
        quantityInStocks: normalizedQuantity,
      },
      client
    );

    updatedProduct = await productModel.getProductDetailsById(productId, client);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return {
    message: "Product stock updated successfully",
    product: updatedProduct,
    previousQuantityInStocks,
  };
};
