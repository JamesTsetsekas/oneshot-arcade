// Procedural vehicle meshes: three original storm cabs and five traffic body styles.
import { Scene, Mesh, TransformNode, StandardMaterial, Color3, Color4, InstancedMesh } from '@babylonjs/core';
import { MeshBuf, RGB, mul, hex } from './meshbuf';
import { glowMat } from './city';
import { TaxiSpec } from '../vehicle/taxiSpecs';
import { VEHICLE_TYPES, TRAFFIC_COLOR_COUNT } from '../traffic/traffic';
import { Archetype } from '../fares/passengers';

const GLASS: RGB = [0.15, 0.32, 0.4];
const TYRE: RGB = [0.09, 0.09, 0.11];

export interface TaxiVisual {
  root: TransformNode;
  wheels: TransformNode[];
  turbine: Mesh;
  sign: Mesh;
  signMat: StandardMaterial;
  brake: Mesh;
  brakeMat: StandardMaterial;
  meshes: Mesh[];
  dispose(): void;
}

function lit(scene: Scene, name: string, spec = 0.5): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.White();
  m.specularColor = new Color3(spec, spec, spec);
  m.specularPower = 48;
  return m;
}

/** Original cab silhouette: wedge nose, wraparound cabin, roof turbine and a fare lamp. */
export function buildTaxi(scene: Scene, spec: TaxiSpec): TaxiVisual {
  const root = new TransformNode(`taxi-${spec.id}`, scene);
  const hz = spec.half.z, hx = spec.half.x;
  const body = spec.body as RGB, accent = spec.accent as RGB, dark = mul(body, 0.55);
  const mb = new MeshBuf();
  const wagon = spec.id === 'tempest', compact = spec.id === 'gull';
  const yb = -0.34; // underside
  // Lower body.
  mb.prism(
    [[-hz, -0.05], [-hz, 0.24], [-hz + 0.2, 0.34], [hz - 1.0, 0.32], [hz - 0.12, 0.14], [hz, -0.06], [hz - 0.12, yb], [-hz + 0.12, yb]],
    [hx, hx, hx * 0.98, hx * 0.98, hx * 0.94, hx * 0.9, hx * 0.9, hx * 0.96], body,
  );
  // Storm stripe along the flanks and a contrasting sill.
  for (const s of [-1, 1]) {
    mb.box({ x: s * (hx + 0.005), y: 0.12, z: -0.1 }, 0.02, 0.07, hz * 0.82, null, accent);
    mb.box({ x: s * (hx - 0.02), y: -0.27, z: 0 }, 0.04, 0.07, hz * 0.7, null, dark);
  }
  // Cabin glass and roof.
  const cabBack = wagon ? -hz + 0.25 : compact ? -hz + 0.5 : -hz + 0.75;
  const cabTopBack = wagon ? -hz + 0.5 : compact ? -hz + 0.8 : -hz + 1.25;
  const cabFront = hz - 1.15, cabTopFront = hz - 1.95;
  const roofY = compact ? 0.92 : 0.88;
  mb.prism([[cabBack, 0.32], [cabTopBack, roofY], [cabTopFront, roofY], [cabFront, 0.32]], [hx * 0.95, hx * 0.8, hx * 0.8, hx * 0.95], GLASS);
  mb.box({ x: 0, y: roofY + 0.025, z: (cabTopBack + cabTopFront) / 2 }, hx * 0.82, 0.04, (cabTopFront - cabTopBack) / 2 + 0.06, null, accent);
  // Bumpers, grille, arches.
  mb.box({ x: 0, y: -0.2, z: hz + 0.02 }, hx * 0.86, 0.1, 0.07, null, dark);
  mb.box({ x: 0, y: -0.16, z: -hz - 0.02 }, hx * 0.92, 0.12, 0.07, null, dark);
  mb.box({ x: 0, y: 0.02, z: hz - 0.03 }, hx * 0.5, 0.07, 0.05, null, [0.12, 0.12, 0.14]);
  // Roof turbine housing.
  const tz = (cabTopBack + cabTopFront) / 2 - 0.25;
  mb.cyl(0, tz, roofY + 0.05, roofY + 0.2, 0.36, 0.33, 12, accent, false);
  mb.cyl(0, tz, roofY + 0.05, roofY + 0.09, 0.3, 0.3, 12, [0.1, 0.1, 0.12]);
  const bodyMesh = mb.toMesh('taxi-body', scene, lit(scene, 'taxi-paint', 0.7));
  bodyMesh.parent = root;

  // Emissive: head/tail lamps (static).
  const lamps = new MeshBuf();
  for (const s of [-1, 1]) {
    lamps.box({ x: s * hx * 0.62, y: 0.1, z: hz - 0.06 }, 0.17, 0.055, 0.05, null, [1, 0.97, 0.8]);
  }
  const lampMesh = lamps.toMesh('taxi-lamps', scene, glowMat(scene, 'taxi-lamps'));
  lampMesh.parent = root;
  const brakeBuf = new MeshBuf();
  for (const s of [-1, 1]) brakeBuf.box({ x: s * hx * 0.62, y: 0.14, z: -hz - 0.01 }, 0.2, 0.05, 0.04, null, [1, 1, 1]);
  brakeBuf.box({ x: 0, y: 0.14, z: -hz - 0.01 }, hx * 0.36, 0.018, 0.04, null, [1, 1, 1]);
  const brakeMat = glowMat(scene, 'taxi-brake', [0.6, 0.05, 0.05]);
  const brake = brakeBuf.toMesh('taxi-brake', scene, brakeMat);
  brake.parent = root;

  // Spinning turbine fan.
  const fan = new MeshBuf();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    fan.box({ x: 0, y: 0, z: 0 }, 0.3, 0.018, 0.05, { x: 0, y: Math.sin(a / 2), z: 0, w: Math.cos(a / 2) }, [0.92, 0.94, 0.96]);
  }
  fan.cyl(0, 0, -0.02, 0.05, 0.07, 0.05, 8, accent);
  const turbine = fan.toMesh('taxi-turbine', scene, lit(scene, 'fan', 0.3));
  turbine.parent = root;
  turbine.position.set(0, roofY + 0.21, tz);

  // Fare lamp: teal when vacant, magenta when hired.
  const signBuf = new MeshBuf();
  signBuf.prism([[-0.16, 0], [-0.1, 0.17], [0.1, 0.17], [0.16, 0]], 0.3, [1, 1, 1]);
  const signMat = glowMat(scene, 'taxi-sign', [0.1, 1, 0.9]);
  const sign = signBuf.toMesh('taxi-sign', scene, signMat);
  sign.parent = root;
  sign.position.set(0, roofY + 0.05, cabTopFront - 0.3);

  // Wheels.
  const wheelBuf = new MeshBuf();
  const R = spec.wheelRadius, wW = 0.13;
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2;
    const p = (a: number, x: number, rr = R) => ({ x, y: Math.cos(a) * rr, z: Math.sin(a) * rr });
    wheelBuf.quad(p(a0, -wW), p(a0, wW), p(a1, wW), p(a1, -wW), TYRE, { x: 0, y: Math.cos((a0 + a1) / 2), z: Math.sin((a0 + a1) / 2) });
    for (const s of [-1, 1]) {
      wheelBuf.tri({ x: s * wW, y: 0, z: 0 }, p(a0, s * wW), p(a1, s * wW), i % 3 === 0 ? accent : [0.2, 0.2, 0.23], { x: s, y: 0, z: 0 });
      wheelBuf.tri({ x: s * (wW + 0.01), y: 0, z: 0 }, p(a0, s * (wW + 0.01), R * 0.4), p(a1, s * (wW + 0.01), R * 0.4), accent, { x: s, y: 0, z: 0 });
    }
  }
  const wheelMat = lit(scene, 'wheel', 0.15);
  const wheels: TransformNode[] = [];
  const meshes: Mesh[] = [bodyMesh, lampMesh, brake, turbine, sign];
  for (let i = 0; i < 4; i++) {
    const pivot = new TransformNode(`wheel-pivot-${i}`, scene);
    pivot.parent = root;
    const m = i === 0 ? wheelBuf.toMesh('taxi-wheel', scene, wheelMat) : (meshes[5] as Mesh).clone(`taxi-wheel-${i}`);
    m.parent = pivot;
    m.rotationQuaternion = null;
    meshes.push(m);
    wheels.push(pivot);
  }
  for (const m of meshes) m.isPickable = false;
  return {
    root, wheels, turbine, sign, signMat, brake, brakeMat, meshes,
    dispose() { root.dispose(false, true); },
  };
}

