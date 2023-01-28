import React, {useCallback, useEffect, useState} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import TrackPlayer, {
  State as TrackPlayerState,
  Capability as TrackPlayerCapability,
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
      await TrackPlayer.setupPlayer();
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
        await TrackPlayer.reset();
        setButtonStatus('play');
      }

      if (playerState === TrackPlayerState.Paused) {
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
