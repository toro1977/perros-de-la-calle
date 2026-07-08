import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code'
    | 'eyebrow'
    | 'caption';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  const colorOverride = type === 'linkPrimary' ? theme.accent : undefined;

  return (
    <Text
      style={[
        { color: colorOverride ?? theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        type === 'eyebrow' && styles.eyebrow,
        type === 'caption' && styles.caption,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 500,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  title: {
    fontSize: 30,
    fontWeight: 800,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  link: {
    lineHeight: 22,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 22,
    fontSize: 14,
    fontWeight: 700,
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 500,
  },
});
