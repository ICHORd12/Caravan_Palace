process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { describe, test, expect, beforeEach, afterEach } = require("@jest/globals");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const app = require("../app");
const productService = require("../services/productService");
const productModel = require("../models/productModel");
const discountNotificationService = require("../services/discountNotificationService");
const emailService = require("../services/emailService");
const financialReportService = require("../services/financialReportService");
const financialReportModel = require("../models/financialReportModel");
const invoiceService = require("../services/invoiceService");

const buildClient = () => ({
  query: jest.fn().mockResolvedValue({}),
  release: jest.fn(),
});

describe("productService.updateProductDiscount", () => {
  let client;

  beforeEach(() => {
    client = buildClient();
    jest.spyOn(pool, "connect").mockResolvedValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("notifies wishlist users when the discount increases", async () => {
    jest.spyOn(productModel, "getProductDiscountForUpdate").mockResolvedValue({
      productId: "prod-1",
      name: "Touring Caravan",
      basePrice: 1000,
      currentPrice: 900,
      discountRate: 10,
    });

    jest.spyOn(productModel, "updateProductDiscount").mockResolvedValue({
      productId: "prod-1",
      name: "Touring Caravan",
      basePrice: 1000,
      currentPrice: 800,
      discountRate: 20,
    });

    const notifySpy = jest
      .spyOn(discountNotificationService, "notifyWishlistUsersForDiscountIncrease")
      .mockResolvedValue({
        triggered: true,
        productId: "prod-1",
        attempted: 2,
        sent: 2,
        failed: 0,
      });

    const result = await productService.updateProductDiscount({
      productId: "prod-1",
      discountRate: 20,
      userRole: "sales_manager",
    });

    expect(result.message).toBe("Product discount updated successfully");
    expect(result.previousDiscountRate).toBe(10);
    expect(result.notificationSummary.sent).toBe(2);
    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(productModel.updateProductDiscount).toHaveBeenCalledWith(
      { productId: "prod-1", discountRate: 20 },
      client
    );
  });

  test("does not notify when the discount is unchanged or lower", async () => {
    jest.spyOn(productModel, "getProductDiscountForUpdate").mockResolvedValue({
      productId: "prod-2",
      name: "Compact Caravan",
      basePrice: 1000,
      currentPrice: 800,
      discountRate: 20,
    });

    jest.spyOn(productModel, "updateProductDiscount").mockResolvedValue({
      productId: "prod-2",
      name: "Compact Caravan",
      basePrice: 1000,
      currentPrice: 850,
      discountRate: 15,
    });

    const notifySpy = jest.spyOn(
      discountNotificationService,
      "notifyWishlistUsersForDiscountIncrease"
    );

    const result = await productService.updateProductDiscount({
      productId: "prod-2",
      discountRate: 15,
      userRole: "sales_manager",
    });

    expect(result.notificationSummary.triggered).toBe(false);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  test("rejects non sales managers", async () => {
    await expect(
      productService.updateProductDiscount({
        productId: "prod-3",
        discountRate: 10,
        userRole: "customer",
      })
    ).rejects.toThrow(/sales managers/i);
  });
});

describe("emailService.sendWishlistDiscountEmail", () => {
  afterEach(() => {
    emailService._resetTransporter();
  });

  test("sends a wishlist discount email through the configured transporter", async () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: "wishlist-1" });
    const fakeTransporter = { sendMail: sendMailMock };

    await emailService.sendWishlistDiscountEmail({
      to: "buyer@example.com",
      customerName: "Buyer",
      productName: "Family Caravan",
      previousDiscountRate: 5,
      newDiscountRate: 15,
      basePrice: 1000,
      currentPrice: 850,
      transporter: fakeTransporter,
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const payload = sendMailMock.mock.calls[0][0];
    expect(payload.to).toBe("buyer@example.com");
    expect(payload.subject).toMatch(/15% off/);
    expect(payload.text).toContain("Discount: 5% -> 15%");
    expect(payload.html).toContain("Family Caravan");
  });
});

describe("financialReportService.getFinancialSummary", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("loads a sales-manager financial summary for an inclusive date range", async () => {
    const modelSpy = jest
      .spyOn(financialReportModel, "getFinancialSummaryByOrderDateRange")
      .mockResolvedValue({
        orderCount: 2,
        itemsSold: 3,
        refundCount: 1,
        potentialRevenue: 1200,
        grossRevenue: 1000,
        refundLoss: 150,
        totalLoss: 150,
        netRevenue: 850,
        profit: 425,
      });

    const result = await financialReportService.getFinancialSummary({
      startDate: "2026-01-01",
      endDate: "2026-01-03",
      userRole: "sales_manager",
    });

    expect(result.message).toBe("Financial summary fetched successfully");
  expect(result.summary.profit).toBe(425);
    expect(modelSpy).toHaveBeenCalledWith({
      startAt: "2026-01-01T00:00:00.000Z",
      endAt: "2026-01-04T00:00:00.000Z",
    });
  });

  test("rejects non sales managers and invalid dates", async () => {
    await expect(
      financialReportService.getFinancialSummary({
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        userRole: "customer",
      })
    ).rejects.toThrow(/sales managers/i);

    await expect(
      financialReportService.getFinancialSummary({
        startDate: "2026-02-30",
        endDate: "2026-03-01",
        userRole: "sales_manager",
      })
    ).rejects.toThrow(/valid calendar date/i);
  });
});

describe("financialReportModel.getFinancialSummaryByOrderDateRange", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("maps revenue, loss, and profit totals from SQL rows", async () => {
    jest.spyOn(pool, "query").mockResolvedValue({
      rows: [
        {
          order_count: 2,
          items_sold: 4,
          refund_count: 1,
          potential_revenue: "1200.00",
          gross_revenue: "1000.00",
          refund_loss: "150.00",
        },
      ],
    });

    const result =
      await financialReportModel.getFinancialSummaryByOrderDateRange({
        startAt: "2026-01-01T00:00:00.000Z",
        endAt: "2026-01-04T00:00:00.000Z",
      });

    expect(result.grossRevenue).toBe(1000);
    expect(result.totalLoss).toBe(150);
    expect(result.profit).toBe(425);
  });
});

describe("historical order invoice download route", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("downloads a PDF invoice from the authenticated order history path", async () => {
    const pdfBuffer = Buffer.from("%PDF-1.4\ninvoice\n%%EOF");
    jest.spyOn(invoiceService, "generateInvoice").mockResolvedValue({
      pdfBuffer,
      order: { orderId: "order-1" },
      user: { userId: "user-1" },
    });

    const token = jwt.sign(
      { userId: "user-1", role: "customer" },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get("/api/v3/users/me/orders/order-1/invoice.pdf")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.headers["content-type"]).toMatch(/application\/pdf/);
    expect(response.headers["content-disposition"]).toContain(
      "invoice-order-order-1.pdf"
    );
    expect(invoiceService.generateInvoice).toHaveBeenCalledWith({
      userId: "user-1",
      orderId: "order-1",
    });
  });
});

