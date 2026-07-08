import { Ionicons } from '@expo/vector-icons';
import { DogPostType } from '@/types/database.types';

export const DOG_POST_TYPE_META: Record<
  DogPostType,
  { label: string; icon: keyof typeof Ionicons.glyphMap; tone: 'danger' | 'success' | 'warning' }
> = {
  lost: { label: 'Perdido', icon: 'help-buoy-outline', tone: 'danger' },
  found: { label: 'Encontrado', icon: 'checkmark-circle-outline', tone: 'success' },
  stray: { label: 'Callejero', icon: 'paw-outline', tone: 'warning' },
};
