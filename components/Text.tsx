import React, {useMemo} from 'react';
import {StyleSheet, Text as RNText, TextProps} from 'react-native';
import {useTheme} from '@react-navigation/native';

export default function Text(props: TextProps) {
  const {colors} = useTheme();
  const {style, ...propsWithoutStyle} = props;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        baseText: {fontFamily: 'Chivo-Regular', color: colors.text},
      }),
    [colors.text],
  );

  return <RNText style={[styles.baseText, style]} {...propsWithoutStyle} />;
}
