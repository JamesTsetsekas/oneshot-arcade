(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=e(i);fetch(i.href,s)}})();const ot=(r,t,e,n)=>[r,t,e,n],si=[{id:"brannoch",name:"Brannoch",title:"Bastion Mason",role:"Vanguard",difficulty:1,blurb:"A walking fortress who builds cover mid-fight and leaps across the lane to break formations.",resource:"mana",hp:640,hpGrow:98,mana:260,manaGrow:34,ad:56,adGrow:3.4,armor:34,armorGrow:4.2,ward:28,wardGrow:1.8,as:.72,asGrow:.018,ms:3.5,range:1.9,windup:.32,radius:.65,projSpeed:0,hpRegen:1.8,manaRegen:1,color:13221806,accent:13933114,jungle:1,passive:{name:"Set in Stone",desc:"After standing near an enemy hero for 3s, gain a stacking armor and ward bonus (up to 5 stacks). Moving away decays the stacks."},abilities:[{slot:0,key:"Q",name:"Fault Hammer",targeting:"dir",range:3.8,size:3.8,shape:"cone",castTime:.3,cd:ot(7,6.5,6,5.5),cost:ot(30,35,40,45),v:{dmg:ot(70,110,150,190),slow:ot(30,35,40,45),bonus:ot(40,60,80,100)},desc:"Slam the ground in front. Deals {dmg} + 80% AD physical damage. The outer edge slows by {slow}% for 1.5s; the inner edge deals {bonus} bonus stagger damage.",ai:"skillshot",tags:["damage","slow"],power:1,icon:"⚒"},{slot:1,key:"W",name:"Rampart Fold",targeting:"dir",range:4.5,size:2.6,shape:"rect",castTime:.15,cd:ot(16,15,14,13),cost:ot(50,55,60,65),v:{hp:ot(260,360,460,560)},desc:"Raise a curved stone wall for 3s ({hp} health). It blocks movement and projectiles of both teams and can be broken.",ai:"self",tags:["terrain"],power:1,icon:"▥"},{slot:2,key:"E",name:"Anchor Line",targeting:"point",range:10,size:1,shape:"circle",castTime:.1,cd:ot(14,13,12,11),cost:ot(40,40,40,40),recast:4,v:{shield:ot(70,110,150,190)},desc:"Throw an anchor to a point (or an allied hero). Recast within 4s to haul yourself to it and gain a {shield} shield for 2.5s.",ai:"engage",tags:["mobility","shield"],power:1,icon:"⚓"},{slot:3,key:"R",name:"Citybreaker",targeting:"point",range:11,size:4.2,shape:"circle",castTime:.75,cd:ot(90,70,70,70),cost:ot(100,120,120,120),ult:!0,v:{dmg:ot(220,340,340,340)},desc:"After a telegraphed wind-up, leap to the target area (max 11m). Deals {dmg} + 100% AD physical damage and knocks enemies up for 1.1s.",ai:"engage",tags:["knockup","mobility"],power:3,icon:"☄"}],builds:[{name:"Unbreakable Wall",why:"Stack health and armor to hold the front line against physical teams.",items:["brace","ironwood","platescrap","kilnheart","stalwart","aegis"]},{name:"Siege Breaker",why:"Trade some bulk for damage to crack towers and bruise carries.",items:["whetstone","sinew","ironwood","tithe","maul","swiftsole"]}]},{id:"suri",name:"Suri Vale",title:"Ember Courier",role:"Marksman",difficulty:2,blurb:"A mobile ranged carrier who delivers burning parcels and one very long, very late corridor shot.",resource:"mana",hp:540,hpGrow:82,mana:280,manaGrow:36,ad:58,adGrow:3.6,armor:24,armorGrow:3.4,ward:26,wardGrow:1.6,as:.8,asGrow:.024,ms:3.6,range:7.2,windup:.28,radius:.5,projSpeed:20,hpRegen:1.3,manaRegen:1.1,color:15234634,accent:16761930,jungle:1,passive:{name:"Hot Route",desc:"Moving 3 meters charges your next basic attack with Ember damage. Attacking repeatedly without moving loses the bonus."},abilities:[{slot:0,key:"Q",name:"Ricochet Bolt",targeting:"dir",range:13,size:.7,shape:"line",castTime:.22,cd:ot(8,7.5,7,6.5),cost:ot(45,50,55,60),v:{dmg:ot(60,100,140,180)},desc:"Fire a bolt that bounces once off terrain. Deals {dmg} + 90% AD physical damage to the first enemy hit.",ai:"skillshot",tags:["damage","bounce"],power:1,icon:"➶"},{slot:1,key:"W",name:"Slipstream",targeting:"dir",range:5.5,size:1.6,shape:"line",castTime:.05,cd:ot(14,13,12,11),cost:ot(40,40,40,40),v:{speed:ot(30,35,40,45)},desc:"Dash forward, leaving a speed lane for 3s. The first time each ally crosses it they gain +{speed}% move speed for 1.5s.",ai:"escape",tags:["dash"],power:1,icon:"≋"},{slot:2,key:"E",name:"Parcel Charge",targeting:"unit",range:8,size:2.4,shape:"unit",castTime:.2,cd:ot(12,11.5,11,10.5),cost:ot(50,55,60,65),v:{dmg:ot(80,130,180,230)},desc:"Attach a charge to an enemy for 3s. Each attack on it speeds detonation by 0.5s. Detonates for {dmg} + 70% AD in a small area.",ai:"unit",tags:["damage","mark"],power:1,icon:"✺"},{slot:3,key:"R",name:"Redline Delivery",targeting:"dir",range:30,size:1.6,shape:"line",castTime:.9,cd:ot(100,85,85,85),cost:ot(100,100,100,100),ult:!0,v:{dmg:ot(200,320,320,320)},desc:"Channel for 0.9s (revealing you), then fire a corridor shot across the lane. Deals {dmg} + 120% AD, up to +60% more by travel distance.",ai:"skillshot",tags:["damage","reveal"],power:3,icon:"➤"}],builds:[{name:"Sunspoke Carry",why:"Attack speed and bolts for sustained dps against tanks and towers.",items:["whetstone","gale","sinew","sunspoke","swiftsole","glassfang"]},{name:"Glassfang Sniper",why:"Armor penetration for burst against squishy teams.",items:["whetstone","keenedge","sinew","glassfang","riverglass","tithe"]}]},{id:"oru",name:"Oru",title:"Choir of Moths",role:"Support",difficulty:2,blurb:"A swarm-caller who shields allies, blinds the enemy with a hush, and shields entire teams with a wave.",resource:"mana",hp:520,hpGrow:80,mana:340,manaGrow:44,ad:48,adGrow:2.6,armor:22,armorGrow:3.2,ward:30,wardGrow:2,as:.68,asGrow:.016,ms:3.55,range:6.2,windup:.3,radius:.5,projSpeed:15,hpRegen:1.4,manaRegen:1.7,color:12167400,accent:8384767,jungle:0,passive:{name:"Shared Wing",desc:"Shields Oru grants return 20% of their value to Oru as health after 3s, if they were not broken."},abilities:[{slot:0,key:"Q",name:"Luminous Swarm",targeting:"dir",range:11,size:.9,shape:"line",castTime:.2,cd:ot(7,6.5,6,5.5),cost:ot(50,55,60,65),v:{dmg:ot(60,100,140,180),shield:ot(70,110,150,190)},desc:"A slow swarm that deals {dmg} + 60% AP arcane damage to the first enemy, or shields the first ally for {shield}.",ai:"skillshot",tags:["damage","shield"],power:1,icon:"❋"},{slot:1,key:"W",name:"Hush Field",targeting:"point",range:9,size:4.2,shape:"circle",castTime:.2,cd:ot(16,15,14,13),cost:ot(70,75,80,85),v:{dur:ot(3.5,4,4.5,5)},desc:"Create a field for {dur}s. Enemy heroes inside have their vision radius halved and are marked HUSHED. Telegraphs stay visible.",ai:"point",tags:["zone","vision"],power:2,icon:"◌"},{slot:2,key:"E",name:"Guiding Draft",targeting:"ally",range:9,size:1.2,shape:"unit",castTime:.15,cd:ot(13,12,11,10),cost:ot(60,60,60,60),v:{speed:ot(25,30,35,40)},desc:"An allied hero gains +{speed}% move speed for 3s. Their next ability to hit an enemy hero marks it for team vision for 4s.",ai:"ally",tags:["buff","vision"],power:1,icon:"➳"},{slot:3,key:"R",name:"Night Migration",targeting:"dir",range:20,size:4,shape:"line",castTime:.45,cd:ot(100,85,85,85),cost:ot(120,120,120,120),ult:!0,v:{shield:ot(150,240,240,240),dmg:ot(80,140,140,140)},desc:"Send a wide wave. Allied heroes it passes gain a {shield} shield; enemies at the leading edge take {dmg} + 50% AP and are rooted for 1.1s.",ai:"skillshot",tags:["shield","root"],power:3,icon:"✦"}],builds:[{name:"Choir Warden",why:"Shield strength and mana to keep a lane partner alive.",items:["lantern","mote","veilthread","beacon","stalwart","nullbell"]},{name:"Hexing Songstress",why:"Ability power and haste to lean on swarm damage and cooldowns.",items:["quill","glyph","inkwell","quietindex","riverglass","tempest"]}]},{id:"kesh",name:"Kesh",title:"Mirebound",role:"Fighter",difficulty:2,blurb:"A swamp predator who farms the jungle, hunts marked prey and claims the ground he fights on.",resource:"mana",hp:600,hpGrow:92,mana:240,manaGrow:28,ad:60,adGrow:3.5,armor:30,armorGrow:3.8,ward:28,wardGrow:1.7,as:.74,asGrow:.021,ms:3.55,range:2,windup:.3,radius:.6,projSpeed:0,hpRegen:2,manaRegen:.9,color:5937752,accent:14280314,jungle:3,passive:{name:"Predator's Patience",desc:"The first monster or hero you damage is marked. Attacking the same mark heals you slightly (6s cooldown)."},abilities:[{slot:0,key:"Q",name:"Reed Cleaver",targeting:"dir",range:3.4,size:3.4,shape:"cone",castTime:.2,cd:ot(6,5.5,5,4.5),cost:ot(30,30,35,35),recast:2.2,v:{dmg:ot(55,90,125,160),miss:ot(8,10,12,14)},desc:"Cleave a cone for {dmg} + 60% AD. Recast within 2.2s for a second swing that also deals {miss}% of the target's missing health.",ai:"skillshot",tags:["damage"],power:1,icon:"⚔"},{slot:1,key:"W",name:"Bogskin",targeting:"self",range:0,size:4,shape:"self",castTime:.05,cd:ot(15,14,13,12),cost:ot(50,50,50,50),v:{dr:ot(35,40,45,50)},desc:"For 2s take {dr}% less damage. When it ends, enemies nearby are slowed in proportion to the damage absorbed (up to 50%).",ai:"self",tags:["defense","slow"],power:1,icon:"◍"},{slot:2,key:"E",name:"Sinkstep",targeting:"dir",range:7,size:1,shape:"line",castTime:.05,cd:ot(14,13,12,11),cost:ot(40,40,40,40),v:{as:ot(30,35,40,45)},desc:"Burrow up to 7m, ignoring units, then emerge with +{as}% attack speed for 3s.",ai:"engage",tags:["dash"],power:1,icon:"↯"},{slot:3,key:"R",name:"Fen Claim",targeting:"self",range:0,size:6,shape:"self",castTime:.2,cd:ot(95,80,80,80),cost:ot(100,100,100,100),ult:!0,v:{dur:ot(6,7,7,7)},desc:"Create a marsh around you for {dur}s. You move faster in it; enemies are slowed 30% and leave visible wakes.",ai:"self",tags:["zone","slow"],power:3,icon:"❂"}],builds:[{name:"Predator",why:"Damage and sustain to dominate skirmishes and the jungle.",items:["totem","sinew","ironwood","tithe","swiftsole","maul"]},{name:"Bog Bulwark",why:"Resistances so Bogskin and Fen Claim keep him in the fight.",items:["brace","platescrap","mote","thornmail","stalwart","aegis"]}]},{id:"ilyra",name:"Ilyra Quill",title:"Archive Exile",role:"Mage",difficulty:3,blurb:"An artillery mage who annotates enemies with spells, erases their magic and rewrites a battlefield with rings of text.",resource:"mana",hp:500,hpGrow:76,mana:380,manaGrow:46,ad:46,adGrow:2.4,armor:20,armorGrow:3,ward:28,wardGrow:1.7,as:.66,asGrow:.015,ms:3.45,range:6.8,windup:.32,radius:.5,projSpeed:16,hpRegen:1.2,manaRegen:1.7,color:7311336,accent:16769658,jungle:0,passive:{name:"Margin Notes",desc:"Each of your abilities that hits adds a unique annotation. At three different annotations the target takes an Arcane burst."},abilities:[{slot:0,key:"Q",name:"Linebreak",targeting:"dir",range:14,size:.7,shape:"line",castTime:.25,cd:ot(7,6.5,6,5.5),cost:ot(55,60,65,70),v:{dmg:ot(70,115,160,205)},desc:"A narrow piercing line. Deals {dmg} + 70% AP arcane damage, reduced by 30% after the first hero.",ai:"skillshot",tags:["damage","pierce"],power:1,icon:"⟶"},{slot:1,key:"W",name:"Footnote",targeting:"point",range:9,size:1.6,shape:"circle",castTime:.15,cd:ot(14,13,12,11),cost:ot(40,40,40,40),v:{copy:ot(40,40,40,40)},desc:"Place a sigil for 6s. The next Linebreak that passes through it repeats at {copy}% power from the sigil at a new angle.",ai:"point",tags:["sigil"],power:1,icon:"※"},{slot:2,key:"E",name:"Redaction",targeting:"point",range:8,size:3.2,shape:"rect",castTime:.3,cd:ot(15,14,13,12),cost:ot(60,65,70,75),v:{dmg:ot(50,80,110,140),sil:ot(1,1.1,1.2,1.3)},desc:"Strike a rectangle: {dmg} + 40% AP, silence heroes for {sil}s, and erase enemy non-ultimate projectiles and zones inside.",ai:"point",tags:["silence","erase"],power:2,icon:"▭"},{slot:3,key:"R",name:"Final Draft",targeting:"point",range:11,size:5.5,shape:"circle",castTime:.3,cd:ot(100,85,85,85),cost:ot(120,120,120,120),ult:!0,v:{dmg:ot(90,150,150,150)},desc:"Three expanding manuscript rings strike the area for {dmg} + 40% AP each. The final ring stuns enemies hit by both earlier rings.",ai:"point",tags:["damage","stun"],power:3,icon:"◎"}],builds:[{name:"Archive Burst",why:"Pure ability power for rotation damage.",items:["quill","glyph","glyph","aethercrown","riverglass","quietindex"]},{name:"Tempo Scribe",why:"Haste and mana to spam lines and rings through fights.",items:["quill","inkwell","glyph","tempest","swiftsole","quietindex"]}]},{id:"vey",name:"Vey",title:"Glassknife",role:"Assassin",difficulty:3,blurb:"A roaming assassin who vanishes into brush, splits to a decoy and pins a hero with a prism sentence.",resource:"energy",hp:530,hpGrow:84,mana:200,manaGrow:0,ad:62,adGrow:3.6,armor:26,armorGrow:3.5,ward:26,wardGrow:1.6,as:.82,asGrow:.022,ms:3.9,range:1.8,windup:.26,radius:.5,projSpeed:0,hpRegen:1.5,manaRegen:4.2,color:15133183,accent:16734930,jungle:2,passive:{name:"Refraction",desc:"After entering brush or staying unseen for 1.5s, your next attack from a new angle gains armor penetration and bonus damage. A glint warns nearby targets."},abilities:[{slot:0,key:"Q",name:"Shardstep",targeting:"unit",range:8,size:1.2,shape:"unit",castTime:.05,cd:ot(8,7,6,5),cost:ot(40,40,40,40),v:{dmg:ot(60,100,140,180)},desc:"Dash through an enemy, dealing {dmg} + 70% AD. Cannot hit the same target again for 4s.",ai:"unit",tags:["dash","damage"],power:1,icon:"✧"},{slot:1,key:"W",name:"Mirror Decoy",targeting:"point",range:12,size:1,shape:"circle",castTime:.1,cd:ot(16,15,14,13),cost:ot(50,50,50,50),recast:3,v:{swap:ot(10,10,10,10)},desc:"Send a harmless decoy to a point. Recast within 3s to swap places, if you are within {swap}m of it.",ai:"escape",tags:["decoy","mobility"],power:1,icon:"◈"},{slot:2,key:"E",name:"Cut the Light",targeting:"dir",range:5,size:5,shape:"cone",castTime:.25,cd:ot(11,10,9,8),cost:ot(50,50,50,50),v:{dmg:ot(55,90,125,160)},desc:"Strike a cone for {dmg} + 60% AD to heroes and minions. Wards hit are disabled for 5s.",ai:"skillshot",tags:["damage","ward"],power:1,icon:"◣"},{slot:3,key:"R",name:"Prism Sentence",targeting:"unit",range:9,size:1.4,shape:"unit",castTime:.2,cd:ot(90,75,75,75),cost:ot(100,100,100,100),ult:!0,v:{dmg:ot(220,340,340,340)},desc:"Mark a hero. After 1.2s strike from the current angle for {dmg} + 100% AD and blink to them. If they break line of sight, damage is halved and the blink is canceled.",ai:"unit",tags:["damage","blink","mark"],power:3,icon:"❖"}],builds:[{name:"Glass Cutter",why:"Penetration and burst to delete backline targets.",items:["whetstone","keenedge","sinew","glassfang","riverglass","tithe"]},{name:"Duelist",why:"Lifesteal and health to win extended skirmishes.",items:["totem","sinew","ironwood","tithe","swiftsole","maul"]}]}],Ut=Object.fromEntries(si.map(r=>[r.id,r]));function Xh(r,t,e){const n=r.v[t];return n[Math.max(0,Math.min(n.length-1,e-1))]}function Dc(r,t){return r.desc.replace(/\{(\w+)\}/g,(e,n)=>{const i=r.v[n];return i?t>0?String(i[Math.min(i.length-1,t-1)]):Array.from(new Set(i)).join("/"):"?"})}const To=[{id:"skyhop",name:"Skyhop",desc:"Blink 6m toward the cursor.",cd:75,icon:"⇱"},{id:"mend",name:"Mend",desc:"Restore 14% of max health (doubled below 40% health).",cd:70,icon:"✚"},{id:"aegis",name:"Aegis Pulse",desc:"Gain a shield worth 12% max health + 60 for 3s.",cd:60,icon:"◉"},{id:"sprint",name:"Windrunner",desc:"Gain +35% move speed for 3s.",cd:55,icon:"»"},{id:"cinder",name:"Cinder Mark",desc:"Burn the nearest enemy hero within 6m for 60 + 10/level true damage over 3s.",cd:70,icon:"♨"},{id:"purify",name:"Purify",desc:"Cleanse slows, roots, silences and stuns (not airborne).",cd:90,icon:"❂"}],Pa=Object.fromEntries(To.map(r=>[r.id,r])),Qt=r=>r,Un=[Qt({id:"whetstone",name:"Whetstone Blade",tier:"starter",cat:"attack",cost:450,stats:{ad:9,hp:40},icon:"🗡",color:"#e0a040",tags:["Marksman","Assassin","Fighter"],passive:"Hunt: +5 gold on minion last hits."}),Qt({id:"quill",name:"Apprentice's Quill",tier:"starter",cat:"ability",cost:450,stats:{ap:16,mana:60},icon:"✒",color:"#6a8cff",tags:["Mage","Support"],passive:"Siphon: restore 8 mana on minion last hits."}),Qt({id:"brace",name:"Mason's Brace",tier:"starter",cat:"defense",cost:450,stats:{hp:130,armor:4,hpRegen:1},icon:"⛨",color:"#c8b48a",tags:["Vanguard","Fighter"]}),Qt({id:"satchel",name:"Courier's Satchel",tier:"starter",cat:"movement",cost:400,stats:{ms:.15,hp:60,passiveGold:.25},icon:"✉",color:"#e8b060",tags:["Marksman","Assassin","Support"],passive:"Parcel: +0.25 gold per second."}),Qt({id:"lantern",name:"Lantern Charm",tier:"starter",cat:"support",cost:450,stats:{hp:50,manaRegen:1.5,wardCharges:1},icon:"🏮",color:"#9ff0d8",tags:["Support","Mage"],passive:"Carry one extra ward charge."}),Qt({id:"totem",name:"Hunter's Totem",tier:"starter",cat:"attack",cost:450,stats:{ad:8,hp:70,monsterDmg:.35},icon:"☗",color:"#7bbf6a",tags:["Fighter","Assassin","Marksman"],passive:"Prey: +35% damage to monsters."}),Qt({id:"sinew",name:"Brass Sinew",tier:"component",cat:"attack",cost:800,stats:{ad:24},icon:"⚙",color:"#d4a040",tags:["Marksman","Assassin","Fighter"]}),Qt({id:"gale",name:"Gale Thread",tier:"component",cat:"attack",cost:700,stats:{as:.28},icon:"〰",color:"#8fe0ff",tags:["Marksman","Fighter"]}),Qt({id:"keenedge",name:"Keen Edge",tier:"component",cat:"attack",cost:850,stats:{ad:14,pen:.1},icon:"◢",color:"#ff9a8a",tags:["Assassin","Marksman"]}),Qt({id:"glyph",name:"Glyph Page",tier:"component",cat:"ability",cost:750,stats:{ap:34},icon:"☰",color:"#a07aff",tags:["Mage","Support"]}),Qt({id:"inkwell",name:"Inkwell",tier:"component",cat:"ability",cost:700,stats:{mana:300,haste:10,ap:12},icon:"⚗",color:"#5a7aff",tags:["Mage","Support"]}),Qt({id:"ironwood",name:"Ironwood Plank",tier:"component",cat:"defense",cost:700,stats:{hp:320},icon:"▤",color:"#b08850",tags:["Vanguard","Fighter","Support"]}),Qt({id:"platescrap",name:"Plate Scrap",tier:"component",cat:"defense",cost:650,stats:{armor:30},icon:"▣",color:"#aab6c0",tags:["Vanguard","Fighter"]}),Qt({id:"veilthread",name:"Veil Thread",tier:"component",cat:"defense",cost:650,stats:{ward:30},icon:"☁",color:"#b0a0e0",tags:["Support","Vanguard","Mage"]}),Qt({id:"swiftsole",name:"Swiftsole Boots",tier:"component",cat:"movement",cost:350,stats:{ms:.35},icon:"👢",color:"#e0c070",tags:["Marksman","Assassin","Fighter","Mage","Support","Vanguard"]}),Qt({id:"mote",name:"Mote Cloth",tier:"component",cat:"support",cost:600,stats:{hp:150,hpRegen:2,manaRegen:2},icon:"❋",color:"#ffd878",tags:["Support","Vanguard"]}),Qt({id:"sunspoke",name:"Sunspoke Bow",tier:"complete",cat:"attack",cost:2400,stats:{ad:22,as:.35},from:["gale","sinew"],icon:"☀",color:"#ffc040",tags:["Marksman","Fighter"],passive:"Every third attack also fires a bolt at a nearby target for 60% damage."}),Qt({id:"kilnheart",name:"Kilnheart Plate",tier:"complete",cat:"defense",cost:2200,stats:{hp:420,armor:40},from:["ironwood","platescrap"],icon:"⬢",color:"#ff8a50",tags:["Vanguard","Fighter"],passive:"Taking physical hits grants +4 armor (stacks 5x, 4s)."}),Qt({id:"quietindex",name:"Quiet Index",tier:"complete",cat:"ability",cost:2300,stats:{ap:52,haste:15,mana:300},from:["glyph","inkwell"],icon:"☷",color:"#7a8cff",tags:["Mage","Support"],passive:"Hitting with an ability from beyond 7m refunds 1s of its cooldown (once per cast)."}),Qt({id:"beacon",name:"Beacon Loom",tier:"complete",cat:"support",cost:2e3,stats:{hp:280,ward:22,manaRegen:3,shieldPower:.14,ap:20},from:["mote","veilthread"],icon:"✺",color:"#7ff0d0",tags:["Support","Mage"],passive:"Shielding an ally briefly reveals the area around them."}),Qt({id:"nullbell",name:"Null Bell",tier:"complete",cat:"support",cost:2100,stats:{hp:320,ward:38},from:["veilthread","ironwood"],icon:"🔔",color:"#d0c8ff",tags:["Support","Vanguard","Mage"],active:"Cleanse yourself of slows, roots, silences and stuns (not airborne). 90s cooldown."}),Qt({id:"glassfang",name:"Glassfang",tier:"complete",cat:"attack",cost:2500,stats:{ad:48,pen:.28},from:["keenedge","sinew"],icon:"◆",color:"#ff6a9a",tags:["Marksman","Assassin"],passive:"28% armor penetration."}),Qt({id:"tithe",name:"Tithe Reaper",tier:"complete",cat:"attack",cost:2300,stats:{ad:32,hp:300,lifesteal:.1},from:["sinew","ironwood"],icon:"☽",color:"#e04a5a",tags:["Fighter","Assassin","Vanguard"],passive:"10% lifesteal on attacks."}),Qt({id:"thornmail",name:"Thornwoven Mail",tier:"complete",cat:"defense",cost:2100,stats:{armor:56,hpRegen:4,hp:200},from:["platescrap","mote"],icon:"✱",color:"#7ab870",tags:["Vanguard","Fighter"],passive:"Reflect 25 + 20% armor physical damage to attackers."}),Qt({id:"aethercrown",name:"Aether Crown",tier:"complete",cat:"ability",cost:2400,stats:{ap:80,apPct:.15},from:["glyph","glyph"],icon:"♛",color:"#ff7ad8",tags:["Mage","Support"],passive:"+15% ability power."}),Qt({id:"tempest",name:"Tempest Compass",tier:"complete",cat:"ability",cost:2300,stats:{ap:42,haste:22,ms:.12,mana:200},from:["inkwell","glyph"],icon:"✢",color:"#6af0ff",tags:["Mage","Support","Assassin"]}),Qt({id:"aegis",name:"Warden's Aegis",tier:"complete",cat:"defense",cost:2400,stats:{hp:360,armor:36,ward:36},from:["platescrap","veilthread"],icon:"⬣",color:"#9ab0ff",tags:["Vanguard","Fighter","Support"]}),Qt({id:"maul",name:"Siegewright's Maul",tier:"complete",cat:"attack",cost:2300,stats:{as:.26,hp:260,ad:20,structDmg:.25},from:["gale","ironwood"],icon:"🔨",color:"#d08a50",tags:["Fighter","Marksman","Vanguard"],passive:"+25% damage to structures."}),Qt({id:"riverglass",name:"Riverglass Boots",tier:"boots",cat:"movement",cost:1050,stats:{ms:.45},from:["swiftsole","mote"],icon:"🥾",color:"#6fd8ff",tags:["Marksman","Assassin","Mage","Support","Fighter"],passive:"In the river and out of combat: +0.5 move speed."}),Qt({id:"stalwart",name:"Stalwart Treads",tier:"boots",cat:"defense",cost:1100,stats:{ms:.35,armor:20,ward:20},from:["swiftsole","platescrap"],icon:"🛡",color:"#b0bcd8",tags:["Vanguard","Fighter","Support"]}),Qt({id:"draught",name:"Mender's Draught",tier:"consumable",cat:"support",cost:70,stats:{},icon:"⚱",color:"#ff7a7a",tags:["Support","Vanguard","Fighter","Marksman","Mage","Assassin"],active:"Restore 200 health over 6s. 3 charges per slot."}),Qt({id:"phial",name:"Clarity Phial",tier:"consumable",cat:"ability",cost:60,stats:{},icon:"⚗",color:"#7aa8ff",tags:["Support","Mage","Marksman","Vanguard","Fighter","Assassin"],active:"Restore 120 mana or energy over 4s. 3 charges per slot."})],ee=Object.fromEntries(Un.map(r=>[r.id,r])),Br={hp:"Health",mana:"Mana",ad:"Attack Damage",ap:"Ability Power",as:"Attack Speed",armor:"Armor",ward:"Ward",ms:"Move Speed",haste:"Ability Haste",pen:"Armor Penetration",lifesteal:"Lifesteal",hpRegen:"Health Regen",manaRegen:"Mana Regen",shieldPower:"Shield Power",apPct:"Ability Power %",structDmg:"Structure Damage",monsterDmg:"Monster Damage",passiveGold:"Gold / s",wardCharges:"Ward Charges"};function $h(r,t){return["as","pen","lifesteal","shieldPower","apPct","structDmg","monsterDmg"].includes(r)?`+${Math.round(t*100)}% ${Br[r]}`:r==="ms"?`+${t.toFixed(2)} ${Br[r]}`:`+${t} ${Br[r]??r}`}const qh=30,xe=1/qh,br=12,za=[0,0,200,450,750,1100,1500,1950,2450,3e3,3600,4250,4950],cl=500,jh=1.7,hl=7,Yh=11,Uc=.65,Kh=14,Jh=30,ka=210,Zh=240,Nc=540,Qh=360,td=240,re=(r,t,e)=>r<t?t:r>e?e:r,dn=(r,t,e)=>r+(t-r)*e,et=(r,t,e,n)=>Math.hypot(r-e,t-n);function Ao(r,t){let e=(t-r)%(Math.PI*2);return e>Math.PI&&(e-=Math.PI*2),e<-Math.PI&&(e+=Math.PI*2),e}function Sr(r,t,e){return r+Ao(r,t)*e}function qe(r,t){const e=Math.hypot(r,t);return e<1e-9?{x:1,z:0}:{x:r/e,z:t/e}}class As{s;constructor(t){this.s=t>>>0}next(){this.s=this.s+1831565813>>>0;let t=this.s;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}range(t,e){return t+(e-t)*this.next()}int(t,e){return Math.floor(this.range(t,e+1))}pick(t){return t[Math.floor(this.next()*t.length)%t.length]}get state(){return this.s}}function ed(r,t,e,n,i,s){const a=i-e,o=s-n,l=a*a+o*o;let c=l<1e-12?0:((r-e)*a+(t-n)*o)/l;c=re(c,0,1);const h=e+a*c,u=n+o*c;return{d:Math.hypot(r-h,t-u),t:c,cx:h,cz:u}}function nd(r){return{x:-r.x,z:-r.z}}const Ie=150,Le=115,bn=-Ie/2,Sn=-Le/2,ke=.75,ce=Math.ceil(Ie/ke),sn=Math.ceil(Le/ke),Fc=[{x:-47,z:-9},{x:-43,z:-20},{x:-37,z:-31},{x:-22,z:-38},{x:-4,z:-36},{x:14,z:-32},{x:32,z:-35},{x:43,z:-26},{x:47,z:-9}],id=Fc.map(nd).reverse(),Rs=[Fc,id];function Oc(r,t){const e=Rs[t];return r===0?e:e.slice().reverse()}function dl(r,t){let e=t;for(let i=1;i<r.length;i++){const s=Math.hypot(r[i].x-r[i-1].x,r[i].z-r[i-1].z);if(e<=s){const a=e/s;return{x:r[i-1].x+(r[i].x-r[i-1].x)*a,z:r[i-1].z+(r[i].z-r[i-1].z)*a,seg:i}}e-=s}const n=r[r.length-1];return{x:n.x,z:n.z,seg:r.length-1}}const ul={seal:3,guard:14,inner:33,outer:54},Ge={0:{engine:{x:-62,z:0},cores:[{x:-57,z:-9},{x:-57,z:9}],fountain:{x:-70,z:0},spawn:{x:-66,z:0}},1:{engine:{x:62,z:0},cores:[{x:57,z:9},{x:57,z:-9}],fountain:{x:70,z:0},spawn:{x:66,z:0}}};function sd(){const r=[],t=["seal","guard","inner","outer"];for(let e=0;e<2;e++)for(const n of t){const i=dl(Rs[e],ul[n]);r.push({team:0,type:n,lane:e,x:i.x,z:i.z,id:`b-${n}-${e}`});const s=dl(Rs[1-e],ul[n]);r.push({team:1,type:n,lane:e,x:-s.x,z:-s.z,id:`r-${n}-${e}`})}for(const e of[0,1]){const n=Ge[e];n.cores.forEach((i,s)=>r.push({team:e,type:"core",lane:s,x:i.x,z:i.z,id:`${e===0?"b":"r"}-core-${s}`})),r.push({team:e,type:"engine",lane:-1,x:n.engine.x,z:n.engine.z,id:`${e===0?"b":"r"}-engine`})}return r}const Ro=sd();function rd(r){return{...r,id:r.id.replace(/^b/,"r"),x:-r.x,z:-r.z,team:r.team===0?1:r.team===1?0:2}}const fl=[{id:"b-heart",kind:"buff",x:-34,z:-12,family:"heartroot",team:0},{id:"b-cinder",kind:"buff",x:-34,z:13,family:"cinder",team:0},{id:"b-hounds",kind:"small",x:-26,z:-21,family:"hounds",team:0},{id:"b-crag",kind:"small",x:-26,z:22,family:"crag",team:0},{id:"b-wisps",kind:"small",x:-16,z:-16,family:"wisps",team:0},{id:"b-thorn",kind:"small",x:-16,z:17,family:"thorn",team:0}],Pr=[...fl,...fl.map(rd),{id:"catalyst-n",kind:"catalyst",x:.5,z:-25,family:"catalyst",team:2},{id:"catalyst-s",kind:"catalyst",x:-.5,z:25,family:"catalyst",team:2},{id:"colossus",kind:"colossus",x:0,z:0,family:"colossus",team:2}],ad=r=>r,od=ad([[-38,-21,2.8],[-31,-30,2.6],[-21,-27,2.4],[-30,-6,2.4],[-22,-3.5,2],[-36,3.5,2.2],[-28,8,2],[-30,29,2.6],[-20,26,2.4],[-38,22,2.8],[-10,-20,2.4],[-9,21,2.2],[-20,8,1.8]]);function ld(){const r=[],t=(s,a,o,l,c,h="wall")=>{r.push({ax:s,az:a,bx:o,bz:l,r:c,kind:h}),r.push({ax:-s,az:-a,bx:-o,bz:-l,r:c,kind:h})};t(-52,-33,-52,-14,1.1),t(-52,14,-52,33,1.1),t(-52,-4.5,-52,-4.5,1.2),t(-52,4.5,-52,4.5,1.2);for(const[s,a,o]of od)t(s,a,s,a,o,"rock");const e=8.4,n=[];for(let s=0;s<8;s++){const a=s*Math.PI/4+Math.PI/8;n.push({x:Math.cos(a)*e,z:Math.sin(a)*e})}for(let s=0;s<8;s++){const a=n[s],o=n[(s+1)%8],l=Math.atan2((a.z+o.z)/2,(a.x+o.x)/2);Math.abs(Math.cos(l))>.95||s<4&&t(a.x,a.z,o.x,o.z,1,"pit")}const i={outer:1.6,inner:1.7,guard:1.8,seal:1.9,core:1.9,engine:2.8};for(const s of Ro)r.push({ax:s.x,az:s.z,bx:s.x,bz:s.z,r:i[s.type]-.3,kind:"struct"});return r}const Cs=ld();function cd(){const r=[];for(let e=0;e<6;e++){const n=e*Math.PI/3+Math.PI/6;r.push({x:Math.cos(n)*14.5,z:Math.sin(n)*14.5,r:5.2})}const t=[[-24,-31,4.2],[-9,-28,3.6],[-45,-26,3.6],[-34,-2,3.4],[-18,3,3],[-7,-40,3.4],[-38,10,3],[-27,15,3.6]];for(const[e,n,i]of t)r.push({x:e,z:n,r:i}),r.push({x:-e,z:-n,r:i});return r}const Ps=cd();function Ss(r,t,e=0){const n=Ie/2-1.2-e,i=Le/2-1.2-e;if(n<=0||i<=0)return!1;const s=Math.abs(r/n),a=Math.abs(t/i);return s**3+a**3<1}const $i=new Uint8Array(ce*sn),Bc=new Uint8Array(ce*sn),Hc=new Uint8Array(ce*sn);function Gc(r,t){return{x:bn+(r+.5)*ke,z:Sn+(t+.5)*ke}}function pl(r,t){return{ix:Math.floor((r-bn)/ke),iz:Math.floor((t-Sn)/ke)}}function hd(){for(let r=0;r<sn;r++)for(let t=0;t<ce;t++){const{x:e,z:n}=Gc(t,r),i=r*ce+t;let s=Ss(e,n,.4),a=(Ss(e,n,0),0);for(const o of Cs){const l=ed(e,n,o.ax,o.az,o.bx,o.bz).d;l<o.r+.55&&(s=!1),l<o.r&&o.kind!=="struct"&&(a=1)}$i[i]=s?1:0,Bc[i]=a;for(let o=0;o<Ps.length;o++){const l=Ps[o];if((e-l.x)**2+(n-l.z)**2<l.r*l.r){Hc[i]=o+1;break}}}}hd();function Nn(r,t){const e=Math.floor((r-bn)/ke),n=Math.floor((t-Sn)/ke);return e<0||n<0||e>=ce||n>=sn?!1:$i[n*ce+e]===1}function pr(r,t){const e=Math.floor((r-bn)/ke),n=Math.floor((t-Sn)/ke);return e<0||n<0||e>=ce||n>=sn?!0:Bc[n*ce+e]===1}function Hr(r,t){const e=Math.floor((r-bn)/ke),n=Math.floor((t-Sn)/ke);return e<0||n<0||e>=ce||n>=sn?0:Hc[n*ce+e]}function dd(r,t){return Math.abs(r)<3.6&&Math.abs(t)>14&&Math.abs(t)<42}function wr(r,t,e,n){const i=Math.hypot(e-r,n-t),s=Math.max(1,Math.ceil(i/(ke*.5)));for(let a=1;a<=s;a++){const o=a/s;if(!Nn(r+(e-r)*o,t+(n-t)*o))return!1}return!0}function Vc(r,t,e,n){const i=Math.hypot(e-r,n-t),s=Math.max(1,Math.ceil(i/ke));for(let a=1;a<s;a++){const o=a/s;if(pr(r+(e-r)*o,t+(n-t)*o))return!1}return!0}function Ia(r,t){if(Nn(r,t))return{x:r,z:t};for(let e=1;e<40;e++){let n=null,i=1/0;for(let s=0;s<16+e*4;s++){const a=s/(16+e*4)*Math.PI*2,o=r+Math.cos(a)*e*ke,l=t+Math.sin(a)*e*ke;if(Nn(o,l)){const c=(o-r)**2+(l-t)**2;c<i&&(i=c,n={x:o,z:l})}}if(n)return n}return{x:re(r,-60,60),z:re(t,-40,40)}}const Ns=new Float32Array(ce*sn),Gr=new Int32Array(ce*sn),Vr=new Uint32Array(ce*sn),Wr=new Uint32Array(ce*sn);let ci=0;class ud{keys=[];f=[];push(t,e){this.keys.push(t),this.f.push(e);let n=this.keys.length-1;for(;n>0;){const i=n-1>>1;if(this.f[i]<=this.f[n])break;[this.f[i],this.f[n]]=[this.f[n],this.f[i]],[this.keys[i],this.keys[n]]=[this.keys[n],this.keys[i]],n=i}}pop(){const t=this.keys[0],e=this.keys.pop(),n=this.f.pop();if(this.keys.length){this.keys[0]=e,this.f[0]=n;let i=0;const s=this.keys.length;for(;;){const a=i*2+1,o=a+1;let l=i;if(a<s&&this.f[a]<this.f[l]&&(l=a),o<s&&this.f[o]<this.f[l]&&(l=o),l===i)break;[this.f[l],this.f[i]]=[this.f[i],this.f[l]],[this.keys[l],this.keys[i]]=[this.keys[i],this.keys[l]],i=l}}return t}get size(){return this.keys.length}}const fd=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[-1,1,1.4142],[1,-1,1.4142],[-1,-1,1.4142]];function ml(r,t,e,n){const i=Ia(r,t),s=Ia(e,n);if(wr(i.x,i.z,s.x,s.z))return[s];const a=pl(i.x,i.z),o=pl(s.x,s.z),l=a.iz*ce+a.ix,c=o.iz*ce+o.ix;ci++;const h=new ud;Ns[l]=0,Vr[l]=ci,Gr[l]=-1;const u=(p,_)=>{const y=Math.abs(p-o.ix),M=Math.abs(_-o.iz);return Math.max(y,M)+.4142*Math.min(y,M)};h.push(l,u(a.ix,a.iz));let d=!1,f=0;for(;h.size&&f++<6e4;){const p=h.pop();if(Wr[p]===ci)continue;if(Wr[p]=ci,p===c){d=!0;break}const _=p%ce,y=p/ce|0;for(const[M,z,A]of fd){const T=_+M,C=y+z;if(T<0||C<0||T>=ce||C>=sn)continue;const w=C*ce+T;if(!$i[w]||Wr[w]===ci||M!==0&&z!==0&&(!$i[y*ce+T]||!$i[C*ce+_]))continue;const b=Ns[p]+A;(Vr[w]!==ci||b<Ns[w])&&(Vr[w]=ci,Ns[w]=b,Gr[w]=p,h.push(w,b+u(T,C)))}}if(!d)return[s];const g=[];for(let p=c;p!==-1;p=Gr[p])g.push(Gc(p%ce,p/ce|0));g.reverse(),g[0]=i,g[g.length-1]=s;const x=[];let m=0;for(;m<g.length-1;){let p=g.length-1;for(;p>m+1&&!wr(g[m].x,g[m].z,g[p].x,g[p].z);)p--;x.push(g[p]),m=p}return x}function yn(r,t){for(const e of r.items)if(e&&e.id===t)return!0;return!1}function Xr(r){const t={};for(const e of r.items){if(!e)continue;const n=ee[e.id].stats;for(const i in n)t[i]=(t[i]??0)+n[i]}return t}const pd=["swiftsole","riverglass","stalwart"];function On(r,t){const e=ee[t];if(!e)return{cost:0,consume:[],ok:!1,reason:"Unknown item"};const n=[];let i=e.cost;if(e.from){const a=new Set;for(const o of e.from){const l=r.items.findIndex((c,h)=>c&&c.id===o&&!a.has(h));l>=0&&(a.add(l),n.push(l),i-=ee[o].cost)}}return(e.tier==="complete"||e.tier==="boots"||e.tier==="starter")&&yn(r,t)?{cost:i,consume:n,ok:!1,reason:"Already owned"}:(e.tier==="boots"||t==="swiftsole")&&!e.from?.includes("swiftsole")&&pd.some(a=>yn(r,a))?{cost:i,consume:n,ok:!1,reason:"You already have boots"}:e.tier==="consumable"&&r.items.findIndex(o=>o&&o.id===t&&o.qty<3)>=0?{cost:i,consume:[],ok:!0}:r.items.filter(a=>!a).length+n.length<=0?{cost:i,consume:n,ok:!1,reason:"Inventory full"}:{cost:i,consume:n,ok:!0}}function md(r,t,e){const n=t.hero,i=c=>(r.emit({t:"reject",unit:t.id,reason:c}),!1),s=On(n,e);if(!s.ok)return i(s.reason??"Cannot buy");if(n.gold<s.cost)return i("Not enough gold");const a=ee[e],o=[];let l=-1;if(a.tier==="consumable"){const c=n.items.findIndex(h=>h&&h.id===e&&h.qty<3);if(c>=0)return n.items[c].qty++,n.gold-=s.cost,n.goldSpent+=s.cost,r.emit({t:"buy",unit:t.id,item:e}),n.undo=null,!0}for(const c of s.consume.sort((h,u)=>u-h))o.push(n.items[c]),n.items[c]=null;return l=n.items.findIndex(c=>!c),n.items[l]={id:e,qty:1,cdUntil:0},n.gold-=s.cost,n.goldSpent+=s.cost,n.undo={itemId:e,gold:s.cost,consumed:o,slotIdx:l,goldAfter:n.gold},n.buildLog.push({t:r.time,item:e}),r.emit({t:"buy",unit:t.id,item:e}),r.emit({t:"sfx",name:"buy",x:t.x,z:t.z}),r.recomputeStats(t),!0}function gd(r,t,e){const n=t.hero,i=n.items[e];if(!i)return!1;const s=ee[i.id],a=Math.floor(s.cost*Uc)*i.qty;return n.items[e]=null,n.gold+=a,n.undo=null,r.emit({t:"sfx",name:"sell",x:t.x,z:t.z}),r.recomputeStats(t),!0}function xd(r,t){const e=t.hero,n=e.undo;if(!n)return!1;const i=a=>(r.emit({t:"reject",unit:t.id,reason:a}),!1);if(!r.inShop(t))return i("Must be at the fountain");if(e.lastCombatAt>e.deathAt&&r.time-e.lastCombatAt<1.5)return i("Cannot undo in combat");const s=e.items[n.slotIdx];if(!s||s.id!==n.itemId)return e.undo=null,i("Cannot undo");if(s.cdUntil>r.time)return i("Item was used");e.items[n.slotIdx]=null;for(const a of n.consumed){const o=e.items.findIndex(l=>!l);e.items[o]=a}return e.gold+=n.gold,e.goldSpent-=n.gold,e.undo=null,r.recomputeStats(t),!0}function vd(r,t,e){const n=t.hero,i=n.items[e];if(!i||t.dead)return!1;const s=r.time;if(i.cdUntil>s)return!1;if(i.id==="draught")r.addEffect(t,"regen",6,200/6,t.id),i.qty--,i.cdUntil=s+1,r.emit({t:"fx",kind:"heal",x:t.x,z:t.z,r:1.2,color:16747146,dur:.8});else if(i.id==="phial")r.addEffect(t,"manaRegen",4,30,t.id),i.qty--,i.cdUntil=s+1,r.emit({t:"fx",kind:"heal",x:t.x,z:t.z,r:1.2,color:8038655,dur:.8});else if(i.id==="nullbell")r.cleanse(t),i.cdUntil=s+90;else return!1;return i.qty<=0&&ee[i.id].tier==="consumable"&&(n.items[e]=null),n.undo=null,!0}function _d(r,t){const e=t.hero;e.armorStacks.length&&(e.armorStacks=e.armorStacks.filter(n=>n.until>r.time))}function yd(r,t,e){const n=t.hero;if(yn(n,"sunspoke")&&(n.sunCount++,n.sunCount%3===0)){let i=null,s=7;for(const o of r.units){if(o.dead||o.team===t.team||o.id===e.id||o.stype||o.kind==="ward"||!r.canSee(t.team,o))continue;const l=et(t.x,t.z,o.x,o.z);l<s&&(s=l,i=o)}const a=i??e;r.emit({t:"fx",kind:"beam",x:t.x,z:t.z,r:et(t.x,t.z,a.x,a.z),color:16760896,dx:a.x-t.x,dz:a.z-t.z,dur:.18}),r.damage(t,a,t.ad*.6,"physical",{label:"Sunspoke Bolt",noLifesteal:!0})}}const ae=(r,t,e,n)=>Xh(Ut[r].abilities[t],e,n),ri=(r,t)=>e=>r.isEnemyTarget(e,t.team,{needSight:!1});function Ve(r,t,e,n,i,s,a){const o=r.damage(t,e,i,s,{label:a,ability:!0});return Pd(r,t,e,n),o}function Co(r,t,e){const n=t.hero,i=n.rec[e];i&&(n.cds[e]=r.time+i.fullCd),n.rec[e]=null}const Md=(r,t,e,n,i,s=.5)=>r.emit({t:"fx",kind:"ring",x:t,z:e,r:n,color:i,dur:s}),bd=(r,t,e,n,i,s)=>{const a=qe(i.dx,i.dz),o=t.hero;if(e===0){const l=Ut.brannoch.abilities[0].range,c=ae("brannoch",0,"dmg",n)+.8*t.ad,h=ae("brannoch",0,"slow",n)/100,u=ae("brannoch",0,"bonus",n);r.emit({t:"fx",kind:"cone",x:t.x,z:t.z,r:l,color:16756800,dx:a.x,dz:a.z,dur:.4});for(const d of r.unitsInCone(t.x,t.z,a.x,a.z,l,.85,ri(r,t))){const g=et(t.x,t.z,d.x,d.z)<1.9;Ve(r,t,d,0,c+(g?u:0),"physical","Fault Hammer"),g||r.addEffect(d,"slow",1.5,h,t.id,{tag:"fault"}),r.emit({t:"hit",x:d.x,z:d.z,color:16756800,big:g})}r.emit({t:"sfx",name:"slam",x:t.x,z:t.z})}else if(e===1){const l=ae("brannoch",1,"hp",n),c=t.x+a.x*3.4,h=t.z+a.z*3.4,u=-a.z,d=a.x;for(let f=-2;f<=2;f++){const g=f*1.2,x=c+u*g-a.x*.14*f*f,m=h+d*g-a.z*.14*f*f;r.addWall(x,m,.85,l/2.4,3,t.team)}r.emit({t:"fx",kind:"wall",x:c,z:h,r:3,color:14734e3,dx:a.x,dz:a.z,dur:3}),r.emit({t:"sfx",name:"stone",x:c,z:h})}else if(e===2){const l=o.rec[2]??(o.rec[2]={until:r.time+4,fullCd:12,data:{}});if(s){const c=l.data??{};let h=c.ax??t.x,u=c.az??t.z;const d=c.ally?r.byId.get(c.ally):void 0;d&&!d.dead&&(h=d.x,u=d.z);const f=et(t.x,t.z,h,u);if(f>.5){const g=Math.max(0,f-1.1)/f;r.startDash(t,t.x+(h-t.x)*g,t.z+(u-t.z)*g,re(f/28,.15,.5),"dash")}r.grantShield(t,t,ae("brannoch",2,"shield",n),2.5),Co(r,t,2)}else{let c=i.tx,h=i.tz,u=0;for(const d of r.heroes)if(!d.dead&&d.team===t.team&&d.id!==t.id&&et(d.x,d.z,c,h)<2.8){u=d.id,c=d.x,h=d.z;break}l.data={ax:c,az:h,ally:u},r.emit({t:"fx",kind:"anchor",x:c,z:h,r:1.2,color:13933114,dx:t.x,dz:t.z,dur:4})}}else{const l=et(t.x,t.z,i.tx,i.tz),c=ae("brannoch",3,"dmg",n)+1*t.ad;r.startDash(t,i.tx,i.tz,re(l/26,.3,.5),"leap",{onEnd:()=>{r.emit({t:"fx",kind:"shock",x:t.x,z:t.z,r:4.2,color:16752704,dur:.6});for(const h of r.unitsInCircle(t.x,t.z,4.2,ri(r,t)))Ve(r,t,h,3,c,"physical","Citybreaker"),h.kind==="hero"?r.addEffect(h,"airborne",1.1,1,t.id):r.addEffect(h,"stun",.8,1,t.id);r.emit({t:"sfx",name:"boom",x:t.x,z:t.z})}})}},Sd=(r,t,e,n,i)=>{const s=qe(i.dx,i.dz);if(e===0){const a=ae("suri",0,"dmg",n)+.9*t.ad;r.spawnProjectile({team:t.team,owner:t.id,x:t.x+s.x*.6,z:t.z+s.z*.6,dx:s.x,dz:s.z,speed:26,range:13,radius:.5,bounces:1,color:16752704,size:.35,fx:"bolt",dmg:a,power:1,tag:"ricochet",onHit:(o,l)=>{l.team!==t.team&&Ve(r,t,l,0,a,"physical","Ricochet Bolt"),r.emit({t:"hit",x:l.x,z:l.z,color:16752704})}})}else if(e===1){const a=ae("suri",1,"speed",n)/100,o=t.x,l=t.z;r.startDash(t,t.x+s.x*5.5,t.z+s.z*5.5,.2,"dash");const c=new Set([t.id]);for(let h=0;h<3;h++){const u=(h+.5)/3;r.spawnZone({team:t.team,owner:t.id,x:o+s.x*5.5*u,z:l+s.z*5.5*u,r:1.7,until:r.time+3,tag:"lane",fx:"lane",color:8382719,friendly:!0,onEnter:(d,f)=>{f.kind==="hero"&&f.team===t.team&&!c.has(f.id)&&(c.add(f.id),r.addEffect(f,"haste",1.5,a,t.id,{tag:"slipstream"}),r.emit({t:"fx",kind:"ring",x:f.x,z:f.z,r:1.2,color:8382719,dur:.4}))}})}}else if(e===2){const a=r.byId.get(i.target);if(!a)return;const o=ae("suri",2,"dmg",n)+.7*t.ad,l=r.addEffect(a,"charge",3,o,t.id),c=()=>{if(!a.dead){if(l.until<=r.time){r.emit({t:"fx",kind:"shock",x:a.x,z:a.z,r:2.4,color:16744496,dur:.5});for(const h of r.unitsInCircle(a.x,a.z,2.4,ri(r,t)))Ve(r,t,h,2,o,"physical","Parcel Charge");r.emit({t:"sfx",name:"boom",x:a.x,z:a.z});return}r.after(.1,c)}};r.after(.1,c)}else{const a=ae("suri",3,"dmg",n)+1.2*t.ad,o=30;r.emit({t:"fx",kind:"beam",x:t.x,z:t.z,r:o,color:16738864,dx:s.x,dz:s.z,dur:.45});for(const l of r.unitsInRect(t.x,t.z,s.x,s.z,o,1.6,ri(r,t))){const c=(l.x-t.x)*s.x+(l.z-t.z)*s.z;Ve(r,t,l,3,a*(1+.6*re(c/o,0,1)),"physical","Redline Delivery"),r.emit({t:"hit",x:l.x,z:l.z,color:16738864,big:!0})}r.emit({t:"sfx",name:"beam",x:t.x,z:t.z})}},wd=(r,t,e,n,i)=>{const s=qe(i.dx,i.dz);if(e===0){const a=ae("oru",0,"dmg",n)+.6*t.ap,o=ae("oru",0,"shield",n)+.3*t.ap;r.spawnProjectile({team:t.team,owner:t.id,x:t.x+s.x*.6,z:t.z+s.z*.6,dx:s.x,dz:s.z,speed:11,range:11,radius:.8,hitsAllies:!0,color:11575551,size:.5,fx:"swarm",dmg:a,onHit:(l,c)=>{c.team===t.team?r.grantShield(t,c,o,2.5):(Ve(r,t,c,0,a,"arcane","Luminous Swarm"),r.emit({t:"hit",x:c.x,z:c.z,color:11575551}))}})}else if(e===1){const a=ae("oru",1,"dur",n);r.spawnZone({team:t.team,owner:t.id,x:i.tx,z:i.tz,r:4.2,until:r.time+a+.2,tickEvery:.2,power:2,tag:"hush",fx:"hush",color:10124031,onTick:o=>{for(const l of r.unitsInCircle(o.x,o.z,o.r,c=>c.kind==="hero"&&c.team!==t.team&&!c.dead))r.addEffect(l,"hush",.45,1,t.id)}}),r.emit({t:"sfx",name:"hush",x:i.tx,z:i.tz})}else if(e===2){const a=r.byId.get(i.target);if(!a)return;r.addEffect(a,"haste",3,ae("oru",2,"speed",n)/100,t.id,{tag:"draft"}),r.addEffect(a,"guided",4,1,t.id),Md(r,a.x,a.z,1.6,8384767,.6)}else{const a=ae("oru",3,"shield",n)+.4*t.ap,o=ae("oru",3,"dmg",n)+.5*t.ap;r.spawnProjectile({team:t.team,owner:t.id,x:t.x+s.x,z:t.z+s.z,dx:s.x,dz:s.z,speed:9.5,range:20,radius:3,pierce:!0,hitsAllies:!0,ult:!0,power:3,color:12620031,size:3,fx:"wave",dmg:o,onHit:(l,c)=>{c.team===t.team?c.kind==="hero"&&r.grantShield(t,c,a,4):(Ve(r,t,c,3,o,"arcane","Night Migration"),c.kind==="hero"&&r.addEffect(c,"root",1.1,1,t.id))}}),r.emit({t:"sfx",name:"wave",x:t.x,z:t.z})}},Ed=(r,t,e,n,i,s)=>{const a=qe(i.dx,i.dz);if(e===0){const o=ae("kesh",0,"dmg",n)+.6*t.ad,l=ae("kesh",0,"miss",n)/100,c=3.4;r.emit({t:"fx",kind:"cone",x:t.x,z:t.z,r:c,color:s?14280314:9363552,dx:a.x,dz:a.z,dur:.35});for(const h of r.unitsInCone(t.x,t.z,a.x,a.z,c,.9,ri(r,t))){const u=s?(h.maxHp-h.hp)*l:0;Ve(r,t,h,0,o+(h.kind==="monster"?Math.min(u,150):u),"physical","Reed Cleaver"),r.emit({t:"hit",x:h.x,z:h.z,color:9363552})}s&&Co(r,t,0),r.emit({t:"sfx",name:"swing",x:t.x,z:t.z})}else if(e===1){const o=ae("kesh",1,"dr",n)/100;r.addEffect(t,"dr",2,o,t.id,{tag:"bog"});const l=r.addEffect(t,"bog",2.05,0,t.id);r.emit({t:"fx",kind:"shield",x:t.x,z:t.z,r:1.4,color:8038496,dur:2}),r.after(2,()=>{if(t.dead)return;const c=re((l.data??0)/420,.15,.5);r.emit({t:"fx",kind:"shock",x:t.x,z:t.z,r:4,color:8038496,dur:.5});for(const h of r.unitsInCircle(t.x,t.z,4,ri(r,t)))r.addEffect(h,"slow",1.6,c,t.id,{tag:"bog"})})}else if(e===2){const o=ae("kesh",2,"as",n)/100;r.emit({t:"fx",kind:"burrow",x:t.x,z:t.z,r:1.4,color:5933632,dur:.6}),r.startDash(t,t.x+a.x*7,t.z+a.z*7,.35,"dash",{onEnd:()=>{r.addEffect(t,"mod",3,0,t.id,{mods:{as:o},tag:"sink"}),r.emit({t:"fx",kind:"burst",x:t.x,z:t.z,r:1.6,color:5933632,dur:.5})}})}else{const o=ae("kesh",3,"dur",n);r.spawnZone({team:t.team,owner:t.id,x:t.x,z:t.z,r:6,until:r.time+o,tickEvery:.25,power:3,ult:!0,tag:"fen",fx:"marsh",color:4885050,friendly:!0,onTick:l=>{for(const c of r.unitsInCircle(l.x,l.z,l.r,h=>!h.dead&&!h.stype&&h.kind!=="ward"))c.id===t.id?r.addEffect(c,"haste",.4,.25,t.id,{tag:"fen"}):c.team!==t.team&&(r.addEffect(c,"slow",.4,.3,t.id,{tag:"fen"}),c.kind==="hero"&&(c.revealUntil[t.team]=Math.max(c.revealUntil[t.team],r.time+.4)))}}),r.emit({t:"sfx",name:"marsh",x:t.x,z:t.z})}},Td=(r,t,e,n,i)=>{const s=qe(i.dx,i.dz),a=t.hero;if(e===0){const o=ae("ilyra",0,"dmg",n)+.7*t.ap,l=(c,h,u,d,f)=>r.spawnProjectile({team:t.team,owner:t.id,x:c,z:h,dx:u,dz:d,speed:26,range:14,radius:.55,pierce:!0,color:10139903,size:.4,fx:"line",dmg:o*f,tag:"linebreak",onHit:(g,x)=>{if(x.team===t.team)return;const m=(g.firstHeroHit?.7:1)*f;Ve(r,t,x,0,o*m,"arcane","Linebreak"),r.emit({t:"hit",x:x.x,z:x.z,color:10139903})}});l(t.x+s.x*.6,t.z+s.z*.6,s.x,s.z,1);for(const c of r.zones){if(c.tag!=="sigil"||c.owner!==t.id||c.until<=r.time)continue;const h=c.x-t.x,u=c.z-t.z,d=h*s.x+u*s.z,f=Math.abs(-h*s.z+u*s.x);if(d>0&&d<14&&f<1.8){c.until=0;const g=ae("ilyra",1,"copy",a.ranks[1]||1)/100,x=r.nearestEnemyHero({...t,x:c.x,z:c.z},12,!1);let m=Math.atan2(s.z,s.x)+.6;x&&(m=Math.atan2(x.z-c.z,x.x-c.x));const p=c.x,_=c.z;r.after(d/26+.05,()=>{l(p,_,Math.cos(m),Math.sin(m),g),r.emit({t:"fx",kind:"ring",x:p,z:_,r:1.8,color:16769658,dur:.5})});break}}r.emit({t:"sfx",name:"zap",x:t.x,z:t.z})}else if(e===1){for(const o of r.zones)o.tag==="sigil"&&o.owner===t.id&&(o.until=0);r.spawnZone({team:t.team,owner:t.id,x:i.tx,z:i.tz,r:1.6,until:r.time+6,tag:"sigil",fx:"sigil",color:16769658,friendly:!0})}else if(e===2){const o=ae("ilyra",2,"dmg",n)+.4*t.ap,l=ae("ilyra",2,"sil",n),c=7,h=3.2,u=i.tx,d=i.tz,f=u-s.x*c/2,g=d-s.z*c/2;r.emit({t:"fx",kind:"rect",x:u,z:d,r:c,color:16769658,dx:s.x,dz:s.z,dur:.5});for(const m of r.unitsInRect(f,g,s.x,s.z,c,h,ri(r,t)))Ve(r,t,m,2,o,"arcane","Redaction"),m.kind==="hero"&&r.addEffect(m,"silence",l,1,t.id);const x=(m,p)=>{const _=m-f,y=p-g,M=_*s.x+y*s.z,z=Math.abs(-_*s.z+y*s.x);return M>=0&&M<=c&&z<=h/2+.6};for(const m of r.projectiles)m.team!==t.team&&!m.ult&&m.power<=2&&m.kind==="skill"&&x(m.x,m.z)&&(m.lifeEnd=-1,r.emit({t:"hit",x:m.x,z:m.z,color:16769658,kind:"erase"}));for(const m of r.zones)m.team!==t.team&&!m.ult&&m.power<=2&&m.tag!=="sigil"&&x(m.x,m.z)&&(m.until=0,r.emit({t:"hit",x:m.x,z:m.z,color:16769658,kind:"erase"}));for(const m of r.walls)m.team!==t.team&&x(m.x,m.z)&&(m.until=0);r.emit({t:"sfx",name:"erase",x:u,z:d})}else{const o=ae("ilyra",3,"dmg",n)+.4*t.ap,l=[2.4,3.9,5.5],c=new Map;l.forEach((h,u)=>{r.after(u*.6,()=>{t.dead&&u>0,r.emit({t:"fx",kind:"ring",x:i.tx,z:i.tz,r:h,color:u===2?16742992:16769658,dur:.55});for(const d of r.unitsInCircle(i.tx,i.tz,h,ri(r,t))){Ve(r,t,d,3,o,"arcane","Final Draft");const f=(c.get(d.id)??0)+1;c.set(d.id,f),u===2&&f>=3&&d.kind==="hero"&&r.addEffect(d,"stun",1.2,1,t.id)}r.emit({t:"sfx",name:"ring",x:i.tx,z:i.tz})})}),r.emit({t:"fx",kind:"warn",x:i.tx,z:i.tz,r:5.5,color:16742992,dur:1.4})}},Ad=(r,t,e,n,i,s)=>{const a=qe(i.dx,i.dz),o=t.hero;if(e===0){const l=r.byId.get(i.target);if(!l)return;if((o.shardCd[l.id]??0)>r.time){t.mana+=40,o.cds[0]=r.time,r.emit({t:"reject",unit:t.id,reason:"Target recently hit"});return}o.shardCd[l.id]=r.time+4;const c=ae("vey",0,"dmg",n)+.7*t.ad,h=qe(l.x-t.x,l.z-t.z);r.emit({t:"fx",kind:"beam",x:t.x,z:t.z,r:et(t.x,t.z,l.x,l.z)+2,color:16734930,dx:h.x,dz:h.z,dur:.3}),r.startDash(t,l.x+h.x*2,l.z+h.z*2,.16,"dash",{onEnd:()=>{t.facing=Math.atan2(-h.z,-h.x)}}),Ve(r,t,l,0,c,"physical","Shardstep"),r.emit({t:"hit",x:l.x,z:l.z,color:16734930,big:!0})}else if(e===1){const l=o.rec[1]??(o.rec[1]={until:r.time+3,fullCd:12,data:{}});if(s){const c=l.data?.decoy?r.byId.get(l.data.decoy):void 0,h=ae("vey",1,"swap",n);if(c&&!c.dead&&et(t.x,t.z,c.x,c.z)<=h){const u=t.x,d=t.z;t.x=c.x,t.z=c.z,c.x=u,c.z=d,t.px=t.x,t.pz=t.z,r.emit({t:"fx",kind:"burst",x:t.x,z:t.z,r:1.4,color:16734930,dur:.4}),r.emit({t:"fx",kind:"burst",x:u,z:d,r:1.4,color:16734930,dur:.4})}else r.emit({t:"reject",unit:t.id,reason:"Decoy out of range"});Co(r,t,1)}else{const c=r.blank("decoy",t.team,"Decoy",t.x,t.z,.5);c.owner=t.id,c.hp=90,c.maxHp=90,c.baseMs=4.6,c.ms=4.6,c.armor=0,c.expires=r.time+3,c.vision=0,c.visUntil=[1e9,1e9],c.facing=t.facing,r.setOrder(c,"move",i.tx,i.tz),l.data={decoy:c.id},r.emit({t:"spawn",unit:c.id})}}else if(e===2){const l=ae("vey",2,"dmg",n)+.6*t.ad;r.emit({t:"fx",kind:"cone",x:t.x,z:t.z,r:5,color:16734930,dx:a.x,dz:a.z,dur:.35});for(const c of r.unitsInCone(t.x,t.z,a.x,a.z,5,.8,h=>!h.dead&&h.team!==t.team&&(h.kind==="hero"||h.kind==="minion"||h.kind==="ward"||h.kind==="monster")&&(h.kind==="ward"||r.canSee(t.team,h)))){if(c.kind==="ward"){c.disabledUntil=r.time+5,r.emit({t:"fx",kind:"ring",x:c.x,z:c.z,r:1.4,color:16734930,dur:.6});continue}Ve(r,t,c,2,l,"physical","Cut the Light")}r.emit({t:"sfx",name:"swing",x:t.x,z:t.z})}else{const l=r.byId.get(i.target);if(!l)return;const c=ae("vey",3,"dmg",n)+1*t.ad;r.addEffect(l,"prism",1.25,1,t.id),r.emit({t:"fx",kind:"mark",x:l.x,z:l.z,r:1.8,color:16734930,dur:1.2}),r.after(1.2,()=>{if(l.dead||t.dead)return;const h=et(t.x,t.z,l.x,l.z),u=Vc(t.x,t.z,l.x,l.z);if(h>13){r.emit({t:"fx",kind:"ring",x:l.x,z:l.z,r:1.6,color:8947848,dur:.4});return}if(u){const d=qe(l.x-t.x,l.z-t.z),f=r.clipToWalkable(l.x,l.z,l.x-d.x*1.3,l.z-d.z*1.3);t.x=f.x,t.z=f.z,t.px=t.x,t.pz=t.z,t.facing=Math.atan2(d.z,d.x),r.emit({t:"fx",kind:"beam",x:t.x,z:t.z,r:1.4,color:16734930,dx:d.x,dz:d.z,dur:.3}),Ve(r,t,l,3,c,"physical","Prism Sentence"),r.emit({t:"hit",x:l.x,z:l.z,color:16734930,big:!0})}else Ve(r,t,l,3,c*.5,"physical","Prism Sentence (dodged)");r.emit({t:"sfx",name:"prism",x:l.x,z:l.z})})}},Rd={brannoch:bd,suri:Sd,oru:wd,kesh:Ed,ilyra:Td,vey:Ad};function Cd(r,t,e){const n=t.hero;let i=0,s=0,a;switch(n.heroId){case"suri":n.hotCharge&&(i+=12+.3*t.ad+n.level*2,n.hotCharge=!1,r.emit({t:"hit",x:e.x,z:e.z,color:16747056,kind:"ember"})),n.lastMoveDist=0;break;case"vey":{if(n.refractReady){const o=Math.atan2(e.z-t.z,e.x-t.x),l=n.lastAttackAngle[e.id];(l===void 0||Math.abs(Ao(l,o))>.9)&&(i+=18+.35*t.ad,s+=.3,n.refractReady=!1,r.emit({t:"hit",x:e.x,z:e.z,color:16734930,big:!0,kind:"refract"}),e.kind==="hero"&&et(t.x,t.z,e.x,e.z)<7&&r.emit({t:"glint",x:t.x,z:t.z,target:e.id}))}n.lastAttackAngle[e.id]=Math.atan2(e.z-t.z,e.x-t.x);break}case"kesh":{Wc(r,t,e);break}case"ilyra":case"oru":a=void 0;break}return{bonus:i,pen:s,dtype:a}}function Wc(r,t,e){const n=t.hero;n.heroId==="kesh"&&((!n.markId||!r.byId.get(n.markId)||r.byId.get(n.markId).dead)&&(n.markId=e.id),n.markId===e.id&&n.markCd<=r.time&&(r.heal(t,22+.025*t.maxHp),n.markCd=r.time+6,r.emit({t:"fx",kind:"heal",x:t.x,z:t.z,r:1.2,color:14280314,dur:.6})))}function Pd(r,t,e,n){const i=t.hero;if(e.dead&&e.kind,e.kind==="hero"&&e.team!==t.team){const s=r.getEffect(t,"guided");s&&(s.until=0,e.revealUntil[t.team]=Math.max(e.revealUntil[t.team],r.time+4),r.emit({t:"fx",kind:"mark",x:e.x,z:e.z,r:1.6,color:8384767,dur:1}))}if(i.heroId==="kesh"&&Wc(r,t,e),i.heroId==="ilyra"&&e.kind==="hero"&&!e.dead){const s=1<<n,a=(i.annotations[e.id]??0)|s;let o=0;for(let l=0;l<4;l++)a&1<<l&&o++;o>=3?(i.annotations[e.id]=0,r.damage(t,e,40+.35*t.ap+i.level*6,"arcane",{label:"Margin Notes"}),r.emit({t:"fx",kind:"burst",x:e.x,z:e.z,r:1.8,color:16769658,dur:.5}),r.emit({t:"hit",x:e.x,z:e.z,color:16769658,big:!0,kind:"note"})):i.annotations[e.id]=a}yn(i,"quietindex")&&n>=0&&n<=3&&et(t.x,t.z,e.x,e.z)>7&&i.cds[n]>r.time&&(i.pa!==r.tick||i.pb!==n)&&(i.cds[n]=Math.max(r.time,i.cds[n]-1),i.pa=r.tick,i.pb=n)}function zd(r,t){const e=t.hero,n=r.time;for(let i=0;i<4;i++){const s=e.rec[i];s&&n>s.until&&(e.cds[i]=n+s.fullCd*.55,e.rec[i]=null)}switch(e.heroId){case"brannoch":{r.nearestEnemyHero(t,6.5,!1)?(e.stoneNear+=1/30,e.stoneNear>=3&&e.stoneStacks<5&&n>=e.pa&&(e.stoneStacks++,e.pa=n+1,r.emit({t:"fx",kind:"ring",x:t.x,z:t.z,r:1.4,color:13221806,dur:.4}))):(e.stoneNear=0,e.stoneStacks>0&&n>=e.pc&&(e.stoneStacks--,e.pc=n+1.4));break}case"suri":e.lastMoveDist>=3&&(e.hotCharge=!0);break;case"vey":{!(t.visUntil[1-t.team]>n)&&!t.dead?(e.unseenSince===0&&(e.unseenSince=n),n-e.unseenSince>=1.5&&(e.refractReady=!0)):e.unseenSince=0,t.brush>0&&!e.refractReady&&n-e.lastCombatAt>.5&&(e.refractReady=!0);break}}}const kd={outer:{hp:1300,ad:140,armor:45,ward:45,range:9.5,radius:1.6,asec:1.1},inner:{hp:1500,ad:152,armor:50,ward:50,range:9.5,radius:1.7,asec:1.1},guard:{hp:1700,ad:165,armor:55,ward:55,range:9.8,radius:1.8,asec:1.05},seal:{hp:1400,ad:0,armor:60,ward:60,range:0,radius:1.9,asec:1},core:{hp:1900,ad:190,armor:60,ward:60,range:10,radius:1.9,asec:1},engine:{hp:2400,ad:0,armor:50,ward:50,range:0,radius:2.8,asec:1}},Te=["Tidewatch","Cinderguard"],Id={guard:{hp:340,ad:17,armor:10,range:1.5,as:.9,ms:3.1,radius:.5,gold:21,xp:38,wind:.25,proj:0},bolt:{hp:235,ad:23,armor:0,range:6,as:.85,ms:3.1,radius:.45,gold:15,xp:30,wind:.3,proj:16},siege:{hp:580,ad:48,armor:22,range:8.2,as:.45,ms:2.8,radius:.7,gold:42,xp:64,wind:.4,proj:14},vanguard:{hp:1350,ad:62,armor:28,range:1.9,as:.7,ms:3.2,radius:.85,gold:70,xp:96,wind:.3,proj:0}},Ld={hounds:[0,1,2].map(()=>({name:"Mirehound",hp:270,ad:22,armor:6,range:1.5,as:.9,ms:3.8,radius:.5,gold:26,xp:40,proj:0})),crag:[{name:"Cragback",hp:720,ad:36,armor:20,range:2,as:.7,ms:3,radius:.95,gold:55,xp:80,proj:0,big:!0},{name:"Crag Pup",hp:300,ad:20,armor:8,range:1.6,as:.85,ms:3.4,radius:.55,gold:22,xp:36,proj:0}],wisps:[0,1,2].map(()=>({name:"Glowwisp",hp:210,ad:24,armor:2,range:5.2,as:.85,ms:3.2,radius:.45,gold:26,xp:38,proj:13})),thorn:[{name:"Thornback",hp:620,ad:32,armor:18,range:1.9,as:.75,ms:3.1,radius:.9,gold:50,xp:72,proj:0,big:!0},{name:"Thornling",hp:230,ad:18,armor:4,range:1.5,as:.9,ms:3.5,radius:.45,gold:18,xp:30,proj:0},{name:"Thornling",hp:230,ad:18,armor:4,range:1.5,as:.9,ms:3.5,radius:.45,gold:18,xp:30,proj:0}],heartroot:[{name:"Heartroot Elder",hp:1100,ad:46,armor:26,range:2.2,as:.7,ms:3,radius:1.15,gold:95,xp:150,proj:0,big:!0}],cinder:[{name:"Cinder Warden",hp:1e3,ad:52,armor:22,range:5.5,as:.7,ms:3,radius:1.1,gold:95,xp:150,proj:14,big:!0}],catalyst:[{name:"Twin Catalyst",hp:3e3,ad:78,armor:32,range:3.2,as:.6,ms:2.8,radius:1.7,gold:0,xp:220,proj:0,big:!0}],colossus:[{name:"Aether Colossus",hp:7e3,ad:118,armor:48,range:4.2,as:.55,ms:2.8,radius:2.5,gold:0,xp:400,proj:0,big:!0}]},gl=[[0,0],[1.4,1],[-1.4,1],[0,-1.6]];class Dd{constructor(t){this.sim=t}structures=new Map;camps=[];nextWave=Kh;waveNo=0;sealRespawnAt={};sealDefs=new Map;alerted=new Map;towerBuf=[];init(){for(const t of Ro)this.spawnStructure(t);for(const t of Pr)this.camps.push({def:t,members:[],respawnAt:t.kind==="catalyst"?ka:t.kind==="colossus"?Nc:30,spawned:!1})}spawnStructure(t){const e=this.sim,n=kd[t.type],i=t.type==="seal"?"seal":t.type==="engine"?"engine":t.type==="core"?"core":"tower",s=e.blank(i,t.team,t.type==="outer"?"Outer Tower":t.type==="inner"?"Inner Tower":t.type==="guard"?"Seal Guard Tower":t.type==="seal"?"Seal":t.type==="core"?"Core Tower":"Crown Engine",t.x,t.z,n.radius);return s.stype=t.type,s.defId=t.id,s.lane=t.lane,s.maxHp=n.hp,s.hp=n.hp,s.ad=n.ad,s.armor=n.armor,s.ward=n.ward,s.range=n.range,s.as=1/n.asec,s.vision=t.type==="engine"||t.type==="seal"?8:12,s.invuln=t.type==="seal"||t.type==="engine"||t.type==="core",s.facing=t.team===0?0:Math.PI,this.structures.set(t.id,s),this.sealDefs.set(t.id,t),s}hasAlliedMinionNear(t){for(const e of this.sim.units){if(e.dead||e.team!==t.team||e.kind!=="minion")continue;const n=e.x-t.x,i=e.z-t.z;if(n*n+i*i<196)return!0}return!1}step(){const t=this.sim,e=t.time;if(t.winner>=0)return;e>=this.nextWave&&(this.spawnWave(),this.nextWave+=Jh),this.updateInvulnerability();const n=t.tick%5;for(const i of t.units)i.dead||(i.kind==="minion"?i.id%5===n&&this.minionAI(i):i.kind==="monster"?i.id%3===t.tick%3&&this.monsterAI(i):(i.kind==="tower"||i.kind==="core")&&this.towerAI(i));this.stepCamps();for(const i of t.heroes)i.dead&&e>=i.hero.respawnAt&&t.heroRespawn(i);if(t.tick%5===0)for(const i of t.heroes){if(i.dead)continue;const s=Ge[1-i.team].fountain;et(i.x,i.z,s.x,s.z)<8&&t.damage(null,i,140,"pure",{label:"Fountain"})}for(const i of Object.keys(this.sealRespawnAt))if(e>=this.sealRespawnAt[i]){delete this.sealRespawnAt[i];const s=this.sealDefs.get(i),a=this.spawnStructure(s);a.sealRespawns=1,t.teams[s.team].sealDown[s.lane]=!1,t.teams[1-s.team].vanguardLane[s.lane]=!1,t.emit({t:"announce",text:`${Te[s.team]}'s Seal has re-formed`,team:s.team,priority:2,sound:"seal"})}if(t.tick%10===0)for(const i of this.structures.values()){if(i.dead||e-i.lastHeroDamagedAt>1.2)continue;const s=this.alerted.get(i.id)??-99;e-s>12&&(this.alerted.set(i.id,e),t.emit({t:"announce",text:`${Te[i.team]} ${i.name} under attack`,team:i.team,priority:1,sound:"alert"}))}}updateInvulnerability(){const t=this.sim;for(const e of[0,1]){const n=e===0?"b":"r";for(let o=0;o<2;o++){const l=this.structures.get(`${n}-seal-${o}`),c=this.structures.get(`${n}-guard-${o}`);l&&!l.dead&&(l.invuln=!!(c&&!c.dead))}const i=t.teams[e].sealDown[0]||t.teams[e].sealDown[1],s=[0,1].map(o=>this.structures.get(`${n}-core-${o}`)).filter(Boolean);for(const o of s)o.dead||(o.invuln=!i);const a=this.structures.get(`${n}-engine`);a&&!a.dead&&(a.invuln=s.some(o=>!o.dead))}}spawnWave(){const t=this.sim;this.waveNo++;const n=this.waveNo%3===0;for(const i of[0,1])for(let s=0;s<2;s++){const a=["guard","guard","guard","bolt","bolt","bolt"];n&&a.push("siege"),t.teams[i].vanguardLane[s]&&a.unshift("vanguard"),a.forEach((o,l)=>t.after(l*.6,()=>{t.winner<0&&this.spawnMinion(i,s,o)}))}t.teams[0].wavesSpawned++,t.teams[1].wavesSpawned++}pathCache=new Map;pathFor(t,e){const n=`${t}-${e}`;let i=this.pathCache.get(n);if(!i){const s=Oc(t,e),a=Ge[1-t],o=s[s.length-1],l=a.cores.slice().sort((c,h)=>et(c.x,c.z,o.x,o.z)-et(h.x,h.z,o.x,o.z))[0];i=[...s,{x:(l.x+o.x)/2,z:(l.z+o.z)/2},a.engine],this.pathCache.set(n,i)}return i}spawnMinion(t,e,n){const i=this.sim,s=this.pathFor(t,e),a=Id[n],o=i.time/60,l=Math.max(0,o-10),c=1+.02*o+.06*l,h=1+.014*o+.08*l,u=(i.rng.next()-.5)*2.2,d=i.blank("minion",t,n==="guard"?"Guard":n==="bolt"?"Bolt":n==="siege"?"Siege":"Vanguard",s[0].x+u*.5,s[0].z+u,a.radius);return d.mtype=n,d.lane=e,d.wpath=s,d.wp=1,d.maxHp=Math.round(a.hp*c),d.hp=d.maxHp,d.baseAd=a.ad*h,d.ad=d.baseAd,d.baseAr=a.armor,d.armor=a.armor,d.ward=0,d.baseWd=0,d.range=a.range,d.as=a.as,d.baseMs=a.ms,d.ms=a.ms,d.windup=a.wind,d.projSpeed=a.proj,d.gold=a.gold+Math.floor(o*.4),d.xp=a.xp,d.vision=n==="siege"?8:7,d.facing=Math.atan2(s[1].z-s[0].z,s[1].x-s[0].x),i.setOrder(d,"move",s[1].x,s[1].z),d}pickMinionTarget(t){const e=this.sim,n=e.time,i=t.range>3?8:7;let s=null,a=1/0;for(const o of e.units){if(o.dead||o.team===t.team||o.team===2||o.invuln||o.kind==="ward")continue;const l=et(t.x,t.z,o.x,o.z);if(l>i+o.radius||!e.canSee(t.team,o))continue;let c=l;if(o.kind==="hero"){const h=o.hero.aggroUntil[t.team]>n;if(!h&&l>4.5)continue;c+=h?-12:5}else if(o.stype){if(l>t.range+o.radius+1.2)continue;c+=10}else o.kind==="decoy"&&(c+=6);c<a&&(a=c,s=o)}return s}minionAI(t){const e=this.sim,n=t.wpath;for(;t.wp<n.length-1&&et(t.x,t.z,n[t.wp].x,n[t.wp].z)<2.6;)t.wp++;if(e.teams[t.team].colossusUntil>e.time?(t.scale===1&&(t.scale=1.3,t.maxHp=Math.round(t.maxHp*1.25),t.hp=Math.min(t.maxHp,t.hp+t.maxHp*.2)),e.addEffect(t,"mod",.6,0,0,{mods:{ad:t.baseAd*.3,armor:12},tag:"colossus"})):t.scale!==1&&(t.scale=1),e.isStunned(t))return;let i=t.order.t==="attack"?e.byId.get(t.order.target):void 0;i&&(i.dead||i.team===t.team||!e.canSee(t.team,i)||et(t.x,t.z,i.x,i.z)>11&&!i.stype||i.invuln)&&(i=void 0);const s=this.pickMinionTarget(t);if(s&&(!i||s.kind==="hero"&&i.kind!=="hero"&&s.hero.aggroUntil[t.team]>e.time)&&(i=s),!i&&t.wp>=n.length-1){let a=1e9;for(const o of this.structures.values()){if(o.dead||o.team===t.team||o.invuln)continue;const l=et(t.x,t.z,o.x,o.z);l<a&&(a=l,i=o)}}i?(t.order.t!=="attack"||t.order.target!==i.id)&&e.setOrder(t,"attack",0,0,i.id):e.setOrder(t,"move",n[t.wp].x,n[t.wp].z)}towerAI(t){const e=this.sim,n=e.time;if(t.invuln&&t.stype,e.tick%4===t.id%4&&this.towerSelect(t),n<t.tnext)return;const i=e.byId.get(t.ttarget);if(!i||i.dead){t.ttarget=0;return}if(et(t.x,t.z,i.x,i.z)>t.range+i.radius){t.ttarget=0;return}t.tnext=n+1/t.as,t.tlastTarget===i.id?t.tramp=Math.min(5,t.tramp+1):(t.tramp=0,t.tlastTarget=i.id);const a=t.ad*(1+t.tramp*.15)*(i.kind==="minion"?.85:1);e.emit({t:"towerShot",tower:t.id,target:i.id}),e.spawnProjectile({team:t.team,owner:t.id,x:t.x,z:t.z+0,dx:i.x-t.x,dz:i.z-t.z,speed:32,range:99,homing:i.id,kind:"tower",radius:.3,color:t.team===0?7391487:16747104,size:.35,fx:"tower",onHit:(o,l)=>e.damage(t,l,a,"physical",{label:t.name})})}towerSelect(t){const e=this.sim,n=e.time,i=t.range;let s=null,a=1e9;for(const l of e.heroes){if(l.dead||l.team===t.team||l.invuln||l.hero.aggroUntil[t.team]<=n)continue;const c=et(t.x,t.z,l.x,l.z);c<=i+l.radius&&c<a&&e.canSee(t.team,l)&&(a=c,s=l)}if(s){t.ttarget=s.id;return}const o=e.byId.get(t.ttarget);if(!(o&&!o.dead&&o.team!==t.team&&et(t.x,t.z,o.x,o.z)<=i+o.radius&&e.canSee(t.team,o)&&!o.invuln&&o.kind!=="hero")){a=1e9,s=null;for(const l of e.units){if(l.dead||l.team===t.team||l.team===2||l.kind==="ward"||l.kind!=="minion"&&l.kind!=="decoy")continue;const c=et(t.x,t.z,l.x,l.z);c<=i+l.radius&&c<a&&e.canSee(t.team,l)&&(a=c,s=l)}if(!s)for(const l of e.heroes){if(l.dead||l.team===t.team||l.invuln)continue;const c=et(t.x,t.z,l.x,l.z);c<=i+l.radius&&c<a&&e.canSee(t.team,l)&&(a=c,s=l)}t.ttarget=s?s.id:0,s||(t.tramp=0)}}stepCamps(){const e=this.sim.time;for(const n of this.camps)if(!n.spawned&&e>=n.respawnAt)this.spawnCamp(n);else if(n.spawned&&n.members.every(i=>i.dead)){n.spawned=!1,n.members=[];const i=n.def.kind==="small"?75:n.def.kind==="buff"?120:n.def.kind==="catalyst"?Zh:Qh;n.respawnAt=e+i}}spawnCamp(t){const e=this.sim,n=Ld[t.def.family];t.spawned=!0;const s=1+.012*(e.time/60);t.members=n.map((a,o)=>{const l=gl[o%gl.length],c=a.big?1.6:1,h=e.blank("monster",2,a.name,t.def.x+l[0]*c,t.def.z+l[1]*c,a.radius);return h.maxHp=Math.round(a.hp*s),h.hp=h.maxHp,h.baseAd=a.ad*s,h.ad=h.baseAd,h.baseAr=a.armor,h.armor=a.armor,h.baseWd=a.armor*.6,h.ward=h.baseWd,h.range=a.range,h.as=a.as,h.baseMs=a.ms,h.ms=a.ms,h.projSpeed=a.proj,h.windup=.32,h.gold=a.gold,h.xp=a.xp,h.vision=0,h.lane=o,h.camp={id:t.def.id,kind:t.def.kind,hx:h.x,hz:h.z,leash:t.def.kind==="colossus"?12:t.def.kind==="catalyst"?9:11,family:t.def.family,team:t.def.team,member:o,engaged:!1,target:0,resetUntil:0},h.facing=Math.atan2(-t.def.z,-t.def.x),h}),(t.def.kind==="catalyst"||t.def.kind==="colossus")&&(e.emit({t:"announce",text:t.def.kind==="colossus"?"The Aether Colossus has risen in the Mistwood":`The ${t.def.id==="catalyst-n"?"Northern":"Southern"} Catalyst has awoken`,team:2,priority:2,sound:"objective"}),e.note(t.def.kind==="colossus"?"Aether Colossus spawned":"Catalyst spawned",2,"objective"))}lastAttacker(t){let e=null,n=-1;for(const[i,s]of t.damagers)if(s>n){const a=this.sim.byId.get(i);a&&!a.dead&&(n=s,e=a)}return e&&this.sim.time-n<3?e:null}monsterAI(t){const e=this.sim,n=e.time,i=t.camp;if(e.isStunned(t))return;const s=et(t.x,t.z,i.hx,i.hz);if(i.resetUntil>n){e.setOrder(t,"move",i.hx,i.hz),t.hp=Math.min(t.maxHp,t.hp+t.maxHp*.06),s<.8&&(i.resetUntil=0,i.engaged=!1,i.target=0,t.hp=t.maxHp);return}if(!i.engaged){if(n-t.lastDamagedAt<.6){const l=this.lastAttacker(t);if(l){const c=this.camps.find(h=>h.def.id===i.id);for(const h of c?.members??[t])!h.dead&&h.camp&&(h.camp.engaged=!0,h.camp.target=l.id)}}return}const a=e.byId.get(i.target),o=!a||a.dead||et(a.x,a.z,i.hx,i.hz)>i.leash+3||a.team!==2&&!e.canSee(2,a)&&et(t.x,t.z,a.x,a.z)>9;if(o||s>i.leash){const l=this.lastAttacker(t);if(l&&!o)i.target=l.id;else{const c=l&&et(l.x,l.z,i.hx,i.hz)<i.leash?l:null;if(c){i.target=c.id,e.setOrder(t,"attack",0,0,c.id);return}i.resetUntil=n+20,i.target=0,i.engaged=!1,e.setOrder(t,"move",i.hx,i.hz);return}}(t.order.t!=="attack"||t.order.target!==i.target)&&e.setOrder(t,"attack",0,0,i.target)}teamOfLastDamager(t){let e=-1,n=null;for(const[i,s]of t.damagers){const a=this.sim.byId.get(i);!a||a.team!==0&&a.team!==1||s>e&&(e=s,n=a.team)}return n}onMonsterKilled(t,e){const n=this.sim,i=t.camp;if(!i)return;const s=e?e.team:this.teamOfLastDamager(t);if(s===null)return;const a=this.camps.find(l=>l.def.id===i.id),o=a?a.members.filter(l=>l!==t).every(l=>l.dead):!0;if(i.kind==="buff"&&e&&(i.family==="heartroot"?n.addEffect(e,"mod",90,0,e.id,{mods:{hpRegen:7,manaRegen:3,haste:10},tag:"heartroot"}):n.addEffect(e,"mod",90,0,e.id,{mods:{as:.18,ad:10},tag:"cinder"}),n.emit({t:"announce",text:`${e.hero.name} claimed the ${i.family==="heartroot"?"Heartroot":"Cinder"} Boon`,team:s,priority:0,sound:"buff"})),!!o){if(i.kind==="catalyst"){const l=i.id==="catalyst-n",c=n.teams[s];l?c.buffMoveUntil=n.time+240:c.buffStructUntil=n.time+240;for(const h of n.heroes)h.team===s&&(n.giveGold(h,140),!h.dead&&(h.id===e?.id||n.time-(t.damagers.get(h.id)??-99)<12)&&h.hero.objectives++);n.emit({t:"announce",text:`${Te[s]} claimed the ${l?"Northern Catalyst: swift roads":"Southern Catalyst: siege power"}`,team:s,priority:2,sound:"objective"}),n.note(`${Te[s]} took the ${l?"Northern":"Southern"} Catalyst`,s,"objective")}else if(i.kind==="colossus"){n.teams[s].colossusUntil=n.time+150;for(const l of n.heroes)l.team===s&&(n.giveGold(l,180),(n.time-(t.damagers.get(l.id)??-99)<12||l.id===e?.id)&&l.hero.objectives++);n.emit({t:"announce",text:`${Te[s]} felled the Aether Colossus: minions empowered`,team:s,priority:3,sound:"objective"}),n.note(`${Te[s]} felled the Aether Colossus`,s,"objective")}}}onStructureDestroyed(t,e,n){const i=this.sim,s=t.team,a=1-s;if(i.teams[s].structuresLost++,i.teams[a].towers++,n&&n.hero.structures++,t.stype==="outer"||t.stype==="inner"||t.stype==="guard"||t.stype==="core"||t.stype==="seal")for(const c of i.heroes)c.team===a&&i.giveGold(c,c.id===n?.id?220:110);i.emit({t:"structure",id:t.id,stype:t.stype,team:t.team,killer:e?.id??0}),i.emit({t:"fx",kind:"collapse",x:t.x,z:t.z,r:t.radius*2.2,color:t.team===0?7391487:16747104,dur:1.2}),i.note(`${Te[a]} destroyed ${Te[s]}'s ${t.name}`,a,"structure");const l=t.stype==="seal"?`${Te[s]}'s Seal is broken: Vanguards advance`:t.stype==="engine"?"The Crown Engine is destroyed":`${Te[s]}'s ${t.name} has fallen`;if(i.emit({t:"announce",text:l,team:a,priority:3,sound:t.stype==="seal"?"seal":"tower"}),t.stype==="seal"){const c=t.lane;i.teams[s].sealDown[c]=!0,i.teams[a].vanguardLane[c]=!0,t.sealRespawns<1&&(this.sealRespawnAt[t.defId]=i.time+td)}t.stype==="engine"&&this.victory(a)}victory(t){const e=this.sim;e.winner>=0||(e.winner=t,e.lastTick=e.tick,e.emit({t:"victory",team:t}),e.note(`${Te[t]} destroyed the Crown Engine`,t,"victory"))}}const Ud=[{x:-3,z:-25},{x:3,z:25},{x:-9,z:-28},{x:9,z:28},{x:0,z:-14.5},{x:0,z:14.5},{x:-24,z:-31},{x:24,z:31}];class Nd{constructor(t){this.sim=t,this.assignRoles()}brains=new Map;plans=[{mode:"lane",lane:0,boss:null,nextEval:0},{mode:"lane",lane:0,boss:null,nextEval:0}];goalsFor(t){const e=Ut[t],n=e.builds[this.sim.rng.int(0,e.builds.length-1)].items;return n.filter((i,s)=>ee[i].tier!=="component"?!0:i==="swiftsole"?!n.slice(s+1).some(o=>ee[o].from?.includes("swiftsole")):!1)}assignRoles(){const t=this.sim;for(const e of[0,1]){const n=t.heroes.filter(u=>u.team===e),i=n.filter(u=>u.hero.controller==="bot"),s=n.some(u=>u.hero.controller==="player"),a=[...i].sort((u,d)=>Ut[d.hero.heroId].jungle-Ut[u.hero.heroId].jungle)[0],o=a&&Ut[a.hero.heroId].jungle>=3&&n.length>=3;let l=s?1:0;const c=i.filter(u=>!(o&&u===a));c.sort((u,d)=>(Ut[u.hero.heroId].role==="Support"?1:0)-(Ut[d.hero.heroId].role==="Support"?1:0));const h=[[],[]];for(const u of c){let d=l;s?d=1:d=h[0].length<=h[1].length?0:1,h[d].push(u),l=1-l}for(const u of i){const d=o&&u===a,f=d||h[0].includes(u)?0:1,g=d?[]:h[f].filter(p=>p!==u),x=Ut[u.hero.heroId].role==="Support"&&(g.length>0||s&&f===1),m=x?g.find(p=>Ut[p.hero.heroId].role!=="Support")?.id??0:0;this.brains.set(u.id,{role:d?"jungle":x?"support":"lane",lane:f,partner:m,state:"Lane",goals:this.goalsFor(u.hero.heroId),ward:0,lastRecall:0,think:0,lastGoto:{x:0,z:0},campIdx:0,lastBuyCheck:0,objUntil:0,talentTick:0,lastAb:0})}}}laneAssignments(){return[...this.brains.entries()].map(([t,e])=>({id:t,role:e.role,lane:e.lane}))}update(){const t=this.sim;if(t.winner>=0)return;const e=t.cfg.difficulty==="easy"?10:t.cfg.difficulty==="hard"?4:6;for(const n of[0,1])this.planTeam(n);for(const n of t.heroes){const i=this.brains.get(n.id);!i||n.hero.controller!=="bot"||n.dead||(t.tick+i.think)%e===0&&this.think(n,i)}}planTeam(t){const e=this.sim,n=this.plans[t];if(e.time<n.nextEval)return;n.nextEval=e.time+6;const i=e.cfg.enemyPassive&&t===1,s=e.cfg.difficulty==="hard"?210:e.cfg.difficulty==="easy"?480:270;n.mode=!i&&e.time>=s?"group":"lane";const a=1-t;let o=0,l=-1e9;for(let c=0;c<2;c++){const h=a===0?"b":"r";let u=0;for(const f of["outer","inner","guard","seal"]){const g=this.sim.rules.structures.get(`${h}-${f}-${c}`);g&&!g.dead&&u++}let d=-u*10;e.teams[a].sealDown[c]&&(d+=40),d+=c===0?.1:0,d>l&&(l=d,o=c)}if(n.lane=o,n.boss=null,n.mode==="group"){const c=e.units.filter(d=>d.kind==="monster"&&!d.dead&&d.camp&&(d.camp.kind==="colossus"||d.camp.kind==="catalyst")),h=e.heroes.filter(d=>d.team===t&&!d.dead),u=c.find(d=>d.camp.kind==="colossus");(u&&h.length>=2&&!this.sim.teams[t].structuresLost||u&&h.length>=2&&e.time>700)&&(n.boss="colossus")}}cmdMove(t,e,n,i){const s=t.order;s.t==="move"&&et(s.x,s.z,e,n)<2.5||(this.sim.command({slot:t.hero.slot,c:"move",x:e,z:n}),i.lastGoto={x:e,z:n})}cmdAttack(t,e){t.order.t==="attack"&&t.order.target===e.id||this.sim.command({slot:t.hero.slot,c:"attack",target:e.id})}visibleEnemyHeroes(t,e){const n=this.sim;return n.heroes.filter(i=>!i.dead&&i.team!==t.team&&n.canSee(t.team,i)&&et(t.x,t.z,i.x,i.z)<=e)}power(t){return t.hp/t.maxHp*(t.hero.level*10+t.ad*.4+t.ap*.4+t.maxHp*.03)}nearestOwnTower(t){let e=null,n=1e9;for(const i of this.sim.rules.structures.values()){if(i.dead||i.team!==t.team||i.kind!=="tower"&&i.kind!=="core")continue;const s=et(t.x,t.z,i.x,i.z);s<n&&(n=s,e=i)}return e}enemyTowerThreat(t){for(const e of this.sim.rules.structures.values())if(!(e.dead||e.team===t.team||e.kind!=="tower"&&e.kind!=="core")&&et(t.x,t.z,e.x,e.z)<e.range+1.5){let n=0;for(const i of this.sim.units)i.kind==="minion"&&i.team===t.team&&!i.dead&&et(i.x,i.z,e.x,e.z)<e.range&&n++;if(n<2||t.hero.aggroUntil[1-t.team]>this.sim.time)return!0}return!1}think(t,e){const n=this.sim,i=t.hero,s=n.time;n.cfg.difficulty;const a=!!n.cfg.enemyPassive&&t.team===1;for(;i.skillPts>0;){const y=[3,0,1,2];let M=!1;for(const z of y){const A=i.skillPts;if(n.command({slot:i.slot,c:"rank",ab:z}),i.skillPts<A){M=!0;break}}if(!M)break}if(i.recallStart>0&&this.visibleEnemyHeroes(t,11).length===0)return;const o=n.inShop(t);o&&this.shop(t,e);const l=t.hp/t.maxHp,c=this.visibleEnemyHeroes(t,14),h=n.heroes.filter(y=>!y.dead&&y.team===t.team&&y.id!==t.id&&et(y.x,y.z,t.x,t.z)<14),u=this.power(t)+h.reduce((y,M)=>y+this.power(M),0),d=c.reduce((y,M)=>y+this.power(M),0),f=this.nextGoalCost(t,e),g=Ge[t.team].fountain;if(s-e.talentTick>.5){e.talentTick=s;for(let y=0;y<2;y++){const M=i.talents[y];i.talentCds[y]>s||(M==="mend"&&l<.4&&c.length?n.command({slot:i.slot,c:"talent",idx:y,x:t.x,z:t.z}):M==="aegis"&&c.length&&l<.7?n.command({slot:i.slot,c:"talent",idx:y,x:t.x,z:t.z}):M==="sprint"&&l<.35&&c.length?n.command({slot:i.slot,c:"talent",idx:y,x:t.x,z:t.z}):M==="cinder"&&c.length&&c.some(z=>z.hp/z.maxHp<.6&&et(z.x,z.z,t.x,t.z)<6)?n.command({slot:i.slot,c:"talent",idx:y,x:t.x,z:t.z}):M==="purify"&&(n.has(t,"stun")||n.has(t,"root"))&&c.length?n.command({slot:i.slot,c:"talent",idx:y,x:t.x,z:t.z}):M==="skyhop"&&l<.3&&c.length&&n.command({slot:i.slot,c:"talent",idx:y,x:g.x,z:g.z}))}}if((l<.3||l<.45&&d>u)&&!a){if(e.state="Retreat",c.length===0&&et(t.x,t.z,g.x,g.z)>22&&s-t.lastDamagedAt>2.5&&i.recallStart===0){n.command({slot:i.slot,c:"recall"});return}o||(this.cmdMove(t,g.x,g.z,e),this.retreatSkills(t,c));return}if(e.state==="Retreat"){if(l<.8&&o)return i.recallStart>0,void 0;(l>=.8||!o)&&(e.state="Lane")}if(f>0&&i.gold>=f&&!o&&c.length===0&&s-e.lastRecall>45&&s-t.lastDamagedAt>3&&i.recallStart===0&&et(t.x,t.z,g.x,g.z)>16){e.lastRecall=s,e.state="RecallBuy",n.command({slot:i.slot,c:"recall"});return}if(o&&(l<.9||f>0&&i.gold>=f)&&!(s-i.respawnAt<40&&l>=.9)){if(l<.9){this.cmdMove(t,g.x+1,g.z,e);return}}const m=c.filter(y=>et(t.x,t.z,y.x,y.z)<t.range+6),p=m.length>0&&u>=d*.6&&!this.enemyTowerThreat(t);if(p&&!a){e.state="Fight";let y=m[0],M=1e9;for(const A of m){const T=A.hp+et(t.x,t.z,A.x,A.z)*25;T<M&&(M=T,y=A)}const z=et(t.x,t.z,y.x,y.z);e.role==="support"&&Ut[i.heroId].role==="Support"&&h.length===0&&l<.6,this.useAbilities(t,y,c,h),z>t.range+y.radius+.3&&Ut[i.heroId].range>4&&z<t.range+2.5?this.cmdAttack(t,y):this.cmdAttack(t,y);return}if(a){this.laneBehavior(t,e,c,h,!0);return}if(!a)for(const y of n.rules.structures.values()){if(y.dead||y.team!==t.team||s-y.lastDamagedAt>3)continue;const M=n.heroes.find(z=>!z.dead&&z.team!==t.team&&n.canSee(t.team,z)&&et(z.x,z.z,y.x,y.z)<16);if(M&&et(t.x,t.z,y.x,y.z)<55&&(c.length===0||p)){e.state="Defend",et(t.x,t.z,M.x,M.z)<12?(this.useAbilities(t,M,c,h),this.cmdAttack(t,M)):this.cmdMove(t,M.x,M.z,e);return}}const _=this.plans[t.team];if(_.mode==="group"&&e.role!=="jungle"||_.mode==="group"&&s>660){if(_.boss==="colossus"){const y=n.units.find(M=>M.kind==="monster"&&!M.dead&&M.camp?.kind==="colossus");if(y){this.objectiveBehavior(t,e,y,c);return}}e.state="Group",this.laneBehavior(t,e,c,h,!1,_.lane);return}if(e.role==="jungle"){this.jungleBehavior(t,e,c);return}this.laneBehavior(t,e,c,h,!1)}objectiveBehavior(t,e,n,i){const s=this.sim;e.state="Objective";const a=s.heroes.filter(o=>!o.dead&&o.team===t.team&&et(o.x,o.z,n.x,n.z)<14);if(i.length>a.length){this.cmdMove(t,Ge[t.team].spawn.x*.5,Ge[t.team].spawn.z*.5,e);return}if(et(t.x,t.z,n.x,n.z)>9&&a.length<2){const o=t.team===0?-11:11;this.cmdMove(t,o,0,e);return}this.useAbilities(t,n,i,a),this.cmdAttack(t,n)}nextGoalCost(t,e){const n=t.hero;for(const i of e.goals){const s=On(n,i);if(!(!s.ok&&s.reason==="Already owned")&&s.ok)return Math.min(s.cost,this.cheapestMissing(t,i)||s.cost)}return n.items.filter(i=>i&&i.id==="draught").length<2?70:0}cheapestMissing(t,e){const n=ee[e];if(!n.from)return n.cost;const i=t.hero;let s=1e9;for(const a of n.from)i.items.some(o=>o&&o.id===a)||(s=Math.min(s,ee[a].cost));return s===1e9?On(i,e).cost:s}shop(t,e){const n=this.sim,i=t.hero;if(n.time-e.lastBuyCheck<1)return;e.lastBuyCheck=n.time;for(let a=0;a<5;a++){let o=!1;for(const l of e.goals){const c=On(i,l);if(!c.ok){if(c.reason==="Already owned")continue;if(c.reason==="Inventory full")break;continue}if(i.gold>=c.cost){n.command({slot:i.slot,c:"buy",item:l}),o=!0;break}const h=ee[l];if(h.from){const d=h.from.filter(f=>!i.items.some(g=>g&&g.id===f)).map(f=>ee[f]).filter(f=>f.cost<=i.gold).sort((f,g)=>g.cost-f.cost)[0];d&&(n.command({slot:i.slot,c:"buy",item:d.id}),o=!0)}break}if(!o)break}if(i.items.filter(a=>a&&a.id==="draught").reduce((a,o)=>a+o.qty,0)<2&&i.gold>400&&e.goals.every(a=>!On(i,a).ok)&&n.command({slot:i.slot,c:"buy",item:"draught"}),t.hp/t.maxHp<.6){const a=i.items.findIndex(o=>o&&o.id==="draught");a>=0&&n.command({slot:i.slot,c:"use",idx:a})}}retreatSkills(t,e){const n=this.sim,i=t.hero,s=Ut[i.heroId],a=Ge[t.team].fountain;for(const o of[1,2]){const l=s.abilities[o];l.ai!=="escape"||i.ranks[o]<=0||i.cds[o]>n.time||t.mana<l.cost[i.ranks[o]-1]||e.length!==0&&n.command({slot:i.slot,c:"cast",ab:o,x:a.x,z:a.z,target:0})}}laneBehavior(t,e,n,i,s,a){const o=this.sim,l=t.hero,c=a??e.lane,h=o.rules.pathFor(t.team,c);e.state=a!==void 0?"Group":"Lane";const u=t.team;let d=null;for(const T of o.units)T.dead||T.kind!=="minion"||T.team!==u||T.lane!==c||(!d||T.wp>d.wp||T.wp===d.wp&&et(T.x,T.z,h[T.wp].x,h[T.wp].z)<et(d.x,d.z,h[d.wp].x,h[d.wp].z))&&(d=T);const f=this.laneRallyPoint(t,c);let g=d?{x:d.x,z:d.z}:f;if(d){const T=h[Math.max(0,d.wp-1)],C=qe(T.x-d.x,T.z-d.z);g={x:d.x+C.x*3.2,z:d.z+C.z*3.2}}const x=t.ad*.95,m=t.range;if(e.role==="support"&&e.partner){const T=o.byId.get(e.partner);T&&!T.dead&&(g={x:T.x-(u===0?1.8:-1.8),z:T.z+1.2})}let p=null,_=1e9;const y=m+.7,M=e.role==="support"&&Ut[l.heroId].role==="Support";for(const T of o.units){if(T.dead||T.team===u||T.team===2||T.invuln||T.kind==="ward"||!o.canSee(u,T))continue;const C=et(t.x,t.z,T.x,T.z)-T.radius;if(C>y+.5||T.stype)continue;let w=C;if(T.kind==="minion"){M&&(w+=8);const b=T.hp<=x*1.05;w+=b?-6:T.hp/T.maxHp*2,!b&&T.hp>x*3&&o.cfg.difficulty!=="hard"&&o.rng.next()<.4&&(w+=3)}else if(T.kind==="hero"){if(this.enemyTowerThreat(t))continue;w+=1}w<_&&(_=w,p=T)}if(this.enemyTowerThreat(t)&&!(a!==void 0&&i.length>=2&&t.hp/t.maxHp>.5)&&!s){this.cmdMove(t,g.x,g.z,e);return}if(p){p.kind==="hero"?this.useAbilities(t,p,n,i):Ut[l.heroId].range>4&&p.hp>x*1.5&&!M&&this.farmAbilities(t,p),this.cmdAttack(t,p);return}if(!s&&a!==void 0&&n.length<=i.length+1){const T=this.pushStructure(t,c);if(T){const C=et(t.x,t.z,T.x,T.z),w=t.range+T.radius+.5;if(C<=w){this.cmdAttack(t,T);return}let b=0;for(const k of o.units)k.kind==="minion"&&k.team===u&&!k.dead&&et(k.x,k.z,T.x,T.z)<12&&b++;if(b>=1||i.length>=1||t.hp/t.maxHp>.7){const k=qe(T.x-t.x,T.z-t.z);this.cmdMove(t,T.x-k.x*(w-.8),T.z-k.z*(w-.8),e);return}}}if(!s)for(const T of o.rules.structures.values()){if(T.dead||T.team===u||T.invuln||et(t.x,t.z,T.x,T.z)>t.range+T.radius+.8)continue;let C=0;for(const b of o.units)b.kind==="minion"&&b.team===u&&!b.dead&&et(b.x,b.z,T.x,T.z)<10&&C++;const w=T.ttarget===t.id;if(C>=2&&!w&&n.length===0||C>=1&&n.length===0&&this.plans[u].mode==="group"){this.cmdAttack(t,T);return}}const A=(t.id%3-1)*1.1;this.cmdMove(t,g.x+A,g.z+A*.6,e),this.maybeWard(t,e)}pushStructure(t,e){let n=null,i=1e9;for(const s of this.sim.rules.structures.values()){if(s.dead||s.team===t.team||s.invuln)continue;const o=(s.lane===e&&s.stype!=="core"&&s.stype!=="engine"?0:25)+et(t.x,t.z,s.x,s.z)*.4+(s.stype==="engine"?-10:0);o<i&&(i=o,n=s)}return n}laneRallyPoint(t,e){const n=this.sim,i=t.team===0?"b":"r";for(const s of["outer","inner","guard","seal"]){const a=n.rules.structures.get(`${i}-${s}-${e}`);if(a&&!a.dead){const o=Oc(t.team,e);let l=0,c=1e9;for(let d=0;d<o.length;d++){const f=et(o[d].x,o[d].z,a.x,a.z);f<c&&(c=f,l=d)}const h=o[Math.min(o.length-1,l+1)],u=qe(h.x-a.x,h.z-a.z);return{x:a.x+u.x*3.2,z:a.z+u.z*3.2}}}return Ge[t.team].spawn}maybeWard(t,e){const n=this.sim,i=t.hero;if(n.cfg.difficulty==="easy"||i.trinketCharges<=0||n.time-e.ward<55)return;let s=null,a=12;for(const o of Ud){const l=et(t.x,t.z,o.x,o.z);l<a&&!n.units.some(c=>c.kind==="ward"&&c.team===t.team&&!c.dead&&et(c.x,c.z,o.x,o.z)<6)&&(a=l,s=o)}s&&(n.command({slot:i.slot,c:"ward",x:s.x,z:s.z}),e.ward=n.time)}jungleBehavior(t,e,n){const i=this.sim,s=t.hero;e.state="Jungle";const a=t.team===0?"b-":"r-";if(s.level>=4){const h=i.heroes.find(u=>!u.dead&&u.team!==t.team&&i.canSee(t.team,u)&&u.hp/u.maxHp<.65&&et(t.x,t.z,u.x,u.z)<38&&!this.towerNear(u,t.team));if(h&&t.hp/t.maxHp>.55){e.state="Gank",this.useAbilities(t,h,n,[]),et(t.x,t.z,h.x,h.z)>2?this.cmdAttack(t,h):this.cmdAttack(t,h);return}}const o=i.rules.camps.filter(h=>h.def.id.startsWith(a)&&h.spawned&&h.members.some(u=>!u.dead));o.sort((h,u)=>et(t.x,t.z,h.def.x,h.def.z)-et(t.x,t.z,u.def.x,u.def.z));const l=o[0];if(!l){this.laneBehavior(t,e,n,[],!1,e.lane);return}const c=l.members.filter(h=>!h.dead).sort((h,u)=>et(t.x,t.z,h.x,h.z)-et(t.x,t.z,u.x,u.z))[0];if(!i.canSee(t.team,c)||et(t.x,t.z,c.x,c.z)>t.range+9){this.cmdMove(t,l.def.x-(t.team===0?2.5:-2.5),l.def.z,e);return}et(t.x,t.z,c.x,c.z)<t.range+5&&c.camp?.engaged&&this.farmAbilities(t,c),this.cmdAttack(t,c),this.maybeWard(t,e)}towerNear(t,e){for(const n of this.sim.rules.structures.values())if(!n.dead&&n.team!==e&&(n.kind==="tower"||n.kind==="core")&&et(t.x,t.z,n.x,n.z)<n.range+2)return!0;return!1}farmAbilities(t,e){const n=this.sim,i=t.hero,s=Ut[i.heroId];if(!(t.mana<t.maxMana*.5))for(const a of[0,2]){const o=s.abilities[a];if(!(i.ranks[a]<=0||i.cds[a]>n.time||o.ult)&&!(o.ai!=="skillshot"&&o.ai!=="point")&&!(et(t.x,t.z,e.x,e.z)>o.range*.9)){n.command({slot:i.slot,c:"cast",ab:a,x:e.x,z:e.z,target:0});return}}}aim(t,e,n){const i=this.sim,s=et(t.x,t.z,e.x,e.z),a=(e.x-e.px)/xe,o=(e.z-e.pz)/xe,l=n>0?Math.min(.9,s/n):.25,c=i.cfg.difficulty==="hard"?1:i.cfg.difficulty==="easy"?.2:.65,h=(i.rng.next()-.5)*(1-c)*3.2,u=(i.rng.next()-.5)*(1-c)*3.2;return{x:e.x+a*l*c+h,z:e.z+o*l*c+u}}useAbilities(t,e,n,i){const s=this.sim,a=t.hero,o=s.time;if(t.cast||t.dash||s.isSilenced(t)||o-this.brains.get(t.id).lastAb<.35)return;const l=Ut[a.heroId],c=et(t.x,t.z,e.x,e.z),h=t.hp/t.maxHp,u=e.kind==="hero",d={suri:[26,0,0,0],oru:[11,0,0,9.5],ilyra:[26,0,0,0],brannoch:[0,0,0,0]},f=m=>d[a.heroId]?.[m]??0,g=n.filter(m=>et(t.x,t.z,m.x,m.z)<9).length,x=(m,p,_,y=0)=>{s.command({slot:a.slot,c:"cast",ab:m,x:p,z:_,target:y}),this.brains.get(t.id).lastAb=o};for(const m of[3,2,0,1]){const p=l.abilities[m];if(a.ranks[m]<=0)continue;const _=a.rec[m],y=!!(_&&_.until>o);if(!(!y&&(a.cds[m]>o||t.mana<p.cost[a.ranks[m]-1]))){if(y){if(a.heroId==="kesh"&&m===0&&c<3.4&&o-(_.until-p.recast-p.castTime)>.5){x(m,e.x,e.z);return}if(a.heroId==="brannoch"&&m===2&&_.data&&et(t.x,t.z,_.data.ax,_.data.az)>2.5&&c>3){x(m,e.x,e.z);return}continue}if(!(!u&&!(p.ai==="self"||p.ai==="skillshot"||p.ai==="engage")))switch(p.ai){case"skillshot":{if(c>p.range*.92||p.range<6&&c>p.range||p.ult&&!(u&&(e.hp/e.maxHp<.7||g>=2)))break;const M=this.aim(t,e,f(m));if(a.heroId==="oru"&&m===3&&i.length===0&&e.hp/e.maxHp>.4)break;x(m,M.x,M.z);return}case"point":{if(c>p.range||a.heroId==="ilyra"&&m===3&&!(e.hp/e.maxHp<.65||g>=2)||a.heroId==="ilyra"&&m===1&&g===0)break;const M=this.aim(t,e,f(m));x(m,M.x,M.z);return}case"unit":{if(!u||c>p.range||p.ult&&e.hp/e.maxHp>.75)break;x(m,e.x,e.z,e.id);return}case"ally":{const M=i.filter(z=>et(t.x,t.z,z.x,z.z)<=p.range).sort((z,A)=>z.hp/z.maxHp-A.hp/A.maxHp)[0];if(M){x(m,M.x,M.z,M.id);return}break}case"self":{if(g===0&&c>5.5||a.heroId==="kesh"&&m===3&&!(g>=1&&h<.85)||a.heroId==="kesh"&&m===1&&!(c<5&&h<.75))break;if(a.heroId==="brannoch"&&m===1){if(!(c<7&&n.some(M=>M.range>3)))break;x(m,e.x,e.z);return}x(m,e.x,e.z);return}case"engage":{if(a.heroId==="brannoch"&&m===3){if(c<3||c>10.5||!(u&&g>=1))break;const M=this.aim(t,e,0);x(m,M.x,M.z);return}if(a.heroId==="brannoch"&&m===2){if(c>9||c<4)break;x(m,e.x,e.z);return}if(a.heroId==="kesh"&&m===2){if(c<3.5||c>8)break;x(m,e.x,e.z);return}break}case"escape":{if(a.heroId==="vey"&&m===1&&c<12&&u){x(m,e.x+2,e.z);return}if(a.heroId==="suri"&&m===1&&c<3.5&&h<.6){x(m,t.x*2-e.x,t.z*2-e.z);return}break}}}}}}class $r{cfg;rng;tick=0;units=[];byId=new Map;heroes=[];nextId=1;projectiles=[];zones=[];walls=[];timers=[];events=[];revealers=[];timeline=[];teams;winner=-1;playerSlot=0;paused=!1;rules;bots;firstBlood=!1;lastTick=0;commandLog=[];recordCommands=!1;lastVisTick=-99;sepCache=[];constructor(t){this.cfg=t,this.rng=new As(t.seed);const e=()=>({gold:0,kills:0,towers:0,buffMoveUntil:0,buffStructUntil:0,colossusUntil:0,wavesSpawned:0,vanguardLane:[!1,!1],sealDown:[!1,!1],structuresLost:0,lastStructureAlert:-99});this.teams=[e(),e()],this.rules=new Dd(this),t.picks.forEach((i,s)=>this.spawnHero(i,s));const n=t.picks.findIndex(i=>i.controller==="player");this.playerSlot=n<0?0:n,this.rules.init(),this.bots=new Nd(this);for(const i of this.heroes)this.recomputeStats(i,!0);for(const i of this.heroes)i.hp=i.maxHp,i.mana=i.maxMana}get time(){return this.tick*xe}emit(t){this.events.push(t)}after(t,e){this.timers.push({at:this.time+t,fn:e})}note(t,e,n){this.timeline.push({t:this.time,text:t,team:e,kind:n})}blank(t,e,n,i,s,a){const o={id:this.nextId++,kind:t,team:e,name:n,x:i,z:s,px:i,pz:s,facing:e===1?Math.PI:0,pfacing:0,radius:a,hp:100,maxHp:100,mana:0,maxMana:0,shield:0,shieldUntil:0,shieldSrc:0,dead:!1,ad:0,ap:0,armor:0,ward:0,as:1,ms:3,haste:0,pen:0,lifesteal:0,hpRegen:0,manaRegen:0,range:1.5,windup:.3,vision:8,shieldPower:0,structDmg:1,monsterDmg:1,projSpeed:0,effects:[],order:{t:"idle",x:i,z:s,target:0,path:[],pi:0,rp:0,slot:0},atkTarget:0,atkRelease:0,atkNext:0,cast:null,dash:null,lastDamagedAt:-99,lastCombatAt:-99,lastHeroDamagedAt:-99,damagers:new Map,visUntil:[0,0,0],revealUntil:[0,0,0],brush:0,lane:0,wp:0,scale:1,invuln:!1,ttarget:0,tramp:0,tnext:0,tlastTarget:0,sealRespawns:0,baseMs:3,gold:0,xp:0,heroAggro:new Map,lastAttackerHero:0,owner:0,expires:0,disabledUntil:0,baseAr:0,baseWd:0,baseAd:0,dmgReflect:0,seenAt:0,hushed:!1};return o.pfacing=o.facing,this.units.push(o),this.byId.set(o.id,o),o}spawnHero(t,e){const n=Ut[t.heroId],i=this.cfg.picks.slice(0,e).filter(l=>l.team===t.team).length,s=Ge[t.team].spawn,a=this.blank("hero",t.team,t.name??n.name,s.x+(t.team===0?1.5:-1.5),s.z+(i-1)*2.6,n.radius),o={heroId:n.id,slot:e,controller:t.controller,name:t.name??n.name,level:1,xp:0,skillPts:1,ranks:[0,0,0,0],cds:[0,0,0,0],talents:t.talents,talentCds:[0,0],gold:this.cfg.startGold??cl,totalGold:this.cfg.startGold??cl,items:[null,null,null,null,null,null],trinketCharges:2,trinketNext:0,kills:0,deaths:0,assists:0,lastHits:0,monsterKills:0,damageDealt:0,damageTaken:0,wardsPlaced:0,wardsKilled:0,objectives:0,structures:0,respawnAt:0,recallStart:0,recallDur:0,rec:[null,null,null,null],undo:null,killStreak:0,deathStreak:0,recap:[],skillLog:[],buildLog:[],pa:0,pb:0,pc:0,markId:0,markCd:0,annotations:{},lastMoveDist:0,hotCharge:!1,lastMoveX:a.x,lastMoveZ:a.z,refractReady:!1,unseenSince:0,lastAttackAngle:{},lastCombatAt:-99,boughtSinceFountain:!1,stoneNear:0,stoneStacks:0,armorStacks:[],sunCount:0,shardCd:{},buffs:[],placed:0,aggroUntil:[0,0],deathAt:0,lastDeathPos:{x:a.x,z:a.z},goldSpent:0,damageToStructures:0,visionScore:0,quietUsed:!1};return a.hero=o,a.range=n.range,a.projSpeed=n.projSpeed,a.windup=n.windup,a.vision=11,a.lane=t.lane??0,this.heroes.push(a),a}heroOf(t){return this.heroes[t]}get player(){return this.heroes[this.playerSlot]}addEffect(t,e,n,i=0,s=0,a={}){const o=this.time+n;for(const c of t.effects)if(c.type===e&&c.src===s&&c.tag===a.tag)return o>c.until&&(c.until=o),c.amount=Math.max(c.amount,i),a.mods&&(c.mods=a.mods),c;const l={type:e,until:o,amount:i,src:s,...a};return t.effects.push(l),l}has(t,e){const n=this.time;for(const i of t.effects)if(i.type===e&&i.until>n)return!0;return!1}effAmount(t,e){const n=this.time;let i=0;for(const s of t.effects)s.type===e&&s.until>n&&s.amount>i&&(i=s.amount);return i}getEffect(t,e,n){const i=this.time;return t.effects.find(s=>s.type===e&&s.until>i&&(n===void 0||s.tag===n))}removeEffects(t,e){t.effects=t.effects.filter(n=>!e.includes(n.type))}cleanse(t){this.removeEffects(t,["slow","root","silence","stun","disarm"]),this.emit({t:"fx",kind:"ring",x:t.x,z:t.z,r:1.6,color:16777215,dur:.5})}isStunned(t){return this.has(t,"stun")||this.has(t,"airborne")}isRooted(t){return this.isStunned(t)||this.has(t,"root")}isSilenced(t){return this.isStunned(t)||this.has(t,"silence")}isDisarmed(t){return this.isStunned(t)||this.has(t,"disarm")}canSee(t,e){return e.team===t||e.visUntil[t]>this.time||e.revealUntil[t]>this.time}recomputeStats(t,e=!1){const n=this.time;t.effects.length&&(t.effects=t.effects.filter(o=>o.until>n)),t.shield>0&&n>t.shieldUntil&&(t.shield=0);let i={},s=0,a=0;for(const o of t.effects)if(o.type==="mod"&&o.mods)for(const l in o.mods)i[l]=(i[l]??0)+o.mods[l];else o.type==="slow"?s=Math.max(s,o.amount):o.type==="haste"&&(a=Math.max(a,o.amount));if(t.hushed=this.has(t,"hush"),t.kind==="hero"){const o=t.hero,l=Ut[o.heroId],c=o.level-1,h=Xr(o),u=i,d=t.maxHp;t.maxHp=Math.round(l.hp+l.hpGrow*c+(h.hp??0)+(u.hp??0)),!e&&t.maxHp>d&&!t.dead&&(t.hp+=t.maxHp-d),t.hp>t.maxHp&&(t.hp=t.maxHp);const f=t.maxMana;t.maxMana=Math.round(l.mana+l.manaGrow*c+(h.mana??0)),!e&&t.maxMana>f&&!t.dead&&(t.mana+=t.maxMana-f),t.mana>t.maxMana&&(t.mana=t.maxMana);const g=0;t.baseAd=l.ad+l.adGrow*c,t.ad=t.baseAd+(h.ad??0)+(u.ad??0)+g,t.ap=((h.ap??0)+(u.ap??0))*(1+(h.apPct??0)),t.armor=l.armor+l.armorGrow*c+(h.armor??0)+(u.armor??0)+o.stoneStacks*2+o.armorStacks.filter(p=>p.until>n).length*4,t.ward=l.ward+l.wardGrow*c+(h.ward??0)+(u.ward??0)+o.stoneStacks*2,t.as=Math.min(2.5,l.as*(1+l.asGrow*c*1)*(1+(h.as??0)+(u.as??0))),t.haste=(h.haste??0)+(u.haste??0),t.pen=Math.min(.6,(h.pen??0)+(u.pen??0)),t.lifesteal=h.lifesteal??0,t.hpRegen=l.hpRegen+l.hpRegen*.08*c+(h.hpRegen??0)+(u.hpRegen??0),t.manaRegen=l.manaRegen+l.manaRegen*.06*c+(h.manaRegen??0)+(u.manaRegen??0),t.shieldPower=h.shieldPower??0,t.structDmg=1+(h.structDmg??0),t.monsterDmg=1+(h.monsterDmg??0),t.dmgReflect=yn(o,"thornmail")?25+t.armor*.2:0;let x=l.ms+(h.ms??0)+(u.ms??0);yn(o,"riverglass")&&dd(t.x,t.z)&&n-t.lastCombatAt>3&&(x+=.5);const m=this.teams[t.team];m.buffMoveUntil>n&&n-t.lastCombatAt>4&&(x+=.35),m.buffStructUntil>n&&(t.structDmg+=.2),t.baseMs=x,t.vision=this.has(t,"hush")?5.5:11,this.has(t,"vision")&&(t.vision+=0),a=Math.max(a,0)}else if(t.kind==="minion"||t.kind==="monster"){const o=i;t.ad=t.baseAd+(o.ad??0),t.armor=t.baseAr+(o.armor??0),t.ward=t.baseWd,t.as=Math.max(.3,(t.as||1)*1)}t.ms=t.kind==="hero"||t.kind==="minion"||t.kind==="monster"||t.kind==="decoy"?Math.max(1.4,t.baseMs*(1+a)*(1-Math.min(.65,s))):0}damage(t,e,n,i,s={}){if(e.dead||e.invuln||n<=0)return 0;const a=this.time;if(e.kind==="ward")return e.hp-=1,t?.hero&&(t.hero.wardsKilled+=e.hp<=0?1:0),e.hp<=0&&this.killUnit(e,t),1;let o=i==="physical"?e.armor:i==="arcane"?e.ward:0;const l=Math.min(.7,(t?.pen??0)+(s.pen??0));o>0&&(o*=1-l);let c=o>=0?100/(100+o):2-100/(100-o),h=n*c;const u=this.effAmount(e,"dr");if(u>0&&(h*=1-Math.min(.75,u)),e.stype?(t&&(h*=t.structDmg),this.rules.hasAlliedMinionNear(e)||(h*=.35)):e.kind==="monster"&&t&&(h*=t.monsterDmg),t&&t.kind==="hero"&&e.kind,e.kind==="hero"){const g=this.getEffect(e,"bog");g&&(g.data=(g.data??0)+h)}let d=!1;if(e.shield>0){const g=Math.min(e.shield,h);e.shield-=g,h-=g,d=g>0,d&&!s.silent&&this.emit({t:"damage",target:e.id,amount:Math.round(g),dtype:i,src:t?.id??0,shield:!0})}const f=Math.min(e.hp,h);if(e.hp-=h,e.lastDamagedAt=a,t){if(e.lastCombatAt=a,t.lastCombatAt=a,e.damagers.set(t.owner||t.id,a),t.kind==="hero"||t.owner){const g=t.kind==="hero"?t:this.byId.get(t.owner);g?.hero&&(g.hero.damageDealt+=f,e.stype&&(g.hero.damageToStructures+=f,e.lastHeroDamagedAt=a),e.kind==="hero"&&(g.hero.aggroUntil[e.team===0?0:1]=a+3,e.lastAttackerHero=g.id,e.lastHeroDamagedAt=a))}}else e.lastCombatAt=a;if(e.kind==="hero"){const g=e.hero;g.damageTaken+=f,g.lastCombatAt=a,g.recallStart>0&&(t||!0)&&this.cancelRecall(e,"damaged"),g.recap.push({t:a,src:t?.id??0,srcName:t?t.hero?.name??t.name:"Burn",amount:f,type:i,label:s.label??"Attack"}),g.recap.length>40&&g.recap.shift(),i==="physical"&&yn(g,"kilnheart")&&(g.armorStacks.push({until:a+4}),g.armorStacks.length>5&&g.armorStacks.shift())}return!s.silent&&h>0&&this.emit({t:"damage",target:e.id,amount:Math.round(h),dtype:i,src:t?.id??0}),t&&s.isAttack&&!s.noLifesteal&&t.lifesteal>0&&this.heal(t,f*t.lifesteal,!0),e.dmgReflect>0&&s.isAttack&&!s.noReflect&&t&&!t.stype&&t.range<3.5&&this.damage(e,t,e.dmgReflect,"physical",{noReflect:!0,label:"Thorns",silent:!1}),e.hp<=0&&!e.dead&&this.killUnit(e,t),f}heal(t,e,n=!1){if(t.dead||e<=0)return;const i=Math.min(t.maxHp-t.hp,e);i<=0||(t.hp+=i,!n&&i>=8&&this.emit({t:"heal",target:t.id,amount:Math.round(i)}))}grantShield(t,e,n,i,s=!0){const a=n*(1+(t?.shieldPower??0));if(e.shield+=a,e.shieldUntil=Math.max(e.shieldUntil,this.time+i),e.shieldSrc=t?.id??0,this.emit({t:"fx",kind:"shield",x:e.x,z:e.z,r:e.radius+.5,color:7336191,dur:.6}),t?.hero){if(t.hero.heroId==="oru"&&e.id!==t.id){const o=e.shield;this.after(3,()=>{!t.dead&&e.shield>0&&e.shield>=Math.min(o,a)*.5&&this.heal(t,a*.2)})}s&&yn(t.hero,"beacon")&&e.id!==t.id&&this.revealers.push({x:e.x,z:e.z,r:6,team:t.team,until:this.time+3})}}respawnTime(t){const e=t.hero.level;return re(7+e*1.6+this.time/60*.9,7,34)}giveGold(t,e,n,i){const s=t.hero;!s||e<=0||(s.gold+=e,s.totalGold+=e,this.emit({t:"gold",unit:t.id,amount:Math.round(e),x:n??t.x,z:i??t.z}))}giveXp(t,e){const n=t.hero;if(!(!n||n.level>=br||e<=0))for(n.xp+=e;n.level<br&&n.xp>=za[n.level+1];)n.level++,n.skillPts++,this.recomputeStats(t),t.hp+=t.maxHp*.08,this.emit({t:"levelup",unit:t.id,level:n.level})}xpShare(t,e,n,i,s=15){const a=this.heroes.filter(l=>!l.dead&&l.team===n&&et(l.x,l.z,t,e)<=s);if(!a.length)return;const o=i*(1+.12*(a.length-1))/a.length;for(const l of a)this.giveXp(l,o)}killUnit(t,e){if(t.dead)return;t.dead=!0,t.hp=0;const n=this.time,i=e?e.kind==="hero"?e:this.byId.get(e.owner)??null:null,s=i&&i.kind==="hero"?i:null;if(this.emit({t:"death",unit:t.id}),t.kind==="hero"){const a=t.hero;a.deaths++,a.deathStreak++,a.killStreak=0,a.respawnAt=n+this.respawnTime(t),a.deathAt=n,a.lastDeathPos={x:t.x,z:t.z},a.recallStart=0,a.rec=[null,null,null,null],t.cast=null,t.dash=null,t.atkRelease=0,t.order.t="idle";const o=[];for(const[u,d]of t.damagers){if(n-d>10)continue;const f=this.byId.get(u);f&&f.kind==="hero"&&f.team!==t.team&&f.id!==s?.id&&o.push(f.id)}let l=0;const c=s?s.team:1-t.team;if(s){const u=s.hero;u.kills++,u.killStreak++,u.deathStreak=0;const d=Math.min(250,Math.max(0,u.killStreak-1)*50);Math.min(250,a.killStreak*0+Math.max(0,t.hero.killStreak*50));const f=Math.max(0,Math.min(200,(this.heroes.filter(x=>x.team===t.team).reduce((x,m)=>x+m.hero.totalGold,0)-this.heroes.filter(x=>x.team!==t.team).reduce((x,m)=>x+m.hero.totalGold,0))*.03));l=260+t.hero.level*14+d+f;const g=o.length?.5:0;this.giveGold(s,l*(1-g),t.x,t.z);for(const x of o){const m=this.byId.get(x);m.hero.assists++,this.giveGold(m,l*g/o.length+20,t.x,t.z)}this.teams[s.team].kills++}else{this.teams[c].kills++;for(const u of o){const d=this.byId.get(u);d.hero.assists++,this.giveGold(d,90,t.x,t.z)}}this.xpShare(t.x,t.z,c,90+a.level*24,20);const h=!this.firstBlood;this.firstBlood=!0,this.emit({t:"kill",killer:s?.id??e?.id??0,victim:t.id,assists:o,gold:Math.round(l),streak:s?.hero.killStreak??0,first:h}),this.note(`${s?.hero?.name??e?.name??"The wild"}${s?` (${c===0?"Tidewatch":"Cinderguard"})`:""} defeated ${a.name} (${t.team===0?"Tidewatch":"Cinderguard"})`,c,"kill")}else if(t.kind==="minion"||t.kind==="monster"){const a=e?e.team:1-t.team,o=t.kind==="monster";if(s&&t.team!==s.team){const c=s.hero;o?c.monsterKills++:c.lastHits++;let h=t.gold;!o&&yn(c,"whetstone")&&(h+=5),!o&&yn(c,"quill")&&(s.mana=Math.min(s.maxMana,s.mana+8)),this.giveGold(s,h,t.x,t.z),o&&this.rules.onMonsterKilled(t,s)}else o&&e&&this.rules.onMonsterKilled(t,s);const l=o?a:1-t.team;(e||!o)&&this.xpShare(t.x,t.z,l,t.xp*(s?1:.8),15)}else t.stype?this.rules.onStructureDestroyed(t,e,s):t.kind==="ward"&&this.emit({t:"fx",kind:"burst",x:t.x,z:t.z,r:1,color:8384767,dur:.4});for(const a of this.projectiles)a.homing===t.id&&(a.lifeEnd=-1)}hostile(t,e){return t!==e}isEnemyTarget(t,e,n={}){return t.dead||t.team===e?!1:t.kind==="ward"?!!n.wards&&this.canSee(e,t):t.stype?!!n.structures&&!t.invuln:!(t.invuln||n.needSight!==!1&&e!==2&&!this.canSee(e,t))}unitsInCircle(t,e,n,i){const s=[];for(const a of this.units){if(a.dead)continue;const o=n+a.radius,l=a.x-t,c=a.z-e;l*l+c*c<=o*o&&i(a)&&s.push(a)}return s}unitsInCone(t,e,n,i,s,a,o){const l=[],c=Math.atan2(i,n);for(const h of this.units){if(h.dead)continue;const u=et(t,e,h.x,h.z);u>s+h.radius||u>.4&&Math.abs(Ao(c,Math.atan2(h.z-e,h.x-t)))>a+Math.asin(Math.min(1,h.radius/Math.max(u,.5)))||o(h)&&l.push(h)}return l}unitsInRect(t,e,n,i,s,a,o){const l=[],c=qe(n,i);for(const h of this.units){if(h.dead)continue;const u=h.x-t,d=h.z-e,f=u*c.x+d*c.z,g=-u*c.z+d*c.x;f<-h.radius||f>s+h.radius||Math.abs(g)>a/2+h.radius||o(h)&&l.push(h)}return l}nearestEnemyHero(t,e,n=!0){let i=null,s=e;for(const a of this.heroes){if(a.dead||a.team===t.team||a.invuln||n&&!this.canSee(t.team,a))continue;const o=et(t.x,t.z,a.x,a.z);o<s&&(s=o,i=a)}return i}spawnProjectile(t){const e=qe(t.dx,t.dz),n={id:this.nextId++,radius:.6,traveled:0,kind:"skill",homing:0,pierce:!1,hitIds:new Set,hitsAllies:!1,power:1,ult:!1,bounces:0,tag:"",dmg:0,dtype:"physical",label:"",fx:"bolt",color:16777215,size:.4,lifeEnd:1e9,onHit:null,onEnd:null,firstHeroHit:!1,data:{},stopAtWall:!0,edgeOnly:!1,...t,dx:e.x,dz:e.z};return this.projectiles.push(n),n}spawnZone(t){const e={id:this.nextId++,shape:"circle",w:0,l:0,ang:0,tickEvery:0,nextTick:0,power:1,ult:!1,tag:"",fx:"zone",color:16777215,friendly:!1,entered:new Set,onTick:null,onEnter:null,onEnd:null,hp:0,data:{},startAt:this.time,...t};return this.zones.push(e),e}addWall(t,e,n,i,s,a){const o={id:this.nextId++,x:t,z:e,r:n,hp:i,maxHp:i,until:this.time+s,team:a};return this.walls.push(o),o}inZone(t,e){if(t.shape==="circle")return et(t.x,t.z,e.x,e.z)<=t.r+e.radius*.6;const n=Math.cos(t.ang),i=Math.sin(t.ang),s=e.x-t.x,a=e.z-t.z,o=s*n+a*i,l=-s*i+a*n;return Math.abs(o)<=t.l/2+e.radius&&Math.abs(l)<=t.w/2+e.radius}stepProjectiles(){const t=this.time,e=this.projectiles;for(let n=e.length-1;n>=0;n--){const i=e[n];if(i.lifeEnd<0||t>i.lifeEnd){e.splice(n,1),i.onEnd?.(i);continue}let s=!1;if(i.homing){const c=this.byId.get(i.homing);if(!c||c.dead){e.splice(n,1);continue}const h=c.x-i.x,u=c.z-i.z,d=Math.hypot(h,u),f=i.speed*xe;if(d<=f+c.radius*.6){i.x=c.x,i.z=c.z,i.onHit?.(i,c),e.splice(n,1);continue}i.dx=h/d,i.dz=u/d,i.x+=i.dx*f,i.z+=i.dz*f;continue}const a=i.speed*xe,o=Math.max(1,Math.ceil(a/.5)),l=a/o;for(let c=0;c<o&&!s;c++){const h=i.x+i.dx*l,u=i.z+i.dz*l;if(i.stopAtWall&&(pr(h,u)||!Ss(h,u,-1.5))){if(i.bounces>0){i.bounces--;const f=!(pr(h,i.z)||!Ss(h,i.z,-1.5)),g=!(pr(i.x,u)||!Ss(i.x,u,-1.5));f&&!g?i.dz=-i.dz:g&&!f?i.dx=-i.dx:(i.dx=-i.dx,i.dz=-i.dz),i.hitIds.clear(),this.emit({t:"hit",x:i.x,z:i.z,color:i.color,kind:"spark"});continue}s=!0;break}let d=null;for(const f of this.walls)if(f.until>t&&!i.ult&&et(h,u,f.x,f.z)<f.r+i.radius*.5){d=f;break}if(d){d.hp-=Math.max(40,i.dmg*.6),this.emit({t:"hit",x:h,z:u,color:14207144,kind:"stone"}),d.hp<=0&&(d.until=0),s=!0;break}i.x=h,i.z=u,i.traveled+=l;for(const f of this.units){if(f.dead||i.hitIds.has(f.id)||f.kind==="ward")continue;const g=f.team===i.team;if(g&&!i.hitsAllies||g&&f.kind!=="hero"||!g&&(f.stype||f.invuln||(f.kind,!this.canSee(i.team,f)&&i.team!==2))||f.id===i.owner&&!i.data.self)continue;const x=i.radius+f.radius,m=f.x-i.x,p=f.z-i.z;if(!(m*m+p*p>x*x)&&(i.hitIds.add(f.id),i.onHit?.(i,f),f.kind==="hero"&&!g&&(i.firstHeroHit=!0),!i.pierce)){s=!0;break}}if(i.traveled>=i.range){s=!0;break}}s&&(e.splice(n,1),i.onEnd?.(i))}}stepZones(){const t=this.time;for(let e=this.zones.length-1;e>=0;e--){const n=this.zones[e];if(t>=n.until){this.zones.splice(e,1),n.onEnd?.(n);continue}if(n.onEnter)for(const i of this.units)i.dead||n.entered.has(i.id)||this.inZone(n,i)&&(n.entered.add(i.id),n.onEnter(n,i));n.onTick&&t>=n.nextTick&&(n.nextTick=t+(n.tickEvery||.25),n.onTick(n))}for(let e=this.walls.length-1;e>=0;e--)this.walls[e].until<=t&&this.walls.splice(e,1)}setOrder(t,e,n=0,i=0,s=0){const a=t.order;a.t=e,a.x=n,a.z=i,a.target=s,a.path=[],a.pi=0,a.rp=0}steer(t,e,n,i){const s=t.order;let a=e,o=n;const l=this.time;if(i&&!wr(t.x,t.z,e,n)){for((s.path.length===0||l>=s.rp)&&(s.path=ml(t.x,t.z,e,n),s.pi=0,s.rp=l+.6);s.pi<s.path.length-1&&et(t.x,t.z,s.path[s.pi].x,s.path[s.pi].z)<.35;)s.pi++;s.pi<s.path.length&&(a=s.path[s.pi].x,o=s.path[s.pi].z)}else i&&(s.path=[]);const c=a-t.x,h=o-t.z,u=Math.hypot(c,h);if(u<.02)return!0;const d=t.ms*xe,f=Math.min(1,d/u);this.moveBy(t,c*f,h*f);const g=Math.atan2(h,c);return t.facing=Sr(t.facing,g,.4),!1}moveBy(t,e,n){const i=t.x+e,s=t.z+n;if(Nn(i,s)||!Nn(t.x,t.z)){t.x=i,t.z=s;return}if(Nn(i,t.z)){t.x=i;return}if(Nn(t.x,s)){t.z=s;return}}clipToWalkable(t,e,n,i){if(wr(t,e,n,i))return{x:n,z:i};const s=et(t,e,n,i),a=Math.ceil(s/.4);let o=t,l=e;for(let c=1;c<=a;c++){const h=c/a,u=t+(n-t)*h,d=e+(i-e)*h;if(!Nn(u,d))break;o=u,l=d}return{x:o,z:l}}startDash(t,e,n,i,s,a={}){const o=this.clipToWalkable(t.x,t.z,e,n);t.dash={sx:t.x,sz:t.z,ex:o.x,ez:o.z,t0:this.time,dur:Math.max(.05,i),ignoreUnits:a.ignoreUnits??!0,ghost:!1,onEnd:a.onEnd,kind:s},t.atkRelease=0,t.cast=null,s!=="knock"&&(t.facing=Math.atan2(o.z-t.z,o.x-t.x))}stepDash(t){const e=t.dash,n=re((this.time-e.t0)/e.dur,0,1),i=e.kind==="leap"?n:1-(1-n)*(1-n);t.x=e.sx+(e.ex-e.sx)*i,t.z=e.sz+(e.ez-e.sz)*i,n>=1&&(t.dash=null,e.onEnd?.())}runOrder(t){if(t.dash||this.isStunned(t)||t.cast||t.atkRelease>0)return;const e=t.order,n=this.isRooted(t);switch(e.t){case"idle":case"hold":{const i=this.acquire(t,t.range+.5,!1);i&&this.tryAttack(t,i);return}case"move":{if(n)return;this.steer(t,e.x,e.z,!0)?e.t="idle":t.kind==="hero"&&(t.hero.lastMoveDist+=t.ms*xe);return}case"attack":{const i=this.byId.get(e.target);if(!i||i.dead||i.team===t.team||!(i.kind==="ward"?this.canSee(t.team,i):t.team===2||this.canSee(t.team,i))||i.invuln&&i.kind!=="ward"){e.t="idle";return}const s=et(t.x,t.z,i.x,i.z),a=t.range+i.radius+t.radius*.4;s<=a?this.tryAttack(t,i):n||(this.steer(t,i.x,i.z,t.kind==="hero"),t.kind==="hero"&&(t.hero.lastMoveDist+=t.ms*xe));return}case"amove":{const i=this.acquire(t,Math.max(t.range+1,t.kind==="hero"?7.5:8),!0);i?et(t.x,t.z,i.x,i.z)<=t.range+i.radius+t.radius*.4?this.tryAttack(t,i):n||this.steer(t,i.x,i.z,!1):n||(this.steer(t,e.x,e.z,t.kind==="hero")?e.t="idle":t.kind==="hero"&&(t.hero.lastMoveDist+=t.ms*xe));return}case"castmove":{const i=Ut[t.hero.heroId].abilities[e.slot],s=this.byId.get(e.target);if(!s||s.dead){e.t="idle";return}et(t.x,t.z,s.x,s.z)<=i.range+s.radius?(e.t="idle",this.beginCast(t,e.slot,{tx:s.x,tz:s.z,dx:s.x-t.x,dz:s.z-t.z,target:s.id},!0)):n||this.steer(t,s.x,s.z,!0);return}}}acquire(t,e,n){let i=null,s=1/0;const a=t.order.t==="idle"||t.order.t==="hold";for(const o of this.units){if(o.dead||o.team===t.team||o.kind==="ward"||o.invuln||o.kind==="monster"&&t.team!==2&&a&&o.camp?.target!==t.id||!this.canSee(t.team,o))continue;const l=et(t.x,t.z,o.x,o.z)-o.radius;if(l>e)continue;let c=l;o.kind==="hero"?c-=2.5:o.kind==="decoy"?c+=8:o.stype?c+=5:c+=o.hp/o.maxHp*1.5,c<s&&(s=c,i=o)}return i}tryAttack(t,e){if(this.isDisarmed(t))return;const n=this.time,i=e.x-t.x,s=e.z-t.z;if(t.facing=Sr(t.facing,Math.atan2(s,i),.6),n<t.atkNext||t.atkRelease>0)return;const a=Math.max(.2,t.as),o=Math.max(.08,Math.min(t.windup*(t.kind==="hero"?Ut[t.hero.heroId].as/a:1),.7/a));t.atkTarget=e.id,t.atkRelease=n+o,t.atkNext=n+1/a,t.kind==="hero"&&this.cancelRecall(t,"attack")}stepAttackRelease(t){if(t.atkRelease<=0||this.time<t.atkRelease||(t.atkRelease=0,this.isDisarmed(t)||t.dead))return;const e=this.byId.get(t.atkTarget);if(!e||e.dead){t.atkNext=this.time;return}if(et(t.x,t.z,e.x,e.z)>t.range+e.radius+t.radius*.4+1){t.atkNext=this.time+.1;return}t.kind==="hero"&&this.cancelRecall(t,"attack"),t.projSpeed>0?this.spawnProjectile({team:t.team,owner:t.id,x:t.x,z:t.z,dx:e.x-t.x,dz:e.z-t.z,speed:t.projSpeed,range:99,homing:e.id,kind:"basic",radius:.3,color:t.hero?Ut[t.hero.heroId].accent:t.team===0?9095423:16751242,size:.22,fx:"basic",onHit:(i,s)=>this.attackHit(t,s)}):this.attackHit(t,e),this.emit({t:"sfx",name:t.projSpeed>0?"shoot":"swing",x:t.x,z:t.z})}attackHit(t,e){if(t.dead&&t.kind,e.dead)return;let n=t.ad,i="physical",s=0;if(t.kind==="hero"){const a=Cd(this,t,e);n+=a.bonus,s+=a.pen,a.dtype&&(i=a.dtype),yd(this,t,e)}if(t.kind==="minion"&&e.stype&&(n*=t.mtype==="siege"?1.8:1),this.damage(t,e,n,i,{isAttack:!0,pen:s,label:"Attack"}),t.kind==="hero"){const a=this.getEffect(e,"charge");a&&a.src===t.id&&(a.until-=.5)}}beginCast(t,e,n,i=!1){const s=t.hero;if(!s||t.dead)return!1;const a=Ut[s.heroId],o=a.abilities[e],l=this.time,c=_=>(t.hero.controller==="player"&&this.emit({t:"reject",unit:t.id,reason:_}),!1);if(t.dash||t.cast)return!1;if(s.ranks[e]<=0)return c("Not learned");if(this.isSilenced(t))return c("Silenced");const h=s.rec[e],u=!!(h&&h.until>l);if(!u){if(s.cds[e]>l)return c("On cooldown");const _=o.cost[s.ranks[e]-1];if(t.mana<_)return c(a.resource==="energy"?"Not enough energy":"Not enough mana")}let d;if(o.targeting==="unit"||o.targeting==="ally"){if(d=this.byId.get(n.target),!d||d.dead||o.targeting==="unit"&&(d.team===t.team||d.invuln||d.stype||d.kind==="ward"||!this.canSee(t.team,d))||o.targeting==="ally"&&(d.team!==t.team||d.kind!=="hero"||d.id===t.id))return c("Invalid target");if(s.heroId==="vey"&&e===3&&d.kind!=="hero")return c("Needs a hero");if(et(t.x,t.z,d.x,d.z)>o.range+d.radius+.3)return i||(this.setOrder(t,"castmove",d.x,d.z,d.id),t.order.slot=e),!1}let{tx:f,tz:g}=n,x=n.dx,m=n.dz;if(o.targeting==="point"){const _=et(t.x,t.z,f,g);if(_>o.range){const y=o.range/_;f=t.x+(f-t.x)*y,g=t.z+(g-t.z)*y}x=f-t.x,m=g-t.z}if(o.targeting==="dir"||o.targeting==="self"){const _=Math.hypot(x,m);_<.05?(x=Math.cos(t.facing),m=Math.sin(t.facing)):(x/=_,m/=_),f=t.x+x*o.range,g=t.z+m*o.range}if(d&&(x=d.x-t.x,m=d.z-t.z,f=d.x,g=d.z),!u){const _=o.cost[s.ranks[e]-1];t.mana-=_;const y=o.cd[s.ranks[e]-1]*(100/(100+t.haste));o.recast?s.rec[e]={until:l+o.recast+o.castTime,fullCd:y,data:{}}:s.cds[e]=l+y,o.recast&&(s.cds[e]=l+.4)}this.cancelRecall(t,"cast"),t.atkRelease=0,t.order.path=[],t.order.t==="move"||t.order.t,t.facing=Math.atan2(m,x);const p={tx:f,tz:g,dx:x,dz:m,target:d?.id??0};return s.lastCombatAt=l,this.emit({t:"castStart",unit:t.id,ab:e,time:o.castTime,x:f,z:g}),o.castTime<=.06?this.finishCast(t,e,s.ranks[e],p,u):(t.cast={slot:e,endAt:l+o.castTime,rank:s.ranks[e],p,total:o.castTime,recast:u},o.tags.includes("reveal")&&(t.revealUntil[1-t.team]=Math.max(t.revealUntil[1-t.team],l+o.castTime+.3))),!0}finishCast(t,e,n,i,s){const a=t.hero,o=Rd[a.heroId];this.emit({t:"cast",unit:t.id,ab:e,heroId:a.heroId,x:i.tx,z:i.tz,dx:i.dx,dz:i.dz}),o(this,t,e,n,i,s)}stepCast(t){const e=t.cast;if(this.isStunned(t)||t.dead){t.cast=null;return}this.time>=e.endAt&&(t.cast=null,this.finishCast(t,e.slot,e.rank,e.p,e.recast))}startRecall(t){const e=t.hero;if(t.dead||e.recallStart>0)return;const i=this.teams[t.team].colossusUntil>this.time?hl*.65:hl;e.recallStart=Math.max(this.time,.001),e.recallDur=i,t.order.t=t.order.t==="move"?"idle":t.order.t,this.emit({t:"recall",unit:t.id,done:!1})}cancelRecall(t,e){const n=t.hero;!n||n.recallStart<=0||(n.recallStart=0,this.emit({t:"recall",unit:t.id,done:!1,cancelled:!0}))}inShop(t){const e=Ge[t.team].fountain;return et(t.x,t.z,e.x,e.z)<=Yh}useTalent(t,e,n,i){const s=t.hero,a=s.talents[e],o=Pa[a];if(!o||t.dead||s.talentCds[e]>this.time||this.isStunned(t)&&a!=="purify")return;const l=this.time;switch(a){case"skyhop":{this.has(t,"root");const c=qe(n-t.x,i-t.z);this.startDash(t,t.x+c.x*6,t.z+c.z*6,.12,"dash");break}case"mend":this.heal(t,t.maxHp*.14*(t.hp/t.maxHp<.4?2:1)),this.emit({t:"fx",kind:"heal",x:t.x,z:t.z,r:1.5,color:16767072,dur:.8});break;case"aegis":this.grantShield(t,t,t.maxHp*.12+60,3);break;case"sprint":this.addEffect(t,"haste",3,.35,t.id,{tag:"sprint"});break;case"cinder":{const c=this.nearestEnemyHero(t,6);if(!c){s.controller==="player"&&this.emit({t:"reject",unit:t.id,reason:"No target in range"});return}const h=60+10*s.level;for(let u=1;u<=6;u++)this.after(u*.5,()=>{c.dead||this.damage(t,c,h/6,"pure",{label:"Cinder Mark"})});this.emit({t:"fx",kind:"ring",x:c.x,z:c.z,r:1.4,color:16742960,dur:.6});break}case"purify":this.cleanse(t);break}s.talentCds[e]=l+o.cd,this.cancelRecall(t,"talent")}placeWard(t,e,n){const i=t.hero;if(t.dead||i.trinketCharges<=0)return i.controller==="player"&&this.emit({t:"reject",unit:t.id,reason:"No ward charges"}),!1;const s=et(t.x,t.z,e,n);if(s>9){const l=9/s;e=t.x+(e-t.x)*l,n=t.z+(n-t.z)*l}if(!Nn(e,n)){const l=Ia(e,n);e=l.x,n=l.z}const a=this.units.filter(l=>l.kind==="ward"&&l.team===t.team&&!l.dead);if(a.length>=6){const l=a.sort((c,h)=>c.expires-h.expires)[0];this.killUnit(l,null)}const o=this.blank("ward",t.team,"Ward",e,n,.4);return o.hp=3,o.maxHp=3,o.vision=8.5,o.expires=this.time+90,o.owner=t.id,o.visUntil[t.team]=1e9,i.trinketCharges--,i.wardsPlaced++,i.trinketNext<=this.time&&(i.trinketNext=this.time+45/1),this.emit({t:"ward",unit:o.id,x:e,z:n,team:t.team}),this.emit({t:"sfx",name:"ward",x:e,z:n}),!0}command(t){this.recordCommands&&this.commandLog.push({tick:this.tick,cmd:t});const e=this.heroes[t.slot];if(!e||this.winner>=0)return;const n=e.hero,i=this.time;if(!(e.dead&&!(t.c==="buy"||t.c==="sell"||t.c==="undo")))switch(t.c){case"move":{if((e.cast||e.dash||this.isStunned(e))&&(!e.cast||e.cast.total<.4)||e.cast)return;this.cancelRecall(e,"move"),e.atkRelease=0,this.setOrder(e,"move",t.x,t.z);const s=ml(e.x,e.z,t.x,t.z);e.order.path=s,e.order.rp=i+1.2;break}case"attack":{if(e.cast||e.dash)return;const s=this.byId.get(t.target);if(!s||s.dead||s.team===e.team||!this.canSee(e.team,s))return;this.cancelRecall(e,"attack"),e.atkRelease>0&&e.atkTarget!==s.id&&(e.atkRelease=0),this.setOrder(e,"attack",0,0,s.id);break}case"amove":{if(e.cast||e.dash)return;this.cancelRecall(e,"move"),e.atkRelease=0,this.setOrder(e,"amove",t.x,t.z);break}case"stop":{this.cancelRecall(e,"stop"),e.atkRelease=0,this.setOrder(e,"idle");break}case"hold":{this.cancelRecall(e,"stop"),this.setOrder(e,"hold");break}case"cast":{const s=t.x-e.x,a=t.z-e.z;this.beginCast(e,t.ab,{tx:t.x,tz:t.z,dx:s,dz:a,target:t.target});break}case"rank":{const s=t.ab;if(n.skillPts<=0||s<0||s>3)return;const a=n.ranks[s];if(s===3){if(a>=2||n.level<(a===0?6:11))return}else if(a>=4||n.level<a*2-1)return;n.ranks[s]++,n.skillPts--,n.skillLog.push(`${n.level}:${"QWER"[s]}`);break}case"talent":this.useTalent(e,t.idx,t.x,t.z);break;case"buy":this.inShop(e)?md(this,e,t.item):this.emit({t:"reject",unit:e.id,reason:"Must be at the fountain"});break;case"sell":this.inShop(e)?gd(this,e,t.idx):this.emit({t:"reject",unit:e.id,reason:"Must be at the fountain"});break;case"undo":xd(this,e);break;case"use":vd(this,e,t.idx);break;case"recall":{n.recallStart>0?this.cancelRecall(e,"toggle"):this.inShop(e)||this.startRecall(e);break}case"ward":this.placeWard(e,t.x,t.z);break}}step(){if(this.winner>=0&&this.tick>this.lastTick+60)return;this.tick++;const t=this.time;for(const e of this.units)e.px=e.x,e.pz=e.z,e.pfacing=e.facing;if(this.timers.length){const e=this.timers.filter(n=>n.at<=t);if(e.length){this.timers=this.timers.filter(n=>n.at>t);for(const n of e)n.fn()}}if(this.rules.step(),this.bots.update(),this.tick%3===0){for(const e of this.heroes)if(!e.dead&&e.hero){const n=jh+(Xr(e.hero).passiveGold??0);this.giveGoldSilent(e,n*xe*3)}}for(const e of this.units)e.dead||((e.kind==="hero"||e.kind==="minion"||e.kind==="monster"||e.kind==="decoy"||e.kind==="ward")&&(e.kind==="hero"||this.tick%3===0)&&this.recomputeStats(e),e.kind==="hero"&&this.stepHero(e),e.dash?this.stepDash(e):e.kind!=="tower"&&e.kind!=="seal"&&e.kind!=="core"&&e.kind!=="engine"&&e.kind!=="ward"&&(e.cast&&this.stepCast(e),e.dead||(this.stepAttackRelease(e),this.runOrder(e))),e.expires>0&&t>=e.expires&&!e.dead&&this.killUnit(e,null));this.separate(),this.stepProjectiles(),this.stepZones(),this.tick-this.lastVisTick>=3&&(this.updateVision(),this.lastVisTick=this.tick),this.units.some(e=>e.dead&&e.kind!=="hero")&&(this.units=this.units.filter(e=>e.dead&&e.kind!=="hero"?(this.byId.delete(e.id),!1):!0)),this.revealers.length&&(this.revealers=this.revealers.filter(e=>e.until>t)),this.events.length>4e3&&this.events.splice(0,this.events.length-2e3)}giveGoldSilent(t,e){t.hero.gold+=e,t.hero.totalGold+=e}stepHero(t){const e=t.hero,n=this.time;if(t.dead)return;t.hp=Math.min(t.maxHp,t.hp+t.hpRegen*xe),t.mana=Math.min(t.maxMana,t.mana+t.manaRegen*xe);const i=this.getEffect(t,"regen");i&&this.heal(t,i.amount*xe,!0);const s=this.getEffect(t,"manaRegen");s&&(t.mana=Math.min(t.maxMana,t.mana+s.amount*xe));const a=Ge[t.team].fountain;et(t.x,t.z,a.x,a.z)<7&&(t.hp=Math.min(t.maxHp,t.hp+t.maxHp*.1*xe),t.mana=Math.min(t.maxMana,t.mana+t.maxMana*.1*xe));const o=2+(Xr(e).wardCharges??0);if(e.trinketCharges<o&&n>=e.trinketNext&&(e.trinketCharges++,e.trinketNext=n+40),e.recallStart>0&&n-e.recallStart>=e.recallDur){e.recallStart=0;const l=Ge[t.team].spawn;t.x=l.x,t.z=l.z+(e.slot%3-1)*2,t.px=t.x,t.pz=t.z,this.setOrder(t,"idle"),this.emit({t:"recall",unit:t.id,done:!0})}_d(this,t),zd(this,t),t.brush=Hr(t.x,t.z)}heroRespawn(t){const e=t.hero,n=Ge[t.team].spawn;t.dead=!1,t.x=n.x,t.z=n.z+(e.slot%3-1)*2.4,t.px=t.x,t.pz=t.z,this.recomputeStats(t),t.hp=t.maxHp,t.mana=t.maxMana,t.shield=0,t.effects=[],this.setOrder(t,"idle"),e.recallStart=0,this.emit({t:"spawn",unit:t.id})}separate(){const t=this.sepCache;t.length=0;for(const e of this.units)!e.dead&&(e.kind==="hero"||e.kind==="minion"||e.kind==="monster"||e.kind==="decoy")&&!e.dash&&t.push(e);for(let e=0;e<t.length;e++){const n=t[e];for(let i=e+1;i<t.length;i++){const s=t[i],a=s.x-n.x;if(a>2||a<-2)continue;const o=s.z-n.z,l=n.radius+s.radius,c=a*a+o*o;if(c>=l*l)continue;const h=Math.sqrt(c)||.001,u=l-h,d=n.team===s.team,f=n.atkRelease>0||n.order.t==="hold"||n.cast?.25:1,g=s.atkRelease>0||s.order.t==="hold"||s.cast?.25:1,m=u*(d?.3:.45)/(f+g),p=a/h,_=o/h;this.moveBy(n,-p*m*f,-_*m*f),this.moveBy(s,p*m*g,_*m*g)}}for(const e of this.units)if(!(e.dead||!e.stype))for(const n of t){const i=n.x-e.x,s=n.z-e.z,a=e.radius+n.radius*.7,o=i*i+s*s;if(o>=a*a)continue;const l=Math.sqrt(o)||.001;this.moveBy(n,i/l*(a-l),s/l*(a-l))}for(const e of this.walls)if(!(e.until<=this.time))for(const n of t){const i=n.x-e.x,s=n.z-e.z,a=e.r+n.radius*.8,o=i*i+s*s;if(o>=a*a)continue;const l=Math.sqrt(o)||.001;this.moveBy(n,i/l*(a-l),s/l*(a-l))}}observers(t){const e=[],n=this.time;for(const i of this.units)if(!(i.dead||i.team!==t)){if(i.kind==="ward"){if(i.disabledUntil>n)continue;e.push({x:i.x,z:i.z,r:i.vision,ward:!0});continue}i.kind==="monster"||i.kind==="decoy"||e.push({x:i.x,z:i.z,r:i.vision,ward:!1})}for(const i of this.revealers)i.team===t&&i.until>n&&e.push({x:i.x,z:i.z,r:i.r,ward:!0});return e}updateVision(){const t=this.time;for(const e of[0,1]){const n=this.observers(e),i=n.map(s=>Hr(s.x,s.z));for(const s of this.units){if(s.dead||s.team===e)continue;if(s.revealUntil[e]>t){s.visUntil[e]=t+.1;continue}const o=s.brush=s.kind==="ward"?0:Hr(s.x,s.z);let l=!1;for(let c=0;c<n.length&&!l;c++){const h=n[c];let u=h.r;s.kind==="ward"&&(u=Math.min(u,3.4));const d=s.x-h.x,f=s.z-h.z;d*d+f*f>(u+s.radius)*(u+s.radius)||o>0&&!h.ward&&i[c]!==o&&d*d+f*f>4.6*4.6||!h.ward&&!Vc(h.x,h.z,s.x,s.z)&&d*d+f*f>9||(l=!0)}l&&(s.visUntil[e]=t+.1)}}}pointVisible(t,e,n){for(const i of this.observers(t))if(Fd(i.x,i.z,e,n)<=i.r*i.r)return!0;return!1}stateHash(){let t=2166136261;const e=n=>{t^=Math.round(n*100)|0,t=Math.imul(t,16777619)};for(const n of this.units)e(n.id),e(n.x),e(n.z),e(n.hp);for(const n of this.heroes)e(n.hero.gold),e(n.hero.level);return t>>>0}}function Fd(r,t,e,n){return(r-e)**2+(t-n)**2}function v(r,t={},...e){const n=document.createElement(r);for(const[i,s]of Object.entries(t))s==null||s===!1||(i==="class"?n.className=String(s):i==="style"&&typeof s=="object"?Object.assign(n.style,s):i==="html"?n.innerHTML=String(s):i.startsWith("on")&&typeof s=="function"?n.addEventListener(i.slice(2).toLowerCase(),s):n.setAttribute(i,String(s)));for(const i of e)i==null||i===!1||n.append(i instanceof Node?i:document.createTextNode(String(i)));return n}function $e(r){for(;r.firstChild;)r.removeChild(r.firstChild)}function Fn(r){const t=Math.max(0,Math.floor(r));return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}function mr(r){return r>=1e3?`${(r/1e3).toFixed(1)}k`:String(Math.round(r))}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Po="170",Od=0,xl=1,Bd=2,zo=1,Xc=2,Dn=3,ai=0,je=1,en=2,ni=0,qi=1,Mi=2,vl=3,_l=4,Hd=5,xi=100,Gd=101,Vd=102,Wd=103,Xd=104,$d=200,qd=201,jd=202,Yd=203,La=204,Da=205,Kd=206,Jd=207,Zd=208,Qd=209,tu=210,eu=211,nu=212,iu=213,su=214,Ua=0,Na=1,Fa=2,Ki=3,Oa=4,Ba=5,Ha=6,Ga=7,$c=0,ru=1,au=2,ii=0,ou=1,lu=2,cu=3,qc=4,hu=5,du=6,uu=7,jc=300,Ji=301,Zi=302,Va=303,Wa=304,zr=306,Xa=1e3,_i=1001,$a=1002,nn=1003,fu=1004,Fs=1005,xn=1006,qr=1007,yi=1008,Gn=1009,Yc=1010,Kc=1011,zs=1012,ko=1013,bi=1014,wn=1015,Is=1016,Io=1017,Lo=1018,Qi=1020,Jc=35902,Zc=1021,Qc=1022,vn=1023,th=1024,eh=1025,ji=1026,ts=1027,Do=1028,Uo=1029,nh=1030,No=1031,Fo=1033,gr=33776,xr=33777,vr=33778,_r=33779,qa=35840,ja=35841,Ya=35842,Ka=35843,Ja=36196,Za=37492,Qa=37496,to=37808,eo=37809,no=37810,io=37811,so=37812,ro=37813,ao=37814,oo=37815,lo=37816,co=37817,ho=37818,uo=37819,fo=37820,po=37821,yr=36492,mo=36494,go=36495,ih=36283,xo=36284,vo=36285,_o=36286,pu=3200,mu=3201,sh=0,gu=1,ei="",Oe="srgb",is="srgb-linear",kr="linear",le="srgb",Ri=7680,yl=519,xu=512,vu=513,_u=514,rh=515,yu=516,Mu=517,bu=518,Su=519,Ml=35044,Os=35048,bl="300 es",Bn=2e3,Er=2001;class ss{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const i=this._listeners[t];if(i!==void 0){const s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let s=0,a=i.length;s<a;s++)i[s].call(this,t);t.target=null}}}const Ne=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],jr=Math.PI/180,yo=180/Math.PI;function Ls(){const r=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ne[r&255]+Ne[r>>8&255]+Ne[r>>16&255]+Ne[r>>24&255]+"-"+Ne[t&255]+Ne[t>>8&255]+"-"+Ne[t>>16&15|64]+Ne[t>>24&255]+"-"+Ne[e&63|128]+Ne[e>>8&255]+"-"+Ne[e>>16&255]+Ne[e>>24&255]+Ne[n&255]+Ne[n>>8&255]+Ne[n>>16&255]+Ne[n>>24&255]).toLowerCase()}function De(r,t,e){return Math.max(t,Math.min(e,r))}function wu(r,t){return(r%t+t)%t}function Yr(r,t,e){return(1-e)*r+e*t}function hs(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return r/4294967295;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int32Array:return Math.max(r/2147483647,-1);case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function Xe(r,t){switch(t.constructor){case Float32Array:return r;case Uint32Array:return Math.round(r*4294967295);case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int32Array:return Math.round(r*2147483647);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}class gt{constructor(t=0,e=0){gt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(De(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,a=this.y-t.y;return this.x=s*n-a*i+t.x,this.y=s*i+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Ot{constructor(t,e,n,i,s,a,o,l,c){Ot.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,a,o,l,c)}set(t,e,n,i,s,a,o,l,c){const h=this.elements;return h[0]=t,h[1]=i,h[2]=o,h[3]=e,h[4]=s,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],d=n[2],f=n[5],g=n[8],x=i[0],m=i[3],p=i[6],_=i[1],y=i[4],M=i[7],z=i[2],A=i[5],T=i[8];return s[0]=a*x+o*_+l*z,s[3]=a*m+o*y+l*A,s[6]=a*p+o*M+l*T,s[1]=c*x+h*_+u*z,s[4]=c*m+h*y+u*A,s[7]=c*p+h*M+u*T,s[2]=d*x+f*_+g*z,s[5]=d*m+f*y+g*A,s[8]=d*p+f*M+g*T,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*s*h+n*o*l+i*s*c-i*a*l}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=h*a-o*c,d=o*l-h*s,f=c*s-a*l,g=e*u+n*d+i*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/g;return t[0]=u*x,t[1]=(i*c-h*n)*x,t[2]=(o*n-i*a)*x,t[3]=d*x,t[4]=(h*e-i*l)*x,t[5]=(i*s-o*e)*x,t[6]=f*x,t[7]=(n*l-c*e)*x,t[8]=(a*e-n*s)*x,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-i*c,i*l,-i*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(Kr.makeScale(t,e)),this}rotate(t){return this.premultiply(Kr.makeRotation(-t)),this}translate(t,e){return this.premultiply(Kr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const Kr=new Ot;function ah(r){for(let t=r.length-1;t>=0;--t)if(r[t]>=65535)return!0;return!1}function Tr(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}function Eu(){const r=Tr("canvas");return r.style.display="block",r}const Sl={};function Ms(r){r in Sl||(Sl[r]=!0,console.warn(r))}function Tu(r,t,e){return new Promise(function(n,i){function s(){switch(r.clientWaitSync(t,r.SYNC_FLUSH_COMMANDS_BIT,0)){case r.WAIT_FAILED:i();break;case r.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}function Au(r){const t=r.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function Ru(r){const t=r.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const Kt={enabled:!0,workingColorSpace:is,spaces:{},convert:function(r,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===le&&(r.r=Hn(r.r),r.g=Hn(r.g),r.b=Hn(r.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(r.applyMatrix3(this.spaces[t].toXYZ),r.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===le&&(r.r=Yi(r.r),r.g=Yi(r.g),r.b=Yi(r.b))),r},fromWorkingColorSpace:function(r,t){return this.convert(r,this.workingColorSpace,t)},toWorkingColorSpace:function(r,t){return this.convert(r,t,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===ei?kr:this.spaces[r].transfer},getLuminanceCoefficients:function(r,t=this.workingColorSpace){return r.fromArray(this.spaces[t].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,t,e){return r.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}};function Hn(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function Yi(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}const wl=[.64,.33,.3,.6,.15,.06],El=[.2126,.7152,.0722],Tl=[.3127,.329],Al=new Ot().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Rl=new Ot().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Kt.define({[is]:{primaries:wl,whitePoint:Tl,transfer:kr,toXYZ:Al,fromXYZ:Rl,luminanceCoefficients:El,workingColorSpaceConfig:{unpackColorSpace:Oe},outputColorSpaceConfig:{drawingBufferColorSpace:Oe}},[Oe]:{primaries:wl,whitePoint:Tl,transfer:le,toXYZ:Al,fromXYZ:Rl,luminanceCoefficients:El,outputColorSpaceConfig:{drawingBufferColorSpace:Oe}}});let Ci;class Cu{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Ci===void 0&&(Ci=Tr("canvas")),Ci.width=t.width,Ci.height=t.height;const n=Ci.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Ci}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Tr("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let a=0;a<s.length;a++)s[a]=Hn(s[a]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Hn(e[n]/255)*255):e[n]=Hn(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Pu=0;class oh{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Pu++}),this.uuid=Ls(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let a=0,o=i.length;a<o;a++)i[a].isDataTexture?s.push(Jr(i[a].image)):s.push(Jr(i[a]))}else s=Jr(i);n.url=s}return e||(t.images[this.uuid]=n),n}}function Jr(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?Cu.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let zu=0;class Be extends ss{constructor(t=Be.DEFAULT_IMAGE,e=Be.DEFAULT_MAPPING,n=_i,i=_i,s=xn,a=yi,o=vn,l=Gn,c=Be.DEFAULT_ANISOTROPY,h=ei){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:zu++}),this.uuid=Ls(),this.name="",this.source=new oh(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new gt(0,0),this.repeat=new gt(1,1),this.center=new gt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ot,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==jc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Xa:t.x=t.x-Math.floor(t.x);break;case _i:t.x=t.x<0?0:1;break;case $a:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Xa:t.y=t.y-Math.floor(t.y);break;case _i:t.y=t.y<0?0:1;break;case $a:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Be.DEFAULT_IMAGE=null;Be.DEFAULT_MAPPING=jc;Be.DEFAULT_ANISOTROPY=1;class be{constructor(t=0,e=0,n=0,i=1){be.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*i+a[12]*s,this.y=a[1]*e+a[5]*n+a[9]*i+a[13]*s,this.z=a[2]*e+a[6]*n+a[10]*i+a[14]*s,this.w=a[3]*e+a[7]*n+a[11]*i+a[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s;const l=t.elements,c=l[0],h=l[4],u=l[8],d=l[1],f=l[5],g=l[9],x=l[2],m=l[6],p=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+x)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const y=(c+1)/2,M=(f+1)/2,z=(p+1)/2,A=(h+d)/4,T=(u+x)/4,C=(g+m)/4;return y>M&&y>z?y<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(y),i=A/n,s=T/n):M>z?M<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(M),n=A/i,s=C/i):z<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(z),n=T/s,i=C/s),this.set(n,i,s,e),this}let _=Math.sqrt((m-g)*(m-g)+(u-x)*(u-x)+(d-h)*(d-h));return Math.abs(_)<.001&&(_=1),this.x=(m-g)/_,this.y=(u-x)/_,this.z=(d-h)/_,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class ku extends ss{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new be(0,0,t,e),this.scissorTest=!1,this.viewport=new be(0,0,t,e);const i={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:xn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const s=new Be(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);s.flipY=!1,s.generateMipmaps=n.generateMipmaps,s.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,s=this.textures.length;i<s;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new oh(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Si extends ku{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class lh extends Be{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=nn,this.minFilter=nn,this.wrapR=_i,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Iu extends Be{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=nn,this.minFilter=nn,this.wrapR=_i,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class oi{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,a,o){let l=n[i+0],c=n[i+1],h=n[i+2],u=n[i+3];const d=s[a+0],f=s[a+1],g=s[a+2],x=s[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(o===1){t[e+0]=d,t[e+1]=f,t[e+2]=g,t[e+3]=x;return}if(u!==x||l!==d||c!==f||h!==g){let m=1-o;const p=l*d+c*f+h*g+u*x,_=p>=0?1:-1,y=1-p*p;if(y>Number.EPSILON){const z=Math.sqrt(y),A=Math.atan2(z,p*_);m=Math.sin(m*A)/z,o=Math.sin(o*A)/z}const M=o*_;if(l=l*m+d*M,c=c*m+f*M,h=h*m+g*M,u=u*m+x*M,m===1-o){const z=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=z,c*=z,h*=z,u*=z}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,i,s,a){const o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],u=s[a],d=s[a+1],f=s[a+2],g=s[a+3];return t[e]=o*g+h*u+l*f-c*d,t[e+1]=l*g+h*d+c*u-o*f,t[e+2]=c*g+h*f+o*d-l*u,t[e+3]=h*g-o*u-l*d-c*f,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,s=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),u=o(s/2),d=l(n/2),f=l(i/2),g=l(s/2);switch(a){case"XYZ":this._x=d*h*u+c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u-d*f*g;break;case"YXZ":this._x=d*h*u+c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u+d*f*g;break;case"ZXY":this._x=d*h*u-c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u-d*f*g;break;case"ZYX":this._x=d*h*u-c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u+d*f*g;break;case"YZX":this._x=d*h*u+c*f*g,this._y=c*f*u+d*h*g,this._z=c*h*g-d*f*u,this._w=c*h*u-d*f*g;break;case"XZY":this._x=d*h*u-c*f*g,this._y=c*f*u-d*h*g,this._z=c*h*g+d*f*u,this._w=c*h*u+d*f*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],s=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],u=e[10],d=n+o+u;if(d>0){const f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-l)*f,this._y=(s-c)*f,this._z=(a-i)*f}else if(n>o&&n>u){const f=2*Math.sqrt(1+n-o-u);this._w=(h-l)/f,this._x=.25*f,this._y=(i+a)/f,this._z=(s+c)/f}else if(o>u){const f=2*Math.sqrt(1+o-n-u);this._w=(s-c)/f,this._x=(i+a)/f,this._y=.25*f,this._z=(l+h)/f}else{const f=2*Math.sqrt(1+u-n-o);this._w=(a-i)/f,this._x=(s+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(De(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,s=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+i*c-s*l,this._y=i*h+a*l+s*o-n*c,this._z=s*h+a*c+n*l-i*o,this._w=a*h-n*o-i*l-s*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,i=this._y,s=this._z,a=this._w;let o=a*t._w+n*t._x+i*t._y+s*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=i,this._z=s,this;const l=1-o*o;if(l<=Number.EPSILON){const f=1-e;return this._w=f*a+e*this._w,this._x=f*n+e*this._x,this._y=f*i+e*this._y,this._z=f*s+e*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-e)*h)/c,d=Math.sin(e*h)/c;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=i*u+this._y*d,this._z=s*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class I{constructor(t=0,e=0,n=0){I.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Cl.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Cl.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=t.elements,a=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*a,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*a,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,s=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*i-o*n),h=2*(o*e-s*i),u=2*(s*n-a*e);return this.x=e+l*c+a*u-o*h,this.y=n+l*h+o*c-s*u,this.z=i+l*u+s*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,s=t.z,a=e.x,o=e.y,l=e.z;return this.x=i*l-s*o,this.y=s*a-n*l,this.z=n*o-i*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Zr.copy(this).projectOnVector(t),this.sub(Zr)}reflect(t){return this.sub(Zr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(De(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Zr=new I,Cl=new oi;class wi{constructor(t=new I(1/0,1/0,1/0),e=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(un.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(un.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=un.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,un):un.fromBufferAttribute(s,a),un.applyMatrix4(t.matrixWorld),this.expandByPoint(un);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Bs.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Bs.copy(n.boundingBox)),Bs.applyMatrix4(t.matrixWorld),this.union(Bs)}const i=t.children;for(let s=0,a=i.length;s<a;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,un),un.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(ds),Hs.subVectors(this.max,ds),Pi.subVectors(t.a,ds),zi.subVectors(t.b,ds),ki.subVectors(t.c,ds),$n.subVectors(zi,Pi),qn.subVectors(ki,zi),hi.subVectors(Pi,ki);let e=[0,-$n.z,$n.y,0,-qn.z,qn.y,0,-hi.z,hi.y,$n.z,0,-$n.x,qn.z,0,-qn.x,hi.z,0,-hi.x,-$n.y,$n.x,0,-qn.y,qn.x,0,-hi.y,hi.x,0];return!Qr(e,Pi,zi,ki,Hs)||(e=[1,0,0,0,1,0,0,0,1],!Qr(e,Pi,zi,ki,Hs))?!1:(Gs.crossVectors($n,qn),e=[Gs.x,Gs.y,Gs.z],Qr(e,Pi,zi,ki,Hs))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,un).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(un).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Cn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Cn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Cn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Cn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Cn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Cn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Cn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Cn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Cn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Cn=[new I,new I,new I,new I,new I,new I,new I,new I],un=new I,Bs=new wi,Pi=new I,zi=new I,ki=new I,$n=new I,qn=new I,hi=new I,ds=new I,Hs=new I,Gs=new I,di=new I;function Qr(r,t,e,n,i){for(let s=0,a=r.length-3;s<=a;s+=3){di.fromArray(r,s);const o=i.x*Math.abs(di.x)+i.y*Math.abs(di.y)+i.z*Math.abs(di.z),l=t.dot(di),c=e.dot(di),h=n.dot(di);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Lu=new wi,us=new I,ta=new I;class Ei{constructor(t=new I,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Lu.setFromPoints(t).getCenter(n);let i=0;for(let s=0,a=t.length;s<a;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;us.subVectors(t,this.center);const e=us.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(us,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ta.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(us.copy(t.center).add(ta)),this.expandByPoint(us.copy(t.center).sub(ta))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Pn=new I,ea=new I,Vs=new I,jn=new I,na=new I,Ws=new I,ia=new I;class Ir{constructor(t=new I,e=new I(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Pn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Pn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Pn.copy(this.origin).addScaledVector(this.direction,e),Pn.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){ea.copy(t).add(e).multiplyScalar(.5),Vs.copy(e).sub(t).normalize(),jn.copy(this.origin).sub(ea);const s=t.distanceTo(e)*.5,a=-this.direction.dot(Vs),o=jn.dot(this.direction),l=-jn.dot(Vs),c=jn.lengthSq(),h=Math.abs(1-a*a);let u,d,f,g;if(h>0)if(u=a*l-o,d=a*o-l,g=s*h,u>=0)if(d>=-g)if(d<=g){const x=1/h;u*=x,d*=x,f=u*(u+a*d+2*o)+d*(a*u+d+2*l)+c}else d=s,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d=-s,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;else d<=-g?(u=Math.max(0,-(-a*s+o)),d=u>0?-s:Math.min(Math.max(-s,-l),s),f=-u*u+d*(d+2*l)+c):d<=g?(u=0,d=Math.min(Math.max(-s,-l),s),f=d*(d+2*l)+c):(u=Math.max(0,-(a*s+o)),d=u>0?s:Math.min(Math.max(-s,-l),s),f=-u*u+d*(d+2*l)+c);else d=a>0?-s:s,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),i&&i.copy(ea).addScaledVector(Vs,d),f}intersectSphere(t,e){Pn.subVectors(t.center,this.origin);const n=Pn.dot(this.direction),i=Pn.dot(Pn)-n*n,s=t.radius*t.radius;if(i>s)return null;const a=Math.sqrt(s-i),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(t.min.x-d.x)*c,i=(t.max.x-d.x)*c):(n=(t.max.x-d.x)*c,i=(t.min.x-d.x)*c),h>=0?(s=(t.min.y-d.y)*h,a=(t.max.y-d.y)*h):(s=(t.max.y-d.y)*h,a=(t.min.y-d.y)*h),n>a||s>i||((s>n||isNaN(n))&&(n=s),(a<i||isNaN(i))&&(i=a),u>=0?(o=(t.min.z-d.z)*u,l=(t.max.z-d.z)*u):(o=(t.max.z-d.z)*u,l=(t.min.z-d.z)*u),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,Pn)!==null}intersectTriangle(t,e,n,i,s){na.subVectors(e,t),Ws.subVectors(n,t),ia.crossVectors(na,Ws);let a=this.direction.dot(ia),o;if(a>0){if(i)return null;o=1}else if(a<0)o=-1,a=-a;else return null;jn.subVectors(this.origin,t);const l=o*this.direction.dot(Ws.crossVectors(jn,Ws));if(l<0)return null;const c=o*this.direction.dot(na.cross(jn));if(c<0||l+c>a)return null;const h=-o*jn.dot(ia);return h<0?null:this.at(h/a,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class te{constructor(t,e,n,i,s,a,o,l,c,h,u,d,f,g,x,m){te.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,a,o,l,c,h,u,d,f,g,x,m)}set(t,e,n,i,s,a,o,l,c,h,u,d,f,g,x,m){const p=this.elements;return p[0]=t,p[4]=e,p[8]=n,p[12]=i,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=d,p[3]=f,p[7]=g,p[11]=x,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new te().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,i=1/Ii.setFromMatrixColumn(t,0).length(),s=1/Ii.setFromMatrixColumn(t,1).length(),a=1/Ii.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,s=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(s),u=Math.sin(s);if(t.order==="XYZ"){const d=a*h,f=a*u,g=o*h,x=o*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=f+g*c,e[5]=d-x*c,e[9]=-o*l,e[2]=x-d*c,e[6]=g+f*c,e[10]=a*l}else if(t.order==="YXZ"){const d=l*h,f=l*u,g=c*h,x=c*u;e[0]=d+x*o,e[4]=g*o-f,e[8]=a*c,e[1]=a*u,e[5]=a*h,e[9]=-o,e[2]=f*o-g,e[6]=x+d*o,e[10]=a*l}else if(t.order==="ZXY"){const d=l*h,f=l*u,g=c*h,x=c*u;e[0]=d-x*o,e[4]=-a*u,e[8]=g+f*o,e[1]=f+g*o,e[5]=a*h,e[9]=x-d*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const d=a*h,f=a*u,g=o*h,x=o*u;e[0]=l*h,e[4]=g*c-f,e[8]=d*c+x,e[1]=l*u,e[5]=x*c+d,e[9]=f*c-g,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const d=a*l,f=a*c,g=o*l,x=o*c;e[0]=l*h,e[4]=x-d*u,e[8]=g*u+f,e[1]=u,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=f*u+g,e[10]=d-x*u}else if(t.order==="XZY"){const d=a*l,f=a*c,g=o*l,x=o*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=d*u+x,e[5]=a*h,e[9]=f*u-g,e[2]=g*u-f,e[6]=o*h,e[10]=x*u+d}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(Du,t,Uu)}lookAt(t,e,n){const i=this.elements;return Ke.subVectors(t,e),Ke.lengthSq()===0&&(Ke.z=1),Ke.normalize(),Yn.crossVectors(n,Ke),Yn.lengthSq()===0&&(Math.abs(n.z)===1?Ke.x+=1e-4:Ke.z+=1e-4,Ke.normalize(),Yn.crossVectors(n,Ke)),Yn.normalize(),Xs.crossVectors(Ke,Yn),i[0]=Yn.x,i[4]=Xs.x,i[8]=Ke.x,i[1]=Yn.y,i[5]=Xs.y,i[9]=Ke.y,i[2]=Yn.z,i[6]=Xs.z,i[10]=Ke.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],d=n[9],f=n[13],g=n[2],x=n[6],m=n[10],p=n[14],_=n[3],y=n[7],M=n[11],z=n[15],A=i[0],T=i[4],C=i[8],w=i[12],b=i[1],k=i[5],X=i[9],H=i[13],P=i[2],O=i[6],V=i[10],K=i[14],$=i[3],nt=i[7],dt=i[11],Mt=i[15];return s[0]=a*A+o*b+l*P+c*$,s[4]=a*T+o*k+l*O+c*nt,s[8]=a*C+o*X+l*V+c*dt,s[12]=a*w+o*H+l*K+c*Mt,s[1]=h*A+u*b+d*P+f*$,s[5]=h*T+u*k+d*O+f*nt,s[9]=h*C+u*X+d*V+f*dt,s[13]=h*w+u*H+d*K+f*Mt,s[2]=g*A+x*b+m*P+p*$,s[6]=g*T+x*k+m*O+p*nt,s[10]=g*C+x*X+m*V+p*dt,s[14]=g*w+x*H+m*K+p*Mt,s[3]=_*A+y*b+M*P+z*$,s[7]=_*T+y*k+M*O+z*nt,s[11]=_*C+y*X+M*V+z*dt,s[15]=_*w+y*H+M*K+z*Mt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],u=t[6],d=t[10],f=t[14],g=t[3],x=t[7],m=t[11],p=t[15];return g*(+s*l*u-i*c*u-s*o*d+n*c*d+i*o*f-n*l*f)+x*(+e*l*f-e*c*d+s*a*d-i*a*f+i*c*h-s*l*h)+m*(+e*c*u-e*o*f-s*a*u+n*a*f+s*o*h-n*c*h)+p*(-i*o*h-e*l*u+e*o*d+i*a*u-n*a*d+n*l*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=t[9],d=t[10],f=t[11],g=t[12],x=t[13],m=t[14],p=t[15],_=u*m*c-x*d*c+x*l*f-o*m*f-u*l*p+o*d*p,y=g*d*c-h*m*c-g*l*f+a*m*f+h*l*p-a*d*p,M=h*x*c-g*u*c+g*o*f-a*x*f-h*o*p+a*u*p,z=g*u*l-h*x*l-g*o*d+a*x*d+h*o*m-a*u*m,A=e*_+n*y+i*M+s*z;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const T=1/A;return t[0]=_*T,t[1]=(x*d*s-u*m*s-x*i*f+n*m*f+u*i*p-n*d*p)*T,t[2]=(o*m*s-x*l*s+x*i*c-n*m*c-o*i*p+n*l*p)*T,t[3]=(u*l*s-o*d*s-u*i*c+n*d*c+o*i*f-n*l*f)*T,t[4]=y*T,t[5]=(h*m*s-g*d*s+g*i*f-e*m*f-h*i*p+e*d*p)*T,t[6]=(g*l*s-a*m*s-g*i*c+e*m*c+a*i*p-e*l*p)*T,t[7]=(a*d*s-h*l*s+h*i*c-e*d*c-a*i*f+e*l*f)*T,t[8]=M*T,t[9]=(g*u*s-h*x*s-g*n*f+e*x*f+h*n*p-e*u*p)*T,t[10]=(a*x*s-g*o*s+g*n*c-e*x*c-a*n*p+e*o*p)*T,t[11]=(h*o*s-a*u*s-h*n*c+e*u*c+a*n*f-e*o*f)*T,t[12]=z*T,t[13]=(h*x*i-g*u*i+g*n*d-e*x*d-h*n*m+e*u*m)*T,t[14]=(g*o*i-a*x*i-g*n*l+e*x*l+a*n*m-e*o*m)*T,t[15]=(a*u*i-h*o*i+h*n*l-e*u*l-a*n*d+e*o*d)*T,this}scale(t){const e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),s=1-n,a=t.x,o=t.y,l=t.z,c=s*a,h=s*o;return this.set(c*a+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*a,0,c*l-i*o,h*l+i*a,s*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,a){return this.set(1,n,s,0,t,1,a,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,s=e._x,a=e._y,o=e._z,l=e._w,c=s+s,h=a+a,u=o+o,d=s*c,f=s*h,g=s*u,x=a*h,m=a*u,p=o*u,_=l*c,y=l*h,M=l*u,z=n.x,A=n.y,T=n.z;return i[0]=(1-(x+p))*z,i[1]=(f+M)*z,i[2]=(g-y)*z,i[3]=0,i[4]=(f-M)*A,i[5]=(1-(d+p))*A,i[6]=(m+_)*A,i[7]=0,i[8]=(g+y)*T,i[9]=(m-_)*T,i[10]=(1-(d+x))*T,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;let s=Ii.set(i[0],i[1],i[2]).length();const a=Ii.set(i[4],i[5],i[6]).length(),o=Ii.set(i[8],i[9],i[10]).length();this.determinant()<0&&(s=-s),t.x=i[12],t.y=i[13],t.z=i[14],fn.copy(this);const c=1/s,h=1/a,u=1/o;return fn.elements[0]*=c,fn.elements[1]*=c,fn.elements[2]*=c,fn.elements[4]*=h,fn.elements[5]*=h,fn.elements[6]*=h,fn.elements[8]*=u,fn.elements[9]*=u,fn.elements[10]*=u,e.setFromRotationMatrix(fn),n.x=s,n.y=a,n.z=o,this}makePerspective(t,e,n,i,s,a,o=Bn){const l=this.elements,c=2*s/(e-t),h=2*s/(n-i),u=(e+t)/(e-t),d=(n+i)/(n-i);let f,g;if(o===Bn)f=-(a+s)/(a-s),g=-2*a*s/(a-s);else if(o===Er)f=-a/(a-s),g=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=f,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,i,s,a,o=Bn){const l=this.elements,c=1/(e-t),h=1/(n-i),u=1/(a-s),d=(e+t)*c,f=(n+i)*h;let g,x;if(o===Bn)g=(a+s)*u,x=-2*u;else if(o===Er)g=s*u,x=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-f,l[2]=0,l[6]=0,l[10]=x,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Ii=new I,fn=new te,Du=new I(0,0,0),Uu=new I(1,1,1),Yn=new I,Xs=new I,Ke=new I,Pl=new te,zl=new oi;class ln{constructor(t=0,e=0,n=0,i=ln.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,s=i[0],a=i[4],o=i[8],l=i[1],c=i[5],h=i[9],u=i[2],d=i[6],f=i[10];switch(e){case"XYZ":this._y=Math.asin(De(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-De(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(De(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-De(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(De(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,f));break;case"XZY":this._z=Math.asin(-De(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Pl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Pl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return zl.setFromEuler(this),this.setFromQuaternion(zl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ln.DEFAULT_ORDER="XYZ";class Oo{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Nu=0;const kl=new I,Li=new oi,zn=new te,$s=new I,fs=new I,Fu=new I,Ou=new oi,Il=new I(1,0,0),Ll=new I(0,1,0),Dl=new I(0,0,1),Ul={type:"added"},Bu={type:"removed"},Di={type:"childadded",child:null},sa={type:"childremoved",child:null};class Ae extends ss{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Nu++}),this.uuid=Ls(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Ae.DEFAULT_UP.clone();const t=new I,e=new ln,n=new oi,i=new I(1,1,1);function s(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new te},normalMatrix:{value:new Ot}}),this.matrix=new te,this.matrixWorld=new te,this.matrixAutoUpdate=Ae.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Ae.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Oo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Li.setFromAxisAngle(t,e),this.quaternion.multiply(Li),this}rotateOnWorldAxis(t,e){return Li.setFromAxisAngle(t,e),this.quaternion.premultiply(Li),this}rotateX(t){return this.rotateOnAxis(Il,t)}rotateY(t){return this.rotateOnAxis(Ll,t)}rotateZ(t){return this.rotateOnAxis(Dl,t)}translateOnAxis(t,e){return kl.copy(t).applyQuaternion(this.quaternion),this.position.add(kl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Il,t)}translateY(t){return this.translateOnAxis(Ll,t)}translateZ(t){return this.translateOnAxis(Dl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(zn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?$s.copy(t):$s.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),fs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?zn.lookAt(fs,$s,this.up):zn.lookAt($s,fs,this.up),this.quaternion.setFromRotationMatrix(zn),i&&(zn.extractRotation(i.matrixWorld),Li.setFromRotationMatrix(zn),this.quaternion.premultiply(Li.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Ul),Di.child=t,this.dispatchEvent(Di),Di.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Bu),sa.child=t,this.dispatchEvent(sa),sa.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),zn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),zn.multiply(t.parent.matrixWorld)),t.applyMatrix4(zn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Ul),Di.child=t,this.dispatchEvent(Di),Di.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let s=0,a=i.length;s<a;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fs,t,Fu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fs,Ou,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const i=this.children;for(let s=0,a=i.length;s<a;s++)i[s].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const u=l[c];s(t.shapes,u)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(t.materials,this.material[l]));i.material=o}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];i.animations.push(s(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),u=a(t.shapes),d=a(t.skeletons),f=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),g.length>0&&(n.nodes=g)}return n.object=i,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}}Ae.DEFAULT_UP=new I(0,1,0);Ae.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ae.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const pn=new I,kn=new I,ra=new I,In=new I,Ui=new I,Ni=new I,Nl=new I,aa=new I,oa=new I,la=new I,ca=new be,ha=new be,da=new be;class gn{constructor(t=new I,e=new I,n=new I){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),pn.subVectors(t,e),i.cross(pn);const s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){pn.subVectors(i,e),kn.subVectors(n,e),ra.subVectors(t,e);const a=pn.dot(pn),o=pn.dot(kn),l=pn.dot(ra),c=kn.dot(kn),h=kn.dot(ra),u=a*c-o*o;if(u===0)return s.set(0,0,0),null;const d=1/u,f=(c*l-o*h)*d,g=(a*h-o*l)*d;return s.set(1-f-g,g,f)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,In)===null?!1:In.x>=0&&In.y>=0&&In.x+In.y<=1}static getInterpolation(t,e,n,i,s,a,o,l){return this.getBarycoord(t,e,n,i,In)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,In.x),l.addScaledVector(a,In.y),l.addScaledVector(o,In.z),l)}static getInterpolatedAttribute(t,e,n,i,s,a){return ca.setScalar(0),ha.setScalar(0),da.setScalar(0),ca.fromBufferAttribute(t,e),ha.fromBufferAttribute(t,n),da.fromBufferAttribute(t,i),a.setScalar(0),a.addScaledVector(ca,s.x),a.addScaledVector(ha,s.y),a.addScaledVector(da,s.z),a}static isFrontFacing(t,e,n,i){return pn.subVectors(n,e),kn.subVectors(t,e),pn.cross(kn).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return pn.subVectors(this.c,this.b),kn.subVectors(this.a,this.b),pn.cross(kn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return gn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return gn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return gn.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return gn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return gn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,s=this.c;let a,o;Ui.subVectors(i,n),Ni.subVectors(s,n),aa.subVectors(t,n);const l=Ui.dot(aa),c=Ni.dot(aa);if(l<=0&&c<=0)return e.copy(n);oa.subVectors(t,i);const h=Ui.dot(oa),u=Ni.dot(oa);if(h>=0&&u<=h)return e.copy(i);const d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(Ui,a);la.subVectors(t,s);const f=Ui.dot(la),g=Ni.dot(la);if(g>=0&&f<=g)return e.copy(s);const x=f*c-l*g;if(x<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(Ni,o);const m=h*g-f*u;if(m<=0&&u-h>=0&&f-g>=0)return Nl.subVectors(s,i),o=(u-h)/(u-h+(f-g)),e.copy(i).addScaledVector(Nl,o);const p=1/(m+x+d);return a=x*p,o=d*p,e.copy(n).addScaledVector(Ui,a).addScaledVector(Ni,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const ch={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Kn={h:0,s:0,l:0},qs={h:0,s:0,l:0};function ua(r,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?r+(t-r)*6*e:e<1/2?t:e<2/3?r+(t-r)*6*(2/3-e):r}class Pt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Oe){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Kt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,i=Kt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Kt.toWorkingColorSpace(this,i),this}setHSL(t,e,n,i=Kt.workingColorSpace){if(t=wu(t,1),e=De(e,0,1),n=De(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,a=2*n-s;this.r=ua(a,s,t+1/3),this.g=ua(a,s,t),this.b=ua(a,s,t-1/3)}return Kt.toWorkingColorSpace(this,i),this}setStyle(t,e=Oe){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const a=i[1],o=i[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=i[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Oe){const n=ch[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Hn(t.r),this.g=Hn(t.g),this.b=Hn(t.b),this}copyLinearToSRGB(t){return this.r=Yi(t.r),this.g=Yi(t.g),this.b=Yi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Oe){return Kt.fromWorkingColorSpace(Fe.copy(this),t),Math.round(De(Fe.r*255,0,255))*65536+Math.round(De(Fe.g*255,0,255))*256+Math.round(De(Fe.b*255,0,255))}getHexString(t=Oe){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Kt.workingColorSpace){Kt.fromWorkingColorSpace(Fe.copy(this),e);const n=Fe.r,i=Fe.g,s=Fe.b,a=Math.max(n,i,s),o=Math.min(n,i,s);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(i-s)/u+(i<s?6:0);break;case i:l=(s-n)/u+2;break;case s:l=(n-i)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Kt.workingColorSpace){return Kt.fromWorkingColorSpace(Fe.copy(this),e),t.r=Fe.r,t.g=Fe.g,t.b=Fe.b,t}getStyle(t=Oe){Kt.fromWorkingColorSpace(Fe.copy(this),t);const e=Fe.r,n=Fe.g,i=Fe.b;return t!==Oe?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(Kn),this.setHSL(Kn.h+t,Kn.s+e,Kn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Kn),t.getHSL(qs);const n=Yr(Kn.h,qs.h,e),i=Yr(Kn.s,qs.s,e),s=Yr(Kn.l,qs.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Fe=new Pt;Pt.NAMES=ch;let Hu=0;class Ti extends ss{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Hu++}),this.uuid=Ls(),this.name="",this.blending=qi,this.side=ai,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=La,this.blendDst=Da,this.blendEquation=xi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Pt(0,0,0),this.blendAlpha=0,this.depthFunc=Ki,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=yl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ri,this.stencilZFail=Ri,this.stencilZPass=Ri,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==qi&&(n.blending=this.blending),this.side!==ai&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==La&&(n.blendSrc=this.blendSrc),this.blendDst!==Da&&(n.blendDst=this.blendDst),this.blendEquation!==xi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Ki&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==yl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ri&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ri&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ri&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(e){const s=i(t.textures),a=i(t.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class me extends Ti{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new Pt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.combine=$c,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Ee=new I,js=new gt;class ze{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Ml,this.updateRanges=[],this.gpuType=wn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)js.fromBufferAttribute(this,e),js.applyMatrix3(t),this.setXY(e,js.x,js.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyMatrix3(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyMatrix4(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.applyNormalMatrix(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ee.fromBufferAttribute(this,e),Ee.transformDirection(t),this.setXYZ(e,Ee.x,Ee.y,Ee.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=hs(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Xe(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=hs(e,this.array)),e}setX(t,e){return this.normalized&&(e=Xe(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=hs(e,this.array)),e}setY(t,e){return this.normalized&&(e=Xe(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=hs(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Xe(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=hs(e,this.array)),e}setW(t,e){return this.normalized&&(e=Xe(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Xe(e,this.array),n=Xe(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=Xe(e,this.array),n=Xe(n,this.array),i=Xe(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=Xe(e,this.array),n=Xe(n,this.array),i=Xe(i,this.array),s=Xe(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Ml&&(t.usage=this.usage),t}}class hh extends ze{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class dh extends ze{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Jt extends ze{constructor(t,e,n){super(new Float32Array(t),e,n)}}let Gu=0;const on=new te,fa=new Ae,Fi=new I,Je=new wi,ps=new wi,Pe=new I;class we extends ss{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Gu++}),this.uuid=Ls(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(ah(t)?dh:hh)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Ot().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return on.makeRotationFromQuaternion(t),this.applyMatrix4(on),this}rotateX(t){return on.makeRotationX(t),this.applyMatrix4(on),this}rotateY(t){return on.makeRotationY(t),this.applyMatrix4(on),this}rotateZ(t){return on.makeRotationZ(t),this.applyMatrix4(on),this}translate(t,e,n){return on.makeTranslation(t,e,n),this.applyMatrix4(on),this}scale(t,e,n){return on.makeScale(t,e,n),this.applyMatrix4(on),this}lookAt(t){return fa.lookAt(t),fa.updateMatrix(),this.applyMatrix4(fa.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Fi).negate(),this.translate(Fi.x,Fi.y,Fi.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let i=0,s=t.length;i<s;i++){const a=t[i];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Jt(n,3))}else{for(let n=0,i=e.count;n<i;n++){const s=t[n];e.setXYZ(n,s.x,s.y,s.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new wi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const s=e[n];Je.setFromBufferAttribute(s),this.morphTargetsRelative?(Pe.addVectors(this.boundingBox.min,Je.min),this.boundingBox.expandByPoint(Pe),Pe.addVectors(this.boundingBox.max,Je.max),this.boundingBox.expandByPoint(Pe)):(this.boundingBox.expandByPoint(Je.min),this.boundingBox.expandByPoint(Je.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ei);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(t){const n=this.boundingSphere.center;if(Je.setFromBufferAttribute(t),e)for(let s=0,a=e.length;s<a;s++){const o=e[s];ps.setFromBufferAttribute(o),this.morphTargetsRelative?(Pe.addVectors(Je.min,ps.min),Je.expandByPoint(Pe),Pe.addVectors(Je.max,ps.max),Je.expandByPoint(Pe)):(Je.expandByPoint(ps.min),Je.expandByPoint(ps.max))}Je.getCenter(n);let i=0;for(let s=0,a=t.count;s<a;s++)Pe.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(Pe));if(e)for(let s=0,a=e.length;s<a;s++){const o=e[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Pe.fromBufferAttribute(o,c),l&&(Fi.fromBufferAttribute(t,c),Pe.add(Fi)),i=Math.max(i,n.distanceToSquared(Pe))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ze(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],l=[];for(let C=0;C<n.count;C++)o[C]=new I,l[C]=new I;const c=new I,h=new I,u=new I,d=new gt,f=new gt,g=new gt,x=new I,m=new I;function p(C,w,b){c.fromBufferAttribute(n,C),h.fromBufferAttribute(n,w),u.fromBufferAttribute(n,b),d.fromBufferAttribute(s,C),f.fromBufferAttribute(s,w),g.fromBufferAttribute(s,b),h.sub(c),u.sub(c),f.sub(d),g.sub(d);const k=1/(f.x*g.y-g.x*f.y);isFinite(k)&&(x.copy(h).multiplyScalar(g.y).addScaledVector(u,-f.y).multiplyScalar(k),m.copy(u).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(k),o[C].add(x),o[w].add(x),o[b].add(x),l[C].add(m),l[w].add(m),l[b].add(m))}let _=this.groups;_.length===0&&(_=[{start:0,count:t.count}]);for(let C=0,w=_.length;C<w;++C){const b=_[C],k=b.start,X=b.count;for(let H=k,P=k+X;H<P;H+=3)p(t.getX(H+0),t.getX(H+1),t.getX(H+2))}const y=new I,M=new I,z=new I,A=new I;function T(C){z.fromBufferAttribute(i,C),A.copy(z);const w=o[C];y.copy(w),y.sub(z.multiplyScalar(z.dot(w))).normalize(),M.crossVectors(A,w);const k=M.dot(l[C])<0?-1:1;a.setXYZW(C,y.x,y.y,y.z,k)}for(let C=0,w=_.length;C<w;++C){const b=_[C],k=b.start,X=b.count;for(let H=k,P=k+X;H<P;H+=3)T(t.getX(H+0)),T(t.getX(H+1)),T(t.getX(H+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new ze(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);const i=new I,s=new I,a=new I,o=new I,l=new I,c=new I,h=new I,u=new I;if(t)for(let d=0,f=t.count;d<f;d+=3){const g=t.getX(d+0),x=t.getX(d+1),m=t.getX(d+2);i.fromBufferAttribute(e,g),s.fromBufferAttribute(e,x),a.fromBufferAttribute(e,m),h.subVectors(a,s),u.subVectors(i,s),h.cross(u),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,f=e.count;d<f;d+=3)i.fromBufferAttribute(e,d+0),s.fromBufferAttribute(e,d+1),a.fromBufferAttribute(e,d+2),h.subVectors(a,s),u.subVectors(i,s),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Pe.fromBufferAttribute(t,e),Pe.normalize(),t.setXYZ(e,Pe.x,Pe.y,Pe.z)}toNonIndexed(){function t(o,l){const c=o.array,h=o.itemSize,u=o.normalized,d=new c.constructor(l.length*h);let f=0,g=0;for(let x=0,m=l.length;x<m;x++){o.isInterleavedBufferAttribute?f=l[x]*o.data.stride+o.offset:f=l[x]*h;for(let p=0;p<h;p++)d[g++]=c[f++]}return new ze(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new we,n=this.index.array,i=this.attributes;for(const o in i){const l=i[o],c=t(l,n);e.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let h=0,u=c.length;h<u;h++){const d=c[h],f=t(d,n);l.push(f)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const i={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){const f=c[u];h.push(f.toJSON(t.data))}h.length>0&&(i[l]=h,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const i=t.attributes;for(const c in i){const h=i[c];this.setAttribute(c,h.clone(e))}const s=t.morphAttributes;for(const c in s){const h=[],u=s[c];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,h=a.length;c<h;c++){const u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Fl=new te,ui=new Ir,Ys=new Ei,Ol=new I,Ks=new I,Js=new I,Zs=new I,pa=new I,Qs=new I,Bl=new I,tr=new I;class ge extends Ae{constructor(t=new we,e=new me){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=i.length;s<a;s++){const o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const o=this.morphTargetInfluences;if(s&&o){Qs.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=o[l],u=s[l];h!==0&&(pa.fromBufferAttribute(u,t),a?Qs.addScaledVector(pa,h):Qs.addScaledVector(pa.sub(e),h))}e.add(Qs)}return e}raycast(t,e){const n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ys.copy(n.boundingSphere),Ys.applyMatrix4(s),ui.copy(t.ray).recast(t.near),!(Ys.containsPoint(ui.origin)===!1&&(ui.intersectSphere(Ys,Ol)===null||ui.origin.distanceToSquared(Ol)>(t.far-t.near)**2))&&(Fl.copy(s).invert(),ui.copy(t.ray).applyMatrix4(Fl),!(n.boundingBox!==null&&ui.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,ui)))}_computeIntersections(t,e,n){let i;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,u=s.attributes.normal,d=s.groups,f=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){const m=d[g],p=a[m.materialIndex],_=Math.max(m.start,f.start),y=Math.min(o.count,Math.min(m.start+m.count,f.start+f.count));for(let M=_,z=y;M<z;M+=3){const A=o.getX(M),T=o.getX(M+1),C=o.getX(M+2);i=er(this,p,t,n,c,h,u,A,T,C),i&&(i.faceIndex=Math.floor(M/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{const g=Math.max(0,f.start),x=Math.min(o.count,f.start+f.count);for(let m=g,p=x;m<p;m+=3){const _=o.getX(m),y=o.getX(m+1),M=o.getX(m+2);i=er(this,a,t,n,c,h,u,_,y,M),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,x=d.length;g<x;g++){const m=d[g],p=a[m.materialIndex],_=Math.max(m.start,f.start),y=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let M=_,z=y;M<z;M+=3){const A=M,T=M+1,C=M+2;i=er(this,p,t,n,c,h,u,A,T,C),i&&(i.faceIndex=Math.floor(M/3),i.face.materialIndex=m.materialIndex,e.push(i))}}else{const g=Math.max(0,f.start),x=Math.min(l.count,f.start+f.count);for(let m=g,p=x;m<p;m+=3){const _=m,y=m+1,M=m+2;i=er(this,a,t,n,c,h,u,_,y,M),i&&(i.faceIndex=Math.floor(m/3),e.push(i))}}}}function Vu(r,t,e,n,i,s,a,o){let l;if(t.side===je?l=n.intersectTriangle(a,s,i,!0,o):l=n.intersectTriangle(i,s,a,t.side===ai,o),l===null)return null;tr.copy(o),tr.applyMatrix4(r.matrixWorld);const c=e.ray.origin.distanceTo(tr);return c<e.near||c>e.far?null:{distance:c,point:tr.clone(),object:r}}function er(r,t,e,n,i,s,a,o,l,c){r.getVertexPosition(o,Ks),r.getVertexPosition(l,Js),r.getVertexPosition(c,Zs);const h=Vu(r,t,e,n,Ks,Js,Zs,Bl);if(h){const u=new I;gn.getBarycoord(Bl,Ks,Js,Zs,u),i&&(h.uv=gn.getInterpolatedAttribute(i,o,l,c,u,new gt)),s&&(h.uv1=gn.getInterpolatedAttribute(s,o,l,c,u,new gt)),a&&(h.normal=gn.getInterpolatedAttribute(a,o,l,c,u,new I),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const d={a:o,b:l,c,normal:new I,materialIndex:0};gn.getNormal(Ks,Js,Zs,d.normal),h.face=d,h.barycoord=u}return h}class rs extends we{constructor(t=1,e=1,n=1,i=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:a};const o=this;i=Math.floor(i),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],h=[],u=[];let d=0,f=0;g("z","y","x",-1,-1,n,e,t,a,s,0),g("z","y","x",1,-1,n,e,-t,a,s,1),g("x","z","y",1,1,t,n,e,i,a,2),g("x","z","y",1,-1,t,n,-e,i,a,3),g("x","y","z",1,-1,t,e,n,i,s,4),g("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(l),this.setAttribute("position",new Jt(c,3)),this.setAttribute("normal",new Jt(h,3)),this.setAttribute("uv",new Jt(u,2));function g(x,m,p,_,y,M,z,A,T,C,w){const b=M/T,k=z/C,X=M/2,H=z/2,P=A/2,O=T+1,V=C+1;let K=0,$=0;const nt=new I;for(let dt=0;dt<V;dt++){const Mt=dt*k-H;for(let kt=0;kt<O;kt++){const qt=kt*b-X;nt[x]=qt*_,nt[m]=Mt*y,nt[p]=P,c.push(nt.x,nt.y,nt.z),nt[x]=0,nt[m]=0,nt[p]=A>0?1:-1,h.push(nt.x,nt.y,nt.z),u.push(kt/T),u.push(1-dt/C),K+=1}}for(let dt=0;dt<C;dt++)for(let Mt=0;Mt<T;Mt++){const kt=d+Mt+O*dt,qt=d+Mt+O*(dt+1),Y=d+(Mt+1)+O*(dt+1),it=d+(Mt+1)+O*dt;l.push(kt,qt,it),l.push(qt,Y,it),$+=6}o.addGroup(f,$,w),f+=$,d+=K}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new rs(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function es(r){const t={};for(const e in r){t[e]={};for(const n in r[e]){const i=r[e][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone():Array.isArray(i)?t[e][n]=i.slice():t[e][n]=i}}return t}function He(r){const t={};for(let e=0;e<r.length;e++){const n=es(r[e]);for(const i in n)t[i]=n[i]}return t}function Wu(r){const t=[];for(let e=0;e<r.length;e++)t.push(r[e].clone());return t}function uh(r){const t=r.getRenderTarget();return t===null?r.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Kt.workingColorSpace}const Xu={clone:es,merge:He};var $u=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,qu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Vn extends Ti{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=$u,this.fragmentShader=qu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=es(t.uniforms),this.uniformsGroups=Wu(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const a=this.uniforms[i].value;a&&a.isTexture?e.uniforms[i]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[i]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[i]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[i]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[i]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[i]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[i]={type:"m4",value:a.toArray()}:e.uniforms[i]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class fh extends Ae{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new te,this.projectionMatrix=new te,this.projectionMatrixInverse=new te,this.coordinateSystem=Bn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Jn=new I,Hl=new gt,Gl=new gt;class tn extends fh{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=yo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(jr*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return yo*2*Math.atan(Math.tan(jr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Jn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Jn.x,Jn.y).multiplyScalar(-t/Jn.z),Jn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Jn.x,Jn.y).multiplyScalar(-t/Jn.z)}getViewSize(t,e){return this.getViewBounds(t,Hl,Gl),e.subVectors(Gl,Hl)}setViewOffset(t,e,n,i,s,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(jr*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,s=-.5*i;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*i/l,e-=a.offsetY*n/c,i*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(s+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Oi=-90,Bi=1;class ju extends Ae{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new tn(Oi,Bi,t,e);i.layers=this.layers,this.add(i);const s=new tn(Oi,Bi,t,e);s.layers=this.layers,this.add(s);const a=new tn(Oi,Bi,t,e);a.layers=this.layers,this.add(a);const o=new tn(Oi,Bi,t,e);o.layers=this.layers,this.add(o);const l=new tn(Oi,Bi,t,e);l.layers=this.layers,this.add(l);const c=new tn(Oi,Bi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,s,a,o,l]=e;for(const c of e)this.remove(c);if(t===Bn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Er)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,h]=this.children,u=t.getRenderTarget(),d=t.getActiveCubeFace(),f=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,i),t.render(e,s),t.setRenderTarget(n,1,i),t.render(e,a),t.setRenderTarget(n,2,i),t.render(e,o),t.setRenderTarget(n,3,i),t.render(e,l),t.setRenderTarget(n,4,i),t.render(e,c),n.texture.generateMipmaps=x,t.setRenderTarget(n,5,i),t.render(e,h),t.setRenderTarget(u,d,f),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class ph extends Be{constructor(t,e,n,i,s,a,o,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:Ji,super(t,e,n,i,s,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Yu extends Si{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new ph(i,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:xn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new rs(5,5,5),s=new Vn({name:"CubemapFromEquirect",uniforms:es(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:je,blending:ni});s.uniforms.tEquirect.value=e;const a=new ge(i,s),o=e.minFilter;return e.minFilter===yi&&(e.minFilter=xn),new ju(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,i){const s=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,i);t.setRenderTarget(s)}}const ma=new I,Ku=new I,Ju=new Ot;class ti{constructor(t=new I(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=ma.subVectors(n,e).cross(Ku.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(ma),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/i;return s<0||s>1?null:e.copy(t.start).addScaledVector(n,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Ju.getNormalMatrix(t),i=this.coplanarPoint(ma).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const fi=new Ei,nr=new I;class Bo{constructor(t=new ti,e=new ti,n=new ti,i=new ti,s=new ti,a=new ti){this.planes=[t,e,n,i,s,a]}set(t,e,n,i,s,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(i),o[4].copy(s),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Bn){const n=this.planes,i=t.elements,s=i[0],a=i[1],o=i[2],l=i[3],c=i[4],h=i[5],u=i[6],d=i[7],f=i[8],g=i[9],x=i[10],m=i[11],p=i[12],_=i[13],y=i[14],M=i[15];if(n[0].setComponents(l-s,d-c,m-f,M-p).normalize(),n[1].setComponents(l+s,d+c,m+f,M+p).normalize(),n[2].setComponents(l+a,d+h,m+g,M+_).normalize(),n[3].setComponents(l-a,d-h,m-g,M-_).normalize(),n[4].setComponents(l-o,d-u,m-x,M-y).normalize(),e===Bn)n[5].setComponents(l+o,d+u,m+x,M+y).normalize();else if(e===Er)n[5].setComponents(o,u,x,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),fi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),fi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(fi)}intersectsSprite(t){return fi.center.set(0,0,0),fi.radius=.7071067811865476,fi.applyMatrix4(t.matrixWorld),this.intersectsSphere(fi)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(nr.x=i.normal.x>0?t.max.x:t.min.x,nr.y=i.normal.y>0?t.max.y:t.min.y,nr.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(nr)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function mh(){let r=null,t=!1,e=null,n=null;function i(s,a){e(s,a),n=r.requestAnimationFrame(i)}return{start:function(){t!==!0&&e!==null&&(n=r.requestAnimationFrame(i),t=!0)},stop:function(){r.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){r=s}}}function Zu(r){const t=new WeakMap;function e(o,l){const c=o.array,h=o.usage,u=c.byteLength,d=r.createBuffer();r.bindBuffer(l,d),r.bufferData(l,c,h),o.onUploadCallback();let f;if(c instanceof Float32Array)f=r.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?f=r.HALF_FLOAT:f=r.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=r.SHORT;else if(c instanceof Uint32Array)f=r.UNSIGNED_INT;else if(c instanceof Int32Array)f=r.INT;else if(c instanceof Int8Array)f=r.BYTE;else if(c instanceof Uint8Array)f=r.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=r.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function n(o,l,c){const h=l.array,u=l.updateRanges;if(r.bindBuffer(c,o),u.length===0)r.bufferSubData(c,0,h);else{u.sort((f,g)=>f.start-g.start);let d=0;for(let f=1;f<u.length;f++){const g=u[d],x=u[f];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++d,u[d]=x)}u.length=d+1;for(let f=0,g=u.length;f<g;f++){const x=u[f];r.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(r.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:s,update:a}}class En extends we{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const s=t/2,a=e/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,u=t/o,d=e/l,f=[],g=[],x=[],m=[];for(let p=0;p<h;p++){const _=p*d-a;for(let y=0;y<c;y++){const M=y*u-s;g.push(M,-_,0),x.push(0,0,1),m.push(y/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let _=0;_<o;_++){const y=_+c*p,M=_+c*(p+1),z=_+1+c*(p+1),A=_+1+c*p;f.push(y,M,A),f.push(M,z,A)}this.setIndex(f),this.setAttribute("position",new Jt(g,3)),this.setAttribute("normal",new Jt(x,3)),this.setAttribute("uv",new Jt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new En(t.width,t.height,t.widthSegments,t.heightSegments)}}var Qu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,tf=`#ifdef USE_ALPHAHASH
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
#endif`,ef=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,nf=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,sf=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,rf=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,af=`#ifdef USE_AOMAP
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
#endif`,of=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,lf=`#ifdef USE_BATCHING
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
#endif`,cf=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,hf=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,df=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,uf=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,ff=`#ifdef USE_IRIDESCENCE
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
#endif`,pf=`#ifdef USE_BUMPMAP
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
#endif`,mf=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,gf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,xf=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,vf=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,_f=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,yf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Mf=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,bf=`#if defined( USE_COLOR_ALPHA )
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
#endif`,Sf=`#define PI 3.141592653589793
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
} // validated`,wf=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Ef=`vec3 transformedNormal = objectNormal;
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
#endif`,Tf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Af=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Rf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Cf=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Pf="gl_FragColor = linearToOutputTexel( gl_FragColor );",zf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,kf=`#ifdef USE_ENVMAP
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
#endif`,If=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Lf=`#ifdef USE_ENVMAP
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
#endif`,Df=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Uf=`#ifdef USE_ENVMAP
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
#endif`,Nf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ff=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Of=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Bf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Hf=`#ifdef USE_GRADIENTMAP
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
}`,Gf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Vf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Wf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Xf=`uniform bool receiveShadow;
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
#endif`,$f=`#ifdef USE_ENVMAP
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
#endif`,qf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,jf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Yf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Kf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Jf=`PhysicalMaterial material;
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
#endif`,Zf=`struct PhysicalMaterial {
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
}`,Qf=`
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
#endif`,tp=`#if defined( RE_IndirectDiffuse )
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
#endif`,ep=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,np=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ip=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,sp=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,rp=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,ap=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,op=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,lp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,cp=`#if defined( USE_POINTS_UV )
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
#endif`,hp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,dp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,up=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,fp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,pp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,mp=`#ifdef USE_MORPHTARGETS
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
#endif`,gp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,vp=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,_p=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,yp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Mp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,bp=`#ifdef USE_NORMALMAP
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
#endif`,Sp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,wp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Ep=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Tp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Ap=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Rp=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Cp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Pp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,zp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,kp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ip=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Lp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Dp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Up=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Np=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Fp=`float getShadowMask() {
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
}`,Op=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Bp=`#ifdef USE_SKINNING
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
#endif`,Hp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Gp=`#ifdef USE_SKINNING
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
#endif`,Vp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Wp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Xp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,$p=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,qp=`#ifdef USE_TRANSMISSION
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
#endif`,jp=`#ifdef USE_TRANSMISSION
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
#endif`,Yp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Kp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Jp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Zp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Qp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,tm=`uniform sampler2D t2D;
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
}`,em=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,nm=`#ifdef ENVMAP_TYPE_CUBE
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
}`,im=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,sm=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,rm=`#include <common>
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
}`,am=`#if DEPTH_PACKING == 3200
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
}`,om=`#define DISTANCE
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
}`,lm=`#define DISTANCE
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
}`,cm=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,hm=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,dm=`uniform float scale;
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
}`,um=`uniform vec3 diffuse;
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
}`,fm=`#include <common>
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
}`,pm=`uniform vec3 diffuse;
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
}`,mm=`#define LAMBERT
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
}`,gm=`#define LAMBERT
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
}`,xm=`#define MATCAP
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
}`,vm=`#define MATCAP
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
}`,_m=`#define NORMAL
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
}`,ym=`#define NORMAL
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
}`,Mm=`#define PHONG
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
}`,bm=`#define PHONG
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
}`,Sm=`#define STANDARD
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
}`,wm=`#define STANDARD
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
}`,Em=`#define TOON
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
}`,Tm=`#define TOON
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
}`,Am=`uniform float size;
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
}`,Rm=`uniform vec3 diffuse;
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
}`,Cm=`#include <common>
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
}`,Pm=`uniform vec3 color;
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
}`,zm=`uniform float rotation;
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
}`,km=`uniform vec3 diffuse;
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
}`,Ht={alphahash_fragment:Qu,alphahash_pars_fragment:tf,alphamap_fragment:ef,alphamap_pars_fragment:nf,alphatest_fragment:sf,alphatest_pars_fragment:rf,aomap_fragment:af,aomap_pars_fragment:of,batching_pars_vertex:lf,batching_vertex:cf,begin_vertex:hf,beginnormal_vertex:df,bsdfs:uf,iridescence_fragment:ff,bumpmap_pars_fragment:pf,clipping_planes_fragment:mf,clipping_planes_pars_fragment:gf,clipping_planes_pars_vertex:xf,clipping_planes_vertex:vf,color_fragment:_f,color_pars_fragment:yf,color_pars_vertex:Mf,color_vertex:bf,common:Sf,cube_uv_reflection_fragment:wf,defaultnormal_vertex:Ef,displacementmap_pars_vertex:Tf,displacementmap_vertex:Af,emissivemap_fragment:Rf,emissivemap_pars_fragment:Cf,colorspace_fragment:Pf,colorspace_pars_fragment:zf,envmap_fragment:kf,envmap_common_pars_fragment:If,envmap_pars_fragment:Lf,envmap_pars_vertex:Df,envmap_physical_pars_fragment:$f,envmap_vertex:Uf,fog_vertex:Nf,fog_pars_vertex:Ff,fog_fragment:Of,fog_pars_fragment:Bf,gradientmap_pars_fragment:Hf,lightmap_pars_fragment:Gf,lights_lambert_fragment:Vf,lights_lambert_pars_fragment:Wf,lights_pars_begin:Xf,lights_toon_fragment:qf,lights_toon_pars_fragment:jf,lights_phong_fragment:Yf,lights_phong_pars_fragment:Kf,lights_physical_fragment:Jf,lights_physical_pars_fragment:Zf,lights_fragment_begin:Qf,lights_fragment_maps:tp,lights_fragment_end:ep,logdepthbuf_fragment:np,logdepthbuf_pars_fragment:ip,logdepthbuf_pars_vertex:sp,logdepthbuf_vertex:rp,map_fragment:ap,map_pars_fragment:op,map_particle_fragment:lp,map_particle_pars_fragment:cp,metalnessmap_fragment:hp,metalnessmap_pars_fragment:dp,morphinstance_vertex:up,morphcolor_vertex:fp,morphnormal_vertex:pp,morphtarget_pars_vertex:mp,morphtarget_vertex:gp,normal_fragment_begin:xp,normal_fragment_maps:vp,normal_pars_fragment:_p,normal_pars_vertex:yp,normal_vertex:Mp,normalmap_pars_fragment:bp,clearcoat_normal_fragment_begin:Sp,clearcoat_normal_fragment_maps:wp,clearcoat_pars_fragment:Ep,iridescence_pars_fragment:Tp,opaque_fragment:Ap,packing:Rp,premultiplied_alpha_fragment:Cp,project_vertex:Pp,dithering_fragment:zp,dithering_pars_fragment:kp,roughnessmap_fragment:Ip,roughnessmap_pars_fragment:Lp,shadowmap_pars_fragment:Dp,shadowmap_pars_vertex:Up,shadowmap_vertex:Np,shadowmask_pars_fragment:Fp,skinbase_vertex:Op,skinning_pars_vertex:Bp,skinning_vertex:Hp,skinnormal_vertex:Gp,specularmap_fragment:Vp,specularmap_pars_fragment:Wp,tonemapping_fragment:Xp,tonemapping_pars_fragment:$p,transmission_fragment:qp,transmission_pars_fragment:jp,uv_pars_fragment:Yp,uv_pars_vertex:Kp,uv_vertex:Jp,worldpos_vertex:Zp,background_vert:Qp,background_frag:tm,backgroundCube_vert:em,backgroundCube_frag:nm,cube_vert:im,cube_frag:sm,depth_vert:rm,depth_frag:am,distanceRGBA_vert:om,distanceRGBA_frag:lm,equirect_vert:cm,equirect_frag:hm,linedashed_vert:dm,linedashed_frag:um,meshbasic_vert:fm,meshbasic_frag:pm,meshlambert_vert:mm,meshlambert_frag:gm,meshmatcap_vert:xm,meshmatcap_frag:vm,meshnormal_vert:_m,meshnormal_frag:ym,meshphong_vert:Mm,meshphong_frag:bm,meshphysical_vert:Sm,meshphysical_frag:wm,meshtoon_vert:Em,meshtoon_frag:Tm,points_vert:Am,points_frag:Rm,shadow_vert:Cm,shadow_frag:Pm,sprite_vert:zm,sprite_frag:km},lt={common:{diffuse:{value:new Pt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ot},alphaMap:{value:null},alphaMapTransform:{value:new Ot},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ot}},envmap:{envMap:{value:null},envMapRotation:{value:new Ot},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ot}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ot}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ot},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ot},normalScale:{value:new gt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ot},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ot}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ot}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ot}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Pt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Pt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ot},alphaTest:{value:0},uvTransform:{value:new Ot}},sprite:{diffuse:{value:new Pt(16777215)},opacity:{value:1},center:{value:new gt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ot},alphaMap:{value:null},alphaMapTransform:{value:new Ot},alphaTest:{value:0}}},Mn={basic:{uniforms:He([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.fog]),vertexShader:Ht.meshbasic_vert,fragmentShader:Ht.meshbasic_frag},lambert:{uniforms:He([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new Pt(0)}}]),vertexShader:Ht.meshlambert_vert,fragmentShader:Ht.meshlambert_frag},phong:{uniforms:He([lt.common,lt.specularmap,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,lt.lights,{emissive:{value:new Pt(0)},specular:{value:new Pt(1118481)},shininess:{value:30}}]),vertexShader:Ht.meshphong_vert,fragmentShader:Ht.meshphong_frag},standard:{uniforms:He([lt.common,lt.envmap,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.roughnessmap,lt.metalnessmap,lt.fog,lt.lights,{emissive:{value:new Pt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ht.meshphysical_vert,fragmentShader:Ht.meshphysical_frag},toon:{uniforms:He([lt.common,lt.aomap,lt.lightmap,lt.emissivemap,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.gradientmap,lt.fog,lt.lights,{emissive:{value:new Pt(0)}}]),vertexShader:Ht.meshtoon_vert,fragmentShader:Ht.meshtoon_frag},matcap:{uniforms:He([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,lt.fog,{matcap:{value:null}}]),vertexShader:Ht.meshmatcap_vert,fragmentShader:Ht.meshmatcap_frag},points:{uniforms:He([lt.points,lt.fog]),vertexShader:Ht.points_vert,fragmentShader:Ht.points_frag},dashed:{uniforms:He([lt.common,lt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ht.linedashed_vert,fragmentShader:Ht.linedashed_frag},depth:{uniforms:He([lt.common,lt.displacementmap]),vertexShader:Ht.depth_vert,fragmentShader:Ht.depth_frag},normal:{uniforms:He([lt.common,lt.bumpmap,lt.normalmap,lt.displacementmap,{opacity:{value:1}}]),vertexShader:Ht.meshnormal_vert,fragmentShader:Ht.meshnormal_frag},sprite:{uniforms:He([lt.sprite,lt.fog]),vertexShader:Ht.sprite_vert,fragmentShader:Ht.sprite_frag},background:{uniforms:{uvTransform:{value:new Ot},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ht.background_vert,fragmentShader:Ht.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ot}},vertexShader:Ht.backgroundCube_vert,fragmentShader:Ht.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ht.cube_vert,fragmentShader:Ht.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ht.equirect_vert,fragmentShader:Ht.equirect_frag},distanceRGBA:{uniforms:He([lt.common,lt.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ht.distanceRGBA_vert,fragmentShader:Ht.distanceRGBA_frag},shadow:{uniforms:He([lt.lights,lt.fog,{color:{value:new Pt(0)},opacity:{value:1}}]),vertexShader:Ht.shadow_vert,fragmentShader:Ht.shadow_frag}};Mn.physical={uniforms:He([Mn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ot},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ot},clearcoatNormalScale:{value:new gt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ot},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ot},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ot},sheen:{value:0},sheenColor:{value:new Pt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ot},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ot},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ot},transmissionSamplerSize:{value:new gt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ot},attenuationDistance:{value:0},attenuationColor:{value:new Pt(0)},specularColor:{value:new Pt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ot},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ot},anisotropyVector:{value:new gt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ot}}]),vertexShader:Ht.meshphysical_vert,fragmentShader:Ht.meshphysical_frag};const ir={r:0,b:0,g:0},pi=new ln,Im=new te;function Lm(r,t,e,n,i,s,a){const o=new Pt(0);let l=s===!0?0:1,c,h,u=null,d=0,f=null;function g(_){let y=_.isScene===!0?_.background:null;return y&&y.isTexture&&(y=(_.backgroundBlurriness>0?e:t).get(y)),y}function x(_){let y=!1;const M=g(_);M===null?p(o,l):M&&M.isColor&&(p(M,1),y=!0);const z=r.xr.getEnvironmentBlendMode();z==="additive"?n.buffers.color.setClear(0,0,0,1,a):z==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(r.autoClear||y)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil))}function m(_,y){const M=g(y);M&&(M.isCubeTexture||M.mapping===zr)?(h===void 0&&(h=new ge(new rs(1,1,1),new Vn({name:"BackgroundCubeMaterial",uniforms:es(Mn.backgroundCube.uniforms),vertexShader:Mn.backgroundCube.vertexShader,fragmentShader:Mn.backgroundCube.fragmentShader,side:je,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(z,A,T){this.matrixWorld.copyPosition(T.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),pi.copy(y.backgroundRotation),pi.x*=-1,pi.y*=-1,pi.z*=-1,M.isCubeTexture&&M.isRenderTargetTexture===!1&&(pi.y*=-1,pi.z*=-1),h.material.uniforms.envMap.value=M,h.material.uniforms.flipEnvMap.value=M.isCubeTexture&&M.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=y.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(Im.makeRotationFromEuler(pi)),h.material.toneMapped=Kt.getTransfer(M.colorSpace)!==le,(u!==M||d!==M.version||f!==r.toneMapping)&&(h.material.needsUpdate=!0,u=M,d=M.version,f=r.toneMapping),h.layers.enableAll(),_.unshift(h,h.geometry,h.material,0,0,null)):M&&M.isTexture&&(c===void 0&&(c=new ge(new En(2,2),new Vn({name:"BackgroundMaterial",uniforms:es(Mn.background.uniforms),vertexShader:Mn.background.vertexShader,fragmentShader:Mn.background.fragmentShader,side:ai,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=M,c.material.uniforms.backgroundIntensity.value=y.backgroundIntensity,c.material.toneMapped=Kt.getTransfer(M.colorSpace)!==le,M.matrixAutoUpdate===!0&&M.updateMatrix(),c.material.uniforms.uvTransform.value.copy(M.matrix),(u!==M||d!==M.version||f!==r.toneMapping)&&(c.material.needsUpdate=!0,u=M,d=M.version,f=r.toneMapping),c.layers.enableAll(),_.unshift(c,c.geometry,c.material,0,0,null))}function p(_,y){_.getRGB(ir,uh(r)),n.buffers.color.setClear(ir.r,ir.g,ir.b,y,a)}return{getClearColor:function(){return o},setClearColor:function(_,y=1){o.set(_),l=y,p(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(_){l=_,p(o,l)},render:x,addToRenderList:m}}function Dm(r,t){const e=r.getParameter(r.MAX_VERTEX_ATTRIBS),n={},i=d(null);let s=i,a=!1;function o(b,k,X,H,P){let O=!1;const V=u(H,X,k);s!==V&&(s=V,c(s.object)),O=f(b,H,X,P),O&&g(b,H,X,P),P!==null&&t.update(P,r.ELEMENT_ARRAY_BUFFER),(O||a)&&(a=!1,M(b,k,X,H),P!==null&&r.bindBuffer(r.ELEMENT_ARRAY_BUFFER,t.get(P).buffer))}function l(){return r.createVertexArray()}function c(b){return r.bindVertexArray(b)}function h(b){return r.deleteVertexArray(b)}function u(b,k,X){const H=X.wireframe===!0;let P=n[b.id];P===void 0&&(P={},n[b.id]=P);let O=P[k.id];O===void 0&&(O={},P[k.id]=O);let V=O[H];return V===void 0&&(V=d(l()),O[H]=V),V}function d(b){const k=[],X=[],H=[];for(let P=0;P<e;P++)k[P]=0,X[P]=0,H[P]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:k,enabledAttributes:X,attributeDivisors:H,object:b,attributes:{},index:null}}function f(b,k,X,H){const P=s.attributes,O=k.attributes;let V=0;const K=X.getAttributes();for(const $ in K)if(K[$].location>=0){const dt=P[$];let Mt=O[$];if(Mt===void 0&&($==="instanceMatrix"&&b.instanceMatrix&&(Mt=b.instanceMatrix),$==="instanceColor"&&b.instanceColor&&(Mt=b.instanceColor)),dt===void 0||dt.attribute!==Mt||Mt&&dt.data!==Mt.data)return!0;V++}return s.attributesNum!==V||s.index!==H}function g(b,k,X,H){const P={},O=k.attributes;let V=0;const K=X.getAttributes();for(const $ in K)if(K[$].location>=0){let dt=O[$];dt===void 0&&($==="instanceMatrix"&&b.instanceMatrix&&(dt=b.instanceMatrix),$==="instanceColor"&&b.instanceColor&&(dt=b.instanceColor));const Mt={};Mt.attribute=dt,dt&&dt.data&&(Mt.data=dt.data),P[$]=Mt,V++}s.attributes=P,s.attributesNum=V,s.index=H}function x(){const b=s.newAttributes;for(let k=0,X=b.length;k<X;k++)b[k]=0}function m(b){p(b,0)}function p(b,k){const X=s.newAttributes,H=s.enabledAttributes,P=s.attributeDivisors;X[b]=1,H[b]===0&&(r.enableVertexAttribArray(b),H[b]=1),P[b]!==k&&(r.vertexAttribDivisor(b,k),P[b]=k)}function _(){const b=s.newAttributes,k=s.enabledAttributes;for(let X=0,H=k.length;X<H;X++)k[X]!==b[X]&&(r.disableVertexAttribArray(X),k[X]=0)}function y(b,k,X,H,P,O,V){V===!0?r.vertexAttribIPointer(b,k,X,P,O):r.vertexAttribPointer(b,k,X,H,P,O)}function M(b,k,X,H){x();const P=H.attributes,O=X.getAttributes(),V=k.defaultAttributeValues;for(const K in O){const $=O[K];if($.location>=0){let nt=P[K];if(nt===void 0&&(K==="instanceMatrix"&&b.instanceMatrix&&(nt=b.instanceMatrix),K==="instanceColor"&&b.instanceColor&&(nt=b.instanceColor)),nt!==void 0){const dt=nt.normalized,Mt=nt.itemSize,kt=t.get(nt);if(kt===void 0)continue;const qt=kt.buffer,Y=kt.type,it=kt.bytesPerElement,yt=Y===r.INT||Y===r.UNSIGNED_INT||nt.gpuType===ko;if(nt.isInterleavedBufferAttribute){const at=nt.data,Rt=at.stride,It=nt.offset;if(at.isInstancedInterleavedBuffer){for(let Gt=0;Gt<$.locationSize;Gt++)p($.location+Gt,at.meshPerAttribute);b.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=at.meshPerAttribute*at.count)}else for(let Gt=0;Gt<$.locationSize;Gt++)m($.location+Gt);r.bindBuffer(r.ARRAY_BUFFER,qt);for(let Gt=0;Gt<$.locationSize;Gt++)y($.location+Gt,Mt/$.locationSize,Y,dt,Rt*it,(It+Mt/$.locationSize*Gt)*it,yt)}else{if(nt.isInstancedBufferAttribute){for(let at=0;at<$.locationSize;at++)p($.location+at,nt.meshPerAttribute);b.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=nt.meshPerAttribute*nt.count)}else for(let at=0;at<$.locationSize;at++)m($.location+at);r.bindBuffer(r.ARRAY_BUFFER,qt);for(let at=0;at<$.locationSize;at++)y($.location+at,Mt/$.locationSize,Y,dt,Mt*it,Mt/$.locationSize*at*it,yt)}}else if(V!==void 0){const dt=V[K];if(dt!==void 0)switch(dt.length){case 2:r.vertexAttrib2fv($.location,dt);break;case 3:r.vertexAttrib3fv($.location,dt);break;case 4:r.vertexAttrib4fv($.location,dt);break;default:r.vertexAttrib1fv($.location,dt)}}}}_()}function z(){C();for(const b in n){const k=n[b];for(const X in k){const H=k[X];for(const P in H)h(H[P].object),delete H[P];delete k[X]}delete n[b]}}function A(b){if(n[b.id]===void 0)return;const k=n[b.id];for(const X in k){const H=k[X];for(const P in H)h(H[P].object),delete H[P];delete k[X]}delete n[b.id]}function T(b){for(const k in n){const X=n[k];if(X[b.id]===void 0)continue;const H=X[b.id];for(const P in H)h(H[P].object),delete H[P];delete X[b.id]}}function C(){w(),a=!0,s!==i&&(s=i,c(s.object))}function w(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:C,resetDefaultState:w,dispose:z,releaseStatesOfGeometry:A,releaseStatesOfProgram:T,initAttributes:x,enableAttribute:m,disableUnusedAttributes:_}}function Um(r,t,e){let n;function i(c){n=c}function s(c,h){r.drawArrays(n,c,h),e.update(h,n,1)}function a(c,h,u){u!==0&&(r.drawArraysInstanced(n,c,h,u),e.update(h,n,u))}function o(c,h,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,u);let f=0;for(let g=0;g<u;g++)f+=h[g];e.update(f,n,1)}function l(c,h,u,d){if(u===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let g=0;g<c.length;g++)a(c[g],h[g],d[g]);else{f.multiDrawArraysInstancedWEBGL(n,c,0,h,0,d,0,u);let g=0;for(let x=0;x<u;x++)g+=h[x]*d[x];e.update(g,n,1)}}this.setMode=i,this.render=s,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function Nm(r,t,e,n){let i;function s(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const T=t.get("EXT_texture_filter_anisotropic");i=r.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function a(T){return!(T!==vn&&n.convert(T)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(T){const C=T===Is&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(T!==Gn&&n.convert(T)!==r.getParameter(r.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==wn&&!C)}function l(T){if(T==="highp"){if(r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.HIGH_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&r.getShaderPrecisionFormat(r.VERTEX_SHADER,r.MEDIUM_FLOAT).precision>0&&r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const u=e.logarithmicDepthBuffer===!0,d=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),f=r.getParameter(r.MAX_TEXTURE_IMAGE_UNITS),g=r.getParameter(r.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=r.getParameter(r.MAX_TEXTURE_SIZE),m=r.getParameter(r.MAX_CUBE_MAP_TEXTURE_SIZE),p=r.getParameter(r.MAX_VERTEX_ATTRIBS),_=r.getParameter(r.MAX_VERTEX_UNIFORM_VECTORS),y=r.getParameter(r.MAX_VARYING_VECTORS),M=r.getParameter(r.MAX_FRAGMENT_UNIFORM_VECTORS),z=g>0,A=r.getParameter(r.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:_,maxVaryings:y,maxFragmentUniforms:M,vertexTextures:z,maxSamples:A}}function Fm(r){const t=this;let e=null,n=0,i=!1,s=!1;const a=new ti,o=new Ot,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){const f=u.length!==0||d||n!==0||i;return i=d,n=u.length,f},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,d){e=h(u,d,0)},this.setState=function(u,d,f){const g=u.clippingPlanes,x=u.clipIntersection,m=u.clipShadows,p=r.get(u);if(!i||g===null||g.length===0||s&&!m)s?h(null):c();else{const _=s?0:n,y=_*4;let M=p.clippingState||null;l.value=M,M=h(g,d,y,f);for(let z=0;z!==y;++z)M[z]=e[z];p.clippingState=M,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=_}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,d,f,g){const x=u!==null?u.length:0;let m=null;if(x!==0){if(m=l.value,g!==!0||m===null){const p=f+x*4,_=d.matrixWorldInverse;o.getNormalMatrix(_),(m===null||m.length<p)&&(m=new Float32Array(p));for(let y=0,M=f;y!==x;++y,M+=4)a.copy(u[y]).applyMatrix4(_,o),a.normal.toArray(m,M),m[M+3]=a.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=x,t.numIntersection=0,m}}function Om(r){let t=new WeakMap;function e(a,o){return o===Va?a.mapping=Ji:o===Wa&&(a.mapping=Zi),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===Va||o===Wa)if(t.has(a)){const l=t.get(a).texture;return e(l,a.mapping)}else{const l=a.image;if(l&&l.height>0){const c=new Yu(l.height);return c.fromEquirectangularTexture(r,a),t.set(a,c),a.addEventListener("dispose",i),e(c.texture,a.mapping)}else return null}}return a}function i(a){const o=a.target;o.removeEventListener("dispose",i);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function s(){t=new WeakMap}return{get:n,dispose:s}}class gh extends fh{constructor(t=-1,e=1,n=1,i=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let s=n-t,a=n+t,o=i+e,l=i-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Xi=4,Vl=[.125,.215,.35,.446,.526,.582],vi=20,ga=new gh,Wl=new Pt;let xa=null,va=0,_a=0,ya=!1;const gi=(1+Math.sqrt(5))/2,Hi=1/gi,Xl=[new I(-gi,Hi,0),new I(gi,Hi,0),new I(-Hi,0,gi),new I(Hi,0,gi),new I(0,gi,-Hi),new I(0,gi,Hi),new I(-1,1,-1),new I(1,1,-1),new I(-1,1,1),new I(1,1,1)];class $l{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,i=100){xa=this._renderer.getRenderTarget(),va=this._renderer.getActiveCubeFace(),_a=this._renderer.getActiveMipmapLevel(),ya=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,n,i,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Yl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=jl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(xa,va,_a),this._renderer.xr.enabled=ya,t.scissorTest=!1,sr(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ji||t.mapping===Zi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),xa=this._renderer.getRenderTarget(),va=this._renderer.getActiveCubeFace(),_a=this._renderer.getActiveMipmapLevel(),ya=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:xn,minFilter:xn,generateMipmaps:!1,type:Is,format:vn,colorSpace:is,depthBuffer:!1},i=ql(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ql(t,e,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Bm(s)),this._blurMaterial=Hm(s,t,e)}return i}_compileMaterial(t){const e=new ge(this._lodPlanes[0],t);this._renderer.compile(e,ga)}_sceneToCubeUV(t,e,n,i){const o=new tn(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(Wl),h.toneMapping=ii,h.autoClear=!1;const f=new me({name:"PMREM.Background",side:je,depthWrite:!1,depthTest:!1}),g=new ge(new rs,f);let x=!1;const m=t.background;m?m.isColor&&(f.color.copy(m),t.background=null,x=!0):(f.color.copy(Wl),x=!0);for(let p=0;p<6;p++){const _=p%3;_===0?(o.up.set(0,l[p],0),o.lookAt(c[p],0,0)):_===1?(o.up.set(0,0,l[p]),o.lookAt(0,c[p],0)):(o.up.set(0,l[p],0),o.lookAt(0,0,c[p]));const y=this._cubeSize;sr(i,_*y,p>2?y:0,y,y),h.setRenderTarget(i),x&&h.render(g,o),h.render(t,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=d,h.autoClear=u,t.background=m}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===Ji||t.mapping===Zi;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Yl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=jl());const s=i?this._cubemapMaterial:this._equirectMaterial,a=new ge(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=t;const l=this._cubeSize;sr(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,ga)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodPlanes.length;for(let s=1;s<i;s++){const a=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=Xl[(i-s-1)%Xl.length];this._blur(t,s-1,s,a,o)}e.autoClear=n}_blur(t,e,n,i,s){const a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,i,"latitudinal",s),this._halfBlur(a,t,n,n,i,"longitudinal",s)}_halfBlur(t,e,n,i,s,a,o){const l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,u=new ge(this._lodPlanes[i],c),d=c.uniforms,f=this._sizeLods[n]-1,g=isFinite(s)?Math.PI/(2*f):2*Math.PI/(2*vi-1),x=s/g,m=isFinite(s)?1+Math.floor(h*x):vi;m>vi&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${vi}`);const p=[];let _=0;for(let T=0;T<vi;++T){const C=T/x,w=Math.exp(-C*C/2);p.push(w),T===0?_+=w:T<m&&(_+=2*w)}for(let T=0;T<p.length;T++)p[T]=p[T]/_;d.envMap.value=t.texture,d.samples.value=m,d.weights.value=p,d.latitudinal.value=a==="latitudinal",o&&(d.poleAxis.value=o);const{_lodMax:y}=this;d.dTheta.value=g,d.mipInt.value=y-n;const M=this._sizeLods[i],z=3*M*(i>y-Xi?i-y+Xi:0),A=4*(this._cubeSize-M);sr(e,z,A,3*M,2*M),l.setRenderTarget(e),l.render(u,ga)}}function Bm(r){const t=[],e=[],n=[];let i=r;const s=r-Xi+1+Vl.length;for(let a=0;a<s;a++){const o=Math.pow(2,i);e.push(o);let l=1/o;a>r-Xi?l=Vl[a-r+Xi-1]:a===0&&(l=0),n.push(l);const c=1/(o-2),h=-c,u=1+c,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,g=6,x=3,m=2,p=1,_=new Float32Array(x*g*f),y=new Float32Array(m*g*f),M=new Float32Array(p*g*f);for(let A=0;A<f;A++){const T=A%3*2/3-1,C=A>2?0:-1,w=[T,C,0,T+2/3,C,0,T+2/3,C+1,0,T,C,0,T+2/3,C+1,0,T,C+1,0];_.set(w,x*g*A),y.set(d,m*g*A);const b=[A,A,A,A,A,A];M.set(b,p*g*A)}const z=new we;z.setAttribute("position",new ze(_,x)),z.setAttribute("uv",new ze(y,m)),z.setAttribute("faceIndex",new ze(M,p)),t.push(z),i>Xi&&i--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function ql(r,t,e){const n=new Si(r,t,e);return n.texture.mapping=zr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function sr(r,t,e,n,i){r.viewport.set(t,e,n,i),r.scissor.set(t,e,n,i)}function Hm(r,t,e){const n=new Float32Array(vi),i=new I(0,1,0);return new Vn({name:"SphericalGaussianBlur",defines:{n:vi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Ho(),fragmentShader:`

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
		`,blending:ni,depthTest:!1,depthWrite:!1})}function jl(){return new Vn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ho(),fragmentShader:`

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
		`,blending:ni,depthTest:!1,depthWrite:!1})}function Yl(){return new Vn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ho(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ni,depthTest:!1,depthWrite:!1})}function Ho(){return`

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
	`}function Gm(r){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===Va||l===Wa,h=l===Ji||l===Zi;if(c||h){let u=t.get(o);const d=u!==void 0?u.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==d)return e===null&&(e=new $l(r)),u=c?e.fromEquirectangular(o,u):e.fromCubemap(o,u),u.texture.pmremVersion=o.pmremVersion,t.set(o,u),u.texture;if(u!==void 0)return u.texture;{const f=o.image;return c&&f&&f.height>0||h&&f&&i(f)?(e===null&&(e=new $l(r)),u=c?e.fromEquirectangular(o):e.fromCubemap(o),u.texture.pmremVersion=o.pmremVersion,t.set(o,u),o.addEventListener("dispose",s),u.texture):null}}}return o}function i(o){let l=0;const c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function s(o){const l=o.target;l.removeEventListener("dispose",s);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function Vm(r){const t={};function e(n){if(t[n]!==void 0)return t[n];let i;switch(n){case"WEBGL_depth_texture":i=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=r.getExtension(n)}return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&Ms("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function Wm(r,t,e,n){const i={},s=new WeakMap;function a(u){const d=u.target;d.index!==null&&t.remove(d.index);for(const g in d.attributes)t.remove(d.attributes[g]);for(const g in d.morphAttributes){const x=d.morphAttributes[g];for(let m=0,p=x.length;m<p;m++)t.remove(x[m])}d.removeEventListener("dispose",a),delete i[d.id];const f=s.get(d);f&&(t.remove(f),s.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,e.memory.geometries--}function o(u,d){return i[d.id]===!0||(d.addEventListener("dispose",a),i[d.id]=!0,e.memory.geometries++),d}function l(u){const d=u.attributes;for(const g in d)t.update(d[g],r.ARRAY_BUFFER);const f=u.morphAttributes;for(const g in f){const x=f[g];for(let m=0,p=x.length;m<p;m++)t.update(x[m],r.ARRAY_BUFFER)}}function c(u){const d=[],f=u.index,g=u.attributes.position;let x=0;if(f!==null){const _=f.array;x=f.version;for(let y=0,M=_.length;y<M;y+=3){const z=_[y+0],A=_[y+1],T=_[y+2];d.push(z,A,A,T,T,z)}}else if(g!==void 0){const _=g.array;x=g.version;for(let y=0,M=_.length/3-1;y<M;y+=3){const z=y+0,A=y+1,T=y+2;d.push(z,A,A,T,T,z)}}else return;const m=new(ah(d)?dh:hh)(d,1);m.version=x;const p=s.get(u);p&&t.remove(p),s.set(u,m)}function h(u){const d=s.get(u);if(d){const f=u.index;f!==null&&d.version<f.version&&c(u)}else c(u);return s.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function Xm(r,t,e){let n;function i(d){n=d}let s,a;function o(d){s=d.type,a=d.bytesPerElement}function l(d,f){r.drawElements(n,f,s,d*a),e.update(f,n,1)}function c(d,f,g){g!==0&&(r.drawElementsInstanced(n,f,s,d*a,g),e.update(f,n,g))}function h(d,f,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,s,d,0,g);let m=0;for(let p=0;p<g;p++)m+=f[p];e.update(m,n,1)}function u(d,f,g,x){if(g===0)return;const m=t.get("WEBGL_multi_draw");if(m===null)for(let p=0;p<d.length;p++)c(d[p]/a,f[p],x[p]);else{m.multiDrawElementsInstancedWEBGL(n,f,0,s,d,0,x,0,g);let p=0;for(let _=0;_<g;_++)p+=f[_]*x[_];e.update(p,n,1)}}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function $m(r){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(e.calls++,a){case r.TRIANGLES:e.triangles+=o*(s/3);break;case r.LINES:e.lines+=o*(s/2);break;case r.LINE_STRIP:e.lines+=o*(s-1);break;case r.LINE_LOOP:e.lines+=o*s;break;case r.POINTS:e.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function qm(r,t,e){const n=new WeakMap,i=new be;function s(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0;let d=n.get(o);if(d===void 0||d.count!==u){let b=function(){C.dispose(),n.delete(o),o.removeEventListener("dispose",b)};var f=b;d!==void 0&&d.texture.dispose();const g=o.morphAttributes.position!==void 0,x=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,p=o.morphAttributes.position||[],_=o.morphAttributes.normal||[],y=o.morphAttributes.color||[];let M=0;g===!0&&(M=1),x===!0&&(M=2),m===!0&&(M=3);let z=o.attributes.position.count*M,A=1;z>t.maxTextureSize&&(A=Math.ceil(z/t.maxTextureSize),z=t.maxTextureSize);const T=new Float32Array(z*A*4*u),C=new lh(T,z,A,u);C.type=wn,C.needsUpdate=!0;const w=M*4;for(let k=0;k<u;k++){const X=p[k],H=_[k],P=y[k],O=z*A*4*k;for(let V=0;V<X.count;V++){const K=V*w;g===!0&&(i.fromBufferAttribute(X,V),T[O+K+0]=i.x,T[O+K+1]=i.y,T[O+K+2]=i.z,T[O+K+3]=0),x===!0&&(i.fromBufferAttribute(H,V),T[O+K+4]=i.x,T[O+K+5]=i.y,T[O+K+6]=i.z,T[O+K+7]=0),m===!0&&(i.fromBufferAttribute(P,V),T[O+K+8]=i.x,T[O+K+9]=i.y,T[O+K+10]=i.z,T[O+K+11]=P.itemSize===4?i.w:1)}}d={count:u,texture:C,size:new gt(z,A)},n.set(o,d),o.addEventListener("dispose",b)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(r,"morphTexture",a.morphTexture,e);else{let g=0;for(let m=0;m<c.length;m++)g+=c[m];const x=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(r,"morphTargetBaseInfluence",x),l.getUniforms().setValue(r,"morphTargetInfluences",c)}l.getUniforms().setValue(r,"morphTargetsTexture",d.texture,e),l.getUniforms().setValue(r,"morphTargetsTextureSize",d.size)}return{update:s}}function jm(r,t,e,n){let i=new WeakMap;function s(l){const c=n.render.frame,h=l.geometry,u=t.get(l,h);if(i.get(u)!==c&&(t.update(u),i.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),i.get(l)!==c&&(e.update(l.instanceMatrix,r.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,r.ARRAY_BUFFER),i.set(l,c))),l.isSkinnedMesh){const d=l.skeleton;i.get(d)!==c&&(d.update(),i.set(d,c))}return u}function a(){i=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:s,dispose:a}}class xh extends Be{constructor(t,e,n,i,s,a,o,l,c,h=ji){if(h!==ji&&h!==ts)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===ji&&(n=bi),n===void 0&&h===ts&&(n=Qi),super(null,i,s,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:nn,this.minFilter=l!==void 0?l:nn,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const vh=new Be,Kl=new xh(1,1),_h=new lh,yh=new Iu,Mh=new ph,Jl=[],Zl=[],Ql=new Float32Array(16),tc=new Float32Array(9),ec=new Float32Array(4);function as(r,t,e){const n=r[0];if(n<=0||n>0)return r;const i=t*e;let s=Jl[i];if(s===void 0&&(s=new Float32Array(i),Jl[i]=s),t!==0){n.toArray(s,0);for(let a=1,o=0;a!==t;++a)o+=e,r[a].toArray(s,o)}return s}function Re(r,t){if(r.length!==t.length)return!1;for(let e=0,n=r.length;e<n;e++)if(r[e]!==t[e])return!1;return!0}function Ce(r,t){for(let e=0,n=t.length;e<n;e++)r[e]=t[e]}function Lr(r,t){let e=Zl[t];e===void 0&&(e=new Int32Array(t),Zl[t]=e);for(let n=0;n!==t;++n)e[n]=r.allocateTextureUnit();return e}function Ym(r,t){const e=this.cache;e[0]!==t&&(r.uniform1f(this.addr,t),e[0]=t)}function Km(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Re(e,t))return;r.uniform2fv(this.addr,t),Ce(e,t)}}function Jm(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(r.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Re(e,t))return;r.uniform3fv(this.addr,t),Ce(e,t)}}function Zm(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Re(e,t))return;r.uniform4fv(this.addr,t),Ce(e,t)}}function Qm(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Re(e,t))return;r.uniformMatrix2fv(this.addr,!1,t),Ce(e,t)}else{if(Re(e,n))return;ec.set(n),r.uniformMatrix2fv(this.addr,!1,ec),Ce(e,n)}}function t0(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Re(e,t))return;r.uniformMatrix3fv(this.addr,!1,t),Ce(e,t)}else{if(Re(e,n))return;tc.set(n),r.uniformMatrix3fv(this.addr,!1,tc),Ce(e,n)}}function e0(r,t){const e=this.cache,n=t.elements;if(n===void 0){if(Re(e,t))return;r.uniformMatrix4fv(this.addr,!1,t),Ce(e,t)}else{if(Re(e,n))return;Ql.set(n),r.uniformMatrix4fv(this.addr,!1,Ql),Ce(e,n)}}function n0(r,t){const e=this.cache;e[0]!==t&&(r.uniform1i(this.addr,t),e[0]=t)}function i0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Re(e,t))return;r.uniform2iv(this.addr,t),Ce(e,t)}}function s0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Re(e,t))return;r.uniform3iv(this.addr,t),Ce(e,t)}}function r0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Re(e,t))return;r.uniform4iv(this.addr,t),Ce(e,t)}}function a0(r,t){const e=this.cache;e[0]!==t&&(r.uniform1ui(this.addr,t),e[0]=t)}function o0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(r.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Re(e,t))return;r.uniform2uiv(this.addr,t),Ce(e,t)}}function l0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(r.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Re(e,t))return;r.uniform3uiv(this.addr,t),Ce(e,t)}}function c0(r,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(r.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Re(e,t))return;r.uniform4uiv(this.addr,t),Ce(e,t)}}function h0(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i);let s;this.type===r.SAMPLER_2D_SHADOW?(Kl.compareFunction=rh,s=Kl):s=vh,e.setTexture2D(t||s,i)}function d0(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||yh,i)}function u0(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||Mh,i)}function f0(r,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||_h,i)}function p0(r){switch(r){case 5126:return Ym;case 35664:return Km;case 35665:return Jm;case 35666:return Zm;case 35674:return Qm;case 35675:return t0;case 35676:return e0;case 5124:case 35670:return n0;case 35667:case 35671:return i0;case 35668:case 35672:return s0;case 35669:case 35673:return r0;case 5125:return a0;case 36294:return o0;case 36295:return l0;case 36296:return c0;case 35678:case 36198:case 36298:case 36306:case 35682:return h0;case 35679:case 36299:case 36307:return d0;case 35680:case 36300:case 36308:case 36293:return u0;case 36289:case 36303:case 36311:case 36292:return f0}}function m0(r,t){r.uniform1fv(this.addr,t)}function g0(r,t){const e=as(t,this.size,2);r.uniform2fv(this.addr,e)}function x0(r,t){const e=as(t,this.size,3);r.uniform3fv(this.addr,e)}function v0(r,t){const e=as(t,this.size,4);r.uniform4fv(this.addr,e)}function _0(r,t){const e=as(t,this.size,4);r.uniformMatrix2fv(this.addr,!1,e)}function y0(r,t){const e=as(t,this.size,9);r.uniformMatrix3fv(this.addr,!1,e)}function M0(r,t){const e=as(t,this.size,16);r.uniformMatrix4fv(this.addr,!1,e)}function b0(r,t){r.uniform1iv(this.addr,t)}function S0(r,t){r.uniform2iv(this.addr,t)}function w0(r,t){r.uniform3iv(this.addr,t)}function E0(r,t){r.uniform4iv(this.addr,t)}function T0(r,t){r.uniform1uiv(this.addr,t)}function A0(r,t){r.uniform2uiv(this.addr,t)}function R0(r,t){r.uniform3uiv(this.addr,t)}function C0(r,t){r.uniform4uiv(this.addr,t)}function P0(r,t,e){const n=this.cache,i=t.length,s=Lr(e,i);Re(n,s)||(r.uniform1iv(this.addr,s),Ce(n,s));for(let a=0;a!==i;++a)e.setTexture2D(t[a]||vh,s[a])}function z0(r,t,e){const n=this.cache,i=t.length,s=Lr(e,i);Re(n,s)||(r.uniform1iv(this.addr,s),Ce(n,s));for(let a=0;a!==i;++a)e.setTexture3D(t[a]||yh,s[a])}function k0(r,t,e){const n=this.cache,i=t.length,s=Lr(e,i);Re(n,s)||(r.uniform1iv(this.addr,s),Ce(n,s));for(let a=0;a!==i;++a)e.setTextureCube(t[a]||Mh,s[a])}function I0(r,t,e){const n=this.cache,i=t.length,s=Lr(e,i);Re(n,s)||(r.uniform1iv(this.addr,s),Ce(n,s));for(let a=0;a!==i;++a)e.setTexture2DArray(t[a]||_h,s[a])}function L0(r){switch(r){case 5126:return m0;case 35664:return g0;case 35665:return x0;case 35666:return v0;case 35674:return _0;case 35675:return y0;case 35676:return M0;case 5124:case 35670:return b0;case 35667:case 35671:return S0;case 35668:case 35672:return w0;case 35669:case 35673:return E0;case 5125:return T0;case 36294:return A0;case 36295:return R0;case 36296:return C0;case 35678:case 36198:case 36298:case 36306:case 35682:return P0;case 35679:case 36299:case 36307:return z0;case 35680:case 36300:case 36308:case 36293:return k0;case 36289:case 36303:case 36311:case 36292:return I0}}class D0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=p0(e.type)}}class U0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=L0(e.type)}}class N0{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let s=0,a=i.length;s!==a;++s){const o=i[s];o.setValue(t,e[o.id],n)}}}const Ma=/(\w+)(\])?(\[|\.)?/g;function nc(r,t){r.seq.push(t),r.map[t.id]=t}function F0(r,t,e){const n=r.name,i=n.length;for(Ma.lastIndex=0;;){const s=Ma.exec(n),a=Ma.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===i){nc(e,c===void 0?new D0(o,r,t):new U0(o,r,t));break}else{let u=e.map[o];u===void 0&&(u=new N0(o),nc(e,u)),e=u}}}class Mr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const s=t.getActiveUniform(e,i),a=t.getUniformLocation(e,s.name);F0(s,a,this)}}setValue(t,e,n,i){const s=this.map[e];s!==void 0&&s.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let s=0,a=e.length;s!==a;++s){const o=e[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,s=t.length;i!==s;++i){const a=t[i];a.id in e&&n.push(a)}return n}}function ic(r,t,e){const n=r.createShader(t);return r.shaderSource(n,e),r.compileShader(n),n}const O0=37297;let B0=0;function H0(r,t){const e=r.split(`
`),n=[],i=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let a=i;a<s;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}const sc=new Ot;function G0(r){Kt._getMatrix(sc,Kt.workingColorSpace,r);const t=`mat3( ${sc.elements.map(e=>e.toFixed(4))} )`;switch(Kt.getTransfer(r)){case kr:return[t,"LinearTransferOETF"];case le:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",r),[t,"LinearTransferOETF"]}}function rc(r,t,e){const n=r.getShaderParameter(t,r.COMPILE_STATUS),i=r.getShaderInfoLog(t).trim();if(n&&i==="")return"";const s=/ERROR: 0:(\d+)/.exec(i);if(s){const a=parseInt(s[1]);return e.toUpperCase()+`

`+i+`

`+H0(r.getShaderSource(t),a)}else return i}function V0(r,t){const e=G0(t);return[`vec4 ${r}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function W0(r,t){let e;switch(t){case ou:e="Linear";break;case lu:e="Reinhard";break;case cu:e="Cineon";break;case qc:e="ACESFilmic";break;case du:e="AgX";break;case uu:e="Neutral";break;case hu:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+r+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const rr=new I;function X0(){Kt.getLuminanceCoefficients(rr);const r=rr.x.toFixed(4),t=rr.y.toFixed(4),e=rr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${r}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function $0(r){return[r.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",r.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(bs).join(`
`)}function q0(r){const t=[];for(const e in r){const n=r[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function j0(r,t){const e={},n=r.getProgramParameter(t,r.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const s=r.getActiveAttrib(t,i),a=s.name;let o=1;s.type===r.FLOAT_MAT2&&(o=2),s.type===r.FLOAT_MAT3&&(o=3),s.type===r.FLOAT_MAT4&&(o=4),e[a]={type:s.type,location:r.getAttribLocation(t,a),locationSize:o}}return e}function bs(r){return r!==""}function ac(r,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function oc(r,t){return r.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const Y0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Mo(r){return r.replace(Y0,J0)}const K0=new Map;function J0(r,t){let e=Ht[t];if(e===void 0){const n=K0.get(t);if(n!==void 0)e=Ht[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Mo(e)}const Z0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function lc(r){return r.replace(Z0,Q0)}function Q0(r,t,e,n){let i="";for(let s=parseInt(t);s<parseInt(e);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function cc(r){let t=`precision ${r.precision} float;
	precision ${r.precision} int;
	precision ${r.precision} sampler2D;
	precision ${r.precision} samplerCube;
	precision ${r.precision} sampler3D;
	precision ${r.precision} sampler2DArray;
	precision ${r.precision} sampler2DShadow;
	precision ${r.precision} samplerCubeShadow;
	precision ${r.precision} sampler2DArrayShadow;
	precision ${r.precision} isampler2D;
	precision ${r.precision} isampler3D;
	precision ${r.precision} isamplerCube;
	precision ${r.precision} isampler2DArray;
	precision ${r.precision} usampler2D;
	precision ${r.precision} usampler3D;
	precision ${r.precision} usamplerCube;
	precision ${r.precision} usampler2DArray;
	`;return r.precision==="highp"?t+=`
#define HIGH_PRECISION`:r.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function tg(r){let t="SHADOWMAP_TYPE_BASIC";return r.shadowMapType===zo?t="SHADOWMAP_TYPE_PCF":r.shadowMapType===Xc?t="SHADOWMAP_TYPE_PCF_SOFT":r.shadowMapType===Dn&&(t="SHADOWMAP_TYPE_VSM"),t}function eg(r){let t="ENVMAP_TYPE_CUBE";if(r.envMap)switch(r.envMapMode){case Ji:case Zi:t="ENVMAP_TYPE_CUBE";break;case zr:t="ENVMAP_TYPE_CUBE_UV";break}return t}function ng(r){let t="ENVMAP_MODE_REFLECTION";if(r.envMap)switch(r.envMapMode){case Zi:t="ENVMAP_MODE_REFRACTION";break}return t}function ig(r){let t="ENVMAP_BLENDING_NONE";if(r.envMap)switch(r.combine){case $c:t="ENVMAP_BLENDING_MULTIPLY";break;case ru:t="ENVMAP_BLENDING_MIX";break;case au:t="ENVMAP_BLENDING_ADD";break}return t}function sg(r){const t=r.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function rg(r,t,e,n){const i=r.getContext(),s=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=tg(e),c=eg(e),h=ng(e),u=ig(e),d=sg(e),f=$0(e),g=q0(s),x=i.createProgram();let m,p,_=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(bs).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(bs).join(`
`),p.length>0&&(p+=`
`)):(m=[cc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(bs).join(`
`),p=[cc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==ii?"#define TONE_MAPPING":"",e.toneMapping!==ii?Ht.tonemapping_pars_fragment:"",e.toneMapping!==ii?W0("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Ht.colorspace_pars_fragment,V0("linearToOutputTexel",e.outputColorSpace),X0(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(bs).join(`
`)),a=Mo(a),a=ac(a,e),a=oc(a,e),o=Mo(o),o=ac(o,e),o=oc(o,e),a=lc(a),o=lc(o),e.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",e.glslVersion===bl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===bl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const y=_+m+a,M=_+p+o,z=ic(i,i.VERTEX_SHADER,y),A=ic(i,i.FRAGMENT_SHADER,M);i.attachShader(x,z),i.attachShader(x,A),e.index0AttributeName!==void 0?i.bindAttribLocation(x,0,e.index0AttributeName):e.morphTargets===!0&&i.bindAttribLocation(x,0,"position"),i.linkProgram(x);function T(k){if(r.debug.checkShaderErrors){const X=i.getProgramInfoLog(x).trim(),H=i.getShaderInfoLog(z).trim(),P=i.getShaderInfoLog(A).trim();let O=!0,V=!0;if(i.getProgramParameter(x,i.LINK_STATUS)===!1)if(O=!1,typeof r.debug.onShaderError=="function")r.debug.onShaderError(i,x,z,A);else{const K=rc(i,z,"vertex"),$=rc(i,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(x,i.VALIDATE_STATUS)+`

Material Name: `+k.name+`
Material Type: `+k.type+`

Program Info Log: `+X+`
`+K+`
`+$)}else X!==""?console.warn("THREE.WebGLProgram: Program Info Log:",X):(H===""||P==="")&&(V=!1);V&&(k.diagnostics={runnable:O,programLog:X,vertexShader:{log:H,prefix:m},fragmentShader:{log:P,prefix:p}})}i.deleteShader(z),i.deleteShader(A),C=new Mr(i,x),w=j0(i,x)}let C;this.getUniforms=function(){return C===void 0&&T(this),C};let w;this.getAttributes=function(){return w===void 0&&T(this),w};let b=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return b===!1&&(b=i.getProgramParameter(x,O0)),b},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(x),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=B0++,this.cacheKey=t,this.usedTimes=1,this.program=x,this.vertexShader=z,this.fragmentShader=A,this}let ag=0;class og{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,i=this._getShaderStage(e),s=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(i)===!1&&(a.add(i),i.usedTimes++),a.has(s)===!1&&(a.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new lg(t),e.set(t,n)),n}}class lg{constructor(t){this.id=ag++,this.code=t,this.usedTimes=0}}function cg(r,t,e,n,i,s,a){const o=new Oo,l=new og,c=new Set,h=[],u=i.logarithmicDepthBuffer,d=i.vertexTextures;let f=i.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function x(w){return c.add(w),w===0?"uv":`uv${w}`}function m(w,b,k,X,H){const P=X.fog,O=H.geometry,V=w.isMeshStandardMaterial?X.environment:null,K=(w.isMeshStandardMaterial?e:t).get(w.envMap||V),$=K&&K.mapping===zr?K.image.height:null,nt=g[w.type];w.precision!==null&&(f=i.getMaxPrecision(w.precision),f!==w.precision&&console.warn("THREE.WebGLProgram.getParameters:",w.precision,"not supported, using",f,"instead."));const dt=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,Mt=dt!==void 0?dt.length:0;let kt=0;O.morphAttributes.position!==void 0&&(kt=1),O.morphAttributes.normal!==void 0&&(kt=2),O.morphAttributes.color!==void 0&&(kt=3);let qt,Y,it,yt;if(nt){const oe=Mn[nt];qt=oe.vertexShader,Y=oe.fragmentShader}else qt=w.vertexShader,Y=w.fragmentShader,l.update(w),it=l.getVertexShaderID(w),yt=l.getFragmentShaderID(w);const at=r.getRenderTarget(),Rt=r.state.buffers.depth.getReversed(),It=H.isInstancedMesh===!0,Gt=H.isBatchedMesh===!0,ve=!!w.map,jt=!!w.matcap,Se=!!K,N=!!w.aoMap,rn=!!w.lightMap,Vt=!!w.bumpMap,Wt=!!w.normalMap,Ct=!!w.displacementMap,ue=!!w.emissiveMap,At=!!w.metalnessMap,R=!!w.roughnessMap,S=w.anisotropy>0,B=w.clearcoat>0,Z=w.dispersion>0,tt=w.iridescence>0,J=w.sheen>0,Et=w.transmission>0,ut=S&&!!w.anisotropyMap,xt=B&&!!w.clearcoatMap,Yt=B&&!!w.clearcoatNormalMap,st=B&&!!w.clearcoatRoughnessMap,vt=tt&&!!w.iridescenceMap,zt=tt&&!!w.iridescenceThicknessMap,Lt=J&&!!w.sheenColorMap,_t=J&&!!w.sheenRoughnessMap,Xt=!!w.specularMap,Bt=!!w.specularColorMap,he=!!w.specularIntensityMap,L=Et&&!!w.transmissionMap,ht=Et&&!!w.thicknessMap,j=!!w.gradientMap,Q=!!w.alphaMap,mt=w.alphaTest>0,ft=!!w.alphaHash,Nt=!!w.extensions;let ye=ii;w.toneMapped&&(at===null||at.isXRRenderTarget===!0)&&(ye=r.toneMapping);const Ue={shaderID:nt,shaderType:w.type,shaderName:w.name,vertexShader:qt,fragmentShader:Y,defines:w.defines,customVertexShaderID:it,customFragmentShaderID:yt,isRawShaderMaterial:w.isRawShaderMaterial===!0,glslVersion:w.glslVersion,precision:f,batching:Gt,batchingColor:Gt&&H._colorsTexture!==null,instancing:It,instancingColor:It&&H.instanceColor!==null,instancingMorph:It&&H.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:at===null?r.outputColorSpace:at.isXRRenderTarget===!0?at.texture.colorSpace:is,alphaToCoverage:!!w.alphaToCoverage,map:ve,matcap:jt,envMap:Se,envMapMode:Se&&K.mapping,envMapCubeUVHeight:$,aoMap:N,lightMap:rn,bumpMap:Vt,normalMap:Wt,displacementMap:d&&Ct,emissiveMap:ue,normalMapObjectSpace:Wt&&w.normalMapType===gu,normalMapTangentSpace:Wt&&w.normalMapType===sh,metalnessMap:At,roughnessMap:R,anisotropy:S,anisotropyMap:ut,clearcoat:B,clearcoatMap:xt,clearcoatNormalMap:Yt,clearcoatRoughnessMap:st,dispersion:Z,iridescence:tt,iridescenceMap:vt,iridescenceThicknessMap:zt,sheen:J,sheenColorMap:Lt,sheenRoughnessMap:_t,specularMap:Xt,specularColorMap:Bt,specularIntensityMap:he,transmission:Et,transmissionMap:L,thicknessMap:ht,gradientMap:j,opaque:w.transparent===!1&&w.blending===qi&&w.alphaToCoverage===!1,alphaMap:Q,alphaTest:mt,alphaHash:ft,combine:w.combine,mapUv:ve&&x(w.map.channel),aoMapUv:N&&x(w.aoMap.channel),lightMapUv:rn&&x(w.lightMap.channel),bumpMapUv:Vt&&x(w.bumpMap.channel),normalMapUv:Wt&&x(w.normalMap.channel),displacementMapUv:Ct&&x(w.displacementMap.channel),emissiveMapUv:ue&&x(w.emissiveMap.channel),metalnessMapUv:At&&x(w.metalnessMap.channel),roughnessMapUv:R&&x(w.roughnessMap.channel),anisotropyMapUv:ut&&x(w.anisotropyMap.channel),clearcoatMapUv:xt&&x(w.clearcoatMap.channel),clearcoatNormalMapUv:Yt&&x(w.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:st&&x(w.clearcoatRoughnessMap.channel),iridescenceMapUv:vt&&x(w.iridescenceMap.channel),iridescenceThicknessMapUv:zt&&x(w.iridescenceThicknessMap.channel),sheenColorMapUv:Lt&&x(w.sheenColorMap.channel),sheenRoughnessMapUv:_t&&x(w.sheenRoughnessMap.channel),specularMapUv:Xt&&x(w.specularMap.channel),specularColorMapUv:Bt&&x(w.specularColorMap.channel),specularIntensityMapUv:he&&x(w.specularIntensityMap.channel),transmissionMapUv:L&&x(w.transmissionMap.channel),thicknessMapUv:ht&&x(w.thicknessMap.channel),alphaMapUv:Q&&x(w.alphaMap.channel),vertexTangents:!!O.attributes.tangent&&(Wt||S),vertexColors:w.vertexColors,vertexAlphas:w.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,pointsUvs:H.isPoints===!0&&!!O.attributes.uv&&(ve||Q),fog:!!P,useFog:w.fog===!0,fogExp2:!!P&&P.isFogExp2,flatShading:w.flatShading===!0,sizeAttenuation:w.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Rt,skinning:H.isSkinnedMesh===!0,morphTargets:O.morphAttributes.position!==void 0,morphNormals:O.morphAttributes.normal!==void 0,morphColors:O.morphAttributes.color!==void 0,morphTargetsCount:Mt,morphTextureStride:kt,numDirLights:b.directional.length,numPointLights:b.point.length,numSpotLights:b.spot.length,numSpotLightMaps:b.spotLightMap.length,numRectAreaLights:b.rectArea.length,numHemiLights:b.hemi.length,numDirLightShadows:b.directionalShadowMap.length,numPointLightShadows:b.pointShadowMap.length,numSpotLightShadows:b.spotShadowMap.length,numSpotLightShadowsWithMaps:b.numSpotLightShadowsWithMaps,numLightProbes:b.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:w.dithering,shadowMapEnabled:r.shadowMap.enabled&&k.length>0,shadowMapType:r.shadowMap.type,toneMapping:ye,decodeVideoTexture:ve&&w.map.isVideoTexture===!0&&Kt.getTransfer(w.map.colorSpace)===le,decodeVideoTextureEmissive:ue&&w.emissiveMap.isVideoTexture===!0&&Kt.getTransfer(w.emissiveMap.colorSpace)===le,premultipliedAlpha:w.premultipliedAlpha,doubleSided:w.side===en,flipSided:w.side===je,useDepthPacking:w.depthPacking>=0,depthPacking:w.depthPacking||0,index0AttributeName:w.index0AttributeName,extensionClipCullDistance:Nt&&w.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Nt&&w.extensions.multiDraw===!0||Gt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:w.customProgramCacheKey()};return Ue.vertexUv1s=c.has(1),Ue.vertexUv2s=c.has(2),Ue.vertexUv3s=c.has(3),c.clear(),Ue}function p(w){const b=[];if(w.shaderID?b.push(w.shaderID):(b.push(w.customVertexShaderID),b.push(w.customFragmentShaderID)),w.defines!==void 0)for(const k in w.defines)b.push(k),b.push(w.defines[k]);return w.isRawShaderMaterial===!1&&(_(b,w),y(b,w),b.push(r.outputColorSpace)),b.push(w.customProgramCacheKey),b.join()}function _(w,b){w.push(b.precision),w.push(b.outputColorSpace),w.push(b.envMapMode),w.push(b.envMapCubeUVHeight),w.push(b.mapUv),w.push(b.alphaMapUv),w.push(b.lightMapUv),w.push(b.aoMapUv),w.push(b.bumpMapUv),w.push(b.normalMapUv),w.push(b.displacementMapUv),w.push(b.emissiveMapUv),w.push(b.metalnessMapUv),w.push(b.roughnessMapUv),w.push(b.anisotropyMapUv),w.push(b.clearcoatMapUv),w.push(b.clearcoatNormalMapUv),w.push(b.clearcoatRoughnessMapUv),w.push(b.iridescenceMapUv),w.push(b.iridescenceThicknessMapUv),w.push(b.sheenColorMapUv),w.push(b.sheenRoughnessMapUv),w.push(b.specularMapUv),w.push(b.specularColorMapUv),w.push(b.specularIntensityMapUv),w.push(b.transmissionMapUv),w.push(b.thicknessMapUv),w.push(b.combine),w.push(b.fogExp2),w.push(b.sizeAttenuation),w.push(b.morphTargetsCount),w.push(b.morphAttributeCount),w.push(b.numDirLights),w.push(b.numPointLights),w.push(b.numSpotLights),w.push(b.numSpotLightMaps),w.push(b.numHemiLights),w.push(b.numRectAreaLights),w.push(b.numDirLightShadows),w.push(b.numPointLightShadows),w.push(b.numSpotLightShadows),w.push(b.numSpotLightShadowsWithMaps),w.push(b.numLightProbes),w.push(b.shadowMapType),w.push(b.toneMapping),w.push(b.numClippingPlanes),w.push(b.numClipIntersection),w.push(b.depthPacking)}function y(w,b){o.disableAll(),b.supportsVertexTextures&&o.enable(0),b.instancing&&o.enable(1),b.instancingColor&&o.enable(2),b.instancingMorph&&o.enable(3),b.matcap&&o.enable(4),b.envMap&&o.enable(5),b.normalMapObjectSpace&&o.enable(6),b.normalMapTangentSpace&&o.enable(7),b.clearcoat&&o.enable(8),b.iridescence&&o.enable(9),b.alphaTest&&o.enable(10),b.vertexColors&&o.enable(11),b.vertexAlphas&&o.enable(12),b.vertexUv1s&&o.enable(13),b.vertexUv2s&&o.enable(14),b.vertexUv3s&&o.enable(15),b.vertexTangents&&o.enable(16),b.anisotropy&&o.enable(17),b.alphaHash&&o.enable(18),b.batching&&o.enable(19),b.dispersion&&o.enable(20),b.batchingColor&&o.enable(21),w.push(o.mask),o.disableAll(),b.fog&&o.enable(0),b.useFog&&o.enable(1),b.flatShading&&o.enable(2),b.logarithmicDepthBuffer&&o.enable(3),b.reverseDepthBuffer&&o.enable(4),b.skinning&&o.enable(5),b.morphTargets&&o.enable(6),b.morphNormals&&o.enable(7),b.morphColors&&o.enable(8),b.premultipliedAlpha&&o.enable(9),b.shadowMapEnabled&&o.enable(10),b.doubleSided&&o.enable(11),b.flipSided&&o.enable(12),b.useDepthPacking&&o.enable(13),b.dithering&&o.enable(14),b.transmission&&o.enable(15),b.sheen&&o.enable(16),b.opaque&&o.enable(17),b.pointsUvs&&o.enable(18),b.decodeVideoTexture&&o.enable(19),b.decodeVideoTextureEmissive&&o.enable(20),b.alphaToCoverage&&o.enable(21),w.push(o.mask)}function M(w){const b=g[w.type];let k;if(b){const X=Mn[b];k=Xu.clone(X.uniforms)}else k=w.uniforms;return k}function z(w,b){let k;for(let X=0,H=h.length;X<H;X++){const P=h[X];if(P.cacheKey===b){k=P,++k.usedTimes;break}}return k===void 0&&(k=new rg(r,b,w,s),h.push(k)),k}function A(w){if(--w.usedTimes===0){const b=h.indexOf(w);h[b]=h[h.length-1],h.pop(),w.destroy()}}function T(w){l.remove(w)}function C(){l.dispose()}return{getParameters:m,getProgramCacheKey:p,getUniforms:M,acquireProgram:z,releaseProgram:A,releaseShaderCache:T,programs:h,dispose:C}}function hg(){let r=new WeakMap;function t(a){return r.has(a)}function e(a){let o=r.get(a);return o===void 0&&(o={},r.set(a,o)),o}function n(a){r.delete(a)}function i(a,o,l){r.get(a)[o]=l}function s(){r=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:s}}function dg(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.material.id!==t.material.id?r.material.id-t.material.id:r.z!==t.z?r.z-t.z:r.id-t.id}function hc(r,t){return r.groupOrder!==t.groupOrder?r.groupOrder-t.groupOrder:r.renderOrder!==t.renderOrder?r.renderOrder-t.renderOrder:r.z!==t.z?t.z-r.z:r.id-t.id}function dc(){const r=[];let t=0;const e=[],n=[],i=[];function s(){t=0,e.length=0,n.length=0,i.length=0}function a(u,d,f,g,x,m){let p=r[t];return p===void 0?(p={id:u.id,object:u,geometry:d,material:f,groupOrder:g,renderOrder:u.renderOrder,z:x,group:m},r[t]=p):(p.id=u.id,p.object=u,p.geometry=d,p.material=f,p.groupOrder=g,p.renderOrder=u.renderOrder,p.z=x,p.group=m),t++,p}function o(u,d,f,g,x,m){const p=a(u,d,f,g,x,m);f.transmission>0?n.push(p):f.transparent===!0?i.push(p):e.push(p)}function l(u,d,f,g,x,m){const p=a(u,d,f,g,x,m);f.transmission>0?n.unshift(p):f.transparent===!0?i.unshift(p):e.unshift(p)}function c(u,d){e.length>1&&e.sort(u||dg),n.length>1&&n.sort(d||hc),i.length>1&&i.sort(d||hc)}function h(){for(let u=t,d=r.length;u<d;u++){const f=r[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:e,transmissive:n,transparent:i,init:s,push:o,unshift:l,finish:h,sort:c}}function ug(){let r=new WeakMap;function t(n,i){const s=r.get(n);let a;return s===void 0?(a=new dc,r.set(n,[a])):i>=s.length?(a=new dc,s.push(a)):a=s[i],a}function e(){r=new WeakMap}return{get:t,dispose:e}}function fg(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new I,color:new Pt};break;case"SpotLight":e={position:new I,direction:new I,color:new Pt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new I,color:new Pt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new I,skyColor:new Pt,groundColor:new Pt};break;case"RectAreaLight":e={color:new Pt,position:new I,halfWidth:new I,halfHeight:new I};break}return r[t.id]=e,e}}}function pg(){const r={};return{get:function(t){if(r[t.id]!==void 0)return r[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new gt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new gt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new gt,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[t.id]=e,e}}}let mg=0;function gg(r,t){return(t.castShadow?2:0)-(r.castShadow?2:0)+(t.map?1:0)-(r.map?1:0)}function xg(r){const t=new fg,e=pg(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new I);const i=new I,s=new te,a=new te;function o(c){let h=0,u=0,d=0;for(let w=0;w<9;w++)n.probe[w].set(0,0,0);let f=0,g=0,x=0,m=0,p=0,_=0,y=0,M=0,z=0,A=0,T=0;c.sort(gg);for(let w=0,b=c.length;w<b;w++){const k=c[w],X=k.color,H=k.intensity,P=k.distance,O=k.shadow&&k.shadow.map?k.shadow.map.texture:null;if(k.isAmbientLight)h+=X.r*H,u+=X.g*H,d+=X.b*H;else if(k.isLightProbe){for(let V=0;V<9;V++)n.probe[V].addScaledVector(k.sh.coefficients[V],H);T++}else if(k.isDirectionalLight){const V=t.get(k);if(V.color.copy(k.color).multiplyScalar(k.intensity),k.castShadow){const K=k.shadow,$=e.get(k);$.shadowIntensity=K.intensity,$.shadowBias=K.bias,$.shadowNormalBias=K.normalBias,$.shadowRadius=K.radius,$.shadowMapSize=K.mapSize,n.directionalShadow[f]=$,n.directionalShadowMap[f]=O,n.directionalShadowMatrix[f]=k.shadow.matrix,_++}n.directional[f]=V,f++}else if(k.isSpotLight){const V=t.get(k);V.position.setFromMatrixPosition(k.matrixWorld),V.color.copy(X).multiplyScalar(H),V.distance=P,V.coneCos=Math.cos(k.angle),V.penumbraCos=Math.cos(k.angle*(1-k.penumbra)),V.decay=k.decay,n.spot[x]=V;const K=k.shadow;if(k.map&&(n.spotLightMap[z]=k.map,z++,K.updateMatrices(k),k.castShadow&&A++),n.spotLightMatrix[x]=K.matrix,k.castShadow){const $=e.get(k);$.shadowIntensity=K.intensity,$.shadowBias=K.bias,$.shadowNormalBias=K.normalBias,$.shadowRadius=K.radius,$.shadowMapSize=K.mapSize,n.spotShadow[x]=$,n.spotShadowMap[x]=O,M++}x++}else if(k.isRectAreaLight){const V=t.get(k);V.color.copy(X).multiplyScalar(H),V.halfWidth.set(k.width*.5,0,0),V.halfHeight.set(0,k.height*.5,0),n.rectArea[m]=V,m++}else if(k.isPointLight){const V=t.get(k);if(V.color.copy(k.color).multiplyScalar(k.intensity),V.distance=k.distance,V.decay=k.decay,k.castShadow){const K=k.shadow,$=e.get(k);$.shadowIntensity=K.intensity,$.shadowBias=K.bias,$.shadowNormalBias=K.normalBias,$.shadowRadius=K.radius,$.shadowMapSize=K.mapSize,$.shadowCameraNear=K.camera.near,$.shadowCameraFar=K.camera.far,n.pointShadow[g]=$,n.pointShadowMap[g]=O,n.pointShadowMatrix[g]=k.shadow.matrix,y++}n.point[g]=V,g++}else if(k.isHemisphereLight){const V=t.get(k);V.skyColor.copy(k.color).multiplyScalar(H),V.groundColor.copy(k.groundColor).multiplyScalar(H),n.hemi[p]=V,p++}}m>0&&(r.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=lt.LTC_FLOAT_1,n.rectAreaLTC2=lt.LTC_FLOAT_2):(n.rectAreaLTC1=lt.LTC_HALF_1,n.rectAreaLTC2=lt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;const C=n.hash;(C.directionalLength!==f||C.pointLength!==g||C.spotLength!==x||C.rectAreaLength!==m||C.hemiLength!==p||C.numDirectionalShadows!==_||C.numPointShadows!==y||C.numSpotShadows!==M||C.numSpotMaps!==z||C.numLightProbes!==T)&&(n.directional.length=f,n.spot.length=x,n.rectArea.length=m,n.point.length=g,n.hemi.length=p,n.directionalShadow.length=_,n.directionalShadowMap.length=_,n.pointShadow.length=y,n.pointShadowMap.length=y,n.spotShadow.length=M,n.spotShadowMap.length=M,n.directionalShadowMatrix.length=_,n.pointShadowMatrix.length=y,n.spotLightMatrix.length=M+z-A,n.spotLightMap.length=z,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=T,C.directionalLength=f,C.pointLength=g,C.spotLength=x,C.rectAreaLength=m,C.hemiLength=p,C.numDirectionalShadows=_,C.numPointShadows=y,C.numSpotShadows=M,C.numSpotMaps=z,C.numLightProbes=T,n.version=mg++)}function l(c,h){let u=0,d=0,f=0,g=0,x=0;const m=h.matrixWorldInverse;for(let p=0,_=c.length;p<_;p++){const y=c[p];if(y.isDirectionalLight){const M=n.directional[u];M.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),M.direction.sub(i),M.direction.transformDirection(m),u++}else if(y.isSpotLight){const M=n.spot[f];M.position.setFromMatrixPosition(y.matrixWorld),M.position.applyMatrix4(m),M.direction.setFromMatrixPosition(y.matrixWorld),i.setFromMatrixPosition(y.target.matrixWorld),M.direction.sub(i),M.direction.transformDirection(m),f++}else if(y.isRectAreaLight){const M=n.rectArea[g];M.position.setFromMatrixPosition(y.matrixWorld),M.position.applyMatrix4(m),a.identity(),s.copy(y.matrixWorld),s.premultiply(m),a.extractRotation(s),M.halfWidth.set(y.width*.5,0,0),M.halfHeight.set(0,y.height*.5,0),M.halfWidth.applyMatrix4(a),M.halfHeight.applyMatrix4(a),g++}else if(y.isPointLight){const M=n.point[d];M.position.setFromMatrixPosition(y.matrixWorld),M.position.applyMatrix4(m),d++}else if(y.isHemisphereLight){const M=n.hemi[x];M.direction.setFromMatrixPosition(y.matrixWorld),M.direction.transformDirection(m),x++}}}return{setup:o,setupView:l,state:n}}function uc(r){const t=new xg(r),e=[],n=[];function i(h){c.camera=h,e.length=0,n.length=0}function s(h){e.push(h)}function a(h){n.push(h)}function o(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:i,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:a}}function vg(r){let t=new WeakMap;function e(i,s=0){const a=t.get(i);let o;return a===void 0?(o=new uc(r),t.set(i,[o])):s>=a.length?(o=new uc(r),a.push(o)):o=a[s],o}function n(){t=new WeakMap}return{get:e,dispose:n}}class _g extends Ti{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=pu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class yg extends Ti{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const Mg=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,bg=`uniform sampler2D shadow_pass;
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
}`;function Sg(r,t,e){let n=new Bo;const i=new gt,s=new gt,a=new be,o=new _g({depthPacking:mu}),l=new yg,c={},h=e.maxTextureSize,u={[ai]:je,[je]:ai,[en]:en},d=new Vn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new gt},radius:{value:4}},vertexShader:Mg,fragmentShader:bg}),f=d.clone();f.defines.HORIZONTAL_PASS=1;const g=new we;g.setAttribute("position",new ze(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new ge(g,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=zo;let p=this.type;this.render=function(A,T,C){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;const w=r.getRenderTarget(),b=r.getActiveCubeFace(),k=r.getActiveMipmapLevel(),X=r.state;X.setBlending(ni),X.buffers.color.setClear(1,1,1,1),X.buffers.depth.setTest(!0),X.setScissorTest(!1);const H=p!==Dn&&this.type===Dn,P=p===Dn&&this.type!==Dn;for(let O=0,V=A.length;O<V;O++){const K=A[O],$=K.shadow;if($===void 0){console.warn("THREE.WebGLShadowMap:",K,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;i.copy($.mapSize);const nt=$.getFrameExtents();if(i.multiply(nt),s.copy($.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(s.x=Math.floor(h/nt.x),i.x=s.x*nt.x,$.mapSize.x=s.x),i.y>h&&(s.y=Math.floor(h/nt.y),i.y=s.y*nt.y,$.mapSize.y=s.y)),$.map===null||H===!0||P===!0){const Mt=this.type!==Dn?{minFilter:nn,magFilter:nn}:{};$.map!==null&&$.map.dispose(),$.map=new Si(i.x,i.y,Mt),$.map.texture.name=K.name+".shadowMap",$.camera.updateProjectionMatrix()}r.setRenderTarget($.map),r.clear();const dt=$.getViewportCount();for(let Mt=0;Mt<dt;Mt++){const kt=$.getViewport(Mt);a.set(s.x*kt.x,s.y*kt.y,s.x*kt.z,s.y*kt.w),X.viewport(a),$.updateMatrices(K,Mt),n=$.getFrustum(),M(T,C,$.camera,K,this.type)}$.isPointLightShadow!==!0&&this.type===Dn&&_($,C),$.needsUpdate=!1}p=this.type,m.needsUpdate=!1,r.setRenderTarget(w,b,k)};function _(A,T){const C=t.update(x);d.defines.VSM_SAMPLES!==A.blurSamples&&(d.defines.VSM_SAMPLES=A.blurSamples,f.defines.VSM_SAMPLES=A.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),A.mapPass===null&&(A.mapPass=new Si(i.x,i.y)),d.uniforms.shadow_pass.value=A.map.texture,d.uniforms.resolution.value=A.mapSize,d.uniforms.radius.value=A.radius,r.setRenderTarget(A.mapPass),r.clear(),r.renderBufferDirect(T,null,C,d,x,null),f.uniforms.shadow_pass.value=A.mapPass.texture,f.uniforms.resolution.value=A.mapSize,f.uniforms.radius.value=A.radius,r.setRenderTarget(A.map),r.clear(),r.renderBufferDirect(T,null,C,f,x,null)}function y(A,T,C,w){let b=null;const k=C.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(k!==void 0)b=k;else if(b=C.isPointLight===!0?l:o,r.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){const X=b.uuid,H=T.uuid;let P=c[X];P===void 0&&(P={},c[X]=P);let O=P[H];O===void 0&&(O=b.clone(),P[H]=O,T.addEventListener("dispose",z)),b=O}if(b.visible=T.visible,b.wireframe=T.wireframe,w===Dn?b.side=T.shadowSide!==null?T.shadowSide:T.side:b.side=T.shadowSide!==null?T.shadowSide:u[T.side],b.alphaMap=T.alphaMap,b.alphaTest=T.alphaTest,b.map=T.map,b.clipShadows=T.clipShadows,b.clippingPlanes=T.clippingPlanes,b.clipIntersection=T.clipIntersection,b.displacementMap=T.displacementMap,b.displacementScale=T.displacementScale,b.displacementBias=T.displacementBias,b.wireframeLinewidth=T.wireframeLinewidth,b.linewidth=T.linewidth,C.isPointLight===!0&&b.isMeshDistanceMaterial===!0){const X=r.properties.get(b);X.light=C}return b}function M(A,T,C,w,b){if(A.visible===!1)return;if(A.layers.test(T.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&b===Dn)&&(!A.frustumCulled||n.intersectsObject(A))){A.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,A.matrixWorld);const H=t.update(A),P=A.material;if(Array.isArray(P)){const O=H.groups;for(let V=0,K=O.length;V<K;V++){const $=O[V],nt=P[$.materialIndex];if(nt&&nt.visible){const dt=y(A,nt,w,b);A.onBeforeShadow(r,A,T,C,H,dt,$),r.renderBufferDirect(C,null,H,dt,A,$),A.onAfterShadow(r,A,T,C,H,dt,$)}}}else if(P.visible){const O=y(A,P,w,b);A.onBeforeShadow(r,A,T,C,H,O,null),r.renderBufferDirect(C,null,H,O,A,null),A.onAfterShadow(r,A,T,C,H,O,null)}}const X=A.children;for(let H=0,P=X.length;H<P;H++)M(X[H],T,C,w,b)}function z(A){A.target.removeEventListener("dispose",z);for(const C in c){const w=c[C],b=A.target.uuid;b in w&&(w[b].dispose(),delete w[b])}}}const wg={[Ua]:Na,[Fa]:Ha,[Oa]:Ga,[Ki]:Ba,[Na]:Ua,[Ha]:Fa,[Ga]:Oa,[Ba]:Ki};function Eg(r,t){function e(){let L=!1;const ht=new be;let j=null;const Q=new be(0,0,0,0);return{setMask:function(mt){j!==mt&&!L&&(r.colorMask(mt,mt,mt,mt),j=mt)},setLocked:function(mt){L=mt},setClear:function(mt,ft,Nt,ye,Ue){Ue===!0&&(mt*=ye,ft*=ye,Nt*=ye),ht.set(mt,ft,Nt,ye),Q.equals(ht)===!1&&(r.clearColor(mt,ft,Nt,ye),Q.copy(ht))},reset:function(){L=!1,j=null,Q.set(-1,0,0,0)}}}function n(){let L=!1,ht=!1,j=null,Q=null,mt=null;return{setReversed:function(ft){if(ht!==ft){const Nt=t.get("EXT_clip_control");ht?Nt.clipControlEXT(Nt.LOWER_LEFT_EXT,Nt.ZERO_TO_ONE_EXT):Nt.clipControlEXT(Nt.LOWER_LEFT_EXT,Nt.NEGATIVE_ONE_TO_ONE_EXT);const ye=mt;mt=null,this.setClear(ye)}ht=ft},getReversed:function(){return ht},setTest:function(ft){ft?at(r.DEPTH_TEST):Rt(r.DEPTH_TEST)},setMask:function(ft){j!==ft&&!L&&(r.depthMask(ft),j=ft)},setFunc:function(ft){if(ht&&(ft=wg[ft]),Q!==ft){switch(ft){case Ua:r.depthFunc(r.NEVER);break;case Na:r.depthFunc(r.ALWAYS);break;case Fa:r.depthFunc(r.LESS);break;case Ki:r.depthFunc(r.LEQUAL);break;case Oa:r.depthFunc(r.EQUAL);break;case Ba:r.depthFunc(r.GEQUAL);break;case Ha:r.depthFunc(r.GREATER);break;case Ga:r.depthFunc(r.NOTEQUAL);break;default:r.depthFunc(r.LEQUAL)}Q=ft}},setLocked:function(ft){L=ft},setClear:function(ft){mt!==ft&&(ht&&(ft=1-ft),r.clearDepth(ft),mt=ft)},reset:function(){L=!1,j=null,Q=null,mt=null,ht=!1}}}function i(){let L=!1,ht=null,j=null,Q=null,mt=null,ft=null,Nt=null,ye=null,Ue=null;return{setTest:function(oe){L||(oe?at(r.STENCIL_TEST):Rt(r.STENCIL_TEST))},setMask:function(oe){ht!==oe&&!L&&(r.stencilMask(oe),ht=oe)},setFunc:function(oe,cn,An){(j!==oe||Q!==cn||mt!==An)&&(r.stencilFunc(oe,cn,An),j=oe,Q=cn,mt=An)},setOp:function(oe,cn,An){(ft!==oe||Nt!==cn||ye!==An)&&(r.stencilOp(oe,cn,An),ft=oe,Nt=cn,ye=An)},setLocked:function(oe){L=oe},setClear:function(oe){Ue!==oe&&(r.clearStencil(oe),Ue=oe)},reset:function(){L=!1,ht=null,j=null,Q=null,mt=null,ft=null,Nt=null,ye=null,Ue=null}}}const s=new e,a=new n,o=new i,l=new WeakMap,c=new WeakMap;let h={},u={},d=new WeakMap,f=[],g=null,x=!1,m=null,p=null,_=null,y=null,M=null,z=null,A=null,T=new Pt(0,0,0),C=0,w=!1,b=null,k=null,X=null,H=null,P=null;const O=r.getParameter(r.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let V=!1,K=0;const $=r.getParameter(r.VERSION);$.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec($)[1]),V=K>=1):$.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec($)[1]),V=K>=2);let nt=null,dt={};const Mt=r.getParameter(r.SCISSOR_BOX),kt=r.getParameter(r.VIEWPORT),qt=new be().fromArray(Mt),Y=new be().fromArray(kt);function it(L,ht,j,Q){const mt=new Uint8Array(4),ft=r.createTexture();r.bindTexture(L,ft),r.texParameteri(L,r.TEXTURE_MIN_FILTER,r.NEAREST),r.texParameteri(L,r.TEXTURE_MAG_FILTER,r.NEAREST);for(let Nt=0;Nt<j;Nt++)L===r.TEXTURE_3D||L===r.TEXTURE_2D_ARRAY?r.texImage3D(ht,0,r.RGBA,1,1,Q,0,r.RGBA,r.UNSIGNED_BYTE,mt):r.texImage2D(ht+Nt,0,r.RGBA,1,1,0,r.RGBA,r.UNSIGNED_BYTE,mt);return ft}const yt={};yt[r.TEXTURE_2D]=it(r.TEXTURE_2D,r.TEXTURE_2D,1),yt[r.TEXTURE_CUBE_MAP]=it(r.TEXTURE_CUBE_MAP,r.TEXTURE_CUBE_MAP_POSITIVE_X,6),yt[r.TEXTURE_2D_ARRAY]=it(r.TEXTURE_2D_ARRAY,r.TEXTURE_2D_ARRAY,1,1),yt[r.TEXTURE_3D]=it(r.TEXTURE_3D,r.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),at(r.DEPTH_TEST),a.setFunc(Ki),Vt(!1),Wt(xl),at(r.CULL_FACE),N(ni);function at(L){h[L]!==!0&&(r.enable(L),h[L]=!0)}function Rt(L){h[L]!==!1&&(r.disable(L),h[L]=!1)}function It(L,ht){return u[L]!==ht?(r.bindFramebuffer(L,ht),u[L]=ht,L===r.DRAW_FRAMEBUFFER&&(u[r.FRAMEBUFFER]=ht),L===r.FRAMEBUFFER&&(u[r.DRAW_FRAMEBUFFER]=ht),!0):!1}function Gt(L,ht){let j=f,Q=!1;if(L){j=d.get(ht),j===void 0&&(j=[],d.set(ht,j));const mt=L.textures;if(j.length!==mt.length||j[0]!==r.COLOR_ATTACHMENT0){for(let ft=0,Nt=mt.length;ft<Nt;ft++)j[ft]=r.COLOR_ATTACHMENT0+ft;j.length=mt.length,Q=!0}}else j[0]!==r.BACK&&(j[0]=r.BACK,Q=!0);Q&&r.drawBuffers(j)}function ve(L){return g!==L?(r.useProgram(L),g=L,!0):!1}const jt={[xi]:r.FUNC_ADD,[Gd]:r.FUNC_SUBTRACT,[Vd]:r.FUNC_REVERSE_SUBTRACT};jt[Wd]=r.MIN,jt[Xd]=r.MAX;const Se={[$d]:r.ZERO,[qd]:r.ONE,[jd]:r.SRC_COLOR,[La]:r.SRC_ALPHA,[tu]:r.SRC_ALPHA_SATURATE,[Zd]:r.DST_COLOR,[Kd]:r.DST_ALPHA,[Yd]:r.ONE_MINUS_SRC_COLOR,[Da]:r.ONE_MINUS_SRC_ALPHA,[Qd]:r.ONE_MINUS_DST_COLOR,[Jd]:r.ONE_MINUS_DST_ALPHA,[eu]:r.CONSTANT_COLOR,[nu]:r.ONE_MINUS_CONSTANT_COLOR,[iu]:r.CONSTANT_ALPHA,[su]:r.ONE_MINUS_CONSTANT_ALPHA};function N(L,ht,j,Q,mt,ft,Nt,ye,Ue,oe){if(L===ni){x===!0&&(Rt(r.BLEND),x=!1);return}if(x===!1&&(at(r.BLEND),x=!0),L!==Hd){if(L!==m||oe!==w){if((p!==xi||M!==xi)&&(r.blendEquation(r.FUNC_ADD),p=xi,M=xi),oe)switch(L){case qi:r.blendFuncSeparate(r.ONE,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Mi:r.blendFunc(r.ONE,r.ONE);break;case vl:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case _l:r.blendFuncSeparate(r.ZERO,r.SRC_COLOR,r.ZERO,r.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}else switch(L){case qi:r.blendFuncSeparate(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA,r.ONE,r.ONE_MINUS_SRC_ALPHA);break;case Mi:r.blendFunc(r.SRC_ALPHA,r.ONE);break;case vl:r.blendFuncSeparate(r.ZERO,r.ONE_MINUS_SRC_COLOR,r.ZERO,r.ONE);break;case _l:r.blendFunc(r.ZERO,r.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",L);break}_=null,y=null,z=null,A=null,T.set(0,0,0),C=0,m=L,w=oe}return}mt=mt||ht,ft=ft||j,Nt=Nt||Q,(ht!==p||mt!==M)&&(r.blendEquationSeparate(jt[ht],jt[mt]),p=ht,M=mt),(j!==_||Q!==y||ft!==z||Nt!==A)&&(r.blendFuncSeparate(Se[j],Se[Q],Se[ft],Se[Nt]),_=j,y=Q,z=ft,A=Nt),(ye.equals(T)===!1||Ue!==C)&&(r.blendColor(ye.r,ye.g,ye.b,Ue),T.copy(ye),C=Ue),m=L,w=!1}function rn(L,ht){L.side===en?Rt(r.CULL_FACE):at(r.CULL_FACE);let j=L.side===je;ht&&(j=!j),Vt(j),L.blending===qi&&L.transparent===!1?N(ni):N(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),a.setFunc(L.depthFunc),a.setTest(L.depthTest),a.setMask(L.depthWrite),s.setMask(L.colorWrite);const Q=L.stencilWrite;o.setTest(Q),Q&&(o.setMask(L.stencilWriteMask),o.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),o.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),ue(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?at(r.SAMPLE_ALPHA_TO_COVERAGE):Rt(r.SAMPLE_ALPHA_TO_COVERAGE)}function Vt(L){b!==L&&(L?r.frontFace(r.CW):r.frontFace(r.CCW),b=L)}function Wt(L){L!==Od?(at(r.CULL_FACE),L!==k&&(L===xl?r.cullFace(r.BACK):L===Bd?r.cullFace(r.FRONT):r.cullFace(r.FRONT_AND_BACK))):Rt(r.CULL_FACE),k=L}function Ct(L){L!==X&&(V&&r.lineWidth(L),X=L)}function ue(L,ht,j){L?(at(r.POLYGON_OFFSET_FILL),(H!==ht||P!==j)&&(r.polygonOffset(ht,j),H=ht,P=j)):Rt(r.POLYGON_OFFSET_FILL)}function At(L){L?at(r.SCISSOR_TEST):Rt(r.SCISSOR_TEST)}function R(L){L===void 0&&(L=r.TEXTURE0+O-1),nt!==L&&(r.activeTexture(L),nt=L)}function S(L,ht,j){j===void 0&&(nt===null?j=r.TEXTURE0+O-1:j=nt);let Q=dt[j];Q===void 0&&(Q={type:void 0,texture:void 0},dt[j]=Q),(Q.type!==L||Q.texture!==ht)&&(nt!==j&&(r.activeTexture(j),nt=j),r.bindTexture(L,ht||yt[L]),Q.type=L,Q.texture=ht)}function B(){const L=dt[nt];L!==void 0&&L.type!==void 0&&(r.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function Z(){try{r.compressedTexImage2D.apply(r,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function tt(){try{r.compressedTexImage3D.apply(r,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function J(){try{r.texSubImage2D.apply(r,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Et(){try{r.texSubImage3D.apply(r,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function ut(){try{r.compressedTexSubImage2D.apply(r,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function xt(){try{r.compressedTexSubImage3D.apply(r,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Yt(){try{r.texStorage2D.apply(r,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function st(){try{r.texStorage3D.apply(r,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function vt(){try{r.texImage2D.apply(r,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function zt(){try{r.texImage3D.apply(r,arguments)}catch(L){console.error("THREE.WebGLState:",L)}}function Lt(L){qt.equals(L)===!1&&(r.scissor(L.x,L.y,L.z,L.w),qt.copy(L))}function _t(L){Y.equals(L)===!1&&(r.viewport(L.x,L.y,L.z,L.w),Y.copy(L))}function Xt(L,ht){let j=c.get(ht);j===void 0&&(j=new WeakMap,c.set(ht,j));let Q=j.get(L);Q===void 0&&(Q=r.getUniformBlockIndex(ht,L.name),j.set(L,Q))}function Bt(L,ht){const Q=c.get(ht).get(L);l.get(ht)!==Q&&(r.uniformBlockBinding(ht,Q,L.__bindingPointIndex),l.set(ht,Q))}function he(){r.disable(r.BLEND),r.disable(r.CULL_FACE),r.disable(r.DEPTH_TEST),r.disable(r.POLYGON_OFFSET_FILL),r.disable(r.SCISSOR_TEST),r.disable(r.STENCIL_TEST),r.disable(r.SAMPLE_ALPHA_TO_COVERAGE),r.blendEquation(r.FUNC_ADD),r.blendFunc(r.ONE,r.ZERO),r.blendFuncSeparate(r.ONE,r.ZERO,r.ONE,r.ZERO),r.blendColor(0,0,0,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(r.LESS),a.setReversed(!1),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(r.ALWAYS,0,4294967295),r.stencilOp(r.KEEP,r.KEEP,r.KEEP),r.clearStencil(0),r.cullFace(r.BACK),r.frontFace(r.CCW),r.polygonOffset(0,0),r.activeTexture(r.TEXTURE0),r.bindFramebuffer(r.FRAMEBUFFER,null),r.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),r.bindFramebuffer(r.READ_FRAMEBUFFER,null),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),h={},nt=null,dt={},u={},d=new WeakMap,f=[],g=null,x=!1,m=null,p=null,_=null,y=null,M=null,z=null,A=null,T=new Pt(0,0,0),C=0,w=!1,b=null,k=null,X=null,H=null,P=null,qt.set(0,0,r.canvas.width,r.canvas.height),Y.set(0,0,r.canvas.width,r.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:at,disable:Rt,bindFramebuffer:It,drawBuffers:Gt,useProgram:ve,setBlending:N,setMaterial:rn,setFlipSided:Vt,setCullFace:Wt,setLineWidth:Ct,setPolygonOffset:ue,setScissorTest:At,activeTexture:R,bindTexture:S,unbindTexture:B,compressedTexImage2D:Z,compressedTexImage3D:tt,texImage2D:vt,texImage3D:zt,updateUBOMapping:Xt,uniformBlockBinding:Bt,texStorage2D:Yt,texStorage3D:st,texSubImage2D:J,texSubImage3D:Et,compressedTexSubImage2D:ut,compressedTexSubImage3D:xt,scissor:Lt,viewport:_t,reset:he}}function fc(r,t,e,n){const i=Tg(n);switch(e){case Zc:return r*t;case th:return r*t;case eh:return r*t*2;case Do:return r*t/i.components*i.byteLength;case Uo:return r*t/i.components*i.byteLength;case nh:return r*t*2/i.components*i.byteLength;case No:return r*t*2/i.components*i.byteLength;case Qc:return r*t*3/i.components*i.byteLength;case vn:return r*t*4/i.components*i.byteLength;case Fo:return r*t*4/i.components*i.byteLength;case gr:case xr:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case vr:case _r:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case ja:case Ka:return Math.max(r,16)*Math.max(t,8)/4;case qa:case Ya:return Math.max(r,8)*Math.max(t,8)/2;case Ja:case Za:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*8;case Qa:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case to:return Math.floor((r+3)/4)*Math.floor((t+3)/4)*16;case eo:return Math.floor((r+4)/5)*Math.floor((t+3)/4)*16;case no:return Math.floor((r+4)/5)*Math.floor((t+4)/5)*16;case io:return Math.floor((r+5)/6)*Math.floor((t+4)/5)*16;case so:return Math.floor((r+5)/6)*Math.floor((t+5)/6)*16;case ro:return Math.floor((r+7)/8)*Math.floor((t+4)/5)*16;case ao:return Math.floor((r+7)/8)*Math.floor((t+5)/6)*16;case oo:return Math.floor((r+7)/8)*Math.floor((t+7)/8)*16;case lo:return Math.floor((r+9)/10)*Math.floor((t+4)/5)*16;case co:return Math.floor((r+9)/10)*Math.floor((t+5)/6)*16;case ho:return Math.floor((r+9)/10)*Math.floor((t+7)/8)*16;case uo:return Math.floor((r+9)/10)*Math.floor((t+9)/10)*16;case fo:return Math.floor((r+11)/12)*Math.floor((t+9)/10)*16;case po:return Math.floor((r+11)/12)*Math.floor((t+11)/12)*16;case yr:case mo:case go:return Math.ceil(r/4)*Math.ceil(t/4)*16;case ih:case xo:return Math.ceil(r/4)*Math.ceil(t/4)*8;case vo:case _o:return Math.ceil(r/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function Tg(r){switch(r){case Gn:case Yc:return{byteLength:1,components:1};case zs:case Kc:case Is:return{byteLength:2,components:1};case Io:case Lo:return{byteLength:2,components:4};case bi:case ko:case wn:return{byteLength:4,components:1};case Jc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${r}.`)}function Ag(r,t,e,n,i,s,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new gt,h=new WeakMap;let u;const d=new WeakMap;let f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(R,S){return f?new OffscreenCanvas(R,S):Tr("canvas")}function x(R,S,B){let Z=1;const tt=At(R);if((tt.width>B||tt.height>B)&&(Z=B/Math.max(tt.width,tt.height)),Z<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){const J=Math.floor(Z*tt.width),Et=Math.floor(Z*tt.height);u===void 0&&(u=g(J,Et));const ut=S?g(J,Et):u;return ut.width=J,ut.height=Et,ut.getContext("2d").drawImage(R,0,0,J,Et),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+tt.width+"x"+tt.height+") to ("+J+"x"+Et+")."),ut}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+tt.width+"x"+tt.height+")."),R;return R}function m(R){return R.generateMipmaps}function p(R){r.generateMipmap(R)}function _(R){return R.isWebGLCubeRenderTarget?r.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?r.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?r.TEXTURE_2D_ARRAY:r.TEXTURE_2D}function y(R,S,B,Z,tt=!1){if(R!==null){if(r[R]!==void 0)return r[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let J=S;if(S===r.RED&&(B===r.FLOAT&&(J=r.R32F),B===r.HALF_FLOAT&&(J=r.R16F),B===r.UNSIGNED_BYTE&&(J=r.R8)),S===r.RED_INTEGER&&(B===r.UNSIGNED_BYTE&&(J=r.R8UI),B===r.UNSIGNED_SHORT&&(J=r.R16UI),B===r.UNSIGNED_INT&&(J=r.R32UI),B===r.BYTE&&(J=r.R8I),B===r.SHORT&&(J=r.R16I),B===r.INT&&(J=r.R32I)),S===r.RG&&(B===r.FLOAT&&(J=r.RG32F),B===r.HALF_FLOAT&&(J=r.RG16F),B===r.UNSIGNED_BYTE&&(J=r.RG8)),S===r.RG_INTEGER&&(B===r.UNSIGNED_BYTE&&(J=r.RG8UI),B===r.UNSIGNED_SHORT&&(J=r.RG16UI),B===r.UNSIGNED_INT&&(J=r.RG32UI),B===r.BYTE&&(J=r.RG8I),B===r.SHORT&&(J=r.RG16I),B===r.INT&&(J=r.RG32I)),S===r.RGB_INTEGER&&(B===r.UNSIGNED_BYTE&&(J=r.RGB8UI),B===r.UNSIGNED_SHORT&&(J=r.RGB16UI),B===r.UNSIGNED_INT&&(J=r.RGB32UI),B===r.BYTE&&(J=r.RGB8I),B===r.SHORT&&(J=r.RGB16I),B===r.INT&&(J=r.RGB32I)),S===r.RGBA_INTEGER&&(B===r.UNSIGNED_BYTE&&(J=r.RGBA8UI),B===r.UNSIGNED_SHORT&&(J=r.RGBA16UI),B===r.UNSIGNED_INT&&(J=r.RGBA32UI),B===r.BYTE&&(J=r.RGBA8I),B===r.SHORT&&(J=r.RGBA16I),B===r.INT&&(J=r.RGBA32I)),S===r.RGB&&B===r.UNSIGNED_INT_5_9_9_9_REV&&(J=r.RGB9_E5),S===r.RGBA){const Et=tt?kr:Kt.getTransfer(Z);B===r.FLOAT&&(J=r.RGBA32F),B===r.HALF_FLOAT&&(J=r.RGBA16F),B===r.UNSIGNED_BYTE&&(J=Et===le?r.SRGB8_ALPHA8:r.RGBA8),B===r.UNSIGNED_SHORT_4_4_4_4&&(J=r.RGBA4),B===r.UNSIGNED_SHORT_5_5_5_1&&(J=r.RGB5_A1)}return(J===r.R16F||J===r.R32F||J===r.RG16F||J===r.RG32F||J===r.RGBA16F||J===r.RGBA32F)&&t.get("EXT_color_buffer_float"),J}function M(R,S){let B;return R?S===null||S===bi||S===Qi?B=r.DEPTH24_STENCIL8:S===wn?B=r.DEPTH32F_STENCIL8:S===zs&&(B=r.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===bi||S===Qi?B=r.DEPTH_COMPONENT24:S===wn?B=r.DEPTH_COMPONENT32F:S===zs&&(B=r.DEPTH_COMPONENT16),B}function z(R,S){return m(R)===!0||R.isFramebufferTexture&&R.minFilter!==nn&&R.minFilter!==xn?Math.log2(Math.max(S.width,S.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?S.mipmaps.length:1}function A(R){const S=R.target;S.removeEventListener("dispose",A),C(S),S.isVideoTexture&&h.delete(S)}function T(R){const S=R.target;S.removeEventListener("dispose",T),b(S)}function C(R){const S=n.get(R);if(S.__webglInit===void 0)return;const B=R.source,Z=d.get(B);if(Z){const tt=Z[S.__cacheKey];tt.usedTimes--,tt.usedTimes===0&&w(R),Object.keys(Z).length===0&&d.delete(B)}n.remove(R)}function w(R){const S=n.get(R);r.deleteTexture(S.__webglTexture);const B=R.source,Z=d.get(B);delete Z[S.__cacheKey],a.memory.textures--}function b(R){const S=n.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),n.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let Z=0;Z<6;Z++){if(Array.isArray(S.__webglFramebuffer[Z]))for(let tt=0;tt<S.__webglFramebuffer[Z].length;tt++)r.deleteFramebuffer(S.__webglFramebuffer[Z][tt]);else r.deleteFramebuffer(S.__webglFramebuffer[Z]);S.__webglDepthbuffer&&r.deleteRenderbuffer(S.__webglDepthbuffer[Z])}else{if(Array.isArray(S.__webglFramebuffer))for(let Z=0;Z<S.__webglFramebuffer.length;Z++)r.deleteFramebuffer(S.__webglFramebuffer[Z]);else r.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&r.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&r.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let Z=0;Z<S.__webglColorRenderbuffer.length;Z++)S.__webglColorRenderbuffer[Z]&&r.deleteRenderbuffer(S.__webglColorRenderbuffer[Z]);S.__webglDepthRenderbuffer&&r.deleteRenderbuffer(S.__webglDepthRenderbuffer)}const B=R.textures;for(let Z=0,tt=B.length;Z<tt;Z++){const J=n.get(B[Z]);J.__webglTexture&&(r.deleteTexture(J.__webglTexture),a.memory.textures--),n.remove(B[Z])}n.remove(R)}let k=0;function X(){k=0}function H(){const R=k;return R>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+i.maxTextures),k+=1,R}function P(R){const S=[];return S.push(R.wrapS),S.push(R.wrapT),S.push(R.wrapR||0),S.push(R.magFilter),S.push(R.minFilter),S.push(R.anisotropy),S.push(R.internalFormat),S.push(R.format),S.push(R.type),S.push(R.generateMipmaps),S.push(R.premultiplyAlpha),S.push(R.flipY),S.push(R.unpackAlignment),S.push(R.colorSpace),S.join()}function O(R,S){const B=n.get(R);if(R.isVideoTexture&&Ct(R),R.isRenderTargetTexture===!1&&R.version>0&&B.__version!==R.version){const Z=R.image;if(Z===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Z.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{Y(B,R,S);return}}e.bindTexture(r.TEXTURE_2D,B.__webglTexture,r.TEXTURE0+S)}function V(R,S){const B=n.get(R);if(R.version>0&&B.__version!==R.version){Y(B,R,S);return}e.bindTexture(r.TEXTURE_2D_ARRAY,B.__webglTexture,r.TEXTURE0+S)}function K(R,S){const B=n.get(R);if(R.version>0&&B.__version!==R.version){Y(B,R,S);return}e.bindTexture(r.TEXTURE_3D,B.__webglTexture,r.TEXTURE0+S)}function $(R,S){const B=n.get(R);if(R.version>0&&B.__version!==R.version){it(B,R,S);return}e.bindTexture(r.TEXTURE_CUBE_MAP,B.__webglTexture,r.TEXTURE0+S)}const nt={[Xa]:r.REPEAT,[_i]:r.CLAMP_TO_EDGE,[$a]:r.MIRRORED_REPEAT},dt={[nn]:r.NEAREST,[fu]:r.NEAREST_MIPMAP_NEAREST,[Fs]:r.NEAREST_MIPMAP_LINEAR,[xn]:r.LINEAR,[qr]:r.LINEAR_MIPMAP_NEAREST,[yi]:r.LINEAR_MIPMAP_LINEAR},Mt={[xu]:r.NEVER,[Su]:r.ALWAYS,[vu]:r.LESS,[rh]:r.LEQUAL,[_u]:r.EQUAL,[bu]:r.GEQUAL,[yu]:r.GREATER,[Mu]:r.NOTEQUAL};function kt(R,S){if(S.type===wn&&t.has("OES_texture_float_linear")===!1&&(S.magFilter===xn||S.magFilter===qr||S.magFilter===Fs||S.magFilter===yi||S.minFilter===xn||S.minFilter===qr||S.minFilter===Fs||S.minFilter===yi)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),r.texParameteri(R,r.TEXTURE_WRAP_S,nt[S.wrapS]),r.texParameteri(R,r.TEXTURE_WRAP_T,nt[S.wrapT]),(R===r.TEXTURE_3D||R===r.TEXTURE_2D_ARRAY)&&r.texParameteri(R,r.TEXTURE_WRAP_R,nt[S.wrapR]),r.texParameteri(R,r.TEXTURE_MAG_FILTER,dt[S.magFilter]),r.texParameteri(R,r.TEXTURE_MIN_FILTER,dt[S.minFilter]),S.compareFunction&&(r.texParameteri(R,r.TEXTURE_COMPARE_MODE,r.COMPARE_REF_TO_TEXTURE),r.texParameteri(R,r.TEXTURE_COMPARE_FUNC,Mt[S.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===nn||S.minFilter!==Fs&&S.minFilter!==yi||S.type===wn&&t.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||n.get(S).__currentAnisotropy){const B=t.get("EXT_texture_filter_anisotropic");r.texParameterf(R,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,i.getMaxAnisotropy())),n.get(S).__currentAnisotropy=S.anisotropy}}}function qt(R,S){let B=!1;R.__webglInit===void 0&&(R.__webglInit=!0,S.addEventListener("dispose",A));const Z=S.source;let tt=d.get(Z);tt===void 0&&(tt={},d.set(Z,tt));const J=P(S);if(J!==R.__cacheKey){tt[J]===void 0&&(tt[J]={texture:r.createTexture(),usedTimes:0},a.memory.textures++,B=!0),tt[J].usedTimes++;const Et=tt[R.__cacheKey];Et!==void 0&&(tt[R.__cacheKey].usedTimes--,Et.usedTimes===0&&w(S)),R.__cacheKey=J,R.__webglTexture=tt[J].texture}return B}function Y(R,S,B){let Z=r.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(Z=r.TEXTURE_2D_ARRAY),S.isData3DTexture&&(Z=r.TEXTURE_3D);const tt=qt(R,S),J=S.source;e.bindTexture(Z,R.__webglTexture,r.TEXTURE0+B);const Et=n.get(J);if(J.version!==Et.__version||tt===!0){e.activeTexture(r.TEXTURE0+B);const ut=Kt.getPrimaries(Kt.workingColorSpace),xt=S.colorSpace===ei?null:Kt.getPrimaries(S.colorSpace),Yt=S.colorSpace===ei||ut===xt?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,S.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,S.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,Yt);let st=x(S.image,!1,i.maxTextureSize);st=ue(S,st);const vt=s.convert(S.format,S.colorSpace),zt=s.convert(S.type);let Lt=y(S.internalFormat,vt,zt,S.colorSpace,S.isVideoTexture);kt(Z,S);let _t;const Xt=S.mipmaps,Bt=S.isVideoTexture!==!0,he=Et.__version===void 0||tt===!0,L=J.dataReady,ht=z(S,st);if(S.isDepthTexture)Lt=M(S.format===ts,S.type),he&&(Bt?e.texStorage2D(r.TEXTURE_2D,1,Lt,st.width,st.height):e.texImage2D(r.TEXTURE_2D,0,Lt,st.width,st.height,0,vt,zt,null));else if(S.isDataTexture)if(Xt.length>0){Bt&&he&&e.texStorage2D(r.TEXTURE_2D,ht,Lt,Xt[0].width,Xt[0].height);for(let j=0,Q=Xt.length;j<Q;j++)_t=Xt[j],Bt?L&&e.texSubImage2D(r.TEXTURE_2D,j,0,0,_t.width,_t.height,vt,zt,_t.data):e.texImage2D(r.TEXTURE_2D,j,Lt,_t.width,_t.height,0,vt,zt,_t.data);S.generateMipmaps=!1}else Bt?(he&&e.texStorage2D(r.TEXTURE_2D,ht,Lt,st.width,st.height),L&&e.texSubImage2D(r.TEXTURE_2D,0,0,0,st.width,st.height,vt,zt,st.data)):e.texImage2D(r.TEXTURE_2D,0,Lt,st.width,st.height,0,vt,zt,st.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){Bt&&he&&e.texStorage3D(r.TEXTURE_2D_ARRAY,ht,Lt,Xt[0].width,Xt[0].height,st.depth);for(let j=0,Q=Xt.length;j<Q;j++)if(_t=Xt[j],S.format!==vn)if(vt!==null)if(Bt){if(L)if(S.layerUpdates.size>0){const mt=fc(_t.width,_t.height,S.format,S.type);for(const ft of S.layerUpdates){const Nt=_t.data.subarray(ft*mt/_t.data.BYTES_PER_ELEMENT,(ft+1)*mt/_t.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,j,0,0,ft,_t.width,_t.height,1,vt,Nt)}S.clearLayerUpdates()}else e.compressedTexSubImage3D(r.TEXTURE_2D_ARRAY,j,0,0,0,_t.width,_t.height,st.depth,vt,_t.data)}else e.compressedTexImage3D(r.TEXTURE_2D_ARRAY,j,Lt,_t.width,_t.height,st.depth,0,_t.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Bt?L&&e.texSubImage3D(r.TEXTURE_2D_ARRAY,j,0,0,0,_t.width,_t.height,st.depth,vt,zt,_t.data):e.texImage3D(r.TEXTURE_2D_ARRAY,j,Lt,_t.width,_t.height,st.depth,0,vt,zt,_t.data)}else{Bt&&he&&e.texStorage2D(r.TEXTURE_2D,ht,Lt,Xt[0].width,Xt[0].height);for(let j=0,Q=Xt.length;j<Q;j++)_t=Xt[j],S.format!==vn?vt!==null?Bt?L&&e.compressedTexSubImage2D(r.TEXTURE_2D,j,0,0,_t.width,_t.height,vt,_t.data):e.compressedTexImage2D(r.TEXTURE_2D,j,Lt,_t.width,_t.height,0,_t.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Bt?L&&e.texSubImage2D(r.TEXTURE_2D,j,0,0,_t.width,_t.height,vt,zt,_t.data):e.texImage2D(r.TEXTURE_2D,j,Lt,_t.width,_t.height,0,vt,zt,_t.data)}else if(S.isDataArrayTexture)if(Bt){if(he&&e.texStorage3D(r.TEXTURE_2D_ARRAY,ht,Lt,st.width,st.height,st.depth),L)if(S.layerUpdates.size>0){const j=fc(st.width,st.height,S.format,S.type);for(const Q of S.layerUpdates){const mt=st.data.subarray(Q*j/st.data.BYTES_PER_ELEMENT,(Q+1)*j/st.data.BYTES_PER_ELEMENT);e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,Q,st.width,st.height,1,vt,zt,mt)}S.clearLayerUpdates()}else e.texSubImage3D(r.TEXTURE_2D_ARRAY,0,0,0,0,st.width,st.height,st.depth,vt,zt,st.data)}else e.texImage3D(r.TEXTURE_2D_ARRAY,0,Lt,st.width,st.height,st.depth,0,vt,zt,st.data);else if(S.isData3DTexture)Bt?(he&&e.texStorage3D(r.TEXTURE_3D,ht,Lt,st.width,st.height,st.depth),L&&e.texSubImage3D(r.TEXTURE_3D,0,0,0,0,st.width,st.height,st.depth,vt,zt,st.data)):e.texImage3D(r.TEXTURE_3D,0,Lt,st.width,st.height,st.depth,0,vt,zt,st.data);else if(S.isFramebufferTexture){if(he)if(Bt)e.texStorage2D(r.TEXTURE_2D,ht,Lt,st.width,st.height);else{let j=st.width,Q=st.height;for(let mt=0;mt<ht;mt++)e.texImage2D(r.TEXTURE_2D,mt,Lt,j,Q,0,vt,zt,null),j>>=1,Q>>=1}}else if(Xt.length>0){if(Bt&&he){const j=At(Xt[0]);e.texStorage2D(r.TEXTURE_2D,ht,Lt,j.width,j.height)}for(let j=0,Q=Xt.length;j<Q;j++)_t=Xt[j],Bt?L&&e.texSubImage2D(r.TEXTURE_2D,j,0,0,vt,zt,_t):e.texImage2D(r.TEXTURE_2D,j,Lt,vt,zt,_t);S.generateMipmaps=!1}else if(Bt){if(he){const j=At(st);e.texStorage2D(r.TEXTURE_2D,ht,Lt,j.width,j.height)}L&&e.texSubImage2D(r.TEXTURE_2D,0,0,0,vt,zt,st)}else e.texImage2D(r.TEXTURE_2D,0,Lt,vt,zt,st);m(S)&&p(Z),Et.__version=J.version,S.onUpdate&&S.onUpdate(S)}R.__version=S.version}function it(R,S,B){if(S.image.length!==6)return;const Z=qt(R,S),tt=S.source;e.bindTexture(r.TEXTURE_CUBE_MAP,R.__webglTexture,r.TEXTURE0+B);const J=n.get(tt);if(tt.version!==J.__version||Z===!0){e.activeTexture(r.TEXTURE0+B);const Et=Kt.getPrimaries(Kt.workingColorSpace),ut=S.colorSpace===ei?null:Kt.getPrimaries(S.colorSpace),xt=S.colorSpace===ei||Et===ut?r.NONE:r.BROWSER_DEFAULT_WEBGL;r.pixelStorei(r.UNPACK_FLIP_Y_WEBGL,S.flipY),r.pixelStorei(r.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),r.pixelStorei(r.UNPACK_ALIGNMENT,S.unpackAlignment),r.pixelStorei(r.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt);const Yt=S.isCompressedTexture||S.image[0].isCompressedTexture,st=S.image[0]&&S.image[0].isDataTexture,vt=[];for(let Q=0;Q<6;Q++)!Yt&&!st?vt[Q]=x(S.image[Q],!0,i.maxCubemapSize):vt[Q]=st?S.image[Q].image:S.image[Q],vt[Q]=ue(S,vt[Q]);const zt=vt[0],Lt=s.convert(S.format,S.colorSpace),_t=s.convert(S.type),Xt=y(S.internalFormat,Lt,_t,S.colorSpace),Bt=S.isVideoTexture!==!0,he=J.__version===void 0||Z===!0,L=tt.dataReady;let ht=z(S,zt);kt(r.TEXTURE_CUBE_MAP,S);let j;if(Yt){Bt&&he&&e.texStorage2D(r.TEXTURE_CUBE_MAP,ht,Xt,zt.width,zt.height);for(let Q=0;Q<6;Q++){j=vt[Q].mipmaps;for(let mt=0;mt<j.length;mt++){const ft=j[mt];S.format!==vn?Lt!==null?Bt?L&&e.compressedTexSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt,0,0,ft.width,ft.height,Lt,ft.data):e.compressedTexImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt,Xt,ft.width,ft.height,0,ft.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Bt?L&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt,0,0,ft.width,ft.height,Lt,_t,ft.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt,Xt,ft.width,ft.height,0,Lt,_t,ft.data)}}}else{if(j=S.mipmaps,Bt&&he){j.length>0&&ht++;const Q=At(vt[0]);e.texStorage2D(r.TEXTURE_CUBE_MAP,ht,Xt,Q.width,Q.height)}for(let Q=0;Q<6;Q++)if(st){Bt?L&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,vt[Q].width,vt[Q].height,Lt,_t,vt[Q].data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,Xt,vt[Q].width,vt[Q].height,0,Lt,_t,vt[Q].data);for(let mt=0;mt<j.length;mt++){const Nt=j[mt].image[Q].image;Bt?L&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt+1,0,0,Nt.width,Nt.height,Lt,_t,Nt.data):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt+1,Xt,Nt.width,Nt.height,0,Lt,_t,Nt.data)}}else{Bt?L&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,Lt,_t,vt[Q]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,Xt,Lt,_t,vt[Q]);for(let mt=0;mt<j.length;mt++){const ft=j[mt];Bt?L&&e.texSubImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt+1,0,0,Lt,_t,ft.image[Q]):e.texImage2D(r.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt+1,Xt,Lt,_t,ft.image[Q])}}}m(S)&&p(r.TEXTURE_CUBE_MAP),J.__version=tt.version,S.onUpdate&&S.onUpdate(S)}R.__version=S.version}function yt(R,S,B,Z,tt,J){const Et=s.convert(B.format,B.colorSpace),ut=s.convert(B.type),xt=y(B.internalFormat,Et,ut,B.colorSpace),Yt=n.get(S),st=n.get(B);if(st.__renderTarget=S,!Yt.__hasExternalTextures){const vt=Math.max(1,S.width>>J),zt=Math.max(1,S.height>>J);tt===r.TEXTURE_3D||tt===r.TEXTURE_2D_ARRAY?e.texImage3D(tt,J,xt,vt,zt,S.depth,0,Et,ut,null):e.texImage2D(tt,J,xt,vt,zt,0,Et,ut,null)}e.bindFramebuffer(r.FRAMEBUFFER,R),Wt(S)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,Z,tt,st.__webglTexture,0,Vt(S)):(tt===r.TEXTURE_2D||tt>=r.TEXTURE_CUBE_MAP_POSITIVE_X&&tt<=r.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&r.framebufferTexture2D(r.FRAMEBUFFER,Z,tt,st.__webglTexture,J),e.bindFramebuffer(r.FRAMEBUFFER,null)}function at(R,S,B){if(r.bindRenderbuffer(r.RENDERBUFFER,R),S.depthBuffer){const Z=S.depthTexture,tt=Z&&Z.isDepthTexture?Z.type:null,J=M(S.stencilBuffer,tt),Et=S.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,ut=Vt(S);Wt(S)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,ut,J,S.width,S.height):B?r.renderbufferStorageMultisample(r.RENDERBUFFER,ut,J,S.width,S.height):r.renderbufferStorage(r.RENDERBUFFER,J,S.width,S.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,Et,r.RENDERBUFFER,R)}else{const Z=S.textures;for(let tt=0;tt<Z.length;tt++){const J=Z[tt],Et=s.convert(J.format,J.colorSpace),ut=s.convert(J.type),xt=y(J.internalFormat,Et,ut,J.colorSpace),Yt=Vt(S);B&&Wt(S)===!1?r.renderbufferStorageMultisample(r.RENDERBUFFER,Yt,xt,S.width,S.height):Wt(S)?o.renderbufferStorageMultisampleEXT(r.RENDERBUFFER,Yt,xt,S.width,S.height):r.renderbufferStorage(r.RENDERBUFFER,xt,S.width,S.height)}}r.bindRenderbuffer(r.RENDERBUFFER,null)}function Rt(R,S){if(S&&S.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(r.FRAMEBUFFER,R),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Z=n.get(S.depthTexture);Z.__renderTarget=S,(!Z.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),O(S.depthTexture,0);const tt=Z.__webglTexture,J=Vt(S);if(S.depthTexture.format===ji)Wt(S)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,tt,0,J):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.TEXTURE_2D,tt,0);else if(S.depthTexture.format===ts)Wt(S)?o.framebufferTexture2DMultisampleEXT(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,tt,0,J):r.framebufferTexture2D(r.FRAMEBUFFER,r.DEPTH_STENCIL_ATTACHMENT,r.TEXTURE_2D,tt,0);else throw new Error("Unknown depthTexture format")}function It(R){const S=n.get(R),B=R.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==R.depthTexture){const Z=R.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),Z){const tt=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,Z.removeEventListener("dispose",tt)};Z.addEventListener("dispose",tt),S.__depthDisposeCallback=tt}S.__boundDepthTexture=Z}if(R.depthTexture&&!S.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");Rt(S.__webglFramebuffer,R)}else if(B){S.__webglDepthbuffer=[];for(let Z=0;Z<6;Z++)if(e.bindFramebuffer(r.FRAMEBUFFER,S.__webglFramebuffer[Z]),S.__webglDepthbuffer[Z]===void 0)S.__webglDepthbuffer[Z]=r.createRenderbuffer(),at(S.__webglDepthbuffer[Z],R,!1);else{const tt=R.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,J=S.__webglDepthbuffer[Z];r.bindRenderbuffer(r.RENDERBUFFER,J),r.framebufferRenderbuffer(r.FRAMEBUFFER,tt,r.RENDERBUFFER,J)}}else if(e.bindFramebuffer(r.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=r.createRenderbuffer(),at(S.__webglDepthbuffer,R,!1);else{const Z=R.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,tt=S.__webglDepthbuffer;r.bindRenderbuffer(r.RENDERBUFFER,tt),r.framebufferRenderbuffer(r.FRAMEBUFFER,Z,r.RENDERBUFFER,tt)}e.bindFramebuffer(r.FRAMEBUFFER,null)}function Gt(R,S,B){const Z=n.get(R);S!==void 0&&yt(Z.__webglFramebuffer,R,R.texture,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,0),B!==void 0&&It(R)}function ve(R){const S=R.texture,B=n.get(R),Z=n.get(S);R.addEventListener("dispose",T);const tt=R.textures,J=R.isWebGLCubeRenderTarget===!0,Et=tt.length>1;if(Et||(Z.__webglTexture===void 0&&(Z.__webglTexture=r.createTexture()),Z.__version=S.version,a.memory.textures++),J){B.__webglFramebuffer=[];for(let ut=0;ut<6;ut++)if(S.mipmaps&&S.mipmaps.length>0){B.__webglFramebuffer[ut]=[];for(let xt=0;xt<S.mipmaps.length;xt++)B.__webglFramebuffer[ut][xt]=r.createFramebuffer()}else B.__webglFramebuffer[ut]=r.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){B.__webglFramebuffer=[];for(let ut=0;ut<S.mipmaps.length;ut++)B.__webglFramebuffer[ut]=r.createFramebuffer()}else B.__webglFramebuffer=r.createFramebuffer();if(Et)for(let ut=0,xt=tt.length;ut<xt;ut++){const Yt=n.get(tt[ut]);Yt.__webglTexture===void 0&&(Yt.__webglTexture=r.createTexture(),a.memory.textures++)}if(R.samples>0&&Wt(R)===!1){B.__webglMultisampledFramebuffer=r.createFramebuffer(),B.__webglColorRenderbuffer=[],e.bindFramebuffer(r.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let ut=0;ut<tt.length;ut++){const xt=tt[ut];B.__webglColorRenderbuffer[ut]=r.createRenderbuffer(),r.bindRenderbuffer(r.RENDERBUFFER,B.__webglColorRenderbuffer[ut]);const Yt=s.convert(xt.format,xt.colorSpace),st=s.convert(xt.type),vt=y(xt.internalFormat,Yt,st,xt.colorSpace,R.isXRRenderTarget===!0),zt=Vt(R);r.renderbufferStorageMultisample(r.RENDERBUFFER,zt,vt,R.width,R.height),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+ut,r.RENDERBUFFER,B.__webglColorRenderbuffer[ut])}r.bindRenderbuffer(r.RENDERBUFFER,null),R.depthBuffer&&(B.__webglDepthRenderbuffer=r.createRenderbuffer(),at(B.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(r.FRAMEBUFFER,null)}}if(J){e.bindTexture(r.TEXTURE_CUBE_MAP,Z.__webglTexture),kt(r.TEXTURE_CUBE_MAP,S);for(let ut=0;ut<6;ut++)if(S.mipmaps&&S.mipmaps.length>0)for(let xt=0;xt<S.mipmaps.length;xt++)yt(B.__webglFramebuffer[ut][xt],R,S,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+ut,xt);else yt(B.__webglFramebuffer[ut],R,S,r.COLOR_ATTACHMENT0,r.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0);m(S)&&p(r.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Et){for(let ut=0,xt=tt.length;ut<xt;ut++){const Yt=tt[ut],st=n.get(Yt);e.bindTexture(r.TEXTURE_2D,st.__webglTexture),kt(r.TEXTURE_2D,Yt),yt(B.__webglFramebuffer,R,Yt,r.COLOR_ATTACHMENT0+ut,r.TEXTURE_2D,0),m(Yt)&&p(r.TEXTURE_2D)}e.unbindTexture()}else{let ut=r.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(ut=R.isWebGL3DRenderTarget?r.TEXTURE_3D:r.TEXTURE_2D_ARRAY),e.bindTexture(ut,Z.__webglTexture),kt(ut,S),S.mipmaps&&S.mipmaps.length>0)for(let xt=0;xt<S.mipmaps.length;xt++)yt(B.__webglFramebuffer[xt],R,S,r.COLOR_ATTACHMENT0,ut,xt);else yt(B.__webglFramebuffer,R,S,r.COLOR_ATTACHMENT0,ut,0);m(S)&&p(ut),e.unbindTexture()}R.depthBuffer&&It(R)}function jt(R){const S=R.textures;for(let B=0,Z=S.length;B<Z;B++){const tt=S[B];if(m(tt)){const J=_(R),Et=n.get(tt).__webglTexture;e.bindTexture(J,Et),p(J),e.unbindTexture()}}}const Se=[],N=[];function rn(R){if(R.samples>0){if(Wt(R)===!1){const S=R.textures,B=R.width,Z=R.height;let tt=r.COLOR_BUFFER_BIT;const J=R.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT,Et=n.get(R),ut=S.length>1;if(ut)for(let xt=0;xt<S.length;xt++)e.bindFramebuffer(r.FRAMEBUFFER,Et.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+xt,r.RENDERBUFFER,null),e.bindFramebuffer(r.FRAMEBUFFER,Et.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+xt,r.TEXTURE_2D,null,0);e.bindFramebuffer(r.READ_FRAMEBUFFER,Et.__webglMultisampledFramebuffer),e.bindFramebuffer(r.DRAW_FRAMEBUFFER,Et.__webglFramebuffer);for(let xt=0;xt<S.length;xt++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(tt|=r.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(tt|=r.STENCIL_BUFFER_BIT)),ut){r.framebufferRenderbuffer(r.READ_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.RENDERBUFFER,Et.__webglColorRenderbuffer[xt]);const Yt=n.get(S[xt]).__webglTexture;r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,Yt,0)}r.blitFramebuffer(0,0,B,Z,0,0,B,Z,tt,r.NEAREST),l===!0&&(Se.length=0,N.length=0,Se.push(r.COLOR_ATTACHMENT0+xt),R.depthBuffer&&R.resolveDepthBuffer===!1&&(Se.push(J),N.push(J),r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,N)),r.invalidateFramebuffer(r.READ_FRAMEBUFFER,Se))}if(e.bindFramebuffer(r.READ_FRAMEBUFFER,null),e.bindFramebuffer(r.DRAW_FRAMEBUFFER,null),ut)for(let xt=0;xt<S.length;xt++){e.bindFramebuffer(r.FRAMEBUFFER,Et.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+xt,r.RENDERBUFFER,Et.__webglColorRenderbuffer[xt]);const Yt=n.get(S[xt]).__webglTexture;e.bindFramebuffer(r.FRAMEBUFFER,Et.__webglFramebuffer),r.framebufferTexture2D(r.DRAW_FRAMEBUFFER,r.COLOR_ATTACHMENT0+xt,r.TEXTURE_2D,Yt,0)}e.bindFramebuffer(r.DRAW_FRAMEBUFFER,Et.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&l){const S=R.stencilBuffer?r.DEPTH_STENCIL_ATTACHMENT:r.DEPTH_ATTACHMENT;r.invalidateFramebuffer(r.DRAW_FRAMEBUFFER,[S])}}}function Vt(R){return Math.min(i.maxSamples,R.samples)}function Wt(R){const S=n.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function Ct(R){const S=a.render.frame;h.get(R)!==S&&(h.set(R,S),R.update())}function ue(R,S){const B=R.colorSpace,Z=R.format,tt=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||B!==is&&B!==ei&&(Kt.getTransfer(B)===le?(Z!==vn||tt!==Gn)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),S}function At(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=H,this.resetTextureUnits=X,this.setTexture2D=O,this.setTexture2DArray=V,this.setTexture3D=K,this.setTextureCube=$,this.rebindTextures=Gt,this.setupRenderTarget=ve,this.updateRenderTargetMipmap=jt,this.updateMultisampleRenderTarget=rn,this.setupDepthRenderbuffer=It,this.setupFrameBufferTexture=yt,this.useMultisampledRTT=Wt}function Rg(r,t){function e(n,i=ei){let s;const a=Kt.getTransfer(i);if(n===Gn)return r.UNSIGNED_BYTE;if(n===Io)return r.UNSIGNED_SHORT_4_4_4_4;if(n===Lo)return r.UNSIGNED_SHORT_5_5_5_1;if(n===Jc)return r.UNSIGNED_INT_5_9_9_9_REV;if(n===Yc)return r.BYTE;if(n===Kc)return r.SHORT;if(n===zs)return r.UNSIGNED_SHORT;if(n===ko)return r.INT;if(n===bi)return r.UNSIGNED_INT;if(n===wn)return r.FLOAT;if(n===Is)return r.HALF_FLOAT;if(n===Zc)return r.ALPHA;if(n===Qc)return r.RGB;if(n===vn)return r.RGBA;if(n===th)return r.LUMINANCE;if(n===eh)return r.LUMINANCE_ALPHA;if(n===ji)return r.DEPTH_COMPONENT;if(n===ts)return r.DEPTH_STENCIL;if(n===Do)return r.RED;if(n===Uo)return r.RED_INTEGER;if(n===nh)return r.RG;if(n===No)return r.RG_INTEGER;if(n===Fo)return r.RGBA_INTEGER;if(n===gr||n===xr||n===vr||n===_r)if(a===le)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===gr)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===xr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===vr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===_r)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===gr)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===xr)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===vr)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===_r)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===qa||n===ja||n===Ya||n===Ka)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===qa)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ja)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ya)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Ka)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ja||n===Za||n===Qa)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Ja||n===Za)return a===le?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===Qa)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===to||n===eo||n===no||n===io||n===so||n===ro||n===ao||n===oo||n===lo||n===co||n===ho||n===uo||n===fo||n===po)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===to)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===eo)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===no)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===io)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===so)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ro)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ao)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===oo)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===lo)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===co)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ho)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===uo)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===fo)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===po)return a===le?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===yr||n===mo||n===go)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===yr)return a===le?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===mo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===go)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===ih||n===xo||n===vo||n===_o)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===yr)return s.COMPRESSED_RED_RGTC1_EXT;if(n===xo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===vo)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===_o)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Qi?r.UNSIGNED_INT_24_8:r[n]!==void 0?r[n]:null}return{convert:e}}class Cg extends tn{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class Me extends Ae{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Pg={type:"move"};class ba{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Me,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Me,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Me,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const x of t.hand.values()){const m=e.getJointPose(x,n),p=this._getHandJoint(c,x);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,g=.005;c.inputState.pinching&&d>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&d<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Pg)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Me;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const zg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,kg=`
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

}`;class Ig{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const i=new Be,s=t.properties.get(i);s.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Vn({vertexShader:zg,fragmentShader:kg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new ge(new En(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Lg extends ss{constructor(t,e){super();const n=this;let i=null,s=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,d=null,f=null,g=null;const x=new Ig,m=e.getContextAttributes();let p=null,_=null;const y=[],M=[],z=new gt;let A=null;const T=new tn;T.viewport=new be;const C=new tn;C.viewport=new be;const w=[T,C],b=new Cg;let k=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let it=y[Y];return it===void 0&&(it=new ba,y[Y]=it),it.getTargetRaySpace()},this.getControllerGrip=function(Y){let it=y[Y];return it===void 0&&(it=new ba,y[Y]=it),it.getGripSpace()},this.getHand=function(Y){let it=y[Y];return it===void 0&&(it=new ba,y[Y]=it),it.getHandSpace()};function H(Y){const it=M.indexOf(Y.inputSource);if(it===-1)return;const yt=y[it];yt!==void 0&&(yt.update(Y.inputSource,Y.frame,c||a),yt.dispatchEvent({type:Y.type,data:Y.inputSource}))}function P(){i.removeEventListener("select",H),i.removeEventListener("selectstart",H),i.removeEventListener("selectend",H),i.removeEventListener("squeeze",H),i.removeEventListener("squeezestart",H),i.removeEventListener("squeezeend",H),i.removeEventListener("end",P),i.removeEventListener("inputsourceschange",O);for(let Y=0;Y<y.length;Y++){const it=M[Y];it!==null&&(M[Y]=null,y[Y].disconnect(it))}k=null,X=null,x.reset(),t.setRenderTarget(p),f=null,d=null,u=null,i=null,_=null,qt.stop(),n.isPresenting=!1,t.setPixelRatio(A),t.setSize(z.width,z.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){s=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){o=Y,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(Y){c=Y},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(Y){if(i=Y,i!==null){if(p=t.getRenderTarget(),i.addEventListener("select",H),i.addEventListener("selectstart",H),i.addEventListener("selectend",H),i.addEventListener("squeeze",H),i.addEventListener("squeezestart",H),i.addEventListener("squeezeend",H),i.addEventListener("end",P),i.addEventListener("inputsourceschange",O),m.xrCompatible!==!0&&await e.makeXRCompatible(),A=t.getPixelRatio(),t.getSize(z),i.renderState.layers===void 0){const it={antialias:m.antialias,alpha:!0,depth:m.depth,stencil:m.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(i,e,it),i.updateRenderState({baseLayer:f}),t.setPixelRatio(1),t.setSize(f.framebufferWidth,f.framebufferHeight,!1),_=new Si(f.framebufferWidth,f.framebufferHeight,{format:vn,type:Gn,colorSpace:t.outputColorSpace,stencilBuffer:m.stencil})}else{let it=null,yt=null,at=null;m.depth&&(at=m.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,it=m.stencil?ts:ji,yt=m.stencil?Qi:bi);const Rt={colorFormat:e.RGBA8,depthFormat:at,scaleFactor:s};u=new XRWebGLBinding(i,e),d=u.createProjectionLayer(Rt),i.updateRenderState({layers:[d]}),t.setPixelRatio(1),t.setSize(d.textureWidth,d.textureHeight,!1),_=new Si(d.textureWidth,d.textureHeight,{format:vn,type:Gn,depthTexture:new xh(d.textureWidth,d.textureHeight,yt,void 0,void 0,void 0,void 0,void 0,void 0,it),stencilBuffer:m.stencil,colorSpace:t.outputColorSpace,samples:m.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await i.requestReferenceSpace(o),qt.setContext(i),qt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return x.getDepthTexture()};function O(Y){for(let it=0;it<Y.removed.length;it++){const yt=Y.removed[it],at=M.indexOf(yt);at>=0&&(M[at]=null,y[at].disconnect(yt))}for(let it=0;it<Y.added.length;it++){const yt=Y.added[it];let at=M.indexOf(yt);if(at===-1){for(let It=0;It<y.length;It++)if(It>=M.length){M.push(yt),at=It;break}else if(M[It]===null){M[It]=yt,at=It;break}if(at===-1)break}const Rt=y[at];Rt&&Rt.connect(yt)}}const V=new I,K=new I;function $(Y,it,yt){V.setFromMatrixPosition(it.matrixWorld),K.setFromMatrixPosition(yt.matrixWorld);const at=V.distanceTo(K),Rt=it.projectionMatrix.elements,It=yt.projectionMatrix.elements,Gt=Rt[14]/(Rt[10]-1),ve=Rt[14]/(Rt[10]+1),jt=(Rt[9]+1)/Rt[5],Se=(Rt[9]-1)/Rt[5],N=(Rt[8]-1)/Rt[0],rn=(It[8]+1)/It[0],Vt=Gt*N,Wt=Gt*rn,Ct=at/(-N+rn),ue=Ct*-N;if(it.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(ue),Y.translateZ(Ct),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),Rt[10]===-1)Y.projectionMatrix.copy(it.projectionMatrix),Y.projectionMatrixInverse.copy(it.projectionMatrixInverse);else{const At=Gt+Ct,R=ve+Ct,S=Vt-ue,B=Wt+(at-ue),Z=jt*ve/R*At,tt=Se*ve/R*At;Y.projectionMatrix.makePerspective(S,B,Z,tt,At,R),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function nt(Y,it){it===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(it.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(i===null)return;let it=Y.near,yt=Y.far;x.texture!==null&&(x.depthNear>0&&(it=x.depthNear),x.depthFar>0&&(yt=x.depthFar)),b.near=C.near=T.near=it,b.far=C.far=T.far=yt,(k!==b.near||X!==b.far)&&(i.updateRenderState({depthNear:b.near,depthFar:b.far}),k=b.near,X=b.far),T.layers.mask=Y.layers.mask|2,C.layers.mask=Y.layers.mask|4,b.layers.mask=T.layers.mask|C.layers.mask;const at=Y.parent,Rt=b.cameras;nt(b,at);for(let It=0;It<Rt.length;It++)nt(Rt[It],at);Rt.length===2?$(b,T,C):b.projectionMatrix.copy(T.projectionMatrix),dt(Y,b,at)};function dt(Y,it,yt){yt===null?Y.matrix.copy(it.matrixWorld):(Y.matrix.copy(yt.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(it.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(it.projectionMatrix),Y.projectionMatrixInverse.copy(it.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=yo*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return b},this.getFoveation=function(){if(!(d===null&&f===null))return l},this.setFoveation=function(Y){l=Y,d!==null&&(d.fixedFoveation=Y),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Y)},this.hasDepthSensing=function(){return x.texture!==null},this.getDepthSensingMesh=function(){return x.getMesh(b)};let Mt=null;function kt(Y,it){if(h=it.getViewerPose(c||a),g=it,h!==null){const yt=h.views;f!==null&&(t.setRenderTargetFramebuffer(_,f.framebuffer),t.setRenderTarget(_));let at=!1;yt.length!==b.cameras.length&&(b.cameras.length=0,at=!0);for(let It=0;It<yt.length;It++){const Gt=yt[It];let ve=null;if(f!==null)ve=f.getViewport(Gt);else{const Se=u.getViewSubImage(d,Gt);ve=Se.viewport,It===0&&(t.setRenderTargetTextures(_,Se.colorTexture,d.ignoreDepthValues?void 0:Se.depthStencilTexture),t.setRenderTarget(_))}let jt=w[It];jt===void 0&&(jt=new tn,jt.layers.enable(It),jt.viewport=new be,w[It]=jt),jt.matrix.fromArray(Gt.transform.matrix),jt.matrix.decompose(jt.position,jt.quaternion,jt.scale),jt.projectionMatrix.fromArray(Gt.projectionMatrix),jt.projectionMatrixInverse.copy(jt.projectionMatrix).invert(),jt.viewport.set(ve.x,ve.y,ve.width,ve.height),It===0&&(b.matrix.copy(jt.matrix),b.matrix.decompose(b.position,b.quaternion,b.scale)),at===!0&&b.cameras.push(jt)}const Rt=i.enabledFeatures;if(Rt&&Rt.includes("depth-sensing")){const It=u.getDepthInformation(yt[0]);It&&It.isValid&&It.texture&&x.init(t,It,i.renderState)}}for(let yt=0;yt<y.length;yt++){const at=M[yt],Rt=y[yt];at!==null&&Rt!==void 0&&Rt.update(at,it,c||a)}Mt&&Mt(Y,it),it.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:it}),g=null}const qt=new mh;qt.setAnimationLoop(kt),this.setAnimationLoop=function(Y){Mt=Y},this.dispose=function(){}}}const mi=new ln,Dg=new te;function Ug(r,t){function e(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,uh(r)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function i(m,p,_,y,M){p.isMeshBasicMaterial||p.isMeshLambertMaterial?s(m,p):p.isMeshToonMaterial?(s(m,p),u(m,p)):p.isMeshPhongMaterial?(s(m,p),h(m,p)):p.isMeshStandardMaterial?(s(m,p),d(m,p),p.isMeshPhysicalMaterial&&f(m,p,M)):p.isMeshMatcapMaterial?(s(m,p),g(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),x(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,_,y):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,e(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===je&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,e(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===je&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,e(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,e(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,e(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const _=t.get(p),y=_.envMap,M=_.envMapRotation;y&&(m.envMap.value=y,mi.copy(M),mi.x*=-1,mi.y*=-1,mi.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(mi.y*=-1,mi.z*=-1),m.envMapRotation.value.setFromMatrix4(Dg.makeRotationFromEuler(mi)),m.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,e(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,e(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,_,y){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*_,m.scale.value=y*.5,p.map&&(m.map.value=p.map,e(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,e(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,e(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,e(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,e(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,_){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,e(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,e(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,e(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,e(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,e(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===je&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,e(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,e(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=_.texture,m.transmissionSamplerSize.value.set(_.width,_.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,e(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,e(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,e(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,e(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,e(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function x(m,p){const _=t.get(p).light;m.referencePosition.value.setFromMatrixPosition(_.matrixWorld),m.nearDistance.value=_.shadow.camera.near,m.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function Ng(r,t,e,n){let i={},s={},a=[];const o=r.getParameter(r.MAX_UNIFORM_BUFFER_BINDINGS);function l(_,y){const M=y.program;n.uniformBlockBinding(_,M)}function c(_,y){let M=i[_.id];M===void 0&&(g(_),M=h(_),i[_.id]=M,_.addEventListener("dispose",m));const z=y.program;n.updateUBOMapping(_,z);const A=t.render.frame;s[_.id]!==A&&(d(_),s[_.id]=A)}function h(_){const y=u();_.__bindingPointIndex=y;const M=r.createBuffer(),z=_.__size,A=_.usage;return r.bindBuffer(r.UNIFORM_BUFFER,M),r.bufferData(r.UNIFORM_BUFFER,z,A),r.bindBuffer(r.UNIFORM_BUFFER,null),r.bindBufferBase(r.UNIFORM_BUFFER,y,M),M}function u(){for(let _=0;_<o;_++)if(a.indexOf(_)===-1)return a.push(_),_;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(_){const y=i[_.id],M=_.uniforms,z=_.__cache;r.bindBuffer(r.UNIFORM_BUFFER,y);for(let A=0,T=M.length;A<T;A++){const C=Array.isArray(M[A])?M[A]:[M[A]];for(let w=0,b=C.length;w<b;w++){const k=C[w];if(f(k,A,w,z)===!0){const X=k.__offset,H=Array.isArray(k.value)?k.value:[k.value];let P=0;for(let O=0;O<H.length;O++){const V=H[O],K=x(V);typeof V=="number"||typeof V=="boolean"?(k.__data[0]=V,r.bufferSubData(r.UNIFORM_BUFFER,X+P,k.__data)):V.isMatrix3?(k.__data[0]=V.elements[0],k.__data[1]=V.elements[1],k.__data[2]=V.elements[2],k.__data[3]=0,k.__data[4]=V.elements[3],k.__data[5]=V.elements[4],k.__data[6]=V.elements[5],k.__data[7]=0,k.__data[8]=V.elements[6],k.__data[9]=V.elements[7],k.__data[10]=V.elements[8],k.__data[11]=0):(V.toArray(k.__data,P),P+=K.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(r.UNIFORM_BUFFER,X,k.__data)}}}r.bindBuffer(r.UNIFORM_BUFFER,null)}function f(_,y,M,z){const A=_.value,T=y+"_"+M;if(z[T]===void 0)return typeof A=="number"||typeof A=="boolean"?z[T]=A:z[T]=A.clone(),!0;{const C=z[T];if(typeof A=="number"||typeof A=="boolean"){if(C!==A)return z[T]=A,!0}else if(C.equals(A)===!1)return C.copy(A),!0}return!1}function g(_){const y=_.uniforms;let M=0;const z=16;for(let T=0,C=y.length;T<C;T++){const w=Array.isArray(y[T])?y[T]:[y[T]];for(let b=0,k=w.length;b<k;b++){const X=w[b],H=Array.isArray(X.value)?X.value:[X.value];for(let P=0,O=H.length;P<O;P++){const V=H[P],K=x(V),$=M%z,nt=$%K.boundary,dt=$+nt;M+=nt,dt!==0&&z-dt<K.storage&&(M+=z-dt),X.__data=new Float32Array(K.storage/Float32Array.BYTES_PER_ELEMENT),X.__offset=M,M+=K.storage}}}const A=M%z;return A>0&&(M+=z-A),_.__size=M,_.__cache={},this}function x(_){const y={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(y.boundary=4,y.storage=4):_.isVector2?(y.boundary=8,y.storage=8):_.isVector3||_.isColor?(y.boundary=16,y.storage=12):_.isVector4?(y.boundary=16,y.storage=16):_.isMatrix3?(y.boundary=48,y.storage=48):_.isMatrix4?(y.boundary=64,y.storage=64):_.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",_),y}function m(_){const y=_.target;y.removeEventListener("dispose",m);const M=a.indexOf(y.__bindingPointIndex);a.splice(M,1),r.deleteBuffer(i[y.id]),delete i[y.id],delete s[y.id]}function p(){for(const _ in i)r.deleteBuffer(i[_]);a=[],i={},s={}}return{bind:l,update:c,dispose:p}}class bh{constructor(t={}){const{canvas:e=Eu(),context:n=null,depth:i=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=t;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=a;const g=new Uint32Array(4),x=new Int32Array(4);let m=null,p=null;const _=[],y=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Oe,this.toneMapping=ii,this.toneMappingExposure=1;const M=this;let z=!1,A=0,T=0,C=null,w=-1,b=null;const k=new be,X=new be;let H=null;const P=new Pt(0);let O=0,V=e.width,K=e.height,$=1,nt=null,dt=null;const Mt=new be(0,0,V,K),kt=new be(0,0,V,K);let qt=!1;const Y=new Bo;let it=!1,yt=!1;const at=new te,Rt=new te,It=new I,Gt=new be,ve={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let jt=!1;function Se(){return C===null?$:1}let N=n;function rn(E,D){return e.getContext(E,D)}try{const E={alpha:!0,depth:i,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Po}`),e.addEventListener("webglcontextlost",Q,!1),e.addEventListener("webglcontextrestored",mt,!1),e.addEventListener("webglcontextcreationerror",ft,!1),N===null){const D="webgl2";if(N=rn(D,E),N===null)throw rn(D)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}let Vt,Wt,Ct,ue,At,R,S,B,Z,tt,J,Et,ut,xt,Yt,st,vt,zt,Lt,_t,Xt,Bt,he,L;function ht(){Vt=new Vm(N),Vt.init(),Bt=new Rg(N,Vt),Wt=new Nm(N,Vt,t,Bt),Ct=new Eg(N,Vt),Wt.reverseDepthBuffer&&d&&Ct.buffers.depth.setReversed(!0),ue=new $m(N),At=new hg,R=new Ag(N,Vt,Ct,At,Wt,Bt,ue),S=new Om(M),B=new Gm(M),Z=new Zu(N),he=new Dm(N,Z),tt=new Wm(N,Z,ue,he),J=new jm(N,tt,Z,ue),Lt=new qm(N,Wt,R),st=new Fm(At),Et=new cg(M,S,B,Vt,Wt,he,st),ut=new Ug(M,At),xt=new ug,Yt=new vg(Vt),zt=new Lm(M,S,B,Ct,J,f,l),vt=new Sg(M,J,Wt),L=new Ng(N,ue,Wt,Ct),_t=new Um(N,Vt,ue),Xt=new Xm(N,Vt,ue),ue.programs=Et.programs,M.capabilities=Wt,M.extensions=Vt,M.properties=At,M.renderLists=xt,M.shadowMap=vt,M.state=Ct,M.info=ue}ht();const j=new Lg(M,N);this.xr=j,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){const E=Vt.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){const E=Vt.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return $},this.setPixelRatio=function(E){E!==void 0&&($=E,this.setSize(V,K,!1))},this.getSize=function(E){return E.set(V,K)},this.setSize=function(E,D,G=!0){if(j.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}V=E,K=D,e.width=Math.floor(E*$),e.height=Math.floor(D*$),G===!0&&(e.style.width=E+"px",e.style.height=D+"px"),this.setViewport(0,0,E,D)},this.getDrawingBufferSize=function(E){return E.set(V*$,K*$).floor()},this.setDrawingBufferSize=function(E,D,G){V=E,K=D,$=G,e.width=Math.floor(E*G),e.height=Math.floor(D*G),this.setViewport(0,0,E,D)},this.getCurrentViewport=function(E){return E.copy(k)},this.getViewport=function(E){return E.copy(Mt)},this.setViewport=function(E,D,G,W){E.isVector4?Mt.set(E.x,E.y,E.z,E.w):Mt.set(E,D,G,W),Ct.viewport(k.copy(Mt).multiplyScalar($).round())},this.getScissor=function(E){return E.copy(kt)},this.setScissor=function(E,D,G,W){E.isVector4?kt.set(E.x,E.y,E.z,E.w):kt.set(E,D,G,W),Ct.scissor(X.copy(kt).multiplyScalar($).round())},this.getScissorTest=function(){return qt},this.setScissorTest=function(E){Ct.setScissorTest(qt=E)},this.setOpaqueSort=function(E){nt=E},this.setTransparentSort=function(E){dt=E},this.getClearColor=function(E){return E.copy(zt.getClearColor())},this.setClearColor=function(){zt.setClearColor.apply(zt,arguments)},this.getClearAlpha=function(){return zt.getClearAlpha()},this.setClearAlpha=function(){zt.setClearAlpha.apply(zt,arguments)},this.clear=function(E=!0,D=!0,G=!0){let W=0;if(E){let U=!1;if(C!==null){const rt=C.texture.format;U=rt===Fo||rt===No||rt===Uo}if(U){const rt=C.texture.type,pt=rt===Gn||rt===bi||rt===zs||rt===Qi||rt===Io||rt===Lo,bt=zt.getClearColor(),St=zt.getClearAlpha(),Dt=bt.r,Ft=bt.g,wt=bt.b;pt?(g[0]=Dt,g[1]=Ft,g[2]=wt,g[3]=St,N.clearBufferuiv(N.COLOR,0,g)):(x[0]=Dt,x[1]=Ft,x[2]=wt,x[3]=St,N.clearBufferiv(N.COLOR,0,x))}else W|=N.COLOR_BUFFER_BIT}D&&(W|=N.DEPTH_BUFFER_BIT),G&&(W|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),N.clear(W)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Q,!1),e.removeEventListener("webglcontextrestored",mt,!1),e.removeEventListener("webglcontextcreationerror",ft,!1),xt.dispose(),Yt.dispose(),At.dispose(),S.dispose(),B.dispose(),J.dispose(),he.dispose(),L.dispose(),Et.dispose(),j.dispose(),j.removeEventListener("sessionstart",el),j.removeEventListener("sessionend",nl),li.stop()};function Q(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),z=!0}function mt(){console.log("THREE.WebGLRenderer: Context Restored."),z=!1;const E=ue.autoReset,D=vt.enabled,G=vt.autoUpdate,W=vt.needsUpdate,U=vt.type;ht(),ue.autoReset=E,vt.enabled=D,vt.autoUpdate=G,vt.needsUpdate=W,vt.type=U}function ft(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Nt(E){const D=E.target;D.removeEventListener("dispose",Nt),ye(D)}function ye(E){Ue(E),At.remove(E)}function Ue(E){const D=At.get(E).programs;D!==void 0&&(D.forEach(function(G){Et.releaseProgram(G)}),E.isShaderMaterial&&Et.releaseShaderCache(E))}this.renderBufferDirect=function(E,D,G,W,U,rt){D===null&&(D=ve);const pt=U.isMesh&&U.matrixWorld.determinant()<0,bt=Gh(E,D,G,W,U);Ct.setMaterial(W,pt);let St=G.index,Dt=1;if(W.wireframe===!0){if(St=tt.getWireframeAttribute(G),St===void 0)return;Dt=2}const Ft=G.drawRange,wt=G.attributes.position;let Zt=Ft.start*Dt,de=(Ft.start+Ft.count)*Dt;rt!==null&&(Zt=Math.max(Zt,rt.start*Dt),de=Math.min(de,(rt.start+rt.count)*Dt)),St!==null?(Zt=Math.max(Zt,0),de=Math.min(de,St.count)):wt!=null&&(Zt=Math.max(Zt,0),de=Math.min(de,wt.count));const fe=de-Zt;if(fe<0||fe===1/0)return;he.setup(U,W,bt,G,St);let We,ne=_t;if(St!==null&&(We=Z.get(St),ne=Xt,ne.setIndex(We)),U.isMesh)W.wireframe===!0?(Ct.setLineWidth(W.wireframeLinewidth*Se()),ne.setMode(N.LINES)):ne.setMode(N.TRIANGLES);else if(U.isLine){let Tt=W.linewidth;Tt===void 0&&(Tt=1),Ct.setLineWidth(Tt*Se()),U.isLineSegments?ne.setMode(N.LINES):U.isLineLoop?ne.setMode(N.LINE_LOOP):ne.setMode(N.LINE_STRIP)}else U.isPoints?ne.setMode(N.POINTS):U.isSprite&&ne.setMode(N.TRIANGLES);if(U.isBatchedMesh)if(U._multiDrawInstances!==null)ne.renderMultiDrawInstances(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount,U._multiDrawInstances);else if(Vt.get("WEBGL_multi_draw"))ne.renderMultiDraw(U._multiDrawStarts,U._multiDrawCounts,U._multiDrawCount);else{const Tt=U._multiDrawStarts,Rn=U._multiDrawCounts,ie=U._multiDrawCount,hn=St?Z.get(St).bytesPerElement:1,Ai=At.get(W).currentProgram.getUniforms();for(let Ye=0;Ye<ie;Ye++)Ai.setValue(N,"_gl_DrawID",Ye),ne.render(Tt[Ye]/hn,Rn[Ye])}else if(U.isInstancedMesh)ne.renderInstances(Zt,fe,U.count);else if(G.isInstancedBufferGeometry){const Tt=G._maxInstanceCount!==void 0?G._maxInstanceCount:1/0,Rn=Math.min(G.instanceCount,Tt);ne.renderInstances(Zt,fe,Rn)}else ne.render(Zt,fe)};function oe(E,D,G){E.transparent===!0&&E.side===en&&E.forceSinglePass===!1?(E.side=je,E.needsUpdate=!0,Us(E,D,G),E.side=ai,E.needsUpdate=!0,Us(E,D,G),E.side=en):Us(E,D,G)}this.compile=function(E,D,G=null){G===null&&(G=E),p=Yt.get(G),p.init(D),y.push(p),G.traverseVisible(function(U){U.isLight&&U.layers.test(D.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),E!==G&&E.traverseVisible(function(U){U.isLight&&U.layers.test(D.layers)&&(p.pushLight(U),U.castShadow&&p.pushShadow(U))}),p.setupLights();const W=new Set;return E.traverse(function(U){if(!(U.isMesh||U.isPoints||U.isLine||U.isSprite))return;const rt=U.material;if(rt)if(Array.isArray(rt))for(let pt=0;pt<rt.length;pt++){const bt=rt[pt];oe(bt,G,U),W.add(bt)}else oe(rt,G,U),W.add(rt)}),y.pop(),p=null,W},this.compileAsync=function(E,D,G=null){const W=this.compile(E,D,G);return new Promise(U=>{function rt(){if(W.forEach(function(pt){At.get(pt).currentProgram.isReady()&&W.delete(pt)}),W.size===0){U(E);return}setTimeout(rt,10)}Vt.get("KHR_parallel_shader_compile")!==null?rt():setTimeout(rt,10)})};let cn=null;function An(E){cn&&cn(E)}function el(){li.stop()}function nl(){li.start()}const li=new mh;li.setAnimationLoop(An),typeof self<"u"&&li.setContext(self),this.setAnimationLoop=function(E){cn=E,j.setAnimationLoop(E),E===null?li.stop():li.start()},j.addEventListener("sessionstart",el),j.addEventListener("sessionend",nl),this.render=function(E,D){if(D!==void 0&&D.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(z===!0)return;if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),j.enabled===!0&&j.isPresenting===!0&&(j.cameraAutoUpdate===!0&&j.updateCamera(D),D=j.getCamera()),E.isScene===!0&&E.onBeforeRender(M,E,D,C),p=Yt.get(E,y.length),p.init(D),y.push(p),Rt.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),Y.setFromProjectionMatrix(Rt),yt=this.localClippingEnabled,it=st.init(this.clippingPlanes,yt),m=xt.get(E,_.length),m.init(),_.push(m),j.enabled===!0&&j.isPresenting===!0){const rt=M.xr.getDepthSensingMesh();rt!==null&&Or(rt,D,-1/0,M.sortObjects)}Or(E,D,0,M.sortObjects),m.finish(),M.sortObjects===!0&&m.sort(nt,dt),jt=j.enabled===!1||j.isPresenting===!1||j.hasDepthSensing()===!1,jt&&zt.addToRenderList(m,E),this.info.render.frame++,it===!0&&st.beginShadows();const G=p.state.shadowsArray;vt.render(G,E,D),it===!0&&st.endShadows(),this.info.autoReset===!0&&this.info.reset();const W=m.opaque,U=m.transmissive;if(p.setupLights(),D.isArrayCamera){const rt=D.cameras;if(U.length>0)for(let pt=0,bt=rt.length;pt<bt;pt++){const St=rt[pt];sl(W,U,E,St)}jt&&zt.render(E);for(let pt=0,bt=rt.length;pt<bt;pt++){const St=rt[pt];il(m,E,St,St.viewport)}}else U.length>0&&sl(W,U,E,D),jt&&zt.render(E),il(m,E,D);C!==null&&(R.updateMultisampleRenderTarget(C),R.updateRenderTargetMipmap(C)),E.isScene===!0&&E.onAfterRender(M,E,D),he.resetDefaultState(),w=-1,b=null,y.pop(),y.length>0?(p=y[y.length-1],it===!0&&st.setGlobalState(M.clippingPlanes,p.state.camera)):p=null,_.pop(),_.length>0?m=_[_.length-1]:m=null};function Or(E,D,G,W){if(E.visible===!1)return;if(E.layers.test(D.layers)){if(E.isGroup)G=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(D);else if(E.isLight)p.pushLight(E),E.castShadow&&p.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||Y.intersectsSprite(E)){W&&Gt.setFromMatrixPosition(E.matrixWorld).applyMatrix4(Rt);const pt=J.update(E),bt=E.material;bt.visible&&m.push(E,pt,bt,G,Gt.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||Y.intersectsObject(E))){const pt=J.update(E),bt=E.material;if(W&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),Gt.copy(E.boundingSphere.center)):(pt.boundingSphere===null&&pt.computeBoundingSphere(),Gt.copy(pt.boundingSphere.center)),Gt.applyMatrix4(E.matrixWorld).applyMatrix4(Rt)),Array.isArray(bt)){const St=pt.groups;for(let Dt=0,Ft=St.length;Dt<Ft;Dt++){const wt=St[Dt],Zt=bt[wt.materialIndex];Zt&&Zt.visible&&m.push(E,pt,Zt,G,Gt.z,wt)}}else bt.visible&&m.push(E,pt,bt,G,Gt.z,null)}}const rt=E.children;for(let pt=0,bt=rt.length;pt<bt;pt++)Or(rt[pt],D,G,W)}function il(E,D,G,W){const U=E.opaque,rt=E.transmissive,pt=E.transparent;p.setupLightsView(G),it===!0&&st.setGlobalState(M.clippingPlanes,G),W&&Ct.viewport(k.copy(W)),U.length>0&&Ds(U,D,G),rt.length>0&&Ds(rt,D,G),pt.length>0&&Ds(pt,D,G),Ct.buffers.depth.setTest(!0),Ct.buffers.depth.setMask(!0),Ct.buffers.color.setMask(!0),Ct.setPolygonOffset(!1)}function sl(E,D,G,W){if((G.isScene===!0?G.overrideMaterial:null)!==null)return;p.state.transmissionRenderTarget[W.id]===void 0&&(p.state.transmissionRenderTarget[W.id]=new Si(1,1,{generateMipmaps:!0,type:Vt.has("EXT_color_buffer_half_float")||Vt.has("EXT_color_buffer_float")?Is:Gn,minFilter:yi,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Kt.workingColorSpace}));const rt=p.state.transmissionRenderTarget[W.id],pt=W.viewport||k;rt.setSize(pt.z,pt.w);const bt=M.getRenderTarget();M.setRenderTarget(rt),M.getClearColor(P),O=M.getClearAlpha(),O<1&&M.setClearColor(16777215,.5),M.clear(),jt&&zt.render(G);const St=M.toneMapping;M.toneMapping=ii;const Dt=W.viewport;if(W.viewport!==void 0&&(W.viewport=void 0),p.setupLightsView(W),it===!0&&st.setGlobalState(M.clippingPlanes,W),Ds(E,G,W),R.updateMultisampleRenderTarget(rt),R.updateRenderTargetMipmap(rt),Vt.has("WEBGL_multisampled_render_to_texture")===!1){let Ft=!1;for(let wt=0,Zt=D.length;wt<Zt;wt++){const de=D[wt],fe=de.object,We=de.geometry,ne=de.material,Tt=de.group;if(ne.side===en&&fe.layers.test(W.layers)){const Rn=ne.side;ne.side=je,ne.needsUpdate=!0,rl(fe,G,W,We,ne,Tt),ne.side=Rn,ne.needsUpdate=!0,Ft=!0}}Ft===!0&&(R.updateMultisampleRenderTarget(rt),R.updateRenderTargetMipmap(rt))}M.setRenderTarget(bt),M.setClearColor(P,O),Dt!==void 0&&(W.viewport=Dt),M.toneMapping=St}function Ds(E,D,G){const W=D.isScene===!0?D.overrideMaterial:null;for(let U=0,rt=E.length;U<rt;U++){const pt=E[U],bt=pt.object,St=pt.geometry,Dt=W===null?pt.material:W,Ft=pt.group;bt.layers.test(G.layers)&&rl(bt,D,G,St,Dt,Ft)}}function rl(E,D,G,W,U,rt){E.onBeforeRender(M,D,G,W,U,rt),E.modelViewMatrix.multiplyMatrices(G.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),U.onBeforeRender(M,D,G,W,E,rt),U.transparent===!0&&U.side===en&&U.forceSinglePass===!1?(U.side=je,U.needsUpdate=!0,M.renderBufferDirect(G,D,W,U,E,rt),U.side=ai,U.needsUpdate=!0,M.renderBufferDirect(G,D,W,U,E,rt),U.side=en):M.renderBufferDirect(G,D,W,U,E,rt),E.onAfterRender(M,D,G,W,U,rt)}function Us(E,D,G){D.isScene!==!0&&(D=ve);const W=At.get(E),U=p.state.lights,rt=p.state.shadowsArray,pt=U.state.version,bt=Et.getParameters(E,U.state,rt,D,G),St=Et.getProgramCacheKey(bt);let Dt=W.programs;W.environment=E.isMeshStandardMaterial?D.environment:null,W.fog=D.fog,W.envMap=(E.isMeshStandardMaterial?B:S).get(E.envMap||W.environment),W.envMapRotation=W.environment!==null&&E.envMap===null?D.environmentRotation:E.envMapRotation,Dt===void 0&&(E.addEventListener("dispose",Nt),Dt=new Map,W.programs=Dt);let Ft=Dt.get(St);if(Ft!==void 0){if(W.currentProgram===Ft&&W.lightsStateVersion===pt)return ol(E,bt),Ft}else bt.uniforms=Et.getUniforms(E),E.onBeforeCompile(bt,M),Ft=Et.acquireProgram(bt,St),Dt.set(St,Ft),W.uniforms=bt.uniforms;const wt=W.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(wt.clippingPlanes=st.uniform),ol(E,bt),W.needsLights=Wh(E),W.lightsStateVersion=pt,W.needsLights&&(wt.ambientLightColor.value=U.state.ambient,wt.lightProbe.value=U.state.probe,wt.directionalLights.value=U.state.directional,wt.directionalLightShadows.value=U.state.directionalShadow,wt.spotLights.value=U.state.spot,wt.spotLightShadows.value=U.state.spotShadow,wt.rectAreaLights.value=U.state.rectArea,wt.ltc_1.value=U.state.rectAreaLTC1,wt.ltc_2.value=U.state.rectAreaLTC2,wt.pointLights.value=U.state.point,wt.pointLightShadows.value=U.state.pointShadow,wt.hemisphereLights.value=U.state.hemi,wt.directionalShadowMap.value=U.state.directionalShadowMap,wt.directionalShadowMatrix.value=U.state.directionalShadowMatrix,wt.spotShadowMap.value=U.state.spotShadowMap,wt.spotLightMatrix.value=U.state.spotLightMatrix,wt.spotLightMap.value=U.state.spotLightMap,wt.pointShadowMap.value=U.state.pointShadowMap,wt.pointShadowMatrix.value=U.state.pointShadowMatrix),W.currentProgram=Ft,W.uniformsList=null,Ft}function al(E){if(E.uniformsList===null){const D=E.currentProgram.getUniforms();E.uniformsList=Mr.seqWithValue(D.seq,E.uniforms)}return E.uniformsList}function ol(E,D){const G=At.get(E);G.outputColorSpace=D.outputColorSpace,G.batching=D.batching,G.batchingColor=D.batchingColor,G.instancing=D.instancing,G.instancingColor=D.instancingColor,G.instancingMorph=D.instancingMorph,G.skinning=D.skinning,G.morphTargets=D.morphTargets,G.morphNormals=D.morphNormals,G.morphColors=D.morphColors,G.morphTargetsCount=D.morphTargetsCount,G.numClippingPlanes=D.numClippingPlanes,G.numIntersection=D.numClipIntersection,G.vertexAlphas=D.vertexAlphas,G.vertexTangents=D.vertexTangents,G.toneMapping=D.toneMapping}function Gh(E,D,G,W,U){D.isScene!==!0&&(D=ve),R.resetTextureUnits();const rt=D.fog,pt=W.isMeshStandardMaterial?D.environment:null,bt=C===null?M.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:is,St=(W.isMeshStandardMaterial?B:S).get(W.envMap||pt),Dt=W.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,Ft=!!G.attributes.tangent&&(!!W.normalMap||W.anisotropy>0),wt=!!G.morphAttributes.position,Zt=!!G.morphAttributes.normal,de=!!G.morphAttributes.color;let fe=ii;W.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(fe=M.toneMapping);const We=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,ne=We!==void 0?We.length:0,Tt=At.get(W),Rn=p.state.lights;if(it===!0&&(yt===!0||E!==b)){const an=E===b&&W.id===w;st.setState(W,E,an)}let ie=!1;W.version===Tt.__version?(Tt.needsLights&&Tt.lightsStateVersion!==Rn.state.version||Tt.outputColorSpace!==bt||U.isBatchedMesh&&Tt.batching===!1||!U.isBatchedMesh&&Tt.batching===!0||U.isBatchedMesh&&Tt.batchingColor===!0&&U.colorTexture===null||U.isBatchedMesh&&Tt.batchingColor===!1&&U.colorTexture!==null||U.isInstancedMesh&&Tt.instancing===!1||!U.isInstancedMesh&&Tt.instancing===!0||U.isSkinnedMesh&&Tt.skinning===!1||!U.isSkinnedMesh&&Tt.skinning===!0||U.isInstancedMesh&&Tt.instancingColor===!0&&U.instanceColor===null||U.isInstancedMesh&&Tt.instancingColor===!1&&U.instanceColor!==null||U.isInstancedMesh&&Tt.instancingMorph===!0&&U.morphTexture===null||U.isInstancedMesh&&Tt.instancingMorph===!1&&U.morphTexture!==null||Tt.envMap!==St||W.fog===!0&&Tt.fog!==rt||Tt.numClippingPlanes!==void 0&&(Tt.numClippingPlanes!==st.numPlanes||Tt.numIntersection!==st.numIntersection)||Tt.vertexAlphas!==Dt||Tt.vertexTangents!==Ft||Tt.morphTargets!==wt||Tt.morphNormals!==Zt||Tt.morphColors!==de||Tt.toneMapping!==fe||Tt.morphTargetsCount!==ne)&&(ie=!0):(ie=!0,Tt.__version=W.version);let hn=Tt.currentProgram;ie===!0&&(hn=Us(W,D,U));let Ai=!1,Ye=!1,ls=!1;const pe=hn.getUniforms(),_n=Tt.uniforms;if(Ct.useProgram(hn.program)&&(Ai=!0,Ye=!0,ls=!0),W.id!==w&&(w=W.id,Ye=!0),Ai||b!==E){Ct.buffers.depth.getReversed()?(at.copy(E.projectionMatrix),Au(at),Ru(at),pe.setValue(N,"projectionMatrix",at)):pe.setValue(N,"projectionMatrix",E.projectionMatrix),pe.setValue(N,"viewMatrix",E.matrixWorldInverse);const Wn=pe.map.cameraPosition;Wn!==void 0&&Wn.setValue(N,It.setFromMatrixPosition(E.matrixWorld)),Wt.logarithmicDepthBuffer&&pe.setValue(N,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(W.isMeshPhongMaterial||W.isMeshToonMaterial||W.isMeshLambertMaterial||W.isMeshBasicMaterial||W.isMeshStandardMaterial||W.isShaderMaterial)&&pe.setValue(N,"isOrthographic",E.isOrthographicCamera===!0),b!==E&&(b=E,Ye=!0,ls=!0)}if(U.isSkinnedMesh){pe.setOptional(N,U,"bindMatrix"),pe.setOptional(N,U,"bindMatrixInverse");const an=U.skeleton;an&&(an.boneTexture===null&&an.computeBoneTexture(),pe.setValue(N,"boneTexture",an.boneTexture,R))}U.isBatchedMesh&&(pe.setOptional(N,U,"batchingTexture"),pe.setValue(N,"batchingTexture",U._matricesTexture,R),pe.setOptional(N,U,"batchingIdTexture"),pe.setValue(N,"batchingIdTexture",U._indirectTexture,R),pe.setOptional(N,U,"batchingColorTexture"),U._colorsTexture!==null&&pe.setValue(N,"batchingColorTexture",U._colorsTexture,R));const cs=G.morphAttributes;if((cs.position!==void 0||cs.normal!==void 0||cs.color!==void 0)&&Lt.update(U,G,hn),(Ye||Tt.receiveShadow!==U.receiveShadow)&&(Tt.receiveShadow=U.receiveShadow,pe.setValue(N,"receiveShadow",U.receiveShadow)),W.isMeshGouraudMaterial&&W.envMap!==null&&(_n.envMap.value=St,_n.flipEnvMap.value=St.isCubeTexture&&St.isRenderTargetTexture===!1?-1:1),W.isMeshStandardMaterial&&W.envMap===null&&D.environment!==null&&(_n.envMapIntensity.value=D.environmentIntensity),Ye&&(pe.setValue(N,"toneMappingExposure",M.toneMappingExposure),Tt.needsLights&&Vh(_n,ls),rt&&W.fog===!0&&ut.refreshFogUniforms(_n,rt),ut.refreshMaterialUniforms(_n,W,$,K,p.state.transmissionRenderTarget[E.id]),Mr.upload(N,al(Tt),_n,R)),W.isShaderMaterial&&W.uniformsNeedUpdate===!0&&(Mr.upload(N,al(Tt),_n,R),W.uniformsNeedUpdate=!1),W.isSpriteMaterial&&pe.setValue(N,"center",U.center),pe.setValue(N,"modelViewMatrix",U.modelViewMatrix),pe.setValue(N,"normalMatrix",U.normalMatrix),pe.setValue(N,"modelMatrix",U.matrixWorld),W.isShaderMaterial||W.isRawShaderMaterial){const an=W.uniformsGroups;for(let Wn=0,Xn=an.length;Wn<Xn;Wn++){const ll=an[Wn];L.update(ll,hn),L.bind(ll,hn)}}return hn}function Vh(E,D){E.ambientLightColor.needsUpdate=D,E.lightProbe.needsUpdate=D,E.directionalLights.needsUpdate=D,E.directionalLightShadows.needsUpdate=D,E.pointLights.needsUpdate=D,E.pointLightShadows.needsUpdate=D,E.spotLights.needsUpdate=D,E.spotLightShadows.needsUpdate=D,E.rectAreaLights.needsUpdate=D,E.hemisphereLights.needsUpdate=D}function Wh(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return A},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(E,D,G){At.get(E.texture).__webglTexture=D,At.get(E.depthTexture).__webglTexture=G;const W=At.get(E);W.__hasExternalTextures=!0,W.__autoAllocateDepthBuffer=G===void 0,W.__autoAllocateDepthBuffer||Vt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),W.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(E,D){const G=At.get(E);G.__webglFramebuffer=D,G.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(E,D=0,G=0){C=E,A=D,T=G;let W=!0,U=null,rt=!1,pt=!1;if(E){const St=At.get(E);if(St.__useDefaultFramebuffer!==void 0)Ct.bindFramebuffer(N.FRAMEBUFFER,null),W=!1;else if(St.__webglFramebuffer===void 0)R.setupRenderTarget(E);else if(St.__hasExternalTextures)R.rebindTextures(E,At.get(E.texture).__webglTexture,At.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){const wt=E.depthTexture;if(St.__boundDepthTexture!==wt){if(wt!==null&&At.has(wt)&&(E.width!==wt.image.width||E.height!==wt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");R.setupDepthRenderbuffer(E)}}const Dt=E.texture;(Dt.isData3DTexture||Dt.isDataArrayTexture||Dt.isCompressedArrayTexture)&&(pt=!0);const Ft=At.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Ft[D])?U=Ft[D][G]:U=Ft[D],rt=!0):E.samples>0&&R.useMultisampledRTT(E)===!1?U=At.get(E).__webglMultisampledFramebuffer:Array.isArray(Ft)?U=Ft[G]:U=Ft,k.copy(E.viewport),X.copy(E.scissor),H=E.scissorTest}else k.copy(Mt).multiplyScalar($).floor(),X.copy(kt).multiplyScalar($).floor(),H=qt;if(Ct.bindFramebuffer(N.FRAMEBUFFER,U)&&W&&Ct.drawBuffers(E,U),Ct.viewport(k),Ct.scissor(X),Ct.setScissorTest(H),rt){const St=At.get(E.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+D,St.__webglTexture,G)}else if(pt){const St=At.get(E.texture),Dt=D||0;N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,St.__webglTexture,G||0,Dt)}w=-1},this.readRenderTargetPixels=function(E,D,G,W,U,rt,pt){if(!(E&&E.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let bt=At.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&pt!==void 0&&(bt=bt[pt]),bt){Ct.bindFramebuffer(N.FRAMEBUFFER,bt);try{const St=E.texture,Dt=St.format,Ft=St.type;if(!Wt.textureFormatReadable(Dt)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Wt.textureTypeReadable(Ft)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=E.width-W&&G>=0&&G<=E.height-U&&N.readPixels(D,G,W,U,Bt.convert(Dt),Bt.convert(Ft),rt)}finally{const St=C!==null?At.get(C).__webglFramebuffer:null;Ct.bindFramebuffer(N.FRAMEBUFFER,St)}}},this.readRenderTargetPixelsAsync=async function(E,D,G,W,U,rt,pt){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let bt=At.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&pt!==void 0&&(bt=bt[pt]),bt){const St=E.texture,Dt=St.format,Ft=St.type;if(!Wt.textureFormatReadable(Dt))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Wt.textureTypeReadable(Ft))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(D>=0&&D<=E.width-W&&G>=0&&G<=E.height-U){Ct.bindFramebuffer(N.FRAMEBUFFER,bt);const wt=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,wt),N.bufferData(N.PIXEL_PACK_BUFFER,rt.byteLength,N.STREAM_READ),N.readPixels(D,G,W,U,Bt.convert(Dt),Bt.convert(Ft),0);const Zt=C!==null?At.get(C).__webglFramebuffer:null;Ct.bindFramebuffer(N.FRAMEBUFFER,Zt);const de=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await Tu(N,de,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,wt),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,rt),N.deleteBuffer(wt),N.deleteSync(de),rt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(E,D=null,G=0){E.isTexture!==!0&&(Ms("WebGLRenderer: copyFramebufferToTexture function signature has changed."),D=arguments[0]||null,E=arguments[1]);const W=Math.pow(2,-G),U=Math.floor(E.image.width*W),rt=Math.floor(E.image.height*W),pt=D!==null?D.x:0,bt=D!==null?D.y:0;R.setTexture2D(E,0),N.copyTexSubImage2D(N.TEXTURE_2D,G,0,0,pt,bt,U,rt),Ct.unbindTexture()},this.copyTextureToTexture=function(E,D,G=null,W=null,U=0){E.isTexture!==!0&&(Ms("WebGLRenderer: copyTextureToTexture function signature has changed."),W=arguments[0]||null,E=arguments[1],D=arguments[2],U=arguments[3]||0,G=null);let rt,pt,bt,St,Dt,Ft,wt,Zt,de;const fe=E.isCompressedTexture?E.mipmaps[U]:E.image;G!==null?(rt=G.max.x-G.min.x,pt=G.max.y-G.min.y,bt=G.isBox3?G.max.z-G.min.z:1,St=G.min.x,Dt=G.min.y,Ft=G.isBox3?G.min.z:0):(rt=fe.width,pt=fe.height,bt=fe.depth||1,St=0,Dt=0,Ft=0),W!==null?(wt=W.x,Zt=W.y,de=W.z):(wt=0,Zt=0,de=0);const We=Bt.convert(D.format),ne=Bt.convert(D.type);let Tt;D.isData3DTexture?(R.setTexture3D(D,0),Tt=N.TEXTURE_3D):D.isDataArrayTexture||D.isCompressedArrayTexture?(R.setTexture2DArray(D,0),Tt=N.TEXTURE_2D_ARRAY):(R.setTexture2D(D,0),Tt=N.TEXTURE_2D),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,D.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,D.unpackAlignment);const Rn=N.getParameter(N.UNPACK_ROW_LENGTH),ie=N.getParameter(N.UNPACK_IMAGE_HEIGHT),hn=N.getParameter(N.UNPACK_SKIP_PIXELS),Ai=N.getParameter(N.UNPACK_SKIP_ROWS),Ye=N.getParameter(N.UNPACK_SKIP_IMAGES);N.pixelStorei(N.UNPACK_ROW_LENGTH,fe.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,fe.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,St),N.pixelStorei(N.UNPACK_SKIP_ROWS,Dt),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Ft);const ls=E.isDataArrayTexture||E.isData3DTexture,pe=D.isDataArrayTexture||D.isData3DTexture;if(E.isRenderTargetTexture||E.isDepthTexture){const _n=At.get(E),cs=At.get(D),an=At.get(_n.__renderTarget),Wn=At.get(cs.__renderTarget);Ct.bindFramebuffer(N.READ_FRAMEBUFFER,an.__webglFramebuffer),Ct.bindFramebuffer(N.DRAW_FRAMEBUFFER,Wn.__webglFramebuffer);for(let Xn=0;Xn<bt;Xn++)ls&&N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,At.get(E).__webglTexture,U,Ft+Xn),E.isDepthTexture?(pe&&N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,At.get(D).__webglTexture,U,de+Xn),N.blitFramebuffer(St,Dt,rt,pt,wt,Zt,rt,pt,N.DEPTH_BUFFER_BIT,N.NEAREST)):pe?N.copyTexSubImage3D(Tt,U,wt,Zt,de+Xn,St,Dt,rt,pt):N.copyTexSubImage2D(Tt,U,wt,Zt,de+Xn,St,Dt,rt,pt);Ct.bindFramebuffer(N.READ_FRAMEBUFFER,null),Ct.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else pe?E.isDataTexture||E.isData3DTexture?N.texSubImage3D(Tt,U,wt,Zt,de,rt,pt,bt,We,ne,fe.data):D.isCompressedArrayTexture?N.compressedTexSubImage3D(Tt,U,wt,Zt,de,rt,pt,bt,We,fe.data):N.texSubImage3D(Tt,U,wt,Zt,de,rt,pt,bt,We,ne,fe):E.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,U,wt,Zt,rt,pt,We,ne,fe.data):E.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,U,wt,Zt,fe.width,fe.height,We,fe.data):N.texSubImage2D(N.TEXTURE_2D,U,wt,Zt,rt,pt,We,ne,fe);N.pixelStorei(N.UNPACK_ROW_LENGTH,Rn),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,ie),N.pixelStorei(N.UNPACK_SKIP_PIXELS,hn),N.pixelStorei(N.UNPACK_SKIP_ROWS,Ai),N.pixelStorei(N.UNPACK_SKIP_IMAGES,Ye),U===0&&D.generateMipmaps&&N.generateMipmap(Tt),Ct.unbindTexture()},this.copyTextureToTexture3D=function(E,D,G=null,W=null,U=0){return E.isTexture!==!0&&(Ms("WebGLRenderer: copyTextureToTexture3D function signature has changed."),G=arguments[0]||null,W=arguments[1]||null,E=arguments[2],D=arguments[3],U=arguments[4]||0),Ms('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(E,D,G,W,U)},this.initRenderTarget=function(E){At.get(E).__webglFramebuffer===void 0&&R.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?R.setTextureCube(E,0):E.isData3DTexture?R.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?R.setTexture2DArray(E,0):R.setTexture2D(E,0),Ct.unbindTexture()},this.resetState=function(){A=0,T=0,C=null,Ct.reset(),he.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Bn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=Kt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Kt._getUnpackColorSpace()}}class Go{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new Pt(t),this.near=e,this.far=n}clone(){return new Go(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class Sh extends Ae{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ln,this.environmentIntensity=1,this.environmentRotation=new ln,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class Fg extends Be{constructor(t=null,e=1,n=1,i,s,a,o,l,c=nn,h=nn,u,d){super(null,a,o,l,c,h,i,s,u,d),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class pc extends ze{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Gi=new te,mc=new te,ar=[],gc=new wi,Og=new te,ms=new ge,gs=new Ei;class xs extends ge{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new pc(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,Og)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new wi),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Gi),gc.copy(t.boundingBox).applyMatrix4(Gi),this.boundingBox.union(gc)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ei),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Gi),gs.copy(t.boundingSphere).applyMatrix4(Gi),this.boundingSphere.union(gs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,i=this.morphTexture.source.data.data,s=n.length+1,a=t*s+1;for(let o=0;o<n.length;o++)n[o]=i[a+o]}raycast(t,e){const n=this.matrixWorld,i=this.count;if(ms.geometry=this.geometry,ms.material=this.material,ms.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),gs.copy(this.boundingSphere),gs.applyMatrix4(n),t.ray.intersectsSphere(gs)!==!1))for(let s=0;s<i;s++){this.getMatrixAt(s,Gi),mc.multiplyMatrices(n,Gi),ms.matrixWorld=mc,ms.raycast(t,ar);for(let a=0,o=ar.length;a<o;a++){const l=ar[a];l.instanceId=s,l.object=this,e.push(l)}ar.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new pc(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Fg(new Float32Array(i*this.count),i,this.count,Do,wn));const s=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=i*t;s[l]=o,s.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class wh extends Ti{static get type(){return"LineBasicMaterial"}constructor(t){super(),this.isLineBasicMaterial=!0,this.color=new Pt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const Ar=new I,Rr=new I,xc=new te,vs=new Ir,or=new Ei,Sa=new I,vc=new I;class Bg extends Ae{constructor(t=new we,e=new wh){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let i=1,s=e.count;i<s;i++)Ar.fromBufferAttribute(e,i-1),Rr.fromBufferAttribute(e,i),n[i]=n[i-1],n[i]+=Ar.distanceTo(Rr);t.setAttribute("lineDistance",new Jt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,s=t.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),or.copy(n.boundingSphere),or.applyMatrix4(i),or.radius+=s,t.ray.intersectsSphere(or)===!1)return;xc.copy(i).invert(),vs.copy(t.ray).applyMatrix4(xc);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,d=n.attributes.position;if(h!==null){const f=Math.max(0,a.start),g=Math.min(h.count,a.start+a.count);for(let x=f,m=g-1;x<m;x+=c){const p=h.getX(x),_=h.getX(x+1),y=lr(this,t,vs,l,p,_);y&&e.push(y)}if(this.isLineLoop){const x=h.getX(g-1),m=h.getX(f),p=lr(this,t,vs,l,x,m);p&&e.push(p)}}else{const f=Math.max(0,a.start),g=Math.min(d.count,a.start+a.count);for(let x=f,m=g-1;x<m;x+=c){const p=lr(this,t,vs,l,x,x+1);p&&e.push(p)}if(this.isLineLoop){const x=lr(this,t,vs,l,g-1,f);x&&e.push(x)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=i.length;s<a;s++){const o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function lr(r,t,e,n,i,s){const a=r.geometry.attributes.position;if(Ar.fromBufferAttribute(a,i),Rr.fromBufferAttribute(a,s),e.distanceSqToSegment(Ar,Rr,Sa,vc)>n)return;Sa.applyMatrix4(r.matrixWorld);const l=t.ray.origin.distanceTo(Sa);if(!(l<t.near||l>t.far))return{distance:l,point:vc.clone().applyMatrix4(r.matrixWorld),index:i,face:null,faceIndex:null,barycoord:null,object:r}}class Hg extends Ti{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new Pt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const _c=new te,bo=new Ir,cr=new Ei,hr=new I;class Gg extends Ae{constructor(t=new we,e=new Hg){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,s=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),cr.copy(n.boundingSphere),cr.applyMatrix4(i),cr.radius+=s,t.ray.intersectsSphere(cr)===!1)return;_c.copy(i).invert(),bo.copy(t.ray).applyMatrix4(_c);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,u=n.attributes.position;if(c!==null){const d=Math.max(0,a.start),f=Math.min(c.count,a.start+a.count);for(let g=d,x=f;g<x;g++){const m=c.getX(g);hr.fromBufferAttribute(u,m),yc(hr,m,l,i,t,e,this)}}else{const d=Math.max(0,a.start),f=Math.min(u.count,a.start+a.count);for(let g=d,x=f;g<x;g++)hr.fromBufferAttribute(u,g),yc(hr,g,l,i,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=i.length;s<a;s++){const o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function yc(r,t,e,n,i,s,a){const o=bo.distanceSqToPoint(r);if(o<e){const l=new I;bo.closestPointToPoint(r,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}class So extends Be{constructor(t,e,n,i,s,a,o,l,c){super(t,e,n,i,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Tn{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,i=this.getPoint(0),s=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),s+=n.distanceTo(i),e.push(s),i=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let i=0;const s=n.length;let a;e?a=e:a=t*n[s-1];let o=0,l=s-1,c;for(;o<=l;)if(i=Math.floor(o+(l-o)/2),c=n[i]-a,c<0)o=i+1;else if(c>0)l=i-1;else{l=i;break}if(i=l,n[i]===a)return i/(s-1);const h=n[i],d=n[i+1]-h,f=(a-h)/d;return(i+f)/(s-1)}getTangent(t,e){let i=t-1e-4,s=t+1e-4;i<0&&(i=0),s>1&&(s=1);const a=this.getPoint(i),o=this.getPoint(s),l=e||(a.isVector2?new gt:new I);return l.copy(o).sub(a).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new I,i=[],s=[],a=[],o=new I,l=new te;for(let f=0;f<=t;f++){const g=f/t;i[f]=this.getTangentAt(g,new I)}s[0]=new I,a[0]=new I;let c=Number.MAX_VALUE;const h=Math.abs(i[0].x),u=Math.abs(i[0].y),d=Math.abs(i[0].z);h<=c&&(c=h,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),s[0].crossVectors(i[0],o),a[0].crossVectors(i[0],s[0]);for(let f=1;f<=t;f++){if(s[f]=s[f-1].clone(),a[f]=a[f-1].clone(),o.crossVectors(i[f-1],i[f]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(De(i[f-1].dot(i[f]),-1,1));s[f].applyMatrix4(l.makeRotationAxis(o,g))}a[f].crossVectors(i[f],s[f])}if(e===!0){let f=Math.acos(De(s[0].dot(s[t]),-1,1));f/=t,i[0].dot(o.crossVectors(s[0],s[t]))>0&&(f=-f);for(let g=1;g<=t;g++)s[g].applyMatrix4(l.makeRotationAxis(i[g],f*g)),a[g].crossVectors(i[g],s[g])}return{tangents:i,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Vo extends Tn{constructor(t=0,e=0,n=1,i=1,s=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=i,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new gt){const n=e,i=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=i;for(;s>i;)s-=i;s<Number.EPSILON&&(a?s=0:s=i),this.aClockwise===!0&&!a&&(s===i?s=-i:s=s-i);const o=this.aStartAngle+t*s;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,f=c-this.aY;l=d*h-f*u+this.aX,c=d*u+f*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class Vg extends Vo{constructor(t,e,n,i,s,a){super(t,e,n,n,i,s,a),this.isArcCurve=!0,this.type="ArcCurve"}}function Wo(){let r=0,t=0,e=0,n=0;function i(s,a,o,l){r=s,t=o,e=-3*s+3*a-2*o-l,n=2*s-2*a+o+l}return{initCatmullRom:function(s,a,o,l,c){i(a,o,c*(o-s),c*(l-a))},initNonuniformCatmullRom:function(s,a,o,l,c,h,u){let d=(a-s)/c-(o-s)/(c+h)+(o-a)/h,f=(o-a)/h-(l-a)/(h+u)+(l-o)/u;d*=h,f*=h,i(a,o,d,f)},calc:function(s){const a=s*s,o=a*s;return r+t*s+e*a+n*o}}}const dr=new I,wa=new Wo,Ea=new Wo,Ta=new Wo;class Wg extends Tn{constructor(t=[],e=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=i}getPoint(t,e=new I){const n=e,i=this.points,s=i.length,a=(s-(this.closed?0:1))*t;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:l===0&&o===s-1&&(o=s-2,l=1);let c,h;this.closed||o>0?c=i[(o-1)%s]:(dr.subVectors(i[0],i[1]).add(i[0]),c=dr);const u=i[o%s],d=i[(o+1)%s];if(this.closed||o+2<s?h=i[(o+2)%s]:(dr.subVectors(i[s-1],i[s-2]).add(i[s-1]),h=dr),this.curveType==="centripetal"||this.curveType==="chordal"){const f=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(u),f),x=Math.pow(u.distanceToSquared(d),f),m=Math.pow(d.distanceToSquared(h),f);x<1e-4&&(x=1),g<1e-4&&(g=x),m<1e-4&&(m=x),wa.initNonuniformCatmullRom(c.x,u.x,d.x,h.x,g,x,m),Ea.initNonuniformCatmullRom(c.y,u.y,d.y,h.y,g,x,m),Ta.initNonuniformCatmullRom(c.z,u.z,d.z,h.z,g,x,m)}else this.curveType==="catmullrom"&&(wa.initCatmullRom(c.x,u.x,d.x,h.x,this.tension),Ea.initCatmullRom(c.y,u.y,d.y,h.y,this.tension),Ta.initCatmullRom(c.z,u.z,d.z,h.z,this.tension));return n.set(wa.calc(l),Ea.calc(l),Ta.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new I().fromArray(i))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function Mc(r,t,e,n,i){const s=(n-t)*.5,a=(i-e)*.5,o=r*r,l=r*o;return(2*e-2*n+s+a)*l+(-3*e+3*n-2*s-a)*o+s*r+e}function Xg(r,t){const e=1-r;return e*e*t}function $g(r,t){return 2*(1-r)*r*t}function qg(r,t){return r*r*t}function ws(r,t,e,n){return Xg(r,t)+$g(r,e)+qg(r,n)}function jg(r,t){const e=1-r;return e*e*e*t}function Yg(r,t){const e=1-r;return 3*e*e*r*t}function Kg(r,t){return 3*(1-r)*r*r*t}function Jg(r,t){return r*r*r*t}function Es(r,t,e,n,i){return jg(r,t)+Yg(r,e)+Kg(r,n)+Jg(r,i)}class Eh extends Tn{constructor(t=new gt,e=new gt,n=new gt,i=new gt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new gt){const n=e,i=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(Es(t,i.x,s.x,a.x,o.x),Es(t,i.y,s.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Zg extends Tn{constructor(t=new I,e=new I,n=new I,i=new I){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new I){const n=e,i=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(Es(t,i.x,s.x,a.x,o.x),Es(t,i.y,s.y,a.y,o.y),Es(t,i.z,s.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Th extends Tn{constructor(t=new gt,e=new gt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new gt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new gt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Qg extends Tn{constructor(t=new I,e=new I){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new I){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new I){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Ah extends Tn{constructor(t=new gt,e=new gt,n=new gt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new gt){const n=e,i=this.v0,s=this.v1,a=this.v2;return n.set(ws(t,i.x,s.x,a.x),ws(t,i.y,s.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class tx extends Tn{constructor(t=new I,e=new I,n=new I){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new I){const n=e,i=this.v0,s=this.v1,a=this.v2;return n.set(ws(t,i.x,s.x,a.x),ws(t,i.y,s.y,a.y),ws(t,i.z,s.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Rh extends Tn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new gt){const n=e,i=this.points,s=(i.length-1)*t,a=Math.floor(s),o=s-a,l=i[a===0?a:a-1],c=i[a],h=i[a>i.length-2?i.length-1:a+1],u=i[a>i.length-3?i.length-1:a+2];return n.set(Mc(o,l.x,c.x,h.x,u.x),Mc(o,l.y,c.y,h.y,u.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new gt().fromArray(i))}return this}}var bc=Object.freeze({__proto__:null,ArcCurve:Vg,CatmullRomCurve3:Wg,CubicBezierCurve:Eh,CubicBezierCurve3:Zg,EllipseCurve:Vo,LineCurve:Th,LineCurve3:Qg,QuadraticBezierCurve:Ah,QuadraticBezierCurve3:tx,SplineCurve:Rh});class ex extends Tn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new bc[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),i=this.getCurveLengths();let s=0;for(;s<i.length;){if(i[s]>=n){const a=i[s]-n,o=this.curves[s],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,e)}s++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,i=this.curves.length;n<i;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let i=0,s=this.curves;i<s.length;i++){const a=s[i],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(i.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const i=this.curves[e];t.curves.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(new bc[i.type]().fromJSON(i))}return this}}class nx extends ex{constructor(t){super(),this.type="Path",this.currentPoint=new gt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new Th(this.currentPoint.clone(),new gt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,i){const s=new Ah(this.currentPoint.clone(),new gt(t,e),new gt(n,i));return this.curves.push(s),this.currentPoint.set(n,i),this}bezierCurveTo(t,e,n,i,s,a){const o=new Eh(this.currentPoint.clone(),new gt(t,e),new gt(n,i),new gt(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new Rh(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,i,s,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,i,s,a),this}absarc(t,e,n,i,s,a){return this.absellipse(t,e,n,n,i,s,a),this}ellipse(t,e,n,i,s,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,n,i,s,a,o,l),this}absellipse(t,e,n,i,s,a,o,l){const c=new Vo(t,e,n,i,s,a,o,l);if(this.curves.length>0){const u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class Xo extends we{constructor(t=[new gt(0,-.5),new gt(.5,0),new gt(0,.5)],e=12,n=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:i},e=Math.floor(e),i=De(i,0,Math.PI*2);const s=[],a=[],o=[],l=[],c=[],h=1/e,u=new I,d=new gt,f=new I,g=new I,x=new I;let m=0,p=0;for(let _=0;_<=t.length-1;_++)switch(_){case 0:m=t[_+1].x-t[_].x,p=t[_+1].y-t[_].y,f.x=p*1,f.y=-m,f.z=p*0,x.copy(f),f.normalize(),l.push(f.x,f.y,f.z);break;case t.length-1:l.push(x.x,x.y,x.z);break;default:m=t[_+1].x-t[_].x,p=t[_+1].y-t[_].y,f.x=p*1,f.y=-m,f.z=p*0,g.copy(f),f.x+=x.x,f.y+=x.y,f.z+=x.z,f.normalize(),l.push(f.x,f.y,f.z),x.copy(g)}for(let _=0;_<=e;_++){const y=n+_*h*i,M=Math.sin(y),z=Math.cos(y);for(let A=0;A<=t.length-1;A++){u.x=t[A].x*M,u.y=t[A].y,u.z=t[A].x*z,a.push(u.x,u.y,u.z),d.x=_/e,d.y=A/(t.length-1),o.push(d.x,d.y);const T=l[3*A+0]*M,C=l[3*A+1],w=l[3*A+0]*z;c.push(T,C,w)}}for(let _=0;_<e;_++)for(let y=0;y<t.length-1;y++){const M=y+_*t.length,z=M,A=M+t.length,T=M+t.length+1,C=M+1;s.push(z,A,C),s.push(T,C,A)}this.setIndex(s),this.setAttribute("position",new Jt(a,3)),this.setAttribute("uv",new Jt(o,2)),this.setAttribute("normal",new Jt(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Xo(t.points,t.segments,t.phiStart,t.phiLength)}}class $o extends Xo{constructor(t=1,e=1,n=4,i=8){const s=new nx;s.absarc(0,-e/2,t,Math.PI*1.5,0),s.absarc(0,e/2,t,0,Math.PI*.5),super(s.getPoints(n),i),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:i}}static fromJSON(t){return new $o(t.radius,t.length,t.capSegments,t.radialSegments)}}class Dr extends we{constructor(t=1,e=32,n=0,i=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:t,segments:e,thetaStart:n,thetaLength:i},e=Math.max(3,e);const s=[],a=[],o=[],l=[],c=new I,h=new gt;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=e;u++,d+=3){const f=n+u/e*i;c.x=t*Math.cos(f),c.y=t*Math.sin(f),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[d]/t+1)/2,h.y=(a[d+1]/t+1)/2,l.push(h.x,h.y)}for(let u=1;u<=e;u++)s.push(u,u+1,0);this.setIndex(s),this.setAttribute("position",new Jt(a,3)),this.setAttribute("normal",new Jt(o,3)),this.setAttribute("uv",new Jt(l,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Dr(t.radius,t.segments,t.thetaStart,t.thetaLength)}}class Ur extends we{constructor(t=1,e=1,n=1,i=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;i=Math.floor(i),s=Math.floor(s);const h=[],u=[],d=[],f=[];let g=0;const x=[],m=n/2;let p=0;_(),a===!1&&(t>0&&y(!0),e>0&&y(!1)),this.setIndex(h),this.setAttribute("position",new Jt(u,3)),this.setAttribute("normal",new Jt(d,3)),this.setAttribute("uv",new Jt(f,2));function _(){const M=new I,z=new I;let A=0;const T=(e-t)/n;for(let C=0;C<=s;C++){const w=[],b=C/s,k=b*(e-t)+t;for(let X=0;X<=i;X++){const H=X/i,P=H*l+o,O=Math.sin(P),V=Math.cos(P);z.x=k*O,z.y=-b*n+m,z.z=k*V,u.push(z.x,z.y,z.z),M.set(O,T,V).normalize(),d.push(M.x,M.y,M.z),f.push(H,1-b),w.push(g++)}x.push(w)}for(let C=0;C<i;C++)for(let w=0;w<s;w++){const b=x[w][C],k=x[w+1][C],X=x[w+1][C+1],H=x[w][C+1];(t>0||w!==0)&&(h.push(b,k,H),A+=3),(e>0||w!==s-1)&&(h.push(k,X,H),A+=3)}c.addGroup(p,A,0),p+=A}function y(M){const z=g,A=new gt,T=new I;let C=0;const w=M===!0?t:e,b=M===!0?1:-1;for(let X=1;X<=i;X++)u.push(0,m*b,0),d.push(0,b,0),f.push(.5,.5),g++;const k=g;for(let X=0;X<=i;X++){const P=X/i*l+o,O=Math.cos(P),V=Math.sin(P);T.x=w*V,T.y=m*b,T.z=w*O,u.push(T.x,T.y,T.z),d.push(0,b,0),A.x=O*.5+.5,A.y=V*.5*b+.5,f.push(A.x,A.y),g++}for(let X=0;X<i;X++){const H=z+X,P=k+X;M===!0?h.push(P,P+1,H):h.push(P+1,P,H),C+=3}c.addGroup(p,C,M===!0?1:2),p+=C}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ur(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class qo extends Ur{constructor(t=1,e=1,n=32,i=1,s=!1,a=0,o=Math.PI*2){super(0,t,e,n,i,s,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:i,openEnded:s,thetaStart:a,thetaLength:o}}static fromJSON(t){return new qo(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Nr extends we{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};const s=[],a=[];o(i),c(n),h(),this.setAttribute("position",new Jt(s,3)),this.setAttribute("normal",new Jt(s.slice(),3)),this.setAttribute("uv",new Jt(a,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function o(_){const y=new I,M=new I,z=new I;for(let A=0;A<e.length;A+=3)f(e[A+0],y),f(e[A+1],M),f(e[A+2],z),l(y,M,z,_)}function l(_,y,M,z){const A=z+1,T=[];for(let C=0;C<=A;C++){T[C]=[];const w=_.clone().lerp(M,C/A),b=y.clone().lerp(M,C/A),k=A-C;for(let X=0;X<=k;X++)X===0&&C===A?T[C][X]=w:T[C][X]=w.clone().lerp(b,X/k)}for(let C=0;C<A;C++)for(let w=0;w<2*(A-C)-1;w++){const b=Math.floor(w/2);w%2===0?(d(T[C][b+1]),d(T[C+1][b]),d(T[C][b])):(d(T[C][b+1]),d(T[C+1][b+1]),d(T[C+1][b]))}}function c(_){const y=new I;for(let M=0;M<s.length;M+=3)y.x=s[M+0],y.y=s[M+1],y.z=s[M+2],y.normalize().multiplyScalar(_),s[M+0]=y.x,s[M+1]=y.y,s[M+2]=y.z}function h(){const _=new I;for(let y=0;y<s.length;y+=3){_.x=s[y+0],_.y=s[y+1],_.z=s[y+2];const M=m(_)/2/Math.PI+.5,z=p(_)/Math.PI+.5;a.push(M,1-z)}g(),u()}function u(){for(let _=0;_<a.length;_+=6){const y=a[_+0],M=a[_+2],z=a[_+4],A=Math.max(y,M,z),T=Math.min(y,M,z);A>.9&&T<.1&&(y<.2&&(a[_+0]+=1),M<.2&&(a[_+2]+=1),z<.2&&(a[_+4]+=1))}}function d(_){s.push(_.x,_.y,_.z)}function f(_,y){const M=_*3;y.x=t[M+0],y.y=t[M+1],y.z=t[M+2]}function g(){const _=new I,y=new I,M=new I,z=new I,A=new gt,T=new gt,C=new gt;for(let w=0,b=0;w<s.length;w+=9,b+=6){_.set(s[w+0],s[w+1],s[w+2]),y.set(s[w+3],s[w+4],s[w+5]),M.set(s[w+6],s[w+7],s[w+8]),A.set(a[b+0],a[b+1]),T.set(a[b+2],a[b+3]),C.set(a[b+4],a[b+5]),z.copy(_).add(y).add(M).divideScalar(3);const k=m(z);x(A,b+0,_,k),x(T,b+2,y,k),x(C,b+4,M,k)}}function x(_,y,M,z){z<0&&_.x===1&&(a[y]=_.x-1),M.x===0&&M.z===0&&(a[y]=z/2/Math.PI+.5)}function m(_){return Math.atan2(_.z,-_.x)}function p(_){return Math.atan2(-_.y,Math.sqrt(_.x*_.x+_.z*_.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Nr(t.vertices,t.indices,t.radius,t.details)}}class jo extends Nr{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,s,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new jo(t.radius,t.detail)}}class Yo extends Nr{constructor(t=1,e=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],i=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,i,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Yo(t.radius,t.detail)}}class Ts extends we{constructor(t=.5,e=1,n=32,i=1,s=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:i,thetaStart:s,thetaLength:a},n=Math.max(3,n),i=Math.max(1,i);const o=[],l=[],c=[],h=[];let u=t;const d=(e-t)/i,f=new I,g=new gt;for(let x=0;x<=i;x++){for(let m=0;m<=n;m++){const p=s+m/n*a;f.x=u*Math.cos(p),f.y=u*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/e+1)/2,g.y=(f.y/e+1)/2,h.push(g.x,g.y)}u+=d}for(let x=0;x<i;x++){const m=x*(n+1);for(let p=0;p<n;p++){const _=p+m,y=_,M=_+n+1,z=_+n+2,A=_+1;o.push(y,M,A),o.push(M,z,A)}}this.setIndex(o),this.setAttribute("position",new Jt(l,3)),this.setAttribute("normal",new Jt(c,3)),this.setAttribute("uv",new Jt(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ts(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Ko extends we{constructor(t=1,e=32,n=16,i=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:s,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const h=[],u=new I,d=new I,f=[],g=[],x=[],m=[];for(let p=0;p<=n;p++){const _=[],y=p/n;let M=0;p===0&&a===0?M=.5/e:p===n&&l===Math.PI&&(M=-.5/e);for(let z=0;z<=e;z++){const A=z/e;u.x=-t*Math.cos(i+A*s)*Math.sin(a+y*o),u.y=t*Math.cos(a+y*o),u.z=t*Math.sin(i+A*s)*Math.sin(a+y*o),g.push(u.x,u.y,u.z),d.copy(u).normalize(),x.push(d.x,d.y,d.z),m.push(A+M,1-y),_.push(c++)}h.push(_)}for(let p=0;p<n;p++)for(let _=0;_<e;_++){const y=h[p][_+1],M=h[p][_],z=h[p+1][_],A=h[p+1][_+1];(p!==0||a>0)&&f.push(y,M,A),(p!==n-1||l<Math.PI)&&f.push(M,z,A)}this.setIndex(f),this.setAttribute("position",new Jt(g,3)),this.setAttribute("normal",new Jt(x,3)),this.setAttribute("uv",new Jt(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ko(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Jo extends we{constructor(t=1,e=.4,n=12,i=48,s=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:i,arc:s},n=Math.floor(n),i=Math.floor(i);const a=[],o=[],l=[],c=[],h=new I,u=new I,d=new I;for(let f=0;f<=n;f++)for(let g=0;g<=i;g++){const x=g/i*s,m=f/n*Math.PI*2;u.x=(t+e*Math.cos(m))*Math.cos(x),u.y=(t+e*Math.cos(m))*Math.sin(x),u.z=e*Math.sin(m),o.push(u.x,u.y,u.z),h.x=t*Math.cos(x),h.y=t*Math.sin(x),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(g/i),c.push(f/n)}for(let f=1;f<=n;f++)for(let g=1;g<=i;g++){const x=(i+1)*f+g-1,m=(i+1)*(f-1)+g-1,p=(i+1)*(f-1)+g,_=(i+1)*f+g;a.push(x,m,_),a.push(m,p,_)}this.setIndex(a),this.setAttribute("position",new Jt(o,3)),this.setAttribute("normal",new Jt(l,3)),this.setAttribute("uv",new Jt(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Jo(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class Zn extends Ti{static get type(){return"MeshStandardMaterial"}constructor(t){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.color=new Pt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Pt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=sh,this.normalScale=new gt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Ch extends Ae{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Pt(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Ph extends Ch{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Ae.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Pt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const Aa=new te,Sc=new I,wc=new I;class ix{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new gt(512,512),this.map=null,this.mapPass=null,this.matrix=new te,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Bo,this._frameExtents=new gt(1,1),this._viewportCount=1,this._viewports=[new be(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Sc.setFromMatrixPosition(t.matrixWorld),e.position.copy(Sc),wc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(wc),e.updateMatrixWorld(),Aa.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Aa),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Aa)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class sx extends ix{constructor(){super(new gh(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class wo extends Ch{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ae.DEFAULT_UP),this.updateMatrix(),this.target=new Ae,this.shadow=new sx}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}const Ec=new te;class rx{constructor(t,e,n=0,i=1/0){this.ray=new Ir(t,e),this.near=n,this.far=i,this.camera=null,this.layers=new Oo,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,(e.near+e.far)/(e.near-e.far)).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):console.error("THREE.Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Ec.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Ec),this}intersectObject(t,e=!0,n=[]){return Eo(t,this,n,e),n.sort(Tc),n}intersectObjects(t,e=!0,n=[]){for(let i=0,s=t.length;i<s;i++)Eo(t[i],this,n,e);return n.sort(Tc),n}}function Tc(r,t){return r.distance-t.distance}function Eo(r,t,e,n){let i=!0;if(r.layers.test(t.layers)&&r.raycast(t,e)===!1&&(i=!1),i===!0&&n===!0){const s=r.children;for(let a=0,o=s.length;a<o;a++)Eo(s[a],t,e,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Po}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Po);function zh(r,t=!1){const e=r[0].index!==null,n=new Set(Object.keys(r[0].attributes)),i=new Set(Object.keys(r[0].morphAttributes)),s={},a={},o=r[0].morphTargetsRelative,l=new we;let c=0;for(let h=0;h<r.length;++h){const u=r[h];let d=0;if(e!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const f in u.attributes){if(!n.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;s[f]===void 0&&(s[f]=[]),s[f].push(u.attributes[f]),d++}if(d!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const f in u.morphAttributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;a[f]===void 0&&(a[f]=[]),a[f].push(u.morphAttributes[f])}if(t){let f;if(e)f=u.index.count;else if(u.attributes.position!==void 0)f=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,h),c+=f}}if(e){let h=0;const u=[];for(let d=0;d<r.length;++d){const f=r[d].index;for(let g=0;g<f.count;++g)u.push(f.getX(g)+h);h+=r[d].attributes.position.count}l.setIndex(u)}for(const h in s){const u=Ac(s[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,u)}for(const h in a){const u=a[h][0].length;if(u===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let d=0;d<u;++d){const f=[];for(let x=0;x<a[h].length;++x)f.push(a[h][x][d]);const g=Ac(f);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(g)}}return l}function Ac(r){let t,e,n,i=-1,s=0;for(let c=0;c<r.length;++c){const h=r[c];if(t===void 0&&(t=h.array.constructor),t!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(e===void 0&&(e=h.itemSize),e!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(i===-1&&(i=h.gpuType),i!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=h.count*e}const a=new t(s),o=new ze(a,e,n);let l=0;for(let c=0;c<r.length;++c){const h=r[c];if(h.isInterleavedBufferAttribute){const u=l/e;for(let d=0,f=h.count;d<f;d++)for(let g=0;g<e;g++){const x=h.getComponent(d,g);o.setComponent(d+u,g,x)}}else a.set(h.array,l);l+=h.count*e}return i!==void 0&&(o.gpuType=i),o}function Rc(r,t=0){r.beginPath();const e=120;for(let n=0;n<=e;n++){const i=n/e*Math.PI*2,s=Math.cos(i),a=Math.sin(i),o=Ie/2-1.2-t,l=Le/2-1.2-t,c=1/Math.pow(Math.abs(s)**3+Math.abs(a)**3,1/3),h=s*c*o,u=a*c*l;n===0?r.moveTo(h,u):r.lineTo(h,u)}r.closePath()}function Cc(){const r=[];for(let e=0;e<96;e++){const n=e/96*Math.PI*2,i=Math.cos(n),s=Math.sin(n),a=Ie/2-1.2,o=Le/2-1.2,l=1/Math.pow(Math.abs(i)**3+Math.abs(s)**3,1/3);r.push({x:i*l*a,z:s*l*o})}return r}function Qe(r,t,e,n,i){r.beginPath(),t.forEach((s,a)=>a?r.lineTo(s.x,s.z):r.moveTo(s.x,s.z)),r.lineWidth=e,r.strokeStyle=n,r.lineJoin="round",r.lineCap="round",r.setLineDash(i??[]),r.stroke(),r.setLineDash([])}function ax(r,t=3){let e=r;for(let n=0;n<t;n++){const i=[e[0]];for(let s=0;s<e.length-1;s++)i.push({x:e[s].x*.75+e[s+1].x*.25,z:e[s].z*.75+e[s+1].z*.25},{x:e[s].x*.25+e[s+1].x*.75,z:e[s].z*.25+e[s+1].z*.75});i.push(e[e.length-1]),e=i}return e}function kh(r,t){const e=new As(7);Rc(r);const n=r.createRadialGradient(0,0,10,0,0,80);if(n.addColorStop(0,"#3c8a5c"),n.addColorStop(.6,"#2f7a52"),n.addColorStop(1,"#276a4c"),r.fillStyle=n,r.fill(),r.save(),Rc(r),r.clip(),t){for(let i=0;i<2600;i++){const s=e.range(-76,76),a=e.range(-58,58);r.fillStyle=e.next()<.5?"rgba(20,70,50,0.22)":"rgba(110,190,120,0.18)",r.beginPath(),r.arc(s,a,e.range(.2,.9),0,Math.PI*2),r.fill()}for(let i=0;i<160;i++){const s=e.range(0,Math.PI*2),a=e.range(.9,1),o=Math.cos(s)*73*a,l=Math.sin(s)*55*a;r.fillStyle=e.next()<.5?"rgba(232,113,95,0.55)":"rgba(255,160,130,0.5)",r.beginPath(),r.arc(o,l,e.range(.4,1.4),0,Math.PI*2),r.fill()}}for(const i of[-1,1]){const s=[];for(let a=0;a<=24;a++){const o=i*(13+a/24*32);s.push({x:Math.sin(a*.5+i)*1.4,z:o})}if(Qe(r,s,8.4,"rgba(190,225,200,0.55)"),Qe(r,s,6.6,"#4fb0d8"),Qe(r,s,3.6,"#7fd0ee"),t)for(let a=0;a<40;a++){const o=s[Math.floor(e.range(0,s.length))];r.fillStyle="rgba(255,255,255,0.4)",r.fillRect(o.x+e.range(-2.5,2.5),o.z+e.range(-1,1),.9,.12)}}for(const i of Rs){const s=ax(i,3);Qe(r,s,10.6,"#8a6a30"),Qe(r,s,9.8,"#c9a85a"),Qe(r,s,9,"#e5d9ba"),Qe(r,s,7.2,"#efe6cd"),t&&Qe(r,s,.22,"rgba(120,95,50,0.5)",[1.2,1.6])}for(const i of[0,1]){const s=Ge[i],a=i===0?"rgba(80,160,255,":"rgba(255,100,80,";r.beginPath(),r.ellipse(s.engine.x*1.02,0,16,22,0,0,Math.PI*2),r.fillStyle="#d9ccaa",r.fill(),r.lineWidth=.7,r.strokeStyle="#a07a30",r.stroke(),r.beginPath(),r.ellipse(s.engine.x*1.02,0,12,18,0,0,Math.PI*2),r.fillStyle="#e9dfc4",r.fill(),r.beginPath(),r.arc(s.fountain.x,s.fountain.z,5.5,0,Math.PI*2),r.fillStyle=a+"0.35)",r.fill(),r.lineWidth=.5,r.strokeStyle=a+"0.9)",r.stroke(),Qe(r,[{x:s.engine.x,z:0},{x:s.engine.x*.55,z:0},{x:s.engine.x*.35,z:0}],4.2,"#cdbf9a")}r.beginPath(),r.arc(0,0,9.5,0,Math.PI*2),r.fillStyle="#7c7488",r.fill(),r.beginPath(),r.arc(0,0,7.4,0,Math.PI*2),r.fillStyle="#4a4258",r.fill(),r.lineWidth=.4,r.strokeStyle="rgba(255,90,210,0.8)";for(const i of[2.4,4.4,6.2])r.beginPath(),r.arc(0,0,i,0,Math.PI*2),r.stroke();Qe(r,[{x:-16,z:0},{x:-8,z:0}],4,"#a9a0b8"),Qe(r,[{x:8,z:0},{x:16,z:0}],4,"#a9a0b8");for(const i of Pr)i.kind==="small"||i.kind==="buff"?(r.beginPath(),r.arc(i.x,i.z,i.kind==="buff"?3.8:3,0,Math.PI*2),r.fillStyle="rgba(120,90,50,0.55)",r.fill()):i.kind==="catalyst"&&(r.beginPath(),r.arc(i.x,i.z,5,0,Math.PI*2),r.fillStyle="rgba(160,120,230,0.45)",r.fill(),r.lineWidth=.4,r.strokeStyle="rgba(255,255,255,0.7)",r.stroke());for(const i of Ps){const s=r.createRadialGradient(i.x,i.z,0,i.x,i.z,i.r);if(s.addColorStop(0,"#1d5a38"),s.addColorStop(.8,"#226a40"),s.addColorStop(1,"rgba(34,106,64,0)"),r.fillStyle=s,r.beginPath(),r.arc(i.x,i.z,i.r,0,Math.PI*2),r.fill(),t)for(let a=0;a<40;a++){const o=e.range(0,Math.PI*2),l=e.range(0,i.r*.9);r.strokeStyle=e.next()<.5?"rgba(120,220,140,0.5)":"rgba(10,50,30,0.6)",r.lineWidth=.18,r.beginPath(),r.moveTo(i.x+Math.cos(o)*l,i.z+Math.sin(o)*l),r.lineTo(i.x+Math.cos(o)*l+e.range(-.5,.5),i.z+Math.sin(o)*l-.9),r.stroke()}}for(const i of Cs)i.kind!=="struct"&&Qe(r,[{x:i.ax,z:i.az},{x:i.bx,z:i.bz}],i.r*2+.9,"rgba(10,25,20,0.35)");r.restore()}function ox(r){for(const t of Cs)t.kind!=="struct"&&Qe(r,[{x:t.ax,z:t.az},{x:t.bx,z:t.bz}],t.r*2,t.kind==="rock"?"#7a7a88":"#d8cdb0")}const ns=[3844351,16734794],ks=[3832831,16756736],Cr=new Map;function ct(r,t=0,e=0,n=.7,i=.1){const s=`s${r}-${t}-${e}-${n}-${i}`;let a=Cr.get(s);return a||(a=new Zn({color:r,emissive:t,emissiveIntensity:e,roughness:n,metalness:i,flatShading:!0}),Cr.set(s,a)),a}function $t(r,t=1){const e=`g${r}-${t}`;let n=Cr.get(e);return n||(n=new me({color:r,transparent:t<1,opacity:t}),Cr.set(e,n)),n}const Pc=new Map;function Ln(r,t){let e=Pc.get(r);return e||(e=t(),Pc.set(r,e)),e}const F={box:()=>Ln("box",()=>new rs(1,1,1)),sphere:()=>Ln("sph",()=>new Ko(.5,10,8)),cyl:()=>Ln("cyl",()=>new Ur(.5,.5,1,10)),cone:()=>Ln("cone",()=>new qo(.5,1,9)),octa:()=>Ln("oct",()=>new Yo(.5)),ico:()=>Ln("ico",()=>new jo(.5,0)),torus:()=>Ln("tor",()=>new Jo(.5,.06,6,24)),plane:()=>Ln("pln",()=>new En(1,1)),cap:()=>Ln("cap",()=>new $o(.3,.6,3,8))};function q(r,t,e={}){const n=new ge(r,t);return n.position.set(e.x??0,e.y??0,e.z??0),n.scale.set(e.sx??1,e.sy??e.sx??1,e.sz??e.sx??1),n.rotation.set(e.rx??0,e.ry??0,e.rz??0),n.castShadow=!0,n}function _e(r,t,e){const n=new Me;return n.position.set(r,t,e),n}function Ih(r){return{group:new Me,spinners:[],floaty:0,height:r,flashMats:[]}}function Lh(r){const t=Ih(2.2),e=t.group,n=new Me;e.add(n),t.body=n;const i=(s,a,o=.7,l=.26)=>{const c=_e(s,o,0);return c.add(q(F.box(),ct(a),{y:-o/2,sx:l,sy:o,sz:l})),e.add(c),c};switch(r){case"brannoch":{t.height=2.5,t.legL=i(-.24,5591114,.75,.34),t.legR=i(.24,5591114,.75,.34),n.add(q(F.box(),ct(13616818,0,0,.8,.15),{y:1.3,sx:1,sy:.9,sz:.65})),n.add(q(F.box(),ct(13933114,13933114,.25,.4,.7),{y:.88,sx:1.04,sy:.16,sz:.69})),n.add(q(F.sphere(),ct(13933114,0,0,.4,.7),{x:-.62,y:1.68,sx:.55,sy:.45,sz:.5})),n.add(q(F.sphere(),ct(13933114,0,0,.4,.7),{x:.62,y:1.68,sx:.55,sy:.45,sz:.5})),n.add(q(F.box(),ct(12168856),{y:1.98,sx:.5,sy:.46,sz:.5})),n.add(q(F.box(),$t(16760928),{y:1.98,z:.26,sx:.4,sy:.07,sz:.04})),t.armL=_e(-.66,1.55,0),t.armL.add(q(F.box(),ct(12168856),{y:-.4,sx:.28,sy:.8,sz:.28})),n.add(t.armL),t.armR=_e(.66,1.55,0),t.armR.add(q(F.box(),ct(12168856),{y:-.4,sx:.28,sy:.8,sz:.28}));const s=new Me;s.position.set(0,-.8,.1),s.add(q(F.cyl(),ct(6965802),{sx:.1,sy:1.5,sz:.1,rx:Math.PI/2,z:.5})),s.add(q(F.box(),ct(13933114,13933114,.2,.4,.7),{z:1.25,sx:.55,sy:.55,sz:.8})),t.armR.add(s),n.add(t.armR);break}case"suri":{t.legL=i(-.16,3811876,.75,.17),t.legR=i(.16,3811876,.75,.17),n.add(q(F.cone(),ct(15234634),{y:1.05,sx:.85,sy:1,sz:.65})),n.add(q(F.box(),ct(15784112),{y:1.45,sx:.5,sy:.5,sz:.34})),n.add(q(F.sphere(),ct(15911328),{y:1.9,sx:.46})),n.add(q(F.box(),$t(16765024),{y:1.93,z:.2,sx:.44,sy:.12,sz:.06})),n.add(q(F.cone(),ct(11552810),{y:2.2,sx:.5,sy:.35,sz:.5})),n.add(q(F.box(),ct(9067056),{x:.4,y:.95,z:-.2,sx:.3,sy:.4,sz:.22})),t.armL=_e(-.34,1.6,0),t.armL.add(q(F.box(),ct(15234634),{y:-.35,sx:.16,sy:.7,sz:.16})),n.add(t.armL),t.armR=_e(.34,1.6,0),t.armR.add(q(F.box(),ct(15234634),{y:-.35,sx:.16,sy:.7,sz:.16})),t.armR.add(q(F.cyl(),ct(4868696,0,0,.3,.8),{y:-.7,z:.5,sx:.14,sy:1.1,sz:.14,rx:Math.PI/2})),t.armR.add(q(F.sphere(),$t(16752704),{y:-.7,z:1.05,sx:.22})),n.add(t.armR);break}case"oru":{t.floaty=.3,n.add(q(F.cone(),ct(12167400,6967488,.15),{y:.95,sx:.95,sy:1.5,sz:.95,rx:Math.PI})),n.add(q(F.sphere(),ct(15787775),{y:1.95,sx:.5})),n.add(q(F.cone(),ct(6967488),{y:2.3,sx:.55,sy:.6,sz:.55}));for(let s=0;s<2;s++){const a=s===0?-1:1,o=q(F.plane(),new me({color:10481919,transparent:!0,opacity:.7,side:en}),{x:a*.7,y:1.5,z:-.2,sx:1.2,sy:1,ry:a*.6});n.add(o),t.spinners.push(o)}t.armL=_e(-.42,1.5,.1),t.armR=_e(.42,1.5,.1),n.add(t.armL,t.armR);for(let s=0;s<3;s++){const a=q(F.sphere(),$t(10481919),{sx:.16});a.userData.orbit=s,n.add(a),t.spinners.push(a)}break}case"kesh":{t.height=2.3,t.legL=i(-.28,3824186,.65,.3),t.legR=i(.28,3824186,.65,.3),n.add(q(F.sphere(),ct(5937752),{y:1.2,sx:1.05,sy:1.1,sz:.85,rx:.3})),n.add(q(F.sphere(),ct(7319652),{y:1.7,z:.2,sx:.55,sy:.5,sz:.55})),n.add(q(F.cone(),ct(15261872),{x:-.2,y:2.05,z:.2,sx:.12,sy:.45,sz:.12,rz:.3})),n.add(q(F.cone(),ct(15261872),{x:.2,y:2.05,z:.2,sx:.12,sy:.45,sz:.12,rz:-.3})),n.add(q(F.sphere(),$t(14280314),{x:-.14,y:1.74,z:.5,sx:.1})),n.add(q(F.sphere(),$t(14280314),{x:.14,y:1.74,z:.5,sx:.1}));for(let s=0;s<5;s++)n.add(q(F.cone(),ct(3828282),{x:(s-2)*.2,y:1.7-Math.abs(s-2)*.12,z:-.5,sx:.1,sy:.7,sz:.1,rx:-.9}));t.armL=_e(-.6,1.5,.1),t.armL.add(q(F.box(),ct(4882504),{y:-.45,sx:.3,sy:.9,sz:.3})),n.add(t.armL),t.armR=_e(.6,1.5,.1),t.armR.add(q(F.box(),ct(4882504),{y:-.45,sx:.3,sy:.9,sz:.3})),t.armR.add(q(F.box(),ct(10132096,14280314,.3),{y:-.9,z:.55,sx:.12,sy:.35,sz:1.3})),n.add(t.armR);break}case"ilyra":{t.height=2.6,n.add(q(F.cone(),ct(7311336,2769056,.2),{y:1.05,sx:1,sy:2,sz:1})),n.add(q(F.cyl(),ct(16769658,16769658,.3,.4,.6),{y:.95,sx:.62,sy:.12,sz:.62})),n.add(q(F.sphere(),ct(16112832),{y:2.05,sx:.46})),n.add(q(F.cone(),ct(3820192),{y:2.55,sx:.7,sy:.75,sz:.7})),n.add(q(F.cyl(),ct(3820192),{y:2.28,sx:.8,sy:.06,sz:.8})),t.armL=_e(-.42,1.55,.1),t.armR=_e(.42,1.55,.1),t.armR.add(q(F.cyl(),ct(8018480),{y:-.2,z:.3,sx:.07,sy:1.8,sz:.07,rx:.3})),t.armR.add(q(F.octa(),$t(16769658),{y:.7,z:.5,sx:.28})),n.add(t.armL,t.armR);const s=new Me;s.position.set(-.85,1.7,.2),s.add(q(F.box(),ct(9058858),{sx:.5,sy:.07,sz:.38})),s.add(q(F.box(),$t(16773312),{y:.05,sx:.44,sy:.04,sz:.32})),s.userData.book=!0,n.add(s),t.spinners.push(s);break}case"vey":{t.legL=i(-.14,2105388,.8,.15),t.legR=i(.14,2105388,.8,.15),n.add(q(F.box(),ct(15133183,8423679,.1),{y:1.3,sx:.5,sy:.7,sz:.3})),n.add(q(F.cone(),ct(2763328),{y:.95,z:-.15,sx:.8,sy:1.1,sz:.6,rx:.1})),n.add(q(F.sphere(),ct(15786208),{y:1.88,sx:.4})),n.add(q(F.cone(),ct(2763328),{y:2,z:-.05,sx:.55,sy:.7,sz:.55})),n.add(q(F.box(),$t(16734930),{y:1.86,z:.2,sx:.34,sy:.05,sz:.04})),t.armL=_e(-.34,1.55,0),t.armL.add(q(F.box(),ct(15133183),{y:-.35,sx:.13,sy:.7,sz:.13})),t.armL.add(q(F.octa(),$t(16751336),{y:-.8,z:.3,sx:.2,sy:.9,sz:.1})),n.add(t.armL),t.armR=_e(.34,1.55,0),t.armR.add(q(F.box(),ct(15133183),{y:-.35,sx:.13,sy:.7,sz:.13})),t.armR.add(q(F.octa(),$t(16734930),{y:-.8,z:.3,sx:.2,sy:1,sz:.1})),n.add(t.armR);break}default:n.add(q(F.cap(),ct(13421772),{y:1}))}return e.traverse(s=>{s.isMesh&&(s.castShadow=!0)}),t}function Dh(r,t,e,n,i,s=!1){const a=Math.sin(t*11)*.75*e;r.legL&&(r.legL.rotation.x=a),r.legR&&(r.legR.rotation.x=-a),r.body&&(r.body.position.y=r.floaty?r.floaty+Math.sin(t*2.4)*.12:Math.abs(Math.sin(t*11))*.07*e,r.body.rotation.x=e*.12),r.armL&&(r.armL.rotation.x=-a*.8),r.armR&&(r.armR.rotation.x=a*.8-n*1.9),i==="brannoch"&&r.armR&&(r.armR.rotation.x=a*.5-n*2.4);for(const o of r.spinners)if(o.userData.orbit!==void 0){const l=t*2+o.userData.orbit*2.1;o.position.set(Math.cos(l)*.9,1.5+Math.sin(t*3+o.userData.orbit)*.2,Math.sin(l)*.9)}else o.userData.book?(o.position.y=1.7+Math.sin(t*2)*.1,o.rotation.y=t*.8,o.rotation.z=Math.sin(t*1.4)*.15):o.rotation.y=(o.position.x<0?-1:1)*(.6+Math.sin(t*9)*.35);s?r.group.rotation.x=-1.4:r.group.rotation.x=0}function zc(r){const t=[];for(const e of r){const n=e.g.index?e.g.toNonIndexed():e.g.clone(),i=new te().compose(new I(e.o.x??0,e.o.y??0,e.o.z??0),new oi().setFromEuler(new ln(e.o.rx??0,e.o.ry??0,e.o.rz??0)),new I(e.o.sx??1,e.o.sy??e.o.sx??1,e.o.sz??e.o.sx??1));n.applyMatrix4(i),n.deleteAttribute("uv");const s=new Pt(e.c),a=n.attributes.position.count,o=new Float32Array(a*3);for(let l=0;l<a;l++)o[l*3]=s.r,o[l*3+1]=s.g,o[l*3+2]=s.b;n.setAttribute("color",new ze(o,3)),t.push(n)}return t.length?zh(t,!1):null}const kc=new Map;function lx(r,t){const e=`${r}${t}`;let n=kc.get(e);if(n)return n;const i=ns[t],s=[],a=[],o=t===0?2779816:11024944;switch(r){case"guard":s.push({g:F.cap(),c:o,o:{y:.65,sx:1}},{g:F.sphere(),c:13616818,o:{y:1.25,sx:.42}},{g:F.cone(),c:12168856,o:{y:1.5,sx:.4,sy:.3}},{g:F.box(),c:13616818,o:{x:-.32,y:.75,z:.1,sx:.12,sy:.55,sz:.4}},{g:F.cyl(),c:6965802,o:{x:.3,y:.7,z:.2,sx:.06,sy:.9,sz:.06}}),a.push({g:F.sphere(),c:i,o:{y:.92,z:.26,sx:.14}});break;case"bolt":s.push({g:F.cone(),c:o,o:{y:.6,sx:.55,sy:1.1,sz:.55}},{g:F.sphere(),c:15784120,o:{y:1.3,sx:.34}},{g:F.cone(),c:3816026,o:{y:1.6,sx:.4,sy:.4}},{g:F.cyl(),c:6965802,o:{x:.28,y:.8,z:.1,sx:.05,sy:1.4,sz:.05}}),a.push({g:F.octa(),c:i,o:{x:.28,y:1.55,z:.1,sx:.22}});break;case"siege":s.push({g:F.box(),c:o,o:{y:.55,sx:.9,sy:.5,sz:1.2}},{g:F.cyl(),c:4868682,o:{y:.95,z:.5,sx:.28,sy:1.2,sz:.28,rx:Math.PI/2-.4}},{g:F.cyl(),c:6965802,o:{x:-.5,y:.35,sx:.55,sy:.12,sz:.55,rz:Math.PI/2}},{g:F.cyl(),c:6965802,o:{x:.5,y:.35,sx:.55,sy:.12,sz:.55,rz:Math.PI/2}}),a.push({g:F.sphere(),c:i,o:{y:1.1,z:.95,sx:.2}});break;default:s.push({g:F.cap(),c:3816008,o:{y:1,sx:1.9,sy:1.8,sz:1.9}},{g:F.box(),c:13933114,o:{x:-.7,y:1.9,sx:.6,sy:.35,sz:.6}},{g:F.box(),c:13933114,o:{x:.7,y:1.9,sx:.6,sy:.35,sz:.6}},{g:F.sphere(),c:5592426,o:{y:2.25,sx:.65}},{g:F.box(),c:10132138,o:{x:.8,y:1.3,z:.4,sx:.2,sy:1.8,sz:.5}}),a.push({g:F.box(),c:i,o:{y:2.25,z:.3,sx:.5,sy:.08,sz:.1}},{g:F.sphere(),c:i,o:{y:1.3,z:.52,sx:.3}})}return n={body:zc(s),glow:zc(a),height:r==="vanguard"?3:r==="siege"?1.6:1.9},kc.set(e,n),n}function cx(r,t){const e=Ih(t?3:1.4),n=e.group,i=new Me;n.add(i),e.body=i;const s=t?1.5:1;switch(r){case"hounds":i.add(q(F.box(),ct(5917290),{y:.5,sx:.5,sy:.45,sz:.9})),i.add(q(F.box(),ct(6969978),{y:.62,z:.55,sx:.36,sy:.34,sz:.4})),i.add(q(F.cone(),ct(3811914),{y:.55,z:-.6,sx:.12,sy:.6,sz:.12,rx:-1.2})),i.add(q(F.sphere(),$t(16743072),{x:-.1,y:.7,z:.72,sx:.07}),q(F.sphere(),$t(16743072),{x:.1,y:.7,z:.72,sx:.07})),e.legL=_e(-.2,.3,.3),e.legR=_e(.2,.3,-.3),e.legL.add(q(F.box(),ct(3811914),{y:-.15,sx:.12,sy:.35,sz:.12})),e.legR.add(q(F.box(),ct(3811914),{y:-.15,sx:.12,sy:.35,sz:.12})),n.add(e.legL,e.legR);break;case"crag":i.add(q(F.ico(),ct(9079446,0,0,.9),{y:.8*s,sx:1.4*s,sy:1.2*s,sz:1.3*s})),i.add(q(F.octa(),$t(8382719),{y:1.5*s,x:.2,sx:.4*s,sy:.8*s,sz:.3*s})),i.add(q(F.octa(),$t(8382719),{y:1.2*s,x:-.4*s,sx:.25*s,sy:.6*s,sz:.25*s,rz:.5})),e.armL=_e(-.8*s,1,0),e.armL.add(q(F.box(),ct(7368828),{y:-.3,sx:.4*s,sy:.8*s,sz:.4*s})),i.add(e.armL),e.armR=_e(.8*s,1,0),e.armR.add(q(F.box(),ct(7368828),{y:-.3,sx:.4*s,sy:.8*s,sz:.4*s})),i.add(e.armR);break;case"wisps":e.floaty=.6,i.add(q(F.sphere(),$t(10485720),{y:.5,sx:.5})),i.add(q(F.sphere(),$t(14221296,.5),{y:.5,sx:.85})),i.add(q(F.cone(),$t(8378552,.7),{y:.1,sx:.3,sy:.6,sz:.3,rx:Math.PI}));break;case"thorn":i.add(q(F.ico(),ct(3828282),{y:.7*s,sx:1.1*s,sy:.9*s,sz:1.1*s}));for(let a=0;a<8;a++){const o=a/8*Math.PI*2;i.add(q(F.cone(),ct(14213280),{x:Math.cos(o)*.55*s,y:(.8+a%2*.2)*s,z:Math.sin(o)*.55*s,sx:.14*s,sy:.7*s,sz:.14*s,rz:-Math.cos(o)*1,rx:Math.sin(o)*1}))}i.add(q(F.sphere(),$t(16748608),{y:.9*s,z:.5*s,sx:.16}));break;case"heartroot":i.add(q(F.cyl(),ct(5914672),{y:1.2,sx:1.1,sy:2.4,sz:1.1})),i.add(q(F.ico(),ct(3840602),{y:2.9,sx:2.6,sy:1.7,sz:2.6})),i.add(q(F.sphere(),$t(16738976),{y:1.6,z:.5,sx:.55}));for(let a=0;a<4;a++){const o=a*1.57;i.add(q(F.cone(),ct(5914672),{x:Math.cos(o)*.9,y:.3,z:Math.sin(o)*.9,sx:.3,sy:1.1,sz:.3,rz:-Math.cos(o)*.9,rx:Math.sin(o)*.9}))}e.armL=_e(-.9,2,0),e.armR=_e(.9,2,0),i.add(e.armL,e.armR);break;case"cinder":i.add(q(F.ico(),ct(4864576,3346432,.3,.9),{y:1.3,sx:2.1,sy:2.3,sz:1.9})),i.add(q(F.sphere(),$t(16742960),{y:1.4,z:.7,sx:.8})),i.add(q(F.cone(),ct(14207136),{x:-.55,y:2.65,sx:.28,sy:1,sz:.28,rz:.3})),i.add(q(F.cone(),ct(14207136),{x:.55,y:2.65,sx:.28,sy:1,sz:.28,rz:-.3})),i.add(q(F.cone(),$t(16751152,.8),{y:3.3,sx:.5,sy:1.1,sz:.5})),e.armL=_e(-1.1,1.8,0),e.armR=_e(1.1,1.8,0),i.add(e.armL,e.armR);break;case"catalyst":e.floaty=1.2;for(let a=0;a<2;a++){const o=a?1:-1,l=q(F.octa(),$t(a?16743128:8382719),{x:o*1.2,y:1.4,sx:1.3,sy:2.4,sz:1.3});i.add(l),e.spinners.push(l)}i.add(q(F.torus(),$t(16777215,.8),{y:1.4,sx:5,sy:5,sz:5,rx:Math.PI/2})),i.add(q(F.sphere(),$t(16777215,.8),{y:1.4,sx:.8}));break;case"colossus":{e.height=7,i.add(q(F.ico(),ct(9079456,0,0,.9),{y:3.2,sx:4.2,sy:4.8,sz:3.8})),i.add(q(F.ico(),ct(8026768,0,0,.9),{y:6,sx:2.2,sy:1.8,sz:2})),i.add(q(F.sphere(),$t(16730832),{y:3.6,z:1.6,sx:1.7})),i.add(q(F.torus(),$t(16730832,.8),{y:3.6,sx:8,sy:8,sz:8,rx:Math.PI/2})),i.add(q(F.box(),$t(16752895),{y:6.2,z:.95,sx:1.4,sy:.18,sz:.1})),e.armL=_e(-2.5,4.3,0),e.armL.add(q(F.ico(),ct(8026768),{y:-1.5,sx:1.7,sy:3.4,sz:1.7})),i.add(e.armL),e.armR=_e(2.5,4.3,0),e.armR.add(q(F.ico(),ct(8026768),{y:-1.5,sx:1.7,sy:3.4,sz:1.7})),i.add(e.armR);for(let a=0;a<5;a++){const o=q(F.ico(),ct(6974080),{sx:.7+a%2*.3});o.userData.orbit=a,i.add(o),e.spinners.push(o)}break}default:i.add(q(F.sphere(),ct(8947848),{y:.6,sx:1}))}return n.traverse(a=>{a.isMesh&&(a.castShadow=!0)}),e}function hx(r,t,e,n,i){const s=Math.sin(t*10)*.7*e;r.legL&&(r.legL.rotation.x=s),r.legR&&(r.legR.rotation.x=-s),r.body&&(r.body.position.y=(r.floaty||0)+(r.floaty?Math.sin(t*2+1)*.15:Math.abs(Math.sin(t*10))*.05*e)),r.armL&&(r.armL.rotation.x=-s-n*1.4),r.armR&&(r.armR.rotation.x=s-n*1.8);for(const a of r.spinners)if(a.userData.orbit!==void 0){const o=t*.8+a.userData.orbit*1.25,l=4.6;a.position.set(Math.cos(o)*l,3+Math.sin(t*1.3+a.userData.orbit)*.6,Math.sin(o)*l),a.rotation.y=t}else i==="catalyst"&&(a.rotation.y=t*1.5)}function dx(r,t,e){const n=(e?ks:ns)[t],i=new Me,s=[],a=[],o=(x=1)=>{const m=new me({color:n,transparent:x<1,opacity:x});return a.push(m),m},l=ct(15327176,0,0,.85,.05),c=ct(13211450,4861960,.2,.35,.8),h=ct(4209232,0,0,.8,.2);let u=null,d=null,f=6;const g=(x,m)=>{i.add(q(F.cyl(),l,{y:.35*x,sx:2.5*x,sy:.7*x,sz:2.5*x})),i.add(q(F.cyl(),c,{y:.75*x,sx:2.2*x,sy:.14*x,sz:2.2*x})),i.add(q(F.cyl(),l,{y:2.2*x,sx:1.4*x,sy:2.9*x,sz:1.4*x}));for(let _=0;_<3;_++)i.add(q(F.cyl(),c,{y:(1.4+_*1)*x,sx:1.55*x,sy:.12*x,sz:1.55*x}));if(m)for(const _ of[-1,1])i.add(q(F.cyl(),l,{x:_*1.2*x,y:1.7*x,sx:.7*x,sy:2.4*x,sz:.7*x}));i.add(q(F.cyl(),h,{y:3.8*x,sx:1.8*x,sy:.3*x,sz:1.8*x})),u=q(F.octa(),o(),{y:4.9*x,sx:1*x,sy:1.9*x,sz:1*x}),u.castShadow=!1,i.add(u);const p=q(F.torus(),o(.85),{y:4.9*x,sx:2.6*x,sy:2.6*x,sz:2.6*x,rx:Math.PI/2.4});i.add(p),s.push(p),f=6.4*x};switch(r){case"outer":g(1,!1);break;case"inner":g(1.1,!1);break;case"guard":g(1.2,!1);break;case"core":g(1.35,!0);break;case"seal":{i.add(q(F.cyl(),l,{y:.3,sx:4.2,sy:.6,sz:4.2})),i.add(q(F.cyl(),c,{y:.65,sx:3.6,sy:.12,sz:3.6}));for(const m of[-1,1])i.add(q(F.box(),l,{x:m*1.7,y:2,sx:.7,sy:3.4,sz:.9}));const x=q(F.torus(),o(.9),{y:3.2,sx:4.2,sy:4.2,sz:4.2});x.scale.z=1,i.add(x),s.push(x),u=q(F.octa(),o(),{y:3.2,sx:1.1,sy:1.8,sz:1.1}),i.add(u),d=q(F.sphere(),new me({color:16743128,transparent:!0,opacity:.22,depthWrite:!1}),{y:1.8,sx:5.4,sy:4.4,sz:5.4}),d.castShadow=!1,i.add(d),f=5;break}case"engine":{i.add(q(F.cyl(),l,{y:.5,sx:6.2,sy:1,sz:6.2})),i.add(q(F.cyl(),c,{y:1.05,sx:5.4,sy:.18,sz:5.4}));const x=new Me;x.position.y=3.4,x.add(q(F.torus(),c,{sx:5,sy:5,sz:5,rx:Math.PI/2}));for(let p=0;p<12;p++){const _=p/12*Math.PI*2;x.add(q(F.box(),c,{x:Math.cos(_)*2.6,z:Math.sin(_)*2.6,sx:.5,sy:.4,sz:.5,ry:-_}))}i.add(x),s.push(x);const m=q(F.torus(),o(.9),{y:3.4,sx:3.4,sy:3.4,sz:3.4,rx:.5});i.add(m),s.push(m),u=q(F.sphere(),new me({color:16730832}),{y:3.4,sx:1.9}),u.castShadow=!1,i.add(u);for(const p of[-1,1])i.add(q(F.cyl(),l,{x:p*2.7,y:2,sx:.8,sy:2.6,sz:.8}));d=q(F.sphere(),new me({color:16743128,transparent:!0,opacity:.18,depthWrite:!1}),{y:2.8,sx:7.4,sy:6,sz:7.4}),d.castShadow=!1,i.add(d),f=7;break}}return{group:i,spin:s,crystal:u,shield:d,teamMats:a,height:f}}function ux(r,t){const e=(t?ks:ns)[r],n=new Me;return n.add(q(F.cyl(),ct(15327176),{y:.15,sx:9,sy:.3,sz:9})),n.add(q(F.cyl(),new me({color:8382719,transparent:!0,opacity:.55}),{y:.34,sx:7.4,sy:.05,sz:7.4})),n.add(q(F.torus(),new me({color:e}),{y:.4,sx:14,sy:14,sz:14,rx:Math.PI/2})),n.add(q(F.cyl(),ct(13211450,0,0,.4,.7),{y:.9,sx:1.2,sy:1.2,sz:1.2})),n.add(q(F.cone(),new me({color:10482943,transparent:!0,opacity:.7}),{y:2.2,sx:1.2,sy:2.2,sz:1.2})),n}function fx(r){const t=new Me;t.add(q(F.cyl(),ct(6969920),{y:.1,sx:.5,sy:.2,sz:.5}));const e=q(F.octa(),$t(r),{y:.65,sx:.4,sy:.55,sz:.4});return e.castShadow=!1,t.add(e),t.userData.eye=e,t}function Qn(r,t){const e=document.createElement("canvas");e.width=e.height=r,t(e.getContext("2d"),r);const n=new So(e);return n.colorSpace=Oe,n}class px{max;points;pos;col;size;alpha;vel;life;age;grav;base;head=0;low=!1;constructor(t=5e3){this.max=t,this.pos=new Float32Array(t*3),this.col=new Float32Array(t*3),this.size=new Float32Array(t),this.alpha=new Float32Array(t),this.vel=new Float32Array(t*3),this.life=new Float32Array(t),this.age=new Float32Array(t).fill(1e9),this.grav=new Float32Array(t),this.base=new Float32Array(t);const e=new we;e.setAttribute("position",new ze(this.pos,3).setUsage(Os)),e.setAttribute("color",new ze(this.col,3).setUsage(Os)),e.setAttribute("size",new ze(this.size,1).setUsage(Os)),e.setAttribute("alpha",new ze(this.alpha,1).setUsage(Os));const n=new Vn({transparent:!0,depthWrite:!1,blending:Mi,uniforms:{scale:{value:700}},vertexShader:`attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC; uniform float scale;
        void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }`,fragmentShader:"varying float vA; varying vec3 vC; void main(){ vec2 d = gl_PointCoord - 0.5; float r = length(d); if (r > 0.5) discard; float a = smoothstep(0.5, 0.0, r) * vA; gl_FragColor = vec4(vC * a * 1.4, a); }"});this.points=new Gg(e,n),this.points.frustumCulled=!1,this.points.renderOrder=20}setScale(t){this.points.material.uniforms.scale.value=t*.9}emit(t,e,n,i,s,a,o,l,c,h=0){const u=this.head;this.head=(this.head+1)%this.max,this.pos[u*3]=t,this.pos[u*3+1]=e,this.pos[u*3+2]=n,this.vel[u*3]=i,this.vel[u*3+1]=s,this.vel[u*3+2]=a;const d=new Pt(o);this.col[u*3]=d.r,this.col[u*3+1]=d.g,this.col[u*3+2]=d.b,this.base[u]=l,this.size[u]=l,this.life[u]=c,this.age[u]=0,this.grav[u]=h,this.alpha[u]=1}burst(t,e,n,i,s,a,o=.6,l=.35,c=4){const h=this.low?Math.ceil(s*.4):s;for(let u=0;u<h;u++){const d=Math.random()*Math.PI*2,f=Math.random()*1.2-.1,g=a*(.4+Math.random()*.8);this.emit(t,e,n,Math.cos(d)*g*Math.cos(f),Math.sin(f)*g+a*.3,Math.sin(d)*g*Math.cos(f),i,l*(.6+Math.random()*.8),o*(.6+Math.random()*.7),c)}}update(t){for(let n=0;n<this.max;n++){const i=this.age[n];if(i>=this.life[n]){this.alpha[n]=0;continue}this.age[n]=i+t,this.vel[n*3+1]-=this.grav[n]*t,this.pos[n*3]+=this.vel[n*3]*t,this.pos[n*3+1]+=this.vel[n*3+1]*t,this.pos[n*3+2]+=this.vel[n*3+2]*t,this.pos[n*3+1]<.05&&(this.pos[n*3+1]=.05,this.vel[n*3+1]*=-.3);const s=this.age[n]/this.life[n];this.alpha[n]=(1-s)*(s<.1?s*10:1),this.size[n]=this.base[n]*(1-s*.5)}const e=this.points.geometry;e.attributes.position.needsUpdate=!0,e.attributes.color.needsUpdate=!0,e.attributes.size.needsUpdate=!0,e.attributes.alpha.needsUpdate=!0}}class mx{group=new Me;tex;active=[];pool={};now=0;constructor(){const t=Qn(256,(l,c)=>{const h=l.createRadialGradient(c/2,c/2,c*.36,c/2,c/2,c/2);h.addColorStop(0,"rgba(255,255,255,0)"),h.addColorStop(.55,"rgba(255,255,255,0.95)"),h.addColorStop(.7,"rgba(255,255,255,0.35)"),h.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=h,l.fillRect(0,0,c,c)}),e=Qn(256,(l,c)=>{const h=l.createRadialGradient(c/2,c/2,0,c/2,c/2,c/2);h.addColorStop(0,"rgba(255,255,255,0.85)"),h.addColorStop(.7,"rgba(255,255,255,0.35)"),h.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=h,l.fillRect(0,0,c,c)}),n=Qn(256,(l,c)=>{l.beginPath(),l.arc(c/2,c/2,c/2-4,0,Math.PI*2),l.clip(),l.fillStyle="rgba(255,255,255,0.16)",l.fillRect(0,0,c,c),l.strokeStyle="rgba(255,255,255,0.28)",l.lineWidth=7;for(let h=-c;h<c*2;h+=26)l.beginPath(),l.moveTo(h,0),l.lineTo(h-c,c),l.stroke();l.restore?.()}),i=Qn(256,(l,c)=>{l.strokeStyle="rgba(255,255,255,1)",l.lineWidth=8,l.beginPath(),l.arc(c/2,c/2,c/2-6,0,Math.PI*2),l.stroke(),l.fillStyle="rgba(255,255,255,0.14)",l.beginPath(),l.arc(c/2,c/2,c/2-8,0,Math.PI*2),l.fill(),l.strokeStyle="rgba(255,255,255,0.3)",l.lineWidth=5,l.save(),l.beginPath(),l.arc(c/2,c/2,c/2-10,0,Math.PI*2),l.clip();for(let h=-c;h<c*2;h+=28)l.beginPath(),l.moveTo(h,0),l.lineTo(h-c,c),l.stroke();l.restore()}),s=Qn(256,(l,c)=>{const u=c/2;l.beginPath(),l.moveTo(8,u),l.arc(8,u,c-12,-.9,.9),l.closePath();const d=l.createRadialGradient(8,u,10,8,u,c-12);d.addColorStop(0,"rgba(255,255,255,0.15)"),d.addColorStop(1,"rgba(255,255,255,0.55)"),l.fillStyle=d,l.fill(),l.strokeStyle="rgba(255,255,255,0.95)",l.lineWidth=5,l.stroke()}),a=Qn(128,(l,c)=>{l.fillStyle="rgba(255,255,255,0.28)",l.fillRect(0,0,c,c),l.strokeStyle="rgba(255,255,255,0.3)",l.lineWidth=6;for(let h=-c;h<c*2;h+=20)l.beginPath(),l.moveTo(h,0),l.lineTo(h-c,c),l.stroke();l.strokeStyle="rgba(255,255,255,0.95)",l.lineWidth=8,l.strokeRect(3,3,c-6,c-6)}),o=Qn(64,(l,c)=>{const h=l.createLinearGradient(0,0,0,c);h.addColorStop(0,"rgba(255,255,255,0)"),h.addColorStop(.5,"rgba(255,255,255,1)"),h.addColorStop(1,"rgba(255,255,255,0)"),l.fillStyle=h,l.fillRect(0,0,c,c)});this.tex={ring:t,disc:e,zone:n,zoneEdge:i,cone:s,rect:a,beam:o}}get(t,e){const n=t;let s=(this.pool[n]??(this.pool[n]=[])).pop();if(!s){const a=new me({transparent:!0,depthWrite:!1,blending:Mi,side:en}),o=t==="ring"?this.tex.ring:t==="disc"?this.tex.disc:t==="cone"?this.tex.cone:t==="rect"?this.tex.rect:t==="beam"?this.tex.beam:t==="warn"?this.tex.zoneEdge:this.tex.zoneEdge;a.map=o;const l=new ge(new En(1,1),a);l.rotation.x=-Math.PI/2,l.renderOrder=10,s={mesh:l,mat:a,t0:0,dur:1,kind:t,r:1,sticky:!1,pulse:!1}}return s.mat.color.setHex(e),this.group.add(s.mesh),s}spawn(t,e,n,i,s,a,o=1,l=0,c={}){const h=this.get(t,s);h.t0=this.now,h.dur=a,h.r=i,h.sticky=!!c.sticky,h.pulse=!!c.pulse,h.follow=c.follow;const u=h.mesh;if(u.visible=!0,u.position.set(e,(c.y??.08)+(t==="beam"?.5:0),n),u.rotation.set(-Math.PI/2,0,0),t==="cone")u.rotation.z=-Math.atan2(l,o)+0,u.position.x=e,u.scale.set(i*1.08,i*1.08,1),u.position.x+=Math.cos(Math.atan2(l,o))*i*.5,u.position.z+=Math.sin(Math.atan2(l,o))*i*.5;else if(t==="rect"){u.rotation.z=-Math.atan2(l,o),u.scale.set(i,c.y!==void 0?1:3.2,1);const d=Math.atan2(l,o);u.position.x+=0,u.position.z+=0,u.userData.a=d}else if(t==="beam"){const d=Math.atan2(l,o);u.rotation.z=-d,u.scale.set(i,.9,1),u.position.x=e+Math.cos(d)*i/2,u.position.z=n+Math.sin(d)*i/2}else u.scale.set(i*2,i*2,1);return h.mat.opacity=1,this.active.push(h),h}update(t){this.now=t;for(let e=this.active.length-1;e>=0;e--){const n=this.active[e],i=(t-n.t0)/n.dur;if(i>=1){n.mesh.visible=!1,this.group.remove(n.mesh),this.active.splice(e,1),this.pool[n.kind].push(n);continue}const s=n.mesh;if(n.follow){const a=n.follow();a&&(s.position.x=a.x,s.position.z=a.z)}if(n.kind==="ring"){const a=n.r*2*(.35+.65*Math.min(1,i*1.6));s.scale.set(a,a,1),n.mat.opacity=1-i*i}else if(n.kind==="disc")n.mat.opacity=(1-i)*.8;else if(n.kind==="beam")n.mat.opacity=1-i,s.scale.y=.9*(1-i*.7);else if(n.kind==="cone"||n.kind==="rect")n.mat.opacity=i<.15?i/.15:(1-i)*1.1;else if(n.kind==="warn"){const a=n.r*2;s.scale.set(a,a,1),n.mat.opacity=.45+.35*Math.sin(i*22)}else n.mat.opacity=n.pulse?.7+.25*Math.sin(t*5):Math.min(.9,(1-i)*3)}}clear(){for(const t of this.active)t.mesh.visible=!1,this.group.remove(t.mesh),this.pool[t.kind].push(t);this.active=[]}}function gx(r,t){const e=new me({map:r,color:t,transparent:!0,depthWrite:!1,blending:Mi,side:en,opacity:.85}),n=new ge(new En(1,1),e);return n.rotation.x=-Math.PI/2,n.renderOrder=9,n}function xx(){return Qn(256,(r,t)=>{r.fillStyle="rgba(255,255,255,0.13)",r.beginPath(),r.arc(t/2,t/2,t/2-8,0,Math.PI*2),r.fill(),r.save(),r.beginPath(),r.arc(t/2,t/2,t/2-10,0,Math.PI*2),r.clip(),r.strokeStyle="rgba(255,255,255,0.22)",r.lineWidth=5;for(let e=-t;e<t*2;e+=28)r.beginPath(),r.moveTo(e,0),r.lineTo(e-t,t),r.stroke();r.restore(),r.strokeStyle="rgba(255,255,255,1)",r.lineWidth=8,r.beginPath(),r.arc(t/2,t/2,t/2-6,0,Math.PI*2),r.stroke()})}const ur=160,mn=new te,_s=new oi,Ze=new I,ys=new I,fr=new I(0,1,0);class vx{canvas;renderer;scene=new Sh;camera=new tn(45,16/9,1,400);particles=new px(5200);decals=new mx;sim=null;settings;cam={x:-55,z:0,height:34,shake:0,lock:!0,lookAhead:{x:0,z:0}};sun;views=new Map;minionPools=new Map;projViews=new Map;zoneViews=new Map;wallViews=new Map;fogCanvas;fogCtx;fogTex;fogMesh;fogTimer=0;fogOutline=Cc();zoneTex=xx();world=new Me;dyn=new Me;towerLines=[];clouds=[];fountains=[];hoverId=0;clock=0;lastTime=0;indicator=new Me;indRange;indShape;width=1280;height=720;pr=1;constructor(t,e){this.canvas=t,this.settings=e,this.renderer=new bh({canvas:t,antialias:!0,powerPreference:"high-performance",alpha:!1}),this.renderer.outputColorSpace=Oe,this.renderer.toneMapping=qc,this.renderer.toneMappingExposure=1.05,this.scene.background=new Pt(662070),this.scene.fog=new Go(662070,110,260),this.scene.add(this.world,this.dyn,this.particles.points,this.decals.group),this.scene.add(new Ph(16774372,5798496,1.15)),this.sun=new wo(16773328,2.4),this.sun.position.set(-26,52,22),this.sun.castShadow=!0;const n=this.sun.shadow.camera;n.left=-42,n.right=42,n.top=42,n.bottom=-42,n.near=5,n.far=140,this.sun.shadow.bias=-6e-4,this.scene.add(this.sun,this.sun.target),this.fogCanvas=document.createElement("canvas"),this.fogCanvas.width=300,this.fogCanvas.height=230,this.fogCtx=this.fogCanvas.getContext("2d"),this.fogTex=new So(this.fogCanvas),this.fogTex.minFilter=xn,this.fogMesh=new ge(new En(Ie+2,Le+2),new me({map:this.fogTex,transparent:!0,depthWrite:!1})),this.fogMesh.rotation.x=-Math.PI/2,this.fogMesh.position.y=.12,this.fogMesh.renderOrder=5,this.scene.add(this.fogMesh),this.indRange=new ge(new En(1,1),new me({transparent:!0,depthWrite:!1,blending:Mi,opacity:.6})),this.indShape=new ge(new En(1,1),new me({transparent:!0,depthWrite:!1,blending:Mi,opacity:.7}));for(const i of[this.indRange,this.indShape])i.rotation.x=-Math.PI/2,i.renderOrder=12,i.position.y=.1,this.indicator.add(i);this.indicator.visible=!1,this.scene.add(this.indicator),this.buildWorld(),this.applyQuality(),this.resize()}applyQuality(){const t=this.settings.quality;this.pr=t==="high"?Math.min(window.devicePixelRatio||1,2):t==="medium"?Math.min(window.devicePixelRatio||1,1.5):1,this.renderer.setPixelRatio(this.pr),this.renderer.shadowMap.enabled=t!=="low",this.renderer.shadowMap.type=t==="high"?Xc:zo,this.sun.castShadow=t!=="low";const e=t==="high"?2048:1024;this.sun.shadow.mapSize.x!==e&&(this.sun.shadow.mapSize.set(e,e),this.sun.shadow.map?.dispose(),this.sun.shadow.map=null),this.particles.low=this.settings.effects==="low"||t==="low",this.resize()}resize(){const t=this.canvas.clientWidth||window.innerWidth,e=this.canvas.clientHeight||window.innerHeight;this.width=t,this.height=e,this.renderer.setSize(t,e,!1),this.camera.aspect=t/e,this.camera.updateProjectionMatrix(),this.particles.setScale(e)}buildWorld(){const t=this.world,e=14,n=document.createElement("canvas");n.width=Math.round(Ie*e),n.height=Math.round(Le*e);const i=n.getContext("2d");i.setTransform(e,0,0,e,-bn*e,-Sn*e),i.fillStyle="#0a1a36",i.fillRect(bn,Sn,Ie,Le),kh(i,!0);const s=new So(n);s.colorSpace=Oe,s.anisotropy=8;const a=Cc(),o=[],l=[],c=[];o.push(0,0,0),l.push((0-bn)/Ie,1-(0-Sn)/Le),a.forEach(P=>{o.push(P.x,0,P.z),l.push((P.x-bn)/Ie,1-(P.z-Sn)/Le)});for(let P=0;P<a.length;P++)c.push(0,1+(P+1)%a.length,1+P);const h=new we;h.setAttribute("position",new Jt(o,3)),h.setAttribute("uv",new Jt(l,2)),h.setIndex(c),h.computeVertexNormals();const u=new ge(h,new Zn({map:s,roughness:.95,metalness:0}));u.receiveShadow=!0,t.add(u);const d=[],f=[],g=new Pt(6969976),x=new Pt(3813456),m=new Pt(2779722);for(let P=0;P<a.length;P++){const O=a[P],V=a[(P+1)%a.length],K=5+3*Math.sin(P*1.7),$=5+3*Math.sin((P+1)*1.7),nt=(dt,Mt,kt,qt)=>{d.push(dt,Mt,kt),f.push(qt.r,qt.g,qt.b)};nt(O.x,0,O.z,m),nt(V.x,0,V.z,m),nt(V.x*.92,-$,V.z*.92,x),nt(O.x,0,O.z,m),nt(V.x*.92,-$,V.z*.92,x),nt(O.x*.92,-K,O.z*.92,g),nt(O.x*.92,-K,O.z*.92,g),nt(V.x*.92,-$,V.z*.92,x),nt(0,-16,0,x)}const p=new we;p.setAttribute("position",new Jt(d,3)),p.setAttribute("color",new Jt(f,3)),p.computeVertexNormals();const _=new ge(p,new Zn({vertexColors:!0,flatShading:!0,roughness:1,side:en}));t.add(_);const y=new As(11);for(let P=0;P<16;P++){const O=y.range(0,Math.PI*2),V=y.range(1.12,1.6),K=q(F.ico(),ct(5917808,0,0,1),{x:Math.cos(O)*80*V,y:y.range(-18,-4),z:Math.sin(O)*62*V,sx:y.range(4,12),sy:y.range(3,8),sz:y.range(4,12),ry:y.range(0,3)}),$=q(F.cyl(),ct(3836506),{x:K.position.x,y:K.position.y+K.scale.y*.38,z:K.position.z,sx:K.scale.x*.9,sy:.6,sz:K.scale.z*.9});K.castShadow=!1,$.castShadow=!1,t.add(K,$)}for(let P=0;P<18;P++){const O=q(F.sphere(),new me({color:12572927,transparent:!0,opacity:.16,depthWrite:!1}),{x:y.range(-130,130),y:y.range(-22,-9),z:y.range(-100,100),sx:y.range(14,34),sy:2.2,sz:y.range(10,20)});O.castShadow=!1,this.clouds.push(O),t.add(O)}const M=[],z=[],A=[],T=(P,O,V,K,$,nt,dt,Mt,kt,qt)=>{const Y=P.index?P.toNonIndexed():P.clone();Y.applyMatrix4(new te().compose(new I(O,V,K),new oi().setFromEuler(new ln(0,Mt,0)),new I($,nt,dt))),Y.deleteAttribute("uv");const it=Y.attributes.position.count,yt=new Float32Array(it*3);for(let at=0;at<it;at++){const Rt=Math.sin(at*12.9898)*43758.5453%1,It=.88+Math.abs(Rt)*.2;yt[at*3]=kt.r*It,yt[at*3+1]=kt.g*It,yt[at*3+2]=kt.b*It}Y.setAttribute("color",new ze(yt,3)),qt.push(Y)};for(const P of Cs)if(P.kind!=="struct")if(P.kind==="rock"){const O=P.r*y.range(1.4,2.2);T(F.ico(),P.ax,O*.35,P.az,P.r*2.1,O,P.r*2.1,y.range(0,3),new Pt(9078432),M),T(F.ico(),P.ax+P.r*.6,O*.2,P.az-P.r*.4,P.r*1.2,O*.6,P.r*1.2,y.range(0,3),new Pt(7762574),M),T(F.octa(),P.ax-P.r*.2,O*.95,P.az+P.r*.1,P.r*.5,O*.8,P.r*.5,0,new Pt(8382719),M)}else{const O=Math.hypot(P.bx-P.ax,P.bz-P.az);if(O<.1){T(F.cyl(),P.ax,1.6,P.az,P.r*1.9,3.2,P.r*1.9,0,new Pt(14471866),z),T(F.cyl(),P.ax,3.3,P.az,P.r*2.2,.25,P.r*2.2,0,new Pt(9072704),z),T(F.octa(),P.ax,4.1,P.az,.6,1,.6,0,new Pt(8382719),z);continue}const V=Math.max(1,Math.round(O/1.8)),K=Math.atan2(P.bz-P.az,P.bx-P.ax);for(let $=0;$<=V;$++){const nt=V===0?0:$/V,dt=dn(P.ax,P.bx,nt),Mt=dn(P.az,P.bz,nt),kt=(P.kind==="pit"?1.6:2.6)*y.range(.85,1.2);T(F.box(),dt,kt/2,Mt,2.1,kt,P.r*2.2,-K,new Pt(P.kind==="pit"?9208992:14077108),P.kind==="pit"?A:z),T(F.box(),dt,kt+.06,Mt,2.2,.12,P.r*2.3,-K,new Pt(9073736),P.kind==="pit"?A:z)}}const C=new Zn({vertexColors:!0,flatShading:!0,roughness:.85});for(const P of[M,z,A]){if(!P.length)continue;const O=new ge(zh(P,!1),C);O.castShadow=!0,O.receiveShadow=!0,t.add(O)}const w=[],b=[];for(const P of Ps){const O=Math.round(P.r*P.r*.95);for(let V=0;V<O;V++){const K=y.range(0,Math.PI*2),$=Math.sqrt(y.next())*P.r*.95;b.push({x:P.x+Math.cos(K)*$,z:P.z+Math.sin(K)*$,s:y.range(.8,1.3)})}}for(let P=0;P<360;P++){const O=y.range(-72,72),V=y.range(-56,56);this.treeOk(O,V)&&w.push({x:O,z:V,s:y.range(.8,1.5)})}const k=new xs(F.cone(),new Zn({color:4173418,flatShading:!0,roughness:.9}),b.length);b.forEach((P,O)=>{mn.compose(Ze.set(P.x,.7*P.s,P.z),_s.setFromAxisAngle(fr,O),ys.set(.55*P.s,1.5*P.s,.55*P.s)),k.setMatrixAt(O,mn)}),k.castShadow=!1,t.add(k);const X=new xs(F.cyl(),new Zn({color:6965810,flatShading:!0}),w.length),H=new xs(F.cone(),new Zn({color:3119738,flatShading:!0,roughness:.8}),w.length*2);w.forEach((P,O)=>{mn.compose(Ze.set(P.x,.9*P.s,P.z),_s.identity(),ys.set(.35*P.s,1.8*P.s,.35*P.s)),X.setMatrixAt(O,mn),mn.compose(Ze.set(P.x,2.3*P.s,P.z),_s.setFromAxisAngle(fr,O),ys.set(1.9*P.s,2.6*P.s,1.9*P.s)),H.setMatrixAt(O*2,mn),mn.compose(Ze.set(P.x,3.5*P.s,P.z),_s.setFromAxisAngle(fr,O+1),ys.set(1.3*P.s,2*P.s,1.3*P.s)),H.setMatrixAt(O*2+1,mn)}),X.castShadow=!0,H.castShadow=!0,t.add(X,H);for(const P of[0,1]){const O=ux(P,this.settings.colorblind),V=Ge[P].fountain;O.position.set(V.x,0,V.z),t.add(O),this.fountains.push(O)}}treeOk(t,e){if(Math.abs(t)>71||Math.abs(e)>54||Math.hypot(t,e)<11)return!1;for(const n of this.laneCache())if(Math.hypot(n.x-t,n.z-e)<6.5)return!1;if(Math.abs(e)<14&&Math.abs(t)>40)return!1;for(const n of Pr)if(Math.hypot(n.x-t,n.z-e)<5)return!1;for(const n of Cs)if(Math.hypot(n.ax-t,n.az-e)<n.r+2)return!1;return Math.abs(t)*.02+Math.abs(e)*.02<2.2&&t*t/5184+e*e/2916<.9}laneSamples=null;laneCache(){if(this.laneSamples)return this.laneSamples;const t=[];for(const e of this.lanes())for(let n=0;n<e.length-1;n++)for(let i=0;i<1;i+=.1)t.push({x:dn(e[n].x,e[n+1].x,i),z:dn(e[n].z,e[n+1].z,i)});return this.laneSamples=t,t}lanes(){return _x}setSim(t){this.sim=t;for(const e of this.views.values())this.dyn.remove(e.group);this.views.clear();for(const e of this.projViews.values())this.dyn.remove(e);this.projViews.clear();for(const e of this.zoneViews.values())this.dyn.remove(e);this.zoneViews.clear();for(const e of this.wallViews.values())this.dyn.remove(e);this.wallViews.clear();for(const e of this.minionPools.values())this.dyn.remove(e.body),e.glow&&this.dyn.remove(e.glow);if(this.minionPools.clear(),this.decals.clear(),t){const e=t.player;this.cam.x=e.x,this.cam.z=e.z}}teamColor(t){return(this.settings.colorblind?ks:ns)[t]??16777215}visibleToPlayer(t){const e=this.sim;return t.team===e.player.team||t.kind==="tower"||t.kind==="seal"||t.kind==="core"||t.kind==="engine"?!0:t.visUntil[e.player.team]>e.time}createView(t){const e=new Me,n={id:t.id,kind:t.kind,group:e,atk:0,prevAtk:0,px:t.x,pz:t.z,speed:0,dead:!1,wasVisible:!1,fadeIn:0,height:2},i=this.teamColor(t.team);if(t.kind==="hero"||t.kind==="decoy"){const s=t.kind==="hero"?t.hero.heroId:this.sim.byId.get(t.owner)?.hero?.heroId??"vey";n.heroId=s,n.rig=Lh(s),n.height=n.rig.height*1.45;const a=new Me;a.scale.setScalar(1.45),a.add(n.rig.group),e.add(a),t.kind==="decoy"&&n.rig.group.traverse(c=>{const h=c;if(h.isMesh){const u=h.material.clone();u.transparent=!0,u.opacity=.55,h.material=u}});const o=new ge(new Ts(t.radius*1.25,t.radius*1.55,32),new me({color:i,transparent:!0,opacity:.9,depthWrite:!1}));o.rotation.x=-Math.PI/2,o.position.y=.09,o.renderOrder=6,e.add(o),n.ring=o;const l=new ge(new Dr(t.radius*1.25,28),new me({color:i,transparent:!0,opacity:.16,depthWrite:!1}));l.rotation.x=-Math.PI/2,l.position.y=.085,l.renderOrder=6,e.add(l)}else if(t.kind==="monster"){const s=t.camp.family;n.family=s;const a=t.radius>.85;n.rig=cx(s,a),n.height=n.rig.height,n.rig.group.scale.setScalar(s==="colossus"||s==="catalyst"?1:t.radius/(a?1:.5)*(a?.85:1)),e.add(n.rig.group);const o=new ge(new Ts(t.radius*1.1,t.radius*1.25,28),new me({color:16765024,transparent:!0,opacity:.5,depthWrite:!1}));o.rotation.x=-Math.PI/2,o.position.y=.09,e.add(o)}else if(t.stype){n.srig=dx(t.stype,t.team,this.settings.colorblind),n.height=n.srig.height,e.add(n.srig.group);const s=t.radius*1.5,a=new ge(new Ts(s,s+.3,40),new me({color:i,transparent:!0,opacity:.85,depthWrite:!1}));a.rotation.x=-Math.PI/2,a.position.y=.09,a.renderOrder=6,e.add(a),n.ring=a,e.rotation.y=t.team===0?.3:-.3+Math.PI}else t.kind==="ward"&&(e.add(fx(i)),n.height=1);return e.position.set(t.x,0,t.z),this.dyn.add(e),n}minionPool(t,e){const n=`${t}${e}`;let i=this.minionPools.get(n);if(i)return i;const s=lx(t,e),a=new xs(s.body,new Zn({vertexColors:!0,flatShading:!0,roughness:.75}),ur);a.castShadow=this.renderer.shadowMap.enabled,a.count=0,a.frustumCulled=!1;let o=null;return s.glow&&(o=new xs(s.glow,new me({vertexColors:!0}),ur),o.count=0,o.frustumCulled=!1,this.dyn.add(o)),this.dyn.add(a),i={body:a,glow:o,n:0,height:s.height},this.minionPools.set(n,i),i}render(t,e){const n=this.sim,i=Math.min(.1,Math.max(.001,t-this.lastTime||.016));this.lastTime=t,this.clock+=i,this.updateCamera(i),this.decals.update(this.clock),n&&this.syncUnits(n,e,i),n&&(this.syncProjectiles(n,e),this.syncZones(n),this.syncWalls(n),this.syncTowerLines(n,e),this.updateFog(n,i)),this.particles.update(i);for(const s of this.clouds)s.position.x+=i*.6,s.position.x>140&&(s.position.x=-140);this.sun.position.set(this.cam.x-26,52,this.cam.z+22),this.sun.target.position.set(this.cam.x,0,this.cam.z),this.sun.target.updateMatrixWorld(),this.renderer.render(this.scene,this.camera)}updateCamera(t){const e=this.sim;e&&this.cam.lock&&(this.cam.x=dn(this.cam.x,e.player.x,Math.min(1,t*10)),this.cam.z=dn(this.cam.z,e.player.z,Math.min(1,t*10))),this.cam.x=re(this.cam.x,-66,66),this.cam.z=re(this.cam.z,-52,52);const n=this.cam.height,i=52*Math.PI/180,a=n/Math.tan(i)/Math.SQRT2;let o=0,l=0;this.cam.shake>.001&&(o=(Math.random()-.5)*this.cam.shake,l=(Math.random()-.5)*this.cam.shake,this.cam.shake*=.86),this.camera.position.set(this.cam.x-a+o,n,this.cam.z+a+l),this.camera.lookAt(this.cam.x+o,0,this.cam.z+l)}addShake(t){this.cam.shake=Math.min(.6,this.cam.shake+t*this.settings.shake)}syncUnits(t,e,n){const i=new Set,s=new Map,a=t.player.team,o=t.time;for(const l of t.units){if(l.kind==="minion"){if(l.dead||!this.visibleToPlayer(l))continue;const g=this.minionPool(l.mtype,l.team),x=g.n++;if(x>=ur){g.n=ur;continue}const m=dn(l.px,l.x,e),p=dn(l.pz,l.z,e),_=Sr(l.pfacing,l.facing,e),M=Math.hypot(l.x-l.px,l.z-l.pz)>.01?Math.abs(Math.sin(this.clock*9+l.id))*.07:0;let z=0;l.atkRelease>0&&(z=l.projSpeed>0?0:Math.sin(re(1-(l.atkRelease-o)/l.windup,0,1)*Math.PI)*.25);const A=l.scale>1?1.12:1;mn.compose(Ze.set(m+Math.cos(_)*z,M,p+Math.sin(_)*z),_s.setFromAxisAngle(fr,-_+Math.PI/2),ys.set(A,A,A)),g.body.setMatrixAt(x,mn),g.glow?.setMatrixAt(x,mn);continue}if(l.dead&&l.kind!=="hero")continue;i.add(l.id);let c=this.views.get(l.id);c||(c=this.createView(l),this.views.set(l.id,c));const h=this.visibleToPlayer(l)&&!(l.kind==="hero"&&l.dead);if(c.group.visible=h,!h){c.wasVisible=!1;continue}const u=dn(l.px,l.x,e),d=dn(l.pz,l.z,e);c.group.position.x=u,c.group.position.z=d;const f=Math.hypot(u-c.px,d-c.pz);if(c.px=u,c.pz=d,c.speed=dn(c.speed,re(f/n/3.6,0,1.4),.25),c.rig){const g=Sr(l.pfacing,l.facing,e);c.rig.group.rotation.y=-g+Math.PI/2,l.atkRelease>0?c.atk=Math.max(c.atk,re(1-(l.atkRelease-o)/Math.max(.05,l.windup),0,1)*.6):c.prevAtk>0&&(c.atk=1),c.prevAtk=l.atkRelease,l.cast&&l.hero&&(c.atk=Math.max(c.atk,.8)),c.atk=Math.max(0,c.atk-n*3.5),c.heroId&&c.kind!=="monster"?Dh(c.rig,this.clock+l.id,c.speed,c.atk,c.heroId,!1):c.family&&hx(c.rig,this.clock+l.id,c.speed,c.atk,c.family);const x=(l.kind==="hero",1);if(c.rig.group.scale.y=x,l.kind==="hero"&&l.dash&&l.dash.kind==="leap"?c.group.position.y=Math.sin(re((o-l.dash.t0)/l.dash.dur,0,1)*Math.PI)*4:l.kind==="hero"&&this.sim.has(l,"airborne")?c.group.position.y=1.5+Math.sin(this.clock*6)*.2:c.group.position.y=0,l.kind==="hero"&&c.ring){const m=l===t.player;c.ring.material.color.setHex(m?16769162:this.teamColor(l.team)),c.ring.scale.setScalar(m?1.12:1);const p=l.hushed||t.has(l,"stun")||t.has(l,"root");c.ring.material.opacity=p?.55+.4*Math.sin(this.clock*12):.92}l.kind==="hero"&&l.team!==a&&l.brush>0&&(c.rig.group.visible=!0)}if(c.srig){for(const x of c.srig.spin)x.rotation.y=this.clock*(c.kind==="engine"?.8:.6);c.srig.crystal&&(c.srig.crystal.position.y+=Math.sin(this.clock*2+l.id)*.002,c.srig.crystal.rotation.y=this.clock),c.srig.shield&&(c.srig.shield.visible=l.invuln&&!l.dead);const g=o-l.lastDamagedAt<.12;c.group.scale.setScalar(g?1.012:1),(l.stype==="engine"||l.stype==="seal")&&c.srig.spin.forEach((x,m)=>{m===0&&l.stype==="engine"&&(x.rotation.z=this.clock*.5)})}if(l.kind==="ward"){const g=c.group.children[0]?.userData.eye;g&&(g.rotation.y=this.clock*2,g.position.y=.65+Math.sin(this.clock*3)*.08),c.group.visible=h&&l.disabledUntil<=t.time?!0:h}this.hoverId===l.id&&c.ring&&c.ring.scale.setScalar(1.25)}for(const[l,c]of this.views)if(!i.has(l)){const h=t.byId.get(l);(!h||h.dead&&h.kind!=="hero")&&(this.dyn.remove(c.group),this.views.delete(l))}for(const[l,c]of this.minionPools)c.body.count=c.n,c.body.instanceMatrix.needsUpdate=!0,c.glow&&(c.glow.count=c.n,c.glow.instanceMatrix.needsUpdate=!0),s.set(l,c.n),c.n=0;for(const l of this.fountains)l.children[4]?.scale.set(1.2,2.2+Math.sin(this.clock*4)*.25,1.2)}syncProjectiles(t,e){const n=new Set,i=t.player.team;for(const s of t.projectiles){const a=t.byId.get(s.owner);if(s.team!==i&&a&&!this.visibleToPlayer(a)&&!t.pointVisible(i,s.x,s.z))continue;n.add(s.id);let o=this.projViews.get(s.id);o||(o=this.makeProjectile(s),this.projViews.set(s.id,o),this.dyn.add(o));const l=s.x-s.dx*(1-e)*s.speed/30*(s.homing?0:1),c=s.z-s.dz*(1-e)*s.speed/30*(s.homing?0:1);o.position.set(l,s.kind==="tower"?4:1,c),s.fx,o.rotation.y=-Math.atan2(s.dz,s.dx),Math.random()<(this.particles.low?.25:.8)&&this.particles.emit(l,o.position.y,c,(Math.random()-.5)*.6,Math.random()*.6,(Math.random()-.5)*.6,s.color,s.fx==="wave"?.7:.4,.4,0)}for(const[s,a]of this.projViews)n.has(s)||(this.dyn.remove(a),this.projViews.delete(s))}makeProjectile(t){const e=new Me,n=t.color;if(t.fx==="wave"){const i=q(F.sphere(),new me({color:n,transparent:!0,opacity:.4,depthWrite:!1}),{sx:t.radius*2.2,sy:1.8,sz:1.2});i.castShadow=!1,e.add(i);const s=q(F.torus(),new me({color:16777215,transparent:!0,opacity:.7}),{sx:t.radius*2.4,sy:t.radius*2.4,sz:t.radius*2.4,rx:Math.PI/2});s.castShadow=!1,e.add(s)}else if(t.fx==="line"||t.fx==="bolt"){const i=q(F.sphere(),$t(n),{sx:1.4,sy:.35,sz:.35});i.castShadow=!1,e.add(i);const s=q(F.sphere(),$t(16777215),{sx:.8,sy:.18,sz:.18});s.castShadow=!1,e.add(s)}else if(t.fx==="swarm")for(let i=0;i<5;i++){const s=q(F.sphere(),$t(i%2?16777215:n),{x:(i-2)*.18,y:Math.sin(i*2)*.25,z:Math.cos(i*2)*.25,sx:.28});s.castShadow=!1,e.add(s)}else{const i=q(F.sphere(),$t(n),{sx:t.kind==="tower"?.6:.3+(t.size??.2)*.4});if(i.castShadow=!1,e.add(i),t.kind==="tower"){const s=q(F.sphere(),$t(16777215),{sx:.3});s.castShadow=!1,e.add(s)}}return e}syncZones(t){const e=new Set,n=t.player.team;for(const i of t.zones){i.tag==="sigil"&&i.team;const s=t.byId.get(i.owner);if(i.team!==n&&s&&!this.visibleToPlayer(s)&&!t.pointVisible(n,i.x,i.z))continue;e.add(i.id);let a=this.zoneViews.get(i.id);a||(a=gx(this.zoneTex,i.color),this.zoneViews.set(i.id,a),this.dyn.add(a),a.userData.spawned=this.clock);const o=i.team!==n&&!i.friendly;a.material.color.setHex(o&&i.tag!=="fen"?16738896:i.color),a.position.set(i.x,.1,i.z);const l=Math.min(1,(this.clock-a.userData.spawned)*6),c=i.shape==="circle"?i.r*2*(.6+.4*l):1;i.shape==="circle"?a.scale.set(c,c,1):(a.scale.set(i.l,i.w,1),a.rotation.z=-i.ang);const h=i.until-t.time;if(a.material.opacity=re(h*2,0,.8)*l,a.rotation.z=i.tag==="sigil"?this.clock*1.5:0,(i.tag==="fen"||i.tag==="hush")&&Math.random()<.3){const u=Math.random()*Math.PI*2,d=Math.sqrt(Math.random())*i.r;this.particles.emit(i.x+Math.cos(u)*d,.3,i.z+Math.sin(u)*d,0,.8,0,i.color,.5,1.1,0)}}for(const[i,s]of this.zoneViews)e.has(i)||(this.dyn.remove(s),s.material.dispose(),this.zoneViews.delete(i))}syncWalls(t){const e=new Set;for(const n of t.walls){e.add(n.id);let i=this.wallViews.get(n.id);i||(i=q(F.box(),ct(14866624,0,0,.8),{sx:1.5,sy:2.2,sz:1.2}),i.receiveShadow=!0,this.wallViews.set(n.id,i),this.dyn.add(i),i.userData.t0=this.clock);const s=Math.min(1,(this.clock-i.userData.t0)*5);i.position.set(n.x,-1.1+2.2*s*.5+0,n.z),i.scale.y=2.2*s+.01,i.position.y=i.scale.y/2,i.rotation.y=Math.atan2(n.z-t.player.z,n.x-t.player.x);const a=n.until-t.time<.5;i.scale.x=a?1.5*(n.until-t.time)*2+.01:1.5}for(const[n,i]of this.wallViews)e.has(n)||(this.dyn.remove(i),this.wallViews.delete(n),this.particles.burst(i.position.x,1,i.position.z,14208432,14,3,.7,.4,8))}syncTowerLines(t,e){let n=0;for(const i of t.units){if(i.kind!=="tower"&&i.kind!=="core"||i.dead||!i.ttarget)continue;const s=t.byId.get(i.ttarget);if(!s||s.dead||i.team!==t.player.team&&!this.visibleToPlayer(s))continue;let a=this.towerLines[n];a||(a=new Bg(new we().setFromPoints([new I,new I]),new wh({color:16728128,transparent:!0,opacity:.7,depthWrite:!1})),a.renderOrder=15,this.towerLines.push(a),this.dyn.add(a));const o=a.geometry.attributes.position;o.setXYZ(0,i.x,4.8,i.z),o.setXYZ(1,s.x,1,s.z),o.needsUpdate=!0;const l=s.kind==="hero";a.material.color.setHex(l?16724016:16760928),a.material.opacity=l?.5+i.tramp*.1:.22,a.visible=!0,n++}for(let i=n;i<this.towerLines.length;i++)this.towerLines[i].visible=!1}updateFog(t,e){if(this.fogTimer-=e,this.fogTimer>0)return;this.fogTimer=.1;const n=this.fogCtx,i=this.fogCanvas.width,s=this.fogCanvas.height;n.globalCompositeOperation="source-over",n.clearRect(0,0,i,s),n.fillStyle="rgba(8,16,34,0.42)",n.beginPath();for(const l of this.fogOutline){const c=(l.x+Ie/2+1)*(i/(Ie+2)),h=(l.z+Le/2+1)*(s/(Le+2));l===this.fogOutline[0]?n.moveTo(c,h):n.lineTo(c,h)}n.closePath(),n.fill(),n.globalCompositeOperation="destination-out";const a=i/(Ie+2),o=s/(Le+2);for(const l of t.observers(t.player.team)){const c=(l.x+Ie/2+1)*a,h=(l.z+Le/2+1)*o,u=l.r*a,d=n.createRadialGradient(c,h,u*.62,c,h,u);d.addColorStop(0,"rgba(0,0,0,1)"),d.addColorStop(1,"rgba(0,0,0,0)"),n.fillStyle=d,n.beginPath(),n.ellipse(c,h,u,l.r*o,0,0,Math.PI*2),n.fill()}n.globalCompositeOperation="source-over",this.fogTex.needsUpdate=!0}handleEvents(t){const e=this.sim;if(!e)return;const n=e.player.team,i=this.settings.effects==="low";for(const s of t)switch(s.t){case"fx":{if(s.team!==void 0&&s.team!==n)break;const a=s.color;if(s.kind==="ring")this.decals.spawn("ring",s.x,s.z,s.r,a,s.dur??.5),i||this.particles.burst(s.x,.3,s.z,a,8,3,.5,.3,0);else if(s.kind==="shield")this.decals.spawn("ring",s.x,s.z,s.r,a,s.dur??.6),this.particles.burst(s.x,1.2,s.z,a,10,2,.6,.3,-1);else if(s.kind==="shock")this.decals.spawn("ring",s.x,s.z,s.r,a,.55),this.decals.spawn("disc",s.x,s.z,s.r*.8,a,.4),this.particles.burst(s.x,.4,s.z,a,i?8:30,7,.6,.5,5),this.addShake(.25);else if(s.kind==="burst")this.particles.burst(s.x,1,s.z,a,22,4.5,.6,.4,3),this.decals.spawn("disc",s.x,s.z,s.r,a,.35);else if(s.kind==="cone")this.decals.spawn("cone",s.x,s.z,s.r,a,s.dur??.4,s.dx??1,s.dz??0);else if(s.kind==="rect"){const o=this.decals.spawn("rect",s.x,s.z,s.r,a,s.dur??.5,s.dx??1,s.dz??0);o.mesh.scale.y=3.2}else if(s.kind==="beam"){this.decals.spawn("beam",s.x,s.z,s.r,a,s.dur??.3,s.dx??1,s.dz??0);const o=Math.min(40,Math.floor(s.r*1.2)),l=Math.hypot(s.dx??1,s.dz??0)||1;for(let c=0;c<o;c++){const h=c/o*s.r;this.particles.emit(s.x+(s.dx??1)/l*h,1,s.z+(s.dz??0)/l*h,0,.5,0,a,.5,.4,0)}}else if(s.kind==="warn")this.decals.spawn("warn",s.x,s.z,s.r,a,s.dur??1,1,0);else if(s.kind==="heal")for(let o=0;o<14;o++)this.particles.emit(s.x+(Math.random()-.5)*1.2,.2,s.z+(Math.random()-.5)*1.2,0,1.6+Math.random(),0,a,.28,.9,0);else s.kind==="mark"?this.decals.spawn("ring",s.x,s.z,s.r,a,s.dur??1,1,0,{pulse:!0}):s.kind==="anchor"?(this.decals.spawn("ring",s.x,s.z,s.r,a,1),this.particles.burst(s.x,.5,s.z,a,12,3,.6,.3,2)):s.kind==="burrow"?this.particles.burst(s.x,.3,s.z,6965802,20,3,.7,.45,8):s.kind==="collapse"&&(this.particles.burst(s.x,1,s.z,14208432,70,9,1.4,.8,7),this.particles.burst(s.x,3,s.z,a,40,8,1.2,.6,3),this.decals.spawn("ring",s.x,s.z,s.r*1.6,a,1.2),this.addShake(.5));break}case"hit":{const a=s.color;this.particles.burst(s.x,.9,s.z,a,s.big?18:8,s.big?5:3,.4,s.big?.4:.28,6),s.big&&this.decals.spawn("ring",s.x,s.z,1.2,a,.3);break}case"castStart":{const a=e.byId.get(s.unit);if(!a||!a.hero)break;const o=Ut[a.hero.heroId].abilities[s.ab];if(s.time<.25&&!o.ult)break;if(a.team===n||this.visibleToPlayer(a)){const l=a.team!==n,c=l?16732224:7395583;o.shape==="circle"&&o.ult||o.key==="R"&&o.shape==="circle"?this.decals.spawn("warn",s.x,s.z,o.size,c,s.time+.1,1,0):o.key==="R"?this.decals.spawn("ring",a.x,a.z,2.2,c,s.time,1,0):o.shape==="cone"&&l&&this.decals.spawn("cone",a.x,a.z,o.range,c,s.time+.1,s.x-a.x,s.z-a.z)}break}case"death":{const a=e.byId.get(s.unit);if(!a||!this.visibleToPlayer(a))break;const o=a.kind==="hero"?Ut[a.hero.heroId].accent:a.kind==="minion"?this.teamColor(a.team):13680784;this.particles.burst(a.x,1,a.z,o,a.kind==="hero"?40:12,a.kind==="hero"?6:3.5,.9,.45,2),a.kind==="hero"&&(this.decals.spawn("ring",a.x,a.z,3,o,.7),this.addShake(.2));break}case"spawn":{const a=e.byId.get(s.unit);a&&this.visibleToPlayer(a)&&(this.decals.spawn("ring",a.x,a.z,2,16777215,.6),this.particles.burst(a.x,.4,a.z,16777215,16,3,.7,.3,-1));break}case"levelup":{const a=e.byId.get(s.unit);if(a){this.decals.spawn("ring",a.x,a.z,2.6,16769658,.8);for(let o=0;o<16;o++)this.particles.emit(a.x+(Math.random()-.5),.2,a.z+(Math.random()-.5),0,3+Math.random()*2,0,16769658,.35,1,0)}break}case"ward":{this.decals.spawn("ring",s.x,s.z,8.5,this.teamColor(s.team),.9);break}case"recall":{const a=e.byId.get(s.unit);a&&s.done&&(this.decals.spawn("ring",a.x,a.z,3,10482943,.9),this.particles.burst(a.x,1,a.z,10482943,30,4,.9,.4,-2));break}case"glint":{this.particles.burst(s.x,1.6,s.z,16777215,6,2,.4,.5,0);break}}}project(t,e,n){return Ze.set(t,e,n).project(this.camera),{x:(Ze.x*.5+.5)*this.width,y:(-Ze.y*.5+.5)*this.height,visible:Ze.z<1&&Ze.x>-1.2&&Ze.x<1.2&&Ze.y>-1.2&&Ze.y<1.2}}ray=new rx;plane=new ti(new I(0,1,0),0);groundPoint(t,e){const n=this.canvas.getBoundingClientRect(),i=new gt((t-n.left)/n.width*2-1,-((e-n.top)/n.height)*2+1);this.ray.setFromCamera(i,this.camera);const s=new I;return this.ray.ray.intersectPlane(this.plane,s)?{x:re(s.x,-74,74),z:re(s.z,-57,57)}:{x:this.cam.x,z:this.cam.z}}pickUnit(t,e,n){const i=this.sim;if(!i)return null;const s=this.canvas.getBoundingClientRect(),a=t-s.left,o=e-s.top;let l=null,c=1e9;for(const h of i.units){if(h.dead||!this.visibleToPlayer(h)||!n(h))continue;const u=h.kind==="hero"?2.9:h.stype?4:h.kind==="monster"?h.radius>2?5:h.radius>.8?2.4:1.1:1.4,d=this.project(h.x,.1,h.z),f=this.project(h.x,u,h.z),g=Math.max(14,this.project(h.x+h.radius,.1,h.z).x-d.x)*1+9,x=f.x-d.x,m=f.y-d.y,p=a-d.x,_=o-d.y,y=x*x+m*m||1,M=re((p*x+_*m)/y,0,1),z=Math.hypot(a-(d.x+x*M),o-(d.y+m*M)),A=h.stype?g*1.5:g;z<A&&z<c&&(c=z,l=h)}return l}setFog(t){this.fogMesh.visible=t}setHover(t){this.hoverId=t}showIndicator(t){if(!t){this.indicator.visible=!1;return}this.indicator.visible=!0;const e=this.indRange.material,n=this.indShape.material,i=this.decals;e.map=i.tex.ring,e.color.setHex(12577023),e.needsUpdate=!0,this.indRange.position.set(t.x,.1,t.z),this.indRange.scale.set(t.range*2+1,t.range*2+1,1),this.indRange.visible=t.range>0&&t.kind!=="self";const s=Math.atan2(t.tz-t.z,t.tx-t.x);switch(n.color.setHex(t.valid?t.color:8947848),this.indShape.rotation.z=0,t.kind){case"circle":n.map=i.tex.zoneEdge,this.indShape.position.set(t.tx,.11,t.tz),this.indShape.scale.set(t.size*2,t.size*2,1),this.indShape.rotation.set(-Math.PI/2,0,0);break;case"unit":n.map=i.tex.ring,this.indShape.position.set(t.tx,.11,t.tz),this.indShape.scale.set(t.size*2.4,t.size*2.4,1),this.indShape.rotation.set(-Math.PI/2,0,0);break;case"self":n.map=i.tex.zoneEdge,this.indShape.position.set(t.x,.11,t.z),this.indShape.scale.set(t.size*2,t.size*2,1),this.indShape.rotation.set(-Math.PI/2,0,0);break;case"cone":n.map=i.tex.cone,this.indShape.position.set(t.x+Math.cos(s)*t.range*.54,.11,t.z+Math.sin(s)*t.range*.54),this.indShape.scale.set(t.range*1.08,t.range*1.08,1),this.indShape.rotation.set(-Math.PI/2,0,-s);break;case"line":{n.map=i.tex.rect;const a=t.range;this.indShape.position.set(t.x+Math.cos(s)*a/2,.11,t.z+Math.sin(s)*a/2),this.indShape.scale.set(a,Math.max(.7,t.size*1.6),1),this.indShape.rotation.set(-Math.PI/2,0,-s);break}case"rect":{n.map=i.tex.rect,this.indShape.position.set(t.tx,.11,t.tz),this.indShape.scale.set(7,t.size,1),this.indShape.rotation.set(-Math.PI/2,0,-s);break}}n.needsUpdate=!0}dist=et;dispose(){this.renderer.dispose()}}const _x=Rs;class yx{ctx=null;master;sfxBus;musicBus;vol=.6;musicVol=.35;listener={x:0,z:0};voices=0;noiseBuf=null;intensity=0;targetIntensity=0;musicTimer=0;step=0;musicOn=!1;lastPlayed=new Map;layerGain=[];init(){if(this.ctx){this.ctx.resume();return}try{const s=window.AudioContext??window.webkitAudioContext;this.ctx=new s}catch{return}const t=this.ctx;this.master=t.createGain(),this.master.connect(t.destination);const e=t.createDynamicsCompressor();e.connect(this.master),this.sfxBus=t.createGain(),this.sfxBus.connect(e),this.musicBus=t.createGain(),this.musicBus.connect(this.master),this.setVolumes(this.vol,this.musicVol);const n=t.sampleRate*1;this.noiseBuf=t.createBuffer(1,n,t.sampleRate);const i=this.noiseBuf.getChannelData(0);for(let s=0;s<n;s++)i[s]=Math.random()*2-1}setVolumes(t,e){this.vol=t,this.musicVol=e,this.ctx&&(this.sfxBus.gain.value=t,this.musicBus.gain.value=e*.5)}tone(t,e,n,i,s=0,a=0,o){const l=this.ctx,c=l.createOscillator(),h=l.createGain();c.type=n;const u=l.currentTime+a;c.frequency.setValueAtTime(t,u),s&&c.frequency.exponentialRampToValueAtTime(Math.max(20,t+s),u+e),h.gain.setValueAtTime(1e-4,u),h.gain.exponentialRampToValueAtTime(Math.max(2e-4,i),u+Math.min(.02,e/3)),h.gain.exponentialRampToValueAtTime(1e-4,u+e),c.connect(h),h.connect(o??this.sfxBus),c.start(u),c.stop(u+e+.05)}noise(t,e,n,i=1,s="bandpass",a=0,o=0){const l=this.ctx,c=l.createBufferSource();c.buffer=this.noiseBuf;const h=l.createBiquadFilter();h.type=s,h.Q.value=i;const u=l.currentTime+a;h.frequency.setValueAtTime(e,u),o&&h.frequency.exponentialRampToValueAtTime(Math.max(40,e+o),u+t);const d=l.createGain();d.gain.setValueAtTime(1e-4,u),d.gain.exponentialRampToValueAtTime(Math.max(2e-4,n),u+.01),d.gain.exponentialRampToValueAtTime(1e-4,u+t),c.connect(h),h.connect(d),d.connect(this.sfxBus),c.start(u,Math.random()*.5),c.stop(u+t+.05)}at(t,e,n,i=1){const s=Math.hypot(e-this.listener.x,n-this.listener.z),a=i*Math.max(0,1-s/46);a<.04||this.play(t,a)}play(t,e=1){if(!this.ctx||this.vol<=0)return;const n=this.ctx.currentTime,i=this.lastPlayed.get(t)??0,s=["shoot","swing","hit"].includes(t)?.09:.03;if(n-i<s||this.voices>40)return;this.lastPlayed.set(t,n),this.voices++,setTimeout(()=>{this.voices--},350);const a=.5*e;switch(t){case"shoot":this.tone(620,.09,"triangle",.22*a,-300),this.noise(.06,3200,.1*a,2);break;case"swing":this.noise(.12,1200,.28*a,.8,"bandpass",0,-700);break;case"hit":this.noise(.07,900,.3*a,1.5);break;case"slam":this.tone(110,.3,"sawtooth",.5*a,-60),this.noise(.22,400,.5*a,.5,"lowpass");break;case"boom":this.tone(70,.5,"sine",.8*a,-35),this.noise(.4,500,.6*a,.6,"lowpass",0,-300);break;case"stone":this.noise(.25,280,.55*a,1,"lowpass"),this.tone(150,.2,"square",.15*a,-60);break;case"zap":this.tone(1100,.16,"sawtooth",.22*a,-700),this.tone(1650,.1,"sine",.12*a,-900,.02);break;case"beam":this.tone(300,.5,"sawtooth",.4*a,900),this.noise(.45,2400,.3*a,1,"bandpass",0,2200);break;case"hush":this.tone(220,.7,"sine",.35*a,-80),this.tone(330,.7,"sine",.2*a,-120,.05);break;case"wave":this.tone(196,.9,"triangle",.4*a,120),this.tone(294,.9,"sine",.25*a,160,.1);break;case"marsh":this.tone(80,.8,"sawtooth",.3*a,30),this.noise(.6,300,.3*a,1.5,"lowpass");break;case"erase":this.noise(.25,4e3,.35*a,1,"highpass",0,-2500),this.tone(900,.2,"square",.14*a,-600);break;case"ring":this.tone(523,.35,"sine",.35*a,0),this.tone(784,.4,"sine",.22*a,0,.05);break;case"prism":this.tone(1320,.35,"sine",.3*a,-900),this.tone(1980,.3,"triangle",.15*a,-1200,.03);break;case"buy":this.tone(660,.08,"square",.18*a),this.tone(990,.14,"square",.18*a,0,.08);break;case"sell":this.tone(880,.08,"square",.15*a),this.tone(560,.14,"square",.15*a,0,.08);break;case"ward":this.tone(740,.12,"sine",.3*a,300);break;case"levelup":[523,659,784,1046].forEach((o,l)=>this.tone(o,.18,"triangle",.3*a,0,l*.07));break;case"kill":this.tone(392,.12,"square",.25*a),this.tone(523,.12,"square",.25*a,0,.1),this.tone(784,.3,"square",.25*a,0,.2);break;case"death":this.tone(300,.6,"sawtooth",.35*a,-240);break;case"tower":this.tone(90,1,"sawtooth",.6*a,-50),this.noise(.9,600,.6*a,.5,"lowpass",0,-450);break;case"seal":this.tone(180,1.2,"sine",.6*a,-100),this.tone(540,1,"triangle",.3*a,-300,.05);break;case"objective":[196,247,294].forEach((o,l)=>this.tone(o,.9,"triangle",.32*a,0,l*.12));break;case"alert":this.tone(880,.1,"square",.22*a),this.tone(880,.1,"square",.22*a,0,.16);break;case"buff":this.tone(440,.4,"sine",.3*a,440);break;case"victory":[523,659,784,1046,1318].forEach((o,l)=>this.tone(o,.5,"triangle",.4*a,0,l*.14));break;case"defeat":[392,330,262,196].forEach((o,l)=>this.tone(o,.6,"triangle",.4*a,0,l*.2));break;case"click":this.tone(500,.04,"square",.12*a);break;case"recall":this.tone(500,.9,"sine",.2*a,500);break;case"error":this.tone(160,.12,"sawtooth",.2*a);break;case"spawn":this.tone(330,.25,"triangle",.25*a,330);break;default:this.tone(440,.05,"sine",.1*a)}}startMusic(){if(!this.ctx||this.musicOn)return;this.musicOn=!0;const t=this.ctx;for(let n=0;n<3;n++){const i=t.createGain();i.gain.value=n===0?1:0,i.connect(this.musicBus),this.layerGain.push(i)}const e=()=>{this.musicOn&&(this.stepMusic(),this.musicTimer=window.setTimeout(e,450))};e()}stopMusic(){this.musicOn=!1,window.clearTimeout(this.musicTimer),this.layerGain=[]}setIntensity(t){this.targetIntensity=Math.max(0,Math.min(1,t))}stepMusic(){const t=this.ctx;this.intensity+=(this.targetIntensity-this.intensity)*.12;const e=this.intensity;this.layerGain[1].gain.setTargetAtTime(e>.25?.8:0,t.currentTime,.6),this.layerGain[2].gain.setTargetAtTime(e>.6?.9:0,t.currentTime,.6);const n=[[220,261.6,329.6],[196,246.9,293.7],[174.6,220,261.6],[196,246.9,311.1]],i=this.step++,s=n[Math.floor(i/8)%n.length];if(i%8===0)for(const a of s)this.tone(a/2,3.8,"sine",.16,0,0,this.layerGain[0]);e>.25&&i%2===0&&this.tone(s[i/2%3|0]*2,.35,"triangle",.1,0,0,this.layerGain[1]),e>.6&&i%2===1&&this.noise(.08,200,.12,1,"lowpass"),e>.6&&i%4===0&&this.tone(65,.25,"sine",.35,-30,0,this.layerGain[2])}}const se=new yx;class Mx{constructor(t,e,n){this.sim=t,this.send=e,this.close=n,this.el=v("div",{class:"shop panel hidden"}),this.build()}el;grid;detail;inv;goldEl;note;filter="recommended";query="";selected=null;visible=!1;tabs=new Map;get open(){return this.visible}show(t){this.visible=t,this.el.classList.toggle("hidden",!t),t&&this.refresh()}hero(){return this.sim.player}build(){const t=v("input",{type:"search",placeholder:"Search items…",class:"shop-search",oninput:i=>{this.query=i.target.value.toLowerCase(),this.renderGrid()}}),e=v("div",{class:"shop-tabs"}),n=[["recommended","★ Recommended"],["all","All"],["starter","Starters"],["attack","Attack"],["ability","Ability"],["defense","Defense"],["movement","Movement"],["support","Support"],["consumable","Consumables"]];for(const[i,s]of n){const a=v("button",{class:"tab",onclick:()=>{this.filter=i,this.syncTabs(),this.renderGrid()}},s);this.tabs.set(i,a),e.append(a)}this.goldEl=v("div",{class:"shop-gold"}),this.grid=v("div",{class:"shop-grid"}),this.detail=v("div",{class:"shop-detail"}),this.inv=v("div",{class:"shop-inv"}),this.note=v("div",{class:"shop-note"}),this.el.append(v("div",{class:"shop-head"},v("h2",{},"Item Shop"),this.goldEl,v("button",{class:"x",title:"Close (P / Esc)",onclick:()=>this.close()},"×")),v("div",{class:"shop-body"},v("div",{class:"shop-left"},t,e,this.note,this.grid),this.detail),this.inv),this.syncTabs()}syncTabs(){for(const[t,e]of this.tabs)e.classList.toggle("on",t===this.filter)}cards=new Map;sig="";tick(){const t=this.hero().hero;this.goldEl.textContent=`◉ ${Math.floor(t.gold)} gold`;const e=Un.map(s=>{const a=On(t,s.id);return t.gold>=a.cost&&a.ok?1:0}).join(""),n=t.items.map(s=>s?.id??"-").join(","),i=e+"|"+n+"|"+this.selected;if(i!==this.sig){this.sig=i;for(const[s,a]of this.cards){const o=On(t,s);a.classList.toggle("poor",!(t.gold>=o.cost&&o.ok))}this.renderDetail(),this.renderInv()}}refresh(){const t=this.hero().hero;this.sig="",this.goldEl.textContent=`◉ ${Math.floor(t.gold)} gold`,this.renderGrid(),this.renderDetail(),this.renderInv()}enemyProfile(){let t=0,e=0;for(const n of this.sim.heroes){if(n.team===this.hero().team)continue;const i=n.hero.heroId;i==="oru"||i==="ilyra"?e++:t++}return{phys:t,arc:e}}card(t){const e=this.hero().hero,n=On(e,t.id),i=e.items.some(o=>o&&o.id===t.id),s=e.gold>=n.cost&&n.ok;return v("div",{class:`card tier-${t.tier}${s?"":" poor"}${i?" owned":""}${this.selected===t.id?" sel":""}`,onclick:o=>{this.selected=t.id,this.grid.querySelectorAll(".card.sel").forEach(l=>l.classList.remove("sel")),o.currentTarget.classList.add("sel"),this.renderDetail(),se.play("click",.6)},ondblclick:()=>this.buy(t.id),title:t.name},v("div",{class:"ico",style:{color:t.color,borderColor:t.color}},t.icon),v("div",{class:"nm"},t.name),v("div",{class:"pr"},`${n.cost}${n.cost<t.cost?" (−"+(t.cost-n.cost)+")":""}`))}renderGrid(){$e(this.grid),$e(this.note),this.cards.clear();const t=this.hero(),e=Ut[t.hero.heroId];let n=Un;if(this.filter==="recommended"){const s=this.enemyProfile(),a=s.phys>s.arc?`Enemy damage is mostly physical (${s.phys}/3): Armor items blunt it.`:s.arc>0?`Enemy team has ${s.arc} arcane threats: consider Ward.`:"Balanced enemy damage.";this.note.append(v("div",{class:"rec-tip"},a));for(const h of e.builds)this.note.append(v("div",{class:"build"},v("b",{},h.name),v("span",{}," — "+h.why),v("div",{class:"build-items"},...h.items.map(u=>{const d=ee[u];return v("span",{class:"chip",style:{color:d.color},title:d.name,onclick:()=>{this.selected=u,this.renderDetail()}},`${d.icon} ${d.name}`)}))));const o=t.hero,l=new Set,c=[];for(const h of e.builds)for(const u of h.items)if(!l.has(u)){l.add(u);const d=ee[u];o.items.some(f=>f&&f.id===u)||c.push(d)}n=c}else this.filter==="starter"?n=Un.filter(s=>s.tier==="starter"):this.filter==="consumable"?n=Un.filter(s=>s.tier==="consumable"):this.filter!=="all"&&(n=Un.filter(s=>s.cat===this.filter));this.query&&(n=n.filter(s=>s.name.toLowerCase().includes(this.query)||s.cat.includes(this.query)||(s.passive??"").toLowerCase().includes(this.query)));const i={starter:0,component:1,boots:2,complete:3,consumable:4};n=[...n].sort((s,a)=>i[s.tier]-i[a.tier]||s.cost-a.cost);for(const s of n){const a=this.card(s);this.cards.set(s.id,a),this.grid.append(a)}n.length||this.grid.append(v("div",{class:"empty"},"Nothing here."))}renderDetail(){$e(this.detail);const t=this.selected?ee[this.selected]:null;if(!t){this.detail.append(v("div",{class:"empty"},"Select an item to see its recipe and effects. Double-click to buy."));return}const e=this.hero().hero,n=On(e,t.id);this.detail.append(v("div",{class:"d-head"},v("div",{class:"ico big",style:{color:t.color,borderColor:t.color}},t.icon),v("div",{},v("h3",{},t.name),v("div",{class:"sub"},`${t.tier} · ${t.cat}`))),v("ul",{class:"stats"},...Object.entries(t.stats).map(([o,l])=>v("li",{},$h(o,l)))),...t.passive?[v("p",{class:"pass"},v("b",{},"Passive: "),t.passive)]:[],...t.active?[v("p",{class:"pass"},v("b",{},"Active: "),t.active)]:[]);const i=t.from??[],s=Un.filter(o=>o.from?.includes(t.id));i.length&&this.detail.append(v("div",{class:"tree"},v("div",{class:"sub"},"Builds from"),v("div",{class:"tree-row"},...i.map(o=>{const l=ee[o],c=e.items.some(h=>h&&h.id===o);return v("span",{class:`chip${c?" have":""}`,style:{color:l.color},onclick:()=>{this.selected=o,this.refresh()}},`${l.icon} ${l.name} ${c?"✔":l.cost}`)})))),s.length&&this.detail.append(v("div",{class:"tree"},v("div",{class:"sub"},"Builds into"),v("div",{class:"tree-row"},...s.map(o=>v("span",{class:"chip",style:{color:o.color},onclick:()=>{this.selected=o.id,this.refresh()}},`${o.icon} ${o.name}`)))));const a=n.ok&&e.gold>=n.cost;this.detail.append(v("div",{class:"d-buy"},v("div",{class:"price"},`◉ ${n.cost}`,n.cost<t.cost?v("small",{},` (list ${t.cost})`):null),v("button",{class:`btn primary${a?"":" disabled"}`,onclick:()=>this.buy(t.id)},n.ok?e.gold>=n.cost?"Buy":"Not enough gold":n.reason??"Unavailable")))}buy(t){this.send({c:"buy",item:t}),setTimeout(()=>this.refresh(),30)}renderInv(){$e(this.inv);const t=this.hero().hero,e=v("div",{class:"inv-slots"});t.items.forEach((n,i)=>{const s=n?ee[n.id]:null;e.append(v("div",{class:`slot${s?" full":""}`,title:s?`${s.name} — sells for ${Math.floor(s.cost*Uc)}`:"Empty",onclick:()=>{s&&(this.selected=s.id,this.renderDetail())}},s?v("span",{style:{color:s.color}},s.icon):"",n&&n.qty>1?v("em",{},`×${n.qty}`):null,s?v("button",{class:"sell",title:"Sell",onclick:a=>{a.stopPropagation(),this.send({c:"sell",idx:i}),setTimeout(()=>this.refresh(),30)}},"$"):null))}),this.inv.append(v("div",{class:"inv-label"},"Inventory"),e,v("button",{class:`btn${t.undo?"":" disabled"}`,onclick:()=>{this.send({c:"undo"}),setTimeout(()=>this.refresh(),30)}},"↶ Undo purchase"),v("div",{class:"inv-hint"},"Sell for 65%. Components auto-combine into the item you buy."))}}const Vi=r=>"#"+r.toString(16).padStart(6,"0");class bx{constructor(t){this.host=t;const e=t.sim;this.el=v("div",{class:"hud"}),this.bars=v("canvas",{class:"bars"}),this.bctx=this.bars.getContext("2d"),this.mini=v("canvas",{class:"minimap",width:220,height:220}),this.mctx=this.mini.getContext("2d"),this.miniBg=document.createElement("canvas"),this.miniBg.width=220,this.miniBg.height=220,this.paintMiniBg(this.miniBg,220),this.tip=v("div",{class:"tip hidden"}),this.feed=v("div",{class:"feed"}),this.banner=v("div",{class:"banner hidden"}),this.toastEl=v("div",{class:"toast hidden"}),this.bigWrap=v("div",{class:"bigmap hidden"}),this.shop=new Mx(e,i=>t.send(i),()=>this.toggleShop(!1)),this.build();const n=v("div",{class:"hud-inner"},this.buildTop(),this.feed,this.banner,this.toastEl,this.tutorialEl,this.buildBottom(),this.veil,this.recallBar,this.board,this.shop.el,this.bigWrap);this.el.append(this.bars,n,this.tip),this.inner=n}el;bars;bctx;mini;mctx;miniBg;big=null;bigWrap;shop;tip;feed;banner;toastEl;score0;score1;clock;kda;objs;abEls=[];talEls=[];itemEls=[];trinketEl;recallEl;portrait;hpFill;mpFill;hpTxt;mpTxt;xpRing;lvl;stats;goldEl;veil;veilBody;recallBar;recallFill;recallTxt;board;tutorialEl;floaters=[];pings=[];lastPing=-9;hintEl=null;pendingDmg=new Map;toastTimer=0;bannerTimer=0;bannerQueue=[];slowAcc=0;miniAcc=0;boardShown=!1;debug=!1;mapShown=!1;lastAnnounce="";deathRecapAt=0;captions=[];inner;build(){this.board=v("div",{class:"scoreboard panel hidden"}),this.tutorialEl=v("div",{class:"tutorial hidden"}),this.veilBody=v("div",{class:"veil-body"}),this.veil=v("div",{class:"veil hidden"},this.veilBody),this.recallFill=v("div",{class:"fill"}),this.recallTxt=v("div",{class:"txt"}),this.recallBar=v("div",{class:"recallbar hidden"},v("div",{class:"bar"},this.recallFill),this.recallTxt)}buildTop(){return this.score0=v("div",{class:"score blue"},"0"),this.score1=v("div",{class:"score red"},"0"),this.clock=v("div",{class:"clock"},"0:00"),this.kda=v("div",{class:"kda"},"0 / 0 / 0"),this.objs=v("div",{class:"objs"}),v("div",{class:"top"},v("div",{class:"topbar"},v("div",{class:"team blue"},Te[0]),this.score0,v("div",{class:"mid"},this.clock,this.kda),this.score1,v("div",{class:"team red"},Te[1])),this.objs)}tipOn(t,e){t.addEventListener("mouseenter",()=>{this.tip.innerHTML=e(),this.tip.classList.remove("hidden"),this.placeTip(t)}),t.addEventListener("mousemove",()=>this.placeTip(t)),t.addEventListener("mouseleave",()=>this.tip.classList.add("hidden"))}placeTip(t){const e=t.getBoundingClientRect(),n=this.tip.getBoundingClientRect();this.tip.style.left=`${re(e.left+e.width/2-n.width/2,8,window.innerWidth-n.width-8)}px`,this.tip.style.top=`${Math.max(8,e.top-n.height-10)}px`}buildBottom(){const e=this.host.sim.player,n=Ut[e.hero.heroId];this.lvl=v("div",{class:"lvl"},"1"),this.xpRing=v("div",{class:"xpring"}),this.portrait=v("div",{class:"portrait"},this.xpRing,v("div",{class:"face",style:{background:`radial-gradient(circle at 35% 30%, ${Vi(n.accent)}, ${Vi(n.color)} 70%)`}},n.name[0]),this.lvl),this.hpFill=v("div",{class:"fill hp"}),this.mpFill=v("div",{class:`fill ${n.resource==="energy"?"en":"mp"}`}),this.hpTxt=v("span",{}),this.mpTxt=v("span",{}),this.stats=v("div",{class:"stats"}),this.goldEl=v("div",{class:"gold"});const i=v("div",{class:"hero-card panel"},this.portrait,v("div",{class:"bars2"},v("div",{class:"name"},`${n.name} · ${n.title}`),v("div",{class:"bar"},this.hpFill,this.hpTxt),v("div",{class:"bar thin"},this.mpFill,this.mpTxt),this.stats,this.goldEl)),s=v("div",{class:"abilities"});n.abilities.forEach((d,f)=>{const g=v("div",{class:"cd"}),x=v("div",{class:"cdt"}),m=v("div",{class:"pips"}),p=v("button",{class:"plus hidden",title:`Learn ${d.name} (Ctrl+${d.key})`,onclick:y=>{y.stopPropagation(),this.host.rankUp(f)}},"+"),_=v("div",{class:`ab${d.ult?" ult":""}`,onclick:()=>this.host.castSlot(f)},v("div",{class:"ico"},d.icon),v("div",{class:"key"},this.host.settings.keys[d.key.toLowerCase()].toUpperCase()),m,g,x,p);this.tipOn(_,()=>this.abilityTip(f)),this.abEls.push({root:_,cd:g,cdt:x,pips:m,plus:p}),s.append(_)});const a=v("div",{class:"ab passive"},v("div",{class:"ico"},"✦"),v("div",{class:"key"},"P"));this.tipOn(a,()=>`<h4>${n.passive.name} <small>Passive</small></h4><p>${n.passive.desc}</p>`),s.prepend(a);const o=v("div",{class:"talents"});[0,1].forEach(d=>{const f=Pa[e.hero.talents[d]],g=v("div",{class:"cd"}),x=v("div",{class:"cdt"}),m=v("div",{class:"ab small",onclick:()=>this.host.send({c:"talent",idx:d,x:e.x,z:e.z})},v("div",{class:"ico"},f.icon),v("div",{class:"key"},(d?this.host.settings.keys.talent2:this.host.settings.keys.talent1).toUpperCase()),g,x);this.tipOn(m,()=>`<h4>${f.name} <small>Talent · ${f.cd}s</small></h4><p>${f.desc}</p>`),this.talEls.push({root:m,cd:g,cdt:x}),o.append(m)});const l=v("div",{class:"items"});for(let d=0;d<6;d++){const f=v("div",{class:"ico"}),g=v("div",{class:"cd"}),x=v("div",{class:"qty"}),m=v("div",{class:"ab small item",onclick:()=>this.host.send({c:"use",idx:d})},f,v("div",{class:"key"},String(d+1)),g,x);this.tipOn(m,()=>this.itemTip(d)),this.itemEls.push({root:m,ico:f,cd:g,qty:x}),l.append(m)}this.trinketEl=v("div",{class:"ab small trinket",onclick:()=>this.host.send({c:"ward",x:e.x+2,z:e.z+2})},v("div",{class:"ico"},"👁"),v("div",{class:"key"},this.host.settings.keys.ward.toUpperCase()),v("div",{class:"qty"})),this.tipOn(this.trinketEl,()=>`<h4>Ward Trinket <small>${this.host.settings.keys.ward.toUpperCase()}</small></h4><p>Place a ward at the cursor (range 9). Lasts 90s, hidden from enemies unless they come close. Recharges every 40s up to 2 charges. Visible to true sight only.</p>`),this.recallEl=v("div",{class:"ab small",onclick:()=>this.host.send({c:"recall"})},v("div",{class:"ico"},"⌂"),v("div",{class:"key"},this.host.settings.keys.recall.toUpperCase())),this.tipOn(this.recallEl,()=>"<h4>Recall <small>B</small></h4><p>Channel for 7 seconds to return to the fountain. Cancelled by moving, casting or taking damage.</p>");const c=v("div",{class:"ab small",onclick:()=>this.toggleShop()},v("div",{class:"ico"},"⚖"),v("div",{class:"key"},this.host.settings.keys.shop.toUpperCase()));this.tipOn(c,()=>"<h4>Shop <small>P</small></h4><p>Buy items at the fountain. Walk back or recall to shop.</p>");const h=v("div",{class:"actionbar panel"},s,v("div",{class:"sep"}),o,v("div",{class:"sep"}),l,v("div",{class:"sep"}),v("div",{class:"util"},this.trinketEl,this.recallEl,c));this.mini.addEventListener("mousedown",d=>this.miniClick(d)),this.mini.addEventListener("contextmenu",d=>d.preventDefault());const u=v("div",{class:"minimap-wrap panel"},this.mini,v("button",{class:"mapbtn",title:"Expanded map (M)",onclick:()=>this.toggleMap()},"⤢"));return v("div",{class:"bottom"},i,h,u)}abilityTip(t){const n=this.host.sim.player.hero,i=Ut[n.heroId].abilities[t],s=n.ranks[t],a=i.cd[Math.max(0,s-1)],o=i.cost[Math.max(0,s-1)],l=i.v&&Object.keys(i.v).length?`<div class="ranks">${Object.entries(i.v).map(([c,h])=>`<span>${c}: ${h.join(" / ")}</span>`).join("")}</div>`:"";return`<h4>${i.name} <small>${i.key}${i.ult?" · Ultimate":""}${i.recast?" · Recast":""}</small></h4>
      <div class="meta">${s?`Rank ${s}/${i.ult?2:4}`:"Not learned"} · Cost ${o} ${Ut[n.heroId].resource} · Cooldown ${a}s · Range ${i.range||"self"}${i.castTime>.3?` · Cast ${i.castTime}s`:""}</div>
      <p>${Dc(i,s)}</p>${l}<div class="tags">${i.tags.map(c=>`<i>${c}</i>`).join("")}</div>`}itemTip(t){const e=this.host.sim.player.hero.items[t];if(!e)return"<h4>Empty slot</h4><p>Buy items at the fountain (P).</p>";const n=ee[e.id];return`<h4 style="color:${n.color}">${n.name} <small>${n.tier}</small></h4>
      <ul>${Object.entries(n.stats).map(([i,s])=>`<li>${i}: ${s}</li>`).join("")}</ul>${n.passive?`<p><b>Passive:</b> ${n.passive}</p>`:""}${n.active?`<p><b>Active:</b> ${n.active} (click or press ${t+1})</p>`:""}`}toggleShop(t){const e=t??!this.shop.open;if(e&&!this.host.sim.inShop(this.host.sim.player)){this.toast("The shop is only open at your fountain"),se.play("error");return}this.shop.show(e)}get shopOpen(){return this.shop.open}get blocking(){return this.shop.open||this.mapShown}showBoard(t){this.boardShown=t,this.board.classList.toggle("hidden",!t),t&&this.renderBoard()}toggleMap(){this.mapShown=!this.mapShown,this.bigWrap.classList.toggle("hidden",!this.mapShown),this.mapShown&&this.renderBigMap()}toggleDebug(){this.debug=!this.debug,this.toast(this.debug?"Debug overlay on (walkability, brush, tower ranges) — open map with M":"Debug overlay off"),this.mapShown&&this.renderBigMap()}closeOverlays(){return this.shop.open?(this.shop.show(!1),!0):this.mapShown?(this.toggleMap(),!0):!1}addPing(t,e){const n=this.host.sim.time;return n-this.lastPing<1.2?!1:(this.lastPing=n,this.pings.push({x:t,z:e,t:n}),this.addFeed('<span class="ann">Ping: danger / look here</span>'),!0)}showHint(t,e){this.hintEl?.remove(),this.hintEl=v("div",{class:"hint panel",html:t}),this.inner.append(this.hintEl);const n=this.hintEl;setTimeout(()=>{n.classList.add("fade"),setTimeout(()=>n.remove(),800)},e*1e3)}toast(t){this.toastEl.textContent=t,this.toastEl.classList.remove("hidden"),clearTimeout(this.toastTimer),this.toastTimer=window.setTimeout(()=>this.toastEl.classList.add("hidden"),1800)}setTutorial(t){$e(this.tutorialEl),t?(this.tutorialEl.append(t),this.tutorialEl.classList.remove("hidden")):this.tutorialEl.classList.add("hidden")}mapT(t,e){const n=t/2;return{a:e/Math.SQRT2,b:-e/Math.SQRT2,c:e/Math.SQRT2,d:e/Math.SQRT2,e:n,f:n}}paintMiniBg(t,e){const n=t.getContext("2d");n.fillStyle="#081230",n.fillRect(0,0,e,e);const i=e/((Ie+Le)/Math.SQRT2)*.98,s=this.mapT(e,i);n.save(),n.setTransform(s.a,s.b,s.c,s.d,s.e,s.f),kh(n,!1),ox(n),n.restore()}toMini(t,e,n){const i=n/((Ie+Le)/Math.SQRT2)*.98;return{x:i/Math.SQRT2*(t+e)+n/2,y:i/Math.SQRT2*(e-t)+n/2}}fromMini(t,e,n){const i=n/((Ie+Le)/Math.SQRT2)*.98,s=(t-n/2)*Math.SQRT2/i,a=(e-n/2)*Math.SQRT2/i;return{x:(s-a)/2,z:(s+a)/2}}miniClick(t){const e=this.mini.getBoundingClientRect(),n=this.fromMini((t.clientX-e.left)/e.width*220,(t.clientY-e.top)/e.height*220,220);if(t.button===2){this.host.send({c:"move",x:n.x,z:n.z});return}this.host.renderer.cam.x=n.x,this.host.renderer.cam.z=n.z}drawMini(t,e,n,i=!1){const s=this.host.sim,a=s.player.team;t.clearRect(0,0,e,e),t.drawImage(n,0,0,e,e);const o=this.host.settings.colorblind?ks:ns,l=i?1.6:1;for(const u of Ro){const d=[...s.rules.structures.values()].find(m=>m.defId===u.id),f=this.toMini(u.x,u.z,e),g=!!d&&!d.dead;t.fillStyle=g?Vi(o[u.team]):"rgba(255,255,255,0.15)";const x=(u.type==="engine"?7:u.type==="core"||u.type==="seal"?5:4)*l*(e/220);u.type==="seal"?(t.beginPath(),t.arc(f.x,f.y,x*.7,0,7),t.fill(),g&&d.invuln&&(t.strokeStyle="#ff7ad8",t.lineWidth=1.2,t.stroke())):t.fillRect(f.x-x/2,f.y-x/2,x,x),g&&s.time-d.lastDamagedAt<1.5&&d.team===a&&(t.strokeStyle="#fff",t.lineWidth=1.5,t.beginPath(),t.arc(f.x,f.y,x+2+Math.sin(s.time*12)*1.5,0,7),t.stroke())}for(const u of s.units){if(u.dead||u.stype||!(u.team===a||u.visUntil[a]>s.time))continue;const g=this.toMini(u.x,u.z,e);u.kind==="minion"?(t.fillStyle=Vi(o[u.team]),t.fillRect(g.x-1,g.y-1,2*l,2*l)):u.kind==="monster"?(t.fillStyle="#ffd060",t.beginPath(),t.arc(g.x,g.y,(u.radius>1.5?4:u.radius>.8?3:1.8)*l,0,7),t.fill()):u.kind==="ward"?(t.fillStyle="#9ff4ff",t.fillRect(g.x-1.5,g.y-1.5,3,3)):u.kind==="hero"&&(t.beginPath(),t.arc(g.x,g.y,5*l,0,7),t.fillStyle=Vi(o[u.team]),t.fill(),t.lineWidth=u===s.player?2:1,t.strokeStyle=u===s.player?"#ffe08a":"#0a1530",t.stroke(),t.fillStyle="#fff",t.font=`bold ${7*l}px sans-serif`,t.textAlign="center",t.textBaseline="middle",t.fillText(Ut[u.hero.heroId].name[0],g.x,g.y+.5))}for(const u of Pr){if(u.kind!=="catalyst"&&u.kind!=="colossus")continue;const d=this.toMini(u.x,u.z,e),f=s.units.some(g=>g.kind==="monster"&&!g.dead&&g.camp?.id===u.id);t.strokeStyle=f?"#ff7ad8":"rgba(255,255,255,0.3)",t.lineWidth=f?2:1,t.beginPath(),t.moveTo(d.x,d.y-5*l),t.lineTo(d.x+4*l,d.y),t.lineTo(d.x,d.y+5*l),t.lineTo(d.x-4*l,d.y),t.closePath(),t.stroke()}this.pings=this.pings.filter(u=>s.time-u.t<4);for(const u of this.pings){const d=this.toMini(u.x,u.z,e),f=(s.time-u.t)%1*12*l;t.strokeStyle="rgba(255,224,138,0.95)",t.lineWidth=2,t.beginPath(),t.arc(d.x,d.y,3+f,0,7),t.stroke()}const c=this.host.renderer,h=[[0,0],[c.width,0],[c.width,c.height],[0,c.height]].map(([u,d])=>{const f=c.groundPoint(u+c.canvas.getBoundingClientRect().left,d+c.canvas.getBoundingClientRect().top);return this.toMini(f.x,f.z,e)});t.strokeStyle="rgba(255,255,255,0.85)",t.lineWidth=1.2,t.beginPath(),h.forEach((u,d)=>d?t.lineTo(u.x,u.y):t.moveTo(u.x,u.y)),t.closePath(),t.stroke(),this.debug&&i&&this.drawDebug(t,e)}drawDebug(t,e){t.fillStyle="rgba(255,60,60,0.35)";for(let n=0;n<sn;n+=1)for(let i=0;i<ce;i+=1){if($i[n*ce+i])continue;const s=bn+(i+.5)*ke,a=Sn+(n+.5)*ke,o=this.toMini(s,a,e);t.fillRect(o.x-1,o.y-1,2,2)}t.strokeStyle="rgba(80,255,120,0.9)";for(const n of Ps){const i=this.toMini(n.x,n.z,e);t.beginPath(),t.arc(i.x,i.y,n.r*(e/220)*1.45,0,7),t.stroke()}t.strokeStyle="rgba(255,200,60,0.9)";for(const n of this.host.sim.rules.structures.values()){if(n.dead||!n.range)continue;const i=this.toMini(n.x,n.z,e);t.beginPath(),t.arc(i.x,i.y,n.range*(e/220)*1.45,0,7),t.stroke()}}renderBigMap(){$e(this.bigWrap);const t=640;this.big=v("canvas",{width:t,height:t,class:"bigcanvas"});const e=document.createElement("canvas");e.width=t,e.height=t,this.paintMiniBg(e,t),this.bigBg=e,this.big.addEventListener("mousedown",n=>{const i=this.big.getBoundingClientRect(),s=this.fromMini((n.clientX-i.left)/i.width*t,(n.clientY-i.top)/i.height*t,t);this.host.renderer.cam.x=s.x,this.host.renderer.cam.z=s.z,this.toggleMap()}),this.bigWrap.append(v("div",{class:"panel bigpanel"},v("div",{class:"bm-head"},v("b",{},"The Broken Diadem"),v("span",{},"Click to jump the camera · F3 toggles debug overlays (walkability, brush, tower range) · M to close"),v("button",{class:"x",onclick:()=>this.toggleMap()},"×")),this.big))}bigBg=null;handleEvents(t){const e=this.host.sim,n=e.player,i=n.team;for(const s of t)switch(s.t){case"damage":{if(!this.host.settings.showDamage)break;const a=e.byId.get(s.target);if(!a||a.team!==i&&a.visUntil[i]<=e.time)break;const o=e.byId.get(s.src),l=o&&(o.id===n.id||o.owner===n.id),c=a.id===n.id;if(!l&&!c&&!(a.kind==="hero"&&o?.kind==="hero"))break;const h=c?"#ff6a6a":s.dtype==="arcane"?"#b88aff":s.dtype==="pure"?"#ffffff":"#ffd27a";if(s.shield){this.addFloater(a.x,a.z,`${s.amount}`,"#7fe8ff",15,.8);break}const u=a.id+(c?1e5:0),d=this.pendingDmg.get(u);d?(d.sum+=s.amount,d.t=e.time):this.pendingDmg.set(u,{sum:s.amount,t:e.time,color:h,x:a.x,z:a.z,crit:!1,shield:0});break}case"heal":{const a=e.byId.get(s.target);a&&a.id===n.id&&this.host.settings.showDamage&&this.addFloater(a.x,a.z,`+${s.amount}`,"#8dff9a",15,.8);break}case"gold":{s.unit===n.id&&this.addFloater(s.x,s.z,`+${s.amount}`,"#ffd24a",17,1.1);break}case"levelup":{s.unit===n.id&&(this.addFloater(n.x,n.z,`LEVEL ${s.level}`,"#ffe27a",26,1.6),se.play("levelup"));break}case"kill":{const a=e.byId.get(s.killer),o=e.byId.get(s.victim),l=a?.hero?.name??a?.name??"The wild",c=o?.hero?.name??"?",h=(a?.team??-1)===i;this.addFeed(`<b class="${h?"ally":"foe"}">${l}</b> defeated <b class="${o?.team===i?"ally":"foe"}">${c}</b>${s.assists.length?` <small>+${s.assists.length} assist</small>`:""}${s.gold?` <em>+${s.gold}g</em>`:""}`),s.first?this.queueBanner("First Blood",a?.team??0,2):s.streak>=3&&this.queueBanner(`${l} is on a ${s.streak}-kill streak`,a?.team??0,1),s.victim===n.id?(se.play("death"),this.deathRecapAt=e.time):se.play(h?"kill":"alert",.7);break}case"announce":{if(s.sound==="alert"&&s.team!==i)break;this.queueBanner(s.text,s.team,s.priority),this.addFeed(`<span class="ann">${s.text}</span>`),se.play(s.sound,.9);break}case"structure":break;case"reject":{s.unit===n.id&&(this.toast(s.reason),se.play("error",.6));break}case"victory":break;case"sfx":{se.at(s.name,s.x,s.z,.8);break}case"buy":{if(s.unit===n.id){const a=ee[s.item];this.toast(`Purchased ${a.name}`),this.shop.open&&this.shop.refresh()}break}case"ward":{s.team===i&&this.addFeed('<span class="ann">Ward placed</span>');break}}}addFloater(t,e,n,i,s,a){this.floaters.push({x:t+(Math.random()-.5)*.8,z:e,text:n,color:i,t:0,size:s,vy:1.3,life:a}),this.floaters.length>60&&this.floaters.shift()}addFeed(t){const e=v("div",{class:"row",html:t});for(this.feed.prepend(e);this.feed.children.length>6;)this.feed.lastElementChild?.remove();setTimeout(()=>e.classList.add("fade"),6500),setTimeout(()=>e.remove(),7500)}queueBanner(t,e,n){this.captions.push(t),this.captions.length>20&&this.captions.shift(),!(t===this.lastAnnounce&&this.bannerQueue.length)&&(this.lastAnnounce=t,this.bannerQueue.push({text:t,team:e,priority:n}),this.banner.classList.contains("hidden")&&this.nextBanner())}nextBanner(){const t=this.bannerQueue.sort((n,i)=>i.priority-n.priority).shift();if(!t){this.banner.classList.add("hidden");return}const e=this.host.sim.player.team;this.banner.className=`banner ${t.team===2?"neutral":t.team===e?"ally":"foe"}`,this.banner.textContent=t.text,clearTimeout(this.bannerTimer),this.bannerTimer=window.setTimeout(()=>{this.banner.classList.add("hidden"),setTimeout(()=>this.nextBanner(),250)},3200)}frame(t){const e=this.host.renderer,n=this.host.sim,i=e.width,s=e.height,a=Math.min(window.devicePixelRatio||1,2);(this.bars.width!==Math.round(i*a)||this.bars.height!==Math.round(s*a))&&(this.bars.width=Math.round(i*a),this.bars.height=Math.round(s*a));const o=this.bctx;o.setTransform(a,0,0,a,0,0),o.clearRect(0,0,i,s);const l=n.player.team,c=this.host.settings.colorblind?ks:ns,h=d=>{if(d.dead||!(d.team===l||d.visUntil[l]>n.time||d.stype)||d.kind==="ward"||d.kind==="decoy")return;const g=d.x,x=d.z,m=d.kind==="hero"?3.5:d.stype?d.stype==="engine"?8.2:d.stype==="seal"?5.6:7.4:d.kind==="monster"?d.radius>2?8:d.radius>.9?3.8:2:d.mtype==="vanguard"?3.3:2.3,p=e.project(g,m,x);if(!p.visible)return;const _=d.team===l,y=d.team===2,M=y?"#ffd060":Vi(c[d.team]);let z=d.kind==="hero"?76:d.stype?d.stype==="engine"?130:96:d.kind==="monster"?d.radius>2?170:d.radius>.9?84:46:d.mtype==="vanguard"?56:36;const A=d.kind==="hero"?9:d.stype?10:d.kind==="monster"?7:5,T=p.x-z/2,C=p.y-A,w=re(d.hp/d.maxHp,0,1);if(o.fillStyle="rgba(6,10,24,0.82)",o.fillRect(T-1.5,C-1.5,z+3,A+3),o.fillStyle="rgba(40,40,50,0.9)",o.fillRect(T,C,z,A),o.fillStyle=d.invuln&&d.stype?"#9a7ad8":_?this.host.settings.colorblind?"#4a90ff":"#4fd06a":y?"#e8b64a":this.host.settings.colorblind?"#ffb000":"#e8584a",o.fillRect(T,C,z*w,A),d.shield>0&&(o.fillStyle="rgba(127,232,255,0.9)",o.fillRect(T,C,Math.min(z,z*d.shield/d.maxHp),3)),d.kind==="hero"||d.stype){o.fillStyle="rgba(0,0,0,0.55)";const b=d.kind==="hero"?200:500;for(let k=b;k<d.maxHp;k+=b)o.fillRect(T+z*k/d.maxHp,C,1,A)}if(o.strokeStyle=M,o.lineWidth=1.5,o.strokeRect(T-1,C-1,z+2,A+2),d.kind==="hero"){o.fillStyle="rgba(6,10,24,0.82)",o.fillRect(T,C+A+1,z,5),o.fillStyle=Ut[d.hero.heroId].resource==="energy"?"#ffd24a":"#4a8cff",o.fillRect(T,C+A+1,z*re(d.mana/Math.max(1,d.maxMana),0,1),5),o.fillStyle="#0a1230",o.beginPath(),o.arc(T-11,C+6,10,0,7),o.fill(),o.strokeStyle=M,o.lineWidth=2,o.stroke(),o.fillStyle="#fff",o.font="bold 11px sans-serif",o.textAlign="center",o.textBaseline="middle",o.fillText(String(d.hero.level),T-11,C+6.5),o.font="600 11px sans-serif",o.fillStyle=_?"#bfe0ff":"#ffc4b8",o.strokeStyle="rgba(0,0,0,0.8)",o.lineWidth=3,o.strokeText(d.hero.name,p.x,C-9),o.fillText(d.hero.name,p.x,C-9);const b=[];n.has(d,"stun")&&b.push("STUN"),n.has(d,"airborne")&&b.push("AIRBORNE"),n.has(d,"root")&&b.push("ROOT"),n.has(d,"silence")&&b.push("SILENCE"),d.hushed&&b.push("HUSHED"),n.has(d,"slow")&&b.push("SLOW"),n.has(d,"prism")&&b.push("MARKED"),d.hero.recallStart>0&&b.push("RECALL"),b.length&&(o.font="bold 10px sans-serif",o.fillStyle="#ffe08a",o.strokeText(b.join(" · "),p.x,C-21),o.fillText(b.join(" · "),p.x,C-21))}if(d.stype&&(d.kind==="tower"||d.kind==="core")&&d.tramp>0&&n.time-d.lastDamagedAt>=0){const b=n.byId.get(d.ttarget);b&&b.kind==="hero"&&(o.font="bold 11px sans-serif",o.fillStyle="#ff8a7a",o.strokeStyle="rgba(0,0,0,0.8)",o.lineWidth=3,o.strokeText(`FOCUS ×${(1+d.tramp*.15).toFixed(2)}`,p.x,C-8),o.fillText(`FOCUS ×${(1+d.tramp*.15).toFixed(2)}`,p.x,C-8))}d.stype==="seal"&&d.invuln&&(o.font="bold 10px sans-serif",o.fillStyle="#ff9ae8",o.textAlign="center",o.fillText("SEALED",p.x,C-6)),d.stype==="core"&&d.invuln&&(o.font="bold 10px sans-serif",o.fillStyle="#ff9ae8",o.textAlign="center",o.fillText("PROTECTED",p.x,C-6)),d.stype==="engine"&&d.invuln&&(o.font="bold 10px sans-serif",o.fillStyle="#ff9ae8",o.textAlign="center",o.fillText("CORES STAND",p.x,C-6)),d.kind==="monster"&&d.radius>2&&(o.font="bold 12px sans-serif",o.fillStyle="#ffd1ff",o.textAlign="center",o.strokeStyle="rgba(0,0,0,0.8)",o.lineWidth=3,o.strokeText(d.name.toUpperCase(),p.x,C-8),o.fillText(d.name.toUpperCase(),p.x,C-8))},u=n.units.filter(d=>!d.dead).sort((d,f)=>d.x-d.z-(f.x-f.z));for(const d of u)d.stype&&h(d);for(const d of u)!d.stype&&d.kind!=="hero"&&h(d);for(const d of u)d.kind==="hero"&&h(d);for(const d of u){if(d.kind!=="ward"||d.team!==l)continue;const f=e.project(d.x,1.6,d.z);o.fillStyle="rgba(159,244,255,0.9)",o.font="10px sans-serif",o.textAlign="center",o.fillText(`${Math.max(0,Math.ceil(d.expires-n.time))}s`,f.x,f.y)}for(const[d,f]of this.pendingDmg)n.time-f.t>.28&&(this.addFloater(f.x,f.z,String(Math.round(f.sum)),f.color,d>=1e5?18:Math.min(30,16+f.sum/40),.9),this.pendingDmg.delete(d));for(let d=this.floaters.length-1;d>=0;d--){const f=this.floaters[d];if(f.t+=t,f.t>f.life){this.floaters.splice(d,1);continue}const g=e.project(f.x,2.4+f.t*f.vy,f.z);o.globalAlpha=re(1-(f.t/f.life)**2,0,1),o.font=`800 ${f.size}px "Trebuchet MS", sans-serif`,o.textAlign="center",o.textBaseline="middle",o.lineWidth=4,o.strokeStyle="rgba(0,0,0,0.85)",o.strokeText(f.text,g.x,g.y),o.fillStyle=f.color,o.fillText(f.text,g.x,g.y),o.globalAlpha=1}this.miniAcc+=t,this.miniAcc>.06&&(this.miniAcc=0,this.drawMini(this.mctx,220,this.miniBg),this.mapShown&&this.big&&this.bigBg&&this.drawMini(this.big.getContext("2d"),640,this.bigBg,!0)),this.slowAcc+=t,this.slowAcc>.1&&(this.slowAcc=0,this.slow())}slow(){const t=this.host.sim,e=t.player,n=e.hero,i=Ut[n.heroId],s=t.time;this.score0.textContent=String(t.teams[0].kills),this.score1.textContent=String(t.teams[1].kills),this.clock.textContent=Fn(s),this.kda.textContent=`${n.kills} / ${n.deaths} / ${n.assists}  ·  ${n.lastHits+n.monsterKills} CS`,this.hpFill.style.width=`${re(e.hp/e.maxHp,0,1)*100}%`,this.mpFill.style.width=`${re(e.mana/Math.max(1,e.maxMana),0,1)*100}%`,this.hpTxt.textContent=`${Math.ceil(e.hp)} / ${e.maxHp}${e.shield>0?` (+${Math.round(e.shield)})`:""}`,this.mpTxt.textContent=`${Math.floor(e.mana)} / ${e.maxMana}`,this.lvl.textContent=String(n.level);const a=za[n.level],o=za[Math.min(br,n.level+1)],l=n.level>=br?1:(n.xp-a)/Math.max(1,o-a);this.xpRing.style.background=`conic-gradient(#ffd24a ${l*360}deg, rgba(255,255,255,0.1) 0)`,this.stats.innerHTML=`<span title="Attack damage">⚔ ${Math.round(e.ad)}</span><span title="Ability power">✦ ${Math.round(e.ap)}</span><span title="Armor">⛨ ${Math.round(e.armor)}</span><span title="Ward">☁ ${Math.round(e.ward)}</span><span title="Attack speed">➶ ${e.as.toFixed(2)}</span><span title="Move speed">» ${e.ms.toFixed(2)}</span><span title="Ability haste">⌛ ${Math.round(e.haste)}</span>`,this.goldEl.textContent=`◉ ${Math.floor(n.gold)}${t.inShop(e)?"  ·  Shop open (P)":""}`,this.abEls.forEach((d,f)=>{const g=i.abilities[f],x=n.ranks[f],m=n.cds[f]-s,p=n.rec[f],_=!!(p&&p.until>s),y=g.cost[Math.max(0,x-1)];d.root.classList.toggle("locked",x===0),d.root.classList.toggle("nomana",x>0&&e.mana<y),d.root.classList.toggle("recast",_),d.cd.style.height=x===0||_?"0%":`${re(m/Math.max(.5,g.cd[Math.max(0,x-1)]),0,1)*100}%`,d.cdt.textContent=m>0&&!_&&x>0?m>9?String(Math.ceil(m)):m.toFixed(1):_?"↺":"";const M=g.ult?2:4;d.pips.innerHTML=Array.from({length:M},(A,T)=>`<i class="${T<x?"on":""}"></i>`).join("");const z=n.skillPts>0&&(g.ult?x<2&&n.level>=(x===0?6:11):x<4&&n.level>=x*2+1-0);d.plus.classList.toggle("hidden",!z)}),this.talEls.forEach((d,f)=>{const g=n.talentCds[f]-s;d.cd.style.height=`${re(g/Pa[n.talents[f]].cd,0,1)*100}%`,d.cdt.textContent=g>0?String(Math.ceil(g)):""}),this.itemEls.forEach((d,f)=>{const g=n.items[f],x=g?ee[g.id]:null;d.ico.textContent=x?x.icon:"",d.ico.style.color=x?.color??"",d.root.classList.toggle("empty",!x),d.qty.textContent=g&&g.qty>1?String(g.qty):"",d.cd.style.height=g&&g.cdUntil>s?`${re((g.cdUntil-s)/90,0,1)*100}%`:"0%"}),this.trinketEl.querySelector(".qty").textContent=String(n.trinketCharges),this.trinketEl.classList.toggle("empty",n.trinketCharges<=0),this.renderObjectives();const c=n.recallStart>0;if(this.recallBar.classList.toggle("hidden",!c),c){const d=re((s-n.recallStart)/n.recallDur,0,1);this.recallFill.style.width=`${d*100}%`,this.recallTxt.textContent=`Recalling… ${(n.recallDur*(1-d)).toFixed(1)}s`}this.veil.classList.toggle("hidden",!e.dead),e.dead&&this.hintEl&&(this.hintEl.remove(),this.hintEl=null),e.dead&&this.renderDeath(),this.boardShown&&this.renderBoard(),this.shop.open&&this.shop.tick();let h=0;for(const d of t.heroes)d.team!==e.team&&!d.dead&&et(d.x,d.z,e.x,e.z)<18&&h++;const u=s-e.lastCombatAt<4?.5:0;se.setIntensity(h?.7+h*.1:u),se.listener.x=this.host.renderer.cam.x,se.listener.z=this.host.renderer.cam.z}objChip(t,e,n,i){return v("div",{class:`obj ${i}`,title:e},v("b",{},t),v("span",{},n))}renderObjectives(){const t=this.host.sim,e=t.time,n=t.rules;$e(this.objs);const i=h=>n.camps.find(u=>u.def.id===h),s=(h,u,d,f)=>{const g=i(h),x=g?.spawned&&g.members.some(y=>!y.dead),m=g?.members.find(y=>!y.dead);let p="",_="";if(x&&m)p=`${Math.round(m.hp/m.maxHp*100)}%`,_="alive";else{const y=(g?.respawnAt??f)-e;p=Fn(Math.max(0,y)),_="down"}return this.objChip(u,d,p,_)};this.objs.append(s("catalyst-n","◈","Northern Catalyst: movement boon",ka),s("colossus","☗","Aether Colossus: siege window",Nc),s("catalyst-s","◈","Southern Catalyst: structure damage boon",ka));const a=t.player.team,o=t.teams[a],l=[];o.buffMoveUntil>e&&l.push(`Swift roads ${Fn(o.buffMoveUntil-e)}`),o.buffStructUntil>e&&l.push(`Siege power ${Fn(o.buffStructUntil-e)}`),o.colossusUntil>e&&l.push(`Colossus empowerment ${Fn(o.colossusUntil-e)}`);const c=h=>t.teams[h].sealDown.some(Boolean)?"⚠":"◍";this.objs.append(v("div",{class:"obj seals",title:"Seal status (◍ intact, ⚠ broken)"},v("b",{},"◍"),v("span",{},`${c(0)} vs ${c(1)}`))),l.length&&this.objs.append(v("div",{class:"obj buffs"},l.join(" · ")))}renderDeath(){const t=this.host.sim,e=t.player,n=e.hero,i=Math.max(0,n.respawnAt-t.time),s=n.recap.filter(c=>t.time-c.t<12&&c.t>=n.deathAt-8),a=new Map;for(const c of s){const h=c.srcName,u=a.get(h)??{sum:0,types:new Set,label:c.label};u.sum+=c.amount,u.types.add(c.type),u.label=c.label,a.set(h,u)}const o=[...a.entries()].sort((c,h)=>h[1].sum-c[1].sum).slice(0,5),l=o.reduce((c,h)=>c+h[1].sum,0)||1;this.veilBody.innerHTML=`<h2>You were defeated</h2><div class="rt">Respawn in <b>${Math.ceil(i)}</b>s</div>
      <div class="recap"><h4>Death recap — damage in the last 8 seconds</h4>${o.map(([c,h])=>`<div class="rr"><span>${c}</span><i style="width:${h.sum/l*100}%"></i><em>${Math.round(h.sum)}</em><small>${[...h.types].join("/")}</small></div>`).join("")||'<div class="rr"><span>Damage taken unknown</span></div>'}</div>
      <p class="hint">You may still shop at the fountain. Camera is free: use the minimap or arrow keys.</p>`,this.deathRecapAt}renderBoard(){const t=this.host.sim,e=t.player.team,n=s=>t.heroes.filter(a=>a.team===s).map(a=>{const o=a.hero,l=Ut[o.heroId],c=s===e;return`<tr class="${a===t.player?"me":""}${a.dead?" dead":""}"><td><b>${l.name}</b> <small>${o.controller==="player"?"you":"bot"}</small></td><td>${o.level}</td><td>${o.kills}/${o.deaths}/${o.assists}</td><td>${o.lastHits+o.monsterKills}</td>
      <td class="it">${o.items.map(h=>h?`<span style="color:${ee[h.id].color}" title="${ee[h.id].name}">${ee[h.id].icon}</span>`:'<span class="e">·</span>').join("")}</td>
      <td>${c||t.winner>=0?mr(o.totalGold):"—"}</td><td>${o.objectives}</td><td>${o.wardsPlaced}/${o.wardsKilled}</td><td>local</td></tr>`}).join(""),i="<tr><th>Hero</th><th>Lv</th><th>K/D/A</th><th>CS</th><th>Items</th><th>Gold</th><th>Obj</th><th>Wards</th><th>Ping</th></tr>";this.board.innerHTML=`<h3>Scoreboard <small>${Fn(t.time)}</small></h3>
      <div class="side blue"><h4>${Te[0]} — ${t.teams[0].kills} kills · ${t.teams[0].structuresLost} structures lost</h4><table>${i}${n(0)}</table></div>
      <div class="side red"><h4>${Te[1]} — ${t.teams[1].kills} kills · ${t.teams[1].structuresLost} structures lost</h4><table>${i}${n(1)}</table></div>`}destroy(){clearTimeout(this.toastTimer),clearTimeout(this.bannerTimer),this.el.remove()}_unused(){}}class Sx{constructor(t,e){this.host=t,this.el=e;const n=(i,s,a,o)=>{i.addEventListener(s,a,o),this.bound.push([i,s,a])};n(e,"mousemove",i=>this.onMove(i)),n(e,"mousedown",i=>this.onDown(i)),n(window,"mouseup",i=>this.onUp(i)),n(e,"contextmenu",i=>{i.preventDefault()}),n(e,"wheel",i=>{i.preventDefault(),this.host.renderer.cam.height=re(this.host.renderer.cam.height+Math.sign(i.deltaY)*2,28,42)},{passive:!1}),n(window,"keydown",i=>this.onKey(i,!0)),n(window,"keyup",i=>this.onKey(i,!1)),n(window,"blur",()=>{this.keys.clear(),this.follow=!1,this.drag=null}),n(document,"mouseleave",()=>{this.mouse.inside=!1}),n(document,"mouseenter",()=>{this.mouse.inside=!0})}mouse={x:0,y:0,inside:!0};aim=null;attackMovePending=!1;keys=new Set;drag=null;follow=!1;ping=0;bound=[];destroy(){for(const[t,e,n]of this.bound)t.removeEventListener(e,n);this.bound=[]}get hero(){return this.host.sim.player}onMove(t){this.mouse.x=t.clientX,this.mouse.y=t.clientY,this.mouse.inside=!0;const e=this.host.renderer;if(this.drag){const n=e.groundPoint(this.drag.x,this.drag.y),i=e.groundPoint(t.clientX,t.clientY);e.cam.x=this.drag.cx-(i.x-n.x),e.cam.z=this.drag.cz-(i.z-n.z)}}pickEnemy(t,e){this.host.sim;const n=this.hero.team;return this.host.renderer.pickUnit(t,e,i=>i.team!==n&&!i.dead&&!i.invuln)}onDown(t){if(this.host.uiBlocking())return;const e=this.host.sim,n=this.host.renderer;if(t.button===1){t.preventDefault(),this.drag={x:t.clientX,y:t.clientY,cx:n.cam.x,cz:n.cam.z};return}if(!(e.winner>=0)){if(t.button===0){if(t.altKey){const i=n.groundPoint(t.clientX,t.clientY);this.host.ping(i.x,i.z);return}if(this.aim&&!this.aim.held){this.castAimed();return}if(this.attackMovePending){const i=n.groundPoint(t.clientX,t.clientY),s=this.pickEnemy(t.clientX,t.clientY);s?this.host.send({c:"attack",target:s.id}):this.host.send({c:"amove",x:i.x,z:i.z}),this.marker(i.x,i.z,16738896),this.attackMovePending=!1,this.host.onPlayerCommand("amove");return}}if(t.button===2){if(t.preventDefault(),this.aim){this.aim=null,this.host.renderer.showIndicator(null);return}this.attackMovePending=!1;const i=this.pickEnemy(t.clientX,t.clientY),s=n.groundPoint(t.clientX,t.clientY);i?(this.host.send({c:"attack",target:i.id}),this.marker(i.x,i.z,16732224,1.1),this.host.onPlayerCommand("attack")):(this.host.send({c:"move",x:s.x,z:s.z}),this.marker(s.x,s.z,16769162),this.host.onPlayerCommand("move"))}}}onUp(t){t.button===1&&(this.drag=null)}marker(t,e,n,i=.9){this.host.renderer.decals.spawn("ring",t,e,i,n,.45)}keyName(t){const e=t.key.toLowerCase();return e==="escape"?"escape":e}onKey(t,e){const n=t.target;if(n&&(n.tagName==="INPUT"||n.tagName==="TEXTAREA"||n.tagName==="SELECT")){e&&t.key==="Escape"&&(n.blur(),this.host.cancelUi());return}const i=this.keyName(t),s=this.host.settings.keys,a=this.host.sim;if(i==="tab"){t.preventDefault(),this.host.toggleScoreboard(e);return}if(e&&i==="escape"){if(this.aim||this.attackMovePending){this.aim=null,this.attackMovePending=!1,this.host.renderer.showIndicator(null);return}if(this.host.cancelUi())return;this.host.togglePause();return}if(!(this.host.uiBlocking()&&!(i===s.shop&&e)))if(e){if(t.repeat){i===s.follow&&t.preventDefault();return}if(this.keys.add(i),a.winner>=0)return;const o=[s.q,s.w,s.e,s.r].indexOf(i);if(o>=0){if(t.preventDefault(),t.ctrlKey){this.host.send({c:"rank",ab:o});return}this.beginAbility(o);return}if(t.ctrlKey||t.metaKey)return;if(i===s.talent1||i===s.talent2){const l=i===s.talent1?0:1,c=this.host.renderer.groundPoint(this.mouse.x,this.mouse.y);this.host.send({c:"talent",idx:l,x:c.x,z:c.z});return}if(/^[1-6]$/.test(i)){this.host.send({c:"use",idx:Number(i)-1});return}if(i===s.recall){this.host.send({c:"recall"}),this.host.onPlayerCommand("recall");return}if(i===s.shop){t.preventDefault(),this.host.toggleShop();return}if(i===s.ward){const l=this.host.renderer.groundPoint(this.mouse.x,this.mouse.y);this.host.send({c:"ward",x:l.x,z:l.z}),this.host.onPlayerCommand("ward");return}if(i===s.stop){this.host.send({c:"stop"});return}if(i===s.hold){this.host.send({c:"hold"});return}if(i===s.attackMove){this.attackMovePending=!0,this.aim=null,this.host.renderer.showIndicator(null);return}if(i===s.follow){t.preventDefault(),this.follow=!0;return}if(i===s.lock){this.host.renderer.cam.lock=!this.host.renderer.cam.lock,this.host.toast(this.host.renderer.cam.lock?"Camera locked":"Camera unlocked");return}if(i==="f1"){t.preventDefault(),this.host.renderer.cam.x=this.hero.x,this.host.renderer.cam.z=this.hero.z;return}if(i==="f3"){t.preventDefault(),this.host.toggleDebug();return}if(i==="m"){this.host.toggleMap();return}if(i==="enter")return}else{this.keys.delete(i),i===s.follow&&(this.follow=!1);const o=[s.q,s.w,s.e,s.r].indexOf(i);o>=0&&this.aim&&this.aim.slot===o&&this.aim.held&&this.castAimed()}}def(t){return Ut[this.hero.hero.heroId].abilities[t]}beginAbility(t){const e=this.hero;if(e.dead)return;const n=e.hero,i=this.def(t);if(n.ranks[t]<=0){this.host.toast(n.skillPts>0?`Learn ${i.name} first (Ctrl+${i.key})`:`${i.name} is not learned`);return}const s=n.rec[t];if(!!(s&&s.until>this.host.sim.time)||i.targeting==="self"){this.castNow(t);return}const o=this.host.settings.castMode;if(o==="quick"){this.castNow(t);return}this.attackMovePending=!1,this.aim={slot:t,held:o==="indicator"}}castAimed(){const t=this.aim;this.aim=null,this.host.renderer.showIndicator(null),t&&this.castNow(t.slot)}resolveTarget(t){const e=this.host.sim,n=this.hero,i=this.host.renderer;if(t.targeting==="unit"){let s=i.pickUnit(this.mouse.x,this.mouse.y,a=>a.team!==n.team&&!a.dead&&!a.invuln&&!a.stype&&a.kind!=="ward");if(!s){const a=i.groundPoint(this.mouse.x,this.mouse.y);let o=6;for(const l of e.units){if(l.dead||l.team===n.team||l.invuln||l.stype||l.kind==="ward"||!e.canSee(n.team,l)||t.key==="R"&&l.kind!=="hero")continue;const c=et(l.x,l.z,a.x,a.z);c<o&&(o=c,s=l)}}return s?s.id:0}if(t.targeting==="ally"){let s=i.pickUnit(this.mouse.x,this.mouse.y,a=>a.team===n.team&&a.kind==="hero"&&a.id!==n.id&&!a.dead);if(!s){let a=1e9;for(const o of e.heroes){if(o.dead||o.team!==n.team||o.id===n.id)continue;const l=et(o.x,o.z,n.x,n.z);l<a&&(a=l,s=o)}}return s?s.id:0}return 0}castNow(t){this.hero;const e=this.def(t),n=this.host.renderer.groundPoint(this.mouse.x,this.mouse.y),i=this.resolveTarget(e);if((e.targeting==="unit"||e.targeting==="ally")&&!i){this.host.toast("No valid target");return}this.host.send({c:"cast",ab:t,x:n.x,z:n.z,target:i}),this.host.onPlayerCommand(`cast${t}`)}update(t){const e=this.host.renderer,n=this.hero,i=48*(e.cam.height/34)*t;let s=0,a=0;if(this.keys.has("arrowleft")&&(s-=1),this.keys.has("arrowright")&&(s+=1),this.keys.has("arrowup")&&(a+=1),this.keys.has("arrowdown")&&(a-=1),this.host.settings.edgeScroll&&this.mouse.inside&&!this.drag&&document.hasFocus()&&!this.host.uiBlocking()){const h=window.innerWidth,u=window.innerHeight;this.mouse.x<=10?s-=1:this.mouse.x>=h-10&&(s+=1),this.mouse.y<=10?a+=1:this.mouse.y>=u-10&&(a-=1)}if(s||a){const c=Math.hypot(s,a)||1;s/=c,a/=c,e.cam.x+=(s+a)/Math.SQRT2*i,e.cam.z+=(s-a)/Math.SQRT2*i}this.follow&&!n.dead&&(e.cam.x+=(n.x-e.cam.x)*Math.min(1,t*9),e.cam.z+=(n.z-e.cam.z)*Math.min(1,t*9));const o=this.host.uiBlocking()?null:this.pickEnemy(this.mouse.x,this.mouse.y);e.setHover(o?o.id:0),this.el.style.cursor=this.attackMovePending||this.aim?"crosshair":o?"pointer":"default";const l=this.aim;if(l&&!n.dead){const c=this.def(l.slot),h=e.groundPoint(this.mouse.x,this.mouse.y);let u=h.x,d=h.z;if(c.targeting==="point"){const _=et(n.x,n.z,h.x,h.z);_>c.range&&(u=n.x+(h.x-n.x)/_*c.range,d=n.z+(h.z-n.z)/_*c.range)}let f=c.shape,g=!0;if(c.targeting==="unit"||c.targeting==="ally"){const _=this.resolveTarget(c),y=_?this.host.sim.byId.get(_):null;g=!!y&&et(n.x,n.z,y.x,y.z)<=c.range+.5,y&&(u=y.x,d=y.z),f="unit"}const x=n.hero,m=x.cds[l.slot]<=this.host.sim.time&&n.mana>=c.cost[Math.max(0,x.ranks[l.slot]-1)],p=c.tags.includes("shield")||c.tags.includes("buff");e.showIndicator({kind:f,x:n.x,z:n.z,tx:u,tz:d,range:c.targeting==="self"?0:c.range,size:c.size,color:p?7399679:16752704,valid:g&&m})}else this.attackMovePending,e.showIndicator(null);this.ping=0}}const Zo={q:"q",w:"w",e:"e",r:"r",talent1:"d",talent2:"f",recall:"b",shop:"p",ward:"t",stop:"s",hold:"h",attackMove:"a",scoreboard:"tab",follow:" ",lock:"y"},Uh={castMode:"indicator",volume:.6,music:.35,shake:.5,effects:"high",quality:"high",colorblind:!1,uiScale:100,edgeScroll:!0,showDamage:!0,captions:!0,tutorialHints:!0,keys:{...Zo}},os={settings:"crownfall.settings.v1",history:"crownfall.history.v1",profile:"crownfall.profile.v1"};function Qo(r){try{const t=localStorage.getItem(r);return t===null?{value:null,corrupt:!1}:{value:JSON.parse(t),corrupt:!1}}catch{return{value:null,corrupt:!0}}}function tl(r,t){try{localStorage.setItem(r,JSON.stringify(t))}catch{}}let Nh=!1;function wx(){const r=Qo(os.settings);r.corrupt&&(Nh=!0);const t={...Uh,...r.value??{}};return t.keys={...Zo,...r.value?.keys??{}},[100,125,150].includes(t.uiScale)||(t.uiScale=100),t.volume=Math.min(1,Math.max(0,Number(t.volume)||0)),t.music=Math.min(1,Math.max(0,Number(t.music)||0)),t}function Ex(r){tl(os.settings,r)}function Fh(){const r=Qo(os.history);return Array.isArray(r.value)?r.value:[]}function Tx(r){const t=Fh();t.unshift(r),tl(os.history,t.slice(0,40))}function Ax(){const r=Qo(os.profile),t=r.value&&typeof r.value=="object"?r.value:null;return{matches:t?.matches??0,wins:t?.wins??0,mastery:t?.mastery??{},tutorialDone:!!t?.tutorialDone,banner:t?.banner??"brass"}}function Ra(r){tl(os.profile,r)}function Rx(r){return Math.floor(Math.sqrt(r/60))+1}function Cx(r){return Math.floor(Math.sqrt(Object.values(r.mastery).reduce((t,e)=>t+e,0)/90))+1}let Wi=null;function Oh(){if(Wi)return Wi;Wi={};try{const e=document.createElement("canvas");e.width=280,e.height=360;const n=new bh({canvas:e,alpha:!0,antialias:!0,preserveDrawingBuffer:!0});n.setSize(280,360,!1),n.outputColorSpace=Oe,n.setClearColor(0,0),n.shadowMap.enabled=!1;const i=new Sh;i.add(new Ph(14478335,5917296,1.3));const s=new wo(16773328,2.6);s.position.set(-3,6,5),i.add(s);const a=new wo(8374527,1.6);a.position.set(4,3,-4),i.add(a);const o=new tn(32,280/360,.1,50);for(const l of si){const c=Lh(l.id);c.group.rotation.y=-.45,Dh(c,.7,0,0,l.id);const h=new Me;h.add(c.group);const u=new ge(new Dr(1.7,40),new me({color:l.accent,transparent:!0,opacity:.35}));u.rotation.x=-Math.PI/2,u.position.y=.01,h.add(u),i.add(h);const d=c.height+.4;o.position.set(0,d*.62,d*2.05+1.6),o.lookAt(0,d*.46,0),n.render(i,o),Wi[l.id]=e.toDataURL("image/png"),i.remove(h)}n.dispose(),n.forceContextLoss()}catch{Wi={}}return Wi}const Bh=r=>"●".repeat(r)+"○".repeat(3-r);function Px(r,t=0){return v("div",{class:"kit"},v("div",{class:"abil passive"},v("div",{class:"ico"},"✦"),v("div",{},v("b",{},r.passive.name,v("small",{}," Passive")),v("p",{},r.passive.desc))),...r.abilities.map(e=>v("div",{class:`abil${e.ult?" ult":""}`},v("div",{class:"ico"},e.icon),v("div",{},v("b",{},`${e.key} · ${e.name}`,v("small",{},` ${e.range?e.range+"m":"self"} · ${e.cd[0]}s cd${e.recast?" · recast":""}`)),v("p",{},Dc(e,t))))))}function Hh(r,t){return v("div",{class:"hero-panel"},v("div",{class:"hp-top"},v("div",{class:"portrait-big",style:{backgroundImage:t?`url(${t})`:"none"}},t?null:v("span",{},r.name[0])),v("div",{},v("h2",{},r.name),v("div",{class:"sub"},r.title),v("div",{class:"tags"},v("i",{},r.role),v("i",{},`Difficulty ${Bh(r.difficulty)}`),v("i",{},r.resource)),v("p",{class:"blurb"},r.blurb),v("div",{class:"statline"},v("span",{},`HP ${r.hp}`),v("span",{},`AD ${r.ad}`),v("span",{},`Armor ${r.armor}`),v("span",{},`Range ${r.range}m`),v("span",{},`Speed ${r.ms}`)))),Px(r),v("div",{class:"builds"},v("h4",{},"Build directions"),...r.builds.map(e=>v("div",{class:"b"},v("b",{},e.name),v("span",{}," — "+e.why),v("div",{class:"build-items"},...e.items.map(n=>v("span",{class:"chip",style:{color:ee[n].color}},`${ee[n].icon} ${ee[n].name}`)))))))}function zx(r){const t=r.profile;return v("div",{class:"screen menu"},v("div",{class:"menu-left"},v("div",{class:"logo"},v("div",{class:"crown"},"♛"),v("h1",{},"CROWNFALL"),v("div",{class:"tag"},"Two guilds. One sky-island. One reality engine.")),v("nav",{},v("button",{class:"btn primary big",onclick:()=>{se.init(),r.startDraft()}},"▶  Play",v("small",{},"3v3 vs bots · full match")),v("button",{class:`btn big${t.tutorialDone?"":" glow"}`,onclick:()=>{se.init(),r.startTutorial()}},"❖  Tutorial",v("small",{},t.tutorialDone?"Replay the guided first match":"Recommended for new players")),v("button",{class:"btn",onclick:()=>r.openSettings(()=>r.home())},"⚙  Settings"),v("div",{class:"row2"},v("button",{class:"btn",onclick:()=>kx(r)},"Heroes"),v("button",{class:"btn",onclick:()=>Ix(r)},"Items"),v("button",{class:"btn",onclick:()=>Lx(r)},"Match History"),v("button",{class:"btn",onclick:()=>Dx(r)},"Credits"))),v("div",{class:"profile"},v("b",{},`Profile level ${Cx(t)}`),v("span",{},`${t.matches} matches · ${t.wins} wins`))),v("div",{class:"menu-foot"},"Desktop Chrome / Edge · WebGL 2 · keyboard + mouse · 1280×720 and up"))}function Fr(r,t,e,n=!1){const i=document.getElementById("ui"),s=v("div",{class:"screen modal-screen"},v("div",{class:`panel modal${n?" wide":""}`},v("div",{class:"modal-head"},v("h2",{},t),v("button",{class:"x",onclick:()=>{s.remove()}},"×")),e));i.append(s)}function kx(r){const t=Oh(),e=v("div",{class:"heroes-detail"});let n=si[0];const i=v("div",{class:"heroes-list"}),s=()=>{$e(i),$e(e);for(const a of si)i.append(v("div",{class:`hcard${n===a?" sel":""}`,onclick:()=>{n=a,s()}},v("div",{class:"thumb",style:{backgroundImage:`url(${t[a.id]??""})`}}),v("div",{},v("b",{},a.name),v("small",{},a.role))));e.append(Hh(n,t[n.id]))};s(),Fr(r,"Heroes",v("div",{class:"heroes"},i,e),!0)}function Ix(r){const t=v("div",{class:"items-grid"});for(const e of Un)t.append(v("div",{class:`icard tier-${e.tier}`},v("div",{class:"ico",style:{color:e.color,borderColor:e.color}},e.icon),v("div",{},v("b",{},e.name),v("small",{},` ${e.tier} · ${e.cost}g`),v("div",{class:"st"},Object.entries(e.stats).map(([n,i])=>`${n} ${i}`).join(" · ")),e.from?v("div",{class:"st"},"Recipe: "+e.from.map(n=>ee[n].name).join(" + ")):null,e.passive?v("div",{class:"ps"},e.passive):null,e.active?v("div",{class:"ps"},"Active: "+e.active):null)));Fr(r,`Items (${Un.length})`,t,!0)}function Lx(r){const t=Fh(),e=t.length?v("table",{class:"hist"},v("tr",{},v("th",{},"Result"),v("th",{},"Hero"),v("th",{},"K/D/A"),v("th",{},"CS"),v("th",{},"Level"),v("th",{},"Length"),v("th",{},"Difficulty"),v("th",{},"Date")),...t.map(i=>v("tr",{class:i.win?"win":"loss"},v("td",{},i.win?"Victory":"Defeat"),v("td",{},Ut[i.heroId]?.name??i.heroId),v("td",{},`${i.kills}/${i.deaths}/${i.assists}`),v("td",{},String(i.lastHits)),v("td",{},String(i.level)),v("td",{},Fn(i.durationSec)),v("td",{},i.difficulty),v("td",{},new Date(i.date).toLocaleDateString())))):v("p",{class:"empty"},"No matches yet. Play a match and it will appear here."),n=Object.entries(r.profile.mastery);Fr(r,"Match History",v("div",{},e,n.length?v("div",{class:"mastery"},v("h4",{},"Hero mastery"),...n.map(([i,s])=>v("span",{class:"chip"},`${Ut[i]?.name??i}: Lv ${Rx(s)}`))):null))}function Dx(r){Fr(r,"Credits",v("div",{class:"credits"},v("p",{},"Crownfall is an original game: all heroes, abilities, items, map, models, VFX and audio are procedural and authored for this project."),v("p",{},"Built with TypeScript, Vite and Three.js (MIT). No external art, audio or font files are shipped. See ASSETS.md."),v("p",{},"Created in a single autonomous session for the Oneshot Arcade evaluation.")))}function Ux(r,t){const e=r.settings,n=()=>{r.saveSettings()},i=(d,f)=>v("div",{class:"srow"},v("label",{},d),f),s=(d,f,g=0,x=1,m=.05)=>v("input",{type:"range",min:g,max:x,step:m,value:d(),oninput:p=>{f(Number(p.target.value)),n()}}),a=(d,f,g)=>v("select",{onchange:x=>{g(x.target.value),n()}},...d.map(([x,m])=>v("option",{value:x,selected:x===f()?"selected":void 0},m))),o=(d,f)=>v("input",{type:"checkbox",checked:d()?"checked":void 0,onchange:g=>{f(g.target.checked),n()}}),l={q:"Ability 1 (Q)",w:"Ability 2 (W)",e:"Ability 3 (E)",r:"Ultimate (R)",talent1:"Talent 1",talent2:"Talent 2",recall:"Recall",shop:"Shop",ward:"Ward trinket",stop:"Stop",hold:"Hold",attackMove:"Attack-move",scoreboard:"Scoreboard",follow:"Follow hero",lock:"Camera lock"},c=v("div",{class:"keys"}),h=()=>{$e(c);for(const d of Object.keys(l)){const f=v("button",{class:"keybtn",onclick:()=>{f.textContent="press a key…",f.classList.add("wait");const g=x=>{x.preventDefault(),x.stopPropagation(),window.removeEventListener("keydown",g,!0),x.key!=="Escape"&&(e.keys[d]=x.key.toLowerCase(),n()),h()};window.addEventListener("keydown",g,!0)}},(e.keys[d]===" "?"SPACE":e.keys[d]).toUpperCase());c.append(v("div",{class:"krow"},v("span",{},l[d]),f))}c.append(v("button",{class:"btn small",onclick:()=>{e.keys={...Zo},n(),h()}},"Reset keys"))};return h(),v("div",{class:"panel settings"},v("div",{class:"modal-head"},v("h2",{},"Settings"),v("button",{class:"x",onclick:t},"×")),v("div",{class:"sgrid"},v("div",{},v("h4",{},"Controls"),i("Cast mode",a([["indicator","Quick cast with indicator (hold, release)"],["quick","Quick cast (instant)"],["click","Normal (press, then click)"]],()=>e.castMode,d=>{e.castMode=d})),i("Edge scrolling",o(()=>e.edgeScroll,d=>{e.edgeScroll=d})),v("h4",{},"Audio"),i("Effects volume",s(()=>e.volume,d=>{e.volume=d,se.setVolumes(e.volume,e.music)})),i("Music volume",s(()=>e.music,d=>{e.music=d,se.setVolumes(e.volume,e.music)})),v("h4",{},"Accessibility"),i("Colorblind-safe teams",o(()=>e.colorblind,d=>{e.colorblind=d})),i("Effects intensity",a([["high","High"],["low","Low (keeps all gameplay boundaries)"]],()=>e.effects,d=>{e.effects=d})),i("Camera shake",s(()=>e.shake,d=>{e.shake=d})),i("Damage numbers",o(()=>e.showDamage,d=>{e.showDamage=d})),i("Event captions",o(()=>e.captions,d=>{e.captions=d})),i("Tutorial hints",o(()=>e.tutorialHints,d=>{e.tutorialHints=d})),i("UI scale",a([["100","100%"],["125","125%"],["150","150%"]],()=>String(e.uiScale),d=>{e.uiScale=Number(d),document.documentElement.style.setProperty("--ui",String(e.uiScale/100)),document.documentElement.dataset.ui=String(e.uiScale)})),v("h4",{},"Graphics"),i("Quality",a([["high","High (shadows, full resolution)"],["medium","Medium"],["low","Low (no shadows)"]],()=>e.quality,d=>{e.quality=d}))),v("div",{},v("h4",{},"Key bindings"),c)),v("div",{class:"srow end"},v("button",{class:"btn small",onclick:()=>{Object.assign(e,JSON.parse(JSON.stringify(Uh))),n(),t()}},"Restore defaults"),v("button",{class:"btn primary",onclick:t},"Done")))}function Nx(r){const t=Oh();let e=si[0].id,n=["mend","sprint"],i="normal",s=!1,a=40;const o=v("div",{class:"d-center"}),l=v("div",{class:"d-cards"}),c=v("div",{class:"talent-grid"}),h=v("div",{class:"slots"}),u=v("div",{class:"d-timer"},"40"),d=v("button",{class:"btn primary big",onclick:()=>g()},"Lock In"),f=()=>{$e(l),$e(o),$e(c),$e(h);for(const _ of si)l.append(v("div",{class:`d-card${e===_.id?" sel":""}${s?" off":""}`,onclick:()=>{s||(e=_.id,se.play("click",.6),f())}},v("div",{class:"thumb",style:{backgroundImage:`url(${t[_.id]??""})`}},t[_.id]?null:v("span",{},_.name[0])),v("b",{},_.name),v("small",{},`${_.role} · ${Bh(_.difficulty)}`)));o.append(Hh(Ut[e],t[e]));for(const _ of To){const y=n.includes(_.id);c.append(v("div",{class:`talent${y?" on":""}`,title:_.desc,onclick:()=>{s||(y?n=n.filter(M=>M!==_.id):n=[...n,_.id].slice(-2),f())}},v("div",{class:"ico"},_.icon),v("b",{},_.name),v("small",{},`${_.desc} (${_.cd}s)`)))}h.append(v("div",{class:"team-slots"},v("h4",{},Te[0]+" (you)"),v("div",{class:"slot me"},v("b",{},Ut[e].name),v("small",{},s?"Locked":"Choosing…")),v("div",{class:"slot"},v("b",{},"Ally bot"),v("small",{},"Picks a complementary role")),v("div",{class:"slot"},v("b",{},"Ally bot"),v("small",{},"Picks after you lock"))),v("div",{class:"team-slots foe"},v("h4",{},Te[1]),v("div",{class:"slot"},v("b",{},"???"),v("small",{},"Hidden until load")),v("div",{class:"slot"},v("b",{},"???")),v("div",{class:"slot"},v("b",{},"???")))),d.textContent=s?"Locked ✔":n.length===2?"Lock In":"Choose 2 talents",d.classList.toggle("disabled",s||n.length!==2)},g=()=>{s||n.length!==2||(s=!0,window.clearInterval(x),se.play("ring",.8),f(),setTimeout(()=>r.beginMatch({heroId:e,talents:[n[0],n[1]],difficulty:i}),450))},x=window.setInterval(()=>{a--,u.textContent=String(a),a<=0&&(window.clearInterval(x),n.length===2||(n=["mend","sprint"]),g())},1e3),m=v("div",{class:"diff"},...["easy","normal","hard"].map(_=>v("button",{class:`btn small${i===_?" on":""}`,onclick:y=>{i=_,y.target.parentElement.querySelectorAll("button").forEach(M=>M.classList.remove("on")),y.target.classList.add("on")}},_[0].toUpperCase()+_.slice(1))));f();const p=v("div",{class:"screen draft"},v("div",{class:"d-head"},v("h2",{},"Hero Select"),v("div",{class:"sub"},"Pick a hero and two universal talents (D / F). Allies cannot duplicate; the enemy may mirror you."),u,v("button",{class:"btn small",onclick:()=>{window.clearInterval(x),r.home()}},"← Back")),v("div",{class:"d-body"},l,o,v("div",{class:"d-right"},h,v("h4",{},"Talents"),c,v("h4",{},"Bot difficulty"),m,v("div",{class:"diffnote"},"Difficulty changes reaction time, aim and map planning only: never stats or vision."),d)));return p.stop=()=>window.clearInterval(x),p}function Fx(r,t){return v("div",{class:"screen loading"},v("div",{class:"ld-box panel"},v("h2",{},"Entering The Broken Diadem"),v("div",{class:"ld-bar"},v("i",{})),...r.map(e=>v("p",{},e)),v("div",{class:"tip"},"Tip: "+t)))}function Ca(r,t){return v("div",{class:"screen error"},v("div",{class:"panel"},v("h2",{},r),v("p",{},t),v("button",{class:"btn primary",onclick:()=>location.reload()},"Reload")))}function Ox(r,t,e){const n=t.player,i=t.winner===n.team,s=t.time,a=Math.max(...t.heroes.map(x=>x.hero.damageDealt),1),o=Math.max(...t.heroes.map(x=>x.hero.totalGold),1),l=x=>t.heroes.filter(m=>m.team===x).map(m=>{const p=m.hero,_=Ut[p.heroId];return v("tr",{class:m===n?"me":""},v("td",{},v("b",{},_.name),v("small",{},` Lv${p.level}`)),v("td",{},`${p.kills}/${p.deaths}/${p.assists}`),v("td",{},String(p.lastHits+p.monsterKills)),v("td",{class:"bars"},v("div",{class:"bar dmg"},v("i",{style:{width:`${p.damageDealt/a*100}%`}}),v("span",{},mr(p.damageDealt)))),v("td",{class:"bars"},v("div",{class:"bar gold"},v("i",{style:{width:`${p.totalGold/o*100}%`}}),v("span",{},mr(p.totalGold)))),v("td",{},String(p.objectives)),v("td",{},`${p.wardsPlaced}`),v("td",{class:"it"},...p.items.map(y=>v("span",{style:{color:y?ee[y.id].color:"#456"},title:y?ee[y.id].name:""},y?ee[y.id].icon:"·"))))}),c=v("tr",{},v("th",{},"Hero"),v("th",{},"K/D/A"),v("th",{},"CS"),v("th",{},"Damage"),v("th",{},"Gold"),v("th",{},"Obj"),v("th",{},"Wards"),v("th",{},"Items")),h=n.hero,u=[...t.heroes].sort((x,m)=>m.hero.damageToStructures-x.hero.damageToStructures)[0],d=h.kills>=6?"Kingslayer":h.damageToStructures>3e3?"Siege Mason":h.assists>=8?"Guild Anchor":h.lastHits+h.monsterKills>=150?"Harvest Master":"Steady Hand",f=t.timeline.filter(x=>x.kind!=="kill"||!0).slice(-40);return v("div",{class:"screen results"},v("div",{class:"panel res-panel"},v("div",{class:`res-banner ${i?"win":"loss"}`},v("h1",{},e?"Tutorial Complete":i?"VICTORY":"DEFEAT"),v("div",{class:"sub"},`${Te[t.winner===0?0:1]} destroyed the Crown Engine · ${Fn(s)}`)),v("div",{class:"res-grid"},v("div",{},v("h4",{class:"blue"},`${Te[0]} · ${t.teams[0].kills} kills`),v("table",{},c,...l(0)),v("h4",{class:"red"},`${Te[1]} · ${t.teams[1].kills} kills`),v("table",{},c,...l(1))),v("div",{class:"res-side"},v("h4",{},"Your match"),v("div",{class:"commend"},`Commendation: ${d}`),v("p",{},`Skill order: ${h.skillLog.map(x=>x.split(":")[1]).join(" → ")||"—"}`),v("p",{},`Build: ${h.buildLog.map(x=>ee[x.item].name).join(" → ")||"—"}`),v("p",{},`Damage to structures: ${mr(h.damageToStructures)} · Vision: ${h.wardsPlaced} wards placed, ${h.wardsKilled} destroyed`),v("p",{},`Top siege: ${Ut[u.hero.heroId].name}`),v("h4",{},"Match timeline"),v("div",{class:"tl"},...f.map(x=>v("div",{class:`tl-row t${x.team}`},v("time",{},Fn(x.t)),v("span",{},x.text)))))),v("div",{class:"res-actions"},v("button",{class:"btn primary big",onclick:()=>r.playAgain()},e?"Start a real match":"Play again"),v("button",{class:"btn big",onclick:()=>r.home()},"Main menu"))))}const Ic=["Last-hit minions for gold. Allied minions near a tower soak its shots; walk in with them, not ahead of them.","Brush hides you from enemies outside a short range. Wards reveal brush and the fog around them.","A Seal cannot be attacked until its Seal Guard Tower falls. Break one Seal, then take both Core Towers, then the Crown Engine.","The Aether Colossus empowers nearby allied minions for 150 seconds. Contest it with your whole team.","Towers target minions first, but switch to any hero who attacks an ally inside their range.","Hold the ability key to see its indicator, release to cast. Esc or right-click cancels."];class Bx{steps=[{id:"move",title:"Move",hint:"Right-click the ground to move your hero.",done:!1},{id:"shop",title:"Shop",hint:"Press P at the fountain and buy an item (double-click an item).",done:!1},{id:"learn",title:"Learn a skill",hint:"Press Ctrl+Q (or click the glowing +) to spend your skill point.",done:!1},{id:"attack",title:"Attack",hint:"Wait for the first minion wave, then right-click an enemy minion to attack it.",done:!1},{id:"lasthit",title:"Last-hit",hint:"Deal the killing blow to an enemy minion to earn its gold.",done:!1},{id:"cast",title:"Cast",hint:"Hold Q, aim at an enemy, release to fire. Hold to see the indicator.",done:!1},{id:"ward",title:"Place a ward",hint:"Press T to place a ward at the cursor. Wards reveal brush and fog.",done:!1},{id:"recall",title:"Recall",hint:"Press B and stand still for 7 seconds to return to the fountain.",done:!1},{id:"tower",title:"Tower rules",hint:"Towers shoot minions first. Attack an enemy tower while your minions are near it. Never dive without them.",done:!1},{id:"objective",title:"Objectives",hint:"Catalysts (3:30) and the Aether Colossus (9:00) give team buffs. Break a Seal, then both Cores, then the Crown Engine to win.",done:!1}];moved=0;recalled=!1;announceSeen=!1;coreDone=!1;update(t,e){const n=t.player.hero,i=(s,a)=>{const o=this.steps.find(l=>l.id===s);a&&!o.done&&(o.done=!0)};i("move",!!e.move),i("shop",n.items.some(Boolean)),i("learn",n.ranks.some(s=>s>0)),i("attack",!!e.attack&&n.damageDealt>0),i("lasthit",n.lastHits>0),i("cast",!!e.cast0||!!e.cast1||!!e.cast2||!!e.cast3),i("ward",n.wardsPlaced>0),i("recall",this.recalled),i("tower",n.damageToStructures>0),i("objective",t.time>215||this.announceSeen),this.coreDone=this.steps.slice(0,8).every(s=>s.done)}get current(){return this.steps.find(t=>!t.done)}}class Hx{constructor(t,e,n){this.mode=e,this.sel=n,this.sim=t,e==="tutorial"&&(this.tutorial=new Bx)}sim;hud;input;paused=!1;speed=1;acc=0;seq=0;ended=!1;endTimer=0;resultsShown=!1;tutorial=null;flags={};pauseEl=null}class Gx{root;canvas;ui;settings;profile;renderer;demo=null;match=null;last=0;demoFollow=0;demoTimer=0;demoAcc=0;currentScreen=null;tutorialTick=0;lost=!1;constructor(t){this.root=t,this.settings=wx(),this.profile=Ax(),this.canvas=v("canvas",{id:"gl"}),this.ui=v("div",{id:"ui"}),t.append(this.canvas,this.ui),document.documentElement.style.setProperty("--ui",String(this.settings.uiScale/100)),document.documentElement.dataset.ui=String(this.settings.uiScale),se.vol=this.settings.volume,se.musicVol=this.settings.music}start(){if(!document.createElement("canvas").getContext("webgl2")){this.ui.append(Ca("WebGL 2 required","Crownfall needs a desktop browser with WebGL 2 enabled (current Chrome, Edge or Firefox). Enable hardware acceleration in your browser settings and reload."));return}try{this.renderer=new vx(this.canvas,this.settings)}catch(n){this.ui.append(Ca("Could not start the renderer",`Graphics initialisation failed: ${n.message}`));return}this.canvas.addEventListener("webglcontextlost",n=>{n.preventDefault(),this.lost=!0,this.ui.append(Ca("Graphics context lost","The GPU driver reset the graphics context. Reload to continue."))}),window.addEventListener("resize",()=>this.renderer.resize()),document.addEventListener("visibilitychange",()=>{const n=this.match;document.hidden&&n&&!n.paused&&!n.resultsShown&&this.togglePause(n)}),Nh&&setTimeout(()=>this.toast("Saved settings were unreadable and have been reset."),600),this.home(),this.last=performance.now(),requestAnimationFrame(n=>this.frame(n))}saveSettings(){Ex(this.settings),se.setVolumes(this.settings.volume,this.settings.music),this.renderer?.applyQuality()}toast(t){const e=v("div",{class:"toast big"},t);this.ui.append(e),setTimeout(()=>e.remove(),2600)}show(t){this.currentScreen&&(this.currentScreen.stop?.(),this.currentScreen.remove()),this.currentScreen=t,t&&this.ui.append(t)}ensureDemo(){if(this.demo)return;const t=new As(Date.now()&2147483647),e=si.map(s=>s.id),n=s=>({heroId:t.pick(e),team:s,controller:"bot",talents:["mend","aegis"]}),i=[n(0),n(0),n(0),n(1),n(1),n(1)];this.demo=new $r({seed:t.int(1,1e9),picks:i,difficulty:"hard",mode:"match",startGold:700});for(let s=0;s<2100;s++)this.demo.step();this.demo.events.length=0,this.renderer.setSim(this.demo),this.renderer.setFog(!1),this.renderer.cam.height=38,this.renderer.cam.lock=!1}home(){this.disposeMatch(),this.ensureDemo(),this.renderer.setSim(this.demo),this.renderer.setFog(!1),this.show(zx(this)),se.stopMusic()}openSettings(t){const e=v("div",{class:"screen modal-screen"},Ux(this,()=>{e.remove(),this.renderer?.applyQuality(),t()}));this.ui.append(e)}startDraft(){this.ensureDemo(),this.show(Nx(this))}randomTalents(t){const e=To.map(s=>s.id),n=t.pick(e);let i=t.pick(e);for(;i===n;)i=t.pick(e);return[n,i]}beginMatch(t){const e=new As((Date.now()^1540483477)&2147483647),n=Ut[t.heroId],i=si.map(u=>u.id),s=i.filter(u=>u!==t.heroId);s.sort((u,d)=>(Ut[u].role===n.role?1:0)-(Ut[d].role===n.role?1:0)||e.next()-.5);const a=s.slice(0,2),o=[...i],l=[];for(;l.length<3;){const u=e.pick(o);l.push(u),o.splice(o.indexOf(u),1)}const c=[{heroId:t.heroId,team:0,controller:"player",talents:t.talents,name:n.name},...a.map(u=>({heroId:u,team:0,controller:"bot",talents:this.randomTalents(e)})),...l.map(u=>({heroId:u,team:1,controller:"bot",talents:this.randomTalents(e)}))],h=new $r({seed:e.int(1,1e9),picks:c,difficulty:t.difficulty,mode:"match"});this.launch(h,"match",t)}startTutorial(){const t=["mend","sprint"],e=[{heroId:"suri",team:0,controller:"player",talents:t,name:"Suri Vale"},{heroId:"brannoch",team:0,controller:"bot",talents:["aegis","purify"]},{heroId:"oru",team:0,controller:"bot",talents:["mend","aegis"]},{heroId:"kesh",team:1,controller:"bot",talents:["mend","aegis"]},{heroId:"ilyra",team:1,controller:"bot",talents:["mend","aegis"]},{heroId:"vey",team:1,controller:"bot",talents:["mend","aegis"]}],n=new $r({seed:4242,picks:e,difficulty:"easy",mode:"tutorial",enemyPassive:!0,startGold:650});this.launch(n,"tutorial",{heroId:"suri",talents:t,difficulty:"easy"})}playAgain(){if(this.match?.mode==="tutorial"){this.disposeMatch(),this.startDraft();return}this.disposeMatch(),this.startDraft()}launch(t,e,n){se.init();const i=[...t.bots.brains.entries()].filter(([c])=>t.byId.get(c).team===0),s=i.map(([c,h])=>`${t.byId.get(c).hero.name}: ${h.role==="jungle"?"jungle":(h.lane===0?"upper":"lower")+" lane"+(h.role==="support"?" (support)":"")}`),a=i.some(([,c])=>c.role==="jungle"),o=`Suggested for you: ${i.some(([,c])=>c.lane===1&&c.role!=="jungle")?"upper":"either"} lane${a?"":" (no jungler on your team)"}.`,l=Fx([...s,o,`Enemy team: ${t.heroes.filter(c=>c.team===1).map(c=>c.hero.name).join(", ")}`],Ic[Math.floor(Math.random()*Ic.length)]);this.show(l),setTimeout(()=>{this.disposeMatch();const c=new Hx(t,e,n);this.match=c,this.renderer.setSim(t),this.renderer.setFog(!0),this.renderer.cam.height=34,this.renderer.cam.lock=!0,c.hud=new bx(this.hostFor(c)),this.ui.append(c.hud.el),c.input=new Sx(this.inputHost(c),this.canvas),this.show(null),e==="tutorial"&&this.refreshTutorial(c),se.startMusic(),this.renderer.cam.x=t.player.x+6,this.renderer.cam.z=t.player.z,setTimeout(()=>c.hud.toggleShop(!0),400),e==="match"&&c.hud.showHint("<b>Controls</b> · Right-click move / attack · <b>Q W E R</b> hold to aim, release to cast · <b>Ctrl+key</b> learn skill · <b>P</b> shop · <b>B</b> recall · <b>T</b> ward · <b>Tab</b> scoreboard · <b>M</b> map · <b>Alt+click</b> ping · <b>Y</b> camera lock · <b>Esc</b> pause",16)},1900)}disposeMatch(){const t=this.match;t&&(t.hud.destroy(),t.input.destroy(),t.pauseEl?.remove(),this.match=null,se.stopMusic(),se.setIntensity(0))}send(t,e){t.paused||t.ended||t.sim.command({...e,slot:t.sim.playerSlot,seq:++t.seq})}hostFor(t){return{sim:t.sim,renderer:this.renderer,settings:this.settings,mode:t.mode,send:e=>this.send(t,e),castSlot:e=>t.input.beginAbility(e),rankUp:e=>this.send(t,{c:"rank",ab:e})}}inputHost(t){return{sim:t.sim,renderer:this.renderer,settings:this.settings,send:e=>this.send(t,e),toast:e=>t.hud.toast(e),toggleShop:()=>t.hud.toggleShop(),toggleScoreboard:e=>t.hud.showBoard(e),toggleMap:()=>t.hud.toggleMap(),togglePause:()=>this.togglePause(t),toggleDebug:()=>t.hud.toggleDebug(),cancelUi:()=>t.hud.closeOverlays(),uiBlocking:()=>t.hud.blocking||!!t.pauseEl||t.resultsShown,ping:(e,n)=>{t.hud.addPing(e,n)&&(this.renderer.decals.spawn("ring",e,n,2.4,16765024,2.5,1,0,{pulse:!0}),se.play("alert",.6))},onPlayerCommand:e=>{t.flags[e]=!0,e==="recall"&&this.noteRecall(t)}}}noteRecall(t){}togglePause(t){if(t.resultsShown)return;if(t.pauseEl){t.pauseEl.remove(),t.pauseEl=null,t.paused=!1;return}t.paused=!0;const e=t.mode==="tutorial"?v("div",{class:"speed"},v("span",{},"Practice speed: "),...[1,2,3].map(n=>v("button",{class:`btn small${t.speed===n?" on":""}`,onclick:()=>{t.speed=n,this.togglePause(t),this.togglePause(t)}},`×${n}`))):null;t.pauseEl=v("div",{class:"screen modal-screen pause"},v("div",{class:"panel modal"},v("h2",{},"Paused"),v("p",{},"The match is paused. Bots are waiting."),e,v("button",{class:"btn primary big",onclick:()=>this.togglePause(t)},"Resume"),v("button",{class:"btn big",onclick:()=>this.openSettings(()=>{})},"Settings"),v("button",{class:"btn big",onclick:()=>{this.home()}},"Quit to menu"))),this.ui.append(t.pauseEl)}refreshTutorial(t){const e=t.tutorial;if(!e)return;const n=e.current,i=v("div",{class:"tut panel"},v("div",{class:"tut-head"},v("b",{},"Tutorial"),v("button",{class:"btn small",onclick:()=>{this.profile.tutorialDone=!0,Ra(this.profile),this.home()}},"Skip")),v("ol",{},...e.steps.map(s=>v("li",{class:`${s.done?"done":""}${s===n?" cur":""}`},v("span",{},s.done?"✔":s===n?"▶":"○"),s.title))),n&&this.settings.tutorialHints?v("div",{class:"tut-hint"},n.hint):null,n?null:v("div",{class:"tut-hint"},"You know the loop. Destroy the Crown Engine to finish, or return to the menu and start a real match."),e.coreDone?v("button",{class:"btn primary small",onclick:()=>{this.profile.tutorialDone=!0,Ra(this.profile),this.home(),this.startDraft()}},"Start a real match"):null);t.hud.setTutorial(i)}frame(t){if(requestAnimationFrame(s=>this.frame(s)),this.lost)return;const e=Math.min(.1,(t-this.last)/1e3);this.last=t;const n=this.match,i=this.renderer;if(n){const s=n.sim;if(!n.paused){n.acc+=e*n.speed;let o=0;for(;n.acc>=xe&&o<8;)s.step(),n.acc-=xe,o++;n.acc>xe*8&&(n.acc=0)}const a=s.events.splice(0);if(this.dispatch(n,a),n.input.update(e),i.render(t/1e3,n.paused?1:n.acc/xe),n.hud.frame(e),se.listener.x=i.cam.x,se.listener.z=i.cam.z,n.tutorial&&(this.tutorialTick+=e,this.tutorialTick>.25)){this.tutorialTick=0;const o=n.tutorial.steps.map(l=>l.done).join();n.tutorial.update(s,n.flags),o!==n.tutorial.steps.map(l=>l.done).join()&&(this.refreshTutorial(n),se.play("ring",.7))}s.winner>=0&&(n.endTimer+=e,n.ended=!0,n.endTimer>3.4&&!n.resultsShown&&this.showResults(n))}else if(this.demo){const s=this.demo;this.demoAcc+=e;let a=0;for(;this.demoAcc>=xe&&a<4;)s.step(),this.demoAcc-=xe,a++;this.demoAcc>xe*4&&(this.demoAcc=0),s.events.length=0,this.demoTimer-=e,this.demoTimer<=0&&(this.demoTimer=14,this.demoFollow=(this.demoFollow+1)%6);const o=s.heroes[this.demoFollow];o&&(i.cam.x+=(o.x-i.cam.x)*Math.min(1,e*1.2),i.cam.z+=(o.z-i.cam.z)*Math.min(1,e*1.2)),i.render(t/1e3,Math.min(1,this.demoAcc/xe))}}dispatch(t,e){if(e.length){this.renderer.handleEvents(e),t.hud.handleEvents(e);for(const n of e)n.t==="recall"&&n.done&&n.unit===t.sim.player.id&&t.tutorial&&(t.tutorial.recalled=!0),n.t==="announce"&&t.tutorial&&/Catalyst|Colossus/.test(n.text)&&(t.tutorial.announceSeen=!0),n.t==="victory"&&se.play(n.team===t.sim.player.team?"victory":"defeat"),n.t,n.t==="levelup"&&n.unit===t.sim.player.id&&this.renderer.addShake(.1)}}showResults(t){t.resultsShown=!0;const e=t.sim,n=e.player,i=n.hero,s=e.winner===n.team;if(t.mode==="match"||t.mode==="tutorial"){Tx({id:Date.now(),date:new Date().toISOString(),win:s,durationSec:Math.round(e.time),heroId:i.heroId,kills:i.kills,deaths:i.deaths,assists:i.assists,lastHits:i.lastHits+i.monsterKills,level:i.level,gold:Math.round(i.totalGold),difficulty:t.sel?.difficulty??"normal",mode:t.mode,items:i.items.filter(Boolean).map(l=>l.id),teamKills:[e.teams[0].kills,e.teams[1].kills]});const o=this.profile;o.matches++,s&&o.wins++,o.mastery[i.heroId]=(o.mastery[i.heroId]??0)+Math.round(60+e.time/6+i.kills*10+i.assists*5+(s?120:0)),t.mode==="tutorial"&&(o.tutorialDone=!0),Ra(o)}t.hud.setTutorial(null);const a=Ox(this,e,t.mode==="tutorial");this.ui.append(a),this.currentScreen=a}}const Lc=document.getElementById("app");if(Lc){const r=new Gx(Lc);r.start(),window.__crownfall=r}
