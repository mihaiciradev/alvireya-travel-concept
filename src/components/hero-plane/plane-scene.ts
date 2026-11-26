import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import { createPlaneRig, FACING_LEFT, MODEL_LENGTH } from "./plane-rig";

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
  idle: (enabled: boolean) => void;
  dispose: () => void;
};

const ARRIVAL_MS = 3000;
const NOSE_UP = 0.2;

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
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
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
  const rig = await createPlaneRig(canvas);
  const { scene, flight, bank, pose } = rig;

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
  const state = {
    arrivalStart: Number.NaN,
    pointerX: 0,
    pointerY: 0,
    targetPointerX: 0,
    targetPointerY: 0,
    sway: 0,
    targetSway: 0,
  };

  let frame = 0;
  let lastRender = 0;

  function place(now: number) {
    const elapsed = Number.isNaN(state.arrivalStart) ? 0 : now - state.arrivalStart;
    const a = clamp01(elapsed / ARRIVAL_MS);
    const t = easeOutQuart(a);
    const position = bezier(path, t);
    const heading = leftward(bezierTangent(path, Math.min(t, 0.999)));
    const turn = leftward(bezierTangent(path, Math.min(t + 0.05, 1))) - heading;

    const size = stage.planeSize;
    const phase = Math.max(elapsed - ARRIVAL_MS, 0) / 1000;
    const k = state.sway;
    const swayBank = Math.sin((phase * Math.PI * 2) / 5.6) * 0.09 * k;
    const swayNod = Math.sin((phase * Math.PI * 2) / 7.4 + 1.2) * 0.035 * k;
    const swayYaw = Math.sin((phase * Math.PI * 2) / 9.2 + 0.4) * 0.14 * k;
    const px = state.pointerX;
    const py = state.pointerY;
    const x = position.x + px * size * 0.16;
    const y = position.y + py * size * 0.11;

    flight.position.set(x - stage.width / 2, stage.height / 2 - y, 0);
    flight.rotation.z = heading - NOSE_UP + py * 0.24 + swayNod;
    bank.rotation.x = turn * 1.6 - px * 0.42 + swayBank;
    pose.rotation.y = FACING_LEFT + px * 0.5 + swayYaw;

    const scale = (size / MODEL_LENGTH) * (0.55 + 0.45 * t);
    flight.scale.setScalar(scale);

    const altitude = 1.35 - 0.35 * t - py * 0.12;
    shadow.position.set(x - stage.width / 2 + size * 0.1 * altitude, stage.height / 2 - y - size * 0.42 * altitude, -size);
    shadow.scale.set(size * (0.75 + 0.2 * altitude), size * (0.24 + 0.06 * altitude), 1);
    shadowMaterial.opacity = (0.75 - 0.3 * (altitude - 1)) * t;

    return a < 1;
  }

  function render(now: number) {
    const busy = place(now);
    rig.render();
    return busy;
  }

  function tick(now: number) {
    frame = 0;
    const swaying = state.targetSway > 0;
    if (swaying && now - lastRender < 32) {
      frame = requestAnimationFrame(tick);
      return;
    }
    lastRender = now;
    state.pointerX = damp(state.pointerX, state.targetPointerX, 0.07);
    state.pointerY = damp(state.pointerY, state.targetPointerY, 0.07);
    state.sway = damp(state.sway, state.targetSway, 0.04);
    const busy = render(now);

    const settled =
      Math.abs(state.pointerX - state.targetPointerX) < 0.002 &&
      Math.abs(state.pointerY - state.targetPointerY) < 0.002 &&
      Math.abs(state.sway - state.targetSway) < 0.002;
    if (busy || swaying || !settled) frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (!frame && !Number.isNaN(state.arrivalStart)) frame = requestAnimationFrame(tick);
  }

  return {
    layout(next) {
      stage = next;
      path = flightPath(stage);
      rig.resize(next.width, next.height, next.width < 768 ? 1.75 : 1.5);
      render(performance.now());
    },
    arrive(onProgress) {
      return new Promise((resolve) => {
        state.arrivalStart = performance.now();
        const step = (now: number) => {
          const progress = clamp01((now - state.arrivalStart) / ARRIVAL_MS);
          onProgress(easeOutQuart(progress));
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
    idle(enabled) {
      state.targetSway = enabled ? 1 : 0;
      if (!enabled) {
        state.sway = 0;
        return;
      }
      wake();
    },
    dispose() {
      cancelAnimationFrame(frame);
      shadowMap.dispose();
      shadowMaterial.dispose();
      rig.dispose();
    },
  };
}
