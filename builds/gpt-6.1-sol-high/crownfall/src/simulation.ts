import {HEROES,ITEMS,COOLDOWNS,lanes,type Team} from './content';
export type Point={x:number,z:number};
export type Entity=Point & {id:number,team:Team|2,kind:'hero'|'minion'|'tower'|'seal'|'core'|'engine'|'boss',hp:number,maxHp:number,damage:number,range:number,speed:number,cd:number,lane:number,waypoint:number,hero:number,name:string,dead:number,target:number,move:Point|null,level:number,xp:number,gold:number,kills:number,deaths:number,cs:number,inventory:number[],cooldowns:number[],mana:number,shield:number,slow:number,recall:number,bot:boolean};
export type Effect=Point & {type:'hit'|'shot'|'ring'|'dash'|'ward'|'warning'|'heal',tx:number,tz:number,color:string,life:number,maxLife:number,size:number};
type Delayed={at:number,p:Point,r:number,damage:number,source:number};
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
export function segmentDistance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dz=b.z-a.z;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
export class Game {
 entities:Entity[]=[];effects:Effect[]=[];delayed:Delayed[]=[];time=0;wave=0;nextWave=0;nextId=1;winner:Team|null=null;player:Entity;feed:string[]=['The gates are open. The Diadem awaits.'];buff=[0,0];wards:({team:Team,until:number}&Point)[]=[];events=new Set<string>();paused=false;
 constructor(hero=0){
  for(let t=0;t<2;t++){
   const team=t as Team,s=team===0?-1:1;
   for(let lane=0;lane<2;lane++){this.spawn('tower',team,s*23,(lane===0?-1:1)*19,950,'Causeway Tower',lane);this.spawn('seal',team,s*32,(lane===0?-1:1)*12,650,'Lane Seal',lane);}
   for(let lane=0;lane<2;lane++)this.spawn('core',team,s*37,(lane===0?-1:1)*5.5,850,'Core Tower',lane);
   this.spawn('engine',team,s*42,0,1400,'Crown Engine');
   for(let i=0;i<3;i++){const h=team===0?(i===0?hero:(hero+i+1)%6):[3,4,5][i];const e=this.spawn('hero',team,s*40,(i-1)*3,HEROES[h].hp,HEROES[h].name,i%2);e.hero=h;e.damage=HEROES[h].damage;e.range=HEROES[h].range;e.speed=7;e.bot=team!==0||i!==0;e.gold=300;}
  }
  this.player=this.entities.find(e=>e.kind==='hero'&&!e.bot)!;
  this.spawn('boss',2,0,0,2000,'Aether Colossus');
 }
 spawn(kind:Entity['kind'],team:Entity['team'],x:number,z:number,hp:number,name:string,lane=0){const e:Entity={id:this.nextId++,kind,team,x,z,hp,maxHp:hp,name,lane,damage:kind==='minion'?22:kind==='boss'?65:65,range:kind==='minion'?3:11,speed:4.8,cd:0,waypoint:team===0?1:3,hero:0,dead:0,target:0,move:null,level:1,xp:0,gold:0,kills:0,deaths:0,cs:0,inventory:[],cooldowns:[0,0,0,0],mana:100,shield:0,slow:0,recall:0,bot:true};this.entities.push(e);return e;}
 note(s:string){this.feed.unshift(s);this.feed.length=Math.min(this.feed.length,5);}
 effect(type:Effect['type'],p:Point,size=2,color='#ffc16e',life=.5,to=p){this.effects.push({...p,type,size,color,life,maxLife:life,tx:to.x,tz:to.z});}
 visible(e:Entity,team:Team=0){return e.team===team||e.kind==='tower'||e.kind==='seal'||e.kind==='core'||e.kind==='engine'||e.kind==='boss'||this.entities.some(a=>a.team===team&&a.hp>0&&distance(a,e)<17)||this.wards.some(w=>w.team===team&&w.until>this.time&&distance(w,e)<19);}
 vulnerable(e:Entity){if(e.kind==='seal')return !this.entities.some(a=>a.kind==='tower'&&a.team===e.team&&a.lane===e.lane&&a.hp>0);if(e.kind==='core')return this.entities.some(a=>a.kind==='seal'&&a.team===e.team&&a.hp<=0);if(e.kind==='engine')return !this.entities.some(a=>a.kind==='core'&&a.team===e.team&&a.hp>0)&&this.entities.some(a=>a.kind==='seal'&&a.team===e.team&&a.hp<=0);return true;}
 damage(a:Entity,b:Entity,value:number){if(b.hp<=0||!this.vulnerable(b))return;const shield=Math.min(b.shield,value);b.shield-=shield;value-=shield;
  if(['tower','seal','core','engine'].includes(b.kind)&&!this.entities.some(e=>e.team===a.team&&e.kind==='minion'&&e.hp>0&&distance(e,b)<14))value*=.28;
  b.hp=Math.max(0,b.hp-value);b.recall=0;this.effect('hit',b,b.kind==='hero'?1.6:.8,b.team===0?'#65e2e0':'#ff806d',.25);
  if(b.hp===0){if(b.kind==='hero'){b.deaths++;b.dead=8+b.level*.5;a.kills++;this.note(`${a.name} defeated ${b.name}`);}else if(b.kind==='minion'){if(a.kind==='hero'){a.cs++;a.gold+=24;}for(const h of this.entities.filter(e=>e.kind==='hero'&&e.team===a.team&&distance(e,b)<18))this.gainXp(h,25);}
   else if(b.kind==='boss'){this.buff[a.team]=this.time+70;for(const h of this.entities.filter(e=>e.kind==='hero'&&e.team===a.team)){h.gold+=160;this.gainXp(h,180);}b.dead=90;this.note(`${a.team===0?'Dawn':'Dusk'} claimed the Colossus. Siege empowered!`);this.events.add('objective');}
   else {for(const h of this.entities.filter(e=>e.kind==='hero'&&e.team===a.team))h.gold+=100;this.note(`${b.team===0?'Dawn':'Dusk'} ${b.name} has fallen`);this.events.add('tower');if(b.kind==='engine'&&this.winner===null){this.winner=a.team as Team;this.note('The Crown has fallen.');}}
   if(b.kind==='hero'){a.gold+=140;this.gainXp(a,100);}
  }
 }
 gainXp(e:Entity,n:number){e.xp+=n;while(e.xp>=e.level*85&&e.level<12){e.xp-=e.level*85;e.level++;e.maxHp+=60;e.hp=Math.min(e.maxHp,e.hp+160);e.damage+=5;this.effect('heal',e,4,'#f2d58a',1);if(e===this.player)this.note(`Level ${e.level}${e.level===6?' · Ultimate unlocked':''}`);}}
 move(p:Point,target=0){if(this.player.hp<=0)return;this.player.move={x:Math.max(-46,Math.min(46,p.x)),z:Math.max(-28,Math.min(28,p.z))};this.player.target=target;this.player.recall=0;this.events.add('move');this.effect('ring',p,1.2,'#7eeadd',.7);}
 cast(slot:number,p:Point,caster=this.player){if(caster.hp<=0||caster.cooldowns[slot]>0||caster.mana<([16,20,18,40][slot])||(slot===3&&caster.level<6))return false;
  caster.recall=0;caster.mana-=[16,20,18,40][slot];caster.cooldowns[slot]=COOLDOWNS[slot];const dx=p.x-caster.x,dz=p.z-caster.z,d=Math.hypot(dx,dz)||1;const aim={x:caster.x+dx/d*Math.min(d,slot===3?22:15),z:caster.z+dz/d*Math.min(d,slot===3?22:15)};const color=HEROES[caster.hero].color;
  if(slot===2&&caster.hero===0){this.delayed.push({at:this.time+.7,p:aim,r:5,damage:155+caster.damage*.5,source:caster.id});this.effect('warning',aim,5,color,.7);}
  else if(slot===2||(slot===1&&caster.hero===0)){const start={x:caster.x,z:caster.z};caster.x=Math.max(-46,Math.min(46,caster.x+dx/d*Math.min(d,7)));caster.z=Math.max(-28,Math.min(28,caster.z+dz/d*Math.min(d,7)));caster.shield+=90;this.effect('dash',start,2,color,.5,caster);}
  else if(slot===1&&caster.hero!==4){caster.shield+=180;for(const a of this.entities.filter(a=>a.team===caster.team&&a.hp>0&&distance(caster,a)<9)){a.hp=Math.min(a.maxHp,a.hp+110);this.effect('heal',a,4,'#82f3cf',.8);}}
  else if((slot===1&&caster.hero===4)||slot===3&&caster.hero!==0){const r=slot===3?9:5;this.delayed.push({at:this.time+.85,p:aim,r,damage:slot===3?330:120,source:caster.id});this.effect('warning',aim,r,caster.team===0?'#c3a5ff':'#ff7867',.85);}
  else {const end=slot===3?{x:caster.x+dx/d*34,z:caster.z+dz/d*34}:aim;this.effect('shot',caster,slot===3?2.4:1,color,.4,end);for(const b of this.entities.filter(b=>b.team!==caster.team&&b.hp>0&&this.visible(b,caster.team as Team)&&segmentDistance(b,caster,end)<(slot===3?3:2)))this.damage(caster,b,(slot===3?280:95)+caster.damage*.7);}
  if(caster===this.player)this.events.add('cast');return true;
 }
 buy(index:number){const p=this.player,item=ITEMS[index];if(!item||distance(p,{x:-42,z:0})>9||p.gold<item.cost||p.inventory.length>=6||p.hp<=0)return false;p.gold-=item.cost;p.inventory.push(index);p.damage+=item.damage;p.maxHp+=item.hp;p.hp+=item.hp;p.speed+=item.speed;this.events.add('shop');return true;}
 ward(p:Point){if(this.player.hp<=0||distance(p,this.player)>20||this.wards.filter(w=>w.team===0&&w.until>this.time).length>=2)return false;this.wards.push({...p,team:0,until:this.time+60});this.effect('ward',p,18,'#78e4df',1);this.events.add('ward');return true;}
 recall(){if(this.player.hp>0){this.player.recall=4;this.player.move=null;this.player.target=0;this.events.add('recall');}}
 walk(e:Entity,p:Point,dt:number){const d=distance(e,p);if(d<.2)return;const v=Math.min(d,e.speed*(e.slow>0?.55:1)*dt);e.x+=(p.x-e.x)/d*v;e.z+=(p.z-e.z)/d*v;}
 step(dt:number){if(this.winner!==null||this.paused)return;this.time+=dt;for(const f of this.effects)f.life-=dt;this.effects=this.effects.filter(f=>f.life>0);this.wards=this.wards.filter(w=>w.until>this.time);
  for(const d of this.delayed.filter(d=>d.at<=this.time)){const a=this.entities.find(e=>e.id===d.source)!;this.effect('ring',d.p,d.r,HEROES[a.hero].color,.6);for(const b of this.entities.filter(e=>e.team!==a.team&&e.hp>0&&distance(e,d.p)<d.r)){this.damage(a,b,d.damage);b.slow=2;}}this.delayed=this.delayed.filter(d=>d.at>this.time);
  if(this.time>=this.nextWave){this.nextWave=this.time+14;this.wave++;for(let team=0;team<2;team++)for(let lane=0;lane<2;lane++)for(let i=0;i<4;i++){const s=team===0?-1:1;const v=this.spawn('minion',team as Team,s*41+(i%2)*.8,(i-1.5)*1.2,150+this.wave*9,'Lane Guard',lane);v.damage=22+this.wave*2;const siege=this.entities.some(e=>e.kind==='seal'&&e.team!==team&&e.lane===lane&&e.hp<=0);if(siege){v.maxHp*=1.6;v.hp=v.maxHp;v.damage*=1.5;}}}
  const alive=this.entities.filter(e=>e.hp>0);
  for(const e of this.entities){e.cd=Math.max(0,e.cd-dt);e.slow=Math.max(0,e.slow-dt);e.shield=Math.max(0,e.shield-dt*8);if(e.hp<=0){if((e.kind==='hero'||e.kind==='boss')&&e.dead>0){e.dead-=dt;if(e.dead<=0){e.hp=e.maxHp;if(e.kind==='hero'){e.x=e.team===0?-41:41;e.z=0;e.mana=100;e.move=null;e.target=0;}}}continue;}
   if(e.kind==='hero'){e.gold+=dt*3;e.mana=Math.min(100,e.mana+dt*4);e.cooldowns=e.cooldowns.map(c=>Math.max(0,c-dt));if(distance(e,{x:e.team===0?-42:42,z:0})<7)e.hp=Math.min(e.maxHp,e.hp+dt*140);else e.hp=Math.min(e.maxHp,e.hp+dt*2);
    if(e.recall>0){e.recall-=dt;this.effect('ring',e,2,'#85ddd9',.12);if(e.recall<=0){e.x=e.team===0?-42:42;e.z=0;}continue;}
   }
   if(e.kind==='seal'||e.kind==='engine')continue;
   const targets=alive.filter(b=>b.id!==e.id&&b.team!==e.team&&this.vulnerable(b)&&(e.team===2?b.kind==='hero':this.visible(b,e.team)));
   let target:Entity|undefined;
   if(e.kind==='tower'||e.kind==='core'){target=targets.filter(b=>distance(e,b)<e.range).sort((a,b)=>(a.kind==='minion'?0:1)-(b.kind==='minion'?0:1)||distance(e,a)-distance(e,b))[0];}
   else if(e.kind==='boss'){target=targets.find(b=>distance(e,b)<7);}
   else if(e===this.player&&!e.bot){target=targets.find(b=>b.id===e.target);if(target&&distance(e,target)>e.range)this.walk(e,target,dt);else if(e.move){this.walk(e,e.move,dt);if(distance(e,e.move)<.3)e.move=null;}if(!target)target=targets.filter(b=>distance(e,b)<e.range&&b.kind!=='boss').sort((a,b)=>distance(e,a)-distance(e,b))[0];}
   else {target=targets.filter(b=>b.kind!=='boss'&&distance(e,b)<(e.kind==='hero'?13:9)).sort((a,b)=>distance(e,a)-distance(e,b))[0];
    if(e.kind==='hero'&&e.hp<e.maxHp*.22){this.walk(e,{x:e.team===0?-42:42,z:0},dt);continue;}
    if(target){if(distance(e,target)>e.range)this.walk(e,target,dt);if(e.kind==='hero'&&target.kind==='hero'&&e.cd<=0){this.cast(0,target,e);if(e.level>=6)this.cast(3,target,e);}}
    else {const points=lanes[e.lane];const p=points[e.waypoint];this.walk(e,p,dt);if(distance(e,p)<2)e.waypoint=Math.max(0,Math.min(4,e.waypoint+(e.team===0?1:-1)));}
   }
   if(target&&target.hp>0&&distance(e,target)<=e.range&&e.cd<=0){e.cd=e.kind==='hero'?.8:1.15;const empowered=this.buff[e.team]>this.time&&e.kind==='minion';this.effect('shot',e,.25,e.team===0?'#6de6e5':'#ff8b79',.2,target);this.damage(e,target,e.damage*(empowered?1.8:1));if(e===this.player)this.events.add('attack');}
  }
  if(this.entities.length>180)this.entities=this.entities.filter(e=>e.hp>0||e.kind!=='minion');
 }
}
