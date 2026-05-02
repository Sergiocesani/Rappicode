// src/barcode.js
import { getBarcodeFormat } from "./barcodeFormat.js";

export function renderBarcode(code) {
  const clean = String(code).trim();
  const format = getBarcodeFormat(clean);

  try {
    JsBarcode("#barcode", clean, {
      format,
      lineColor: "rgba(3, 3, 3, 1)",
      width: 2,
      height: 80,
      displayValue: true,
    });
  } catch (err) {
    console.error("🚫 Error al renderizar:", err);
    alert("🚫 Este código no se puede generar como código de barras.");
    document.getElementById("barcode").innerHTML = "";
  }
}