export function getMonthRange(reference = new Date()) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  return { start: toISO(start), end: toISO(end) };
}

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
