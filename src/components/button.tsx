import { ActivityIndicator, Pressable, PressableProps, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  icon?: React.ReactNode;
};

export function Button({ label, variant = 'primary', loading, icon, disabled, ...rest }: Props) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary' ? theme.accent : variant === 'secondary' ? theme.backgroundElement : 'transparent';
  const textColor = variant === 'primary' ? theme.onAccent : theme.text;
  const borderColor = variant === 'ghost' ? theme.border : 'transparent';

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.base,
          {
            backgroundColor,
            borderColor,
            borderWidth: variant === 'ghost' ? 1 : 0,
            opacity: isDisabled ? 0.55 : pressed ? 0.82 : 1,
          },
        ])
      }
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon}
          <ThemedText type="default" style={{ color: textColor, fontWeight: '700' }}>
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
