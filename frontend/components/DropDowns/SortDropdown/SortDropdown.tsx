import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../SortDropdown/SortDropdown.styles';


interface SortDropdownProps {
    containerStyle?: object;
    triggerStyle?: object;
    triggerTextStyle?: object;
    dropdownOverlayStyle?: object;
    optionItemStyle?: object;
    optionTextStyle?: object;
    selectedTextStyle?: object;
    options: { label: string; value: string }[];
    selectedValue: string;
    onChange: (newValue: string) => void;
}

export default function SortDropdown(
    {
        containerStyle,
        triggerStyle, 
        triggerTextStyle, 
        dropdownOverlayStyle, 
        optionItemStyle, 
        optionTextStyle, 
        selectedTextStyle,
        options, 
        selectedValue, 
        onChange }: SortDropdownProps) 
{

    const [isOpen, setIsOpen] = useState(false);

    function handleSelect(value: string) 
    {
        onChange(value);
        setIsOpen(false);
    };

    const displayLabel = options.find((opt) => opt.value === selectedValue)?.label || "Sort By";

    return (
        // Main Container
        <View style={[styles.container, containerStyle]}>
            
            <Pressable style={[styles.trigger, triggerStyle]} onPress={() => setIsOpen(!isOpen)}>
                <Text style={[styles.triggerText, triggerTextStyle]}>{displayLabel}</Text>
                <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#283618" />
            </Pressable>

            {isOpen && (
                <View style={[styles.dropdownOverlay, dropdownOverlayStyle]}>
                    {options.map((item, index) => (
                        <Pressable
                            key={index}
                            style={[styles.optionItem, optionItemStyle]}
                            onPress={() => handleSelect(item.value)}
                        >
                            <Text style={[styles.optionText,optionTextStyle, selectedValue === item.value && [styles.selectedText, selectedTextStyle]]}>
                                {item.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
}

