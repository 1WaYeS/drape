import {
  AmbientLight, CanvasTexture, DirectionalLight, Euler, Group, HemisphereLight, Mesh,
  MeshBasicMaterial, OrthographicCamera, PlaneGeometry, Quaternion, RepeatWrapping, Scene,
  ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3, WebGLRenderer
} from './vendor/three.module.min.js';
import { createRangefinder, studioReflections } from './rangefinder.js';

const asset = (file) => 'assets/studio/' + file + '.webp';
const plane = new PlaneGeometry(1, 1);
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, value) => {
  const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function ground(maps) {
  for (const map of maps) map.wrapS = map.wrapT = RepeatWrapping;
  return new Mesh(new PlaneGeometry(14000, 14000), new ShaderMaterial({
    uniforms: { cement: { value: maps[0] }, aggregate: { value: maps[1] } },
    vertexShader: VERTEX,
    fragmentShader: GROUND
  }));
}

function shadowTexture(image, blur) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 224;
  const context = canvas.getContext('2d');
  context.filter = 'blur(' + blur + 'px)';
  context.drawImage(image, 32, 32, 160, 160);
  context.filter = 'none';
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = '#211a15';
  context.fillRect(0, 0, 224, 224);
  const map = new CanvasTexture(canvas);
  map.colorSpace = SRGBColorSpace;
  return map;
}

function makeShadows(image, width, height, thickness, camera = false) {
  const layers = [
    [8.5 + thickness * .13, .30, 1.48],
    [3.8 + thickness * .075, .51, .83],
    [1.5, .71, .21]
  ];
  return layers.map(([blur, opacity, spread], index) => {
    const mesh = new Mesh(plane, new MeshBasicMaterial({
      map: shadowTexture(image, blur), transparent: true, depthWrite: false, opacity
    }));
    mesh.scale.set(width * 1.40, height * 1.40, 1);
    mesh.position.set((10 + thickness) * spread, -(12 + thickness) * spread, 1 + index * .05);
    mesh.renderOrder = camera ? 2 : 1;
    return { mesh, opacity, spread };
  });
}

function cameraMask() {
  const image = document.createElement('canvas');
  image.width = 260;
  image.height = 175;
  const ctx = image.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.roundRect(6, 18, 247, 149, 15);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(156, 5, 43, 30, 8);
  ctx.roundRect(23, 9, 37, 24, 6);
  ctx.fill();
  return image;
}

