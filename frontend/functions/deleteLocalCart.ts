import { Platform } from "react-native";

export default function deleteLocalCart(localCart: any)
{
    if (Platform.OS === 'web') 
    {
        Object.keys(localCart).forEach(productId => {
            window.localStorage.removeItem(`cart_${productId}`);
        });
    }
}
