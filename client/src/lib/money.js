const ZAR_FORMAT = new Intl.NumberFormat('en-ZA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatZAR(cents) {
  return 'R ' + ZAR_FORMAT.format(cents / 100);
}

export function parseCentsFromInput(str) {
  if (!str) return NaN;

  let s = String(str).trim().replace(/^R\s*/, '');

  const hasDot = s.includes('.');
  const hasComma = s.includes(',');

  if (hasDot && hasComma) {
    // Both separators present: last one is decimal (e.g. '1,234.56' or '1.234,56')
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastDot > lastComma) {
      // dot is decimal separator → remove commas
      s = s.replace(/,/g, '');
    } else {
      // comma is decimal separator → remove dots, replace comma with dot
      s = s.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasComma) {
    // Only comma: treat as decimal separator (en-ZA convention)
    s = s.replace(/\s/g, '').replace(',', '.');
  } else {
    // Only dot or neither: remove spaces (thousands), dot is decimal
    s = s.replace(/\s/g, '');
  }

  const value = parseFloat(s);
  if (isNaN(value)) return NaN;
  return Math.round(value * 100);
}
