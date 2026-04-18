const paymentService = require("../services/paymentService");

exports.payWithCard = async (req, res, next) => {
  try {
    const result = await paymentService.processPayment({
      userId: req.user.userId,
      card: req.body.card,
      amount: req.body.amount,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};