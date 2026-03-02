// src/barcodeFormat.js
export function getBarcodeFormat(code) {
  const str = String(code ?? "").trim();

  const isValidEAN13 = (ean) => {
    if (!/^\d{13}$/.test(ean)) return false;
    const digits = ean.split("").map(Number);
    const sum = digits
      .slice(0, 12)
      .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[12];
  };

  if (isValidEAN13(str)) return "EAN13";
  if (/^\d{8}$/.test(str)) return "EAN8";
  return "CODE128";
}