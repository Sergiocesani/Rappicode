// src/barcode.js
import { getBarcodeFormat } from "./barcodeFormat.js";

export function renderBarcode(code) {
  const clean = String(code).trim();
  const format = getBarcodeFormat(clean);

  const isMobile = window.innerWidth < 600;

  try {
    JsBarcode("#barcode", clean, {
      format,
      lineColor: "#000",
      width: isMobile ? 1.5 : 1.8,   // 🔥 control fino
      height: isMobile ? 60 : 70,    // 🔥 tamaño equilibrado
      displayValue: true,
      fontSize: isMobile ? 14 : 16,
      margin: 6,
    });
  } catch (err) {
    console.error("🚫 Error al renderizar:", err);
    alert("🚫 Este código no se puede generar como código de barras.");
    document.getElementById("barcode").innerHTML = "";
  }
}