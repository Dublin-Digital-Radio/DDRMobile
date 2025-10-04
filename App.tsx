import React, {useCallback, useEffect, useState} from 'react';
import {
  AppState,
  Linking,
  Platform,
  Pressable,
  useColorScheme,
  View,
} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  createBottomTabNavigator,
  BottomTabBar,
  BottomTabBarProps,
  BottomTabBarButtonProps,
} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/AntDesign';
import TrackPlayer, {
  Capability as TrackPlayerCapability,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';
import semver from 'semver';

import {version as currentVersion} from './package.json';

import Logo from './assets/logo.svg';
import {AppContext} from './AppContext';
import {
  convertRadioCultToCmsShowName,
  fetchShowInfo,
  fetchRadioCultLiveShow,
} from './features/shows/api';
import PlayBar from './components/PlayBar';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import {ShowInfo} from './features/shows/types';
import ShowInfoModal from './features/shows/ShowInfoModal';
import {placeholderArtworkUrl} from './features/media-player/constants';
import ChatScreen from './screens/ChatScreen';
import {useFetchDiscordInviteUrl} from './features/chat/useFetchDiscordInviteUrl';
import {DDR_CMS_URL} from '@env';
import {StrapiEntryResponse} from './utils/strapi';
import Text from './components/Text';

interface Config {
  minMobileAppVersion: string | undefined;
}

const discordOnWebsiteUrl = 'https://listen.dublindigitalradio.com/chat-box';
const appStoreListingUrl =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/app/dublin-digital-radio/id1673127527'
    : Platform.OS === 'android'
    ? 'https://play.google.com/store/apps/details?id=com.dublindigitalradio.ddrmobile'
    : undefined;

const Tab = createBottomTabNavigator();

function CustomBottomTabBar(props: BottomTabBarProps) {
  return (
    <>
      <PlayBar />
      <BottomTabBar {...props} />
    </>
  );
}

function HomeTabIcon({size}: {size: number}) {
  return <Logo width={size} height={size} />;
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [config, setConfig] = useState<Config>();
  const {discordInviteUrl, discordInviteDeepLinkUri} =
    useFetchDiscordInviteUrl();
  const [currentShowTitle, setCurrentShowTitle] = useState('...');
  const [currentShowInfo, setCurrentShowInfo] = useState<ShowInfo>();
  const [showInfoModalVisible, setShowInfoModalVisible] = useState(false);

  const fetchConfig = useCallback(() => {
    return fetch(`${DDR_CMS_URL}/config`)
      .then(response => response.json())
      .then(
        response => (response as StrapiEntryResponse<Config>).data?.attributes,
      );
  }, []);

  useEffect(() => {
    (async () => {
      const fetchedConfig = await fetchConfig();
      setConfig(fetchedConfig);
    })();
  }, [fetchConfig]);

  const refreshTrackData = useCallback(async () => {
    const liveShow = await fetchRadioCultLiveShow();
    if (liveShow) {
      setCurrentShowTitle(liveShow.title);
      const cmsShowName = convertRadioCultToCmsShowName(liveShow.title);
      const showInfo = await fetchShowInfo(cmsShowName);
      setCurrentShowInfo(showInfo);
      const currentTrack = await TrackPlayer.getTrack(0);
      if (currentTrack !== null) {
        TrackPlayer.updateMetadataForTrack(0, {
          title: liveShow.title,
          artist: 'DDR',
          artwork:
            showInfo?.image?.data?.attributes.url ?? placeholderArtworkUrl,
        });
      }
    }
  }, []);

  const chatTabBarButtonFactory = useCallback(
    (navigation: {navigate: (screenName: string) => void}) => {
      return (props: BottomTabBarButtonProps) => {
        if (!discordInviteUrl || !discordInviteDeepLinkUri) {
          /*
           * In this case, the API endpoint is broken somehow
           * and we cannot get the invite URL, fall back to the website
           */
          return (
            <Pressable
              {...props}
              onPress={() => {
                Linking.openURL(discordOnWebsiteUrl);
              }}
            />
          );
        }

        return (
          <Pressable
            {...props}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Linking.canOpenURL(discordInviteDeepLinkUri)
                  .then(() => {
                    return Linking.openURL(discordInviteDeepLinkUri);
                  })
                  .catch(() => {
                    navigation.navigate('Chat');
                  });
              } else {
                // Android doesn't seem to be able to handle the discord:// scheme.
                Linking.canOpenURL(discordInviteUrl)
                  .then(() => {
                    Linking.openURL(discordInviteUrl);
                  })
                  .catch(() => {
                    navigation.navigate('Chat');
                  });
              }
            }}
          />
        );
      };
    },
    [discordInviteDeepLinkUri, discordInviteUrl],
  );

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

  if (!config) {
    return null;
  }

  console.log({'config.minMobileAppVersion': config.minMobileAppVersion});

  if (
    config.minMobileAppVersion &&
    semver.valid(config.minMobileAppVersion) &&
    semver.lt(currentVersion, config.minMobileAppVersion)
  ) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            display: 'flex',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View style={{marginBottom: 12}}>
            <Text style={{fontSize: 20, color: isDarkMode ? 'white' : 'black'}}>
              Your app version is out of date.
            </Text>
          </View>
          {appStoreListingUrl ? (
            <View>
              <Pressable
                onPress={() => {
                  Linking.openURL(appStoreListingUrl);
                }}>
                <Text
                  style={{
                    fontSize: 20,
                    color: isDarkMode ? 'white' : 'black',
                    textDecorationLine: 'underline',
                    textDecorationStyle: 'solid',
                  }}>
                  UPDATE
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
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

                if (route.name === 'Chat') {
                  iconName = 'wechat';
                }

                return iconName ? (
                  <Icon name={iconName} size={size} color={color} />
                ) : null;
              },
              tabBarActiveTintColor: isDarkMode ? 'white' : 'black',
              tabBarInactiveTintColor: 'gray',
              tabBarLabelStyle: {
                fontFamily: 'Chivo-Regular',
                textTransform: 'uppercase',
              },
            })}>
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{
                tabBarIcon: HomeTabIcon,
              }}
            />
            <Tab.Screen name="Schedule" component={ScheduleScreen} />
            <Tab.Screen
              name="Chat"
              component={ChatScreen}
              options={({navigation}) => ({
                tabBarButton: chatTabBarButtonFactory(navigation),
              })}
            />
          </Tab.Navigator>
        </AppContext.Provider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
