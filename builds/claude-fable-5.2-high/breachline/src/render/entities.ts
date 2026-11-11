// renderer: views for snapshot entities - thrown equipment, deployed devices and support-action telegraphs.
import { SUPPORT_TUNING as ST } from '../content/kit';
import { ENT } from '../protocol/messages';
import { Color3, CreateBox, CreateCylinder, CreateSphere, CreateTorus, Mesh, Scene, StandardMaterial, TransformNode } from './bjs';
import type { Vfx } from './vfx';

export interface EntityState { id: number; type: number; team: number; owner: number; x: number; y: number; z: number; a: number; b: number }

interface View { root: TransformNode; type: number; spin?: TransformNode; pulse?: Mesh; laser?: Mesh; inner?: Mesh; seen: number; t: number; plane?: TransformNode }

export class EntityViews {
  private views = new Map<number, View>();
  private mats: Record<string, StandardMaterial> = {};
  private frame = 0;

  constructor(private scene: Scene, private vfx: Vfx, accents: [string, string]) {
    const flat = (name: string, hex: string, emissive: number, alpha = 1): void => {
      const m = new StandardMaterial('ent_' + name, scene);
      const c = Color3.FromHexString(hex);
      m.diffuseColor = c;
      m.specularColor = new Color3(0.2, 0.2, 0.2);
      m.ambientColor = c;
      if (emissive > 0) { m.emissiveColor = c.scale(emissive); if (emissive >= 1) m.disableLighting = true; }
      if (alpha < 1) { m.alpha = alpha; m.backFaceCulling = false; m.disableDepthWrite = true; }
      this.mats[name] = m;
    };
    flat('dark', '#23272c', 0);
    flat('olive', '#4b5340', 0);
    flat('white', '#d9dde0', 0);
    flat('crate', '#5b6670', 0);
    flat('red', '#ff3528', 1);
    flat('redSoft', '#ff3528', 1, 0.4);
    flat('team0', accents[0], 1);
    flat('team1', accents[1], 1);
    flat('cyan', '#3ce6f5', 1);
    flat('cyanSoft', '#3ce6f5', 1, 0.35);
  }

  setAccents(accents: [string, string]): void {
    this.mats.team0.emissiveColor = Color3.FromHexString(accents[0]);
    this.mats.team1.emissiveColor = Color3.FromHexString(accents[1]);
  }

  private mesh(m: Mesh, parent: TransformNode, mat: string, x = 0, y = 0, z = 0): Mesh {
    m.parent = parent;
    m.position.set(x, y, z);
    m.material = this.mats[mat];
    m.isPickable = false;
    return m;
  }

