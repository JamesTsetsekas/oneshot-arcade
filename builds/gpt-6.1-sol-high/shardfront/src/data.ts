export type Kind='core'|'worker'|'scout'|'soldier'|'lancer'|'siege'|'bay'|'pylon'|'tap'|'tech'|'turret';
export type Faction='helix'|'verdant';
export type Def={name:string; organic:string; ore:number; flux:number; hp:number; time:number; supply:number; speed:number; range:number; damage:number; period:number; radius:number; building?:boolean; prereq?:Kind};
export const DATA:Record<Kind,Def>={
core:{name:'Core Relay',organic:'Heartgrove',ore:340,flux:0,hp:1600,time:260,supply:0,speed:0,range:10,damage:13,period:22,radius:3,building:true},
worker:{name:'Fabricator',organic:'Tender',ore:50,flux:0,hp:85,time:60,supply:1,speed:4,range:2,damage:3,period:22,radius:.55},
scout:{name:'Kestrel',organic:'Glimmerwing',ore:65,flux:0,hp:100,time:70,supply:1,speed:8,range:6,damage:4,period:18,radius:.65},
soldier:{name:'Bulwark',organic:'Thornling',ore:70,flux:0,hp:190,time:80,supply:2,speed:4.8,range:8,damage:16,period:20,radius:.75,prereq:'bay'},
lancer:{name:'Arc Lancer',organic:'Sporecaster',ore:100,flux:25,hp:230,time:110,supply:3,speed:3.8,range:11,damage:34,period:30,radius:.85,prereq:'tech'},
siege:{name:'Mortar Crawler',organic:'Rift Stag',ore:160,flux:60,hp:280,time:145,supply:4,speed:3,range:15,damage:75,period:60,radius:1.1,prereq:'tech'},
bay:{name:'Assembly Bay',organic:'Brood Hollow',ore:150,flux:0,hp:650,time:160,supply:0,speed:0,range:0,damage:0,period:0,radius:2.4,building:true},
pylon:{name:'Grid Pylon',organic:'Root Node',ore:90,flux:0,hp:360,time:100,supply:0,speed:0,range:0,damage:0,period:0,radius:1.3,building:true},
tap:{name:'Flux Tap',organic:'Flux Tap',ore:100,flux:0,hp:420,time:130,supply:0,speed:0,range:0,damage:0,period:0,radius:1.5,building:true},
tech:{name:'Signal Foundry',organic:'Memory Bloom',ore:170,flux:40,hp:550,time:180,supply:0,speed:0,range:0,damage:0,period:0,radius:2,building:true,prereq:'bay'},
turret:{name:'Sentry Arc',organic:'Needle Pod',ore:120,flux:15,hp:500,time:140,supply:0,speed:0,range:12,damage:24,period:25,radius:1.2,building:true,prereq:'bay'}};
export const label=(k:Kind,f:Faction)=>f==='helix'?DATA[k].name:DATA[k].organic;
export const MAP={width:112,height:88,spawns:[{x:18,z:66},{x:94,z:22}],bridges:[22,44,66],vents:[{x:12,z:53},{x:100,z:35},{x:30,z:17},{x:82,z:71}],pylons:[{x:47,z:24},{x:65,z:64}]};
export function walkable(x:number,z:number){return x>3&&x<109&&z>3&&z<85&&!(x>52&&x<60&&!MAP.bridges.some(b=>Math.abs(z-b)<5));}

