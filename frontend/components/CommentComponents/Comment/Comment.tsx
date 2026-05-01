import { View } from "react-native"
import TopBar from "../TopBar/TopBar"
import WriteCommentCard from "../WriteCommentCard/WriteCommentCard"
import UserCommentBox from "../UserCommentBox/UserCommentBox"

import { styles } from './Comment.styles'

interface CommentProps {
    canComment: boolean;

    avgPoint: number;
    dropDownSortOptions: any;
    dropDownselectedValue: any;
    dropDownOnChange: any;

    userRating: number;
    commentText: string
    onWriteCommentRating: (newRating: number) => void;
    onCommentText:  (newComment: string) => void;

    dataArray: {
        username: string;
        rating: number;
        comment: string;
        createdAt: string;
    }[];
}

export default function Comment(
    {   canComment,
        avgPoint, dropDownSortOptions, dropDownselectedValue, dropDownOnChange,
        userRating, commentText, onWriteCommentRating, onCommentText,
        dataArray
    }: CommentProps)
{
    return (
        <View style={styles.mainComponent}>
            <TopBar
                avgPoint={avgPoint}
                dropDownSortOptions={dropDownSortOptions}
                dropDownselectedValue={dropDownselectedValue}
                dropDownOnChange={dropDownOnChange}
            />

            {canComment && (
                <WriteCommentCard 
                    userRating={userRating}
                    commentText={commentText}
                    onWriteCommentRating={onWriteCommentRating}
                    onCommentText={onCommentText}
                />
            )}

            <View style={styles.userCommentsContainer}>
                <UserCommentBox
                    dataArray={dataArray}
                />
            </View>
        </View>
    )
    
}