  private build(e: EntityState): View {
    const s = this.scene;
    const root = new TransformNode('ent' + e.id, s);
    const v: View = { root, type: e.type, seen: this.frame, t: 0 };
    const team = e.team === 0 ? 'team0' : 'team1';
    switch (e.type) {
      case ENT.FRAG:
        this.mesh(CreateSphere('f', { diameter: 0.13, segments: 8 }, s), root, 'olive');
        this.mesh(CreateBox('f2', { width: 0.04, height: 0.05, depth: 0.04 }, s), root, 'dark', 0, 0.075, 0);
        this.mesh(CreateBox('f3', { width: 0.14, height: 0.02, depth: 0.02 }, s), root, team, 0, 0, 0);
        break;
      case ENT.STICKY:
        this.mesh(CreateBox('s', { width: 0.16, height: 0.08, depth: 0.12 }, s), root, 'dark');
        v.pulse = this.mesh(CreateSphere('s2', { diameter: 0.05, segments: 6 }, s), root, 'red', 0, 0.05, 0);
        break;
      case ENT.FLASH:
        this.mesh(CreateCylinder('fl', { height: 0.14, diameter: 0.07, tessellation: 10 }, s), root, 'white');
        this.mesh(CreateCylinder('fl2', { height: 0.03, diameter: 0.075, tessellation: 10 }, s), root, 'cyan', 0, 0.03, 0);
        break;
      case ENT.SMOKE_CAN:
        this.mesh(CreateCylinder('sc', { height: 0.16, diameter: 0.075, tessellation: 10 }, s), root, 'crate');
        this.mesh(CreateCylinder('sc2', { height: 0.03, diameter: 0.08, tessellation: 10 }, s), root, 'white', 0, 0.05, 0);
        break;
      case ENT.DART:
        this.mesh(CreateCylinder('d', { height: 0.2, diameter: 0.03, tessellation: 8 }, s), root, 'dark');
        this.mesh(CreateSphere('d2', { diameter: 0.06, segments: 6 }, s), root, 'cyan', 0, 0.1, 0);
        v.pulse = this.mesh(CreateTorus('d3', { diameter: 2, thickness: 0.035, tessellation: 40 }, s), root, 'cyanSoft');
        break;
      case ENT.MINE: {
        this.mesh(CreateBox('m', { width: 0.26, height: 0.12, depth: 0.1 }, s), root, 'olive', 0, 0.06, 0);
        this.mesh(CreateBox('m2', { width: 0.03, height: 0.03, depth: 0.03 }, s), root, 'red', 0, 0.13, 0.04);
        v.laser = this.mesh(CreateBox('m3', { width: 0.012, height: 0.012, depth: ST.mineRange }, s), root, 'redSoft', 0, 0.1, ST.mineRange / 2);
        v.inner = this.mesh(CreateBox('m4', { width: 0.012, height: 0.012, depth: ST.mineRange }, s), root, 'redSoft', 0, 0.1, ST.mineRange / 2);
        v.inner.rotation.y = 0.5; v.inner.position.x = Math.sin(0.5) * ST.mineRange / 2; v.inner.position.z = Math.cos(0.5) * ST.mineRange / 2;
        const l2 = this.mesh(CreateBox('m5', { width: 0.012, height: 0.012, depth: ST.mineRange }, s), root, 'redSoft', -Math.sin(0.5) * ST.mineRange / 2, 0.1, Math.cos(0.5) * ST.mineRange / 2);
        l2.rotation.y = -0.5;
        l2.parent = v.laser;
        l2.position.set(-Math.sin(0.5) * ST.mineRange / 2, 0, Math.cos(0.5) * ST.mineRange / 2 - ST.mineRange / 2);
        v.inner.parent = v.laser;
        v.inner.position.set(Math.sin(0.5) * ST.mineRange / 2, 0, Math.cos(0.5) * ST.mineRange / 2 - ST.mineRange / 2);
        break;
      }
      case ENT.POD:
        this.mesh(CreateBox('p', { width: 0.8, height: 0.55, depth: 0.55 }, s), root, 'crate', 0, 0.28, 0);
        this.mesh(CreateBox('p2', { width: 0.84, height: 0.06, depth: 0.59 }, s), root, team, 0, 0.42, 0);
        this.mesh(CreateBox('p3', { width: 0.7, height: 0.08, depth: 0.45 }, s), root, 'dark', 0, 0.58, 0);
        v.spin = new TransformNode('ps', s); v.spin.parent = root; v.spin.position.y = 1.1;
        this.mesh(CreateTorus('p4', { diameter: 0.5, thickness: 0.03, tessellation: 24 }, s), v.spin, team);
        break;
      case ENT.DRONE: {
        this.mesh(CreateBox('dr', { width: 0.5, height: 0.14, depth: 0.6 }, s), root, 'dark');
        this.mesh(CreateSphere('dr2', { diameter: 0.2, segments: 8 }, s), root, team, 0, -0.1, 0.18);
        v.spin = new TransformNode('drs', s); v.spin.parent = root;
        for (const [x, z] of [[0.42, 0.42], [-0.42, 0.42], [0.42, -0.42], [-0.42, -0.42]]) {
          this.mesh(CreateBox('arm', { width: 0.05, height: 0.03, depth: 0.05 }, s), root, 'dark', x * 0.6, 0.02, z * 0.6);
          this.mesh(CreateCylinder('rot', { height: 0.012, diameter: 0.44, tessellation: 14 }, s), root, 'cyanSoft', x, 0.08, z);
        }
        this.mesh(CreateBox('drl', { width: 0.52, height: 0.03, depth: 0.03 }, s), root, team, 0, 0.0, -0.3);
        break;
      }
      case ENT.SATCHEL:
        this.mesh(CreateBox('sa', { width: 0.34, height: 0.22, depth: 0.2 }, s), root, 'olive', 0, 0.1, 0);
        v.pulse = this.mesh(CreateBox('sa2', { width: 0.36, height: 0.04, depth: 0.22 }, s), root, 'cyan', 0, 0.14, 0);
        break;
      case ENT.MORTAR:
        v.pulse = this.mesh(CreateTorus('mo', { diameter: ST.mortarRadius * 2, thickness: 0.14, tessellation: 56 }, s), root, 'red', 0, 0.08, 0);
        v.inner = this.mesh(CreateTorus('mo2', { diameter: ST.mortarRadius * 2, thickness: 0.09, tessellation: 56 }, s), root, 'redSoft', 0, 0.1, 0);
        this.mesh(CreateCylinder('mo3', { height: 40, diameter: 0.25, tessellation: 8 }, s), root, 'redSoft', 0, 20, 0);
        break;
      case ENT.FLIGHT: {
        const L = ST.flightLength, W = ST.flightWidth;
        this.mesh(CreateBox('fl1', { width: 0.14, height: 0.05, depth: L }, s), root, 'red', W / 2, 0.08, L / 2);
        this.mesh(CreateBox('fl2', { width: 0.14, height: 0.05, depth: L }, s), root, 'red', -W / 2, 0.08, L / 2);
        for (let d = 3; d < L; d += 7) {
          const c1 = this.mesh(CreateBox('ch', { width: W * 0.36, height: 0.04, depth: 0.25 }, s), root, 'redSoft', W * 0.14, 0.07, d); c1.rotation.y = 0.7;
          const c2 = this.mesh(CreateBox('ch', { width: W * 0.36, height: 0.04, depth: 0.25 }, s), root, 'redSoft', -W * 0.14, 0.07, d); c2.rotation.y = -0.7;
        }
        // strike aircraft silhouette (appears during the pass)
        v.plane = new TransformNode('jet', s); v.plane.parent = root;
        this.mesh(CreateBox('j1', { width: 1.2, height: 0.9, depth: 9 }, s), v.plane, 'dark');
        this.mesh(CreateBox('j2', { width: 10, height: 0.2, depth: 3 }, s), v.plane, 'dark', 0, 0, -0.6);
        this.mesh(CreateBox('j3', { width: 3.6, height: 0.16, depth: 1.4 }, s), v.plane, 'dark', 0, 0.2, -4);
        this.mesh(CreateBox('j4', { width: 0.16, height: 1.6, depth: 1.6 }, s), v.plane, 'dark', 0, 0.8, -4);
        this.mesh(CreateBox('j5', { width: 0.5, height: 0.3, depth: 0.5 }, s), v.plane, team, 0, 0, -4.6);
        v.plane.setEnabled(false);
        break;
      }
      default:
        this.mesh(CreateSphere('x', { diameter: 0.1, segments: 6 }, s), root, 'dark');
    }
    return v;
  }

