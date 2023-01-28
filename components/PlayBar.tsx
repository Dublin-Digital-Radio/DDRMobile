import React, {useCallback, useEffect, useState} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import TrackPlayer, {
  useTrackPlayerEvents,
  Capability as TrackPlayerCapability,
  Event as TrackPlayerEvent,
  State as TrackPlayerState,
} from 'react-native-track-player';
import airtime from 'airtime-pro-api';

const streamUrl =
  'https://dublindigitalradio.out.airtime.pro/dublindigitalradio_a';

async function getShows() {
  const ddrAirtime = airtime.init({stationName: 'dublindigitalradio'});
  try {
    const res = await ddrAirtime.liveInfoV2();
    return res.shows;
  } catch (err: any) {
    return;
  }
}

export default function PlayBar() {
  const [buttonStatus, setButtonStatus] = useState<
    'play' | 'pause' | 'loading1'
  >('play');
  const [currentShowTitle, setCurrentShowTitle] = useState('...');

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
      });
      const shows = await getShows();
      setCurrentShowTitle(shows.current.name);
    })();
  }, []);

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
        });
        await TrackPlayer.play();
        setButtonStatus('pause');
      }
    }
  }, [currentShowTitle]);

  return (
    <View style={styles.container}>
      <Button title={buttonStatus} color="black" onPress={toggleStream} />
      <View style={styles.infoContainer}>
        <Text>Live now: {currentShowTitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: 'black',
    borderTopWidth: 2,
    padding: 8,
    flexDirection: 'row',
  },
  infoContainer: {
    alignSelf: 'center',
    marginLeft: 12,
  },
});
