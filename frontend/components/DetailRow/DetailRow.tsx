import { View, Text, StyleProp, ViewStyle, TextStyle } from "react-native"
import {styles} from "./DetailRow.styles"


interface DetailRowProps {
    detailRowContainerStyle?: StyleProp<ViewStyle>;
    detailRowLabelTextStyle?: StyleProp<TextStyle>;
    detailRowValueTextStyle?: StyleProp<TextStyle>;
    label: string;
    value: string | number;
}

export default function DetailRow({detailRowContainerStyle, detailRowLabelTextStyle, detailRowValueTextStyle, label, value}: DetailRowProps) 
{
    return (
        <View style={[styles.detailRowContainer, detailRowContainerStyle]}>
            <Text style={[styles.detailRowLabelText, detailRowLabelTextStyle]}>{label}</Text>
            <Text style={[styles.detailRowValueText, detailRowValueTextStyle]}>{value}</Text>
        </View>
    )
}