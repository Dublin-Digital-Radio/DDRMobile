import React, {useContext, useMemo} from 'react';
import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useTheme} from '@react-navigation/native';

import Logo from '../assets/logo.svg';
import {AppContext} from '../AppContext';
import PosterCarousel from '../components/PosterCarousel';

export default function HomeScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const {height: windowHeight} = useWindowDimensions();
  const {colors} = useTheme();
  const {currentShowInfo} = useContext(AppContext);

  const styles = useMemo(() => {
    return StyleSheet.create({
      flexContainer: {
        flex: 1,
      },
      logoContainer: {
        height: windowHeight * 0.11,
        justifyContent: 'center',
        alignItems: 'center',
      },
      posterCarouselContainer: {
        justifyContent: 'center',
        alignItems: 'center',
      },
      liveNowTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 4,
      },
      liveNowDot: {
        backgroundColor: 'red',
        borderRadius: 999,
        width: 20,
        height: 20,
        marginRight: 4,
      },
      liveNowText: {
        color: colors.text,
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'uppercase',
      },
      liveNowImage: {
        width: windowHeight * 0.3,
        height: windowHeight * 0.3,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.border,
      },
    });
  }, [colors.border, colors.text, windowHeight]);

  return (
    <SafeAreaView style={styles.flexContainer}>
      <GestureHandlerRootView style={styles.flexContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.logoContainer}>
          <Logo width={windowHeight * 0.1} height={windowHeight * 0.1} />
        </View>
        <View style={[styles.flexContainer, styles.posterCarouselContainer]}>
          <PosterCarousel
            height={
              currentShowInfo?.image?.data.attributes.url
                ? windowHeight * 0.3
                : windowHeight * 0.4
            }
          />
        </View>
        {currentShowInfo?.image?.data.attributes.url ? (
          <View style={[styles.flexContainer, styles.posterCarouselContainer]}>
            <View style={styles.liveNowTextContainer}>
              <View style={styles.liveNowDot} />
              <Text style={styles.liveNowText}>Live now</Text>
            </View>
            <Image
              style={styles.liveNowImage}
              source={{uri: currentShowInfo?.image.data.attributes.url}}
            />
          </View>
        ) : null}
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}
