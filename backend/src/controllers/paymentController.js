const paymentService = require("../services/paymentService");

exports.createPayment = async (req, res, next) => {
  try {
    const result = await paymentService.processPayment({
      userId: req.user.userId,
      card: req.body.card,
      deliveryAddress: req.body.deliveryAddress,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};