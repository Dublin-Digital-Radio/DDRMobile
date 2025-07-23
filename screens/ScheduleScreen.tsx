import {RADIO_CULT_PUBLIC_API_KEY} from '@env';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  AppState,
  Button,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  useColorScheme,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {openSettings} from 'react-native-permissions';
import Icon from 'react-native-vector-icons/AntDesign';
import {z} from 'zod';
import {
  add,
  format,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  isEqual,
  sub,
} from 'date-fns';
import {DefaultTheme, useFocusEffect, useTheme} from '@react-navigation/native';

import Text from '../components/Text';
import {decodeRadioCultShowName} from '../features/shows/api';
import Modal from 'react-native-modal';
import notifee, {
  AlarmType,
  AndroidNotificationSetting,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';

interface ReminderContext {
  triggerNotificationIds: string[] | undefined;
  setTriggerNotificationIds: React.Dispatch<
    React.SetStateAction<string[] | undefined>
  >;
  refreshTriggerNotificationIds: () => Promise<void>;
  reminderModalShow: Show | undefined;
  setReminderModalShow: React.Dispatch<React.SetStateAction<Show | undefined>>;
}

const ReminderContext = createContext<ReminderContext>({
  triggerNotificationIds: undefined,
  setTriggerNotificationIds: () => {},
  refreshTriggerNotificationIds: () => new Promise(resolve => resolve()),
  reminderModalShow: undefined,
  setReminderModalShow: () => {},
});

interface Show {
  name: string;
  start_timestamp: string;
  end_timestamp: string;
}

interface WeekSchedule {
  dayName: string;
  shows: Show[];
}

function getTriggerNotificationId(show: Show) {
  return `${show.name} ${show.start_timestamp}`;
}

function getDefaultReminderDateTime(timestamp: string) {
  return sub(new Date(timestamp), {minutes: 10});
}

function ScheduleDayRow({
  show,
  isLiveShow = false,
}: {
  show: Show;
  isLiveShow?: boolean;
}) {
  const {colors} = useTheme();
  const isDarkMode = useColorScheme() === 'dark';
  const {triggerNotificationIds, setReminderModalShow} =
    useContext(ReminderContext);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scheduleDayContainer: {
          flexDirection: 'row',
          paddingVertical: 8,
          borderBottomWidth: 2,
          borderBottomColor: colors.border,
        },
        showTimeCell: {
          flex: 1,
        },
        showNameCell: {
          flex: 2,
        },
        actionsCell: {
          width: 30,
        },
        isLiveShow: {
          fontFamily: 'Chivo-Bold',
          color: colors.primary,
        },
      }),
    [colors.border, colors.primary],
  );

  const hasReminder = triggerNotificationIds?.includes(
    getTriggerNotificationId(show),
  );

  const canSetReminder =
    isAfter(getDefaultReminderDateTime(show.start_timestamp), Date.now()) &&
    isBefore(
      getDefaultReminderDateTime(show.start_timestamp),
      add(Date.now(), {hours: 24}),
    );

  return (
    <View style={styles.scheduleDayContainer}>
      <View style={styles.showTimeCell}>
        <Text style={isLiveShow ? styles.isLiveShow : {}}>
          {format(new Date(show.start_timestamp), 'HH:mm')} -{' '}
          {format(new Date(show.end_timestamp), 'HH:mm')}
        </Text>
      </View>
      <View style={styles.showNameCell}>
        <Text style={isLiveShow ? styles.isLiveShow : {}}>
          {decodeRadioCultShowName(show.name)}
        </Text>
      </View>
      <View style={styles.actionsCell}>
        {canSetReminder ? (
          <TouchableHighlight
            onPress={() => {
              setReminderModalShow(show);
            }}>
            <Icon
              name="bells"
              size={20}
              color={hasReminder ? (isDarkMode ? 'white' : 'black') : 'grey'}
            />
          </TouchableHighlight>
        ) : null}
      </View>
    </View>
  );
}

