// Characters and vehicles drawn with thin instances (a few draw calls for the whole crowd).
// Characters share one procedural rig; poses are computed per frame from sim state.

import { Color3, Matrix, Mesh, MeshBuilder, Quaternion, StandardMaterial, Vector3, VertexData, type Scene } from "@babylonjs/core";
import { Geo, type RGB } from "./geometry";
import type { Game } from "../sim/game";
import type { Character } from "../sim/character";
import { VEHICLES, type Vehicle, type VehicleModel, type VehicleSpec } from "../sim/vehicle";
import { lerp } from "../core/math";

const MAXH = 220;
type PartName = "legL" | "legR" | "torso" | "head" | "hair" | "hat" | "armL" | "armR" | "bag" | "item";
const PARTS: PartName[] = ["legL", "legR", "torso", "head", "hair", "hat", "armL", "armR", "bag", "item"];
const PIVOT: Record<PartName, [number, number, number]> = {
  legL: [-0.11, 0.9, 0], legR: [0.11, 0.9, 0], torso: [0, 0.9, 0], head: [0, 1.5, 0], hair: [0, 1.5, 0], hat: [0, 1.5, 0],
  armL: [-0.29, 1.44, 0], armR: [0.29, 1.44, 0], bag: [0, 0.9, 0], item: [0.29, 1.44, 0],
};

interface PartBuf { mesh: Mesh; mat: Float32Array; col: Float32Array; n: number }

function partGeo(p: PartName): Geo {
  const g = new Geo();
  const w: RGB = [1, 1, 1];
  switch (p) {
    case "legL": case "legR": g.box(-0.085, -0.9, -0.1, 0.085, 0, 0.1, w); g.box(-0.09, -0.9, -0.12, 0.09, -0.8, 0.16, [0.25, 0.25, 0.27]); break;
    case "torso": g.box(-0.22, 0, -0.13, 0.22, 0.58, 0.13, w); g.box(-0.2, -0.05, -0.12, 0.2, 0.12, 0.12, [0.85, 0.85, 0.85]); break;
    case "head": g.box(-0.11, 0.04, -0.12, 0.11, 0.3, 0.12, w); g.box(-0.04, 0.16, 0.11, 0.04, 0.2, 0.135, [0.6, 0.5, 0.45]); break;
    case "hair": g.box(-0.12, 0.22, -0.13, 0.12, 0.33, 0.1, w); g.box(-0.12, 0.1, -0.13, 0.12, 0.25, -0.08, w); break;
    case "hat": g.box(-0.13, 0.27, -0.14, 0.13, 0.36, 0.13, w); g.box(-0.13, 0.27, 0.1, 0.13, 0.3, 0.24, w); break;
    case "armL": case "armR": g.box(-0.06, -0.6, -0.065, 0.06, 0.02, 0.065, w); g.box(-0.055, -0.68, -0.06, 0.055, -0.58, 0.06, [0.85, 0.7, 0.55]); break;
    case "bag": g.box(-0.18, 0.1, -0.26, 0.18, 0.5, -0.12, w); break;
    case "item": g.box(-0.04, -0.66, -0.02, 0.04, -0.56, 0.4, w); break;
  }
  return g;
}

