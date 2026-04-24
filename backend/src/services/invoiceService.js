const ApiError = require("../utils/ApiError");
const orderModel = require("../models/orderModel");
const orderItemModel = require("../models/orderItemModel");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const pdfService = require("./pdfService");
const emailService = require("./emailService");

/**
 * Loads a full order (header + items + product names + user) for the owner.
 */
const loadOrderForUser = async ({ userId, orderId }) => {
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

/**
 * Generate an invoice PDF (Buffer) for a given order, scoped to its owner.
 */
exports.generateInvoice = async ({ userId, orderId }) => {
  const { order, items, user } = await loadOrderForUser({ userId, orderId });

  const pdfBuffer = await pdfService.generateInvoicePdf({
    order,
    items,
    user,
  });

  return {
    pdfBuffer,
    order,
    user,
  };
};

/**
 * Generate an invoice PDF for a given order and email it to the order's user.
 */
exports.emailInvoice = async ({ userId, orderId }) => {
  const { pdfBuffer, order, user } = await exports.generateInvoice({
    userId,
    orderId,
  });

  if (!user || !user.email) {
    throw new ApiError(400, "User does not have an email address on file");
  }

  await emailService.sendInvoiceEmail({
    to: user.email,
    pdfBuffer,
    orderId: order.orderId,
    customerName: user.name,
  });

  return {
    message: "Invoice emailed successfully",
    to: user.email,
    orderId: order.orderId,
  };
};
