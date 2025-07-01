import JsBarcode from "jsbarcode";

export function renderBarcode(code) {
  let format = "CODE128";

  // Detectar el formato según la longitud del código
  if (code.length === 13) {
    format = "EAN13";
  } else if (code.length === 8) {
    format = "EAN8";
  } else if (code.length < 6 || code.length > 20) {
    console.error("❌ Código inválido para generar código de barras:", code);
    return; // No intentar generar código de barras
  }

  try {
    JsBarcode("#barcode", code, {
      format: format,
      lineColor: "#f60",
      width: 2,
      height: 80,
      displayValue: true,
    });
  } catch (error) {
    console.error("❌ Error al generar código de barras:", error.message);
  }
}






