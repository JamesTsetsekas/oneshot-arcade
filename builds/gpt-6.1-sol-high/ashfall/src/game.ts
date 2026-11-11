export type Vec = {x:number;z:number};
export type HeroClass = 'Cinder Vow'|'Veil Ranger';
export type Item = {id:number;name:string;rarity:string;power:number;armor:number;level:number};
export type Enemy = Vec & {id:number;kind:string;hp:number;max:number;state:string;timer:number;cooldown:number;angle:number;boss:boolean;phase:number;origin:Vec};
export type Effect = Vec & {id:number;kind:string;life:number;max:number;radius:number;text?:string};
export type Skill = {name:string;key:string;cost:number;cooldown:number;radius:number;coefficient:number;description:string;tags:string[];targeting:string;timing:number;cancel:number;ailment:number;vfx:string;sfx:string;threat:number};
export const SKILLS:Record<HeroClass,Skill[]> = {
 'Cinder Vow':[
 {name:'Brand Arc',key:'RMB',cost:22,cooldown:1.8,radius:4.5,coefficient:2,description:'Sweep nearby foes with a burning arc.',tags:['Ember','Area'],targeting:'self',timing:.15,cancel:.65,ailment:.3,vfx:'arc',sfx:'cast',threat:2},
 {name:'Bastion Step',key:'Q',cost:15,cooldown:5,radius:3,coefficient:1.5,description:'Rush toward the cursor, striking on arrival.',tags:['Physical','Movement'],targeting:'point',timing:.1,cancel:.7,ailment:0,vfx:'rush',sfx:'cast',threat:1},
 {name:'Cinder Ring',key:'W',cost:35,cooldown:7,radius:6,coefficient:3.2,description:'After 0.65s, erupt in a wide ring of fire.',tags:['Ember','Area'],targeting:'self',timing:.65,cancel:.8,ailment:.6,vfx:'ring',sfx:'cast',threat:3},
 {name:'Ashen Standard',key:'E',cost:28,cooldown:12,radius:5,coefficient:1,description:'Recover 35 health and stagger nearby foes.',tags:['Guard','Sustain'],targeting:'self',timing:.2,cancel:.7,ailment:0,vfx:'heal',sfx:'heal',threat:1}],
 'Veil Ranger':[
 {name:'Splinter Volley',key:'RMB',cost:22,cooldown:1.8,radius:5,coefficient:1.8,description:'Burst arrows around the cursor.',tags:['Physical','Area'],targeting:'point',timing:.15,cancel:.65,ailment:0,vfx:'volley',sfx:'cast',threat:2},
 {name:'Ghostline',key:'Q',cost:18,cooldown:5,radius:3,coefficient:3.5,description:'A concentrated shot through marked prey.',tags:['Trace','Projectile'],targeting:'point',timing:.1,cancel:.7,ailment:0,vfx:'line',sfx:'cast',threat:2},
 {name:'Snare Bloom',key:'W',cost:30,cooldown:7,radius:5.5,coefficient:2.5,description:'A delayed star-metal trap staggers a pack.',tags:['Trap','Area'],targeting:'point',timing:.65,cancel:.8,ailment:1,vfx:'bloom',sfx:'cast',threat:3},
 {name:'Mothcloak',key:'E',cost:25,cooldown:12,radius:4,coefficient:1,description:'Recover 35 health and repel close threats.',tags:['Sustain','Veil'],targeting:'self',timing:.2,cancel:.7,ailment:0,vfx:'heal',sfx:'heal',threat:1}]
};
export function rng(seed:number){let a=seed|0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function loot(seed:number,level:number,boss=false):Item{const r=rng(seed);const rare=boss||r()>.72;return {id:seed,name:(rare?'Inscribed ':'Tempered ')+['Starcleaver','Ashguard','Moonstring','Vowkeeper'][Math.floor(r()*4)],rarity:rare?'Inscribed':'Tempered',power:Math.round(3+level*2+r()*7),armor:Math.round(1+r()*5+level),level};}
export const distance=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.z-b.z);
export const ZONES=['Ember Refuge','The Soot March','Hollow Archive','The Orison Chamber'];
export class Game {
 seed=7319; random=rng(this.seed); cls:HeroClass; name:string; zone=0; difficulty=0; completed=false; rescued=false; waypoint=false; gate=false;
 player={x:0,z:-7,hp:160,max:160,focus:100,level:1,xp:0,gold:0,dust:0,potions:5,charges:3,chargeTime:0,points:1,ranks:[0,0,0],weapon:8,armor:0};
 enemies:Enemy[]=[];effects:Effect[]=[];items:(Vec&{item:Item})[]=[];inventory:Item[]=[];equipped:Item|null=null;echo:(Vec&{gold:number})|null=null;
 target:Vec|null=null;attackTarget:number|null=null;aim:Vec={x:0,z:0}; cooldowns=[0,0,0,0];basicCd=0;hold=false;paused=false;dead=false;victory=false;time=0;kills=0;elapsed=0;notice='Welcome to Ember Refuge. Meet the flame, then take the northern gate.';noticeTime=7; serial=1;changed=()=>{}; sound:(s:string)=>void=()=>{}; pending:{at:number;point:Vec;index:number}[]=[]; townChannel=0;
 constructor(cls:HeroClass,name='Warden'){this.cls=cls;this.name=name;}
 effect(kind:string,p:Vec,radius=1,text?:string){this.effects.push({...p,id:this.serial++,kind,life:kind==='text'?1.2:.6,max:kind==='text'?1.2:.6,radius,text});}
 tell(s:string){this.notice=s;this.noticeTime=5;this.changed();}
 enter(zone:number){this.zone=zone;this.player.x=0;this.player.z=-10;this.target=null;this.attackTarget=null;this.enemies=[];this.items=[];this.effects=[];this.pending=[];this.victory=false;
 if(zone){const r=rng(this.seed+zone+this.difficulty*100);let id=1;const add=(kind:string,x:number,z:number,boss=false)=>{const max=(boss?(kind==='Orison Engine'?720:400):kind==='Bell Husk'?85:kind==='Grave Scribe'?48:55)*(1+this.difficulty*.6);this.enemies.push({id:id++,x,z,origin:{x,z},kind,hp:max,max,state:'Dormant',timer:0,cooldown:r(),angle:0,boss,phase:1});};
 if(zone<3){for(let i=0;i<3;i++){for(let j=0;j<3;j++)add(['Ash Crawler','Bell Husk','Grave Scribe'][(i+j)%3],(j-1)*3+(r()-.5)*2,-1+i*8+r()*2);} if(zone===1)add('The Toll-Keeper',0,24,true);else add('Archive Warden',0,24);}
 else add('Orison Engine',0,6,true);
 this.tell(zone===1?'THE SOOT MARCH · Activate the shrine. Defeat the Toll-Keeper.':zone===2?'HOLLOW ARCHIVE · Clear the vault and rescue the Artificer.':'ORISON ENGINE · Avoid the marked ground. Strike during recovery.');
 } else {this.player.hp=this.player.max;this.player.focus=100;this.player.potions=Math.max(5,this.player.potions);this.tell('EMBER REFUGE · Restored. Use the forge, or enter another expedition.');}this.changed();}
 command(p:Vec,enemy?:number){if(this.dead||this.paused)return;this.aim=p;this.attackTarget=enemy??null;this.target={x:Math.max(-12,Math.min(12,p.x)),z:Math.max(-13,Math.min(32,p.z))};this.effect('click',this.target,.45);}
 basic(e:Enemy){if(this.basicCd>0)return;this.basicCd=.5;const dmg=17+this.player.weapon+this.player.ranks[0]*5;this.hit(e,dmg);this.player.focus=Math.min(100,this.player.focus+9);this.effect(this.cls==='Cinder Vow'?'slash':'shot',e,1.2);this.sound('hit');}
 hit(e:Enemy,n:number){if(e.hp<=0)return;const crit=this.random()<.12;const damage=Math.round(n*(crit?1.7:1));e.hp-=damage;this.effect('text',e,crit?2:1,''+damage+(crit?'!':''));if(e.hp<=0){this.kills++;this.player.gold+=e.boss?100:9;this.player.xp+=e.boss?90:18;this.effect('death',e,e.boss?4:1.5);this.sound(e.boss?'victory':'kill');if(e.boss||this.random()>.55){this.items.push({x:e.x,z:e.z,item:loot(this.seed+this.kills*37,this.player.level,e.boss)});}
 if(e.kind==='The Toll-Keeper'){this.gate=true;this.tell('THE TOLL IS PAID · The Hollow Archive is open.');}
 if(e.kind==='Orison Engine'){this.completed=true;this.victory=true;this.tell('COVENANT FULFILLED · Collect your reward. Veteran is unlocked.');}
 while(this.player.xp>=this.player.level*65&&this.player.level<20){this.player.xp-=this.player.level*65;this.player.level++;this.player.points++;this.player.max+=12;this.player.hp=this.player.max;this.effect('heal',this.player,4);this.tell('LEVEL '+this.player.level+' · A new skill point awaits. [K]');}
 } }
 cast(i:number){if(this.paused||this.dead||!this.zone)return;const s=SKILLS[this.cls][i];if(this.cooldowns[i]>0)return;if(this.player.focus<s.cost){this.tell('Not enough Focus. Basic attacks restore Focus.');return;}this.player.focus-=s.cost;this.cooldowns[i]=s.cooldown;let point=s.targeting==='self'?{x:this.player.x,z:this.player.z}:{...this.aim};if(distance(point,this.player)>12){const a=Math.atan2(point.x-this.player.x,point.z-this.player.z);point={x:this.player.x+Math.sin(a)*12,z:this.player.z+Math.cos(a)*12};}if(i===1&&this.cls==='Cinder Vow'){this.player.x=point.x;this.player.z=point.z;this.target=null;}this.effect('cast',point,s.radius);this.pending.push({at:this.time+s.timing,point,index:i});this.sound('cast');this.changed();}
 evade(){if(this.player.charges<1||this.dead||this.paused)return;this.player.charges--;const dx=this.aim.x-this.player.x,dz=this.aim.z-this.player.z,d=Math.hypot(dx,dz)||1;this.player.x=Math.max(-12,Math.min(12,this.player.x+dx/d*4.5));this.player.z=Math.max(-13,Math.min(32,this.player.z+dz/d*4.5));this.target=null;this.effect('evade',this.player,2);this.sound('cast');}
 potion(){if(this.dead||this.paused||this.player.potions<=0||this.player.hp===this.player.max)return;this.player.potions--;this.player.hp=Math.min(this.player.max,this.player.hp+85);this.effect('heal',this.player,2);this.sound('heal');this.changed();}
 hurt(n:number,source:string){if(this.dead)return;this.player.hp=Math.max(0,this.player.hp-Math.max(1,n-this.player.armor*.4));this.townChannel=0;this.effect('hurt',this.player,1);this.sound('hurt');if(!this.player.hp){this.dead=true;const lost=Math.floor(this.player.gold*.1);this.player.gold-=lost;this.echo={x:this.player.x,z:this.player.z,gold:lost};this.tell('Felled by '+source+'. Your Echo holds '+lost+' gold.');}}
 respawn(){this.dead=false;this.player.hp=this.player.max;this.player.focus=100;this.player.potions=Math.max(3,this.player.potions);this.player.x=0;this.player.z=-10;this.target=null;for(const e of this.enemies){if(e.hp>0){e.x=e.origin.x;e.z=e.origin.z;e.state='Dormant';}}this.changed();}
 interact(){if(this.dead)return;const near=this.items.filter(v=>distance(v,this.player)<4);if(near.length){for(const v of near){if(this.inventory.length<24){this.inventory.push(v.item);this.items.splice(this.items.indexOf(v),1);this.tell(v.item.name+' acquired. [I] to compare and equip.');this.sound('loot');}else this.tell('Inventory full. Salvage at the refuge.');}return;}
 if(this.echo&&distance(this.echo,this.player)<3){this.player.gold+=this.echo.gold;this.echo=null;this.tell('Echo reclaimed.');return;}
 if(this.zone===0){this.enter(1);return;}
 if(this.zone===1&&!this.waypoint&&distance(this.player,{x:-7,z:9})<5){this.waypoint=true;this.player.hp=this.player.max;this.tell('ASHWAY ATTUNED · Health restored. [T] returns to the refuge.');return;}
 if(this.zone===2&&!this.rescued&&distance(this.player,{x:7,z:18})<5){this.rescued=true;this.tell('ARTIFICER RESCUED · The forge is available in Ember Refuge.');return;}
 if(this.player.z>26){if(this.zone===1&&this.gate)this.enter(2);else if(this.zone===2&&this.enemies.every(e=>e.hp<=0)&&this.rescued)this.enter(3);else this.tell(this.zone===1?'Defeat the Toll-Keeper to unseal this gate.':'Clear the vault and rescue the Artificer at the eastern cage.');}
 }
 equip(item:Item){if(this.equipped)this.inventory.push(this.equipped);this.inventory=this.inventory.filter(i=>i.id!==item.id);this.equipped=item;this.player.weapon=8+item.power;this.player.armor=item.armor;this.sound('loot');this.changed();}
 salvage(item:Item){if(this.zone!==0)return;this.inventory=this.inventory.filter(i=>i.id!==item.id);this.player.dust+=item.rarity==='Inscribed'?5:2;this.changed();}
 craft(){if(!this.rescued||this.zone||this.player.dust<5||this.player.gold<30||this.inventory.length>=24)return;this.player.dust-=5;this.player.gold-=30;const item=loot(this.seed+this.serial,this.player.level+2,true);item.id=-this.serial++;this.inventory.push(item);this.tell('Forged an Inscribed weapon. Open inventory to equip it.');}
 allocate(i:number){if(this.player.points>0){this.player.points--;this.player.ranks[i]++;this.changed();}}
 tick(dt:number){if(this.paused||this.dead)return;this.time+=dt;this.elapsed+=dt;this.noticeTime-=dt;this.basicCd=Math.max(0,this.basicCd-dt);this.cooldowns=this.cooldowns.map(x=>Math.max(0,x-dt));this.player.focus=Math.min(100,this.player.focus+dt*2);if(this.player.charges<3){this.player.chargeTime+=dt;if(this.player.chargeTime>=2.8){this.player.charges++;this.player.chargeTime=0;}}
 this.effects=this.effects.filter(e=>(e.life-=dt)>0);
 for(const p of this.pending.filter(p=>p.at<=this.time)){const s=SKILLS[this.cls][p.index];for(const e of this.enemies)if(e.hp>0&&distance(e,p.point)<s.radius){this.hit(e,(17+this.player.weapon)*s.coefficient*(1+this.player.ranks[1]*.15));if(!e.boss){e.state='Recover';e.timer=1.3;}}if(p.index===3)this.player.hp=Math.min(this.player.max,this.player.hp+35+this.player.ranks[2]*8);this.effect(p.index===3?'heal':'blast',p.point,s.radius);}this.pending=this.pending.filter(p=>p.at>this.time);
 if(this.townChannel>0){this.townChannel-=dt;if(this.townChannel<=0)this.enter(0);}
 const targetEnemy=this.enemies.find(e=>e.id===this.attackTarget&&e.hp>0);if(targetEnemy){const range=this.cls==='Cinder Vow'?2.4:10;if(distance(this.player,targetEnemy)<range){this.target=null;this.basic(targetEnemy);}else this.target={x:targetEnemy.x,z:targetEnemy.z};}
 if(this.target){const d=distance(this.target,this.player);if(d>.15){const step=Math.min(d,dt*4.6);this.player.x+=(this.target.x-this.player.x)/d*step;this.player.z+=(this.target.z-this.player.z)/d*step;}else this.target=null;}
 for(const e of this.enemies){if(e.hp<=0)continue;const d=distance(e,this.player);e.cooldown-=dt;e.phase=e.boss?(e.hp<e.max*.33?3:e.hp<e.max*.66?2:1):1;
 if(e.state==='Telegraph'){e.timer-=dt;if(e.timer<=0){const radius=e.boss?4+e.phase*.5:e.kind==='Grave Scribe'?2.5:2.4;const p=e.kind==='Grave Scribe'?e.origin:e;if(distance(this.player,p)<radius)this.hurt(e.boss?30+e.phase*4:12,e.kind);this.effect('enemyBlast',p,radius);e.state='Recover';e.timer=e.boss?1.5:1;}}
 else if(e.state==='Recover'){e.timer-=dt;if(e.timer<=0)e.state='Approach';}
 else if(d<(e.boss?15:10)){e.state='Approach';const range=e.kind==='Grave Scribe'?8:e.boss?4.3:1.8;if(d>range){const speed=(e.kind==='Ash Crawler'?2.7:e.boss?1.5:1.8)*dt;e.x+=(this.player.x-e.x)/d*speed;e.z+=(this.player.z-e.z)/d*speed;}else if(e.cooldown<=0){e.state='Telegraph';e.timer=e.boss?1.2:1;e.cooldown=e.boss?3.7-e.phase*.35:2.4;if(e.kind==='Grave Scribe')e.origin={x:this.player.x,z:this.player.z};this.sound('warn');}}
 }
 this.player.x=Math.max(-12,Math.min(12,this.player.x));this.player.z=Math.max(-13,Math.min(32,this.player.z));
 if(this.zone&&this.player.z>29)this.interact();
 }
 snapshot(){return {version:1,seed:this.seed,serial:this.serial,cls:this.cls,name:this.name,zone:this.zone,difficulty:this.difficulty,completed:this.completed,rescued:this.rescued,waypoint:this.waypoint,gate:this.gate,player:this.player,inventory:this.inventory,equipped:this.equipped,kills:this.kills};}
 static restore(data:ReturnType<Game['snapshot']>){if(data.version!==1)throw Error('Unsupported save version');const g=new Game(data.cls,data.name);Object.assign(g,data);g.enter(data.zone);g.player={...data.player,x:0,z:-10,hp:data.player.max};return g;}
}

