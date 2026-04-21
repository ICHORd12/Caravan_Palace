const pool = require("../config/db");
const { validateCard } = require("../utils/cardValidator");
const ApiError = require("../utils/ApiError");
const cartModel = require("../models/cartModel");
const orderModel = require("../models/orderModel");
const orderItemModel = require("../models/orderItemModel");
const productModel = require("../models/productModel");

exports.processPayment = async ({ userId, card, deliveryAddress }) => {
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }

  if (!deliveryAddress || !String(deliveryAddress).trim()) {
    throw new ApiError(400, "Delivery address is required");
  }

  const validatedCard = validateCard(card);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cartItems = await cartModel.getCartItemsByUserId(userId, client);

    if (!cartItems || cartItems.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    const stockIssues = [];
    const lockedProductsById = new Map();

    for (const item of cartItems) {
      const product = await productModel.getProductByIdForUpdate(
        item.productId,
        client
      );

      if (!product) {
        stockIssues.push({
          productId: item.productId,
          productName: item.productName || "Unknown product",
          requestedQuantity: item.quantity,
          availableQuantity: 0,
        });
        continue;
      }

      lockedProductsById.set(item.productId, product);

      if (item.quantity > product.quantityInStocks) {
        stockIssues.push({
          productId: product.productId,
          productName: product.name,
          requestedQuantity: item.quantity,
          availableQuantity: product.quantityInStocks,
        });
      }
    }

    if (stockIssues.length > 0) {
      const error = new ApiError(400, "Some items are out of stock");
      error.details = stockIssues;
      throw error;
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      const lockedProduct = lockedProductsById.get(item.productId);

      return sum + Number(lockedProduct.currentPrice) * item.quantity;
    }, 0);

    const order = await orderModel.createOrder(
      {
        customerId: userId,
        cardLast4: validatedCard.cardNumber.slice(-4),
        totalPrice: totalAmount,
        deliveryAddress: String(deliveryAddress).trim(),
      },
      client
    );

    for (const item of cartItems) {
      const lockedProduct = lockedProductsById.get(item.productId);

      await orderItemModel.createOrderItem(
        {
          orderId: order.orderId,
          productId: item.productId,
          quantity: item.quantity,
          purchasedPrice: lockedProduct.currentPrice,
        },
        client
      );

      await productModel.decreaseStock(
        {
          productId: item.productId,
          quantity: item.quantity,
        },
        client
      );
    }

    await cartModel.clearCartByUserId(userId, client);

    await client.query("COMMIT");

    return {
      message: "Payment successful",
      payment: {
        userId,
        amount: totalAmount,
        cardLast4: validatedCard.cardNumber.slice(-4),
        cardHolderName: validatedCard.cardHolderName,
        status: "success",
      },
      order,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};