import { useEffect, useMemo } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ style }: Props) {
  const theme = useTheme();
  const opacity = useMemo(() => new Animated.Value(0.4), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ backgroundColor: theme.backgroundElement, borderRadius: Radius.sm, opacity }, style]}
    />
  );
}