/** Per-model vehicle geometry (local: x right, z forward, y up from ground). */
function vehicleGeo(s: VehicleSpec) {
  const paint = new Geo(), detail = new Geo(), lights = new Geo();
  const W = s.width, L = s.length, H = s.height;
  const white: RGB = [1, 1, 1];
  const glass: RGB = [0.16, 0.22, 0.27], trim: RGB = [0.12, 0.12, 0.13], chrome: RGB = [0.7, 0.72, 0.75];
  if (s.moto) {
    paint.obox(0, 0.85, 0.15, 0.32, 0.22, 0.6, 0, white, 0.2); // tank
    paint.obox(0, 0.85, 0.62, 0.36, 0.38, 0.3, 0, white, 0.3); // fairing
    paint.obox(0, 0.62, -0.62, 0.22, 0.12, 0.5, 0, white); // tail
    detail.obox(0, 0.8, -0.3, 0.26, 0.1, 0.55, 0, trim); // seat
    detail.obox(0, 0.48, 0.05, 0.3, 0.32, 0.55, 0, [0.35, 0.35, 0.37]); // engine
    detail.obox(0, 0.62, 0.62, 0.06, 0.6, 0.08, -0.35, chrome); // fork
    detail.obox(0.16, 0.38, -0.45, 0.08, 0.08, 0.6, 0, chrome); // exhaust
    detail.obox(0, 1.03, 0.72, 0.5, 0.05, 0.05, 0, trim); // bars
    if (s.id === "kestrel") paint.obox(0, 0.95, -0.72, 0.42, 0.34, 0.42, 0, white); // courier box
    lights.obox(0, 0.92, 0.78, 0.14, 0.1, 0.04, 0, [1, 0.95, 0.8]);
    lights.obox(0, 0.68, -0.88, 0.12, 0.05, 0.04, 0, [1, 0.1, 0.08]);
    return { paint, detail, lights };
  }
  const sill = 0.28, belt = H * (s.cls === "van" ? 0.5 : 0.6);
  // lower body with slightly narrowed nose
  paint.obox(0, (sill + belt) / 2, 0, W, belt - sill, L * 0.98, 0, white);
  detail.obox(0, sill + 0.06, L / 2 - 0.08, W * 0.98, 0.2, 0.2, 0, trim);
  detail.obox(0, sill + 0.06, -L / 2 + 0.08, W * 0.98, 0.2, 0.2, 0, trim);
  // wheel arches
  const a = s.cgFront * s.wheelbase, b = s.wheelbase - a;
  for (const z of [a, -b]) for (const x of [-1, 1]) detail.obox(x * (W / 2 - 0.02), 0.42, z, 0.06, 0.34, 0.86, 0, trim);
  if (s.cls === "van") {
    paint.obox(0, (belt + H) / 2, -L * 0.12, W * 0.98, H - belt, L * 0.74, 0, white);
    detail.obox(0, (belt + H - 0.3) / 2 + 0.05, L * 0.31, W * 0.9, H - belt - 0.4, L * 0.22, 0, glass, 0.15);
    detail.obox(0, belt + 0.45, -L * 0.12, W * 1.0, 0.18, L * 0.7, 0, [0.95, 0.55, 0.15]); // livery stripe
  } else {
    const cabL = s.cls === "muscle" ? L * 0.38 : s.cls === "compact" ? L * 0.52 : L * 0.46;
    const cabZ = s.cls === "muscle" ? -L * 0.12 : s.cls === "compact" ? -L * 0.06 : -L * 0.06;
    detail.obox(0, (belt + H) / 2, cabZ, W * 0.88, H - belt, cabL, 0, glass, 0.18);
    paint.obox(0, H - 0.03, cabZ, W * 0.7, 0.06, cabL * 0.72, 0, white);
    if (s.cls === "muscle") { detail.obox(-0.25, belt + 0.005, L * 0.2, 0.18, 0.02, L * 0.5, 0, [0.95, 0.95, 0.9]); detail.obox(0.25, belt + 0.005, L * 0.2, 0.18, 0.02, L * 0.5, 0, [0.95, 0.95, 0.9]); }
    if (s.cls === "police") {
      detail.obox(0, belt - 0.14, -L * 0.02, W * 1.01, 0.22, L * 0.6, 0, [0.12, 0.2, 0.42]);
      detail.obox(0, H + 0.04, cabZ, W * 0.6, 0.1, 0.3, 0, [0.2, 0.2, 0.22]);
    }
  }
  for (const x of [-1, 1]) {
    lights.obox(x * W * 0.32, belt - 0.12, L / 2 - 0.01, W * 0.2, 0.12, 0.04, 0, [1, 0.95, 0.82]);
    lights.obox(x * W * 0.36, belt - 0.1, -L / 2 + 0.01, W * 0.16, 0.1, 0.04, 0, [1, 0.1, 0.08]);
  }
  return { paint, detail, lights };
}

function thin(mesh: Mesh, n: number, colors: boolean): PartBuf {
  const mat = new Float32Array(n * 16), col = new Float32Array(n * 4);
  mesh.thinInstanceSetBuffer("matrix", mat, 16, false);
  if (colors) mesh.thinInstanceSetBuffer("color", col, 4, false);
  mesh.thinInstanceCount = 0;
  mesh.isVisible = false;
  mesh.alwaysSelectAsActiveMesh = true;
  mesh.isPickable = false;
  return { mesh, mat, col, n: 0 };
}

