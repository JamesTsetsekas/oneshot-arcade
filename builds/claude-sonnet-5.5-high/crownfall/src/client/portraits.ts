/** Renders each hero model once into a small transparent PNG for the draft / hero screens. */
import * as THREE from 'three';
import { HEROES } from '../shared/content';
import { buildHero, animateRig } from './models';

let cache: Record<string, string> | null = null;

export function heroPortraits(): Record<string, string> {
  if (cache) return cache;
  cache = {};
  try {
    const W = 280, H = 360;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.setSize(W, H, false);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.setClearColor(0x000000, 0);
    r.shadowMap.enabled = false;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xdcebff, 0x5a4a70, 1.3));
    const key = new THREE.DirectionalLight(0xfff0d0, 2.6); key.position.set(-3, 6, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fc8ff, 1.6); rim.position.set(4, 3, -4); scene.add(rim);
    const cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 50);
    for (const hd of HEROES) {
      const rig = buildHero(hd.id);
      rig.group.rotation.y = -0.45;
      animateRig(rig, 0.7, 0, 0, hd.id);
      const g = new THREE.Group(); g.add(rig.group);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40), new THREE.MeshBasicMaterial({ color: hd.accent, transparent: true, opacity: 0.35 }));
      disc.rotation.x = -Math.PI / 2; disc.position.y = 0.01; g.add(disc);
      scene.add(g);
      const hgt = rig.height + 0.4;
      cam.position.set(0, hgt * 0.62, hgt * 2.05 + 1.6);
      cam.lookAt(0, hgt * 0.46, 0);
      r.render(scene, cam);
      cache[hd.id] = canvas.toDataURL('image/png');
      scene.remove(g);
    }
    r.dispose();
    r.forceContextLoss();
  } catch {
    cache = {};
  }
  return cache;
}
