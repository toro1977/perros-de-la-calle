import { StyleSheet, View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  // expo-router clones the root screen element under <Slot>, and the
  // direct child of any <Link asChild>, to inject layout/navigation
  // props. If that element's `style` is an array (as it always is here)
  // the clone throws "You are passing an array of styles to a child of
  // <Slot>". Flattening to a single object avoids it — apply the same
  // StyleSheet.flatten([...]) to the style of any component used as the
  // direct child of <Link asChild> elsewhere in this app.
  return (
    <View style={StyleSheet.flatten([{ backgroundColor: theme[type ?? 'background'] }, style])} {...otherProps} />
  );
}
