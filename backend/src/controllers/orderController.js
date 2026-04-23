const orderService = require("../services/orderService");

exports.getOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await orderService.getOrders(userId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getOrderDetails = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.params;

    const result = await orderService.getOrderDetails({ userId, orderId });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};