const ApiError = require("../utils/ApiError");
const orderService = require("../services/orderService");
const deliveryService = require("../services/deliveryService");
const financialReportService = require("../services/financialReportService");
const invoiceService = require("../services/invoiceService");

const assertManagerRole = (userRole) => {
  if (userRole !== "sales_manager" && userRole !== "product_manager") {
    throw new ApiError(
      403,
      "Only sales managers or product managers can download invoices"
    );
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    const userRole = req.user.role;

    const result = await orderService.getAllOrdersForManager({
      status,
      startDate,
      endDate,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getFinancialSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userRole = req.user.role;

    const result = await financialReportService.getFinancialSummary({
      startDate,
      endDate,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getAllDeliveries = async (req, res, next) => {
  try {
    const userRole = req.user.role;

    const result = await deliveryService.getAllDeliveriesForManager({
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    const result = await orderService.updateOrderStatusForManager({
      orderId,
      status,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.downloadOrderInvoice = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userRole = req.user.role;

    assertManagerRole(userRole);

    const { pdfBuffer, order } = await invoiceService.generateInvoiceForManager({
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
