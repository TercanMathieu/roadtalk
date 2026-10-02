const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

export function formatRideDate(startedAtMs: number): string {
  return DATE_FORMATTER.format(new Date(startedAtMs));
}
