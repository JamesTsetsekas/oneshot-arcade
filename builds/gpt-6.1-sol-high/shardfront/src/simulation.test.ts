import {describe,it,expect} from 'vitest';
import {Simulation} from './simulation';
import {DATA,MAP,walkable} from './data';
import {route} from './navigation';
const step=(s:Simulation,n:number)=>{for(let i=0;i<n;i++)s.step();};
describe('authoritative simulation',()=>{
 it('starts both players with relay, six workers and scout',()=>{const s=new Simulation();expect(s.entities.filter(e=>e.team===0).length).toBe(8);expect(s.supply(0)).toBe(7);expect(s.cap(0)).toBe(18);});
 it('workers gather finite ore and deliver it to headquarters',()=>{const s=new Simulation();s.aiEnabled=false;const before=s.resources.reduce((a,r)=>a+r.amount,0);step(s,500);expect(s.collected[0]).toBeGreaterThan(0);expect(s.ore[0]).toBeGreaterThan(420);expect(s.resources.reduce((a,r)=>a+r.amount,0)).toBeLessThan(before);});
 it('rejects enemy-owned commands and invalid coordinates',()=>{const s=new Simulation();const enemy=s.entities.find(e=>e.team===1)!;expect(s.command({team:0,kind:'stop',ids:[enemy.id]})).toBe(false);expect(s.command({team:0,kind:'order',ids:[1],x:NaN,z:50})).toBe(false);});
 it('validates placement, cost and prerequisites without charging failures',()=>{const s=new Simulation();const worker=s.entities.find(e=>e.kind==='worker')!;expect(s.command({team:0,kind:'build',ids:[worker.id],unit:'tech',x:30,z:65})).toBe(false);expect(s.ore[0]).toBe(420);expect(s.canPlace('bay',18,66)).toBe(false);expect(s.canPlace('tap',35,65)).toBe(false);expect(s.command({team:0,kind:'build',ids:[worker.id],unit:'bay',x:30,z:65})).toBe(true);expect(s.ore[0]).toBe(270);});
 it('constructs, produces and honors supply blocks',()=>{const s=new Simulation();s.aiEnabled=false;const bay=s.spawn('bay',0,30,65);s.ore[0]=5000;for(let i=0;i<6;i++)expect(s.command({team:0,kind:'train',ids:[bay.id],unit:'soldier'})).toBe(true);step(s,600);expect(s.supply(0)).toBe(17);expect(bay.queue.length).toBe(1);s.spawn('pylon',0,37,60);step(s,100);expect(bay.queue.length).toBe(0);});
 it('Flux taps generate advanced resources after completion',()=>{const s=new Simulation();s.aiEnabled=false;s.spawn('tap',0,12,53);step(s,100);expect(s.flux[0]).toBe(20);});
 it('fog hides the opponent, with sight revealed by scouting',()=>{const s=new Simulation();const enemy=s.entities.find(e=>e.team===1&&e.kind==='core')!;expect(s.seen[0].has(enemy.id)).toBe(false);s.spawn('scout',0,90,25);s.vision();expect(s.seen[0].has(enemy.id)).toBe(true);});
 it('ability spends Flux, repairs and enforces cooldown',()=>{const s=new Simulation();s.flux[0]=40;const u=s.spawn('soldier',0,20,60);u.hp=50;expect(s.command({team:0,kind:'ability',ids:[u.id]})).toBe(true);expect(u.hp).toBe(115);expect(s.flux[0]).toBe(30);expect(s.command({team:0,kind:'ability',ids:[u.id]})).toBe(false);});
 it('captures neutral vision pylons after channel duration',()=>{const s=new Simulation();s.aiEnabled=false;s.spawn('soldier',0,MAP.pylons[0].x,MAP.pylons[0].z);step(s,60);expect(s.watch[0].owner).toBe(0);});
 it('siege destroys the opposing core and ends the match',()=>{const s=new Simulation();s.aiEnabled=false;const hq=s.entities.find(e=>e.team===1&&e.kind==='core')!;for(let i=0;i<8;i++)s.spawn('siege',0,hq.x-12,hq.z+i*.1);s.vision();step(s,300);expect(s.winner).toBe(0);const end=s.tick;s.step();expect(s.tick).toBe(end);});
 it('repeated command streams yield identical state hashes',()=>{const a=new Simulation(),b=new Simulation();for(const s of [a,b]){s.command({team:0,kind:'train',ids:[1],unit:'worker'});step(s,600);}expect(a.hash()).toBe(b.hash());},20000);
 it('queue cancellation refunds exactly 75 percent',()=>{const s=new Simulation();s.command({team:0,kind:'train',ids:[1],unit:'worker'});s.command({team:0,kind:'cancel',ids:[1]});expect(s.ore[0]).toBe(407.5);});
});
describe('Glass Ravine navigation and data',()=>{
 it('routes across valid bridge lanes without entering canyon',()=>{const p=route(18,66,94,22);expect(p.length).toBeGreaterThan(1);expect(p.every(q=>walkable(q.x,q.z))).toBe(true);expect(p.at(-1)).toEqual({x:94,z:22});});
 it('rejects unreachable canyon destinations',()=>expect(route(18,66,56,35)).toEqual([]));
 it('spawn geometry is rotationally symmetric',()=>{expect(MAP.spawns[0].x+MAP.spawns[1].x).toBe(MAP.width);expect(MAP.spawns[0].z+MAP.spawns[1].z).toBe(MAP.height);});
 it('balance definitions have valid costs and combat periods',()=>{for(const d of Object.values(DATA)){expect(d.hp).toBeGreaterThan(0);expect(d.ore).toBeGreaterThan(0);if(d.damage)expect(d.period).toBeGreaterThan(0);}});
});



