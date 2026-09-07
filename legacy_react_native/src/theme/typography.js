import { StyleSheet } from 'react-native';

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '700',
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  captionMedium: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  small: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  number: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  numberLarge: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  numberSmall: {
    fontSize: 20,
    fontWeight: '700',
  },
  button: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 40,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};
