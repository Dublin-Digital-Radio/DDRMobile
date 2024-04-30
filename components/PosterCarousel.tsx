import React, {useEffect, useMemo, useState} from 'react';
import {Image, Linking, View, StyleSheet} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {TouchableHighlight} from 'react-native-gesture-handler';
import {useTheme} from '@react-navigation/native';

import {StrapiEntryResponse, StrapiEntryListResponse} from '../utils/strapi';
import Text from './Text';

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
          textTransform: 'uppercase',
          textDecorationLine: 'underline',
        },
      }),
    [colors.background],
  );

  return (
    <View key={item.image.data?.attributes.url}>
      <TouchableHighlight
        onPress={item.url ? () => Linking.openURL(item.url!) : undefined}>
        <View>
          <Image
            style={{width: height, height: height}}
            source={{uri: item.image.data?.attributes.url}}
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
      mode="parallax"
      vertical
      modeConfig={{
        parallaxScrollingScale: 0.9,
        parallaxAdjacentItemScale: 0.8,
        parallaxScrollingOffset: 50,
      }}
      style={styles.carousel}
    />
  );
}
