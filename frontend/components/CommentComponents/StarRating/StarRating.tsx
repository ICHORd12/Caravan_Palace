import { FontAwesome } from "@expo/vector-icons";
import { View } from "react-native";

import {styles} from './StarRating.styles'

export default function StarRating({ rating }: { rating: number }) {
    const MAX_STARS = 5;
    return (
        <View style={styles.mainContainer}>
            {[...Array(MAX_STARS)].map((_, index) => {
                const fillPercentage = Math.max(0, Math.min(1, rating - index)) * 100;
                return (
                    <View key={index} style={styles.starContainer}>

                        <FontAwesome name="star" size={20} color="#e0e0e0" />

                        {fillPercentage > 0 && (

                            <View style={[styles.starFiller, {width: `${fillPercentage}%`}]}>
                                <FontAwesome name="star" size={20} color="#bc6c25" />
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}