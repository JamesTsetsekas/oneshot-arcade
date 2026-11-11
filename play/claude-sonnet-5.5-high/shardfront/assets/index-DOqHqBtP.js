(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();const cs="",ah=[{id:"fabricator",name:"Fabricator",faction:"helix",kind:"unit",role:"worker",desc:"Mines Prism Ore and Flux, raises structures and repairs mechanical targets. Emergency Weld restores structure HP over 4 s.",counter:"Fragile: raid it with fast units.",tags:["Light","Mechanical"],hp:45,armor:0,radius:.5,speed:3.2,sight:9,cost:{ore:50,flux:0},buildTime:12,supply:1,producedBy:"core_relay",worker:!0,weapon:{damage:5,period:1.5,range:1,targets:"ground",visual:"weld"},abilities:[{id:"weld",name:"Emergency Weld",hotkey:"q",target:"structure",cooldown:8,range:2.5,flux:20,desc:"Restores 60 structure HP over 4 s. Costs 20 Flux."}],model:"fabricator"},{id:"kestrel",name:"Kestrel",faction:"helix",kind:"unit",role:"scout",desc:"Fast wheeled scout with long sight and a light gun. Sensor Spike plants a short-lived vision beacon that enemies can see.",counter:"Dies to anything that can catch it.",tags:["Light","Mechanical"],hp:55,armor:0,radius:.55,speed:6,sight:16,cost:{ore:75,flux:25},buildTime:14,supply:1,producedBy:"assembly_bay",weapon:{damage:3,period:.8,range:5,targets:"both",projectileSpeed:40,visual:"rifle"},abilities:[{id:"spike",name:"Sensor Spike",hotkey:"q",target:"point",cooldown:30,range:12,radius:8,desc:"Plant a beacon granting vision (radius 8) for 14 s. Visible to enemies."}],model:"kestrel"},{id:"bulwark",name:"Bulwark",faction:"helix",kind:"unit",role:"basic",desc:"Basic rifle walker. Reliable against light targets. Brace for +2 range at the cost of movement.",counter:"Swarmed by melee Thornlings; slowed by Sporecasters.",tags:["Mechanical"],hp:120,armor:1,radius:.7,speed:3,sight:10,cost:{ore:100,flux:0},buildTime:18,supply:2,producedBy:"assembly_bay",weapon:{damage:9,period:1,range:6,windup:.15,projectileSpeed:34,bonus:{Light:4},targets:"both",visual:"rifle"},abilities:[{id:"brace",name:"Brace",hotkey:"q",target:"toggle",cooldown:1,desc:"Toggle: +2 range, cannot move while braced."}],model:"bulwark"},{id:"arc_lancer",name:"Arc Lancer",faction:"helix",kind:"unit",role:"antiarmor",desc:"Slow anti-armor walker. Its lance overpenetrates one light unit behind the target.",counter:"Countered by fast light swarms.",tags:["Armored","Mechanical"],hp:105,armor:1,radius:.75,speed:2.7,sight:10,cost:{ore:125,flux:50},buildTime:24,supply:2,producedBy:"assembly_bay",requires:["signal_foundry"],weapon:{damage:24,period:1.7,range:7,windup:.3,projectileSpeed:45,bonus:{Armored:16},pierce:!0,targets:"ground",visual:"lance"},model:"arc_lancer"},{id:"mender_rig",name:"Mender Rig",faction:"helix",kind:"unit",role:"support",desc:"Support drone vehicle. Repairs nearby mechanical units using Flux charge; cannot attack.",counter:"Focus it first.",tags:["Mechanical"],hp:80,armor:0,radius:.65,speed:3.4,sight:10,energy:100,cost:{ore:75,flux:50},buildTime:20,supply:2,producedBy:"assembly_bay",requires:["signal_foundry"],model:"mender_rig"},{id:"mortar_crawler",name:"Mortar Crawler",faction:"helix",kind:"unit",role:"siege",desc:"Siege unit with minimum range, setup time and a visible shell arc. Excellent against structures.",counter:"Defenseless up close: flank it.",tags:["Armored","Mechanical"],hp:95,armor:0,radius:.8,speed:2.4,sight:10,cost:{ore:150,flux:75},buildTime:30,supply:3,producedBy:"assembly_bay",requires:["signal_foundry"],weapon:{damage:40,period:3.2,range:17,minRange:5,windup:.3,projectileSpeed:13,splash:2.2,bonus:{Structure:28},setup:1.5,targets:"ground",visual:"mortar"},model:"mortar_crawler"},{id:"aegis_frame",name:"Aegis Frame",faction:"helix",kind:"unit",role:"heavy",desc:"Late heavy walker. A directional shield blocks up to 160 frontal projectile damage and recharges out of combat.",counter:"Flank it; Arc Lancers pierce its armor.",tags:["Armored","Massive","Mechanical"],hp:400,armor:3,radius:.95,speed:2.4,sight:10,shield:160,cost:{ore:250,flux:125},buildTime:40,supply:5,producedBy:"assembly_bay",requires:["signal_foundry","heavy_chassis"],weapon:{damage:20,period:1.4,range:6.5,windup:.2,projectileSpeed:30,targets:"both",visual:"rifle"},model:"aegis_frame"}],oh=[{id:"core_relay",name:"Core Relay",faction:"helix",kind:"structure",role:"hall",desc:"Headquarters and resource drop-off. Trains Fabricators. Lose every Core Relay and the match is lost.",counter:cs,tags:["Structure","Armored"],hp:1500,armor:2,radius:2.5,speed:0,sight:13,cost:{ore:400,flux:0},buildTime:70,supply:0,supplyProvided:10,size:5,isHall:!0,field:15,produces:["fabricator"],model:"core_relay"},{id:"grid_pylon",name:"Grid Pylon",faction:"helix",kind:"structure",role:"supply",desc:"Provides 8 supply and a construction field of radius 10.",counter:cs,tags:["Structure","Armored"],hp:350,armor:1,radius:1,speed:0,sight:8,cost:{ore:100,flux:0},buildTime:20,supply:0,supplyProvided:8,size:2,field:10,model:"grid_pylon"},{id:"assembly_bay",name:"Assembly Bay",faction:"helix",kind:"structure",role:"production",desc:"Basic unit production: Kestrels, Bulwarks; advanced units once a Signal Foundry stands.",counter:cs,tags:["Structure","Armored"],hp:650,armor:1,radius:1.5,speed:0,sight:9,cost:{ore:150,flux:0},buildTime:35,supply:0,size:3,produces:["kestrel","bulwark","arc_lancer","mender_rig","mortar_crawler","aegis_frame"],model:"assembly_bay"},{id:"signal_foundry",name:"Signal Foundry",faction:"helix",kind:"structure",role:"tech",desc:"Advanced technology and upgrades. Unlocks Arc Lancers, Mender Rigs and Mortar Crawlers.",counter:cs,tags:["Structure","Armored"],hp:700,armor:1,radius:1.5,speed:0,sight:9,cost:{ore:150,flux:100},buildTime:45,supply:0,size:3,requires:["assembly_bay"],researches:["piercing_rounds_1","piercing_rounds_2","piercing_rounds_3","plate_lamination_1","plate_lamination_2","plate_lamination_3","heavy_chassis"],model:"signal_foundry"},{id:"flux_tap",name:"Flux Tap",faction:"helix",kind:"structure",role:"tap",desc:"Extracts Flux from a vent. Fabricators haul the Flux back to a Core Relay.",counter:cs,tags:["Structure","Armored"],hp:450,armor:1,radius:1.5,speed:0,sight:7,cost:{ore:75,flux:0},buildTime:25,supply:0,size:3,onVent:!0,model:"flux_tap"},{id:"sentry_arc",name:"Sentry Arc",faction:"helix",kind:"structure",role:"defense",desc:"Short-range defense turret. Fires only inside its visible forward cone.",counter:"Outrange it with Mortar Crawlers or flank it.",tags:["Structure","Armored"],hp:450,armor:1,radius:1,speed:0,sight:10,cost:{ore:125,flux:0},buildTime:28,supply:0,size:2,requires:["assembly_bay"],turret:!0,weapon:{damage:11,period:.9,range:8.5,targets:"both",cone:.95,visual:"arc",projectileSpeed:0},model:"sentry_arc"}],cc=[...[1,2,3].map(i=>({id:`piercing_rounds_${i}`,name:`Piercing Rounds ${"I".repeat(i)}`,desc:"+8% damage for all Directorate weapons.",faction:"helix",cost:{ore:75+75*i,flux:75+50*i},time:30+20*i,at:"signal_foundry",requires:i>1?[`piercing_rounds_${i-1}`]:[],effect:{kind:"attack",amount:.08}})),...[1,2,3].map(i=>({id:`plate_lamination_${i}`,name:`Plate Lamination ${"I".repeat(i)}`,desc:"+1 armor for all Directorate units.",faction:"helix",cost:{ore:75+75*i,flux:75+50*i},time:30+20*i,at:"signal_foundry",requires:i>1?[`plate_lamination_${i-1}`]:[],effect:{kind:"armor",amount:1}})),{id:"heavy_chassis",name:"Heavy Chassis",desc:"Unlocks the Aegis Frame.",faction:"helix",cost:{ore:150,flux:150},time:50,at:"signal_foundry",effect:{kind:"unlock",amount:1,key:"heavy_chassis"}}],lh={id:"helix",name:"Helix Directorate",tagline:"Durable firing lines. Positional setup.",blurb:"Industrial expeditionaries with modular walkers and field engineering. Fabricators must stay at the work site to build, but every unit is sturdy and structures can be repaired. Win by holding ground with braced rifles, lances and shelling.",accent:"#ffb347",buildMode:"attend",buildTimeMult:1,worker:"fabricator",scout:"kestrel",hall:"core_relay",supply:"grid_pylon",tap:"flux_tap",defense:"sentry_arc",basicProd:"assembly_bay",tech:"signal_foundry",units:["fabricator","kestrel","bulwark","arc_lancer","mender_rig","mortar_crawler","aegis_frame"],structures:["core_relay","grid_pylon","assembly_bay","signal_foundry","flux_tap","sentry_arc"],upgrades:cc.map(i=>i.id),traits:["Fabricators stay on site until construction finishes","Workers repair structures and mechanical units","Sturdier units, higher cost per supply"],composition:[{id:"bulwark",weight:5},{id:"arc_lancer",weight:2.5},{id:"mortar_crawler",weight:1.2},{id:"mender_rig",weight:.8},{id:"aegis_frame",weight:1.5},{id:"kestrel",weight:.3}]},hs="",ch=[{id:"tender",name:"Tender",faction:"verdant",kind:"unit",role:"worker",desc:"Harvests and germinates structures: plant a seed and it grows on its own. Rootstep jumps to another friendly grove.",counter:"Fragile: raid it with fast units.",tags:["Light","Biological"],hp:40,armor:0,radius:.5,speed:3.4,sight:9,cost:{ore:50,flux:0},buildTime:12,supply:1,producedBy:"heartgrove",worker:!0,weapon:{damage:4,period:1.4,range:1,targets:"ground",visual:"claw"},abilities:[{id:"rootstep",name:"Rootstep",hotkey:"q",target:"grove",cooldown:25,range:999,desc:"Channel 1 s, then emerge at another friendly Heartgrove or Root Node."}],model:"tender"},{id:"glimmerwing",name:"Glimmerwing",faction:"verdant",kind:"unit",role:"scout",desc:"Hovering scout with excellent sight and no attack. Ignores terrain, and ground-only weapons cannot hit it.",counter:"Needle Pods and Bulwarks shoot it down.",tags:["Light","Biological","Hover"],hp:45,armor:0,radius:.55,speed:6.5,sight:17,cost:{ore:75,flux:25},buildTime:14,supply:1,producedBy:"brood_hollow",hover:!0,model:"glimmerwing"},{id:"thornling",name:"Thornling",faction:"verdant",kind:"unit",role:"basic",desc:"Cheap melee screen. Gains speed near damaged enemies.",counter:"Splash damage and ranged kiting.",tags:["Light","Biological"],hp:62,armor:0,radius:.5,speed:4,sight:9,cost:{ore:50,flux:0},buildTime:12,supply:1,producedBy:"brood_hollow",weapon:{damage:9,period:.8,range:1.1,windup:.1,targets:"ground",visual:"thorn"},model:"thornling"},{id:"sporecaster",name:"Sporecaster",faction:"verdant",kind:"unit",role:"ranged",desc:"Ranged skirmisher. Its spores apply a short, non-stacking slow.",counter:"Dives from fast melee units.",tags:["Light","Biological"],hp:70,armor:0,radius:.6,speed:3.3,sight:10,cost:{ore:90,flux:25},buildTime:20,supply:2,producedBy:"brood_hollow",weapon:{damage:9,period:1.3,range:7.5,windup:.2,projectileSpeed:20,slow:{factor:.7,duration:1.5},targets:"both",visual:"spore"},model:"sporecaster"},{id:"carapace_guard",name:"Carapace Guard",faction:"verdant",kind:"unit",role:"antiarmor",desc:"Anti-ranged tank. Curl up to halve ranged damage, but it cannot move or attack while curled.",counter:"Armor-piercing lances and siege.",tags:["Armored","Biological"],hp:250,armor:2,radius:.8,speed:2.9,sight:10,cost:{ore:125,flux:25},buildTime:24,supply:2,producedBy:"brood_hollow",requires:["memory_bloom"],weapon:{damage:12,period:1.2,range:1.4,windup:.15,bonus:{Mechanical:6},targets:"ground",visual:"claw"},abilities:[{id:"curl",name:"Curl",hotkey:"q",target:"toggle",cooldown:1,desc:"Toggle: -50% ranged damage taken; immobile and unarmed."}],model:"carapace_guard"},{id:"bloom_sage",name:"Bloom Sage",faction:"verdant",kind:"unit",role:"support",desc:"Support caster. Mend Spores heal Biological allies; Silence Patch telegraphs a zone that shuts down abilities.",counter:"Focus it first.",tags:["Light","Biological"],hp:80,armor:0,radius:.6,speed:3.3,sight:10,energy:100,cost:{ore:100,flux:75},buildTime:24,supply:2,producedBy:"brood_hollow",requires:["memory_bloom"],abilities:[{id:"silence",name:"Silence Patch",hotkey:"q",target:"point",cooldown:20,range:9,radius:3.2,energy:40,desc:"After a 1 s telegraph, silences enemy units in the patch for 5 s."}],model:"bloom_sage"},{id:"rift_stag",name:"Rift Stag",faction:"verdant",kind:"unit",role:"siege",desc:"Mobile artillery that fires delayed ground eruptions. Weak if engaged.",counter:"Dive it; its eruptions are slow to land.",tags:["Biological"],hp:120,armor:0,radius:.85,speed:3.8,sight:10,cost:{ore:175,flux:100},buildTime:32,supply:3,producedBy:"brood_hollow",requires:["memory_bloom"],weapon:{damage:34,period:3,range:13,minRange:4,windup:.4,delayed:1.1,splash:2.4,bonus:{Structure:14},targets:"ground",visual:"stag"},model:"rift_stag"},{id:"crownbeast",name:"Crownbeast",faction:"verdant",kind:"unit",role:"heavy",desc:"Late assault beast that cleaves enemies and projects a regeneration aura to nearby Biological allies outside combat.",counter:"Kite it with ranged units.",tags:["Massive","Biological"],hp:480,armor:2,radius:1,speed:3,sight:10,cost:{ore:300,flux:150},buildTime:44,supply:6,producedBy:"brood_hollow",requires:["memory_bloom","crown_rites"],weapon:{damage:30,period:1.6,range:1.8,windup:.3,splash:1.6,targets:"ground",visual:"beast"},model:"crownbeast"}],hh=[{id:"heartgrove",name:"Heartgrove",faction:"verdant",kind:"structure",role:"hall",desc:"Headquarters and resource drop-off. Grows Tenders. Lose every Heartgrove and the match is lost.",counter:hs,tags:["Structure","Armored","Biological"],hp:1400,armor:1,radius:2.5,speed:0,sight:13,regen:.6,cost:{ore:400,flux:0},buildTime:70,supply:0,supplyProvided:10,size:5,isHall:!0,field:15,produces:["tender"],model:"heartgrove"},{id:"root_node",name:"Root Node",faction:"verdant",kind:"structure",role:"supply",desc:"Provides 8 supply and extends the living build zone (radius 10).",counter:hs,tags:["Structure","Biological"],hp:300,armor:1,radius:1,speed:0,sight:8,regen:.6,cost:{ore:75,flux:0},buildTime:18,supply:0,supplyProvided:8,size:2,field:10,model:"root_node"},{id:"brood_hollow",name:"Brood Hollow",faction:"verdant",kind:"structure",role:"production",desc:"Grows Glimmerwings, Thornlings and Sporecasters; advanced units once a Memory Bloom flowers.",counter:hs,tags:["Structure","Armored","Biological"],hp:550,armor:1,radius:1.5,speed:0,sight:9,regen:.6,cost:{ore:150,flux:0},buildTime:32,supply:0,size:3,produces:["thornling","glimmerwing","sporecaster","carapace_guard","bloom_sage","rift_stag","crownbeast"],model:"brood_hollow"},{id:"memory_bloom",name:"Memory Bloom",faction:"verdant",kind:"structure",role:"tech",desc:"Technology and upgrades. Unlocks Carapace Guards, Bloom Sages and Rift Stags.",counter:hs,tags:["Structure","Armored","Biological"],hp:600,armor:1,radius:1.5,speed:0,sight:9,regen:.6,cost:{ore:150,flux:100},buildTime:40,supply:0,size:3,requires:["brood_hollow"],researches:["barbed_growth_1","barbed_growth_2","barbed_growth_3","chitin_layers_1","chitin_layers_2","chitin_layers_3","crown_rites"],model:"memory_bloom"},{id:"flux_tap_v",name:"Flux Tap",faction:"verdant",kind:"structure",role:"tap",desc:"A grown siphon that extracts Flux from a vent. Tenders haul the Flux back to a Heartgrove.",counter:hs,tags:["Structure","Biological"],hp:400,armor:1,radius:1.5,speed:0,sight:7,regen:.6,cost:{ore:75,flux:0},buildTime:25,supply:0,size:3,onVent:!0,model:"flux_tap_v"},{id:"needle_pod",name:"Needle Pod",faction:"verdant",kind:"structure",role:"defense",desc:"Defensive pod that prioritises hovering scouts, then the closest threat.",counter:"Outrange it with Rift Stags and siege.",tags:["Structure","Biological"],hp:380,armor:1,radius:1,speed:0,sight:10,regen:.6,cost:{ore:100,flux:0},buildTime:24,supply:0,size:2,requires:["brood_hollow"],turret:!0,weapon:{damage:9,period:.7,range:9,targets:"both",hoverFirst:!0,projectileSpeed:36,visual:"needle"},model:"needle_pod"}],hc=[...[1,2,3].map(i=>({id:`barbed_growth_${i}`,name:`Barbed Growth ${"I".repeat(i)}`,desc:"+8% damage for all Chorus weapons.",faction:"verdant",cost:{ore:75+75*i,flux:75+50*i},time:30+20*i,at:"memory_bloom",requires:i>1?[`barbed_growth_${i-1}`]:[],effect:{kind:"attack",amount:.08}})),...[1,2,3].map(i=>({id:`chitin_layers_${i}`,name:`Chitin Layers ${"I".repeat(i)}`,desc:"+1 armor for all Chorus units.",faction:"verdant",cost:{ore:75+75*i,flux:75+50*i},time:30+20*i,at:"memory_bloom",requires:i>1?[`chitin_layers_${i-1}`]:[],effect:{kind:"armor",amount:1}})),{id:"crown_rites",name:"Crown Rites",desc:"Unlocks the Crownbeast.",faction:"verdant",cost:{ore:150,flux:150},time:50,at:"memory_bloom",effect:{kind:"unlock",amount:1,key:"crown_rites"}}],uh={id:"verdant",name:"Verdant Chorus",tagline:"Mobility. Regeneration. Encirclement.",blurb:"A bio-synthetic ecology grown from seed organisms. Tenders plant structures that then grow on their own, so workers stay productive. Cheaper, faster, more fragile units that regenerate; win by surrounding and overwhelming.",accent:"#b57bff",buildMode:"seed",buildTimeMult:1.1,worker:"tender",scout:"glimmerwing",hall:"heartgrove",supply:"root_node",tap:"flux_tap_v",defense:"needle_pod",basicProd:"brood_hollow",tech:"memory_bloom",units:["tender","glimmerwing","thornling","sporecaster","carapace_guard","bloom_sage","rift_stag","crownbeast"],structures:["heartgrove","root_node","brood_hollow","memory_bloom","flux_tap_v","needle_pod"],upgrades:hc.map(i=>i.id),traits:["Structures grow on their own once seeded: Tenders are freed at once","Units and structures regenerate out of combat","Cheaper, faster, more fragile units"],composition:[{id:"thornling",weight:4},{id:"sporecaster",weight:3},{id:"carapace_guard",weight:2},{id:"rift_stag",weight:1.2},{id:"bloom_sage",weight:.7},{id:"crownbeast",weight:1.5},{id:"glimmerwing",weight:.3}]},Ms=20,gi=i=>Math.max(1,Math.round(i*Ms)),us=(i,t,e,n)=>({id:i,name:t,faction:"neutral",kind:"neutral",role:i,desc:e,counter:"",tags:["Structure"],hp:1,armor:0,radius:1,speed:0,sight:0,cost:{ore:0,flux:0},buildTime:0,supply:0,model:i,...n}),dh=[us("ore_seam","Prism Ore Seam","Finite crystal seam of Prism Ore.",{size:2,radius:1}),us("flux_vent","Flux Vent","Energy vent. Build a Flux Tap on it to extract Flux.",{size:3,radius:1.5}),us("watch_pylon","Watch Pylon","Channel 3 seconds to capture; grants vision over a route until contested.",{size:2,radius:1,sight:15,hp:400,tags:["Structure","Armored"]}),us("salvage_pod","Salvage Pod","One-time fixed resource bundle (100 Ore, 40 Flux).",{size:1,radius:.6}),us("crystal_barrier","Crystal Barrier","Destructible crystal formation blocking a shortcut.",{size:3,radius:1.5,hp:900,armor:2,tags:["Structure","Armored"]})],Ss={helix:lh,verdant:uh},ze=[...cc,...hc],oe=[...ah,...oh,...ch,...hh,...dh],pt=Object.fromEntries(oe.map((i,t)=>[i.id,t])),zn=i=>{const t=oe[pt[i]];if(!t)throw new Error("unknown def "+i);return t},Oo=Object.fromEntries(ze.map(i=>[i.id,i])),Rn=Object.fromEntries(ze.map((i,t)=>[i.id,t]));function fh(){const i=[],t=new Set;for(const e of oe){if(t.has(e.id)&&i.push(`duplicate id ${e.id}`),t.add(e.id),e.hp>0||i.push(`${e.id}: hp`),e.kind==="unit"&&!(e.speed>0)&&i.push(`${e.id}: speed`),e.kind==="structure"&&!e.size&&i.push(`${e.id}: size`),e.weapon){const n=e.weapon;n.damage>0&&n.period>0&&n.range>0||i.push(`${e.id}: weapon numbers`)}for(const n of e.requires??[])!(n in pt)&&!(n in Oo)&&i.push(`${e.id}: requires unknown ${n}`);e.producedBy&&!(e.producedBy in pt)&&i.push(`${e.id}: producedBy unknown ${e.producedBy}`);for(const n of e.produces??[])n in pt||i.push(`${e.id}: produces unknown ${n}`);for(const n of e.researches??[])n in Oo||i.push(`${e.id}: researches unknown ${n}`)}for(const e of Object.values(Ss)){for(const n of[e.worker,e.scout,e.hall,e.supply,e.tap,e.defense,e.basicProd,e.tech,...e.units,...e.structures])n in pt||i.push(`${e.id}: unknown ${n}`);for(const n of[...e.units,...e.structures])zn(n).faction!==e.id&&i.push(`${e.id}: ${n} wrong faction`);for(const n of e.units){const s=zn(n);!s.producedBy||!e.structures.includes(s.producedBy)?i.push(`${n}: no producer`):zn(s.producedBy).produces?.includes(n)||i.push(`${n}: producer does not list it`)}}return i}class ph{orders=[];gkey=-1;stuck=0;lastD=1e9;chk=0;dirx=0;diry=0;failTick=-99999;moving=!1;los=!1;losAge=99;homeX=0;homeY=0;walkPhase=0;slotX=0;slotY=0;hasSlot=!1;target=-1;cd=0;wind=0;deploy=0;lastHit=-99999;lastAtk=-99999;lastAttacker=-1;acq=0;mode=0;shield=0;slowUntil=0;slowF=1;silUntil=0;energy=0;cds=[0,0,0,0];carry=0;carryT=0;wph=0;gT=0;node=-1;prevNode=-1;waitT=0;repT=0;prog=0;total=0;done=!0;q=[];rallyX=0;rallyY=0;rallyT=-1;hasRally=!1;builder=-1;ox=0;oy=0;fw=0;fh=0;upgrading="";amount=0;res=-1;maxAmount=0;capT=0;capOwner=-1;chT=0;chTotal=0;chKind=0;chX=0;chY=0;chTarget=-1;weldLeft=0;weldRate=0;born=0;atkTick=-99999;castTick=-99999;turn=0}const F=oe.map((i,t)=>({idx:t,def:i,speed:i.speed/20,periodT:i.weapon?gi(i.weapon.period):0,windT:i.weapon?.windup?gi(i.weapon.windup):0,setupT:i.weapon?.setup?gi(i.weapon.setup):0,buildT:gi(i.buildTime),delayT:i.weapon?.delayed?gi(i.weapon.delayed):0,isUnit:i.kind==="unit",isStruct:i.kind==="structure",isNeutral:i.kind==="neutral",w:i.size??1,h:i.size??1,canAttack:!!i.weapon,isHall:!!i.isHall,isWorker:!!i.worker,isHover:!!i.hover,maxHp:i.hp,maxEnergy:i.energy??0,heal:i.id==="mender_rig"||i.id==="bloom_sage"?12/20:0,healTag:i.id==="mender_rig"?"Mechanical":i.id==="bloom_sage"?"Biological":""})),Le=144,vs=3,ke=Le/vs;function Bo(i,t){let e=i*374761393+t*668265263|0;return e=(e^e>>>13)*1274126177,e^=e>>>16,(e>>>0)%1e4/1e4}const mh=(i,t)=>{const e=Bo(i,t),n=Bo(Le-1-i,Le-1-t);return i+t*Le<=Le-1-i+(Le-1-t)*Le?e:n};function gh(){const i=Array.from({length:ke},()=>Array(ke).fill(".")),t=(s,r,a)=>{s<0||r<0||s>=ke||r>=ke||(i[s][r]=a,i[ke-1-s][ke-1-r]=a)},e=(s,r,a,o,l)=>{for(let c=s;c<=r;c++)for(let u=a;u<=o;u++)t(c,u,l)},n=(s,r,a,o)=>{for(let l=Math.floor(s-a);l<=Math.ceil(s+a);l++)for(let c=Math.floor(r-a);c<=Math.ceil(r+a);c++)(l-s)**2+(c-r)**2<=a*a&&t(l,c,o)};for(let s=0;s<ke;s++)t(0,s,"#"),t(s,0,"#"),t(s,ke-1,"#"),t(ke-1,s,"#");for(let s=1;s<ke-1;s++)for(let r=Math.max(1,s-2);r<=Math.min(ke-2,s+2);r++)t(s,r,":");return e(1,3,1,3,"#"),n(23.5,23.5,4.3,"o"),e(1,12,33,46,"^"),e(13,14,37,40,"r"),e(14,25,33,34,"#"),e(18,19,33,34,"."),e(25,26,35,46,"#"),e(25,26,40,41,"."),e(25,26,45,45,"c"),e(20,22,27,28,"r"),e(13,14,9,18,"b"),n(10,26,1.3,"#"),n(18,15,1.2,"#"),n(27,36,1.4,"#"),n(5,12,1.2,"#"),n(16,23,1.8,","),n(9,17,1.8,","),n(22,33,1.6,","),n(7,29,1.5,","),i}const Ur=i=>{switch(i){case".":case",":case"b":case"c":return 1;case"^":return 2;case"o":return 0;default:return null}};function Xn(i,t){const e=new Float32Array(t*t);for(let n=0;n<t;n++)for(let s=0;s<t;s++){let r=0,a=0;for(let o=-1;o<=1;o++)for(let l=-1;l<=1;l++){const c=s+l,u=n+o;c<0||u<0||c>=t||u>=t||(r+=i[u*t+c],a++)}e[n*t+s]=r/a}return e}const hn=i=>Le-i,xh=i=>({x:hn(i.x+i.w),y:hn(i.y+i.h),w:i.w,h:i.h});function zo(i,t,e,n,s,r){const a=[];for(let o=0;o<r;o++){const l=r===1?.5:o/(r-1),c=(n+(s-n)*l)*Math.PI/180;a.push({x:i+Math.cos(c)*e,y:t+Math.sin(c)*e})}return a}function uc(){const i=gh(),t=Le,e=(B,ot)=>B<0||ot<0||B>=ke||ot>=ke?"#":i[B][ot],n=i.map(B=>B.slice());for(let B=0;B<ke;B++)for(let ot=0;ot<ke;ot++){const ht=Ur(i[B][ot]);if(ht===null)continue;let z=!1;for(let K=-1;K<=1&&!z;K++)for(let lt=-1;lt<=1;lt++){if(!K&&!lt)continue;const it=Ur(e(B+K,ot+lt));if(it!==null&&it<ht){z=!0;break}}if(z){let K=!1;for(const[lt,it]of[[1,0],[-1,0],[0,1],[0,-1]])e(B+lt,ot+it)==="r"&&(K=!0);K||(n[B][ot]="x")}}const s=(B,ot)=>n[Math.floor(ot/vs)][Math.floor(B/vs)],r=new Float32Array(t*t),a=new Float32Array(t*t),o=new Float32Array(t*t),l=new Float32Array(t*t),c=(B,ot)=>{switch(i[B][ot]){case"^":return 3;case"o":return-1.6;case":":return-6.5;case"#":return 5.5;case"r":{let z=0,K=0;for(const[lt,it]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const wt=B+lt,Pt=ot+it;if(wt<0||Pt<0||wt>=ke||Pt>=ke)continue;const st=Ur(i[wt][Pt]);st!==null&&(z+=st===2?3:st===0?-1.6:0,K++)}return K?z/K:0}default:return 0}},u=new Uint8Array(t*t),f=new Uint8Array(t*t);for(let B=0;B<t;B++)for(let ot=0;ot<t;ot++){const ht=s(ot,B),z=B*t+ot;r[z]=ht==="#"||ht==="x"?1:0,a[z]=ht===":"?1:0,o[z]=ht===","?1:0,l[z]=c(Math.floor(B/vs),Math.floor(ot/vs)),ht==="b"&&(u[z]=1),ht==="r"&&(f[z]=1)}const h=Xn(Xn(r,t),t),d=Xn(Xn(a,t),t),m=Xn(Xn(o,t),t),x=Xn(Xn(l,t),t),g=new Uint8Array(t*t),p=new Uint8Array(t*t),_=new Uint8Array(t*t),y=new Uint8Array(t*t),v=new Uint8Array(t*t),A=new Uint8Array(t*t);for(let B=0;B<t;B++)for(let ot=0;ot<t;ot++){const ht=B*t+ot,z=(mh(ot,B)-.5)*.16;let K=h[ht]+z>.5?1:0,lt=d[ht]+z>.5?1:0;u[ht]&&(K=0,lt=0,y[ht]=1),f[ht]&&(K=0,lt=0,v[ht]=1),(ot<2||B<2||ot>=t-2||B>=t-2)&&(K=1),g[ht]=K||0,p[ht]=!K&&lt?1:0,!K&&!lt&&m[ht]>.5&&(_[ht]=1),A[ht]=g[ht]?1:p[ht]?2:y[ht]?4:v[ht]?5:_[ht]?3:0}const R=new Float32Array((t+1)*(t+1));for(let B=0;B<=t;B++)for(let ot=0;ot<=t;ot++){let ht=0,z=0;for(let K=-1;K<=0;K++)for(let lt=-1;lt<=0;lt++){const it=ot+lt,wt=B+K;it<0||wt<0||it>=t||wt>=t||(ht+=x[wt*t+it],z++)}R[B*(t+1)+ot]=z?ht/z:0}const w=[],E=[],M=(B,ot,ht,z,K,lt,it,wt,Pt)=>{w.push({id:B,kind:ot,x:ht,y:z,start:it});for(const st of zo(ht,z,7.6,K[0],K[1],K[2]))E.push({kind:"ore",x:Math.round(st.x-1)+1,y:Math.round(st.y-1)+1,w:2,h:2,amount:wt,site:B});for(const[st,Lt]of lt){const Ut=st*Math.PI/180,ge=Math.round(ht+Math.cos(Ut)*Lt-1.5),I=Math.round(z+Math.sin(Ut)*Lt-1.5);E.push({kind:"vent",x:ge+1.5,y:I+1.5,w:3,h:3,amount:Pt,site:B})}},b=(B,ot,ht)=>({...B,id:ot,x:hn(B.x),y:hn(B.y),start:ht}),P=[["p1_main","main",122,18,[-190,10,7],[[-140,12.5],[-40,12.5]],1,1500,2200],["p1_nat","natural",123,60,[-110,50,6],[[-155,11.5],[80,11.5]],1,1500,2200],["p1_side","side",73,19,[-200,10,6],[[160,12],[30,12]],1,1200,1800]],D=E.length;for(const B of P)M(B[0],B[1],B[2],B[3],B[4],B[5],B[6],B[7],B[8]);const N=E.slice(D),$=w.slice();for(const B of $)w.push(b(B,B.id.replace("p1","p0"),B.start===1?0:-1));for(const B of N)E.push({...B,x:hn(B.x),y:hn(B.y),site:B.site.replace("p1","p0")});const j=Le/2,X=zo(j,j,6.2,-100,80,4).map(B=>({kind:"ore",x:Math.round(B.x-1)+1,y:Math.round(B.y-1)+1,w:2,h:2,amount:260,site:"centre"}));for(const B of X)E.push(B),E.push({...B,x:hn(B.x),y:hn(B.y)});const q=[];for(const B of[{x:17.5,y:52.5}])q.push(B),q.push({x:hn(B.x),y:hn(B.y)});const G=[];for(const B of[{x:68.5,y:34.5},{x:48.5,y:84.5}])G.push(B),G.push({x:hn(B.x),y:hn(B.y)});const nt=[];for(const B of[{x:135,y:75,w:3,h:3},{x:135,y:78,w:3,h:3}])nt.push(B),nt.push(xh(B));return{size:t,blocked:g,chasm:p,brush:_,bridge:y,ramp:v,heightC:x,heightV:R,starts:[{x:21.5,y:125.5},{x:122.5,y:18.5}],sites:w,resources:E,pylons:q,pods:G,barriers:nt,surface:A}}function Ft(i,t,e){const n=i.size,s=Math.min(Math.max(t,0),n-1e-4),r=Math.min(Math.max(e,0),n-1e-4),a=Math.floor(s),o=Math.floor(r),l=s-a,c=r-o,u=n+1,f=i.heightV[o*u+a],h=i.heightV[o*u+a+1],d=i.heightV[(o+1)*u+a],m=i.heightV[(o+1)*u+a+1];let x=f*(1-l)*(1-c)+h*l*(1-c)+d*(1-l)*c+m*l*c;return i.bridge[o*n+a]&&(x=.25),x}const Dr=65535,oi=[[1,0,10],[-1,0,10],[0,1,10],[0,-1,10],[1,1,14],[-1,1,14],[1,-1,14],[-1,-1,14]];class yh{a=new Float64Array(1<<17);size=0;clear(){this.size=0}push(t){if(this.size>=this.a.length){const s=new Float64Array(this.a.length*2);s.set(this.a),this.a=s}const e=this.a;let n=this.size++;for(;n>0;){const s=n-1>>1;if(e[s]<=t)break;e[n]=e[s],n=s}e[n]=t}pop(){const t=this.a,e=t[0],n=t[--this.size],s=this.size;if(s>0){let r=0;for(;;){let a=2*r+1;if(a>=s||(a+1<s&&t[a+1]<t[a]&&a++,t[a]>=n))break;t[r]=t[a],r=a}t[r]=n}return e}}class vh{constructor(t){this.map=t,this.n=t.size,this.occ=new Uint8Array(this.n*this.n)}n;occ;version=1;fields=new Map;heap=new yh;budget=0;counter=0;walkable(t){return!this.map.blocked[t]&&!this.map.chasm[t]&&!this.occ[t]}walkableXY(t,e){return t<0||e<0||t>=this.n||e>=this.n?!1:this.walkable(Math.floor(e)*this.n+Math.floor(t))}staticWalkable(t){return!this.map.blocked[t]&&!this.map.chasm[t]}setFootprint(t,e,n,s,r){for(let a=e;a<e+s;a++)for(let o=t;o<t+n;o++){if(o<0||a<0||o>=this.n||a>=this.n)continue;const l=a*this.n+o;this.occ[l]=Math.max(0,this.occ[l]+r)}this.version++}fits(t,e,n){const s=Math.floor(t-n),r=Math.floor(t+n),a=Math.floor(e-n),o=Math.floor(e+n);for(let l=a;l<=o;l++)for(let c=s;c<=r;c++)if(c<0||l<0||c>=this.n||l>=this.n||!this.walkable(l*this.n+c))return!1;return!0}clear(t,e,n,s,r=.35){const a=n-t,o=s-e,l=Math.hypot(a,o),c=Math.ceil(l/.6);for(let u=1;u<=c;u++){const f=u/c;if(!this.fits(t+a*f,e+o*f,r))return!1}return!0}nearestWalkable(t,e,n=12){const s=Math.floor(t),r=Math.floor(e);if(this.walkableXY(t,e))return{x:t,y:e};for(let a=1;a<=n;a++){let o=null,l=1e9;for(let c=-a;c<=a;c++)for(let u=-a;u<=a;u++){if(Math.max(Math.abs(u),Math.abs(c))!==a)continue;const f=s+u,h=r+c;if(f<0||h<0||f>=this.n||h>=this.n||!this.walkable(h*this.n+f))continue;const d=(f+.5-t)**2+(h+.5-e)**2;d<l&&(l=d,o={x:f+.5,y:h+.5})}if(o)return o}return null}ringCells(t,e,n,s){const r=[];for(let a=e-1;a<=e+s;a++)for(let o=t-1;o<=t+n;o++){if(o>=t&&o<t+n&&a>=e&&a<e+s||o<0||a<0||o>=this.n||a>=this.n)continue;const l=a*this.n+o;this.walkable(l)&&r.push(l)}return r}getField(t,e){const n=this.fields.get(t);if(n&&n.ver===this.version)return n.used=++this.counter,n;if(this.budget<=0)return n??null;this.budget--;const s=e();if(s.length===0)return null;const r=this.compute(s);if(r.used=++this.counter,this.fields.set(t,r),this.fields.size>72){let a=-1,o=1/0;for(const[l,c]of this.fields)c.used<o&&(o=c.used,a=l);this.fields.delete(a)}return r}invalidate(t){this.fields.delete(t)}compute(t){const e=this.n,n=new Uint16Array(e*e).fill(Dr),s=this.heap;s.clear();for(const o of t)n[o]=0,s.push(o);const r=this.map,a=this.occ;for(;s.size;){const o=s.pop(),l=Math.floor(o/32768),c=o-l*32768;if(l>n[c])continue;const u=c%e,f=c/e|0;for(let h=0;h<8;h++){const d=oi[h][0],m=oi[h][1],x=u+d,g=f+m;if(x<0||g<0||x>=e||g>=e)continue;const p=g*e+x;if(r.blocked[p]||r.chasm[p]||a[p])continue;if(d!==0&&m!==0){const v=f*e+x,A=g*e+u;if(r.blocked[v]||r.chasm[v]||a[v]||r.blocked[A]||r.chasm[A]||a[A])continue}let _=0;x>0&&(r.blocked[p-1]||r.chasm[p-1]||a[p-1])&&(_+=3),x<e-1&&(r.blocked[p+1]||r.chasm[p+1]||a[p+1])&&(_+=3),g>0&&(r.blocked[p-e]||r.chasm[p-e]||a[p-e])&&(_+=3),g<e-1&&(r.blocked[p+e]||r.chasm[p+e]||a[p+e])&&(_+=3);const y=l+oi[h][2]+_;y<n[p]&&(n[p]=y,s.push(y*32768+p))}}return{cost:n,ver:this.version,used:0}}dir(t,e,n,s){const r=this.n;let a=Math.min(r-1,Math.max(0,Math.floor(e))),o=Math.min(r-1,Math.max(0,Math.floor(n))),l=t.cost[o*r+a],c=e,u=n,f=!1;for(let x=0;x<3;x++){let g=l,p=a,_=o;for(let A=0;A<8;A++){const R=a+oi[A][0],w=o+oi[A][1];if(R<0||w<0||R>=r||w>=r)continue;const E=t.cost[w*r+R];if(E<g){if(oi[A][0]!==0&&oi[A][1]!==0&&(t.cost[o*r+R]>=Dr||t.cost[w*r+a]>=Dr))continue;g=E,p=R,_=w}}if(p===a&&_===o)break;const y=p+.5,v=_+.5;if(x>0&&!this.clear(e,n,y,v,.3))break;a=p,o=_,l=g,c=y,u=v,f=!0}if(!f)return!1;const h=c-e,d=u-n,m=Math.hypot(h,d)||1;return s.x=h/m,s.y=d/m,!0}}const Fe=2,Ho=1.6,Go=3,Vo=new Map;function _h(i){let t=Vo.get(i);if(t)return t;const e=[];for(let n=-i;n<=i;n++)for(let s=-i;s<=i;s++){const r=Math.hypot(s,n);r<=i+.5&&e.push([s,n,r])}return t={dx:Int16Array.from(e.map(n=>n[0])),dy:Int16Array.from(e.map(n=>n[1])),d:Float32Array.from(e.map(n=>n[2]))},Vo.set(i,t),t}function Wo(i,t,e,n,s,r=!1){const a=i.size,o=Math.min(a-1,Math.max(0,Math.floor(e))),l=Math.min(a-1,Math.max(0,Math.floor(n))),c=i.heightC[l*a+o],u=Math.round(s+(c>2?2:0)),f=_h(u);for(let h=0;h<f.dx.length;h++){const d=o+f.dx[h],m=l+f.dy[h];if(d<0||m<0||d>=a||m>=a)continue;const x=m*a+d;if(t[x]===Fe)continue;const g=f.d[h];if(g<=1.5||r){t[x]=Fe;continue}const p=i.heightC[x],_=!i.blocked[x]&&!i.chasm[x];if(i.brush[x]&&g>Go||_&&p-c>Ho&&g>2.5)continue;const y=Math.max(Math.abs(f.dx[h]),Math.abs(f.dy[h])),v=f.dx[h]/y,A=f.dy[h]/y,R=Math.max(c,p)+Ho;let w=!1;for(let E=1;E<y;E++){const M=Math.round(o+v*E),b=Math.round(l+A*E),P=b*a+M;if(i.heightC[P]>R){w=!0;break}if(i.brush[P]&&Math.hypot(M-o,b-l)>Go){w=!0;break}}w||(t[x]=Fe)}}function bh(i,t){for(let e=0;e<i.length;e++)i[e]===Fe&&(t[e]=1)}const mt={Move:0,AttackMove:1,Attack:2,Stop:3,Hold:4,Patrol:5,Gather:6,Build:7,Repair:8,Ability:9,Capture:10,Resume:11},Mh=1,Ir={x:0,y:0};function qi(i,t){let e=t-i;for(;e>Math.PI;)e-=Math.PI*2;for(;e<-Math.PI;)e+=Math.PI*2;return e}function ma(i,t){const e=F[i.type[t]],n=i.ext[t];let s=e.speed;return i.tick<n.slowUntil&&(s*=n.slowF),e.def.id==="thornling"&&n.target>=0&&i.alive[n.target]&&i.hp[n.target]<F[i.type[n.target]].maxHp&&(s*=1.25),n.mode>0&&(e.def.id==="bulwark"||e.def.id==="carapace_guard")&&(s=0),s}function Gn(i,t,e,n){const s=qi(i.face[t],e),r=Math.max(-n,Math.min(n,s));i.face[t]+=r,i.ext[t].turn=r,i.face[t]>Math.PI&&(i.face[t]-=Math.PI*2),i.face[t]<-Math.PI&&(i.face[t]+=Math.PI*2)}function ga(i,t,e,n){const s=F[i.type[t]],r=i.map.size;if(s.isHover)return i.x[t]=Math.min(r-2.5,Math.max(2.5,e)),i.y[t]=Math.min(r-2.5,Math.max(2.5,n)),!0;const a=Math.min(s.def.radius,.4),o=i.x[t],l=i.y[t];return i.nav.fits(e,n,a)?(i.x[t]=e,i.y[t]=n,!0):e!==o&&i.nav.fits(e,l,a)?(i.x[t]=e,!0):n!==l&&i.nav.fits(o,n,a)?(i.y[t]=n,!0):!1}function xa(i,t){if(F[i.type[t]].isHover||i.nav.fits(i.x[t],i.y[t],.2))return;const n=i.nav.nearestWalkable(i.x[t],i.y[t],14);n&&(i.x[t]=n.x,i.y[t]=n.y,i.px[t]=n.x,i.py[t]=n.y)}function pn(i,t,e,n,s,r,a){const o=i.ext[t],l=F[i.type[t]],c=i.x[t],u=i.y[t],f=e-c,h=n-u,d=Math.hypot(f,h);if(d<=s)return o.moving=!1,1;o.gkey!==r&&(o.gkey=r,o.stuck=0,o.lastD=1e9,o.chk=0,o.losAge=99);let m=f/d,x=h/d;if(!l.isHover&&(o.losAge++>=5&&(o.los=i.nav.clear(c,u,e,n,.35),o.losAge=t&3),!o.los)){const R=i.nav.getField(r,a);R&&i.nav.dir(R,c,u,Ir)?(m=Ir.x,x=Ir.y,o.dirx=m,o.diry=x):(o.dirx||o.diry)&&(m=o.dirx,x=o.diry)}const g=ma(i,t);if(g<=0)return o.moving=!1,0;const p=Math.atan2(x,m),_=l.def.speed>5?.6:.4,y=Math.abs(qi(i.face[t],p));Gn(i,t,p,_);const v=y>1.3?g*.3:g,A=Math.min(v,o.los||l.isHover?Math.max(0,d-.001):v);if(i.x[t]*1e3+i.y[t],ga(i,t,c+m*A,u+x*A),o.moving=!0,o.deploy=0,++o.chk>=20){if(o.chk=0,o.lastD-d<.5?o.stuck+=20:o.stuck=0,o.lastD=d,o.stuck>=40&&d<=s+3.6)return o.stuck=0,1;if(o.stuck===60&&(i.nav.invalidate(r),o.losAge=99),o.stuck>=160)return o.stuck=0,o.failTick=i.tick,2}return 0}function an(i,t,e){const n=i.nav.nearestWalkable(t,e,10);return i.cellIdx(n?n.x:t,n?n.y:e)}const fo=18,Sh=10,wh=(i,t)=>i.ext[t].mode>=fo&&F[i.type[t]].def.id==="bulwark",dc=(i,t)=>i.ext[t].mode>=Sh&&F[i.type[t]].def.id==="carapace_guard";function Mi(i,t){const e=F[i.type[t]];return e.isStruct||e.isNeutral?Math.max(i.ext[t].fw,i.ext[t].fh)/2:e.def.radius}function ni(i,t,e,n){if(!i.alive[e]||e===t)return!1;const s=i.owner[t],r=i.owner[e];if(r===s)return!1;const a=F[i.type[e]];if(r<0&&!(n&&a.def.id==="crystal_barrier"))return!1;const o=F[i.type[t]].def.weapon;if(!o||a.isHover&&o.targets==="ground"||!a.isHover&&o.targets==="air")return!1;if(s>=0){const l=i.players[s],c=i.cellIdx(i.x[e],i.y[e]);if(l.vis[c]!==Fe&&!i.pulseActive()&&!(n&&(a.isStruct||a.isNeutral)&&l.seen[c]))return!1}return!0}function Mr(i,t,e,n=0){const r=F[i.type[t]].def.weapon,a=i.ext[t],o=i.x[t],l=i.y[t];let c=-1,u=-1e9;const f=!!r.hoverFirst;return i.near(o,l,e+3.5,h=>{const d=i.owner[h];if(d<0||d===i.owner[t]||!ni(i,t,h,!1))return;const m=F[i.type[h]],x=Math.hypot(i.x[h]-o,i.y[h]-l)-Mi(i,h);if(x>e)return;if(r.minRange&&x<r.minRange*.5&&m.isStruct,n>0){const p=Math.atan2(i.y[h]-l,i.x[h]-o);if(Math.abs(qi(i.face[t],p))>n)return}let g=0;m.isUnit?g+=m.canAttack?30:m.isWorker?20:12:g+=m.canAttack?24:m.isHall?2:4,h===a.lastAttacker&&i.tick-a.lastHit<60&&(g+=25),f&&m.isHover&&(g+=60),h===a.target&&(g+=10),g+=(1-i.hp[h]/m.maxHp)*8,g-=x*2,g>u&&(u=g,c=h)}),c}function mr(i,t,e,n,s,r,a,o){if(!i.alive[t])return 0;const l=F[i.type[t]],c=i.ext[t],u=i.owner[t];let f=l.def.armor;u>=0&&l.isUnit&&(f+=i.players[u].armorBonus);let h=e*100/(100+f*10);if(c.shield>0&&o){const d=Math.atan2(a-i.y[t],r-i.x[t]);if(Math.abs(qi(i.face[t],d))<1.1){const m=Math.min(c.shield,h);c.shield-=m,h-=m}}if(dc(i,t)&&(h*=.5),c.lastHit=i.tick,n>=0&&(c.lastAttacker=n),h>0&&(i.hp[t]-=h),i.events.push({k:"hit",tick:i.tick,owner:u,x:i.x[t],y:i.y[t],a:h,b:l.isStruct?1:0,id:t}),u>=0&&s!==u){const d=i.players[u];i.tick-d.alertT>200&&(d.alertT=i.tick,i.alert(u,"attack",i.x[t],i.y[t],"Under attack"))}return i.hp[t]<=0&&i.kill(t,s),h}function gr(i,t,e,n){const s=oe[t].weapon;if(!s?.bonus)return 0;let r=0;for(const a of F[i.type[e]].def.tags)r+=(s.bonus[a]??0)*n;return r}function po(i,t,e){const n=F[i.type[t]],s=n.def.weapon,r=i.ext[t],a=i.owner[t],o=1+(a>=0?i.players[a].atkBonus:0),l=i.x[t],c=i.y[t],u=i.x[e],f=i.y[e];r.cd=n.periodT,r.atkTick=i.tick,r.lastAtk=i.tick;const h=s.damage*o;if(i.events.push({k:"shot",tick:i.tick,owner:a,x:l,y:c,tx:u,ty:f,id:t,a:i.type[t],b:s.projectileSpeed&&!s.pierce?1:0,vis:s.visual}),s.delayed){i.effects.push({kind:"erupt",owner:a,x:u,y:f,r:s.splash??2,start:i.tick+n.delayT,end:i.tick+n.delayT+1,dmg:h,born:i.tick,src:t,bonus:o,target:i.type[t]});return}if(s.projectileSpeed&&!s.pierce){const m=s.projectileSpeed/20,x=Math.hypot(u-l,f-c);i.projectiles.push({id:++i.projId,x:l,y:c,x0:l,y0:c,tx:u,ty:f,target:s.splash?-1:e,speed:m,owner:a,src:t,damage:h,bonus:o,splash:s.splash??0,slowF:s.slow?.factor??1,slowT:s.slow?Math.round(s.slow.duration*20):0,visual:s.visual,arc:s.splash?1:0,born:i.tick,total:Math.max(1,Math.ceil(x/m)),def:i.type[t]});return}const d=h+gr(i,i.type[t],e,o);if(mr(i,e,d,t,a,l,c,!0),s.slow&&i.alive[e]&&fc(i,e,s.slow.factor,Math.round(s.slow.duration*20)),s.pierce){const m=u-l,x=f-c,g=Math.hypot(m,x)||1,p=m/g,_=x/g;let y=-1,v=1e9;i.near(u,f,5,A=>{if(A===e||!i.isEnemy(t,A))return;const R=F[i.type[A]];if(!R.isUnit||!R.def.tags.includes("Light")||R.isHover)return;const w=i.x[A]-u,E=i.y[A]-f,M=w*p+E*_,b=Math.abs(w*_-E*p);M>0&&M<4.5&&b<1.1&&M<v&&(v=M,y=A)}),y>=0&&mr(i,y,(h+gr(i,i.type[t],y,o))*.6,t,a,l,c,!0)}}function fc(i,t,e,n){const s=i.ext[t];(i.tick>=s.slowUntil||e<s.slowF)&&(s.slowF=e),s.slowUntil=Math.max(s.slowUntil,i.tick+n)}function Rs(i,t,e,n){const s=F[i.type[t]],r=s.def.weapon,a=i.ext[t];if(dc(i,t)||a.mode>0&&s.def.id==="carapace_guard")return 0;const o=i.x[t],l=i.y[t],c=i.x[e],u=i.y[e],f=Mi(i,e),d=Math.hypot(c-o,u-l)-f,m=r.range+(wh(i,t)?2:0);if(d>m+.05){if(!n||ma(i,t)<=0&&a.mode===0||a.mode>0)return 2;const g=F[i.type[e]],p=g.isStruct||g.isNeutral?1e6+e:an(i,c,u);return pn(i,t,c,u,Math.max(.4,m-.5+f),p,()=>g.isStruct||g.isNeutral?i.nav.ringCells(i.ext[e].ox,i.ext[e].oy,i.ext[e].fw,i.ext[e].fh):[an(i,c,u)])===2?2:1}if(r.minRange&&d<r.minRange&&n){const g=Math.atan2(l-u,o-c);Gn(i,t,g+Math.PI,.4);const p=ma(i,t);if(p>0){const _=o+Math.cos(g)*p,y=l+Math.sin(g)*p;i.nav.fits(_,y,.4)&&(i.x[t]=_,i.y[t]=y,a.moving=!0)}return 1}a.moving=!1;const x=Math.atan2(u-l,c-o);if(r.cone){if(Math.abs(qi(i.face[t],x))>r.cone)return 2}else if(Gn(i,t,x,.4),Math.abs(qi(i.face[t],x))>.3)return 0;return s.setupT&&a.deploy<s.setupT?(a.deploy++,0):(a.cd<=0&&a.wind===0&&(s.windT>0?(a.wind=s.windT,a.target=e,a.atkTick=i.tick):po(i,t,e)),0)}function pc(i,t){const e=i.ext[t],n=F[i.type[t]];return e.prog++,i.hp[t]=Math.min(n.maxHp,i.hp[t]+n.maxHp*.9/Math.max(1,e.total)),e.prog>=e.total?(i.completeStructure(t),!0):!1}function Eh(i,t){const e=i.ext[t],n=F[i.type[t]],s=i.owner[t];if(!(s<0)){if(!e.done){i.players[s].faction.buildMode==="seed"&&pc(i,t);return}if(n.def.regen&&i.tick-e.lastHit>60&&(i.hp[t]=Math.min(n.maxHp,i.hp[t]+n.def.regen/20)),e.weldLeft>0&&(i.hp[t]=Math.min(n.maxHp,i.hp[t]+e.weldRate),e.weldLeft--),n.canAttack){const r=n.def.weapon;if(e.cd>0&&e.cd--,e.wind>0){if(e.wind--,e.wind===0){const a=e.target;a>=0&&i.alive[a]&&po(i,t,a)}return}e.target>=0&&!(i.alive[e.target]&&ni(i,t,e.target,!1))&&(e.target=-1),e.target<0&&(i.tick+t)%4===0&&(e.target=Mr(i,t,r.range,r.cone??0)),e.target>=0&&Rs(i,t,e.target,!1)===2&&(e.target=-1)}}}function Th(i){const t=i.projectiles;let e=0;for(let n=0;n<t.length;n++){const s=t[n];let r=!0;if(s.target>=0&&(i.alive[s.target]?(s.tx=i.x[s.target],s.ty=i.y[s.target]):r=!1),r){const a=s.tx-s.x,o=s.ty-s.y,l=Math.hypot(a,o);l<=s.speed+.15?(Ah(i,s),r=!1):(s.x+=a/l*s.speed,s.y+=o/l*s.speed)}r&&(t[e++]=s)}t.length=e}function Ah(i,t){if(oe[t.def].weapon,t.splash>0){mc(i,t.tx,t.ty,t.splash,t.damage,t.bonus,t.def,t.src,t.owner),i.events.push({k:"erupt",tick:i.tick,owner:t.owner,x:t.tx,y:t.ty,a:t.splash,vis:"shell"});return}if(t.target>=0&&i.alive[t.target]){const e=t.damage+gr(i,t.def,t.target,t.bonus);mr(i,t.target,e,t.src,t.owner,t.x0,t.y0,!0),t.slowT&&i.alive[t.target]&&fc(i,t.target,t.slowF,t.slowT)}}function mc(i,t,e,n,s,r,a,o,l,c){const u=[];i.near(t,e,n+2.5,f=>{const h=i.owner[f];if(h<0||h===l||F[i.type[f]].isHover)return;Math.hypot(i.x[f]-t,i.y[f]-e)-Mi(i,f)<=n&&u.push(f)});for(const f of u){const h=s+gr(i,a,f,r);mr(i,f,h,o,l,t,e,!0)}}function Rh(i){const t=i.tick;let e=0;for(let n=0;n<i.effects.length;n++){const s=i.effects[n];if(s.kind==="erupt"){if(t>=s.start){mc(i,s.x,s.y,s.r,s.dmg??0,s.bonus??1,s.target??0,s.src??-1,s.owner),i.events.push({k:"erupt",tick:t,owner:s.owner,x:s.x,y:s.y,a:s.r,vis:"eruption"});continue}}else if(s.kind==="silence"){if(t>=s.start&&t<s.end&&i.near(s.x,s.y,s.r+1.5,r=>{const a=i.owner[r];a<0||a===s.owner||!F[i.type[r]].isUnit||Math.hypot(i.x[r]-s.x,i.y[r]-s.y)<=s.r+F[i.type[r]].def.radius&&(i.ext[r].silUntil=t+4)}),t>=s.end)continue}else if(t>=s.end)continue;i.effects[e++]=s}i.effects.length=e}function Ch(i,t){const e=F[i.type[t]],n=i.ext[t];if(!e.heal||i.tick<n.silUntil||(n.energy=Math.min(e.maxEnergy,n.energy+.06),n.energy<.4))return!1;let s=-1,r=2;const a=i.owner[t];if(i.near(i.x[t],i.y[t],6.5,c=>{if(c===t||i.owner[c]!==a)return;const u=F[i.type[c]];if(!u.def.tags.includes(e.healTag)||i.hp[c]>=u.maxHp-.01||!u.isUnit&&!u.isStruct||!i.ext[c].done||Math.hypot(i.x[c]-i.x[t],i.y[c]-i.y[t])-Mi(i,c)>5)return;const h=i.hp[c]/u.maxHp;h<r&&(r=h,s=c)}),s<0)return!1;const o=F[i.type[s]];i.hp[s]=Math.min(o.maxHp,i.hp[s]+e.heal),n.energy-=.3,n.atkTick=i.tick,i.tick%4===0&&i.events.push({k:"weld",tick:i.tick,owner:a,x:i.x[t],y:i.y[t],tx:i.x[s],ty:i.y[s],id:t,vis:"heal"});const l=Math.atan2(i.y[s]-i.y[t],i.x[s]-i.x[t]);return n.moving||Gn(i,t,l,.3),!0}const Ph=5,kh=4,Lh=32;function Uh(i,t){const e=F[i.type[t]],n=i.ext[t],s=i.owner[t],r=i.tick;n.moving=!1,n.turn=0,n.cd>0&&n.cd--;for(let c=0;c<4;c++)n.cds[c]>0&&n.cds[c]--;if(n.mode>0&&n.mode<30&&n.mode++,e.def.shield&&r-n.lastHit>100&&(n.shield=Math.min(e.def.shield,n.shield+.4)),e.def.faction==="verdant"&&r-n.lastHit>100&&i.hp[t]<e.maxHp&&(i.hp[t]=Math.min(e.maxHp,i.hp[t]+.02)),e.def.id==="crownbeast"&&r%10===0&&r>=n.silUntil&&i.near(i.x[t],i.y[t],7,c=>{if(i.owner[c]!==s||!F[i.type[c]].def.tags.includes("Biological"))return;const u=F[i.type[c]];u.isUnit&&r-i.ext[c].lastHit>100&&i.hp[c]<u.maxHp&&(i.hp[c]=Math.min(u.maxHp,i.hp[c]+1.5))}),(r+t)%20===0&&xa(i,t),n.chT>0){Vh(i,t);return}if(n.wind>0){if(n.wind--,n.wind===0){const c=n.target,u=e.def.weapon;u&&c>=0&&i.alive[c]&&ni(i,t,c,!0)&&Math.hypot(i.x[c]-i.x[t],i.y[c]-i.y[t])-Mi(i,c)<=u.range+2.5&&po(i,t,c)}return}const a=e.heal?Ch(i,t):!1,o=n.orders[0];if(!o){Dh(i,t,a);return}let l=!1;switch(o.k){case mt.Move:{n.mode>0&&e.def.id!=="bulwark"&&e.def.id!=="carapace_guard"&&(n.mode=0),l=pn(i,t,o.x,o.y,o.r,an(i,o.x,o.y),()=>[an(i,o.x,o.y)])!==0;break}case mt.AttackMove:case mt.Patrol:{l=Ih(i,t,o);break}case mt.Attack:{const c=o.t;if(!e.canAttack||!i.alive[c]){l=!0;break}if(!ni(i,t,c,!0)){o.k=mt.AttackMove,o.r=.9,n.target=-1;break}o.x=i.x[c],o.y=i.y[c],n.target=c,Rs(i,t,c,!0)===2&&(l=!0);break}case mt.Hold:{if(!e.canAttack)break;const c=e.def.weapon;n.target>=0&&!(i.alive[n.target]&&ni(i,t,n.target,!1))&&(n.target=-1),n.target<0&&(r+t)%4===0&&(n.target=Mr(i,t,c.range+(n.mode>=fo?2:0))),n.target>=0&&Rs(i,t,n.target,!1)===2&&(n.target=-1);break}case mt.Gather:l=Bh(i,t,o);break;case mt.Build:l=zh(i,t,o);break;case mt.Resume:l=gc(i,t,o);break;case mt.Repair:l=Hh(i,t,o);break;case mt.Ability:l=Gh(i,t,o);break;case mt.Capture:l=Wh(i,t,o);break;default:l=!0}l&&(n.orders[0]===o&&n.orders.shift(),n.target=-1,n.gkey=-1,(o.k===mt.Move||o.k===mt.AttackMove)&&(n.homeX=i.x[t],n.homeY=i.y[t]))}function Dh(i,t,e){const n=F[i.type[t]],s=i.ext[t],r=i.tick;if(n.canAttack&&!n.isWorker){const a=n.def.weapon;s.target>=0&&!(i.alive[s.target]&&ni(i,t,s.target,!1))&&(s.target=-1),s.target<0&&(r+t)%4===0&&(s.target=Mr(i,t,a.range+1.5+(s.mode>=fo?2:0))),s.target<0&&s.lastAttacker>=0&&r-s.lastHit<60&&i.alive[s.lastAttacker]&&ni(i,t,s.lastAttacker,!1)&&Math.hypot(i.x[s.lastAttacker]-i.x[t],i.y[s.lastAttacker]-i.y[t])<14&&(s.target=s.lastAttacker),s.target>=0&&Rs(i,t,s.target,!0)===2&&(s.target=-1);return}if(n.isWorker&&s.lastAttacker>=0&&r-s.lastHit<40,n.heal&&!e&&(r+t)%10===0){let a=-1,o=1e9;i.near(i.x[t],i.y[t],14,l=>{if(l===t||i.owner[l]!==i.owner[t])return;const c=F[i.type[l]];if(!c.isUnit||!c.def.tags.includes(n.healTag)||i.hp[l]>=c.maxHp-.5)return;const u=Math.hypot(i.x[l]-i.x[t],i.y[l]-i.y[t]);u<o&&(o=u,a=l)}),s.target=a}n.heal&&s.target>=0&&i.alive[s.target]&&i.hp[s.target]<F[i.type[s.target]].maxHp-.5&&pn(i,t,i.x[s.target],i.y[s.target],3.5,an(i,i.x[s.target],i.y[s.target]),()=>[an(i,i.x[s.target],i.y[s.target])])}function Ih(i,t,e){const n=F[i.type[t]],s=i.ext[t];if(n.canAttack&&!n.isWorker){const a=n.def.weapon;if(s.target>=0&&!(i.alive[s.target]&&ni(i,t,s.target,!1))&&(s.target=-1),s.target<0&&(i.tick+t)%4===0&&(s.target=Mr(i,t,Math.max(a.range+3,8))),s.target>=0)return Rs(i,t,s.target,!0)===2&&(s.target=-1),!1}if(pn(i,t,e.x,e.y,e.r,an(i,e.x,e.y),()=>[an(i,e.x,e.y)])!==0){if(e.k===mt.Patrol){const a=e.a,o=e.b;return e.a=e.x,e.b=e.y,e.x=a,e.y=o,s.gkey=-1,!1}return!0}return!1}function Nh(i,t,e){const n=i.players[e].faction,s=pt[n.tap],r=i.x[t],a=i.y[t];for(const o of i.ids)if(i.alive[o]&&i.type[o]===s&&i.owner[o]===e&&i.ext[o].done&&Math.abs(i.x[o]-r)<.8&&Math.abs(i.y[o]-a)<.8)return!0;return!1}function ya(i,t,e){return!i.alive[t]||i.ext[t].amount<=0?!1:i.type[t]===pt.flux_vent?Nh(i,t,e):i.type[t]===pt.ore_seam}function Ns(i,t,e,n,s,r){const a=i.owner[t];let o=-1,l=1e9;for(const c of i.ids){if(!i.alive[c]||i.type[c]!==s||Math.hypot(i.x[c]-e,i.y[c]-n)>16||!ya(i,c,a))continue;const f=i.ext[c].res,h=f>=0&&f!==t&&i.alive[f]&&i.ext[f].wph===1;if(r&&h)continue;const m=Math.hypot(i.x[c]-i.x[t],i.y[c]-i.y[t])+(h?6:0);m<l&&(l=m,o=c)}return o}function Fh(i,t){const e=i.owner[t];let n=-1,s=1e9;for(const r of i.ids){if(!i.alive[r]||i.owner[r]!==e||!F[i.type[r]].isHall||!i.ext[r].done)continue;const a=Math.hypot(i.x[r]-i.x[t],i.y[r]-i.y[t]);a<s&&(s=a,n=r)}return n}function Yi(i,t){const e=i.ext[t];return()=>i.nav.ringCells(e.ox,e.oy,e.fw,e.fh)}function Oh(i,t){const e=i.ext[t];if(i.alive[t]&&(i.alive[t]=0,i.nav.setFootprint(e.ox,e.oy,e.fw,e.fh,-1),i.events.push({k:"depleted",tick:i.tick,owner:-1,x:i.x[t],y:i.y[t],id:t,a:i.type[t]}),i.type[t]===pt.ore_seam)){for(const n of i.ids)if(i.alive[n]&&i.type[n]===pt.ore_seam&&Math.hypot(i.x[n]-i.x[t],i.y[n]-i.y[t])<16)return;for(const n of i.ids)!i.alive[n]||!F[i.type[n]].isHall||Math.hypot(i.x[n]-i.x[t],i.y[n]-i.y[t])<22&&i.alert(i.owner[n],"depleted",i.x[t],i.y[t],"Expansion depleted")}}function Bh(i,t,e){const n=i.ext[t],s=i.owner[t],r=i.players[s];let a=e.t;if(n.wph===0&&n.carry>0&&(n.wph=2),n.wph===0){if(!ya(i,a,s)){const d=i.alive[a]?i.type[a]:pt.ore_seam,m=Ns(i,t,e.x,e.y,i.type[a]===pt.flux_vent&&i.alive[a]?d:pt.ore_seam,!1);if(m<0)return!0;a=e.t=m,e.x=i.x[m],e.y=i.y[m]}const u=i.ext[a],f=Math.max(u.fw,u.fh)/2+.85,h=pn(i,t,i.x[a],i.y[a],f,1e6+a,Yi(i,a));if(h===1)if(u.res>=0&&u.res!==t&&i.alive[u.res]&&i.ext[u.res].wph===1&&i.ext[u.res].node===a){const m=Ns(i,t,i.x[a],i.y[a],i.type[a],!0);m>=0?(a=e.t=m,e.x=i.x[m],e.y=i.y[m],n.gkey=-1):(n.waitT++,Gn(i,t,Math.atan2(i.y[a]-i.y[t],i.x[a]-i.x[t]),.3))}else u.res=t,n.node=a,n.gT=Lh,n.wph=1;else if(h===2){const d=Ns(i,t,e.x,e.y,i.type[a],!1);if(d>=0&&d!==a)e.t=d,e.x=i.x[d],e.y=i.y[d];else return!0}return!1}if(n.wph===1){const u=i.ext[n.node];if(!i.alive[n.node]||u.amount<=0)return n.wph=0,!1;if(Gn(i,t,Math.atan2(i.y[n.node]-i.y[t],i.x[n.node]-i.x[t]),.5),n.atkTick=i.tick,--n.gT<=0){const f=i.type[n.node]===pt.flux_vent,h=Math.min(u.amount,(f?kh:Ph)*i.gatherBonus());u.amount-=h,n.carry=h,n.carryT=f?2:1,u.res===t&&(u.res=-1),n.prevNode=n.node,n.wph=2,u.amount<=.01&&Oh(i,n.node)}return!1}const o=Fh(i,t);if(o<0)return!0;const l=i.ext[o],c=pn(i,t,i.x[o],i.y[o],Math.max(l.fw,l.fh)/2+.85,1e6+o,Yi(i,o));if(c===1){if(n.carryT===1?(r.ore+=n.carry,r.stats.ore+=n.carry):n.carryT===2&&(r.flux+=n.carry,r.stats.flux+=n.carry),n.carry=0,n.carryT=0,n.wph=0,!ya(i,e.t,s)){const u=Ns(i,t,e.x,e.y,i.alive[e.t]?i.type[e.t]:pt.ore_seam,!1);if(u<0)return!0;e.t=u,e.x=i.x[u],e.y=i.y[u]}}else if(c===2)return n.wph=0,!1;return!1}function xr(i,t){const e=i.ext[t];e.orders.length>1||e.prevNode>=0&&i.alive[e.prevNode]&&i.ext[e.prevNode].amount>0&&e.orders.push({k:mt.Gather,x:i.x[e.prevNode],y:i.y[e.prevNode],t:e.prevNode,p:0,r:0,a:0,b:0})}function zh(i,t,e){i.ext[t];const n=i.owner[t];if(e.t<0){const s=pn(i,t,e.x,e.y,e.r,an(i,e.x,e.y),()=>[an(i,e.x,e.y)]);if(s===0)return!1;if(s===2)return!0;const r=i.placeStructure(n,e.p,e.x,e.y,t);return r<0?!0:i.players[n].faction.buildMode==="seed"?(xr(i,t),!0):(e.t=r,!1)}return gc(i,t,e)}function gc(i,t,e){const n=e.t;if(!i.alive[n])return!0;const s=i.ext[n];if(s.done)return xr(i,t),!0;const r=Math.max(s.fw,s.fh)/2+1.35;return Math.hypot(i.x[n]-i.x[t],i.y[n]-i.y[t])>r?pn(i,t,i.x[n],i.y[n],r-.3,1e6+n,Yi(i,n))===2:i.players[i.owner[t]].faction.buildMode==="seed"?!0:(Gn(i,t,Math.atan2(i.y[n]-i.y[t],i.x[n]-i.x[t]),.5),i.ext[t].atkTick=i.tick,pc(i,n)?(xr(i,t),!0):!1)}function Hh(i,t,e){const n=e.t;if(!i.alive[n])return!0;const s=F[i.type[n]],r=i.owner[t];if(i.hp[n]>=s.maxHp-.01)return xr(i,t),!0;if(!s.isStruct&&!s.def.tags.includes("Mechanical"))return!0;const a=Mi(i,n)+1.3;if(Math.hypot(i.x[n]-i.x[t],i.y[n]-i.y[t])>a)return pn(i,t,i.x[n],i.y[n],a-.3,1e6+n,s.isStruct?Yi(i,n):()=>[an(i,i.x[n],i.y[n])])===2;const l=i.ext[t],c=i.players[r],u=.25,f=.25*s.def.cost.ore/s.maxHp;if(l.repT+=u*f,l.repT>=1){if(c.ore<1)return i.alert(r,"invalid",i.x[t],i.y[t],"Not enough Prism Ore to repair"),l.repT=0,!0;c.ore-=1,l.repT-=1}return i.hp[n]=Math.min(s.maxHp,i.hp[n]+u),l.atkTick=i.tick,Gn(i,t,Math.atan2(i.y[n]-i.y[t],i.x[n]-i.x[t]),.5),!1}function Gh(i,t,e){const n=F[i.type[t]],s=i.ext[t],r=n.def.abilities?.[e.p];if(!r)return!0;const a=i.owner[t],o=i.players[a];if(i.tick<s.silUntil)return i.alert(a,"invalid",i.x[t],i.y[t],"Silenced"),!0;if(s.cds[e.p]>0)return i.alert(a,"invalid",i.x[t],i.y[t],`${r.name} is recharging`),!0;const l=r.range??1;switch(r.id){case"weld":{const c=e.t;if(c<0||!i.alive[c]||i.owner[c]!==a||!F[i.type[c]].isStruct)return!0;const u=Mi(i,c)+1.3;if(Math.hypot(i.x[c]-i.x[t],i.y[c]-i.y[t])>u)return pn(i,t,i.x[c],i.y[c],u-.3,1e6+c,Yi(i,c))===2;if(o.flux<(r.flux??0))return i.alert(a,"invalid",i.x[t],i.y[t],"Not enough Flux"),!0;o.flux-=r.flux??0;const f=i.ext[c];return f.weldLeft=80,f.weldRate=60/80,s.cds[e.p]=Math.round(r.cooldown*20),s.castTick=i.tick,i.events.push({k:"weld",tick:i.tick,owner:a,x:i.x[t],y:i.y[t],tx:i.x[c],ty:i.y[c],id:t,vis:"weld"}),!0}case"spike":case"silence":return Math.hypot(e.x-i.x[t],e.y-i.y[t])>l?pn(i,t,e.x,e.y,l-.5,an(i,e.x,e.y),()=>[an(i,e.x,e.y)])===2:r.energy&&s.energy<r.energy?(i.alert(a,"invalid",i.x[t],i.y[t],"Not enough energy"),!0):(r.energy&&(s.energy-=r.energy),s.cds[e.p]=Math.round(r.cooldown*20),s.castTick=i.tick,r.id==="spike"?(i.effects.push({kind:"spike",owner:a,x:e.x,y:e.y,r:r.radius??8,start:i.tick,end:i.tick+280,born:i.tick}),i.events.push({k:"spike",tick:i.tick,owner:a,x:e.x,y:e.y})):(i.effects.push({kind:"silence",owner:a,x:e.x,y:e.y,r:r.radius??3,start:i.tick+20,end:i.tick+120,born:i.tick}),i.events.push({k:"silence",tick:i.tick,owner:a,x:e.x,y:e.y,a:r.radius??3})),!0);case"rootstep":{const c=e.t;if(c<0||!i.alive[c]||i.owner[c]!==a)return!0;const u=F[i.type[c]];if(!u.isStruct||!u.def.field||!i.ext[c].done)return!0;let f=!1;for(const m of i.fieldRadiusFor(a))Math.hypot(m.x-i.x[t],m.y-i.y[t])<=m.r&&(f=!0);if(!f)return i.alert(a,"invalid",i.x[t],i.y[t],"Rootstep needs a friendly grove nearby"),!0;s.chT=s.chTotal=20,s.chKind=1,s.chTarget=c;const h=i.ext[c].fw/2+1.2,d=Math.atan2(64-i.y[c],64-i.x[c]);return s.chX=i.x[c]+Math.cos(d)*h,s.chY=i.y[c]+Math.sin(d)*h,s.cds[e.p]=Math.round(r.cooldown*20),s.castTick=i.tick,i.events.push({k:"ability",tick:i.tick,owner:a,x:i.x[t],y:i.y[t],vis:"rootstep-start"}),!0}}return!0}function Vh(i,t){const e=i.ext[t];if(e.chT--,e.moving=!1,e.chKind===2){const n=e.chTarget;if(n<0||!i.alive[n]){e.chT=0;return}if(Gn(i,t,Math.atan2(i.y[n]-i.y[t],i.x[n]-i.x[t]),.4),e.chT<=0){const s=i.ext[n];s.capOwner=i.owner[t],i.events.push({k:"captured",tick:i.tick,owner:i.owner[t],x:i.x[n],y:i.y[n],id:n}),i.alert(i.owner[t],"captured",i.x[n],i.y[n],"Watch Pylon captured"),i.recordTimeline(i.owner[t],"Watch Pylon captured","pylon"),e.orders.shift()}return}if(e.chKind===1&&e.chT<=0){i.events.push({k:"ability",tick:i.tick,owner:i.owner[t],x:i.x[t],y:i.y[t],tx:e.chX,ty:e.chY,vis:"rootstep"});const n=i.nav.nearestWalkable(e.chX,e.chY,6);i.x[t]=i.px[t]=n?n.x:e.chX,i.y[t]=i.py[t]=n?n.y:e.chY,e.gkey=-1}}function Wh(i,t,e){const n=e.t;if(!i.alive[n]||i.ext[n].capOwner===i.owner[t])return!0;if(Math.hypot(i.x[n]-i.x[t],i.y[n]-i.y[t])>2.6)return pn(i,t,i.x[n],i.y[n],2.2,1e6+n,Yi(i,n))===2;const a=i.ext[t];return a.chT=a.chTotal=60,a.chKind=2,a.chTarget=n,!1}function $h(i){for(const t of i.ids){if(!i.alive[t])continue;const e=F[i.type[t]];if(!e.isUnit||e.isHover)continue;const n=i.ext[t],s=e.def.radius;i.near(i.x[t],i.y[t],s+1.3,r=>{if(r<=t)return;const a=F[i.type[r]];if(!a.isUnit||a.isHover)return;const o=i.ext[r];if(e.isWorker&&a.isWorker&&(n.wph>0||n.orders[0]?.k===mt.Gather)&&(o.wph>0||o.orders[0]?.k===mt.Gather))return;let l=i.x[t]-i.x[r],c=i.y[t]-i.y[r],u=Math.hypot(l,c);const f=(s+a.def.radius)*.92;if(u>=f)return;u<.001&&(l=t&1?1:-1,c=r&1?.5:-.5,u=Math.hypot(l,c));const h=Math.min(f-u,.3),d=l/u,m=c/u;let x=.5,g=.5;n.moving&&!o.moving?(x=.15,g=.85):!n.moving&&o.moving&&(x=.85,g=.15),n.chT>0&&(x=0,g=1),o.chT>0&&(g=0,x=1),ga(i,t,i.x[t]+d*h*x,i.y[t]+m*h*x),ga(i,r,i.x[r]-d*h*g,i.y[r]-m*h*g)})}}const $o={easy:{cadence:40,workerTarget:14,attackSupply:58,expandAt:330,prodMax:3,defenseCount:0,retreatRatio:1.2,waveGrowth:14,techAt:300,scoutAt:9999},normal:{cadence:20,workerTarget:18,attackSupply:44,expandAt:190,prodMax:5,defenseCount:2,retreatRatio:1.5,waveGrowth:16,techAt:190,scoutAt:70},hard:{cadence:10,workerTarget:22,attackSupply:34,expandAt:150,prodMax:7,defenseCount:3,retreatRatio:1.8,waveGrowth:22,techAt:140,scoutAt:40}};function xc(i,t,e,n){return new Xh(i,t,$o[e]??$o.normal,n)}class Xh{constructor(t,e,n,s){this.p=e,this.prof=n,this.passive=s,this.enemy=1-e,this.nextThink=5+e*3,this.waveSupply=n.attackSupply;const r=t.map.starts[e],a=t.map.size/2,o=a-r.x,l=a-r.y,c=Math.hypot(o,l),u=t.nav.nearestWalkable(r.x+o/c*24,r.y+l/c*24,10);this.rally=u??{x:r.x,y:r.y}}state="Opening";mem=new Map;enemy;nextThink;attacking=!1;attackTarget=null;waveSupply;lastRetreat=-99999;scouted=!1;scoutId=-1;scoutStage=0;rally={x:0,y:0};evacuating=!1;evacStart=0;noEvacUntil=0;lastWaveStart=0;sentRally=new Set;update(t){this.passive||t.tick<this.nextThink||(this.nextThink=t.tick+this.prof.cadence,this.observe(t),this.think(t))}observe(t){const e=t.players[this.p];for(const n of t.ids){if(!t.alive[n])continue;const s=t.owner[n];if(s!==this.enemy)continue;const r=t.cellIdx(t.x[n],t.y[n]);if(e.vis[r]===Fe){const a=F[t.type[n]];this.mem.set(n,{id:n,def:t.type[n],x:t.x[n],y:t.y[n],tick:t.tick,struct:a.isStruct,owner:s})}}for(const[n,s]of this.mem){if(e.vis[t.cellIdx(s.x,s.y)]===Fe&&t.tick!==s.tick&&!(t.alive[n]&&Math.hypot(t.x[n]-s.x,t.y[n]-s.y)<1.5)){this.mem.delete(n);continue}!s.struct&&t.tick-s.tick>20*90&&this.mem.delete(n)}}visibleEnemies(t){const e=[],n=t.players[this.p];for(const s of t.ids)!t.alive[s]||t.owner[s]!==this.enemy||n.vis[t.cellIdx(t.x[s],t.y[s])]===Fe&&e.push(s);return e}think(t){const e=this.p,n=t.players[e],s=n.faction,r=t.tick/20,a=t.ids.filter(st=>t.alive[st]&&t.owner[st]===e),o=a.filter(st=>F[t.type[st]].isWorker),l=a.filter(st=>F[t.type[st]].isHall),c=l.filter(st=>t.ext[st].done);if(!c.length&&!l.length)return;const u=a.filter(st=>F[t.type[st]].isStruct),f=(st,Lt=!1)=>u.filter(Ut=>t.type[Ut]===pt[st]&&(!Lt||t.ext[Ut].done)).length;let h=0,d=0;const m=[];for(const st of o){const Lt=t.ext[st].orders[0];Lt&&Lt.k===mt.Build&&Lt.t<0&&(h+=oe[Lt.p].cost.ore,d+=oe[Lt.p].cost.flux,m.push(Lt.p));for(const Ut of t.ext[st].orders.slice(1))Ut.k===mt.Build&&Ut.t<0&&m.push(Ut.p)}const x=st=>m.filter(Lt=>Lt===pt[st]).length,g=st=>f(st)+x(st),p=n.ore-h;let _=p,y=n.flux-d;const v=oe[pt[s.hall]].cost.ore,A=r>this.prof.expandAt&&l.length<2&&m.indexOf(pt[s.hall])<0&&this.pickSite(t,l)!==null;A&&(_=Math.max(0,p-v));const R=l[0],w={x:t.x[R],y:t.y[R]},E=this.visibleEnemies(t),M=[];for(const st of E)if(F[t.type[st]].isUnit){for(const Ut of u)if(Math.hypot(t.x[Ut]-t.x[st],t.y[Ut]-t.y[st])<17){M.push(st);break}}const b=a.filter(st=>{const Lt=F[t.type[st]];return Lt.isUnit&&!Lt.isWorker&&Lt.def.role!=="scout"}),P=st=>st.reduce((Lt,Ut)=>Lt+F[t.type[Ut]].def.cost.ore+F[t.type[Ut]].def.cost.flux,0),D=b.reduce((st,Lt)=>st+F[t.type[Lt]].def.supply,0),N=M.filter(st=>F[t.type[st]].canAttack);this.manageWorkers(t,o,c,N,P(b),P(N));const j=n.supplyCap-n.supplyUsed-0,X=u.filter(st=>F[t.type[st]].def.role==="production").length,q=s.supply,G=f(q)-f(q,!0)+x(q),nt=oe[pt[q]].cost.ore,ut=3+X*2+Math.floor(D/20);j<=ut&&n.supplyCap<200&&G<(r>360?2:1)&&_>=nt&&this.build(t,o,q,c)&&(_-=nt);const B=s.basicProd,ot=oe[pt[B]],ht=g(B);let z=Math.min(this.prof.prodMax,1+Math.floor(Math.max(0,r-45)/110));c.length>1&&(z=Math.min(this.prof.prodMax,z+1)),_>450&&(z=Math.min(this.prof.prodMax,z+1)),r>25&&ht<z&&_>=ot.cost.ore&&(n.supplyCap-n.supplyUsed>=1||G>0||r>60)&&this.build(t,o,B,c)&&(_-=ot.cost.ore);const K=oe[pt[s.tap]],lt=ht>=1&&r>60?Math.min(2*c.length,1+Math.floor((r-60)/100)):0;g(s.tap)<lt&&_>=K.cost.ore&&this.canTap(t)&&this.buildTap(t,o)&&(_-=K.cost.ore);const it=oe[pt[s.tech]];g(s.tech)<1&&f(B,!0)>=1&&r>this.prof.techAt&&_>=it.cost.ore&&y>=it.cost.flux&&f(s.tap,!0)>=1&&this.build(t,o,s.tech,c)&&(_-=it.cost.ore,y-=it.cost.flux);const wt=oe[pt[s.hall]];if(A&&p>=wt.cost.ore&&!this.threatened(t,N)){const st=this.pickSite(t,l);if(st){const Lt=this.pickBuilder(t,o,st.x,st.y);Lt>=0&&t.issue({c:"order",player:e,ord:"build",ids:[Lt],x:st.x,y:st.y,param:pt[s.hall]},!1)}}const Pt=oe[pt[s.defense]];this.prof.defenseCount>0&&l.length>=2&&g(s.defense)<this.prof.defenseCount*(l.length-1)+(r>500?1:0)&&_>=Pt.cost.ore+100&&f(B,!0)>0&&this.build(t,o,s.defense,c.slice(1).length?c.slice(1):c,!0)&&(_-=Pt.cost.ore),this.research(t,u,_,y),this.produce(t,u,o,c,_,y,D),this.scout(t,a),this.controlArmy(t,b,P,D,N,w,r)}threatened(t,e){return e.length>0}manageWorkers(t,e,n,s,r,a){const o=this.p,l=t.players[o],c=l.faction;if(!n.length)return;const u=s.filter(y=>{for(const v of n)if(Math.hypot(t.x[v]-t.x[y],t.y[v]-t.y[y])<14)return!0;return!1});if(u.length>=2&&a>r*.9&&t.tick>=this.noEvacUntil&&!this.evacuating){this.evacuating=!0,this.evacStart=t.tick;const y=n[0];for(const v of e){if(t.ext[v].orders[0]?.k===mt.Build)continue;let A=!1;for(const R of u)if(Math.hypot(t.x[v]-t.x[R],t.y[v]-t.y[R])<22){A=!0;break}A&&t.issue({c:"order",player:o,ord:"move",ids:[v],x:t.x[y]+.5,y:t.y[y]+.5},!1)}return}if(this.evacuating&&(u.length===0||t.tick-this.evacStart>20*14)&&(this.evacuating=!1,u.length>0&&(this.noEvacUntil=t.tick+20*30)),this.evacuating)return;const h=new Map;for(const y of e){const v=t.ext[y].orders[0];v&&v.k===mt.Gather&&h.set(v.t,(h.get(v.t)??0)+1)}let d=e.length;const m=n.reduce((y,v)=>y+t.ext[v].q.filter(A=>A.kind==="unit").length,0);d+=m;const x=t.ids.filter(y=>t.alive[y]&&t.owner[y]===o&&t.type[y]===pt[c.tap]&&t.ext[y].done),g=Math.min(44,this.prof.workerTarget*Math.min(n.length,2)/(n.length>1?1.4:1)+x.length*3);if(d<g)for(const y of n)t.ext[y].q.length>=2||l.ore>=50&&d<g&&(t.issue({c:"train",player:o,target:y,param:pt[c.worker]},!1),d++);for(const y of n)if(!t.ext[y].hasRally&&!this.sentRally.has(y)){this.sentRally.add(y);const A=t.nearestNode(t.x[y],t.y[y],"ore_seam");A>=0&&t.issue({c:"rally",player:o,ids:[y],x:t.x[A],y:t.y[A]},!1)}const p=[];for(const y of x)for(const v of t.ids)t.alive[v]&&t.type[v]===pt.flux_vent&&Math.abs(t.x[v]-t.x[y])<.8&&Math.abs(t.y[v]-t.y[y])<.8&&t.ext[v].amount>0&&p.push(v);const _=e.filter(y=>t.ext[y].orders.length===0&&t.ext[y].carry>=0&&t.ext[y].chT===0);for(const y of _){let v=-1;for(const A of p)if((h.get(A)??0)<3){v=A;break}v<0&&(v=this.bestOre(t,y,n,h)),v>=0&&(h.set(v,(h.get(v)??0)+1),t.issue({c:"order",player:o,ord:"gather",ids:[y],target:v},!1))}for(const y of p)if((h.get(y)??0)<3){const v=e.find(A=>{const R=t.ext[A].orders[0];return R&&R.k===mt.Gather&&t.type[R.t]===pt.ore_seam&&t.ext[A].carry===0});v!==void 0&&(h.set(y,(h.get(y)??0)+1),t.issue({c:"order",player:o,ord:"gather",ids:[v],target:y},!1));break}}bestOre(t,e,n,s){let r=-1,a=1e9;for(const o of t.ids){if(!t.alive[o]||t.type[o]!==pt.ore_seam||t.ext[o].amount<=0)continue;let l=1e9;for(const f of n)l=Math.min(l,Math.hypot(t.x[f]-t.x[o],t.y[f]-t.y[o]));if(l>16)continue;const c=s.get(o)??0,u=l+c*9+Math.hypot(t.x[e]-t.x[o],t.y[e]-t.y[o])*.15;u<a&&(a=u,r=o)}return r}canTap(t){return this.freeVent(t)>=0}freeVent(t){const e=this.p,n=t.players[e].faction,s=pt[n.tap];let r=-1,a=1e9;const o=t.ids.filter(l=>t.alive[l]&&t.owner[l]===e&&F[t.type[l]].isHall&&t.ext[l].done);for(const l of t.ids){if(!t.alive[l]||t.type[l]!==pt.flux_vent)continue;let c=!1;for(const u of t.ids)t.alive[u]&&t.type[u]===s&&Math.abs(t.x[u]-t.x[l])<.8&&Math.abs(t.y[u]-t.y[l])<.8&&(c=!0);if(!c)for(const u of o){const f=Math.hypot(t.x[u]-t.x[l],t.y[u]-t.y[l]);f<15&&f<a&&(a=f,r=l)}}return r}buildTap(t,e){const n=this.freeVent(t);if(n<0)return!1;const s=this.pickBuilder(t,e,t.x[n],t.y[n]);if(s<0)return!1;const r=t.players[this.p].faction;return t.issue({c:"order",player:this.p,ord:"build",ids:[s],x:t.x[n],y:t.y[n],param:pt[r.tap]},!1),!0}pickBuilder(t,e,n,s){let r=-1,a=1e9;for(const o of e){const l=t.ext[o];if(l.orders[0]?.k===mt.Build||l.orders[0]?.k===mt.Resume||l.chT>0)continue;let c=Math.hypot(t.x[o]-n,t.y[o]-s);l.carry>0&&(c+=12),c<a&&(a=c,r=o)}return r}build(t,e,n,s,r=!1){const a=pt[n],o=F[a];if(!s.length)return!1;const l=s[(t.tick/200|0)%s.length],c=t.x[l],u=t.y[l],f=t.map.size/2,h=Math.atan2(f-u,f-c);let d=null,m=1e9;for(let g=0;g<4;g++){const p=(o.def.field?8:6)+g*2.5;for(let _=0;_<24;_++){const y=_/24*Math.PI*2,v=c+Math.cos(y)*p,A=u+Math.sin(y)*p;if(!t.canPlace(this.p,a,v,A).ok)continue;let w=0;t.near(v,A,4,b=>{F[t.type[b]].isStruct&&t.owner[b]===this.p&&w++});const E=Math.abs(Math.atan2(Math.sin(y-h),Math.cos(y-h)));let M=p*1+w*3+(r?E*4:(Math.PI-E)*1.5);o.def.role==="supply"&&(M+=(Math.PI-E)*2),M<m&&(m=M,d={x:v,y:A})}if(d)break}if(!d)return!1;const x=this.pickBuilder(t,e,d.x,d.y);return x<0?!1:(t.issue({c:"order",player:this.p,ord:"build",ids:[x],x:d.x,y:d.y,param:a},!1),!0)}pickSite(t,e){const n=t.map.starts[this.p],s=t.map.starts[this.enemy];let r=null,a=1e9;for(const o of t.map.sites){if(o.kind==="main")continue;const l=Math.hypot(o.x-n.x,o.y-n.y);if(Math.hypot(o.x-s.x,o.y-s.y)<l)continue;let u=!1;for(const f of t.ids)t.alive[f]&&F[t.type[f]].isHall&&Math.hypot(t.x[f]-o.x,t.y[f]-o.y)<12&&(u=!0);u||l<a&&(a=l,r={x:o.x,y:o.y})}return r}research(t,e,n,s){const r=t.players[this.p].faction,a=t.players[this.p],o=e.find(c=>t.type[c]===pt[r.tech]&&t.ext[c].done);if(o===void 0||t.ext[o].q.length>0)return;const l=[r.id==="helix"?"heavy_chassis":"crown_rites",...r.upgrades.filter(c=>c.includes("1")),...r.upgrades.filter(c=>c.includes("2")),...r.upgrades.filter(c=>c.includes("3"))];for(const c of l){const u=Rn[c];if(!a.upg[u]){t.issue({c:"research",player:this.p,target:o,param:u},!1);return}}}produce(t,e,n,s,r,a,o){const l=this.p,c=t.players[l],u=c.faction,f=e.filter(p=>t.type[p]===pt[u.basicProd]&&t.ext[p].done);if(!f.length)return;const h={};let d=0;for(const p of this.mem.values())if(!p.struct){d++;for(const _ of oe[p.def].tags)h[_]=(h[_]??0)+1}const m=p=>d>0?(h[p]??0)/d:0;let x=c.supplyCap-c.supplyUsed-f.reduce((p,_)=>p+t.ext[_].q.filter(y=>y.kind==="unit"&&!y.started).length*2,0);const g=t.ids.filter(p=>t.alive[p]&&t.owner[p]===l&&t.type[p]===pt[u.scout]).length;for(const p of f){if(t.ext[p].q.length>=2)continue;const y=[];for(const w of u.composition){const E=oe[pt[w.id]];if(E.producedBy!==oe[t.type[p]].id||t.missingReq(l,E.requires)||E.cost.ore>r||E.cost.flux>a||E.supply>x)continue;let M=w.weight;if(E.weapon?.bonus)for(const[b,P]of Object.entries(E.weapon.bonus))b!=="Structure"&&(M*=1+P/E.weapon.damage*m(b)*2);E.role==="scout"&&(M=g<1&&t.tick/20>100?4:0),E.role==="siege"&&o<12&&(M*=.3),E.role==="support"&&o<14&&(M*=.2),y.push({d:E,w:M})}const v=y.reduce((w,E)=>w+E.w,0);if(v<=0)continue;let A=t.rand()*v,R=y[0];for(const w of y)if(A-=w.w,A<=0){R=w;break}t.issue({c:"train",player:l,target:p,param:pt[R.d.id]},!1),r-=R.d.cost.ore,a-=R.d.cost.flux,x-=R.d.supply,(!t.ext[p].hasRally||!this.sentRally.has(p))&&(this.sentRally.add(p),t.issue({c:"rally",player:l,ids:[p],x:this.rally.x,y:this.rally.y},!1))}}scout(t,e){if(t.tick/20<this.prof.scoutAt)return;const n=t.players[this.p].faction;let s=this.scoutId;if((s<0||!t.alive[s])&&(s=e.find(h=>t.type[h]===pt[n.scout])??-1,this.scoutId=s,this.scoutStage=0),s<0||t.ext[s].orders.length>0)return;const a=t.map.starts[this.enemy],o=t.map.sites.filter(h=>h.id.startsWith(this.enemy===1?"p1":"p0")),l=[o.find(h=>h.kind==="natural"),o.find(h=>h.kind==="main")??{x:a.x,y:a.y},o.find(h=>h.kind==="side")],c=l[this.scoutStage%l.length]??{x:a.x,y:a.y};this.scoutStage++;const u=t.map.size/2,f=t.nav.nearestWalkable(c.x+(u-c.x)*.12,c.y+(u-c.y)*.12,10)??c;t.issue({c:"order",player:this.p,ord:"move",ids:[s],x:f.x,y:f.y,force:!0},!1),this.scoutStage>=4&&(t.map.starts[this.p],t.issue({c:"order",player:this.p,ord:"move",ids:[s],x:this.rally.x,y:this.rally.y,queue:!0},!1),this.scoutStage=0,this.scouted=!0)}controlArmy(t,e,n,s,r,a,o){const l=this.p;if(!e.length){this.attacking=!1,this.state=r.length?"Defend Threat":"Establish Economy";return}if(r.length>0){let y=0,v=0;for(const w of r)y+=t.x[w],v+=t.y[w];y/=r.length,v/=r.length;const A=r[0],R=e.filter(w=>{const E=t.ext[w].orders[0];return!E||E.k!==mt.AttackMove||Math.hypot(E.x-y,E.y-v)>10});R.length&&t.issue({c:"order",player:l,ord:"attackMove",ids:R,x:t.x[A],y:t.y[A]},!1),this.state="Defend Threat",this.attacking=!1;return}const c=t.tick-this.lastRetreat>20*45;if(!this.attacking){if(this.state=s>=this.waveSupply*.75?"Assemble":"Establish Economy",o>150&&t.players[l].supplyUsed>0&&s>=(o>13*60?this.waveSupply*.6:this.waveSupply)&&(c||o>16*60)){this.attacking=!0,this.lastWaveStart=t.tick,this.waveSupply=Math.min(90,this.waveSupply+this.prof.waveGrowth),this.state="Attack",this.attackTarget=this.pickTarget(t);const v=this.attackTarget;t.issue({c:"order",player:l,ord:"attackMove",ids:e,x:v.x,y:v.y},!1);return}const y=e.filter(v=>!t.ext[v].orders.length&&Math.hypot(t.x[v]-this.rally.x,t.y[v]-this.rally.y)>7);y.length&&t.issue({c:"order",player:l,ord:"attackMove",ids:y,x:this.rally.x,y:this.rally.y},!1);return}this.state=o>20*60?"Final Push":"Attack";let u=0,f=0;for(const y of e)u+=t.x[y],f+=t.y[y];u/=e.length,f/=e.length;const h=[];for(const y of this.visibleEnemies(t)){const v=F[t.type[y]];v.isUnit&&v.canAttack&&Math.hypot(t.x[y]-u,t.y[y]-f)<16&&h.push(y),v.isStruct&&v.canAttack&&Math.hypot(t.x[y]-u,t.y[y]-f)<11&&h.push(y)}const d=n(e),m=n(h),x=o>14*60?2.2:1;if(m>d*this.prof.retreatRatio*x&&t.tick-this.lastWaveStart>20*12){this.attacking=!1,this.lastRetreat=t.tick,this.state="Recover",t.issue({c:"order",player:l,ord:"move",ids:e,x:this.rally.x,y:this.rally.y,force:!0},!1);return}const g=this.attackTarget??this.pickTarget(t),p=e.filter(y=>!t.ext[y].orders.length),_=this.pickTarget(t);if(p.length>0||Math.hypot(_.x-g.x,_.y-g.y)>6){this.attackTarget=_;const y=p.length>e.length*.5?e:p;t.issue({c:"order",player:l,ord:"attackMove",ids:y,x:_.x,y:_.y},!1)}s<this.waveSupply*.25&&t.tick-this.lastWaveStart>20*20&&(this.attacking=!1)}pickTarget(t){const e=t.map.starts[this.p];let n=null,s=1e9;for(const a of this.mem.values()){if(!a.struct)continue;const o=F[a.def].isHall,l=Math.hypot(a.x-e.x,a.y-e.y)+(o?40:0);l<s&&(s=l,n=a)}if(n)return{x:n.x,y:n.y};const r=t.map.starts[this.enemy];return{x:r.x,y:r.y}}}const Nr=18*60*Ms,qn=36;class qh{cfg;map;nav;tick=0;cap=2048;x=new Float32Array(this.cap);y=new Float32Array(this.cap);px=new Float32Array(this.cap);py=new Float32Array(this.cap);face=new Float32Array(this.cap);hp=new Float32Array(this.cap);owner=new Int8Array(this.cap);type=new Uint16Array(this.cap);alive=new Uint8Array(this.cap);ext=[];ids=[];nextId=0;players=[];projectiles=[];effects=[];events=[];winner=-1;over=!1;rngState;hashes=[];log=[];queue=[];seq=0;hashHead=new Int32Array(qn*qn);hashNext=new Int32Array(this.cap);projId=0;pulseUntil=0;tutorialDummyOwner=-1;prof=null;lap(t,e){const n=performance.now();return this.prof&&(this.prof[t]=(this.prof[t]??0)+(n-e)),n}constructor(t){this.cfg=t,this.rngState=t.seed>>>0||1,this.map=uc(),this.nav=new vh(this.map);const e=this.map.size;for(let n=0;n<2;n++){const s=Ss[t.factions[n]];this.players.push({id:n,faction:s,ore:t.startOre??300,flux:0,supplyUsed:0,supplyCap:0,upg:new Uint8Array(ze.length),vis:new Uint8Array(e*e),seen:new Uint8Array(e*e),stats:{ore:0,flux:0,created:0,lost:0,killed:0,structures:0,structuresLost:0,workersMax:0,firstExpandTick:-1,armySamples:[],econSamples:[],timeline:[]},ai:null,alive:!0,atkBonus:0,armorBonus:0,alertT:-9999,unlocks:new Set})}this.spawnMapEntities();for(let n=0;n<2;n++)this.spawnStart(n);for(let n=0;n<2;n++){const s=t.ai[n];s&&(this.players[n].ai=xc(this,n,s,!!t.passiveAi&&n===1))}this.updateVision()}rand(){let t=(this.rngState+=1831565813)>>>0;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}grow(){const t=this.cap*2,e=n=>{const s=new n.constructor(t);return s.set(n),s};this.x=e(this.x),this.y=e(this.y),this.px=e(this.px),this.py=e(this.py),this.face=e(this.face),this.hp=e(this.hp),this.owner=e(this.owner),this.type=e(this.type),this.alive=e(this.alive),this.hashNext=e(this.hashNext),this.cap=t}spawn(t,e,n,s,r={}){this.nextId>=this.cap&&this.grow();const a=this.nextId++,o=F[t],l=new ph;if(this.ext[a]=l,this.type[a]=t,this.owner[a]=e,this.alive[a]=1,this.x[a]=this.px[a]=n,this.y[a]=this.py[a]=s,this.face[a]=r.face??0,this.hp[a]=o.maxHp,l.born=this.tick,l.energy=o.maxEnergy*.5,l.shield=o.def.shield??0,l.homeX=n,l.homeY=s,o.isStruct||o.isNeutral){const c=r.w??o.w,u=r.h??o.h;l.fw=c,l.fh=u,l.ox=r.ox??Math.round(n-c/2),l.oy=r.oy??Math.round(s-u/2),this.x[a]=this.px[a]=l.ox+c/2,this.y[a]=this.py[a]=l.oy+u/2,this.nav.setFootprint(l.ox,l.oy,c,u,1),o.isStruct&&(l.done=r.done!==!1,l.done||(l.total=Math.round(o.buildT*this.players[e].faction.buildTimeMult),l.prog=0,this.hp[a]=Math.max(8,o.maxHp*.1)),o.def.turret&&(this.face[a]=Math.atan2(Le/2-this.y[a],Le/2-this.x[a]))),o.isNeutral&&(l.amount=l.maxAmount=r.amount??0,o.def.id==="watch_pylon"&&(l.capOwner=-1))}if(this.ids.push(a),e>=0){const c=this.players[e].stats;o.isUnit?(c.created++,o.isWorker):o.isStruct&&c.structures++}return a}kill(t,e){if(!this.alive[t])return;const n=F[this.type[t]],s=this.ext[t];this.alive[t]=0,this.hp[t]=0;const r=this.owner[t];if((n.isStruct||n.isNeutral)&&this.nav.setFootprint(s.ox,s.oy,s.fw,s.fh,-1),this.events.push({k:"death",tick:this.tick,owner:r,x:this.x[t],y:this.y[t],id:t,a:this.type[t],b:this.face[t]}),r>=0){const a=this.players[r];n.isUnit?a.stats.lost++:n.isStruct&&(a.stats.structuresLost++,a.stats.timeline.push({tick:this.tick,text:`${n.def.name} destroyed`,kind:"loss"})),e>=0&&e!==r&&this.players[e].stats.killed++}n.isWorker&&s.node>=0&&this.ext[s.node]&&this.ext[s.node].res===t&&(this.ext[s.node].res=-1)}def(t){return F[this.type[t]].def}td(t){return F[this.type[t]]}isEnemy(t,e){const n=this.owner[t],s=this.owner[e];return n!==s&&n>=0&&s>=0}cellIdx(t,e){const n=this.map.size;return Math.min(n-1,Math.max(0,Math.floor(e)))*n+Math.min(n-1,Math.max(0,Math.floor(t)))}visibleTo(t,e){return t<0||this.owner[e]===t||this.pulseActive()?!0:this.players[t].vis[this.cellIdx(this.x[e],this.y[e])]===Fe}cellVisible(t,e,n){return this.players[t].vis[this.cellIdx(e,n)]===Fe}pulseActive(){return this.tick<this.pulseUntil}countOf(t,e,n=!0){const s=pt[e];let r=0;for(const a of this.ids)this.alive[a]&&this.owner[a]===t&&this.type[a]===s&&(!n||this.ext[a].done)&&r++;return r}hasBuilding(t,e){const n=pt[e];for(const s of this.ids)if(this.alive[s]&&this.owner[s]===t&&this.type[s]===n&&this.ext[s].done)return!0;return!1}hasUnlock(t,e){return this.players[t].unlocks.has(e)}missingReq(t,e){if(!e)return"";for(const n of e)if(n in Rn){if(!this.players[t].upg[Rn[n]])return ze[Rn[n]].name}else if(!this.hasBuilding(t,n))return oe[pt[n]].name;return""}rebuildHash(){this.hashHead.fill(-1);for(const t of this.ids){if(!this.alive[t])continue;const e=this.hashCell(this.x[t],this.y[t]);this.hashNext[t]=this.hashHead[e],this.hashHead[e]=t}}hashCell(t,e){const n=Math.min(qn-1,Math.max(0,t/4|0));return Math.min(qn-1,Math.max(0,e/4|0))*qn+n}near(t,e,n,s){const r=Math.max(0,(t-n)/4|0),a=Math.min(qn-1,(t+n)/4|0),o=Math.max(0,(e-n)/4|0),l=Math.min(qn-1,(e+n)/4|0);for(let c=o;c<=l;c++)for(let u=r;u<=a;u++)for(let f=this.hashHead[c*qn+u];f>=0;f=this.hashNext[f])this.alive[f]&&s(f)}groundHeight(t,e){return Ft(this.map,t,e)}spawnMapEntities(){const t=this.map;for(const e of t.resources){const n=pt[e.kind==="ore"?"ore_seam":"flux_vent"];this.spawn(n,-1,e.x,e.y,{amount:e.amount,ox:Math.round(e.x-e.w/2),oy:Math.round(e.y-e.h/2),w:e.w,h:e.h})}for(const e of t.pylons)this.spawn(pt.watch_pylon,-1,e.x,e.y,{});for(const e of t.pods)this.spawn(pt.salvage_pod,-1,e.x,e.y,{});for(const e of t.barriers)this.spawn(pt.crystal_barrier,-1,e.x+e.w/2,e.y+e.h/2,{ox:e.x,oy:e.y,w:e.w,h:e.h})}spawnStart(t){const e=this.players[t].faction,n=this.map.starts[t],s=this.spawn(pt[e.hall],t,n.x,n.y,{}),r=this.x[s],a=this.y[s],o=Le/2;let l=o-a,c=o-r;l=o-r,c=o-a;const u=Math.hypot(l,c)||1;l/=u,c/=u;const f=r+l*4.6,h=a+c*4.6,d=-c,m=l,x=[],g=this.cfg.mode==="tutorial",p=g&&t===1?3:6;for(let _=0;_<p;_++){const y=(_-2.5)*1.15,v=this.spawn(pt[e.worker],t,f+d*y,h+m*y,{face:Math.atan2(c,l)});x.push(v)}if(g&&t===1||this.spawn(pt[e.scout],t,f+d*4.6,h+m*4.6,{face:Math.atan2(c,l)}),!g)for(const _ of x)this.orderGatherNearest(_,s);if(g&&t===1){for(let _=0;_<4;_++)this.spawn(pt.thornling,t,f+d*(_-1.5)*1.3+l*3,h+m*(_-1.5)*1.3+c*3,{face:Math.atan2(c,l)});this.spawn(pt.needle_pod,t,r+l*9+d*4,a+c*9+m*4,{done:!0}),this.spawn(pt.root_node,t,r-l*8+d*7,a-c*8+m*7,{done:!0})}this.ensureOpen(t),this.updateSupply(),this.recordTimeline(t,"Match start","start")}ensureOpen(t){for(const e of this.ids)this.owner[e]!==t||!F[this.type[e]].isUnit||xa(this,e)}orderGatherNearest(t,e){let n=-1,s=1e9;const r=this.x[e],a=this.y[e];for(const o of this.ids){if(!this.alive[o]||this.owner[o]!==-1||this.type[o]!==pt.ore_seam||this.ext[o].amount<=0)continue;const u=(this.x[o]-r)**2+(this.y[o]-a)**2;u<s&&(s=u,n=o)}n>=0&&(this.ext[t].orders=[{k:mt.Gather,x:this.x[n],y:this.y[n],t:n,p:0,r:0,a:0,b:0}])}recordTimeline(t,e,n){this.players[t].stats.timeline.push({tick:this.tick,text:e,kind:n})}submit(t){t.seq=this.seq++,t.tick=Math.max(t.tick??0,this.tick+1),this.queue.push(t)}issue(t,e=!0){t.seq=this.seq++,t.tick=this.tick,e&&this.log.push(t),this.applyCommand(t)}newOrder(t,e=0,n=0,s=-1,r=0,a=.6){return{k:t,x:e,y:n,t:s,p:r,r:a,a:e,b:n}}applyCommand(t){const e=this.players[t.player];if(!(!e||!e.alive||this.over))switch(t.c){case"order":this.applyOrderCommand(t);break;case"train":this.train(t.player,t.target??-1,t.param??-1);break;case"research":this.research(t.player,t.target??-1,t.param??-1);break;case"cancel":this.cancelQueue(t.player,t.target??-1,t.param??0);break;case"rally":{for(const n of t.ids??[]){if(!this.alive[n]||this.owner[n]!==t.player||!F[this.type[n]].isStruct)continue;const s=this.ext[n];s.hasRally=!0,s.rallyX=t.x??this.x[n],s.rallyY=t.y??this.y[n],s.rallyT=t.target??-1}break}case"surrender":this.defeat(t.player);break}}applyOrderCommand(t){const e=t.ids??[],n=t.ord,s=t.x??0,r=t.y??0,a=t.target??-1;let o=0;if(n==="build"){const u=t.param??-1;if(u<0||!oe[u])return;const f=F[u],h=this.players[t.player].faction;if(!f.isStruct||!h.structures.includes(f.def.id))return;if(this.missingReq(t.player,f.def.requires)){this.alert(t.player,"invalid",s,r,`Requires ${this.missingReq(t.player,f.def.requires)}`);return}const d=this.players[t.player];if(d.ore<f.def.cost.ore||d.flux<f.def.cost.flux){this.alert(t.player,"invalid",s,r,d.ore<f.def.cost.ore?"Not enough Prism Ore":"Not enough Flux");return}let m=-1,x=1e9;for(const _ of e){if(!this.alive[_]||this.owner[_]!==t.player||!F[this.type[_]].isWorker)continue;const y=this.ext[_],v=Math.hypot(this.x[_]-s,this.y[_]-r)+(y.orders.length?8:0);v<x&&(x=v,m=_)}if(m<0)return;const g=this.canPlace(t.player,u,s,r);if(!g.ok){this.alert(t.player,"invalid",s,r,g.reason);return}this.ext[m];const p=this.newOrder(mt.Build,g.ox+g.w/2,g.oy+g.h/2,-1,u,f.w/2+1.1);this.pushOrder(m,p,!!t.queue);return}const l=[];for(const u of e)!this.alive[u]||this.owner[u]!==t.player||F[this.type[u]].isUnit&&l.push(u);if(!l.length)return;const c=(n==="move"||n==="attackMove"||n==="patrol")&&l.length>1?this.formationSlots(s,r,l.length,l):null;for(let u=0;u<l.length;u++){const f=l[u],h=this.ext[f],d=c?c[u].x:s,m=c?c[u].y:r;let x=null;switch(n){case"move":x=this.newOrder(mt.Move,d,m,-1,t.force?1:0,c?.55:.5);break;case"attackMove":x=this.newOrder(mt.AttackMove,d,m,-1,0,c?.9:.6);break;case"patrol":x=this.newOrder(mt.Patrol,d,m,-1,0,.9),x.a=this.x[f],x.b=this.y[f];break;case"attack":a>=0&&this.alive[a]&&(x=this.newOrder(mt.Attack,this.x[a],this.y[a],a,0,0));break;case"stop":h.orders=[],h.target=-1,h.wind=0,h.mode&&F[this.type[f]].def.id;continue;case"hold":h.orders=[this.newOrder(mt.Hold,this.x[f],this.y[f],-1,0,0)],h.target=-1;continue;case"gather":{if(!F[this.type[f]].isWorker||a<0||!this.alive[a])continue;x=this.newOrder(mt.Gather,this.x[a],this.y[a],a,0,0);break}case"repair":{if(!F[this.type[f]].isWorker||a<0||!this.alive[a]||this.owner[a]!==t.player)continue;const g=this.ext[a];F[this.type[a]].isStruct&&!g.done?x=this.newOrder(mt.Resume,this.x[a],this.y[a],a,0,0):this.players[t.player].faction.buildMode==="attend"&&(x=this.newOrder(mt.Repair,this.x[a],this.y[a],a,0,0));break}case"capture":a>=0&&this.alive[a]&&F[this.type[a]].def.id==="watch_pylon"&&(x=this.newOrder(mt.Capture,this.x[a],this.y[a],a,0,0));break;case"ability":{const p=F[this.type[f]].def.abilities?.[t.param??0];if(!p)continue;if(p.target==="toggle"){this.toggleAbility(f),o++;continue}x=this.newOrder(mt.Ability,s,r,a,t.param??0,0);break}}x&&(o++,this.pushOrder(f,x,!!t.queue))}o>0&&t.player===0&&this.events.push({k:"order",tick:this.tick,owner:t.player,x:s,y:r,a:n==="attack"||n==="attackMove"?1:0})}pushOrder(t,e,n){const s=this.ext[t],r=F[this.type[t]];n||(s.orders.length=0,s.target=-1,s.wind=0,s.gkey=-1,s.stuck=0,s.hasSlot=!1,(e.k===mt.Move||e.k===mt.Gather||e.k===mt.AttackMove)&&(r.def.id==="bulwark"&&(s.mode=0),r.def.id==="carapace_guard"&&(s.mode=0)),s.wph===1&&s.node>=0&&this.ext[s.node]?.res===t&&(this.ext[s.node].res=-1),s.wph=0,e.k!==mt.Gather&&(s.node=e.k===mt.Build?s.node:-1),s.chT>0&&(s.chT=0)),s.orders.length<24&&s.orders.push(e)}toggleAbility(t){const e=this.ext[t],n=F[this.type[t]];(n.def.id==="bulwark"||n.def.id==="carapace_guard")&&(e.mode>0?e.mode=0:this.tick>=e.silUntil&&(e.mode=1,e.orders=[],e.target=-1))}formationSlots(t,e,n,s){const r=this.nav.nearestWalkable(t,e,10)??{x:t,y:e},a=[],o=1.5;a.push({x:r.x,y:r.y});let l=1;for(;a.length<n&&l<14;){const h=Math.max(6,Math.round(2*Math.PI*l*o/o));for(let d=0;d<h&&a.length<n+20;d++){const m=d/h*Math.PI*2+l*.7,x=r.x+Math.cos(m)*l*o,g=r.y+Math.sin(m)*l*o;this.nav.fits(x,g,.5)&&this.nav.clear(r.x,r.y,x,g,.4)&&a.push({x,y:g})}l++}for(;a.length<n;)a.push({x:r.x,y:r.y});const c=new Array(n),u=new Array(a.length).fill(!1),f=s.map((h,d)=>d).sort((h,d)=>{const m=(this.x[s[h]]-r.x)**2+(this.y[s[h]]-r.y)**2,x=(this.x[s[d]]-r.x)**2+(this.y[s[d]]-r.y)**2;return m-x||s[h]-s[d]});for(const h of f){let d=-1,m=1e12;for(let x=0;x<Math.min(a.length,n+12);x++){if(u[x])continue;const g=(this.x[s[h]]-a[x].x)**2+(this.y[s[h]]-a[x].y)**2+x*.4;g<m&&(m=g,d=x)}u[d]=!0,c[h]=a[d]}return c}canPlace(t,e,n,s){const r=F[e],a=r.w,o=r.h;let l=Math.round(n-a/2),c=Math.round(s-o/2);const u=this.map.size,f=(h,d,m=-1)=>({ok:h,reason:d,ox:l,oy:c,w:a,h:o,vent:m});if(r.def.onVent){let h=-1,d=4.5;for(const g of this.ids){if(!this.alive[g]||this.type[g]!==pt.flux_vent)continue;const p=Math.hypot(this.x[g]-n,this.y[g]-s);p<d&&(d=p,h=g)}if(h<0)return f(!1,"Must be built on a Flux Vent");const m=this.ext[h];l=m.ox,c=m.oy;for(const g of this.ids)if(!(!this.alive[g]||g===h)&&F[this.type[g]].isStruct&&this.type[g]!==pt.flux_vent&&Math.hypot(this.x[g]-this.x[h],this.y[g]-this.y[h])<1.5)return f(!1,"Vent already tapped",h);return this.nearestField(t,this.x[h],this.y[h])?f(!0,"",h):f(!1,"Outside construction field",h)}if(l<1||c<1||l+a>u-1||c+o>u-1)return f(!1,"Out of bounds");for(let h=c;h<c+o;h++)for(let d=l;d<l+a;d++){const m=h*u+d;if(this.map.blocked[m]||this.map.chasm[m])return f(!1,"Terrain blocked");if(this.nav.occ[m])return f(!1,"Blocked by another object")}if(r.isHall){let h=!1;for(const d of this.map.sites)Math.hypot(d.x-(l+a/2),d.y-(c+o/2))<=5.5&&(h=!0);if(!h)return f(!1,"Core must be built on an expansion site");for(const d of this.ids)if(this.alive[d]&&F[this.type[d]].isHall&&Math.hypot(this.x[d]-(l+a/2),this.y[d]-(c+o/2))<12)return f(!1,"Too close to another core");return f(!0,"")}if(!this.nearestField(t,l+a/2,c+o/2))return f(!1,"Outside construction field");for(const h of this.ids){if(!this.alive[h]||this.owner[h]!==-1)continue;const d=this.type[h];if(!(d!==pt.ore_seam&&d!==pt.flux_vent)&&Math.hypot(this.x[h]-(l+a/2),this.y[h]-(c+o/2))<a/2+2.6)return f(!1,"Too close to a resource node")}return f(!0,"")}nearestField(t,e,n){for(const s of this.ids){if(!this.alive[s]||this.owner[s]!==t)continue;const r=F[this.type[s]];if(!(!r.isStruct||!r.def.field||!this.ext[s].done)&&Math.hypot(this.x[s]-e,this.y[s]-n)<=r.def.field)return!0}return!1}fieldRadiusFor(t){const e=[];for(const n of this.ids){if(!this.alive[n]||this.owner[n]!==t)continue;const s=F[this.type[n]];s.isStruct&&s.def.field&&this.ext[n].done&&e.push({x:this.x[n],y:this.y[n],r:s.def.field})}return e}placeStructure(t,e,n,s,r){const a=this.canPlace(t,e,n,s),o=F[e],l=this.players[t];if(!a.ok)return this.alert(t,"invalid",n,s,a.reason),-1;if(l.ore<o.def.cost.ore||l.flux<o.def.cost.flux)return this.alert(t,"invalid",n,s,"Not enough resources"),-1;l.ore-=o.def.cost.ore,l.flux-=o.def.cost.flux;const c=this.spawn(e,t,a.ox+a.w/2,a.oy+a.h/2,{done:!1,ox:a.ox,oy:a.oy,w:a.w,h:a.h}),u=this.ext[c];u.builder=r;for(const f of this.ids)!this.alive[f]||!F[this.type[f]].isUnit||F[this.type[f]].isHover||this.nav.fits(this.x[f],this.y[f],.15)||xa(this,f);return this.events.push({k:"placed",tick:this.tick,owner:t,x:this.x[c],y:this.y[c],id:c,a:e}),o.isHall&&this.players[t].stats.firstExpandTick<0&&this.countOf(t,o.def.id,!1)>1&&(this.players[t].stats.firstExpandTick=this.tick,this.recordTimeline(t,"Expansion started","expand")),c}completeStructure(t){const e=this.ext[t];e.done=!0,e.prog=e.total,this.hp[t]=F[this.type[t]].maxHp;const n=this.owner[t];this.events.push({k:"built",tick:this.tick,owner:n,x:this.x[t],y:this.y[t],id:t,a:this.type[t]}),this.recordTimeline(n,`${F[this.type[t]].def.name} completed`,"build"),this.updateSupply(),this.alert(n,"built",this.x[t],this.y[t],`${F[this.type[t]].def.name} complete`)}train(t,e,n){if(e<0||!this.alive[e]||this.owner[e]!==t)return;const s=this.ext[e],r=F[this.type[e]];if(!r.isStruct||!s.done||!oe[n])return;const a=oe[n];if(!r.def.produces?.includes(a.id))return;const o=this.players[t],l=this.missingReq(t,a.requires);if(l){this.alert(t,"invalid",this.x[e],this.y[e],`Requires ${l}`);return}if(s.q.length>=5){this.alert(t,"invalid",this.x[e],this.y[e],"Queue full");return}if(o.ore<a.cost.ore){this.alert(t,"invalid",this.x[e],this.y[e],"Not enough Prism Ore");return}if(o.flux<a.cost.flux){this.alert(t,"invalid",this.x[e],this.y[e],"Not enough Flux");return}o.ore-=a.cost.ore,o.flux-=a.cost.flux;const c=gi(a.buildTime);s.q.push({kind:"unit",idx:n,left:c,total:c,started:!1,paused:""})}research(t,e,n){if(e<0||!this.alive[e]||this.owner[e]!==t)return;const s=this.ext[e],r=F[this.type[e]],a=ze[n];if(!a||!r.isStruct||!s.done||!r.def.researches?.includes(a.id))return;const o=this.players[t];if(o.upg[n])return;for(const u of this.ids)if(this.alive[u]&&this.owner[u]===t){for(const f of this.ext[u].q)if(f.kind==="research"&&f.idx===n)return}const l=this.missingReq(t,a.requires);if(l){this.alert(t,"invalid",this.x[e],this.y[e],`Requires ${l}`);return}if(s.q.length>=5)return;if(o.ore<a.cost.ore||o.flux<a.cost.flux){this.alert(t,"invalid",this.x[e],this.y[e],o.ore<a.cost.ore?"Not enough Prism Ore":"Not enough Flux");return}o.ore-=a.cost.ore,o.flux-=a.cost.flux;const c=gi(a.time);s.q.push({kind:"research",idx:n,left:c,total:c,started:!0,paused:""})}cancelQueue(t,e,n){if(e<0||!this.alive[e]||this.owner[e]!==t)return;const s=this.ext[e],r=F[this.type[e]];if(n<0||!s.done){if(!s.done&&r.isStruct){const l=this.players[t];l.ore+=Math.floor(r.def.cost.ore*.75),l.flux+=Math.floor(r.def.cost.flux*.75),s.q=[],this.alive[e]=0,this.nav.setFootprint(s.ox,s.oy,s.fw,s.fh,-1),this.events.push({k:"death",tick:this.tick,owner:t,x:this.x[e],y:this.y[e],id:e,a:this.type[e],text:"cancel"}),this.players[t].stats.structures--}return}const a=s.q[n];if(!a)return;const o=this.players[t];if(a.kind==="unit"){const l=oe[a.idx];o.ore+=l.cost.ore,o.flux+=l.cost.flux}else{const l=ze[a.idx];o.ore+=l.cost.ore,o.flux+=l.cost.flux}s.q.splice(n,1)}updateProduction(){for(const t of this.ids){if(!this.alive[t]||!F[this.type[t]].isStruct)continue;const n=this.ext[t];if(!n.done||!n.q.length)continue;const s=this.owner[t],r=this.players[s],a=n.q[0];if(a.kind==="unit"){const o=oe[a.idx];if(this.missingReq(s,o.requires)){a.paused="requires";continue}if(!a.started){if(r.supplyUsed+o.supply>r.supplyCap){a.paused="supply",s===0&&this.supplyAlert(s,t);continue}a.started=!0,r.supplyUsed+=o.supply}a.paused=""}a.left--,a.left<=0&&(n.q.shift(),a.kind==="unit"?this.finishUnit(t,a.idx):this.finishResearch(s,a.idx))}}supplyAlert(t,e){this.alert(t,"supply",this.x[e],this.y[e],"Supply blocked: build more supply")}finishUnit(t,e){const n=this.ext[t],s=this.owner[t],r=F[e],a=this.x[t],o=this.y[t],l=n.hasRally?n.rallyX:Le/2,c=n.hasRally?n.rallyY:Le/2,u=Math.atan2(c-o,l-a),f=n.fw/2+r.def.radius+.3;let h=a+Math.cos(u)*f,d=o+Math.sin(u)*f;if(!r.isHover&&!this.nav.fits(h,d,r.def.radius*.6)){const x=this.nav.nearestWalkable(h,d,8);x&&(h=x.x,d=x.y)}const m=this.spawn(e,s,h,d,{face:u});if(this.events.push({k:"trained",tick:this.tick,owner:s,x:h,y:d,id:m,a:e}),this.alert(s,"trained",h,d,`${r.def.name} ready`),r.isWorker&&!n.hasRally){const x=this.nearestNode(a,o,"ore_seam");x>=0&&Math.hypot(this.x[x]-a,this.y[x]-o)<20&&this.ext[m].orders.push(this.newOrder(mt.Gather,this.x[x],this.y[x],x,0,0))}if(n.hasRally){const x=this.ext[m];if(n.rallyT>=0&&this.alive[n.rallyT]&&F[this.type[n.rallyT]].isNeutral&&r.isWorker)x.orders.push(this.newOrder(mt.Gather,this.x[n.rallyT],this.y[n.rallyT],n.rallyT,0,0));else if(r.isWorker&&this.rallyOnOre(n)){const g=this.nearestNode(n.rallyX,n.rallyY,"ore_seam");g>=0&&x.orders.push(this.newOrder(mt.Gather,this.x[g],this.y[g],g,0,0))}else x.orders.push(this.newOrder(mt.Move,n.rallyX,n.rallyY,-1,0,.8))}}rallyOnOre(t){const e=this.nearestNode(t.rallyX,t.rallyY,"ore_seam");return e>=0&&Math.hypot(this.x[e]-t.rallyX,this.y[e]-t.rallyY)<3}nearestNode(t,e,n){let s=-1,r=1e9;const a=pt[n];for(const o of this.ids){if(!this.alive[o]||this.type[o]!==a||this.ext[o].amount<=0)continue;const l=(this.x[o]-t)**2+(this.y[o]-e)**2;l<r&&(r=l,s=o)}return s}finishResearch(t,e){const n=this.players[t],s=ze[e];n.upg[e]=1,s.effect.kind==="unlock"&&s.effect.key&&n.unlocks.add(s.effect.key),this.recomputeUpgrades(t),this.events.push({k:"researched",tick:this.tick,owner:t,x:0,y:0,text:s.name,a:e}),this.recordTimeline(t,`Research: ${s.name}`,"tech"),this.alert(t,"researched",0,0,`${s.name} researched`)}recomputeUpgrades(t){const e=this.players[t];let n=0,s=0;ze.forEach((r,a)=>{e.upg[a]&&(r.effect.kind==="attack"&&(n+=r.effect.amount),r.effect.kind==="armor"&&(s+=r.effect.amount))}),e.atkBonus=n,e.armorBonus=s}alert(t,e,n,s,r){this.events.push({k:e==="invalid"?"invalid":"alert",tick:this.tick,owner:t,x:n,y:s,text:r,vis:e})}updateSupply(){for(const t of this.players)t.supplyUsed=0,t.supplyCap=0;for(const t of this.ids){if(!this.alive[t])continue;const e=this.owner[t];if(e<0)continue;const n=F[this.type[t]],s=this.players[e];if(n.isUnit)s.supplyUsed+=n.def.supply;else if(n.isStruct){const r=this.ext[t];r.done&&n.def.supplyProvided&&(s.supplyCap+=n.def.supplyProvided);for(const a of r.q)a.kind==="unit"&&a.started&&(s.supplyUsed+=oe[a.idx].supply)}}for(const t of this.players)t.supplyCap=Math.min(200,t.supplyCap)}updateVision(){const t=this.map;for(const n of this.players)n.vis.fill(0);const e=this.pulseActive();for(const n of this.ids){if(!this.alive[n])continue;const s=this.owner[n];let r;if(s>=0)r=[s];else if(F[this.type[n]].def.id==="watch_pylon"&&this.ext[n].capOwner>=0&&!this.pylonContested(n))r=[this.ext[n].capOwner];else continue;const a=F[this.type[n]];let o=a.def.sight;a.isStruct&&!this.ext[n].done&&(o=Math.min(o,4));for(const l of r)Wo(t,this.players[l].vis,this.x[n],this.y[n],o,a.isHover)}for(const n of this.effects)n.kind==="spike"&&this.tick<n.end&&Wo(t,this.players[n.owner].vis,n.x,n.y,n.r,!0);for(const n of this.players)e&&n.vis.fill(Fe),bh(n.vis,n.seen)}pylonContested(t){const e=this.ext[t];let n=0,s=0;return this.near(this.x[t],this.y[t],6,r=>{F[this.type[r]].isUnit&&(this.owner[r]===e.capOwner?n++:this.owner[r]>=0&&s++)}),s>0&&n===0}step(){if(this.over)return;this.tick++;const t=this.tick;for(const r of this.ids)this.px[r]=this.x[r],this.py[r]=this.y[r];if(this.nav.budget=3,this.queue.length){const r=this.queue.filter(a=>(a.tick??0)<=t).sort((a,o)=>a.tick-o.tick||a.seq-o.seq);this.queue=this.queue.filter(a=>(a.tick??0)>t);for(const a of r)this.log.push(a),this.applyCommand(a)}let e=this.prof?performance.now():0;this.rebuildHash(),this.prof&&(e=this.lap("hash",e));for(const r of this.players)r.ai&&r.alive&&r.ai.update(this);this.prof&&(e=this.lap("ai",e)),this.updateProduction();const n=this.ids.slice();for(const r of n){if(!this.alive[r])continue;const a=F[this.type[r]];a.isUnit?Uh(this,r):a.isStruct?Eh(this,r):this.updateNeutral(r)}this.prof&&(e=this.lap("units",e)),Th(this),Rh(this),this.rebuildHash(),this.prof&&(e=this.lap("proj",e)),$h(this),this.prof&&(e=this.lap("separate",e)),t>=Nr&&(t-Nr)%(90*Ms)===0&&(this.pulseUntil=t+2*Ms,this.events.push({k:"alert",tick:t,owner:-1,x:Le/2,y:Le/2,text:"Reveal pulse",vis:"pulse"})),(t%4===0||this.pulseActive())&&this.updateVision(),this.prof&&(e=this.lap("vision",e)),t%5===0&&this.updateSupply();let s=0;for(let r=0;r<this.ids.length;r++)this.alive[this.ids[r]]&&(this.ids[s++]=this.ids[r]);this.ids.length=s,t%200===0&&this.sampleStats(),t%100===0&&this.hashes.push([t,this.stateHash()]),this.checkVictory()}updateNeutral(t){const e=F[this.type[t]],n=this.ext[t];if(e.def.id==="salvage_pod"){let s=-1;this.near(this.x[t],this.y[t],1.8,r=>{s<0&&F[this.type[r]].isUnit&&this.owner[r]>=0&&(s=this.owner[r])}),s>=0&&(this.players[s].ore+=100,this.players[s].flux+=40,this.players[s].stats.ore+=100,this.players[s].stats.flux+=40,this.alive[t]=0,this.nav.setFootprint(n.ox,n.oy,n.fw,n.fh,-1),this.events.push({k:"pod",tick:this.tick,owner:s,x:this.x[t],y:this.y[t]}),this.alert(s,"pod",this.x[t],this.y[t],"Salvage pod: +100 Ore, +40 Flux"),this.recordTimeline(s,"Salvage pod collected","pod"))}e.def.id==="watch_pylon"&&n.capOwner>=0&&this.tick%10}sampleStats(){for(const t of this.players){let e=0,n=0;for(const s of this.ids){if(!this.alive[s]||this.owner[s]!==t.id)continue;const r=F[this.type[s]];r.isUnit&&!r.isWorker&&(e+=r.def.cost.ore+r.def.cost.flux),r.isWorker&&n++}t.stats.armySamples.push(e),t.stats.econSamples.push(t.stats.ore+t.stats.flux),t.stats.workersMax=Math.max(t.stats.workersMax,n)}}defeat(t){const e=this.players[t];e.alive&&(e.alive=!1,this.recordTimeline(t,"Defeated","end"),this.cfg.noVictory||(this.over=!0,this.winner=1-t,this.events.push({k:"victory",tick:this.tick,owner:this.winner,x:0,y:0}),this.recordTimeline(this.winner,"Victory","end")))}checkVictory(){if(!this.over)for(const t of this.players){if(!t.alive)continue;let e=0;for(const n of this.ids)this.alive[n]&&this.owner[n]===t.id&&F[this.type[n]].isHall&&e++;if(e===0){this.defeat(t.id);return}}}stateHash(){let t=2166136261;const e=n=>{t=Math.imul(t^(n|0),16777619)>>>0};e(this.tick);for(const n of this.ids)this.alive[n]&&(e(n),e(this.type[n]),e(this.owner[n]),e(Math.round(this.x[n]*64)),e(Math.round(this.y[n]*64)),e(Math.round(this.hp[n]*8)));for(const n of this.players)e(Math.round(n.ore)),e(Math.round(n.flux)),e(n.supplyUsed);return e(this.rngState),t>>>0}queueInfo(t){return this.ext[t].q}gatherBonus(){return this.tick>=Nr?1.15:1}seconds(){return this.tick/Ms}}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const mo="170",Yh=0,Xo=1,jh=2,go=1,yc=2,On=3,ri=0,Ze=1,sn=2,ii=0,Wi=1,ws=2,qo=3,Yo=4,Kh=5,xi=100,Zh=101,Jh=102,Qh=103,tu=104,eu=200,nu=201,iu=202,su=203,va=204,_a=205,ru=206,au=207,ou=208,lu=209,cu=210,hu=211,uu=212,du=213,fu=214,ba=0,Ma=1,Sa=2,ji=3,wa=4,Ea=5,Ta=6,Aa=7,vc=0,pu=1,mu=2,si=0,gu=1,xu=2,yu=3,_c=4,vu=5,_u=6,bu=7,bc=300,Ki=301,Zi=302,Ra=303,Ca=304,Sr=306,Pa=1e3,ei=1001,ka=1002,He=1003,Mu=1004,Fs=1005,dn=1006,Fr=1007,vi=1008,Pn=1009,Mc=1010,Sc=1011,Cs=1012,xo=1013,_i=1014,Cn=1015,ks=1016,yo=1017,vo=1018,Ji=1020,wc=35902,Ec=1021,Tc=1022,fn=1023,Ac=1024,Rc=1025,$i=1026,Qi=1027,wr=1028,_o=1029,Cc=1030,bo=1031,Mo=1033,cr=33776,hr=33777,ur=33778,dr=33779,La=35840,Ua=35841,Da=35842,Ia=35843,Na=36196,Fa=37492,Oa=37496,Ba=37808,za=37809,Ha=37810,Ga=37811,Va=37812,Wa=37813,$a=37814,Xa=37815,qa=37816,Ya=37817,ja=37818,Ka=37819,Za=37820,Ja=37821,fr=36492,Qa=36494,to=36495,Pc=36283,eo=36284,no=36285,io=36286,Su=3200,wu=3201,kc=0,Eu=1,ti="",Be="srgb",es="srgb-linear",Er="linear",ae="srgb",Ei=7680,jo=519,Tu=512,Au=513,Ru=514,Lc=515,Cu=516,Pu=517,ku=518,Lu=519,Ko=35044,Zo=35048,Jo="300 es",Bn=2e3,yr=2001;class ns{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const s=this._listeners[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}}const De=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],Or=Math.PI/180,so=180/Math.PI;function Ls(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(De[i&255]+De[i>>8&255]+De[i>>16&255]+De[i>>24&255]+"-"+De[t&255]+De[t>>8&255]+"-"+De[t>>16&15|64]+De[t>>24&255]+"-"+De[e&63|128]+De[e>>8&255]+"-"+De[e>>16&255]+De[e>>24&255]+De[n&255]+De[n>>8&255]+De[n>>16&255]+De[n>>24&255]).toLowerCase()}function Ke(i,t,e){return Math.max(t,Math.min(e,i))}function Uu(i,t){return(i%t+t)%t}function Br(i,t,e){return(1-e)*i+e*t}function ds(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function We(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class Yt{constructor(t=0,e=0){Yt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ke(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Vt{constructor(t,e,n,s,r,a,o,l,c){Vt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){const u=this.elements;return u[0]=t,u[1]=s,u[2]=o,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],f=n[7],h=n[2],d=n[5],m=n[8],x=s[0],g=s[3],p=s[6],_=s[1],y=s[4],v=s[7],A=s[2],R=s[5],w=s[8];return r[0]=a*x+o*_+l*A,r[3]=a*g+o*y+l*R,r[6]=a*p+o*v+l*w,r[1]=c*x+u*_+f*A,r[4]=c*g+u*y+f*R,r[7]=c*p+u*v+f*w,r[2]=h*x+d*_+m*A,r[5]=h*g+d*y+m*R,r[8]=h*p+d*v+m*w,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*a*u-e*o*c-n*r*u+n*o*l+s*r*c-s*a*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],f=u*a-o*c,h=o*l-u*r,d=c*r-a*l,m=e*f+n*h+s*d;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/m;return t[0]=f*x,t[1]=(s*c-u*n)*x,t[2]=(o*n-s*a)*x,t[3]=h*x,t[4]=(u*e-s*l)*x,t[5]=(s*r-o*e)*x,t[6]=d*x,t[7]=(n*l-c*e)*x,t[8]=(a*e-n*r)*x,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(zr.makeScale(t,e)),this}rotate(t){return this.premultiply(zr.makeRotation(-t)),this}translate(t,e){return this.premultiply(zr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const zr=new Vt;function Uc(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function vr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Du(){const i=vr("canvas");return i.style.display="block",i}const Qo={};function _s(i){i in Qo||(Qo[i]=!0,console.warn(i))}function Iu(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}function Nu(i){const t=i.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Fu(i){const t=i.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const Qt={enabled:!0,workingColorSpace:es,spaces:{},convert:function(i,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===ae&&(i.r=Hn(i.r),i.g=Hn(i.g),i.b=Hn(i.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(i.applyMatrix3(this.spaces[t].toXYZ),i.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===ae&&(i.r=Xi(i.r),i.g=Xi(i.g),i.b=Xi(i.b))),i},fromWorkingColorSpace:function(i,t){return this.convert(i,this.workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this.workingColorSpace)},getPrimaries:function(i){return this.spaces[i].primaries},getTransfer:function(i){return i===ti?Er:this.spaces[i].transfer},getLuminanceCoefficients:function(i,t=this.workingColorSpace){return i.fromArray(this.spaces[t].luminanceCoefficients)},define:function(i){Object.assign(this.spaces,i)},_getMatrix:function(i,t,e){return i.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(i){return this.spaces[i].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(i=this.workingColorSpace){return this.spaces[i].workingColorSpaceConfig.unpackColorSpace}};function Hn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Xi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const tl=[.64,.33,.3,.6,.15,.06],el=[.2126,.7152,.0722],nl=[.3127,.329],il=new Vt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),sl=new Vt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Qt.define({[es]:{primaries:tl,whitePoint:nl,transfer:Er,toXYZ:il,fromXYZ:sl,luminanceCoefficients:el,workingColorSpaceConfig:{unpackColorSpace:Be},outputColorSpaceConfig:{drawingBufferColorSpace:Be}},[Be]:{primaries:tl,whitePoint:nl,transfer:ae,toXYZ:il,fromXYZ:sl,luminanceCoefficients:el,outputColorSpaceConfig:{drawingBufferColorSpace:Be}}});let Ti;class Ou{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Ti===void 0&&(Ti=vr("canvas")),Ti.width=t.width,Ti.height=t.height;const n=Ti.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Ti}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=vr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Hn(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Hn(e[n]/255)*255):e[n]=Hn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Bu=0;class Dc{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Bu++}),this.uuid=Ls(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Hr(s[a].image)):r.push(Hr(s[a]))}else r=Hr(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Hr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Ou.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let zu=0;class Ge extends ns{constructor(t=Ge.DEFAULT_IMAGE,e=Ge.DEFAULT_MAPPING,n=ei,s=ei,r=dn,a=vi,o=fn,l=Pn,c=Ge.DEFAULT_ANISOTROPY,u=ti){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:zu++}),this.uuid=Ls(),this.name="",this.source=new Dc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Yt(0,0),this.repeat=new Yt(1,1),this.center=new Yt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Vt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==bc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Pa:t.x=t.x-Math.floor(t.x);break;case ei:t.x=t.x<0?0:1;break;case ka:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Pa:t.y=t.y-Math.floor(t.y);break;case ei:t.y=t.y<0?0:1;break;case ka:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Ge.DEFAULT_IMAGE=null;Ge.DEFAULT_MAPPING=bc;Ge.DEFAULT_ANISOTROPY=1;class ve{constructor(t=0,e=0,n=0,s=1){ve.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],u=l[4],f=l[8],h=l[1],d=l[5],m=l[9],x=l[2],g=l[6],p=l[10];if(Math.abs(u-h)<.01&&Math.abs(f-x)<.01&&Math.abs(m-g)<.01){if(Math.abs(u+h)<.1&&Math.abs(f+x)<.1&&Math.abs(m+g)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const y=(c+1)/2,v=(d+1)/2,A=(p+1)/2,R=(u+h)/4,w=(f+x)/4,E=(m+g)/4;return y>v&&y>A?y<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(y),s=R/n,r=w/n):v>A?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=R/s,r=E/s):A<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(A),n=w/r,s=E/r),this.set(n,s,r,e),this}let _=Math.sqrt((g-m)*(g-m)+(f-x)*(f-x)+(h-u)*(h-u));return Math.abs(_)<.001&&(_=1),this.x=(g-m)/_,this.y=(f-x)/_,this.z=(h-u)/_,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Hu extends ns{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new ve(0,0,t,e),this.scissorTest=!1,this.viewport=new ve(0,0,t,e);const s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:dn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const r=new Ge(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new Dc(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class bi extends Hu{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Ic extends Ge{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=He,this.minFilter=He,this.wrapR=ei,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Gu extends Ge{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=He,this.minFilter=He,this.wrapR=ei,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Us{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],u=n[s+2],f=n[s+3];const h=r[a+0],d=r[a+1],m=r[a+2],x=r[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f;return}if(o===1){t[e+0]=h,t[e+1]=d,t[e+2]=m,t[e+3]=x;return}if(f!==x||l!==h||c!==d||u!==m){let g=1-o;const p=l*h+c*d+u*m+f*x,_=p>=0?1:-1,y=1-p*p;if(y>Number.EPSILON){const A=Math.sqrt(y),R=Math.atan2(A,p*_);g=Math.sin(g*R)/A,o=Math.sin(o*R)/A}const v=o*_;if(l=l*g+h*v,c=c*g+d*v,u=u*g+m*v,f=f*g+x*v,g===1-o){const A=1/Math.sqrt(l*l+c*c+u*u+f*f);l*=A,c*=A,u*=A,f*=A}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,s,r,a){const o=n[s],l=n[s+1],c=n[s+2],u=n[s+3],f=r[a],h=r[a+1],d=r[a+2],m=r[a+3];return t[e]=o*m+u*f+l*d-c*h,t[e+1]=l*m+u*h+c*f-o*d,t[e+2]=c*m+u*d+o*h-l*f,t[e+3]=u*m-o*f-l*h-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(s/2),f=o(r/2),h=l(n/2),d=l(s/2),m=l(r/2);switch(a){case"XYZ":this._x=h*u*f+c*d*m,this._y=c*d*f-h*u*m,this._z=c*u*m+h*d*f,this._w=c*u*f-h*d*m;break;case"YXZ":this._x=h*u*f+c*d*m,this._y=c*d*f-h*u*m,this._z=c*u*m-h*d*f,this._w=c*u*f+h*d*m;break;case"ZXY":this._x=h*u*f-c*d*m,this._y=c*d*f+h*u*m,this._z=c*u*m+h*d*f,this._w=c*u*f-h*d*m;break;case"ZYX":this._x=h*u*f-c*d*m,this._y=c*d*f+h*u*m,this._z=c*u*m-h*d*f,this._w=c*u*f+h*d*m;break;case"YZX":this._x=h*u*f+c*d*m,this._y=c*d*f+h*u*m,this._z=c*u*m-h*d*f,this._w=c*u*f-h*d*m;break;case"XZY":this._x=h*u*f-c*d*m,this._y=c*d*f-h*u*m,this._z=c*u*m+h*d*f,this._w=c*u*f+h*d*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],u=e[6],f=e[10],h=n+o+f;if(h>0){const d=.5/Math.sqrt(h+1);this._w=.25/d,this._x=(u-l)*d,this._y=(r-c)*d,this._z=(a-s)*d}else if(n>o&&n>f){const d=2*Math.sqrt(1+n-o-f);this._w=(u-l)/d,this._x=.25*d,this._y=(s+a)/d,this._z=(r+c)/d}else if(o>f){const d=2*Math.sqrt(1+o-n-f);this._w=(r-c)/d,this._x=(s+a)/d,this._y=.25*d,this._z=(l+u)/d}else{const d=2*Math.sqrt(1+f-n-o);this._w=(a-s)/d,this._x=(r+c)/d,this._y=(l+u)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Ke(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+a*o+s*c-r*l,this._y=s*u+a*l+r*o-n*c,this._z=r*u+a*c+n*l-s*o,this._w=a*u-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,s=this._y,r=this._z,a=this._w;let o=a*t._w+n*t._x+s*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;const l=1-o*o;if(l<=Number.EPSILON){const d=1-e;return this._w=d*a+e*this._w,this._x=d*n+e*this._x,this._y=d*s+e*this._y,this._z=d*r+e*this._z,this.normalize(),this}const c=Math.sqrt(l),u=Math.atan2(c,o),f=Math.sin((1-e)*u)/c,h=Math.sin(e*u)/c;return this._w=a*f+this._w*h,this._x=n*f+this._x*h,this._y=s*f+this._y*h,this._z=r*f+this._z*h,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class O{constructor(t=0,e=0,n=0){O.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(rl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(rl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),u=2*(o*e-r*s),f=2*(r*n-a*e);return this.x=e+l*c+a*f-o*u,this.y=n+l*u+o*c-r*f,this.z=s+l*f+r*u-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Gr.copy(this).projectOnVector(t),this.sub(Gr)}reflect(t){return this.sub(Gr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Ke(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Gr=new O,rl=new Us;class Si{constructor(t=new O(1/0,1/0,1/0),e=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(xn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(xn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=xn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,xn):xn.fromBufferAttribute(r,a),xn.applyMatrix4(t.matrixWorld),this.expandByPoint(xn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Os.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Os.copy(n.boundingBox)),Os.applyMatrix4(t.matrixWorld),this.union(Os)}const s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,xn),xn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(fs),Bs.subVectors(this.max,fs),Ai.subVectors(t.a,fs),Ri.subVectors(t.b,fs),Ci.subVectors(t.c,fs),Yn.subVectors(Ri,Ai),jn.subVectors(Ci,Ri),li.subVectors(Ai,Ci);let e=[0,-Yn.z,Yn.y,0,-jn.z,jn.y,0,-li.z,li.y,Yn.z,0,-Yn.x,jn.z,0,-jn.x,li.z,0,-li.x,-Yn.y,Yn.x,0,-jn.y,jn.x,0,-li.y,li.x,0];return!Vr(e,Ai,Ri,Ci,Bs)||(e=[1,0,0,0,1,0,0,0,1],!Vr(e,Ai,Ri,Ci,Bs))?!1:(zs.crossVectors(Yn,jn),e=[zs.x,zs.y,zs.z],Vr(e,Ai,Ri,Ci,Bs))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,xn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(xn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Un[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Un[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Un[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Un[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Un[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Un[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Un[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Un[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Un),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Un=[new O,new O,new O,new O,new O,new O,new O,new O],xn=new O,Os=new Si,Ai=new O,Ri=new O,Ci=new O,Yn=new O,jn=new O,li=new O,fs=new O,Bs=new O,zs=new O,ci=new O;function Vr(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){ci.fromArray(i,r);const o=s.x*Math.abs(ci.x)+s.y*Math.abs(ci.y)+s.z*Math.abs(ci.z),l=t.dot(ci),c=e.dot(ci),u=n.dot(ci);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const Vu=new Si,ps=new O,Wr=new O;class is{constructor(t=new O,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Vu.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;ps.subVectors(t,this.center);const e=ps.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(ps,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Wr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(ps.copy(t.center).add(Wr)),this.expandByPoint(ps.copy(t.center).sub(Wr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Dn=new O,$r=new O,Hs=new O,Kn=new O,Xr=new O,Gs=new O,qr=new O;class So{constructor(t=new O,e=new O(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Dn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Dn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Dn.copy(this.origin).addScaledVector(this.direction,e),Dn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){$r.copy(t).add(e).multiplyScalar(.5),Hs.copy(e).sub(t).normalize(),Kn.copy(this.origin).sub($r);const r=t.distanceTo(e)*.5,a=-this.direction.dot(Hs),o=Kn.dot(this.direction),l=-Kn.dot(Hs),c=Kn.lengthSq(),u=Math.abs(1-a*a);let f,h,d,m;if(u>0)if(f=a*l-o,h=a*o-l,m=r*u,f>=0)if(h>=-m)if(h<=m){const x=1/u;f*=x,h*=x,d=f*(f+a*h+2*o)+h*(a*f+h+2*l)+c}else h=r,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;else h=-r,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;else h<=-m?(f=Math.max(0,-(-a*r+o)),h=f>0?-r:Math.min(Math.max(-r,-l),r),d=-f*f+h*(h+2*l)+c):h<=m?(f=0,h=Math.min(Math.max(-r,-l),r),d=h*(h+2*l)+c):(f=Math.max(0,-(a*r+o)),h=f>0?r:Math.min(Math.max(-r,-l),r),d=-f*f+h*(h+2*l)+c);else h=a>0?-r:r,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy($r).addScaledVector(Hs,h),d}intersectSphere(t,e){Dn.subVectors(t.center,this.origin);const n=Dn.dot(this.direction),s=Dn.dot(Dn)-n*n,r=t.radius*t.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l;const c=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,h=this.origin;return c>=0?(n=(t.min.x-h.x)*c,s=(t.max.x-h.x)*c):(n=(t.max.x-h.x)*c,s=(t.min.x-h.x)*c),u>=0?(r=(t.min.y-h.y)*u,a=(t.max.y-h.y)*u):(r=(t.max.y-h.y)*u,a=(t.min.y-h.y)*u),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(t.min.z-h.z)*f,l=(t.max.z-h.z)*f):(o=(t.max.z-h.z)*f,l=(t.min.z-h.z)*f),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Dn)!==null}intersectTriangle(t,e,n,s,r){Xr.subVectors(e,t),Gs.subVectors(n,t),qr.crossVectors(Xr,Gs);let a=this.direction.dot(qr),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Kn.subVectors(this.origin,t);const l=o*this.direction.dot(Gs.crossVectors(Kn,Gs));if(l<0)return null;const c=o*this.direction.dot(Xr.cross(Kn));if(c<0||l+c>a)return null;const u=-o*Kn.dot(qr);return u<0?null:this.at(u/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class le{constructor(t,e,n,s,r,a,o,l,c,u,f,h,d,m,x,g){le.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,u,f,h,d,m,x,g)}set(t,e,n,s,r,a,o,l,c,u,f,h,d,m,x,g){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=s,p[1]=r,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=u,p[10]=f,p[14]=h,p[3]=d,p[7]=m,p[11]=x,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new le().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,s=1/Pi.setFromMatrixColumn(t,0).length(),r=1/Pi.setFromMatrixColumn(t,1).length(),a=1/Pi.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){const h=a*u,d=a*f,m=o*u,x=o*f;e[0]=l*u,e[4]=-l*f,e[8]=c,e[1]=d+m*c,e[5]=h-x*c,e[9]=-o*l,e[2]=x-h*c,e[6]=m+d*c,e[10]=a*l}else if(t.order==="YXZ"){const h=l*u,d=l*f,m=c*u,x=c*f;e[0]=h+x*o,e[4]=m*o-d,e[8]=a*c,e[1]=a*f,e[5]=a*u,e[9]=-o,e[2]=d*o-m,e[6]=x+h*o,e[10]=a*l}else if(t.order==="ZXY"){const h=l*u,d=l*f,m=c*u,x=c*f;e[0]=h-x*o,e[4]=-a*f,e[8]=m+d*o,e[1]=d+m*o,e[5]=a*u,e[9]=x-h*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const h=a*u,d=a*f,m=o*u,x=o*f;e[0]=l*u,e[4]=m*c-d,e[8]=h*c+x,e[1]=l*f,e[5]=x*c+h,e[9]=d*c-m,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const h=a*l,d=a*c,m=o*l,x=o*c;e[0]=l*u,e[4]=x-h*f,e[8]=m*f+d,e[1]=f,e[5]=a*u,e[9]=-o*u,e[2]=-c*u,e[6]=d*f+m,e[10]=h-x*f}else if(t.order==="XZY"){const h=a*l,d=a*c,m=o*l,x=o*c;e[0]=l*u,e[4]=-f,e[8]=c*u,e[1]=h*f+x,e[5]=a*u,e[9]=d*f-m,e[2]=m*f-d,e[6]=o*u,e[10]=x*f+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Wu,t,$u)}lookAt(t,e,n){const s=this.elements;return Qe.subVectors(t,e),Qe.lengthSq()===0&&(Qe.z=1),Qe.normalize(),Zn.crossVectors(n,Qe),Zn.lengthSq()===0&&(Math.abs(n.z)===1?Qe.x+=1e-4:Qe.z+=1e-4,Qe.normalize(),Zn.crossVectors(n,Qe)),Zn.normalize(),Vs.crossVectors(Qe,Zn),s[0]=Zn.x,s[4]=Vs.x,s[8]=Qe.x,s[1]=Zn.y,s[5]=Vs.y,s[9]=Qe.y,s[2]=Zn.z,s[6]=Vs.z,s[10]=Qe.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],f=n[5],h=n[9],d=n[13],m=n[2],x=n[6],g=n[10],p=n[14],_=n[3],y=n[7],v=n[11],A=n[15],R=s[0],w=s[4],E=s[8],M=s[12],b=s[1],P=s[5],D=s[9],N=s[13],$=s[2],j=s[6],X=s[10],q=s[14],G=s[3],nt=s[7],ut=s[11],B=s[15];return r[0]=a*R+o*b+l*$+c*G,r[4]=a*w+o*P+l*j+c*nt,r[8]=a*E+o*D+l*X+c*ut,r[12]=a*M+o*N+l*q+c*B,r[1]=u*R+f*b+h*$+d*G,r[5]=u*w+f*P+h*j+d*nt,r[9]=u*E+f*D+h*X+d*ut,r[13]=u*M+f*N+h*q+d*B,r[2]=m*R+x*b+g*$+p*G,r[6]=m*w+x*P+g*j+p*nt,r[10]=m*E+x*D+g*X+p*ut,r[14]=m*M+x*N+g*q+p*B,r[3]=_*R+y*b+v*$+A*G,r[7]=_*w+y*P+v*j+A*nt,r[11]=_*E+y*D+v*X+A*ut,r[15]=_*M+y*N+v*q+A*B,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],u=t[2],f=t[6],h=t[10],d=t[14],m=t[3],x=t[7],g=t[11],p=t[15];return m*(+r*l*f-s*c*f-r*o*h+n*c*h+s*o*d-n*l*d)+x*(+e*l*d-e*c*h+r*a*h-s*a*d+s*c*u-r*l*u)+g*(+e*c*f-e*o*d-r*a*f+n*a*d+r*o*u-n*c*u)+p*(-s*o*u-e*l*f+e*o*h+s*a*f-n*a*h+n*l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],f=t[9],h=t[10],d=t[11],m=t[12],x=t[13],g=t[14],p=t[15],_=f*g*c-x*h*c+x*l*d-o*g*d-f*l*p+o*h*p,y=m*h*c-u*g*c-m*l*d+a*g*d+u*l*p-a*h*p,v=u*x*c-m*f*c+m*o*d-a*x*d-u*o*p+a*f*p,A=m*f*l-u*x*l-m*o*h+a*x*h+u*o*g-a*f*g,R=e*_+n*y+s*v+r*A;if(R===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const w=1/R;return t[0]=_*w,t[1]=(x*h*r-f*g*r-x*s*d+n*g*d+f*s*p-n*h*p)*w,t[2]=(o*g*r-x*l*r+x*s*c-n*g*c-o*s*p+n*l*p)*w,t[3]=(f*l*r-o*h*r-f*s*c+n*h*c+o*s*d-n*l*d)*w,t[4]=y*w,t[5]=(u*g*r-m*h*r+m*s*d-e*g*d-u*s*p+e*h*p)*w,t[6]=(m*l*r-a*g*r-m*s*c+e*g*c+a*s*p-e*l*p)*w,t[7]=(a*h*r-u*l*r+u*s*c-e*h*c-a*s*d+e*l*d)*w,t[8]=v*w,t[9]=(m*f*r-u*x*r-m*n*d+e*x*d+u*n*p-e*f*p)*w,t[10]=(a*x*r-m*o*r+m*n*c-e*x*c-a*n*p+e*o*p)*w,t[11]=(u*o*r-a*f*r-u*n*c+e*f*c+a*n*d-e*o*d)*w,t[12]=A*w,t[13]=(u*x*s-m*f*s+m*n*h-e*x*h-u*n*g+e*f*g)*w,t[14]=(m*o*s-a*x*s-m*n*l+e*x*l+a*n*g-e*o*g)*w,t[15]=(a*f*s-u*o*s+u*n*l-e*f*l-a*n*h+e*o*h)*w,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,u=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,u*o+n,u*l-s*a,0,c*l-s*o,u*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,u=a+a,f=o+o,h=r*c,d=r*u,m=r*f,x=a*u,g=a*f,p=o*f,_=l*c,y=l*u,v=l*f,A=n.x,R=n.y,w=n.z;return s[0]=(1-(x+p))*A,s[1]=(d+v)*A,s[2]=(m-y)*A,s[3]=0,s[4]=(d-v)*R,s[5]=(1-(h+p))*R,s[6]=(g+_)*R,s[7]=0,s[8]=(m+y)*w,s[9]=(g-_)*w,s[10]=(1-(h+x))*w,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;let r=Pi.set(s[0],s[1],s[2]).length();const a=Pi.set(s[4],s[5],s[6]).length(),o=Pi.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],yn.copy(this);const c=1/r,u=1/a,f=1/o;return yn.elements[0]*=c,yn.elements[1]*=c,yn.elements[2]*=c,yn.elements[4]*=u,yn.elements[5]*=u,yn.elements[6]*=u,yn.elements[8]*=f,yn.elements[9]*=f,yn.elements[10]*=f,e.setFromRotationMatrix(yn),n.x=r,n.y=a,n.z=o,this}makePerspective(t,e,n,s,r,a,o=Bn){const l=this.elements,c=2*r/(e-t),u=2*r/(n-s),f=(e+t)/(e-t),h=(n+s)/(n-s);let d,m;if(o===Bn)d=-(a+r)/(a-r),m=-2*a*r/(a-r);else if(o===yr)d=-a/(a-r),m=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=f,l[12]=0,l[1]=0,l[5]=u,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=d,l[14]=m,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=Bn){const l=this.elements,c=1/(e-t),u=1/(n-s),f=1/(a-r),h=(e+t)*c,d=(n+s)*u;let m,x;if(o===Bn)m=(a+r)*f,x=-2*f;else if(o===yr)m=r*f,x=-1*f;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-h,l[1]=0,l[5]=2*u,l[9]=0,l[13]=-d,l[2]=0,l[6]=0,l[10]=x,l[14]=-m,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Pi=new O,yn=new le,Wu=new O(0,0,0),$u=new O(1,1,1),Zn=new O,Vs=new O,Qe=new O,al=new le,ol=new Us;class wn{constructor(t=0,e=0,n=0,s=wn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],u=s[9],f=s[2],h=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(Ke(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ke(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ke(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Ke(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(h,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Ke(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-Ke(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return al.makeRotationFromQuaternion(t),this.setFromRotationMatrix(al,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return ol.setFromEuler(this),this.setFromQuaternion(ol,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}wn.DEFAULT_ORDER="XYZ";class wo{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Xu=0;const ll=new O,ki=new Us,In=new le,Ws=new O,ms=new O,qu=new O,Yu=new Us,cl=new O(1,0,0),hl=new O(0,1,0),ul=new O(0,0,1),dl={type:"added"},ju={type:"removed"},Li={type:"childadded",child:null},Yr={type:"childremoved",child:null};class we extends ns{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Xu++}),this.uuid=Ls(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=we.DEFAULT_UP.clone();const t=new O,e=new wn,n=new Us,s=new O(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new le},normalMatrix:{value:new Vt}}),this.matrix=new le,this.matrixWorld=new le,this.matrixAutoUpdate=we.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=we.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new wo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ki.setFromAxisAngle(t,e),this.quaternion.multiply(ki),this}rotateOnWorldAxis(t,e){return ki.setFromAxisAngle(t,e),this.quaternion.premultiply(ki),this}rotateX(t){return this.rotateOnAxis(cl,t)}rotateY(t){return this.rotateOnAxis(hl,t)}rotateZ(t){return this.rotateOnAxis(ul,t)}translateOnAxis(t,e){return ll.copy(t).applyQuaternion(this.quaternion),this.position.add(ll.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(cl,t)}translateY(t){return this.translateOnAxis(hl,t)}translateZ(t){return this.translateOnAxis(ul,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(In.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Ws.copy(t):Ws.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),ms.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?In.lookAt(ms,Ws,this.up):In.lookAt(Ws,ms,this.up),this.quaternion.setFromRotationMatrix(In),s&&(In.extractRotation(s.matrixWorld),ki.setFromRotationMatrix(In),this.quaternion.premultiply(ki.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(dl),Li.child=t,this.dispatchEvent(Li),Li.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(ju),Yr.child=t,this.dispatchEvent(Yr),Yr.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),In.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),In.multiply(t.parent.matrixWorld)),t.applyMatrix4(In),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(dl),Li.child=t,this.dispatchEvent(Li),Li.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ms,t,qu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ms,Yu,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const f=l[c];r(t.shapes,f)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),u=a(t.images),f=a(t.shapes),h=a(t.skeletons),d=a(t.animations),m=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),h.length>0&&(n.skeletons=h),d.length>0&&(n.animations=d),m.length>0&&(n.nodes=m)}return n.object=s,n;function a(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}}we.DEFAULT_UP=new O(0,1,0);we.DEFAULT_MATRIX_AUTO_UPDATE=!0;we.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const vn=new O,Nn=new O,jr=new O,Fn=new O,Ui=new O,Di=new O,fl=new O,Kr=new O,Zr=new O,Jr=new O,Qr=new ve,ta=new ve,ea=new ve;class Mn{constructor(t=new O,e=new O,n=new O){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),vn.subVectors(t,e),s.cross(vn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){vn.subVectors(s,e),Nn.subVectors(n,e),jr.subVectors(t,e);const a=vn.dot(vn),o=vn.dot(Nn),l=vn.dot(jr),c=Nn.dot(Nn),u=Nn.dot(jr),f=a*c-o*o;if(f===0)return r.set(0,0,0),null;const h=1/f,d=(c*l-o*u)*h,m=(a*u-o*l)*h;return r.set(1-d-m,m,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Fn)===null?!1:Fn.x>=0&&Fn.y>=0&&Fn.x+Fn.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,Fn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Fn.x),l.addScaledVector(a,Fn.y),l.addScaledVector(o,Fn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return Qr.setScalar(0),ta.setScalar(0),ea.setScalar(0),Qr.fromBufferAttribute(t,e),ta.fromBufferAttribute(t,n),ea.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(Qr,r.x),a.addScaledVector(ta,r.y),a.addScaledVector(ea,r.z),a}static isFrontFacing(t,e,n,s){return vn.subVectors(n,e),Nn.subVectors(t,e),vn.cross(Nn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return vn.subVectors(this.c,this.b),Nn.subVectors(this.a,this.b),vn.cross(Nn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Mn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Mn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return Mn.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return Mn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Mn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let a,o;Ui.subVectors(s,n),Di.subVectors(r,n),Kr.subVectors(t,n);const l=Ui.dot(Kr),c=Di.dot(Kr);if(l<=0&&c<=0)return e.copy(n);Zr.subVectors(t,s);const u=Ui.dot(Zr),f=Di.dot(Zr);if(u>=0&&f<=u)return e.copy(s);const h=l*f-u*c;if(h<=0&&l>=0&&u<=0)return a=l/(l-u),e.copy(n).addScaledVector(Ui,a);Jr.subVectors(t,r);const d=Ui.dot(Jr),m=Di.dot(Jr);if(m>=0&&d<=m)return e.copy(r);const x=d*c-l*m;if(x<=0&&c>=0&&m<=0)return o=c/(c-m),e.copy(n).addScaledVector(Di,o);const g=u*m-d*f;if(g<=0&&f-u>=0&&d-m>=0)return fl.subVectors(r,s),o=(f-u)/(f-u+(d-m)),e.copy(s).addScaledVector(fl,o);const p=1/(g+x+h);return a=x*p,o=h*p,e.copy(n).addScaledVector(Ui,a).addScaledVector(Di,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const Nc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Jn={h:0,s:0,l:0},$s={h:0,s:0,l:0};function na(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Wt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Be){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Qt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=Qt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Qt.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=Qt.workingColorSpace){if(t=Uu(t,1),e=Ke(e,0,1),n=Ke(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=na(a,r,t+1/3),this.g=na(a,r,t),this.b=na(a,r,t-1/3)}return Qt.toWorkingColorSpace(this,s),this}setStyle(t,e=Be){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Be){const n=Nc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Hn(t.r),this.g=Hn(t.g),this.b=Hn(t.b),this}copyLinearToSRGB(t){return this.r=Xi(t.r),this.g=Xi(t.g),this.b=Xi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Be){return Qt.fromWorkingColorSpace(Ie.copy(this),t),Math.round(Ke(Ie.r*255,0,255))*65536+Math.round(Ke(Ie.g*255,0,255))*256+Math.round(Ke(Ie.b*255,0,255))}getHexString(t=Be){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Qt.workingColorSpace){Qt.fromWorkingColorSpace(Ie.copy(this),e);const n=Ie.r,s=Ie.g,r=Ie.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let l,c;const u=(o+a)/2;if(o===a)l=0,c=0;else{const f=a-o;switch(c=u<=.5?f/(a+o):f/(2-a-o),a){case n:l=(s-r)/f+(s<r?6:0);break;case s:l=(r-n)/f+2;break;case r:l=(n-s)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=Qt.workingColorSpace){return Qt.fromWorkingColorSpace(Ie.copy(this),e),t.r=Ie.r,t.g=Ie.g,t.b=Ie.b,t}getStyle(t=Be){Qt.fromWorkingColorSpace(Ie.copy(this),t);const e=Ie.r,n=Ie.g,s=Ie.b;return t!==Be?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Jn),this.setHSL(Jn.h+t,Jn.s+e,Jn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Jn),t.getHSL($s);const n=Br(Jn.h,$s.h,e),s=Br(Jn.s,$s.s,e),r=Br(Jn.l,$s.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ie=new Wt;Wt.NAMES=Nc;let Ku=0;class ss extends ns{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ku++}),this.uuid=Ls(),this.name="",this.blending=Wi,this.side=ri,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=va,this.blendDst=_a,this.blendEquation=xi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Wt(0,0,0),this.blendAlpha=0,this.depthFunc=ji,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=jo,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ei,this.stencilZFail=Ei,this.stencilZPass=Ei,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Wi&&(n.blending=this.blending),this.side!==ri&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==va&&(n.blendSrc=this.blendSrc),this.blendDst!==_a&&(n.blendDst=this.blendDst),this.blendEquation!==xi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ji&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==jo&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ei&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ei&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ei&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(e){const r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class rn extends ss{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new Wt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new wn,this.combine=vc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Se=new O,Xs=new Yt;class me{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Ko,this.updateRanges=[],this.gpuType=Cn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Xs.fromBufferAttribute(this,e),Xs.applyMatrix3(t),this.setXY(e,Xs.x,Xs.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyMatrix3(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyMatrix4(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyNormalMatrix(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.transformDirection(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=ds(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=We(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=ds(e,this.array)),e}setX(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=ds(e,this.array)),e}setY(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=ds(e,this.array)),e}setZ(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=ds(e,this.array)),e}setW(t,e){return this.normalized&&(e=We(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array),s=We(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=We(e,this.array),n=We(n,this.array),s=We(s,this.array),r=We(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Ko&&(t.usage=this.usage),t}}class Fc extends me{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Oc extends me{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class _e extends me{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Zu=0;const cn=new le,ia=new we,Ii=new O,tn=new Si,gs=new Si,Ae=new O;class Re extends ns{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Zu++}),this.uuid=Ls(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Uc(t)?Oc:Fc)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Vt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return cn.makeRotationFromQuaternion(t),this.applyMatrix4(cn),this}rotateX(t){return cn.makeRotationX(t),this.applyMatrix4(cn),this}rotateY(t){return cn.makeRotationY(t),this.applyMatrix4(cn),this}rotateZ(t){return cn.makeRotationZ(t),this.applyMatrix4(cn),this}translate(t,e,n){return cn.makeTranslation(t,e,n),this.applyMatrix4(cn),this}scale(t,e,n){return cn.makeScale(t,e,n),this.applyMatrix4(cn),this}lookAt(t){return ia.lookAt(t),ia.updateMatrix(),this.applyMatrix4(ia.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ii).negate(),this.translate(Ii.x,Ii.y,Ii.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new _e(n,3))}else{for(let n=0,s=e.count;n<s;n++){const r=t[n];e.setXYZ(n,r.x,r.y,r.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Si);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];tn.setFromBufferAttribute(r),this.morphTargetsRelative?(Ae.addVectors(this.boundingBox.min,tn.min),this.boundingBox.expandByPoint(Ae),Ae.addVectors(this.boundingBox.max,tn.max),this.boundingBox.expandByPoint(Ae)):(this.boundingBox.expandByPoint(tn.min),this.boundingBox.expandByPoint(tn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new is);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(t){const n=this.boundingSphere.center;if(tn.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];gs.setFromBufferAttribute(o),this.morphTargetsRelative?(Ae.addVectors(tn.min,gs.min),tn.expandByPoint(Ae),Ae.addVectors(tn.max,gs.max),tn.expandByPoint(Ae)):(tn.expandByPoint(gs.min),tn.expandByPoint(gs.max))}tn.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Ae.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Ae));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Ae.fromBufferAttribute(o,c),l&&(Ii.fromBufferAttribute(t,c),Ae.add(Ii)),s=Math.max(s,n.distanceToSquared(Ae))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new me(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let E=0;E<n.count;E++)o[E]=new O,l[E]=new O;const c=new O,u=new O,f=new O,h=new Yt,d=new Yt,m=new Yt,x=new O,g=new O;function p(E,M,b){c.fromBufferAttribute(n,E),u.fromBufferAttribute(n,M),f.fromBufferAttribute(n,b),h.fromBufferAttribute(r,E),d.fromBufferAttribute(r,M),m.fromBufferAttribute(r,b),u.sub(c),f.sub(c),d.sub(h),m.sub(h);const P=1/(d.x*m.y-m.x*d.y);isFinite(P)&&(x.copy(u).multiplyScalar(m.y).addScaledVector(f,-d.y).multiplyScalar(P),g.copy(f).multiplyScalar(d.x).addScaledVector(u,-m.x).multiplyScalar(P),o[E].add(x),o[M].add(x),o[b].add(x),l[E].add(g),l[M].add(g),l[b].add(g))}let _=this.groups;_.length===0&&(_=[{start:0,count:t.count}]);for(let E=0,M=_.length;E<M;++E){const b=_[E],P=b.start,D=b.count;for(let N=P,$=P+D;N<$;N+=3)p(t.getX(N+0),t.getX(N+1),t.getX(N+2))}const y=new O,v=new O,A=new O,R=new O;function w(E){A.fromBufferAttribute(s,E),R.copy(A);const M=o[E];y.copy(M),y.sub(A.multiplyScalar(A.dot(M))).normalize(),v.crossVectors(R,M);const P=v.dot(l[E])<0?-1:1;a.setXYZW(E,y.x,y.y,y.z,P)}for(let E=0,M=_.length;E<M;++E){const b=_[E],P=b.start,D=b.count;for(let N=P,$=P+D;N<$;N+=3)w(t.getX(N+0)),w(t.getX(N+1)),w(t.getX(N+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new me(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let h=0,d=n.count;h<d;h++)n.setXYZ(h,0,0,0);const s=new O,r=new O,a=new O,o=new O,l=new O,c=new O,u=new O,f=new O;if(t)for(let h=0,d=t.count;h<d;h+=3){const m=t.getX(h+0),x=t.getX(h+1),g=t.getX(h+2);s.fromBufferAttribute(e,m),r.fromBufferAttribute(e,x),a.fromBufferAttribute(e,g),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),o.fromBufferAttribute(n,m),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,g),o.add(u),l.add(u),c.add(u),n.setXYZ(m,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(g,c.x,c.y,c.z)}else for(let h=0,d=e.count;h<d;h+=3)s.fromBufferAttribute(e,h+0),r.fromBufferAttribute(e,h+1),a.fromBufferAttribute(e,h+2),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ae.fromBufferAttribute(t,e),Ae.normalize(),t.setXYZ(e,Ae.x,Ae.y,Ae.z)}toNonIndexed(){function t(o,l){const c=o.array,u=o.itemSize,f=o.normalized,h=new c.constructor(l.length*u);let d=0,m=0;for(let x=0,g=l.length;x<g;x++){o.isInterleavedBufferAttribute?d=l[x]*o.data.stride+o.offset:d=l[x]*u;for(let p=0;p<u;p++)h[m++]=c[d++]}return new me(h,u,f)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new Re,n=this.index.array,s=this.attributes;for(const o in s){const l=s[o],c=t(l,n);e.setAttribute(o,c)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let u=0,f=c.length;u<f;u++){const h=c[u],d=t(h,n);l.push(d)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let f=0,h=c.length;f<h;f++){const d=c[f];u.push(d.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const s=t.attributes;for(const c in s){const u=s[c];this.setAttribute(c,u.clone(e))}const r=t.morphAttributes;for(const c in r){const u=[],f=r[c];for(let h=0,d=f.length;h<d;h++)u.push(f[h].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,u=a.length;c<u;c++){const f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const pl=new le,hi=new So,qs=new is,ml=new O,Ys=new O,js=new O,Ks=new O,sa=new O,Zs=new O,gl=new O,Js=new O;class xe extends we{constructor(t=new Re,e=new rn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const o=this.morphTargetInfluences;if(r&&o){Zs.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const u=o[l],f=r[l];u!==0&&(sa.fromBufferAttribute(f,t),a?Zs.addScaledVector(sa,u):Zs.addScaledVector(sa.sub(e),u))}e.add(Zs)}return e}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),qs.copy(n.boundingSphere),qs.applyMatrix4(r),hi.copy(t.ray).recast(t.near),!(qs.containsPoint(hi.origin)===!1&&(hi.intersectSphere(qs,ml)===null||hi.origin.distanceToSquared(ml)>(t.far-t.near)**2))&&(pl.copy(r).invert(),hi.copy(t.ray).applyMatrix4(pl),!(n.boundingBox!==null&&hi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,hi)))}_computeIntersections(t,e,n){let s;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,f=r.attributes.normal,h=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let m=0,x=h.length;m<x;m++){const g=h[m],p=a[g.materialIndex],_=Math.max(g.start,d.start),y=Math.min(o.count,Math.min(g.start+g.count,d.start+d.count));for(let v=_,A=y;v<A;v+=3){const R=o.getX(v),w=o.getX(v+1),E=o.getX(v+2);s=Qs(this,p,t,n,c,u,f,R,w,E),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{const m=Math.max(0,d.start),x=Math.min(o.count,d.start+d.count);for(let g=m,p=x;g<p;g+=3){const _=o.getX(g),y=o.getX(g+1),v=o.getX(g+2);s=Qs(this,a,t,n,c,u,f,_,y,v),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let m=0,x=h.length;m<x;m++){const g=h[m],p=a[g.materialIndex],_=Math.max(g.start,d.start),y=Math.min(l.count,Math.min(g.start+g.count,d.start+d.count));for(let v=_,A=y;v<A;v+=3){const R=v,w=v+1,E=v+2;s=Qs(this,p,t,n,c,u,f,R,w,E),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=g.materialIndex,e.push(s))}}else{const m=Math.max(0,d.start),x=Math.min(l.count,d.start+d.count);for(let g=m,p=x;g<p;g+=3){const _=g,y=g+1,v=g+2;s=Qs(this,a,t,n,c,u,f,_,y,v),s&&(s.faceIndex=Math.floor(g/3),e.push(s))}}}}function Ju(i,t,e,n,s,r,a,o){let l;if(t.side===Ze?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===ri,o),l===null)return null;Js.copy(o),Js.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(Js);return c<e.near||c>e.far?null:{distance:c,point:Js.clone(),object:i}}function Qs(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,Ys),i.getVertexPosition(l,js),i.getVertexPosition(c,Ks);const u=Ju(i,t,e,n,Ys,js,Ks,gl);if(u){const f=new O;Mn.getBarycoord(gl,Ys,js,Ks,f),s&&(u.uv=Mn.getInterpolatedAttribute(s,o,l,c,f,new Yt)),r&&(u.uv1=Mn.getInterpolatedAttribute(r,o,l,c,f,new Yt)),a&&(u.normal=Mn.getInterpolatedAttribute(a,o,l,c,f,new O),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:l,c,normal:new O,materialIndex:0};Mn.getNormal(Ys,js,Ks,h.normal),u.face=h,u.barycoord=f}return u}class Sn extends Re{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],u=[],f=[];let h=0,d=0;m("z","y","x",-1,-1,n,e,t,a,r,0),m("z","y","x",1,-1,n,e,-t,a,r,1),m("x","z","y",1,1,t,n,e,s,a,2),m("x","z","y",1,-1,t,n,-e,s,a,3),m("x","y","z",1,-1,t,e,n,s,r,4),m("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new _e(c,3)),this.setAttribute("normal",new _e(u,3)),this.setAttribute("uv",new _e(f,2));function m(x,g,p,_,y,v,A,R,w,E,M){const b=v/w,P=A/E,D=v/2,N=A/2,$=R/2,j=w+1,X=E+1;let q=0,G=0;const nt=new O;for(let ut=0;ut<X;ut++){const B=ut*P-N;for(let ot=0;ot<j;ot++){const ht=ot*b-D;nt[x]=ht*_,nt[g]=B*y,nt[p]=$,c.push(nt.x,nt.y,nt.z),nt[x]=0,nt[g]=0,nt[p]=R>0?1:-1,u.push(nt.x,nt.y,nt.z),f.push(ot/w),f.push(1-ut/E),q+=1}}for(let ut=0;ut<E;ut++)for(let B=0;B<w;B++){const ot=h+B+j*ut,ht=h+B+j*(ut+1),z=h+(B+1)+j*(ut+1),K=h+(B+1)+j*ut;l.push(ot,ht,K),l.push(ht,z,K),G+=6}o.addGroup(d,G,M),d+=G,h+=q}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Sn(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function ts(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Oe(i){const t={};for(let e=0;e<i.length;e++){const n=ts(i[e]);for(const s in n)t[s]=n[s]}return t}function Qu(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Bc(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Qt.workingColorSpace}const td={clone:ts,merge:Oe};var ed=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,nd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Vn extends ss{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ed,this.fragmentShader=nd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ts(t.uniforms),this.uniformsGroups=Qu(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class zc extends we{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new le,this.projectionMatrix=new le,this.projectionMatrixInverse=new le,this.coordinateSystem=Bn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Qn=new O,xl=new Yt,yl=new Yt;class un extends zc{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=so*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(Or*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return so*2*Math.atan(Math.tan(Or*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Qn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Qn.x,Qn.y).multiplyScalar(-t/Qn.z),Qn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Qn.x,Qn.y).multiplyScalar(-t/Qn.z)}getViewSize(t,e){return this.getViewBounds(t,xl,yl),e.subVectors(yl,xl)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(Or*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Ni=-90,Fi=1;class id extends we{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new un(Ni,Fi,t,e);s.layers=this.layers,this.add(s);const r=new un(Ni,Fi,t,e);r.layers=this.layers,this.add(r);const a=new un(Ni,Fi,t,e);a.layers=this.layers,this.add(a);const o=new un(Ni,Fi,t,e);o.layers=this.layers,this.add(o);const l=new un(Ni,Fi,t,e);l.layers=this.layers,this.add(l);const c=new un(Ni,Fi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(const c of e)this.remove(c);if(t===Bn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===yr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,u]=this.children,f=t.getRenderTarget(),h=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,a),t.setRenderTarget(n,2,s),t.render(e,o),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,s),t.render(e,u),t.setRenderTarget(f,h,d),t.xr.enabled=m,n.texture.needsPMREMUpdate=!0}}class Hc extends Ge{constructor(t,e,n,s,r,a,o,l,c,u){t=t!==void 0?t:[],e=e!==void 0?e:Ki,super(t,e,n,s,r,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class sd extends bi{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Hc(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:dn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Sn(5,5,5),r=new Vn({name:"CubemapFromEquirect",uniforms:ts(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ze,blending:ii});r.uniforms.tEquirect.value=e;const a=new xe(s,r),o=e.minFilter;return e.minFilter===vi&&(e.minFilter=dn),new id(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,s){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}}const ra=new O,rd=new O,ad=new Vt;class pi{constructor(t=new O(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=ra.subVectors(n,e).cross(rd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(ra),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||ad.getNormalMatrix(t),s=this.coplanarPoint(ra).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ui=new is,tr=new O;class Eo{constructor(t=new pi,e=new pi,n=new pi,s=new pi,r=new pi,a=new pi){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Bn){const n=this.planes,s=t.elements,r=s[0],a=s[1],o=s[2],l=s[3],c=s[4],u=s[5],f=s[6],h=s[7],d=s[8],m=s[9],x=s[10],g=s[11],p=s[12],_=s[13],y=s[14],v=s[15];if(n[0].setComponents(l-r,h-c,g-d,v-p).normalize(),n[1].setComponents(l+r,h+c,g+d,v+p).normalize(),n[2].setComponents(l+a,h+u,g+m,v+_).normalize(),n[3].setComponents(l-a,h-u,g-m,v-_).normalize(),n[4].setComponents(l-o,h-f,g-x,v-y).normalize(),e===Bn)n[5].setComponents(l+o,h+f,g+x,v+y).normalize();else if(e===yr)n[5].setComponents(o,f,x,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),ui.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),ui.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(ui)}intersectsSprite(t){return ui.center.set(0,0,0),ui.radius=.7071067811865476,ui.applyMatrix4(t.matrixWorld),this.intersectsSphere(ui)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(tr.x=s.normal.x>0?t.max.x:t.min.x,tr.y=s.normal.y>0?t.max.y:t.min.y,tr.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(tr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function Gc(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function od(i){const t=new WeakMap;function e(o,l){const c=o.array,u=o.usage,f=c.byteLength,h=i.createBuffer();i.bindBuffer(l,h),i.bufferData(l,c,u),o.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){const u=l.array,f=l.updateRanges;if(i.bindBuffer(c,o),f.length===0)i.bufferSubData(c,0,u);else{f.sort((d,m)=>d.start-m.start);let h=0;for(let d=1;d<f.length;d++){const m=f[h],x=f[d];x.start<=m.start+m.count+1?m.count=Math.max(m.count,x.start+x.count-m.start):(++h,f[h]=x)}f.length=h+1;for(let d=0,m=f.length;d<m;d++){const x=f[d];i.bufferSubData(c,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}class rs extends Re{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,u=l+1,f=t/o,h=e/l,d=[],m=[],x=[],g=[];for(let p=0;p<u;p++){const _=p*h-a;for(let y=0;y<c;y++){const v=y*f-r;m.push(v,-_,0),x.push(0,0,1),g.push(y/o),g.push(1-p/l)}}for(let p=0;p<l;p++)for(let _=0;_<o;_++){const y=_+c*p,v=_+c*(p+1),A=_+1+c*(p+1),R=_+1+c*p;d.push(y,v,R),d.push(v,A,R)}this.setIndex(d),this.setAttribute("position",new _e(m,3)),this.setAttribute("normal",new _e(x,3)),this.setAttribute("uv",new _e(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new rs(t.width,t.height,t.widthSegments,t.heightSegments)}}var ld=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,cd=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,hd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ud=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,dd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,fd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,pd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,md=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,gd=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,xd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,yd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,vd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,_d=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,bd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Md=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Sd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,wd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Ed=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Td=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Ad=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Rd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Cd=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Pd=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,kd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Ld=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Ud=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Dd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Id=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Nd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Fd=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Od="gl_FragColor = linearToOutputTexel( gl_FragColor );",Bd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,zd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Hd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Gd=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Vd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Wd=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,$d=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Xd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,qd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Yd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,jd=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Kd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Zd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Jd=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Qd=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,tf=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,ef=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,nf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,sf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,rf=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,af=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,of=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lf=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,cf=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,hf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,uf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,df=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ff=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,pf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,mf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,gf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,xf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,yf=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,vf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,_f=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,bf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Mf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Sf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,wf=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Ef=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Tf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Af=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Rf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Cf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Pf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,kf=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Lf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Uf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Df=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,If=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Nf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ff=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Of=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Bf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,zf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Hf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Gf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Vf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Wf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,$f=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Xf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,qf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Yf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,jf=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Kf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Zf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Jf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Qf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,ep=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,np=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,ip=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
		
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
		
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		
		#else
		
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,sp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,rp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,ap=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,op=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const lp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,cp=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,hp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,up=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,dp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,fp=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,pp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,mp=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,gp=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,xp=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,yp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,vp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,_p=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,bp=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Mp=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Sp=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wp=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ep=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Tp=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Ap=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Rp=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Cp=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Pp=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,kp=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lp=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Up=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Dp=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Ip=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Np=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Fp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Op=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Bp=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,zp=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Hp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,qt={alphahash_fragment:ld,alphahash_pars_fragment:cd,alphamap_fragment:hd,alphamap_pars_fragment:ud,alphatest_fragment:dd,alphatest_pars_fragment:fd,aomap_fragment:pd,aomap_pars_fragment:md,batching_pars_vertex:gd,batching_vertex:xd,begin_vertex:yd,beginnormal_vertex:vd,bsdfs:_d,iridescence_fragment:bd,bumpmap_pars_fragment:Md,clipping_planes_fragment:Sd,clipping_planes_pars_fragment:wd,clipping_planes_pars_vertex:Ed,clipping_planes_vertex:Td,color_fragment:Ad,color_pars_fragment:Rd,color_pars_vertex:Cd,color_vertex:Pd,common:kd,cube_uv_reflection_fragment:Ld,defaultnormal_vertex:Ud,displacementmap_pars_vertex:Dd,displacementmap_vertex:Id,emissivemap_fragment:Nd,emissivemap_pars_fragment:Fd,colorspace_fragment:Od,colorspace_pars_fragment:Bd,envmap_fragment:zd,envmap_common_pars_fragment:Hd,envmap_pars_fragment:Gd,envmap_pars_vertex:Vd,envmap_physical_pars_fragment:tf,envmap_vertex:Wd,fog_vertex:$d,fog_pars_vertex:Xd,fog_fragment:qd,fog_pars_fragment:Yd,gradientmap_pars_fragment:jd,lightmap_pars_fragment:Kd,lights_lambert_fragment:Zd,lights_lambert_pars_fragment:Jd,lights_pars_begin:Qd,lights_toon_fragment:ef,lights_toon_pars_fragment:nf,lights_phong_fragment:sf,lights_phong_pars_fragment:rf,lights_physical_fragment:af,lights_physical_pars_fragment:of,lights_fragment_begin:lf,lights_fragment_maps:cf,lights_fragment_end:hf,logdepthbuf_fragment:uf,logdepthbuf_pars_fragment:df,logdepthbuf_pars_vertex:ff,logdepthbuf_vertex:pf,map_fragment:mf,map_pars_fragment:gf,map_particle_fragment:xf,map_particle_pars_fragment:yf,metalnessmap_fragment:vf,metalnessmap_pars_fragment:_f,morphinstance_vertex:bf,morphcolor_vertex:Mf,morphnormal_vertex:Sf,morphtarget_pars_vertex:wf,morphtarget_vertex:Ef,normal_fragment_begin:Tf,normal_fragment_maps:Af,normal_pars_fragment:Rf,normal_pars_vertex:Cf,normal_vertex:Pf,normalmap_pars_fragment:kf,clearcoat_normal_fragment_begin:Lf,clearcoat_normal_fragment_maps:Uf,clearcoat_pars_fragment:Df,iridescence_pars_fragment:If,opaque_fragment:Nf,packing:Ff,premultiplied_alpha_fragment:Of,project_vertex:Bf,dithering_fragment:zf,dithering_pars_fragment:Hf,roughnessmap_fragment:Gf,roughnessmap_pars_fragment:Vf,shadowmap_pars_fragment:Wf,shadowmap_pars_vertex:$f,shadowmap_vertex:Xf,shadowmask_pars_fragment:qf,skinbase_vertex:Yf,skinning_pars_vertex:jf,skinning_vertex:Kf,skinnormal_vertex:Zf,specularmap_fragment:Jf,specularmap_pars_fragment:Qf,tonemapping_fragment:tp,tonemapping_pars_fragment:ep,transmission_fragment:np,transmission_pars_fragment:ip,uv_pars_fragment:sp,uv_pars_vertex:rp,uv_vertex:ap,worldpos_vertex:op,background_vert:lp,background_frag:cp,backgroundCube_vert:hp,backgroundCube_frag:up,cube_vert:dp,cube_frag:fp,depth_vert:pp,depth_frag:mp,distanceRGBA_vert:gp,distanceRGBA_frag:xp,equirect_vert:yp,equirect_frag:vp,linedashed_vert:_p,linedashed_frag:bp,meshbasic_vert:Mp,meshbasic_frag:Sp,meshlambert_vert:wp,meshlambert_frag:Ep,meshmatcap_vert:Tp,meshmatcap_frag:Ap,meshnormal_vert:Rp,meshnormal_frag:Cp,meshphong_vert:Pp,meshphong_frag:kp,meshphysical_vert:Lp,meshphysical_frag:Up,meshtoon_vert:Dp,meshtoon_frag:Ip,points_vert:Np,points_frag:Fp,shadow_vert:Op,shadow_frag:Bp,sprite_vert:zp,sprite_frag:Hp},ct={common:{diffuse:{value:new Wt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Vt}},envmap:{envMap:{value:null},envMapRotation:{value:new Vt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Vt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Vt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Vt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Vt},normalScale:{value:new Yt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Vt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Vt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Vt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Vt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Wt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Wt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0},uvTransform:{value:new Vt}},sprite:{diffuse:{value:new Wt(16777215)},opacity:{value:1},center:{value:new Yt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}}},An={basic:{uniforms:Oe([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.fog]),vertexShader:qt.meshbasic_vert,fragmentShader:qt.meshbasic_frag},lambert:{uniforms:Oe([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,ct.lights,{emissive:{value:new Wt(0)}}]),vertexShader:qt.meshlambert_vert,fragmentShader:qt.meshlambert_frag},phong:{uniforms:Oe([ct.common,ct.specularmap,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,ct.lights,{emissive:{value:new Wt(0)},specular:{value:new Wt(1118481)},shininess:{value:30}}]),vertexShader:qt.meshphong_vert,fragmentShader:qt.meshphong_frag},standard:{uniforms:Oe([ct.common,ct.envmap,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.roughnessmap,ct.metalnessmap,ct.fog,ct.lights,{emissive:{value:new Wt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:qt.meshphysical_vert,fragmentShader:qt.meshphysical_frag},toon:{uniforms:Oe([ct.common,ct.aomap,ct.lightmap,ct.emissivemap,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.gradientmap,ct.fog,ct.lights,{emissive:{value:new Wt(0)}}]),vertexShader:qt.meshtoon_vert,fragmentShader:qt.meshtoon_frag},matcap:{uniforms:Oe([ct.common,ct.bumpmap,ct.normalmap,ct.displacementmap,ct.fog,{matcap:{value:null}}]),vertexShader:qt.meshmatcap_vert,fragmentShader:qt.meshmatcap_frag},points:{uniforms:Oe([ct.points,ct.fog]),vertexShader:qt.points_vert,fragmentShader:qt.points_frag},dashed:{uniforms:Oe([ct.common,ct.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:qt.linedashed_vert,fragmentShader:qt.linedashed_frag},depth:{uniforms:Oe([ct.common,ct.displacementmap]),vertexShader:qt.depth_vert,fragmentShader:qt.depth_frag},normal:{uniforms:Oe([ct.common,ct.bumpmap,ct.normalmap,ct.displacementmap,{opacity:{value:1}}]),vertexShader:qt.meshnormal_vert,fragmentShader:qt.meshnormal_frag},sprite:{uniforms:Oe([ct.sprite,ct.fog]),vertexShader:qt.sprite_vert,fragmentShader:qt.sprite_frag},background:{uniforms:{uvTransform:{value:new Vt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:qt.background_vert,fragmentShader:qt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Vt}},vertexShader:qt.backgroundCube_vert,fragmentShader:qt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:qt.cube_vert,fragmentShader:qt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:qt.equirect_vert,fragmentShader:qt.equirect_frag},distanceRGBA:{uniforms:Oe([ct.common,ct.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:qt.distanceRGBA_vert,fragmentShader:qt.distanceRGBA_frag},shadow:{uniforms:Oe([ct.lights,ct.fog,{color:{value:new Wt(0)},opacity:{value:1}}]),vertexShader:qt.shadow_vert,fragmentShader:qt.shadow_frag}};An.physical={uniforms:Oe([An.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Vt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Vt},clearcoatNormalScale:{value:new Yt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Vt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Vt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Vt},sheen:{value:0},sheenColor:{value:new Wt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Vt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Vt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Vt},transmissionSamplerSize:{value:new Yt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Vt},attenuationDistance:{value:0},attenuationColor:{value:new Wt(0)},specularColor:{value:new Wt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Vt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Vt},anisotropyVector:{value:new Yt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Vt}}]),vertexShader:qt.meshphysical_vert,fragmentShader:qt.meshphysical_frag};const er={r:0,b:0,g:0},di=new wn,Gp=new le;function Vp(i,t,e,n,s,r,a){const o=new Wt(0);let l=r===!0?0:1,c,u,f=null,h=0,d=null;function m(_){let y=_.isScene===!0?_.background:null;return y&&y.isTexture&&(y=(_.backgroundBlurriness>0?e:t).get(y)),y}function x(_){let y=!1;const v=m(_);v===null?p(o,l):v&&v.isColor&&(p(v,1),y=!0);const A=i.xr.getEnvironmentBlendMode();A==="additive"?n.buffers.color.setClear(0,0,0,1,a):A==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function g(_,y){const v=m(y);v&&(v.isCubeTexture||v.mapping===Sr)?(u===void 0&&(u=new xe(new Sn(1,1,1),new Vn({name:"BackgroundCubeMaterial",uniforms:ts(An.backgroundCube.uniforms),vertexShader:An.backgroundCube.vertexShader,fragmentShader:An.backgroundCube.fragmentShader,side:Ze,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(A,R,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(u)),di.copy(y.backgroundRotation),di.x*=-1,di.y*=-1,di.z*=-1,v.isCubeTexture&&v.isRenderTargetTexture===!1&&(di.y*=-1,di.z*=-1),u.material.uniforms.envMap.value=v,u.material.uniforms.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(Gp.makeRotationFromEuler(di)),u.material.toneMapped=Qt.getTransfer(v.colorSpace)!==ae,(f!==v||h!==v.version||d!==i.toneMapping)&&(u.material.needsUpdate=!0,f=v,h=v.version,d=i.toneMapping),u.layers.enableAll(),_.unshift(u,u.geometry,u.material,0,0,null)):v&&v.isTexture&&(c===void 0&&(c=new xe(new rs(2,2),new Vn({name:"BackgroundMaterial",uniforms:ts(An.background.uniforms),vertexShader:An.background.vertexShader,fragmentShader:An.background.fragmentShader,side:ri,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=v,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=Qt.getTransfer(v.colorSpace)!==ae,v.matrixAutoUpdate===!0&&v.updateMatrix(),c.material.uniforms.uvTransform.value.copy(v.matrix),(f!==v||h!==v.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,f=v,h=v.version,d=i.toneMapping),c.layers.enableAll(),_.unshift(c,c.geometry,c.material,0,0,null))}function p(_,y){_.getRGB(er,Bc(i)),n.buffers.color.setClear(er.r,er.g,er.b,y,a)}return{getClearColor:function(){return o},setClearColor:function(_,y=1){o.set(_),l=y,p(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(_){l=_,p(o,l)},render:x,addToRenderList:g}}function Wp(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null);let r=s,a=!1;function o(b,P,D,N,$){let j=!1;const X=f(N,D,P);r!==X&&(r=X,c(r.object)),j=d(b,N,D,$),j&&m(b,N,D,$),$!==null&&t.update($,i.ELEMENT_ARRAY_BUFFER),(j||a)&&(a=!1,v(b,P,D,N),$!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get($).buffer))}function l(){return i.createVertexArray()}function c(b){return i.bindVertexArray(b)}function u(b){return i.deleteVertexArray(b)}function f(b,P,D){const N=D.wireframe===!0;let $=n[b.id];$===void 0&&($={},n[b.id]=$);let j=$[P.id];j===void 0&&(j={},$[P.id]=j);let X=j[N];return X===void 0&&(X=h(l()),j[N]=X),X}function h(b){const P=[],D=[],N=[];for(let $=0;$<e;$++)P[$]=0,D[$]=0,N[$]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:D,attributeDivisors:N,object:b,attributes:{},index:null}}function d(b,P,D,N){const $=r.attributes,j=P.attributes;let X=0;const q=D.getAttributes();for(const G in q)if(q[G].location>=0){const ut=$[G];let B=j[G];if(B===void 0&&(G==="instanceMatrix"&&b.instanceMatrix&&(B=b.instanceMatrix),G==="instanceColor"&&b.instanceColor&&(B=b.instanceColor)),ut===void 0||ut.attribute!==B||B&&ut.data!==B.data)return!0;X++}return r.attributesNum!==X||r.index!==N}function m(b,P,D,N){const $={},j=P.attributes;let X=0;const q=D.getAttributes();for(const G in q)if(q[G].location>=0){let ut=j[G];ut===void 0&&(G==="instanceMatrix"&&b.instanceMatrix&&(ut=b.instanceMatrix),G==="instanceColor"&&b.instanceColor&&(ut=b.instanceColor));const B={};B.attribute=ut,ut&&ut.data&&(B.data=ut.data),$[G]=B,X++}r.attributes=$,r.attributesNum=X,r.index=N}function x(){const b=r.newAttributes;for(let P=0,D=b.length;P<D;P++)b[P]=0}function g(b){p(b,0)}function p(b,P){const D=r.newAttributes,N=r.enabledAttributes,$=r.attributeDivisors;D[b]=1,N[b]===0&&(i.enableVertexAttribArray(b),N[b]=1),$[b]!==P&&(i.vertexAttribDivisor(b,P),$[b]=P)}function _(){const b=r.newAttributes,P=r.enabledAttributes;for(let D=0,N=P.length;D<N;D++)P[D]!==b[D]&&(i.disableVertexAttribArray(D),P[D]=0)}function y(b,P,D,N,$,j,X){X===!0?i.vertexAttribIPointer(b,P,D,$,j):i.vertexAttribPointer(b,P,D,N,$,j)}function v(b,P,D,N){x();const $=N.attributes,j=D.getAttributes(),X=P.defaultAttributeValues;for(const q in j){const G=j[q];if(G.location>=0){let nt=$[q];if(nt===void 0&&(q==="instanceMatrix"&&b.instanceMatrix&&(nt=b.instanceMatrix),q==="instanceColor"&&b.instanceColor&&(nt=b.instanceColor)),nt!==void 0){const ut=nt.normalized,B=nt.itemSize,ot=t.get(nt);if(ot===void 0)continue;const ht=ot.buffer,z=ot.type,K=ot.bytesPerElement,lt=z===i.INT||z===i.UNSIGNED_INT||nt.gpuType===xo;if(nt.isInterleavedBufferAttribute){const it=nt.data,wt=it.stride,Pt=nt.offset;if(it.isInstancedInterleavedBuffer){for(let st=0;st<G.locationSize;st++)p(G.location+st,it.meshPerAttribute);b.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=it.meshPerAttribute*it.count)}else for(let st=0;st<G.locationSize;st++)g(G.location+st);i.bindBuffer(i.ARRAY_BUFFER,ht);for(let st=0;st<G.locationSize;st++)y(G.location+st,B/G.locationSize,z,ut,wt*K,(Pt+B/G.locationSize*st)*K,lt)}else{if(nt.isInstancedBufferAttribute){for(let it=0;it<G.locationSize;it++)p(G.location+it,nt.meshPerAttribute);b.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=nt.meshPerAttribute*nt.count)}else for(let it=0;it<G.locationSize;it++)g(G.location+it);i.bindBuffer(i.ARRAY_BUFFER,ht);for(let it=0;it<G.locationSize;it++)y(G.location+it,B/G.locationSize,z,ut,B*K,B/G.locationSize*it*K,lt)}}else if(X!==void 0){const ut=X[q];if(ut!==void 0)switch(ut.length){case 2:i.vertexAttrib2fv(G.location,ut);break;case 3:i.vertexAttrib3fv(G.location,ut);break;case 4:i.vertexAttrib4fv(G.location,ut);break;default:i.vertexAttrib1fv(G.location,ut)}}}}_()}function A(){E();for(const b in n){const P=n[b];for(const D in P){const N=P[D];for(const $ in N)u(N[$].object),delete N[$];delete P[D]}delete n[b]}}function R(b){if(n[b.id]===void 0)return;const P=n[b.id];for(const D in P){const N=P[D];for(const $ in N)u(N[$].object),delete N[$];delete P[D]}delete n[b.id]}function w(b){for(const P in n){const D=n[P];if(D[b.id]===void 0)continue;const N=D[b.id];for(const $ in N)u(N[$].object),delete N[$];delete D[b.id]}}function E(){M(),a=!0,r!==s&&(r=s,c(r.object))}function M(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:E,resetDefaultState:M,dispose:A,releaseStatesOfGeometry:R,releaseStatesOfProgram:w,initAttributes:x,enableAttribute:g,disableUnusedAttributes:_}}function $p(i,t,e){let n;function s(c){n=c}function r(c,u){i.drawArrays(n,c,u),e.update(u,n,1)}function a(c,u,f){f!==0&&(i.drawArraysInstanced(n,c,u,f),e.update(u,n,f))}function o(c,u,f){if(f===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,u,0,f);let d=0;for(let m=0;m<f;m++)d+=u[m];e.update(d,n,1)}function l(c,u,f,h){if(f===0)return;const d=t.get("WEBGL_multi_draw");if(d===null)for(let m=0;m<c.length;m++)a(c[m],u[m],h[m]);else{d.multiDrawArraysInstancedWEBGL(n,c,0,u,0,h,0,f);let m=0;for(let x=0;x<f;x++)m+=u[x]*h[x];e.update(m,n,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Xp(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const w=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(w){return!(w!==fn&&n.convert(w)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(w){const E=w===ks&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(w!==Pn&&n.convert(w)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&w!==Cn&&!E)}function l(w){if(w==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const f=e.logarithmicDepthBuffer===!0,h=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),_=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),y=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),A=m>0,R=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reverseDepthBuffer:h,maxTextures:d,maxVertexTextures:m,maxTextureSize:x,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:_,maxVaryings:y,maxFragmentUniforms:v,vertexTextures:A,maxSamples:R}}function qp(i){const t=this;let e=null,n=0,s=!1,r=!1;const a=new pi,o=new Vt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){const d=f.length!==0||h||n!==0||s;return s=h,n=f.length,d},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,h){e=u(f,h,0)},this.setState=function(f,h,d){const m=f.clippingPlanes,x=f.clipIntersection,g=f.clipShadows,p=i.get(f);if(!s||m===null||m.length===0||r&&!g)r?u(null):c();else{const _=r?0:n,y=_*4;let v=p.clippingState||null;l.value=v,v=u(m,h,y,d);for(let A=0;A!==y;++A)v[A]=e[A];p.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=_}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(f,h,d,m){const x=f!==null?f.length:0;let g=null;if(x!==0){if(g=l.value,m!==!0||g===null){const p=d+x*4,_=h.matrixWorldInverse;o.getNormalMatrix(_),(g===null||g.length<p)&&(g=new Float32Array(p));for(let y=0,v=d;y!==x;++y,v+=4)a.copy(f[y]).applyMatrix4(_,o),a.normal.toArray(g,v),g[v+3]=a.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,g}}function Yp(i){let t=new WeakMap;function e(a,o){return o===Ra?a.mapping=Ki:o===Ca&&(a.mapping=Zi),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===Ra||o===Ca)if(t.has(a)){const l=t.get(a).texture;return e(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const c=new sd(l.height);return c.fromEquirectangularTexture(i,a),t.set(a,c),a.addEventListener("dispose",s),e(c.texture,a.mapping)}else return null}}return a}function s(a){const o=a.target;o.removeEventListener("dispose",s);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}class Vc extends zc{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Gi=4,vl=[.125,.215,.35,.446,.526,.582],yi=20,aa=new Vc,_l=new Wt;let oa=null,la=0,ca=0,ha=!1;const mi=(1+Math.sqrt(5))/2,Oi=1/mi,bl=[new O(-mi,Oi,0),new O(mi,Oi,0),new O(-Oi,0,mi),new O(Oi,0,mi),new O(0,mi,-Oi),new O(0,mi,Oi),new O(-1,1,-1),new O(1,1,-1),new O(-1,1,1),new O(1,1,1)];class Ml{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){oa=this._renderer.getRenderTarget(),la=this._renderer.getActiveCubeFace(),ca=this._renderer.getActiveMipmapLevel(),ha=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=El(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=wl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(oa,la,ca),this._renderer.xr.enabled=ha,t.scissorTest=!1,nr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ki||t.mapping===Zi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),oa=this._renderer.getRenderTarget(),la=this._renderer.getActiveCubeFace(),ca=this._renderer.getActiveMipmapLevel(),ha=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:dn,minFilter:dn,generateMipmaps:!1,type:ks,format:fn,colorSpace:es,depthBuffer:!1},s=Sl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Sl(t,e,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=jp(r)),this._blurMaterial=Kp(r,t,e)}return s}_compileMaterial(t){const e=new xe(this._lodPlanes[0],t);this._renderer.compile(e,aa)}_sceneToCubeUV(t,e,n,s){const o=new un(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,h=u.toneMapping;u.getClearColor(_l),u.toneMapping=si,u.autoClear=!1;const d=new rn({name:"PMREM.Background",side:Ze,depthWrite:!1,depthTest:!1}),m=new xe(new Sn,d);let x=!1;const g=t.background;g?g.isColor&&(d.color.copy(g),t.background=null,x=!0):(d.color.copy(_l),x=!0);for(let p=0;p<6;p++){const _=p%3;_===0?(o.up.set(0,l[p],0),o.lookAt(c[p],0,0)):_===1?(o.up.set(0,0,l[p]),o.lookAt(0,c[p],0)):(o.up.set(0,l[p],0),o.lookAt(0,0,c[p]));const y=this._cubeSize;nr(s,_*y,p>2?y:0,y,y),u.setRenderTarget(s),x&&u.render(m,o),u.render(t,o)}m.geometry.dispose(),m.material.dispose(),u.toneMapping=h,u.autoClear=f,t.background=g}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===Ki||t.mapping===Zi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=El()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=wl());const r=s?this._cubemapMaterial:this._equirectMaterial,a=new xe(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;const l=this._cubeSize;nr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,aa)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=bl[(s-r-1)%bl.length];this._blur(t,r-1,r,a,o)}e.autoClear=n}_blur(t,e,n,s,r){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,f=new xe(this._lodPlanes[s],c),h=c.uniforms,d=this._sizeLods[n]-1,m=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*yi-1),x=r/m,g=isFinite(r)?1+Math.floor(u*x):yi;g>yi&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${yi}`);const p=[];let _=0;for(let w=0;w<yi;++w){const E=w/x,M=Math.exp(-E*E/2);p.push(M),w===0?_+=M:w<g&&(_+=2*M)}for(let w=0;w<p.length;w++)p[w]=p[w]/_;h.envMap.value=t.texture,h.samples.value=g,h.weights.value=p,h.latitudinal.value=a==="latitudinal",o&&(h.poleAxis.value=o);const{_lodMax:y}=this;h.dTheta.value=m,h.mipInt.value=y-n;const v=this._sizeLods[s],A=3*v*(s>y-Gi?s-y+Gi:0),R=4*(this._cubeSize-v);nr(e,A,R,3*v,2*v),l.setRenderTarget(e),l.render(f,aa)}}function jp(i){const t=[],e=[],n=[];let s=i;const r=i-Gi+1+vl.length;for(let a=0;a<r;a++){const o=Math.pow(2,s);e.push(o);let l=1/o;a>i-Gi?l=vl[a-i+Gi-1]:a===0&&(l=0),n.push(l);const c=1/(o-2),u=-c,f=1+c,h=[u,u,f,u,f,f,u,u,f,f,u,f],d=6,m=6,x=3,g=2,p=1,_=new Float32Array(x*m*d),y=new Float32Array(g*m*d),v=new Float32Array(p*m*d);for(let R=0;R<d;R++){const w=R%3*2/3-1,E=R>2?0:-1,M=[w,E,0,w+2/3,E,0,w+2/3,E+1,0,w,E,0,w+2/3,E+1,0,w,E+1,0];_.set(M,x*m*R),y.set(h,g*m*R);const b=[R,R,R,R,R,R];v.set(b,p*m*R)}const A=new Re;A.setAttribute("position",new me(_,x)),A.setAttribute("uv",new me(y,g)),A.setAttribute("faceIndex",new me(v,p)),t.push(A),s>Gi&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function Sl(i,t,e){const n=new bi(i,t,e);return n.texture.mapping=Sr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function nr(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Kp(i,t,e){const n=new Float32Array(yi),s=new O(0,1,0);return new Vn({name:"SphericalGaussianBlur",defines:{n:yi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:To(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:ii,depthTest:!1,depthWrite:!1})}function wl(){return new Vn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:To(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:ii,depthTest:!1,depthWrite:!1})}function El(){return new Vn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:To(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ii,depthTest:!1,depthWrite:!1})}function To(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Zp(i){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===Ra||l===Ca,u=l===Ki||l===Zi;if(c||u){let f=t.get(o);const h=f!==void 0?f.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==h)return e===null&&(e=new Ml(i)),f=c?e.fromEquirectangular(o,f):e.fromCubemap(o,f),f.texture.pmremVersion=o.pmremVersion,t.set(o,f),f.texture;if(f!==void 0)return f.texture;{const d=o.image;return c&&d&&d.height>0||u&&d&&s(d)?(e===null&&(e=new Ml(i)),f=c?e.fromEquirectangular(o):e.fromCubemap(o),f.texture.pmremVersion=o.pmremVersion,t.set(o,f),o.addEventListener("dispose",r),f.texture):null}}}return o}function s(o){let l=0;const c=6;for(let u=0;u<c;u++)o[u]!==void 0&&l++;return l===c}function r(o){const l=o.target;l.removeEventListener("dispose",r);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function Jp(i){const t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&_s("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Qp(i,t,e,n){const s={},r=new WeakMap;function a(f){const h=f.target;h.index!==null&&t.remove(h.index);for(const m in h.attributes)t.remove(h.attributes[m]);for(const m in h.morphAttributes){const x=h.morphAttributes[m];for(let g=0,p=x.length;g<p;g++)t.remove(x[g])}h.removeEventListener("dispose",a),delete s[h.id];const d=r.get(h);d&&(t.remove(d),r.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,e.memory.geometries--}function o(f,h){return s[h.id]===!0||(h.addEventListener("dispose",a),s[h.id]=!0,e.memory.geometries++),h}function l(f){const h=f.attributes;for(const m in h)t.update(h[m],i.ARRAY_BUFFER);const d=f.morphAttributes;for(const m in d){const x=d[m];for(let g=0,p=x.length;g<p;g++)t.update(x[g],i.ARRAY_BUFFER)}}function c(f){const h=[],d=f.index,m=f.attributes.position;let x=0;if(d!==null){const _=d.array;x=d.version;for(let y=0,v=_.length;y<v;y+=3){const A=_[y+0],R=_[y+1],w=_[y+2];h.push(A,R,R,w,w,A)}}else if(m!==void 0){const _=m.array;x=m.version;for(let y=0,v=_.length/3-1;y<v;y+=3){const A=y+0,R=y+1,w=y+2;h.push(A,R,R,w,w,A)}}else return;const g=new(Uc(h)?Oc:Fc)(h,1);g.version=x;const p=r.get(f);p&&t.remove(p),r.set(f,g)}function u(f){const h=r.get(f);if(h){const d=f.index;d!==null&&h.version<d.version&&c(f)}else c(f);return r.get(f)}return{get:o,update:l,getWireframeAttribute:u}}function t0(i,t,e){let n;function s(h){n=h}let r,a;function o(h){r=h.type,a=h.bytesPerElement}function l(h,d){i.drawElements(n,d,r,h*a),e.update(d,n,1)}function c(h,d,m){m!==0&&(i.drawElementsInstanced(n,d,r,h*a,m),e.update(d,n,m))}function u(h,d,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,r,h,0,m);let g=0;for(let p=0;p<m;p++)g+=d[p];e.update(g,n,1)}function f(h,d,m,x){if(m===0)return;const g=t.get("WEBGL_multi_draw");if(g===null)for(let p=0;p<h.length;p++)c(h[p]/a,d[p],x[p]);else{g.multiDrawElementsInstancedWEBGL(n,d,0,r,h,0,x,0,m);let p=0;for(let _=0;_<m;_++)p+=d[_]*x[_];e.update(p,n,1)}}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=f}function e0(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function n0(i,t,e){const n=new WeakMap,s=new ve;function r(a,o,l){const c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0;let h=n.get(o);if(h===void 0||h.count!==f){let b=function(){E.dispose(),n.delete(o),o.removeEventListener("dispose",b)};var d=b;h!==void 0&&h.texture.dispose();const m=o.morphAttributes.position!==void 0,x=o.morphAttributes.normal!==void 0,g=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],_=o.morphAttributes.normal||[],y=o.morphAttributes.color||[];let v=0;m===!0&&(v=1),x===!0&&(v=2),g===!0&&(v=3);let A=o.attributes.position.count*v,R=1;A>t.maxTextureSize&&(R=Math.ceil(A/t.maxTextureSize),A=t.maxTextureSize);const w=new Float32Array(A*R*4*f),E=new Ic(w,A,R,f);E.type=Cn,E.needsUpdate=!0;const M=v*4;for(let P=0;P<f;P++){const D=p[P],N=_[P],$=y[P],j=A*R*4*P;for(let X=0;X<D.count;X++){const q=X*M;m===!0&&(s.fromBufferAttribute(D,X),w[j+q+0]=s.x,w[j+q+1]=s.y,w[j+q+2]=s.z,w[j+q+3]=0),x===!0&&(s.fromBufferAttribute(N,X),w[j+q+4]=s.x,w[j+q+5]=s.y,w[j+q+6]=s.z,w[j+q+7]=0),g===!0&&(s.fromBufferAttribute($,X),w[j+q+8]=s.x,w[j+q+9]=s.y,w[j+q+10]=s.z,w[j+q+11]=$.itemSize===4?s.w:1)}}h={count:f,texture:E,size:new Yt(A,R)},n.set(o,h),o.addEventListener("dispose",b)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let m=0;for(let g=0;g<c.length;g++)m+=c[g];const x=o.morphTargetsRelative?1:1-m;l.getUniforms().setValue(i,"morphTargetBaseInfluence",x),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",h.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function i0(i,t,e,n){let s=new WeakMap;function r(l){const c=n.render.frame,u=l.geometry,f=t.get(l,u);if(s.get(f)!==c&&(t.update(f),s.set(f,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){const h=l.skeleton;s.get(h)!==c&&(h.update(),s.set(h,c))}return f}function a(){s=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:a}}class Wc extends Ge{constructor(t,e,n,s,r,a,o,l,c,u=$i){if(u!==$i&&u!==Qi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===$i&&(n=_i),n===void 0&&u===Qi&&(n=Ji),super(null,s,r,a,o,l,u,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:He,this.minFilter=l!==void 0?l:He,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const $c=new Ge,Tl=new Wc(1,1),Xc=new Ic,qc=new Gu,Yc=new Hc,Al=[],Rl=[],Cl=new Float32Array(16),Pl=new Float32Array(9),kl=new Float32Array(4);function as(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=Al[s];if(r===void 0&&(r=new Float32Array(s),Al[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function Ee(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Te(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Tr(i,t){let e=Rl[t];e===void 0&&(e=new Int32Array(t),Rl[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function s0(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function r0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2fv(this.addr,t),Te(e,t)}}function a0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ee(e,t))return;i.uniform3fv(this.addr,t),Te(e,t)}}function o0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4fv(this.addr,t),Te(e,t)}}function l0(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;kl.set(n),i.uniformMatrix2fv(this.addr,!1,kl),Te(e,n)}}function c0(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;Pl.set(n),i.uniformMatrix3fv(this.addr,!1,Pl),Te(e,n)}}function h0(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;Cl.set(n),i.uniformMatrix4fv(this.addr,!1,Cl),Te(e,n)}}function u0(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function d0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2iv(this.addr,t),Te(e,t)}}function f0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3iv(this.addr,t),Te(e,t)}}function p0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4iv(this.addr,t),Te(e,t)}}function m0(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function g0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;i.uniform2uiv(this.addr,t),Te(e,t)}}function x0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;i.uniform3uiv(this.addr,t),Te(e,t)}}function y0(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;i.uniform4uiv(this.addr,t),Te(e,t)}}function v0(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Tl.compareFunction=Lc,r=Tl):r=$c,e.setTexture2D(t||r,s)}function _0(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||qc,s)}function b0(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Yc,s)}function M0(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Xc,s)}function S0(i){switch(i){case 5126:return s0;case 35664:return r0;case 35665:return a0;case 35666:return o0;case 35674:return l0;case 35675:return c0;case 35676:return h0;case 5124:case 35670:return u0;case 35667:case 35671:return d0;case 35668:case 35672:return f0;case 35669:case 35673:return p0;case 5125:return m0;case 36294:return g0;case 36295:return x0;case 36296:return y0;case 35678:case 36198:case 36298:case 36306:case 35682:return v0;case 35679:case 36299:case 36307:return _0;case 35680:case 36300:case 36308:case 36293:return b0;case 36289:case 36303:case 36311:case 36292:return M0}}function w0(i,t){i.uniform1fv(this.addr,t)}function E0(i,t){const e=as(t,this.size,2);i.uniform2fv(this.addr,e)}function T0(i,t){const e=as(t,this.size,3);i.uniform3fv(this.addr,e)}function A0(i,t){const e=as(t,this.size,4);i.uniform4fv(this.addr,e)}function R0(i,t){const e=as(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function C0(i,t){const e=as(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function P0(i,t){const e=as(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function k0(i,t){i.uniform1iv(this.addr,t)}function L0(i,t){i.uniform2iv(this.addr,t)}function U0(i,t){i.uniform3iv(this.addr,t)}function D0(i,t){i.uniform4iv(this.addr,t)}function I0(i,t){i.uniform1uiv(this.addr,t)}function N0(i,t){i.uniform2uiv(this.addr,t)}function F0(i,t){i.uniform3uiv(this.addr,t)}function O0(i,t){i.uniform4uiv(this.addr,t)}function B0(i,t,e){const n=this.cache,s=t.length,r=Tr(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let a=0;a!==s;++a)e.setTexture2D(t[a]||$c,r[a])}function z0(i,t,e){const n=this.cache,s=t.length,r=Tr(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||qc,r[a])}function H0(i,t,e){const n=this.cache,s=t.length,r=Tr(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||Yc,r[a])}function G0(i,t,e){const n=this.cache,s=t.length,r=Tr(e,s);Ee(n,r)||(i.uniform1iv(this.addr,r),Te(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||Xc,r[a])}function V0(i){switch(i){case 5126:return w0;case 35664:return E0;case 35665:return T0;case 35666:return A0;case 35674:return R0;case 35675:return C0;case 35676:return P0;case 5124:case 35670:return k0;case 35667:case 35671:return L0;case 35668:case 35672:return U0;case 35669:case 35673:return D0;case 5125:return I0;case 36294:return N0;case 36295:return F0;case 36296:return O0;case 35678:case 36198:case 36298:case 36306:case 35682:return B0;case 35679:case 36299:case 36307:return z0;case 35680:case 36300:case 36308:case 36293:return H0;case 36289:case 36303:case 36311:case 36292:return G0}}class W0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=S0(e.type)}}class $0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=V0(e.type)}}class X0{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(t,e[o.id],n)}}}const ua=/(\w+)(\])?(\[|\.)?/g;function Ll(i,t){i.seq.push(t),i.map[t.id]=t}function q0(i,t,e){const n=i.name,s=n.length;for(ua.lastIndex=0;;){const r=ua.exec(n),a=ua.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){Ll(e,c===void 0?new W0(o,i,t):new $0(o,i,t));break}else{let f=e.map[o];f===void 0&&(f=new X0(o),Ll(e,f)),e=f}}}class pr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=t.getActiveUniform(e,s),a=t.getUniformLocation(e,r.name);q0(r,a,this)}}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){const o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const a=t[s];a.id in e&&n.push(a)}return n}}function Ul(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Y0=37297;let j0=0;function K0(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}const Dl=new Vt;function Z0(i){Qt._getMatrix(Dl,Qt.workingColorSpace,i);const t=`mat3( ${Dl.elements.map(e=>e.toFixed(4))} )`;switch(Qt.getTransfer(i)){case Er:return[t,"LinearTransferOETF"];case ae:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Il(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const a=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+K0(i.getShaderSource(t),a)}else return s}function J0(i,t){const e=Z0(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function Q0(i,t){let e;switch(t){case gu:e="Linear";break;case xu:e="Reinhard";break;case yu:e="Cineon";break;case _c:e="ACESFilmic";break;case _u:e="AgX";break;case bu:e="Neutral";break;case vu:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const ir=new O;function tm(){Qt.getLuminanceCoefficients(ir);const i=ir.x.toFixed(4),t=ir.y.toFixed(4),e=ir.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function em(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(bs).join(`
`)}function nm(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function im(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function bs(i){return i!==""}function Nl(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Fl(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const sm=/^[ \t]*#include +<([\w\d./]+)>/gm;function ro(i){return i.replace(sm,am)}const rm=new Map;function am(i,t){let e=qt[t];if(e===void 0){const n=rm.get(t);if(n!==void 0)e=qt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return ro(e)}const om=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ol(i){return i.replace(om,lm)}function lm(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Bl(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function cm(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===go?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===yc?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===On&&(t="SHADOWMAP_TYPE_VSM"),t}function hm(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ki:case Zi:t="ENVMAP_TYPE_CUBE";break;case Sr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function um(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case Zi:t="ENVMAP_MODE_REFRACTION";break}return t}function dm(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case vc:t="ENVMAP_BLENDING_MULTIPLY";break;case pu:t="ENVMAP_BLENDING_MIX";break;case mu:t="ENVMAP_BLENDING_ADD";break}return t}function fm(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function pm(i,t,e,n){const s=i.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=cm(e),c=hm(e),u=um(e),f=dm(e),h=fm(e),d=em(e),m=nm(r),x=s.createProgram();let g,p,_=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(g=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(bs).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m].filter(bs).join(`
`),p.length>0&&(p+=`
`)):(g=[Bl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(bs).join(`
`),p=[Bl(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,m,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==si?"#define TONE_MAPPING":"",e.toneMapping!==si?qt.tonemapping_pars_fragment:"",e.toneMapping!==si?Q0("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",qt.colorspace_pars_fragment,J0("linearToOutputTexel",e.outputColorSpace),tm(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(bs).join(`
`)),a=ro(a),a=Nl(a,e),a=Fl(a,e),o=ro(o),o=Nl(o,e),o=Fl(o,e),a=Ol(a),o=Ol(o),e.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,g=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",e.glslVersion===Jo?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Jo?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const y=_+g+a,v=_+p+o,A=Ul(s,s.VERTEX_SHADER,y),R=Ul(s,s.FRAGMENT_SHADER,v);s.attachShader(x,A),s.attachShader(x,R),e.index0AttributeName!==void 0?s.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(x,0,"position"),s.linkProgram(x);function w(P){if(i.debug.checkShaderErrors){const D=s.getProgramInfoLog(x).trim(),N=s.getShaderInfoLog(A).trim(),$=s.getShaderInfoLog(R).trim();let j=!0,X=!0;if(s.getProgramParameter(x,s.LINK_STATUS)===!1)if(j=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,x,A,R);else{const q=Il(s,A,"vertex"),G=Il(s,R,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(x,s.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+D+`
`+q+`
`+G)}else D!==""?console.warn("THREE.WebGLProgram: Program Info Log:",D):(N===""||$==="")&&(X=!1);X&&(P.diagnostics={runnable:j,programLog:D,vertexShader:{log:N,prefix:g},fragmentShader:{log:$,prefix:p}})}s.deleteShader(A),s.deleteShader(R),E=new pr(s,x),M=im(s,x)}let E;this.getUniforms=function(){return E===void 0&&w(this),E};let M;this.getAttributes=function(){return M===void 0&&w(this),M};let b=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return b===!1&&(b=s.getProgramParameter(x,Y0)),b},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=j0++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=A,this.fragmentShader=R,this}let mm=0;class gm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new xm(t),e.set(t,n)),n}}class xm{constructor(t){this.id=mm++,this.code=t,this.usedTimes=0}}function ym(i,t,e,n,s,r,a){const o=new wo,l=new gm,c=new Set,u=[],f=s.logarithmicDepthBuffer,h=s.vertexTextures;let d=s.precision;const m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(M){return c.add(M),M===0?"uv":`uv${M}`}function g(M,b,P,D,N){const $=D.fog,j=N.geometry,X=M.isMeshStandardMaterial?D.environment:null,q=(M.isMeshStandardMaterial?e:t).get(M.envMap||X),G=q&&q.mapping===Sr?q.image.height:null,nt=m[M.type];M.precision!==null&&(d=s.getMaxPrecision(M.precision),d!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",d,"instead."));const ut=j.morphAttributes.position||j.morphAttributes.normal||j.morphAttributes.color,B=ut!==void 0?ut.length:0;let ot=0;j.morphAttributes.position!==void 0&&(ot=1),j.morphAttributes.normal!==void 0&&(ot=2),j.morphAttributes.color!==void 0&&(ot=3);let ht,z,K,lt;if(nt){const se=An[nt];ht=se.vertexShader,z=se.fragmentShader}else ht=M.vertexShader,z=M.fragmentShader,l.update(M),K=l.getVertexShaderID(M),lt=l.getFragmentShaderID(M);const it=i.getRenderTarget(),wt=i.state.buffers.depth.getReversed(),Pt=N.isInstancedMesh===!0,st=N.isBatchedMesh===!0,Lt=!!M.map,Ut=!!M.matcap,ge=!!q,I=!!M.aoMap,on=!!M.lightMap,jt=!!M.bumpMap,Kt=!!M.normalMap,Dt=!!M.displacementMap,de=!!M.emissiveMap,kt=!!M.metalnessMap,C=!!M.roughnessMap,S=M.anisotropy>0,H=M.clearcoat>0,J=M.dispersion>0,et=M.iridescence>0,Z=M.sheen>0,Rt=M.transmission>0,ft=S&&!!M.anisotropyMap,vt=H&&!!M.clearcoatMap,Jt=H&&!!M.clearcoatNormalMap,rt=H&&!!M.clearcoatRoughnessMap,bt=et&&!!M.iridescenceMap,It=et&&!!M.iridescenceThicknessMap,Ot=Z&&!!M.sheenColorMap,Mt=Z&&!!M.sheenRoughnessMap,Zt=!!M.specularMap,$t=!!M.specularColorMap,ce=!!M.specularIntensityMap,k=Rt&&!!M.transmissionMap,dt=Rt&&!!M.thicknessMap,Y=!!M.gradientMap,Q=!!M.alphaMap,yt=M.alphaTest>0,gt=!!M.alphaHash,Ht=!!M.extensions;let ye=si;M.toneMapped&&(it===null||it.isXRRenderTarget===!0)&&(ye=i.toneMapping);const Ue={shaderID:nt,shaderType:M.type,shaderName:M.name,vertexShader:ht,fragmentShader:z,defines:M.defines,customVertexShaderID:K,customFragmentShaderID:lt,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:d,batching:st,batchingColor:st&&N._colorsTexture!==null,instancing:Pt,instancingColor:Pt&&N.instanceColor!==null,instancingMorph:Pt&&N.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:it===null?i.outputColorSpace:it.isXRRenderTarget===!0?it.texture.colorSpace:es,alphaToCoverage:!!M.alphaToCoverage,map:Lt,matcap:Ut,envMap:ge,envMapMode:ge&&q.mapping,envMapCubeUVHeight:G,aoMap:I,lightMap:on,bumpMap:jt,normalMap:Kt,displacementMap:h&&Dt,emissiveMap:de,normalMapObjectSpace:Kt&&M.normalMapType===Eu,normalMapTangentSpace:Kt&&M.normalMapType===kc,metalnessMap:kt,roughnessMap:C,anisotropy:S,anisotropyMap:ft,clearcoat:H,clearcoatMap:vt,clearcoatNormalMap:Jt,clearcoatRoughnessMap:rt,dispersion:J,iridescence:et,iridescenceMap:bt,iridescenceThicknessMap:It,sheen:Z,sheenColorMap:Ot,sheenRoughnessMap:Mt,specularMap:Zt,specularColorMap:$t,specularIntensityMap:ce,transmission:Rt,transmissionMap:k,thicknessMap:dt,gradientMap:Y,opaque:M.transparent===!1&&M.blending===Wi&&M.alphaToCoverage===!1,alphaMap:Q,alphaTest:yt,alphaHash:gt,combine:M.combine,mapUv:Lt&&x(M.map.channel),aoMapUv:I&&x(M.aoMap.channel),lightMapUv:on&&x(M.lightMap.channel),bumpMapUv:jt&&x(M.bumpMap.channel),normalMapUv:Kt&&x(M.normalMap.channel),displacementMapUv:Dt&&x(M.displacementMap.channel),emissiveMapUv:de&&x(M.emissiveMap.channel),metalnessMapUv:kt&&x(M.metalnessMap.channel),roughnessMapUv:C&&x(M.roughnessMap.channel),anisotropyMapUv:ft&&x(M.anisotropyMap.channel),clearcoatMapUv:vt&&x(M.clearcoatMap.channel),clearcoatNormalMapUv:Jt&&x(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:rt&&x(M.clearcoatRoughnessMap.channel),iridescenceMapUv:bt&&x(M.iridescenceMap.channel),iridescenceThicknessMapUv:It&&x(M.iridescenceThicknessMap.channel),sheenColorMapUv:Ot&&x(M.sheenColorMap.channel),sheenRoughnessMapUv:Mt&&x(M.sheenRoughnessMap.channel),specularMapUv:Zt&&x(M.specularMap.channel),specularColorMapUv:$t&&x(M.specularColorMap.channel),specularIntensityMapUv:ce&&x(M.specularIntensityMap.channel),transmissionMapUv:k&&x(M.transmissionMap.channel),thicknessMapUv:dt&&x(M.thicknessMap.channel),alphaMapUv:Q&&x(M.alphaMap.channel),vertexTangents:!!j.attributes.tangent&&(Kt||S),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!j.attributes.color&&j.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!j.attributes.uv&&(Lt||Q),fog:!!$,useFog:M.fog===!0,fogExp2:!!$&&$.isFogExp2,flatShading:M.flatShading===!0,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:f,reverseDepthBuffer:wt,skinning:N.isSkinnedMesh===!0,morphTargets:j.morphAttributes.position!==void 0,morphNormals:j.morphAttributes.normal!==void 0,morphColors:j.morphAttributes.color!==void 0,morphTargetsCount:B,morphTextureStride:ot,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:M.dithering,shadowMapEnabled:i.shadowMap.enabled&&P.length>0,shadowMapType:i.shadowMap.type,toneMapping:ye,decodeVideoTexture:Lt&&M.map.isVideoTexture===!0&&Qt.getTransfer(M.map.colorSpace)===ae,decodeVideoTextureEmissive:de&&M.emissiveMap.isVideoTexture===!0&&Qt.getTransfer(M.emissiveMap.colorSpace)===ae,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===sn,flipSided:M.side===Ze,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:Ht&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ht&&M.extensions.multiDraw===!0||st)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return Ue.vertexUv1s=c.has(1),Ue.vertexUv2s=c.has(2),Ue.vertexUv3s=c.has(3),c.clear(),Ue}function p(M){const b=[];if(M.shaderID?b.push(M.shaderID):(b.push(M.customVertexShaderID),b.push(M.customFragmentShaderID)),M.defines!==void 0)for(const P in M.defines)b.push(P),b.push(M.defines[P]);return M.isRawShaderMaterial===!1&&(_(b,M),y(b,M),b.push(i.outputColorSpace)),b.push(M.customProgramCacheKey),b.join()}function _(M,b){M.push(b.precision),M.push(b.outputColorSpace),M.push(b.envMapMode),M.push(b.envMapCubeUVHeight),M.push(b.mapUv),M.push(b.alphaMapUv),M.push(b.lightMapUv),M.push(b.aoMapUv),M.push(b.bumpMapUv),M.push(b.normalMapUv),M.push(b.displacementMapUv),M.push(b.emissiveMapUv),M.push(b.metalnessMapUv),M.push(b.roughnessMapUv),M.push(b.anisotropyMapUv),M.push(b.clearcoatMapUv),M.push(b.clearcoatNormalMapUv),M.push(b.clearcoatRoughnessMapUv),M.push(b.iridescenceMapUv),M.push(b.iridescenceThicknessMapUv),M.push(b.sheenColorMapUv),M.push(b.sheenRoughnessMapUv),M.push(b.specularMapUv),M.push(b.specularColorMapUv),M.push(b.specularIntensityMapUv),M.push(b.transmissionMapUv),M.push(b.thicknessMapUv),M.push(b.combine),M.push(b.fogExp2),M.push(b.sizeAttenuation),M.push(b.morphTargetsCount),M.push(b.morphAttributeCount),M.push(b.numDirLights),M.push(b.numPointLights),M.push(b.numSpotLights),M.push(b.numSpotLightMaps),M.push(b.numHemiLights),M.push(b.numRectAreaLights),M.push(b.numDirLightShadows),M.push(b.numPointLightShadows),M.push(b.numSpotLightShadows),M.push(b.numSpotLightShadowsWithMaps),M.push(b.numLightProbes),M.push(b.shadowMapType),M.push(b.toneMapping),M.push(b.numClippingPlanes),M.push(b.numClipIntersection),M.push(b.depthPacking)}function y(M,b){o.disableAll(),b.supportsVertexTextures&&o.enable(0),b.instancing&&o.enable(1),b.instancingColor&&o.enable(2),b.instancingMorph&&o.enable(3),b.matcap&&o.enable(4),b.envMap&&o.enable(5),b.normalMapObjectSpace&&o.enable(6),b.normalMapTangentSpace&&o.enable(7),b.clearcoat&&o.enable(8),b.iridescence&&o.enable(9),b.alphaTest&&o.enable(10),b.vertexColors&&o.enable(11),b.vertexAlphas&&o.enable(12),b.vertexUv1s&&o.enable(13),b.vertexUv2s&&o.enable(14),b.vertexUv3s&&o.enable(15),b.vertexTangents&&o.enable(16),b.anisotropy&&o.enable(17),b.alphaHash&&o.enable(18),b.batching&&o.enable(19),b.dispersion&&o.enable(20),b.batchingColor&&o.enable(21),M.push(o.mask),o.disableAll(),b.fog&&o.enable(0),b.useFog&&o.enable(1),b.flatShading&&o.enable(2),b.logarithmicDepthBuffer&&o.enable(3),b.reverseDepthBuffer&&o.enable(4),b.skinning&&o.enable(5),b.morphTargets&&o.enable(6),b.morphNormals&&o.enable(7),b.morphColors&&o.enable(8),b.premultipliedAlpha&&o.enable(9),b.shadowMapEnabled&&o.enable(10),b.doubleSided&&o.enable(11),b.flipSided&&o.enable(12),b.useDepthPacking&&o.enable(13),b.dithering&&o.enable(14),b.transmission&&o.enable(15),b.sheen&&o.enable(16),b.opaque&&o.enable(17),b.pointsUvs&&o.enable(18),b.decodeVideoTexture&&o.enable(19),b.decodeVideoTextureEmissive&&o.enable(20),b.alphaToCoverage&&o.enable(21),M.push(o.mask)}function v(M){const b=m[M.type];let P;if(b){const D=An[b];P=td.clone(D.uniforms)}else P=M.uniforms;return P}function A(M,b){let P;for(let D=0,N=u.length;D<N;D++){const $=u[D];if($.cacheKey===b){P=$,++P.usedTimes;break}}return P===void 0&&(P=new pm(i,b,M,r),u.push(P)),P}function R(M){if(--M.usedTimes===0){const b=u.indexOf(M);u[b]=u[u.length-1],u.pop(),M.destroy()}}function w(M){l.remove(M)}function E(){l.dispose()}return{getParameters:g,getProgramCacheKey:p,getUniforms:v,acquireProgram:A,releaseProgram:R,releaseShaderCache:w,programs:u,dispose:E}}function vm(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function _m(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function zl(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Hl(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(f,h,d,m,x,g){let p=i[t];return p===void 0?(p={id:f.id,object:f,geometry:h,material:d,groupOrder:m,renderOrder:f.renderOrder,z:x,group:g},i[t]=p):(p.id=f.id,p.object=f,p.geometry=h,p.material=d,p.groupOrder=m,p.renderOrder=f.renderOrder,p.z=x,p.group=g),t++,p}function o(f,h,d,m,x,g){const p=a(f,h,d,m,x,g);d.transmission>0?n.push(p):d.transparent===!0?s.push(p):e.push(p)}function l(f,h,d,m,x,g){const p=a(f,h,d,m,x,g);d.transmission>0?n.unshift(p):d.transparent===!0?s.unshift(p):e.unshift(p)}function c(f,h){e.length>1&&e.sort(f||_m),n.length>1&&n.sort(h||zl),s.length>1&&s.sort(h||zl)}function u(){for(let f=t,h=i.length;f<h;f++){const d=i[f];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:u,sort:c}}function bm(){let i=new WeakMap;function t(n,s){const r=i.get(n);let a;return r===void 0?(a=new Hl,i.set(n,[a])):s>=r.length?(a=new Hl,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function Mm(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new O,color:new Wt};break;case"SpotLight":e={position:new O,direction:new O,color:new Wt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new O,color:new Wt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new O,skyColor:new Wt,groundColor:new Wt};break;case"RectAreaLight":e={color:new Wt,position:new O,halfWidth:new O,halfHeight:new O};break}return i[t.id]=e,e}}}function Sm(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Yt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Yt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Yt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let wm=0;function Em(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Tm(i){const t=new Mm,e=Sm(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new O);const s=new O,r=new le,a=new le;function o(c){let u=0,f=0,h=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let d=0,m=0,x=0,g=0,p=0,_=0,y=0,v=0,A=0,R=0,w=0;c.sort(Em);for(let M=0,b=c.length;M<b;M++){const P=c[M],D=P.color,N=P.intensity,$=P.distance,j=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)u+=D.r*N,f+=D.g*N,h+=D.b*N;else if(P.isLightProbe){for(let X=0;X<9;X++)n.probe[X].addScaledVector(P.sh.coefficients[X],N);w++}else if(P.isDirectionalLight){const X=t.get(P);if(X.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const q=P.shadow,G=e.get(P);G.shadowIntensity=q.intensity,G.shadowBias=q.bias,G.shadowNormalBias=q.normalBias,G.shadowRadius=q.radius,G.shadowMapSize=q.mapSize,n.directionalShadow[d]=G,n.directionalShadowMap[d]=j,n.directionalShadowMatrix[d]=P.shadow.matrix,_++}n.directional[d]=X,d++}else if(P.isSpotLight){const X=t.get(P);X.position.setFromMatrixPosition(P.matrixWorld),X.color.copy(D).multiplyScalar(N),X.distance=$,X.coneCos=Math.cos(P.angle),X.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),X.decay=P.decay,n.spot[x]=X;const q=P.shadow;if(P.map&&(n.spotLightMap[A]=P.map,A++,q.updateMatrices(P),P.castShadow&&R++),n.spotLightMatrix[x]=q.matrix,P.castShadow){const G=e.get(P);G.shadowIntensity=q.intensity,G.shadowBias=q.bias,G.shadowNormalBias=q.normalBias,G.shadowRadius=q.radius,G.shadowMapSize=q.mapSize,n.spotShadow[x]=G,n.spotShadowMap[x]=j,v++}x++}else if(P.isRectAreaLight){const X=t.get(P);X.color.copy(D).multiplyScalar(N),X.halfWidth.set(P.width*.5,0,0),X.halfHeight.set(0,P.height*.5,0),n.rectArea[g]=X,g++}else if(P.isPointLight){const X=t.get(P);if(X.color.copy(P.color).multiplyScalar(P.intensity),X.distance=P.distance,X.decay=P.decay,P.castShadow){const q=P.shadow,G=e.get(P);G.shadowIntensity=q.intensity,G.shadowBias=q.bias,G.shadowNormalBias=q.normalBias,G.shadowRadius=q.radius,G.shadowMapSize=q.mapSize,G.shadowCameraNear=q.camera.near,G.shadowCameraFar=q.camera.far,n.pointShadow[m]=G,n.pointShadowMap[m]=j,n.pointShadowMatrix[m]=P.shadow.matrix,y++}n.point[m]=X,m++}else if(P.isHemisphereLight){const X=t.get(P);X.skyColor.copy(P.color).multiplyScalar(N),X.groundColor.copy(P.groundColor).multiplyScalar(N),n.hemi[p]=X,p++}}g>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ct.LTC_FLOAT_1,n.rectAreaLTC2=ct.LTC_FLOAT_2):(n.rectAreaLTC1=ct.LTC_HALF_1,n.rectAreaLTC2=ct.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=h;const E=n.hash;(E.directionalLength!==d||E.pointLength!==m||E.spotLength!==x||E.rectAreaLength!==g||E.hemiLength!==p||E.numDirectionalShadows!==_||E.numPointShadows!==y||E.numSpotShadows!==v||E.numSpotMaps!==A||E.numLightProbes!==w)&&(n.directional.length=d,n.spot.length=x,n.rectArea.length=g,n.point.length=m,n.hemi.length=p,n.directionalShadow.length=_,n.directionalShadowMap.length=_,n.pointShadow.length=y,n.pointShadowMap.length=y,n.spotShadow.length=v,n.spotShadowMap.length=v,n.directionalShadowMatrix.length=_,n.pointShadowMatrix.length=y,n.spotLightMatrix.length=v+A-R,n.spotLightMap.length=A,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=w,E.directionalLength=d,E.pointLength=m,E.spotLength=x,E.rectAreaLength=g,E.hemiLength=p,E.numDirectionalShadows=_,E.numPointShadows=y,E.numSpotShadows=v,E.numSpotMaps=A,E.numLightProbes=w,n.version=wm++)}function l(c,u){let f=0,h=0,d=0,m=0,x=0;const g=u.matrixWorldInverse;for(let p=0,_=c.length;p<_;p++){const y=c[p];if(y.isDirectionalLight){const v=n.directional[f];v.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(g),f++}else if(y.isSpotLight){const v=n.spot[d];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(g),v.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),v.direction.sub(s),v.direction.transformDirection(g),d++}else if(y.isRectAreaLight){const v=n.rectArea[m];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(g),a.identity(),r.copy(y.matrixWorld),r.premultiply(g),a.extractRotation(r),v.halfWidth.set(y.width*.5,0,0),v.halfHeight.set(0,y.height*.5,0),v.halfWidth.applyMatrix4(a),v.halfHeight.applyMatrix4(a),m++}else if(y.isPointLight){const v=n.point[h];v.position.setFromMatrixPosition(y.matrixWorld),v.position.applyMatrix4(g),h++}else if(y.isHemisphereLight){const v=n.hemi[x];v.direction.setFromMatrixPosition(y.matrixWorld),v.direction.transformDirection(g),x++}}}return{setup:o,setupView:l,state:n}}function Gl(i){const t=new Tm(i),e=[],n=[];function s(u){c.camera=u,e.length=0,n.length=0}function r(u){e.push(u)}function a(u){n.push(u)}function o(){t.setup(e)}function l(u){t.setupView(e,u)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:s,state:c,setupLights:o,setupLightsView:l,pushLight:r,pushShadow:a}}function Am(i){let t=new WeakMap;function e(s,r=0){const a=t.get(s);let o;return a===void 0?(o=new Gl(i),t.set(s,[o])):r>=a.length?(o=new Gl(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}class Rm extends ss{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Su,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Cm extends ss{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const Pm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,km=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Lm(i,t,e){let n=new Eo;const s=new Yt,r=new Yt,a=new ve,o=new Rm({depthPacking:wu}),l=new Cm,c={},u=e.maxTextureSize,f={[ri]:Ze,[Ze]:ri,[sn]:sn},h=new Vn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Yt},radius:{value:4}},vertexShader:Pm,fragmentShader:km}),d=h.clone();d.defines.HORIZONTAL_PASS=1;const m=new Re;m.setAttribute("position",new me(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new xe(m,h),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=go;let p=this.type;this.render=function(R,w,E){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||R.length===0)return;const M=i.getRenderTarget(),b=i.getActiveCubeFace(),P=i.getActiveMipmapLevel(),D=i.state;D.setBlending(ii),D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);const N=p!==On&&this.type===On,$=p===On&&this.type!==On;for(let j=0,X=R.length;j<X;j++){const q=R[j],G=q.shadow;if(G===void 0){console.warn("THREE.WebGLShadowMap:",q,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;s.copy(G.mapSize);const nt=G.getFrameExtents();if(s.multiply(nt),r.copy(G.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/nt.x),s.x=r.x*nt.x,G.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/nt.y),s.y=r.y*nt.y,G.mapSize.y=r.y)),G.map===null||N===!0||$===!0){const B=this.type!==On?{minFilter:He,magFilter:He}:{};G.map!==null&&G.map.dispose(),G.map=new bi(s.x,s.y,B),G.map.texture.name=q.name+".shadowMap",G.camera.updateProjectionMatrix()}i.setRenderTarget(G.map),i.clear();const ut=G.getViewportCount();for(let B=0;B<ut;B++){const ot=G.getViewport(B);a.set(r.x*ot.x,r.y*ot.y,r.x*ot.z,r.y*ot.w),D.viewport(a),G.updateMatrices(q,B),n=G.getFrustum(),v(w,E,G.camera,q,this.type)}G.isPointLightShadow!==!0&&this.type===On&&_(G,E),G.needsUpdate=!1}p=this.type,g.needsUpdate=!1,i.setRenderTarget(M,b,P)};function _(R,w){const E=t.update(x);h.defines.VSM_SAMPLES!==R.blurSamples&&(h.defines.VSM_SAMPLES=R.blurSamples,d.defines.VSM_SAMPLES=R.blurSamples,h.needsUpdate=!0,d.needsUpdate=!0),R.mapPass===null&&(R.mapPass=new bi(s.x,s.y)),h.uniforms.shadow_pass.value=R.map.texture,h.uniforms.resolution.value=R.mapSize,h.uniforms.radius.value=R.radius,i.setRenderTarget(R.mapPass),i.clear(),i.renderBufferDirect(w,null,E,h,x,null),d.uniforms.shadow_pass.value=R.mapPass.texture,d.uniforms.resolution.value=R.mapSize,d.uniforms.radius.value=R.radius,i.setRenderTarget(R.map),i.clear(),i.renderBufferDirect(w,null,E,d,x,null)}function y(R,w,E,M){let b=null;const P=E.isPointLight===!0?R.customDistanceMaterial:R.customDepthMaterial;if(P!==void 0)b=P;else if(b=E.isPointLight===!0?l:o,i.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0){const D=b.uuid,N=w.uuid;let $=c[D];$===void 0&&($={},c[D]=$);let j=$[N];j===void 0&&(j=b.clone(),$[N]=j,w.addEventListener("dispose",A)),b=j}if(b.visible=w.visible,b.wireframe=w.wireframe,M===On?b.side=w.shadowSide!==null?w.shadowSide:w.side:b.side=w.shadowSide!==null?w.shadowSide:f[w.side],b.alphaMap=w.alphaMap,b.alphaTest=w.alphaTest,b.map=w.map,b.clipShadows=w.clipShadows,b.clippingPlanes=w.clippingPlanes,b.clipIntersection=w.clipIntersection,b.displacementMap=w.displacementMap,b.displacementScale=w.displacementScale,b.displacementBias=w.displacementBias,b.wireframeLinewidth=w.wireframeLinewidth,b.linewidth=w.linewidth,E.isPointLight===!0&&b.isMeshDistanceMaterial===!0){const D=i.properties.get(b);D.light=E}return b}function v(R,w,E,M,b){if(R.visible===!1)return;if(R.layers.test(w.layers)&&(R.isMesh||R.isLine||R.isPoints)&&(R.castShadow||R.receiveShadow&&b===On)&&(!R.frustumCulled||n.intersectsObject(R))){R.modelViewMatrix.multiplyMatrices(E.matrixWorldInverse,R.matrixWorld);const N=t.update(R),$=R.material;if(Array.isArray($)){const j=N.groups;for(let X=0,q=j.length;X<q;X++){const G=j[X],nt=$[G.materialIndex];if(nt&&nt.visible){const ut=y(R,nt,M,b);R.onBeforeShadow(i,R,w,E,N,ut,G),i.renderBufferDirect(E,null,N,ut,R,G),R.onAfterShadow(i,R,w,E,N,ut,G)}}}else if($.visible){const j=y(R,$,M,b);R.onBeforeShadow(i,R,w,E,N,j,null),i.renderBufferDirect(E,null,N,j,R,null),R.onAfterShadow(i,R,w,E,N,j,null)}}const D=R.children;for(let N=0,$=D.length;N<$;N++)v(D[N],w,E,M,b)}function A(R){R.target.removeEventListener("dispose",A);for(const E in c){const M=c[E],b=R.target.uuid;b in M&&(M[b].dispose(),delete M[b])}}}const Um={[ba]:Ma,[Sa]:Ta,[wa]:Aa,[ji]:Ea,[Ma]:ba,[Ta]:Sa,[Aa]:wa,[Ea]:ji};function Dm(i,t){function e(){let k=!1;const dt=new ve;let Y=null;const Q=new ve(0,0,0,0);return{setMask:function(yt){Y!==yt&&!k&&(i.colorMask(yt,yt,yt,yt),Y=yt)},setLocked:function(yt){k=yt},setClear:function(yt,gt,Ht,ye,Ue){Ue===!0&&(yt*=ye,gt*=ye,Ht*=ye),dt.set(yt,gt,Ht,ye),Q.equals(dt)===!1&&(i.clearColor(yt,gt,Ht,ye),Q.copy(dt))},reset:function(){k=!1,Y=null,Q.set(-1,0,0,0)}}}function n(){let k=!1,dt=!1,Y=null,Q=null,yt=null;return{setReversed:function(gt){if(dt!==gt){const Ht=t.get("EXT_clip_control");dt?Ht.clipControlEXT(Ht.LOWER_LEFT_EXT,Ht.ZERO_TO_ONE_EXT):Ht.clipControlEXT(Ht.LOWER_LEFT_EXT,Ht.NEGATIVE_ONE_TO_ONE_EXT);const ye=yt;yt=null,this.setClear(ye)}dt=gt},getReversed:function(){return dt},setTest:function(gt){gt?it(i.DEPTH_TEST):wt(i.DEPTH_TEST)},setMask:function(gt){Y!==gt&&!k&&(i.depthMask(gt),Y=gt)},setFunc:function(gt){if(dt&&(gt=Um[gt]),Q!==gt){switch(gt){case ba:i.depthFunc(i.NEVER);break;case Ma:i.depthFunc(i.ALWAYS);break;case Sa:i.depthFunc(i.LESS);break;case ji:i.depthFunc(i.LEQUAL);break;case wa:i.depthFunc(i.EQUAL);break;case Ea:i.depthFunc(i.GEQUAL);break;case Ta:i.depthFunc(i.GREATER);break;case Aa:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Q=gt}},setLocked:function(gt){k=gt},setClear:function(gt){yt!==gt&&(dt&&(gt=1-gt),i.clearDepth(gt),yt=gt)},reset:function(){k=!1,Y=null,Q=null,yt=null,dt=!1}}}function s(){let k=!1,dt=null,Y=null,Q=null,yt=null,gt=null,Ht=null,ye=null,Ue=null;return{setTest:function(se){k||(se?it(i.STENCIL_TEST):wt(i.STENCIL_TEST))},setMask:function(se){dt!==se&&!k&&(i.stencilMask(se),dt=se)},setFunc:function(se,mn,kn){(Y!==se||Q!==mn||yt!==kn)&&(i.stencilFunc(se,mn,kn),Y=se,Q=mn,yt=kn)},setOp:function(se,mn,kn){(gt!==se||Ht!==mn||ye!==kn)&&(i.stencilOp(se,mn,kn),gt=se,Ht=mn,ye=kn)},setLocked:function(se){k=se},setClear:function(se){Ue!==se&&(i.clearStencil(se),Ue=se)},reset:function(){k=!1,dt=null,Y=null,Q=null,yt=null,gt=null,Ht=null,ye=null,Ue=null}}}const r=new e,a=new n,o=new s,l=new WeakMap,c=new WeakMap;let u={},f={},h=new WeakMap,d=[],m=null,x=!1,g=null,p=null,_=null,y=null,v=null,A=null,R=null,w=new Wt(0,0,0),E=0,M=!1,b=null,P=null,D=null,N=null,$=null;const j=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let X=!1,q=0;const G=i.getParameter(i.VERSION);G.indexOf("WebGL")!==-1?(q=parseFloat(/^WebGL (\d)/.exec(G)[1]),X=q>=1):G.indexOf("OpenGL ES")!==-1&&(q=parseFloat(/^OpenGL ES (\d)/.exec(G)[1]),X=q>=2);let nt=null,ut={};const B=i.getParameter(i.SCISSOR_BOX),ot=i.getParameter(i.VIEWPORT),ht=new ve().fromArray(B),z=new ve().fromArray(ot);function K(k,dt,Y,Q){const yt=new Uint8Array(4),gt=i.createTexture();i.bindTexture(k,gt),i.texParameteri(k,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(k,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ht=0;Ht<Y;Ht++)k===i.TEXTURE_3D||k===i.TEXTURE_2D_ARRAY?i.texImage3D(dt,0,i.RGBA,1,1,Q,0,i.RGBA,i.UNSIGNED_BYTE,yt):i.texImage2D(dt+Ht,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,yt);return gt}const lt={};lt[i.TEXTURE_2D]=K(i.TEXTURE_2D,i.TEXTURE_2D,1),lt[i.TEXTURE_CUBE_MAP]=K(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),lt[i.TEXTURE_2D_ARRAY]=K(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),lt[i.TEXTURE_3D]=K(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),it(i.DEPTH_TEST),a.setFunc(ji),jt(!1),Kt(Xo),it(i.CULL_FACE),I(ii);function it(k){u[k]!==!0&&(i.enable(k),u[k]=!0)}function wt(k){u[k]!==!1&&(i.disable(k),u[k]=!1)}function Pt(k,dt){return f[k]!==dt?(i.bindFramebuffer(k,dt),f[k]=dt,k===i.DRAW_FRAMEBUFFER&&(f[i.FRAMEBUFFER]=dt),k===i.FRAMEBUFFER&&(f[i.DRAW_FRAMEBUFFER]=dt),!0):!1}function st(k,dt){let Y=d,Q=!1;if(k){Y=h.get(dt),Y===void 0&&(Y=[],h.set(dt,Y));const yt=k.textures;if(Y.length!==yt.length||Y[0]!==i.COLOR_ATTACHMENT0){for(let gt=0,Ht=yt.length;gt<Ht;gt++)Y[gt]=i.COLOR_ATTACHMENT0+gt;Y.length=yt.length,Q=!0}}else Y[0]!==i.BACK&&(Y[0]=i.BACK,Q=!0);Q&&i.drawBuffers(Y)}function Lt(k){return m!==k?(i.useProgram(k),m=k,!0):!1}const Ut={[xi]:i.FUNC_ADD,[Zh]:i.FUNC_SUBTRACT,[Jh]:i.FUNC_REVERSE_SUBTRACT};Ut[Qh]=i.MIN,Ut[tu]=i.MAX;const ge={[eu]:i.ZERO,[nu]:i.ONE,[iu]:i.SRC_COLOR,[va]:i.SRC_ALPHA,[cu]:i.SRC_ALPHA_SATURATE,[ou]:i.DST_COLOR,[ru]:i.DST_ALPHA,[su]:i.ONE_MINUS_SRC_COLOR,[_a]:i.ONE_MINUS_SRC_ALPHA,[lu]:i.ONE_MINUS_DST_COLOR,[au]:i.ONE_MINUS_DST_ALPHA,[hu]:i.CONSTANT_COLOR,[uu]:i.ONE_MINUS_CONSTANT_COLOR,[du]:i.CONSTANT_ALPHA,[fu]:i.ONE_MINUS_CONSTANT_ALPHA};function I(k,dt,Y,Q,yt,gt,Ht,ye,Ue,se){if(k===ii){x===!0&&(wt(i.BLEND),x=!1);return}if(x===!1&&(it(i.BLEND),x=!0),k!==Kh){if(k!==g||se!==M){if((p!==xi||v!==xi)&&(i.blendEquation(i.FUNC_ADD),p=xi,v=xi),se)switch(k){case Wi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ws:i.blendFunc(i.ONE,i.ONE);break;case qo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Yo:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}else switch(k){case Wi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ws:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case qo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Yo:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}_=null,y=null,A=null,R=null,w.set(0,0,0),E=0,g=k,M=se}return}yt=yt||dt,gt=gt||Y,Ht=Ht||Q,(dt!==p||yt!==v)&&(i.blendEquationSeparate(Ut[dt],Ut[yt]),p=dt,v=yt),(Y!==_||Q!==y||gt!==A||Ht!==R)&&(i.blendFuncSeparate(ge[Y],ge[Q],ge[gt],ge[Ht]),_=Y,y=Q,A=gt,R=Ht),(ye.equals(w)===!1||Ue!==E)&&(i.blendColor(ye.r,ye.g,ye.b,Ue),w.copy(ye),E=Ue),g=k,M=!1}function on(k,dt){k.side===sn?wt(i.CULL_FACE):it(i.CULL_FACE);let Y=k.side===Ze;dt&&(Y=!Y),jt(Y),k.blending===Wi&&k.transparent===!1?I(ii):I(k.blending,k.blendEquation,k.blendSrc,k.blendDst,k.blendEquationAlpha,k.blendSrcAlpha,k.blendDstAlpha,k.blendColor,k.blendAlpha,k.premultipliedAlpha),a.setFunc(k.depthFunc),a.setTest(k.depthTest),a.setMask(k.depthWrite),r.setMask(k.colorWrite);const Q=k.stencilWrite;o.setTest(Q),Q&&(o.setMask(k.stencilWriteMask),o.setFunc(k.stencilFunc,k.stencilRef,k.stencilFuncMask),o.setOp(k.stencilFail,k.stencilZFail,k.stencilZPass)),de(k.polygonOffset,k.polygonOffsetFactor,k.polygonOffsetUnits),k.alphaToCoverage===!0?it(i.SAMPLE_ALPHA_TO_COVERAGE):wt(i.SAMPLE_ALPHA_TO_COVERAGE)}function jt(k){b!==k&&(k?i.frontFace(i.CW):i.frontFace(i.CCW),b=k)}function Kt(k){k!==Yh?(it(i.CULL_FACE),k!==P&&(k===Xo?i.cullFace(i.BACK):k===jh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):wt(i.CULL_FACE),P=k}function Dt(k){k!==D&&(X&&i.lineWidth(k),D=k)}function de(k,dt,Y){k?(it(i.POLYGON_OFFSET_FILL),(N!==dt||$!==Y)&&(i.polygonOffset(dt,Y),N=dt,$=Y)):wt(i.POLYGON_OFFSET_FILL)}function kt(k){k?it(i.SCISSOR_TEST):wt(i.SCISSOR_TEST)}function C(k){k===void 0&&(k=i.TEXTURE0+j-1),nt!==k&&(i.activeTexture(k),nt=k)}function S(k,dt,Y){Y===void 0&&(nt===null?Y=i.TEXTURE0+j-1:Y=nt);let Q=ut[Y];Q===void 0&&(Q={type:void 0,texture:void 0},ut[Y]=Q),(Q.type!==k||Q.texture!==dt)&&(nt!==Y&&(i.activeTexture(Y),nt=Y),i.bindTexture(k,dt||lt[k]),Q.type=k,Q.texture=dt)}function H(){const k=ut[nt];k!==void 0&&k.type!==void 0&&(i.bindTexture(k.type,null),k.type=void 0,k.texture=void 0)}function J(){try{i.compressedTexImage2D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function et(){try{i.compressedTexImage3D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Z(){try{i.texSubImage2D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Rt(){try{i.texSubImage3D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function ft(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function vt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Jt(){try{i.texStorage2D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function rt(){try{i.texStorage3D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function bt(){try{i.texImage2D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function It(){try{i.texImage3D.apply(i,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Ot(k){ht.equals(k)===!1&&(i.scissor(k.x,k.y,k.z,k.w),ht.copy(k))}function Mt(k){z.equals(k)===!1&&(i.viewport(k.x,k.y,k.z,k.w),z.copy(k))}function Zt(k,dt){let Y=c.get(dt);Y===void 0&&(Y=new WeakMap,c.set(dt,Y));let Q=Y.get(k);Q===void 0&&(Q=i.getUniformBlockIndex(dt,k.name),Y.set(k,Q))}function $t(k,dt){const Q=c.get(dt).get(k);l.get(dt)!==Q&&(i.uniformBlockBinding(dt,Q,k.__bindingPointIndex),l.set(dt,Q))}function ce(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),u={},nt=null,ut={},f={},h=new WeakMap,d=[],m=null,x=!1,g=null,p=null,_=null,y=null,v=null,A=null,R=null,w=new Wt(0,0,0),E=0,M=!1,b=null,P=null,D=null,N=null,$=null,ht.set(0,0,i.canvas.width,i.canvas.height),z.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:it,disable:wt,bindFramebuffer:Pt,drawBuffers:st,useProgram:Lt,setBlending:I,setMaterial:on,setFlipSided:jt,setCullFace:Kt,setLineWidth:Dt,setPolygonOffset:de,setScissorTest:kt,activeTexture:C,bindTexture:S,unbindTexture:H,compressedTexImage2D:J,compressedTexImage3D:et,texImage2D:bt,texImage3D:It,updateUBOMapping:Zt,uniformBlockBinding:$t,texStorage2D:Jt,texStorage3D:rt,texSubImage2D:Z,texSubImage3D:Rt,compressedTexSubImage2D:ft,compressedTexSubImage3D:vt,scissor:Ot,viewport:Mt,reset:ce}}function Vl(i,t,e,n){const s=Im(n);switch(e){case Ec:return i*t;case Ac:return i*t;case Rc:return i*t*2;case wr:return i*t/s.components*s.byteLength;case _o:return i*t/s.components*s.byteLength;case Cc:return i*t*2/s.components*s.byteLength;case bo:return i*t*2/s.components*s.byteLength;case Tc:return i*t*3/s.components*s.byteLength;case fn:return i*t*4/s.components*s.byteLength;case Mo:return i*t*4/s.components*s.byteLength;case cr:case hr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case ur:case dr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ua:case Ia:return Math.max(i,16)*Math.max(t,8)/4;case La:case Da:return Math.max(i,8)*Math.max(t,8)/2;case Na:case Fa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Oa:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ba:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case za:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Ha:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Ga:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Va:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Wa:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case $a:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Xa:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case qa:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Ya:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case ja:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Ka:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Za:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Ja:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case fr:case Qa:case to:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Pc:case eo:return Math.ceil(i/4)*Math.ceil(t/4)*8;case no:case io:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Im(i){switch(i){case Pn:case Mc:return{byteLength:1,components:1};case Cs:case Sc:case ks:return{byteLength:2,components:1};case yo:case vo:return{byteLength:2,components:4};case _i:case xo:case Cn:return{byteLength:4,components:1};case wc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}function Nm(i,t,e,n,s,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Yt,u=new WeakMap;let f;const h=new WeakMap;let d=!1;try{d=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(C,S){return d?new OffscreenCanvas(C,S):vr("canvas")}function x(C,S,H){let J=1;const et=kt(C);if((et.width>H||et.height>H)&&(J=H/Math.max(et.width,et.height)),J<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const Z=Math.floor(J*et.width),Rt=Math.floor(J*et.height);f===void 0&&(f=m(Z,Rt));const ft=S?m(Z,Rt):f;return ft.width=Z,ft.height=Rt,ft.getContext("2d").drawImage(C,0,0,Z,Rt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+et.width+"x"+et.height+") to ("+Z+"x"+Rt+")."),ft}else return"data"in C&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+et.width+"x"+et.height+")."),C;return C}function g(C){return C.generateMipmaps}function p(C){i.generateMipmap(C)}function _(C){return C.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?i.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function y(C,S,H,J,et=!1){if(C!==null){if(i[C]!==void 0)return i[C];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let Z=S;if(S===i.RED&&(H===i.FLOAT&&(Z=i.R32F),H===i.HALF_FLOAT&&(Z=i.R16F),H===i.UNSIGNED_BYTE&&(Z=i.R8)),S===i.RED_INTEGER&&(H===i.UNSIGNED_BYTE&&(Z=i.R8UI),H===i.UNSIGNED_SHORT&&(Z=i.R16UI),H===i.UNSIGNED_INT&&(Z=i.R32UI),H===i.BYTE&&(Z=i.R8I),H===i.SHORT&&(Z=i.R16I),H===i.INT&&(Z=i.R32I)),S===i.RG&&(H===i.FLOAT&&(Z=i.RG32F),H===i.HALF_FLOAT&&(Z=i.RG16F),H===i.UNSIGNED_BYTE&&(Z=i.RG8)),S===i.RG_INTEGER&&(H===i.UNSIGNED_BYTE&&(Z=i.RG8UI),H===i.UNSIGNED_SHORT&&(Z=i.RG16UI),H===i.UNSIGNED_INT&&(Z=i.RG32UI),H===i.BYTE&&(Z=i.RG8I),H===i.SHORT&&(Z=i.RG16I),H===i.INT&&(Z=i.RG32I)),S===i.RGB_INTEGER&&(H===i.UNSIGNED_BYTE&&(Z=i.RGB8UI),H===i.UNSIGNED_SHORT&&(Z=i.RGB16UI),H===i.UNSIGNED_INT&&(Z=i.RGB32UI),H===i.BYTE&&(Z=i.RGB8I),H===i.SHORT&&(Z=i.RGB16I),H===i.INT&&(Z=i.RGB32I)),S===i.RGBA_INTEGER&&(H===i.UNSIGNED_BYTE&&(Z=i.RGBA8UI),H===i.UNSIGNED_SHORT&&(Z=i.RGBA16UI),H===i.UNSIGNED_INT&&(Z=i.RGBA32UI),H===i.BYTE&&(Z=i.RGBA8I),H===i.SHORT&&(Z=i.RGBA16I),H===i.INT&&(Z=i.RGBA32I)),S===i.RGB&&H===i.UNSIGNED_INT_5_9_9_9_REV&&(Z=i.RGB9_E5),S===i.RGBA){const Rt=et?Er:Qt.getTransfer(J);H===i.FLOAT&&(Z=i.RGBA32F),H===i.HALF_FLOAT&&(Z=i.RGBA16F),H===i.UNSIGNED_BYTE&&(Z=Rt===ae?i.SRGB8_ALPHA8:i.RGBA8),H===i.UNSIGNED_SHORT_4_4_4_4&&(Z=i.RGBA4),H===i.UNSIGNED_SHORT_5_5_5_1&&(Z=i.RGB5_A1)}return(Z===i.R16F||Z===i.R32F||Z===i.RG16F||Z===i.RG32F||Z===i.RGBA16F||Z===i.RGBA32F)&&t.get("EXT_color_buffer_float"),Z}function v(C,S){let H;return C?S===null||S===_i||S===Ji?H=i.DEPTH24_STENCIL8:S===Cn?H=i.DEPTH32F_STENCIL8:S===Cs&&(H=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===_i||S===Ji?H=i.DEPTH_COMPONENT24:S===Cn?H=i.DEPTH_COMPONENT32F:S===Cs&&(H=i.DEPTH_COMPONENT16),H}function A(C,S){return g(C)===!0||C.isFramebufferTexture&&C.minFilter!==He&&C.minFilter!==dn?Math.log2(Math.max(S.width,S.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?S.mipmaps.length:1}function R(C){const S=C.target;S.removeEventListener("dispose",R),E(S),S.isVideoTexture&&u.delete(S)}function w(C){const S=C.target;S.removeEventListener("dispose",w),b(S)}function E(C){const S=n.get(C);if(S.__webglInit===void 0)return;const H=C.source,J=h.get(H);if(J){const et=J[S.__cacheKey];et.usedTimes--,et.usedTimes===0&&M(C),Object.keys(J).length===0&&h.delete(H)}n.remove(C)}function M(C){const S=n.get(C);i.deleteTexture(S.__webglTexture);const H=C.source,J=h.get(H);delete J[S.__cacheKey],a.memory.textures--}function b(C){const S=n.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),n.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let J=0;J<6;J++){if(Array.isArray(S.__webglFramebuffer[J]))for(let et=0;et<S.__webglFramebuffer[J].length;et++)i.deleteFramebuffer(S.__webglFramebuffer[J][et]);else i.deleteFramebuffer(S.__webglFramebuffer[J]);S.__webglDepthbuffer&&i.deleteRenderbuffer(S.__webglDepthbuffer[J])}else{if(Array.isArray(S.__webglFramebuffer))for(let J=0;J<S.__webglFramebuffer.length;J++)i.deleteFramebuffer(S.__webglFramebuffer[J]);else i.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&i.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&i.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let J=0;J<S.__webglColorRenderbuffer.length;J++)S.__webglColorRenderbuffer[J]&&i.deleteRenderbuffer(S.__webglColorRenderbuffer[J]);S.__webglDepthRenderbuffer&&i.deleteRenderbuffer(S.__webglDepthRenderbuffer)}const H=C.textures;for(let J=0,et=H.length;J<et;J++){const Z=n.get(H[J]);Z.__webglTexture&&(i.deleteTexture(Z.__webglTexture),a.memory.textures--),n.remove(H[J])}n.remove(C)}let P=0;function D(){P=0}function N(){const C=P;return C>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+s.maxTextures),P+=1,C}function $(C){const S=[];return S.push(C.wrapS),S.push(C.wrapT),S.push(C.wrapR||0),S.push(C.magFilter),S.push(C.minFilter),S.push(C.anisotropy),S.push(C.internalFormat),S.push(C.format),S.push(C.type),S.push(C.generateMipmaps),S.push(C.premultiplyAlpha),S.push(C.flipY),S.push(C.unpackAlignment),S.push(C.colorSpace),S.join()}function j(C,S){const H=n.get(C);if(C.isVideoTexture&&Dt(C),C.isRenderTargetTexture===!1&&C.version>0&&H.__version!==C.version){const J=C.image;if(J===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(J.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{z(H,C,S);return}}e.bindTexture(i.TEXTURE_2D,H.__webglTexture,i.TEXTURE0+S)}function X(C,S){const H=n.get(C);if(C.version>0&&H.__version!==C.version){z(H,C,S);return}e.bindTexture(i.TEXTURE_2D_ARRAY,H.__webglTexture,i.TEXTURE0+S)}function q(C,S){const H=n.get(C);if(C.version>0&&H.__version!==C.version){z(H,C,S);return}e.bindTexture(i.TEXTURE_3D,H.__webglTexture,i.TEXTURE0+S)}function G(C,S){const H=n.get(C);if(C.version>0&&H.__version!==C.version){K(H,C,S);return}e.bindTexture(i.TEXTURE_CUBE_MAP,H.__webglTexture,i.TEXTURE0+S)}const nt={[Pa]:i.REPEAT,[ei]:i.CLAMP_TO_EDGE,[ka]:i.MIRRORED_REPEAT},ut={[He]:i.NEAREST,[Mu]:i.NEAREST_MIPMAP_NEAREST,[Fs]:i.NEAREST_MIPMAP_LINEAR,[dn]:i.LINEAR,[Fr]:i.LINEAR_MIPMAP_NEAREST,[vi]:i.LINEAR_MIPMAP_LINEAR},B={[Tu]:i.NEVER,[Lu]:i.ALWAYS,[Au]:i.LESS,[Lc]:i.LEQUAL,[Ru]:i.EQUAL,[ku]:i.GEQUAL,[Cu]:i.GREATER,[Pu]:i.NOTEQUAL};function ot(C,S){if(S.type===Cn&&t.has("OES_texture_float_linear")===!1&&(S.magFilter===dn||S.magFilter===Fr||S.magFilter===Fs||S.magFilter===vi||S.minFilter===dn||S.minFilter===Fr||S.minFilter===Fs||S.minFilter===vi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(C,i.TEXTURE_WRAP_S,nt[S.wrapS]),i.texParameteri(C,i.TEXTURE_WRAP_T,nt[S.wrapT]),(C===i.TEXTURE_3D||C===i.TEXTURE_2D_ARRAY)&&i.texParameteri(C,i.TEXTURE_WRAP_R,nt[S.wrapR]),i.texParameteri(C,i.TEXTURE_MAG_FILTER,ut[S.magFilter]),i.texParameteri(C,i.TEXTURE_MIN_FILTER,ut[S.minFilter]),S.compareFunction&&(i.texParameteri(C,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(C,i.TEXTURE_COMPARE_FUNC,B[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===He||S.minFilter!==Fs&&S.minFilter!==vi||S.type===Cn&&t.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||n.get(S).__currentAnisotropy){const H=t.get("EXT_texture_filter_anisotropic");i.texParameterf(C,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,s.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy}}}function ht(C,S){let H=!1;C.__webglInit===void 0&&(C.__webglInit=!0,S.addEventListener("dispose",R));const J=S.source;let et=h.get(J);et===void 0&&(et={},h.set(J,et));const Z=$(S);if(Z!==C.__cacheKey){et[Z]===void 0&&(et[Z]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,H=!0),et[Z].usedTimes++;const Rt=et[C.__cacheKey];Rt!==void 0&&(et[C.__cacheKey].usedTimes--,Rt.usedTimes===0&&M(S)),C.__cacheKey=Z,C.__webglTexture=et[Z].texture}return H}function z(C,S,H){let J=i.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(J=i.TEXTURE_2D_ARRAY),S.isData3DTexture&&(J=i.TEXTURE_3D);const et=ht(C,S),Z=S.source;e.bindTexture(J,C.__webglTexture,i.TEXTURE0+H);const Rt=n.get(Z);if(Z.version!==Rt.__version||et===!0){e.activeTexture(i.TEXTURE0+H);const ft=Qt.getPrimaries(Qt.workingColorSpace),vt=S.colorSpace===ti?null:Qt.getPrimaries(S.colorSpace),Jt=S.colorSpace===ti||ft===vt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,S.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,S.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Jt);let rt=x(S.image,!1,s.maxTextureSize);rt=de(S,rt);const bt=r.convert(S.format,S.colorSpace),It=r.convert(S.type);let Ot=y(S.internalFormat,bt,It,S.colorSpace,S.isVideoTexture);ot(J,S);let Mt;const Zt=S.mipmaps,$t=S.isVideoTexture!==!0,ce=Rt.__version===void 0||et===!0,k=Z.dataReady,dt=A(S,rt);if(S.isDepthTexture)Ot=v(S.format===Qi,S.type),ce&&($t?e.texStorage2D(i.TEXTURE_2D,1,Ot,rt.width,rt.height):e.texImage2D(i.TEXTURE_2D,0,Ot,rt.width,rt.height,0,bt,It,null));else if(S.isDataTexture)if(Zt.length>0){$t&&ce&&e.texStorage2D(i.TEXTURE_2D,dt,Ot,Zt[0].width,Zt[0].height);for(let Y=0,Q=Zt.length;Y<Q;Y++)Mt=Zt[Y],$t?k&&e.texSubImage2D(i.TEXTURE_2D,Y,0,0,Mt.width,Mt.height,bt,It,Mt.data):e.texImage2D(i.TEXTURE_2D,Y,Ot,Mt.width,Mt.height,0,bt,It,Mt.data);S.generateMipmaps=!1}else $t?(ce&&e.texStorage2D(i.TEXTURE_2D,dt,Ot,rt.width,rt.height),k&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,rt.width,rt.height,bt,It,rt.data)):e.texImage2D(i.TEXTURE_2D,0,Ot,rt.width,rt.height,0,bt,It,rt.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){$t&&ce&&e.texStorage3D(i.TEXTURE_2D_ARRAY,dt,Ot,Zt[0].width,Zt[0].height,rt.depth);for(let Y=0,Q=Zt.length;Y<Q;Y++)if(Mt=Zt[Y],S.format!==fn)if(bt!==null)if($t){if(k)if(S.layerUpdates.size>0){const yt=Vl(Mt.width,Mt.height,S.format,S.type);for(const gt of S.layerUpdates){const Ht=Mt.data.subarray(gt*yt/Mt.data.BYTES_PER_ELEMENT,(gt+1)*yt/Mt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Y,0,0,gt,Mt.width,Mt.height,1,bt,Ht)}S.clearLayerUpdates()}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,Y,0,0,0,Mt.width,Mt.height,rt.depth,bt,Mt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,Y,Ot,Mt.width,Mt.height,rt.depth,0,Mt.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else $t?k&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,Y,0,0,0,Mt.width,Mt.height,rt.depth,bt,It,Mt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,Y,Ot,Mt.width,Mt.height,rt.depth,0,bt,It,Mt.data)}else{$t&&ce&&e.texStorage2D(i.TEXTURE_2D,dt,Ot,Zt[0].width,Zt[0].height);for(let Y=0,Q=Zt.length;Y<Q;Y++)Mt=Zt[Y],S.format!==fn?bt!==null?$t?k&&e.compressedTexSubImage2D(i.TEXTURE_2D,Y,0,0,Mt.width,Mt.height,bt,Mt.data):e.compressedTexImage2D(i.TEXTURE_2D,Y,Ot,Mt.width,Mt.height,0,Mt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):$t?k&&e.texSubImage2D(i.TEXTURE_2D,Y,0,0,Mt.width,Mt.height,bt,It,Mt.data):e.texImage2D(i.TEXTURE_2D,Y,Ot,Mt.width,Mt.height,0,bt,It,Mt.data)}else if(S.isDataArrayTexture)if($t){if(ce&&e.texStorage3D(i.TEXTURE_2D_ARRAY,dt,Ot,rt.width,rt.height,rt.depth),k)if(S.layerUpdates.size>0){const Y=Vl(rt.width,rt.height,S.format,S.type);for(const Q of S.layerUpdates){const yt=rt.data.subarray(Q*Y/rt.data.BYTES_PER_ELEMENT,(Q+1)*Y/rt.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Q,rt.width,rt.height,1,bt,It,yt)}S.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,rt.width,rt.height,rt.depth,bt,It,rt.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Ot,rt.width,rt.height,rt.depth,0,bt,It,rt.data);else if(S.isData3DTexture)$t?(ce&&e.texStorage3D(i.TEXTURE_3D,dt,Ot,rt.width,rt.height,rt.depth),k&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,rt.width,rt.height,rt.depth,bt,It,rt.data)):e.texImage3D(i.TEXTURE_3D,0,Ot,rt.width,rt.height,rt.depth,0,bt,It,rt.data);else if(S.isFramebufferTexture){if(ce)if($t)e.texStorage2D(i.TEXTURE_2D,dt,Ot,rt.width,rt.height);else{let Y=rt.width,Q=rt.height;for(let yt=0;yt<dt;yt++)e.texImage2D(i.TEXTURE_2D,yt,Ot,Y,Q,0,bt,It,null),Y>>=1,Q>>=1}}else if(Zt.length>0){if($t&&ce){const Y=kt(Zt[0]);e.texStorage2D(i.TEXTURE_2D,dt,Ot,Y.width,Y.height)}for(let Y=0,Q=Zt.length;Y<Q;Y++)Mt=Zt[Y],$t?k&&e.texSubImage2D(i.TEXTURE_2D,Y,0,0,bt,It,Mt):e.texImage2D(i.TEXTURE_2D,Y,Ot,bt,It,Mt);S.generateMipmaps=!1}else if($t){if(ce){const Y=kt(rt);e.texStorage2D(i.TEXTURE_2D,dt,Ot,Y.width,Y.height)}k&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,bt,It,rt)}else e.texImage2D(i.TEXTURE_2D,0,Ot,bt,It,rt);g(S)&&p(J),Rt.__version=Z.version,S.onUpdate&&S.onUpdate(S)}C.__version=S.version}function K(C,S,H){if(S.image.length!==6)return;const J=ht(C,S),et=S.source;e.bindTexture(i.TEXTURE_CUBE_MAP,C.__webglTexture,i.TEXTURE0+H);const Z=n.get(et);if(et.version!==Z.__version||J===!0){e.activeTexture(i.TEXTURE0+H);const Rt=Qt.getPrimaries(Qt.workingColorSpace),ft=S.colorSpace===ti?null:Qt.getPrimaries(S.colorSpace),vt=S.colorSpace===ti||Rt===ft?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,S.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,S.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,vt);const Jt=S.isCompressedTexture||S.image[0].isCompressedTexture,rt=S.image[0]&&S.image[0].isDataTexture,bt=[];for(let Q=0;Q<6;Q++)!Jt&&!rt?bt[Q]=x(S.image[Q],!0,s.maxCubemapSize):bt[Q]=rt?S.image[Q].image:S.image[Q],bt[Q]=de(S,bt[Q]);const It=bt[0],Ot=r.convert(S.format,S.colorSpace),Mt=r.convert(S.type),Zt=y(S.internalFormat,Ot,Mt,S.colorSpace),$t=S.isVideoTexture!==!0,ce=Z.__version===void 0||J===!0,k=et.dataReady;let dt=A(S,It);ot(i.TEXTURE_CUBE_MAP,S);let Y;if(Jt){$t&&ce&&e.texStorage2D(i.TEXTURE_CUBE_MAP,dt,Zt,It.width,It.height);for(let Q=0;Q<6;Q++){Y=bt[Q].mipmaps;for(let yt=0;yt<Y.length;yt++){const gt=Y[yt];S.format!==fn?Ot!==null?$t?k&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt,0,0,gt.width,gt.height,Ot,gt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt,Zt,gt.width,gt.height,0,gt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):$t?k&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt,0,0,gt.width,gt.height,Ot,Mt,gt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt,Zt,gt.width,gt.height,0,Ot,Mt,gt.data)}}}else{if(Y=S.mipmaps,$t&&ce){Y.length>0&&dt++;const Q=kt(bt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,dt,Zt,Q.width,Q.height)}for(let Q=0;Q<6;Q++)if(rt){$t?k&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,bt[Q].width,bt[Q].height,Ot,Mt,bt[Q].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,Zt,bt[Q].width,bt[Q].height,0,Ot,Mt,bt[Q].data);for(let yt=0;yt<Y.length;yt++){const Ht=Y[yt].image[Q].image;$t?k&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt+1,0,0,Ht.width,Ht.height,Ot,Mt,Ht.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt+1,Zt,Ht.width,Ht.height,0,Ot,Mt,Ht.data)}}else{$t?k&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,Ot,Mt,bt[Q]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,Zt,Ot,Mt,bt[Q]);for(let yt=0;yt<Y.length;yt++){const gt=Y[yt];$t?k&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt+1,0,0,Ot,Mt,gt.image[Q]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Q,yt+1,Zt,Ot,Mt,gt.image[Q])}}}g(S)&&p(i.TEXTURE_CUBE_MAP),Z.__version=et.version,S.onUpdate&&S.onUpdate(S)}C.__version=S.version}function lt(C,S,H,J,et,Z){const Rt=r.convert(H.format,H.colorSpace),ft=r.convert(H.type),vt=y(H.internalFormat,Rt,ft,H.colorSpace),Jt=n.get(S),rt=n.get(H);if(rt.__renderTarget=S,!Jt.__hasExternalTextures){const bt=Math.max(1,S.width>>Z),It=Math.max(1,S.height>>Z);et===i.TEXTURE_3D||et===i.TEXTURE_2D_ARRAY?e.texImage3D(et,Z,vt,bt,It,S.depth,0,Rt,ft,null):e.texImage2D(et,Z,vt,bt,It,0,Rt,ft,null)}e.bindFramebuffer(i.FRAMEBUFFER,C),Kt(S)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,J,et,rt.__webglTexture,0,jt(S)):(et===i.TEXTURE_2D||et>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&et<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,J,et,rt.__webglTexture,Z),e.bindFramebuffer(i.FRAMEBUFFER,null)}function it(C,S,H){if(i.bindRenderbuffer(i.RENDERBUFFER,C),S.depthBuffer){const J=S.depthTexture,et=J&&J.isDepthTexture?J.type:null,Z=v(S.stencilBuffer,et),Rt=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ft=jt(S);Kt(S)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ft,Z,S.width,S.height):H?i.renderbufferStorageMultisample(i.RENDERBUFFER,ft,Z,S.width,S.height):i.renderbufferStorage(i.RENDERBUFFER,Z,S.width,S.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Rt,i.RENDERBUFFER,C)}else{const J=S.textures;for(let et=0;et<J.length;et++){const Z=J[et],Rt=r.convert(Z.format,Z.colorSpace),ft=r.convert(Z.type),vt=y(Z.internalFormat,Rt,ft,Z.colorSpace),Jt=jt(S);H&&Kt(S)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Jt,vt,S.width,S.height):Kt(S)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Jt,vt,S.width,S.height):i.renderbufferStorage(i.RENDERBUFFER,vt,S.width,S.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function wt(C,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,C),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const J=n.get(S.depthTexture);J.__renderTarget=S,(!J.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),j(S.depthTexture,0);const et=J.__webglTexture,Z=jt(S);if(S.depthTexture.format===$i)Kt(S)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,et,0,Z):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,et,0);else if(S.depthTexture.format===Qi)Kt(S)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,et,0,Z):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,et,0);else throw new Error("Unknown depthTexture format")}function Pt(C){const S=n.get(C),H=C.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==C.depthTexture){const J=C.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),J){const et=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,J.removeEventListener("dispose",et)};J.addEventListener("dispose",et),S.__depthDisposeCallback=et}S.__boundDepthTexture=J}if(C.depthTexture&&!S.__autoAllocateDepthBuffer){if(H)throw new Error("target.depthTexture not supported in Cube render targets");wt(S.__webglFramebuffer,C)}else if(H){S.__webglDepthbuffer=[];for(let J=0;J<6;J++)if(e.bindFramebuffer(i.FRAMEBUFFER,S.__webglFramebuffer[J]),S.__webglDepthbuffer[J]===void 0)S.__webglDepthbuffer[J]=i.createRenderbuffer(),it(S.__webglDepthbuffer[J],C,!1);else{const et=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Z=S.__webglDepthbuffer[J];i.bindRenderbuffer(i.RENDERBUFFER,Z),i.framebufferRenderbuffer(i.FRAMEBUFFER,et,i.RENDERBUFFER,Z)}}else if(e.bindFramebuffer(i.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=i.createRenderbuffer(),it(S.__webglDepthbuffer,C,!1);else{const J=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,et=S.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,et),i.framebufferRenderbuffer(i.FRAMEBUFFER,J,i.RENDERBUFFER,et)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function st(C,S,H){const J=n.get(C);S!==void 0&&lt(J.__webglFramebuffer,C,C.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),H!==void 0&&Pt(C)}function Lt(C){const S=C.texture,H=n.get(C),J=n.get(S);C.addEventListener("dispose",w);const et=C.textures,Z=C.isWebGLCubeRenderTarget===!0,Rt=et.length>1;if(Rt||(J.__webglTexture===void 0&&(J.__webglTexture=i.createTexture()),J.__version=S.version,a.memory.textures++),Z){H.__webglFramebuffer=[];for(let ft=0;ft<6;ft++)if(S.mipmaps&&S.mipmaps.length>0){H.__webglFramebuffer[ft]=[];for(let vt=0;vt<S.mipmaps.length;vt++)H.__webglFramebuffer[ft][vt]=i.createFramebuffer()}else H.__webglFramebuffer[ft]=i.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){H.__webglFramebuffer=[];for(let ft=0;ft<S.mipmaps.length;ft++)H.__webglFramebuffer[ft]=i.createFramebuffer()}else H.__webglFramebuffer=i.createFramebuffer();if(Rt)for(let ft=0,vt=et.length;ft<vt;ft++){const Jt=n.get(et[ft]);Jt.__webglTexture===void 0&&(Jt.__webglTexture=i.createTexture(),a.memory.textures++)}if(C.samples>0&&Kt(C)===!1){H.__webglMultisampledFramebuffer=i.createFramebuffer(),H.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let ft=0;ft<et.length;ft++){const vt=et[ft];H.__webglColorRenderbuffer[ft]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,H.__webglColorRenderbuffer[ft]);const Jt=r.convert(vt.format,vt.colorSpace),rt=r.convert(vt.type),bt=y(vt.internalFormat,Jt,rt,vt.colorSpace,C.isXRRenderTarget===!0),It=jt(C);i.renderbufferStorageMultisample(i.RENDERBUFFER,It,bt,C.width,C.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ft,i.RENDERBUFFER,H.__webglColorRenderbuffer[ft])}i.bindRenderbuffer(i.RENDERBUFFER,null),C.depthBuffer&&(H.__webglDepthRenderbuffer=i.createRenderbuffer(),it(H.__webglDepthRenderbuffer,C,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Z){e.bindTexture(i.TEXTURE_CUBE_MAP,J.__webglTexture),ot(i.TEXTURE_CUBE_MAP,S);for(let ft=0;ft<6;ft++)if(S.mipmaps&&S.mipmaps.length>0)for(let vt=0;vt<S.mipmaps.length;vt++)lt(H.__webglFramebuffer[ft][vt],C,S,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ft,vt);else lt(H.__webglFramebuffer[ft],C,S,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ft,0);g(S)&&p(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Rt){for(let ft=0,vt=et.length;ft<vt;ft++){const Jt=et[ft],rt=n.get(Jt);e.bindTexture(i.TEXTURE_2D,rt.__webglTexture),ot(i.TEXTURE_2D,Jt),lt(H.__webglFramebuffer,C,Jt,i.COLOR_ATTACHMENT0+ft,i.TEXTURE_2D,0),g(Jt)&&p(i.TEXTURE_2D)}e.unbindTexture()}else{let ft=i.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(ft=C.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ft,J.__webglTexture),ot(ft,S),S.mipmaps&&S.mipmaps.length>0)for(let vt=0;vt<S.mipmaps.length;vt++)lt(H.__webglFramebuffer[vt],C,S,i.COLOR_ATTACHMENT0,ft,vt);else lt(H.__webglFramebuffer,C,S,i.COLOR_ATTACHMENT0,ft,0);g(S)&&p(ft),e.unbindTexture()}C.depthBuffer&&Pt(C)}function Ut(C){const S=C.textures;for(let H=0,J=S.length;H<J;H++){const et=S[H];if(g(et)){const Z=_(C),Rt=n.get(et).__webglTexture;e.bindTexture(Z,Rt),p(Z),e.unbindTexture()}}}const ge=[],I=[];function on(C){if(C.samples>0){if(Kt(C)===!1){const S=C.textures,H=C.width,J=C.height;let et=i.COLOR_BUFFER_BIT;const Z=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Rt=n.get(C),ft=S.length>1;if(ft)for(let vt=0;vt<S.length;vt++)e.bindFramebuffer(i.FRAMEBUFFER,Rt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+vt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Rt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+vt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Rt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Rt.__webglFramebuffer);for(let vt=0;vt<S.length;vt++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(et|=i.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(et|=i.STENCIL_BUFFER_BIT)),ft){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Rt.__webglColorRenderbuffer[vt]);const Jt=n.get(S[vt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Jt,0)}i.blitFramebuffer(0,0,H,J,0,0,H,J,et,i.NEAREST),l===!0&&(ge.length=0,I.length=0,ge.push(i.COLOR_ATTACHMENT0+vt),C.depthBuffer&&C.resolveDepthBuffer===!1&&(ge.push(Z),I.push(Z),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,I)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,ge))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ft)for(let vt=0;vt<S.length;vt++){e.bindFramebuffer(i.FRAMEBUFFER,Rt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+vt,i.RENDERBUFFER,Rt.__webglColorRenderbuffer[vt]);const Jt=n.get(S[vt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Rt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+vt,i.TEXTURE_2D,Jt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Rt.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){const S=C.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[S])}}}function jt(C){return Math.min(s.maxSamples,C.samples)}function Kt(C){const S=n.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function Dt(C){const S=a.render.frame;u.get(C)!==S&&(u.set(C,S),C.update())}function de(C,S){const H=C.colorSpace,J=C.format,et=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||H!==es&&H!==ti&&(Qt.getTransfer(H)===ae?(J!==fn||et!==Pn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",H)),S}function kt(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=N,this.resetTextureUnits=D,this.setTexture2D=j,this.setTexture2DArray=X,this.setTexture3D=q,this.setTextureCube=G,this.rebindTextures=st,this.setupRenderTarget=Lt,this.updateRenderTargetMipmap=Ut,this.updateMultisampleRenderTarget=on,this.setupDepthRenderbuffer=Pt,this.setupFrameBufferTexture=lt,this.useMultisampledRTT=Kt}function Fm(i,t){function e(n,s=ti){let r;const a=Qt.getTransfer(s);if(n===Pn)return i.UNSIGNED_BYTE;if(n===yo)return i.UNSIGNED_SHORT_4_4_4_4;if(n===vo)return i.UNSIGNED_SHORT_5_5_5_1;if(n===wc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Mc)return i.BYTE;if(n===Sc)return i.SHORT;if(n===Cs)return i.UNSIGNED_SHORT;if(n===xo)return i.INT;if(n===_i)return i.UNSIGNED_INT;if(n===Cn)return i.FLOAT;if(n===ks)return i.HALF_FLOAT;if(n===Ec)return i.ALPHA;if(n===Tc)return i.RGB;if(n===fn)return i.RGBA;if(n===Ac)return i.LUMINANCE;if(n===Rc)return i.LUMINANCE_ALPHA;if(n===$i)return i.DEPTH_COMPONENT;if(n===Qi)return i.DEPTH_STENCIL;if(n===wr)return i.RED;if(n===_o)return i.RED_INTEGER;if(n===Cc)return i.RG;if(n===bo)return i.RG_INTEGER;if(n===Mo)return i.RGBA_INTEGER;if(n===cr||n===hr||n===ur||n===dr)if(a===ae)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===cr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===ur)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===cr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===hr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===ur)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===dr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===La||n===Ua||n===Da||n===Ia)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===La)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ua)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Da)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Ia)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Na||n===Fa||n===Oa)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Na||n===Fa)return a===ae?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Oa)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===Ba||n===za||n===Ha||n===Ga||n===Va||n===Wa||n===$a||n===Xa||n===qa||n===Ya||n===ja||n===Ka||n===Za||n===Ja)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ba)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===za)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ha)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Ga)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Va)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Wa)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===$a)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Xa)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===qa)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Ya)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ja)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ka)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Za)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Ja)return a===ae?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===fr||n===Qa||n===to)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===fr)return a===ae?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Qa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===to)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Pc||n===eo||n===no||n===io)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===fr)return r.COMPRESSED_RED_RGTC1_EXT;if(n===eo)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===no)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===io)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ji?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}class Om extends un{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class Vi extends we{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Bm={type:"move"};class da{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Vi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Vi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Vi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const x of t.hand.values()){const g=e.getJointPose(x,n),p=this._getHandJoint(c,x);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}const u=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],h=u.position.distanceTo(f.position),d=.02,m=.005;c.inputState.pinching&&h>d+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&h<=d-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Bm)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Vi;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const zm=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Hm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Gm{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const s=new Ge,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Vn({vertexShader:zm,fragmentShader:Hm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new xe(new rs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Vm extends ns{constructor(t,e){super();const n=this;let s=null,r=1,a=null,o="local-floor",l=1,c=null,u=null,f=null,h=null,d=null,m=null;const x=new Gm,g=e.getContextAttributes();let p=null,_=null;const y=[],v=[],A=new Yt;let R=null;const w=new un;w.viewport=new ve;const E=new un;E.viewport=new ve;const M=[w,E],b=new Om;let P=null,D=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(z){let K=y[z];return K===void 0&&(K=new da,y[z]=K),K.getTargetRaySpace()},this.getControllerGrip=function(z){let K=y[z];return K===void 0&&(K=new da,y[z]=K),K.getGripSpace()},this.getHand=function(z){let K=y[z];return K===void 0&&(K=new da,y[z]=K),K.getHandSpace()};function N(z){const K=v.indexOf(z.inputSource);if(K===-1)return;const lt=y[K];lt!==void 0&&(lt.update(z.inputSource,z.frame,c||a),lt.dispatchEvent({type:z.type,data:z.inputSource}))}function $(){s.removeEventListener("select",N),s.removeEventListener("selectstart",N),s.removeEventListener("selectend",N),s.removeEventListener("squeeze",N),s.removeEventListener("squeezestart",N),s.removeEventListener("squeezeend",N),s.removeEventListener("end",$),s.removeEventListener("inputsourceschange",j);for(let z=0;z<y.length;z++){const K=v[z];K!==null&&(v[z]=null,y[z].disconnect(K))}P=null,D=null,x.reset(),t.setRenderTarget(p),d=null,h=null,f=null,s=null,_=null,ht.stop(),n.isPresenting=!1,t.setPixelRatio(R),t.setSize(A.width,A.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(z){r=z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(z){o=z,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(z){c=z},this.getBaseLayer=function(){return h!==null?h:d},this.getBinding=function(){return f},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(z){if(s=z,s!==null){if(p=t.getRenderTarget(),s.addEventListener("select",N),s.addEventListener("selectstart",N),s.addEventListener("selectend",N),s.addEventListener("squeeze",N),s.addEventListener("squeezestart",N),s.addEventListener("squeezeend",N),s.addEventListener("end",$),s.addEventListener("inputsourceschange",j),g.xrCompatible!==!0&&await e.makeXRCompatible(),R=t.getPixelRatio(),t.getSize(A),s.renderState.layers===void 0){const K={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,K),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),_=new bi(d.framebufferWidth,d.framebufferHeight,{format:fn,type:Pn,colorSpace:t.outputColorSpace,stencilBuffer:g.stencil})}else{let K=null,lt=null,it=null;g.depth&&(it=g.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,K=g.stencil?Qi:$i,lt=g.stencil?Ji:_i);const wt={colorFormat:e.RGBA8,depthFormat:it,scaleFactor:r};f=new XRWebGLBinding(s,e),h=f.createProjectionLayer(wt),s.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),_=new bi(h.textureWidth,h.textureHeight,{format:fn,type:Pn,depthTexture:new Wc(h.textureWidth,h.textureHeight,lt,void 0,void 0,void 0,void 0,void 0,void 0,K),stencilBuffer:g.stencil,colorSpace:t.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),ht.setContext(s),ht.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function j(z){for(let K=0;K<z.removed.length;K++){const lt=z.removed[K],it=v.indexOf(lt);it>=0&&(v[it]=null,y[it].disconnect(lt))}for(let K=0;K<z.added.length;K++){const lt=z.added[K];let it=v.indexOf(lt);if(it===-1){for(let Pt=0;Pt<y.length;Pt++)if(Pt>=v.length){v.push(lt),it=Pt;break}else if(v[Pt]===null){v[Pt]=lt,it=Pt;break}if(it===-1)break}const wt=y[it];wt&&wt.connect(lt)}}const X=new O,q=new O;function G(z,K,lt){X.setFromMatrixPosition(K.matrixWorld),q.setFromMatrixPosition(lt.matrixWorld);const it=X.distanceTo(q),wt=K.projectionMatrix.elements,Pt=lt.projectionMatrix.elements,st=wt[14]/(wt[10]-1),Lt=wt[14]/(wt[10]+1),Ut=(wt[9]+1)/wt[5],ge=(wt[9]-1)/wt[5],I=(wt[8]-1)/wt[0],on=(Pt[8]+1)/Pt[0],jt=st*I,Kt=st*on,Dt=it/(-I+on),de=Dt*-I;if(K.matrixWorld.decompose(z.position,z.quaternion,z.scale),z.translateX(de),z.translateZ(Dt),z.matrixWorld.compose(z.position,z.quaternion,z.scale),z.matrixWorldInverse.copy(z.matrixWorld).invert(),wt[10]===-1)z.projectionMatrix.copy(K.projectionMatrix),z.projectionMatrixInverse.copy(K.projectionMatrixInverse);else{const kt=st+Dt,C=Lt+Dt,S=jt-de,H=Kt+(it-de),J=Ut*Lt/C*kt,et=ge*Lt/C*kt;z.projectionMatrix.makePerspective(S,H,J,et,kt,C),z.projectionMatrixInverse.copy(z.projectionMatrix).invert()}}function nt(z,K){K===null?z.matrixWorld.copy(z.matrix):z.matrixWorld.multiplyMatrices(K.matrixWorld,z.matrix),z.matrixWorldInverse.copy(z.matrixWorld).invert()}this.updateCamera=function(z){if(s===null)return;let K=z.near,lt=z.far;x.texture!==null&&(x.depthNear>0&&(K=x.depthNear),x.depthFar>0&&(lt=x.depthFar)),b.near=E.near=w.near=K,b.far=E.far=w.far=lt,(P!==b.near||D!==b.far)&&(s.updateRenderState({depthNear:b.near,depthFar:b.far}),P=b.near,D=b.far),w.layers.mask=z.layers.mask|2,E.layers.mask=z.layers.mask|4,b.layers.mask=w.layers.mask|E.layers.mask;const it=z.parent,wt=b.cameras;nt(b,it);for(let Pt=0;Pt<wt.length;Pt++)nt(wt[Pt],it);wt.length===2?G(b,w,E):b.projectionMatrix.copy(w.projectionMatrix),ut(z,b,it)};function ut(z,K,lt){lt===null?z.matrix.copy(K.matrixWorld):(z.matrix.copy(lt.matrixWorld),z.matrix.invert(),z.matrix.multiply(K.matrixWorld)),z.matrix.decompose(z.position,z.quaternion,z.scale),z.updateMatrixWorld(!0),z.projectionMatrix.copy(K.projectionMatrix),z.projectionMatrixInverse.copy(K.projectionMatrixInverse),z.isPerspectiveCamera&&(z.fov=so*2*Math.atan(1/z.projectionMatrix.elements[5]),z.zoom=1)}this.getCamera=function(){return b},this.getFoveation=function(){if(!(h===null&&d===null))return l},this.setFoveation=function(z){l=z,h!==null&&(h.fixedFoveation=z),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=z)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(b)};let B=null;function ot(z,K){if(u=K.getViewerPose(c||a),m=K,u!==null){const lt=u.views;d!==null&&(t.setRenderTargetFramebuffer(_,d.framebuffer),t.setRenderTarget(_));let it=!1;lt.length!==b.cameras.length&&(b.cameras.length=0,it=!0);for(let Pt=0;Pt<lt.length;Pt++){const st=lt[Pt];let Lt=null;if(d!==null)Lt=d.getViewport(st);else{const ge=f.getViewSubImage(h,st);Lt=ge.viewport,Pt===0&&(t.setRenderTargetTextures(_,ge.colorTexture,h.ignoreDepthValues?void 0:ge.depthStencilTexture),t.setRenderTarget(_))}let Ut=M[Pt];Ut===void 0&&(Ut=new un,Ut.layers.enable(Pt),Ut.viewport=new ve,M[Pt]=Ut),Ut.matrix.fromArray(st.transform.matrix),Ut.matrix.decompose(Ut.position,Ut.quaternion,Ut.scale),Ut.projectionMatrix.fromArray(st.projectionMatrix),Ut.projectionMatrixInverse.copy(Ut.projectionMatrix).invert(),Ut.viewport.set(Lt.x,Lt.y,Lt.width,Lt.height),Pt===0&&(b.matrix.copy(Ut.matrix),b.matrix.decompose(b.position,b.quaternion,b.scale)),it===!0&&b.cameras.push(Ut)}const wt=s.enabledFeatures;if(wt&&wt.includes("depth-sensing")){const Pt=f.getDepthInformation(lt[0]);Pt&&Pt.isValid&&Pt.texture&&x.init(t,Pt,s.renderState)}}for(let lt=0;lt<y.length;lt++){const it=v[lt],wt=y[lt];it!==null&&wt!==void 0&&wt.update(it,K,c||a)}B&&B(z,K),K.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:K}),m=null}const ht=new Gc;ht.setAnimationLoop(ot),this.setAnimationLoop=function(z){B=z},this.dispose=function(){}}}const fi=new wn,Wm=new le;function $m(i,t){function e(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function n(g,p){p.color.getRGB(g.fogColor.value,Bc(i)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function s(g,p,_,y,v){p.isMeshBasicMaterial||p.isMeshLambertMaterial?r(g,p):p.isMeshToonMaterial?(r(g,p),f(g,p)):p.isMeshPhongMaterial?(r(g,p),u(g,p)):p.isMeshStandardMaterial?(r(g,p),h(g,p),p.isMeshPhysicalMaterial&&d(g,p,v)):p.isMeshMatcapMaterial?(r(g,p),m(g,p)):p.isMeshDepthMaterial?r(g,p):p.isMeshDistanceMaterial?(r(g,p),x(g,p)):p.isMeshNormalMaterial?r(g,p):p.isLineBasicMaterial?(a(g,p),p.isLineDashedMaterial&&o(g,p)):p.isPointsMaterial?l(g,p,_,y):p.isSpriteMaterial?c(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,e(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===Ze&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,e(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===Ze&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,e(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,e(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);const _=t.get(p),y=_.envMap,v=_.envMapRotation;y&&(g.envMap.value=y,fi.copy(v),fi.x*=-1,fi.y*=-1,fi.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(fi.y*=-1,fi.z*=-1),g.envMapRotation.value.setFromMatrix4(Wm.makeRotationFromEuler(fi)),g.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,g.aoMapTransform))}function a(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform))}function o(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function l(g,p,_,y){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*_,g.scale.value=y*.5,p.map&&(g.map.value=p.map,e(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function c(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,e(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,e(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function u(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function f(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function h(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function d(g,p,_){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ze&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=_.texture,g.transmissionSamplerSize.value.set(_.width,_.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,p){p.matcap&&(g.matcap.value=p.matcap)}function x(g,p){const _=t.get(p).light;g.referencePosition.value.setFromMatrixPosition(_.matrixWorld),g.nearDistance.value=_.shadow.camera.near,g.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Xm(i,t,e,n){let s={},r={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(_,y){const v=y.program;n.uniformBlockBinding(_,v)}function c(_,y){let v=s[_.id];v===void 0&&(m(_),v=u(_),s[_.id]=v,_.addEventListener("dispose",g));const A=y.program;n.updateUBOMapping(_,A);const R=t.render.frame;r[_.id]!==R&&(h(_),r[_.id]=R)}function u(_){const y=f();_.__bindingPointIndex=y;const v=i.createBuffer(),A=_.__size,R=_.usage;return i.bindBuffer(i.UNIFORM_BUFFER,v),i.bufferData(i.UNIFORM_BUFFER,A,R),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,y,v),v}function f(){for(let _=0;_<o;_++)if(a.indexOf(_)===-1)return a.push(_),_;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(_){const y=s[_.id],v=_.uniforms,A=_.__cache;i.bindBuffer(i.UNIFORM_BUFFER,y);for(let R=0,w=v.length;R<w;R++){const E=Array.isArray(v[R])?v[R]:[v[R]];for(let M=0,b=E.length;M<b;M++){const P=E[M];if(d(P,R,M,A)===!0){const D=P.__offset,N=Array.isArray(P.value)?P.value:[P.value];let $=0;for(let j=0;j<N.length;j++){const X=N[j],q=x(X);typeof X=="number"||typeof X=="boolean"?(P.__data[0]=X,i.bufferSubData(i.UNIFORM_BUFFER,D+$,P.__data)):X.isMatrix3?(P.__data[0]=X.elements[0],P.__data[1]=X.elements[1],P.__data[2]=X.elements[2],P.__data[3]=0,P.__data[4]=X.elements[3],P.__data[5]=X.elements[4],P.__data[6]=X.elements[5],P.__data[7]=0,P.__data[8]=X.elements[6],P.__data[9]=X.elements[7],P.__data[10]=X.elements[8],P.__data[11]=0):(X.toArray(P.__data,$),$+=q.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,D,P.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(_,y,v,A){const R=_.value,w=y+"_"+v;if(A[w]===void 0)return typeof R=="number"||typeof R=="boolean"?A[w]=R:A[w]=R.clone(),!0;{const E=A[w];if(typeof R=="number"||typeof R=="boolean"){if(E!==R)return A[w]=R,!0}else if(E.equals(R)===!1)return E.copy(R),!0}return!1}function m(_){const y=_.uniforms;let v=0;const A=16;for(let w=0,E=y.length;w<E;w++){const M=Array.isArray(y[w])?y[w]:[y[w]];for(let b=0,P=M.length;b<P;b++){const D=M[b],N=Array.isArray(D.value)?D.value:[D.value];for(let $=0,j=N.length;$<j;$++){const X=N[$],q=x(X),G=v%A,nt=G%q.boundary,ut=G+nt;v+=nt,ut!==0&&A-ut<q.storage&&(v+=A-ut),D.__data=new Float32Array(q.storage/Float32Array.BYTES_PER_ELEMENT),D.__offset=v,v+=q.storage}}}const R=v%A;return R>0&&(v+=A-R),_.__size=v,_.__cache={},this}function x(_){const y={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(y.boundary=4,y.storage=4):_.isVector2?(y.boundary=8,y.storage=8):_.isVector3||_.isColor?(y.boundary=16,y.storage=12):_.isVector4?(y.boundary=16,y.storage=16):_.isMatrix3?(y.boundary=48,y.storage=48):_.isMatrix4?(y.boundary=64,y.storage=64):_.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",_),y}function g(_){const y=_.target;y.removeEventListener("dispose",g);const v=a.indexOf(y.__bindingPointIndex);a.splice(v,1),i.deleteBuffer(s[y.id]),delete s[y.id],delete r[y.id]}function p(){for(const _ in s)i.deleteBuffer(s[_]);a=[],s={},r={}}return{bind:l,update:c,dispose:p}}class qm{constructor(t={}){const{canvas:e=Du(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reverseDepthBuffer:h=!1}=t;this.isWebGLRenderer=!0;let d;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");d=n.getContextAttributes().alpha}else d=a;const m=new Uint32Array(4),x=new Int32Array(4);let g=null,p=null;const _=[],y=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Be,this.toneMapping=si,this.toneMappingExposure=1;const v=this;let A=!1,R=0,w=0,E=null,M=-1,b=null;const P=new ve,D=new ve;let N=null;const $=new Wt(0);let j=0,X=e.width,q=e.height,G=1,nt=null,ut=null;const B=new ve(0,0,X,q),ot=new ve(0,0,X,q);let ht=!1;const z=new Eo;let K=!1,lt=!1;const it=new le,wt=new le,Pt=new O,st=new ve,Lt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Ut=!1;function ge(){return E===null?G:1}let I=n;function on(T,L){return e.getContext(T,L)}try{const T={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${mo}`),e.addEventListener("webglcontextlost",Q,!1),e.addEventListener("webglcontextrestored",yt,!1),e.addEventListener("webglcontextcreationerror",gt,!1),I===null){const L="webgl2";if(I=on(L,T),I===null)throw on(L)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(T){throw console.error("THREE.WebGLRenderer: "+T.message),T}let jt,Kt,Dt,de,kt,C,S,H,J,et,Z,Rt,ft,vt,Jt,rt,bt,It,Ot,Mt,Zt,$t,ce,k;function dt(){jt=new Jp(I),jt.init(),$t=new Fm(I,jt),Kt=new Xp(I,jt,t,$t),Dt=new Dm(I,jt),Kt.reverseDepthBuffer&&h&&Dt.buffers.depth.setReversed(!0),de=new e0(I),kt=new vm,C=new Nm(I,jt,Dt,kt,Kt,$t,de),S=new Yp(v),H=new Zp(v),J=new od(I),ce=new Wp(I,J),et=new Qp(I,J,de,ce),Z=new i0(I,et,J,de),Ot=new n0(I,Kt,C),rt=new qp(kt),Rt=new ym(v,S,H,jt,Kt,ce,rt),ft=new $m(v,kt),vt=new bm,Jt=new Am(jt),It=new Vp(v,S,H,Dt,Z,d,l),bt=new Lm(v,Z,Kt),k=new Xm(I,de,Kt,Dt),Mt=new $p(I,jt,de),Zt=new t0(I,jt,de),de.programs=Rt.programs,v.capabilities=Kt,v.extensions=jt,v.properties=kt,v.renderLists=vt,v.shadowMap=bt,v.state=Dt,v.info=de}dt();const Y=new Vm(v,I);this.xr=Y,this.getContext=function(){return I},this.getContextAttributes=function(){return I.getContextAttributes()},this.forceContextLoss=function(){const T=jt.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){const T=jt.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return G},this.setPixelRatio=function(T){T!==void 0&&(G=T,this.setSize(X,q,!1))},this.getSize=function(T){return T.set(X,q)},this.setSize=function(T,L,V=!0){if(Y.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}X=T,q=L,e.width=Math.floor(T*G),e.height=Math.floor(L*G),V===!0&&(e.style.width=T+"px",e.style.height=L+"px"),this.setViewport(0,0,T,L)},this.getDrawingBufferSize=function(T){return T.set(X*G,q*G).floor()},this.setDrawingBufferSize=function(T,L,V){X=T,q=L,G=V,e.width=Math.floor(T*V),e.height=Math.floor(L*V),this.setViewport(0,0,T,L)},this.getCurrentViewport=function(T){return T.copy(P)},this.getViewport=function(T){return T.copy(B)},this.setViewport=function(T,L,V,W){T.isVector4?B.set(T.x,T.y,T.z,T.w):B.set(T,L,V,W),Dt.viewport(P.copy(B).multiplyScalar(G).round())},this.getScissor=function(T){return T.copy(ot)},this.setScissor=function(T,L,V,W){T.isVector4?ot.set(T.x,T.y,T.z,T.w):ot.set(T,L,V,W),Dt.scissor(D.copy(ot).multiplyScalar(G).round())},this.getScissorTest=function(){return ht},this.setScissorTest=function(T){Dt.setScissorTest(ht=T)},this.setOpaqueSort=function(T){nt=T},this.setTransparentSort=function(T){ut=T},this.getClearColor=function(T){return T.copy(It.getClearColor())},this.setClearColor=function(){It.setClearColor.apply(It,arguments)},this.getClearAlpha=function(){return It.getClearAlpha()},this.setClearAlpha=function(){It.setClearAlpha.apply(It,arguments)},this.clear=function(T=!0,L=!0,V=!0){let W=0;if(T){let U=!1;if(E!==null){const at=E.texture.format;U=at===Mo||at===bo||at===_o}if(U){const at=E.texture.type,xt=at===Pn||at===_i||at===Cs||at===Ji||at===yo||at===vo,Et=It.getClearColor(),Tt=It.getClearAlpha(),Bt=Et.r,Gt=Et.g,At=Et.b;xt?(m[0]=Bt,m[1]=Gt,m[2]=At,m[3]=Tt,I.clearBufferuiv(I.COLOR,0,m)):(x[0]=Bt,x[1]=Gt,x[2]=At,x[3]=Tt,I.clearBufferiv(I.COLOR,0,x))}else W|=I.COLOR_BUFFER_BIT}L&&(W|=I.DEPTH_BUFFER_BIT),V&&(W|=I.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),I.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Q,!1),e.removeEventListener("webglcontextrestored",yt,!1),e.removeEventListener("webglcontextcreationerror",gt,!1),vt.dispose(),Jt.dispose(),kt.dispose(),S.dispose(),H.dispose(),Z.dispose(),ce.dispose(),k.dispose(),Rt.dispose(),Y.dispose(),Y.removeEventListener("sessionstart",Po),Y.removeEventListener("sessionend",ko),ai.stop()};function Q(T){T.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),A=!0}function yt(){console.log("THREE.WebGLRenderer: Context Restored."),A=!1;const T=de.autoReset,L=bt.enabled,V=bt.autoUpdate,W=bt.needsUpdate,U=bt.type;dt(),de.autoReset=T,bt.enabled=L,bt.autoUpdate=V,bt.needsUpdate=W,bt.type=U}function gt(T){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function Ht(T){const L=T.target;L.removeEventListener("dispose",Ht),ye(L)}function ye(T){Ue(T),kt.remove(T)}function Ue(T){const L=kt.get(T).programs;L!==void 0&&(L.forEach(function(V){Rt.releaseProgram(V)}),T.isShaderMaterial&&Rt.releaseShaderCache(T))}this.renderBufferDirect=function(T,L,V,W,U,at){L===null&&(L=Lt);const xt=U.isMesh&&U.matrixWorld.determinant()<0,Et=ih(T,L,V,W,U);Dt.setMaterial(W,xt);let Tt=V.index,Bt=1;if(W.wireframe===!0){if(Tt=et.getWireframeAttribute(V),Tt===void 0)return;Bt=2}const Gt=V.drawRange,At=V.attributes.position;let te=Gt.start*Bt,he=(Gt.start+Gt.count)*Bt;at!==null&&(te=Math.max(te,at.start*Bt),he=Math.min(he,(at.start+at.count)*Bt)),Tt!==null?(te=Math.max(te,0),he=Math.min(he,Tt.count)):At!=null&&(te=Math.max(te,0),he=Math.min(he,At.count));const fe=he-te;if(fe<0||fe===1/0)return;ce.setup(U,W,Et,V,Tt);let Ve,ne=Mt;if(Tt!==null&&(Ve=J.get(Tt),ne=Zt,ne.setIndex(Ve)),U.isMesh)W.wireframe===!0?(Dt.setLineWidth(W.wireframeLinewidth*ge()),ne.setMode(I.LINES)):ne.setMode(I.TRIANGLES);else if(U.isLine){let Ct=W.linewidth;Ct===void 0&&(Ct=1),Dt.setLineWidth(Ct*ge()),U.isLineSegments?ne.setMode(I.LINES):U.isLineLoop?ne.setMode(I.LINE_LOOP):ne.setMode(I.LINE_STRIP)}else U.isPoints?ne.setMode(I.POINTS):U.isSprite&&ne.setMode(I.TRIANGLES);if(U.isBatchedMesh)if(U._multiDrawInstances!==null)ne.renderMultiDrawInstances(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount,U._multiDrawInstances);else if(jt.get("WEBGL_multi_draw"))ne.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else{const Ct=U._multiDrawStarts,Ln=U._multiDrawCounts,ie=U._multiDrawCount,gn=Tt?J.get(Tt).bytesPerElement:1,wi=kt.get(W).currentProgram.getUniforms();for(let Je=0;Je<ie;Je++)wi.setValue(I,"_gl_DrawID",Je),ne.render(Ct[Je]/gn,Ln[Je])}else if(U.isInstancedMesh)ne.renderInstances(te,fe,U.count);else if(V.isInstancedBufferGeometry){const Ct=V._maxInstanceCount!==void 0?V._maxInstanceCount:1/0,Ln=Math.min(V.instanceCount,Ct);ne.renderInstances(te,fe,Ln)}else ne.render(te,fe)};function se(T,L,V){T.transparent===!0&&T.side===sn&&T.forceSinglePass===!1?(T.side=Ze,T.needsUpdate=!0,Is(T,L,V),T.side=ri,T.needsUpdate=!0,Is(T,L,V),T.side=sn):Is(T,L,V)}this.compile=function(T,L,V=null){V===null&&(V=T),p=Jt.get(V),p.init(L),y.push(p),V.traverseVisible(function(U){U.isLight&&U.layers.test(L.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),T!==V&&T.traverseVisible(function(U){U.isLight&&U.layers.test(L.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),p.setupLights();const W=new Set;return T.traverse(function(U){if(!(U.isMesh||U.isPoints||U.isLine||U.isSprite))return;const at=U.material;if(at)if(Array.isArray(at))for(let xt=0;xt<at.length;xt++){const Et=at[xt];se(Et,V,U),W.add(Et)}else se(at,V,U),W.add(at)}),y.pop(),p=null,W},this.compileAsync=function(T,L,V=null){const W=this.compile(T,L,V);return new Promise(U=>{function at(){if(W.forEach(function(xt){kt.get(xt).currentProgram.isReady()&&W.delete(xt)}),W.size===0){U(T);return}setTimeout(at,10)}jt.get("KHR_parallel_shader_compile")!==null?at():setTimeout(at,10)})};let mn=null;function kn(T){mn&&mn(T)}function Po(){ai.stop()}function ko(){ai.start()}const ai=new Gc;ai.setAnimationLoop(kn),typeof self<"u"&&ai.setContext(self),this.setAnimationLoop=function(T){mn=T,Y.setAnimationLoop(T),T===null?ai.stop():ai.start()},Y.addEventListener("sessionstart",Po),Y.addEventListener("sessionend",ko),this.render=function(T,L){if(L!==void 0&&L.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(A===!0)return;if(T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),Y.enabled===!0&&Y.isPresenting===!0&&(Y.cameraAutoUpdate===!0&&Y.updateCamera(L),L=Y.getCamera()),T.isScene===!0&&T.onBeforeRender(v,T,L,E),p=Jt.get(T,y.length),p.init(L),y.push(p),wt.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),z.setFromProjectionMatrix(wt),lt=this.localClippingEnabled,K=rt.init(this.clippingPlanes,lt),g=vt.get(T,_.length),g.init(),_.push(g),Y.enabled===!0&&Y.isPresenting===!0){const at=v.xr.getDepthSensingMesh();at!==null&&Lr(at,L,-1/0,v.sortObjects)}Lr(T,L,0,v.sortObjects),g.finish(),v.sortObjects===!0&&g.sort(nt,ut),Ut=Y.enabled===!1||Y.isPresenting===!1||Y.hasDepthSensing()===!1,Ut&&It.addToRenderList(g,T),this.info.render.frame++,K===!0&&rt.beginShadows();const V=p.state.shadowsArray;bt.render(V,T,L),K===!0&&rt.endShadows(),this.info.autoReset===!0&&this.info.reset();const W=g.opaque,U=g.transmissive;if(p.setupLights(),L.isArrayCamera){const at=L.cameras;if(U.length>0)for(let xt=0,Et=at.length;xt<Et;xt++){const Tt=at[xt];Uo(W,U,T,Tt)}Ut&&It.render(T);for(let xt=0,Et=at.length;xt<Et;xt++){const Tt=at[xt];Lo(g,T,Tt,Tt.viewport)}}else U.length>0&&Uo(W,U,T,L),Ut&&It.render(T),Lo(g,T,L);E!==null&&(C.updateMultisampleRenderTarget(E),C.updateRenderTargetMipmap(E)),T.isScene===!0&&T.onAfterRender(v,T,L),ce.resetDefaultState(),M=-1,b=null,y.pop(),y.length>0?(p=y[y.length-1],K===!0&&rt.setGlobalState(v.clippingPlanes,p.state.camera)):p=null,_.pop(),_.length>0?g=_[_.length-1]:g=null};function Lr(T,L,V,W){if(T.visible===!1)return;if(T.layers.test(L.layers)){if(T.isGroup)V=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(L);else if(T.isLight)p.pushLight(T),T.castShadow&&p.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||z.intersectsSprite(T)){W&&st.setFromMatrixPosition(T.matrixWorld).applyMatrix4(wt);const xt=Z.update(T),Et=T.material;Et.visible&&g.push(T,xt,Et,V,st.z,null)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||z.intersectsObject(T))){const xt=Z.update(T),Et=T.material;if(W&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),st.copy(T.boundingSphere.center)):(xt.boundingSphere===null&&xt.computeBoundingSphere(),st.copy(xt.boundingSphere.center)),st.applyMatrix4(T.matrixWorld).applyMatrix4(wt)),Array.isArray(Et)){const Tt=xt.groups;for(let Bt=0,Gt=Tt.length;Bt<Gt;Bt++){const At=Tt[Bt],te=Et[At.materialIndex];te&&te.visible&&g.push(T,xt,te,V,st.z,At)}}else Et.visible&&g.push(T,xt,Et,V,st.z,null)}}const at=T.children;for(let xt=0,Et=at.length;xt<Et;xt++)Lr(at[xt],L,V,W)}function Lo(T,L,V,W){const U=T.opaque,at=T.transmissive,xt=T.transparent;p.setupLightsView(V),K===!0&&rt.setGlobalState(v.clippingPlanes,V),W&&Dt.viewport(P.copy(W)),U.length>0&&Ds(U,L,V),at.length>0&&Ds(at,L,V),xt.length>0&&Ds(xt,L,V),Dt.buffers.depth.setTest(!0),Dt.buffers.depth.setMask(!0),Dt.buffers.color.setMask(!0),Dt.setPolygonOffset(!1)}function Uo(T,L,V,W){if((V.isScene===!0?V.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[W.id]===void 0&&(p.state.transmissionRenderTarget[W.id]=new bi(1,1,{generateMipmaps:!0,type:jt.has("EXT_color_buffer_half_float")||jt.has("EXT_color_buffer_float")?ks:Pn,minFilter:vi,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Qt.workingColorSpace}));const at=p.state.transmissionRenderTarget[W.id],xt=W.viewport||P;at.setSize(xt.z,xt.w);const Et=v.getRenderTarget();v.setRenderTarget(at),v.getClearColor($),j=v.getClearAlpha(),j<1&&v.setClearColor(16777215,.5),v.clear(),Ut&&It.render(V);const Tt=v.toneMapping;v.toneMapping=si;const Bt=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),p.setupLightsView(W),K===!0&&rt.setGlobalState(v.clippingPlanes,W),Ds(T,V,W),C.updateMultisampleRenderTarget(at),C.updateRenderTargetMipmap(at),jt.has("WEBGL_multisampled_render_to_texture")===!1){let Gt=!1;for(let At=0,te=L.length;At<te;At++){const he=L[At],fe=he.object,Ve=he.geometry,ne=he.material,Ct=he.group;if(ne.side===sn&&fe.layers.test(W.layers)){const Ln=ne.side;ne.side=Ze,ne.needsUpdate=!0,Do(fe,V,W,Ve,ne,Ct),ne.side=Ln,ne.needsUpdate=!0,Gt=!0}}Gt===!0&&(C.updateMultisampleRenderTarget(at),C.updateRenderTargetMipmap(at))}v.setRenderTarget(Et),v.setClearColor($,j),Bt!==void 0&&(W.viewport=Bt),v.toneMapping=Tt}function Ds(T,L,V){const W=L.isScene===!0?L.overrideMaterial:null;for(let U=0,at=T.length;U<at;U++){const xt=T[U],Et=xt.object,Tt=xt.geometry,Bt=W===null?xt.material:W,Gt=xt.group;Et.layers.test(V.layers)&&Do(Et,L,V,Tt,Bt,Gt)}}function Do(T,L,V,W,U,at){T.onBeforeRender(v,L,V,W,U,at),T.modelViewMatrix.multiplyMatrices(V.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),U.onBeforeRender(v,L,V,W,T,at),U.transparent===!0&&U.side===sn&&U.forceSinglePass===!1?(U.side=Ze,U.needsUpdate=!0,v.renderBufferDirect(V,L,W,U,T,at),U.side=ri,U.needsUpdate=!0,v.renderBufferDirect(V,L,W,U,T,at),U.side=sn):v.renderBufferDirect(V,L,W,U,T,at),T.onAfterRender(v,L,V,W,U,at)}function Is(T,L,V){L.isScene!==!0&&(L=Lt);const W=kt.get(T),U=p.state.lights,at=p.state.shadowsArray,xt=U.state.version,Et=Rt.getParameters(T,U.state,at,L,V),Tt=Rt.getProgramCacheKey(Et);let Bt=W.programs;W.environment=T.isMeshStandardMaterial?L.environment:null,W.fog=L.fog,W.envMap=(T.isMeshStandardMaterial?H:S).get(T.envMap||W.environment),W.envMapRotation=W.environment!==null&&T.envMap===null?L.environmentRotation:T.envMapRotation,Bt===void 0&&(T.addEventListener("dispose",Ht),Bt=new Map,W.programs=Bt);let Gt=Bt.get(Tt);if(Gt!==void 0){if(W.currentProgram===Gt&&W.lightsStateVersion===xt)return No(T,Et),Gt}else Et.uniforms=Rt.getUniforms(T),T.onBeforeCompile(Et,v),Gt=Rt.acquireProgram(Et,Tt),Bt.set(Tt,Gt),W.uniforms=Et.uniforms;const At=W.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(At.clippingPlanes=rt.uniform),No(T,Et),W.needsLights=rh(T),W.lightsStateVersion=xt,W.needsLights&&(At.ambientLightColor.value=U.state.ambient,At.lightProbe.value=U.state.probe,At.directionalLights.value=U.state.directional,At.directionalLightShadows.value=U.state.directionalShadow,At.spotLights.value=U.state.spot,At.spotLightShadows.value=U.state.spotShadow,At.rectAreaLights.value=U.state.rectArea,At.ltc_1.value=U.state.rectAreaLTC1,At.ltc_2.value=U.state.rectAreaLTC2,At.pointLights.value=U.state.point,At.pointLightShadows.value=U.state.pointShadow,At.hemisphereLights.value=U.state.hemi,At.directionalShadowMap.value=U.state.directionalShadowMap,At.directionalShadowMatrix.value=U.state.directionalShadowMatrix,At.spotShadowMap.value=U.state.spotShadowMap,At.spotLightMatrix.value=U.state.spotLightMatrix,At.spotLightMap.value=U.state.spotLightMap,At.pointShadowMap.value=U.state.pointShadowMap,At.pointShadowMatrix.value=U.state.pointShadowMatrix),W.currentProgram=Gt,W.uniformsList=null,Gt}function Io(T){if(T.uniformsList===null){const L=T.currentProgram.getUniforms();T.uniformsList=pr.seqWithValue(L.seq,T.uniforms)}return T.uniformsList}function No(T,L){const V=kt.get(T);V.outputColorSpace=L.outputColorSpace,V.batching=L.batching,V.batchingColor=L.batchingColor,V.instancing=L.instancing,V.instancingColor=L.instancingColor,V.instancingMorph=L.instancingMorph,V.skinning=L.skinning,V.morphTargets=L.morphTargets,V.morphNormals=L.morphNormals,V.morphColors=L.morphColors,V.morphTargetsCount=L.morphTargetsCount,V.numClippingPlanes=L.numClippingPlanes,V.numIntersection=L.numClipIntersection,V.vertexAlphas=L.vertexAlphas,V.vertexTangents=L.vertexTangents,V.toneMapping=L.toneMapping}function ih(T,L,V,W,U){L.isScene!==!0&&(L=Lt),C.resetTextureUnits();const at=L.fog,xt=W.isMeshStandardMaterial?L.environment:null,Et=E===null?v.outputColorSpace:E.isXRRenderTarget===!0?E.texture.colorSpace:es,Tt=(W.isMeshStandardMaterial?H:S).get(W.envMap||xt),Bt=W.vertexColors===!0&&!!V.attributes.color&&V.attributes.color.itemSize===4,Gt=!!V.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),At=!!V.morphAttributes.position,te=!!V.morphAttributes.normal,he=!!V.morphAttributes.color;let fe=si;W.toneMapped&&(E===null||E.isXRRenderTarget===!0)&&(fe=v.toneMapping);const Ve=V.morphAttributes.position||V.morphAttributes.normal||V.morphAttributes.color,ne=Ve!==void 0?Ve.length:0,Ct=kt.get(W),Ln=p.state.lights;if(K===!0&&(lt===!0||T!==b)){const ln=T===b&&W.id===M;rt.setState(W,T,ln)}let ie=!1;W.version===Ct.__version?(Ct.needsLights&&Ct.lightsStateVersion!==Ln.state.version||Ct.outputColorSpace!==Et||U.isBatchedMesh&&Ct.batching===!1||!U.isBatchedMesh&&Ct.batching===!0||U.isBatchedMesh&&Ct.batchingColor===!0&&U.colorTexture===null||U.isBatchedMesh&&Ct.batchingColor===!1&&U.colorTexture!==null||U.isInstancedMesh&&Ct.instancing===!1||!U.isInstancedMesh&&Ct.instancing===!0||U.isSkinnedMesh&&Ct.skinning===!1||!U.isSkinnedMesh&&Ct.skinning===!0||U.isInstancedMesh&&Ct.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&Ct.instancingColor===!1&&U.instanceColor!==null||U.isInstancedMesh&&Ct.instancingMorph===!0&&U.morphTexture===null||U.isInstancedMesh&&Ct.instancingMorph===!1&&U.morphTexture!==null||Ct.envMap!==Tt||W.fog===!0&&Ct.fog!==at||Ct.numClippingPlanes!==void 0&&(Ct.numClippingPlanes!==rt.numPlanes||Ct.numIntersection!==rt.numIntersection)||Ct.vertexAlphas!==Bt||Ct.vertexTangents!==Gt||Ct.morphTargets!==At||Ct.morphNormals!==te||Ct.morphColors!==he||Ct.toneMapping!==fe||Ct.morphTargetsCount!==ne)&&(ie=!0):(ie=!0,Ct.__version=W.version);let gn=Ct.currentProgram;ie===!0&&(gn=Is(W,L,U));let wi=!1,Je=!1,os=!1;const pe=gn.getUniforms(),En=Ct.uniforms;if(Dt.useProgram(gn.program)&&(wi=!0,Je=!0,os=!0),W.id!==M&&(M=W.id,Je=!0),wi||b!==T){Dt.buffers.depth.getReversed()?(it.copy(T.projectionMatrix),Nu(it),Fu(it),pe.setValue(I,"projectionMatrix",it)):pe.setValue(I,"projectionMatrix",T.projectionMatrix),pe.setValue(I,"viewMatrix",T.matrixWorldInverse);const Wn=pe.map.cameraPosition;Wn!==void 0&&Wn.setValue(I,Pt.setFromMatrixPosition(T.matrixWorld)),Kt.logarithmicDepthBuffer&&pe.setValue(I,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&pe.setValue(I,"isOrthographic",T.isOrthographicCamera===!0),b!==T&&(b=T,Je=!0,os=!0)}if(U.isSkinnedMesh){pe.setOptional(I,U,"bindMatrix"),pe.setOptional(I,U,"bindMatrixInverse");const ln=U.skeleton;ln&&(ln.boneTexture===null&&ln.computeBoneTexture(),pe.setValue(I,"boneTexture",ln.boneTexture,C))}U.isBatchedMesh&&(pe.setOptional(I,U,"batchingTexture"),pe.setValue(I,"batchingTexture",U._matricesTexture,C),pe.setOptional(I,U,"batchingIdTexture"),pe.setValue(I,"batchingIdTexture",U._indirectTexture,C),pe.setOptional(I,U,"batchingColorTexture"),U._colorsTexture!==null&&pe.setValue(I,"batchingColorTexture",U._colorsTexture,C));const ls=V.morphAttributes;if((ls.position!==void 0||ls.normal!==void 0||ls.color!==void 0)&&Ot.update(U,V,gn),(Je||Ct.receiveShadow!==U.receiveShadow)&&(Ct.receiveShadow=U.receiveShadow,pe.setValue(I,"receiveShadow",U.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(En.envMap.value=Tt,En.flipEnvMap.value=Tt.isCubeTexture&&Tt.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&L.environment!==null&&(En.envMapIntensity.value=L.environmentIntensity),Je&&(pe.setValue(I,"toneMappingExposure",v.toneMappingExposure),Ct.needsLights&&sh(En,os),at&&W.fog===!0&&ft.refreshFogUniforms(En,at),ft.refreshMaterialUniforms(En,W,G,q,p.state.transmissionRenderTarget[T.id]),pr.upload(I,Io(Ct),En,C)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(pr.upload(I,Io(Ct),En,C),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&pe.setValue(I,"center",U.center),pe.setValue(I,"modelViewMatrix",U.modelViewMatrix),pe.setValue(I,"normalMatrix",U.normalMatrix),pe.setValue(I,"modelMatrix",U.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){const ln=W.uniformsGroups;for(let Wn=0,$n=ln.length;Wn<$n;Wn++){const Fo=ln[Wn];k.update(Fo,gn),k.bind(Fo,gn)}}return gn}function sh(T,L){T.ambientLightColor.needsUpdate=L,T.lightProbe.needsUpdate=L,T.directionalLights.needsUpdate=L,T.directionalLightShadows.needsUpdate=L,T.pointLights.needsUpdate=L,T.pointLightShadows.needsUpdate=L,T.spotLights.needsUpdate=L,T.spotLightShadows.needsUpdate=L,T.rectAreaLights.needsUpdate=L,T.hemisphereLights.needsUpdate=L}function rh(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return w},this.getRenderTarget=function(){return E},this.setRenderTargetTextures=function(T,L,V){kt.get(T.texture).__webglTexture=L,kt.get(T.depthTexture).__webglTexture=V;const W=kt.get(T);W.__hasExternalTextures=!0,W.__autoAllocateDepthBuffer=V===void 0,W.__autoAllocateDepthBuffer||jt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(T,L){const V=kt.get(T);V.__webglFramebuffer=L,V.__useDefaultFramebuffer=L===void 0},this.setRenderTarget=function(T,L=0,V=0){E=T,R=L,w=V;let W=!0,U=null,at=!1,xt=!1;if(T){const Tt=kt.get(T);if(Tt.__useDefaultFramebuffer!==void 0)Dt.bindFramebuffer(I.FRAMEBUFFER,null),W=!1;else if(Tt.__webglFramebuffer===void 0)C.setupRenderTarget(T);else if(Tt.__hasExternalTextures)C.rebindTextures(T,kt.get(T.texture).__webglTexture,kt.get(T.depthTexture).__webglTexture);else if(T.depthBuffer){const At=T.depthTexture;if(Tt.__boundDepthTexture!==At){if(At!==null&&kt.has(At)&&(T.width!==At.image.width||T.height!==At.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");C.setupDepthRenderbuffer(T)}}const Bt=T.texture;(Bt.isData3DTexture||Bt.isDataArrayTexture||Bt.isCompressedArrayTexture)&&(xt=!0);const Gt=kt.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(Gt[L])?U=Gt[L][V]:U=Gt[L],at=!0):T.samples>0&&C.useMultisampledRTT(T)===!1?U=kt.get(T).__webglMultisampledFramebuffer:Array.isArray(Gt)?U=Gt[V]:U=Gt,P.copy(T.viewport),D.copy(T.scissor),N=T.scissorTest}else P.copy(B).multiplyScalar(G).floor(),D.copy(ot).multiplyScalar(G).floor(),N=ht;if(Dt.bindFramebuffer(I.FRAMEBUFFER,U)&&W&&Dt.drawBuffers(T,U),Dt.viewport(P),Dt.scissor(D),Dt.setScissorTest(N),at){const Tt=kt.get(T.texture);I.framebufferTexture2D(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,I.TEXTURE_CUBE_MAP_POSITIVE_X+L,Tt.__webglTexture,V)}else if(xt){const Tt=kt.get(T.texture),Bt=L||0;I.framebufferTextureLayer(I.FRAMEBUFFER,I.COLOR_ATTACHMENT0,Tt.__webglTexture,V||0,Bt)}M=-1},this.readRenderTargetPixels=function(T,L,V,W,U,at,xt){if(!(T&&T.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Et=kt.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&xt!==void 0&&(Et=Et[xt]),Et){Dt.bindFramebuffer(I.FRAMEBUFFER,Et);try{const Tt=T.texture,Bt=Tt.format,Gt=Tt.type;if(!Kt.textureFormatReadable(Bt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Kt.textureTypeReadable(Gt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=T.width-W&&V>=0&&V<=T.height-U&&I.readPixels(L,V,W,U,$t.convert(Bt),$t.convert(Gt),at)}finally{const Tt=E!==null?kt.get(E).__webglFramebuffer:null;Dt.bindFramebuffer(I.FRAMEBUFFER,Tt)}}},this.readRenderTargetPixelsAsync=async function(T,L,V,W,U,at,xt){if(!(T&&T.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Et=kt.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&xt!==void 0&&(Et=Et[xt]),Et){const Tt=T.texture,Bt=Tt.format,Gt=Tt.type;if(!Kt.textureFormatReadable(Bt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Kt.textureTypeReadable(Gt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(L>=0&&L<=T.width-W&&V>=0&&V<=T.height-U){Dt.bindFramebuffer(I.FRAMEBUFFER,Et);const At=I.createBuffer();I.bindBuffer(I.PIXEL_PACK_BUFFER,At),I.bufferData(I.PIXEL_PACK_BUFFER,at.byteLength,I.STREAM_READ),I.readPixels(L,V,W,U,$t.convert(Bt),$t.convert(Gt),0);const te=E!==null?kt.get(E).__webglFramebuffer:null;Dt.bindFramebuffer(I.FRAMEBUFFER,te);const he=I.fenceSync(I.SYNC_GPU_COMMANDS_COMPLETE,0);return I.flush(),await Iu(I,he,4),I.bindBuffer(I.PIXEL_PACK_BUFFER,At),I.getBufferSubData(I.PIXEL_PACK_BUFFER,0,at),I.deleteBuffer(At),I.deleteSync(he),at}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(T,L=null,V=0){T.isTexture!==!0&&(_s("WebGLRenderer: copyFramebufferToTexture function signature has changed."),L=arguments[0]||null,T=arguments[1]);const W=Math.pow(2,-V),U=Math.floor(T.image.width*W),at=Math.floor(T.image.height*W),xt=L!==null?L.x:0,Et=L!==null?L.y:0;C.setTexture2D(T,0),I.copyTexSubImage2D(I.TEXTURE_2D,V,0,0,xt,Et,U,at),Dt.unbindTexture()},this.copyTextureToTexture=function(T,L,V=null,W=null,U=0){T.isTexture!==!0&&(_s("WebGLRenderer: copyTextureToTexture function signature has changed."),W=arguments[0]||null,T=arguments[1],L=arguments[2],U=arguments[3]||0,V=null);let at,xt,Et,Tt,Bt,Gt,At,te,he;const fe=T.isCompressedTexture?T.mipmaps[U]:T.image;V!==null?(at=V.max.x-V.min.x,xt=V.max.y-V.min.y,Et=V.isBox3?V.max.z-V.min.z:1,Tt=V.min.x,Bt=V.min.y,Gt=V.isBox3?V.min.z:0):(at=fe.width,xt=fe.height,Et=fe.depth||1,Tt=0,Bt=0,Gt=0),W!==null?(At=W.x,te=W.y,he=W.z):(At=0,te=0,he=0);const Ve=$t.convert(L.format),ne=$t.convert(L.type);let Ct;L.isData3DTexture?(C.setTexture3D(L,0),Ct=I.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(C.setTexture2DArray(L,0),Ct=I.TEXTURE_2D_ARRAY):(C.setTexture2D(L,0),Ct=I.TEXTURE_2D),I.pixelStorei(I.UNPACK_FLIP_Y_WEBGL,L.flipY),I.pixelStorei(I.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),I.pixelStorei(I.UNPACK_ALIGNMENT,L.unpackAlignment);const Ln=I.getParameter(I.UNPACK_ROW_LENGTH),ie=I.getParameter(I.UNPACK_IMAGE_HEIGHT),gn=I.getParameter(I.UNPACK_SKIP_PIXELS),wi=I.getParameter(I.UNPACK_SKIP_ROWS),Je=I.getParameter(I.UNPACK_SKIP_IMAGES);I.pixelStorei(I.UNPACK_ROW_LENGTH,fe.width),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,fe.height),I.pixelStorei(I.UNPACK_SKIP_PIXELS,Tt),I.pixelStorei(I.UNPACK_SKIP_ROWS,Bt),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Gt);const os=T.isDataArrayTexture||T.isData3DTexture,pe=L.isDataArrayTexture||L.isData3DTexture;if(T.isRenderTargetTexture||T.isDepthTexture){const En=kt.get(T),ls=kt.get(L),ln=kt.get(En.__renderTarget),Wn=kt.get(ls.__renderTarget);Dt.bindFramebuffer(I.READ_FRAMEBUFFER,ln.__webglFramebuffer),Dt.bindFramebuffer(I.DRAW_FRAMEBUFFER,Wn.__webglFramebuffer);for(let $n=0;$n<Et;$n++)os&&I.framebufferTextureLayer(I.READ_FRAMEBUFFER,I.COLOR_ATTACHMENT0,kt.get(T).__webglTexture,U,Gt+$n),T.isDepthTexture?(pe&&I.framebufferTextureLayer(I.DRAW_FRAMEBUFFER,I.COLOR_ATTACHMENT0,kt.get(L).__webglTexture,U,he+$n),I.blitFramebuffer(Tt,Bt,at,xt,At,te,at,xt,I.DEPTH_BUFFER_BIT,I.NEAREST)):pe?I.copyTexSubImage3D(Ct,U,At,te,he+$n,Tt,Bt,at,xt):I.copyTexSubImage2D(Ct,U,At,te,he+$n,Tt,Bt,at,xt);Dt.bindFramebuffer(I.READ_FRAMEBUFFER,null),Dt.bindFramebuffer(I.DRAW_FRAMEBUFFER,null)}else pe?T.isDataTexture||T.isData3DTexture?I.texSubImage3D(Ct,U,At,te,he,at,xt,Et,Ve,ne,fe.data):L.isCompressedArrayTexture?I.compressedTexSubImage3D(Ct,U,At,te,he,at,xt,Et,Ve,fe.data):I.texSubImage3D(Ct,U,At,te,he,at,xt,Et,Ve,ne,fe):T.isDataTexture?I.texSubImage2D(I.TEXTURE_2D,U,At,te,at,xt,Ve,ne,fe.data):T.isCompressedTexture?I.compressedTexSubImage2D(I.TEXTURE_2D,U,At,te,fe.width,fe.height,Ve,fe.data):I.texSubImage2D(I.TEXTURE_2D,U,At,te,at,xt,Ve,ne,fe);I.pixelStorei(I.UNPACK_ROW_LENGTH,Ln),I.pixelStorei(I.UNPACK_IMAGE_HEIGHT,ie),I.pixelStorei(I.UNPACK_SKIP_PIXELS,gn),I.pixelStorei(I.UNPACK_SKIP_ROWS,wi),I.pixelStorei(I.UNPACK_SKIP_IMAGES,Je),U===0&&L.generateMipmaps&&I.generateMipmap(Ct),Dt.unbindTexture()},this.copyTextureToTexture3D=function(T,L,V=null,W=null,U=0){return T.isTexture!==!0&&(_s("WebGLRenderer: copyTextureToTexture3D function signature has changed."),V=arguments[0]||null,W=arguments[1]||null,T=arguments[2],L=arguments[3],U=arguments[4]||0),_s('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(T,L,V,W,U)},this.initRenderTarget=function(T){kt.get(T).__webglFramebuffer===void 0&&C.setupRenderTarget(T)},this.initTexture=function(T){T.isCubeTexture?C.setTextureCube(T,0):T.isData3DTexture?C.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?C.setTexture2DArray(T,0):C.setTexture2D(T,0),Dt.unbindTexture()},this.resetState=function(){R=0,w=0,E=null,Dt.reset(),ce.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Bn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=Qt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Qt._getUnpackColorSpace()}}class Ym extends we{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new wn,this.environmentIntensity=1,this.environmentRotation=new wn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class ao extends Ge{constructor(t=null,e=1,n=1,s,r,a,o,l,c=He,u=He,f,h){super(null,a,o,l,c,u,s,r,f,h),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class _r extends me{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Bi=new le,Wl=new le,sr=[],$l=new Si,jm=new le,xs=new xe,ys=new is;class Es extends xe{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new _r(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,jm)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Si),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Bi),$l.copy(t.boundingBox).applyMatrix4(Bi),this.boundingBox.union($l)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new is),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Bi),ys.copy(t.boundingSphere).applyMatrix4(Bi),this.boundingSphere.union(ys)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(xs.geometry=this.geometry,xs.material=this.material,xs.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ys.copy(this.boundingSphere),ys.applyMatrix4(n),t.ray.intersectsSphere(ys)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Bi),Wl.multiplyMatrices(n,Bi),xs.matrixWorld=Wl,xs.raycast(t,sr);for(let a=0,o=sr.length;a<o;a++){const l=sr[a];l.instanceId=r,l.object=this,e.push(l)}sr.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new _r(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new ao(new Float32Array(s*this.count),s,this.count,wr,Cn));const r=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=s*t;r[l]=o,r.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class jc extends ss{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new Wt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Xl=new le,oo=new So,rr=new is,ar=new O;class lo extends we{constructor(t=new Re,e=new jc){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),rr.copy(n.boundingSphere),rr.applyMatrix4(s),rr.radius+=r,t.ray.intersectsSphere(rr)===!1)return;Xl.copy(s).invert(),oo.copy(t.ray).applyMatrix4(Xl);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,f=n.attributes.position;if(c!==null){const h=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);for(let m=h,x=d;m<x;m++){const g=c.getX(m);ar.fromBufferAttribute(f,g),ql(ar,g,l,s,t,e,this)}}else{const h=Math.max(0,a.start),d=Math.min(f.count,a.start+a.count);for(let m=h,x=d;m<x;m++)ar.fromBufferAttribute(f,m),ql(ar,m,l,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function ql(i,t,e,n,s,r,a){const o=oo.distanceSqToPoint(i);if(o<e){const l=new O;oo.closestPointToPoint(i,l),l.applyMatrix4(n);const c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}class Ao extends Re{constructor(t=1,e=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:s},e=Math.max(3,e);const r=[],a=[],o=[],l=[],c=new O,u=new Yt;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let f=0,h=3;f<=e;f++,h+=3){const d=n+f/e*s;c.x=t*Math.cos(d),c.y=t*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),u.x=(a[h]/t+1)/2,u.y=(a[h+1]/t+1)/2,l.push(u.x,u.y)}for(let f=1;f<=e;f++)r.push(f,f+1,0);this.setIndex(r),this.setAttribute("position",new _e(a,3)),this.setAttribute("normal",new _e(o,3)),this.setAttribute("uv",new _e(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ao(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Ar extends Re{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const u=[],f=[],h=[],d=[];let m=0;const x=[],g=n/2;let p=0;_(),a===!1&&(t>0&&y(!0),e>0&&y(!1)),this.setIndex(u),this.setAttribute("position",new _e(f,3)),this.setAttribute("normal",new _e(h,3)),this.setAttribute("uv",new _e(d,2));function _(){const v=new O,A=new O;let R=0;const w=(e-t)/n;for(let E=0;E<=r;E++){const M=[],b=E/r,P=b*(e-t)+t;for(let D=0;D<=s;D++){const N=D/s,$=N*l+o,j=Math.sin($),X=Math.cos($);A.x=P*j,A.y=-b*n+g,A.z=P*X,f.push(A.x,A.y,A.z),v.set(j,w,X).normalize(),h.push(v.x,v.y,v.z),d.push(N,1-b),M.push(m++)}x.push(M)}for(let E=0;E<s;E++)for(let M=0;M<r;M++){const b=x[M][E],P=x[M+1][E],D=x[M+1][E+1],N=x[M][E+1];(t>0||M!==0)&&(u.push(b,P,N),R+=3),(e>0||M!==r-1)&&(u.push(P,D,N),R+=3)}c.addGroup(p,R,0),p+=R}function y(v){const A=m,R=new Yt,w=new O;let E=0;const M=v===!0?t:e,b=v===!0?1:-1;for(let D=1;D<=s;D++)f.push(0,g*b,0),h.push(0,b,0),d.push(.5,.5),m++;const P=m;for(let D=0;D<=s;D++){const $=D/s*l+o,j=Math.cos($),X=Math.sin($);w.x=M*X,w.y=g*b,w.z=M*j,f.push(w.x,w.y,w.z),h.push(0,b,0),R.x=j*.5+.5,R.y=X*.5*b+.5,d.push(R.x,R.y),m++}for(let D=0;D<s;D++){const N=A+D,$=P+D;v===!0?u.push($,$+1,N):u.push($+1,$,N),E+=3}c.addGroup(p,E,v===!0?1:2),p+=E}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ar(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Rr extends Ar{constructor(t=1,e=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new Rr(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Cr extends Re{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};const r=[],a=[];o(s),c(n),u(),this.setAttribute("position",new _e(r,3)),this.setAttribute("normal",new _e(r.slice(),3)),this.setAttribute("uv",new _e(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(_){const y=new O,v=new O,A=new O;for(let R=0;R<e.length;R+=3)d(e[R+0],y),d(e[R+1],v),d(e[R+2],A),l(y,v,A,_)}function l(_,y,v,A){const R=A+1,w=[];for(let E=0;E<=R;E++){w[E]=[];const M=_.clone().lerp(v,E/R),b=y.clone().lerp(v,E/R),P=R-E;for(let D=0;D<=P;D++)D===0&&E===R?w[E][D]=M:w[E][D]=M.clone().lerp(b,D/P)}for(let E=0;E<R;E++)for(let M=0;M<2*(R-E)-1;M++){const b=Math.floor(M/2);M%2===0?(h(w[E][b+1]),h(w[E+1][b]),h(w[E][b])):(h(w[E][b+1]),h(w[E+1][b+1]),h(w[E+1][b]))}}function c(_){const y=new O;for(let v=0;v<r.length;v+=3)y.x=r[v+0],y.y=r[v+1],y.z=r[v+2],y.normalize().multiplyScalar(_),r[v+0]=y.x,r[v+1]=y.y,r[v+2]=y.z}function u(){const _=new O;for(let y=0;y<r.length;y+=3){_.x=r[y+0],_.y=r[y+1],_.z=r[y+2];const v=g(_)/2/Math.PI+.5,A=p(_)/Math.PI+.5;a.push(v,1-A)}m(),f()}function f(){for(let _=0;_<a.length;_+=6){const y=a[_+0],v=a[_+2],A=a[_+4],R=Math.max(y,v,A),w=Math.min(y,v,A);R>.9&&w<.1&&(y<.2&&(a[_+0]+=1),v<.2&&(a[_+2]+=1),A<.2&&(a[_+4]+=1))}}function h(_){r.push(_.x,_.y,_.z)}function d(_,y){const v=_*3;y.x=t[v+0],y.y=t[v+1],y.z=t[v+2]}function m(){const _=new O,y=new O,v=new O,A=new O,R=new Yt,w=new Yt,E=new Yt;for(let M=0,b=0;M<r.length;M+=9,b+=6){_.set(r[M+0],r[M+1],r[M+2]),y.set(r[M+3],r[M+4],r[M+5]),v.set(r[M+6],r[M+7],r[M+8]),R.set(a[b+0],a[b+1]),w.set(a[b+2],a[b+3]),E.set(a[b+4],a[b+5]),A.copy(_).add(y).add(v).divideScalar(3);const P=g(A);x(R,b+0,_,P),x(w,b+2,y,P),x(E,b+4,v,P)}}function x(_,y,v,A){A<0&&_.x===1&&(a[y]=_.x-1),v.x===0&&v.z===0&&(a[y]=A/2/Math.PI+.5)}function g(_){return Math.atan2(_.z,-_.x)}function p(_){return Math.atan2(-_.y,Math.sqrt(_.x*_.x+_.z*_.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Cr(t.vertices,t.indices,t.radius,t.details)}}class Ro extends Cr{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=1/n,r=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-s,-n,0,-s,n,0,s,-n,0,s,n,-s,-n,0,-s,n,0,s,-n,0,s,n,0,-n,0,-s,n,0,-s,-n,0,s,n,0,s],a=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(r,a,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Ro(t.radius,t.detail)}}class Pr extends Cr{constructor(t=1,e=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,s,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Pr(t.radius,t.detail)}}class kr extends Re{constructor(t=.5,e=1,n=32,s=1,r=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:a},n=Math.max(3,n),s=Math.max(1,s);const o=[],l=[],c=[],u=[];let f=t;const h=(e-t)/s,d=new O,m=new Yt;for(let x=0;x<=s;x++){for(let g=0;g<=n;g++){const p=r+g/n*a;d.x=f*Math.cos(p),d.y=f*Math.sin(p),l.push(d.x,d.y,d.z),c.push(0,0,1),m.x=(d.x/e+1)/2,m.y=(d.y/e+1)/2,u.push(m.x,m.y)}f+=h}for(let x=0;x<s;x++){const g=x*(n+1);for(let p=0;p<n;p++){const _=p+g,y=_,v=_+n+1,A=_+n+2,R=_+1;o.push(y,v,R),o.push(v,A,R)}}this.setIndex(o),this.setAttribute("position",new _e(l,3)),this.setAttribute("normal",new _e(c,3)),this.setAttribute("uv",new _e(u,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new kr(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Co extends Re{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const u=[],f=new O,h=new O,d=[],m=[],x=[],g=[];for(let p=0;p<=n;p++){const _=[],y=p/n;let v=0;p===0&&a===0?v=.5/e:p===n&&l===Math.PI&&(v=-.5/e);for(let A=0;A<=e;A++){const R=A/e;f.x=-t*Math.cos(s+R*r)*Math.sin(a+y*o),f.y=t*Math.cos(a+y*o),f.z=t*Math.sin(s+R*r)*Math.sin(a+y*o),m.push(f.x,f.y,f.z),h.copy(f).normalize(),x.push(h.x,h.y,h.z),g.push(R+v,1-y),_.push(c++)}u.push(_)}for(let p=0;p<n;p++)for(let _=0;_<e;_++){const y=u[p][_+1],v=u[p][_],A=u[p+1][_],R=u[p+1][_+1];(p!==0||a>0)&&d.push(y,v,R),(p!==n-1||l<Math.PI)&&d.push(v,A,R)}this.setIndex(d),this.setAttribute("position",new _e(m,3)),this.setAttribute("normal",new _e(x,3)),this.setAttribute("uv",new _e(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Co(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class br extends ss{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new Wt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Wt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=kc,this.normalScale=new Yt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new wn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Kc extends we{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Wt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Km extends Kc{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(we.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Wt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const fa=new le,Yl=new O,jl=new O;class Zm{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Yt(512,512),this.map=null,this.mapPass=null,this.matrix=new le,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Eo,this._frameExtents=new Yt(1,1),this._viewportCount=1,this._viewports=[new ve(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Yl.setFromMatrixPosition(t.matrixWorld),e.position.copy(Yl),jl.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(jl),e.updateMatrixWorld(),fa.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(fa),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(fa)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class Jm extends Zm{constructor(){super(new Vc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Qm extends Kc{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(we.DEFAULT_UP),this.updateMatrix(),this.target=new we,this.shadow=new Jm}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}const Kl=new le;class tg{constructor(t,e,n=0,s=1/0){this.ray=new So(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new wo,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Kl.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Kl),this}intersectObject(t,e=!0,n=[]){return co(t,this,n,e),n.sort(Zl),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)co(t[s],this,n,e);return n.sort(Zl),n}}function Zl(i,t){return i.distance-t.distance}function co(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){const r=i.children;for(let a=0,o=r.length;a<o;a++)co(r[a],t,e,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:mo}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=mo);const eg=55*Math.PI/180,Zc=45,Jl=24,ng=68;class ig{constructor(t){this.map=t,this.apply()}camera=new un(Zc,16/9,1,400);tx=64;tz=64;height=42;targetHeight=42;yaw=0;targetYaw=0;vx=0;vz=0;allowRotate=!1;tmp=new O;ray=new tg;panning=!1;jump=null;setTarget(t,e,n=!0){n?(this.tx=t,this.tz=e,this.jump=null):this.jump={x:t,z:e,t:0},this.clamp(),this.apply()}zoomBy(t){const e=Math.exp(t*.0012);this.targetHeight=Math.min(ng,Math.max(Jl,this.targetHeight*e))}rotate(t){this.allowRotate&&(this.targetYaw+=t*Math.PI/2)}update(t,e,n,s){const r=1-Math.exp(-t*10);this.height+=(this.targetHeight-this.height)*r,this.yaw+=(this.targetYaw-this.yaw)*(1-Math.exp(-t*8));const a=this.height*.95*(s?1.6:1),o=e*a,l=n*a;this.vx+=(o-this.vx)*(1-Math.exp(-t*14)),this.vz+=(l-this.vz)*(1-Math.exp(-t*14));const c=Math.cos(this.yaw),u=Math.sin(this.yaw);if(this.panning=e!==0||n!==0,this.panning&&(this.jump=null),this.tx+=(this.vx*c-this.vz*u)*t,this.tz+=(this.vx*u+this.vz*c)*t,this.jump){const f=this.jump,h=1-Math.exp(-t*9);this.tx+=(f.x-this.tx)*h,this.tz+=(f.z-this.tz)*h,Math.hypot(f.x-this.tx,f.z-this.tz)<.2&&(this.jump=null)}this.clamp(),this.apply()}clamp(){const t=this.map.size,e=6+(this.height-Jl)*.12;this.tx=Math.min(t-e,Math.max(e,this.tx)),this.tz=Math.min(t-e+2,Math.max(e-2,this.tz))}apply(){const t=this.height/Math.tan(eg),e=Math.cos(this.yaw),n=Math.sin(this.yaw),s=Ft(this.map,this.tx,this.tz)*.5,r=-n*t,a=e*t;this.camera.position.set(this.tx+r,s+this.height,this.tz+a),this.camera.lookAt(this.tx,s,this.tz),this.camera.updateMatrixWorld()}resize(t,e){this.camera.aspect=t/e,this.camera.updateProjectionMatrix()}groundPoint(t,e,n){this.ray.setFromCamera({x:t,y:e},this.camera);const s=this.ray.ray.origin,r=this.ray.ray.direction;if(r.y>=-.01)return!1;let a=0,o=0,l=0;for(let c=0;c<4;c++){const u=(a-s.y)/r.y;if(o=s.x+r.x*u,l=s.z+r.z*u,a=Ft(this.map,Math.min(this.map.size-.01,Math.max(0,o)),Math.min(this.map.size-.01,Math.max(0,l))),Math.abs(a)<.001)break}return n.x=o,n.z=l,!0}project(t,e,n,s,r,a){this.tmp.set(t,e,n).project(this.camera),a.x=(this.tmp.x*.5+.5)*s,a.y=(-this.tmp.y*.5+.5)*r,a.z=this.tmp.z}}function Jc(i,t=!1){const e=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),s=new Set(Object.keys(i[0].morphAttributes)),r={},a={},o=i[0].morphTargetsRelative,l=new Re;let c=0;for(let u=0;u<i.length;++u){const f=i[u];let h=0;if(e!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const d in f.attributes){if(!n.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;r[d]===void 0&&(r[d]=[]),r[d].push(f.attributes[d]),h++}if(h!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(o!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const d in f.morphAttributes){if(!s.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;a[d]===void 0&&(a[d]=[]),a[d].push(f.morphAttributes[d])}if(t){let d;if(e)d=f.index.count;else if(f.attributes.position!==void 0)d=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,d,u),c+=d}}if(e){let u=0;const f=[];for(let h=0;h<i.length;++h){const d=i[h].index;for(let m=0;m<d.count;++m)f.push(d.getX(m)+u);u+=i[h].attributes.position.count}l.setIndex(f)}for(const u in r){const f=Ql(r[u]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;l.setAttribute(u,f)}for(const u in a){const f=a[u][0].length;if(f===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[u]=[];for(let h=0;h<f;++h){const d=[];for(let x=0;x<a[u].length;++x)d.push(a[u][x][h]);const m=Ql(d);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;l.morphAttributes[u].push(m)}}return l}function Ql(i){let t,e,n,s=-1,r=0;for(let c=0;c<i.length;++c){const u=i[c];if(t===void 0&&(t=u.array.constructor),t!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=u.itemSize),e!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=u.normalized),n!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=u.gpuType),s!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=u.count*e}const a=new t(r),o=new me(a,e,n);let l=0;for(let c=0;c<i.length;++c){const u=i[c];if(u.isInterleavedBufferAttribute){const f=l/e;for(let h=0,d=u.count;h<d;h++)for(let m=0;m<e;m++){const x=u.getComponent(h,m);o.setComponent(h+f,m,x)}}else a.set(u.array,l);l+=u.count*e}return s!==void 0&&(o.gpuType=s),o}const tt=(i,t,e,n="body",s)=>({t:"b",p:i,s:t,c:e,g:n,r:s}),ee=(i,t,e,n,s="body",r,a=10)=>({t:"c",p:i,s:[t,e,t],c:n,g:s,r,n:a}),Nt=(i,t,e,n,s="body",r,a=8)=>({t:"k",p:i,s:[t,e,t],c:n,g:s,r,n:a}),St=(i,t,e,n="body",s)=>({t:"s",p:i,s:t,c:e,g:n,r:s}),$e=(i,t,e,n="glow",s)=>({t:"o",p:i,s:t,c:e,g:n,r:s}),Xe=6976640,zt=3752267,qe=10397617,be=16760909,tc=15130571,_n=9132604,Ye=5004354,or=8083629,Ce=12096767,en=5236420,nn=7902796,re=3029809,bn=14264063,Xt=16777215,Qc={fabricator:[tt([0,.5,0],[.74,.3,.56],Xe),tt([-.08,.72,0],[.42,.2,.4],qe),tt([.1,.24,.32],[.55,.2,.14],zt),tt([.1,.24,-.32],[.55,.2,.14],zt),ee([-.28,.78,0],.15,.36,zt,"body",[0,0,Math.PI/2]),tt([-.34,.6,0],[.08,.08,.5],Xt,"team"),St([.28,.76,.12],[.06,.06,.06],be,"glow"),tt([.5,.52,0],[.62,.1,.12],zt,"head"),tt([.84,.52,0],[.12,.2,.2],be,"head")],kestrel:[tt([0,.4,0],[1,.2,.46],Xe),tt([.38,.5,0],[.34,.14,.34],qe),ee([.28,.28,.34],.28,.16,zt,"body",[Math.PI/2,0,0],12),ee([.28,.28,-.34],.28,.16,zt,"body",[Math.PI/2,0,0],12),ee([-.34,.28,.34],.28,.16,zt,"body",[Math.PI/2,0,0],12),ee([-.34,.28,-.34],.28,.16,zt,"body",[Math.PI/2,0,0],12),tt([-.1,.52,0],[.5,.05,.1],Xt,"team"),ee([-.3,.8,0],.025,.6,zt,"head"),St([-.3,1.12,0],[.07,.07,.07],be,"glow"),tt([.5,.48,0],[.24,.08,.08],zt,"head")],bulwark:[tt([0,.5,.2],[.26,.7,.24],zt),tt([0,.5,-.2],[.26,.7,.24],zt),tt([0,.5+.55,0],[.62,.52,.74],Xe),tt([.08,1.12,0],[.44,.22,.6],qe),tt([-.34,1,0],[.1,.3,.6],Xt,"team"),tt([0,1.05,.45],[.32,.3,.14],zt),tt([0,1.05,-.45],[.32,.3,.14],zt),tt([.58,1.08,.12],[.9,.14,.14],zt,"head"),tt([.18,1.34,-.1],[.28,.14,.24],qe,"head"),tt([.28,1.34,-.1],[.06,.06,.2],be,"glow")],arc_lancer:[tt([0,.45,.28],[.3,.7,.26],zt),tt([0,.45,-.28],[.3,.7,.26],zt),tt([-.05,1.05,0],[.7,.5,.7],Xe),tt([-.2,1.1,0],[.4,.26,.8],_n),tt([-.4,1,0],[.1,.34,.64],Xt,"team"),ee([.9,1.15,0],.09,1.8,zt,"head",[0,0,Math.PI/2]),ee([.5,1.15,0],.15,.12,be,"glow",[0,0,Math.PI/2]),ee([1.1,1.15,0],.13,.1,be,"glow",[0,0,Math.PI/2]),St([1.82,1.15,0],[.1,.1,.1],be,"glow")],mender_rig:[St([0,.66,0],[.62,.34,.62],qe),St([0,.9,0],[.4,.22,.4],tc),tt([.28,.3,.4],[.1,.5,.1],zt,"body",[0,0,.3]),tt([.28,.3,-.4],[.1,.5,.1],zt,"body",[0,0,.3]),tt([-.38,.3,0],[.1,.5,.1],zt,"body",[0,0,-.3]),tt([0,.62,0],[1,.06,.06],Xt,"team"),tt([0,1.1,0],[.16,.34,.1],16738906,"glow"),tt([0,1.1,0],[.34,.12,.1],16738906,"glow"),ee([0,1.3,0],.03,.4,zt,"head"),St([0,1.54,0],[.09,.09,.09],be,"glow")],mortar_crawler:[tt([0,.36,.5],[1.5,.34,.3],zt),tt([0,.36,-.5],[1.5,.34,.3],zt),tt([0,.55,0],[1.3,.3,.8],Xe),tt([-.3,.78,0],[.7,.2,.6],qe),tt([-.6,.62,0],[.12,.12,.8],Xt,"team"),ee([.35,1.05,0],.17,1.4,zt,"head",[0,0,-.95]),ee([.6,1.3,0],.22,.14,be,"glow",[0,0,-.95]),tt([-.45,.95,0],[.26,.2,.4],_n,"head")],aegis_frame:[tt([0,.55,.38],[.44,.9,.4],zt),tt([0,.55,-.38],[.44,.9,.4],zt),tt([-.05,1.45,0],[.9,.7,1.1],Xe),tt([-.2,1.65,0],[.5,.3,1.2],_n),tt([-.5,1.4,0],[.12,.4,.9],Xt,"team"),tt([.66,1.35,0],[.12,1.25,1.5],qe),tt([.74,1.35,0],[.04,1.1,1.3],be,"glow"),tt([.5,1.9,.3],[.8,.18,.18],zt,"head"),tt([.1,1.9,0],[.36,.22,.4],qe,"head")],tender:[St([0,.46,0],[.4,.3,.34],Ye),St([.12,.72,0],[.24,.22,.22],nn),Nt([.28,.2,.22],.05,.4,re,"body",[0,0,1.2]),Nt([.28,.2,-.22],.05,.4,re,"body",[0,0,1.2]),Nt([-.2,.2,.22],.05,.4,re,"body",[0,0,-1.2]),Nt([-.2,.2,-.22],.05,.4,re,"body",[0,0,-1.2]),St([-.22,.62,0],[.12,.1,.3],Xt,"team"),St([.34,.86,0],[.07,.07,.07],en,"glow"),Nt([.46,.55,0],.06,.6,nn,"head",[0,0,-1.4])],glimmerwing:[St([0,.3,0],[.34,.14,.14],Ye),St([.3,.32,0],[.12,.1,.1],nn),Nt([-.46,.3,0],.07,.5,Ce,"body",[0,0,-Math.PI/2]),tt([0,.52,0],[.08,.06,.4],Xt,"team"),tt([-.05,.4,.55],[.5,.025,.9],Ce,"head",[.4,0,0]),tt([-.05,.4,-.55],[.5,.025,.9],Ce,"head",[-.4,0,0]),St([.42,.34,0],[.05,.05,.05],en,"glow")],thornling:[St([0,.36,0],[.5,.26,.3],Ye),St([.4,.4,0],[.2,.2,.2],nn),Nt([.52,.5,.1],.05,.3,bn,"body",[0,0,-1.2]),Nt([.52,.5,-.1],.05,.3,bn,"body",[0,0,-1.2]),Nt([-.05,.62,0],.07,.3,Ce,"body"),Nt([-.25,.58,0],.07,.28,Ce,"body"),Nt([.15,.6,0],.07,.28,Ce,"body"),Nt([.3,.14,.22],.04,.3,re,"body",[0,0,.9]),Nt([-.3,.14,.22],.04,.3,re,"body",[0,0,-.9]),Nt([.3,.14,-.22],.04,.3,re,"body",[0,0,.9]),Nt([-.3,.14,-.22],.04,.3,re,"body",[0,0,-.9]),St([-.34,.42,0],[.1,.06,.2],Xt,"team"),St([.5,.46,.08],[.04,.04,.04],en,"glow"),St([.5,.46,-.08],[.04,.04,.04],en,"glow")],sporecaster:[St([0,.7,0],[.34,.5,.3],Ye),St([-.2,1.05,0],[.3,.3,.3],or),St([-.2,1.05,0],[.18,.18,.18],en,"glow"),Nt([.1,.25,.2],.05,.6,re,"body",[0,0,.2]),Nt([.1,.25,-.2],.05,.6,re,"body",[0,0,.2]),St([-.34,.65,0],[.08,.14,.32],Xt,"team"),Nt([.5,.92,0],.1,.6,nn,"head",[0,0,-Math.PI/2+.2]),St([.82,.96,0],[.07,.07,.07],en,"glow")],carapace_guard:[St([0,.62,0],[.9,.62,.8],re),St([-.05,.86,0],[.8,.4,.72],Ye),Nt([0,1.28,0],.12,.3,Ce,"body"),Nt([-.35,1.18,0],.1,.26,Ce,"body"),Nt([.35,1.18,0],.1,.26,Ce,"body"),tt([-.5,.78,0],[.1,.1,1],Xt,"team"),Nt([.3,.2,.5],.08,.5,re,"body",[0,0,.4]),Nt([.3,.2,-.5],.08,.5,re,"body",[0,0,.4]),Nt([-.3,.2,.5],.08,.5,re,"body"),Nt([-.3,.2,-.5],.08,.5,re,"body"),St([.78,.6,0],[.22,.2,.22],nn,"head"),St([.9,.62,.1],[.04,.04,.04],en,"glow")],bloom_sage:[Nt([0,.6,0],.46,1.2,or,"body",void 0,10),St([0,1.3,0],[.22,.22,.22],bn),tt([-.05,.85,0],[.9,.06,.06],Xt,"team",[0,1.57,0]),...[0,1,2,3,4].map(i=>({t:"k",p:[Math.cos(i*1.2566)*.3,1.6,Math.sin(i*1.2566)*.3],s:[.1,.4,.1],c:Ce,g:"head",r:[Math.sin(i*1.2566)*.5,0,-Math.cos(i*1.2566)*.5],n:6})),St([0,1.45,0],[.12,.12,.12],en,"glow")],rift_stag:[St([0,.95,0],[.7,.4,.38],Ye),Nt([.5,.45,.2],.05,.9,re,"body",[0,0,.18]),Nt([.5,.45,-.2],.05,.9,re,"body",[0,0,.18]),Nt([-.5,.45,.2],.05,.9,re,"body",[0,0,-.18]),Nt([-.5,.45,-.2],.05,.9,re,"body",[0,0,-.18]),St([-.55,1.05,0],[.12,.08,.34],Xt,"team"),Nt([.62,1.3,0],.12,.5,Ye,"head",[0,0,-.7]),St([.82,1.52,0],[.12,.12,.12],nn,"head"),Nt([.84,1.9,.18],.04,.7,Ce,"head",[.5,0,.2]),Nt([.84,1.9,-.18],.04,.7,Ce,"head",[-.5,0,.2]),Nt([.84,2.2,.4],.03,.4,bn,"head",[.9,0,.1]),Nt([.84,2.2,-.4],.03,.4,bn,"head",[-.9,0,.1]),St([.4,1,0],[.12,.1,.1],en,"glow")],crownbeast:[St([0,1.2,0],[1.1,.8,.9],Ye),St([.3,1.55,0],[.5,.45,.5],nn),Nt([.5,.55,.45],.16,1.1,re,"body"),Nt([.5,.55,-.45],.16,1.1,re,"body"),Nt([-.5,.55,.45],.16,1.1,re,"body"),Nt([-.5,.55,-.45],.16,1.1,re,"body"),St([-.8,1.45,0],[.14,.2,.7],Xt,"team"),...[0,1,2,3,4,5,6].map(i=>({t:"k",p:[.45+Math.cos(i*.9)*.28,2.05,Math.sin(i*.9)*.4],s:[.08,.5,.08],c:bn,g:"head",r:[Math.sin(i*.9)*.4,0,-Math.cos(i*.9)*.2],n:6})),St([.1,1.3,0],[.26,.26,.26],Ce,"glow"),St([.62,1.6,.18],[.07,.07,.07],en,"glow")],core_relay:[tt([0,.2,0],[4.7,.4,4.7],zt),tt([0,.7,0],[3.4,.6,3.4],Xe),tt([0,1.35,0],[2.4,.8,2.4],qe),ee([0,2.3,0],.7,1.4,Xe,"body",void 0,12),ee([0,3.2,0],.4,.6,zt),tt([1.9,.9,1.9],[.9,1.4,.9],_n),tt([-1.9,.9,1.9],[.9,1.4,.9],_n),tt([1.9,.9,-1.9],[.9,1.4,.9],_n),tt([-1.9,.9,-1.9],[.9,1.4,.9],_n),tt([0,.43,2.2],[4.7,.1,.16],Xt,"team"),tt([0,.43,-2.2],[4.7,.1,.16],Xt,"team"),tt([2.2,.43,0],[.16,.1,4.7],Xt,"team"),tt([-2.2,.43,0],[.16,.1,4.7],Xt,"team"),St([0,3.75,0],[.4,.4,.4],be,"glow"),ee([0,1.8,0],.9,.12,be,"glow"),ee([0,3.9,0],.04,1,zt,"head")],grid_pylon:[tt([0,.15,0],[1.8,.3,1.8],zt),tt([0,1,0],[.9,1.4,.9],Xe),tt([0,1.9,0],[.55,.5,.55],qe),tt([0,.34,.92],[1.8,.08,.1],Xt,"team"),tt([0,.34,-.92],[1.8,.08,.1],Xt,"team"),$e([0,2.5,0],[.34,.6,.34],be),tt([.46,1,0],[.04,1.2,.18],be,"glow"),tt([-.46,1,0],[.04,1.2,.18],be,"glow")],assembly_bay:[tt([0,.2,0],[2.9,.4,2.9],zt),tt([-.2,.95,0],[2.4,1.1,2.6],Xe),tt([.1,1.65,0],[2,.3,2.4],qe),tt([1.1,.8,0],[.12,.9,1.5],be,"glow"),tt([-.3,1.95,.6],[1.2,.2,.3],_n),tt([-.3,1.95,-.6],[1.2,.2,.3],_n),tt([0,.43,1.45],[2.9,.08,.12],Xt,"team"),tt([0,.43,-1.45],[2.9,.08,.12],Xt,"team"),tt([1.45,.43,0],[.12,.08,2.9],Xt,"team"),ee([-.9,2.3,.9],.12,.8,zt,"head"),tt([-.2,2.65,.9],[1.5,.1,.1],zt,"head")],signal_foundry:[tt([0,.2,0],[2.9,.4,2.9],zt),tt([0,.9,0],[2.1,1,2.1],Xe),tt([0,1.55,0],[1.4,.4,1.4],qe),tt([0,.43,1.45],[2.9,.08,.12],Xt,"team"),tt([0,.43,-1.45],[2.9,.08,.12],Xt,"team"),tt([1.45,.43,0],[.12,.08,2.9],Xt,"team"),ee([0,2,0],.12,1,zt),Nt([0,2.9,0],.9,.5,tc,"head",[Math.PI,0,0],14),St([0,2.95,0],[.14,.14,.14],be,"glow"),tt([.9,1,.9],[.3,1.4,.3],_n),tt([-.9,1,-.9],[.3,1.4,.3],_n)],flux_tap:[ee([0,.15,0],1.45,.3,zt,"body",void 0,12),ee([0,.9,0],.7,1.3,Xe,"body",void 0,12),ee([0,1.65,0],.5,.25,qe),tt([1.25,.34,0],[.12,.08,2.4],Xt,"team"),tt([-1.25,.34,0],[.12,.08,2.4],Xt,"team"),ee([0,1.1,0],.76,.18,be,"glow",void 0,12),$e([0,2.1,0],[.3,.6,.3],8385535),tt([.9,.7,.9],[.14,1.2,.14],zt,"body",[.25,0,-.25]),tt([-.9,.7,-.9],[.14,1.2,.14],zt,"body",[-.25,0,.25])],sentry_arc:[tt([0,.15,0],[1.8,.3,1.8],zt),ee([0,.6,0],.5,.6,Xe,"body",void 0,8),tt([0,.34,.92],[1.8,.08,.1],Xt,"team"),tt([0,.34,-.92],[1.8,.08,.1],Xt,"team"),tt([.1,1.1,0],[.8,.4,.8],qe,"head"),tt([.7,1.1,.2],[.8,.1,.1],zt,"head"),tt([.7,1.1,-.2],[.8,.1,.1],zt,"head"),tt([.5,1.28,0],[.2,.1,.3],be,"glow")],heartgrove:[St([0,.5,0],[2.4,.9,2.4],re),St([0,1.2,0],[1.7,1.1,1.7],Ye),...[0,1,2,3,4,5].map(i=>({t:"k",p:[Math.cos(i*1.047)*1.6,1.4,Math.sin(i*1.047)*1.6],s:[.5,2.2,.5],c:i%2?or:nn,g:"body",r:[Math.sin(i*1.047)*.4,0,-Math.cos(i*1.047)*.4],n:7})),ee([0,.3,2.3],.01,.01,Xt,"team"),...[0,1,2,3,4,5,6,7].map(i=>({t:"s",p:[Math.cos(i*.785)*2.3,.18,Math.sin(i*.785)*2.3],s:[.34,.12,.34],c:Xt,g:"team"})),St([0,2.1,0],[.7,.7,.7],Ce,"glow"),St([0,2.1,0],[.4,.4,.4],en,"glow"),Nt([0,3.3,0],.15,1.2,bn,"head",void 0,6)],root_node:[St([0,.3,0],[1,.4,1],re),Nt([0,1.1,0],.4,1.8,Ye,"body",void 0,8),Nt([.5,.6,.2],.14,1,nn,"body",[0,0,-.6]),Nt([-.4,.6,-.3],.14,1,nn,"body",[0,0,.6]),...[0,1,2,3].map(i=>({t:"s",p:[Math.cos(i*1.57)*.95,.14,Math.sin(i*1.57)*.95],s:[.22,.1,.22],c:Xt,g:"team"})),St([0,2.1,0],[.34,.34,.34],Ce,"glow")],brood_hollow:[St([0,.4,0],[1.8,.6,1.8],re),St([0,1,0],[1.4,1.1,1.4],Ye),St([0,1.7,0],[.9,.5,.9],nn),St([.95,.75,0],[.5,.7,.62],1382934),St([1,.75,0],[.34,.5,.42],Ce,"glow"),...[0,1,2,3,4,5].map(i=>({t:"s",p:[Math.cos(i*1.047)*1.55,.14,Math.sin(i*1.047)*1.55],s:[.3,.1,.3],c:Xt,g:"team"})),Nt([-.5,2,.4],.1,.8,bn,"head",[.3,0,.2],6),Nt([-.2,2.1,-.5],.1,.7,bn,"head",[-.3,0,-.2],6)],memory_bloom:[St([0,.3,0],[1.6,.4,1.6],re),ee([0,1.2,0],.3,2,Ye,"body",void 0,8),...[0,1,2,3,4,5,6].map(i=>({t:"k",p:[Math.cos(i*.8976)*.8,2.25,Math.sin(i*.8976)*.8],s:[.45,1.5,.12],c:i%2?or:bn,g:"head",r:[Math.sin(i*.8976)*.9,0,-Math.cos(i*.8976)*.9],n:4})),...[0,1,2,3,4,5].map(i=>({t:"s",p:[Math.cos(i*1.047)*1.5,.14,Math.sin(i*1.047)*1.5],s:[.28,.1,.28],c:Xt,g:"team"})),St([0,2.4,0],[.4,.4,.4],en,"glow")],flux_tap_v:[St([0,.25,0],[1.5,.4,1.5],re),...[0,1,2,3,4].map(i=>({t:"k",p:[Math.cos(i*1.2566)*.7,.9,Math.sin(i*1.2566)*.7],s:[.2,1.8,.2],c:i%2?Ye:nn,g:"body",r:[Math.sin(i*1.2566)*.25,0,-Math.cos(i*1.2566)*.25],n:6})),...[0,1,2,3].map(i=>({t:"s",p:[Math.cos(i*1.57)*1.4,.12,Math.sin(i*1.57)*1.4],s:[.26,.1,.26],c:Xt,g:"team"})),St([0,1.1,0],[.5,.5,.5],8385535,"glow"),$e([0,2,0],[.25,.5,.25],Ce)],needle_pod:[St([0,.3,0],[.95,.4,.95],re),St([0,.95,0],[.7,.8,.7],Ye),...[0,1,2,3,4,5,6,7].map(i=>({t:"k",p:[Math.cos(i*.785)*.55,1.45,Math.sin(i*.785)*.55],s:[.07,.8,.07],c:bn,g:"head",r:[Math.sin(i*.785)*.5,0,-Math.cos(i*.785)*.5],n:5})),...[0,1,2,3].map(i=>({t:"s",p:[Math.cos(i*1.57)*.95,.1,Math.sin(i*1.57)*.95],s:[.2,.08,.2],c:Xt,g:"team"})),St([0,1.3,0],[.2,.2,.2],en,"glow")],ore_seam:[St([0,.1,0],[1.1,.2,1.1],2765368),$e([0,.6,0],[.38,1.1,.38],4516304),$e([.5,.4,.3],[.26,.7,.26],6943968),$e([-.45,.35,-.2],[.24,.62,.24],3129262),$e([.1,.3,-.5],[.2,.5,.2],8255464)],flux_vent:[ee([0,.08,0],1.45,.16,1777702,"body",void 0,14),ee([0,.14,0],1,.1,2568249,"body",void 0,14),ee([0,.2,0],.6,.06,16747488,"glow",void 0,14),Nt([0,.5,0],.18,.7,16756972,"glow",void 0,6)],watch_pylon:[ee([0,.14,0],1,.28,zt,"body",void 0,10),tt([0,1.2,0],[.5,2.2,.5],Xe),$e([0,2.7,0],[.4,.7,.4],9431551),ee([0,.4,0],1.05,.08,Xt,"team",void 0,14),ee([0,1.6,0],.65,.05,Xt,"team",void 0,14)],salvage_pod:[St([0,.35,0],[.5,.35,.36],8221798),tt([0,.4,0],[.5,.06,.38],be,"glow"),$e([0,.9,0],[.14,.28,.14],be)],crystal_barrier:[St([0,.2,0],[1.6,.4,1.6],2765112),$e([0,1.1,0],[.7,2.2,.7],10321151),$e([.7,.8,.4],[.5,1.6,.5],8183039),$e([-.7,.7,-.3],[.5,1.4,.5],13013247),$e([.1,.6,-.8],[.4,1.2,.4],6943968),$e([-.5,.5,.7],[.36,1,.36],10321151)]};function th(i){let t;switch(i.t){case"b":t=new Sn(i.s[0],i.s[1],i.s[2]);break;case"c":t=new Ar(i.s[0],i.s[0],i.s[1],i.n??10);break;case"k":t=new Rr(i.s[0],i.s[1],i.n??8);break;case"s":t=new Co(1,12,8),t.scale(i.s[0],i.s[1],i.s[2]);break;case"o":t=new Pr(1,0),t.scale(i.s[0],i.s[1],i.s[2]);break}if(i.r){const r=new le().makeRotationFromEuler(new wn(i.r[0],i.r[1],i.r[2]));t.applyMatrix4(r)}t.translate(i.p[0],i.p[1],i.p[2]),t=t.index?t.toNonIndexed():t,t.deleteAttribute("uv");const e=t.attributes.position.count,n=new Wt(i.c),s=new Float32Array(e*3);for(let r=0;r<e;r++)s[r*3]=n.r,s[r*3+1]=n.g,s[r*3+2]=n.b;return t.setAttribute("color",new me(s,3)),t}const ec=new Map;function sg(i){const t=ec.get(i);if(t)return t;const e=Qc[i];if(!e)throw new Error("no model "+i);const n={body:[],head:[],glow:[],team:[]};let s=0;for(const o of e)n[o.g].push(th(o)),s=Math.max(s,o.p[1]+o.s[1]*.5);const r=o=>o.length?Jc(o,!1):null,a={body:r(n.body),head:r(n.head),glow:r(n.glow),team:r(n.team),height:s};return ec.set(i,a),a}function rg(i){const t=Qc[i];return Jc(t.map(th),!1)}const ag=`
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1.0,0.0)), f.x), mix(h21(i+vec2(0.0,1.0)), h21(i+vec2(1.0,1.0)), f.x), f.y); }
`,og=`
        {
          vec2 wp = vFogUv * uMapSize;
          float n1 = vn(wp * 0.7), n2 = vn(wp * 2.9), n3 = vn(wp * 9.0);
          diffuseColor.rgb *= 0.78 + 0.36 * n1 + 0.14 * (n2 - 0.5) + 0.08 * (n3 - 0.5);
          vec2 g = abs(fract(wp * 0.25) - 0.5);
          float pl = smoothstep(0.455, 0.5, max(g.x, g.y));
          diffuseColor.rgb *= 1.0 - 0.16 * pl;
          float sn = vn(wp * 0.075 + vec2(n1 * 0.9, 0.0));
          float seam = smoothstep(0.022, 0.0, abs(sn - 0.5));
          float flatness = smoothstep(0.5, 0.9, normalize(vNormal).y);
          totalEmissiveRadiance += vec3(0.08, 0.85, 0.72) * seam * 0.55 * flatness;
        }`;function Ts(i,t,e=!1){i.onBeforeCompile=n=>{n.uniforms.uFogTex=t.uFogTex,n.uniforms.uMapSize=t.uMapSize,n.uniforms.uFogOn=t.uFogOn,n.vertexShader=n.vertexShader.replace("#include <common>",`#include <common>
varying vec2 vFogUv;
uniform float uMapSize;`).replace("#include <project_vertex>",`#include <project_vertex>
        vec4 fwp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          fwp = instanceMatrix * fwp;
        #endif
        fwp = modelMatrix * fwp;
        vFogUv = fwp.xz / uMapSize;`),n.fragmentShader=n.fragmentShader.replace("#include <common>",`#include <common>
varying vec2 vFogUv;
uniform sampler2D uFogTex;
uniform float uFogOn;
uniform float uMapSize;`+(e?ag:"")).replace("#include <emissivemap_fragment>","#include <emissivemap_fragment>"+(e?og:"")).replace("#include <dithering_fragment>",`
        if (uFogOn > 0.5) {
          float fv = texture2D(uFogTex, vFogUv).r;
          vec3 col = gl_FragColor.rgb;
          float lum = dot(col, vec3(0.299, 0.587, 0.114));
          vec3 explored = mix(vec3(lum), col, 0.3) * vec3(0.46, 0.5, 0.58);
          vec3 unseen = vec3(0.012, 0.016, 0.026);
          vec3 c = mix(unseen, explored, smoothstep(0.02, 0.45, fv));
          c = mix(c, col, smoothstep(0.55, 0.95, fv));
          gl_FragColor.rgb = c;
        }
        #include <dithering_fragment>`)},i.customProgramCacheKey=()=>e?"fogpatched-detail":"fogpatched"}function Me(i,t){let e=i*374761393+t*668265263|0;return e=(e^e>>>13)*1274126177,e^=e>>>16,(e>>>0)%1e5/1e5}function As(i,t){const e=Math.floor(i),n=Math.floor(t),s=i-e,r=t-n,a=s*s*(3-2*s),o=r*r*(3-2*r),l=Me(e,n),c=Me(e+1,n),u=Me(e,n+1),f=Me(e+1,n+1);return l+(c-l)*a+(u-l)*o+(l-c-u+f)*a*o}const lg=(i,t)=>As(i,t)*.55+As(i*2.1,t*2.1)*.3+As(i*4.3,t*4.3)*.15;class cg{constructor(t){this.map=t;const e=t.size;this.n=e,this.fogData=new Uint8Array(e*e),this.fogDisp=new Float32Array(e*e),this.fogTex=new ao(this.fogData,e,e,wr,Pn),this.fogTex.minFilter=dn,this.fogTex.magFilter=dn,this.fogTex.wrapS=this.fogTex.wrapT=ei,this.fogTex.needsUpdate=!0,this.uniforms={uFogTex:{value:this.fogTex},uMapSize:{value:e},uFogOn:{value:1}};const n=this.buildGeometry(),s=new br({vertexColors:!0,roughness:.92,metalness:.02});Ts(s,this.uniforms,!0),this.mesh=new xe(n,s),this.mesh.receiveShadow=!0,this.group.add(this.mesh);const r=this.buildSurfaceTexture(),a=new rn({map:r,transparent:!0,opacity:.55,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2});this.debugMesh=new xe(n,a),this.debugMesh.visible=!1,this.group.add(this.debugMesh);const o=new xe(new rs(900,900),new rn({color:329482}));o.rotation.x=-Math.PI/2,o.position.set(e/2,-9,e/2),this.group.add(o),this.addScenery()}group=new Vi;fogTex;fogData;fogDisp;uniforms;debugMesh;mesh;n;decorMats=[];buildGeometry(){const t=this.map,e=t.size,n=e+1,s=new Float32Array(n*n*3),r=new Float32Array(n*n*3),a=new Float32Array(n*n*2),o=t.heightV,l=new Wt;for(let f=0;f<n;f++)for(let h=0;h<n;h++){const d=f*n+h,m=o[d];s[d*3]=h,s[d*3+1]=m,s[d*3+2]=f,a[d*2]=h/e,a[d*2+1]=f/e;const x=o[f*n+Math.max(0,h-1)],g=o[f*n+Math.min(e,h+1)],p=o[Math.max(0,f-1)*n+h],_=o[Math.min(e,f+1)*n+h],y=Math.hypot(g-x,_-p)/2,v=Math.min(e-1,h),A=Math.min(e-1,f),R=t.surface[A*e+v],w=lg(h*.11,f*.11),E=As(h*.9,f*.9),M=Math.min(1,Math.max(0,m/3));let b,P,D;if(m<-3.2){const N=Math.min(1,(-m-3.2)/3.4);b=.04*(1-N)+.01,P=.07*(1-N)+.02+.03*w,D=.1*(1-N)+.04+.05*w}else if(m<-.4){const N=Math.min(1,(-m-.4)/2.6);b=.13-.08*N,P=.24-.12*N,D=.26-.1*N,b*=.85+w*.3,P*=.85+w*.3,D*=.85+w*.3}else{const N=M*M*(3-2*M),$=.26+.1*w+.03*E,j=.3+.1*w+.03*E,X=.36+.11*w+.03*E,q=.56+.12*w-.03*E,G=.56+.1*w-.03*E,nt=.5+.09*w;if(b=$+(q-$)*N,P=j+(G-j)*N,D=X+(nt-X)*N,m>4&&(b=.13+.06*w+.03*E,P=.14+.06*w,D=.18+.07*w),y>.4){const B=Math.min(1,(y-.4)*1.6);b+=(.17+.05*E-b)*B,P+=(.16+.04*E-P)*B,D+=(.19+.05*E-D)*B}const ut=Math.abs(As(h*.07+w*2.5,f*.07)-.5);if(ut<.012&&m>-.5&&m<4){const B=.55*(1-ut/.012);b+=(.1-b)*B,P+=(.78-P)*B,D+=(.68-D)*B}R===3&&(b=b*.5+.04,P=P*.5+.12,D=D*.5+.1),R===5&&(b*=1.12,P*=1.12,D*=1.08)}l.setRGB(Math.min(1,b),Math.min(1,P),Math.min(1,D),Be),r[d*3]=l.r,r[d*3+1]=l.g,r[d*3+2]=l.b}const c=[];for(let f=0;f<e;f++)for(let h=0;h<e;h++){const d=f*n+h,m=d+1,x=d+n,g=x+1;c.push(d,x,m,m,x,g)}const u=new Re;return u.setAttribute("position",new me(s,3)),u.setAttribute("color",new me(r,3)),u.setAttribute("uv",new me(a,2)),u.setIndex(c),u.computeVertexNormals(),u}buildSurfaceTexture(){const t=this.n,e=new Uint8Array(t*t*4);for(let s=0;s<t*t;s++){const r=this.map.surface[s],a=r===1?[230,70,70,200]:r===2?[70,110,255,200]:r===3?[70,220,110,170]:r===4?[255,220,70,180]:r===5?[255,150,60,150]:[60,255,255,25];e[s*4]=a[0],e[s*4+1]=a[1],e[s*4+2]=a[2],e[s*4+3]=a[3]}const n=new ao(e,t,t,fn);return n.magFilter=He,n.minFilter=He,n.colorSpace=Be,n.needsUpdate=!0,n}addScenery(){const t=this.map,e=t.size,n=new we,s=(h,d=0,m=0)=>{const x=new br({color:h,roughness:.7,metalness:.05,emissive:d,emissiveIntensity:m,flatShading:!0});return Ts(x,this.uniforms),this.decorMats.push(x),x},r=[],a=[];for(let h=2;h<e-2;h+=2)for(let d=2;d<e-2;d+=2){const m=h*e+d,x=Me(d,h),g=t.heightC[m];if(t.blocked[m]&&g>4&&x<.55){n.position.set(d+x,g+.2,h+Me(h,d));const p=.8+Me(d+7,h)*1.4;n.scale.set(p,p*(.7+x),p),n.rotation.set(x*6,x*9,x*3),n.updateMatrix(),r.push(n.matrix.clone())}if((t.chasm[m]&&x<.05||t.blocked[m]&&g>4&&x>.93)&&Me(d,h+99)<.9){const p=t.chasm[m],_=1+Math.floor(Me(d+3,h)*3);for(let y=0;y<_;y++){n.position.set(d+Me(d,h+y)*2,p?t.heightC[m]+.5:g+.6,h+Me(d+y,h)*2);const v=.5+Me(d+y,h+y)*.9;n.scale.set(v*.5,v*(1.2+Me(y,d)),v*.5),n.rotation.set((Me(y,h)-.5)*.7,Me(d,y)*6,(Me(h,y)-.5)*.7),n.updateMatrix();const A=new Wt().setHSL(Me(d,h)>.5?.47:.74,.7,.6);a.push({m:n.matrix.clone(),c:A})}}}if(r.length){const h=new Es(new Ro(1,0),s(2764600),r.length);r.forEach((d,m)=>h.setMatrixAt(m,d)),h.castShadow=!0,h.receiveShadow=!0,this.group.add(h)}if(a.length){const h=s(16777215,2787968,.5),d=new Es(new Pr(1,0),h,a.length);a.forEach((m,x)=>{d.setMatrixAt(x,m.m),d.setColorAt(x,m.c)}),this.group.add(d)}const o=[];for(let h=2;h<e-2;h++)for(let d=2;d<e-2;d++){const m=h*e+d;if(t.brush[m])for(let x=0;x<2;x++){const g=Me(d*3+x,h),p=Me(d,h*3+x);n.position.set(d+g,t.heightC[m],h+p);const _=.55+Me(d+x,h+5)*.55;n.scale.set(_,.9+Me(h,d+x)*.9,_),n.rotation.set(0,g*6,0),n.updateMatrix(),o.push(n.matrix.clone())}}if(o.length){const h=s(3103308,1847126,.35),d=new Es(new Rr(.55,1.6,5),h,o.length);o.forEach((m,x)=>d.setMatrixAt(x,m)),d.receiveShadow=!0,this.group.add(d)}const l=new Uint8Array(e*e),c=s(5857901),u=s(2501426),f=new rn({color:16757575});Ts(f,this.uniforms);for(let h=0;h<e;h++)for(let d=0;d<e;d++){const m=h*e+d;if(!t.bridge[m]||l[m])continue;let x=d,g=h;for(;x+1<e&&t.bridge[h*e+x+1];)x++;for(;g+1<e&&t.bridge[(g+1)*e+d];)g++;for(let R=h;R<=g;R++)for(let w=d;w<=x;w++)l[R*e+w]=1;const p=x-d+1,_=g-h+1,y=d+p/2,v=h+_/2,A=new xe(new Sn(p,.3,_),c);A.position.set(y,.1,v),A.receiveShadow=!0,A.castShadow=!0,this.group.add(A);for(const R of[-1,1]){const w=new xe(new Sn(p,.22,.2),u);w.position.set(y,.45,v+R*(_/2-.1)),w.castShadow=!0,this.group.add(w);const E=new xe(new Sn(p-.4,.04,.08),f);E.position.set(y,.27,v+R*(_/2-.45)),this.group.add(E)}for(let R=0;R<=p;R+=4){const w=new xe(new Sn(.5,8,_*.5),u);w.position.set(d+R,-4,v),this.group.add(w)}}}updateFog(t,e,n,s){const r=this.n,a=Math.min(1,s*9);for(let o=0;o<r*r;o++){const l=n||t[o]===Fe?1:e[o]?.5:0,c=this.fogDisp[o],u=c+(l-c)*a;this.fogDisp[o]=Math.abs(u-l)<.01?l:u,this.fogData[o]=this.fogDisp[o]*255|0}this.fogTex.needsUpdate=!0}setFogEnabled(t){this.uniforms.uFogOn.value=t?1:0}}const Tn=5e3;class hg{group=new Vi;pos=new Float32Array(Tn*3);col=new Float32Array(Tn*3);siz=new Float32Array(Tn);vel=new Float32Array(Tn*3);life=new Float32Array(Tn);maxLife=new Float32Array(Tn);grav=new Float32Array(Tn);base=new Float32Array(Tn);alpha=new Float32Array(Tn);n=0;points;mat;beams=[];beamT=[];rings=[];ringData=[];ringGeo=new kr(.88,1,40);tmpC=new Wt;telegraphs=[];bolts;boltPos=new Float32Array(300*3);boltCol=new Float32Array(300*3);boltSiz=new Float32Array(300);boltAlpha=new Float32Array(300);reduced=!1;density=1;constructor(){const t=new Re;t.setAttribute("position",new me(this.pos,3)),t.setAttribute("color",new me(this.col,3)),t.setAttribute("size",new me(this.siz,1)),t.setAttribute("alpha",new me(this.alpha,1)),this.mat=new Vn({uniforms:{uPx:{value:600}},vertexShader:`attribute float size; attribute float alpha; attribute vec3 color; varying vec3 vC; varying float vA; uniform float uPx;
        void main(){ vC=color; vA=alpha; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=max(1.0,size*uPx/-mv.z); gl_Position=projectionMatrix*mv; }`,fragmentShader:"varying vec3 vC; varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d)*2.0; float a=smoothstep(1.0,0.0,r); gl_FragColor=vec4(vC*(1.0+a),a*vA); }",transparent:!0,depthWrite:!1,blending:ws}),this.points=new lo(t,this.mat),this.points.frustumCulled=!1,this.group.add(this.points);const e=new Re;e.setAttribute("position",new me(this.boltPos,3)),e.setAttribute("color",new me(this.boltCol,3)),e.setAttribute("size",new me(this.boltSiz,1)),e.setAttribute("alpha",new me(this.boltAlpha,1)),this.bolts=new lo(e,this.mat),this.bolts.frustumCulled=!1,this.group.add(this.bolts);const n=new Sn(1,1,1);for(let s=0;s<24;s++){const r=new xe(n,new rn({color:16777215,transparent:!0,blending:ws,depthWrite:!1}));r.visible=!1,this.beams.push(r),this.beamT.push(0),this.group.add(r)}for(let s=0;s<40;s++){const r=new xe(this.ringGeo,new rn({color:16777215,transparent:!0,blending:ws,depthWrite:!1,side:sn}));r.rotation.x=-Math.PI/2,r.visible=!1,this.rings.push(r),this.ringData.push({t:0,dur:1,r0:1,r1:1,active:!1}),this.group.add(r)}for(let s=0;s<12;s++){const r=new xe(new Ao(1,36),new rn({color:16777215,transparent:!0,opacity:.25,depthWrite:!1,side:sn}));r.rotation.x=-Math.PI/2,r.visible=!1,this.telegraphs.push(r),this.group.add(r)}}setViewport(t,e){this.mat.uniforms.uPx.value=t/(2*Math.tan(e*Math.PI/360))}emit(t,e,n,s,r,a,o,l,c,u=0,f=1){if(this.n>=Tn)return;const h=this.n++;this.pos[h*3]=t,this.pos[h*3+1]=e,this.pos[h*3+2]=n,this.vel[h*3]=s,this.vel[h*3+1]=r,this.vel[h*3+2]=a,this.life[h]=o,this.maxLife[h]=o,this.siz[h]=l,this.base[h]=l,this.grav[h]=u,this.alpha[h]=f,this.tmpC.setHex(c),this.col[h*3]=this.tmpC.r,this.col[h*3+1]=this.tmpC.g,this.col[h*3+2]=this.tmpC.b}burst(t,e,n,s,r,a,o,l,c=3){s=Math.max(1,Math.round(s*this.density));for(let u=0;u<s;u++){const f=Math.random()*Math.PI*2,h=Math.random()*1.2-.2,d=a*(.4+Math.random()*.8);this.emit(t,e,n,Math.cos(f)*d,Math.max(.1,h)*d,Math.sin(f)*d,o*(.6+Math.random()*.6),l*(.7+Math.random()*.6),r,c)}}flash(t,e,n,s,r){this.emit(t,e,n,0,0,0,.09,r,s,0,1)}beam(t,e,n,s,r,a,o,l,c){let u=this.beamT.findIndex(g=>g<=0);u<0&&(u=0);const f=this.beams[u],h=s-t,d=r-e,m=a-n,x=Math.hypot(h,d,m);f.position.set((t+s)/2,(e+r)/2,(n+a)/2),f.scale.set(x,l,l),f.quaternion.setFromUnitVectors(new O(1,0,0),new O(h/x,d/x,m/x)),f.material.color.setHex(o),f.visible=!0,this.beamT[u]=c,f.dur=c}ring(t,e,n,s,r,a,o){let l=this.ringData.findIndex(f=>!f.active);l<0&&(l=0);const c=this.ringData[l];c.t=0,c.dur=a,c.r0=s,c.r1=r,c.active=!0;const u=this.rings[l];u.position.set(t,e+.08,n),u.material.color.setHex(o),u.visible=!0,u.scale.set(s,s,1)}setTelegraphs(t){for(let e=0;e<this.telegraphs.length;e++){const n=this.telegraphs[e],s=t[e];if(!s){n.visible=!1;continue}n.visible=!0,n.position.set(s.x,s.y+.1,s.z),n.scale.set(s.r,s.r,1);const r=n.material;r.color.setHex(s.color),r.opacity=.12+.3*s.fill}}setBolts(t){const e=Math.min(300,t.length);for(let s=0;s<e;s++){const r=t[s];this.boltPos[s*3]=r.x,this.boltPos[s*3+1]=r.y,this.boltPos[s*3+2]=r.z,this.tmpC.setHex(r.color),this.boltCol[s*3]=this.tmpC.r,this.boltCol[s*3+1]=this.tmpC.g,this.boltCol[s*3+2]=this.tmpC.b,this.boltSiz[s]=r.size,this.boltAlpha[s]=1}for(let s=e;s<300;s++)this.boltSiz[s]=0,this.boltAlpha[s]=0,this.boltPos[s*3+1]=-50;const n=this.bolts.geometry;n.attributes.position.needsUpdate=!0,n.attributes.color.needsUpdate=!0,n.attributes.size.needsUpdate=!0,n.attributes.alpha.needsUpdate=!0}update(t){let e=0;for(let s=0;s<this.n;s++){const r=this.life[s]-t;if(r<=0)continue;const a=e++;if(a!==s){for(let l=0;l<3;l++)this.pos[a*3+l]=this.pos[s*3+l],this.vel[a*3+l]=this.vel[s*3+l],this.col[a*3+l]=this.col[s*3+l];this.siz[a]=this.siz[s],this.maxLife[a]=this.maxLife[s],this.grav[a]=this.grav[s],this.base[a]=this.base[s],this.alpha[a]=this.alpha[s]}this.life[a]=r,this.vel[a*3+1]-=this.grav[a]*t,this.pos[a*3]+=this.vel[a*3]*t,this.pos[a*3+1]+=this.vel[a*3+1]*t,this.pos[a*3+2]+=this.vel[a*3+2]*t,this.pos[a*3+1]<0&&this.grav[a]>0&&(this.pos[a*3+1]=0,this.vel[a*3+1]*=-.3);const o=r/this.maxLife[a];this.siz[a]=this.base[a]*(.35+.65*o),this.alpha[a]=Math.min(1,o*2)}for(let s=e;s<this.n;s++)this.siz[s]=0;this.n=e;const n=this.points.geometry;for(const s of["position","color","size","alpha"])n.attributes[s].needsUpdate=!0;n.setDrawRange(0,Math.max(e,1));for(let s=0;s<this.beams.length;s++)if(this.beamT[s]>0){this.beamT[s]-=t;const r=this.beams[s],a=r.dur??.1;r.material.opacity=Math.max(0,this.beamT[s]/a),this.beamT[s]<=0&&(r.visible=!1)}for(let s=0;s<this.rings.length;s++){const r=this.ringData[s];if(!r.active)continue;r.t+=t;const a=r.t/r.dur,o=this.rings[s];if(a>=1){r.active=!1,o.visible=!1;continue}const l=r.r0+(r.r1-r.r0)*(1-(1-a)*(1-a));o.scale.set(l,l,1),o.material.opacity=(1-a)*.9}}}const nc={default:[3844351,16738877],deuter:[2785279,16765498],tritan:[16732120,4579466]},Ne=new we,ic=new Wt,sc=new Wt(.5,.55,.62);class ug{constructor(t,e,n){this.container=t,this.sim=e,this.settings=n,this.renderer=new qm({antialias:n.antialias,powerPreference:"high-performance",preserveDrawingBuffer:!1}),this.renderer.outputColorSpace=Be,this.renderer.toneMapping=_c,this.renderer.toneMappingExposure=1.3,this.renderer.setClearColor(395276),this.renderer.domElement.style.cssText="position:absolute;inset:0;width:100%;height:100%;display:block;outline:none",this.renderer.domElement.tabIndex=0,t.appendChild(this.renderer.domElement),this.overlay=document.createElement("canvas"),this.overlay.style.cssText="position:absolute;inset:0;width:100%;height:100%;pointer-events:none",t.appendChild(this.overlay),this.ctx=this.overlay.getContext("2d"),this.cam=new ig(e.map),this.scene.background=new Wt(395276);const s=new Km(11125728,4865334,1.05);this.scene.add(s),this.sun=new Qm(16769464,2.6),this.sun.position.set(-40,70,30),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048),this.sun.shadow.camera.left=-55,this.sun.shadow.camera.right=55,this.sun.shadow.camera.top=55,this.sun.shadow.camera.bottom=-55,this.sun.shadow.camera.near=10,this.sun.shadow.camera.far=220,this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.05,this.scene.add(this.sun),this.scene.add(this.sun.target),this.terrain=new cg(e.map),this.scene.add(this.terrain.group),this.scene.add(this.vfx.group);const r=this.terrain.uniforms,a=new br({vertexColors:!0,roughness:.55,metalness:.25,flatShading:!0}),o=new br({vertexColors:!0,roughness:.55,metalness:.25,flatShading:!0}),l=new rn({vertexColors:!0}),c=new rn({color:16777215});for(const x of[a,o,l,c])Ts(x,r);this.mats={body:a,head:o,glow:l,team:c};const u=new kr(.78,1,28);u.rotateX(-Math.PI/2);const f=new rn({transparent:!0,opacity:.9,depthWrite:!1,side:sn});Ts(f,r),this.rings=new Es(u,f,800),this.rings.instanceColor=new _r(new Float32Array(800*3),3),this.rings.frustumCulled=!1,this.rings.count=0,this.scene.add(this.rings),this.footprint=new xe(new rs(1,1),new rn({color:4259728,transparent:!0,opacity:.35,depthWrite:!1,side:sn})),this.footprint.rotation.x=-Math.PI/2,this.footprint.visible=!1,this.scene.add(this.footprint);const h=new Re,d=new Float32Array(160*3);for(let x=0;x<160;x++)d[x*3]=Math.random()*60-30,d[x*3+1]=Math.random()*14,d[x*3+2]=Math.random()*60-30;h.setAttribute("position",new me(d,3)),this.dust=new lo(h,new jc({color:13621472,size:.09,transparent:!0,opacity:.35,depthWrite:!1})),this.dust.frustumCulled=!1,this.scene.add(this.dust);const m=this.renderer.domElement;m.addEventListener("webglcontextlost",x=>{x.preventDefault(),this.lost=!0}),m.addEventListener("webglcontextrestored",()=>{this.lost=!1}),this.applySettings(n),this.resize()}renderer;scene=new Ym;cam;terrain;vfx=new hg;overlay;ctx;batches=new Map;mats;sun;corpses=[];ghosts=new Map;phase=new Float32Array(2048);roll=new Float32Array(2048);headYaw=new Float32Array(2048);clock=0;fogTimer=0;w=1;h=1;placementMesh=null;placementCache=new Map;footprint;pulsePool=[];teamHex=nc.default;dust;rings;ringCount=0;lost=!1;tmpP={x:0,y:0,z:0};lastSettingsKey="";drawCalls=0;triangles=0;applySettings(t){this.settings=t;const e=JSON.stringify([t.quality,t.renderScale,t.shadows,t.palette,t.effects]);if(this.teamHex=nc[t.palette],this.vfx.reduced=t.reducedMotion,this.vfx.density=t.quality==="low"?.4:t.quality==="medium"?.75:1,this.vfx.density*=Math.max(.2,t.effects),this.terrain.debugMesh.visible=t.debugSurfaces,this.cam.allowRotate=t.rotateCamera,e===this.lastSettingsKey)return;this.lastSettingsKey=e;const n=t.shadows&&t.quality!=="low";this.renderer.shadowMap.enabled=n,this.renderer.shadowMap.type=t.quality==="high"?yc:go,this.sun.castShadow=n;const s=t.quality==="high"?2048:1024;this.sun.shadow.mapSize.x!==s&&(this.sun.shadow.mapSize.set(s,s),this.sun.shadow.map?.dispose(),this.sun.shadow.map=null),this.scene.traverse(r=>{const a=r.material;a&&(a.needsUpdate=!0)}),this.resize()}resize(){const t=this.container.getBoundingClientRect(),e=Math.max(2,Math.floor(t.width)),n=Math.max(2,Math.floor(t.height));this.w=e,this.h=n;const s=this.settings.quality==="high"?2:this.settings.quality==="medium"?1.5:1,r=Math.min(window.devicePixelRatio||1,s)*this.settings.renderScale;this.renderer.setPixelRatio(r),this.renderer.setSize(e,n,!1),this.cam.resize(e,n);const a=Math.min(window.devicePixelRatio||1,2);this.overlay.width=Math.floor(e*a),this.overlay.height=Math.floor(n*a),this.ctx.setTransform(a,0,0,a,0,0),this.vfx.setViewport(n*r,Zc)}getGhosts(){return[...this.ghosts.values()]}batch(t){let e=this.batches.get(t);if(e)return e;const n=F[t],s=sg(n.def.model),r=n.isUnit?360:n.isStruct?100:160,a={},o=(l,c,u,f)=>{if(!l)return;const h=new Es(l,c,r);h.frustumCulled=!1,h.castShadow=f,h.receiveShadow=f,h.count=0,h.instanceMatrix.setUsage(Zo),u==="team"&&(h.instanceColor=new _r(new Float32Array(r*3),3),h.instanceColor.setUsage(Zo)),this.scene.add(h),a[u]=h};return o(s.body,this.mats.body,"body",!0),o(s.head,this.mats.head,"head",!0),o(s.glow,this.mats.glow,"glow",!1),o(s.team,this.mats.team,"team",!1),e={td:n,model:s,meshes:a,count:0,cap:r},this.batches.set(t,e),e}ensureArrays(t){if(this.phase.length>=t)return;const e=Math.max(t,this.phase.length*2),n=s=>{const r=new Float32Array(e);return r.set(s),r};this.phase=n(this.phase),this.roll=n(this.roll),this.headYaw=n(this.headYaw)}teamColor(t,e=-1){const n=t>=0?t:e;return n<0?ic.setRGB(.78,.8,.85):ic.setHex(this.teamHex[n])}addInstance(t,e,n,s,r,a,o,l,c,u,f,h,d){if(t.count>=t.cap)return;const m=t.count++;Ne.position.set(e,n,s),Ne.rotation.order="YZX",Ne.rotation.set(o,-r,a),Ne.scale.set(l,c,u),Ne.updateMatrix();const x=t.meshes;if(x.body&&x.body.setMatrixAt(m,Ne.matrix),x.glow&&x.glow.setMatrixAt(m,Ne.matrix),x.team){x.team.setMatrixAt(m,Ne.matrix);const g=d?sc:h;x.team.instanceColor.setXYZ(m,g.r,g.g,g.b)}x.head&&(Ne.rotation.set(o,-f,a),Ne.updateMatrix(),x.head.setMatrixAt(m,Ne.matrix))}visibleAt(t,e,n,s){return t.player<0||!t.fogEnabled?!0:e.players[t.player].vis[e.cellIdx(n,s)]===Fe}weaponColor(t){switch(t){case"rifle":return 16765562;case"lance":return 11464959;case"mortar":return 16752704;case"spore":return 11992970;case"thorn":return 15335344;case"claw":return 16777215;case"stag":return 13671423;case"arc":return 16769162;case"needle":return 14858495;case"beast":return 16766719;case"weld":return 10223584;case"heal":return 8257456;default:return 16777215}}handleEvents(t,e,n){const s=this.vfx,r=this.settings.effects;for(const a of e)if(a.k==="shot"){if(!this.visibleAt(n,t,a.x,a.y)&&!this.visibleAt(n,t,a.tx??a.x,a.ty??a.y))continue;const o=this.weaponColor(a.vis),l=Ft(t.map,a.x,a.y),c=Ft(t.map,a.tx??a.x,a.ty??a.y),f=(F[a.a??0].isStruct?1.4:F[a.a??0].def.id==="mortar_crawler"?1.2:.95)+l,h=(a.tx??a.x)-a.x,d=(a.ty??a.y)-a.y,m=Math.hypot(h,d)||1,x=a.x+h/m*.7,g=a.y+d/m*.7;if(s.flash(x,f,g,o,a.vis==="mortar"?1.4:.6),(a.vis==="mortar"||a.vis==="stag")&&s.burst(x,f,g,8,13421772,1.4,.5,.5,-.3),a.b===0){const p=a.vis==="lance"?.22:a.vis==="claw"||a.vis==="thorn"||a.vis==="beast"?0:.07;p>0&&s.beam(x,f,g,a.tx??a.x,c+.8,a.ty??a.y,o,p,a.vis==="lance"?.16:.08)}}else if(a.k==="hit"){if(!this.visibleAt(n,t,a.x,a.y))continue;const o=Ft(t.map,a.x,a.y),l=(a.a??0)>25;s.burst(a.x,o+.8,a.y,l?9:4,a.b?16764816:16773568,l?3.4:2.2,.35,l?.5:.3,5),a.b&&s.burst(a.x+(Math.random()-.5),o+.6,a.y+(Math.random()-.5),2,9079434,.8,.8,.9,-.5)}else if(a.k==="death"){if(!this.visibleAt(n,t,a.x,a.y)&&a.owner!==n.player)continue;const o=F[a.a??0],l=Ft(t.map,a.x,a.y),c=o.def.faction==="verdant",u=c?12096767:16757575;if(o.isNeutral){o.def.id==="crystal_barrier"&&(s.burst(a.x,l+1,a.y,40,10321151,5,.9,.7,6),s.ring(a.x,l,a.y,.5,4,.6,10321151));continue}if(a.text==="cancel")continue;o.isStruct?(s.burst(a.x,l+1.2,a.y,46,u,5.5,.9,1,5),s.burst(a.x,l+.8,a.y,16,7829367,2.5,1.4,1.6,-.6),s.ring(a.x,l,a.y,.5,o.w*1.4,.7,u),this.corpses.push({def:a.a??0,x:a.x,z:a.y,y:l,face:a.b??0,t0:this.clock,dur:1.2,team:a.owner,scale:1})):(s.burst(a.x,l+.6,a.y,o.def.hp>200?26:12,u,o.def.hp>200?4:2.6,.7,o.def.hp>200?.8:.5,5),this.corpses.push({def:a.a??0,x:a.x,z:a.y,y:l,face:a.b??0,t0:this.clock,dur:c?1:.6,team:a.owner,scale:1}))}else if(a.k==="erupt"){if(!this.visibleAt(n,t,a.x,a.y))continue;const o=Ft(t.map,a.x,a.y),l=a.a??2;a.vis==="eruption"?(s.burst(a.x,o+.3,a.y,34,13671423,4.5,.8,.9,6),s.ring(a.x,o,a.y,.3,l*1.15,.45,14264063)):(s.burst(a.x,o+.4,a.y,26,16752704,4.5,.7,.9,6),s.ring(a.x,o,a.y,.3,l*1.15,.4,16760944),s.flash(a.x,o+.6,a.y,16767392,2.4)),!this.settings.reducedMotion&&l>=2&&(this.shake=Math.max(this.shake,1*Math.min(1,r)))}else if(a.k==="weld"){if(!this.visibleAt(n,t,a.x,a.y))continue;s.beam(a.x,Ft(t.map,a.x,a.y)+1,a.y,a.tx??a.x,Ft(t.map,a.tx??a.x,a.ty??a.y)+.8,a.ty??a.y,this.weaponColor(a.vis==="heal"?"heal":"weld"),.1,.22)}else if(a.k==="ability"){if(!this.visibleAt(n,t,a.x,a.y))continue;const o=Ft(t.map,a.x,a.y);s.ring(a.x,o,a.y,.3,2.2,.5,14264063),s.burst(a.x,o+.5,a.y,18,14264063,2.5,.6,.5,-.5),a.vis==="rootstep"&&a.tx!==void 0&&(s.ring(a.tx,Ft(t.map,a.tx,a.ty),a.ty,.3,2.2,.5,14264063),s.burst(a.tx,.8,a.ty,18,14264063,2.5,.6,.5,-.5))}else if(a.k==="spike"){if(!this.visibleAt(n,t,a.x,a.y))continue;s.ring(a.x,Ft(t.map,a.x,a.y),a.y,.3,8,.8,16765562)}else if(a.k==="silence"){if(!this.visibleAt(n,t,a.x,a.y))continue;s.ring(a.x,Ft(t.map,a.x,a.y),a.y,.3,a.a??3,.6,11893759)}else if(a.k==="built"||a.k==="trained"){if(!this.visibleAt(n,t,a.x,a.y))continue;const o=Ft(t.map,a.x,a.y);s.ring(a.x,o,a.y,.5,a.k==="built"?3.2:1.6,.5,this.teamHex[Math.max(0,a.owner)]),s.burst(a.x,o+.5,a.y,a.k==="built"?24:8,this.teamHex[Math.max(0,a.owner)],2.8,.6,.5,-.4)}else if(a.k==="captured"||a.k==="pod"){const o=Ft(t.map,a.x,a.y);s.ring(a.x,o,a.y,.5,5,.9,a.k==="pod"?16760909:this.teamHex[Math.max(0,a.owner)]),s.burst(a.x,o+1,a.y,22,a.k==="pod"?16760909:12121343,3,.8,.6,-.5)}else if(a.k==="depleted")s.burst(a.x,.5+Ft(t.map,a.x,a.y),a.y,14,4516304,2,.7,.5,2);else if(a.k==="placed"){const o=Ft(t.map,a.x,a.y);s.burst(a.x,o+.3,a.y,14,13621472,2,.6,.8,-.2)}}shake=0;render(t,e,n,s){if(this.lost)return;this.clock+=n;const r=t.tick;this.ensureArrays(t.cap);const a=this.cam;if(this.shake>0&&!this.settings.reducedMotion){const d=this.shake*.12;a.camera.position.x+=(Math.random()-.5)*d,a.camera.position.y+=(Math.random()-.5)*d}if(this.shake=Math.max(0,this.shake-n*5),this.sun.position.set(a.tx-40,70,a.tz+30),this.sun.target.position.set(a.tx,0,a.tz),this.sun.target.updateMatrixWorld(),this.fogTimer-=n,this.fogTimer<=0){this.fogTimer=.06;const d=s.player<0||!s.fogEnabled||t.pulseActive(),m=t.players[Math.max(0,s.player)];this.terrain.updateFog(m.vis,m.seen,d,.06)}this.terrain.setFogEnabled(s.fogEnabled&&s.player>=0);for(const d of this.batches.values())d.count=0;this.ringCount=0;const o=s.player,l=new Set,c=new Wt;for(const d of t.ids){if(!t.alive[d])continue;const m=t.type[d],x=F[m],g=t.owner[d],p=t.ext[d];let _=!0;if(o>=0&&s.fogEnabled&&g!==o&&(_=t.visibleTo(o,d)),!_)if(g>=0&&x.isStruct){const q=this.ghosts.get(d);q&&this.drawGhost(q)}else if(x.isNeutral&&(m===0||!0)){if(!(o>=0&&t.players[o].seen[t.cellIdx(t.x[d],t.y[d])]))continue}else continue;g>=0&&g!==o&&x.isStruct&&_&&this.ghosts.set(d,{id:d,def:m,x:t.x[d],y:t.y[d],owner:g,tick:t.tick,done:p.done,face:t.face[d]}),l.add(d);const y=this.batch(m);let v=t.x[d],A=t.y[d],R=t.face[d],w,E=0,M=0,b=1,P=1,D=1,N=R,$=0;if(x.isUnit){v=t.px[d]+(t.x[d]-t.px[d])*e,A=t.py[d]+(t.y[d]-t.py[d])*e,w=Ft(t.map,v,A);const q=p.moving;this.phase[d]+=n*(q?6+x.def.speed*1.6:1.5);const G=this.phase[d];let nt=q?Math.abs(Math.sin(G))*.07:Math.sin(G*.5+d)*.012;const ut=Math.max(-.35,Math.min(.35,-p.turn*1.6));this.roll[d]+=(ut-this.roll[d])*Math.min(1,n*12),M=this.roll[d]+(q?Math.sin(G)*.03:0),E=q?-.07:0;const B=r+e-p.atkTick;if(B>=0&&B<5){const z=1-B/5,K=-.18*z;v+=Math.cos(R)*K,A+=Math.sin(R)*K,b=1+.06*z,P=1-.05*z}if(p.wind>0&&(E+=.12,P=1.05),x.isWorker&&p.wph===1&&(nt=Math.abs(Math.sin(G*3))*.12,E=-.25),x.isWorker&&p.orders[0]&&(p.orders[0].k===mt.Build||p.orders[0].k===mt.Resume||p.orders[0].k===mt.Repair)&&!p.moving&&(nt=Math.abs(Math.sin(G*3))*.1,E=-.2),p.mode>0&&x.def.id==="carapace_guard"){const z=Math.min(1,p.mode/10);P=1-.3*z,b=D=1+.15*z}if(p.mode>0&&x.def.id==="bulwark"){const z=Math.min(1,p.mode/18);P=1-.14*z,E+=.05*z}p.chT>0&&(b=D=1+Math.sin(this.clock*30)*.06),$=nt+(x.isHover?1.5+Math.sin(this.clock*2.4+d)*.18:0);let ot=R;p.target>=0&&t.alive[p.target]&&r-p.lastAtk<40&&(ot=Math.atan2(t.y[p.target]-A,t.x[p.target]-v));let ht=ot-this.headYaw[d];for(;ht>Math.PI;)ht-=Math.PI*2;for(;ht<-Math.PI;)ht+=Math.PI*2;this.headYaw[d]+=ht*Math.min(1,n*12),N=x.def.id==="glimmerwing"||x.def.id==="tender"||x.def.id==="bloom_sage"?R+Math.sin(this.clock*8+d)*.4*(x.def.id==="glimmerwing"?1:0):this.headYaw[d],x.def.id==="glimmerwing"&&(P=1,M+=Math.sin(this.clock*14+d)*.08)}else if(w=Ft(t.map,v,A),x.isStruct){if(!p.done){const G=p.total>0?p.prog/p.total:0;P=.18+.82*G;const nt=.85+.15*Math.sin(this.clock*6);b=D=.7+.3*G*nt,$=0}if(x.def.turret){let G=t.face[d];if(p.target>=0&&t.alive[p.target]&&(G=Math.atan2(t.y[p.target]-A,t.x[p.target]-v)),x.def.weapon?.cone)N=G;else{let nt=G-this.headYaw[d];for(;nt>Math.PI;)nt-=Math.PI*2;for(;nt<-Math.PI;)nt+=Math.PI*2;this.headYaw[d]+=nt*Math.min(1,n*10),N=this.headYaw[d]}}else N=R;const q=r+e-p.atkTick;x.canAttack&&q>=0&&q<4&&(P*=1+.04*(1-q/4))}else if(x.def.id==="ore_seam"||x.def.id==="flux_vent"){const q=p.maxAmount>0?.55+.45*(p.amount/p.maxAmount):1;b=D=q,P=q,R=d*1.7%6.28}else x.def.id==="watch_pylon"&&($=0);const j=!_,X=this.teamColor(g,p.capOwner);if(x.def.id==="watch_pylon"&&p.capOwner>=0&&t.pylonContested(d)&&c.setRGB(.75,.75,.3),this.addInstance(y,v,w+$,A,R,E,M,b,P,D,N,x.def.id==="watch_pylon"&&p.capOwner>=0&&t.pylonContested(d)?c:X,j),x.isUnit&&this.ringCount<800){const q=x.def.radius*1.25+.12;Ne.position.set(v,w+.08,A),Ne.rotation.set(0,0,0),Ne.scale.set(q,1,q),Ne.updateMatrix(),this.rings.setMatrixAt(this.ringCount,Ne.matrix),this.rings.instanceColor.setXYZ(this.ringCount,X.r,X.g,X.b),this.ringCount++}}if(o>=0){const d=t.players[o];for(const[m,x]of this.ghosts)!t.alive[m]&&d.vis[t.cellIdx(x.x,x.y)]===Fe?this.ghosts.delete(m):!t.alive[m]&&r-x.tick>0&&d.vis[t.cellIdx(x.x,x.y)]===Fe&&this.ghosts.delete(m)}else this.ghosts.clear();this.corpses=this.corpses.filter(d=>this.clock-d.t0<d.dur);for(const d of this.corpses){const m=(this.clock-d.t0)/d.dur,x=this.batch(d.def),g=F[d.def],p=Math.max(.01,1-m*m),_=g.isStruct?m*1.6:m*.6;this.addInstance(x,d.x,d.y-_,d.z,d.face+m*.8,m*.5,m*.4,p,p*(1-m*.3),p,d.face,this.teamColor(d.team),!1)}this.rings.count=this.ringCount,this.rings.instanceMatrix.needsUpdate=!0,this.rings.instanceColor.needsUpdate=!0,this.drawCalls=0;for(const d of this.batches.values())for(const m of["body","head","glow","team"]){const x=d.meshes[m];x&&(x.count=d.count,x.instanceMatrix.needsUpdate=!0,x.instanceColor&&(x.instanceColor.needsUpdate=!0))}const u=[];for(const d of t.projectiles){const m=d.x+Math.cos(Math.atan2(d.ty-d.y,d.tx-d.x))*d.speed*e,x=d.y+Math.sin(Math.atan2(d.ty-d.y,d.tx-d.x))*d.speed*e;if(!this.visibleAt(s,t,m,x))continue;const g=Ft(t.map,m,x);let p=g+1,_=.5;if(d.arc){const v=Math.max(1,d.total),A=Math.min(1,(r+e-d.born)/v);p=g+1+Math.sin(A*Math.PI)*Math.min(8,2+v*.18),_=.8}const y=this.weaponColor(d.visual);u.push({x:m,y:p,z:x,color:y,size:_}),Math.random()<.8&&this.vfx.emit(m,p,x,(Math.random()-.5)*.3,(Math.random()-.5)*.3,(Math.random()-.5)*.3,.25,_*.6,y)}this.vfx.setBolts(u);const f=[];for(const d of t.effects){if(!this.visibleAt(s,t,d.x,d.y))continue;const m=Ft(t.map,d.x,d.y);if(d.kind==="erupt"){const x=Math.min(1,(r+e-d.born)/Math.max(1,d.start-d.born));f.push({x:d.x,y:m,z:d.y,r:d.r,color:this.teamHex[Math.max(0,d.owner)],fill:x})}else if(d.kind==="silence"){const x=r>=d.start;f.push({x:d.x,y:m,z:d.y,r:d.r,color:x?11893759:this.teamHex[Math.max(0,d.owner)],fill:x?.9:Math.min(1,(r-d.born)/Math.max(1,d.start-d.born))*.5})}else d.kind==="spike"&&this.vfx.emit(d.x+(Math.random()-.5)*.4,m+.5+Math.random()*2,d.y+(Math.random()-.5)*.4,0,1.2,0,.5,.5,16765562)}this.vfx.setTelegraphs(f),this.vfx.update(n);const h=this.dust.geometry.attributes.position;for(let d=0;d<h.count;d++)h.setX(d,h.getX(d)+n*.4),h.setY(d,h.getY(d)+Math.sin(this.clock+d)*n*.1),h.getX(d)>30&&h.setX(d,-30);h.needsUpdate=!0,this.dust.position.set(a.tx,0,a.tz),this.dust.visible=!this.settings.reducedMotion&&this.settings.quality!=="low",this.updatePlacement(t,s),this.renderer.render(this.scene,a.camera),this.drawCalls=this.renderer.info.render.calls,this.triangles=this.renderer.info.render.triangles,this.drawOverlay(t,s,e)}drawGhost(t){const e=this.batch(t.def),n=Ft(this.sim.map,t.x,t.y);this.addInstance(e,t.x,n,t.y,t.face,0,0,1,1,1,t.face,sc,!0)}updatePlacement(t,e){const n=e.placement;if(this.placementMesh&&(this.placementMesh.visible=!1),this.footprint.visible=!1,!n)return;let s=this.placementCache.get(n.def);if(!s){const l=rg(F[n.def].def.model);s=new xe(l,new rn({vertexColors:!0,transparent:!0,opacity:.5,depthWrite:!1})),this.scene.add(s),this.placementCache.set(n.def,s)}this.placementMesh=s;const r=n.ox+n.w/2,a=n.oy+n.h/2,o=Ft(t.map,r,a);s.visible=!0,s.position.set(r,o,a),s.rotation.y=F[n.def].def.turret?-(n.coneFace??0):0,s.material.color.setHex(n.ok?16777215:16740464),this.footprint.visible=!0,this.footprint.position.set(r,o+.12,a),this.footprint.scale.set(n.w,n.h,1),this.footprint.material.color.setHex(n.ok?4259728:16728128)}worldToScreen(t,e,n,s=this.tmpP){return this.cam.project(t,e,n,this.w,this.h,s),s}ellipse(t,e,n,s,r,a,o){const l=Ft(t.map,e,n)+.06,c=this.worldToScreen(e,l,n,{x:0,y:0,z:0}),u=this.worldToScreen(e+s,l,n,{x:0,y:0,z:0}),f=this.worldToScreen(e,l,n+s,{x:0,y:0,z:0}),h=Math.abs(u.x-c.x)+.5,d=Math.abs(f.y-c.y)+.5;if(c.z>1||c.z<-1)return;const m=this.ctx;m.beginPath(),m.ellipse(c.x,c.y,h,d,0,0,Math.PI*2),o&&(m.fillStyle=o,m.fill()),m.lineWidth=a,m.strokeStyle=r,m.stroke()}quad(t,e,n,s,r,a,o){const l=this.ctx,c=[[e,n],[e+s,n],[e+s,n+r],[e,n+r]].map(([u,f])=>this.worldToScreen(u,Ft(t.map,u,f)+.08,f,{x:0,y:0,z:0}));l.beginPath(),c.forEach((u,f)=>f?l.lineTo(u.x,u.y):l.moveTo(u.x,u.y)),l.closePath(),l.lineWidth=o,l.strokeStyle=a,l.stroke()}hex(t){return"#"+t.toString(16).padStart(6,"0")}drawOverlay(t,e,n){const s=this.ctx;s.clearRect(0,0,this.w,this.h);const r=e.player,a=this.hex(this.teamHex[Math.max(0,r)]),o=t.tick,l={x:0,y:0,z:0};for(const h of e.selection){if(!t.alive[h])continue;const d=F[t.type[h]],m=t.ext[h],x=t.owner[h],g=this.hex(this.teamHex[Math.max(0,x)]);let p=t.x[h],_=t.y[h];if(d.isUnit&&(p=t.px[h]+(t.x[h]-t.px[h])*n,_=t.py[h]+(t.y[h]-t.py[h])*n),d.isStruct||d.isNeutral?this.quad(t,m.ox-.15,m.oy-.15,m.fw+.3,m.fh+.3,g,2):this.ellipse(t,p,_,d.def.radius*1.15+.15,g,2,g+"22"),e.showOrders&&x===r&&d.isUnit){let y=p,v=_;s.lineWidth=1.2;for(const A of m.orders){const R=A.k===mt.AttackMove||A.k===mt.Attack||A.k===mt.Patrol?"#ff6a5a":A.k===mt.Gather?"#5fd7ff":A.k===mt.Build?"#ffe27a":"#7dff9a",w=this.worldToScreen(y,Ft(t.map,y,v)+.3,v,l),E=w.x,M=w.y,b=A.k===mt.Attack&&t.alive[A.t]?t.x[A.t]:A.x,P=A.k===mt.Attack&&t.alive[A.t]?t.y[A.t]:A.y,D=this.worldToScreen(b,Ft(t.map,b,P)+.3,P,l);s.strokeStyle=R+"bb",s.beginPath(),s.moveTo(E,M),s.lineTo(D.x,D.y),s.stroke(),s.fillStyle=R,s.beginPath(),s.arc(D.x,D.y,3,0,Math.PI*2),s.fill(),y=b,v=P}if(o-m.failTick<40){const A=this.worldToScreen(p,Ft(t.map,p,_)+2.2,_,l);s.fillStyle="#ff7060",s.font="bold 11px system-ui",s.textAlign="center",s.fillText("NO PATH",A.x,A.y)}if(o<m.slowUntil){const A=this.worldToScreen(p,Ft(t.map,p,_)+2,_,l);s.fillStyle="#b6ff8a",s.font="bold 10px system-ui",s.textAlign="center",s.fillText("SLOWED",A.x,A.y)}if(o<m.silUntil){const A=this.worldToScreen(p,Ft(t.map,p,_)+2,_,l);s.fillStyle="#c28bff",s.font="bold 10px system-ui",s.textAlign="center",s.fillText("SILENCED",A.x,A.y)}if(d.def.id==="bulwark"&&m.mode>0){const A=this.worldToScreen(p,Ft(t.map,p,_)+2,_,l);s.fillStyle="#ffd27a",s.font="bold 10px system-ui",s.textAlign="center",s.fillText(m.mode>=18?"BRACED":"BRACING",A.x,A.y)}if(d.def.id==="carapace_guard"&&m.mode>0){const A=this.worldToScreen(p,Ft(t.map,p,_)+2,_,l);s.fillStyle="#c9a7ff",s.font="bold 10px system-ui",s.textAlign="center",s.fillText("CURLED",A.x,A.y)}}if(d.isStruct&&m.hasRally&&x===r){const y=this.worldToScreen(t.x[h],Ft(t.map,t.x[h],t.y[h])+.5,t.y[h],l),v=y.x,A=y.y,R=this.worldToScreen(m.rallyX,Ft(t.map,m.rallyX,m.rallyY)+.3,m.rallyY,l);s.strokeStyle="#7dff9acc",s.setLineDash([5,4]),s.beginPath(),s.moveTo(v,A),s.lineTo(R.x,R.y),s.stroke(),s.setLineDash([]),s.fillStyle="#7dff9a",s.beginPath(),s.arc(R.x,R.y,4,0,Math.PI*2),s.fill()}}if(e.rangeCircle&&this.ellipse(t,e.rangeCircle.x,e.rangeCircle.y,e.rangeCircle.r,"#ffffff66",1.5),e.hover>=0&&t.alive[e.hover]&&!e.selection.has(e.hover)){const h=e.hover,d=F[t.type[h]],m=t.ext[h],g=t.owner[h]!==r&&t.owner[h]>=0?"#ff8a7a":"#ffffffcc";d.isStruct||d.isNeutral?this.quad(t,m.ox-.1,m.oy-.1,m.fw+.2,m.fh+.2,g,1.5):this.ellipse(t,t.x[h],t.y[h],d.def.radius*1.1+.1,g,1.5)}const c=e.placement;if(c){for(const d of c.fields)this.ellipse(t,d.x,d.y,d.r,"#5fd7ff44",1.2);const h=F[c.def];if(h.def.weapon&&this.ellipse(t,c.ox+c.w/2,c.oy+c.h/2,h.def.weapon.range,"#ffd27a88",1.5),h.def.turret&&h.def.weapon?.cone&&c.coneFace!==void 0){const d=c.ox+c.w/2,m=c.oy+c.h/2,x=h.def.weapon.range,g=h.def.weapon.cone;s.beginPath();const p=this.worldToScreen(d,Ft(t.map,d,m)+.2,m,{x:0,y:0,z:0});s.moveTo(p.x,p.y);for(let _=0;_<=12;_++){const y=c.coneFace-g+g*2*_/12,v=d+Math.cos(y)*x,A=m+Math.sin(y)*x,R=this.worldToScreen(v,Ft(t.map,v,A)+.2,A,{x:0,y:0,z:0});s.lineTo(R.x,R.y)}s.closePath(),s.fillStyle="#ffd27a22",s.fill(),s.strokeStyle="#ffd27acc",s.lineWidth=1.5,s.stroke()}if(!c.ok&&c.reason){const d=this.worldToScreen(c.ox+c.w/2,Ft(t.map,c.ox,c.oy)+3.4,c.oy+c.h/2,l);s.font="bold 12px system-ui",s.textAlign="center",s.fillStyle="#ff8a7a",s.fillText(c.reason,d.x,d.y)}if(h.isHall)for(const d of t.map.sites)this.ellipse(t,d.x,d.y,5.5,"#ffe27a88",1.5)}const u=(h,d,m,x,g,p,_=4)=>{s.fillStyle="rgba(8,10,14,0.85)",s.fillRect(h-m/2-1,d-1,m+2,_+2),s.fillStyle=g,s.fillRect(h-m/2,d,m*Math.max(0,Math.min(1,x)),_),s.fillStyle=p,s.fillRect(h-m/2-1,d-2,m+2,1)},f=this.settings.showStats;for(const h of t.ids){if(!t.alive[h])continue;const d=F[t.type[h]];if(d.isNeutral&&d.def.id!=="crystal_barrier")continue;const m=t.owner[h],x=e.selection.has(h),g=e.hover===h,p=t.ext[h],_=t.hp[h]/d.maxHp,y=_<.999,v=d.isStruct&&!p.done;if(d.isWorker&&p.carry>0&&m===r&&!(x||g||y)){const D=t.px[h]+(t.x[h]-t.px[h])*n,N=t.py[h]+(t.y[h]-t.py[h])*n,$=this.worldToScreen(D,Ft(t.map,D,N)+1.55,N,l);$.z<1&&(s.fillStyle=p.carryT===1?"#44e9d0":"#ff8be0",s.strokeStyle="#00000099",s.lineWidth=1,s.beginPath(),s.moveTo($.x,$.y-5),s.lineTo($.x+4,$.y),s.lineTo($.x,$.y+5),s.lineTo($.x-4,$.y),s.closePath(),s.fill(),s.stroke())}if(!(x||g||y||v||f)||r>=0&&e.fogEnabled&&m!==r&&!t.visibleTo(r,h))continue;let A=t.x[h],R=t.y[h];d.isUnit&&(A=t.px[h]+(t.x[h]-t.px[h])*n,R=t.py[h]+(t.y[h]-t.py[h])*n);const w=Ft(t.map,A,R)+(d.isStruct||d.isNeutral?p.fw>=5?4.4:p.fw>=3?3.4:2.6:(d.def.radius>.9?2.5:1.9)+(d.isHover?1.5:0)),E=this.worldToScreen(A,w,R,l);if(E.z>1||E.z<-1)continue;const M=d.isStruct||d.isNeutral?Math.max(34,this.worldToScreen(A+p.fw/2,w,R,{x:0,y:0,z:0}).x-E.x)*1.6:Math.max(24,d.def.radius*38*(42/this.cam.height)),b=this.hex(this.teamHex[Math.max(0,m)]),P=_>.6?"#5dff8a":_>.3?"#ffd24a":"#ff5a4a";v?u(E.x,E.y,M,p.total?p.prog/p.total:0,"#e8e4d0",b):(u(E.x,E.y,M,_,m<0?"#c8a0ff":P,m<0?"#9d7cff":b),d.def.shield&&p.shield>0&&u(E.x,E.y-6,M,p.shield/d.def.shield,"#6fe3ff","#6fe3ff",3)),x&&d.maxEnergy>0&&u(E.x,E.y+7,M,p.energy/d.maxEnergy,"#6a8dff","#6a8dff",3),d.isWorker&&p.carry>0&&m===r&&(s.fillStyle=p.carryT===1?"#44e9d0":"#ff8be0",s.beginPath(),s.arc(E.x+M/2+6,E.y+2,3.2,0,Math.PI*2),s.fill()),p.chT>0&&u(E.x,E.y-12,M,1-p.chT/Math.max(1,p.chTotal),"#9ae8ff","#9ae8ff",3)}if(r>=0){s.font="600 11px system-ui",s.textAlign="center";for(const h of this.ghosts.values()){if(t.alive[h.id]&&t.visibleTo(r,h.id))continue;const d=this.worldToScreen(h.x,Ft(t.map,h.x,h.y)+4.2,h.y,l);if(d.z>1)continue;const m=Math.floor(h.tick/20),x=`${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;s.fillStyle="rgba(8,10,14,0.7)",s.fillRect(d.x-34,d.y-11,68,14),s.fillStyle="#9fb0c0",s.fillText(`last seen ${x}`,d.x,d.y)}for(const h of t.ids){if(!t.alive[h]||F[t.type[h]].def.id!=="watch_pylon"||!t.players[r].seen[t.cellIdx(t.x[h],t.y[h])])continue;const d=t.ext[h].capOwner,m=this.worldToScreen(t.x[h],Ft(t.map,t.x[h],t.y[h])+4,t.y[h],l);m.z>1||(s.fillStyle=d<0?"#c8d0d8":this.hex(this.teamHex[d]),s.beginPath(),s.moveTo(m.x,m.y+6),s.lineTo(m.x-5,m.y-3),s.lineTo(m.x+5,m.y-3),s.closePath(),s.fill())}}if(e.dragBox){const h=e.dragBox;s.strokeStyle=a,s.lineWidth=1.2,s.fillStyle=a+"22",s.fillRect(Math.min(h.x0,h.x1),Math.min(h.y0,h.y1),Math.abs(h.x1-h.x0),Math.abs(h.y1-h.y0)),s.strokeRect(Math.min(h.x0,h.x1),Math.min(h.y0,h.y1),Math.abs(h.x1-h.x0),Math.abs(h.y1-h.y0))}e.statsDebug.length&&(s.font="12px ui-monospace,Consolas,monospace",s.textAlign="left",e.statsDebug.forEach((h,d)=>{s.fillStyle="rgba(0,0,0,0.6)",s.fillRect(8,78+d*15,s.measureText(h).width+8,15),s.fillStyle="#9ff",s.fillText(h,12,90+d*15)}))}dispose(){this.renderer.dispose(),this.renderer.domElement.remove(),this.overlay.remove()}}class dg{ctx=null;master;sfx;ui;music;noiseBuf=null;voices=0;lastPlay=new Map;vol={master:.8,sfx:.9,music:.5,ui:.9};muted=!1;intensity=0;targetIntensity=0;musicNodes=null;beatTimer=null;beat=0;chord=0;camX=64;camY=64;lastAlertAt=0;init(){if(this.ctx){this.ctx.resume();return}const t=window.AudioContext||window.webkitAudioContext;if(!t)return;this.ctx=new t;const e=this.ctx;this.master=e.createGain();const n=e.createDynamicsCompressor();n.threshold.value=-14,n.ratio.value=4,this.master.connect(n).connect(e.destination);const s=()=>{const o=e.createGain();return o.connect(this.master),{gain:o}};this.sfx=s(),this.ui=s(),this.music=s();const r=e.sampleRate*1;this.noiseBuf=e.createBuffer(1,r,e.sampleRate);const a=this.noiseBuf.getChannelData(0);for(let o=0;o<r;o++)a[o]=Math.random()*2-1;this.applyVolumes()}setVolumes(t,e){this.vol=t,this.muted=e,this.applyVolumes()}applyVolumes(){if(!this.ctx)return;const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.muted?0:this.vol.master,t,.03),this.sfx.gain.gain.setTargetAtTime(this.vol.sfx,t,.03),this.ui.gain.gain.setTargetAtTime(this.vol.ui,t,.03),this.music.gain.gain.setTargetAtTime(this.vol.music*.5,t,.1)}setListener(t,e){this.camX=t,this.camY=e}out(t,e,n){const s=this.ctx,r=s.createGain();r.gain.value=n;let a=r;if(Math.abs(e)>.01&&s.createStereoPanner){const o=s.createStereoPanner();o.pan.value=Math.max(-1,Math.min(1,e)),r.connect(o),a=o}return a.connect(t.gain),{node:r}}tone(t,e,n,s,r,a=0,o=0,l=0,c=0){if(!this.ctx||this.voices>28)return;const u=this.ctx,f=u.currentTime+l,h=u.createOscillator();h.type=s,h.frequency.setValueAtTime(e,f),a>0&&h.frequency.exponentialRampToValueAtTime(Math.max(20,a),f+n);const d=this.out(t,o,0);d.node.gain.setValueAtTime(1e-4,f),d.node.gain.linearRampToValueAtTime(r,f+Math.min(.01,n*.3)),d.node.gain.exponentialRampToValueAtTime(1e-4,f+n);let m=h;if(c>0){const x=u.createBiquadFilter();x.type="lowpass",x.frequency.value=c,h.connect(x),m=x}m.connect(d.node),h.start(f),h.stop(f+n+.02),this.voices++,h.onended=()=>{this.voices--}}noise(t,e,n,s,r,a=1,o=0,l=0,c=0){if(!this.ctx||!this.noiseBuf||this.voices>28)return;const u=this.ctx,f=u.currentTime+l,h=u.createBufferSource();h.buffer=this.noiseBuf,h.loop=!0;const d=u.createBiquadFilter();d.type=s,d.frequency.setValueAtTime(r,f),d.Q.value=a,c>0&&d.frequency.exponentialRampToValueAtTime(c,f+e);const m=this.out(t,o,0);m.node.gain.setValueAtTime(1e-4,f),m.node.gain.linearRampToValueAtTime(n,f+.004),m.node.gain.exponentialRampToValueAtTime(1e-4,f+e),h.connect(d).connect(m.node),h.start(f,Math.random()*.5),h.stop(f+e+.02),this.voices++,h.onended=()=>{this.voices--}}gate(t,e){const n=performance.now();return n-(this.lastPlay.get(t)??-1e9)<e?!1:(this.lastPlay.set(t,n),!0)}world(t,e,n,s="neutral"){if(!this.ctx)return;const r=e-this.camX,a=n-this.camY,o=Math.hypot(r,a);if(o>70)return;const l=Math.max(.12,1-o/70),c=Math.max(-1,Math.min(1,r/40)),u=t.startsWith("shot")?45:60;if(!this.gate(t+Math.round(e/6)+":"+Math.round(n/6),u))return;const f=.5*l,h=this.sfx;switch(t){case"shot_rifle":this.noise(h,.07,f*.7,"bandpass",2600,1.5,c),this.tone(h,260,.08,"sawtooth",f*.35,90,c,0,1800);break;case"shot_lance":this.tone(h,1900,.22,"sawtooth",f*.4,260,c,0,3200),this.noise(h,.16,f*.3,"highpass",3e3,.7,c);break;case"shot_arc":this.tone(h,700,.1,"square",f*.3,200,c),this.noise(h,.06,f*.4,"bandpass",1800,2,c);break;case"shot_mortar":this.tone(h,130,.35,"sine",f*.9,38,c),this.noise(h,.3,f*.6,"lowpass",700,.8,c,0,150);break;case"shot_spore":this.tone(h,420,.16,"sine",f*.5,880,c),this.noise(h,.12,f*.35,"bandpass",1300,3,c);break;case"shot_thorn":this.noise(h,.05,f*.55,"highpass",4200,.8,c);break;case"shot_claw":this.noise(h,.06,f*.45,"highpass",3e3,.8,c),this.tone(h,200,.05,"triangle",f*.25,120,c);break;case"shot_beast":this.tone(h,90,.2,"sawtooth",f*.6,50,c,0,500),this.noise(h,.14,f*.5,"lowpass",1e3,1,c);break;case"shot_stag":this.tone(h,70,.4,"sine",f*.8,130,c),this.noise(h,.3,f*.4,"bandpass",500,2,c);break;case"shot_needle":this.tone(h,3200,.05,"triangle",f*.3,1800,c);break;case"impact":this.noise(h,.07,f*.45,"lowpass",1800,1,c);break;case"impact_big":this.noise(h,.2,f*.8,"lowpass",900,1,c,0,200),this.tone(h,90,.2,"sine",f*.6,40,c);break;case"erupt":this.tone(h,110,.5,"sine",f*.9,30,c),this.noise(h,.45,f*.7,"lowpass",800,1,c,0,120);break;case"death":this.tone(h,320,.3,"sawtooth",f*.3,70,c,0,1200),this.noise(h,.25,f*.4,"lowpass",1400,1,c,0,300);break;case"death_struct":this.noise(h,.7,f*1,"lowpass",1100,1,c,0,120),this.tone(h,70,.7,"sine",f*.9,25,c);break;case"build":this.noise(h,.08,f*.5,"bandpass",900,2,c),this.tone(h,160,.1,"square",f*.2,90,c);break;case"heal":this.tone(h,700,.12,"sine",f*.25,1100,c);break}}ui_(t,e="neutral"){if(!this.ctx)return;const n=this.ui,s=e!=="verdant";switch(t){case"select":if(!this.gate("select",40))return;s?(this.tone(n,880,.05,"square",.1,1200),this.tone(n,1320,.04,"square",.05,0,0,.03)):(this.tone(n,660,.12,"sine",.18,990),this.noise(n,.08,.06,"bandpass",2500,4));break;case"ack":if(!this.gate("ack",50))return;s?(this.tone(n,300,.05,"square",.08,360),this.tone(n,420,.05,"square",.06,0,0,.05)):this.tone(n,380,.14,"triangle",.16,520);break;case"attackAck":if(!this.gate("ack",50))return;s?(this.tone(n,240,.08,"sawtooth",.1,180,0,0,1400),this.tone(n,360,.06,"sawtooth",.08,0,0,.07,1400)):this.tone(n,220,.16,"sawtooth",.12,300,0,0,900);break;case"error":if(!this.gate("error",150))return;this.tone(n,130,.14,"square",.12,90),this.tone(n,110,.12,"square",.08,70,0,.1);break;case"click":if(!this.gate("click",30))return;this.tone(n,1100,.025,"square",.06);break;case"queue":this.tone(n,700,.06,"triangle",.12,900);break;case"complete":this.tone(n,523,.14,"triangle",.16),this.tone(n,659,.14,"triangle",.14,0,0,.1),this.tone(n,784,.22,"triangle",.14,0,0,.2);break;case"trained":if(!this.gate("trained",200))return;this.tone(n,600,.09,"triangle",.14),this.tone(n,900,.12,"triangle",.12,0,0,.08);break;case"research":this.tone(n,784,.16,"sine",.16),this.tone(n,1175,.2,"sine",.14,0,0,.12),this.tone(n,1568,.3,"sine",.1,0,0,.24);break;case"attack":{const r=performance.now();if(r-this.lastAlertAt<4500)return;this.lastAlertAt=r,this.tone(n,440,.12,"square",.16),this.tone(n,330,.12,"square",.16,0,0,.14),this.tone(n,440,.12,"square",.16,0,0,.28),this.tone(n,330,.16,"square",.16,0,0,.42);break}case"supply":if(!this.gate("supply",5e3))return;this.tone(n,200,.12,"triangle",.18),this.tone(n,200,.12,"triangle",.18,0,0,.18);break;case"depleted":if(!this.gate("depleted",5e3))return;this.tone(n,500,.25,"sine",.14,250);break;case"ping":this.tone(n,1e3,.4,"sine",.2,700);break;case"captured":this.tone(n,392,.12,"triangle",.16),this.tone(n,587,.2,"triangle",.16,0,0,.12);break;case"pod":this.tone(n,1046,.1,"sine",.16),this.tone(n,1568,.2,"sine",.14,0,0,.08);break;case"victory":[523,659,784,1047].forEach((r,a)=>this.tone(n,r,.4,"triangle",.18,0,0,a*.16));break;case"defeat":[392,349,311,262].forEach((r,a)=>this.tone(n,r,.5,"sawtooth",.12,r*.97,0,a*.22,900));break;case"pulse":this.tone(n,300,.8,"sine",.2,900);break}}startMusic(t){if(!this.ctx||this.musicNodes)return;const e=this.ctx,n=e.createBiquadFilter();n.type="lowpass",n.frequency.value=900,n.Q.value=.7;const s=e.createGain();s.gain.value=.5;const r=e.createGain();r.gain.value=0;const a=e.createGain();a.gain.value=0,n.connect(s),s.connect(this.music.gain),r.connect(this.music.gain),a.connect(this.music.gain);const o=[],l=t==="verdant"?98:82.4;[1,1.5,2,2.01].forEach((u,f)=>{const h=e.createOscillator();h.type=f<2?"sawtooth":"triangle",h.frequency.value=l*u,h.detune.value=(f-1.5)*6;const d=e.createGain();d.gain.value=f<2?.18:.12,h.connect(d).connect(n),h.start(),o.push(h)}),this.musicNodes={pad:s,pulse:r,lead:a,oscs:o,filter:n};const c=t==="verdant"?[98,116.5,87.3,110]:[82.4,98,73.4,87.3];this.beat=0,this.beatTimer=window.setInterval(()=>{if(!this.ctx||!this.musicNodes)return;this.beat++,this.targetIntensity>this.intensity?this.intensity=Math.min(this.targetIntensity,this.intensity+.12):this.intensity=Math.max(this.targetIntensity,this.intensity-.012);const u=e.currentTime;if(this.beat%16===0){this.chord=(this.chord+1)%c.length;const h=c[this.chord];[1,1.5,2,2.01].forEach((d,m)=>o[m].frequency.setTargetAtTime(h*d,u,.8))}this.musicNodes.filter.frequency.setTargetAtTime(500+this.intensity*1800,u,.4),this.musicNodes.pad.gain.setTargetAtTime(.55-this.intensity*.15,u,.5);const f=c[this.chord];this.intensity>.2&&this.beat%2===0&&this.musicPerc(this.beat%4===0?f/2:f,.18*this.intensity,t),this.intensity>.55&&this.beat%2===1&&this.musicPerc(f*2,.1*this.intensity,t)},280)}musicPerc(t,e,n){const s=this.music;n==="verdant"?this.tone(s,t*2,.35,"sine",e*.8,t*2.3):(this.tone(s,t,.14,"triangle",e,t*.5),this.noise(s,.05,e*.4,"highpass",5e3,.5))}setIntensity(t){this.targetIntensity=Math.max(0,Math.min(1,t))}stopMusic(){if(this.beatTimer&&(clearInterval(this.beatTimer),this.beatTimer=null),this.musicNodes){for(const t of this.musicNodes.oscs)try{t.stop()}catch{}this.musicNodes=null}this.intensity=0,this.targetIntensity=0}}const _t=new dg,lr=["q","w","e","r","a","s","d","f","z","x","c","v"];class fg{constructor(t,e){this.game=t,this.el=e;const n=(s,r,a,o)=>{s.addEventListener(r,a,o),this.bound.push([s,r,a,o])};n(e,"pointerdown",s=>this.onDown(s)),n(window,"pointermove",s=>this.onMove(s)),n(window,"pointerup",s=>this.onUp(s)),n(e,"contextmenu",s=>s.preventDefault()),n(e,"wheel",s=>{this.enabled&&(s.preventDefault(),this.game.renderer.cam.zoomBy(s.deltaY))},{passive:!1}),n(e,"pointerleave",()=>{this.mouse.inside=!1}),n(e,"pointerenter",()=>{this.mouse.inside=!0}),n(window,"keydown",s=>this.onKeyDown(s)),n(window,"keyup",s=>{this.keys.delete(s.key.toLowerCase())}),n(window,"blur",()=>{this.keys.clear(),this.down=null,this.dragBox=null})}selection=[];groups=Array.from({length:10},()=>[]);mode={kind:"none"};cardMode="main";activeType=-1;hover=-1;dragBox=null;keys=new Set;mouse={x:0,y:0,inside:!1};down=null;pan=null;lastClick={t:0,id:-1};lastGroup={n:-1,t:0};g={x:0,z:0};g2={x:0,z:0};onSelectionChange=()=>{};onGroupAssigned=()=>{};onCommand=()=>{};bound=[];enabled=!0;lastAlert=null;detach(){for(const[t,e,n,s]of this.bound)t.removeEventListener(e,n,s);this.bound=[]}get sim(){return this.game.sim}get local(){return this.game.local}rect(){return this.el.getBoundingClientRect()}ground(t,e,n=this.g){const s=this.rect();return this.game.renderer.cam.groundPoint((t-s.left)/s.width*2-1,-((e-s.top)/s.height*2-1),n)}local2(t){const e=this.rect();return{x:t.clientX-e.left,y:t.clientY-e.top}}isOwned(t){return this.sim.alive[t]&&this.sim.owner[t]===this.local}ownSelected(){return this.selection.filter(t=>this.isOwned(t))}pick(t,e){const n=this.sim,s=this.game.renderer,r=this.rect(),a=t-r.left,o=e-r.top;let l=-1,c=1;const u={x:0,y:0,z:0},f={x:0,y:0,z:0};for(const g of n.ids){if(!n.alive[g])continue;const p=F[n.type[g]];if(!p.isUnit||!this.visibleForPick(g))continue;const _=Ft(n.map,n.x[g],n.y[g])+(p.isHover?1.5:0);if(s.cam.project(n.x[g],_+.6,n.y[g],r.width,r.height,u),u.z>1)continue;s.cam.project(n.x[g]+p.def.radius,_+.6,n.y[g],r.width,r.height,f);const y=Math.max(13,Math.abs(f.x-u.x)*1.35),A=Math.hypot(u.x-a,u.y-o)/y;A<c&&(c=A,l=g)}if(l>=0)return l;if(!this.ground(t,e))return-1;const h=this.g.x,d=this.g.z;let m=-1,x=1e9;for(const g of n.ids){if(!n.alive[g])continue;const p=F[n.type[g]];if(!p.isStruct&&!p.isNeutral)continue;const _=n.ext[g];if(h<_.ox-.3||h>_.ox+_.fw+.3||d<_.oy-.3-Math.min(2.2,_.fh*.5)||d>_.oy+_.fh+.3||!this.visibleForPick(g)&&!(n.players[Math.max(0,this.local)].seen[n.cellIdx(n.x[g],n.y[g])]&&n.owner[g]!==this.local))continue;const y=Math.hypot(h-n.x[g],d-n.y[g]);y<x&&(x=y,m=g)}return m}visibleForPick(t){return this.local<0||this.sim.owner[t]===this.local?!0:this.sim.visibleTo(this.local,t)}select(t,e=!1){const n=new Set(e?this.selection:[]);for(const s of t)this.sim.alive[s]&&n.add(s);this.selection=[...n],this.selection.length>1&&(this.selection=this.selection.filter(s=>this.sim.owner[s]===this.local||this.local<0)),this.activeType=-1,this.cardMode="main",this.mode={kind:"none"},this.onSelectionChange()}selectSameType(t,e){const n=this.sim,s=this.game.renderer,r=this.rect(),a=n.type[t],o=n.owner[t],l=[],c={x:0,y:0,z:0};for(const u of n.ids)!n.alive[u]||n.type[u]!==a||n.owner[u]!==o||e&&(s.cam.project(n.x[u],1,n.y[u],r.width,r.height,c),c.x<0||c.y<0||c.x>r.width||c.y>r.height||c.z>1)||l.push(u);return l}pruneSelection(){const t=this.selection.length;this.selection=this.selection.filter(e=>this.sim.alive[e]&&(this.sim.owner[e]===this.local||this.local<0||this.visibleForPick(e)||F[this.sim.type[e]].isNeutral)),this.selection.length!==t&&this.onSelectionChange()}types(){const t=[];for(const e of this.selection){const n=this.sim.type[e];t.includes(n)||t.push(n)}return t}commandIds(t=!1){const e=this.ownSelected();if(!t)return e;const n=this.types(),s=this.activeType>=0&&n.includes(this.activeType)?this.activeType:n[0];return e.filter(r=>this.sim.type[r]===s)}onDown(t){if(!this.enabled)return;this.el.setPointerCapture?.(t.pointerId);const e=this.local2(t);if(this.mouse.x=e.x,this.mouse.y=e.y,_t.init(),t.button===1){this.pan={x:t.clientX,y:t.clientY},t.preventDefault();return}if(t.button===2){if(this.mode.kind!=="none"){this.mode={kind:"none"},this.cardMode=this.cardMode==="build"?"build":"main",this.onSelectionChange();return}this.rightClick(t);return}t.button===0&&(this.down={x:t.clientX,y:t.clientY,button:0,t:performance.now(),shift:t.shiftKey})}onMove(t){const e=this.local2(t);if(this.mouse.x=e.x,this.mouse.y=e.y,this.pan){const n=this.game.renderer.cam,s=this.ground(this.pan.x,this.pan.y,this.g),r=this.ground(t.clientX,t.clientY,this.g2);s&&r&&(n.tx+=this.g.x-this.g2.x,n.tz+=this.g.z-this.g2.z,n.clamp(),n.jump=null),this.pan={x:t.clientX,y:t.clientY};return}if(this.down&&this.mode.kind==="none"){const n=t.clientX-this.down.x,s=t.clientY-this.down.y;if(Math.hypot(n,s)>6){const r=this.rect();this.dragBox={x0:this.down.x-r.left,y0:this.down.y-r.top,x1:e.x,y1:e.y}}}}onUp(t){if(t.button===1){this.pan=null;return}if(t.button!==0||!this.down)return;const e=this.down;this.down=null;const n=this.dragBox;if(this.dragBox=null,!this.enabled)return;const s=this.rect();if(!((t.clientX<s.left||t.clientX>s.right||t.clientY<s.top||t.clientY>s.bottom)&&!n)){if(n&&this.mode.kind==="none"){this.boxSelect(n,t.shiftKey||e.shift);return}this.leftClick(t)}}boxSelect(t,e){const n=this.sim,s=this.game.renderer,r=this.rect(),a=Math.min(t.x0,t.x1),o=Math.max(t.x0,t.x1),l=Math.min(t.y0,t.y1),c=Math.max(t.y0,t.y1),u=[],f={x:0,y:0,z:0};for(const h of n.ids){if(!n.alive[h]||n.owner[h]!==this.local)continue;const d=F[n.type[h]];d.isUnit&&(s.cam.project(n.x[h],Ft(n.map,n.x[h],n.y[h])+.6+(d.isHover?1.5:0),n.y[h],r.width,r.height,f),f.z<1&&f.x>=a&&f.x<=o&&f.y>=l&&f.y<=c&&u.push(h))}u.length?(_t.ui_("select",this.game.localFaction()),this.select(u,e)):e||this.select([])}leftClick(t){const e=this.sim;if(this.local2(t),this.mode.kind!=="none"){this.modeClick(t);return}const n=this.pick(t.clientX,t.clientY),s=performance.now();if(n<0){t.shiftKey||this.select([]);return}const r=e.owner[n]===this.local,a=s-this.lastClick.t<320&&this.lastClick.id===n;if(this.lastClick={t:s,id:n},t.shiftKey){if(!r)return;this.selection.includes(n)?this.select(this.selection.filter(o=>o!==n)):this.select([n],!0);return}if(r&&F[e.type[n]].isUnit&&(a||t.ctrlKey)){this.select(this.selectSameType(n,!0)),_t.ui_("select",this.game.localFaction());return}this.select([n]),r&&_t.ui_("select",F[e.type[n]].def.faction==="verdant"?"verdant":"helix")}modeClick(t){const e=this.mode,n=this.ground(t.clientX,t.clientY),s=this.g.x,r=this.g.z,a=t.shiftKey,o=a;if(e.kind==="attackMove"||e.kind==="patrol"){if(!n)return;this.order(e.kind==="attackMove"?"attackMove":"patrol",s,r,-1,a,!1),o||(this.mode={kind:"none"}),this.onSelectionChange()}else if(e.kind==="rally"){const l=this.pick(t.clientX,t.clientY);this.setRally(n?s:0,n?r:0,l>=0&&F[this.sim.type[l]].isNeutral?l:-1),this.mode={kind:"none"},this.onSelectionChange()}else if(e.kind==="build"){if(!n)return;const l=this.sim.canPlace(this.local,e.def,s,r);if(!l.ok){_t.ui_("error"),this.game.hud.toast(l.reason);return}this.game.cmd({c:"order",ord:"build",ids:this.ownSelected().filter(c=>F[this.sim.type[c]].isWorker),x:l.ox+l.w/2,y:l.oy+l.h/2,param:e.def,queue:a}),_t.ui_("ack",this.game.localFaction()),this.game.renderer.vfx.ring(l.ox+l.w/2,Ft(this.sim.map,s,r),l.oy+l.h/2,.5,2.5,.5,16769658),this.onCommand("build"),o||(this.mode={kind:"none"},this.cardMode="main"),this.onSelectionChange()}else if(e.kind==="ability"){const l=this.commandIds(!0),c=e.target==="point"?-1:this.pick(t.clientX,t.clientY);if(e.target!=="point"&&c<0){_t.ui_("error");return}if(e.target==="point"&&!n)return;this.game.cmd({c:"order",ord:"ability",ids:l,x:e.target==="point"?s:this.sim.x[c],y:e.target==="point"?r:this.sim.y[c],target:c,param:e.idx,queue:a}),this.onCommand("ability"),_t.ui_("ack",this.game.localFaction()),this.mode={kind:"none"},this.onSelectionChange()}}rightClick(t){const e=this.sim;if(this.local<0)return;const n=this.ownSelected();if(!n.length)return;const s=this.ground(t.clientX,t.clientY),r=this.g.x,a=this.g.z,o=n.filter(h=>F[e.type[h]].isUnit),l=n.filter(h=>F[e.type[h]].isStruct),c=this.pick(t.clientX,t.clientY),u=t.shiftKey,f=t.altKey;if(!o.length&&l.length){if(!l.filter(d=>F[e.type[d]].def.produces).length)return;this.setRally(s?r:0,s?a:0,c>=0&&F[e.type[c]].isNeutral?c:-1);return}if(o.length){if(c>=0&&e.alive[c]){const h=F[e.type[c]],d=e.owner[c],m=o.filter(g=>F[e.type[g]].isWorker),x=o.filter(g=>!F[e.type[g]].isWorker);if(d>=0&&d!==this.local){const g=(x.length?x:o).filter(_=>F[e.type[_]].canAttack),p=o.filter(_=>!g.includes(_));g.length&&(this.game.cmd({c:"order",ord:"attack",ids:g,target:c,queue:u}),this.mark(e.x[c],e.y[c],16738906),_t.ui_("attackAck",this.game.localFaction())),p.length&&s&&this.game.cmd({c:"order",ord:"move",ids:p,x:r,y:a,queue:u}),this.onCommand("attack");return}if(h.def.id==="crystal_barrier"){const g=o.filter(p=>F[e.type[p]].canAttack&&!F[e.type[p]].isWorker);if(g.length){this.game.cmd({c:"order",ord:"attack",ids:g,target:c,queue:u}),this.mark(e.x[c],e.y[c],13013247),_t.ui_("attackAck",this.game.localFaction());return}}if((h.def.id==="ore_seam"||h.def.id==="flux_vent")&&m.length){this.game.cmd({c:"order",ord:"gather",ids:m,target:c,queue:u});const g=o.filter(p=>!m.includes(p));g.length&&s&&this.game.cmd({c:"order",ord:"move",ids:g,x:r,y:a}),this.mark(e.x[c],e.y[c],6281215),_t.ui_("ack",this.game.localFaction()),this.onCommand("gather");return}if(h.def.id==="watch_pylon"){this.game.cmd({c:"order",ord:"capture",ids:o,target:c,queue:u}),this.mark(e.x[c],e.y[c],10152191),_t.ui_("ack",this.game.localFaction());return}if(d===this.local&&h.isStruct&&m.length&&(!e.ext[c].done||e.hp[c]<h.maxHp-.5)){this.game.cmd({c:"order",ord:"repair",ids:m,target:c,queue:u}),this.mark(e.x[c],e.y[c],16769658),_t.ui_("ack",this.game.localFaction());return}}s&&this.order("move",r,a,-1,u,f)}}mark(t,e,n){this.game.renderer.vfx.ring(t,Ft(this.sim.map,t,e),e,.3,1.5,.45,n)}order(t,e,n,s,r,a){const o=this.ownSelected().filter(l=>F[this.sim.type[l]].isUnit);o.length&&(this.game.cmd({c:"order",ord:t,ids:o,x:e,y:n,target:s,queue:r,force:a}),this.mark(e,n,t==="attackMove"||t==="patrol"?16738906:8257434),_t.ui_(t==="attackMove"?"attackAck":"ack",this.game.localFaction()),this.onCommand(t))}setRally(t,e,n){const s=this.ownSelected().filter(r=>F[this.sim.type[r]].isStruct&&F[this.sim.type[r]].def.produces);s.length&&(n>=0&&(t=this.sim.x[n],e=this.sim.y[n]),this.game.cmd({c:"rally",ids:s,x:t,y:e,target:n}),this.mark(t,e,8257434),_t.ui_("ack",this.game.localFaction()))}onKeyDown(t){if(!this.enabled)return;const e=t.target;if(e&&(e.tagName==="INPUT"||e.tagName==="SELECT"||e.tagName==="TEXTAREA"))return;const n=t.key.length===1?t.key.toLowerCase():t.key;this.keys.add(n.toLowerCase());const s=this.game.settings.keys,r=()=>{t.preventDefault(),t.stopPropagation()};if(n==="Escape"){r(),this.mode.kind!=="none"?(this.mode={kind:"none"},this.onSelectionChange()):this.cardMode==="build"?(this.cardMode="main",this.onSelectionChange()):this.game.openPause();return}if(n===s.menu){r(),this.game.openPause();return}if(n==="F3"){r(),this.game.settings.debugSurfaces=!this.game.settings.debugSurfaces,this.game.renderer.applySettings(this.game.settings);return}if(/^[0-9]$/.test(n)){r(),this.groupKey(parseInt(n,10),t.ctrlKey||t.metaKey,t.shiftKey);return}if(n===s.alert){r(),this.jumpAlert();return}if(n===s.home){r(),this.game.centerOnBase();return}if(n===s.focus){r(),this.focusSelection();return}if(n===s.cycle){r(),this.cycleType(t.shiftKey?-1:1);return}if(n===s.rotateLeft){this.game.renderer.cam.rotate(-1);return}if(n===s.rotateRight){this.game.renderer.cam.rotate(1);return}(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(n)||n===" ")&&r(),!(t.ctrlKey||t.metaKey||t.altKey)&&this.game.hud.pressKey(n.length===1?n.toLowerCase():n)&&r()}groupKey(t,e,n){const s=performance.now();if(e){this.groups[t]=this.ownSelected().slice(),this.game.hud.toast(`Control group ${t} set (${this.groups[t].length})`),_t.ui_("click"),this.onGroupAssigned(t);return}const r=this.groups[t].filter(o=>this.sim.alive[o]);if(this.groups[t]=r,!r.length)return;if(n){this.select(r,!0),this.groups[t]=this.ownSelected().slice();return}const a=this.lastGroup.n===t&&s-this.lastGroup.t<350;this.lastGroup={n:t,t:s},this.select(r),_t.ui_("select",this.game.localFaction()),a&&this.focusSelection()}focusSelection(){if(!this.selection.length)return;let t=0,e=0,n=0;for(const s of this.selection)this.sim.alive[s]&&(t+=this.sim.x[s],e+=this.sim.y[s],n++);n&&this.game.renderer.cam.setTarget(t/n,e/n+4,!1)}jumpAlert(){const t=this.lastAlert??this.game.lastAlertPos();t&&this.game.renderer.cam.setTarget(t.x,t.y+4,!1)}cycleType(t){const e=this.types();if(e.length<2)return;const n=e.includes(this.activeType)?e.indexOf(this.activeType):0;this.activeType=e[(n+t+e.length)%e.length],this.onSelectionChange()}update(t){const e=this.game.settings,n=e.keys;let s=0,r=0;const a=c=>this.keys.has(n[c].toLowerCase());if(this.enabled&&((a("panUp")||e.wasdPan&&this.keys.has("w"))&&(r-=1),(a("panDown")||e.wasdPan&&this.keys.has("s"))&&(r+=1),(a("panLeft")||e.wasdPan&&this.keys.has("a"))&&(s-=1),(a("panRight")||e.wasdPan&&this.keys.has("d"))&&(s+=1),e.edgeScroll&&this.mouse.inside&&!this.down&&!this.pan)){const c=this.rect(),u=6;this.mouse.x<u?s-=1:this.mouse.x>c.width-u&&(s+=1),this.mouse.y<u?r-=1:this.mouse.y>c.height-u&&(r+=1)}const o=Math.hypot(s,r)||1;if(this.game.renderer.cam.update(t,s/o*e.scrollSpeed,r/o*e.scrollSpeed,this.keys.has("shift")),this.pruneSelection(),this.mouse.inside&&!this.down&&!this.pan&&this.enabled){const c=this.rect();this.hover=this.pick(this.mouse.x+c.left,this.mouse.y+c.top)}else this.mouse.inside||(this.hover=-1);const l=this.mode.kind==="attackMove"||this.mode.kind==="patrol"?"crosshair":this.mode.kind==="build"||this.mode.kind==="ability"||this.mode.kind==="rally"?"cell":this.hover>=0?"pointer":"default";this.el.style.cursor!==l&&(this.el.style.cursor=l)}buildView(){const t=this.sim;let e=null,n=null;if(this.mode.kind==="build"&&this.mouse.inside){const s=this.rect();if(this.ground(this.mouse.x+s.left,this.mouse.y+s.top)){const r=t.canPlace(this.local,this.mode.def,this.g.x,this.g.z),a=t.map.size/2;e={def:this.mode.def,x:this.g.x,y:this.g.z,ok:r.ok,w:r.w,h:r.h,ox:r.ox,oy:r.oy,reason:r.reason,fields:t.fieldRadiusFor(this.local),coneFace:Math.atan2(a-this.g.z,a-this.g.x)}}}else if(this.mode.kind==="ability"){const r=this.commandIds(!0)[0],o=(r!==void 0?F[t.type[r]]:null)?.def.abilities?.[this.mode.idx];o&&o.range&&o.range<100&&r!==void 0&&(n={x:t.x[r],y:t.y[r],r:o.range})}else if(this.selection.length===1){const s=this.selection[0];if(t.alive[s]&&t.owner[s]===this.local&&F[t.type[s]].canAttack){const r=F[t.type[s]];r.isStruct&&r.def.weapon&&(n={x:t.x[s],y:t.y[s],r:r.def.weapon.range})}}return{player:this.local,selection:new Set(this.selection),hover:this.hover,fogEnabled:this.game.fogEnabled,placement:e,rangeCircle:n,dragBox:this.dragBox,showOrders:!0,rallyMode:this.mode.kind==="rally",statsDebug:this.game.debugLines(),attackMoveMode:this.mode.kind==="attackMove"}}doOrderAll(t){const e=this.ownSelected().filter(n=>F[this.sim.type[n]].isUnit);e.length&&(this.game.cmd({c:"order",ord:t,ids:e}),_t.ui_("click"),this.onCommand(t))}enterMode(t){this.mode=t,this.onSelectionChange()}abilityUse(t){const e=this.commandIds(!0);if(!e.length)return;const s=F[this.sim.type[e[0]]].def.abilities?.[t];if(s){if(s.target==="toggle"){this.game.cmd({c:"order",ord:"ability",ids:e,param:t}),_t.ui_("click"),this.onCommand("ability");return}this.enterMode({kind:"ability",idx:t,target:s.target==="point"?"point":s.target==="grove"?"grove":s.target==="structure"?"structure":"unit"})}}train(t,e){this.game.cmd({c:"train",target:t,param:e})}research(t,e){this.game.cmd({c:"research",target:t,param:e})}cancel(t,e){this.game.cmd({c:"cancel",target:t,param:e}),_t.ui_("click")}asCommand(t){return t}Ord=mt}const rc=new Map;function ho(i,t,e,n){i.beginPath();for(let s=0;s<6;s++){const r=Math.PI/3*s+Math.PI/6,a=t+Math.cos(r)*n,o=e+Math.sin(r)*n;s?i.lineTo(a,o):i.moveTo(a,o)}i.closePath()}function pg(i,t,e){i.strokeStyle=e,i.fillStyle=e,i.lineWidth=3.2,i.lineCap="round",i.lineJoin="round";const n=32,s=(r,a,o,l)=>{i.beginPath(),i.moveTo(r,a),i.lineTo(o,l),i.stroke()};switch(t){case"worker":s(18,46,38,26),i.beginPath(),i.arc(42,22,8,.6,5.6),i.stroke(),s(24,40,30,46);break;case"scout":i.beginPath(),i.ellipse(n,n,17,10,0,0,Math.PI*2),i.stroke(),i.beginPath(),i.arc(n,n,5,0,Math.PI*2),i.fill();break;case"basic":for(let r=0;r<3;r++)i.beginPath(),i.moveTo(18,24+r*9),i.lineTo(n,14+r*9),i.lineTo(46,24+r*9),i.stroke();break;case"antiarmor":s(14,50,50,14),i.beginPath(),i.moveTo(50,14),i.lineTo(40,16),i.lineTo(48,24),i.closePath(),i.fill(),s(20,40,26,46);break;case"support":s(n,16,n,48),s(16,n,48,n),i.beginPath(),i.arc(n,n,16,0,Math.PI*2),i.stroke();break;case"siege":i.beginPath(),i.arc(24,42,9,0,Math.PI*2),i.stroke(),s(28,36,48,16),i.beginPath(),i.arc(50,14,3,0,Math.PI*2),i.fill();break;case"heavy":i.beginPath(),i.moveTo(n,12),i.lineTo(50,20),i.lineTo(46,42),i.lineTo(n,52),i.lineTo(18,42),i.lineTo(14,20),i.closePath(),i.stroke(),s(n,22,n,42);break;case"ranged":for(const[r,a,o]of[[22,40,4],[32,30,5],[44,20,6]])i.beginPath(),i.arc(r,a,o,0,Math.PI*2),i.fill();break;case"hall":ho(i,n,n,18),i.stroke(),ho(i,n,n,8),i.fill();break;case"supply":i.beginPath(),i.moveTo(36,10),i.lineTo(20,34),i.lineTo(31,34),i.lineTo(26,54),i.lineTo(44,28),i.lineTo(33,28),i.closePath(),i.fill();break;case"production":i.strokeRect(14,24,36,26),i.beginPath(),i.moveTo(14,24),i.lineTo(n,12),i.lineTo(50,24),i.stroke(),i.fillRect(26,36,12,14);break;case"tech":i.beginPath(),i.moveTo(n,10),i.lineTo(50,n),i.lineTo(n,54),i.lineTo(14,n),i.closePath(),i.stroke(),i.beginPath(),i.arc(n,n,5,0,Math.PI*2),i.fill();break;case"tap":i.beginPath(),i.moveTo(n,10),i.bezierCurveTo(48,30,46,52,n,52),i.bezierCurveTo(18,52,16,30,n,10),i.closePath(),i.fill();break;case"defense":i.beginPath(),i.arc(n,n,16,0,Math.PI*2),i.stroke(),s(n,10,n,22),s(n,42,n,54),s(10,n,22,n),s(42,n,54,n);break;case"attack":s(14,50,46,18),s(36,14,50,28),s(18,42,26,50);break;case"armor":i.beginPath(),i.moveTo(n,12),i.lineTo(48,20),i.lineTo(44,44),i.lineTo(n,54),i.lineTo(20,44),i.lineTo(16,20),i.closePath(),i.fill();break;case"unlock":i.strokeRect(18,28,28,22),i.beginPath(),i.arc(n,24,9,Math.PI,0),i.stroke();break;case"move":s(12,n,50,n),i.beginPath(),i.moveTo(52,n),i.lineTo(38,20),i.lineTo(38,44),i.closePath(),i.fill();break;case"stop":i.fillRect(18,18,28,28);break;case"hold":i.beginPath();for(let r=0;r<8;r++){const a=Math.PI/4*r+Math.PI/8,o=n+Math.cos(a)*18,l=n+Math.sin(a)*18;r?i.lineTo(o,l):i.moveTo(o,l)}i.closePath(),i.stroke(),s(n,22,n,42);break;case"attackmove":i.beginPath(),i.arc(n,n,14,0,Math.PI*2),i.stroke(),s(n,8,n,20),s(n,44,n,56),s(8,n,20,n),s(44,n,56,n),i.beginPath(),i.arc(n,n,3,0,Math.PI*2),i.fill();break;case"patrol":s(12,24,52,24),s(12,40,52,40),i.beginPath(),i.moveTo(54,24),i.lineTo(44,16),i.lineTo(44,32),i.closePath(),i.fill(),i.beginPath(),i.moveTo(10,40),i.lineTo(20,32),i.lineTo(20,48),i.closePath(),i.fill();break;case"build":i.strokeRect(14,30,36,20),s(14,30,n,14),s(n,14,50,30),s(n,30,n,50);break;case"rally":s(20,52,20,12),i.beginPath(),i.moveTo(20,12),i.lineTo(48,20),i.lineTo(20,30),i.closePath(),i.fill();break;case"ability":i.beginPath();for(let r=0;r<10;r++){const a=Math.PI/5*r-Math.PI/2,o=r%2?8:19,l=n+Math.cos(a)*o,c=n+Math.sin(a)*o;r?i.lineTo(l,c):i.moveTo(l,c)}i.closePath(),i.fill();break;case"cancel":s(18,18,46,46),s(46,18,18,46);break;case"back":s(46,n,18,n),i.beginPath(),i.moveTo(14,n),i.lineTo(28,20),i.lineTo(28,44),i.closePath(),i.fill();break;case"idle":i.beginPath(),i.arc(n,22,8,0,Math.PI*2),i.stroke(),i.beginPath(),i.arc(n,50,16,Math.PI,0),i.stroke();break;default:i.beginPath(),i.arc(n,n,12,0,Math.PI*2),i.stroke()}}function Pe(i,t,e=64){const n=i+t+e,s=rc.get(n);if(s)return s;const r=document.createElement("canvas");r.width=r.height=e;const a=r.getContext("2d");a.scale(e/64,e/64);const o=a.createLinearGradient(0,0,0,64);o.addColorStop(0,"#1a212b"),o.addColorStop(1,"#0c1016"),a.fillStyle=o,a.fillRect(0,0,64,64),a.globalAlpha=.16,a.fillStyle=t,ho(a,32,32,30),a.fill(),a.globalAlpha=1,pg(a,i,t);const l=r.toDataURL();return rc.set(n,l),l}function Hi(i){const t=zn(i),e=t.faction==="verdant"?"#c9a0ff":t.faction==="helix"?"#ffc75a":"#7de9d6",n=t.kind==="neutral"?t.id==="ore_seam"?"tap":"tech":t.role;return Pe(n==="scout"&&t.kind==="unit"?"scout":n,e)}const ue=i=>i.replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),mg=i=>{const t=Math.floor(i/20);return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`};function eh(i){const t=i.weapon;if(!t)return"";const e=(t.damage/t.period).toFixed(1),n=t.bonus?Object.entries(t.bonus).map(([r,a])=>`<span class="bonus">+${a} vs ${r}</span>`).join(", "):"",s=[`Damage <b>${t.damage}</b> / ${t.period}s (${e} dps)`,`Range <b>${t.range}</b>${t.minRange?` (min ${t.minRange})`:""}`];return t.projectileSpeed?s.push(`Projectile ${t.projectileSpeed}/s`):t.delayed||s.push("Instant"),t.delayed&&s.push(`Eruption ${t.delayed}s delay`),t.splash&&s.push(`Splash ${t.splash}`),t.pierce&&s.push("Pierces one Light unit"),t.slow&&s.push(`Slows ${(100-t.slow.factor*100).toFixed(0)}% for ${t.slow.duration}s`),t.cone&&s.push(`Cone ±${Math.round(t.cone*180/Math.PI)}°`),t.setup&&s.push(`Setup ${t.setup}s`),s.push(t.targets==="ground"?"Targets ground":t.targets==="air"?"Targets air":"Targets ground & air"),s.join(" · ")+(n?`<br>${n}`:"")}function uo(i,t,e,n){const s=i.cost.ore||i.cost.flux?`<span style="color:#44e9d0">${i.cost.ore} ore</span>${i.cost.flux?` <span style="color:#ff8be0">${i.cost.flux} flux</span>`:""}`:"";let r=`<b class="n">${ue(i.name)}</b>${e?` <span class="k">[${ue(e.toUpperCase())}]</span>`:""}<br>${s}${i.supply?` · ${i.supply} supply`:""}${i.buildTime?` · ${i.buildTime}s`:""}<br><span class="c">${ue(i.role)} · ${i.tags.join(", ")}</span>`;n&&(r+=`<br><span style="color:#ffb347">${ue(n)}</span>`),r+=`<hr>${ue(i.desc)}`;{r+=`<hr>HP <b>${i.hp}</b> · Armor <b>${i.armor}</b>${i.speed?` · Speed <b>${i.speed}</b>`:""} · Sight <b>${i.sight}</b>${i.shield?` · Shield <b>${i.shield}</b>`:""}`,i.weapon&&(r+=`<br>${eh(i)}`);for(const a of i.abilities??[])r+=`<br><b>${ue(a.name)}</b>: ${ue(a.desc)}`;i.requires?.length&&(r+=`<br><span class="c">Requires: ${i.requires.map(a=>a in Rn?ze[Rn[a]].name:zn(a).name).join(", ")}</span>`),i.counter&&(r+=`<br><span class="c">Counter: ${ue(i.counter)}</span>`)}return r}function nh(i,t,e,n){let s=`<b class="n">${ue(i.name)}</b>${e?` <span class="k">[${ue(e.toUpperCase())}]</span>`:""}<br><span style="color:#44e9d0">${i.cost.ore} ore</span> <span style="color:#ff8be0">${i.cost.flux} flux</span> · ${i.time}s`;return n&&(s+=`<br><span style="color:#ffb347">${ue(n)}</span>`),s+=`<hr>${ue(i.desc)}`,t&&(s+=`<br><span class="c">${i.effect.kind==="attack"?"Attack upgrades add "+Math.round(i.effect.amount*100)+"% damage (never more than 12% alone).":i.effect.kind==="armor"?"Armor reduces damage by roughly 8-9% per point.":"Unlocks new technology."}</span>`),s}class gg{constructor(t,e){this.game=t,this.root=document.createElement("div"),this.root.id="hud",this.root.innerHTML=`
      <div class="menubtn hudbox" id="h-menu">Menu · F10</div>
      <div class="objective hudbox" id="h-obj" style="display:none"></div>
      <div class="topbar hudbox">
        <div class="res" id="h-ore"><img class="ic" src="${Pe("tap","#44e9d0",36)}"><div><span class="val">0</span><span class="sub">PRISM ORE</span></div></div>
        <div class="res" id="h-flux"><img class="ic" src="${Pe("tap","#ff8be0",36)}"><div><span class="val">0</span><span class="sub">FLUX</span></div></div>
        <div class="res" id="h-sup"><img class="ic" src="${Pe("supply","#ffc75a",36)}"><div><span class="val">0/0</span><span class="sub">SUPPLY</span></div></div>
        <div class="res click" id="h-wrk" title="Click: select idle workers"><img class="ic" src="${Pe("worker","#9fd0ff",36)}"><div><span class="val">0</span><span class="sub">WORKERS</span></div></div>
        <div class="res" id="h-time"><div><span class="val">0:00</span><span class="sub">TIME</span></div></div>
      </div>
      <div class="bases" id="h-bases"></div>
      <div class="alerts" id="h-alerts"></div>
      <div class="tut hudbox" id="h-tut" style="display:none"></div>
      <div class="toast" id="h-toast" style="opacity:0"></div>
      <div class="bottom">
        <div class="minimap hudbox"><canvas id="h-mm" width="190" height="190"></canvas></div>
        <div class="selpanel hudbox empty" id="h-sel"></div>
        <div class="card hudbox" id="h-card"></div>
      </div>`,e.appendChild(this.root);for(const s of["h-menu","h-obj","h-ore","h-flux","h-sup","h-wrk","h-time","h-bases","h-alerts","h-sel","h-card","h-toast","h-tut"])this.el[s]=this.root.querySelector("#"+s);this.toastEl=this.el["h-toast"],this.tipEl=document.createElement("div"),this.tipEl.className="tip",this.tipEl.style.display="none",document.body.appendChild(this.tipEl),this.el["h-menu"].onclick=()=>t.openPause(),this.el["h-wrk"].onclick=()=>this.selectIdleWorkers(),this.mm=new xg(t,this.root.querySelector("#h-mm"),this);const n=this.el["h-card"];n.addEventListener("click",s=>{const r=s.target.closest("[data-slot]");r&&this.click(parseInt(r.dataset.slot,10))}),n.addEventListener("mouseover",s=>{const r=s.target.closest("[data-slot]");r&&this.showTipFor(parseInt(r.dataset.slot,10),s)}),n.addEventListener("mousemove",s=>this.moveTip(s)),n.addEventListener("mouseleave",()=>this.hideTip()),t.input.onSelectionChange=()=>{this.lastSig="",this.refresh(!0)}}root;cardButtons=[];el={};tipEl;tipTimer=0;hoverSlot=-1;alerts=[];toastEl;toastT=0;lastSig="";lastSelHtml="";tick=0;mm;incomeHist=[];pings=[];dispose(){this.root.remove(),this.tipEl.remove()}toast(t){this.toastEl.textContent=t,this.toastEl.style.opacity="1",this.toastT=2.2}setObjective(t,e){const n=this.el["h-obj"];if(!e){n.style.display="none";return}n.style.display="block",n.innerHTML=`<small>${ue(t)}</small>${ue(e)}`}setTutorialPanel(t){const e=this.el["h-tut"];e.style.display=t?"block":"none",e.innerHTML=t}pushAlert(t,e,n,s){const r=performance.now(),a=this.alerts.find(l=>l.text===t&&r-l.t<3500);if(a){a.t=r;return}const o=document.createElement("div");for(o.className="alert "+e,o.textContent=t,o.onclick=()=>this.game.renderer.cam.setTarget(n,s+4,!1),this.el["h-alerts"].appendChild(o),this.alerts.push({text:t,kind:e,x:n,y:s,t:r,el:o});this.alerts.length>5;)this.alerts.shift().el.remove();(n||s)&&this.pings.push({x:n,y:s,t:r})}selectIdleWorkers(){const t=this.game.sim,e=t.ids.filter(n=>t.alive[n]&&t.owner[n]===this.game.local&&F[t.type[n]].isWorker&&t.ext[n].orders.length===0);e.length?(this.game.input.select(e),this.game.input.focusSelection()):this.toast("No idle workers")}buildCard(){const t=this.game,e=t.sim,n=t.input,s=t.settings.keys,r=t.local,a=[];if(r<0)return a;const o=e.players[r],l=o.faction,c=n.ownSelected();if(!c.length)return a;const u=c.filter(y=>F[e.type[y]].isUnit),f=c.filter(y=>F[e.type[y]].isStruct),h=y=>o.ore<y.ore?"Not enough Prism Ore":o.flux<y.flux?"Not enough Flux":"",d=y=>a.push({tip:()=>ue(y.label),...y});if(n.cardMode==="build"&&u.some(y=>F[e.type[y]].isWorker))return l.structures.forEach((y,v)=>{const A=zn(y),R=e.missingReq(r,A.requires),w=R?`Requires ${R}`:h(A.cost),E=pt[y];d({slot:v,key:lr[v],label:A.name,icon:Hi(y),enabled:!R,reason:w,cost:A.cost,active:n.mode.kind==="build"&&n.mode.def===E,onClick:()=>{if(R){_t.ui_("error"),this.toast(w);return}n.enterMode({kind:"build",def:E}),_t.ui_("click")},tip:()=>uo(A,!0,lr[v],w)})}),d({slot:11,key:"Escape",label:"Back",icon:Pe("back","#9fb3c4"),enabled:!0,reason:"",onClick:()=>{n.cardMode="main",n.mode={kind:"none"},this.refresh(!0)},tip:()=>'<b class="n">Back</b> [Esc]'}),a;if(u.length){const y=n.types().filter(E=>F[E].isUnit),v=y.includes(n.activeType)?n.activeType:y[0],A=F[v],R=u.some(E=>F[e.type[E]].isWorker),w=n.mode.kind;return d({slot:0,key:s.move,label:"Move",icon:Pe("move","#7dff9a"),enabled:!0,reason:"",onClick:()=>{this.toast("Right-click the ground to move")},tip:()=>'<b class="n">Move</b> [Right-click]<br>Move to a point. Hold Shift to queue waypoints, Alt to force-move without auto-acquiring targets.'}),d({slot:1,key:s.stop,label:"Stop",icon:Pe("stop","#9fb3c4"),enabled:!0,reason:"",onClick:()=>n.doOrderAll("stop"),tip:()=>'<b class="n">Stop</b> ['+s.stop.toUpperCase()+"]<br>Cancel all orders."}),d({slot:2,key:s.hold,label:"Hold",icon:Pe("hold","#9fb3c4"),enabled:!0,reason:"",onClick:()=>n.doOrderAll("hold"),tip:()=>'<b class="n">Hold position</b> ['+s.hold.toUpperCase()+"]<br>Stay put and only shoot what comes into range."}),d({slot:3,key:s.attackMove,label:"Attack",icon:Pe("attackmove","#ff6a5a"),enabled:u.some(E=>F[e.type[E]].canAttack),reason:"No armed units",active:w==="attackMove",onClick:()=>n.enterMode({kind:"attackMove"}),tip:()=>'<b class="n">Attack-move</b> ['+s.attackMove.toUpperCase()+"]<br>Then click: advance and engage anything met on the way."}),d({slot:4,key:s.patrol,label:"Patrol",icon:Pe("patrol","#ffb347"),enabled:!0,reason:"",active:w==="patrol",onClick:()=>n.enterMode({kind:"patrol"}),tip:()=>'<b class="n">Patrol</b> ['+s.patrol.toUpperCase()+"]<br>Then click: patrol between here and there, attacking on the way."}),R&&d({slot:5,key:s.build,label:"Build",icon:Pe("build","#ffe27a"),enabled:!0,reason:"",onClick:()=>{n.cardMode="build",this.refresh(!0)},tip:()=>'<b class="n">Build</b> ['+s.build.toUpperCase()+"]<br>Open the construction palette."}),(A.def.abilities??[]).forEach((E,M)=>{const b=n.commandIds(!0).reduce((X,q)=>Math.max(X,e.ext[q].cds[M]),0),P=n.commandIds(!0)[0],D=!E.energy||P!==void 0&&e.ext[P].energy>=E.energy,N=!E.flux||o.flux>=E.flux,$=b>0?"Recharging":D?N?"":"Not enough Flux":"Not enough energy",j=E.target==="toggle"&&P!==void 0&&e.ext[P].mode>0;d({slot:8+M,key:E.hotkey,label:E.name,icon:Pe("ability",A.def.faction==="verdant"?"#c9a0ff":"#ffc75a"),enabled:!$,reason:$,cd:b/Math.max(1,E.cooldown*20),active:j||n.mode.kind==="ability"&&n.mode.idx===M,onClick:()=>{if($){_t.ui_("error"),this.toast($);return}n.abilityUse(M)},tip:()=>`<b class="n">${ue(E.name)}</b> <span class="k">[${E.hotkey.toUpperCase()}]</span>${E.flux?` · <span style="color:#ff8be0">${E.flux} flux</span>`:""}${E.energy?` · ${E.energy} energy`:""}<br>${ue(E.desc)}${E.cooldown>2?`<br><span class="c">Cooldown ${E.cooldown}s</span>`:""}`})}),a}const m=f[0];if(m===void 0)return a;const x=F[e.type[m]];if(!e.ext[m].done)return d({slot:11,key:"x",label:"Cancel",icon:Pe("cancel","#ff6a5a"),enabled:!0,reason:"",onClick:()=>{n.cancel(m,-1),n.select([])},tip:()=>'<b class="n">Cancel construction</b> [X]<br>Refunds 75% of the cost.'}),a;const p=f.filter(y=>F[e.type[y]].def.produces);let _=0;for(const y of x.def.produces??[]){const v=zn(y),A=e.missingReq(r,v.requires),R=A?`Requires ${A}`:h(v.cost),w=pt[y],E=lr[_];d({slot:_++,key:E,label:v.name,icon:Hi(y),enabled:!A,reason:R,cost:v.cost,onClick:()=>{if(A){_t.ui_("error"),this.toast(R);return}if(R){_t.ui_("error"),this.toast(R);return}const M=p.filter(b=>e.ext[b].done&&F[e.type[b]].def.produces?.includes(y)).sort((b,P)=>e.ext[b].q.length-e.ext[P].q.length)[0];M!==void 0&&(n.train(M,w),_t.ui_("queue"))},tip:()=>uo(v,!0,E,R)})}for(const y of x.def.researches??[]){const v=ze[Rn[y]];if(o.upg[Rn[y]])continue;const A=e.ids.some(M=>e.alive[M]&&e.owner[M]===r&&e.ext[M].q.some(b=>b.kind==="research"&&b.idx===Rn[y])),R=e.missingReq(r,v.requires),w=A?"Already researching":R?`Requires ${R}`:h(v.cost),E=lr[_];if(_>=11)break;d({slot:_++,key:E,label:v.name,icon:Pe(v.effect.kind==="attack"?"attack":v.effect.kind==="armor"?"armor":"unlock",l.id==="verdant"?"#c9a0ff":"#ffc75a"),enabled:!R&&!A,reason:w,cost:v.cost,onClick:()=>{if(w){_t.ui_("error"),this.toast(w);return}const M=p.filter(b=>F[e.type[b]].def.researches?.includes(y)&&e.ext[b].done).sort((b,P)=>e.ext[b].q.length-e.ext[P].q.length)[0];M!==void 0&&(n.research(M,Rn[y]),_t.ui_("queue"))},tip:()=>nh(v,!0,E,w)})}return x.def.produces&&d({slot:11,key:s.rally,label:"Rally",icon:Pe("rally","#7dff9a"),enabled:!0,reason:"",active:n.mode.kind==="rally",onClick:()=>n.enterMode({kind:"rally"}),tip:()=>'<b class="n">Rally point</b> ['+s.rally.toUpperCase()+"]<br>Then click the ground (or an ore seam for workers). Right-click also sets it."}),a}pressKey(t){for(const e of this.cardButtons)if(e.key===t&&(e.enabled||e.reason))return e.onClick(),this.refresh(!0),!0;return!1}click(t){const e=this.cardButtons.find(n=>n.slot===t);e&&(_t.init(),e.onClick(),this.refresh(!0))}showTipFor(t,e){const n=this.cardButtons.find(r=>r.slot===t);if(!n)return;this.hoverSlot=t;const s=n;this.tipEl.innerHTML=this.shortTip(s),this.tipEl.style.display="block",this.moveTip(e),clearTimeout(this.tipTimer),this.tipTimer=window.setTimeout(()=>{this.tipEl.innerHTML=s.tip(),this.moveTip(e)},350)}shortTip(t){const e=t.cost?`<br><span style="color:#44e9d0">${t.cost.ore} ore</span>${t.cost.flux?` <span style="color:#ff8be0">${t.cost.flux} flux</span>`:""}`:"";return`<b class="n">${ue(t.label)}</b> <span class="k">[${ue(t.key===" "?"Space":t.key.length===1?t.key.toUpperCase():t.key)}]</span>${e}${t.reason&&!t.enabled?`<br><span style="color:#ffb347">${ue(t.reason)}</span>`:""}`}moveTip(t){const e=this.tipEl.getBoundingClientRect();this.tipEl.style.left=Math.max(4,Math.min(window.innerWidth-e.width-4,t.clientX-e.width+20))+"px",this.tipEl.style.top=Math.max(4,t.clientY-e.height-14)+"px"}hideTip(){clearTimeout(this.tipTimer),this.tipEl.style.display="none",this.hoverSlot=-1}refresh(t=!1){const e=this.game,n=e.sim,s=e.input,r=n.players[Math.max(0,e.local)],a=[s.selection.join(","),s.cardMode,s.mode.kind,s.activeType,Math.floor(r.ore/25),Math.floor(r.flux/25),r.supplyUsed,r.upg.join(""),s.selection.map(u=>n.alive[u]?n.ext[u].q.length+":"+(n.ext[u].done?1:0)+":"+n.ext[u].mode+":"+Math.ceil(Math.max(...n.ext[u].cds)/40):"x").join(",")].join("|");if(!t&&a===this.lastSig)return;this.lastSig=a,this.cardButtons=this.buildCard();const o=this.el["h-card"],l=new Map(this.cardButtons.map(u=>[u.slot,u]));let c="";for(let u=0;u<12;u++){const f=l.get(u);if(!f){c+="<div></div>";continue}const h=f.key==="Escape"?"Esc":f.key===" "?"␣":f.key.length===1?f.key.toUpperCase():f.key;c+=`<button class="cbtn${f.enabled?"":" dis"}${f.active?" act":""}" data-slot="${u}"><img src="${f.icon}" alt=""><span class="lbl">${ue(f.label)}</span><span class="key">${ue(h)}</span>${f.cost?`<span class="cost">${f.cost.ore}${f.cost.flux?`<br><span style="color:#ff8be0">${f.cost.flux}</span>`:""}</span>`:""}${f.cd&&f.cd>0?`<span class="cd" style="height:${Math.round(f.cd*100)}%"></span>`:""}</button>`}o.innerHTML=c,this.renderSelection()}renderSelection(){const t=this.game,e=t.sim,n=t.input,s=this.el["h-sel"],r=n.selection.filter(h=>e.alive[h]);if(!r.length){this.lastSelHtml="",s.className="selpanel hudbox empty",s.innerHTML="<div>Drag to box-select · Right-click to command · B to build · Space jumps to the latest alert</div>";return}s.className="selpanel hudbox";const a=t.local;if(r.length===1){const h=r[0],d=F[e.type[h]],m=e.ext[h],x=d.def,g=e.owner[h]===a,p=e.hp[h]/d.maxHp,_=x.faction==="verdant"?"#c9a0ff":x.faction==="helix"?"#ffc75a":"#7de9d6";let y="";if(d.isUnit||d.isStruct){const w=e.players[Math.max(0,e.owner[h])],E=1+(e.owner[h]>=0?w.atkBonus:0);y=`<div class="statline"><span>Armor <b>${x.armor+(d.isUnit&&e.owner[h]>=0?w.armorBonus:0)}</b></span>${x.speed?`<span>Speed <b>${x.speed}</b></span>`:""}<span>Sight <b>${x.sight}</b></span>${x.supply?`<span>Supply <b>${x.supply}</b></span>`:""}${x.weapon&&E>1?`<span>Attack bonus <b>+${Math.round((E-1)*100)}%</b></span>`:""}</div>`,x.weapon&&(y+=`<div class="statline" style="font-size:11px;color:#9fb3c4">${eh(x).split("<br>").pop()}</div>`)}let v="";if(d.isNeutral&&m.maxAmount&&(v=`<div class="statline"><span>${x.id==="flux_vent"?"Flux":"Ore"} remaining <b>${Math.floor(m.amount)}</b> / ${m.maxAmount}</span></div>`),d.isNeutral&&x.id==="watch_pylon"&&(v=`<div class="statline"><span>${m.capOwner<0?"Uncaptured - channel 3s with any unit":m.capOwner===a?"Captured: vision over the route":"Held by the enemy"}</span></div>`),d.isUnit&&g){const w=[];d.isWorker&&m.carry>0&&w.push(`Carrying <b>${m.carry.toFixed(0)}</b> ${m.carryT===1?"ore":"flux"}`),d.maxEnergy&&w.push(`Energy <b>${Math.floor(m.energy)}</b>/${d.maxEnergy}`),x.shield&&w.push(`Shield <b>${Math.floor(m.shield)}</b>/${x.shield}`);const E=m.orders[0],M={[mt.Move]:"Moving",[mt.AttackMove]:"Attack-moving",[mt.Attack]:"Attacking",[mt.Hold]:"Holding",[mt.Patrol]:"Patrolling",[mt.Gather]:"Gathering",[mt.Build]:"Building",[mt.Repair]:"Repairing",[mt.Ability]:"Casting",[mt.Capture]:"Capturing",[mt.Resume]:"Building"};w.push(`Order: <b>${E?M[E.k]:m.target>=0?"Engaging":"Idle"}</b>`),v+=`<div class="statline">${w.join('<span style="color:#456">|</span>')}</div>`}let A="";d.isStruct&&g&&(m.done?(d.isHall&&(v+=this.baseInfo(h)),A='<div class="queue">'+m.q.map((w,E)=>{const M=w.kind==="unit",b=M?oe[w.idx].name:ze[w.idx].name,P=M?Hi(oe[w.idx].id):Pe(ze[w.idx].effect.kind==="attack"?"attack":ze[w.idx].effect.kind==="armor"?"armor":"unlock","#ffc75a"),D=Math.round((1-w.left/w.total)*100);return`<div class="qitem${w.paused?" paused":""}" data-q="${E}" title="${ue(b)} - click to cancel (full refund)"><img src="${P}" alt="">${E===0?`<div class="pg" style="width:${D}%"></div>`:""}${w.paused?`<div class="pz">${w.paused==="supply"?"SUPPLY<br>BLOCKED":"LOCKED"}</div>`:""}</div>`}).join("")+"</div>",m.q[0]&&(A+=`<div class="statline" style="font-size:11px;color:#9fb3c4">${m.q[0].paused==="supply"?"Paused: need more supply (build a "+e.players[a].faction.supply.replace(/_/g," ")+")":`${m.q[0].kind==="unit"?oe[m.q[0].idx].name:ze[m.q[0].idx].name} - ${Math.ceil(m.q[0].left/20)}s`}</div>`)):v+=`<div class="statline"><span>Under construction <b>${Math.floor(m.prog/Math.max(1,m.total)*100)}%</b></span></div>`);const R=`
        <div class="portrait" data-sel="${h}"><img src="${Hi(x.id)}" alt=""><div class="nm" style="color:${_}">${ue(x.role)}</div></div>
        <div class="info">
          <h4 style="color:${g?"#fff":"#ff9a8a"}">${ue(x.name)}${g?"":e.owner[h]>=0?" (enemy)":""}</h4>
          <div class="role">${x.tags.join(" · ")}</div>
          ${d.isNeutral&&!m.maxAmount?"":`<div class="bar"><i style="width:${Math.max(0,p*100)}%;background:${p>.6?"#3fe06b":p>.3?"#e8c43a":"#e8503a"}"></i><span>${Math.ceil(e.hp[h])} / ${d.maxHp}</span></div>`}
          ${y}${v}${A}
        </div>`;if(R===this.lastSelHtml)return;this.lastSelHtml=R,s.innerHTML=R,s.querySelectorAll("[data-q]").forEach(w=>w.onclick=()=>{n.cancel(h,parseInt(w.dataset.q,10)),this.refresh(!0)});return}const o=new Map;for(const h of r)o.set(e.type[h],(o.get(e.type[h])??0)+1);const l=n.types(),c=l.includes(n.activeType)?n.activeType:l[0],u=r.slice(0,60),f=`
      <div class="info" style="flex:none;width:170px">
        <h4>${r.length} selected</h4>
        <div class="role">${[...o.entries()].map(([h,d])=>`${d}× ${F[h].def.name}`).join(", ")}</div>
        <div class="statline"><span>Total HP <b>${Math.round(r.reduce((h,d)=>h+e.hp[d],0))}</b></span></div>
        ${o.size>1?'<div class="role">Tab cycles subtype: <b style="color:#fff">'+F[c].def.name+"</b></div>":""}
      </div>
      <div class="grid">${u.map(h=>{const d=F[e.type[h]],m=e.hp[h]/d.maxHp;return`<div class="mini${e.type[h]===c&&o.size>1?" active":""}" data-id="${h}" title="${ue(d.def.name)}"><img src="${Hi(d.def.id)}" alt=""><div class="hp"><i style="width:${m*100}%;background:${m>.6?"#3fe06b":m>.3?"#e8c43a":"#e8503a"}"></i></div></div>`}).join("")}${r.length>60?`<div class="role" style="align-self:center">+${r.length-60}</div>`:""}</div>`;f!==this.lastSelHtml&&(this.lastSelHtml=f,s.innerHTML=f,s.querySelectorAll("[data-id]").forEach(h=>{h.onclick=d=>{const m=parseInt(h.dataset.id,10);d.shiftKey?n.select(n.selection.filter(x=>x!==m)):d.ctrlKey?n.select(n.selection.filter(x=>e.type[x]===e.type[m])):n.select([m])}}))}baseInfo(t){const e=this.baseStats().find(s=>s.hall===t);if(!e)return"";const n=e.workers>e.ideal?Math.round((1-e.ideal/e.workers)*100):0;return`<div class="statline"><span>Workers here <b>${e.workers}</b> / ideal <b>${e.ideal}</b></span><span>Travel inefficiency <b style="color:${n>0?"#ffb347":"#5dff8a"}">${n>0?n+"% wasted (over-saturated)":"0%"}</b></span></div>`}baseStats(){const t=this.game.sim,e=this.game.local,n=[];if(e<0)return n;const s=t.players[e].faction;return t.ids.filter(a=>t.alive[a]&&t.owner[a]===e&&F[t.type[a]].isHall&&t.ext[a].done).forEach((a,o)=>{let l=0,c=0;for(const f of t.ids)t.alive[f]&&(t.type[f]===pt.ore_seam&&Math.hypot(t.x[f]-t.x[a],t.y[f]-t.y[a])<16&&t.ext[f].amount>0&&l++,t.owner[f]===e&&t.type[f]===pt[s.tap]&&t.ext[f].done&&Math.hypot(t.x[f]-t.x[a],t.y[f]-t.y[a])<20&&c++);let u=0;for(const f of t.ids){if(!t.alive[f]||t.owner[f]!==e||!F[t.type[f]].isWorker)continue;const h=t.ext[f].orders[0];h&&h.k===mt.Gather&&Math.hypot(t.x[h.t]-t.x[a],t.y[h.t]-t.y[a])<20&&u++}n.push({hall:a,workers:u,ideal:l*2+c*3,name:o===0?"Main":`Base ${o+1}`})}),n}update(t){this.tick++;const e=this.game,n=e.sim,s=e.local,r=n.players[Math.max(0,s)];this.toastT-=t,this.toastT<=0&&(this.toastEl.style.opacity="0");const a=performance.now();for(let o=this.alerts.length-1;o>=0;o--)a-this.alerts[o].t>7e3&&(this.alerts[o].el.remove(),this.alerts.splice(o,1));if(this.pings=this.pings.filter(o=>a-o.t<4e3),this.tick%6===0){const o=(h,d,m)=>{const x=this.el[h],g=x.querySelector(".val");g.textContent!==d&&(g.textContent=d),m!==void 0&&(x.querySelector(".sub").textContent=m)};for(this.incomeHist.push([n.tick,r.stats.ore]);this.incomeHist.length>1&&n.tick-this.incomeHist[0][0]>600;)this.incomeHist.shift();const l=this.incomeHist[0],c=l&&n.tick>l[0]?Math.round((r.stats.ore-l[1])/(n.tick-l[0])*20*60):0;o("h-ore",String(Math.floor(r.ore)),`PRISM ORE  +${c}/min`),o("h-flux",String(Math.floor(r.flux))),o("h-sup",`${r.supplyUsed}/${r.supplyCap}`),this.el["h-sup"].classList.toggle("warn",s>=0&&n.ids.some(h=>n.alive[h]&&n.owner[h]===s&&n.ext[h].q[0]?.paused==="supply"));let u=0,f=0;for(const h of n.ids)n.alive[h]&&n.owner[h]===s&&F[n.type[h]].isWorker&&(u++,n.ext[h].orders.length||f++);o("h-wrk",String(u),f?`${f} IDLE`:"WORKERS"),this.el["h-wrk"].classList.toggle("warn",f>0&&n.tick>400),o("h-time",mg(n.tick)),this.tick%12===0&&(this.el["h-bases"].innerHTML=this.baseStats().map(h=>`<div class="basechip ${h.workers<=h.ideal?"ok":h.workers>h.ideal*1.4?"bad":"over"}" title="Workers assigned / ideal saturation. Over-saturation wastes travel time.">${h.name} <b>${h.workers}/${h.ideal}</b></div>`).join("")),this.refresh(!1)}this.tick%10===0&&e.input.selection.length&&this.renderSelection(),this.mm.draw(t)}}class xg{constructor(t,e,n){this.game=t,this.cv=e,this.hud=n;const s=t.sim.map.size;this.dpr=Math.min(window.devicePixelRatio||1,2),e.width=Math.round(this.size*this.dpr),e.height=Math.round(this.size*this.dpr),this.ctx=e.getContext("2d"),this.base=document.createElement("canvas"),this.base.width=s,this.base.height=s;const r=this.base.getContext("2d"),a=r.createImageData(s,s),o=t.sim.map;for(let c=0;c<s*s;c++){const u=o.heightC[c];let f=38+u*6,h=46+u*7,d=56+u*6;o.chasm[c]?(f=8,h=14,d=24):o.blocked[c]?(f=26,h=28,d=34,u>2&&(f=70,h=74,d=80)):o.brush[c]?(f=30,h=70,d=62):o.bridge[c]?(f=160,h=130,d=70):u<-.5&&(f=24,h=60,d=66),a.data[c*4]=f,a.data[c*4+1]=h,a.data[c*4+2]=d,a.data[c*4+3]=255}r.putImageData(a,0,0),this.fog=document.createElement("canvas"),this.fog.width=s,this.fog.height=s,this.fogImg=this.fog.getContext("2d").createImageData(s,s);const l=c=>this.pointer(c);e.addEventListener("pointerdown",c=>{if(e.setPointerCapture(c.pointerId),_t.init(),c.button===0){if(this.dragging=!0,this.game.input.mode.kind==="attackMove"){this.order(c,"attackMove"),this.game.input.mode={kind:"none"},this.dragging=!1;return}l(c)}else c.button===2&&this.order(c,(c.shiftKey,"move"))}),e.addEventListener("pointermove",c=>{this.dragging&&l(c)}),e.addEventListener("pointerup",()=>{this.dragging=!1}),e.addEventListener("contextmenu",c=>c.preventDefault())}base;fog;fogImg;size=190;dragging=!1;acc=0;ctx;dpr=1;toWorld(t){const e=this.cv.getBoundingClientRect(),n=this.game.sim.map.size;return{x:Math.min(n,Math.max(0,(t.clientX-e.left)/e.width*n)),y:Math.min(n,Math.max(0,(t.clientY-e.top)/e.height*n))}}pointer(t){const e=this.toWorld(t);this.game.renderer.cam.setTarget(e.x,e.y+4,!0)}order(t,e){const n=this.toWorld(t);this.game.input.order(e,n.x,n.y,-1,t.shiftKey,!1)}draw(t){if(this.acc+=t,this.acc<.08)return;this.acc=0;const e=this.game,n=e.sim,s=n.map.size,r=this.ctx,a=this.cv.width,o=a/s;r.imageSmoothingEnabled=!0,r.drawImage(this.base,0,0,a,a);const l=e.local,c=l<0||!e.fogEnabled||n.pulseActive();if(!c){const x=n.players[l],g=this.fogImg.data;for(let p=0;p<s*s;p++){const _=x.vis[p]===Fe?0:x.seen[p]?120:238;g[p*4]=2,g[p*4+1]=4,g[p*4+2]=8,g[p*4+3]=_}this.fog.getContext("2d").putImageData(this.fogImg,0,0),r.drawImage(this.fog,0,0,a,a)}const u=x=>"#"+x.toString(16).padStart(6,"0"),f=e.renderer.teamHex;for(const x of n.ids){if(!n.alive[x])continue;const g=F[n.type[x]],p=n.owner[x],_=n.x[x]*o,y=n.y[x]*o;if(g.isNeutral){if(!c&&!n.players[Math.max(0,l)].seen[n.cellIdx(n.x[x],n.y[x])])continue;const A=g.def.id;r.fillStyle=A==="ore_seam"?"#44e9d0":A==="flux_vent"?"#ff8be0":A==="crystal_barrier"?"#a58cff":A==="salvage_pod"?"#ffc04d":n.ext[x].capOwner>=0?u(f[n.ext[x].capOwner]):"#dfe8f0",A==="watch_pylon"?(r.beginPath(),r.moveTo(_,y-4*this.dpr),r.lineTo(_+3.5*this.dpr,y),r.lineTo(_,y+4*this.dpr),r.lineTo(_-3.5*this.dpr,y),r.closePath(),r.fill()):r.fillRect(_-1*this.dpr,y-1*this.dpr,(A==="crystal_barrier"?3:2)*this.dpr,(A==="crystal_barrier"?3:2)*this.dpr);continue}if(p!==l&&l>=0&&!c&&!n.visibleTo(l,x))continue;r.fillStyle=u(f[Math.max(0,p)]);const v=(g.isStruct?4.2:g.def.radius>.8?3:2.2)*this.dpr;r.fillRect(_-v/2,y-v/2,v,v)}for(const x of e.renderer.getGhosts()){if(n.alive[x.id]&&n.visibleTo(l,x.id))continue;r.fillStyle="#7b8794";const g=4*this.dpr;r.fillRect(x.x*o-g/2,x.y*o-g/2,g,g)}const h=performance.now();for(const x of this.hud.pings){const g=(h-x.t)/4e3;r.strokeStyle=`rgba(255,90,70,${1-g})`,r.lineWidth=2*this.dpr,r.beginPath(),r.arc(x.x*o,x.y*o,(4+(h-x.t)/200%10)*this.dpr,0,Math.PI*2),r.stroke()}const d=e.renderer.cam,m={x:0,z:0};r.strokeStyle="rgba(255,255,255,0.85)",r.lineWidth=1.2*this.dpr,r.beginPath(),[[-1,1],[1,1],[1,-1],[-1,-1]].forEach(([x,g],p)=>{d.groundPoint(x,g*.95,m);const _=Math.max(0,Math.min(a,m.x*o)),y=Math.max(0,Math.min(a,m.z*o));p?r.lineTo(_,y):r.moveTo(_,y)}),r.closePath(),r.stroke()}}class yg{constructor(t){this.g=t;const e=t.sim,n=(r,a=!1)=>e.ids.filter(o=>e.alive[o]&&e.owner[o]===0&&e.type[o]===pt[r]&&(!a||e.ext[o].done)),s=()=>n("core_relay").reduce((r,a)=>r+e.ext[a].q.filter(o=>o.kind==="unit").length,0);this.steps=[{id:"select",title:"Select",text:"Drag a box around your Fabricators (the small worker walkers beside your Core Relay), or double-click one to grab them all.",check:r=>r.input.ownSelected().filter(a=>F[e.type[a]].isWorker).length>=4},{id:"gather",title:"Gather",text:"Right-click a glowing teal Prism Ore seam to put them to work. Watch the ore counter climb.",check:()=>e.ids.filter(r=>e.alive[r]&&e.owner[r]===0&&F[e.type[r]].isWorker&&e.ext[r].orders[0]?.k===mt.Gather).length>=4&&e.players[0].stats.ore>=10},{id:"workers",title:"Economy",text:"Select the Core Relay and press Q (or click the Fabricator button) twice to train 2 more workers.",check:()=>e.ids.filter(r=>e.alive[r]&&e.owner[r]===0&&F[e.type[r]].isWorker).length+s()>=8},{id:"pylon",title:"Supply",text:"Select a Fabricator, press B, then choose the Grid Pylon (Q) and click near your base. Pylons raise your supply cap and extend your build field.",check:()=>n("grid_pylon").length>0},{id:"bay",title:"Production",text:"Build an Assembly Bay the same way (B, then W). It needs a Grid Pylon field to stand in. Keep the Fabricator beside it until it finishes.",check:()=>n("assembly_bay").length>0},{id:"tap",title:"Flux",text:"Advanced units need Flux. Build a Flux Tap (B, then E / the vent icon) on a pink Flux Vent near your Core Relay, then send three Fabricators to mine it.",check:()=>n("flux_tap").length>0},{id:"train",title:"Army",text:"Once the Assembly Bay is complete, select it and train 4 Bulwarks (Q). Set a rally point with R and a click. Watch your supply!",check:()=>e.ids.filter(r=>e.alive[r]&&e.owner[r]===0&&e.type[r]===pt.bulwark).length>=4},{id:"group",title:"Control groups",text:"Box-select your Bulwarks and press Ctrl+1 to assign them to group 1. Press 1 any time to re-select them (double-tap 1 to centre the camera).",check:(r,a)=>a.flags.group},{id:"brace",title:"Abilities",text:"Select a Bulwark and press Q to Brace: +2 range, but it cannot move while braced. Move it to cancel.",check:(r,a)=>a.flags.brace},{id:"attackmove",title:"Attack-move",text:"Press 1, then A and click near the marked enemy outpost (the teal ring on the ground). Units attack anything they meet on the way.",check:(r,a)=>a.flags.attackMove&&e.ids.some(o=>e.alive[o]&&e.owner[o]===0&&e.type[o]===pt.bulwark&&a.marker!==null&&Math.hypot(e.x[o]-a.marker.x,e.y[o]-a.marker.y)<22)},{id:"destroy",title:"Destroy the objective",text:"Destroy the enemy Heartgrove. Focus-fire with right-click on a target; keep your army together.",check:()=>e.over&&e.winner===0}],t.input.onGroupAssigned=r=>{r===1&&t.input.groups[1].filter(a=>e.alive[a]&&e.type[a]===pt.bulwark).length>=3&&(this.flags.group=!0)},t.input.onCommand=r=>{r==="attackMove"&&(this.flags.attackMove=!0)};for(const r of e.ids)e.alive[r]&&e.owner[r]===1&&F[e.type[r]].isHall&&(this.enemyHall=r);this.enemyHall>=0&&(this.marker={x:e.x[this.enemyHall]-8,y:e.y[this.enemyHall]+6})}idx=0;finished=!1;flags={group:!1,attackMove:!1,brace:!1};steps;enemyHall=-1;nextCheck=0;marker=null;update(){const t=this.g,e=t.sim;if(!this.finished){if(!this.flags.brace)for(const n of e.ids)e.alive[n]&&e.owner[n]===0&&e.type[n]===pt.bulwark&&e.ext[n].mode>0&&(this.flags.brace=!0);if(e.tick>=this.nextCheck){const n=this.steps[this.idx];n&&n.check(t,this)&&(this.idx++,this.nextCheck=e.tick+20,t.hud.toast(`✓ ${n.title} complete`),this.idx>=this.steps.length&&(this.finished=!0,t.onTutorialDone()))}e.tick%10===0&&this.render()}}async finalize(){this.finished||!(this.g.sim.over&&this.g.sim.winner===0)||(this.idx=this.steps.length,this.finished=!0,await this.g.onTutorialDone())}render(){const t=this.steps[Math.min(this.idx,this.steps.length-1)],e=this.steps.map((n,s)=>`<li class="${s<this.idx?"done":s===this.idx?"cur":""}">${s+1}. ${n.title}</li>`).join("");this.g.hud.setTutorialPanel(`<h5>Tutorial · step ${Math.min(this.idx+1,this.steps.length)} / ${this.steps.length}</h5><b>${t.title}</b><br>${t.text}<ul class="steps">${e}</ul>`),this.g.hud.setObjective("Objective",this.idx>=this.steps.length?"Tutorial complete!":t.title)}}const pa=1/20;class vg{constructor(t,e,n,s){this.app=t,this.opts=n,this.settings=s;const r=n.replay?n.replay.cfg:{seed:n.seed,factions:[n.faction,n.enemy],ai:[null,n.difficulty],mode:n.mode==="tutorial"?"tutorial":"skirmish",passiveAi:n.mode==="tutorial",startOre:n.mode==="tutorial"?450:void 0};this.sim=new qh(r),this.local=n.mode==="replay"?-1:0,this.root=document.createElement("div"),this.root.id="game",e.appendChild(this.root),this.viewport=document.createElement("div"),this.viewport.id="viewport",this.root.appendChild(this.viewport),this.renderer=new ug(this.viewport,this.sim,s),this.input=new fg(this,this.viewport),this.hud=new gg(this,this.root),this.view=this.input.buildView(),this.centerOnBase(!0),this.renderer.cam.targetHeight=this.renderer.cam.height=34,n.mode==="tutorial"?(this.tutorial=new yg(this),this.tutorial.render()):n.mode==="skirmish"&&this.hud.setObjective("Objective","Destroy the enemy base"),n.mode==="replay"&&this.buildReplayBar(),_t.init(),_t.setVolumes(s,s.masterMuted),_t.startMusic(this.sim.players[0].faction.id),this.onVis=()=>{document.hidden&&this.opts.mode!=="replay"&&!this.paused&&this.openPause()},document.addEventListener("visibilitychange",this.onVis),this.onResize=()=>this.renderer.resize(),window.addEventListener("resize",this.onResize);const a=this.renderer.renderer.domElement;a.addEventListener("webglcontextlost",()=>this.showContextLost(!0)),a.addEventListener("webglcontextrestored",()=>this.showContextLost(!1)),this.last=performance.now(),this.raf=requestAnimationFrame(o=>this.frame(o)),this.hud.refresh(!0)}sim;renderer;hud;input;tutorial=null;local;fogEnabled=!0;paused=!1;userPaused=!1;speed=1;acc=0;last=0;raf=0;view;viewport;root;alertPos=null;combat=0;endTimer=-1;ended=!1;replayIdx=0;pauseEl=null;fps=60;frameMs=16;fpsAcc=0;frames=0;markerT=0;lostEl=null;verified="pending";replayBar=null;onVis;onResize;bench=null;startBenchmark(){const t=this.sim;t.cfg.noVictory=!0;for(const l of t.players)l.ai=null;this.fogEnabled=!1;const e=l=>pt[l],n=["bulwark","bulwark","arc_lancer","bulwark","mortar_crawler","kestrel"],s=["thornling","thornling","sporecaster","thornling","carapace_guard","rift_stag"];for(let l=0;l<110;l++)t.spawn(e(n[l%n.length]),0,58+l%10*1.25,63+Math.floor(l/10)*1.25,{face:0}),t.spawn(e(s[l%s.length]),1,86-l%10*1.25,63+Math.floor(l/10)*1.25,{face:Math.PI});const r=t.ids.filter(l=>t.owner[l]===0&&t.td(l).isUnit&&!t.td(l).isWorker&&t.alive[l]),a=t.ids.filter(l=>t.owner[l]===1&&t.td(l).isUnit&&!t.td(l).isWorker&&t.alive[l]);t.issue({c:"order",ord:"attackMove",ids:r,x:86,y:72,player:0},!1),t.issue({c:"order",ord:"attackMove",ids:a,x:58,y:72,player:1},!1);const o=this.renderer.cam;o.setTarget(72,74,!0),o.targetHeight=o.height=40,this.bench={t0:performance.now(),frames:[],done:!1},this.hud.toast("Benchmark running for 20 s…")}finishBenchmark(){const t=this.bench;t.done=!0;const e=t.frames.slice(5).sort((r,a)=>r-a),n=e[Math.floor(e.length/2)]||16.7,s=e[Math.floor(e.length*.99)]||n;t.result={medianFps:+(1e3/n).toFixed(1),low1Fps:+(1e3/s).toFixed(1),units:this.sim.ids.filter(r=>this.sim.alive[r]&&this.sim.td(r).isUnit).length,frames:e.length},window.__bench=t.result,this.hud.toast(`Benchmark: median ${t.result.medianFps} FPS · 1% low ${t.result.low1Fps} FPS · ${t.result.units} units`),this.settings.showStats=!0}localFaction(){return this.sim.players[Math.max(0,this.local)].faction.id}cmd(t){this.local<0||this.sim.over||this.paused||this.sim.issue({...t,player:this.local})}centerOnBase(t=!1){const e=this.sim,n=Math.max(0,this.local),s=e.ids.find(l=>e.alive[l]&&e.owner[l]===n&&F[e.type[l]].isHall),r=e.map.starts[n],a=s!==void 0?e.x[s]:r.x,o=s!==void 0?e.y[s]:r.y;this.renderer.cam.setTarget(a,o+3,t)}lastAlertPos(){return this.alertPos}debugLines(){if(!this.settings.showStats)return[];const t=this.sim,e=this.renderer;return[`FPS ${this.fps.toFixed(0)}  frame ${this.frameMs.toFixed(1)} ms`,`tick ${t.tick}  entities ${t.ids.length}  projectiles ${t.projectiles.length}`,`draw calls ${e.drawCalls}  tris ${(e.triangles/1e3).toFixed(0)}k`,`fog ${this.fogEnabled?"on":"off"}  speed x${this.speed}`]}frame(t){this.raf=requestAnimationFrame(r=>this.frame(r));let e=(t-this.last)/1e3;this.last=t,e>.25&&(e=.25),this.bench&&!this.bench.done&&this.bench.frames.push(e*1e3),this.fpsAcc+=e,this.frames++,this.fpsAcc>=.5&&(this.fps=this.frames/this.fpsAcc,this.frameMs=this.fpsAcc/this.frames*1e3,this.fpsAcc=0,this.frames=0);const n=this.sim;if(!this.paused&&!this.renderer.lost){this.acc+=e*this.speed;let r=0;for(;this.acc>=pa&&r<6&&(this.acc-=pa,this.stepSim(),r++,!n.over););r>=6&&(this.acc=0)}this.input.update(e),this.view=this.input.buildView();const s=this.paused?1:Math.min(1,this.acc/pa);this.renderer.render(n,s,e,this.view),_t.setListener(this.renderer.cam.tx,this.renderer.cam.tz),this.hud.update(e),this.tutorial?.update(),this.tutorial?.marker&&!this.tutorial.finished&&(this.markerT-=e,this.markerT<=0&&(this.markerT=1.6,this.renderer.vfx.ring(this.tutorial.marker.x,.2,this.tutorial.marker.y,.5,5,1.4,4646608))),this.updateReplayBar(),this.bench&&!this.bench.done&&performance.now()-this.bench.t0>2e4&&this.finishBenchmark(),this.endTimer>=0&&(this.endTimer-=e,this.endTimer<0&&this.finish())}stepSim(){const t=this.sim;if(this.opts.replay){const n=this.opts.replay.commands;for(;this.replayIdx<n.length&&(n[this.replayIdx].tick??0)<=t.tick;)t.applyCommand(n[this.replayIdx++])}t.step();const e=t.events;t.events=[],this.handleEvents(e),this.combat*=.995,t.tick%20===0&&_t.setIntensity(Math.min(1,this.combat/14)),this.opts.replay&&t.tick%100===0&&this.verifyHash(),t.over&&this.endTimer<0&&!this.ended&&(this.endTimer=1.8,this.local>=0&&_t.ui_(t.winner===this.local?"victory":"defeat"),this.hud.setObjective("Result",t.winner===this.local?"Victory":"Defeat"))}verifyHash(){const t=this.opts.replay,e=this.sim,n=t.hashes.find(r=>r[0]===e.tick),s=e.hashes.find(r=>r[0]===e.tick);n&&s&&(n[1]!==s[1]?this.verified="mismatch":this.verified!=="mismatch"&&(this.verified="ok"))}handleEvents(t){if(!t.length)return;const e=this.sim,n=this.local;this.renderer.handleEvents(e,t,this.view);const s=this.local>=0?e.players[this.local].faction.id:"helix";for(const r of t)switch(r.k){case"shot":{if(!(n<0||e.cellVisible(n,r.x,r.y)||e.cellVisible(n,r.tx??r.x,r.ty??r.y)))break;_t.world("shot_"+(r.vis==="weld"?"claw":r.vis??"rifle"),r.x,r.y),this.combat+=.25;break}case"hit":{if(n>=0&&!e.cellVisible(n,r.x,r.y))break;_t.world((r.a??0)>25?"impact_big":"impact",r.x,r.y),this.combat+=.3;break}case"death":{if(n>=0&&!e.cellVisible(n,r.x,r.y)&&r.owner!==n)break;const a=F[r.a??0];if(a.isNeutral||r.text==="cancel")break;_t.world(a.isStruct?"death_struct":"death",r.x,r.y),this.combat+=a.isStruct?2:.6;break}case"erupt":(n<0||e.cellVisible(n,r.x,r.y))&&_t.world("erupt",r.x,r.y);break;case"weld":(n<0||e.cellVisible(n,r.x,r.y))&&_t.world("heal",r.x,r.y);break;case"placed":r.owner===n&&_t.world("build",r.x,r.y);break;case"alert":(r.owner===n||r.vis==="pulse")&&(this.hud.pushAlert(r.text??"",r.vis??"info",r.x,r.y),r.vis==="attack"?(this.alertPos={x:r.x,y:r.y},this.input.lastAlert=this.alertPos,_t.ui_("attack")):r.vis==="built"?_t.ui_("complete"):r.vis==="trained"?_t.ui_("trained",s):r.vis==="researched"?_t.ui_("research"):r.vis==="supply"?_t.ui_("supply"):r.vis==="depleted"?_t.ui_("depleted"):r.vis==="captured"?_t.ui_("captured"):r.vis==="pod"?_t.ui_("pod"):r.vis==="pulse"&&_t.ui_("pulse"),r.vis==="attack"||r.vis);break;case"invalid":r.owner===n&&(this.hud.toast(r.text??"Invalid"),_t.ui_("error"));break;case"captured":r.owner===n&&_t.ui_("captured");break;case"pod":r.owner===n&&(_t.ui_("pod"),this.hud.pushAlert("Salvage pod: +100 Ore, +40 Flux","built",r.x,r.y));break}this.hud.refresh(!1)}openPause(){this.pauseEl||this.ended||(this.paused=!0,this.input.enabled=!1,this.pauseEl=this.app.showPauseMenu(this,()=>this.closePause()))}closePause(){this.pauseEl?.remove(),this.pauseEl=null,this.paused=!1,this.input.enabled=!0,this.last=performance.now(),this.renderer.renderer.domElement.focus()}showContextLost(t){if(t&&!this.lostEl){this.paused=!0;const e=document.createElement("div");e.className="ctxlost",e.innerHTML='<div class="panelbox"><h2>Graphics context lost</h2><p class="help">The GPU driver reset the graphics context. The match is paused and will resume automatically if the context is restored.</p><button class="btn primary" id="cl-menu">Return to main menu</button></div>',this.root.appendChild(e),e.querySelector("#cl-menu").onclick=()=>this.app.exitToMenu(),this.lostEl=e}else!t&&this.lostEl&&(this.lostEl.remove(),this.lostEl=null,this.pauseEl||(this.paused=!1))}buildReplayBar(){const t=document.createElement("div");t.className="replaybar hudbox",t.innerHTML=`<b style="letter-spacing:.2em;font-size:10px;color:#9fb3c4">REPLAY</b>
      <button class="btn small" data-s="0">Pause</button><button class="btn small" data-s="1">1×</button><button class="btn small" data-s="2">2×</button><button class="btn small" data-s="4">4×</button><button class="btn small" data-s="8">8×</button>
      <button class="btn small" data-a="fog">Fog: off</button><button class="btn small" data-a="exit">Exit</button><span id="rp-info" style="color:#9fb3c4;min-width:210px"></span>`,this.root.appendChild(t),this.replayBar=t,this.fogEnabled=!1,t.addEventListener("click",e=>{const n=e.target.closest("button");if(n){if(n.dataset.s!==void 0){const s=parseInt(n.dataset.s,10);s===0?this.userPaused=!this.userPaused:(this.speed=s,this.userPaused=!1),this.paused=this.userPaused}n.dataset.a==="fog"&&(this.fogEnabled=!this.fogEnabled,n.textContent="Fog: "+(this.fogEnabled?"on":"off")),n.dataset.a==="exit"&&this.app.exitToMenu()}})}updateReplayBar(){if(!this.replayBar)return;const t=this.replayBar.querySelector("#rp-info"),e=this.opts.replay,n=Math.floor(this.sim.tick/20),s=Math.floor(e.ticks/20),r=this.verified==="ok"?"✓ hashes match":this.verified==="mismatch"?"✗ HASH MISMATCH":"verifying…";t.textContent=`${Math.floor(n/60)}:${String(n%60).padStart(2,"0")} / ${Math.floor(s/60)}:${String(s%60).padStart(2,"0")} · ${r}`}async finish(){this.ended||(this.ended=!0,await this.tutorial?.finalize(),await this.app.onMatchEnd(this))}async onTutorialDone(){await this.app.markTutorialDone(),this.hud.pushAlert("Tutorial complete - badge earned","built",0,0)}replayRecord(){const t=this.sim;return{id:"r"+Date.now().toString(36),date:Date.now(),version:Mh,cfg:t.cfg,commands:t.log.slice(),hashes:t.hashes.slice(),ticks:t.tick,winner:t.winner,label:`${t.players[0].faction.name} vs ${t.players[1].faction.name}`}}dispose(){cancelAnimationFrame(this.raf),document.removeEventListener("visibilitychange",this.onVis),window.removeEventListener("resize",this.onResize),_t.stopMusic(),this.input.detach(),this.hud.dispose(),this.renderer.dispose(),this.pauseEl?.remove(),this.root.remove()}}const _g=["settings","history","replays","profile"];class ac{data=new Map;corrupt=!1;s(t){return this.data.has(t)||this.data.set(t,new Map),this.data.get(t)}async get(t,e){return this.s(t).get(e)}async put(t,e,n){this.s(t).set(e,n)}async list(t){return[...this.s(t).values()]}async del(t,e){this.s(t).delete(e)}}class bg{constructor(t){this.db=t}corrupt=!1;tx(t,e){return this.db.transaction(t,e).objectStore(t)}req(t){return new Promise((e,n)=>{t.onsuccess=()=>e(t.result),t.onerror=()=>n(t.error)})}async get(t,e){try{return await this.req(this.tx(t,"readonly").get(e))}catch{this.corrupt=!0;return}}async put(t,e,n){try{await this.req(this.tx(t,"readwrite").put(n,e))}catch{this.corrupt=!0}}async list(t){try{return await this.req(this.tx(t,"readonly").getAll())}catch{return this.corrupt=!0,[]}}async del(t,e){try{await this.req(this.tx(t,"readwrite").delete(e))}catch{this.corrupt=!0}}}async function Mg(){try{if(typeof indexedDB>"u")return new ac;const i=await new Promise((t,e)=>{const n=indexedDB.open("shardfront",1);n.onupgradeneeded=()=>{for(const s of _g)n.result.objectStoreNames.contains(s)||n.result.createObjectStore(s)},n.onsuccess=()=>t(n.result),n.onerror=()=>e(n.error),n.onblocked=()=>e(new Error("blocked"))});return new bg(i)}catch{return new ac}}const Ps={move:"m",stop:"s",hold:"h",attackMove:"a",patrol:"p",build:"b",rally:"r",focus:"f",cycle:"Tab",alert:" ",home:"Home",menu:"F10",panUp:"ArrowUp",panDown:"ArrowDown",panLeft:"ArrowLeft",panRight:"ArrowRight",rotateLeft:",",rotateRight:"."},Sg={move:"Move",stop:"Stop",hold:"Hold position",attackMove:"Attack-move",patrol:"Patrol",build:"Build menu",rally:"Rally point",focus:"Focus selection",cycle:"Cycle subtype",alert:"Jump to last alert",home:"Centre on base",menu:"Pause menu",panUp:"Pan up",panDown:"Pan down",panLeft:"Pan left",panRight:"Pan right",rotateLeft:"Rotate camera left",rotateRight:"Rotate camera right"};function wg(){return{quality:"high",renderScale:1,shadows:!0,effects:1,antialias:!0,palette:"default",reducedMotion:!1,edgeScroll:!1,wasdPan:!1,rotateCamera:!1,scrollSpeed:1,master:.8,sfx:.9,music:.5,ui:.9,subtitles:!0,keys:{...Ps},debugSurfaces:!1,showStats:!1,masterMuted:!1}}function Eg(i){const t=wg();if(!i||typeof i!="object")return t;const e=i,n={...t};for(const s of Object.keys(t)){const r=e[s],a=t[s];if(!(r===void 0||typeof r!=typeof a)){if(s==="keys"){n.keys={...Ps,...Object.fromEntries(Object.entries(r).filter(([o,l])=>o in Ps&&typeof l=="string"&&l.length<=12))};continue}n[s]=r}}return n.renderScale=Math.min(1.5,Math.max(.5,Number(n.renderScale)||1)),n}function Tg(i,t){i.quality=t,t==="low"&&(i.renderScale=.75,i.shadows=!1,i.effects=.5,i.antialias=!1),t==="medium"&&(i.renderScale=1,i.shadows=!0,i.effects=.8,i.antialias=!0),t==="high"&&(i.renderScale=1,i.shadows=!0,i.effects=1,i.antialias=!0)}const Ag=`
:root{--bg:#07090d;--panel:#0d1219;--panel2:#121923;--line:#2b3b4d;--glow:#46e6d0;--amber:#ffb347;--violet:#b57bff;--txt:#d7e4ee;--dim:#7d92a4;--bad:#ff6a5a;--good:#5dff8a;--p0:#3aa8ff;--p1:#ff6a3d}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:var(--bg);color:var(--txt);font-family:"Segoe UI",system-ui,Roboto,sans-serif;overflow:hidden;user-select:none;-webkit-user-select:none}
button{font:inherit;color:inherit}
#app{position:fixed;inset:0}
.screen{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(1200px 700px at 70% 20%,#14222d 0%,#07090d 65%);overflow:auto}
.screen::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(70,230,208,.04) 0 2px,transparent 2px 46px);pointer-events:none}
.title{font-size:64px;letter-spacing:.42em;font-weight:200;margin:0 0 4px;color:#e6fffb;text-shadow:0 0 28px rgba(70,230,208,.45)}
.subtitle{color:var(--dim);letter-spacing:.32em;font-size:12px;text-transform:uppercase;margin-bottom:34px}
.menu{display:flex;flex-direction:column;gap:10px;min-width:300px;z-index:1}
.btn{background:linear-gradient(180deg,#151e29,#0e141c);border:1px solid var(--line);padding:12px 22px;cursor:pointer;letter-spacing:.14em;text-transform:uppercase;font-size:13px;text-align:left;border-radius:2px;position:relative;transition:border-color .12s,box-shadow .12s,transform .08s}
.btn:hover{border-color:var(--glow);box-shadow:0 0 14px rgba(70,230,208,.22) inset,0 0 10px rgba(70,230,208,.15)}
.btn:active{transform:translateY(1px)}
.btn.primary{border-color:var(--glow);color:#eafffb}
.btn.small{padding:7px 12px;font-size:11px}
.btn:disabled{opacity:.4;cursor:not-allowed}
.panelbox{background:rgba(13,18,25,.94);border:1px solid var(--line);box-shadow:0 0 0 1px #000,0 12px 40px rgba(0,0,0,.5);padding:22px 26px;z-index:1;max-width:min(1180px,94vw);max-height:92vh;overflow:auto}
.panelbox h2{margin:0 0 14px;font-weight:300;letter-spacing:.28em;font-size:18px;text-transform:uppercase;color:#dffcf8}
.row{display:flex;gap:16px;align-items:stretch;flex-wrap:wrap}
.faction-card{flex:1;min-width:290px;max-width:420px;border:1px solid var(--line);padding:16px;cursor:pointer;background:linear-gradient(180deg,#121a24,#0b1017);position:relative;transition:border-color .12s,transform .1s}
.faction-card:hover{transform:translateY(-2px)}
.faction-card.sel{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc) inset,0 0 24px color-mix(in srgb,var(--acc) 28%,transparent)}
.faction-card h3{margin:0 0 2px;letter-spacing:.2em;font-weight:400;text-transform:uppercase;color:var(--acc)}
.faction-card .tag{color:var(--dim);font-size:12px;margin-bottom:10px;letter-spacing:.08em}
.faction-card p{font-size:13px;line-height:1.45;color:#b8c8d6;margin:6px 0}
.faction-card ul{margin:8px 0 0;padding-left:16px;font-size:12px;color:#9fb3c4;line-height:1.5}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.chip{border:1px solid var(--line);padding:3px 8px;font-size:11px;color:#a9bccb;background:#0a0f15}
.diff{display:flex;gap:8px;margin:8px 0}
.diff .btn{flex:1;text-align:center;padding:10px 6px}
.diff .btn.sel{border-color:var(--glow);background:#102a2a;color:#eafffb}
.help{font-size:12px;color:var(--dim);line-height:1.5;margin:6px 0 10px}
.mapprev{border:1px solid var(--line);background:#0a0f15}
table.t{border-collapse:collapse;width:100%;font-size:12px}
table.t td,table.t th{padding:5px 9px;border-bottom:1px solid #1a2531;text-align:left}
table.t th{color:var(--dim);font-weight:500;letter-spacing:.1em;text-transform:uppercase;font-size:11px}
.setrow{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:6px 0;border-bottom:1px solid #16202b;font-size:13px}
.setrow input[type=range]{width:180px;accent-color:var(--glow)}
.setrow select{background:#0e141c;color:var(--txt);border:1px solid var(--line);padding:4px 8px}
.keybtn{min-width:90px;text-align:center}
.tabs{display:flex;gap:4px;margin-bottom:14px;flex-wrap:wrap}
.tabs .btn{padding:7px 14px;font-size:11px}
.tabs .btn.sel{border-color:var(--glow);background:#102a2a}
/* ---------- in-game ---------- */
#game{position:absolute;inset:0;background:#000}
#viewport{position:absolute;inset:0;touch-action:none}
#hud{position:absolute;inset:0;pointer-events:none;z-index:5}
#hud>*{pointer-events:auto}
.hudbox{background:linear-gradient(180deg,rgba(18,25,35,.94),rgba(9,13,19,.96));border:1px solid var(--line);box-shadow:0 0 0 1px #000,0 0 18px rgba(70,230,208,.07) inset}
.topbar{position:absolute;top:8px;right:8px;display:flex;gap:2px;align-items:stretch;padding:4px 6px}
.res{display:flex;align-items:center;gap:7px;padding:3px 12px;border-right:1px solid #1c2733;min-width:92px}
.res:last-child{border-right:none}
.res .ic{width:18px;height:18px;flex:none}
.res .val{font-size:22px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1;letter-spacing:.02em}
.res .sub{font-size:10px;color:var(--dim);letter-spacing:.06em;display:block;margin-top:2px}
.res.warn .val{color:var(--bad);animation:blink .8s infinite}
.res.click{cursor:pointer}
.res.click:hover{background:#13202b}
@keyframes blink{50%{opacity:.45}}
.bases{position:absolute;top:62px;right:8px;display:flex;gap:6px}
.basechip{padding:3px 9px;font-size:11px;border:1px solid var(--line);background:rgba(9,13,19,.9);letter-spacing:.04em;color:#b8c8d6}
.basechip b{font-variant-numeric:tabular-nums}
.basechip.ok b{color:var(--good)}.basechip.over b{color:var(--amber)}.basechip.bad b{color:var(--bad)}
.objective{position:absolute;top:8px;left:50%;transform:translateX(-50%);padding:7px 22px;text-align:center;max-width:46vw;font-size:13px;letter-spacing:.04em}
.objective small{display:block;color:var(--dim);font-size:10px;letter-spacing:.22em;text-transform:uppercase;margin-bottom:2px}
.menubtn{position:absolute;top:8px;left:8px;padding:6px 12px;font-size:11px;letter-spacing:.16em;cursor:pointer;text-transform:uppercase}
.menubtn:hover{border-color:var(--glow)}
.alerts{position:absolute;top:44px;left:8px;display:flex;flex-direction:column;gap:4px;width:300px}
.alert{padding:5px 10px;font-size:12px;border-left:3px solid var(--glow);background:rgba(9,13,19,.9);animation:fadein .2s;cursor:pointer;letter-spacing:.03em}
.alert.attack{border-left-color:var(--bad);color:#ffd2cc}.alert.supply,.alert.invalid{border-left-color:var(--amber)}.alert.built,.alert.trained,.alert.researched{border-left-color:var(--good)}
@keyframes fadein{from{opacity:0;transform:translateX(-8px)}}
.toast{position:absolute;left:50%;bottom:216px;transform:translateX(-50%);padding:7px 16px;font-size:13px;border:1px solid var(--amber);background:rgba(20,16,8,.95);color:#ffe3b0;pointer-events:none;transition:opacity .25s}
.bottom{position:absolute;left:0;right:0;bottom:0;height:204px;display:flex;gap:6px;align-items:flex-end;padding:0 8px 8px;pointer-events:none}
.bottom>*{pointer-events:auto}
.minimap{width:204px;height:204px;padding:6px;flex:none}
.minimap canvas{width:190px;height:190px;display:block;cursor:crosshair;background:#05070a}
.selpanel{flex:1;height:190px;display:flex;gap:12px;padding:10px 14px;min-width:0;overflow:hidden}
.selpanel.empty{align-items:center;justify-content:center;color:var(--dim);font-size:12px;letter-spacing:.06em}
.portrait{width:96px;height:96px;border:1px solid var(--line);flex:none;position:relative;background:#06090d}
.portrait img{width:100%;height:100%;display:block}
.portrait .nm{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.65);font-size:10px;text-align:center;padding:2px;letter-spacing:.08em;text-transform:uppercase}
.info{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;font-size:12px}
.info h4{margin:0;font-size:16px;font-weight:500;letter-spacing:.1em;text-transform:uppercase}
.info .role{color:var(--dim);font-size:11px;letter-spacing:.06em}
.bar{height:8px;background:#05070a;border:1px solid #1c2733;position:relative;width:100%}
.bar>i{position:absolute;left:0;top:0;bottom:0;display:block}
.bar>span{position:absolute;right:4px;top:-3px;font-size:10px;font-variant-numeric:tabular-nums;color:#dfe}
.statline{display:flex;gap:14px;flex-wrap:wrap;color:#b9c9d6;font-size:12px}
.statline b{color:#fff;font-weight:600;font-variant-numeric:tabular-nums}
.grid{display:flex;flex-wrap:wrap;gap:4px;align-content:flex-start;overflow:hidden;flex:1}
.mini{width:42px;height:46px;border:1px solid var(--line);position:relative;cursor:pointer;background:#070a0f}
.mini img{width:100%;height:34px;display:block}
.mini .hp{position:absolute;left:0;right:0;bottom:0;height:5px;background:#05070a}
.mini .hp i{display:block;height:100%}
.mini.active{border-color:var(--glow);box-shadow:0 0 6px var(--glow)}
.queue{display:flex;gap:6px;margin-top:2px}
.qitem{width:46px;height:50px;border:1px solid var(--line);position:relative;cursor:pointer;background:#070a0f}
.qitem img{width:100%;height:36px;display:block}
.qitem .pg{position:absolute;left:0;bottom:0;height:5px;background:var(--glow)}
.qitem.paused{border-color:var(--amber)}
.qitem .pz{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:9px;background:rgba(40,28,6,.75);color:#ffd9a0;text-align:center;line-height:1.1}
.qitem:hover{border-color:var(--bad)}
.card{width:236px;height:190px;padding:7px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:5px;flex:none}
.cbtn{position:relative;border:1px solid var(--line);background:#0a0f15;cursor:pointer;overflow:hidden;padding:0}
.cbtn:hover:not(.dis){border-color:var(--glow);box-shadow:0 0 10px rgba(70,230,208,.3) inset}
.cbtn img{width:100%;height:100%;display:block;object-fit:cover;opacity:.95}
.cbtn .key{position:absolute;left:3px;top:2px;font-size:10px;font-weight:700;color:#fff;text-shadow:0 0 3px #000,0 0 3px #000;letter-spacing:.04em}
.cbtn .cost{position:absolute;right:2px;bottom:1px;font-size:9px;color:#dff;text-shadow:0 0 3px #000,0 0 3px #000;text-align:right;line-height:1.1}
.cbtn.dis{opacity:.45;cursor:not-allowed}
.cbtn.act{border-color:var(--amber);box-shadow:0 0 10px rgba(255,179,71,.5) inset}
.cbtn .cd{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.65)}
.cbtn .lbl{position:absolute;left:0;right:0;bottom:11px;font-size:8.5px;text-align:center;color:#cfe;text-shadow:0 0 3px #000;letter-spacing:.03em;line-height:1}
.tip{position:fixed;z-index:50;max-width:330px;padding:9px 12px;background:rgba(8,11,16,.97);border:1px solid var(--glow);font-size:12px;line-height:1.45;pointer-events:none;box-shadow:0 8px 30px rgba(0,0,0,.6)}
.tip b.n{font-size:14px;letter-spacing:.08em}
.tip .k{color:var(--amber);font-weight:700}
.tip .c{color:var(--dim);font-size:11px}
.tip .bonus{color:#ffd9a0}
.tip hr{border:0;border-top:1px solid #1d2a38;margin:6px 0}
.pause{position:absolute;inset:0;background:rgba(3,5,8,.72);display:flex;align-items:center;justify-content:center;z-index:30}
.errscreen{max-width:640px;text-align:left;line-height:1.6}
.errscreen h2{color:var(--bad)}
.loadbar{width:320px;height:4px;background:#111b24;margin-top:16px}
.loadbar i{display:block;height:100%;background:var(--glow);width:0;transition:width .15s}
.graph{background:#070a0f;border:1px solid var(--line)}
.stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 24px;font-size:13px;margin:10px 0 14px}
.stat-grid b{color:#fff}
.big{font-size:54px;letter-spacing:.3em;font-weight:200;margin:0}
.tut{position:absolute;left:12px;top:150px;width:290px;padding:10px 14px;font-size:13px;line-height:1.45}
.tut h5{margin:0 0 4px;color:var(--amber);letter-spacing:.2em;font-size:10px;text-transform:uppercase}
.tut .steps{margin:8px 0 0;padding:0;list-style:none;font-size:11px;color:var(--dim)}
.tut .steps li.done{color:var(--good);text-decoration:line-through}
.tut .steps li.cur{color:#fff}
.replaybar{position:absolute;left:50%;bottom:216px;transform:translateX(-50%);padding:6px 12px;display:flex;gap:6px;align-items:center;font-size:12px}
.ctxlost{position:absolute;inset:0;background:rgba(3,5,8,.85);display:flex;align-items:center;justify-content:center;z-index:40;text-align:center;line-height:1.7}
@media (max-width:1100px){.card{width:200px}.res{min-width:70px}.res .val{font-size:18px}}
`,je=i=>i.replace(/[&<>"]/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[t]),zi=i=>{const t=Math.floor(i/20);return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`},oc=()=>new Promise(i=>requestAnimationFrame(()=>i()));class Rg{constructor(t,e,n){this.root=t,this.repo=e,this.settings=n;const s=document.createElement("style");s.textContent=Ag,document.head.appendChild(s)}game=null;profile={xp:{helix:0,verdant:0},tutorialDone:!1,badges:[],banner:"default"};screen=null;lastOpts=null;async init(){const t=await this.repo.get("profile","main");t&&typeof t=="object"&&(this.profile={...this.profile,...t,xp:{helix:0,verdant:0,...t.xp??{}}}),document.getElementById("boot")?.remove();const e=fh();if(e.length){this.showError("Balance data failed validation",e.join("<br>"));return}this.showMenu()}setScreen(t){this.screen?.remove(),this.screen=t,this.root.appendChild(t)}mk(t,e){const n=document.createElement("div");return n.className=t,n.innerHTML=e,n}showError(t,e){const n=this.mk("screen",`<div class="panelbox errscreen"><h2>${je(t)}</h2><div class="help" style="font-size:14px">${e}</div></div>`);this.setScreen(n)}showMenu(){this.game?.dispose(),this.game=null,_t.stopMusic();const t=this.repo.corrupt?'<div class="help" style="color:#ffb347;max-width:420px;text-align:center">Local save data could not be read and was reset to defaults. Your match history may be missing.</div>':"",e=this.profile.xp,n=this.mk("screen",`
      <h1 class="title">SHARDFRONT</h1><div class="subtitle">Glass Ravine · Competitive RTS</div>
      <div class="menu">
        <button class="btn primary" data-a="play">Play · Skirmish</button>
        <button class="btn" data-a="tutorial">Tutorial${this.profile.tutorialDone?" · ✓ complete":""}</button>
        <button class="btn" data-a="archive">Tech Archive</button>
        <button class="btn" data-a="replays">Replays</button>
        <button class="btn" data-a="settings">Settings</button>
        <button class="btn" data-a="credits">Credits</button>
      </div>
      ${t}
      <div class="help" style="margin-top:26px;text-align:center">Helix mastery <b>${e.helix??0} XP</b> · Verdant mastery <b>${e.verdant??0} XP</b>${this.profile.badges.length?" · Badges: "+this.profile.badges.map(je).join(", "):""}<br>Desktop Chrome / Edge · keyboard &amp; mouse · single-player vs AI</div>`);n.querySelector(".menu").addEventListener("click",s=>{const r=s.target.closest("button")?.dataset.a;_t.init(),_t.ui_("click"),r==="play"?this.showPrematch("skirmish"):r==="tutorial"?this.showPrematch("tutorial"):r==="archive"?this.showArchive():r==="replays"?this.showReplays():r==="settings"?this.showSettings(()=>this.showMenu()):r==="credits"&&this.showCredits()}),this.setScreen(n)}pre={faction:"helix",enemy:"verdant",diff:"normal"};showPrematch(t){const e=()=>{const s=o=>{const l=Ss[o];return`<div class="faction-card${this.pre.faction===o?" sel":""}" data-f="${o}" style="--acc:${l.accent}">
          <h3>${l.name}</h3><div class="tag">${l.tagline}</div><p>${l.blurb}</p>
          <ul>${l.traits.map(c=>`<li>${je(c)}</li>`).join("")}</ul>
          <div class="chips">${l.units.map(c=>`<span class="chip">${zn(c).name}</span>`).join("")}</div></div>`},r=[["easy","Easy","Slow decisions, small late waves. Good for learning the economy."],["normal","Normal","Scouts you, expands, reads your composition and counters it. No cheats."],["hard","Hard","Faster decision cadence, earlier expansion, bigger multi-unit pushes. Still no resource or vision cheats."]];n.innerHTML=`
        <div class="panelbox" style="width:min(1100px,94vw)">
          <h2>${t==="tutorial"?"Tutorial · Helix Directorate":"Skirmish · Glass Ravine"}</h2>
          ${t==="tutorial"?'<p class="help">A guided 8-10 minute scenario: select, mine, build, produce, control groups, abilities, attack-move and destroy an enemy outpost. Instructions never pause the game.</p>':""}
          <div class="row">
            <div style="flex:2;min-width:600px"><div class="help" style="letter-spacing:.2em;text-transform:uppercase">Your faction</div><div class="row">${t==="tutorial"?s("helix"):s("helix")+s("verdant")}</div></div>
            <div style="flex:1;min-width:300px">
              <div class="help" style="letter-spacing:.2em;text-transform:uppercase">Map</div>
              <canvas id="pm-map" class="mapprev" width="260" height="260" style="width:260px;height:260px"></canvas>
              <div class="help">Two high-ground mains, defensible naturals, risky side expansions, a central canyon with two bridges, a lower route through the basin, crystal barriers, brush that hides units, and two capturable Watch Pylons.</div>
            </div>
          </div>
          ${t==="skirmish"?`
          <div class="help" style="letter-spacing:.2em;text-transform:uppercase;margin-top:12px">AI opponent</div>
          <div class="diff">${r.map(o=>`<button class="btn${this.pre.diff===o[0]?" sel":""}" data-d="${o[0]}">${o[1]}</button>`).join("")}</div>
          <div class="help">${r.find(o=>o[0]===this.pre.diff)[2]}</div>
          <div class="diff" style="max-width:520px">${["verdant","helix","random"].map(o=>`<button class="btn${this.pre.enemy===o?" sel":""}" data-e="${o}">Enemy: ${o==="random"?"Random":Ss[o].name}</button>`).join("")}</div>`:""}
          <div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn" data-a="back">← Back</button><button class="btn primary" data-a="start" style="min-width:240px;text-align:center">Start match</button></div>
        </div>`;const a=n.querySelector("#pm-map");this.drawMapPreview(a),n.querySelectorAll("[data-f]").forEach(o=>o.onclick=()=>{this.pre.faction=o.dataset.f,_t.ui_("click"),e()}),n.querySelectorAll("[data-d]").forEach(o=>o.onclick=()=>{this.pre.diff=o.dataset.d,_t.ui_("click"),e()}),n.querySelectorAll("[data-e]").forEach(o=>o.onclick=()=>{this.pre.enemy=o.dataset.e,_t.ui_("click"),e()}),n.querySelector("[data-a=back]").onclick=()=>this.showMenu(),n.querySelector("[data-a=start]").onclick=()=>{_t.init();const o=t==="tutorial"?"verdant":this.pre.enemy==="random"?Math.random()<.5?"helix":"verdant":this.pre.enemy,l=t==="tutorial"?"helix":this.pre.faction;this.startGame({mode:t,faction:l,enemy:o,difficulty:this.pre.diff,seed:Date.now()&16777215|1})}},n=this.mk("screen","");this.setScreen(n),e()}drawMapPreview(t){const e=uc(),n=e.size,s=t.getContext("2d"),r=s.createImageData(n,n);for(let l=0;l<n*n;l++){const c=e.heightC[l];let u=40+c*7,f=48+c*8,h=58+c*7;e.chasm[l]?(u=8,f=14,h=24):e.blocked[l]?(u=24,f=27,h=33,c>2&&(u=72,f=76,h=82)):e.brush[l]?(u=30,f=74,h=62):e.bridge[l]&&(u=170,f=140,h=74),r.data[l*4]=u,r.data[l*4+1]=f,r.data[l*4+2]=h,r.data[l*4+3]=255}const a=document.createElement("canvas");a.width=n,a.height=n,a.getContext("2d").putImageData(r,0,0),s.imageSmoothingEnabled=!1,s.drawImage(a,0,0,t.width,t.height);const o=t.width/n;for(const l of e.resources)s.fillStyle=l.kind==="ore"?"#44e9d0":"#ff8be0",s.fillRect(l.x*o-1.5,l.y*o-1.5,3,3);e.starts.forEach((l,c)=>{s.fillStyle=c===0?"#3aa8ff":"#ff6a3d",s.beginPath(),s.arc(l.x*o,l.y*o,6,0,Math.PI*2),s.fill()});for(const l of e.pylons)s.fillStyle="#e8f4ff",s.fillRect(l.x*o-3,l.y*o-3,6,6)}async startGame(t){this.lastOpts=t;const e=this.mk("screen",'<h1 class="title" style="font-size:40px">SHARDFRONT</h1><div class="subtitle" id="ld-t">Preparing the moon…</div><div class="loadbar"><i id="ld-b"></i></div>');this.setScreen(e);const n=async(s,r)=>{e.querySelector("#ld-t").textContent=s,e.querySelector("#ld-b").style.width=r+"%",await oc(),await oc()};try{await n("Fracturing the terrain…",25),await n("Growing models and effects…",55),this.game?.dispose(),this.game=new vg(this,this.root,t,this.settings),await n("Starting simulation…",100),this.screen?.remove(),this.screen=null,this.game.renderer.renderer.domElement.focus()}catch(s){console.error(s),this.game?.dispose(),this.game=null,this.showError("Could not start the match",`${je(String(s?.message??s))}<br><br>Try lowering the graphics preset in Settings, or reload the page.<br><br><button class="btn" id="err-back">Back to menu</button>`),this.screen?.querySelector("#err-back")?.addEventListener("click",()=>this.showMenu())}}exitToMenu(){this.showMenu()}async startBenchmark(){await this.startGame({mode:"skirmish",faction:"helix",enemy:"verdant",difficulty:"normal",seed:7}),this.game?.startBenchmark()}async markTutorialDone(){this.profile.tutorialDone=!0,this.profile.badges.includes("Tutorial graduate")||this.profile.badges.push("Tutorial graduate"),await this.repo.put("profile","main",this.profile)}async onMatchEnd(t){const e=t.sim,n=e.winner===0,s={id:"m"+Date.now().toString(36),date:Date.now(),duration:e.tick,faction:e.players[0].faction.name,enemy:e.players[1].faction.name,difficulty:t.opts.difficulty,result:n?"victory":"defeat",mode:t.opts.mode};let r="";if(t.opts.mode==="skirmish"){await this.repo.put("history",s.id,s);const a=(await this.repo.list("history")).sort((u,f)=>f.date-u.date);for(const u of a.slice(40))await this.repo.del("history",u.id);const o=t.replayRecord();r=o.id,await this.repo.put("replays",o.id,o);const l=(await this.repo.list("replays")).sort((u,f)=>f.date-u.date);for(const u of l.slice(8))await this.repo.del("replays",u.id);const c=e.players[0].faction.id;this.profile.xp[c]=(this.profile.xp[c]??0)+(n?100:30),n&&!this.profile.badges.includes("First victory")&&this.profile.badges.push("First victory"),n&&t.opts.difficulty==="hard"&&!this.profile.badges.includes("Hard AI defeated")&&this.profile.badges.push("Hard AI defeated"),await this.repo.put("profile","main",this.profile)}this.showPostGame(t,n,r)}showPostGame(t,e,n){const s=t.sim,[r,a]=s.players,o=this.mk("screen",""),l=r.stats,c=a.stats,u=m=>m.length?Math.max(...m):0,f=[...l.timeline.map(m=>({...m,who:0})),...c.timeline.map(m=>({...m,who:1}))].sort((m,x)=>m.tick-x.tick);o.innerHTML=`<div class="panelbox" style="width:min(1100px,95vw)">
      <h1 class="big" style="color:${e?"#5dffb0":"#ff7a6a"}">${t.opts.mode==="tutorial"?e?"TUTORIAL COMPLETE":"DEFEAT":e?"VICTORY":"DEFEAT"}</h1>
      <div class="help">${je(r.faction.name)} vs ${je(a.faction.name)} · ${je(t.opts.difficulty)} · duration <b>${zi(s.tick)}</b></div>
      <div class="row">
        <div style="flex:1;min-width:360px">
          <table class="t"><tr><th></th><th style="color:#3aa8ff">You</th><th style="color:#ff6a3d">Enemy</th></tr>
            <tr><td>Prism Ore collected</td><td>${Math.round(l.ore)}</td><td>${Math.round(c.ore)}</td></tr>
            <tr><td>Flux collected</td><td>${Math.round(l.flux)}</td><td>${Math.round(c.flux)}</td></tr>
            <tr><td>Units created</td><td>${l.created}</td><td>${c.created}</td></tr>
            <tr><td>Units lost</td><td>${l.lost}</td><td>${c.lost}</td></tr>
            <tr><td>Enemy units destroyed</td><td>${l.killed}</td><td>${c.killed}</td></tr>
            <tr><td>Structures built / lost</td><td>${l.structures} / ${l.structuresLost}</td><td>${c.structures} / ${c.structuresLost}</td></tr>
            <tr><td>Peak workers</td><td>${l.workersMax}</td><td>${c.workersMax}</td></tr>
            <tr><td>Peak army value</td><td>${u(l.armySamples)}</td><td>${u(c.armySamples)}</td></tr>
            <tr><td>First expansion</td><td>${l.firstExpandTick>=0?zi(l.firstExpandTick):"—"}</td><td>${c.firstExpandTick>=0?zi(c.firstExpandTick):"—"}</td></tr>
          </table>
        </div>
        <div style="flex:1;min-width:380px">
          <div class="help" style="margin:0">Army value over time</div><canvas id="g-army" class="graph" width="440" height="110" style="width:440px;height:110px"></canvas>
          <div class="help" style="margin:8px 0 0">Resources collected (cumulative)</div><canvas id="g-eco" class="graph" width="440" height="110" style="width:440px;height:110px"></canvas>
        </div>
      </div>
      <div class="help" style="letter-spacing:.2em;text-transform:uppercase;margin-top:10px">Timeline</div>
      <div style="max-height:150px;overflow:auto;border:1px solid var(--line);padding:6px 10px;font-size:12px;line-height:1.55">${f.filter(m=>m.kind!=="loss"||m.text.includes("Core")||m.text.includes("Heartgrove")).slice(0,60).map(m=>`<div><span style="color:#7d92a4">${zi(m.tick)}</span> <span style="color:${m.who===0?"#3aa8ff":"#ff6a3d"}">●</span> ${je(m.text)}</div>`).join("")}</div>
      <div class="row" style="margin-top:14px">
        ${t.opts.mode==="replay"?"":'<button class="btn primary" data-a="rematch">Rematch</button>'}
        ${n?'<button class="btn" data-a="replay">Watch replay</button>':""}
        <button class="btn" data-a="menu">Main menu</button>
      </div></div>`;const h=(m,x,g)=>{const p=o.querySelector(m),_=p.getContext("2d"),y=Math.max(x.length,g.length,2),v=Math.max(1,...x,...g);_.fillStyle="#070a0f",_.fillRect(0,0,p.width,p.height),_.strokeStyle="#16202b",_.lineWidth=1;for(let A=1;A<4;A++)_.beginPath(),_.moveTo(0,p.height/4*A),_.lineTo(p.width,p.height/4*A),_.stroke();for(const[A,R]of[[x,"#3aa8ff"],[g,"#ff6a3d"]])_.strokeStyle=R,_.lineWidth=2,_.beginPath(),A.forEach((w,E)=>{const M=E/(y-1)*(p.width-8)+4,b=p.height-6-w/v*(p.height-14);E?_.lineTo(M,b):_.moveTo(M,b)}),_.stroke()};this.setScreen(o),h("#g-army",l.armySamples,c.armySamples),h("#g-eco",l.econSamples,c.econSamples);const d=t.opts;o.querySelector("[data-a=rematch]")?.addEventListener("click",()=>void this.startGame({...d,seed:Date.now()&16777215|1})),o.querySelector("[data-a=menu]")?.addEventListener("click",()=>this.showMenu()),o.querySelector("[data-a=replay]")?.addEventListener("click",async()=>{const m=await this.repo.get("replays",n);m&&this.startGame({mode:"replay",faction:d.faction,enemy:d.enemy,difficulty:d.difficulty,seed:1,replay:m})}),this.game?.dispose(),this.game=null,this.lastOpts=d}showPauseMenu(t,e){const n=this.mk("pause",`<div class="panelbox" style="min-width:340px"><h2>Paused</h2><div class="menu" style="min-width:0">
      <button class="btn primary" data-a="resume">Resume</button>
      <button class="btn" data-a="settings">Settings</button>
      ${t.opts.mode==="skirmish"?'<button class="btn" data-a="surrender">Surrender</button>':""}
      ${t.opts.mode!=="replay"?'<button class="btn" data-a="restart">Restart match</button>':""}
      <button class="btn" data-a="quit">Quit to main menu</button></div>
      <div class="help" style="margin-top:12px">Esc / F10 resumes. Match state is saved locally only when a skirmish ends.</div></div>`);return t.root.appendChild(n),n.addEventListener("click",s=>{const r=s.target.closest("button")?.dataset.a;if(r)if(_t.ui_("click"),r==="resume")e();else if(r==="settings")n.style.display="none",this.showSettings(()=>{n.style.display="flex"},!0);else if(r==="surrender")e(),t.cmd({c:"surrender"});else if(r==="restart"){const a=t.opts;e(),this.startGame({...a,seed:Date.now()&16777215|1})}else r==="quit"&&this.showMenu()}),n}async saveSettings(){await this.repo.put("settings","main",this.settings),_t.setVolumes(this.settings,this.settings.masterMuted),this.game?.renderer.applySettings(this.settings)}showSettings(t,e=!1){let n="graphics";const s=this.mk(e?"pause":"screen","");s.style.zIndex="60";const r=this.settings,a=()=>{const o=(u,f,h,d,m)=>`<div class="setrow"><span>${f}</span><span><input type="range" data-r="${u}" min="${h}" max="${d}" step="${m}" value="${r[u]}"> <b>${r[u].toFixed(2)}</b></span></div>`,l=(u,f,h="")=>`<div class="setrow"><span>${f}<div class="help" style="margin:0">${h}</div></span><input type="checkbox" data-c="${u}" ${r[u]?"checked":""}></div>`;let c="";n==="graphics"&&(c=`
        <div class="setrow"><span>Graphics preset</span><select data-s="quality"><option value="low">Low (30 FPS fallback)</option><option value="medium">Medium</option><option value="high">High</option></select></div>
        ${o("renderScale","Render scale",.5,1.5,.05)}${l("shadows","Shadows","Cascade-style sun shadows follow the camera (disabled on Low).")}${o("effects","Effects density",.2,1,.1)}${l("antialias","Anti-aliasing","Applies when the next match starts.")}${l("showStats","Performance panel","FPS, frame time, draw calls.")}${l("debugSurfaces","Surface debug overlay (F3)","Walkable / blocked / hover-only / brush / bridge / ramp.")}`),n==="audio"&&(c=`${o("master","Master",0,1,.05)}${o("sfx","Effects bus",0,1,.05)}${o("music","Music bus",0,1,.05)}${o("ui","Alerts / UI bus",0,1,.05)}${l("masterMuted","Mute all")}`),n==="camera"&&(c=`${l("edgeScroll","Edge scrolling","Off by default. Arrow keys and middle-mouse drag always work.")}${l("wasdPan","WASD panning","Conflicts with the A / S unit hotkeys - leave off unless you rebind them.")}${l("rotateCamera","Camera rotation in 90° steps","Use the rotate keys (default , and .).")}${o("scrollSpeed","Scroll speed",.4,2,.1)}`),n==="controls"&&(c=`<div class="help">Click a binding, then press the new key. Esc cancels.</div><table class="t">${Object.keys(Ps).map(u=>`<tr><td>${Sg[u]??u}</td><td><button class="btn small keybtn" data-k="${u}">${je(r.keys[u]===" "?"Space":r.keys[u])}</button></td></tr>`).join("")}</table><div class="help">Command-card slots (production, build palette, abilities) use fixed positional keys: Q W E R / A S D F / Z X C V.<br>Fixed: Ctrl+1-9 assign group, 1-9 select, double-tap centres, Shift adds, Esc cancels.</div><button class="btn small" data-a="resetkeys">Reset bindings</button>`),n==="access"&&(c=`<div class="setrow"><span>Team colour palette<div class="help" style="margin:0">Team colours appear on every base ring, stripe, health bar and the minimap.</div></span><select data-s="palette"><option value="default">Default (blue / orange)</option><option value="deuter">Deuteranopia-safe (blue / yellow)</option><option value="tritan">Tritanopia-safe (magenta / green)</option></select></div>
        ${l("reducedMotion","Reduced motion","No camera impulse on siege impacts; fewer ambient particles.")}${l("subtitles","Show text alerts","Alert feed in the top-left of the screen.")}`),s.innerHTML=`<div class="panelbox" style="width:min(720px,94vw)"><h2>Settings</h2>
        <div class="tabs">${["graphics","audio","camera","controls","access"].map(u=>`<button class="btn small${n===u?" sel":""}" data-t="${u}">${u==="access"?"Accessibility":u==="camera"?"Camera & input":u}</button>`).join("")}</div>
        ${c}<div style="margin-top:16px"><button class="btn primary" data-a="done">Done</button></div></div>`,s.querySelectorAll("[data-t]").forEach(u=>u.onclick=()=>{n=u.dataset.t,a()}),s.querySelectorAll("[data-r]").forEach(u=>u.oninput=()=>{r[u.dataset.r]=parseFloat(u.value),u.nextElementSibling.textContent=parseFloat(u.value).toFixed(2),this.saveSettings()}),s.querySelectorAll("[data-c]").forEach(u=>u.onchange=()=>{r[u.dataset.c]=u.checked,this.saveSettings()}),s.querySelectorAll("[data-s]").forEach(u=>{const f=u.dataset.s;u.value=r[f],u.onchange=()=>{f==="quality"?Tg(r,u.value):r[f]=u.value,this.saveSettings(),f==="quality"&&a()}}),s.querySelectorAll("[data-k]").forEach(u=>{u.onclick=()=>{const f=u.dataset.k;u.textContent="press a key…";const h=d=>{if(d.preventDefault(),d.stopPropagation(),window.removeEventListener("keydown",h,!0),d.key!=="Escape"){const m=d.key.length===1?d.key.toLowerCase():d.key;for(const x of Object.keys(r.keys))x!==f&&r.keys[x]===m&&(r.keys[x]=r.keys[f]);r.keys[f]=m,this.saveSettings()}a()};window.addEventListener("keydown",h,!0)}}),s.querySelector("[data-a=resetkeys]")?.addEventListener("click",()=>{r.keys={...Ps},this.saveSettings(),a()}),s.querySelector("[data-a=done]").onclick=()=>{s.remove(),this.screen=e?this.screen:this.screen,t()}};a(),e?this.game?.root.appendChild(s):this.setScreen(s)}showArchive(){let t="helix";const e=this.mk("screen",""),n=()=>{const s=Ss[t],r=[...s.units,...s.structures].map(o=>{const l=zn(o);return`<div class="tip" style="position:static;display:block;max-width:none;pointer-events:auto"><div style="display:flex;gap:10px"><img src="${Hi(o)}" width="56" height="56" alt="">${"<div>"+uo(l)+"</div>"}</div></div>`}).join(""),a=s.upgrades.map(o=>nh(ze.find(l=>l.id===o),!1)).map(o=>`<div class="tip" style="position:static;display:block;max-width:none">${o}</div>`).join("");e.innerHTML=`<div class="panelbox" style="width:min(1180px,96vw)"><h2>Tech Archive</h2>
        <div class="tabs"><button class="btn small${t==="helix"?" sel":""}" data-t="helix">Helix Directorate</button><button class="btn small${t==="verdant"?" sel":""}" data-t="verdant">Verdant Chorus</button></div>
        <div class="help">${je(s.blurb)}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:8px">${r}</div>
        <h2 style="margin-top:16px">Upgrades</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px">${a}</div>
        <div style="margin-top:14px"><button class="btn" data-a="back">← Back</button></div></div>`,e.querySelectorAll("[data-t]").forEach(o=>o.onclick=()=>{t=o.dataset.t,n()}),e.querySelector("[data-a=back]").onclick=()=>this.showMenu()};n(),this.setScreen(e)}async showReplays(){const t=this.mk("screen","");this.setScreen(t);const[e,n]=await Promise.all([this.repo.list("replays"),this.repo.list("history")]);e.sort((s,r)=>r.date-s.date),n.sort((s,r)=>r.date-s.date),t.innerHTML=`<div class="panelbox" style="width:min(900px,94vw)"><h2>Replays</h2>
      <div class="help">Replays store the seed and every validated command. Playback re-simulates the match and checks periodic state hashes against the recording.</div>
      ${e.length?`<table class="t"><tr><th>Date</th><th>Match</th><th>Length</th><th>Result</th><th></th></tr>${e.map(s=>`<tr><td>${new Date(s.date).toLocaleString()}</td><td>${je(s.label)}</td><td>${zi(s.ticks)}</td><td>${s.winner===0?"Victory":"Defeat"}</td><td><button class="btn small" data-w="${s.id}">Watch</button> <button class="btn small" data-x="${s.id}">Delete</button></td></tr>`).join("")}</table>`:'<p class="help">No replays yet. Finish a skirmish and it will appear here.</p>'}
      <h2 style="margin-top:18px">Match history</h2>
      ${n.length?`<table class="t"><tr><th>Date</th><th>Faction</th><th>Opponent</th><th>Level</th><th>Length</th><th>Result</th></tr>${n.slice(0,12).map(s=>`<tr><td>${new Date(s.date).toLocaleDateString()}</td><td>${je(s.faction)}</td><td>${je(s.enemy)}</td><td>${je(s.difficulty)}</td><td>${zi(s.duration)}</td><td style="color:${s.result==="victory"?"#5dff8a":"#ff7a6a"}">${s.result}</td></tr>`).join("")}</table>`:'<p class="help">No matches yet.</p>'}
      <div style="margin-top:14px"><button class="btn" data-a="back">← Back</button></div></div>`,t.querySelector("[data-a=back]").onclick=()=>this.showMenu(),t.querySelectorAll("[data-w]").forEach(s=>s.onclick=()=>{const r=e.find(a=>a.id===s.dataset.w);this.startGame({mode:"replay",faction:r.cfg.factions[0],enemy:r.cfg.factions[1],difficulty:r.cfg.ai[1]??"normal",seed:1,replay:r})}),t.querySelectorAll("[data-x]").forEach(s=>s.onclick=async()=>{await this.repo.del("replays",s.dataset.x),this.showReplays()})}showCredits(){const t=this.mk("screen",`<div class="panelbox" style="width:min(720px,94vw)"><h2>Credits</h2>
      <p class="help" style="font-size:13px">Shardfront is an original design. All factions, units, structures, maps, interface art, sounds and music are procedurally generated at runtime; no third-party game assets are used and nothing is derived from any existing franchise.</p>
      <p class="help" style="font-size:13px">Built with TypeScript, <b>Three.js</b> (MIT) for rendering and <b>Vite</b> (MIT) for tooling. Tests run on <b>Vitest</b>.<br>Audio is synthesised with the Web Audio API.</p>
      <p class="help">Single-player prototype - vertical slice. See ASSETS.md for the asset manifest.</p>
      <div><button class="btn" data-a="back">← Back</button></div></div>`);t.querySelector("[data-a=back]").onclick=()=>this.showMenu(),this.setScreen(t)}}function lc(i,t){document.getElementById("boot")?.remove();const e=document.getElementById("app");e.innerHTML=`<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#07090d;color:#d7e4ee;font-family:system-ui,sans-serif"><div style="max-width:640px;padding:28px 34px;border:1px solid #2b3b4d;background:#0d1219;line-height:1.6"><h2 style="margin:0 0 12px;color:#ff6a5a;font-weight:400;letter-spacing:.15em;text-transform:uppercase">${i}</h2><div style="color:#b8c8d6;font-size:14px">${t}</div></div></div>`}function Cg(){try{return document.createElement("canvas").getContext("webgl2")?null:"webgl2"}catch{return"webgl2"}}async function Pg(){if(Cg()){lc("WebGL 2 is required","Shardfront needs a browser with WebGL 2 and hardware acceleration.<br><br>• Use a current desktop Chrome or Edge.<br>• Make sure hardware acceleration is enabled (Settings → System).<br>• Update your graphics driver, then reload this page.");return}const t=document.getElementById("app");try{const e=await Mg(),n=await e.get("settings","main"),s=Eg(n),r=new Rg(t,e,s);window.__app=r,window.__defIndex=pt,window.__createAI=xc,await r.init(),new URLSearchParams(location.search).has("bench")&&await r.startBenchmark()}catch(e){console.error(e),lc("Something went wrong while starting",`${String(e?.message??e).replace(/[<>&]/g,"")}<br><br>Reload the page. If the problem persists, clear this site's data and try again.`)}}window.addEventListener("error",i=>{console.error(i.error??i.message)});Pg();
