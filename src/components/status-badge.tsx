import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DOG_POST_TYPE_META } from '@/constants/dog-post-types';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DogPostType } from '@/types/database.types';

type Props = {
  type: DogPostType;
  variant?: 'solid' | 'soft';
  size?: 'sm' | 'md';
};

export function StatusBadge({ type, variant = 'soft', size = 'md' }: Props) {
  const theme = useTheme();
  const meta = DOG_POST_TYPE_META[type];
  const toneColor = theme[meta.tone];
  const toneSoft = theme[`${meta.tone}Soft` as const];
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <ThemedView
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        variant === 'solid'
          ? [styles.solid, { backgroundColor: toneColor }]
          : { backgroundColor: toneSoft },
      ]}
    >
      <Ionicons name={meta.icon} size={iconSize} color={variant === 'solid' ? '#FFFFFF' : toneColor} />
      <ThemedText
        type="caption"
        style={[styles.label, { color: variant === 'solid' ? '#FFFFFF' : toneColor }]}
      >
        {meta.label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  badgeSm: {
    paddingHorizontal: Spacing.two - 2,
    paddingVertical: 3,
  },
  solid: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
