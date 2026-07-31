import { formatDistance } from '@/utils/format-distance';

describe('formatDistance', () => {
  it('shows "Acá nomás" under 100 meters', () => {
    expect(formatDistance(0.05)).toBe('Acá nomás');
    expect(formatDistance(0)).toBe('Acá nomás');
  });

  it('shows rounded meters between 100m and 1km', () => {
    expect(formatDistance(0.5)).toBe('a 500 m');
  });

  it('shows one decimal (comma) between 1km and 10km', () => {
    expect(formatDistance(5.4)).toBe('a 5,4 km');
    expect(formatDistance(10)).toBe('a 10,0 km');
  });

  it('shows rounded whole km past 10km — this is what caught the 10416km simulator bug', () => {
    expect(formatDistance(15.6)).toBe('a 16 km');
    expect(formatDistance(10419.7)).toBe('a 10420 km');
  });
});