export async function createStudio(floor, pieces, cameraPiece, draw) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.domElement.className = 'studio-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const world = new Scene();
  const cameraWorld = new Scene();
  const view = new OrthographicCamera(0, 0, 0, 0, 1, 4000);
  view.position.z = 1500;
  const sun = new DirectionalLight(0xffeedc, 3.2);
  sun.position.set(-420, 520, 740);
  const fill = new DirectionalLight(0xb9c7ec, 1.1);
  fill.position.set(550, -220, 650);
  const reflection = studioReflections();
  cameraWorld.environment = reflection;
  cameraWorld.environmentIntensity = 1.25;
  cameraWorld.add(new AmbientLight(0xe9e2d6, .55), new HemisphereLight(0xfaf0db, 0x3d3433, 1.15), sun, fill);
  const loader = new TextureLoader();
  async function load(file) {
    const texture = await loader.loadAsync(asset(file));
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    return texture;
  }

  const [cement, aggregate, ...maps] = await Promise.all([
    load('pack-cement-0'), load('pack-cement-1'), ...pieces.map(({ file }) => load(file))
  ]).catch((error) => {
    renderer.dispose();
    reflection.dispose();
    throw error;
  });
  world.add(ground([cement, aggregate]));
  pieces.forEach((piece, i) => {
    const { x, y, width, height, angle, stack } = piece;
    const photo = maps[i];
    const object = new Group();
    object.position.set(x, -y, 0);
    const surface = new Mesh(plane, new ShaderMaterial({
      uniforms: {
        photo: { value: photo },
        worldStep: { value: new Vector2(3.8 / width, 3.8 / height) },
        localSun: { value: new Vector2(
          -.63 * Math.cos(angle) - .77 * Math.sin(angle),
          -.63 * Math.sin(angle) + .77 * Math.cos(angle)
        ) },
        side: { value: 0 }
      },
      vertexShader: GARMENT_VERTEX,
      fragmentShader: GARMENT,
      transparent: true,
      depthWrite: false
    }));
    surface.rotation.z = -angle;
    surface.position.z = 5 + stack;
    surface.scale.set(width, height, 1);
    surface.renderOrder = 10 + stack;

    // An offset edge pass exposes the photographed hem on the shadow side.
    const hem = new Mesh(plane, surface.material.clone());
    hem.material.uniforms.photo.value = photo;
    hem.material.uniforms.side.value = 1;
    hem.scale.copy(surface.scale);
    hem.rotation.copy(surface.rotation);
    hem.position.set(2.1, -3.5, 4 + stack);
    hem.renderOrder = surface.renderOrder - .1;
    object.add(hem);
    object.add(surface);
    for (const { mesh, spread } of makeShadows(photo.image, width, height, stack > 7 ? 9 : 5)) {
      const anchor = new Group();
      anchor.position.copy(mesh.position);
      if (stack > 7) {
        // Raised pieces cast their tighter shadow on the textile below.
        mesh.renderOrder = surface.renderOrder - 1;
        anchor.position.x *= .88;
        anchor.position.y *= .86;
        if (spread < .5) mesh.material.opacity *= .78;
      }
      mesh.position.set(0, 0, 0);
      anchor.rotation.z = -angle;
      anchor.add(mesh);
      object.add(anchor);
    }
    world.add(object);
  });

  const { x, y, width, height } = cameraPiece;
  const model = createRangefinder();
  cameraWorld.add(model);
  const cameraShadows = makeShadows(cameraMask(), width, height * .88, 14, true);
  world.add(...cameraShadows.map(({ mesh }) => mesh));
  const backdrop = document.createElement('canvas');
  backdrop.className = 'studio-transition-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  const backContext = backdrop.getContext('2d');
  floor.prepend(backdrop, renderer.domElement);
  const rest = new Quaternion().setFromEuler(new Euler(.20, -.17, .32, 'ZYX'));
  const portrait = new Quaternion().setFromEuler(new Euler(0, Math.PI, -Math.PI / 2, 'ZYX'));
  const hoverRotation = new Quaternion();
  const rear = new Quaternion().setFromEuler(new Euler(.02, Math.PI, .06, 'ZYX'));
  const root = new Vector3(x, -y, 32);
  let hasBackdrop = false;
  let contextLost = false;
  let docked;
  const dockView = new OrthographicCamera(-75.5, 75.5, 110.5, -110.5, 1, 4000);
  dockView.position.z = 1500;

  function renderDock() {
    if (!docked || contextLost) return;
    const { clientWidth, clientHeight } = docked;
    if (!clientWidth || !clientHeight) return;
    const scale = Math.min(clientWidth / 151, clientHeight / 221);
    dockView.left = -clientWidth / scale / 2;
    dockView.right = -dockView.left;
    dockView.top = clientHeight / scale / 2;
    dockView.bottom = -dockView.top;
    dockView.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
    model.position.set(0, 0, 32);
    model.quaternion.copy(portrait);
    model.scale.setScalar(1);
    renderer.autoClear = true;
    renderer.render(cameraWorld, dockView);
  }
  const watchDock = new ResizeObserver(renderDock);
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    contextLost = true;
    floor.classList.remove('has-studio');
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    hasBackdrop = false;
    floor.classList.add('has-studio');
    if (docked) renderDock();
    else draw();
  });
  floor.classList.add('has-studio');

  return {
    get available() { return !contextLost; },
    dock(screen) {
      docked = screen;
      screen.prepend(renderer.domElement);
      backdrop.style.opacity = 0;
      hasBackdrop = false;
      watchDock.observe(screen);
      renderDock();
    },
    undock() {
      if (!docked) return;
      watchDock.unobserve(docked);
      docked = null;
      backdrop.after(renderer.domElement);
    },
    resize(width, height, scale) {
      renderer.setSize(width, height, false);
      view.left = -width / scale / 2;
      view.right = -view.left;
      view.top = height / scale / 2;
      view.bottom = -view.top;
      view.updateProjectionMatrix();
    },
    render(panX, panY, hover, pointer, progress, destination) {
      if (contextLost || docked) return;
      view.position.x = panX;
      view.position.y = -panY;
      const entering = progress > 0;
      const approach = smooth(0, .40, progress);
      const turn = smooth(.22, .65, progress);
      const dock = destination ? smooth(.66, .96, progress) : 0;
      const lift = hover * 13 + approach * 23;
      model.position.copy(root);
      model.position.y += hover * 7 + approach * 12;
      model.position.z += lift;
      const zoom = mix(1.12 + hover * .015, 1.82, approach);
      hoverRotation.setFromEuler(new Euler(-pointer.y * hover * .19, pointer.x * hover * .22, 0));
      model.quaternion.copy(rest).multiply(hoverRotation).slerp(rear, turn).slerp(portrait, dock);
      if (destination) {
        model.position.x = mix(model.position.x, panX + destination.x, dock);
        model.position.y = mix(model.position.y, -panY + destination.y, dock);
      }
      model.scale.setScalar(mix(zoom, destination?.scale ?? 1, dock));
      for (const { mesh, opacity, spread } of cameraShadows) {
        mesh.position.x = x + (12 + lift) * spread;
        mesh.position.y = -y - (18 + lift) * spread;
        mesh.rotation.z = .32;
        mesh.scale.set(width * (1.40 + lift * .008), height * (1.24 + lift * .007), 1);
        mesh.material.opacity = opacity * (1 - Math.min(.92, lift / 58));
      }
      renderer.autoClear = true;
      if (entering) {
        if (!hasBackdrop) {
          renderer.render(world, view);
          backdrop.width = renderer.domElement.width;
          backdrop.height = renderer.domElement.height;
          backContext.drawImage(renderer.domElement, 0, 0);
          hasBackdrop = true;
        }
        backdrop.style.opacity = 1 - smooth(.63, .94, progress);
        backdrop.style.filter = 'blur(' + (approach * 13) + 'px)';
        renderer.render(cameraWorld, view);
      } else {
        if (hasBackdrop) {
          backdrop.style.opacity = 0;
          renderer.domElement.style.opacity = 1;
          hasBackdrop = false;
        }
        renderer.render(world, view);
        renderer.autoClear = false;
        renderer.clearDepth();
        renderer.render(cameraWorld, view);
      }
    }
  };
}

