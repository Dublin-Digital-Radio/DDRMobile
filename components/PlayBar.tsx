import React, {useCallback, useContext, useMemo, useState} from 'react';
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

const streamUrl =
  'https://dublindigitalradio.out.airtime.pro/dublindigitalradio_a';

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

export default function PlayBar() {
  const {currentShowTitle, currentShowInfo, setShowInfoModalVisible} =
    useContext(AppContext);
  const [buttonStatus, setButtonStatus] = useState<ButtonStatus>('play');

  const {colors} = useTheme();

  useTrackPlayerEvents([TrackPlayerEvent.PlaybackState], event => {
    if (event.type === TrackPlayerEvent.PlaybackState) {
      if (event.state === TrackPlayerState.Playing) {
        setButtonStatus('pause');
      }

      if (event.state === TrackPlayerState.Paused) {
        setButtonStatus('play');
      }

      if (event.state === TrackPlayerState.Loading) {
        setButtonStatus('loading');
      }
    }
  });

  const toggleStream = useCallback(async () => {
    const {state} = await TrackPlayer.getPlaybackState();
    if (state === TrackPlayerState.None) {
      await TrackPlayer.add({
        url: streamUrl,
        title: currentShowTitle,
        artist: 'DDR',
        artwork:
          currentShowInfo?.image?.data?.attributes.url ?? placeholderArtworkUrl,
      });
      await TrackPlayer.play();
    } else {
      if (state === TrackPlayerState.Playing) {
        await TrackPlayer.pause();
      }

      if (state === TrackPlayerState.Paused) {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          url: streamUrl,
          title: currentShowTitle,
          artist: 'DDR',
          artwork:
            currentShowInfo?.image?.data?.attributes.url ??
            placeholderArtworkUrl,
        });
        await TrackPlayer.play();
      }
    }
  }, [currentShowInfo?.image?.data?.attributes.url, currentShowTitle]);

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
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleStream}>
        <Icon
          name={getIconFromPlaybackState(buttonStatus)}
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
  );
}
