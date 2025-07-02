export function renderBarcode(code) {
  code = String(code).trim();        // siempre como string, sin espacios

  // ——— Función para validar checksum EAN-13 ———
  function isValidEAN13(ean) {
    if (!/^\d{13}$/.test(ean)) return false;

    const digits = ean.split('').map(Number);
    const sum = digits
      .slice(0, 12)                  // primeros 12
      .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[12];
  }

  // ——— Elegir formato ———
  let format;
  if (isValidEAN13(code)) {
    format = "EAN13";                // 13 dígitos + checksum OK
  } else if (/^\d{8}$/.test(code)) {
    format = "EAN8";                 // 8 dígitos
  } else {
    format = "CODE128";              // todo lo demás
  }

  // ——— Renderizar ———
  try {
    JsBarcode("#barcode", code, {
      format,
      lineColor: "#f60",
      width: 2,
      height: 80,
      displayValue: true,
    });
  } catch (err) {
    console.error("🚫 Error al renderizar:", err);
    alert("🚫 Este código no se puede generar como código de barras.");
    document.getElementById("barcode").innerHTML = "";  // limpia  SVG
  }
}