const TRAFFIC_COLORS: RGB[] = [[0.93, 0.92, 0.88], [0.36, 0.5, 0.72], [0.55, 0.72, 0.52], [0.26, 0.28, 0.34], [0.86, 0.6, 0.62], [0.92, 0.82, 0.55]];
const TRAM_COLOR: RGB = [1, 0.46, 0.38];

function trafficBody(type: number): MeshBuf {
  const t = VEHICLE_TYPES[type];
  const hx = t.half.x, hy = t.half.y, hz = t.half.z;
  const mb = new MeshBuf();
  const P: RGB = [1, 1, 1];
  const TRIM: RGB = [0.55, 0.55, 0.55];
  const yb = -hy + 0.1, belt = yb + (type === 4 ? 1.2 : type === 2 ? 0.95 : 0.66), top = hy;
  const gx = hx * 1.012; // glass sits just proud of the body so it is never hidden
  const wheel = (z: number, r = 0.34) => {
    for (const s of [-1, 1]) mb.cylX({ x: s * (hx - 0.1), y: -hy - 0.28 + r, z }, r, 0.13, 10, TYRE, [0.3, 0.3, 0.33]);
  };
  if (type === 4) {
    // Tram-bus: long body, continuous window band, cream roof, skirt stripe.
    mb.box({ x: 0, y: (yb + top) / 2, z: 0 }, hx, (top - yb) / 2, hz, null, P);
    mb.box({ x: 0, y: (belt + top) / 2 - 0.12, z: 0 }, gx, (top - belt) / 2 - 0.2, hz * 0.94, null, GLASS);
    mb.box({ x: 0, y: (belt + top) / 2 - 0.12, z: hz * 0.5 }, hx * 0.9, (top - belt) / 2 - 0.2, hz * 0.503, null, GLASS);
    mb.box({ x: 0, y: top + 0.06, z: 0 }, hx * 0.96, 0.08, hz * 0.97, null, [0.97, 0.95, 0.9]);
    mb.box({ x: 0, y: yb + 0.28, z: 0 }, gx, 0.09, hz * 0.99, null, [0.99, 0.92, 0.72]);
    for (let z = -hz + 1.3; z < hz - 0.6; z += 1.75) for (const s of [-1, 1]) mb.box({ x: s * gx, y: (belt + top) / 2 - 0.12, z }, 0.02, (top - belt) / 2 - 0.2, 0.09, null, P);
    mb.box({ x: 0, y: top + 0.2, z: -1 }, 0.5, 0.1, 1.7, null, [0.3, 0.3, 0.33]);
    wheel(hz * 0.68, 0.42); wheel(-hz * 0.62, 0.42);
  } else if (type === 2) {
    // Van: tall box with a sloped nose and windscreen.
    mb.prism([[-hz, yb], [-hz, top], [hz - 1.15, top], [hz - 0.2, belt], [hz, yb + 0.35], [hz, yb]], hx, P);
    mb.prism([[hz - 1.2, top - 0.08], [hz - 0.32, belt + 0.06], [hz - 1.75, belt + 0.06], [hz - 1.75, top - 0.08]], gx, GLASS);
    mb.box({ x: 0, y: belt - 0.1, z: -0.4 }, gx, 0.05, hz * 0.72, null, TRIM);
    mb.box({ x: 0, y: yb + 0.12, z: hz + 0.02 }, hx * 0.92, 0.12, 0.06, null, TRIM);
    wheel(hz * 0.62); wheel(-hz * 0.6);
  } else if (type === 3) {
    // Pickup: cab forward, open bed.
    mb.prism([[-hz, yb], [-hz, belt], [hz - 0.9, belt], [hz, belt - 0.22], [hz, yb]], hx, P);
    mb.prism([[-0.25, belt], [0.0, top], [hz - 1.5, top], [hz - 0.95, belt]], [hx * 0.97, hx * 0.86, hx * 0.86, hx * 0.97], GLASS);
    mb.box({ x: 0, y: top + 0.02, z: (hz - 1.5) / 2 }, hx * 0.88, 0.04, (hz - 1.5) / 2 + 0.06, null, P);
    mb.box({ x: 0, y: belt + 0.01, z: -hz / 2 - 0.2 }, hx * 0.86, 0.03, hz / 2 - 0.25, null, [0.2, 0.2, 0.22]);
    mb.box({ x: 0, y: belt + 0.22, z: -hz / 2 - 0.2 }, hx * 0.6, 0.2, hz / 2 - 0.6, null, [0.62, 0.5, 0.36]);
    wheel(hz * 0.62, 0.38); wheel(-hz * 0.6, 0.38);
  } else {
    const hatch = type === 0;
    mb.prism([[-hz, yb + 0.1], [-hz, belt], [hz - 0.85, belt - 0.02], [hz, belt - 0.24], [hz, yb + 0.1], [hz - 0.15, yb], [-hz + 0.15, yb]], [hx, hx, hx * 0.98, hx * 0.92, hx * 0.92, hx * 0.92, hx * 0.96], P);
    const back = hatch ? -hz + 0.12 : -hz + 0.7, backTop = hatch ? -hz + 0.5 : -hz + 1.2;
    mb.prism([[back, belt], [backTop, top], [hz - 1.85, top], [hz - 1.1, belt]], [hx * 0.97, hx * 0.82, hx * 0.82, hx * 0.97], GLASS);
    mb.box({ x: 0, y: top + 0.02, z: (backTop + hz - 1.85) / 2 }, hx * 0.84, 0.035, (hz - 1.85 - backTop) / 2 + 0.05, null, P);
    mb.box({ x: 0, y: yb + 0.12, z: hz + 0.01 }, hx * 0.9, 0.08, 0.05, null, TRIM);
    wheel(hz * 0.62); wheel(-hz * 0.62);
  }
  // Lamps (tinted by the instance colour, kept bright).
  for (const s of [-1, 1]) {
    mb.box({ x: s * hx * 0.66, y: yb + 0.5, z: hz + 0.015 }, 0.17, 0.07, 0.03, null, [1.7, 1.7, 1.4]);
    mb.box({ x: s * hx * 0.66, y: yb + 0.56, z: -hz - 0.015 }, 0.17, 0.07, 0.03, null, [1.6, 0.22, 0.18]);
  }
  return mb;
}

