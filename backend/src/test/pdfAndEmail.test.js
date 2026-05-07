/**
 * Tests for the PDF generation service (pdfService) and the email service
 * (emailService), plus an integration test through invoiceService that proves
 * they work together end-to-end (without actually contacting an SMTP server).
 *
 * Run with:  npm test
 */

const pdfService = require("../services/pdfService");
const emailService = require("../services/emailService");
const invoiceService = require("../services/invoiceService");

// Sample fixtures reused across tests
const sampleOrder = {
  orderId: 1001,
  customerId: 42,
  cardLast4: "4242",
  totalPrice: 299.98,
  invoiceNumber: "INV-1001",
  status: "paid",
  deliveryAddress: "123 Caravan Street, Ankara, Turkey",
  orderDate: "2026-04-23T10:00:00.000Z",
};

const sampleItems = [
  {
    orderItemId: 1,
    orderId: 1001,
    productId: 11,
    quantity: 2,
    purchasedPrice: 99.99,
    productName: "Vintage Lamp",
  },
  {
    orderItemId: 2,
    orderId: 1001,
    productId: 12,
    quantity: 1,
    purchasedPrice: 100.0,
    productName: "Travel Kettle",
  },
];

const sampleUser = {
  userId: 42,
  name: "Arda C.",
  email: "arda_cevheroglu@hotmail.com",
};

