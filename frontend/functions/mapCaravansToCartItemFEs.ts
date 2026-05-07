import { Caravan } from "@/models/BACKEND_MODELS";
import { CartItemFE } from "@/models/FRONTEND_MODELS";

export default function mapCaravansToCartItemFEs(
        caravans: Caravan[], 
        localItemsData: Record<string, number>
    ): CartItemFE[] {
        return caravans.map(caravan => {
            
            const quantity = localItemsData[caravan.productId];

            return {
                cartItemId: `local_cart_${caravan.productId}`, 
                userId: "guest",
                productId: caravan.productId,
                quantity: quantity,
                product: {
                    name: caravan.name,
                    currentPrice: caravan.currentPrice,
                    quantityInStocks: caravan.quantityInStocks
                }
            };
        });
    }