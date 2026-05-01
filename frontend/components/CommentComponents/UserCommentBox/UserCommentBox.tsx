import { FlatList } from "react-native"
import UserCommentCard from "../UserCommentCard/UserCommentCard"

import {styles} from './UserCommentBox.styles'

interface UserCommentBoxProps {
    dataArray: {
        username: string,
        rating: number,
        comment: string,
        createdAt: string
    }[]
}


export default function UserCommentBox({dataArray}: UserCommentBoxProps)
{
    return (
        <FlatList
            data={dataArray} 
            keyExtractor={(item, index) => index.toString()} 
            showsVerticalScrollIndicator={true} 
            contentContainerStyle={styles.contentContainer} 

            renderItem={({ item }) => (
                <UserCommentCard
                    username={item.username}
                    rating={item.rating}
                    comment={item.comment}
                    createdAt={item.createdAt}
                />
            )}
        />
    )
    
}