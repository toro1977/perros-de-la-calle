import { Ionicons } from '@expo/vector-icons';
import { ShelterVerificationStatus } from '@/types/database.types';

export const VERIFIED_BADGE_META = {
  label: 'Refugio verificado',
  icon: 'shield-checkmark' as const,
  tone: 'success' as const,
};

// icon/tone only — profile.tsx and shelter-profile.tsx each show this
// status with their own copy (menu entry vs. form banner), but both
// mean the same three states, so the icon/tone pairing lives in one place.
export const SHELTER_VERIFICATION_STATUS_META: Record<
  ShelterVerificationStatus,
  { icon: keyof typeof Ionicons.glyphMap; tone: 'warning' | 'success' | 'danger' }
> = {
  pending: { icon: 'time-outline', tone: 'warning' },
  approved: { icon: 'shield-checkmark', tone: 'success' },
  rejected: { icon: 'close-circle-outline', tone: 'danger' },
};
