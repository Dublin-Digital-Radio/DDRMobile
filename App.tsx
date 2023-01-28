import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import PosterCarousel from './components/PosterCarousel';
import PlayBar from './components/PlayBar';

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={styles.flexContainer}>
      <GestureHandlerRootView style={styles.flexContainer}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={[styles.flexContainer, styles.posterCarouselContainer]}>
          <PosterCarousel />
        </View>
        <View>
          <PlayBar />
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  posterCarouselContainer: {
    justifyContent: 'center',
  },
});

export default App;
