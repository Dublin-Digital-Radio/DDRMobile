import React, {useContext, useMemo} from 'react';
import {Linking, StyleSheet, TouchableOpacity, View} from 'react-native';
import {DefaultTheme} from '@react-navigation/native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/AntDesign';

import {AppContext} from '../../AppContext';
import Text from '../../components/Text';

function getShowInstagramUrl(handle: string) {
  const normalizedHandle = handle.startsWith('@')
    ? handle.substring(1)
    : handle;
  return `https://instagram.com/${normalizedHandle}`;
}

export default function ShowInfoModal() {
  const {currentShowInfo, showInfoModalVisible, setShowInfoModalVisible} =
    useContext(AppContext);

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
              Linking.openURL(getShowInstagramUrl(currentShowInfo.instagram))
            }
            style={styles.showInfoSocialContainer}>
            <Icon name="instagram" color={DefaultTheme.colors.text} />
            <Text style={[styles.showInfoText, styles.showInfoSocialHandle]}>
              {currentShowInfo.instagram}
            </Text>
          </TouchableOpacity>
        ) : null}
        {currentShowInfo?.twitter ? (
          <TouchableOpacity
            onPress={() =>
              currentShowInfo.twitter &&
              Linking.openURL(`https://twitter.com/${currentShowInfo.twitter}`)
            }
            style={styles.showInfoSocialContainer}>
            <Icon name="twitter" color={DefaultTheme.colors.text} />
            <Text style={[styles.showInfoText, styles.showInfoSocialHandle]}>
              {currentShowInfo.twitter}
            </Text>
          </TouchableOpacity>
        ) : null}

        <Text style={[styles.showInfoText, styles.showInfoTagline]}>
          {currentShowInfo?.tagline}
        </Text>
      </View>
    </Modal>
  );
}
