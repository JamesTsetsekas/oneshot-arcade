(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function e(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=e(i);fetch(i.href,s)}})();const Fh="skybreak-content-0.1.0",Oh=30,ve=1/Oh,Gn=["light","shell","heavy","charge"],Io={light:240,shell:48,heavy:80,charge:18},Fc={light:30,shell:8,heavy:10,charge:3},ba={light:"Light",shell:"Shell",heavy:"Heavy",charge:"Charge"},Oc={light:"#f0c060",shell:"#e0675a",heavy:"#7fb0ff",charge:"#c490ff"},un=[{id:0,key:"field",name:"Field",color:"#a7b0ba",colorBlind:"#a7b0ba",shape:"circle",damage:1,reload:1,spread:1,recoil:1,rate:1,mag:1,note:"Reliable baseline"},{id:1,key:"tuned",name:"Tuned",color:"#5fd37a",colorBlind:"#ffd166",shape:"chevron",damage:1.03,reload:.92,spread:1,recoil:1,rate:1,mag:1,note:"Faster reload, +3% damage"},{id:2,key:"advanced",name:"Advanced",color:"#58a6ff",colorBlind:"#2a9df4",shape:"diamond",damage:1.05,reload:.92,spread:.92,recoil:.9,rate:1,mag:1,note:"Steadier aim, +5% damage"},{id:3,key:"masterwork",name:"Masterwork",color:"#b07cff",colorBlind:"#ff7ab6",shape:"crown",damage:1.06,reload:.9,spread:.9,recoil:.88,rate:1,mag:1.25,note:"Extended magazine fitted"},{id:4,key:"prototype",name:"Prototype",color:"#ffc83d",colorBlind:"#ffffff",shape:"star",damage:1.08,reload:.9,spread:1.15,recoil:1.3,rate:1.14,mag:1,note:"Overclocked: +14% fire rate, harder recoil"}],Bh=3,Ce={wayfarer:{id:"wayfarer",name:"Wayfarer Rifle",cls:"Rifle",ammo:"light",kind:"hitscan",auto:!0,damage:22,pellets:1,pelletCap:0,rpm:400,mag:30,reload:2.2,swap:.5,windup:0,spread:1.3,adsSpread:.35,bloomPerShot:.18,bloomMax:1.3,recoil:[[.55,.05],[.6,-.08],[.62,.12],[.6,.1],[.58,-.12],[.62,-.06]],headMult:1.75,falloffStart:45,falloffEnd:120,falloffMin:.7,range:400,projSpeed:0,projGravity:0,splash:0,push:0,adsFov:.78,adsBoom:2.2,color:"#d9c9a0",blurb:"Balanced medium-range automatic."},tempest:{id:"tempest",name:"Tempest Carbine",cls:"Carbine",ammo:"light",kind:"hitscan",auto:!0,damage:16,pellets:1,pelletCap:0,rpm:660,mag:28,reload:2,swap:.45,windup:0,spread:1.7,adsSpread:.6,bloomPerShot:.22,bloomMax:1.8,recoil:[[.7,.2],[.8,-.3],[.85,.35],[.8,-.2],[.9,.3],[.85,-.4]],headMult:1.6,falloffStart:30,falloffEnd:85,falloffMin:.6,range:300,projSpeed:0,projGravity:0,splash:0,push:0,adsFov:.82,adsBoom:2.1,color:"#7ad7c8",blurb:"High rate of fire, punishing recoil."},breakwater:{id:"breakwater",name:"Breakwater Scattergun",cls:"Pump Shotgun",ammo:"shell",kind:"hitscan",auto:!1,damage:11,pellets:10,pelletCap:105,rpm:70,mag:5,reload:3.1,swap:.6,windup:0,spread:4.6,adsSpread:3.4,bloomPerShot:0,bloomMax:0,recoil:[[5.5,.4]],headMult:1.5,falloffStart:7,falloffEnd:26,falloffMin:.3,range:60,projSpeed:0,projGravity:0,splash:0,push:0,adsFov:.88,adsBoom:2.3,color:"#e7a15a",blurb:"Pump shotgun with a huge close burst."},coil:{id:"coil",name:"Coil Shotgun",cls:"Auto Shotgun",ammo:"shell",kind:"hitscan",auto:!1,damage:7,pellets:8,pelletCap:66,rpm:170,mag:6,reload:3,swap:.5,windup:0,spread:4.2,adsSpread:3.2,bloomPerShot:0,bloomMax:0,recoil:[[3.4,.5],[3.6,-.5]],headMult:1.5,falloffStart:7,falloffEnd:24,falloffMin:.3,range:55,projSpeed:0,projGravity:0,splash:0,push:0,adsFov:.88,adsBoom:2.3,color:"#c97a5a",blurb:"Semi-auto shotgun, lower damage per shot."},needler:{id:"needler",name:"Needler SMG",cls:"SMG",ammo:"light",kind:"hitscan",auto:!0,damage:11,pellets:1,pelletCap:0,rpm:820,mag:36,reload:1.8,swap:.25,windup:0,spread:2,adsSpread:.9,bloomPerShot:.2,bloomMax:2.2,recoil:[[.4,.3],[.45,-.35],[.5,.3],[.45,-.3]],headMult:1.5,falloffStart:14,falloffEnd:48,falloffMin:.42,range:160,projSpeed:0,projGravity:0,splash:0,push:0,adsFov:.86,adsBoom:2.2,color:"#8fb5ff",blurb:"Fast-swapping close weapon with sharp falloff."},sundial:{id:"sundial",name:"Sundial DMR",cls:"Precision Rifle",ammo:"heavy",kind:"hitscan",auto:!1,damage:44,pellets:1,pelletCap:0,rpm:215,mag:12,reload:2.7,swap:.6,windup:0,spread:.9,adsSpread:.06,bloomPerShot:.35,bloomMax:1.2,recoil:[[1.5,.15],[1.6,-.2]],headMult:2,falloffStart:80,falloffEnd:220,falloffMin:.85,range:500,projSpeed:0,projGravity:0,splash:0,push:0,adsFov:.45,adsBoom:1.9,color:"#f1d27a",blurb:"Semi-auto precision rifle, strong head pressure."},longwake:{id:"longwake",name:"Longwake Rail",cls:"Marksman Rail",ammo:"heavy",kind:"projectile",auto:!1,damage:88,pellets:1,pelletCap:0,rpm:52,mag:5,reload:3.2,swap:.7,windup:.28,spread:.8,adsSpread:.02,bloomPerShot:0,bloomMax:0,recoil:[[3.2,.2]],headMult:2,falloffStart:120,falloffEnd:350,falloffMin:.9,range:600,projSpeed:230,projGravity:5,splash:0,push:0,adsFov:.3,adsBoom:1.8,color:"#c7a1ff",blurb:"Projectile marksman rifle: lead your shots."},harbor:{id:"harbor",name:"Harbor Pistol",cls:"Sidearm",ammo:"light",kind:"hitscan",auto:!1,damage:18,pellets:1,pelletCap:0,rpm:330,mag:15,reload:1.5,swap:.2,windup:0,spread:1.2,adsSpread:.3,bloomPerShot:.3,bloomMax:1.2,recoil:[[1,.15],[1.1,-.15]],headMult:1.6,falloffStart:25,falloffEnd:70,falloffMin:.6,range:200,projSpeed:0,projGravity:0,splash:0,push:0,adsFov:.85,adsBoom:2.4,color:"#b8c4cf",blurb:"Common, reliable sidearm."},gale:{id:"gale",name:"Gale Launcher",cls:"Utility Launcher",ammo:"charge",kind:"launcher",auto:!1,damage:12,pellets:1,pelletCap:0,rpm:55,mag:3,reload:3,swap:.6,windup:0,spread:.5,adsSpread:.2,bloomPerShot:0,bloomMax:0,recoil:[[2.4,0]],headMult:1,falloffStart:999,falloffEnd:1e3,falloffMin:1,range:120,projSpeed:44,projGravity:7,splash:6,push:15,adsFov:.85,adsBoom:2.3,color:"#8fe3ff",blurb:"Concussive wind orbs: low damage, big displacement."}},Br=Object.keys(Ce),Hh={wayfarer:20,tempest:12,breakwater:10,coil:8,needler:12,sundial:7,longwake:3.5,harbor:15,gale:3};function Xe(a,t){const e=Ce[a],n=un[t];return{def:e,rarity:n,damage:e.damage*n.damage,rpm:e.rpm*n.rate,mag:Math.round(e.mag*n.mag),reload:e.reload*n.reload,spread:n.spread,recoil:n.recoil}}function ll(a,t){if(t<=a.falloffStart)return 1;if(t>=a.falloffEnd)return a.falloffMin;const e=(t-a.falloffStart)/(a.falloffEnd-a.falloffStart);return 1-(1-a.falloffMin)*e}const fe={medInjector:{id:"medInjector",name:"Med Injector",stack:4,useTime:3,slow:.55,cancelOnDamage:!1,blurb:"+35 Health over 3s",color:"#ff6b7a",category:"heal"},traumaKit:{id:"traumaKit",name:"Trauma Kit",stack:2,useTime:7,slow:.35,cancelOnDamage:!0,blurb:"Restore to 100 Health over 7s. Damage cancels.",color:"#ff3d55",category:"heal"},shieldFlask:{id:"shieldFlask",name:"Shield Flask",stack:4,useTime:2.5,slow:.6,cancelOnDamage:!1,blurb:"+25 Reserve Shield (max 50)",color:"#4fd0ff",category:"shield"},aegisCell:{id:"aegisCell",name:"Aegis Cell",stack:2,useTime:3,slow:.6,cancelOnDamage:!1,blurb:"Starts Aegis recharge immediately",color:"#7cf0d0",category:"shield"},mistCapsule:{id:"mistCapsule",name:"Mist Capsule",stack:2,useTime:0,slow:1,cancelOnDamage:!1,blurb:"Throw: 9s smoke cover",color:"#d6d2ff",category:"utility"},grappleSpool:{id:"grappleSpool",name:"Grapple Spool",stack:3,useTime:0,slow:1,cancelOnDamage:!1,blurb:"Pull to terrain up to 55m (3 charges)",color:"#ffb25a",category:"utility"},echoBeacon:{id:"echoBeacon",name:"Echo Beacon",stack:2,useTime:0,slow:1,cancelOnDamage:!1,blurb:"Reveal recent trails nearby for 8s",color:"#ffe36b",category:"utility"},windOrb:{id:"windOrb",name:"Wind Orb",stack:4,useTime:0,slow:1,cancelOnDamage:!1,blurb:"Throw: concussive displacement",color:"#9be7ff",category:"utility"}},hi=5,cl={1:[62,27,9,2,0],2:[44,31,17,8,0],3:[28,30,25,17,0],4:[8,22,36,34,0],5:[0,0,20,50,30]},ns={weapon:38,ammo:26,heal:18,shield:10,utility:8},Do=[["medInjector",50],["traumaKit",15],["shieldFlask",0],["aegisCell",0]],Bc=[["mistCapsule",24],["grappleSpool",22],["echoBeacon",20],["windOrb",34]],ko=[["shieldFlask",70],["aegisCell",30]],se={maxHealth:100,maxAegis:50,maxReserve:50,aegisDelay:8,assistWindow:12,limbMult:.8,torsoMult:1,meleeDamage:28,meleeRange:2.4,meleeCooldown:.7,fallDamageSpeed:14,fallDamagePerMs:5.5},Mt={walk:4.8,run:5.8,sprint:7.3,crouch:2.8,swim:4.2,swimSprint:5.2,sprintEnergy:5,sprintRegenDelay:1.25,gravity:20,jumpSpeed:6.35,slideMinSpeed:5.5,slideDuration:1,slideCooldown:1.2,slideSpeedBoost:1.12,radius:.4,heightStand:1.8,heightCrouch:1.3,heightSlide:1,heightSwim:1,stepHeight:.55,mantleMin:.6,mantleMax:1.5,slopeLimit:1.35,accelGround:42,accelAir:6,swimDepth:1.1,freefallTerminal:58,freefallDive:74,freefallHoriz:26,freefallHorizMin:9,glideDescent:6.5,glideSpeed:17,glideSpeedBoost:23,autoDeployAGL:140,minDeployAGL:25,zipSpeed:15,grappleRange:55,grappleSpeed:26},Jn=[{wait:90,shrink:0,toRadius:560,damage:0},{wait:0,shrink:120,toRadius:320,damage:1},{wait:70,shrink:90,toRadius:210,damage:2},{wait:55,shrink:75,toRadius:125,damage:4},{wait:40,shrink:60,toRadius:70,damage:7},{wait:30,shrink:45,toRadius:35,damage:10},{wait:0,shrink:45,toRadius:30,damage:10},{wait:0,shrink:45,toRadius:30,damage:12},{wait:0,shrink:40,toRadius:4,damage:15}],ms=560,hl=430,dl=10,$a=1200,Gh=0,Ya={players:24,stagingSeconds:35,skiffSpeed:42},Hr=[{name:"Ember",primary:"#e9703c",secondary:"#f4e0b8",accent:"#3c2a22"},{name:"Tide",primary:"#2fb7c4",secondary:"#f3f0dc",accent:"#16424a"},{name:"Orchard",primary:"#6fbf5a",secondary:"#f0e3b5",accent:"#2f4a28"},{name:"Dusk",primary:"#8b6ad8",secondary:"#f0e0f5",accent:"#2c2354"}],ul=["Kestrel","Marlow","Juniper","Pike","Sable","Wren","Tamsin","Orrin","Fenwick","Lark","Ostra","Bram","Isolde","Cormac","Nettle","Halcyon","Rook","Vesper","Dunmore","Calla","Thorne","Ixia","Yarrow","Zephyr","Maren","Quill","Soren","Tarn"];class Ze{s;constructor(t){this.s=t>>>0||1}next(){this.s=this.s+1831565813>>>0;let t=this.s;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}range(t,e){return t+(e-t)*this.next()}int(t,e){return Math.floor(this.range(t,e+1))}chance(t){return this.next()<t}pick(t){return t[Math.floor(this.next()*t.length)%t.length]}weighted(t){let e=0;for(const i of t)e+=i;if(e<=0)return 0;let n=this.next()*e;for(let i=0;i<t.length;i++)if(n-=t[i],n<=0)return i;return t.length-1}gauss(){return(this.next()+this.next()+this.next()+this.next()-2)*1.2}}function zs(a,t,e){let n=Math.imul(a|0,374761393)+Math.imul(t|0,668265263)+Math.imul(e|0,2147483647)|0;return n=Math.imul(n^n>>>13,1274126177),n^=n>>>16,(n>>>0)/4294967296}function Gr(a,t,e){const n=Math.floor(a),i=Math.floor(t),s=a-n,r=t-i,o=s*s*(3-2*s),l=r*r*(3-2*r),c=zs(n,i,e),h=zs(n+1,i,e),d=zs(n,i+1,e),u=zs(n+1,i+1,e);return c+(h-c)*o+(d-c)*l+(c-h-d+u)*o*l}function Ms(a,t,e,n=4){let i=.5,s=1,r=0,o=0;for(let l=0;l<n;l++)r+=i*Gr(a*s,t*s,e+l*101),o+=i,i*=.5,s*=2;return r/o}const _e=(a,t,e)=>a<t?t:a>e?e:a,Qn=(a,t,e)=>a+(t-a)*e,xe=(a,t,e)=>{const n=_e((e-a)/(t-a),0,1);return n*n*(3-2*n)},Hc=a=>{for(;a>Math.PI;)a-=Math.PI*2;for(;a<-Math.PI;)a+=Math.PI*2;return a},Za=(a,t)=>Hc(t-a);function Pn(a,t){const e=Math.cos(t);return{x:Math.sin(a)*e,y:Math.sin(t),z:Math.cos(a)*e}}function As(a){return{x:-Math.cos(a),y:0,z:Math.sin(a)}}function ja(a){const t=Math.hypot(a.x,a.y,a.z)||1;return{x:a.x/t,y:a.y/t,z:a.z/t}}const Ka={limestone:0,copper:1,wood:2,fabricA:3,fabricB:4,stone:5,metal:6,crate:8,pier:9,dark:11},Ja=20;class Vh{seed;half=$a/2;res=4;n;heights;boxes=[];cyls=[];hazards=[];locations=[];buildings=[];sockets=[];ziplines=[];vents=[];zoneCenters=[];spawnPad={x:-820,z:0,y:400};waterLevel=Gh;practice;grid=new Map;gridW;hash="";pads=[];features=[];constructor(t,e={}){this.seed=t,this.practice=!!e.practice,this.n=Math.round($a/this.res)+1,this.heights=new Float32Array(this.n*this.n),this.gridW=Math.ceil(($a+1800)/Ja),this.practice?this.buildPractice():this.buildIsland(),this.indexColliders(),this.practice||this.computeZoneCenters(new Ze(this.seed+4242)),this.hash=this.computeHash()}cellKey(t,e){return e*this.gridW+t}cellOf(t){return Math.floor((t+this.half+900)/Ja)}indexColliders(){this.grid.clear();const t=(e,n,i,s)=>{const r=this.cellKey(e,n);let o=this.grid.get(r);o||(o={b:[],c:[]},this.grid.set(r,o)),o[i].push(s)};this.boxes.forEach((e,n)=>{for(let i=this.cellOf(e.minX);i<=this.cellOf(e.maxX);i++)for(let s=this.cellOf(e.minZ);s<=this.cellOf(e.maxZ);s++)t(i,s,"b",n)}),this.cyls.forEach((e,n)=>{for(let i=this.cellOf(e.x-e.r);i<=this.cellOf(e.x+e.r);i++)for(let s=this.cellOf(e.z-e.r);s<=this.cellOf(e.z+e.r);s++)t(i,s,"c",n)})}queryCircle(t,e,n,i,s){i.length=0,s.length=0;const r=this.cellOf(t-n),o=this.cellOf(t+n),l=this.cellOf(e-n),c=this.cellOf(e+n);for(let h=r;h<=o;h++)for(let d=l;d<=c;d++){const u=this.grid.get(this.cellKey(h,d));if(u){for(const p of u.b){const g=this.boxes[p];i.indexOf(g)<0&&i.push(g)}for(const p of u.c){const g=this.cyls[p];s.indexOf(g)<0&&s.push(g)}}}}heightAt(t,e){const n=(t+this.half)/this.res,i=(e+this.half)/this.res;if(n<=0||i<=0||n>=this.n-1||i>=this.n-1)return this.edgeHeight(t,e);const s=Math.floor(n),r=Math.floor(i),o=n-s,l=i-r,c=this.n,h=this.heights,d=h[r*c+s],u=h[r*c+s+1],p=h[(r+1)*c+s],g=h[(r+1)*c+s+1];return d+(u-d)*o+(p-d)*l+(d-u-p+g)*o*l}edgeHeight(t,e){const n=_e(t,-this.half,this.half-.01),i=_e(e,-this.half,this.half-.01),s=(n+this.half)/this.res,r=(i+this.half)/this.res,o=Math.min(Math.floor(s),this.n-2),l=Math.min(Math.floor(r),this.n-2);return this.heights[l*this.n+o]-Math.hypot(t-n,e-i)*.2}slopeAt(t,e){const i=(this.heightAt(t+1.5,e)-this.heightAt(t-1.5,e))/3,s=(this.heightAt(t,e+1.5)-this.heightAt(t,e-1.5))/(2*1.5);return Math.hypot(i,s)}groundHeight(t,e,n,i,s,r,o){let l=this.heightAt(t,e);this.queryCircle(t,e,s,r,o);for(const c of r)c.maxY<=n+i&&c.maxY>l&&Na(t,e,s*.9,c)&&(l=c.maxY);for(const c of o)c.y1<=n+i&&c.y1>l&&Math.hypot(t-c.x,e-c.z)<c.r+s*.5&&c.kind!=="tree"&&(l=c.y1);return l}inHazard(t,e){for(const n of this.hazards)if(t>=n.x0&&t<=n.x1&&e>=n.z0&&e<=n.z1)return n.dps;return 0}isLand(t,e){return this.heightAt(t,e)>this.waterLevel+.15}raycast(t,e,n,i,s,r,o,l=!1){let c=o;const h=1.5;let d=0,u=e-this.heightAt(t,n)>0;for(let m=h;m<=c+h;m+=h){const y=Math.min(m,c),S=t+i*y,x=e+s*y,T=n+r*y,E=x-this.heightAt(S,T)>0;if(u&&!E){let w=d,C=y;for(let M=0;M<6;M++){const _=(w+C)/2;e+s*_-this.heightAt(t+i*_,n+r*_)>0?w=_:C=_}C<c&&(c=C);break}if(u=E,d=y,y>=c)break}const p=new Set,g=new Set,v=c,f=Math.ceil(v/(Ja*.6))+1;for(let m=0;m<=f;m++){const y=Math.min(v,m/f*v),S=this.cellOf(t+i*y),x=this.cellOf(n+r*y);for(let T=-1;T<=1;T++)for(let E=-1;E<=1;E++){const w=this.grid.get(this.cellKey(S+T,x+E));if(w){for(const C of w.b){if(p.has(C))continue;p.add(C);const M=Wh(t,e,n,i,s,r,this.boxes[C]);M>=0&&M<c&&(c=M)}for(const C of w.c){if(g.has(C))continue;g.add(C);const M=this.cyls[C];if(l&&M.kind==="tree")continue;const _=Xh(t,e,n,i,s,r,M);_>=0&&_<c&&(c=_)}}}}return c<o?c:-1}hasLineOfSight(t,e){const n=e.x-t.x,i=e.y-t.y,s=e.z-t.z,r=Math.hypot(n,i,s);return r<.01?!0:this.raycast(t.x,t.y,t.z,n/r,i/r,s/r,r-.05,!0)<0}computeHash(){let t=2166136261;const e=n=>{t^=Math.round(n*100)|0,t=Math.imul(t,16777619)>>>0};for(let n=0;n<this.heights.length;n+=7)e(this.heights[n]);for(const n of this.boxes)e(n.minX),e(n.minY),e(n.minZ),e(n.maxX),e(n.maxY),e(n.maxZ);for(const n of this.cyls)e(n.x),e(n.z),e(n.r);return t.toString(16).padStart(8,"0")}baseHeight(t,e){const n=Math.hypot(t,e),i=1+.16*(Gr(t/240+7,e/240-3,this.seed)-.5)*2,s=n*i,r=1-xe(395,545,s),o=7+15*Ms(t/210,e/210,this.seed+11,4)-3.5*Math.abs(Gr(t/90,e/90,this.seed+29)-.5)*2+3.5*Ms(t/60,e/60,this.seed+5,2);return Qn(-9,o,Math.pow(r,.75))}finalHeight(t,e){let n=this.baseHeight(t,e);for(const i of this.pads){const s=Math.hypot(t-i.x,e-i.z);if(s<i.r+i.blend){const r=1-xe(i.r,i.r+i.blend,s);n=Qn(n,i.h,r)}}for(const i of this.features)n=i(t,e,n);return n}bakeHeights(){for(let t=0;t<this.n;t++)for(let e=0;e<this.n;e++){const n=e*this.res-this.half,i=t*this.res-this.half;this.heights[t*this.n+e]=this.finalHeight(n,i)}}box(t,e,n,i,s,r,o){const l={minX:t,minY:e,minZ:n,maxX:i,maxY:s,maxZ:r,style:o};return this.boxes.push(l),l}cyl(t,e,n,i,s,r,o=0){this.cyls.push({x:t,z:e,r:n,y0:i,y1:s,kind:r,style:o})}addBuilding(t,e,n,i,s,r,o,l,c,h,d,u={}){const v=e-i/2,f=e+i/2,m=n-s/2,y=n+s/2,S=l+r,x=2.6,T=(G,H,Y,V,at,lt)=>{if(!at){this.box(G,l,H,Y,S,V,c);return}if(lt){const gt=(G+Y)/2;this.box(G,l,H,gt-1.1,S,V,c),this.box(gt+1.1,l,H,Y,S,V,c),this.box(gt-1.1,l+x,H,gt+1.1,S,V,c)}else{const gt=(H+V)/2;this.box(G,l,H,Y,S,gt-1.1,c),this.box(G,l,gt+1.1,Y,S,V,c),this.box(G,l+x,gt-1.1,Y,S,gt+1.1,c)}};T(v,m,f,m+.35,o==="n",!0),T(v,y-.35,f,y,o==="s",!0),T(v,m+.35,v+.35,y-.35,o==="w",!1),T(f-.35,m+.35,f,y-.35,o==="e",!1),this.box(v-.25,S,m-.25,f+.25,S+.4,y+.25,h);const E=o==="e"?1:o==="w"?-1:0,w=o==="s"?1:o==="n"?-1:0,C=e+E*(i/2),M=n+w*(s/2),_={id:this.buildings.length,loc:t,x:e,z:n,w:i,d:s,h:r,floorY:l,door:o,doorOut:{x:C+E*3,z:M+w*3},doorIn:{x:C-E*1.8,z:M-w*1.8}};this.buildings.push(_);const P=u.crates??1;for(let G=0;G<P;G++){const H=e+d.range(-i/2+2,i/2-2)*.8,Y=n+d.range(-s/2+2,s/2-2)*.8;Math.hypot(H-_.doorIn.x,Y-_.doorIn.z)<3.2||this.box(H-.6,l,Y-.6,H+.6,l+1.1,Y+.6,Ka.crate)}const I=this.locations.find(G=>G.id===t),D=I?I.tier:1,O=Math.max(3,Math.min(6,Math.ceil(i*s/42)));for(let G=0;G<O;G++){const H=e+d.range(-i/2+1.6,i/2-1.6),Y=n+d.range(-s/2+1.6,s/2-1.6);Math.hypot(H-_.doorIn.x,Y-_.doorIn.z)<1.6||this.sockets.push({x:H,y:l+.15,z:Y,tier:D,kind:"floor",loc:t,weaponBias:G===0})}if(u.chestInside){const G=e+(o==="n"||o==="s"?0:-E*(i/2-1.2)),H=n+(o==="e"||o==="w"?0:-w*(s/2-1.2));this.sockets.push({x:G,y:l,z:H,tier:D,kind:"chest",loc:t,weaponBias:!1})}return _}addStairs(t,e,n,i,s,r,o,l){const d=Math.ceil(s/.5);for(let u=0;u<d;u++){const p=t+n*u*.9,g=e+i*u*.9,v=n!==0?.9/2:o/2,f=i!==0?.9/2:o/2;this.box(p-v,r,g-f,p+v,r+Math.min((u+1)*.5,s),g+f,l)}}addLocation(t,e,n,i,s,r,o,l,c=30){const h=l??Math.max(2.5,this.baseHeight(n,i)*.6+1.5),d={id:t,name:e,x:n,z:i,r:s,tier:r,named:o,padH:h};return this.locations.push(d),this.pads.push({x:n,z:i,r:s*.9,blend:c,h}),d}buildIsland(){const t=new Ze(this.seed*7+13),e=this.addLocation("aerie","Aerie Market",-110,-170,78,3,!0,22,45),n=this.addLocation("array","Sunken Array",180,-235,85,2,!0,-.75,40),i=this.addLocation("kiln","Kilnworks",250,135,75,3,!0,12,40),s=this.addLocation("orchard","Orchard Steps",-265,150,95,1,!0,void 0,20),r=this.addLocation("abbey","Wind Abbey",-10,300,58,2,!0,52,70),o=this.addLocation("docks","Breaker Docks",-385,-70,70,2,!0,1.6,36),l=this.addLocation("huts","Watch Huts",60,-335,28,1,!1,void 0,18),c=this.addLocation("bridge","Bridge Station",115,-45,30,1,!1,void 0,18),h=this.addLocation("quarry","Quarry",335,275,40,2,!1,void 0,18),d=this.addLocation("camp","Driftwood Camp",-200,-345,26,1,!1,void 0,16),u=this.addLocation("turbine","Old Turbine",150,335,26,1,!1,void 0,16),p=this.addLocation("cave","Hollow Cave",-395,245,28,2,!1,void 0,18),g=this.addLocation("relay","Relay Shack",25,70,20,1,!1,void 0,14),v=this.addLocation("wreck","Skiff Wreck",405,-115,30,2,!1,void 0,18);this.features.push((x,T,E)=>{const w=Math.hypot(x-s.x,T-s.z);if(w<s.r+45){const C=1-xe(s.r-10,s.r+45,w),M=12+(x-s.x)*.06-(T-s.z)*.11,_=1.25,P=Math.floor(M/_)*_,I=M/_-Math.floor(M/_),D=P+_*xe(.7,1,I);return Qn(E,D,C*.95)}return E}),this.features.push((x,T,E)=>{const w=Math.hypot(x-n.x,T-n.z);if(w<62){const C=[[-18,12],[20,-16]].map(([P,I])=>Math.hypot(x-n.x-P,T-n.z-I)),M=Math.min(...C),_=1-xe(10,22,M);return Qn(E,-2.1,_*(1-xe(50,62,w)))}return E}),this.features.push((x,T,E)=>{const w=Math.hypot(x-p.x,T-p.z);return w<34?E+9*(1-xe(6,34,w)):E}),this.features.push((x,T,E)=>{const w=Math.hypot(x-h.x,T-h.z);return w<30?Qn(E,E-7,1-xe(10,30,w)):E}),this.features.push((x,T,E)=>{const w=x-c.x,C=Math.abs(T-c.z+w*0);return Math.abs(w)<80&&C<14?Qn(E,E-6.5,(1-xe(4,14,C))*(1-xe(55,80,Math.abs(w)))):E}),this.bakeHeights();const f=Ka;this.box(-846,394,-24,-796,400,24,f.pier),this.box(-846,400,-24,-844.6,401.2,24,f.metal),this.box(-846,400,22.6,-796,401.2,24,f.metal),this.box(-846,400,-24,-796,401.2,-22.6,f.metal);{const x=e.padH;[[-30,-26,14,11,3.6,"s"],[0,-30,11,9,7.2,"s"],[26,-26,13,10,3.6,"s"],[-34,2,11,12,3.6,"e"],[34,2,12,12,7.2,"w"],[-4,0,16,13,3.6,"n"],[-28,30,13,10,3.6,"n"],[4,32,11,11,3.6,"n"],[30,30,14,10,7.2,"n"],[60,-2,9,9,3.6,"w"],[-62,-4,9,10,3.6,"e"]].forEach(([E,w,C,M,_,P],I)=>{const D=this.addBuilding("aerie",e.x+E,e.z+w,C,M,_,P,x,I%3===0?f.limestone:I%3===1?f.wood:f.stone,I%2?f.fabricA:f.copper,t,{crates:2,chestInside:C*M>110||I%4===0});_>7?this.addStairs(D.x+C/2+1.1,D.z-M/2+1.5,0,1,_+.4,x,2.2,f.stone):I%2===0&&this.addStairs(D.x-C/2-1.1,D.z+M/2-1.5,0,-1,_+.4,x,2.2,f.stone)}),this.cyl(e.x+4,e.z+14,1.6,x,x+6,"pillar",f.copper),this.cyl(e.x-18,e.z+14,1.2,x,x+5,"pillar",f.copper),this.sockets.push({x:e.x+4,y:x+.15,z:e.z+18,tier:3,kind:"locker",loc:"aerie",weaponBias:!1}),this.sockets.push({x:e.x-20,y:x+.15,z:e.z+18,tier:3,kind:"locker",loc:"aerie",weaponBias:!1}),this.ziplines.push({id:0,name:"Market Line",a:{x:e.x+34,y:x+7.9,z:e.z+8},b:{x:e.x-62,y:x+4.5,z:e.z-4}}),this.ziplines.push({id:1,name:"Market Drop",a:{x:e.x+30,y:x+8.2,z:e.z+36},b:{x:e.x+4,y:x+4.5,z:e.z-36}})}[[-8,-4],[38,22],[-42,-30],[4,38]].forEach(([E,w],C)=>{const M=n.x+E,_=n.z+w;this.box(M-9,-2.5,_-9,M+9,.8,_+9,f.limestone),this.box(M-11.2,-2.5,_-1.5,M-9,-.2,_+1.5,f.stone),this.box(M-13,-2.5,_-1.5,M-11.2,-.8,_+1.5,f.stone),C<3?this.addBuilding("array",M,_,8,7,3.2,["n","s","e"][C],.8,f.limestone,f.copper,t,{crates:1,chestInside:C===0}):this.cyl(M,_,5,.8,.8+5.5,"dish",f.copper)}),this.cyl(n.x+22,n.z-28,4.2,-.8,6.5,"dish",f.copper),this.cyl(n.x-28,n.z+22,4.6,-.8,7.5,"dish",f.copper),this.sockets.push({x:n.x+28,y:-.45,z:n.z-4,tier:2,kind:"floor",loc:"array",weaponBias:!0}),this.addBuilding("array",n.x+52,n.z+6,7,14,3,"w",.4,f.stone,f.stone,t,{crates:1});{const x=i.padH,T=this.addBuilding("kiln",i.x-10,i.z-6,34,20,9,"e",x,f.metal,f.dark,t,{crates:4,chestInside:!0});this.box(T.x-14,x+4.2,T.z-3,T.x+14,x+4.5,T.z+3,f.metal),this.addStairs(T.x-16.5+1,T.z-5,0,1,4.5,x,2,f.metal);const E=this.addBuilding("kiln",i.x+28,i.z+14,10,10,4.2,"w",x,f.stone,f.copper,t,{crates:0});this.sockets.push({x:E.x,y:x,z:E.z-1.5,tier:4,kind:"chest",loc:"kiln",weaponBias:!1}),this.sockets.push({x:E.x,y:x,z:E.z+1.5,tier:4,kind:"chest",loc:"kiln",weaponBias:!1}),this.addBuilding("kiln",i.x-6,i.z+30,14,10,4,"n",x,f.metal,f.copper,t,{crates:2,chestInside:!1}),this.addBuilding("kiln",i.x-40,i.z+22,10,9,3.6,"e",x,f.stone,f.dark,t,{crates:1}),this.cyl(i.x+12,i.z-26,2.6,x,x+24,"stack",f.metal),this.cyl(i.x+2,i.z-30,2.1,x,x+19,"stack",f.metal),this.cyl(i.x+22,i.z-14,3.2,x,x+5,"tank",f.copper),this.hazards.push({x0:i.x+14,z0:i.z-34,x1:i.x+16.5,z1:i.z-6,dps:9}),this.hazards.push({x0:i.x-44,z0:i.z+8,x1:i.x-22,z1:i.z+10.5,dps:9}),this.sockets.push({x:i.x+16,y:x+.15,z:i.z+6,tier:3,kind:"locker",loc:"kiln",weaponBias:!1})}{[[-30,-25,11,9,"s"],[28,-10,9,9,"w"],[-5,32,12,9,"n"]].forEach(([T,E,w,C,M],_)=>{const P=s.x+T,I=s.z+E,D=this.heightAt(P,I);let O=D;for(let G=-w/2;G<=w/2;G+=2)for(let H=-C/2;H<=C/2;H+=2)O=Math.max(O,this.heightAt(P+G,I+H));this.box(P-w/2-.3,D-3,I-C/2-.3,P+w/2+.3,O,I+C/2+.3,f.stone),this.addBuilding("orchard",P,I,w,C,3.4,M,O,f.limestone,_%2?f.fabricB:f.wood,t,{crates:1,chestInside:_===0})});for(let T=0;T<14;T++){const E=t.range(0,Math.PI*2),w=t.range(15,85),C=s.x+Math.cos(E)*w,M=s.z+Math.sin(E)*w,_=this.heightAt(C,M),P=t.range(4,8),I=t.chance(.5);this.box(C-(I?P/2:.4),_-.5,M-(I?.4:P/2),C+(I?P/2:.4),_+1.25,M+(I?.4:P/2),f.stone)}for(let T=-70;T<=70;T+=11)for(let E=-70;E<=70;E+=11){const w=s.x+T+t.range(-2,2),C=s.z+E+t.range(-2,2);Math.hypot(T,E)>85||this.nearBuilding(w,C,6)||!this.isLand(w,C)||t.chance(.6)&&this.cyl(w,C,.45,this.heightAt(w,C),this.heightAt(w,C)+4.2,"tree",1)}this.sockets.push({x:s.x+2,y:this.heightAt(s.x+2,s.z-4)+.15,z:s.z-4,tier:1,kind:"locker",loc:"orchard",weaponBias:!1})}{const x=r.padH;[[-22,-14,20,1.2,5],[22,-14,1.2,14,6],[-22,14,14,1.2,4],[4,18,1.2,10,7],[0,0,6,1,2.5]].forEach(([E,w,C,M,_])=>this.box(r.x+E-C/2,x,r.z+w-M/2,r.x+E+C/2,x+_,r.z+w+M/2,f.limestone));for(let E=0;E<6;E++){const w=E/6*Math.PI*2,C=r.x+Math.cos(w)*14,M=r.z+Math.sin(w)*14;this.cyl(C,M,1.1,x,x+(E%2?6:3.4),"pillar",f.limestone)}this.addBuilding("abbey",r.x-6,r.z-2,11,9,4.4,"s",x,f.limestone,f.fabricB,t,{crates:1,chestInside:!0}),this.addBuilding("abbey",r.x+26,r.z+8,8,8,3.6,"w",x,f.stone,f.stone,t,{crates:0}),this.vents.push({x:r.x+10,z:r.z-14,r:4.2,y:x,boost:22}),this.vents.push({x:r.x-30,z:r.z+22,r:4.2,y:x,boost:22}),this.sockets.push({x:r.x+12,y:x+.15,z:r.z+4,tier:2,kind:"floor",loc:"abbey",weaponBias:!0})}{const x=o.padH;this.addBuilding("docks",o.x-18,o.z-22,24,13,6,"e",x,f.metal,f.dark,t,{crates:3,chestInside:!0}),this.addBuilding("docks",o.x-18,o.z+12,22,13,6,"e",x,f.metal,f.dark,t,{crates:3,chestInside:!1}),this.addBuilding("docks",o.x+14,o.z-4,12,10,3.8,"s",x,f.wood,f.fabricA,t,{crates:2,chestInside:!0}),this.box(o.x-70,x-.6,o.z-36,o.x-46,x+.05,o.z-31,f.pier),this.box(o.x-78,x-.6,o.z+8,o.x-44,x+.05,o.z+13,f.pier);for(let E=0;E<4;E++)this.box(o.x-14+E*7,x,o.z+30,o.x-9+E*7,x+2.2,o.z+34,f.crate);[[o.x+24,o.z+28],[o.x-40,o.z-4]].forEach(([E,w],C)=>{this.cyl(E,w,.9,x,x+17,"pillar",f.copper),this.cyl(E+6,w,.9,x,x+17,"pillar",f.copper),this.box(E-.5,x+16.5,w-.5,E+14,x+17.4,w+.5,f.copper),this.sockets.push({x:E+3,y:x+.15,z:w+3,tier:2,kind:"floor",loc:"docks",weaponBias:C===0})}),this.ziplines.push({id:2,name:"Crane Run",a:{x:o.x+24,y:x+16.2,z:o.z+28},b:{x:o.x-60,y:x+1.2,z:o.z-33}})}{const x=(M,_,P,I)=>{let D=-99;for(let O=-P/2;O<=P/2;O+=1.5)for(let G=-I/2;G<=I/2;G+=1.5){const H=this.heightAt(M+O,_+G);D=Math.max(D,H)}return D},T=(M,_,P,I,D,O,G,H,Y=!1)=>{const V=M.x+_,at=M.z+P,lt=x(V,at,I,D);return this.box(V-I/2-.3,lt-3,at-D/2-.3,V+I/2+.3,lt,at+D/2+.3,f.stone),this.addBuilding(M.id,V,at,I,D,O,G,lt,H,f.wood,t,{crates:1,chestInside:Y})};T(l,-8,0,7,6,3.2,"e",f.wood,!0),T(l,10,6,6,6,3.2,"w",f.wood),T(c,0,18,9,7,3.4,"n",f.limestone,!0);const E=this.heightAt(c.x-30,c.z);this.box(c.x-20,E-.4,c.z-2.6,c.x+20,E+.2,c.z+2.6,f.pier),T(h,22,-6,8,7,3.4,"w",f.stone,!0);for(let M=0;M<6;M++)this.cyl(h.x+t.range(-24,24),h.z+t.range(-24,24),t.range(1.6,3),-20,this.heightAt(h.x,h.z)+4,"rock",f.stone);T(d,0,0,6,6,3,"s",f.fabricA),this.sockets.push({x:d.x+6,y:this.heightAt(d.x+6,d.z+3)+.15,z:d.z+3,tier:1,kind:"floor",loc:"camp",weaponBias:!0});const w=this.heightAt(u.x,u.z);this.cyl(u.x,u.z,1.8,w,w+22,"pillar",f.copper),T(u,8,6,6,5,3,"w",f.copper);{const M=this.heightAt(p.x,p.z);T(p,0,6,9,8,3.6,"n",f.stone,!0),this.box(p.x-9,M,p.z-2,p.x-4,M+6,p.z+3,f.stone),this.box(p.x+4,M,p.z-2,p.x+9,M+6,p.z+3,f.stone)}T(g,0,0,6,6,3.2,"s",f.metal,!0);const C=this.heightAt(v.x,v.z);this.box(v.x-9,C+.2,v.z-3,v.x+5,C+3.4,v.z+3,f.copper),this.box(v.x+5,C+.6,v.z-2.2,v.x+11,C+2.4,v.z+2.2,f.fabricA),this.sockets.push({x:v.x-3,y:C+3.6,z:v.z,tier:2,kind:"floor",loc:"wreck",weaponBias:!0}),this.sockets.push({x:v.x+3,y:C+.3,z:v.z+6,tier:2,kind:"chest",loc:"wreck",weaponBias:!1})}const m=(x,T)=>Ms(x/120+40,T/120+40,this.seed+77,3);let y=0,S=0;for(;S<760&&y<9e3;){y++;const x=t.range(-480,480),T=t.range(-480,480),E=this.heightAt(x,T);if(E<1.2||E>44||this.slopeAt(x,T)>.55||m(x,T)<.5+t.range(-.1,.1)||this.nearBuilding(x,T,10)||this.locations.some(M=>M.id!=="orchard"&&Math.hypot(x-M.x,T-M.z)<M.r*.75)||this.hazards.length&&this.inHazard(x,T))continue;const w=t.chance(.78)?"tree":"rock",C=w==="tree"?.42:t.range(1,2.2);this.cyl(x,T,C,E-.5,E+(w==="tree"?t.range(4.5,7.5):C*1.4),w,t.int(0,3)),S++}for(let x=0;x<90;x++){const T=t.range(-470,470),E=t.range(-470,470),w=this.heightAt(T,E);if(w<1.5||this.nearBuilding(T,E,8)||this.slopeAt(T,E)>.8)continue;const C=t.range(1.2,3);this.cyl(T,E,C,w-1,w+C*1.1,"rock",t.int(0,3))}for(let x=0;x<40;x++){const T=t.range(-430,430),E=t.range(-430,430),w=this.heightAt(T,E);w<2||this.slopeAt(T,E)>.5||this.sockets.push({x:T,y:w+.15,z:E,tier:1,kind:"floor",loc:"wild",weaponBias:x%3===0})}}nearBuilding(t,e,n){for(const i of this.buildings)if(Math.abs(t-i.x)<i.w/2+n&&Math.abs(e-i.z)<i.d/2+n)return!0;return!1}computeZoneCenters(t){const e=[],n=[];for(let i=-420;i<=420;i+=20)for(let s=-420;s<=420;s+=20){const r=this.heightAt(i,s);if(r<1.8||this.slopeAt(i,s)>.45||this.inHazard(i,s)||Math.hypot(i,s)>440)continue;this.queryCircle(i,s,35,e,n);const o=e.length*.6+n.length;o<6||this.groundHeight(i,s,r+.1,.1,.4,[],[])>r+2||this.zoneCenters.push({x:i,z:s,cover:o})}}buildPractice(){const t=Ka;this.locations.push({id:"range",name:"Practice Range",x:0,z:0,r:80,tier:3,named:!0,padH:4}),this.features.push((e,n)=>{const i=Math.max(Math.abs(e),Math.abs(n));if(i>120)return-9;let r=4-xe(86,100,i)*14;const o=Math.hypot(e-50,n+45);return o<14&&(r=Qn(r,-2.2,1-xe(8,14,o))),Math.abs(e+66)<14&&(r+=6*(1-xe(-70,-34,n))*(1-xe(8,14,Math.abs(e+66)))),r}),this.bakeHeights(),this.box(-90,0,-91,90,12,-88,t.stone),this.box(-90,0,88,90,12,91,t.stone),this.box(-91,0,-90,-88,12,90,t.stone),this.box(88,0,-90,91,12,90,t.stone),[.7,1.1,1.45].forEach((e,n)=>this.box(-70+n*6,4,20,-66+n*6,4+e,24,t.crate)),this.box(-74,4,28,-56,4+1.3,31,t.stone),this.addBuilding("range",30,40,12,9,3.6,"s",4,t.limestone,t.copper,new Ze(5),{crates:2});for(let e=0;e<5;e++)this.box(-20+e*9,4,-30,-17+e*9,4+1.2+e%2*.8,-28,t.stone);this.cyl(20,-20,1.4,4,9,"pillar",t.copper),this.cyl(-30,-10,2.2,2,6,"rock",t.stone),this.ziplines.push({id:0,name:"Range Line",a:{x:30,y:12,z:40},b:{x:-10,y:5.2,z:0}}),this.vents.push({x:60,z:60,r:4,y:4,boost:22})}}function Na(a,t,e,n){const i=_e(a,n.minX,n.maxX),s=_e(t,n.minZ,n.maxZ),r=a-i,o=t-s;return r*r+o*o<e*e}function Wh(a,t,e,n,i,s,r){let o=0,l=1/0;const c=(h,d,u,p)=>{if(Math.abs(d)<1e-9)return h>=u&&h<=p;let g=(u-h)/d,v=(p-h)/d;if(g>v){const f=g;g=v,v=f}return o=Math.max(o,g),l=Math.min(l,v),o<=l};return!c(a,n,r.minX,r.maxX)||!c(t,i,r.minY,r.maxY)||!c(e,s,r.minZ,r.maxZ)?-1:o}function Xh(a,t,e,n,i,s,r){const o=a-r.x,l=e-r.z,c=n*n+s*s;if(c<1e-9)return-1;const h=2*(o*n+l*s),d=o*o+l*l-r.r*r.r,u=h*h-4*c*d;if(u<0)return-1;const p=Math.sqrt(u);let g=(-h-p)/(2*c);if(g<0&&(g=(-h+p)/(2*c)),g<0)return-1;const v=t+i*g;return v<r.y0||v>r.y1?-1:g}function Qa(a,t,e,n,i,s,r,o,l,c,h){const d=a-r,u=e-o,p=n*n+s*s;if(p<1e-9)return null;const g=2*(d*n+u*s),v=d*d+u*u-l*l,f=g*g-4*p*v;if(f<0)return null;const m=Math.sqrt(f);let y=(-g-m)/(2*p);if(y<0&&(y=(-g+m)/(2*p)),y<0)return null;const S=t+i*y;return S<c||S>h?null:{t:y,y:S}}class qh{stages=[];total;constructor(t,e,n=!0){if(!n){this.total=1/0;return}const i=new Ze(e*31+7);let s={x:0,z:0,r:ms},r=0;const o=t.zoneCenters,l=(p,g,v)=>{const f=Math.max(0,(p.r-g)*v),m=o.filter(x=>Math.hypot(x.x-p.x,x.z-p.z)<=f);if(m.length===0){let x={x:p.x,z:p.z},T=1/0;for(const E of o){const w=Math.hypot(E.x-p.x,E.z-p.z);w<T&&(T=w,x={x:E.x,z:E.z})}if(T>f&&T>0){const E=f/T;return{x:p.x+(x.x-p.x)*E,z:p.z+(x.z-p.z)*E}}return x}const y=m.map(x=>1+x.cover*.6),S=m[i.weighted(y)];return{x:S.x,z:S.z}},c=Jn[0],h=l(s,hl,.9);this.stages.push({label:"Calmfield holds",phase:0,start:r,waitLen:c.wait,shrinkLen:0,damageWait:0,damageShrink:0,from:s,to:s}),r+=c.wait;const d={x:h.x,z:h.z,r:hl};this.stages.push({label:"Riftstorm sweeping in",phase:1,start:r,waitLen:0,shrinkLen:dl,damageWait:0,damageShrink:Jn[1].damage,from:s,to:d}),r+=dl,s=d;let u=Jn[1].damage;for(let p=1;p<Jn.length;p++){const g=Jn[p],f=p>=6?$h(t,i,s,p===Jn.length-1?8:20):l(s,g.toRadius,.92),m={x:f.x,z:f.z,r:g.toRadius};this.stages.push({label:p>=6?p===Jn.length-1?"Final collapse":"Calmfield drifting":`Calmfield contracting ${p}`,phase:p+1,start:r,waitLen:g.wait,shrinkLen:g.shrink,damageWait:u,damageShrink:g.damage,from:s,to:m}),r+=g.wait+g.shrink,s=m,u=g.damage}this.total=r}at(t,e){if(this.stages.length===0)return e.phase=-1,e.r=99999,e.damage=0,e.stage="done",e.label="No storm",e.cx=0,e.cz=0,e.t=0,e.waitLen=0,e.shrinkLen=0,e.toR=99999,e.nextR=99999,e;let n=this.stages.length-1;for(let o=0;o<this.stages.length;o++){const l=this.stages[o];if(t<l.start+l.waitLen+l.shrinkLen){n=o;break}}const i=this.stages[n],s=t-i.start;e.phase=i.phase,e.label=i.label,e.fromX=i.from.x,e.fromZ=i.from.z,e.fromR=i.from.r,e.toX=i.to.x,e.toZ=i.to.z,e.toR=i.to.r,e.waitLen=i.waitLen,e.shrinkLen=i.shrinkLen;const r=this.stages[Math.min(n+1,this.stages.length-1)];if(s<i.waitLen)e.stage="wait",e.t=s,e.cx=i.from.x,e.cz=i.from.z,e.r=i.from.r,e.damage=i.damageWait,i.shrinkLen>0?(e.nextX=i.to.x,e.nextZ=i.to.z,e.nextR=i.to.r):(e.nextX=r.to.x,e.nextZ=r.to.z,e.nextR=r.to.r);else if(s<i.waitLen+i.shrinkLen){const o=(s-i.waitLen)/i.shrinkLen;e.stage="shrink",e.t=s-i.waitLen,e.cx=i.from.x+(i.to.x-i.from.x)*o,e.cz=i.from.z+(i.to.z-i.from.z)*o,e.r=i.from.r+(i.to.r-i.from.r)*o,e.damage=i.damageShrink,e.nextX=i.to.x,e.nextZ=i.to.z,e.nextR=i.to.r}else e.stage="done",e.t=s,e.cx=i.to.x,e.cz=i.to.z,e.r=i.to.r,e.damage=i.damageShrink,e.nextX=i.to.x,e.nextZ=i.to.z,e.nextR=i.to.r;return e}}function $h(a,t,e,n){for(let i=0;i<40;i++){const s=t.range(0,Math.PI*2),r=t.range(n*.3,n),o=e.x+Math.cos(s)*r,l=e.z+Math.sin(s)*r;if(a.isLand(o,l)&&a.slopeAt(o,l)<.6)return{x:o,z:l}}return{x:e.x,z:e.z}}function Yh(){return{phase:0,cx:0,cz:0,r:ms,fromX:0,fromZ:0,fromR:ms,toX:0,toZ:0,toR:ms,nextX:0,nextZ:0,nextR:ms,t:0,stage:"wait",waitLen:90,shrinkLen:0,damage:0,label:"Calmfield holds"}}const Vi=[],Ea=[],Zh=[],jh=[];function Vn(a){return a.mode==="swim"?Mt.heightSwim:a.sliding?Mt.heightSlide:a.crouching?Mt.heightCrouch:Mt.heightStand}function Kh(a,t,e,n,i){a.queryCircle(e,n,Mt.radius+.05,Vi,Ea);const s=t.y;for(const r of Vi)if(!(r.maxY<=s+Mt.stepHeight&&t.onGround)&&!(r.maxY<=s+.02)&&!(r.minY>=s+i)&&Na(e,n,Mt.radius,r))return!0;for(const r of Ea){if(r.y1<=s+Mt.stepHeight&&r.kind!=="tree"||r.y0>=s+i||r.y1<=s)continue;if(Math.hypot(e-r.x,n-r.z)<r.r+Mt.radius)return!0}return!1}function Cn(a,t,e,n,i){return a.groundHeight(t,e,n,i,Mt.radius,Zh,jh)}function fl(a,t,e,n,i){const s=Math.hypot(e,n);if(s<1e-6)return;const r=Math.max(1,Math.ceil(s/.25)),o=e/r,l=n/r;for(let c=0;c<r;c++)for(const h of[0,1]){const d=h===0?o:0,u=h===1?l:0;if(d===0&&u===0)continue;const p=t.x+d,g=t.z+u;if(!Kh(a,t,p,g,i)){if(t.onGround&&t.mode!=="swim"){const f=Cn(a,p,g,t.y,Mt.stepHeight)-t.y,m=Math.hypot(d,u);if(f>Math.max(.12,m*Mt.slopeLimit))continue}else if(!t.onGround&&t.mode!=="swim"){if(a.heightAt(p,g)>t.y+.4&&t.vy<3)continue}else if(t.mode==="swim"&&Cn(a,p,g,t.y,.2)>t.y+.9)continue;t.x=p,t.z=g}}if(t.y<250){const c=a.half+40;t.x=_e(t.x,-c,c),t.z=_e(t.z,-c,c)}}function Jh(a,t,e,n){const i=[.62,.8];for(const s of i){const r=t.x+e*s,o=t.z+n*s;a.queryCircle(r,o,.25,Vi,Ea);let l=null;for(const d of Vi){const u=d.maxY-t.y;u<Mt.mantleMin||u>Mt.mantleMax||d.minY>t.y+.5||Na(r,o,.25,d)&&(!l||d.maxY>l.maxY)&&(l=d)}if(!l)continue;const c=t.x+e*(s+.55),h=t.z+n*(s+.55);if(!((c<l.minX-.1||c>l.maxX+.1||h<l.minZ-.1||h>l.maxZ+.1)&&pl(a,c,h,l.maxY))&&!pl(a,c,h,l.maxY,l))return{tx:c,ty:l.maxY,tz:h,h:l.maxY-t.y}}return null}function pl(a,t,e,n,i){a.queryCircle(t,e,Mt.radius,Vi,Ea);for(const s of Vi)if(s!==i&&!(s.maxY<=n+.05)&&!(s.minY>=n+Mt.heightStand)&&Na(t,e,Mt.radius,s))return!0;return!1}function Qh(){return{landSpeed:0,fallDamage:0,mantled:!1,slid:!1,jumped:!1,deployed:!1,stepped:!1}}function td(a,t,e,n,i,s,r){t.yaw=e.yaw,t.pitch=e.pitch;const o=t.x,l=t.z;switch(t.mode){case"freefall":nd(a,t,e,n,i,s);break;case"glide":id(a,t,e,n,i,s);break;case"zipline":sd(a,t,e,n,i);break;case"grapple":ad(a,t,i);break;case"mantle":ed(t,i);break;case"ground":case"swim":rd(a,t,e,n,i,s,r);break}t.mode!=="staging"&&t.mode!=="skiff"&&(t.stats.distance+=Math.hypot(t.x-o,t.z-l))}function ed(a,t){const e=a.mantle;if(!e){a.mode="ground";return}e.t+=t;const n=_e(e.t/e.dur,0,1),i=_e(n*1.6,0,1),s=_e((n-.35)/.65,0,1);a.y=e.sy+(e.ty-e.sy)*i,a.x=e.sx+(e.tx-e.sx)*s,a.z=e.sz+(e.tz-e.sz)*s,a.vx=a.vy=a.vz=0,n>=1&&(a.mode="ground",a.mantle=null,a.onGround=!0,a.y=e.ty)}function nd(a,t,e,n,i,s){const r=Pn(e.yaw,0),o=As(e.yaw),l=e.moveF>.3,c=e.moveF<-.3,h=l?Mt.freefallHoriz:c?Mt.freefallHorizMin:(Mt.freefallHoriz+Mt.freefallHorizMin)*.55,d=l?Mt.freefallDive:c?48:Mt.freefallTerminal,u=r.x*h+o.x*e.moveR*9,p=r.z*h+o.z*e.moveR*9,g=1-Math.exp(-2.2*i);t.vx+=(u-t.vx)*g,t.vz+=(p-t.vz)*g,t.vy>-d?t.vy=Math.max(-d,t.vy-24*i):t.vy+=(-d-t.vy)*(1-Math.exp(-1.5*i)),t.x+=t.vx*i,t.y+=t.vy*i,t.z+=t.vz*i;const v=Cn(a,t.x,t.z,t.y,0),f=t.y-v,m=e.deploy&&!n.deploy||e.jump&&!n.jump;if(t.ventLaunch&&t.vy<0&&f>8){ml(t,s);return}if(!t.ventLaunch&&(m&&f>Mt.minDeployAGL||f<=Mt.autoDeployAGL)&&f>Mt.minDeployAGL*.4){ml(t,s);return}f<=0&&Gc(a,t,s,v)}function ml(a,t){a.mode="glide",a.wingOut=!0,a.ventLaunch=!1,t.deployed=!0}function id(a,t,e,n,i,s){const r=Pn(e.yaw,0),o=As(e.yaw),l=e.moveF>.3,c=e.moveF<-.3,h=l?Mt.glideSpeedBoost:c?11:Mt.glideSpeed,d=l?8.8:c?4.6:Mt.glideDescent,u=r.x*h+o.x*e.moveR*5,p=r.z*h+o.z*e.moveR*5,g=1-Math.exp(-2*i);t.vx+=(u-t.vx)*g,t.vz+=(p-t.vz)*g,t.vy+=(-d-t.vy)*(1-Math.exp(-3*i)),t.x+=t.vx*i,t.y+=t.vy*i,t.z+=t.vz*i;const v=Cn(a,t.x,t.z,t.y,.1);if(t.y-v<=.05){t.wingOut=!1,t.y=v,t.vx*=.3,t.vz*=.3,t.vy=0,t.onGround=!0,t.mode="ground",s.landSpeed=4;return}e.deploy&&!n.deploy&&t.y-v>Mt.minDeployAGL*1.6&&(t.mode="freefall",t.wingOut=!1)}function Gc(a,t,e,n){const i=t.vy;if(t.y=n,t.onGround=!0,t.mode="ground",t.wingOut=!1,t.ventLaunch=!1,a.waterLevel-n>Mt.swimDepth){t.mode="swim",t.vy=0;return}const r=-i;e.landSpeed=r,r>se.fallDamageSpeed&&(e.fallDamage=(r-se.fallDamageSpeed)*se.fallDamagePerMs),t.vy=0,t.vx*=.4,t.vz*=.4}function sd(a,t,e,n,i){const s=t.zip;if(!s){t.mode="ground";return}const r=a.ziplines[s.id],o=r.a,l=r.b,c=Math.hypot(l.x-o.x,l.y-o.y,l.z-o.z);s.dist+=Mt.zipSpeed*i;const h=_e(s.dist/c,0,1),d=s.dir>0?o:l,u=s.dir>0?l:o;t.x=d.x+(u.x-d.x)*h,t.y=d.y+(u.y-d.y)*h-1.9,t.z=d.z+(u.z-d.z)*h,t.vx=(u.x-d.x)/c*Mt.zipSpeed,t.vy=(u.y-d.y)/c*Mt.zipSpeed,t.vz=(u.z-d.z)/c*Mt.zipSpeed;const p=e.jump&&!n.jump||e.crouch&&!n.crouch||e.interact&&!n.interact;if(h>=1||p){t.zip=null,t.mode="ground",t.onGround=!1,t.vx*=.6,t.vz*=.6,t.vy=p&&e.jump?3:0;const g=Cn(a,t.x,t.z,t.y,.1);t.y<=g&&(t.y=g,t.onGround=!0,t.vy=0)}}function ad(a,t,e){const n=t.grapple;if(!n){t.mode="ground";return}n.t-=e;const i=n.x-t.x,s=n.y-t.y,r=n.z-t.z,o=Math.hypot(i,s,r);if(o<1.6||n.t<=0){t.grapple=null,t.mode="ground",t.onGround=!1,t.vx*=.3,t.vz*=.3,t.vy=2;return}const l=Math.min(Mt.grappleSpeed,o/e);t.vx=i/o*l,t.vy=s/o*l,t.vz=r/o*l,t.x+=t.vx*e,t.y+=t.vy*e,t.z+=t.vz*e}function rd(a,t,e,n,i,s,r){const o=Pn(e.yaw,0),l=As(e.yaw);let c=o.x*e.moveF+l.x*e.moveR,h=o.z*e.moveF+l.z*e.moveR;const d=Math.hypot(c,h);d>1&&(c/=d,h/=d);const u=d>.05,p=Cn(a,t.x,t.z,t.y,.3),g=a.waterLevel-p;if(t.mode==="ground"&&g>Mt.swimDepth&&t.y<a.waterLevel+.2?(t.mode="swim",t.sliding=!1,t.crouching=!1,t.mantle=null):t.mode==="swim"&&g<=Mt.swimDepth-.05&&(t.mode="ground",t.onGround=!0,t.y=p),t.mode==="swim"){const C=(e.sprint&&e.moveF>.3?Mt.swimSprint:Mt.swim)*r,M=1-Math.exp(-6*i);t.vx+=(c*C-t.vx)*M,t.vz+=(h*C-t.vz)*M,fl(a,t,t.vx*i,t.vz*i,Mt.heightSwim);const _=a.waterLevel-1.15;t.y+=(Math.max(_,p)-t.y)*(1-Math.exp(-8*i)),t.vy=0,t.onGround=!0,t.sprinting=!1,t.stamina=Math.min(1,t.stamina+i/4);return}const v=n.crouch,f=t.onGround&&!t.sliding&&t.slideCd<=0&&Math.hypot(t.vx,t.vz)>Mt.slideMinSpeed&&t.sprinting;if(e.crouch&&!v&&f){const w=Math.hypot(t.vx,t.vz);t.sliding=!0,t.slideT=Mt.slideDuration,t.slideDirX=t.vx/w,t.slideDirZ=t.vz/w,t.slideSpeed=Math.max(w,Mt.sprint)*Mt.slideSpeedBoost,s.slid=!0}if(t.sliding){t.slideT-=i;const w=1.2,C=(a.heightAt(t.x+w,t.z)-a.heightAt(t.x-w,t.z))/(2*w),M=(a.heightAt(t.x,t.z+w)-a.heightAt(t.x,t.z-w))/(2*w),_=-(C*t.slideDirX+M*t.slideDirZ);t.slideSpeed+=_*22*i-4.2*i,t.slideSpeed=_e(t.slideSpeed,0,12),(t.slideT<=0||t.slideSpeed<3.2||!e.crouch&&t.slideT<.6||e.jump&&!n.jump)&&(t.sliding=!1,t.slideCd=Mt.slideCooldown)}t.crouching=e.crouch&&!t.sliding,t.slideCd=Math.max(0,t.slideCd-i);let m=Mt.run;const y=e.sprint&&e.moveF>.3&&!e.ads&&!t.crouching&&t.stamina>.02&&!t.using;e.ads&&(m=Mt.walk),t.crouching&&(m=Mt.crouch),y&&u?(m=Mt.sprint,t.sprinting=!0,t.stamina=Math.max(0,t.stamina-i/Mt.sprintEnergy),t.sprintDelay=Mt.sprintRegenDelay):(t.sprinting=!1,t.sprintDelay-=i,t.sprintDelay<=0&&(t.stamina=Math.min(1,t.stamina+i/3.2))),m*=r;const S=e.jump&&!n.jump;if((t.onGround||t.vy>-5)&&!t.sliding&&e.jump&&t.mode==="ground"){const w=Jh(a,t,o.x,o.z);if(w&&(u||S)){t.mode="mantle",t.mantle={t:0,dur:.35+.3*w.h,sx:t.x,sy:t.y,sz:t.z,tx:w.tx,ty:w.ty,tz:w.tz},t.vx=t.vz=t.vy=0,s.mantled=!0;return}}t.onGround&&S&&!t.crouching&&(t.vy=Mt.jumpSpeed,t.onGround=!1,t.sliding=!1,s.jumped=!0);const x=Vn(t);if(t.sliding)t.vx=t.slideDirX*t.slideSpeed,t.vz=t.slideDirZ*t.slideSpeed;else{const w=t.onGround?Mt.accelGround:Mt.accelAir,C=c*m,M=h*m,_=C-t.vx,P=M-t.vz,I=Math.hypot(_,P),D=w*i;I<=D||I<1e-6?(t.vx=C,t.vz=M):(t.vx+=_/I*D,t.vz+=P/I*D)}fl(a,t,(t.vx+t.knockX)*i,(t.vz+t.knockZ)*i,x);const T=Math.exp(-3.2*i);t.knockX*=T,t.knockZ*=T,Math.abs(t.knockX)<.05&&(t.knockX=0),Math.abs(t.knockZ)<.05&&(t.knockZ=0);const E=Cn(a,t.x,t.z,t.y,t.onGround?Mt.stepHeight:.05);if(t.onGround)if(t.y-E>.55)t.onGround=!1,t.vy=0;else{const w=E-t.y;t.y+=Math.abs(w)<.02?w:w*(1-Math.exp(-30*i)),Math.abs(E-t.y)<.03&&(t.y=E),t.vy=0,t.fallSpeed=0}if(!t.onGround){t.vy-=Mt.gravity*i;const w=t.y+t.vy*i;Cn(a,t.x,t.z,Math.max(t.y,w),0);const C=Cn(a,t.x,t.z,t.y,.12);if(w<=C&&t.vy<=0){t.y=C;const M=t.vy;t.vy=M,Gc(a,t,s,C)}else t.y=w}}const is={boom:3.1,shoulder:.55,height:.35};function zo(a){return a.mode==="swim"?.8:a.sliding?.85:a.crouching?1.15:1.62}function Ta(a,t,e){const n=t.yaw+t.recoilY*.0175,i=Math.max(-1.45,Math.min(1.45,t.pitch+t.recoilP*.0175)),s=Pn(n,i),r=As(t.yaw),o=is.boom+(e-is.boom)*t.adsT,l=is.shoulder*t.shoulder*(1-.25*t.adsT),c={x:t.x,y:t.y+zo(t)+is.height*.55,z:t.z};let h=-s.x*o+r.x*l,d=-s.y*o+is.height*.45,u=-s.z*o+r.z*l;const p=Math.hypot(h,d,u);h/=p,d/=p,u/=p;let g=p;const v=a.raycast(c.x,c.y,c.z,h,d,u,p+.3,!0);return v>=0&&(g=Math.max(.5,v-.3)),{pos:{x:c.x+h*g,y:c.y+d*g,z:c.z+u*g},dir:s,pivot:c,boom:o}}function gl(a){const t=As(a.yaw),e=Pn(a.yaw,0),n=zo(a)-.2;return{x:a.x+t.x*.28*a.shoulder+e.x*.55,y:a.y+n,z:a.z+t.z*.28*a.shoulder+e.z*.55}}function Vc(a){for(let t=0;t<hi;t++)if(!a.slots[t])return t;return-1}function vl(a,t,e){const n=Io[t]-a.ammo[t],i=Math.max(0,Math.min(n,e));return a.ammo[t]+=i,i}function xl(a,t,e){const n=fe[t];let i=e;for(let s=0;s<hi&&i>0;s++){const r=a.slots[s];if(r&&r.kind==="item"&&r.item===t&&r.count<n.stack){const o=Math.min(n.stack-r.count,i);r.count+=o,i-=o}}for(;i>0;){const s=Vc(a);if(s<0)break;const r=Math.min(n.stack,i);a.slots[s]={kind:"item",item:t,count:r},i-=r}return e-i}function od(a,t,e,n){const i=Vc(a);return i<0?-1:(a.slots[i]={kind:"weapon",weapon:t,rarity:e,mag:n},i)}function Us(a){return a.kind==="weapon"?{kind:"weapon",weapon:a.weapon,rarity:a.rarity,mag:a.mag}:{kind:"item",item:a.item,count:a.count}}function ss(a){const t=a.slots[a.selected];return t&&t.kind==="weapon"?{weapon:t.weapon,rarity:t.rarity,mag:t.mag,slot:a.selected}:null}function ld(a){switch(a.kind){case"weapon":return Ce[a.weapon].name;case"item":return fe[a.item].name+(a.count>1?` x${a.count}`:"");case"ammo":return`${a.ammo[0].toUpperCase()+a.ammo.slice(1)} Ammo x${a.count}`;case"cache":return`${a.owner}'s Cache`}}function gs(a,t){for(let e=0;e<a.slots.length;e++){const n=a.slots[e];if(n&&n.kind==="item"&&n.item===t)return e}return-1}function cd(a,t,e){const n=cl[t]??cl[1];let i=a.weighted(n);return i===4&&(e.prototypes>=Bh?i=3:e.prototypes++),i}function bs(a,t,e,n){const i=Br.map(o=>o===n?0:Hh[o]),s=Br[a.weighted(i)],r=cd(a,t,e);return{kind:"weapon",weapon:s,rarity:r,mag:Xe(s,r).mag}}function fi(a,t){return t[a.weighted(t.map(e=>e[1]))][0]}function Aa(a,t){const e=Ce[a],n=Fc[e.ammo];return{kind:"ammo",ammo:e.ammo,count:Math.max(2,Math.round(n*t.range(.8,1.3)))}}function hd(a,t,e,n){if(!e&&a.chance(.1))return[];switch(e?"weapon":["weapon","ammo","heal","shield","utility"][a.weighted([ns.weapon,ns.ammo,ns.heal,ns.shield,ns.utility])]){case"weapon":{const s=bs(a,t,n);return s.kind!=="weapon"?[s]:a.chance(.75)?[s,Aa(s.weapon,a)]:[s]}case"ammo":{const s=["light","light","shell","heavy","charge"][a.int(0,4)];return[{kind:"ammo",ammo:s,count:Math.round(Fc[s]*a.range(.8,1.4))}]}case"heal":return[{kind:"item",item:fi(a,Do),count:1}];case"shield":return[{kind:"item",item:fi(a,ko),count:1}];default:return[{kind:"item",item:fi(a,Bc),count:1}]}}function dd(a,t,e){const n=[],i=bs(a,t,e);if(n.push(i),i.kind==="weapon"&&n.push(Aa(i.weapon,a)),a.chance(.55)){const s=bs(a,t,e,i.kind==="weapon"?i.weapon:void 0);n.push(s)}else n.push({kind:"item",item:fi(a,Bc),count:1});return n.push({kind:"item",item:fi(a,a.chance(.5)?Do:ko),count:a.chance(.3)?2:1}),n}function ud(a){return[{kind:"ammo",ammo:"light",count:30},{kind:"ammo",ammo:a.chance(.5)?"shell":"heavy",count:a.chance(.5)?8:10},{kind:"item",item:fi(a,Do),count:2},{kind:"item",item:fi(a,ko),count:1}]}function fd(a,t){const e=[],n=bs(a,5,t);e.push(n),n.kind==="weapon"&&e.push(Aa(n.weapon,a));const i=bs(a,5,t,n.kind==="weapon"?n.weapon:void 0);return e.push(i),i.kind==="weapon"&&e.push(Aa(i.weapon,a)),e.push({kind:"item",item:"traumaKit",count:1}),e.push({kind:"item",item:"shieldFlask",count:2}),e}function qn(){return{moveF:0,moveR:0,yaw:0,pitch:0,jump:!1,sprint:!1,crouch:!1,fire:!1,ads:!1,reload:!1,interact:!1,drop:!1,deploy:!1,melee:!1,throwItem:!1,slot:-1,cycle:0,jumpSkiff:!1,swapShoulder:!1}}class pd{constructor(t,e,n,i){this.m=t,this.p=e,this.rng=n,this.skill=i,this.yaw=e.yaw,this.wanderSeed=n.next()*1e3}state="Skiff";yaw=0;pitch=0;dropTarget=null;jumpDist=300;goal=null;goalAt=-99;blacklist=new Map;target=null;lastSeen=null;spottedAt=-99;nextPerception=0;alert=null;aimErrYaw=0;aimErrPitch=0;aimErrAt=0;strafeDir=1;strafeUntil=0;burstLeft=0;burstPause=0;stuckPos={x:0,z:0,t:0};detourUntil=0;detourDir=1;stuckCount=0;interactToggle=!1;healUntil=0;holdUntil=0;crouchUntil=0;lastEnemyT=-99;utilityCd=0;wanderSeed=0;slotTimer=0;time=0;think(t){this.time+=t;const e=this.p;this.m;const n=qn();return n.yaw=this.yaw,n.pitch=this.pitch,e.mode==="skiff"?(this.thinkSkiff(n),n):e.mode==="freefall"||e.mode==="glide"?(this.thinkAir(n,t),n):e.mode==="zipline"||e.mode==="grapple"||e.mode==="mantle"?(n.yaw=this.yaw,n):(this.perceive(),this.thinkGround(n,t),n)}chooseDrop(){const t=this.m,e=t.skiff,n=t.world.locations.filter(u=>u.id!=="wild"),i=n.map(u=>{const p=u.x-e.startX,g=u.z-e.startZ,v=p*e.dirX+g*e.dirZ,f=e.startX+e.dirX*v,m=e.startZ+e.dirZ*v,y=Math.hypot(u.x-f,u.z-m);if(y>420)return 0;const S=u.tier*u.tier+(u.named?3:.5),x=this.skill>.65?1.2:.8;return Math.max(.2,S*(1-y/520))*(u.tier>=3?x:1)}),r=i.reduce((u,p)=>u+p,0)>0?this.rng.weighted(i):0,o=n[r];this.dropTarget={x:o.x+this.rng.range(-o.r*.4,o.r*.4),z:o.z+this.rng.range(-o.r*.4,o.r*.4),name:o.name};const l=this.dropTarget.x-e.startX,c=this.dropTarget.z-e.startZ,h=l*e.dirX+c*e.dirZ,d=Math.hypot(this.dropTarget.x-(e.startX+e.dirX*h),this.dropTarget.z-(e.startZ+e.dirZ*h));this.jumpDist=Math.min(470,Math.max(this.rng.range(250,400),d+40))}thinkSkiff(t){this.dropTarget||this.chooseDrop();const e=this.dropTarget,n=this.p,i=Math.hypot(e.x-n.x,e.z-n.z);this.yaw=Math.atan2(e.x-n.x,e.z-n.z),t.yaw=this.yaw;const s=(e.x-n.x)*this.m.skiff.dirX+(e.z-n.z)*this.m.skiff.dirZ<0;(i<=this.jumpDist||s)&&Math.hypot(n.x,n.z)<570&&(t.jump=!0)}thinkAir(t,e){const n=this.dropTarget??{x:0,z:0},i=this.p,s=n.x-i.x,r=n.z-i.z,o=Math.hypot(s,r);if(this.yaw=this.turnToward(this.yaw,Math.atan2(s,r),4*e),t.yaw=this.yaw,i.mode==="freefall")t.moveF=o>90?1:0;else{const l=this.m.world.heightAt(i.x,i.z),c=Math.max(1,i.y-l),h=Math.hypot(i.vx,i.vz),d=c/6.5,u=h*d;t.moveF=o>u*1.05?1:o<u*.55?-1:0,o<25&&(t.moveF=-1)}}eye(t){return{x:t.x,y:t.y+zo(t),z:t.z}}perceive(){const t=this.p,e=this.m;if(e.time<this.nextPerception)return;this.nextPerception=e.time+.2+t.id%3*.02;const n=this.eye(t);let i=null,s=1e9;for(const r of e.players){if(r===t||!r.alive||r.mode==="skiff"||r.dummy)continue;const o=r.x-t.x,l=r.z-t.z,c=Math.hypot(o,l),h=r.crouching?70:r.sprinting?130:105;if(c>h)continue;const d=Math.atan2(o,l);if(Math.abs(Za(this.yaw,d))>1.9&&c>12)continue;const u={x:r.x,y:r.y+Vn(r)*.7,z:r.z};e.world.hasLineOfSight(n,u)&&(e.lineThroughSmoke(n,u)||c<s&&(s=c,i=r))}if(i?((this.target!==i||this.time-this.spottedAt>4)&&(this.spottedAt=this.time),this.target=i,this.lastSeen={x:i.x,y:i.y,z:i.z,t:this.time},this.lastEnemyT=this.time):this.target&&this.time-(this.lastSeen?.t??-99)>6&&(this.target=null),!i)for(const r of e.sounds){if(r.pid===t.id||e.time-r.t>1.2)continue;const o=Math.hypot(r.x-t.x,r.z-t.z);if(o<r.loud&&o>3){const l=8+o*.12;this.alert={x:r.x+this.rng.range(-l,l),z:r.z+this.rng.range(-l,l),t:this.time};break}}}targetArmed(){const t=this.target;if(!t)return!1;const e=t.slots[t.selected];return!!e&&e.kind==="weapon"}enemyVisible(){return!!this.target&&!!this.lastSeen&&this.time-this.lastSeen.t<.5&&this.target.alive}thinkGround(t,e){const n=this.p,i=this.m,s=i.storm,r=this.enemyVisible(),o=n.health+n.aegis*.7+n.reserve*.7,l=n.slots.some(v=>v&&v.kind==="weapon"),c=.3+this.skill*.6,h=s.phase>0&&Math.hypot(n.x-s.cx,n.z-s.cz)>s.r-4,d=s.phase>0&&Math.hypot(n.x-s.nextX,n.z-s.nextZ)>s.nextR*.85,u=s.stage==="wait"?s.waitLen-s.t:0,p=h||s.stage==="shrink"&&d||s.stage==="wait"&&d&&u<28+Math.hypot(n.x-s.nextX,n.z-s.nextZ)/6.5;r&&l&&o>35*(1.3-c)&&!(p&&h&&s.damage>=4)?this.state="Engage":r&&(!l&&this.targetArmed()||o<=35)?this.state="Flee":(this.state==="Engage"||this.state==="Flee")&&(this.state=this.time-this.lastEnemyT<1.5?this.state:"Loot");let g={x:0,z:0,active:!1,sprint:!1};switch(!r&&this.time-this.lastEnemyT>2&&!n.using&&this.tryHeal(t),n.using?this.state="Heal":this.state==="Heal"&&(this.state="Loot"),this.state){case"Engage":this.doEngage(t,e);break;case"Flee":this.doFlee(t,e);break;case"Heal":t.crouch=!0;break;default:{(i.time-this.goalAt>.9+n.id%5*.1||!this.goal)&&this.chooseGoal(p),this.alert&&this.time-this.alert.t<5&&this.goal,this.goal&&(g=this.moveToGoal(this.goal),t.moveF=g.active?1:0,t.sprint=g.sprint&&!n.using,this.faceMove(g.x,g.z,e),t.yaw=this.yaw,this.pitch+=(0-this.pitch)*Math.min(1,6*e),t.pitch=this.pitch,this.handleStuck(t,e),this.m.world.inHazard(n.x+Math.sin(this.yaw)*2.2,n.z+Math.cos(this.yaw)*2.2)>0&&(t.jump=!0),this.tryInteractGoal(t));break}}this.manageWeapons(t,e),this.tickReload(t),this.utilityCd-=e}tryHeal(t){const e=this.p,n=i=>{const s=gs(e,i);return s<0?!1:(t.slot=s,e.selected!==s&&(this.slotTimer=.3),e.selected===s&&(t.fire=!0),!0)};e.health<55&&(n("traumaKit")||n("medInjector"))||e.health<82&&n("medInjector")||e.reserve<20&&e.health>40&&n("shieldFlask")||e.health<40&&n("traumaKit")}chooseGoal(t){const e=this.p,n=this.m,i=n.storm;if(this.goalAt=n.time,t){const p=i.stage==="wait"||i.stage==="shrink"?i.nextX:i.cx,g=i.stage==="wait"||i.stage==="shrink"?i.nextZ:i.cz,v=Math.max(2,i.nextR*.35),f=this.rng.range(0,Math.PI*2);this.goal={x:p+Math.cos(f)*v*this.rng.next(),z:g+Math.sin(f)*v*this.rng.next(),kind:"rotate"},this.state="Rotate";return}const s=e.slots.some(p=>p&&p.kind==="weapon");if(s&&this.lastSeen&&this.time-this.lastSeen.t<9&&this.skill>.4&&e.health>55&&this.rng.chance(.7)){this.goal={x:this.lastSeen.x,z:this.lastSeen.z,kind:"investigate"},this.state="Investigate";return}if(this.alert&&this.time-this.alert.t<4&&s&&this.skill>.3&&this.rng.chance(.8)){this.goal={x:this.alert.x,z:this.alert.z,kind:"investigate"},this.state="Investigate",this.alert=null;return}const r=!s;let o=null,l=0;const c=85,h=(p,g)=>{const v=e.slots.filter(y=>y&&y.kind==="weapon");if(v.length===0)return 100;const f=Math.min(...v.map(y=>y.rarity)),m=v.some(y=>y.weapon===g);return v.length<3?30+p*8-(m?15:0):p>f?12+(p-f)*10:0};for(const p of n.loot.values()){const g=p.x-e.x,v=p.z-e.z,f=Math.hypot(g,v);if(f>c||Math.abs(p.y-e.y)>12||(this.blacklist.get(p.id)??0)>this.time)continue;let m=0;const y=p.data;if(y.kind==="weapon")m=h(y.rarity,y.weapon)*(r?1.6:1);else if(y.kind==="ammo"){const x=e.ammo[y.ammo];m=e.slots.some(T=>T&&T.kind==="weapon"&&Ce[T.weapon].ammo===y.ammo)?x<60?22:x<120?10:0:0}else if(y.kind==="item"){const x=fe[y.item],T=e.slots.reduce((E,w)=>E+(w&&w.kind==="item"&&w.item===y.item?w.count:0),0);m=(x.category==="heal"?24:x.category==="shield"?20:8)-T*5,e.slots.every(E=>E)&&T===0&&(m=0)}else y.kind==="cache"&&(m=26);if(m<=0)continue;const S=m-f*.22;S>l&&(l=S,o={x:p.x,z:p.z,kind:"loot",id:p.id})}for(const p of n.chests.values()){if(p.opened)continue;const g=Math.hypot(p.x-e.x,p.z-e.z);if(g>c||Math.abs(p.y-e.y)>12||(this.blacklist.get(-p.id)??0)>this.time)continue;const f=(p.kind==="chest"?34:18)+(r&&p.kind==="chest"?12:0)+p.tier*3-g*.2;f>l&&(l=f,o={x:p.x,z:p.z,kind:"chest",id:p.id})}if(o&&l>6){this.goal=o,this.state=this.state==="Loot"||this.state==="Drop"?this.state:"Loot",this.state!=="Loot"&&(this.state="Loot");return}const d=i.phase,u=e.slots.some(p=>p&&p.kind==="weapon");if(!this.goal||this.goal.kind!=="wander"||Math.hypot(this.goal.x-e.x,this.goal.z-e.z)<6||this.rng.chance(.15)){const p=d>0?i.nextX:0,g=d>0?i.nextZ:0,v=d>0?i.nextR:420,f=n.world.locations.filter(m=>m.id!=="wild"&&Math.hypot(m.x-p,m.z-g)<v);if(f.length&&!(u&&this.rng.chance(.4))){const m=f[this.rng.int(0,f.length-1)];this.goal={x:m.x+this.rng.range(-20,20),z:m.z+this.rng.range(-20,20),kind:"wander"}}else{const m=this.rng.range(0,Math.PI*2),y=v*.6*this.rng.next();this.goal={x:p+Math.cos(m)*y,z:g+Math.sin(m)*y,kind:"wander"}}}this.state=d>=6?"Final":"Rotate"}moveToGoal(t){const e=this.p,n=this.m.world;let i=t.x,s=t.z;const r=(f,m,y,S)=>Math.abs(m-f.x)<f.w/2+S&&Math.abs(y-f.z)<f.d/2+S;if(e.onGround&&e.mode==="ground"){const f=n.buildings.find(m=>r(m,e.x,e.z,.3)&&e.y>m.floorY+m.h-.6&&e.y<m.floorY+m.h+1);if(f){const m=f.w/2+2,y=f.d/2+2,S=f.x+m-e.x,x=e.x-(f.x-m),T=f.z+y-e.z,E=e.z-(f.z-y),w=t.x-e.x,C=t.z-e.z;let M=e.x,_=e.z;const P=Math.min(S,x,T,E),I=Math.abs(w)>Math.abs(C)?w>0?"E":"W":C>0?"S":"N",O=(I==="E"?S:I==="W"?x:I==="S"?T:E)<P+5?I:P===S?"E":P===x?"W":P===T?"S":"N";return O==="E"?M=f.x+m+1:O==="W"?M=f.x-m-1:O==="S"?_=f.z+y+1:_=f.z-y-1,{x:M,z:_,active:!0,sprint:!1}}}const o=(f,m,y,S)=>Math.abs(m-f.x)<f.w/2+S&&Math.abs(y-f.z)<f.d/2+S,l=n.buildings.find(f=>o(f,e.x,e.z,-.3)&&Math.abs(e.y-f.floorY)<3),c=n.buildings.find(f=>o(f,t.x,t.z,-.3)&&Math.abs(t.z-f.z)<99);if(c&&c!==l){const f=Math.hypot(e.x-c.doorOut.x,e.z-c.doorOut.z),m=Math.hypot(e.x-c.doorIn.x,e.z-c.doorIn.z);f>2.2&&!(m<f&&m<3)?(i=c.doorOut.x,s=c.doorOut.z):(i=c.doorIn.x,s=c.doorIn.z),m<1.2&&(i=t.x,s=t.z)}else l&&l!==c&&(Math.hypot(e.x-l.doorIn.x,e.z-l.doorIn.z)>1.5?(i=l.doorIn.x,s=l.doorIn.z):(i=l.doorOut.x,s=l.doorOut.z));let h=l;c&&(i===c.doorIn.x&&s===c.doorIn.z||i===t.x&&s===t.z)&&(h=c);const d=Math.hypot(i-e.x,s-e.z),u=i===t.x&&s===t.z,p=this.routePoint(i,s,h);i=p.x,s=p.z;const g=t.kind==="loot"||t.kind==="chest"?1.2:4,v=d<g&&u;if(this.time<this.detourUntil){const f=Math.atan2(i-e.x,s-e.z)+this.detourDir*1.2;i=e.x+Math.sin(f)*6,s=e.z+Math.cos(f)*6}return{x:i,z:s,active:!v,sprint:d>10&&t.kind!=="loot"||d>16}}routePoint(t,e,n){const i=this.p,s=this.m.world;let r={x:t,z:e};for(let o=0;o<2;o++){let l=null,c=1e9;for(const g of s.buildings){if(g===n||Math.abs(g.x-i.x)>70&&Math.abs(g.z-i.z)>70||Math.abs(i.y-g.floorY)>8)continue;const v=1.2;if(yl(i.x,i.z,r.x,r.z,g.x-g.w/2-v,g.z-g.d/2-v,g.x+g.w/2+v,g.z+g.d/2+v)){const f=Math.hypot(g.x-i.x,g.z-i.z);f<c&&(c=f,l=g)}}if(!l)break;const h=1.9,d=[{x:l.x-l.w/2-h,z:l.z-l.d/2-h},{x:l.x+l.w/2+h,z:l.z-l.d/2-h},{x:l.x-l.w/2-h,z:l.z+l.d/2+h},{x:l.x+l.w/2+h,z:l.z+l.d/2+h}];let u=d[0],p=1e9;for(const g of d){const v=Math.hypot(g.x-i.x,g.z-i.z)+Math.hypot(g.x-r.x,g.z-r.z);v<p&&!yl(i.x,i.z,g.x,g.z,l.x-l.w/2-.9,l.z-l.d/2-.9,l.x+l.w/2+.9,l.z+l.d/2+.9)&&(p=v,u=g)}r=u}return r}faceMove(t,e,n){const i=this.p,s=Math.atan2(t-i.x,e-i.z);this.yaw=this.turnToward(this.yaw,s,7*n)}turnToward(t,e,n){const i=Za(t,e);return Hc(t+_e(i,-n,n))}handleStuck(t,e){const n=this.p;if(this.time-this.stuckPos.t>.7){const i=Math.hypot(n.x-this.stuckPos.x,n.z-this.stuckPos.z);i<.3&&t.moveF>0?(this.stuckCount++,t.jump=!0,this.detourUntil=this.time+1.1,this.detourDir=this.rng.chance(.5)?1:-1,this.stuckCount>=3&&this.goal&&(this.goal.id!==void 0&&this.blacklist.set(this.goal.kind==="chest"?-this.goal.id:this.goal.id,this.time+25),this.goal=null,this.stuckCount=0)):i>1.5&&(this.stuckCount=0),this.stuckPos={x:n.x,z:n.z,t:this.time}}}tryInteractGoal(t){const e=this.goal,n=this.p,i=this.m;if(!e||e.kind!=="loot"&&e.kind!=="chest")return;const s=Math.hypot(e.x-n.x,e.z-n.z);if(!(s>1.9)){if(e.kind==="loot"&&!i.loot.has(e.id)){this.goal=null;return}if(e.kind==="chest"){const r=i.chests.get(e.id);if(!r||r.opened){this.goal=null;return}}if(this.interactToggle=!this.interactToggle,t.interact=this.interactToggle,t.moveF=0,e.kind==="loot"){const r=i.loot.get(e.id);r&&r.data.kind==="weapon"&&n.slots.every(o=>o)&&(t.interact=!0)}s<1.4&&i.time-this.goalAt>4&&(e.id!==void 0&&this.blacklist.set(e.kind==="chest"?-e.id:e.id,this.time+20),this.goal=null)}}bestWeaponSlot(t){const e=this.p;let n=-1,i=-1e9;return e.slots.forEach((s,r)=>{if(!s||s.kind!=="weapon")return;const o=Xe(s.weapon,s.rarity),l=o.def;if(s.mag<=0&&e.ammo[l.ammo]<=0)return;const c=(l.falloffStart+l.falloffEnd)*.5,h=-Math.abs(t-Math.min(c,120))*.35-(t>l.falloffEnd?25:0),d=o.damage*l.pellets*(o.rpm/60)*.12,u=h+Math.min(d,40)+o.rarity.id*3+(l.id==="gale"?-25:0)+(l.id==="longwake"&&t<40?-30:0);u>i&&(i=u,n=r)}),n}manageWeapons(t,e){const n=this.p;if(this.slotTimer-=e,n.using||this.state==="Heal"||this.state==="Engage"||this.state==="Flee")return;const i=n.slots[n.selected];if(!i||i.kind!=="weapon"){const s=this.bestWeaponSlot(40);s>=0&&(t.slot=s)}}tickReload(t){const e=this.p,n=e.slots[e.selected];if(n&&n.kind==="weapon"&&!e.reloading&&!this.enemyVisible()){const i=Xe(n.weapon,n.rarity);n.mag<i.mag*.5&&e.ammo[i.def.ammo]>0&&(t.reload=!0)}}doEngage(t,e){const n=this.p,i=this.target;if(!i)return;const s=i.x-n.x,r=i.z-n.z,o=Math.hypot(s,r),l=this.bestWeaponSlot(o);l>=0&&l!==n.selected&&this.slotTimer<=0&&(t.slot=l,this.slotTimer=1.2);const c=n.slots[n.selected],h=!!c&&c.kind==="weapon",d=h?Ce[c.weapon]:null,u=h?Xe(c.weapon,c.rarity):null,p=.65-this.skill*.45,g=this.time-this.spottedAt>p;if(this.time>this.aimErrAt){const O=(1.15-this.skill)*1.9+o*.012+Math.hypot(i.vx,i.vz)*.28;this.aimErrYaw=this.rng.gauss()*O*.0175,this.aimErrPitch=this.rng.gauss()*O*.75*.0175,this.aimErrAt=this.time+.25+this.rng.next()*.25}const v=d&&d.kind==="projectile"?o/d.projSpeed:0,f=i.x+i.vx*v,m=i.z+i.vz*v,y=i.y+Vn(i)*(this.skill>.7&&this.rng.chance(.25)?.92:.68),S=this.eye(n),x=f-S.x,T=m-S.z,E=Math.hypot(x,T)||1,w=Math.atan2(x,T)+this.aimErrYaw;let C=Math.atan2(y-S.y,E)+this.aimErrPitch;C-=n.recoilP*.0175*(.55+this.skill*.35);const M=(4+this.skill*7)*e;this.yaw=this.turnToward(this.yaw,w-n.recoilY*.0175*.5,M),this.pitch+=_e(C-this.pitch,-M,M),t.yaw=this.yaw,t.pitch=this.pitch;const _=Math.abs(Za(this.yaw,w)),P=d?_e((d.falloffStart+d.falloffEnd)*.4,8,70):15;let I=0;if(o>P*1.4?I=1:o<P*.6&&(I=-1),this.time>this.strafeUntil&&(this.strafeDir=this.rng.chance(.5)?1:-1,this.strafeUntil=this.time+.7+this.rng.next()*1.4),t.moveF=I,t.moveR=this.strafeDir*(o<70?.8:.3),t.sprint=o>P*2.2&&!this.p.reloading&&this.time-this.spottedAt<99&&_<.5&&!(d&&o<d.range*.7),t.crouch=o>55&&this.time<this.crouchUntil||o>55&&this.rng.chance(.01)&&(this.crouchUntil=this.time+1.5)>0,o>20&&(t.ads=!0),this.handleStuck(t,e),h&&d&&u&&g){const O=c,G=o<d.range*.8&&d.id!=="gale",H=_<.035+.5/Math.max(8,o);O.mag<=0&&n.ammo[d.ammo]>0&&!n.reloading&&(t.reload=!0),G&&H&&O.mag>0&&!n.reloading&&(this.burstPause>0?this.burstPause-=e:(t.fire=d.auto?!0:this.time%.2<.1,this.burstLeft<=0&&(this.burstLeft=Math.round(d.auto?4+this.rng.next()*8:1)),d.auto?(this.burstLeft-=e*u.rpm/60,this.burstLeft<=0&&(this.burstPause=.15+this.rng.next()*(.55-this.skill*.3))):(this.burstPause=.05+this.rng.next()*.2,this.burstLeft=0)))}else h||o<2.2&&(t.melee=!0);if(this.utilityCd<=0&&!n.using){if(n.health<45&&o<40){const O=gs(n,"mistCapsule");O>=0&&(t.slot=O,this.utilityCd=6,this.holdUntil=this.time+.4)}else if(o>7&&o<28&&this.rng.chance(.004)){const O=gs(n,"windOrb");O>=0&&(t.slot=O,this.utilityCd=8,this.holdUntil=this.time+.4)}}const D=n.slots[n.selected];D&&D.kind==="item"&&(D.item==="mistCapsule"||D.item==="windOrb")&&(t.fire=this.time%.3<.12,t.moveF=0)}doFlee(t,e){const n=this.p,i=this.target;if(!i)return;const r=Math.atan2(n.x-i.x,n.z-i.z)+.5*this.strafeDir;this.yaw=this.turnToward(this.yaw,r,8*e),t.yaw=this.yaw,t.moveF=1,t.sprint=!0,this.time>this.strafeUntil&&(this.strafeDir=-this.strafeDir,this.strafeUntil=this.time+1.2),this.handleStuck(t,e);const o=gs(n,"mistCapsule");o>=0&&this.utilityCd<=0&&(t.slot=o,this.utilityCd=7);const l=n.slots[n.selected];l&&l.kind==="item"&&l.item==="mistCapsule"&&(t.fire=this.time%.3<.12)}}function yl(a,t,e,n,i,s,r,o){let l=0,c=1;const h=e-a,d=n-t,u=[-h,h,-d,d],p=[a-i,r-a,t-s,o-t];for(let g=0;g<4;g++)if(Math.abs(u[g])<1e-9){if(p[g]<0)return!1}else{const v=p[g]/u[g];if(u[g]<0){if(v>c)return!1;v>l&&(l=v)}else{if(v<l)return!1;v<c&&(c=v)}}return!0}function md(){return{kills:0,assists:0,damageDealt:0,damageTaken:0,stormDamage:0,shots:0,hits:0,headshots:0,distance:0,lootPicked:[],placement:0,surviveTime:0,killedBy:""}}const _l=(()=>{const a=[];for(let t=-3;t<=3;t++)for(let e=-2;e<=2;e++)a.push([t*1.6,e*1.5]);return a.sort((t,e)=>Math.hypot(t[0]*.6,t[1])-Math.hypot(e[0]*.6,e[1]))})();function Ns(a,t,e,n){return{id:a,name:t,isBot:e,cosmetic:n,alive:!0,mode:"ground",x:0,y:0,z:0,vx:0,vy:0,vz:0,yaw:0,pitch:0,onGround:!0,crouching:!1,sliding:!1,slideT:0,slideCd:0,slideDirX:0,slideDirZ:0,slideSpeed:0,stamina:1,sprintDelay:0,sprinting:!1,mantle:null,zip:null,grapple:null,knockX:0,knockZ:0,ventLaunch:!1,wingOut:!1,fallSpeed:0,health:se.maxHealth,aegis:se.maxAegis,reserve:0,lastDamage:-100,slots:new Array(hi).fill(null),selected:0,ammo:{light:0,shell:0,heavy:0,charge:0},fireCd:0,reloadT:0,reloading:!1,swapT:0,windupT:0,bloom:0,recoilP:0,recoilY:0,recoilIdx:0,sinceShot:9,shotCount:0,using:null,meleeCd:0,interactHold:0,prevInput:qn(),input:qn(),damageLog:[],stats:md(),inSmoke:0,hazardAcc:0,lastStormTick:0,spawnSocket:-1,trail:[],jumpAt:0,shoulder:1,adsT:0,swapPending:!1,dropCd:0,beaconUntil:0,hitFlash:0,lastFootstep:0,dummy:!1,homeX:0,homeZ:0}}class gd{constructor(t){this.opts=t,this.seed=t.seed,this.mode=t.mode,this.world=new Vh(t.seed,{practice:t.mode==="practice"}),this.rng=new Ze(t.seed*977+3),this.schedule=new qh(this.world,t.seed,t.mode==="quick"),this.stagingLeft=t.skipStaging?.2:t.stagingSeconds??Ya.stagingSeconds;const n=new Ze(t.seed+99).range(-330,330),i=this.world.spawnPad.x,s=this.world.spawnPad.z,r=800,o=n,l=Math.hypot(r-i,o-s);this.skiff={x:i,z:s,y:this.world.spawnPad.y,dirX:(r-i)/l,dirZ:(o-s)/l,t:0,startX:i,startZ:s,endX:r,endZ:o,speed:Ya.skiffSpeed,length:l},this.mode==="practice"?this.initPractice():this.initQuick()}world;seed;mode;contentVersion=Fh;rng;players=[];loot=new Map;chests=new Map;projectiles=[];smokes=[];capsules=[];schedule;storm=Yh();sounds=[];timeline=[];brains=new Map;events=[];phase="staging";time=0;tickN=0;stagingLeft;skiff;clock=0;stormClock=-1;winner=-1;endedAt=0;humanId=0;budget={prototypes:0};nextId=1;nextCapsule=0;capsuleTimes=[];lastPhaseAnnounced=-1;tickDeaths=[];respawnQueue=[];tmpB=[];tmpC=[];rangeStats={lastDamage:0,lastZone:"",lastDist:0};id(){return this.nextId++}initQuick(){const t=Ya.players,e=this.opts.botCount??(this.opts.noHuman?t:t-1),n=new Ze(this.seed+5);let i=0;this.opts.noHuman?this.humanId=-1:this.players.push(Ns(i++,this.opts.humanName??"You",!1,0));for(let r=0;r<e;r++){const o=Ns(i++,ul[r%ul.length],!0,r%4);this.players.push(o),this.brains.set(o.id,new pd(this,o,new Ze(this.seed*13+o.id*7919),.35+n.next()*.55))}const s=this.world.spawnPad;this.players.forEach((r,o)=>{const l=o/this.players.length;r.x=s.x-18+o%6*7+n.range(-1,1),r.z=s.z-17+Math.floor(o/6)*11+n.range(-1,1)+l*0,r.y=s.y,r.yaw=Math.atan2(this.skiff.dirX,this.skiff.dirZ),r.onGround=!0}),this.spawnLoot(),this.schedule.stages}initPractice(){const t=this.world,e=Ns(0,this.opts.humanName??"You",!1,0);e.x=0,e.z=58,e.y=4,e.yaw=Math.PI,this.players.push(e),this.phase="live",this.stagingLeft=0,[[-30,-12,0],[-14,-30,1],[0,-48,0],[16,-30,1],[34,-14,0],[-48,-50,0],[50,-60,1],[0,-72,0]].forEach(([i,s,r],o)=>{const l=Ns(o+1,`Target ${o+1}`,!0,o%4);l.dummy=!0,l.x=i,l.z=s,l.y=t.heightAt(i,s),l.homeX=i,l.homeZ=s,l.yaw=0,l.onGround=!0,l.shoulder=r?1:0,this.players.push(l)}),Br.forEach((i,s)=>{for(let r=0;r<5;r++){const o=-16+s*4,l=66+r*3.2;this.addLoot({kind:"weapon",weapon:i,rarity:r,mag:Xe(i,r).mag},o,t.heightAt(o,l)+.15,l,3,"floor",!1)}}),Gn.forEach((i,s)=>{for(let r=0;r<2;r++)this.addLoot({kind:"ammo",ammo:i,count:60},-10+s*5+r*1.5,t.heightAt(-10,52)+.15,52,3,"floor",!1)}),Object.keys(fe).forEach((i,s)=>{this.addLoot({kind:"item",item:i,count:fe[i].stack},22+s%4*2.4,t.heightAt(22,52)+.15,50+Math.floor(s/4)*3,3,"floor",!1)}),this.addChestAt(34,t.heightAt(34,46)+0,54,3,"chest","range"),this.addChestAt(38,t.heightAt(38,46)+0,54,3,"locker","range"),this.timeline.push({t:0,text:"Entered the Practice Range"})}spawnLoot(){const t=new Ze(this.seed*5+1);for(const e of this.world.sockets)e.kind==="floor"?hd(t,e.tier,e.weaponBias,this.budget).forEach((i,s)=>this.addLoot(i,e.x+(s?.7:0),e.y,e.z+(s?.4:0),e.tier,"floor",i.kind==="weapon")):this.addChestAt(e.x,e.y,e.z,e.tier,e.kind,e.loc)}addChestAt(t,e,n,i,s,r){const o=this.id();this.chests.set(o,{id:o,x:t,y:e,z:n,tier:i,kind:s,opened:!1,loc:r})}addLoot(t,e,n,i,s,r,o){const l={id:this.id(),x:e,y:n,z:i,data:t,tier:s,source:r,priority:o,age:0};return this.loot.set(l.id,l),l}getPlayer(t){return this.players[t]}get human(){return this.humanId>=0?this.players[this.humanId]:void 0}aliveCount(){let t=0;for(const e of this.players)e.alive&&!e.dummy&&t++;return t}totalCount(){let t=0;for(const e of this.players)e.dummy||t++;return t}step(t){if(this.phase!=="ended"){this.time+=ve,this.tickN++,this.phase==="staging"?(this.stagingLeft-=ve,this.stagingLeft<=0&&this.beginSkiff()):this.phase==="skiff"&&this.updateSkiff(),this.mode==="quick"&&this.phase!=="staging"&&(this.clock+=ve,this.updateStorm());for(const e of this.players)if(e.alive)if(e.prevInput=e.input,e.dummy)e.input=this.dummyInput(e);else if(e.isBot){const n=this.brains.get(e.id);e.input=n&&this.phase!=="staging"?n.think(ve):this.idleInput(e)}else{const n=t?.get(e.id);e.input=n??{...qn(),yaw:e.yaw,pitch:e.pitch}}for(const e of this.players)e.alive&&this.updatePlayer(e);this.updateProjectiles(),this.updateSmokes(),this.updateCapsules(),this.updateLoot(),this.updateRespawns(),this.pruneSounds(),this.mode==="quick"&&this.phase==="live"&&this.checkEnd(),this.tickDeaths.length=0}}idleInput(t){return{...qn(),yaw:t.yaw,pitch:t.pitch}}dummyInput(t){const e=qn();return e.yaw=t.yaw,t.shoulder===1&&t.id%2===1&&(e.moveR=Math.sin(this.time*.7+t.id)>0?.7:-.7),Math.abs(t.x-t.homeX)>8&&(e.moveR=t.homeX-t.x>0?-.8:.8),e}beginSkiff(){this.phase="skiff",this.clock=0;for(const t of this.players)t.alive&&(t.mode="skiff");this.timeline.push({t:0,text:"Skiff departed the staging pier"}),this.positionRiders()}positionRiders(){const t=this.skiff,e=-t.dirZ,n=t.dirX;for(const i of this.players){if(!i.alive||i.mode!=="skiff")continue;const s=_l[i.id%_l.length],r=s[0],o=s[1];i.x=t.x+t.dirX*r+e*o,i.z=t.z+t.dirZ*r+n*o,i.y=t.y+1.1,i.vx=t.dirX*t.speed,i.vz=t.dirZ*t.speed,i.vy=0}}updateSkiff(){const t=this.skiff;t.t+=ve,t.x=t.startX+t.dirX*t.speed*t.t,t.z=t.startZ+t.dirZ*t.speed*t.t;const e=t.speed*t.t>=t.length;this.positionRiders();for(const n of this.players){if(!n.alive||n.mode!=="skiff")continue;const i=n.input.jump&&!n.prevInput.jump,s=Math.hypot(n.x,n.z)<600;(i&&s||e)&&this.jumpFromSkiff(n)}e&&(this.phase="live",this.timeline.push({t:this.clock,text:"All players deployed"}))}jumpFromSkiff(t){t.mode==="skiff"&&(t.mode="freefall",t.vx=this.skiff.dirX*14,t.vz=this.skiff.dirZ*14,t.vy=-2,t.onGround=!1,t.jumpAt=this.clock,this.events.push({type:"jump",pid:t.id}),t.isBot||this.timeline.push({t:this.clock,text:"Jumped from the skiff"}))}updateStorm(){if(this.mode!=="quick")return;const t=25;if(this.clock<t){this.stormClock=-1,this.schedule.at(0,this.storm),this.storm.damage=0;return}this.stormClock=this.clock-t,this.schedule.at(this.stormClock,this.storm),this.storm.phase!==this.lastPhaseAnnounced&&(this.lastPhaseAnnounced=this.storm.phase,this.storm.phase>0&&(this.events.push({type:"storm",phase:this.storm.phase,msg:this.storm.label}),this.timeline.push({t:this.clock,text:this.storm.label})))}updatePlayer(t){const e=t.input,n=ve;if(t.stats.surviveTime=this.clock,t.hitFlash=Math.max(0,t.hitFlash-n),t.sinceShot+=n,t.mode==="skiff")return;this.handleSelection(t,e),e.swapShoulder&&!t.prevInput.swapShoulder&&(t.shoulder=-t.shoulder),t.adsT+=((e.ads&&!t.using&&t.mode==="ground"&&ss(t)?1:0)-t.adsT)*(1-Math.exp(-14*n));const i=Qh();let s=1;if(t.using&&(s=fe[t.using.item].slow),(t.mode==="ground"||t.mode==="swim")&&(e.deploy&&!t.prevInput.deploy&&this.tryZipOrDeploy(t),e.interact&&!t.prevInput.interact&&t.mode),td(this.world,t,e,t.prevInput,n,i,s),i.fallDamage>0&&this.damage(t,i.fallDamage,-1,"Fall","torso",!0),i.landSpeed>3&&this.events.push({type:"land",pid:t.id,speed:i.landSpeed}),i.mantled&&this.events.push({type:"mantle",pid:t.id}),i.slid&&this.events.push({type:"slide",pid:t.id}),i.jumped&&this.events.push({type:"jump",pid:t.id}),i.deployed&&this.events.push({type:"deploy",pid:t.id}),!t.alive)return;this.tickN%15===0&&(t.trail.push({x:t.x,y:t.y,z:t.z,t:this.time}),t.trail.length>24&&t.trail.shift());const r=Math.hypot(t.vx,t.vz);if(t.mode==="ground"&&t.onGround&&r>3&&this.time-t.lastFootstep>(t.sprinting?.32:.45)){t.lastFootstep=this.time;const o=t.crouching?6:t.sprinting?34:22;this.sounds.push({t:this.time,x:t.x,y:t.y,z:t.z,pid:t.id,loud:o,kind:"footstep"}),(!t.isBot||this.humanNear(t,60))&&this.events.push({type:"sound",kind:"footstep",x:t.x,y:t.y,z:t.z,pid:t.id,loud:o})}if(t.mode==="ground"&&t.onGround)for(const o of this.world.vents)Math.hypot(t.x-o.x,t.z-o.z)<o.r&&(t.mode="freefall",t.vy=o.boost,t.onGround=!1,t.ventLaunch=!0,t.wingOut=!1,this.events.push({type:"jump",pid:t.id}));this.mode==="quick"&&this.applyEnvironment(t,n),t.alive&&(this.time-t.lastDamage>=se.aegisDelay&&t.aegis<se.maxAegis&&(t.aegis=Math.min(se.maxAegis,t.aegis+10*n)),t.fireCd=Math.max(0,t.fireCd-n),t.meleeCd=Math.max(0,t.meleeCd-n),t.swapT=Math.max(0,t.swapT-n),t.dropCd=Math.max(0,t.dropCd-n),t.sinceShot>.14&&(t.recoilP*=Math.exp(-6*n),t.recoilY*=Math.exp(-6*n),t.bloom=Math.max(0,t.bloom-3*n),t.sinceShot>.35&&(t.recoilIdx=0)),(t.mode==="ground"||t.mode==="swim")&&(this.updateReload(t,n),this.updateUsing(t,n),this.updateWindup(t),this.handleActions(t,e),this.handleInteract(t,e,n),this.autoPickupAmmo(t)))}humanNear(t,e){const n=this.human;return!!n&&n.alive&&Math.hypot(n.x-t.x,n.z-t.z)<e}handleSelection(t,e){let n=-1;if(e.slot>=0&&e.slot<hi)n=e.slot;else if(e.cycle!==0)for(let i=1;i<=hi;i++){const s=(t.selected+i*e.cycle+hi*8)%hi;if(t.slots[s]){n=s;break}}if(n>=0&&n!==t.selected){t.selected=n,t.reloading=!1,t.reloadT=0,t.windupT=0,t.using&&this.cancelUse(t);const i=t.slots[n];i&&i.kind==="weapon"&&(t.swapT=Ce[i.weapon].swap),t.recoilIdx=0}}tryZipOrDeploy(t){}applyEnvironment(t,e){const n=this.storm;if((this.phase==="live"||this.phase==="skiff")&&n.damage>0&&t.mode!=="skiff"&&Math.hypot(t.x-n.cx,t.z-n.cz)>n.r){const s=n.damage*e;t.stats.stormDamage+=s,this.damage(t,s,-1,"Riftstorm","torso",!0,!0)}if(t.alive&&t.onGround&&this.world.hazards.length){const i=this.world.inHazard(t.x,t.z);i>0&&t.y-this.world.heightAt(t.x,t.z)<1&&this.damage(t,i*e,-1,"Heat channel","torso",!0,!0)}}updateReload(t,e){const n=ss(t);if(!n){t.reloading=!1;return}const i=Xe(n.weapon,n.rarity),s=t.slots[n.slot];if(!t.reloading){(t.input.reload&&!t.prevInput.reload||s.mag<=0&&t.input.fire&&t.fireCd<=0)&&s.mag<i.mag&&t.ammo[i.def.ammo]>0&&!t.using&&t.swapT<=0&&(t.reloading=!0,t.reloadT=i.reload,this.events.push({type:"reload",pid:t.id,weapon:n.weapon}));return}if(t.reloadT-=e,t.reloadT<=0){const r=i.mag-s.mag,o=Math.min(r,t.ammo[i.def.ammo]);s.mag+=o,t.ammo[i.def.ammo]-=o,t.reloading=!1}}startUse(t,e){const n=t.slots[e];if(!n||n.kind!=="item"||t.using)return!1;const i=fe[n.item];return i.useTime<=0||n.item==="medInjector"&&t.health>=se.maxHealth||n.item==="traumaKit"&&t.health>=se.maxHealth||n.item==="shieldFlask"&&t.reserve>=se.maxReserve||n.item==="aegisCell"&&t.aegis>=se.maxAegis?!1:(t.using={item:n.item,t:0,total:i.useTime,slot:e,h0:t.health},t.reloading=!1,this.events.push({type:"use",pid:t.id,item:n.item,done:!1}),!0)}cancelUse(t){t.using=null}updateUsing(t,e){const n=t.using;if(!n)return;const i=t.slots[n.slot];if(!i||i.kind!=="item"||i.item!==n.item){t.using=null;return}if(t.input.fire&&!t.prevInput.fire&&n.t>.2||t.sprinting){t.using=null;return}const s=e/n.total;switch(n.t+=e,n.item){case"medInjector":t.health=Math.min(se.maxHealth,t.health+35*s);break;case"traumaKit":t.health=Math.min(se.maxHealth,t.health+Math.max(0,se.maxHealth-n.h0)*s);break;case"shieldFlask":t.reserve=Math.min(se.maxReserve,t.reserve+25*s);break}n.t>=n.total&&(n.item==="aegisCell"&&(t.lastDamage=-100),n.item==="traumaKit"&&(t.health=se.maxHealth),i.count-=1,i.count<=0&&(t.slots[n.slot]=null),t.using=null,this.events.push({type:"use",pid:t.id,item:n.item,done:!0}))}handleActions(t,e){e.melee&&!t.prevInput.melee&&t.meleeCd<=0&&!t.using&&this.doMelee(t),e.drop&&!t.prevInput.drop&&t.dropCd<=0&&this.dropSelected(t);const n=e.fire&&!t.prevInput.fire,i=t.slots[t.selected];if(i&&i.kind==="item"){(n||e.throwItem&&!t.prevInput.throwItem)&&this.useSelectedItem(t);return}if(e.throwItem&&!t.prevInput.throwItem)for(const s of["windOrb","mistCapsule"]){const r=gs(t,s);if(r>=0){t.selected=r,this.useSelectedItem(t);return}}this.tryFire(t,e)}useSelectedItem(t){const e=t.slots[t.selected];if(!e||e.kind!=="item")return;if(fe[e.item].useTime>0){this.startUse(t,t.selected);return}let i=!1;const s=gl(t),r=Ta(this.world,t,2.4),o=this.aimPoint(t,r,60),l=ja({x:o.x-s.x,y:o.y-s.y+1.2,z:o.z-s.z});switch(e.item){case"windOrb":this.projectiles.push({id:this.id(),owner:t.id,weapon:"windOrb",x:s.x,y:s.y,z:s.z,vx:l.x*20+t.vx*.3,vy:l.y*20,vz:l.z*20+t.vz*.3,gravity:14,damage:5,splash:5.5,push:14,ttl:3,rarity:0,kind:"orb",fuse:1.6,traveled:0}),this.events.push({type:"projectile",pid:t.id,kind:"orb"}),i=!0;break;case"mistCapsule":this.projectiles.push({id:this.id(),owner:t.id,weapon:"mist",x:s.x,y:s.y,z:s.z,vx:l.x*16,vy:l.y*16,vz:l.z*16,gravity:14,damage:0,splash:0,push:0,ttl:3,rarity:0,kind:"mist",fuse:1.2,traveled:0}),this.events.push({type:"projectile",pid:t.id,kind:"mist"}),i=!0;break;case"echoBeacon":t.beaconUntil=this.time+8,this.events.push({type:"beacon",pid:t.id}),i=!0;break;case"grappleSpool":{const c=this.world.raycast(r.pos.x,r.pos.y,r.pos.z,r.dir.x,r.dir.y,r.dir.z,Mt.grappleRange+4,!0);if(c>3&&c<Mt.grappleRange+4){const h=r.pos.x+r.dir.x*c,d=r.pos.y+r.dir.y*c,u=r.pos.z+r.dir.z*c;t.grapple={x:h-r.dir.x*.9,y:d-r.dir.y*.9+.9,z:u-r.dir.z*.9,t:3},t.mode="grapple",t.onGround=!1,t.mantle=null,t.sliding=!1,this.events.push({type:"grapple",pid:t.id,x:h,y:d,z:u}),i=!0}break}}i&&(e.count-=1,e.count<=0&&(t.slots[t.selected]=null))}doMelee(t){t.meleeCd=se.meleeCooldown,this.events.push({type:"melee",pid:t.id});const e=Pn(t.yaw,0);let n=null,i=se.meleeRange;for(const s of this.players){if(s===t||!s.alive||s.mode==="skiff")continue;const r=s.x-t.x,o=s.z-t.z,l=Math.hypot(r,o);l>i||Math.abs(s.y-t.y)>1.6||(r*e.x+o*e.z)/(l||1)<.35||(n=s,i=l)}n&&this.damage(n,se.meleeDamage,t.id,"Melee","torso",!1)}dropSelected(t){const e=t.slots[t.selected];if(!e)return;const n=Pn(t.yaw,0),i=t.x+n.x*1.2,s=t.z+n.z*1.2,r=Math.max(this.world.heightAt(i,s),t.y)+.15;this.addLoot(Us(e),i,Math.min(r,t.y+.2),s,1,"drop",!1),t.slots[t.selected]=null,t.dropCd=.4,t.reloading=!1}spreadFor(t,e,n){let i=e.spread*n.spread;i+=(e.adsSpread*n.spread-i)*t.adsT,t.crouching&&(i*=.75);const s=Math.hypot(t.vx,t.vz);return s>1&&(i*=1+s*.05),t.onGround||(i*=1.8),i+t.bloom}tryFire(t,e){const n=ss(t);if(!n)return;const s=Xe(n.weapon,n.rarity).def;if(t.mode==="swim"&&s.id!=="harbor"||t.fireCd>0||t.reloading||t.swapT>0||t.using||t.windupT>0||t.mode==="mantle")return;const r=e.fire&&!t.prevInput.fire;if(!(!(s.auto?e.fire:r)||t.slots[n.slot].mag<=0)){if(t.sprinting&&(t.sprinting=!1),s.windup>0){t.windupT=s.windup;return}this.fireShot(t)}}updateWindup(t){t.windupT<=0||(t.windupT-=ve,t.windupT<=0&&ss(t)&&!t.reloading&&this.fireShot(t))}aimPoint(t,e,n){const i=e.dir;let s=this.world.raycast(e.pos.x,e.pos.y,e.pos.z,i.x,i.y,i.z,n,!0);s<0&&(s=n);for(const r of this.players){if(r===t||!r.alive||r.mode==="skiff")continue;const o=Qa(e.pos.x,e.pos.y,e.pos.z,i.x,i.y,i.z,r.x,r.z,.4,r.y,r.y+Vn(r));o&&o.t<s&&o.t>.5&&(s=o.t)}return s=Math.max(s,3),{x:e.pos.x+i.x*s,y:e.pos.y+i.y*s,z:e.pos.z+i.z*s}}fireShot(t){const e=ss(t);if(!e)return;const n=Xe(e.weapon,e.rarity),i=n.def,s=t.slots[e.slot];s.mag-=1,t.fireCd=60/n.rpm,t.stats.shots+=1,t.shotCount+=1,t.sinceShot=0;const r=new Ze((this.seed^Math.imul(t.id+1,2654435761)^Math.imul(t.shotCount,374761393))>>>0),o=i.recoil[t.recoilIdx%i.recoil.length],l=n.recoil*(1-.3*t.adsT)*(t.crouching?.85:1),c=this.spreadFor(t,i,n),h=Ta(this.world,t,i.adsBoom),d=this.aimPoint(t,h,Math.min(i.range,450)),u=gl(t);let p=ja({x:d.x-u.x,y:d.y-u.y,z:d.z-u.z});p.x*h.dir.x+p.y*h.dir.y+p.z*h.dir.z<.2&&(p=h.dir),t.recoilP=Math.min(14,t.recoilP+o[0]*l),t.recoilY=_e(t.recoilY+o[1]*l*(t.recoilIdx%2?-1:1),-6,6),t.recoilIdx+=1,t.bloom=Math.min(i.bloomMax,t.bloom+i.bloomPerShot);const g=i.kind==="hitscan"?140:110;if(this.sounds.push({t:this.time,x:t.x,y:t.y,z:t.z,pid:t.id,loud:g,kind:"gunshot"}),this.events.push({type:"sound",kind:"gunshot",x:t.x,y:t.y,z:t.z,pid:t.id,loud:g}),i.kind!=="hitscan"){const m=this.applySpread(p,c,r),y={id:this.id(),owner:t.id,weapon:i.id,x:u.x,y:u.y,z:u.z,vx:m.x*i.projSpeed,vy:m.y*i.projSpeed,vz:m.z*i.projSpeed,gravity:i.projGravity,damage:n.damage,splash:i.splash,push:i.push,ttl:i.range/i.projSpeed+1.5,rarity:e.rarity,kind:i.kind==="projectile"?"rail":"gale",fuse:0,traveled:0};this.projectiles.push(y),this.events.push({type:"projectile",pid:t.id,kind:y.kind}),this.events.push({type:"shot",pid:t.id,weapon:i.id,ox:u.x,oy:u.y,oz:u.z,tx:u.x+m.x*3,ty:u.y+m.y*3,tz:u.z+m.z*3,hit:"none"});return}const v=new Map;let f=!1;for(let m=0;m<i.pellets;m++){const y=this.applySpread(p,c,r);let S=this.world.raycast(u.x,u.y,u.z,y.x,y.y,y.z,i.range);S<0&&(S=i.range);let x=null,T=S,E=0;for(const C of this.players){if(C===t||!C.alive||C.mode==="skiff"||Math.abs(C.x-u.x)>i.range||Math.abs(C.z-u.z)>i.range)continue;const M=Vn(C),_=Qa(u.x,u.y,u.z,y.x,y.y,y.z,C.x,C.z,.38,C.y,C.y+M);_&&_.t<T&&(T=_.t,x=C,E=_.y-C.y)}const w=T;if((m<3||i.pellets===1)&&this.events.push({type:"shot",pid:t.id,weapon:i.id,ox:u.x,oy:u.y,oz:u.z,tx:u.x+y.x*w,ty:u.y+y.y*w,tz:u.z+y.z*w,hit:x?"player":S<i.range?"world":"none"}),x){f=!0;const C=Vn(x),M=E>C-.3?"head":E<C*.42?"limb":"torso",_=M==="head"?i.headMult:M==="limb"?se.limbMult:se.torsoMult,P=n.damage*ll(i,T)*_,I=v.get(x.id)??{dmg:0,head:!1,zone:"torso",dist:T,killedCheck:!1,top:0};I.dmg+=P,M==="head"&&(I.head=!0),P>I.top&&(I.top=P,I.zone=M),I.dist=T,v.set(x.id,I)}}f&&(t.stats.hits+=1);for(const[m,y]of v){let S=y.dmg;i.pelletCap>0&&(S=Math.min(S,i.pelletCap*n.rarity.damage));const x=this.players[m];y.head&&(t.stats.headshots+=1),this.damage(x,S,t.id,i.name,y.zone,!1,!1,t),this.rangeStats={lastDamage:S,lastZone:y.zone,lastDist:y.dist}}}getRangeStats(){return this.rangeStats}applySpread(t,e,n){if(e<=0)return t;const i=Math.tan(e*Math.PI/180)*Math.sqrt(n.next()),s=n.next()*Math.PI*2,r=Math.abs(t.y)>.98?{x:1,y:0,z:0}:{x:0,y:1,z:0},o=t.y*r.z-t.z*r.y,l=t.z*r.x-t.x*r.z,c=t.x*r.y-t.y*r.x,h=Math.hypot(o,l,c)||1,d={x:o/h,y:l/h,z:c/h},u={x:d.y*t.z-d.z*t.y,y:d.z*t.x-d.x*t.z,z:d.x*t.y-d.y*t.x},p=Math.cos(s)*i,g=Math.sin(s)*i;return ja({x:t.x+d.x*p+u.x*g,y:t.y+d.y*p+u.y*g,z:t.z+d.z*p+u.z*g})}damage(t,e,n,i,s,r,o=!1,l){if(!t.alive||e<=0||t.mode==="skiff")return;let c=e,h=!1;const d=t.health+t.aegis+t.reserve;if(!r){if(t.aegis>0){const v=Math.min(t.aegis,c);t.aegis-=v,c-=v,t.aegis<=.001&&v>0&&(t.aegis=0,h=!0)}if(c>0&&t.reserve>0){const v=Math.min(t.reserve,c);t.reserve-=v,c-=v}}c>0&&(t.health-=c),o?t.lastDamage=this.time:t.lastDamage=this.time;const u=Math.min(e,d);t.stats.damageTaken+=u,t.hitFlash=.25,t.using&&fe[t.using.item].cancelOnDamage&&!o&&(t.using=null),t.using&&fe[t.using.item].cancelOnDamage&&o&&(t.using=null);const p=n>=0?this.players[n]:void 0;p&&p.id!==t.id&&(t.damageLog.push({by:n,amount:u,t:this.time}),p.stats.damageDealt+=u);const g=t.health<=0;if(!o){let v=0,f=0;if(p){v=p.x-t.x,f=p.z-t.z;const m=Math.hypot(v,f)||1;v/=m,f/=m}this.events.push({type:"damage",victim:t.id,amount:u,source:i,dirX:v,dirZ:f}),p&&this.events.push({type:"hit",attacker:n,victim:t.id,amount:u,zone:s,shieldBreak:h,killed:g,weapon:i})}g&&this.kill(t,n,i)}kill(t,e,n){t.health=0,t.alive=!1,t.mode="dead",t.using=null,t.reloading=!1;const i=this.aliveCount()+(t.dummy?0:1);let s=e;const r=t.damageLog.filter(c=>this.time-c.t<=se.assistWindow);if(s<0){const c=[...r].reverse().find(h=>this.time-h.t<=8);c&&(s=c.by)}const o=new Set;for(const c of r)c.by!==s&&c.by!==t.id&&o.add(c.by);const l=s>=0?this.players[s]:void 0;l&&l.id!==t.id&&!t.dummy&&(l.stats.kills+=1),l&&t.dummy&&(l.stats.kills+=0);for(const c of o){const h=this.players[c];h&&!t.dummy&&(h.stats.assists+=1)}t.dummy||(t.stats.placement=i,t.stats.killedBy=l?l.name:n),t.stats.surviveTime=this.clock,this.events.push({type:"kill",killer:s,victim:t.id,weapon:n,assists:[...o],placement:i}),t.dummy||this.timeline.push({t:this.clock,text:l?`${l.name} eliminated ${t.name}`:`${t.name} was eliminated (${n})`}),this.dropDeathLoot(t),this.tickDeaths.push(t),t.dummy?this.respawnQueue.push({t:this.time+3.5,p:t}):this.mode==="practice"&&this.respawnQueue.push({t:this.time+1.5,p:t})}dropDeathLoot(t){const e=(l,c)=>Math.max(this.world.groundHeight(l,c,t.y+.6,.7,.3,this.tmpB,this.tmpC),this.world.waterLevel-.6)+.15;let n=0;const i=t.slots.filter(l=>l&&l.kind==="weapon");for(const l of i){if(!l)continue;const c=n/Math.max(1,i.length)*Math.PI*2+.7,h=t.x+Math.cos(c)*.9,d=t.z+Math.sin(c)*.9;this.addLoot(Us(l),h,e(h,d),d,1,"death",!0),n++}const s=[];for(const l of t.slots)l&&l.kind==="item"&&s.push({item:l.item,count:l.count});const r={};let o=s.length>0;for(const l of Gn)t.ammo[l]>0&&(r[l]=t.ammo[l],o=!0);o&&this.addLoot({kind:"cache",items:s,ammo:r,owner:t.name},t.x,e(t.x,t.z),t.z,1,"death",!0),t.slots.fill(null);for(const l of Gn)t.ammo[l]=0}updateRespawns(){for(let t=this.respawnQueue.length-1;t>=0;t--){const e=this.respawnQueue[t];if(this.time<e.t)continue;this.respawnQueue.splice(t,1);const n=e.p;n.alive=!0,n.health=se.maxHealth,n.aegis=se.maxAegis,n.reserve=0,n.mode="ground",n.damageLog.length=0,n.dummy?(n.x=n.homeX,n.z=n.homeZ,n.y=this.world.heightAt(n.x,n.z)):(n.x=0,n.z=58,n.y=4,n.yaw=Math.PI,n.vx=n.vz=n.vy=0,n.onGround=!0),n.onGround=!0}}updateLoot(){for(const t of this.loot.values())t.age+=ve}autoPickupAmmo(t){if(!(t.isBot&&this.tickN%4!==0))for(const e of this.loot.values()){if(e.data.kind!=="ammo")continue;const n=e.x-t.x,i=e.z-t.z;if(n*n+i*i>1.7*1.7||Math.abs(e.y-t.y)>2)continue;const s=vl(t,e.data.ammo,e.data.count);s>0&&(e.data.count-=s,t.stats.lootPicked.push({name:`${e.data.ammo} ammo`,rarity:0,t:this.clock}),this.events.push({type:"pickup",pid:t.id,name:`${e.data.ammo[0].toUpperCase()}${e.data.ammo.slice(1)} Ammo +${s}`,rarity:0}),e.data.count<=0&&this.loot.delete(e.id))}}focusFor(t){let e=null,n=1/0;const i=Pn(t.yaw,0),s=(r,o,l,c)=>{const h=o-t.x,d=l-t.z,u=Math.hypot(h,d);if(u>2.9||Math.abs(c-t.y)>2.4)return;const p=u>.01?(h*i.x+d*i.z)/u:1,g=u-p*.9;g<n&&(n=g,e={...r,dist:u})};for(const r of this.loot.values()){if(r.data.kind==="ammo")continue;const o=r.data.kind==="weapon"?r.data.rarity:0;s({kind:"loot",id:r.id,label:ld(r.data),rarity:o,weapon:r.data.kind==="weapon"?r.data.weapon:void 0,dist:0},r.x,r.z,r.y)}for(const r of this.chests.values())r.opened||s({kind:"chest",id:r.id,label:r.kind==="chest"?"Resonance Chest":"Supply Locker",dist:0},r.x,r.z,r.y);for(const r of this.world.ziplines)for(const o of[1,-1]){const l=o>0?r.a:r.b;o<0&&r.b.y-1.9<this.world.heightAt(r.b.x,r.b.z)+1.5||s({kind:"zipline",id:r.id,dir:o,label:`Ride ${r.name}`,dist:0},l.x,l.z,l.y-1.9)}return e}handleInteract(t,e,n){if(!e.interact){t.interactHold=0,t.swapPending=!1;return}const i=!t.prevInput.interact;if(t.interactHold+=n,i){const s=this.focusFor(t);if(!s)return;this.interactWith(t,s,!1)||(t.swapPending=!0)}else if(t.swapPending&&t.interactHold>=.45){const s=this.focusFor(t);t.swapPending=!1,s&&this.interactWith(t,s,!0)}}interactWith(t,e,n){if(e.kind==="zipline"){const r=this.world.ziplines[e.id],o=e.dir>0?r.a:r.b;return t.mode="zipline",t.zip={id:e.id,dist:0,dir:e.dir,len:Math.hypot(r.b.x-r.a.x,r.b.y-r.a.y,r.b.z-r.a.z)},t.x=o.x,t.y=o.y-1.9,t.z=o.z,t.onGround=!1,t.vx=t.vy=t.vz=0,t.using=null,t.reloading=!1,!0}if(e.kind==="chest"){const r=this.chests.get(e.id);if(!r||r.opened)return!0;r.opened=!0;const o=new Ze(this.seed*31+e.id*7>>>0),l=r.kind==="chest"?dd(o,r.tier,this.budget):ud(o);return l.forEach((c,h)=>{const d=h/l.length*Math.PI*2+.4;this.addLoot(c,r.x+Math.cos(d)*1.25,r.y+.15,r.z+Math.sin(d)*1.25,r.tier,r.kind==="chest"?"chest":"locker",c.kind==="weapon")}),this.events.push({type:"chest",pid:t.id,id:r.id,x:r.x,y:r.y,z:r.z}),!0}const i=this.loot.get(e.id);if(!i)return!0;const s=i.data;if(s.kind==="weapon"){let r=od(t,s.weapon,s.rarity,s.mag);if(r<0){if(!n)return!1;const o=t.slots[t.selected];o&&this.addLoot(Us(o),t.x+.9,t.y+.15,t.z+.2,1,"drop",!1),t.slots[t.selected]={kind:"weapon",weapon:s.weapon,rarity:s.rarity,mag:s.mag},r=t.selected}return this.loot.delete(i.id),t.reloading=!1,t.stats.lootPicked.push({name:Ce[s.weapon].name,rarity:s.rarity,t:this.clock}),this.events.push({type:"pickup",pid:t.id,name:Ce[s.weapon].name,rarity:s.rarity}),t.slots[t.selected]===null&&(t.selected=r),!0}if(s.kind==="item"){const r=xl(t,s.item,s.count);if(r<=0){if(!n)return this.events.push({type:"full",pid:t.id}),!1;const o=t.slots[t.selected];return o&&this.addLoot(Us(o),t.x+.9,t.y+.15,t.z+.2,1,"drop",!1),t.slots[t.selected]={kind:"item",item:s.item,count:s.count},this.loot.delete(i.id),!0}return s.count-=r,s.count<=0&&this.loot.delete(i.id),t.stats.lootPicked.push({name:fe[s.item].name,rarity:0,t:this.clock}),this.events.push({type:"pickup",pid:t.id,name:`${fe[s.item].name}${r>1?` x${r}`:""}`,rarity:0}),!0}if(s.kind==="cache"){let r=!1;s.items=s.items.filter(l=>{const c=xl(t,l.item,l.count);return c>0&&(r=!0,this.events.push({type:"pickup",pid:t.id,name:`${fe[l.item].name}${c>1?` x${c}`:""}`,rarity:0})),l.count-=c,l.count>0});for(const l of Gn){const c=s.ammo[l]??0;if(c>0){const h=vl(t,l,c);h>0&&(r=!0,this.events.push({type:"pickup",pid:t.id,name:`${l[0].toUpperCase()}${l.slice(1)} Ammo +${h}`,rarity:0})),s.ammo[l]=c-h}}return s.items.length===0&&Gn.every(l=>(s.ammo[l]??0)<=0)&&this.loot.delete(i.id),r||this.events.push({type:"full",pid:t.id}),!0}return!0}updateProjectiles(){for(let t=this.projectiles.length-1;t>=0;t--){const e=this.projectiles[t],n=e.x,i=e.y,s=e.z;e.vy-=e.gravity*ve,e.x+=e.vx*ve,e.y+=e.vy*ve,e.z+=e.vz*ve,e.ttl-=ve,e.fuse>0&&(e.fuse-=ve);const r=e.x-n,o=e.y-i,l=e.z-s,c=Math.hypot(r,o,l)||.001,h={x:r/c,y:o/c,z:l/c};e.traveled+=c;let d=this.world.raycast(n,i,s,h.x,h.y,h.z,c),u=null,p=c+1,g=0;for(const f of this.players){if(!f.alive||f.mode==="skiff"||f.id===e.owner&&(e.kind==="rail"||e.traveled<3))continue;const m=Qa(n,i,s,h.x,h.y,h.z,f.x,f.z,.4,f.y,f.y+Vn(f));m&&m.t<=c&&m.t<p&&(p=m.t,u=f,g=m.y-f.y)}let v=!1;if(e.kind==="rail"){if(u&&(d<0||p<d)){const f=this.players[e.owner],m=Ce.longwake,y=Vn(u),S=g>y-.3?"head":g<y*.42?"limb":"torso",x=S==="head"?m.headMult:S==="limb"?se.limbMult:1,T=e.damage*ll(m,e.traveled)*x;f&&(f.stats.hits+=1,S==="head"&&(f.stats.headshots+=1)),this.damage(u,T,e.owner,m.name,S,!1,!1,f),this.rangeStats={lastDamage:T,lastZone:S,lastDist:e.traveled},this.projectiles.splice(t,1);continue}(d>=0||e.ttl<=0)&&this.projectiles.splice(t,1);continue}if(u&&(d<0||p<d)?(d=p,v=!0):d>=0&&(v=!0),e.ttl<=0&&(v=!0),e.kind!=="gale"&&e.fuse<=0&&(v=!0),v){const f=d>=0?Math.max(0,d-.05):c,m=n+h.x*f,y=i+h.y*f,S=s+h.z*f;if(this.projectiles.splice(t,1),e.kind==="mist"){const x={id:this.id(),x:m,y,z:S,r:5.5,t:0,life:9};this.smokes.push(x),this.events.push({type:"smoke",x:m,y,z:S,r:x.r})}else this.explode(m,y,S,e)}}}explode(t,e,n,i){this.events.push({type:"explosion",x:t,y:e,z:n,r:i.splash,kind:i.kind==="gale"?"gale":"orb"}),this.sounds.push({t:this.time,x:t,y:e,z:n,pid:i.owner,loud:90,kind:"gunshot"});for(const s of this.players){if(!s.alive||s.mode==="skiff")continue;const r=s.y+.9,o=Math.hypot(s.x-t,r-e,s.z-n);if(o>i.splash)continue;const l=1-o/i.splash;let c=i.damage*l;s.id===i.owner&&(c=i.kind==="gale"?1:0);const h=s.x-t,d=s.z-n,u=Math.hypot(h,d)||1,p=i.push*(.45+.55*l);s.knockX+=h/u*p,s.knockZ+=d/u*p,(s.mode==="ground"||s.mode==="swim")&&(s.vy=Math.max(s.vy,p*.45),s.onGround=!1,s.mode="ground",s.sliding=!1),c>0&&this.damage(s,c,i.owner,i.kind==="gale"?"Gale Launcher":"Wind Orb","torso",!1)}}updateSmokes(){for(let t=this.smokes.length-1;t>=0;t--)this.smokes[t].t+=ve,this.smokes[t].t>this.smokes[t].life&&this.smokes.splice(t,1)}lineThroughSmoke(t,e){for(const n of this.smokes){const i=e.x-t.x,s=e.z-t.z,r=i*i+s*s||1,o=_e(((n.x-t.x)*i+(n.z-t.z)*s)/r,0,1),l=t.x+i*o,c=t.z+s*o;if(Math.hypot(l-n.x,c-n.z)<n.r*.85)return!0}return!1}updateCapsules(){if(this.mode==="quick"){if(this.capsuleTimes.length===0)for(const t of[4,6,7]){const e=this.schedule.stages.find(n=>n.phase===t);e&&this.capsuleTimes.push(e.start+5)}if(this.nextCapsule<this.capsuleTimes.length&&this.stormClock>=this.capsuleTimes[this.nextCapsule]){this.nextCapsule++;const t=new Ze(this.seed*17+this.nextCapsule*131);for(let e=0;e<40;e++){const n=t.range(0,Math.PI*2),i=t.range(0,this.storm.r*.6),s=this.storm.cx+Math.cos(n)*i,r=this.storm.cz+Math.sin(n)*i;if(this.world.heightAt(s,r)>2&&this.world.slopeAt(s,r)<.35){const o=this.world.groundHeight(s,r,this.world.heightAt(s,r)+.1,.1,1.2,this.tmpB,this.tmpC);if(o>this.world.heightAt(s,r)+.5)continue;this.capsules.push({id:this.id(),x:s,z:r,y:o+260,landed:!1,opened:!1,t:0}),this.events.push({type:"capsule",x:s,z:r,stage:"incoming"}),this.timeline.push({t:this.clock,text:"Supply capsule inbound"});break}}}for(const t of this.capsules){if(t.landed)continue;const e=this.world.heightAt(t.x,t.z);if(t.y-=16*ve,t.y<=e){t.y=e,t.landed=!0,this.events.push({type:"capsule",x:t.x,z:t.z,stage:"landed"});const n=new Ze(this.seed*23+t.id),i=fd(n,this.budget);i.forEach((s,r)=>{const o=r/i.length*Math.PI*2;this.addLoot(s,t.x+Math.cos(o)*1.8,e+.15,t.z+Math.sin(o)*1.8,5,"capsule",!0)}),t.opened=!0}}}}checkEnd(){const t=this.players.filter(n=>n.alive&&!n.dummy);if(t.length>1){this.clock>40*60&&this.finish(t.sort((n,i)=>i.health-n.health||n.id-i.id)[0]);return}let e=t[0];if(!e){const n=[...this.tickDeaths].filter(i=>!i.dummy).sort((i,s)=>s.stats.kills-i.stats.kills||s.stats.damageDealt-i.stats.damageDealt||i.id-s.id);e=n[0],e&&(e.stats.placement=1,n.slice(1).forEach((i,s)=>{i.stats.placement=2+s}))}e&&this.finish(e)}finish(t){this.winner=t.id,t.stats.placement=1,t.stats.surviveTime=this.clock,this.phase="ended",this.endedAt=this.time,this.events.push({type:"end",winner:t.id}),this.timeline.push({t:this.clock,text:`${t.name} won the match`})}pruneSounds(){for(;this.sounds.length&&this.time-this.sounds[0].t>3;)this.sounds.shift()}drainEvents(){const t=this.events;return this.events=[],t}beaconTrails(t){if(this.time>t.beaconUntil)return[];const e=[];for(const n of this.players)if(!(n===t||!n.alive||n.mode==="skiff")&&!(Math.hypot(n.x-t.x,n.z-t.z)>80))for(const i of n.trail)e.push({x:i.x,z:i.z,age:this.time-i.t});return e}digest(){let t=2166136261;const e=n=>{t^=Math.round(n*100)|0,t=Math.imul(t,16777619)>>>0};for(const n of this.players)e(n.x),e(n.y),e(n.z),e(n.health),e(n.alive?1:0);return e(this.tickN),t.toString(16)}}/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Uo="170",vd=0,Ml=1,xd=2,Wc=1,Xc=2,An=3,jn=0,Be=1,we=2,$n=0,pi=1,di=2,Sl=3,wl=4,yd=5,li=100,_d=101,Md=102,Sd=103,wd=104,bd=200,Ed=201,Td=202,Ad=203,Vr=204,Wr=205,Cd=206,Rd=207,Pd=208,Ld=209,Id=210,Dd=211,kd=212,zd=213,Ud=214,Xr=0,qr=1,$r=2,Wi=3,Yr=4,Zr=5,jr=6,Kr=7,Fa=0,Nd=1,Fd=2,Yn=0,Od=1,Bd=2,Hd=3,qc=4,Gd=5,Vd=6,Wd=7,$c=300,Xi=301,qi=302,Jr=303,Qr=304,Oa=306,Ca=1e3,ui=1001,to=1002,Je=1003,Xd=1004,Fs=1005,dn=1006,tr=1007,Xn=1008,In=1009,Yc=1010,Zc=1011,Es=1012,No=1013,mi=1014,vn=1015,Cs=1016,Fo=1017,Oo=1018,$i=1020,jc=35902,Kc=1021,Jc=1022,sn=1023,Qc=1024,th=1025,Hi=1026,Yi=1027,Bo=1028,Ho=1029,eh=1030,Go=1031,Vo=1033,xa=33776,ya=33777,_a=33778,Ma=33779,eo=35840,no=35841,io=35842,so=35843,ao=36196,ro=37492,oo=37496,lo=37808,co=37809,ho=37810,uo=37811,fo=37812,po=37813,mo=37814,go=37815,vo=37816,xo=37817,yo=37818,_o=37819,Mo=37820,So=37821,Sa=36492,wo=36494,bo=36495,nh=36283,Eo=36284,To=36285,Ao=36286,qd=3200,$d=3201,Wo=0,Yd=1,Wn="",je="srgb",ji="srgb-linear",Ba="linear",ae="srgb",_i=7680,bl=519,Zd=512,jd=513,Kd=514,ih=515,Jd=516,Qd=517,tu=518,eu=519,Co=35044,El="300 es",Rn=2e3,Ra=2001;class Ki{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;const n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;const i=this._listeners[t];if(i!==void 0){const s=i.indexOf(e);s!==-1&&i.splice(s,1)}}dispatchEvent(t){if(this._listeners===void 0)return;const n=this._listeners[t.type];if(n!==void 0){t.target=this;const i=n.slice(0);for(let s=0,r=i.length;s<r;s++)i[s].call(this,t);t.target=null}}}const Ie=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],er=Math.PI/180,Ro=180/Math.PI;function Zn(){const a=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ie[a&255]+Ie[a>>8&255]+Ie[a>>16&255]+Ie[a>>24&255]+"-"+Ie[t&255]+Ie[t>>8&255]+"-"+Ie[t>>16&15|64]+Ie[t>>24&255]+"-"+Ie[e&63|128]+Ie[e>>8&255]+"-"+Ie[e>>16&255]+Ie[e>>24&255]+Ie[n&255]+Ie[n>>8&255]+Ie[n>>16&255]+Ie[n>>24&255]).toLowerCase()}function Pe(a,t,e){return Math.max(t,Math.min(e,a))}function nu(a,t){return(a%t+t)%t}function nr(a,t,e){return(1-e)*a+e*t}function gn(a,t){switch(t.constructor){case Float32Array:return a;case Uint32Array:return a/4294967295;case Uint16Array:return a/65535;case Uint8Array:return a/255;case Int32Array:return Math.max(a/2147483647,-1);case Int16Array:return Math.max(a/32767,-1);case Int8Array:return Math.max(a/127,-1);default:throw new Error("Invalid component type.")}}function re(a,t){switch(t.constructor){case Float32Array:return a;case Uint32Array:return Math.round(a*4294967295);case Uint16Array:return Math.round(a*65535);case Uint8Array:return Math.round(a*255);case Int32Array:return Math.round(a*2147483647);case Int16Array:return Math.round(a*32767);case Int8Array:return Math.round(a*127);default:throw new Error("Invalid component type.")}}class dt{constructor(t=0,e=0){dt.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,i=t.elements;return this.x=i[0]*e+i[3]*n+i[6],this.y=i[1]*e+i[4]*n+i[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Pe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),i=Math.sin(e),s=this.x-t.x,r=this.y-t.y;return this.x=s*n-r*i+t.x,this.y=s*i+r*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Bt{constructor(t,e,n,i,s,r,o,l,c){Bt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,r,o,l,c)}set(t,e,n,i,s,r,o,l,c){const h=this.elements;return h[0]=t,h[1]=i,h[2]=o,h[3]=e,h[4]=s,h[5]=l,h[6]=n,h[7]=r,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,r=n[0],o=n[3],l=n[6],c=n[1],h=n[4],d=n[7],u=n[2],p=n[5],g=n[8],v=i[0],f=i[3],m=i[6],y=i[1],S=i[4],x=i[7],T=i[2],E=i[5],w=i[8];return s[0]=r*v+o*y+l*T,s[3]=r*f+o*S+l*E,s[6]=r*m+o*x+l*w,s[1]=c*v+h*y+d*T,s[4]=c*f+h*S+d*E,s[7]=c*m+h*x+d*w,s[2]=u*v+p*y+g*T,s[5]=u*f+p*S+g*E,s[8]=u*m+p*x+g*w,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*r*h-e*o*c-n*s*h+n*o*l+i*s*c-i*r*l}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=h*r-o*c,u=o*l-h*s,p=c*s-r*l,g=e*d+n*u+i*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/g;return t[0]=d*v,t[1]=(i*c-h*n)*v,t[2]=(o*n-i*r)*v,t[3]=u*v,t[4]=(h*e-i*l)*v,t[5]=(i*s-o*e)*v,t[6]=p*v,t[7]=(n*l-c*e)*v,t[8]=(r*e-n*s)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,i,s,r,o){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*r+c*o)+r+t,-i*c,i*l,-i*(-c*r+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(ir.makeScale(t,e)),this}rotate(t){return this.premultiply(ir.makeRotation(-t)),this}translate(t,e){return this.premultiply(ir.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<9;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}}const ir=new Bt;function sh(a){for(let t=a.length-1;t>=0;--t)if(a[t]>=65535)return!0;return!1}function Pa(a){return document.createElementNS("http://www.w3.org/1999/xhtml",a)}function iu(){const a=Pa("canvas");return a.style.display="block",a}const Tl={};function vs(a){a in Tl||(Tl[a]=!0,console.warn(a))}function su(a,t,e){return new Promise(function(n,i){function s(){switch(a.clientWaitSync(t,a.SYNC_FLUSH_COMMANDS_BIT,0)){case a.WAIT_FAILED:i();break;case a.TIMEOUT_EXPIRED:setTimeout(s,e);break;default:n()}}setTimeout(s,e)})}function au(a){const t=a.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function ru(a){const t=a.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}const Zt={enabled:!0,workingColorSpace:ji,spaces:{},convert:function(a,t,e){return this.enabled===!1||t===e||!t||!e||(this.spaces[t].transfer===ae&&(a.r=Ln(a.r),a.g=Ln(a.g),a.b=Ln(a.b)),this.spaces[t].primaries!==this.spaces[e].primaries&&(a.applyMatrix3(this.spaces[t].toXYZ),a.applyMatrix3(this.spaces[e].fromXYZ)),this.spaces[e].transfer===ae&&(a.r=Gi(a.r),a.g=Gi(a.g),a.b=Gi(a.b))),a},fromWorkingColorSpace:function(a,t){return this.convert(a,this.workingColorSpace,t)},toWorkingColorSpace:function(a,t){return this.convert(a,t,this.workingColorSpace)},getPrimaries:function(a){return this.spaces[a].primaries},getTransfer:function(a){return a===Wn?Ba:this.spaces[a].transfer},getLuminanceCoefficients:function(a,t=this.workingColorSpace){return a.fromArray(this.spaces[t].luminanceCoefficients)},define:function(a){Object.assign(this.spaces,a)},_getMatrix:function(a,t,e){return a.copy(this.spaces[t].toXYZ).multiply(this.spaces[e].fromXYZ)},_getDrawingBufferColorSpace:function(a){return this.spaces[a].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(a=this.workingColorSpace){return this.spaces[a].workingColorSpaceConfig.unpackColorSpace}};function Ln(a){return a<.04045?a*.0773993808:Math.pow(a*.9478672986+.0521327014,2.4)}function Gi(a){return a<.0031308?a*12.92:1.055*Math.pow(a,.41666)-.055}const Al=[.64,.33,.3,.6,.15,.06],Cl=[.2126,.7152,.0722],Rl=[.3127,.329],Pl=new Bt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Ll=new Bt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);Zt.define({[ji]:{primaries:Al,whitePoint:Rl,transfer:Ba,toXYZ:Pl,fromXYZ:Ll,luminanceCoefficients:Cl,workingColorSpaceConfig:{unpackColorSpace:je},outputColorSpaceConfig:{drawingBufferColorSpace:je}},[je]:{primaries:Al,whitePoint:Rl,transfer:ae,toXYZ:Pl,fromXYZ:Ll,luminanceCoefficients:Cl,outputColorSpaceConfig:{drawingBufferColorSpace:je}}});let Mi;class ou{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Mi===void 0&&(Mi=Pa("canvas")),Mi.width=t.width,Mi.height=t.height;const n=Mi.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Mi}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Pa("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const i=n.getImageData(0,0,t.width,t.height),s=i.data;for(let r=0;r<s.length;r++)s[r]=Ln(s[r]/255)*255;return n.putImageData(i,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Ln(e[n]/255)*255):e[n]=Ln(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let lu=0;class ah{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:lu++}),this.uuid=Zn(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let r=0,o=i.length;r<o;r++)i[r].isDataTexture?s.push(sr(i[r].image)):s.push(sr(i[r]))}else s=sr(i);n.url=s}return e||(t.images[this.uuid]=n),n}}function sr(a){return typeof HTMLImageElement<"u"&&a instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&a instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&a instanceof ImageBitmap?ou.getDataURL(a):a.data?{data:Array.from(a.data),width:a.width,height:a.height,type:a.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let cu=0;class ke extends Ki{constructor(t=ke.DEFAULT_IMAGE,e=ke.DEFAULT_MAPPING,n=ui,i=ui,s=dn,r=Xn,o=sn,l=In,c=ke.DEFAULT_ANISOTROPY,h=Wn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:cu++}),this.uuid=Zn(),this.name="",this.source=new ah(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=r,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new dt(0,0),this.repeat=new dt(1,1),this.center=new dt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Bt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==$c)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ca:t.x=t.x-Math.floor(t.x);break;case ui:t.x=t.x<0?0:1;break;case to:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ca:t.y=t.y-Math.floor(t.y);break;case ui:t.y=t.y<0?0:1;break;case to:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}ke.DEFAULT_IMAGE=null;ke.DEFAULT_MAPPING=$c;ke.DEFAULT_ANISOTROPY=1;class me{constructor(t=0,e=0,n=0,i=1){me.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=i}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,i){return this.x=t,this.y=e,this.z=n,this.w=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=this.w,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*i+r[12]*s,this.y=r[1]*e+r[5]*n+r[9]*i+r[13]*s,this.z=r[2]*e+r[6]*n+r[10]*i+r[14]*s,this.w=r[3]*e+r[7]*n+r[11]*i+r[15]*s,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,i,s;const l=t.elements,c=l[0],h=l[4],d=l[8],u=l[1],p=l[5],g=l[9],v=l[2],f=l[6],m=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-v)<.01&&Math.abs(g-f)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+v)<.1&&Math.abs(g+f)<.1&&Math.abs(c+p+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const S=(c+1)/2,x=(p+1)/2,T=(m+1)/2,E=(h+u)/4,w=(d+v)/4,C=(g+f)/4;return S>x&&S>T?S<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(S),i=E/n,s=w/n):x>T?x<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(x),n=E/i,s=C/i):T<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(T),n=w/s,i=C/s),this.set(n,i,s,e),this}let y=Math.sqrt((f-g)*(f-g)+(d-v)*(d-v)+(u-h)*(u-h));return Math.abs(y)<.001&&(y=1),this.x=(f-g)/y,this.y=(d-v)/y,this.z=(u-h)/y,this.w=Math.acos((c+p+m-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class hu extends Ki{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new me(0,0,t,e),this.scissorTest=!1,this.viewport=new me(0,0,t,e);const i={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:dn,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);const s=new ke(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);s.flipY=!1,s.generateMipmaps=n.generateMipmaps,s.internalFormat=n.internalFormat,this.textures=[];const r=n.count;for(let o=0;o<r;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let i=0,s=this.textures.length;i<s;i++)this.textures[i].image.width=t,this.textures[i].image.height=e,this.textures[i].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;const e=Object.assign({},t.texture.image);return this.texture.source=new ah(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class gi extends hu{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class rh extends ke{constructor(t=null,e=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Je,this.minFilter=Je,this.wrapR=ui,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class du extends ke{constructor(t=null,e=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:i},this.magFilter=Je,this.minFilter=Je,this.wrapR=ui,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ji{constructor(t=0,e=0,n=0,i=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=i}static slerpFlat(t,e,n,i,s,r,o){let l=n[i+0],c=n[i+1],h=n[i+2],d=n[i+3];const u=s[r+0],p=s[r+1],g=s[r+2],v=s[r+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d;return}if(o===1){t[e+0]=u,t[e+1]=p,t[e+2]=g,t[e+3]=v;return}if(d!==v||l!==u||c!==p||h!==g){let f=1-o;const m=l*u+c*p+h*g+d*v,y=m>=0?1:-1,S=1-m*m;if(S>Number.EPSILON){const T=Math.sqrt(S),E=Math.atan2(T,m*y);f=Math.sin(f*E)/T,o=Math.sin(o*E)/T}const x=o*y;if(l=l*f+u*x,c=c*f+p*x,h=h*f+g*x,d=d*f+v*x,f===1-o){const T=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=T,c*=T,h*=T,d*=T}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,i,s,r){const o=n[i],l=n[i+1],c=n[i+2],h=n[i+3],d=s[r],u=s[r+1],p=s[r+2],g=s[r+3];return t[e]=o*g+h*d+l*p-c*u,t[e+1]=l*g+h*u+c*d-o*p,t[e+2]=c*g+h*p+o*u-l*d,t[e+3]=h*g-o*d-l*u-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,i){return this._x=t,this._y=e,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,i=t._y,s=t._z,r=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(i/2),d=o(s/2),u=l(n/2),p=l(i/2),g=l(s/2);switch(r){case"XYZ":this._x=u*h*d+c*p*g,this._y=c*p*d-u*h*g,this._z=c*h*g+u*p*d,this._w=c*h*d-u*p*g;break;case"YXZ":this._x=u*h*d+c*p*g,this._y=c*p*d-u*h*g,this._z=c*h*g-u*p*d,this._w=c*h*d+u*p*g;break;case"ZXY":this._x=u*h*d-c*p*g,this._y=c*p*d+u*h*g,this._z=c*h*g+u*p*d,this._w=c*h*d-u*p*g;break;case"ZYX":this._x=u*h*d-c*p*g,this._y=c*p*d+u*h*g,this._z=c*h*g-u*p*d,this._w=c*h*d+u*p*g;break;case"YZX":this._x=u*h*d+c*p*g,this._y=c*p*d+u*h*g,this._z=c*h*g-u*p*d,this._w=c*h*d-u*p*g;break;case"XZY":this._x=u*h*d-c*p*g,this._y=c*p*d-u*h*g,this._z=c*h*g+u*p*d,this._w=c*h*d+u*p*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+r)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,i=Math.sin(n);return this._x=t.x*i,this._y=t.y*i,this._z=t.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],i=e[4],s=e[8],r=e[1],o=e[5],l=e[9],c=e[2],h=e[6],d=e[10],u=n+o+d;if(u>0){const p=.5/Math.sqrt(u+1);this._w=.25/p,this._x=(h-l)*p,this._y=(s-c)*p,this._z=(r-i)*p}else if(n>o&&n>d){const p=2*Math.sqrt(1+n-o-d);this._w=(h-l)/p,this._x=.25*p,this._y=(i+r)/p,this._z=(s+c)/p}else if(o>d){const p=2*Math.sqrt(1+o-n-d);this._w=(s-c)/p,this._x=(i+r)/p,this._y=.25*p,this._z=(l+h)/p}else{const p=2*Math.sqrt(1+d-n-o);this._w=(r-i)/p,this._x=(s+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Pe(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const i=Math.min(1,e/n);return this.slerp(t,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,i=t._y,s=t._z,r=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+r*o+i*c-s*l,this._y=i*h+r*l+s*o-n*c,this._z=s*h+r*c+n*l-i*o,this._w=r*h-n*o-i*l-s*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);const n=this._x,i=this._y,s=this._z,r=this._w;let o=r*t._w+n*t._x+i*t._y+s*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=r,this._x=n,this._y=i,this._z=s,this;const l=1-o*o;if(l<=Number.EPSILON){const p=1-e;return this._w=p*r+e*this._w,this._x=p*n+e*this._x,this._y=p*i+e*this._y,this._z=p*s+e*this._z,this.normalize(),this}const c=Math.sqrt(l),h=Math.atan2(c,o),d=Math.sin((1-e)*h)/c,u=Math.sin(e*h)/c;return this._w=r*d+this._w*u,this._x=n*d+this._x*u,this._y=i*d+this._y*u,this._z=s*d+this._z*u,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),i=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(i*Math.sin(t),i*Math.cos(t),s*Math.sin(e),s*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class L{constructor(t=0,e=0,n=0){L.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Il.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Il.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6]*i,this.y=s[1]*e+s[4]*n+s[7]*i,this.z=s[2]*e+s[5]*n+s[8]*i,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,i=this.z,s=t.elements,r=1/(s[3]*e+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*e+s[4]*n+s[8]*i+s[12])*r,this.y=(s[1]*e+s[5]*n+s[9]*i+s[13])*r,this.z=(s[2]*e+s[6]*n+s[10]*i+s[14])*r,this}applyQuaternion(t){const e=this.x,n=this.y,i=this.z,s=t.x,r=t.y,o=t.z,l=t.w,c=2*(r*i-o*n),h=2*(o*e-s*i),d=2*(s*n-r*e);return this.x=e+l*c+r*d-o*h,this.y=n+l*h+o*c-s*d,this.z=i+l*d+s*h-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,i=this.z,s=t.elements;return this.x=s[0]*e+s[4]*n+s[8]*i,this.y=s[1]*e+s[5]*n+s[9]*i,this.z=s[2]*e+s[6]*n+s[10]*i,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,i=t.y,s=t.z,r=e.x,o=e.y,l=e.z;return this.x=i*l-s*o,this.y=s*r-n*l,this.z=n*o-i*r,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return ar.copy(this).projectOnVector(t),this.sub(ar)}reflect(t){return this.sub(ar.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Pe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,i=this.z-t.z;return e*e+n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const i=Math.sin(e)*t;return this.x=i*Math.sin(n),this.y=Math.cos(e)*t,this.z=i*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),i=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=i,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const ar=new L,Il=new Ji;class vi{constructor(t=new L(1/0,1/0,1/0),e=new L(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(ln.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(ln.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=ln.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const s=n.getAttribute("position");if(e===!0&&s!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=s.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,ln):ln.fromBufferAttribute(s,r),ln.applyMatrix4(t.matrixWorld),this.expandByPoint(ln);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Os.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Os.copy(n.boundingBox)),Os.applyMatrix4(t.matrixWorld),this.union(Os)}const i=t.children;for(let s=0,r=i.length;s<r;s++)this.expandByObject(i[s],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,ln),ln.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(as),Bs.subVectors(this.max,as),Si.subVectors(t.a,as),wi.subVectors(t.b,as),bi.subVectors(t.c,as),Un.subVectors(wi,Si),Nn.subVectors(bi,wi),ti.subVectors(Si,bi);let e=[0,-Un.z,Un.y,0,-Nn.z,Nn.y,0,-ti.z,ti.y,Un.z,0,-Un.x,Nn.z,0,-Nn.x,ti.z,0,-ti.x,-Un.y,Un.x,0,-Nn.y,Nn.x,0,-ti.y,ti.x,0];return!rr(e,Si,wi,bi,Bs)||(e=[1,0,0,0,1,0,0,0,1],!rr(e,Si,wi,bi,Bs))?!1:(Hs.crossVectors(Un,Nn),e=[Hs.x,Hs.y,Hs.z],rr(e,Si,wi,bi,Bs))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,ln).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(ln).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Sn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Sn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Sn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Sn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Sn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Sn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Sn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Sn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Sn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}const Sn=[new L,new L,new L,new L,new L,new L,new L,new L],ln=new L,Os=new vi,Si=new L,wi=new L,bi=new L,Un=new L,Nn=new L,ti=new L,as=new L,Bs=new L,Hs=new L,ei=new L;function rr(a,t,e,n,i){for(let s=0,r=a.length-3;s<=r;s+=3){ei.fromArray(a,s);const o=i.x*Math.abs(ei.x)+i.y*Math.abs(ei.y)+i.z*Math.abs(ei.z),l=t.dot(ei),c=e.dot(ei),h=n.dot(ei);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const uu=new vi,rs=new L,or=new L;class xi{constructor(t=new L,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):uu.setFromPoints(t).getCenter(n);let i=0;for(let s=0,r=t.length;s<r;s++)i=Math.max(i,n.distanceToSquared(t[s]));return this.radius=Math.sqrt(i),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;rs.subVectors(t,this.center);const e=rs.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),i=(n-this.radius)*.5;this.center.addScaledVector(rs,i/n),this.radius+=i}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(or.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(rs.copy(t.center).add(or)),this.expandByPoint(rs.copy(t.center).sub(or))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}}const wn=new L,lr=new L,Gs=new L,Fn=new L,cr=new L,Vs=new L,hr=new L;class Xo{constructor(t=new L,e=new L(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,wn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=wn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(wn.copy(this.origin).addScaledVector(this.direction,e),wn.distanceToSquared(t))}distanceSqToSegment(t,e,n,i){lr.copy(t).add(e).multiplyScalar(.5),Gs.copy(e).sub(t).normalize(),Fn.copy(this.origin).sub(lr);const s=t.distanceTo(e)*.5,r=-this.direction.dot(Gs),o=Fn.dot(this.direction),l=-Fn.dot(Gs),c=Fn.lengthSq(),h=Math.abs(1-r*r);let d,u,p,g;if(h>0)if(d=r*l-o,u=r*o-l,g=s*h,d>=0)if(u>=-g)if(u<=g){const v=1/h;d*=v,u*=v,p=d*(d+r*u+2*o)+u*(r*d+u+2*l)+c}else u=s,d=Math.max(0,-(r*u+o)),p=-d*d+u*(u+2*l)+c;else u=-s,d=Math.max(0,-(r*u+o)),p=-d*d+u*(u+2*l)+c;else u<=-g?(d=Math.max(0,-(-r*s+o)),u=d>0?-s:Math.min(Math.max(-s,-l),s),p=-d*d+u*(u+2*l)+c):u<=g?(d=0,u=Math.min(Math.max(-s,-l),s),p=u*(u+2*l)+c):(d=Math.max(0,-(r*s+o)),u=d>0?s:Math.min(Math.max(-s,-l),s),p=-d*d+u*(u+2*l)+c);else u=r>0?-s:s,d=Math.max(0,-(r*u+o)),p=-d*d+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),i&&i.copy(lr).addScaledVector(Gs,u),p}intersectSphere(t,e){wn.subVectors(t.center,this.origin);const n=wn.dot(this.direction),i=wn.dot(wn)-n*n,s=t.radius*t.radius;if(i>s)return null;const r=Math.sqrt(s-i),o=n-r,l=n+r;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,i,s,r,o,l;const c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(n=(t.min.x-u.x)*c,i=(t.max.x-u.x)*c):(n=(t.max.x-u.x)*c,i=(t.min.x-u.x)*c),h>=0?(s=(t.min.y-u.y)*h,r=(t.max.y-u.y)*h):(s=(t.max.y-u.y)*h,r=(t.min.y-u.y)*h),n>r||s>i||((s>n||isNaN(n))&&(n=s),(r<i||isNaN(i))&&(i=r),d>=0?(o=(t.min.z-u.z)*d,l=(t.max.z-u.z)*d):(o=(t.max.z-u.z)*d,l=(t.min.z-u.z)*d),n>l||o>i)||((o>n||n!==n)&&(n=o),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,e)}intersectsBox(t){return this.intersectBox(t,wn)!==null}intersectTriangle(t,e,n,i,s){cr.subVectors(e,t),Vs.subVectors(n,t),hr.crossVectors(cr,Vs);let r=this.direction.dot(hr),o;if(r>0){if(i)return null;o=1}else if(r<0)o=-1,r=-r;else return null;Fn.subVectors(this.origin,t);const l=o*this.direction.dot(Vs.crossVectors(Fn,Vs));if(l<0)return null;const c=o*this.direction.dot(cr.cross(Fn));if(c<0||l+c>r)return null;const h=-o*Fn.dot(hr);return h<0?null:this.at(h/r,s)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class te{constructor(t,e,n,i,s,r,o,l,c,h,d,u,p,g,v,f){te.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,i,s,r,o,l,c,h,d,u,p,g,v,f)}set(t,e,n,i,s,r,o,l,c,h,d,u,p,g,v,f){const m=this.elements;return m[0]=t,m[4]=e,m[8]=n,m[12]=i,m[1]=s,m[5]=r,m[9]=o,m[13]=l,m[2]=c,m[6]=h,m[10]=d,m[14]=u,m[3]=p,m[7]=g,m[11]=v,m[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new te().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){const e=this.elements,n=t.elements,i=1/Ei.setFromMatrixColumn(t,0).length(),s=1/Ei.setFromMatrixColumn(t,1).length(),r=1/Ei.setFromMatrixColumn(t,2).length();return e[0]=n[0]*i,e[1]=n[1]*i,e[2]=n[2]*i,e[3]=0,e[4]=n[4]*s,e[5]=n[5]*s,e[6]=n[6]*s,e[7]=0,e[8]=n[8]*r,e[9]=n[9]*r,e[10]=n[10]*r,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,i=t.y,s=t.z,r=Math.cos(n),o=Math.sin(n),l=Math.cos(i),c=Math.sin(i),h=Math.cos(s),d=Math.sin(s);if(t.order==="XYZ"){const u=r*h,p=r*d,g=o*h,v=o*d;e[0]=l*h,e[4]=-l*d,e[8]=c,e[1]=p+g*c,e[5]=u-v*c,e[9]=-o*l,e[2]=v-u*c,e[6]=g+p*c,e[10]=r*l}else if(t.order==="YXZ"){const u=l*h,p=l*d,g=c*h,v=c*d;e[0]=u+v*o,e[4]=g*o-p,e[8]=r*c,e[1]=r*d,e[5]=r*h,e[9]=-o,e[2]=p*o-g,e[6]=v+u*o,e[10]=r*l}else if(t.order==="ZXY"){const u=l*h,p=l*d,g=c*h,v=c*d;e[0]=u-v*o,e[4]=-r*d,e[8]=g+p*o,e[1]=p+g*o,e[5]=r*h,e[9]=v-u*o,e[2]=-r*c,e[6]=o,e[10]=r*l}else if(t.order==="ZYX"){const u=r*h,p=r*d,g=o*h,v=o*d;e[0]=l*h,e[4]=g*c-p,e[8]=u*c+v,e[1]=l*d,e[5]=v*c+u,e[9]=p*c-g,e[2]=-c,e[6]=o*l,e[10]=r*l}else if(t.order==="YZX"){const u=r*l,p=r*c,g=o*l,v=o*c;e[0]=l*h,e[4]=v-u*d,e[8]=g*d+p,e[1]=d,e[5]=r*h,e[9]=-o*h,e[2]=-c*h,e[6]=p*d+g,e[10]=u-v*d}else if(t.order==="XZY"){const u=r*l,p=r*c,g=o*l,v=o*c;e[0]=l*h,e[4]=-d,e[8]=c*h,e[1]=u*d+v,e[5]=r*h,e[9]=p*d-g,e[2]=g*d-p,e[6]=o*h,e[10]=v*d+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(fu,t,pu)}lookAt(t,e,n){const i=this.elements;return $e.subVectors(t,e),$e.lengthSq()===0&&($e.z=1),$e.normalize(),On.crossVectors(n,$e),On.lengthSq()===0&&(Math.abs(n.z)===1?$e.x+=1e-4:$e.z+=1e-4,$e.normalize(),On.crossVectors(n,$e)),On.normalize(),Ws.crossVectors($e,On),i[0]=On.x,i[4]=Ws.x,i[8]=$e.x,i[1]=On.y,i[5]=Ws.y,i[9]=$e.y,i[2]=On.z,i[6]=Ws.z,i[10]=$e.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,i=e.elements,s=this.elements,r=n[0],o=n[4],l=n[8],c=n[12],h=n[1],d=n[5],u=n[9],p=n[13],g=n[2],v=n[6],f=n[10],m=n[14],y=n[3],S=n[7],x=n[11],T=n[15],E=i[0],w=i[4],C=i[8],M=i[12],_=i[1],P=i[5],I=i[9],D=i[13],O=i[2],G=i[6],H=i[10],Y=i[14],V=i[3],at=i[7],lt=i[11],gt=i[15];return s[0]=r*E+o*_+l*O+c*V,s[4]=r*w+o*P+l*G+c*at,s[8]=r*C+o*I+l*H+c*lt,s[12]=r*M+o*D+l*Y+c*gt,s[1]=h*E+d*_+u*O+p*V,s[5]=h*w+d*P+u*G+p*at,s[9]=h*C+d*I+u*H+p*lt,s[13]=h*M+d*D+u*Y+p*gt,s[2]=g*E+v*_+f*O+m*V,s[6]=g*w+v*P+f*G+m*at,s[10]=g*C+v*I+f*H+m*lt,s[14]=g*M+v*D+f*Y+m*gt,s[3]=y*E+S*_+x*O+T*V,s[7]=y*w+S*P+x*G+T*at,s[11]=y*C+S*I+x*H+T*lt,s[15]=y*M+S*D+x*Y+T*gt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],i=t[8],s=t[12],r=t[1],o=t[5],l=t[9],c=t[13],h=t[2],d=t[6],u=t[10],p=t[14],g=t[3],v=t[7],f=t[11],m=t[15];return g*(+s*l*d-i*c*d-s*o*u+n*c*u+i*o*p-n*l*p)+v*(+e*l*p-e*c*u+s*r*u-i*r*p+i*c*h-s*l*h)+f*(+e*c*d-e*o*p-s*r*d+n*r*p+s*o*h-n*c*h)+m*(-i*o*h-e*l*d+e*o*u+i*r*d-n*r*u+n*l*h)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const i=this.elements;return t.isVector3?(i[12]=t.x,i[13]=t.y,i[14]=t.z):(i[12]=t,i[13]=e,i[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],i=t[2],s=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=t[9],u=t[10],p=t[11],g=t[12],v=t[13],f=t[14],m=t[15],y=d*f*c-v*u*c+v*l*p-o*f*p-d*l*m+o*u*m,S=g*u*c-h*f*c-g*l*p+r*f*p+h*l*m-r*u*m,x=h*v*c-g*d*c+g*o*p-r*v*p-h*o*m+r*d*m,T=g*d*l-h*v*l-g*o*u+r*v*u+h*o*f-r*d*f,E=e*y+n*S+i*x+s*T;if(E===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const w=1/E;return t[0]=y*w,t[1]=(v*u*s-d*f*s-v*i*p+n*f*p+d*i*m-n*u*m)*w,t[2]=(o*f*s-v*l*s+v*i*c-n*f*c-o*i*m+n*l*m)*w,t[3]=(d*l*s-o*u*s-d*i*c+n*u*c+o*i*p-n*l*p)*w,t[4]=S*w,t[5]=(h*f*s-g*u*s+g*i*p-e*f*p-h*i*m+e*u*m)*w,t[6]=(g*l*s-r*f*s-g*i*c+e*f*c+r*i*m-e*l*m)*w,t[7]=(r*u*s-h*l*s+h*i*c-e*u*c-r*i*p+e*l*p)*w,t[8]=x*w,t[9]=(g*d*s-h*v*s-g*n*p+e*v*p+h*n*m-e*d*m)*w,t[10]=(r*v*s-g*o*s+g*n*c-e*v*c-r*n*m+e*o*m)*w,t[11]=(h*o*s-r*d*s-h*n*c+e*d*c+r*n*p-e*o*p)*w,t[12]=T*w,t[13]=(h*v*i-g*d*i+g*n*u-e*v*u-h*n*f+e*d*f)*w,t[14]=(g*o*i-r*v*i-g*n*l+e*v*l+r*n*f-e*o*f)*w,t[15]=(r*d*i-h*o*i+h*n*l-e*d*l-r*n*u+e*o*u)*w,this}scale(t){const e=this.elements,n=t.x,i=t.y,s=t.z;return e[0]*=n,e[4]*=i,e[8]*=s,e[1]*=n,e[5]*=i,e[9]*=s,e[2]*=n,e[6]*=i,e[10]*=s,e[3]*=n,e[7]*=i,e[11]*=s,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],i=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,i))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),i=Math.sin(e),s=1-n,r=t.x,o=t.y,l=t.z,c=s*r,h=s*o;return this.set(c*r+n,c*o-i*l,c*l+i*o,0,c*o+i*l,h*o+n,h*l-i*r,0,c*l-i*o,h*l+i*r,s*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,i,s,r){return this.set(1,n,s,0,t,1,r,0,e,i,1,0,0,0,0,1),this}compose(t,e,n){const i=this.elements,s=e._x,r=e._y,o=e._z,l=e._w,c=s+s,h=r+r,d=o+o,u=s*c,p=s*h,g=s*d,v=r*h,f=r*d,m=o*d,y=l*c,S=l*h,x=l*d,T=n.x,E=n.y,w=n.z;return i[0]=(1-(v+m))*T,i[1]=(p+x)*T,i[2]=(g-S)*T,i[3]=0,i[4]=(p-x)*E,i[5]=(1-(u+m))*E,i[6]=(f+y)*E,i[7]=0,i[8]=(g+S)*w,i[9]=(f-y)*w,i[10]=(1-(u+v))*w,i[11]=0,i[12]=t.x,i[13]=t.y,i[14]=t.z,i[15]=1,this}decompose(t,e,n){const i=this.elements;let s=Ei.set(i[0],i[1],i[2]).length();const r=Ei.set(i[4],i[5],i[6]).length(),o=Ei.set(i[8],i[9],i[10]).length();this.determinant()<0&&(s=-s),t.x=i[12],t.y=i[13],t.z=i[14],cn.copy(this);const c=1/s,h=1/r,d=1/o;return cn.elements[0]*=c,cn.elements[1]*=c,cn.elements[2]*=c,cn.elements[4]*=h,cn.elements[5]*=h,cn.elements[6]*=h,cn.elements[8]*=d,cn.elements[9]*=d,cn.elements[10]*=d,e.setFromRotationMatrix(cn),n.x=s,n.y=r,n.z=o,this}makePerspective(t,e,n,i,s,r,o=Rn){const l=this.elements,c=2*s/(e-t),h=2*s/(n-i),d=(e+t)/(e-t),u=(n+i)/(n-i);let p,g;if(o===Rn)p=-(r+s)/(r-s),g=-2*r*s/(r-s);else if(o===Ra)p=-r/(r-s),g=-r*s/(r-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=u,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,i,s,r,o=Rn){const l=this.elements,c=1/(e-t),h=1/(n-i),d=1/(r-s),u=(e+t)*c,p=(n+i)*h;let g,v;if(o===Rn)g=(r+s)*d,v=-2*d;else if(o===Ra)g=s*d,v=-1*d;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-u,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=v,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let i=0;i<16;i++)if(e[i]!==n[i])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}}const Ei=new L,cn=new te,fu=new L(0,0,0),pu=new L(1,1,1),On=new L,Ws=new L,$e=new L,Dl=new te,kl=new Ji;class an{constructor(t=0,e=0,n=0,i=an.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=i}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,i=this._order){return this._x=t,this._y=e,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const i=t.elements,s=i[0],r=i[4],o=i[8],l=i[1],c=i[5],h=i[9],d=i[2],u=i[6],p=i[10];switch(e){case"XYZ":this._y=Math.asin(Pe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-r,s)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Pe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(Pe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Pe(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,p),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(Pe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Pe(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Dl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Dl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return kl.setFromEuler(this),this.setFromQuaternion(kl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}an.DEFAULT_ORDER="XYZ";class oh{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let mu=0;const zl=new L,Ti=new Ji,bn=new te,Xs=new L,os=new L,gu=new L,vu=new Ji,Ul=new L(1,0,0),Nl=new L(0,1,0),Fl=new L(0,0,1),Ol={type:"added"},xu={type:"removed"},Ai={type:"childadded",child:null},dr={type:"childremoved",child:null};class Me extends Ki{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:mu++}),this.uuid=Zn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Me.DEFAULT_UP.clone();const t=new L,e=new an,n=new Ji,i=new L(1,1,1);function s(){n.setFromEuler(e,!1)}function r(){e.setFromQuaternion(n,void 0,!1)}e._onChange(s),n._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new te},normalMatrix:{value:new Bt}}),this.matrix=new te,this.matrixWorld=new te,this.matrixAutoUpdate=Me.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Me.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new oh,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Ti.setFromAxisAngle(t,e),this.quaternion.multiply(Ti),this}rotateOnWorldAxis(t,e){return Ti.setFromAxisAngle(t,e),this.quaternion.premultiply(Ti),this}rotateX(t){return this.rotateOnAxis(Ul,t)}rotateY(t){return this.rotateOnAxis(Nl,t)}rotateZ(t){return this.rotateOnAxis(Fl,t)}translateOnAxis(t,e){return zl.copy(t).applyQuaternion(this.quaternion),this.position.add(zl.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Ul,t)}translateY(t){return this.translateOnAxis(Nl,t)}translateZ(t){return this.translateOnAxis(Fl,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(bn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Xs.copy(t):Xs.set(t,e,n);const i=this.parent;this.updateWorldMatrix(!0,!1),os.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?bn.lookAt(os,Xs,this.up):bn.lookAt(Xs,os,this.up),this.quaternion.setFromRotationMatrix(bn),i&&(bn.extractRotation(i.matrixWorld),Ti.setFromRotationMatrix(bn),this.quaternion.premultiply(Ti.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Ol),Ai.child=t,this.dispatchEvent(Ai),Ai.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(xu),dr.child=t,this.dispatchEvent(dr),dr.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),bn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),bn.multiply(t.parent.matrixWorld)),t.applyMatrix4(bn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Ol),Ai.child=t,this.dispatchEvent(Ai),Ai.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,i=this.children.length;n<i;n++){const r=this.children[n].getObjectByProperty(t,e);if(r!==void 0)return r}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const i=this.children;for(let s=0,r=i.length;s<r;s++)i[s].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(os,t,gu),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(os,vu,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,i=e.length;n<i;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e){const n=this.parent;if(t===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),e===!0){const i=this.children;for(let s=0,r=i.length;s<r;s++)i[s].updateWorldMatrix(!1,!0)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),i.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(i.type="BatchedMesh",i.perObjectFrustumCulled=this.perObjectFrustumCulled,i.sortObjects=this.sortObjects,i.drawRanges=this._drawRanges,i.reservedRanges=this._reservedRanges,i.visibility=this._visibility,i.active=this._active,i.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),i.maxInstanceCount=this._maxInstanceCount,i.maxVertexCount=this._maxVertexCount,i.maxIndexCount=this._maxIndexCount,i.geometryInitialized=this._geometryInitialized,i.geometryCount=this._geometryCount,i.matricesTexture=this._matricesTexture.toJSON(t),this._colorsTexture!==null&&(i.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(i.boundingSphere={center:i.boundingSphere.center.toArray(),radius:i.boundingSphere.radius}),this.boundingBox!==null&&(i.boundingBox={min:i.boundingBox.min.toArray(),max:i.boundingBox.max.toArray()}));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const d=l[c];s(t.shapes,d)}else s(t.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(t.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(t.materials,this.material[l]));i.material=o}else i.material=s(t.materials,this.material);if(this.children.length>0){i.children=[];for(let o=0;o<this.children.length;o++)i.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){i.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];i.animations.push(s(t.animations,l))}}if(e){const o=r(t.geometries),l=r(t.materials),c=r(t.textures),h=r(t.images),d=r(t.shapes),u=r(t.skeletons),p=r(t.animations),g=r(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=i,n;function r(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const i=t.children[n];this.add(i.clone())}return this}}Me.DEFAULT_UP=new L(0,1,0);Me.DEFAULT_MATRIX_AUTO_UPDATE=!0;Me.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const hn=new L,En=new L,ur=new L,Tn=new L,Ci=new L,Ri=new L,Bl=new L,fr=new L,pr=new L,mr=new L,gr=new me,vr=new me,xr=new me;class nn{constructor(t=new L,e=new L,n=new L){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,i){i.subVectors(n,e),hn.subVectors(t,e),i.cross(hn);const s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(t,e,n,i,s){hn.subVectors(i,e),En.subVectors(n,e),ur.subVectors(t,e);const r=hn.dot(hn),o=hn.dot(En),l=hn.dot(ur),c=En.dot(En),h=En.dot(ur),d=r*c-o*o;if(d===0)return s.set(0,0,0),null;const u=1/d,p=(c*l-o*h)*u,g=(r*h-o*l)*u;return s.set(1-p-g,g,p)}static containsPoint(t,e,n,i){return this.getBarycoord(t,e,n,i,Tn)===null?!1:Tn.x>=0&&Tn.y>=0&&Tn.x+Tn.y<=1}static getInterpolation(t,e,n,i,s,r,o,l){return this.getBarycoord(t,e,n,i,Tn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Tn.x),l.addScaledVector(r,Tn.y),l.addScaledVector(o,Tn.z),l)}static getInterpolatedAttribute(t,e,n,i,s,r){return gr.setScalar(0),vr.setScalar(0),xr.setScalar(0),gr.fromBufferAttribute(t,e),vr.fromBufferAttribute(t,n),xr.fromBufferAttribute(t,i),r.setScalar(0),r.addScaledVector(gr,s.x),r.addScaledVector(vr,s.y),r.addScaledVector(xr,s.z),r}static isFrontFacing(t,e,n,i){return hn.subVectors(n,e),En.subVectors(t,e),hn.cross(En).dot(i)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,i){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[i]),this}setFromAttributeAndIndices(t,e,n,i){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,i),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return hn.subVectors(this.c,this.b),En.subVectors(this.a,this.b),hn.cross(En).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return nn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return nn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,i,s){return nn.getInterpolation(t,this.a,this.b,this.c,e,n,i,s)}containsPoint(t){return nn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return nn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,i=this.b,s=this.c;let r,o;Ci.subVectors(i,n),Ri.subVectors(s,n),fr.subVectors(t,n);const l=Ci.dot(fr),c=Ri.dot(fr);if(l<=0&&c<=0)return e.copy(n);pr.subVectors(t,i);const h=Ci.dot(pr),d=Ri.dot(pr);if(h>=0&&d<=h)return e.copy(i);const u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return r=l/(l-h),e.copy(n).addScaledVector(Ci,r);mr.subVectors(t,s);const p=Ci.dot(mr),g=Ri.dot(mr);if(g>=0&&p<=g)return e.copy(s);const v=p*c-l*g;if(v<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(Ri,o);const f=h*g-p*d;if(f<=0&&d-h>=0&&p-g>=0)return Bl.subVectors(s,i),o=(d-h)/(d-h+(p-g)),e.copy(i).addScaledVector(Bl,o);const m=1/(f+v+u);return r=v*m,o=u*m,e.copy(n).addScaledVector(Ci,r).addScaledVector(Ri,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}const lh={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Bn={h:0,s:0,l:0},qs={h:0,s:0,l:0};function yr(a,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?a+(t-a)*6*e:e<1/2?t:e<2/3?a+(t-a)*6*(2/3-e):a}class ct{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const i=t;i&&i.isColor?this.copy(i):typeof i=="number"?this.setHex(i):typeof i=="string"&&this.setStyle(i)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=je){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Zt.toWorkingColorSpace(this,e),this}setRGB(t,e,n,i=Zt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Zt.toWorkingColorSpace(this,i),this}setHSL(t,e,n,i=Zt.workingColorSpace){if(t=nu(t,1),e=Pe(e,0,1),n=Pe(n,0,1),e===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+e):n+e-n*e,r=2*n-s;this.r=yr(r,s,t+1/3),this.g=yr(r,s,t),this.b=yr(r,s,t-1/3)}return Zt.toWorkingColorSpace(this,i),this}setStyle(t,e=je){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(t)){let s;const r=i[1],o=i[2];switch(r){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,e);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,e);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(t)){const s=i[1],r=s.length;if(r===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,e);if(r===6)return this.setHex(parseInt(s,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=je){const n=lh[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Ln(t.r),this.g=Ln(t.g),this.b=Ln(t.b),this}copyLinearToSRGB(t){return this.r=Gi(t.r),this.g=Gi(t.g),this.b=Gi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=je){return Zt.fromWorkingColorSpace(De.copy(this),t),Math.round(Pe(De.r*255,0,255))*65536+Math.round(Pe(De.g*255,0,255))*256+Math.round(Pe(De.b*255,0,255))}getHexString(t=je){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Zt.workingColorSpace){Zt.fromWorkingColorSpace(De.copy(this),e);const n=De.r,i=De.g,s=De.b,r=Math.max(n,i,s),o=Math.min(n,i,s);let l,c;const h=(o+r)/2;if(o===r)l=0,c=0;else{const d=r-o;switch(c=h<=.5?d/(r+o):d/(2-r-o),r){case n:l=(i-s)/d+(i<s?6:0);break;case i:l=(s-n)/d+2;break;case s:l=(n-i)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=Zt.workingColorSpace){return Zt.fromWorkingColorSpace(De.copy(this),e),t.r=De.r,t.g=De.g,t.b=De.b,t}getStyle(t=je){Zt.fromWorkingColorSpace(De.copy(this),t);const e=De.r,n=De.g,i=De.b;return t!==je?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(i*255)})`}offsetHSL(t,e,n){return this.getHSL(Bn),this.setHSL(Bn.h+t,Bn.s+e,Bn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Bn),t.getHSL(qs);const n=nr(Bn.h,qs.h,e),i=nr(Bn.s,qs.s,e),s=nr(Bn.l,qs.l,e);return this.setHSL(n,i,s),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,i=this.b,s=t.elements;return this.r=s[0]*e+s[3]*n+s[6]*i,this.g=s[1]*e+s[4]*n+s[7]*i,this.b=s[2]*e+s[5]*n+s[8]*i,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const De=new ct;ct.NAMES=lh;let yu=0;class Dn extends Ki{static get type(){return"Material"}get type(){return this.constructor.type}set type(t){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:yu++}),this.uuid=Zn(),this.name="",this.blending=pi,this.side=jn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Vr,this.blendDst=Wr,this.blendEquation=li,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ct(0,0,0),this.blendAlpha=0,this.depthFunc=Wi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=bl,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=_i,this.stencilZFail=_i,this.stencilZPass=_i,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}const i=this[e];if(i===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==pi&&(n.blending=this.blending),this.side!==jn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Vr&&(n.blendSrc=this.blendSrc),this.blendDst!==Wr&&(n.blendDst=this.blendDst),this.blendEquation!==li&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Wi&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==bl&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==_i&&(n.stencilFail=this.stencilFail),this.stencilZFail!==_i&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==_i&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){const r=[];for(const o in s){const l=s[o];delete l.metadata,r.push(l)}return r}if(e){const s=i(t.textures),r=i(t.images);s.length>0&&(n.textures=s),r.length>0&&(n.images=r)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const i=e.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=e[s].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}}class Oe extends Dn{static get type(){return"MeshBasicMaterial"}constructor(t){super(),this.isMeshBasicMaterial=!0,this.color=new ct(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new an,this.combine=Fa,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const ye=new L,$s=new dt;class ze{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Co,this.updateRanges=[],this.gpuType=vn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[t+i]=e.array[n+i];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)$s.fromBufferAttribute(this,e),$s.applyMatrix3(t),this.setXY(e,$s.x,$s.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)ye.fromBufferAttribute(this,e),ye.applyMatrix3(t),this.setXYZ(e,ye.x,ye.y,ye.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)ye.fromBufferAttribute(this,e),ye.applyMatrix4(t),this.setXYZ(e,ye.x,ye.y,ye.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)ye.fromBufferAttribute(this,e),ye.applyNormalMatrix(t),this.setXYZ(e,ye.x,ye.y,ye.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)ye.fromBufferAttribute(this,e),ye.transformDirection(t),this.setXYZ(e,ye.x,ye.y,ye.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=gn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=re(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=gn(e,this.array)),e}setX(t,e){return this.normalized&&(e=re(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=gn(e,this.array)),e}setY(t,e){return this.normalized&&(e=re(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=gn(e,this.array)),e}setZ(t,e){return this.normalized&&(e=re(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=gn(e,this.array)),e}setW(t,e){return this.normalized&&(e=re(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=re(e,this.array),n=re(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,i){return t*=this.itemSize,this.normalized&&(e=re(e,this.array),n=re(n,this.array),i=re(i,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t*=this.itemSize,this.normalized&&(e=re(e,this.array),n=re(n,this.array),i=re(i,this.array),s=re(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=i,this.array[t+3]=s,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Co&&(t.usage=this.usage),t}}class ch extends ze{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class hh extends ze{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class he extends ze{constructor(t,e,n){super(new Float32Array(t),e,n)}}let _u=0;const tn=new te,_r=new Me,Pi=new L,Ye=new vi,ls=new vi,Ae=new L;class ge extends Ki{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:_u++}),this.uuid=Zn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(sh(t)?hh:ch)(t,1):this.index=t,this}setIndirect(t){return this.indirect=t,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Bt().getNormalMatrix(t);n.applyNormalMatrix(s),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(t),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return tn.makeRotationFromQuaternion(t),this.applyMatrix4(tn),this}rotateX(t){return tn.makeRotationX(t),this.applyMatrix4(tn),this}rotateY(t){return tn.makeRotationY(t),this.applyMatrix4(tn),this}rotateZ(t){return tn.makeRotationZ(t),this.applyMatrix4(tn),this}translate(t,e,n){return tn.makeTranslation(t,e,n),this.applyMatrix4(tn),this}scale(t,e,n){return tn.makeScale(t,e,n),this.applyMatrix4(tn),this}lookAt(t){return _r.lookAt(t),_r.updateMatrix(),this.applyMatrix4(_r.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Pi).negate(),this.translate(Pi.x,Pi.y,Pi.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let i=0,s=t.length;i<s;i++){const r=t[i];n.push(r.x,r.y,r.z||0)}this.setAttribute("position",new he(n,3))}else{for(let n=0,i=e.count;n<i;n++){const s=t[n];e.setXYZ(n,s.x,s.y,s.z||0)}t.length>e.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new vi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new L(-1/0,-1/0,-1/0),new L(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,i=e.length;n<i;n++){const s=e[n];Ye.setFromBufferAttribute(s),this.morphTargetsRelative?(Ae.addVectors(this.boundingBox.min,Ye.min),this.boundingBox.expandByPoint(Ae),Ae.addVectors(this.boundingBox.max,Ye.max),this.boundingBox.expandByPoint(Ae)):(this.boundingBox.expandByPoint(Ye.min),this.boundingBox.expandByPoint(Ye.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new xi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new L,1/0);return}if(t){const n=this.boundingSphere.center;if(Ye.setFromBufferAttribute(t),e)for(let s=0,r=e.length;s<r;s++){const o=e[s];ls.setFromBufferAttribute(o),this.morphTargetsRelative?(Ae.addVectors(Ye.min,ls.min),Ye.expandByPoint(Ae),Ae.addVectors(Ye.max,ls.max),Ye.expandByPoint(Ae)):(Ye.expandByPoint(ls.min),Ye.expandByPoint(ls.max))}Ye.getCenter(n);let i=0;for(let s=0,r=t.count;s<r;s++)Ae.fromBufferAttribute(t,s),i=Math.max(i,n.distanceToSquared(Ae));if(e)for(let s=0,r=e.length;s<r;s++){const o=e[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Ae.fromBufferAttribute(o,c),l&&(Pi.fromBufferAttribute(t,c),Ae.add(Pi)),i=Math.max(i,n.distanceToSquared(Ae))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,i=e.normal,s=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new ze(new Float32Array(4*n.count),4));const r=this.getAttribute("tangent"),o=[],l=[];for(let C=0;C<n.count;C++)o[C]=new L,l[C]=new L;const c=new L,h=new L,d=new L,u=new dt,p=new dt,g=new dt,v=new L,f=new L;function m(C,M,_){c.fromBufferAttribute(n,C),h.fromBufferAttribute(n,M),d.fromBufferAttribute(n,_),u.fromBufferAttribute(s,C),p.fromBufferAttribute(s,M),g.fromBufferAttribute(s,_),h.sub(c),d.sub(c),p.sub(u),g.sub(u);const P=1/(p.x*g.y-g.x*p.y);isFinite(P)&&(v.copy(h).multiplyScalar(g.y).addScaledVector(d,-p.y).multiplyScalar(P),f.copy(d).multiplyScalar(p.x).addScaledVector(h,-g.x).multiplyScalar(P),o[C].add(v),o[M].add(v),o[_].add(v),l[C].add(f),l[M].add(f),l[_].add(f))}let y=this.groups;y.length===0&&(y=[{start:0,count:t.count}]);for(let C=0,M=y.length;C<M;++C){const _=y[C],P=_.start,I=_.count;for(let D=P,O=P+I;D<O;D+=3)m(t.getX(D+0),t.getX(D+1),t.getX(D+2))}const S=new L,x=new L,T=new L,E=new L;function w(C){T.fromBufferAttribute(i,C),E.copy(T);const M=o[C];S.copy(M),S.sub(T.multiplyScalar(T.dot(M))).normalize(),x.crossVectors(E,M);const P=x.dot(l[C])<0?-1:1;r.setXYZW(C,S.x,S.y,S.z,P)}for(let C=0,M=y.length;C<M;++C){const _=y[C],P=_.start,I=_.count;for(let D=P,O=P+I;D<O;D+=3)w(t.getX(D+0)),w(t.getX(D+1)),w(t.getX(D+2))}}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new ze(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,p=n.count;u<p;u++)n.setXYZ(u,0,0,0);const i=new L,s=new L,r=new L,o=new L,l=new L,c=new L,h=new L,d=new L;if(t)for(let u=0,p=t.count;u<p;u+=3){const g=t.getX(u+0),v=t.getX(u+1),f=t.getX(u+2);i.fromBufferAttribute(e,g),s.fromBufferAttribute(e,v),r.fromBufferAttribute(e,f),h.subVectors(r,s),d.subVectors(i,s),h.cross(d),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,f),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(f,c.x,c.y,c.z)}else for(let u=0,p=e.count;u<p;u+=3)i.fromBufferAttribute(e,u+0),s.fromBufferAttribute(e,u+1),r.fromBufferAttribute(e,u+2),h.subVectors(r,s),d.subVectors(i,s),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Ae.fromBufferAttribute(t,e),Ae.normalize(),t.setXYZ(e,Ae.x,Ae.y,Ae.z)}toNonIndexed(){function t(o,l){const c=o.array,h=o.itemSize,d=o.normalized,u=new c.constructor(l.length*h);let p=0,g=0;for(let v=0,f=l.length;v<f;v++){o.isInterleavedBufferAttribute?p=l[v]*o.data.stride+o.offset:p=l[v]*h;for(let m=0;m<h;m++)u[g++]=c[p++]}return new ze(u,h,d)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ge,n=this.index.array,i=this.attributes;for(const o in i){const l=i[o],c=t(l,n);e.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let h=0,d=c.length;h<d;h++){const u=c[h],p=t(u,n);l.push(p)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const r=this.groups;for(let o=0,l=r.length;o<l;o++){const c=r[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const i={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){const p=c[d];h.push(p.toJSON(t.data))}h.length>0&&(i[l]=h,s=!0)}s&&(t.data.morphAttributes=i,t.data.morphTargetsRelative=this.morphTargetsRelative);const r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone(e));const i=t.attributes;for(const c in i){const h=i[c];this.setAttribute(c,h.clone(e))}const s=t.morphAttributes;for(const c in s){const h=[],d=s[c];for(let u=0,p=d.length;u<p;u++)h.push(d[u].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;const r=t.groups;for(let c=0,h=r.length;c<h;c++){const d=r[c];this.addGroup(d.start,d.count,d.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Hl=new te,ni=new Xo,Ys=new xi,Gl=new L,Zs=new L,js=new L,Ks=new L,Mr=new L,Js=new L,Vl=new L,Qs=new L;class Pt extends Me{constructor(t=new ge,e=new Oe){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=i.length;s<r;s++){const o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(t,e){const n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,r=n.morphTargetsRelative;e.fromBufferAttribute(i,t);const o=this.morphTargetInfluences;if(s&&o){Js.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=o[l],d=s[l];h!==0&&(Mr.fromBufferAttribute(d,t),r?Js.addScaledVector(Mr,h):Js.addScaledVector(Mr.sub(e),h))}e.add(Js)}return e}raycast(t,e){const n=this.geometry,i=this.material,s=this.matrixWorld;i!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ys.copy(n.boundingSphere),Ys.applyMatrix4(s),ni.copy(t.ray).recast(t.near),!(Ys.containsPoint(ni.origin)===!1&&(ni.intersectSphere(Ys,Gl)===null||ni.origin.distanceToSquared(Gl)>(t.far-t.near)**2))&&(Hl.copy(s).invert(),ni.copy(t.ray).applyMatrix4(Hl),!(n.boundingBox!==null&&ni.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,ni)))}_computeIntersections(t,e,n){let i;const s=this.geometry,r=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,d=s.attributes.normal,u=s.groups,p=s.drawRange;if(o!==null)if(Array.isArray(r))for(let g=0,v=u.length;g<v;g++){const f=u[g],m=r[f.materialIndex],y=Math.max(f.start,p.start),S=Math.min(o.count,Math.min(f.start+f.count,p.start+p.count));for(let x=y,T=S;x<T;x+=3){const E=o.getX(x),w=o.getX(x+1),C=o.getX(x+2);i=ta(this,m,t,n,c,h,d,E,w,C),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=f.materialIndex,e.push(i))}}else{const g=Math.max(0,p.start),v=Math.min(o.count,p.start+p.count);for(let f=g,m=v;f<m;f+=3){const y=o.getX(f),S=o.getX(f+1),x=o.getX(f+2);i=ta(this,r,t,n,c,h,d,y,S,x),i&&(i.faceIndex=Math.floor(f/3),e.push(i))}}else if(l!==void 0)if(Array.isArray(r))for(let g=0,v=u.length;g<v;g++){const f=u[g],m=r[f.materialIndex],y=Math.max(f.start,p.start),S=Math.min(l.count,Math.min(f.start+f.count,p.start+p.count));for(let x=y,T=S;x<T;x+=3){const E=x,w=x+1,C=x+2;i=ta(this,m,t,n,c,h,d,E,w,C),i&&(i.faceIndex=Math.floor(x/3),i.face.materialIndex=f.materialIndex,e.push(i))}}else{const g=Math.max(0,p.start),v=Math.min(l.count,p.start+p.count);for(let f=g,m=v;f<m;f+=3){const y=f,S=f+1,x=f+2;i=ta(this,r,t,n,c,h,d,y,S,x),i&&(i.faceIndex=Math.floor(f/3),e.push(i))}}}}function Mu(a,t,e,n,i,s,r,o){let l;if(t.side===Be?l=n.intersectTriangle(r,s,i,!0,o):l=n.intersectTriangle(i,s,r,t.side===jn,o),l===null)return null;Qs.copy(o),Qs.applyMatrix4(a.matrixWorld);const c=e.ray.origin.distanceTo(Qs);return c<e.near||c>e.far?null:{distance:c,point:Qs.clone(),object:a}}function ta(a,t,e,n,i,s,r,o,l,c){a.getVertexPosition(o,Zs),a.getVertexPosition(l,js),a.getVertexPosition(c,Ks);const h=Mu(a,t,e,n,Zs,js,Ks,Vl);if(h){const d=new L;nn.getBarycoord(Vl,Zs,js,Ks,d),i&&(h.uv=nn.getInterpolatedAttribute(i,o,l,c,d,new dt)),s&&(h.uv1=nn.getInterpolatedAttribute(s,o,l,c,d,new dt)),r&&(h.normal=nn.getInterpolatedAttribute(r,o,l,c,d,new L),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new L,materialIndex:0};nn.getNormal(Zs,js,Ks,u.normal),h.face=u,h.barycoord=d}return h}class Ge extends ge{constructor(t=1,e=1,n=1,i=1,s=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:i,heightSegments:s,depthSegments:r};const o=this;i=Math.floor(i),s=Math.floor(s),r=Math.floor(r);const l=[],c=[],h=[],d=[];let u=0,p=0;g("z","y","x",-1,-1,n,e,t,r,s,0),g("z","y","x",1,-1,n,e,-t,r,s,1),g("x","z","y",1,1,t,n,e,i,r,2),g("x","z","y",1,-1,t,n,-e,i,r,3),g("x","y","z",1,-1,t,e,n,i,s,4),g("x","y","z",-1,-1,t,e,-n,i,s,5),this.setIndex(l),this.setAttribute("position",new he(c,3)),this.setAttribute("normal",new he(h,3)),this.setAttribute("uv",new he(d,2));function g(v,f,m,y,S,x,T,E,w,C,M){const _=x/w,P=T/C,I=x/2,D=T/2,O=E/2,G=w+1,H=C+1;let Y=0,V=0;const at=new L;for(let lt=0;lt<H;lt++){const gt=lt*P-D;for(let Dt=0;Dt<G;Dt++){const $t=Dt*_-I;at[v]=$t*y,at[f]=gt*S,at[m]=O,c.push(at.x,at.y,at.z),at[v]=0,at[f]=0,at[m]=E>0?1:-1,h.push(at.x,at.y,at.z),d.push(Dt/w),d.push(1-lt/C),Y+=1}}for(let lt=0;lt<C;lt++)for(let gt=0;gt<w;gt++){const Dt=u+gt+G*lt,$t=u+gt+G*(lt+1),K=u+(gt+1)+G*(lt+1),st=u+(gt+1)+G*lt;l.push(Dt,$t,st),l.push($t,K,st),V+=6}o.addGroup(p,V,M),p+=V,u+=Y}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ge(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}function Zi(a){const t={};for(const e in a){t[e]={};for(const n in a[e]){const i=a[e][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=i.clone():Array.isArray(i)?t[e][n]=i.slice():t[e][n]=i}}return t}function Ne(a){const t={};for(let e=0;e<a.length;e++){const n=Zi(a[e]);for(const i in n)t[i]=n[i]}return t}function Su(a){const t=[];for(let e=0;e<a.length;e++)t.push(a[e].clone());return t}function dh(a){const t=a.getRenderTarget();return t===null?a.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Zt.workingColorSpace}const wu={clone:Zi,merge:Ne};var bu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Eu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class xn extends Dn{static get type(){return"ShaderMaterial"}constructor(t){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=bu,this.fragmentShader=Eu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Zi(t.uniforms),this.uniformsGroups=Su(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const i in this.uniforms){const r=this.uniforms[i].value;r&&r.isTexture?e.uniforms[i]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?e.uniforms[i]={type:"c",value:r.getHex()}:r&&r.isVector2?e.uniforms[i]={type:"v2",value:r.toArray()}:r&&r.isVector3?e.uniforms[i]={type:"v3",value:r.toArray()}:r&&r.isVector4?e.uniforms[i]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?e.uniforms[i]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?e.uniforms[i]={type:"m4",value:r.toArray()}:e.uniforms[i]={value:r}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}}class uh extends Me{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new te,this.projectionMatrix=new te,this.projectionMatrixInverse=new te,this.coordinateSystem=Rn}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const Hn=new L,Wl=new dt,Xl=new dt;class en extends uh{constructor(t=50,e=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=Ro*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(er*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ro*2*Math.atan(Math.tan(er*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Hn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Hn.x,Hn.y).multiplyScalar(-t/Hn.z),Hn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Hn.x,Hn.y).multiplyScalar(-t/Hn.z)}getViewSize(t,e){return this.getViewBounds(t,Wl,Xl),e.subVectors(Xl,Wl)}setViewOffset(t,e,n,i,s,r){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(er*.5*this.fov)/this.zoom,n=2*e,i=this.aspect*n,s=-.5*i;const r=this.view;if(this.view!==null&&this.view.enabled){const l=r.fullWidth,c=r.fullHeight;s+=r.offsetX*i/l,e-=r.offsetY*n/c,i*=r.width/l,n*=r.height/c}const o=this.filmOffset;o!==0&&(s+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}const Li=-90,Ii=1;class Tu extends Me{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const i=new en(Li,Ii,t,e);i.layers=this.layers,this.add(i);const s=new en(Li,Ii,t,e);s.layers=this.layers,this.add(s);const r=new en(Li,Ii,t,e);r.layers=this.layers,this.add(r);const o=new en(Li,Ii,t,e);o.layers=this.layers,this.add(o);const l=new en(Li,Ii,t,e);l.layers=this.layers,this.add(l);const c=new en(Li,Ii,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,i,s,r,o,l]=e;for(const c of e)this.remove(c);if(t===Rn)n.up.set(0,1,0),n.lookAt(1,0,0),i.up.set(0,1,0),i.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Ra)n.up.set(0,-1,0),n.lookAt(-1,0,0),i.up.set(0,-1,0),i.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:i}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[s,r,o,l,c,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,i),t.render(e,s),t.setRenderTarget(n,1,i),t.render(e,r),t.setRenderTarget(n,2,i),t.render(e,o),t.setRenderTarget(n,3,i),t.render(e,l),t.setRenderTarget(n,4,i),t.render(e,c),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,i),t.render(e,h),t.setRenderTarget(d,u,p),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class fh extends ke{constructor(t,e,n,i,s,r,o,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:Xi,super(t,e,n,i,s,r,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Au extends gi{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},i=[n,n,n,n,n,n];this.texture=new fh(i,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:dn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},i=new Ge(5,5,5),s=new xn({name:"CubemapFromEquirect",uniforms:Zi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Be,blending:$n});s.uniforms.tEquirect.value=e;const r=new Pt(i,s),o=e.minFilter;return e.minFilter===Xn&&(e.minFilter=dn),new Tu(1,10,this).update(t,r),e.minFilter=o,r.geometry.dispose(),r.material.dispose(),this}clear(t,e,n,i){const s=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(e,n,i);t.setRenderTarget(s)}}const Sr=new L,Cu=new L,Ru=new Bt;class ri{constructor(t=new L(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,i){return this.normal.set(t,e,n),this.constant=i,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const i=Sr.subVectors(n,e).cross(Cu.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(i,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){const n=t.delta(Sr),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const s=-(t.start.dot(this.normal)+this.constant)/i;return s<0||s>1?null:e.copy(t.start).addScaledVector(n,s)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Ru.getNormalMatrix(t),i=this.coplanarPoint(Sr).applyMatrix4(t),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}}const ii=new xi,ea=new L;class qo{constructor(t=new ri,e=new ri,n=new ri,i=new ri,s=new ri,r=new ri){this.planes=[t,e,n,i,s,r]}set(t,e,n,i,s,r){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(i),o[4].copy(s),o[5].copy(r),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Rn){const n=this.planes,i=t.elements,s=i[0],r=i[1],o=i[2],l=i[3],c=i[4],h=i[5],d=i[6],u=i[7],p=i[8],g=i[9],v=i[10],f=i[11],m=i[12],y=i[13],S=i[14],x=i[15];if(n[0].setComponents(l-s,u-c,f-p,x-m).normalize(),n[1].setComponents(l+s,u+c,f+p,x+m).normalize(),n[2].setComponents(l+r,u+h,f+g,x+y).normalize(),n[3].setComponents(l-r,u-h,f-g,x-y).normalize(),n[4].setComponents(l-o,u-d,f-v,x-S).normalize(),e===Rn)n[5].setComponents(l+o,u+d,f+v,x+S).normalize();else if(e===Ra)n[5].setComponents(o,d,v,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),ii.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),ii.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(ii)}intersectsSprite(t){return ii.center.set(0,0,0),ii.radius=.7071067811865476,ii.applyMatrix4(t.matrixWorld),this.intersectsSphere(ii)}intersectsSphere(t){const e=this.planes,n=t.center,i=-t.radius;for(let s=0;s<6;s++)if(e[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const i=e[n];if(ea.x=i.normal.x>0?t.max.x:t.min.x,ea.y=i.normal.y>0?t.max.y:t.min.y,ea.z=i.normal.z>0?t.max.z:t.min.z,i.distanceToPoint(ea)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function ph(){let a=null,t=!1,e=null,n=null;function i(s,r){e(s,r),n=a.requestAnimationFrame(i)}return{start:function(){t!==!0&&e!==null&&(n=a.requestAnimationFrame(i),t=!0)},stop:function(){a.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(s){e=s},setContext:function(s){a=s}}}function Pu(a){const t=new WeakMap;function e(o,l){const c=o.array,h=o.usage,d=c.byteLength,u=a.createBuffer();a.bindBuffer(l,u),a.bufferData(l,c,h),o.onUploadCallback();let p;if(c instanceof Float32Array)p=a.FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=a.HALF_FLOAT:p=a.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=a.SHORT;else if(c instanceof Uint32Array)p=a.UNSIGNED_INT;else if(c instanceof Int32Array)p=a.INT;else if(c instanceof Int8Array)p=a.BYTE;else if(c instanceof Uint8Array)p=a.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=a.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){const h=l.array,d=l.updateRanges;if(a.bindBuffer(c,o),d.length===0)a.bufferSubData(c,0,h);else{d.sort((p,g)=>p.start-g.start);let u=0;for(let p=1;p<d.length;p++){const g=d[u],v=d[p];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++u,d[u]=v)}d.length=u+1;for(let p=0,g=d.length;p<g;p++){const v=d[p];a.bufferSubData(c,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function i(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(a.deleteBuffer(l.buffer),t.delete(o))}function r(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:i,remove:s,update:r}}class fn extends ge{constructor(t=1,e=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:i};const s=t/2,r=e/2,o=Math.floor(n),l=Math.floor(i),c=o+1,h=l+1,d=t/o,u=e/l,p=[],g=[],v=[],f=[];for(let m=0;m<h;m++){const y=m*u-r;for(let S=0;S<c;S++){const x=S*d-s;g.push(x,-y,0),v.push(0,0,1),f.push(S/o),f.push(1-m/l)}}for(let m=0;m<l;m++)for(let y=0;y<o;y++){const S=y+c*m,x=y+c*(m+1),T=y+1+c*(m+1),E=y+1+c*m;p.push(S,x,E),p.push(x,T,E)}this.setIndex(p),this.setAttribute("position",new he(g,3)),this.setAttribute("normal",new he(v,3)),this.setAttribute("uv",new he(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new fn(t.width,t.height,t.widthSegments,t.heightSegments)}}var Lu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Iu=`#ifdef USE_ALPHAHASH
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
#endif`,Du=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ku=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,zu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Uu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Nu=`#ifdef USE_AOMAP
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
#endif`,Fu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ou=`#ifdef USE_BATCHING
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
#endif`,Bu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Hu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Gu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Vu=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Wu=`#ifdef USE_IRIDESCENCE
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
#endif`,Xu=`#ifdef USE_BUMPMAP
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
#endif`,qu=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,$u=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Yu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Zu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ju=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Ku=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Ju=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,Qu=`#if defined( USE_COLOR_ALPHA )
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
#endif`,tf=`#define PI 3.141592653589793
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
} // validated`,ef=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,nf=`vec3 transformedNormal = objectNormal;
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
#endif`,sf=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,af=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,rf=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,of=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,lf="gl_FragColor = linearToOutputTexel( gl_FragColor );",cf=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,hf=`#ifdef USE_ENVMAP
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
#endif`,df=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,uf=`#ifdef USE_ENVMAP
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
#endif`,ff=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,pf=`#ifdef USE_ENVMAP
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
#endif`,mf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,gf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,vf=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,xf=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,yf=`#ifdef USE_GRADIENTMAP
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
}`,_f=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Mf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Sf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,wf=`uniform bool receiveShadow;
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
#endif`,bf=`#ifdef USE_ENVMAP
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
#endif`,Ef=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Tf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Af=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Cf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Rf=`PhysicalMaterial material;
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
#endif`,Pf=`struct PhysicalMaterial {
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
}`,Lf=`
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
#endif`,If=`#if defined( RE_IndirectDiffuse )
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
#endif`,Df=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,kf=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,zf=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Uf=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Nf=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Ff=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Of=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Bf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,Hf=`#if defined( USE_POINTS_UV )
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
#endif`,Gf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Vf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Wf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Xf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,qf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$f=`#ifdef USE_MORPHTARGETS
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
#endif`,Yf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Zf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,jf=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Kf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Jf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Qf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,tp=`#ifdef USE_NORMALMAP
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
#endif`,ep=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,np=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,ip=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,sp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,ap=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,rp=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,op=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,lp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,cp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,hp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,dp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,up=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,fp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,pp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,mp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,gp=`float getShadowMask() {
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
}`,vp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,xp=`#ifdef USE_SKINNING
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
#endif`,yp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,_p=`#ifdef USE_SKINNING
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
#endif`,Mp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Sp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,wp=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,bp=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,Ep=`#ifdef USE_TRANSMISSION
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
#endif`,Tp=`#ifdef USE_TRANSMISSION
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
#endif`,Ap=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Cp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Rp=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,Pp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Lp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Ip=`uniform sampler2D t2D;
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
}`,Dp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,kp=`#ifdef ENVMAP_TYPE_CUBE
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
}`,zp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Up=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Np=`#include <common>
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
}`,Fp=`#if DEPTH_PACKING == 3200
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
}`,Op=`#define DISTANCE
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
}`,Bp=`#define DISTANCE
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
}`,Hp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Gp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Vp=`uniform float scale;
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
}`,Wp=`uniform vec3 diffuse;
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
}`,Xp=`#include <common>
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
}`,qp=`uniform vec3 diffuse;
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
}`,$p=`#define LAMBERT
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
}`,Yp=`#define LAMBERT
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
}`,Zp=`#define MATCAP
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
}`,jp=`#define MATCAP
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
}`,Kp=`#define NORMAL
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
}`,Jp=`#define NORMAL
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
}`,Qp=`#define PHONG
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
}`,tm=`#define PHONG
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
}`,em=`#define STANDARD
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
}`,nm=`#define STANDARD
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
}`,im=`#define TOON
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
}`,sm=`#define TOON
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
}`,am=`uniform float size;
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
}`,rm=`uniform vec3 diffuse;
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
}`,om=`#include <common>
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
}`,lm=`uniform vec3 color;
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
}`,cm=`uniform float rotation;
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
}`,hm=`uniform vec3 diffuse;
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
}`,Gt={alphahash_fragment:Lu,alphahash_pars_fragment:Iu,alphamap_fragment:Du,alphamap_pars_fragment:ku,alphatest_fragment:zu,alphatest_pars_fragment:Uu,aomap_fragment:Nu,aomap_pars_fragment:Fu,batching_pars_vertex:Ou,batching_vertex:Bu,begin_vertex:Hu,beginnormal_vertex:Gu,bsdfs:Vu,iridescence_fragment:Wu,bumpmap_pars_fragment:Xu,clipping_planes_fragment:qu,clipping_planes_pars_fragment:$u,clipping_planes_pars_vertex:Yu,clipping_planes_vertex:Zu,color_fragment:ju,color_pars_fragment:Ku,color_pars_vertex:Ju,color_vertex:Qu,common:tf,cube_uv_reflection_fragment:ef,defaultnormal_vertex:nf,displacementmap_pars_vertex:sf,displacementmap_vertex:af,emissivemap_fragment:rf,emissivemap_pars_fragment:of,colorspace_fragment:lf,colorspace_pars_fragment:cf,envmap_fragment:hf,envmap_common_pars_fragment:df,envmap_pars_fragment:uf,envmap_pars_vertex:ff,envmap_physical_pars_fragment:bf,envmap_vertex:pf,fog_vertex:mf,fog_pars_vertex:gf,fog_fragment:vf,fog_pars_fragment:xf,gradientmap_pars_fragment:yf,lightmap_pars_fragment:_f,lights_lambert_fragment:Mf,lights_lambert_pars_fragment:Sf,lights_pars_begin:wf,lights_toon_fragment:Ef,lights_toon_pars_fragment:Tf,lights_phong_fragment:Af,lights_phong_pars_fragment:Cf,lights_physical_fragment:Rf,lights_physical_pars_fragment:Pf,lights_fragment_begin:Lf,lights_fragment_maps:If,lights_fragment_end:Df,logdepthbuf_fragment:kf,logdepthbuf_pars_fragment:zf,logdepthbuf_pars_vertex:Uf,logdepthbuf_vertex:Nf,map_fragment:Ff,map_pars_fragment:Of,map_particle_fragment:Bf,map_particle_pars_fragment:Hf,metalnessmap_fragment:Gf,metalnessmap_pars_fragment:Vf,morphinstance_vertex:Wf,morphcolor_vertex:Xf,morphnormal_vertex:qf,morphtarget_pars_vertex:$f,morphtarget_vertex:Yf,normal_fragment_begin:Zf,normal_fragment_maps:jf,normal_pars_fragment:Kf,normal_pars_vertex:Jf,normal_vertex:Qf,normalmap_pars_fragment:tp,clearcoat_normal_fragment_begin:ep,clearcoat_normal_fragment_maps:np,clearcoat_pars_fragment:ip,iridescence_pars_fragment:sp,opaque_fragment:ap,packing:rp,premultiplied_alpha_fragment:op,project_vertex:lp,dithering_fragment:cp,dithering_pars_fragment:hp,roughnessmap_fragment:dp,roughnessmap_pars_fragment:up,shadowmap_pars_fragment:fp,shadowmap_pars_vertex:pp,shadowmap_vertex:mp,shadowmask_pars_fragment:gp,skinbase_vertex:vp,skinning_pars_vertex:xp,skinning_vertex:yp,skinnormal_vertex:_p,specularmap_fragment:Mp,specularmap_pars_fragment:Sp,tonemapping_fragment:wp,tonemapping_pars_fragment:bp,transmission_fragment:Ep,transmission_pars_fragment:Tp,uv_pars_fragment:Ap,uv_pars_vertex:Cp,uv_vertex:Rp,worldpos_vertex:Pp,background_vert:Lp,background_frag:Ip,backgroundCube_vert:Dp,backgroundCube_frag:kp,cube_vert:zp,cube_frag:Up,depth_vert:Np,depth_frag:Fp,distanceRGBA_vert:Op,distanceRGBA_frag:Bp,equirect_vert:Hp,equirect_frag:Gp,linedashed_vert:Vp,linedashed_frag:Wp,meshbasic_vert:Xp,meshbasic_frag:qp,meshlambert_vert:$p,meshlambert_frag:Yp,meshmatcap_vert:Zp,meshmatcap_frag:jp,meshnormal_vert:Kp,meshnormal_frag:Jp,meshphong_vert:Qp,meshphong_frag:tm,meshphysical_vert:em,meshphysical_frag:nm,meshtoon_vert:im,meshtoon_frag:sm,points_vert:am,points_frag:rm,shadow_vert:om,shadow_frag:lm,sprite_vert:cm,sprite_frag:hm},ot={common:{diffuse:{value:new ct(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Bt},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Bt}},envmap:{envMap:{value:null},envMapRotation:{value:new Bt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Bt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Bt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Bt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Bt},normalScale:{value:new dt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Bt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Bt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Bt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Bt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ct(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ct(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0},uvTransform:{value:new Bt}},sprite:{diffuse:{value:new ct(16777215)},opacity:{value:1},center:{value:new dt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Bt},alphaMap:{value:null},alphaMapTransform:{value:new Bt},alphaTest:{value:0}}},mn={basic:{uniforms:Ne([ot.common,ot.specularmap,ot.envmap,ot.aomap,ot.lightmap,ot.fog]),vertexShader:Gt.meshbasic_vert,fragmentShader:Gt.meshbasic_frag},lambert:{uniforms:Ne([ot.common,ot.specularmap,ot.envmap,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.fog,ot.lights,{emissive:{value:new ct(0)}}]),vertexShader:Gt.meshlambert_vert,fragmentShader:Gt.meshlambert_frag},phong:{uniforms:Ne([ot.common,ot.specularmap,ot.envmap,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.fog,ot.lights,{emissive:{value:new ct(0)},specular:{value:new ct(1118481)},shininess:{value:30}}]),vertexShader:Gt.meshphong_vert,fragmentShader:Gt.meshphong_frag},standard:{uniforms:Ne([ot.common,ot.envmap,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.roughnessmap,ot.metalnessmap,ot.fog,ot.lights,{emissive:{value:new ct(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Gt.meshphysical_vert,fragmentShader:Gt.meshphysical_frag},toon:{uniforms:Ne([ot.common,ot.aomap,ot.lightmap,ot.emissivemap,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.gradientmap,ot.fog,ot.lights,{emissive:{value:new ct(0)}}]),vertexShader:Gt.meshtoon_vert,fragmentShader:Gt.meshtoon_frag},matcap:{uniforms:Ne([ot.common,ot.bumpmap,ot.normalmap,ot.displacementmap,ot.fog,{matcap:{value:null}}]),vertexShader:Gt.meshmatcap_vert,fragmentShader:Gt.meshmatcap_frag},points:{uniforms:Ne([ot.points,ot.fog]),vertexShader:Gt.points_vert,fragmentShader:Gt.points_frag},dashed:{uniforms:Ne([ot.common,ot.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Gt.linedashed_vert,fragmentShader:Gt.linedashed_frag},depth:{uniforms:Ne([ot.common,ot.displacementmap]),vertexShader:Gt.depth_vert,fragmentShader:Gt.depth_frag},normal:{uniforms:Ne([ot.common,ot.bumpmap,ot.normalmap,ot.displacementmap,{opacity:{value:1}}]),vertexShader:Gt.meshnormal_vert,fragmentShader:Gt.meshnormal_frag},sprite:{uniforms:Ne([ot.sprite,ot.fog]),vertexShader:Gt.sprite_vert,fragmentShader:Gt.sprite_frag},background:{uniforms:{uvTransform:{value:new Bt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Gt.background_vert,fragmentShader:Gt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Bt}},vertexShader:Gt.backgroundCube_vert,fragmentShader:Gt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Gt.cube_vert,fragmentShader:Gt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Gt.equirect_vert,fragmentShader:Gt.equirect_frag},distanceRGBA:{uniforms:Ne([ot.common,ot.displacementmap,{referencePosition:{value:new L},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Gt.distanceRGBA_vert,fragmentShader:Gt.distanceRGBA_frag},shadow:{uniforms:Ne([ot.lights,ot.fog,{color:{value:new ct(0)},opacity:{value:1}}]),vertexShader:Gt.shadow_vert,fragmentShader:Gt.shadow_frag}};mn.physical={uniforms:Ne([mn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Bt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Bt},clearcoatNormalScale:{value:new dt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Bt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Bt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Bt},sheen:{value:0},sheenColor:{value:new ct(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Bt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Bt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Bt},transmissionSamplerSize:{value:new dt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Bt},attenuationDistance:{value:0},attenuationColor:{value:new ct(0)},specularColor:{value:new ct(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Bt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Bt},anisotropyVector:{value:new dt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Bt}}]),vertexShader:Gt.meshphysical_vert,fragmentShader:Gt.meshphysical_frag};const na={r:0,b:0,g:0},si=new an,dm=new te;function um(a,t,e,n,i,s,r){const o=new ct(0);let l=s===!0?0:1,c,h,d=null,u=0,p=null;function g(y){let S=y.isScene===!0?y.background:null;return S&&S.isTexture&&(S=(y.backgroundBlurriness>0?e:t).get(S)),S}function v(y){let S=!1;const x=g(y);x===null?m(o,l):x&&x.isColor&&(m(x,1),S=!0);const T=a.xr.getEnvironmentBlendMode();T==="additive"?n.buffers.color.setClear(0,0,0,1,r):T==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,r),(a.autoClear||S)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),a.clear(a.autoClearColor,a.autoClearDepth,a.autoClearStencil))}function f(y,S){const x=g(S);x&&(x.isCubeTexture||x.mapping===Oa)?(h===void 0&&(h=new Pt(new Ge(1,1,1),new xn({name:"BackgroundCubeMaterial",uniforms:Zi(mn.backgroundCube.uniforms),vertexShader:mn.backgroundCube.vertexShader,fragmentShader:mn.backgroundCube.fragmentShader,side:Be,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(T,E,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(h)),si.copy(S.backgroundRotation),si.x*=-1,si.y*=-1,si.z*=-1,x.isCubeTexture&&x.isRenderTargetTexture===!1&&(si.y*=-1,si.z*=-1),h.material.uniforms.envMap.value=x,h.material.uniforms.flipEnvMap.value=x.isCubeTexture&&x.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(dm.makeRotationFromEuler(si)),h.material.toneMapped=Zt.getTransfer(x.colorSpace)!==ae,(d!==x||u!==x.version||p!==a.toneMapping)&&(h.material.needsUpdate=!0,d=x,u=x.version,p=a.toneMapping),h.layers.enableAll(),y.unshift(h,h.geometry,h.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new Pt(new fn(2,2),new xn({name:"BackgroundMaterial",uniforms:Zi(mn.background.uniforms),vertexShader:mn.background.vertexShader,fragmentShader:mn.background.fragmentShader,side:jn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.toneMapped=Zt.getTransfer(x.colorSpace)!==ae,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(d!==x||u!==x.version||p!==a.toneMapping)&&(c.material.needsUpdate=!0,d=x,u=x.version,p=a.toneMapping),c.layers.enableAll(),y.unshift(c,c.geometry,c.material,0,0,null))}function m(y,S){y.getRGB(na,dh(a)),n.buffers.color.setClear(na.r,na.g,na.b,S,r)}return{getClearColor:function(){return o},setClearColor:function(y,S=1){o.set(y),l=S,m(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(y){l=y,m(o,l)},render:v,addToRenderList:f}}function fm(a,t){const e=a.getParameter(a.MAX_VERTEX_ATTRIBS),n={},i=u(null);let s=i,r=!1;function o(_,P,I,D,O){let G=!1;const H=d(D,I,P);s!==H&&(s=H,c(s.object)),G=p(_,D,I,O),G&&g(_,D,I,O),O!==null&&t.update(O,a.ELEMENT_ARRAY_BUFFER),(G||r)&&(r=!1,x(_,P,I,D),O!==null&&a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,t.get(O).buffer))}function l(){return a.createVertexArray()}function c(_){return a.bindVertexArray(_)}function h(_){return a.deleteVertexArray(_)}function d(_,P,I){const D=I.wireframe===!0;let O=n[_.id];O===void 0&&(O={},n[_.id]=O);let G=O[P.id];G===void 0&&(G={},O[P.id]=G);let H=G[D];return H===void 0&&(H=u(l()),G[D]=H),H}function u(_){const P=[],I=[],D=[];for(let O=0;O<e;O++)P[O]=0,I[O]=0,D[O]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:P,enabledAttributes:I,attributeDivisors:D,object:_,attributes:{},index:null}}function p(_,P,I,D){const O=s.attributes,G=P.attributes;let H=0;const Y=I.getAttributes();for(const V in Y)if(Y[V].location>=0){const lt=O[V];let gt=G[V];if(gt===void 0&&(V==="instanceMatrix"&&_.instanceMatrix&&(gt=_.instanceMatrix),V==="instanceColor"&&_.instanceColor&&(gt=_.instanceColor)),lt===void 0||lt.attribute!==gt||gt&&lt.data!==gt.data)return!0;H++}return s.attributesNum!==H||s.index!==D}function g(_,P,I,D){const O={},G=P.attributes;let H=0;const Y=I.getAttributes();for(const V in Y)if(Y[V].location>=0){let lt=G[V];lt===void 0&&(V==="instanceMatrix"&&_.instanceMatrix&&(lt=_.instanceMatrix),V==="instanceColor"&&_.instanceColor&&(lt=_.instanceColor));const gt={};gt.attribute=lt,lt&&lt.data&&(gt.data=lt.data),O[V]=gt,H++}s.attributes=O,s.attributesNum=H,s.index=D}function v(){const _=s.newAttributes;for(let P=0,I=_.length;P<I;P++)_[P]=0}function f(_){m(_,0)}function m(_,P){const I=s.newAttributes,D=s.enabledAttributes,O=s.attributeDivisors;I[_]=1,D[_]===0&&(a.enableVertexAttribArray(_),D[_]=1),O[_]!==P&&(a.vertexAttribDivisor(_,P),O[_]=P)}function y(){const _=s.newAttributes,P=s.enabledAttributes;for(let I=0,D=P.length;I<D;I++)P[I]!==_[I]&&(a.disableVertexAttribArray(I),P[I]=0)}function S(_,P,I,D,O,G,H){H===!0?a.vertexAttribIPointer(_,P,I,O,G):a.vertexAttribPointer(_,P,I,D,O,G)}function x(_,P,I,D){v();const O=D.attributes,G=I.getAttributes(),H=P.defaultAttributeValues;for(const Y in G){const V=G[Y];if(V.location>=0){let at=O[Y];if(at===void 0&&(Y==="instanceMatrix"&&_.instanceMatrix&&(at=_.instanceMatrix),Y==="instanceColor"&&_.instanceColor&&(at=_.instanceColor)),at!==void 0){const lt=at.normalized,gt=at.itemSize,Dt=t.get(at);if(Dt===void 0)continue;const $t=Dt.buffer,K=Dt.type,st=Dt.bytesPerElement,z=K===a.INT||K===a.UNSIGNED_INT||at.gpuType===No;if(at.isInterleavedBufferAttribute){const $=at.data,tt=$.stride,vt=at.offset;if($.isInstancedInterleavedBuffer){for(let It=0;It<V.locationSize;It++)m(V.location+It,$.meshPerAttribute);_.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=$.meshPerAttribute*$.count)}else for(let It=0;It<V.locationSize;It++)f(V.location+It);a.bindBuffer(a.ARRAY_BUFFER,$t);for(let It=0;It<V.locationSize;It++)S(V.location+It,gt/V.locationSize,K,lt,tt*st,(vt+gt/V.locationSize*It)*st,z)}else{if(at.isInstancedBufferAttribute){for(let $=0;$<V.locationSize;$++)m(V.location+$,at.meshPerAttribute);_.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=at.meshPerAttribute*at.count)}else for(let $=0;$<V.locationSize;$++)f(V.location+$);a.bindBuffer(a.ARRAY_BUFFER,$t);for(let $=0;$<V.locationSize;$++)S(V.location+$,gt/V.locationSize,K,lt,gt*st,gt/V.locationSize*$*st,z)}}else if(H!==void 0){const lt=H[Y];if(lt!==void 0)switch(lt.length){case 2:a.vertexAttrib2fv(V.location,lt);break;case 3:a.vertexAttrib3fv(V.location,lt);break;case 4:a.vertexAttrib4fv(V.location,lt);break;default:a.vertexAttrib1fv(V.location,lt)}}}}y()}function T(){C();for(const _ in n){const P=n[_];for(const I in P){const D=P[I];for(const O in D)h(D[O].object),delete D[O];delete P[I]}delete n[_]}}function E(_){if(n[_.id]===void 0)return;const P=n[_.id];for(const I in P){const D=P[I];for(const O in D)h(D[O].object),delete D[O];delete P[I]}delete n[_.id]}function w(_){for(const P in n){const I=n[P];if(I[_.id]===void 0)continue;const D=I[_.id];for(const O in D)h(D[O].object),delete D[O];delete I[_.id]}}function C(){M(),r=!0,s!==i&&(s=i,c(s.object))}function M(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:o,reset:C,resetDefaultState:M,dispose:T,releaseStatesOfGeometry:E,releaseStatesOfProgram:w,initAttributes:v,enableAttribute:f,disableUnusedAttributes:y}}function pm(a,t,e){let n;function i(c){n=c}function s(c,h){a.drawArrays(n,c,h),e.update(h,n,1)}function r(c,h,d){d!==0&&(a.drawArraysInstanced(n,c,h,d),e.update(h,n,d))}function o(c,h,d){if(d===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,h,0,d);let p=0;for(let g=0;g<d;g++)p+=h[g];e.update(p,n,1)}function l(c,h,d,u){if(d===0)return;const p=t.get("WEBGL_multi_draw");if(p===null)for(let g=0;g<c.length;g++)r(c[g],h[g],u[g]);else{p.multiDrawArraysInstancedWEBGL(n,c,0,h,0,u,0,d);let g=0;for(let v=0;v<d;v++)g+=h[v]*u[v];e.update(g,n,1)}}this.setMode=i,this.render=s,this.renderInstances=r,this.renderMultiDraw=o,this.renderMultiDrawInstances=l}function mm(a,t,e,n){let i;function s(){if(i!==void 0)return i;if(t.has("EXT_texture_filter_anisotropic")===!0){const w=t.get("EXT_texture_filter_anisotropic");i=a.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function r(w){return!(w!==sn&&n.convert(w)!==a.getParameter(a.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(w){const C=w===Cs&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(w!==In&&n.convert(w)!==a.getParameter(a.IMPLEMENTATION_COLOR_READ_TYPE)&&w!==vn&&!C)}function l(w){if(w==="highp"){if(a.getShaderPrecisionFormat(a.VERTEX_SHADER,a.HIGH_FLOAT).precision>0&&a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&a.getShaderPrecisionFormat(a.VERTEX_SHADER,a.MEDIUM_FLOAT).precision>0&&a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const h=l(c);h!==c&&(console.warn("THREE.WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const d=e.logarithmicDepthBuffer===!0,u=e.reverseDepthBuffer===!0&&t.has("EXT_clip_control"),p=a.getParameter(a.MAX_TEXTURE_IMAGE_UNITS),g=a.getParameter(a.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=a.getParameter(a.MAX_TEXTURE_SIZE),f=a.getParameter(a.MAX_CUBE_MAP_TEXTURE_SIZE),m=a.getParameter(a.MAX_VERTEX_ATTRIBS),y=a.getParameter(a.MAX_VERTEX_UNIFORM_VECTORS),S=a.getParameter(a.MAX_VARYING_VECTORS),x=a.getParameter(a.MAX_FRAGMENT_UNIFORM_VECTORS),T=g>0,E=a.getParameter(a.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:r,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reverseDepthBuffer:u,maxTextures:p,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:f,maxAttributes:m,maxVertexUniforms:y,maxVaryings:S,maxFragmentUniforms:x,vertexTextures:T,maxSamples:E}}function gm(a){const t=this;let e=null,n=0,i=!1,s=!1;const r=new ri,o=new Bt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){const p=d.length!==0||u||n!==0||i;return i=u,n=d.length,p},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,u){e=h(d,u,0)},this.setState=function(d,u,p){const g=d.clippingPlanes,v=d.clipIntersection,f=d.clipShadows,m=a.get(d);if(!i||g===null||g.length===0||s&&!f)s?h(null):c();else{const y=s?0:n,S=y*4;let x=m.clippingState||null;l.value=x,x=h(g,u,S,p);for(let T=0;T!==S;++T)x[T]=e[T];m.clippingState=x,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=y}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,u,p,g){const v=d!==null?d.length:0;let f=null;if(v!==0){if(f=l.value,g!==!0||f===null){const m=p+v*4,y=u.matrixWorldInverse;o.getNormalMatrix(y),(f===null||f.length<m)&&(f=new Float32Array(m));for(let S=0,x=p;S!==v;++S,x+=4)r.copy(d[S]).applyMatrix4(y,o),r.normal.toArray(f,x),f[x+3]=r.constant}l.value=f,l.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,f}}function vm(a){let t=new WeakMap;function e(r,o){return o===Jr?r.mapping=Xi:o===Qr&&(r.mapping=qi),r}function n(r){if(r&&r.isTexture){const o=r.mapping;if(o===Jr||o===Qr)if(t.has(r)){const l=t.get(r).texture;return e(l,r.mapping)}else{const l=r.image;if(l&&l.height>0){const c=new Au(l.height);return c.fromEquirectangularTexture(a,r),t.set(r,c),r.addEventListener("dispose",i),e(c.texture,r.mapping)}else return null}}return r}function i(r){const o=r.target;o.removeEventListener("dispose",i);const l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function s(){t=new WeakMap}return{get:n,dispose:s}}class mh extends uh{constructor(t=-1,e=1,n=1,i=-1,s=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=i,this.near=s,this.far=r,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,i,s,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let s=n-t,r=n+t,o=i+e,l=i-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,r=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,r,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}const Bi=4,ql=[.125,.215,.35,.446,.526,.582],ci=20,wr=new mh,$l=new ct;let br=null,Er=0,Tr=0,Ar=!1;const oi=(1+Math.sqrt(5))/2,Di=1/oi,Yl=[new L(-oi,Di,0),new L(oi,Di,0),new L(-Di,0,oi),new L(Di,0,oi),new L(0,oi,-Di),new L(0,oi,Di),new L(-1,1,-1),new L(1,1,-1),new L(-1,1,1),new L(1,1,1)];class Zl{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,i=100){br=this._renderer.getRenderTarget(),Er=this._renderer.getActiveCubeFace(),Tr=this._renderer.getActiveMipmapLevel(),Ar=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(t,n,i,s),e>0&&this._blur(s,0,0,e),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Jl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Kl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(br,Er,Tr),this._renderer.xr.enabled=Ar,t.scissorTest=!1,ia(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Xi||t.mapping===qi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),br=this._renderer.getRenderTarget(),Er=this._renderer.getActiveCubeFace(),Tr=this._renderer.getActiveMipmapLevel(),Ar=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:dn,minFilter:dn,generateMipmaps:!1,type:Cs,format:sn,colorSpace:ji,depthBuffer:!1},i=jl(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=jl(t,e,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=xm(s)),this._blurMaterial=ym(s,t,e)}return i}_compileMaterial(t){const e=new Pt(this._lodPlanes[0],t);this._renderer.compile(e,wr)}_sceneToCubeUV(t,e,n,i){const o=new en(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,u=h.toneMapping;h.getClearColor($l),h.toneMapping=Yn,h.autoClear=!1;const p=new Oe({name:"PMREM.Background",side:Be,depthWrite:!1,depthTest:!1}),g=new Pt(new Ge,p);let v=!1;const f=t.background;f?f.isColor&&(p.color.copy(f),t.background=null,v=!0):(p.color.copy($l),v=!0);for(let m=0;m<6;m++){const y=m%3;y===0?(o.up.set(0,l[m],0),o.lookAt(c[m],0,0)):y===1?(o.up.set(0,0,l[m]),o.lookAt(0,c[m],0)):(o.up.set(0,l[m],0),o.lookAt(0,0,c[m]));const S=this._cubeSize;ia(i,y*S,m>2?S:0,S,S),h.setRenderTarget(i),v&&h.render(g,o),h.render(t,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=u,h.autoClear=d,t.background=f}_textureToCubeUV(t,e){const n=this._renderer,i=t.mapping===Xi||t.mapping===qi;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Jl()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Kl());const s=i?this._cubemapMaterial:this._equirectMaterial,r=new Pt(this._lodPlanes[0],s),o=s.uniforms;o.envMap.value=t;const l=this._cubeSize;ia(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(r,wr)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const i=this._lodPlanes.length;for(let s=1;s<i;s++){const r=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),o=Yl[(i-s-1)%Yl.length];this._blur(t,s-1,s,r,o)}e.autoClear=n}_blur(t,e,n,i,s){const r=this._pingPongRenderTarget;this._halfBlur(t,r,e,n,i,"latitudinal",s),this._halfBlur(r,t,n,n,i,"longitudinal",s)}_halfBlur(t,e,n,i,s,r,o){const l=this._renderer,c=this._blurMaterial;r!=="latitudinal"&&r!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const h=3,d=new Pt(this._lodPlanes[i],c),u=c.uniforms,p=this._sizeLods[n]-1,g=isFinite(s)?Math.PI/(2*p):2*Math.PI/(2*ci-1),v=s/g,f=isFinite(s)?1+Math.floor(h*v):ci;f>ci&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${ci}`);const m=[];let y=0;for(let w=0;w<ci;++w){const C=w/v,M=Math.exp(-C*C/2);m.push(M),w===0?y+=M:w<f&&(y+=2*M)}for(let w=0;w<m.length;w++)m[w]=m[w]/y;u.envMap.value=t.texture,u.samples.value=f,u.weights.value=m,u.latitudinal.value=r==="latitudinal",o&&(u.poleAxis.value=o);const{_lodMax:S}=this;u.dTheta.value=g,u.mipInt.value=S-n;const x=this._sizeLods[i],T=3*x*(i>S-Bi?i-S+Bi:0),E=4*(this._cubeSize-x);ia(e,T,E,3*x,2*x),l.setRenderTarget(e),l.render(d,wr)}}function xm(a){const t=[],e=[],n=[];let i=a;const s=a-Bi+1+ql.length;for(let r=0;r<s;r++){const o=Math.pow(2,i);e.push(o);let l=1/o;r>a-Bi?l=ql[r-a+Bi-1]:r===0&&(l=0),n.push(l);const c=1/(o-2),h=-c,d=1+c,u=[h,h,d,h,d,d,h,h,d,d,h,d],p=6,g=6,v=3,f=2,m=1,y=new Float32Array(v*g*p),S=new Float32Array(f*g*p),x=new Float32Array(m*g*p);for(let E=0;E<p;E++){const w=E%3*2/3-1,C=E>2?0:-1,M=[w,C,0,w+2/3,C,0,w+2/3,C+1,0,w,C,0,w+2/3,C+1,0,w,C+1,0];y.set(M,v*g*E),S.set(u,f*g*E);const _=[E,E,E,E,E,E];x.set(_,m*g*E)}const T=new ge;T.setAttribute("position",new ze(y,v)),T.setAttribute("uv",new ze(S,f)),T.setAttribute("faceIndex",new ze(x,m)),t.push(T),i>Bi&&i--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function jl(a,t,e){const n=new gi(a,t,e);return n.texture.mapping=Oa,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ia(a,t,e,n,i){a.viewport.set(t,e,n,i),a.scissor.set(t,e,n,i)}function ym(a,t,e){const n=new Float32Array(ci),i=new L(0,1,0);return new xn({name:"SphericalGaussianBlur",defines:{n:ci,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${a}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:$o(),fragmentShader:`

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
		`,blending:$n,depthTest:!1,depthWrite:!1})}function Kl(){return new xn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:$o(),fragmentShader:`

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
		`,blending:$n,depthTest:!1,depthWrite:!1})}function Jl(){return new xn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:$o(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:$n,depthTest:!1,depthWrite:!1})}function $o(){return`

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
	`}function _m(a){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){const l=o.mapping,c=l===Jr||l===Qr,h=l===Xi||l===qi;if(c||h){let d=t.get(o);const u=d!==void 0?d.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==u)return e===null&&(e=new Zl(a)),d=c?e.fromEquirectangular(o,d):e.fromCubemap(o,d),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),d.texture;if(d!==void 0)return d.texture;{const p=o.image;return c&&p&&p.height>0||h&&p&&i(p)?(e===null&&(e=new Zl(a)),d=c?e.fromEquirectangular(o):e.fromCubemap(o),d.texture.pmremVersion=o.pmremVersion,t.set(o,d),o.addEventListener("dispose",s),d.texture):null}}}return o}function i(o){let l=0;const c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function s(o){const l=o.target;l.removeEventListener("dispose",s);const c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function r(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:r}}function Mm(a){const t={};function e(n){if(t[n]!==void 0)return t[n];let i;switch(n){case"WEBGL_depth_texture":i=a.getExtension("WEBGL_depth_texture")||a.getExtension("MOZ_WEBGL_depth_texture")||a.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=a.getExtension("EXT_texture_filter_anisotropic")||a.getExtension("MOZ_EXT_texture_filter_anisotropic")||a.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=a.getExtension("WEBGL_compressed_texture_s3tc")||a.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||a.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=a.getExtension("WEBGL_compressed_texture_pvrtc")||a.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=a.getExtension(n)}return t[n]=i,i}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const i=e(n);return i===null&&vs("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function Sm(a,t,e,n){const i={},s=new WeakMap;function r(d){const u=d.target;u.index!==null&&t.remove(u.index);for(const g in u.attributes)t.remove(u.attributes[g]);for(const g in u.morphAttributes){const v=u.morphAttributes[g];for(let f=0,m=v.length;f<m;f++)t.remove(v[f])}u.removeEventListener("dispose",r),delete i[u.id];const p=s.get(u);p&&(t.remove(p),s.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function o(d,u){return i[u.id]===!0||(u.addEventListener("dispose",r),i[u.id]=!0,e.memory.geometries++),u}function l(d){const u=d.attributes;for(const g in u)t.update(u[g],a.ARRAY_BUFFER);const p=d.morphAttributes;for(const g in p){const v=p[g];for(let f=0,m=v.length;f<m;f++)t.update(v[f],a.ARRAY_BUFFER)}}function c(d){const u=[],p=d.index,g=d.attributes.position;let v=0;if(p!==null){const y=p.array;v=p.version;for(let S=0,x=y.length;S<x;S+=3){const T=y[S+0],E=y[S+1],w=y[S+2];u.push(T,E,E,w,w,T)}}else if(g!==void 0){const y=g.array;v=g.version;for(let S=0,x=y.length/3-1;S<x;S+=3){const T=S+0,E=S+1,w=S+2;u.push(T,E,E,w,w,T)}}else return;const f=new(sh(u)?hh:ch)(u,1);f.version=v;const m=s.get(d);m&&t.remove(m),s.set(d,f)}function h(d){const u=s.get(d);if(u){const p=d.index;p!==null&&u.version<p.version&&c(d)}else c(d);return s.get(d)}return{get:o,update:l,getWireframeAttribute:h}}function wm(a,t,e){let n;function i(u){n=u}let s,r;function o(u){s=u.type,r=u.bytesPerElement}function l(u,p){a.drawElements(n,p,s,u*r),e.update(p,n,1)}function c(u,p,g){g!==0&&(a.drawElementsInstanced(n,p,s,u*r,g),e.update(p,n,g))}function h(u,p,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,p,0,s,u,0,g);let f=0;for(let m=0;m<g;m++)f+=p[m];e.update(f,n,1)}function d(u,p,g,v){if(g===0)return;const f=t.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<u.length;m++)c(u[m]/r,p[m],v[m]);else{f.multiDrawElementsInstancedWEBGL(n,p,0,s,u,0,v,0,g);let m=0;for(let y=0;y<g;y++)m+=p[y]*v[y];e.update(m,n,1)}}this.setMode=i,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h,this.renderMultiDrawInstances=d}function bm(a){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,r,o){switch(e.calls++,r){case a.TRIANGLES:e.triangles+=o*(s/3);break;case a.LINES:e.lines+=o*(s/2);break;case a.LINE_STRIP:e.lines+=o*(s-1);break;case a.LINE_LOOP:e.lines+=o*s;break;case a.POINTS:e.points+=o*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",r);break}}function i(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:i,update:n}}function Em(a,t,e){const n=new WeakMap,i=new me;function s(r,o,l){const c=r.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0;let u=n.get(o);if(u===void 0||u.count!==d){let _=function(){C.dispose(),n.delete(o),o.removeEventListener("dispose",_)};var p=_;u!==void 0&&u.texture.dispose();const g=o.morphAttributes.position!==void 0,v=o.morphAttributes.normal!==void 0,f=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],y=o.morphAttributes.normal||[],S=o.morphAttributes.color||[];let x=0;g===!0&&(x=1),v===!0&&(x=2),f===!0&&(x=3);let T=o.attributes.position.count*x,E=1;T>t.maxTextureSize&&(E=Math.ceil(T/t.maxTextureSize),T=t.maxTextureSize);const w=new Float32Array(T*E*4*d),C=new rh(w,T,E,d);C.type=vn,C.needsUpdate=!0;const M=x*4;for(let P=0;P<d;P++){const I=m[P],D=y[P],O=S[P],G=T*E*4*P;for(let H=0;H<I.count;H++){const Y=H*M;g===!0&&(i.fromBufferAttribute(I,H),w[G+Y+0]=i.x,w[G+Y+1]=i.y,w[G+Y+2]=i.z,w[G+Y+3]=0),v===!0&&(i.fromBufferAttribute(D,H),w[G+Y+4]=i.x,w[G+Y+5]=i.y,w[G+Y+6]=i.z,w[G+Y+7]=0),f===!0&&(i.fromBufferAttribute(O,H),w[G+Y+8]=i.x,w[G+Y+9]=i.y,w[G+Y+10]=i.z,w[G+Y+11]=O.itemSize===4?i.w:1)}}u={count:d,texture:C,size:new dt(T,E)},n.set(o,u),o.addEventListener("dispose",_)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)l.getUniforms().setValue(a,"morphTexture",r.morphTexture,e);else{let g=0;for(let f=0;f<c.length;f++)g+=c[f];const v=o.morphTargetsRelative?1:1-g;l.getUniforms().setValue(a,"morphTargetBaseInfluence",v),l.getUniforms().setValue(a,"morphTargetInfluences",c)}l.getUniforms().setValue(a,"morphTargetsTexture",u.texture,e),l.getUniforms().setValue(a,"morphTargetsTextureSize",u.size)}return{update:s}}function Tm(a,t,e,n){let i=new WeakMap;function s(l){const c=n.render.frame,h=l.geometry,d=t.get(l,h);if(i.get(d)!==c&&(t.update(d),i.set(d,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),i.get(l)!==c&&(e.update(l.instanceMatrix,a.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,a.ARRAY_BUFFER),i.set(l,c))),l.isSkinnedMesh){const u=l.skeleton;i.get(u)!==c&&(u.update(),i.set(u,c))}return d}function r(){i=new WeakMap}function o(l){const c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:s,dispose:r}}class gh extends ke{constructor(t,e,n,i,s,r,o,l,c,h=Hi){if(h!==Hi&&h!==Yi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===Hi&&(n=mi),n===void 0&&h===Yi&&(n=$i),super(null,i,s,r,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:Je,this.minFilter=l!==void 0?l:Je,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}}const vh=new ke,Ql=new gh(1,1),xh=new rh,yh=new du,_h=new fh,tc=[],ec=[],nc=new Float32Array(16),ic=new Float32Array(9),sc=new Float32Array(4);function Qi(a,t,e){const n=a[0];if(n<=0||n>0)return a;const i=t*e;let s=tc[i];if(s===void 0&&(s=new Float32Array(i),tc[i]=s),t!==0){n.toArray(s,0);for(let r=1,o=0;r!==t;++r)o+=e,a[r].toArray(s,o)}return s}function Ee(a,t){if(a.length!==t.length)return!1;for(let e=0,n=a.length;e<n;e++)if(a[e]!==t[e])return!1;return!0}function Te(a,t){for(let e=0,n=t.length;e<n;e++)a[e]=t[e]}function Ha(a,t){let e=ec[t];e===void 0&&(e=new Int32Array(t),ec[t]=e);for(let n=0;n!==t;++n)e[n]=a.allocateTextureUnit();return e}function Am(a,t){const e=this.cache;e[0]!==t&&(a.uniform1f(this.addr,t),e[0]=t)}function Cm(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(a.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;a.uniform2fv(this.addr,t),Te(e,t)}}function Rm(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(a.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(a.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(Ee(e,t))return;a.uniform3fv(this.addr,t),Te(e,t)}}function Pm(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(a.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;a.uniform4fv(this.addr,t),Te(e,t)}}function Lm(a,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;a.uniformMatrix2fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;sc.set(n),a.uniformMatrix2fv(this.addr,!1,sc),Te(e,n)}}function Im(a,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;a.uniformMatrix3fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;ic.set(n),a.uniformMatrix3fv(this.addr,!1,ic),Te(e,n)}}function Dm(a,t){const e=this.cache,n=t.elements;if(n===void 0){if(Ee(e,t))return;a.uniformMatrix4fv(this.addr,!1,t),Te(e,t)}else{if(Ee(e,n))return;nc.set(n),a.uniformMatrix4fv(this.addr,!1,nc),Te(e,n)}}function km(a,t){const e=this.cache;e[0]!==t&&(a.uniform1i(this.addr,t),e[0]=t)}function zm(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(a.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;a.uniform2iv(this.addr,t),Te(e,t)}}function Um(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(a.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;a.uniform3iv(this.addr,t),Te(e,t)}}function Nm(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(a.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;a.uniform4iv(this.addr,t),Te(e,t)}}function Fm(a,t){const e=this.cache;e[0]!==t&&(a.uniform1ui(this.addr,t),e[0]=t)}function Om(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(a.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(Ee(e,t))return;a.uniform2uiv(this.addr,t),Te(e,t)}}function Bm(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(a.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(Ee(e,t))return;a.uniform3uiv(this.addr,t),Te(e,t)}}function Hm(a,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(a.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(Ee(e,t))return;a.uniform4uiv(this.addr,t),Te(e,t)}}function Gm(a,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(a.uniform1i(this.addr,i),n[0]=i);let s;this.type===a.SAMPLER_2D_SHADOW?(Ql.compareFunction=ih,s=Ql):s=vh,e.setTexture2D(t||s,i)}function Vm(a,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(a.uniform1i(this.addr,i),n[0]=i),e.setTexture3D(t||yh,i)}function Wm(a,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(a.uniform1i(this.addr,i),n[0]=i),e.setTextureCube(t||_h,i)}function Xm(a,t,e){const n=this.cache,i=e.allocateTextureUnit();n[0]!==i&&(a.uniform1i(this.addr,i),n[0]=i),e.setTexture2DArray(t||xh,i)}function qm(a){switch(a){case 5126:return Am;case 35664:return Cm;case 35665:return Rm;case 35666:return Pm;case 35674:return Lm;case 35675:return Im;case 35676:return Dm;case 5124:case 35670:return km;case 35667:case 35671:return zm;case 35668:case 35672:return Um;case 35669:case 35673:return Nm;case 5125:return Fm;case 36294:return Om;case 36295:return Bm;case 36296:return Hm;case 35678:case 36198:case 36298:case 36306:case 35682:return Gm;case 35679:case 36299:case 36307:return Vm;case 35680:case 36300:case 36308:case 36293:return Wm;case 36289:case 36303:case 36311:case 36292:return Xm}}function $m(a,t){a.uniform1fv(this.addr,t)}function Ym(a,t){const e=Qi(t,this.size,2);a.uniform2fv(this.addr,e)}function Zm(a,t){const e=Qi(t,this.size,3);a.uniform3fv(this.addr,e)}function jm(a,t){const e=Qi(t,this.size,4);a.uniform4fv(this.addr,e)}function Km(a,t){const e=Qi(t,this.size,4);a.uniformMatrix2fv(this.addr,!1,e)}function Jm(a,t){const e=Qi(t,this.size,9);a.uniformMatrix3fv(this.addr,!1,e)}function Qm(a,t){const e=Qi(t,this.size,16);a.uniformMatrix4fv(this.addr,!1,e)}function t0(a,t){a.uniform1iv(this.addr,t)}function e0(a,t){a.uniform2iv(this.addr,t)}function n0(a,t){a.uniform3iv(this.addr,t)}function i0(a,t){a.uniform4iv(this.addr,t)}function s0(a,t){a.uniform1uiv(this.addr,t)}function a0(a,t){a.uniform2uiv(this.addr,t)}function r0(a,t){a.uniform3uiv(this.addr,t)}function o0(a,t){a.uniform4uiv(this.addr,t)}function l0(a,t,e){const n=this.cache,i=t.length,s=Ha(e,i);Ee(n,s)||(a.uniform1iv(this.addr,s),Te(n,s));for(let r=0;r!==i;++r)e.setTexture2D(t[r]||vh,s[r])}function c0(a,t,e){const n=this.cache,i=t.length,s=Ha(e,i);Ee(n,s)||(a.uniform1iv(this.addr,s),Te(n,s));for(let r=0;r!==i;++r)e.setTexture3D(t[r]||yh,s[r])}function h0(a,t,e){const n=this.cache,i=t.length,s=Ha(e,i);Ee(n,s)||(a.uniform1iv(this.addr,s),Te(n,s));for(let r=0;r!==i;++r)e.setTextureCube(t[r]||_h,s[r])}function d0(a,t,e){const n=this.cache,i=t.length,s=Ha(e,i);Ee(n,s)||(a.uniform1iv(this.addr,s),Te(n,s));for(let r=0;r!==i;++r)e.setTexture2DArray(t[r]||xh,s[r])}function u0(a){switch(a){case 5126:return $m;case 35664:return Ym;case 35665:return Zm;case 35666:return jm;case 35674:return Km;case 35675:return Jm;case 35676:return Qm;case 5124:case 35670:return t0;case 35667:case 35671:return e0;case 35668:case 35672:return n0;case 35669:case 35673:return i0;case 5125:return s0;case 36294:return a0;case 36295:return r0;case 36296:return o0;case 35678:case 36198:case 36298:case 36306:case 35682:return l0;case 35679:case 36299:case 36307:return c0;case 35680:case 36300:case 36308:case 36293:return h0;case 36289:case 36303:case 36311:case 36292:return d0}}class f0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=qm(e.type)}}class p0{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=u0(e.type)}}class m0{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const i=this.seq;for(let s=0,r=i.length;s!==r;++s){const o=i[s];o.setValue(t,e[o.id],n)}}}const Cr=/(\w+)(\])?(\[|\.)?/g;function ac(a,t){a.seq.push(t),a.map[t.id]=t}function g0(a,t,e){const n=a.name,i=n.length;for(Cr.lastIndex=0;;){const s=Cr.exec(n),r=Cr.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&r+2===i){ac(e,c===void 0?new f0(o,a,t):new p0(o,a,t));break}else{let d=e.map[o];d===void 0&&(d=new m0(o),ac(e,d)),e=d}}}class wa{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let i=0;i<n;++i){const s=t.getActiveUniform(e,i),r=t.getUniformLocation(e,s.name);g0(s,r,this)}}setValue(t,e,n,i){const s=this.map[e];s!==void 0&&s.setValue(t,n,i)}setOptional(t,e,n){const i=e[n];i!==void 0&&this.setValue(t,n,i)}static upload(t,e,n,i){for(let s=0,r=e.length;s!==r;++s){const o=e[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,i)}}static seqWithValue(t,e){const n=[];for(let i=0,s=t.length;i!==s;++i){const r=t[i];r.id in e&&n.push(r)}return n}}function rc(a,t,e){const n=a.createShader(t);return a.shaderSource(n,e),a.compileShader(n),n}const v0=37297;let x0=0;function y0(a,t){const e=a.split(`
`),n=[],i=Math.max(t-6,0),s=Math.min(t+6,e.length);for(let r=i;r<s;r++){const o=r+1;n.push(`${o===t?">":" "} ${o}: ${e[r]}`)}return n.join(`
`)}const oc=new Bt;function _0(a){Zt._getMatrix(oc,Zt.workingColorSpace,a);const t=`mat3( ${oc.elements.map(e=>e.toFixed(4))} )`;switch(Zt.getTransfer(a)){case Ba:return[t,"LinearTransferOETF"];case ae:return[t,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",a),[t,"LinearTransferOETF"]}}function lc(a,t,e){const n=a.getShaderParameter(t,a.COMPILE_STATUS),i=a.getShaderInfoLog(t).trim();if(n&&i==="")return"";const s=/ERROR: 0:(\d+)/.exec(i);if(s){const r=parseInt(s[1]);return e.toUpperCase()+`

`+i+`

`+y0(a.getShaderSource(t),r)}else return i}function M0(a,t){const e=_0(t);return[`vec4 ${a}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}function S0(a,t){let e;switch(t){case Od:e="Linear";break;case Bd:e="Reinhard";break;case Hd:e="Cineon";break;case qc:e="ACESFilmic";break;case Vd:e="AgX";break;case Wd:e="Neutral";break;case Gd:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+a+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const sa=new L;function w0(){Zt.getLuminanceCoefficients(sa);const a=sa.x.toFixed(4),t=sa.y.toFixed(4),e=sa.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${a}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function b0(a){return[a.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",a.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(xs).join(`
`)}function E0(a){const t=[];for(const e in a){const n=a[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function T0(a,t){const e={},n=a.getProgramParameter(t,a.ACTIVE_ATTRIBUTES);for(let i=0;i<n;i++){const s=a.getActiveAttrib(t,i),r=s.name;let o=1;s.type===a.FLOAT_MAT2&&(o=2),s.type===a.FLOAT_MAT3&&(o=3),s.type===a.FLOAT_MAT4&&(o=4),e[r]={type:s.type,location:a.getAttribLocation(t,r),locationSize:o}}return e}function xs(a){return a!==""}function cc(a,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return a.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function hc(a,t){return a.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const A0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Po(a){return a.replace(A0,R0)}const C0=new Map;function R0(a,t){let e=Gt[t];if(e===void 0){const n=C0.get(t);if(n!==void 0)e=Gt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return Po(e)}const P0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function dc(a){return a.replace(P0,L0)}function L0(a,t,e,n){let i="";for(let s=parseInt(t);s<parseInt(e);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function uc(a){let t=`precision ${a.precision} float;
	precision ${a.precision} int;
	precision ${a.precision} sampler2D;
	precision ${a.precision} samplerCube;
	precision ${a.precision} sampler3D;
	precision ${a.precision} sampler2DArray;
	precision ${a.precision} sampler2DShadow;
	precision ${a.precision} samplerCubeShadow;
	precision ${a.precision} sampler2DArrayShadow;
	precision ${a.precision} isampler2D;
	precision ${a.precision} isampler3D;
	precision ${a.precision} isamplerCube;
	precision ${a.precision} isampler2DArray;
	precision ${a.precision} usampler2D;
	precision ${a.precision} usampler3D;
	precision ${a.precision} usamplerCube;
	precision ${a.precision} usampler2DArray;
	`;return a.precision==="highp"?t+=`
#define HIGH_PRECISION`:a.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:a.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function I0(a){let t="SHADOWMAP_TYPE_BASIC";return a.shadowMapType===Wc?t="SHADOWMAP_TYPE_PCF":a.shadowMapType===Xc?t="SHADOWMAP_TYPE_PCF_SOFT":a.shadowMapType===An&&(t="SHADOWMAP_TYPE_VSM"),t}function D0(a){let t="ENVMAP_TYPE_CUBE";if(a.envMap)switch(a.envMapMode){case Xi:case qi:t="ENVMAP_TYPE_CUBE";break;case Oa:t="ENVMAP_TYPE_CUBE_UV";break}return t}function k0(a){let t="ENVMAP_MODE_REFLECTION";if(a.envMap)switch(a.envMapMode){case qi:t="ENVMAP_MODE_REFRACTION";break}return t}function z0(a){let t="ENVMAP_BLENDING_NONE";if(a.envMap)switch(a.combine){case Fa:t="ENVMAP_BLENDING_MULTIPLY";break;case Nd:t="ENVMAP_BLENDING_MIX";break;case Fd:t="ENVMAP_BLENDING_ADD";break}return t}function U0(a){const t=a.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function N0(a,t,e,n){const i=a.getContext(),s=e.defines;let r=e.vertexShader,o=e.fragmentShader;const l=I0(e),c=D0(e),h=k0(e),d=z0(e),u=U0(e),p=b0(e),g=E0(s),v=i.createProgram();let f,m,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(xs).join(`
`),f.length>0&&(f+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(xs).join(`
`),m.length>0&&(m+=`
`)):(f=[uc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(xs).join(`
`),m=[uc(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor||e.batchingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Yn?"#define TONE_MAPPING":"",e.toneMapping!==Yn?Gt.tonemapping_pars_fragment:"",e.toneMapping!==Yn?S0("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Gt.colorspace_pars_fragment,M0("linearToOutputTexel",e.outputColorSpace),w0(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(xs).join(`
`)),r=Po(r),r=cc(r,e),r=hc(r,e),o=Po(o),o=cc(o,e),o=hc(o,e),r=dc(r),o=dc(o),e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,f=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,m=["#define varying in",e.glslVersion===El?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===El?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const S=y+f+r,x=y+m+o,T=rc(i,i.VERTEX_SHADER,S),E=rc(i,i.FRAGMENT_SHADER,x);i.attachShader(v,T),i.attachShader(v,E),e.index0AttributeName!==void 0?i.bindAttribLocation(v,0,e.index0AttributeName):e.morphTargets===!0&&i.bindAttribLocation(v,0,"position"),i.linkProgram(v);function w(P){if(a.debug.checkShaderErrors){const I=i.getProgramInfoLog(v).trim(),D=i.getShaderInfoLog(T).trim(),O=i.getShaderInfoLog(E).trim();let G=!0,H=!0;if(i.getProgramParameter(v,i.LINK_STATUS)===!1)if(G=!1,typeof a.debug.onShaderError=="function")a.debug.onShaderError(i,v,T,E);else{const Y=lc(i,T,"vertex"),V=lc(i,E,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(v,i.VALIDATE_STATUS)+`

Material Name: `+P.name+`
Material Type: `+P.type+`

Program Info Log: `+I+`
`+Y+`
`+V)}else I!==""?console.warn("THREE.WebGLProgram: Program Info Log:",I):(D===""||O==="")&&(H=!1);H&&(P.diagnostics={runnable:G,programLog:I,vertexShader:{log:D,prefix:f},fragmentShader:{log:O,prefix:m}})}i.deleteShader(T),i.deleteShader(E),C=new wa(i,v),M=T0(i,v)}let C;this.getUniforms=function(){return C===void 0&&w(this),C};let M;this.getAttributes=function(){return M===void 0&&w(this),M};let _=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return _===!1&&(_=i.getProgramParameter(v,v0)),_},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=x0++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=T,this.fragmentShader=E,this}let F0=0;class O0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){const e=t.vertexShader,n=t.fragmentShader,i=this._getShaderStage(e),s=this._getShaderStage(n),r=this._getShaderCacheForMaterial(t);return r.has(i)===!1&&(r.add(i),i.usedTimes++),r.has(s)===!1&&(r.add(s),s.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new B0(t),e.set(t,n)),n}}class B0{constructor(t){this.id=F0++,this.code=t,this.usedTimes=0}}function H0(a,t,e,n,i,s,r){const o=new oh,l=new O0,c=new Set,h=[],d=i.logarithmicDepthBuffer,u=i.vertexTextures;let p=i.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function v(M){return c.add(M),M===0?"uv":`uv${M}`}function f(M,_,P,I,D){const O=I.fog,G=D.geometry,H=M.isMeshStandardMaterial?I.environment:null,Y=(M.isMeshStandardMaterial?e:t).get(M.envMap||H),V=Y&&Y.mapping===Oa?Y.image.height:null,at=g[M.type];M.precision!==null&&(p=i.getMaxPrecision(M.precision),p!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",p,"instead."));const lt=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,gt=lt!==void 0?lt.length:0;let Dt=0;G.morphAttributes.position!==void 0&&(Dt=1),G.morphAttributes.normal!==void 0&&(Dt=2),G.morphAttributes.color!==void 0&&(Dt=3);let $t,K,st,z;if(at){const ee=mn[at];$t=ee.vertexShader,K=ee.fragmentShader}else $t=M.vertexShader,K=M.fragmentShader,l.update(M),st=l.getVertexShaderID(M),z=l.getFragmentShaderID(M);const $=a.getRenderTarget(),tt=a.state.buffers.depth.getReversed(),vt=D.isInstancedMesh===!0,It=D.isBatchedMesh===!0,Kt=!!M.map,Vt=!!M.matcap,oe=!!Y,U=!!M.aoMap,Re=!!M.lightMap,kt=!!M.bumpMap,Wt=!!M.normalMap,At=!!M.displacementMap,ie=!!M.emissiveMap,St=!!M.metalnessMap,R=!!M.roughnessMap,b=M.anisotropy>0,B=M.clearcoat>0,j=M.dispersion>0,J=M.iridescence>0,Z=M.sheen>0,wt=M.transmission>0,rt=b&&!!M.anisotropyMap,xt=B&&!!M.clearcoatMap,Yt=B&&!!M.clearcoatNormalMap,et=B&&!!M.clearcoatRoughnessMap,yt=J&&!!M.iridescenceMap,Lt=J&&!!M.iridescenceThicknessMap,zt=Z&&!!M.sheenColorMap,_t=Z&&!!M.sheenRoughnessMap,qt=!!M.specularMap,Ht=!!M.specularColorMap,le=!!M.specularIntensityMap,k=wt&&!!M.transmissionMap,ht=wt&&!!M.thicknessMap,q=!!M.gradientMap,Q=!!M.alphaMap,mt=M.alphaTest>0,ut=!!M.alphaHash,Ft=!!M.extensions;let pe=Yn;M.toneMapped&&($===null||$.isXRRenderTarget===!0)&&(pe=a.toneMapping);const Le={shaderID:at,shaderType:M.type,shaderName:M.name,vertexShader:$t,fragmentShader:K,defines:M.defines,customVertexShaderID:st,customFragmentShaderID:z,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:p,batching:It,batchingColor:It&&D._colorsTexture!==null,instancing:vt,instancingColor:vt&&D.instanceColor!==null,instancingMorph:vt&&D.morphTexture!==null,supportsVertexTextures:u,outputColorSpace:$===null?a.outputColorSpace:$.isXRRenderTarget===!0?$.texture.colorSpace:ji,alphaToCoverage:!!M.alphaToCoverage,map:Kt,matcap:Vt,envMap:oe,envMapMode:oe&&Y.mapping,envMapCubeUVHeight:V,aoMap:U,lightMap:Re,bumpMap:kt,normalMap:Wt,displacementMap:u&&At,emissiveMap:ie,normalMapObjectSpace:Wt&&M.normalMapType===Yd,normalMapTangentSpace:Wt&&M.normalMapType===Wo,metalnessMap:St,roughnessMap:R,anisotropy:b,anisotropyMap:rt,clearcoat:B,clearcoatMap:xt,clearcoatNormalMap:Yt,clearcoatRoughnessMap:et,dispersion:j,iridescence:J,iridescenceMap:yt,iridescenceThicknessMap:Lt,sheen:Z,sheenColorMap:zt,sheenRoughnessMap:_t,specularMap:qt,specularColorMap:Ht,specularIntensityMap:le,transmission:wt,transmissionMap:k,thicknessMap:ht,gradientMap:q,opaque:M.transparent===!1&&M.blending===pi&&M.alphaToCoverage===!1,alphaMap:Q,alphaTest:mt,alphaHash:ut,combine:M.combine,mapUv:Kt&&v(M.map.channel),aoMapUv:U&&v(M.aoMap.channel),lightMapUv:Re&&v(M.lightMap.channel),bumpMapUv:kt&&v(M.bumpMap.channel),normalMapUv:Wt&&v(M.normalMap.channel),displacementMapUv:At&&v(M.displacementMap.channel),emissiveMapUv:ie&&v(M.emissiveMap.channel),metalnessMapUv:St&&v(M.metalnessMap.channel),roughnessMapUv:R&&v(M.roughnessMap.channel),anisotropyMapUv:rt&&v(M.anisotropyMap.channel),clearcoatMapUv:xt&&v(M.clearcoatMap.channel),clearcoatNormalMapUv:Yt&&v(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:et&&v(M.clearcoatRoughnessMap.channel),iridescenceMapUv:yt&&v(M.iridescenceMap.channel),iridescenceThicknessMapUv:Lt&&v(M.iridescenceThicknessMap.channel),sheenColorMapUv:zt&&v(M.sheenColorMap.channel),sheenRoughnessMapUv:_t&&v(M.sheenRoughnessMap.channel),specularMapUv:qt&&v(M.specularMap.channel),specularColorMapUv:Ht&&v(M.specularColorMap.channel),specularIntensityMapUv:le&&v(M.specularIntensityMap.channel),transmissionMapUv:k&&v(M.transmissionMap.channel),thicknessMapUv:ht&&v(M.thicknessMap.channel),alphaMapUv:Q&&v(M.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(Wt||b),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:D.isPoints===!0&&!!G.attributes.uv&&(Kt||Q),fog:!!O,useFog:M.fog===!0,fogExp2:!!O&&O.isFogExp2,flatShading:M.flatShading===!0,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:tt,skinning:D.isSkinnedMesh===!0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:gt,morphTextureStride:Dt,numDirLights:_.directional.length,numPointLights:_.point.length,numSpotLights:_.spot.length,numSpotLightMaps:_.spotLightMap.length,numRectAreaLights:_.rectArea.length,numHemiLights:_.hemi.length,numDirLightShadows:_.directionalShadowMap.length,numPointLightShadows:_.pointShadowMap.length,numSpotLightShadows:_.spotShadowMap.length,numSpotLightShadowsWithMaps:_.numSpotLightShadowsWithMaps,numLightProbes:_.numLightProbes,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:M.dithering,shadowMapEnabled:a.shadowMap.enabled&&P.length>0,shadowMapType:a.shadowMap.type,toneMapping:pe,decodeVideoTexture:Kt&&M.map.isVideoTexture===!0&&Zt.getTransfer(M.map.colorSpace)===ae,decodeVideoTextureEmissive:ie&&M.emissiveMap.isVideoTexture===!0&&Zt.getTransfer(M.emissiveMap.colorSpace)===ae,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===we,flipSided:M.side===Be,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:Ft&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ft&&M.extensions.multiDraw===!0||It)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return Le.vertexUv1s=c.has(1),Le.vertexUv2s=c.has(2),Le.vertexUv3s=c.has(3),c.clear(),Le}function m(M){const _=[];if(M.shaderID?_.push(M.shaderID):(_.push(M.customVertexShaderID),_.push(M.customFragmentShaderID)),M.defines!==void 0)for(const P in M.defines)_.push(P),_.push(M.defines[P]);return M.isRawShaderMaterial===!1&&(y(_,M),S(_,M),_.push(a.outputColorSpace)),_.push(M.customProgramCacheKey),_.join()}function y(M,_){M.push(_.precision),M.push(_.outputColorSpace),M.push(_.envMapMode),M.push(_.envMapCubeUVHeight),M.push(_.mapUv),M.push(_.alphaMapUv),M.push(_.lightMapUv),M.push(_.aoMapUv),M.push(_.bumpMapUv),M.push(_.normalMapUv),M.push(_.displacementMapUv),M.push(_.emissiveMapUv),M.push(_.metalnessMapUv),M.push(_.roughnessMapUv),M.push(_.anisotropyMapUv),M.push(_.clearcoatMapUv),M.push(_.clearcoatNormalMapUv),M.push(_.clearcoatRoughnessMapUv),M.push(_.iridescenceMapUv),M.push(_.iridescenceThicknessMapUv),M.push(_.sheenColorMapUv),M.push(_.sheenRoughnessMapUv),M.push(_.specularMapUv),M.push(_.specularColorMapUv),M.push(_.specularIntensityMapUv),M.push(_.transmissionMapUv),M.push(_.thicknessMapUv),M.push(_.combine),M.push(_.fogExp2),M.push(_.sizeAttenuation),M.push(_.morphTargetsCount),M.push(_.morphAttributeCount),M.push(_.numDirLights),M.push(_.numPointLights),M.push(_.numSpotLights),M.push(_.numSpotLightMaps),M.push(_.numHemiLights),M.push(_.numRectAreaLights),M.push(_.numDirLightShadows),M.push(_.numPointLightShadows),M.push(_.numSpotLightShadows),M.push(_.numSpotLightShadowsWithMaps),M.push(_.numLightProbes),M.push(_.shadowMapType),M.push(_.toneMapping),M.push(_.numClippingPlanes),M.push(_.numClipIntersection),M.push(_.depthPacking)}function S(M,_){o.disableAll(),_.supportsVertexTextures&&o.enable(0),_.instancing&&o.enable(1),_.instancingColor&&o.enable(2),_.instancingMorph&&o.enable(3),_.matcap&&o.enable(4),_.envMap&&o.enable(5),_.normalMapObjectSpace&&o.enable(6),_.normalMapTangentSpace&&o.enable(7),_.clearcoat&&o.enable(8),_.iridescence&&o.enable(9),_.alphaTest&&o.enable(10),_.vertexColors&&o.enable(11),_.vertexAlphas&&o.enable(12),_.vertexUv1s&&o.enable(13),_.vertexUv2s&&o.enable(14),_.vertexUv3s&&o.enable(15),_.vertexTangents&&o.enable(16),_.anisotropy&&o.enable(17),_.alphaHash&&o.enable(18),_.batching&&o.enable(19),_.dispersion&&o.enable(20),_.batchingColor&&o.enable(21),M.push(o.mask),o.disableAll(),_.fog&&o.enable(0),_.useFog&&o.enable(1),_.flatShading&&o.enable(2),_.logarithmicDepthBuffer&&o.enable(3),_.reverseDepthBuffer&&o.enable(4),_.skinning&&o.enable(5),_.morphTargets&&o.enable(6),_.morphNormals&&o.enable(7),_.morphColors&&o.enable(8),_.premultipliedAlpha&&o.enable(9),_.shadowMapEnabled&&o.enable(10),_.doubleSided&&o.enable(11),_.flipSided&&o.enable(12),_.useDepthPacking&&o.enable(13),_.dithering&&o.enable(14),_.transmission&&o.enable(15),_.sheen&&o.enable(16),_.opaque&&o.enable(17),_.pointsUvs&&o.enable(18),_.decodeVideoTexture&&o.enable(19),_.decodeVideoTextureEmissive&&o.enable(20),_.alphaToCoverage&&o.enable(21),M.push(o.mask)}function x(M){const _=g[M.type];let P;if(_){const I=mn[_];P=wu.clone(I.uniforms)}else P=M.uniforms;return P}function T(M,_){let P;for(let I=0,D=h.length;I<D;I++){const O=h[I];if(O.cacheKey===_){P=O,++P.usedTimes;break}}return P===void 0&&(P=new N0(a,_,M,s),h.push(P)),P}function E(M){if(--M.usedTimes===0){const _=h.indexOf(M);h[_]=h[h.length-1],h.pop(),M.destroy()}}function w(M){l.remove(M)}function C(){l.dispose()}return{getParameters:f,getProgramCacheKey:m,getUniforms:x,acquireProgram:T,releaseProgram:E,releaseShaderCache:w,programs:h,dispose:C}}function G0(){let a=new WeakMap;function t(r){return a.has(r)}function e(r){let o=a.get(r);return o===void 0&&(o={},a.set(r,o)),o}function n(r){a.delete(r)}function i(r,o,l){a.get(r)[o]=l}function s(){a=new WeakMap}return{has:t,get:e,remove:n,update:i,dispose:s}}function V0(a,t){return a.groupOrder!==t.groupOrder?a.groupOrder-t.groupOrder:a.renderOrder!==t.renderOrder?a.renderOrder-t.renderOrder:a.material.id!==t.material.id?a.material.id-t.material.id:a.z!==t.z?a.z-t.z:a.id-t.id}function fc(a,t){return a.groupOrder!==t.groupOrder?a.groupOrder-t.groupOrder:a.renderOrder!==t.renderOrder?a.renderOrder-t.renderOrder:a.z!==t.z?t.z-a.z:a.id-t.id}function pc(){const a=[];let t=0;const e=[],n=[],i=[];function s(){t=0,e.length=0,n.length=0,i.length=0}function r(d,u,p,g,v,f){let m=a[t];return m===void 0?(m={id:d.id,object:d,geometry:u,material:p,groupOrder:g,renderOrder:d.renderOrder,z:v,group:f},a[t]=m):(m.id=d.id,m.object=d,m.geometry=u,m.material=p,m.groupOrder=g,m.renderOrder=d.renderOrder,m.z=v,m.group=f),t++,m}function o(d,u,p,g,v,f){const m=r(d,u,p,g,v,f);p.transmission>0?n.push(m):p.transparent===!0?i.push(m):e.push(m)}function l(d,u,p,g,v,f){const m=r(d,u,p,g,v,f);p.transmission>0?n.unshift(m):p.transparent===!0?i.unshift(m):e.unshift(m)}function c(d,u){e.length>1&&e.sort(d||V0),n.length>1&&n.sort(u||fc),i.length>1&&i.sort(u||fc)}function h(){for(let d=t,u=a.length;d<u;d++){const p=a[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:e,transmissive:n,transparent:i,init:s,push:o,unshift:l,finish:h,sort:c}}function W0(){let a=new WeakMap;function t(n,i){const s=a.get(n);let r;return s===void 0?(r=new pc,a.set(n,[r])):i>=s.length?(r=new pc,s.push(r)):r=s[i],r}function e(){a=new WeakMap}return{get:t,dispose:e}}function X0(){const a={};return{get:function(t){if(a[t.id]!==void 0)return a[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new L,color:new ct};break;case"SpotLight":e={position:new L,direction:new L,color:new ct,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new L,color:new ct,distance:0,decay:0};break;case"HemisphereLight":e={direction:new L,skyColor:new ct,groundColor:new ct};break;case"RectAreaLight":e={color:new ct,position:new L,halfWidth:new L,halfHeight:new L};break}return a[t.id]=e,e}}}function q0(){const a={};return{get:function(t){if(a[t.id]!==void 0)return a[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt,shadowCameraNear:1,shadowCameraFar:1e3};break}return a[t.id]=e,e}}}let $0=0;function Y0(a,t){return(t.castShadow?2:0)-(a.castShadow?2:0)+(t.map?1:0)-(a.map?1:0)}function Z0(a){const t=new X0,e=q0(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new L);const i=new L,s=new te,r=new te;function o(c){let h=0,d=0,u=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let p=0,g=0,v=0,f=0,m=0,y=0,S=0,x=0,T=0,E=0,w=0;c.sort(Y0);for(let M=0,_=c.length;M<_;M++){const P=c[M],I=P.color,D=P.intensity,O=P.distance,G=P.shadow&&P.shadow.map?P.shadow.map.texture:null;if(P.isAmbientLight)h+=I.r*D,d+=I.g*D,u+=I.b*D;else if(P.isLightProbe){for(let H=0;H<9;H++)n.probe[H].addScaledVector(P.sh.coefficients[H],D);w++}else if(P.isDirectionalLight){const H=t.get(P);if(H.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const Y=P.shadow,V=e.get(P);V.shadowIntensity=Y.intensity,V.shadowBias=Y.bias,V.shadowNormalBias=Y.normalBias,V.shadowRadius=Y.radius,V.shadowMapSize=Y.mapSize,n.directionalShadow[p]=V,n.directionalShadowMap[p]=G,n.directionalShadowMatrix[p]=P.shadow.matrix,y++}n.directional[p]=H,p++}else if(P.isSpotLight){const H=t.get(P);H.position.setFromMatrixPosition(P.matrixWorld),H.color.copy(I).multiplyScalar(D),H.distance=O,H.coneCos=Math.cos(P.angle),H.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),H.decay=P.decay,n.spot[v]=H;const Y=P.shadow;if(P.map&&(n.spotLightMap[T]=P.map,T++,Y.updateMatrices(P),P.castShadow&&E++),n.spotLightMatrix[v]=Y.matrix,P.castShadow){const V=e.get(P);V.shadowIntensity=Y.intensity,V.shadowBias=Y.bias,V.shadowNormalBias=Y.normalBias,V.shadowRadius=Y.radius,V.shadowMapSize=Y.mapSize,n.spotShadow[v]=V,n.spotShadowMap[v]=G,x++}v++}else if(P.isRectAreaLight){const H=t.get(P);H.color.copy(I).multiplyScalar(D),H.halfWidth.set(P.width*.5,0,0),H.halfHeight.set(0,P.height*.5,0),n.rectArea[f]=H,f++}else if(P.isPointLight){const H=t.get(P);if(H.color.copy(P.color).multiplyScalar(P.intensity),H.distance=P.distance,H.decay=P.decay,P.castShadow){const Y=P.shadow,V=e.get(P);V.shadowIntensity=Y.intensity,V.shadowBias=Y.bias,V.shadowNormalBias=Y.normalBias,V.shadowRadius=Y.radius,V.shadowMapSize=Y.mapSize,V.shadowCameraNear=Y.camera.near,V.shadowCameraFar=Y.camera.far,n.pointShadow[g]=V,n.pointShadowMap[g]=G,n.pointShadowMatrix[g]=P.shadow.matrix,S++}n.point[g]=H,g++}else if(P.isHemisphereLight){const H=t.get(P);H.skyColor.copy(P.color).multiplyScalar(D),H.groundColor.copy(P.groundColor).multiplyScalar(D),n.hemi[m]=H,m++}}f>0&&(a.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ot.LTC_FLOAT_1,n.rectAreaLTC2=ot.LTC_FLOAT_2):(n.rectAreaLTC1=ot.LTC_HALF_1,n.rectAreaLTC2=ot.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;const C=n.hash;(C.directionalLength!==p||C.pointLength!==g||C.spotLength!==v||C.rectAreaLength!==f||C.hemiLength!==m||C.numDirectionalShadows!==y||C.numPointShadows!==S||C.numSpotShadows!==x||C.numSpotMaps!==T||C.numLightProbes!==w)&&(n.directional.length=p,n.spot.length=v,n.rectArea.length=f,n.point.length=g,n.hemi.length=m,n.directionalShadow.length=y,n.directionalShadowMap.length=y,n.pointShadow.length=S,n.pointShadowMap.length=S,n.spotShadow.length=x,n.spotShadowMap.length=x,n.directionalShadowMatrix.length=y,n.pointShadowMatrix.length=S,n.spotLightMatrix.length=x+T-E,n.spotLightMap.length=T,n.numSpotLightShadowsWithMaps=E,n.numLightProbes=w,C.directionalLength=p,C.pointLength=g,C.spotLength=v,C.rectAreaLength=f,C.hemiLength=m,C.numDirectionalShadows=y,C.numPointShadows=S,C.numSpotShadows=x,C.numSpotMaps=T,C.numLightProbes=w,n.version=$0++)}function l(c,h){let d=0,u=0,p=0,g=0,v=0;const f=h.matrixWorldInverse;for(let m=0,y=c.length;m<y;m++){const S=c[m];if(S.isDirectionalLight){const x=n.directional[d];x.direction.setFromMatrixPosition(S.matrixWorld),i.setFromMatrixPosition(S.target.matrixWorld),x.direction.sub(i),x.direction.transformDirection(f),d++}else if(S.isSpotLight){const x=n.spot[p];x.position.setFromMatrixPosition(S.matrixWorld),x.position.applyMatrix4(f),x.direction.setFromMatrixPosition(S.matrixWorld),i.setFromMatrixPosition(S.target.matrixWorld),x.direction.sub(i),x.direction.transformDirection(f),p++}else if(S.isRectAreaLight){const x=n.rectArea[g];x.position.setFromMatrixPosition(S.matrixWorld),x.position.applyMatrix4(f),r.identity(),s.copy(S.matrixWorld),s.premultiply(f),r.extractRotation(s),x.halfWidth.set(S.width*.5,0,0),x.halfHeight.set(0,S.height*.5,0),x.halfWidth.applyMatrix4(r),x.halfHeight.applyMatrix4(r),g++}else if(S.isPointLight){const x=n.point[u];x.position.setFromMatrixPosition(S.matrixWorld),x.position.applyMatrix4(f),u++}else if(S.isHemisphereLight){const x=n.hemi[v];x.direction.setFromMatrixPosition(S.matrixWorld),x.direction.transformDirection(f),v++}}}return{setup:o,setupView:l,state:n}}function mc(a){const t=new Z0(a),e=[],n=[];function i(h){c.camera=h,e.length=0,n.length=0}function s(h){e.push(h)}function r(h){n.push(h)}function o(){t.setup(e)}function l(h){t.setupView(e,h)}const c={lightsArray:e,shadowsArray:n,camera:null,lights:t,transmissionRenderTarget:{}};return{init:i,state:c,setupLights:o,setupLightsView:l,pushLight:s,pushShadow:r}}function j0(a){let t=new WeakMap;function e(i,s=0){const r=t.get(i);let o;return r===void 0?(o=new mc(a),t.set(i,[o])):s>=r.length?(o=new mc(a),r.push(o)):o=r[s],o}function n(){t=new WeakMap}return{get:e,dispose:n}}class K0 extends Dn{static get type(){return"MeshDepthMaterial"}constructor(t){super(),this.isMeshDepthMaterial=!0,this.depthPacking=qd,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class J0 extends Dn{static get type(){return"MeshDistanceMaterial"}constructor(t){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const Q0=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,tg=`uniform sampler2D shadow_pass;
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
}`;function eg(a,t,e){let n=new qo;const i=new dt,s=new dt,r=new me,o=new K0({depthPacking:$d}),l=new J0,c={},h=e.maxTextureSize,d={[jn]:Be,[Be]:jn,[we]:we},u=new xn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new dt},radius:{value:4}},vertexShader:Q0,fragmentShader:tg}),p=u.clone();p.defines.HORIZONTAL_PASS=1;const g=new ge;g.setAttribute("position",new ze(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new Pt(g,u),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Wc;let m=this.type;this.render=function(E,w,C){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||E.length===0)return;const M=a.getRenderTarget(),_=a.getActiveCubeFace(),P=a.getActiveMipmapLevel(),I=a.state;I.setBlending($n),I.buffers.color.setClear(1,1,1,1),I.buffers.depth.setTest(!0),I.setScissorTest(!1);const D=m!==An&&this.type===An,O=m===An&&this.type!==An;for(let G=0,H=E.length;G<H;G++){const Y=E[G],V=Y.shadow;if(V===void 0){console.warn("THREE.WebGLShadowMap:",Y,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;i.copy(V.mapSize);const at=V.getFrameExtents();if(i.multiply(at),s.copy(V.mapSize),(i.x>h||i.y>h)&&(i.x>h&&(s.x=Math.floor(h/at.x),i.x=s.x*at.x,V.mapSize.x=s.x),i.y>h&&(s.y=Math.floor(h/at.y),i.y=s.y*at.y,V.mapSize.y=s.y)),V.map===null||D===!0||O===!0){const gt=this.type!==An?{minFilter:Je,magFilter:Je}:{};V.map!==null&&V.map.dispose(),V.map=new gi(i.x,i.y,gt),V.map.texture.name=Y.name+".shadowMap",V.camera.updateProjectionMatrix()}a.setRenderTarget(V.map),a.clear();const lt=V.getViewportCount();for(let gt=0;gt<lt;gt++){const Dt=V.getViewport(gt);r.set(s.x*Dt.x,s.y*Dt.y,s.x*Dt.z,s.y*Dt.w),I.viewport(r),V.updateMatrices(Y,gt),n=V.getFrustum(),x(w,C,V.camera,Y,this.type)}V.isPointLightShadow!==!0&&this.type===An&&y(V,C),V.needsUpdate=!1}m=this.type,f.needsUpdate=!1,a.setRenderTarget(M,_,P)};function y(E,w){const C=t.update(v);u.defines.VSM_SAMPLES!==E.blurSamples&&(u.defines.VSM_SAMPLES=E.blurSamples,p.defines.VSM_SAMPLES=E.blurSamples,u.needsUpdate=!0,p.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new gi(i.x,i.y)),u.uniforms.shadow_pass.value=E.map.texture,u.uniforms.resolution.value=E.mapSize,u.uniforms.radius.value=E.radius,a.setRenderTarget(E.mapPass),a.clear(),a.renderBufferDirect(w,null,C,u,v,null),p.uniforms.shadow_pass.value=E.mapPass.texture,p.uniforms.resolution.value=E.mapSize,p.uniforms.radius.value=E.radius,a.setRenderTarget(E.map),a.clear(),a.renderBufferDirect(w,null,C,p,v,null)}function S(E,w,C,M){let _=null;const P=C.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(P!==void 0)_=P;else if(_=C.isPointLight===!0?l:o,a.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0){const I=_.uuid,D=w.uuid;let O=c[I];O===void 0&&(O={},c[I]=O);let G=O[D];G===void 0&&(G=_.clone(),O[D]=G,w.addEventListener("dispose",T)),_=G}if(_.visible=w.visible,_.wireframe=w.wireframe,M===An?_.side=w.shadowSide!==null?w.shadowSide:w.side:_.side=w.shadowSide!==null?w.shadowSide:d[w.side],_.alphaMap=w.alphaMap,_.alphaTest=w.alphaTest,_.map=w.map,_.clipShadows=w.clipShadows,_.clippingPlanes=w.clippingPlanes,_.clipIntersection=w.clipIntersection,_.displacementMap=w.displacementMap,_.displacementScale=w.displacementScale,_.displacementBias=w.displacementBias,_.wireframeLinewidth=w.wireframeLinewidth,_.linewidth=w.linewidth,C.isPointLight===!0&&_.isMeshDistanceMaterial===!0){const I=a.properties.get(_);I.light=C}return _}function x(E,w,C,M,_){if(E.visible===!1)return;if(E.layers.test(w.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&_===An)&&(!E.frustumCulled||n.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(C.matrixWorldInverse,E.matrixWorld);const D=t.update(E),O=E.material;if(Array.isArray(O)){const G=D.groups;for(let H=0,Y=G.length;H<Y;H++){const V=G[H],at=O[V.materialIndex];if(at&&at.visible){const lt=S(E,at,M,_);E.onBeforeShadow(a,E,w,C,D,lt,V),a.renderBufferDirect(C,null,D,lt,E,V),E.onAfterShadow(a,E,w,C,D,lt,V)}}}else if(O.visible){const G=S(E,O,M,_);E.onBeforeShadow(a,E,w,C,D,G,null),a.renderBufferDirect(C,null,D,G,E,null),E.onAfterShadow(a,E,w,C,D,G,null)}}const I=E.children;for(let D=0,O=I.length;D<O;D++)x(I[D],w,C,M,_)}function T(E){E.target.removeEventListener("dispose",T);for(const C in c){const M=c[C],_=E.target.uuid;_ in M&&(M[_].dispose(),delete M[_])}}}const ng={[Xr]:qr,[$r]:jr,[Yr]:Kr,[Wi]:Zr,[qr]:Xr,[jr]:$r,[Kr]:Yr,[Zr]:Wi};function ig(a,t){function e(){let k=!1;const ht=new me;let q=null;const Q=new me(0,0,0,0);return{setMask:function(mt){q!==mt&&!k&&(a.colorMask(mt,mt,mt,mt),q=mt)},setLocked:function(mt){k=mt},setClear:function(mt,ut,Ft,pe,Le){Le===!0&&(mt*=pe,ut*=pe,Ft*=pe),ht.set(mt,ut,Ft,pe),Q.equals(ht)===!1&&(a.clearColor(mt,ut,Ft,pe),Q.copy(ht))},reset:function(){k=!1,q=null,Q.set(-1,0,0,0)}}}function n(){let k=!1,ht=!1,q=null,Q=null,mt=null;return{setReversed:function(ut){if(ht!==ut){const Ft=t.get("EXT_clip_control");ht?Ft.clipControlEXT(Ft.LOWER_LEFT_EXT,Ft.ZERO_TO_ONE_EXT):Ft.clipControlEXT(Ft.LOWER_LEFT_EXT,Ft.NEGATIVE_ONE_TO_ONE_EXT);const pe=mt;mt=null,this.setClear(pe)}ht=ut},getReversed:function(){return ht},setTest:function(ut){ut?$(a.DEPTH_TEST):tt(a.DEPTH_TEST)},setMask:function(ut){q!==ut&&!k&&(a.depthMask(ut),q=ut)},setFunc:function(ut){if(ht&&(ut=ng[ut]),Q!==ut){switch(ut){case Xr:a.depthFunc(a.NEVER);break;case qr:a.depthFunc(a.ALWAYS);break;case $r:a.depthFunc(a.LESS);break;case Wi:a.depthFunc(a.LEQUAL);break;case Yr:a.depthFunc(a.EQUAL);break;case Zr:a.depthFunc(a.GEQUAL);break;case jr:a.depthFunc(a.GREATER);break;case Kr:a.depthFunc(a.NOTEQUAL);break;default:a.depthFunc(a.LEQUAL)}Q=ut}},setLocked:function(ut){k=ut},setClear:function(ut){mt!==ut&&(ht&&(ut=1-ut),a.clearDepth(ut),mt=ut)},reset:function(){k=!1,q=null,Q=null,mt=null,ht=!1}}}function i(){let k=!1,ht=null,q=null,Q=null,mt=null,ut=null,Ft=null,pe=null,Le=null;return{setTest:function(ee){k||(ee?$(a.STENCIL_TEST):tt(a.STENCIL_TEST))},setMask:function(ee){ht!==ee&&!k&&(a.stencilMask(ee),ht=ee)},setFunc:function(ee,rn,_n){(q!==ee||Q!==rn||mt!==_n)&&(a.stencilFunc(ee,rn,_n),q=ee,Q=rn,mt=_n)},setOp:function(ee,rn,_n){(ut!==ee||Ft!==rn||pe!==_n)&&(a.stencilOp(ee,rn,_n),ut=ee,Ft=rn,pe=_n)},setLocked:function(ee){k=ee},setClear:function(ee){Le!==ee&&(a.clearStencil(ee),Le=ee)},reset:function(){k=!1,ht=null,q=null,Q=null,mt=null,ut=null,Ft=null,pe=null,Le=null}}}const s=new e,r=new n,o=new i,l=new WeakMap,c=new WeakMap;let h={},d={},u=new WeakMap,p=[],g=null,v=!1,f=null,m=null,y=null,S=null,x=null,T=null,E=null,w=new ct(0,0,0),C=0,M=!1,_=null,P=null,I=null,D=null,O=null;const G=a.getParameter(a.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let H=!1,Y=0;const V=a.getParameter(a.VERSION);V.indexOf("WebGL")!==-1?(Y=parseFloat(/^WebGL (\d)/.exec(V)[1]),H=Y>=1):V.indexOf("OpenGL ES")!==-1&&(Y=parseFloat(/^OpenGL ES (\d)/.exec(V)[1]),H=Y>=2);let at=null,lt={};const gt=a.getParameter(a.SCISSOR_BOX),Dt=a.getParameter(a.VIEWPORT),$t=new me().fromArray(gt),K=new me().fromArray(Dt);function st(k,ht,q,Q){const mt=new Uint8Array(4),ut=a.createTexture();a.bindTexture(k,ut),a.texParameteri(k,a.TEXTURE_MIN_FILTER,a.NEAREST),a.texParameteri(k,a.TEXTURE_MAG_FILTER,a.NEAREST);for(let Ft=0;Ft<q;Ft++)k===a.TEXTURE_3D||k===a.TEXTURE_2D_ARRAY?a.texImage3D(ht,0,a.RGBA,1,1,Q,0,a.RGBA,a.UNSIGNED_BYTE,mt):a.texImage2D(ht+Ft,0,a.RGBA,1,1,0,a.RGBA,a.UNSIGNED_BYTE,mt);return ut}const z={};z[a.TEXTURE_2D]=st(a.TEXTURE_2D,a.TEXTURE_2D,1),z[a.TEXTURE_CUBE_MAP]=st(a.TEXTURE_CUBE_MAP,a.TEXTURE_CUBE_MAP_POSITIVE_X,6),z[a.TEXTURE_2D_ARRAY]=st(a.TEXTURE_2D_ARRAY,a.TEXTURE_2D_ARRAY,1,1),z[a.TEXTURE_3D]=st(a.TEXTURE_3D,a.TEXTURE_3D,1,1),s.setClear(0,0,0,1),r.setClear(1),o.setClear(0),$(a.DEPTH_TEST),r.setFunc(Wi),kt(!1),Wt(Ml),$(a.CULL_FACE),U($n);function $(k){h[k]!==!0&&(a.enable(k),h[k]=!0)}function tt(k){h[k]!==!1&&(a.disable(k),h[k]=!1)}function vt(k,ht){return d[k]!==ht?(a.bindFramebuffer(k,ht),d[k]=ht,k===a.DRAW_FRAMEBUFFER&&(d[a.FRAMEBUFFER]=ht),k===a.FRAMEBUFFER&&(d[a.DRAW_FRAMEBUFFER]=ht),!0):!1}function It(k,ht){let q=p,Q=!1;if(k){q=u.get(ht),q===void 0&&(q=[],u.set(ht,q));const mt=k.textures;if(q.length!==mt.length||q[0]!==a.COLOR_ATTACHMENT0){for(let ut=0,Ft=mt.length;ut<Ft;ut++)q[ut]=a.COLOR_ATTACHMENT0+ut;q.length=mt.length,Q=!0}}else q[0]!==a.BACK&&(q[0]=a.BACK,Q=!0);Q&&a.drawBuffers(q)}function Kt(k){return g!==k?(a.useProgram(k),g=k,!0):!1}const Vt={[li]:a.FUNC_ADD,[_d]:a.FUNC_SUBTRACT,[Md]:a.FUNC_REVERSE_SUBTRACT};Vt[Sd]=a.MIN,Vt[wd]=a.MAX;const oe={[bd]:a.ZERO,[Ed]:a.ONE,[Td]:a.SRC_COLOR,[Vr]:a.SRC_ALPHA,[Id]:a.SRC_ALPHA_SATURATE,[Pd]:a.DST_COLOR,[Cd]:a.DST_ALPHA,[Ad]:a.ONE_MINUS_SRC_COLOR,[Wr]:a.ONE_MINUS_SRC_ALPHA,[Ld]:a.ONE_MINUS_DST_COLOR,[Rd]:a.ONE_MINUS_DST_ALPHA,[Dd]:a.CONSTANT_COLOR,[kd]:a.ONE_MINUS_CONSTANT_COLOR,[zd]:a.CONSTANT_ALPHA,[Ud]:a.ONE_MINUS_CONSTANT_ALPHA};function U(k,ht,q,Q,mt,ut,Ft,pe,Le,ee){if(k===$n){v===!0&&(tt(a.BLEND),v=!1);return}if(v===!1&&($(a.BLEND),v=!0),k!==yd){if(k!==f||ee!==M){if((m!==li||x!==li)&&(a.blendEquation(a.FUNC_ADD),m=li,x=li),ee)switch(k){case pi:a.blendFuncSeparate(a.ONE,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA);break;case di:a.blendFunc(a.ONE,a.ONE);break;case Sl:a.blendFuncSeparate(a.ZERO,a.ONE_MINUS_SRC_COLOR,a.ZERO,a.ONE);break;case wl:a.blendFuncSeparate(a.ZERO,a.SRC_COLOR,a.ZERO,a.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}else switch(k){case pi:a.blendFuncSeparate(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA);break;case di:a.blendFunc(a.SRC_ALPHA,a.ONE);break;case Sl:a.blendFuncSeparate(a.ZERO,a.ONE_MINUS_SRC_COLOR,a.ZERO,a.ONE);break;case wl:a.blendFunc(a.ZERO,a.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",k);break}y=null,S=null,T=null,E=null,w.set(0,0,0),C=0,f=k,M=ee}return}mt=mt||ht,ut=ut||q,Ft=Ft||Q,(ht!==m||mt!==x)&&(a.blendEquationSeparate(Vt[ht],Vt[mt]),m=ht,x=mt),(q!==y||Q!==S||ut!==T||Ft!==E)&&(a.blendFuncSeparate(oe[q],oe[Q],oe[ut],oe[Ft]),y=q,S=Q,T=ut,E=Ft),(pe.equals(w)===!1||Le!==C)&&(a.blendColor(pe.r,pe.g,pe.b,Le),w.copy(pe),C=Le),f=k,M=!1}function Re(k,ht){k.side===we?tt(a.CULL_FACE):$(a.CULL_FACE);let q=k.side===Be;ht&&(q=!q),kt(q),k.blending===pi&&k.transparent===!1?U($n):U(k.blending,k.blendEquation,k.blendSrc,k.blendDst,k.blendEquationAlpha,k.blendSrcAlpha,k.blendDstAlpha,k.blendColor,k.blendAlpha,k.premultipliedAlpha),r.setFunc(k.depthFunc),r.setTest(k.depthTest),r.setMask(k.depthWrite),s.setMask(k.colorWrite);const Q=k.stencilWrite;o.setTest(Q),Q&&(o.setMask(k.stencilWriteMask),o.setFunc(k.stencilFunc,k.stencilRef,k.stencilFuncMask),o.setOp(k.stencilFail,k.stencilZFail,k.stencilZPass)),ie(k.polygonOffset,k.polygonOffsetFactor,k.polygonOffsetUnits),k.alphaToCoverage===!0?$(a.SAMPLE_ALPHA_TO_COVERAGE):tt(a.SAMPLE_ALPHA_TO_COVERAGE)}function kt(k){_!==k&&(k?a.frontFace(a.CW):a.frontFace(a.CCW),_=k)}function Wt(k){k!==vd?($(a.CULL_FACE),k!==P&&(k===Ml?a.cullFace(a.BACK):k===xd?a.cullFace(a.FRONT):a.cullFace(a.FRONT_AND_BACK))):tt(a.CULL_FACE),P=k}function At(k){k!==I&&(H&&a.lineWidth(k),I=k)}function ie(k,ht,q){k?($(a.POLYGON_OFFSET_FILL),(D!==ht||O!==q)&&(a.polygonOffset(ht,q),D=ht,O=q)):tt(a.POLYGON_OFFSET_FILL)}function St(k){k?$(a.SCISSOR_TEST):tt(a.SCISSOR_TEST)}function R(k){k===void 0&&(k=a.TEXTURE0+G-1),at!==k&&(a.activeTexture(k),at=k)}function b(k,ht,q){q===void 0&&(at===null?q=a.TEXTURE0+G-1:q=at);let Q=lt[q];Q===void 0&&(Q={type:void 0,texture:void 0},lt[q]=Q),(Q.type!==k||Q.texture!==ht)&&(at!==q&&(a.activeTexture(q),at=q),a.bindTexture(k,ht||z[k]),Q.type=k,Q.texture=ht)}function B(){const k=lt[at];k!==void 0&&k.type!==void 0&&(a.bindTexture(k.type,null),k.type=void 0,k.texture=void 0)}function j(){try{a.compressedTexImage2D.apply(a,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function J(){try{a.compressedTexImage3D.apply(a,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Z(){try{a.texSubImage2D.apply(a,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function wt(){try{a.texSubImage3D.apply(a,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function rt(){try{a.compressedTexSubImage2D.apply(a,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function xt(){try{a.compressedTexSubImage3D.apply(a,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Yt(){try{a.texStorage2D.apply(a,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function et(){try{a.texStorage3D.apply(a,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function yt(){try{a.texImage2D.apply(a,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function Lt(){try{a.texImage3D.apply(a,arguments)}catch(k){console.error("THREE.WebGLState:",k)}}function zt(k){$t.equals(k)===!1&&(a.scissor(k.x,k.y,k.z,k.w),$t.copy(k))}function _t(k){K.equals(k)===!1&&(a.viewport(k.x,k.y,k.z,k.w),K.copy(k))}function qt(k,ht){let q=c.get(ht);q===void 0&&(q=new WeakMap,c.set(ht,q));let Q=q.get(k);Q===void 0&&(Q=a.getUniformBlockIndex(ht,k.name),q.set(k,Q))}function Ht(k,ht){const Q=c.get(ht).get(k);l.get(ht)!==Q&&(a.uniformBlockBinding(ht,Q,k.__bindingPointIndex),l.set(ht,Q))}function le(){a.disable(a.BLEND),a.disable(a.CULL_FACE),a.disable(a.DEPTH_TEST),a.disable(a.POLYGON_OFFSET_FILL),a.disable(a.SCISSOR_TEST),a.disable(a.STENCIL_TEST),a.disable(a.SAMPLE_ALPHA_TO_COVERAGE),a.blendEquation(a.FUNC_ADD),a.blendFunc(a.ONE,a.ZERO),a.blendFuncSeparate(a.ONE,a.ZERO,a.ONE,a.ZERO),a.blendColor(0,0,0,0),a.colorMask(!0,!0,!0,!0),a.clearColor(0,0,0,0),a.depthMask(!0),a.depthFunc(a.LESS),r.setReversed(!1),a.clearDepth(1),a.stencilMask(4294967295),a.stencilFunc(a.ALWAYS,0,4294967295),a.stencilOp(a.KEEP,a.KEEP,a.KEEP),a.clearStencil(0),a.cullFace(a.BACK),a.frontFace(a.CCW),a.polygonOffset(0,0),a.activeTexture(a.TEXTURE0),a.bindFramebuffer(a.FRAMEBUFFER,null),a.bindFramebuffer(a.DRAW_FRAMEBUFFER,null),a.bindFramebuffer(a.READ_FRAMEBUFFER,null),a.useProgram(null),a.lineWidth(1),a.scissor(0,0,a.canvas.width,a.canvas.height),a.viewport(0,0,a.canvas.width,a.canvas.height),h={},at=null,lt={},d={},u=new WeakMap,p=[],g=null,v=!1,f=null,m=null,y=null,S=null,x=null,T=null,E=null,w=new ct(0,0,0),C=0,M=!1,_=null,P=null,I=null,D=null,O=null,$t.set(0,0,a.canvas.width,a.canvas.height),K.set(0,0,a.canvas.width,a.canvas.height),s.reset(),r.reset(),o.reset()}return{buffers:{color:s,depth:r,stencil:o},enable:$,disable:tt,bindFramebuffer:vt,drawBuffers:It,useProgram:Kt,setBlending:U,setMaterial:Re,setFlipSided:kt,setCullFace:Wt,setLineWidth:At,setPolygonOffset:ie,setScissorTest:St,activeTexture:R,bindTexture:b,unbindTexture:B,compressedTexImage2D:j,compressedTexImage3D:J,texImage2D:yt,texImage3D:Lt,updateUBOMapping:qt,uniformBlockBinding:Ht,texStorage2D:Yt,texStorage3D:et,texSubImage2D:Z,texSubImage3D:wt,compressedTexSubImage2D:rt,compressedTexSubImage3D:xt,scissor:zt,viewport:_t,reset:le}}function gc(a,t,e,n){const i=sg(n);switch(e){case Kc:return a*t;case Qc:return a*t;case th:return a*t*2;case Bo:return a*t/i.components*i.byteLength;case Ho:return a*t/i.components*i.byteLength;case eh:return a*t*2/i.components*i.byteLength;case Go:return a*t*2/i.components*i.byteLength;case Jc:return a*t*3/i.components*i.byteLength;case sn:return a*t*4/i.components*i.byteLength;case Vo:return a*t*4/i.components*i.byteLength;case xa:case ya:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*8;case _a:case Ma:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*16;case no:case so:return Math.max(a,16)*Math.max(t,8)/4;case eo:case io:return Math.max(a,8)*Math.max(t,8)/2;case ao:case ro:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*8;case oo:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*16;case lo:return Math.floor((a+3)/4)*Math.floor((t+3)/4)*16;case co:return Math.floor((a+4)/5)*Math.floor((t+3)/4)*16;case ho:return Math.floor((a+4)/5)*Math.floor((t+4)/5)*16;case uo:return Math.floor((a+5)/6)*Math.floor((t+4)/5)*16;case fo:return Math.floor((a+5)/6)*Math.floor((t+5)/6)*16;case po:return Math.floor((a+7)/8)*Math.floor((t+4)/5)*16;case mo:return Math.floor((a+7)/8)*Math.floor((t+5)/6)*16;case go:return Math.floor((a+7)/8)*Math.floor((t+7)/8)*16;case vo:return Math.floor((a+9)/10)*Math.floor((t+4)/5)*16;case xo:return Math.floor((a+9)/10)*Math.floor((t+5)/6)*16;case yo:return Math.floor((a+9)/10)*Math.floor((t+7)/8)*16;case _o:return Math.floor((a+9)/10)*Math.floor((t+9)/10)*16;case Mo:return Math.floor((a+11)/12)*Math.floor((t+9)/10)*16;case So:return Math.floor((a+11)/12)*Math.floor((t+11)/12)*16;case Sa:case wo:case bo:return Math.ceil(a/4)*Math.ceil(t/4)*16;case nh:case Eo:return Math.ceil(a/4)*Math.ceil(t/4)*8;case To:case Ao:return Math.ceil(a/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function sg(a){switch(a){case In:case Yc:return{byteLength:1,components:1};case Es:case Zc:case Cs:return{byteLength:2,components:1};case Fo:case Oo:return{byteLength:2,components:4};case mi:case No:case vn:return{byteLength:4,components:1};case jc:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${a}.`)}function ag(a,t,e,n,i,s,r){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new dt,h=new WeakMap;let d;const u=new WeakMap;let p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function g(R,b){return p?new OffscreenCanvas(R,b):Pa("canvas")}function v(R,b,B){let j=1;const J=St(R);if((J.width>B||J.height>B)&&(j=B/Math.max(J.width,J.height)),j<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){const Z=Math.floor(j*J.width),wt=Math.floor(j*J.height);d===void 0&&(d=g(Z,wt));const rt=b?g(Z,wt):d;return rt.width=Z,rt.height=wt,rt.getContext("2d").drawImage(R,0,0,Z,wt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+Z+"x"+wt+")."),rt}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),R;return R}function f(R){return R.generateMipmaps}function m(R){a.generateMipmap(R)}function y(R){return R.isWebGLCubeRenderTarget?a.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?a.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?a.TEXTURE_2D_ARRAY:a.TEXTURE_2D}function S(R,b,B,j,J=!1){if(R!==null){if(a[R]!==void 0)return a[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let Z=b;if(b===a.RED&&(B===a.FLOAT&&(Z=a.R32F),B===a.HALF_FLOAT&&(Z=a.R16F),B===a.UNSIGNED_BYTE&&(Z=a.R8)),b===a.RED_INTEGER&&(B===a.UNSIGNED_BYTE&&(Z=a.R8UI),B===a.UNSIGNED_SHORT&&(Z=a.R16UI),B===a.UNSIGNED_INT&&(Z=a.R32UI),B===a.BYTE&&(Z=a.R8I),B===a.SHORT&&(Z=a.R16I),B===a.INT&&(Z=a.R32I)),b===a.RG&&(B===a.FLOAT&&(Z=a.RG32F),B===a.HALF_FLOAT&&(Z=a.RG16F),B===a.UNSIGNED_BYTE&&(Z=a.RG8)),b===a.RG_INTEGER&&(B===a.UNSIGNED_BYTE&&(Z=a.RG8UI),B===a.UNSIGNED_SHORT&&(Z=a.RG16UI),B===a.UNSIGNED_INT&&(Z=a.RG32UI),B===a.BYTE&&(Z=a.RG8I),B===a.SHORT&&(Z=a.RG16I),B===a.INT&&(Z=a.RG32I)),b===a.RGB_INTEGER&&(B===a.UNSIGNED_BYTE&&(Z=a.RGB8UI),B===a.UNSIGNED_SHORT&&(Z=a.RGB16UI),B===a.UNSIGNED_INT&&(Z=a.RGB32UI),B===a.BYTE&&(Z=a.RGB8I),B===a.SHORT&&(Z=a.RGB16I),B===a.INT&&(Z=a.RGB32I)),b===a.RGBA_INTEGER&&(B===a.UNSIGNED_BYTE&&(Z=a.RGBA8UI),B===a.UNSIGNED_SHORT&&(Z=a.RGBA16UI),B===a.UNSIGNED_INT&&(Z=a.RGBA32UI),B===a.BYTE&&(Z=a.RGBA8I),B===a.SHORT&&(Z=a.RGBA16I),B===a.INT&&(Z=a.RGBA32I)),b===a.RGB&&B===a.UNSIGNED_INT_5_9_9_9_REV&&(Z=a.RGB9_E5),b===a.RGBA){const wt=J?Ba:Zt.getTransfer(j);B===a.FLOAT&&(Z=a.RGBA32F),B===a.HALF_FLOAT&&(Z=a.RGBA16F),B===a.UNSIGNED_BYTE&&(Z=wt===ae?a.SRGB8_ALPHA8:a.RGBA8),B===a.UNSIGNED_SHORT_4_4_4_4&&(Z=a.RGBA4),B===a.UNSIGNED_SHORT_5_5_5_1&&(Z=a.RGB5_A1)}return(Z===a.R16F||Z===a.R32F||Z===a.RG16F||Z===a.RG32F||Z===a.RGBA16F||Z===a.RGBA32F)&&t.get("EXT_color_buffer_float"),Z}function x(R,b){let B;return R?b===null||b===mi||b===$i?B=a.DEPTH24_STENCIL8:b===vn?B=a.DEPTH32F_STENCIL8:b===Es&&(B=a.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):b===null||b===mi||b===$i?B=a.DEPTH_COMPONENT24:b===vn?B=a.DEPTH_COMPONENT32F:b===Es&&(B=a.DEPTH_COMPONENT16),B}function T(R,b){return f(R)===!0||R.isFramebufferTexture&&R.minFilter!==Je&&R.minFilter!==dn?Math.log2(Math.max(b.width,b.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?b.mipmaps.length:1}function E(R){const b=R.target;b.removeEventListener("dispose",E),C(b),b.isVideoTexture&&h.delete(b)}function w(R){const b=R.target;b.removeEventListener("dispose",w),_(b)}function C(R){const b=n.get(R);if(b.__webglInit===void 0)return;const B=R.source,j=u.get(B);if(j){const J=j[b.__cacheKey];J.usedTimes--,J.usedTimes===0&&M(R),Object.keys(j).length===0&&u.delete(B)}n.remove(R)}function M(R){const b=n.get(R);a.deleteTexture(b.__webglTexture);const B=R.source,j=u.get(B);delete j[b.__cacheKey],r.memory.textures--}function _(R){const b=n.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),n.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(b.__webglFramebuffer[j]))for(let J=0;J<b.__webglFramebuffer[j].length;J++)a.deleteFramebuffer(b.__webglFramebuffer[j][J]);else a.deleteFramebuffer(b.__webglFramebuffer[j]);b.__webglDepthbuffer&&a.deleteRenderbuffer(b.__webglDepthbuffer[j])}else{if(Array.isArray(b.__webglFramebuffer))for(let j=0;j<b.__webglFramebuffer.length;j++)a.deleteFramebuffer(b.__webglFramebuffer[j]);else a.deleteFramebuffer(b.__webglFramebuffer);if(b.__webglDepthbuffer&&a.deleteRenderbuffer(b.__webglDepthbuffer),b.__webglMultisampledFramebuffer&&a.deleteFramebuffer(b.__webglMultisampledFramebuffer),b.__webglColorRenderbuffer)for(let j=0;j<b.__webglColorRenderbuffer.length;j++)b.__webglColorRenderbuffer[j]&&a.deleteRenderbuffer(b.__webglColorRenderbuffer[j]);b.__webglDepthRenderbuffer&&a.deleteRenderbuffer(b.__webglDepthRenderbuffer)}const B=R.textures;for(let j=0,J=B.length;j<J;j++){const Z=n.get(B[j]);Z.__webglTexture&&(a.deleteTexture(Z.__webglTexture),r.memory.textures--),n.remove(B[j])}n.remove(R)}let P=0;function I(){P=0}function D(){const R=P;return R>=i.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+i.maxTextures),P+=1,R}function O(R){const b=[];return b.push(R.wrapS),b.push(R.wrapT),b.push(R.wrapR||0),b.push(R.magFilter),b.push(R.minFilter),b.push(R.anisotropy),b.push(R.internalFormat),b.push(R.format),b.push(R.type),b.push(R.generateMipmaps),b.push(R.premultiplyAlpha),b.push(R.flipY),b.push(R.unpackAlignment),b.push(R.colorSpace),b.join()}function G(R,b){const B=n.get(R);if(R.isVideoTexture&&At(R),R.isRenderTargetTexture===!1&&R.version>0&&B.__version!==R.version){const j=R.image;if(j===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{K(B,R,b);return}}e.bindTexture(a.TEXTURE_2D,B.__webglTexture,a.TEXTURE0+b)}function H(R,b){const B=n.get(R);if(R.version>0&&B.__version!==R.version){K(B,R,b);return}e.bindTexture(a.TEXTURE_2D_ARRAY,B.__webglTexture,a.TEXTURE0+b)}function Y(R,b){const B=n.get(R);if(R.version>0&&B.__version!==R.version){K(B,R,b);return}e.bindTexture(a.TEXTURE_3D,B.__webglTexture,a.TEXTURE0+b)}function V(R,b){const B=n.get(R);if(R.version>0&&B.__version!==R.version){st(B,R,b);return}e.bindTexture(a.TEXTURE_CUBE_MAP,B.__webglTexture,a.TEXTURE0+b)}const at={[Ca]:a.REPEAT,[ui]:a.CLAMP_TO_EDGE,[to]:a.MIRRORED_REPEAT},lt={[Je]:a.NEAREST,[Xd]:a.NEAREST_MIPMAP_NEAREST,[Fs]:a.NEAREST_MIPMAP_LINEAR,[dn]:a.LINEAR,[tr]:a.LINEAR_MIPMAP_NEAREST,[Xn]:a.LINEAR_MIPMAP_LINEAR},gt={[Zd]:a.NEVER,[eu]:a.ALWAYS,[jd]:a.LESS,[ih]:a.LEQUAL,[Kd]:a.EQUAL,[tu]:a.GEQUAL,[Jd]:a.GREATER,[Qd]:a.NOTEQUAL};function Dt(R,b){if(b.type===vn&&t.has("OES_texture_float_linear")===!1&&(b.magFilter===dn||b.magFilter===tr||b.magFilter===Fs||b.magFilter===Xn||b.minFilter===dn||b.minFilter===tr||b.minFilter===Fs||b.minFilter===Xn)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),a.texParameteri(R,a.TEXTURE_WRAP_S,at[b.wrapS]),a.texParameteri(R,a.TEXTURE_WRAP_T,at[b.wrapT]),(R===a.TEXTURE_3D||R===a.TEXTURE_2D_ARRAY)&&a.texParameteri(R,a.TEXTURE_WRAP_R,at[b.wrapR]),a.texParameteri(R,a.TEXTURE_MAG_FILTER,lt[b.magFilter]),a.texParameteri(R,a.TEXTURE_MIN_FILTER,lt[b.minFilter]),b.compareFunction&&(a.texParameteri(R,a.TEXTURE_COMPARE_MODE,a.COMPARE_REF_TO_TEXTURE),a.texParameteri(R,a.TEXTURE_COMPARE_FUNC,gt[b.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(b.magFilter===Je||b.minFilter!==Fs&&b.minFilter!==Xn||b.type===vn&&t.has("OES_texture_float_linear")===!1)return;if(b.anisotropy>1||n.get(b).__currentAnisotropy){const B=t.get("EXT_texture_filter_anisotropic");a.texParameterf(R,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(b.anisotropy,i.getMaxAnisotropy())),n.get(b).__currentAnisotropy=b.anisotropy}}}function $t(R,b){let B=!1;R.__webglInit===void 0&&(R.__webglInit=!0,b.addEventListener("dispose",E));const j=b.source;let J=u.get(j);J===void 0&&(J={},u.set(j,J));const Z=O(b);if(Z!==R.__cacheKey){J[Z]===void 0&&(J[Z]={texture:a.createTexture(),usedTimes:0},r.memory.textures++,B=!0),J[Z].usedTimes++;const wt=J[R.__cacheKey];wt!==void 0&&(J[R.__cacheKey].usedTimes--,wt.usedTimes===0&&M(b)),R.__cacheKey=Z,R.__webglTexture=J[Z].texture}return B}function K(R,b,B){let j=a.TEXTURE_2D;(b.isDataArrayTexture||b.isCompressedArrayTexture)&&(j=a.TEXTURE_2D_ARRAY),b.isData3DTexture&&(j=a.TEXTURE_3D);const J=$t(R,b),Z=b.source;e.bindTexture(j,R.__webglTexture,a.TEXTURE0+B);const wt=n.get(Z);if(Z.version!==wt.__version||J===!0){e.activeTexture(a.TEXTURE0+B);const rt=Zt.getPrimaries(Zt.workingColorSpace),xt=b.colorSpace===Wn?null:Zt.getPrimaries(b.colorSpace),Yt=b.colorSpace===Wn||rt===xt?a.NONE:a.BROWSER_DEFAULT_WEBGL;a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,b.flipY),a.pixelStorei(a.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),a.pixelStorei(a.UNPACK_ALIGNMENT,b.unpackAlignment),a.pixelStorei(a.UNPACK_COLORSPACE_CONVERSION_WEBGL,Yt);let et=v(b.image,!1,i.maxTextureSize);et=ie(b,et);const yt=s.convert(b.format,b.colorSpace),Lt=s.convert(b.type);let zt=S(b.internalFormat,yt,Lt,b.colorSpace,b.isVideoTexture);Dt(j,b);let _t;const qt=b.mipmaps,Ht=b.isVideoTexture!==!0,le=wt.__version===void 0||J===!0,k=Z.dataReady,ht=T(b,et);if(b.isDepthTexture)zt=x(b.format===Yi,b.type),le&&(Ht?e.texStorage2D(a.TEXTURE_2D,1,zt,et.width,et.height):e.texImage2D(a.TEXTURE_2D,0,zt,et.width,et.height,0,yt,Lt,null));else if(b.isDataTexture)if(qt.length>0){Ht&&le&&e.texStorage2D(a.TEXTURE_2D,ht,zt,qt[0].width,qt[0].height);for(let q=0,Q=qt.length;q<Q;q++)_t=qt[q],Ht?k&&e.texSubImage2D(a.TEXTURE_2D,q,0,0,_t.width,_t.height,yt,Lt,_t.data):e.texImage2D(a.TEXTURE_2D,q,zt,_t.width,_t.height,0,yt,Lt,_t.data);b.generateMipmaps=!1}else Ht?(le&&e.texStorage2D(a.TEXTURE_2D,ht,zt,et.width,et.height),k&&e.texSubImage2D(a.TEXTURE_2D,0,0,0,et.width,et.height,yt,Lt,et.data)):e.texImage2D(a.TEXTURE_2D,0,zt,et.width,et.height,0,yt,Lt,et.data);else if(b.isCompressedTexture)if(b.isCompressedArrayTexture){Ht&&le&&e.texStorage3D(a.TEXTURE_2D_ARRAY,ht,zt,qt[0].width,qt[0].height,et.depth);for(let q=0,Q=qt.length;q<Q;q++)if(_t=qt[q],b.format!==sn)if(yt!==null)if(Ht){if(k)if(b.layerUpdates.size>0){const mt=gc(_t.width,_t.height,b.format,b.type);for(const ut of b.layerUpdates){const Ft=_t.data.subarray(ut*mt/_t.data.BYTES_PER_ELEMENT,(ut+1)*mt/_t.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(a.TEXTURE_2D_ARRAY,q,0,0,ut,_t.width,_t.height,1,yt,Ft)}b.clearLayerUpdates()}else e.compressedTexSubImage3D(a.TEXTURE_2D_ARRAY,q,0,0,0,_t.width,_t.height,et.depth,yt,_t.data)}else e.compressedTexImage3D(a.TEXTURE_2D_ARRAY,q,zt,_t.width,_t.height,et.depth,0,_t.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ht?k&&e.texSubImage3D(a.TEXTURE_2D_ARRAY,q,0,0,0,_t.width,_t.height,et.depth,yt,Lt,_t.data):e.texImage3D(a.TEXTURE_2D_ARRAY,q,zt,_t.width,_t.height,et.depth,0,yt,Lt,_t.data)}else{Ht&&le&&e.texStorage2D(a.TEXTURE_2D,ht,zt,qt[0].width,qt[0].height);for(let q=0,Q=qt.length;q<Q;q++)_t=qt[q],b.format!==sn?yt!==null?Ht?k&&e.compressedTexSubImage2D(a.TEXTURE_2D,q,0,0,_t.width,_t.height,yt,_t.data):e.compressedTexImage2D(a.TEXTURE_2D,q,zt,_t.width,_t.height,0,_t.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ht?k&&e.texSubImage2D(a.TEXTURE_2D,q,0,0,_t.width,_t.height,yt,Lt,_t.data):e.texImage2D(a.TEXTURE_2D,q,zt,_t.width,_t.height,0,yt,Lt,_t.data)}else if(b.isDataArrayTexture)if(Ht){if(le&&e.texStorage3D(a.TEXTURE_2D_ARRAY,ht,zt,et.width,et.height,et.depth),k)if(b.layerUpdates.size>0){const q=gc(et.width,et.height,b.format,b.type);for(const Q of b.layerUpdates){const mt=et.data.subarray(Q*q/et.data.BYTES_PER_ELEMENT,(Q+1)*q/et.data.BYTES_PER_ELEMENT);e.texSubImage3D(a.TEXTURE_2D_ARRAY,0,0,0,Q,et.width,et.height,1,yt,Lt,mt)}b.clearLayerUpdates()}else e.texSubImage3D(a.TEXTURE_2D_ARRAY,0,0,0,0,et.width,et.height,et.depth,yt,Lt,et.data)}else e.texImage3D(a.TEXTURE_2D_ARRAY,0,zt,et.width,et.height,et.depth,0,yt,Lt,et.data);else if(b.isData3DTexture)Ht?(le&&e.texStorage3D(a.TEXTURE_3D,ht,zt,et.width,et.height,et.depth),k&&e.texSubImage3D(a.TEXTURE_3D,0,0,0,0,et.width,et.height,et.depth,yt,Lt,et.data)):e.texImage3D(a.TEXTURE_3D,0,zt,et.width,et.height,et.depth,0,yt,Lt,et.data);else if(b.isFramebufferTexture){if(le)if(Ht)e.texStorage2D(a.TEXTURE_2D,ht,zt,et.width,et.height);else{let q=et.width,Q=et.height;for(let mt=0;mt<ht;mt++)e.texImage2D(a.TEXTURE_2D,mt,zt,q,Q,0,yt,Lt,null),q>>=1,Q>>=1}}else if(qt.length>0){if(Ht&&le){const q=St(qt[0]);e.texStorage2D(a.TEXTURE_2D,ht,zt,q.width,q.height)}for(let q=0,Q=qt.length;q<Q;q++)_t=qt[q],Ht?k&&e.texSubImage2D(a.TEXTURE_2D,q,0,0,yt,Lt,_t):e.texImage2D(a.TEXTURE_2D,q,zt,yt,Lt,_t);b.generateMipmaps=!1}else if(Ht){if(le){const q=St(et);e.texStorage2D(a.TEXTURE_2D,ht,zt,q.width,q.height)}k&&e.texSubImage2D(a.TEXTURE_2D,0,0,0,yt,Lt,et)}else e.texImage2D(a.TEXTURE_2D,0,zt,yt,Lt,et);f(b)&&m(j),wt.__version=Z.version,b.onUpdate&&b.onUpdate(b)}R.__version=b.version}function st(R,b,B){if(b.image.length!==6)return;const j=$t(R,b),J=b.source;e.bindTexture(a.TEXTURE_CUBE_MAP,R.__webglTexture,a.TEXTURE0+B);const Z=n.get(J);if(J.version!==Z.__version||j===!0){e.activeTexture(a.TEXTURE0+B);const wt=Zt.getPrimaries(Zt.workingColorSpace),rt=b.colorSpace===Wn?null:Zt.getPrimaries(b.colorSpace),xt=b.colorSpace===Wn||wt===rt?a.NONE:a.BROWSER_DEFAULT_WEBGL;a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,b.flipY),a.pixelStorei(a.UNPACK_PREMULTIPLY_ALPHA_WEBGL,b.premultiplyAlpha),a.pixelStorei(a.UNPACK_ALIGNMENT,b.unpackAlignment),a.pixelStorei(a.UNPACK_COLORSPACE_CONVERSION_WEBGL,xt);const Yt=b.isCompressedTexture||b.image[0].isCompressedTexture,et=b.image[0]&&b.image[0].isDataTexture,yt=[];for(let Q=0;Q<6;Q++)!Yt&&!et?yt[Q]=v(b.image[Q],!0,i.maxCubemapSize):yt[Q]=et?b.image[Q].image:b.image[Q],yt[Q]=ie(b,yt[Q]);const Lt=yt[0],zt=s.convert(b.format,b.colorSpace),_t=s.convert(b.type),qt=S(b.internalFormat,zt,_t,b.colorSpace),Ht=b.isVideoTexture!==!0,le=Z.__version===void 0||j===!0,k=J.dataReady;let ht=T(b,Lt);Dt(a.TEXTURE_CUBE_MAP,b);let q;if(Yt){Ht&&le&&e.texStorage2D(a.TEXTURE_CUBE_MAP,ht,qt,Lt.width,Lt.height);for(let Q=0;Q<6;Q++){q=yt[Q].mipmaps;for(let mt=0;mt<q.length;mt++){const ut=q[mt];b.format!==sn?zt!==null?Ht?k&&e.compressedTexSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt,0,0,ut.width,ut.height,zt,ut.data):e.compressedTexImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt,qt,ut.width,ut.height,0,ut.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ht?k&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt,0,0,ut.width,ut.height,zt,_t,ut.data):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt,qt,ut.width,ut.height,0,zt,_t,ut.data)}}}else{if(q=b.mipmaps,Ht&&le){q.length>0&&ht++;const Q=St(yt[0]);e.texStorage2D(a.TEXTURE_CUBE_MAP,ht,qt,Q.width,Q.height)}for(let Q=0;Q<6;Q++)if(et){Ht?k&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,yt[Q].width,yt[Q].height,zt,_t,yt[Q].data):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,qt,yt[Q].width,yt[Q].height,0,zt,_t,yt[Q].data);for(let mt=0;mt<q.length;mt++){const Ft=q[mt].image[Q].image;Ht?k&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt+1,0,0,Ft.width,Ft.height,zt,_t,Ft.data):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt+1,qt,Ft.width,Ft.height,0,zt,_t,Ft.data)}}else{Ht?k&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,0,0,zt,_t,yt[Q]):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,0,qt,zt,_t,yt[Q]);for(let mt=0;mt<q.length;mt++){const ut=q[mt];Ht?k&&e.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt+1,0,0,zt,_t,ut.image[Q]):e.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Q,mt+1,qt,zt,_t,ut.image[Q])}}}f(b)&&m(a.TEXTURE_CUBE_MAP),Z.__version=J.version,b.onUpdate&&b.onUpdate(b)}R.__version=b.version}function z(R,b,B,j,J,Z){const wt=s.convert(B.format,B.colorSpace),rt=s.convert(B.type),xt=S(B.internalFormat,wt,rt,B.colorSpace),Yt=n.get(b),et=n.get(B);if(et.__renderTarget=b,!Yt.__hasExternalTextures){const yt=Math.max(1,b.width>>Z),Lt=Math.max(1,b.height>>Z);J===a.TEXTURE_3D||J===a.TEXTURE_2D_ARRAY?e.texImage3D(J,Z,xt,yt,Lt,b.depth,0,wt,rt,null):e.texImage2D(J,Z,xt,yt,Lt,0,wt,rt,null)}e.bindFramebuffer(a.FRAMEBUFFER,R),Wt(b)?o.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,j,J,et.__webglTexture,0,kt(b)):(J===a.TEXTURE_2D||J>=a.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=a.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&a.framebufferTexture2D(a.FRAMEBUFFER,j,J,et.__webglTexture,Z),e.bindFramebuffer(a.FRAMEBUFFER,null)}function $(R,b,B){if(a.bindRenderbuffer(a.RENDERBUFFER,R),b.depthBuffer){const j=b.depthTexture,J=j&&j.isDepthTexture?j.type:null,Z=x(b.stencilBuffer,J),wt=b.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,rt=kt(b);Wt(b)?o.renderbufferStorageMultisampleEXT(a.RENDERBUFFER,rt,Z,b.width,b.height):B?a.renderbufferStorageMultisample(a.RENDERBUFFER,rt,Z,b.width,b.height):a.renderbufferStorage(a.RENDERBUFFER,Z,b.width,b.height),a.framebufferRenderbuffer(a.FRAMEBUFFER,wt,a.RENDERBUFFER,R)}else{const j=b.textures;for(let J=0;J<j.length;J++){const Z=j[J],wt=s.convert(Z.format,Z.colorSpace),rt=s.convert(Z.type),xt=S(Z.internalFormat,wt,rt,Z.colorSpace),Yt=kt(b);B&&Wt(b)===!1?a.renderbufferStorageMultisample(a.RENDERBUFFER,Yt,xt,b.width,b.height):Wt(b)?o.renderbufferStorageMultisampleEXT(a.RENDERBUFFER,Yt,xt,b.width,b.height):a.renderbufferStorage(a.RENDERBUFFER,xt,b.width,b.height)}}a.bindRenderbuffer(a.RENDERBUFFER,null)}function tt(R,b){if(b&&b.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(a.FRAMEBUFFER,R),!(b.depthTexture&&b.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const j=n.get(b.depthTexture);j.__renderTarget=b,(!j.__webglTexture||b.depthTexture.image.width!==b.width||b.depthTexture.image.height!==b.height)&&(b.depthTexture.image.width=b.width,b.depthTexture.image.height=b.height,b.depthTexture.needsUpdate=!0),G(b.depthTexture,0);const J=j.__webglTexture,Z=kt(b);if(b.depthTexture.format===Hi)Wt(b)?o.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,a.DEPTH_ATTACHMENT,a.TEXTURE_2D,J,0,Z):a.framebufferTexture2D(a.FRAMEBUFFER,a.DEPTH_ATTACHMENT,a.TEXTURE_2D,J,0);else if(b.depthTexture.format===Yi)Wt(b)?o.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,a.DEPTH_STENCIL_ATTACHMENT,a.TEXTURE_2D,J,0,Z):a.framebufferTexture2D(a.FRAMEBUFFER,a.DEPTH_STENCIL_ATTACHMENT,a.TEXTURE_2D,J,0);else throw new Error("Unknown depthTexture format")}function vt(R){const b=n.get(R),B=R.isWebGLCubeRenderTarget===!0;if(b.__boundDepthTexture!==R.depthTexture){const j=R.depthTexture;if(b.__depthDisposeCallback&&b.__depthDisposeCallback(),j){const J=()=>{delete b.__boundDepthTexture,delete b.__depthDisposeCallback,j.removeEventListener("dispose",J)};j.addEventListener("dispose",J),b.__depthDisposeCallback=J}b.__boundDepthTexture=j}if(R.depthTexture&&!b.__autoAllocateDepthBuffer){if(B)throw new Error("target.depthTexture not supported in Cube render targets");tt(b.__webglFramebuffer,R)}else if(B){b.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(e.bindFramebuffer(a.FRAMEBUFFER,b.__webglFramebuffer[j]),b.__webglDepthbuffer[j]===void 0)b.__webglDepthbuffer[j]=a.createRenderbuffer(),$(b.__webglDepthbuffer[j],R,!1);else{const J=R.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,Z=b.__webglDepthbuffer[j];a.bindRenderbuffer(a.RENDERBUFFER,Z),a.framebufferRenderbuffer(a.FRAMEBUFFER,J,a.RENDERBUFFER,Z)}}else if(e.bindFramebuffer(a.FRAMEBUFFER,b.__webglFramebuffer),b.__webglDepthbuffer===void 0)b.__webglDepthbuffer=a.createRenderbuffer(),$(b.__webglDepthbuffer,R,!1);else{const j=R.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,J=b.__webglDepthbuffer;a.bindRenderbuffer(a.RENDERBUFFER,J),a.framebufferRenderbuffer(a.FRAMEBUFFER,j,a.RENDERBUFFER,J)}e.bindFramebuffer(a.FRAMEBUFFER,null)}function It(R,b,B){const j=n.get(R);b!==void 0&&z(j.__webglFramebuffer,R,R.texture,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,0),B!==void 0&&vt(R)}function Kt(R){const b=R.texture,B=n.get(R),j=n.get(b);R.addEventListener("dispose",w);const J=R.textures,Z=R.isWebGLCubeRenderTarget===!0,wt=J.length>1;if(wt||(j.__webglTexture===void 0&&(j.__webglTexture=a.createTexture()),j.__version=b.version,r.memory.textures++),Z){B.__webglFramebuffer=[];for(let rt=0;rt<6;rt++)if(b.mipmaps&&b.mipmaps.length>0){B.__webglFramebuffer[rt]=[];for(let xt=0;xt<b.mipmaps.length;xt++)B.__webglFramebuffer[rt][xt]=a.createFramebuffer()}else B.__webglFramebuffer[rt]=a.createFramebuffer()}else{if(b.mipmaps&&b.mipmaps.length>0){B.__webglFramebuffer=[];for(let rt=0;rt<b.mipmaps.length;rt++)B.__webglFramebuffer[rt]=a.createFramebuffer()}else B.__webglFramebuffer=a.createFramebuffer();if(wt)for(let rt=0,xt=J.length;rt<xt;rt++){const Yt=n.get(J[rt]);Yt.__webglTexture===void 0&&(Yt.__webglTexture=a.createTexture(),r.memory.textures++)}if(R.samples>0&&Wt(R)===!1){B.__webglMultisampledFramebuffer=a.createFramebuffer(),B.__webglColorRenderbuffer=[],e.bindFramebuffer(a.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let rt=0;rt<J.length;rt++){const xt=J[rt];B.__webglColorRenderbuffer[rt]=a.createRenderbuffer(),a.bindRenderbuffer(a.RENDERBUFFER,B.__webglColorRenderbuffer[rt]);const Yt=s.convert(xt.format,xt.colorSpace),et=s.convert(xt.type),yt=S(xt.internalFormat,Yt,et,xt.colorSpace,R.isXRRenderTarget===!0),Lt=kt(R);a.renderbufferStorageMultisample(a.RENDERBUFFER,Lt,yt,R.width,R.height),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+rt,a.RENDERBUFFER,B.__webglColorRenderbuffer[rt])}a.bindRenderbuffer(a.RENDERBUFFER,null),R.depthBuffer&&(B.__webglDepthRenderbuffer=a.createRenderbuffer(),$(B.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(a.FRAMEBUFFER,null)}}if(Z){e.bindTexture(a.TEXTURE_CUBE_MAP,j.__webglTexture),Dt(a.TEXTURE_CUBE_MAP,b);for(let rt=0;rt<6;rt++)if(b.mipmaps&&b.mipmaps.length>0)for(let xt=0;xt<b.mipmaps.length;xt++)z(B.__webglFramebuffer[rt][xt],R,b,a.COLOR_ATTACHMENT0,a.TEXTURE_CUBE_MAP_POSITIVE_X+rt,xt);else z(B.__webglFramebuffer[rt],R,b,a.COLOR_ATTACHMENT0,a.TEXTURE_CUBE_MAP_POSITIVE_X+rt,0);f(b)&&m(a.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(wt){for(let rt=0,xt=J.length;rt<xt;rt++){const Yt=J[rt],et=n.get(Yt);e.bindTexture(a.TEXTURE_2D,et.__webglTexture),Dt(a.TEXTURE_2D,Yt),z(B.__webglFramebuffer,R,Yt,a.COLOR_ATTACHMENT0+rt,a.TEXTURE_2D,0),f(Yt)&&m(a.TEXTURE_2D)}e.unbindTexture()}else{let rt=a.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(rt=R.isWebGL3DRenderTarget?a.TEXTURE_3D:a.TEXTURE_2D_ARRAY),e.bindTexture(rt,j.__webglTexture),Dt(rt,b),b.mipmaps&&b.mipmaps.length>0)for(let xt=0;xt<b.mipmaps.length;xt++)z(B.__webglFramebuffer[xt],R,b,a.COLOR_ATTACHMENT0,rt,xt);else z(B.__webglFramebuffer,R,b,a.COLOR_ATTACHMENT0,rt,0);f(b)&&m(rt),e.unbindTexture()}R.depthBuffer&&vt(R)}function Vt(R){const b=R.textures;for(let B=0,j=b.length;B<j;B++){const J=b[B];if(f(J)){const Z=y(R),wt=n.get(J).__webglTexture;e.bindTexture(Z,wt),m(Z),e.unbindTexture()}}}const oe=[],U=[];function Re(R){if(R.samples>0){if(Wt(R)===!1){const b=R.textures,B=R.width,j=R.height;let J=a.COLOR_BUFFER_BIT;const Z=R.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,wt=n.get(R),rt=b.length>1;if(rt)for(let xt=0;xt<b.length;xt++)e.bindFramebuffer(a.FRAMEBUFFER,wt.__webglMultisampledFramebuffer),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+xt,a.RENDERBUFFER,null),e.bindFramebuffer(a.FRAMEBUFFER,wt.__webglFramebuffer),a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0+xt,a.TEXTURE_2D,null,0);e.bindFramebuffer(a.READ_FRAMEBUFFER,wt.__webglMultisampledFramebuffer),e.bindFramebuffer(a.DRAW_FRAMEBUFFER,wt.__webglFramebuffer);for(let xt=0;xt<b.length;xt++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(J|=a.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(J|=a.STENCIL_BUFFER_BIT)),rt){a.framebufferRenderbuffer(a.READ_FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.RENDERBUFFER,wt.__webglColorRenderbuffer[xt]);const Yt=n.get(b[xt]).__webglTexture;a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,Yt,0)}a.blitFramebuffer(0,0,B,j,0,0,B,j,J,a.NEAREST),l===!0&&(oe.length=0,U.length=0,oe.push(a.COLOR_ATTACHMENT0+xt),R.depthBuffer&&R.resolveDepthBuffer===!1&&(oe.push(Z),U.push(Z),a.invalidateFramebuffer(a.DRAW_FRAMEBUFFER,U)),a.invalidateFramebuffer(a.READ_FRAMEBUFFER,oe))}if(e.bindFramebuffer(a.READ_FRAMEBUFFER,null),e.bindFramebuffer(a.DRAW_FRAMEBUFFER,null),rt)for(let xt=0;xt<b.length;xt++){e.bindFramebuffer(a.FRAMEBUFFER,wt.__webglMultisampledFramebuffer),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+xt,a.RENDERBUFFER,wt.__webglColorRenderbuffer[xt]);const Yt=n.get(b[xt]).__webglTexture;e.bindFramebuffer(a.FRAMEBUFFER,wt.__webglFramebuffer),a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0+xt,a.TEXTURE_2D,Yt,0)}e.bindFramebuffer(a.DRAW_FRAMEBUFFER,wt.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.resolveDepthBuffer===!1&&l){const b=R.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT;a.invalidateFramebuffer(a.DRAW_FRAMEBUFFER,[b])}}}function kt(R){return Math.min(i.maxSamples,R.samples)}function Wt(R){const b=n.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&b.__useRenderToTexture!==!1}function At(R){const b=r.render.frame;h.get(R)!==b&&(h.set(R,b),R.update())}function ie(R,b){const B=R.colorSpace,j=R.format,J=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||B!==ji&&B!==Wn&&(Zt.getTransfer(B)===ae?(j!==sn||J!==In)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",B)),b}function St(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=D,this.resetTextureUnits=I,this.setTexture2D=G,this.setTexture2DArray=H,this.setTexture3D=Y,this.setTextureCube=V,this.rebindTextures=It,this.setupRenderTarget=Kt,this.updateRenderTargetMipmap=Vt,this.updateMultisampleRenderTarget=Re,this.setupDepthRenderbuffer=vt,this.setupFrameBufferTexture=z,this.useMultisampledRTT=Wt}function rg(a,t){function e(n,i=Wn){let s;const r=Zt.getTransfer(i);if(n===In)return a.UNSIGNED_BYTE;if(n===Fo)return a.UNSIGNED_SHORT_4_4_4_4;if(n===Oo)return a.UNSIGNED_SHORT_5_5_5_1;if(n===jc)return a.UNSIGNED_INT_5_9_9_9_REV;if(n===Yc)return a.BYTE;if(n===Zc)return a.SHORT;if(n===Es)return a.UNSIGNED_SHORT;if(n===No)return a.INT;if(n===mi)return a.UNSIGNED_INT;if(n===vn)return a.FLOAT;if(n===Cs)return a.HALF_FLOAT;if(n===Kc)return a.ALPHA;if(n===Jc)return a.RGB;if(n===sn)return a.RGBA;if(n===Qc)return a.LUMINANCE;if(n===th)return a.LUMINANCE_ALPHA;if(n===Hi)return a.DEPTH_COMPONENT;if(n===Yi)return a.DEPTH_STENCIL;if(n===Bo)return a.RED;if(n===Ho)return a.RED_INTEGER;if(n===eh)return a.RG;if(n===Go)return a.RG_INTEGER;if(n===Vo)return a.RGBA_INTEGER;if(n===xa||n===ya||n===_a||n===Ma)if(r===ae)if(s=t.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===xa)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===ya)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===_a)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ma)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=t.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===xa)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===ya)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===_a)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ma)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===eo||n===no||n===io||n===so)if(s=t.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===eo)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===no)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===io)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===so)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===ao||n===ro||n===oo)if(s=t.get("WEBGL_compressed_texture_etc"),s!==null){if(n===ao||n===ro)return r===ae?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===oo)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===lo||n===co||n===ho||n===uo||n===fo||n===po||n===mo||n===go||n===vo||n===xo||n===yo||n===_o||n===Mo||n===So)if(s=t.get("WEBGL_compressed_texture_astc"),s!==null){if(n===lo)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===co)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===ho)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===uo)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===fo)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===po)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===mo)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===go)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===vo)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===xo)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===yo)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===_o)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Mo)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===So)return r===ae?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Sa||n===wo||n===bo)if(s=t.get("EXT_texture_compression_bptc"),s!==null){if(n===Sa)return r===ae?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===wo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===bo)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===nh||n===Eo||n===To||n===Ao)if(s=t.get("EXT_texture_compression_rgtc"),s!==null){if(n===Sa)return s.COMPRESSED_RED_RGTC1_EXT;if(n===Eo)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===To)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ao)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===$i?a.UNSIGNED_INT_24_8:a[n]!==void 0?a[n]:null}return{convert:e}}class og extends en{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}}class be extends Me{constructor(){super(),this.isGroup=!0,this.type="Group"}}const lg={type:"move"};class Rr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new be,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new be,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new L,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new L),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new be,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new L,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new L),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let i=null,s=null,r=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){r=!0;for(const v of t.hand.values()){const f=e.getJointPose(v,n),m=this._getHandJoint(c,v);f!==null&&(m.matrix.fromArray(f.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=f.radius),m.visible=f!==null}const h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),p=.02,g=.005;c.inputState.pinching&&u>p+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=p-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(s=e.getPose(t.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(i=e.getPose(t.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,i.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(i.linearVelocity)):o.hasLinearVelocity=!1,i.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(i.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(lg)))}return o!==null&&(o.visible=i!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new be;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const cg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,hg=`
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

}`;class dg{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){const i=new ke,s=t.properties.get(i);s.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new xn({vertexShader:cg,fragmentShader:hg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Pt(new fn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class ug extends Ki{constructor(t,e){super();const n=this;let i=null,s=1,r=null,o="local-floor",l=1,c=null,h=null,d=null,u=null,p=null,g=null;const v=new dg,f=e.getContextAttributes();let m=null,y=null;const S=[],x=[],T=new dt;let E=null;const w=new en;w.viewport=new me;const C=new en;C.viewport=new me;const M=[w,C],_=new og;let P=null,I=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let st=S[K];return st===void 0&&(st=new Rr,S[K]=st),st.getTargetRaySpace()},this.getControllerGrip=function(K){let st=S[K];return st===void 0&&(st=new Rr,S[K]=st),st.getGripSpace()},this.getHand=function(K){let st=S[K];return st===void 0&&(st=new Rr,S[K]=st),st.getHandSpace()};function D(K){const st=x.indexOf(K.inputSource);if(st===-1)return;const z=S[st];z!==void 0&&(z.update(K.inputSource,K.frame,c||r),z.dispatchEvent({type:K.type,data:K.inputSource}))}function O(){i.removeEventListener("select",D),i.removeEventListener("selectstart",D),i.removeEventListener("selectend",D),i.removeEventListener("squeeze",D),i.removeEventListener("squeezestart",D),i.removeEventListener("squeezeend",D),i.removeEventListener("end",O),i.removeEventListener("inputsourceschange",G);for(let K=0;K<S.length;K++){const st=x[K];st!==null&&(x[K]=null,S[K].disconnect(st))}P=null,I=null,v.reset(),t.setRenderTarget(m),p=null,u=null,d=null,i=null,y=null,$t.stop(),n.isPresenting=!1,t.setPixelRatio(E),t.setSize(T.width,T.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){s=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){o=K,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return u!==null?u:p},this.getBinding=function(){return d},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(K){if(i=K,i!==null){if(m=t.getRenderTarget(),i.addEventListener("select",D),i.addEventListener("selectstart",D),i.addEventListener("selectend",D),i.addEventListener("squeeze",D),i.addEventListener("squeezestart",D),i.addEventListener("squeezeend",D),i.addEventListener("end",O),i.addEventListener("inputsourceschange",G),f.xrCompatible!==!0&&await e.makeXRCompatible(),E=t.getPixelRatio(),t.getSize(T),i.renderState.layers===void 0){const st={antialias:f.antialias,alpha:!0,depth:f.depth,stencil:f.stencil,framebufferScaleFactor:s};p=new XRWebGLLayer(i,e,st),i.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),y=new gi(p.framebufferWidth,p.framebufferHeight,{format:sn,type:In,colorSpace:t.outputColorSpace,stencilBuffer:f.stencil})}else{let st=null,z=null,$=null;f.depth&&($=f.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,st=f.stencil?Yi:Hi,z=f.stencil?$i:mi);const tt={colorFormat:e.RGBA8,depthFormat:$,scaleFactor:s};d=new XRWebGLBinding(i,e),u=d.createProjectionLayer(tt),i.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),y=new gi(u.textureWidth,u.textureHeight,{format:sn,type:In,depthTexture:new gh(u.textureWidth,u.textureHeight,z,void 0,void 0,void 0,void 0,void 0,void 0,st),stencilBuffer:f.stencil,colorSpace:t.outputColorSpace,samples:f.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,r=await i.requestReferenceSpace(o),$t.setContext(i),$t.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode},this.getDepthTexture=function(){return v.getDepthTexture()};function G(K){for(let st=0;st<K.removed.length;st++){const z=K.removed[st],$=x.indexOf(z);$>=0&&(x[$]=null,S[$].disconnect(z))}for(let st=0;st<K.added.length;st++){const z=K.added[st];let $=x.indexOf(z);if($===-1){for(let vt=0;vt<S.length;vt++)if(vt>=x.length){x.push(z),$=vt;break}else if(x[vt]===null){x[vt]=z,$=vt;break}if($===-1)break}const tt=S[$];tt&&tt.connect(z)}}const H=new L,Y=new L;function V(K,st,z){H.setFromMatrixPosition(st.matrixWorld),Y.setFromMatrixPosition(z.matrixWorld);const $=H.distanceTo(Y),tt=st.projectionMatrix.elements,vt=z.projectionMatrix.elements,It=tt[14]/(tt[10]-1),Kt=tt[14]/(tt[10]+1),Vt=(tt[9]+1)/tt[5],oe=(tt[9]-1)/tt[5],U=(tt[8]-1)/tt[0],Re=(vt[8]+1)/vt[0],kt=It*U,Wt=It*Re,At=$/(-U+Re),ie=At*-U;if(st.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(ie),K.translateZ(At),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),tt[10]===-1)K.projectionMatrix.copy(st.projectionMatrix),K.projectionMatrixInverse.copy(st.projectionMatrixInverse);else{const St=It+At,R=Kt+At,b=kt-ie,B=Wt+($-ie),j=Vt*Kt/R*St,J=oe*Kt/R*St;K.projectionMatrix.makePerspective(b,B,j,J,St,R),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function at(K,st){st===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(st.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(i===null)return;let st=K.near,z=K.far;v.texture!==null&&(v.depthNear>0&&(st=v.depthNear),v.depthFar>0&&(z=v.depthFar)),_.near=C.near=w.near=st,_.far=C.far=w.far=z,(P!==_.near||I!==_.far)&&(i.updateRenderState({depthNear:_.near,depthFar:_.far}),P=_.near,I=_.far),w.layers.mask=K.layers.mask|2,C.layers.mask=K.layers.mask|4,_.layers.mask=w.layers.mask|C.layers.mask;const $=K.parent,tt=_.cameras;at(_,$);for(let vt=0;vt<tt.length;vt++)at(tt[vt],$);tt.length===2?V(_,w,C):_.projectionMatrix.copy(w.projectionMatrix),lt(K,_,$)};function lt(K,st,z){z===null?K.matrix.copy(st.matrixWorld):(K.matrix.copy(z.matrixWorld),K.matrix.invert(),K.matrix.multiply(st.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(st.projectionMatrix),K.projectionMatrixInverse.copy(st.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=Ro*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return _},this.getFoveation=function(){if(!(u===null&&p===null))return l},this.setFoveation=function(K){l=K,u!==null&&(u.fixedFoveation=K),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=K)},this.hasDepthSensing=function(){return v.texture!==null},this.getDepthSensingMesh=function(){return v.getMesh(_)};let gt=null;function Dt(K,st){if(h=st.getViewerPose(c||r),g=st,h!==null){const z=h.views;p!==null&&(t.setRenderTargetFramebuffer(y,p.framebuffer),t.setRenderTarget(y));let $=!1;z.length!==_.cameras.length&&(_.cameras.length=0,$=!0);for(let vt=0;vt<z.length;vt++){const It=z[vt];let Kt=null;if(p!==null)Kt=p.getViewport(It);else{const oe=d.getViewSubImage(u,It);Kt=oe.viewport,vt===0&&(t.setRenderTargetTextures(y,oe.colorTexture,u.ignoreDepthValues?void 0:oe.depthStencilTexture),t.setRenderTarget(y))}let Vt=M[vt];Vt===void 0&&(Vt=new en,Vt.layers.enable(vt),Vt.viewport=new me,M[vt]=Vt),Vt.matrix.fromArray(It.transform.matrix),Vt.matrix.decompose(Vt.position,Vt.quaternion,Vt.scale),Vt.projectionMatrix.fromArray(It.projectionMatrix),Vt.projectionMatrixInverse.copy(Vt.projectionMatrix).invert(),Vt.viewport.set(Kt.x,Kt.y,Kt.width,Kt.height),vt===0&&(_.matrix.copy(Vt.matrix),_.matrix.decompose(_.position,_.quaternion,_.scale)),$===!0&&_.cameras.push(Vt)}const tt=i.enabledFeatures;if(tt&&tt.includes("depth-sensing")){const vt=d.getDepthInformation(z[0]);vt&&vt.isValid&&vt.texture&&v.init(t,vt,i.renderState)}}for(let z=0;z<S.length;z++){const $=x[z],tt=S[z];$!==null&&tt!==void 0&&tt.update($,st,c||r)}gt&&gt(K,st),st.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:st}),g=null}const $t=new ph;$t.setAnimationLoop(Dt),this.setAnimationLoop=function(K){gt=K},this.dispose=function(){}}}const ai=new an,fg=new te;function pg(a,t){function e(f,m){f.matrixAutoUpdate===!0&&f.updateMatrix(),m.value.copy(f.matrix)}function n(f,m){m.color.getRGB(f.fogColor.value,dh(a)),m.isFog?(f.fogNear.value=m.near,f.fogFar.value=m.far):m.isFogExp2&&(f.fogDensity.value=m.density)}function i(f,m,y,S,x){m.isMeshBasicMaterial||m.isMeshLambertMaterial?s(f,m):m.isMeshToonMaterial?(s(f,m),d(f,m)):m.isMeshPhongMaterial?(s(f,m),h(f,m)):m.isMeshStandardMaterial?(s(f,m),u(f,m),m.isMeshPhysicalMaterial&&p(f,m,x)):m.isMeshMatcapMaterial?(s(f,m),g(f,m)):m.isMeshDepthMaterial?s(f,m):m.isMeshDistanceMaterial?(s(f,m),v(f,m)):m.isMeshNormalMaterial?s(f,m):m.isLineBasicMaterial?(r(f,m),m.isLineDashedMaterial&&o(f,m)):m.isPointsMaterial?l(f,m,y,S):m.isSpriteMaterial?c(f,m):m.isShadowMaterial?(f.color.value.copy(m.color),f.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(f,m){f.opacity.value=m.opacity,m.color&&f.diffuse.value.copy(m.color),m.emissive&&f.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(f.map.value=m.map,e(m.map,f.mapTransform)),m.alphaMap&&(f.alphaMap.value=m.alphaMap,e(m.alphaMap,f.alphaMapTransform)),m.bumpMap&&(f.bumpMap.value=m.bumpMap,e(m.bumpMap,f.bumpMapTransform),f.bumpScale.value=m.bumpScale,m.side===Be&&(f.bumpScale.value*=-1)),m.normalMap&&(f.normalMap.value=m.normalMap,e(m.normalMap,f.normalMapTransform),f.normalScale.value.copy(m.normalScale),m.side===Be&&f.normalScale.value.negate()),m.displacementMap&&(f.displacementMap.value=m.displacementMap,e(m.displacementMap,f.displacementMapTransform),f.displacementScale.value=m.displacementScale,f.displacementBias.value=m.displacementBias),m.emissiveMap&&(f.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,f.emissiveMapTransform)),m.specularMap&&(f.specularMap.value=m.specularMap,e(m.specularMap,f.specularMapTransform)),m.alphaTest>0&&(f.alphaTest.value=m.alphaTest);const y=t.get(m),S=y.envMap,x=y.envMapRotation;S&&(f.envMap.value=S,ai.copy(x),ai.x*=-1,ai.y*=-1,ai.z*=-1,S.isCubeTexture&&S.isRenderTargetTexture===!1&&(ai.y*=-1,ai.z*=-1),f.envMapRotation.value.setFromMatrix4(fg.makeRotationFromEuler(ai)),f.flipEnvMap.value=S.isCubeTexture&&S.isRenderTargetTexture===!1?-1:1,f.reflectivity.value=m.reflectivity,f.ior.value=m.ior,f.refractionRatio.value=m.refractionRatio),m.lightMap&&(f.lightMap.value=m.lightMap,f.lightMapIntensity.value=m.lightMapIntensity,e(m.lightMap,f.lightMapTransform)),m.aoMap&&(f.aoMap.value=m.aoMap,f.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,f.aoMapTransform))}function r(f,m){f.diffuse.value.copy(m.color),f.opacity.value=m.opacity,m.map&&(f.map.value=m.map,e(m.map,f.mapTransform))}function o(f,m){f.dashSize.value=m.dashSize,f.totalSize.value=m.dashSize+m.gapSize,f.scale.value=m.scale}function l(f,m,y,S){f.diffuse.value.copy(m.color),f.opacity.value=m.opacity,f.size.value=m.size*y,f.scale.value=S*.5,m.map&&(f.map.value=m.map,e(m.map,f.uvTransform)),m.alphaMap&&(f.alphaMap.value=m.alphaMap,e(m.alphaMap,f.alphaMapTransform)),m.alphaTest>0&&(f.alphaTest.value=m.alphaTest)}function c(f,m){f.diffuse.value.copy(m.color),f.opacity.value=m.opacity,f.rotation.value=m.rotation,m.map&&(f.map.value=m.map,e(m.map,f.mapTransform)),m.alphaMap&&(f.alphaMap.value=m.alphaMap,e(m.alphaMap,f.alphaMapTransform)),m.alphaTest>0&&(f.alphaTest.value=m.alphaTest)}function h(f,m){f.specular.value.copy(m.specular),f.shininess.value=Math.max(m.shininess,1e-4)}function d(f,m){m.gradientMap&&(f.gradientMap.value=m.gradientMap)}function u(f,m){f.metalness.value=m.metalness,m.metalnessMap&&(f.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,f.metalnessMapTransform)),f.roughness.value=m.roughness,m.roughnessMap&&(f.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,f.roughnessMapTransform)),m.envMap&&(f.envMapIntensity.value=m.envMapIntensity)}function p(f,m,y){f.ior.value=m.ior,m.sheen>0&&(f.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),f.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(f.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,f.sheenColorMapTransform)),m.sheenRoughnessMap&&(f.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,f.sheenRoughnessMapTransform))),m.clearcoat>0&&(f.clearcoat.value=m.clearcoat,f.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(f.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,f.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(f.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,f.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(f.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,f.clearcoatNormalMapTransform),f.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Be&&f.clearcoatNormalScale.value.negate())),m.dispersion>0&&(f.dispersion.value=m.dispersion),m.iridescence>0&&(f.iridescence.value=m.iridescence,f.iridescenceIOR.value=m.iridescenceIOR,f.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],f.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(f.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,f.iridescenceMapTransform)),m.iridescenceThicknessMap&&(f.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,f.iridescenceThicknessMapTransform))),m.transmission>0&&(f.transmission.value=m.transmission,f.transmissionSamplerMap.value=y.texture,f.transmissionSamplerSize.value.set(y.width,y.height),m.transmissionMap&&(f.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,f.transmissionMapTransform)),f.thickness.value=m.thickness,m.thicknessMap&&(f.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,f.thicknessMapTransform)),f.attenuationDistance.value=m.attenuationDistance,f.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(f.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(f.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,f.anisotropyMapTransform))),f.specularIntensity.value=m.specularIntensity,f.specularColor.value.copy(m.specularColor),m.specularColorMap&&(f.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,f.specularColorMapTransform)),m.specularIntensityMap&&(f.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,f.specularIntensityMapTransform))}function g(f,m){m.matcap&&(f.matcap.value=m.matcap)}function v(f,m){const y=t.get(m).light;f.referencePosition.value.setFromMatrixPosition(y.matrixWorld),f.nearDistance.value=y.shadow.camera.near,f.farDistance.value=y.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:i}}function mg(a,t,e,n){let i={},s={},r=[];const o=a.getParameter(a.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,S){const x=S.program;n.uniformBlockBinding(y,x)}function c(y,S){let x=i[y.id];x===void 0&&(g(y),x=h(y),i[y.id]=x,y.addEventListener("dispose",f));const T=S.program;n.updateUBOMapping(y,T);const E=t.render.frame;s[y.id]!==E&&(u(y),s[y.id]=E)}function h(y){const S=d();y.__bindingPointIndex=S;const x=a.createBuffer(),T=y.__size,E=y.usage;return a.bindBuffer(a.UNIFORM_BUFFER,x),a.bufferData(a.UNIFORM_BUFFER,T,E),a.bindBuffer(a.UNIFORM_BUFFER,null),a.bindBufferBase(a.UNIFORM_BUFFER,S,x),x}function d(){for(let y=0;y<o;y++)if(r.indexOf(y)===-1)return r.push(y),y;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(y){const S=i[y.id],x=y.uniforms,T=y.__cache;a.bindBuffer(a.UNIFORM_BUFFER,S);for(let E=0,w=x.length;E<w;E++){const C=Array.isArray(x[E])?x[E]:[x[E]];for(let M=0,_=C.length;M<_;M++){const P=C[M];if(p(P,E,M,T)===!0){const I=P.__offset,D=Array.isArray(P.value)?P.value:[P.value];let O=0;for(let G=0;G<D.length;G++){const H=D[G],Y=v(H);typeof H=="number"||typeof H=="boolean"?(P.__data[0]=H,a.bufferSubData(a.UNIFORM_BUFFER,I+O,P.__data)):H.isMatrix3?(P.__data[0]=H.elements[0],P.__data[1]=H.elements[1],P.__data[2]=H.elements[2],P.__data[3]=0,P.__data[4]=H.elements[3],P.__data[5]=H.elements[4],P.__data[6]=H.elements[5],P.__data[7]=0,P.__data[8]=H.elements[6],P.__data[9]=H.elements[7],P.__data[10]=H.elements[8],P.__data[11]=0):(H.toArray(P.__data,O),O+=Y.storage/Float32Array.BYTES_PER_ELEMENT)}a.bufferSubData(a.UNIFORM_BUFFER,I,P.__data)}}}a.bindBuffer(a.UNIFORM_BUFFER,null)}function p(y,S,x,T){const E=y.value,w=S+"_"+x;if(T[w]===void 0)return typeof E=="number"||typeof E=="boolean"?T[w]=E:T[w]=E.clone(),!0;{const C=T[w];if(typeof E=="number"||typeof E=="boolean"){if(C!==E)return T[w]=E,!0}else if(C.equals(E)===!1)return C.copy(E),!0}return!1}function g(y){const S=y.uniforms;let x=0;const T=16;for(let w=0,C=S.length;w<C;w++){const M=Array.isArray(S[w])?S[w]:[S[w]];for(let _=0,P=M.length;_<P;_++){const I=M[_],D=Array.isArray(I.value)?I.value:[I.value];for(let O=0,G=D.length;O<G;O++){const H=D[O],Y=v(H),V=x%T,at=V%Y.boundary,lt=V+at;x+=at,lt!==0&&T-lt<Y.storage&&(x+=T-lt),I.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=x,x+=Y.storage}}}const E=x%T;return E>0&&(x+=T-E),y.__size=x,y.__cache={},this}function v(y){const S={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(S.boundary=4,S.storage=4):y.isVector2?(S.boundary=8,S.storage=8):y.isVector3||y.isColor?(S.boundary=16,S.storage=12):y.isVector4?(S.boundary=16,S.storage=16):y.isMatrix3?(S.boundary=48,S.storage=48):y.isMatrix4?(S.boundary=64,S.storage=64):y.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",y),S}function f(y){const S=y.target;S.removeEventListener("dispose",f);const x=r.indexOf(S.__bindingPointIndex);r.splice(x,1),a.deleteBuffer(i[S.id]),delete i[S.id],delete s[S.id]}function m(){for(const y in i)a.deleteBuffer(i[y]);r=[],i={},s={}}return{bind:l,update:c,dispose:m}}class gg{constructor(t={}){const{canvas:e=iu(),context:n=null,depth:i=!0,stencil:s=!1,alpha:r=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reverseDepthBuffer:u=!1}=t;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=n.getContextAttributes().alpha}else p=r;const g=new Uint32Array(4),v=new Int32Array(4);let f=null,m=null;const y=[],S=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=je,this.toneMapping=Yn,this.toneMappingExposure=1;const x=this;let T=!1,E=0,w=0,C=null,M=-1,_=null;const P=new me,I=new me;let D=null;const O=new ct(0);let G=0,H=e.width,Y=e.height,V=1,at=null,lt=null;const gt=new me(0,0,H,Y),Dt=new me(0,0,H,Y);let $t=!1;const K=new qo;let st=!1,z=!1;const $=new te,tt=new te,vt=new L,It=new me,Kt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Vt=!1;function oe(){return C===null?V:1}let U=n;function Re(A,N){return e.getContext(A,N)}try{const A={alpha:!0,depth:i,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Uo}`),e.addEventListener("webglcontextlost",Q,!1),e.addEventListener("webglcontextrestored",mt,!1),e.addEventListener("webglcontextcreationerror",ut,!1),U===null){const N="webgl2";if(U=Re(N,A),U===null)throw Re(N)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(A){throw console.error("THREE.WebGLRenderer: "+A.message),A}let kt,Wt,At,ie,St,R,b,B,j,J,Z,wt,rt,xt,Yt,et,yt,Lt,zt,_t,qt,Ht,le,k;function ht(){kt=new Mm(U),kt.init(),Ht=new rg(U,kt),Wt=new mm(U,kt,t,Ht),At=new ig(U,kt),Wt.reverseDepthBuffer&&u&&At.buffers.depth.setReversed(!0),ie=new bm(U),St=new G0,R=new ag(U,kt,At,St,Wt,Ht,ie),b=new vm(x),B=new _m(x),j=new Pu(U),le=new fm(U,j),J=new Sm(U,j,ie,le),Z=new Tm(U,J,j,ie),zt=new Em(U,Wt,R),et=new gm(St),wt=new H0(x,b,B,kt,Wt,le,et),rt=new pg(x,St),xt=new W0,Yt=new j0(kt),Lt=new um(x,b,B,At,Z,p,l),yt=new eg(x,Z,Wt),k=new mg(U,ie,Wt,At),_t=new pm(U,kt,ie),qt=new wm(U,kt,ie),ie.programs=wt.programs,x.capabilities=Wt,x.extensions=kt,x.properties=St,x.renderLists=xt,x.shadowMap=yt,x.state=At,x.info=ie}ht();const q=new ug(x,U);this.xr=q,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){const A=kt.get("WEBGL_lose_context");A&&A.loseContext()},this.forceContextRestore=function(){const A=kt.get("WEBGL_lose_context");A&&A.restoreContext()},this.getPixelRatio=function(){return V},this.setPixelRatio=function(A){A!==void 0&&(V=A,this.setSize(H,Y,!1))},this.getSize=function(A){return A.set(H,Y)},this.setSize=function(A,N,W=!0){if(q.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}H=A,Y=N,e.width=Math.floor(A*V),e.height=Math.floor(N*V),W===!0&&(e.style.width=A+"px",e.style.height=N+"px"),this.setViewport(0,0,A,N)},this.getDrawingBufferSize=function(A){return A.set(H*V,Y*V).floor()},this.setDrawingBufferSize=function(A,N,W){H=A,Y=N,V=W,e.width=Math.floor(A*W),e.height=Math.floor(N*W),this.setViewport(0,0,A,N)},this.getCurrentViewport=function(A){return A.copy(P)},this.getViewport=function(A){return A.copy(gt)},this.setViewport=function(A,N,W,X){A.isVector4?gt.set(A.x,A.y,A.z,A.w):gt.set(A,N,W,X),At.viewport(P.copy(gt).multiplyScalar(V).round())},this.getScissor=function(A){return A.copy(Dt)},this.setScissor=function(A,N,W,X){A.isVector4?Dt.set(A.x,A.y,A.z,A.w):Dt.set(A,N,W,X),At.scissor(I.copy(Dt).multiplyScalar(V).round())},this.getScissorTest=function(){return $t},this.setScissorTest=function(A){At.setScissorTest($t=A)},this.setOpaqueSort=function(A){at=A},this.setTransparentSort=function(A){lt=A},this.getClearColor=function(A){return A.copy(Lt.getClearColor())},this.setClearColor=function(){Lt.setClearColor.apply(Lt,arguments)},this.getClearAlpha=function(){return Lt.getClearAlpha()},this.setClearAlpha=function(){Lt.setClearAlpha.apply(Lt,arguments)},this.clear=function(A=!0,N=!0,W=!0){let X=0;if(A){let F=!1;if(C!==null){const it=C.texture.format;F=it===Vo||it===Go||it===Ho}if(F){const it=C.texture.type,ft=it===In||it===mi||it===Es||it===$i||it===Fo||it===Oo,bt=Lt.getClearColor(),Et=Lt.getClearAlpha(),Ut=bt.r,Ot=bt.g,Tt=bt.b;ft?(g[0]=Ut,g[1]=Ot,g[2]=Tt,g[3]=Et,U.clearBufferuiv(U.COLOR,0,g)):(v[0]=Ut,v[1]=Ot,v[2]=Tt,v[3]=Et,U.clearBufferiv(U.COLOR,0,v))}else X|=U.COLOR_BUFFER_BIT}N&&(X|=U.DEPTH_BUFFER_BIT),W&&(X|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),U.clear(X)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Q,!1),e.removeEventListener("webglcontextrestored",mt,!1),e.removeEventListener("webglcontextcreationerror",ut,!1),xt.dispose(),Yt.dispose(),St.dispose(),b.dispose(),B.dispose(),Z.dispose(),le.dispose(),k.dispose(),wt.dispose(),q.dispose(),q.removeEventListener("sessionstart",tl),q.removeEventListener("sessionend",el),Kn.stop()};function Q(A){A.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),T=!0}function mt(){console.log("THREE.WebGLRenderer: Context Restored."),T=!1;const A=ie.autoReset,N=yt.enabled,W=yt.autoUpdate,X=yt.needsUpdate,F=yt.type;ht(),ie.autoReset=A,yt.enabled=N,yt.autoUpdate=W,yt.needsUpdate=X,yt.type=F}function ut(A){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",A.statusMessage)}function Ft(A){const N=A.target;N.removeEventListener("dispose",Ft),pe(N)}function pe(A){Le(A),St.remove(A)}function Le(A){const N=St.get(A).programs;N!==void 0&&(N.forEach(function(W){wt.releaseProgram(W)}),A.isShaderMaterial&&wt.releaseShaderCache(A))}this.renderBufferDirect=function(A,N,W,X,F,it){N===null&&(N=Kt);const ft=F.isMesh&&F.matrixWorld.determinant()<0,bt=zh(A,N,W,X,F);At.setMaterial(X,ft);let Et=W.index,Ut=1;if(X.wireframe===!0){if(Et=J.getWireframeAttribute(W),Et===void 0)return;Ut=2}const Ot=W.drawRange,Tt=W.attributes.position;let jt=Ot.start*Ut,ce=(Ot.start+Ot.count)*Ut;it!==null&&(jt=Math.max(jt,it.start*Ut),ce=Math.min(ce,(it.start+it.count)*Ut)),Et!==null?(jt=Math.max(jt,0),ce=Math.min(ce,Et.count)):Tt!=null&&(jt=Math.max(jt,0),ce=Math.min(ce,Tt.count));const de=ce-jt;if(de<0||de===1/0)return;le.setup(F,X,bt,W,Et);let He,Jt=_t;if(Et!==null&&(He=j.get(Et),Jt=qt,Jt.setIndex(He)),F.isMesh)X.wireframe===!0?(At.setLineWidth(X.wireframeLinewidth*oe()),Jt.setMode(U.LINES)):Jt.setMode(U.TRIANGLES);else if(F.isLine){let Ct=X.linewidth;Ct===void 0&&(Ct=1),At.setLineWidth(Ct*oe()),F.isLineSegments?Jt.setMode(U.LINES):F.isLineLoop?Jt.setMode(U.LINE_LOOP):Jt.setMode(U.LINE_STRIP)}else F.isPoints?Jt.setMode(U.POINTS):F.isSprite&&Jt.setMode(U.TRIANGLES);if(F.isBatchedMesh)if(F._multiDrawInstances!==null)Jt.renderMultiDrawInstances(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount,F._multiDrawInstances);else if(kt.get("WEBGL_multi_draw"))Jt.renderMultiDraw(F._multiDrawStarts,F._multiDrawCounts,F._multiDrawCount);else{const Ct=F._multiDrawStarts,Mn=F._multiDrawCounts,Qt=F._multiDrawCount,on=Et?j.get(Et).bytesPerElement:1,yi=St.get(X).currentProgram.getUniforms();for(let qe=0;qe<Qt;qe++)yi.setValue(U,"_gl_DrawID",qe),Jt.render(Ct[qe]/on,Mn[qe])}else if(F.isInstancedMesh)Jt.renderInstances(jt,de,F.count);else if(W.isInstancedBufferGeometry){const Ct=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Mn=Math.min(W.instanceCount,Ct);Jt.renderInstances(jt,de,Mn)}else Jt.render(jt,de)};function ee(A,N,W){A.transparent===!0&&A.side===we&&A.forceSinglePass===!1?(A.side=Be,A.needsUpdate=!0,ks(A,N,W),A.side=jn,A.needsUpdate=!0,ks(A,N,W),A.side=we):ks(A,N,W)}this.compile=function(A,N,W=null){W===null&&(W=A),m=Yt.get(W),m.init(N),S.push(m),W.traverseVisible(function(F){F.isLight&&F.layers.test(N.layers)&&(m.pushLight(F),F.castShadow&&m.pushShadow(F))}),A!==W&&A.traverseVisible(function(F){F.isLight&&F.layers.test(N.layers)&&(m.pushLight(F),F.castShadow&&m.pushShadow(F))}),m.setupLights();const X=new Set;return A.traverse(function(F){if(!(F.isMesh||F.isPoints||F.isLine||F.isSprite))return;const it=F.material;if(it)if(Array.isArray(it))for(let ft=0;ft<it.length;ft++){const bt=it[ft];ee(bt,W,F),X.add(bt)}else ee(it,W,F),X.add(it)}),S.pop(),m=null,X},this.compileAsync=function(A,N,W=null){const X=this.compile(A,N,W);return new Promise(F=>{function it(){if(X.forEach(function(ft){St.get(ft).currentProgram.isReady()&&X.delete(ft)}),X.size===0){F(A);return}setTimeout(it,10)}kt.get("KHR_parallel_shader_compile")!==null?it():setTimeout(it,10)})};let rn=null;function _n(A){rn&&rn(A)}function tl(){Kn.stop()}function el(){Kn.start()}const Kn=new ph;Kn.setAnimationLoop(_n),typeof self<"u"&&Kn.setContext(self),this.setAnimationLoop=function(A){rn=A,q.setAnimationLoop(A),A===null?Kn.stop():Kn.start()},q.addEventListener("sessionstart",tl),q.addEventListener("sessionend",el),this.render=function(A,N){if(N!==void 0&&N.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(T===!0)return;if(A.matrixWorldAutoUpdate===!0&&A.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),q.enabled===!0&&q.isPresenting===!0&&(q.cameraAutoUpdate===!0&&q.updateCamera(N),N=q.getCamera()),A.isScene===!0&&A.onBeforeRender(x,A,N,C),m=Yt.get(A,S.length),m.init(N),S.push(m),tt.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),K.setFromProjectionMatrix(tt),z=this.localClippingEnabled,st=et.init(this.clippingPlanes,z),f=xt.get(A,y.length),f.init(),y.push(f),q.enabled===!0&&q.isPresenting===!0){const it=x.xr.getDepthSensingMesh();it!==null&&qa(it,N,-1/0,x.sortObjects)}qa(A,N,0,x.sortObjects),f.finish(),x.sortObjects===!0&&f.sort(at,lt),Vt=q.enabled===!1||q.isPresenting===!1||q.hasDepthSensing()===!1,Vt&&Lt.addToRenderList(f,A),this.info.render.frame++,st===!0&&et.beginShadows();const W=m.state.shadowsArray;yt.render(W,A,N),st===!0&&et.endShadows(),this.info.autoReset===!0&&this.info.reset();const X=f.opaque,F=f.transmissive;if(m.setupLights(),N.isArrayCamera){const it=N.cameras;if(F.length>0)for(let ft=0,bt=it.length;ft<bt;ft++){const Et=it[ft];il(X,F,A,Et)}Vt&&Lt.render(A);for(let ft=0,bt=it.length;ft<bt;ft++){const Et=it[ft];nl(f,A,Et,Et.viewport)}}else F.length>0&&il(X,F,A,N),Vt&&Lt.render(A),nl(f,A,N);C!==null&&(R.updateMultisampleRenderTarget(C),R.updateRenderTargetMipmap(C)),A.isScene===!0&&A.onAfterRender(x,A,N),le.resetDefaultState(),M=-1,_=null,S.pop(),S.length>0?(m=S[S.length-1],st===!0&&et.setGlobalState(x.clippingPlanes,m.state.camera)):m=null,y.pop(),y.length>0?f=y[y.length-1]:f=null};function qa(A,N,W,X){if(A.visible===!1)return;if(A.layers.test(N.layers)){if(A.isGroup)W=A.renderOrder;else if(A.isLOD)A.autoUpdate===!0&&A.update(N);else if(A.isLight)m.pushLight(A),A.castShadow&&m.pushShadow(A);else if(A.isSprite){if(!A.frustumCulled||K.intersectsSprite(A)){X&&It.setFromMatrixPosition(A.matrixWorld).applyMatrix4(tt);const ft=Z.update(A),bt=A.material;bt.visible&&f.push(A,ft,bt,W,It.z,null)}}else if((A.isMesh||A.isLine||A.isPoints)&&(!A.frustumCulled||K.intersectsObject(A))){const ft=Z.update(A),bt=A.material;if(X&&(A.boundingSphere!==void 0?(A.boundingSphere===null&&A.computeBoundingSphere(),It.copy(A.boundingSphere.center)):(ft.boundingSphere===null&&ft.computeBoundingSphere(),It.copy(ft.boundingSphere.center)),It.applyMatrix4(A.matrixWorld).applyMatrix4(tt)),Array.isArray(bt)){const Et=ft.groups;for(let Ut=0,Ot=Et.length;Ut<Ot;Ut++){const Tt=Et[Ut],jt=bt[Tt.materialIndex];jt&&jt.visible&&f.push(A,ft,jt,W,It.z,Tt)}}else bt.visible&&f.push(A,ft,bt,W,It.z,null)}}const it=A.children;for(let ft=0,bt=it.length;ft<bt;ft++)qa(it[ft],N,W,X)}function nl(A,N,W,X){const F=A.opaque,it=A.transmissive,ft=A.transparent;m.setupLightsView(W),st===!0&&et.setGlobalState(x.clippingPlanes,W),X&&At.viewport(P.copy(X)),F.length>0&&Ds(F,N,W),it.length>0&&Ds(it,N,W),ft.length>0&&Ds(ft,N,W),At.buffers.depth.setTest(!0),At.buffers.depth.setMask(!0),At.buffers.color.setMask(!0),At.setPolygonOffset(!1)}function il(A,N,W,X){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;m.state.transmissionRenderTarget[X.id]===void 0&&(m.state.transmissionRenderTarget[X.id]=new gi(1,1,{generateMipmaps:!0,type:kt.has("EXT_color_buffer_half_float")||kt.has("EXT_color_buffer_float")?Cs:In,minFilter:Xn,samples:4,stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Zt.workingColorSpace}));const it=m.state.transmissionRenderTarget[X.id],ft=X.viewport||P;it.setSize(ft.z,ft.w);const bt=x.getRenderTarget();x.setRenderTarget(it),x.getClearColor(O),G=x.getClearAlpha(),G<1&&x.setClearColor(16777215,.5),x.clear(),Vt&&Lt.render(W);const Et=x.toneMapping;x.toneMapping=Yn;const Ut=X.viewport;if(X.viewport!==void 0&&(X.viewport=void 0),m.setupLightsView(X),st===!0&&et.setGlobalState(x.clippingPlanes,X),Ds(A,W,X),R.updateMultisampleRenderTarget(it),R.updateRenderTargetMipmap(it),kt.has("WEBGL_multisampled_render_to_texture")===!1){let Ot=!1;for(let Tt=0,jt=N.length;Tt<jt;Tt++){const ce=N[Tt],de=ce.object,He=ce.geometry,Jt=ce.material,Ct=ce.group;if(Jt.side===we&&de.layers.test(X.layers)){const Mn=Jt.side;Jt.side=Be,Jt.needsUpdate=!0,sl(de,W,X,He,Jt,Ct),Jt.side=Mn,Jt.needsUpdate=!0,Ot=!0}}Ot===!0&&(R.updateMultisampleRenderTarget(it),R.updateRenderTargetMipmap(it))}x.setRenderTarget(bt),x.setClearColor(O,G),Ut!==void 0&&(X.viewport=Ut),x.toneMapping=Et}function Ds(A,N,W){const X=N.isScene===!0?N.overrideMaterial:null;for(let F=0,it=A.length;F<it;F++){const ft=A[F],bt=ft.object,Et=ft.geometry,Ut=X===null?ft.material:X,Ot=ft.group;bt.layers.test(W.layers)&&sl(bt,N,W,Et,Ut,Ot)}}function sl(A,N,W,X,F,it){A.onBeforeRender(x,N,W,X,F,it),A.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,A.matrixWorld),A.normalMatrix.getNormalMatrix(A.modelViewMatrix),F.onBeforeRender(x,N,W,X,A,it),F.transparent===!0&&F.side===we&&F.forceSinglePass===!1?(F.side=Be,F.needsUpdate=!0,x.renderBufferDirect(W,N,X,F,A,it),F.side=jn,F.needsUpdate=!0,x.renderBufferDirect(W,N,X,F,A,it),F.side=we):x.renderBufferDirect(W,N,X,F,A,it),A.onAfterRender(x,N,W,X,F,it)}function ks(A,N,W){N.isScene!==!0&&(N=Kt);const X=St.get(A),F=m.state.lights,it=m.state.shadowsArray,ft=F.state.version,bt=wt.getParameters(A,F.state,it,N,W),Et=wt.getProgramCacheKey(bt);let Ut=X.programs;X.environment=A.isMeshStandardMaterial?N.environment:null,X.fog=N.fog,X.envMap=(A.isMeshStandardMaterial?B:b).get(A.envMap||X.environment),X.envMapRotation=X.environment!==null&&A.envMap===null?N.environmentRotation:A.envMapRotation,Ut===void 0&&(A.addEventListener("dispose",Ft),Ut=new Map,X.programs=Ut);let Ot=Ut.get(Et);if(Ot!==void 0){if(X.currentProgram===Ot&&X.lightsStateVersion===ft)return rl(A,bt),Ot}else bt.uniforms=wt.getUniforms(A),A.onBeforeCompile(bt,x),Ot=wt.acquireProgram(bt,Et),Ut.set(Et,Ot),X.uniforms=bt.uniforms;const Tt=X.uniforms;return(!A.isShaderMaterial&&!A.isRawShaderMaterial||A.clipping===!0)&&(Tt.clippingPlanes=et.uniform),rl(A,bt),X.needsLights=Nh(A),X.lightsStateVersion=ft,X.needsLights&&(Tt.ambientLightColor.value=F.state.ambient,Tt.lightProbe.value=F.state.probe,Tt.directionalLights.value=F.state.directional,Tt.directionalLightShadows.value=F.state.directionalShadow,Tt.spotLights.value=F.state.spot,Tt.spotLightShadows.value=F.state.spotShadow,Tt.rectAreaLights.value=F.state.rectArea,Tt.ltc_1.value=F.state.rectAreaLTC1,Tt.ltc_2.value=F.state.rectAreaLTC2,Tt.pointLights.value=F.state.point,Tt.pointLightShadows.value=F.state.pointShadow,Tt.hemisphereLights.value=F.state.hemi,Tt.directionalShadowMap.value=F.state.directionalShadowMap,Tt.directionalShadowMatrix.value=F.state.directionalShadowMatrix,Tt.spotShadowMap.value=F.state.spotShadowMap,Tt.spotLightMatrix.value=F.state.spotLightMatrix,Tt.spotLightMap.value=F.state.spotLightMap,Tt.pointShadowMap.value=F.state.pointShadowMap,Tt.pointShadowMatrix.value=F.state.pointShadowMatrix),X.currentProgram=Ot,X.uniformsList=null,Ot}function al(A){if(A.uniformsList===null){const N=A.currentProgram.getUniforms();A.uniformsList=wa.seqWithValue(N.seq,A.uniforms)}return A.uniformsList}function rl(A,N){const W=St.get(A);W.outputColorSpace=N.outputColorSpace,W.batching=N.batching,W.batchingColor=N.batchingColor,W.instancing=N.instancing,W.instancingColor=N.instancingColor,W.instancingMorph=N.instancingMorph,W.skinning=N.skinning,W.morphTargets=N.morphTargets,W.morphNormals=N.morphNormals,W.morphColors=N.morphColors,W.morphTargetsCount=N.morphTargetsCount,W.numClippingPlanes=N.numClippingPlanes,W.numIntersection=N.numClipIntersection,W.vertexAlphas=N.vertexAlphas,W.vertexTangents=N.vertexTangents,W.toneMapping=N.toneMapping}function zh(A,N,W,X,F){N.isScene!==!0&&(N=Kt),R.resetTextureUnits();const it=N.fog,ft=X.isMeshStandardMaterial?N.environment:null,bt=C===null?x.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:ji,Et=(X.isMeshStandardMaterial?B:b).get(X.envMap||ft),Ut=X.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Ot=!!W.attributes.tangent&&(!!X.normalMap||X.anisotropy>0),Tt=!!W.morphAttributes.position,jt=!!W.morphAttributes.normal,ce=!!W.morphAttributes.color;let de=Yn;X.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(de=x.toneMapping);const He=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Jt=He!==void 0?He.length:0,Ct=St.get(X),Mn=m.state.lights;if(st===!0&&(z===!0||A!==_)){const Qe=A===_&&X.id===M;et.setState(X,A,Qe)}let Qt=!1;X.version===Ct.__version?(Ct.needsLights&&Ct.lightsStateVersion!==Mn.state.version||Ct.outputColorSpace!==bt||F.isBatchedMesh&&Ct.batching===!1||!F.isBatchedMesh&&Ct.batching===!0||F.isBatchedMesh&&Ct.batchingColor===!0&&F.colorTexture===null||F.isBatchedMesh&&Ct.batchingColor===!1&&F.colorTexture!==null||F.isInstancedMesh&&Ct.instancing===!1||!F.isInstancedMesh&&Ct.instancing===!0||F.isSkinnedMesh&&Ct.skinning===!1||!F.isSkinnedMesh&&Ct.skinning===!0||F.isInstancedMesh&&Ct.instancingColor===!0&&F.instanceColor===null||F.isInstancedMesh&&Ct.instancingColor===!1&&F.instanceColor!==null||F.isInstancedMesh&&Ct.instancingMorph===!0&&F.morphTexture===null||F.isInstancedMesh&&Ct.instancingMorph===!1&&F.morphTexture!==null||Ct.envMap!==Et||X.fog===!0&&Ct.fog!==it||Ct.numClippingPlanes!==void 0&&(Ct.numClippingPlanes!==et.numPlanes||Ct.numIntersection!==et.numIntersection)||Ct.vertexAlphas!==Ut||Ct.vertexTangents!==Ot||Ct.morphTargets!==Tt||Ct.morphNormals!==jt||Ct.morphColors!==ce||Ct.toneMapping!==de||Ct.morphTargetsCount!==Jt)&&(Qt=!0):(Qt=!0,Ct.__version=X.version);let on=Ct.currentProgram;Qt===!0&&(on=ks(X,N,F));let yi=!1,qe=!1,ts=!1;const ue=on.getUniforms(),pn=Ct.uniforms;if(At.useProgram(on.program)&&(yi=!0,qe=!0,ts=!0),X.id!==M&&(M=X.id,qe=!0),yi||_!==A){At.buffers.depth.getReversed()?($.copy(A.projectionMatrix),au($),ru($),ue.setValue(U,"projectionMatrix",$)):ue.setValue(U,"projectionMatrix",A.projectionMatrix),ue.setValue(U,"viewMatrix",A.matrixWorldInverse);const kn=ue.map.cameraPosition;kn!==void 0&&kn.setValue(U,vt.setFromMatrixPosition(A.matrixWorld)),Wt.logarithmicDepthBuffer&&ue.setValue(U,"logDepthBufFC",2/(Math.log(A.far+1)/Math.LN2)),(X.isMeshPhongMaterial||X.isMeshToonMaterial||X.isMeshLambertMaterial||X.isMeshBasicMaterial||X.isMeshStandardMaterial||X.isShaderMaterial)&&ue.setValue(U,"isOrthographic",A.isOrthographicCamera===!0),_!==A&&(_=A,qe=!0,ts=!0)}if(F.isSkinnedMesh){ue.setOptional(U,F,"bindMatrix"),ue.setOptional(U,F,"bindMatrixInverse");const Qe=F.skeleton;Qe&&(Qe.boneTexture===null&&Qe.computeBoneTexture(),ue.setValue(U,"boneTexture",Qe.boneTexture,R))}F.isBatchedMesh&&(ue.setOptional(U,F,"batchingTexture"),ue.setValue(U,"batchingTexture",F._matricesTexture,R),ue.setOptional(U,F,"batchingIdTexture"),ue.setValue(U,"batchingIdTexture",F._indirectTexture,R),ue.setOptional(U,F,"batchingColorTexture"),F._colorsTexture!==null&&ue.setValue(U,"batchingColorTexture",F._colorsTexture,R));const es=W.morphAttributes;if((es.position!==void 0||es.normal!==void 0||es.color!==void 0)&&zt.update(F,W,on),(qe||Ct.receiveShadow!==F.receiveShadow)&&(Ct.receiveShadow=F.receiveShadow,ue.setValue(U,"receiveShadow",F.receiveShadow)),X.isMeshGouraudMaterial&&X.envMap!==null&&(pn.envMap.value=Et,pn.flipEnvMap.value=Et.isCubeTexture&&Et.isRenderTargetTexture===!1?-1:1),X.isMeshStandardMaterial&&X.envMap===null&&N.environment!==null&&(pn.envMapIntensity.value=N.environmentIntensity),qe&&(ue.setValue(U,"toneMappingExposure",x.toneMappingExposure),Ct.needsLights&&Uh(pn,ts),it&&X.fog===!0&&rt.refreshFogUniforms(pn,it),rt.refreshMaterialUniforms(pn,X,V,Y,m.state.transmissionRenderTarget[A.id]),wa.upload(U,al(Ct),pn,R)),X.isShaderMaterial&&X.uniformsNeedUpdate===!0&&(wa.upload(U,al(Ct),pn,R),X.uniformsNeedUpdate=!1),X.isSpriteMaterial&&ue.setValue(U,"center",F.center),ue.setValue(U,"modelViewMatrix",F.modelViewMatrix),ue.setValue(U,"normalMatrix",F.normalMatrix),ue.setValue(U,"modelMatrix",F.matrixWorld),X.isShaderMaterial||X.isRawShaderMaterial){const Qe=X.uniformsGroups;for(let kn=0,zn=Qe.length;kn<zn;kn++){const ol=Qe[kn];k.update(ol,on),k.bind(ol,on)}}return on}function Uh(A,N){A.ambientLightColor.needsUpdate=N,A.lightProbe.needsUpdate=N,A.directionalLights.needsUpdate=N,A.directionalLightShadows.needsUpdate=N,A.pointLights.needsUpdate=N,A.pointLightShadows.needsUpdate=N,A.spotLights.needsUpdate=N,A.spotLightShadows.needsUpdate=N,A.rectAreaLights.needsUpdate=N,A.hemisphereLights.needsUpdate=N}function Nh(A){return A.isMeshLambertMaterial||A.isMeshToonMaterial||A.isMeshPhongMaterial||A.isMeshStandardMaterial||A.isShadowMaterial||A.isShaderMaterial&&A.lights===!0}this.getActiveCubeFace=function(){return E},this.getActiveMipmapLevel=function(){return w},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(A,N,W){St.get(A.texture).__webglTexture=N,St.get(A.depthTexture).__webglTexture=W;const X=St.get(A);X.__hasExternalTextures=!0,X.__autoAllocateDepthBuffer=W===void 0,X.__autoAllocateDepthBuffer||kt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),X.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(A,N){const W=St.get(A);W.__webglFramebuffer=N,W.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(A,N=0,W=0){C=A,E=N,w=W;let X=!0,F=null,it=!1,ft=!1;if(A){const Et=St.get(A);if(Et.__useDefaultFramebuffer!==void 0)At.bindFramebuffer(U.FRAMEBUFFER,null),X=!1;else if(Et.__webglFramebuffer===void 0)R.setupRenderTarget(A);else if(Et.__hasExternalTextures)R.rebindTextures(A,St.get(A.texture).__webglTexture,St.get(A.depthTexture).__webglTexture);else if(A.depthBuffer){const Tt=A.depthTexture;if(Et.__boundDepthTexture!==Tt){if(Tt!==null&&St.has(Tt)&&(A.width!==Tt.image.width||A.height!==Tt.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");R.setupDepthRenderbuffer(A)}}const Ut=A.texture;(Ut.isData3DTexture||Ut.isDataArrayTexture||Ut.isCompressedArrayTexture)&&(ft=!0);const Ot=St.get(A).__webglFramebuffer;A.isWebGLCubeRenderTarget?(Array.isArray(Ot[N])?F=Ot[N][W]:F=Ot[N],it=!0):A.samples>0&&R.useMultisampledRTT(A)===!1?F=St.get(A).__webglMultisampledFramebuffer:Array.isArray(Ot)?F=Ot[W]:F=Ot,P.copy(A.viewport),I.copy(A.scissor),D=A.scissorTest}else P.copy(gt).multiplyScalar(V).floor(),I.copy(Dt).multiplyScalar(V).floor(),D=$t;if(At.bindFramebuffer(U.FRAMEBUFFER,F)&&X&&At.drawBuffers(A,F),At.viewport(P),At.scissor(I),At.setScissorTest(D),it){const Et=St.get(A.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+N,Et.__webglTexture,W)}else if(ft){const Et=St.get(A.texture),Ut=N||0;U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,Et.__webglTexture,W||0,Ut)}M=-1},this.readRenderTargetPixels=function(A,N,W,X,F,it,ft){if(!(A&&A.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let bt=St.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&ft!==void 0&&(bt=bt[ft]),bt){At.bindFramebuffer(U.FRAMEBUFFER,bt);try{const Et=A.texture,Ut=Et.format,Ot=Et.type;if(!Wt.textureFormatReadable(Ut)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Wt.textureTypeReadable(Ot)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=A.width-X&&W>=0&&W<=A.height-F&&U.readPixels(N,W,X,F,Ht.convert(Ut),Ht.convert(Ot),it)}finally{const Et=C!==null?St.get(C).__webglFramebuffer:null;At.bindFramebuffer(U.FRAMEBUFFER,Et)}}},this.readRenderTargetPixelsAsync=async function(A,N,W,X,F,it,ft){if(!(A&&A.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let bt=St.get(A).__webglFramebuffer;if(A.isWebGLCubeRenderTarget&&ft!==void 0&&(bt=bt[ft]),bt){const Et=A.texture,Ut=Et.format,Ot=Et.type;if(!Wt.textureFormatReadable(Ut))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Wt.textureTypeReadable(Ot))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(N>=0&&N<=A.width-X&&W>=0&&W<=A.height-F){At.bindFramebuffer(U.FRAMEBUFFER,bt);const Tt=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Tt),U.bufferData(U.PIXEL_PACK_BUFFER,it.byteLength,U.STREAM_READ),U.readPixels(N,W,X,F,Ht.convert(Ut),Ht.convert(Ot),0);const jt=C!==null?St.get(C).__webglFramebuffer:null;At.bindFramebuffer(U.FRAMEBUFFER,jt);const ce=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await su(U,ce,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Tt),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,it),U.deleteBuffer(Tt),U.deleteSync(ce),it}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(A,N=null,W=0){A.isTexture!==!0&&(vs("WebGLRenderer: copyFramebufferToTexture function signature has changed."),N=arguments[0]||null,A=arguments[1]);const X=Math.pow(2,-W),F=Math.floor(A.image.width*X),it=Math.floor(A.image.height*X),ft=N!==null?N.x:0,bt=N!==null?N.y:0;R.setTexture2D(A,0),U.copyTexSubImage2D(U.TEXTURE_2D,W,0,0,ft,bt,F,it),At.unbindTexture()},this.copyTextureToTexture=function(A,N,W=null,X=null,F=0){A.isTexture!==!0&&(vs("WebGLRenderer: copyTextureToTexture function signature has changed."),X=arguments[0]||null,A=arguments[1],N=arguments[2],F=arguments[3]||0,W=null);let it,ft,bt,Et,Ut,Ot,Tt,jt,ce;const de=A.isCompressedTexture?A.mipmaps[F]:A.image;W!==null?(it=W.max.x-W.min.x,ft=W.max.y-W.min.y,bt=W.isBox3?W.max.z-W.min.z:1,Et=W.min.x,Ut=W.min.y,Ot=W.isBox3?W.min.z:0):(it=de.width,ft=de.height,bt=de.depth||1,Et=0,Ut=0,Ot=0),X!==null?(Tt=X.x,jt=X.y,ce=X.z):(Tt=0,jt=0,ce=0);const He=Ht.convert(N.format),Jt=Ht.convert(N.type);let Ct;N.isData3DTexture?(R.setTexture3D(N,0),Ct=U.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(R.setTexture2DArray(N,0),Ct=U.TEXTURE_2D_ARRAY):(R.setTexture2D(N,0),Ct=U.TEXTURE_2D),U.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,N.flipY),U.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),U.pixelStorei(U.UNPACK_ALIGNMENT,N.unpackAlignment);const Mn=U.getParameter(U.UNPACK_ROW_LENGTH),Qt=U.getParameter(U.UNPACK_IMAGE_HEIGHT),on=U.getParameter(U.UNPACK_SKIP_PIXELS),yi=U.getParameter(U.UNPACK_SKIP_ROWS),qe=U.getParameter(U.UNPACK_SKIP_IMAGES);U.pixelStorei(U.UNPACK_ROW_LENGTH,de.width),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,de.height),U.pixelStorei(U.UNPACK_SKIP_PIXELS,Et),U.pixelStorei(U.UNPACK_SKIP_ROWS,Ut),U.pixelStorei(U.UNPACK_SKIP_IMAGES,Ot);const ts=A.isDataArrayTexture||A.isData3DTexture,ue=N.isDataArrayTexture||N.isData3DTexture;if(A.isRenderTargetTexture||A.isDepthTexture){const pn=St.get(A),es=St.get(N),Qe=St.get(pn.__renderTarget),kn=St.get(es.__renderTarget);At.bindFramebuffer(U.READ_FRAMEBUFFER,Qe.__webglFramebuffer),At.bindFramebuffer(U.DRAW_FRAMEBUFFER,kn.__webglFramebuffer);for(let zn=0;zn<bt;zn++)ts&&U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,St.get(A).__webglTexture,F,Ot+zn),A.isDepthTexture?(ue&&U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,St.get(N).__webglTexture,F,ce+zn),U.blitFramebuffer(Et,Ut,it,ft,Tt,jt,it,ft,U.DEPTH_BUFFER_BIT,U.NEAREST)):ue?U.copyTexSubImage3D(Ct,F,Tt,jt,ce+zn,Et,Ut,it,ft):U.copyTexSubImage2D(Ct,F,Tt,jt,ce+zn,Et,Ut,it,ft);At.bindFramebuffer(U.READ_FRAMEBUFFER,null),At.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else ue?A.isDataTexture||A.isData3DTexture?U.texSubImage3D(Ct,F,Tt,jt,ce,it,ft,bt,He,Jt,de.data):N.isCompressedArrayTexture?U.compressedTexSubImage3D(Ct,F,Tt,jt,ce,it,ft,bt,He,de.data):U.texSubImage3D(Ct,F,Tt,jt,ce,it,ft,bt,He,Jt,de):A.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,F,Tt,jt,it,ft,He,Jt,de.data):A.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,F,Tt,jt,de.width,de.height,He,de.data):U.texSubImage2D(U.TEXTURE_2D,F,Tt,jt,it,ft,He,Jt,de);U.pixelStorei(U.UNPACK_ROW_LENGTH,Mn),U.pixelStorei(U.UNPACK_IMAGE_HEIGHT,Qt),U.pixelStorei(U.UNPACK_SKIP_PIXELS,on),U.pixelStorei(U.UNPACK_SKIP_ROWS,yi),U.pixelStorei(U.UNPACK_SKIP_IMAGES,qe),F===0&&N.generateMipmaps&&U.generateMipmap(Ct),At.unbindTexture()},this.copyTextureToTexture3D=function(A,N,W=null,X=null,F=0){return A.isTexture!==!0&&(vs("WebGLRenderer: copyTextureToTexture3D function signature has changed."),W=arguments[0]||null,X=arguments[1]||null,A=arguments[2],N=arguments[3],F=arguments[4]||0),vs('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(A,N,W,X,F)},this.initRenderTarget=function(A){St.get(A).__webglFramebuffer===void 0&&R.setupRenderTarget(A)},this.initTexture=function(A){A.isCubeTexture?R.setTextureCube(A,0):A.isData3DTexture?R.setTexture3D(A,0):A.isDataArrayTexture||A.isCompressedArrayTexture?R.setTexture2DArray(A,0):R.setTexture2D(A,0),At.unbindTexture()},this.resetState=function(){E=0,w=0,C=null,At.reset(),le.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Rn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorspace=Zt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Zt._getUnpackColorSpace()}}class La{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new ct(t),this.near=e,this.far=n}clone(){return new La(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class vg extends Me{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new an,this.environmentIntensity=1,this.environmentRotation=new an,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(e.object.environmentIntensity=this.environmentIntensity),e.object.environmentRotation=this.environmentRotation.toArray(),e}}class xg{constructor(t,e){this.isInterleavedBuffer=!0,this.array=t,this.stride=e,this.count=t!==void 0?t.length/e:0,this.usage=Co,this.updateRanges=[],this.version=0,this.uuid=Zn()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,e,n){t*=this.stride,n*=e.stride;for(let i=0,s=this.stride;i<s;i++)this.array[t+i]=e.array[n+i];return this}set(t,e=0){return this.array.set(t,e),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Zn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const e=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(e,this.stride);return n.setUsage(this.usage),n}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){return t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Zn()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Ue=new L;class Ia{constructor(t,e,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=e,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let e=0,n=this.data.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.applyMatrix4(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.applyNormalMatrix(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ue.fromBufferAttribute(this,e),Ue.transformDirection(t),this.setXYZ(e,Ue.x,Ue.y,Ue.z);return this}getComponent(t,e){let n=this.array[t*this.data.stride+this.offset+e];return this.normalized&&(n=gn(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=re(n,this.array)),this.data.array[t*this.data.stride+this.offset+e]=n,this}setX(t,e){return this.normalized&&(e=re(e,this.array)),this.data.array[t*this.data.stride+this.offset]=e,this}setY(t,e){return this.normalized&&(e=re(e,this.array)),this.data.array[t*this.data.stride+this.offset+1]=e,this}setZ(t,e){return this.normalized&&(e=re(e,this.array)),this.data.array[t*this.data.stride+this.offset+2]=e,this}setW(t,e){return this.normalized&&(e=re(e,this.array)),this.data.array[t*this.data.stride+this.offset+3]=e,this}getX(t){let e=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(e=gn(e,this.array)),e}getY(t){let e=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(e=gn(e,this.array)),e}getZ(t){let e=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(e=gn(e,this.array)),e}getW(t){let e=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(e=gn(e,this.array)),e}setXY(t,e,n){return t=t*this.data.stride+this.offset,this.normalized&&(e=re(e,this.array),n=re(n,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this}setXYZ(t,e,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(e=re(e,this.array),n=re(n,this.array),i=re(i,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this}setXYZW(t,e,n,i,s){return t=t*this.data.stride+this.offset,this.normalized&&(e=re(e,this.array),n=re(n,this.array),i=re(i,this.array),s=re(s,this.array)),this.data.array[t+0]=e,this.data.array[t+1]=n,this.data.array[t+2]=i,this.data.array[t+3]=s,this}clone(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[i+s])}return new ze(new this.array.constructor(e),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new Ia(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const e=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)e.push(this.data.array[i+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class ys extends Dn{static get type(){return"SpriteMaterial"}constructor(t){super(),this.isSpriteMaterial=!0,this.color=new ct(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}let ki;const cs=new L,zi=new L,Ui=new L,Ni=new dt,hs=new dt,Mh=new te,aa=new L,ds=new L,ra=new L,vc=new dt,Pr=new dt,xc=new dt;class oa extends Me{constructor(t=new ys){if(super(),this.isSprite=!0,this.type="Sprite",ki===void 0){ki=new ge;const e=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new xg(e,5);ki.setIndex([0,1,2,0,2,3]),ki.setAttribute("position",new Ia(n,3,0,!1)),ki.setAttribute("uv",new Ia(n,2,3,!1))}this.geometry=ki,this.material=t,this.center=new dt(.5,.5)}raycast(t,e){t.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),zi.setFromMatrixScale(this.matrixWorld),Mh.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),Ui.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&zi.multiplyScalar(-Ui.z);const n=this.material.rotation;let i,s;n!==0&&(s=Math.cos(n),i=Math.sin(n));const r=this.center;la(aa.set(-.5,-.5,0),Ui,r,zi,i,s),la(ds.set(.5,-.5,0),Ui,r,zi,i,s),la(ra.set(.5,.5,0),Ui,r,zi,i,s),vc.set(0,0),Pr.set(1,0),xc.set(1,1);let o=t.ray.intersectTriangle(aa,ds,ra,!1,cs);if(o===null&&(la(ds.set(-.5,.5,0),Ui,r,zi,i,s),Pr.set(0,1),o=t.ray.intersectTriangle(aa,ra,ds,!1,cs),o===null))return;const l=t.ray.origin.distanceTo(cs);l<t.near||l>t.far||e.push({distance:l,point:cs.clone(),uv:nn.getInterpolation(cs,aa,ds,ra,vc,Pr,xc,new dt),face:null,object:this})}copy(t,e){return super.copy(t,e),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}}function la(a,t,e,n,i,s){Ni.subVectors(a,e).addScalar(.5).multiply(n),i!==void 0?(hs.x=s*Ni.x-i*Ni.y,hs.y=i*Ni.x+s*Ni.y):hs.copy(Ni),a.copy(t),a.x+=hs.x,a.y+=hs.y,a.applyMatrix4(Mh)}class Sh extends ke{constructor(t=null,e=1,n=1,i,s,r,o,l,c=Je,h=Je,d,u){super(null,r,o,l,c,h,i,s,d,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class yc extends ze{constructor(t,e,n,i=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=i}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Fi=new te,_c=new te,ca=[],Mc=new vi,yg=new te,us=new Pt,fs=new xi;class Oi extends Pt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new yc(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let i=0;i<n;i++)this.setMatrixAt(i,yg)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new vi),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Fi),Mc.copy(t.boundingBox).applyMatrix4(Fi),this.boundingBox.union(Mc)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new xi),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Fi),fs.copy(t.boundingSphere).applyMatrix4(Fi),this.boundingSphere.union(fs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),t.morphTexture!==null&&(this.morphTexture=t.morphTexture.clone()),t.instanceColor!==null&&(this.instanceColor=t.instanceColor.clone()),this.count=t.count,t.boundingBox!==null&&(this.boundingBox=t.boundingBox.clone()),t.boundingSphere!==null&&(this.boundingSphere=t.boundingSphere.clone()),this}getColorAt(t,e){e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,i=this.morphTexture.source.data.data,s=n.length+1,r=t*s+1;for(let o=0;o<n.length;o++)n[o]=i[r+o]}raycast(t,e){const n=this.matrixWorld,i=this.count;if(us.geometry=this.geometry,us.material=this.material,us.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fs.copy(this.boundingSphere),fs.applyMatrix4(n),t.ray.intersectsSphere(fs)!==!1))for(let s=0;s<i;s++){this.getMatrixAt(s,Fi),_c.multiplyMatrices(n,Fi),us.matrixWorld=_c,us.raycast(t,ca);for(let r=0,o=ca.length;r<o;r++){const l=ca[r];l.instanceId=s,l.object=this,e.push(l)}ca.length=0}}setColorAt(t,e){this.instanceColor===null&&(this.instanceColor=new yc(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3)}setMatrixAt(t,e){e.toArray(this.instanceMatrix.array,t*16)}setMorphAt(t,e){const n=e.morphTargetInfluences,i=n.length+1;this.morphTexture===null&&(this.morphTexture=new Sh(new Float32Array(i*this.count),i,this.count,Bo,vn));const s=this.morphTexture.source.data.data;let r=0;for(let c=0;c<n.length;c++)r+=n[c];const o=this.geometry.morphTargetsRelative?1:1-r,l=i*t;s[l]=o,s.set(n,l+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}}class Ga extends Dn{static get type(){return"LineBasicMaterial"}constructor(t){super(),this.isLineBasicMaterial=!0,this.color=new ct(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}}const Da=new L,ka=new L,Sc=new te,ps=new Xo,ha=new xi,Lr=new L,wc=new L;class za extends Me{constructor(t=new ge,e=new Ga){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){const t=this.geometry;if(t.index===null){const e=t.attributes.position,n=[0];for(let i=1,s=e.count;i<s;i++)Da.fromBufferAttribute(e,i-1),ka.fromBufferAttribute(e,i),n[i]=n[i-1],n[i]+=Da.distanceTo(ka);t.setAttribute("lineDistance",new he(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,s=t.params.Line.threshold,r=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ha.copy(n.boundingSphere),ha.applyMatrix4(i),ha.radius+=s,t.ray.intersectsSphere(ha)===!1)return;Sc.copy(i).invert(),ps.copy(t.ray).applyMatrix4(Sc);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=n.index,u=n.attributes.position;if(h!==null){const p=Math.max(0,r.start),g=Math.min(h.count,r.start+r.count);for(let v=p,f=g-1;v<f;v+=c){const m=h.getX(v),y=h.getX(v+1),S=da(this,t,ps,l,m,y);S&&e.push(S)}if(this.isLineLoop){const v=h.getX(g-1),f=h.getX(p),m=da(this,t,ps,l,v,f);m&&e.push(m)}}else{const p=Math.max(0,r.start),g=Math.min(u.count,r.start+r.count);for(let v=p,f=g-1;v<f;v+=c){const m=da(this,t,ps,l,v,v+1);m&&e.push(m)}if(this.isLineLoop){const v=da(this,t,ps,l,g-1,p);v&&e.push(v)}}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=i.length;s<r;s++){const o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function da(a,t,e,n,i,s){const r=a.geometry.attributes.position;if(Da.fromBufferAttribute(r,i),ka.fromBufferAttribute(r,s),e.distanceSqToSegment(Da,ka,Lr,wc)>n)return;Lr.applyMatrix4(a.matrixWorld);const l=t.ray.origin.distanceTo(Lr);if(!(l<t.near||l>t.far))return{distance:l,point:wc.clone().applyMatrix4(a.matrixWorld),index:i,face:null,faceIndex:null,barycoord:null,object:a}}class wh extends Dn{static get type(){return"PointsMaterial"}constructor(t){super(),this.isPointsMaterial=!0,this.color=new ct(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const bc=new te,Lo=new Xo,ua=new xi,fa=new L;class _g extends Me{constructor(t=new ge,e=new wh){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){const n=this.geometry,i=this.matrixWorld,s=t.params.Points.threshold,r=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ua.copy(n.boundingSphere),ua.applyMatrix4(i),ua.radius+=s,t.ray.intersectsSphere(ua)===!1)return;bc.copy(i).invert(),Lo.copy(t.ray).applyMatrix4(bc);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,d=n.attributes.position;if(c!==null){const u=Math.max(0,r.start),p=Math.min(c.count,r.start+r.count);for(let g=u,v=p;g<v;g++){const f=c.getX(g);fa.fromBufferAttribute(d,f),Ec(fa,f,l,i,t,e,this)}}else{const u=Math.max(0,r.start),p=Math.min(d.count,r.start+r.count);for(let g=u,v=p;g<v;g++)fa.fromBufferAttribute(d,g),Ec(fa,g,l,i,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const i=e[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,r=i.length;s<r;s++){const o=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function Ec(a,t,e,n,i,s,r){const o=Lo.distanceSqToPoint(a);if(o<e){const l=new L;Lo.closestPointToPoint(a,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;s.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:r})}}class Rs extends ke{constructor(t,e,n,i,s,r,o,l,c){super(t,e,n,i,s,r,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class yn{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,i=this.getPoint(0),s=0;e.push(0);for(let r=1;r<=t;r++)n=this.getPoint(r/t),s+=n.distanceTo(i),e.push(s),i=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e){const n=this.getLengths();let i=0;const s=n.length;let r;e?r=e:r=t*n[s-1];let o=0,l=s-1,c;for(;o<=l;)if(i=Math.floor(o+(l-o)/2),c=n[i]-r,c<0)o=i+1;else if(c>0)l=i-1;else{l=i;break}if(i=l,n[i]===r)return i/(s-1);const h=n[i],u=n[i+1]-h,p=(r-h)/u;return(i+p)/(s-1)}getTangent(t,e){let i=t-1e-4,s=t+1e-4;i<0&&(i=0),s>1&&(s=1);const r=this.getPoint(i),o=this.getPoint(s),l=e||(r.isVector2?new dt:new L);return l.copy(o).sub(r).normalize(),l}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e){const n=new L,i=[],s=[],r=[],o=new L,l=new te;for(let p=0;p<=t;p++){const g=p/t;i[p]=this.getTangentAt(g,new L)}s[0]=new L,r[0]=new L;let c=Number.MAX_VALUE;const h=Math.abs(i[0].x),d=Math.abs(i[0].y),u=Math.abs(i[0].z);h<=c&&(c=h,n.set(1,0,0)),d<=c&&(c=d,n.set(0,1,0)),u<=c&&n.set(0,0,1),o.crossVectors(i[0],n).normalize(),s[0].crossVectors(i[0],o),r[0].crossVectors(i[0],s[0]);for(let p=1;p<=t;p++){if(s[p]=s[p-1].clone(),r[p]=r[p-1].clone(),o.crossVectors(i[p-1],i[p]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(Pe(i[p-1].dot(i[p]),-1,1));s[p].applyMatrix4(l.makeRotationAxis(o,g))}r[p].crossVectors(i[p],s[p])}if(e===!0){let p=Math.acos(Pe(s[0].dot(s[t]),-1,1));p/=t,i[0].dot(o.crossVectors(s[0],s[t]))>0&&(p=-p);for(let g=1;g<=t;g++)s[g].applyMatrix4(l.makeRotationAxis(i[g],p*g)),r[g].crossVectors(i[g],s[g])}return{tangents:i,normals:s,binormals:r}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class Yo extends yn{constructor(t=0,e=0,n=1,i=1,s=0,r=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=i,this.aStartAngle=s,this.aEndAngle=r,this.aClockwise=o,this.aRotation=l}getPoint(t,e=new dt){const n=e,i=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const r=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=i;for(;s>i;)s-=i;s<Number.EPSILON&&(r?s=0:s=i),this.aClockwise===!0&&!r&&(s===i?s=-i:s=s-i);const o=this.aStartAngle+t*s;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),u=l-this.aX,p=c-this.aY;l=u*h-p*d+this.aX,c=u*d+p*h+this.aY}return n.set(l,c)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class Mg extends Yo{constructor(t,e,n,i,s,r){super(t,e,n,n,i,s,r),this.isArcCurve=!0,this.type="ArcCurve"}}function Zo(){let a=0,t=0,e=0,n=0;function i(s,r,o,l){a=s,t=o,e=-3*s+3*r-2*o-l,n=2*s-2*r+o+l}return{initCatmullRom:function(s,r,o,l,c){i(r,o,c*(o-s),c*(l-r))},initNonuniformCatmullRom:function(s,r,o,l,c,h,d){let u=(r-s)/c-(o-s)/(c+h)+(o-r)/h,p=(o-r)/h-(l-r)/(h+d)+(l-o)/d;u*=h,p*=h,i(r,o,u,p)},calc:function(s){const r=s*s,o=r*s;return a+t*s+e*r+n*o}}}const pa=new L,Ir=new Zo,Dr=new Zo,kr=new Zo;class Sg extends yn{constructor(t=[],e=!1,n="centripetal",i=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=i}getPoint(t,e=new L){const n=e,i=this.points,s=i.length,r=(s-(this.closed?0:1))*t;let o=Math.floor(r),l=r-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:l===0&&o===s-1&&(o=s-2,l=1);let c,h;this.closed||o>0?c=i[(o-1)%s]:(pa.subVectors(i[0],i[1]).add(i[0]),c=pa);const d=i[o%s],u=i[(o+1)%s];if(this.closed||o+2<s?h=i[(o+2)%s]:(pa.subVectors(i[s-1],i[s-2]).add(i[s-1]),h=pa),this.curveType==="centripetal"||this.curveType==="chordal"){const p=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(d),p),v=Math.pow(d.distanceToSquared(u),p),f=Math.pow(u.distanceToSquared(h),p);v<1e-4&&(v=1),g<1e-4&&(g=v),f<1e-4&&(f=v),Ir.initNonuniformCatmullRom(c.x,d.x,u.x,h.x,g,v,f),Dr.initNonuniformCatmullRom(c.y,d.y,u.y,h.y,g,v,f),kr.initNonuniformCatmullRom(c.z,d.z,u.z,h.z,g,v,f)}else this.curveType==="catmullrom"&&(Ir.initCatmullRom(c.x,d.x,u.x,h.x,this.tension),Dr.initCatmullRom(c.y,d.y,u.y,h.y,this.tension),kr.initCatmullRom(c.z,d.z,u.z,h.z,this.tension));return n.set(Ir.calc(l),Dr.calc(l),kr.calc(l)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new L().fromArray(i))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function Tc(a,t,e,n,i){const s=(n-t)*.5,r=(i-e)*.5,o=a*a,l=a*o;return(2*e-2*n+s+r)*l+(-3*e+3*n-2*s-r)*o+s*a+e}function wg(a,t){const e=1-a;return e*e*t}function bg(a,t){return 2*(1-a)*a*t}function Eg(a,t){return a*a*t}function Ss(a,t,e,n){return wg(a,t)+bg(a,e)+Eg(a,n)}function Tg(a,t){const e=1-a;return e*e*e*t}function Ag(a,t){const e=1-a;return 3*e*e*a*t}function Cg(a,t){return 3*(1-a)*a*a*t}function Rg(a,t){return a*a*a*t}function ws(a,t,e,n,i){return Tg(a,t)+Ag(a,e)+Cg(a,n)+Rg(a,i)}class bh extends yn{constructor(t=new dt,e=new dt,n=new dt,i=new dt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new dt){const n=e,i=this.v0,s=this.v1,r=this.v2,o=this.v3;return n.set(ws(t,i.x,s.x,r.x,o.x),ws(t,i.y,s.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Pg extends yn{constructor(t=new L,e=new L,n=new L,i=new L){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=i}getPoint(t,e=new L){const n=e,i=this.v0,s=this.v1,r=this.v2,o=this.v3;return n.set(ws(t,i.x,s.x,r.x,o.x),ws(t,i.y,s.y,r.y,o.y),ws(t,i.z,s.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Eh extends yn{constructor(t=new dt,e=new dt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new dt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new dt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Lg extends yn{constructor(t=new L,e=new L){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new L){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new L){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Th extends yn{constructor(t=new dt,e=new dt,n=new dt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new dt){const n=e,i=this.v0,s=this.v1,r=this.v2;return n.set(Ss(t,i.x,s.x,r.x),Ss(t,i.y,s.y,r.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Ig extends yn{constructor(t=new L,e=new L,n=new L){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new L){const n=e,i=this.v0,s=this.v1,r=this.v2;return n.set(Ss(t,i.x,s.x,r.x),Ss(t,i.y,s.y,r.y),Ss(t,i.z,s.z,r.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Ah extends yn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new dt){const n=e,i=this.points,s=(i.length-1)*t,r=Math.floor(s),o=s-r,l=i[r===0?r:r-1],c=i[r],h=i[r>i.length-2?i.length-1:r+1],d=i[r>i.length-3?i.length-1:r+2];return n.set(Tc(o,l.x,c.x,h.x,d.x),Tc(o,l.y,c.y,h.y,d.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(i.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const i=this.points[e];t.points.push(i.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const i=t.points[e];this.points.push(new dt().fromArray(i))}return this}}var Ac=Object.freeze({__proto__:null,ArcCurve:Mg,CatmullRomCurve3:Sg,CubicBezierCurve:bh,CubicBezierCurve3:Pg,EllipseCurve:Yo,LineCurve:Eh,LineCurve3:Lg,QuadraticBezierCurve:Th,QuadraticBezierCurve3:Ig,SplineCurve:Ah});class Dg extends yn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Ac[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),i=this.getCurveLengths();let s=0;for(;s<i.length;){if(i[s]>=n){const r=i[s]-n,o=this.curves[s],l=o.getLength(),c=l===0?0:1-r/l;return o.getPointAt(c,e)}s++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,i=this.curves.length;n<i;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let i=0,s=this.curves;i<s.length;i++){const r=s[i],o=r.isEllipseCurve?t*2:r.isLineCurve||r.isLineCurve3?1:r.isSplineCurve?t*r.points.length:t,l=r.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(i.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const i=this.curves[e];t.curves.push(i.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const i=t.curves[e];this.curves.push(new Ac[i.type]().fromJSON(i))}return this}}class kg extends Dg{constructor(t){super(),this.type="Path",this.currentPoint=new dt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new Eh(this.currentPoint.clone(),new dt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,i){const s=new Th(this.currentPoint.clone(),new dt(t,e),new dt(n,i));return this.curves.push(s),this.currentPoint.set(n,i),this}bezierCurveTo(t,e,n,i,s,r){const o=new bh(this.currentPoint.clone(),new dt(t,e),new dt(n,i),new dt(s,r));return this.curves.push(o),this.currentPoint.set(s,r),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new Ah(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,i,s,r){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(t+o,e+l,n,i,s,r),this}absarc(t,e,n,i,s,r){return this.absellipse(t,e,n,n,i,s,r),this}ellipse(t,e,n,i,s,r,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+c,e+h,n,i,s,r,o,l),this}absellipse(t,e,n,i,s,r,o,l){const c=new Yo(t,e,n,i,s,r,o,l);if(this.curves.length>0){const d=c.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class jo extends ge{constructor(t=[new dt(0,-.5),new dt(.5,0),new dt(0,.5)],e=12,n=0,i=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:i},e=Math.floor(e),i=Pe(i,0,Math.PI*2);const s=[],r=[],o=[],l=[],c=[],h=1/e,d=new L,u=new dt,p=new L,g=new L,v=new L;let f=0,m=0;for(let y=0;y<=t.length-1;y++)switch(y){case 0:f=t[y+1].x-t[y].x,m=t[y+1].y-t[y].y,p.x=m*1,p.y=-f,p.z=m*0,v.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case t.length-1:l.push(v.x,v.y,v.z);break;default:f=t[y+1].x-t[y].x,m=t[y+1].y-t[y].y,p.x=m*1,p.y=-f,p.z=m*0,g.copy(p),p.x+=v.x,p.y+=v.y,p.z+=v.z,p.normalize(),l.push(p.x,p.y,p.z),v.copy(g)}for(let y=0;y<=e;y++){const S=n+y*h*i,x=Math.sin(S),T=Math.cos(S);for(let E=0;E<=t.length-1;E++){d.x=t[E].x*x,d.y=t[E].y,d.z=t[E].x*T,r.push(d.x,d.y,d.z),u.x=y/e,u.y=E/(t.length-1),o.push(u.x,u.y);const w=l[3*E+0]*x,C=l[3*E+1],M=l[3*E+0]*T;c.push(w,C,M)}}for(let y=0;y<e;y++)for(let S=0;S<t.length-1;S++){const x=S+y*t.length,T=x,E=x+t.length,w=x+t.length+1,C=x+1;s.push(T,E,C),s.push(w,C,E)}this.setIndex(s),this.setAttribute("position",new he(r,3)),this.setAttribute("uv",new he(o,2)),this.setAttribute("normal",new he(c,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new jo(t.points,t.segments,t.phiStart,t.phiLength)}}class Ko extends jo{constructor(t=1,e=1,n=4,i=8){const s=new kg;s.absarc(0,-e/2,t,Math.PI*1.5,0),s.absarc(0,e/2,t,0,Math.PI*.5),super(s.getPoints(n),i),this.type="CapsuleGeometry",this.parameters={radius:t,length:e,capSegments:n,radialSegments:i}}static fromJSON(t){return new Ko(t.radius,t.length,t.capSegments,t.radialSegments)}}class We extends ge{constructor(t=1,e=1,n=1,i=32,s=1,r=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:l};const c=this;i=Math.floor(i),s=Math.floor(s);const h=[],d=[],u=[],p=[];let g=0;const v=[],f=n/2;let m=0;y(),r===!1&&(t>0&&S(!0),e>0&&S(!1)),this.setIndex(h),this.setAttribute("position",new he(d,3)),this.setAttribute("normal",new he(u,3)),this.setAttribute("uv",new he(p,2));function y(){const x=new L,T=new L;let E=0;const w=(e-t)/n;for(let C=0;C<=s;C++){const M=[],_=C/s,P=_*(e-t)+t;for(let I=0;I<=i;I++){const D=I/i,O=D*l+o,G=Math.sin(O),H=Math.cos(O);T.x=P*G,T.y=-_*n+f,T.z=P*H,d.push(T.x,T.y,T.z),x.set(G,w,H).normalize(),u.push(x.x,x.y,x.z),p.push(D,1-_),M.push(g++)}v.push(M)}for(let C=0;C<i;C++)for(let M=0;M<s;M++){const _=v[M][C],P=v[M+1][C],I=v[M+1][C+1],D=v[M][C+1];(t>0||M!==0)&&(h.push(_,P,D),E+=3),(e>0||M!==s-1)&&(h.push(P,I,D),E+=3)}c.addGroup(m,E,0),m+=E}function S(x){const T=g,E=new dt,w=new L;let C=0;const M=x===!0?t:e,_=x===!0?1:-1;for(let I=1;I<=i;I++)d.push(0,f*_,0),u.push(0,_,0),p.push(.5,.5),g++;const P=g;for(let I=0;I<=i;I++){const O=I/i*l+o,G=Math.cos(O),H=Math.sin(O);w.x=M*H,w.y=f*_,w.z=M*G,d.push(w.x,w.y,w.z),u.push(0,_,0),E.x=G*.5+.5,E.y=H*.5*_+.5,p.push(E.x,E.y),g++}for(let I=0;I<i;I++){const D=T+I,O=P+I;x===!0?h.push(O,O+1,D):h.push(O+1,O,D),C+=3}c.addGroup(m,C,x===!0?1:2),m+=C}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new We(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Va extends We{constructor(t=1,e=1,n=32,i=1,s=!1,r=0,o=Math.PI*2){super(0,t,e,n,i,s,r,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:i,openEnded:s,thetaStart:r,thetaLength:o}}static fromJSON(t){return new Va(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Ps extends ge{constructor(t=[],e=[],n=1,i=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:i};const s=[],r=[];o(i),c(n),h(),this.setAttribute("position",new he(s,3)),this.setAttribute("normal",new he(s.slice(),3)),this.setAttribute("uv",new he(r,2)),i===0?this.computeVertexNormals():this.normalizeNormals();function o(y){const S=new L,x=new L,T=new L;for(let E=0;E<e.length;E+=3)p(e[E+0],S),p(e[E+1],x),p(e[E+2],T),l(S,x,T,y)}function l(y,S,x,T){const E=T+1,w=[];for(let C=0;C<=E;C++){w[C]=[];const M=y.clone().lerp(x,C/E),_=S.clone().lerp(x,C/E),P=E-C;for(let I=0;I<=P;I++)I===0&&C===E?w[C][I]=M:w[C][I]=M.clone().lerp(_,I/P)}for(let C=0;C<E;C++)for(let M=0;M<2*(E-C)-1;M++){const _=Math.floor(M/2);M%2===0?(u(w[C][_+1]),u(w[C+1][_]),u(w[C][_])):(u(w[C][_+1]),u(w[C+1][_+1]),u(w[C+1][_]))}}function c(y){const S=new L;for(let x=0;x<s.length;x+=3)S.x=s[x+0],S.y=s[x+1],S.z=s[x+2],S.normalize().multiplyScalar(y),s[x+0]=S.x,s[x+1]=S.y,s[x+2]=S.z}function h(){const y=new L;for(let S=0;S<s.length;S+=3){y.x=s[S+0],y.y=s[S+1],y.z=s[S+2];const x=f(y)/2/Math.PI+.5,T=m(y)/Math.PI+.5;r.push(x,1-T)}g(),d()}function d(){for(let y=0;y<r.length;y+=6){const S=r[y+0],x=r[y+2],T=r[y+4],E=Math.max(S,x,T),w=Math.min(S,x,T);E>.9&&w<.1&&(S<.2&&(r[y+0]+=1),x<.2&&(r[y+2]+=1),T<.2&&(r[y+4]+=1))}}function u(y){s.push(y.x,y.y,y.z)}function p(y,S){const x=y*3;S.x=t[x+0],S.y=t[x+1],S.z=t[x+2]}function g(){const y=new L,S=new L,x=new L,T=new L,E=new dt,w=new dt,C=new dt;for(let M=0,_=0;M<s.length;M+=9,_+=6){y.set(s[M+0],s[M+1],s[M+2]),S.set(s[M+3],s[M+4],s[M+5]),x.set(s[M+6],s[M+7],s[M+8]),E.set(r[_+0],r[_+1]),w.set(r[_+2],r[_+3]),C.set(r[_+4],r[_+5]),T.copy(y).add(S).add(x).divideScalar(3);const P=f(T);v(E,_+0,y,P),v(w,_+2,S,P),v(C,_+4,x,P)}}function v(y,S,x,T){T<0&&y.x===1&&(r[S]=y.x-1),x.x===0&&x.z===0&&(r[S]=T/2/Math.PI+.5)}function f(y){return Math.atan2(y.z,-y.x)}function m(y){return Math.atan2(-y.y,Math.sqrt(y.x*y.x+y.z*y.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ps(t.vertices,t.indices,t.radius,t.details)}}class Jo extends Ps{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,i=1/n,s=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-i,-n,0,-i,n,0,i,-n,0,i,n,-i,-n,0,-i,n,0,i,-n,0,i,n,0,-n,0,-i,n,0,-i,-n,0,i,n,0,i],r=[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9];super(s,r,t,e),this.type="DodecahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Jo(t.radius,t.detail)}}class Ls extends Ps{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,i=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(i,s,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Ls(t.radius,t.detail)}}class Wa extends Ps{constructor(t=1,e=0){const n=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],i=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(n,i,t,e),this.type="OctahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Wa(t.radius,t.detail)}}class Xa extends ge{constructor(t=.5,e=1,n=32,i=1,s=0,r=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:i,thetaStart:s,thetaLength:r},n=Math.max(3,n),i=Math.max(1,i);const o=[],l=[],c=[],h=[];let d=t;const u=(e-t)/i,p=new L,g=new dt;for(let v=0;v<=i;v++){for(let f=0;f<=n;f++){const m=s+f/n*r;p.x=d*Math.cos(m),p.y=d*Math.sin(m),l.push(p.x,p.y,p.z),c.push(0,0,1),g.x=(p.x/e+1)/2,g.y=(p.y/e+1)/2,h.push(g.x,g.y)}d+=u}for(let v=0;v<i;v++){const f=v*(n+1);for(let m=0;m<n;m++){const y=m+f,S=y,x=y+n+1,T=y+n+2,E=y+1;o.push(S,x,E),o.push(x,T,E)}}this.setIndex(o),this.setAttribute("position",new he(l,3)),this.setAttribute("normal",new he(c,3)),this.setAttribute("uv",new he(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Xa(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}}class Ke extends ge{constructor(t=1,e=32,n=16,i=0,s=Math.PI*2,r=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:i,phiLength:s,thetaStart:r,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(r+o,Math.PI);let c=0;const h=[],d=new L,u=new L,p=[],g=[],v=[],f=[];for(let m=0;m<=n;m++){const y=[],S=m/n;let x=0;m===0&&r===0?x=.5/e:m===n&&l===Math.PI&&(x=-.5/e);for(let T=0;T<=e;T++){const E=T/e;d.x=-t*Math.cos(i+E*s)*Math.sin(r+S*o),d.y=t*Math.cos(r+S*o),d.z=t*Math.sin(i+E*s)*Math.sin(r+S*o),g.push(d.x,d.y,d.z),u.copy(d).normalize(),v.push(u.x,u.y,u.z),f.push(E+x,1-S),y.push(c++)}h.push(y)}for(let m=0;m<n;m++)for(let y=0;y<e;y++){const S=h[m][y+1],x=h[m][y],T=h[m+1][y],E=h[m+1][y+1];(m!==0||r>0)&&p.push(S,x,E),(m!==n-1||l<Math.PI)&&p.push(x,T,E)}this.setIndex(p),this.setAttribute("position",new he(g,3)),this.setAttribute("normal",new he(v,3)),this.setAttribute("uv",new he(f,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Ke(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}class Is extends ge{constructor(t=1,e=.4,n=12,i=48,s=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:i,arc:s},n=Math.floor(n),i=Math.floor(i);const r=[],o=[],l=[],c=[],h=new L,d=new L,u=new L;for(let p=0;p<=n;p++)for(let g=0;g<=i;g++){const v=g/i*s,f=p/n*Math.PI*2;d.x=(t+e*Math.cos(f))*Math.cos(v),d.y=(t+e*Math.cos(f))*Math.sin(v),d.z=e*Math.sin(f),o.push(d.x,d.y,d.z),h.x=t*Math.cos(v),h.y=t*Math.sin(v),u.subVectors(d,h).normalize(),l.push(u.x,u.y,u.z),c.push(g/i),c.push(p/n)}for(let p=1;p<=n;p++)for(let g=1;g<=i;g++){const v=(i+1)*p+g-1,f=(i+1)*(p-1)+g-1,m=(i+1)*(p-1)+g,y=(i+1)*p+g;r.push(v,f,y),r.push(f,m,y)}this.setIndex(r),this.setAttribute("position",new he(o,3)),this.setAttribute("normal",new he(l,3)),this.setAttribute("uv",new he(c,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Is(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}}class zg extends Dn{static get type(){return"MeshPhongMaterial"}constructor(t){super(),this.isMeshPhongMaterial=!0,this.color=new ct(16777215),this.specular=new ct(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ct(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Wo,this.normalScale=new dt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new an,this.combine=Fa,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.specular.copy(t.specular),this.shininess=t.shininess,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Fe extends Dn{static get type(){return"MeshLambertMaterial"}constructor(t){super(),this.isMeshLambertMaterial=!0,this.color=new ct(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ct(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Wo,this.normalScale=new dt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new an,this.combine=Fa,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Ch extends Me{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new ct(t),this.intensity=e}dispose(){}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,this.groundColor!==void 0&&(e.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(e.object.distance=this.distance),this.angle!==void 0&&(e.object.angle=this.angle),this.decay!==void 0&&(e.object.decay=this.decay),this.penumbra!==void 0&&(e.object.penumbra=this.penumbra),this.shadow!==void 0&&(e.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(e.object.target=this.target.uuid),e}}class Ug extends Ch{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Me.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ct(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}}const zr=new te,Cc=new L,Rc=new L;class Ng{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new dt(512,512),this.map=null,this.mapPass=null,this.matrix=new te,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new qo,this._frameExtents=new dt(1,1),this._viewportCount=1,this._viewports=[new me(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera,n=this.matrix;Cc.setFromMatrixPosition(t.matrixWorld),e.position.copy(Cc),Rc.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Rc),e.updateMatrixWorld(),zr.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(zr),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(zr)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.mapSize.copy(t.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return this.intensity!==1&&(t.intensity=this.intensity),this.bias!==0&&(t.bias=this.bias),this.normalBias!==0&&(t.normalBias=this.normalBias),this.radius!==1&&(t.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(t.mapSize=this.mapSize.toArray()),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}class Fg extends Ng{constructor(){super(new mh(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Og extends Ch{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Me.DEFAULT_UP),this.updateMatrix(),this.target=new Me,this.shadow=new Fg}dispose(){this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Uo}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Uo);const Ua=new Map;function Nt(a,t,e){const n=`b${a},${t},${e}`;let i=Ua.get(n);return i||(i=new Ge(a,t,e),Ua.set(n,i)),i}function Se(a,t,e,n=10){const i=`c${a},${t},${e},${n}`;let s=Ua.get(i);return s||(s=new We(a,t,e,n),Ua.set(i,s)),s}const Pc=new Map;function Xt(a,t){const e=`l${a}${t??""}`;let n=Pc.get(e);return n||(n=new Fe({color:new ct(a)}),t!==void 0&&(n.emissive=new ct(t)),Pc.set(e,n)),n}function pt(a,t,e=0,n=0,i=0){const s=new Pt(a,t);return s.position.set(e,n,i),s.castShadow=!0,s}function Lc(a,t){const e=new be,n=Ce[a],i=Xt(n.color),s=Xt("#3a3a44"),r=Xt("#c77d3d"),o=Xt(un[t].color,un[t].color),l=h=>(e.add(h),h);switch(a){case"wayfarer":l(pt(Nt(.07,.12,.5),i,0,.02,.22)),l(pt(Se(.02,.02,.45),s,0,.04,.62)).rotation.x=Math.PI/2,l(pt(Nt(.06,.1,.22),Xt("#8a5a3a"),0,-.01,-.12)),l(pt(Nt(.05,.14,.07),s,0,-.12,.2)).rotation.x=.25,l(pt(Se(.012,.012,.3),r,.05,.07,.35)).rotation.x=Math.PI/2;break;case"tempest":l(pt(Nt(.07,.11,.38),i,0,.02,.16)),l(pt(Se(.022,.022,.3),s,0,.03,.46)).rotation.x=Math.PI/2,l(pt(Nt(.045,.13,.06),s,0,-.12,.12)).rotation.x=.1,l(pt(Nt(.06,.07,.16),Xt("#245a5a"),0,.01,-.1));break;case"breakwater":l(pt(Nt(.08,.11,.42),i,0,.02,.18)),l(pt(Se(.035,.035,.55),s,0,.05,.6)).rotation.x=Math.PI/2,l(pt(Nt(.1,.08,.2),Xt("#6a4630"),0,-.01,.42)),l(pt(Nt(.06,.1,.2),Xt("#6a4630"),0,-.01,-.1));break;case"coil":{l(pt(Nt(.08,.11,.4),i,0,.02,.18)),l(pt(Se(.03,.03,.5),s,0,.05,.56)).rotation.x=Math.PI/2;for(let h=0;h<4;h++){const d=pt(new Is(.05,.012,6,12),r,0,.05,.4+h*.1);e.add(d)}l(pt(Nt(.06,.1,.2),s,0,-.01,-.1));break}case"needler":l(pt(Nt(.06,.1,.3),i,0,.02,.12)),l(pt(Se(.015,.015,.2),s,0,.03,.36)).rotation.x=Math.PI/2,l(pt(Nt(.04,.2,.05),s,0,-.14,.14)),l(pt(Nt(.045,.08,.1),i,0,0,-.06));break;case"sundial":{l(pt(Nt(.07,.12,.6),i,0,.02,.28)),l(pt(Se(.02,.02,.4),s,0,.04,.78)).rotation.x=Math.PI/2;const h=l(pt(Se(.035,.035,.22),s,0,.13,.3));h.rotation.x=Math.PI/2;const d=l(pt(Se(.06,.06,.015,16),r,0,.12,.18));d.rotation.z=Math.PI/2,l(pt(Nt(.06,.1,.22),Xt("#8a5a3a"),0,-.02,-.14));break}case"longwake":{l(pt(Nt(.07,.11,.55),i,0,.02,.25)),l(pt(Se(.025,.025,.7),s,0,.04,.85)).rotation.x=Math.PI/2;for(let d=0;d<3;d++)l(pt(Nt(.1,.1,.03),r,0,.04,.6+d*.18));const h=l(pt(new Ke(.035,8,6),Xt("#d8c8ff","#b79bff"),0,.15,.32));h.castShadow=!1,l(pt(Nt(.06,.1,.22),s,0,-.02,-.14));break}case"harbor":l(pt(Nt(.05,.08,.22),i,0,.03,.1)),l(pt(Nt(.045,.14,.06),s,0,-.07,0)).rotation.x=-.2,l(pt(Se(.012,.012,.08),s,0,.04,.24)).rotation.x=Math.PI/2;break;case"gale":{l(pt(Nt(.08,.11,.4),i,0,.02,.16));const h=l(pt(Se(.12,.04,.3,14),r,0,.04,.5));h.rotation.x=Math.PI/2,l(pt(Se(.03,.03,.25),s,0,.04,.28)).rotation.x=Math.PI/2,l(pt(Nt(.06,.1,.2),s,0,-.02,-.1));break}}const c=pt(Nt(.035,.035,.035),o,0,.1,.05);return c.castShadow=!1,e.add(c),e}function Ic(a){const t=new be,e=fe[a].color,n=Xt(e,e);switch(a){case"medInjector":t.add(pt(Se(.05,.05,.3,8),n)),t.add(pt(Se(.012,.012,.12),Xt("#ddd"),0,.2,0));break;case"traumaKit":t.add(pt(Nt(.34,.2,.22),Xt("#e8e8e8"))),t.add(pt(Nt(.1,.22,.24),n)),t.add(pt(Nt(.24,.22,.1),n));break;case"shieldFlask":t.add(pt(new Ke(.14,10,8),n,0,.05,0)),t.add(pt(Se(.04,.05,.12),Xt("#ddd"),0,.22,0));break;case"aegisCell":t.add(pt(Nt(.2,.28,.12),n)),t.add(pt(Nt(.1,.06,.13),Xt("#fff"),0,.17,0));break;case"mistCapsule":t.add(pt(new Ko(.07,.2,4,8),n));break;case"grappleSpool":{const i=pt(new Is(.12,.05,8,14),n);i.rotation.x=Math.PI/2,t.add(i);break}case"echoBeacon":t.add(pt(new Wa(.16),n));break;case"windOrb":t.add(pt(new Ls(.14,1),n));break}return t}const Dc=["#e9b98f","#c98c62","#8f5d3d","#f2cfae"];function Bg(a,t){const e=Hr[a%Hr.length],n=Xt(e.primary),i=Xt(e.secondary),s=new ct(e.primary).multiplyScalar(.55).getStyle(),r=Xt(s),o=Xt("#566077"),l=new be,c=new be;l.add(c);const h=pt(Nt(.52,.62,.3),n,0,1.15,0);c.add(h);const d=pt(Nt(.54,.3,.32),i,0,1,0);c.add(d);const u=pt(Nt(.34,.44,.2),r,0,1.2,-.25);c.add(u);const p=pt(Se(.09,.09,.44,8),i,0,1.46,-.28);p.rotation.z=Math.PI/2,c.add(p);const g=pt(new Ke(.2,12,10),Xt(Dc[t%Dc.length]),0,1.68,0);c.add(g);const v=pt(Nt(.34,.1,.1),Xt("#2a2f3a","#1a5560"),0,1.7,.16);c.add(v);const f=pt(new Ke(.215,12,8,0,Math.PI*2,0,Math.PI/2),n,0,1.71,0);c.add(f);const m=Nt(.2,.8,.22).clone();m.translate(0,-.4,0);const y=new Pt(m,o);y.castShadow=!0,y.position.set(-.14,.82,0);const S=new Pt(m,o);S.castShadow=!0,S.position.set(.14,.82,0),c.add(y),c.add(S);const x=Nt(.15,.55,.16).clone();x.translate(0,-.26,0);const T=new Pt(x,n);T.castShadow=!0,T.position.set(-.36,1.4,0);const E=new Pt(x,n);E.castShadow=!0,E.position.set(.36,1.4,0),c.add(T),c.add(E);const w=new be;w.position.set(.3,1.18,.28),c.add(w);const C=new be,M=new Fe({color:new ct(e.primary),side:we,emissive:new ct(e.primary),emissiveIntensity:.65}),_=new fn(3.4,1.9,6,3),P=_.attributes.position;for(let H=0;H<P.count;H++){const Y=P.getX(H),V=P.getY(H);P.setZ(H,-Math.abs(Y)*.12+V*.18),P.setY(H,V*(1-Math.abs(Y)*.05))}_.computeVertexNormals();const I=new Pt(_,M);I.rotation.x=-Math.PI/2+.25,I.position.set(0,3.3,-.2),I.castShadow=!1,C.add(I);const D=new Pt(new fn(.5,1.9),new Fe({color:new ct(e.secondary),side:we}));D.rotation.x=-Math.PI/2+.25,D.position.set(0,3.32,-.2),C.add(D);const O=new Ga({color:15658734});for(const H of[-1.5,1.5]){const Y=new ge().setFromPoints([new L(H,3.2,-.6),new L(H*.1,1.5,-.1)]);C.add(new za(Y,O));const V=new ge().setFromPoints([new L(H,3.4,.5),new L(H*.1,1.5,.1)]);C.add(new za(V,O))}C.visible=!1,l.add(C);const G=pt(new Ke(.08,8,6),Xt("#fff","#9fe"),.3,1.45,.35);return G.visible=!1,c.add(G),{root:l,body:c,legL:y,legR:S,armL:T,armR:E,torso:h,head:g,hand:w,weaponKey:"",weapon:null,wing:C,using:G}}function Hg(){const a=new be,t=Xt("#e7d9bb"),e=Xt("#c77d3d"),n=Xt("#2aa6b4"),i=Xt("#4a4a55"),s=pt(Nt(12,.6,30),t,0,0,0);a.add(s);const r=pt(new Va(6,10,4),t,0,0,20);r.rotation.x=Math.PI/2,r.rotation.y=Math.PI/4,r.scale.set(1,1,.1),a.add(r);const o=pt(Nt(3,1.6,26),e,0,-1,-1);a.add(o);for(const h of[-7,7]){const d=pt(Se(1.8,1.8,6,14),e,h,.6,-10);d.rotation.x=Math.PI/2,a.add(d);const u=new be;u.name="blades",u.position.set(h,.6,-13.1);for(let p=0;p<4;p++){const g=pt(Nt(.3,3.4,.1),i);g.rotation.z=p*Math.PI/2,u.add(g)}a.add(u),a.add(pt(Nt(.5,2.4,.5),i,h*.86,1,-6))}for(let h=0;h<2;h++){const d=pt(Nt(11.4,1,.2),n,0,.8,9-h*18);a.add(d)}a.add(pt(Nt(.2,1,29),n,-5.8,.8,0)),a.add(pt(Nt(.2,1,29),n,5.8,.8,0));const l=pt(Se(.15,.15,9,6),i,0,5,-13.4);a.add(l);const c=new Pt(new fn(7,7),new Fe({color:new ct("#ff7b4a"),side:we,emissive:new ct("#ff7b4a"),emissiveIntensity:.5}));return c.position.set(0,6.5,-13.5),c.rotation.y=Math.PI/2,a.add(c),a.traverse(h=>{h.castShadow=!0}),a}const ma=["#e9dcbe","#c8773a","#a9794d","#e8613f","#2f9aa8","#b5ac9a","#6c747c","#d98a4a","#b98a58","#c9b58b","#9ad7e6","#4a4650"],Ve={g0:new ct("#5fae4f"),g1:new ct("#86c95e"),hi:new ct("#bfb69f"),sand:new ct("#e7d7a6"),sea:new ct("#58b7b0"),cliff:new ct("#9b9184"),aerie:new ct("#d9ca9f"),kiln:new ct("#76706b"),array:new ct("#8ac2b9"),orchard:new ct("#4a9348"),abbey:new ct("#cfc7ad"),docks:new ct("#b9ab8a"),quarry:new ct("#a69b88"),other:new ct("#cdbf98")},Gg={aerie:Ve.aerie,kiln:Ve.kiln,array:Ve.array,orchard:Ve.orchard,abbey:Ve.abbey,docks:Ve.docks,quarry:Ve.quarry};function Vg(a,t,e,n,i){const s=a.slopeAt(t,e),r=Ms(t/22,e/22,a.seed+3,3),o=Ms(t/7,e/7,a.seed+9,2);i.copy(Ve.g0).lerp(Ve.g1,r),i.multiplyScalar(.88+o*.24);const l=xe(26,46,n);l>0&&i.lerp(Ve.hi,l*.7);const c=1-xe(1.2,3.2,n);c>0&&i.lerp(Ve.sand,c),n<.2&&i.lerp(Ve.sea,xe(.2,-3,n)*.9);const h=xe(.42,.85,s);h>0&&i.lerp(Ve.cliff,h*.9);for(const d of a.locations){const u=Math.hypot(t-d.x,e-d.z);if(u>d.r)continue;const p=1-xe(d.r*.55,d.r,u);i.lerp(Gg[d.id]??Ve.other,p*(d.id==="orchard"?.45:.8))}return i}function Wg(a){const t=new be,e=new ct,n=50,i=a.res,s=new Fe({vertexColors:!0}),r=Math.ceil((a.n-1)/n);for(let z=0;z<r;z++)for(let $=0;$<r;$++){const tt=$*n,vt=z*n,It=Math.min(n,a.n-1-tt),Kt=Math.min(n,a.n-1-vt),Vt=(It+1)*(Kt+1),oe=new Float32Array(Vt*3),U=new Float32Array(Vt*3),Re=new Float32Array(Vt*3);let kt=0;for(let St=0;St<=Kt;St++)for(let R=0;R<=It;R++){const b=(tt+R)*i-a.half,B=(vt+St)*i-a.half,j=a.heights[(vt+St)*a.n+(tt+R)];oe[kt*3]=b,oe[kt*3+1]=j,oe[kt*3+2]=B;const J=i,Z=a.heightAt(b+J,B)-a.heightAt(b-J,B),wt=a.heightAt(b,B+J)-a.heightAt(b,B-J),rt=new L(-Z/(2*J),1,-wt/(2*J)).normalize();U[kt*3]=rt.x,U[kt*3+1]=rt.y,U[kt*3+2]=rt.z,Vg(a,b,B,j,e),Re[kt*3]=e.r,Re[kt*3+1]=e.g,Re[kt*3+2]=e.b,kt++}const Wt=[];for(let St=0;St<Kt;St++)for(let R=0;R<It;R++){const b=St*(It+1)+R,B=b+1,j=b+(It+1),J=j+1;Wt.push(b,j,B,B,j,J)}const At=new ge;At.setAttribute("position",new ze(oe,3)),At.setAttribute("normal",new ze(U,3)),At.setAttribute("color",new ze(Re,3)),At.setIndex(Wt),At.computeBoundingSphere();const ie=new Pt(At,s);ie.receiveShadow=!0,t.add(ie)}const o=new Ge(1,1,1),l=new Fe({color:16777215}),c=new Oi(o,l,Math.max(1,a.boxes.length));c.castShadow=!0,c.receiveShadow=!0;const h=new te,d=new ct;a.boxes.forEach((z,$)=>{h.makeScale(z.maxX-z.minX,z.maxY-z.minY,z.maxZ-z.minZ),h.setPosition((z.minX+z.maxX)/2,(z.minY+z.maxY)/2,(z.minZ+z.maxZ)/2),c.setMatrixAt($,h),d.set(ma[z.style%ma.length]);const tt=.92+$*2654435761%1e3/1e3*.14;d.multiplyScalar(tt),c.setColorAt($,d)}),c.instanceMatrix.needsUpdate=!0,c.instanceColor&&(c.instanceColor.needsUpdate=!0),t.add(c);const u=new We(.28,.42,1,6);u.translate(0,.5,0);const p=new Ls(1,1),g=new Va(1,1.8,7);g.translate(0,.9,0);const v=new Jo(1,0),f=new We(1,1,1,14);f.translate(0,.5,0);const m=new Ke(1,16,8,0,Math.PI*2,0,Math.PI*.42),y=a.cyls.filter(z=>z.kind==="tree"),S=a.cyls.filter(z=>z.kind==="rock"),x=a.cyls.filter(z=>z.kind==="pillar"||z.kind==="stack"||z.kind==="tank"),T=a.cyls.filter(z=>z.kind==="dish"),E=new Oi(u,new Fe({color:8018490}),Math.max(1,y.length)),w=new Oi(p,new Fe({color:16777215}),Math.max(1,y.length)),C=new Oi(g,new Fe({color:16777215}),Math.max(1,y.length));E.castShadow=w.castShadow=C.castShadow=!0;const M=new Ji,_=new L,P=new L,I=new an;y.forEach((z,$)=>{const tt=z.y1-z.y0,vt=$*7919%97/97;P.set(z.x,z.y0+.5,z.z),_.set(1,tt*.55,1),M.identity(),h.compose(P,M,_),E.setMatrixAt($,h),z.style===1?(P.set(z.x,z.y0+tt*.8,z.z),_.set(1.9+vt*.4,1.6+vt*.3,1.9+vt*.4),h.compose(P,M,_),w.setMatrixAt($,h),w.setColorAt($,d.set("#4f9a3f").lerp(new ct("#d9803a"),vt>.8?.7:0)),h.compose(new L(0,-100,0),M,new L(.01,.01,.01)),C.setMatrixAt($,h)):(P.set(z.x,z.y0+tt*.35,z.z),_.set(1.6+vt*.6,1.3+vt*.5,1.6+vt*.6),h.compose(P,M,_),C.setMatrixAt($,h),C.setColorAt($,d.set("#2f7f45").lerp(new ct("#4fae52"),vt)),P.set(z.x,z.y0+tt*.8,z.z),_.set(1.1+vt*.3,1,1.1+vt*.3),h.compose(P,M,_),w.setMatrixAt($,h),w.setColorAt($,d.set("#3d9a4a").lerp(new ct("#6cc25a"),vt)))}),[E,w,C].forEach(z=>{z.instanceMatrix.needsUpdate=!0,z.instanceColor&&(z.instanceColor.needsUpdate=!0),t.add(z)});const D=new Oi(v,new Fe({color:16777215}),Math.max(1,S.length));D.castShadow=!0,D.receiveShadow=!0,S.forEach((z,$)=>{const tt=Math.max(.8,(z.y1-z.y0)*.7);P.set(z.x,z.y1-tt*.55,z.z),I.set($*.7,$*1.3,$*.3),M.setFromEuler(I),_.set(z.r*1.1,tt,z.r*1.05),h.compose(P,M,_),D.setMatrixAt($,h),D.setColorAt($,d.set("#a39a8c").lerp(new ct("#c8bfae"),$*31%10/10))}),D.instanceMatrix.needsUpdate=!0,D.instanceColor&&(D.instanceColor.needsUpdate=!0),t.add(D);const O=new Oi(f,new Fe({color:16777215}),Math.max(1,x.length));O.castShadow=!0,x.forEach((z,$)=>{P.set(z.x,z.y0,z.z),M.identity(),_.set(z.r,z.y1-z.y0,z.r),h.compose(P,M,_),O.setMatrixAt($,h),O.setColorAt($,d.set(ma[z.style%ma.length]))}),O.instanceMatrix.needsUpdate=!0,O.instanceColor&&(O.instanceColor.needsUpdate=!0),t.add(O);const G=new Fe({color:15326398,side:we});for(const z of T){const $=new Pt(m,G);$.scale.set(z.r*1.15,z.r*.9,z.r*1.15),$.position.set(z.x,z.y1-z.r*.4,z.z),$.rotation.x=Math.PI,$.rotation.z=.5,$.castShadow=!0,t.add($);const tt=new Pt(f,Ur("#c8773a"));tt.scale.set(.35,z.y1-z.y0,.35),tt.position.set(z.x,z.y0,z.z),tt.castShadow=!0,t.add(tt)}const H=new Oe({color:new ct("#ff7a2a"),transparent:!0,opacity:.85});for(const z of a.hazards){const $=new fn(z.x1-z.x0,z.z1-z.z0),tt=new Pt($,H);tt.rotation.x=-Math.PI/2,tt.position.set((z.x0+z.x1)/2,a.heightAt((z.x0+z.x1)/2,(z.z0+z.z1)/2)+.08,(z.z0+z.z1)/2),t.add(tt)}const Y=new Ga({color:16051408});for(const z of a.ziplines){const $=new ge().setFromPoints([new L(z.a.x,z.a.y,z.a.z),new L(z.b.x,z.b.y,z.b.z)]);t.add(new za($,Y));for(const tt of[z.a,z.b]){const vt=new Pt(f,Ur("#c8773a")),It=a.groundHeight(tt.x,tt.z,tt.y,20,.5,[],[]);vt.scale.set(.12,Math.max(.5,tt.y-It),.12),vt.position.set(tt.x,It,tt.z),t.add(vt);const Kt=new Pt(new Is(.28,.06,6,10),Ur("#ffd166"));Kt.position.set(tt.x,tt.y,tt.z),Kt.rotation.x=Math.PI/2,t.add(Kt)}}const V=new Oe({color:9431551,transparent:!0,opacity:.28,side:we,depthWrite:!1,blending:di}),at=[];for(const z of a.vents){const $=new Pt(new We(z.r*.7,z.r,14,16,1,!0),V);$.position.set(z.x,z.y+7,z.z),t.add($),at.push($);const tt=new Pt(new Xa(z.r*.6,z.r,20),new Oe({color:12580607,side:we,transparent:!0,opacity:.8}));tt.rotation.x=-Math.PI/2,tt.position.set(z.x,z.y+.1,z.z),t.add(tt)}const lt=Xg(),gt=new zg({color:2995401,transparent:!0,opacity:.74,shininess:110,specular:11203839,normalMap:lt,normalScale:new dt(.55,.55)});lt.repeat.set(220,220);const Dt=new Pt(new fn(9e3,9e3),gt);Dt.rotation.x=-Math.PI/2,Dt.position.y=a.waterLevel,Dt.receiveShadow=!1,t.add(Dt);const $t=new Pt(new fn(9e3,9e3),new Oe({color:3878776}));return $t.rotation.x=-Math.PI/2,$t.position.y=-14,t.add($t),{group:t,update:(z,$)=>{lt.offset.set(z*.012,z*.007),Dt.position.x=$.x,Dt.position.z=$.z,$t.position.x=$.x,$t.position.z=$.z,H.opacity=.7+Math.sin(z*1.6)*.12,at.forEach((tt,vt)=>{tt.rotation.y=z*.8+vt,tt.material.opacity=.24+Math.sin(z*2+vt)*.05})},setQuality:z=>{const $=z!=="low";c.castShadow=$,E.castShadow=$,w.castShadow=$,C.castShadow=$,D.castShadow=$},treeMeshes:[E,w,C],water:Dt}}function Ur(a){return new Fe({color:new ct(a)})}function Xg(){const t=new Uint8Array(65536),e=(i,s)=>{const r=(i%128+128)%128,o=(s%128+128)%128;return Math.sin(r/128*Math.PI*8)*.5+Math.sin(o/128*Math.PI*6+r*.02)*.5+Math.sin((r+o)/128*Math.PI*12)*.3};for(let i=0;i<128;i++)for(let s=0;s<128;s++){const r=e(s+1,i)-e(s-1,i),o=e(s,i+1)-e(s,i-1),l=-r*.6,c=-o*.6,h=1,d=Math.hypot(l,c,h),u=(i*128+s)*4;t[u]=Math.round((l/d*.5+.5)*255),t[u+1]=Math.round((c/d*.5+.5)*255),t[u+2]=Math.round((h/d*.5+.5)*255),t[u+3]=255}const n=new Sh(t,128,128,sn);return n.wrapS=n.wrapT=Ca,n.magFilter=dn,n.minFilter=Xn,n.generateMipmaps=!0,n.needsUpdate=!0,n}function qg(){const a=new xn({side:Be,depthWrite:!1,fog:!1,uniforms:{sunDir:{value:new L(-.45,.72,.5).normalize()}},vertexShader:"varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }",fragmentShader:`
      varying vec3 vDir; uniform vec3 sunDir;
      void main(){
        float h = vDir.y;
        vec3 top = vec3(0.16,0.60,0.86);
        vec3 mid = vec3(0.50,0.86,0.94);
        vec3 hor = vec3(1.0,0.93,0.80);
        vec3 low = vec3(0.60,0.46,0.86);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.25, h));
        c = mix(c, top, smoothstep(0.2, 0.9, h));
        c = mix(c, low, smoothstep(0.0, -0.35, h));
        float s = max(dot(normalize(vDir), sunDir), 0.0);
        c += vec3(1.0,0.85,0.55) * (pow(s, 600.0) * 1.5 + pow(s, 12.0) * 0.18);
        // soft fracture band: a faint violet-turquoise arc across the sky
        float band = exp(-pow((vDir.x*0.6 + vDir.z*0.8 - 0.1 + h*0.9) * 5.0, 2.0)) * smoothstep(0.1,0.5,h);
        c = mix(c, vec3(0.62,0.9,1.0), band * 0.35);
        gl_FragColor = vec4(c, 1.0);
      }`}),t=new Pt(new Ke(3800,32,16),a);t.renderOrder=-10,t.frustumCulled=!1;const e=new be,n=document.createElement("canvas");n.width=n.height=128;const i=n.getContext("2d"),s=i.createRadialGradient(64,64,4,64,64,62);s.addColorStop(0,"rgba(255,255,255,0.95)"),s.addColorStop(.5,"rgba(255,255,255,0.5)"),s.addColorStop(1,"rgba(255,255,255,0)"),i.fillStyle=s,i.fillRect(0,0,128,128);const r=new Rs(n),o=new Oe({map:r,transparent:!0,depthWrite:!1,opacity:.85,fog:!1});for(let c=0;c<26;c++){const h=c/26*Math.PI*2+c%3*.4,d=700+c*137%900,u=new Pt(new fn(1,1),o);u.scale.set(380+c%5*90,130+c%4*30,1),u.position.set(Math.cos(h)*d,190+c%7*40,Math.sin(h)*d),u.rotation.x=-Math.PI/2+.15,u.userData.a=h,u.userData.r=d,e.add(u)}return{mesh:t,clouds:e,update:(c,h)=>{t.position.copy(h),e.children.forEach((d,u)=>{const p=d.userData.a+c*.004;d.position.x=h.x*.4+Math.cos(p)*d.userData.r,d.position.z=h.z*.4+Math.sin(p)*d.userData.r,d.lookAt(d.position.x,2e3,d.position.z)})}}}class $g{group=new be;wall;next;motes;moteData;mat;constructor(){this.mat=new xn({transparent:!0,side:we,depthWrite:!1,blending:pi,fog:!1,uniforms:{time:{value:0},color:{value:new ct("#8a4dff")},cam:{value:new L},density:{value:1}},vertexShader:"varying vec3 vP; void main(){ vP = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} ",fragmentShader:`
        varying vec3 vP; uniform float time; uniform vec3 color; uniform vec3 cam; uniform float density;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
        void main(){
          float ang = atan(vP.z, vP.x);
          float flow = n(vec2(ang*14.0, vP.y*0.06 - time*0.25)) * 0.6 + n(vec2(ang*40.0 + time*0.1, vP.y*0.15 - time*0.5)) * 0.4;
          float d = distance(cam.xz, vP.xz);
          float fadeNear = smoothstep(2.0, 40.0, d); // never hide close enemies: thins to nothing near the player
          float a = (0.28 + flow * 0.5) * fadeNear * density;
          float rim = smoothstep(0.0, 1.0, 1.0 - abs(fract(vP.y*0.02 - time*0.03) - 0.5) * 2.0);
          vec3 c = mix(color, vec3(0.7,0.95,1.0), rim * 0.25 + flow * 0.15);
          gl_FragColor = vec4(c, clamp(a, 0.0, 0.8));
        }`});const t=new We(1,1,420,96,1,!0);t.translate(0,190,0),this.wall=new Pt(t,this.mat),this.wall.frustumCulled=!1,this.group.add(this.wall);const e=new We(1,1,60,128,1,!0);e.translate(0,20,0),this.next=new Pt(e,new Oe({color:16777215,transparent:!0,opacity:.16,side:we,depthWrite:!1})),this.next.frustumCulled=!1,this.group.add(this.next);const n=900;this.moteData=new Float32Array(n*3);const i=new ge;i.setAttribute("position",new ze(this.moteData,3));const s=document.createElement("canvas");s.width=s.height=32;const r=s.getContext("2d"),o=r.createRadialGradient(16,16,1,16,16,15);o.addColorStop(0,"rgba(255,255,255,1)"),o.addColorStop(1,"rgba(255,255,255,0)"),r.fillStyle=o,r.fillRect(0,0,32,32),this.motes=new _g(i,new wh({map:new Rs(s),color:13609215,size:2.2,transparent:!0,opacity:.7,depthWrite:!1,sizeAttenuation:!0,fog:!1})),this.motes.frustumCulled=!1,this.group.add(this.motes)}update(t,e,n,i,s,r,o,l,c,h){if(this.group.visible=h,!h)return;this.mat.uniforms.time.value=t,this.mat.uniforms.cam.value.copy(c),this.wall.position.set(e,0,n),this.wall.scale.set(i,1,i),this.next.visible=l,this.next.position.set(s,0,r),this.next.scale.set(o,1,o);const d=this.moteData.length/3;for(let u=0;u<d;u++){const p=(t*.05+u/d*7.3)%1,g=u*2.399963%(Math.PI*2),v=i+14-p*28;this.moteData[u*3]=e+Math.cos(g)*v,this.moteData[u*3+1]=4+u*53%140*(.8+.2*Math.sin(t*.5+u)),this.moteData[u*3+2]=n+Math.sin(g)*v}this.motes.geometry.attributes.position.needsUpdate=!0}}const _s={low:{shadowSize:0,pixel:.7,trees:380,actorDist:140,effects:.4},medium:{shadowSize:1536,pixel:1,trees:760,actorDist:220,effects:.75},high:{shadowSize:2048,pixel:1,trees:1200,actorDist:300,effects:1}},kc=new Map;function Yg(a,t){const e=a+t;let n=kc.get(e);if(n)return n;const i=document.createElement("canvas");return i.width=i.height=64,Qo(i.getContext("2d"),a,t,32,32,24,!0),n=new Rs(i),kc.set(e,n),n}function Qo(a,t,e,n,i,s,r=!1){switch(a.save(),a.fillStyle=e,a.strokeStyle="rgba(10,20,30,0.85)",a.lineWidth=Math.max(2,s*.18),a.beginPath(),t){case"circle":a.arc(n,i,s*.8,0,Math.PI*2);break;case"chevron":a.moveTo(n-s,i-s*.1),a.lineTo(n,i-s*.9),a.lineTo(n+s,i-s*.1),a.lineTo(n+s,i+s*.45),a.lineTo(n,i-s*.2),a.lineTo(n-s,i+s*.45),a.closePath();break;case"diamond":a.moveTo(n,i-s),a.lineTo(n+s*.8,i),a.lineTo(n,i+s),a.lineTo(n-s*.8,i),a.closePath();break;case"crown":a.moveTo(n-s,i+s*.7),a.lineTo(n-s,i-s*.5),a.lineTo(n-s*.45,i+s*.1),a.lineTo(n,i-s*.8),a.lineTo(n+s*.45,i+s*.1),a.lineTo(n+s,i-s*.5),a.lineTo(n+s,i+s*.7),a.closePath();break;case"star":for(let o=0;o<10;o++){const l=-Math.PI/2+o*Math.PI/5,c=o%2?s*.45:s,h=n+Math.cos(l)*c,d=i+Math.sin(l)*c;o===0?a.moveTo(h,d):a.lineTo(h,d)}a.closePath();break}a.fill(),r&&a.stroke(),a.restore()}class Zg{renderer;scene=new vg;camera=new en(70,16/9,.1,5e3);world;sky=qg();storm=new $g;sun=new Og(16773328,2.1);hemi=new Ug(14086399,13483928,1.75);match;actors=new Map;lootViews=new Map;chestViews=new Map;projViews=new Map;smokeViews=new Map;capsuleViews=new Map;tracers=[];puffs=[];rings=[];skiffMesh=Hg();grappleLine=null;prev=new Map;t=0;quality="medium";settings;tracerGeo=new Ge(.035,.035,1);tracerMat=new Oe({color:16773560,transparent:!0,opacity:.95,fog:!1});puffTex;flashTex;hideId=-1;beaconDots=[];constructor(t,e){this.settings=e,this.renderer=new gg({canvas:t,antialias:e.quality!=="low",powerPreference:"high-performance",preserveDrawingBuffer:!1}),this.renderer.outputColorSpace=je,this.renderer.toneMapping=qc,this.renderer.toneMappingExposure=1.12,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=Xc,this.scene.fog=new La(13626096,260,1300),this.scene.background=new ct(9428208),this.scene.add(this.sky.mesh,this.sky.clouds,this.sun,this.sun.target,this.hemi,this.storm.group,this.skiffMesh),this.sun.position.set(-90,140,60),this.sun.castShadow=!0,this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.5;const n=this.sun.shadow.camera;n.left=-70,n.right=70,n.top=70,n.bottom=-70,n.near=10,n.far=400,this.puffTex=zc("rgba(255,255,255,1)","rgba(255,255,255,0)"),this.flashTex=zc("rgba(255,240,170,1)","rgba(255,160,40,0)"),this.setQuality(e.quality)}setQuality(t){this.quality=t;const e=_s[t];this.sun.castShadow=e.shadowSize>0,e.shadowSize>0&&(this.sun.shadow.mapSize.set(e.shadowSize,e.shadowSize),this.sun.shadow.map?.dispose(),this.sun.shadow.map=null),this.world?.setQuality(t),this.scene.fog=new La(13626096,t==="low"?160:260,t==="low"?800:1300)}setPixelRatio(t){this.renderer.setPixelRatio(t)}resize(t,e){this.renderer.setSize(t,e,!1),this.camera.aspect=t/e,this.camera.updateProjectionMatrix()}setMatch(t){this.world&&(this.scene.remove(this.world.group),jg(this.world.group));for(const e of this.actors.values())this.scene.remove(e.parts.root);this.actors.clear();for(const e of this.lootViews.values())this.scene.remove(e);this.lootViews.clear();for(const e of this.chestViews.values())this.scene.remove(e.root);this.chestViews.clear(),this.prev.clear(),this.match=t,this.world=Wg(t.world),this.scene.add(this.world.group),this.world.setQuality(this.quality),this.skiffMesh.visible=t.mode==="quick",this.storm.group.visible=t.mode==="quick"}snapshot(){for(const t of this.match.players){const e=this.prev.get(t.id);e?(e.x=t.x,e.y=t.y,e.z=t.z,e.yaw=t.yaw):this.prev.set(t.id,{x:t.x,y:t.y,z:t.z,yaw:t.yaw})}}interp(t,e){const n=this.prev.get(t.id);if(!n)return{x:t.x,y:t.y,z:t.z,yaw:t.yaw};if(Math.hypot(t.x-n.x,t.z-n.z)>8||Math.abs(t.y-n.y)>8)return{x:t.x,y:t.y,z:t.z,yaw:t.yaw};let s=t.yaw-n.yaw;for(;s>Math.PI;)s-=Math.PI*2;for(;s<-Math.PI;)s+=Math.PI*2;return{x:n.x+(t.x-n.x)*e,y:n.y+(t.y-n.y)*e,z:n.z+(t.z-n.z)*e,yaw:n.yaw+s*e}}onEvent(t){const e=_s[this.quality];switch(t.type){case"shot":{this.match.players[t.pid];const n=this.actors.get(t.pid);n&&(n.flashT=.06);const i=Math.hypot(t.tx-t.ox,t.ty-t.oy,t.tz-t.oz);if(i>1&&this.tracers.length<70*e.effects+10){const s=t.weapon==="longwake",r=new Pt(this.tracerGeo,this.tracerMat);r.position.set((t.ox+t.tx)/2,(t.oy+t.ty)/2,(t.oz+t.tz)/2),r.scale.set(s?3:1,s?3:1,i),r.lookAt(t.tx,t.ty,t.tz),this.scene.add(r),this.tracers.push({mesh:r,life:.07})}t.hit==="world"&&this.spawnPuff(t.tx,t.ty,t.tz,15260868,.55,.4,2),t.hit==="player"&&this.spawnPuff(t.tx,t.ty,t.tz,16773824,.5,.25,3);break}case"explosion":{const n=new Pt(new Ke(1,14,10),new Oe({color:t.kind==="gale"?10479871:13169919,transparent:!0,opacity:.5,depthWrite:!1,blending:di}));n.position.set(t.x,t.y,t.z),n.scale.setScalar(.5),n.userData.r=t.r,this.scene.add(n),this.rings.push({mesh:n,life:.38});for(let i=0;i<8;i++)this.spawnPuff(t.x+(Math.random()-.5)*2,t.y+Math.random(),t.z+(Math.random()-.5)*2,14678527,.8,.5,4);break}case"chest":{for(let i=0;i<10;i++)this.spawnPuff(t.x,t.y+1,t.z,16771488,.7,.6,3);const n=this.chestViews.get(t.id);n&&(n.open=1);break}case"kill":{const n=this.match.players[t.victim];if(n)for(let i=0;i<6;i++)this.spawnPuff(n.x,n.y+1,n.z,16777215,.6,.5,3);break}}}spawnPuff(t,e,n,i,s,r,o){if(this.puffs.length>140)return;const l=new ys({map:this.puffTex,color:i,transparent:!0,depthWrite:!1,opacity:.9,fog:!0}),c=new oa(l);c.position.set(t,e,n),c.scale.setScalar(s),this.scene.add(c),this.puffs.push({sprite:c,life:r,max:r,vel:new L((Math.random()-.5)*o,Math.random()*o*.7,(Math.random()-.5)*o),grow:s*1.8})}render(t,e,n,i,s,r,o){this.t+=t,this.hideId=n;const l=this.match;_s[this.quality],this.camera.position.copy(i.pos),this.camera.lookAt(i.pos.x+i.dir.x,i.pos.y+i.dir.y,i.pos.z+i.dir.z),this.camera.fov=i.fov,this.camera.updateProjectionMatrix();const c=o?.x??i.pos.x,h=o?.y??i.pos.y,d=o?.z??i.pos.z,u=1,p=Math.round(c/u)*u,g=Math.round(d/u)*u;if(this.sun.target.position.set(p,h,g),this.sun.position.set(p-80,h+120,g+55),this.sun.target.updateMatrixWorld(),this.world.update(this.t,i.pos),this.sky.update(this.t,i.pos),l.mode==="quick"){const v=l.storm,f=l.clock>20||v.phase>0;this.storm.update(this.t,v.cx,v.cz,Math.max(v.r,1),v.nextX,v.nextZ,Math.max(v.nextR,1),v.stage!=="done"&&v.r<5e3&&v.phase>0,i.pos,f&&v.phase>=1)}this.updateActors(t,e,r),this.updateLoot(i.pos,s),this.updateProjectiles(),this.updateSmokes(),this.updateCapsules(),this.updateSkiff(),this.updateFx(t),this.updateBeacons(r),this.updateGrapple(r),this.renderer.render(this.scene,this.camera)}updateSkiff(){const t=this.match;if(t.mode!=="quick")return;const e=t.skiff,n=Math.atan2(e.dirX,e.dirZ);this.skiffMesh.position.set(e.x,e.y-.3,e.z),this.skiffMesh.rotation.y=n,this.skiffMesh.getObjectByName("blades"),this.skiffMesh.traverse(i=>{i.name==="blades"&&(i.rotation.z+=.3)}),this.skiffMesh.visible=!(t.phase==="live"&&Math.hypot(e.x,e.z)>1100)&&t.phase!=="ended",t.phase==="staging"&&this.skiffMesh.position.set(e.startX+e.dirX*28,e.y-.4,e.startZ+e.dirZ*28)}actorFor(t){let e=this.actors.get(t.id);if(!e){const n=Bg(t.cosmetic,t.id),i=new oa(new ys({map:this.flashTex,transparent:!0,depthWrite:!1,blending:di,fog:!1}));i.scale.setScalar(.7),i.visible=!1,n.hand.add(i),this.scene.add(n.root),e={parts:n,flash:i,flashT:0,phase:Math.random()*6,lastWeapon:"",prevSpeed:0},this.actors.set(t.id,e)}return e}updateActors(t,e,n){const i=this.match,s=_s[this.quality];for(const r of i.players){const o=this.actorFor(r),l=r.alive&&r.mode!=="dead"&&r.id!==this.hideId;if(o.parts.root.visible=l,!l)continue;const c=this.interp(r,e),h=c.x-this.camera.position.x,d=c.z-this.camera.position.z;if(h*h+d*d>s.actorDist*s.actorDist&&r.id!==n){o.parts.root.visible=!1;continue}const u=o.parts.root;u.position.set(c.x,c.y,c.z),u.rotation.y=c.yaw;const p=Math.hypot(r.vx,r.vz);o.phase+=t*(3+p*1.6);const g=r.mode==="ground"&&r.onGround?Math.min(1,p/6):0,v=Math.sin(o.phase)*.9*g,f=o.parts;f.legL.rotation.x=v,f.legR.rotation.x=-v,f.armL.rotation.x=-v*.7;let m=0,y=0,S=1,x=0;r.crouching&&!r.sliding&&(S=.78),r.sliding&&(m=-.9,y=-.1,S=.9),r.mode==="freefall"&&(m=1.35,y=.1,f.legL.rotation.x=.4,f.legR.rotation.x=-.2),r.mode==="glide"&&(m=.35),r.mode==="swim"&&(m=1.2,y=-.2,f.legL.rotation.x=Math.sin(o.phase*1.5)*.5,f.legR.rotation.x=-Math.sin(o.phase*1.5)*.5),r.mode==="zipline"&&(f.armL.rotation.x=-3,f.armR.rotation.x=-3),r.mode==="mantle"&&(m=.4),x=r.sprinting?.22:0,f.body.rotation.x=m+x,f.body.position.y=y,f.body.scale.y=S,f.wing.visible=r.mode==="glide",r.mode==="zipline"&&(f.body.position.y=.2);const T=r.slots[r.selected],E=T&&T.kind==="weapon"?`${T.weapon}${T.rarity}`:T?`i:${T.item}`:"";if(E!==o.lastWeapon){if(f.weapon&&(f.hand.remove(f.weapon),f.weapon=null),T&&T.kind==="weapon"){const D=Lc(T.weapon,T.rarity);D.scale.setScalar(1.7),f.weapon=D,f.hand.add(D)}else if(T&&T.kind==="item"){const D=Ic(T.item);D.position.set(0,0,.1),f.weapon=D,f.hand.add(D)}o.lastWeapon=E}const w=!!T&&T.kind==="weapon"&&(r.mode==="ground"||r.mode==="swim"),C=!!T&&T.kind==="item"&&r.mode==="ground",M=r.shoulder>=0?-1:1,_=M<0?f.armL:f.armR,P=M<0?f.armR:f.armL,I=_e(r.pitch,-.9,.9);if(w||C?(_.rotation.x=-1.45-I*.9,P.rotation.x=w?-1.2-I*.9:v*.7,P.rotation.z=w?M*-.35:0,f.hand.position.set(M*.36,r.crouching?1.06:1.34,.5),f.hand.rotation.set(-I,-M*.1,0)):(_.rotation.x=r.mode==="zipline"?-3:v*.7,P.rotation.x=r.mode==="zipline"?-3:-v*.7,P.rotation.z=0,f.hand.position.set(M*.3,1.2,.3),f.hand.rotation.set(0,0,0)),f.weapon&&(f.weapon.visible=r.mode!=="freefall"&&r.mode!=="glide"&&r.mode!=="zipline"&&(r.mode!=="swim"||w)),f.using.visible=!!r.using,r.using&&(f.using.position.y=1.4+Math.sin(this.t*10)*.03),o.flashT-=t,o.flash.visible=o.flashT>0&&!!f.weapon,o.flash.visible&&o.flash.position.set(0,.04,Ce[T.weapon]?.kind==="projectile"?1.2:.8),r.dummy&&!o.name){const D=document.createElement("canvas");D.width=128,D.height=16;const O=new Rs(D),G=new oa(new ys({map:O,transparent:!0,depthTest:!1}));G.scale.set(1.4,.18,1),G.position.y=2.3,G.renderOrder=10,G.userData.canvas=D,G.userData.tex=O,f.root.add(G),o.name=G}if(o.name){const O=o.name.userData.canvas.getContext("2d");O.clearRect(0,0,128,16),O.fillStyle="rgba(0,0,0,0.5)",O.fillRect(0,0,128,16),O.fillStyle=r.health>50?"#7be07b":"#e0a050",O.fillRect(2,2,Math.max(0,124*(r.health/100)),12),o.name.userData.tex.needsUpdate=!0}}}lootBeaconMat=new Map;makeLootView(t){const e=new be,n=t.data;let i=0,s="#ffffff";if(n.kind==="weapon"){i=n.rarity,s=un[i].color;const c=Lc(n.weapon,n.rarity);c.scale.setScalar(1.35),c.position.y=.55,c.rotation.y=0,c.name="model",e.add(c)}else if(n.kind==="item"){s=fe[n.item].color;const c=Ic(n.item);c.position.y=.55,c.name="model",e.add(c)}else if(n.kind==="ammo"){s=Oc[n.ammo];const c=new Pt(new Ge(.3,.2,.22),Xt(s,s));c.position.y=.3,c.name="model",c.castShadow=!0,e.add(c);const h=new Pt(new Ge(.22,.14,.2),Xt("#444"));h.position.set(.16,.22,.1),e.add(h)}else{s="#f2d27a";const c=new Pt(new Ge(.7,.45,.5),Xt("#8a6a45","#3a2a10"));c.position.y=.3,c.name="model",c.castShadow=!0,e.add(c);const h=new Pt(new Ge(.72,.1,.52),Xt("#e7c36a"));h.position.y=.4,e.add(h)}const r=new Pt(new Xa(.3,.42,20),new Oe({color:new ct(s),side:we,transparent:!0,opacity:.75}));r.rotation.x=-Math.PI/2,r.position.y=.04,e.add(r);const o=new Oe({color:new ct(s),transparent:!0,opacity:.07,depthWrite:!1,blending:di,fog:!1}),l=new Pt(new We(.07,.12,3,8,1,!0),o);if(l.position.y=1.7,l.name="beam",e.add(l),n.kind==="weapon"||t.priority){const c=n.kind==="weapon"?un[i].shape:"star",h=new oa(new ys({map:Yg(c,this.settings.colorblind&&n.kind==="weapon"?un[i].colorBlind:s),transparent:!0,depthTest:!1,fog:!1}));h.scale.set(.38,.38,1),h.position.y=1.2,h.name="icon",h.renderOrder=8,e.add(h)}return e.position.set(t.x,t.y,t.z),e}updateLoot(t,e){const n=this.match,i=80*80;for(const[r,o]of this.lootViews)n.loot.has(r)||(this.scene.remove(o),this.lootViews.delete(r));let s=0;for(const r of n.loot.values()){const o=r.x-t.x,l=r.z-t.z,c=o*o+l*l;let h=this.lootViews.get(r.id);if(c>i&&!(r.priority&&c<150*150)){h&&(h.visible=!1);continue}if(s++>170){h&&(h.visible=!1);continue}h||(h=this.makeLootView(r),this.scene.add(h),this.lootViews.set(r.id,h)),h.visible=!0;const d=h.getObjectByName("model");d&&(d.rotation.y=this.t*.9+r.id,d.position.y=(r.data.kind==="ammo"||r.data.kind==="cache"?.3:.55)+Math.sin(this.t*2+r.id)*.05);const u=h.getObjectByName("beam");u&&(u.visible=c<38*38&&r.data.kind!=="ammo");const p=h.getObjectByName("icon");p&&(p.visible=c<45*45);const g=r.id===e?1.25:1;h.scale.setScalar(g)}for(const r of n.chests.values()){const o=r.x-t.x,l=r.z-t.z;let c=this.chestViews.get(r.id);if(o*o+l*l>120*120){c&&(c.root.visible=!1);continue}if(!c){const h=new be,d=r.kind==="chest",u=new Pt(new Ge(d?1.1:.9,d?.6:1.5,.7),Xt(d?"#7a4a2a":"#4f7894"));u.position.y=d?.3:.75,u.castShadow=!0,h.add(u);const p=new Pt(new Ge(d?1.14:.94,.16,.74),Xt(d?"#e6b84a":"#8fd0e8",d?"#b8860b":"#2a6a88"));p.position.y=d?.68:1.58,p.castShadow=!0,h.add(p);const g=new Pt(new Wa(.12),Xt("#fff1a8","#ffd54a"));g.position.set(0,d?.75:1.78,.38),g.name="gem",h.add(g),h.position.set(r.x,r.y,r.z),this.scene.add(h),c={root:h,lid:p,open:0,kind:r.kind},this.chestViews.set(r.id,c)}if(c.root.visible=!0,r.opened){c.lid.rotation.x=-1.1,c.lid.position.y=c.kind==="chest"?.85:1.58;const h=c.root.getObjectByName("gem");h&&(h.visible=!1)}else{const h=c.root.getObjectByName("gem");h&&(h.rotation.y=this.t*1.5)}}}updateProjectiles(){const t=this.match,e=new Set;for(const n of t.projectiles){e.add(n.id);let i=this.projViews.get(n.id);if(!i){const s=n.kind==="rail"?14271743:n.kind==="mist"?14539007:10217471;i=new Pt(n.kind==="rail"?new We(.04,.04,1.4,6):new Ls(n.kind==="gale"?.28:.2,1),new Oe({color:s,fog:!1})),this.scene.add(i),this.projViews.set(n.id,i)}i.position.set(n.x,n.y,n.z),n.kind==="rail"&&(i.lookAt(n.x+n.vx,n.y+n.vy,n.z+n.vz),i.rotateX(Math.PI/2)),this.tracers.length<80&&(n.kind!=="rail"||Math.random()<.7)&&this.spawnPuff(n.x,n.y,n.z,n.kind==="rail"?14271743:12579071,.35,.3,.2)}for(const[n,i]of this.projViews)e.has(n)||(this.scene.remove(i),this.projViews.delete(n))}updateSmokes(){const t=this.match,e=new Set;for(const n of t.smokes){e.add(n.id);let i=this.smokeViews.get(n.id);if(!i){i=new be;const r=new Fe({color:14209776,transparent:!0,opacity:.8,emissive:6971296,emissiveIntensity:.25});for(let o=0;o<9;o++){const l=new Pt(new Ke(1,10,8),r),c=o/9*Math.PI*2,h=o===0?0:n.r*.55;l.position.set(Math.cos(c)*h,1.5+o%3*.9,Math.sin(c)*h),l.scale.setScalar(n.r*(o===0?.72:.5)),i.add(l)}i.position.set(n.x,n.y,n.z),this.scene.add(i),this.smokeViews.set(n.id,i)}const s=Math.min(1,n.t/.6)*(n.t>n.life-1.2?Math.max(0,(n.life-n.t)/1.2):1);i.scale.setScalar(Math.max(.01,s)),i.rotation.y=this.t*.1}for(const[n,i]of this.smokeViews)e.has(n)||(this.scene.remove(i),this.smokeViews.delete(n))}updateCapsules(){const t=this.match;for(const e of t.capsules){let n=this.capsuleViews.get(e.id);if(!n){n=new be;const s=new Pt(new We(.9,1.1,2,10),Xt("#e7d9bb"));s.position.y=1,s.castShadow=!0,n.add(s);const r=new Pt(new We(1.12,1.12,.5,10),Xt("#ffc83d","#a87a00"));r.position.y=1,n.add(r);const o=new Pt(new Ke(3.4,14,8,0,Math.PI*2,0,Math.PI/2),new Fe({color:16743242,side:we,emissive:16734762,emissiveIntensity:.15}));o.position.y=6.2,o.name="chute",n.add(o);const l=new Pt(new We(.4,.8,120,8,1,!0),new Oe({color:16766042,transparent:!0,opacity:.2,depthWrite:!1,blending:di,fog:!1}));l.position.y=60,n.add(l),this.scene.add(n),this.capsuleViews.set(e.id,n)}n.position.set(e.x,e.y,e.z);const i=n.getObjectByName("chute");i&&(i.visible=!e.landed)}}updateBeacons(t){const e=this.match,n=e.players[t],i=n?e.beaconTrails(n):[];for(;this.beaconDots.length<i.length;){const s=new Pt(new Ke(.28,8,6),new Oe({color:16769899,transparent:!0,opacity:.8,depthTest:!1}));s.renderOrder=9,this.scene.add(s),this.beaconDots.push(s)}this.beaconDots.forEach((s,r)=>{if(r<i.length){const o=i[r];s.visible=!0,s.position.set(o.x,e.world.heightAt(o.x,o.z)+.8,o.z),s.material.opacity=_e(1-o.age/14,.15,.85),s.scale.setScalar(.6+(1-_e(o.age/14,0,1))*.6)}else s.visible=!1})}updateGrapple(t){const e=this.match.players[t];if(e&&e.mode==="grapple"&&e.grapple){this.grappleLine||(this.grappleLine=new za(new ge().setFromPoints([new L,new L]),new Ga({color:16765286})),this.scene.add(this.grappleLine));const n=this.grappleLine.geometry.attributes.position;n.setXYZ(0,e.x,e.y+1.2,e.z),n.setXYZ(1,e.grapple.x,e.grapple.y,e.grapple.z),n.needsUpdate=!0,this.grappleLine.visible=!0}else this.grappleLine&&(this.grappleLine.visible=!1)}updateFx(t){for(let e=this.tracers.length-1;e>=0;e--){const n=this.tracers[e];n.life-=t,n.life<=0&&(this.scene.remove(n.mesh),this.tracers.splice(e,1))}for(let e=this.puffs.length-1;e>=0;e--){const n=this.puffs[e];if(n.life-=t,n.life<=0){this.scene.remove(n.sprite),n.sprite.material.dispose(),this.puffs.splice(e,1);continue}const i=n.life/n.max;n.sprite.position.addScaledVector(n.vel,t),n.sprite.scale.setScalar(n.sprite.scale.x+n.grow*t),n.sprite.material.opacity=i*.85}for(let e=this.rings.length-1;e>=0;e--){const n=this.rings[e];n.life-=t;const i=1-n.life/.38;n.mesh.scale.setScalar(Math.max(.3,n.mesh.userData.r*i)),n.mesh.material.opacity=.5*(1-i),n.life<=0&&(this.scene.remove(n.mesh),n.mesh.material.dispose(),this.rings.splice(e,1))}}poseFor(t,e,n,i,s){const r={...t,x:e.x,y:e.y,z:e.z,yaw:n,pitch:i},o=t.slots[t.selected];let l=2.3,c=.85;o&&o.kind==="weapon"&&(l=Ce[o.weapon].adsBoom,c=Ce[o.weapon].adsFov),r.recoilP=t.recoilP*s,r.recoilY=t.recoilY*s;let h=l;(t.mode==="freefall"||t.mode==="glide")&&(r.adsT=0,h=4.5);const d=Ta(this.match.world,r,h);let u=d.pos,p=d.dir,v=this.settings.fov;if(t.mode==="freefall"||t.mode==="glide"){v+=8+Math.min(10,Math.hypot(t.vx,t.vy,t.vz)*.1);const y=t.mode==="glide"?6.5:5.2,S=Pn(n,i);u={x:d.pivot.x-S.x*y,y:d.pivot.y-S.y*y+1,z:d.pivot.z-S.z*y},p=S}v=v*(1+(c-1)*t.adsT);const f=this.camera.aspect||16/9,m=2*Math.atan(Math.tan(v*Math.PI/360)/f)*(180/Math.PI);return{pos:new L(u.x,u.y,u.z),dir:new L(p.x,p.y,p.z),fov:m,pivot:new L(d.pivot.x,d.pivot.y,d.pivot.z)}}worldPointToScreen(t,e,n){const i=new L(t,e,n).project(this.camera);return{x:i.x*.5+.5,y:-i.y*.5+.5,behind:i.z>1}}get domElement(){return this.renderer.domElement}}function zc(a,t){const e=document.createElement("canvas");e.width=e.height=64;const n=e.getContext("2d"),i=n.createRadialGradient(32,32,2,32,32,31);return i.addColorStop(0,a),i.addColorStop(1,t),n.fillStyle=i,n.fillRect(0,0,64,64),new Rs(e)}function jg(a){a.traverse(t=>{const e=t;e.geometry&&e.geometry.dispose()})}const Kg={wayfarer:{len:30,barrel:16,stock:8,mag:6,thick:5},tempest:{len:24,barrel:12,stock:6,mag:8,thick:5},breakwater:{len:30,barrel:18,stock:8,mag:0,thick:7,extra:"pump"},coil:{len:28,barrel:16,stock:7,mag:0,thick:6,extra:"coil"},needler:{len:20,barrel:8,stock:4,mag:10,thick:5},sundial:{len:32,barrel:20,stock:8,mag:5,thick:4,extra:"scope"},longwake:{len:34,barrel:26,stock:8,mag:4,thick:4,extra:"scope"},harbor:{len:14,barrel:5,stock:0,mag:7,thick:5},gale:{len:26,barrel:12,stock:6,mag:0,thick:7,extra:"bell"}};function Rh(a,t,e,n,i){a.clearRect(0,0,e,n);const s=Kg[t],r=Ce[t],o=Math.min(e/72,n/30)*1;a.save(),a.translate(e/2,n/2),a.scale(o*1.7,o*1.7);const l=-(s.len+s.barrel)/2;a.fillStyle=r.color,a.strokeStyle="rgba(0,0,0,0.65)",a.lineWidth=.9;const c=(h,d,u,p,g)=>{a.fillStyle=g??r.color,a.fillRect(h,d,u,p),a.strokeRect(h,d,u,p)};if(c(l+s.stock,-s.thick/2,s.len-s.stock,s.thick),s.stock&&c(l,-s.thick/2+1,s.stock,s.thick-2,"#8a5a3a"),c(l+s.len,-1.2,s.barrel,2.4,"#3a3a44"),s.mag&&c(l+s.len*.45,s.thick/2,3.2,s.mag,"#3a3a44"),c(l+s.stock+4,s.thick/2,2.6,6,"#3a3a44"),s.extra==="scope"&&c(l+s.len*.35,-s.thick/2-3.6,s.len*.45,2.8,"#3a3a44"),s.extra==="bell"&&(a.fillStyle="#c77d3d",a.beginPath(),a.moveTo(l+s.len+s.barrel-2,-4.5),a.lineTo(l+s.len+s.barrel+5,-6),a.lineTo(l+s.len+s.barrel+5,6),a.lineTo(l+s.len+s.barrel-2,4.5),a.closePath(),a.fill(),a.stroke()),s.extra==="coil")for(let h=0;h<3;h++)c(l+s.len+3+h*4,-3.6,1.6,7.2,"#c77d3d");s.extra==="pump"&&c(l+s.len+3,1.4,9,3,"#6a4630"),c(l+s.len*.62,-s.thick/2-1.8,2.6,2.6,i),a.restore()}function Ph(a,t,e,n){a.clearRect(0,0,e,n);const i=fe[t].color;a.save(),a.translate(e/2,n/2),a.fillStyle=i,a.strokeStyle="rgba(0,0,0,0.65)",a.lineWidth=2;const s=Math.min(e,n)*.38;switch(t){case"medInjector":a.fillRect(-s*.25,-s,s*.5,s*1.5),a.strokeRect(-s*.25,-s,s*.5,s*1.5),a.fillStyle="#fff",a.fillRect(-s*.08,s*.5,s*.16,s*.6);break;case"traumaKit":a.fillStyle="#eee",a.fillRect(-s*1.1,-s*.7,s*2.2,s*1.4),a.strokeRect(-s*1.1,-s*.7,s*2.2,s*1.4),a.fillStyle=i,a.fillRect(-s*.2,-s*.55,s*.4,s*1.1),a.fillRect(-s*.6,-s*.2,s*1.2,s*.4);break;case"shieldFlask":a.beginPath(),a.arc(0,s*.2,s*.8,0,Math.PI*2),a.fill(),a.stroke(),a.fillStyle="#ddd",a.fillRect(-s*.2,-s*.9,s*.4,s*.5);break;case"aegisCell":a.beginPath(),a.moveTo(0,-s),a.lineTo(s*.9,-s*.5),a.lineTo(s*.7,s*.6),a.lineTo(0,s),a.lineTo(-s*.7,s*.6),a.lineTo(-s*.9,-s*.5),a.closePath(),a.fill(),a.stroke();break;case"mistCapsule":a.beginPath(),a.arc(-s*.4,s*.1,s*.55,0,Math.PI*2),a.arc(s*.3,-s*.1,s*.7,0,Math.PI*2),a.arc(0,s*.35,s*.5,0,Math.PI*2),a.fill();break;case"grappleSpool":a.lineWidth=5,a.strokeStyle=i,a.beginPath(),a.arc(0,0,s*.7,0,Math.PI*2),a.stroke(),a.lineWidth=2,a.strokeStyle="#000",a.beginPath(),a.arc(0,0,s*.3,0,Math.PI*2),a.stroke();break;case"echoBeacon":a.beginPath(),a.moveTo(0,-s),a.lineTo(s*.8,0),a.lineTo(0,s),a.lineTo(-s*.8,0),a.closePath(),a.fill(),a.stroke();break;case"windOrb":a.beginPath(),a.arc(0,0,s*.8,0,Math.PI*2),a.fill(),a.stroke(),a.strokeStyle="#fff",a.lineWidth=2,a.beginPath(),a.arc(0,0,s*.45,.4,4.5),a.stroke();break}a.restore()}function Rt(a,t="",e=""){const n=document.createElement(a);return t&&(n.className=t),e&&(n.innerHTML=e),n}class Jg{root;alive;kills;compassStrip;notice;killfeed;miniCanvas;zoneTimer;hp;hpT;ag;agT;rs;st;hpBar;usingBar;slotsEl;slotEls=[];ammoBig;ammoTypes;weaponName;cross;hitm;prompt;dmgArcs;sndRing;vignette;hurt;dropPanel;altPanel;fpsEl;range;captions;specTitle;specBar;hint;noticeT=0;hitT=0;lastPrompt="";lastHud={};minimapCtx;mapRenderer=null;onLeave=()=>{};onNextSpectate=()=>{};onFast=()=>{};onHintClick=()=>{};fastBtn;constructor(t){this.root=Rt("div"),this.root.id="hud",this.root.classList.add("hidden"),t.appendChild(this.root),this.build()}build(){const t=this.root,e=Rt("div","hud-top-left");this.alive=Rt("div","pill","<span>ALIVE</span><b>24</b>"),this.kills=Rt("div","pill","<span>ELIMS</span><b>0</b>"),this.killfeed=Rt("div","killfeed"),e.append(this.alive,this.kills,this.killfeed),t.appendChild(e);const n=Rt("div","compass");this.compassStrip=Rt("div","strip");const i={0:"N",45:"NE",90:"E",135:"SE",180:"S",225:"SW",270:"W",315:"NW"};for(let v=-180;v<=540;v+=15){const f=(v%360+360)%360,m=Rt("div","tick"+(f%90===0?" card":""),i[f]??(f%45===0?"":"·"));i[f]===void 0&&f%45===0&&(m.textContent=""),m.style.left=`${v*3}px`,this.compassStrip.appendChild(m)}n.append(this.compassStrip,Rt("div","center")),this.markerTick=Rt("div","tick marker","▼"),this.markerTick.style.display="none",n.appendChild(this.markerTick),t.appendChild(n),this.notice=Rt("div","notice"),t.appendChild(this.notice);const s=Rt("div","minimap-wrap");this.miniCanvas=Rt("canvas"),this.miniCanvas.width=this.miniCanvas.height=424,this.minimapCtx=this.miniCanvas.getContext("2d"),this.zoneTimer=Rt("div","zone-timer",'<span class="lbl">Calmfield</span><span class="tm">--</span>'),s.append(this.miniCanvas,this.zoneTimer),t.appendChild(s),this.range=Rt("div","range-panel",""),this.range.classList.add("hidden"),t.appendChild(this.range);const r=Rt("div","vitals");this.usingBar=Rt("div","using-bar"),this.hpBar=Rt("div","vbar health",'<i></i><span class="t"></span>');const o=Rt("div","vbar aegis",'<i></i><span class="t"></span>'),l=Rt("div","vbar reserve","<i></i>"),c=Rt("div","vbar stam","<i></i>");r.append(this.usingBar,l,o,this.hpBar,c),this.hp=this.hpBar.querySelector("i"),this.hpT=this.hpBar.querySelector(".t"),this.ag=o.querySelector("i"),this.agT=o.querySelector(".t"),this.rs=l.querySelector("i"),this.st=c.querySelector("i"),t.appendChild(r);const h=Rt("div","inv");this.weaponName=Rt("div","weapon-name");const d=Rt("div","ammo-line");this.ammoBig=Rt("div","ammo-big",""),d.append(this.ammoBig),this.ammoTypes=Rt("div","ammo-types"),this.slotsEl=Rt("div","slots");for(let v=0;v<5;v++){const f=Rt("div","slot empty"),m=Rt("div","n",String(v+1)),y=Rt("canvas");y.width=136,y.height=68;const S=Rt("div","nm"),x=Rt("div","cnt"),T=Rt("canvas","rar");T.width=T.height=28,f.append(m,y,S,x,T),this.slotsEl.appendChild(f),this.slotEls.push({root:f,canvas:y,nm:S,cnt:x,rar:T,key:""})}h.append(this.weaponName,d,this.ammoTypes,this.slotsEl),t.appendChild(h),this.cross=Rt("div","crosshair",'<i class="h1"></i><i class="h2"></i><i class="v1"></i><i class="v2"></i><i class="dot"></i>'),t.appendChild(this.cross),this.hitm=Rt("div","hitmarker","<i></i><i></i><i></i><i></i>"),t.appendChild(this.hitm),this.prompt=Rt("div","prompt"),this.prompt.classList.add("hidden"),t.appendChild(this.prompt),this.dmgArcs=Rt("div","dmg-arcs"),t.appendChild(this.dmgArcs),this.sndRing=Rt("div","snd-ring"),t.appendChild(this.sndRing),this.vignette=Rt("div","vignette"),t.appendChild(this.vignette),this.hurt=Rt("div","hurt-flash"),t.appendChild(this.hurt),this.dropPanel=Rt("div","drop-panel"),this.dropPanel.classList.add("hidden"),t.appendChild(this.dropPanel),this.altPanel=Rt("div","alt-panel"),this.altPanel.classList.add("hidden"),t.appendChild(this.altPanel),this.captions=Rt("div","captions"),t.appendChild(this.captions),this.fpsEl=Rt("div","fps"),t.appendChild(this.fpsEl),this.specTitle=Rt("div","spectate-title"),this.specTitle.classList.add("hidden"),t.appendChild(this.specTitle),this.specBar=Rt("div","spectate-bar"),this.specBar.classList.add("hidden");const u=Rt("button","btn small dark","◀ Prev (A)"),p=Rt("button","btn small dark","Next (D) ▶");this.fastBtn=Rt("button","btn small alt","Fast ×1");const g=Rt("button","btn small","View Results");u.onclick=()=>this.onNextSpectate(-1),p.onclick=()=>this.onNextSpectate(1),this.fastBtn.onclick=()=>this.onFast(),g.onclick=()=>this.onLeave(),this.specBar.append(u,p,this.fastBtn,g),t.appendChild(this.specBar),this.hint=Rt("div","pointer-hint","Click to capture mouse and play"),this.hint.classList.add("hidden"),this.hint.onclick=()=>this.onHintClick(),t.appendChild(this.hint)}markerTick;setMap(t){this.mapRenderer=t}show(t){this.root.classList.toggle("hidden",!t)}showHint(t){this.hint.classList.toggle("hidden",!t)}reset(){this.killfeed.innerHTML="",this.lastHud={},this.slotEls.forEach(t=>t.key=""),this.notice.classList.remove("show"),this.dmgArcs.innerHTML="",this.sndRing.innerHTML="",this.specTitle.classList.add("hidden"),this.specBar.classList.add("hidden")}notify(t,e=2600){this.notice.textContent=t,this.notice.classList.add("show"),this.noticeT=e/1e3}addKillFeed(t,e){const n=Rt("div",e?"you":"",t);for(this.killfeed.appendChild(n);this.killfeed.children.length>5;)this.killfeed.removeChild(this.killfeed.firstChild);setTimeout(()=>n.remove(),6500)}hitMarker(t){this.hitm.className="hitmarker on "+(t==="normal"?"":t),this.hitT=.12}damageArc(t){const e=Rt("div","dmg-arc");e.style.transform=`rotate(${t*180/Math.PI}deg)`,this.dmgArcs.appendChild(e),this.hurt.classList.add("on"),setTimeout(()=>this.hurt.classList.remove("on"),60),setTimeout(()=>e.remove(),1200)}soundIndicator(t,e,n){const i=Rt("div","snd-ind"+(e==="step"?" step":""));i.style.transform=`rotate(${t*180/Math.PI}deg)`,this.sndRing.appendChild(i),setTimeout(()=>i.remove(),1600),n&&(this.captions.textContent=n,setTimeout(()=>{this.captions.textContent===n&&(this.captions.textContent="")},1400))}set(t,e,n){this.lastHud[t]!==e&&(this.lastHud[t]=e,n())}update(t,e){const n=t.match,i=t.view;this.noticeT-=e,this.noticeT<=0&&this.notice.classList.remove("show"),this.hitT-=e,this.hitT<=0&&this.hitm.classList.remove("on"),this.set("alive",String(n.aliveCount()),()=>{this.alive.innerHTML=`<span>ALIVE</span><b>${n.aliveCount()}</b>`}),this.set("kills",String(i.stats.kills),()=>{this.kills.innerHTML=`<span>ELIMS</span><b>${i.stats.kills}</b>`}),this.alive.style.display=n.mode==="practice"?"none":"",this.kills.style.display=n.mode==="practice"?"none":"";let s=Math.atan2(Math.sin(t.yaw),-Math.cos(t.yaw))*180/Math.PI;if(s=(s%360+360)%360,this.compassStrip.style.transform=`translateX(${210-s*3}px)`,t.marker){let h=(Math.atan2(t.marker.x-i.x,-(t.marker.z-i.z))*180/Math.PI-s+540)%360-180;this.markerTick.style.display=Math.abs(h)<68?"":"none",this.markerTick.style.left=`${210+h*3}px`}else this.markerTick.style.display="none";if(this.mapRenderer){const c=n.mode==="practice"?190:520;this.mapRenderer.draw(this.minimapCtx,424,{cx:i.x,cz:i.z,span:c},{labels:!1,marker:t.marker,humanId:i.id,yaw:t.yaw,showSkiff:n.phase==="staging"||n.phase==="skiff",trails:t.trails,colorblind:t.settings.colorblind})}this.updateZone(t);const r=i.health<30;if(this.hp.style.width=`${Math.max(0,i.health)}%`,this.hpBar.classList.toggle("low",r),this.set("hpT",`${Math.ceil(i.health)}`,()=>{this.hpT.textContent=`${Math.ceil(i.health)}`}),this.ag.style.width=`${i.aegis/se.maxAegis*100}%`,this.set("agT",`${Math.ceil(i.aegis)}`,()=>{this.agT.textContent=`AEGIS ${Math.ceil(i.aegis)}`}),this.rs.style.width=`${i.reserve/se.maxReserve*100}%`,this.st.style.width=`${i.stamina*100}%`,this.rs.parentElement.style.opacity=i.reserve>0?"1":"0.35",i.using){const c=i.using;this.usingBar.textContent=`${fe[c.item].name}  ${Math.min(100,Math.round(c.t/c.total*100))}%`}else this.usingBar.textContent="";this.updateInventory(t),this.updatePrompt(t),this.vignette.classList.toggle("on",t.stormOutside);const o=i.slots[i.selected],l=!!o&&o.kind==="weapon"&&(i.mode==="ground"||i.mode==="swim");if(this.cross.style.display=l&&!t.spectating?"":"none",l&&o&&o.kind==="weapon"){const c=Xe(o.weapon,o.rarity);let h=c.def.spread*c.spread;h+=(c.def.adsSpread*c.spread-h)*i.adsT,h+=i.bloom;const d=Math.min(40,6+h*5.5*(i.sprinting?1.5:1)),u=this.cross.children;u[0].style.left=`${-d-8}px`,u[1].style.left=`${d}px`,u[2].style.top=`${-d-8}px`,u[3].style.top=`${d}px`}if(this.updateDropPanels(t),this.fpsEl.textContent=t.settings.showFps?`${Math.round(t.fps)} fps`:"",n.mode!=="practice"&&this.range.classList.add("hidden"),n.mode==="practice"){this.range.classList.remove("hidden");const c=n.getRangeStats(),h=o&&o.kind==="weapon"?Xe(o.weapon,o.rarity):null;this.range.innerHTML="<b>PRACTICE RANGE</b><br>Targets respawn. Weapons, ammo and items are on the rack behind you.<br>"+(h?`Weapon: ${h.def.name} (${h.rarity.name})<br>DPS ${Math.round(h.damage*h.def.pellets*h.rpm/60)} · RPM ${Math.round(h.rpm)} · Mag ${h.mag} · Reload ${h.reload.toFixed(1)}s<br>`:"")+`Last hit: <b>${c.lastDamage?Math.round(c.lastDamage):"-"}</b> ${c.lastZone} @ ${Math.round(c.lastDist)} m<br>Try: slide hill, mantle crates, pool, zipline (E).`}}updateZone(t){const e=t.match,n=e.storm;if(e.mode!=="quick"){this.zoneTimer.style.display="none";return}this.zoneTimer.style.display="";let i="Calmfield",s="--",r=!1;e.phase==="staging"?(i="Departure",s=ga(e.stagingLeft)):n.phase<=0?(i="First contraction",s=e.clock<25?"--":ga(Math.max(0,90-(e.stormClock>=0?e.stormClock:0)))):n.stage==="wait"?(i="Closing in",s=ga(Math.max(0,n.waitLen-n.t))):n.stage==="shrink"?(i="Contracting",s=ga(Math.max(0,n.shrinkLen-n.t)),r=t.stormOutside):(i="Holding",s="0:00"),t.stormOutside&&(r=!0);const o=Math.hypot(t.view.x-n.cx,t.view.z-n.cz)-n.r;this.set("zone",i+s+(o>0?"o":"i")+n.damage,()=>{this.zoneTimer.innerHTML=`<span class="lbl">${i}${t.stormOutside?` · ${n.damage} dmg/s`:""}</span><span class="tm">${s}</span>`}),this.zoneTimer.classList.toggle("danger",r)}updateInventory(t){const e=t.view;e.slots.forEach((i,s)=>{const r=this.slotEls[s],l=(i?i.kind==="weapon"?`w${i.weapon}${i.rarity}`:`i${i.item}${i.count}`:"-")+(s===e.selected?"s":"")+(t.settings.colorblind?"c":"");if(r.key!==l){r.key=l,r.root.classList.toggle("empty",!i),r.root.classList.toggle("sel",s===e.selected);const c=r.canvas.getContext("2d"),h=r.rar.getContext("2d");if(h.clearRect(0,0,28,28),!i)c.clearRect(0,0,136,68),r.nm.textContent="",r.cnt.textContent="",r.root.style.borderColor="";else if(i.kind==="weapon"){const d=un[i.rarity],u=t.settings.colorblind?d.colorBlind:d.color;Rh(c,i.weapon,136,68,u),r.nm.textContent=Ce[i.weapon].name,r.nm.style.color=u,r.cnt.textContent="",r.root.style.borderColor=s===e.selected?"#fff":u,Qo(h,d.shape,u,14,14,11,!0)}else Ph(c,i.item,136,68),r.nm.textContent=fe[i.item].name,r.nm.style.color="",r.cnt.textContent=`×${i.count}`,r.root.style.borderColor=s===e.selected?"#fff":""}});const n=e.slots[e.selected];if(n&&n.kind==="weapon"){const i=Ce[n.weapon],s=un[n.rarity];this.set("ammo",`${n.mag}/${e.ammo[i.ammo]}/${n.weapon}${e.reloading?"r":""}`,()=>{this.ammoBig.innerHTML=e.reloading?"<small>RELOADING</small>":`${n.mag}<small> / ${e.ammo[i.ammo]}</small>`,this.weaponName.innerHTML=`${i.name} <span style="color:${t.settings.colorblind?s.colorBlind:s.color}">${s.name}</span>`}),e.reloading&&(this.ammoBig.innerHTML=`<small>RELOADING ${Math.max(0,e.reloadT).toFixed(1)}s</small>`)}else n?this.set("ammo","item"+n.item,()=>{this.ammoBig.innerHTML=`<small>${fe[n.item].blurb}</small>`,this.weaponName.textContent=fe[n.item].name}):this.set("ammo","none",()=>{this.ammoBig.innerHTML="",this.weaponName.textContent="Unarmed - find a weapon"});this.set("ammot",Gn.map(i=>e.ammo[i]).join(","),()=>{this.ammoTypes.innerHTML=Gn.map(i=>`<span style="color:${Oc[i]}">${ba[i][0]} ${e.ammo[i]}/${Io[i]}</span>`).join("")})}updatePrompt(t){const e=t.focus;if(!e||t.spectating||t.view.mode!=="ground"){this.prompt.classList.add("hidden"),this.lastPrompt="";return}const n=t.match;let i="";if(e.kind==="loot"){const s=n.loot.get(e.id);if(!s){this.prompt.classList.add("hidden");return}const r=s.data;if(r.kind==="weapon"){const o=un[r.rarity],l=t.settings.colorblind?o.colorBlind:o.color,c=Xe(r.weapon,r.rarity),h=t.view.slots[t.view.selected];let d="";if(h&&h.kind==="weapon"){const p=Xe(h.weapon,h.rarity),g=c.damage*c.def.pellets*c.rpm/60,v=p.damage*p.def.pellets*p.rpm/60,f=(m,y,S=!0)=>m===y?"<span>=</span>":m>y===S?'<span class="up">▲</span>':'<span class="down">▼</span>';d=`<div class="cmp"><span>DPS ${Math.round(g)} ${f(g,v)}</span><span>Mag ${c.mag} ${f(c.mag,p.mag)}</span><span>Reload ${c.reload.toFixed(1)}s ${f(c.reload,p.reload,!1)}</span><span>Range ${c.def.falloffEnd} ${f(c.def.falloffEnd,p.def.falloffEnd)}</span></div>`}else d=`<div class="cmp"><span>DPS ${Math.round(c.damage*c.def.pellets*c.rpm/60)}</span><span>Mag ${c.mag}</span><span>${ba[c.def.ammo]} ammo</span></div>`;const u=t.view.slots.every(p=>p);i=`<div class="pn" style="color:${l}">${c.def.name} · ${o.name}</div><div class="ps">${o.note} — ${c.def.blurb}</div>${d}<div class="ps" style="margin-top:6px"><span class="keycap">${ne(t.settings.keys.interact)}</span>${u?"Hold to swap with equipped slot":"Pick up"}</div>`+(u?`<div class="hold"><i style="width:${Math.min(100,t.interactHold/.45*100)}%"></i></div>`:"")}else if(r.kind==="item"){const o=fe[r.item];i=`<div class="pn" style="color:${o.color}">${o.name}${r.count>1?` ×${r.count}`:""}</div><div class="ps">${o.blurb}</div><div class="ps" style="margin-top:6px"><span class="keycap">${ne(t.settings.keys.interact)}</span>${t.view.slots.every(l=>l)?"Hold to swap selected slot":"Pick up"}</div>`+(t.view.slots.every(l=>l)?`<div class="hold"><i style="width:${Math.min(100,t.interactHold/.45*100)}%"></i></div>`:"")}else r.kind==="cache"&&(i=`<div class="pn" style="color:#f2d27a">${r.owner}'s Cache</div><div class="ps">Heals, utility and ammo</div><div class="ps" style="margin-top:6px"><span class="keycap">${ne(t.settings.keys.interact)}</span>Take all that fits</div>`)}else e.kind==="chest"?i=`<div class="pn" style="color:#ffd166">${e.label}</div><div class="ps">Hums softly. Open for guaranteed loot.</div><div class="ps" style="margin-top:6px"><span class="keycap">${ne(t.settings.keys.interact)}</span>Open</div>`:e.kind==="zipline"&&(i=`<div class="pn">${e.label}</div><div class="ps" style="margin-top:6px"><span class="keycap">${ne(t.settings.keys.interact)}</span>Ride · ${ne(t.settings.keys.jump)} to dismount</div>`);this.prompt.classList.remove("hidden"),i!==this.lastPrompt&&(this.lastPrompt=i,this.prompt.innerHTML=i)}updateDropPanels(t){const e=t.match,n=t.view;let i="",s="";if(e.mode==="quick"&&!t.spectating&&(e.phase==="staging"?i=`<div class="big">STAGING PIER</div><div class="sub">Skiff departs in ${Math.ceil(e.stagingLeft)}s · ${e.aliveCount()} players · practise movement · press M to plan your drop · <b>Enter</b> to skip</div>`:n.mode==="skiff"?i=`<div class="big">PRESS <span style="color:#ffd166">${ne(t.settings.keys.jump)}</span> TO JUMP</div><div class="sub">Open the map (${ne(t.settings.keys.map)}) and drop onto your landing zone. The skiff leaves the island soon.</div>`:n.mode==="freefall"?i=`<div class="big">FREEFALL</div><div class="sub">W dive · S slow · wing-sail deploys automatically at ${Mt.autoDeployAGL} m (${ne(t.settings.keys.jump)}/${ne(t.settings.keys.deploy)} to deploy earlier)</div>`:n.mode==="glide"&&(i='<div class="big">WING-SAIL</div><div class="sub">W boost · S brake · steer with the mouse · land near loot</div>'),n.mode==="freefall"||n.mode==="glide")){const r=Math.max(0,n.y-e.world.groundHeight(n.x,n.z,n.y,0,.4,[],[]));s=`<div class="pill"><span>ALT</span><b>${Math.round(r)}</b>m</div><div class="pill"><span>SPEED</span><b>${Math.round(Math.hypot(n.vx,n.vy,n.vz))}</b>m/s</div><div class="pill"><span>WING-SAIL</span><b>${n.mode==="glide"?"OUT":r<Mt.autoDeployAGL?"AUTO":"READY"}</b></div>`}this.set("drop",i,()=>{this.dropPanel.innerHTML=i,this.dropPanel.classList.toggle("hidden",!i)}),this.set("alt",s,()=>{this.altPanel.innerHTML=s,this.altPanel.classList.toggle("hidden",!s)})}setSpectate(t,e,n){this.set("spec",String(t)+e+n,()=>{this.specTitle.classList.toggle("hidden",!t),this.specBar.classList.toggle("hidden",!t),this.specTitle.innerHTML=`<div class="big">${e}</div><div style="font-size:18px">${n}</div>`})}setCrosshair(t,e){this.cross.style.left=`${t*100}%`,this.cross.style.top=`${e*100}%`}}function ne(a){return a.startsWith("Key")?a.slice(3):a.startsWith("Digit")?a.slice(5):{Space:"SPACE",ShiftLeft:"SHIFT",ControlLeft:"CTRL",Tab:"TAB",Escape:"ESC",Enter:"ENTER"}[a]??a}function ga(a){const t=Math.max(0,Math.ceil(a));return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}class Qg{constructor(t,e){this.canvas=t,this.settings=e,window.addEventListener("keydown",n=>this.keyDown(n)),window.addEventListener("keyup",n=>this.keyUp(n)),window.addEventListener("blur",()=>{this.down.clear(),this.mouse=[!1,!1,!1]}),t.addEventListener("mousedown",n=>this.mouseDown(n)),window.addEventListener("mouseup",n=>this.mouseUp(n)),window.addEventListener("mousemove",n=>this.mouseMove(n)),t.addEventListener("wheel",n=>{this.locked&&!this.overlayOpen&&(this.cycleLatch=n.deltaY>0?1:-1,n.preventDefault())},{passive:!1}),t.addEventListener("contextmenu",n=>n.preventDefault()),document.addEventListener("pointerlockchange",()=>{this.locked=document.pointerLockElement===t,this.locked||(this.mouse=[!1,!1,!1]),this.onLockChange(this.locked)})}down=new Set;yaw=0;pitch=0;locked=!1;mouse=[!1,!1,!1];latch={jump:!1,fire:!1,interact:!1,reload:!1,drop:!1,melee:!1,swap:!1,throwItem:!1,deploy:!1};slotLatch=-1;cycleLatch=0;adsToggled=!1;sprintToggled=!1;crouchToggled=!1;enabled=!0;onToggleMap=()=>{};onToggleInventory=()=>{};onPing=()=>{};onEscape=()=>{};onLockChange=()=>{};onAnyKey=()=>{};onClick=()=>{};overlayOpen=!1;moveWhileUnlocked=!1;mx=0;my=0;requestLock(){try{const t=this.canvas.requestPointerLock();t&&typeof t.catch=="function"&&t.catch(()=>{})}catch{}}exitLock(){document.pointerLockElement&&document.exitPointerLock()}keyDown(t){if(t.repeat){this.locked&&t.preventDefault();return}const e=t.target;if(e&&(e.tagName==="INPUT"||e.tagName==="SELECT"||e.tagName==="TEXTAREA"))return;if(this.onAnyKey(t.code),t.code==="Escape"){this.onEscape();return}if((this.locked||this.enabled)&&["Space","Tab","ArrowUp","ArrowDown","ControlLeft"].includes(t.code)&&t.preventDefault(),this.down.add(t.code),!this.enabled)return;const n=this.settings.keys;t.code===n.jump&&(this.latch.jump=!0),t.code===n.interact&&(this.latch.interact=!0),t.code===n.reload&&(this.latch.reload=!0),t.code===n.drop&&(this.latch.drop=!0),t.code===n.melee&&(this.latch.melee=!0),t.code===n.swapShoulder&&(this.latch.swap=!0),t.code===n.throwItem&&(this.latch.throwItem=!0),t.code===n.deploy&&(this.latch.deploy=!0),t.code===n.map&&this.onToggleMap(),t.code===n.inventory&&this.onToggleInventory(),["slot1","slot2","slot3","slot4","slot5"].forEach((s,r)=>{t.code===n[s]&&(this.slotLatch=r)}),this.settings.sprintToggle&&t.code===n.sprint&&(this.sprintToggled=!this.sprintToggled),this.settings.crouchToggle&&(t.code===n.crouch||t.code==="KeyC")&&(this.crouchToggled=!this.crouchToggled)}keyUp(t){this.down.delete(t.code)}mouseDown(t){this.onClick(),!(!this.locked||this.overlayOpen)&&(this.mouse[t.button]=!0,t.button===0&&(this.latch.fire=!0),t.button===2&&this.settings.adsToggle&&(this.adsToggled=!this.adsToggled),t.button===1&&(this.onPing(),t.preventDefault()))}mouseUp(t){this.mouse[t.button]=!1}mouseMove(t){!this.locked||this.overlayOpen||(this.mx+=t.movementX,this.my+=t.movementY)}applyLook(t){const e=this.settings,n=.0022*e.sens*(t?e.adsSens:1);for(this.yaw-=this.mx*n,this.pitch-=this.my*n*(e.invertY?-1:1),this.mx=0,this.my=0,this.pitch=Math.max(-1.45,Math.min(1.45,this.pitch));this.yaw>Math.PI;)this.yaw-=Math.PI*2;for(;this.yaw<-Math.PI;)this.yaw+=Math.PI*2}held(t){return this.down.has(this.settings.keys[t])}adsHeld(){return!this.locked||this.overlayOpen?!1:this.settings.adsToggle?this.adsToggled:this.mouse[2]}resetToggles(){this.adsToggled=!1,this.sprintToggled=!1,this.crouchToggled=!1}build(){const t=qn();return t.yaw=this.yaw,t.pitch=this.pitch,this.enabled&&((this.locked&&!this.overlayOpen||this.moveWhileUnlocked)&&(t.moveF=(this.held("forward")?1:0)-(this.held("back")?1:0),t.moveR=(this.held("right")?1:0)-(this.held("left")?1:0),t.jump=this.held("jump")||this.latch.jump,t.sprint=this.settings.sprintToggle?this.sprintToggled:this.held("sprint"),t.crouch=this.settings.crouchToggle?this.crouchToggled:this.held("crouch")||this.down.has("KeyC"),t.fire=!this.overlayOpen&&(this.mouse[0]||this.latch.fire),t.ads=this.adsHeld(),t.reload=this.latch.reload,t.interact=this.held("interact")||this.latch.interact,t.drop=this.latch.drop,t.melee=this.latch.melee,t.swapShoulder=this.latch.swap,t.throwItem=this.latch.throwItem,t.deploy=this.latch.deploy,t.slot=this.slotLatch,t.cycle=this.cycleLatch),this.latch={jump:!1,fire:!1,interact:!1,reload:!1,drop:!1,melee:!1,swap:!1,throwItem:!1,deploy:!1},this.slotLatch=-1,this.cycleLatch=0),t}debugSet(t){t.forward!==void 0&&(t.forward?this.down.add(this.settings.keys.forward):this.down.delete(this.settings.keys.forward)),t.sprint!==void 0&&(t.sprint?this.down.add(this.settings.keys.sprint):this.down.delete(this.settings.keys.sprint)),t.fire!==void 0&&(this.mouse[0]=t.fire),t.yaw!==void 0&&(this.yaw=t.yaw),t.pitch!==void 0&&(this.pitch=t.pitch),t.locked!==void 0&&(this.locked=t.locked)}}class tv{ctx=null;master;sfx;musicGain;noiseBuf;voices=0;windGain=null;stormGain=null;musicTimer=0;musicStep=0;volume=.7;music=.35;lastPlay=new Map;ensure(){if(this.ctx){this.ctx.state==="suspended"&&this.ctx.resume();return}try{const l=window.AudioContext??window.webkitAudioContext;this.ctx=new l}catch{return}const t=this.ctx;this.master=t.createGain(),this.master.gain.value=this.volume,this.master.connect(t.destination),this.sfx=t.createGain(),this.sfx.gain.value=1,this.sfx.connect(this.master),this.musicGain=t.createGain(),this.musicGain.gain.value=this.music*.25,this.musicGain.connect(this.master);const e=t.sampleRate*1.5;this.noiseBuf=t.createBuffer(1,e,t.sampleRate);const n=this.noiseBuf.getChannelData(0);for(let l=0;l<e;l++)n[l]=Math.random()*2-1;const i=t.createBufferSource();i.buffer=this.noiseBuf,i.loop=!0;const s=t.createBiquadFilter();s.type="bandpass",s.frequency.value=500,s.Q.value=.4,this.windGain=t.createGain(),this.windGain.gain.value=.03,i.connect(s),s.connect(this.windGain),this.windGain.connect(this.master),i.start();const r=t.createOscillator();r.type="sawtooth",r.frequency.value=48;const o=t.createBiquadFilter();o.type="lowpass",o.frequency.value=160,this.stormGain=t.createGain(),this.stormGain.gain.value=0,r.connect(o),o.connect(this.stormGain),this.stormGain.connect(this.master),r.start()}setVolumes(t,e){this.volume=t,this.music=e,this.master&&(this.master.gain.value=t),this.musicGain&&(this.musicGain.gain.value=e*.25)}setAmbience(t,e){this.windGain&&(this.windGain.gain.value=.02+t*.1),this.stormGain&&(this.stormGain.gain.value=e*.07)}throttle(t,e){const n=performance.now();return n-(this.lastPlay.get(t)??0)<e?!1:(this.lastPlay.set(t,n),!0)}place(t,e,n){const i=this.ctx;if(e>n)return null;const s=i.createGain(),r=1/(1+(e/18)**1.4),o=Math.max(.02,r);if(s.gain.value=o,i.createStereoPanner){const l=i.createStereoPanner();l.pan.value=Math.max(-1,Math.min(1,t)),s.connect(l),l.connect(this.sfx)}else s.connect(this.sfx);return{out:s,gain:o}}noise(t,e,n,i,s,r,o=!0){const l=this.ctx,c=l.createBufferSource();c.buffer=this.noiseBuf;const h=l.createBiquadFilter();h.type=i,h.frequency.value=e,h.Q.value=n;const d=l.createGain();d.gain.setValueAtTime(s,l.currentTime),o&&d.gain.exponentialRampToValueAtTime(.001,l.currentTime+t),c.connect(h),h.connect(d),d.connect(r),c.start(l.currentTime,Math.random()),c.stop(l.currentTime+t+.05),this.voices++,c.onended=()=>{this.voices--}}tone(t,e,n,i,s,r,o=0){const l=this.ctx,c=l.createOscillator();c.type=n,c.frequency.setValueAtTime(t,l.currentTime+o),r&&c.frequency.exponentialRampToValueAtTime(r,l.currentTime+o+e);const h=l.createGain();h.gain.setValueAtTime(1e-4,l.currentTime+o),h.gain.linearRampToValueAtTime(i,l.currentTime+o+.01),h.gain.exponentialRampToValueAtTime(1e-4,l.currentTime+o+e),c.connect(h),h.connect(s),c.start(l.currentTime+o),c.stop(l.currentTime+o+e+.05),this.voices++,c.onended=()=>{this.voices--}}gunshot(t,e,n,i){if(!this.ctx||this.voices>48||!this.throttle(`gs${i?0:1}${Math.round(n/12)}`,i?0:35))return;const s=this.place(i?0:e,i?0:n,260);if(!s)return;const r=n>70,o=s.out;switch(t){case"wayfarer":this.noise(.14,r?700:1800,.7,"bandpass",.8,o),this.tone(160,.1,"triangle",.5,o,70);break;case"tempest":this.noise(.1,r?800:2400,.8,"bandpass",.7,o),this.tone(210,.07,"square",.25,o,90);break;case"breakwater":case"coil":this.noise(.3,r?500:1100,.5,"lowpass",1.1,o),this.tone(90,.25,"sawtooth",.6,o,40);break;case"needler":this.noise(.07,r?900:3200,1,"bandpass",.55,o),this.tone(300,.05,"square",.2,o,140);break;case"sundial":this.noise(.22,r?600:1500,.6,"bandpass",1,o),this.tone(120,.2,"triangle",.7,o,50);break;case"longwake":this.tone(520,.35,"sine",.5,o,90),this.noise(.3,900,.5,"lowpass",.8,o);break;case"harbor":this.noise(.1,r?800:2e3,.8,"bandpass",.6,o),this.tone(190,.08,"triangle",.35,o,90);break;case"gale":this.tone(260,.35,"sine",.55,o,120),this.noise(.3,600,.4,"lowpass",.5,o);break}n>60&&this.noise(.8,300,.5,"lowpass",.25*(s.gain+.2),o)}footstep(t,e,n){if(!this.ctx||this.voices>48||!this.throttle(`fs${Math.round(e/10)}`,80))return;const i=this.place(t,e,55);i&&this.noise(.06,n?500:380,1.2,"bandpass",n?.5:.35,i.out)}pickup(t){if(!this.ctx)return;const e=this.sfx,n=520+t*110;this.tone(n,.12,"triangle",.22,e),this.tone(n*1.5,.16,"triangle",.18,e,void 0,.07),t>=3&&this.tone(n*2,.3,"sine",.16,e,void 0,.14)}full(){this.ctx&&this.tone(180,.15,"square",.12,this.sfx,120)}hit(t,e,n){if(this.ctx){if(n){this.tone(900,.25,"triangle",.25,this.sfx,200),this.noise(.2,3e3,1,"highpass",.2,this.sfx);return}if(t){this.tone(1500,.12,"sine",.3,this.sfx),this.tone(2200,.1,"sine",.2,this.sfx,void 0,.04);return}this.tone(e?1100:760,.07,"sine",.22,this.sfx)}}hurt(){this.ctx&&this.throttle("hurt",90)&&this.tone(120,.18,"sawtooth",.25,this.sfx,60)}reload(){this.ctx&&(this.noise(.05,2400,2,"bandpass",.3,this.sfx),this.noise(.05,1800,2,"bandpass",.3,this.sfx))}heal(){this.ctx&&this.tone(440,.4,"sine",.12,this.sfx,660)}chest(){this.ctx&&(this.tone(330,.3,"sine",.25,this.sfx,660),this.tone(660,.4,"triangle",.2,this.sfx,990,.1))}explosion(t){if(!this.ctx)return;const e=this.place(0,t,200);e&&(this.noise(.5,350,.5,"lowpass",1,e.out),this.tone(80,.4,"sine",.6,e.out,30))}jump(){this.ctx&&this.throttle("jump",120)&&this.noise(.09,700,.8,"bandpass",.18,this.sfx)}land(t){this.ctx&&this.noise(.12,260,.8,"lowpass",Math.min(.6,.15+t*.03),this.sfx)}slide(){this.ctx&&this.noise(.5,1500,.8,"bandpass",.12,this.sfx)}deploy(){this.ctx&&(this.noise(.4,900,.5,"highpass",.3,this.sfx),this.tone(200,.25,"triangle",.2,this.sfx,340))}stormWarn(){this.ctx&&(this.tone(196,.9,"sine",.3,this.sfx,165),this.tone(246,.9,"sine",.2,this.sfx,207,.15))}capsule(){if(this.ctx)for(let t=0;t<3;t++)this.tone(700+t*160,.25,"triangle",.18,this.sfx,void 0,t*.18)}ui(){this.ctx&&this.tone(620,.06,"triangle",.14,this.sfx)}kill(){this.ctx&&(this.tone(660,.12,"triangle",.25,this.sfx),this.tone(990,.2,"triangle",.25,this.sfx,void 0,.08))}windUse(){this.ctx&&this.tone(300,.3,"sine",.3,this.sfx,600)}tickMusic(t,e){if(!this.ctx||this.music<=.01||(this.musicTimer-=t,this.musicTimer>0))return;const n=[0,2,4,7,9,12,14,16],i=e>.6?110:146.8,s=[0,5,3,4],r=Math.floor(this.musicStep/4)%4,o=n[(this.musicStep*3+(this.musicStep>>2)*2)%n.length]+s[r],l=i*Math.pow(2,o/12),c=this.ctx,h=c.createOscillator();h.type=e>.6?"triangle":"sine",h.frequency.value=l;const d=c.createGain();if(d.gain.setValueAtTime(1e-4,c.currentTime),d.gain.linearRampToValueAtTime(.5,c.currentTime+.3),d.gain.exponentialRampToValueAtTime(1e-4,c.currentTime+2.6),h.connect(d),d.connect(this.musicGain),h.start(),h.stop(c.currentTime+2.7),this.musicStep%4===0){const u=c.createOscillator();u.type="sine",u.frequency.value=i*.5*Math.pow(2,s[r]/12);const p=c.createGain();p.gain.setValueAtTime(1e-4,c.currentTime),p.gain.linearRampToValueAtTime(.45,c.currentTime+.6),p.gain.exponentialRampToValueAtTime(1e-4,c.currentTime+4),u.connect(p),p.connect(this.musicGain),u.start(),u.stop(c.currentTime+4.1)}this.musicStep++,this.musicTimer=e>.6?.9:1.6}}class ev{constructor(t){this.match=t,this.fullSpan=t.mode==="practice"?260:t.world.half*2,this.base=document.createElement("canvas"),this.base.width=this.base.height=this.size,this.bake()}base;size=600;fullSpan;bake(){const t=this.match.world,e=this.base.getContext("2d"),n=e.createImageData(this.size,this.size),i=this.fullSpan,s=i/2;for(let o=0;o<this.size;o++)for(let l=0;l<this.size;l++){const c=l/this.size*i-s,h=o/this.size*i-s,d=t.heightAt(c,h);let u,p,g;if(d<.1){const f=xe(0,-8,d);u=40-f*14,p=150-f*70,g=175-f*60}else{const f=xe(0,46,d);u=118+f*80,p=178-f*22,g=98+f*70,d<2.4&&(u=226,p=214,g=168);const m=(t.heightAt(c+4,h+4)-t.heightAt(c-4,h-4))*-.9;u+=m*6,p+=m*6,g+=m*6}const v=(o*this.size+l)*4;n.data[v]=Math.max(0,Math.min(255,u)),n.data[v+1]=Math.max(0,Math.min(255,p)),n.data[v+2]=Math.max(0,Math.min(255,g)),n.data[v+3]=255}e.putImageData(n,0,0),e.fillStyle="rgba(70,60,50,0.9)";const r=this.size/i;for(const o of t.buildings)e.fillRect((o.x-o.w/2+s)*r,(o.z-o.d/2+s)*r,Math.max(2,o.w*r),Math.max(2,o.d*r));e.fillStyle="rgba(255,120,40,0.85)";for(const o of t.hazards)e.fillRect((o.x0+s)*r,(o.z0+s)*r,(o.x1-o.x0)*r,(o.z1-o.z0)*r)}tx(t,e,n){return{x:((t-n.cx)/n.span+.5)*n.px,y:((e-n.cz)/n.span+.5)*n.px}}draw(t,e,n,i){const s=this.match,r=s.world,o=this.fullSpan,l={cx:n.cx,cz:n.cz,span:n.span,px:e};t.save(),t.clearRect(0,0,e,e),t.fillStyle="#12304a",t.fillRect(0,0,e,e);const c=(n.cx-n.span/2+o/2)/o*this.size,h=(n.cz-n.span/2+o/2)/o*this.size,d=n.span/o*this.size;t.imageSmoothingEnabled=!0,t.drawImage(this.base,c,h,d,d,0,0,e,e);const u=s.storm;if(s.mode==="quick"&&u.phase>=1){const g=this.tx(u.cx,u.cz,l),v=u.r/n.span*e;t.save(),t.beginPath(),t.rect(0,0,e,e),t.arc(g.x,g.y,Math.max(1,v),0,Math.PI*2,!0),t.fillStyle="rgba(130,70,230,0.38)",t.fill("evenodd"),t.restore(),t.lineWidth=2,t.strokeStyle="#d8b8ff",t.beginPath(),t.arc(g.x,g.y,Math.max(1,v),0,Math.PI*2),t.stroke();const f=this.tx(u.nextX,u.nextZ,l);t.strokeStyle="#ffffff",t.setLineDash([6,4]),t.lineWidth=2,t.beginPath(),t.arc(f.x,f.y,Math.max(1,u.nextR/n.span*e),0,Math.PI*2),t.stroke(),t.setLineDash([])}else if(s.mode==="quick"){const g=this.tx(u.nextX,u.nextZ,l);t.strokeStyle="rgba(255,255,255,0.8)",t.setLineDash([6,4]),t.lineWidth=2,t.beginPath(),t.arc(g.x,g.y,u.nextR/n.span*e,0,Math.PI*2),t.stroke(),t.setLineDash([])}if(s.mode==="quick"&&i.showSkiff){const g=this.tx(s.skiff.startX,s.skiff.startZ,l),v=this.tx(s.skiff.endX,s.skiff.endZ,l);t.strokeStyle="rgba(255,255,255,0.85)",t.setLineDash([10,8]),t.lineWidth=2.5,t.beginPath(),t.moveTo(g.x,g.y),t.lineTo(v.x,v.y),t.stroke(),t.setLineDash([]);const f=this.tx(s.skiff.x,s.skiff.z,l);t.fillStyle="#ffd166",t.beginPath(),t.arc(f.x,f.y,6,0,Math.PI*2),t.fill(),t.strokeStyle="#000",t.lineWidth=1.5,t.stroke()}if(i.labels){t.font=`${Math.round(e/48)}px "Segoe UI", sans-serif`,t.textAlign="center";for(const g of r.locations){if(g.id==="wild")continue;const v=this.tx(g.x,g.z,l);t.lineWidth=4,t.strokeStyle="rgba(10,25,40,0.85)",t.fillStyle=g.named?"#ffffff":"#d6ecf5",g.named?t.font=`600 ${Math.round(e/46)}px "Segoe UI", sans-serif`:t.font=`${Math.round(e/62)}px "Segoe UI", sans-serif`,t.strokeText(g.name,v.x,v.y-4),t.fillText(g.name,v.x,v.y-4),t.fillStyle=g.named?"#ffd166":"#bfe6f2",t.beginPath(),t.arc(v.x,v.y+4,g.named?3.2:2.2,0,Math.PI*2),t.fill()}}for(const g of s.capsules){const v=this.tx(g.x,g.z,l);t.fillStyle=g.landed?"#ffc83d":"#ff8a4a",t.beginPath(),t.moveTo(v.x,v.y-8),t.lineTo(v.x+7,v.y+5),t.lineTo(v.x-7,v.y+5),t.closePath(),t.fill(),t.strokeStyle="#000",t.lineWidth=1.5,t.stroke(),g.landed||(t.strokeStyle="rgba(255,200,80,0.7)",t.beginPath(),t.arc(v.x,v.y,14+Math.sin(s.time*4)*2,0,Math.PI*2),t.stroke())}for(const g of i.trails){const v=this.tx(g.x,g.z,l);t.fillStyle=`rgba(255,227,107,${Math.max(.15,1-g.age/14)})`,t.beginPath(),t.arc(v.x,v.y,3,0,Math.PI*2),t.fill()}if(i.marker){const g=this.tx(i.marker.x,i.marker.z,l);t.fillStyle="#ff4d8d",t.strokeStyle="#fff",t.lineWidth=2,t.beginPath(),t.moveTo(g.x,g.y),t.lineTo(g.x-7,g.y-16),t.lineTo(g.x+7,g.y-16),t.closePath(),t.fill(),t.stroke()}const p=s.players[i.humanId];if(p&&p.alive){const g=this.tx(p.x,p.z,l);t.save(),t.translate(g.x,g.y),t.rotate(Math.PI-i.yaw),t.fillStyle=i.colorblind?"#ffffff":"#fff27a",t.strokeStyle="#000",t.lineWidth=1.5,t.beginPath(),t.moveTo(0,-9),t.lineTo(6,7),t.lineTo(0,3),t.lineTo(-6,7),t.closePath(),t.fill(),t.stroke(),t.restore()}t.restore()}}const Ts={forward:"KeyW",back:"KeyS",left:"KeyA",right:"KeyD",jump:"Space",sprint:"ShiftLeft",crouch:"ControlLeft",reload:"KeyR",interact:"KeyE",drop:"KeyQ",melee:"KeyF",swapShoulder:"KeyX",map:"KeyM",inventory:"Tab",throwItem:"KeyG",deploy:"KeyZ",slot1:"Digit1",slot2:"Digit2",slot3:"Digit3",slot4:"Digit4",slot5:"Digit5"},nv={forward:"Move forward",back:"Move back",left:"Strafe left",right:"Strafe right",jump:"Jump / mantle / wing-sail",sprint:"Sprint",crouch:"Crouch / slide",reload:"Reload",interact:"Interact / pick up (hold to swap)",drop:"Drop selected",melee:"Quick melee",swapShoulder:"Swap shoulder",map:"Full map",inventory:"Inventory",throwItem:"Throw utility",deploy:"Deploy / stow wing-sail",slot1:"Slot 1",slot2:"Slot 2",slot3:"Slot 3",slot4:"Slot 4",slot5:"Slot 5"},iv={sens:1,adsSens:.75,fov:90,quality:"medium",resolution:1,dynamicRes:!0,volume:.7,music:.35,reducedMotion:!1,colorblind:!1,soundIndicators:!0,captions:!1,adsToggle:!1,crouchToggle:!1,sprintToggle:!1,invertY:!1,showFps:!1,keys:{...Ts}},Lh="skybreak.settings.v1",Ih="skybreak.profile.v1";function Dh(a){try{return localStorage.getItem(a)}catch{return null}}function kh(a,t){try{localStorage.setItem(a,t)}catch{}}function sv(){const a=Dh(Lh),t={...iv,keys:{...Ts}};if(a)try{const e=JSON.parse(a);Object.assign(t,e),t.keys={...Ts,...e.keys??{}}}catch{}return t}function av(a){kh(Lh,JSON.stringify(a))}const Nr={name:"Guest",xp:0,matches:0,wins:0,kills:0,bestPlacement:99,outfit:0,practiceVisited:!1,history:[]};function rv(){const a=Dh(Ih);if(!a)return{...Nr,history:[]};try{return{...Nr,...JSON.parse(a)}}catch{return{...Nr,history:[]}}}function Fr(a){kh(Ih,JSON.stringify(a))}function va(a){return 1+Math.floor(a/400)}const Uc=[1,2,3,5];function nt(a,t="",e=""){const n=document.createElement(a);return t&&(n.className=t),e&&(n.innerHTML=e),n}class ov{root;current=null;profile;settings;onQuick=()=>{};onPractice=()=>{};onSettingsChanged=()=>{};onProfileChanged=()=>{};onResume=()=>{};onLeaveMatch=()=>{};onRequeue=()=>{};onMenu=()=>{};onMarker=()=>{};onDropSlot=()=>{};onSelectSlot=()=>{};onCancelQueue=()=>{};mapOverlay=null;mapCanvas=null;invOverlay=null;listening=null;constructor(t,e,n){this.root=nt("div"),this.root.id="screens",t.appendChild(this.root),this.profile=e,this.settings=n,window.addEventListener("keydown",i=>{this.listening&&(i.preventDefault(),i.stopPropagation(),i.code!=="Escape"?(this.settings.keys[this.listening.key]=i.code,this.listening.btn.textContent=ne(i.code),this.onSettingsChanged()):this.listening.btn.textContent=ne(this.settings.keys[this.listening.key]),this.listening.btn.classList.remove("listening"),this.listening=null)},!0)}clear(){this.current&&(this.current.remove(),this.current=null)}show(t){return this.clear(),this.root.appendChild(t),this.current=t,t}showMenu(){const t=nt("div","screen menu-bg left"),e=nt("div","menu-art");e.innerHTML=lv,t.appendChild(e);const n=va(this.profile.xp);t.appendChild(nt("div","profile-chip",`<b>${this.profile.name}</b> · Mastery ${n} · ${this.profile.wins} wins · ${this.profile.matches} matches`));const i=nt("div","title-wrap");i.innerHTML='<h1 class="logo">SKY<span>BREAK</span></h1><div class="tagline">Drop · Loot · Rotate · Survive</div>';const s=nt("div","menu-col"),r=nt("button","btn big","Quick Drop");r.onclick=()=>this.onQuick();const o=nt("button","btn alt",this.profile.practiceVisited?"Practice Range":"Practice Range — start here");o.onclick=()=>this.onPractice();const l=nt("button","btn dark","Career & Appearance");l.onclick=()=>this.showCareer();const c=nt("button","btn dark","Settings");c.onclick=()=>this.showSettings(()=>this.showMenu());const h=nt("button","btn dark small","Controls & Credits");h.onclick=()=>this.showCredits(),s.append(r,o,l,c,h),i.appendChild(s),t.appendChild(i),t.appendChild(nt("div","footer-note","Solo · 24 players · The Highwake · Desktop Chrome / Edge with WebGL 2 · Single-player, runs entirely in your browser")),this.show(t),r.focus()}showQueue(){const t=nt("div","screen menu-bg"),e=nt("div","panel queue-card");e.innerHTML=`<h2>Quick Drop · Solo</h2><div class="spinner"></div><div class="q-stage" style="font-size:18px;font-weight:700">Finding a room…</div>
      <div class="bar"><i style="width:0%"></i></div><div class="kv" style="justify-content:center;grid-template-columns:auto auto"><span class="k">Region</span><span>Local (host in this tab)</span><span class="k">Elapsed</span><span class="q-time">0:00</span><span class="k">Players</span><span class="q-players">1 / 24</span></div>`;const n=nt("button","btn small dark","Cancel");return n.style.marginTop="14px",n.onclick=()=>this.onCancelQueue(),e.appendChild(n),t.appendChild(e),this.show(t),{update:(i,s,r,o)=>{e.querySelector(".q-time").textContent=`0:${String(Math.floor(i)).padStart(2,"0")}`,e.querySelector(".q-players").textContent=`${s} / ${r}`,e.querySelector(".q-stage").textContent=o,e.querySelector(".bar i").style.width=`${s/r*100}%`}}}showLoading(t){const e=nt("div","screen menu-bg");e.innerHTML=`<div class="panel queue-card"><h2>${t}</h2><div class="spinner"></div><div style="opacity:.8">Generating island cells, collision and loot tables…</div></div>`,this.show(e)}showError(t,e,n=[]){const i=nt("div","screen menu-bg dim-bg"),s=nt("div","panel error-card");s.innerHTML=`<h2>${t}</h2><p style="font-size:16px;line-height:1.6">${e}</p>`;const r=nt("div","row");r.style.justifyContent="center",r.style.marginTop="14px";for(const o of n){const l=nt("button","btn small",o.label);l.onclick=o.fn,r.appendChild(l)}s.appendChild(r),i.appendChild(s),this.show(i)}showSettings(t,e=!1){const n=nt("div","screen "+(e?"dim-bg":"menu-bg dim-bg")),i=nt("div","panel");i.style.width="min(760px, 94vw)",i.innerHTML="<h2>Settings</h2>";const s=nt("div","tabs"),r=nt("div"),o=["Gameplay","Graphics","Audio","Accessibility","Controls"];let l=0;const c=()=>{r.innerHTML="",s.querySelectorAll(".tab").forEach((v,f)=>v.classList.toggle("on",f===l));const d=nt("div","settings-grid"),u=this.settings,p=(v,f,m,y,S,x=T=>T.toFixed(2))=>{d.appendChild(nt("label","",v));const T=nt("input");T.type="range",T.min=String(m),T.max=String(y),T.step=String(S),T.value=String(u[f]);const E=nt("div","val",x(u[f]));T.oninput=()=>{u[f]=Number(T.value),E.textContent=x(Number(T.value)),this.onSettingsChanged()},d.append(T,E)},g=(v,f)=>{d.appendChild(nt("label","",v));const m=nt("input");m.type="checkbox",m.checked=!!u[f],m.onchange=()=>{u[f]=m.checked,this.onSettingsChanged()},m.style.justifySelf="start",m.style.width="20px",m.style.height="20px",d.append(m,nt("div"))};if(l===0)p("Mouse sensitivity","sens",.2,3,.05),p("Scoped / ADS sensitivity","adsSens",.2,2,.05),p("Field of view (horizontal)","fov",80,105,1,v=>`${Math.round(v)}°`),g("Hold-to-toggle ADS (click to toggle)","adsToggle"),g("Toggle crouch","crouchToggle"),g("Toggle sprint","sprintToggle"),g("Invert Y","invertY");else if(l===1){d.appendChild(nt("label","","Quality preset"));const v=nt("select");for(const m of["low","medium","high"]){const y=nt("option","",m);y.value=m,u.quality===m&&(y.selected=!0),v.appendChild(y)}v.onchange=()=>{u.quality=v.value,this.onSettingsChanged()},d.append(v,nt("div")),p("Render resolution","resolution",.5,1,.05,m=>`${Math.round(m*100)}%`),g("Dynamic resolution","dynamicRes"),g("Show FPS","showFps");const f=nt("div","","Low preserves storm wall, mist-cloud boundary, tracers and projectile threats; it only reduces shadows, effect counts, draw distance and resolution.");f.style.gridColumn="1 / -1",f.style.opacity="0.75",f.style.fontSize="12px",d.appendChild(f)}else if(l===2)p("Master volume","volume",0,1,.05,v=>`${Math.round(v*100)}%`),p("Music volume","music",0,1,.05,v=>`${Math.round(v*100)}%`);else if(l===3){g("Reduced motion (camera recoil & shake)","reducedMotion"),g("Colorblind-safe rarity colors","colorblind"),g("Visual sound indicators","soundIndicators"),g("Closed captions","captions");const v=nt("div","","Rarity is always conveyed by shape and name as well as color: Field ● · Tuned ⌃ · Advanced ◆ · Masterwork ♛ · Prototype ★. The storm never strobes.");v.style.gridColumn="1 / -1",v.style.opacity="0.75",v.style.fontSize="12px",d.appendChild(v)}else{for(const f of Object.keys(Ts)){d.appendChild(nt("label","",nv[f]));const m=nt("button","keybtn",ne(u.keys[f]));m.onclick=()=>{this.listening&&this.listening.btn.classList.remove("listening"),this.listening={btn:m,key:f},m.textContent="press a key…",m.classList.add("listening")},d.append(m,nt("div"))}const v=nt("button","btn small dark","Reset to defaults");v.onclick=()=>{u.keys={...Ts},this.onSettingsChanged(),c()},v.style.gridColumn="1 / -1",d.appendChild(v)}r.appendChild(d)};o.forEach((d,u)=>{const p=nt("div","tab",d);p.onclick=()=>{l=u,c()},s.appendChild(p)}),i.append(s,r);const h=nt("button","btn","Done");h.style.marginTop="16px",h.onclick=()=>{this.onSettingsChanged(),t()},i.appendChild(h),n.appendChild(i),this.show(n),c()}showCareer(){const t=nt("div","screen menu-bg dim-bg"),e=nt("div","panel");e.style.width="min(820px, 94vw)";const n=this.profile,i=va(n.xp),s=n.xp%400;e.innerHTML=`<h2>Career</h2>
      <div class="stat-grid"><div class="stat"><div class="v">${i}</div><div class="l">Mastery level</div></div><div class="stat"><div class="v">${n.matches}</div><div class="l">Matches</div></div><div class="stat"><div class="v">${n.wins}</div><div class="l">Wins</div></div><div class="stat"><div class="v">${n.kills}</div><div class="l">Eliminations</div></div></div>
      <div>Mastery XP: ${n.xp} <span style="opacity:.7">(${s}/400 to next level)</span></div><div class="xp-bar"><i style="width:${s/400*100}%"></i></div>
      <h3>Appearance (cosmetic only — never affects gameplay)</h3>`;const r=nt("div","outfits");Hr.forEach((c,h)=>{const d=i>=Uc[h],u=nt("div","outfit"+(n.outfit===h?" on":"")+(d?"":" locked"));u.style.background=`linear-gradient(160deg, ${c.primary}, ${c.accent})`,u.innerHTML=d?c.name:`Lv ${Uc[h]}`,u.onclick=()=>{d&&(n.outfit=h,this.onProfileChanged(),this.showCareer())},r.appendChild(u)}),e.appendChild(r),e.appendChild(nt("h3","","Recent matches"));const o=nt("div","list");o.innerHTML=n.history.length?n.history.slice(0,8).map(c=>`<div>${c.date} · ${c.mode==="quick"?"Solo":"Practice"} · <b>#${c.placement}</b> · ${c.kills} elims · ${Math.round(c.damage)} dmg · +${c.xp} XP</div>`).join(""):'<div style="opacity:.7">No matches yet — drop in!</div>',e.appendChild(o);const l=nt("button","btn","Back");l.style.marginTop="14px",l.onclick=()=>this.showMenu(),e.appendChild(l),t.appendChild(e),this.show(t)}showCredits(){const t=nt("div","screen menu-bg dim-bg"),e=nt("div","panel credits");e.style.width="min(880px, 94vw)";const n=this.settings.keys;e.innerHTML=`<h2>Controls</h2><div class="legend">
      <div><kbd>${ne(n.forward)}${ne(n.left)}${ne(n.back)}${ne(n.right)}</kbd>Move</div><div><kbd>Mouse</kbd>Aim · <kbd>LMB</kbd> fire · <kbd>RMB</kbd> ADS</div>
      <div><kbd>${ne(n.sprint)}</kbd>Sprint (5 s energy)</div><div><kbd>${ne(n.crouch)}</kbd>Crouch · slide while sprinting</div>
      <div><kbd>${ne(n.jump)}</kbd>Jump · mantle ledges (hold) · wing-sail in the air</div><div><kbd>${ne(n.interact)}</kbd>Interact / pick up · hold to swap · ride zipline</div>
      <div><kbd>1-5</kbd> / wheel Select slot · <kbd>${ne(n.reload)}</kbd> reload</div><div><kbd>${ne(n.drop)}</kbd>Drop selected · <kbd>${ne(n.melee)}</kbd> melee</div>
      <div><kbd>${ne(n.throwItem)}</kbd>Throw Wind Orb / Mist · <kbd>${ne(n.swapShoulder)}</kbd> swap shoulder</div><div><kbd>${ne(n.map)}</kbd>Full map · click to mark · <kbd>MMB</kbd> ping</div>
      <div><kbd>${ne(n.inventory)}</kbd>Inventory · <kbd>${ne(n.deploy)}</kbd> deploy/stow wing-sail</div><div><kbd>Esc</kbd>Menu · <kbd>Enter</kbd> skip staging</div></div>
      <h2 style="margin-top:20px">Credits</h2>
      <p><b>Skybreak</b> is an original game. The island, characters, weapons (wind-instrument inspired), items, wing-sails, skiff, music and sound are all generated procedurally in code. No third-party art, audio, maps or names are used. Engine: three.js (MIT). See ASSETS.md.</p>
      <p style="opacity:.75">The Highwake · The Calmfield · The Riftstorm · Aegis · Wayfarer · Tempest · Breakwater · Coil · Needler · Sundial · Longwake · Harbor · Gale</p>`;const i=nt("button","btn","Back");i.style.marginTop="14px",i.onclick=()=>this.showMenu(),e.appendChild(i),t.appendChild(e),this.show(t)}showPause(t){const e=nt("div","screen dim-bg"),n=nt("div","panel");n.style.minWidth="320px",n.innerHTML=`<h2>${t?"Practice Range (paused)":"Menu"}</h2>`;const i=nt("div","menu-col"),s=nt("button","btn","Resume");s.onclick=()=>this.onResume();const r=nt("button","btn dark","Settings");r.onclick=()=>this.showSettings(()=>this.showPause(t),!0);const o=nt("button","btn dark",t?"Back to Menu":"Leave Match");o.onclick=()=>this.onLeaveMatch(),i.append(s,r,o),n.appendChild(i),t||(n.appendChild(nt("div","footer-note","")).style.position="static"),e.appendChild(n),this.show(e)}showResults(t,e,n){const i=nt("div","screen menu-bg dim-bg"),s=nt("div","panel results"),r=t.placement===1,o=va(this.profile.xp-t.xpGain),l=va(this.profile.xp);s.innerHTML=`<div class="row"><div class="grow"><div class="place ${r?"win":""}">${r?"VICTORY":`#${t.placement}`}</div>
      <div style="font-size:18px;margin-top:6px">${r?"Last one standing on The Highwake.":`Placed ${t.placement} of ${t.total}${t.killedBy?` · eliminated by ${t.killedBy}`:""}`}${t.winnerName&&!r?` · Winner: ${t.winnerName}`:""}</div></div>
      <div style="text-align:right"><div style="font-size:14px;color:#9cc3d1">MASTERY XP</div><div style="font-size:28px;font-weight:900;color:var(--violet)">+${t.xpGain}</div>${l>o?'<div style="color:var(--gold);font-weight:800">LEVEL UP! → '+l+"</div>":""}</div></div>
      <div class="stat-grid">
        <div class="stat"><div class="v">${t.kills}</div><div class="l">Eliminations</div></div><div class="stat"><div class="v">${t.assists}</div><div class="l">Assists</div></div>
        <div class="stat"><div class="v">${Math.round(t.damage)}</div><div class="l">Damage dealt</div></div><div class="stat"><div class="v">${t.accuracy}%</div><div class="l">Accuracy · ${t.headshots} headshots</div></div>
        <div class="stat"><div class="v">${Or(t.survive)}</div><div class="l">Survival time</div></div><div class="stat"><div class="v">${(t.distance/1e3).toFixed(2)} km</div><div class="l">Distance travelled</div></div>
        <div class="stat"><div class="v">${Math.round(t.storm)}</div><div class="l">Storm damage taken</div></div><div class="stat"><div class="v">${t.loot.length}</div><div class="l">Items picked up</div></div>
      </div><div class="res-cols"><div><h3>Loot history</h3><div class="list">${t.loot.slice(-40).map(p=>`<div><span class="chip" style="background:${un[p.rarity].color}"></span>${Or(p.t)} · ${p.name}</div>`).join("")||"<div>No pickups</div>"}</div></div>
      <div><h3>Match timeline</h3><div class="list">${t.timeline.slice(-40).map(p=>`<div>${Or(p.t)} · ${p.text}</div>`).join("")}</div></div><div><h3>Route</h3><canvas class="route" width="220" height="220" style="width:220px;height:220px;border-radius:10px"></canvas></div></div>`;const c=nt("div","row");c.style.marginTop="16px";const h=nt("button","btn",t.mode==="quick"?"Requeue":"Play again");h.onclick=()=>this.onRequeue();const d=nt("button","btn dark","Main Menu");d.onclick=()=>this.onMenu(),c.append(h,d),s.appendChild(c),i.appendChild(s),this.show(i);const u=s.querySelector("canvas.route");if(u&&n){const p=u.getContext("2d");p.drawImage(n.base,0,0,600,600,0,0,220,220),p.strokeStyle="#fff27a",p.lineWidth=2,p.beginPath(),t.route.forEach((v,f)=>{const m=(v.x+600)/1200*220,y=(v.z+600)/1200*220;f===0?p.moveTo(m,y):p.lineTo(m,y)}),p.stroke();const g=t.route[t.route.length-1];g&&(p.fillStyle="#ff5f6d",p.beginPath(),p.arc((g.x+600)/1200*220,(g.z+600)/1200*220,4,0,Math.PI*2),p.fill())}}openMap(t,e,n,i,s){this.closeMap();const r=nt("div","screen map-overlay"),o=nt("div","panel map-card"),l=nt("canvas");l.width=l.height=900;const c=nt("div","map-help","<span>Click to place a marker · click it again to clear</span><span>M / Esc to close</span>");o.append(l,c),r.appendChild(o),this.root.appendChild(r),this.mapOverlay=r,this.mapCanvas=l;let h=s;l.onclick=u=>{const p=l.getBoundingClientRect(),g=((u.clientX-p.left)/p.width-.5)*e.fullSpan,v=((u.clientY-p.top)/p.height-.5)*e.fullSpan;h&&Math.hypot(h.x-g,h.z-v)<25?h=null:h={x:g,z:v},this.onMarker(h)};const d=()=>{if(!this.mapOverlay)return;const u=t.players[i];e.draw(l.getContext("2d"),900,{cx:0,cz:0,span:e.fullSpan},{labels:!0,marker:h,humanId:i,yaw:n(),showSkiff:t.phase==="staging"||t.phase==="skiff",trails:u?t.beaconTrails(u):[],colorblind:this.settings.colorblind}),requestAnimationFrame(d)};d()}closeMap(){this.mapOverlay&&(this.mapOverlay.remove(),this.mapOverlay=null)}get mapOpen(){return!!this.mapOverlay}openInventory(t){this.closeInventory();const e=nt("div","screen inv-overlay"),n=nt("div","panel");n.style.width="min(820px, 96vw)",e.appendChild(n),this.root.appendChild(e),this.invOverlay=e;let i=t().selected;const s=()=>{if(!this.invOverlay)return;const o=t();n.innerHTML="<h2>Inventory</h2>";const l=nt("div","inv-grid");o.slots.forEach((v,f)=>{const m=nt("div","inv-slot"+(f===i?" sel":"")),y=nt("canvas");if(y.width=240,y.height=80,m.appendChild(y),!v)m.append(nt("div","nm",`Slot ${f+1}`),nt("div","st","Empty"));else if(v.kind==="weapon"){const S=un[v.rarity],x=this.settings.colorblind?S.colorBlind:S.color;Rh(y.getContext("2d"),v.weapon,240,80,x),m.append(nt("div","nm",`<span style="color:${x}">${Ce[v.weapon].name}</span>`),nt("div","st",`${S.name} · ${v.mag}/${Xe(v.weapon,v.rarity).mag}`)),m.style.borderColor=f===i?"#fff":x;const T=nt("canvas");T.width=T.height=28,T.style.cssText="position:absolute;top:6px;right:6px;width:22px;height:22px",Qo(T.getContext("2d"),S.shape,x,14,14,11,!0),m.appendChild(T)}else Ph(y.getContext("2d"),v.item,240,80),m.append(nt("div","nm",fe[v.item].name),nt("div","st",`×${v.count} · ${fe[v.item].blurb}`));m.onclick=()=>{i=f,this.onSelectSlot(f),s()},l.appendChild(m)}),n.appendChild(l);const c=nt("div","inv-detail"),h=o.slots[i];if(h&&h.kind==="weapon"){const v=Xe(h.weapon,h.rarity);c.innerHTML=`<b style="font-size:17px">${v.def.name}</b> — ${v.rarity.name} (${v.rarity.note})<br>${v.def.cls} · ${ba[v.def.ammo]} ammo · ${v.def.kind==="hitscan"?"Hitscan":"Projectile"}<br>
        Damage ${v.damage.toFixed(1)}${v.def.pellets>1?` ×${v.def.pellets} pellets (cap ${Math.round(v.def.pelletCap*v.rarity.damage)})`:""} · Fire rate ${Math.round(v.rpm)} rpm · Magazine ${v.mag} · Reload ${v.reload.toFixed(2)}s<br>Head ×${v.def.headMult} · Falloff ${v.def.falloffStart}→${v.def.falloffEnd} m (min ${Math.round(v.def.falloffMin*100)}%) · Spread ${(v.def.spread*v.spread).toFixed(2)}° hip / ${(v.def.adsSpread*v.spread).toFixed(2)}° ADS · Recoil ×${v.recoil.toFixed(2)}`}else h?c.innerHTML=`<b style="font-size:17px">${fe[h.item].name}</b> ×${h.count}<br>${fe[h.item].blurb}`:c.textContent="Empty slot. Pick up weapons, heals, shields and utility from the world. Five slots, shared by everything.";n.appendChild(c);const d=nt("div","ammo-row");d.innerHTML=Gn.map(v=>`<div>${ba[v]}<br>${o.ammo[v]} / ${Io[v]}</div>`).join(""),n.appendChild(d);const u=nt("div","row");u.style.marginTop="12px";const p=nt("button","btn small","Drop selected");p.onclick=()=>{this.onDropSlot(i),setTimeout(s,80)};const g=nt("button","btn small dark","Close (Tab)");g.onclick=()=>this.closeInventory(),u.append(p,g),n.appendChild(u)};s();const r=setInterval(()=>{this.invOverlay?s():clearInterval(r)},600)}closeInventory(){this.invOverlay&&(this.invOverlay.remove(),this.invOverlay=null)}get invOpen(){return!!this.invOverlay}}const lv=`<svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cliff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a58b6a"/><stop offset="0.5" stop-color="#7a6a8e"/><stop offset="1" stop-color="#4a3f7a"/></linearGradient>
    <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8bd36a"/><stop offset="1" stop-color="#4d9f4f"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffe9a8" stop-opacity="0.9"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient>
  </defs>
  <g opacity="0.9" transform="translate(60,60)"><path d="M60 80 L120 140 L90 190 L150 260 L110 300" stroke="#bff6ff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M90 190 L40 230" stroke="#9b72ff" stroke-width="3" fill="none"/></g>
  <g transform="translate(0,40)">
    <path d="M140 330 Q600 250 1060 330 L960 420 Q820 480 760 520 L700 470 Q600 540 520 470 L440 520 Q380 470 240 420 Z" fill="url(#cliff)"/>
    <path d="M140 330 Q600 200 1060 330 Q600 390 140 330 Z" fill="url(#top)"/>
    <path d="M200 338 Q600 250 1000 338 Q700 372 200 338Z" fill="#c9be8e" opacity="0.55"/>
    <g fill="#e9dcbe" stroke="#b79a62" stroke-width="2">
      <rect x="470" y="300" width="58" height="34"/><rect x="540" y="288" width="44" height="46"/><rect x="600" y="302" width="62" height="32"/><rect x="676" y="294" width="40" height="40"/>
    </g>
    <g fill="#e8613f"><rect x="466" y="294" width="66" height="10"/><rect x="536" y="282" width="52" height="10"/></g>
    <g fill="#c77d3d"><rect x="800" y="236" width="8" height="96"/><circle cx="804" cy="236" r="6"/></g>
    <g stroke="#e9dcbe" stroke-width="6" stroke-linecap="round"><path d="M804 236 L804 186"/><path d="M804 236 L846 260"/><path d="M804 236 L762 260"/></g>
    <g fill="#2f8a47"><circle cx="330" cy="316" r="16"/><circle cx="366" cy="324" r="12"/><circle cx="740" cy="320" r="14"/><circle cx="916" cy="326" r="12"/><circle cx="260" cy="326" r="11"/><circle cx="410" cy="320" r="10"/></g>
    <g fill="#5aa84a"><circle cx="322" cy="308" r="10"/><circle cx="736" cy="312" r="9"/></g>
    <ellipse cx="1090" cy="360" rx="42" ry="12" fill="#6a5a86"/><path d="M1050 360 Q1090 392 1130 360Z" fill="#53457a"/>
    <ellipse cx="150" cy="420" rx="30" ry="9" fill="#6a5a86"/>
  </g>
  <g transform="translate(980,150) rotate(-6)">
    <path d="M-60 12 L60 12 L80 0 L60 -4 L-60 -4Z" fill="#f1e5c6" stroke="#b9a36e" stroke-width="2"/>
    <rect x="-52" y="-18" width="104" height="14" fill="#2aa6b4"/><rect x="-6" y="-60" width="4" height="44" fill="#4a4a55"/><path d="M-2 -60 L38 -34 L-2 -22Z" fill="#ff7b4a"/>
    <circle cx="-64" cy="2" r="8" fill="#c77d3d"/>
  </g>
</svg>`;function Or(a){const t=Math.max(0,Math.floor(a));return`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}class cv{settings=sv();profile=rv();canvas;app;view;hud;screens;input;audio=new tv;match=null;state="menu";mapRenderer=null;marker=null;acc=0;last=performance.now();fps=60;fpsTimer=0;dynRatio=1;lowFpsFor=0;highFpsFor=0;routeTimer=0;route=[];spectateId=-1;spectateDelay=0;fast=1;endTimer=-1;resultsShown=!1;queueTimer=null;lastAlertPhase=-1;storming=!1;lastAimPose=null;frameCount=0;shake=0;lastStormTick=0;debugScale=1;pendingMode="quick";seedOverride=null;constructor(t,e){this.canvas=t,this.app=e;const n=new URLSearchParams(location.search).get("seed");n&&(this.seedOverride=Number(n)||null)}boot(){this.view=new Zg(this.canvas,this.settings),this.hud=new Jg(this.app),this.screens=new ov(this.app,this.profile,this.settings),this.input=new Qg(this.canvas,this.settings),this.wire(),this.applySettings(),window.addEventListener("resize",()=>this.resize()),this.resize(),this.screens.showMenu(),this.state="menu",requestAnimationFrame(t=>this.frame(t))}wire(){const t=this.screens;t.onQuick=()=>{this.audio.ensure(),this.audio.ui(),this.startQueue("quick")},t.onPractice=()=>{this.audio.ensure(),this.audio.ui(),this.pendingMode="practice",this.input.requestLock(),this.startMatch("practice")},t.onSettingsChanged=()=>{this.applySettings(),av(this.settings)},t.onProfileChanged=()=>Fr(this.profile),t.onResume=()=>{t.clear(),this.state="playing",this.input.requestLock()},t.onLeaveMatch=()=>this.leaveToMenu(),t.onRequeue=()=>{this.audio.ensure(),this.input.requestLock(),this.pendingMode==="practice"?this.startMatch("practice"):this.startQueue("quick")},t.onMenu=()=>this.leaveToMenu(),t.onCancelQueue=()=>{this.queueTimer!==null&&(clearInterval(this.queueTimer),this.queueTimer=null),this.input.exitLock(),this.state="menu",t.showMenu()},t.onMarker=e=>{this.marker=e,this.audio.ui()},t.onDropSlot=e=>{const n=this.humanPlayer();n&&(n.selected=e,this.queuedDrop=!0)},t.onSelectSlot=e=>{this.queuedSlot=e},this.input.onToggleMap=()=>this.toggleMap(),this.input.onToggleInventory=()=>this.toggleInventory(),this.input.onPing=()=>this.pingMarker(),this.input.onEscape=()=>this.escape(),this.input.onLockChange=e=>{!e&&this.state==="playing"&&!this.screens.mapOpen&&!this.screens.invOpen&&!this.suppressPause&&this.openPause(),e&&this.hud.showHint(!1)},this.input.onAnyKey=e=>{this.state==="playing"&&this.spectating()&&((e==="ArrowRight"||e==="KeyD")&&this.cycleSpectate(1),(e==="ArrowLeft"||e==="KeyA")&&this.cycleSpectate(-1)),e==="Enter"&&this.state==="playing"&&this.match&&this.match.phase==="staging"&&(this.match.stagingLeft=Math.min(this.match.stagingLeft,.4))},this.hud.onHintClick=()=>{this.input.requestLock()},this.hud.onLeave=()=>this.showResults(),this.hud.onNextSpectate=e=>this.cycleSpectate(e),this.hud.onFast=()=>{this.fast=this.fast===1?4:1,this.hud.fastBtn.textContent=`Fast ×${this.fast}`},this.canvas.addEventListener("click",()=>{this.state==="playing"&&!this.input.locked&&!this.screens.mapOpen&&!this.screens.invOpen&&!this.spectating()&&this.input.requestLock()})}queuedDrop=!1;queuedSlot=-1;suppressPause=!1;applySettings(){const t=this.settings.quality;this.view.setQuality(t),this.audio.setVolumes(this.settings.volume,this.settings.music),this.resize()}resize(){const t=window.innerWidth,e=window.innerHeight,n=Math.min(window.devicePixelRatio||1,1.25)*this.settings.resolution*_s[this.settings.quality].pixel,i=this.settings.dynamicRes?Math.min(n,n*this.dynRatio):n;this.view.setPixelRatio(Math.max(.4,i)),this.view.resize(t,e)}humanPlayer(){return this.match?.human}spectating(){const t=this.humanPlayer();return!!t&&!t.alive&&this.match?.mode==="quick"}startQueue(t){this.pendingMode=t,this.state="queue",this.input.requestLock();const e=this.screens.showQueue();let n=0,i=1;const s=["Finding a room…","Room found · region: local","Filling seats with bots…","Match ready"];this.queueTimer=window.setInterval(()=>{n+=.2,i=Math.min(24,i+Math.ceil(Math.random()*3));const r=n<.8?s[0]:n<1.4?s[1]:i<24?s[2]:s[3];e.update(n,i,24,r),n>=2&&(clearInterval(this.queueTimer),this.queueTimer=null,e.update(n,24,24,s[3]),this.startMatch("quick"))},200)}startMatch(t){this.pendingMode=t,this.state="loading",this.screens.showLoading(t==="quick"?"Loading The Highwake":"Loading Practice Range"),window.setTimeout(()=>this.finishLoad(t),60)}finishLoad(t){const e=this.seedOverride??Math.floor(Math.random()*1e9);try{const n=new gd({seed:e,mode:t,humanName:this.profile.name}),i=n.players[0];i.cosmetic=this.profile.outfit,this.match=n,this.view.setMatch(n),this.view.snapshot(),this.mapRenderer=new ev(n),this.hud.setMap(this.mapRenderer),this.hud.reset(),this.marker=null,this.route=[],this.routeTimer=0,this.input.yaw=t==="quick"?Math.atan2(n.skiff.dirX,n.skiff.dirZ):Math.PI,this.input.pitch=-.08,this.input.resetToggles(),this.acc=0,this.fast=1,this.hud.fastBtn.textContent="Fast ×1",this.spectateId=-1,this.endTimer=-1,this.resultsShown=!1,this.recordedRun=!1,this.lastResult=null,this.shake=0,this.lastAlertPhase=-1,this.storming=!1,this.hud.setSpectate(!1,"",""),this.screens.clear(),this.hud.show(!0),this.state="playing",this.input.enabled=!0,this.input.overlayOpen=!1,this.input.moveWhileUnlocked=!1,this.input.locked||this.hud.showHint(!0),t==="practice"&&(this.profile.practiceVisited=!0,Fr(this.profile)),this.hud.notify(t==="quick"?"Welcome to The Highwake — Solo":"Practice Range — weapons on the rack behind you",3200)}catch(n){console.error(n),this.state="error",this.screens.showError("Could not start the match",`The world failed to build: ${n.message}`,[{label:"Back to menu",fn:()=>this.leaveToMenu()}])}}leaveToMenu(){this.queueTimer!==null&&(clearInterval(this.queueTimer),this.queueTimer=null),this.match&&this.match.mode==="quick"&&!this.resultsShown&&this.state!=="menu"&&this.recordResult(!1),this.suppressPause=!0,this.input.exitLock(),setTimeout(()=>{this.suppressPause=!1},100),this.screens.closeMap(),this.screens.closeInventory(),this.hud.show(!1),this.state="menu",this.match=null,this.screens.showMenu()}openPause(){this.match&&(this.state="paused",this.screens.showPause(this.match.mode==="practice"))}escape(){if(this.screens.mapOpen){this.toggleMap();return}if(this.screens.invOpen){this.toggleInventory();return}this.state==="playing"?(this.suppressPause=!0,this.input.exitLock(),setTimeout(()=>{this.suppressPause=!1},100),this.openPause()):this.state==="paused"&&this.screens.onResume()}toggleMap(){this.state!=="playing"||!this.match||!this.mapRenderer||(this.screens.mapOpen?(this.screens.closeMap(),this.input.overlayOpen=this.screens.invOpen,this.input.moveWhileUnlocked=!1,this.spectating()||this.input.requestLock()):(this.screens.closeInventory(),this.suppressPause=!0,this.input.exitLock(),setTimeout(()=>{this.suppressPause=!1},100),this.input.overlayOpen=!0,this.input.moveWhileUnlocked=!0,this.screens.openMap(this.match,this.mapRenderer,()=>this.input.yaw,this.match.humanId,this.marker),this.audio.ui()))}toggleInventory(){this.state!=="playing"||!this.match||this.spectating()||(this.screens.invOpen?(this.screens.closeInventory(),this.input.overlayOpen=!1,this.input.moveWhileUnlocked=!1,this.input.requestLock()):(this.screens.closeMap(),this.suppressPause=!0,this.input.exitLock(),setTimeout(()=>{this.suppressPause=!1},100),this.input.overlayOpen=!0,this.input.moveWhileUnlocked=!0,this.screens.openInventory(()=>this.match.players[this.match.humanId]),this.audio.ui()))}pingMarker(){if(!this.humanPlayer()||!this.match||!this.lastAimPose)return;const e=this.lastAimPose.dir,n=this.lastAimPose.pos,i=this.match.world.raycast(n.x,n.y,n.z,e.x,e.y,e.z,700,!0),s=i>0?i:300;this.marker={x:n.x+e.x*s,z:n.z+e.z*s},this.audio.ui(),this.hud.notify("Marker placed")}cycleSpectate(t){const e=this.match;if(!e)return;const n=e.players.filter(s=>s.alive&&!s.dummy&&s.mode!=="skiff");if(n.length===0)return;let i=n.findIndex(s=>s.id===this.spectateId);i=(i+t+n.length*4)%n.length,this.spectateId=n[i].id}onHumanDeath(t){const e=this.match;this.spectateDelay=2.2,this.spectateId=t>=0&&e.players[t]?.alive?t:-1,this.input.enabled=!1,this.input.overlayOpen=!1,this.input.moveWhileUnlocked=!1,this.screens.closeInventory(),this.screens.closeMap(),this.suppressPause=!0,this.input.exitLock(),setTimeout(()=>{this.suppressPause=!1},150);const n=e.players[e.humanId];this.hud.setSpectate(!0,`ELIMINATED · #${n.stats.placement}`,n.stats.killedBy?`by ${n.stats.killedBy}`:""),this.recordResult(!0)}buildResult(){const t=this.match;if(!t)return null;const e=t.players[t.humanId];if(!e)return null;const n=t.totalCount();t.winner===e.id?e.stats.placement=1:e.alive&&e.stats.placement===0&&(e.stats.placement=t.aliveCount());const s=e.stats,r=s.shots>0?Math.round(s.hits/s.shots*100):0,o=t.winner>=0?t.players[t.winner]:null;let l=0;return t.mode==="quick"&&(l=30+Math.max(0,n-s.placement)*8+s.kills*40+s.assists*10+(s.placement===1?200:0)+Math.floor(s.damageDealt/10)+Math.floor(s.surviveTime/30)*2),{placement:s.placement||1,total:n,winnerName:o?.name??"",kills:s.kills,assists:s.assists,damage:s.damageDealt,accuracy:r,survive:s.surviveTime,distance:s.distance,storm:s.stormDamage,headshots:s.headshots,killedBy:s.killedBy,loot:s.lootPicked,timeline:t.timeline,xpGain:l,mode:t.mode,route:this.route}}recordedRun=!1;recordResult(t){const e=this.match;if(!e||e.mode!=="quick"||this.recordedRun)return;const n=this.buildResult();if(!n)return;this.recordedRun=!0;const i=this.profile;i.xp+=n.xpGain,i.matches+=1,i.kills+=n.kills,n.placement===1&&(i.wins+=1),i.bestPlacement=Math.min(i.bestPlacement,n.placement),i.history.unshift({date:new Date().toISOString().slice(0,10),placement:n.placement,kills:n.kills,damage:n.damage,survive:n.survive,xp:n.xpGain,mode:"quick"}),i.history=i.history.slice(0,20),Fr(i),this.lastResult=n}lastResult=null;showResults(){const t=this.match;if(!t)return;if(t.mode==="practice"){this.leaveToMenu();return}this.recordedRun||this.recordResult(!0);const e=this.lastResult??this.buildResult();e&&(this.resultsShown=!0,this.hud.show(!1),this.state="results",this.suppressPause=!0,this.input.exitLock(),setTimeout(()=>{this.suppressPause=!1},100),this.screens.showResults(e,t,this.mapRenderer))}frame(t){requestAnimationFrame(r=>this.frame(r));const e=Math.min(.1,(t-this.last)/1e3);this.last=t,this.frameCount++,this.fpsTimer+=e,this.fps+=(1/Math.max(e,.001)-this.fps)*.05,this.settings.dynamicRes&&this.state==="playing"&&(this.fps<48?(this.lowFpsFor+=e,this.highFpsFor=0):this.fps>75?(this.highFpsFor+=e,this.lowFpsFor=0):(this.lowFpsFor=0,this.highFpsFor=0),this.lowFpsFor>1.5&&this.dynRatio>.55&&(this.dynRatio=Math.max(.55,this.dynRatio-.1),this.lowFpsFor=0,this.resize()),this.highFpsFor>4&&this.dynRatio<1&&(this.dynRatio=Math.min(1,this.dynRatio+.05),this.highFpsFor=0,this.resize()));const n=this.match;if(!n||this.state!=="playing"&&this.state!=="paused")return;const i=n.players[n.humanId],s=this.state==="paused"&&n.mode==="practice";(this.state==="playing"||this.state==="paused"&&!s)&&this.simulate(n,e),this.updateFrame(n,i,e)}simulate(t,e){const n=t.players[t.humanId],i=this.input.adsHeld()&&!!n&&n.alive;this.input.applyLook(i),this.acc+=e*(this.spectating()||t.phase==="ended"?this.fast:1)*this.debugScale;let s=0;const r=new Map;for(;this.acc>=ve&&s<12;){if(this.acc-=ve,s++,this.view.snapshot(),n&&n.alive){const o=this.input.build();this.queuedSlot>=0&&(o.slot=this.queuedSlot,this.queuedSlot=-1),this.queuedDrop&&(o.drop=!0,this.queuedDrop=!1),r.set(n.id,o)}else r.set(t.humanId,qn());t.step(r),this.processEvents(t),this.routeTimer+=ve,this.routeTimer>=1&&(this.routeTimer=0,n&&n.alive&&n.mode!=="skiff"&&this.route.push({x:n.x,z:n.z}))}this.acc>ve*12&&(this.acc=0)}processEvents(t){const e=t.drainEvents(),n=t.humanId,i=t.players[n],s=this.spectating()&&this.spectateId>=0?this.spectateId:n,r=t.players[s]??i;for(const o of e)this.view.onEvent(o),this.audioEvent(o,r,n),this.hudEvent(o,t,n,r)}rel(t,e,n){const i=e-t.x,s=n-t.z,r=Math.hypot(i,s),o=this.input.yaw,l=-Math.cos(o),c=Math.sin(o),h=r>.01?(i*l+s*c)/r:0,d=Math.atan2(i,s);let u=o-d;for(;u>Math.PI;)u-=Math.PI*2;for(;u<-Math.PI;)u+=Math.PI*2;return{pan:h,dist:r,ang:u}}audioEvent(t,e,n){const i=this.audio;switch(t.type){case"shot":{const s=this.match.players[t.pid];if(!s)break;const r=this.rel(e,s.x,s.z);t.pid===n||t.pid===e.id?i.gunshot(t.weapon,0,0,!0):i.gunshot(t.weapon,r.pan,r.dist,!1),t.pid===n&&!this.settings.reducedMotion&&(this.shake=Math.min(1,this.shake+.25));break}case"sound":{if(t.pid===e.id)break;const s=this.rel(e,t.x,t.z);if(t.kind==="footstep"&&i.footstep(s.pan,s.dist,t.loud>30),this.settings.soundIndicators){const r=t.kind==="gunshot"?150:38;s.dist<r&&s.dist>2&&this.hud.soundIndicator(s.ang,t.kind==="gunshot"?"gun":"step",this.settings.captions?`${t.kind==="gunshot"?"Gunshot":"Footsteps"} ${s.ang>.4?"← left":s.ang<-.4?"right →":"↑ ahead"} (${s.dist>80?"far":s.dist>30?"mid":"close"})`:void 0)}break}case"pickup":t.pid===n&&i.pickup(t.rarity);break;case"full":t.pid===n&&i.full();break;case"chest":{this.rel(e,t.x,t.z).dist<40&&i.chest();break}case"reload":t.pid===e.id&&i.reload();break;case"use":t.pid===e.id&&!t.done&&i.heal();break;case"explosion":{const s=this.rel(e,t.x,t.z);i.explosion(s.dist);break}case"land":t.pid===e.id&&i.land(t.speed);break;case"jump":t.pid===e.id&&i.jump();break;case"slide":t.pid===e.id&&i.slide();break;case"deploy":t.pid===e.id&&i.deploy();break;case"storm":i.stormWarn();break;case"capsule":t.stage==="incoming"&&i.capsule();break;case"kill":t.killer===n&&i.kill();break;case"beacon":t.pid===n&&i.windUse();break;case"grapple":t.pid===n&&i.windUse();break;case"projectile":t.pid===n&&i.windUse();break}}hudEvent(t,e,n,i){const s=this.hud;switch(t.type){case"hit":{if(t.attacker===n){const r=e.players[t.victim],o=r&&r.aegis+r.reserve>.5;s.hitMarker(t.killed?"kill":t.zone==="head"?"head":o||t.shieldBreak?"shield":"normal"),this.audio.hit(t.zone==="head",!!o,t.shieldBreak)}break}case"damage":{t.victim===i.id&&(t.dirX!==0||t.dirZ!==0?s.damageArc(this.input.yaw-Math.atan2(t.dirX,t.dirZ)):t.source!=="Riftstorm"&&s.damageArc(0),t.source!=="Riftstorm"&&t.source!=="Heat channel"&&this.audio.hurt(),this.settings.reducedMotion||(this.shake=Math.min(1,this.shake+t.amount*.012)));break}case"kill":{const r=t.killer>=0?e.players[t.killer]:void 0,o=e.players[t.victim];if(o.dummy)break;const l=r?`<b>${r.name}</b> eliminated ${o.name} <span style="opacity:.7">· ${t.weapon}</span>`:`${o.name} <span style="opacity:.7">· ${t.weapon}</span>`;s.addKillFeed(l,t.killer===n),t.killer===n&&s.notify(`ELIMINATED ${o.name.toUpperCase()}`,2e3),t.victim===n&&e.mode==="quick"&&this.onHumanDeath(t.killer);break}case"pickup":t.pid===n&&s.notify(t.name,1e3);break;case"full":t.pid===n&&s.notify("Inventory full — hold E to swap",1600);break;case"storm":s.notify(t.msg==="Calmfield holds"?t.msg:`${t.msg.toUpperCase()} — check the map`,3200);break;case"capsule":s.notify(t.stage==="incoming"?"SUPPLY CAPSULE INBOUND — marked on the map":"Supply capsule landed",3200);break;case"beacon":t.pid===n&&s.notify("Echo Beacon: trails revealed for 8s",2200);break;case"end":{this.endTimer=t.winner===n?3.5:.5,t.winner===n&&s.notify("VICTORY — last one standing!",4e3);break}}}updateFrame(t,e,n){const i=this.spectating(),s=i?t.players[this.spectateId]&&t.players[this.spectateId].alive?t.players[this.spectateId]:null:e;if(i){if(this.spectateDelay>0&&(this.spectateDelay-=n),(!s||!s.alive)&&this.spectateDelay<=0){const y=t.players.filter(S=>S.alive&&!S.dummy&&S.mode!=="skiff");y.length&&(this.spectateId=y[0].id)}t.phase==="ended"&&this.endTimer<0&&(this.endTimer=.5)}const r=s??e,o=this.acc/ve,l=this.view.interp(r,o),c=i?r.yaw:this.input.yaw,h=i?r.pitch:this.input.pitch,d=this.settings.reducedMotion?.2:1,u=this.view.poseFor(r,l,c,h,d);this.shake=Math.max(0,this.shake-n*3),this.shake>.01&&!this.settings.reducedMotion&&(u.pos.x+=(Math.random()-.5)*.04*this.shake,u.pos.y+=(Math.random()-.5)*.04*this.shake),this.lastAimPose=u;const p=!i&&e.alive?t.focusFor(e):null;if(this.view.render(n,o,-1,u,p&&p.kind==="loot"?p.id:-1,t.humanId,l),this.settings.reducedMotion&&!i){const y=Ta(t.world,{...r,x:l.x,y:l.y,z:l.z,yaw:c,pitch:h},2.3),S=this.view.worldPointToScreen(y.pos.x+y.dir.x*60,y.pos.y+y.dir.y*60,y.pos.z+y.dir.z*60);this.hud.setCrosshair(S.x,S.y)}else this.hud.setCrosshair(.5,.5);const g=t.storm,v=t.mode==="quick"&&g.phase>=1&&t.phase!=="staging"&&Math.hypot(r.x-g.cx,r.z-g.cz)>g.r&&r.alive&&r.mode!=="skiff";this.storming=v,this.fpsTimer>.05,this.hud.update({match:t,human:e,view:r,spectating:i,focus:p,interactHold:e.interactHold,swapPending:e.swapPending,yaw:c,marker:this.marker,settings:this.settings,fps:this.fps,adsT:r.adsT,stormOutside:v,trails:t.beaconTrails(e),canLeave:!0},n),this.hud.setSpectate(i,i?`${t.players[t.humanId].stats.placement?"#"+t.players[t.humanId].stats.placement:""} ELIMINATED`:"",i?`Spectating ${s?s.name:"…"} · ${t.aliveCount()} remaining${t.players[t.humanId].stats.killedBy?" · eliminated by "+t.players[t.humanId].stats.killedBy:""}`:"");const f=r.mode==="freefall"||r.mode==="glide"?1:0;this.audio.setAmbience(f,v?1:0);const m=t.mode==="quick"?Math.min(1,Math.max(0,(t.storm.phase-1)/5)):0;this.audio.tickMusic(n,m),this.endTimer>=0&&(this.endTimer-=n,this.endTimer<=0&&!this.resultsShown&&t.mode==="quick"&&(this.endTimer=-1,this.showResults()))}}function hv(){try{return!!document.createElement("canvas").getContext("webgl2")}catch{return!1}}function Nc(a,t){const e=document.getElementById("app");e.innerHTML=`<div class="screen menu-bg"><div class="panel error-card"><h2>${a}</h2><p style="font-size:16px;line-height:1.6">${t}</p></div></div>`}const dv=document.getElementById("app"),uv=document.getElementById("view");if(!hv())Nc("WebGL 2 is required","Skybreak renders with WebGL 2. Please use a recent desktop Chrome or Edge with hardware acceleration enabled, then reload this page.");else try{const a=new cv(uv,dv);a.boot(),window.__skybreak=a,window.addEventListener("webglcontextlost",t=>{t.preventDefault(),a.screens.showError("Graphics context lost","The browser reset the GPU context. Reload the page to continue.",[{label:"Reload",fn:()=>location.reload()}])})}catch(a){console.error(a),Nc("Skybreak could not start",`Something went wrong while starting the game: ${a.message}`)}
