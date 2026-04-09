exports.mapCartItem = (row) => {
  if (!row) return null;

  return {
    cartItemId: row.cart_item_id,
    userId: row.user_id,
    productId: row.product_id,
    quantity: row.quantity,
    addedAt: row.added_at,
  };
};
