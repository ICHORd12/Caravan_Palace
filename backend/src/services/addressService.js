const pool = require("../config/db");
const addressModel = require("../models/addressModel");
const ApiError = require("../utils/ApiError");
const {hasOwn, validateRequiredString, validateOptionalString, validateOptionalBoolean, validateObjectPayload} = require("../utils/addressValidators");

exports.getAddresses = async (userId) => {
  const addresses = await addressModel.getAddressesByUserId(userId);

  return {
    message: "Addresses fetched successfully",
    addresses,
  };
};

exports.createAddress = async ({ userId, payload }) => {
  const validatedPayload = validateObjectPayload(payload);
  const label = validateRequiredString(validatedPayload.label, "Label");
  const fullAddress = validateRequiredString(
    validatedPayload.fullAddress,
    "Full address"
  );
  const requestedDefault =
    validatedPayload.isDefault === undefined
      ? false
      : validateOptionalBoolean(validatedPayload.isDefault, "isDefault");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingAddressCount = await addressModel.getAddressCountByUserId(
      userId,
      client
    );

    const shouldBeDefault = existingAddressCount === 0 || requestedDefault;

    if (shouldBeDefault && existingAddressCount > 0) {
      await addressModel.clearDefaultAddressByUserId(userId, client);
    }

    const address = await addressModel.createAddress(
      {
        userId,
        label,
        fullAddress,
        isDefault: shouldBeDefault,
      },
      client
    );

    await client.query("COMMIT");

    return {
      message: "Address created successfully",
      address,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.updateAddress = async ({ userId, addressId, updates }) => {
  if (!addressId) {
    throw new ApiError(400, "Address ID is required");
  }

  const validatedUpdates = validateObjectPayload(updates);

  const hasLabel = hasOwn(validatedUpdates, "label");
  const hasFullAddress = hasOwn(validatedUpdates, "fullAddress");
  const hasIsDefault = hasOwn(validatedUpdates, "isDefault");

  if (!hasLabel && !hasFullAddress && !hasIsDefault) {
    throw new ApiError(400, "At least one field is required");
  }

  const existingAddress = await addressModel.getAddressByUserIdAndAddressId(
    userId,
    addressId
  );

  if (!existingAddress) {
    throw new ApiError(404, "Address not found");
  }

  const nextLabel = hasLabel
    ? validateOptionalString(validatedUpdates.label, "Label")
    : undefined;
  const nextFullAddress = hasFullAddress
    ? validateOptionalString(validatedUpdates.fullAddress, "Full address")
    : undefined;
  const nextIsDefault = hasIsDefault
    ? validateOptionalBoolean(validatedUpdates.isDefault, "isDefault")
    : undefined;

  if (hasIsDefault && nextIsDefault === false && existingAddress.isDefault) {
    throw new ApiError(400, "At least one default address is required");
  }

  if (hasIsDefault && nextIsDefault === true && !existingAddress.isDefault) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await addressModel.clearDefaultAddressByUserId(userId, client);

      const updatedAddress = await addressModel.updateAddressByUserIdAndAddressId(
        userId,
        addressId,
        {
          label: nextLabel,
          fullAddress: nextFullAddress,
          isDefault: true,
        },
        client
      );

      await client.query("COMMIT");

      return {
        message: "Address updated successfully",
        address: updatedAddress,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  const updatedAddress = await addressModel.updateAddressByUserIdAndAddressId(
    userId,
    addressId,
    {
      label: nextLabel,
      fullAddress: nextFullAddress,
      isDefault: nextIsDefault,
    }
  );

  return {
    message: "Address updated successfully",
    address: updatedAddress,
  };
};

exports.deleteAddress = async ({ userId, addressId }) => {
  if (!addressId) {
    throw new ApiError(400, "Address ID is required");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingAddress = await addressModel.getAddressByUserIdAndAddressId(
      userId,
      addressId,
      client
    );

    if (!existingAddress) {
      throw new ApiError(404, "Address not found");
    }

    const userAddressCount = await addressModel.getAddressCountByUserId(
      userId,
      client
    );

    if (userAddressCount <= 1) {
      throw new ApiError(400, "Cannot delete the last address");
    }

    const deletedAddress = await addressModel.deleteAddressByUserIdAndAddressId(
      userId,
      addressId,
      client
    );

    if (existingAddress.isDefault) {
      const replacementAddress = await addressModel.getMostRecentAddressByUserId(
        userId,
        client
      );

      if (!replacementAddress) {
        throw new ApiError(500, "Failed to assign a new default address");
      }

      await addressModel.clearDefaultAddressByUserId(userId, client);
      await addressModel.setDefaultAddressById(
        userId,
        replacementAddress.addressId,
        client
      );
    }

    await client.query("COMMIT");

    return {
      message: "Address deleted successfully",
      deletedAddress,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
