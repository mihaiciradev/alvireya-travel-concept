import { createPlaneRig, MODEL_LENGTH } from "./plane-rig";

export { FACING_LEFT, FACING_RIGHT } from "./plane-rig";

export type MascotPose = { yaw: number; tilt: number; bank: number };

export type Mascot = {
  resize: (width: number, height: number, planeSize: number) => void;
  pose: (pose: MascotPose) => void;
  dispose: () => void;
};

export async function createMascot(canvas: HTMLCanvasElement): Promise<Mascot> {
  const rig = await createPlaneRig(canvas);

  return {
    resize(width, height, planeSize) {
      rig.resize(width, height, 2);
      rig.flight.scale.setScalar(planeSize / MODEL_LENGTH);
    },
    pose({ yaw, tilt, bank }) {
      rig.pose.rotation.y = yaw;
      rig.flight.rotation.z = tilt;
      rig.bank.rotation.x = bank;
      rig.render();
    },
    dispose: rig.dispose,
  };
}
