function renderBarcode(code) {
  code = code.trim();

  let format;

  if (/^\d{13}$/.test(code)) {
    format = "EAN13";
  } else if (/^\d{8}$/.test(code)) {
    format = "EAN8";
  } else {
    format = "CODE128"; // Usa CODE128 para códigos como 14 dígitos
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
    console.error("🚫 Error al generar código de barras:", error);
    alert("❌ No se pudo generar el código de barras para este EAN.");
  }
}










