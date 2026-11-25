import { textures } from './studio-textures.js';
import { packTextures } from './pack-textures.js';

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


const studioEdit = {
  'maroon-knit-polo': ['Maroon Knit Polo', -614, -237, 363, -16, 18],
  'black-graphic-tee': ['Black Graphic Tee', -442, -163, 338, 21, 0],
  'plaid-shirt': ['Plaid Shirt', 14, -410, 363, 38, 1],
  'blue-knit-polo': ['Blue Cable Knit Polo', 332, -337, 280, 28, 2],
  'brown-knit-polo': ['Brown Knit Polo', 627, -163, 272, -18, 0],
  'brown-jacket': ['Brown Jacket', 748, 76, 324, 17, 14],
  'cream-knit-polo': ['Cream Knit Polo', -805, 94, 289, 13, 2],
  'washed-graphic-tee': ['Washed Graphic Tee', -508, 297, 355, 24, 1],
  'blue-denim': ['Blue Denim', -25, 316, 409, 26, 2, true],
  'brown-jeans': ['Brown Jeans', 510, 418, 392, 14, 3, true],
  'charcoal-graphic-tee': ['Charcoal Graphic Tee', 1110, -478, 345, -14, 1]
};

export const studioGarments = Object.entries(studioEdit).map(([id, [name,,,,,,bottoms]]) => ({
  name, file: 'pack-' + id, studioAsset: id, bottoms,
  image: 'assets/studio/pack-' + id + '.webp'
}));

const exploration = {
  maroon: [-1065,-505,325,-15], green: [686,-665,322,21],
  flight: [1220,-177,322,-12], coast: [-166,-1053,322,26],
  cornflower: [115,-776,298,-14], stripe: [1215,196,316,-15],
  pearl: [-1230,-180,320,15], fig: [-202,706,310,12],
  yard: [1160,574,342,-49], stallion: [252,1046,335,41],
  zigzag: [-287,-735,320,11], plum: [-1200,210,325,-19],
  cream: [229,-1082,292,23], brown: [245,694,329,-13],
  anchor: [-1100,640,340,34], ash: [912,395,298,-22],
  forest: [-978,380,310,20], wrath: [-174,1059,300,-12]
};

const prices = {
  maroon: 1500, green: 1500, flight: 1399, coast: 1799, pearl: 1399,
  fig: 1399, yard: 1899, stallion: 1499, stripe: 1750, cornflower: 1500,
  plum: 1399, cream: 1349, anchor: 1899, ash: 1699, forest: 1599, wrath: 1399
};
const amount = new Intl.NumberFormat('en-BD');
const cameraPiece = { x: 93, y: -40, width: 265, height: 191, angle: -.32 };
const bounds = { x: 1060, y: 582 };
const limit = (value, max) => Math.max(-max, Math.min(max, value));

function shutter(delay) {
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
  sound.start(context.currentTime + delay);
}

