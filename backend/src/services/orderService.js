const orderModel = require("../models/orderModel");
const productModel = require("../models/productModel");
const ApiError = require("../utils/ApiError");

// In-memory delivery timers
const deliveryTimers = {};

exports.createOrder = async (userId, items, shippingAddress) => {
  // Validate stock for each item
  for (const item of items) {
    const product = await productModel.getProductById(item.product_id);
    if (!product) {
      throw new ApiError(404, `Product ${item.product_id} not found`);
    }
    if (product.quantity_in_stocks < item.quantity) {
      throw new ApiError(400, `Insufficient stock for "${product.name}". Available: ${product.quantity_in_stocks}`);
    }
  }

  // Calculate total
  let totalAmount = 0;
  for (const item of items) {
    const product = await productModel.getProductById(item.product_id);
    totalAmount += product.current_price * item.quantity;
  }

  // Create order
  const order = await orderModel.createOrder(userId, totalAmount, shippingAddress);

  // Add items and decrement stock
  for (const item of items) {
    const product = await productModel.getProductById(item.product_id);
    await orderModel.addOrderItem(order.order_id, item.product_id, item.quantity, product.current_price);
    await productModel.decrementStock(item.product_id, item.quantity);
  }

  return order;
};

exports.startDeliverySimulation = (orderId) => {
  // processing -> in-transit after 15s
  deliveryTimers[orderId] = setTimeout(async () => {
    await orderModel.updateOrderStatus(orderId, "in-transit", null);
    console.log(`[Delivery] Order ${orderId}: in-transit`);

    // in-transit -> delivered after another 20s
    deliveryTimers[orderId] = setTimeout(async () => {
      await orderModel.updateOrderStatus(orderId, "delivered", null);
      console.log(`[Delivery] Order ${orderId}: delivered`);
      delete deliveryTimers[orderId];
    }, 20000);
  }, 15000);
};

exports.getMyOrders = async (userId) => {
  const orders = await orderModel.getOrdersByUserId(userId);
  return orders;
};

exports.getOrderById = async (orderId, userId) => {
  const order = await orderModel.getOrderById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.user_id !== userId) {
    throw new ApiError(403, "Unauthorized access to this order");
  }

  const items = await orderModel.getOrderItems(orderId);

  return { ...order, items };
};

exports.updateOrderPayment = async (orderId, transactionId) => {
  return orderModel.updateOrderStatus(orderId, "processing", transactionId);
};