const tmpM = new Matrix(), tmpA = new Matrix(), tmpB = new Matrix(), root = new Matrix();
const vOne = new Vector3(1, 1, 1);

export class ActorRender {
  human: Record<PartName, PartBuf> = {} as any;
  veh: Record<string, { paint: PartBuf; detail: PartBuf; lights: PartBuf }> = {};
  tire: PartBuf; rim: PartBuf;
  barR: PartBuf; barB: PartBuf;
  lightsMat: StandardMaterial;
  ghost: Mesh;
  playerSpot: import("@babylonjs/core").SpotLight | null = null;

  constructor(scene: Scene, shadow: (m: Mesh) => void) {
    const mkMat = (name: string, opts: { emissive?: RGB; unlit?: boolean; alpha?: number } = {}) => {
      const m = new StandardMaterial(name, scene);
      m.diffuseColor = new Color3(1, 1, 1);
      m.specularColor = new Color3(0.08, 0.08, 0.08);
      if (opts.emissive) m.emissiveColor = new Color3(...opts.emissive);
      if (opts.unlit) m.disableLighting = true;
      if (opts.alpha !== undefined) m.alpha = opts.alpha;
      m.backFaceCulling = false;
      return m;
    };
    const hm = mkMat("human");
    for (const p of PARTS) {
      const mesh = partGeo(p).build(`h_${p}`, scene, hm)!;
      this.human[p] = thin(mesh, MAXH, true);
      shadow(mesh);
    }
    const paintMat = mkMat("paint"); paintMat.specularColor = new Color3(0.45, 0.45, 0.45); paintMat.specularPower = 48;
    const detailMat = mkMat("vdetail"); detailMat.specularColor = new Color3(0.35, 0.35, 0.35);
    this.lightsMat = mkMat("vlights", { emissive: [0.25, 0.22, 0.2] });
    for (const id of Object.keys(VEHICLES) as VehicleModel[]) {
      const g = vehicleGeo(VEHICLES[id]);
      const paint = g.paint.build(`v_${id}_p`, scene, paintMat)!;
      const detail = g.detail.build(`v_${id}_d`, scene, detailMat)!;
      const lights = g.lights.build(`v_${id}_l`, scene, this.lightsMat)!;
      shadow(paint); shadow(detail);
      this.veh[id] = { paint: thin(paint, 48, true), detail: thin(detail, 48, false), lights: thin(lights, 48, false) };
    }
    const tireMesh = MeshBuilder.CreateCylinder("tire", { diameter: 2, height: 1, tessellation: 12 }, scene);
    tireMesh.bakeTransformIntoVertices(Matrix.RotationZ(Math.PI / 2));
    tireMesh.material = mkMat("tireMat"); (tireMesh.material as StandardMaterial).diffuseColor = new Color3(0.08, 0.08, 0.09);
    const rimMesh = MeshBuilder.CreateCylinder("rim", { diameter: 1.25, height: 1.06, tessellation: 8 }, scene);
    rimMesh.bakeTransformIntoVertices(Matrix.RotationZ(Math.PI / 2));
    rimMesh.material = mkMat("rimMat"); (rimMesh.material as StandardMaterial).diffuseColor = new Color3(0.65, 0.67, 0.7);
    this.tire = thin(tireMesh, 48 * 4, false);
    this.rim = thin(rimMesh, 48 * 4, false);
    shadow(tireMesh);
    const bar = (name: string) => {
      const m = MeshBuilder.CreateBox(name, { width: 0.42, height: 0.14, depth: 0.26 }, scene);
      m.material = mkMat(`${name}Mat`, { unlit: true });
      return thin(m, 64, true);
    };
    this.barR = bar("barR"); this.barB = bar("barB");
    this.ghost = MeshBuilder.CreateBox("ghost", { width: 1.9, height: 1.3, depth: 4.6 }, scene);
    this.ghost.material = mkMat("ghostMat", { emissive: [0.3, 0.8, 0.9], alpha: 0.28 });
    this.ghost.isPickable = false;
    this.ghost.setEnabled(false);
  }

