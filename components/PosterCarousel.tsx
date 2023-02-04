import React, {useEffect, useState} from 'react';
import {
  Image,
  Linking,
  TouchableHighlight,
  View,
  useWindowDimensions,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

import {StrapiEntryResponse, StrapiEntryListResponse} from '../utils/strapi';

interface Poster {
  image: StrapiEntryResponse<{url: string}>;
  url?: string;
}

function PosterCarouselItem({item, index}: {item: Poster; index: number}) {
  const {width: windowWidth} = useWindowDimensions();
  console.log({url: item.url, imageUrl: item.image.data.attributes.url});
  return (
    <View key={index}>
      <TouchableHighlight
        onPress={item.url ? () => Linking.openURL(item.url!) : undefined}>
        <Image
          style={{height: windowWidth}}
          source={{uri: item.image.data.attributes.url}}
        />
      </TouchableHighlight>
    </View>
  );
}

export default function PosterCarousel() {
  const {width: windowWidth} = useWindowDimensions();
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

  return (
    <Carousel
      data={posters}
      renderItem={PosterCarouselItem}
      width={windowWidth}
      height={windowWidth}
      mode="parallax"
      modeConfig={{
        parallaxScrollingOffset: 50,
        parallaxScrollingScale: 0.9,
      }}
    />
  );
}
