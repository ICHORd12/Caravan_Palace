const addressService = require("../services/addressService");

exports.getAddresses = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await addressService.getAddresses(userId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.createAddress = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await addressService.createAddress({
      userId,
      payload: req.body,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { addressId } = req.params;

    const result = await addressService.updateAddress({
      userId,
      addressId,
      updates: req.body,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { addressId } = req.params;

    const result = await addressService.deleteAddress({
      userId,
      addressId,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
