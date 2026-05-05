/**
 * Unit tests for order cancellation and refund workflows.
 *
 * These tests mock out DB access and external side effects.
 */

const { describe, test, expect, beforeEach, afterEach } = require("@jest/globals");
const pool = require("../config/db");
const orderService = require("../services/orderService");
const refundService = require("../services/refundService");
const orderModel = require("../models/orderModel");
const orderItemModel = require("../models/orderItemModel");
const productModel = require("../models/productModel");
const userModel = require("../models/userModel");
const refundModel = require("../models/refundModel");
const deliveryModel = require("../models/deliveryModel");
const emailService = require("../services/emailService");

const buildClient = () => ({
  query: jest.fn().mockResolvedValue({}),
  release: jest.fn(),
});

describe("orderService.cancelOrder", () => {
  let client;

  beforeEach(() => {
    client = buildClient();
    jest.spyOn(pool, "connect").mockResolvedValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejects when order status is not processing", async () => {
    jest
      .spyOn(orderModel, "getOrderByCustomerIdAndOrderIdForUpdate")
      .mockResolvedValue({ orderId: "order-1", status: "delivered" });

    const increaseSpy = jest
      .spyOn(productModel, "increaseStock")
      .mockResolvedValue({});

    await expect(
      orderService.cancelOrder({ userId: "user-1", orderId: "order-1" })
    ).rejects.toThrow(/processing/i);

    expect(increaseSpy).not.toHaveBeenCalled();
  });

  test("restocks items and cancels a processing order", async () => {
    jest
      .spyOn(orderModel, "getOrderByCustomerIdAndOrderIdForUpdate")
      .mockResolvedValue({
        orderId: "order-1",
        customerId: "user-1",
        status: "processing",
      });

    jest
      .spyOn(orderItemModel, "getOrderItemsByOrderId")
      .mockResolvedValue([
        { orderItemId: "item-1", productId: "prod-1", quantity: 2 },
        { orderItemId: "item-2", productId: "prod-2", quantity: 1 },
      ]);

    const increaseSpy = jest
      .spyOn(productModel, "increaseStock")
      .mockResolvedValue({ product_id: "prod-1", quantity_in_stocks: 5 });

    jest.spyOn(orderModel, "updateOrderStatus").mockResolvedValue({
      orderId: "order-1",
      status: "cancelled",
    });

    jest.spyOn(userModel, "findById").mockResolvedValue({
      userId: "user-1",
      name: "Test User",
      email: "test@example.com",
    });

    const emailSpy = jest
      .spyOn(emailService, "sendOrderStatusEmail")
      .mockResolvedValue({});

    const result = await orderService.cancelOrder({
      userId: "user-1",
      orderId: "order-1",
    });

    expect(result.message).toBe("Order cancelled successfully");
    expect(result.order.status).toBe("cancelled");
    expect(increaseSpy).toHaveBeenCalledTimes(2);
    expect(emailSpy).toHaveBeenCalledTimes(1);
  });
});

describe("refundService.requestRefundForOrder", () => {
  let client;

  beforeEach(() => {
    client = buildClient();
    jest.spyOn(pool, "connect").mockResolvedValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejects when refund window has expired", async () => {
    jest
      .spyOn(orderModel, "getOrderByCustomerIdAndOrderIdForUpdate")
      .mockResolvedValue({
        orderId: "order-2",
        customerId: "user-2",
        status: "delivered",
      });

    const pastDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    jest
      .spyOn(deliveryModel, "getLatestCompletedDeliveryDateByOrderId")
      .mockResolvedValue(pastDate);

    await expect(
      refundService.requestRefundForOrder({
        userId: "user-2",
        orderId: "order-2",
      })
    ).rejects.toThrow(/refund window has expired/i);
  });

  test("creates refunds for each order item", async () => {
    jest
      .spyOn(orderModel, "getOrderByCustomerIdAndOrderIdForUpdate")
      .mockResolvedValue({
        orderId: "order-3",
        customerId: "user-3",
        status: "delivered",
      });

    jest
      .spyOn(deliveryModel, "getLatestCompletedDeliveryDateByOrderId")
      .mockResolvedValue(new Date());

    jest.spyOn(refundModel, "getRefundsByOrderId").mockResolvedValue([]);

    jest
      .spyOn(orderItemModel, "getOrderItemsByOrderId")
      .mockResolvedValue([
        {
          orderItemId: "item-1",
          productId: "prod-1",
          quantity: 1,
          purchasedPrice: 100,
        },
        {
          orderItemId: "item-2",
          productId: "prod-2",
          quantity: 2,
          purchasedPrice: 50,
        },
      ]);

    const createSpy = jest
      .spyOn(refundModel, "createRefund")
      .mockImplementation(async ({ orderItemId, refundAmount }) => ({
        refundId: `refund-${orderItemId}`,
        orderItemId,
        status: "pending",
        refundAmount,
        requestDate: new Date().toISOString(),
        processedAt: null,
      }));

    jest.spyOn(userModel, "findById").mockResolvedValue({
      userId: "user-3",
      name: "Refund User",
      email: "refund@example.com",
    });

    jest
      .spyOn(emailService, "sendOrderStatusEmail")
      .mockResolvedValue({});

    const result = await refundService.requestRefundForOrder({
      userId: "user-3",
      orderId: "order-3",
    });

    expect(result.message).toBe("Refund request submitted successfully");
    expect(result.refunds).toHaveLength(2);
    expect(createSpy).toHaveBeenCalledTimes(2);
  });
});

