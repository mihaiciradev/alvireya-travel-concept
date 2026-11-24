import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  Group,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const MODEL_URL = "/models/alvireya-plane.glb";
const FOV = 28;

export const MODEL_LENGTH = 0.62;
export const FACING_LEFT = -(Math.PI / 2 - 0.7);
export const FACING_RIGHT = Math.PI / 2 - 0.7;

export type PlaneRig = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  flight: Group;
  bank: Group;
  pose: Group;
  resize: (width: number, height: number, maxRatio: number) => void;
  render: () => void;
  dispose: () => void;
};

export async function createPlaneRig(canvas: HTMLCanvasElement): Promise<PlaneRig> {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
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
  pose.rotation.set(0.45, FACING_LEFT, 0, "XYZ");
  pose.add(model);

  const bank = new Group();
  bank.add(pose);

  const flight = new Group();
  flight.add(bank);
  scene.add(flight);

  return {
    renderer,
    scene,
    camera,
    flight,
    bank,
    pose,
    resize(width, height, maxRatio) {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxRatio));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.set(0, 0, height / 2 / Math.tan((FOV * Math.PI) / 360));
      camera.updateProjectionMatrix();
    },
    render() {
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
