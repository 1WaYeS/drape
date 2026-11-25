import { textures } from './studio-textures.js';

const gorur = 'Gorur Ghash';
const rebels = 'Wrongs & Rebels';
const gg = 'https://gorurghash.com/product/';
const wr = 'https://wrclo.com/products/';

export const extraGarments = [
  { file: 'pearl', name: 'Pearl Boxy T-Shirt', brand: rebels, source: wr + 'wr-pearl-boxy-tshirt', description: 'off-white boxy tee with a golden winged graphic and chest wordmark' },
  { file: 'fig', name: 'Light Wash Fig T-Shirt', brand: rebels, source: 'https://wrclo.com/collections/spring26', description: 'muted fig light-wash cotton crew-neck tee' },
  { file: 'yard', name: 'Yard Baggy Jeans', brand: rebels, source: wr + 'wr-yard-baggy-denim-pants' },
  { file: 'stallion', name: 'Black Stallion Baggy Jeans', brand: rebels, source: wr + 'w-r-black-stallion-baggy-denim-pant' },
  { file: 'stripe', name: 'Navy, Maroon and Cream Knit Polo', brand: gorur, source: gg + 'unisex-half-sleeve-knitted-polo-in-navy-maroon-and-cream/', description: 'knitted polo with a maroon collar and wide cream and navy vertical panels' },
  { file: 'cornflower', name: 'Cornflower Blue Cable Knit Polo', brand: gorur, source: gg + 'braided-cable-knit-polo-in-cornflower-blue/', description: 'cornflower blue open-collar braided cable knit polo' },
  { file: 'zigzag', name: 'Zigzag Knit Polo in Green', brand: gorur, source: 'https://gorurghash.com/product-category/men/polos/', description: 'green short-sleeve polo with a zigzag knit texture' },
  { file: 'plum', name: 'Light Wash Chocolate Plum T-Shirt', brand: rebels, source: wr + 'wr-light-wash-chocolate-plum-boxy-tshirt', description: 'chocolate plum cotton boxy tee with a subtly faded wash' },
  { file: 'cream', name: 'Vanilla Cream Boxy T-Shirt', brand: rebels, source: wr + 'w-r-vanilla-cream-boxy-t-shirt', description: 'vanilla cream boxy tee with dual chest logos' },
  { file: 'brown', name: 'Braided Cable Knit Polo in Brown', brand: gorur, source: gg + 'braided-cable-knit-polo-in-brown/', description: 'brown short-sleeve braided cable knit polo' },
  { file: 'anchor', name: 'Anchor Baggy Pants', brand: rebels, source: wr + 'wr-anchor-baggy-denim-pants', description: 'deep blue baggy denim pants with a soft yellow fade' },
  { file: 'ash', name: 'Grey Knit Collar Boxy T-Shirt', brand: rebels, source: wr + 'wr-grey-knit-collar-boxy-tshirt', description: 'grey boxy knit-collar tee with off-white Rebels lettering' },
  { file: 'forest', name: 'Forest Boxy Check Shirt', brand: rebels, source: wr + 'w-r-forest-boxy-check-shirt', description: 'green and yellow check shirt with a single chest pocket' },
  { file: 'wrath', name: 'Wrath Graphic T-Shirt', brand: rebels, source: wr + 'wr-wrath-graphic-boxy-tshirt', description: 'white boxy tee with a red Wrongs & Rebels mark on the chest' }
];


const placements = {
  maroon: [-490,-181,290,-16], flight: [-225,-142,244,16],
  coast: [-35,-306,285,26], cornflower: [250,-300,233,-15],
  green: [505,-230,269,21], stripe: [633,58,285,-15],
  pearl: [-652,95,272,16], fig: [-417,248,282,22],
  yard: [-78,282,312,-65], stallion: [413,324,287,27],
  zigzag: [-125,-665,290,11], plum: [-1050,-86,278,-23],
  cream: [1050,8,274,21], brown: [80,650,290,-13],
  anchor: [-1040,674,286,37], ash: [917,-610,288,-22],
  forest: [-921,-583,310,20], wrath: [908,605,290,-12]
};

const prices = {
  maroon: 1500, green: 1500, flight: 1399, coast: 1799, pearl: 1399,
  fig: 1399, yard: 1899, stallion: 1499, stripe: 1750, cornflower: 1500,
  plum: 1399, cream: 1349, anchor: 1899, ash: 1699, forest: 1599, wrath: 1399
};
const amount = new Intl.NumberFormat('en-BD');
const cameraPiece = { x: 111, y: -15, width: 230, height: 182, angle: 0 };
const limit = (value, max) => Math.max(-max, Math.min(max, value));

function shutter() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  const context = new Audio();
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .16), context.sampleRate);
  const signal = buffer.getChannelData(0);
  for (let i = 0; i < signal.length; i++) {
    const time = i / context.sampleRate;
    const first = Math.exp(-time * 160);
    const second = time >= .057 ? Math.exp(-(time - .057) * 115) : 0;
    signal[i] = (Math.random() * 2 - 1) * (first + .62 * second);
  }
  const sound = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const volume = context.createGain();
  filter.type = 'bandpass';
  filter.frequency.value = 1350;
  volume.gain.value = .43;
  sound.buffer = buffer;
  sound.connect(filter).connect(volume).connect(context.destination);
  sound.onended = () => context.close();
  sound.start();
}

