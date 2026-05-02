// src/barcode.js
import { getBarcodeFormat } from "./barcodeFormat.js";

export function renderBarcode(code) {
  const clean = String(code).trim();
  const format = getBarcodeFormat(clean);

  try {
    JsBarcode("#barcode", clean, {
      format,
      lineColor: "rgba(3, 3, 3, 1)",
      width: 1.7,           // Grosor optimizado para que no se desborde
      height: 70,          // Altura balanceada
      displayValue: true,   // Muestra los números abajo
      fontSize: 15,         // Tamaño de números legible
      margin: 10,           // Espacio interno
      background: "#ffffff" // Fondo blanco puro para contraste
    });
  } catch (err) {
    console.error("🚫 Error al renderizar:", err);
    alert("🚫 Este código no se puede generar como código de barras.");
    document.getElementById("barcode").innerHTML = "";
  }
}