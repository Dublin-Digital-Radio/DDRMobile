import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
// The airtime library doesn't have type declarations yet.
// @ts-expect-error
import airtime from 'airtime-pro-api';
import {add, format} from 'date-fns';
import {useFocusEffect, useTheme} from '@react-navigation/native';

interface Show {
  name: string;
  start_timestamp: string;
  end_timestamp: string;
}

interface AirtimeDaySchedule {
  dayName: string;
  shows: Show[];
}

const ddrAirtime = airtime.init({stationName: 'dublindigitalradio'});

const scheduleByDay = (data: {[dayName: string]: Show[]}) => {
  const schedule: AirtimeDaySchedule[] = [];
  const today = new Date();
  const todayDayName = format(today, 'eeee');
  const todayDayNameLowerCase = todayDayName.toLowerCase();

  schedule[0] = {
    dayName: todayDayName,
    shows: data[todayDayNameLowerCase] ?? [],
  };
  let hasPassedSunday = todayDayName === 'sunday';
  let currentDay = today;

  for (let i = 1; i < 7; i++) {
    currentDay = add(currentDay, {days: 1});
    const currDayName = format(currentDay, 'eeee');
    const currDayNameLowerCase = currDayName.toLowerCase();

    schedule[i] = hasPassedSunday
      ? {
          dayName: currDayName,
          shows: data[`next${currDayNameLowerCase}`] ?? [],
        }
      : {
          dayName: currDayName,
          shows: data[currDayNameLowerCase] ?? [],
        };
    if (currDayNameLowerCase === 'sunday') {
      hasPassedSunday = true;
    }
  }
  return schedule;
};

function ScheduleDayRow({show}: {show: Show}) {
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
        text: {
          color: colors.text,
        },
      }),
    [colors.text],
  );

  return (
    <View style={styles.scheduleDayContainer}>
      <View style={styles.showTimeCell}>
        <Text style={styles.text}>
          {format(new Date(show.start_timestamp), 'HH:mm')} -{' '}
          {format(new Date(show.end_timestamp), 'HH:mm')}
        </Text>
      </View>
      <View style={styles.showNameCell}>
        <Text style={styles.text}>{show.name}</Text>
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<AirtimeDaySchedule[]>([]);
  const {colors} = useTheme();

  const fetchSchedule = useCallback(async () => {
    const weekInfo = await ddrAirtime.weekInfo();
    setSchedule(scheduleByDay(weekInfo));
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useFocusEffect(
    useCallback(() => {
      const currentDayName = format(new Date(), 'eeee');
      if (currentDayName !== schedule[0]?.dayName) {
        fetchSchedule();
      }
    }, [fetchSchedule, schedule]),
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        flexContainer: {
          flex: 1,
        },

        scheduleDay: {
          fontSize: 24,
          color: colors.text,
        },
      }),
    [colors.text],
  );

  return (
    <SafeAreaView style={styles.flexContainer}>
      <ScrollView>
        {schedule.map(day => {
          return (
            <>
              <Text style={styles.scheduleDay}>{day.dayName}</Text>
              {day.shows.map(show => (
                <ScheduleDayRow show={show} />
              ))}
            </>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
