import {
  ACESFilmicToneMapping,
  Box3,
  CanvasTexture,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

export type Point = { x: number; y: number };

export type StageLayout = {
  width: number;
  height: number;
  anchor: Point;
  planeSize: number;
};

export type PlaneScene = {
  layout: (layout: StageLayout) => void;
  arrive: (onProgress: (progress: number) => void) => Promise<void>;
  pointer: (x: number, y: number) => void;
  scroll: (progress: number) => void;
  hits: (x: number, y: number) => boolean;
  roll: () => void;
  dispose: () => void;
};

const MODEL_URL = "/models/alvireya-plane.glb";
const MODEL_LENGTH = 0.62;
const FOV = 28;
const ARRIVAL_MS = 3200;
const SETTLE_MS = 1100;
const ROLL_MS = 1050;
const NOSE_UP = 0.2;
const TAU = Math.PI * 2;

export function flightPath({ width: w, height: h, anchor }: StageLayout): [Point, Point, Point, Point] {
  const startY = Math.min(1.02 * h, anchor.y + 0.6 * w);
  return [
    { x: 1.08 * w, y: startY },
    { x: 0.94 * w, y: anchor.y + (startY - anchor.y) * 0.75 },
    { x: anchor.x + 0.26 * w, y: anchor.y + 0.07 * h },
    anchor,
  ];
}

function bezier(points: [Point, Point, Point, Point], t: number): Point {
  const [a, b, c, d] = points;
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

function bezierTangent(points: [Point, Point, Point, Point], t: number): Point {
  const [a, b, c, d] = points;
  const u = 1 - t;
  return {
    x: 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x),
    y: 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y),
  };
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const leftward = ({ x, y }: Point) => Math.atan2(y, -x);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const window01 = (t: number, from: number, to: number) => easeInOutCubic(clamp01((t - from) / (to - from)));
const damp = (current: number, target: number, factor: number) => current + (target - current) * factor;

function shadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(16,32,47,0.55)");
    gradient.addColorStop(0.45, "rgba(16,32,47,0.22)");
    gradient.addColorStop(1, "rgba(16,32,47,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  return new CanvasTexture(canvas);
}

export async function createPlaneScene(canvas: HTMLCanvasElement): Promise<PlaneScene> {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  scene.add(new HemisphereLight(0xfff4e2, 0xc9b495, 2.1));
  const sun = new DirectionalLight(0xfff0dc, 2.6);
  sun.position.set(-2, 4, 3);
  scene.add(sun);
  const rim = new DirectionalLight(0x9fd3ee, 1.1);
  rim.position.set(3, -1, -2);
  scene.add(rim);

  const camera = new PerspectiveCamera(FOV, 1, 1, 10000);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(MODEL_URL);

  const model = gltf.scene;
  const center = new Box3().setFromObject(model).getCenter(new Vector3());
  model.position.sub(center);

  const pose = new Group();
  pose.rotation.set(0.45, -(Math.PI / 2 - 0.7), 0, "XYZ");
  pose.add(model);

  const bank = new Group();
  bank.add(pose);

  const flight = new Group();
  flight.add(bank);
  scene.add(flight);

  const shadowMap = shadowTexture();
  const shadowMaterial = new MeshBasicMaterial({
    map: shadowMap,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const shadow = new Mesh(new PlaneGeometry(1, 1), shadowMaterial);
  scene.add(shadow);

  let stage: StageLayout = { width: 1, height: 1, anchor: { x: 0, y: 0 }, planeSize: 200 };
  let path = flightPath(stage);
  let screen = { x: -9999, y: -9999, radius: 0 };

  const state = {
    arrivalStart: Number.NaN,
    rollStart: Number.NaN,
    pointerX: 0,
    pointerY: 0,
    targetPointerX: 0,
    targetPointerY: 0,
    scroll: 0,
    targetScroll: 0,
  };

  let frame = 0;

  function place(now: number) {
    const elapsed = Number.isNaN(state.arrivalStart) ? 0 : now - state.arrivalStart;
    const a = clamp01(elapsed / ARRIVAL_MS);
    const t = easeOutCubic(a);
    const position = bezier(path, t);
    const heading = leftward(bezierTangent(path, Math.min(t, 0.999)));
    const turn = leftward(bezierTangent(path, Math.min(t + 0.05, 1))) - heading;

    const settle = clamp01((elapsed - ARRIVAL_MS) / SETTLE_MS);
    const settleWave = elapsed > ARRIVAL_MS ? Math.exp(-settle * 4) * Math.sin(settle * TAU * 1.5) : 0;

    const r = Number.isNaN(state.rollStart) ? 1 : clamp01((now - state.rollStart) / ROLL_MS);
    const tapRoll = r < 1 ? TAU * easeInOutCubic(r) : 0;
    const hop = r < 1 ? Math.sin(Math.PI * r) : 0;

    const s = state.scroll;
    const size = stage.planeSize;
    const x = position.x + state.pointerX * 16 - s * stage.width * 0.38;
    const y = position.y + state.pointerY * 10 - s * stage.height * 0.55 - settleWave * size * 0.06 - hop * size * 0.18;

    flight.position.set(x - stage.width / 2, stage.height / 2 - y, 0);
    flight.rotation.z = heading - NOSE_UP - s * 0.35 + state.pointerY * 0.06 + settleWave * 0.08 - hop * 0.12;
    bank.rotation.x = turn * 2.2 - state.pointerX * 0.22 + s * 0.5 + TAU * window01(a, 0.32, 0.66) + tapRoll;

    const scale = (size / MODEL_LENGTH) * (0.55 + 0.45 * t) * (1 - s * 0.25);
    flight.scale.setScalar(scale);

    const altitude = 1.35 - 0.35 * t + hop * 0.5 + s * 0.8;
    shadow.position.set(x - stage.width / 2 + size * 0.1 * altitude, stage.height / 2 - y - size * 0.42 * altitude, -size);
    shadow.scale.set(size * (0.75 + 0.2 * altitude), size * (0.24 + 0.06 * altitude), 1);
    shadowMaterial.opacity = (0.75 - 0.3 * (altitude - 1)) * t * (1 - s);

    screen = { x, y, radius: size * 0.42 * (1 - s * 0.25) };

    const busy = a < 1 || settle < 1 || r < 1;
    return busy;
  }

  function render(now: number) {
    const busy = place(now);
    renderer.render(scene, camera);
    return busy;
  }

  function tick(now: number) {
    frame = 0;
    state.pointerX = damp(state.pointerX, state.targetPointerX, 0.075);
    state.pointerY = damp(state.pointerY, state.targetPointerY, 0.075);
    state.scroll = damp(state.scroll, state.targetScroll, 0.2);
    const busy = render(now);

    const settled =
      Math.abs(state.pointerX - state.targetPointerX) < 0.002 &&
      Math.abs(state.pointerY - state.targetPointerY) < 0.002 &&
      Math.abs(state.scroll - state.targetScroll) < 0.001;
    if (busy || !settled) frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (!frame && !Number.isNaN(state.arrivalStart)) frame = requestAnimationFrame(tick);
  }

  return {
    layout(next) {
      stage = next;
      path = flightPath(stage);
      const ratio = Math.min(window.devicePixelRatio || 1, next.width < 768 ? 1.75 : 1.5);
      renderer.setPixelRatio(ratio);
      renderer.setSize(next.width, next.height, false);
      camera.aspect = next.width / next.height;
      camera.position.set(0, 0, next.height / 2 / Math.tan((FOV * Math.PI) / 360));
      camera.updateProjectionMatrix();
      render(performance.now());
    },
    arrive(onProgress) {
      return new Promise((resolve) => {
        state.arrivalStart = performance.now();
        const step = (now: number) => {
          const progress = clamp01((now - state.arrivalStart) / ARRIVAL_MS);
          onProgress(easeOutCubic(progress));
          render(now);
          if (progress < 1) {
            frame = requestAnimationFrame(step);
          } else {
            frame = 0;
            wake();
            resolve();
          }
        };
        frame = requestAnimationFrame(step);
      });
    },
    pointer(x, y) {
      state.targetPointerX = x;
      state.targetPointerY = y;
      wake();
    },
    scroll(progress) {
      state.targetScroll = progress;
      wake();
    },
    hits(x, y) {
      return Math.hypot(x - screen.x, y - screen.y) < screen.radius;
    },
    roll() {
      const now = performance.now();
      const settledAt = state.arrivalStart + ARRIVAL_MS + SETTLE_MS;
      const rolling = now - state.rollStart < ROLL_MS;
      if (Number.isNaN(state.arrivalStart) || now < settledAt || rolling) return;
      state.rollStart = now;
      wake();
    },
    dispose() {
      cancelAnimationFrame(frame);
      shadowMap.dispose();
      shadowMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
