import {
  BoxGeometry, BufferGeometry, CanvasTexture, Color, CylinderGeometry, EquirectangularReflectionMapping, Float32BufferAttribute,
  ExtrudeGeometry, Group, InstancedMesh, LatheGeometry, Mesh, MeshPhysicalMaterial, Object3D, PlaneGeometry,
  RepeatWrapping, Shape, SRGBColorSpace, Vector2
} from './vendor/three.module.min.js';

function canvas(width, height) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return [element, element.getContext('2d')];
}

function surface(kind) {
  const [image, context] = canvas(256, 256);
  context.fillStyle = kind === 'leather' ? '#58605a' : '#aaa';
  context.fillRect(0, 0, 256, 256);
  let seed = 29;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const leather = kind === 'leather';
  for (let i = 0; i < (leather ? 4400 : 1600); i++) {
    const x = random() * 256;
    const y = random() * 256;
    context.fillStyle = random() > .48 ? '#fff3' : '#0004';
    if (leather) {
      context.beginPath();
      context.ellipse(x, y, .5 + random() * 2.4, .4 + random() * 1.3, random() * 3, 0, Math.PI * 2);
      context.fill();
    } else {
      context.fillRect(x, y, 6 + random() * 70, .32);
    }
  }
  const map = new CanvasTexture(image);
  map.wrapS = map.wrapT = RepeatWrapping;
  return map;
}

export function studioReflections() {
  const [image, context] = canvas(512, 256);
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#c7bcb1');
  gradient.addColorStop(.42, '#696365');
  gradient.addColorStop(.65, '#3c3839');
  gradient.addColorStop(1, '#514940');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 256);
  context.filter = 'blur(6px)';
  context.fillStyle = '#fff3df';
  context.fillRect(24, 40, 119, 60);
  context.fillRect(207, 2, 139, 30);
  context.fillStyle = '#bbc9e0';
  context.fillRect(271, 51, 42, 76);
  context.fillStyle = '#e6d8bf';
  context.fillRect(408, 37, 60, 32);
  const texture = new CanvasTexture(image);
  texture.colorSpace = SRGBColorSpace;
  texture.mapping = EquirectangularReflectionMapping;
  return texture;
}

function roundedPanel(width, height, radius, depth, bevel) {
  const x = -width / 2;
  const y = -height / 2;
  const path = new Shape();
  path.moveTo(x + radius, y);
  path.lineTo(x + width - radius, y);
  path.quadraticCurveTo(x + width, y, x + width, y + radius);
  path.lineTo(x + width, y + height - radius);
  path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  path.lineTo(x + radius, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - radius);
  path.lineTo(x, y + radius);
  path.quadraticCurveTo(x, y, x + radius, y);
  const geometry = new ExtrudeGeometry(path, {
    depth, bevelEnabled: true, bevelSegments: 3, bevelSize: bevel, bevelThickness: bevel, curveSegments: 9
  });
  geometry.translate(0, 0, -depth / 2);
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) / 88, uv.getY(i) / 88);
  }
  return geometry;
}

function disc(radius, depth, segments = 64) {
  return new CylinderGeometry(radius, radius, depth, segments).rotateX(Math.PI / 2);
}

function labelTexture(width, height, paint) {
  const [image, context] = canvas(width, height);
  paint(context, width, height);
  const map = new CanvasTexture(image);
  map.colorSpace = SRGBColorSpace;
  return map;
}

function addKnurl(parent, geometry, material, radius, depth, count, rotation = 0) {
  const teeth = new InstancedMesh(geometry, material, count);
  const tooth = new Object3D();
  for (let i = 0; i < count; i++) {
    const angle = i * Math.PI * 2 / count;
    tooth.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, depth);
    tooth.rotation.z = angle + rotation;
    tooth.updateMatrix();
    teeth.setMatrixAt(i, tooth.matrix);
  }
  parent.add(teeth);
}

function coatedOptic() {
  const segments = 80;
  const shape = new BufferGeometry();
  // Add concentric rows so the optical surface has a true curved profile.
  const positions = [0, 0, 4.2];
  const uvs = [.5, .5];
  const indices = [];
  for (let ring = 1; ring <= 9; ring++) {
    const r = ring / 9;
    for (let i = 0; i < segments; i++) {
      const angle = i * Math.PI * 2 / segments;
      const x = Math.cos(angle) * 30.7 * r;
      const y = Math.sin(angle) * 30.7 * r;
      positions.push(x, y, 4.2 * (1 - r * r));
      uvs.push(.5 + x / 61.4, .5 + y / 61.4);
      const base = 1 + (ring - 1) * segments;
      const next = (i + 1) % segments;
      if (ring === 1) {
        indices.push(0, base + i, base + next);
      } else {
        indices.push(base + i - segments, base + i, base + next);
        indices.push(base + i - segments, base + next, base + next - segments);
      }
    }
  }
  shape.setAttribute('position', new Float32BufferAttribute(positions, 3));
  shape.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  shape.setIndex(indices);
  shape.computeVertexNormals();
  return shape;
}

