const orderService = require("../services/orderService");

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
