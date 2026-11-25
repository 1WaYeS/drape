import { products } from './fitting-products.js';

const room = document.querySelector('#fitting');
const find = selector => room.querySelector(selector);
const video = find('video');
const uploaded = find('.uploaded');
const panel = find('.camera-panel');
const status = find('.room-status');
const shutter = new Audio('assets/zero/shutter.mp3');
shutter.preload = 'auto';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const photoList = [];
const categories = ['All', 'T-Shirts', 'Polo', 'Shirts', 'Sweaters', 'Bottoms', 'Jackets'];
let source, stream, mediaRequest = 0, facing = 'user', photoIndex = 0, uploadUrl;
let selected = 0, category = 'All', brand = '', transitioning = false;
const money = price => '৳ ' + price.toLocaleString('en-US');

function playShutter() {
  shutter.currentTime = 0;
  shutter.play().catch(() => {});
  if (!reduced.matches) find('.shutter-flash').animate([{opacity: 0, background: 'white'}, {opacity: 1, background: 'white', offset: .18}, {opacity: 0, background: 'white'}], 165);
}

async function transitionFlash(swap, origin) {
  if (reduced.matches) { swap(); return; }
  const flash = find('.shutter-flash');
  const { x, y } = origin;
  flash.style.setProperty('--flash-x', x + 'px');
  flash.style.setProperty('--flash-y', y + 'px');
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const cover = flash.animate([
    { '--flash-reach': '0px', opacity: .35 },
    { '--flash-reach': radius * 1.37 + 'px', opacity: 1 }
  ], {duration: 100, easing: 'cubic-bezier(.17,.55,.33,1)', fill:'forwards'});
  await cover.finished;
  swap();
  const reach = radius * 1.37 + 'px';
  const reveal = flash.animate([{opacity:1, '--flash-reach':reach}, {opacity:1,offset:.14, '--flash-reach':reach}, {opacity:0, '--flash-reach':reach}], {duration:530,easing:'ease-out',fill:'forwards'});
  cover.cancel();
  await reveal.finished;
  reveal.cancel();
}

export async function openFitting(button) {
  if (room.open || transitioning) return;
  transitioning = true;
  source = button;
  const rect = button.getBoundingClientRect();
  const origin = {x: rect.left + rect.width * .70, y: rect.top + rect.height * .25};
  room.showModal();
  shutter.currentTime = 0;
  shutter.play().catch(() => {});
  await transitionFlash(() => {
    source.closest('.float').style.visibility = 'hidden';
    room.classList.add('entered','ready');
  }, origin);
  transitioning = false;
  find('[data-action=close]').focus();
}

async function closeFitting() {
  if (transitioning || !room.open) return;
  transitioning = true;
  stopMedia();
  closePanel();
  URL.revokeObjectURL(uploadUrl);
  uploadUrl = undefined;
  uploaded.removeAttribute('src');
  uploaded.hidden = true;
  find('[data-action=capture]').disabled = true;
  await transitionFlash(() => {
    room.classList.remove('ready','entered','expanded');
    find('[data-action=expand]').textContent = 'Expand';
    find('[data-action=expand]').setAttribute('aria-pressed','false');
    source.closest('.float').style.visibility = '';
  }, {x: innerWidth / 2, y: innerHeight / 2});
  room.close();
  source.focus({preventScroll:true});
  transitioning = false;
}

function stopMedia() {
  mediaRequest++;
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  video.srcObject = null;
  video.hidden = true;
  find('[data-action=webcam]').textContent = 'Enable camera';
  find('[data-action=switch]').disabled = true;
  find('[data-action=capture]').disabled = uploaded.hidden;
  status.textContent = '';
}

async function startMedia() {
  stopMedia();
  const request = mediaRequest;
  try {
    const next = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:facing},width:{ideal:1280}},audio:false});
    if (request !== mediaRequest || !room.open) {
      next.getTracks().forEach(track => track.stop());
      return;
    }
    stream = next;
    video.srcObject = stream;
    uploaded.hidden = true;
    video.hidden = false;
    find('[data-action=webcam]').textContent = 'Turn camera off';
    find('[data-action=capture]').disabled = false;
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    if (request === mediaRequest) find('[data-action=switch]').disabled = devices.filter(device => device.kind === 'videoinput').length < 2;
  } catch (error) {
    if (request !== mediaRequest) return;
    status.textContent = error.name === 'NotAllowedError'
      ? 'Camera access was denied. You can upload an image instead.'
      : 'A camera is unavailable. You can upload an image instead.';
  }
}