describe("refundService.updateRefundStatus", () => {
  let client;

  beforeEach(() => {
    client = buildClient();
    jest.spyOn(pool, "connect").mockResolvedValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("approves refund and marks order returned when all refunds approved", async () => {
    jest.spyOn(refundModel, "getRefundWithOrder").mockResolvedValue({
      refundId: "refund-1",
      orderId: "order-4",
      customerId: "user-4",
    });

    jest.spyOn(refundModel, "updateRefundStatus").mockResolvedValue({
      refundId: "refund-1",
      status: "approved",
    });

    jest.spyOn(refundModel, "getRefundCountsByOrderId").mockResolvedValue({
      total: 2,
      approved: 2,
    });

    jest
      .spyOn(orderItemModel, "getOrderItemCountByOrderId")
      .mockResolvedValue(2);

    const updateOrderSpy = jest
      .spyOn(orderModel, "updateOrderStatus")
      .mockResolvedValue({
        orderId: "order-4",
        status: "returned",
      });

    jest.spyOn(userModel, "findById").mockResolvedValue({
      userId: "user-4",
      name: "Manager Test",
      email: "manager@example.com",
    });

    const emailSpy = jest
      .spyOn(emailService, "sendOrderStatusEmail")
      .mockResolvedValue({});

    const result = await refundService.updateRefundStatus({
      refundId: "refund-1",
      status: "approved",
      userRole: "sales_manager",
    });

    expect(result.message).toBe("Refund status updated successfully");
    expect(updateOrderSpy).toHaveBeenCalledTimes(1);
    expect(emailSpy).toHaveBeenCalledTimes(1);
  });
});

describe("refundService.requestRefundForOrderItem", () => {
  let client;

  beforeEach(() => {
    client = buildClient();
    jest.spyOn(pool, "connect").mockResolvedValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("creates a refund for a specific order item", async () => {
    jest
      .spyOn(orderModel, "getOrderByCustomerIdAndOrderIdForUpdate")
      .mockResolvedValue({
        orderId: "order-5",
        customerId: "user-5",
        status: "delivered",
      });

    jest
      .spyOn(deliveryModel, "getLatestCompletedDeliveryDateByOrderId")
      .mockResolvedValue(new Date());

    jest.spyOn(orderItemModel, "getOrderItemById").mockResolvedValue({
      orderItemId: "item-5",
      orderId: "order-5",
      quantity: 1,
      purchasedPrice: 250,
    });

    jest
      .spyOn(refundModel, "getRefundByOrderItemId")
      .mockResolvedValue(null);

    jest.spyOn(refundModel, "createRefund").mockResolvedValue({
      refundId: "refund-5",
      orderItemId: "item-5",
      status: "pending",
      refundAmount: 250,
      requestDate: new Date().toISOString(),
      processedAt: null,
    });

    jest.spyOn(userModel, "findById").mockResolvedValue({
      userId: "user-5",
      name: "Item Refund",
      email: "item@example.com",
    });

    jest
      .spyOn(emailService, "sendOrderStatusEmail")
      .mockResolvedValue({});

    const result = await refundService.requestRefundForOrderItem({
      userId: "user-5",
      orderId: "order-5",
      orderItemId: "item-5",
    });

    expect(result.message).toBe("Refund request submitted successfully");
    expect(result.refund.orderItemId).toBe("item-5");
  });
});
