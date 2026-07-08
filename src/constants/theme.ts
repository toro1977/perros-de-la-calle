/**
 * Design tokens for Perros de la calle.
 * Warm, earthy palette (terracotta accent) — distinct from Doggers' cool blue.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#241D16',
    textSecondary: '#7C7164',
    background: '#FBFAF7',
    backgroundElement: '#F2EEE6',
    backgroundSelected: '#E9E2D5',
    border: '#E4DDCF',
    accent: '#C6551F',
    accentSoft: '#FBEADD',
    onAccent: '#FFFFFF',
    success: '#3D8F52',
    successSoft: '#E5F3E8',
    danger: '#C6432B',
    dangerSoft: '#FBE7E2',
    warning: '#B5790F',
    warningSoft: '#FAF0DB',
  },
  dark: {
    text: '#F4EFE7',
    textSecondary: '#AFA491',
    background: '#171310',
    backgroundElement: '#211C16',
    backgroundSelected: '#2B241C',
    border: '#332C22',
    accent: '#E27A43',
    accentSoft: '#3A2515',
    onAccent: '#171310',
    success: '#5CB374',
    successSoft: '#1D2E20',
    danger: '#E2705A',
    dangerSoft: '#341E19',
    warning: '#D6A23E',
    warningSoft: '#332813',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
