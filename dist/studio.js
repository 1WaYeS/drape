import {
  CanvasTexture, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, OrthographicCamera,
  PlaneGeometry, RepeatWrapping, Scene, ShaderMaterial, SRGBColorSpace,
  TextureLoader, WebGLRenderer, AmbientLight, DirectionalLight, DoubleSide
} from './vendor/three.module.min.js';

const asset = (file) => 'assets/studio/' + file + '.webp';
const plane = new PlaneGeometry(1, 1);

function ground(map) {
  map.wrapS = map.wrapT = RepeatWrapping;
  return new Mesh(new PlaneGeometry(9000, 9000), new ShaderMaterial({
    uniforms: { cement: { value: map } },
    vertexShader: /* glsl */
      'varying vec2 floorXY; void main() { floorXY = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: /* glsl */
      'uniform sampler2D cement; varying vec2 floorXY;' +
      'float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }' +
      'float noise(vec2 p) { vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);' +
      'return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y); }' +
      'void main() {' +
      'vec2 p=floorXY; vec3 stone=texture2D(cement,p/530.).rgb;' +
      'float mottle=(noise(p/235.)-.5)*.06+(noise(p/63.)-.5)*.03+(noise(p/16.)-.5)*.015;' +
      'float sun=exp(-dot((p-vec2(-570.,425.))/vec2(1080.,740.),(p-vec2(-570.,425.))/vec2(1080.,740.)));' +
      'float pane=cos((p.x+p.y*.7)/47. + .8);' +
      'float light=sun*(.22+.035*smoothstep(-.8,-.12,pane));' +
      'gl_FragColor=vec4(stone*(.83+light)+mottle+light*vec3(.23,.17,.09),1.);' +
      '\n#include <colorspace_fragment>\n' +
      '}'
  }));
}

function shadowTexture(image, blur) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  context.filter = 'blur(' + blur + 'px) brightness(0)';
  context.drawImage(image, 14, 14, 100, 100);
  return new CanvasTexture(canvas);
}

function shadows(image, width, height) {
  return [[3.8, .37, 12, -15], [1.15, .59, 3, -4]].map(([blur, opacity, x, y]) => {
    const mesh = new Mesh(plane, new MeshBasicMaterial({
      map: shadowTexture(image, blur), color: 0x352a26, transparent: true, depthWrite: false, opacity
    }));
    mesh.scale.set(width * 1.28, height * 1.28, 1);
    mesh.position.set(x, y, 1);
    return mesh;
  });
}

function fabric(map, { width, height, bend, angle }) {
  const geometry = new PlaneGeometry(width, height, 28, 22);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const u = vertices.getX(i) / width;
    const v = vertices.getY(i) / height;
    const roll = Math.exp(-((v + .43) ** 2) / .004) * 5;
    const wrinkles = Math.sin(u * 18 + v * 9 + angle) * Math.cos(v * 9 - u * 4);
    vertices.setZ(i, 5 + roll + (1 + wrinkles) * bend);
    vertices.setX(i, vertices.getX(i) + 2 * Math.sin(v * 12 + angle));
  }
  geometry.computeVertexNormals();
  return new Mesh(geometry, new MeshLambertMaterial({ map, alphaTest: .44, alphaToCoverage: true }));
}

