const wishlistService = require("../services/wishlistService");

exports.getWishlist = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await wishlistService.getWishlist(userId);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

exports.addToWishlist = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;

        const result = await wishlistService.addToWishlist(
            userId,
            productId,
        );

        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

exports.removeFromWishlist = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.params;

        const result = await wishlistService.removeFromWishlist(
            userId,
            productId,
        );

        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};