const VERTEX = /* glsl */ `
  varying vec2 floorXY;
  void main() {
    floorXY = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;

const LIGHT = /* glsl */ `
  float studioLight(vec2 p) {
    vec2 q = p-vec2(-650., 465.);
    float panel = dot(q, vec2(.39,.92));
    float falloff = exp(-dot(q/vec2(1030.,580.),q/vec2(1030.,580.)));
    float bars = smoothstep(-.72,.45,cos(panel*.063+.52*sin(p.x*.002)));
    return falloff*(.16+.56*bars);
  }
`;

const GROUND = /* glsl */ `
  uniform sampler2D cement, aggregate;
  varying vec2 floorXY;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
  }
  ${LIGHT}
  void main() {
    vec2 p = floorXY;
    float blend = smoothstep(.18,.81,noise(p/340.));
    vec3 a = texture2D(cement, p/615.).rgb;
    vec3 b = texture2D(aggregate, mat2(.71,-.71,.71,.71)*p/763.).rgb;
    vec3 stone = mix(a,b,blend);
    float stain = (noise(p/188.)-.5)*.036+(noise(p/57.)-.5)*.018;
    float grit = (noise(p/3.1)-.5)*.020 + (noise(p/9.7)-.5)*.014;
    float pores = pow(max(0., 1.-noise(p/4.6)), 10.)*.033;
    float detail = 1.-smoothstep(1.4,4.,length(fwidth(p)));
    float sun = studioLight(p);
    gl_FragColor = vec4(max(stone*(.89+sun*1.75)+stain+(grit-pores)*detail+sun*vec3(.17,.106,.062),0.),1.);
    #include <colorspace_fragment>
  }
`;

const GARMENT_VERTEX = /* glsl */ `
  varying vec2 imageUV, surfaceXY;
  void main() {
    imageUV = uv;
    surfaceXY = (modelMatrix*vec4(position,1.)).xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
  }
`;

const GARMENT = /* glsl */ `
  uniform sampler2D photo;
  uniform vec2 worldStep, localSun;
  uniform float side;
  varying vec2 imageUV, surfaceXY;
  ${LIGHT}
  float relief(vec2 uv) {
    vec4 broad = texture2D(photo, uv, 3.75);
    float lightness = sqrt(max(0.,dot(broad.rgb,vec3(.2126,.7152,.0722))));
    return broad.a*(.74+.42*lightness);
  }
  void main() {
    vec4 garment = texture2D(photo,imageUV);
    if (garment.a < .024) discard;
    if (side > .5) {
      gl_FragColor = vec4(garment.rgb*.42, garment.a*.91);
    } else {
      float sun = studioLight(surfaceXY);
      vec2 dx = vec2(worldStep.x,0.);
      vec2 dy = vec2(0.,worldStep.y);
      vec2 slope = vec2(relief(imageUV+dx)-relief(imageUV-dx), relief(imageUV+dy)-relief(imageUV-dy));
      vec3 normal = normalize(vec3(-slope*3.1,1.));
      float shape = dot(normal,normalize(vec3(localSun,1.1)))-.74;
      float textile = .99+shape*.34+sun*.32;
      vec3 colour = garment.rgb*textile+sun*vec3(.014,.008,.003);
      gl_FragColor = vec4(colour,garment.a);
    }
    #include <colorspace_fragment>
  }
`;
