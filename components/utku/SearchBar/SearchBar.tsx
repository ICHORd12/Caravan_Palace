import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface SearchBarProps {
  onSearch: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "Search products..." }: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch(query);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, onSearch]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={setQuery}
        placeholderTextColor="#888"
      />
    </View>
  );
}

import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    color: '#000',
    outlineStyle: 'none', // For web
  },
});
