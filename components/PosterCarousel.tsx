import React, {useEffect, useState} from 'react';
import {
  Image,
  Linking,
  TouchableHighlight,
  View,
  useWindowDimensions,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

interface StrapiEntryListResponse<T> {
  data: {
    attributes: T;
  }[];
}

interface Poster {
  secureImageUrl: string;
  url?: string;
}

function PosterCarouselItem({item, index}: {item: Poster; index: number}) {
  const {width: windowWidth} = useWindowDimensions();
  return (
    <View key={index}>
      <TouchableHighlight onPress={() => Linking.openURL(item.url)}>
        <Image
          style={{height: windowWidth}}
          source={{uri: item.secureImageUrl}}
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
