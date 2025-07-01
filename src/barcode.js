export function renderBarcode(code) {
  code = String(code).trim(); // Asegura string limpio

  // Filtrar formato
  let format;

  if (/^\d{13}$/.test(code)) {
    format = "EAN13";
  } else if (/^\d{8}$/.test(code)) {
    format = "EAN8";
  } else if (/^\d{12}$/.test(code)) {
    // UPC-A (si querés incluirlo)
    format = "UPC";
  } else {
    format = "CODE128"; // Usa CODE128 para cualquier otro largo
  }

  // Si es EAN13 pero tiene 14 dígitos, recorta el primero
  if (format === "EAN13" && code.length === 14) {
    console.warn("⚠️ Código con 14 dígitos: usando los últimos 13 como EAN13");
    code = code.slice(1); // Elimina el primer dígito
  }

  try {
    JsBarcode("#barcode", code, {
      format: format,
      lineColor: "#f60",
      width: 2,
      height: 80,
      displayValue: true,
    });
  } catch (err) {
    console.error("❌ Error al generar código de barras:", err);
    alert("❌ Este EAN no se puede renderizar como código de barras.");
  }
}











