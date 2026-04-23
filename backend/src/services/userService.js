const userModel = require("../models/userModel");
const addressModel = require("../models/addressModel");
const ApiError = require("../utils/ApiError");
const { hashPassword } = require("../utils/hash");

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

exports.updateMe = async (userId, updateData) => {
  const { name, taxId, password } = updateData;
  
  const updatePayload = {};
  if (name !== undefined) updatePayload.name = name;
  if (taxId !== undefined) updatePayload.tax_id = taxId;
  
  if (password) {
    updatePayload.passwordHash = await hashPassword(password);
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new ApiError(400, "No fields to update");
  }

  const updatedUser = await userModel.updateUser(userId, updatePayload);
  
  if (!updatedUser) {
    throw new ApiError(404, "User not found or update failed");
  }

  return {
    message: "Profile updated successfully",
    user: updatedUser,
  };
};