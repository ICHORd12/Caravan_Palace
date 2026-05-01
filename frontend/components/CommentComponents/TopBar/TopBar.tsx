import { View, Text } from "react-native";
import SortDropdown from "@/components/DropDowns/SortDropdown/SortDropdown";
import StarRating from "../StarRating/StarRating";

import {styles} from './TopBar.styles'

interface TopBarProps {
    avgPoint: number;
    dropDownSortOptions: any;
    dropDownselectedValue: any;
    dropDownOnChange: any;
}

export default function TopBar(
    {avgPoint, dropDownSortOptions, dropDownselectedValue, dropDownOnChange}: TopBarProps)
{
    return (
        <View style={styles.topBarContainer}>
        
            <View style={styles.topBarRatingContainer}>

                <View style={styles.topBarRatingAvgStar}>
                    <StarRating rating={avgPoint} />
                </View>

                <View style={styles.topBarRatingAvgPoint}>
                    <Text style={styles.topBarRatingAvgPointText}>{avgPoint}</Text>
                </View>
            </View>

            <View style={styles.topBarSortDropDown}>
                <SortDropdown
                    options={dropDownSortOptions}
                    selectedValue={dropDownselectedValue}
                    onChange={dropDownOnChange}
                />
            </View>

        </View>
    );
}