export function setupFloor(catalog, selectGarment, openRoom, finishRoom, fireFlash) {
  const floor = document.querySelector('#floor');
  const scene = document.querySelector('#floor-scene');
  const items = document.querySelector('#floor-garments');
  const label = document.querySelector('#hover-label');
  const camera = document.querySelector('#scene-camera');
  const cameraCaption = document.querySelector('.camera-caption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let drag, spring, active, chosen, studio, frame, transition;
  let x = 0;
  let y = 0;
  let hover = 0;
  let hoverTarget = 0;
  let hoverVelocity = 0;
  let lastFrame = 0;
  const pointer = { x: 0, y: 0 };
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
    const dt = Math.min((now - lastFrame) / 1000, .045);
    lastFrame = now;
    let progress = 0;
    let destination;
    if (spring) {
      const t = Math.max(0, Math.min((now - spring.start) / 630, 1));
      const settle = Math.exp(-7 * t) * (1 + 7 * t) * (1 - t);
      x = spring.x * settle;
      y = spring.y * settle;
      if (t === 1) spring = null;
    }
    if (transition) {
      transition.started ??= now;
      progress = Math.min((now - transition.started) / 1250, 1);
      if (progress >= .24 && !transition.flashed) {
        transition.flashed = true;
        fireFlash();
      }
      if (progress >= .65 && !transition.roomOpened) {
        transition.roomOpened = true;
        openRoom(null, transition.trigger, true);
      }
      if (transition.roomOpened) {
        const bounds = document.querySelector('.camera-back').getBoundingClientRect();
        destination = {
          x: (bounds.left + bounds.width / 2 - width / 2) / scale,
          y: (height / 2 - bounds.top - bounds.height / 2) / scale,
          scale: Math.min(bounds.width / 151, bounds.height / 221) / scale
        };
        document.body.style.setProperty('--room-reveal', Math.min((progress - .65) / .3, 1));
      }
    }
    const offset = hover - hoverTarget;
    const frequency = 17;
    const slope = hoverVelocity + frequency * offset;
    const decay = Math.exp(-frequency * dt);
    hover = hoverTarget + (offset + slope * dt) * decay;
    hoverVelocity = (hoverVelocity - frequency * slope * dt) * decay;
    if (reduced.matches || Math.abs(hoverTarget - hover) < .003 && Math.abs(hoverVelocity) < .02) {
      hover = hoverTarget;
      hoverVelocity = 0;
    }
    scene.style.transform = 'translate(' + (-x * scale) + 'px,' + (-y * scale) + 'px) scale(' + scale + ')';
    floor.style.setProperty('--floor-x', -x * scale + 'px');
    floor.style.setProperty('--floor-y', -y * scale + 'px');
    floor.classList.toggle('camera-hovered', hover > .08);
    if (width && height && !floor.closest('[hidden]')) studio?.render(x, y, hover, pointer, progress, destination);
    if (transition && progress === 1) {
      transition = null;
      hover = hoverTarget = 0;
      hoverVelocity = 0;
      x = y = 0;
      floor.classList.remove('is-entering');
      studio?.dock(document.querySelector('.camera-back'));
      finishRoom();
    }
    if (spring || transition || hover !== hoverTarget) requestDraw();
  }

  function resize() {
    width = floor.clientWidth;
    height = floor.clientHeight;
    if (!width || !height) return;
    scale = width / height < .87
      ? Math.max(width / 1260, height / 1350)
      : Math.max(width / 1672, height / 970);
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
    if (drag?.moved || transition) return;
    active = button;
    label.querySelector('strong').textContent = garment.brand || garment.name;
    label.querySelector('span').textContent = garment.brand ? garment.name : '';
    label.querySelector('small').textContent = garment.studioAsset ? 'Editorial garment' : prices[garment.file]
      ? '৳' + amount.format(prices[garment.file]) : 'See retailer for price';
    label.hidden = false;
    positionLabel(button, event);
  }

  function hideLabel() {
    active = null;
    label.hidden = true;
  }

  const pieces = catalog.map((garment) => {
    const placement = garment.studioAsset ? studioEdit[garment.studioAsset].slice(1) : exploration[garment.file];
    const [x, y, width, angle, stack = 0] = placement;
    const { aspect, outline } = garment.studioAsset ? packTextures[garment.studioAsset] : textures[garment.file];
    const piece = { file: garment.file, x, y, width, height: width / aspect, angle: angle * Math.PI / 180, stack };
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'floor-garment';
    button.style.zIndex = stack;
    button.setAttribute('aria-label', garment.brand
      ? garment.name + ', ' + garment.brand + ', ' + (prices[garment.file] ? amount.format(prices[garment.file]) + ' taka' : 'see retailer for price')
      : garment.name);
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
      if (performance.now() < suppressClickUntil || transition) return;
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
  camera.addEventListener('pointermove', (event) => {
    const rect = camera.getBoundingClientRect();
    pointer.x = limit((event.clientX - rect.left) * 2 / rect.width - 1, 1);
    pointer.y = limit((event.clientY - rect.top) * 2 / rect.height - 1, 1);
    requestDraw();
  });
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
      if (performance.now() < suppressClickUntil || transition) return;
      hideLabel();
      const animate = !reduced.matches && studio?.available;
      try { shutter(animate ? .3 : 0); } catch { /* Audio availability must not block entry. */ }
      if (!animate) {
        openRoom(null, trigger);
      } else {
        spring = null;
        transition = { trigger };
        floor.classList.add('is-entering');
        setHover(0);
      }
    });
  }

  floor.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || transition) return;
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
    const horizontalGain = Math.max(1 / scale, bounds.x / (width * .79));
    const verticalGain = Math.max(1 / scale, bounds.y / (height * .72));
    x = limit(drag.x - dx * horizontalGain, bounds.x);
    y = limit(drag.y - dy * verticalGain, bounds.y);
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
    if (!floor.contains(event.relatedTarget) && !transition && (x || y)) resetView();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideLabel();
      if (!transition && (x || y)) resetView();
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
  return {
    restoreStudio() {
      studio?.undock();
      resize();
    }
  };
}