  private pushPart(p: PartName, local: Matrix, c: RGB) {
    const b = this.human[p];
    if (b.n >= MAXH) return;
    local.multiplyToRef(root, tmpM);
    tmpM.copyToArray(b.mat, b.n * 16);
    b.col[b.n * 4] = c[0]; b.col[b.n * 4 + 1] = c[1]; b.col[b.n * 4 + 2] = c[2]; b.col[b.n * 4 + 3] = 1;
    b.n++;
  }

  private limb(p: PartName, rx: number, rz: number, c: RGB, sx = 1) {
    const pv = PIVOT[p];
    Matrix.ComposeToRef(new Vector3(sx, 1, 1), Quaternion.RotationYawPitchRoll(0, rx, rz), new Vector3(pv[0], pv[1], pv[2]), tmpA);
    this.pushPart(p, tmpA, c);
  }

  drawHuman(c: Character, a: number, opts: { seated?: boolean; moto?: boolean; vx?: number; vy?: number; vz?: number; vyaw?: number; vpitch?: number; vroll?: number; seatX?: number; seatY?: number; seatZ?: number; flash?: number; hidden?: boolean } = {}) {
    if (opts.hidden) return;
    const L = c.look;
    let x: number, y: number, z: number, yaw: number, pitch = 0, roll = 0;
    if (opts.seated) {
      // compose seat offset within the vehicle frame
      const vyaw = opts.vyaw!;
      const cs = Math.cos(vyaw), sn = Math.sin(vyaw);
      const sx = opts.seatX ?? 0, sz = opts.seatZ ?? 0;
      x = opts.vx! + sx * cs + sz * sn; z = opts.vz! - sx * sn + sz * cs; y = opts.vy! + (opts.seatY ?? 0.3);
      yaw = vyaw; pitch = opts.vpitch ?? 0; roll = opts.vroll ?? 0;
    } else {
      x = lerp(c.px, c.x, a); y = lerp(c.py, c.y, a); z = lerp(c.pz, c.z, a);
      const dy = Math.atan2(Math.sin(c.yaw - c.pyaw), Math.cos(c.yaw - c.pyaw));
      yaw = c.pyaw + dy * a;
    }
    const lying = !opts.seated && c.status !== "normal";
    const s = L.scale;
    let lift = 0;
    if (lying) { pitch = -Math.PI / 2; lift = 0.14; }
    else if (c.swimming) { pitch = 1.2; lift = 0.3; }
    else if (c.crouch && !opts.seated) lift = -0.42;
    Matrix.ComposeToRef(new Vector3(s * L.build, s, s), Quaternion.RotationYawPitchRoll(yaw, pitch, roll), new Vector3(x, y + lift, z), root);

    const sp = c.animSpeed;
    const amp = opts.seated || lying ? 0 : Math.min(1, sp / 5.5) * 0.75;
    const ph = c.animPhase;
    const sw = Math.sin(ph) * amp;
    let legL = sw, legR = -sw, armL = -sw * 0.8, armR = sw * 0.8, armLz = 0.06, armRz = -0.06;
    if (c.swimming) { legL = Math.sin(ph * 2) * 0.4; legR = -legL; armL = -2.6 + Math.sin(ph) * 0.8; armR = -2.6 - Math.sin(ph) * 0.8; }
    if (opts.seated) { legL = legR = -1.45; armL = armR = -1.0; if (opts.moto) { armL = armR = -1.15; legL = legR = -1.2; } }
    else if (c.crouch && !lying) { legL = legR = -1.1; }
    if (c.mantle) { armL = armR = -2.8; }
    if (c.aiming && !lying) { armR = -Math.PI / 2 - 0.05; armL = -1.35; armLz = -0.5; }
    if (c.phoneUp) { armR = -2.5; armRz = 0.5; }
    if (c.handsUp) { armL = armR = -3.0; armLz = 0.25; armRz = -0.25; }
    if (c.talkTimer > 0 && c.talkTimer < 7 && !c.aiming && amp < 0.1 && !opts.seated) armR = -0.4 + Math.sin(c.talkTimer * 4) * 0.25;
    if (c.meleeTimer > 0.3) armR = -1.9;
    const bob = opts.seated ? 0 : Math.abs(Math.sin(ph)) * 0.035 * amp;
    const flash = (c.hitFlash > 0 ? 0.6 : 0) + (opts.flash ?? 0);
    const fc = (col: RGB): RGB => flash > 0 ? [Math.min(1, col[0] + flash), col[1] * (1 - flash * 0.5), col[2] * (1 - flash * 0.5)] : col;
    this.limb("legL", legL, 0, fc(L.bottom));
    this.limb("legR", legR, 0, fc(L.bottom));
    Matrix.ComposeToRef(vOne, Quaternion.RotationYawPitchRoll(0, opts.seated ? -0.1 : sp > 5 ? 0.12 : 0, 0), new Vector3(0, 0.9 + bob, 0), tmpA);
    this.pushPart("torso", tmpA, fc(L.top));
    Matrix.ComposeToRef(vOne, Quaternion.Identity(), new Vector3(0, 1.5 + bob, 0), tmpB);
    this.pushPart("head", tmpB, L.skin);
    this.pushPart("hair", tmpB, L.hair);
    if (L.hat) this.pushPart("hat", tmpB, L.accent);
    this.limb("armL", armL, armLz, fc(L.top));
    this.limb("armR", armR, armRz, fc(L.top));
    if (L.bag && !opts.seated) {
      Matrix.ComposeToRef(vOne, Quaternion.Identity(), new Vector3(0, 0.9 + bob, 0), tmpB);
      this.pushPart("bag", tmpB, [L.accent[0] * 0.7, L.accent[1] * 0.7, L.accent[2] * 0.7]);
    }
    const armed = c.weapon !== "fists";
    if ((c.aiming && armed) || c.phoneUp) {
      const pv = PIVOT.item;
      Matrix.ComposeToRef(new Vector3(1, 1, c.phoneUp ? 0.35 : c.weapon === "carbine" || c.weapon === "shotgun" || c.weapon === "marksman" ? 2.1 : 0.9), Quaternion.RotationYawPitchRoll(0, armR, armRz), new Vector3(pv[0], pv[1], pv[2]), tmpA);
      this.pushPart("item", tmpA, c.phoneUp ? [0.1, 0.1, 0.12] : c.weapon === "stun" ? [0.95, 0.8, 0.2] : c.weapon === "baton" ? [0.15, 0.15, 0.15] : [0.18, 0.18, 0.2]);
    }
  }

