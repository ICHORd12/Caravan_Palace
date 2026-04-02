const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

router.get("/all", productController.getAllProducts);
router.get("/category/:id", productController.getProductsByCategoryId);

module.exports = router;

