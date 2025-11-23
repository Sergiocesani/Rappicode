let inventoryCache = null;
let imagesCache = null;

// --- Helpers para cargar JSON ---
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

// --- Pintar resultados en pantalla ---
function renderResults(results, images) {
  const container = document.getElementById('searchResults');
  container.innerHTML = '';

  if (!results.length) {
    container.innerHTML = '<p>No se encontraron productos.</p>';
    return;
  }

  const list = document.createElement('ul');

  results.forEach(item => {
    const li = document.createElement('li');
    li.classList.add('result-item');

    const matchImage = images.find(img => img.ean === item.ean);
    const imgSrc = matchImage ? matchImage.image : '';

    li.innerHTML = `
  <div class="result-header">
    <p class="result-name"><strong>${item.name}</strong></p>
  </div>

  <div class="result-main">
    <div class="result-image-wrapper">
      <img src="${imgSrc}" alt="${item.name}" />
    </div>
    <div class="result-barcode-wrapper">
      <svg class="result-barcode"></svg>
    </div>
  </div>

  <p class="result-ean">EAN: ${item.ean}</p>
`;

    list.appendChild(li);

    // Generar el código de barras para este item
    const svg = li.querySelector('.result-barcode');
const format = getBarcodeFormat(item.ean);

try {
  JsBarcode(svg, String(item.ean), {
    format,
    lineColor: '#000000',
    width: 2.4,      // un poco más ancho por “línea”
    height: 90,      // más alto
    displayValue: true,
    fontSize: 16     // texto del EAN más grande
  });
} catch (err) {
  console.error('Error generando código de barras para', item.ean, err);
}

  });

  container.appendChild(list);
}

// --- Función principal de búsqueda ---
async function buscar() {
  const raw = document.getElementById('searchInput').value.trim();
  const term = raw.toLowerCase();

  if (!raw) {
    alert('Escribí algo para buscar.');
    return;
  }

  const inventory = await loadInventory();
  const images = await loadImages();

  let results = [];

  // Si son exactamente 6 dígitos → buscar por últimos 6 del EAN
  if (/^\d{6}$/.test(raw)) {
    results = inventory.filter(item =>
      String(item.ean).slice(-6) === raw
    );
  } else {
    // Buscar por nombre (al menos 3 letras)
    if (term.length < 3) {
      alert('Escribí al menos 3 letras para buscar por nombre.');
      return;
    }

    results = inventory.filter(item =>
      item.name &&
      item.name.toLowerCase().includes(term)
    );
  }

  renderResults(results, images);
}

// --- Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('searchBtn');
  const input = document.getElementById('searchInput');

  btn.addEventListener('click', buscar);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') buscar();
  });
});
