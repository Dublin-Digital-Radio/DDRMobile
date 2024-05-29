import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {DefaultTheme} from '@react-navigation/native';
import Modal from 'react-native-modal';

import Text from '../../components/Text';
import {LiveStreamEventData} from './types';

export function LiveEventStreamInfoModal({
  data,
  isVisible,
  setIsVisible,
}: {
  data: LiveStreamEventData;
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
}) {
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
          fontFamily: 'Chivo-Bold',
          fontSize: 24,
          textTransform: 'uppercase',
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
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => setIsVisible(false)}
      onSwipeComplete={() => setIsVisible(false)}
      swipeDirection="down">
      <View style={styles.showInfoModal}>
        <Text style={[styles.showInfoText, styles.showInfoName]}>
          {data.Title}
        </Text>
        <Text style={[styles.showInfoText, styles.showInfoTagline]}>
          {data.description}
        </Text>
      </View>
    </Modal>
  );
}
