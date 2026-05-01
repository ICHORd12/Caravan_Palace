import { View, Text, TextInput } from "react-native"
import InteractiveStarRating from "../InteractiveStarRating/InteractiveStarRating"
import WrappedGeneralButton from "@/components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper"

import {styles} from './WriteCommentCard.styles'


interface WriteCommentCardProps {
    userRating: number;
    commentText: string;
    onWriteCommentRating: (newRating: number) => void;
    onCommentText: (newComment: string) => void;
}

export default function WriteCommentCard(
    {userRating, commentText, onWriteCommentRating, onCommentText}: WriteCommentCardProps)
{
    return (
        <View style={styles.writeCommentContainer}>
            <View style={styles.writeCommentRatingContainer}>
                <Text style={styles.writeCommentRatingLabel}>Give a Rating</Text>

                <InteractiveStarRating
                    rating={userRating}
                    setRating={onWriteCommentRating}
                />
            </View>
            <View style={styles.writeCommentTextInputContainer}>
                <TextInput
                    style={styles.writeCommentTextInput}
                    placeholder="Write your review here..."
                    placeholderTextColor="#8a8a8a"
                    multiline={true}
                    maxLength={1000}
                    value={commentText}
                    onChangeText={onCommentText}
                />

                <Text style={styles.writeCommentTextInputCharacterCounter}>
                    {commentText.length} / {1000}
                </Text>
            </View>
            <View style={styles.writeCommentSendButtonContainer}>
                <WrappedGeneralButton
                    wrapperStyles={styles.writeCommentSendButtonWrapper}
                    textStyles={styles.writeCommentSendButtonText}
                    title="Send Comment"
                    onPress={() => { }} />
            </View>
        </View>
    )
}
