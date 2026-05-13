# API Endpoints Documentation

This document summarizes the backend API endpoints currently implemented in the project for frontend integration.

## Base URL

- Base path: `/api/v3`
- Example local URL: `http://localhost:<PORT>/api/v3`

## General Notes
- The backend uses JSON request/response bodies.
- Protected endpoints require this header:


- Error responses generally look like this:

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

### `POST /api/v3/users/me/orders/:orderId/cancel`

Cancels a processing order owned by the authenticated user and restocks its items.

#### Auth

- Required

#### Path Params

- `orderId`: target order id

#### Request Body

No request body.

#### Notes

- Only orders with `status = "processing"` can be cancelled.
- Cancelling increases product stock for each order item.
- The backend sends a cancellation email after a successful update.

#### Success Response

Status: `200 OK`

```json
{
  "message": "Order cancelled successfully",
  "order": {
    "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
    "status": "cancelled"
  }
}
```

#### Common Errors

- `400` if authenticated user id is missing in request context
- `400` if `orderId` is missing
- `401` if token is missing
- `401` if token is invalid
- `404` if order is not found for the authenticated user
- `409` if order status is not `processing`

---

### `POST /api/v3/users/me/orders/:orderId/refund-requests`

Creates a full-order refund request for the authenticated user's delivered order.

#### Auth

- Required

#### Path Params

- `orderId`: target order id

#### Request Body

No request body.

#### Notes

- Only orders with `status = "delivered"` are eligible for refunds.
- Refunds must be requested within 30 days of the latest completed delivery (`deliveries.updated_at`).
- A refund request creates one refund row per order item.
- The backend sends a refund-requested email after a successful update.

#### Success Response

Status: `201 Created`

```json
{
  "message": "Refund request submitted successfully",
  "refunds": [
    {
      "refundId": "d1a7f3b9-2b4e-4a8e-8aa2-3c1c18f9a701",
      "orderItemId": "abc12345-def6-4789-ghij-klmn0pqr1234",
      "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
      "customerId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
      "status": "pending",
      "refundAmount": 479999.99,
      "requestDate": "2026-05-04T10:00:00.000Z",
      "processedAt": null
    }
  ]
}
```

#### Common Errors

- `400` if authenticated user id is missing in request context
- `400` if `orderId` is missing
- `401` if token is missing
- `401` if token is invalid
- `404` if order is not found for the authenticated user
- `409` if order status is not `delivered`
- `409` if the refund window has expired
- `409` if a refund request already exists for this order

---

### `POST /api/v3/users/me/orders/:orderId/items/:orderItemId/refund-requests`

Creates a refund request for a specific order item.

#### Auth

- Required

#### Path Params

- `orderId`: target order id
- `orderItemId`: target order item id

#### Request Body

No request body.

#### Notes

- Only orders with `status = "delivered"` are eligible for refunds.
- Refunds must be requested within 30 days of the latest completed delivery (`deliveries.updated_at`).
- A refund request creates a single refund row for the selected order item.

#### Success Response

Status: `201 Created`

```json
{
  "message": "Refund request submitted successfully",
  "refund": {
    "refundId": "d1a7f3b9-2b4e-4a8e-8aa2-3c1c18f9a701",
    "orderItemId": "abc12345-def6-4789-ghij-klmn0pqr1234",
    "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
    "customerId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
    "status": "pending",
    "refundAmount": 479999.99,
    "requestDate": "2026-05-04T10:00:00.000Z",
    "processedAt": null
  }
}
```

#### Common Errors

- `400` if authenticated user id is missing in request context
- `400` if `orderId` or `orderItemId` is missing
- `401` if token is missing
- `401` if token is invalid
- `404` if order or order item is not found for the authenticated user
- `409` if order status is not `delivered`
- `409` if the refund window has expired
- `409` if a refund request already exists for this item

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

Product objects returned by the product endpoints below include an `images` array plus approved-review rating summary fields. Images are ordered with primary images first, then by creation date.

#### Product Rating Fields

- `averageRating`: average rating from approved reviews, rounded to 1 decimal place. Returns `0` when the product has no approved reviews.
- `reviewCount`: number of approved reviews included in `averageRating`. Returns `0` when the product has no approved reviews.

#### Product Image Object