function cameraBack(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  const [width, height] = [canvas.width, canvas.height];
  const body = context.createLinearGradient(0, 15, 0, height - 10);
  body.addColorStop(0, '#898781');
  body.addColorStop(.24, '#3f3e39');
  body.addColorStop(.43, '#161815');
  body.addColorStop(.92, '#252521');
  body.addColorStop(1, '#74736b');
  context.save();
  context.translate(width * .49, height * .49);
  context.rotate(-.43);
  context.fillStyle = body;
  context.fillRect(-width, -height, width * 2, height * 2);
  context.fillStyle = '#090b09';
  context.roundRect(-85, -38, 144, 102, 6);
  context.fill();
  context.fillStyle = '#252c26';
  context.fillRect(-76, -29, 126, 81);
  context.strokeStyle = '#6d7565';
  context.strokeRect(-29, -6, 29, 29);
  context.fillStyle = '#aaa99f';
  context.font = 'bold 11px system-ui';
  context.fillText('DЯAPE', -81, 79);
  for (const y of [-18, 13, 43]) {
    context.beginPath();
    context.arc(86, y, 7, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
  context.globalCompositeOperation = 'destination-in';
  context.drawImage(image, 0, 0);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return map;
}

export async function createStudio(floor, pieces, cameraPiece, draw) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.domElement.className = 'studio-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const world = new Scene();
  const view = new OrthographicCamera(0, 0, 0, 0, 1, 4000);
  view.position.z = 1500;
  const sun = new DirectionalLight(0xffebd5, 1.18);
  sun.position.set(-420, 520, 740);
  world.add(new AmbientLight(0xf1f5ff, 1.13), sun);
  const loader = new TextureLoader();

  async function load(file) {
    const texture = await loader.loadAsync(asset(file));
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    return texture;
  }

  const [cement, cameraMap, ...maps] = await Promise.all([
    load('cement'), load('camera'), ...pieces.map(({ file }) => load(file))
  ]).catch((error) => {
    renderer.dispose();
    throw error;
  });
  world.add(ground(cement));
  pieces.forEach((piece, i) => {
    const object = new Group();
    object.position.set(piece.x, -piece.y, 0);
    const rotated = new Group();
    rotated.rotation.z = -piece.angle;
    rotated.add(fabric(maps[i], piece));
    const layers = shadows(maps[i].image, piece.width, piece.height);
    for (const layer of layers) {
      const { x, y } = layer.position;
      layer.position.set(0, 0, 1);
      const anchor = new Group();
      anchor.position.set(x, y, 0);
      anchor.rotation.z = -piece.angle;
      anchor.add(layer);
      object.add(anchor);
    }
    object.add(rotated);
    world.add(object);
  });

  const { x, y, width, height } = cameraPiece;
  const body = new Group();
  body.position.set(x, -y, 12);
  const cameraGeometry = new PlaneGeometry(width, height);
  const front = new Mesh(cameraGeometry, new MeshBasicMaterial({ map: cameraMap, alphaTest: .48, alphaToCoverage: true, side: DoubleSide }));
  const back = new Mesh(cameraGeometry, new MeshBasicMaterial({ map: cameraBack(cameraMap.image), alphaTest: .48, alphaToCoverage: true, side: DoubleSide }));
  front.position.z = 7;
  back.position.z = -7;
  // Thin silhouette layers give the existing camera face a visible body as it turns.
  for (const z of [-5, -2, 1, 4]) {
    const edge = new Mesh(cameraGeometry, new MeshBasicMaterial({ map: cameraMap, color: 0x514b42, alphaTest: .48, side: DoubleSide }));
    edge.position.z = z;
    body.add(edge);
  }
  body.add(front, back);
  const cameraShadows = shadows(cameraMap.image, width, height);
  world.add(body, ...cameraShadows);
  floor.prepend(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    floor.classList.remove('has-studio');
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    floor.classList.add('has-studio');
    draw();
  });
  floor.classList.add('has-studio');

  return {
    resize(width, height, scale) {
      renderer.setSize(width, height, false);
      view.left = -width / scale / 2;
      view.right = -view.left;
      view.top = height / scale / 2;
      view.bottom = -view.top;
      view.updateProjectionMatrix();
    },
    render(panX, panY, hover, flip) {
      view.position.x = panX;
      view.position.y = -panY;
      const lift = hover * 9 + Math.sin(flip * Math.PI) * 32;
      body.position.z = 12 + lift;
      body.position.y = -y + hover * 11 + lift * .25;
      body.rotation.set(-hover * .24 + flip * Math.PI, hover * .21, hover * .07);
      body.scale.setScalar(1 + hover * .055 + flip * .23);
      for (const [i, shadow] of cameraShadows.entries()) {
        shadow.position.set(x + (i ? 3 : 12) + lift * .43, -y - (i ? 4 : 15) - lift * .32, 1);
        shadow.scale.set(width * 1.28 * (1 + lift / 240), height * 1.28 * (1 + lift / 240) * Math.max(.18, Math.abs(Math.cos(body.rotation.x))), 1);
        shadow.material.opacity = (i ? .59 : .37) * (1 - lift / 100);
      }
      renderer.render(world, view);
    }
  };
}
