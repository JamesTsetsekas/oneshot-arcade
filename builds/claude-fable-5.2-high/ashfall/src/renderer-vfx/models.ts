import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';

/** Procedural low-poly models: every actor is authored here as primitive parts (original assets, no external files). */
type V3 = [number, number, number];
export interface Part { s: 'b' | 'c' | 's' | 'k' | 't'; size: V3; pos: V3; color: string; rot?: V3; bone?: 'arm' | 'spin'; glow?: boolean; top?: number }
export const p = (s: Part['s'], size: V3, pos: V3, color: string, o: Partial<Part> = {}): Part => ({ s, size, pos, color, ...o });
export interface ModelDef { parts: Part[]; armPivot?: V3; height: number }

const IRON = '#3d3935', DARK = '#262220', BRASS = '#a07a34', BONE = '#bdb39f', EMBER = '#ff8a3a', CYAN = '#7fe8ff', VIOLET = '#b86bff', TEAL = '#4fe6cf';
function robed(robe: string, accent: string, glow: string, extra: Part[] = []): ModelDef {
  return { height: 1.9, armPivot: [0.05, 1.35, 0.32], parts: [
    p('c', [0.85, 1.45, 0.85], [0, 0.73, 0], robe, { top: 0.4 }), p('b', [0.5, 0.25, 0.7], [0, 1.4, 0], accent),
    p('s', [0.36, 0.4, 0.36], [0.03, 1.7, 0], BONE), p('k', [0.52, 0.45, 0.52], [-0.04, 1.86, 0], robe),
    p('b', [0.04, 0.05, 0.2], [0.18, 1.72, 0], glow, { glow: true }), ...extra] };
}
export const MODELS: Record<string, ModelDef> = {
  cinder: { height: 2.1, armPivot: [0, 1.45, 0.5], parts: [
    p('b', [0.36, 0.78, 0.52], [0, 0.39, 0], IRON), p('c', [0.72, 0.8, 0.72], [0, 1.16, 0], '#5a4636', { top: 1.25 }),
    p('b', [0.07, 0.72, 0.36], [0.37, 1.0, 0], '#8e2c1c'), p('s', [0.5, 0.4, 0.5], [0, 1.56, 0.5], BRASS), p('s', [0.5, 0.4, 0.5], [0, 1.56, -0.5], BRASS),
    p('s', [0.42, 0.46, 0.42], [0, 1.88, 0], '#6d6862'), p('b', [0.05, 0.06, 0.3], [0.2, 1.9, 0], '#ffb060', { glow: true }), p('b', [0.34, 0.26, 0.06], [-0.04, 2.14, 0], '#a83220'),
    p('b', [0.1, 0.85, 0.62], [0.24, 1.08, -0.62], BRASS), p('b', [0.03, 0.4, 0.12], [0.3, 1.1, -0.62], EMBER, { glow: true }),
    p('b', [0.2, 0.62, 0.2], [0.08, -0.3, 0], '#5a4636', { bone: 'arm' }), p('c', [0.07, 0.95, 0.07], [0.55, -0.56, 0], '#4a3a2a', { bone: 'arm', rot: [0, 0, Math.PI / 2] }),
    p('s', [0.36, 0.36, 0.36], [1.02, -0.56, 0], '#77706a', { bone: 'arm' }), p('s', [0.2, 0.2, 0.2], [1.06, -0.56, 0], EMBER, { bone: 'arm', glow: true })] },
  ranger: { height: 2.05, armPivot: [0.1, 1.4, 0.3], parts: [
    p('b', [0.3, 0.8, 0.42], [0, 0.4, 0], '#2c3832'), p('c', [0.5, 0.76, 0.5], [0, 1.16, 0], '#3f5a4a', { top: 1.12 }),
    p('c', [0.8, 1.15, 0.8], [-0.14, 0.98, 0], '#24322b', { top: 0.42 }), p('s', [0.32, 0.36, 0.32], [0.04, 1.78, 0], '#c9a88a'),
    p('k', [0.54, 0.52, 0.54], [-0.02, 1.96, 0], '#2c4438'), p('b', [0.03, 0.04, 0.18], [0.18, 1.8, 0], TEAL, { glow: true }),
    p('c', [0.14, 0.62, 0.14], [-0.26, 1.42, -0.2], '#6b4a2a', { rot: [0.3, 0, 0.3] }),
    p('b', [0.16, 0.5, 0.16], [0.12, -0.2, 0], '#3f5a4a', { bone: 'arm' }),
    p('b', [0.06, 0.62, 0.06], [0.55, 0.28, 0], '#7a5a34', { bone: 'arm', rot: [0, 0, 0.38] }), p('b', [0.06, 0.62, 0.06], [0.55, -0.28, 0], '#7a5a34', { bone: 'arm', rot: [0, 0, -0.38] }),
    p('b', [0.02, 1.08, 0.02], [0.44, 0, 0], TEAL, { bone: 'arm', glow: true })] },
  crawler: { height: 0.7, parts: [
    p('s', [1.05, 0.42, 0.72], [0, 0.32, 0], DARK), p('s', [0.42, 0.32, 0.42], [0.52, 0.34, 0], '#3a2e2a'),
    p('b', [0.04, 0.05, 0.08], [0.7, 0.4, 0.1], EMBER, { glow: true }), p('b', [0.04, 0.05, 0.08], [0.7, 0.4, -0.1], EMBER, { glow: true }),
    p('k', [0.16, 0.34, 0.16], [0.1, 0.62, 0], '#5a4638'), p('k', [0.14, 0.3, 0.14], [-0.22, 0.58, 0], '#5a4638'),
    p('b', [0.5, 0.07, 0.07], [0.15, 0.16, 0.42], '#3a2e2a', { rot: [0, 0.6, 0] }), p('b', [0.5, 0.07, 0.07], [0.15, 0.16, -0.42], '#3a2e2a', { rot: [0, -0.6, 0] }),
    p('b', [0.5, 0.07, 0.07], [-0.25, 0.16, 0.42], '#3a2e2a', { rot: [0, -0.5, 0] }), p('b', [0.5, 0.07, 0.07], [-0.25, 0.16, -0.42], '#3a2e2a', { rot: [0, 0.5, 0] })] },
  husk: { height: 2.7, armPivot: [0, 1.75, 0.78], parts: [
    p('b', [0.62, 0.8, 0.85], [0, 0.4, 0], '#35302c'), p('c', [1.2, 1.15, 1.2], [0, 1.36, 0], '#4d453e', { top: 0.8 }),
    p('c', [0.95, 0.82, 0.95], [0.05, 2.28, 0], '#8c6c2e', { top: 0.45 }), p('s', [0.26, 0.26, 0.26], [0.12, 1.96, 0], EMBER, { glow: true }),
    p('b', [0.3, 0.9, 0.3], [0.1, 1.3, -0.78], '#4d453e'),
    p('b', [0.3, 1.05, 0.3], [0.2, -0.5, 0], '#4d453e', { bone: 'arm' }), p('s', [0.6, 0.6, 0.6], [0.36, -1.12, 0], '#8c6c2e', { bone: 'arm' })] },
  archer: { height: 1.9, armPivot: [0.1, 1.35, 0.26], parts: [
    p('b', [0.25, 0.8, 0.36], [0, 0.4, 0], '#2a2420'), p('c', [0.42, 0.72, 0.42], [0, 1.12, 0], '#3c312a', { top: 1.1 }),
    p('s', [0.32, 0.34, 0.32], [0.02, 1.68, 0], '#57493e'), p('k', [0.46, 0.42, 0.46], [-0.03, 1.84, 0], '#201a18'),
    p('b', [0.03, 0.04, 0.16], [0.16, 1.7, 0], '#ff5a3a', { glow: true }),
    p('b', [0.05, 0.56, 0.05], [0.5, 0.26, 0], '#3a2c22', { bone: 'arm', rot: [0, 0, 0.38] }), p('b', [0.05, 0.56, 0.05], [0.5, -0.26, 0], '#3a2c22', { bone: 'arm', rot: [0, 0, -0.38] }),
    p('b', [0.02, 0.98, 0.02], [0.4, 0, 0], '#ff5a3a', { bone: 'arm', glow: true })] },
  scribe: robed('#3d2f4c', '#5a4a6a', VIOLET, [p('b', [0.34, 0.06, 0.48], [0.5, 1.15, -0.1], '#7a6a4a'), p('b', [0.2, 0.02, 0.3], [0.5, 1.19, -0.1], VIOLET, { glow: true }),
    p('c', [0.05, 1.5, 0.05], [0.3, -0.25, 0], '#2a2226', { bone: 'arm' }), p('s', [0.16, 0.16, 0.16], [0.3, 0.55, 0], VIOLET, { bone: 'arm', glow: true })]),
  adept: robed('#2f3b2c', '#4d5a3c', VIOLET, [p('c', [0.03, 0.6, 0.03], [0.4, -0.3, 0], '#77706a', { bone: 'arm' }), p('s', [0.3, 0.3, 0.3], [0.4, -0.68, 0], '#5a5048', { bone: 'arm' }),
    p('s', [0.2, 0.2, 0.2], [0.4, -0.62, 0], VIOLET, { bone: 'arm', glow: true })]),
  mite: { height: 0.9, parts: [
    p('s', [0.62, 0.48, 0.62], [0, 0.36, 0], DARK), p('s', [0.44, 0.44, 0.44], [-0.08, 0.62, 0], '#ffa040', { glow: true }),
    p('b', [0.4, 0.06, 0.06], [0.1, 0.14, 0.32], '#3a2e2a', { rot: [0, 0.5, 0] }), p('b', [0.4, 0.06, 0.06], [0.1, 0.14, -0.32], '#3a2e2a', { rot: [0, -0.5, 0] }),
    p('s', [0.22, 0.2, 0.22], [0.3, 0.38, 0], '#3a2e2a')] },
  pilgrim: { height: 1.9, armPivot: [0.1, 1.3, 0.42], parts: [
    p('b', [0.4, 0.7, 0.6], [0, 0.35, 0], '#2e2824'), p('c', [0.85, 1.0, 0.85], [0.06, 1.05, 0], '#4a4038', { top: 0.8, rot: [0, 0, -0.18] }),
    p('s', [0.38, 0.4, 0.38], [0.3, 1.55, 0], '#6a5e52'), p('k', [0.56, 0.5, 0.56], [0.22, 1.72, 0], '#2e2824'),
    p('t', [0.6, 0.09, 0.6], [0, 1.0, 0], '#8a837a'), p('b', [0.04, 0.05, 0.18], [0.46, 1.56, 0], '#ff6a4a', { glow: true }),
    p('b', [0.95, 0.07, 0.07], [0.5, -0.3, 0], '#8a837a', { bone: 'arm' }), p('k', [0.22, 0.34, 0.22], [1.05, -0.3, 0], '#b8b0a4', { bone: 'arm', rot: [0, 0, -Math.PI / 2] })] },
  warden: { height: 2.1, armPivot: [0, 1.4, 0.5], parts: [
    p('b', [0.9, 0.5, 0.9], [0, 0.28, 0], '#35353c'), p('b', [0.8, 0.95, 0.8], [0, 1.08, 0], '#575760'), p('b', [0.84, 0.1, 0.84], [0, 1.5, 0], BRASS),
    p('b', [0.42, 0.36, 0.42], [0, 1.8, 0], '#45454e'), p('b', [0.04, 0.07, 0.3], [0.22, 1.82, 0], CYAN, { glow: true }),
    p('b', [0.14, 1.55, 1.3], [0.62, 1.0, 0], '#7c6a36'), p('b', [0.03, 1.1, 0.08], [0.7, 1.0, 0], CYAN, { glow: true }), p('b', [0.03, 0.08, 0.8], [0.7, 1.3, 0], CYAN, { glow: true }),
    p('b', [0.22, 0.6, 0.22], [0.05, -0.3, 0], '#575760', { bone: 'arm' }), p('b', [0.5, 0.3, 0.3], [0.3, -0.65, 0], '#35353c', { bone: 'arm' })] },
  swarm: { height: 1.6, parts: Array.from({ length: 10 }, (_, i): Part => {
    const a = i * 2.4, r = 0.25 + (i % 3) * 0.16;
    return p('k', [0.12, 0.42, 0.12], [Math.cos(a) * r, 0.75 + (i % 4) * 0.2, Math.sin(a) * r], i % 3 ? '#cfc7b2' : '#fff2c8', { bone: 'spin', rot: [1.3, a, 0.4], glow: i % 3 === 0 });
  }) },
  hound: { height: 1.0, parts: [
    p('b', [1.2, 0.46, 0.46], [0, 0.62, 0], '#2f2a26'), p('b', [0.46, 0.36, 0.36], [0.76, 0.78, 0], '#3a342e'), p('b', [0.3, 0.18, 0.22], [1.04, 0.7, 0], '#2f2a26'),
    p('b', [0.04, 0.05, 0.06], [0.98, 0.86, 0.12], VIOLET, { glow: true }), p('b', [0.04, 0.05, 0.06], [0.98, 0.86, -0.12], VIOLET, { glow: true }),
    p('b', [0.12, 0.5, 0.12], [0.45, 0.25, 0.18], '#2f2a26'), p('b', [0.12, 0.5, 0.12], [0.45, 0.25, -0.18], '#2f2a26'),
    p('b', [0.12, 0.5, 0.12], [-0.45, 0.25, 0.18], '#2f2a26'), p('b', [0.12, 0.5, 0.12], [-0.45, 0.25, -0.18], '#2f2a26'),
    p('b', [0.5, 0.08, 0.08], [-0.8, 0.8, 0], '#3a342e', { rot: [0, 0, -0.5] }), p('k', [0.14, 0.26, 0.14], [0.1, 0.96, 0], '#4a4038'), p('k', [0.14, 0.26, 0.14], [-0.2, 0.96, 0], '#4a4038')] },
  tollkeeper: { height: 3.8, armPivot: [0, 2.5, 1.05], parts: [
    p('c', [2.0, 2.6, 2.0], [0, 1.3, 0], '#5a2a20', { top: 0.5 }), p('c', [2.1, 0.3, 2.1], [0, 0.2, 0], '#7a3a28'), p('s', [0.9, 0.7, 0.9], [0, 2.6, 0.85], '#6a655c'), p('s', [0.9, 0.7, 0.9], [0, 2.6, -0.85], '#6a655c'), p('b', [0.5, 0.36, 1.5], [0, 2.52, 0], '#3c352e'),
    p('k', [1.0, 1.1, 1.0], [-0.05, 3.4, 0], '#3a1c16'), p('s', [0.55, 0.55, 0.55], [0.12, 3.0, 0], '#151210'),
    p('b', [0.05, 0.07, 0.1], [0.34, 3.04, 0.13], EMBER, { glow: true }), p('b', [0.05, 0.07, 0.1], [0.34, 3.04, -0.13], EMBER, { glow: true }),
    p('c', [0.95, 0.95, 0.95], [0.72, 1.62, 0], '#9a7430', { top: 0.5 }), p('s', [0.3, 0.3, 0.3], [0.74, 1.2, 0], EMBER, { glow: true }),
    p('b', [0.34, 1.3, 0.34], [0.1, 1.9, -1.05], '#3c352e'),
    p('b', [0.36, 1.2, 0.36], [0.15, -0.55, 0], '#3c352e', { bone: 'arm' }), p('b', [2.3, 0.1, 0.1], [1.4, -1.0, 0], '#8a837a', { bone: 'arm' }),
    p('s', [0.6, 0.6, 0.6], [2.6, -1.0, 0], '#6a6258', { bone: 'arm' }), p('t', [0.7, 0.08, 0.7], [2.6, -1.0, 0], EMBER, { bone: 'arm', glow: true })] },
  engine: { height: 5.4, parts: [
    p('c', [4.8, 0.7, 4.8], [0, 0.35, 0], '#35312c'), p('c', [4.0, 0.3, 4.0], [0, 0.85, 0], '#6e5626'),
    p('c', [2.3, 3.2, 2.3], [0, 2.5, 0], '#8a6a2e', { top: 0.7 }), p('c', [1.2, 0.5, 1.2], [0, 4.2, 0], '#35312c'),
    p('s', [1.3, 1.5, 1.3], [0, 5.0, 0], CYAN, { glow: true }),
    p('t', [4.4, 0.18, 4.4], [0, 2.1, 0], '#a8843a', { bone: 'spin' }), p('t', [3.2, 0.14, 3.2], [0, 3.4, 0], '#a8843a', { bone: 'spin', rot: [0.3, 0, 0.2] }),
    ...[0, 1, 2].flatMap((i): Part[] => { const a = (i * Math.PI * 2) / 3; return [
      p('b', [1.9, 0.3, 0.3], [Math.cos(a) * 1.7, 1.25, Math.sin(a) * 1.7], '#45403a', { bone: 'spin', rot: [0, -a, 0] }),
      p('s', [0.4, 0.4, 0.4], [Math.cos(a) * 2.7, 1.25, Math.sin(a) * 2.7], EMBER, { bone: 'spin', glow: true })]; })] },
  conduit: { height: 3.2, parts: [p('c', [1.0, 2.2, 1.0], [0, 1.1, 0], '#4a4640', { top: 0.6 }), p('t', [0.9, 0.1, 0.9], [0, 2.0, 0], BRASS), p('s', [0.6, 1.0, 0.6], [0, 2.7, 0], CYAN, { glow: true })] },
  ward: { height: 2, parts: [p('t', [1.0, 0.07, 1.0], [0, 1.2, 0], VIOLET, { bone: 'spin', glow: true, rot: [0.5, 0, 0] }), p('t', [0.7, 0.05, 0.7], [0, 1.2, 0], VIOLET, { bone: 'spin', glow: true, rot: [0, 0, 1.2] }), p('s', [0.3, 0.3, 0.3], [0, 1.2, 0], '#e8d8ff', { glow: true }), p('c', [0.5, 0.2, 0.5], [0, 0.1, 0], '#3d2f4c')] },
  urn: { height: 1, parts: [p('c', [0.5, 0.3, 0.5], [0, 0.15, 0], '#5c4e40', { top: 1.4 }), p('s', [0.78, 0.66, 0.78], [0, 0.55, 0], '#6e5d4b'), p('c', [0.36, 0.22, 0.36], [0, 0.92, 0], '#5c4e40', { top: 1.3 })] },
  brazier: { height: 1.6, parts: [p('c', [0.3, 0.95, 0.3], [0, 0.48, 0], '#2e2a28', { top: 0.6 }), p('c', [0.6, 0.32, 0.6], [0, 1.08, 0], '#8c6c2e', { top: 1.5 }), p('s', [0.62, 0.7, 0.62], [0, 1.4, 0], '#ff7a2a', { glow: true }), p('s', [0.3, 0.5, 0.3], [0, 1.7, 0], '#ffd27a', { glow: true })] },
  dummy: { height: 2, parts: [p('c', [0.18, 1.7, 0.18], [0, 0.85, 0], '#4a3a2a'), p('c', [0.7, 0.85, 0.7], [0, 1.2, 0], '#9a8250'), p('b', [0.12, 0.12, 1.3], [0, 1.5, 0], '#4a3a2a'), p('s', [0.4, 0.4, 0.4], [0, 1.95, 0], '#9a8250')] },
  standard: { height: 3.2, parts: [p('c', [0.09, 3.1, 0.09], [0, 1.55, 0], '#6e5626'), p('b', [0.05, 1.2, 0.85], [0, 2.4, 0.46], '#1e7a6e'), p('b', [0.06, 0.9, 0.5], [0, 2.4, 0.46], TEAL, { glow: true }), p('s', [0.24, 0.24, 0.24], [0, 3.15, 0], '#ffd36b', { glow: true })] },
  npc_elder: robed('#77736a', '#a8a294', '#ffd36b', [p('c', [0.06, 1.9, 0.06], [0.35, -0.35, 0], '#5a4a34', { bone: 'arm' }), p('s', [0.18, 0.18, 0.18], [0.35, 0.65, 0], '#ffd36b', { bone: 'arm', glow: true })]),
  npc_vendor: robed('#5a4630', '#7a5c36', '#ffd36b', [p('b', [0.45, 0.6, 0.6], [-0.35, 1.1, 0], '#3a2c1e')]),
  npc_healer: robed('#c8c2b4', '#4fb8a8', TEAL, [p('s', [0.2, 0.2, 0.2], [0.35, 1.2, 0.3], TEAL, { glow: true })]),
  npc_artificer: robed('#4a3a2c', BRASS, CYAN, [p('b', [0.2, 0.3, 0.5], [0.3, 1.0, 0], BRASS), p('b', [0.06, 0.08, 0.26], [0.2, 1.74, 0], CYAN, { glow: true })]),
  npc_hunter: robed('#34442e', '#566a44', TEAL, [p('b', [0.05, 1.3, 0.05], [-0.25, 1.3, -0.25], '#7a5a34', { rot: [0.2, 0, 0.2] })]),
};
MODELS.swarmlet = MODELS.swarm;
const RC = ['#b9b4a8', '#6fb4ff', '#f2cf5b', '#ff8a4a'];
RC.forEach((c, i) => { MODELS['pk_item' + i] = { height: 0.5, parts: [p('b', [0.55, 0.14, 0.32], [0, 0.12, 0], '#4a4238'), p('b', [0.4, 0.05, 0.2], [0, 0.21, 0], c, { glow: true }), ...(i >= 1 ? [p('b', [0.07, i >= 2 ? 4.5 : 1.6, 0.07], [0, i >= 2 ? 2.4 : 1.0, 0], c, { glow: true })] : [])] }; });
['#d8433b', '#4a8de0', '#e9e6dc', '#e8b93c'].forEach((c, i) => { MODELS['pk_potion' + i] = { height: 0.5, parts: [p('s', [0.3, 0.34, 0.3], [0, 0.26, 0], c, { glow: true }), p('c', [0.1, 0.16, 0.1], [0, 0.5, 0], '#5a4a3a')] }; });
MODELS.pk_gold = { height: 0.3, parts: [p('c', [0.22, 0.06, 0.22], [0, 0.05, 0], '#ffc83a', { glow: true }), p('c', [0.22, 0.06, 0.22], [0.16, 0.05, 0.1], '#e8a82a', { glow: true }), p('c', [0.22, 0.06, 0.22], [0.05, 0.12, 0.05], '#ffd96a', { glow: true })] };
MODELS.pk_dust = { height: 0.4, parts: [p('k', [0.24, 0.24, 0.24], [0, 0.42, 0], '#7fe8ff', { glow: true }), p('k', [0.24, 0.24, 0.24], [0, 0.18, 0], '#7fe8ff', { glow: true, rot: [Math.PI, 0, 0] })] };
MODELS.pk_glyph = { height: 0.4, parts: [p('b', [0.3, 0.3, 0.08], [0, 0.4, 0], '#d9c8ff', { glow: true, rot: [0, 0, 0.785] }), p('b', [0.07, 2.2, 0.07], [0, 1.3, 0], '#b86bff', { glow: true })] };
MODELS.pk_globe = { height: 0.6, parts: [p('s', [0.5, 0.5, 0.5], [0, 0.5, 0], '#ff4a40', { glow: true })] };
MODELS.pk_echo = { height: 2, parts: [p('k', [0.7, 1.8, 0.7], [0, 1.0, 0], '#4fe6cf', { glow: true }), p('t', [1.6, 0.06, 1.6], [0, 0.1, 0], '#ffd36b', { glow: true })] };

