// Locale-aware date / number / currency formatting (T59). Pass the BCP-47 tag
// from getT().intlLocale (server) or useIntlLocale() (client).

export function formatDate(
  value: string | number | Date,
  intlLocale: string,
  opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string {
  return new Date(value).toLocaleDateString(intlLocale, opts);
}

export function formatDateTime(value: string | number | Date, intlLocale: string): string {
  return new Date(value).toLocaleString(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(
  value: number,
  intlLocale: string,
  opts: Intl.NumberFormatOptions = {},
): string {
  return value.toLocaleString(intlLocale, opts);
}

export function formatPercent(fraction: number, intlLocale: string): string {
  return fraction.toLocaleString(intlLocale, {
    style: "percent",
    maximumFractionDigits: 0,
  });
}

/** CAD in the given locale (fr-CA renders "1 234,56 $"). */
export function formatCurrency(
  value: number,
  intlLocale: string,
  opts: Intl.NumberFormatOptions = {},
): string {
  return Math.abs(value).toLocaleString(intlLocale, {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
    ...opts,
  });
}
