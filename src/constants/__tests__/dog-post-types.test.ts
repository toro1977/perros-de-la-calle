import { DOG_POST_TYPE_META } from '@/constants/dog-post-types';

// This table is read from three different screens (feed chips, card
// badges, new-post type selector) — a missing/malformed entry breaks all
// of them at once silently (wrong icon, undefined color lookup), so its
// shape is worth locking down on its own instead of only through whichever
// screen happens to render it in a given test run.
describe('DOG_POST_TYPE_META', () => {
  const validTones = ['danger', 'success', 'warning'];

  it('has exactly the three post types', () => {
    expect(Object.keys(DOG_POST_TYPE_META).sort()).toEqual(['found', 'lost', 'stray']);
  });

  it.each(Object.entries(DOG_POST_TYPE_META))('%s has a complete, well-shaped entry', (_type, meta) => {
    expect(meta.label.length).toBeGreaterThan(0);
    expect(meta.hint.length).toBeGreaterThan(0);
    expect(meta.icon).toMatch(/^[a-z]+(-[a-z]+)*$/);
    expect(validTones).toContain(meta.tone);
  });

  it('gives each type its own tone (no two types share a color)', () => {
    const tones = Object.values(DOG_POST_TYPE_META).map(m => m.tone);
    expect(new Set(tones).size).toBe(tones.length);
  });
});
