const express = require("express");
const cartController = require("../controllers/cartController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, cartController.getCart);
router.post("/items", authMiddleware, cartController.addItemToCart);

module.exports = router;