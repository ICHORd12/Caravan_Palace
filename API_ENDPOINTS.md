# API Endpoints Documentation

This document summarizes the backend API endpoints currently implemented in the project for frontend integration.

## Base URL

- Base path: `/api/v3`
- Example local URL: `http://localhost:<PORT>/api/v3`

## General Notes

- The backend uses JSON request/response bodies.
- Protected endpoints require this header:

```http
Authorization: Bearer <token>
```

- Error responses generally look like this:

```json
{
  "message": "Error message here"
}
```

---

## Auth Endpoints

### `POST /api/v3/auth/register`

Creates a new user account.

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456",
  "tax_id": "1234567890",
  "home_address": "Istanbul",
  "role": "customer"
}
```

#### Notes

- `role` is optional. If not sent, backend defaults it to `"customer"`.
- `home_address` is used to create the user's first row in the `addresses` table as a default address (`label = "Home"`, `is_default = true`).
- Backend currently keeps compatibility by still writing `home_address` to the `users` table as well.

#### Success Response

Status: `201 Created`

```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

#### Common Errors

- `400` if email already exists

---

### `POST /api/v3/auth/login`

Logs a user in and returns a JWT token.

#### Request Body

```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

#### Success Response

Status: `200 OK`

```json
{
  "message": "Login successful",
  "token": "<jwt-token>",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

#### Common Errors

- `404` if user is not found
- `401` if password is wrong

---

### `GET /api/v3/auth/test`

Simple test endpoint.

#### Success Response

Status: `200 OK`

Plain text response:

```text
Test route works
```

---

## User Endpoints

### `GET /api/v3/users/me`

Returns the currently authenticated user.

#### Auth

- Required

#### Success Response

Status: `200 OK`

```json
{
  "message": "User fetched successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "taxId": "1234567890",
    "role": "customer",
    "createdAt": "2026-04-09T00:00:00.000Z",
    "addresses": [
      {
        "addressId": 10,
        "label": "Home",
        "fullAddress": "Istanbul, ...",
        "isDefault": true,
        "createdAt": "2026-04-17T10:00:00.000Z",
        "updatedAt": "2026-04-17T10:00:00.000Z"
      },
      {
        "addressId": 11,
        "label": "Office",
        "fullAddress": "Ankara, ...",
        "isDefault": false,
        "createdAt": "2026-04-16T10:00:00.000Z",
        "updatedAt": "2026-04-16T10:00:00.000Z"
      }
    ]
  }
}
```

#### Common Errors

- `401` if token is missing
- `401` if token is invalid
- `404` if user is not found

---

### `GET /api/v3/users/me/orders`

Returns all orders of the authenticated user.

#### Auth

- Required

#### Success Response

Status: `200 OK`

```json
{
  "message": "Orders fetched successfully",
  "orders": [
    {
      "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
      "customerId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
      "cardLast4": "1111",
      "totalPrice": 479999.99,
      "invoiceNumber": "INV-2026-0001",
      "status": "pending",
      "deliveryAddress": "Levent, Istanbul",
      "orderDate": "2026-04-20T14:30:00.000Z",
      "items": [
        {
          "orderItemId": "abc12345-def6-4789-ghij-klmn0pqr1234",
          "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
          "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
          "quantity": 1,
          "purchasedPrice": 479999.99,
          "isDelivered": false
        }
      ]
    }
  ]
}
```

#### Common Errors

- `400` if authenticated user id is missing in request context
- `401` if token is missing
- `401` if token is invalid

---

### `GET /api/v3/users/me/orders/:orderId`

Returns detailed information for one order of the authenticated user.

#### Auth

- Required

#### Path Params

- `orderId`: target order id

#### Success Response

Status: `200 OK`

```json
{
  "message": "Order fetched successfully",
  "order": {
    "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
    "customerId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
    "cardLast4": "1111",
    "totalPrice": 479999.99,
    "invoiceNumber": "INV-2026-0001",
    "status": "pending",
    "deliveryAddress": "Levent, Istanbul",
    "orderDate": "2026-04-20T14:30:00.000Z",
    "items": [
      {
        "orderItemId": "abc12345-def6-4789-ghij-klmn0pqr1234",
        "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
        "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
        "quantity": 1,
        "purchasedPrice": 479999.99,
        "isDelivered": false
      }
    ]
  }
}
```

#### Common Errors

- `400` if authenticated user id is missing in request context
- `400` if `orderId` is missing
- `401` if token is missing
- `401` if token is invalid
- `404` if order is not found for the authenticated user

---

### `GET /api/v3/users/me/addresses`

Returns all addresses of the authenticated user.

#### Auth

- Required

#### Success Response

Status: `200 OK`

```json
{
  "message": "Addresses fetched successfully",
  "addresses": [
    {
      "addressId": 10,
      "userId": 1,
      "label": "Home",
      "fullAddress": "Istanbul",
      "isDefault": true,
      "createdAt": "2026-04-17T10:00:00.000Z",
      "updatedAt": "2026-04-17T10:00:00.000Z"
    }
  ]
}
```

#### Common Errors

- `401` if token is missing
- `401` if token is invalid

---

### `POST /api/v3/users/me/addresses`

Creates a new address for the authenticated user.

#### Auth

- Required

#### Request Body

```json
{
  "label": "Work",
  "fullAddress": "Levent, Istanbul",
  "isDefault": false
}
```

#### Notes

- `label` and `fullAddress` are required and cannot be empty.
- `isDefault` is optional. If omitted, it defaults to `false`.
- If this is the first address for the user, backend automatically sets it as default.
- If `isDefault` is `true`, backend clears previous default and makes this one default.

#### Success Response

Status: `201 Created`

```json
{
  "message": "Address created successfully",
  "address": {
    "addressId": 11,
    "userId": 1,
    "label": "Work",
    "fullAddress": "Levent, Istanbul",
    "isDefault": false,
    "createdAt": "2026-04-17T11:30:00.000Z",
    "updatedAt": "2026-04-17T11:30:00.000Z"
  }
}
```

#### Common Errors

- `400` if `label` is missing/invalid/empty
- `400` if `fullAddress` is missing/invalid/empty
- `400` if `isDefault` is present but not boolean
- `401` if token is missing
- `401` if token is invalid

---

### `PATCH /api/v3/users/me/addresses/:addressId`

Updates an address of the authenticated user.

#### Auth

- Required

#### Path Params

- `addressId`: target address id

#### Request Body

All fields are optional, but at least one must be provided.

```json
{
  "label": "Home 2",
  "fullAddress": "Kadikoy, Istanbul",
  "isDefault": true
}
```

#### Notes

- If `isDefault` is set to `true`, backend clears previous default and makes this address default.
- If the address is currently default, setting `isDefault` to `false` is rejected to prevent having no default address.

#### Success Response

Status: `200 OK`

```json
{
  "message": "Address updated successfully",
  "address": {
    "addressId": 11,
    "userId": 1,
    "label": "Home 2",
    "fullAddress": "Kadikoy, Istanbul",
    "isDefault": true,
    "createdAt": "2026-04-17T11:30:00.000Z",
    "updatedAt": "2026-04-17T12:00:00.000Z"
  }
}
```

#### Common Errors

- `400` if no updatable fields are sent
- `400` if any provided field is invalid
- `400` if trying to unset the current default address (`isDefault: false`)
- `401` if token is missing
- `401` if token is invalid
- `404` if address is not found for the authenticated user

---

### `DELETE /api/v3/users/me/addresses/:addressId`

Deletes an address of the authenticated user.

#### Auth

- Required

#### Path Params

- `addressId`: target address id

#### Notes

- Deleting the last remaining address is rejected.
- If the deleted address is default and other addresses remain, backend automatically promotes the most recently created remaining address as the new default.

#### Success Response

Status: `200 OK`

```json
{
  "message": "Address deleted successfully",
  "deletedAddress": {
    "addressId": 11,
    "userId": 1,
    "label": "Work",
    "fullAddress": "Levent, Istanbul",
    "isDefault": false,
    "createdAt": "2026-04-17T11:30:00.000Z",
    "updatedAt": "2026-04-17T11:30:00.000Z"
  }
}
```

#### Common Errors

- `400` if trying to delete the last address
- `401` if token is missing
- `401` if token is invalid
- `404` if address is not found for the authenticated user

---

## Product Endpoints

### `GET /api/v3/products/all`

Fetches all products.

#### Optional Sort Parameter

- `sort`: optional
- Allowed values:
  - `price_asc`
  - `price_desc`

#### Request Example

Current backend reads `sort` from query params for this endpoint:

```http
GET /api/v3/products/all?sort=price_asc
```

#### Success Response

Status: `201 Created`

Note: the current backend returns `201`, even though this is a read endpoint.

```json
{
  "message": "Products fetched successfully",
  "products": [
    {
      "productId": "8c322b6b-db04-44cb-83f1-c84324e1b857",
      "categoryId": "ff28bce6-284e-4c65-8557-0416f4274679",
      "name": "Caravan X",
      "model": "2025",
      "serialNumber": "SN-123",
      "description": "Product description",
      "quantityInStocks": 10,
      "basePrice": 100000,
      "currentPrice": 95000,
      "warrantyStatus": "3 Years,
      "distributorInfo": "Distributor name",
      "berthCount": 4,
      "fuelType": "Diesel",
      "weightKg": 2500,
      "hasKitchen": true,
      "discountRate": 5,
      "createdAt": "2026-04-09T00:00:00.000Z",
      "updatedAt": "2026-04-09T00:00:00.000Z"
    }
  ]
}
```

#### Common Errors

- `404` if there are no products in database

---

### `GET /api/v3/products/category_name`

Fetches products by category name.

#### Important Backend Behavior

- This route is defined as `GET`.
- But the current backend reads `category_name` from `req.body`, not from query params.
- The backend also accepts optional `sort` in the same request body.
- In standard HTTP usage, `GET` requests usually do not send a body.
- For frontend usage, it would be safer if backend later changes this to query-based usage like `?category_name=...`.

#### Request Body

```json
{
  "category_name": "Camper Vans",
  "sort": "price_desc"
}
```

#### Optional Sort Parameter

- `sort`: optional
- Allowed values:
  - `price_asc`
  - `price_desc`

#### Success Response

Status: `201 Created`

```json
{
  "message": "Products fetched successfully",
  "products": [
    {
      "productId": "8c322b6b-db04-44cb-83f1-c84324e1b857",
      "categoryId": "ff28bce6-284e-4c65-8557-0416f4274679",
      "name": "Caravan X",
      "model": "2025",
      "serialNumber": "SN-123",
      "description": "Product description",
      "quantityInStocks": 10,
      "basePrice": 100000,
      "currentPrice": 95000,
      "warrantyStatus": "3 Years,
      "distributorInfo": "Distributor name",
      "berthCount": 4,
      "fuelType": "Diesel",
      "weightKg": 2500,
      "hasKitchen": true,
      "discountRate": 5,
      "createdAt": "2026-04-09T00:00:00.000Z",
      "updatedAt": "2026-04-09T00:00:00.000Z"
    }
  ]
}
```

#### Common Errors

- `404` if no products match the given category

---

### `GET /api/v3/products/search`

Searches products by name or description.

#### Required Query Parameter

- `q`: search text (required)

#### Optional Sort Parameter

- `sort`: optional
- Allowed values:
  - `price_asc`
  - `price_desc`

#### Request Example

Current backend reads both `q` and `sort` from query params for this endpoint:

```http
GET /api/v3/products/search?q=camper&sort=price_desc
```

#### Success Response

Status: `200 OK`

```json
{
  "message": "Products fetched successfully",
  "products": [
    {
      "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
      "categoryId": "ff28bce6-284e-4c65-8557-0416f4274679",
      "name": "Eco Camper Van",
      "model": "2025",
      "serialNumber": "SN-123",
      "description": "Product description",
      "quantityInStocks": 8,
      "basePrice": 500000,
      "currentPrice": 479999.99,
      "warrantyStatus": "3 Years",
      "distributorInfo": "Distributor name",
      "berthCount": 4,
      "fuelType": "Diesel",
      "weightKg": 2500,
      "hasKitchen": true,
      "discountRate": 5,
      "createdAt": "2026-04-09T00:00:00.000Z",
      "updatedAt": "2026-04-09T00:00:00.000Z"
    }
  ]
}
```

#### Common Errors

- `400` if query parameter `q` is missing or empty
- `400` if `sort` is invalid

---

### `POST /api/v3/products/by-ids`

Fetches products by a list of product ids.

#### Request Body

```json
{
  "productIds": [
    "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
    "8c322b6b-db04-44cb-83f1-c84324e1b857"
  ],
  "sort": "price_asc"
}
```

#### Request Fields

- `productIds`: required array of product UUIDs
- `sort`: optional

#### Allowed Sort Values

- `price_asc`
- `price_desc`

#### Success Response

Status: `200 OK`

```json
{
  "message": "Products fetched successfully",
  "products": [
    {
      "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
      "categoryId": "ff28bce6-284e-4c65-8557-0416f4274679",
      "name": "Eco Camper Van",
      "model": "2025",
      "serialNumber": "SN-123",
      "description": "Product description",
      "quantityInStocks": 8,
      "basePrice": 500000,
      "currentPrice": 479999.99,
      "warrantyStatus": "3 Years",
      "distributorInfo": "Distributor name",
      "berthCount": 4,
      "fuelType": "Diesel",
      "weightKg": 2500,
      "hasKitchen": true,
      "discountRate": 5,
      "createdAt": "2026-04-09T00:00:00.000Z",
      "updatedAt": "2026-04-09T00:00:00.000Z"
    }
  ]
}
```

#### Common Errors

- `400` if `productIds` is not an array
- `400` if `sort` is invalid

---

## Cart Endpoints

All cart endpoints require authentication.

### `GET /api/v3/cart/`

Returns the authenticated user's cart items.

#### Auth

- Required

#### Success Response

Status: `200 OK`

```json
{
    "message": "Cart fetched successfully",
    "items": [
        {
            "cartItemId": "2a1cc08e-479d-4bb0-add0-d94581e0a676",
            "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
            "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
            "quantity": 7,
            "addedAt": "2026-04-09T15:02:55.921Z",
            "product": {
                "name": "Eco Camper Van",
                "currentPrice": "479999.99",
                "quantityInStocks": 8
            }
        }
    ]
}
```

---

### `POST /api/v3/cart/items`

Sets the quantity for a cart item. This endpoint now behaves like an upsert:

- if the product is not in the cart and `quantity > 0`, it creates the cart item
- if the product is already in the cart and `quantity > 0`, it replaces the existing quantity with the provided value
- if `quantity <= 0`, it removes the cart item if it exists

#### Auth

- Required

#### Request Body

```json
{
  "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
  "quantity": 2
}
```

#### Success Response

Status: `201 Created`

```json
{
    "message": "Cart item quantity set successfully",
    "cartItem": {
        "cartItemId": "be5f68c9-e343-42a7-a139-0f69dd8d2054",
        "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
        "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
        "quantity": 2,
        "addedAt": "2026-04-09T16:22:09.366Z",
        "product": {
            "name": "Eco Camper Van",
            "currentPrice": "479999.99",
            "quantityInStocks": 8
        }
    }
}
```

If `quantity <= 0` and the item exists, the endpoint removes it and returns:

```json
{
    "message": "Cart item removed successfully",
    "cartItem": null
}
```

If `quantity <= 0` and the item does not exist, the endpoint still returns `201`:

```json
{
    "message": "There is no cart item with the given productId: 8924ed90-3acb-4e39-a9a5-5c47a84255e9",
    "cartItem": null
}
```

#### Common Errors

- `400` if `productId` is missing
- `400` if `quantity` is missing
- `400` if `quantity` is not an integer
- `400` if requested quantity exceeds stock
- `404` if product does not exist

---

### `PATCH /api/v3/cart/items/:productId`

Updates quantity for one cart item.

#### Auth

- Required

#### Path Params

- `productId`: product id to update

#### Request Body

```json
{
  "quantity": 3
}
```

#### Success Response

Status: `200 OK`

```json
{
    "message": "Cart item quantity updated successfully",
    "cartItem": {
        "cartItemId": "7a69e6cc-b930-467a-a258-1da0f22c4a81",
        "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
        "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
        "quantity": 5,
        "addedAt": "2026-04-09T16:22:46.496Z",
        "product": {
            "name": "Eco Camper Van",
            "currentPrice": "479999.99",
            "quantityInStocks": 8
        }
    }
}
```

#### Common Errors

- `400` if `productId` is missing
- `400` if `quantity` is missing
- `400` if `quantity` is not a positive integer
- `400` if requested quantity exceeds stock
- `404` if product does not exist
- `404` if cart item does not exist

---

### `DELETE /api/v3/cart/items/:productId`

Deletes one item from the cart.

#### Auth

- Required

#### Path Params

- `productId`: product id to remove

#### Success Response

Status: `200 OK`

```json
{
    "message": "Cart item deleted successfully",
    "deletedItem": {
        "cartItemId": "2a1cc08e-479d-4bb0-add0-d94581e0a676",
        "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
        "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
        "quantity": 5,
        "addedAt": "2026-04-09T15:02:55.921Z"
    }
}
```

#### Common Errors

- `400` if `productId` is missing
- `404` if cart item does not exist

---

### `DELETE /api/v3/cart/`

Clears the entire cart for the authenticated user.

#### Auth

- Required

#### Success Response

Status: `200 OK`

```json
{
    "message": "Cart cleared successfully",
    "deletedItems": [
        {
            "cartItemId": "be5f68c9-e343-42a7-a139-0f69dd8d2054",
            "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
            "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
            "quantity": 1,
            "addedAt": "2026-04-09T16:22:09.366Z"
        }
    ]
}
```

---

### `POST /api/v3/cart/merge`

Merges guest cart items into the authenticated user's cart.

This is useful when:

- user adds items before login
- after login, frontend sends local cart items to backend
- backend merges them with stock checks

#### Auth

- Required

#### Request Body

```json
{
  "items": [
    {
      "productId": 12,
      "quantity": 2
    },
    {
      "productId": 13,
      "quantity": 1
    }
  ]
}
```

#### Success Response

Status: `200 OK`

```json
{
    "message": "Cart merged successfully",
    "items": [
        {
            "cartItemId": "7a69e6cc-b930-467a-a258-1da0f22c4a81",
            "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
            "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
            "quantity": 4,
            "addedAt": "2026-04-09T16:22:46.496Z",
            "product": {
                "name": "Eco Camper Van",
                "currentPrice": "479999.99",
                "quantityInStocks": 8
            }
        },
        {
            "cartItemId": "d5b51942-9507-45ad-8566-3743898ddfb6",
            "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
            "productId": "ec75b439-2776-4a85-979f-d21ef6ec0939",
            "quantity": 1,
            "addedAt": "2026-04-09T16:22:46.771Z",
            "product": {
                "name": "Silver Palace",
                "currentPrice": "120000.00",
                "quantityInStocks": 2
            }
        }
    ],
    "adjustments": [
        {
            "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e3",
            "requestedQuantity": 5,
            "finalQuantity": 0,
            "reason": "product_not_found"
        }
    ]
}
```

#### Possible `adjustments.reason` Values

- `missing_product_id`
- `invalid_quantity`
- `product_not_found`
- `out_of_stock`
- `stock_limit`

#### Common Errors

- `400` if `items` is not an array

---

## Payment Endpoints

All payment endpoints require authentication.

### `POST /api/v3/checkout/validate`

Validates the authenticated user's cart just before checkout to make sure every item is still available in stock.

#### Auth

- Required

#### Request Body

No request body is required.

#### Notes

- The backend reads the authenticated user's current cart.
- If the cart is empty, validation fails.
- If any product is missing or the requested quantity is greater than the currently available stock, the endpoint returns `isValid: false`.
- This endpoint does not create an order, charge a card, or modify stock.

#### Success Response

Status: `200 OK`

When checkout validation passes:

```json
{
  "isValid": true,
  "message": "Stock validation passed"
}
```

When checkout validation finds stock issues:

```json
{
  "isValid": false,
  "message": "Some items are out of stock",
  "details": [
    {
      "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
      "productName": "Eco Camper Van",
      "requestedQuantity": 2,
      "availableQuantity": 1
    }
  ]
}
```

#### Common Errors

- `400` if authenticated user id is missing in request context
- `400` if the cart is empty
- `401` if token is missing
- `401` if token is invalid

---

### `POST /api/v3/payments/`

Processes the authenticated user's checkout payment, creates an order, decreases stock, and clears the cart.

#### Auth

- Required

#### Request Body

```json
{
  "deliveryAddress": "Levent, Istanbul",
  "card": {
    "cardNumber": "4111 1111 1111 1111",
    "cardHolderName": "John Doe",
    "expiryMonth": 12,
    "expiryYear": 2028,
    "cvv": "123"
  }
}
```

#### Notes

- `deliveryAddress` is required and cannot be empty.
- `card` is required and must be a JSON object.
- `card.cardNumber` must contain 13 to 19 digits after spaces and hyphens are removed, and it must pass Luhn validation.
- `card.cardHolderName` is required and cannot be empty.
- `card.expiryMonth` must be an integer between `1` and `12`.
- `card.expiryYear` must be an integer between `2000` and `2100`.
- The card expiry date must not be in the past.
- `card.cvv` must be 3 or 4 digits.
- The backend calculates the total amount from the current cart items. The client does not send `amount`.
- Before creating the order, the backend re-checks stock using locked product rows inside a transaction.
- If payment succeeds, the backend creates an order, creates order items, decreases product stock, and clears the user's cart.

#### Success Response

Status: `200 OK`

```json
{
  "message": "Payment successful",
  "payment": {
    "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
    "amount": 479999.99,
    "cardLast4": "1111",
    "cardHolderName": "John Doe",
    "status": "success"
  },
  "order": {
    "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
    "customerId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
    "cardLast4": "1111",
    "totalPrice": 479999.99,
    "deliveryAddress": "Levent, Istanbul"
  }
}
```

#### Common Errors

- `400` if authenticated user id is missing in request context
- `400` if `deliveryAddress` is missing or empty
- `400` if the cart is empty
- `400` if `card` is missing or not an object
- `400` if any card field is missing or invalid
- `400` if some cart items are out of stock
- `401` if token is missing
- `401` if token is invalid

---

## Quick Frontend Summary

### Public Endpoints

- `POST /api/v3/auth/register`
- `POST /api/v3/auth/login`
- `GET /api/v3/auth/test`
- `GET /api/v3/products/all`
- `GET /api/v3/products/category_name`
- `GET /api/v3/products/search`
- `POST /api/v3/products/by-ids`

### Protected Endpoints

- `GET /api/v3/users/me`
- `GET /api/v3/users/me/orders`
- `GET /api/v3/users/me/orders/:orderId`
- `GET /api/v3/cart/`
- `POST /api/v3/cart/items`
- `PATCH /api/v3/cart/items/:productId`
- `DELETE /api/v3/cart/items/:productId`
- `DELETE /api/v3/cart/`
- `POST /api/v3/cart/merge`
- `POST /api/v3/checkout/validate`
- `POST /api/v3/payments/`

## Important Implementation Notes For Frontend

1. Login returns a JWT token. Store it and send it as `Authorization: Bearer <token>`.
2. Product endpoints currently return status `201` instead of `200`.
3. `GET /products/category_name` currently expects `category_name` in request body, which is unusual for a GET endpoint.
4. Product sorting supports:
   - `price_asc`
   - `price_desc`
5. `POST /products/by-ids` accepts `productIds` array and optional `sort`.
6. `/users/me` returns a wrapped profile payload with `message` and `user`.
7. Cart item payloads use `productId` in path params and bodies.
8. `GET /products/search` expects query parameter `q` and optional `sort` in query string.
9. `POST /checkout/validate` is the pre-payment stock safety check for the current cart.
10. `POST /payments/` now computes the total from the cart on the backend and creates an order on success.


