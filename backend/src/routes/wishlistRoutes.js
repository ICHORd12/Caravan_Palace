const express = require("express");
const wishlistController = require("../controllers/wishlistController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, wishlistController.getWishlist);
router.post("/:productId", authMiddleware, wishlistController.addToWishlist);
router.delete("/:productId", authMiddleware, wishlistController.removeFromWishlist);

module.exports = router;