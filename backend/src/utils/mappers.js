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

exports.mapCartItemWithProduct = (row) => {
  if (!row) return null;

  return {
    cartItemId: row.cart_item_id,
    userId: row.user_id,
    productId: row.product_id,
    quantity: row.quantity,
    addedAt: row.added_at,
    product: {
      name: row.product_name,
      currentPrice: row.current_price,
      quantityInStocks: row.quantity_in_stocks,
    },
  };
};

exports.mapProduct = (row) => {
  if (!row) return null;

  return {
    productId: row.product_id,
    categoryId: row.category_id,
    name: row.name,
    model: row.model,
    serialNumber: row.serial_number,
    description: row.description,
    quantityInStocks: row.quantity_in_stocks,
    basePrice: row.base_price,
    currentPrice: row.current_price,
    warrantyStatus: row.warranty_status,
    distributorInfo: row.distributor_info,
    berthCount: row.berth_count,
    fuelType: row.fuel_type,
    weightKg: row.weight_kg,
    hasKitchen: row.has_kitchen,
    discountRate: row.discount_rate,
    averageRating: Number(row.average_rating || 0),
    reviewCount: Number(row.review_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: Array.isArray(row.images) ? row.images : [],
  };
};

exports.mapCategory = (row) => {
  if (!row) return null;

  return {
    categoryId: row.category_id,
    categoryName: row.category_name,
  };
};

exports.mapUser = (row) => {
  if (!row) return null;

  return {
    userId: row.user_id,
    name: row.name,
    email: row.email,
    taxId: row.tax_id,
    role: row.role,
    createdAt: row.created_at,
    // password intentionally not included
  };
};

exports.mapAddress = (row) => {
  if (!row) return null;

  return {
    addressId: row.address_id,
    userId: row.user_id,
    label: row.label,
    fullAddress: row.full_address,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

exports.mapOrder = (row) => {
  return {
    orderId: row.order_id,
    customerId: row.customer_id,
    cardLast4: row.card_last4,
    totalPrice: Number(row.total_price),
    invoiceNumber: row.invoice_number,
    status: row.status,
    deliveryAddress: row.delivery_address,
    orderDate: row.order_date,
  };
}

exports.mapRefund = (row) => {
  if (!row) return null;

  return {
    refundId: row.refund_id,
    orderItemId: row.order_item_id,
    orderId: row.order_id,
    customerId: row.customer_id,
    status: row.status,
    refundAmount: Number(row.refund_amount),
    requestDate: row.request_date,
    processedAt: row.processed_at,
  };
}

exports.mapOrderItem = (row) => {
  return {
    orderItemId: row.order_item_id,
    orderId: row.order_id,
    productId: row.product_id,
    quantity: row.quantity,
    purchasedPrice: Number(row.purchased_price),
    isDelivered: row.is_delivered,
  };
}

exports.mapReview = (row) => {
  if (!row) return null;

  const status = row.status ?? (row.is_approved ? "approved" : "pending");

  return {
    reviewId: row.review_id,
    productId: row.product_id,
    userId: row.user_id,
    rating: row.rating,
    commentText: row.comment_text,
    status,
    moderationComment: row.moderation_comment ?? null,
    isApproved: status === "approved",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

exports.mapReviewWithUser = (row) => {
  if (!row) return null;

  const status = row.status ?? (row.is_approved ? "approved" : "pending");

  return {
    reviewId: row.review_id,
    productId: row.product_id,
    userId: row.user_id,
    userName: row.user_name,
    rating: row.rating,
    commentText: row.comment_text,
    status,
    moderationComment: row.moderation_comment ?? null,
    isApproved: status === "approved",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

exports.mapWishlistItem = (row) => {
  if (!row) return null;

  return {
    wishlistId: row.wishlist_id,
    productId: row.product_id,
    addedAt: row.added_at,

    product: {
      name: row.name,
      model: row.model,
      currentPrice: row.current_price,
      basePrice: row.base_price,
      discountRate: row.discount_rate,
      quantityInStocks: row.quantity_in_stocks,
      imageUrl: row.image_url
    }
  };
};