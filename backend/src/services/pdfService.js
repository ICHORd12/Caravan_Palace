const PDFDocument = require("pdfkit");
const ApiError = require("../utils/ApiError");

/**
 * Generates a PDF invoice for a given order and returns it as a Buffer.
 *
 * @param {Object} params
 * @param {Object} params.order - Order object with orderId, totalPrice, orderDate, etc.
 * @param {Array}  params.items - Line items (orderItems) with optional productName field.
 * @param {Object} [params.user] - Optional user info { name, email }.
 * @returns {Promise<Buffer>} Resolves with a Buffer containing the PDF bytes.
 */
exports.generateInvoicePdf = ({ order, items, user }) => {
  return new Promise((resolve, reject) => {
    try {
      if (!order || typeof order !== "object") {
        throw new ApiError(400, "Order is required to generate invoice PDF");
      }

      if (!Array.isArray(items)) {
        throw new ApiError(400, "Order items must be an array");
      }

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // -------- Header --------
      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("Caravan Palace", { align: "left" })
        .fontSize(10)
        .font("Helvetica")
        .text("Official Invoice / Receipt", { align: "left" })
        .moveDown(1);

      // -------- Invoice Meta --------
      const invoiceNumber = order.invoiceNumber || `INV-${order.orderId}`;
      const orderDate = order.orderDate
        ? new Date(order.orderDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(`Invoice Number: `, { continued: true })
        .font("Helvetica")
        .text(`${invoiceNumber}`)
        .font("Helvetica-Bold")
        .text(`Order ID: `, { continued: true })
        .font("Helvetica")
        .text(`${order.orderId}`)
        .font("Helvetica-Bold")
        .text(`Order Date: `, { continued: true })
        .font("Helvetica")
        .text(`${orderDate}`)
        .moveDown(0.5);

      // -------- Customer Info --------
      if (user) {
        doc
          .font("Helvetica-Bold")
          .text("Billed To:")
          .font("Helvetica")
          .text(user.name || "N/A")
          .text(user.email || "N/A")
          .moveDown(0.5);
      }

      if (order.deliveryAddress) {
        doc
          .font("Helvetica-Bold")
          .text("Delivery Address:")
          .font("Helvetica")
          .text(String(order.deliveryAddress))
          .moveDown(0.5);
      }

      if (order.cardLast4) {
        doc
          .font("Helvetica-Bold")
          .text(`Payment Method: `, { continued: true })
          .font("Helvetica")
          .text(`Card ending in ${order.cardLast4}`)
          .moveDown(1);
      }

      // -------- Items Table Header --------
      const tableTop = doc.y;
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Product", 50, tableTop)
        .text("Qty", 300, tableTop, { width: 60, align: "right" })
        .text("Unit Price", 370, tableTop, { width: 90, align: "right" })
        .text("Subtotal", 470, tableTop, { width: 90, align: "right" });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(560, tableTop + 15)
        .stroke();

      // -------- Items Rows --------
      let y = tableTop + 25;
      doc.font("Helvetica").fontSize(10);

      let computedTotal = 0;
      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const unitPrice = Number(item.purchasedPrice) || 0;
        const subtotal = qty * unitPrice;
        computedTotal += subtotal;

        const name =
          item.productName || item.name || `Product #${item.productId}`;

        doc
          .text(String(name), 50, y, { width: 240 })
          .text(String(qty), 300, y, { width: 60, align: "right" })
          .text(unitPrice.toFixed(2), 370, y, { width: 90, align: "right" })
          .text(subtotal.toFixed(2), 470, y, { width: 90, align: "right" });

        y += 20;

        if (y > 720) {
          doc.addPage();
          y = 50;
        }
      }

      // -------- Total --------
      const finalTotal =
        order.totalPrice !== undefined && order.totalPrice !== null
          ? Number(order.totalPrice)
          : computedTotal;

      doc
        .moveTo(50, y + 5)
        .lineTo(560, y + 5)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("Total:", 370, y + 15, { width: 90, align: "right" })
        .text(`${finalTotal.toFixed(2)}`, 470, y + 15, {
          width: 90,
          align: "right",
        });

      // -------- Footer --------
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(
          "Thank you for shopping at Caravan Palace!",
          50,
          780,
          { align: "center", width: 510 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
