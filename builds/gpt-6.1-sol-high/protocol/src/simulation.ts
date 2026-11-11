export type Vec = {x:number;z:number};
export type Side = 'intrusion'|'custodian';
export type Phase = 'buy'|'live'|'end'|'result';
export const RULESET='annex-local-1';
export const DT=1/64;
export const SITES=[{x:-18,z:13,label:'A',name:'TURBINE'},{x:18,z:13,label:'B',name:'GARDEN'}];
export type Wall={x:number;z:number;w:number;d:number;h:number;kind?:string};
export const WALLS:Wall[]=[
 {x:-28,z:0,w:1,d:64,h:7},{x:28,z:0,w:1,d:64,h:7},{x:0,z:-32,w:57,d:1,h:7},{x:0,z:32,w:57,d:1,h:7},
 {x:-10,z:-18,w:1.2,d:16,h:5},{x:10,z:-18,w:1.2,d:16,h:5},
 {x:-19,z:-8,w:12,d:1.2,h:4},{x:19,z:-8,w:12,d:1.2,h:4},
 {x:-8,z:6,w:1.2,d:19,h:5},{x:8,z:6,w:1.2,d:19,h:5},
 {x:0,z:1,w:5,d:4,h:2.7,kind:'core'},
 {x:-18,z:7,w:4,d:2,h:1.3,kind:'cover'},{x:-23,z:17,w:3,d:5,h:2,kind:'cover'},
 {x:17,z:7,w:6,d:2,h:1.2,kind:'plant'},{x:23,z:18,w:3,d:5,h:1.6,kind:'plant'},
 {x:0,z:22,w:12,d:1.2,h:4},{x:-15,z:26,w:1.2,d:9,h:5},{x:15,z:26,w:1.2,d:9,h:5},
 {x:-4,z:-10,w:3,d:2,h:1.3,kind:'cover'},{x:20,z:-20,w:4,d:3,h:2,kind:'cover'}
];
export const WEAPONS={vela:{name:'P-5 Vela',cost:0,mag:15,reserve:75,damage:30,rate:.23,reload:1.5,spread:.004},kite:{name:'Kite-9',cost:1250,mag:30,reserve:120,damage:23,rate:.085,reload:1.9,spread:.006},aster:{name:'Aster 4',cost:2650,mag:24,reserve:96,damage:38,rate:.13,reload:2.2,spread:.0025}};
export type Gun=keyof typeof WEAPONS;
export type Actor={id:number;name:string;team:number;side:Side;x:number;z:number;yaw:number;hp:number;armor:number;gun:Gun;ammo:number;reserve:number;money:number;kills:number;deaths:number;cooldown:number;reload:number;speed:number;burst:number;lastShot:number;target:Vec;path:Vec[];repath:number;reaction:number;kit:boolean;smokes:number;interact:number};
export type Input={x:number;z:number;yaw:number;pitch:number;fire:boolean;reload:boolean;interact:boolean;walk:boolean;crouch:boolean};
export type Event={type:string;text:string;actor?:number;target?:number;x?:number;z?:number;head?:boolean};
export const distance=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.z-b.z);
export function blocked(x:number,z:number,r=.35){return WALLS.some(w=>Math.abs(x-w.x)<w.w/2+r&&Math.abs(z-w.z)<w.d/2+r);}
export function clear(a:Vec,b:Vec){const d=distance(a,b);for(let t=.25;t<d;t+=.35){const p=t/d;if(blocked(a.x+(b.x-a.x)*p,a.z+(b.z-a.z)*p,0))return false;}return true;}
export function move(a:Vec,dx:number,dz:number){if(!blocked(a.x+dx,a.z))a.x+=dx;if(!blocked(a.x,a.z+dz))a.z+=dz;}
export function route(from:Vec,to:Vec):Vec[]{
 const snap=(v:Vec)=>({x:Math.round(v.x/2)*2,z:Math.round(v.z/2)*2});const start=snap(from),end=snap(to),key=(v:Vec)=>`${v.x},${v.z}`;
 const open=[{...start,g:0,f:0}],seen=new Set<string>(),parents=new Map<string,Vec>();let n=0;
 while(open.length&&n++<1200){open.sort((a,b)=>a.f-b.f);const p=open.shift()!;const k=key(p);if(seen.has(k))continue;seen.add(k);if(distance(p,end)<2.5){let cur:Vec=p;const out=[to];while(key(cur)!==key(start)){out.unshift(cur);const prev=parents.get(key(cur));if(!prev)break;cur=prev;}return out;}
 for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2]]){const v={x:p.x+dx,z:p.z+dz};if(Math.abs(v.x)>26||Math.abs(v.z)>30||blocked(v.x,v.z,.55)||seen.has(key(v)))continue;const g=p.g+2;const old=open.find(o=>key(o)===key(v));if(old&&old.g<=g)continue;parents.set(key(v),p);open.push({...v,g,f:g+distance(v,end)});}}
 return [to];
}
export function purchase(a:Actor,item:string,phase:Phase):boolean{
 if(phase!=='buy'||a.hp<=0)return false;
 if(item in WEAPONS){const gun=item as Gun,w=WEAPONS[gun];if(a.money<w.cost||a.gun===gun)return false;a.money-=w.cost;a.gun=gun;a.ammo=w.mag;a.reserve=w.reserve;return true;}
 const cost=item==='armor'?650:item==='smoke'?300:item==='kit'?400:Infinity;
 if(a.money<cost||(item==='armor'&&a.armor===100)||(item==='smoke'&&a.smokes>=2)||(item==='kit'&&(a.kit||a.side!=='custodian')))return false;
 a.money-=cost;if(item==='armor')a.armor=100;if(item==='smoke')a.smokes++;if(item==='kit')a.kit=true;return true;
}
export class Match{
 botsEnabled=true;actors:Actor[]=[];phase:Phase='buy';timer=15;round=1;scores=[0,0];events:Event[]=[];losses=[0,0];history:{winner:number;reason:string}[]=[];
 carrier=0;spike:Vec|null=null;armed:Vec|null=null;progress=0;interactionActor=-1;reason='';winner=-1;time=0;seed=90210;smokes:{x:number;z:number;life:number}[]=[];plan=0;
 constructor(){const names=['YOU','SABLE','MICA','ECHO','FLINT','ORBIT','HELIX','PRISM','ION','CIRRUS'];this.actors=names.map((name,id)=>({id,name,team:id<5?0:1,side:id<5?'intrusion':'custodian',x:0,z:0,yaw:0,hp:100,armor:0,gun:'vela',ammo:15,reserve:75,money:800,kills:0,deaths:0,cooldown:0,reload:0,speed:0,burst:0,lastShot:0,target:{x:0,z:0},path:[],repath:0,reaction:0,kit:false,smokes:1,interact:0}));this.startRound();}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 emit(e:Event){this.events.push(e);}
 startRound(){this.phase='buy';this.timer=15;this.armed=null;this.spike=null;this.progress=0;this.interactionActor=-1;this.smokes=[];this.plan=(this.round-1)%2;
 const swap=this.round>3;
 for(const a of this.actors){a.side=(a.team===0)!==swap?'intrusion':'custodian';a.x=(a.id%5-2)*2;a.z=a.side==='intrusion'?-27:28;a.yaw=a.side==='intrusion'?0:Math.PI;if(a.hp<=0){a.gun='vela';a.ammo=15;a.reserve=75;a.armor=0;a.kit=false;a.smokes=1;}a.hp=100;a.cooldown=0;a.reload=0;a.burst=0;a.interact=0;a.repath=0;a.path=[];if(a.id!==0){if(a.money>=3300){purchase(a,'aster','buy');purchase(a,'armor','buy');}else if(a.money>=1250)purchase(a,'kite','buy');}}
 this.carrier=this.actors[0].side==='intrusion'?0:5;this.emit({type:'round',text:`ROUND ${this.round} · ${this.actors[0].side.toUpperCase()}`});}
 finish(team:number,reason:string){if(this.phase!=='live')return;this.phase='end';this.timer=5;this.winner=team;this.reason=reason;this.scores[team]++;this.history.push({winner:team,reason});for(const a of this.actors){const win=a.team===team;let reward=win?3000:Math.min(3100,1900+400*this.losses[a.team]);a.money=Math.min(12000,a.money+reward);a.reload=0;}this.losses[team]=Math.max(0,this.losses[team]-1);this.losses[1-team]++;this.emit({type:'win',text:reason});}
 smoke(id:number,yaw:number){const a=this.actors[id];if(this.phase!=='live'||a.hp<=0||a.smokes<=0)return;a.smokes--;let p={x:a.x,z:a.z};for(let i=0;i<24;i++){const n={x:p.x+Math.sin(yaw)*.45,z:p.z+Math.cos(yaw)*.45};if(blocked(n.x,n.z,.2))break;p=n;}this.smokes.push({...p,life:17});this.emit({type:'smoke',text:'Veil deployed',...p});}
 visible(a:Vec,b:Vec){return clear(a,b)&&!this.smokes.some(s=>{const vx=b.x-a.x,vz=b.z-a.z,t=Math.max(0,Math.min(1,((s.x-a.x)*vx+(s.z-a.z)*vz)/(vx*vx+vz*vz)));return Math.hypot(a.x+vx*t-s.x,a.z+vz*t-s.z)<3.4;});}
 shoot(a:Actor,yaw:number,pitch:number,botTarget?:Actor){if(this.phase!=='live'||a.hp<=0||a.cooldown>0||a.reload>0||a.ammo<=0||this.interactionActor===a.id&&this.progress>0)return false;
 const w=WEAPONS[a.gun];a.ammo--;a.cooldown=w.rate;a.burst=this.time-a.lastShot>.4?0:a.burst+1;a.lastShot=this.time;
 const spread=w.spread+(a.speed>.45?.033:0)+Math.min(.025,a.burst*.0018);yaw+=(this.random()-.5)*spread*2;pitch+=(this.random()-.5)*spread*2+Math.min(a.burst*.0015,.022);
 let hit:Actor|undefined,near=75,head=false;
 for(const b of this.actors){if(b.hp<=0||b.team===a.team)continue;const dx=b.x-a.x,dz=b.z-a.z,d=dx*Math.sin(yaw)+dz*Math.cos(yaw);if(d<=0||d>near)continue;const lateral=Math.abs(dx*Math.cos(yaw)-dz*Math.sin(yaw));const y=1.62+Math.tan(pitch)*d;if(lateral<.38&&y>.25&&y<1.94&&clear(a,b)){near=d;hit=b;head=y>1.48;}}
 if(botTarget&&hit!==botTarget)hit=undefined;
 this.emit({type:'shot',text:'',actor:a.id,target:hit?.id,x:a.x+Math.sin(yaw)*near,z:a.z+Math.cos(yaw)*near,head});
 if(hit){let dmg=w.damage*(head?3.5:1)*(near>28?.85:1);if(hit.armor>0){hit.armor=Math.max(0,hit.armor-dmg*.35);dmg*=.73;}hit.hp=Math.max(0,hit.hp-dmg);this.emit({type:'hit',text:head?'HEADSHOT':'HIT',actor:a.id,target:hit.id,head});if(hit.hp<=0){a.kills++;a.money=Math.min(12000,a.money+250);hit.deaths++;if(this.carrier===hit.id&&!this.armed){this.spike={x:hit.x,z:hit.z};this.carrier=-1;}this.emit({type:'kill',text:`${a.name}  /  ${hit.name}`,actor:a.id,target:hit.id,head});}}
 return true;}
 update(dt:number,input:Input){this.time+=dt;if(this.phase==='result')return;this.timer-=dt;
 if(this.phase==='end'){if(this.timer<=0){if(this.scores.some(s=>s>=4)){this.phase='result';this.emit({type:'result',text:'MATCH COMPLETE'});}else{this.round++;if(this.round===4)for(const a of this.actors){a.money=2400;a.hp=0;}this.startRound();}}return;}
 if(this.phase==='buy'){if(this.timer<=0){this.phase='live';this.timer=85;this.emit({type:'live',text:'BREACH AUTHORIZED'});}return;}
 for(const s of this.smokes)s.life-=dt;this.smokes=this.smokes.filter(s=>s.life>0);
 let interacting=-1;
 for(const a of this.actors){if(a.hp<=0)continue;a.cooldown=Math.max(0,a.cooldown-dt);if(a.reload>0){a.reload-=dt;if(a.reload<=0){const n=Math.min(WEAPONS[a.gun].mag-a.ammo,a.reserve);a.ammo+=n;a.reserve-=n;}}
 let use=false;
 if(a.id===0){a.yaw=input.yaw;const mag=Math.hypot(input.x,input.z),speed=(input.walk?2.45:input.crouch?1.9:4.7);a.speed=mag?speed:0;if(mag){const dx=(input.x*Math.cos(a.yaw)+input.z*Math.sin(a.yaw))/mag*speed*dt,dz=(-input.x*Math.sin(a.yaw)+input.z*Math.cos(a.yaw))/mag*speed*dt;move(a,dx,dz);}use=input.interact;if(input.fire&&!use)this.shoot(a,input.yaw,input.pitch);if(input.reload)this.reload(a);}
 else if(this.botsEnabled){a.repath-=dt;const enemy=this.actors.filter(b=>b.team!==a.team&&b.hp>0&&distance(a,b)<31&&this.visible(a,b)).sort((b,c)=>distance(a,b)-distance(a,c))[0];
 if(enemy){a.yaw=Math.atan2(enemy.x-a.x,enemy.z-a.z);a.reaction+=dt;a.speed=0;if(a.reaction>.55+a.id*.017){const err=(this.random()-.5)*.06;this.shoot(a,a.yaw+err,-.018+(this.random()-.5)*.025,enemy);}if(a.ammo===0)this.reload(a);}
 else{a.reaction=0;let target:Vec;
 if(this.armed){target=a.side==='custodian'?this.armed:{x:this.armed.x+(a.id%3-1)*5,z:this.armed.z-5};}
 else if(a.side==='intrusion'){target=this.spike&&this.carrier<0?this.spike:SITES[this.plan];}
 else{const site=SITES[a.id%2];target={x:site.x+(a.id%3-1)*4,z:site.z+(a.id%2?4:-2)};}
 if(a.repath<=0||distance(target,a.target)>3){a.target=target;a.path=route(a,target);a.repath=2+a.id*.1;}
 const waypoint=a.path[0];a.speed=0;if(waypoint&&distance(a,target)>1.1){const d=distance(a,waypoint);if(d<.5)a.path.shift();else{a.speed=3.2;a.yaw=Math.atan2(waypoint.x-a.x,waypoint.z-a.z);move(a,(waypoint.x-a.x)/d*3.2*dt,(waypoint.z-a.z)/d*3.2*dt);}}
 use=!!this.armed&&a.side==='custodian'&&distance(a,this.armed)<2.8||!this.armed&&this.carrier===a.id&&SITES.some(s=>distance(a,s)<3.4);}}
 if(this.carrier<0&&this.spike&&a.side==='intrusion'&&distance(a,this.spike)<1.5){this.carrier=a.id;this.spike=null;}
 if(use&&interacting<0&&(this.armed?a.side==='custodian'&&distance(a,this.armed)<3:this.carrier===a.id&&SITES.some(s=>distance(a,s)<3.8)))interacting=a.id;
 }
 if(interacting>=0){if(this.interactionActor!==interacting)this.progress=0;this.interactionActor=interacting;this.progress+=dt;const a=this.actors[interacting],duration=this.armed?(a.kit?5:8):3.2;if(this.progress>=duration){if(this.armed){a.money=Math.min(12000,a.money+300);this.finish(a.team,'CIPHER DISARMED');}else{this.armed={x:a.x,z:a.z};this.timer=35;a.money=Math.min(12000,a.money+300);for(const b of this.actors.filter(b=>b.team===a.team))b.money=Math.min(12000,b.money+600);this.emit({type:'armed',text:'CIPHER ARMED · 35 SECONDS'});}this.progress=0;this.interactionActor=-1;}}
 else{this.progress=0;this.interactionActor=-1;}
 const atk=this.actors.filter(a=>a.side==='intrusion'),def=this.actors.filter(a=>a.side==='custodian');if(def.every(a=>a.hp<=0))this.finish(atk[0].team,'CUSTODIANS ELIMINATED');else if(!this.armed&&atk.every(a=>a.hp<=0))this.finish(def[0].team,'INTRUSION ELIMINATED');else if(this.timer<=0)this.finish(this.armed?atk[0].team:def[0].team,this.armed?'CIPHER DETONATED':'VAULTS SECURED');
 }
 reload(a:Actor){if(a.reload<=0&&a.ammo<WEAPONS[a.gun].mag&&a.reserve>0){a.reload=WEAPONS[a.gun].reload;this.emit({type:'reload',text:'',actor:a.id});}}
}
