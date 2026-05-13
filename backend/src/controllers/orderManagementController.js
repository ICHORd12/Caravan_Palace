const orderService = require("../services/orderService");
const financialReportService = require("../services/financialReportService");

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