const brands = find('.brands');
brands.append(new Option('All Brands',''), ...[...new Set(products.map(product => product.brand))].map(name => new Option(name,name)));
brands.addEventListener('change', () => {
  brand = brands.value;
  catalogue();
});
function catalogue() {
  const matchesBrand = product => !brand || product.brand === brand;
  const available = categories.filter(name => name === 'All' || products.some(product => matchesBrand(product) && product.category === name));
  if (!available.includes(category)) category = 'All';
  find('.filters').innerHTML = available.map(name => `<button data-category="${name}" aria-pressed="${name===category}">${name}</button>`).join('');
  const cards = products.flatMap((product, index) => {
    if (!matchesBrand(product) || (category !== 'All' && category !== product.category)) return [];
    return [`<article class="product-card">
      <button class="product-photo" data-product="${index}" aria-label="Select ${product.name}">
        <img src="${product.image}" alt="" decoding="async">
      </button>
      <div class="product-meta">
        <small>${product.brand}</small>
        <a href="${product.url}" target="_blank" rel="noopener">${product.name}</a>
        <div class="product-actions">
          <span>${money(product.price)}</span>
          <button data-try-on="${index}" aria-label="Try on ${product.name} (prototype)">Try On</button>
        </div>
      </div>
    </article>`];
  });
  find('.catalogue').innerHTML = cards.join('');
  updateCatalogueSelection();
}
function updateCatalogueSelection() {
  room.querySelectorAll("[data-product]").forEach(button => {
    button.setAttribute("aria-pressed", Number(button.dataset.product) === selected);
  });
}
catalogue();

function openPanel(title, content) {
  panel.innerHTML = `<button data-action="back">← Back</button><h2>${title}</h2>${content}`;
  panel.hidden = false;
  panel.querySelector('button').focus();
}
function closePanel() { panel.hidden = true; }

function showPhotos() {
  const photo = photoList[photoIndex];
  openPanel('Playback', photo ? `<img src="${photo}" alt="Captured preview"><p>Photo ${photoIndex + 1} of ${photoList.length}</p>
    <button data-action="previous">Previous</button> <button data-action="next">Next</button>
    <button data-action="delete-photo" aria-label="Delete photo" title="Delete photo">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg>
    </button>` : '<p>No photos captured yet.</p>');
}

function capture() {
  const image = uploaded.hidden ? video : uploaded;
  const width = image.videoWidth || image.naturalWidth;
  const height = image.videoHeight || image.naturalHeight;
  if (!width || !height) return;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (image === video) { context.translate(width,0); context.scale(-1,1); }
  context.drawImage(image,0,0);
  photoIndex = photoList.push(canvas.toDataURL('image/jpeg',.88)) - 1;
  playShutter();
  status.textContent = 'Photo captured. Open Playback to review it.';
}

find('input[type=file]').addEventListener('change', event => {
  const input = event.currentTarget;
  if (!input.files[0]) return;
  stopMedia();
  URL.revokeObjectURL(uploadUrl);
  uploadUrl = URL.createObjectURL(input.files[0]);
  uploaded.src = uploadUrl;
  uploaded.hidden = false;
  find('[data-action=capture]').disabled = false;
  input.value = '';
});