describe("pdfService.generateInvoicePdf", () => {
  // --- Test 1 ---
  test("returns a Buffer containing a valid PDF header (%PDF-) for a well-formed order", async () => {
    const buffer = await pdfService.generateInvoicePdf({
      order: sampleOrder,
      items: sampleItems,
      user: sampleUser,
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100); // non-trivial file
    // Every PDF file begins with the magic bytes "%PDF-"
    expect(buffer.slice(0, 5).toString("utf8")).toBe("%PDF-");
    // And should end with the EOF marker "%%EOF"
    expect(buffer.slice(-6).toString("utf8")).toContain("%%EOF");
  });

  // --- Test 2 ---
  test("rejects when order is missing or items is not an array", async () => {
    await expect(
      pdfService.generateInvoicePdf({ order: null, items: sampleItems })
    ).rejects.toThrow(/Order is required/);

    await expect(
      pdfService.generateInvoicePdf({ order: sampleOrder, items: "not-array" })
    ).rejects.toThrow(/items must be an array/);
  });

  // --- Test 3 ---
  test("still produces a valid PDF when there are no line items", async () => {
    const buffer = await pdfService.generateInvoicePdf({
      order: { ...sampleOrder, totalPrice: 0 },
      items: [],
      user: sampleUser,
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.slice(0, 5).toString("utf8")).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(100);
  });
});

describe("emailService.sendMail / sendInvoiceEmail", () => {
  afterEach(() => {
    emailService._resetTransporter();
  });

  // --- Test 4 ---
  test("sendMail delegates to the underlying transporter with correct fields", async () => {
    const sendMailMock = jest.fn().mockResolvedValue({
      messageId: "mock-message-id",
      accepted: ["someone@example.com"],
    });
    const fakeTransporter = { sendMail: sendMailMock };

    const info = await emailService.sendMail({
      to: "someone@example.com",
      subject: "Hello",
      text: "Hi there",
      transporter: fakeTransporter,
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const payload = sendMailMock.mock.calls[0][0];
    expect(payload.to).toBe("someone@example.com");
    expect(payload.subject).toBe("Hello");
    expect(payload.text).toBe("Hi there");
    expect(payload.from).toBeDefined(); // uses env.MAIL_FROM

    expect(info.messageId).toBe("mock-message-id");
  });

  // --- Test 5 ---
  test("sendMail validates required fields (to, subject, body)", async () => {
    const noopTransporter = { sendMail: jest.fn() };

    await expect(
      emailService.sendMail({
        to: "",
        subject: "Hello",
        text: "Hi",
        transporter: noopTransporter,
      })
    ).rejects.toThrow(/Recipient email/);

    await expect(
      emailService.sendMail({
        to: "x@y.com",
        subject: "",
        text: "Hi",
        transporter: noopTransporter,
      })
    ).rejects.toThrow(/subject/);

    await expect(
      emailService.sendMail({
        to: "x@y.com",
        subject: "Hello",
        transporter: noopTransporter,
      })
    ).rejects.toThrow(/body/);

    expect(noopTransporter.sendMail).not.toHaveBeenCalled();
  });

  // --- Test 6 ---
  test("sendInvoiceEmail attaches the PDF buffer with the correct filename and content type", async () => {
    const sendMailMock = jest.fn().mockResolvedValue({ messageId: "abc" });
    const fakeTransporter = { sendMail: sendMailMock };

    const fakePdfBuffer = Buffer.from("%PDF-1.4\nfake pdf contents\n%%EOF");

    await emailService.sendInvoiceEmail({
      to: "buyer@example.com",
      pdfBuffer: fakePdfBuffer,
      orderId: 1001,
      customerName: "Arda",
      transporter: fakeTransporter,
    });

    expect(sendMailMock).toHaveBeenCalledTimes(1);

    const payload = sendMailMock.mock.calls[0][0];
    expect(payload.to).toBe("buyer@example.com");
    expect(payload.subject).toMatch(/Order #1001/);
    expect(payload.text).toContain("Hi Arda");
    expect(payload.html).toContain("<strong>#1001</strong>");

    expect(Array.isArray(payload.attachments)).toBe(true);
    expect(payload.attachments).toHaveLength(1);

    const attachment = payload.attachments[0];
    expect(attachment.filename).toBe("invoice-order-1001.pdf");
    expect(attachment.contentType).toBe("application/pdf");
    expect(Buffer.isBuffer(attachment.content)).toBe(true);
    expect(attachment.content.equals(fakePdfBuffer)).toBe(true);
  });
});

describe("invoiceService.emailInvoice (integration)", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    emailService._resetTransporter();
  });

  // --- Test 7 ---
  test("loads order data, generates a PDF, and sends it via the email transporter", async () => {
    const orderModel = require("../models/orderModel");
    const orderItemModel = require("../models/orderItemModel");
    const userModel = require("../models/userModel");
    const productModel = require("../models/productModel");

    jest
      .spyOn(orderModel, "getOrderByCustomerIdAndOrderId")
      .mockResolvedValue(sampleOrder);
    jest
      .spyOn(orderItemModel, "getOrderItemsByOrderId")
      .mockResolvedValue(sampleItems);
    jest.spyOn(userModel, "findById").mockResolvedValue(sampleUser);
    jest
      .spyOn(productModel, "getProductById")
      .mockImplementation(async (productId) => ({
        productId,
        name: `Product ${productId}`,
      }));

    const sendMailMock = jest.fn().mockResolvedValue({ messageId: "int-1" });
    emailService._setTransporter({ sendMail: sendMailMock });

    const result = await invoiceService.emailInvoice({
      userId: sampleUser.userId,
      orderId: sampleOrder.orderId,
    });

    expect(result.message).toMatch(/emailed/i);
    expect(result.to).toBe(sampleUser.email);
    expect(result.orderId).toBe(sampleOrder.orderId);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const payload = sendMailMock.mock.calls[0][0];
    expect(payload.to).toBe(sampleUser.email);
    expect(payload.subject).toMatch(/Order #1001/);

    const attachment = payload.attachments[0];
    expect(attachment.filename).toBe("invoice-order-1001.pdf");
    // The attached buffer should be a real PDF produced by pdfService.
    expect(Buffer.isBuffer(attachment.content)).toBe(true);
    expect(attachment.content.slice(0, 5).toString("utf8")).toBe("%PDF-");
  });
});
