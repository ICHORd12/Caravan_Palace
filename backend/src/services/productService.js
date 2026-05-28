const productModel = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const categoryModel = require("../models/categoryModel");
const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const { normalizeSort } = require("../utils/sorter");
const {
  validateRequiredString,
  validateOptionalString,
  validateObjectPayload,
} = require("../utils/payloadValidators");
const discountNotificationService = require("./discountNotificationService");

const assertSalesManager = (userRole, action = "update discounts") => {
  if (userRole !== "sales_manager") {
    throw new ApiError(403, `Only sales managers can ${action}`);
  }
};

const assertProductManager = (userRole, action = "update products") => {
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

const normalizeBasePrice = (basePrice) => {
  const parsedPrice = Number(basePrice);

  if (!Number.isFinite(parsedPrice)) {
    throw new ApiError(400, "basePrice must be a number");
  }

  if (parsedPrice <= 0) {
    throw new ApiError(400, "basePrice must be greater than 0");
  }

  return Number(parsedPrice.toFixed(2));
};

const normalizeIsActive = (value) => {
  if (value === undefined || value === null) {
    throw new ApiError(400, "isActive is required");
  }

  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }

  throw new ApiError(400, "isActive must be a boolean");
};

const normalizeBooleanValue = (value, fieldName) => {
  if (value === undefined || value === null) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }

  throw new ApiError(400, `${fieldName} must be a boolean`);
};

const normalizeOptionalBooleanValue = (value, fieldName) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  return normalizeBooleanValue(value, fieldName);
};

const normalizeIntegerValue = (value, fieldName, { min = 0 } = {}) => {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue)) {
    throw new ApiError(400, `${fieldName} must be an integer`);
  }

  if (parsedValue < min) {
    throw new ApiError(400, `${fieldName} must be ${min} or greater`);
  }

  return parsedValue;
};

const normalizeNumberValue = (value, fieldName, { min = 0 } = {}) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new ApiError(400, `${fieldName} must be a number`);
  }

  if (parsedValue < min) {
    throw new ApiError(400, `${fieldName} must be ${min} or greater`);
  }

  return parsedValue;
};

const normalizeImagesPayload = (images) => {
  if (images === undefined || images === null) {
    return [];
  }

  if (!Array.isArray(images)) {
    throw new ApiError(400, "images must be an array");
  }

  if (images.length === 0) {
    return [];
  }

  const normalizedImages = images.map((image, index) => {
    if (!image || typeof image !== "object" || Array.isArray(image)) {
      throw new ApiError(400, `images[${index}] must be an object`);
    }

    const url = validateRequiredString(image.url, `images[${index}].url`);
    const isPrimary = normalizeOptionalBooleanValue(
      image.isPrimary ?? image.is_primary,
      `images[${index}].isPrimary`
    );

    return {
      url,
      isPrimary: isPrimary ?? false,
    };
  });

  const primaryCount = normalizedImages.filter((image) => image.isPrimary)
    .length;

  if (primaryCount > 1) {
    throw new ApiError(400, "Only one image can be marked as primary");
  }

  if (primaryCount === 0) {
    normalizedImages[0].isPrimary = true;
  }

  return normalizedImages;
};

exports.getAllProducts = async({sort, userRole, q, categoryIds}) => {
  const normalizedSort = normalizeSort(sort);
  const isManager = userRole === "product_manager" || userRole === "sales_manager";
  const products = isManager
    ? await productModel.getAllProductsForManager({
        sort: normalizedSort,
        q,
        categoryIds,
      })
    : await productModel.getAllProducts({
        sort: normalizedSort,
        q,
        categoryIds,
      });
    if (!products) {
        throw new ApiError(404, "There is no product in database");
    }

    return {
        message: "Products fetched successfully",
        products
    };  
};

exports.getProductsByCategoryName = async ({category_name, sort, userRole}) => {
    const normalizedSort = normalizeSort(sort);
    const isManager = userRole === "product_manager" || userRole === "sales_manager";
    const products = isManager
      ? await productModel.getProductsByCategoryNameForManager(category_name, normalizedSort)
      : await productModel.getProductsByCategoryName(category_name, normalizedSort);

    if (products.length === 0) {
        throw new ApiError(404, "There is no product with given category name in database ");
    }

    return {
        message: "Products fetched successfully",
        products
    };
};


exports.getProductsByIds = async ({productIds, sort, userRole}) => {
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
  const isManager = userRole === "product_manager" || userRole === "sales_manager";
  const products = isManager
    ? await productModel.getProductsByIdsForManager(productIds, normalizedSort)
    : await productModel.getProductsByIds(productIds, normalizedSort);

  return {
    message: "Products fetched successfully",
    products,
  };
};


