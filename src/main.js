  import { findSku } from './api.js';
  import { renderBarcode } from './barcode.js';

  document.addEventListener('DOMContentLoaded', () => {

    console.log("🔥 main.js cargado y DOM listo");

    const input         = document.getElementById('eanInput');
    const button        = document.getElementById('generateBtn');
    const resultSection = document.getElementById('result');
    const skuName       = document.getElementById('skuName');
    const barcode       = document.getElementById('barcode');
    const fullEan       = document.getElementById('fullEan');
    const skuImage      = document.getElementById('skuImage');

    // --- Validación ---
    if (!input || !button || !resultSection) {
      console.error("❌ ERROR: Elementos no encontrados en el DOM");
      console.log({
        input,
        button,
        resultSection
      });
      return; // detiene el script antes del crash
    }

    async function buscarYMostrar () {
      const digits = input.value.trim();

      console.clear();
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

        try {
          const imgRes = await fetch('/images.json');
          const imgData = await imgRes.json();
          const matchImage = imgData.find(item => item.ean === sku.ean);

          if (matchImage && matchImage.image) {
            skuImage.src = matchImage.image;
            skuImage.style.display = 'block';
          } else {
            skuImage.style.display = 'none';
          }
        } catch (err) {
          console.error("Error cargando images.json:", err);
          skuImage.style.display = 'none';
        }

        renderBarcode(sku.ean);
        resultSection.classList.remove('hidden');
      } else {
        alert('❌ No se encontró ningún producto con esos 6 dígitos.');
        resultSection.classList.add('hidden');
      }
    }

    button.addEventListener('click', buscarYMostrar);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') buscarYMostrar();
    });

  });