```json
{
  "imageId": "3b67fbdd-d08b-47f7-b493-b3c27ec1a8c4",
  "url": "https://example.com/images/caravan-x-front.jpg",
  "isPrimary": true,
  "createdAt": "2026-04-09T00:00:00.000Z"
}
```

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
      "warrantyStatus": "3 Years",
      "distributorInfo": "Distributor name",
      "berthCount": 4,
      "fuelType": "Diesel",
      "weightKg": 2500,
      "hasKitchen": true,
      "discountRate": 5,
      "averageRating": 4.6,
      "reviewCount": 12,
      "createdAt": "2026-04-09T00:00:00.000Z",
      "updatedAt": "2026-04-09T00:00:00.000Z",
      "images": [
        {
          "imageId": "3b67fbdd-d08b-47f7-b493-b3c27ec1a8c4",
          "url": "https://example.com/images/caravan-x-front.jpg",
          "isPrimary": true,
          "createdAt": "2026-04-09T00:00:00.000Z"
        },
        {
          "imageId": "0dd97142-8d8c-46f3-8353-fd7490864b56",
          "url": "https://example.com/images/caravan-x-interior.jpg",
          "isPrimary": false,
          "createdAt": "2026-04-10T00:00:00.000Z"
        }
      ]
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
      "warrantyStatus": "3 Years",
      "distributorInfo": "Distributor name",
      "berthCount": 4,
      "fuelType": "Diesel",
      "weightKg": 2500,
      "hasKitchen": true,
      "discountRate": 5,
      "averageRating": 4.6,
      "reviewCount": 12,
      "createdAt": "2026-04-09T00:00:00.000Z",
      "updatedAt": "2026-04-09T00:00:00.000Z",
      "images": [
        {
          "imageId": "3b67fbdd-d08b-47f7-b493-b3c27ec1a8c4",
          "url": "https://example.com/images/caravan-x-front.jpg",
          "isPrimary": true,
          "createdAt": "2026-04-09T00:00:00.000Z"
        },
        {
          "imageId": "0dd97142-8d8c-46f3-8353-fd7490864b56",
          "url": "https://example.com/images/caravan-x-interior.jpg",
          "isPrimary": false,
          "createdAt": "2026-04-10T00:00:00.000Z"
        }
      ]
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
      "averageRating": 4.7,
      "reviewCount": 18,
      "createdAt": "2026-04-09T00:00:00.000Z",
      "updatedAt": "2026-04-09T00:00:00.000Z",
      "images": [
        {
          "imageId": "d6df0ec8-f2c9-438d-a42f-462a99760cd6",
          "url": "https://example.com/images/eco-camper-front.jpg",
          "isPrimary": true,
          "createdAt": "2026-04-09T00:00:00.000Z"
        },
        {
          "imageId": "4f2b33a1-a4f9-4c80-9198-f2500baad1ef",
          "url": "https://example.com/images/eco-camper-side.jpg",
          "isPrimary": false,
          "createdAt": "2026-04-10T00:00:00.000Z"
        }
      ]
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
      "averageRating": 4.7,
      "reviewCount": 18,
      "createdAt": "2026-04-09T00:00:00.000Z",
      "updatedAt": "2026-04-09T00:00:00.000Z",
      "images": [
        {
          "imageId": "d6df0ec8-f2c9-438d-a42f-462a99760cd6",
          "url": "https://example.com/images/eco-camper-front.jpg",
          "isPrimary": true,
          "createdAt": "2026-04-09T00:00:00.000Z"
        },
        {
          "imageId": "4f2b33a1-a4f9-4c80-9198-f2500baad1ef",
          "url": "https://example.com/images/eco-camper-side.jpg",
          "isPrimary": false,
          "createdAt": "2026-04-10T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

#### Common Errors

- `400` if `productIds` is not an array
- `400` if `sort` is invalid

---

### `GET /api/v3/products/:productId/details`

Fetches one product's full detail payload, including product images, reviews, the current user's review if authenticated, and review eligibility.

#### Auth

- Optional
- If a valid `Authorization: Bearer <token>` header is sent, the response includes user-specific review eligibility and the authenticated user's existing review if one exists.
- If the token is missing or invalid, the endpoint still responds as a guest user.

#### Path Params

- `productId`: target product id

#### Request Example

```http
GET /api/v3/products/8924ed90-3acb-4e39-a9a5-5c47a84255e9/details
```

#### Success Response

Status: `200 OK`

```json
{
    "message": "Product details fetched successfully",
    "product": {
        "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
        "categoryId": "11111111-1111-1111-1111-111111111111",
        "name": "Eco Camper Van",
        "model": "ECO-2025",
        "serialNumber": "SN-000002",
        "description": "Absolute meth production machine.",
        "quantityInStocks": 13,
        "basePrice": "500000.00",
        "currentPrice": "479999.99",
        "warrantyStatus": "4 Years",
        "distributorInfo": null,
        "berthCount": 2,
        "fuelType": "Nuclear",
        "weightKg": 1500,
        "hasKitchen": false,
        "discountRate": 0,
        "averageRating": 4.5,
        "reviewCount": 6,
        "createdAt": "2026-03-23T15:02:31.883Z",
        "updatedAt": "2026-03-23T15:02:31.883Z",
        "images": []
    },
    "reviewEligibility": {
        "canReview": false,
        "reason": "User has already reviewed this product"
    },
    "userReview": {
        "reviewId": "a6a61455-b69e-46c7-99f1-4b12ee69aa5b",
        "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
        "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
        "userName": "Mustafa",
        "rating": 5,
        "commentText": "Great Product!",
        "isApproved": false,
        "createdAt": "2026-05-01T16:56:49.598Z",
        "updatedAt": "2026-05-01T16:56:49.598Z"
    },
    "reviews": [
    {
      "reviewId": "3a2fd384-e018-4f7d-81c5-9e0b9a57a2bf",
      "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
      "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
      "userName": "John Doe",
      "rating": 5,
      "commentText": "Excellent caravan.",
      "isApproved": true,
      "createdAt": "2026-04-20T14:30:00.000Z",
      "updatedAt": "2026-04-20T14:30:00.000Z"
    }
  ]
}
```

#### Review Eligibility Notes

- Guest users receive `canReview: false` with reason `"User is not logged in"`.
- Authenticated users who already reviewed the product receive their review in `userReview` and `canReview: false`.
- Authenticated users can review only if they have received the product through a completed delivery and delivered order.

#### Common Errors

- `404` if product is not found

---

### `PATCH /api/v3/products/:productId/discount`

Updates a product's discount rate. If the new discount is greater than the previous discount, the backend emails users who have that product in their wishlist.

#### Auth

- Required (product manager only)

#### Path Params

- `productId`: target product id

#### Request Body

```json
{
  "discountRate": 15
}
```

#### Notes

- `discountRate` must be a number between `0` and `100`.
- The backend recalculates `current_price` from `base_price` and the new discount.
- Wishlist notification emails are sent only when the new discount is greater than the previous discount and greater than `0`.
- Email delivery is best-effort: the discount update can still succeed if wishlist notification email delivery fails.

#### Success Response

Status: `200 OK`

```json
{
  "message": "Product discount updated successfully",
  "product": {
    "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
    "name": "Eco Camper Van",
    "basePrice": "500000.00",
    "currentPrice": "425000.00",
    "discountRate": 15
  },
  "previousDiscountRate": 5,
  "notificationSummary": {
    "triggered": true,
    "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
    "attempted": 3,
    "sent": 3,
    "failed": 0
  }
}
```

#### Common Errors

- `400` if `discountRate` is missing, not numeric, or outside `0` to `100`
- `401` if token is missing
- `401` if token is invalid
- `403` if user is not a product manager
- `404` if product is not found

---


## Review Endpoints

Review routes are mounted under `/api/v3/reviews`.

#### Review Object

Public review responses include `userName`:

```json
{
  "reviewId": "3a2fd384-e018-4f7d-81c5-9e0b9a57a2bf",
  "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
  "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
  "userName": "John Doe",
  "rating": 5,
  "commentText": "Excellent caravan.",
  "isApproved": true,
  "createdAt": "2026-04-20T14:30:00.000Z",
  "updatedAt": "2026-04-20T14:30:00.000Z"
}
```

### `GET /api/v3/reviews/:productId/reviews`

Fetches approved reviews for a product.

#### Auth

- Not required

#### Path Params

- `productId`: target product id

#### Success Response

Status: `200 OK`

```json
{
  "message": "Reviews fetched successfully",
  "reviews": [
    {
      "reviewId": "3a2fd384-e018-4f7d-81c5-9e0b9a57a2bf",
      "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
      "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
      "userName": "John Doe",
      "rating": 5,
      "commentText": "Excellent caravan.",
      "isApproved": true,
      "createdAt": "2026-04-20T14:30:00.000Z",
      "updatedAt": "2026-04-20T14:30:00.000Z"
    }
  ]
}
```

---

### `GET /api/v3/reviews/:productId/review-eligibility`

Checks whether the authenticated user can review a product.

#### Auth

- Required

#### Path Params

- `productId`: target product id

#### Success Response

Status: `200 OK`

When the user can review:

```json
{
  "message": "User is eligible to review this product",
  "canReview": true
}
```

When the user cannot review:

```json
{
  "message": "User is not eligible to review this product",
  "canReview": false
}
```

If the user has already reviewed the product:

```json
{
  "message": "User has already reviewed this product",
  "canReview": false
}
```

#### Common Errors

- `401` if token is missing
- `401` if token is invalid

---

### `POST /api/v3/reviews/:productId/reviews`

Creates a review for a product.

#### Auth

- Required

#### Path Params

- `productId`: target product id

#### Request Body

```json
{
  "rating": 5,
  "commentText": "Excellent caravan."
}
```

#### Request Fields

- `rating`: required integer between `1` and `5`
- `commentText`: optional review text

#### Success Response

Status: `201 Created`

```json
{
  "message": "Review created successfully",
  "review": {
    "reviewId": "3a2fd384-e018-4f7d-81c5-9e0b9a57a2bf",
    "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
    "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
    "rating": 5,
    "commentText": "Excellent caravan.",
    "isApproved": false,
    "createdAt": "2026-04-20T14:30:00.000Z",
    "updatedAt": "2026-04-20T14:30:00.000Z"
  }
}
```

#### Common Errors

- `400` if `rating` is not an integer between `1` and `5`
- `401` if token is missing
- `401` if token is invalid
- `403` if the user has not received the product
- `409` if the user already reviewed the product

---

### `DELETE /api/v3/reviews/:reviewId`

Deletes a review.

#### Auth

- Required
- The authenticated user must either own the review or have role `product_manager`.

#### Path Params

- `reviewId`: target review id

#### Success Response

Status: `200 OK`

```json
{
  "message": "Review deleted successfully"
}
```

#### Common Errors

- `401` if token is missing
- `401` if token is invalid
- `403` if the user is not allowed to delete the review
- `404` if review is not found

---

### `PATCH /api/v3/reviews/:reviewId`

Updates the authenticated user's own review and marks it as pending approval again.

#### Auth

- Required
- The authenticated user must own the review.

#### Path Params

- `reviewId`: target review id

#### Request Body

At least one field is required:

```json
{
  "rating": 4,
  "comment": "Still very happy with it after another trip."
}
```

#### Request Fields

- `rating`: optional updated rating
- `comment`: optional updated review text

#### Success Response

Status: `200 OK`

```json
{
  "message": "Review updated successfully and is pending approval",
  "review": {
    "reviewId": "3a2fd384-e018-4f7d-81c5-9e0b9a57a2bf",
    "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
    "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
    "rating": 4,
    "commentText": "Still very happy with it after another trip.",
    "isApproved": false,
    "createdAt": "2026-04-20T14:30:00.000Z",
    "updatedAt": "2026-05-06T14:30:00.000Z"
  }
}
```

#### Common Errors

- `400` if neither `rating` nor `comment` is provided
- `401` if token is missing
- `401` if token is invalid
- `403` if the authenticated user does not own the review
- `404` if review is not found

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

## Wishlist Endpoints

All wishlist endpoints require authentication.

### `GET /api/v3/wishlist/`

Returns the authenticated user's wishlist items, ordered by newest added item first.

#### Auth

- Required

#### Success Response

Status: `200 OK`

```json
{
    "message": "Wishlist fetched successfully",
    "wishlist": [
        {
            "wishlistId": "0a6a1a24-14dd-49d7-9301-bf78c16efb1f",
            "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
            "addedAt": "2026-04-09T16:22:09.366Z",
            "product": {
                "name": "Eco Camper Van",
                "model": "ECO-2026",
                "currentPrice": "479999.99",
                "basePrice": "499999.99",
                "discountRate": "4.00",
                "quantityInStocks": 8,
                "imageUrl": "https://example.com/images/eco-camper-van.jpg"
            }
        }
    ]
}
```

#### Common Errors

- `401` if token is missing
- `401` if token is invalid

---

### `POST /api/v3/wishlist/:productId`

Adds one product to the authenticated user's wishlist.

#### Auth

- Required

#### Path Params

- `productId`: product id to add

#### Request Body

No request body is required.

#### Success Response

Status: `201 Created`

```json
{
    "message": "Product added to wishlist successfully",
    "wishlistItem": {
        "wishlistId": "0a6a1a24-14dd-49d7-9301-bf78c16efb1f",
        "productId": "8924ed90-3acb-4e39-a9a5-5c47a84255e9",
        "addedAt": "2026-04-09T16:22:09.366Z",
        "product": {}
    }
}
```

#### Notes

- Use `GET /api/v3/wishlist/` after adding if the frontend needs the product name, price, stock, discount, or image for the new wishlist item.
- The endpoint prevents duplicate wishlist entries for the same user and product.

#### Common Errors

- `401` if token is missing
- `401` if token is invalid
- `404` if product does not exist
- `409` if product is already in wishlist

---

### `DELETE /api/v3/wishlist/:productId`

Removes one product from the authenticated user's wishlist.

#### Auth

- Required

#### Path Params

- `productId`: product id to remove

#### Success Response

Status: `200 OK`

```json
{
    "message": "Product removed from wishlist successfully"
}
```

#### Common Errors

- `401` if token is missing
- `401` if token is invalid
- `404` if product is not in wishlist

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

Processes the authenticated user's checkout payment, creates an order, decreases stock, clears the cart, and attempts to email the invoice to the user.

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
- After the payment transaction commits, the backend generates the invoice PDF and attempts to email it to the authenticated user's email on file.
- Invoice email delivery is best-effort in this payment flow: if SMTP/email sending fails, the failure is logged and the payment response still returns `200 OK`.

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

## Order Management Endpoints

All order management endpoints require authentication and are restricted to `sales_manager` users.

### `GET /api/v3/orders/reports/financial-summary`

Returns revenue, loss, refund loss, net revenue, and profit for orders placed inside an inclusive date range.

#### Auth

- Required (sales manager only)

#### Query Params

- `startDate`: first date in `YYYY-MM-DD` format
- `endDate`: last date in `YYYY-MM-DD` format

#### Request Example

```http
GET /api/v3/orders/reports/financial-summary?startDate=2026-05-01&endDate=2026-05-31
```

#### Notes

- `startDate` and `endDate` are inclusive calendar dates.
- Cancelled orders are excluded.
- `grossRevenue` is based on purchased order item prices.
- `discountLoss` is the difference between product base price and purchased price for sold items.
- `refundLoss` includes approved/completed refunds for sold items in the selected order-date range.
- `netRevenue` and `profit` are currently calculated as `grossRevenue - refundLoss`.

#### Success Response

Status: `200 OK`

```json
{
  "message": "Financial summary fetched successfully",
  "dateRange": {
    "startDate": "2026-05-01",
    "endDate": "2026-05-31",
    "startAt": "2026-05-01T00:00:00.000Z",
    "endAt": "2026-06-01T00:00:00.000Z"
  },
  "summary": {
    "orderCount": 12,
    "itemsSold": 18,
    "refundCount": 1,
    "potentialRevenue": 6200000,
    "grossRevenue": 5890000,
    "discountLoss": 310000,
    "refundLoss": 150000,
    "totalLoss": 460000,
    "netRevenue": 5740000,
    "profit": 5740000
  }
}
```

#### Common Errors

- `400` if `startDate` or `endDate` is missing
- `400` if dates are not valid `YYYY-MM-DD` calendar dates
- `400` if `startDate` is after `endDate`
- `401` if token is missing
- `401` if token is invalid
- `403` if user is not a sales manager

---


### `GET /api/v3/orders`

Returns all orders across all users.

#### Auth

- Required (sales manager only)

#### Query Params

- `status`: optional order status filter
- `startDate`: optional date filter (YYYY-MM-DD)
- `endDate`: optional date filter (YYYY-MM-DD)

Notes:

- `startDate` and `endDate` must be provided together.

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
      "status": "processing",
      "deliveryAddress": "Levent, Istanbul",
      "orderDate": "2026-04-20T14:30:00.000Z",
      "customer": {
        "userId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
        "name": "John Doe",
        "email": "john@example.com",
        "taxId": "1234567890",
        "role": "customer",
        "createdAt": "2026-04-09T00:00:00.000Z"
      },
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

- `400` if `status` is invalid
- `400` if `startDate` or `endDate` is missing or invalid
- `401` if token is missing
- `401` if token is invalid
- `403` if user is not a sales manager

---

### `PATCH /api/v3/orders/:orderId/status`

Updates an order status and populates deliveries when the order enters transit.

#### Auth

- Required (sales manager only)

#### Path Params

- `orderId`: target order id

#### Request Body

```json
{
  "status": "in-transit"
}
```

Allowed values: `in-transit`, `delivered`

#### Notes

- `processing -> in-transit` inserts one delivery row per order item.
- `in-transit -> delivered` marks deliveries as completed.

#### Success Response

Status: `200 OK`

```json
{
  "message": "Order status updated successfully",
  "order": {
    "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
    "status": "in-transit"
  }
}
```

#### Common Errors

- `400` if `orderId` is missing
- `400` if `status` is missing or invalid
- `401` if token is missing
- `401` if token is invalid
- `403` if user is not a sales manager
- `404` if order is not found
- `409` if the status transition is not allowed

---

## Refund Endpoints

All refund endpoints require authentication and are restricted to `sales_manager` users.

### `GET /api/v3/refunds/`

Returns refund requests, optionally filtered by status.

#### Auth

- Required (sales manager only)

#### Query Params

- `status`: optional filter (`pending`, `approved`, `rejected`, `completed`)

#### Success Response

Status: `200 OK`

```json
{
  "message": "Refunds fetched successfully",
  "refunds": [
    {
      "refundId": "d1a7f3b9-2b4e-4a8e-8aa2-3c1c18f9a701",
      "orderItemId": "abc12345-def6-4789-ghij-klmn0pqr1234",
      "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
      "customerId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
      "status": "pending",
      "refundAmount": 479999.99,
      "requestDate": "2026-05-04T10:00:00.000Z",
      "processedAt": null
    }
  ]
}
```

#### Common Errors

- `400` if `status` filter is invalid
- `401` if token is missing
- `401` if token is invalid
- `403` if user is not a sales manager

---

### `PATCH /api/v3/refunds/:refundId`

Approves or rejects a refund request.

#### Auth

- Required (sales manager only)

#### Path Params

- `refundId`: target refund id

#### Request Body

```json
{
  "status": "approved"
}
```

Allowed values: `approved`, `rejected`

#### Notes

- The backend sets `processed_at` when the status changes.
- If all refunds for the related order are approved, the order status becomes `returned`.
- The backend emails the customer on approval or rejection.

#### Success Response

Status: `200 OK`

```json
{
  "message": "Refund status updated successfully",
  "refund": {
    "refundId": "d1a7f3b9-2b4e-4a8e-8aa2-3c1c18f9a701",
    "orderItemId": "abc12345-def6-4789-ghij-klmn0pqr1234",
    "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b",
    "customerId": "b3c3f74e-4aba-4e46-8e5c-53c344f2d259",
    "status": "approved",
    "refundAmount": 479999.99,
    "requestDate": "2026-05-04T10:00:00.000Z",
    "processedAt": "2026-05-05T10:00:00.000Z"
  }
}
```

#### Common Errors

- `400` if `refundId` is missing
- `400` if `status` is not `approved` or `rejected`
- `401` if token is missing
- `401` if token is invalid
- `403` if user is not a sales manager
- `404` if refund is not found

---

## Invoice / Email Endpoints

All invoice endpoints require authentication. They generate a PDF invoice for one of the authenticated user's existing orders and either return it as a file download or email it to the user. A successful payment also automatically attempts to email the invoice after the order is created.

> **Backend integration note:** the routes, controllers, services and tests are wired up in code (`src/routes/invoiceRoutes.js`, `src/controllers/invoiceController.js`, `src/services/{pdfService,emailService,invoiceService}.js`). Before these endpoints can actually deliver email in a deployed environment, the backend team still needs to:
>
> 1. Set the SMTP environment variables described in **Environment Variables** below (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`).
> 2. Make sure outbound SMTP is allowed from the deployment environment.

---

### `GET /api/v3/users/me/orders/:orderId/invoice.pdf`

Generates the invoice PDF for one historical order owned by the authenticated user and streams it back as a file download.

#### Auth

- Required

#### Path Params

- `orderId`: target order id (must belong to the authenticated user)

#### Request Body

No request body.

#### Success Response

Status: `200 OK`

Response is a binary PDF stream (not JSON):

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice-order-<orderId>.pdf"
Content-Length: <bytes>
```

#### Alias

This route has the same behavior without the `.pdf` suffix:

```http
GET /api/v3/users/me/orders/:orderId/invoice
```

#### Common Errors

- `400` if authenticated user id is missing in request context
- `400` if `orderId` is missing
- `401` if token is missing
- `401` if token is invalid
- `404` if the order is not found for the authenticated user

---


### `GET /api/v3/invoices/:orderId/pdf`

Generates the invoice PDF for one of the authenticated user's orders and streams it back as a file download.

#### Auth

- Required

#### Path Params

- `orderId`: target order id (must belong to the authenticated user)

#### Request Body

No request body.

#### Success Response

Status: `200 OK`

Response is a binary PDF stream (not JSON):

```http
Content-Type: application/pdf
Content-Disposition: attachment; filename="invoice-order-<orderId>.pdf"
Content-Length: <bytes>
```

The body is the raw PDF file (starts with `%PDF-` and ends with `%%EOF`). The PDF includes:

- Invoice number, order id, order date
- Billed-to (user name + email)
- Delivery address
- Payment method (last 4 digits of card)
- Itemized table: product name, quantity, unit price, subtotal
- Total
- Footer

#### Common Errors

- `400` if authenticated user id is missing in request context
- `400` if `orderId` is missing
- `401` if token is missing
- `401` if token is invalid
- `404` if the order is not found for the authenticated user

---

### `POST /api/v3/invoices/:orderId/email`

Generates the invoice PDF for one of the authenticated user's orders and emails it to that user as an attachment.

#### Auth

- Required

#### Path Params

- `orderId`: target order id (must belong to the authenticated user)

#### Request Body

No request body. The recipient address is always the authenticated user's email on file. (This is intentional — it prevents one user from spamming invoices to arbitrary addresses.)

#### Notes

- The email subject is `Your Caravan Palace Invoice - Order #<orderId>`.
- The email contains both a plain-text and HTML body and one attachment named `invoice-order-<orderId>.pdf` with `Content-Type: application/pdf`.
- The `From` address comes from the `MAIL_FROM` env var (defaults to `Caravan Palace <no-reply@caravanpalace.com>`).
- Sending uses `nodemailer` with the SMTP transport configured via env vars.
- This endpoint does NOT modify the order; it can be called more than once.

#### Success Response

Status: `200 OK`

```json
{
  "message": "Invoice emailed successfully",
  "to": "john@example.com",
  "orderId": "7e8f8f62-4a2f-4a60-bec5-3bfdfb879c1b"
}
```

#### Common Errors

- `400` if authenticated user id is missing in request context
- `400` if `orderId` is missing
- `400` if the user does not have an email address on file
- `401` if token is missing
- `401` if token is invalid
- `404` if the order is not found for the authenticated user
- `500` if the SMTP transport fails (bad credentials, host unreachable, etc.)

---

### Environment Variables (SMTP / Email)

These must be set on the backend for invoice emails and wishlist discount notification emails to work in production. They live in `src/config/env.js`:

| Variable      | Purpose                                                                  | Example / Default                                       |
| ------------- | ------------------------------------------------------------------------ | ------------------------------------------------------- |
| `SMTP_HOST`   | SMTP server hostname                                                     | `smtp.gmail.com` (default)                              |
| `SMTP_PORT`   | SMTP server port                                                         | `587` (default) — use `465` for `secure: true`          |
| `SMTP_SECURE` | `"true"` for SMTPS (TLS-on-connect, port 465); otherwise STARTTLS on 587 | `"false"` (default)                                     |
| `SMTP_USER`   | SMTP username (often the sending email address)                          | `mailer@caravanpalace.com`                              |
| `SMTP_PASS`   | SMTP password / app password                                             | _(never commit this)_                                   |
| `MAIL_FROM`   | The `From:` header used in outgoing mail                                 | `Caravan Palace <no-reply@caravanpalace.com>` (default) |

**Do NOT commit real SMTP credentials to git.** Put them in `.env` locally and as deployment secrets in production.

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
- `GET /api/v3/products/:productId/details`
- `GET /api/v3/reviews/:productId/reviews`

### Protected Endpoints

- `GET /api/v3/users/me`
- `GET /api/v3/users/me/orders`
- `GET /api/v3/users/me/orders/:orderId`
- `GET /api/v3/users/me/orders/:orderId/invoice.pdf`
- `GET /api/v3/users/me/orders/:orderId/invoice`
- `POST /api/v3/users/me/orders/:orderId/cancel`
- `POST /api/v3/users/me/orders/:orderId/refund-requests`
- `POST /api/v3/users/me/orders/:orderId/items/:orderItemId/refund-requests`
- `PATCH /api/v3/products/:productId/discount`
- `GET /api/v3/cart/`
- `POST /api/v3/cart/items`
- `PATCH /api/v3/cart/items/:productId`
- `DELETE /api/v3/cart/items/:productId`
- `DELETE /api/v3/cart/`
- `POST /api/v3/cart/merge`
- `GET /api/v3/wishlist/`
- `POST /api/v3/wishlist/:productId`
- `DELETE /api/v3/wishlist/:productId`
- `GET /api/v3/reviews/:productId/review-eligibility`
- `POST /api/v3/reviews/:productId/reviews`
- `DELETE /api/v3/reviews/:reviewId`
- `PATCH /api/v3/reviews/:reviewId`
- `POST /api/v3/checkout/validate`
- `POST /api/v3/payments/`
- `GET /api/v3/orders`
- `GET /api/v3/orders/reports/financial-summary`
- `PATCH /api/v3/orders/:orderId/status`
- `GET /api/v3/refunds/`
- `PATCH /api/v3/refunds/:refundId`
- `GET /api/v3/invoices/:orderId/pdf`
- `POST /api/v3/invoices/:orderId/email`

## Important Implementation Notes For Frontend

1. Login returns a JWT token. Store it and send it as `Authorization: Bearer <token>`.
2. Product list endpoints currently return status `201` instead of `200`.
3. `GET /products/category_name` currently expects `category_name` in request body, which is unusual for a GET endpoint.
4. Product sorting supports:
   - `price_asc`
   - `price_desc`
5. `POST /products/by-ids` accepts `productIds` array and optional `sort`.
6. `/users/me` returns a wrapped profile payload with `message` and `user`.
7. Cart item payloads use `productId` in path params and bodies.
8. `GET /products/search` expects query parameter `q` and optional `sort` in query string.
9. `POST /checkout/validate` is the pre-payment stock safety check for the current cart.
10. `POST /payments/` now computes the total from the cart on the backend, creates an order on success, and then best-effort emails the invoice to the authenticated user's email.
11. `GET /products/:productId/details` uses optional auth; missing or invalid tokens are treated as guest access.
12. Review creation requires the user to have received the product and prevents duplicate reviews.
13. `GET /users/me/orders/:orderId/invoice.pdf` and `GET /invoices/:orderId/pdf` return a binary PDF (not JSON). The frontend should treat the response as a `Blob`/`ArrayBuffer` (e.g. `fetch(...).then(r => r.blob())` or axios `responseType: 'blob'`) and trigger a download. The `Content-Disposition` header carries the filename.
14. `POST /invoices/:orderId/email` always emails the PDF to the authenticated user's email on file — no recipient field is accepted from the client. The endpoint can be called multiple times for the same order. SMTP credentials must be configured in backend env vars (see **Environment Variables** in the Invoice section).
15. Wishlist endpoints use `productId` as a path parameter. `GET /wishlist/` returns product summary data and the primary image URL; `POST /wishlist/:productId` only returns the created wishlist row, so refetch the wishlist if the UI needs full product details.
16. `PATCH /orders/:orderId/status` is restricted to `sales_manager` users and handles `processing -> in-transit -> delivered` transitions while populating deliveries.
17. `POST /users/me/orders/:orderId/cancel` only works when order status is `processing` and will restock items.
18. `POST /users/me/orders/:orderId/refund-requests` only works when order status is `delivered` and within 30 days of the latest completed delivery; it creates one refund per order item.
19. `POST /users/me/orders/:orderId/items/:orderItemId/refund-requests` allows item-level refunds under the same delivery and window rules.
20. `GET /refunds/` and `PATCH /refunds/:refundId` are restricted to `sales_manager` users.
21. `PATCH /products/:productId/discount` is restricted to `product_manager` users and automatically emails wishlist users when the discount increases.
22. `GET /orders/reports/financial-summary` is restricted to `sales_manager` users and requires `startDate` and `endDate` query params in `YYYY-MM-DD` format.
23. `GET /orders` is restricted to `sales_manager` users and supports optional `status` and `startDate`/`endDate` filters.
