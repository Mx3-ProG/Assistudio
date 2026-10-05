# VORTEX R — motorcycle assets

The current build uses **zero external image/model files**. The motorcycle,
its materials (carbon fiber, brushed metal, glass, red paint, titanium) and
the reflection environment are all generated procedurally in code so the
experience never blocks on missing assets. This folder documents what should
eventually replace the procedural placeholders.

## What's procedural right now

| Thing | Generated in | Replace with |
|---|---|---|
| Motorcycle geometry | `src/components/canvas/motorcycle-parts/*.tsx` (primitives: Lathe/Extrude/Tube/Cylinder + InstancedMesh) | `model/vortex-r.glb` |
| Carbon fiber weave texture | `src/lib/r3f/materials.ts` → `getCarbonWeaveTexture()` (CanvasTexture) | `textures/carbon-fiber-basecolor.jpg` + `textures/carbon-fiber-normal.jpg` |
| Brushed metal streaks | `src/lib/r3f/materials.ts` → `getBrushedMetalTexture()` (CanvasTexture) | `textures/brushed-metal-normal.jpg` + `textures/brushed-metal-roughness.jpg` |
| Reflection environment | `src/components/canvas/Environment.tsx` (drei `Lightformer`s) | `env/studio.hdr` (loaded via drei's `<Environment files="...">`) |
| Brand wordmark | Styled text ("VORTEX R") in overlay components | `branding/logo.svg`, `branding/wordmark.svg` |

## Dropping in a real 3D model

1. Export `vortex-r.glb` with these **exact node names** at the top level of
   the scene graph (the app looks them up by name to drive the camera and
   hotspots): `Frame`, `Fairing`, `Windscreen`, `Winglets`, `Tank`, `Tail`,
   `EngineBlock`, `Exhaust`, `Cockpit`, `WheelFront`, `WheelRear`,
   `BrakeDiscFront`, `BrakeDiscRear`, `SwingArm`, `ForkAssembly`.
2. Keep the bike's local origin at ground level between the wheels, front of
   the bike facing `+Z`, matching the world layout documented at the top of
   `src/lib/choreography/config.ts`.
3. Recommended budget: ≤120k triangles, 2k textures (mobile tier will
   downsample).
4. Place the file at `model/vortex-r.glb`, then flip the single switch in
   `src/components/canvas/MotorcycleModel.tsx`:
   `const MOTORCYCLE_SOURCE: "procedural" | "gltf" = "gltf"` and implement
   `GLTFMotorcycle` there using drei's `useGLTF`, registering the same named
   nodes into `refsRegistry`. No other file needs to change — camera moves,
   hotspot anchors and lighting are all keyed off `refsRegistry`, not the
   mesh implementation.

## Dropping in real textures / HDRI

Pass real `THREE.Texture` maps into the material factories in
`src/lib/r3f/materials.ts` (each factory has a documented spot for a real
map) and swap `Environment.tsx`'s Lightformer rig for drei's
`<Environment files="/assets/motorcycle/env/studio.hdr">`.