describe("sales manager invoice download route", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("downloads a PDF invoice for any order", async () => {
    const pdfBuffer = Buffer.from("%PDF-1.4\ninvoice\n%%EOF");
    jest.spyOn(invoiceService, "generateInvoiceForManager").mockResolvedValue({
      pdfBuffer,
      order: { orderId: "order-1" },
      user: { userId: "user-2" },
    });

    const token = jwt.sign(
      { userId: "manager-1", role: "sales_manager" },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get("/api/v3/orders/order-1/invoice.pdf")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.headers["content-type"]).toMatch(/application\/pdf/);
    expect(response.headers["content-disposition"]).toContain(
      "invoice-order-order-1.pdf"
    );
    expect(invoiceService.generateInvoiceForManager).toHaveBeenCalledWith({
      orderId: "order-1",
    });
  });

  test("rejects non sales managers", async () => {
    const generateSpy = jest.spyOn(invoiceService, "generateInvoiceForManager");

    const token = jwt.sign(
      { userId: "user-1", role: "customer" },
      process.env.JWT_SECRET
    );

    await request(app)
      .get("/api/v3/orders/order-1/invoice.pdf")
      .set("Authorization", `Bearer ${token}`)
      .expect(403);

    expect(generateSpy).not.toHaveBeenCalled();
  });
});
