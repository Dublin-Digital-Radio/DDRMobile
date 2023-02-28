import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
  AppState,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import qs from 'qs';
// The airtime library doesn't have type declarations yet.
// @ts-expect-error
import airtime from 'airtime-pro-api';
import {add, format, isAfter, isBefore} from 'date-fns';
import {useFocusEffect, useTheme} from '@react-navigation/native';
import {convertAirtimeToCmsShowName} from '../features/shows/api';
import {ShowInfo} from '../features/shows/types';
import {StrapiEntryListResponse} from '../utils/strapi';
import {TouchableHighlight} from 'react-native-gesture-handler';

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

const getScheduleByDay = (data: {[dayName: string]: Show[]}) => {
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

function ScheduleDayRow({
  show,
  showInfo,
  isLiveShow = false,
}: {
  show: Show;
  showInfo?: ShowInfo;
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
        text: {
          color: colors.text,
        },
        isLiveShow: {
          fontWeight: 'bold',
          color: colors.primary,
        },
        hasShowInfo: {
          textDecorationLine: 'underline',
        },
      }),
    [colors.primary, colors.text],
  );

  return (
    <View style={styles.scheduleDayContainer}>
      <View style={styles.showTimeCell}>
        <Text style={[styles.text, isLiveShow ? styles.isLiveShow : {}]}>
          {format(new Date(show.start_timestamp), 'HH:mm')} -{' '}
          {format(new Date(show.end_timestamp), 'HH:mm')}
        </Text>
      </View>
      <View style={styles.showNameCell}>
        <TouchableHighlight
          onPress={() => showInfo && Alert.alert(showInfo.tagline)}>
          <Text
            style={[
              styles.text,
              isLiveShow ? styles.isLiveShow : {},
              showInfo ? styles.hasShowInfo : {},
            ]}>
            {show.name}
          </Text>
        </TouchableHighlight>
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<AirtimeDaySchedule[]>([]);
  const [showInfoItems, setShowInfoItems] = useState<Record<string, ShowInfo>>(
    {},
  );
  const [liveShowIndex, setLiveShowIndex] = useState(-1);
  const {colors} = useTheme();

  const fetchSchedule = useCallback(async () => {
    const weekInfo = await ddrAirtime.weekInfo();
    const scheduleByDay = getScheduleByDay(weekInfo);
    const allShows = [
      ...new Set(
        scheduleByDay.reduce<string[]>(
          (acc, day) =>
            acc.concat(
              ...day.shows.map(show => convertAirtimeToCmsShowName(show.name)),
            ),
          [],
        ),
      ),
    ];
    const query = qs.stringify({
      filters: {
        name: {
          $in: allShows,
        },
      },
    });
    const showInfoItemsResult = await fetch(
      `https://ddr-cms.fly.dev/api/shows?${query}`,
    )
      .then(response => response.json())
      .then(
        showInfoItemsResponse =>
          showInfoItemsResponse as StrapiEntryListResponse<ShowInfo>,
      )
      .then(showInfoItemsResponse =>
        showInfoItemsResponse.data
          .map(
            showInfoItemsResponseEntry => showInfoItemsResponseEntry.attributes,
          )
          .reduce<Record<string, ShowInfo>>((acc, showInfo) => {
            return {...acc, [showInfo.name]: showInfo};
          }, {}),
      );
    setSchedule(getScheduleByDay(weekInfo));
    setShowInfoItems(showInfoItemsResult);
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
        loadingTextContainer: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        loadingText: {
          fontSize: 24,
          color: colors.text,
        },
        scheduleDay: {
          fontSize: 24,
          color: colors.text,
        },
      }),
    [colors.text],
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
        {schedule.map((day, dayIndex) => {
          return (
            <React.Fragment key={day.dayName}>
              <Text style={styles.scheduleDay}>{day.dayName}</Text>
              {day.shows.map((show, showIndex) => (
                <ScheduleDayRow
                  key={`${day.dayName}-${show.name}-${show.start_timestamp}`}
                  show={show}
                  showInfo={
                    showInfoItems[convertAirtimeToCmsShowName(show.name)]
                  }
                  isLiveShow={dayIndex === 0 && showIndex === liveShowIndex}
                />
              ))}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
