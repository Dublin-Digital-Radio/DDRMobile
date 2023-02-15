import React, {useEffect, useMemo, useState} from 'react';
import {Image, Linking, View, StyleSheet} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {TouchableHighlight} from 'react-native-gesture-handler';

import {StrapiEntryResponse, StrapiEntryListResponse} from '../utils/strapi';

interface Poster {
  image: StrapiEntryResponse<{url: string}>;
  url?: string;
}

function PosterCarouselItem({item, height}: {item: Poster; height: number}) {
  return (
    <View key={item.image.data.attributes.url}>
      <TouchableHighlight
        onPress={item.url ? () => Linking.openURL(item.url!) : undefined}>
        <Image
          style={{width: height, height: height}}
          source={{uri: item.image.data.attributes.url}}
        />
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
