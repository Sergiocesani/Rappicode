import JsBarcode from 'jsbarcode';

/**
 * Verifica si el EAN es válido antes de intentar renderizar
 * @param {string} ean - Código EAN a renderizar
 */
export function renderBarcode(ean) {
  // Verificación básica
  if (!/^\d{13}$/.test(ean)) {
    console.warn(`❌ EAN inválido: "${ean}"`);
    alert('❌ Este producto no tiene un código EAN13 válido para generar código de barras.');
    return;
  }

  // Renderizamos con JsBarcode
  JsBarcode('#barcode', ean, {
    format: 'ean13',
    lineColor: '#fff',
    background: '#000',
    width: 2,
    height: 100,
    displayValue: true
  });
}
