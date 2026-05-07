const { describe, test, expect, beforeEach, afterEach } = require("@jest/globals");
const pool = require("../config/db");
const addressService = require("../services/addressService");
const addressModel = require("../models/addressModel");

const buildClient = () => ({
  query: jest.fn().mockResolvedValue({}),
  release: jest.fn(),
});

describe("addressService", () => {
  let client;

  beforeEach(() => {
    client = buildClient();
    jest.spyOn(pool, "connect").mockResolvedValue(client);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("getAddresses returns message and address list", async () => {
    const addresses = [{ addressId: "addr-1" }];
    jest.spyOn(addressModel, "getAddressesByUserId").mockResolvedValue(addresses);

    const result = await addressService.getAddresses("user-1");

    expect(result).toEqual({
      message: "Addresses fetched successfully",
      addresses,
    });
  });

  test("createAddress creates a default address when it is the first", async () => {
    jest.spyOn(addressModel, "getAddressCountByUserId").mockResolvedValue(0);
    const clearSpy = jest
      .spyOn(addressModel, "clearDefaultAddressByUserId")
      .mockResolvedValue();
    const createSpy = jest
      .spyOn(addressModel, "createAddress")
      .mockResolvedValue({ addressId: "addr-1", isDefault: true });

    const result = await addressService.createAddress({
      userId: "user-1",
      payload: { label: "Home", fullAddress: "123 Main St" },
    });

    expect(clearSpy).not.toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith(
      {
        userId: "user-1",
        label: "Home",
        fullAddress: "123 Main St",
        isDefault: true,
      },
      client
    );
    expect(client.query).toHaveBeenCalledWith("BEGIN");
    expect(client.query).toHaveBeenCalledWith("COMMIT");
    expect(result.message).toBe("Address created successfully");
  });

  test("createAddress clears the existing default when requested", async () => {
    jest.spyOn(addressModel, "getAddressCountByUserId").mockResolvedValue(2);
    const clearSpy = jest
      .spyOn(addressModel, "clearDefaultAddressByUserId")
      .mockResolvedValue();
    const createSpy = jest
      .spyOn(addressModel, "createAddress")
      .mockResolvedValue({ addressId: "addr-2", isDefault: true });

    const result = await addressService.createAddress({
      userId: "user-2",
      payload: { label: "Office", fullAddress: "456 Center Rd", isDefault: true },
    });

    expect(clearSpy).toHaveBeenCalledWith("user-2", client);
    expect(createSpy).toHaveBeenCalledWith(
      {
        userId: "user-2",
        label: "Office",
        fullAddress: "456 Center Rd",
        isDefault: true,
      },
      client
    );
    expect(result.address.addressId).toBe("addr-2");
  });

  test("updateAddress rejects when addressId is missing", async () => {
    await expect(
      addressService.updateAddress({
        userId: "user-1",
        addressId: "",
        updates: { label: "New" },
      })
    ).rejects.toThrow(/Address ID is required/);
  });

  test("updateAddress rejects when no fields are provided", async () => {
    await expect(
      addressService.updateAddress({
        userId: "user-1",
        addressId: "addr-1",
        updates: {},
      })
    ).rejects.toThrow(/At least one field is required/);
  });

  test("updateAddress rejects when unsetting the only default address", async () => {
    jest
      .spyOn(addressModel, "getAddressByUserIdAndAddressId")
      .mockResolvedValue({ addressId: "addr-1", isDefault: true });

    await expect(
      addressService.updateAddress({
        userId: "user-1",
        addressId: "addr-1",
        updates: { isDefault: false },
      })
    ).rejects.toThrow(/default address is required/i);
  });

  test("updateAddress switches default address in a transaction", async () => {
    jest
      .spyOn(addressModel, "getAddressByUserIdAndAddressId")
      .mockResolvedValue({ addressId: "addr-2", isDefault: false });

    const clearSpy = jest
      .spyOn(addressModel, "clearDefaultAddressByUserId")
      .mockResolvedValue();

    const updateSpy = jest
      .spyOn(addressModel, "updateAddressByUserIdAndAddressId")
      .mockResolvedValue({ addressId: "addr-2", isDefault: true });

    const result = await addressService.updateAddress({
      userId: "user-1",
      addressId: "addr-2",
      updates: { isDefault: true },
    });

    expect(clearSpy).toHaveBeenCalledWith("user-1", client);
    expect(updateSpy).toHaveBeenCalledWith(
      "user-1",
      "addr-2",
      { label: undefined, fullAddress: undefined, isDefault: true },
      client
    );
    expect(client.query).toHaveBeenCalledWith("BEGIN");
    expect(client.query).toHaveBeenCalledWith("COMMIT");
    expect(result.message).toBe("Address updated successfully");
  });

  test("deleteAddress rejects when trying to delete the last address", async () => {
    jest
      .spyOn(addressModel, "getAddressByUserIdAndAddressId")
      .mockResolvedValue({ addressId: "addr-1", isDefault: false });
    jest.spyOn(addressModel, "getAddressCountByUserId").mockResolvedValue(1);
    const deleteSpy = jest
      .spyOn(addressModel, "deleteAddressByUserIdAndAddressId")
      .mockResolvedValue({ addressId: "addr-1" });

    await expect(
      addressService.deleteAddress({ userId: "user-1", addressId: "addr-1" })
    ).rejects.toThrow(/Cannot delete the last address/);

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  test("deleteAddress reassigns default when deleting the current default", async () => {
    jest
      .spyOn(addressModel, "getAddressByUserIdAndAddressId")
      .mockResolvedValue({ addressId: "addr-1", isDefault: true });
    jest.spyOn(addressModel, "getAddressCountByUserId").mockResolvedValue(2);

    const deleteSpy = jest
      .spyOn(addressModel, "deleteAddressByUserIdAndAddressId")
      .mockResolvedValue({ addressId: "addr-1" });

    const replacement = { addressId: "addr-2", isDefault: false };
    jest
      .spyOn(addressModel, "getMostRecentAddressByUserId")
      .mockResolvedValue(replacement);

    const clearSpy = jest
      .spyOn(addressModel, "clearDefaultAddressByUserId")
      .mockResolvedValue();

    const setSpy = jest
      .spyOn(addressModel, "setDefaultAddressById")
      .mockResolvedValue({ addressId: "addr-2", isDefault: true });

    const result = await addressService.deleteAddress({
      userId: "user-1",
      addressId: "addr-1",
    });

    expect(deleteSpy).toHaveBeenCalledWith("user-1", "addr-1", client);
    expect(clearSpy).toHaveBeenCalledWith("user-1", client);
    expect(setSpy).toHaveBeenCalledWith("user-1", "addr-2", client);
    expect(result.message).toBe("Address deleted successfully");
  });
});
