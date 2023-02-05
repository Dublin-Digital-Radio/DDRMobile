import React, {useEffect, useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, View} from 'react-native';
import airtime from 'airtime-pro-api';
import {add, format} from 'date-fns';

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
  return (
    <View style={styles.scheduleDayContainer}>
      <View style={styles.flexContainer}>
        <Text>
          {format(new Date(show.start_timestamp), 'HH:mm')} -{' '}
          {format(new Date(show.end_timestamp), 'HH:mm')}
        </Text>
      </View>
      <View style={styles.showNameCell}>
        <Text>{show.name}</Text>
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<AirtimeDaySchedule[]>([]);

  useEffect(() => {
    (async () => {
      const weekInfo = await ddrAirtime.weekInfo();
      setSchedule(scheduleByDay(weekInfo));
    })();
  }, []);

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

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  scheduleDayContainer: {
    flexDirection: 'row',
  },
  scheduleDay: {
    fontSize: 24,
  },
  showNameCell: {
    flex: 2,
  },
});
