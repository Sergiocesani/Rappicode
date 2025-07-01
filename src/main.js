import { findSku } from './api.js';
import { renderBarcode } from './barcode.js';

// Elementos del DOM
const input = document.getElementById('eanInput');
const button = document.getElementById('generateBtn');
const resultSection = document.getElementById('result');
const skuName = document.getElementById('skuName');
const barcode = document.getElementById('barcode');
const fullEan = document.getElementById('fullEan');

/**
 * Lógica principal: buscar SKU y mostrar resultados
 */
async function buscarYMostrar() {
  const digits = input.value.trim();

  console.clear(); // Limpia la consola cada vez que haces una búsqueda
  console.log(`🔍 Buscando SKU con terminación: ${digits}`);

  if (digits.length !== 6 || !/^\d{6}$/.test(digits)) {
    alert('❌ Ingresá exactamente 6 dígitos numéricos.');
    return;
  }

  const sku = await findSku(digits);

  if (sku) {
    console.log('✅ SKU encontrado:', sku);

    skuName.textContent = sku.name;
    fullEan.textContent = sku.ean;

    renderBarcode(sku.ean); // Este ya tiene validación interna
    resultSection.classList.remove('hidden');
  } else {
    console.warn('❌ No se encontró ningún SKU con esos dígitos.');
    resultSection.classList.add('hidden');
    alert('❌ No se encontró ningún producto con esos 6 dígitos.');
  }
}

// Escucha del botón
button.addEventListener('click', buscarYMostrar);

// También permitimos "Enter" desde el input
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    buscarYMostrar();
  }
});

