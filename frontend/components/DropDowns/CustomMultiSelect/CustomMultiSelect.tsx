import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Pressable,
    ScrollView,
    Text,
    View
} from 'react-native';
import { styles } from './CustomMultiSelect.styles';

// Use a generic type <T> so the component knows if it's dealing with strings or numbers
interface CustomMultiSelectProps<T extends string | number> {
    mainContainerStyle?: Object;
    triggerStyle?: Object;
    triggerTextStyle?: Object;
    dropdownOverlayStyle?: Object;
    scrollViewStyle?: Object;
    optionItemStyle?: Object;
    checkboxStyle?: Object;
    checkboxSelectedStyle?: Object;
    optionTextStyle?: Object;
    selectAllButtonStyle?: Object;
    selectAllTextStyle?: Object;
    closeButtonStyle?: Object;
    closeButtonTextStyle?: Object;

    options: { label: string; value: T }[];
    selectedOptions: T[];
    onChange: (newValue: T[]) => void;
    placeholder?: string;
}

// Pass the generic <T> to the function component
export default function CustomMultiSelect<T extends string | number>({
    mainContainerStyle,
    triggerStyle,
    triggerTextStyle,
    dropdownOverlayStyle,
    scrollViewStyle,
    optionItemStyle,
    checkboxStyle,
    checkboxSelectedStyle,
    optionTextStyle,
    selectAllButtonStyle,
    selectAllTextStyle,
    closeButtonStyle,
    closeButtonTextStyle,

    options, 
    selectedOptions, 
    onChange, 
    placeholder = "Any" 
}: CustomMultiSelectProps<T>) {

    const [isOpen, setIsOpen] = useState(false);
    const isSelectAll = options.length > 0 && selectedOptions.length === options.length;

    // Ensure itemValue expects the generic type T
    function toggleSelection(itemValue: T) 
    {
        if (selectedOptions.includes(itemValue)) 
        {
            onChange(selectedOptions.filter((val) => val !== itemValue));
        } 
        else 
        {
            onChange([...selectedOptions, itemValue]);
        }
    }

    function toggleSelectAll() 
    {
        if (isSelectAll) 
        {
            onChange([]);
        } 
        else 
        {
            const allValues = options.map((item) => item.value);
            onChange(allValues);
        }
    }

    function getDisplayText() 
    {
        if (selectedOptions.length === 0) 
        {
            return placeholder;
        }
        if (selectedOptions.length === 1) 
        {
            const selectedItem = options.find(d => d.value === selectedOptions[0]);
            return selectedItem ? selectedItem.label : placeholder;
        }
        return `${selectedOptions.length} items selected`;
    }

    return (
        <View style={[styles.mainContainer, mainContainerStyle]}>

            <Pressable style={[styles.trigger, triggerStyle]} onPress={() => setIsOpen(!isOpen)}>
                <Text style={[styles.triggerText, triggerTextStyle]}>{getDisplayText()}</Text>
                <Ionicons 
                    name={isOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#283618" 
                />
            </Pressable>

            {isOpen && (
                <View style={[styles.dropdownOverlay, dropdownOverlayStyle]}>
                    <ScrollView style={[styles.scrollView, scrollViewStyle]} nestedScrollEnabled={true}>
                        {options.map((item, index) => {
                            const isSelected = selectedOptions.includes(item.value);
                            return (
                                <Pressable
                                    key={index}
                                    style={[styles.optionItem, optionItemStyle]}
                                    onPress={() => toggleSelection(item.value)}
                                >
                                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected, checkboxStyle, isSelected && checkboxSelectedStyle]}>
                                        {isSelected && <Ionicons name="checkmark" size={14} color="#fefae0" />}
                                    </View>
                                    <Text style={[styles.optionText, optionTextStyle]}>{item.label}</Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    <Pressable style={[styles.selectAllButton, selectAllButtonStyle]} onPress={() => toggleSelectAll()}>
                        <Text style={[styles.selectAllText, selectAllTextStyle]}>{isSelectAll ? "Deselect All" : "Select All"}</Text>
                    </Pressable>

                    <Pressable style={[styles.closeButton, closeButtonStyle]} onPress={() => setIsOpen(false)}>
                        <Text style={[styles.closeButtonText, closeButtonTextStyle]}>Close</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}