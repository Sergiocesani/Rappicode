export function renderBarcode(code) {
  // Limpiar código (eliminar espacios)
  code = code.trim();

  let format = "CODE128";

  if (code.length === 13) format = "EAN13";
  else if (code.length === 8) format = "EAN8";

  JsBarcode("#barcode", code, {
    format: format,
    lineColor: "#f60",
    width: 2,
    height: 80,
    displayValue: true,
  });
}