  /** elapsedSinceImpact: seconds since each flight entity began its pass (keyed by entity id), or undefined. */
  update(dt: number, list: EntityState[], flightImpact: Map<number, number>, now: number): void {
    this.frame++;
    this.vfx.volumes.length = 0;
    for (const e of list) {
      if (e.type === ENT.SMOKE) {
        const life = e.b / 255;
        const fade = Math.min(1, (1 - life) * ST.smokeLife / 0.9, life * ST.smokeLife / 1.6);
        this.vfx.volumes.push({ x: e.x, y: e.y, z: e.z, r: 5.2, fade: Math.max(0.05, Math.min(1, fade)), seed: e.id });
        continue;
      }
      let v = this.views.get(e.id);
      if (!v || v.type !== e.type) { v?.root.dispose(); v = this.build(e); this.views.set(e.id, v); }
      v.seen = this.frame;
      v.t += dt;
      v.root.position.set(e.x, e.y, e.z);
      const yaw = (e.a / 255) * Math.PI * 2;
      switch (e.type) {
        case ENT.FRAG: case ENT.FLASH: case ENT.SMOKE_CAN:
          v.root.rotation.x += dt * 7; v.root.rotation.z += dt * 4;
          break;
        case ENT.STICKY:
          if (v.pulse) v.pulse.scaling.setAll(1 + Math.sin(v.t * 30) * 0.5);
          break;
        case ENT.DART:
          if (v.pulse) {
            v.pulse.setEnabled(e.b === 1);
            const u = (v.t % ST.dartPulse) / ST.dartPulse;
            v.pulse.scaling.set(u * 12, 1, u * 12);
            v.pulse.visibility = 1 - u;
          }
          break;
        case ENT.MINE:
          v.root.rotation.y = yaw;
          if (v.laser) v.laser.setEnabled(e.b === 1);
          break;
        case ENT.POD:
          if (v.spin) { v.spin.rotation.y += dt * 2; v.spin.position.y = 1.05 + Math.sin(v.t * 2) * 0.06; }
          break;
        case ENT.DRONE:
          v.root.rotation.y = yaw;
          v.root.position.y += Math.sin(v.t * 2.4) * 0.08;
          v.root.rotation.z = Math.sin(v.t * 1.3) * 0.05;
          break;
        case ENT.SATCHEL:
          if (v.pulse) v.pulse.visibility = 0.6 + Math.sin(v.t * 5) * 0.4;
          break;
        case ENT.MORTAR: {
          const prog = e.b / 255;
          if (v.inner) { const sc = Math.max(0.05, 1 - prog); v.inner.scaling.set(sc, 1, sc); }
          if (v.pulse) v.pulse.visibility = 0.55 + Math.sin(v.t * (8 + prog * 22)) * 0.45;
          break;
        }
        case ENT.FLIGHT: {
          v.root.rotation.y = yaw;
          const blink = 0.5 + Math.sin(v.t * (6 + (e.b / 255) * 18)) * 0.5;
          for (const m of v.root.getChildMeshes(true)) m.visibility = 0.35 + blink * 0.65;
          const t0 = flightImpact.get(e.id);
          if (v.plane) {
            if (t0 !== undefined) {
              const u = (now - t0) / ST.flightDuration;
              v.plane.setEnabled(u > -0.6 && u < 1.6);
              v.plane.position.set(0, 26, (u - 0.25) * ST.flightLength);
              for (const m of v.plane.getChildMeshes(true)) m.visibility = 1;
            } else v.plane.setEnabled(false);
          }
          break;
        }
      }
    }
    for (const [id, v] of this.views) {
      if (v.seen !== this.frame) { v.root.dispose(); this.views.delete(id); }
    }
  }

  clear(): void {
    for (const v of this.views.values()) v.root.dispose();
    this.views.clear();
    this.vfx.volumes.length = 0;
  }
}
