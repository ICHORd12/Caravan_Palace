const orderService = require("../services/orderService");

exports.createOrder = async (req, res, next) => {
  try {
    const { items, shipping_address } = req.body;
    const userId = req.user.userId;

    const order = await orderService.createOrder(userId, items, shipping_address);

    // Start delivery simulation
    orderService.startDeliverySimulation(order.order_id);

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const orders = await orderService.getMyOrders(userId);
    res.status(200).json({
      message: "Orders fetched successfully",
      orders,
    });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const userId = req.user.userId;
    const order = await orderService.getOrderById(orderId, userId);
    res.status(200).json({
      message: "Order fetched successfully",
      order,
    });
  } catch (err) {
    next(err);
  }
};
