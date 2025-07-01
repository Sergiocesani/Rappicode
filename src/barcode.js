export function renderBarcode(code) {
  code = String(code).trim(); // Fuerza string y elimina espacios

  let format;

  // Definir formato según longitud del código
  if (/^\d{13}$/.test(code)) {
    format = "EAN13";
  } else if (/^\d{8}$/.test(code)) {
    format = "EAN8";
  } else if (/^\d{12,14}$/.test(code)) {
    // EAN inválido para JsBarcode, pero lo mostramos como CODE128
    format = "CODE128";
  } else {
    format = "CODE128";
  }

  try {
    JsBarcode("#barcode", code, {
      format: format,
      lineColor: "#f60",
      width: 2,
      height: 80,
      displayValue: true,
      valid: function (valid) {
        if (!valid) {
          alert("❌ El código ingresado no es válido para su formato.");
        }
      },
    });
  } catch (err) {
    console.error("❌ Error al generar código de barras:", err);
    alert("❌ Falló la generación del código de barras.");
  }
}










