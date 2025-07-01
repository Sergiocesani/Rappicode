export function renderBarcode(code) {
  code = String(code).trim(); // Aseguramos string limpio

  let format;

  if (/^\d{13}$/.test(code)) {
    format = "EAN13";
  } else if (/^\d{8}$/.test(code)) {
    format = "EAN8";
  } else {
    format = "CODE128"; // ⚠️ cualquier otro caso, va como CODE128
  }

  console.log(`🔧 Código: ${code} | Formato: ${format}`); // Debug

  try {
    JsBarcode("#barcode", code, {
      format: format,
      lineColor: "#f60",
      width: 2,
      height: 80,
      displayValue: true,
    });
  } catch (error) {
    console.error("🚫 Error generando el código de barras:", error.message);
    alert("🚫 Código inválido para el formato seleccionado.");
  }
}












