import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import TrackPlayer, {
  useTrackPlayerEvents,
  Event as TrackPlayerEvent,
  State as TrackPlayerState,
} from 'react-native-track-player';
import {useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';

import {AppContext} from '../AppContext';
import {placeholderArtworkUrl} from '../features/media-player/constants';
import Text from './Text';
import {StrapiEntryResponse} from '../utils/strapi';

const airtimeStreamUrl =
  'https://dublindigitalradio.out.airtime.pro/dublindigitalradio_a';
const defaultLiveEventStreamUrl =
  'https://stream2.dublindigitalradio.com:8001/stream';

type ButtonStatus = 'play' | 'pause' | 'loading';

function getIconFromPlaybackState(buttonStatus: ButtonStatus) {
  if (buttonStatus === 'play') {
    return 'play';
  }

  if (buttonStatus === 'loading') {
    return 'ellipsis1';
  }

  return 'pausecircle';
}

interface LiveStreamEventData {
  Title: string;
  description: string;
  playerEnabled: boolean;
  url?: string;
}

export default function PlayBar() {
  const {currentShowTitle, currentShowInfo, setShowInfoModalVisible} =
    useContext(AppContext);
  const [airtimeStreamButtonStatus, setAirtimeStreamButtonStatus] =
    useState<ButtonStatus>('play');
  const [liveEventStreamButtonStatus, setLiveEventStreamButtonStatus] =
    useState<ButtonStatus>('play');
  const [liveEventStreamData, setLiveEventStreamData] = useState<
    LiveStreamEventData | undefined
  >();

  const {colors} = useTheme();

  const fetchAndSetLiveEventStreamData = useCallback(async () => {
    const liveEventStream = await fetch(
      'https://ddr-cms.fly.dev/api/live-stream-config',
    )
      .then(response => response.json())
      .then(response => response as StrapiEntryResponse<LiveStreamEventData>)
      .then(response => response.data?.attributes);

    if (
      liveEventStream &&
      !liveEventStream.playerEnabled &&
      liveEventStreamButtonStatus === 'pause'
    ) {
      TrackPlayer.pause();
    }
    setLiveEventStreamData(liveEventStream);
  }, [liveEventStreamButtonStatus]);

  useEffect(() => {
    fetchAndSetLiveEventStreamData();
    const intervalId = setInterval(fetchAndSetLiveEventStreamData, 60000);

    return () => clearInterval(intervalId);
  }, [fetchAndSetLiveEventStreamData]);

  useTrackPlayerEvents([TrackPlayerEvent.PlaybackState], async event => {
    const activeTrack = await TrackPlayer.getActiveTrack();
    if (event.type === TrackPlayerEvent.PlaybackState) {
      if (event.state === TrackPlayerState.Playing) {
        if (activeTrack?.url === airtimeStreamUrl) {
          setAirtimeStreamButtonStatus('pause');
          setLiveEventStreamButtonStatus('play');
        }

        if (
          activeTrack?.url === liveEventStreamData?.url ||
          activeTrack?.url === defaultLiveEventStreamUrl
        ) {
          setAirtimeStreamButtonStatus('play');
          setLiveEventStreamButtonStatus('pause');
        }
      }

      if (event.state === TrackPlayerState.Paused) {
        setAirtimeStreamButtonStatus('play');
        setLiveEventStreamButtonStatus('play');
      }

      if (event.state === TrackPlayerState.Loading) {
        if (activeTrack?.url === airtimeStreamUrl) {
          setAirtimeStreamButtonStatus('loading');
        }

        if (
          activeTrack?.url === liveEventStreamData?.url ||
          activeTrack?.url === defaultLiveEventStreamUrl
        ) {
          setLiveEventStreamButtonStatus('loading');
        }
      }
    }
  });

  const toggleStream = useCallback(
    async ({
      streamUrl,
      title,
      artworkUrl,
    }: {
      streamUrl: string;
      title: string;
      artworkUrl: string;
    }) => {
      const activeTrack = await TrackPlayer.getActiveTrack();
      const {state} = await TrackPlayer.getPlaybackState();
      if (state === TrackPlayerState.None) {
        await TrackPlayer.add({
          url: streamUrl,
          title,
          artist: 'DDR',
          artwork: artworkUrl,
        });
        await TrackPlayer.play();
      } else {
        if (
          state === TrackPlayerState.Playing ||
          state === TrackPlayerState.Loading ||
          state === TrackPlayerState.Error
        ) {
          if (activeTrack?.url === streamUrl) {
            await TrackPlayer.pause();
          } else {
            await TrackPlayer.reset();
            await TrackPlayer.add({
              url: streamUrl,
              title,
              artist: 'DDR',
              artwork: artworkUrl,
            });
            await TrackPlayer.play();
          }
        }

        if (state === TrackPlayerState.Paused) {
          await TrackPlayer.reset();
          await TrackPlayer.add({
            url: streamUrl,
            title,
            artist: 'DDR',
            artwork: artworkUrl,
          });
          await TrackPlayer.play();
        }
      }
    },
    [],
  );

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
          flex: 1,
        },
        showTitleContainer: {
          flex: 1,
        },
        showTitleText: {
          textTransform: 'uppercase',
        },
        showInfoButton: {
          marginLeft: 8,
        },
      }),
    [colors.background, colors.border, colors.text],
  );

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() =>
            toggleStream({
              streamUrl: airtimeStreamUrl,
              title: currentShowTitle,
              artworkUrl:
                currentShowInfo?.image?.data?.attributes.url ??
                placeholderArtworkUrl,
            })
          }>
          <Icon
            name={getIconFromPlaybackState(airtimeStreamButtonStatus)}
            size={40}
            style={styles.iconButton}
          />
        </TouchableOpacity>
        <View style={styles.infoContainer}>
          <View style={styles.showTitleContainer}>
            <Text numberOfLines={2} style={styles.showTitleText}>
              Live now: {currentShowTitle}
            </Text>
          </View>
          {currentShowTitle !== '...' && currentShowInfo ? (
            <View>
              <TouchableOpacity
                style={styles.showInfoButton}
                onPress={() => setShowInfoModalVisible(true)}>
                <Icon name="infocirlceo" size={20} style={styles.iconButton} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
      {liveEventStreamData && liveEventStreamData.playerEnabled ? (
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => {
              toggleStream({
                streamUrl: liveEventStreamData.url ?? defaultLiveEventStreamUrl,
                title: liveEventStreamData.Title,
                artworkUrl: placeholderArtworkUrl,
              });
            }}>
            <Icon
              name={getIconFromPlaybackState(liveEventStreamButtonStatus)}
              size={40}
              style={styles.iconButton}
            />
          </TouchableOpacity>
          <View style={styles.infoContainer}>
            <View style={styles.showTitleContainer}>
              <Text numberOfLines={2} style={styles.showTitleText}>
                Live now: {liveEventStreamData.Title}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </>
  );
}
