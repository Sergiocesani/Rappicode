export function renderBarcode(code) {
  code = String(code).trim(); // Asegura tipo string y sin espacios

  let format;
  if (/^\d{13}$/.test(code)) {
    format = "EAN13";
  } else if (/^\d{8}$/.test(code)) {
    format = "EAN8";
  } else if (/^\d+$/.test(code)) {
    format = "CODE128"; // Para cualquier otro numérico
  } else {
    alert("❌ Este EAN no se puede renderizar como código de barras.");
    return;
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
    console.error("❌ Error al renderizar el código de barras:", error);
    alert("❌ Este EAN no se puede renderizar como código de barras.");
  }
}













