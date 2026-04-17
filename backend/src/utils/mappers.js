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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

exports.mapUser = (row) => {
  if (!row) return null;

  return {
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
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
