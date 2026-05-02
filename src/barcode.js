// src/barcode.js
import { getBarcodeFormat } from "./barcodeFormat.js";

export function renderBarcode(code) {
  const clean = String(code).trim();
  const format = getBarcodeFormat(clean);

  try {
    JsBarcode("#barcode", clean, {
      format,
      lineColor: "rgba(3, 3, 3, 1)",
      // --- CAMBIOS AQUÍ ---
      width: 1.5,        // Bajamos de 2 a 1.5 para que sea más angosto
      height: 70,       // Bajamos un poco la altura (estaba en 80)
      displayValue: true,
      fontSize: 14,      // Tamaño de fuente más limpio
      margin: 10,
      // --------------------
    });
  } catch (err) {
    console.error("🚫 Error al renderizar:", err);
    alert("🚫 Este código no se puede generar como código de barras.");
    document.getElementById("barcode").innerHTML = "";
  }
}