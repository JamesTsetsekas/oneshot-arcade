import {describe,it,expect} from 'vitest';
import {Game,loot,rng,SKILLS} from './game';
describe('deterministic simulation',()=>{
 it('repeats seeded random streams',()=>{const a=rng(12),b=rng(12);expect(Array.from({length:50},()=>a())).toEqual(Array.from({length:50},()=>b()));});
 it('guarantees inscribed boss loot with reproducible rolls',()=>{expect(loot(17,4,true)).toEqual(loot(17,4,true));expect(loot(17,4,true).rarity).toBe('Inscribed');});
 it('generates the same encounters per seed',()=>{const a=new Game('Cinder Vow'),b=new Game('Veil Ranger');a.enter(1);b.enter(1);expect(a.enemies).toEqual(b.enemies);expect(a.enemies.some(e=>e.kind==='The Toll-Keeper')).toBe(true);});
 it('respects resource and cooldown costs',()=>{const g=new Game('Cinder Vow');g.enter(1);g.cast(0);expect(g.player.focus).toBe(78);g.cast(0);expect(g.player.focus).toBe(78);g.player.focus=0;g.cast(1);expect(g.cooldowns[1]).toBe(0);});
 it('resolves delayed skill damage only after anticipation',()=>{const g=new Game('Cinder Vow');g.enter(3);g.player.z=6;const e=g.enemies[0];g.cast(2);g.tick(.3);expect(e.hp).toBe(e.max);g.tick(.36);expect(e.hp).toBeLessThan(e.max);});
 it('basic attacks restore Focus',()=>{const g=new Game('Veil Ranger');g.enter(1);g.player.focus=20;g.basic(g.enemies[0]);expect(g.player.focus).toBe(29);});
 it('limits evades and recharges charges',()=>{const g=new Game('Cinder Vow');for(let i=0;i<4;i++)g.evade();expect(g.player.charges).toBe(0);g.tick(2.9);expect(g.player.charges).toBe(1);});
 it('potions are finite and cannot be wasted at full health',()=>{const g=new Game('Cinder Vow');g.potion();expect(g.player.potions).toBe(5);g.player.hp=20;g.potion();expect(g.player.hp).toBe(105);expect(g.player.potions).toBe(4);});
 it('death creates a reclaimable echo and respawns',()=>{const g=new Game('Cinder Vow');g.player.gold=100;g.hurt(500,'test');expect(g.dead).toBe(true);expect(g.echo?.gold).toBe(10);g.respawn();expect(g.player.hp).toBe(g.player.max);expect(g.dead).toBe(false);});
 it('equipment swaps retain old items',()=>{const g=new Game('Cinder Vow');const a=loot(1,1),b=loot(2,2);g.inventory=[a,b];g.equip(a);g.equip(b);expect(g.inventory).toEqual([a]);expect(g.player.weapon).toBe(8+b.power);});
 it('protects salvage outside refuge',()=>{const g=new Game('Cinder Vow');g.inventory=[loot(1,1)];g.enter(1);g.salvage(g.inventory[0]);expect(g.inventory.length).toBe(1);expect(g.player.dust).toBe(0);});
 it('skill points cannot be overspent',()=>{const g=new Game('Cinder Vow');g.allocate(0);g.allocate(1);expect(g.player.ranks).toEqual([1,0,0]);expect(g.player.points).toBe(0);});
 it('boss deaths unlock progression and Veteran',()=>{const g=new Game('Cinder Vow');g.enter(1);g.hit(g.enemies.find(e=>e.boss)!,9999);expect(g.gate).toBe(true);g.enter(3);g.hit(g.enemies[0],9999);expect(g.completed).toBe(true);expect(g.items[0].item.rarity).toBe('Inscribed');});
 it('save roundtrip preserves build and story state',()=>{const g=new Game('Veil Ranger','Test');g.rescued=true;g.player.ranks=[1,2,3];g.inventory=[loot(5,4)];const next=Game.restore(JSON.parse(JSON.stringify(g.snapshot())));expect(next.player.ranks).toEqual([1,2,3]);expect(next.rescued).toBe(true);expect(next.inventory).toEqual(g.inventory);});
 it('paused simulation freezes attacks and time',()=>{const g=new Game('Cinder Vow');g.paused=true;g.tick(3);expect(g.time).toBe(0);});
 it('forging preserves unique item identities across save/load',()=>{const g=new Game('Cinder Vow');g.rescued=true;g.player.gold=100;g.player.dust=20;g.craft();const next=Game.restore(JSON.parse(JSON.stringify(g.snapshot())));next.craft();expect(next.inventory).toHaveLength(2);expect(next.inventory[0].id).not.toBe(next.inventory[1].id);expect(next.player.gold).toBe(40);});
 it('all ability definitions contain valid execution metadata',()=>{for(const skills of Object.values(SKILLS))for(const s of skills){expect(s.cost).toBeGreaterThan(0);expect(s.cooldown).toBeGreaterThan(0);expect(s.cancel).toBeGreaterThan(0);expect(s.tags.length).toBeGreaterThan(0);expect(s.vfx).toBeTruthy();}});
 it('completes both bosses and a Veteran replay through ordinary combat intents',()=>{
 const g=new Game('Veil Ranger');let deaths=0;
 const clear=()=>{for(let tick=0;tick<30000&&g.enemies.some(e=>e.hp>0);tick++){
 if(g.dead){deaths++;g.respawn();}
 const target=g.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-g.player.x,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.z-g.player.z))[0];
 g.aim={x:target.x,z:target.z};g.attackTarget=target.id;
 if(Math.hypot(target.x-g.player.x,target.z-g.player.z)<10){g.cast(0);g.cast(1);g.cast(2);if(g.player.hp<g.player.max*.6)g.cast(3);}
 if(g.player.hp<g.player.max*.45)g.potion();
 if(target.state==='Telegraph'&&Math.hypot(target.x-g.player.x,target.z-g.player.z)<6){g.aim={x:g.player.x+(g.player.x-target.x)*3,z:g.player.z+(g.player.z-target.z)*3};g.evade();}
 g.tick(1/30);
 }
 expect(g.enemies.every(e=>e.hp<=0)).toBe(true);
 };
 g.enter(1);clear();expect(g.gate).toBe(true);
 g.player.x=-7;g.player.z=9;g.interact();g.interact();expect(g.waypoint).toBe(true);
 g.player.x=0;g.player.z=31;g.interact();g.interact();expect(g.zone).toBe(2);clear();
 g.player.x=7;g.player.z=18;g.interact();g.interact();expect(g.rescued).toBe(true);
 g.player.x=0;g.player.z=31;g.interact();g.interact();expect(g.zone).toBe(3);clear();expect(g.completed).toBe(true);
 g.enter(0);g.difficulty=1;g.enter(3);clear();expect(g.victory).toBe(true);expect(deaths).toBeLessThan(4);
 });
});

