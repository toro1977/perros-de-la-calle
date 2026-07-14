import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { TextField, TextFieldProps } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DOG_BREEDS } from '@/constants/dog-breeds';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<TextFieldProps, 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (text: string) => void;
};

export const BreedAutocomplete = forwardRef<TextInput, Props>(function BreedAutocomplete(
  { value, onChangeText, onFocus, onBlur, ...rest },
  ref
) {
  const theme = useTheme();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const trimmed = value.trim().toLowerCase();
  const suggestions = trimmed.length > 0 ? DOG_BREEDS.filter(b => b.toLowerCase().includes(trimmed)).slice(0, 6) : [];

  return (
    <ThemedView>
      <TextField
        ref={ref}
        value={value}
        onChangeText={text => {
          onChangeText(text);
          setShowSuggestions(true);
        }}
        onFocus={e => {
          setShowSuggestions(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          // Small delay so a tap on a suggestion registers before the list unmounts.
          setTimeout(() => setShowSuggestions(false), 150);
          onBlur?.(e);
        }}
        autoCapitalize="words"
        {...rest}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ThemedView style={[styles.suggestionsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {suggestions.map((breed, index) => (
            <Pressable
              key={breed}
              style={[
                styles.suggestionItem,
                index < suggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
              onPress={() => {
                onChangeText(breed);
                setShowSuggestions(false);
              }}
            >
              <ThemedText type="default">{breed}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  suggestionsBox: {
    marginTop: Spacing.one,
    borderWidth: 1,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
});
