const ApiError = require("../utils/ApiError");

exports.processPayment = async (req, res, next) => {
  try {
    const { card_number, expiry, cvv, amount } = req.body;

    // Basic validation
    if (!card_number || !expiry || !cvv || !amount) {
      throw new ApiError(400, "All payment fields are required");
    }

    const cleanCard = card_number.replace(/\s/g, "");
    if (cleanCard.length < 13 || cleanCard.length > 19) {
      throw new ApiError(400, "Invalid card number");
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      throw new ApiError(400, "Invalid expiry format. Use MM/YY");
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      throw new ApiError(400, "Invalid CVV");
    }

    // Simulate processing delay (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate transaction ID
    const transactionId = "TXN-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    res.status(200).json({
      message: "Payment processed successfully",
      transaction_id: transactionId,
      amount,
      status: "approved",
    });
  } catch (err) {
    next(err);
  }
};
