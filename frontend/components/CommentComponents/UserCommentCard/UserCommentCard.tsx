import { View, Text } from "react-native"
import StarRating from "../StarRating/StarRating"

import {styles} from './UserCommentCard.styles'


interface UserCommentCardProps {
    username: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export default function UserCommentCard({username, rating, comment, createdAt}: UserCommentCardProps)
{
    return (
        <View style={styles.userCommentBox}>

            <View style={styles.userCommentTopBar}>
                <Text style={styles.userCommentTopBarUserNameText}>{username}</Text>
                <StarRating rating={rating} />
            </View>

            <View style={styles.userCommentContainer}>
                <Text style={styles.userCommentText}>{comment}</Text>
            </View>

            <View style={styles.userCommentCreatedAtContainer}>
                <Text style={styles.userCommentCreatedAtText}>{createdAt}</Text>
            </View>

        </View>
    )
    
}
