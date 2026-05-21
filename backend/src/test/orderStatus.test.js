/**
 * Unit tests for product-manager order status transitions.
 */

const { describe, test, expect, beforeEach, afterEach } = require("@jest/globals");
const pool = require("../config/db");
const orderService = require("../services/orderService");
const orderModel = require("../models/orderModel");
const orderItemModel = require("../models/orderItemModel");
const deliveryModel = require("../models/deliveryModel");

const buildClient = () => ({
  query: jest.fn().mockResolvedValue({}),
  release: jest.fn(),
});

describe("orderService.updateOrderStatusForManager", () => {
  let client;

  beforeEach(() => {
    client = buildClient();
    jest.spyOn(pool, "connect").mockResolvedValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejects non product managers", async () => {
    await expect(
      orderService.updateOrderStatusForManager({
        orderId: "order-1",
        status: "in-transit",
        userRole: "sales_manager",
      })
    ).rejects.toThrow(/product managers/i);
  });

  test("rejects invalid status", async () => {
    await expect(
      orderService.updateOrderStatusForManager({
        orderId: "order-1",
        status: "processing",
        userRole: "product_manager",
      })
    ).rejects.toThrow(/in-transit or delivered/i);
  });

  test("moves processing order to in-transit and creates deliveries", async () => {
    jest.spyOn(orderModel, "getOrderByIdForUpdate").mockResolvedValue({
      orderId: "order-2",
      status: "processing",
    });

    jest
      .spyOn(deliveryModel, "getDeliveryCountByOrderId")
      .mockResolvedValue(0);

    const createDeliveriesSpy = jest
      .spyOn(deliveryModel, "createDeliveriesForOrder")
      .mockResolvedValue(2);

    jest.spyOn(orderModel, "updateOrderStatus").mockResolvedValue({
      orderId: "order-2",
      status: "in-transit",
    });

    const result = await orderService.updateOrderStatusForManager({
      orderId: "order-2",
      status: "in-transit",
      userRole: "product_manager",
    });

    expect(result.message).toBe("Order status updated successfully");
    expect(result.order.status).toBe("in-transit");
    expect(createDeliveriesSpy).toHaveBeenCalledTimes(1);
  });

  test("moves in-transit order to delivered and completes deliveries", async () => {
    jest.spyOn(orderModel, "getOrderByIdForUpdate").mockResolvedValue({
      orderId: "order-3",
      status: "in-transit",
    });

    jest
      .spyOn(deliveryModel, "getDeliveryCountByOrderId")
      .mockResolvedValue(2);

    const completeSpy = jest
      .spyOn(deliveryModel, "markDeliveriesCompletedByOrderId")
      .mockResolvedValue(2);

    const markItemsDeliveredSpy = jest
      .spyOn(orderItemModel, "markOrderItemsDeliveredByOrderId")
      .mockResolvedValue(2);

    jest.spyOn(orderModel, "updateOrderStatus").mockResolvedValue({
      orderId: "order-3",
      status: "delivered",
    });

    const result = await orderService.updateOrderStatusForManager({
      orderId: "order-3",
      status: "delivered",
      userRole: "product_manager",
    });

    expect(result.message).toBe("Order status updated successfully");
    expect(result.order.status).toBe("delivered");
    expect(completeSpy).toHaveBeenCalledTimes(1);
    expect(markItemsDeliveredSpy).toHaveBeenCalledWith("order-3", client);
  });
});
