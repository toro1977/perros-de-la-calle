import { ScrollView, TextInput } from 'react-native';

// Auto-scrolls a focused TextInput above the keyboard. RN's TextInput
// exposes `measureLayout` as an instance method (works under Fabric,
// unlike the deprecated static `UIManager.measureLayout`) — it measures
// the field's position relative to the ScrollView's own native node.
export function scrollFieldIntoView(scrollView: ScrollView | null, field: TextInput | null) {
  if (!scrollView || !field) return;
  try {
    field.measureLayout(
      scrollView as any,
      (_x, y) => scrollView.scrollTo({ y: Math.max(y - 16, 0), animated: true }),
      () => {}
    );
  } catch {
    // best-effort — if measuring fails, the field just isn't auto-scrolled into view
  }
}
