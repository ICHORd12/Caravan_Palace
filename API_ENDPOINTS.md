# API Endpoints Documentation

This document summarizes the backend API endpoints currently implemented in the project for frontend integration.

## Base URL

- Base path: `/api/v2`
- Example local URL: `http://localhost:<PORT>/api/v2`

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

### `POST /api/v2/auth/register`

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

### `POST /api/v2/auth/login`

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

### `GET /api/v2/auth/test`

Simple test endpoint.

#### Success Response

Status: `200 OK`

Plain text response:

```text
Test route works
```

---

## User Endpoints

### `GET /api/v2/users/me`

Returns the currently authenticated user.

#### Auth

- Required

#### Success Response

Status: `200 OK`

```json
{
  "id": 1,
  "email": "john@example.com"
}
```

#### Common Errors

- `401` if token is missing
- `401` if token is invalid
- `404` if user is not found

---

## Product Endpoints

### `GET /api/v2/products/all`

Fetches all products.

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

### `GET /api/v2/products/category_name`

Fetches products by category name.

#### Important Backend Behavior

- This route is defined as `GET`.
- But the current backend reads `category_name` from `req.body`, not from query params.
- In standard HTTP usage, `GET` requests usually do not send a body.
- For frontend usage, it would be safer if backend later changes this to query-based usage like `?category_name=...`.

#### Request Body

```json
{
  "category_name": "Camper Vans"
}
```

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

## Cart Endpoints

All cart endpoints require authentication.

### `GET /api/v2/cart/`

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

### `POST /api/v2/cart/items`

Adds an item to the cart. If the product already exists in the cart, backend increases the quantity.

#### Auth

- Required

#### Request Body

```json
{
  "productId": 12,
  "quantity": 2
}
```

#### Success Response

Status: `201 Created`

```json
{
    "message": "Item added to cart successfully",
    "cartItem": {
        "cartItemId": "2a1cc08e-479d-4bb0-add0-d94581e0a676",
        "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
        "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
        "quantity": 4,
        "addedAt": "2026-04-09T15:02:55.921Z"
    }
}
```

#### Common Errors

- `400` if `productId` is missing
- `400` if `quantity` is missing
- `400` if `quantity` is not a positive integer
- `400` if requested quantity exceeds stock
- `404` if product does not exist

---

### `PATCH /api/v2/cart/items/:productId`

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
- `400` if `quantity` is missing
- `400` if `quantity` is not a positive integer
- `400` if requested quantity exceeds stock
- `404` if product does not exist
- `404` if cart item does not exist

---

### `DELETE /api/v2/cart/items/:productId`

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

### `DELETE /api/v2/cart/`

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

### `POST /api/v2/cart/merge`

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

## Quick Frontend Summary

### Public Endpoints

- `POST /api/v2/auth/register`
- `POST /api/v2/auth/login`
- `GET /api/v2/auth/test`
- `GET /api/v2/products/all`
- `GET /api/v2/products/category_name`

### Protected Endpoints

- `GET /api/v2/users/me`
- `GET /api/v2/cart/`
- `POST /api/v2/cart/items`
- `PATCH /api/v2/cart/items/:productId`
- `DELETE /api/v2/cart/items/:productId`
- `DELETE /api/v2/cart/`
- `POST /api/v2/cart/merge`

## Important Implementation Notes For Frontend

1. Login returns a JWT token. Store it and send it as `Authorization: Bearer <token>`.
2. Product endpoints currently return status `201` instead of `200`.
3. `GET /products/category_name` currently expects `category_name` in request body, which is unusual for a GET endpoint.
4. `/users/me` currently returns only:
   - `id`
   - `email`
5. Cart item payloads use `productId` in path params and bodies.

