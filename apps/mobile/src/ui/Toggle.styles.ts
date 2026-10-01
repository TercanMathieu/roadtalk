import { StyleSheet } from 'react-native';

import { colors } from './tokens';

export const TRACK_WIDTH = 56;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 24;
const THUMB_MARGIN = 4;

// Distance parcourue par le thumb entre "off" et "on".
export const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_MARGIN * 2;

export const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    marginLeft: THUMB_MARGIN,
    backgroundColor: colors.background,
  },
});
