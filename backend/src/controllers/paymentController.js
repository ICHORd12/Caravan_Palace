const paymentService = require("../services/paymentService");

exports.payWithCard = async (req, res, next) => {
  try {
    const result = await paymentService.processMockPayment({
      userId: req.user.id,
      card: req.body.card,
      amount: req.body.amount,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};