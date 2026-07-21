/**
 * Design tokens for Perros de la calle.
 * Paper + terracotta — accent is a warm burnt-orange (same family as the
 * splash/app-icon background, #C6551F), darkened slightly to clear WCAG
 * AA (4.5:1) for text use, which the splash color itself doesn't
 * (4.33:1 against the app background). State colors (danger/success/
 * warning) still carry their own separate signal.
 *
 * Elevation: `background` is the warm-paper page color; `surface` is the
 * elevated-card color. In light mode surface is lighter (white on paper);
 * in dark mode that relationship inverts (surface is lighter than
 * background, since shadow doesn't read on dark backgrounds — elevation
 * has to come from the tone step instead). Cards use `surface` +
 * `borderRadius` + shadow, no border — a border at 1-1.5px combined with
 * `overflow:'hidden'` reads as a dark seam where a photo meets the
 * rounded corner instead of a clean edge.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1815',
    // Darkened from #736C64 when `backgroundElement` below moved closer to
    // `background` — #736C64 only cleared 4.11:1 against the new
    // backgroundElement (below WCAG AA's 4.5:1 for normal text, the same
    // bar this token has always been held to). #6A6359 clears 4.71:1
    // there and 5.2-5.9:1 against background/surface.
    textSecondary: '#6A6359',
    // Warm paper, clearly distinct from `surface` (pure white) so elevated
    // cards visibly separate from the page — was near-white (#FCFCFA,
    // ~1.03:1 against surface), which made bordered/shadowed cards read as
    // flush with the background instead of floating above it.
    background: '#F2F0EA',
    // One step down from `background` so filled elements (chips, inputs)
    // still read as distinct fills now that `background` itself darkened.
    backgroundElement: '#E7E3DA',
    backgroundSelected: '#DBD6CB',
    surface: '#FFFFFF',
    border: '#E5E3DD',
    // `border` reads as near-invisible at 1px on a contained card floating
    // over `background` (both near-white, ~1.03:1) — this needs to clear
    // ~3:1 against background/surface to actually read as an edge, which
    // `border` (1.76:1) doesn't. #8F8677 clears 3.5:1/3.6:1.
    borderStrong: '#8F8677',
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
    // Warm charcoal now, mirroring light mode's warm paper (see the
    // background/surface comments below) rather than a neutral-to-cool
    // identity split from it.
    text: '#F0F0F0',
    textSecondary: '#A8A8A8',
    // Elevation inverts in dark mode: shadow barely reads on a dark
    // background, so `surface` has to be lighter than `background` for a
    // card to visibly separate — the opposite of light mode's white-on-paper.
    background: '#141210',
    // Same tone as `surface` (not a third step) — this token was already
    // equal to `surface` before this pass; kept that parity rather than
    // introducing an unrequested extra step here.
    backgroundElement: '#211C17',
    backgroundSelected: '#2B2621',
    surface: '#211C17',
    border: '#333333',
    // Same logic as light mode: clears ~3.6:1/4:1 against surface/background.
    borderStrong: '#7A7A7A',
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
