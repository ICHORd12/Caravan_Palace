const userModel = require("../models/userModel");
const addressModel = require("../models/addressModel");
const ApiError = require("../utils/ApiError");

exports.getMe = async (userId) => {
  const user = await userModel.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const addresses = await addressModel.getAddressesByUserId(userId);
  const profileAddresses = addresses.map((address) => ({
    addressId: address.addressId,
    label: address.label,
    fullAddress: address.fullAddress,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  }));

  return {
    message: "User fetched successfully",
    user: {
      id: user.userId,
      name: user.name,
      email: user.email,
      taxId: user.taxId,
      role: user.role,
      createdAt: user.createdAt,
      addresses: profileAddresses,
    },
  };
};