export function createRangefinder() {
  const model = new Group();
  model.name = 'DЯAPE silver rangefinder';
  const material = (color, metalness, roughness, details = {}) =>
    new MeshPhysicalMaterial({ color: new Color(color), metalness, roughness, ...details });
  const brush = surface('metal');
  const grain = surface('leather');
  const silver = material('#e1dace', .81, .37, { roughnessMap: brush, bumpMap: brush, bumpScale: .09 });
  const chrome = material('#dfdbd2', .91, .19);
  const blackMetal = material('#222326', .77, .33, { clearcoat: .28 });
  const rubber = material('#1c1c1c', .1, .71);
  const leather = material('#242220', .05, .75, { bumpMap: grain, bumpScale: 1.4 });
  const coating = labelTexture(256, 256, (ctx) => {
    const tint = ctx.createRadialGradient(116, 111, 29, 129, 129, 127);
    tint.addColorStop(0, '#111619');
    tint.addColorStop(.32, '#172b25');
    tint.addColorStop(.51, '#30243a');
    tint.addColorStop(.68, '#11181d');
    tint.addColorStop(.82, '#23332f');
    tint.addColorStop(1, '#090b0d');
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#a5a5c15c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(128, 128, 103, 3.46, 5.91);
    ctx.stroke();
    const aperture = ctx.createRadialGradient(127, 125, 0, 130, 127, 46);
    aperture.addColorStop(0, '#050708');
    aperture.addColorStop(.73, '#0a0b11');
    aperture.addColorStop(1, '#17182600');
    ctx.fillStyle = aperture;
    ctx.fillRect(0, 0, 256, 256);
  });
  const glass = material('#bdc4c5', .25, .17, { map: coating, clearcoat: 1, clearcoatRoughness: .12, iridescence: .37 });
  const finderGlass = material('#202028', .38, .18, { clearcoat: 1, iridescence: .45 });
  const lettering = new MeshPhysicalMaterial({ color: 0xffffff, transparent: true, roughness: .75, depthWrite: false });
  const bolt = material('#6a6a63', .9, .31);

  function part(geometry, surface, x = 0, y = 0, z = 0, parent = model) {
    const mesh = new Mesh(geometry, surface);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  part(roundedPanel(216, 127, 11, 38, 2.2), silver);
  part(roundedPanel(216, 93, 8, 43.4, 1.2), leather, 0, -9);
  part(roundedPanel(214, 6, 2, 40, .62), silver, 0, -59);
  part(roundedPanel(215, 7, 2, 40, .7), silver, 0, 52);
  part(roundedPanel(79, 5, 1.5, 26, .7), blackMetal, -15, 65, -2);
  part(new BoxGeometry(28, 6, 20), chrome, -15, 65, -1);
  part(new BoxGeometry(21, 6.5, 13), blackMetal, -15, 66, -1);
  for (const x of [-110, 110]) {
    part(roundedPanel(8, 14, 3, 10, 1), chrome, x, 37, -6);
    part(roundedPanel(5, 7, 2, 1, .5), blackMetal, x, 37, 0);
  }

  const barrel = new Group();
  barrel.position.set(17, -12, 0);
  model.add(barrel);
  const profile = [[0, 20], [43,20], [48,22], [49,26], [47,28], [44,29], [44,38], [47,41], [47,48],
    [45,50], [43,51], [40,50], [39,47], [37,47], [36,39], [33,36], [0,36]];
  part(new LatheGeometry(profile.map(([r, z]) => new Vector2(r, z)), 96).rotateX(Math.PI / 2), blackMetal, 0, 0, 0, barrel);
  part(new LatheGeometry([[45,24],[49,24],[49,26],[46,27]].map(([r,z]) => new Vector2(r,z)), 96).rotateX(Math.PI / 2), chrome, 0, 0, 0, barrel);
  part(new LatheGeometry([[44,47],[46.3,48],[45,50],[43,50.5]].map(([r,z]) => new Vector2(r,z)), 96).rotateX(Math.PI / 2), silver, 0, 0, 0, barrel);
  addKnurl(barrel, new BoxGeometry(1.1, 2, 7), rubber, 44, 34, 84);
  part(disc(34, 2), blackMetal, 0, 0, 39, barrel);
  part(disc(31.5, 2), bolt, 0, 0, 40.2, barrel);
  part(coatedOptic(), glass, 0, 0, 42, barrel);
  const lensMarkings = labelTexture(256, 256, (ctx) => {
    ctx.translate(128, 128);
    ctx.fillStyle = '#ddd9cd';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    const letters = 'DЯAPE OPTICAL CO.   35MM  1:2.0  ';
    [...letters].forEach((letter, i) => {
      ctx.save();
      ctx.rotate(i * Math.PI * 2 / letters.length);
      ctx.fillText(letter, 0, -110);
      ctx.restore();
    });
  });
  part(new PlaneGeometry(87, 87), lettering.clone(), 0, 0, 50.9, barrel).material.map = lensMarkings;

  const frontMark = labelTexture(256, 32, (ctx) => {
    ctx.fillStyle = '#2c2b27';
    ctx.font = 'bold 23px system-ui';
    ctx.fillText('DЯAPE', 7, 25);
    ctx.font = '11px monospace';
    ctx.fillText('RANGEFINDER', 108, 23);
  });
  part(new PlaneGeometry(95, 12), lettering.clone(), -51, 53, 21.5).material.map = frontMark;
  part(roundedPanel(37, 20, 3, 4, .8), blackMetal, 76, 48, 20);
  part(roundedPanel(29, 14, 2, 1, .7), finderGlass, 76, 48, 23);
  part(roundedPanel(19, 11, 2, 2, .6), bolt, 32, 48, 20);
  part(roundedPanel(15, 7, 2, 1, .4), finderGlass, 32, 48, 21.6);
  for (const x of [-90, 97]) {
    part(disc(3.1, 1.4, 16), chrome, x, -53, 20.8);
    part(new BoxGeometry(3.8, .6, .4), blackMetal, x, -53, 21.7);
  }

  const dialTooth = new BoxGeometry(.85, 3.6, 1.3);
  for (const [x, radius, top] of [[-76, 15, 70], [55, 19, 73], [88, 11, 69]]) {
    const dial = new Group();
    dial.position.set(x, top, 0);
    dial.rotation.x = -Math.PI / 2;
    model.add(dial);
    part(disc(radius, 8), blackMetal, 0, 0, 0, dial);
    part(disc(radius - .75, 1.5), silver, 0, 0, 4, dial);
    part(disc(radius - 3.2, 1), blackMetal, 0, 0, 5, dial);
    addKnurl(dial, dialTooth, silver, radius, 0, 32, Math.PI / 2);
    const marks = labelTexture(96, 96, (ctx) => {
      ctx.fillStyle = '#e6e1d8';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.translate(48, 48);
      ['A', '125', '60', '30', '15', 'B'].forEach((value, i) => {
        ctx.save();
        ctx.rotate(i * Math.PI / 3);
        ctx.fillText(value, 0, -25);
        ctx.restore();
      });
    });
    part(new PlaneGeometry(radius * 1.65, radius * 1.65), lettering.clone(), 0, 0, 5.65, dial).material.map = marks;
  }
  part(disc(5.5, 2), chrome, -71, 44, 23);
  part(disc(1.8, 1), material('#744a25', .65, .39), -68, 37, 22);

  part(roundedPanel(149, 93, 5, 7, 1.2), blackMetal, -17, -7, -22);
  part(roundedPanel(139, 83, 4, 2, .55), finderGlass, -17, -7, -27);
  const lcd = labelTexture(384, 230, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#293b3d');
    gradient.addColorStop(1, '#12171b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#b8bbad';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(150, 73, 84, 84);
    ctx.fillStyle = '#eeede4';
    ctx.textAlign = 'center';
    ctx.font = 'bold 19px system-ui';
    ctx.fillText('DЯAPE', w / 2, 108);
    ctx.font = '11px monospace';
    ctx.fillText('LIVE VIEW', w / 2, 129);
    ctx.textAlign = 'left';
    ctx.fillText('1/125   F2.0', 16, 211);
    ctx.fillText('ISO 400', 313, 211);
  });
  const rearScreen = part(new PlaneGeometry(134, 79), lettering.clone(), -17, -7, -28.8);
  rearScreen.rotation.y = Math.PI;
  rearScreen.material.map = lcd;
  part(roundedPanel(29, 19, 4, 2, .9), rubber, -79, 46, -22);
  part(roundedPanel(21, 11, 2, 1, .6), finderGlass, -79, 46, -24);
  for (const y of [30, 8, -43]) part(disc(4.3, 3), silver, 77, y, -23);
  part(disc(13, 4.5, 56), rubber, 77, -17, -23);
  part(disc(8.5, 2), chrome, 77, -17, -26);
  part(disc(5.7, 1), blackMetal, 77, -17, -27.4);
  const grip = part(roundedPanel(36, 9, 3, 7, 1), rubber, 76, 49, -21);
  grip.rotation.z = -.1;

  model.traverse((object) => {
    if (object.isMesh) object.castShadow = true;
  });
  return model;
}

