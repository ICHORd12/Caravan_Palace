import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://localhost:3000/api/v1";

async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ message: string; token: string; user: { id: number; name: string; email: string; role: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { name: string; email: string; password: string; tax_id?: string; home_address?: string }) =>
    request<{ message: string; user: { id: number; name: string; email: string; role: string } }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () =>
    request<{ id: number; email: string }>("/users/me"),

  // Products
  getProducts: (params?: { search?: string; sort?: string; order?: string; category_id?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.sort) query.set("sort", params.sort);
    if (params?.order) query.set("order", params.order);
    if (params?.category_id) query.set("category_id", String(params.category_id));
    const qs = query.toString();
    return request<{ message: string; products: Product[] }>(`/products/all${qs ? `?${qs}` : ""}`);
  },

  getProduct: (id: number) =>
    request<{ message: string; product: Product }>(`/products/${id}`),

  getCategories: () =>
    request<{ message: string; categories: Category[] }>("/products/categories"),

  // Orders
  createOrder: (items: { product_id: number; quantity: number }[], shipping_address: string) =>
    request<{ message: string; order: Order }>("/orders", {
      method: "POST",
      body: JSON.stringify({ items, shipping_address }),
    }),

  getOrders: () =>
    request<{ message: string; orders: Order[] }>("/orders"),

  getOrder: (id: number) =>
    request<{ message: string; order: Order & { items: OrderItem[] } }>(`/orders/${id}`),

  // Payment
  processPayment: (data: { card_number: string; expiry: string; cvv: string; amount: number }) =>
    request<{ message: string; transaction_id: string; amount: number; status: string }>("/payment/process", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Types
export interface Product {
  product_id: number;
  category_id: number;
  name: string;
  model: string;
  serial_number: string;
  description: string;
  quantity_in_stocks: number;
  base_price: number;
  current_price: number;
  warranty_status: string;
  distributor_info: string;
  berth_count: number;
  fuel_type: string;
  weight_kg: number;
  has_kitchen: boolean;
  discount_rate: number;
  popularity: number;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: number;
  name: string;
}

export interface Order {
  order_id: number;
  user_id: number;
  total_amount: number;
  shipping_address: string;
  status: "processing" | "in-transit" | "delivered";
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  name: string;
  image_url: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}
