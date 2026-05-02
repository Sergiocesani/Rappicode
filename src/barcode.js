// src/barcode.js
import { getBarcodeFormat } from "./barcodeFormat.js";

export function renderBarcode(code) {
  const clean = String(code).trim();
  const format = getBarcodeFormat(clean);
  const barcodeElement = document.querySelector("#barcode");

  if (!barcodeElement) return;

  // Limpiamos el contenido previo para evitar que se duplique
  barcodeElement.innerHTML = "";
  
  // Creamos un elemento SVG nuevo y limpio
  const newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  newSvg.id = "barcode-svg";
  barcodeElement.appendChild(newSvg);

  try {
    JsBarcode("#barcode-svg", clean, {
      format,
      lineColor: "#000",
      width: 1.5,           // Grosor estándar profesional
      height: 60,          // Altura equilibrada
      displayValue: true,
      fontSize: 14,
      margin: 10,
      background: "#fff"
    });
  } catch (err) {
    console.error("🚫 Error al renderizar:", err);
    barcodeElement.innerHTML = "<p style='color:red'>Código no soportado</p>";
  }
}