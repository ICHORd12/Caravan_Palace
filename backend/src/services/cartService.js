const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
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

  let availableStockQuantity = product.quantityInStocks;

  const existingCartItem = await cartModel.getCartItemByUserIdAndProductId(
    userId,
    productId
  );

  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;
    if (newQuantity > availableStockQuantity) {
        throw new ApiError(400, "Requested quantity exceeds available stock (" + availableStockQuantity + ")");
    }

    await cartModel.updateCartItemQuantity(
      userId,
      productId,
      newQuantity
    );
  } else {
    if (quantity > availableStockQuantity) {
        throw new ApiError(400, "Requested quantity exceeds available stock (" + availableStockQuantity + ")");
    }
    await cartModel.createCartItem({
      userId,
      productId,
      quantity,
    });
  }

  const cartItem = await cartModel.getCartItemWithProductByUserIdAndProductId(userId, productId);

  return {
    message: "Item added to cart successfully",
    cartItem,
  };
};


exports.updateCartItemQuantity = async ({ userId, productId, quantity }) => {
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

  if (!existingCartItem) {
    throw new ApiError(404, "Cart item not found");
  }

  let availableStockQuantity = product.quantityInStocks;

  if (quantity > availableStockQuantity) {
    throw new ApiError(400, "Requested quantity exceeds available stock (" + availableStockQuantity + ")");
  }

  await cartModel.updateCartItemQuantity(
    userId,
    productId,
    quantity
  );
  
  const updatedCartItem = await cartModel.getCartItemWithProductByUserIdAndProductId(userId, productId);

  return {
    message: "Cart item quantity updated successfully",
    cartItem: updatedCartItem,
  };
};


exports.deleteCartItem = async ({ userId, productId }) => {
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const existingCartItem = await cartModel.getCartItemByUserIdAndProductId(
    userId,
    productId
  );

  if (!existingCartItem) {
    throw new ApiError(404, "Cart item not found");
  }

  const deletedItem = await cartModel.deleteCartItem(userId, productId);

  return {
    message: "Cart item deleted successfully",
    deletedItem: deletedItem,
  };
};


exports.clearCart = async (userId) => {
  const deletedItems = await cartModel.clearCartByUserId(userId);

  return {
    message: "Cart cleared successfully",
    deletedItems: deletedItems,
  };
};


exports.mergeCart = async ({ userId, items }) => {
  if (!Array.isArray(items)) {
    throw new ApiError(400, "Items must be an array");
  }

  const adjustments = [];

  for (const item of items) {
    const productId = item.productId;
    const parsedQuantity = Number(item.quantity);

    if (!productId) {
      adjustments.push({
        productId: null,
        requestedQuantity: item.quantity,
        finalQuantity: 0,
        reason: "missing_product_id",
      });
      continue;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      adjustments.push({
        productId: productId,
        requestedQuantity: item.quantity,
        finalQuantity: 0,
        reason: "invalid_quantity",
      });
      continue;
    }

    const product = await productModel.getProductById(productId);

    if (!product) {
      adjustments.push({
        productId: productId,
        requestedQuantity: parsedQuantity,
        finalQuantity: 0,
        reason: "product_not_found",
      });
      continue;
    }

    let availableStockQuantity = product.quantityInStocks;

    if (availableStockQuantity <= 0) {
      adjustments.push({
        productId: productId,
        requestedQuantity: parsedQuantity,
        finalQuantity: 0,
        reason: "out_of_stock",
      });
      continue;
    }

    const existingCartItem = await cartModel.getCartItemByUserIdAndProductId(
      userId,
      productId
    );

    if (existingCartItem) {
      const requestedQuantity = existingCartItem.quantity + parsedQuantity;
      const finalQuantity = Math.min(requestedQuantity, availableStockQuantity);
      
      if (finalQuantity !== requestedQuantity) {
        adjustments.push({
          productId: productId,
          requestedQuantity: requestedQuantity,
          finalQuantity: finalQuantity,
          reason: "stock_limit",
        });
      }

      await cartModel.updateCartItemQuantity(userId, productId, finalQuantity);
    } else {
      const finalQuantity = Math.min(parsedQuantity, availableStockQuantity);
      
      if (finalQuantity !== parsedQuantity) {
        adjustments.push({
          productId: productId,
          requestedQuantity: parsedQuantity,
          finalQuantity: finalQuantity,
          reason: "stock_limit",
        });
      }

      if (finalQuantity > 0) {
        await cartModel.createCartItem({
          userId,
          productId,
          quantity: finalQuantity,
        });
      }
    }
  }

  const updatedCartItems = await cartModel.getCartItemsByUserId(userId);

  return {
    message: "Cart merged successfully",
    items: updatedCartItems,
    adjustments,
  };
};