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

  // expo-router's <Slot> clones the root screen element to inject layout
  // styles; when style is already an array (as it always is here) that
  // clone throws "You are passing an array of styles to a child of
  // <Slot>". Flattening to a single object avoids it.
  return (
    <View style={StyleSheet.flatten([{ backgroundColor: theme[type ?? 'background'] }, style])} {...otherProps} />
  );
}
