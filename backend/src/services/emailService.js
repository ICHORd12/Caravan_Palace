const nodemailer = require("nodemailer");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

let cachedTransporter = null;

/**
 * Returns a singleton nodemailer transporter built from env config.
 * In tests, callers can override by passing their own transporter to sendMail.
 */
exports.getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true for 465, false for 587/others
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });

  return cachedTransporter;
};

/**
 * Test-only hook: reset the cached transporter (useful when tests swap env vars).
 */
exports._resetTransporter = () => {
  cachedTransporter = null;
};

/**
 * Test-only hook: inject a custom transporter (e.g. a mock).
 */
exports._setTransporter = (transporter) => {
  cachedTransporter = transporter;
};

/**
 * Generic sendMail wrapper with validation.
 *
 * @param {Object} options
 * @param {string} options.to       - Recipient email address.
 * @param {string} options.subject  - Email subject.
 * @param {string} [options.text]   - Plain-text body.
 * @param {string} [options.html]   - HTML body.
 * @param {Array}  [options.attachments] - Nodemailer attachments array.
 * @param {Object} [options.transporter] - Optional transporter override (for tests).
 * @returns {Promise<Object>} sendMail result
 */
exports.sendMail = async ({
  to,
  subject,
  text,
  html,
  attachments,
  transporter,
}) => {
  if (!to || typeof to !== "string") {
    throw new ApiError(400, "Recipient email (to) is required");
  }

  if (!subject || typeof subject !== "string") {
    throw new ApiError(400, "Email subject is required");
  }

  if (!text && !html) {
    throw new ApiError(400, "Email body (text or html) is required");
  }

  const activeTransporter = transporter || exports.getTransporter();

  const info = await activeTransporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text,
    html,
    attachments,
  });

  return info;
};

/**
 * Sends an invoice PDF to a user as an email attachment.
 *
 * @param {Object} params
 * @param {string} params.to           - Recipient email.
 * @param {Buffer} params.pdfBuffer    - PDF file contents.
 * @param {string|number} params.orderId - Related order id (used in subject + filename).
 * @param {string} [params.customerName] - Optional recipient name for greeting.
 * @param {Object} [params.transporter]  - Optional transporter override (for tests).
 * @returns {Promise<Object>} sendMail result
 */
exports.sendInvoiceEmail = async ({
  to,
  pdfBuffer,
  orderId,
  customerName,
  transporter,
}) => {
  if (!to || typeof to !== "string") {
    throw new ApiError(400, "Recipient email is required");
  }

  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw new ApiError(400, "A valid PDF buffer is required");
  }

  if (orderId === undefined || orderId === null) {
    throw new ApiError(400, "Order ID is required");
  }

  const greeting = customerName ? `Hi ${customerName},` : "Hello,";

  const text =
    `${greeting}\n\n` +
    `Thank you for your purchase at Caravan Palace!\n` +
    `Please find your invoice for order #${orderId} attached to this email.\n\n` +
    `If you have any questions, feel free to reply to this message.\n\n` +
    `— The Caravan Palace Team`;

  const html =
    `<p>${greeting}</p>` +
    `<p>Thank you for your purchase at <strong>Caravan Palace</strong>!</p>` +
    `<p>Please find your invoice for order <strong>#${orderId}</strong> attached to this email.</p>` +
    `<p>If you have any questions, feel free to reply to this message.</p>` +
    `<p>— The Caravan Palace Team</p>`;

  return exports.sendMail({
    to,
    subject: `Your Caravan Palace Invoice - Order #${orderId}`,
    text,
    html,
    attachments: [
      {
        filename: `invoice-order-${orderId}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
    transporter,
  });
};

/**
 * Sends an order status email for cancellation and refund events.
 */
exports.sendOrderStatusEmail = async ({
  to,
  orderId,
  status,
  customerName,
  transporter,
}) => {
  if (!to || typeof to !== "string") {
    throw new ApiError(400, "Recipient email is required");
  }

  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }

  const greeting = customerName ? `Hi ${customerName},` : "Hello,";

  let subject = "";
  let text = "";
  let html = "";

  switch (status) {
    case "cancelled":
      subject = `Order #${orderId} cancelled`;
      text =
        `${greeting}\n\n` +
        `Your order #${orderId} has been cancelled. ` +
        `If this was a mistake, you can place a new order anytime.\n\n` +
        `— The Caravan Palace Team`;
      html =
        `<p>${greeting}</p>` +
        `<p>Your order <strong>#${orderId}</strong> has been cancelled.</p>` +
        `<p>If this was a mistake, you can place a new order anytime.</p>` +
        `<p>— The Caravan Palace Team</p>`;
      break;
    case "refund_requested":
      subject = `Refund requested for Order #${orderId}`;
      text =
        `${greeting}\n\n` +
        `We received your refund request for order #${orderId}. ` +
        `Our sales team will review it shortly.\n\n` +
        `— The Caravan Palace Team`;
      html =
        `<p>${greeting}</p>` +
        `<p>We received your refund request for order <strong>#${orderId}</strong>.</p>` +
        `<p>Our sales team will review it shortly.</p>` +
        `<p>— The Caravan Palace Team</p>`;
      break;
    case "refund_approved":
      subject = `Refund approved for Order #${orderId}`;
      text =
        `${greeting}\n\n` +
        `Your refund for order #${orderId} has been approved. ` +
        `You will receive the funds based on your original payment method.\n\n` +
        `— The Caravan Palace Team`;
      html =
        `<p>${greeting}</p>` +
        `<p>Your refund for order <strong>#${orderId}</strong> has been approved.</p>` +
        `<p>You will receive the funds based on your original payment method.</p>` +
        `<p>— The Caravan Palace Team</p>`;
      break;
    case "refund_rejected":
      subject = `Refund rejected for Order #${orderId}`;
      text =
        `${greeting}\n\n` +
        `Your refund request for order #${orderId} was rejected. ` +
        `If you have questions, please contact support.\n\n` +
        `— The Caravan Palace Team`;
      html =
        `<p>${greeting}</p>` +
        `<p>Your refund request for order <strong>#${orderId}</strong> was rejected.</p>` +
        `<p>If you have questions, please contact support.</p>` +
        `<p>— The Caravan Palace Team</p>`;
      break;
    default:
      throw new ApiError(400, "Unsupported order status email type");
  }

  return exports.sendMail({
    to,
    subject,
    text,
    html,
    transporter,
  });
};
