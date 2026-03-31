import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View, Image, Pressable, ScrollView } from 'react-native';

import C_Navbar from '../components/utku/C_Navbar/C_Navbar';
import GeneralButton from '../components/utku/GeneralButton/GeneralButton';
import { api, Category } from '../services/api';

export default function Home() {
  const router = useRouter();

  const [isBlue, setIsBlue] = useState(false);
  const wipeAnim = useRef(new Animated.Value(0)).current;
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.getCategories().then(res => setCategories(res.categories)).catch(console.error);
  }, []);

  const triggerBackgroundWipe = () => {
    const nextIsBlue = !isBlue;
    setIsBlue(nextIsBlue);

    Animated.timing(wipeAnim, {
      toValue: nextIsBlue ? 1 : 0,
      duration: 1000,
      easing: Easing.inOut(Easing.exp),
      useNativeDriver: false,
    }).start();
  };

  const wipeWidth = wipeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        {/* BACKGROUND LAYER */}
        <Animated.View style={[
          styles.slidingBackground,
          { width: wipeWidth }
        ]} />

        {/* HEADER TOOLBAR */}
        <View style={styles.headerBarContainer}>
          <C_Navbar />
        </View>

        {/* MAIN CONTENT AREA */}
        <View style={styles.mainContent}>
          <Text style={styles.titleText}>
            BUILD YOUR DREAM CARAVAN
          </Text>

          <Text style={styles.secondTitleText}>
            YOUR HOME AWAY FROM HOME
          </Text>

          <View style={styles.mainContentButtonRow}>
            <GeneralButton title="SHOP CARAVANS" onPress={() => router.push('/caravans')} />
            <GeneralButton title="CHANGE THEME" onPress={triggerBackgroundWipe} />
          </View>
        </View>
      </View>

      {/* CATEGORIES SECTION */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Shop by Category</Text>
        <View style={styles.categoriesGrid}>
          {categories.slice(0, 4).map(cat => (
            <Pressable 
              key={cat.category_id}
              style={styles.categoryCard}
              onPress={() => router.push({ pathname: '/caravans', params: { category_id: cat.category_id } })}
            >
              <View style={styles.categoryImagePlaceholder}>
                <Image source={require('../assets/images/caravan.jpg')} style={{ width: '100%', height: '100%', borderRadius: 125 }} resizeMode="cover" />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Caravan Palace. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroSection: {
    height: 800,
    backgroundColor: '#d6cba6',
    position: 'relative',
  },
  slidingBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#daf2f6',
  },
  headerBarContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '15%',
    zIndex: 10,
  },
  titleText: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 50,
    textAlign: 'center',
    color: '#222222',
  },
  secondTitleText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 15,
    textAlign: 'center',
    color: '#222222',
    marginTop: 5,
  },
  mainContentButtonRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 50,
  },
  categoriesSection: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 32,
    color: '#222',
    marginBottom: 40,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30,
    justifyContent: 'center',
  },
  categoryCard: {
    width: 250,
    alignItems: 'center',
  },
  categoryImagePlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: '#f5f5f5',
    borderRadius: 125,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  categoryIcon: {
    fontSize: 60,
  },
  categoryName: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 18,
    color: '#333',
  },
  footer: {
    backgroundColor: '#222',
    padding: 40,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Montserrat_400Regular',
    color: '#ccc',
    fontSize: 14,
  }
});