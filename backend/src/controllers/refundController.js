const refundService = require("../services/refundService");

exports.requestRefundForOrder = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const result = await refundService.requestRefundForOrder({
      userId,
      orderId,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.requestRefundForOrderItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId, orderItemId } = req.params;

    const result = await refundService.requestRefundForOrderItem({
      userId,
      orderId,
      orderItemId,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.listRefunds = async (req, res, next) => {
  try {
    const { status } = req.query;
    const userRole = req.user.role;

    const result = await refundService.listRefunds({ status, userRole });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateRefundStatus = async (req, res, next) => {
  try {
    const { refundId } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    const result = await refundService.updateRefundStatus({
      refundId,
      status,
      userRole,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
