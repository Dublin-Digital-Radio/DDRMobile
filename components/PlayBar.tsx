import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AppState, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import TrackPlayer, {
  useTrackPlayerEvents,
  Capability as TrackPlayerCapability,
  Event as TrackPlayerEvent,
  State as TrackPlayerState,
} from 'react-native-track-player';
import {DefaultTheme, useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';
import Modal from 'react-native-modal';
// The airtime library doesn't have type declarations yet.
// @ts-expect-error
import airtime from 'airtime-pro-api';

import {StrapiEntryListResponse} from '../utils/strapi';

interface ShowInfo {
  name: string;
  tagline: string;
}

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

async function fetchShowInfo(showName: string) {
  return await fetch(
    `https://ddr-cms.fly.dev/api/shows?filters[name][$eqi]=${showName}`,
  )
    .then(response => response.json())
    .then(
      showInfoResponse => showInfoResponse as StrapiEntryListResponse<ShowInfo>,
    )
    .then(showInfoResponse => showInfoResponse.data)
    .then(
      showInfoEntries => showInfoEntries[0] && showInfoEntries[0].attributes,
    );
}

function convertAirtimeToCmsShowName(airtimeShowName: string) {
  const trimmedAirtimeShowName = airtimeShowName
    ? decodeURIComponent(airtimeShowName)
        .split('|')
        .map(showNameFragment => showNameFragment.trim())[0]
    : '';

  return (trimmedAirtimeShowName ?? '').replace(/\s*\(R\)/, '');
}

export default function PlayBar() {
  const [buttonStatus, setButtonStatus] = useState<
    'play' | 'pause' | 'loading1'
  >('play');
  const [currentShowTitle, setCurrentShowTitle] = useState('...');
  const [showInfoModalVisible, setShowInfoModalVisible] = useState(false);
  const [currentShowInfo, setCurrentShowInfo] = useState<ShowInfo>();
  const {colors} = useTheme();

  const refreshTrackData = useCallback(async () => {
    const shows = await getShows();
    setCurrentShowTitle(shows.current.name);

    const cmsShowName = convertAirtimeToCmsShowName(shows.current.name);

    const showInfo = await fetchShowInfo(cmsShowName);
    setCurrentShowInfo(showInfo);

    const currentTrack = await TrackPlayer.getCurrentTrack();
    if (currentTrack !== null) {
      TrackPlayer.updateMetadataForTrack(currentTrack, {
        title: shows.current.name,
        artist: 'DDR',
      });
    }
  }, []);

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderTopWidth: 2,
          padding: 8,
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
        showInfoTagline: {
          marginTop: 16,
        },
      }),
    [colors.background, colors.border, colors.text],
  );

  return (
    <View style={styles.container}>
      <Modal
        isVisible={showInfoModalVisible}
        onBackdropPress={() => setShowInfoModalVisible(false)}>
        <View style={styles.showInfoModal}>
          <Text style={[styles.showInfoText, styles.showInfoName]}>
            {currentShowInfo?.name}
          </Text>
          <Text style={[styles.showInfoText, styles.showInfoTagline]}>
            {currentShowInfo?.tagline}
          </Text>
        </View>
      </Modal>
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
