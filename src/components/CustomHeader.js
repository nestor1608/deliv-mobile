import React from 'react';
import { View, Text, StyleSheet, Platform, ViewPropTypes } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * CustomHeader
 * Props:
 * - title: string
 * - leftComponent?: ReactNode
 * - rightComponent?: ReactNode
 * - containerStyle?: object
 * - titleStyle?: object
 * - ...rest: otros props para el contenedor
 */
const CustomHeader = ({
  title = '',
  leftComponent = null,
  rightComponent = null,
  containerStyle = {},
  titleStyle = {},
  ...rest
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top },
        containerStyle,
      ]}
      {...rest}
    >
      <View style={styles.side}>{leftComponent}</View>
      <View style={styles.titleContainer}>
        <Text
          style={[styles.title, titleStyle]}
          numberOfLines={1}
          ellipsizeMode="tail"
          accessibilityRole="header"
        >
          {title}
        </Text>
      </View>
      <View style={styles.side}>{rightComponent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: Platform.OS === 'ios' ? 60 : 56,
  },
  side: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxWidth: 60,
  },
  titleContainer: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    width: '100%',
  },
});

export default CustomHeader;