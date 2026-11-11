/** Procedural, original models: scavenger characters, wind-instrument weapons, items, skiff, wing-sail. */
import * as THREE from 'three';
import { COSMETICS, ITEMS, RARITIES, WEAPONS, type ItemId, type WeaponId } from '../shared/content';

const geoCache = new Map<string, THREE.BufferGeometry>();
function box(w: number, h: number, d: number): THREE.BufferGeometry {
  const k = `b${w},${h},${d}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.BoxGeometry(w, h, d); geoCache.set(k, g); }
  return g;
}
function cyl(rt: number, rb: number, h: number, seg = 10): THREE.BufferGeometry {
  const k = `c${rt},${rb},${h},${seg}`;
  let g = geoCache.get(k);
  if (!g) { g = new THREE.CylinderGeometry(rt, rb, h, seg); geoCache.set(k, g); }
  return g;
}
const matCache = new Map<string, THREE.Material>();
export function lambert(color: string | number, emissive?: string | number): THREE.MeshLambertMaterial {
  const k = `l${color}${emissive ?? ''}`;
  let m = matCache.get(k) as THREE.MeshLambertMaterial | undefined;
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) });
    if (emissive !== undefined) m.emissive = new THREE.Color(emissive);
    matCache.set(k, m);
  }
  return m;
}
function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const me = new THREE.Mesh(g, m);
  me.position.set(x, y, z);
  me.castShadow = true;
  return me;
}

/** Weapons point down +Z (barrel forward). Origin sits at the grip. */
export function buildWeapon(id: WeaponId, rarity: number): THREE.Group {
  const g = new THREE.Group();
  const def = WEAPONS[id];
  const body = lambert(def.color);
  const dark = lambert('#3a3a44');
  const copper = lambert('#c77d3d');
  const gem = lambert(RARITIES[rarity].color, RARITIES[rarity].color);
  const add = (m: THREE.Mesh) => { g.add(m); return m; };
  switch (id) {
    case 'wayfarer':
      add(mesh(box(0.07, 0.12, 0.5), body, 0, 0.02, 0.22));
      add(mesh(cyl(0.02, 0.02, 0.45), dark, 0, 0.04, 0.62)).rotation.x = Math.PI / 2;
      add(mesh(box(0.06, 0.1, 0.22), lambert('#8a5a3a'), 0, -0.01, -0.12));
      add(mesh(box(0.05, 0.14, 0.07), dark, 0, -0.12, 0.2)).rotation.x = 0.25;
      add(mesh(cyl(0.012, 0.012, 0.3), copper, 0.05, 0.07, 0.35)).rotation.x = Math.PI / 2;
      break;
    case 'tempest':
      add(mesh(box(0.07, 0.11, 0.38), body, 0, 0.02, 0.16));
      add(mesh(cyl(0.022, 0.022, 0.3), dark, 0, 0.03, 0.46)).rotation.x = Math.PI / 2;
      add(mesh(box(0.045, 0.13, 0.06), dark, 0, -0.12, 0.12)).rotation.x = 0.1;
      add(mesh(box(0.06, 0.07, 0.16), lambert('#245a5a'), 0, 0.01, -0.1));
      break;
    case 'breakwater':
      add(mesh(box(0.08, 0.11, 0.42), body, 0, 0.02, 0.18));
      add(mesh(cyl(0.035, 0.035, 0.55), dark, 0, 0.05, 0.6)).rotation.x = Math.PI / 2;
      add(mesh(box(0.1, 0.08, 0.2), lambert('#6a4630'), 0, -0.01, 0.42));
      add(mesh(box(0.06, 0.1, 0.2), lambert('#6a4630'), 0, -0.01, -0.1));
      break;
    case 'coil': {
      add(mesh(box(0.08, 0.11, 0.4), body, 0, 0.02, 0.18));
      add(mesh(cyl(0.03, 0.03, 0.5), dark, 0, 0.05, 0.56)).rotation.x = Math.PI / 2;
      for (let i = 0; i < 4; i++) { const t = mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12), copper, 0, 0.05, 0.4 + i * 0.1); g.add(t); }
      add(mesh(box(0.06, 0.1, 0.2), dark, 0, -0.01, -0.1));
      break;
    }
    case 'needler':
      add(mesh(box(0.06, 0.1, 0.3), body, 0, 0.02, 0.12));
      add(mesh(cyl(0.015, 0.015, 0.2), dark, 0, 0.03, 0.36)).rotation.x = Math.PI / 2;
      add(mesh(box(0.04, 0.2, 0.05), dark, 0, -0.14, 0.14));
      add(mesh(box(0.045, 0.08, 0.1), body, 0, 0.0, -0.06));
      break;
    case 'sundial': {
      add(mesh(box(0.07, 0.12, 0.6), body, 0, 0.02, 0.28));
      add(mesh(cyl(0.02, 0.02, 0.4), dark, 0, 0.04, 0.78)).rotation.x = Math.PI / 2;
      const s = add(mesh(cyl(0.035, 0.035, 0.22), dark, 0, 0.13, 0.3)); s.rotation.x = Math.PI / 2;
      const dial = add(mesh(cyl(0.06, 0.06, 0.015, 16), copper, 0, 0.12, 0.18)); dial.rotation.z = Math.PI / 2;
      add(mesh(box(0.06, 0.1, 0.22), lambert('#8a5a3a'), 0, -0.02, -0.14));
      break;
    }
    case 'longwake': {
      add(mesh(box(0.07, 0.11, 0.55), body, 0, 0.02, 0.25));
      add(mesh(cyl(0.025, 0.025, 0.7), dark, 0, 0.04, 0.85)).rotation.x = Math.PI / 2;
      for (let i = 0; i < 3; i++) add(mesh(box(0.1, 0.1, 0.03), copper, 0, 0.04, 0.6 + i * 0.18));
      const glint = add(mesh(new THREE.SphereGeometry(0.035, 8, 6), lambert('#d8c8ff', '#b79bff'), 0, 0.15, 0.32));
      glint.castShadow = false;
      add(mesh(box(0.06, 0.1, 0.22), dark, 0, -0.02, -0.14));
      break;
    }
    case 'harbor':
      add(mesh(box(0.05, 0.08, 0.22), body, 0, 0.03, 0.1));
      add(mesh(box(0.045, 0.14, 0.06), dark, 0, -0.07, 0.0)).rotation.x = -0.2;
      add(mesh(cyl(0.012, 0.012, 0.08), dark, 0, 0.04, 0.24)).rotation.x = Math.PI / 2;
      break;
    case 'gale': {
      add(mesh(box(0.08, 0.11, 0.4), body, 0, 0.02, 0.16));
      const bell = add(mesh(cyl(0.12, 0.04, 0.3, 14), copper, 0, 0.04, 0.5)); bell.rotation.x = Math.PI / 2;
      add(mesh(cyl(0.03, 0.03, 0.25), dark, 0, 0.04, 0.28)).rotation.x = Math.PI / 2;
      add(mesh(box(0.06, 0.1, 0.2), dark, 0, -0.02, -0.1));
      break;
    }
  }
  const gm = mesh(box(0.035, 0.035, 0.035), gem, 0, 0.1, 0.05);
  gm.castShadow = false;
  g.add(gm);
  return g;
}

export function buildItemModel(id: ItemId): THREE.Group {
  const g = new THREE.Group();
  const col = ITEMS[id].color;
  const m = lambert(col, col);
  switch (id) {
    case 'medInjector': g.add(mesh(cyl(0.05, 0.05, 0.3, 8), m)); g.add(mesh(cyl(0.012, 0.012, 0.12), lambert('#ddd'), 0, 0.2, 0)); break;
    case 'traumaKit': g.add(mesh(box(0.34, 0.2, 0.22), lambert('#e8e8e8'))); g.add(mesh(box(0.1, 0.22, 0.24), m)); g.add(mesh(box(0.24, 0.22, 0.1), m)); break;
    case 'shieldFlask': g.add(mesh(new THREE.SphereGeometry(0.14, 10, 8), m, 0, 0.05, 0)); g.add(mesh(cyl(0.04, 0.05, 0.12), lambert('#ddd'), 0, 0.22, 0)); break;
    case 'aegisCell': g.add(mesh(box(0.2, 0.28, 0.12), m)); g.add(mesh(box(0.1, 0.06, 0.13), lambert('#fff'), 0, 0.17, 0)); break;
    case 'mistCapsule': g.add(mesh(new THREE.CapsuleGeometry(0.07, 0.2, 4, 8), m)); break;
    case 'grappleSpool': { const t = mesh(new THREE.TorusGeometry(0.12, 0.05, 8, 14), m); t.rotation.x = Math.PI / 2; g.add(t); break; }
    case 'echoBeacon': g.add(mesh(new THREE.OctahedronGeometry(0.16), m)); break;
    case 'windOrb': g.add(mesh(new THREE.IcosahedronGeometry(0.14, 1), m)); break;
  }
  return g;
}

export interface ActorParts {
  root: THREE.Group;
  body: THREE.Group; // pitched for freefall
  legL: THREE.Mesh; legR: THREE.Mesh; armL: THREE.Mesh; armR: THREE.Mesh;
  torso: THREE.Mesh; head: THREE.Mesh;
  hand: THREE.Group;
  weaponKey: string;
  weapon: THREE.Group | null;
  wing: THREE.Group;
  using: THREE.Mesh;
}

const skin = ['#e9b98f', '#c98c62', '#8f5d3d', '#f2cfae'];

export function buildActor(cosmetic: number, skinIdx: number): ActorParts {
  const c = COSMETICS[cosmetic % COSMETICS.length];
  const prim = lambert(c.primary), sec = lambert(c.secondary);
  const packCol = new THREE.Color(c.primary).multiplyScalar(0.55).getStyle();
  const acc = lambert(packCol), pants = lambert('#566077');
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const torso = mesh(box(0.52, 0.62, 0.3), prim, 0, 1.15, 0);
  body.add(torso);
  const vest = mesh(box(0.54, 0.3, 0.32), sec, 0, 1.0, 0); body.add(vest);
  const pack = mesh(box(0.34, 0.44, 0.2), acc, 0, 1.2, -0.25); body.add(pack);
  const roll = mesh(cyl(0.09, 0.09, 0.44, 8), sec, 0, 1.46, -0.28); roll.rotation.z = Math.PI / 2; body.add(roll);
  const head = mesh(new THREE.SphereGeometry(0.2, 12, 10), lambert(skin[skinIdx % skin.length]), 0, 1.68, 0);
  body.add(head);
  const goggles = mesh(box(0.34, 0.1, 0.1), lambert('#2a2f3a', '#1a5560'), 0, 1.7, 0.16); body.add(goggles);
  const cap = mesh(new THREE.SphereGeometry(0.215, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), prim, 0, 1.71, 0); body.add(cap);
  const legGeo = box(0.2, 0.8, 0.22).clone(); legGeo.translate(0, -0.4, 0);
  const legL = new THREE.Mesh(legGeo, pants); legL.castShadow = true; legL.position.set(-0.14, 0.82, 0);
  const legR = new THREE.Mesh(legGeo, pants); legR.castShadow = true; legR.position.set(0.14, 0.82, 0);
  body.add(legL); body.add(legR);
  const armGeo = box(0.15, 0.55, 0.16).clone(); armGeo.translate(0, -0.26, 0);
  const armL = new THREE.Mesh(armGeo, prim); armL.castShadow = true; armL.position.set(-0.36, 1.4, 0);
  const armR = new THREE.Mesh(armGeo, prim); armR.castShadow = true; armR.position.set(0.36, 1.4, 0);
  body.add(armL); body.add(armR);
  const hand = new THREE.Group();
  hand.position.set(0.3, 1.18, 0.28);
  body.add(hand);
  // wing-sail (shown while gliding)
  const wing = new THREE.Group();
  const fabric = new THREE.MeshLambertMaterial({ color: new THREE.Color(c.primary), side: THREE.DoubleSide, emissive: new THREE.Color(c.primary), emissiveIntensity: 0.65 });
  const sailGeo = new THREE.PlaneGeometry(3.4, 1.9, 6, 3);
  const pos = sailGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, -Math.abs(x) * 0.12 + y * 0.18);
    pos.setY(i, y * (1 - Math.abs(x) * 0.05));
  }
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, fabric);
  sail.rotation.x = -Math.PI / 2 + 0.25;
  sail.position.set(0, 3.3, -0.2);
  sail.castShadow = false;
  wing.add(sail);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.9), new THREE.MeshLambertMaterial({ color: new THREE.Color(c.secondary), side: THREE.DoubleSide }));
  stripe.rotation.x = -Math.PI / 2 + 0.25; stripe.position.set(0, 3.32, -0.2);
  wing.add(stripe);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xeeeeee });
  for (const sx of [-1.5, 1.5]) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sx, 3.2, -0.6), new THREE.Vector3(sx * 0.1, 1.5, -0.1)]);
    wing.add(new THREE.Line(geo, lineMat));
    const geo2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sx, 3.4, 0.5), new THREE.Vector3(sx * 0.1, 1.5, 0.1)]);
    wing.add(new THREE.Line(geo2, lineMat));
  }
  wing.visible = false;
  root.add(wing);
  const using = mesh(new THREE.SphereGeometry(0.08, 8, 6), lambert('#fff', '#9fe'), 0.3, 1.45, 0.35);
  using.visible = false;
  body.add(using);
  return { root, body, legL, legR, armL, armR, torso, head, hand, weaponKey: '', weapon: null, wing, using };
}

export function buildSkiff(): THREE.Group {
  const g = new THREE.Group();
  const hull = lambert('#e7d9bb'), copper = lambert('#c77d3d'), teal = lambert('#2aa6b4'), dark = lambert('#4a4a55');
  const deck = mesh(box(12, 0.6, 30), hull, 0, 0, 0); g.add(deck);
  const prow = mesh(new THREE.ConeGeometry(6, 10, 4), hull, 0, 0, 20); prow.rotation.x = Math.PI / 2; prow.rotation.y = Math.PI / 4; prow.scale.set(1, 1, 0.1); g.add(prow);
  const keel = mesh(box(3, 1.6, 26), copper, 0, -1, -1); g.add(keel);
  for (const sx of [-7, 7]) {
    const t = mesh(cyl(1.8, 1.8, 6, 14), copper, sx, 0.6, -10); t.rotation.x = Math.PI / 2; g.add(t);
    const blades = new THREE.Group(); blades.name = 'blades'; blades.position.set(sx, 0.6, -13.1);
    for (let i = 0; i < 4; i++) { const b = mesh(box(0.3, 3.4, 0.1), dark); b.rotation.z = (i * Math.PI) / 2; blades.add(b); }
    g.add(blades);
    g.add(mesh(box(0.5, 2.4, 0.5), dark, sx * 0.86, 1, -6));
  }
  for (let i = 0; i < 2; i++) { const r = mesh(box(11.4, 1.0, 0.2), teal, 0, 0.8, 9 - i * 18); g.add(r); }
  g.add(mesh(box(0.2, 1.0, 29), teal, -5.8, 0.8, 0));
  g.add(mesh(box(0.2, 1.0, 29), teal, 5.8, 0.8, 0));
  const mast = mesh(cyl(0.15, 0.15, 9, 6), dark, 0, 5, -13.4); g.add(mast);
  const sailM = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshLambertMaterial({ color: new THREE.Color('#ff7b4a'), side: THREE.DoubleSide, emissive: new THREE.Color('#ff7b4a'), emissiveIntensity: 0.5 }));
  sailM.position.set(0, 6.5, -13.5); sailM.rotation.y = Math.PI / 2; g.add(sailM);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}
