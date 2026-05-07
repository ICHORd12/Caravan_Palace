import { Platform } from "react-native";


export default function getLocalCartMap(): Record<string, number> 
{
    if (Platform.OS !== 'web' || typeof window === 'undefined') return {};
    
    const localCart: Record<string, number> = {};
    for (let i = 0; i < window.localStorage.length; i++) 
    {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('cart_')) 
        {
            const productId = key.replace('cart_', '');
            localCart[productId] = parseInt(window.localStorage.getItem(key) || '0', 10);
        }
    }
    return localCart;
}