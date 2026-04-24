// When testing on a physical Android device, 
// 'localhost' points to the phone itself, not your computer.
// You might need to change this to your computer's local IP address 
// (e.g., 'http://192.168.1.5:8080') later.
// But for iOS simulator or web, localhost works perfectly.
//export const API_BASE_URL = 'http://localhost:8080';
export const API_BASE_URL = 'http://localhost:3000';

// EndPoints
const base = '/api/v3';
export const loginEndPoint = `${base}/auth/login`;
export const registerEndPoint = `${base}/auth/register`;
export const TOKEN_VALIDATE = `${base}/users/me`
export const PRODUCTS_END_POINT = `${base}/products/all`;
export const FETCH_PRODUCTS_DETAILS_END_POINT = `${base}/products/by-ids`;
export const MERGE_BACKEND_CART_END_POINT = `${base}/cart/merge`;
export const GET_BACKEND_CART = `${base}/cart`;
export const UPDATE_QUANTITY_END_POINT = `${base}/cart/items`;
export const DELETE_ITEM_END_POINT = `${base}/cart/items`;
export const VALIDATE_CART_END_POINT = `${base}/checkout/validate`
export const CART_PAYMENT_END_POINT = `${base}/payments`
export const UPDATE_PROFILE_ENDPOINT = `${base}/users/me`;
export const ADDRESSES_ENDPOINT = `${base}/users/me/addresses`;
export const GET_ORDERS_END_POINT = `${base}/users/me/orders`;
export const GET_ORDER_DETAILS_END_POINT = `${base}/users/me/orders`;
