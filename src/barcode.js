export function renderBarcode(code) {
  // Limpiar código (eliminar espacios)
  code = code.trim();

let format;

if (/^\d{13}$/.test(code)) {
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







