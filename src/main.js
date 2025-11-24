import { renderBarcode } from './barcode.js';

let inventoryCache = null;
let imagesCache = null;

// --- Helpers para cargar JSON solo una vez ---
async function loadInventory() {
  if (!inventoryCache) {
    const res = await fetch('./inventory.json');
    inventoryCache = await res.json();
  }
  return inventoryCache;
}

async function loadImages() {
  if (!imagesCache) {
    const res = await fetch('./images.json');
    imagesCache = await res.json();
  }
  return imagesCache;
}

// --- Helper para elegir formato de código de barras ---
function getBarcodeFormat(code) {
  const str = String(code).trim();

  const isValidEAN13 = ean => {
    if (!/^\d{13}$/.test(ean)) return false;
    const digits = ean.split('').map(Number);
    const sum = digits
      .slice(0, 12)
      .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[12];
  };

  if (isValidEAN13(str)) return 'EAN13';
  if (/^\d{8}$/.test(str)) return 'EAN8';
  return 'CODE128';
}

// --- Pintar resultados múltiples en carrusel (igual concepto que en buscar.js) ---
function renderMultiResults(matches, images) {
  const multiContainer = document.getElementById('multiResult');
  const singleSection  = document.getElementById('result');

  // ocultamos el modo simple
  singleSection.classList.add('hidden');

  // limpiamos contenedor múltiple
  multiContainer.innerHTML = '';

  if (!matches.length) {
    multiContainer.innerHTML = '<p>No se encontraron productos.</p>';
    return;
  }

  // Contenedor del carrousel
  const carousel = document.createElement('div');
  carousel.classList.add('carousel');

  const prevBtn = document.createElement('button');
  prevBtn.classList.add('carousel-btn', 'carousel-btn-prev');
  prevBtn.textContent = '⟨';

  const nextBtn = document.createElement('button');
  nextBtn.classList.add('carousel-btn', 'carousel-btn-next');
  nextBtn.textContent = '⟩';

  const trackContainer = document.createElement('div');
  trackContainer.classList.add('carousel-track-container');

  const list = document.createElement('ul');
  list.classList.add('carousel-track');

  matches.forEach((item, index) => {
    const li = document.createElement('li');
    li.classList.add('result-item');
    if (index === 0) li.classList.add('active');

    const matchImage = images.find(img => img.ean === item.ean);
    const imgSrc = matchImage ? matchImage.image : '';

    li.innerHTML = `
      <div class="result-header">
        <p class="result-name"><strong>${item.name}</strong></p>
      </div>

      <div class="result-main">
        <div class="result-image-wrapper">
          ${
            imgSrc
              ? `<img src="${imgSrc}" alt="${item.name}" />`
              : `<div class="no-image">Sin imagen</div>`
          }
        </div>
        <div class="result-barcode-wrapper">
          <svg class="result-barcode"></svg>
        </div>
      </div>

      <p class="result-ean">EAN: ${item.ean}</p>
    `;

    list.appendChild(li);

    // Generar código de barras para este item
    const svg = li.querySelector('.result-barcode');
    const format = getBarcodeFormat(item.ean);

    try {
      JsBarcode(svg, String(item.ean), {
        format,
        lineColor: '#000000',
        width: 2.4,
        height: 90,
        displayValue: true,
        fontSize: 16
      });
    } catch (err) {
      console.error('Error generando código de barras para', item.ean, err);
    }
  });

  trackContainer.appendChild(list);
  carousel.appendChild(prevBtn);
  carousel.appendChild(trackContainer);
  carousel.appendChild(nextBtn);

  const counter = document.createElement('div');
  counter.classList.add('carousel-counter');
  counter.textContent = `1 / ${matches.length}`;

  multiContainer.appendChild(carousel);
  multiContainer.appendChild(counter);

  multiContainer.classList.remove('hidden');

  // --- Lógica de carrousel ---
  let currentIndex = 0;
  const items = list.querySelectorAll('.result-item');

  function updateActive() {
    items.forEach((item, idx) => {
      item.classList.toggle('active', idx === currentIndex);
    });
    counter.textContent = `${currentIndex + 1} / ${matches.length}`;
  }

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateActive();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < items.length - 1) {
      currentIndex++;
      updateActive();
    }
  });
}

// --- Modo simple: un solo SKU (como ya tenías) ---
async function renderSingleResult(sku) {
  const resultSection = document.getElementById('result');
  const multiContainer = document.getElementById('multiResult');

  const skuName  = document.getElementById('skuName');
  const fullEan  = document.getElementById('fullEan');
  const skuImage = document.getElementById('skuImage');

  // ocultar modo múltiple
  multiContainer.classList.add('hidden');
  multiContainer.innerHTML = '';

  skuName.textContent = sku.name;
  fullEan.textContent = sku.ean;

  try {
    const images = await loadImages();
    const matchImage = images.find(item => item.ean === sku.ean);

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

  // código de barras usando tu helper
  renderBarcode(sku.ean);

  resultSection.classList.remove('hidden');
}

// --- Función principal: decide si es 0, 1 o varios SKUs ---
document.addEventListener('DOMContentLoaded', () => {
  console.log("🔥 main.js cargado y DOM listo");

  const input         = document.getElementById('eanInput');
  const button        = document.getElementById('generateBtn');
  const resultSection = document.getElementById('result');

  if (!input || !button || !resultSection) {
    console.error("❌ ERROR: Elementos no encontrados en el DOM");
    return;
  }

  async function buscarYMostrar () {
    const digits = input.value.trim();

    console.clear();
    console.log(`🔍 Buscando SKU con terminación: ${digits}`);

    if (digits.length !== 6 || !/^\d{6}$/.test(digits)) {
      alert('❌ Ingresá exactamente 6 dígitos numéricos.');
      return;
    }

    const inventory = await loadInventory();

    // Buscamos TODOS los que comparten esos últimos 6
    const matches = inventory.filter(item =>
      String(item.ean).slice(-6) === digits || item.short === digits
    );

    if (matches.length === 0) {
      alert('❌ No se encontró ningún producto con esos 6 dígitos.');
      resultSection.classList.add('hidden');
      document.getElementById('multiResult').classList.add('hidden');
      return;
    }

    if (matches.length === 1) {
      console.log('✅ Un solo SKU coincide:', matches[0]);
      await renderSingleResult(matches[0]);
    } else {
      console.log(`✅ ${matches.length} SKUs comparten esos 6 dígitos.`);
      const images = await loadImages();
      renderMultiResults(matches, images);
    }
  }

  button.addEventListener('click', buscarYMostrar);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') buscarYMostrar();
  });
});
