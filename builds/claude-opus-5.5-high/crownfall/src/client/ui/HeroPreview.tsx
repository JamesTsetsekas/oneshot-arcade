// Turntable 3D hero preview for draft and the hero codex (uses the same in-match model).
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildHero, animateHero } from '../render/models';
import { fogUniforms } from '../render/fogShader';
import type { HeroId } from '../../shared/types';

export function HeroPreview({ hero, size = 260 }: { hero: HeroId; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(size, size, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    cam.position.set(0, 2.2, 6.4); cam.lookAt(0, 1.4, 0);
    scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x4a3460, 1.6));
    const sun = new THREE.DirectionalLight(0xfff0d8, 1.8); sun.position.set(3, 6, 4); scene.add(sun);
    const rig = buildHero(hero);
    rig.root.scale.setScalar(1.25);
    scene.add(rig.root);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.15, 32), new THREE.MeshLambertMaterial({ color: 0xd8ccb4 }));
    disc.position.y = -0.08; scene.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.04, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffd36b }));
    ring.rotation.x = Math.PI / 2; scene.add(ring);
    const prevFog = fogUniforms.uFogOn.value;
    fogUniforms.uFogOn.value = 0;
    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = (performance.now() - t0) / 1000;
      rig.root.rotation.y = t * 0.6;
      const cyc = t % 6;
      const an = cyc < 3 ? 0 : cyc < 4.5 ? 1 : 2;
      animateHero(rig, an, t, an === 2 ? (cyc - 4.5) % 0.75 : 0, hero);
      renderer.render(scene, cam);
    };
    tick();
    return () => { cancelAnimationFrame(raf); fogUniforms.uFogOn.value = prevFog; renderer.dispose(); };
  }, [hero, size]);
  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size }} />;
}
