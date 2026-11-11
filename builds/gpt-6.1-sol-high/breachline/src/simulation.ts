export type Vec = {x:number;z:number};
export type Box = {x:number;z:number;w:number;d:number;h:number;kind:string};
export const walls:Box[] = [
 {x:-19,z:-7,w:13,d:14,h:5,kind:'ops'},{x:19,z:8,w:13,d:14,h:5,kind:'bay'},
 {x:-23,z:18,w:19,d:5,h:4,kind:'ops'},{x:24,z:-20,w:16,d:5,h:4,kind:'bay'},
 {x:0,z:4,w:7,d:7,h:2.1,kind:'dish'},
 ...[[-8,-13],[9,-8],[-7,17],[10,21],[-29,-21],[29,22],[-5,-25],[5,28]].map(([x,z])=>({x,z,w:4,d:2,h:1.4,kind:'cover'})),
 {x:-34,z:0,w:3,d:17,h:2.4,kind:'pipe'},{x:34,z:0,w:3,d:17,h:2.4,kind:'pipe'}
];
export const weapons = [
 {id:'jackal',name:'AR-4 Jackal',role:'ASSAULT RIFLE',desc:'Balanced handling. Reliable at medium range.',damage:26,interval:.084,mag:30,reload:1.9,spread:.011,range:40},
 {id:'kestrel',name:'M7 Kestrel',role:'COMPACT AUTOMATIC',desc:'Fast handling. Close-range pressure.',damage:21,interval:.067,mag:36,reload:1.6,spread:.019,range:24},
 {id:'mesa',name:'BR-12 Mesa',role:'BATTLE RIFLE',desc:'Heavy impact. Deliberate, accurate fire.',damage:43,interval:.22,mag:18,reload:2.3,spread:.005,range:60},
 {id:'relay',name:'P9 Relay',role:'SIDEARM',desc:'A dependable backup.',damage:27,interval:.19,mag:12,reload:1.2,spread:.013,range:22}
];
export type Actor = Vec & {id:number;team:number;name:string;hp:number;y:number;vy:number;yaw:number;dead:number;kills:number;deaths:number;momentum:number;lastDamage:number;ammo:number;reload:number;shot:number;target:number;acquire:number;path:Vec[];repath:number;protection:number};
export type Event = {type:string;x:number;z:number;y?:number;target?:number;source?:number;head?:boolean;text?:string};
export type Input = {mx:number;mz:number;yaw:number;pitch:number;fire:boolean;ads:boolean;sprint:boolean;crouch:boolean;jump:boolean};
export function blocked(x:number,z:number,r=.38){return Math.abs(x)>38-r||Math.abs(z)>32-r||walls.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);}
export function clear(a:Vec,b:Vec){const d=Math.hypot(b.x-a.x,b.z-a.z);for(let t=.4;t<d;t+=.45){if(blocked(a.x+(b.x-a.x)*t/d,a.z+(b.z-a.z)*t/d,0))return false;}return true;}
const names=['YOU','Vale','Juno','Slate','Echo','Rook','Talon','Vex','Flint','Mako','Sable','Knox'];
export function safeSpawn(team:number,actors:Actor[]):Vec{
 const points=[-29,-16,0,16,29].map(x=>({x,z:team===0?-28:28}));
 return points.sort((a,b)=>score(b)-score(a))[0];
 function score(p:Vec){return actors.filter(a=>a.team!==team&&a.hp>0).reduce((v,e)=>Math.min(v,Math.hypot(e.x-p.x,e.z-p.z)-(clear(p,e)?20:0)),100);}
}
function route(a:Vec,b:Vec):Vec[]{
 const cell=2, cols=38,rows=32;const key=(x:number,z:number)=>z*cols+x;
 const grid=(v:Vec)=>({x:Math.max(0,Math.min(cols-1,Math.floor((v.x+38)/cell))),z:Math.max(0,Math.min(rows-1,Math.floor((v.z+32)/cell)))});
 const world=(x:number,z:number)=>({x:x*cell-37,z:z*cell-31});let s=grid(a),end=grid(b);const q=[s],seen=new Map<number,number>();seen.set(key(s.x,s.z),-1);let found=-1;
 for(let i=0;i<q.length;i++){let n=q[i],k=key(n.x,n.z);if(n.x===end.x&&n.z===end.z){found=k;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){let x=n.x+dx,z=n.z+dz,k2=key(x,z);if(x<0||z<0||x>=cols||z>=rows||seen.has(k2)||blocked(world(x,z).x,world(x,z).z,.6))continue;seen.set(k2,k);q.push({x,z});}}
 if(found<0)return [];const path:Vec[]=[];while(found!==-1){path.push(world(found%cols,Math.floor(found/cols)));found=seen.get(found)!;}return path.reverse().slice(1);
}
export class Simulation{
 actors:Actor[]=[];events:Event[]=[];score=[0,0];time=0;limit=180;goal=30;ended=false;winner=-1;weapon=0;slot=0;shots=0;hits=0;best=0;grenades=2;recon=0;supportUsed=false;seed=17;lastKiller='';
 constructor(weapon=0,goal=30,limit=180){this.weapon=weapon;this.goal=goal;this.limit=limit;for(let id=0;id<12;id++){let team=id<6?0:1;let p={x:[-26,-16,-5,5,16,26][id%6],z:team===0?-27:27};if(id===0)p.x=0;this.actors.push({...p,id,team,name:names[id],hp:100,y:0,vy:0,yaw:team===0?0:Math.PI,dead:0,kills:0,deaths:0,momentum:0,lastDamage:-10,ammo:id===0?weapons[weapon].mag:30,reload:0,shot:0,target:-1,acquire:0,path:[],repath:0,protection:2});}}
 random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 get player(){return this.actors[0];}get gun(){return weapons[this.slot===1?3:this.weapon];}
 move(a:Actor,x:number,z:number){if(!blocked(a.x+x,a.z))a.x+=x;if(!blocked(a.x,a.z+z))a.z+=z;}
 reload(){const p=this.player;if(p.hp>0&&!p.reload&&p.ammo<this.gun.mag){p.reload=this.gun.reload;this.events.push({type:'reload',x:p.x,z:p.z});}}
 magazines:number[]=[];
 switchWeapon(){if(this.player.hp<=0)return;this.magazines[this.slot]=this.player.ammo;this.slot=1-this.slot;this.player.ammo=this.magazines[this.slot]??this.gun.mag;this.player.reload=0;this.player.shot=.3;}
 damage(v:Actor,amount:number,source:Actor,head=false,support=false){if(v.hp<=0||v.team===source.team||v.protection>0||source.protection>0)return;v.hp-=amount;v.lastDamage=this.time;this.events.push({type:'hit',x:v.x,z:v.z,target:v.id,source:source.id,head});if(v.hp<=0){v.hp=0;v.dead=3;v.deaths++;v.momentum=0;source.kills++;if(!support)source.momentum++;this.score[source.team]++;if(source.id===0)this.best=Math.max(this.best,source.momentum);if(v.id===0){this.lastKiller=source.name;this.supportUsed=false;}this.events.push({type:'kill',x:v.x,z:v.z,target:v.id,source:source.id,text:`${source.name} > ${v.name}`});}}
 fire(yaw:number,pitch:number,ads:boolean){const p=this.player,g=this.gun;if(p.hp<=0||p.reload||p.shot>0)return;if(p.ammo===0){this.reload();return;}p.protection=0;p.ammo--;p.shot=g.interval;this.shots++;this.events.push({type:'shot',x:p.x,z:p.z,y:p.y+1.6,source:0});let best=100,hit:Actor|undefined,head=false;const spread=g.spread*(ads?.22:1);yaw+=(this.random()-.5)*spread;pitch+=(this.random()-.5)*spread;for(const a of this.actors){if(a.team===p.team||a.hp<=0)continue;let dx=a.x-p.x,dz=a.z-p.z,along=dx*Math.sin(yaw)+dz*Math.cos(yaw);if(along<0||along>90)continue;let side=Math.abs(dx*Math.cos(yaw)-dz*Math.sin(yaw));let height=p.y+1.6-Math.tan(pitch)*along;if(side<.48&&height>a.y+.1&&height<a.y+1.95&&along<best&&clear(p,a)){best=along;hit=a;head=height>a.y+1.48;}}if(hit){this.hits++;this.damage(hit,g.damage*(head?1.6:1)*(best>g.range?.72:1),p,head);}if(p.ammo===0)this.reload();}
 grenade(){if(this.grenades<=0||this.player.hp<=0)return;this.grenades--;const p=this.player;const dist=13;let pos={x:p.x,z:p.z};for(let d=1;d<=dist;d++){let n={x:p.x+Math.sin(p.yaw)*d,z:p.z+Math.cos(p.yaw)*d};if(blocked(n.x,n.z,0))break;pos=n;}p.protection=0;this.events.push({type:'explosion',...pos});for(const a of this.actors){let d=Math.hypot(a.x-pos.x,a.z-pos.z);if(d<8&&clear(pos,a))this.damage(a,120*(1-d/9),p,false,true);}}
 support(){if(this.player.momentum>=3&&!this.supportUsed){this.recon=12;this.supportUsed=true;this.events.push({type:'recon',x:0,z:0});}}
 step(dt:number,input:Input){if(this.ended)return;this.time+=dt;this.recon=Math.max(0,this.recon-dt);for(const a of this.actors){a.shot=Math.max(0,a.shot-dt);a.protection=Math.max(0,a.protection-dt);if(a.hp<=0){a.dead-=dt;if(a.dead<=0){Object.assign(a,safeSpawn(a.team,this.actors));a.hp=100;a.protection=2;a.y=0;a.path=[];a.reload=0;a.ammo=a.id===0?this.gun.mag:30;if(a.id===0)this.grenades=2;}continue;}if(a.reload>0){a.reload-=dt;if(a.reload<=0)a.ammo=a.id===0?this.gun.mag:30;}if(this.time-a.lastDamage>5)a.hp=Math.min(100,a.hp+22*dt);
 if(a.id===0){a.yaw=input.yaw;let speed=input.crouch?2.8:input.ads?3.5:input.sprint?7.1:5.2;let norm=Math.max(1,Math.hypot(input.mx,input.mz));let x=(input.mx*Math.cos(a.yaw)+input.mz*Math.sin(a.yaw))/norm;let z=(input.mz*Math.cos(a.yaw)-input.mx*Math.sin(a.yaw))/norm;this.move(a,x*speed*dt,z*speed*dt);if(input.jump&&a.y===0)a.vy=4.1;a.vy-=10*dt;a.y=Math.max(0,a.y+a.vy*dt);if(a.y===0)a.vy=0;if(input.fire&&!input.sprint)this.fire(input.yaw,input.pitch,input.ads);continue;}
 let enemies=this.actors.filter(e=>e.team!==a.team&&e.hp>0);let visible=enemies.filter(e=>Math.hypot(e.x-a.x,e.z-a.z)<32&&clear(a,e));visible.sort((u,v)=>Math.hypot(u.x-a.x,u.z-a.z)-Math.hypot(v.x-a.x,v.z-a.z));let target=visible[0];if(target){if(a.target!==target.id){a.target=target.id;a.acquire=.45+this.random()*.4;}a.acquire-=dt;a.yaw=Math.atan2(target.x-a.x,target.z-a.z);let d=Math.hypot(target.x-a.x,target.z-a.z);if(d>17)this.move(a,Math.sin(a.yaw)*2.8*dt,Math.cos(a.yaw)*2.8*dt);else this.move(a,Math.cos(this.time+a.id)*Math.cos(a.yaw)*1.5*dt,-Math.cos(this.time+a.id)*Math.sin(a.yaw)*1.5*dt);if(a.acquire<=0&&a.shot<=0&&!a.reload){a.protection=0;a.shot=.24;a.ammo--;this.events.push({type:'shot',x:a.x,z:a.z,y:1.5,source:a.id,target:target.id});if(this.random()<.48)this.damage(target,11,a);if(a.ammo<=0)a.reload=2;}}
 else{a.target=-1;a.repath-=dt;if(a.repath<=0||!a.path.length){a.repath=2+this.random();const nearest=enemies.sort((u,v)=>Math.hypot(u.x-a.x,u.z-a.z)-Math.hypot(v.x-a.x,v.z-a.z))[0];if(nearest)a.path=route(a,nearest);}const p=a.path[0];if(p){const d=Math.hypot(p.x-a.x,p.z-a.z);a.yaw=Math.atan2(p.x-a.x,p.z-a.z);if(d<.3)a.path.shift();else this.move(a,(p.x-a.x)/d*4.1*dt,(p.z-a.z)/d*4.1*dt);}}
 }if(this.score.some(s=>s>=this.goal)||this.time>=this.limit){if(this.score[0]===this.score[1]){this.limit+=60;this.goal=this.score[0]+5;}else{this.ended=true;this.winner=this.score[0]>this.score[1]?0:1;}}}
}

