const pool = require("../config/db");
const ApiError = require("../utils/ApiError");
const orderModel = require("../models/orderModel");
const orderItemModel = require("../models/orderItemModel");
const productModel = require("../models/productModel");
const refundModel = require("../models/refundModel");
const deliveryModel = require("../models/deliveryModel");
const userModel = require("../models/userModel");
const emailService = require("./emailService");

const REFUND_WINDOW_DAYS = 30;
const ALLOWED_REFUND_STATUSES = ["pending", "approved", "rejected", "completed"];
const ALLOWED_MANAGER_STATUSES = ["approved", "rejected"];

const assertSalesManager = (userRole) => {
  if (userRole !== "sales_manager") {
    throw new ApiError(403, "Only sales managers can manage refunds");
  }
};

const isWithinRefundWindow = (deliveredAt) => {
  if (!deliveredAt) return false;

  const deliveredTime = new Date(deliveredAt).getTime();
  const nowTime = Date.now();
  const diffDays = (nowTime - deliveredTime) / (1000 * 60 * 60 * 24);

  return diffDays <= REFUND_WINDOW_DAYS;
};

const validateRefundEligibility = async ({ userId, orderId, client }) => {
  const order = await orderModel.getOrderByCustomerIdAndOrderIdForUpdate(
    userId,
    orderId,
    client
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status !== "delivered") {
    throw new ApiError(409, "Only delivered orders can be refunded");
  }

  const deliveredAt = await deliveryModel.getLatestCompletedDeliveryDateByOrderId(
    orderId,
    client
  );

  if (!deliveredAt) {
    throw new ApiError(409, "Order has no completed delivery record");
  }

  if (!isWithinRefundWindow(deliveredAt)) {
    throw new ApiError(409, "Refund window has expired");
  }

  return order;
};

exports.requestRefundForOrder = async ({ userId, orderId }) => {
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order = await validateRefundEligibility({ userId, orderId, client });

    const existingRefunds = await refundModel.getRefundsByOrderId(orderId, client);

    const hasActiveRefund = existingRefunds.some(
      (refund) => refund.status !== "rejected"
    );

    if (hasActiveRefund) {
      throw new ApiError(409, "Refund request already exists for this order");
    }

    const orderItems = await orderItemModel.getOrderItemsByOrderId(orderId, client);

    if (!orderItems || orderItems.length === 0) {
      throw new ApiError(400, "Order has no items to refund");
    }

    const createdRefunds = [];

    for (const item of orderItems) {
      const refundAmount = Number(item.purchasedPrice) * Number(item.quantity);

      const refund = await refundModel.createRefund(
        {
          orderItemId: item.orderItemId,
          refundAmount,
        },
        client
      );

      createdRefunds.push({
        ...refund,
        orderId: order.orderId,
        customerId: order.customerId,
      });
    }

    await client.query("COMMIT");

    const user = await userModel.findById(userId);
    if (user && user.email) {
      try {
        await emailService.sendOrderStatusEmail({
          to: user.email,
          orderId: order.orderId,
          status: "refund_requested",
          customerName: user.name,
        });
      } catch (_err) {
        // Email failures should not block refund request creation.
      }
    }

    return {
      message: "Refund request submitted successfully",
      refunds: createdRefunds,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.requestRefundForOrderItem = async ({ userId, orderId, orderItemId }) => {
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  if (!orderItemId) {
    throw new ApiError(400, "Order item ID is required");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order = await validateRefundEligibility({ userId, orderId, client });

    const orderItem = await orderItemModel.getOrderItemById(orderItemId, client);

    if (!orderItem || orderItem.orderId !== order.orderId) {
      throw new ApiError(404, "Order item not found for this order");
    }

    const existingRefund = await refundModel.getRefundByOrderItemId(
      orderItemId,
      client
    );

    if (existingRefund && existingRefund.status !== "rejected") {
      throw new ApiError(409, "Refund request already exists for this item");
    }

    const refundAmount = Number(orderItem.purchasedPrice) * Number(orderItem.quantity);

    const refund = await refundModel.createRefund(
      {
        orderItemId: orderItem.orderItemId,
        refundAmount,
      },
      client
    );

    await client.query("COMMIT");

    const user = await userModel.findById(userId);
    if (user && user.email) {
      try {
        await emailService.sendOrderStatusEmail({
          to: user.email,
          orderId: order.orderId,
          status: "refund_requested",
          customerName: user.name,
        });
      } catch (_err) {
        // Email failures should not block refund request creation.
      }
    }

    return {
      message: "Refund request submitted successfully",
      refund: {
        ...refund,
        orderId: order.orderId,
        customerId: order.customerId,
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.listRefunds = async ({ status, userRole }) => {
  assertSalesManager(userRole);

  if (status && !ALLOWED_REFUND_STATUSES.includes(status)) {
    throw new ApiError(400, "Invalid refund status filter");
  }

  const refunds = await refundModel.listRefunds({ status });

  return {
    message: "Refunds fetched successfully",
    refunds,
  };
};

exports.updateRefundStatus = async ({ refundId, status, userRole }) => {
  assertSalesManager(userRole);

  if (!refundId) {
    throw new ApiError(400, "Refund ID is required");
  }

  if (!ALLOWED_MANAGER_STATUSES.includes(status)) {
    throw new ApiError(400, "Refund status must be approved or rejected");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const refundWithOrder = await refundModel.getRefundWithOrder(refundId, client);

    if (!refundWithOrder) {
      throw new ApiError(404, "Refund not found");
    }

    const updatedRefund = await refundModel.updateRefundStatus(
      { refundId, status },
      client
    );

    if (!updatedRefund) {
      throw new ApiError(404, "Refund not found");
    }

    if (status === "approved" && refundWithOrder.status !== "approved") {
      const orderItem = await orderItemModel.getOrderItemById(
        refundWithOrder.orderItemId,
        client
      );

      if (!orderItem) {
        throw new ApiError(404, "Order item not found for this refund");
      }

      await productModel.increaseStock(
        {
          productId: orderItem.productId,
          quantity: orderItem.quantity,
        },
        client
      );

      const counts = await refundModel.getRefundCountsByOrderId(
        refundWithOrder.orderId,
        client
      );
      const orderItemCount = await orderItemModel.getOrderItemCountByOrderId(
        refundWithOrder.orderId,
        client
      );

      if (
        orderItemCount > 0 &&
        counts.total === orderItemCount &&
        counts.approved === orderItemCount
      ) {
        await orderModel.updateOrderStatus(
          {
            orderId: refundWithOrder.orderId,
            status: "returned",
          },
          client
        );
      }
    }

    await client.query("COMMIT");

    const user = await userModel.findById(refundWithOrder.customerId);
    if (user && user.email) {
      try {
        await emailService.sendOrderStatusEmail({
          to: user.email,
          orderId: refundWithOrder.orderId,
          status: status === "approved" ? "refund_approved" : "refund_rejected",
          customerName: user.name,
        });
      } catch (_err) {
        // Email failures should not block refund status updates.
      }
    }

    return {
      message: "Refund status updated successfully",
      refund: {
        ...updatedRefund,
        orderId: refundWithOrder.orderId,
        customerId: refundWithOrder.customerId,
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
