import React, {useMemo} from 'react';
import {
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import {useTheme} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';

import Text from '../components/Text';
import {discordOnWebsiteUrl} from '../features/chat/constants';
import {useFetchDiscordInviteUrl} from '../features/chat/useFetchDiscordInviteUrl';

const appDownloadUrl =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/us/app/discord-chat-for-games/id985746746'
    : 'https://play.google.com/store/apps/details?id=com.discord';

export default function ChatScreen() {
  const {colors} = useTheme();
  const {discordInviteUrl, discordInviteDeepLinkUri} =
    useFetchDiscordInviteUrl();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        rootView: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        horizontalContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        text: {
          fontSize: 24,
        },
        link: {
          color: colors.primary,
        },
        wayToJoinContainer: {
          width: '90%',
          marginBottom: 20,
        },
      }),
    [colors.primary],
  );

  return (
    <SafeAreaView style={styles.rootView}>
      {discordInviteUrl && discordInviteDeepLinkUri ? (
        <>
          <View style={styles.wayToJoinContainer}>
            <Text style={styles.text}>Join the ddr chat on Discord</Text>
            <View style={styles.horizontalContainer}>
              <Text style={styles.text}>1. </Text>
              <Pressable onPress={() => Linking.openURL(appDownloadUrl)}>
                <Text style={[styles.text, styles.link]}>Download Discord</Text>
              </Pressable>
            </View>
            <View style={styles.horizontalContainer}>
              <Text style={styles.text}>2. </Text>
              <Pressable
                onPress={() => {
                  Linking.canOpenURL(discordInviteDeepLinkUri)
                    .then(() => Linking.openURL(discordInviteDeepLinkUri))
                    .catch(() => Linking.openURL(discordInviteUrl));
                }}>
                <Text style={[styles.text, styles.link]}>
                  Accept the invite
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.wayToJoinContainer}>
            <Text style={styles.text}>Or</Text>
          </View>
        </>
      ) : null}
      <View style={styles.wayToJoinContainer}>
        <View style={styles.horizontalContainer}>
          <Text style={styles.text}>Join us on the </Text>
          <Pressable onPress={() => Linking.openURL(discordOnWebsiteUrl)}>
            <Text style={[styles.text, styles.link]}>
              website <Icon name="link" size={20} />
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
