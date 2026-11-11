(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=e=>440*2**((e-69)/12),t=class{ctx=null;master;musicBus;sfxBus;engBus;noiseBuf;osc1;osc2;engFilter;engGain;whine;whineGain;squeal;squealGain;squealFilter;wind;windGain;surf;surfGain;vols={master:.8,music:.55,sfx:.9};musicMode=`off`;nextBeat=0;step16=0;timer=null;intensity=0;duck=1;lastClock=99;rpmSmooth=900;start(){if(this.ctx){this.ctx.resume();return}let e=window.AudioContext||window.webkitAudioContext;if(!e)return;let t=new e;this.ctx=t;let n=t.createDynamicsCompressor();n.threshold.value=-14,n.ratio.value=4,this.master=t.createGain(),this.master.connect(n).connect(t.destination),this.musicBus=t.createGain(),this.musicBus.connect(this.master),this.sfxBus=t.createGain(),this.sfxBus.connect(this.master),this.engBus=t.createGain(),this.engBus.connect(this.master),this.applyVolumes();let r=t.sampleRate*2;this.noiseBuf=t.createBuffer(1,r,t.sampleRate);let i=this.noiseBuf.getChannelData(0);for(let e=0;e<r;e++)i[e]=Math.random()*2-1;this.buildEngine(),this.timer=window.setInterval(()=>this.schedule(),30)}setVolumes(e,t,n){this.vols={master:e,music:t,sfx:n},this.applyVolumes()}applyVolumes(){if(!this.ctx)return;let e=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.vols.master,e,.05),this.musicBus.gain.setTargetAtTime(this.vols.music*.5*this.duck,e,.05),this.sfxBus.gain.setTargetAtTime(this.vols.sfx,e,.05),this.engBus.gain.setTargetAtTime(this.vols.sfx*.6,e,.05)}noise(e=!0){let t=this.ctx.createBufferSource();return t.buffer=this.noiseBuf,t.loop=e,t}buildEngine(){let e=this.ctx;this.osc1=e.createOscillator(),this.osc1.type=`sawtooth`,this.osc2=e.createOscillator(),this.osc2.type=`square`,this.engFilter=e.createBiquadFilter(),this.engFilter.type=`lowpass`,this.engFilter.Q.value=2,this.engGain=e.createGain(),this.engGain.gain.value=0;let t=e.createGain();t.gain.value=.45,this.osc1.connect(this.engFilter),this.osc2.connect(t).connect(this.engFilter),this.engFilter.connect(this.engGain).connect(this.engBus),this.osc1.start(),this.osc2.start(),this.whine=e.createOscillator(),this.whine.type=`triangle`,this.whineGain=e.createGain(),this.whineGain.gain.value=0,this.whine.connect(this.whineGain).connect(this.engBus),this.whine.start(),this.squeal=this.noise(),this.squealFilter=e.createBiquadFilter(),this.squealFilter.type=`bandpass`,this.squealFilter.frequency.value=1900,this.squealFilter.Q.value=5,this.squealGain=e.createGain(),this.squealGain.gain.value=0,this.squeal.connect(this.squealFilter).connect(this.squealGain).connect(this.engBus),this.squeal.start(),this.wind=this.noise();let n=e.createBiquadFilter();n.type=`lowpass`,n.frequency.value=900,this.windGain=e.createGain(),this.windGain.gain.value=0,this.wind.connect(n).connect(this.windGain).connect(this.engBus),this.wind.start(),this.surf=this.noise();let r=e.createBiquadFilter();r.type=`lowpass`,r.frequency.value=600,this.surfGain=e.createGain(),this.surfGain.gain.value=0,this.surf.connect(r).connect(this.surfGain).connect(this.sfxBus),this.surf.start()}update(e,t,n){let r=this.ctx;if(!r)return;let i=r.currentTime;if(this.duck+=(1-this.duck)*Math.min(1,t*2.5),this.musicBus.gain.setTargetAtTime(this.vols.music*.5*this.duck,i,.08),!e||!n){this.engGain.gain.setTargetAtTime(0,i,.1),this.whineGain.gain.setTargetAtTime(0,i,.1),this.squealGain.gain.setTargetAtTime(0,i,.05),this.windGain.gain.setTargetAtTime(0,i,.1),this.surfGain.gain.setTargetAtTime(.05,i,.3);return}let a=e.vehicle,o=a.speed*3.6,s=Math.min(5,Math.floor(o/34)),c=o<3?900+(e.phase,0):1300+(o-s*34)/34*5200,l=e.phase===`running`?a.fwd<0?.5:1:0;this.rpmSmooth+=(c-this.rpmSmooth)*Math.min(1,t*9);let u=this.rpmSmooth/60,d=e.spec.id===`gull`?1.15:e.spec.id===`tempest`?.82:1;this.osc1.frequency.setTargetAtTime(u*d,i,.03),this.osc2.frequency.setTargetAtTime(u*d*.5,i,.03),this.engFilter.frequency.setTargetAtTime(500+this.rpmSmooth*.55,i,.05),this.engGain.gain.setTargetAtTime(.1+.13*Math.min(1,o/40)*l+(a.boosting?.06:0),i,.05),this.whine.frequency.setTargetAtTime(600+o*14,i,.05),this.whineGain.gain.setTargetAtTime(a.boosting?.07:Math.min(.025,o*18e-5),i,.05);let f=!a.airborne&&a.speed>7?Math.min(1,Math.max(0,(Math.abs(a.slip)-.14)*3.2)):0;this.squealGain.gain.setTargetAtTime(f*.16,i,.04),this.squealFilter.frequency.setTargetAtTime(1500+f*900+(a.surface===`sand`?-600:0),i,.05),this.windGain.gain.setTargetAtTime(Math.min(.2,o/170*(o/170)*.28),i,.1),e.world;let p=Math.max(0,1-Math.min(Math.abs(a.x-940)/260,Math.abs(a.z-662)/260));this.surfGain.gain.setTargetAtTime(.03+p*.22,i,.4),this.intensity=Math.min(1,.25+e.score.tier*.22+(e.clock<12&&e.mode!==`trial`?.3:0))}tone(e,t,n=`sine`,r=.2,i=0,a=null,o){let s=this.ctx;if(!s)return;let c=s.createOscillator(),l=s.createGain(),u=s.currentTime+i;c.type=n,c.frequency.setValueAtTime(e,u),o&&c.frequency.exponentialRampToValueAtTime(o,u+t),l.gain.setValueAtTime(1e-4,u),l.gain.exponentialRampToValueAtTime(r,u+.012),l.gain.exponentialRampToValueAtTime(1e-4,u+t),c.connect(l).connect(a??this.sfxBus),c.start(u),c.stop(u+t+.05)}burst(e,t,n,r,i=`bandpass`,a){let o=this.ctx;if(!o)return;let s=this.noise(!1),c=o.createBiquadFilter();c.type=i,c.Q.value=n;let l=o.createGain(),u=o.currentTime;c.frequency.setValueAtTime(t,u),a&&c.frequency.exponentialRampToValueAtTime(a,u+e),l.gain.setValueAtTime(r,u),l.gain.exponentialRampToValueAtTime(1e-4,u+e),s.connect(c).connect(l).connect(this.sfxBus),s.start(u,Math.random()),s.stop(u+e+.05)}duckMusic(e=.45){this.duck=Math.min(this.duck,e)}onEvent(t){if(this.ctx)switch(t.type){case`countdown`:this.tone(520,.18,`square`,.14);break;case`go`:this.tone(780,.35,`square`,.18),this.tone(1170,.4,`triangle`,.14,.02);break;case`style`:{let n=Math.min(5,Math.round(Math.log2(Math.max(1,t.mult))*2));this.tone(e(76+n*2),.14,`triangle`,.16),this.tone(e(83+n*2),.18,`sine`,.1,.05),(t.category===`nearMiss`||t.category===`needle`)&&this.burst(.22,1800,1,.07,`bandpass`,500);break}case`bank`:this.tone(e(84),.12,`sine`,.12),this.tone(e(91),.2,`sine`,.12,.08);break;case`chainLoss`:this.tone(220,.3,`sawtooth`,.12,0,null,90);break;case`boarded`:[72,76,79,84].forEach((t,n)=>this.tone(e(t),.18,`triangle`,.15,n*.06));break;case`delivered`:{let n=t.breakdown.grade;(n===`blazing`?[72,76,79,84,88,91]:n===`fast`?[72,76,79,84]:n===`close`?[72,76,79]:[72,70]).forEach((t,n)=>{this.tone(e(t),.22,`square`,.1,n*.07),this.tone(e(t+12),.26,`sine`,.1,n*.07)}),this.burst(.5,3e3,.7,.05,`highpass`);break}case`fareFailed`:this.tone(300,.5,`sawtooth`,.14,0,null,110);break;case`collision`:{let e=Math.min(1,t.impact/20);this.burst(.18+e*.25,900,.8,.12+e*.28,`lowpass`,120),this.tone(95,.22,`sine`,.2+e*.25,0,null,38),t.impact>6&&this.duckMusic(.5);break}case`boost`:t.on&&(this.burst(.7,400,1.4,.16,`bandpass`,3800),this.tone(220,.5,`sawtooth`,.08,0,null,880));break;case`tailwindReady`:this.tone(e(86),.2,`sine`,.14),this.tone(e(93),.3,`sine`,.1,.1);break;case`token`:this.tone(e(t.kind===`spark`?91:86),.14,`triangle`,.16),this.tone(e(98),.2,`sine`,.1,.07);break;case`shortcut`:[76,81,85,88].forEach((t,n)=>this.tone(e(t),.12,`square`,.09,n*.05));break;case`timeAdd`:this.tone(e(79),.1,`triangle`,.12),this.tone(e(86),.16,`triangle`,.12,.08);break;case`clockTick`:this.tone(t.n<=3?880:660,.08,`square`,t.n<=3?.14:.08);break;case`honk`:this.tone(330,.28,`square`,.1),this.tone(415,.28,`square`,.08);break;case`respawn`:this.burst(.5,3e3,1,.1,`highpass`),this.tone(500,.3,`sine`,.12,0,null,150);break;case`ended`:this.tone(e(60),.6,`sawtooth`,.1),this.tone(e(64),.6,`sawtooth`,.08,.05),this.tone(e(67),.7,`sawtooth`,.08,.1),this.duckMusic(.4);break;case`bark`:{let e=260+t.who.length%7*36,n=Math.min(6,2+Math.floor(t.text.length/8));for(let t=0;t<n;t++)this.tone(e*(1+t*5%4*.12),.07,`triangle`,.07,t*.07);this.duckMusic(.7);break}case`vehicle`:{let n=t.ev;n.type===`surge`&&this.burst(.35,500,1.2,.14,`bandpass`,2500),n.type===`snapDrift`&&this.burst(.3,2200,3,.12,`bandpass`,1200),n.type===`gripTurn`&&(this.tone(e(79),.1,`square`,.1),this.tone(e(84),.12,`square`,.1,.06)),n.type===`landing`&&(this.tone(80,.2,`sine`,.2,0,null,45),this.burst(.2,700,.8,.12,`lowpass`,150)),n.type===`takeoff`&&this.burst(.3,600,1,.08,`bandpass`,2400);break}}}uiClick(){this.tone(660,.06,`triangle`,.12),this.tone(990,.07,`triangle`,.08,.04)}uiBack(){this.tone(440,.08,`triangle`,.1)}rankSting(t){let n=t===`S`?72:t===`A`?69:t===`B`?67:64;[0,4,7,12,t===`S`?16:12].forEach((t,r)=>this.tone(e(n+t),.4,`square`,.09,r*.1))}setMusic(e){e!==this.musicMode&&(this.musicMode=e,this.ctx&&(this.nextBeat=this.ctx.currentTime+.1,this.step16=0))}schedule(){let e=this.ctx;if(!e||this.musicMode===`off`)return;let t=60/(this.musicMode===`menu`?104:128+this.intensity*8)/4;for(;this.nextBeat<e.currentTime+.14;)this.playStep(this.step16,this.nextBeat),this.nextBeat+=t,this.step16=(this.step16+1)%64}mtone(e,t,n,r,i,a=6e3){let o=this.ctx,s=o.createOscillator(),c=o.createGain(),l=o.createBiquadFilter();s.type=r,s.frequency.value=e,l.type=`lowpass`,l.frequency.value=a,c.gain.setValueAtTime(1e-4,t),c.gain.exponentialRampToValueAtTime(i,t+.01),c.gain.exponentialRampToValueAtTime(1e-4,t+n),s.connect(l).connect(c).connect(this.musicBus),s.start(t),s.stop(t+n+.05)}mnoise(e,t,n,r,i,a=1){let o=this.ctx,s=this.noise(!1),c=o.createBiquadFilter();c.type=r,c.frequency.value=n,c.Q.value=a;let l=o.createGain();l.gain.setValueAtTime(i,e),l.gain.exponentialRampToValueAtTime(1e-4,e+t),s.connect(c).connect(l).connect(this.musicBus),s.start(e,Math.random()),s.stop(e+t+.05)}playStep(t,n){let r=this.ctx,i=Math.floor(t/16)%4,a=t%16,o=this.musicMode===`menu`,s=[50,46,53,48],c=[[0,3,7],[0,4,7],[0,4,7],[0,4,7]],l=s[i],u=this.intensity;if(o)a%8==0&&this.mnoise(n,1.4,900,`lowpass`,.07);else{if(a%4==0){let e=r.createOscillator(),t=r.createGain();e.frequency.setValueAtTime(150,n),e.frequency.exponentialRampToValueAtTime(45,n+.14),t.gain.setValueAtTime(.55,n),t.gain.exponentialRampToValueAtTime(1e-4,n+.2),e.connect(t).connect(this.musicBus),e.start(n),e.stop(n+.25)}(a===4||a===12)&&this.mnoise(n,.13,1800,`bandpass`,.35,.8),a%2==0&&this.mnoise(n,.04,8e3,`highpass`,.12+(a%4==2?.05:0)),(a===7||a===10||u>.6&&a===15)&&this.mnoise(n,.06,6e3,`highpass`,.09),a===0&&this.mnoise(n,.9,1400,`bandpass`,.07,.4)}let d=[0,-1,-1,0,-1,7,-1,-1,0,-1,12,-1,5,-1,7,-1][a];d>=0&&!o&&this.mtone(e(l-12+d),n,.2,`sawtooth`,.22,520+u*600);let f=[0,1,2,1,2,1,0,2][a%8],p=c[i];if((a%2==0||u>.5)&&this.mtone(e(l+12+p[f]+(a>=8?12:0)),n,.14,`square`,o?.05:.06,3200),!o&&(a===0||a===6||a===10)&&(i%2==0||u>.4))for(let t of p)this.mtone(e(l+12+t),n,.22,`sawtooth`,.045+u*.03,2400);if(!o&&i===3&&u>.45&&a%4==2&&this.mtone(e(l+24+[0,3,7,5][a/4|0]),n,.18,`triangle`,.08,5e3),o&&a%16==0)for(let t of p)this.mtone(e(l+12+t),n,1.4,`triangle`,.05,1800)}},n=Math.PI*2,r=(e,t,n)=>e<t?t:e>n?n:e,i=e=>r(e,0,1);function a(e){for(;e>Math.PI;)e-=n;for(;e<-Math.PI;)e+=n;return e}var o=(e,t,n,r)=>t+(e-t)*Math.exp(-n*r),s=(e,t,n,r)=>{let i=e-n,a=t-r;return i*i+a*a},c=(e,t,n,r)=>Math.sqrt(s(e,t,n,r));function l(e,t,n,i,a,o){let s=a-n,l=o-i,u=s*s+l*l,d=u===0?0:r(((e-n)*s+(t-i)*l)/u,0,1);return c(e,t,n+s*d,i+l*d)}var u=class{stuck=0;reverse=0;lock=null;stuckEvents=0;resetFrames=0;lastStuckAt=-99;next(e){let t=e.vehicle,n={throttle:0,brake:0,steer:0,handbrake:!1,boost:!1,resetHeld:!1};if(e.phase!==`running`)return n;let i=t.x,o=t.z,s=3,c=!1,l=e.trip,u=null;if(l)u=l.fare.dest.point,i=l.fare.dest.x,o=l.fare.dest.z,s=l.fare.dest.radius*.5;else{let n=e.fares.candidates.find(e=>e.id===this.lock)??null;if(!n){let r=1e9;for(let i of e.fares.candidates){let e=Math.hypot(i.pickup.x-t.x,i.pickup.z-t.z);e<r&&(r=e,n=i)}this.lock=n?n.id:null}n&&(u=n.pickup,i=n.pickup.x,o=n.pickup.z),s=1.5}let d=Math.hypot(i-t.x,o-t.z),f=i,p=o;if(u&&d>42){let n=e.world.nextHop(t.x,t.z,u),r=Math.hypot(n.x-t.x,n.z-t.z)||1,i=(n.x-t.x)/r,a=(n.z-t.z)/r,o=Math.abs(i)>Math.abs(a),s=o?0:-Math.sign(a),c=o?Math.sign(i):0;f=n.x+s*4.2,p=n.z+c*4.2}else c=!0;let m=a(Math.atan2(f-t.x,p-t.z)-t.h);n.steer=r(-m*2.4,-1,1);let h=Math.hypot(f-t.x,p-t.z),g=22;Math.abs(m)>.4&&(g=8),Math.abs(m)>.9&&(g=5),!c&&h<40&&Math.abs(m)>.2&&(g=7),c&&(g=r(Math.sqrt(Math.max(0,d-s))*2.6,0,22)),c&&d<s&&(g=0);let _=t.fwd;return this.resetFrames>0?(this.resetFrames--,n.resetHeld=!0,n):this.reverse>0?(this.reverse-=1/60,n.brake=1,n.steer=-n.steer,n):(_<g-1?n.throttle=1:_>g+2&&(n.brake=r((_-g)/8,.2,1)),g===0&&_<3&&(n.brake=1),e.score.tailwind>.9&&Math.abs(m)<.1&&!c&&_>15&&(n.boost=!0),t.speed<.6&&g>3?this.stuck+=1/60:this.stuck=0,this.stuck>1.5&&(this.reverse=1.3,this.stuck=0,this.stuckEvents=e.time-this.lastStuckAt<14?this.stuckEvents+1:1,this.lastStuckAt=e.time,this.stuckEvents>=3&&(this.resetFrames=75,this.stuckEvents=0)),n)}},d=class{keys=new Set;pressed=new Set;pad=null;padPrev=[];deadzone=.15;padConnected=!1;onDisconnect=null;lookBack=!1;enabled=!0;constructor(){window.addEventListener(`keydown`,e=>{this.enabled&&([`Space`,`ArrowUp`,`ArrowDown`,`ArrowLeft`,`ArrowRight`,`Tab`].includes(e.code)&&e.preventDefault(),e.repeat||this.pressed.add(e.code),this.keys.add(e.code))}),window.addEventListener(`keyup`,e=>this.keys.delete(e.code)),window.addEventListener(`blur`,()=>this.keys.clear()),window.addEventListener(`gamepadconnected`,()=>{this.padConnected=!0}),window.addEventListener(`gamepaddisconnected`,()=>{this.padConnected=!1,this.onDisconnect?.()})}setEnabled(e){this.enabled=e,e||this.keys.clear()}down(...e){return e.some(e=>this.keys.has(e))}readPad(){let e=navigator.getGamepads?navigator.getGamepads():[];for(let t of e)if(t&&t.connected)return t;return null}read(){let e=+!!this.down(`KeyW`,`ArrowUp`),t=+!!this.down(`KeyS`,`ArrowDown`),n=+!!this.down(`KeyD`,`ArrowRight`)-!!this.down(`KeyA`,`ArrowLeft`),r=this.down(`Space`),i=this.down(`ShiftLeft`,`ShiftRight`),a=this.down(`KeyR`);this.lookBack=this.down(`KeyX`);let o=this.readPad();if(this.pad=o,o){this.padConnected=!0;let a=this.deadzone,s=o.axes[0]??0,c=Math.abs(s)<a?0:Math.sign(s)*((Math.abs(s)-a)/(1-a));c!==0&&(n=c);let l=o.buttons[7]?.value??0,u=o.buttons[6]?.value??0;l>.05&&(e=Math.max(e,l)),u>.05&&(t=Math.max(t,u)),o.buttons[0]?.pressed&&(r=!0),o.buttons[1]?.pressed&&(i=!0),o.buttons[3]?.pressed&&(this.lookBack=!0)}return{throttle:e,brake:t,steer:n,handbrake:r,boost:i,resetHeld:a}}takeActions(){let e={pause:this.pressed.has(`Escape`)||this.pressed.has(`KeyP`),camera:this.pressed.has(`KeyC`),map:this.pressed.has(`KeyM`),restart:!1};if(this.pad){let t=this.pad.buttons.map(e=>e.pressed),n=e=>!!t[e]&&!this.padPrev[e];n(9)&&(e.pause=!0),(n(8)||n(14))&&(e.map=!0),(n(12)||n(13))&&(e.camera=!0),this.padPrev=t}return this.pressed.clear(),e}wasPressed(e){return this.pressed.has(e)}clearPressed(){this.pressed.clear()}},f={master:.8,music:.55,sfx:.9,shadows:!0,resolution:1,dynamicRes:!0,reducedMotion:!1,shake:1,fov:78,hudScale:1,subtitles:!0,guidance:`route`,crowd:!0,colorblind:!1,deadzone:.15,photosensitive:!1},p=`farestorm.save`,m=2;function h(){return{version:m,settings:{...f},taxi:`breaker`,color:0,traffic:`normal`,records:{},trialBest:null,trialMedal:null,discovered:[],tutorialSeen:!1,totalFares:0}}function g(e){let t=h(),n={...t,...e,settings:{...t.settings,...e.settings??{}},version:m};return n.records||={},n}var _=null;function v(){if(_)return _;try{let e=localStorage.getItem(p);if(e)return _=g(JSON.parse(e)),_}catch{try{localStorage.removeItem(p)}catch{}}return _=h(),_}function y(){if(_)try{localStorage.setItem(p,JSON.stringify(_))}catch{}}function b(e,t,n,r,i){let a=v(),o=a.records[e]??{best:0,bestChain:0,deliveries:0,rank:`D`,runs:0},s=t>o.best;return a.records[e]={best:Math.max(o.best,t),bestChain:Math.max(o.bestChain,n),deliveries:Math.max(o.deliveries,r),rank:s?i:o.rank,runs:o.runs+1},y(),{newBest:s}}var x=1e3,S=1001,C=1002,w=1003,T=1004,E=1005,D=1006,O=1007,k=1008,A=1009,j=1010,ee=1011,M=1012,N=1013,P=1014,F=1015,te=1016,ne=1017,re=1018,ie=1020,ae=35902,oe=1021,I=1022,se=1023,ce=1024,le=1025,ue=1026,de=1027,fe=1028,pe=1029,me=1030,L=1031,he=1033,R=33776,ge=33777,z=33778,_e=33779,B=35840,V=35841,ve=35842,ye=35843,be=36196,xe=37492,Se=37496,Ce=37808,we=37809,Te=37810,Ee=37811,De=37812,Oe=37813,ke=37814,Ae=37815,je=37816,Me=37817,Ne=37818,Pe=37819,Fe=37820,Ie=37821,Le=36492,Re=36494,ze=36495,Be=36283,Ve=36284,He=36285,Ue=36286,We=2300,Ge=2301,Ke=2302,qe=2400,Je=2401,Ye=2402,Xe=3200,Ze=3201,Qe=`srgb`,$e=`srgb-linear`,et=`linear`,tt=`srgb`,nt=7680,rt=35044,it=2e3,at=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let n=this._listeners[e];if(n!==void 0){let e=n.indexOf(t);e!==-1&&n.splice(e,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let t=this._listeners[e.type];if(t!==void 0){e.target=this;let n=t.slice(0);for(let t=0,r=n.length;t<r;t++)n[t].call(this,e);e.target=null}}},ot=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),st=Math.PI/180,ct=180/Math.PI;function lt(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(ot[e&255]+ot[e>>8&255]+ot[e>>16&255]+ot[e>>24&255]+`-`+ot[t&255]+ot[t>>8&255]+`-`+ot[t>>16&15|64]+ot[t>>24&255]+`-`+ot[n&63|128]+ot[n>>8&255]+`-`+ot[n>>16&255]+ot[n>>24&255]+ot[r&255]+ot[r>>8&255]+ot[r>>16&255]+ot[r>>24&255]).toLowerCase()}function ut(e,t,n){return Math.max(t,Math.min(n,e))}function dt(e,t){return(e%t+t)%t}function ft(e,t,n){return(1-n)*e+n*t}function pt(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw Error(`Invalid component type.`)}}function H(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw Error(`Invalid component type.`)}}var U=class e{constructor(t=0,n=0){e.prototype.isVector2=!0,this.x=t,this.y=n}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ut(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},W=class e{constructor(t,n,r,i,a,o,s,c,l){e.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,n,r,i,a,o,s,c,l)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(mt.makeScale(e,t)),this}rotate(e){return this.premultiply(mt.makeRotation(-e)),this}translate(e,t){return this.premultiply(mt.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},mt=new W;function ht(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function gt(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function _t(){let e=gt(`canvas`);return e.style.display=`block`,e}var vt={};function yt(e){e in vt||(vt[e]=!0,console.warn(e))}function bt(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}function xt(e){let t=e.elements;t[2]=.5*t[2]+.5*t[3],t[6]=.5*t[6]+.5*t[7],t[10]=.5*t[10]+.5*t[11],t[14]=.5*t[14]+.5*t[15]}function St(e){let t=e.elements;t[11]===-1?(t[10]=-t[10]-1,t[14]=-t[14]):(t[10]=-t[10],t[14]=-t[14]+1)}var G={enabled:!0,workingColorSpace:$e,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=Ct(e.r),e.g=Ct(e.g),e.b=Ct(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=wt(e.r),e.g=wt(e.g),e.b=wt(e.b))),e},fromWorkingColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},toWorkingColorSpace:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?et:this.spaces[e].transfer},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace}};function Ct(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function wt(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var Tt=[.64,.33,.3,.6,.15,.06],Et=[.2126,.7152,.0722],Dt=[.3127,.329],Ot=new W().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),kt=new W().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);G.define({[$e]:{primaries:Tt,whitePoint:Dt,transfer:et,toXYZ:Ot,fromXYZ:kt,luminanceCoefficients:Et,workingColorSpaceConfig:{unpackColorSpace:Qe},outputColorSpaceConfig:{drawingBufferColorSpace:Qe}},[Qe]:{primaries:Tt,whitePoint:Dt,transfer:tt,toXYZ:Ot,fromXYZ:kt,luminanceCoefficients:Et,outputColorSpaceConfig:{drawingBufferColorSpace:Qe}}});var At,jt=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{At===void 0&&(At=gt(`canvas`)),At.width=e.width,At.height=e.height;let n=At.getContext(`2d`);e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=At}return t.width>2048||t.height>2048?(console.warn(`THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons`,e),t.toDataURL(`image/jpeg`,.6)):t.toDataURL(`image/png`)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=gt(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Ct(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Ct(t[e]/255)*255):t[e]=Ct(t[e]);return{data:t,width:e.width,height:e.height}}return console.warn(`THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Mt=0,Nt=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Mt++}),this.uuid=lt(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Pt(r[t].image)):e.push(Pt(r[t]))}else e=Pt(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Pt(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?jt.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(console.warn(`THREE.Texture: Unable to serialize Texture.`),{})}var Ft=0,It=class e extends at{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=S,i=S,a=D,o=k,s=se,c=A,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Ft++}),this.uuid=lt(),this.name=``,this.source=new Nt(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new U(0,0),this.repeat=new U(1,1),this.center=new U(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new W,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case x:e.x-=Math.floor(e.x);break;case S:e.x=e.x<0?0:1;break;case C:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case x:e.y-=Math.floor(e.y);break;case S:e.y=e.y<0?0:1;break;case C:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};It.DEFAULT_IMAGE=null,It.DEFAULT_MAPPING=300,It.DEFAULT_ANISOTROPY=1;var Lt=class e{constructor(t=0,n=0,r=0,i=1){e.prototype.isVector4=!0,this.x=t,this.y=n,this.z=r,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Rt=class extends at{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new Lt(0,0,e,t),this.scissorTest=!1,this.viewport=new Lt(0,0,e,t);let r={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:D,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let i=new It(r,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);i.flipY=!1,i.generateMipmaps=n.generateMipmaps,i.internalFormat=n.internalFormat,this.textures=[];let a=n.count;for(let e=0;e<a;e++)this.textures[e]=i.clone(),this.textures[e].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++)this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new Nt(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:`dispose`})}},zt=class extends Rt{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Bt=class extends It{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=w,this.minFilter=w,this.wrapR=S,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Vt=class extends It{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=w,this.minFilter=w,this.wrapR=S,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},Ht=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(o===0)e[t+0]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u;else if(o===1)e[t+0]=d,e[t+1]=f,e[t+2]=p,e[t+3]=m;else{if(u!==m||s!==d||c!==f||l!==p){let e=1-o,t=s*d+c*f+l*p+u*m,n=t>=0?1:-1,r=1-t*t;if(r>2**-52){let i=Math.sqrt(r),a=Math.atan2(i,t*n);e=Math.sin(e*a)/i,o=Math.sin(o*a)/i}let i=o*n;if(s=s*e+d*i,c=c*e+f*i,l=l*e+p*i,u=u*e+m*i,e===1-o){let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:console.warn(`THREE.Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<2**-52?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(ut(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,r=this._y,i=this._z,a=this._w,o=a*e._w+n*e._x+r*e._y+i*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=r,this._z=i,this;let s=1-o*o;if(s<=2**-52){let e=1-t;return this._w=e*a+t*this._w,this._x=e*n+t*this._x,this._y=e*r+t*this._y,this._z=e*i+t*this._z,this.normalize(),this}let c=Math.sqrt(s),l=Math.atan2(c,o),u=Math.sin((1-t)*l)/c,d=Math.sin(t*l)/c;return this._w=a*u+this._w*d,this._x=n*u+this._x*d,this._y=r*u+this._y*d,this._z=i*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},K=class e{constructor(t=0,n=0,r=0){e.prototype.isVector3=!0,this.x=t,this.y=n,this.z=r}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Wt.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Wt.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Ut.copy(this).projectOnVector(e),this.sub(Ut)}reflect(e){return this.sub(Ut.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(ut(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ut=new K,Wt=new Ht,Gt=class{constructor(e=new K(1/0,1/0,1/0),t=new K(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(qt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(qt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=qt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,qt):qt.fromBufferAttribute(r,t),qt.applyMatrix4(e.matrixWorld),this.expandByPoint(qt);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),Jt.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),Jt.copy(e.boundingBox)),Jt.applyMatrix4(e.matrixWorld),this.union(Jt)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,qt),qt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(tn),nn.subVectors(this.max,tn),Yt.subVectors(e.a,tn),Xt.subVectors(e.b,tn),Zt.subVectors(e.c,tn),Qt.subVectors(Xt,Yt),$t.subVectors(Zt,Xt),en.subVectors(Yt,Zt);let t=[0,-Qt.z,Qt.y,0,-$t.z,$t.y,0,-en.z,en.y,Qt.z,0,-Qt.x,$t.z,0,-$t.x,en.z,0,-en.x,-Qt.y,Qt.x,0,-$t.y,$t.x,0,-en.y,en.x,0];return!on(t,Yt,Xt,Zt,nn)||(t=[1,0,0,0,1,0,0,0,1],!on(t,Yt,Xt,Zt,nn))?!1:(rn.crossVectors(Qt,$t),t=[rn.x,rn.y,rn.z],on(t,Yt,Xt,Zt,nn))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,qt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(qt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(Kt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Kt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Kt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Kt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Kt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Kt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Kt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Kt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Kt)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Kt=[new K,new K,new K,new K,new K,new K,new K,new K],qt=new K,Jt=new Gt,Yt=new K,Xt=new K,Zt=new K,Qt=new K,$t=new K,en=new K,tn=new K,nn=new K,rn=new K,an=new K;function on(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){an.fromArray(e,a);let o=i.x*Math.abs(an.x)+i.y*Math.abs(an.y)+i.z*Math.abs(an.z),s=t.dot(an),c=n.dot(an),l=r.dot(an);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var sn=new Gt,cn=new K,ln=new K,un=class{constructor(e=new K,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?sn.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;cn.subVectors(e,this.center);let t=cn.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(cn,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ln.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(cn.copy(e.center).add(ln)),this.expandByPoint(cn.copy(e.center).sub(ln))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},dn=new K,fn=new K,pn=new K,mn=new K,hn=new K,gn=new K,_n=new K,vn=class{constructor(e=new K,t=new K(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,dn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=dn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(dn.copy(this.origin).addScaledVector(this.direction,t),dn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){fn.copy(e).add(t).multiplyScalar(.5),pn.copy(t).sub(e).normalize(),mn.copy(this.origin).sub(fn);let i=e.distanceTo(t)*.5,a=-this.direction.dot(pn),o=mn.dot(this.direction),s=-mn.dot(pn),c=mn.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(fn).addScaledVector(pn,d),f}intersectSphere(e,t){dn.subVectors(e.center,this.origin);let n=dn.dot(this.direction),r=dn.dot(dn)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,dn)!==null}intersectTriangle(e,t,n,r,i){hn.subVectors(t,e),gn.subVectors(n,e),_n.crossVectors(hn,gn);let a=this.direction.dot(_n),o;if(a>0){if(r)return null;o=1}else if(a<0)o=-1,a=-a;else return null;mn.subVectors(this.origin,e);let s=o*this.direction.dot(gn.crossVectors(mn,gn));if(s<0)return null;let c=o*this.direction.dot(hn.cross(mn));if(c<0||s+c>a)return null;let l=-o*mn.dot(_n);return l<0?null:this.at(l/a,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},q=class e{constructor(t,n,r,i,a,o,s,c,l,u,d,f,p,m,h,g){e.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,n,r,i,a,o,s,c,l,u,d,f,p,m,h,g)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,r=1/yn.setFromMatrixColumn(e,0).length(),i=1/yn.setFromMatrixColumn(e,1).length(),a=1/yn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(xn,e,Sn)}lookAt(e,t,n){let r=this.elements;return Tn.subVectors(e,t),Tn.lengthSq()===0&&(Tn.z=1),Tn.normalize(),Cn.crossVectors(n,Tn),Cn.lengthSq()===0&&(Math.abs(n.z)===1?Tn.x+=1e-4:Tn.z+=1e-4,Tn.normalize(),Cn.crossVectors(n,Tn)),Cn.normalize(),wn.crossVectors(Tn,Cn),r[0]=Cn.x,r[4]=wn.x,r[8]=Tn.x,r[1]=Cn.y,r[5]=wn.y,r[9]=Tn.y,r[2]=Cn.z,r[6]=wn.z,r[10]=Tn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],ee=r[14],M=r[3],N=r[7],P=r[11],F=r[15];return i[0]=a*x+o*T+s*k+c*M,i[4]=a*S+o*E+s*A+c*N,i[8]=a*C+o*D+s*j+c*P,i[12]=a*w+o*O+s*ee+c*F,i[1]=l*x+u*T+d*k+f*M,i[5]=l*S+u*E+d*A+f*N,i[9]=l*C+u*D+d*j+f*P,i[13]=l*w+u*O+d*ee+f*F,i[2]=p*x+m*T+h*k+g*M,i[6]=p*S+m*E+h*A+g*N,i[10]=p*C+m*D+h*j+g*P,i[14]=p*w+m*O+h*ee+g*F,i[3]=_*x+v*T+y*k+b*M,i[7]=_*S+v*E+y*A+b*N,i[11]=_*C+v*D+y*j+b*P,i[15]=_*w+v*O+y*ee+b*F,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15];return p*(+i*s*u-r*c*u-i*o*d+n*c*d+r*o*f-n*s*f)+m*(+t*s*f-t*c*d+i*a*d-r*a*f+r*c*l-i*s*l)+h*(+t*c*u-t*o*f-i*a*u+n*a*f+i*o*l-n*c*l)+g*(-r*o*l-t*s*u+t*o*d+r*a*u-n*a*d+n*s*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=u*h*c-m*d*c+m*s*f-o*h*f-u*s*g+o*d*g,v=p*d*c-l*h*c-p*s*f+a*h*f+l*s*g-a*d*g,y=l*m*c-p*u*c+p*o*f-a*m*f-l*o*g+a*u*g,b=p*u*s-l*m*s-p*o*d+a*m*d+l*o*h-a*u*h,x=t*_+n*v+r*y+i*b;if(x===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let S=1/x;return e[0]=_*S,e[1]=(m*d*i-u*h*i-m*r*f+n*h*f+u*r*g-n*d*g)*S,e[2]=(o*h*i-m*s*i+m*r*c-n*h*c-o*r*g+n*s*g)*S,e[3]=(u*s*i-o*d*i-u*r*c+n*d*c+o*r*f-n*s*f)*S,e[4]=v*S,e[5]=(l*h*i-p*d*i+p*r*f-t*h*f-l*r*g+t*d*g)*S,e[6]=(p*s*i-a*h*i-p*r*c+t*h*c+a*r*g-t*s*g)*S,e[7]=(a*d*i-l*s*i+l*r*c-t*d*c-a*r*f+t*s*f)*S,e[8]=y*S,e[9]=(p*u*i-l*m*i-p*n*f+t*m*f+l*n*g-t*u*g)*S,e[10]=(a*m*i-p*o*i+p*n*c-t*m*c-a*n*g+t*o*g)*S,e[11]=(l*o*i-a*u*i-l*n*c+t*u*c+a*n*f-t*o*f)*S,e[12]=b*S,e[13]=(l*m*r-p*u*r+p*n*d-t*m*d-l*n*h+t*u*h)*S,e[14]=(p*o*r-a*m*r-p*n*s+t*m*s+a*n*h-t*o*h)*S,e[15]=(a*u*r-l*o*r+l*n*s-t*u*s-a*n*d+t*o*d)*S,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements,i=yn.set(r[0],r[1],r[2]).length(),a=yn.set(r[4],r[5],r[6]).length(),o=yn.set(r[8],r[9],r[10]).length();this.determinant()<0&&(i=-i),e.x=r[12],e.y=r[13],e.z=r[14],bn.copy(this);let s=1/i,c=1/a,l=1/o;return bn.elements[0]*=s,bn.elements[1]*=s,bn.elements[2]*=s,bn.elements[4]*=c,bn.elements[5]*=c,bn.elements[6]*=c,bn.elements[8]*=l,bn.elements[9]*=l,bn.elements[10]*=l,t.setFromRotationMatrix(bn),n.x=i,n.y=a,n.z=o,this}makePerspective(e,t,n,r,i,a,o=it){let s=this.elements,c=2*i/(t-e),l=2*i/(n-r),u=(t+e)/(t-e),d=(n+r)/(n-r),f,p;if(o===2e3)f=-(a+i)/(a-i),p=-2*a*i/(a-i);else if(o===2001)f=-a/(a-i),p=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return s[0]=c,s[4]=0,s[8]=u,s[12]=0,s[1]=0,s[5]=l,s[9]=d,s[13]=0,s[2]=0,s[6]=0,s[10]=f,s[14]=p,s[3]=0,s[7]=0,s[11]=-1,s[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=it){let s=this.elements,c=1/(t-e),l=1/(n-r),u=1/(a-i),d=(t+e)*c,f=(n+r)*l,p,m;if(o===2e3)p=(a+i)*u,m=-2*u;else if(o===2001)p=i*u,m=-1*u;else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return s[0]=2*c,s[4]=0,s[8]=0,s[12]=-d,s[1]=0,s[5]=2*l,s[9]=0,s[13]=-f,s[2]=0,s[6]=0,s[10]=m,s[14]=-p,s[3]=0,s[7]=0,s[11]=0,s[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},yn=new K,bn=new q,xn=new K(0,0,0),Sn=new K(1,1,1),Cn=new K,wn=new K,Tn=new K,En=new q,Dn=new Ht,On=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(ut(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-ut(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(ut(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-ut(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(ut(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-ut(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:console.warn(`THREE.Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return En.makeRotationFromQuaternion(e),this.setFromRotationMatrix(En,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Dn.setFromEuler(this),this.setFromQuaternion(Dn,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};On.DEFAULT_ORDER=`XYZ`;var kn=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},An=0,jn=new K,Mn=new Ht,Nn=new q,Pn=new K,Fn=new K,In=new K,Ln=new Ht,Rn=new K(1,0,0),zn=new K(0,1,0),Bn=new K(0,0,1),Vn={type:`added`},Hn={type:`removed`},Un={type:`childadded`,child:null},Wn={type:`childremoved`,child:null},Gn=class e extends at{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:An++}),this.uuid=lt(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new K,n=new On,r=new Ht,i=new K(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new q},normalMatrix:{value:new W}}),this.matrix=new q,this.matrixWorld=new q,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new kn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Mn.setFromAxisAngle(e,t),this.quaternion.multiply(Mn),this}rotateOnWorldAxis(e,t){return Mn.setFromAxisAngle(e,t),this.quaternion.premultiply(Mn),this}rotateX(e){return this.rotateOnAxis(Rn,e)}rotateY(e){return this.rotateOnAxis(zn,e)}rotateZ(e){return this.rotateOnAxis(Bn,e)}translateOnAxis(e,t){return jn.copy(e).applyQuaternion(this.quaternion),this.position.add(jn.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Rn,e)}translateY(e){return this.translateOnAxis(zn,e)}translateZ(e){return this.translateOnAxis(Bn,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Nn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Pn.copy(e):Pn.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),Fn.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Nn.lookAt(Fn,Pn,this.up):Nn.lookAt(Pn,Fn,this.up),this.quaternion.setFromRotationMatrix(Nn),r&&(Nn.extractRotation(r.matrixWorld),Mn.setFromRotationMatrix(Nn),this.quaternion.premultiply(Mn.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(console.error(`THREE.Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Vn),Un.child=e,this.dispatchEvent(Un),Un.child=null):console.error(`THREE.Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Hn),Wn.child=e,this.dispatchEvent(Wn),Wn.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Nn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Nn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Nn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Vn),Un.child=e,this.dispatchEvent(Un),Un.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fn,e,In),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fn,Ln,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let e=this.children;for(let t=0,n=e.length;t<n;t++)e[t].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,this.name!==``&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.visibility=this._visibility,r.active=this._active,r.bounds=this._bounds.map(e=>({boxInitialized:e.boxInitialized,boxMin:e.box.min.toArray(),boxMax:e.box.max.toArray(),sphereInitialized:e.sphereInitialized,sphereRadius:e.sphere.radius,sphereCenter:e.sphere.center.toArray()})),r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.geometryCount=this._geometryCount,r.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere={center:r.boundingSphere.center.toArray(),radius:r.boundingSphere.radius}),this.boundingBox!==null&&(r.boundingBox={min:r.boundingBox.min.toArray(),max:r.boundingBox.max.toArray()}));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}};Gn.DEFAULT_UP=new K(0,1,0),Gn.DEFAULT_MATRIX_AUTO_UPDATE=!0,Gn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Kn=new K,qn=new K,Jn=new K,Yn=new K,Xn=new K,Zn=new K,Qn=new K,$n=new K,er=new K,tr=new K,nr=new Lt,rr=new Lt,ir=new Lt,ar=class e{constructor(e=new K,t=new K,n=new K){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),Kn.subVectors(e,t),r.cross(Kn);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){Kn.subVectors(r,t),qn.subVectors(n,t),Jn.subVectors(e,t);let a=Kn.dot(Kn),o=Kn.dot(qn),s=Kn.dot(Jn),c=qn.dot(qn),l=qn.dot(Jn),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Yn)!==null&&Yn.x>=0&&Yn.y>=0&&Yn.x+Yn.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Yn)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Yn.x),s.addScaledVector(a,Yn.y),s.addScaledVector(o,Yn.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return nr.setScalar(0),rr.setScalar(0),ir.setScalar(0),nr.fromBufferAttribute(e,t),rr.fromBufferAttribute(e,n),ir.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(nr,i.x),a.addScaledVector(rr,i.y),a.addScaledVector(ir,i.z),a}static isFrontFacing(e,t,n,r){return Kn.subVectors(n,t),qn.subVectors(e,t),Kn.cross(qn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Kn.subVectors(this.c,this.b),qn.subVectors(this.a,this.b),Kn.cross(qn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Xn.subVectors(r,n),Zn.subVectors(i,n),$n.subVectors(e,n);let s=Xn.dot($n),c=Zn.dot($n);if(s<=0&&c<=0)return t.copy(n);er.subVectors(e,r);let l=Xn.dot(er),u=Zn.dot(er);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0)return a=s/(s-l),t.copy(n).addScaledVector(Xn,a);tr.subVectors(e,i);let f=Xn.dot(tr),p=Zn.dot(tr);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Zn,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Qn.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Qn,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Xn,a).addScaledVector(Zn,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},or={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},sr={h:0,s:0,l:0},cr={h:0,s:0,l:0};function lr(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var J=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Qe){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,G.toWorkingColorSpace(this,t),this}setRGB(e,t,n,r=G.workingColorSpace){return this.r=e,this.g=t,this.b=n,G.toWorkingColorSpace(this,r),this}setHSL(e,t,n,r=G.workingColorSpace){if(e=dt(e,1),t=ut(t,0,1),n=ut(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=lr(i,r,e+1/3),this.g=lr(i,r,e),this.b=lr(i,r,e-1/3)}return G.toWorkingColorSpace(this,r),this}setStyle(e,t=Qe){function n(t){t!==void 0&&parseFloat(t)<1&&console.warn(`THREE.Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseInt(i[1],10))/100,Math.min(100,parseInt(i[2],10))/100,Math.min(100,parseInt(i[3],10))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:console.warn(`THREE.Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);console.warn(`THREE.Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Qe){let n=or[e.toLowerCase()];return n===void 0?console.warn(`THREE.Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ct(e.r),this.g=Ct(e.g),this.b=Ct(e.b),this}copyLinearToSRGB(e){return this.r=wt(e.r),this.g=wt(e.g),this.b=wt(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Qe){return G.fromWorkingColorSpace(ur.copy(this),e),Math.round(ut(ur.r*255,0,255))*65536+Math.round(ut(ur.g*255,0,255))*256+Math.round(ut(ur.b*255,0,255))}getHexString(e=Qe){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=G.workingColorSpace){G.fromWorkingColorSpace(ur.copy(this),t);let n=ur.r,r=ur.g,i=ur.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=G.workingColorSpace){return G.fromWorkingColorSpace(ur.copy(this),t),e.r=ur.r,e.g=ur.g,e.b=ur.b,e}getStyle(e=Qe){G.fromWorkingColorSpace(ur.copy(this),e);let t=ur.r,n=ur.g,r=ur.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(sr),this.setHSL(sr.h+e,sr.s+t,sr.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(sr),e.getHSL(cr);let n=ft(sr.h,cr.h,t),r=ft(sr.s,cr.s,t),i=ft(sr.l,cr.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},ur=new J;J.NAMES=or;var dr=0,fr=class extends at{static get type(){return`Material`}get type(){return this.constructor.type}set type(e){}constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:dr++}),this.uuid=lt(),this.name=``,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new J(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=nt,this.stencilZFail=nt,this.stencilZPass=nt,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,this.name!==``&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(n.blending=this.blending),this.side!==0&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==204&&(n.blendSrc=this.blendSrc),this.blendDst!==205&&(n.blendDst=this.blendDst),this.blendEquation!==100&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==7680&&(n.stencilFail=this.stencilFail),this.stencilZFail!==7680&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==7680&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==`round`&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==`round`&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn(`Material: onBuild() has been removed.`)}},pr=class extends fr{static get type(){return`MeshBasicMaterial`}constructor(e){super(),this.isMeshBasicMaterial=!0,this.color=new J(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new On,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},mr=new K,hr=new U,gr=class{constructor(e,t,n=!1){if(Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=rt,this.updateRanges=[],this.gpuType=F,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)hr.fromBufferAttribute(this,t),hr.applyMatrix3(e),this.setXY(t,hr.x,hr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)mr.fromBufferAttribute(this,t),mr.applyMatrix3(e),this.setXYZ(t,mr.x,mr.y,mr.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)mr.fromBufferAttribute(this,t),mr.applyMatrix4(e),this.setXYZ(t,mr.x,mr.y,mr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)mr.fromBufferAttribute(this,t),mr.applyNormalMatrix(e),this.setXYZ(t,mr.x,mr.y,mr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)mr.fromBufferAttribute(this,t),mr.transformDirection(e),this.setXYZ(t,mr.x,mr.y,mr.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=pt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=H(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=pt(t,this.array)),t}setX(e,t){return this.normalized&&(t=H(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=pt(t,this.array)),t}setY(e,t){return this.normalized&&(t=H(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=pt(t,this.array)),t}setZ(e,t){return this.normalized&&(t=H(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=pt(t,this.array)),t}setW(e,t){return this.normalized&&(t=H(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=H(t,this.array),n=H(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=H(t,this.array),n=H(n,this.array),r=H(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=H(t,this.array),n=H(n,this.array),r=H(r,this.array),i=H(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==``&&(e.name=this.name),this.usage!==35044&&(e.usage=this.usage),e}},_r=class extends gr{constructor(e,t,n){super(new Uint16Array(e),t,n)}},vr=class extends gr{constructor(e,t,n){super(new Uint32Array(e),t,n)}},Y=class extends gr{constructor(e,t,n){super(new Float32Array(e),t,n)}},yr=0,br=new q,xr=new Gn,Sr=new K,Cr=new Gt,wr=new Gt,Tr=new K,Er=class e extends at{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:yr++}),this.uuid=lt(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(ht(e)?vr:_r)(e,1):e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new W().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return br.makeRotationFromQuaternion(e),this.applyMatrix4(br),this}rotateX(e){return br.makeRotationX(e),this.applyMatrix4(br),this}rotateY(e){return br.makeRotationY(e),this.applyMatrix4(br),this}rotateZ(e){return br.makeRotationZ(e),this.applyMatrix4(br),this}translate(e,t,n){return br.makeTranslation(e,t,n),this.applyMatrix4(br),this}scale(e,t,n){return br.makeScale(e,t,n),this.applyMatrix4(br),this}lookAt(e){return xr.lookAt(e),xr.updateMatrix(),this.applyMatrix4(xr.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Sr).negate(),this.translate(Sr.x,Sr.y,Sr.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new Y(t,3))}else{for(let n=0,r=t.count;n<r;n++){let r=e[n];t.setXYZ(n,r.x,r.y,r.z||0)}e.length>t.count&&console.warn(`THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Gt);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)console.error(`THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new K(-1/0,-1/0,-1/0),new K(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];Cr.setFromBufferAttribute(n),this.morphTargetsRelative?(Tr.addVectors(this.boundingBox.min,Cr.min),this.boundingBox.expandByPoint(Tr),Tr.addVectors(this.boundingBox.max,Cr.max),this.boundingBox.expandByPoint(Tr)):(this.boundingBox.expandByPoint(Cr.min),this.boundingBox.expandByPoint(Cr.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error(`THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new un);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)console.error(`THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new K,1/0);else if(e){let n=this.boundingSphere.center;if(Cr.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];wr.setFromBufferAttribute(n),this.morphTargetsRelative?(Tr.addVectors(Cr.min,wr.min),Cr.expandByPoint(Tr),Tr.addVectors(Cr.max,wr.max),Cr.expandByPoint(Tr)):(Cr.expandByPoint(wr.min),Cr.expandByPoint(wr.max))}Cr.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)Tr.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(Tr));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)Tr.fromBufferAttribute(a,t),o&&(Sr.fromBufferAttribute(e,t),Tr.add(Sr)),r=Math.max(r,n.distanceToSquared(Tr))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&console.error(`THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error(`THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv;this.hasAttribute(`tangent`)===!1&&this.setAttribute(`tangent`,new gr(new Float32Array(4*n.count),4));let a=this.getAttribute(`tangent`),o=[],s=[];for(let e=0;e<n.count;e++)o[e]=new K,s[e]=new K;let c=new K,l=new K,u=new K,d=new U,f=new U,p=new U,m=new K,h=new K;function g(e,t,r){c.fromBufferAttribute(n,e),l.fromBufferAttribute(n,t),u.fromBufferAttribute(n,r),d.fromBufferAttribute(i,e),f.fromBufferAttribute(i,t),p.fromBufferAttribute(i,r),l.sub(c),u.sub(c),f.sub(d),p.sub(d);let a=1/(f.x*p.y-p.x*f.y);isFinite(a)&&(m.copy(l).multiplyScalar(p.y).addScaledVector(u,-f.y).multiplyScalar(a),h.copy(u).multiplyScalar(f.x).addScaledVector(l,-p.x).multiplyScalar(a),o[e].add(m),o[t].add(m),o[r].add(m),s[e].add(h),s[t].add(h),s[r].add(h))}let _=this.groups;_.length===0&&(_=[{start:0,count:e.count}]);for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)g(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let v=new K,y=new K,b=new K,x=new K;function S(e){b.fromBufferAttribute(r,e),x.copy(b);let t=o[e];v.copy(t),v.sub(b.multiplyScalar(b.dot(t))).normalize(),y.crossVectors(x,t);let n=y.dot(s[e])<0?-1:1;a.setXYZW(e,v.x,v.y,v.z,n)}for(let t=0,n=_.length;t<n;++t){let n=_[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)S(e.getX(t+0)),S(e.getX(t+1)),S(e.getX(t+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0)n=new gr(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new K,i=new K,a=new K,o=new K,s=new K,c=new K,l=new K,u=new K;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Tr.fromBufferAttribute(e,t),Tr.normalize(),e.setXYZ(t,Tr.x,Tr.y,Tr.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new gr(a,r,i)}if(this.index===null)return console.warn(`THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.6,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.type,this.name!==``&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:`dispose`})}},Dr=new q,Or=new vn,kr=new un,Ar=new K,jr=new K,Mr=new K,Nr=new K,Pr=new K,Fr=new K,Ir=new K,Lr=new K,X=class extends Gn{constructor(e=new Er,t=new pr){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){Fr.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(Pr.fromBufferAttribute(s,e),a?Fr.addScaledVector(Pr,r):Fr.addScaledVector(Pr.sub(t),r))}t.add(Fr)}return t}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),kr.copy(n.boundingSphere),kr.applyMatrix4(i),Or.copy(e.ray).recast(e.near),kr.containsPoint(Or.origin)===!1&&(Or.intersectSphere(kr,Ar)===null||Or.origin.distanceToSquared(Ar)>(e.far-e.near)**2)||(Dr.copy(i).invert(),Or.copy(e.ray).applyMatrix4(Dr),(n.boundingBox===null||Or.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,Or)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=zr(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=zr(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=zr(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=zr(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function Rr(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;Lr.copy(s),Lr.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(Lr);return l<n.near||l>n.far?null:{distance:l,point:Lr.clone(),object:e}}function zr(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,jr),e.getVertexPosition(c,Mr),e.getVertexPosition(l,Nr);let u=Rr(e,t,n,r,jr,Mr,Nr,Ir);if(u){let e=new K;ar.getBarycoord(Ir,jr,Mr,Nr,e),i&&(u.uv=ar.getInterpolatedAttribute(i,s,c,l,e,new U)),a&&(u.uv1=ar.getInterpolatedAttribute(a,s,c,l,e,new U)),o&&(u.normal=ar.getInterpolatedAttribute(o,s,c,l,e,new K),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new K,materialIndex:0};ar.getNormal(jr,Mr,Nr,t.normal),u.face=t,u.barycoord=e}return u}var Br=class e extends Er{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new Y(c,3)),this.setAttribute(`normal`,new Y(l,3)),this.setAttribute(`uv`,new Y(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new K;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function Vr(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?i.isRenderTargetTexture?(console.warn(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone():Array.isArray(i)?t[n][r]=i.slice():t[n][r]=i}}return t}function Hr(e){let t={};for(let n=0;n<e.length;n++){let r=Vr(e[n]);for(let e in r)t[e]=r[e]}return t}function Ur(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Wr(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:G.workingColorSpace}var Gr={clone:Vr,merge:Hr},Kr=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,qr=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Jr=class extends fr{static get type(){return`ShaderMaterial`}constructor(e){super(),this.isShaderMaterial=!0,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Kr,this.fragmentShader=qr,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Vr(e.uniforms),this.uniformsGroups=Ur(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Yr=class extends Gn{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new q,this.projectionMatrix=new q,this.projectionMatrixInverse=new q,this.coordinateSystem=it}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Xr=new K,Zr=new U,Qr=new U,$r=class extends Yr{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ct*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(st*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ct*2*Math.atan(Math.tan(st*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Xr.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Xr.x,Xr.y).multiplyScalar(-e/Xr.z),Xr.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Xr.x,Xr.y).multiplyScalar(-e/Xr.z)}getViewSize(e,t){return this.getViewBounds(e,Zr,Qr),t.subVectors(Qr,Zr)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(st*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},ei=-90,ti=1,ni=class extends Gn{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new $r(ei,ti,e,t);r.layers=this.layers,this.add(r);let i=new $r(ei,ti,e,t);i.layers=this.layers,this.add(i);let a=new $r(ei,ti,e,t);a.layers=this.layers,this.add(a);let o=new $r(ei,ti,e,t);o.layers=this.layers,this.add(o);let s=new $r(ei,ti,e,t);s.layers=this.layers,this.add(s);let c=new $r(ei,ti,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,r),e.render(t,i),e.setRenderTarget(n,1,r),e.render(t,a),e.setRenderTarget(n,2,r),e.render(t,o),e.setRenderTarget(n,3,r),e.render(t,s),e.setRenderTarget(n,4,r),e.render(t,c),n.texture.generateMipmaps=m,e.setRenderTarget(n,5,r),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},ri=class extends It{constructor(e,t,n,r,i,a,o,s,c,l){e=e===void 0?[]:e,t=t===void 0?301:t,super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ii=class extends zt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new ri(r,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0&&t.generateMipmaps,this.texture.minFilter=t.minFilter===void 0?D:t.minFilter}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Br(5,5,5),i=new Jr({name:`CubemapFromEquirect`,uniforms:Vr(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new X(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=D),new ni(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t,n,r){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}},ai=new K,oi=new K,si=new W,ci=class{constructor(e=new K(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=ai.subVectors(n,t).cross(oi.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(ai),r=this.normal.dot(n);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let i=-(e.start.dot(this.normal)+this.constant)/r;return i<0||i>1?null:t.copy(e.start).addScaledVector(n,i)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||si.getNormalMatrix(e),r=this.coplanarPoint(ai).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},li=new un,ui=new K,di=class{constructor(e=new ci,t=new ci,n=new ci,r=new ci,i=new ci,a=new ci){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=it){let n=this.planes,r=e.elements,i=r[0],a=r[1],o=r[2],s=r[3],c=r[4],l=r[5],u=r[6],d=r[7],f=r[8],p=r[9],m=r[10],h=r[11],g=r[12],_=r[13],v=r[14],y=r[15];if(n[0].setComponents(s-i,d-c,h-f,y-g).normalize(),n[1].setComponents(s+i,d+c,h+f,y+g).normalize(),n[2].setComponents(s+a,d+l,h+p,y+_).normalize(),n[3].setComponents(s-a,d-l,h-p,y-_).normalize(),n[4].setComponents(s-o,d-u,h-m,y-v).normalize(),t===2e3)n[5].setComponents(s+o,d+u,h+m,y+v).normalize();else if(t===2001)n[5].setComponents(o,u,m,v).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),li.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),li.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(li)}intersectsSprite(e){return li.center.set(0,0,0),li.radius=.7071067811865476,li.applyMatrix4(e.matrixWorld),this.intersectsSphere(li)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(ui.x=r.normal.x>0?e.max.x:e.min.x,ui.y=r.normal.y>0?e.max.y:e.min.y,ui.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ui)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function fi(){let e=null,t=!1,n=null,r=null;function i(t,a){n(t,a),r=e.requestAnimationFrame(i)}return{start:function(){t!==!0&&n!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function pi(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var mi=class e extends Er{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new Y(p,3)),this.setAttribute(`normal`,new Y(m,3)),this.setAttribute(`uv`,new Y(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},Z={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
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
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
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
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
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
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
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
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
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
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
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
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
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
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR_ALPHA )
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
#endif`,common:`#define PI 3.141592653589793
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
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
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
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
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
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
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
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
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
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
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
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
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
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
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
#endif`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
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
#endif`,lights_physical_pars_fragment:`struct PhysicalMaterial {
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
}`,lights_fragment_begin:`
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
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
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
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
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
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
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
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
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
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
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
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
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
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
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
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
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
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
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
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
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
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
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
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
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
}`,depth_frag:`#if DEPTH_PACKING == 3200
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
}`,distanceRGBA_vert:`#define DISTANCE
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
}`,distanceRGBA_frag:`#define DISTANCE
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
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
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
}`,linedashed_frag:`uniform vec3 diffuse;
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
}`,meshbasic_vert:`#include <common>
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
}`,meshbasic_frag:`uniform vec3 diffuse;
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
}`,meshlambert_vert:`#define LAMBERT
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
}`,meshlambert_frag:`#define LAMBERT
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
}`,meshmatcap_vert:`#define MATCAP
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
}`,meshmatcap_frag:`#define MATCAP
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
}`,meshnormal_vert:`#define NORMAL
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
}`,meshnormal_frag:`#define NORMAL
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
}`,meshphong_vert:`#define PHONG
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
}`,meshphong_frag:`#define PHONG
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
}`,meshphysical_vert:`#define STANDARD
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
}`,meshphysical_frag:`#define STANDARD
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
}`,meshtoon_vert:`#define TOON
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
}`,meshtoon_frag:`#define TOON
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
}`,points_vert:`uniform float size;
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
}`,points_frag:`uniform vec3 diffuse;
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
}`,shadow_vert:`#include <common>
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
}`,shadow_frag:`uniform vec3 color;
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
}`,sprite_vert:`uniform float rotation;
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
}`,sprite_frag:`uniform vec3 diffuse;
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
}`},Q={common:{diffuse:{value:new J(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new W},alphaMap:{value:null},alphaMapTransform:{value:new W},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new W}},envmap:{envMap:{value:null},envMapRotation:{value:new W},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new W}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new W}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new W},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new W},normalScale:{value:new U(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new W},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new W}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new W}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new W}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new J(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new J(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new W},alphaTest:{value:0},uvTransform:{value:new W}},sprite:{diffuse:{value:new J(16777215)},opacity:{value:1},center:{value:new U(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new W},alphaMap:{value:null},alphaMapTransform:{value:new W},alphaTest:{value:0}}},hi={basic:{uniforms:Hr([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.fog]),vertexShader:Z.meshbasic_vert,fragmentShader:Z.meshbasic_frag},lambert:{uniforms:Hr([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,Q.lights,{emissive:{value:new J(0)}}]),vertexShader:Z.meshlambert_vert,fragmentShader:Z.meshlambert_frag},phong:{uniforms:Hr([Q.common,Q.specularmap,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,Q.lights,{emissive:{value:new J(0)},specular:{value:new J(1118481)},shininess:{value:30}}]),vertexShader:Z.meshphong_vert,fragmentShader:Z.meshphong_frag},standard:{uniforms:Hr([Q.common,Q.envmap,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.roughnessmap,Q.metalnessmap,Q.fog,Q.lights,{emissive:{value:new J(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Z.meshphysical_vert,fragmentShader:Z.meshphysical_frag},toon:{uniforms:Hr([Q.common,Q.aomap,Q.lightmap,Q.emissivemap,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.gradientmap,Q.fog,Q.lights,{emissive:{value:new J(0)}}]),vertexShader:Z.meshtoon_vert,fragmentShader:Z.meshtoon_frag},matcap:{uniforms:Hr([Q.common,Q.bumpmap,Q.normalmap,Q.displacementmap,Q.fog,{matcap:{value:null}}]),vertexShader:Z.meshmatcap_vert,fragmentShader:Z.meshmatcap_frag},points:{uniforms:Hr([Q.points,Q.fog]),vertexShader:Z.points_vert,fragmentShader:Z.points_frag},dashed:{uniforms:Hr([Q.common,Q.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Z.linedashed_vert,fragmentShader:Z.linedashed_frag},depth:{uniforms:Hr([Q.common,Q.displacementmap]),vertexShader:Z.depth_vert,fragmentShader:Z.depth_frag},normal:{uniforms:Hr([Q.common,Q.bumpmap,Q.normalmap,Q.displacementmap,{opacity:{value:1}}]),vertexShader:Z.meshnormal_vert,fragmentShader:Z.meshnormal_frag},sprite:{uniforms:Hr([Q.sprite,Q.fog]),vertexShader:Z.sprite_vert,fragmentShader:Z.sprite_frag},background:{uniforms:{uvTransform:{value:new W},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Z.background_vert,fragmentShader:Z.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new W}},vertexShader:Z.backgroundCube_vert,fragmentShader:Z.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Z.cube_vert,fragmentShader:Z.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Z.equirect_vert,fragmentShader:Z.equirect_frag},distanceRGBA:{uniforms:Hr([Q.common,Q.displacementmap,{referencePosition:{value:new K},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Z.distanceRGBA_vert,fragmentShader:Z.distanceRGBA_frag},shadow:{uniforms:Hr([Q.lights,Q.fog,{color:{value:new J(0)},opacity:{value:1}}]),vertexShader:Z.shadow_vert,fragmentShader:Z.shadow_frag}};hi.physical={uniforms:Hr([hi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new W},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new W},clearcoatNormalScale:{value:new U(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new W},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new W},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new W},sheen:{value:0},sheenColor:{value:new J(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new W},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new W},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new W},transmissionSamplerSize:{value:new U},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new W},attenuationDistance:{value:0},attenuationColor:{value:new J(0)},specularColor:{value:new J(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new W},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new W},anisotropyVector:{value:new U},anisotropyMap:{value:null},anisotropyMapTransform:{value:new W}}]),vertexShader:Z.meshphysical_vert,fragmentShader:Z.meshphysical_frag};var gi={r:0,b:0,g:0},_i=new On,vi=new q;function yi(e,t,n,r,i,a,o){let s=new J(0),c=a===!0?0:1,l,u,d=null,f=0,p=null;function m(e){let r=e.isScene===!0?e.background:null;return r&&r.isTexture&&(r=(e.backgroundBlurriness>0?n:t).get(r)),r}function h(t){let n=!1,i=m(t);i===null?_(s,c):i&&i.isColor&&(_(i,1),n=!0);let a=e.xr.getEnvironmentBlendMode();a===`additive`?r.buffers.color.setClear(0,0,0,1,o):a===`alpha-blend`&&r.buffers.color.setClear(0,0,0,0,o),(e.autoClear||n)&&(r.buffers.depth.setTest(!0),r.buffers.depth.setMask(!0),r.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function g(t,n){let r=m(n);r&&(r.isCubeTexture||r.mapping===306)?(u===void 0&&(u=new X(new Br(1,1,1),new Jr({name:`BackgroundCubeMaterial`,uniforms:Vr(hi.backgroundCube.uniforms),vertexShader:hi.backgroundCube.vertexShader,fragmentShader:hi.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute(`normal`),u.geometry.deleteAttribute(`uv`),u.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(u)),_i.copy(n.backgroundRotation),_i.x*=-1,_i.y*=-1,_i.z*=-1,r.isCubeTexture&&r.isRenderTargetTexture===!1&&(_i.y*=-1,_i.z*=-1),u.material.uniforms.envMap.value=r,u.material.uniforms.flipEnvMap.value=r.isCubeTexture&&r.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,u.material.uniforms.backgroundRotation.value.setFromMatrix4(vi.makeRotationFromEuler(_i)),u.material.toneMapped=G.getTransfer(r.colorSpace)!==tt,(d!==r||f!==r.version||p!==e.toneMapping)&&(u.material.needsUpdate=!0,d=r,f=r.version,p=e.toneMapping),u.layers.enableAll(),t.unshift(u,u.geometry,u.material,0,0,null)):r&&r.isTexture&&(l===void 0&&(l=new X(new mi(2,2),new Jr({name:`BackgroundMaterial`,uniforms:Vr(hi.background.uniforms),vertexShader:hi.background.vertexShader,fragmentShader:hi.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute(`normal`),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=r,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.toneMapped=G.getTransfer(r.colorSpace)!==tt,r.matrixAutoUpdate===!0&&r.updateMatrix(),l.material.uniforms.uvTransform.value.copy(r.matrix),(d!==r||f!==r.version||p!==e.toneMapping)&&(l.material.needsUpdate=!0,d=r,f=r.version,p=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null))}function _(t,n){t.getRGB(gi,Wr(e)),r.buffers.color.setClear(gi.r,gi.g,gi.b,n,o)}return{getClearColor:function(){return s},setClearColor:function(e,t=1){s.set(e),c=t,_(s,c)},getClearAlpha:function(){return c},setClearAlpha:function(e){c=e,_(s,c)},render:h,addToRenderList:g}}function bi(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n){let i=n.wireframe===!0,a=r[e.id];a===void 0&&(a={},r[e.id]=a);let o=a[t.id];o===void 0&&(o={},a[t.id]=o);let s=o[i];return s===void 0&&(s=f(c()),o[i]=s),s}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.stride,p=s.offset;if(t.isInstancedInterleavedBuffer){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){w();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n)u(n[e].object),delete n[e];delete t[e]}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n)u(n[e].object),delete n[e];delete t[e]}delete r[e.id]}function C(e){for(let t in r){let n=r[t];if(n[e.id]===void 0)continue;let i=n[e.id];for(let e in i)u(i[e].object),delete i[e];delete n[e.id]}}function w(){T(),o=!0,a!==i&&(a=i,l(a.object))}function T(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:w,resetDefaultState:T,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function xi(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}function c(e,i,a,s){if(a===0)return;let c=t.get(`WEBGL_multi_draw`);if(c===null)for(let t=0;t<e.length;t++)o(e[t],i[t],s[t]);else{c.multiDrawArraysInstancedWEBGL(r,e,0,i,0,s,0,a);let t=0;for(let e=0;e<a;e++)t+=i[e]*s[e];n.update(t,r,1)}}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s,this.renderMultiDrawInstances=c}function Si(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE)&&n!==1015&&!i)}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(console.warn(`THREE.WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.logarithmicDepthBuffer===!0,f=n.reverseDepthBuffer===!0&&t.has(`EXT_clip_control`),p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=m>0,S=e.getParameter(e.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:d,reverseDepthBuffer:f,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,vertexTextures:x,maxSamples:S}}function Ci(e){let t=this,n=null,r=0,i=!1,a=!1,o=new ci,s=new W,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}function wi(e){let t=new WeakMap;function n(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function r(r){if(r&&r.isTexture){let a=r.mapping;if(a===303||a===304){if(t.has(r)){let e=t.get(r).texture;return n(e,r.mapping)}{let a=r.image;if(a&&a.height>0){let o=new ii(a.height);return o.fromEquirectangularTexture(e,r),t.set(r,o),r.addEventListener(`dispose`,i),n(o.texture,r.mapping)}return null}}}return r}function i(e){let n=e.target;n.removeEventListener(`dispose`,i);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function a(){t=new WeakMap}return{get:r,dispose:a}}var Ti=class extends Yr{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Ei=4,Di=[.125,.215,.35,.446,.526,.582],Oi=20,ki=new Ti,Ai=new J,ji=null,Mi=0,Ni=0,Pi=!1,Fi=(1+Math.sqrt(5))/2,Ii=1/Fi,Li=[new K(-Fi,Ii,0),new K(Fi,Ii,0),new K(-Ii,0,Fi),new K(Ii,0,Fi),new K(0,Fi,-Ii),new K(0,Fi,Ii),new K(-1,1,-1),new K(1,1,-1),new K(-1,1,1),new K(1,1,1)],Ri=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,r=100){ji=this._renderer.getRenderTarget(),Mi=this._renderer.getActiveCubeFace(),Ni=this._renderer.getActiveMipmapLevel(),Pi=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let i=this._allocateTargets();return i.depthBuffer=!0,this._sceneToCubeUV(e,n,r,i),t>0&&this._blur(i,0,0,t),this._applyPMREM(i),this._cleanup(i),i}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Wi(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ui(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=2**this._lodMax}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(ji,Mi,Ni),this._renderer.xr.enabled=Pi,e.scissorTest=!1,Vi(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),ji=this._renderer.getRenderTarget(),Mi=this._renderer.getActiveCubeFace(),Ni=this._renderer.getActiveMipmapLevel(),Pi=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:D,minFilter:D,generateMipmaps:!1,type:te,format:se,colorSpace:$e,depthBuffer:!1},r=Bi(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Bi(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=zi(r)),this._blurMaterial=Hi(r,e,t)}return r}_compileMaterial(e){let t=new X(this._lodPlanes[0],e);this._renderer.compile(t,ki)}_sceneToCubeUV(e,t,n,r){let i=new $r(90,1,t,n),a=[1,-1,1,1,1,1],o=[1,1,1,-1,-1,-1],s=this._renderer,c=s.autoClear,l=s.toneMapping;s.getClearColor(Ai),s.toneMapping=0,s.autoClear=!1;let u=new pr({name:`PMREM.Background`,side:1,depthWrite:!1,depthTest:!1}),d=new X(new Br,u),f=!1,p=e.background;p?p.isColor&&(u.color.copy(p),e.background=null,f=!0):(u.color.copy(Ai),f=!0);for(let t=0;t<6;t++){let n=t%3;n===0?(i.up.set(0,a[t],0),i.lookAt(o[t],0,0)):n===1?(i.up.set(0,0,a[t]),i.lookAt(0,o[t],0)):(i.up.set(0,a[t],0),i.lookAt(0,0,o[t]));let c=this._cubeSize;Vi(r,n*c,t>2?c:0,c,c),s.setRenderTarget(r),f&&s.render(d,i),s.render(e,i)}d.geometry.dispose(),d.material.dispose(),s.toneMapping=l,s.autoClear=c,e.background=p}_textureToCubeUV(e,t){let n=this._renderer,r=e.mapping===301||e.mapping===302;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Wi()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ui());let i=r?this._cubemapMaterial:this._equirectMaterial,a=new X(this._lodPlanes[0],i),o=i.uniforms;o.envMap.value=e;let s=this._cubeSize;Vi(t,0,0,3*s,2*s),n.setRenderTarget(t),n.render(a,ki)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let r=this._lodPlanes.length;for(let t=1;t<r;t++){let n=Math.sqrt(this._sigmas[t]*this._sigmas[t]-this._sigmas[t-1]*this._sigmas[t-1]),i=Li[(r-t-1)%Li.length];this._blur(e,t-1,t,n,i)}t.autoClear=n}_blur(e,t,n,r,i){let a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,r,`latitudinal`,i),this._halfBlur(a,e,n,n,r,`longitudinal`,i)}_halfBlur(e,t,n,r,i,a,o){let s=this._renderer,c=this._blurMaterial;a!==`latitudinal`&&a!==`longitudinal`&&console.error(`blur direction must be either latitudinal or longitudinal!`);let l=new X(this._lodPlanes[r],c),u=c.uniforms,d=this._sizeLods[n]-1,f=isFinite(i)?Math.PI/(2*d):2*Math.PI/39,p=i/f,m=isFinite(i)?1+Math.floor(3*p):Oi;m>Oi&&console.warn(`sigmaRadians, ${i}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Oi}`);let h=[],g=0;for(let e=0;e<Oi;++e){let t=e/p,n=Math.exp(-t*t/2);h.push(n),e===0?g+=n:e<m&&(g+=2*n)}for(let e=0;e<h.length;e++)h[e]=h[e]/g;u.envMap.value=e.texture,u.samples.value=m,u.weights.value=h,u.latitudinal.value=a===`latitudinal`,o&&(u.poleAxis.value=o);let{_lodMax:_}=this;u.dTheta.value=f,u.mipInt.value=_-n;let v=this._sizeLods[r];Vi(t,3*v*(r>_-Ei?r-_+Ei:0),4*(this._cubeSize-v),3*v,2*v),s.setRenderTarget(t),s.render(l,ki)}};function zi(e){let t=[],n=[],r=[],i=e,a=e-Ei+1+Di.length;for(let o=0;o<a;o++){let a=2**i;n.push(a);let s=1/a;o>e-Ei?s=Di[o-e+Ei-1]:o===0&&(s=0),r.push(s);let c=1/(a-2),l=-c,u=1+c,d=[l,l,u,l,u,u,l,l,u,u,l,u],f=new Float32Array(108),p=new Float32Array(72),m=new Float32Array(36);for(let e=0;e<6;e++){let t=e%3*2/3-1,n=e>2?0:-1,r=[t,n,0,t+2/3,n,0,t+2/3,n+1,0,t,n,0,t+2/3,n+1,0,t,n+1,0];f.set(r,18*e),p.set(d,12*e);let i=[e,e,e,e,e,e];m.set(i,6*e)}let h=new Er;h.setAttribute(`position`,new gr(f,3)),h.setAttribute(`uv`,new gr(p,2)),h.setAttribute(`faceIndex`,new gr(m,1)),t.push(h),i>Ei&&i--}return{lodPlanes:t,sizeLods:n,sigmas:r}}function Bi(e,t,n){let r=new zt(e,t,n);return r.texture.mapping=306,r.texture.name=`PMREM.cubeUv`,r.scissorTest=!0,r}function Vi(e,t,n,r,i){e.viewport.set(t,n,r,i),e.scissor.set(t,n,r,i)}function Hi(e,t,n){let r=new Float32Array(Oi),i=new K(0,1,0);return new Jr({name:`SphericalGaussianBlur`,defines:{n:Oi,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:r},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Gi(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function Ui(){return new Jr({name:`EquirectangularToCubeUV`,uniforms:{envMap:{value:null}},vertexShader:Gi(),fragmentShader:`

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
		`,blending:0,depthTest:!1,depthWrite:!1})}function Wi(){return new Jr({name:`CubemapToCubeUV`,uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Gi(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Gi(){return`

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
	`}function Ki(e){let t=new WeakMap,n=null;function r(r){if(r&&r.isTexture){let o=r.mapping,s=o===303||o===304,c=o===301||o===302;if(s||c){let o=t.get(r),l=o===void 0?0:o.texture.pmremVersion;if(r.isRenderTargetTexture&&r.pmremVersion!==l)return n===null&&(n=new Ri(e)),o=s?n.fromEquirectangular(r,o):n.fromCubemap(r,o),o.texture.pmremVersion=r.pmremVersion,t.set(r,o),o.texture;if(o!==void 0)return o.texture;{let l=r.image;return s&&l&&l.height>0||c&&l&&i(l)?(n===null&&(n=new Ri(e)),o=s?n.fromEquirectangular(r):n.fromCubemap(r),o.texture.pmremVersion=r.pmremVersion,t.set(r,o),r.addEventListener(`dispose`,a),o.texture):null}}}return r}function i(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function a(e){let n=e.target;n.removeEventListener(`dispose`,a);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function o(){t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:r,dispose:o}}function qi(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r;switch(n){case`WEBGL_depth_texture`:r=e.getExtension(`WEBGL_depth_texture`)||e.getExtension(`MOZ_WEBGL_depth_texture`)||e.getExtension(`WEBKIT_WEBGL_depth_texture`);break;case`EXT_texture_filter_anisotropic`:r=e.getExtension(`EXT_texture_filter_anisotropic`)||e.getExtension(`MOZ_EXT_texture_filter_anisotropic`)||e.getExtension(`WEBKIT_EXT_texture_filter_anisotropic`);break;case`WEBGL_compressed_texture_s3tc`:r=e.getExtension(`WEBGL_compressed_texture_s3tc`)||e.getExtension(`MOZ_WEBGL_compressed_texture_s3tc`)||e.getExtension(`WEBKIT_WEBGL_compressed_texture_s3tc`);break;case`WEBGL_compressed_texture_pvrtc`:r=e.getExtension(`WEBGL_compressed_texture_pvrtc`)||e.getExtension(`WEBKIT_WEBGL_compressed_texture_pvrtc`);break;default:r=e.getExtension(n)}return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&yt(`THREE.WebGLRenderer: `+e+` extension not supported.`),t}}}function Ji(e,t,n,r){let i={},a=new WeakMap;function o(e){let s=e.target;s.index!==null&&t.remove(s.index);for(let e in s.attributes)t.remove(s.attributes[e]);for(let e in s.morphAttributes){let n=s.morphAttributes[e];for(let e=0,r=n.length;e<r;e++)t.remove(n[e])}s.removeEventListener(`dispose`,o),delete i[s.id];let c=a.get(s);c&&(t.remove(c),a.delete(s)),r.releaseStatesOfGeometry(s),s.isInstancedBufferGeometry===!0&&delete s._maxInstanceCount,n.memory.geometries--}function s(e,t){return i[t.id]===!0||(t.addEventListener(`dispose`,o),i[t.id]=!0,n.memory.geometries++),t}function c(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER);let i=n.morphAttributes;for(let n in i){let r=i[n];for(let n=0,i=r.length;n<i;n++)t.update(r[n],e.ARRAY_BUFFER)}}function l(e){let n=[],r=e.index,i=e.attributes.position,o=0;if(r!==null){let e=r.array;o=r.version;for(let t=0,r=e.length;t<r;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];n.push(r,i,i,a,a,r)}}else if(i!==void 0){let e=i.array;o=i.version;for(let t=0,r=e.length/3-1;t<r;t+=3){let e=t+0,r=t+1,i=t+2;n.push(e,r,r,i,i,e)}}else return;let s=new(ht(n)?vr:_r)(n,1);s.version=o;let c=a.get(e);c&&t.remove(c),a.set(e,s)}function u(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&l(e)}else l(e);return a.get(e)}return{get:s,update:c,getWireframeAttribute:u}}function Yi(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}function d(e,i,s,c){if(s===0)return;let u=t.get(`WEBGL_multi_draw`);if(u===null)for(let t=0;t<e.length;t++)l(e[t]/o,i[t],c[t]);else{u.multiDrawElementsInstancedWEBGL(r,i,0,a,e,0,c,0,s);let t=0;for(let e=0;e<s;e++)t+=i[e]*c[e];n.update(t,r,1)}}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u,this.renderMultiDrawInstances=d}function Xi(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:console.error(`THREE.WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Zi(e,t,n){let r=new WeakMap,i=new Lt;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new Bt(h,p,m,u);g.type=F,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new U(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function Qi(e,t,n,r){let i=new WeakMap;function a(a){let o=r.render.frame,c=a.geometry,l=t.get(a,c);if(i.get(l)!==o&&(t.update(l),i.set(l,o)),a.isInstancedMesh&&(a.hasEventListener(`dispose`,s)===!1&&a.addEventListener(`dispose`,s),i.get(a)!==o&&(n.update(a.instanceMatrix,e.ARRAY_BUFFER),a.instanceColor!==null&&n.update(a.instanceColor,e.ARRAY_BUFFER),i.set(a,o))),a.isSkinnedMesh){let e=a.skeleton;i.get(e)!==o&&(e.update(),i.set(e,o))}return l}function o(){i=new WeakMap}function s(e){let t=e.target;t.removeEventListener(`dispose`,s),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:a,dispose:o}}var $i=class extends It{constructor(e,t,n,r,i,a,o,s,c,l=ue){if(l!==1026&&l!==1027)throw Error(`DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);n===void 0&&l===1026&&(n=P),n===void 0&&l===1027&&(n=ie),super(null,r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=o===void 0?w:o,this.minFilter=s===void 0?w:s,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},ea=new It,ta=new $i(1,1),na=new Bt,ra=new Vt,ia=new ri,aa=[],oa=[],sa=new Float32Array(16),ca=new Float32Array(9),la=new Float32Array(4);function ua(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=aa[i];if(a===void 0&&(a=new Float32Array(i),aa[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function da(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function fa(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function pa(e,t){let n=oa[t];n===void 0&&(n=new Int32Array(t),oa[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function ma(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function ha(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(da(n,t))return;e.uniform2fv(this.addr,t),fa(n,t)}}function ga(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(da(n,t))return;e.uniform3fv(this.addr,t),fa(n,t)}}function _a(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(da(n,t))return;e.uniform4fv(this.addr,t),fa(n,t)}}function va(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(da(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),fa(n,t)}else{if(da(n,r))return;la.set(r),e.uniformMatrix2fv(this.addr,!1,la),fa(n,r)}}function ya(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(da(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),fa(n,t)}else{if(da(n,r))return;ca.set(r),e.uniformMatrix3fv(this.addr,!1,ca),fa(n,r)}}function ba(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(da(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),fa(n,t)}else{if(da(n,r))return;sa.set(r),e.uniformMatrix4fv(this.addr,!1,sa),fa(n,r)}}function xa(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function Sa(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(da(n,t))return;e.uniform2iv(this.addr,t),fa(n,t)}}function Ca(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(da(n,t))return;e.uniform3iv(this.addr,t),fa(n,t)}}function wa(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(da(n,t))return;e.uniform4iv(this.addr,t),fa(n,t)}}function Ta(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function Ea(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(da(n,t))return;e.uniform2uiv(this.addr,t),fa(n,t)}}function Da(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(da(n,t))return;e.uniform3uiv(this.addr,t),fa(n,t)}}function Oa(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(da(n,t))return;e.uniform4uiv(this.addr,t),fa(n,t)}}function ka(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;this.type===e.SAMPLER_2D_SHADOW?(ta.compareFunction=515,a=ta):a=ea,n.setTexture2D(t||a,i)}function Aa(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||ra,i)}function ja(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTextureCube(t||ia,i)}function Ma(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||na,i)}function Na(e){switch(e){case 5126:return ma;case 35664:return ha;case 35665:return ga;case 35666:return _a;case 35674:return va;case 35675:return ya;case 35676:return ba;case 5124:case 35670:return xa;case 35667:case 35671:return Sa;case 35668:case 35672:return Ca;case 35669:case 35673:return wa;case 5125:return Ta;case 36294:return Ea;case 36295:return Da;case 36296:return Oa;case 35678:case 36198:case 36298:case 36306:case 35682:return ka;case 35679:case 36299:case 36307:return Aa;case 35680:case 36300:case 36308:case 36293:return ja;case 36289:case 36303:case 36311:case 36292:return Ma}}function Pa(e,t){e.uniform1fv(this.addr,t)}function Fa(e,t){let n=ua(t,this.size,2);e.uniform2fv(this.addr,n)}function Ia(e,t){let n=ua(t,this.size,3);e.uniform3fv(this.addr,n)}function La(e,t){let n=ua(t,this.size,4);e.uniform4fv(this.addr,n)}function Ra(e,t){let n=ua(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function za(e,t){let n=ua(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Ba(e,t){let n=ua(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Va(e,t){e.uniform1iv(this.addr,t)}function Ha(e,t){e.uniform2iv(this.addr,t)}function Ua(e,t){e.uniform3iv(this.addr,t)}function Wa(e,t){e.uniform4iv(this.addr,t)}function Ga(e,t){e.uniform1uiv(this.addr,t)}function Ka(e,t){e.uniform2uiv(this.addr,t)}function qa(e,t){e.uniform3uiv(this.addr,t)}function Ja(e,t){e.uniform4uiv(this.addr,t)}function Ya(e,t,n){let r=this.cache,i=t.length,a=pa(n,i);da(r,a)||(e.uniform1iv(this.addr,a),fa(r,a));for(let e=0;e!==i;++e)n.setTexture2D(t[e]||ea,a[e])}function Xa(e,t,n){let r=this.cache,i=t.length,a=pa(n,i);da(r,a)||(e.uniform1iv(this.addr,a),fa(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||ra,a[e])}function Za(e,t,n){let r=this.cache,i=t.length,a=pa(n,i);da(r,a)||(e.uniform1iv(this.addr,a),fa(r,a));for(let e=0;e!==i;++e)n.setTextureCube(t[e]||ia,a[e])}function Qa(e,t,n){let r=this.cache,i=t.length,a=pa(n,i);da(r,a)||(e.uniform1iv(this.addr,a),fa(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||na,a[e])}function $a(e){switch(e){case 5126:return Pa;case 35664:return Fa;case 35665:return Ia;case 35666:return La;case 35674:return Ra;case 35675:return za;case 35676:return Ba;case 5124:case 35670:return Va;case 35667:case 35671:return Ha;case 35668:case 35672:return Ua;case 35669:case 35673:return Wa;case 5125:return Ga;case 36294:return Ka;case 36295:return qa;case 36296:return Ja;case 35678:case 36198:case 36298:case 36306:case 35682:return Ya;case 35679:case 36299:case 36307:return Xa;case 35680:case 36300:case 36308:case 36293:return Za;case 36289:case 36303:case 36311:case 36292:return Qa}}var eo=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Na(t.type)}},to=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=$a(t.type)}},no=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},ro=/(\w+)(\])?(\[|\.)?/g;function io(e,t){e.seq.push(t),e.map[t.id]=t}function ao(e,t,n){let r=e.name,i=r.length;for(ro.lastIndex=0;;){let a=ro.exec(r),o=ro.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){io(n,l===void 0?new eo(s,e,t):new to(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new no(s),io(n,e)),n=e}}}var oo=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);ao(n,e.getUniformLocation(t,n.name),this)}}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function so(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var co=37297,lo=0;function uo(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var fo=new W;function po(e){G._getMatrix(fo,G.workingColorSpace,e);let t=`mat3( ${fo.elements.map(e=>e.toFixed(4))} )`;switch(G.getTransfer(e)){case et:return[t,`LinearTransferOETF`];case tt:return[t,`sRGBTransferOETF`];default:return console.warn(`THREE.WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function mo(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=e.getShaderInfoLog(t).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+uo(e.getShaderSource(t),r)}return i}function ho(e,t){let n=po(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,`}`].join(`
`)}function go(e,t){let n;switch(t){case 1:n=`Linear`;break;case 2:n=`Reinhard`;break;case 3:n=`Cineon`;break;case 4:n=`ACESFilmic`;break;case 6:n=`AgX`;break;case 7:n=`Neutral`;break;case 5:n=`Custom`;break;default:console.warn(`THREE.WebGLProgram: Unsupported toneMapping:`,t),n=`Linear`}return`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var _o=new K;function vo(){return G.getLuminanceCoefficients(_o),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${_o.x.toFixed(4)}, ${_o.y.toFixed(4)}, ${_o.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function yo(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(So).join(`
`)}function bo(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function xo(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function So(e){return e!==``}function Co(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function wo(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var To=/^[ \t]*#include +<([\w\d./]+)>/gm;function Eo(e){return e.replace(To,Oo)}var Do=new Map;function Oo(e,t){let n=Z[t];if(n===void 0){let e=Do.get(t);if(e!==void 0)n=Z[e],console.warn(`THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.`,t,e);else throw Error(`Can not resolve #include <`+t+`>`)}return Eo(n)}var ko=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ao(e){return e.replace(ko,jo)}function jo(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Mo(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}function No(e){let t=`SHADOWMAP_TYPE_BASIC`;return e.shadowMapType===1?t=`SHADOWMAP_TYPE_PCF`:e.shadowMapType===2?t=`SHADOWMAP_TYPE_PCF_SOFT`:e.shadowMapType===3&&(t=`SHADOWMAP_TYPE_VSM`),t}function Po(e){let t=`ENVMAP_TYPE_CUBE`;if(e.envMap)switch(e.envMapMode){case 301:case 302:t=`ENVMAP_TYPE_CUBE`;break;case 306:t=`ENVMAP_TYPE_CUBE_UV`}return t}function Fo(e){let t=`ENVMAP_MODE_REFLECTION`;if(e.envMap)switch(e.envMapMode){case 302:t=`ENVMAP_MODE_REFRACTION`}return t}function Io(e){let t=`ENVMAP_BLENDING_NONE`;if(e.envMap)switch(e.combine){case 0:t=`ENVMAP_BLENDING_MULTIPLY`;break;case 1:t=`ENVMAP_BLENDING_MIX`;break;case 2:t=`ENVMAP_BLENDING_ADD`}return t}function Lo(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,r=1/t;return{texelWidth:1/(3*Math.max(2**n,112)),texelHeight:r,maxMip:n}}function Ro(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=No(n),l=Po(n),u=Fo(n),d=Io(n),f=Lo(n),p=yo(n),m=bo(a),h=i.createProgram(),g,_,v=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(So).join(`
`),g.length>0&&(g+=`
`),_=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m].filter(So).join(`
`),_.length>0&&(_+=`
`)):(g=[Mo(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGDEPTHBUF`:``,n.reverseDepthBuffer?`#define USE_REVERSEDEPTHBUF`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(So).join(`
`),_=[Mo(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,m,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,f?`#define CUBEUV_TEXEL_WIDTH `+f.texelWidth:``,f?`#define CUBEUV_TEXEL_HEIGHT `+f.texelHeight:``,f?`#define CUBEUV_MAX_MIP `+f.maxMip+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor||n.batchingColor?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGDEPTHBUF`:``,n.reverseDepthBuffer?`#define USE_REVERSEDEPTHBUF`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Z.tonemapping_pars_fragment,n.toneMapping===0?``:go(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Z.colorspace_pars_fragment,ho(`linearToOutputTexel`,n.outputColorSpace),vo(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(So).join(`
`)),o=Eo(o),o=Co(o,n),o=wo(o,n),s=Eo(s),s=Co(s,n),s=wo(s,n),o=Ao(o),s=Ao(s),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+g,_=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+_);let y=v+g+o,b=v+_+s,x=so(i,i.VERTEX_SHADER,y),S=so(i,i.FRAGMENT_SHADER,b);i.attachShader(h,x),i.attachShader(h,S),n.index0AttributeName===void 0?n.morphTargets===!0&&i.bindAttribLocation(h,0,`position`):i.bindAttribLocation(h,0,n.index0AttributeName),i.linkProgram(h);function C(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(h).trim(),r=i.getShaderInfoLog(x).trim(),a=i.getShaderInfoLog(S).trim(),o=!0,s=!0;if(i.getProgramParameter(h,i.LINK_STATUS)===!1){if(o=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,h,x,S);else{let e=mo(i,x,`vertex`),r=mo(i,S,`fragment`);console.error(`THREE.WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(h,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+n+`
`+e+`
`+r)}}else n===``?(r===``||a===``)&&(s=!1):console.warn(`THREE.WebGLProgram: Program Info Log:`,n);s&&(t.diagnostics={runnable:o,programLog:n,vertexShader:{log:r,prefix:g},fragmentShader:{log:a,prefix:_}})}i.deleteShader(x),i.deleteShader(S),w=new oo(i,h),T=xo(i,h)}let w;this.getUniforms=function(){return w===void 0&&C(this),w};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let E=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return E===!1&&(E=i.getProgramParameter(h,co)),E},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(h),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=lo++,this.cacheKey=t,this.usedTimes=1,this.program=h,this.vertexShader=x,this.fragmentShader=S,this}var zo=0,Bo=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,r=this._getShaderStage(t),i=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(r)===!1&&(a.add(r),r.usedTimes++),a.has(i)===!1&&(a.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Vo(e),t.set(e,n)),n}},Vo=class{constructor(e){this.id=zo++,this.code=e,this.usedTimes=0}};function Ho(e,t,n,r,i,a,o){let s=new kn,c=new Bo,l=new Set,u=[],d=i.logarithmicDepthBuffer,f=i.vertexTextures,p=i.precision,m={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distanceRGBA`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function h(e){return l.add(e),e===0?`uv`:`uv${e}`}function g(a,s,u,g,_){let v=g.fog,y=_.geometry,b=a.isMeshStandardMaterial?g.environment:null,x=(a.isMeshStandardMaterial?n:t).get(a.envMap||b),S=x&&x.mapping===306?x.image.height:null,C=m[a.type];a.precision!==null&&(p=i.getMaxPrecision(a.precision),p!==a.precision&&console.warn(`THREE.WebGLProgram.getParameters:`,a.precision,`not supported, using`,p,`instead.`));let w=y.morphAttributes.position||y.morphAttributes.normal||y.morphAttributes.color,T=w===void 0?0:w.length,E=0;y.morphAttributes.position!==void 0&&(E=1),y.morphAttributes.normal!==void 0&&(E=2),y.morphAttributes.color!==void 0&&(E=3);let D,O,k,A;if(C){let e=hi[C];D=e.vertexShader,O=e.fragmentShader}else D=a.vertexShader,O=a.fragmentShader,c.update(a),k=c.getVertexShaderID(a),A=c.getFragmentShaderID(a);let j=e.getRenderTarget(),ee=e.state.buffers.depth.getReversed(),M=_.isInstancedMesh===!0,N=_.isBatchedMesh===!0,P=!!a.map,F=!!a.matcap,te=!!x,ne=!!a.aoMap,re=!!a.lightMap,ie=!!a.bumpMap,ae=!!a.normalMap,oe=!!a.displacementMap,I=!!a.emissiveMap,se=!!a.metalnessMap,ce=!!a.roughnessMap,le=a.anisotropy>0,ue=a.clearcoat>0,de=a.dispersion>0,fe=a.iridescence>0,pe=a.sheen>0,me=a.transmission>0,L=le&&!!a.anisotropyMap,he=ue&&!!a.clearcoatMap,R=ue&&!!a.clearcoatNormalMap,ge=ue&&!!a.clearcoatRoughnessMap,z=fe&&!!a.iridescenceMap,_e=fe&&!!a.iridescenceThicknessMap,B=pe&&!!a.sheenColorMap,V=pe&&!!a.sheenRoughnessMap,ve=!!a.specularMap,ye=!!a.specularColorMap,be=!!a.specularIntensityMap,xe=me&&!!a.transmissionMap,Se=me&&!!a.thicknessMap,Ce=!!a.gradientMap,we=!!a.alphaMap,Te=a.alphaTest>0,Ee=!!a.alphaHash,De=!!a.extensions,Oe=0;a.toneMapped&&(j===null||j.isXRRenderTarget===!0)&&(Oe=e.toneMapping);let ke={shaderID:C,shaderType:a.type,shaderName:a.name,vertexShader:D,fragmentShader:O,defines:a.defines,customVertexShaderID:k,customFragmentShaderID:A,isRawShaderMaterial:a.isRawShaderMaterial===!0,glslVersion:a.glslVersion,precision:p,batching:N,batchingColor:N&&_._colorsTexture!==null,instancing:M,instancingColor:M&&_.instanceColor!==null,instancingMorph:M&&_.morphTexture!==null,supportsVertexTextures:f,outputColorSpace:j===null?e.outputColorSpace:j.isXRRenderTarget===!0?j.texture.colorSpace:$e,alphaToCoverage:!!a.alphaToCoverage,map:P,matcap:F,envMap:te,envMapMode:te&&x.mapping,envMapCubeUVHeight:S,aoMap:ne,lightMap:re,bumpMap:ie,normalMap:ae,displacementMap:f&&oe,emissiveMap:I,normalMapObjectSpace:ae&&a.normalMapType===1,normalMapTangentSpace:ae&&a.normalMapType===0,metalnessMap:se,roughnessMap:ce,anisotropy:le,anisotropyMap:L,clearcoat:ue,clearcoatMap:he,clearcoatNormalMap:R,clearcoatRoughnessMap:ge,dispersion:de,iridescence:fe,iridescenceMap:z,iridescenceThicknessMap:_e,sheen:pe,sheenColorMap:B,sheenRoughnessMap:V,specularMap:ve,specularColorMap:ye,specularIntensityMap:be,transmission:me,transmissionMap:xe,thicknessMap:Se,gradientMap:Ce,opaque:a.transparent===!1&&a.blending===1&&a.alphaToCoverage===!1,alphaMap:we,alphaTest:Te,alphaHash:Ee,combine:a.combine,mapUv:P&&h(a.map.channel),aoMapUv:ne&&h(a.aoMap.channel),lightMapUv:re&&h(a.lightMap.channel),bumpMapUv:ie&&h(a.bumpMap.channel),normalMapUv:ae&&h(a.normalMap.channel),displacementMapUv:oe&&h(a.displacementMap.channel),emissiveMapUv:I&&h(a.emissiveMap.channel),metalnessMapUv:se&&h(a.metalnessMap.channel),roughnessMapUv:ce&&h(a.roughnessMap.channel),anisotropyMapUv:L&&h(a.anisotropyMap.channel),clearcoatMapUv:he&&h(a.clearcoatMap.channel),clearcoatNormalMapUv:R&&h(a.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ge&&h(a.clearcoatRoughnessMap.channel),iridescenceMapUv:z&&h(a.iridescenceMap.channel),iridescenceThicknessMapUv:_e&&h(a.iridescenceThicknessMap.channel),sheenColorMapUv:B&&h(a.sheenColorMap.channel),sheenRoughnessMapUv:V&&h(a.sheenRoughnessMap.channel),specularMapUv:ve&&h(a.specularMap.channel),specularColorMapUv:ye&&h(a.specularColorMap.channel),specularIntensityMapUv:be&&h(a.specularIntensityMap.channel),transmissionMapUv:xe&&h(a.transmissionMap.channel),thicknessMapUv:Se&&h(a.thicknessMap.channel),alphaMapUv:we&&h(a.alphaMap.channel),vertexTangents:!!y.attributes.tangent&&(ae||le),vertexColors:a.vertexColors,vertexAlphas:a.vertexColors===!0&&!!y.attributes.color&&y.attributes.color.itemSize===4,pointsUvs:_.isPoints===!0&&!!y.attributes.uv&&(P||we),fog:!!v,useFog:a.fog===!0,fogExp2:!!v&&v.isFogExp2,flatShading:a.flatShading===!0,sizeAttenuation:a.sizeAttenuation===!0,logarithmicDepthBuffer:d,reverseDepthBuffer:ee,skinning:_.isSkinnedMesh===!0,morphTargets:y.morphAttributes.position!==void 0,morphNormals:y.morphAttributes.normal!==void 0,morphColors:y.morphAttributes.color!==void 0,morphTargetsCount:T,morphTextureStride:E,numDirLights:s.directional.length,numPointLights:s.point.length,numSpotLights:s.spot.length,numSpotLightMaps:s.spotLightMap.length,numRectAreaLights:s.rectArea.length,numHemiLights:s.hemi.length,numDirLightShadows:s.directionalShadowMap.length,numPointLightShadows:s.pointShadowMap.length,numSpotLightShadows:s.spotShadowMap.length,numSpotLightShadowsWithMaps:s.numSpotLightShadowsWithMaps,numLightProbes:s.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:a.dithering,shadowMapEnabled:e.shadowMap.enabled&&u.length>0,shadowMapType:e.shadowMap.type,toneMapping:Oe,decodeVideoTexture:P&&a.map.isVideoTexture===!0&&G.getTransfer(a.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:I&&a.emissiveMap.isVideoTexture===!0&&G.getTransfer(a.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:a.premultipliedAlpha,doubleSided:a.side===2,flipSided:a.side===1,useDepthPacking:a.depthPacking>=0,depthPacking:a.depthPacking||0,index0AttributeName:a.index0AttributeName,extensionClipCullDistance:De&&a.extensions.clipCullDistance===!0&&r.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(De&&a.extensions.multiDraw===!0||N)&&r.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:r.has(`KHR_parallel_shader_compile`),customProgramCacheKey:a.customProgramCacheKey()};return ke.vertexUv1s=l.has(1),ke.vertexUv2s=l.has(2),ke.vertexUv3s=l.has(3),l.clear(),ke}function _(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(v(n,t),y(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function v(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapCubeUVHeight),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.morphAttributeCount),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function y(e,t){s.disableAll(),t.supportsVertexTextures&&s.enable(0),t.instancing&&s.enable(1),t.instancingColor&&s.enable(2),t.instancingMorph&&s.enable(3),t.matcap&&s.enable(4),t.envMap&&s.enable(5),t.normalMapObjectSpace&&s.enable(6),t.normalMapTangentSpace&&s.enable(7),t.clearcoat&&s.enable(8),t.iridescence&&s.enable(9),t.alphaTest&&s.enable(10),t.vertexColors&&s.enable(11),t.vertexAlphas&&s.enable(12),t.vertexUv1s&&s.enable(13),t.vertexUv2s&&s.enable(14),t.vertexUv3s&&s.enable(15),t.vertexTangents&&s.enable(16),t.anisotropy&&s.enable(17),t.alphaHash&&s.enable(18),t.batching&&s.enable(19),t.dispersion&&s.enable(20),t.batchingColor&&s.enable(21),e.push(s.mask),s.disableAll(),t.fog&&s.enable(0),t.useFog&&s.enable(1),t.flatShading&&s.enable(2),t.logarithmicDepthBuffer&&s.enable(3),t.reverseDepthBuffer&&s.enable(4),t.skinning&&s.enable(5),t.morphTargets&&s.enable(6),t.morphNormals&&s.enable(7),t.morphColors&&s.enable(8),t.premultipliedAlpha&&s.enable(9),t.shadowMapEnabled&&s.enable(10),t.doubleSided&&s.enable(11),t.flipSided&&s.enable(12),t.useDepthPacking&&s.enable(13),t.dithering&&s.enable(14),t.transmission&&s.enable(15),t.sheen&&s.enable(16),t.opaque&&s.enable(17),t.pointsUvs&&s.enable(18),t.decodeVideoTexture&&s.enable(19),t.decodeVideoTextureEmissive&&s.enable(20),t.alphaToCoverage&&s.enable(21),e.push(s.mask)}function b(e){let t=m[e.type],n;if(t){let e=hi[t];n=Gr.clone(e.uniforms)}else n=e.uniforms;return n}function x(t,n){let r;for(let e=0,t=u.length;e<t;e++){let t=u[e];if(t.cacheKey===n){r=t,++r.usedTimes;break}}return r===void 0&&(r=new Ro(e,n,t,a),u.push(r)),r}function S(e){if(--e.usedTimes===0){let t=u.indexOf(e);u[t]=u[u.length-1],u.pop(),e.destroy()}}function C(e){c.remove(e)}function w(){c.dispose()}return{getParameters:g,getProgramCacheKey:_,getUniforms:b,acquireProgram:x,releaseProgram:S,releaseShaderCache:C,programs:u,dispose:w}}function Uo(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function Wo(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.z===t.z?e.id-t.id:e.z-t.z:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Go(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Ko(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(n,r,i,a,o,s){let c=e[t];return c===void 0?(c={id:n.id,object:n,geometry:r,material:i,groupOrder:a,renderOrder:n.renderOrder,z:o,group:s},e[t]=c):(c.id=n.id,c.object=n,c.geometry=r,c.material=i,c.groupOrder=a,c.renderOrder=n.renderOrder,c.z=o,c.group=s),t++,c}function s(e,t,a,s,c,l){let u=o(e,t,a,s,c,l);a.transmission>0?r.push(u):a.transparent===!0?i.push(u):n.push(u)}function c(e,t,a,s,c,l){let u=o(e,t,a,s,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function l(e,t){n.length>1&&n.sort(e||Wo),r.length>1&&r.sort(t||Go),i.length>1&&i.sort(t||Go)}function u(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:s,unshift:c,finish:u,sort:l}}function qo(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new Ko,e.set(t,[i])):n>=r.length?(i=new Ko,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Jo(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`DirectionalLight`:n={direction:new K,color:new J};break;case`SpotLight`:n={position:new K,direction:new K,color:new J,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new K,color:new J,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new K,skyColor:new J,groundColor:new J};break;case`RectAreaLight`:n={color:new J,position:new K,halfWidth:new K,halfHeight:new K}}return e[t.id]=n,n}}}function Yo(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new U};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new U};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new U,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var Xo=0;function Zo(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function Qo(e){let t=new Jo,n=Yo(),r={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new K);let i=new K,a=new q,o=new q;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0;i.sort(Zo);for(let e=0,y=i.length;e<y;e++){let y=i[e],b=y.color,x=y.intensity,S=y.distance,C=y.shadow&&y.shadow.map?y.shadow.map.texture:null;if(y.isAmbientLight)a+=b.r*x,o+=b.g*x,s+=b.b*x;else if(y.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(y.sh.coefficients[e],x);v++}else if(y.isDirectionalLight){let e=t.get(y);if(e.color.copy(y.color).multiplyScalar(y.intensity),y.castShadow){let e=y.shadow,t=n.get(y);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[c]=t,r.directionalShadowMap[c]=C,r.directionalShadowMatrix[c]=y.shadow.matrix,p++}r.directional[c]=e,c++}else if(y.isSpotLight){let e=t.get(y);e.position.setFromMatrixPosition(y.matrixWorld),e.color.copy(b).multiplyScalar(x),e.distance=S,e.coneCos=Math.cos(y.angle),e.penumbraCos=Math.cos(y.angle*(1-y.penumbra)),e.decay=y.decay,r.spot[u]=e;let i=y.shadow;if(y.map&&(r.spotLightMap[g]=y.map,g++,i.updateMatrices(y),y.castShadow&&_++),r.spotLightMatrix[u]=i.matrix,y.castShadow){let e=n.get(y);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[u]=e,r.spotShadowMap[u]=C,h++}u++}else if(y.isRectAreaLight){let e=t.get(y);e.color.copy(b).multiplyScalar(x),e.halfWidth.set(y.width*.5,0,0),e.halfHeight.set(0,y.height*.5,0),r.rectArea[d]=e,d++}else if(y.isPointLight){let e=t.get(y);if(e.color.copy(y.color).multiplyScalar(y.intensity),e.distance=y.distance,e.decay=y.decay,y.castShadow){let e=y.shadow,t=n.get(y);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[l]=t,r.pointShadowMap[l]=C,r.pointShadowMatrix[l]=y.shadow.matrix,m++}r.point[l]=e,l++}else if(y.isHemisphereLight){let e=t.get(y);e.skyColor.copy(y.color).multiplyScalar(x),e.groundColor.copy(y.groundColor).multiplyScalar(x),r.hemi[f]=e,f++}}d>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=Q.LTC_FLOAT_1,r.rectAreaLTC2=Q.LTC_FLOAT_2):(r.rectAreaLTC1=Q.LTC_HALF_1,r.rectAreaLTC2=Q.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let y=r.hash;(y.directionalLength!==c||y.pointLength!==l||y.spotLength!==u||y.rectAreaLength!==d||y.hemiLength!==f||y.numDirectionalShadows!==p||y.numPointShadows!==m||y.numSpotShadows!==h||y.numSpotMaps!==g||y.numLightProbes!==v)&&(r.directional.length=c,r.spot.length=u,r.rectArea.length=d,r.point.length=l,r.hemi.length=f,r.directionalShadow.length=p,r.directionalShadowMap.length=p,r.pointShadow.length=m,r.pointShadowMap.length=m,r.spotShadow.length=h,r.spotShadowMap.length=h,r.directionalShadowMatrix.length=p,r.pointShadowMatrix.length=m,r.spotLightMatrix.length=h+g-_,r.spotLightMap.length=g,r.numSpotLightShadowsWithMaps=_,r.numLightProbes=v,y.directionalLength=c,y.pointLength=l,y.spotLength=u,y.rectAreaLength=d,y.hemiLength=f,y.numDirectionalShadows=p,y.numPointShadows=m,y.numSpotShadows=h,y.numSpotMaps=g,y.numLightProbes=v,r.version=Xo++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=t.matrixWorldInverse;for(let t=0,f=e.length;t<f;t++){let f=e[t];if(f.isDirectionalLight){let e=r.directional[n];e.direction.setFromMatrixPosition(f.matrixWorld),i.setFromMatrixPosition(f.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(d),n++}else if(f.isSpotLight){let e=r.spot[c];e.position.setFromMatrixPosition(f.matrixWorld),e.position.applyMatrix4(d),e.direction.setFromMatrixPosition(f.matrixWorld),i.setFromMatrixPosition(f.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(d),c++}else if(f.isRectAreaLight){let e=r.rectArea[l];e.position.setFromMatrixPosition(f.matrixWorld),e.position.applyMatrix4(d),o.identity(),a.copy(f.matrixWorld),a.premultiply(d),o.extractRotation(a),e.halfWidth.set(f.width*.5,0,0),e.halfHeight.set(0,f.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),l++}else if(f.isPointLight){let e=r.point[s];e.position.setFromMatrixPosition(f.matrixWorld),e.position.applyMatrix4(d),s++}else if(f.isHemisphereLight){let e=r.hemi[u];e.direction.setFromMatrixPosition(f.matrixWorld),e.direction.transformDirection(d),u++}}}return{setup:s,setupView:c,state:r}}function $o(e){let t=new Qo(e),n=[],r=[];function i(e){l.camera=e,n.length=0,r.length=0}function a(e){n.push(e)}function o(e){r.push(e)}function s(){t.setup(n)}function c(e){t.setupView(n,e)}let l={lightsArray:n,shadowsArray:r,camera:null,lights:t,transmissionRenderTarget:{}};return{init:i,state:l,setupLights:s,setupLightsView:c,pushLight:a,pushShadow:o}}function es(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new $o(e),t.set(n,[a])):r>=i.length?(a=new $o(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var ts=class extends fr{static get type(){return`MeshDepthMaterial`}constructor(e){super(),this.isMeshDepthMaterial=!0,this.depthPacking=Xe,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ns=class extends fr{static get type(){return`MeshDistanceMaterial`}constructor(e){super(),this.isMeshDistanceMaterial=!0,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}},rs=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,is=`uniform sampler2D shadow_pass;
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
}`;function as(e,t,n){let r=new di,i=new U,a=new U,o=new Lt,s=new ts({depthPacking:Ze}),c=new ns,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new Jr({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new U},radius:{value:4}},vertexShader:rs,fragmentShader:is}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new Er;m.setAttribute(`position`,new gr(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new X(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==3&&this.type===3,m=_===3&&this.type!==3;for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){console.warn(`THREE.WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let h=d.getFrameExtents();if(i.multiply(h),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/h.x),i.x=a.x*h.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/h.y),i.y=a.y*h.y,d.mapSize.y=a.y)),d.map===null||p===!0||m===!0){let e=this.type===3?{}:{minFilter:w,magFilter:w};d.map!==null&&d.map.dispose(),d.map=new zt(i.x,i.y,e),d.map.texture.name=l.name+`.shadowMap`,d.camera.updateProjectionMatrix()}e.setRenderTarget(d.map),e.clear();let g=d.getViewportCount();for(let e=0;e<g;e++){let t=d.getViewport(e);o.set(a.x*t.x,a.y*t.y,a.x*t.z,a.y*t.w),f.viewport(o),d.updateMatrices(l,e),r=d.getFrustum(),b(n,s,d.camera,l,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null&&(n.mapPass=new zt(i.x,i.y)),f.uniforms.shadow_pass.value=n.map.texture,f.uniforms.resolution.value=n.mapSize,f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value=n.mapSize,p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s){if(n.visible===!1)return;if(n.layers.test(i.layers)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&s===3)&&(!n.frustumCulled||r.intersectsObject(n))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),c=n.material;if(Array.isArray(c)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=c[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,s);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(c.visible){let t=y(n,c,o,s);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let c=n.children;for(let e=0,t=c.length;e<t;e++)b(c[e],i,a,o,s)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}var os={0:1,2:6,4:7,3:5,1:0,6:2,7:4,5:3};function ss(e,t){function n(){let t=!1,n=new Lt,r=null,i=new Lt(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let e=t.get(`EXT_clip_control`);r?e.clipControlEXT(e.LOWER_LEFT_EXT,e.ZERO_TO_ONE_EXT):e.clipControlEXT(e.LOWER_LEFT_EXT,e.NEGATIVE_ONE_TO_ONE_EXT);let n=o;o=null,this.setClear(n)}r=e},getReversed:function(){return r},setTest:function(t){t?I(e.DEPTH_TEST):se(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=os[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(r&&(t=1-t),e.clearDepth(t),o=t)},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?I(e.STENCIL_TEST):se(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c=new WeakMap,l=new WeakMap,u={},d={},f=new WeakMap,p=[],m=null,h=!1,g=null,_=null,v=null,y=null,b=null,x=null,S=null,C=new J(0,0,0),w=0,T=!1,E=null,D=null,O=null,k=null,A=null,j=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),ee=!1,M=0,N=e.getParameter(e.VERSION);N.indexOf(`WebGL`)===-1?N.indexOf(`OpenGL ES`)!==-1&&(M=parseFloat(/^OpenGL ES (\d)/.exec(N)[1]),ee=M>=2):(M=parseFloat(/^WebGL (\d)/.exec(N)[1]),ee=M>=1);let P=null,F={},te=e.getParameter(e.SCISSOR_BOX),ne=e.getParameter(e.VIEWPORT),re=new Lt().fromArray(te),ie=new Lt().fromArray(ne);function ae(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let oe={};oe[e.TEXTURE_2D]=ae(e.TEXTURE_2D,e.TEXTURE_2D,1),oe[e.TEXTURE_CUBE_MAP]=ae(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),oe[e.TEXTURE_2D_ARRAY]=ae(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),oe[e.TEXTURE_3D]=ae(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),I(e.DEPTH_TEST),o.setFunc(3),L(!1),he(1),I(e.CULL_FACE),pe(0);function I(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function se(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function ce(t,n){return d[t]!==n&&(e.bindFramebuffer(t,n),d[t]=n,t===e.DRAW_FRAMEBUFFER&&(d[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(d[e.DRAW_FRAMEBUFFER]=n),!0)}function le(t,n){let r=p,i=!1;if(t){r=f.get(n),r===void 0&&(r=[],f.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function ue(t){return m!==t&&(e.useProgram(t),m=t,!0)}let de={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};de[103]=e.MIN,de[104]=e.MAX;let fe={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function pe(t,n,r,i,a,o,s,c,l,u){if(t===0)h===!0&&(se(e.BLEND),h=!1);else if(h===!1&&(I(e.BLEND),h=!0),t!==5){if(t!==g||u!==T){if((_!==100||b!==100)&&(e.blendEquation(e.FUNC_ADD),_=100,b=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.ZERO,e.SRC_COLOR,e.ZERO,e.SRC_ALPHA);break;default:console.error(`THREE.WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.SRC_ALPHA,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFunc(e.ZERO,e.SRC_COLOR);break;default:console.error(`THREE.WebGLState: Invalid blending: `,t)}v=null,y=null,x=null,S=null,C.set(0,0,0),w=0,g=t,T=u}}else a||=n,o||=r,s||=i,(n!==_||a!==b)&&(e.blendEquationSeparate(de[n],de[a]),_=n,b=a),(r!==v||i!==y||o!==x||s!==S)&&(e.blendFuncSeparate(fe[r],fe[i],fe[o],fe[s]),v=r,y=i,x=o,S=s),(c.equals(C)===!1||l!==w)&&(e.blendColor(c.r,c.g,c.b,l),C.copy(c),w=l),g=t,T=!1}function me(t,n){t.side===2?se(e.CULL_FACE):I(e.CULL_FACE);let r=t.side===1;n&&(r=!r),L(r),t.blending===1&&t.transparent===!1?pe(0):pe(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),ge(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?I(e.SAMPLE_ALPHA_TO_COVERAGE):se(e.SAMPLE_ALPHA_TO_COVERAGE)}function L(t){E!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),E=t)}function he(t){t===0?se(e.CULL_FACE):(I(e.CULL_FACE),t!==D&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),D=t}function R(t){t!==O&&(ee&&e.lineWidth(t),O=t)}function ge(t,n,r){t?(I(e.POLYGON_OFFSET_FILL),(k!==n||A!==r)&&(e.polygonOffset(n,r),k=n,A=r)):se(e.POLYGON_OFFSET_FILL)}function z(t){t?I(e.SCISSOR_TEST):se(e.SCISSOR_TEST)}function _e(t){t===void 0&&(t=e.TEXTURE0+j-1),P!==t&&(e.activeTexture(t),P=t)}function B(t,n,r){r===void 0&&(r=P===null?e.TEXTURE0+j-1:P);let i=F[r];i===void 0&&(i={type:void 0,texture:void 0},F[r]=i),(i.type!==t||i.texture!==n)&&(P!==r&&(e.activeTexture(r),P=r),e.bindTexture(t,n||oe[t]),i.type=t,i.texture=n)}function V(){let t=F[P];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function ve(){try{e.compressedTexImage2D.apply(e,arguments)}catch(e){console.error(`THREE.WebGLState:`,e)}}function ye(){try{e.compressedTexImage3D.apply(e,arguments)}catch(e){console.error(`THREE.WebGLState:`,e)}}function be(){try{e.texSubImage2D.apply(e,arguments)}catch(e){console.error(`THREE.WebGLState:`,e)}}function xe(){try{e.texSubImage3D.apply(e,arguments)}catch(e){console.error(`THREE.WebGLState:`,e)}}function Se(){try{e.compressedTexSubImage2D.apply(e,arguments)}catch(e){console.error(`THREE.WebGLState:`,e)}}function Ce(){try{e.compressedTexSubImage3D.apply(e,arguments)}catch(e){console.error(`THREE.WebGLState:`,e)}}function we(){try{e.texStorage2D.apply(e,arguments)}catch(e){console.error(`THREE.WebGLState:`,e)}}function Te(){try{e.texStorage3D.apply(e,arguments)}catch(e){console.error(`THREE.WebGLState:`,e)}}function Ee(){try{e.texImage2D.apply(e,arguments)}catch(e){console.error(`THREE.WebGLState:`,e)}}function De(){try{e.texImage3D.apply(e,arguments)}catch(e){console.error(`THREE.WebGLState:`,e)}}function Oe(t){re.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),re.copy(t))}function ke(t){ie.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),ie.copy(t))}function Ae(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),r.set(t,i))}function je(t,n){let r=l.get(n).get(t);c.get(n)!==r&&(e.uniformBlockBinding(n,r,t.__bindingPointIndex),c.set(n,r))}function Me(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),u={},P=null,F={},d={},f=new WeakMap,p=[],m=null,h=!1,g=null,_=null,v=null,y=null,b=null,x=null,S=null,C=new J(0,0,0),w=0,T=!1,E=null,D=null,O=null,k=null,A=null,re.set(0,0,e.canvas.width,e.canvas.height),ie.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:I,disable:se,bindFramebuffer:ce,drawBuffers:le,useProgram:ue,setBlending:pe,setMaterial:me,setFlipSided:L,setCullFace:he,setLineWidth:R,setPolygonOffset:ge,setScissorTest:z,activeTexture:_e,bindTexture:B,unbindTexture:V,compressedTexImage2D:ve,compressedTexImage3D:ye,texImage2D:Ee,texImage3D:De,updateUBOMapping:Ae,uniformBlockBinding:je,texStorage2D:we,texStorage3D:Te,texSubImage2D:be,texSubImage3D:xe,compressedTexSubImage2D:Se,compressedTexSubImage3D:Ce,scissor:Oe,viewport:ke,reset:Me}}function cs(e,t,n,r){let i=ls(r);switch(n){case oe:return e*t;case ce:return e*t;case le:return e*t*2;case fe:return e*t/i.components*i.byteLength;case pe:return e*t/i.components*i.byteLength;case me:return e*t*2/i.components*i.byteLength;case L:return e*t*2/i.components*i.byteLength;case I:return e*t*3/i.components*i.byteLength;case se:return e*t*4/i.components*i.byteLength;case he:return e*t*4/i.components*i.byteLength;case R:case ge:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case z:case _e:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case V:case ye:return Math.max(e,16)*Math.max(t,8)/4;case B:case ve:return Math.max(e,8)*Math.max(t,8)/2;case be:case xe:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Se:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Ce:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case we:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case Te:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case Ee:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case De:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case Oe:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case ke:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Ae:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case je:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Me:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Ne:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Pe:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Fe:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Ie:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Le:case Re:case ze:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Be:case Ve:return Math.ceil(e/4)*Math.ceil(t/4)*8;case He:case Ue:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function ls(e){switch(e){case A:case j:return{byteLength:1,components:1};case M:case ee:case te:return{byteLength:2,components:1};case ne:case re:return{byteLength:2,components:4};case P:case N:case F:return{byteLength:4,components:1};case ae:return{byteLength:4,components:3}}throw Error(`Unknown texture type ${e}.`)}function us(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new U,u=new WeakMap,d,f=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function m(e,t){return p?new OffscreenCanvas(e,t):gt(`canvas`)}function h(e,t,n){let r=1,i=we(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);d===void 0&&(d=m(n,a));let o=t?m(n,a):d;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),console.warn(`THREE.WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&console.warn(`THREE.WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function g(e){return e.generateMipmaps}function _(t){e.generateMipmap(t)}function v(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function y(n,r,i,a,o=!1){if(n!==null){if(e[n]!==void 0)return e[n];console.warn(`THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let s=r;if(r===e.RED&&(i===e.FLOAT&&(s=e.R32F),i===e.HALF_FLOAT&&(s=e.R16F),i===e.UNSIGNED_BYTE&&(s=e.R8)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(s=e.R8UI),i===e.UNSIGNED_SHORT&&(s=e.R16UI),i===e.UNSIGNED_INT&&(s=e.R32UI),i===e.BYTE&&(s=e.R8I),i===e.SHORT&&(s=e.R16I),i===e.INT&&(s=e.R32I)),r===e.RG&&(i===e.FLOAT&&(s=e.RG32F),i===e.HALF_FLOAT&&(s=e.RG16F),i===e.UNSIGNED_BYTE&&(s=e.RG8)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(s=e.RG8UI),i===e.UNSIGNED_SHORT&&(s=e.RG16UI),i===e.UNSIGNED_INT&&(s=e.RG32UI),i===e.BYTE&&(s=e.RG8I),i===e.SHORT&&(s=e.RG16I),i===e.INT&&(s=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(s=e.RGB8UI),i===e.UNSIGNED_SHORT&&(s=e.RGB16UI),i===e.UNSIGNED_INT&&(s=e.RGB32UI),i===e.BYTE&&(s=e.RGB8I),i===e.SHORT&&(s=e.RGB16I),i===e.INT&&(s=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(s=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(s=e.RGBA16UI),i===e.UNSIGNED_INT&&(s=e.RGBA32UI),i===e.BYTE&&(s=e.RGBA8I),i===e.SHORT&&(s=e.RGBA16I),i===e.INT&&(s=e.RGBA32I)),r===e.RGB&&i===e.UNSIGNED_INT_5_9_9_9_REV&&(s=e.RGB9_E5),r===e.RGBA){let t=o?et:G.getTransfer(a);i===e.FLOAT&&(s=e.RGBA32F),i===e.HALF_FLOAT&&(s=e.RGBA16F),i===e.UNSIGNED_BYTE&&(s=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT_4_4_4_4&&(s=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(s=e.RGB5_A1)}return(s===e.R16F||s===e.R32F||s===e.RG16F||s===e.RG32F||s===e.RGBA16F||s===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),s}function b(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,console.warn(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function A(e,t){return g(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps!==void 0&&e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function j(e){let t=e.target;t.removeEventListener(`dispose`,j),M(t),t.isVideoTexture&&u.delete(t)}function ee(e){let t=e.target;t.removeEventListener(`dispose`,ee),P(t)}function M(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=f.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&N(e),Object.keys(i).length===0&&f.delete(n)}r.remove(e)}function N(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=f.get(i);delete a[n.__cacheKey],o.memory.textures--}function P(t){let n=r.get(t);if(t.depthTexture&&(t.depthTexture.dispose(),r.remove(t.depthTexture)),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let i=t.textures;for(let t=0,n=i.length;t<n;t++){let n=r.get(i[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(i[t])}r.remove(t)}let F=0;function te(){F=0}function ne(){let e=F;return e>=i.maxTextures&&console.warn(`THREE.WebGLTextures: Trying to use `+e+` texture units while this GPU supports only `+i.maxTextures),F+=1,e}function re(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function ie(t,i){let a=r.get(t);if(t.isVideoTexture&&Se(t),t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)console.warn(`THREE.WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)console.warn(`THREE.WebGLRenderer: Texture marked for update but image is incomplete`);else{pe(a,t,i);return}}n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function ae(t,i){let a=r.get(t);t.version>0&&a.__version!==t.version?pe(a,t,i):n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i)}function oe(t,i){let a=r.get(t);t.version>0&&a.__version!==t.version?pe(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function I(t,i){let a=r.get(t);t.version>0&&a.__version!==t.version?me(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let se={[x]:e.REPEAT,[S]:e.CLAMP_TO_EDGE,[C]:e.MIRRORED_REPEAT},ce={[w]:e.NEAREST,[T]:e.NEAREST_MIPMAP_NEAREST,[E]:e.NEAREST_MIPMAP_LINEAR,[D]:e.LINEAR,[O]:e.LINEAR_MIPMAP_NEAREST,[k]:e.LINEAR_MIPMAP_LINEAR},le={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function ue(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&console.warn(`THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,se[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,se[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,se[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,ce[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,ce[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,le[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function fe(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,j));let i=n.source,a=f.get(i);a===void 0&&(a={},f.set(i,a));let s=re(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&N(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function pe(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=fe(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let d=r.get(u);if(u.version!==d.__version||l===!0){n.activeTexture(e.TEXTURE0+s);let t=G.getPrimaries(G.workingColorSpace),r=o.colorSpace===``?null:G.getPrimaries(o.colorSpace),f=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),e.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,f);let p=h(o.image,!1,i.maxTextureSize);p=Ce(o,p);let m=a.convert(o.format,o.colorSpace),v=a.convert(o.type),x=y(o.internalFormat,m,v,o.colorSpace,o.isVideoTexture);ue(c,o);let S,C=o.mipmaps,w=o.isVideoTexture!==!0,T=d.__version===void 0||l===!0,E=u.dataReady,D=A(o,p);if(o.isDepthTexture)x=b(o.format===de,o.type),T&&(w?n.texStorage2D(e.TEXTURE_2D,1,x,p.width,p.height):n.texImage2D(e.TEXTURE_2D,0,x,p.width,p.height,0,m,v,null));else if(o.isDataTexture){if(C.length>0){w&&T&&n.texStorage2D(e.TEXTURE_2D,D,x,C[0].width,C[0].height);for(let t=0,r=C.length;t<r;t++)S=C[t],w?E&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,S.width,S.height,m,v,S.data):n.texImage2D(e.TEXTURE_2D,t,x,S.width,S.height,0,m,v,S.data);o.generateMipmaps=!1}else w?(T&&n.texStorage2D(e.TEXTURE_2D,D,x,p.width,p.height),E&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,p.width,p.height,m,v,p.data)):n.texImage2D(e.TEXTURE_2D,0,x,p.width,p.height,0,m,v,p.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){w&&T&&n.texStorage3D(e.TEXTURE_2D_ARRAY,D,x,C[0].width,C[0].height,p.depth);for(let t=0,r=C.length;t<r;t++)if(S=C[t],o.format!==1023){if(m!==null){if(w){if(E){if(o.layerUpdates.size>0){let r=cs(S.width,S.height,o.format,o.type);for(let i of o.layerUpdates){let a=S.data.subarray(i*r/S.data.BYTES_PER_ELEMENT,(i+1)*r/S.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,t,0,0,i,S.width,S.height,1,m,a)}o.clearLayerUpdates()}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,t,0,0,0,S.width,S.height,p.depth,m,S.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,t,x,S.width,S.height,p.depth,0,S.data,0,0)}else console.warn(`THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else w?E&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,t,0,0,0,S.width,S.height,p.depth,m,v,S.data):n.texImage3D(e.TEXTURE_2D_ARRAY,t,x,S.width,S.height,p.depth,0,m,v,S.data)}else{w&&T&&n.texStorage2D(e.TEXTURE_2D,D,x,C[0].width,C[0].height);for(let t=0,r=C.length;t<r;t++)S=C[t],o.format===1023?w?E&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,S.width,S.height,m,v,S.data):n.texImage2D(e.TEXTURE_2D,t,x,S.width,S.height,0,m,v,S.data):m===null?console.warn(`THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):w?E&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,S.width,S.height,m,S.data):n.compressedTexImage2D(e.TEXTURE_2D,t,x,S.width,S.height,0,S.data)}}else if(o.isDataArrayTexture){if(w){if(T&&n.texStorage3D(e.TEXTURE_2D_ARRAY,D,x,p.width,p.height,p.depth),E){if(o.layerUpdates.size>0){let t=cs(p.width,p.height,o.format,o.type);for(let r of o.layerUpdates){let i=p.data.subarray(r*t/p.data.BYTES_PER_ELEMENT,(r+1)*t/p.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,r,p.width,p.height,1,m,v,i)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,p.width,p.height,p.depth,m,v,p.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,x,p.width,p.height,p.depth,0,m,v,p.data)}else if(o.isData3DTexture)w?(T&&n.texStorage3D(e.TEXTURE_3D,D,x,p.width,p.height,p.depth),E&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,p.width,p.height,p.depth,m,v,p.data)):n.texImage3D(e.TEXTURE_3D,0,x,p.width,p.height,p.depth,0,m,v,p.data);else if(o.isFramebufferTexture){if(T){if(w)n.texStorage2D(e.TEXTURE_2D,D,x,p.width,p.height);else{let t=p.width,r=p.height;for(let i=0;i<D;i++)n.texImage2D(e.TEXTURE_2D,i,x,t,r,0,m,v,null),t>>=1,r>>=1}}}else if(C.length>0){if(w&&T){let t=we(C[0]);n.texStorage2D(e.TEXTURE_2D,D,x,t.width,t.height)}for(let t=0,r=C.length;t<r;t++)S=C[t],w?E&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,m,v,S):n.texImage2D(e.TEXTURE_2D,t,x,m,v,S);o.generateMipmaps=!1}else if(w){if(T){let t=we(p);n.texStorage2D(e.TEXTURE_2D,D,x,t.width,t.height)}E&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,m,v,p)}else n.texImage2D(e.TEXTURE_2D,0,x,m,v,p);g(o)&&_(c),d.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function me(t,o,s){if(o.image.length!==6)return;let c=fe(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=G.getPrimaries(G.workingColorSpace),r=o.colorSpace===``?null:G.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),e.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=h(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=Ce(o,m[e]);let v=m[0],b=a.convert(o.format,o.colorSpace),x=a.convert(o.type),S=y(o.internalFormat,b,x,o.colorSpace),C=o.isVideoTexture!==!0,w=u.__version===void 0||c===!0,T=l.dataReady,E=A(o,v);ue(e.TEXTURE_CUBE_MAP,o);let D;if(f){C&&w&&n.texStorage2D(e.TEXTURE_CUBE_MAP,E,S,v.width,v.height);for(let t=0;t<6;t++){D=m[t].mipmaps;for(let r=0;r<D.length;r++){let i=D[r];o.format===1023?C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,b,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,S,i.width,i.height,0,b,x,i.data):b===null?console.warn(`THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):C?T&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,b,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,S,i.width,i.height,0,i.data)}}}else{if(D=o.mipmaps,C&&w){D.length>0&&E++;let t=we(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,E,S,t.width,t.height)}for(let t=0;t<6;t++)if(p){C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,b,x,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,S,m[t].width,m[t].height,0,b,x,m[t].data);for(let r=0;r<D.length;r++){let i=D[r].image[t].image;C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,b,x,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,S,i.width,i.height,0,b,x,i.data)}}else{C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,b,x,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,S,b,x,m[t]);for(let r=0;r<D.length;r++){let i=D[r];C?T&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,b,x,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,S,b,x,i.image[t])}}}g(o)&&_(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function L(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=y(o.internalFormat,d,f,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),xe(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,be(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function he(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=b(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,l=be(n);xe(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,l,o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,l,o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=y(o.internalFormat,c,l,o.colorSpace),d=be(n);r&&xe(n)===!1?e.renderbufferStorageMultisample(e.RENDERBUFFER,d,u,n.width,n.height):xe(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,d,u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function R(t,i){if(i&&i.isWebGLCubeRenderTarget)throw Error(`Depth Texture with cube render targets is not supported`);if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`renderTarget.depthTexture must be an instance of THREE.DepthTexture`);let a=r.get(i.depthTexture);a.__renderTarget=i,a.__webglTexture&&i.depthTexture.image.width===i.width&&i.depthTexture.image.height===i.height||(i.depthTexture.image.width=i.width,i.depthTexture.image.height=i.height,i.depthTexture.needsUpdate=!0),ie(i.depthTexture,0);let o=a.__webglTexture,c=be(i);if(i.depthTexture.format===1026)xe(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,o,0,c):e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.TEXTURE_2D,o,0);else if(i.depthTexture.format===1027)xe(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,o,0,c):e.framebufferTexture2D(e.FRAMEBUFFER,e.DEPTH_STENCIL_ATTACHMENT,e.TEXTURE_2D,o,0);else throw Error(`Unknown depthTexture format`)}function ge(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)throw Error(`target.depthTexture not supported in Cube render targets`);R(i.__webglFramebuffer,t)}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),he(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),he(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function z(t,n,i){let a=r.get(t);n!==void 0&&L(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&ge(t)}function _e(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,ee);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps&&i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&xe(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=y(r.internalFormat,i,o,r.colorSpace,t.isXRRenderTarget===!0),u=be(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),he(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),ue(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps&&i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)L(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else L(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);g(i)&&_(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a);n.bindTexture(e.TEXTURE_2D,o.__webglTexture),ue(e.TEXTURE_2D,a),L(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,e.TEXTURE_2D,0),g(a)&&_(e.TEXTURE_2D)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),ue(r,i),i.mipmaps&&i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)L(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else L(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);g(i)&&_(r),n.unbindTexture()}t.depthBuffer&&ge(t)}function B(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(g(a)){let t=v(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),_(t),n.unbindTexture()}}}let V=[],ve=[];function ye(t){if(t.samples>0){if(xe(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(V.length=0,ve.length=0,V.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.resolveDepthBuffer===!1&&(V.push(l),ve.push(l),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,ve)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,V))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.resolveDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function be(e){return Math.min(i.maxSamples,e.samples)}function xe(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function Se(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function Ce(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(G.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&console.warn(`THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):console.error(`THREE.WebGLTextures: Unsupported texture color space:`,n)),t}function we(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=ne,this.resetTextureUnits=te,this.setTexture2D=ie,this.setTexture2DArray=ae,this.setTexture3D=oe,this.setTextureCube=I,this.rebindTextures=z,this.setupRenderTarget=_e,this.updateRenderTargetMipmap=B,this.updateMultisampleRenderTarget=ye,this.setupDepthRenderbuffer=ge,this.setupFrameBufferTexture=L,this.useMultisampledRTT=xe}function ds(e,t){function n(n,r=``){let i,a=G.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1024)return e.LUMINANCE;if(n===1025)return e.LUMINANCE_ALPHA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36492)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var fs=class extends $r{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},ps=class extends Gn{constructor(){super(),this.isGroup=!0,this.type=`Group`}},ms={type:`move`},hs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ps,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ps,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new K,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new K),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ps,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new K,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new K),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.rotation,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(ms)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new ps;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},gs=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,_s=`
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

}`,vs=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let r=new It,i=e.properties.get(r);i.__webglTexture=t.texture,(t.depthNear!=n.depthNear||t.depthFar!=n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=r}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Jr({vertexShader:gs,fragmentShader:_s,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new X(new mi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},ys=class extends at{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=new vs,h=t.getContextAttributes(),g=null,_=null,v=[],y=[],b=new U,x=null,S=new $r;S.viewport=new Lt;let C=new $r;C.viewport=new Lt;let w=[S,C],T=new fs,E=null,D=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=v[e];return t===void 0&&(t=new hs,v[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=v[e];return t===void 0&&(t=new hs,v[e]=t),t.getGripSpace()},this.getHand=function(e){let t=v[e];return t===void 0&&(t=new hs,v[e]=t),t.getHandSpace()};function O(e){let t=y.indexOf(e.inputSource);if(t===-1)return;let n=v[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function k(){r.removeEventListener(`select`,O),r.removeEventListener(`selectstart`,O),r.removeEventListener(`selectend`,O),r.removeEventListener(`squeeze`,O),r.removeEventListener(`squeezestart`,O),r.removeEventListener(`squeezeend`,O),r.removeEventListener(`end`,k),r.removeEventListener(`inputsourceschange`,j);for(let e=0;e<v.length;e++){let t=y[e];t!==null&&(y[e]=null,v[e].disconnect(t))}E=null,D=null,m.reset(),e.setRenderTarget(g),f=null,d=null,u=null,r=null,_=null,ae.stop(),n.isPresenting=!1,e.setPixelRatio(x),e.setSize(b.width,b.height,!1),n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&console.warn(`THREE.WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&console.warn(`THREE.WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(g=e.getRenderTarget(),r.addEventListener(`select`,O),r.addEventListener(`selectstart`,O),r.addEventListener(`selectend`,O),r.addEventListener(`squeeze`,O),r.addEventListener(`squeezestart`,O),r.addEventListener(`squeezeend`,O),r.addEventListener(`end`,k),r.addEventListener(`inputsourceschange`,j),h.xrCompatible!==!0&&await t.makeXRCompatible(),x=e.getPixelRatio(),e.getSize(b),r.renderState.layers===void 0){let n={antialias:h.antialias,alpha:!0,depth:h.depth,stencil:h.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),_=new zt(f.framebufferWidth,f.framebufferHeight,{format:se,type:A,colorSpace:e.outputColorSpace,stencilBuffer:h.stencil})}else{let n=null,a=null,o=null;h.depth&&(o=h.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=h.stencil?de:ue,a=h.stencil?ie:P);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=new XRWebGLBinding(r,t),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),_=new zt(d.textureWidth,d.textureHeight,{format:se,type:A,depthTexture:new $i(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:h.stencil,colorSpace:e.outputColorSpace,samples:h.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),ae.setContext(r),ae.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function j(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=y.indexOf(n);r>=0&&(y[r]=null,v[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=y.indexOf(n);if(r===-1){for(let e=0;e<v.length;e++)if(e>=y.length){y.push(n),r=e;break}else if(y[e]===null){y[e]=n,r=e;break}if(r===-1)break}let i=v[r];i&&i.connect(n)}}let ee=new K,M=new K;function N(e,t,n){ee.setFromMatrixPosition(t.matrixWorld),M.setFromMatrixPosition(n.matrixWorld);let r=ee.distanceTo(M),i=t.projectionMatrix.elements,a=n.projectionMatrix.elements,o=i[14]/(i[10]-1),s=i[14]/(i[10]+1),c=(i[9]+1)/i[5],l=(i[9]-1)/i[5],u=(i[8]-1)/i[0],d=(a[8]+1)/a[0],f=o*u,p=o*d,m=r/(-u+d),h=m*-u;if(t.matrixWorld.decompose(e.position,e.quaternion,e.scale),e.translateX(h),e.translateZ(m),e.matrixWorld.compose(e.position,e.quaternion,e.scale),e.matrixWorldInverse.copy(e.matrixWorld).invert(),i[10]===-1)e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse);else{let t=o+m,n=s+m,i=f-h,a=p+(r-h),u=c*s/n*t,d=l*s/n*t;e.projectionMatrix.makePerspective(i,a,u,d,t,n),e.projectionMatrixInverse.copy(e.projectionMatrix).invert()}}function F(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;m.texture!==null&&(m.depthNear>0&&(t=m.depthNear),m.depthFar>0&&(n=m.depthFar)),T.near=C.near=S.near=t,T.far=C.far=S.far=n,(E!==T.near||D!==T.far)&&(r.updateRenderState({depthNear:T.near,depthFar:T.far}),E=T.near,D=T.far),S.layers.mask=e.layers.mask|2,C.layers.mask=e.layers.mask|4,T.layers.mask=S.layers.mask|C.layers.mask;let i=e.parent,a=T.cameras;F(T,i);for(let e=0;e<a.length;e++)F(a[e],i);a.length===2?N(T,S,C):T.projectionMatrix.copy(S.projectionMatrix),te(e,T,i)};function te(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=ct*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return T},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(T)};let ne=null;function re(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(_,f.framebuffer),e.setRenderTarget(_));let n=!1;t.length!==T.cameras.length&&(T.cameras.length=0,n=!0);for(let r=0;r<t.length;r++){let i=t[r],a=null;if(f!==null)a=f.getViewport(i);else{let t=u.getViewSubImage(d,i);a=t.viewport,r===0&&(e.setRenderTargetTextures(_,t.colorTexture,d.ignoreDepthValues?void 0:t.depthStencilTexture),e.setRenderTarget(_))}let o=w[r];o===void 0&&(o=new $r,o.layers.enable(r),o.viewport=new Lt,w[r]=o),o.matrix.fromArray(i.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(i.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),r===0&&(T.matrix.copy(o.matrix),T.matrix.decompose(T.position,T.quaternion,T.scale)),n===!0&&T.cameras.push(o)}let i=r.enabledFeatures;if(i&&i.includes(`depth-sensing`)){let n=u.getDepthInformation(t[0]);n&&n.isValid&&n.texture&&m.init(e,n,r.renderState)}}for(let e=0;e<v.length;e++){let t=y[e],n=v[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ne&&ne(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let ae=new fi;ae.setAnimationLoop(re),this.setAnimationLoop=function(e){ne=e},this.dispose=function(){}}},bs=new On,xs=new q;function Ss(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Wr(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isMeshBasicMaterial||t.isMeshLambertMaterial?a(e,t):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,bs.copy(o),bs.x*=-1,bs.y*=-1,bs.z*=-1,a.isCubeTexture&&a.isRenderTargetTexture===!1&&(bs.y*=-1,bs.z*=-1),e.envMapRotation.value.setFromMatrix4(xs.makeRotationFromEuler(bs)),e.flipEnvMap.value=a.isCubeTexture&&a.isRenderTargetTexture===!1?-1:1,e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessRange[0],e.iridescenceThicknessMaximum.value=t.iridescenceThicknessRange[1],t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function Cs(e,t,n,r){let i={},a={},o=[],s=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function c(e,t){let n=t.program;r.uniformBlockBinding(e,n)}function l(e,n){let o=i[e.id];o===void 0&&(m(e),o=u(e),i[e.id]=o,e.addEventListener(`dispose`,g));let s=n.program;r.updateUBOMapping(e,s);let c=t.render.frame;a[e.id]!==c&&(f(e),a[e.id]=c)}function u(t){let n=d();t.__bindingPointIndex=n;let r=e.createBuffer(),i=t.__size,a=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,r),e.bufferData(e.UNIFORM_BUFFER,i,a),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,n,r),r}function d(){for(let e=0;e<s;e++)if(o.indexOf(e)===-1)return o.push(e),e;return console.error(`THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.`),0}function f(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let t=0,n=r.length;t<n;t++){let n=Array.isArray(r[t])?r[t]:[r[t]];for(let r=0,i=n.length;r<i;r++){let i=n[r];if(p(i,t,r,a)===!0){let t=i.__offset,n=Array.isArray(i.value)?i.value:[i.value],r=0;for(let a=0;a<n.length;a++){let o=n[a],s=h(o);typeof o==`number`||typeof o==`boolean`?(i.__data[0]=o,e.bufferSubData(e.UNIFORM_BUFFER,t+r,i.__data)):o.isMatrix3?(i.__data[0]=o.elements[0],i.__data[1]=o.elements[1],i.__data[2]=o.elements[2],i.__data[3]=0,i.__data[4]=o.elements[3],i.__data[5]=o.elements[4],i.__data[6]=o.elements[5],i.__data[7]=0,i.__data[8]=o.elements[6],i.__data[9]=o.elements[7],i.__data[10]=o.elements[8],i.__data[11]=0):(o.toArray(i.__data,r),r+=s.storage/Float32Array.BYTES_PER_ELEMENT)}e.bufferSubData(e.UNIFORM_BUFFER,t,i.__data)}}}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(e,t,n,r){let i=e.value,a=t+`_`+n;if(r[a]===void 0)return r[a]=typeof i==`number`||typeof i==`boolean`?i:i.clone(),!0;{let e=r[a];if(typeof i==`number`||typeof i==`boolean`){if(e!==i)return r[a]=i,!0}else if(e.equals(i)===!1)return e.copy(i),!0}return!1}function m(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let e=0,t=r.length;e<t;e++){let t=r[e],i=Array.isArray(t.value)?t.value:[t.value];for(let e=0,r=i.length;e<r;e++){let r=i[e],a=h(r),o=n%16,s=o%a.boundary,c=o+s;n+=s,c!==0&&16-c<a.storage&&(n+=16-c),t.__data=new Float32Array(a.storage/Float32Array.BYTES_PER_ELEMENT),t.__offset=n,n+=a.storage}}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function h(e){let t={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(t.boundary=4,t.storage=4):e.isVector2?(t.boundary=8,t.storage=8):e.isVector3||e.isColor?(t.boundary=16,t.storage=12):e.isVector4?(t.boundary=16,t.storage=16):e.isMatrix3?(t.boundary=48,t.storage=48):e.isMatrix4?(t.boundary=64,t.storage=64):e.isTexture?console.warn(`THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group.`):console.warn(`THREE.WebGLRenderer: Unsupported uniform value type.`,e),t}function g(t){let n=t.target;n.removeEventListener(`dispose`,g);let r=o.indexOf(n.__bindingPointIndex);o.splice(r,1),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function _(){for(let t in i)e.deleteBuffer(i[t]);o=[],i={},a={}}return{bind:c,update:l,dispose:_}}var ws=class{constructor(e={}){let{canvas:t=_t(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);f=n.getContextAttributes().alpha}else f=a;let p=new Uint32Array(4),m=new Int32Array(4),h=null,g=null,_=[],v=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Qe,this.toneMapping=0,this.toneMappingExposure=1;let y=this,b=!1,x=0,S=0,C=null,w=-1,T=null,E=new Lt,D=new Lt,O=null,j=new J(0),ee=0,M=t.width,N=t.height,P=1,F=null,ne=null,re=new Lt(0,0,M,N),ie=new Lt(0,0,M,N),ae=!1,oe=new di,I=!1,se=!1,ce=new q,le=new q,ue=new K,de=new Lt,fe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},pe=!1;function me(){return C===null?P:1}let L=n;function he(e,n){return t.getContext(e,n)}try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r170`),t.addEventListener(`webglcontextlost`,Re,!1),t.addEventListener(`webglcontextrestored`,ze,!1),t.addEventListener(`webglcontextcreationerror`,Be,!1),L===null){let t=`webgl2`;if(L=he(t,e),L===null)throw he(t)?Error(`Error creating WebGL context with your selected attributes.`):Error(`Error creating WebGL context.`)}}catch(e){throw console.error(`THREE.WebGLRenderer: `+e.message),e}let R,ge,z,_e,B,V,ve,ye,be,xe,Se,Ce,we,Te,Ee,De,Oe,ke,Ae,je,Me,Ne,Pe,Fe;function Ie(){R=new qi(L),R.init(),Ne=new ds(L,R),ge=new Si(L,R,e,Ne),z=new ss(L,R),ge.reverseDepthBuffer&&d&&z.buffers.depth.setReversed(!0),_e=new Xi(L),B=new Uo,V=new us(L,R,z,B,ge,Ne,_e),ve=new wi(y),ye=new Ki(y),be=new pi(L),Pe=new bi(L,be),xe=new Ji(L,be,_e,Pe),Se=new Qi(L,xe,be,_e),Ae=new Zi(L,ge,V),De=new Ci(B),Ce=new Ho(y,ve,ye,R,ge,Pe,De),we=new Ss(y,B),Te=new qo,Ee=new es(R),ke=new yi(y,ve,ye,z,Se,f,s),Oe=new as(y,Se,ge),Fe=new Cs(L,_e,ge,z),je=new xi(L,R,_e),Me=new Yi(L,R,_e),_e.programs=Ce.programs,y.capabilities=ge,y.extensions=R,y.properties=B,y.renderLists=Te,y.shadowMap=Oe,y.state=z,y.info=_e}Ie();let Le=new ys(y,L);this.xr=Le,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let e=R.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=R.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return P},this.setPixelRatio=function(e){e!==void 0&&(P=e,this.setSize(M,N,!1))},this.getSize=function(e){return e.set(M,N)},this.setSize=function(e,n,r=!0){Le.isPresenting?console.warn(`THREE.WebGLRenderer: Can't change size while VR device is presenting.`):(M=e,N=n,t.width=Math.floor(e*P),t.height=Math.floor(n*P),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(M*P,N*P).floor()},this.setDrawingBufferSize=function(e,n,r){M=e,N=n,P=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.getCurrentViewport=function(e){return e.copy(E)},this.getViewport=function(e){return e.copy(re)},this.setViewport=function(e,t,n,r){e.isVector4?re.set(e.x,e.y,e.z,e.w):re.set(e,t,n,r),z.viewport(E.copy(re).multiplyScalar(P).round())},this.getScissor=function(e){return e.copy(ie)},this.setScissor=function(e,t,n,r){e.isVector4?ie.set(e.x,e.y,e.z,e.w):ie.set(e,t,n,r),z.scissor(D.copy(ie).multiplyScalar(P).round())},this.getScissorTest=function(){return ae},this.setScissorTest=function(e){z.setScissorTest(ae=e)},this.setOpaqueSort=function(e){F=e},this.setTransparentSort=function(e){ne=e},this.getClearColor=function(e){return e.copy(ke.getClearColor())},this.setClearColor=function(){ke.setClearColor.apply(ke,arguments)},this.getClearAlpha=function(){return ke.getClearAlpha()},this.setClearAlpha=function(){ke.setClearAlpha.apply(ke,arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(C!==null){let t=C.texture.format;e=t===1033||t===1031||t===1029}if(e){let e=C.texture.type,t=e===1009||e===1014||e===1012||e===1020||e===1017||e===1018,n=ke.getClearColor(),r=ke.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(p[0]=i,p[1]=a,p[2]=o,p[3]=r,L.clearBufferuiv(L.COLOR,0,p)):(m[0]=i,m[1]=a,m[2]=o,m[3]=r,L.clearBufferiv(L.COLOR,0,m))}else r|=L.COLOR_BUFFER_BIT}t&&(r|=L.DEPTH_BUFFER_BIT),n&&(r|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),L.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener(`webglcontextlost`,Re,!1),t.removeEventListener(`webglcontextrestored`,ze,!1),t.removeEventListener(`webglcontextcreationerror`,Be,!1),Te.dispose(),Ee.dispose(),B.dispose(),ve.dispose(),ye.dispose(),Se.dispose(),Pe.dispose(),Fe.dispose(),Ce.dispose(),Le.dispose(),Le.removeEventListener(`sessionstart`,qe),Le.removeEventListener(`sessionend`,Je),Ye.stop()};function Re(e){e.preventDefault(),console.log(`THREE.WebGLRenderer: Context Lost.`),b=!0}function ze(){console.log(`THREE.WebGLRenderer: Context Restored.`),b=!1;let e=_e.autoReset,t=Oe.enabled,n=Oe.autoUpdate,r=Oe.needsUpdate,i=Oe.type;Ie(),_e.autoReset=e,Oe.enabled=t,Oe.autoUpdate=n,Oe.needsUpdate=r,Oe.type=i}function Be(e){console.error(`THREE.WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function Ve(e){let t=e.target;t.removeEventListener(`dispose`,Ve),He(t)}function He(e){Ue(e),B.remove(e)}function Ue(e){let t=B.get(e).programs;t!==void 0&&(t.forEach(function(e){Ce.releaseProgram(e)}),e.isShaderMaterial&&Ce.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=fe);let o=i.isMesh&&i.matrixWorld.determinant()<0,s=ot(e,t,n,r,i);z.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=xe.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Pe.setup(i,r,s,n,c);let h,g=je;if(c!==null&&(h=be.get(c),g=Me,g.setIndex(h)),i.isMesh)r.wireframe===!0?(z.setLineWidth(r.wireframeLinewidth*me()),g.setMode(L.LINES)):g.setMode(L.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),z.setLineWidth(e*me()),i.isLineSegments?g.setMode(L.LINES):i.isLineLoop?g.setMode(L.LINE_LOOP):g.setMode(L.LINE_STRIP)}else i.isPoints?g.setMode(L.POINTS):i.isSprite&&g.setMode(L.TRIANGLES);if(i.isBatchedMesh){if(i._multiDrawInstances!==null)g.renderMultiDrawInstances(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount,i._multiDrawInstances);else if(R.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?be.get(c).bytesPerElement:1,o=B.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(L,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function We(e,t,n){e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,rt(e,t,n),e.side=0,e.needsUpdate=!0,rt(e,t,n),e.side=2):rt(e,t,n)}this.compile=function(e,t,n=null){n===null&&(n=e),g=Ee.get(n),g.init(t),v.push(g),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(g.pushLight(e),e.castShadow&&g.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(g.pushLight(e),e.castShadow&&g.pushShadow(e))}),g.setupLights();let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let t=e.material;if(t){if(Array.isArray(t))for(let i=0;i<t.length;i++){let a=t[i];We(a,n,e),r.add(a)}else We(t,n,e),r.add(t)}}),v.pop(),g=null,r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){B.get(e).currentProgram.isReady()&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}R.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let Ge=null;function Ke(e){Ge&&Ge(e)}function qe(){Ye.stop()}function Je(){Ye.start()}let Ye=new fi;Ye.setAnimationLoop(Ke),typeof self<`u`&&Ye.setContext(self),this.setAnimationLoop=function(e){Ge=e,Le.setAnimationLoop(e),e===null?Ye.stop():Ye.start()},Le.addEventListener(`sessionstart`,qe),Le.addEventListener(`sessionend`,Je),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){console.error(`THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(b===!0)return;if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),Le.enabled===!0&&Le.isPresenting===!0&&(Le.cameraAutoUpdate===!0&&Le.updateCamera(t),t=Le.getCamera()),e.isScene===!0&&e.onBeforeRender(y,e,t,C),g=Ee.get(e,v.length),g.init(t),v.push(g),le.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),oe.setFromProjectionMatrix(le),se=this.localClippingEnabled,I=De.init(this.clippingPlanes,se),h=Te.get(e,_.length),h.init(),_.push(h),Le.enabled===!0&&Le.isPresenting===!0){let e=y.xr.getDepthSensingMesh();e!==null&&Xe(e,t,-1/0,y.sortObjects)}Xe(e,t,0,y.sortObjects),h.finish(),y.sortObjects===!0&&h.sort(F,ne),pe=Le.enabled===!1||Le.isPresenting===!1||Le.hasDepthSensing()===!1,pe&&ke.addToRenderList(h,e),this.info.render.frame++,I===!0&&De.beginShadows();let n=g.state.shadowsArray;Oe.render(n,e,t),I===!0&&De.endShadows(),this.info.autoReset===!0&&this.info.reset();let r=h.opaque,i=h.transmissive;if(g.setupLights(),t.isArrayCamera){let n=t.cameras;if(i.length>0)for(let t=0,a=n.length;t<a;t++){let a=n[t];et(r,i,e,a)}pe&&ke.render(e);for(let t=0,r=n.length;t<r;t++){let r=n[t];Ze(h,e,r,r.viewport)}}else i.length>0&&et(r,i,e,t),pe&&ke.render(e),Ze(h,e,t);C!==null&&(V.updateMultisampleRenderTarget(C),V.updateRenderTargetMipmap(C)),e.isScene===!0&&e.onAfterRender(y,e,t),Pe.resetDefaultState(),w=-1,T=null,v.pop(),v.length>0?(g=v[v.length-1],I===!0&&De.setGlobalState(y.clippingPlanes,g.state.camera)):g=null,_.pop(),h=_.length>0?_[_.length-1]:null};function Xe(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLight)g.pushLight(e),e.castShadow&&g.pushShadow(e);else if(e.isSprite){if(!e.frustumCulled||oe.intersectsSprite(e)){r&&de.setFromMatrixPosition(e.matrixWorld).applyMatrix4(le);let t=Se.update(e),i=e.material;i.visible&&h.push(e,t,i,n,de.z,null)}}else if((e.isMesh||e.isLine||e.isPoints)&&(!e.frustumCulled||oe.intersectsObject(e))){let t=Se.update(e),i=e.material;if(r&&(e.boundingSphere===void 0?(t.boundingSphere===null&&t.computeBoundingSphere(),de.copy(t.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),de.copy(e.boundingSphere.center)),de.applyMatrix4(e.matrixWorld).applyMatrix4(le)),Array.isArray(i)){let r=t.groups;for(let a=0,o=r.length;a<o;a++){let o=r[a],s=i[o.materialIndex];s&&s.visible&&h.push(e,t,s,n,de.z,o)}}else i.visible&&h.push(e,t,i,n,de.z,null)}}let i=e.children;for(let e=0,a=i.length;e<a;e++)Xe(i[e],t,n,r)}function Ze(e,t,n,r){let i=e.opaque,a=e.transmissive,o=e.transparent;g.setupLightsView(n),I===!0&&De.setGlobalState(y.clippingPlanes,n),r&&z.viewport(E.copy(r)),i.length>0&&tt(i,t,n),a.length>0&&tt(a,t,n),o.length>0&&tt(o,t,n),z.buffers.depth.setTest(!0),z.buffers.depth.setMask(!0),z.buffers.color.setMask(!0),z.setPolygonOffset(!1)}function et(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;g.state.transmissionRenderTarget[r.id]===void 0&&(g.state.transmissionRenderTarget[r.id]=new zt(1,1,{generateMipmaps:!0,type:R.has(`EXT_color_buffer_half_float`)||R.has(`EXT_color_buffer_float`)?te:A,minFilter:k,samples:4,stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:G.workingColorSpace}));let a=g.state.transmissionRenderTarget[r.id],o=r.viewport||E;a.setSize(o.z,o.w);let s=y.getRenderTarget();y.setRenderTarget(a),y.getClearColor(j),ee=y.getClearAlpha(),ee<1&&y.setClearColor(16777215,.5),y.clear(),pe&&ke.render(n);let c=y.toneMapping;y.toneMapping=0;let l=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),g.setupLightsView(r),I===!0&&De.setGlobalState(y.clippingPlanes,r),tt(e,n,r),V.updateMultisampleRenderTarget(a),V.updateRenderTargetMipmap(a),R.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let a=t[i],o=a.object,s=a.geometry,c=a.material,l=a.group;if(c.side===2&&o.layers.test(r.layers)){let t=c.side;c.side=1,c.needsUpdate=!0,nt(o,n,r,s,c,l),c.side=t,c.needsUpdate=!0,e=!0}}e===!0&&(V.updateMultisampleRenderTarget(a),V.updateRenderTargetMipmap(a))}y.setRenderTarget(s),y.setClearColor(j,ee),l!==void 0&&(r.viewport=l),y.toneMapping=c}function tt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],o=a.object,s=a.geometry,c=r===null?a.material:r,l=a.group;o.layers.test(n.layers)&&nt(o,t,n,s,c,l)}}function nt(e,t,n,r,i,a){e.onBeforeRender(y,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(y,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,y.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,y.renderBufferDirect(n,t,r,i,e,a),i.side=2):y.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(y,t,n,r,i,a)}function rt(e,t,n){t.isScene!==!0&&(t=fe);let r=B.get(e),i=g.state.lights,a=g.state.shadowsArray,o=i.state.version,s=Ce.getParameters(e,i.state,a,t,n),c=Ce.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial?t.environment:null,r.fog=t.fog,r.envMap=(e.isMeshStandardMaterial?ye:ve).get(e.envMap||r.environment),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,Ve),l=new Map,r.programs=l);let u=l.get(c);if(u!==void 0){if(r.currentProgram===u&&r.lightsStateVersion===o)return at(e,s),u}else s.uniforms=Ce.getUniforms(e),e.onBeforeCompile(s,y),u=Ce.acquireProgram(s,c),l.set(c,u),r.uniforms=s.uniforms;let d=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(d.clippingPlanes=De.uniform),at(e,s),r.needsLights=ct(e),r.lightsStateVersion=o,r.needsLights&&(d.ambientLightColor.value=i.state.ambient,d.lightProbe.value=i.state.probe,d.directionalLights.value=i.state.directional,d.directionalLightShadows.value=i.state.directionalShadow,d.spotLights.value=i.state.spot,d.spotLightShadows.value=i.state.spotShadow,d.rectAreaLights.value=i.state.rectArea,d.ltc_1.value=i.state.rectAreaLTC1,d.ltc_2.value=i.state.rectAreaLTC2,d.pointLights.value=i.state.point,d.pointLightShadows.value=i.state.pointShadow,d.hemisphereLights.value=i.state.hemi,d.directionalShadowMap.value=i.state.directionalShadowMap,d.directionalShadowMatrix.value=i.state.directionalShadowMatrix,d.spotShadowMap.value=i.state.spotShadowMap,d.spotLightMatrix.value=i.state.spotLightMatrix,d.spotLightMap.value=i.state.spotLightMap,d.pointShadowMap.value=i.state.pointShadowMap,d.pointShadowMatrix.value=i.state.pointShadowMatrix),r.currentProgram=u,r.uniformsList=null,u}function it(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=oo.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function at(e,t){let n=B.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function ot(e,t,n,r,i){t.isScene!==!0&&(t=fe),V.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial?t.environment:null,s=C===null?y.outputColorSpace:C.isXRRenderTarget===!0?C.texture.colorSpace:$e,c=(r.isMeshStandardMaterial?ye:ve).get(r.envMap||o),l=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,u=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),d=!!n.morphAttributes.position,f=!!n.morphAttributes.normal,p=!!n.morphAttributes.color,m=0;r.toneMapped&&(C===null||C.isXRRenderTarget===!0)&&(m=y.toneMapping);let h=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=h===void 0?0:h.length,v=B.get(r),b=g.state.lights;if(I===!0&&(se===!0||e!==T)){let t=e===T&&r.id===w;De.setState(r,e,t)}let x=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==b.state.version?x=!0:v.outputColorSpace===s?i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i.colorTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i.colorTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?x=!0:v.envMap===c?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==De.numPlanes||v.numIntersection!==De.numIntersection)?x=!0:v.vertexAlphas===l&&v.vertexTangents===u&&v.morphTargets===d&&v.morphNormals===f&&v.morphColors===p&&v.toneMapping===m?v.morphTargetsCount!==_&&(x=!0):x=!0:x=!0:x=!0:(x=!0,v.__version=r.version);let S=v.currentProgram;x===!0&&(S=rt(r,t,i));let E=!1,D=!1,O=!1,k=S.getUniforms(),A=v.uniforms;if(z.useProgram(S.program)&&(E=!0,D=!0,O=!0),r.id!==w&&(w=r.id,D=!0),E||T!==e){z.buffers.depth.getReversed()?(ce.copy(e.projectionMatrix),xt(ce),St(ce),k.setValue(L,`projectionMatrix`,ce)):k.setValue(L,`projectionMatrix`,e.projectionMatrix),k.setValue(L,`viewMatrix`,e.matrixWorldInverse);let t=k.map.cameraPosition;t!==void 0&&t.setValue(L,ue.setFromMatrixPosition(e.matrixWorld)),ge.logarithmicDepthBuffer&&k.setValue(L,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&k.setValue(L,`isOrthographic`,e.isOrthographicCamera===!0),T!==e&&(T=e,D=!0,O=!0)}if(i.isSkinnedMesh){k.setOptional(L,i,`bindMatrix`),k.setOptional(L,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),k.setValue(L,`boneTexture`,e.boneTexture,V))}i.isBatchedMesh&&(k.setOptional(L,i,`batchingTexture`),k.setValue(L,`batchingTexture`,i._matricesTexture,V),k.setOptional(L,i,`batchingIdTexture`),k.setValue(L,`batchingIdTexture`,i._indirectTexture,V),k.setOptional(L,i,`batchingColorTexture`),i._colorsTexture!==null&&k.setValue(L,`batchingColorTexture`,i._colorsTexture,V));let j=n.morphAttributes;if((j.position!==void 0||j.normal!==void 0||j.color!==void 0)&&Ae.update(i,n,S),(D||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,k.setValue(L,`receiveShadow`,i.receiveShadow)),r.isMeshGouraudMaterial&&r.envMap!==null&&(A.envMap.value=c,A.flipEnvMap.value=c.isCubeTexture&&c.isRenderTargetTexture===!1?-1:1),r.isMeshStandardMaterial&&r.envMap===null&&t.environment!==null&&(A.envMapIntensity.value=t.environmentIntensity),D&&(k.setValue(L,`toneMappingExposure`,y.toneMappingExposure),v.needsLights&&st(A,O),a&&r.fog===!0&&we.refreshFogUniforms(A,a),we.refreshMaterialUniforms(A,r,P,N,g.state.transmissionRenderTarget[e.id]),oo.upload(L,it(v),A,V)),r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(oo.upload(L,it(v),A,V),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&k.setValue(L,`center`,i.center),k.setValue(L,`modelViewMatrix`,i.modelViewMatrix),k.setValue(L,`normalMatrix`,i.normalMatrix),k.setValue(L,`modelMatrix`,i.matrixWorld),r.isShaderMaterial||r.isRawShaderMaterial){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];Fe.update(n,S),Fe.bind(n,S)}}return S}function st(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function ct(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return x},this.getActiveMipmapLevel=function(){return S},this.getRenderTarget=function(){return C},this.setRenderTargetTextures=function(e,t,n){B.get(e.texture).__webglTexture=t,B.get(e.depthTexture).__webglTexture=n;let r=B.get(e);r.__hasExternalTextures=!0,r.__autoAllocateDepthBuffer=n===void 0,r.__autoAllocateDepthBuffer||R.has(`WEBGL_multisampled_render_to_texture`)===!0&&(console.warn(`THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided`),r.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(e,t){let n=B.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){C=e,x=t,S=n;let r=!0,i=null,a=!1,o=!1;if(e){let s=B.get(e);if(s.__useDefaultFramebuffer!==void 0)z.bindFramebuffer(L.FRAMEBUFFER,null),r=!1;else if(s.__webglFramebuffer===void 0)V.setupRenderTarget(e);else if(s.__hasExternalTextures)V.rebindTextures(e,B.get(e.texture).__webglTexture,B.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(s.__boundDepthTexture!==t){if(t!==null&&B.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.`);V.setupDepthRenderbuffer(e)}}let c=e.texture;(c.isData3DTexture||c.isDataArrayTexture||c.isCompressedArrayTexture)&&(o=!0);let l=B.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(i=Array.isArray(l[t])?l[t][n]:l[t],a=!0):i=e.samples>0&&V.useMultisampledRTT(e)===!1?B.get(e).__webglMultisampledFramebuffer:Array.isArray(l)?l[n]:l,E.copy(e.viewport),D.copy(e.scissor),O=e.scissorTest}else E.copy(re).multiplyScalar(P).floor(),D.copy(ie).multiplyScalar(P).floor(),O=ae;if(z.bindFramebuffer(L.FRAMEBUFFER,i)&&r&&z.drawBuffers(e,i),z.viewport(E),z.scissor(D),z.setScissorTest(O),a){let r=B.get(e.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(o){let r=B.get(e.texture),i=t||0;L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,r.__webglTexture,n||0,i)}w=-1},this.readRenderTargetPixels=function(e,t,n,r,i,a,o){if(!(e&&e.isWebGLRenderTarget)){console.error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let s=B.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(s=s[o]),s){z.bindFramebuffer(L.FRAMEBUFFER,s);try{let o=e.texture,s=o.format,c=o.type;if(!ge.textureFormatReadable(s)){console.error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(!ge.textureTypeReadable(c)){console.error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&L.readPixels(t,n,r,i,Ne.convert(s),Ne.convert(c),a)}finally{let e=C===null?null:B.get(C).__webglFramebuffer;z.bindFramebuffer(L.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let s=B.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(s=s[o]),s){let o=e.texture,c=o.format,l=o.type;if(!ge.textureFormatReadable(c))throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(!ge.textureTypeReadable(l))throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){z.bindFramebuffer(L.FRAMEBUFFER,s);let e=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,e),L.bufferData(L.PIXEL_PACK_BUFFER,a.byteLength,L.STREAM_READ),L.readPixels(t,n,r,i,Ne.convert(c),Ne.convert(l),0);let o=C===null?null:B.get(C).__webglFramebuffer;z.bindFramebuffer(L.FRAMEBUFFER,o);let u=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await bt(L,u,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,e),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,a),L.deleteBuffer(e),L.deleteSync(u),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){e.isTexture!==!0&&(yt(`WebGLRenderer: copyFramebufferToTexture function signature has changed.`),t=arguments[0]||null,e=arguments[1]);let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;V.setTexture2D(e,0),L.copyTexSubImage2D(L.TEXTURE_2D,n,0,0,o,s,i,a),z.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0){e.isTexture!==!0&&(yt(`WebGLRenderer: copyTextureToTexture function signature has changed.`),r=arguments[0]||null,e=arguments[1],t=arguments[2],i=arguments[3]||0,n=null);let a,o,s,c,l,u,d,f,p,m=e.isCompressedTexture?e.mipmaps[i]:e.image;n===null?(a=m.width,o=m.height,s=m.depth||1,c=0,l=0,u=0):(a=n.max.x-n.min.x,o=n.max.y-n.min.y,s=n.isBox3?n.max.z-n.min.z:1,c=n.min.x,l=n.min.y,u=n.isBox3?n.min.z:0),r===null?(d=0,f=0,p=0):(d=r.x,f=r.y,p=r.z);let h=Ne.convert(t.format),g=Ne.convert(t.type),_;t.isData3DTexture?(V.setTexture3D(t,0),_=L.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(V.setTexture2DArray(t,0),_=L.TEXTURE_2D_ARRAY):(V.setTexture2D(t,0),_=L.TEXTURE_2D),L.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,t.flipY),L.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),L.pixelStorei(L.UNPACK_ALIGNMENT,t.unpackAlignment);let v=L.getParameter(L.UNPACK_ROW_LENGTH),y=L.getParameter(L.UNPACK_IMAGE_HEIGHT),b=L.getParameter(L.UNPACK_SKIP_PIXELS),x=L.getParameter(L.UNPACK_SKIP_ROWS),S=L.getParameter(L.UNPACK_SKIP_IMAGES);L.pixelStorei(L.UNPACK_ROW_LENGTH,m.width),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,m.height),L.pixelStorei(L.UNPACK_SKIP_PIXELS,c),L.pixelStorei(L.UNPACK_SKIP_ROWS,l),L.pixelStorei(L.UNPACK_SKIP_IMAGES,u);let C=e.isDataArrayTexture||e.isData3DTexture,w=t.isDataArrayTexture||t.isData3DTexture;if(e.isRenderTargetTexture||e.isDepthTexture){let n=B.get(e),r=B.get(t),m=B.get(n.__renderTarget),h=B.get(r.__renderTarget);z.bindFramebuffer(L.READ_FRAMEBUFFER,m.__webglFramebuffer),z.bindFramebuffer(L.DRAW_FRAMEBUFFER,h.__webglFramebuffer);for(let n=0;n<s;n++)C&&L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,B.get(e).__webglTexture,i,u+n),e.isDepthTexture?(w&&L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,B.get(t).__webglTexture,i,p+n),L.blitFramebuffer(c,l,a,o,d,f,a,o,L.DEPTH_BUFFER_BIT,L.NEAREST)):w?L.copyTexSubImage3D(_,i,d,f,p+n,c,l,a,o):L.copyTexSubImage2D(_,i,d,f,p+n,c,l,a,o);z.bindFramebuffer(L.READ_FRAMEBUFFER,null),z.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else w?e.isDataTexture||e.isData3DTexture?L.texSubImage3D(_,i,d,f,p,a,o,s,h,g,m.data):t.isCompressedArrayTexture?L.compressedTexSubImage3D(_,i,d,f,p,a,o,s,h,m.data):L.texSubImage3D(_,i,d,f,p,a,o,s,h,g,m):e.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,i,d,f,a,o,h,g,m.data):e.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,i,d,f,m.width,m.height,h,m.data):L.texSubImage2D(L.TEXTURE_2D,i,d,f,a,o,h,g,m);L.pixelStorei(L.UNPACK_ROW_LENGTH,v),L.pixelStorei(L.UNPACK_IMAGE_HEIGHT,y),L.pixelStorei(L.UNPACK_SKIP_PIXELS,b),L.pixelStorei(L.UNPACK_SKIP_ROWS,x),L.pixelStorei(L.UNPACK_SKIP_IMAGES,S),i===0&&t.generateMipmaps&&L.generateMipmap(_),z.unbindTexture()},this.copyTextureToTexture3D=function(e,t,n=null,r=null,i=0){return e.isTexture!==!0&&(yt(`WebGLRenderer: copyTextureToTexture3D function signature has changed.`),n=arguments[0]||null,r=arguments[1]||null,e=arguments[2],t=arguments[3],i=arguments[4]||0),yt(`WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.`),this.copyTextureToTexture(e,t,n,r,i)},this.initRenderTarget=function(e){B.get(e).__webglFramebuffer===void 0&&V.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?V.setTextureCube(e,0):e.isData3DTexture?V.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?V.setTexture2DArray(e,0):V.setTexture2D(e,0),z.unbindTexture()},this.resetState=function(){x=0,S=0,C=null,z.reset(),Pe.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return it}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=G._getDrawingBufferColorSpace(e),t.unpackColorSpace=G._getUnpackColorSpace()}},Ts=class e{constructor(e,t=1,n=1e3){this.isFog=!0,this.name=``,this.color=new J(e),this.near=t,this.far=n}clone(){return new e(this.color,this.near,this.far)}toJSON(){return{type:`Fog`,name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Es=class extends Gn{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new On,this.environmentIntensity=1,this.environmentRotation=new On,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},Ds=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=rt,this.updateRanges=[],this.version=0,this.uuid=lt()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=lt()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=lt()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},Os=new K,ks=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Os.fromBufferAttribute(this,t),Os.applyMatrix4(e),this.setXYZ(t,Os.x,Os.y,Os.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Os.fromBufferAttribute(this,t),Os.applyNormalMatrix(e),this.setXYZ(t,Os.x,Os.y,Os.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Os.fromBufferAttribute(this,t),Os.transformDirection(e),this.setXYZ(t,Os.x,Os.y,Os.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=pt(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=H(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=H(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=H(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=H(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=H(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=pt(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=pt(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=pt(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=pt(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=H(t,this.array),n=H(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=H(t,this.array),n=H(n,this.array),r=H(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=H(t,this.array),n=H(n,this.array),r=H(r,this.array),i=H(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){console.log(`THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new gr(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log(`THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},As=class extends fr{static get type(){return`SpriteMaterial`}constructor(e){super(),this.isSpriteMaterial=!0,this.color=new J(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},js,Ms=new K,Ns=new K,Ps=new K,Fs=new U,Is=new U,Ls=new q,Rs=new K,zs=new K,Bs=new K,Vs=new U,Hs=new U,Us=new U,Ws=class extends Gn{constructor(e=new As){if(super(),this.isSprite=!0,this.type=`Sprite`,js===void 0){js=new Er;let e=new Ds(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);js.setIndex([0,1,2,0,2,3]),js.setAttribute(`position`,new ks(e,3,0,!1)),js.setAttribute(`uv`,new ks(e,2,3,!1))}this.geometry=js,this.material=e,this.center=new U(.5,.5)}raycast(e,t){e.camera===null&&console.error(`THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),Ns.setFromMatrixScale(this.matrixWorld),Ls.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Ps.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Ns.multiplyScalar(-Ps.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;Gs(Rs.set(-.5,-.5,0),Ps,a,Ns,r,i),Gs(zs.set(.5,-.5,0),Ps,a,Ns,r,i),Gs(Bs.set(.5,.5,0),Ps,a,Ns,r,i),Vs.set(0,0),Hs.set(1,0),Us.set(1,1);let o=e.ray.intersectTriangle(Rs,zs,Bs,!1,Ms);if(o===null&&(Gs(zs.set(-.5,.5,0),Ps,a,Ns,r,i),Hs.set(0,1),o=e.ray.intersectTriangle(Rs,Bs,zs,!1,Ms),o===null))return;let s=e.ray.origin.distanceTo(Ms);s<e.near||s>e.far||t.push({distance:s,point:Ms.clone(),uv:ar.getInterpolation(Ms,Rs,zs,Bs,Vs,Hs,Us,new U),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}};function Gs(e,t,n,r,i,a){Fs.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?Is.copy(Fs):(Is.x=a*Fs.x-i*Fs.y,Is.y=i*Fs.x+a*Fs.y),e.copy(t),e.x+=Is.x,e.y+=Is.y,e.applyMatrix4(Ls)}var Ks=class extends It{constructor(e=null,t=1,n=1,r,i,a,o,s,c=w,l=w,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},qs=class extends gr{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Js=new q,Ys=new q,Xs=[],Zs=new Gt,Qs=new q,$s=new X,ec=new un,tc=class extends X{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new qs(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,Qs)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Gt),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Js),Zs.copy(e.boundingBox).applyMatrix4(Js),this.boundingBox.union(Zs)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new un),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Js),ec.copy(e.boundingSphere).applyMatrix4(Js),this.boundingSphere.union(ec)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if($s.geometry=this.geometry,$s.material=this.material,$s.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ec.copy(this.boundingSphere),ec.applyMatrix4(n),e.ray.intersectsSphere(ec)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,Js),Ys.multiplyMatrices(n,Js),$s.matrixWorld=Ys,$s.raycast(e,Xs);for(let e=0,n=Xs.length;e<n;e++){let n=Xs[e];n.instanceId=i,n.object=this,t.push(n)}Xs.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new qs(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Ks(new Float32Array(r*this.count),r,this.count,fe,F));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;i[s]=o,i.set(n,s+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:`dispose`}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}},nc=class extends fr{static get type(){return`PointsMaterial`}constructor(e){super(),this.isPointsMaterial=!0,this.color=new J(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},rc=new q,ic=new vn,ac=new un,oc=new K,sc=class extends Gn{constructor(e=new Er,t=new nc){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ac.copy(n.boundingSphere),ac.applyMatrix4(r),ac.radius+=i,e.ray.intersectsSphere(ac)===!1)return;rc.copy(r).invert(),ic.copy(e.ray).applyMatrix4(rc);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);oc.fromBufferAttribute(l,n),cc(oc,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)oc.fromBufferAttribute(l,a),cc(oc,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function cc(e,t,n,r,i,a,o){let s=ic.distanceSqToPoint(e);if(s<n){let n=new K;ic.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var lc=class extends It{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},uc=class{constructor(){this.type=`Curve`,this.arcLengthDivisions=200}getPoint(){return console.warn(`THREE.Curve: .getPoint() not implemented.`),null}getPointAt(e,t){let n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){let t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],n,r=this.getPoint(0),i=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),i+=n.distanceTo(r),t.push(i),r=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){let n=this.getLengths(),r=0,i=n.length,a;a=t||e*n[i-1];let o=0,s=i-1,c;for(;o<=s;)if(r=Math.floor(o+(s-o)/2),c=n[r]-a,c<0)o=r+1;else if(c>0)s=r-1;else{s=r;break}if(r=s,n[r]===a)return r/(i-1);let l=n[r],u=n[r+1]-l,d=(a-l)/u;return(r+d)/(i-1)}getTangent(e,t){let n=1e-4,r=e-n,i=e+n;r<0&&(r=0),i>1&&(i=1);let a=this.getPoint(r),o=this.getPoint(i),s=t||(a.isVector2?new U:new K);return s.copy(o).sub(a).normalize(),s}getTangentAt(e,t){let n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t){let n=new K,r=[],i=[],a=[],o=new K,s=new q;for(let t=0;t<=e;t++){let n=t/e;r[t]=this.getTangentAt(n,new K)}i[0]=new K,a[0]=new K;let c=Number.MAX_VALUE,l=Math.abs(r[0].x),u=Math.abs(r[0].y),d=Math.abs(r[0].z);l<=c&&(c=l,n.set(1,0,0)),u<=c&&(c=u,n.set(0,1,0)),d<=c&&n.set(0,0,1),o.crossVectors(r[0],n).normalize(),i[0].crossVectors(r[0],o),a[0].crossVectors(r[0],i[0]);for(let t=1;t<=e;t++){if(i[t]=i[t-1].clone(),a[t]=a[t-1].clone(),o.crossVectors(r[t-1],r[t]),o.length()>2**-52){o.normalize();let e=Math.acos(ut(r[t-1].dot(r[t]),-1,1));i[t].applyMatrix4(s.makeRotationAxis(o,e))}a[t].crossVectors(r[t],i[t])}if(t===!0){let t=Math.acos(ut(i[0].dot(i[e]),-1,1));t/=e,r[0].dot(o.crossVectors(i[0],i[e]))>0&&(t=-t);for(let n=1;n<=e;n++)i[n].applyMatrix4(s.makeRotationAxis(r[n],t*n)),a[n].crossVectors(r[n],i[n])}return{tangents:r,normals:i,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:`Curve`,generator:`Curve.toJSON`}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},dc=class extends uc{constructor(e=0,t=0,n=1,r=1,i=0,a=Math.PI*2,o=!1,s=0){super(),this.isEllipseCurve=!0,this.type=`EllipseCurve`,this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=r,this.aStartAngle=i,this.aEndAngle=a,this.aClockwise=o,this.aRotation=s}getPoint(e,t=new U){let n=t,r=Math.PI*2,i=this.aEndAngle-this.aStartAngle,a=Math.abs(i)<2**-52;for(;i<0;)i+=r;for(;i>r;)i-=r;i<2**-52&&(i=a?0:r),this.aClockwise===!0&&!a&&(i===r?i=-r:i-=r);let o=this.aStartAngle+e*i,s=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){let e=Math.cos(this.aRotation),t=Math.sin(this.aRotation),n=s-this.aX,r=c-this.aY;s=n*e-r*t+this.aX,c=n*t+r*e+this.aY}return n.set(s,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},fc=class extends dc{constructor(e,t,n,r,i,a){super(e,t,n,n,r,i,a),this.isArcCurve=!0,this.type=`ArcCurve`}};function pc(){let e=0,t=0,n=0,r=0;function i(i,a,o,s){e=i,t=o,n=-3*i+3*a-2*o-s,r=2*i-2*a+o+s}return{initCatmullRom:function(e,t,n,r,a){i(t,n,a*(n-e),a*(r-t))},initNonuniformCatmullRom:function(e,t,n,r,a,o,s){let c=(t-e)/a-(n-e)/(a+o)+(n-t)/o,l=(n-t)/o-(r-t)/(o+s)+(r-n)/s;c*=o,l*=o,i(t,n,c,l)},calc:function(i){let a=i*i,o=a*i;return e+t*i+n*a+r*o}}}var mc=new K,hc=new pc,gc=new pc,_c=new pc,vc=class extends uc{constructor(e=[],t=!1,n=`centripetal`,r=.5){super(),this.isCatmullRomCurve3=!0,this.type=`CatmullRomCurve3`,this.points=e,this.closed=t,this.curveType=n,this.tension=r}getPoint(e,t=new K){let n=t,r=this.points,i=r.length,a=(i-+!this.closed)*e,o=Math.floor(a),s=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/i)+1)*i:s===0&&o===i-1&&(o=i-2,s=1);let c,l;this.closed||o>0?c=r[(o-1)%i]:(mc.subVectors(r[0],r[1]).add(r[0]),c=mc);let u=r[o%i],d=r[(o+1)%i];if(this.closed||o+2<i?l=r[(o+2)%i]:(mc.subVectors(r[i-1],r[i-2]).add(r[i-1]),l=mc),this.curveType===`centripetal`||this.curveType===`chordal`){let e=this.curveType===`chordal`?.5:.25,t=c.distanceToSquared(u)**+e,n=u.distanceToSquared(d)**+e,r=d.distanceToSquared(l)**+e;n<1e-4&&(n=1),t<1e-4&&(t=n),r<1e-4&&(r=n),hc.initNonuniformCatmullRom(c.x,u.x,d.x,l.x,t,n,r),gc.initNonuniformCatmullRom(c.y,u.y,d.y,l.y,t,n,r),_c.initNonuniformCatmullRom(c.z,u.z,d.z,l.z,t,n,r)}else this.curveType===`catmullrom`&&(hc.initCatmullRom(c.x,u.x,d.x,l.x,this.tension),gc.initCatmullRom(c.y,u.y,d.y,l.y,this.tension),_c.initCatmullRom(c.z,u.z,d.z,l.z,this.tension));return n.set(hc.calc(s),gc.calc(s),_c.calc(s)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new K().fromArray(n))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function yc(e,t,n,r,i){let a=(r-t)*.5,o=(i-n)*.5,s=e*e,c=e*s;return(2*n-2*r+a+o)*c+(-3*n+3*r-2*a-o)*s+a*e+n}function bc(e,t){let n=1-e;return n*n*t}function xc(e,t){return 2*(1-e)*e*t}function Sc(e,t){return e*e*t}function Cc(e,t,n,r){return bc(e,t)+xc(e,n)+Sc(e,r)}function wc(e,t){let n=1-e;return n*n*n*t}function Tc(e,t){let n=1-e;return 3*n*n*e*t}function Ec(e,t){return 3*(1-e)*e*e*t}function Dc(e,t){return e*e*e*t}function Oc(e,t,n,r,i){return wc(e,t)+Tc(e,n)+Ec(e,r)+Dc(e,i)}var kc=class extends uc{constructor(e=new U,t=new U,n=new U,r=new U){super(),this.isCubicBezierCurve=!0,this.type=`CubicBezierCurve`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new U){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(Oc(e,r.x,i.x,a.x,o.x),Oc(e,r.y,i.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ac=class extends uc{constructor(e=new K,t=new K,n=new K,r=new K){super(),this.isCubicBezierCurve3=!0,this.type=`CubicBezierCurve3`,this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new K){let n=t,r=this.v0,i=this.v1,a=this.v2,o=this.v3;return n.set(Oc(e,r.x,i.x,a.x,o.x),Oc(e,r.y,i.y,a.y,o.y),Oc(e,r.z,i.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},jc=class extends uc{constructor(e=new U,t=new U){super(),this.isLineCurve=!0,this.type=`LineCurve`,this.v1=e,this.v2=t}getPoint(e,t=new U){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new U){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Mc=class extends uc{constructor(e=new K,t=new K){super(),this.isLineCurve3=!0,this.type=`LineCurve3`,this.v1=e,this.v2=t}getPoint(e,t=new K){let n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new K){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Nc=class extends uc{constructor(e=new U,t=new U,n=new U){super(),this.isQuadraticBezierCurve=!0,this.type=`QuadraticBezierCurve`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new U){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(Cc(e,r.x,i.x,a.x),Cc(e,r.y,i.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Pc=class extends uc{constructor(e=new K,t=new K,n=new K){super(),this.isQuadraticBezierCurve3=!0,this.type=`QuadraticBezierCurve3`,this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new K){let n=t,r=this.v0,i=this.v1,a=this.v2;return n.set(Cc(e,r.x,i.x,a.x),Cc(e,r.y,i.y,a.y),Cc(e,r.z,i.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Fc=class extends uc{constructor(e=[]){super(),this.isSplineCurve=!0,this.type=`SplineCurve`,this.points=e}getPoint(e,t=new U){let n=t,r=this.points,i=(r.length-1)*e,a=Math.floor(i),o=i-a,s=r[a===0?a:a-1],c=r[a],l=r[a>r.length-2?r.length-1:a+1],u=r[a>r.length-3?r.length-1:a+2];return n.set(yc(o,s.x,c.x,l.x,u.x),yc(o,s.y,c.y,l.y,u.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){let n=this.points[t];e.points.push(n.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){let n=e.points[t];this.points.push(new U().fromArray(n))}return this}},Ic=Object.freeze({__proto__:null,ArcCurve:fc,CatmullRomCurve3:vc,CubicBezierCurve:kc,CubicBezierCurve3:Ac,EllipseCurve:dc,LineCurve:jc,LineCurve3:Mc,QuadraticBezierCurve:Nc,QuadraticBezierCurve3:Pc,SplineCurve:Fc}),Lc=class extends uc{constructor(){super(),this.type=`CurvePath`,this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let n=e.isVector2===!0?`LineCurve`:`LineCurve3`;this.curves.push(new Ic[n](t,e))}return this}getPoint(e,t){let n=e*this.getLength(),r=this.getCurveLengths(),i=0;for(;i<r.length;){if(r[i]>=n){let e=r[i]-n,a=this.curves[i],o=a.getLength(),s=o===0?0:1-e/o;return a.getPointAt(s,t)}i++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let n=0,r=this.curves.length;n<r;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],n;for(let r=0,i=this.curves;r<i.length;r++){let a=i[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,s=a.getPoints(o);for(let e=0;e<s.length;e++){let r=s[e];n&&n.equals(r)||(t.push(r),n=r)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let n=e.curves[t];this.curves.push(n.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){let n=this.curves[t];e.curves.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){let n=e.curves[t];this.curves.push(new Ic[n.type]().fromJSON(n))}return this}},Rc=class extends Lc{constructor(e){super(),this.type=`Path`,this.currentPoint=new U,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let n=new jc(this.currentPoint.clone(),new U(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,r){let i=new Nc(this.currentPoint.clone(),new U(e,t),new U(n,r));return this.curves.push(i),this.currentPoint.set(n,r),this}bezierCurveTo(e,t,n,r,i,a){let o=new kc(this.currentPoint.clone(),new U(e,t),new U(n,r),new U(i,a));return this.curves.push(o),this.currentPoint.set(i,a),this}splineThru(e){let t=new Fc([this.currentPoint.clone()].concat(e));return this.curves.push(t),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,r,i,a){let o=this.currentPoint.x,s=this.currentPoint.y;return this.absarc(e+o,t+s,n,r,i,a),this}absarc(e,t,n,r,i,a){return this.absellipse(e,t,n,n,r,i,a),this}ellipse(e,t,n,r,i,a,o,s){let c=this.currentPoint.x,l=this.currentPoint.y;return this.absellipse(e+c,t+l,n,r,i,a,o,s),this}absellipse(e,t,n,r,i,a,o,s){let c=new dc(e,t,n,r,i,a,o,s);if(this.curves.length>0){let e=c.getPoint(0);e.equals(this.currentPoint)||this.lineTo(e.x,e.y)}this.curves.push(c);let l=c.getPoint(1);return this.currentPoint.copy(l),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},zc=class e extends Er{constructor(e=[new U(0,-.5),new U(.5,0),new U(0,.5)],t=12,n=0,r=Math.PI*2){super(),this.type=`LatheGeometry`,this.parameters={points:e,segments:t,phiStart:n,phiLength:r},t=Math.floor(t),r=ut(r,0,Math.PI*2);let i=[],a=[],o=[],s=[],c=[],l=1/t,u=new K,d=new U,f=new K,p=new K,m=new K,h=0,g=0;for(let t=0;t<=e.length-1;t++)switch(t){case 0:h=e[t+1].x-e[t].x,g=e[t+1].y-e[t].y,f.x=g*1,f.y=-h,f.z=g*0,m.copy(f),f.normalize(),s.push(f.x,f.y,f.z);break;case e.length-1:s.push(m.x,m.y,m.z);break;default:h=e[t+1].x-e[t].x,g=e[t+1].y-e[t].y,f.x=g*1,f.y=-h,f.z=g*0,p.copy(f),f.x+=m.x,f.y+=m.y,f.z+=m.z,f.normalize(),s.push(f.x,f.y,f.z),m.copy(p)}for(let i=0;i<=t;i++){let f=n+i*l*r,p=Math.sin(f),m=Math.cos(f);for(let n=0;n<=e.length-1;n++){u.x=e[n].x*p,u.y=e[n].y,u.z=e[n].x*m,a.push(u.x,u.y,u.z),d.x=i/t,d.y=n/(e.length-1),o.push(d.x,d.y);let r=s[3*n+0]*p,l=s[3*n+1],f=s[3*n+0]*m;c.push(r,l,f)}}for(let n=0;n<t;n++)for(let t=0;t<e.length-1;t++){let r=t+n*e.length,a=r,o=r+e.length,s=r+e.length+1,c=r+1;i.push(a,o,c),i.push(s,c,o)}this.setIndex(i),this.setAttribute(`position`,new Y(a,3)),this.setAttribute(`uv`,new Y(o,2)),this.setAttribute(`normal`,new Y(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.points,t.segments,t.phiStart,t.phiLength)}},Bc=class e extends zc{constructor(e=1,t=1,n=4,r=8){let i=new Rc;i.absarc(0,-t/2,e,Math.PI*1.5,0),i.absarc(0,t/2,e,0,Math.PI*.5),super(i.getPoints(n),r),this.type=`CapsuleGeometry`,this.parameters={radius:e,length:t,capSegments:n,radialSegments:r}}static fromJSON(t){return new e(t.radius,t.length,t.capSegments,t.radialSegments)}},Vc=class e extends Er{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new Y(u,3)),this.setAttribute(`normal`,new Y(d,3)),this.setAttribute(`uv`,new Y(f,2));function _(){let a=new K,_=new K,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new U,m=new K,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Hc=class e extends Vc{constructor(e=1,t=1,n=32,r=1,i=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,i,a,o),this.type=`ConeGeometry`,this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:i,thetaStart:a,thetaLength:o}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Uc=class e extends Er{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new Y(i,3)),this.setAttribute(`normal`,new Y(i.slice(),3)),this.setAttribute(`uv`,new Y(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new K,r=new K,i=new K;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new K;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new K;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new K,t=new K,n=new K,r=new K,o=new U,s=new U,c=new U;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.details)}},Wc=class extends Rc{constructor(e){super(e),this.uuid=lt(),this.type=`Shape`,this.holes=[]}getPointsHoles(e){let t=[];for(let n=0,r=this.holes.length;n<r;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let n=e.holes[t];this.holes.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){let n=this.holes[t];e.holes.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){let n=e.holes[t];this.holes.push(new Rc().fromJSON(n))}return this}},Gc={triangulate:function(e,t,n=2){let r=t&&t.length,i=r?t[0]*n:e.length,a=Kc(e,0,i,n,!0),o=[];if(!a||a.next===a.prev)return o;let s,c,l,u,d,f,p;if(r&&(a=$c(e,t,a,n)),e.length>80*n){s=l=e[0],c=u=e[1];for(let t=n;t<i;t+=n)d=e[t],f=e[t+1],d<s&&(s=d),f<c&&(c=f),d>l&&(l=d),f>u&&(u=f);p=Math.max(l-s,u-c),p=p===0?0:32767/p}return Jc(a,o,n,s,c,p,0),o}};function Kc(e,t,n,r,i){let a,o;if(i===Sl(e,t,n,r)>0)for(a=t;a<n;a+=r)o=yl(a,e[a],e[a+1],o);else for(a=n-r;a>=t;a-=r)o=yl(a,e[a],e[a+1],o);return o&&dl(o,o.next)&&(bl(o),o=o.next),o}function qc(e,t){if(!e)return e;t||=e;let n=e,r;do if(r=!1,!n.steiner&&(dl(n,n.next)||ul(n.prev,n,n.next)===0)){if(bl(n),n=t=n.prev,n===n.next)break;r=!0}else n=n.next;while(r||n!==t);return t}function Jc(e,t,n,r,i,a,o){if(!e)return;!o&&a&&il(e,r,i,a);let s=e,c,l;for(;e.prev!==e.next;)if(c=e.prev,l=e.next,a?Xc(e,r,i,a):Yc(e))t.push(c.i/n|0),t.push(e.i/n|0),t.push(l.i/n|0),bl(e),e=l.next,s=l.next;else if(e=l,e===s){o?o===1?(e=Zc(qc(e),t,n),Jc(e,t,n,r,i,a,2)):o===2&&Qc(e,t,n,r,i,a):Jc(qc(e),t,n,r,i,a,1);break}}function Yc(e){let t=e.prev,n=e,r=e.next;if(ul(t,n,r)>=0)return!1;let i=t.x,a=n.x,o=r.x,s=t.y,c=n.y,l=r.y,u=i<a?i<o?i:o:a<o?a:o,d=s<c?s<l?s:l:c<l?c:l,f=i>a?i>o?i:o:a>o?a:o,p=s>c?s>l?s:l:c>l?c:l,m=r.next;for(;m!==t;){if(m.x>=u&&m.x<=f&&m.y>=d&&m.y<=p&&cl(i,s,a,c,o,l,m.x,m.y)&&ul(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function Xc(e,t,n,r){let i=e.prev,a=e,o=e.next;if(ul(i,a,o)>=0)return!1;let s=i.x,c=a.x,l=o.x,u=i.y,d=a.y,f=o.y,p=s<c?s<l?s:l:c<l?c:l,m=u<d?u<f?u:f:d<f?d:f,h=s>c?s>l?s:l:c>l?c:l,g=u>d?u>f?u:f:d>f?d:f,_=ol(p,m,t,n,r),v=ol(h,g,t,n,r),y=e.prevZ,b=e.nextZ;for(;y&&y.z>=_&&b&&b.z<=v;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&cl(s,u,c,d,l,f,y.x,y.y)&&ul(y.prev,y,y.next)>=0||(y=y.prevZ,b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&cl(s,u,c,d,l,f,b.x,b.y)&&ul(b.prev,b,b.next)>=0))return!1;b=b.nextZ}for(;y&&y.z>=_;){if(y.x>=p&&y.x<=h&&y.y>=m&&y.y<=g&&y!==i&&y!==o&&cl(s,u,c,d,l,f,y.x,y.y)&&ul(y.prev,y,y.next)>=0)return!1;y=y.prevZ}for(;b&&b.z<=v;){if(b.x>=p&&b.x<=h&&b.y>=m&&b.y<=g&&b!==i&&b!==o&&cl(s,u,c,d,l,f,b.x,b.y)&&ul(b.prev,b,b.next)>=0)return!1;b=b.nextZ}return!0}function Zc(e,t,n){let r=e;do{let i=r.prev,a=r.next.next;!dl(i,a)&&fl(i,r,r.next,a)&&gl(i,a)&&gl(a,i)&&(t.push(i.i/n|0),t.push(r.i/n|0),t.push(a.i/n|0),bl(r),bl(r.next),r=e=a),r=r.next}while(r!==e);return qc(r)}function Qc(e,t,n,r,i,a){let o=e;do{let e=o.next.next;for(;e!==o.prev;){if(o.i!==e.i&&ll(o,e)){let s=vl(o,e);o=qc(o,o.next),s=qc(s,s.next),Jc(o,t,n,r,i,a,0),Jc(s,t,n,r,i,a,0);return}e=e.next}o=o.next}while(o!==e)}function $c(e,t,n,r){let i=[],a,o,s,c,l;for(a=0,o=t.length;a<o;a++)s=t[a]*r,c=a<o-1?t[a+1]*r:e.length,l=Kc(e,s,c,r,!1),l===l.next&&(l.steiner=!0),i.push(sl(l));for(i.sort(el),a=0;a<i.length;a++)n=tl(i[a],n);return n}function el(e,t){return e.x-t.x}function tl(e,t){let n=nl(e,t);if(!n)return t;let r=vl(n,e);return qc(r,r.next),qc(n,n.next)}function nl(e,t){let n=t,r=-1/0,i,a=e.x,o=e.y;do{if(o<=n.y&&o>=n.next.y&&n.next.y!==n.y){let e=n.x+(o-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(e<=a&&e>r&&(r=e,i=n.x<n.next.x?n:n.next,e===a))return i}n=n.next}while(n!==t);if(!i)return null;let s=i,c=i.x,l=i.y,u=1/0,d;n=i;do a>=n.x&&n.x>=c&&a!==n.x&&cl(o<l?a:r,o,c,l,o<l?r:a,o,n.x,n.y)&&(d=Math.abs(o-n.y)/(a-n.x),gl(n,e)&&(d<u||d===u&&(n.x>i.x||n.x===i.x&&rl(i,n)))&&(i=n,u=d)),n=n.next;while(n!==s);return i}function rl(e,t){return ul(e.prev,e,t.prev)<0&&ul(t.next,e,e.next)<0}function il(e,t,n,r){let i=e;do i.z===0&&(i.z=ol(i.x,i.y,t,n,r)),i.prevZ=i.prev,i.nextZ=i.next,i=i.next;while(i!==e);i.prevZ.nextZ=null,i.prevZ=null,al(i)}function al(e){let t,n,r,i,a,o,s,c,l=1;do{for(n=e,e=null,a=null,o=0;n;){for(o++,r=n,s=0,t=0;t<l&&(s++,r=r.nextZ,r);t++);for(c=l;s>0||c>0&&r;)s!==0&&(c===0||!r||n.z<=r.z)?(i=n,n=n.nextZ,s--):(i=r,r=r.nextZ,c--),a?a.nextZ=i:e=i,i.prevZ=a,a=i;n=r}a.nextZ=null,l*=2}while(o>1);return e}function ol(e,t,n,r,i){return e=(e-n)*i|0,t=(t-r)*i|0,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,e|t<<1}function sl(e){let t=e,n=e;do(t.x<n.x||t.x===n.x&&t.y<n.y)&&(n=t),t=t.next;while(t!==e);return n}function cl(e,t,n,r,i,a,o,s){return(i-o)*(t-s)>=(e-o)*(a-s)&&(e-o)*(r-s)>=(n-o)*(t-s)&&(n-o)*(a-s)>=(i-o)*(r-s)}function ll(e,t){return e.next.i!==t.i&&e.prev.i!==t.i&&!hl(e,t)&&(gl(e,t)&&gl(t,e)&&_l(e,t)&&(ul(e.prev,e,t.prev)||ul(e,t.prev,t))||dl(e,t)&&ul(e.prev,e,e.next)>0&&ul(t.prev,t,t.next)>0)}function ul(e,t,n){return(t.y-e.y)*(n.x-t.x)-(t.x-e.x)*(n.y-t.y)}function dl(e,t){return e.x===t.x&&e.y===t.y}function fl(e,t,n,r){let i=ml(ul(e,t,n)),a=ml(ul(e,t,r)),o=ml(ul(n,r,e)),s=ml(ul(n,r,t));return!!(i!==a&&o!==s||i===0&&pl(e,n,t)||a===0&&pl(e,r,t)||o===0&&pl(n,e,r)||s===0&&pl(n,t,r))}function pl(e,t,n){return t.x<=Math.max(e.x,n.x)&&t.x>=Math.min(e.x,n.x)&&t.y<=Math.max(e.y,n.y)&&t.y>=Math.min(e.y,n.y)}function ml(e){return e>0?1:e<0?-1:0}function hl(e,t){let n=e;do{if(n.i!==e.i&&n.next.i!==e.i&&n.i!==t.i&&n.next.i!==t.i&&fl(n,n.next,e,t))return!0;n=n.next}while(n!==e);return!1}function gl(e,t){return ul(e.prev,e,e.next)<0?ul(e,t,e.next)>=0&&ul(e,e.prev,t)>=0:ul(e,t,e.prev)<0||ul(e,e.next,t)<0}function _l(e,t){let n=e,r=!1,i=(e.x+t.x)/2,a=(e.y+t.y)/2;do n.y>a!=n.next.y>a&&n.next.y!==n.y&&i<(n.next.x-n.x)*(a-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next;while(n!==e);return r}function vl(e,t){let n=new xl(e.i,e.x,e.y),r=new xl(t.i,t.x,t.y),i=e.next,a=t.prev;return e.next=t,t.prev=e,n.next=i,i.prev=n,r.next=n,n.prev=r,a.next=r,r.prev=a,r}function yl(e,t,n,r){let i=new xl(e,t,n);return r?(i.next=r.next,i.prev=r,r.next.prev=i,r.next=i):(i.prev=i,i.next=i),i}function bl(e){e.next.prev=e.prev,e.prev.next=e.next,e.prevZ&&(e.prevZ.nextZ=e.nextZ),e.nextZ&&(e.nextZ.prevZ=e.prevZ)}function xl(e,t,n){this.i=e,this.x=t,this.y=n,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}function Sl(e,t,n,r){let i=0;for(let a=t,o=n-r;a<n;a+=r)i+=(e[o]-e[a])*(e[a+1]+e[o+1]),o=a;return i}var Cl=class e{static area(e){let t=e.length,n=0;for(let r=t-1,i=0;i<t;r=i++)n+=e[r].x*e[i].y-e[i].x*e[r].y;return n*.5}static isClockWise(t){return e.area(t)<0}static triangulateShape(e,t){let n=[],r=[],i=[];wl(e),Tl(n,e);let a=e.length;t.forEach(wl);for(let e=0;e<t.length;e++)r.push(a),a+=t[e].length,Tl(n,t[e]);let o=Gc.triangulate(n,r);for(let e=0;e<o.length;e+=3)i.push(o.slice(e,e+3));return i}};function wl(e){let t=e.length;t>2&&e[t-1].equals(e[0])&&e.pop()}function Tl(e,t){for(let n=0;n<t.length;n++)e.push(t[n].x),e.push(t[n].y)}var El=class e extends Er{constructor(e=new Wc([new U(.5,.5),new U(-.5,.5),new U(-.5,-.5),new U(.5,-.5)]),t={}){super(),this.type=`ExtrudeGeometry`,this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let n=this,r=[],i=[];for(let t=0,n=e.length;t<n;t++){let n=e[t];a(n)}this.setAttribute(`position`,new Y(r,3)),this.setAttribute(`uv`,new Y(i,2)),this.computeVertexNormals();function a(e){let a=[],o=t.curveSegments===void 0?12:t.curveSegments,s=t.steps===void 0?1:t.steps,c=t.depth===void 0?1:t.depth,l=t.bevelEnabled===void 0||t.bevelEnabled,u=t.bevelThickness===void 0?.2:t.bevelThickness,d=t.bevelSize===void 0?u-.1:t.bevelSize,f=t.bevelOffset===void 0?0:t.bevelOffset,p=t.bevelSegments===void 0?3:t.bevelSegments,m=t.extrudePath,h=t.UVGenerator===void 0?Dl:t.UVGenerator,g,_=!1,v,y,b,x;m&&(g=m.getSpacedPoints(s),_=!0,l=!1,v=m.computeFrenetFrames(s,!1),y=new K,b=new K,x=new K),l||(p=0,u=0,d=0,f=0);let S=e.extractPoints(o),C=S.shape,w=S.holes;if(!Cl.isClockWise(C)){C=C.reverse();for(let e=0,t=w.length;e<t;e++){let t=w[e];Cl.isClockWise(t)&&(w[e]=t.reverse())}}let T=Cl.triangulateShape(C,w),E=C;for(let e=0,t=w.length;e<t;e++){let t=w[e];C=C.concat(t)}function D(e,t,n){return t||console.error(`THREE.ExtrudeGeometry: vec does not exist`),e.clone().addScaledVector(t,n)}let O=C.length,k=T.length;function A(e,t,n){let r,i,a,o=e.x-t.x,s=e.y-t.y,c=n.x-e.x,l=n.y-e.y,u=o*o+s*s,d=o*l-s*c;if(Math.abs(d)>2**-52){let d=Math.sqrt(u),f=Math.sqrt(c*c+l*l),p=t.x-s/d,m=t.y+o/d,h=n.x-l/f,g=n.y+c/f,_=((h-p)*l-(g-m)*c)/(o*l-s*c);r=p+o*_-e.x,i=m+s*_-e.y;let v=r*r+i*i;if(v<=2)return new U(r,i);a=Math.sqrt(v/2)}else{let e=!1;o>2**-52?c>2**-52&&(e=!0):o<-(2**-52)?c<-(2**-52)&&(e=!0):Math.sign(s)===Math.sign(l)&&(e=!0),e?(r=-s,i=o,a=Math.sqrt(u)):(r=o,i=s,a=Math.sqrt(u/2))}return new U(r/a,i/a)}let j=[];for(let e=0,t=E.length,n=t-1,r=e+1;e<t;e++,n++,r++)n===t&&(n=0),r===t&&(r=0),j[e]=A(E[e],E[n],E[r]);let ee=[],M,N=j.concat();for(let e=0,t=w.length;e<t;e++){let t=w[e];M=[];for(let e=0,n=t.length,r=n-1,i=e+1;e<n;e++,r++,i++)r===n&&(r=0),i===n&&(i=0),M[e]=A(t[e],t[r],t[i]);ee.push(M),N=N.concat(M)}for(let e=0;e<p;e++){let t=e/p,n=u*Math.cos(t*Math.PI/2),r=d*Math.sin(t*Math.PI/2)+f;for(let e=0,t=E.length;e<t;e++){let t=D(E[e],j[e],r);re(t.x,t.y,-n)}for(let e=0,t=w.length;e<t;e++){let t=w[e];M=ee[e];for(let e=0,i=t.length;e<i;e++){let i=D(t[e],M[e],r);re(i.x,i.y,-n)}}}let P=d+f;for(let e=0;e<O;e++){let t=l?D(C[e],N[e],P):C[e];_?(b.copy(v.normals[0]).multiplyScalar(t.x),y.copy(v.binormals[0]).multiplyScalar(t.y),x.copy(g[0]).add(b).add(y),re(x.x,x.y,x.z)):re(t.x,t.y,0)}for(let e=1;e<=s;e++)for(let t=0;t<O;t++){let n=l?D(C[t],N[t],P):C[t];_?(b.copy(v.normals[e]).multiplyScalar(n.x),y.copy(v.binormals[e]).multiplyScalar(n.y),x.copy(g[e]).add(b).add(y),re(x.x,x.y,x.z)):re(n.x,n.y,c/s*e)}for(let e=p-1;e>=0;e--){let t=e/p,n=u*Math.cos(t*Math.PI/2),r=d*Math.sin(t*Math.PI/2)+f;for(let e=0,t=E.length;e<t;e++){let t=D(E[e],j[e],r);re(t.x,t.y,c+n)}for(let e=0,t=w.length;e<t;e++){let t=w[e];M=ee[e];for(let e=0,i=t.length;e<i;e++){let i=D(t[e],M[e],r);_?re(i.x,i.y+g[s-1].y,g[s-1].x+n):re(i.x,i.y,c+n)}}}F(),te();function F(){let e=r.length/3;if(l){let e=0,t=O*e;for(let e=0;e<k;e++){let n=T[e];ie(n[2]+t,n[1]+t,n[0]+t)}e=s+p*2,t=O*e;for(let e=0;e<k;e++){let n=T[e];ie(n[0]+t,n[1]+t,n[2]+t)}}else{for(let e=0;e<k;e++){let t=T[e];ie(t[2],t[1],t[0])}for(let e=0;e<k;e++){let t=T[e];ie(t[0]+O*s,t[1]+O*s,t[2]+O*s)}}n.addGroup(e,r.length/3-e,0)}function te(){let e=r.length/3,t=0;ne(E,t),t+=E.length;for(let e=0,n=w.length;e<n;e++){let n=w[e];ne(n,t),t+=n.length}n.addGroup(e,r.length/3-e,1)}function ne(e,t){let n=e.length;for(;--n>=0;){let r=n,i=n-1;i<0&&(i=e.length-1);for(let e=0,n=s+p*2;e<n;e++){let n=O*e,a=O*(e+1);ae(t+r+n,t+i+n,t+i+a,t+r+a)}}}function re(e,t,n){a.push(e),a.push(t),a.push(n)}function ie(e,t,i){oe(e),oe(t),oe(i);let a=r.length/3,o=h.generateTopUV(n,r,a-3,a-2,a-1);I(o[0]),I(o[1]),I(o[2])}function ae(e,t,i,a){oe(e),oe(t),oe(a),oe(t),oe(i),oe(a);let o=r.length/3,s=h.generateSideWallUV(n,r,o-6,o-3,o-2,o-1);I(s[0]),I(s[1]),I(s[3]),I(s[1]),I(s[2]),I(s[3])}function oe(e){r.push(a[e*3+0]),r.push(a[e*3+1]),r.push(a[e*3+2])}function I(e){i.push(e.x),i.push(e.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return Ol(t,n,e)}static fromJSON(t,n){let r=[];for(let e=0,i=t.shapes.length;e<i;e++){let i=n[t.shapes[e]];r.push(i)}let i=t.options.extrudePath;return i!==void 0&&(t.options.extrudePath=new Ic[i.type]().fromJSON(i)),new e(r,t.options)}},Dl={generateTopUV:function(e,t,n,r,i){let a=t[n*3],o=t[n*3+1],s=t[r*3],c=t[r*3+1],l=t[i*3],u=t[i*3+1];return[new U(a,o),new U(s,c),new U(l,u)]},generateSideWallUV:function(e,t,n,r,i,a){let o=t[n*3],s=t[n*3+1],c=t[n*3+2],l=t[r*3],u=t[r*3+1],d=t[r*3+2],f=t[i*3],p=t[i*3+1],m=t[i*3+2],h=t[a*3],g=t[a*3+1],_=t[a*3+2];return Math.abs(s-u)<Math.abs(o-l)?[new U(o,1-c),new U(l,1-d),new U(f,1-m),new U(h,1-_)]:[new U(s,1-c),new U(u,1-d),new U(p,1-m),new U(g,1-_)]}};function Ol(e,t,n){if(n.shapes=[],Array.isArray(e))for(let t=0,r=e.length;t<r;t++){let r=e[t];n.shapes.push(r.uuid)}else n.shapes.push(e.uuid);return n.options=Object.assign({},t),t.extrudePath!==void 0&&(n.options.extrudePath=t.extrudePath.toJSON()),n}var kl=class e extends Uc{constructor(e=1,t=0){let n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1];super(r,[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type=`IcosahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},Al=class e extends Uc{constructor(e=1,t=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],e,t),this.type=`OctahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},jl=class e extends Er{constructor(e=.5,t=1,n=32,r=1,i=0,a=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:i,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);let o=[],s=[],c=[],l=[],u=e,d=(t-e)/r,f=new K,p=new U;for(let e=0;e<=r;e++){for(let e=0;e<=n;e++){let r=i+e/n*a;f.x=u*Math.cos(r),f.y=u*Math.sin(r),s.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,l.push(p.x,p.y)}u+=d}for(let e=0;e<r;e++){let t=e*(n+1);for(let e=0;e<n;e++){let r=e+t,i=r,a=r+n+1,s=r+n+2,c=r+1;o.push(i,a,c),o.push(a,s,c)}}this.setIndex(o),this.setAttribute(`position`,new Y(s,3)),this.setAttribute(`normal`,new Y(c,3)),this.setAttribute(`uv`,new Y(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},Ml=class e extends Er{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new K,d=new K,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=0;f===0&&a===0?v=.5/t:f===n&&s===Math.PI&&(v=-.5/t);for(let n=0;n<=t;n++){let s=n/t;u.x=-e*Math.cos(r+s*i)*Math.sin(a+_*o),u.y=e*Math.cos(a+_*o),u.z=e*Math.sin(r+s*i)*Math.sin(a+_*o),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(s+v,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new Y(p,3)),this.setAttribute(`normal`,new Y(m,3)),this.setAttribute(`uv`,new Y(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},Nl=class e extends Er{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i},n=Math.floor(n),r=Math.floor(r);let a=[],o=[],s=[],c=[],l=new K,u=new K,d=new K;for(let a=0;a<=n;a++)for(let f=0;f<=r;f++){let p=f/r*i,m=a/n*Math.PI*2;u.x=(e+t*Math.cos(m))*Math.cos(p),u.y=(e+t*Math.cos(m))*Math.sin(p),u.z=t*Math.sin(m),o.push(u.x,u.y,u.z),l.x=e*Math.cos(p),l.y=e*Math.sin(p),d.subVectors(u,l).normalize(),s.push(d.x,d.y,d.z),c.push(f/r),c.push(a/n)}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,o=(r+1)*(e-1)+t,s=(r+1)*e+t;a.push(n,i,s),a.push(i,o,s)}this.setIndex(a),this.setAttribute(`position`,new Y(o,3)),this.setAttribute(`normal`,new Y(s,3)),this.setAttribute(`uv`,new Y(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc)}},Pl=class extends fr{static get type(){return`MeshLambertMaterial`}constructor(e){super(),this.isMeshLambertMaterial=!0,this.color=new J(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new J(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new U(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new On,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};function Fl(e,t,n){return!e||!n&&e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function Il(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}var Ll=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`call to abstract method`)}intervalChanged_(){}},Rl=class extends Ll{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:qe,endingEnd:qe}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Je:i=e,o=2*t-n;break;case Ye:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case Je:a=e,s=2*n-t;break;case Ye:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},zl=class extends Ll{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},Bl=class extends Ll{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Vl=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Fl(t,this.TimeBufferType),this.values=Fl(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Fl(e.times,Array),values:Fl(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Bl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new zl(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Rl(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case We:t=this.InterpolantFactoryMethodDiscrete;break;case Ge:t=this.InterpolantFactoryMethodLinear;break;case Ke:t=this.InterpolantFactoryMethodSmooth}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return console.warn(`THREE.KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return We;case this.InterpolantFactoryMethodLinear:return Ge;case this.InterpolantFactoryMethodSmooth:return Ke}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error(`THREE.KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(console.error(`THREE.KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){console.error(`THREE.KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){console.error(`THREE.KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&Il(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){console.error(`THREE.KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Ke,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}};Vl.prototype.TimeBufferType=Float32Array,Vl.prototype.ValueBufferType=Float32Array,Vl.prototype.DefaultInterpolation=Ge;var Hl=class extends Vl{constructor(e,t,n){super(e,t,n)}};Hl.prototype.ValueTypeName=`bool`,Hl.prototype.ValueBufferType=Array,Hl.prototype.DefaultInterpolation=We,Hl.prototype.InterpolantFactoryMethodLinear=void 0,Hl.prototype.InterpolantFactoryMethodSmooth=void 0;var Ul=class extends Vl{};Ul.prototype.ValueTypeName=`color`;var Wl=class extends Vl{};Wl.prototype.ValueTypeName=`number`;var Gl=class extends Ll{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)Ht.slerpFlat(i,0,a,c-o,a,c,s);return i}},Kl=class extends Vl{InterpolantFactoryMethodLinear(e){return new Gl(this.times,this.values,this.getValueSize(),e)}};Kl.prototype.ValueTypeName=`quaternion`,Kl.prototype.InterpolantFactoryMethodSmooth=void 0;var ql=class extends Vl{constructor(e,t,n){super(e,t,n)}};ql.prototype.ValueTypeName=`string`,ql.prototype.ValueBufferType=Array,ql.prototype.DefaultInterpolation=We,ql.prototype.InterpolantFactoryMethodLinear=void 0,ql.prototype.InterpolantFactoryMethodSmooth=void 0;var Jl=class extends Vl{};Jl.prototype.ValueTypeName=`vector`;var Yl=class extends Gn{constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new J(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}},Xl=class extends Yl{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(Gn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new J(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},Zl=new q,Ql=new K,$l=new K,eu=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new U(512,512),this.map=null,this.mapPass=null,this.matrix=new q,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new di,this._frameExtents=new U(1,1),this._viewportCount=1,this._viewports=[new Lt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Ql.setFromMatrixPosition(e.matrixWorld),t.position.copy(Ql),$l.setFromMatrixPosition(e.target.matrixWorld),t.lookAt($l),t.updateMatrixWorld(),Zl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Zl),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(Zl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},tu=class extends eu{constructor(){super(new Ti(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},nu=class extends Yl{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(Gn.DEFAULT_UP),this.updateMatrix(),this.target=new Gn,this.shadow=new tu}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},ru=`\\[\\]\\.:\\/`,iu=RegExp(`[\\[\\]\\.:\\/]`,`g`),au=`[^\\[\\]\\.:\\/]`,ou=`[^`+ru.replace(`\\.`,``)+`]`,su=`((?:WC+[\\/:])*)`.replace(`WC`,au),cu=`(WCOD+)?`.replace(`WCOD`,ou),lu=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,au),uu=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,au),du=RegExp(`^`+su+cu+lu+uu+`$`),fu=[`material`,`materials`,`bones`,`map`],pu=class{constructor(e,t,n){let r=n||mu.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},mu=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(iu,``)}static parseTrackName(e){let t=du.exec(e);if(t===null)throw Error(`PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);fu.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn(`THREE.PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){console.error(`THREE.PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){console.error(`THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){console.error(`THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){console.error(`THREE.PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){console.error(`THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){console.error(`THREE.PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){console.error(`THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;console.error(`THREE.PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.needsUpdate===void 0?t.matrixWorldNeedsUpdate!==void 0&&(s=this.Versioning.MatrixWorldNeedsUpdate):s=this.Versioning.NeedsUpdate;let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){console.error(`THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){console.error(`THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};mu.Composite=pu,mu.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},mu.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},mu.prototype.GetterByBindingType=[mu.prototype._getValue_direct,mu.prototype._getValue_array,mu.prototype._getValue_arrayElement,mu.prototype._getValue_toArray],mu.prototype.SetterByBindingTypeAndVersioning=[[mu.prototype._setValue_direct,mu.prototype._setValue_direct_setNeedsUpdate,mu.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[mu.prototype._setValue_array,mu.prototype._setValue_array_setNeedsUpdate,mu.prototype._setValue_array_setMatrixWorldNeedsUpdate],[mu.prototype._setValue_arrayElement,mu.prototype._setValue_arrayElement_setNeedsUpdate,mu.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[mu.prototype._setValue_fromArray,mu.prototype._setValue_fromArray_setNeedsUpdate,mu.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]],typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`170`}})),typeof window<`u`&&(window.__THREE__?console.warn(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`170`);var hu={gull:{id:`gull`,name:`Gull Compact`,blurb:`Agile and eager to slide. Light on its feet, light in a collision.`,mass:1050,topSpeed:44,accel0:7.2,brake:24,steerMax:.62,latGrip:23,gripBase:9.5,gripDrift:2.5,driftYaw:1.55,yawResponse:11,shove:.7,length:3.9,width:1.8,wheelBase:2.4},breaker:{id:`breaker`,name:`Breaker Sedan`,blurb:`The balanced all-rounder. Predictable, quick, forgiving.`,mass:1350,topSpeed:47.2,accel0:6.3,brake:23,steerMax:.55,latGrip:22,gripBase:9,gripDrift:2.3,driftYaw:1.35,yawResponse:9.5,shove:1,length:4.4,width:1.9,wheelBase:2.7},tempest:{id:`tempest`,name:`Tempest Wagon`,blurb:`Heavy and planted. Shoves traffic aside, turns like a ship.`,mass:1850,topSpeed:49.6,accel0:5.5,brake:21,steerMax:.48,latGrip:21,gripBase:8.2,gripDrift:2,driftYaw:1.12,yawResponse:8,shove:1.6,length:4.9,width:2,wheelBase:3}},gu=[`gull`,`breaker`,`tempest`],_u=[{name:`Coral Surf`,body:16735831,trim:16773600},{name:`Lagoon Teal`,body:1684390,trim:16773600},{name:`Cobalt Tide`,body:3107839,trim:15266047},{name:`Mint Gelato`,body:8118448,trim:1915706},{name:`Orchid Pulse`,body:11032055,trim:16181503},{name:`Sunset Orange`,body:16747051,trim:2757936}],vu=(e,t,n,r,i,a,o,s,c,l,u)=>({name:e,pref:t,skin:i,shirt:n,hair:r,barks:{pickup:a,stunt:o,hit:s,arrive:c,urgent:l,fail:u}}),yu=[vu(`Juno the Thrill-Seeker`,`thrill`,16727425,2825034,15250575,`Make it loud!`,`Again! Again!`,`Okay, that one tickled.`,`Best ride this week.`,`Faster, faster!`,`I wanted a wild one...`),vu(`Pip the Courier`,`fragile`,3523583,5913122,13208417,`Careful - glass inside.`,`Eyes on the road, please!`,`My cargo!`,`Parcel intact. Bless you.`,`Customers are waiting.`,`Package is late. So am I.`),vu(`Marisol the Tourist`,`tourist`,16765773,1710618,15911328,`Show me the sights!`,`Is this part of the tour?`,`Charming... I think.`,`Postcard-perfect.`,`The ferry leaves soon!`,`I missed the view.`),vu(`Dev the Night-Shifter`,`late`,7268257,1052688,9263675,`Clock's ticking. Go.`,`Nice, but keep moving.`,`No time for dents.`,`Clocked in. Thanks.`,`Boss will notice!`,`Overtime again.`),vu(`Ottoline the Cellist`,`musician`,12616956,11820806,15780005,`Tempo allegro, please.`,`Bravo, maestro!`,`Off the beat...`,`Standing ovation.`,`Curtain in minutes!`,`I missed my entrance.`),vu(`Basil the Gardener`,`chill`,4906624,13619151,13803642,`No rush, friend.`,`Whoa, easy there.`,`My tomatoes!`,`Peaceful enough.`,`Ah - a little faster maybe?`,`Well, that is that.`),vu(`Noodle Nell`,`foodie`,16486972,4139549,15119759,`Soup waits for no one.`,`Don't spill the broth!`,`There goes lunch.`,`Delicious timing.`,`Getting cold!`,`Cold noodles. Tragic.`),vu(`Rook the Racer`,`racer`,15680580,1118481,12089942,`Show me what you've got.`,`Sloppy line. Do better.`,`Amateur.`,`Not bad. Not bad.`,`Floor it!`,`Pathetic.`),vu(`Wren the Student`,`late`,6333946,15320170,15978928,`Exam in ten!`,`Ha! Nice one.`,`Ow, my backpack.`,`Made it! Thanks!`,`Hurry hurry hurry!`,`I am so failed.`),vu(`Captain Ferro`,`thrill`,2282478,15067115,13605492,`Take her out to sea!`,`Hard to starboard!`,`Hull breach!`,`Dry land at last.`,`Full steam!`,`Mutiny of the clock.`),vu(`Lotte the Florist`,`fragile`,16020150,8145453,16110518,`Roses hate bumps.`,`Petals everywhere!`,`Mind the bouquet!`,`Fresh as ever.`,`They'll wilt!`,`Wilted. Sigh.`),vu(`Hiro the Chef`,`foodie`,16317180,1120295,15187608,`Mise en place - go!`,`Flambe-level driving.`,`Burnt the sauce.`,`Sublime.`,`Service starts now!`,`Table seven walked.`),vu(`Zadie the DJ`,`musician`,10980346,16743096,9067076,`Drop me at the decks!`,`That's a drop!`,`Skipped a beat.`,`Crowd's going wild.`,`Set time!`,`Dead air. Ugh.`),vu(`Ambrose the Banker`,`late`,9741240,3815994,14725264,`Markets open soon.`,`Is this... safe?`,`Insurance, please.`,`Adequate. Receipt?`,`Time is money!`,`Lost a fortune.`),vu(`Saffi the Surfer`,`thrill`,3003583,16111994,14196847,`Catch the swell, driver!`,`Totally gnarly!`,`Wipeout!`,`Stoked!`,`Waves won't wait!`,`Flat day. Bummer.`),vu(`Gus the Retiree`,`chill`,13358561,16777215,14924186,`Take your time.`,`Goodness gracious!`,`My hip!`,`Lovely stroll... I mean ride.`,`Bingo starts!`,`Oh well, next week.`),vu(`Imogen the Critic`,`tourist`,16622767,7027230,15847344,`Impress me.`,`Theatrical. I like it.`,`Rude.`,`Four stars.`,`Premiere is soon!`,`One star.`),vu(`Tobias the Plumber`,`fragile`,3718648,8149562,13473648,`Tools in the back, gentle!`,`Watch the wrenches!`,`Clang!`,`Pipe dreams delivered.`,`Leak's getting worse!`,`Flooded. Great.`),vu(`Yuna the Pilot`,`racer`,3900150,988970,15319969,`Cleared for takeoff?`,`Smooth banking.`,`Turbulence!`,`Smooth landing.`,`Gate closing!`,`Missed my flight.`),vu(`Kofi the Busker`,`musician`,16498468,2042167,8080178,`Gotta catch the crowd!`,`What a rhythm!`,`Out of tune!`,`Hat's full. Thanks!`,`Rush hour crowd!`,`No tips today.`),vu(`Delphine the Baker`,`foodie`,16569165,9133620,16045755,`Bread's rising!`,`Mind my loaves!`,`Flat bread!`,`Golden crust.`,`Oven timer!`,`Burnt batch.`),vu(`Mx. Quill the Poet`,`tourist`,8490232,5974662,14726286,`Inspire me, driver.`,`A verse! A verse!`,`Ouch, my muse.`,`An ode to you.`,`Deadline looms!`,`Blank page.`),vu(`Bram the Mover`,`chill`,8702998,7029795,12880482,`Heavy load, steady hands.`,`Easy, easy!`,`Crash! Great.`,`Delivered. Phew.`,`Truck's waiting!`,`Overbooked day.`),vu(`Pixel the Streamer`,`racer`,15235577,58879,15254692,`Chat, watch this driver!`,`CLIP IT!`,`Lag spike!`,`Five-star stream.`,`Going live!`,`Stream's dead.`)].map((e,t)=>({...e,id:t})),bu={short:{label:`SHORT`,color:3073696,css:`#2ee6a0`,shape:`circle`},medium:{label:`MEDIUM`,color:16756782,css:`#ffb02e`,shape:`diamond`},long:{label:`LONG`,color:16727538,css:`#ff3df2`,shape:`star`}},xu={harbor:`Harbor Loop`,steps:`Old Steps`,beach:`Sunward Beach`,civic:`Civic Crown`,lantern:`Lantern Ward`},Su={lantern:[`Moonlit Arcade`,`Paper Crane Hall`,`Canal Eight Bridge`,`Ember Noodle Hall`,`Glowfern Conservatory`,`Night Orchid Theatre`,`Kite Market`],steps:[`Cobbler's Stair`,`Saltbread Bakery`,`Old Gull Clocktower`,`Terrace Tea House`,`Whistlewell Square`],civic:[`Crown Museum`,`Sunward Stadium`,`Spiral Garage`,`Fountain of Eleven`,`Mayor's Atrium`,`Glasswing Library`,`Brass Band Pavilion`,`Orrery Observatory`,`Harborview Court`],beach:[`Coral Cabana Hotel`,`Driftwood Pier`,`Sandpiper Resort`,`Starfish Boardwalk`],harbor:[`Ferry Hold 4`,`Lighthouse Quay`,`Anchor Cranes`,`Net & Lantern Cannery`,`Tidewater Terminal`,`Blue Crate Warehouse`,`Salt Dock Market`]},Cu=`Brinecat Alley.Teacup Cut.Wickerlane.The Gullet.Cobbler Squeeze.Maintenance Whisker.Lampwick Passage.Dune Skim.Terrace Slide.Garage Cut.Tram Shed Lane.Drain Run.Plank Deck Dash.Ferry Hold Hop.Sundial Diagonal.Kelp Gap.Fennel Row.Crown Corner.Pelican Pass.Hushed Lane.Rivet Run.Tidy Tunnel.Mosaic Mile.Spindle Way.Orange Peel Lane.Gantry Hop.Salt Cellar.Bellows Alley.Quillfeather Cut.Marlin Mews.Cinder Steps.Honeycomb Run`.split(`.`),wu=class{s;constructor(e){this.s=e>>>0}next(){this.s=this.s+1831565813>>>0;let e=this.s;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}range(e,t){return e+(t-e)*this.next()}int(e,t){return Math.floor(this.range(e,t+1))}pick(e){return e[Math.floor(this.next()*e.length)%e.length]}chance(e){return this.next()<e}shuffle(e){for(let t=e.length-1;t>0;t--){let n=Math.floor(this.next()*(t+1));[e[t],e[n]]=[e[n],e[t]]}return e}get state(){return this.s}},Tu={asphalt:{grip:1,drag:1,accel:1,label:`asphalt`},cobble:{grip:.84,drag:1.05,accel:.96,label:`cobble`},sand:{grip:.66,drag:2.1,accel:.8,label:`sand`},grass:{grip:.74,drag:1.6,accel:.88,label:`grass`},metal:{grip:.88,drag:1,accel:1,label:`metal deck`},shallow:{grip:.5,drag:5,accel:.6,label:`shallow water`},water:{grip:.1,drag:9,accel:.1,label:`water`}},Eu=[0,110,215,330,440,550,660,770,880],Du=[0,100,205,310,415,520,630],Ou=[14,12,13,12,18,12,13,12,14],ku=[14,12,12,18,12,12,22],Au=3.5,ju=[`BABNPBSR`,`NBABBNSS`,`ABBZBPSR`,`BNBZZBSS`,`APNBABSS`,`YWYWYWYY`],Mu={lantern:{walls:[3813212,5849210,8011627,3099243,6966419,9394826],roofs:[2367546,3483983]},steps:{walls:[15918020,15323040,16046520,15251872,14272424,15788248],roofs:[13129021,11880506,14248266]},civic:{walls:[16183264,14674404,12575712,15983571,13624560,15392716],roofs:[10471876,15195856]},beach:{walls:[16774111,16767426,12578538,16771496,16369360,12906712],roofs:[16743001,2802867]},harbor:{walls:[13226966,10992066,14141875,9414837,13218970,12109476],roofs:[5925749,8088154]}};function Nu(e,t){return t===5?`harbor`:e>=6?`beach`:e<=1&&t>=2?`steps`:t<=1?`lantern`:`civic`}function Pu(e,t,n,r,i,a){let o=[];for(let i=0;i<t;i++)for(let t=0;t<e;t++)o.push({id:i*e+t,i:t,j:i,x:n[t],z:r[i]});let s=[],c=o.map(()=>[]);for(let o=0;o<t;o++)for(let l=0;l<e;l++){let u=o*e+l;if(l+1<e){let e=u+1;s.push({a:u,b:e,axis:`x`,len:n[l+1]-n[l],width:a[o]}),c[u].push(e),c[e].push(u)}if(o+1<t){let t=u+e;s.push({a:u,b:t,axis:`z`,len:r[o+1]-r[o],width:i[l]}),c[u].push(t),c[t].push(u)}}return{nodes:o,edges:s,adj:c}}function Fu(e,t,n){let r=e.length,i=new Float32Array(r*r).fill(1e9);for(let e=0;e<r;e++){let a=new Float32Array(r).fill(1e9),o=new Uint8Array(r);a[e]=0;for(let e=0;e<r;e++){let e=-1,i=1e9;for(let t=0;t<r;t++)!o[t]&&a[t]<i&&(i=a[t],e=t);if(e<0)break;o[e]=1;for(let r of t[e]){let t=a[e]+n(e,r);t<a[r]&&(a[r]=t)}}for(let t=0;t<r;t++)i[e*r+t]=a[t]}return i}function Iu(e,t,n,r,i){let a=[],o=e.maxX-e.minX,s=e.maxZ-e.minZ,c=[e.minX];for(let n=1;n<t;n++)c.push(e.minX+o*(n+i.range(-.12,.12))/t);c.push(e.maxX);let l=[e.minZ];for(let t=1;t<n;t++)l.push(e.minZ+s*(t+i.range(-.12,.12))/n);l.push(e.maxZ);for(let e=0;e<t;e++)for(let i=0;i<n;i++)a.push({minX:c[e]+(e===0?0:r/2),maxX:c[e+1]-(e===t-1?0:r/2),minZ:l[i]+(i===0?0:r/2),maxZ:l[i+1]-(i===n-1?0:r/2)});return a}function Lu(e=1337){let t=Eu,n=Du,i=Ou,a=ku,o=t.length,s=n.length,{nodes:u,edges:d,adj:f}=Pu(o,s,t,n,i,a),p=new Map;for(let e of d)p.set(e.a*1e3+e.b,e.len),p.set(e.b*1e3+e.a,e.len);let m=Fu(u,f,(e,t)=>p.get(e*1e3+t)),h=u.length,g={minX:t[0]-i[0]/2-11,maxX:962,minZ:n[0]-a[0]/2-11,maxZ:662},_=n[s-1]+a[s-1]/2+21,v=t[o-1]+i[o-1]/2,y=[],b=(e,t,n=!1)=>y.push({kind:`aabb`,minX:e.minX,maxX:e.maxX,minZ:e.minZ,maxZ:e.maxZ,x:0,z:0,r:0,tag:t,soft:n}),x=(e,t,n,r,i=!1)=>y.push({kind:`circle`,minX:e-n,maxX:e+n,minZ:t-n,maxZ:t+n,x:e,z:t,r:n,tag:r,soft:i});b({minX:g.minX-40,maxX:g.minX,minZ:g.minZ-40,maxZ:g.maxZ+40},`wall`),b({minX:g.minX-40,maxX:g.maxX+40,minZ:g.minZ-40,maxZ:g.minZ},`wall`),b({minX:g.maxX,maxX:g.maxX+40,minZ:g.minZ-40,maxZ:g.maxZ+40},`wall`);let S=[],C=[],w=[],T=Cu.slice(),E=0;new wu(e);let D=[];for(let r=0;r<s-1;r++)for(let s=0;s<o-1;s++){let o=ju[r][s],c=Nu(s,r),u=new wu(e*7919+E*104729>>>0),d={minX:t[s]+i[s]/2,maxX:t[s+1]-i[s+1]/2,minZ:n[r]+a[r]/2,maxZ:n[r+1]-a[r+1]/2},f={minX:d.minX+Au,maxX:d.maxX-Au,minZ:d.minZ+Au,maxZ:d.maxZ-Au},p=o===`P`||o===`Z`||o===`S`||o===`Y`,m=o===`P`?`grass`:o===`S`?`sand`:o===`Z`?`cobble`:`metal`,h={i:s,j:r,idx:E,rect:d,inner:f,kind:o,district:c,open:p,openSurface:m,alleyHalf:3.8,buildings:[],props:[]},g=Mu[c],_=(d.minX+d.maxX)/2,v=(d.minZ+d.maxZ)/2,y=()=>{switch(c){case`lantern`:return u.range(14,30);case`steps`:return u.range(9,22);case`civic`:return u.range(20,62);case`beach`:return u.range(10,24);default:return u.range(8,15)}},O=()=>c===`lantern`?u.chance(.55)?`neon`:`stucco`:c===`civic`?u.chance(.55)?`glass`:`tower`:c===`harbor`?`warehouse`:c===`beach`?`hotel`:`stucco`,k=e=>({rect:e,h:y(),color:u.pick(g.walls),roof:u.pick(g.roofs),style:O()}),A=(e,t)=>{let n=k(e);h.buildings.push(n),D.push({block:h,lot:e,side:t,building:n})};if(o===`B`||o===`R`)Iu(f,u.chance(.4)?3:2,2,5,u).forEach((e,t)=>{A(e,t%2==0?`N`:`S`)});else if(o===`A`||o===`N`||o===`W`){let e=o===`A`;h.alleyAxis=e?`x`:`z`;let t=h.alleyHalf;if(e){h.alleyCenter=v+u.range(-5,5);let e=h.alleyCenter,n={minX:f.minX,maxX:f.maxX,minZ:f.minZ,maxZ:e-t},r={minX:f.minX,maxX:f.maxX,minZ:e+t,maxZ:f.maxZ};Iu(n,2,1,5,u).forEach(e=>A(e,`N`)),Iu(r,2,1,5,u).forEach(e=>A(e,`S`))}else{h.alleyCenter=_+u.range(-5,5);let e=h.alleyCenter,n={minX:f.minX,maxX:e-t,minZ:f.minZ,maxZ:f.maxZ},r={minX:e+t,maxX:f.maxX,minZ:f.minZ,maxZ:f.maxZ};Iu(n,1,2,5,u).forEach((e,t)=>A(e,t===0?`N`:`S`)),Iu(r,1,2,5,u).forEach((e,t)=>A(e,t===0?`N`:`S`))}}else{let e=u.chance(.5),t=f.minX+9,n=f.maxX-9,i=e?f.minZ+9:f.maxZ-9,a=e?f.maxZ-9:f.minZ+9,s=6.5,c=(e,r,o)=>l(e,r,t,i,n,a)>s+o,d=o===`Y`?26:o===`S`?18:22;for(let e=0;e<d;e++){let e=u.range(f.minX+3,f.maxX-3),t=u.range(f.minZ+3,f.maxZ-3);if(o===`P`){if(!c(e,t,1.5))continue;h.props.push({kind:`tree`,x:e,z:t,r:.9,h:u.range(5,8),color:u.pick([3120731,4045674,2067038]),rot:0})}else if(o===`S`){if(!c(e,t,2))continue;let n=u.next();n<.55?h.props.push({kind:`palm`,x:e,z:t,r:.6,h:u.range(6,9),color:3123290,rot:u.range(0,6.28)}):n<.85?h.props.push({kind:`umbrella`,x:e,z:t,r:0,h:2.6,color:u.pick([16735831,1684390,16765773,16727538]),rot:0}):h.props.push({kind:`hut`,x:e,z:t,r:0,w:5,d:4,h:3.2,color:u.pick([16773600,8118448,16758688]),rot:0})}else if(o===`Z`){if(!c(e,t,2))continue;u.chance(.5)?h.props.push({kind:`bench`,x:e,z:t,r:0,w:2.2,d:.7,h:.9,color:9067067,rot:0}):h.props.push({kind:`tree`,x:e,z:t,r:.8,h:u.range(4,6),color:4045674,rot:0})}else{let n=6.1,r=2.5;if(!c(e,t,4.2))continue;h.props.push({kind:`container`,x:e,z:t,r:0,w:u.chance(.5)?n:r,d:u.chance(.5)?r:n,h:2.6*(u.chance(.3)?2:1),color:u.pick([14833484,3107839,1684390,15903035,13621468]),rot:0})}}if(o===`Z`){let t=e?f.maxX-16:f.minX+16,n=f.minZ+16;c(t,n,5)&&h.props.push({kind:`fountain`,x:t,z:n,r:4,h:3,color:8378600,rot:0});let r=e?f.minX+16:f.maxX-16,i=f.maxZ-16;c(r,i,3)&&h.props.push({kind:`statue`,x:r,z:i,r:1.6,h:6,color:15128248,rot:0})}if(o===`S`){let t=e?f.minX+12:f.maxX-12,n=e?f.maxZ-12:f.minZ+12;c(t,n,3)&&h.props.push({kind:`boulder`,x:t,z:n,r:2.6,h:3.2,color:13219740,rot:0})}for(let e of h.props)if(e.r>0)x(e.x,e.z,e.r,`prop`);else if(e.kind===`container`||e.kind===`hut`){let t=(e.w??4)/2,n=(e.d??4)/2;b({minX:e.x-t,maxX:e.x+t,minZ:e.z-n,maxZ:e.z+n},`prop`)}let p={P:`terrace`,S:`dune`,Z:`plaza`,Y:`yard`},g=o===`S`||o===`Y`||o===`P`&&r===0;if(C.push({id:C.length,name:T[C.length%T.length],kind:p[o],ax:t,az:i,bx:n,bz:a,mx:(t+n)/2,mz:(i+a)/2,width:s*2,surface:m,blockIdx:E,covered:!1,ramp:g,saves:0}),g){let e=n-t,r=a-i,o=Math.hypot(e,r),s=e/o,c=r/o,l=.32;w.push({x:t+e*l,z:i+r*l,dx:s,dz:c,len:13,width:7.5,height:3.1})}}for(let e of h.buildings)b(e.rect,`building`);if(h.alleyAxis){let e=h.district===`harbor`?[`ferry`,`deck`]:h.district===`civic`?[`garage`,`tram`,`tunnel`]:h.district===`beach`?[`tunnel`]:h.district===`steps`?[`alley`,`tram`]:[`alley`,`tunnel`,`deck`],t=u.pick(e),n=t===`tunnel`||t===`garage`,r=t===`deck`||t===`ferry`?`metal`:t===`garage`?`asphalt`:`cobble`,i=h.alleyAxis===`x`,a=h.alleyCenter;C.push({id:C.length,name:T[C.length%T.length],kind:t,ax:i?d.minX:a,az:i?a:d.minZ,bx:i?d.maxX:a,bz:i?a:d.maxZ,mx:i?(d.minX+d.maxX)/2:a,mz:i?a:(d.minZ+d.maxZ)/2,width:h.alleyHalf*2,surface:r,blockIdx:E,covered:n,ramp:!1,saves:0})}S.push(h),E++}let O=(e,t)=>t*o+e,k=(e,r)=>{let i=0,a=0,c=1e9;for(let n=0;n<o;n++)Math.abs(t[n]-e)<c&&(c=Math.abs(t[n]-e),i=n);c=1e9;for(let e=0;e<s;e++)Math.abs(n[e]-r)<c&&(c=Math.abs(n[e]-r),a=e);return O(i,a)},A=(e,r)=>{let c=-1,l=-1;for(let n=0;n<o-1;n++)if(e>=t[n]+i[n]/2&&e<=t[n+1]-i[n+1]/2){c=n;break}if(c<0)return null;for(let e=0;e<s-1;e++)if(r>=n[e]+a[e]/2&&r<=n[e+1]-a[e+1]/2){l=e;break}return l<0?null:S[l*(o-1)+c]},j=(e,r,i,a,o)=>{let s=O(a,o),c=i===`x`?O(a+1,o):O(a,o+1),l=i===`x`?t[a+1]-t[a]:n[o+1]-n[o];return{x:e,z:r,a:s,b:c,ta:i===`x`?e-t[a]:r-n[o],len:l}},ee=new wu(e^48879),M={lantern:7,steps:5,civic:9,beach:4,harbor:7},N=[],P=new Map,F=0;Object.keys(M).forEach(e=>{let r=ee.shuffle(D.filter(t=>t.block.district===e&&!t.block.open)),i=Su[e],a=0;for(let o of[0,1])for(let s of r){if(a>=M[e])break;let r=P.get(s.block.idx)??0;if(r>=(o===0?2:3)||s.building.landmark!==void 0)continue;let c=s.block,l=s.lot,u=(l.minX+l.maxX)/2,d=(l.minZ+l.maxZ)/2,f=u,p=d,m,h,g;s.side===`N`?(p=c.rect.minZ-3.4,m=`x`,h=c.i,g=c.j):s.side===`S`?(p=c.rect.maxZ+3.4,m=`x`,h=c.i,g=c.j+1):s.side===`E`?(f=c.rect.maxX+3.4,m=`z`,h=c.i+1,g=c.j):(f=c.rect.minX-3.4,m=`z`,h=c.i,g=c.j);let _=m===`x`?f-t[h]:p-n[g],v=m===`x`?t[h+1]-t[h]:n[g+1]-n[g],y=o===0?26:19;if(_<y||_>v-y)continue;let b=l.maxX-l.minX,x=l.maxZ-l.minZ;if(b<12||x<12)continue;let S=N.length,C=[16735831,1684390,3107839,16756782,16727538,8118448,11032055],w={type:F++%12,x:u,z:d,rect:l,h:0,color:s.building.color,accent:C[(S*3+1)%C.length]};w.h=26+S*7%5*7,s.building.landmark=S,s.building.h=w.h,N.push({id:S,name:i[a],district:e,x:f,z:p,radius:8.5,point:j(f,p,m,h,g),landmark:w,blockIdx:c.idx}),P.set(c.idx,r+1),a++}});let te=[];for(let e of d){let t=u[e.a];for(let n of[.28,.72])for(let r of[-1,1]){let i,a;e.axis===`x`?(i=t.x+e.len*n,a=t.z+r*(e.width/2-3.1)):(i=t.x+r*(e.width/2-3.1),a=t.z+e.len*n),te.push(j(i,a,e.axis,t.i,t.j))}}let ne=[];new wu(e^20973),C.forEach((e,t)=>{t%2==0&&ne.push({id:ne.length,kind:`tailwind`,x:e.mx+(e.bx-e.ax)*.18,z:e.mz+(e.bz-e.az)*.18})}),[3,9,14,17,11].forEach(e=>{let t=C[e%C.length];ne.push({id:ne.length,kind:`spark`,x:t.mx-(t.bx-t.ax)*.1,z:t.mz-(t.bz-t.az)*.1})});for(let e of C){k(e.ax,e.az),k(e.bx,e.bz);let t=c(e.ax,e.az,e.bx,e.bz),n=Math.abs(e.ax-e.bx)+Math.abs(e.az-e.bz);e.saves=Math.max(0,n-t)}let re=[{name:`Harbor Hub`,x:t[4]-i[4]/4,z:n[5]+20,heading:0},{name:`Crown Hub`,x:t[4]+i[4]/4,z:n[3]-30,heading:Math.PI},{name:`Beach Hub`,x:t[6]+30,z:n[1]+a[1]/4,heading:Math.PI/2}],ie=new Map,ae=(e,t)=>(e+200)*1e3+(t+200);for(let e of y){let t=Math.floor(e.minX/16),n=Math.floor(e.maxX/16),r=Math.floor(e.minZ/16),i=Math.floor(e.maxZ/16);for(let a=t;a<=n;a++)for(let t=r;t<=i;t++){let n=ae(a,t),r=ie.get(n);r||(r=[],ie.set(n,r)),r.push(e)}}let oe=(e,t,n)=>{let i=Math.floor((e-n)/16),a=Math.floor((e+n)/16),o=Math.floor((t-n)/16),s=Math.floor((t+n)/16),c=null;for(let l=i;l<=a;l++)for(let i=o;i<=s;i++){let a=ie.get(ae(l,i));if(a)for(let i of a){let a,o,s;if(i.kind===`circle`){let r=e-i.x,c=t-i.z,l=Math.hypot(r,c);if(s=n+i.r-l,s<=0)continue;l<1e-5?(a=1,o=0):(a=r/l,o=c/l)}else{let c=r(e,i.minX,i.maxX),l=r(t,i.minZ,i.maxZ),u=e-c,d=t-l,f=u*u+d*d;if(f>=n*n)continue;if(f>1e-8){let e=Math.sqrt(f);s=n-e,a=u/e,o=d/e}else{let r=e-i.minX,c=i.maxX-e,l=t-i.minZ,u=i.maxZ-t,d=Math.min(r,c,l,u);s=n+d,d===r?(a=-1,o=0):d===c?(a=1,o=0):d===l?(a=0,o=-1):(a=0,o=1)}}(!c||s>c.pen)&&(c={nx:a,nz:o,pen:s,tag:i.tag,soft:!!i.soft})}}return c},I=(e,t)=>{for(let n of w){let r=e-n.x,i=t-n.z,a=r*n.dx+i*n.dz,o=-r*n.dz+i*n.dx;if(a>=0&&a<=n.len&&Math.abs(o)<=n.width/2)return n}return null},se=(e,t)=>{let n=I(e,t);return n?((e-n.x)*n.dx+(t-n.z)*n.dz)/n.len*n.height:0},ce=(e,t)=>t>_,le=(e,r)=>{let c=-1,l=-1;for(let n=0;n<o;n++)if(Math.abs(e-t[n])<=i[n]/2){c=n;break}for(let e=0;e<s;e++)if(Math.abs(r-n[e])<=a[e]/2){l=e;break}let u=r>=n[0]-a[0]/2&&r<=n[s-1]+a[s-1]/2,d=e>=t[0]-i[0]/2&&e<=t[o-1]+i[o-1]/2;return c>=0&&l>=0?{onRoad:!0,axis:null,lat:0,width:i[c],boulevard:!1,intersection:!0}:c>=0&&u?{onRoad:!0,axis:`z`,lat:e-t[c],width:i[c],boulevard:c===4,intersection:!1}:l>=0&&d?{onRoad:!0,axis:`x`,lat:r-n[l],width:a[l],boulevard:l===3||l===s-1,intersection:!1}:{onRoad:!1,axis:null,lat:0,width:0,boulevard:!1,intersection:!1}};return{seed:e,xs:t,zs:n,wx:i,wz:a,cols:o,rows:s,bounds:g,nodes:u,edges:d,adj:f,dmat:m,blocks:S,destinations:N,shortcuts:C,ramps:w,tokens:ne,hubs:re,colliders:y,pickupSpots:te,quayZ:_,beachX:v,shallowX:938,wallX:962,nodeAt:O,nearestNode:k,blockAt:A,surfaceAt:(e,r)=>{if(r>_)return`water`;if(e>938)return`shallow`;if(r>n[s-1]+a[s-1]/2)return`metal`;if(e>v)return`sand`;let o=A(e,r);if(o){if(o.open){let t=o.rect;return e-t.minX<Au||t.maxX-e<Au||r-t.minZ<Au||t.maxZ-r<Au?`asphalt`:o.openSurface}if(o.alleyAxis){let t=C.find(e=>e.blockIdx===o.idx);if(t&&(o.alleyAxis===`x`?Math.abs(r-o.alleyCenter)<o.alleyHalf+.5:Math.abs(e-o.alleyCenter)<o.alleyHalf+.5))return t.surface}return`asphalt`}return e<t[2]+i[2]/2&&r>n[2]-a[2]/2?`cobble`:`asphalt`},isWater:ce,rampHeight:se,rampAt:I,hitTest:oe,roadInfo:le,pathLength:(e,t)=>{let n=1e9;e.a===t.a&&e.b===t.b&&(n=Math.abs(e.ta-t.ta));let r=[[e.a,e.ta],[e.b,e.len-e.ta]],i=[[t.a,t.ta],[t.b,t.len-t.ta]];for(let[e,t]of r)for(let[r,a]of i)n=Math.min(n,t+m[e*h+r]+a);return n},roadPose:(e,c)=>{let l={x:e,z:c,heading:0},u=1e9;for(let a=0;a<o;a++){let o=t[a]+(c<(n[0]+n[s-1])/2?-i[a]/4:i[a]/4),d=Math.abs(e-o);d<u&&(u=d,l={x:o,z:r(c,n[0]+25,n[s-1]-25),heading:c<(n[0]+n[s-1])/2?0:Math.PI})}for(let i=0;i<s;i++){let s=n[i]+(e<(t[0]+t[o-1])/2?a[i]/4:-a[i]/4),d=Math.abs(c-s);d<u&&(u=d,l={x:r(e,t[0]+25,t[o-1]-25),z:s,heading:e<(t[0]+t[o-1])/2?Math.PI/2:-Math.PI/2})}return l},nextHop:(e,t,n)=>{let r=e=>Math.min(m[e*h+n.a]+n.ta,m[e*h+n.b]+(n.len-n.ta)),i=k(e,t),a=u[i];if(c(e,t,a.x,a.z)<18){if(n.a===i||n.b===i)return{x:n.x,z:n.z,node:i};let e=f[i][0],t=1e9;for(let n of f[i]){let i=c(a.x,a.z,u[n].x,u[n].z)+r(n);i<t&&(t=i,e=n)}return{x:u[e].x,z:u[e].z,node:e}}let o=d[0],s=1e9;for(let n of d){let r=u[n.a],i=u[n.b],a=l(e,t,r.x,r.z,i.x,i.z);a<s&&(s=a,o=n)}if(n.a===o.a&&n.b===o.b||n.a===o.b&&n.b===o.a)return{x:n.x,z:n.z,node:o.a};let p=u[o.a],g=u[o.b],_=c(e,t,p.x,p.z)+r(o.a)<=c(e,t,g.x,g.z)+r(o.b)?p:g;return{x:_.x,z:_.z,node:_.id}},isOnRoad:(e,t)=>le(e,t).onRoad}}var Ru=null;function zu(){return Ru||=Lu(),Ru}function Bu(e,t,n){return{x:e,z:t,h:n,vx:0,vz:0,yawRate:0,y:0,vy:0,pitch:0,roll:0,airborne:!1,airTime:0,steer:0,grip:9,surface:`asphalt`,drifting:!1,driftDir:0,driftTime:0,driftAngle:0,driftScore:0,slip:0,clock:0,prevHand:!1,prevThrottle:0,prevBrake:0,brakeDownAt:-9,brakeTapEnd:-9,brakeReleaseAt:-9,surgeTimer:0,gripTurnTimer:0,collideCd:0,prevGroundH:0,prevRampAlong:0,lastRamp:-1,damage:0,px:e,pz:t,ph:n,py:0,speed:0,fwd:0,lat:0,boosting:!1}}var Vu=24,Hu=1.05;function Uu(e){return[Math.sin(e),Math.cos(e)]}function Wu(e){return[-Math.cos(e),Math.sin(e)]}function Gu(e,t,n,s,c,l,u){e.px=e.x,e.pz=e.z,e.ph=e.h,e.py=e.y,e.clock+=s;let[d,f]=Uu(e.h),[p,m]=Wu(e.h),h=e.vx*d+e.vz*f,g=e.vx*p+e.vz*m,_=Math.hypot(e.vx,e.vz);e.boosting=l;let v=n.handbrake&&!e.prevHand;n.brake>.3&&e.prevBrake<=.3&&(e.brakeDownAt=e.clock),n.brake<=.3&&e.prevBrake>.3&&(e.brakeReleaseAt=e.clock,e.clock-e.brakeDownAt<.3&&(e.brakeTapEnd=e.clock));let y=n.throttle>.5&&e.prevThrottle<=.5,b=Math.abs(h),x=(n.steer===0?11:Math.sign(n.steer)!==Math.sign(e.steer)&&e.steer!==0?13:7.5)*(1-.35*i(b/40));e.steer=o(e.steer,n.steer,x,s),Math.abs(e.steer)<.003&&n.steer===0&&(e.steer=0);let S=e.airborne?`asphalt`:c.surfaceAt(e.x,e.z);e.surface=S;let C=Tu[S],w=1-.12*e.damage;e.airborne||(y&&e.clock-e.brakeReleaseAt<.26&&_<8&&e.surgeTimer<=0&&(e.surgeTimer=.9,u.push({type:`surge`})),e.drifting&&y&&e.clock-e.brakeTapEnd<.4&&e.gripTurnTimer<=0&&(e.gripTurnTimer=.75,u.push({type:`gripTurn`}))),e.surgeTimer=Math.max(0,e.surgeTimer-s),e.gripTurnTimer=Math.max(0,e.gripTurnTimer-s);let T=_*3.6;if(e.airborne)e.yawRate=o(e.yawRate,-e.steer*1.1,3,s),e.h=a(e.h+e.yawRate*s),h-=Math.sign(h)*Math.min(Math.abs(h),.35*s),g=o(g,g,0,s);else{let c=h>1?Math.atan2(g,h):0;if(e.driftAngle=c,e.drifting){e.driftTime+=s;let t=e.steer*e.driftDir<-.45,r=Math.abs(c);(t||_<7.5||r<.12&&e.driftTime>.5&&!n.handbrake||n.throttle<.1&&!n.handbrake&&r<.35&&e.driftTime>.7)&&(e.drifting=!1,u.push({type:`driftEnd`,duration:e.driftTime,points:e.driftScore,clean:!0}),e.driftScore=0)}else{let t=Math.abs(e.steer)>.3;T>35&&t&&(v||n.handbrake&&Math.abs(e.steer)>.2)&&(e.drifting=!0,e.driftDir=Math.sign(e.steer),e.driftTime=0,e.driftScore=0,e.yawRate+=-e.driftDir*.75*i(_/22),v&&u.push({type:`snapDrift`,dir:e.driftDir}))}let d=t.topSpeed*(l?1.22:1)*(1-.05*e.damage);if(n.throttle>0&&h>-1.5){let r=t.accel0*Math.max(0,1-h/d*(h/d));r=Math.max(r,.6*t.accel0*!!l),l&&(r*=1.8),e.surgeTimer>0&&(r*=1.55),e.drifting&&(r*=.9),h+=r*n.throttle*C.accel*w*s}else n.throttle>0&&h<=-1.5&&(h+=t.brake*n.throttle*s);n.brake>0&&(h=h>.8?Math.max(0,h-t.brake*n.brake*s*(S===`sand`?.8:1)):Math.max(-11,h-8*n.brake*s-(n.throttle,0)),h>0&&h<=.8&&n.brake>.3&&(h=Math.max(0,h-14*s)));let f=h>=0?1:-1,p=(.7*C.drag+(C.drag-1)*.13*Math.abs(h))*s,m=n.throttle===0&&n.brake===0?1.1*s:0;h-=f*Math.min(Math.abs(h),p+m),h>d&&(h=o(h,d,1.2,s)),n.handbrake&&(h-=f*Math.min(Math.abs(h),(e.drifting?1.2:4.5)*s));let y=(e.drifting||n.handbrake?t.gripDrift:t.gripBase)*C.grip;e.gripTurnTimer>0&&(y=t.gripBase*.55*C.grip),e.grip=y<e.grip?o(e.grip,y,40,s):o(e.grip,y,e.drifting?3:5.5,s);let b=g*(1-Math.exp(-e.grip*s));g-=b,h+=(h>=0?1:-1)*Math.abs(b)*.62;let x=Math.abs(h),E=r(h/3.5,-1,1),D=1/(1+(x/26)**1.4),O=e.steer*t.steerMax*(.35+.65*D)*(l?.85:1),k=E*x/t.wheelBase*Math.tan(O),A=t.latGrip*C.grip/Math.max(x,5)*(e.gripTurnTimer>0?1.45:1);if(k=r(k,-A,A),e.drifting){let n=r(x/16,.35,1);k=-e.steer*t.driftYaw*n*(e.gripTurnTimer>0?1.4:1),k+=-e.driftDir*.22*n*(1-Math.abs(e.steer))}else n.handbrake?k*=1.35:k=-k;!e.drifting&&!n.handbrake||e.drifting||(k=-k),Math.abs(Math.atan2(g,Math.abs(h)+.5))>.85&&(k*=.4),e.yawRate=o(e.yawRate,k,t.yawResponse*(e.drifting?.75:1),s),e.h=a(e.h+e.yawRate*s)}let[E,D]=Uu(e.h),[O,k]=Wu(e.h);e.vx=h*d+g*p,e.vz=h*f+g*m,e.x+=e.vx*s,e.z+=e.vz*s;let A=c.rampAt(e.x,e.z),j=A?c.rampHeight(e.x,e.z):0;if(!e.airborne){let t=e.prevGroundH-j;if(!A&&e.prevGroundH>.5&&t>.4&&e.lastRamp>=0){let t=c.ramps[e.lastRamp],n=e.vx*t.dx+e.vz*t.dz;n>6&&(e.airborne=!0,e.airTime=0,e.vy=n*t.height/t.len*1,e.y=e.prevGroundH,u.push({type:`takeoff`,speed:n}))}if(!e.airborne){e.y=j;let t=A?A.height/A.len:0;e.pitch=o(e.pitch,A?-Math.atan(t):0,14,s),A?e.lastRamp=c.ramps.indexOf(A):e.prevGroundH<=.05&&(e.lastRamp=-1)}}if(e.airborne){e.vy-=Vu*s,e.y+=e.vy*s,e.airTime+=s;let t=Math.hypot(e.vx,e.vz),i=-Math.atan2(e.vy,Math.max(t,1))*.9+(n.brake-n.throttle)*.12;if(e.pitch=o(e.pitch,i,4,s),e.y<=j&&e.vy<0){let t=-e.vy;e.y=j,e.airborne=!1;let[n,i]=Uu(e.h),a=Math.hypot(e.vx,e.vz),o=a>1?Math.abs(Math.acos(r((e.vx*n+e.vz*i)/a,-1,1))):0;if(u.push({type:`landing`,airTime:e.airTime,align:o,impact:t}),t>8){let n=1-r((t-8)*.03,0,.25);e.vx*=n,e.vz*=n}e.vy=0,e.pitch=0}}e.prevGroundH=e.airborne?0:j,e.collideCd=Math.max(0,e.collideCd-s),(!e.airborne||e.y<1.2)&&Ku(e,t,c,u),e.speed=Math.hypot(e.vx,e.vz);let[ee,M]=Uu(e.h),[N,P]=Wu(e.h);e.fwd=e.vx*ee+e.vz*M,e.lat=e.vx*N+e.vz*P,e.slip=e.fwd>1?Math.atan2(e.lat,e.fwd):0,e.roll=o(e.roll,r(-e.lat*.012+e.steer*e.speed*.0018*(e.fwd>0?1:-1),-.16,.16),8,s),e.drifting&&(e.driftScore+=s),e.prevHand=n.handbrake,e.prevThrottle=n.throttle,e.prevBrake=n.brake}function Ku(e,t,n,i){let[a,o]=Uu(e.h),s=t.length/2-Hu+.15,c=[s,0,-s],l=Hu+(t.width-1.9)*.2;for(let t=0;t<2;t++)for(let t of c){let s=n.hitTest(e.x+a*t,e.z+o*t,l);if(!s)continue;e.x+=s.nx*s.pen,e.z+=s.nz*s.pen;let c=e.vx*s.nx+e.vz*s.nz;if(c<0){let n=-c,l=s.soft?.05:.3;e.vx-=(1+l)*c*s.nx,e.vz-=(1+l)*c*s.nz;let u=s.soft?.985:.955;e.vx*=u,e.vz*=u;let d=-Math.cos(e.h),f=Math.sin(e.h),p=(d*s.nx+f*s.nz)*t;e.yawRate+=r(-p*n*.05+(s.nx*o-s.nz*a)*n*.015,-1.1,1.1),n>1.5&&e.collideCd<=0&&(e.collideCd=.3,i.push({type:`collision`,impact:n,tag:s.tag,nx:s.nx,nz:s.nz,px:e.x+a*t,pz:e.z+o*t}),e.drifting&&n>4&&(e.drifting=!1,i.push({type:`driftEnd`,duration:e.driftTime,points:e.driftScore,clean:!1}),e.driftScore=0))}}}var qu=class{cam=new $r(78,16/9,.3,2600);mode=`near`;yaw=0;pos=new K;look=new K;shake=0;shakeT=0;roll=0;lookBack=!1;reducedMotion=!1;shakeScale=1;fovBase=78;init=!1;reset(){this.init=!1}cycle(){return this.mode=this.mode===`near`?`far`:this.mode===`far`?`bumper`:`near`,this.mode}impulse(e){this.shake=Math.min(1,this.shake+e)}setLookBack(e){this.lookBack=e}update(e,t,n,i,s,c=!1){let l=e.px+(e.x-e.px)*t,u=e.pz+(e.z-e.pz)*t,d=e.py+(e.y-e.py)*t,f=e.h-e.ph;f=a(f);let p=e.ph+f*t,m=e.speed,h=r(m/45,0,1),g=p;m>6&&e.fwd>0?g=p+a(Math.atan2(e.vx,e.vz)-p)*(e.drifting?.55:.3):e.fwd<-2&&(g=p+Math.PI,g=this.yaw+a(g-this.yaw)*.25),this.lookBack&&(g=p+Math.PI),this.init||(this.yaw=p),this.yaw=a(this.yaw+a(g-this.yaw)*(1-Math.exp(-(this.lookBack?16:c?3:5.5)*n)));let _=this.mode===`near`?6.2:this.mode===`far`?9.6:.4,v=this.mode===`near`?2.5:this.mode===`far`?3.8:1.15,y=r(e.airborne?e.airTime*1.2:0,0,1.6),b=_+h*(this.mode===`bumper`?0:1.2)+y,x=Math.sin(this.yaw),S=Math.cos(this.yaw),C=s&&!this.reducedMotion?.35:0,w=l-x*b,T=u-S*b,E=d+v-C+(this.mode===`bumper`?0:h*.3);if(this.mode!==`bumper`){for(let e=0;e<8;e++){let e=i.hitTest(w,T,1.4);if(!e||E>40)break;w+=e.nx*(e.pen+.1),T+=e.nz*(e.pen+.1)}i.hitTest(w,T,.9)&&(w=l-x*2.2,T=u-S*2.2)}let D=this.init?1-Math.exp(-(this.lookBack?20:11)*n):1;this.pos.x+=(w-this.pos.x)*D,this.pos.y+=(E-this.pos.y)*(this.init?1-Math.exp(-9*n):1),this.pos.z+=(T-this.pos.z)*D,this.init=!0;let O=this.mode===`bumper`?12:3+6*h;this.look.set(l+x*O,d+(this.mode===`bumper`?1:1.2),u+S*O),this.shakeT+=n*60;let k=this.reducedMotion?0:this.shake*this.shakeScale,A=Math.sin(this.shakeT*1.9)*k*.35,j=Math.cos(this.shakeT*2.3)*k*.25;this.shake=o(this.shake,0,7,n),this.cam.position.set(this.pos.x+A,this.pos.y+j,this.pos.z),this.cam.up.set(0,1,0),this.cam.lookAt(this.look);let ee=this.reducedMotion?0:r(-e.slip*.12,-.08,.08)*(e.drifting?1.2:.6);this.roll=o(this.roll,ee,6,n),this.cam.rotateZ(this.roll);let M=this.fovBase+(this.reducedMotion?4:18)*h+(s&&!this.reducedMotion?5:0);this.cam.fov=o(this.cam.fov,M,5,n),this.cam.updateProjectionMatrix()}},Ju=class e{pos=[];nor=[];col=[];uv=[];idx=[];c=new J;vert(e,t,n,r,i,a,o,s,c,l=0,u=0){let d=this.pos.length/3;return this.pos.push(e,t,n),this.nor.push(r,i,a),this.col.push(o,s,c),this.uv.push(l,u),d}quad(e,t,n=[1,1,1,1],r){this.c.setHex(t);let i=e[0],a=e[1],o=e[2],s=a[0]-i[0],c=a[1]-i[1],l=a[2]-i[2],u=o[0]-i[0],d=o[1]-i[1],f=o[2]-i[2],p=c*f-l*d,m=l*u-s*f,h=s*d-c*u,g=Math.hypot(p,m,h)||1;p/=g,m/=g,h/=g;let _=[];for(let t=0;t<4;t++){let i=n[t];_.push(this.vert(e[t][0],e[t][1],e[t][2],p,m,h,this.c.r*i,this.c.g*i,this.c.b*i,r?r[t][0]:0,r?r[t][1]:0))}this.idx.push(_[0],_[1],_[2],_[0],_[2],_[3])}flat(e,t,n,r,i,a,o=1){this.quad([[e,i,t],[e,i,r],[n,i,r],[n,i,t]],a,[o,o,o,o])}strip(e,t,n,r,i,a,o,s){let c=-r,l=n,u=i/2,d=a/2;this.quad([[e-n*u-c*d,o,t-r*u-l*d],[e-n*u+c*d,o,t-r*u+l*d],[e+n*u+c*d,o,t+r*u+l*d],[e+n*u-c*d,o,t+r*u-l*d]],s)}box(e,t,n,r,i,a,o,s={}){let c=e-r/2,l=e+r/2,u=n-a/2,d=n+a/2,f=t+i,p=.72,m=s.cell??5,h=e=>Math.max(1,Math.round(e/m)),g=Math.max(1,Math.round(i/3.6)),_=s.windows;this.quad([[c,t,d],[l,t,d],[l,f,d],[c,f,d]],o,[p,p,1,1],_?[[0,0],[h(r),0],[h(r),g],[0,g]]:void 0),this.quad([[l,t,u],[c,t,u],[c,f,u],[l,f,u]],o,[p,p,1,1],_?[[0,0],[h(r),0],[h(r),g],[0,g]]:void 0),this.quad([[l,t,d],[l,t,u],[l,f,u],[l,f,d]],o,[p,p,1,1],_?[[0,0],[h(a),0],[h(a),g],[0,g]]:void 0),this.quad([[c,t,u],[c,t,d],[c,f,d],[c,f,u]],o,[p,p,1,1],_?[[0,0],[h(a),0],[h(a),g],[0,g]]:void 0);let v=s.topColor??o;this.quad([[c,f,d],[l,f,d],[l,f,u],[c,f,u]],v,[1,1,1,1],_?[[.02,.02],[.03,.02],[.03,.03],[.02,.03]]:void 0),s.noBottom||this.quad([[c,t,u],[l,t,u],[l,t,d],[c,t,d]],o,[.6,.6,.6,.6])}add(e,t,n,r=!0){let i=e.getAttribute(`position`),a=e.getAttribute(`normal`),o=e.getIndex(),s=new W().getNormalMatrix(t),c=new K,l=new K;this.c.setHex(n);let u=this.pos.length/3,d=1/0,f=-1/0,p=[];for(let e=0;e<i.count;e++)c.fromBufferAttribute(i,e).applyMatrix4(t),p.push(c.y),d=Math.min(d,c.y),f=Math.max(f,c.y);for(let e=0;e<i.count;e++){c.fromBufferAttribute(i,e).applyMatrix4(t),l.fromBufferAttribute(a,e).applyMatrix3(s).normalize();let n=r&&f>d?.78+.22*((p[e]-d)/(f-d)):1;this.vert(c.x,c.y,c.z,l.x,l.y,l.z,this.c.r*n,this.c.g*n,this.c.b*n)}if(o)for(let e=0;e<o.count;e++)this.idx.push(u+o.getX(e));else for(let e=0;e<i.count;e++)this.idx.push(u+e)}static tmpM=new q;cyl(t,n,r,i,a,o,s,c=10){let l=new Vc(i,a,o,c,1);e.tmpM.makeTranslation(t,n+o/2,r),this.add(l,e.tmpM,s),l.dispose()}sphere(t,n,r,i,a,o=1,s=1,c=1,l=8){let u=new Ml(i,l,Math.max(4,l-2));e.tmpM.compose(new K(t,n,r),new Ht,new K(o,s,c)),this.add(u,e.tmpM,a),u.dispose()}torus(t,n,r,i,a,o,s=0,c=0,l=Math.PI*2,u=24){let d=new Nl(i,a,6,u,l);e.tmpM.compose(new K(t,n,r),new Ht().setFromEuler(new On(s,c,0)),new K(1,1,1)),this.add(d,e.tmpM,o,!1),d.dispose()}rbox(t,n,r,i,a,o,s,c=0,l=0){let u=new Br(i,a,o);e.tmpM.compose(new K(t,n,r),new Ht().setFromEuler(new On(l,c,0,`YXZ`)),new K(1,1,1)),this.add(u,e.tmpM,s),u.dispose()}get empty(){return this.pos.length===0}build(){let e=new Er;return e.setAttribute(`position`,new Y(this.pos,3)),e.setAttribute(`normal`,new Y(this.nor,3)),e.setAttribute(`color`,new Y(this.col,3)),e.setAttribute(`uv`,new Y(this.uv,2)),e.setIndex(this.idx),e.computeBoundingSphere(),e.computeBoundingBox(),e}};function Yu(){let e=document.createElement(`canvas`);e.width=64,e.height=64;let t=e.getContext(`2d`);t.fillStyle=`#ffffff`,t.fillRect(0,0,64,64),t.fillStyle=`#7fa4b3`,t.fillRect(14,12,36,34),t.fillStyle=`#a9ccd8`,t.fillRect(14,12,36,8),t.fillStyle=`#5b7f8f`,t.fillRect(31,12,2,34),t.fillStyle=`#e8e0d0`,t.fillRect(11,46,42,4);let n=new lc(e);return n.wrapS=n.wrapT=x,n.colorSpace=Qe,n.anisotropy=4,n}var Xu=16183264,Zu=16448250;function Qu(e,t,n){let r=n.x,i=n.z,a=n.rect.maxX-n.rect.minX,o=n.rect.maxZ-n.rect.minZ,s=Math.min(a,o),c=n.h,l=n.accent,u=n.color;switch(n.type){case 0:e.box(r,0,i,s*.7,2,s*.7,9080729);for(let t=0;t<5;t++){let n=2+t*(c-6)/5,a=(c-6)/5;e.cyl(r,n,i,3.2-(t+1)*.35,3.2-t*.35,a,t%2?15087942:Zu,14)}e.cyl(r,c-4,i,3.4,2.6,1.2,3356740,14),t.cyl(r,c-2.8,i,2,2,3,16773800,12),e.cyl(r,c+.2,i,.2,3.1,2.4,l,14);break;case 1:e.box(r,0,i,a*.92,4,o*.92,Xu);for(let t=0;t<9;t++)e.cyl(r-a*.38+a*.76*t/8,4,i+o*.4,.7,.7,9,Zu,8);e.box(r,13,i+o*.4,a*.84,1.2,3,Xu),e.cyl(r,4,i-2,s*.26,s*.3,10,15392716,16),e.sphere(r,14,i-2,s*.3,l,1,.85,1,14),e.cyl(r,14+s*.25,i-2,.15,.5,6,16765773,6);break;case 2:{e.box(r,0,i,s*.34,c,s*.34,u),e.box(r,c*.62,i,s*.42,3,s*.42,Xu);let n=new Hc(s*.3,11,4),a=new q().compose(new K(r,c+5.5,i),new Ht().setFromEuler(new On(0,Math.PI/4,0)),new K(1,1,1));e.add(n,a,l),n.dispose();let o=s*.17+.2;for(let[e,n]of[[0,1],[0,-1],[1,0],[-1,0]])t.cyl(r+e*o,c-8.5,i+n*o,.1,.1,.1,16777215,3);t.box(r,c-8,i+o,3.6,3.6,.3,16774864),t.box(r,c-8,i-o,3.6,3.6,.3,16774864),t.box(r+o,c-8,i,.3,3.6,3.6,16774864),t.box(r-o,c-8,i,.3,3.6,3.6,16774864);break}case 3:{let n=Math.min(s*.42,16),a=n+4;e.rbox(r-5,a/2,i,1.2,a+1,1.2,9080729,0,.18),e.rbox(r+5,a/2,i,1.2,a+1,1.2,9080729,0,-.18),e.box(r,0,i,16,1.2,8,7041664),e.torus(r,a,i,n,.45,Zu,0,0),e.torus(r,a,i+1.4,n,.3,l,0,0);for(let t=0;t<8;t++)t/8*Math.PI,e.rbox(r,a,i,n*2,.22,.22,14672874,0,0);for(let t=0;t<4;t++)e.rbox(r,a,i,.2,n*2,.2,14672874,0,0);for(let t=0;t<12;t++){let o=t/12*Math.PI*2,s=[16735831,1684390,16765773,11032055][t%4];e.box(r+Math.cos(o)*n,a+Math.sin(o)*n-1,i+.8,2,1.8,2,s)}t.cyl(r,a,i,1,1,1.5,16773800,8);break}case 4:e.cyl(r,0,i,s*.47,s*.43,13,15722194,28),e.cyl(r,9,i,s*.49,s*.49,3.2,l,28),e.cyl(r,12.9,i,s*.4,s*.4,.3,3120731,28);for(let[n,a]of[[1,1],[1,-1],[-1,1],[-1,-1]])e.box(r+n*s*.46,0,i+a*s*.46,1,30,1,11581379),t.box(r+n*s*.46,29,i+a*s*.46,4,1.6,4,16774864);break;case 5:for(let t=0;t<5;t++){let n=1-t*.17;e.box(r,t*c/5,i,a*.9*n,c/5,o*.9*n,t%2?Xu:u,{windows:!0})}e.cyl(r,c,i,.2,2.2,9,16763196,8),t.sphere(r,c+9.5,i,1.2,16773800),t.box(r,c*.2,i+o*.455,a*.5,1,.3,l);break;case 6:e.box(r-s*.12,0,i,s*.22,c*.9,s*.22,9418952,{windows:!0}),e.rbox(r+s*.05,c*.55,i,1.4,c*1.05,s*.6,l,0,0),e.rbox(r+s*.24,c*.4,i,1,c*.7,s*.4,Xu,0,0),e.box(r,0,i,s*.7,3,s*.5,14208440),t.box(r-s*.12,c*.9,i,1,1,1,16735831);break;case 7:e.box(r,0,i-6,s*.2,c*.7,8,u),e.box(r,0,i+6,s*.2,c*.7,8,u),e.box(r,c*.62,i,s*.26,8,o*.5,l),e.torus(r,c*.6,i,8,1.4,Zu,0,Math.PI/2,Math.PI,20),t.box(r,c*.62+4,i+o*.25,s*.26,1,.3,16773800);break;case 8:e.box(r,0,i+o*.22,a*.9,9,o*.45,u,{windows:!1});for(let t of[-1,1])e.box(r+t*a*.3,0,i-o*.2,1.8,c*.9,1.8,l),e.box(r+t*a*.3,0,i-o*.2-8,1.8,c*.9,1.8,l);e.box(r,c*.9,i-o*.2-4,a*.8,1.8,12,l),e.box(r+a*.1,c*.9-8,i-o*.2-4,6.1,2.6,2.5,14833484),t.box(r+a*.3,c*.9+1,i-o*.2,1,1,1,16727357);break;case 9:for(let t=0;t<5;t++){let n=1-t*.16,a=t*c/5.5;e.box(r,a,i,s*.7*n,c/6.2,s*.7*n,t%2?Xu:u),e.box(r,a+c/6.2,i,s*.95*n,.9,s*.95*n,l)}e.cyl(r,c*.92,i,.1,.4,7,16765773,6);break;case 10:e.box(r,0,i,s*.7,6,s*.7,Xu),e.cyl(r,6,i,s*.26,s*.3,c*.45,u,16),e.sphere(r,6+c*.45,i,s*.27,Zu,1,.9,1,14),e.rbox(r,6+c*.45+s*.2,i+s*.12,2,12,3.5,l,0,.9),t.sphere(r,6+c*.45+s*.45,i,.9,16773800);break;default:for(let n=0;n<6;n++)e.cyl(r,n*5.2,i,s*.38-n*.4,s*.38-n*.4,1,n%2?Xu:u,24),e.cyl(r,n*5.2+1,i,s*.36-n*.4,s*.36-n*.4,4,10332083,24),t.torus(r,n*5.2+2.8,i,s*.37-n*.4,.18,l,Math.PI/2,0,Math.PI*2,28);e.cyl(r,6*5.2,i,.3,1.8,7,16765773,8)}}var $u=3883344,ed=9338992,td=14273974,nd=16763196,rd=(e={})=>new Pl({vertexColors:!0,...e});function id(e){let t=new ps,n=new wu(4242),r=new Ju,i=new Ju,a=new Ju,o=new Ju,s=rd({map:Yu()}),c=rd({side:2}),l=new pr({vertexColors:!0,fog:!0}),u=rd({side:2}),d=new pr({vertexColors:!0,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2,side:2}),{xs:f,zs:p,wx:m,wz:h,cols:g,rows:_}=e,v=e.bounds;r.flat(v.minX-120,v.minZ-120,v.maxX+10,e.quayZ,-.05,14931645),r.flat(f[0]-8,p[_-1]+h[_-1]/2,e.shallowX,e.quayZ,0,12174537),r.flat(e.beachX,p[0]-h[0]/2,e.shallowX,p[_-1]+h[_-1]/2,0,15850660),r.flat(e.shallowX,p[0]-h[0]/2,e.wallX,p[_-1]+h[_-1]/2,-.15,8378070);for(let t of e.edges){let n=e.nodes[t.a],i=e.nodes[t.b],a=n.x<f[2]+20&&n.z>p[2]-20&&i.x<f[2]+20?ed:$u;t.axis===`x`?r.flat(n.x,n.z-t.width/2,i.x,n.z+t.width/2,.03,a):r.flat(n.x-t.width/2,n.z,n.x+t.width/2,i.z,.03,a)}for(let t of e.nodes){let e=t.x<f[2]+20&&t.z>p[2]-20;r.flat(t.x-m[t.i]/2,t.z-h[t.j]/2,t.x+m[t.i]/2,t.z+h[t.j]/2,.035,e?ed:$u,1.02)}let y=(e,t,n,r,a,o=3,s=3.2,c=.28)=>{let l=Math.hypot(n-e,r-t),u=(n-e)/l,d=(r-t)/l;for(let n=0;n+o<=l;n+=o+s)i.strip(e+u*(n+o/2),t+d*(n+o/2),u,d,o,c,.07,a)},b=(e,t,n,r,a,o=.28)=>{let s=Math.hypot(n-e,r-t);i.strip((e+n)/2,(t+r)/2,(n-e)/s,(r-t)/s,s,o,.07,a)};for(let t of e.edges){let n=e.nodes[t.a],r=e.nodes[t.b],a=(t.axis===`x`?m[n.i]:h[n.j])/2+1,o=(t.axis===`x`?m[r.i]:h[r.j])/2+1,s=+(t.axis===`x`),c=t.axis===`x`?0:1,l=n.x+s*(a+4),u=n.z+c*(a+4),d=r.x-s*(o+4),f=r.z-c*(o+4),p=t.width,g=-c,_=s;if(p>=17){b(l+g*.25,u+_*.25,d+g*.25,f+_*.25,nd,.2),b(l-g*.25,u-_*.25,d-g*.25,f-_*.25,nd,.2);for(let e of[-1,1])y(l+g*p*.25*e,u+_*p*.25*e,d+g*p*.25*e,f+_*p*.25*e,16053492,3,4)}else y(l,u,d,f,nd,3.4,3.4,.24);for(let e of[-1,1])b(l+g*(p/2-.5)*e,u+_*(p/2-.5)*e,d+g*(p/2-.5)*e,f+_*(p/2-.5)*e,15328472,.16);for(let[e,t,l,u]of[[n.x,n.z,1,a],[r.x,r.z,-1,o]]){let n=e+s*l*(u+1.4),r=t+c*l*(u+1.4),a=Math.floor((p-1)/1.5);for(let e=0;e<a;e++){let t=(e-(a-1)/2)*1.5;i.strip(n+g*t,r+_*t,s,c,2.6,.7,.07,15920868)}let o=e+s*l*(u+3.5),d=t+c*l*(u+3.5);i.strip(o+g*p*.25*(l===1?1:-1),d+_*p*.25*(l===1?1:-1),g,_,p*.5-.8,.4,.07,15920868)}}let x=new Ju,S=[],C=new Ju,w=new Ju,T=a,E=[];for(let t of e.blocks){let a=t.rect,s=t.inner;r.flat(a.minX,a.minZ,a.maxX,a.maxZ,.06,td,1);for(let[e,t,n,i]of[[a.minX,a.minZ,a.maxX,a.minZ+.35],[a.minX,a.maxZ-.35,a.maxX,a.maxZ],[a.minX,a.minZ,a.minX+.35,a.maxZ],[a.maxX-.35,a.minZ,a.maxX,a.maxZ]])r.flat(e,t,n,i,.075,10133672);if(t.open){let e=t.kind===`P`?6472830:t.kind===`S`?15916198:t.kind===`Z`?15326402:9082012;if(r.flat(s.minX,s.minZ,s.maxX,s.maxZ,.08,e),t.kind===`P`)for(let e=0;e<14;e++){let e=n.range(s.minX,s.maxX-12),t=n.range(s.minZ,s.maxZ-12);r.flat(e,t,e+n.range(6,12),t+n.range(6,12),.085,n.pick([5814645,7131014,5220972]))}else if(t.kind===`Z`)for(let e=s.minX;e<s.maxX-8;e+=16)for(let t=s.minZ;t<s.maxZ-8;t+=16)r.flat(e,t,e+8,t+8,.085,13483935),r.flat(e+8,t+8,e+16,t+16,.085,13483935);else if(t.kind===`S`){for(let e=0;e<16;e++){let e=n.range(s.minX,s.maxX-14),t=n.range(s.minZ,s.maxZ-6);r.flat(e,t,e+n.range(8,20),t+n.range(1.5,5),.085,n.pick([15323024,16312509]))}r.flat(s.minX,s.maxZ-4,s.maxX,s.maxZ-1,.1,12159838)}else for(let e=s.minZ+6;e<s.maxZ-3;e+=14)i.strip((s.minX+s.maxX)/2,e,1,0,s.maxX-s.minX-8,.3,.12,15255114)}if(t.alleyAxis){let n=e.shortcuts.find(e=>e.blockIdx===t.idx),o=n.surface===`metal`?7306120:n.kind===`garage`?5857388:10259060;if(t.alleyAxis===`x`?r.flat(a.minX,t.alleyCenter-t.alleyHalf,a.maxX,t.alleyCenter+t.alleyHalf,.09,o):r.flat(t.alleyCenter-t.alleyHalf,a.minZ,t.alleyCenter+t.alleyHalf,a.maxZ,.09,o),n.kind===`tram`){let e=t.alleyAxis===`x`;for(let n of[-1.1,1.1])e?i.strip((a.minX+a.maxX)/2,t.alleyCenter+n,1,0,a.maxX-a.minX,.18,.11,13225686):i.strip(t.alleyCenter+n,(a.minZ+a.maxZ)/2,0,1,a.maxZ-a.minZ,.18,.11,13225686)}n.covered&&E.push({sc:n,block:t})}let c=new Ju;for(let r of t.buildings){let t=r.rect,i=(t.minX+t.maxX)/2,a=(t.minZ+t.maxZ)/2,s=t.maxX-t.minX,l=t.maxZ-t.minZ;if(r.landmark!==void 0){let t=e.destinations[r.landmark].landmark;c.box(i,0,a,s,2.2,l,13681834,{noBottom:!0}),Qu(C,o,t);continue}let u=r.h,d=r.color;if(c.box(i,0,a,s,u,l,d,{windows:!0,topColor:r.roof,cell:r.style===`warehouse`?8:5}),x.box(i,u,a,s+.6,.7,l+.6,r.roof),r.style===`tower`)c.box(i,u,a,s*.6,u*.22,l*.6,d,{windows:!0,topColor:r.roof}),x.cyl(i,u+u*.22,a,.15,.3,6,14342874,5);else if(r.style===`hotel`)x.box(i,u*.45,a+l/2+1.4,s*.8,.5,3,n.pick([16735831,1684390,16765773]));else if(r.style===`neon`){let e=n.pick([16727538,3073791,16747051,8191851]);T.box(i,u*.55,a+l/2+.08,s*.96,.5,.2,e),T.box(i,u*.3,a+l/2+.08,s*.96,.4,.2,n.pick([16727538,3073791])),T.box(i+s/2+.08,u*.5,a,.2,u*.5,.8,e)}else r.style===`warehouse`?(x.box(i,u+.7,a,s*.9,1.4,l*.14,5925749),c.box(i,0,a+l/2+.05,s*.9,1.2,.3,n.pick([14833484,3107839,15903035]),{noBottom:!0})):n.chance(.5)&&x.cyl(i+n.range(-s/4,s/4),u+.7,a+n.range(-l/4,l/4),1.3,1.3,2.6,11569771,8)}S.push(c);for(let e of t.props)switch(e.kind){case`tree`:C.cyl(e.x,0,e.z,.25,.4,e.h*.45,8018490,6),C.sphere(e.x,e.h*.7,e.z,e.h*.38,e.color,1,1.1,1,8);break;case`palm`:{let t=new Vc(.25,.4,e.h,6),n=new q().compose(new K(e.x,e.h/2,e.z),new Ht().setFromEuler(new On(.12,e.rot,.06)),new K(1,1,1));C.add(t,n,10516560),t.dispose();for(let t=0;t<6;t++){let n=t/6*Math.PI*2+e.rot;C.rbox(e.x+Math.cos(n)*1.6,e.h-.3,e.z+Math.sin(n)*1.6,3.4,.14,.9,e.color,-n,.22)}break}case`umbrella`:C.cyl(e.x,0,e.z,.06,.06,2.4,15790320,4),C.cyl(e.x,2.3,e.z,.1,1.9,.6,e.color,8);break;case`hut`:C.box(e.x,0,e.z,e.w??5,e.h,e.d??4,e.color),C.box(e.x,e.h,e.z,(e.w??5)+1,.4,(e.d??4)+1,13715803);break;case`container`:C.box(e.x,0,e.z,e.w??6,e.h,e.d??2.5,e.color,{topColor:e.color});break;case`bench`:C.box(e.x,0,e.z,e.w??2,.5,e.d??.7,e.color);break;case`fountain`:C.cyl(e.x,0,e.z,4,4.2,.9,15326402,18),o.cyl(e.x,.85,e.z,3.5,3.5,.1,8378600,18),C.cyl(e.x,.9,e.z,.5,.7,3.4,15326402,8),o.sphere(e.x,4.4,e.z,.9,12578815);break;case`statue`:C.cyl(e.x,0,e.z,1.3,1.6,2,13616040,8),C.cyl(e.x,2,e.z,.5,.8,3.6,15128248,8),C.sphere(e.x,6,e.z,.8,15128248);break;case`boulder`:C.sphere(e.x,.9,e.z,e.r,e.color,1,.7,1,6)}if(!t.open){let e=[[a.minX+14,a.minZ+1.6,1,0],[a.minX+14,a.maxZ-1.6,1,0]];for(let[t,r]of e)for(let e=t;e<a.maxX-10;e+=26)w.cyl(e,0,r,.1,.14,5.4,5595246,5),w.box(e,5.2,r,.9,.2,.3,5595246),o.box(e+(r<(a.minZ+a.maxZ)/2?.25:-.25),5.05,r+(r<(a.minZ+a.maxZ)/2?.45:-.45),.5,.15,.3,16773832),n.chance(.4)&&(C.cyl(e+9,0,r,.18,.25,2.2,8018490,5),C.sphere(e+9,3.2,r,1.7,n.pick([4045674,3120731,5884282]),1,1.1,1,7))}}for(let{sc:e,block:t}of E){let n=t.alleyAxis===`x`,r=(n?t.rect.maxX-t.rect.minX:t.rect.maxZ-t.rect.minZ)-6;n?x.box((t.rect.minX+t.rect.maxX)/2,5.4,t.alleyCenter,r,.7,t.alleyHalf*2+1,e.kind===`garage`?5857388:4869980,{noBottom:!1}):x.box(t.alleyCenter,5.4,(t.rect.minZ+t.rect.maxZ)/2,t.alleyHalf*2+1,.7,r,e.kind===`garage`?5857388:4869980)}let D={alley:16747051,tunnel:3073791,deck:16763196,tram:16735831,garage:11032055,ferry:1684390,terrace:8191851,dune:16765773,plaza:16727538,yard:16747051};for(let t of e.shortcuts){let e=D[t.kind]??16777215,n=Math.hypot(t.bx-t.ax,t.bz-t.az),r=(t.bx-t.ax)/n,a=(t.bz-t.az)/n;for(let n of[0,1]){let s=n?t.bx:t.ax,c=n?t.bz:t.az,l=n?-1:1,u=-a,d=r,f=t.width/2+.7;if(t.kind!==`terrace`&&t.kind!==`dune`&&t.kind!==`plaza`&&t.kind!==`yard`){for(let e of[-1,1])C.box(s+u*f*e,0,c+d*f*e,.7,4.6,.7,4869980);let n=new Br(t.width+2.2,.9,.8),r=new q().compose(new K(s,4.9,c),new Ht().setFromEuler(new On(0,Math.atan2(u,d),0)),new K(1,1,1));C.add(n,r,4869980);let i=new Br(t.width+1.6,.42,.9);o.add(i,new q().compose(new K(s,4.9,c),new Ht().setFromEuler(new On(0,Math.atan2(u,d),0)),new K(1,1,1)),e,!1),n.dispose(),i.dispose()}else for(let t of[-1,1])C.cyl(s+u*f*t,0,c+d*f*t,.12,.16,5.2,14342874,5),o.box(s+u*f*t,5.2,c+d*f*t,1.3,.7,.14,e);for(let n=0;n<4;n++){let o=s+r*l*(3.2+n*2.4),f=c+a*l*(3.2+n*2.4),p=Math.min(t.width*.6,3.6);i.strip(o-u*p*.5+r*l*.4,f-d*p*.5+a*l*.4,u*.8+r*l*.6,d*.8+a*l*.6,p,.35,.14,e),i.strip(o+u*p*.5+r*l*.4,f+d*p*.5+a*l*.4,-u*.8+r*l*.6,-d*.8+a*l*.6,p,.35,.14,e)}}}for(let t of e.ramps){let e=t.width/2,n=-t.dz,r=t.dx,a=(e,i,a)=>[t.x+t.dx*e+n*i,a,t.z+t.dz*e+r*i];C.quad([a(0,-e,.1),a(0,e,.1),a(t.len,e,t.height),a(t.len,-e,t.height)].reverse(),9279139),C.quad([a(0,-e,.1),a(t.len,-e,t.height),a(t.len,-e,0),a(0,-e,0)],5923438),C.quad([a(0,e,0),a(t.len,e,0),a(t.len,e,t.height),a(0,e,.1)],5923438),C.quad([a(t.len,-e,0),a(t.len,-e,t.height),a(t.len,e,t.height),a(t.len,e,0)],4869980);for(let n=0;n<6;n++){let r=n/6*t.len,o=(n+.5)/6*t.len,s=r/t.len*t.height+.14,c=o/t.len*t.height+.14;i.quad([a(r,-e,s),a(r,-e+.7,s),a(o,-e+.7,c),a(o,-e,c)].reverse(),nd),i.quad([a(r,e-.7,s),a(r,e,s),a(o,e,c),a(o,e-.7,c)].reverse(),nd)}o.box(t.x+t.dx*(t.len-.4),t.height+.1,t.z+t.dz*(t.len-.4),t.width,.15,.3,16747051)}let O=new Ju;for(let e=v.minX-40;e<v.maxX+100;e+=70){let t=n.range(45,85),r=new Hc(n.range(60,95),t,7);O.add(r,new q().makeTranslation(e,t/2-6,v.minZ-n.range(70,130)),n.pick([5941610,5216867,7059576,9087114])),r.dispose()}for(let t=v.minZ;t<e.quayZ;t+=80){let e=n.range(40,75),r=new Hc(n.range(55,85),e,7);O.add(r,new q().makeTranslation(v.minX-n.range(60,120),e/2-6,t),n.pick([5941610,5216867,7059576,9087114])),r.dispose()}for(let e=0;e<14;e++){let t=v.minZ+30+e*40,r=v.minX-14-e%3*9;O.box(r,4+e%3*5,t,14,6+e%3*3,18,n.pick([15918020,15323040,15251872])),O.box(r,10+e%3*8,t,15,.8,19,13129021)}let k=13617080;C.box((v.minX+v.maxX)/2-6,0,v.minZ-1.2,v.maxX-v.minX+20,2.8,2.4,k),C.box(v.minX-1.2,0,(v.minZ+e.quayZ)/2,2.4,2.8,e.quayZ-v.minZ,k);for(let t=f[0];t<e.shallowX;t+=18)C.cyl(t,0,e.quayZ-.6,.35,.35,.9,2831168,6),o.cyl(t,.9,e.quayZ-.6,.2,.2,.15,16747051,6);C.box((f[0]+e.shallowX)/2,-.2,e.quayZ-.2,e.shallowX-f[0],.7,.6,9082012);for(let t=v.minZ+4;t<e.quayZ;t+=12)o.sphere(e.wallX-3,.2,t,.9,t%24<12?16735831:16777215),C.sphere(e.wallX-3,.2,t,.2,819,1,1,1,4);for(let t=p[0]+30;t<p[_-1]-30;t+=36){let r=e.beachX+12+n.range(-3,18);C.cyl(r,0,t,.25,.4,7,10516560,6);for(let e=0;e<6;e++){let n=e/6*Math.PI*2;C.rbox(r+Math.cos(n)*1.6,6.9,t+Math.sin(n)*1.6,3.4,.14,.9,3123290,-n,.22)}}for(let[t,n,r]of[[300,e.quayZ+70,14833484],[680,e.quayZ+120,3107839]])O.box(t,0,n,90,9,22,r),O.box(t+20,9,n,22,12,16,16183264),O.cyl(t+24,21,n,2.4,2.8,8,3357770,8);let A=(e,n,r,i)=>{if(e.empty)return;let a=new X(e.build(),n);a.castShadow=r,a.receiveShadow=i,t.add(a)};A(r,u,!1,!0),A(i,d,!1,!1);for(let e of S)A(e,s,!0,!0);A(x,c,!0,!0),A(C,c,!0,!0),A(w,c,!1,!1),A(O,c,!1,!1),A(a,l,!1,!1),A(o,l,!1,!1);let j=new Jr({uniforms:{uTime:{value:0},uFog:{value:new J(16107936)},uDeep:{value:new J(1929144)},uShallow:{value:new J(4114134)}},vertexShader:`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,fragmentShader:`
      uniform float uTime; uniform vec3 uFog; uniform vec3 uDeep; uniform vec3 uShallow; varying vec3 vW;
      float h(vec2 p){ return sin(p.x*0.21+uTime*0.9)*0.5+sin(p.y*0.17-uTime*0.7)*0.5+sin((p.x+p.y)*0.11+uTime*0.5)*0.5; }
      void main(){
        vec2 p = vW.xz;
        float w = h(p)*0.5+0.5;
        float coast = smoothstep(0.0, 120.0, length(vec2(max(vW.x-940.0,0.0), max(vW.z-662.0,0.0))));
        vec3 col = mix(uShallow, uDeep, coast*0.9);
        float spark = pow(max(0.0, sin(p.x*0.9+uTime*2.0)*sin(p.y*0.8-uTime*1.7)), 14.0);
        col += vec3(0.85,0.95,1.0)*spark*0.45 + w*0.06;
        float d = length(vW.xz - cameraPosition.xz);
        col = mix(col, uFog, smoothstep(250.0, 900.0, d));
        gl_FragColor = vec4(col,1.0);
      }`}),ee=new X(new mi(4e3,4e3).rotateX(-Math.PI/2),j);ee.position.set(500,-.45,400),t.add(ee);let M=[],N=new Br(.42,.95,.42);N.translate(0,4.5,0);let P=new Ju,F=new tc(N,new pr({color:16777215}),e.nodes.length*4);F.instanceColor=new qs(new Float32Array(e.nodes.length*4*3),3);let te=0,ne=new q;for(let t of e.nodes){let e=m[t.i]/2+.9,n=h[t.j]/2+.9;for(let[r,i,a]of[[-e,-n,`x`],[e,n,`x`],[e,-n,`z`],[-e,n,`z`]])ne.makeTranslation(t.x+r,0,t.z+i),F.setMatrixAt(te,ne),M.push({node:t.id,axis:a}),F.setColorAt(te,new J(3211130)),P.cyl(t.x+r,0,t.z+i,.09,.12,4.6,3817805,5),te++}return A(P,c,!1,!1),F.count=te,F.frustumCulled=!1,t.add(F),{group:t,signalHeads:F,signalMap:M,waterMat:j}}var ad=[{name:`hatch`,len:3.8,wid:1.75,mass:950,weight:.3},{name:`sedan`,len:4.4,wid:1.8,mass:1250,weight:.35},{name:`van`,len:5.2,wid:2,mass:1900,weight:.15},{name:`truck`,len:7.2,wid:2.4,mass:5e3,weight:.1},{name:`bus`,len:10.2,wid:2.5,mass:9e3,weight:.1}],od=[16052198,3107839,16735831,1684390,15903035,8095636,11032055,8118448,15261896,2042436];function sd(e,t,n){let r=(n+e*2.3)%14;if(t===`x`)return r<5.5?0:r<6.5?1:2;let i=(r+7)%14;return i<5.5?0:i<6.5?1:2}var cd=class{world;agents=[];target=44;rng;nextId=1;time=0;events=[];constructor(e,t,n=44){this.world=e,this.rng=new wu(t),this.target=n}crossHalf(e,t){let n=this.world.nodes[e];return(t===`x`?this.world.wx[n.i]:this.world.wz[n.j])/2}edgeLen(e,t){let n=this.world.nodes[e],r=this.world.nodes[t];return Math.abs(n.x-r.x)+Math.abs(n.z-r.z)}edgeAxis(e,t){return this.world.nodes[e].j===this.world.nodes[t].j?`x`:`z`}edgeWidth(e,t){let n=this.world.nodes[e];return this.edgeAxis(e,t)===`x`?this.world.wz[n.j]:this.world.wx[n.i]}place(e){let t=this.world.nodes[e.from],n=this.world.nodes[e.to],r=this.edgeLen(e.from,e.to),i=(n.x-t.x)/r,a=(n.z-t.z)/r,o=this.edgeWidth(e.from,e.to)/4+e.shift;e.x=t.x+i*e.s+-a*o,e.z=t.z+a*e.s+i*o,e.h=Math.atan2(i,a)}spawn(e,t,n,r,i=70,a=280){let o=this.world;for(let s=0;s<24;s++){let s=o.edges[this.rng.int(0,o.edges.length-1)],l=this.rng.chance(.5),u=l?s.b:s.a,d=l?s.a:s.b,f=this.crossHalf(u,s.axis)+4,p=this.crossHalf(d,s.axis)+8;if(s.len-f-p<20)continue;let m=this.rng.range(f,s.len-p),h=this.makeAgent(u,d,m);this.place(h);let g=c(h.x,h.z,e,t);if(g<i||g>a)continue;let _=h.x-e,v=h.z-t,y=Math.hypot(n,r);if(!(y>2&&g<130&&(_*n+v*r)/(g*y)>.35)&&!this.agents.some(e=>c(e.x,e.z,h.x,h.z)<16))return h.speed=h.v0*.8,this.agents.push(h),this.events.push({type:`spawn`,id:h.id}),h}return null}makeAgent(e,t,n){let r=this.rng.next(),i=0,a=1;for(let e=0;e<ad.length;e++)if(i+=ad[e].weight,r<=i){a=e;break}let o=ad[a],s=this.edgeWidth(e,t)>=17,c=a>=3?8.5:11;return{id:this.nextId++,type:a,color:this.rng.int(0,od.length-1),len:o.len,wid:o.wid,mass:o.mass,state:`edge`,from:e,to:t,s:n,turn:null,x:0,z:0,h:0,vx:0,vz:0,yaw:0,speed:0,v0:c+this.rng.range(-1.5,3.5)+(s?4:0),wait:0,shift:0,wreckTime:0,px:0,pz:0,ph:0,alive:!0,fade:0,nearMissCd:0,honked:!1}}populate(e,t){for(let n=0;n<this.target*3&&this.agents.length<this.target;n++)this.spawn(e,t,0,0,45,330);for(let e of this.agents)e.fade=1,e.px=e.x,e.pz=e.z,e.ph=e.h}leader(e,t,n){let r=Math.sin(e.h),i=Math.cos(e.h),a=1e9,o=0,s=!1,c=8+e.speed*1.6,l=(t,n,l,u,d,f,p)=>{let m=t-e.x,h=n-e.z,g=m*r+h*i;if(g<=.2||g>c+d||Math.abs(m*-i+h*r)>(e.wid+f)/2+.7)return;let _=g-e.len/2-d/2;_<a&&(a=_,o=Math.max(0,l*r+u*i),s=p)};for(let n of t){if(n===e||!n.alive)continue;let t=n.state===`wreck`?n.vx:Math.sin(n.h)*n.speed,r=n.state===`wreck`?n.vz:Math.cos(n.h)*n.speed;l(n.x,n.z,t,r,n.len,n.wid,!1)}return l(n.x,n.z,n.vx,n.vz,n.len,1.9,!0),{gap:a,speed:o,isPlayer:s}}update(e,t){this.world,this.time+=e,this.events.length=0;for(let t of this.agents)t.px=t.x,t.pz=t.z,t.ph=t.h,t.nearMissCd=Math.max(0,t.nearMissCd-e),t.fade=Math.min(1,t.fade+e*2);for(let n of this.agents){if(!n.alive)continue;if(n.state===`wreck`){this.updateWreck(n,e);continue}let i=this.leader(n,this.agents,t),a=n.v0,s=1e9;if(n.state===`edge`){let e=this.edgeAxis(n.from,n.to),t=this.edgeLen(n.from,n.to)-this.crossHalf(n.to,e)-3.2-n.s,r=sd(n.to,e,this.time);t>-1&&t<60&&(r===2||r===1&&t>n.speed*1.4+3)&&(s=t-n.len/2+1.6)}let c=Math.min(i.gap,s);if(n.wait>9&&i.gap>3.5&&(c=Math.min(i.gap,1e9)),n.wait>4.5&&i.isPlayer&&i.gap<12&&!n.honked&&(this.events.push({type:`honk`,id:n.id}),n.honked=!0),c<1e8){let e=i.gap<=s?i.speed:0,t=Math.sqrt(Math.max(0,e*e+14*Math.max(0,c-2.2)));a=Math.min(a,t)}n.state===`turn`&&(a=Math.min(a,7.5+(n.type>=3?-2:0)));let l=a>n.speed?3.2:11;if(n.speed+=r(a-n.speed,-l*e,l*e),n.speed<.3&&c<6?n.wait+=e:n.wait=Math.max(0,n.wait-e*2),n.shift=n.wait>4.5&&i.isPlayer?o(n.shift,-3.1,2.2,e):o(n.shift,0,1.6,e),n.wait===0&&(n.honked=!1),n.state===`edge`){n.s+=n.speed*e;let t=this.edgeLen(n.from,n.to),r=this.edgeAxis(n.from,n.to),i=this.crossHalf(n.to,r);n.s>=t-i-.5?this.beginTurn(n):this.place(n)}n.state===`turn`&&this.advanceTurn(n,e)}let n=t.x,i=t.z;for(let e of this.agents){if(!e.alive)continue;let t=c(e.x,e.z,n,i);t>360&&e.state!==`wreck`&&(e.alive=!1),e.state===`wreck`&&(e.wreckTime>6||t>300)&&(e.alive=!1)}this.agents=this.agents.filter(e=>e.alive);let a=0;for(;this.agents.length<this.target&&a++<2&&this.spawn(n,i,t.vx,t.vz););}beginTurn(e){let t=this.world,n=t.nodes[e.to],r=this.edgeAxis(e.from,e.to),i=t.nodes[e.from],a=this.edgeLen(e.from,e.to),o=(n.x-i.x)/a,s=(n.z-i.z)/a,c=t.adj[e.to].filter(t=>t!==e.from),l=c.length?this.pickNext(c,e,o,s):e.from,u=t.nodes[l],d=this.edgeLen(e.to,l),f=(u.x-n.x)/d,p=(u.z-n.z)/d,m=this.edgeAxis(e.to,l),h=this.crossHalf(e.to,r),g=this.crossHalf(e.to,m),_=this.edgeWidth(e.from,e.to)/4,v=this.edgeWidth(e.to,l)/4,y=n.x-o*h+-s*_,b=n.z-s*h+o*_,x=n.x+f*g+-p*v,S=n.z+p*g+f*v,C,w,T=o*f+s*p;if(T>.99)C=(y+x)/2,w=(b+S)/2;else if(T<-.99)C=y+o*6,w=b+s*6;else{let e=(x-y)*o+(S-b)*s;C=y+o*e,w=b+s*e}let E=(Math.hypot(C-y,w-b)+Math.hypot(x-C,S-w))*.5+Math.hypot(x-y,S-b)*.5;e.state=`turn`,e.turn={p0x:y,p0z:b,p1x:C,p1z:w,p2x:x,p2z:S,len:E,t:0,to2:l,fromNode:e.to}}pickNext(e,t,n,r){let i=this.world,a=i.nodes[t.to],o=e[0],s=-1;for(let c of e){let e=i.nodes[c],l=this.edgeLen(t.to,c),u=(e.x-a.x)/l,d=(e.z-a.z)/l,f=n*u+r*d>.9?3:1.4;f*=.5+this.rng.next(),f>s&&(s=f,o=c)}return o}advanceTurn(e,t){let n=e.turn;if(n.t+=e.speed*t/Math.max(4,n.len),n.t>=1){e.state=`edge`,e.from=n.fromNode,e.to=n.to2;let t=this.edgeAxis(e.from,e.to);e.s=this.crossHalf(e.from,t)+.5,e.turn=null,this.place(e);return}let r=n.t,i=1-r;e.x=i*i*n.p0x+2*i*r*n.p1x+r*r*n.p2x,e.z=i*i*n.p0z+2*i*r*n.p1z+r*r*n.p2z;let a=2*i*(n.p1x-n.p0x)+2*r*(n.p2x-n.p1x),o=2*i*(n.p1z-n.p0z)+2*r*(n.p2z-n.p1z);Math.hypot(a,o)>1e-4&&(e.h=Math.atan2(a,o))}strike(e,t,n){if(e.state!==`wreck`){let t=e.speed;e.vx=Math.sin(e.h)*t,e.vz=Math.cos(e.h)*t,e.state=`wreck`,e.wreckTime=0,e.turn=null,e.speed=0}e.vx+=t,e.vz+=n}updateWreck(e,t){e.wreckTime+=t;let n=Math.hypot(e.vx,e.vz),r=n>.01?Math.max(0,1-7.5*t/n):0;e.vx*=r,e.vz*=r,e.x+=e.vx*t,e.z+=e.vz*t,e.yaw=o(e.yaw,0,2.5,t),e.h=a(e.h+e.yaw*t);let i=this.world.hitTest(e.x,e.z,Math.min(e.len,5)/2);if(i){e.x+=i.nx*i.pen,e.z+=i.nz*i.pen;let t=e.vx*i.nx+e.vz*i.nz;t<0&&(e.vx-=1.3*t*i.nx,e.vz-=1.3*t*i.nz)}}},ld=class{max;points;pos;col;size;alpha;vel;life;maxLife;grow;drag;grav;baseAlpha;head=0;mat;c=new J;constructor(e,t){this.max=e,this.pos=new Float32Array(e*3),this.col=new Float32Array(e*3),this.size=new Float32Array(e),this.alpha=new Float32Array(e),this.vel=new Float32Array(e*3),this.life=new Float32Array(e),this.maxLife=new Float32Array(e).fill(1),this.grow=new Float32Array(e),this.drag=new Float32Array(e),this.grav=new Float32Array(e),this.baseAlpha=new Float32Array(e);for(let t=0;t<e;t++)this.pos[t*3+1]=-999;let n=new Er;n.setAttribute(`position`,new gr(this.pos,3)),n.setAttribute(`color`,new gr(this.col,3)),n.setAttribute(`size`,new gr(this.size,1)),n.setAttribute(`alpha`,new gr(this.alpha,1)),this.mat=new Jr({uniforms:{uScale:{value:500}},transparent:!0,depthWrite:!1,blending:t?2:1,vertexShader:`
        attribute float size; attribute float alpha; attribute vec3 color;
        varying float vA; varying vec3 vC; uniform float uScale;
        void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = clamp(size*uScale/max(0.1,-mv.z), 0.0, 220.0); vA = alpha; vC = color; }`,fragmentShader:`
        varying float vA; varying vec3 vC;
        void main(){ vec2 p = gl_PointCoord-0.5; float d = length(p); float a = smoothstep(0.5, 0.05, d)*vA; if(a<0.01) discard; gl_FragColor = vec4(vC, a); }`}),this.points=new sc(n,this.mat),this.points.frustumCulled=!1,this.points.renderOrder=5}setScale(e){this.mat.uniforms.uScale.value=e}emit(e,t,n,r,i,a,o,s,c,l=.8,u=0,d=1.5,f=0){let p=this.head;this.head=(this.head+1)%this.max,this.pos[p*3]=e,this.pos[p*3+1]=t,this.pos[p*3+2]=n,this.vel[p*3]=r,this.vel[p*3+1]=i,this.vel[p*3+2]=a,this.life[p]=o,this.maxLife[p]=o,this.size[p]=s,this.c.setHex(c),this.col[p*3]=this.c.r,this.col[p*3+1]=this.c.g,this.col[p*3+2]=this.c.b,this.baseAlpha[p]=l,this.alpha[p]=l,this.grow[p]=u,this.drag[p]=d,this.grav[p]=f}update(e){for(let t=0;t<this.max;t++){if(this.life[t]<=0){this.alpha[t]=0;continue}this.life[t]-=e;let n=1-this.drag[t]*e;this.vel[t*3]*=n,this.vel[t*3+1]=this.vel[t*3+1]*n-this.grav[t]*e,this.vel[t*3+2]*=n,this.pos[t*3]+=this.vel[t*3]*e,this.pos[t*3+1]+=this.vel[t*3+1]*e,this.pos[t*3+2]+=this.vel[t*3+2]*e,this.pos[t*3+1]<.05&&this.grav[t]>0&&(this.pos[t*3+1]=.05,this.vel[t*3+1]*=-.3),this.size[t]+=this.grow[t]*e;let r=Math.max(0,this.life[t]/this.maxLife[t]);this.alpha[t]=this.baseAlpha[t]*Math.min(1,r*2.2)*+(r>0)}let t=this.points.geometry;t.getAttribute(`position`).needsUpdate=!0,t.getAttribute(`color`).needsUpdate=!0,t.getAttribute(`size`).needsUpdate=!0,t.getAttribute(`alpha`).needsUpdate=!0}},ud=class{max;mesh;head=0;m=new q;q=new Ht;e=new On;constructor(e=700){this.max=e;let t=new mi(.32,1.1).rotateX(-Math.PI/2),n=new pr({color:724242,transparent:!0,opacity:.4,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-4,polygonOffsetUnits:-4});this.mesh=new tc(t,n,e),this.mesh.frustumCulled=!1;let r=new q().makeScale(0,0,0);for(let t=0;t<e;t++)this.mesh.setMatrixAt(t,r);this.mesh.renderOrder=2}add(e,t,n,r=.1){this.e.set(0,n,0),this.q.setFromEuler(this.e),this.m.compose(new K(e,r,t),this.q,new K(1,1,1)),this.mesh.setMatrixAt(this.head,this.m),this.head=(this.head+1)%this.max,this.mesh.instanceMatrix.needsUpdate=!0}},dd=(e,t,n)=>new Br(e,t,n);function fd(e,t){let n=_u[t%_u.length],r=e.length,i=e.width,a=new ps,o=new ps;a.add(o);let s=new Pl({color:n.body}),c=new Pl({color:n.trim}),l=new Pl({color:2303791}),u=new Pl({color:1915722}),d=(e,t,n,r,i,a=o)=>{let s=new X(e,t);return s.position.set(n,r,i),s.castShadow=!0,a.add(s),s};d(dd(i,.32,r),c,0,.38,0),d(dd(i*.98,.46,r*.98),s,0,.78,0);let f=e.id===`gull`?.9:1.2;d(dd(i*.94,.14,f),s,0,1.05,r/2-f/2-.1),d(dd(i*.94,.16,e.id===`tempest`?.5:.9),s,0,1.05,-r/2+.55);let p=e.id===`tempest`?r*.68:e.id===`gull`?r*.52:r*.5,m=e.id===`tempest`?-.35:-.15;d(dd(i*.9,.56,p),u,0,1.3,m),d(dd(i*.94,.1,p*.96),s,0,1.62,m);for(let e of[-1,1])for(let t of[-1,1])d(dd(.1,.56,.1),s,e*i*.45,1.3,m+t*p*.5);for(let e of[-1,1])for(let t=0;t<5;t++)d(dd(.04,.12,.34),c,e*(i/2+.01),.82,-r/2+.5+t*((r-1)/4));let h=new ps;h.position.set(0,1.84,m-.2),d(new Vc(.2,.26,.2,10),l,0,0,0,h);for(let e=0;e<4;e++){let t=d(dd(.62,.05,.16),c,0,.14,0,h);t.rotation.y=e/4*Math.PI*2,t.position.set(Math.cos(e/4*Math.PI*2)*.28,.14,Math.sin(e/4*Math.PI*2)*-.28)}o.add(h);let g=new pr({color:3073696}),_=d(dd(.82,.2,.3),g,0,1.78,m+p*.18+.15);_.castShadow=!1;let v=new pr({color:16774344}),y=new pr({color:8000532});for(let e of[-1,1])d(dd(.34,.16,.06),v,e*(i/2-.3),.8,r/2+.01).castShadow=!1,d(dd(.34,.14,.06),y,e*(i/2-.3),.85,-r/2-.01).castShadow=!1;d(dd(i*.9,.2,.06),l,0,.5,r/2+.02);let b=new ps;d(new Ml(.17,8,6),new Pl({color:15250575}),0,1.35,0,b),d(dd(.34,.34,.2),new Pl({color:2964050}),0,1.08,0,b),b.position.set(-i*.2,.02,m+p*.18),o.add(b);let x=new ps;x.visible=!1,d(new Ml(.17,8,6),new Pl({color:15250575}),0,1.35,0,x),d(dd(.34,.34,.2),new Pl({color:16727425}),0,1.08,0,x),x.position.set(i*.2,.02,m-p*.2),o.add(x);let S=.36,C=[r/2-.85,-r/2+.85],w=[],T=[],E=new Vc(S,S,.26,14).rotateZ(Math.PI/2),D=new Vc(S*.55,S*.55,.28,8).rotateZ(Math.PI/2),O=new Pl({color:n.trim}),k=i/2-.1;for(let e of C)for(let t of[-1,1]){let n=new ps;n.position.set(t*k,S,e);let r=new ps;d(E,l,0,0,0,r),d(D,O,0,0,0,r).castShadow=!1,n.add(r),a.add(n),w.push(r),e>0&&T.push(n)}let A=new X(new Hc(.4,2.6,8).rotateX(-Math.PI/2),new pr({color:8320767,transparent:!0,opacity:.75,blending:2,depthWrite:!1}));A.position.set(0,.55,-r/2-1.3),A.visible=!1,o.add(A);let j=new X(new mi(i*1.5,r*1.25).rotateX(-Math.PI/2),new pr({color:0,transparent:!0,opacity:.28,depthWrite:!1}));return j.position.y=.09,a.add(j),{root:a,body:o,wheels:w,steerPivots:T,turbine:h,display:_,displayMat:g,brakeMat:y,headMat:v,passenger:x,boostGlow:A,spec:e,bodyMat:s,trimMat:c,wheelRadius:S,halfTrack:k,wheelZ:C}}function pd(e,t){let n=_u[t%_u.length];e.bodyMat.color.setHex(n.body),e.trimMat.color.setHex(n.trim)}function md(e){let t=new Ju,n=ad[e],r=n.len,i=n.wid,a=16777215,o=2507087,s=e>=3?.5:.34,c=(e,n,r,o,s=i,c=a)=>t.box(0,e,o,s,n,r,c,{noBottom:!0}),l=e=>{for(let n of e)for(let e of[-1,1])t.box(e*(i/2-.05),0,n,.3,s*2,s*2,2106411)};switch(e){case 0:c(.3,.7,r,0),c(1,.55,r*.56,-.2,i*.92,o),c(1.55,.08,r*.5,-.2,i*.95,a),l([r/2-.7,-r/2+.7]);break;case 1:c(.3,.7,r,0),c(1,.52,r*.5,-.15,i*.92,o),c(1.52,.08,r*.44,-.15,i*.95,a),l([r/2-.8,-r/2+.8]);break;case 2:c(.35,.85,r,0),c(1.2,.7,r*.72,-.4,i*.94,o),c(1.88,.1,r*.7,-.4,i*.98,a),l([r/2-.9,-r/2+.9]);break;case 3:c(.45,1.5,2.2,r/2-1.1),c(1.4,.7,1.8,r/2-1.2,i*.9,o),t.box(0,.7,-1.1,i,2.4,r-2.5,15328472,{noBottom:!0}),l([r/2-1.2,-r/2+1,-r/2+2.3]);break;default:c(.45,2.5,r,0),c(1.3,.9,r*.96,0,i*1.01,o),t.box(0,2.95,0,i*.96,.12,r*.98,16052454),l([r/2-1.6,-r/2+1.8])}return t.build()}var hd=class{group=new ps;meshes=[];tmp=new q;q=new Ht;p=new K;s=new K;col=new J;e=new On;counts=[];constructor(e=90){let t=new Pl({vertexColors:!0});for(let n=0;n<ad.length;n++){let r=new tc(md(n),t,e);r.instanceColor=new qs(new Float32Array(e*3),3),r.castShadow=!0,r.frustumCulled=!1,r.count=0,this.meshes.push(r),this.group.add(r)}}update(e,t){this.counts=this.meshes.map(()=>0);for(let n of e){if(!n.alive)continue;let e=this.meshes[n.type],r=this.counts[n.type]++;if(r>=e.instanceMatrix.count)continue;let i=n.px+(n.x-n.px)*t,a=n.pz+(n.z-n.pz)*t,o=n.h-n.ph;for(;o>Math.PI;)o-=Math.PI*2;for(;o<-Math.PI;)o+=Math.PI*2;let s=n.ph+o*t,c=n.state===`wreck`?Math.min(.12,Math.hypot(n.vx,n.vz)*.01):0;this.e.set(c,s,c*.6,`YXZ`),this.q.setFromEuler(this.e);let l=Math.min(1,n.fade);this.p.set(i,0,a),this.s.set(l,l,l),this.tmp.compose(this.p,this.q,this.s),e.setMatrixAt(r,this.tmp),this.col.setHex(od[n.color%od.length]),e.setColorAt(r,this.col)}for(let e=0;e<this.meshes.length;e++){let t=this.meshes[e];t.count=Math.min(this.counts[e],t.instanceMatrix.count),t.instanceMatrix.needsUpdate=!0,t.instanceColor&&(t.instanceColor.needsUpdate=!0)}}},gd=e=>bu[e].color;function _d(e,t){let n=document.createElement(`canvas`);n.width=128,n.height=128;let r=n.getContext(`2d`);if(r.translate(64,64),r.lineJoin=`round`,r.fillStyle=t,r.strokeStyle=`#10141c`,r.lineWidth=10,r.beginPath(),e===`circle`)r.arc(0,0,42,0,Math.PI*2);else if(e===`diamond`)r.moveTo(0,-52),r.lineTo(46,0),r.lineTo(0,52),r.lineTo(-46,0),r.closePath();else if(e===`star`){for(let e=0;e<10;e++){let t=e%2?22:54,n=-Math.PI/2+e*Math.PI/5;e===0?r.moveTo(Math.cos(n)*t,Math.sin(n)*t):r.lineTo(Math.cos(n)*t,Math.sin(n)*t)}r.closePath()}else r.moveTo(0,54),r.bezierCurveTo(-52,-6,-44,-52,0,-52),r.bezierCurveTo(44,-52,52,-6,0,54);r.stroke(),r.fill(),r.fillStyle=`rgba(255,255,255,0.55)`,r.beginPath(),r.arc(-12,-14,10,0,Math.PI*2),r.fill(),e===`pin`&&(r.fillStyle=`#10141c`,r.beginPath(),r.arc(0,-6,14,0,Math.PI*2),r.fill());let i=new lc(n);return i.colorSpace=Qe,i}function vd(e,t=`#ffffff`){let n=document.createElement(`canvas`);n.width=512,n.height=96;let r=n.getContext(`2d`);r.font=`800 44px "Trebuchet MS", "Segoe UI", sans-serif`;let i=Math.min(500,r.measureText(e).width+40);r.fillStyle=`rgba(14,18,28,0.78)`;let a=(512-i)/2;r.beginPath(),r.roundRect(a,14,i,68,20),r.fill(),r.strokeStyle=t,r.lineWidth=4,r.stroke(),r.fillStyle=`#fff`,r.textAlign=`center`,r.textBaseline=`middle`,r.fillText(e,256,49,470);let o=new lc(n);return o.colorSpace=Qe,o}var yd=class{canvas;sim;renderer;scene=new Es;chase=new qu;city;taxi;traffic=new hd(96);smoke=new ld(1400,!1);glowFx=new ld(900,!0);skids=new ud;sun=new nu(16773334,2.6);hemi=new Xl(13625599,15258288,1.5);sky;skyMat;fares=[];destGroup=new ps;destBeacon;destRing;destSprite;arrow=new ps;arrowMat=new pr({color:16777215,depthTest:!1,transparent:!0,opacity:.95});tokens=[];labels=[];pedBody;pedHead;peds=[];time=0;lastCandKey=``;lastDest=-1;glyphs={};frameTimes=[];pixelRatio=1;lastSun=-1;tmpV=new K;rng=new wu(77);skidAcc=0;prevFwd=0;squat=0;bob=0;settings;menuMode=!1;taxiId=``;constructor(e,t,n,r){this.canvas=e,this.sim=t,this.settings=n,this.renderer=new ws({canvas:e,antialias:!0,powerPreference:`high-performance`,preserveDrawingBuffer:!1}),this.renderer.outputColorSpace=Qe,this.renderer.toneMapping=7,this.renderer.toneMappingExposure=1,this.renderer.shadowMap.enabled=n.shadows,this.renderer.shadowMap.type=2,this.scene.background=new J(16176298),this.scene.fog=new Ts(16176298,160,760),this.sun.castShadow=!0,this.sun.shadow.mapSize.set(2048,2048);let i=this.sun.shadow.camera;i.left=-70,i.right=70,i.top=70,i.bottom=-70,i.near=10,i.far=330,this.sun.shadow.bias=-6e-4,this.sun.shadow.normalBias=.5,this.scene.add(this.sun,this.sun.target,this.hemi),this.skyMat=new Jr({side:1,depthWrite:!1,fog:!1,uniforms:{uTop:{value:new J(4037609)},uHor:{value:new J(16505264)},uSun:{value:new K(.5,.5,.2)}},vertexShader:`varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,fragmentShader:`uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; varying vec3 vD;
        void main(){ float h = clamp(vD.y,0.0,1.0); vec3 c = mix(uHor, uTop, pow(h,0.55));
          float s = max(dot(normalize(vD), normalize(uSun)),0.0); c += vec3(1.0,0.82,0.55)*pow(s,24.0)*0.5 + vec3(1.0,0.95,0.8)*pow(s,900.0)*2.0;
          // soft cloud bands
          float b = smoothstep(0.08,0.22,h)*smoothstep(0.45,0.2,h); float n = sin(vD.x*14.0+vD.z*9.0)*sin(vD.z*11.0-vD.x*5.0); c = mix(c, vec3(1.0), clamp(n,0.0,1.0)*b*0.35);
          gl_FragColor = vec4(c,1.0); }`}),this.sky=new X(new Ml(1800,24,16),this.skyMat),this.sky.renderOrder=-10,this.scene.add(this.sky),this.city=id(t.world),this.scene.add(this.city.group),this.scene.add(this.traffic.group,this.smoke.points,this.glowFx.points,this.skids.mesh),this.taxi=fd(t.spec,r),this.taxiId=t.spec.id,this.scene.add(this.taxi.root);for(let e of[`short`,`medium`,`long`])this.glyphs[e]=_d(bu[e].shape,bu[e].css);this.glyphs.pin=_d(`pin`,`#ffffff`);for(let e=0;e<8;e++)this.fares.push(this.makeFareVis());this.destBeacon=new X(new Vc(3.2,3.2,220,20,1,!0),new pr({color:16777215,transparent:!0,opacity:.28,depthWrite:!1,blending:2,side:2,fog:!1})),this.destBeacon.position.y=110,this.destRing=new X(new jl(7.4,8.6,48).rotateX(-Math.PI/2),new pr({color:16777215,transparent:!0,opacity:.85,side:2,depthWrite:!1})),this.destRing.position.y=.15,this.destSprite=new Ws(new As({map:this.glyphs.pin,transparent:!0,depthTest:!1,sizeAttenuation:!1})),this.destSprite.scale.set(.07,.07,1),this.destSprite.position.y=14,this.destSprite.renderOrder=8,this.destGroup.add(this.destBeacon,this.destRing,this.destSprite),this.destGroup.visible=!1,this.scene.add(this.destGroup);let a=new Wc;a.moveTo(0,1.5),a.lineTo(1,-.2),a.lineTo(.38,-.2),a.lineTo(.38,-1.1),a.lineTo(-.38,-1.1),a.lineTo(-.38,-.2),a.lineTo(-1,-.2),a.closePath();let o=new El(a,{depth:.18,bevelEnabled:!1});o.rotateX(-Math.PI/2);let s=new X(o,this.arrowMat);s.renderOrder=10,this.arrow.add(s),this.arrow.renderOrder=10,this.scene.add(this.arrow);for(let e of t.world.tokens){let t=new X(e.kind===`spark`?new Al(.9,0):new kl(.8,0),new pr({color:e.kind===`spark`?16769357:4255999,fog:!0}));t.position.set(e.x,1.5,e.z),this.scene.add(t),this.tokens.push({mesh:t,id:e.id,kind:e.kind})}for(let e of t.world.destinations){let t=new Ws(new As({map:vd(e.name,bu.short.css),transparent:!0,depthWrite:!1,fog:!1}));t.scale.set(26,4.9,1);let n=e.landmark.h+12;t.position.set(e.landmark.x,n,e.landmark.z),t.renderOrder=4,this.scene.add(t),this.labels.push({sprite:t,x:e.landmark.x,z:e.landmark.z,y:n})}let c=new Bc(.28,.75,3,6).translate(0,.78,0),l=new Ml(.22,8,6).translate(0,1.62,0);this.pedBody=new tc(c,new Pl({color:16777215}),100),this.pedHead=new tc(l,new Pl({color:15250575}),100),this.pedBody.instanceColor=new qs(new Float32Array(300),3);let u=[16735831,1684390,16765773,3107839,11032055,16020150,8118448,16777215,2042436],d=t.world.blocks.length;for(let e=0;e<100;e++)this.peds.push({block:this.rng.int(0,d-1),s:this.rng.range(0,400),dir:this.rng.chance(.5)?1:-1,speed:this.rng.range(1.1,1.8),off:this.rng.range(.6,2.2),hop:0}),this.pedBody.setColorAt(e,new J(u[e%u.length]));this.pedBody.frustumCulled=!1,this.pedHead.frustumCulled=!1,this.scene.add(this.pedBody,this.pedHead),this.resize()}makeFareVis(){let e=new ps,t=new X(new Vc(.9,.9,90,12,1,!0),new pr({color:16777215,transparent:!0,opacity:.32,depthWrite:!1,blending:2,side:2,fog:!1}));t.position.y=45;let n=new X(new jl(3,3.6,40).rotateX(-Math.PI/2),new pr({color:16777215,transparent:!0,opacity:.9,side:2,depthWrite:!1}));n.position.y=.16;let r=new Ws(new As({map:this.glyphs.short,transparent:!0,depthTest:!1,sizeAttenuation:!1,fog:!1}));r.scale.set(.05,.05,1),r.position.y=9,r.renderOrder=7;let i=new ps,a=new X(new Bc(.3,.8,3,6),new Pl({color:16727425}));a.position.y=.95;let o=new X(new Ml(.24,8,6),new Pl({color:15250575}));o.position.y=1.7;let s=new X(new Br(.14,.7,.14),new Pl({color:15250575}));return s.position.set(.4,1.7,0),i.add(a,o,s),i.position.set(2.4,0,0),e.add(t,n,r,i),e.visible=!1,this.scene.add(e),{group:e,beacon:t,ring:n,sprite:r,figure:i,arm:s,fareId:-1,x:0,z:0,tier:`short`}}setTaxiColor(e){pd(this.taxi,e)}setSim(e,t){this.sim=e,this.scene.remove(this.taxi.root),this.taxi=fd(e.spec,t),this.taxiId=e.spec.id,this.scene.add(this.taxi.root),this.lastCandKey=``,this.prevFwd=0;for(let e of this.fares)e.group.visible=!1,e.fareId=-1;this.chase.reset(),this.lastSun=-1}resize(){let e=this.canvas.clientWidth||window.innerWidth,t=this.canvas.clientHeight||window.innerHeight;this.renderer.setPixelRatio(this.pixelRatio*Math.min(window.devicePixelRatio||1,2)*this.settings.resolutionScale),this.renderer.setSize(e,t,!1),this.chase.cam.aspect=e/t,this.chase.cam.updateProjectionMatrix();let n=t*this.renderer.getPixelRatio()/(2*Math.tan(this.chase.cam.fov*Math.PI/360));this.smoke.setScale(n),this.glowFx.setScale(n)}applySettings(e){this.settings=e,this.renderer.shadowMap.enabled=e.shadows,this.sun.castShadow=e.shadows,this.chase.reducedMotion=e.reducedMotion,this.chase.shakeScale=e.shake,this.chase.fovBase=e.fov,this.resize()}project(e,t,n){return this.tmpV.set(e,t,n).project(this.chase.cam),{x:this.tmpV.x*.5+.5,y:-this.tmpV.y*.5+.5,behind:this.tmpV.z>1}}onEvent(e){let t=this.sim.vehicle;switch(e.type){case`collision`:{let t=Math.min(26,6+Math.floor(e.impact*1.3));for(let n=0;n<t;n++){let t=this.rng.range(0,Math.PI*2),n=this.rng.range(2,6+e.impact*.4);this.glowFx.emit(e.x,.8,e.z,Math.cos(t)*n,this.rng.range(1,5),Math.sin(t)*n,this.rng.range(.25,.6),.2,16761707,1,-.2,1.2,12)}for(let t=0;t<8;t++)this.smoke.emit(e.x,.6,e.z,this.rng.range(-2,2),this.rng.range(.5,2),this.rng.range(-2,2),.9,1.4,14077892,.5,3,2);this.chase.impulse(r(e.impact/22,.1,.9));break}case`vehicle`:{let n=e.ev;if(n.type===`landing`){for(let e=0;e<16;e++)this.smoke.emit(t.x+this.rng.range(-1.2,1.2),.3,t.z+this.rng.range(-2,2),this.rng.range(-4,4),this.rng.range(.5,2),this.rng.range(-4,4),.8,1.2,14735042,.55,3,2);this.chase.impulse(r(n.impact/20,0,.5))}if(n.type===`surge`||n.type===`snapDrift`||n.type===`gripTurn`)for(let e=0;e<10;e++)this.glowFx.emit(t.x,.5,t.z,this.rng.range(-3,3),this.rng.range(.5,2),this.rng.range(-3,3),.4,.5,16773280,.9,0,3);break}case`delivered`:{let n=[16735831,16765773,1684390,3107839,16727538,8191851],r=e.breakdown.grade===`blazing`?70:38;for(let e=0;e<r;e++){let r=this.rng.range(0,Math.PI*2),i=this.rng.range(3,11);this.glowFx.emit(t.x,1.5,t.z,Math.cos(r)*i,this.rng.range(6,15),Math.sin(r)*i,this.rng.range(.9,1.6),.2,n[e%n.length],.95,0,.8,14)}break}case`boarded`:for(let t=0;t<24;t++)this.glowFx.emit(e.fare.pickup.x,1,e.fare.pickup.z,this.rng.range(-3,3),this.rng.range(2,8),this.rng.range(-3,3),.8,.2,gd(e.fare.tier),1,0,1.5,6);break;case`token`:for(let n=0;n<16;n++)this.glowFx.emit(t.x,1.5,t.z,this.rng.range(-5,5),this.rng.range(1,6),this.rng.range(-5,5),.6,.2,e.kind===`spark`?16769357:4255999,1,0,2,6);break;case`respawn`:for(let e=0;e<30;e++)this.glowFx.emit(t.x,1,t.z,this.rng.range(-6,6),this.rng.range(0,8),this.rng.range(-6,6),.7,.6,12577279,1,0,2)}}update(e,t,n={}){let i=this.sim,s=i.vehicle;this.time+=t;let c=s.px+(s.x-s.px)*e,l=s.pz+(s.z-s.pz)*e,u=s.py+(s.y-s.py)*e,d=s.ph+a(s.h-s.ph)*e,f=this.taxi;f.root.position.set(c,u,l),f.root.rotation.y=d;let p=(s.fwd-this.prevFwd)/Math.max(t,.001);this.prevFwd=s.fwd,this.squat=o(this.squat,r(-p*.0035,-.07,.07),7,t),this.bob=o(this.bob,s.surface===`cobble`||s.surface===`sand`?Math.sin(this.time*60)*Math.min(.03,s.speed*.001):0,20,t),f.body.rotation.x=-s.pitch+this.squat,f.body.rotation.z=s.roll,f.body.position.y=this.bob;let m=s.fwd/f.wheelRadius*t;for(let e of f.wheels)e.rotation.x+=m;for(let e of f.steerPivots)e.rotation.y=-s.steer*.5;f.turbine.rotation.y+=t*(3+s.speed*.5),f.boostGlow.visible=s.boosting,s.boosting&&f.boostGlow.scale.set(1,1,.8+Math.random()*.5),f.brakeMat.color.setHex(this.lastBrake?16722474:8000532),f.passenger.visible=!!i.trip,i.trip?(f.passenger.children[1].material.color.setHex(yu[i.trip.fare.archetype].shirt),f.displayMat.color.setHex(gd(i.trip.fare.tier))):f.displayMat.color.setHex(4255999),this.chase.setLookBack(!!n.camBack),this.menuMode||this.chase.update(s,e,t,i.world,s.boosting,i.phase===`countdown`);let h=r(i.time/(i.mode===`quick`?300:420),0,1);this.updateSun(h,c,l),this.sky.position.copy(this.chase.cam.position),this.city.waterMat.uniforms.uTime.value=this.time,this.traffic.update(i.traffic.agents,e),this.updateSignals(),this.updateVfx(t,c,u,l,d),this.smoke.update(t),this.glowFx.update(t),this.updateFareVisuals(t,c,l),this.updateArrow(c,u,l),this.updateTokens(),this.updateLabels(),this.updatePeds(t,c,l)}lastBrake=!1;setBrake(e){this.lastBrake=e}sigAcc=0;updateSignals(){if(this.sigAcc+=1,this.sigAcc%8!=0)return;let e=this.city.signalHeads,t=this.city.signalMap,n=this.sim.traffic.time,r=new J;for(let i=0;i<t.length;i++){let a=sd(t[i].node,t[i].axis,n);r.setHex(a===0?3211130:a===1?16765498:16726843),e.setColorAt(i,r)}e.instanceColor&&(e.instanceColor.needsUpdate=!0)}updateSun(e,t,n){let r=.78-e*.38,i=.9+e*.35,a=new K(Math.cos(i)*Math.cos(r),Math.sin(r),Math.sin(i)*Math.cos(r)).normalize();if(this.sun.position.set(t+a.x*160,a.y*160,n+a.z*160),this.sun.target.position.set(t,0,n),Math.abs(e-this.lastSun)<.01)return;this.lastSun=e;let o=new J().setHex(16773334).lerp(new J(16757370),e);this.sun.color.copy(o),this.sun.intensity=2.6-e*.5,this.hemi.intensity=1.5-e*.2;let s=new J(16506036).lerp(new J(16751992),e),c=new J(4037609).lerp(new J(6972118),e);this.skyMat.uniforms.uHor.value.copy(s),this.skyMat.uniforms.uTop.value.copy(c),this.skyMat.uniforms.uSun.value.copy(a),this.scene.fog.color.copy(s),this.scene.background.copy(s),this.city.waterMat.uniforms.uFog.value.copy(s)}updateVfx(e,t,n,r,i){let a=this.sim.vehicle,o=a.surface,[s,c]=Uu(i),[l,u]=Wu(i),d=-this.sim.spec.length/2+.85;if(!a.airborne&&a.speed>7&&(Math.abs(a.slip)>.22||a.drifting&&Math.abs(a.slip)>.1)){for(let n of[-1,1]){let i=t+s*d+l*n*(this.sim.spec.width/2-.15),o=r+c*d+u*n*(this.sim.spec.width/2-.15);this.rng.chance(.75)&&this.smoke.emit(i,.3,o,this.rng.range(-1,1)-a.vx*.15,this.rng.range(.6,1.8),this.rng.range(-1,1)-a.vz*.15,this.rng.range(.7,1.2),.9,15328734,.5,2.6,1.8),this.skidAcc+=a.speed*e,this.skidAcc>.9&&this.skids.add(i,o,Math.atan2(a.vx,a.vz))}this.skidAcc>.9&&(this.skidAcc=0)}if(!a.airborne&&a.speed>9&&(o===`sand`||o===`grass`||o===`shallow`)){let e=o===`sand`?15323024:o===`grass`?7131014:12577279;for(let n=0;n<2;n++)this.smoke.emit(t+s*d,.4,r+c*d,this.rng.range(-1.5,1.5)-a.vx*.2,this.rng.range(1,3),this.rng.range(-1.5,1.5)-a.vz*.2,.8,1.1,e,.6,2.4,2)}if(a.boosting)for(let e=0;e<3;e++)this.glowFx.emit(t+s*(d-.6)+l*this.rng.range(-.35,.35),.6+n,r+c*(d-.6)+u*this.rng.range(-.35,.35),-s*6+this.rng.range(-.5,.5),this.rng.range(-.2,.5),-c*6+this.rng.range(-.5,.5),.45,.9,e%2?8320767:16751346,.85,-1.2,2);if(this.sim.speedKmh>90&&this.rng.chance(.4)&&!this.settings.reducedMotion){let e=this.rng.range(0,Math.PI*2),i=this.rng.range(3,7);this.glowFx.emit(t+s*6+Math.cos(e)*i,n+this.rng.range(.5,3.5),r+c*6+Math.sin(e)*i,-s*a.speed,0,-c*a.speed,.18,.18,16777215,.35,0,0)}}updateFareVisuals(e,t,n){let i=this.sim,a=i.trip?[]:i.fares.candidates,o=a.map(e=>e.id).join(`,`);if(o!==this.lastCandKey){this.lastCandKey=o,a.forEach((e,t)=>this.bindFare(this.fares[t],e));for(let e=a.length;e<this.fares.length;e++)this.fares[e].group.visible=!1,this.fares[e].fareId=-1}for(let e=0;e<a.length&&e<this.fares.length;e++){let i=this.fares[e],a=Math.hypot(i.x-t,i.z-n),o=1+Math.sin(this.time*4+e)*.06;i.ring.scale.setScalar(o),i.beacon.visible=a>14,i.beacon.material.opacity=r(a/160,.18,.42);let s=a<40?.04:a<500?.05:.04;i.sprite.scale.set(s,s,1),i.sprite.position.y=6+r(a*.02,0,14),i.sprite.visible=a<560&&a>8,i.arm.rotation.z=Math.sin(this.time*7+e)*.6-.6,i.arm.position.y=1.7+Math.sin(this.time*7+e)*.08,i.figure.rotation.y=Math.atan2(t-i.x,n-i.z)-.4,i.figure.position.y=Math.abs(Math.sin(this.time*3+e))*.06}let s=i.trip;if(this.destGroup.visible=!!s,s){let e=s.fare.dest;this.destGroup.position.set(e.x,0,e.z);let i=gd(s.fare.tier);this.destBeacon.material.color.setHex(i),this.destRing.material.color.setHex(i),this.destRing.scale.setScalar(1+Math.sin(this.time*5)*.05);let a=Math.hypot(e.x-t,e.z-n);this.destSprite.material.color.setHex(i),this.destSprite.position.y=8+r(a*.03,0,24),this.destSprite.visible=a>16;let o=r(.07-a*2e-5,.045,.07);this.destSprite.scale.set(o,o,1),this.destBeacon.visible=a>18,this.lastDest!==e.id&&(this.lastDest=e.id)}}bindFare(e,t){e.fareId=t.id,e.x=t.pickup.x,e.z=t.pickup.z,e.tier=t.tier,e.group.position.set(t.pickup.x,0,t.pickup.z),e.group.visible=!0;let n=gd(t.tier);e.beacon.material.color.setHex(n),e.ring.material.color.setHex(n),e.sprite.material.map=this.glyphs[t.tier],e.sprite.material.needsUpdate=!0;let r=yu[t.archetype];e.figure.children[0].material.color.setHex(r.shirt),e.figure.children[1].material.color.setHex(r.skin),e.figure.children[2].material.color.setHex(r.skin),e.ring.scale.setScalar(1)}updateArrow(e,t,n){let r=this.sim.phase===`running`?this.sim.guidance(this.settings.guidance===`direct`):null;if(this.arrow.visible=!!r,!r)return;let i=Math.atan2(r.x-e,r.z-n);this.arrow.position.set(e,t+2.9+Math.sin(this.time*5)*.08,n),this.arrow.rotation.y=i;let a=r.kind===`dest`&&this.sim.trip?gd(this.sim.trip.fare.tier):16777215;this.arrowMat.color.setHex(a),this.arrow.scale.setScalar(r.kind===`dest`?1:.75)}updateTokens(){for(let e of this.tokens){let t=this.sim.collected.has(e.id);e.mesh.visible=!t,t||(e.mesh.rotation.y+=.04,e.mesh.position.y=1.6+Math.sin(this.time*3+e.id)*.25)}}updateLabels(){let e=this.chase.cam.position;for(let t of this.labels){let n=Math.hypot(t.x-e.x,t.z-e.z),i=n<120?n/120:n>340?0:1-(n-120)/220;t.sprite.visible=i>.04,t.sprite.material.opacity=r(i,0,1)*.95;let a=r(n/160,.7,1.9);t.sprite.scale.set(26*a,4.9*a,1)}}updatePeds(e,t,n){let r=this.sim.world,i=new q,a=new Ht,o=new On,s=0,c=this.settings.crowd;for(let l of this.peds){let u=r.blocks[l.block].rect,d=1.5+l.off*.35,f=u.maxX-u.minX-d*2,p=u.maxZ-u.minZ-d*2,m=2*(f+p);l.s=(l.s+l.dir*l.speed*e+m)%m;let h,g,_,v,y=l.s;y<f?(h=u.minX+d+y,g=u.minZ+d,_=1,v=0):y<f+p?(h=u.maxX-d,g=u.minZ+d+(y-f),_=0,v=1):y<2*f+p?(h=u.maxX-d-(y-f-p),g=u.maxZ-d,_=-1,v=0):(h=u.minX+d,g=u.maxZ-d-(y-2*f-p),_=0,v=-1);let b=Math.hypot(h-t,g-n);if(!c||b>170)continue;let x=0,S=0;if(b<6&&this.sim.vehicle.speed>4&&(l.hop=.5),l.hop>0){l.hop-=e;let r=Math.sin(l.hop/.5*Math.PI)*.8;x=(h-t)/Math.max(b,.1)*1.2,S=(g-n)/Math.max(b,.1)*1.2,h+=x,g+=S,o.set(0,0,0),i.makeTranslation(h,r,g)}let C=Math.atan2(l.dir*_,l.dir*v),w=Math.abs(Math.sin(this.time*6+l.block))*.07;o.set(0,C,0),a.setFromEuler(o),i.compose(this.tmpV.set(h,w+(l.hop>0?Math.sin(l.hop/.5*Math.PI)*.8:0),g),a,new K(1,1,1)),this.pedBody.setMatrixAt(s,i),this.pedHead.setMatrixAt(s,i),s++}this.pedBody.count=this.pedHead.count=s,this.pedBody.instanceMatrix.needsUpdate=!0,this.pedHead.instanceMatrix.needsUpdate=!0,this.pedBody.instanceColor&&(this.pedBody.instanceColor.needsUpdate=!0)}render(e){if(this.settings.dynamicRes&&(this.frameTimes.push(e),this.frameTimes.length>=45)){let e=this.frameTimes.reduce((e,t)=>e+t,0)/this.frameTimes.length;this.frameTimes.length=0;let t=this.pixelRatio;e>20&&this.pixelRatio>.55?this.pixelRatio=Math.max(.55,this.pixelRatio-.1):e<13&&this.pixelRatio<1&&(this.pixelRatio=Math.min(1,this.pixelRatio+.05)),this.pixelRatio!==t&&this.resize()}this.renderer.render(this.scene,this.chase.cam)}get info(){let e=this.renderer.info.render;return{calls:e.calls,tris:e.triangles,ratio:this.pixelRatio}}dispose(){this.renderer.dispose()}},bd=1/60,$={shiftStart:60,quickShiftLength:300,endGrace:2,boardingPause:1,maxDeliveryAward:40,pickup:{enterSpeedKmh:35,stopSpeedKmh:5,radius:3.5,ringVisual:5,cleanRadius:1.8,roughPatiencePenalty:3},delivery:{stopSpeedKmh:8,radius:8.5,cleanRadius:3.2},par:{perMeter:1/17,base:5,min:20,max:80},tierPar:{short:35,medium:55},patienceFactor:1.25,fareBase:{short:160,medium:260,long:380},farePerMeter:.8,timeBonusMax:320,grade:{blazing:.25,fast:.1,close:0},gradeTimeFactor:{blazing:1.1,fast:.88,close:.68,late:.42},tierTimeBonus:{short:1,medium:2,long:3},pulse:{decay:3.5,tiers:[0,3,7,14],mults:[1,2,3,5],sameCategoryFalloff:.7,minFalloff:.25},tailwind:{duration:2.2,speedMul:1.22,accelMul:1.8,chargePerPoint:1/1800,tokenCharge:.3},style:{nearMiss:60,nearMissSpeedKmh:50,nearMissDist:3.6,nearMissCooldown:4,needle:140,needleWindow:.7,driftPerSecond:70,driftMinSpeedKmh:35,driftMinAngleDeg:12,driftMinDuration:.6,airtimeMin:.35,airtimeBase:90,airtimePerSecond:110,oncomingPerSecond:60,oncomingMinSpeedKmh:70,shortcut:150,shortcutFirst:400,cleanSector:220,cleanSectorSeconds:10,cleanSectorSpeedKmh:60,precisionStop:250,gripTurn:90,surge:60,pickupClean:250},collision:{minorSpeed:4,hardSpeed:16,chainLoss:.5},penalties:{reset:3,resetPoints:150,water:4,pedestrian:120},rank:{S:9e3,A:6e3,B:3500,C:1800},trialMedals:{gold:150,silver:190,bronze:240}};function xd(e){let t=$.par;return r(Math.round(e*t.perMeter+t.base),t.min,t.max)}function Sd(e){return e<$.tierPar.short?`short`:e<$.tierPar.medium?`medium`:`long`}function Cd(e,t){return Math.round($.fareBase[e]+t*$.farePerMeter)}var wd=class{world;count;candidates=[];rng;nextId=1;recent=[];constructor(e,t,n=6){this.world=e,this.count=n,this.rng=new wu(t)}make(e,t,n,r){let i=this.world;for(let a=0;a<40;a++){let a=this.rng.pick(i.pickupSpots),o=c(a.x,a.z,e,t);if(o<(n===`short`?60:50)||o>(n===`short`?360:n===`medium`?480:600)||r.some(e=>c(e.x,e.z,a.x,a.z)<45))continue;let s=this.rng.shuffle(i.destinations.slice());for(let e of s){if(this.recent.includes(e.id)||c(e.x,e.z,a.x,a.z)<90)continue;let t=i.pathLength(a,e.point),r=xd(t);if(Sd(r)===n)return{id:this.nextId++,archetype:this.rng.int(0,yu.length-1),pickup:a,dest:e,tier:n,par:r,limit:Math.round(r*$.patienceFactor),pathLen:t,base:Cd(n,t),age:0}}}return null}refill(e,t){this.candidates=this.candidates.filter(n=>c(n.pickup.x,n.pickup.z,e,t)<720);let n=this.count-this.candidates.length;for(let r=0;r<n;r++){let n=this.candidates.map(e=>e.tier),r=n.includes(`short`)?n.includes(`medium`)?n.includes(`long`)?this.rng.chance(.45)?`short`:this.rng.chance(.6)?`medium`:`long`:`long`:`medium`:`short`,i=this.make(e,t,r,this.candidates.map(e=>e.pickup))??this.make(e,t,`short`,this.candidates.map(e=>e.pickup))??this.make(e,t,`medium`,this.candidates.map(e=>e.pickup));i&&this.candidates.push(i)}}clear(){this.candidates=[]}take(e){this.candidates=this.candidates.filter(t=>t!==e),this.recent.push(e.dest.id),this.recent.length>4&&this.recent.shift()}},Td=class{energy=0;tier=0;chainTimer=0;chainPoints=0;chainEvents=0;lastCategory=null;sameCount=0;bankedTips=0;totalTips=0;tailwind=0;bestTier=0;bestChain=0;trip={drift:0,air:0,collisions:0,bestTier:0,landmarks:new Set};get mult(){return $.pulse.mults[this.tier]}get active(){return this.chainTimer>0}get pending(){return this.bankedTips+this.chainPoints}resetTrip(){this.bankedTips=0,this.trip={drift:0,air:0,collisions:0,bestTier:0,landmarks:new Set}}tierFor(e){let t=0;for(let n=0;n<$.pulse.tiers.length;n++)e>=$.pulse.tiers[n]&&(t=n);return t}award(e,t,n=!1){e===this.lastCategory?this.sameCount++:(this.sameCount=0,this.lastCategory=e);let r=Math.max($.pulse.minFalloff,$.pulse.sameCategoryFalloff**+this.sameCount),i=this.mult,a=Math.round(t*r*i);return this.energy+=r,this.tier=this.tierFor(this.energy),this.bestTier=Math.max(this.bestTier,this.tier),this.trip.bestTier=Math.max(this.trip.bestTier,this.tier),this.chainTimer=$.pulse.decay,this.chainPoints+=a,this.chainEvents++,this.bestChain=Math.max(this.bestChain,this.chainPoints),e===`drift`&&(this.trip.drift+=a),e===`air`&&(this.trip.air+=a),n||(this.tailwind=Math.min(1,this.tailwind+a*$.tailwind.chargePerPoint)),{category:e,base:t,points:a,mult:i,falloff:r}}bank(){let e=this.chainPoints;return this.bankedTips+=e,this.totalTips+=e,this.chainPoints=0,this.chainEvents=0,this.energy=0,this.tier=0,this.chainTimer=0,this.lastCategory=null,this.sameCount=0,e}tick(e){return this.chainTimer>0&&(this.chainTimer-=e,this.chainTimer<=0)?this.bank():0}collide(e){if(e>=$.collision.hardSpeed){let e=this.chainPoints>0||this.tier>0;return this.chainPoints=0,this.chainEvents=0,this.energy=0,this.tier=0,this.chainTimer=0,this.lastCategory=null,this.sameCount=0,this.trip.collisions++,e?`break`:`none`}return e>=$.collision.minorSpeed?(this.trip.collisions++,this.tier>0?(this.tier--,this.energy=$.pulse.tiers[this.tier],`tier`):`none`):`none`}addTailwind(e){this.tailwind=Math.min(1,this.tailwind+e)}};function Ed(e){let t=$.rank;return e>=t.S?`S`:e>=t.A?`A`:e>=t.B?`B`:e>=t.C?`C`:`D`}var Dd={throttle:0,brake:0,steer:0,handbrake:!1,boost:!1,resetHeld:!1},Od=class{world;spec;vehicle;traffic;fares;score=new Td;mode;phase=`countdown`;countdown;time=0;clock;pauseTimer=0;endGrace=-1;frame=0;events=[];trip=null;seed;total=0;fareTotal=0;timeBonusTotal=0;deliveries=0;failed=0;collisions=0;shortcutsDone=new Set;discovered;newShortcuts=0;pathMeters=0;drivenMeters=0;sparks=0;collected=new Set;result=null;trialChain=[];trialIndex=0;rng;tokenFlash=0;resetHold=0;boostLatch=!1;nearCand=new Map;lastNearMiss=-9;driftAcc=0;oncomingAcc=0;scState=new Map;barkCd=0;lastClockTick=99;refillCd=0;stuckTimer=0;wasReady=!1;pickupArmed=new Map;stopTimer=0;lastLandmarkCheck=0;constructor(e={}){this.world=e.world??zu(),this.mode=e.mode??`arcade`,this.seed=e.seed??1,this.spec=hu[e.taxi??`breaker`],this.rng=new wu(this.seed*31+7);let t=e.hub??(this.mode===`trial`?1:this.rng.int(0,this.world.hubs.length-1)),n=this.world.hubs[t%this.world.hubs.length];this.vehicle=Bu(n.x,n.z,n.heading);let r=e.traffic??`normal`,i=r===`calm`?30:r===`dense`?56:44;this.traffic=new cd(this.world,this.seed*977+13,i),this.traffic.populate(n.x,n.z),this.fares=new wd(this.world,this.seed*4421+5,this.mode===`trial`?1:6),this.discovered=new Set(e.discovered??[]),this.clock=this.mode===`quick`?$.quickShiftLength:this.mode===`trial`?0:$.shiftStart,this.countdown=e.startCountdown??3,this.mode===`trial`&&this.buildTrialChain(n.x,n.z),this.fares.refill(n.x,n.z),this.mode===`trial`&&this.showTrialFare(),this.score.tailwind=.25}buildTrialChain(e,t){let n=[`short`,`medium`,`short`,`long`],r=new wd(this.world,90210,1),i=e,a=t;for(let e of n){let t=r.make(i,a,e,[]);t&&(this.trialChain.push(t),i=t.dest.x,a=t.dest.z,r.recent.push(t.dest.id))}}showTrialFare(){this.fares.candidates=this.trialChain[this.trialIndex]?[this.trialChain[this.trialIndex]]:[]}emit(e){this.events.push(e)}drain(){let e=this.events;return this.events=[],e}get speedKmh(){return this.vehicle.speed*3.6}get boosting(){return this.vehicle.boosting}get patienceLeft(){return this.trip?this.trip.fare.limit-this.trip.time:0}bark(e,t=4){if(!this.trip&&e!==`arrive`&&e!==`fail`||this.barkCd>0&&e!==`arrive`&&e!==`fail`&&e!==`pickup`)return;let n=this.trip?.fare;if(!n)return;let r=yu[n.archetype];this.barkCd=t,this.emit({type:`bark`,text:r.barks[e],who:r.name,kind:e})}style(e,t,n){let r=this.score.award(e,t,this.vehicle.boosting);return this.emit({type:`style`,category:e,label:n,points:r.points,mult:r.mult}),(r.mult>=3||e===`air`||e===`drift`)&&this.bark(`stunt`,6),r}step(e,t=bd){this.frame++,this.barkCd=Math.max(0,this.barkCd-t);let n=this.vehicle;if(this.phase===`ended`){this.traffic.update(t,{x:n.x,z:n.z,vx:n.vx,vz:n.vz,len:this.spec.length});return}if(this.phase===`countdown`){let e=Math.ceil(this.countdown);this.countdown-=t;let r=Math.ceil(this.countdown);r!==e&&r>0&&this.emit({type:`countdown`,n:r}),this.traffic.update(t,{x:n.x,z:n.z,vx:n.vx,vz:n.vz,len:this.spec.length}),this.countdown<=0&&(this.phase=`running`,this.emit({type:`go`}));return}if(this.time+=t,this.mode!==`trial`){this.pauseTimer>0?this.pauseTimer-=t:this.clock-=t;let e=Math.ceil(this.clock);e<=10&&e>0&&e!==this.lastClockTick&&(this.lastClockTick=e,this.emit({type:`clockTick`,n:e}))}let r=this.score;e.boost||(this.boostLatch=!1);let i=n.boosting;i&&(!e.boost||r.tailwind<=0)&&(i=!1,this.emit({type:`boost`,on:!1}),r.tailwind<=0&&(this.boostLatch=!0)),!i&&e.boost&&!this.boostLatch&&r.tailwind>=.12&&!n.airborne&&(i=!0,this.emit({type:`boost`,on:!0})),i&&(r.tailwind=Math.max(0,r.tailwind-t/$.tailwind.duration));let a=r.tailwind>=.999,o=[],s=n.x,c=n.z;if(Gu(n,this.spec,e,t,this.world,i,o),this.trip){let e=Math.hypot(n.x-s,n.z-c);this.trip.distance+=e}this.drivenMeters+=Math.hypot(n.x-s,n.z-c);for(let e of o)this.onVehicleEvent(e);this.traffic.update(t,{x:n.x,z:n.z,vx:n.vx,vz:n.vz,len:this.spec.length});for(let e of this.traffic.events)e.type===`honk`&&this.emit({type:`honk`});this.collideTraffic(),this.detectNearMiss(t),this.detectDrift(t,o),this.detectOncoming(t),this.detectShortcuts(),this.detectCleanSector(t),this.collectTokens();let l=r.tick(t);l>0&&this.emit({type:`bank`,points:l}),!a&&r.tailwind>=.999&&this.emit({type:`tailwindReady`}),this.handleRespawns(e,t),this.updateFares(t),this.mode!==`trial`&&this.clock<=0&&this.handleClockZero(t)}onVehicleEvent(e){this.emit({type:`vehicle`,ev:e});let t=$.style;switch(e.type){case`surge`:this.style(`tech`,t.surge,`SURGE START`);break;case`snapDrift`:this.driftAcc=0;break;case`gripTurn`:this.style(`tech`,t.gripTurn,`GRIP TURN`);break;case`driftEnd`:if(e.clean&&e.duration>=t.driftMinDuration&&this.driftAcc>10){let e=Math.min(900,this.driftAcc);this.style(`drift`,e,`DRIFT`)}this.driftAcc=0;break;case`collision`:e.impact,$.collision.hardSpeed,this.onCollision(e.impact,e.tag,e.px,e.pz);break;case`landing`:if(e.airTime>=t.airtimeMin){let n=e.align<.45,r=(t.airtimeBase+t.airtimePerSecond*e.airTime)*(n?1:.5);this.style(`air`,r,n?`AIRTIME`:`SLOPPY LANDING`)}}}onCollision(e,t,n,r){if(e<1.5)return;let i=e>=$.collision.hardSpeed;if(e>=$.collision.minorSpeed){this.collisions++,this.vehicle.damage=Math.min(1,this.vehicle.damage+e*.012);let t=this.score.collide(e);t!==`none`&&this.emit({type:`chainLoss`,mode:t}),this.trip&&(this.trip.cleanSector=0),this.bark(`hit`,5)}this.emit({type:`collision`,impact:e,tag:t,hard:i,x:n,z:r})}collideTraffic(){let e=this.vehicle,t=this.spec,[n,i]=Uu(e.h),a=t.length/2-1.05+.15,o=[a,0,-a],s=t.mass*t.shove;for(let t of this.traffic.agents){if(!t.alive||Math.abs(t.x-e.x)>9||Math.abs(t.z-e.z)>9)continue;let a=Math.max(2,Math.ceil(t.len/2.6)),c=Math.sin(t.h),l=Math.cos(t.h),u=t.wid/2+.05;for(let d=0;d<a;d++){let f=(d/(a-1)-.5)*(t.len-u*2),p=t.x+c*f,m=t.z+l*f;for(let a of o){let o=e.x+n*a,d=e.z+i*a,f=o-p,h=d-m,g=Math.hypot(f,h),_=1.05+u;if(g>=_||g<1e-4)continue;let v=f/g,y=h/g,b=_-g,x=t.state===`wreck`?t.vx:c*t.speed,S=t.state===`wreck`?t.vz:l*t.speed,C=(e.vx-x)*v+(e.vz-S)*y,w=t.mass,T=w/(s+w),E=s/(s+w);if(e.x+=v*b*T,e.z+=y*b*T,t.x-=v*b*E,t.z-=y*b*E,C<0){let a=-1.35*C/(1/s+1/w);e.vx+=a/s*v,e.vz+=a/s*y,this.traffic.strike(t,-a/w*v,-a/w*y),t.yaw+=r((v*l-y*c)*-C*.05,-2,2);let u=-C;e.yawRate+=r((v*i-y*n)*u*.02,-.8,.8),u>1.5&&e.collideCd<=0&&(e.collideCd=.3,this.onCollision(u,`traffic`,o,d))}else t.state!==`wreck`&&this.traffic.strike(t,0,0);this.nearCand.delete(t.id)}}}}detectNearMiss(e){let t=this.vehicle,n=$.style;if(t.speed*3.6<n.nearMissSpeedKmh||t.airborne)this.nearCand.clear();else for(let e of this.traffic.agents){if(!e.alive||e.state===`wreck`)continue;let r=Math.hypot(e.x-t.x,e.z-t.z),i=(e.wid+1.9)/2+n.nearMissDist-1.3+(e.len>6?2.5:0);if(r>14){this.nearCand.delete(e.id);continue}let a=this.nearCand.get(e.id);if(r<i)this.nearCand.set(e.id,Math.min(a??99,r));else if(a!==void 0&&r>i+.6&&(this.nearCand.delete(e.id),e.nearMissCd<=0&&(e.nearMissCd=n.nearMissCooldown,!(a<(e.wid+1.9)/2+.15)))){let e=this.time-this.lastNearMiss<n.needleWindow;this.lastNearMiss=this.time,this.style(`nearMiss`,n.nearMiss,`NEAR MISS`),e&&this.style(`needle`,n.needle,`THREAD THE NEEDLE`)}}}detectDrift(e,t){let n=this.vehicle,i=$.style;if(!n.drifting)return;let a=Math.abs(n.driftAngle)*(180/Math.PI),o=n.speed*3.6;if(o<i.driftMinSpeedKmh||a<i.driftMinAngleDeg)return;let s=n.driftTime>6?.5:1;this.driftAcc+=i.driftPerSecond*r(a/28,.4,1.7)*r(o/90,.5,1.5)*s*e}detectOncoming(e){let t=this.vehicle,n=$.style;if(t.airborne||t.speed*3.6<n.oncomingMinSpeedKmh){this.oncomingAcc=Math.max(0,this.oncomingAcc-e);return}let r=this.world.roadInfo(t.x,t.z);if(!r.onRoad||r.intersection||!r.boulevard||!r.axis){this.oncomingAcc=0;return}let[i,a]=Uu(t.h),o=r.axis===`z`?a:i;!(Math.abs(o)/Math.max(.1,Math.hypot(i,a))>.9&&Math.abs(t.fwd)>Math.abs(t.lat))||t.fwd<0?this.oncomingAcc=0:(r.axis===`z`?o>0?r.lat>1:r.lat<-1:o>0?r.lat<-1:r.lat>1)?(this.oncomingAcc+=e,this.oncomingAcc>=1&&(this.oncomingAcc=0,this.style(`oncoming`,n.oncomingPerSecond,`ONCOMING`))):this.oncomingAcc=0}detectShortcuts(){let e=this.vehicle;e.airborne&&e.y;for(let t of this.world.shortcuts){let n=Math.hypot(e.x-t.mx,e.z-t.mz);if(n>170)continue;let r=t.kind===`terrace`||t.kind===`dune`||t.kind===`plaza`||t.kind===`yard`?10:8,i=this.scState.get(t.id),a=Math.hypot(e.x-t.ax,e.z-t.az),o=Math.hypot(e.x-t.bx,e.z-t.bz);if(!i){let n=(t.bx-t.ax)*e.vx+(t.bz-t.az)*e.vz,i=Math.hypot(t.bx-t.ax,t.bz-t.az);a<r&&n/i>3?this.scState.set(t.id,{end:1,t:this.time,mid:!1}):o<r&&-n/i>3&&this.scState.set(t.id,{end:2,t:this.time,mid:!1});continue}if(this.time-i.t>25){this.scState.delete(t.id);continue}!i.mid&&n<r*.8&&(i.mid=!0);let s=i.end===1?o:a;i.mid&&s<r&&(this.scState.delete(t.id),this.completeShortcut(t))}}completeShortcut(e){let t=String(e.id),n=!this.discovered.has(t);this.shortcutsDone.add(t),this.style(`shortcut`,$.style.shortcut,e.name.toUpperCase()),n&&(this.discovered.add(t),this.newShortcuts++,this.trip?this.trip.discovery+=$.style.shortcutFirst:this.total+=$.style.shortcutFirst),this.emit({type:`shortcut`,sc:e,first:n})}detectCleanSector(e){let t=this.trip;if(!t)return;let n=$.style;this.vehicle.speed*3.6>=n.cleanSectorSpeedKmh&&(t.cleanSector+=e,t.cleanSector>=n.cleanSectorSeconds&&(t.cleanSector=0,this.style(`clean`,n.cleanSector,`CLEAN SECTOR`)))}collectTokens(){let e=this.vehicle;for(let t of this.world.tokens)if(!this.collected.has(t.id)&&!(Math.abs(t.x-e.x)>4||Math.abs(t.z-e.z)>4)&&!(Math.hypot(t.x-e.x,t.z-e.z)>3.2||e.y>2)){if(t.kind===`spark`){if(this.sparks>=3)continue;this.sparks++,this.mode===`arcade`&&(this.clock+=1,this.emit({type:`timeAdd`,seconds:1}))}else this.score.addTailwind($.tailwind.tokenCharge);this.collected.add(t.id),this.emit({type:`token`,kind:t.kind})}}placeAt(e,t){let n=this.vehicle;n.x=n.px=e.x,n.z=n.pz=e.z,n.h=n.ph=e.heading,n.vx=n.vz=0,n.yawRate=0,n.y=n.py=0,n.vy=0,n.airborne=!1,n.drifting=!1,n.steer=0,n.pitch=0,n.roll=0,n.boosting=!1,n.prevGroundH=0,n.lastRamp=-1;for(let t of this.traffic.agents)c(t.x,t.z,e.x,e.z)<8&&(t.alive=!1);this.traffic.agents=this.traffic.agents.filter(e=>e.alive);let r=t===`water`?$.penalties.water:$.penalties.reset;this.mode===`arcade`||this.mode===`quick`?this.clock-=r:this.time+=r,this.total=Math.max(0,this.total-$.penalties.resetPoints),this.score.bank(),this.emit({type:`respawn`,reason:t})}handleRespawns(e,t){let n=this.vehicle;this.world.isWater(n.x,n.z)&&n.y<.5?this.placeAt(this.world.roadPose(Math.min(n.x,this.world.xs[this.world.cols-1]-40),Math.min(n.z,this.world.zs[this.world.rows-1]-30)),`water`):(n.speed<1.2&&(this.trip||this.fares.candidates.length)?this.stuckTimer+=t:this.stuckTimer=0,this.stuckTimer>4&&Math.floor(this.stuckTimer*4)%40==0&&this.stuckTimer<4.05&&this.emit({type:`hint`,text:`Stuck? Hold R to reset (costs time and points)`}),e.resetHeld?(this.resetHold+=t,this.resetHold>=1&&(this.resetHold=0,this.placeAt(this.world.roadPose(n.x,n.z),`reset`))):this.resetHold=0)}get resetProgress(){return r(this.resetHold/1,0,1)}updateFares(e){let t=this.vehicle,n=this.world;if(this.refillCd-=e,!this.trip){if(this.refillCd<=0&&this.mode!==`trial`){let e=this.fares.candidates.length;this.fares.refill(t.x,t.z),this.fares.candidates.length!==e&&this.emit({type:`candidates`}),this.refillCd=1}for(let t of this.fares.candidates)t.age+=e;for(let e of this.fares.candidates){let n=c(t.x,t.z,e.pickup.x,e.pickup.z),r=t.speed*3.6,i=this.pickupArmed.get(e.id)??!1;if(n<$.pickup.ringVisual+1&&r<=$.pickup.enterSpeedKmh&&!i&&this.pickupArmed.set(e.id,!0),n>$.pickup.ringVisual+6&&this.pickupArmed.set(e.id,!1),n<=$.pickup.radius&&r<=$.pickup.stopSpeedKmh&&!t.airborne){this.board(e,i&&n<=$.pickup.cleanRadius);break}}return}let r=this.trip;r.time+=e;let i=r.fare.limit-r.time;!r.urgent&&i<r.fare.limit*.2&&i>0&&(r.urgent=!0,this.bark(`urgent`,3)),i<=0&&(r.graceOn=!0,r.grace-=e);let a=c(t.x,t.z,r.fare.dest.x,r.fare.dest.z);for(let e of n.destinations)e.id!==r.fare.dest.id&&Math.abs(e.x-t.x)<40&&Math.abs(e.z-t.z)<40&&this.score.trip.landmarks.add(e.id);a<=r.fare.dest.radius&&t.speed*3.6<=$.delivery.stopSpeedKmh&&!t.airborne?this.deliver():r.graceOn&&r.grace<=0&&this.failFare()}board(e,t){this.fares.take(e),this.trip={fare:e,time:t?0:$.pickup.roughPatiencePenalty,distance:0,discovery:0,urgent:!1,grace:2,graceOn:!1,cleanSector:0,boardedClean:t},this.score.resetTrip(),this.pauseTimer=$.boardingPause,this.fares.clear(),this.pickupArmed.clear(),this.emit({type:`boarded`,fare:e,clean:t}),t&&this.style(`precision`,$.style.pickupClean,`CLEAN STOP`),this.bark(`pickup`,0),this.emit({type:`candidates`})}failFare(){let e=this.trip;this.emit({type:`fareFailed`,fare:e.fare}),this.bark(`fail`,0),this.failed++;let t=this.score.bank();t>0&&this.emit({type:`bank`,points:t}),this.score.resetTrip(),this.trip=null,this.afterTrip()}afterTrip(){let e=this.vehicle;if(this.mode===`trial`){if(this.trialIndex++,this.trialIndex>=this.trialChain.length){this.finish(`chain complete`);return}this.showTrialFare()}else this.fares.refill(e.x,e.z);this.emit({type:`candidates`})}deliver(){let e=this.trip,t=e.fare,n=this.vehicle,i=this.score,a=i.bank();a>0&&this.emit({type:`bank`,points:a});let o=(t.limit-e.time)/t.limit,s;s=o>=$.grade.blazing?`blazing`:o>=$.grade.fast?`fast`:o>$.grade.close?`close`:`late`;let l=c(n.x,n.z,t.dest.x,t.dest.z),u=l<=$.delivery.cleanRadius&&n.speed*3.6<=4,d=yu[t.archetype],f=o>0?Math.round($.timeBonusMax*r(o,0,1)):0,p=i.bankedTips,m=0,h=``,g=i.trip;switch(d.pref){case`thrill`:m=Math.round(.3*(g.drift+g.air)),h=`Thrill bonus`;break;case`fragile`:m=g.collisions===0?150+Math.round(.15*p):-Math.round(Math.min(.4,.1*g.collisions)*p),h=g.collisions===0?`Gentle ride`:`Bumpy ride`;break;case`tourist`:m=120*Math.min(4,g.landmarks.size),h=`Scenic route`;break;case`late`:f=Math.round(f*1.35),h=`Punctual bonus`;break;case`musician`:m=g.bestTier>=2?Math.round(.25*p):0,h=`Rhythm bonus`;break;case`chill`:m=g.collisions===0?150:0,h=`Calm ride`;break;case`foodie`:m=g.collisions<=1?Math.round(.15*p)+60:0,h=`Spill-free`;break;case`racer`:m=s===`blazing`?Math.round(.25*p)+100:0,h=`Racer respect`}let _=u?$.style.precisionStop:l<=5.5?100:0;u&&this.emit({type:`style`,category:`precision`,label:`PRECISION STOP`,points:$.style.precisionStop,mult:1});let v=t.base+f+p+m+_+e.discovery,y=0;this.mode===`arcade`&&(y=Math.round(t.par*$.gradeTimeFactor[s]+$.tierTimeBonus[t.tier]),y=Math.min($.maxDeliveryAward,y),this.clock+=y,this.emit({type:`timeAdd`,seconds:y})),this.total+=v,this.fareTotal+=t.base,this.timeBonusTotal+=y,this.deliveries++,this.pathMeters+=t.pathLen,this.drivenMeters=this.drivenMeters,this.tripDrivenSum+=e.distance,this.tipsSum+=p+m,this.pauseTimer=$.boardingPause,i.addTailwind(s===`blazing`?.45:s===`fast`?.3:.15),this.vehicle.damage>0&&(this.vehicle.damage=0);let b={base:t.base,timeBonus:f,tips:p,prefBonus:m,prefLabel:h,accuracy:_,discovery:e.discovery,total:v,grade:s,shiftSeconds:y,fraction:o,par:t.par,tripTime:e.time,tier:t.tier,precise:u};this.emit({type:`delivered`,fare:t,breakdown:b}),this.bark(`arrive`,0),i.resetTrip(),this.trip=null,this.endGrace=-1,this.afterTrip()}tripDrivenSum=0;tipsSum=0;handleClockZero(e){let t=this.vehicle;if(this.phase===`running`){if(this.trip){let e=c(t.x,t.z,this.trip.fare.dest.x,this.trip.fare.dest.z);this.endGrace<0&&e<=this.trip.fare.dest.radius+6&&(this.endGrace=$.endGrace)}this.endGrace>=0&&(this.endGrace-=e,this.endGrace>0||this.clock>0)||this.clock<=0&&this.finish(`time up`)}}finish(e){if(this.phase===`ended`)return;let t=this.score.bank();t>0&&this.emit({type:`bank`,points:t}),this.total+=(this.trip,0),this.phase=`ended`;let n=this.tripDrivenSum>0?r(this.pathMeters/this.tripDrivenSum*100,0,160):0,i;if(this.mode===`trial`){let e=$.trialMedals;i=this.time<=e.gold?`gold`:this.time<=e.silver?`silver`:this.time<=e.bronze?`bronze`:`none`}this.result={score:Math.round(this.total),deliveries:this.deliveries,fares:this.fareTotal,tips:this.tipsSum,timeBonuses:this.timeBonusTotal,bestPulse:$.pulse.mults[this.score.bestTier],bestChain:this.score.bestChain,collisions:this.collisions,shortcuts:this.shortcutsDone.size,newShortcuts:this.newShortcuts,efficiency:Math.round(n),rank:Ed(this.total),mode:this.mode,taxi:this.spec.name,time:this.time,failed:this.failed,medal:i},this.emit({type:`ended`,reason:e})}get liveTips(){return this.score.pending}get displayScore(){return Math.round(this.total)}guidance(e=!1){let t=this.vehicle;if(this.trip){let n=this.trip.fare.dest,r=c(t.x,t.z,n.x,n.z);if(e||r<60)return{x:n.x,z:n.z,label:n.name,kind:`dest`};let i=this.world.nextHop(t.x,t.z,n.point);return{x:i.x,z:i.z,label:n.name,kind:`dest`}}let n=null,r=1e9;for(let e of this.fares.candidates){let i=c(t.x,t.z,e.pickup.x,e.pickup.z);i<r&&(r=i,n=e)}return n?{x:n.pickup.x,z:n.pickup.z,label:`Nearest fare`,kind:`pickup`}:null}stateHash(){let e=this.vehicle,t=2166136261,n=e=>{t^=Math.round(e*1e3)|0,t=Math.imul(t,16777619)>>>0};n(e.x),n(e.z),n(e.h),n(e.vx),n(e.vz),n(this.total),n(this.clock),n(this.deliveries),n(this.traffic.agents.length);for(let e of this.traffic.agents)n(e.x),n(e.z);return t>>>0}static fareFromPoints(e,t,n,r=0){let i=e.destinations[n],a=e.pathLength(t,i.point),o=xd(a),s=Sd(o);return{id:9e3+n,archetype:r,pickup:t,dest:i,tier:s,par:o,limit:Math.round(o*$.patienceFactor),pathLen:a,base:Cd(s,a),age:0}}},kd=1.4,Ad=30,jd=30,Md=class{world;base;constructor(e){this.world=e;let t=e,n=Math.ceil((t.wallX-t.bounds.minX+60)*kd),r=Math.ceil((t.quayZ-t.bounds.minZ+60)*kd);this.base=document.createElement(`canvas`),this.base.width=n,this.base.height=r;let i=this.base.getContext(`2d`),a=e=>(e-t.bounds.minX+Ad)*kd,o=e=>(e-t.bounds.minZ+jd)*kd;i.fillStyle=`#2d7fc0`,i.fillRect(0,0,n,r),i.fillStyle=`#ecdfc4`,i.fillRect(a(t.bounds.minX-6),o(t.bounds.minZ-6),(t.shallowX-t.bounds.minX+6)*kd,(t.quayZ-t.bounds.minZ+6)*kd),i.fillStyle=`#58b8d0`,i.fillRect(a(t.shallowX),o(t.bounds.minZ-6),(t.wallX-t.shallowX)*kd,(t.quayZ-t.bounds.minZ+6)*kd);let s={lantern:`#8a6fb5`,steps:`#d6a47a`,civic:`#a9b9c8`,beach:`#e8b99c`,harbor:`#9aa8ae`};for(let e of t.blocks){let t=e.rect;i.fillStyle=e.kind===`P`?`#6fcf8c`:e.kind===`Z`?`#f1e6cc`:e.kind===`S`?`#f6e3ad`:e.kind===`Y`?`#9aa4ac`:s[e.district],i.fillRect(a(t.minX),o(t.minZ),(t.maxX-t.minX)*kd,(t.maxZ-t.minZ)*kd);for(let t of e.buildings)i.fillStyle=t.landmark===void 0?`rgba(40,40,70,0.28)`:`#ffffff`,i.fillRect(a(t.rect.minX),o(t.rect.minZ),(t.rect.maxX-t.rect.minX)*kd,(t.rect.maxZ-t.rect.minZ)*kd)}i.fillStyle=`#4a5166`;for(let e of t.edges){let n=t.nodes[e.a],r=t.nodes[e.b];e.axis===`x`?i.fillRect(a(n.x-4),o(n.z-e.width/2),(r.x-n.x+8)*kd,e.width*kd):i.fillRect(a(n.x-e.width/2),o(n.z-4),e.width*kd,(r.z-n.z+8)*kd)}i.fillStyle=`#ffd34d`;for(let e of t.edges){if(e.width<17)continue;let n=t.nodes[e.a],r=t.nodes[e.b];e.axis===`x`?i.fillRect(a(n.x),o(n.z)-1,(r.x-n.x)*kd,2):i.fillRect(a(n.x)-1,o(n.z),2,(r.z-n.z)*kd)}}mx(e){return(e-this.world.bounds.minX+Ad)*kd}mz(e){return(e-this.world.bounds.minZ+jd)*kd}markers(e,t,n,r){for(let i of t.discovered){let t=this.world.shortcuts[Number(i)];t&&(e.strokeStyle=`#ff8a2b`,e.lineWidth=(r?3:2.4)/n,e.setLineDash([4/n,3/n]),e.beginPath(),e.moveTo(this.mx(t.ax),this.mz(t.az)),e.lineTo(this.mx(t.bx),this.mz(t.bz)),e.stroke(),e.setLineDash([]))}if(r){e.font=`${11/n}px "Trebuchet MS", sans-serif`,e.textAlign=`center`;for(let t of this.world.destinations)e.fillStyle=`#15192a`,e.beginPath(),e.arc(this.mx(t.x),this.mz(t.z),4.5/n,0,7),e.fill(),e.fillStyle=`#ffffff`,e.beginPath(),e.arc(this.mx(t.x),this.mz(t.z),3/n,0,7),e.fill(),e.fillStyle=`rgba(15,20,35,0.92)`,e.fillText(t.name,this.mx(t.x),this.mz(t.z)-7/n);e.font=`800 ${15/n}px "Trebuchet MS", sans-serif`;for(let e of this.world.blocks);}for(let i of t.trip?[]:t.fares.candidates)this.glyph(e,this.mx(i.pickup.x),this.mz(i.pickup.z),bu[i.tier].css,bu[i.tier].shape,(r?9:7)/n);if(t.trip){let i=t.trip.fare.dest;this.glyph(e,this.mx(i.x),this.mz(i.z),bu[t.trip.fare.tier].css,`pin`,(r?13:10)/n)}}glyph(e,t,n,r,i,a){if(e.save(),e.translate(t,n),e.fillStyle=r,e.strokeStyle=`#10141c`,e.lineWidth=a*.28,e.beginPath(),i===`circle`)e.arc(0,0,a*.8,0,7);else if(i===`diamond`)e.moveTo(0,-a),e.lineTo(a*.85,0),e.lineTo(0,a),e.lineTo(-a*.85,0),e.closePath();else if(i===`star`){for(let t=0;t<10;t++){let n=t%2?a*.42:a,r=-Math.PI/2+t*Math.PI/5;t===0?e.moveTo(Math.cos(r)*n,Math.sin(r)*n):e.lineTo(Math.cos(r)*n,Math.sin(r)*n)}e.closePath()}else e.moveTo(0,a),e.bezierCurveTo(-a,-a*.1,-a*.8,-a,0,-a),e.bezierCurveTo(a*.8,-a,a,-a*.1,0,a);e.stroke(),e.fill(),e.restore()}draw(e,t,n,r=150){let i=n.vehicle;e.clearRect(0,0,t,t),e.save(),e.beginPath(),e.arc(t/2,t/2,t/2-2,0,Math.PI*2),e.clip(),e.fillStyle=`#2d7fc0`,e.fillRect(0,0,t,t),e.translate(t/2,t/2),e.rotate(i.h-Math.PI);let a=t/2/r;e.scale(a/kd,a/kd),e.translate(-this.mx(i.x),-this.mz(i.z)),e.drawImage(this.base,0,0),this.markers(e,n,a/kd,!1),e.restore(),e.save(),e.translate(t/2,t/2),e.fillStyle=`#ffffff`,e.strokeStyle=`#10141c`,e.lineWidth=2.5,e.beginPath(),e.moveTo(0,-9),e.lineTo(7,8),e.lineTo(0,4),e.lineTo(-7,8),e.closePath(),e.stroke(),e.fill(),e.restore();let o=n.guidance(!1);if(o){let r=o.x-i.x,s=o.z-i.z,c=Math.atan2(r,s)-i.h,l=t/2-6;Math.hypot(r,s)*a>l&&(e.save(),e.translate(t/2+Math.sin(c)*l*-1,t/2-Math.cos(c)*l),e.fillStyle=o.kind===`dest`&&n.trip?bu[n.trip.fare.tier].css:`#ffffff`,e.beginPath(),e.arc(0,0,5,0,7),e.fill(),e.restore())}}drawBig(e,t,n,r){e.clearRect(0,0,t,n);let i=this.base.width,a=this.base.height,o=Math.min(t*.92/i,n*.86/a);e.save(),e.translate((t-i*o)/2,(n-a*o)/2+n*.03),e.scale(o,o),e.drawImage(this.base,0,0),this.markers(e,r,o,!0);let s=r.vehicle;e.translate(this.mx(s.x),this.mz(s.z)),e.rotate(-s.h+Math.PI),e.fillStyle=`#fff`,e.strokeStyle=`#10141c`,e.lineWidth=3/o,e.beginPath(),e.moveTo(0,-12/o),e.lineTo(9/o,10/o),e.lineTo(0,5/o),e.lineTo(-9/o,10/o),e.closePath(),e.stroke(),e.fill(),e.restore(),e.font=`700 14px "Trebuchet MS", sans-serif`,e.fillStyle=`rgba(255,255,255,0.9)`,e.textAlign=`left`,e.fillText(Object.values(xu).join(`  ·  `),24,n-20)}},Nd=(e,t)=>e.querySelector(t),Pd={blazing:{t:`BLAZING!`,c:`#ffd34d`},fast:{t:`FAST`,c:`#2ee6a0`},close:{t:`CLOSE`,c:`#4fc3ff`},late:{t:`LATE`,c:`#ff8a5b`},failed:{t:`MISSED`,c:`#ff5e57`}},Fd=class{sim;view;root;el={};mini;miniCtx;bigCtx;fx;fxCtx;shownScore=0;callouts=[];deliverT=0;subT=0;hintT=0;flashT=0;centerT=0;controlsT=16;mapOpen=!1;edge=[];lastClockClass=``;lastTrip=-1;reduced=!1;photo=!1;colorblind=!1;subtitles=!0;constructor(e,t,n){this.sim=t,this.view=n,this.root=document.createElement(`div`),this.root.id=`hud`,this.root.innerHTML=`
      <canvas class="fx"></canvas>
      <div class="flash"></div>
      <div class="corner tl"><div class="score-card"><div class="lab">FARE SCORE</div><div class="score" data-k="score">0</div><div class="tips" data-k="tips"></div></div></div>
      <div class="corner tc">
        <div class="clock" data-k="clock"><div class="clock-num" data-k="clocknum">60</div><div class="lab" data-k="clocklab">SHIFT CLOCK</div></div>
        <div class="trip" data-k="trip">
          <div class="trip-top"><span class="badge" data-k="badge"></span><span class="dest" data-k="dest"></span><span class="dist" data-k="dist"></span></div>
          <div class="patience"><div class="pfill" data-k="pfill"></div><div class="ppar" data-k="ppar"></div></div>
          <div class="trip-sub"><span data-k="who"></span><span data-k="ptime"></span></div>
        </div>
        <div class="hint" data-k="hint"></div>
      </div>
      <div class="corner ml"><div class="pulse" data-k="pulse"><div class="lab">PULSE</div><div class="mult" data-k="mult">×1</div><div class="pbar"><div data-k="pbarf"></div></div><div class="chain" data-k="chain"></div></div><div class="callouts" data-k="callouts"></div></div>
      <div class="corner bl"><canvas class="mini" width="220" height="220"></canvas><div class="minilab" data-k="zone"></div></div>
      <div class="corner br"><div class="speed"><span class="spd" data-k="speed">0</span><span class="unit">km/h</span><span class="spec" data-k="surf"></span></div>
        <div class="tail" data-k="tail"><div class="lab">TAILWIND <kbd>SHIFT</kbd></div><div class="tbar"><div data-k="tbarf"></div></div></div></div>
      <div class="corner mr"><div class="deliver" data-k="deliver"></div></div>
      <div class="edges" data-k="edges"></div>
      <div class="center" data-k="center"></div>
      <div class="sub" data-k="sub"></div>
      <div class="resetbar" data-k="resetbar"><div data-k="resetf"></div><span>HOLD R TO RESET</span></div>
      <div class="controls" data-k="controls"><span><kbd>W</kbd><kbd>S</kbd> gas / brake</span><span><kbd>A</kbd><kbd>D</kbd> steer</span><span><kbd>SPACE</kbd> + steer above 35 km/h = <b>drift</b></span><span><kbd>SHIFT</kbd> tailwind</span><span><kbd>C</kbd> camera</span><span><kbd>X</kbd> look back</span><span><kbd>M</kbd> map</span><span><kbd>ESC</kbd> pause</span></div>
      <div class="bigmap" data-k="bigmap"><canvas></canvas><div class="maphint">M to close</div></div>`,e.appendChild(this.root),this.root.querySelectorAll(`[data-k]`).forEach(e=>{this.el[e.dataset.k]=e}),this.fx=Nd(this.root,`canvas.fx`),this.fxCtx=this.fx.getContext(`2d`);let r=Nd(this.root,`canvas.mini`);this.miniCtx=r.getContext(`2d`),this.bigCtx=this.el.bigmap.querySelector(`canvas`).getContext(`2d`),this.mini=new Md(t.world);for(let e=0;e<4;e++){let e=document.createElement(`div`);e.className=`edge`,e.innerHTML=`<div class="chev"></div><div class="elab"></div>`,this.el.edges.appendChild(e),this.edge.push(e)}this.el.trip.style.display=`none`,t.mode===`trial`&&(this.el.clocklab.textContent=`TIME`)}destroy(){this.root.remove()}applySettings(e){this.reduced=e.reducedMotion,this.photo=e.photosensitive,this.colorblind=e.colorblind,this.subtitles=e.subtitles,this.root.style.setProperty(`--hud`,String(e.hudScale)),this.root.classList.toggle(`cb`,e.colorblind),this.root.classList.toggle(`calm`,e.reducedMotion||e.photosensitive)}toggleMap(){return this.mapOpen=!this.mapOpen,this.el.bigmap.style.display=this.mapOpen?`flex`:`none`,this.mapOpen}get mapShown(){return this.mapOpen}say(e,t=1400){let n=this.el.center;n.textContent=e,n.classList.remove(`pop`),n.offsetWidth,n.classList.add(`pop`),this.centerT=t/1e3}hint(e,t=3.2){this.el.hint.textContent=e,this.hintT=t}addCallout(e,t,n,r){let i=document.createElement(`div`);for(i.className=`callout c-${r}`,i.innerHTML=`<b>${e}</b>${t?`<i>+${t.toLocaleString()}</i>`:``}${n>1?`<em>×${n}</em>`:``}`,this.el.callouts.prepend(i),this.callouts.unshift({el:i,t:1.9});this.callouts.length>4;)this.callouts.pop().el.remove()}onEvent(e){switch(e.type){case`countdown`:this.say(String(e.n),900);break;case`go`:this.say(`GO!`,900);break;case`style`:this.addCallout(e.label,e.points,e.mult,e.category);break;case`bank`:e.points>0&&this.addCallout(`CHAIN BANKED`,e.points,0,`bank`);break;case`chainLoss`:this.addCallout(e.mode===`break`?`CHAIN LOST`:`PULSE TIER DOWN`,0,0,`loss`),this.flash();break;case`boarded`:{let t=yu[e.fare.archetype];this.say(e.clean?`CLEAN STOP!`:`ON BOARD`,900),this.hint(`${t.name}: head to ${e.fare.dest.name}`,4);break}case`delivered`:this.showDelivery(e.breakdown,e.fare.dest.name);break;case`fareFailed`:this.say(`FARE LOST`,1400);break;case`candidates`:break;case`bark`:this.subtitles&&this.subtitle(e.who,e.text);break;case`collision`:e.impact>4&&this.flash();break;case`boost`:e.on&&this.say(`TAILWIND`,700);break;case`tailwindReady`:this.hint(`Tailwind ready - hold SHIFT`,2.4);break;case`token`:this.addCallout(e.kind===`spark`?`CLOCK SPARK +1s`:`TAILWIND TOKEN`,0,0,`token`);break;case`shortcut`:this.hint(e.first?`NEW SHORTCUT: ${e.sc.name} (+${$.style.shortcutFirst})`:`Shortcut: ${e.sc.name}`,3);break;case`timeAdd`:break;case`respawn`:this.say(e.reason===`water`?`SPLASH! RESPAWN`:`RESET`,1200);break;case`hint`:this.hint(e.text,4)}}flash(){this.reduced||this.photo||(this.flashT=.35)}subtitle(e,t){this.el.sub.innerHTML=`<b>${e.split(` `)[0]}</b> ${t}`,this.subT=2.6}showDelivery(e,t){let n=Pd[e.grade],r=[];r.push(`<div class="r"><span>Fare</span><b>${e.base.toLocaleString()}</b></div>`),e.timeBonus&&r.push(`<div class="r"><span>Time bonus</span><b>${e.timeBonus.toLocaleString()}</b></div>`),e.tips&&r.push(`<div class="r"><span>Style tips</span><b>${e.tips.toLocaleString()}</b></div>`),e.prefBonus&&r.push(`<div class="r"><span>${e.prefLabel}</span><b>${e.prefBonus>0?`+`:``}${e.prefBonus.toLocaleString()}</b></div>`),e.accuracy&&r.push(`<div class="r"><span>${e.precise?`Precision stop`:`Accuracy`}</span><b>${e.accuracy}</b></div>`),e.discovery&&r.push(`<div class="r"><span>Discovery</span><b>${e.discovery}</b></div>`),this.el.deliver.innerHTML=`<div class="grade" style="color:${n.c}">${n.t}</div><div class="where">${t}</div>${r.join(``)}<div class="total"><span>TOTAL</span><b>+${e.total.toLocaleString()}</b></div>${e.shiftSeconds?`<div class="secs">+${e.shiftSeconds}s SHIFT TIME</div>`:``}`,this.el.deliver.classList.remove(`show`),this.el.deliver.offsetWidth,this.el.deliver.classList.add(`show`),this.deliverT=2.1}update(e,t=!1){let n=this.sim,r=n.vehicle,i=this.el,a=n.displayScore;this.shownScore+=(a-this.shownScore)*Math.min(1,e*8),Math.abs(a-this.shownScore)<1&&(this.shownScore=a),i.score.textContent=Math.round(this.shownScore).toLocaleString();let o=n.liveTips;if(i.tips.textContent=o>0?`+${o.toLocaleString()} TIPS`:``,n.mode===`trial`)i.clocknum.textContent=n.time.toFixed(1);else{let e=Math.max(0,n.clock);i.clocknum.textContent=e>=10?String(Math.ceil(e)):e.toFixed(1);let t=n.pauseTimer>0?`paused`:e<=10?`urgent`:``;t!==this.lastClockClass&&(i.clock.className=`clock ${t}`,this.lastClockClass=t)}let s=n.trip;if(s){i.trip.style.display=``;let e=s.fare,t=bu[e.tier];this.lastTrip!==e.id&&(this.lastTrip=e.id,i.badge.className=`badge ${e.tier}`,i.badge.textContent=this.colorblind?t.label:``,i.dest.textContent=e.dest.name,i.who.textContent=yu[e.archetype].name,i.ppar.style.left=`${e.par/e.limit*100}%`);let n=e.limit-s.time,a=Math.max(0,n/e.limit),o=i.pfill;o.style.width=`${a*100}%`,o.className=`pfill ${a<.1?`crit`:a<.25?`warn`:``}`,i.ptime.textContent=n>0?`${n.toFixed(1)}s`:`GRACE ${Math.max(0,s.grace).toFixed(1)}s`;let c=Math.hypot(r.x-e.dest.x,r.z-e.dest.z);i.dist.textContent=`${Math.round(c)} m`}else i.trip.style.display=`none`,this.lastTrip=-1;let c=n.score,l=i.pulse;l.classList.toggle(`on`,c.active),i.mult.textContent=`×${c.mult}`,l.dataset.tier=String(c.tier),i.pbarf.style.width=`${Math.max(0,c.chainTimer/$.pulse.decay*100)}%`,i.chain.textContent=c.chainPoints>0?`${c.chainPoints.toLocaleString()} in chain`:``,i.speed.textContent=String(Math.round(n.speedKmh)),i.surf.textContent=r.surface===`asphalt`?``:r.surface.toUpperCase(),i.tbarf.style.width=`${c.tailwind*100}%`,i.tail.className=`tail ${c.tailwind>=.999?`ready`:c.tailwind>=.12?`usable`:``} ${r.boosting?`active`:``}`;let u=n.world.blockAt(r.x,r.z),d=n.world.nodes[n.world.nearestNode(r.x,r.z)],f=u?u.district:d.j>=5?`harbor`:d.i>=6?`beach`:d.i<=1&&d.j>=2?`steps`:d.j<=1?`lantern`:`civic`;i.zone.textContent=xu[f];for(let t=this.callouts.length-1;t>=0;t--){let n=this.callouts[t];n.t-=e,n.t<.4&&(n.el.style.opacity=String(Math.max(0,n.t/.4))),n.t<=0&&(n.el.remove(),this.callouts.splice(t,1))}if(this.deliverT>0&&(this.deliverT-=e,this.deliverT<=0&&i.deliver.classList.remove(`show`)),this.subT>0&&(this.subT-=e,this.subT<=0&&(i.sub.innerHTML=``)),this.hintT>0&&(this.hintT-=e,this.hintT<=0&&(i.hint.textContent=``)),this.centerT>0&&(this.centerT-=e,this.centerT<=0&&(i.center.textContent=``)),this.controlsT>0&&n.phase===`running`&&(this.controlsT-=e,this.controlsT<=0&&i.controls.classList.add(`gone`)),i.resetbar.style.display=n.resetProgress>.02?`flex`:`none`,i.resetf.style.width=`${n.resetProgress*100}%`,this.root.style.setProperty(`--flash`,String(this.flashT>0?this.flashT/.35:0)),this.flashT=Math.max(0,this.flashT-e),!s&&n.phase===`running`){for(let e of n.fares.candidates)if(Math.hypot(r.x-e.pickup.x,r.z-e.pickup.z)<14&&n.speedKmh>35&&this.hintT<=0){this.hint(`Slow below 35 km/h and stop in the ring`,1.5);break}}else s&&Math.hypot(r.x-s.fare.dest.x,r.z-s.fare.dest.z)<28&&n.speedKmh>20&&this.hintT<=0&&this.hint(`Stop in the arrival ring (under 8 km/h)`,1.5);this.drawEdgeMarkers(),this.drawMini(),this.drawSpeedLines(e)}drawMini(){if(this.mini.draw(this.miniCtx,220,this.sim,150),this.mapOpen){let e=this.bigCtx.canvas,t=e.clientWidth,n=e.clientHeight;(e.width!==t||e.height!==n)&&(e.width=t,e.height=n),this.mini.drawBig(this.bigCtx,t,n,this.sim)}}drawEdgeMarkers(){let e=this.sim,t=[];if(e.trip){let n=e.trip.fare.dest;t.push({x:n.x,z:n.z,css:bu[e.trip.fare.tier].css,label:n.name,r:0})}else{let n=e.vehicle,r=[...e.fares.candidates].sort((e,t)=>Math.hypot(e.pickup.x-n.x,e.pickup.z-n.z)-Math.hypot(t.pickup.x-n.x,t.pickup.z-n.z)).slice(0,3);for(let e of r)t.push({x:e.pickup.x,z:e.pickup.z,css:bu[e.tier].css,label:bu[e.tier].label,r:0})}let n=e.vehicle;this.edge.forEach((r,i)=>{let a=t[i];if(!a||e.phase!==`running`){r.style.display=`none`;return}let o=this.view.project(a.x,8,a.z);if(!o.behind&&o.x>.04&&o.x<.96&&o.y>.08&&o.y<.92){r.style.display=`none`;return}let s=o.x-.5,c=o.y-.5;o.behind&&(s=-s,c=-c,Math.abs(s)<.02&&(s=.3),c=.5);let l=Math.max(Math.abs(s)/.45,Math.abs(c)/.42,1e-4),u=.5+s/l*1,d=.5+c/l*1;r.style.display=``,r.style.left=`${u*100}%`,r.style.top=`${d*100}%`,r.querySelector(`.chev`).style.transform=`rotate(${Math.atan2(c,s)*180/Math.PI+90}deg)`,r.querySelector(`.chev`).style.borderBottomColor=a.css;let f=Math.round(Math.hypot(a.x-n.x,a.z-n.z));r.querySelector(`.elab`).textContent=`${f} m`})}drawSpeedLines(e){let t=this.fx,n=t.clientWidth,r=t.clientHeight;(t.width!==n||t.height!==r)&&(t.width=n,t.height=r);let i=this.fxCtx;if(i.clearRect(0,0,n,r),this.reduced||this.photo)return;let a=this.sim.speedKmh,o=this.sim.vehicle.boosting,s=Math.max(0,(a-95)/80)+(o?.6:0);if(s<=.02)return;let c=Math.floor(14+26*Math.min(1,s)),l=performance.now()/1e3;i.lineCap=`round`;for(let e=0;e<c;e++){let t=e/c*Math.PI*2+Math.sin(e*12.9898)*.3,a=(l*(1.8+e%5*.35)+e*.37)%1,o=Math.min(n,r)*(.34+a*.42),u=o+Math.min(n,r)*(.08+.22*s);i.strokeStyle=`rgba(255,255,255,${.12*Math.min(1,s)*(1-a)})`,i.lineWidth=1.5+e%3,i.beginPath(),i.moveTo(n/2+Math.cos(t)*o*1.25,r/2+Math.sin(t)*o*.9),i.lineTo(n/2+Math.cos(t)*u*1.25,r/2+Math.sin(t)*u*.9),i.stroke()}}},Id={arcade:{name:`Arcade Shift`,blurb:`Start with ${$.shiftStart} seconds. Deliveries add time based on grade and distance - skilled driving extends the shift. Chase a higher rank.`},quick:{name:`Quick Shift`,blurb:`A fixed 5-minute shift with no time extensions. Predictable, accessible and easy to compare.`},trial:{name:`Time Trial`,blurb:`A fixed chain of four fares with identical traffic every attempt. Beat the clock for gold, silver or bronze.`}};function Ld(e,t){return`<i><b style="width:${Math.round(e/t*100)}%"></b></i>`}function Rd(e){let t=27.78/e.topSpeed;return e.topSpeed/(2*e.accel0)*Math.log((1+t)/(1-t))*1.08}var zd=class{api;root;mode=`arcade`;constructor(e,t){this.api=t,this.root=e}clear(){this.root.innerHTML=``}screen(e,t){this.root.innerHTML=`<div class="screen ${e}">${t}</div>`;let n=this.root.firstElementChild;return n.querySelectorAll(`button`).forEach(e=>e.addEventListener(`mouseenter`,()=>e.focus({preventScroll:!0}))),n}on(e,t,n){e.querySelectorAll(t).forEach(e=>e.addEventListener(`click`,()=>{this.api.click(),n(e)}))}main(){let e=v(),t=e.records.arcade,n=this.screen(`dim`,`
      <div class="menu-col">
        <div class="title">FARESTORM</div>
        <div class="tagline">GALEPORT SHIFT  ·  RACE THE CLOCK  ·  RIDE THE STORM</div>
        <button class="btn primary" data-mode="arcade">ARCADE SHIFT <small>${t?`best ${t.best.toLocaleString()}`:`60s + earn more`}</small></button>
        <button class="btn alt" data-mode="quick">QUICK SHIFT <small>5:00 fixed</small></button>
        <button class="btn alt" data-mode="trial">TIME TRIAL <small>${e.trialBest?`best ${e.trialBest.toFixed(1)}s`:`4-fare chain`}</small></button>
        <button class="btn ghost" data-go="garage">GARAGE <small>taxi + colours</small></button>
        <button class="btn ghost" data-go="records">RECORDS</button>
        <button class="btn ghost" data-go="settings">SETTINGS</button>
        <button class="btn ghost" data-go="credits">CREDITS</button>
      </div>
      <div class="foot"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> drive · <kbd>SPACE</kbd> drift · <kbd>SHIFT</kbd> tailwind · gamepad supported</div>`);this.on(n,`[data-mode]`,e=>this.setup(e.dataset.mode)),this.on(n,`[data-go]`,e=>{let t=e.dataset.go;t===`garage`?this.garage():t===`records`?this.records():t===`settings`?this.settings(()=>this.main()):this.credits()}),n.querySelector(`.primary`).focus()}taxiPanel(e){let t=v(),n=()=>{let r=e.querySelector(`.cards`);r.innerHTML=gu.map(e=>{let n=hu[e];return`<button class="card ${t.taxi===e?`sel`:``}" data-taxi="${e}"><h4>${n.name}</h4><p>${n.blurb}</p>
          <div class="bars"><div class="bar"><span>Accel</span>${Ld(n.accel0,7.2)}<span>${Rd(n).toFixed(1)}s</span></div>
          <div class="bar"><span>Top speed</span>${Ld(n.topSpeed,50)}<span>${Math.round(n.topSpeed*3.6)}</span></div>
          <div class="bar"><span>Steering</span>${Ld(n.steerMax,.62)}<span>${(n.steerMax*100).toFixed(0)}</span></div>
          <div class="bar"><span>Drift</span>${Ld(n.driftYaw,1.55)}<span>${n.driftYaw.toFixed(2)}</span></div>
          <div class="bar"><span>Mass</span>${Ld(n.mass,1900)}<span>${n.mass}kg</span></div>
          <div class="bar"><span>Shove</span>${Ld(n.shove,1.6)}<span>×${n.shove}</span></div></div></button>`}).join(``),e.querySelector(`.swatches`).innerHTML=_u.map((e,n)=>`<div class="sw ${t.color===n?`sel`:``}" data-color="${n}" title="${e.name}" style="background:#${e.body.toString(16).padStart(6,`0`)}"></div>`).join(``),this.on(e,`[data-taxi]`,e=>{t.taxi=e.dataset.taxi,y(),this.api.previewTaxi(t.taxi,t.color),n()}),this.on(e,`[data-color]`,e=>{t.color=Number(e.dataset.color),y(),this.api.previewTaxi(t.taxi,t.color),n()})};n()}setup(e){this.mode=e;let t=v(),n=Id[e],r=this.screen(`dim`,`
      <div class="pad" style="width:100%;justify-content:flex-start;padding-left:4vw">
      <div class="panel side">
        <h2>${n.name}</h2>
        <div class="desc">${n.blurb}</div>
        <h3>CHOOSE YOUR STORM CAB</h3>
        <div class="cards"></div>
        <h3>CAB COLOUR</h3>
        <div class="swatches"></div>
        ${e===`trial`?`<h3>MEDALS</h3><div class="desc">Gold under ${$.trialMedals.gold}s · Silver under ${$.trialMedals.silver}s · Bronze under ${$.trialMedals.bronze}s. Time penalties from resets and splashes are added.</div>`:`<h3>TRAFFIC</h3>
        <div class="seg">${[`calm`,`normal`,`dense`].map(e=>`<button data-traffic="${e}" class="${t.traffic===e?`sel`:``}">${e.toUpperCase()}</button>`).join(``)}</div>`}
        <div class="actions"><button class="btn primary" data-start>START SHIFT</button><button class="btn ghost" data-back>BACK</button></div>
      </div></div>`);this.taxiPanel(r),this.on(r,`[data-traffic]`,e=>{t.traffic=e.dataset.traffic,y(),r.querySelectorAll(`[data-traffic]`).forEach(t=>t.classList.toggle(`sel`,t===e))}),this.on(r,`[data-start]`,()=>this.api.start(e)),this.on(r,`[data-back]`,()=>this.api.back()),this.api.previewTaxi(t.taxi,t.color),r.querySelector(`[data-start]`).focus()}garage(){let e=v(),t=this.screen(`dim`,`
      <div class="pad" style="width:100%;justify-content:flex-start;padding-left:4vw">
      <div class="panel side"><h2>GARAGE</h2><div class="desc">Pick your storm cab and paint. Handling differences are real: lighter cabs slide easier, the Tempest shoves traffic aside.</div>
        <h3>STORM CABS</h3><div class="cards"></div><h3>CAB COLOUR</h3><div class="swatches"></div>
        <div class="actions"><button class="btn primary" data-back>DONE</button></div></div></div>`);this.taxiPanel(t),this.on(t,`[data-back]`,()=>this.api.back()),this.api.previewTaxi(e.taxi,e.color)}records(){let e=v(),t=Object.keys(Id).filter(e=>e!==`trial`).map(t=>{let n=e.records[t];return`<tr><td>${Id[t].name}</td><td>${n?n.best.toLocaleString():`-`}</td><td>${n?n.rank:`-`}</td><td>${n?n.deliveries:`-`}</td><td>${n?n.bestChain.toLocaleString():`-`}</td><td>${n?n.runs:0}</td></tr>`}).join(``),n=this.screen(`dark`,`<div class="panel wide"><h2>RECORDS</h2>
      <table><tr><th>MODE</th><th>BEST SCORE</th><th>RANK</th><th>MOST FARES</th><th>BEST CHAIN</th><th>RUNS</th></tr>${t}
      <tr><td>Time Trial</td><td>${e.trialBest?e.trialBest.toFixed(1)+`s`:`-`}</td><td>${e.trialMedal??`-`}</td><td>-</td><td>-</td><td>-</td></tr></table>
      <h3>SHORTCUTS DISCOVERED</h3><div class="desc"><b style="font-size:28px">${e.discovered.length}</b> / 32 found. Discovered shortcuts are drawn on your map.</div>
      <div class="actions"><button class="btn primary" data-back>BACK</button></div></div>`);this.on(n,`[data-back]`,()=>this.api.back())}credits(){let e=this.screen(`dark`,`<div class="panel wide"><h2>CREDITS</h2>
      <div class="desc">Farestorm is an original arcade driving game set in the invented coastal city of Galeport. All code, audio and visuals are procedural and original to this project: no licensed music, no external assets, no logos, no existing game's characters, taxis, city or phrases.<br><br>
      Built with TypeScript, Vite and three.js (MIT). Music and sound effects are generated live with the Web Audio API.<br><br>
      Inspired by the genre principles of fare-chasing arcade taxi games: race the clock, choose risk and reward, take shortcuts, drive with style.</div>
      <div class="actions"><button class="btn primary" data-back>BACK</button></div></div>`);this.on(e,`[data-back]`,()=>this.api.back())}settings(e){let t=v().settings,n=(e,n,r,i,a)=>`<label>${n}<input type="range" data-k="${e}" min="${r}" max="${i}" step="${a}" value="${t[e]}"></label>`,r=(e,n)=>`<label>${n}<input type="checkbox" data-k="${e}" ${t[e]?`checked`:``}></label>`,i=this.screen(`dark`,`<div class="panel wide"><h2>SETTINGS</h2><div class="set">
      <div>${n(`master`,`Master volume`,0,1,.05)}${n(`music`,`Music`,0,1,.05)}${n(`sfx`,`Effects`,0,1,.05)}
      ${r(`subtitles`,`Passenger subtitles`)}${r(`crowd`,`Pedestrians`)}${r(`shadows`,`Shadows`)}
      <label>Render scale<select data-k="resolution"><option value="1">100%</option><option value="0.85">85%</option><option value="0.7">70%</option><option value="0.55">55%</option></select></label>
      ${r(`dynamicRes`,`Dynamic resolution`)}</div>
      <div>${n(`fov`,`Field of view`,70,95,1)}${n(`shake`,`Camera shake`,0,1,.1)}
      <label>HUD scale<select data-k="hudScale"><option value="1">100%</option><option value="1.25">125%</option><option value="1.5">150%</option></select></label>
      ${r(`reducedMotion`,`Reduced motion`)}${r(`photosensitive`,`Photosensitivity (no flashes)`)}${r(`colorblind`,`Colourblind-safe markers`)}
      <label>Route guidance<select data-k="guidance"><option value="route">Follow roads</option><option value="direct">Direct bearing</option></select></label>
      ${n(`deadzone`,`Gamepad dead zone`,0,.4,.01)}</div></div>
      <div class="actions"><button class="btn primary" data-back>BACK</button><button class="btn ghost" data-reset>RESET DEFAULTS</button></div></div>`);i.querySelectorAll(`select[data-k]`).forEach(e=>{e.value=String(t[e.dataset.k])}),i.querySelectorAll(`[data-k]`).forEach(e=>{e.addEventListener(`input`,()=>{let n=e.dataset.k;typeof t[n]==`boolean`?t[n]=e.checked:n===`guidance`?t[n]=e.value:t[n]=Number(e.value),y(),this.api.settingsChanged()})}),this.on(i,`[data-back]`,()=>{e()}),this.on(i,`[data-reset]`,()=>{Object.assign(t,f),y(),this.api.settingsChanged(),this.settings(e)})}pause(){let e=this.screen(`dark`,`<div class="panel" style="min-width:420px"><h2>PAUSED</h2>
      <button class="btn primary" data-a="resume">RESUME</button><button class="btn alt" data-a="restart">RESTART SHIFT</button><button class="btn ghost" data-a="settings">SETTINGS</button><button class="btn ghost" data-a="quit">ABANDON TO MENU</button></div>`);this.on(e,`[data-a]`,e=>{let t=e.dataset.a;t===`resume`?this.api.resume():t===`restart`?this.api.restart():t===`quit`?this.api.quit():this.settings(()=>this.pause())}),e.querySelector(`.primary`).focus()}results(e,t){let n=e=>e.toLocaleString(),r=e.mode===`trial`?`${e.medal&&e.medal!==`none`?e.medal.toUpperCase()+` MEDAL`:`FINISHED`}`:`SHIFT OVER`,i=this.screen(`dark`,`<div class="panel wide" style="width:min(940px,94vw)"><div class="row" style="align-items:center;gap:36px">
      ${e.mode===`trial`?`<div style="text-align:center;min-width:190px"><div class="lab" style="letter-spacing:4px">MEDAL</div><div class="rank ${e.medal===`gold`?`S`:e.medal===`silver`?`B`:e.medal===`bronze`?`C`:`D`}" style="font-size:54px;padding:36px 0">${(e.medal??`none`)===`none`?`NONE`:e.medal.toUpperCase()}</div></div>`:`<div style="text-align:center"><div class="lab" style="letter-spacing:4px">RANK</div><div class="rank ${e.rank}">${e.rank}</div></div>`}
      <div style="flex:1"><h2 style="margin:0">${r}${t.newBest?`<span class="newbest">NEW BEST!</span>`:``}</h2>
        <div style="font:italic 900 64px var(--font);transform:skewX(-6deg);color:#ffd34d">${e.mode===`trial`?e.time.toFixed(1)+`s`:n(e.score)}</div>
        <div class="desc">${e.mode===`trial`?`${e.deliveries} fares in a ${e.taxi}. Score ${n(e.score)}.`:`${e.taxi} · ${e.mode===`quick`?`Quick Shift`:`Arcade Shift`}`}</div></div></div>
      <div class="stat-grid">
        <div class="stat"><b>${e.deliveries}</b><span>DELIVERIES</span></div><div class="stat"><b>${n(e.fares)}</b><span>FARES EARNED</span></div><div class="stat"><b>${n(e.tips)}</b><span>TIPS & BONUSES</span></div>
        <div class="stat"><b>${e.timeBonuses}s</b><span>TIME EARNED</span></div><div class="stat"><b>×${e.bestPulse}</b><span>BEST PULSE</span></div><div class="stat"><b>${n(e.bestChain)}</b><span>BEST CHAIN</span></div>
        <div class="stat"><b>${e.collisions}</b><span>COLLISIONS</span></div><div class="stat"><b>${e.shortcuts}${e.newShortcuts?` (+${e.newShortcuts} new)`:``}</b><span>SHORTCUTS TAKEN</span></div><div class="stat"><b>${e.efficiency?e.efficiency+`%`:`-`}</b><span>ROUTE EFFICIENCY</span></div>
      </div>
      <div class="actions"><button class="btn primary" data-a="retry">RETRY <small>R</small></button><button class="btn alt" data-a="setup">CHANGE CAB</button><button class="btn ghost" data-a="menu">MAIN MENU</button></div></div>`);this.on(i,`[data-a]`,t=>{let n=t.dataset.a;n===`retry`?this.api.restart():n===`setup`?this.setup(e.mode):this.api.quit()}),i.querySelector(`.primary`).focus()}error(e,t,n=!0){let r=this.screen(`dark`,`<div class="panel err"><h2>${e}</h2><div class="desc" style="margin:0 auto">${t}</div>${n?`<div class="actions" style="justify-content:center"><button class="btn primary" data-a="reload">RELOAD</button></div>`:``}</div>`);this.on(r,`[data-a]`,()=>location.reload())}},Bd=new URLSearchParams(location.search),Vd=document.getElementById(`ui`),Hd=document.getElementById(`app`),Ud=document.getElementById(`game`),Wd=document.getElementById(`boot`),Gd=document.getElementById(`boot-fill`),Kd=document.getElementById(`boot-msg`);function qd(e,t){Gd.style.width=`${e*100}%`,Kd.textContent=t}function Jd(){try{return!!document.createElement(`canvas`).getContext(`webgl2`)}catch{return!1}}function Yd(e){return{shadows:e.shadows,resolutionScale:e.resolution,dynamicRes:e.dynamicRes,reducedMotion:e.reducedMotion,shake:e.shake,fov:e.fov,crowd:e.crowd,guidance:e.guidance}}async function Xd(){let e=new zd(Vd,{click(){},start(){},previewTaxi(){},settingsChanged(){},resume(){},restart(){},quit(){},back(){}});if(!Jd()){Wd.classList.add(`gone`),e.error(`WebGL 2 required`,`Farestorm needs a desktop browser with WebGL 2 (current Chrome, Edge or Firefox). Enable hardware acceleration in your browser settings, update your graphics driver, then reload.`);return}qd(.2,`Raising Galeport…`),await new Promise(e=>setTimeout(e,30));let n=v(),r=new d,i=new t;zu();let a=Bd.get(`bot`)===`1`,o=new u,s=new Od({seed:11,mode:`arcade`,taxi:n.taxi,traffic:`calm`,startCountdown:1e9,hub:1});qd(.5,`Painting the city…`),await new Promise(e=>setTimeout(e,30));let c;try{c=new yd(Ud,s,Yd(n.settings),n.color)}catch(t){Wd.classList.add(`gone`),e.error(`Graphics could not start`,`The renderer failed to initialise (${String(t)}). Try reloading or enabling hardware acceleration.`);return}Ud.addEventListener(`webglcontextlost`,e=>{e.preventDefault(),new zd(Vd,{click(){},start(){},previewTaxi(){},settingsChanged(){},resume(){},restart(){},quit(){},back(){}}).error(`Graphics context lost`,`The GPU driver reset the graphics context. Your records are safe. Reload to continue.`)}),c.menuMode=!0,qd(.85,`Tuning engines…`);let l=`menu`,f=null,p=`arcade`,m=-1,h=!1,g=.6,_=0,x=performance.now(),S=!1,C=()=>{let e=v().settings;c.applySettings(Yd(e)),i.setVolumes(e.master,e.music,e.sfx),r.deadzone=e.deadzone,f?.applySettings(e)},w=new zd(Vd,{click:()=>{i.start(),i.uiClick(),i.setMusic(l===`playing`?`game`:`menu`)},start:e=>E(e),previewTaxi:(e,t)=>{s=new Od({seed:11,mode:`arcade`,taxi:e,traffic:`calm`,startCountdown:1e9,hub:1}),c.setSim(s,t),c.menuMode=!0},settingsChanged:C,resume:()=>{l=`playing`,w.clear(),x=performance.now(),_=0},restart:()=>E(p),quit:()=>T(),back:()=>T()});function T(){f?.destroy(),f=null,l=`menu`,h=!1,m=-1;let e=v();s=new Od({seed:11,mode:`arcade`,taxi:e.taxi,traffic:`calm`,startCountdown:1e9,hub:1}),c.setSim(s,e.color),c.menuMode=!0,i.setMusic(`menu`),w.main()}function E(e){let t=v();p=e,i.start(),f?.destroy();let n=Number(Bd.get(`seed`)),a=e===`trial`?1:n>0?n:Math.floor(Math.random()*1e9),o=e===`trial`?`normal`:t.traffic;s=new Od({seed:a,mode:e,taxi:t.taxi,traffic:o,discovered:t.discovered}),c.setSim(s,t.color),c.menuMode=!1,f=new Fd(Hd,s,c),f.applySettings(t.settings),l=`playing`,h=!1,m=-1,_=0,w.clear(),i.setMusic(`game`),r.clearPressed()}function D(e){for(let t of e){if(f?.onEvent(t),c.onEvent(t),i.onEvent(t),t.type===`shortcut`&&t.first){let e=v();e.discovered=[...s.discovered],y()}t.type===`ended`&&(m=2.6)}}function O(){let e=s.result,t=v();t.discovered=[...s.discovered],t.totalFares+=e.deliveries;let n=!1;if(e.mode===`trial`){if(e.medal!==`none`||s.deliveries>=s.trialChain.length){let r=e.time;(t.trialBest===null||r<t.trialBest)&&(t.trialBest=r,n=!0),t.trialMedal=e.medal??null}y()}else n=b(e.mode,e.score,e.bestChain,e.deliveries,e.rank).newBest;y(),l=`results`,h=!0,w.results(e,{newBest:n,medal:e.medal}),i.rankSting(e.rank)}C(),qd(1,`Ready`),setTimeout(()=>Wd.classList.add(`gone`),250);let k=Bd.get(`autostart`);if(k){let e=v(),t=Bd.get(`taxi`);t&&t in hu&&(e.taxi=t);let n=Bd.get(`traffic`);(n===`calm`||n===`normal`||n===`dense`)&&(e.traffic=n),E(k)}else w.main(),i.setMusic(`menu`);document.addEventListener(`visibilitychange`,()=>{document.hidden&&l===`playing`&&s.phase===`running`&&(l=`paused`,w.pause())}),r.onDisconnect=()=>{l===`playing`&&s.phase===`running`&&(l=`paused`,w.pause())},window.addEventListener(`resize`,()=>c.resize()),window.addEventListener(`keydown`,e=>{l===`results`&&(e.code===`KeyR`||e.code===`Enter`)&&document.activeElement===document.body&&E(p),l===`paused`&&e.code===`Escape`&&(l=`playing`,w.clear(),x=performance.now(),_=0)}),window.__farestorm={sim:()=>s,view:c,state:()=>l,begin:E,hud:()=>f,info:()=>c.info,fast:e=>{for(let t=0;t<e*60&&s.phase!==`ended`;t++)s.step(o.next(s)),D(s.drain())}};function A(e){requestAnimationFrame(A);let t=Math.min(e-x,100);x=e;let n=t/1e3;if(l===`playing`){let e=r.takeActions();e.pause&&s.phase===`running`&&(l=`paused`,w.pause()),e.camera&&c.chase.cycle(),e.map&&f?.toggleMap(),_+=n;let t=0;for(;_>=.016666666666666666&&t<5;){let e=a?o.next(s):s.phase===`running`||s.phase===`countdown`?r.read():Dd;s.step(e),D(s.drain()),_-=bd,t++}t>=5&&(_=0);let i=r.read().brake>.1;i!==S&&(c.setBrake(i),S=i),s.phase===`ended`&&m>=0&&(m-=n,m<=0&&!h&&O())}else if(l===`menu`||l===`results`){_+=n;let e=0;for(;_>=.016666666666666666&&e<3;)s.step(Dd),s.drain(),_-=bd,e++;e>=3&&(_=0)}let u=l===`paused`?1:Math.min(1,_/bd);if(l!==`paused`&&c.update(u,n,{camBack:l===`playing`&&r.lookBack}),c.menuMode){g+=n*.22;let e=s.vehicle,t=c.chase.cam,r=8.2,i=e.x+Math.sin(g)*r,a=e.z+Math.cos(g)*r;t.position.set(i,2.5+Math.sin(g*.7)*.4,a);let o=Math.cos(g),u=-Math.sin(g),d=l===`menu`?-2.6:-2.2;t.lookAt(e.x+o*d,1,e.z+u*d),t.fov=52,t.updateProjectionMatrix()}l===`paused`?c.renderer.render(c.scene,c.chase.cam):c.render(t),f&&l!==`menu`&&f.update(n),i.update(s,n,l===`playing`||l===`results`)}requestAnimationFrame(A)}Xd().catch(e=>{Wd.classList.add(`gone`),new zd(Vd,{click(){},start(){},previewTaxi(){},settingsChanged(){},resume(){},restart(){},quit(){},back(){}}).error(`Something went wrong`,`Startup failed: ${String(e)}. Reload to try again.`),console.error(e)});