export function renderBarcode(code) {
  code = code.trim();

  function isValidEAN13(code) {
    if (!/^\d{13}$/.test(code)) return false;
    const digits = code.split('').map(Number);
    const checksum = digits
      .slice(0, 12)
      .reduce((sum, d, i) => sum + d * (i % 2 === 0 ? 1 : 3), 0);
    const checkDigit = (10 - (checksum % 10)) % 10;
    return checkDigit === digits[12];
  }

  let format;

  if (/^\d{13}$/.test(code) && isValidEAN13(code)) {
    format = "EAN13";
  } else if (/^\d{8}$/.test(code)) {
    format = "EAN8";
  } else {
    format = "CODE128";
  }

  JsBarcode("#barcode", code, {
    format: format,
    lineColor: "#f60",
    width: 2,
    height: 80,
    displayValue: true,
  });
}









