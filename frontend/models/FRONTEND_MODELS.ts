import { CartProduct } from "./BACKEND_MODELS";

export type CartItemFE = {
    cartItemId: string;
    productId: string; 
    quantity: number;
    product: CartProduct;
}
