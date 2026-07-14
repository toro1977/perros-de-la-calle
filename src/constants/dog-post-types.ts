import { Ionicons } from '@expo/vector-icons';
import { DogPostType } from '@/types/database.types';

export const DOG_POST_TYPE_META: Record<
  DogPostType,
  { label: string; hint: string; icon: keyof typeof Ionicons.glyphMap; tone: 'danger' | 'success' | 'warning' }
> = {
  // "Encontrado" reads as ambiguous on its own — could mean "I found a
  // stray dog" or "I got my lost dog back" — so the hint spells out
  // which one this app means (the finder's report, not a resolution).
  lost: { label: 'Perdido', hint: 'Es tu perro y no sabés dónde está.', icon: 'help-buoy-outline', tone: 'danger' },
  found: {
    label: 'Encontrado',
    hint: 'Viste un perro que no es tuyo y parece perdido.',
    icon: 'checkmark-circle-outline',
    tone: 'success',
  },
  stray: {
    label: 'Callejero',
    hint: 'Perro sin dueño aparente, vive en la calle.',
    icon: 'paw-outline',
    tone: 'warning',
  },
};
