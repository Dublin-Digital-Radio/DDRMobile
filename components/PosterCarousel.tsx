import React, {useEffect, useMemo, useState} from 'react';
import {Image, Linking, View, StyleSheet, Text} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {TouchableHighlight} from 'react-native-gesture-handler';
import {useTheme} from '@react-navigation/native';

import {StrapiEntryResponse, StrapiEntryListResponse} from '../utils/strapi';

interface Poster {
  name?: string;
  image: StrapiEntryResponse<{url: string}>;
  url?: string;
}

function PosterCarouselItem({item, height}: {item: Poster; height: number}) {
  const {colors} = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        posterNameContainer: {
          position: 'absolute',
          left: 8,
          bottom: 8,
          backgroundColor: colors.background,
          padding: 4,
        },
        posterName: {
          fontSize: 24,
          color: colors.text,
          textDecorationLine: 'underline',
        },
      }),
    [colors.background, colors.text],
  );

  return (
    <View key={item.image.data.attributes.url}>
      <TouchableHighlight
        onPress={item.url ? () => Linking.openURL(item.url!) : undefined}>
        <View>
          <Image
            style={{width: height, height: height}}
            source={{uri: item.image.data.attributes.url}}
          />
          {item.name ? (
            <View style={styles.posterNameContainer}>
              <Text style={styles.posterName}>{item.name}</Text>
            </View>
          ) : null}
        </View>
      </TouchableHighlight>
    </View>
  );
}

export default function PosterCarousel({height}: {height: number}) {
  const [posters, setPosters] = useState<Poster[]>([]);

  useEffect(() => {
    (async () => {
      const currentTime = new Date();
      const posterResults = await fetch(
        `https://ddr-cms.fly.dev/api/posters?${new URLSearchParams({
          'filters[active][$eq]': 'true',
          'filters[displayUntil][$gte]': currentTime.toISOString(),
          'filters[displayFrom][$lte]': currentTime.toISOString(),
          populate: '*',
        })}`,
      )
        .then(response => response.json())
        .then(
          postersResponse => postersResponse as StrapiEntryListResponse<Poster>,
        )
        .then(postersResponse => postersResponse.data)
        .then(posterEntries => posterEntries.map(entry => entry.attributes));

      setPosters(posterResults);
    })();
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        carousel: {
          width: '100%',
          justifyContent: 'center',
        },
      }),
    [],
  );

  return (
    <Carousel
      data={posters}
      renderItem={({item}) => (
        <PosterCarouselItem item={item} height={height} />
      )}
      autoPlay
      autoPlayInterval={5000}
      pagingEnabled
      width={height}
      height={height}
      mode="horizontal-stack"
      modeConfig={{}}
      style={styles.carousel}
    />
  );
}
