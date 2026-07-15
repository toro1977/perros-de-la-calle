/**
 * Design tokens for Perros de la calle.
 * Paper + terracotta — accent is a warm burnt-orange (same family as the
 * splash/app-icon background, #C6551F), darkened slightly to clear WCAG
 * AA (4.5:1) for text use, which the splash color itself doesn't
 * (4.33:1 against the app background). State colors (danger/success/
 * warning) still carry their own separate signal.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1815',
    // #78716A read at 4.33:1 against backgroundElement — just under the
    // WCAG AA minimum (4.5:1) for normal text. Darkened slightly to clear it.
    textSecondary: '#736C64',
    background: '#FCFCFA',
    backgroundElement: '#F4F3EF',
    backgroundSelected: '#ECEAE3',
    surface: '#FFFFFF',
    border: '#E5E3DD',
    accent: '#B84E1A',
    accentSoft: '#FBEADD',
    onAccent: '#FFFFFF',
    success: '#2E9E5B',
    successSoft: '#E3F4EA',
    danger: '#E63912',
    dangerSoft: '#FCE7DF',
    warning: '#E8920C',
    warningSoft: '#FCEED3',
  },
  dark: {
    // Neutral charcoal, not warm brown — light mode is neutral-to-cool
    // paper (#FCFCFA), so dark mode should be its neutral mirror, not a
    // different (warmer) identity.
    text: '#F0F0F0',
    textSecondary: '#A8A8A8',
    background: '#1A1A1A',
    backgroundElement: '#242424',
    backgroundSelected: '#2E2E2E',
    surface: '#242424',
    border: '#333333',
    accent: '#E8824A',
    accentSoft: '#3A2416',
    onAccent: '#18181A',
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
