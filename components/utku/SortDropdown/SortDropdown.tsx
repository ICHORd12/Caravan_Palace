import React from 'react';
import { StyleSheet, View } from 'react-native';

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <View style={styles.container}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.select as any}
      >
        <option value="">Newest</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="popularity_desc">Popularity</option>
      </select>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  select: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 10,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 14,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
});
