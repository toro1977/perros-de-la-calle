import { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = TextInputProps & {
  label: string;
};

export function TextField({ label, style, onFocus, onBlur, ...rest }: Props) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <ThemedText type="caption" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: isFocused ? theme.accent : theme.border,
            borderWidth: isFocused ? 2 : 1,
          },
          style,
        ]}
        placeholderTextColor={theme.textSecondary}
        onFocus={e => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  label: {
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
});