export function setupFloor(catalog, selectGarment, openRoom) {
  const floor = document.querySelector('#floor');
  const scene = document.querySelector('#floor-scene');
  const items = document.querySelector('#floor-garments');
  const label = document.querySelector('#hover-label');
  const camera = document.querySelector('#scene-camera');
  const cameraCaption = document.querySelector('.camera-caption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let drag, spring, active, chosen, studio, frame, flipStarted, flipFinished, flipTrigger;
  let x = 0;
  let y = 0;
  let hover = 0;
  let hoverTarget = 0;
  let scale = 1;
  let width = 0;
  let height = 0;
  let suppressClickUntil = 0;

  function place(element, piece) {
    Object.assign(element.style, {
      left: piece.x + 'px', top: piece.y + 'px',
      width: piece.width + 'px', height: piece.height + 'px',
      rotate: piece.angle + 'rad'
    });
  }

  function requestDraw() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function draw(now) {
    frame = 0;
    let flip = 0;
    if (spring) {
      const t = Math.max(0, Math.min((now - spring.start) / 630, 1));
      const settle = Math.exp(-7 * t) * (1 + 7 * t) * (1 - t);
      x = spring.x * settle;
      y = spring.y * settle;
      if (t === 1) spring = null;
    }
    if (flipTrigger) {
      flipStarted ??= now;
      const t = Math.min((now - flipStarted) / 485, 1);
      flip = t * t * (3 - 2 * t);
      if (t === 1) flipFinished ??= now;
      if (flipFinished != null && now - flipFinished >= 85) {
        const trigger = flipTrigger;
        flipTrigger = null;
        hover = hoverTarget = 0;
        openRoom(null, trigger);
        flip = 0;
      }
    }
    hover += (hoverTarget - hover) * (reduced.matches ? 1 : .19);
    if (Math.abs(hoverTarget - hover) < .003) hover = hoverTarget;
    scene.style.transform = 'translate(' + (-x * scale) + 'px,' + (-y * scale) + 'px) scale(' + scale + ')';
    floor.style.setProperty('--floor-x', -x * scale + 'px');
    floor.style.setProperty('--floor-y', -y * scale + 'px');
    camera.style.setProperty('--flip', flip);
    camera.style.setProperty('--lift', hover);
    if (width && height && !floor.closest('[hidden]')) studio?.render(x, y, hover, flip);
    if (spring || flipTrigger || hover !== hoverTarget) requestDraw();
  }

  function resize() {
    width = floor.clientWidth;
    height = floor.clientHeight;
    if (!width || !height) return;
    scale = Math.max(width / 1530, height / 970);
    const narrow = width / scale < 680;
    cameraCaption.style.left = (narrow ? cameraPiece.x - 54 : cameraPiece.x + cameraPiece.width * .51) + 'px';
    cameraCaption.style.top = (cameraPiece.y + (narrow ? cameraPiece.height * .54 : 18)) + 'px';
    studio?.resize(width, height, scale);
    requestDraw();
  }

  function positionLabel(button, event) {
    const rect = button.getBoundingClientRect();
    const atPointer = event?.pointerType === 'mouse';
    const anchorX = atPointer ? event.clientX : (rect.left + rect.right) / 2;
    const anchorY = atPointer ? event.clientY : (rect.top + rect.bottom) / 2;
    const left = Math.max(8, Math.min(innerWidth - label.offsetWidth - 8, anchorX + 16));
    const top = Math.max(8, Math.min(innerHeight - label.offsetHeight - 8, anchorY + 16));
    label.style.left = left + 'px';
    label.style.top = top + 'px';
  }

  function showLabel(button, garment, event) {
    if (drag?.moved || flipTrigger) return;
    active = button;
    label.querySelector('strong').textContent = garment.brand;
    label.querySelector('span').textContent = garment.name;
    label.querySelector('small').textContent = prices[garment.file]
      ? '৳' + amount.format(prices[garment.file]) : 'See retailer for price';
    label.hidden = false;
    positionLabel(button, event);
  }

  function hideLabel() {
    active = null;
    label.hidden = true;
  }

  const pieces = catalog.map((garment) => {
    const [x, y, width, angle] = placements[garment.file];
    const { aspect, outline } = textures[garment.file];
    const piece = { file: garment.file, x, y, width, height: width / aspect, angle: angle * Math.PI / 180, bend: 3 + (width % 5) };
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'floor-garment';
    button.setAttribute('aria-label', garment.name + ', ' + garment.brand + ', ' +
      (prices[garment.file] ? amount.format(prices[garment.file]) + ' taka' : 'see retailer for price'));
    const cutout = document.createElement('span');
    cutout.className = 'garment-cutout';
    cutout.style.backgroundImage = 'url(assets/studio/' + garment.file + '.webp)';
    const hitArea = document.createElement('span');
    hitArea.className = 'garment-hit';
    hitArea.style.clipPath = 'polygon(' + outline + ')';
    button.append(cutout, hitArea);
    place(button, piece);
    button.addEventListener('pointerenter', (event) => showLabel(button, garment, event));
    button.addEventListener('pointermove', (event) => {
      if (active === button && !drag?.moved && event.pointerType === 'mouse') positionLabel(button, event);
    });
    button.addEventListener('pointerleave', () => { if (active === button) hideLabel(); });
    button.addEventListener('focus', (event) => {
      if (!button.matches(':focus-visible')) return;
      spring = null;
      const rect = button.getBoundingClientRect();
      if (rect.left < 0 || rect.right > innerWidth || rect.top < 0 || rect.bottom > innerHeight) {
        x = piece.x;
        y = piece.y;
        requestDraw();
        requestAnimationFrame(() => showLabel(button, garment, event));
      } else {
        showLabel(button, garment, event);
      }
    });
    button.addEventListener('blur', () => { if (active === button) hideLabel(); });
    button.addEventListener('click', () => {
      if (performance.now() < suppressClickUntil || flipTrigger) return;
      chosen?.removeAttribute('aria-pressed');
      chosen = button;
      button.setAttribute('aria-pressed', 'true');
      selectGarment(garment);
      showLabel(button, garment);
    });
    items.append(button);
    return piece;
  });

  place(camera, cameraPiece);
  for (const trigger of [camera, cameraCaption]) {
    const setHover = (value) => {
      hoverTarget = value;
      requestDraw();
    };
    trigger.addEventListener('pointerenter', () => { if (!drag?.moved) setHover(1); });
    trigger.addEventListener('pointerleave', () => setHover(0));
    trigger.addEventListener('focus', () => {
      if (!trigger.matches(':focus-visible')) return;
      x = y = 0;
      setHover(1);
    });
    trigger.addEventListener('blur', () => setHover(0));
    trigger.addEventListener('click', () => {
      if (performance.now() < suppressClickUntil || flipTrigger) return;
      hideLabel();
      try { shutter(); } catch { /* Audio availability must not block entry. */ }
      if (reduced.matches) {
        openRoom(null, trigger);
      } else {
        flipTrigger = trigger;
        flipStarted = flipFinished = null;
        setHover(0);
      }
    });
  }

  floor.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || flipTrigger) return;
    spring = null;
    drag = { id: event.pointerId, fromX: event.clientX, fromY: event.clientY, x, y, moved: false };
  });
  window.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return;
    const dx = event.clientX - drag.fromX;
    const dy = event.clientY - drag.fromY;
    if (!drag.moved && Math.hypot(dx, dy) < 7) return;
    if (!drag.moved) {
      drag.moved = true;
      floor.setPointerCapture(event.pointerId);
      floor.classList.add('is-dragging');
      hoverTarget = 0;
      hideLabel();
    }
    const horizontalGain = Math.max(1.3 / scale, 1050 / (width * .79));
    const verticalGain = Math.max(1.3 / scale, 730 / (height * .72));
    x = limit(drag.x - dx * horizontalGain, 1050);
    y = limit(drag.y - dy * verticalGain, 730);
    requestDraw();
  });

  function resetView() {
    if (reduced.matches) {
      x = y = 0;
    } else {
      spring = { x, y, start: performance.now() };
    }
    requestDraw();
  }

  function finish(event) {
    if (drag?.id !== event.pointerId) return;
    const moved = drag.moved;
    drag = null;
    if (!moved) return;
    floor.classList.remove('is-dragging');
    suppressClickUntil = performance.now() + 250;
    if (floor.hasPointerCapture(event.pointerId)) floor.releasePointerCapture(event.pointerId);
    resetView();
  }

  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
  floor.addEventListener('lostpointercapture', finish);
  floor.addEventListener('focusout', (event) => {
    if (!floor.contains(event.relatedTarget) && !flipTrigger && (x || y)) resetView();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideLabel();
      if (x || y) resetView();
    }
  });

  new ResizeObserver(resize).observe(floor);
  resize();
  import('./studio.js').then(({ createStudio }) => createStudio(floor, pieces, cameraPiece, requestDraw))
    .then((scene) => {
      studio = scene;
      resize();
    }).catch((error) => console.warn('WebGL studio unavailable. Using the layered floor.', error));

  const info = document.querySelector('#flat-info');
  const sections = {
    about: ['About Drape', 'Explore garments, try them on live, find your size and see what goes together.'],
    brands: ['For Brands', 'Drape gives fashion brands a virtual fitting room for their own garments.'],
    menu: ['Explore Drape', 'Open the fitting room to try a garment, upload your own, or get fit and styling guidance.']
  };
  document.querySelectorAll('[data-info]').forEach((button) => {
    button.addEventListener('click', () => {
      const [title, description] = sections[button.dataset.info];
      info.querySelector('h2').textContent = title;
      info.querySelector('p').textContent = description;
      info.showModal();
    });
  });
}
