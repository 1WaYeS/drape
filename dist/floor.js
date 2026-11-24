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
  { file: 'cornflower', name: 'Cornflower Blue Cable Knit Polo', brand: gorur, source: gg + 'braided-cable-knit-polo-in-cornflower-blue/', description: 'cornflower blue open-collar braided cable knit polo' }
];

// Coordinates refer to the 1672 × 941 flat-lay plate.
const regions = {
  maroon: [35, 77, 390, 324, '0% 37%, 12% 14%, 57% 0%, 77% 3%, 83% 8%, 100% 80%, 61% 92%, 20% 100%'],
  flight: [257, 87, 313, 387, '10% 78%, 52% 62%, 29% 0%, 63% 14%, 83% 16%, 100% 31%, 67% 100%'],
  coast: [648, 0, 441, 315, '0% 49%, 25% 0%, 100% 0%, 76% 43%, 56% 89%, 31% 100%, 12% 87%'],
  cornflower: [991, 0, 332, 292, '0% 66%, 41% 0%, 91% 0%, 100% 26%, 51% 100%'],
  green: [1184, 155, 300, 366, '0% 39%, 47% 0%, 82% 5%, 100% 24%, 63% 31%, 31% 100%'],
  stripe: [1274, 247, 398, 413, '0% 69%, 24% 6%, 51% 0%, 100% 29%, 100% 61%, 81% 100%'],
  pearl: [0, 354, 227, 312, '0% 0%, 26% 0%, 52% 19%, 100% 31%, 63% 100%, 0% 84%'],
  fig: [78, 504, 442, 420, '0% 64%, 38% 0%, 55% 0%, 62% 13%, 92% 26%, 100% 38%, 64% 100%'],
  yard: [524, 498, 575, 443, '0% 43%, 13% 1%, 39% 17%, 45% 12%, 100% 51%, 80% 100%, 42% 88%'],
  stallion: [1106, 600, 515, 341, '0% 100%, 32% 0%, 70% 20%, 100% 24%, 100% 100%']
};
const prices = {
  maroon: 1500, green: 1500, flight: 1399, coast: 1799, pearl: 1399,
  fig: 1399, yard: 1899, stallion: 1499, stripe: 1750, cornflower: 1500
};
const amount = new Intl.NumberFormat('en-BD');

export function setupFloor(catalog, selectGarment, openRoom) {
  const floor = document.querySelector('#floor');
  const scene = document.querySelector('#floor-scene');
  const items = document.querySelector('#floor-garments');
  const label = document.querySelector('#hover-label');
  const camera = document.querySelector('#scene-camera');
  const cameraCaption = document.querySelector('.camera-caption');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let drag;
  let x = 0;
  let y = 0;
  let spring;
  let active;
  let suppressClickUntil = 0;
  let chosen;

  function positionLabel(button, event) {
    const rect = button.getBoundingClientRect();
    const atPointer = event?.pointerType === 'mouse' && event.type !== 'focus';
    const anchorX = atPointer ? event.clientX : (rect.left + rect.right) / 2;
    const anchorY = atPointer ? event.clientY : (rect.top + rect.bottom) / 2;
    const left = Math.max(8, Math.min(innerWidth - label.offsetWidth - 8, anchorX + 16));
    const top = Math.max(8, Math.min(innerHeight - label.offsetHeight - 8, anchorY + 16));
    label.style.left = `${left}px`;
    label.style.top = `${top}px`;
  }

  function showLabel(button, garment, event) {
    if (drag?.moved) return;
    active = button;
    label.querySelector('strong').textContent = garment.brand;
    label.querySelector('span').textContent = garment.name;
    label.querySelector('small').textContent = prices[garment.file]
      ? `৳${amount.format(prices[garment.file])}` : 'See retailer for price';
    label.hidden = false;
    positionLabel(button, event);
  }

  function hideLabel() {
    active = null;
    label.hidden = true;
  }

  for (const garment of catalog) {
    const [left, top, width, height, shape] = regions[garment.file];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'floor-garment';
    button.setAttribute('aria-label', `${garment.name}, ${garment.brand}, ${prices[garment.file] ? `${amount.format(prices[garment.file])} taka` : 'see retailer for price'}`);
    Object.assign(button.style, {
      left: `${left / 16.72}%`, top: `${top / 9.41}%`,
      width: `${width / 16.72}%`, height: `${height / 9.41}%`,
      clipPath: `polygon(${shape})`
    });
    button.addEventListener('pointerenter', (event) => showLabel(button, garment, event));
    button.addEventListener('pointermove', (event) => {
      if (active === button && !drag?.moved && event.pointerType === 'mouse') positionLabel(button, event);
    });
    button.addEventListener('pointerleave', () => {
      if (document.activeElement !== button && active === button) hideLabel();
    });
    button.addEventListener('focus', (event) => showLabel(button, garment, event));
    button.addEventListener('blur', () => { if (active === button) hideLabel(); });
    button.addEventListener('click', () => {
      if (performance.now() < suppressClickUntil) return;
      chosen?.removeAttribute('aria-pressed');
      chosen = button;
      button.setAttribute('aria-pressed', 'true');
      selectGarment(garment);
      showLabel(button, garment);
    });
    items.append(button);
  }

  function activateCamera(event) {
    if (performance.now() < suppressClickUntil) return;
    hideLabel();
    openRoom(event);
  }
  camera.addEventListener('click', activateCamera);
  cameraCaption.addEventListener('click', (event) => {
    if (performance.now() < suppressClickUntil) {
      event.stopImmediatePropagation();
      return;
    }
    hideLabel();
  }, { capture: true });

  const update = () => { scene.style.transform = `translate3d(${x}px,${y}px,0)`; };
  floor.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    if (spring) {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(scene).transform);
      x = matrix.m41;
      y = matrix.m42;
      spring.cancel();
      spring = null;
      update();
    }
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
      hideLabel();
    }
    const horizontalRange = Math.max(240, (scene.offsetWidth - floor.clientWidth) / 1.44);
    x = Math.max(-horizontalRange, Math.min(horizontalRange, drag.x + dx * .72));
    y = drag.y + Math.max(-190, Math.min(190, dy)) * .72;
    update();
  });
  function finish(event) {
    if (drag?.id !== event.pointerId) return;
    const moved = drag.moved;
    drag = null;
    if (!moved) return;
    floor.classList.remove('is-dragging');
    suppressClickUntil = performance.now() + 250;
    if (floor.hasPointerCapture(event.pointerId)) floor.releasePointerCapture(event.pointerId);
    if (!reduced.matches) {
      spring = scene.animate([
        { transform: `translate3d(${x}px,${y}px,0)` },
        { transform: `translate3d(${-x * .06}px,${-y * .06}px,0)`, offset: .72 },
        { transform: 'translate3d(0,0,0)' }
      ], { duration: 740, easing: 'cubic-bezier(.18,.7,.3,1)' });
    }
    x = 0;
    y = 0;
    update();
  }
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') hideLabel(); });

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
