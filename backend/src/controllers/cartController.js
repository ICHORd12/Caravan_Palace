const cartService = require("../services/cartService");

exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await cartService.getCart(userId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.addItemToCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId, quantity } = req.body;

    const result = await cartService.addItemToCart({
      userId,
      productId,
      quantity,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

exports.updateCartItemQuantity = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const { quantity } = req.body;

    const result = await cartService.updateCartItemQuantity({
      userId,
      productId,
      quantity,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.deleteCartItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;

    const result = await cartService.deleteCartItem({
      userId,
      productId,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await cartService.clearCart(userId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};