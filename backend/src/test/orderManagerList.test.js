/**
 * Unit tests for sales-manager order list workflow.
 */

const { describe, test, expect, afterEach } = require("@jest/globals");
const orderService = require("../services/orderService");
const deliveryService = require("../services/deliveryService");
const orderModel = require("../models/orderModel");
const orderItemModel = require("../models/orderItemModel");
const deliveryModel = require("../models/deliveryModel");
const pool = require("../config/db");

const buildDateUtc = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

describe("orderService.getAllOrdersForManager", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejects non sales managers", async () => {
    await expect(
      orderService.getAllOrdersForManager({
        userRole: "customer",
      })
    ).rejects.toThrow(/sales managers/i);
  });

  test("allows product managers to view all orders", async () => {
    jest.spyOn(orderModel, "listOrdersForManager").mockResolvedValue([]);
    jest.spyOn(orderItemModel, "getOrderItemsByOrderId").mockResolvedValue([]);

    await expect(
      orderService.getAllOrdersForManager({
        userRole: "product_manager",
      })
    ).resolves.toMatchObject({
      message: "Orders fetched successfully",
      orders: [],
    });
  });

  test("rejects when date filters are incomplete", async () => {
    await expect(
      orderService.getAllOrdersForManager({
        userRole: "sales_manager",
        startDate: "2026-05-01",
      })
    ).rejects.toThrow(/startDate and endDate/i);
  });

  test("trims status and passes date range filters", async () => {
    const listSpy = jest
      .spyOn(orderModel, "listOrdersForManager")
      .mockResolvedValue([]);

    jest
      .spyOn(orderItemModel, "getOrderItemsByOrderId")
      .mockResolvedValue([]);

    const expectedStartAt = buildDateUtc(2026, 5, 1).toISOString();
    const expectedEndAt = buildDateUtc(2026, 5, 2);
    expectedEndAt.setUTCDate(expectedEndAt.getUTCDate() + 1);

    await orderService.getAllOrdersForManager({
      userRole: "sales_manager",
      status: " delivered ",
      startDate: "2026-05-01",
      endDate: "2026-05-02",
    });

    expect(listSpy).toHaveBeenCalledWith({
      status: "delivered",
      startAt: expectedStartAt,
      endAt: expectedEndAt.toISOString(),
    });
  });

  test("returns orders with customer info and items", async () => {
    jest.spyOn(orderModel, "listOrdersForManager").mockResolvedValue([
      {
        order: {
          orderId: "order-1",
          customerId: "user-1",
          cardLast4: "1111",
          totalPrice: 150,
          invoiceNumber: "INV-2026-0001",
          status: "processing",
          deliveryAddress: "Istanbul",
          orderDate: "2026-05-01T10:00:00.000Z",
        },
        customer: {
          userId: "user-1",
          name: "Test User",
          email: "test@example.com",
          taxId: "1234567890",
          role: "customer",
          createdAt: "2026-04-01T10:00:00.000Z",
        },
      },
    ]);

    jest.spyOn(orderItemModel, "getOrderItemsByOrderId").mockResolvedValue([
      {
        orderItemId: "item-1",
        orderId: "order-1",
        productId: "prod-1",
        quantity: 1,
        purchasedPrice: 150,
        isDelivered: false,
      },
    ]);

    const result = await orderService.getAllOrdersForManager({
      userRole: "sales_manager",
    });

    expect(result.message).toBe("Orders fetched successfully");
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].customer.email).toBe("test@example.com");
    expect(result.orders[0].items).toHaveLength(1);
  });
});

describe("deliveryService.getAllDeliveriesForManager", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("rejects non manager users", async () => {
    await expect(
      deliveryService.getAllDeliveriesForManager({
        userRole: "customer",
      })
    ).rejects.toThrow(/sales managers or product managers/i);
  });

  test("allows product managers to view all deliveries", async () => {
    jest.spyOn(deliveryModel, "listDeliveriesForManager").mockResolvedValue([]);

    await expect(
      deliveryService.getAllDeliveriesForManager({
        userRole: "product_manager",
      })
    ).resolves.toMatchObject({
      message: "Deliveries fetched successfully",
      deliveries: [],
    });
  });

  test("returns deliveries for sales managers", async () => {
    jest.spyOn(deliveryModel, "listDeliveriesForManager").mockResolvedValue([
      {
        deliveryId: "delivery-1",
        orderId: "order-1",
        customerId: "user-1",
        productId: "prod-1",
        quantity: 2,
        totalPrice: 300,
        address: "Istanbul",
        status: "in-transit",
      },
    ]);

    const result = await deliveryService.getAllDeliveriesForManager({
      userRole: "sales_manager",
    });

    expect(result.message).toBe("Deliveries fetched successfully");
    expect(result.deliveries).toHaveLength(1);
    expect(result.deliveries[0]).toMatchObject({
      deliveryId: "delivery-1",
      orderId: "order-1",
      customerId: "user-1",
      productId: "prod-1",
      quantity: 2,
      totalPrice: 300,
      address: "Istanbul",
      status: "in-transit",
    });
  });
});

describe("deliveryModel.listDeliveriesForManager", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("maps delivery rows and derives delivery statuses", async () => {
    const querySpy = jest.spyOn(pool, "query").mockResolvedValue({
      rows: [
        {
          delivery_id: "delivery-1",
          order_id: "order-1",
          customer_id: "user-1",
          product_id: "prod-1",
          quantity: 2,
          total_price: "300.00",
          address: "Istanbul",
          status: "in-transit",
        },
        {
          delivery_id: "delivery-2",
          order_id: "order-2",
          customer_id: "user-2",
          product_id: "prod-2",
          quantity: 1,
          total_price: "450.50",
          address: "Ankara",
          status: "delivered",
        },
      ],
    });

    const deliveries = await deliveryModel.listDeliveriesForManager();

    const sql = querySpy.mock.calls[0][0];
    expect(sql).toMatch(/CASE/i);
    expect(sql).toMatch(/WHEN is_completed = true THEN 'delivered'/i);
    expect(sql).toMatch(/ELSE 'in-transit'/i);
    expect(sql).toMatch(/ORDER BY updated_at DESC, delivery_id ASC/i);
    expect(deliveries).toEqual([
      {
        deliveryId: "delivery-1",
        orderId: "order-1",
        customerId: "user-1",
        productId: "prod-1",
        quantity: 2,
        totalPrice: 300,
        address: "Istanbul",
        status: "in-transit",
      },
      {
        deliveryId: "delivery-2",
        orderId: "order-2",
        customerId: "user-2",
        productId: "prod-2",
        quantity: 1,
        totalPrice: 450.5,
        address: "Ankara",
        status: "delivered",
      },
    ]);
  });
});
