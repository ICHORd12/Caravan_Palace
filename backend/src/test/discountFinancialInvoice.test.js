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
      userRole: "product_manager",
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
      userRole: "product_manager",
    });

    expect(result.notificationSummary.triggered).toBe(false);
    expect(notifySpy).not.toHaveBeenCalled();
  });

  test("rejects non product managers", async () => {
    await expect(
      productService.updateProductDiscount({
        productId: "prod-3",
        discountRate: 10,
        userRole: "customer",
      })
    ).rejects.toThrow(/product managers/i);
  });
});

describe("productService.createProduct", () => {
  let client;

  beforeEach(() => {
    client = buildClient();
    jest.spyOn(pool, "connect").mockResolvedValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validPayload = {
    categoryId: "cat-1",
    name: "Adventure Caravan",
    model: "ADV-2026",
    serialNumber: "SN-ADD-001",
    description: "A new product manager-created caravan.",
    quantityInStocks: 4,
    basePrice: 100000,
    warrantyStatus: "3 Years",
    distributorInfo: "Caravan Palace",
    berthCount: 4,
    fuelType: "Diesel",
    weightKg: 2400,
    hasKitchen: true,
    discountRate: 10,
    images: [
      { url: "https://example.com/front.jpg", isPrimary: true },
      { url: "https://example.com/inside.jpg" },
    ],
  };

  test("creates a product and its images for product managers", async () => {
    jest.spyOn(productModel, "categoryExists").mockResolvedValue(true);
    jest.spyOn(productModel, "createProduct").mockResolvedValue({
      productId: "prod-new",
      ...validPayload,
      currentPrice: 90000,
      images: [],
    });
    jest.spyOn(productModel, "createProductImages").mockResolvedValue([]);
    jest.spyOn(productModel, "getProductDetailsById").mockResolvedValue({
      productId: "prod-new",
      currentPrice: 90000,
      discountRate: 10,
      images: [
        { url: "https://example.com/front.jpg", isPrimary: true },
        { url: "https://example.com/inside.jpg", isPrimary: false },
      ],
    });

    const result = await productService.createProduct({
      payload: validPayload,
      userRole: "product_manager",
    });

    expect(result.message).toBe("Product created successfully");
    expect(productModel.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        currentPrice: 90000,
        discountRate: 10,
      }),
      client
    );
    expect(productModel.createProductImages).toHaveBeenCalledWith(
      {
        productId: "prod-new",
        images: [
          { url: "https://example.com/front.jpg", isPrimary: true },
          { url: "https://example.com/inside.jpg", isPrimary: false },
        ],
      },
      client
    );
  });

  test("rejects non product managers", async () => {
    await expect(
      productService.createProduct({
        payload: validPayload,
        userRole: "customer",
      })
    ).rejects.toThrow(/product managers/i);
  });

  test("validates required product fields", async () => {
    await expect(
      productService.createProduct({
        payload: { ...validPayload, name: " " },
        userRole: "product_manager",
      })
    ).rejects.toThrow(/name cannot be empty/i);
  });
});

describe("productService.updateProductStock", () => {
  let client;

  beforeEach(() => {
    client = buildClient();
    jest.spyOn(pool, "connect").mockResolvedValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("sets stock for product managers", async () => {
    jest.spyOn(productModel, "getProductByIdForUpdate").mockResolvedValue({
      productId: "prod-stock",
      name: "Stock Caravan",
      quantityInStocks: 3,
    });
    jest.spyOn(productModel, "updateProductStock").mockResolvedValue({
      product_id: "prod-stock",
      quantity_in_stocks: 12,
    });
    jest.spyOn(productModel, "getProductDetailsById").mockResolvedValue({
      productId: "prod-stock",
      name: "Stock Caravan",
      quantityInStocks: 12,
    });

    const result = await productService.updateProductStock({
      productId: "prod-stock",
      quantityInStocks: 12,
      userRole: "product_manager",
    });

    expect(result.message).toBe("Product stock updated successfully");
    expect(result.previousQuantityInStocks).toBe(3);
    expect(result.product.quantityInStocks).toBe(12);
    expect(productModel.updateProductStock).toHaveBeenCalledWith(
      {
        productId: "prod-stock",
        quantityInStocks: 12,
      },
      client
    );
  });

  test("rejects non product managers", async () => {
    await expect(
      productService.updateProductStock({
        productId: "prod-stock",
        quantityInStocks: 12,
        userRole: "customer",
      })
    ).rejects.toThrow(/product managers/i);
  });

  test("validates stock as a non-negative integer", async () => {
    await expect(
      productService.updateProductStock({
        productId: "prod-stock",
        quantityInStocks: -1,
        userRole: "product_manager",
      })
    ).rejects.toThrow(/quantityInStocks must be at least 0/i);

    await expect(
      productService.updateProductStock({
        productId: "prod-stock",
        quantityInStocks: 1.5,
        userRole: "product_manager",
      })
    ).rejects.toThrow(/quantityInStocks must be an integer/i);
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
        discountLoss: 200,
        refundLoss: 150,
        totalLoss: 350,
        netRevenue: 850,
        profit: 850,
      });

    const result = await financialReportService.getFinancialSummary({
      startDate: "2026-01-01",
      endDate: "2026-01-03",
      userRole: "sales_manager",
    });

    expect(result.message).toBe("Financial summary fetched successfully");
    expect(result.summary.profit).toBe(850);
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
          discount_loss: "200.00",
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
    expect(result.totalLoss).toBe(350);
    expect(result.profit).toBe(850);
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
