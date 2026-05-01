import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    mainContainer: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    starContainer: { 
        position: 'relative', 
        marginRight: 4 
    },
    starFiller: {
        position: 'absolute', 
        top: 0, 
        left: 0, 
        overflow: 'hidden' 
    }
});