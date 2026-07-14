const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// event_date is a plain "YYYY-MM-DD" (no time component). Parsing it
// through `new Date(...)` reads it as UTC midnight, which a negative
// UTC-offset locale (Argentina) can then roll back a day when
// formatted — so this parses the string directly instead.
export function formatEventDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}
