export function getMonthWindowStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
}

export function isSameMonthWindow(a?: Date | null, b = new Date()) {
  if (!a) {
    return false;
  }

  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

export function parseOptionalDate(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return new Date(`${value}T23:59:59.999Z`);
}

export function formatDate(date?: Date | null, locale = "en-US") {
  if (!date) {
    return locale.startsWith("ru") ? "Без срока" : "No expiry";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
