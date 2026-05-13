const ApiError = require("../utils/ApiError");
const pool = require("../config/db");
const orderModel = require("../models/orderModel");
const orderItemModel = require("../models/orderItemModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const deliveryModel = require("../models/deliveryModel");
const emailService = require("./emailService");

const ALLOWED_MANAGER_STATUSES = ["in-transit", "delivered"];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const assertSalesManager = (userRole, message) => {
  if (userRole !== "sales_manager") {
    throw new ApiError(403, message || "Only sales managers can update order status");
  }
};

const parseDateOnly = (value, fieldName) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${fieldName} is required`);
  }

  const normalizedValue = value.trim();

  if (!DATE_ONLY_PATTERN.test(normalizedValue)) {
    throw new ApiError(400, `${fieldName} must use YYYY-MM-DD format`);
  }

  const [year, month, day] = normalizedValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new ApiError(400, `${fieldName} is not a valid calendar date`);
  }

  return { normalizedValue, date };
};

const addUtcDays = (date, days) => {
  const nextDate = new Date(date.getTime());
  nextDate.setUTCDate(nextDate.getUTCDate() + days);
  return nextDate;
};

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

exports.cancelOrder = async ({ userId, orderId }) => {
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order = await orderModel.getOrderByCustomerIdAndOrderIdForUpdate(
      userId,
      orderId,
      client
    );

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (order.status !== "processing") {
      throw new ApiError(409, "Only processing orders can be cancelled");
    }

    const orderItems = await orderItemModel.getOrderItemsByOrderId(
      order.orderId,
      client
    );

    for (const item of orderItems) {
      await productModel.increaseStock(
        {
          productId: item.productId,
          quantity: item.quantity,
        },
        client
      );
    }

    const updatedOrder = await orderModel.updateOrderStatus(
      {
        orderId: order.orderId,
        status: "cancelled",
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
          status: "cancelled",
          customerName: user.name,
        });
      } catch (_err) {
        // Email failures should not block order cancellation.
      }
    }

    return {
      message: "Order cancelled successfully",
      order: updatedOrder,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.updateOrderStatusForManager = async ({ orderId, status, userRole }) => {
  assertSalesManager(userRole);

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  if (!status) {
    throw new ApiError(400, "Status is required");
  }

  if (!ALLOWED_MANAGER_STATUSES.includes(status)) {
    throw new ApiError(400, "Status must be in-transit or delivered");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const order = await orderModel.getOrderByIdForUpdate(orderId, client);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (status === "in-transit" && order.status !== "processing") {
      throw new ApiError(409, "Only processing orders can move to in-transit");
    }

    if (status === "delivered" && order.status !== "in-transit") {
      throw new ApiError(409, "Only in-transit orders can be delivered");
    }

    const deliveryCount = await deliveryModel.getDeliveryCountByOrderId(
      orderId,
      client
    );

    if (deliveryCount === 0) {
      await deliveryModel.createDeliveriesForOrder(orderId, client);
    }

    if (status === "delivered") {
      await deliveryModel.markDeliveriesCompletedByOrderId(orderId, client);
      await orderItemModel.markOrderItemsDeliveredByOrderId(orderId, client);
    }

    const updatedOrder = await orderModel.updateOrderStatus(
      { orderId, status },
      client
    );

    await client.query("COMMIT");

    return {
      message: "Order status updated successfully",
      order: updatedOrder,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

exports.getAllOrdersForManager = async ({ status, startDate, endDate, userRole }) => {
  assertSalesManager(userRole, "Only sales managers can view all orders");

  if ((startDate && !endDate) || (!startDate && endDate)) {
    throw new ApiError(400, "startDate and endDate must be provided together");
  }

  if (status && (typeof status !== "string" || !status.trim())) {
    throw new ApiError(400, "status must be a non-empty string");
  }

  let startAt;
  let endAt;

  if (startDate && endDate) {
    const parsedStartDate = parseDateOnly(startDate, "startDate");
    const parsedEndDate = parseDateOnly(endDate, "endDate");

    if (parsedStartDate.date.getTime() > parsedEndDate.date.getTime()) {
      throw new ApiError(400, "startDate cannot be after endDate");
    }

    startAt = parsedStartDate.date.toISOString();
    endAt = addUtcDays(parsedEndDate.date, 1).toISOString();
  }

  const ordersWithCustomers = await orderModel.listOrdersForManager({
    status: status ? status.trim() : undefined,
    startAt,
    endAt,
  });

  const ordersWithItems = await Promise.all(
    ordersWithCustomers.map(async ({ order, customer }) => {
      const items = await orderItemModel.getOrderItemsByOrderId(order.orderId);

      return {
        ...order,
        customer,
        items,
      };
    })
  );

  return {
    message: "Orders fetched successfully",
    orders: ordersWithItems,
  };
};
