/**
 * Design tokens for Perros de la calle.
 * Paper + ink palette — the accent is ink (text color), and state colors
 * (danger/success/warning) carry the real visual signal.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1815',
    textSecondary: '#78716A',
    background: '#FCFCFA',
    backgroundElement: '#F4F3EF',
    backgroundSelected: '#ECEAE3',
    surface: '#FFFFFF',
    border: '#E5E3DD',
    accent: '#1A1815',
    accentSoft: '#ECEAE3',
    onAccent: '#FFFFFF',
    success: '#2E9E5B',
    successSoft: '#E3F4EA',
    danger: '#E63912',
    dangerSoft: '#FCE7DF',
    warning: '#E8920C',
    warningSoft: '#FCEED3',
  },
  dark: {
    text: '#F4EFE7',
    textSecondary: '#AFA491',
    background: '#171310',
    backgroundElement: '#211C16',
    backgroundSelected: '#2B241C',
    surface: '#211C16',
    border: '#332C22',
    accent: '#F4EFE7',
    accentSoft: '#2B241C',
    onAccent: '#171310',
    success: '#4FCE86',
    successSoft: '#1B3325',
    danger: '#FF6B47',
    dangerSoft: '#3A1D14',
    warning: '#FFB13D',
    warningSoft: '#3A2A10',
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
  // Clears a floating FAB (~52px tall, offset four from the bottom edge)
  // plus a bit of breathing room, so a scrollable list's last item never
  // sits underneath it.
  seven: 100,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
