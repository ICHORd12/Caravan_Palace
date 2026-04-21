const checkoutService = require("../services/checkoutService");

exports.validateCheckout = async (req, res, next) => {
  try {
    const result = await checkoutService.validateCheckout({
      userId: req.user.userId,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};