export interface ModelSrc { def: ModelDef; body?: Mesh; bodyGlow?: Mesh; arm?: Mesh; armGlow?: Mesh; spin?: Mesh; spinGlow?: Mesh; flash?: Mesh }
export interface Mats { lit: StandardMaterial; glow: StandardMaterial; flash: StandardMaterial }
export function makeMats(scene: Scene): Mats {
  const lit = new StandardMaterial('lit', scene);
  lit.specularColor = new Color3(0.08, 0.08, 0.09); lit.specularPower = 24; lit.maxSimultaneousLights = 8;
  const glow = new StandardMaterial('glow', scene);
  glow.disableLighting = true; glow.emissiveColor = Color3.White(); glow.fogEnabled = false;
  const flash = new StandardMaterial('flash', scene);
  flash.disableLighting = true; flash.emissiveColor = new Color3(1, 0.95, 0.85); flash.alpha = 0.75; flash.fogEnabled = false;
  return { lit, glow, flash };
}
function partMesh(scene: Scene, pt: Part): Mesh {
  let m: Mesh;
  const [sx, sy, sz] = pt.size;
  switch (pt.s) {
    case 'b': m = CreateBox('p', { width: sx, height: sy, depth: sz }, scene); break;
    case 'c': m = CreateCylinder('p', { height: sy, diameterBottom: sx, diameterTop: sx * (pt.top ?? 1), tessellation: 9 }, scene); break;
    case 'k': m = CreateCylinder('p', { height: sy, diameterBottom: sx, diameterTop: 0, tessellation: 7 }, scene); break;
    case 't': m = CreateTorus('p', { diameter: sx, thickness: sy, tessellation: 18 }, scene); break;
    default: m = CreateSphere('p', { diameterX: sx, diameterY: sy, diameterZ: sz, segments: 5 }, scene);
  }
  if (pt.rot) m.rotation.set(pt.rot[0], pt.rot[1], pt.rot[2]);
  m.position.set(pt.pos[0], pt.pos[1], pt.pos[2]);
  const c = Color3.FromHexString(pt.color);
  const n = m.getTotalVertices(), cols = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { cols[i * 4] = c.r; cols[i * 4 + 1] = c.g; cols[i * 4 + 2] = c.b; cols[i * 4 + 3] = 1; }
  m.setVerticesData(VertexBuffer.ColorKind, cols);
  return m;
}
function merge(scene: Scene, parts: Part[], name: string, mat: StandardMaterial, flat: boolean): Mesh | undefined {
  if (!parts.length) return undefined;
  const m = Mesh.MergeMeshes(parts.map((pt) => partMesh(scene, pt)), true, true)!;
  m.name = name; m.material = mat;
  if (flat) m.convertToFlatShadedMesh();
  m.isVisible = false; m.isPickable = false;
  return m;
}
const cache = new Map<string, ModelSrc>();
export function clearModelCache() { cache.clear(); }
/** Builds (once) the merged source meshes for a model; actors render as GPU instances of these. */
export function getModel(scene: Scene, mats: Mats, id: string): ModelSrc {
  let src = cache.get(id);
  if (src) return src;
  const def = MODELS[id] ?? MODELS.crawler;
  const sel = (bone: Part['bone'], glow: boolean) => def.parts.filter((pt) => pt.bone === bone && !!pt.glow === glow);
  src = {
    def, body: merge(scene, sel(undefined, false), id + '_body', mats.lit, true), bodyGlow: merge(scene, sel(undefined, true), id + '_bodyG', mats.glow, false),
    arm: merge(scene, sel('arm', false), id + '_arm', mats.lit, true), armGlow: merge(scene, sel('arm', true), id + '_armG', mats.glow, false),
    spin: merge(scene, sel('spin', false), id + '_spin', mats.lit, true), spinGlow: merge(scene, sel('spin', true), id + '_spinG', mats.glow, false),
    flash: merge(scene, def.parts.filter((pt) => !pt.bone), id + '_flash', mats.flash, false),
  };
  cache.set(id, src);
  return src;
}

/** Visible (non-instanced) merged meshes for one-off props and interactables. */
export function buildStatic(scene: Scene, mats: Mats, parts: Part[], name: string): Mesh[] {
  const out: Mesh[] = [];
  const lit = merge(scene, parts.filter((pt) => !pt.glow), name, mats.lit, true), glow = merge(scene, parts.filter((pt) => pt.glow), name + 'G', mats.glow, false);
  for (const m of [lit, glow]) if (m) { m.isVisible = true; out.push(m); }
  return out;
}
