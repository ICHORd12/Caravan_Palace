import { View, Text, StyleSheet, Pressable, TextInput, FlatList } from "react-native"
import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';
import { FontAwesome } from '@expo/vector-icons';


import { commentSortOptions, commentMockData } from "@/constants/MOCKDATA";

import SortDropdown from "@/components/DropDowns/SortDropdown/SortDropdown";
import { useState } from "react";
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper";
import InteractiveStarRating from "@/components/CommentComponents/InteractiveStarRating/InteractiveStarRating";
import StarRating from "@/components/CommentComponents/StarRating/StarRating";
import WriteCommentCard from "@/components/CommentComponents/WriteCommentCard/WriteCommentCard";
import UserCommentCard from "@/components/CommentComponents/UserCommentCard/UserCommentCard";
import UserCommentBox from "@/components/CommentComponents/UserCommentBox/UserCommentBox";
import TopBar from "@/components/CommentComponents/TopBar/TopBar";
import Comment from "@/components/CommentComponents/Comment/Comment";

export default function test() {
    const [sortOption, setSortOption] = useState(commentSortOptions[0].value)
    const [userRating, setUserRating] = useState(0);
    const [commentText, setCommentText] = useState("");


    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });

    function onWriteCommentRating(starValue: number) {
        const value: number = userRating;
        if (starValue === userRating) {
            setUserRating(0);
        }
        else {
            setUserRating(starValue);
        }
    }

    const canComment: boolean = true;
    const avgPoint: number = 3.6;

    return (
        <View style={styles.mainContainer}>
            <View style={styles.contentContainer}>

                
                

            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#d6cba6',
    },
    contentContainer: {
        flex: 1,
        width: '100%',
        maxWidth: 1000,
        margin: 100,
        alignSelf: 'center',
        backgroundColor: 'rgba(159, 159, 159, 0.4)',
    },
    mainComponent: {
        padding: 10,
        flex: 1,
    },

    /* TOP BAR */
    

    /* WRITE COMMENT */
    

    /* USER COMMENTS */
    userCommentsContainer: {
        flex: 1,
        marginTop: 10,
    },
    
});