const ApiError = require("../utils/ApiError");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");

exports.validateCheckout = async ({ userId }) => {
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  const cartItems = await cartModel.getCartItemsByUserId(userId);

  if (!cartItems || cartItems.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const stockIssues = [];

  for (const item of cartItems) {
    const product = await productModel.getProductById(item.product_id);

    if (!product) {
      stockIssues.push({
        productId: item.product_id,
        productName: item.name || "Unknown product",
        requestedQuantity: item.quantity,
        availableQuantity: 0,
      });
      continue;
    }

    if (item.quantity > product.quantity_in_stocks) {
      stockIssues.push({
        productId: product.product_id,
        productName: product.name,
        requestedQuantity: item.quantity,
        availableQuantity: product.quantity_in_stocks,
      });
    }
  }

  if (stockIssues.length > 0) {
    return {
      isValid: false,
      message: "Some items are out of stock",
      details: stockIssues,
    };
  }

  return {
    isValid: true,
    message: "Stock validation passed",
  };
};