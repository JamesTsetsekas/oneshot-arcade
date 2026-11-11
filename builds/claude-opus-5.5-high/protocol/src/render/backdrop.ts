// Menu backdrop: a slow camera drift through Aperture Annex using the real renderer.

import { Vector3 } from '@babylonjs/core';
import type { Settings } from '../client/settings';
import type { GameMap } from '../map/runtime';
import { Renderer } from './renderer';

const PATH: [number, number, number, number, number, number][] = [
  // eye x,y,z  -> look x,y,z
  [-30, 6.5, -2, -38, 1.5, 10],
  [-26, 5.5, 14, -40, 2, 2],
  [2, 4.5, -14, -6, 1.5, -2],
  [8, 4, -12, -8, 1, -4],
  [26, 3, -2, 38, 1, 8],
  [40, 3, 12, 28, 1, 0],
  [0, 5, -36, 0, 2, -20],
];

export class Backdrop {
  private r: Renderer;
  private t = 0;
  private raf = 0;
  private last = performance.now();

  constructor(canvas: HTMLCanvasElement, map: GameMap, settings: Settings) {
    this.r = new Renderer(canvas, map, { ...settings, quality: settings.quality === 'high' ? 'medium' : settings.quality });
    this.r.vm.update(0, null, 0, 0, 0, true, false);
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.max(0, Math.min(0.1, (now - this.last) / 1000));
      this.last = now;
      this.t += dt;
      const seg = 9;
      const i = Math.floor(this.t / seg) % PATH.length;
      const f = (this.t % seg) / seg;
      const a = PATH[i];
      const drift = new Vector3(Math.sin(f * Math.PI) * 1.2, 0, f * 2.5);
      const eye = new Vector3(a[0], a[1], a[2]).add(drift);
      const look = new Vector3(a[3], a[4], a[5]);
      const d = look.subtract(eye);
      const yaw = Math.atan2(d.x, d.z) + Math.sin(f * Math.PI * 2) * 0.08;
      const pitch = -Math.atan2(d.y, Math.hypot(d.x, d.z));
      this.r.setView({ eye, yaw, pitch, fov: 85, firstPerson: false, hideId: -1 });
      this.r.spinTurbines(dt);
      this.r.render();
    };
    this.raf = requestAnimationFrame(loop);
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => this.r.resize();

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.r.dispose();
  }
}
