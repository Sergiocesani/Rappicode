import { findSku } from './api.js';
import { renderBarcode } from './barcode.js';

// ─── Elementos del DOM ────────────────────────────────────────────────────────
const input         = document.getElementById('eanInput');
const button        = document.getElementById('generateBtn');
const resultSection = document.getElementById('result');
const skuName       = document.getElementById('skuName');
const barcode       = document.getElementById('barcode');
const fullEan       = document.getElementById('fullEan');
const skuImage      = document.getElementById('skuImage');

// ─── Función principal ────────────────────────────────────────────────────────
async function buscarYMostrar () {
  const digits = input.value.trim();

  console.clear();
  console.log(`🔍 Buscando SKU con terminación: ${digits}`);

  // Validación del input
  if (digits.length !== 6 || !/^\d{6}$/.test(digits)) {
    alert('❌ Ingresá exactamente 6 dígitos numéricos.');
    return;
  }

  // 1) Buscar el SKU en inventory.json (vía findSku)
  const sku = await findSku(digits);

  if (sku) {
    console.log('✅ SKU encontrado:', sku);

    skuName.textContent = sku.name;
    fullEan.textContent = sku.ean;

    // 2) Buscar la imagen correspondiente en images.json
    try {
      const imageResponse = await fetch('./images.json');
      const imageData     = await imageResponse.json();
      const matchImage    = imageData.find(item => item.ean === sku.ean);

      if (matchImage && matchImage.image) {
        skuImage.src   = matchImage.image;
        skuImage.alt   = sku.name;
        skuImage.style.display = 'block';
      } else {
        skuImage.src   = '';
        skuImage.alt   = '';
        skuImage.style.display = 'none';
      }
    } catch (err) {
      console.error('Error cargando images.json:', err);
      skuImage.style.display = 'none';
    }

    // 3) Renderizar el código de barras (EAN13, EAN8 o CODE128)
    renderBarcode(sku.ean);

    // 4) Mostrar la sección de resultados
    resultSection.classList.remove('hidden');
  } else {
    console.warn('❌ No se encontró ningún SKU con esos dígitos.');
    resultSection.classList.add('hidden');
    alert('❌ No se encontró ningún producto con esos 6 dígitos.');
  }
}

// ─── Listeners ────────────────────────────────────────────────────────────────
button.addEventListener('click', buscarYMostrar);
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') buscarYMostrar();
});
