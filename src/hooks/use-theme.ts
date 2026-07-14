/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

// TEMP: forced to light while we shake out light-mode issues during QA.
// Revert to reading useColorScheme() once dark mode gets its own pass.
export function useTheme() {
  return Colors.light;
}
