import React from "react";
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './ShopCard.style';
import { CartItemFE } from "@/models/FRONTEND_MODELS";
import {UpdateQuantityInput} from '@/app/shopping/shoppingCart'


//#region TO DO
/*
    ShopCard'in alt tarafinda toplam ucret de gozuksun
*/

//#endregion

interface ShopCardProps {
    cartItem: CartItemFE;
    updateQuantity: ({productId, delta}: UpdateQuantityInput) => void;
}

function ShopCard({ cartItem, updateQuantity }: ShopCardProps)
{
    return(
         <View style={styles.cartCard}>
            
            <View style={styles.itemDetails}>
                <Text style={styles.itemNameText} numberOfLines={2}>{cartItem.product.name}</Text>
                <Text style={styles.itemPriceText}>${cartItem.product.currentPrice}</Text>
                <Text style={styles.itemStockInfoText}>Stock Quantity: {cartItem.product.quantityInStocks}</Text>
                <TouchableOpacity onPress={() => updateQuantity({productId: cartItem.productId, delta: 0 })}>
                    <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>

            </View>

            <View style={styles.quantityContainer}>

                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity({productId: cartItem.productId, delta: -1 })}>
                    <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>

                <Text style={styles.qtyText}>{cartItem.quantity}</Text>

                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity({productId: cartItem.productId, delta: 1 })}>
                    <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>

            </View>
        </View>
    )
};

export default ShopCard;
    