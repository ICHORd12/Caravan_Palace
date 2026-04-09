const cartModel = require("../models/cartModel");
const ApiError = require("../utils/ApiError");

exports.getCart = async (userId) => {
  const items = await cartModel.getCartItemsByUserId(userId);

  return {
    message: "Cart fetched successfully",
    items,
  };
};


exports.addItemToCart = async ({ userId, productId, quantity }) => {
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  if (quantity === undefined || quantity === null) {
    throw new ApiError(400, "Quantity is required");
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ApiError(400, "Quantity must be a positive integer");
  }

  const product = await productModel.getProductById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const existingCartItem = await cartModel.getCartItemByUserIdAndProductId(
    userId,
    productId
  );

  let cartItem;

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;

    cartItem = await cartModel.updateCartItemQuantity(
      userId,
      productId,
      newQuantity
    );
  } else {
    cartItem = await cartModel.createCartItem({
      userId,
      productId,
      quantity,
    });
  }

  return {
    message: "Item added to cart successfully",
    cartItem,
  };
};