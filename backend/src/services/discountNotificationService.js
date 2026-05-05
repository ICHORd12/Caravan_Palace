const wishlistModel = require("../models/wishlistModel");
const emailService = require("./emailService");

const toMoney = (value) => Number(value || 0).toFixed(2);
const toRate = (value) => Number(value || 0).toFixed(2).replace(/\.00$/, "");

exports.notifyWishlistUsersForDiscountIncrease = async ({
  product,
  previousDiscountRate,
  newDiscountRate,
  transporter,
}) => {
  const watchers = await wishlistModel.getUsersWatchingProduct(product.productId);
  const summary = {
    triggered: true,
    productId: product.productId,
    attempted: watchers.length,
    sent: 0,
    failed: 0,
  };

  for (const watcher of watchers) {
    try {
      await emailService.sendWishlistDiscountEmail({
        to: watcher.email,
        customerName: watcher.name,
        productName: product.name,
        previousDiscountRate,
        newDiscountRate,
        basePrice: product.basePrice,
        currentPrice: product.currentPrice,
        transporter,
      });
      summary.sent += 1;
    } catch (_err) {
      summary.failed += 1;
    }
  }

  return summary;
};

exports.buildWishlistDiscountEmail = ({
  customerName,
  productName,
  previousDiscountRate,
  newDiscountRate,
  basePrice,
  currentPrice,
}) => {
  const greeting = customerName ? `Hi ${customerName},` : "Hello,";
  const previousRate = toRate(previousDiscountRate);
  const newRate = toRate(newDiscountRate);
  const subject = `Wishlist deal: ${productName} is now ${newRate}% off`;

  const text =
    `${greeting}\n\n` +
    `A product in your Caravan Palace wishlist has a better discount now.\n\n` +
    `Product: ${productName}\n` +
    `Discount: ${previousRate}% -> ${newRate}%\n` +
    `Base price: ${toMoney(basePrice)}\n` +
    `Current price: ${toMoney(currentPrice)}\n\n` +
    `You can visit your wishlist to review the deal.\n\n` +
    `- The Caravan Palace Team`;

  const html =
    `<p>${greeting}</p>` +
    `<p>A product in your <strong>Caravan Palace</strong> wishlist has a better discount now.</p>` +
    `<p><strong>Product:</strong> ${productName}</p>` +
    `<p><strong>Discount:</strong> ${previousRate}% &rarr; ${newRate}%</p>` +
    `<p><strong>Base price:</strong> ${toMoney(basePrice)}</p>` +
    `<p><strong>Current price:</strong> ${toMoney(currentPrice)}</p>` +
    `<p>You can visit your wishlist to review the deal.</p>` +
    `<p>- The Caravan Palace Team</p>`;

  return { subject, text, html };
};
