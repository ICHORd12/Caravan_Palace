const invoiceService = require("../services/invoiceService");

/**
 * GET /api/v3/invoices/:orderId/pdf
 * Streams the invoice PDF for the authenticated user's order as a download.
 */
exports.downloadInvoice = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const { pdfBuffer, order } = await invoiceService.generateInvoice({
      userId,
      orderId,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-order-${order.orderId}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.status(200).end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v3/invoices/:orderId/email
 * Generates the invoice PDF and emails it to the authenticated user.
 */
exports.emailInvoice = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const result = await invoiceService.emailInvoice({ userId, orderId });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
