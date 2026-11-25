import { setupFloor, extraGarments } from './floor.js';

const $ = (selector) => document.querySelector(selector);
const home = $('#home');
const room = $('#room');
const mirror = $('#mirror');
const status = $('#status');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const modelName = 'lucy-vton-3.6';
const poloChart = [38, 40, 42, 44, 46].map((chest, i) => [['S','M','L','XL','XXL'][i], chest * 2.54]);
const boxyChart = (sizes, halfChest) => sizes.map((size, i) => [size, 2 * halfChest[i]]);
const gorur = 'Gorur Ghash';
const rebels = 'Wrongs & Rebels';
const catalog = [
  { name: 'Maroon Diamond Knit Polo', brand: gorur, file: 'maroon', chart: poloChart,
    source: 'https://gorurghash.com/product/diamond-knit-polo-in-maroon/',
    description: 'maroon short-sleeve diamond-knit polo with a folded collar and ribbed hem',
    looks: ['Stone pleated trousers', 'Dark straight-leg jeans', 'Cream canvas sneakers'] },
  { name: 'Bottle Green Diamond Knit Polo', brand: gorur, file: 'green', chart: poloChart,
    source: 'https://gorurghash.com/product/diamond-knit-polo-in-bottle-green/',
    description: 'bottle-green short-sleeve diamond-knit polo, open notch collar and ribbed cuffs',
    looks: ['Beige chinos', 'Ecru straight-leg denim', 'Dark brown loafers'] },
  { name: 'Flight Boxy T-Shirt', brand: rebels, file: 'flight',
    chart: boxyChart(['XS','S','M','L','XL','XXL'], [54,56,58,60,62,64]),
    source: 'https://wrclo.com/products/wr-flight-boxy-tshirt-black',
    description: 'black boxy cotton crew-neck tee with small Pegasus and brand prints on the chest',
    looks: ['Light wash wide-leg jeans', 'Charcoal cargo trousers', 'Black canvas sneakers'] },
  { name: 'Coast Boxy Shirt', brand: rebels, file: 'coast',
    chart: boxyChart(['S','M','L','XL'], [56,59,62,64]),
    source: 'https://wrclo.com/products/wr-coast-boxy-check-shirt',
    description: 'brown long-sleeve boxy check shirt with lighter brown checks and a single chest pocket',
    looks: ['Taupe wide-leg trousers', 'Faded black denim', 'Cream low-top sneakers'] }
];
catalog.push(...extraGarments);
let selected = catalog[0];
let tool = null;
let stream = null;
let realtime = null;
let generation = 0;
let revision = 0;
let queue = Promise.resolve();
let previousFocus;
let previousScroll = 0;

function openRoom(event, trigger = event.currentTarget) {
  if (!room.hidden) return;
  previousFocus = trigger;
  previousScroll = scrollY;
  $('#flat-info').close();
  document.body.classList.add('in-room');
  home.hidden = true;
  room.hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
  $('#room-heading').focus({ preventScroll: true });
  if (!motion.matches) {
    const flash = $('#flash');
    flash.classList.remove('fire');
    void flash.offsetWidth;
    flash.classList.add('fire');
  }
}

function stopCamera() {
  generation++;
  realtime?.disconnect();
  realtime = null;
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
  mirror.srcObject = null;
  mirror.hidden = true;
  $('#view-label').hidden = true;
  $('#standby').hidden = false;
  $('#start').disabled = false;
  $('#stop').hidden = true;
  status.textContent = 'Enable your camera when you’re ready. Live try-on sends your video to Decart.';
}

document.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', openRoom));
$('#back').addEventListener('click', () => {
  stopCamera();
  room.hidden = true;
  home.hidden = false;
  window.scrollTo({ top: previousScroll, behavior: 'instant' });
  previousFocus?.focus({ preventScroll: true });
  document.body.classList.remove('in-room');
});
$('#stop').addEventListener('click', stopCamera);
addEventListener('pagehide', stopCamera);

function showMirror(media, isLocal) {
  mirror.srcObject = media;
  mirror.classList.toggle('local', isLocal);
  mirror.hidden = false;
  $('#standby').hidden = true;
  $('#view-label').hidden = false;
  $('#view-label').textContent = isLocal ? 'Camera preview' : 'Live try-on';
}

async function referenceImage(garment) {
  if (garment.upload) return garment.upload;
  const response = await fetch(`assets/${garment.file}.jpg`);
  if (!response.ok) throw new Error('Garment image unavailable.');
  return new File([await response.blob()], `${garment.file}.jpg`, { type: 'image/jpeg' });
}

function applyGarment() {
  const current = realtime;
  if (!current) return;
  const garment = selected;
  const update = ++revision;
  status.textContent = `Applying ${garment.name}…`;
  queue = queue.catch(() => {}).then(async () => {
    if (current !== realtime || update !== revision) return;
    const image = await referenceImage(garment);
    if (current !== realtime || update !== revision) return;
    await current.set({
      image, enhance: false,
      prompt: garment.file === 'yard' || garment.file === 'stallion'
        ? 'Replace the current trousers with the reference denim jeans. Preserve the person, top and background.'
        : garment.description
        ? `Replace the current top with the reference ${garment.description}. Preserve the person, pose and background.`
        : 'Apply the visible reference garment to the person. Preserve garment details, pose and background.'
    });
    if (current === realtime && update === revision) {
      status.textContent = `Trying on ${garment.name}. Step back to bring your shoulders and waist into frame.`;
    }
  }).catch(() => {
    if (current === realtime && update === revision) status.textContent = 'This garment could not be applied. Select it again to retry.';
  });
}

