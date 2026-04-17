//#region IMPORTS

import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    useFonts
} from '@expo-google-fonts/montserrat';

import { useTransition } from '../context/TransitionContext';

import GeneralButton from '../components/Buttons/GeneralButton/GeneralButton';
import Navbar from '../components/Navbar/Navbar';
//#endregion

export default function Home() {
    const { revealWipe, navigateWithWipe } = useTransition();

    let [fontsLoaded] = useFonts({
        Montserrat_700Bold,
        Montserrat_400Regular,
        Montserrat_600SemiBold,
    });

    useFocusEffect(
        useCallback(() => {
            if (fontsLoaded) {
                revealWipe();
            }
        }, [fontsLoaded]) 
    );

    if (!fontsLoaded) {
        return null;
    }

    return (
        <View style={styles.mainContainer}>

            {/* HEADER TOOLBAR */}
            <Navbar></Navbar>

            {/* MAIN CONTENT AREA */}
            <View style={styles.mainContent}>
                <Text style={styles.titleText}>
                    BUILD YOUR DREAM CARAVAN
                </Text>

                <Text style={styles.secondTitleText}>
                    YOUR HOME AWAY FROM HOME
                </Text>

                <View style={styles.mainContentButtonRow}>
                    <GeneralButton title="CARAVANS" onPress={() => navigateWithWipe('/shopping/caravans')} />
                </View>
            </View>

        </View>
    );
}


//#region STYLES

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#d6cba6',
    },
    slidingBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#a94c0f',
        zIndex: 9999,
        elevation: 9999, 
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
//#endregion