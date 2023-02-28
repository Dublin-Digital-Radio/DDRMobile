import React, {useCallback, useEffect, useState} from 'react';
import {AppState, useColorScheme} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {
  createBottomTabNavigator,
  BottomTabBar,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/AntDesign';
import TrackPlayer, {
  Capability as TrackPlayerCapability,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';

import {AppContext} from './AppContext';
import {
  convertAirtimeToCmsShowName,
  fetchShowInfo,
  getShows,
} from './features/shows/api';
import PlayBar from './components/PlayBar';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import {ShowInfo} from './features/shows/types';
import ShowInfoModal from './features/shows/ShowInfoModal';
import {placeholderArtworkUrl} from './features/media-player/constants';

const Tab = createBottomTabNavigator();

function CustomBottomTabBar(props: BottomTabBarProps) {
  return (
    <>
      <PlayBar />
      <BottomTabBar {...props} />
    </>
  );
}

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [currentShowTitle, setCurrentShowTitle] = useState('...');
  const [currentShowInfo, setCurrentShowInfo] = useState<ShowInfo>();
  const [showInfoModalVisible, setShowInfoModalVisible] = useState(false);
  const refreshTrackData = useCallback(async () => {
    const shows = await getShows();
    setCurrentShowTitle(shows.current.name);

    const cmsShowName = convertAirtimeToCmsShowName(shows.current.name);

    const showInfo = await fetchShowInfo(cmsShowName);
    setCurrentShowInfo(showInfo);

    const currentTrack = await TrackPlayer.getTrack(0);
    if (currentTrack !== null) {
      TrackPlayer.updateMetadataForTrack(0, {
        title: shows.current.name,
        artist: 'DDR',
        // Todo: Add placeholder artwork
        artwork: showInfo?.image?.data.attributes.url ?? placeholderArtworkUrl,
      });
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await TrackPlayer.setupPlayer();
      } catch (error) {
        if (
          error instanceof Error &&
          // Ignore this error when reloading the app often during development
          error.message !==
            'The player has already been initialized via setupPlayer.'
        ) {
          console.error(error);
        }
      }

      TrackPlayer.updateOptions({
        capabilities: [TrackPlayerCapability.Play, TrackPlayerCapability.Pause],

        compactCapabilities: [
          TrackPlayerCapability.Play,
          TrackPlayerCapability.Pause,
        ],

        android: {
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
      });

      await refreshTrackData();
    })();

    const appStateSubscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (nextAppState === 'active') {
          await refreshTrackData();
        }
      },
    );

    return () => appStateSubscription.remove();
  }, [refreshTrackData]);

  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <AppContext.Provider
        value={{
          currentShowTitle,
          setCurrentShowTitle,
          currentShowInfo,
          setCurrentShowInfo,
          refreshTrackData,
          showInfoModalVisible,
          setShowInfoModalVisible,
        }}>
        <ShowInfoModal />
        <Tab.Navigator
          tabBar={CustomBottomTabBar}
          screenOptions={({route}) => ({
            headerShown: false,
            // Below is the maintainer's recommended way to define tabBarIcon
            // eslint-disable-next-line react/no-unstable-nested-components
            tabBarIcon: ({color, size}) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = 'home';
              }

              if (route.name === 'Schedule') {
                iconName = 'calendar';
              }

              return iconName ? (
                <Icon name={iconName} size={size} color={color} />
              ) : null;
            },
            tabBarActiveTintColor: isDarkMode ? 'white' : 'black',
            tabBarInactiveTintColor: 'gray',
          })}>
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Schedule" component={ScheduleScreen} />
        </Tab.Navigator>
      </AppContext.Provider>
    </NavigationContainer>
  );
}

export default App;
