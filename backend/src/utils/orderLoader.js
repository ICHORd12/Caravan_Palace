const ApiError = require("../utils/ApiError");
const orderModel = require("../models/orderModel");
const orderItemModel = require("../models/orderItemModel");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");

/**
 * Loads a full order (header + items + product names + user) for the owner.
 */
exports.loadOrderForUser = async ({ userId, orderId }) => {
  if (!userId) throw new ApiError(400, "User id is required");
  if (!orderId) throw new ApiError(400, "Order ID is required");

  const order = await orderModel.getOrderByCustomerIdAndOrderId(
    userId,
    orderId
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const rawItems = await orderItemModel.getOrderItemsByOrderId(order.orderId);

  // Enrich items with product names when possible.
  const items = await Promise.all(
    rawItems.map(async (item) => {
      try {
        const product = await productModel.getProductById(item.productId);
        return {
          ...item,
          productName: product ? product.name : `Product #${item.productId}`,
        };
      } catch (_err) {
        return { ...item, productName: `Product #${item.productId}` };
      }
    })
  );

  const user = await userModel.findById(userId);

  return { order, items, user };
};