function ShowReminderModal({close}: {close: () => void}) {
  const {
    reminderModalShow,
    triggerNotificationIds,
    refreshTriggerNotificationIds,
  } = useContext(ReminderContext);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modal: {
          backgroundColor: DefaultTheme.colors.background,
          padding: 16,
          borderRadius: 8,
        },
        text: {
          color: DefaultTheme.colors.text,
        },
        title: {
          fontFamily: 'Chivo-Bold',
          fontSize: 24,
          textTransform: 'uppercase',
        },
        buttonsContainer: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 16,
        },
        buttonContainer: {
          flex: 1,
        },
      }),
    [],
  );

  if (!reminderModalShow) {
    return null;
  }

  return (
    <Modal
      isVisible={Boolean(reminderModalShow)}
      onBackdropPress={close}
      onSwipeComplete={close}
      swipeDirection="down">
      <View style={styles.modal}>
        {triggerNotificationIds?.includes(
          getTriggerNotificationId(reminderModalShow),
        ) ? (
          <>
            <Text style={[styles.text, styles.title]}>Reminder</Text>
            <Text style={[styles.text]}>
              You have a reminder for {reminderModalShow.name} at{' '}
              {format(
                getDefaultReminderDateTime(reminderModalShow.start_timestamp),
                'HH:mm',
              )}
              .
            </Text>
            <View style={[styles.buttonsContainer]}>
              <View style={[styles.buttonContainer]}>
                <Button title="OK" onPress={close} />
              </View>
              <View style={[styles.buttonContainer]}>
                <Button
                  title="Remove"
                  onPress={async () => {
                    await notifee.cancelTriggerNotification(
                      getTriggerNotificationId(reminderModalShow),
                    );

                    await refreshTriggerNotificationIds();

                    close();
                  }}
                  color="red"
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.text, styles.title]}>Remind me</Text>
            <Text style={[styles.text]}>
              Set a reminder for {reminderModalShow.name} at{' '}
              {format(
                getDefaultReminderDateTime(reminderModalShow.start_timestamp),
                'HH:mm',
              )}
              ?
            </Text>
            <View style={[styles.buttonsContainer]}>
              <View style={[styles.buttonContainer]}>
                <Button title="Cancel" onPress={close} />
              </View>
              <View style={[styles.buttonContainer]}>
                <Button
                  title="Set reminder"
                  onPress={async () => {
                    const permission = await notifee.requestPermission();
                    if (permission.authorizationStatus) {
                      const notificationSettings =
                        await notifee.getNotificationSettings();

                      if (
                        notificationSettings.android.alarm ===
                        AndroidNotificationSetting.ENABLED
                      ) {
                        const triggerTimestamp = getDefaultReminderDateTime(
                          reminderModalShow.start_timestamp,
                        ).getTime();
                        const trigger: TimestampTrigger = {
                          type: TriggerType.TIMESTAMP,
                          timestamp: triggerTimestamp,
                          alarmManager: {
                            type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
                          },
                        };

                        const channelId = await notifee.createChannel({
                          id: 'ddr',
                          name: 'ddr. show reminder',
                        });

                        await notifee.createTriggerNotification(
                          {
                            id: getTriggerNotificationId(reminderModalShow),
                            title: reminderModalShow.name,
                            body: 'in 10 minutes',
                            android: {
                              channelId,
                              pressAction: {
                                id: 'default',
                              },
                            },
                          },
                          trigger,
                        );

                        await refreshTriggerNotificationIds();
                      } else {
                        Alert.alert(
                          'Alarm permission required',
                          'Open app settings to enable alarms?',
                          [
                            {
                              text: 'Cancel',
                              style: 'cancel',
                            },
                            {
                              text: 'Open settings',
                              style: 'default',
                              onPress: () => {
                                notifee.openAlarmPermissionSettings();
                              },
                            },
                          ],
                        );
                      }
                    } else {
                      Alert.alert(
                        'Notifications permission required',
                        'Open app settings to enable notifications?',
                        [
                          {
                            text: 'Cancel',
                            style: 'cancel',
                          },
                          {
                            text: 'Open settings',
                            style: 'default',
                            onPress: () => {
                              openSettings('application');
                            },
                          },
                        ],
                      );
                    }

                    close();
                  }}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const radioCultScheduleSchema = z.object({
  schedules: z.array(
    z.object({
      title: z.string(),
      start: z.string(),
      end: z.string(),
    }),
  ),
});

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<WeekSchedule[]>([]);
  const [liveShowIndex, setLiveShowIndex] = useState(-1);
  const [reminderModalShow, setReminderModalShow] = useState<Show>();
  const [triggerNotificationIds, setTriggerNotificationIds] =
    useState<string[]>();

  const fetchSchedule = useCallback(async () => {
    let parsedSchedule: WeekSchedule[] = [];
    const startDateTimestamp = startOfDay(Date.now()).toISOString();
    const endDateTimestamp = endOfDay(add(Date.now(), {days: 7})).toISOString();

    await fetch(
      `https://api.radiocult.fm/api/station/dublin-digital-radio/schedule?startDate=${startDateTimestamp}&endDate=${endDateTimestamp}`,
      {
        headers: {
          'x-api-key': RADIO_CULT_PUBLIC_API_KEY,
        },
      },
    )
      .then(response => response.json())
      .then(response => radioCultScheduleSchema.parse(response))
      .then(response => {
        let currentDay = startOfDay(Date.now());
        for (let i = 0; i < 7; i++) {
          const currentDayEnd = endOfDay(currentDay);
          parsedSchedule[i] = {
            dayName: format(currentDay, 'eeee'),
            shows: response.schedules
              .filter(show => {
                const showStartDateTime = new Date(show.start);
                return (
                  (isAfter(showStartDateTime, currentDay) ||
                    isEqual(showStartDateTime, currentDay)) &&
                  isBefore(showStartDateTime, currentDayEnd)
                );
              })
              .map(show => ({
                name: show.title,
                start_timestamp: show.start,
                end_timestamp: show.end,
              })),
          };

          currentDay = add(currentDay, {hours: 24});
        }
      });

    setSchedule(parsedSchedule);
  }, []);

  const refreshSchedule = useCallback(async () => {
    const currentDayName = format(new Date(), 'eeee');
    if (currentDayName !== schedule[0]?.dayName) {
      await fetchSchedule();
    }
    if (schedule[0]?.shows.length && schedule[0]?.shows.length > 0) {
      const currentTime = new Date();
      const currentLiveShowIndex = (schedule[0]?.shows ?? []).findIndex(
        ({start_timestamp, end_timestamp}) =>
          isAfter(currentTime, new Date(start_timestamp)) &&
          isBefore(currentTime, new Date(end_timestamp)),
      );
      setLiveShowIndex(currentLiveShowIndex);
    }
  }, [fetchSchedule, schedule]);

  const refreshTriggerNotificationIds = useCallback(async () => {
    const ids = await notifee.getTriggerNotificationIds();
    setTriggerNotificationIds(ids);
  }, []);

  useEffect(() => {
    refreshSchedule();

    const appStateSubscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        if (nextAppState === 'active') {
          await refreshSchedule();
        }
      },
    );

    return () => appStateSubscription.remove();
  }, [refreshSchedule]);

  useEffect(() => {
    refreshTriggerNotificationIds();
  }, [refreshTriggerNotificationIds]);

  useFocusEffect(
    useCallback(() => {
      refreshSchedule();
      refreshTriggerNotificationIds();
    }, [refreshSchedule, refreshTriggerNotificationIds]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scheduleContainer: {
          paddingHorizontal: 8,
        },
        loadingTextContainer: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          fontSize: 24,
        },
        scheduleDay: {
          fontSize: 24,
          textTransform: 'uppercase',
        },
      }),
    [],
  );

  if (schedule.length === 0 || triggerNotificationIds === undefined) {
    return (
      <SafeAreaView style={styles.loadingTextContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <ReminderContext.Provider
      value={{
        triggerNotificationIds,
        setTriggerNotificationIds,
        refreshTriggerNotificationIds,
        reminderModalShow,
        setReminderModalShow,
      }}>
      <SafeAreaView>
        <ScrollView>
          <View style={styles.scheduleContainer}>
            {schedule.map((day, dayIndex) => {
              return (
                <React.Fragment key={day.dayName}>
                  <Text style={styles.scheduleDay}>{day.dayName}</Text>
                  {day.shows.map((show, showIndex) => (
                    <ScheduleDayRow
                      key={`${day.dayName}-${show.name}-${show.start_timestamp}`}
                      show={show}
                      isLiveShow={dayIndex === 0 && showIndex === liveShowIndex}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </View>
          <ShowReminderModal close={() => setReminderModalShow(undefined)} />
        </ScrollView>
      </SafeAreaView>
    </ReminderContext.Provider>
  );
}
