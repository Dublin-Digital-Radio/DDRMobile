import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {AppState, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import TrackPlayer, {
  useTrackPlayerEvents,
  Capability as TrackPlayerCapability,
  Event as TrackPlayerEvent,
  State as TrackPlayerState,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';
import {useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';

import {AppContext} from '../AppContext';
import {
  convertAirtimeToCmsShowName,
  fetchShowInfo,
  getShows,
} from '../features/shows/api';

const streamUrl =
  'https://dublindigitalradio.out.airtime.pro/dublindigitalradio_a';

export default function PlayBar() {
  const {currentShowInfo, setCurrentShowInfo, setShowInfoModalVisible} =
    useContext(AppContext);
  const [buttonStatus, setButtonStatus] = useState<
    'play' | 'pause' | 'loading1'
  >('play');
  const [currentShowTitle, setCurrentShowTitle] = useState('...');
  const {colors} = useTheme();

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
        artwork: showInfo?.image?.data.attributes.url ?? undefined,
      });
    }
  }, [setCurrentShowInfo]);

  useEffect(() => {
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
  }, [refreshTrackData]);

  useTrackPlayerEvents([TrackPlayerEvent.PlaybackState], event => {
    if (event.type === TrackPlayerEvent.PlaybackState) {
      if (event.state === TrackPlayerState.Playing) {
        setButtonStatus('pause');
      }

      if (event.state === TrackPlayerState.Paused) {
        setButtonStatus('play');
      }
    }
  });

  const toggleStream = useCallback(async () => {
    const playerState = await TrackPlayer.getState();
    if (playerState === TrackPlayerState.None) {
      await TrackPlayer.add({
        url: streamUrl,
        title: currentShowTitle,
        artist: 'DDR',
        artwork: currentShowInfo?.image?.data.attributes.url ?? undefined,
      });
      await TrackPlayer.play();
      setButtonStatus('pause');
    } else {
      if (playerState === TrackPlayerState.Playing) {
        await TrackPlayer.pause();
        setButtonStatus('play');
      }

      if (playerState === TrackPlayerState.Paused) {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          url: streamUrl,
          title: currentShowTitle,
          artist: 'DDR',
          artwork: currentShowInfo?.image?.data.attributes.url ?? undefined,
        });
        await TrackPlayer.play();
        setButtonStatus('pause');
      }
    }
  }, [currentShowInfo?.image?.data.attributes.url, currentShowTitle]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderTopWidth: 2,
          paddingHorizontal: 8,
          paddingVertical: 4,
          flexDirection: 'row',
        },
        iconButton: {
          color: colors.text,
        },
        infoContainer: {
          alignSelf: 'center',
          alignItems: 'center',
          marginLeft: 12,
          flexDirection: 'row',
        },
        liveNow: {
          color: colors.text,
        },
        showInfoButton: {
          marginLeft: 8,
        },
      }),
    [colors.background, colors.border, colors.text],
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleStream}>
        <Icon
          name={buttonStatus === 'play' ? 'play' : 'pausecircle'}
          size={40}
          style={styles.iconButton}
        />
      </TouchableOpacity>
      <View style={styles.infoContainer}>
        <Text style={styles.liveNow}>Live now: {currentShowTitle}</Text>
        {currentShowTitle !== '...' && currentShowInfo ? (
          <TouchableOpacity
            style={styles.showInfoButton}
            onPress={() => setShowInfoModalVisible(true)}>
            <Icon name="infocirlceo" size={20} style={styles.iconButton} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
