import { findSku } from './api.js';
import { renderBarcode } from './barcode.js';

const input = document.getElementById('eanInput');
const button = document.getElementById('generateBtn');
const resultSection = document.getElementById('result');
const skuName = document.getElementById('skuName');
const barcode = document.getElementById('barcode');
const fullEan = document.getElementById('fullEan');

async function buscarYMostrar() {
  const digits = input.value.trim();
  if (digits.length === 6) {
    const sku = await findSku(digits);
    if (sku) {
      skuName.textContent = sku.name;
      fullEan.textContent = sku.ean;
      renderBarcode(sku.ean);
      resultSection.classList.remove('hidden');
    } else {
      resultSection.classList.add('hidden');
      alert('❌ No se encontró ningún SKU con esos dígitos.');
    }
  }
}

// Evento al hacer click en el botón
button.addEventListener('click', buscarYMostrar);