exports.getProductDetails = async ({ productId, userId, userRole }) => {
  const isManager = userRole === "product_manager" || userRole === "sales_manager";
  const product = isManager
    ? await productModel.getProductDetailsByIdForManager(productId)
    : await productModel.getProductDetailsById(productId);

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


exports.searchProductsByNameOrDescription = async ({q, sort, userRole}) => {
    const normalizedSort = normalizeSort(sort);
    const searchTerm = typeof q === "string" ? q.trim() : "";
    
    if (!searchTerm) {
        throw new ApiError(400, "Query parameter q is required");
    }

    const isManager = userRole === "product_manager" || userRole === "sales_manager";
    const products = isManager
      ? await productModel.searchProductsByNameOrDescriptionForManager(searchTerm, normalizedSort)
      : await productModel.searchProductsByNameOrDescription(searchTerm, normalizedSort);

    return {
        message: "Products fetched successfully",
        products,
    };
};

exports.updateProductActivation = async ({ productId, isActive, userRole }) => {
  assertProductManager(userRole, "activate or deactivate products");

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const normalizedIsActive = normalizeIsActive(isActive);
  const pricingSummary = await productModel.getProductPricingById(productId);

  if (!pricingSummary) {
    throw new ApiError(404, "Product not found");
  }

  if (normalizedIsActive) {
    const basePrice = Number(pricingSummary.basePrice || 0);

    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      throw new ApiError(409, "Product must have a base price before activation");
    }
  }

  const updatedProduct = await productModel.updateProductIsActive({
    productId,
    isActive: normalizedIsActive,
  });

  if (!updatedProduct) {
    throw new ApiError(404, "Product not found");
  }

  return {
    message: normalizedIsActive
      ? "Product activated successfully"
      : "Product deactivated successfully",
    product: updatedProduct,
  };
};

exports.updateProductStock = async ({ productId, quantityInStocks, userRole }) => {
  assertProductManager(userRole, "update product stock");

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const normalizedQuantity = normalizeIntegerValue(
    quantityInStocks,
    "quantityInStocks",
    { min: 0 }
  );

  const updatedProduct = await productModel.updateProductStock({
    productId,
    quantityInStocks: normalizedQuantity,
  });

  if (!updatedProduct) {
    throw new ApiError(404, "Product not found");
  }

  return {
    message: "Product stock updated successfully",
    product: updatedProduct,
  };
};

exports.createProduct = async ({ payload, userRole }) => {
  assertProductManager(userRole, "create products");

  const validatedPayload = validateObjectPayload(payload);

  const categoryId = validateRequiredString(
    validatedPayload.categoryId ?? validatedPayload.category_id,
    "Category ID"
  );
  const name = validateRequiredString(validatedPayload.name, "Name");
  const model = validateRequiredString(validatedPayload.model, "Model");
  const serialNumber = validateRequiredString(
    validatedPayload.serialNumber ?? validatedPayload.serial_number,
    "Serial number"
  );
  const description = validateRequiredString(
    validatedPayload.description,
    "Description"
  );

  const quantityInStocks = normalizeIntegerValue(
    validatedPayload.quantityInStocks ?? validatedPayload.quantity_in_stocks,
    "quantityInStocks",
    { min: 0 }
  );
  const warrantyStatus = validateRequiredString(
    validatedPayload.warrantyStatus ?? validatedPayload.warranty_status,
    "warrantyStatus"
  );

  const distributorInfoInput =
    validatedPayload.distributorInfo ?? validatedPayload.distributor_info;
  const distributorInfo =
    distributorInfoInput === undefined || distributorInfoInput === null
      ? null
      : validateOptionalString(distributorInfoInput, "distributorInfo");

  const berthCount = normalizeIntegerValue(
    validatedPayload.berthCount ?? validatedPayload.berth_count,
    "berthCount",
    { min: 0 }
  );
  const fuelType = validateRequiredString(
    validatedPayload.fuelType ?? validatedPayload.fuel_type,
    "fuelType"
  );
  const weightKg = normalizeNumberValue(
    validatedPayload.weightKg ?? validatedPayload.weight_kg,
    "weightKg",
    { min: 0 }
  );
  const hasKitchen = normalizeBooleanValue(
    validatedPayload.hasKitchen ?? validatedPayload.has_kitchen,
    "hasKitchen"
  );

  const images = normalizeImagesPayload(validatedPayload.images);

  const category = await categoryModel.getCategoryById(categoryId);

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const client = await pool.connect();
  let createdProduct = null;

  try {
    await client.query("BEGIN");

    createdProduct = await productModel.createProduct(
      {
        categoryId,
        name,
        model,
        serialNumber,
        description,
        quantityInStocks,
        basePrice: 0,
        currentPrice: 0,
        warrantyStatus,
        distributorInfo,
        berthCount,
        fuelType,
        weightKg,
        hasKitchen,
        discountRate: 0,
        isActive: false,
      },
      client
    );

    if (!createdProduct) {
      throw new ApiError(500, "Failed to create product");
    }

    await productModel.createProductImages(
      {
        productId: createdProduct.productId,
        images,
      },
      client
    );

    const productWithImages = await productModel.getProductDetailsByIdForManager(
      createdProduct.productId,
      client
    );

    await client.query("COMMIT");

    return {
      message: "Product created successfully",
      product: productWithImages,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.updateProductDiscount = async ({ productId, discountRate, userRole }) => {
  assertSalesManager(userRole, "update discounts");

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

exports.updateProductBasePrice = async ({ productId, basePrice, userRole }) => {
  assertSalesManager(userRole, "update base prices");

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const normalizedBasePrice = normalizeBasePrice(basePrice);
  const client = await pool.connect();

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

    updatedProduct = await productModel.updateProductBasePrice(
      {
        productId,
        basePrice: normalizedBasePrice,
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

  return {
    message: "Product base price updated successfully",
    product: updatedProduct,
  };
};
