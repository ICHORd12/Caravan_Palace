const ApiError = require("../utils/ApiError");
const pdfService = require("./pdfService");
const emailService = require("./emailService");
const { loadOrderForManager, loadOrderForUser } = require("../utils/orderLoader");

const buildInvoicePayload = async ({ order, items, user }) => {
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
 * Generate an invoice PDF (Buffer) for a given order, scoped to its owner.
 */
exports.generateInvoice = async ({ userId, orderId }) => {
  const { order, items, user } = await loadOrderForUser({ userId, orderId });

  return buildInvoicePayload({ order, items, user });
};

/**
 * Generate an invoice PDF (Buffer) for a given order, scoped for managers.
 */
exports.generateInvoiceForManager = async ({ orderId }) => {
  const { order, items, user } = await loadOrderForManager({ orderId });

  return buildInvoicePayload({ order, items, user });
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