export interface TrafficVisual {
  /** One instance per traffic agent, created lazily per type. */
  get(agentId: number, type: number, color: number): InstancedMesh;
  sources: Mesh[];
  dispose(): void;
}

export function buildTrafficVisual(scene: Scene): TrafficVisual {
  const mat = new StandardMaterial('traffic-paint', scene);
  mat.diffuseColor = Color3.White();
  mat.specularColor = new Color3(0.35, 0.35, 0.35);
  mat.specularPower = 40;
  const sources: Mesh[] = VEHICLE_TYPES.map((_, i) => {
    const m = trafficBody(i).toMesh(`traffic-${i}`, scene, mat);
    m.registerInstancedBuffer('color', 4);
    m.instancedBuffers.color = new Color4(1, 1, 1, 1);
    m.isVisible = false;
    m.isPickable = false;
    return m;
  });
  const instances = new Map<number, InstancedMesh>();
  return {
    sources,
    get(agentId, type, color) {
      let inst = instances.get(agentId);
      if (!inst) {
        inst = sources[type].createInstance(`car-${agentId}`);
        const c = type === 4 ? TRAM_COLOR : TRAFFIC_COLORS[color % TRAFFIC_COLOR_COUNT];
        inst.instancedBuffers.color = new Color4(c[0], c[1], c[2], 1);
        inst.rotationQuaternion = null;
        inst.isPickable = false;
        inst.alwaysSelectAsActiveMesh = true;
        instances.set(agentId, inst);
      }
      return inst;
    },
    dispose() {
      for (const i of instances.values()) i.dispose();
      instances.clear();
    },
  };
}