  drawVehicle(v: Vehicle, a: number, night: number, t: number, photosafe: boolean) {
    const s = v.spec;
    const buf = this.veh[s.id];
    if (buf.paint.n >= 48) return;
    const x = lerp(v.px, v.x, a), z = lerp(v.pz, v.z, a), y = lerp(v.py, v.y, a);
    const dy = Math.atan2(Math.sin(v.yaw - v.pyaw), Math.cos(v.yaw - v.pyaw));
    const yaw = v.pyaw + dy * a;
    const roll = s.moto ? -v.lean : v.roll;
    const pitch = -v.pitch;
    const sink = v.sinking > 0 ? Math.min(1.5, v.sinking * 0.5) : 0;
    Matrix.ComposeToRef(vOne, Quaternion.RotationYawPitchRoll(yaw, pitch + (v.sinking > 0 ? 0.15 : 0), roll), new Vector3(x, y + v.heave * 0.5 - sink, z), root);
    const n = buf.paint.n;
    root.copyToArray(buf.paint.mat, n * 16);
    root.copyToArray(buf.detail.mat, n * 16);
    root.copyToArray(buf.lights.mat, n * 16);
    // damage darkens paint
    const dmg = 1 - (100 - v.health) * 0.004;
    buf.paint.col.set([v.color[0] * dmg, v.color[1] * dmg, v.color[2] * dmg, 1], n * 4);
    buf.paint.n++; buf.detail.n++; buf.lights.n++;
    // wheels
    const aF = s.cgFront * s.wheelbase, bR = s.wheelbase - aF;
    const r = s.moto ? 0.32 : s.cls === "van" ? 0.38 : 0.34;
    const wW = s.moto ? 0.13 : 0.24;
    const ht = s.moto ? 0 : s.track / 2;
    const wheels: [number, number, boolean, number][] = s.moto ? [[0, aF, true, 0], [0, -bR, false, 2]] : [[-ht, aF, true, 0], [ht, aF, true, 1], [-ht, -bR, false, 2], [ht, -bR, false, 3]];
    for (const [wx, wz, front, i] of wheels) {
      if (this.tire.n >= 48 * 4) break;
      const comp = v.susp[i] ?? 0;
      Matrix.ComposeToRef(new Vector3(wW, r, r), Quaternion.RotationYawPitchRoll(front ? v.steer : 0, v.wheelSpin, 0), new Vector3(wx, r + comp - v.heave * 0.5, wz), tmpA);
      tmpA.multiplyToRef(root, tmpM);
      tmpM.copyToArray(this.tire.mat, this.tire.n * 16); this.tire.n++;
      tmpM.copyToArray(this.rim.mat, this.rim.n * 16); this.rim.n++;
    }
    // occupants
    const P = (globalThis as any).__game as Game | undefined;
    const seatY = s.moto ? -0.08 : -0.42;
    const seats = s.moto ? [[0, -0.2]] : [[-s.width * 0.22, -s.length * 0.08], [s.width * 0.22, -s.length * 0.08]];
    let k = 0;
    if (v.driver === "player" && P) {
      this.drawHuman(P.player, a, { seated: true, moto: s.moto, vx: x, vy: y - sink, vz: z, vyaw: yaw, vpitch: pitch, vroll: roll, seatX: seats[0][0], seatZ: seats[0][1], seatY });
      k = 1;
    }
    for (const c of v.crew as Character[]) {
      if (c.vehicle !== v || k >= seats.length) continue;
      this.drawHuman(c, a, { seated: true, moto: s.moto, vx: x, vy: y - sink, vz: z, vyaw: yaw, vpitch: pitch, vroll: roll, seatX: seats[k][0], seatZ: seats[k][1], seatY });
      k++;
    }
    // light bars / hazards (flash rate <= 2 Hz, photosensitive mode: steady)
    const flashOn = photosafe ? true : Math.floor(t * 4) % 2 === 0;
    if ((v.siren || v.role === "police") && s.cls === "police") {
      for (const [bar, side, col] of [[this.barR, -1, [1, 0.1, 0.08]], [this.barB, 1, [0.15, 0.35, 1]]] as const) {
        if (bar.n >= 64) continue;
        Matrix.ComposeToRef(vOne, Quaternion.Identity(), new Vector3(side * 0.24, s.height + 0.12, -s.length * 0.06), tmpA);
        tmpA.multiplyToRef(root, tmpM);
        tmpM.copyToArray(bar.mat, bar.n * 16);
        const on = !v.siren ? 0.25 : photosafe ? 0.75 : (side < 0) === flashOn ? 1 : 0.12;
        bar.col.set([col[0] * on, col[1] * on, col[2] * on, 1], bar.n * 4);
        bar.n++;
      }
    } else if (v.hazard && flashOn) {
      for (const side of [-1, 1]) {
        if (this.barR.n >= 64) break;
        Matrix.ComposeToRef(new Vector3(0.4, 0.6, 0.3), Quaternion.Identity(), new Vector3(side * s.width * 0.4, s.height * 0.55, s.length / 2), tmpA);
        tmpA.multiplyToRef(root, tmpM);
        tmpM.copyToArray(this.barR.mat, this.barR.n * 16);
        this.barR.col.set([1, 0.6, 0.1, 1], this.barR.n * 4);
        this.barR.n++;
      }
    }
    void night;
  }

  begin() {
    for (const p of PARTS) this.human[p].n = 0;
    for (const k of Object.keys(this.veh)) { const b = this.veh[k]; b.paint.n = b.detail.n = b.lights.n = 0; }
    this.tire.n = this.rim.n = 0; this.barR.n = this.barB.n = 0;
  }

  end() {
    const flush = (b: PartBuf, colors: boolean) => {
      b.mesh.thinInstanceCount = b.n;
      b.mesh.isVisible = b.n > 0;
      b.mesh.thinInstanceBufferUpdated("matrix");
      if (colors) b.mesh.thinInstanceBufferUpdated("color");
    };
    for (const p of PARTS) flush(this.human[p], true);
    for (const k of Object.keys(this.veh)) { const b = this.veh[k]; flush(b.paint, true); flush(b.detail, false); flush(b.lights, false); }
    flush(this.tire, false); flush(this.rim, false); flush(this.barR, true); flush(this.barB, true);
  }
}

export { VertexData };
