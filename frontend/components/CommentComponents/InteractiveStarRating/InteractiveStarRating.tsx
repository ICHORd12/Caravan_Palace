import { FontAwesome } from "@expo/vector-icons";
import { View, Pressable } from "react-native";

import {styles} from './InteractiveStarRating.styles'

interface InteractiveStarRatingProps {
    rating: number;
    setRating: (newRating: number) => void;
}

export default function InteractiveStarRating({ rating, setRating }: InteractiveStarRatingProps) 
{
    const MAX_STARS = 5;

    return (
        <View style={styles.mainContainer}>
            {[...Array(MAX_STARS)].map((_, index) => {
                const starValue = index + 1; // 1-indexed (1 to 5)

                return (
                    <Pressable
                        key={index}
                        onPress={() => setRating(starValue)}
                        style={styles.pressableStar}
                    >
                        <FontAwesome
                            name={starValue <= rating ? "star" : "star-o"}
                            size={28}
                            color={starValue <= rating ? "#bc6c25" : "#8a8a8a"}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
}