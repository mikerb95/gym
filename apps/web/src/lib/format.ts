const decimal = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

/** Cifras en formato colombiano: coma decimal y punto de miles. */
export function fmt(value: number): string {
  return decimal.format(value);
}
