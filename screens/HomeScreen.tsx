import React, {useCallback, useContext, useMemo} from 'react';
import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableHighlight,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useFocusEffect, useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';

import Logo from '../assets/logo.svg';
import {AppContext} from '../AppContext';
import PosterCarousel from '../components/PosterCarousel';
import Text from '../components/Text';

export default function HomeScreen() {
  const isDarkMode = useColorScheme() === 'dark';
  const {height: windowHeight} = useWindowDimensions();
  const {colors} = useTheme();
  const {currentShowInfo, refreshTrackData, setShowInfoModalVisible} =
    useContext(AppContext);

  useFocusEffect(
    useCallback(() => {
      refreshTrackData();
    }, [refreshTrackData]),
  );

  const styles = useMemo(() => {
    return StyleSheet.create({
      flexContainer: {
        flex: 1,
      },
      logoContainer: {
        position: 'absolute',
        top: 5,
        left: 5,
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
        fontSize: 20,
        fontFamily: 'Chivo-Bold',
        textTransform: 'uppercase',
      },
      liveNowImage: {
        width: windowHeight * 0.3,
        height: windowHeight * 0.3,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: colors.border,
      },
      liveNowImageInfoContainer: {
        position: 'absolute',
        bottom: 4,
        left: 4,
        borderRadius: 999,
        backgroundColor: 'white',
      },
    });
  }, [colors.border, windowHeight]);

  return (
    <SafeAreaView style={styles.flexContainer}>
      <GestureHandlerRootView style={styles.flexContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.logoContainer}>
          <Logo width={windowHeight * 0.08} height={windowHeight * 0.08} />
        </View>
        {currentShowInfo?.image?.data.attributes.url ? (
          <View style={[styles.flexContainer, styles.posterCarouselContainer]}>
            <View style={styles.liveNowTextContainer}>
              <View style={styles.liveNowDot} />
              <Text style={styles.liveNowText}>Live now</Text>
            </View>
            <TouchableHighlight onPress={() => setShowInfoModalVisible(true)}>
              <>
                <Image
                  style={styles.liveNowImage}
                  source={{uri: currentShowInfo?.image.data.attributes.url}}
                />
                <View style={styles.liveNowImageInfoContainer}>
                  <Icon name="infocirlceo" color="black" size={20} />
                </View>
              </>
            </TouchableHighlight>
          </View>
        ) : null}
        <View style={[styles.flexContainer, styles.posterCarouselContainer]}>
          <PosterCarousel
            height={
              currentShowInfo?.image?.data.attributes.url
                ? windowHeight * 0.4
                : windowHeight * 0.5
            }
          />
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}
