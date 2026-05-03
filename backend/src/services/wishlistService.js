const wishlistModel = require("../models/wishlistModel");
const productModel = require("../models/productModel");
const ApiError = require("../utils/ApiError");

exports.getWishlist = async (userId) => {
    const wishlist = await wishlistModel.getWishlistByUserId(userId);

    return {
        message: "Wishlist fetched successfully",
        wishlist
    };
};

exports.addToWishlist = async (userId, productId) => {
    const product = await productModel.getProductById(productId);

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    const existingItem = await wishlistModel.findWishlistItem(userId, productId);

    if (existingItem) {
        throw new ApiError(409, "Product is already in wishlist");
    }

    const wishlistItem = await wishlistModel.addToWishlist(userId, productId);

    return {
        message: "Product added to wishlist successfully",
        wishlistItem
    };
};

exports.removeFromWishlist = async (userId, productId) => {
    const deletedItem = await wishlistModel.removeFromWishlist(userId, productId);

    if (!deletedItem) {
        throw new ApiError(404, "Product is not in wishlist");
    }

    return {
        message: "Product removed from wishlist successfully"
    };
};