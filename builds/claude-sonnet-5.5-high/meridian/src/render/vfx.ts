import { Color3, Color4, Mesh, MeshBuilder, ParticleSystem, PointLight, Scene, StandardMaterial, Texture, Vector3 } from '@babylonjs/core';

interface Tracer { mesh: Mesh; life: number }

/** Pooled combat/vehicle/weather effects. Everything is capped so it stays inside the particle budget. */
export class Vfx {
  private tracers: Tracer[] = [];
  private sparks: ParticleSystem;
  private smoke: ParticleSystem;
  private tireSmoke: ParticleSystem[] = [];
  private dmgSmoke: ParticleSystem[] = [];
  private rain: ParticleSystem;
  private flash: PointLight;
  private flashT = 0;
  private cloud: ParticleSystem;
  private cloudEmitters: Array<{ x: number; z: number; until: number }> = [];
  private rainEmitter = new Vector3();
  private tireIdx = 0;
  private dmgIdx = 0;

  constructor(private scene: Scene, glow: Texture) {
    const mat = new StandardMaterial('tracer', scene);
    mat.emissiveColor = new Color3(1, 0.85, 0.4);
    mat.disableLighting = true;
    for (let i = 0; i < 14; i++) {
      const m = MeshBuilder.CreateBox('tr' + i, { width: 0.03, height: 0.03, depth: 1 }, scene);
      m.material = mat;
      m.isPickable = false;
      m.setEnabled(false);
      this.tracers.push({ mesh: m, life: 0 });
    }
    this.flash = new PointLight('muzzle', new Vector3(0, 0, 0), scene);
    this.flash.diffuse = new Color3(1, 0.8, 0.45);
    this.flash.intensity = 0;
    this.flash.range = 14;

    const mk = (name: string, cap: number, c0: Color4, c1: Color4, size: [number, number], life: [number, number], grow: boolean, blendAdd = false): ParticleSystem => {
      const ps = new ParticleSystem(name, cap, scene);
      ps.particleTexture = glow;
      ps.color1 = c0; ps.color2 = c0; ps.colorDead = c1;
      ps.minSize = size[0]; ps.maxSize = size[1];
      ps.minLifeTime = life[0]; ps.maxLifeTime = life[1];
      ps.emitRate = 0;
      ps.blendMode = blendAdd ? ParticleSystem.BLENDMODE_ONEONE : ParticleSystem.BLENDMODE_STANDARD;
      ps.gravity = new Vector3(0, grow ? 0.4 : -9, 0);
      ps.emitter = new Vector3(0, 0, 0);
      ps.minEmitPower = 0.3; ps.maxEmitPower = 1.2;
      ps.updateSpeed = 0.016;
      if (grow) {
        ps.addSizeGradient(0, size[0]);
        ps.addSizeGradient(1, size[1] * 3.2);
      }
      ps.start();
      return ps;
    };
    this.sparks = mk('sparks', 160, new Color4(1, 0.8, 0.4, 1), new Color4(1, 0.3, 0.1, 0), [0.04, 0.09], [0.15, 0.35], false, true);
    this.sparks.minEmitPower = 3; this.sparks.maxEmitPower = 7;
    this.smoke = mk('smokeGen', 120, new Color4(0.7, 0.7, 0.7, 0.5), new Color4(0.5, 0.5, 0.5, 0), [0.6, 1.2], [0.8, 1.6], true);
    for (let i = 0; i < 3; i++) {
      this.tireSmoke.push(mk('tire' + i, 140, new Color4(0.85, 0.85, 0.85, 0.35), new Color4(0.7, 0.7, 0.7, 0), [0.35, 0.7], [0.6, 1.2], true));
      this.dmgSmoke.push(mk('dmg' + i, 120, new Color4(0.2, 0.2, 0.2, 0.55), new Color4(0.1, 0.1, 0.1, 0), [0.35, 0.7], [0.8, 1.6], true));
    }
    this.cloud = mk('cloud', 400, new Color4(0.82, 0.82, 0.84, 0.55), new Color4(0.75, 0.75, 0.78, 0), [2.2, 3.6], [6, 9], true);
    this.cloud.minEmitPower = 0.4; this.cloud.maxEmitPower = 1.4;
    this.cloud.createSphereEmitter(1.2);

    this.rain = new ParticleSystem('rain', 1800, scene);
    this.rain.particleTexture = glow;
    this.rain.emitter = this.rainEmitter;
    this.rain.minEmitBox = new Vector3(-26, 16, -26);
    this.rain.maxEmitBox = new Vector3(26, 18, 26);
    this.rain.direction1 = new Vector3(-0.05, -1, 0.02);
    this.rain.direction2 = new Vector3(0.05, -1, -0.02);
    this.rain.minEmitPower = 28; this.rain.maxEmitPower = 36;
    this.rain.minLifeTime = 0.5; this.rain.maxLifeTime = 0.7;
    this.rain.minSize = 0.02; this.rain.maxSize = 0.04;
    this.rain.color1 = new Color4(0.75, 0.82, 0.95, 0.35); this.rain.color2 = new Color4(0.75, 0.82, 0.95, 0.2); this.rain.colorDead = new Color4(0.75, 0.82, 0.95, 0);
    this.rain.billboardMode = ParticleSystem.BILLBOARDMODE_STRETCHED;
    this.rain.emitRate = 0;
    this.rain.gravity = new Vector3(0, -2, 0);
    this.rain.start();
  }

