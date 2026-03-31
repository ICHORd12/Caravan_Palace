import React, { createContext, useContext, useState } from "react";
import { api, Order, OrderItem } from "../services/api";

interface OrderWithItems extends Order {
  items?: OrderItem[];
}

interface OrderContextType {
  orders: Order[];
  currentOrder: OrderWithItems | null;
  loading: boolean;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: number) => Promise<OrderWithItems>;
  placeOrder: (items: { product_id: number; quantity: number }[], shippingAddress: string) => Promise<Order>;
}

const OrderContext = createContext<OrderContextType>({
  orders: [],
  currentOrder: null,
  loading: false,
  fetchOrders: async () => {},
  fetchOrderById: async () => ({} as OrderWithItems),
  placeOrder: async () => ({} as Order),
});

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await api.getOrders();
      setOrders(result.orders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderById = async (id: number) => {
    setLoading(true);
    try {
      const result = await api.getOrder(id);
      setCurrentOrder(result.order);
      return result.order;
    } catch (err) {
      console.error("Failed to fetch order:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async (items: { product_id: number; quantity: number }[], shippingAddress: string) => {
    const result = await api.createOrder(items, shippingAddress);
    setOrders((prev) => [result.order, ...prev]);
    return result.order;
  };

  return (
    <OrderContext.Provider
      value={{ orders, currentOrder, loading, fetchOrders, fetchOrderById, placeOrder }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export const useOrders = () => useContext(OrderContext);
