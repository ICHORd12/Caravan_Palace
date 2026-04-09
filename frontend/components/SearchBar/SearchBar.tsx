import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, View } from 'react-native';
import { styles } from '../SearchBar/SearchBar.styles';


interface SearchBarProps {
    containerStyle?: object;
    textStyle?: object;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export default function SearchBar({containerStyle, textStyle, value, onChangeText, placeholder = "Search..." }: SearchBarProps) {
    return (
        <View style={[styles.searchContainer, containerStyle]}>
            <Ionicons name="search" size={20} color="#283618" style={styles.icon} />
            <TextInput
                style={[styles.input, textStyle]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#a09a80"
            />
        </View>
    );
}

