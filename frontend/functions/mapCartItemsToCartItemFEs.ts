import { CartItem } from "@/models/BACKEND_MODELS";
import { CartItemFE } from "@/models/FRONTEND_MODELS";

export default function mapCaravansToCartItemFEs(
        cartItems: CartItem[], 
    ): CartItemFE[] {
        return cartItems.map(cartItem => {
            
            return {
                cartItemId: `local_cart_${cartItem.productId}`, 
                userId: "guest",
                productId: cartItem.productId,
                quantity: cartItem.quantity,
                product: cartItem.product
            };
        });
    }