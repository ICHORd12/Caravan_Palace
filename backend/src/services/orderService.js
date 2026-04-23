const ApiError = require("../utils/ApiError");
const orderModel = require("../models/orderModel");
const orderItemModel = require("../models/orderItemModel");

exports.getOrders = async (userId) => {
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  const orders = await orderModel.getOrdersByCustomerId(userId);
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const items = await orderItemModel.getOrderItemsByOrderId(order.orderId);

      return {
        ...order,
        items,
      };
    })
  );

  return {
    message: "Orders fetched successfully",
    orders: ordersWithItems,
  };
};

exports.getOrderDetails = async ({ userId, orderId }) => {
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const order = await orderModel.getOrderByCustomerIdAndOrderId(userId, orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const items = await orderItemModel.getOrderItemsByOrderId(order.orderId);

  return {
    message: "Order fetched successfully",
    order: {
      ...order,
      items,
    },
  };
};