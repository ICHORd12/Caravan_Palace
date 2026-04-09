const userModel = require("../models/userModel");
const ApiError = require("../utils/ApiError");

exports.getMe = async (userId) => {
  const user = await userModel.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return {
    id: user.userId,
    email: user.email,
  };
};