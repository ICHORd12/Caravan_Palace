import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem, Product } from "../services/api";

interface CartContextType {
  cartItems: CartItem[];
  itemCount: number;
  totalPrice: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
  getCartItem: (productId: number) => CartItem | undefined;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  itemCount: 0,
  totalPrice: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isInCart: () => false,
  getCartItem: () => undefined,
});

const CART_STORAGE_KEY = "caravan_palace_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Restore cart from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((data) => {
        if (data) {
          setCartItems(JSON.parse(data));
        }
      })
      .catch((err) => console.error("Failed to restore cart:", err))
      .finally(() => setLoaded(true));
  }, []);

  // Persist cart whenever it changes (after initial load)
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)).catch(
        (err) => console.error("Failed to save cart:", err)
      );
    }
  }, [cartItems, loaded]);

  const addToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.product_id === product.product_id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.quantity_in_stocks);
        return prev.map((item) =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: newQty }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(quantity, product.quantity_in_stocks) }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product.product_id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.product_id === productId
          ? { ...item, quantity: Math.min(quantity, item.product.quantity_in_stocks) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (productId: number) => {
    return cartItems.some((item) => item.product.product_id === productId);
  };

  const getCartItem = (productId: number) => {
    return cartItems.find((item) => item.product.product_id === productId);
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.product.current_price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        getCartItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