/** Low-poly passenger figure coloured from the archetype. Origin at the feet. */
export function buildPassengerMesh(scene: Scene, a: Archetype, mat: StandardMaterial): Mesh {
  const mb = new MeshBuf();
  const body = hex(a.body), accent = hex(a.accent), skin = hex(a.skin);
  mb.cyl(-0.13, 0, 0, 0.85, 0.11, 0.12, 6, mul(body, 0.6), false);
  mb.cyl(0.13, 0, 0, 0.85, 0.11, 0.12, 6, mul(body, 0.6), false);
  mb.cyl(0, 0, 0.8, 1.5, 0.3, 0.24, 8, body, true);
  mb.box({ x: 0, y: 1.2, z: 0.2 }, 0.2, 0.08, 0.06, null, accent);
  mb.sphere({ x: 0, y: 1.72, z: 0 }, 0.2, 0.22, 0.2, 8, skin);
  // Hailing arm.
  mb.box({ x: 0.36, y: 1.62, z: 0 }, 0.07, 0.32, 0.07, { x: 0, y: 0, z: -0.17, w: 0.985 }, body);
  mb.sphere({ x: 0.46, y: 1.98, z: 0 }, 0.08, 0.08, 0.08, 5, skin);
  mb.box({ x: -0.34, y: 1.12, z: 0 }, 0.07, 0.3, 0.07, null, body);
  switch (a.hat) {
    case 'cap': mb.cyl(0, 0, 1.84, 1.96, 0.21, 0.17, 8, accent); mb.box({ x: 0, y: 1.86, z: 0.22 }, 0.14, 0.02, 0.1, null, accent); break;
    case 'brim': mb.cyl(0, 0, 1.86, 1.89, 0.36, 0.36, 10, accent); mb.cyl(0, 0, 1.89, 2.02, 0.2, 0.17, 8, accent); break;
    case 'beanie': mb.sphere({ x: 0, y: 1.84, z: 0 }, 0.21, 0.17, 0.21, 8, accent); break;
    case 'helmet': mb.sphere({ x: 0, y: 1.78, z: 0 }, 0.24, 0.22, 0.24, 8, accent); break;
    case 'bun': mb.sphere({ x: 0, y: 1.96, z: -0.06 }, 0.11, 0.11, 0.11, 6, mul(skin, 0.4)); break;
    default: mb.sphere({ x: 0, y: 1.82, z: -0.03 }, 0.2, 0.14, 0.2, 6, mul(skin, 0.4));
  }
  const m = mb.toMesh(`passenger-${a.id}`, scene, mat);
  m.isPickable = false;
  return m;
}
