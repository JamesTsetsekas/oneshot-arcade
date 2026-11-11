import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Match,rng,blocked,lineClear,WEAPONS} from '../src/sim.ts';
const idle={x:0,z:0,sprint:false,jump:false,crouch:false,fire:false,aim:0,pitch:0,ads:false};
function ready(){const m=new Match(12);m.phase='playing';m.player.y=0;m.player.gliding=false;return m;}
function advance(m:Match,s:number){for(let i=0;i<s*30;i++)m.tick(1/30,idle);}
test('seeded random and actor placement reproduce',()=>{assert.deepEqual(new Match(4).actors,new Match(4).actors);assert.equal(rng(10)(),rng(10)());});
test('24 equal starting contestants',()=>{const m=new Match();assert.equal(m.alive,24);assert.ok(m.actors.every(a=>a.hp===100&&a.aegis===50));});
test('staging advances to flight and manual drop glides',()=>{const m=new Match();advance(m,5);assert.equal(m.phase,'flight');m.drop();assert.equal(m.phase,'playing');assert.ok(m.player.gliding);});
test('automatic drop and landing finish safely',()=>{const m=new Match();advance(m,25);assert.equal(m.phase,'playing');assert.equal(m.player.y,0);assert.equal(m.player.gliding,false);});
test('damage consumes Aegis then reserve then health',()=>{const m=ready(),p=m.player;p.reserve=25;m.damageActor(p,65,1);assert.equal(p.aegis,0);assert.equal(p.reserve,10);assert.equal(p.hp,100);m.damageActor(p,20,1);assert.equal(p.hp,90);});
test('death is attributed only once',()=>{const m=ready();m.damageActor(m.actors[1],999,0);m.damageActor(m.actors[1],999,0);assert.equal(m.player.kills,1);assert.equal(m.alive,23);assert.equal(m.loot.at(-1)?.id,101);});
test('Aegis waits eight seconds then replenishes',()=>{const m=ready();m.practice=true;m.damageActor(m.player,30,1);advance(m,7);assert.equal(m.player.aegis,20);advance(m,3);assert.ok(m.player.aegis>35);});
test('weapon cadence and ammunition enforced',()=>{const m=ready();assert.equal(m.fire(m.player,0),true);assert.equal(m.fire(m.player,0),false);assert.equal(m.player.ammo,14);m.player.cooldown=0;m.player.ammo=0;assert.equal(m.fire(m.player,0),false);assert.ok(m.player.reload>0);});
test('reload consumes only required reserve ammo',()=>{const m=ready();m.practice=true;m.player.ammo=10;m.reload();advance(m,2);assert.equal(m.player.ammo,15);assert.equal(m.player.stock,175);});
test('empty stock cannot reload',()=>{const m=ready();m.player.stock=0;m.player.ammo=0;m.reload();assert.equal(m.player.reload,0);});
test('cache requires interaction proximity and cannot duplicate',()=>{const m=ready();m.player.x=-47;m.player.z=34;assert.ok(m.interact());const count=m.loot.filter(l=>l.opened).length;m.loot.filter(l=>!l.opened).forEach(l=>{l.x=160;l.z=160;});assert.equal(m.interact(),false);assert.equal(m.loot.filter(l=>l.opened).length,count);assert.equal(m.player.ammo,WEAPONS[m.player.weapon].magazine);});
test('med takes three seconds and is capped at 100',()=>{const m=ready();m.practice=true;m.player.hp=80;m.heal();advance(m,2);assert.equal(m.player.hp,80);advance(m,2);assert.equal(m.player.hp,100);assert.equal(m.player.meds,1);});
test('flask restores reserve capped at 50',()=>{const m=ready();m.practice=true;m.player.reserve=40;m.heal(true);advance(m,3);assert.equal(m.player.reserve,50);assert.equal(m.player.flasks,1);});
test('full-health healing cannot consume stock',()=>{const m=ready();m.heal();assert.equal(m.player.meds,2);});
test('storm shrinks monotonically and stays valid',()=>{const m=ready();let prior=m.radius;for(let i=0;i<300;i++){m.tick(.05,idle);assert.ok(m.radius<=prior);assert.ok(m.radius>=5);prior=m.radius;}});
test('storm damages exposed actors',()=>{const m=ready();m.time=160;m.player.x=170;m.player.z=170;advance(m,1);assert.ok(m.player.aegis<50);assert.ok(m.stormDamage>0);});
test('character collision prevents crossing shelters',()=>{const m=ready();assert.ok(blocked(-31,38));m.player.x=-38;m.player.z=38;m.move(m.player,5,0);assert.equal(m.player.x,-38);});
test('line of sight rejects walls',()=>{assert.equal(lineClear({x:-40,z:38},{x:-20,z:38}),false);});
test('movement is bounded to island',()=>{const m=ready();m.player.x=179;m.move(m.player,1000,0);assert.equal(m.player.x,180);});
test('last living contestant wins exactly once',()=>{const m=ready();for(const a of m.actors.slice(1))m.damageActor(a,1000,0);m.tick(.03,idle);assert.equal(m.phase,'ended');assert.equal(m.winner,0);m.tick(.03,idle);assert.equal(m.winner,0);});
test('player elimination ends with placement available',()=>{const m=ready();m.damageActor(m.player,1000,1);m.tick(.03,idle);assert.equal(m.phase,'ended');assert.notEqual(m.winner,0);});
test('practice does not contract or finish',()=>{const m=new Match(4,true);advance(m,330);assert.equal(m.phase,'playing');assert.equal(m.radius,190);assert.equal(m.player.hp,100);});

test('weapon switching preserves rounds and cannot conjure a weapon',()=>{const m=ready();m.select(1);assert.equal(m.player.weapon,0);m.player.x=-47;m.player.z=34;m.interact();m.player.ammo=8;m.select(0);m.select(1);assert.equal(m.player.ammo,8);});
test('seeded full match terminates and declares a winner',()=>{const m=ready();advance(m,310);assert.equal(m.phase,'ended');assert.ok(m.winner>=0&&m.winner<24);});

test('simultaneous elimination has a deterministic tie-break winner',()=>{const m=ready();for(const a of m.actors)m.damageActor(a,1000,-1);m.tick(.03,idle);assert.equal(m.phase,'ended');assert.equal(m.winner,0);});