const sizeFields = [['height','Height (cm)',80,250],['weight','Weight (kg)',25,350],['chest','Chest (cm)',40,230],['waist','Waist (cm)',40,230]];
const options = values => values.map(value => `<option>${value}</option>`).join('');
const actions = {
  close: closeFitting,
  webcam: () => stream ? stopMedia() : startMedia(),
  switch: () => { facing = facing === 'user' ? 'environment' : 'user'; startMedia(); },
  capture,
  expand: button => {
    const expanded = room.classList.toggle('expanded');
    button.textContent = expanded ? 'Restore' : 'Expand';
    button.setAttribute('aria-pressed', expanded);
  },
  confirm: () => { closePanel(); status.textContent = products[selected].name + ' selected. Live clothing replacement is a prototype.'; },
  size: () => openPanel('Find My Size', `<form data-form="size">
    ${sizeFields.map(([id,label,min,max]) => `<label>${label}<input name="${id}" type="number" min="${min}" max="${max}" required></label>`).join('')}
    <label>Preferred fit<select name="fit">${options(['Slim','Regular','Oversized'])}</select></label>
    <button>Suggest a size</button></form><output></output>`),
  look: () => openPanel('Complete the Look', `<p>Style ${products[selected].name}</p><form data-form="look">
    <label>Occasion<select name="occasion">${options(['Everyday','Evening','Weekend'])}</select></label>
    <label>Style<select name="style">${options(['Minimal','Relaxed','Statement'])}</select></label>
    <label>Colours<select name="colour">${options(['Any','Neutral','Colourful'])}</select></label>
    <label>Budget (BDT)<input name="budget" type="number" min="0" value="5000" required></label>
    <button>Build outfit</button></form><output></output>`),
  playback: showPhotos,
  'delete-photo': () => {
    if (!photoList.length) return;
    photoList.splice(photoIndex, 1);
    photoIndex = Math.max(0, Math.min(photoIndex, photoList.length - 1));
    showPhotos();
    panel.querySelector('[data-action="delete-photo"]')?.focus();
  },
  previous: () => { photoIndex = (photoIndex + photoList.length - 1) % photoList.length; showPhotos(); },
  next: () => { photoIndex = (photoIndex + 1) % photoList.length; showPhotos(); },
  back: () => { closePanel(); find('[data-action=playback]').focus(); }
};
room.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || transitioning) return;
  if (button.dataset.category) {
    category = button.dataset.category;
    room.querySelectorAll('[data-category]').forEach(tab => tab.setAttribute('aria-pressed', tab === button));
    catalogue();
    find('[data-category][aria-pressed=true]').focus();
  } else if (button.dataset.product !== undefined) {
    selected = Number(button.dataset.product);
    updateCatalogueSelection();
  } else if (button.dataset.tryOn !== undefined) {
    selected = Number(button.dataset.tryOn);
    updateCatalogueSelection();
    actions.confirm();
  } else actions[button.dataset.action]?.(button);
});
const hardware = find('.hardware');
let hardwareMask;
function hitsHardware(event) {
  if (!hardware.naturalWidth) return false;
  const rect = hardware.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  if (x < 0 || y < 0 || x >= 1 || y >= 1) return false;
  if (!hardwareMask) {
    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = 236;
    hardwareMask = canvas.getContext('2d', {willReadFrequently:true});
    hardwareMask.drawImage(hardware, 0, 0, canvas.width, canvas.height);
  }
  return hardwareMask.getImageData(Math.floor(x * 420), Math.floor(y * 236), 1, 1).data[3] > 40;
}

let clickedBackdrop = false;
room.addEventListener('pointerdown', event => {
  clickedBackdrop = event.button === 0 && !event.target.closest('.lcd') && !hitsHardware(event);
});
room.addEventListener('click', event => {
  if (clickedBackdrop && !event.target.closest('.lcd') && !hitsHardware(event)) closeFitting();
  clickedBackdrop = false;
});
room.addEventListener('cancel', event => { event.preventDefault(); closeFitting(); });
room.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.target);
  const output = panel.querySelector('output');
  if (event.target.dataset.form === 'size') {
    const bottoms = products[selected].category === 'Bottoms';
    const measure = Number(data.get(bottoms ? 'waist' : 'chest')) + ({Slim:-4,Regular:0,Oversized:8})[data.get('fit')];
    const thresholds = bottoms ? [72,80,88,96,104] : [84,92,100,108,116];
    const size = ['XS','S','M','L','XL','XXL'][thresholds.filter(limit => measure > limit).length];
    output.textContent = 'Prototype estimate: '+size+'. Generic '+(bottoms?'waist':'chest')+' sizing with your fit preference. Verify against the brand chart.';
  } else {
    const wantsBottoms = productCategories[selected] !== 'Bottoms';
    const colour = data.get('colour');
    const neutral = [1,2,4,7];
    const preferred = data.get('occasion') === 'Evening' ? [7,1] : data.get('style') === 'Statement' ? [0,6,4] : [2,4,5];
    const result = products.map((product,index) => ({product,index}))
      .filter(({product,index}) => index !== selected && (product.category === 'Bottoms') === wantsBottoms
        && product.price <= Number(data.get('budget')) && (colour === 'Any' || neutral.includes(index) === (colour === 'Neutral')))
      .sort((a,b) => Number(preferred.includes(b.index))-Number(preferred.includes(a.index)));
    output.textContent = result.length ? result.slice(0,3).map(({product}) => product.name+' · '+money(product.price)).join(' / ') : 'No complementary items match these preferences.';
  }
});
