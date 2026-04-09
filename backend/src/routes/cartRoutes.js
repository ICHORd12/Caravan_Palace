const express = require("express");
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, cartController.getCart);
router.post("/items", authMiddleware, cartController.addItemToCart);
router.patch("/items/:productId", authMiddleware, cartController.updateCartItemQuantity);
router.delete("/items/:productId", authMiddleware, cartController.deleteCartItem);
router.delete("/", authMiddleware, cartController.clearCart);
router.post("/merge", authMiddleware, cartController.mergeCart);

module.exports = router;