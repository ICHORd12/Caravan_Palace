import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import {
  Montserrat_400Regular,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  useFonts
} from '@expo-google-fonts/montserrat';

import C_Navbar from '../components/utku/C_Navbar/C_Navbar';
import GeneralButton from '../components/utku/GeneralButton/GeneralButton';

export default function Home() {
  const router = useRouter();

  let [fontsLoaded] = useFonts({
    Montserrat_700Bold,
    Montserrat_400Regular,
    Montserrat_600SemiBold,
  });

  const [isBlue, setIsBlue] = useState(false);
  const wipeAnim = useRef(new Animated.Value(0)).current;

  if (!fontsLoaded) {
    return null;
  }

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
    <View style={styles.container}>

      {/* BACKGROUND LAYER */}
      <Animated.View style={[
        styles.slidingBackground,
        { width: wipeWidth }
      ]} />

      {/* HEADER TOOLBAR */}
      <View style={styles.headerBarContainer}>
        <C_Navbar router={router} />
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
          <GeneralButton title="CARAVANS" onPress={() => router.push('/caravans')} />
          <GeneralButton title="GALLERY" onPress={triggerBackgroundWipe} />
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d6cba6',
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
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '15%',
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
  }
});