  setRain(intensity: number, camPos: Vector3): void {
    this.rainEmitter.copyFrom(camPos);
    this.rain.emitRate = intensity * 1800;
  }

  tracer(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
    const t = this.tracers.find((q) => q.life <= 0);
    if (!t) return;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dy, dz) || 1;
    t.mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    t.mesh.scaling.z = len;
    t.mesh.rotation.y = Math.atan2(dx, dz);
    t.mesh.rotation.x = -Math.asin(dy / len);
    t.mesh.setEnabled(true);
    t.life = 0.06;
  }

  muzzle(x: number, y: number, z: number): void {
    this.flash.position.set(x, y, z);
    this.flash.intensity = 2.4;
    this.flashT = 0.05;
  }

  impact(x: number, y: number, z: number, count = 5): void {
    (this.sparks.emitter as Vector3).set(x, y, z);
    this.sparks.manualEmitCount += count;
  }

  smokeAt(x: number, z: number): void {
    this.cloudEmitters.push({ x, z, until: 11 });
  }

  tireSmokeAt(x: number, z: number, strength: number): void {
    const ps = this.tireSmoke[this.tireIdx++ % this.tireSmoke.length];
    (ps.emitter as Vector3).set(x, 0.15, z);
    ps.manualEmitCount += Math.round(1 + strength * 2);
  }

  damageSmokeAt(x: number, y: number, z: number): void {
    const ps = this.dmgSmoke[this.dmgIdx++ % this.dmgSmoke.length];
    (ps.emitter as Vector3).set(x, y, z);
    ps.manualEmitCount += 1;
  }

  update(dt: number): void {
    for (const t of this.tracers) {
      if (t.life > 0) { t.life -= dt; if (t.life <= 0) t.mesh.setEnabled(false); }
    }
    if (this.flashT > 0) { this.flashT -= dt; if (this.flashT <= 0) this.flash.intensity = 0; }
    for (let i = this.cloudEmitters.length - 1; i >= 0; i--) {
      const c = this.cloudEmitters[i];
      c.until -= dt;
      if (c.until <= 0) { this.cloudEmitters.splice(i, 1); continue; }
      (this.cloud.emitter as Vector3).set(c.x, 1.4, c.z);
      this.cloud.manualEmitCount += c.until > 8 ? 6 : 2;
    }
  }
}
