import React, {useEffect, useMemo, useState} from 'react';
import {Image, Linking, View, StyleSheet} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import {TouchableHighlight} from 'react-native-gesture-handler';
import {useTheme} from '@react-navigation/native';

import {StrapiEntryResponse, StrapiEntryListResponse} from '../utils/strapi';
import Text from './Text';

interface BlogPost {
  title?: string;
  image: StrapiEntryResponse<{url: string}>;
  slug?: string;
}

function PosterCarouselItem({item, height}: {item: BlogPost; height: number}) {
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
        onPress={
          item.slug
            ? () =>
                Linking.openURL(
                  `https://listen.dublindigitalradio.com/news-events/${item.slug}`,
                )
            : undefined
        }>
        <View>
          <Image
            style={{width: height, height: height}}
            source={{uri: item.image.data?.attributes.url}}
          />
          {item.title ? (
            <View style={styles.posterNameContainer}>
              <Text style={styles.posterName}>{item.title}</Text>
            </View>
          ) : null}
        </View>
      </TouchableHighlight>
    </View>
  );
}

export default function PosterCarousel({height}: {height: number}) {
  const [posters, setPosters] = useState<BlogPost[]>([]);

  useEffect(() => {
    (async () => {
      const blogPostResults = await fetch(
        `https://ddr-cms.fly.dev/api/blogs?${new URLSearchParams({
          'pagination[pageSize]': '2',
          sort: 'date:desc',
          'filters[publishedAt][$null]': 'false',
          'filters[slug][$not][$eq]': '',
          'fields[0]': 'title',
          'fields[1]': 'slug',
          populate: 'image',
        })}`,
      )
        .then(response => response.json())
        .then(
          blogPostsResponse =>
            blogPostsResponse as StrapiEntryListResponse<BlogPost>,
        )
        .then(blogPostsResponse => blogPostsResponse.data)
        .then(blogPostEntries =>
          blogPostEntries.map(entry => entry.attributes),
        );

      setPosters(blogPostResults);
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
