const express = require("express");
const paymentController = require("../controllers/cartController");

const router = express.Router();

router.post("/", authMiddleware, paymentController.payWithCard);