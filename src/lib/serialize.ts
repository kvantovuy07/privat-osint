export function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
