import React, {useMemo, useState} from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
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
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/AntDesign';

import {AppContext} from './AppContext';
import PlayBar from './components/PlayBar';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import {ShowInfo} from './features/shows/types';

function getShowInstagramUrl(handle: string) {
  const normalizedHandle = handle.startsWith('@')
    ? handle.substring(1)
    : handle;
  return `https://instagram.com/${normalizedHandle}`;
}

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
  const [currentShowInfo, setCurrentShowInfo] = useState<ShowInfo>();
  const [showInfoModalVisible, setShowInfoModalVisible] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        showInfoModal: {
          backgroundColor: DefaultTheme.colors.background,
          padding: 16,
          borderRadius: 8,
        },
        showInfoText: {
          color: DefaultTheme.colors.text,
        },
        showInfoName: {
          fontSize: 24,
          fontWeight: 'bold',
        },
        showInfoSocialContainer: {flexDirection: 'row', alignItems: 'center'},
        showInfoSocialHandle: {
          marginLeft: 2,
          textDecorationLine: 'underline',
        },
        showInfoTagline: {
          marginTop: 16,
        },
      }),
    [],
  );

  return (
    <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <AppContext.Provider
        value={{
          currentShowInfo,
          setCurrentShowInfo,
          showInfoModalVisible,
          setShowInfoModalVisible,
        }}>
        <Modal
          isVisible={showInfoModalVisible}
          onBackdropPress={() => setShowInfoModalVisible(false)}>
          <View style={styles.showInfoModal}>
            <Text style={[styles.showInfoText, styles.showInfoName]}>
              {currentShowInfo?.name}
            </Text>
            {currentShowInfo?.instagram ? (
              <TouchableOpacity
                onPress={() =>
                  currentShowInfo.instagram &&
                  Linking.openURL(
                    getShowInstagramUrl(currentShowInfo.instagram),
                  )
                }
                style={styles.showInfoSocialContainer}>
                <Icon name="instagram" />
                <Text style={styles.showInfoSocialHandle}>
                  {currentShowInfo.instagram}
                </Text>
              </TouchableOpacity>
            ) : null}
            {currentShowInfo?.twitter ? (
              <TouchableOpacity
                onPress={() =>
                  currentShowInfo.twitter &&
                  Linking.openURL(
                    `https://twitter.com/${currentShowInfo.twitter}`,
                  )
                }
                style={styles.showInfoSocialContainer}>
                <Icon name="twitter" />
                <Text style={styles.showInfoSocialHandle}>
                  {currentShowInfo.twitter}
                </Text>
              </TouchableOpacity>
            ) : null}

            <Text style={[styles.showInfoText, styles.showInfoTagline]}>
              {currentShowInfo?.tagline}
            </Text>
          </View>
        </Modal>
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
