import {RADIO_CULT_PUBLIC_API_KEY} from '@env';
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  AppState,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {z} from 'zod';
import {
  add,
  format,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  isEqual,
} from 'date-fns';
import {useFocusEffect, useTheme} from '@react-navigation/native';

import Text from '../components/Text';
import {decodeAirtimeShowName} from '../features/shows/api';

interface Show {
  name: string;
  start_timestamp: string;
  end_timestamp: string;
}

interface WeekSchedule {
  dayName: string;
  shows: Show[];
}

function ScheduleDayRow({
  show,
  isLiveShow = false,
}: {
  show: Show;
  isLiveShow?: boolean;
}) {
  const {colors} = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scheduleDayContainer: {
          flexDirection: 'row',
        },
        showTimeCell: {
          flex: 1,
        },
        showNameCell: {
          flex: 2,
        },
        isLiveShow: {
          fontFamily: 'Chivo-Bold',
          color: colors.primary,
        },
      }),
    [colors.primary],
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
          {decodeAirtimeShowName(show.name)}
        </Text>
      </View>
    </View>
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

  useFocusEffect(
    useCallback(() => {
      refreshSchedule();
    }, [refreshSchedule]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flexContainer: {
          flex: 1,
        },
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

  if (schedule.length === 0) {
    return (
      <SafeAreaView style={[styles.flexContainer, styles.loadingTextContainer]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flexContainer}>
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
      </ScrollView>
    </SafeAreaView>
  );
}
