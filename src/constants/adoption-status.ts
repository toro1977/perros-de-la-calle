import { Ionicons } from '@expo/vector-icons';
import { AdoptionDogStatus } from '@/types/database.types';

export const ADOPTION_STATUS_META: Record<
  AdoptionDogStatus,
  { label: string; icon: keyof typeof Ionicons.glyphMap; tone: 'danger' | 'success' | 'warning' }
> = {
  available: { label: 'Disponible', icon: 'heart-outline', tone: 'success' },
  in_process: { label: 'En proceso', icon: 'time-outline', tone: 'warning' },
  adopted: { label: 'Adoptado', icon: 'checkmark-circle-outline', tone: 'danger' },
};
