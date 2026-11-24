import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import {
  dedup,
  flatten,
  join,
  prune,
  quantize,
  simplify,
  weld,
} from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { stat } from "node:fs/promises";

const SOURCE = "src/raw/3dplane.glb";
const TARGET = "public/models/voyra-plane.glb";

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });

const document = await io.read(SOURCE);
const root = document.getRoot();

for (const extension of root.listExtensionsUsed()) {
  if (extension.extensionName !== "KHR_materials_emissive_strength") {
    extension.dispose();
  }
}

await document.transform(
  dedup(),
  flatten(),
  join(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.18, error: 0.0008 }),
  prune(),
  quantize({ quantizePosition: 14, quantizeNormal: 10 }),
);

document
  .createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });

await io.write(TARGET, document);

let triangles = 0;
for (const mesh of root.listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    triangles += (primitive.getIndices()?.getCount() ?? 0) / 3;
  }
}

const [before, after] = await Promise.all([stat(SOURCE), stat(TARGET)]);
console.log(
  `${SOURCE} ${(before.size / 1024).toFixed(0)} KB -> ${TARGET} ${(after.size / 1024).toFixed(0)} KB, ${triangles} triangles, ${root.listMeshes().length} meshes`,
);
