import React, {useMemo} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import Logo from '../assets/logo.svg';
import PosterCarousel from '../components/PosterCarousel';

export default function HomeScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const {height: windowHeight} = useWindowDimensions();

  const styles = useMemo(() => {
    return StyleSheet.create({
      flexContainer: {
        flex: 1,
      },
      logoContainer: {
        height: windowHeight * 0.18,
        justifyContent: 'center',
        alignItems: 'center',
      },
      posterCarouselContainer: {
        justifyContent: 'center',
      },
    });
  }, [windowHeight]);

  return (
    <SafeAreaView style={styles.flexContainer}>
      <GestureHandlerRootView style={styles.flexContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.logoContainer}>
          <Logo width={windowHeight * 0.1} height={windowHeight * 0.1} />
        </View>
        <View style={[styles.flexContainer, styles.posterCarouselContainer]}>
          <PosterCarousel />
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}
