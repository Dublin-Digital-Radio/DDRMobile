import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

import PlayBar from './components/PlayBar';

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaView style={styles.flexContainer}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.flexContainer} />
      <View>
        <PlayBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
});

export default App;
