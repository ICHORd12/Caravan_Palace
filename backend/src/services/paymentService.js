const { validateCard } = require("../utils/cardValidator");
const ApiError = require("../utils/ApiError");

exports.processPayment = async ({ userId, card, amount }) => {
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (amount === undefined || amount === null || Number(amount) <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const validatedCard = validateCard(card);

  return {
    message: "Payment successful",
    payment: {
      userId,
      amount: Number(amount),
      cardLast4: validatedCard.cardNumber.slice(-4),
      cardHolderName: validatedCard.cardHolderName,
      status: "success",
    },
  };
};