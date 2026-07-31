import { formatRelativeTime } from '@/utils/relative-time';

function isoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

describe('formatRelativeTime', () => {
  it('shows "ahora" for anything under a minute', () => {
    expect(formatRelativeTime(isoMinutesAgo(0.5))).toBe('ahora');
  });

  it('shows minutes under an hour', () => {
    expect(formatRelativeTime(isoMinutesAgo(5))).toBe('hace 5 min');
  });

  it('shows hours under a day', () => {
    expect(formatRelativeTime(isoMinutesAgo(60 * 3))).toBe('hace 3 h');
  });

  it('shows days under a month', () => {
    expect(formatRelativeTime(isoMinutesAgo(60 * 24 * 2))).toBe('hace 2 d');
  });

  it('shows months past 30 days', () => {
    expect(formatRelativeTime(isoMinutesAgo(60 * 24 * 40))).toBe('hace 1 m');
  });
});
