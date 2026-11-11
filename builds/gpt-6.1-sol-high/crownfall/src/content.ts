export type Team=0|1;
export const HEROES=[
 {name:'Suri Vale',title:'Ember Courier',role:'MARKSMAN',color:'#ffb45f',sigil:'➶',description:'Keep moving. Deliver fire.',hp:760,range:9,damage:47,skills:['Ricochet Bolt','Slipstream','Parcel Charge','Redline Delivery'],details:['Piercing ember bolt toward the cursor.','Dash toward the cursor and gain a shield.','Detonate a delayed charge at the cursor.','A telegraphed, long-range corridor blast.']},
 {name:'Brannoch',title:'Bastion Mason',role:'VANGUARD',color:'#d8c69a',sigil:'⬡',description:'Become the line they cannot cross.',hp:1150,range:3.3,damage:66,skills:['Fault Hammer','Rampart Fold','Anchor Line','Citybreaker'],details:['A broad slam damages and slows.','Raise a protective shield and heal nearby allies.','Pull yourself toward the cursor.','Leap into a devastating circular impact.']},
 {name:'Oru',title:'Choir of Moths',role:'SUPPORT',color:'#adf0cf',sigil:'❋',description:'A thousand wings. One purpose.',hp:800,range:8,damage:39,skills:['Luminous Swarm','Hush Field','Guiding Draft','Night Migration'],details:['A luminous piercing swarm.','Shield and restore nearby allies.','Dash and gain a luminous shield.','A wide wave damages and slows enemies.']},
 {name:'Kesh',title:'Mirebound',role:'FIGHTER',color:'#a7c884',sigil:'⋔',description:'The mistwood always collects.',hp:980,range:3.8,damage:62,skills:['Reed Cleaver','Bogskin','Sinkstep','Fen Claim'],details:['Cleave nearby enemies and steal health.','Become shielded and mend your wounds.','Burrow toward the cursor.','Claim a wide area with slowing marsh energy.']},
 {name:'Ilyra Quill',title:'Archive Exile',role:'ARTILLERY',color:'#c5b6ff',sigil:'✧',description:'Write the ending they deserve.',hp:700,range:9,damage:43,skills:['Linebreak','Footnote','Redaction','Final Draft'],details:['A long piercing line of arcane script.','Mark a delayed explosive sigil.','A short teleport with a protective shield.','Three expanding manuscript explosions.']},
 {name:'Vey',title:'Glassknife',role:'ASSASSIN',color:'#e5a4d1',sigil:'⟡',description:'Every reflection has an edge.',hp:770,range:3.6,damage:75,skills:['Shardstep','Mirror Veil','Cut the Light','Prism Sentence'],details:['Dash forward, slicing enemies in your path.','Recover health behind a prismatic shield.','Blink toward the cursor.','A delayed strike at the cursor.']}
] as const;
export const ITEMS=[
 {name:'Sunspoke Bow',glyph:'➶',cost:280,stat:'+24 attack damage',damage:24,hp:0,speed:0},
 {name:'Kilnheart Plate',glyph:'⬡',cost:260,stat:'+280 maximum health',damage:0,hp:280,speed:0},
 {name:'Riverglass Boots',glyph:'⋄',cost:220,stat:'+1.5 movement speed',damage:0,hp:0,speed:1.5},
 {name:'Quiet Index',glyph:'▤',cost:350,stat:'+36 attack · +100 health',damage:36,hp:100,speed:0},
 {name:'Beacon Loom',glyph:'❋',cost:310,stat:'+180 health · +14 attack',damage:14,hp:180,speed:0},
 {name:'Crownshard',glyph:'✧',cost:540,stat:'+65 attack damage',damage:65,hp:0,speed:0}
] as const;
export const lanes=[ [{x:-42,z:0},{x:-30,z:-18},{x:0,z:-23},{x:30,z:-18},{x:42,z:0}], [{x:-42,z:0},{x:-30,z:18},{x:0,z:23},{x:30,z:18},{x:42,z:0}] ];
export const COOLDOWNS=[5,9,8,30];
