import { Platform } from "react-native";

export default function getLocalCartProductIds(): string[]
{
    let productIds: string[] = [];
    if (Platform.OS !== 'web' || typeof window === 'undefined') productIds = [];
    else
    {
        for (let i = 0; i < window.localStorage.length; i++) 
        {
            const key = window.localStorage.key(i);
            if (key && key.startsWith('cart_')) 
            {
                const productId = key.replace('cart_', '');
                productIds.push(productId);
            }
        }
    }
    return productIds;
}