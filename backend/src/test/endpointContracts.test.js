process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { describe, test, expect, afterEach } = require("@jest/globals");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const deliveryService = require("../services/deliveryService");
const orderService = require("../services/orderService");
const refundService = require("../services/refundService");
const userService = require("../services/userService");

const buildToken = ({ userId = "user-1", role = "customer" } = {}) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET);

describe("endpoint contracts", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("GET /api/v3/orders/deliveries returns manager deliveries", async () => {
    const listSpy = jest
      .spyOn(deliveryService, "getAllDeliveriesForManager")
      .mockResolvedValue({
        message: "Deliveries fetched successfully",
        deliveries: [
          {
            deliveryId: "delivery-1",
            orderId: "order-1",
            customerId: "customer-1",
            productId: "product-1",
            quantity: 2,
            totalPrice: 300,
            address: "Istanbul",
            status: "in-transit",
          },
        ],
      });

    const response = await request(app)
      .get("/api/v3/orders/deliveries")
      .set(
        "Authorization",
        `Bearer ${buildToken({ userId: "manager-1", role: "product_manager" })}`
      )
      .expect(200);

    expect(response.body.deliveries).toHaveLength(1);
    expect(response.body.deliveries[0]).toMatchObject({
      deliveryId: "delivery-1",
      orderId: "order-1",
      customerId: "customer-1",
      productId: "product-1",
      quantity: 2,
      totalPrice: 300,
      address: "Istanbul",
      status: "in-transit",
    });
    expect(listSpy).toHaveBeenCalledWith({ userRole: "product_manager" });
  });

  test("GET /api/v3/users/me returns the authenticated user's profile", async () => {
    const getMeSpy = jest.spyOn(userService, "getMe").mockResolvedValue({
      message: "User fetched successfully",
      user: {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        taxId: "1234567890",
        role: "customer",
        createdAt: "2026-05-01T10:00:00.000Z",
        addresses: [],
      },
    });

    const response = await request(app)
      .get("/api/v3/users/me")
      .set("Authorization", `Bearer ${buildToken({ userId: "user-1" })}`)
      .expect(200);

    expect(response.body.user.id).toBe("user-1");
    expect(response.body.user.email).toBe("test@example.com");
    expect(getMeSpy).toHaveBeenCalledWith("user-1");
  });

  test("GET /api/v3/users/me/orders/:orderId returns customer order details", async () => {
    const getOrderDetailsSpy = jest
      .spyOn(orderService, "getOrderDetails")
      .mockResolvedValue({
        message: "Order fetched successfully",
        order: {
          orderId: "order-1",
          customerId: "user-1",
          totalPrice: 300,
          status: "processing",
          deliveryAddress: "Levent, Istanbul",
          items: [
            {
              orderItemId: "item-1",
              productId: "product-1",
              quantity: 2,
              purchasedPrice: 150,
            },
          ],
        },
      });

    const response = await request(app)
      .get("/api/v3/users/me/orders/order-1")
      .set("Authorization", `Bearer ${buildToken({ userId: "user-1" })}`)
      .expect(200);

    expect(response.body.order.orderId).toBe("order-1");
    expect(response.body.order.deliveryAddress).toBe("Levent, Istanbul");
    expect(response.body.order.items).toHaveLength(1);
    expect(getOrderDetailsSpy).toHaveBeenCalledWith({
      userId: "user-1",
      orderId: "order-1",
    });
  });

  test("PATCH /api/v3/refunds/:refundId updates a refund status", async () => {
    const updateRefundSpy = jest
      .spyOn(refundService, "updateRefundStatus")
      .mockResolvedValue({
        message: "Refund status updated successfully",
        refund: {
          refundId: "refund-1",
          orderId: "order-1",
          customerId: "user-1",
          status: "approved",
          refundAmount: 150,
        },
      });

    const response = await request(app)
      .patch("/api/v3/refunds/refund-1")
      .set(
        "Authorization",
        `Bearer ${buildToken({ userId: "manager-1", role: "sales_manager" })}`
      )
      .send({ status: "approved" })
      .expect(200);

    expect(response.body.refund.status).toBe("approved");
    expect(updateRefundSpy).toHaveBeenCalledWith({
      refundId: "refund-1",
      status: "approved",
      userRole: "sales_manager",
    });
  });

  test("PATCH /api/v3/orders/:orderId/status updates a manager order status", async () => {
    const updateOrderStatusSpy = jest
      .spyOn(orderService, "updateOrderStatusForManager")
      .mockResolvedValue({
        message: "Order status updated successfully",
        order: {
          orderId: "order-1",
          status: "in-transit",
        },
      });

    const response = await request(app)
      .patch("/api/v3/orders/order-1/status")
      .set(
        "Authorization",
        `Bearer ${buildToken({ userId: "manager-1", role: "product_manager" })}`
      )
      .send({ status: "in-transit" })
      .expect(200);

    expect(response.body.order.status).toBe("in-transit");
    expect(updateOrderStatusSpy).toHaveBeenCalledWith({
      orderId: "order-1",
      status: "in-transit",
      userRole: "product_manager",
    });
  });
});