async function startCamera() {
  if (stream || $('#start').disabled) return;
  const session = ++generation;
  $('#start').disabled = true;
  status.textContent = 'Waiting for camera permission…';
  try {
    const camera = await navigator.mediaDevices?.getUserMedia({
      audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    if (!camera) throw new Error('Camera not available');
    if (session !== generation) {
      camera.getTracks().forEach((track) => track.stop());
      return;
    }
    stream = camera;
    camera.getVideoTracks()[0].addEventListener('ended', () => {
      if (session === generation) {
        stopCamera();
        status.textContent = 'The camera disconnected. Enable it again to continue.';
      }
    });
    showMirror(camera, true);
    $('#stop').hidden = false;
    status.textContent = 'Connecting live try-on…';
    const response = await fetch('/api/realtime-token', { method: 'POST' });
    if (session !== generation) return;
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || 'Live try-on is unavailable in this preview.');
    }
    const { apiKey } = await response.json();
    const { createDecartClient, models } = await import('./decart.js');
    if (session !== generation) return;
    const connection = await createDecartClient({ apiKey }).realtime.connect(camera, {
      model: models.realtime(modelName), mirror: 'auto',
      onRemoteStream: (remote) => { if (session === generation) showMirror(remote, false); }
    });
    if (session !== generation) {
      connection.disconnect();
      return;
    }
    realtime = connection;
    queue = Promise.resolve();
    applyGarment();
  } catch (error) {
    if (session !== generation) return;
    if (stream) {
      status.textContent = `${error.message || 'Live try-on is temporarily unavailable.'} Showing your unedited webcam.`;
    } else {
      status.textContent = 'Camera unavailable. Allow webcam access and try again.';
      $('#start').disabled = false;
    }
  }
}
$('#start').addEventListener('click', startCamera);

function selectGarment(garment) {
  selected = garment;
  $('#selection').textContent = `Selected: ${garment.name}`;
  [...$('#garments').children].forEach((button, index) => {
    button.setAttribute('aria-pressed', String(catalog[index] === garment));
  });
  renderTool();
  applyGarment();
}

for (const garment of catalog) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'garment';
  button.innerHTML = `<img src="assets/${garment.file}.jpg" alt=""><span>${garment.name}</span><small>${garment.brand}</small>`;
  button.addEventListener('click', () => selectGarment(garment));
  $('#garments').append(button);
}

$('#upload').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    $('#selection').textContent = 'Choose a JPG, PNG or WebP file under 10 MB.';
    return;
  }
  selectGarment({ name: file.name, upload: file });
});

function renderTool() {
  const panel = $('#tool-panel');
  $('#size').setAttribute('aria-expanded', String(tool === 'size'));
  $('#style').setAttribute('aria-expanded', String(tool === 'style'));
  panel.hidden = !tool;
  if (!tool) return;
  if (tool === 'size') {
    if (!selected.chart) {
      panel.innerHTML = '<h3>Find My Size</h3><p>A retailer size chart is needed for this garment. Choose a demo piece to try sizing.</p>';
      return;
    }
    panel.innerHTML = `<h3>Find My Size</h3><form><label>Body chest circumference (cm)
      <input name="chest" required type="number" min="45" max="220" step=".1" inputmode="decimal" placeholder="e.g. 96">
      </label><button class="pill primary">Estimate my size</button><output aria-live="polite"></output></form>
      <p><a href="${selected.source}" target="_blank" rel="noopener noreferrer">View the brand’s size chart</a></p>`;
    panel.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      const chest = Number(new FormData(event.target).get('chest'));
      const ease = selected.brand === gorur ? 5 : 12;
      const chart = selected.chart;
      const result = chart.find(([, width]) => width >= chest + ease);
      panel.querySelector('output').textContent = !result || chart[0][1] - chest > ease + 12
        ? 'Your measurement falls outside this estimate. Check the retailer’s size chart for fit guidance.'
        : `Size ${result[0]} is a starting point. Its garment chest is ${Math.round(result[1])} cm.`;
    });
    return;
  }
  if (!selected.looks) {
    panel.innerHTML = '<h3>Complete the Look</h3><p>Pick a color direction for your uploaded garment.</p><label>Palette<select><option>Neutral</option><option>Dark</option><option>Warm</option></select></label><ul></ul>';
    const ideas = { Neutral: ['Stone straight-leg trousers', 'White canvas sneakers'],
      Dark: ['Washed black jeans', 'Black leather sneakers'],
      Warm: ['Tobacco chinos', 'Cream low-top sneakers'] };
    const palette = panel.querySelector('select');
    const update = () => { panel.querySelector('ul').innerHTML = ideas[palette.value].map((item) => `<li>${item}</li>`).join(''); };
    palette.addEventListener('change', update);
    update();
    return;
  }
  panel.innerHTML = `<h3>Complete the Look</h3><p>Pair ${selected.name} with:</p><ul>
      <li>${selected.looks[0]} for a tailored look</li><li>${selected.looks[1]} for a casual look</li>
      <li>${selected.looks[2]} to finish either outfit</li></ul>`;
}

for (const name of ['size', 'style']) {
  $(`#${name}`).addEventListener('click', () => {
    tool = tool === name ? null : name;
    renderTool();
  });
}
selectGarment(selected);

setupFloor(catalog, selectGarment, openRoom);

