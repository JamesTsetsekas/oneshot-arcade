import {describe,it,expect} from 'vitest';
import {Simulation,blocked,clear,safeSpawn,weapons,type Input} from './simulation';
const idle:Input={mx:0,mz:0,yaw:0,pitch:0,fire:false,ads:false,sprint:false,crouch:false,jump:false};
function isolated(){let s=new Simulation();for(let a of s.actors){a.protection=0;if(a.id>1){a.hp=0;a.dead=1000;}}s.player.x=0;s.player.z=-20;s.actors[1].team=1;s.actors[1].x=0;s.actors[1].z=-14;return s;}
describe('embedded authoritative simulation',()=>{
 it('fills a balanced 6v6 room',()=>{let s=new Simulation();expect(s.actors.length).toBe(12);expect(s.actors.filter(a=>a.team===0).length).toBe(6)});
 it('blocks structures and map boundary',()=>{expect(blocked(-19,-7)).toBe(true);expect(blocked(40,0)).toBe(true);expect(blocked(0,-20)).toBe(false)});
 it('occludes sight across structural walls',()=>{expect(clear({x:-19,z:-20},{x:-19,z:4})).toBe(false);expect(clear({x:0,z:-25},{x:0,z:-15})).toBe(true)});
 it('moves normalized diagonals at walk speed',()=>{let s=new Simulation();let p=s.player;p.x=0;p.z=-20;s.step(1/60,{...idle,mx:1,mz:1});expect(Math.hypot(p.x,p.z+20)).toBeCloseTo(5.2/60)});
 it('cannot move through cover',()=>{let s=new Simulation();s.player.x=-19;s.player.z=-16;for(let i=0;i<120;i++)s.step(1/60,{...idle,mz:1});expect(s.player.z).toBeLessThan(-14.3)});
 it('hits consume ammunition and cadence prevents duplicate shots',()=>{let s=isolated();s.fire(0,0,true);expect(s.player.ammo).toBe(29);expect(s.actors[1].hp).toBeLessThan(100);s.fire(0,0,true);expect(s.player.ammo).toBe(29)});
 it('friendly fire causes no damage',()=>{let s=isolated();s.actors[1].team=0;s.damage(s.actors[1],100,s.player);expect(s.actors[1].hp).toBe(100)});
 it('spawn protection prevents damage',()=>{let s=isolated();s.actors[1].protection=2;s.damage(s.actors[1],100,s.player);expect(s.actors[1].hp).toBe(100)});
 it('kills score once and earn momentum',()=>{let s=isolated();s.damage(s.actors[1],110,s.player);s.damage(s.actors[1],110,s.player);expect(s.score[0]).toBe(1);expect(s.player.momentum).toBe(1);expect(s.actors[1].deaths).toBe(1)});
 it('support kills do not earn momentum',()=>{let s=isolated();s.damage(s.actors[1],110,s.player,false,true);expect(s.score[0]).toBe(1);expect(s.player.momentum).toBe(0)});
 it('death resets momentum and respawns after 3 seconds',()=>{let s=isolated();s.player.momentum=5;s.damage(s.player,110,s.actors[1]);expect(s.player.momentum).toBe(0);s.step(3.01,idle);expect(s.player.hp).toBe(100);expect(s.player.protection).toBe(2)});
 it('reload completes on simulation time',()=>{let s=isolated();s.player.ammo=2;s.reload();expect(s.player.reload).toBe(weapons[0].reload);s.step(2,idle);expect(s.player.ammo).toBe(30)});
 it('regeneration has a five second delay',()=>{let s=isolated();s.damage(s.player,50,s.actors[1]);s.time=4;s.step(.1,idle);expect(s.player.hp).toBe(50);s.time=6;s.step(.1,idle);expect(s.player.hp).toBeGreaterThan(50)});
 it('recon requires three momentum and is once per life',()=>{let s=isolated();s.support();expect(s.recon).toBe(0);s.player.momentum=3;s.support();expect(s.recon).toBe(12);s.recon=0;s.support();expect(s.recon).toBe(0)});
 it('ends at score limit with deterministic winner',()=>{let s=isolated();s.goal=1;s.damage(s.actors[1],110,s.player);s.step(1/60,idle);expect(s.ended).toBe(true);expect(s.winner).toBe(0)});
 it('extends tied clock for sudden death',()=>{let s=new Simulation();s.limit=0;s.step(1/60,idle);expect(s.ended).toBe(false);expect(s.goal).toBe(5);expect(s.limit).toBe(60)});
 it('chooses legal distant spawns',()=>{let s=new Simulation();let p=safeSpawn(0,s.actors);expect(blocked(p.x,p.z)).toBe(false);expect(p.z).toBe(-28)});
 it('a seeded idle bot match completes without external services',()=>{let s=new Simulation(0,10,120);for(let i=0;i<120*60+1&&!s.ended;i++)s.step(1/60,idle);expect(s.score[0]+s.score[1]).toBeGreaterThan(0);expect(s.ended).toBe(true)});
});
