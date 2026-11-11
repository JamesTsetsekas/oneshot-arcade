// client-renderer: fog of war presentation. The server already withholds hidden units; this only
// draws *where* the team can currently see, as a soft texture sampled by every world material.

import * as THREE from 'three';
import { GameMap, MAP_H, MAP_W } from '../../shared/map';

const PX = 2; // pixels per metre

export class FogOfWar {
  readonly canvas: HTMLCanvasElement;
  readonly texture: THREE.CanvasTexture;
  private mask: HTMLCanvasElement;
  private mctx: CanvasRenderingContext2D;
  private ctx: CanvasRenderingContext2D;
  private fan = new Float32Array(64 * 2);
  private first = true;

  constructor(private map: GameMap) {
    this.canvas = document.createElement('canvas');
    this.mask = document.createElement('canvas');
    this.canvas.width = this.mask.width = MAP_W * PX;
    this.canvas.height = this.mask.height = MAP_H * PX;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.mctx = this.mask.getContext('2d') as CanvasRenderingContext2D;
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.flipY = false;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
  }

  /** vision: flat [x, y, radius] triples of the viewing team's sight sources. */
  update(vision: number[]): void {
    const m = this.mctx;
    m.globalCompositeOperation = 'source-over';
    m.fillStyle = '#000';
    m.fillRect(0, 0, this.mask.width, this.mask.height);
    m.globalCompositeOperation = 'lighter';
    for (let i = 0; i < vision.length; i += 3) {
      const x = vision[i];
      const y = vision[i + 1];
      const r = vision[i + 2];
      const rays = r >= 9 ? 48 : 28;
      this.map.visionFan(x, y, r, rays, this.fan);
      const g = m.createRadialGradient(x * PX, y * PX, r * PX * 0.72, x * PX, y * PX, r * PX);
      g.addColorStop(0, '#fff');
      g.addColorStop(1, '#000');
      m.fillStyle = g;
      m.beginPath();
      m.moveTo(this.fan[0] * PX, this.fan[1] * PX);
      for (let k = 1; k < rays; k++) m.lineTo(this.fan[k * 2] * PX, this.fan[k * 2 + 1] * PX);
      m.closePath();
      m.fill();
    }
    // temporal + spatial smoothing so sight edges ease instead of popping
    const c = this.ctx;
    c.globalAlpha = this.first ? 1 : 0.42;
    c.filter = 'blur(2px)';
    c.drawImage(this.mask, 0, 0);
    c.filter = 'none';
    c.globalAlpha = 1;
    this.first = false;
    this.texture.needsUpdate = true;
  }
}
