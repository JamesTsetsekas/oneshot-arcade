(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=(e,t,n)=>e<t?t:e>n?n:e,t=(e,t,n)=>e+(t-e)*n,n=Math.PI/180;function r(e,t){let n=Math.cos(t);return{x:-Math.sin(e)*n,y:Math.sin(t),z:-Math.cos(e)*n}}function i(e){for(;e>Math.PI;)e-=Math.PI*2;for(;e<-Math.PI;)e+=Math.PI*2;return e}function a(e,t){return i(e-t)}function o(e,t){return Math.round(e/t)*t}function s(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return(t>>>0).toString(16).padStart(8,`0`)}var c={concrete:{cost:1/0,opaque:!0,label:`Reinforced concrete`},metal:{cost:7,opaque:!0,label:`Metal housing`},glass:{cost:1.6,opaque:!1,label:`Laminated glass`},thin:{cost:3.2,opaque:!0,label:`Service wall`},foliage:{cost:.55,opaque:!0,label:`Planter foliage`},crate:{cost:4.5,opaque:!0,label:`Cargo crate`},platform:{cost:1/0,opaque:!0,label:`Platform`}},l={"#":6,T:3.4,C:1.6,c:.7,H:1.2,P:1.9,1:.4,2:.8,3:1.2,4:1.6},u=4.2,d=.4,f=1.4;function p(){let e=[];for(let t=0;t<36;t++)e.push(Array(48).fill(`#`));let t={fill:t=>{for(let n of e)n.fill(t)},rect:(t,n,r,i,a)=>{for(let o=n;o<=i;o++)for(let n=t;n<=r;n++)e[o][n]=a},carve:(t,n,r,i)=>{for(let a=n;a<=i;a++)for(let n=t;n<=r;n++)e[a][n]=`.`},set:(t,n,r)=>{e[n][t]=r}};return t.carve(17,1,30,7),t.set(21,5,`C`),t.set(26,5,`C`),t.rect(19,7,19,7,`#`),t.rect(28,7,28,7,`#`),t.carve(14,4,16,5),t.carve(31,4,33,5),t.carve(23,8,24,8),t.carve(19,9,28,21),t.rect(22,13,25,17,`2`),t.rect(23,14,24,16,`T`),t.rect(23,12,24,12,`1`),t.rect(23,18,24,18,`1`),t.set(20,10,`C`),t.set(27,10,`C`),t.set(20,20,`C`),t.set(27,20,`C`),t.set(19,16,`c`),t.set(28,16,`c`),t.carve(22,22,24,26),t.set(21,22,`H`),t.set(25,22,`H`),t.carve(14,13,18,14),t.carve(29,13,33,14),t.carve(2,2,13,15),t.rect(2,2,4,5,`4`),t.rect(5,2,5,3,`3`),t.rect(6,2,6,3,`2`),t.rect(7,2,7,3,`1`),t.rect(5,9,6,10,`T`),t.rect(11,7,11,12,`v`),t.set(9,6,`C`),t.set(10,12,`C`),t.set(8,13,`c`),t.set(3,8,`C`),t.set(3,13,`c`),t.set(8,9,`H`),t.set(8,10,`H`),t.set(12,8,`c`),t.set(13,11,`C`),t.carve(3,16,4,28),t.carve(9,16,10,26),t.set(4,20,`H`),t.set(9,22,`H`),t.set(3,24,`c`),t.set(10,24,`C`),t.carve(34,2,45,14),t.rect(37,4,38,4,`P`),t.rect(41,4,41,5,`P`),t.rect(44,3,45,3,`P`),t.rect(37,8,37,9,`P`),t.rect(40,7,41,7,`P`),t.rect(43,9,44,9,`P`),t.set(39,10,`P`),t.set(36,12,`C`),t.set(42,12,`c`),t.set(45,6,`C`),t.rect(34,8,34,9,`H`),t.rect(36,6,36,6,`H`),t.carve(41,15,45,30),t.rect(43,15,43,26,`l`),t.carve(37,15,37,26),t.rect(37,17,37,20,`k`),t.set(41,22,`H`),t.set(45,25,`c`),t.set(44,18,`C`),t.carve(8,27,39,34),t.carve(3,28,8,30),t.carve(39,28,42,30),t.rect(13,29,14,30,`C`),t.rect(33,29,34,30,`C`),t.rect(17,28,18,28,`C`),t.rect(29,28,30,28,`C`),t.rect(22,29,25,29,`c`),t.rect(11,32,12,33,`C`),t.rect(35,32,36,33,`C`),t.set(9,28,`c`),t.set(38,28,`c`),t.set(15,32,`H`),t.set(32,32,`H`),e}var m=p();function h(e,t){return e<0||t<0||e>=48||t>=36?`#`:m[t][e]}function g(e){switch(e){case`T`:return`metal`;case`C`:case`c`:return`crate`;case`P`:return`foliage`;case`v`:case`w`:return`thin`;case`g`:case`l`:return`glass`;case`1`:case`2`:case`3`:case`4`:return`platform`;default:return`concrete`}}function _(){let e=[],t=t=>e.push({...t,id:e.length}),n=new Set([`#`,`T`,`C`,`c`,`H`,`P`,`1`,`2`,`3`,`4`]),r=m.map(e=>e.map(()=>!1));for(let e=0;e<36;e++)for(let i=0;i<48;i++){let a=m[e][i];if(!n.has(a)||r[e][i])continue;let o=i;for(;o+1<48&&m[e][o+1]===a&&!r[e][o+1];)o++;let s=e;outer:for(;s+1<36;){for(let e=i;e<=o;e++)if(m[s+1][e]!==a||r[s+1][e])break outer;s++}for(let t=e;t<=s;t++)for(let e=i;e<=o;e++)r[t][e]=!0;t({x0:i*2,x1:(o+1)*2,z0:e*2,z1:(s+1)*2,y0:0,y1:l[a],mat:g(a),glyph:a})}for(let{ch:e,ns:n}of[{ch:`w`,ns:!1},{ch:`g`,ns:!1},{ch:`v`,ns:!0},{ch:`l`,ns:!0}]){let r=m.map(e=>e.map(()=>!1));for(let i=0;i<36;i++)for(let a=0;a<48;a++){if(m[i][a]!==e||r[i][a])continue;let o=i,s=a;if(n)for(;o+1<36&&m[o+1][a]===e;)o++;else for(;s+1<48&&m[i][s+1]===e;)s++;for(let e=i;e<=o;e++)for(let t=a;t<=s;t++)r[e][t]=!0;let c=g(e);if(n){let n=(a+.5)*2;t({x0:n-d/2,x1:n+d/2,z0:i*2,z1:(o+1)*2,y0:0,y1:u,mat:c,glyph:e})}else{let n=(i+.5)*2;t({x0:a*2,x1:(s+1)*2,z0:n-d/2,z1:n+d/2,y0:0,y1:u,mat:c,glyph:e})}}}let i=m.map(e=>e.map(()=>!1));for(let e=0;e<36;e++)for(let n=0;n<48;n++){if(m[e][n]!==`k`||i[e][n])continue;let r=e;for(;r+1<36&&m[r+1][n]===`k`;)r++;for(let t=e;t<=r;t++)i[t][n]=!0;t({x0:n*2,x1:(n+1)*2,z0:e*2,z1:(r+1)*2,y0:f,y1:6,mat:`concrete`,glyph:`k`})}return e}var v=_(),y=(e,t,n,r)=>({x0:e*2,z0:t*2,x1:(n+1)*2,z1:(r+1)*2}),b={A:{name:`A`,...y(6,8,10,12)},B:{name:`B`,...y(38,5,44,10)}},x={cus:[{x:40,z:5,yaw:Math.PI},{x:44,z:5,yaw:Math.PI},{x:48,z:5,yaw:Math.PI},{x:52,z:5,yaw:Math.PI},{x:56,z:5,yaw:Math.PI}],int:[{x:40,z:66,yaw:0},{x:44,z:66,yaw:0},{x:48,z:66,yaw:0},{x:52,z:66,yaw:0},{x:56,z:66,yaw:0}]},S={cus:{name:`Atrium`,...y(17,1,30,7)},int:{name:`Yard`,...y(15,31,32,34)}},C=[{name:`Atrium`,...y(17,1,30,7)},{name:`West Link`,...y(14,4,16,5)},{name:`East Link`,...y(31,4,33,5)},{name:`Mid Gate`,...y(23,8,24,8)},{name:`Calibration`,...y(19,9,28,21)},{name:`Mid Deck`,...y(22,13,25,17)},{name:`Cal Ramp`,...y(22,22,24,26)},{name:`Turbine Ramp`,...y(14,13,18,14)},{name:`Lab Link`,...y(29,13,33,14)},{name:`Turbine Hall`,...y(2,2,13,15)},{name:`Gantry`,...y(2,2,4,5)},{name:`Fallback Lane`,...y(12,7,13,12)},{name:`A Site`,...y(6,8,10,12)},{name:`Dock Lane`,...y(3,16,4,28)},{name:`Cargo Lane`,...y(9,16,10,26)},{name:`Hydroponics`,...y(34,2,45,14)},{name:`B Site`,...y(38,5,44,10)},{name:`Glass Corridor`,...y(41,15,45,30)},{name:`Crawl`,...y(37,15,37,26)},{name:`Freight Yard`,...y(8,27,39,34)},{name:`West Dock`,...y(3,28,8,30)},{name:`East Gate`,...y(39,28,42,30)}];function w(e,t){let n=``;for(let r of C)e>=r.x0&&e<=r.x1&&t>=r.z0&&t<=r.z1&&(n=r.name);return n}function T(e,t,n){return t>=e.x0&&t<=e.x1&&n>=e.z0&&n<=e.z1}function E(e,t){return e>=2&&e<=13&&t>=2&&t<=15?`turbine`:e>=34&&e<=45&&t>=2&&t<=14?`hydro`:e>=17&&e<=30&&t>=1&&t<=7?`atrium`:e>=19&&e<=28&&t>=9&&t<=21?`mid`:t>=27&&e>=8&&e<=39?`yard`:`corridor`}var D=[];for(let e=0;e<1728;e++)D.push([]);for(let e of v){let t=Math.max(0,Math.floor(e.x0/2)),n=Math.min(47,Math.floor((e.x1-1e-6)/2)),r=Math.max(0,Math.floor(e.z0/2)),i=Math.min(35,Math.floor((e.z1-1e-6)/2));for(let a=r;a<=i;a++)for(let r=t;r<=n;r++)D[a*48+r].push(e)}var O=[],k=new Int32Array(v.length+8),A=0;function j(e,t,n,r){O.length=0,A++;let i=Math.max(0,Math.floor(e/2)),a=Math.min(47,Math.floor(n/2)),o=Math.max(0,Math.floor(t/2)),s=Math.min(35,Math.floor(r/2));for(let e=o;e<=s;e++)for(let t=i;t<=a;t++)for(let n of D[e*48+t])k[n.id]!==A&&(k[n.id]=A,O.push(n));return O}var ee=s(v.map(e=>[e.x0,e.y0,e.z0,e.x1,e.y1,e.z1,e.mat].join(`,`)).join(`;`)),M=1e-4;function N(e,t,n,r,i){let a=j(e-r,n-r,e+r,n+r);for(let o of a)if(e+r>o.x0+M&&e-r<o.x1-M&&n+r>o.z0+M&&n-r<o.z1-M&&t+i>o.y0+M&&t<o.y1-M)return!0;return!1}function te(e,t,n,r,i=.02,a=!1){let o=0,s=n-i,c=j(e-s,t-s,e+s,t+s);for(let n of c)if(e+s>n.x0&&e-s<n.x1&&t+s>n.z0&&t-s<n.z1&&n.y1<=r+M&&n.y1>o){if(n.y0>.05||a&&n.mat!==`platform`)continue;o=n.y1}return o}function ne(e,t,n,r,i,a,o,s){return re(e,t,n,r,i,a,o.x0,o.y0,o.z0,o.x1,o.y1,o.z1,s)}function re(e,t,n,r,i,a,o,s,c,l,u,d,f){let p={x0:o,y0:s,z0:c,x1:l,y1:u,z1:d},m=0,h=f;if(Math.abs(r)<1e-9){if(e<p.x0||e>p.x1)return null}else{let t=(p.x0-e)/r,n=(p.x1-e)/r;if(t>n){let e=t;t=n,n=e}if(t>m&&(m=t),n<h&&(h=n),m>h)return null}if(Math.abs(i)<1e-9){if(t<p.y0||t>p.y1)return null}else{let e=(p.y0-t)/i,n=(p.y1-t)/i;if(e>n){let t=e;e=n,n=t}if(e>m&&(m=e),n<h&&(h=n),m>h)return null}if(Math.abs(a)<1e-9){if(n<p.z0||n>p.z1)return null}else{let e=(p.z0-n)/a,t=(p.z1-n)/a;if(e>t){let n=e;e=t,t=n}if(e>m&&(m=e),t<h&&(h=t),m>h)return null}return[m,h]}function ie(e,t,n){let r=[],i=e.x+t.x*n,a=e.z+t.z*n,o=Math.max(0,Math.min(e.x,i)),s=Math.min(96,Math.max(e.x,i)),c=Math.max(0,Math.min(e.z,a)),l=Math.min(72,Math.max(e.z,a)),u=(s-o)*(l-c)>900?v:j(o,c,s,l);for(let i of u){let a=ne(e.x,e.y,e.z,t.x,t.y,t.z,i,n);a&&r.push({box:i,t0:a[0],t1:a[1]})}return r.sort((e,t)=>e.t0-t.t0),r}function ae(e,t,n){let r=null,i=ie(e,t,n);return i.length&&(r=i[0]),r}function oe(e,t){let n=t.x-e.x,r=t.y-e.y,i=t.z-e.z,a=Math.hypot(n,r,i);if(a<1e-6)return!0;let o=ie(e,{x:n/a,y:r/a,z:i/a},a);for(let e of o)if(c[e.box.mat].opaque&&!(e.t1-e.t0<1e-4))return!1;return!0}function se(e,t){let n=t.x-e.x,r=t.y-e.y,i=t.z-e.z,a=Math.hypot(n,r,i);if(a<1e-6)return!1;let o=ie(e,{x:n/a,y:r/a,z:i/a},a);for(let e of o)if(!isFinite(c[e.box.mat].cost))return!0;return!1}function ce(e,t,n){let r=t.x-e.x,i=t.y-e.y,a=t.z-e.z,o=Math.hypot(r,i,a);if(o<1e-9)return null;let s=Math.min(e.x,t.x)-n,c=Math.max(e.x,t.x)+n,l=j(s,Math.min(e.z,t.z)-n,c,Math.max(e.z,t.z)+n),u=null,d=r/o,f=i/o,p=a/o;for(let t of l){let r={x0:t.x0-n,x1:t.x1+n,y0:t.y0-n,y1:t.y1+n,z0:t.z0-n,z1:t.z1+n},i=re(e.x,e.y,e.z,d,f,p,r.x0,r.y0,r.z0,r.x1,r.y1,r.z1,o);if(!i)continue;let a=i[0];if(a>o||u&&a/o>=u.t)continue;let s=e.x+d*a,c=e.y+f*a,l=e.z+p*a,m=[Math.abs(s-r.x0),Math.abs(s-r.x1)],h=[Math.abs(c-r.y0),Math.abs(c-r.y1)],g=[Math.abs(l-r.z0),Math.abs(l-r.z1)],_=Math.min(m[0],m[1]),v=Math.min(h[0],h[1]),y=Math.min(g[0],g[1]),b=0,x=0,S=0;_<=v&&_<=y?b=m[0]<m[1]?-1:1:v<=y?x=h[0]<h[1]?-1:1:S=g[0]<g[1]?-1:1,u={t:a/o,nx:b,ny:x,nz:S,box:t}}return u}var le={pistol:{crack:2400,dur:.12,thump:150,vol:.5,tail:.5},smg:{crack:3e3,dur:.09,thump:175,vol:.42,tail:.4},rifle:{crack:1800,dur:.16,thump:110,vol:.62,tail:.7},sniper:{crack:1100,dur:.38,thump:70,vol:.95,tail:1.2},dmr:{crack:1500,dur:.22,thump:92,vol:.78,tail:.9},shotgun:{crack:900,dur:.24,thump:70,vol:.9,tail:.8},lmg:{crack:1500,dur:.14,thump:92,vol:.68,tail:.7},melee:{crack:3e3,dur:.05,thump:200,vol:.2,tail:.1}},ue=class{ctx=null;master;sfx;music;reverb;reverbGain;noise;listener={x:0,y:0,z:0,yaw:0};volume=.7;sfxVolume=1;musicVolume=.5;voices=0;maxVoices=40;musicNodes=[];onCaption;occlusion=!0;resume(){if(!this.ctx){try{let e=window.AudioContext||window.webkitAudioContext;this.ctx=new e}catch{this.ctx=null;return}let e=this.ctx;this.master=e.createGain(),this.master.connect(e.destination),this.sfx=e.createGain(),this.sfx.connect(this.master),this.music=e.createGain(),this.music.connect(this.master),this.reverb=e.createConvolver(),this.reverb.buffer=this.impulse(1.6),this.reverbGain=e.createGain(),this.reverbGain.gain.value=.22,this.reverb.connect(this.reverbGain),this.reverbGain.connect(this.sfx);let t=e.sampleRate*2;this.noise=e.createBuffer(1,t,e.sampleRate);let n=this.noise.getChannelData(0),r=12345;for(let e=0;e<t;e++)r=r*1664525+1013904223>>>0,n[e]=r/4294967296*2-1;this.applyVolumes()}this.ctx&&this.ctx.state===`suspended`&&this.ctx.resume()}applyVolumes(){this.ctx&&(this.master.gain.value=this.volume,this.sfx.gain.value=this.sfxVolume,this.music.gain.value=this.musicVolume*.5)}impulse(e){let t=this.ctx,n=Math.floor(t.sampleRate*e),r=t.createBuffer(2,n,t.sampleRate);for(let e=0;e<2;e++){let t=r.getChannelData(e),i=777+e*31;for(let e=0;e<n;e++)i=i*1664525+1013904223>>>0,t[e]=(i/4294967296*2-1)*(1-e/n)**3.2}return r}route(e,t,n,r=0){let i=this.ctx;if(!i||i.state!==`running`||this.voices>=this.maxVoices)return null;let a=n,o=0,s=18e3;if(e){let n=e.x-this.listener.x,r=e.z-this.listener.z,i=e.y-this.listener.y,c=Math.hypot(n,i,r);if(c>t)return null;a*=Math.max(0,1-c/t)**1.6;let l=Math.cos(this.listener.yaw),u=-Math.sin(this.listener.yaw);o=c<.5?0:Math.max(-1,Math.min(1,(n*l+r*u)/c)),this.occlusion&&c>1.5&&!oe({x:this.listener.x,y:this.listener.y,z:this.listener.z},{x:e.x,y:e.y+1.2,z:e.z})&&(a*=.55,s=700)}if(a<.01)return null;let c=i.createGain();c.gain.value=a;let l=i.createStereoPanner();l.pan.value=o;let u=i.createBiquadFilter();if(u.type=`lowpass`,u.frequency.value=s,u.connect(c),c.connect(l),l.connect(this.sfx),r>0){let e=i.createGain();e.gain.value=r,c.connect(e),e.connect(this.reverb)}return this.voices++,u}release(e){setTimeout(()=>{this.voices=Math.max(0,this.voices-1)},e*1e3+50)}noiseBurst(e,t,n,r,i,a,o,s=.002,c=1){let l=this.ctx,u=l.createBufferSource();u.buffer=this.noise,u.loop=!0;let d=l.createBiquadFilter();d.type=r,d.frequency.value=i,d.Q.value=a;let f=l.createGain();f.gain.setValueAtTime(0,t),f.gain.linearRampToValueAtTime(o,t+s),f.gain.exponentialRampToValueAtTime(Math.max(1e-4,o*.001**c),t+n),u.connect(d),d.connect(f),f.connect(e),u.start(t,Math.random()*1.5),u.stop(t+n+.05)}tone(e,t,n,r,i,a=`sine`,o){let s=this.ctx,c=s.createOscillator();c.type=a,c.frequency.setValueAtTime(n,t),o&&c.frequency.exponentialRampToValueAtTime(o,t+r);let l=s.createGain();l.gain.setValueAtTime(0,t),l.gain.linearRampToValueAtTime(i,t+.004),l.gain.exponentialRampToValueAtTime(1e-4,t+r),c.connect(l),l.connect(e),c.start(t),c.stop(t+r+.05)}shot(e,t,n=!1){let r=le[e],i=this.route(n?void 0:t,n?1:85,n?r.vol:r.vol*1.1,n?.5:.8);if(!i||!this.ctx)return;let a=this.ctx.currentTime;this.noiseBurst(i,a,r.dur,`bandpass`,r.crack,.7,1,.001,1),this.noiseBurst(i,a,r.dur*.5,`highpass`,4500,.5,.5,.001,1),this.tone(i,a,r.thump*1.6,.16,.9,`sine`,r.thump*.45),this.release(r.dur+.3)}step(e,t,n=!1){let r=this.route(n?void 0:e,6+30*t,(n?.22:.55)*(.35+.65*t));if(!r||!this.ctx)return;let i=this.ctx.currentTime;this.noiseBurst(r,i,.07,`bandpass`,500+Math.random()*200,1.2,.8,.002),this.noiseBurst(r,i,.04,`lowpass`,220,.8,.6,.001),this.release(.12)}land(e,t=!1){let n=this.route(t?void 0:e,30,.6);n&&this.ctx&&(this.noiseBurst(n,this.ctx.currentTime,.12,`lowpass`,260,.7,1),this.release(.2))}click(e,t,n=!1){let r=t===`dry`?12:t===`drop`||t===`throw`?28:16,i=this.route(n?void 0:e,r,n?.45:.7);if(!i||!this.ctx)return;let a=this.ctx.currentTime;switch(t){case`reload`:this.noiseBurst(i,a,.04,`bandpass`,2400,3,.8),this.tone(i,a+.02,900,.05,.2,`square`),this.noiseBurst(i,a+.45,.05,`bandpass`,1500,3,.9),this.tone(i,a+.5,320,.08,.25,`triangle`);break;case`draw`:this.noiseBurst(i,a,.06,`bandpass`,1200,2,.5),this.tone(i,a,500,.05,.12,`square`);break;case`dry`:this.noiseBurst(i,a,.03,`bandpass`,3e3,4,.7);break;case`bolt`:this.noiseBurst(i,a+.25,.05,`bandpass`,1800,3,.8),this.tone(i,a+.7,420,.06,.2,`square`);break;case`scope`:this.tone(i,a,1400,.05,.12,`sine`);break;case`drop`:this.noiseBurst(i,a,.14,`lowpass`,500,.8,.9),this.tone(i,a,180,.12,.3,`triangle`,90);break;case`pickup`:this.tone(i,a,700,.07,.2,`square`),this.tone(i,a+.07,1e3,.06,.15,`square`);break;case`throw`:this.noiseBurst(i,a,.18,`bandpass`,700,.7,.5,.05);break;case`melee`:this.noiseBurst(i,a,.12,`bandpass`,1800,.9,.5,.04);break;case`jump`:this.noiseBurst(i,a,.06,`bandpass`,400,1,.4)}this.release(.9)}bounce(e,t){let n=this.route(e,30,.6);if(!n||!this.ctx)return;let r=this.ctx.currentTime;t===2?this.tone(n,r,1700,.18,.25,`triangle`):t===1&&this.tone(n,r,2600,.08,.2,`sine`),this.noiseBurst(n,r,.08,`lowpass`,t===2?1400:420,.8,.8),this.release(.3)}flashPop(e){let t=this.route(e,70,1,.6);if(!t||!this.ctx)return;let n=this.ctx.currentTime;this.noiseBurst(t,n,.25,`highpass`,1500,.5,1,.001),this.tone(t,n,3200,.9,.12,`sine`),this.release(1)}boom(e,t=!1){let n=this.route(e,t?110:80,t?1.4:1.1,1);if(!n||!this.ctx)return;let r=this.ctx.currentTime;this.noiseBurst(n,r,t?1.1:.7,`lowpass`,t?700:900,.5,1.3,.003,1),this.tone(n,r,90,t?1:.6,1.2,`sine`,28),this.release(1.6)}hiss(e){let t=this.route(e,45,.6);t&&this.ctx&&(this.noiseBurst(t,this.ctx.currentTime,1.2,`bandpass`,2600,.6,.6,.1),this.release(1.3))}ignite(e){let t=this.route(e,50,.7,.3);if(!t||!this.ctx)return;let n=this.ctx.currentTime;this.noiseBurst(t,n,.5,`bandpass`,900,.8,.8,.05),this.noiseBurst(t,n+.1,1.2,`lowpass`,500,.6,.5,.2),this.release(1.8)}pulsePing(e){let t=this.route(e,60,.5);if(!t||!this.ctx)return;let n=this.ctx.currentTime;this.tone(t,n,1600,.22,.3,`sine`,700),this.tone(t,n+.1,1200,.2,.2,`sine`,600),this.release(.4)}beep(e,t){let n=this.route(e,95,.55);if(!n||!this.ctx)return;let r=this.ctx.currentTime,i=t<5?1560:t<10?1240:1e3;this.tone(n,r,i,.09,.5,`square`),this.tone(n,r,i*.5,.09,.3,`sine`),this.release(.2)}armLoop(e){let t=this.route(e,40,.5);if(!t||!this.ctx)return;let n=this.ctx.currentTime;for(let e=0;e<3;e++)this.tone(t,n+e*.14,520+e*90,.07,.25,`square`);this.release(.6)}ui(){let e=this.ctx;if(!e||e.state!==`running`)return null;let t=e.createGain();return t.gain.value=.7,t.connect(this.sfx),t}hitMarker(e,t){let n=this.ui();if(!n)return;let r=this.ctx.currentTime;this.tone(n,r,e?2200:1500,.06,.45,`square`),t&&(this.tone(n,r+.05,1100,.14,.4,`triangle`),this.tone(n,r+.05,2200,.1,.2,`sine`))}hurt(){let e=this.ui();if(!e)return;let t=this.ctx.currentTime;this.tone(e,t,140,.2,.9,`sine`,60),this.noiseBurst(e,t,.12,`lowpass`,600,.7,.7)}uiClick(){let e=this.ui();e&&this.tone(e,this.ctx.currentTime,900,.04,.25,`square`)}buy(e){let t=this.ui();if(!t)return;let n=this.ctx.currentTime;e?(this.tone(t,n,880,.07,.3,`triangle`),this.tone(t,n+.06,1320,.1,.3,`triangle`)):this.tone(t,n,200,.16,.4,`sawtooth`)}stinger(e){let t=this.ui();if(!t)return;let n=this.ctx.currentTime;for(let[r,i]of{start:[[440,0],[660,.12],[880,.24]],win:[[523,0],[659,.12],[784,.24],[1046,.4]],lose:[[392,0],[330,.15],[262,.3]],plant:[[660,0],[880,.1],[1320,.2]],defuse:[[880,0],[1100,.1],[1320,.2],[1760,.32]],buyEnd:[[300,0],[300,.12]],half:[[392,0],[523,.18],[392,.36],[659,.54]]}[e])this.tone(t,n+i,r,e===`win`||e===`defuse`?.28:.16,.35,`triangle`)}startMusic(){if(!this.ctx||this.musicNodes.length)return;let e=this.ctx,t=[[220,261.6,329.6],[174.6,220,261.6],[196,246.9,293.7],[164.8,207.6,246.9]],n=e.createBiquadFilter();n.type=`lowpass`,n.frequency.value=900,n.Q.value=.7;let r=e.createGain();r.gain.value=0,r.gain.linearRampToValueAtTime(.5,e.currentTime+3),n.connect(r),r.connect(this.music);let i=[];for(let r=0;r<3;r++)for(let a of[-6,6]){let o=e.createOscillator();o.type=`sawtooth`,o.detune.value=a,o.frequency.value=t[0][r]/2;let s=e.createGain();s.gain.value=.07,o.connect(s),s.connect(n),o.start(),i.push(o)}let a=e.createOscillator();a.frequency.value=.12;let o=e.createGain();o.gain.value=350,a.connect(o),o.connect(n.frequency),a.start();let s=0,c=window.setInterval(()=>{s=(s+1)%t.length,i.forEach((n,r)=>n.frequency.linearRampToValueAtTime(t[s][Math.floor(r/2)]/2,e.currentTime+2.5))},8e3);this.musicNodes.push({stop:()=>{window.clearInterval(c),r.gain.linearRampToValueAtTime(0,e.currentTime+1.2),setTimeout(()=>{i.forEach(e=>e.stop()),a.stop()},1400)}})}stopMusic(){for(let e of this.musicNodes)e.stop();this.musicNodes=[]}},de=`2026.11.1-slice`,fe={veil:{id:`veil`,name:`Veil Canister`,price:300,max:1,blurb:`Blooms into an opaque volume for 17 s.`,color:`#9fb3c8`},flash:{id:`flash`,name:`Arc Flash`,price:200,max:2,blurb:`Line-of-sight flash. Look away.`,color:`#fff6c8`},thermite:{id:`thermite`,name:`Thermite Vial`,price:450,max:1,blurb:`Burns authored floor cells for 7 s.`,color:`#ff8a3c`},pulse:{id:`pulse`,name:`Pulse Shard`,price:350,max:1,blurb:`Two motion pings reveal a coarse wedge of movement.`,color:`#4de0ff`},frag:{id:`frag`,name:`Fragment Charge`,price:300,max:1,blurb:`Lethal displacement grenade with falloff.`,color:`#ff5d73`}},pe=Object.values(fe),P={vest:{name:`Ablative Vest`,price:650},vestHelmet:{name:`Vest + Helmet`,price:1e3},helmetUpgrade:350,kit:{name:`Defuse Tool`,price:400}},me={startMoney:800,cap:12e3,roundWin:3e3,lossBase:1900,lossStep:400,lossMaxTier:3,armPersonal:300,armTeam:600,defusePersonal:300,timeoutNoArmPenalty:500},he={warmup:6,buy:20,action:105,armed:35,roundEnd:5,halftime:7},ge={armTime:3.2,defuseTime:8,defuseTimeKit:5,defuseRange:2.4,beepInterval(e){return e>10?1:e>5?.5:.25}},_e={practice:{id:`practice`,name:`Practice`,winRounds:99,halfRounds:99,maxRounds:400,winBy:2,blurb:`Endless rounds with unlimited money.`},quick:{id:`quick`,name:`Quick Match`,winRounds:5,halfRounds:4,maxRounds:12,winBy:2,blurb:`First to 5, swap after 4. Around 10 minutes.`},full:{id:`full`,name:`Full Match`,winRounds:9,halfRounds:8,maxRounds:20,winBy:2,blurb:`First to 9, swap after 8, win by 2, max 20 rounds. Around 25 minutes.`}},F={tickRate:64,accel:24,decel:30,airAccel:5,gravity:20,jumpSpeed:5.6,walkMul:.52,crouchMul:.4,halfWidth:.34,standHeight:1.8,crouchHeight:1.3,standEye:1.62,crouchEye:1.17,stepHeight:.46,crouchRate:5.5,accuracySpeed:.45},ve={headRadius:.17},I={vela:{id:`vela`,name:`P-5 Vela`,cls:`pistol`,slot:`secondary`,price:300,killReward:300,mode:`semi`,rpm:400,damage:28,pellets:1,headMult:4,chestMult:1,abdomenMult:1.2,armMult:.9,legMult:.7,armorPen:.5,falloff:.88,penetration:1,mag:15,reserve:60,reloadTime:2,drawTime:.35,moveSpeed:5.2,spread:{stand:.0022,move:.02,air:.045,crouch:.8,sustain:.003},recoil:{vert:.9,horiz:.3,freq:1.3,phase:.4,climb:4,maxVert:4,recovery:.35,seedDev:.08},range:80,blurb:`Balanced 15-round starter sidearm.`},rook:{id:`rook`,name:`Rook .44`,cls:`pistol`,slot:`secondary`,price:700,killReward:300,mode:`semi`,rpm:170,damage:62,pellets:1,headMult:3.6,chestMult:1,abdomenMult:1.15,armMult:.9,legMult:.75,armorPen:.85,falloff:.9,penetration:2.2,mag:6,reserve:30,reloadTime:3.1,drawTime:.5,moveSpeed:5,spread:{stand:.0016,move:.03,air:.06,crouch:.75,sustain:.01},recoil:{vert:3.2,horiz:.5,freq:2.1,phase:1.1,climb:2,maxVert:8,recovery:.7,seedDev:.12},range:90,blurb:`Six-shot precision sidearm with brutal recoil and armour pressure.`},needle:{id:`needle`,name:`Needle-9`,cls:`pistol`,slot:`secondary`,price:900,killReward:300,mode:`auto`,rpm:820,damage:19,pellets:1,headMult:3.3,chestMult:1,abdomenMult:1.2,armMult:.9,legMult:.7,armorPen:.55,falloff:.8,penetration:.9,mag:20,reserve:80,reloadTime:2.2,drawTime:.35,moveSpeed:5.2,spread:{stand:.004,move:.025,air:.05,crouch:.85,sustain:.006},recoil:{vert:.7,horiz:.9,freq:1.7,phase:2,climb:5,maxVert:5,recovery:.3,seedDev:.2},range:45,blurb:`Compact automatic sidearm. Close-range emergency weapon.`},kite:{id:`kite`,name:`Kite-9`,cls:`smg`,slot:`primary`,price:1250,killReward:600,mode:`auto`,rpm:750,damage:24,pellets:1,headMult:3.6,chestMult:1,abdomenMult:1.2,armMult:.9,legMult:.7,armorPen:.55,falloff:.85,penetration:1,mag:30,reserve:120,reloadTime:2.2,drawTime:.4,moveSpeed:5,spread:{stand:.0035,move:.012,air:.04,crouch:.85,sustain:.002},recoil:{vert:.5,horiz:.45,freq:1.1,phase:.2,climb:12,maxVert:8,recovery:.35,seedDev:.1},range:55,blurb:`Mobile, forgiving recoil, weak against armour.`},vectora:{id:`vectora`,name:`Vectora-7`,cls:`smg`,slot:`primary`,price:1700,killReward:600,mode:`auto`,rpm:920,damage:26,pellets:1,headMult:3.6,chestMult:1,abdomenMult:1.2,armMult:.9,legMult:.7,armorPen:.62,falloff:.86,penetration:1.2,mag:25,reserve:100,reloadTime:2.4,drawTime:.4,moveSpeed:5,spread:{stand:.0045,move:.014,air:.04,crouch:.85,sustain:.003},recoil:{vert:.95,horiz:.9,freq:1.5,phase:1.5,climb:6,maxVert:9,recovery:.4,seedDev:.15},range:55,blurb:`High rate of fire with a sharp early climb. Strong close entry.`},aster:{id:`aster`,name:`Aster 4`,cls:`rifle`,slot:`primary`,price:2650,killReward:300,mode:`auto`,rpm:620,damage:35,pellets:1,headMult:4,chestMult:1,abdomenMult:1.2,armMult:.9,legMult:.7,armorPen:.8,falloff:.93,penetration:2.2,mag:30,reserve:90,reloadTime:2.5,drawTime:.55,moveSpeed:4.7,spread:{stand:.0012,move:.02,air:.05,crouch:.8,sustain:.0016},recoil:{vert:.78,horiz:.55,freq:.9,phase:.6,climb:10,maxVert:9,recovery:.4,seedDev:.06},range:120,blurb:`Controllable all-purpose rifle. Helmeted headshots are lethal only at close range.`},krait:{id:`krait`,name:`Krait 7`,cls:`rifle`,slot:`primary`,price:2900,killReward:300,mode:`auto`,rpm:500,damage:40,pellets:1,headMult:4,chestMult:1,abdomenMult:1.2,armMult:.9,legMult:.7,armorPen:.92,falloff:.95,penetration:3,mag:25,reserve:75,reloadTime:2.9,drawTime:.65,moveSpeed:4.5,spread:{stand:.0012,move:.022,air:.055,crouch:.78,sustain:.002},recoil:{vert:1.05,horiz:.85,freq:.75,phase:2.4,climb:9,maxVert:11,recovery:.5,seedDev:.08},range:130,blurb:`Slower heavy rifle. Lethal helmet headshots, demanding recoil.`},lumen:{id:`lumen`,name:`Lumen Burst`,cls:`rifle`,slot:`primary`,price:2350,killReward:300,mode:`burst`,rpm:700,burstCount:3,burstRpm:1e3,cycle:.42,damage:30,pellets:1,headMult:4,chestMult:1,abdomenMult:1.2,armMult:.9,legMult:.7,armorPen:.78,falloff:.94,penetration:2,mag:30,reserve:90,reloadTime:2.4,drawTime:.55,moveSpeed:4.7,spread:{stand:6e-4,move:.02,air:.05,crouch:.8,sustain:.0035},recoil:{vert:.95,horiz:.3,freq:1.4,phase:.9,climb:5,maxVert:8,recovery:.5,seedDev:.05},range:125,blurb:`Three-round burst rifle. Low first-shot spread; punishes a missed burst.`},longglass:{id:`longglass`,name:`Longglass M2`,cls:`sniper`,slot:`primary`,price:4650,killReward:100,mode:`bolt`,rpm:45,cycle:1.35,damage:118,pellets:1,headMult:3.6,chestMult:1,abdomenMult:1,armMult:.85,legMult:.55,armorPen:.96,falloff:.99,penetration:4,mag:5,reserve:20,reloadTime:3.4,drawTime:.9,moveSpeed:4.3,spread:{stand:4e-4,move:.06,air:.1,crouch:.9,sustain:0},recoil:{vert:2.4,horiz:.2,freq:1,phase:0,climb:1,maxVert:2.4,recovery:1.2,seedDev:.02},scoped:{zoomFov:[38,14],moveSpreadMul:1,unscopedSpreadMul:6},range:250,blurb:`Bolt-action scope rifle. One-shot torso kill. Scope glint shows to opponents it faces.`},sable:{id:`sable`,name:`Sable DMR`,cls:`dmr`,slot:`primary`,price:3100,killReward:300,mode:`semi`,rpm:260,damage:62,pellets:1,headMult:3.6,chestMult:1,abdomenMult:1.1,armMult:.85,legMult:.6,armorPen:.88,falloff:.97,penetration:2.8,mag:10,reserve:40,reloadTime:3,drawTime:.7,moveSpeed:4.3,spread:{stand:7e-4,move:.05,air:.08,crouch:.85,sustain:.004},recoil:{vert:1.8,horiz:.35,freq:1.2,phase:.3,climb:2,maxVert:5,recovery:.55,seedDev:.05},scoped:{zoomFov:[42],moveSpreadMul:1,unscopedSpreadMul:4},range:200,blurb:`Semi-auto scoped rifle with a two-hit body profile.`},rampart:{id:`rampart`,name:`Rampart 12`,cls:`shotgun`,slot:`primary`,price:1900,killReward:900,mode:`pump`,rpm:72,cycle:.85,damage:11,pellets:9,headMult:2.6,chestMult:1,abdomenMult:1.1,armMult:.9,legMult:.8,armorPen:.55,falloff:.5,penetration:.6,mag:6,reserve:30,reloadTime:.4,shellTime:.5,drawTime:.6,moveSpeed:4.7,spread:{stand:.035,move:.04,air:.06,crouch:.9,sustain:0},recoil:{vert:3.5,horiz:.4,freq:1,phase:0,climb:1,maxVert:3.5,recovery:.6,seedDev:.1},range:35,blurb:`Pump shotgun for close holds.`},atlas:{id:`atlas`,name:`Atlas LMG`,cls:`lmg`,slot:`primary`,price:3800,killReward:300,mode:`auto`,rpm:680,damage:33,pellets:1,headMult:3.8,chestMult:1,abdomenMult:1.2,armMult:.9,legMult:.7,armorPen:.8,falloff:.93,penetration:3.4,mag:100,reserve:200,reloadTime:5.6,drawTime:.9,moveSpeed:4.3,spread:{stand:.0025,move:.03,air:.06,crouch:.8,sustain:.0028},recoil:{vert:.88,horiz:1.15,freq:.55,phase:3.1,climb:14,maxVert:13,recovery:.6,seedDev:.12},range:130,blurb:`High capacity, slow, suppresses through penetrable cover. Difficult recoil.`},tool:{id:`tool`,name:`Kerf Tool`,cls:`melee`,slot:`tool`,price:0,killReward:1e3,mode:`melee`,rpm:120,damage:38,pellets:1,headMult:1,chestMult:1,abdomenMult:1,armMult:1,legMult:1,armorPen:.9,falloff:1,penetration:0,mag:0,reserve:0,reloadTime:0,drawTime:.25,moveSpeed:5.5,spread:{stand:0,move:0,air:0,crouch:1,sustain:0},recoil:{vert:0,horiz:0,freq:0,phase:0,climb:1,maxVert:0,recovery:.1,seedDev:0},range:1.9,blurb:`Short directional strike. Heavy swing on alt-fire.`}};Object.values(I).filter(e=>e.price>0);function ye(e){let t=e>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}function be(e,t){if(t<=0)return{pitch:0,yaw:0};let n=Math.min(t,e.climb),r=Math.max(0,t-e.climb),i=Math.min(e.maxVert,e.vert*(n+r*.3)),a=Math.min(1,t/4);return{pitch:i,yaw:e.horiz*Math.sin(t*e.freq+e.phase)*a}}var xe=1e3,L=1001,Se=1002,R=1003,Ce=1004,z=1005,we=1006,B=1007,Te=1008,Ee=1009,V=1010,De=1011,Oe=1012,ke=1013,Ae=1014,je=1015,Me=1016,Ne=1017,Pe=1018,Fe=1020,Ie=35902,Le=35899,Re=1021,ze=1022,Be=1023,Ve=1026,He=1027,Ue=1028,We=1029,Ge=1030,Ke=1031,qe=1033,Je=33776,Ye=33777,Xe=33778,Ze=33779,Qe=35840,$e=35841,et=35842,tt=35843,nt=36196,rt=37492,it=37496,at=37488,ot=37489,st=37490,ct=37491,lt=37808,ut=37809,dt=37810,ft=37811,pt=37812,mt=37813,ht=37814,gt=37815,_t=37816,vt=37817,yt=37818,bt=37819,xt=37820,St=37821,Ct=36492,wt=36494,Tt=36495,Et=36283,Dt=36284,Ot=36285,kt=36286,At=2300,jt=2301,Mt=2302,Nt=2303,Pt=2400,Ft=2401,It=2402,Lt=3200,Rt=`srgb`,zt=`srgb-linear`,Bt=`linear`,Vt=`srgb`,Ht=7680,Ut=35044,Wt=35048,Gt=2e3;function Kt(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function qt(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Jt(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function Yt(){let e=Jt(`canvas`);return e.style.display=`block`,e}var Xt={};function Zt(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function Qt(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function H(...e){e=Qt(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function U(...e){e=Qt(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function $t(...e){let t=e.join(` `);t in Xt||(Xt[t]=!0,H(...e))}function en(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var tn={0:0,2:6,4:4,3:5,1:1,6:2,7:7,5:3},nn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},rn=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),an=Math.PI/180,on=180/Math.PI;function sn(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(rn[e&255]+rn[e>>8&255]+rn[e>>16&255]+rn[e>>24&255]+`-`+rn[t&255]+rn[t>>8&255]+`-`+rn[t>>16&15|64]+rn[t>>24&255]+`-`+rn[n&63|128]+rn[n>>8&255]+`-`+rn[n>>16&255]+rn[n>>24&255]+rn[r&255]+rn[r>>8&255]+rn[r>>16&255]+rn[r>>24&255]).toLowerCase()}function cn(e,t,n){return Math.max(t,Math.min(n,e))}function ln(e,t){return(e%t+t)%t}function un(e,t,n){return(1-n)*e+n*t}function dn(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function fn(e){switch(e.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function pn(e,t){if(t.constructor===Float32Array)return e;let n=fn(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.max(e/n,-1)}function mn(e,t){if(t.constructor===Float32Array)return e;let n=fn(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.round(e*n)}var W=class{static{this.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=cn(this.x,e.x,t.x),this.y=cn(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=cn(this.x,e,t),this.y=cn(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(cn(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(cn(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},hn=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:H(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(cn(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},G=class{static{this.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(_n.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(_n.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=cn(this.x,e.x,t.x),this.y=cn(this.y,e.y,t.y),this.z=cn(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=cn(this.x,e,t),this.y=cn(this.y,e,t),this.z=cn(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(cn(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return gn.copy(this).projectOnVector(e),this.sub(gn)}reflect(e){return this.sub(gn.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(cn(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},gn=new G,_n=new hn,K=class{static{this.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return $t(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(vn.makeScale(e,t)),this}rotate(e){return $t(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(vn.makeRotation(-e)),this}translate(e,t){return $t(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(vn.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},vn=new K,yn=new K().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),bn=new K().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function xn(){let e={enabled:!0,workingColorSpace:zt,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=Cn(e.r),e.g=Cn(e.g),e.b=Cn(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=wn(e.r),e.g=wn(e.g),e.b=wn(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?Bt:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[n].fromXYZ).multiply(this.spaces[t].toXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[zt]:{primaries:t,whitePoint:r,transfer:Bt,toXYZ:yn,fromXYZ:bn,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Rt},outputColorSpaceConfig:{drawingBufferColorSpace:Rt}},[Rt]:{primaries:t,whitePoint:r,transfer:Vt,toXYZ:yn,fromXYZ:bn,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Rt}}}),e}var Sn=xn();function Cn(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function wn(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var Tn,En=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Tn===void 0&&(Tn=Jt(`canvas`)),Tn.width=e.width,Tn.height=e.height;let t=Tn.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=Tn}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=Jt(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=Cn(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Cn(t[e]/255)*255):t[e]=Cn(t[e]);return{data:t,width:e.width,height:e.height}}return H(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Dn=0,On=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Dn++}),this.uuid=sn(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width||0,t.height||0,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(kn(r[t].image)):e.push(kn(r[t]))}else e=kn(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function kn(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?En.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(H(`Texture: Unable to serialize Texture.`),{})}var An=0,jn=new G,Mn=class e extends nn{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=L,i=L,a=we,o=Te,s=Be,c=Ee,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:An++}),this.uuid=sn(),this.name=``,this.source=new On(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new W(0,0),this.repeat=new W(1,1),this.center=new W(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new K,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(jn).x}get height(){return this.source.getSize(jn).y}get depth(){return this.source.getSize(jn).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){H(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?H(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case xe:e.x-=Math.floor(e.x);break;case L:e.x=e.x<0?0:1;break;case Se:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case xe:e.y-=Math.floor(e.y);break;case L:e.y=e.y<0?0:1;break;case Se:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Mn.DEFAULT_IMAGE=null,Mn.DEFAULT_MAPPING=300,Mn.DEFAULT_ANISOTROPY=1;var Nn=class{static{this.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=cn(this.x,e.x,t.x),this.y=cn(this.y,e.y,t.y),this.z=cn(this.z,e.z,t.z),this.w=cn(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=cn(this.x,e,t),this.y=cn(this.y,e,t),this.z=cn(this.z,e,t),this.w=cn(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(cn(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Pn=class extends nn{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:we,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new Nn(0,0,e,t),this.scissorTest=!1,this.viewport=new Nn(0,0,e,t),this.textures=[];let r=n.count;for(let i=0;i<r;i++)this.textures[i]=new Mn({width:e,height:t,depth:n.depth}),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:we,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new On(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},Fn=class extends Pn{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},In=class extends Mn{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=R,this.minFilter=R,this.wrapR=L,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Ln=class extends Mn{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=R,this.minFilter=R,this.wrapR=L,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},Rn=class e{static{this.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/zn.setFromMatrixColumn(e,0).length(),i=1/zn.setFromMatrixColumn(e,1).length(),a=1/zn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Vn,e,Hn)}lookAt(e,t,n){let r=this.elements;return Gn.subVectors(e,t),Gn.lengthSq()===0&&(Gn.z=1),Gn.normalize(),Un.crossVectors(n,Gn),Un.lengthSq()===0&&(Math.abs(n.z)===1?Gn.x+=1e-4:Gn.z+=1e-4,Gn.normalize(),Un.crossVectors(n,Gn)),Un.normalize(),Wn.crossVectors(Gn,Un),r[0]=Un.x,r[4]=Wn.x,r[8]=Gn.x,r[1]=Un.y,r[5]=Wn.y,r[9]=Gn.y,r[2]=Un.z,r[6]=Wn.z,r[10]=Gn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],ee=r[14],M=r[3],N=r[7],te=r[11],ne=r[15];return i[0]=a*x+o*T+s*k+c*M,i[4]=a*S+o*E+s*A+c*N,i[8]=a*C+o*D+s*j+c*te,i[12]=a*w+o*O+s*ee+c*ne,i[1]=l*x+u*T+d*k+f*M,i[5]=l*S+u*E+d*A+f*N,i[9]=l*C+u*D+d*j+f*te,i[13]=l*w+u*O+d*ee+f*ne,i[2]=p*x+m*T+h*k+g*M,i[6]=p*S+m*E+h*A+g*N,i[10]=p*C+m*D+h*j+g*te,i[14]=p*w+m*O+h*ee+g*ne,i[3]=_*x+v*T+y*k+b*M,i[7]=_*S+v*E+y*A+b*N,i[11]=_*C+v*D+y*j+b*te,i[15]=_*w+v*O+y*ee+b*ne,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=zn.set(r[0],r[1],r[2]).length(),o=zn.set(r[4],r[5],r[6]).length(),s=zn.set(r[8],r[9],r[10]).length();i<0&&(a=-a),Bn.copy(this);let c=1/a,l=1/o,u=1/s;return Bn.elements[0]*=c,Bn.elements[1]*=c,Bn.elements[2]*=c,Bn.elements[4]*=l,Bn.elements[5]*=l,Bn.elements[6]*=l,Bn.elements[8]*=u,Bn.elements[9]*=u,Bn.elements[10]*=u,t.setFromRotationMatrix(Bn),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=Gt,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=Gt,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},zn=new G,Bn=new Rn,Vn=new G(0,0,0),Hn=new G(1,1,1),Un=new G,Wn=new G,Gn=new G,Kn=new Rn,qn=new hn,Jn=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(cn(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-cn(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(cn(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-cn(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(cn(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-cn(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:H(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Kn.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Kn,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return qn.setFromEuler(this),this.setFromQuaternion(qn,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Jn.DEFAULT_ORDER=`XYZ`;var Yn=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},Xn=0,Zn=new G,Qn=new hn,$n=new Rn,er=new G,tr=new G,nr=new G,rr=new hn,ir=new G(1,0,0),ar=new G(0,1,0),or=new G(0,0,1),sr={type:`added`},cr={type:`removed`},lr={type:`childadded`,child:null},ur={type:`childremoved`,child:null},dr=class e extends nn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Xn++}),this.uuid=sn(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new G,n=new Jn,r=new hn,i=new G(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Rn},normalMatrix:{value:new K}}),this.matrix=new Rn,this.matrixWorld=new Rn,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Yn,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Qn.setFromAxisAngle(e,t),this.quaternion.multiply(Qn),this}rotateOnWorldAxis(e,t){return Qn.setFromAxisAngle(e,t),this.quaternion.premultiply(Qn),this}rotateX(e){return this.rotateOnAxis(ir,e)}rotateY(e){return this.rotateOnAxis(ar,e)}rotateZ(e){return this.rotateOnAxis(or,e)}translateOnAxis(e,t){return Zn.copy(e).applyQuaternion(this.quaternion),this.position.add(Zn.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ir,e)}translateY(e){return this.translateOnAxis(ar,e)}translateZ(e){return this.translateOnAxis(or,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4($n.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?er.copy(e):er.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),tr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?$n.lookAt(tr,er,this.up):$n.lookAt(er,tr,this.up),this.quaternion.setFromRotationMatrix($n),r&&($n.extractRotation(r.matrixWorld),Qn.setFromRotationMatrix($n),this.quaternion.premultiply(Qn.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(U(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(sr),lr.child=e,this.dispatchEvent(lr),lr.child=null):U(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(cr),ur.child=e,this.dispatchEvent(ur),ur.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),$n.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),$n.multiply(e.parent.matrixWorld)),e.applyMatrix4($n),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(sr),lr.child=e,this.dispatchEvent(lr),lr.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(tr,e,nr),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(tr,rr,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};dr.DEFAULT_UP=new G(0,1,0),dr.DEFAULT_MATRIX_AUTO_UPDATE=!0,dr.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var fr=class extends dr{constructor(){super(),this.isGroup=!0,this.type=`Group`}},pr={type:`move`},mr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new fr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new fr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new G,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new G),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new fr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new G,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new G,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.quaternion,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.quaternion,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(pr)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new fr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},hr={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},gr={h:0,s:0,l:0},_r={h:0,s:0,l:0};function vr(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var q=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Rt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Sn.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=Sn.workingColorSpace){return this.r=e,this.g=t,this.b=n,Sn.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=Sn.workingColorSpace){if(e=ln(e,1),t=cn(t,0,1),n=cn(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=vr(i,r,e+1/3),this.g=vr(i,r,e),this.b=vr(i,r,e-1/3)}return Sn.colorSpaceToWorking(this,r),this}setStyle(e,t=Rt){function n(t){t!==void 0&&parseFloat(t)<1&&H(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseFloat(i[1]))/100,Math.min(100,parseFloat(i[2]))/100,Math.min(100,parseFloat(i[3]))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:H(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);H(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Rt){let n=hr[e.toLowerCase()];return n===void 0?H(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Cn(e.r),this.g=Cn(e.g),this.b=Cn(e.b),this}copyLinearToSRGB(e){return this.r=wn(e.r),this.g=wn(e.g),this.b=wn(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Rt){return Sn.workingToColorSpace(yr.copy(this),e),Math.round(cn(yr.r*255,0,255))*65536+Math.round(cn(yr.g*255,0,255))*256+Math.round(cn(yr.b*255,0,255))}getHexString(e=Rt){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Sn.workingColorSpace){Sn.workingToColorSpace(yr.copy(this),t);let n=yr.r,r=yr.g,i=yr.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=Sn.workingColorSpace){return Sn.workingToColorSpace(yr.copy(this),t),e.r=yr.r,e.g=yr.g,e.b=yr.b,e}getStyle(e=Rt){Sn.workingToColorSpace(yr.copy(this),e);let t=yr.r,n=yr.g,r=yr.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(gr),this.setHSL(gr.h+e,gr.s+t,gr.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(gr),e.getHSL(_r);let n=un(gr.h,_r.h,t),r=un(gr.s,_r.s,t),i=un(gr.l,_r.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},yr=new q;q.NAMES=hr;var br=class extends dr{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Jn,this.environmentIntensity=1,this.environmentRotation=new Jn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background===null?null:e.background.clone(),this.environment=e.environment===null?null:e.environment.clone(),this.fog=e.fog===null?null:e.fog.clone(),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial===null?null:e.overrideMaterial.clone(),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},xr=new G,Sr=new G,Cr=new G,wr=new G,Tr=new G,Er=new G,Dr=new G,Or=new G,kr=new G,Ar=new G,jr=new Nn,Mr=new Nn,Nr=new Nn,Pr=class e{constructor(e=new G,t=new G,n=new G){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),xr.subVectors(e,t),r.cross(xr);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){xr.subVectors(r,t),Sr.subVectors(n,t),Cr.subVectors(e,t);let a=xr.dot(xr),o=xr.dot(Sr),s=xr.dot(Cr),c=Sr.dot(Sr),l=Sr.dot(Cr),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,wr)!==null&&wr.x>=0&&wr.y>=0&&wr.x+wr.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,wr)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,wr.x),s.addScaledVector(a,wr.y),s.addScaledVector(o,wr.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return jr.setScalar(0),Mr.setScalar(0),Nr.setScalar(0),jr.fromBufferAttribute(e,t),Mr.fromBufferAttribute(e,n),Nr.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(jr,i.x),a.addScaledVector(Mr,i.y),a.addScaledVector(Nr,i.z),a}static isFrontFacing(e,t,n,r){return xr.subVectors(n,t),Sr.subVectors(e,t),xr.cross(Sr).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return xr.subVectors(this.c,this.b),Sr.subVectors(this.a,this.b),xr.cross(Sr).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Tr.subVectors(r,n),Er.subVectors(i,n),Or.subVectors(e,n);let s=Tr.dot(Or),c=Er.dot(Or);if(s<=0&&c<=0)return t.copy(n);kr.subVectors(e,r);let l=Tr.dot(kr),u=Er.dot(kr);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0&&s-l>0)return a=s/(s-l),t.copy(n).addScaledVector(Tr,a);Ar.subVectors(e,i);let f=Tr.dot(Ar),p=Er.dot(Ar);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(Er,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Dr.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Dr,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Tr,a).addScaledVector(Er,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Fr=class{constructor(e=new G(1/0,1/0,1/0),t=new G(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Lr.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Lr.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Lr.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,Lr):Lr.fromBufferAttribute(r,t),Lr.applyMatrix4(e.matrixWorld),this.expandByPoint(Lr);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),Rr.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),Rr.copy(e.boundingBox)),Rr.applyMatrix4(e.matrixWorld),this.union(Rr)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Lr),Lr.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Gr),Kr.subVectors(this.max,Gr),zr.subVectors(e.a,Gr),Br.subVectors(e.b,Gr),Vr.subVectors(e.c,Gr),Hr.subVectors(Br,zr),Ur.subVectors(Vr,Br),Wr.subVectors(zr,Vr);let t=[0,-Hr.z,Hr.y,0,-Ur.z,Ur.y,0,-Wr.z,Wr.y,Hr.z,0,-Hr.x,Ur.z,0,-Ur.x,Wr.z,0,-Wr.x,-Hr.y,Hr.x,0,-Ur.y,Ur.x,0,-Wr.y,Wr.x,0];return!Yr(t,zr,Br,Vr,Kr)||(t=[1,0,0,0,1,0,0,0,1],!Yr(t,zr,Br,Vr,Kr))?!1:(qr.crossVectors(Hr,Ur),t=[qr.x,qr.y,qr.z],Yr(t,zr,Br,Vr,Kr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Lr).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Lr).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(Ir[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ir[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ir[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ir[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ir[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ir[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ir[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ir[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ir)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Ir=[new G,new G,new G,new G,new G,new G,new G,new G],Lr=new G,Rr=new Fr,zr=new G,Br=new G,Vr=new G,Hr=new G,Ur=new G,Wr=new G,Gr=new G,Kr=new G,qr=new G,Jr=new G;function Yr(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){Jr.fromArray(e,a);let o=i.x*Math.abs(Jr.x)+i.y*Math.abs(Jr.y)+i.z*Math.abs(Jr.z),s=t.dot(Jr),c=n.dot(Jr),l=r.dot(Jr);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var Xr=new G,Zr=new W,Qr=0,$r=class extends nn{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Qr++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=Ut,this.updateRanges=[],this.gpuType=je,this.version=0,this._normalizationScale=e===void 0?void 0:fn(e)}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Zr.fromBufferAttribute(this,t),Zr.applyMatrix3(e),this.setXY(t,Zr.x,Zr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Xr.fromBufferAttribute(this,t),Xr.applyMatrix3(e),this.setXYZ(t,Xr.x,Xr.y,Xr.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Xr.fromBufferAttribute(this,t),Xr.applyMatrix4(e),this.setXYZ(t,Xr.x,Xr.y,Xr.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Xr.fromBufferAttribute(this,t),Xr.applyNormalMatrix(e),this.setXYZ(t,Xr.x,Xr.y,Xr.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Xr.fromBufferAttribute(this,t),Xr.transformDirection(e),this.setXYZ(t,Xr.x,Xr.y,Xr.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}_denormalize(e){let t=this._normalizationScale;return t===void 0?pn(e,this.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?mn(e,this.array):Math.round(e*t)}},ei=class extends $r{constructor(e,t,n){super(new Uint16Array(e),t,n)}},ti=class extends $r{constructor(e,t,n){super(new Uint32Array(e),t,n)}},ni=class extends $r{constructor(e,t,n){super(new Float32Array(e),t,n)}},ri=new Fr,ii=new G,ai=new G,oi=class{constructor(e=new G,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?ri.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ii.subVectors(e,this.center);let t=ii.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(ii,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ai.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ii.copy(e.center).add(ai)),this.expandByPoint(ii.copy(e.center).sub(ai))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},si=0,ci=new Rn,li=new dr,ui=new G,di=new Fr,fi=new Fr,pi=new G,mi=class e extends nn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:si++}),this.uuid=sn(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(Kt(e)?ti:ei)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new K().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return ci.makeRotationFromQuaternion(e),this.applyMatrix4(ci),this}rotateX(e){return ci.makeRotationX(e),this.applyMatrix4(ci),this}rotateY(e){return ci.makeRotationY(e),this.applyMatrix4(ci),this}rotateZ(e){return ci.makeRotationZ(e),this.applyMatrix4(ci),this}translate(e,t,n){return ci.makeTranslation(e,t,n),this.applyMatrix4(ci),this}scale(e,t,n){return ci.makeScale(e,t,n),this.applyMatrix4(ci),this}lookAt(e){return li.lookAt(e),li.updateMatrix(),this.applyMatrix4(li.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ui).negate(),this.translate(ui.x,ui.y,ui.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new ni(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&H(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Fr);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)U(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new G(-1/0,-1/0,-1/0),new G(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];di.setFromBufferAttribute(n),this.morphTargetsRelative?(pi.addVectors(this.boundingBox.min,di.min),this.boundingBox.expandByPoint(pi),pi.addVectors(this.boundingBox.max,di.max),this.boundingBox.expandByPoint(pi)):(this.boundingBox.expandByPoint(di.min),this.boundingBox.expandByPoint(di.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&U(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new oi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)U(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new G,1/0);else if(e){let n=this.boundingSphere.center;if(di.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];fi.setFromBufferAttribute(n),this.morphTargetsRelative?(pi.addVectors(di.min,fi.min),di.expandByPoint(pi),pi.addVectors(di.max,fi.max),di.expandByPoint(pi)):(di.expandByPoint(fi.min),di.expandByPoint(fi.max))}di.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)pi.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(pi));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)pi.fromBufferAttribute(a,t),o&&(ui.fromBufferAttribute(e,t),pi.add(ui)),r=Math.max(r,n.distanceToSquared(pi))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&U(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){U(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new $r(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[],c=new Uint8Array(n.count);for(let e=0;e<n.count;e++)o[e]=new G,s[e]=new G;let l=new G,u=new G,d=new G,f=new W,p=new W,m=new W,h=new G,g=new G;function _(e,t,r){c[e]=c[t]=c[r]=1,l.fromBufferAttribute(n,e),u.fromBufferAttribute(n,t),d.fromBufferAttribute(n,r),f.fromBufferAttribute(i,e),p.fromBufferAttribute(i,t),m.fromBufferAttribute(i,r),u.sub(l),d.sub(l),p.sub(f),m.sub(f);let a=1/(p.x*m.y-m.x*p.y);isFinite(a)&&(h.copy(u).multiplyScalar(m.y).addScaledVector(d,-p.y).multiplyScalar(a),g.copy(d).multiplyScalar(p.x).addScaledVector(u,-m.x).multiplyScalar(a),o[e].add(h),o[t].add(h),o[r].add(h),s[e].add(g),s[t].add(g),s[r].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let t=0,n=v.length;t<n;++t){let n=v[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)_(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let y=new G,b=new G,x=new G,S=new G;function C(e){x.fromBufferAttribute(r,e),S.copy(x);let t=o[e];y.copy(t),y.sub(x.multiplyScalar(x.dot(t))).normalize(),b.crossVectors(S,t);let n=b.dot(s[e])<0?-1:1;a.setXYZW(e,y.x,y.y,y.z,n)}for(let e=0,t=n.count;e<t;++e)c[e]&&C(e);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new $r(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new G,i=new G,a=new G,o=new G,s=new G,c=new G,l=new G,u=new G;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)pi.fromBufferAttribute(e,t),pi.normalize(),e.setXYZ(t,pi.x,pi.y,pi.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new $r(a,r,i)}if(this.index===null)return H(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},hi=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=Ut,this.updateRanges=[],this.version=0,this.uuid=sn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});let t=gi(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=this.array.slice(0).buffer);let n=new this.array.constructor(e.arrayBuffers[t]),r=new this.constructor(n,this.stride);return r.setUsage(this.usage),r}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});let t=gi(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=Array.from(new Uint32Array(this.array.slice(0).buffer)));let n={uuid:this.uuid,buffer:t,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}};function gi(e){return e.buffer._uuid===void 0&&(e.buffer._uuid=sn()),e.byteOffset===0&&e.byteLength===e.buffer.byteLength?e.buffer._uuid:e.buffer._uuid+`:`+e.byteOffset+`:`+e.byteLength}var _i=new G,vi=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r,this._normalizationScale=e===void 0?void 0:fn(e.array)}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)_i.fromBufferAttribute(this,t),_i.applyMatrix4(e),this.setXYZ(t,_i.x,_i.y,_i.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)_i.fromBufferAttribute(this,t),_i.applyNormalMatrix(e),this.setXYZ(t,_i.x,_i.y,_i.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)_i.fromBufferAttribute(this,t),_i.transformDirection(e),this.setXYZ(t,_i.x,_i.y,_i.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=this._denormalize(t)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=this._denormalize(t)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=this._denormalize(t)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=this._denormalize(t)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){Zt(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new $r(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Zt(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}_denormalize(e){let t=this._normalizationScale;return t===void 0?pn(e,this.data.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?mn(e,this.data.array):Math.round(e*t)}},yi=new G,bi=new G,xi=new K,Si=class{constructor(e=new G(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=yi.subVectors(n,t).cross(bi.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(yi),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||xi.getNormalMatrix(e),r=this.coplanarPoint(yi).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Ci=0,wi=class extends nn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ci++}),this.uuid=sn(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new q(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ht,this.stencilZFail=Ht,this.stencilZPass=Ht,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){H(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?H(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new q().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new Si().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new W().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new W().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},Ti=class extends wi{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new q(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Ei,Di=new G,Oi=new G,ki=new G,Ai=new W,ji=new W,Mi=new Rn,Ni=new G,Pi=new G,Fi=new G,Ii=new W,Li=new W,Ri=new W,zi=class extends dr{constructor(e=new Ti){if(super(),this.isSprite=!0,this.type=`Sprite`,Ei===void 0){Ei=new mi;let e=new hi(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);Ei.setIndex([0,1,2,0,2,3]),Ei.setAttribute(`position`,new vi(e,3,0,!1)),Ei.setAttribute(`uv`,new vi(e,2,3,!1))}this.geometry=Ei,this.material=e,this.center=new W(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&U(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),Oi.setFromMatrixScale(this.matrixWorld),Mi.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),ki.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Oi.multiplyScalar(-ki.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;Bi(Ni.set(-.5,-.5,0),ki,a,Oi,r,i),Bi(Pi.set(.5,-.5,0),ki,a,Oi,r,i),Bi(Fi.set(.5,.5,0),ki,a,Oi,r,i),Ii.set(0,0),Li.set(1,0),Ri.set(1,1);let o=e.ray.intersectTriangle(Ni,Pi,Fi,!1,Di);if(o===null&&(Bi(Pi.set(-.5,.5,0),ki,a,Oi,r,i),Li.set(0,1),o=e.ray.intersectTriangle(Ni,Fi,Pi,!1,Di),o===null))return;let s=e.ray.origin.distanceTo(Di);s<e.near||s>e.far||t.push({distance:s,point:Di.clone(),uv:Pr.getInterpolation(Di,Ni,Pi,Fi,Ii,Li,Ri,new W),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}toJSON(e){let t=super.toJSON(e);return t.object.center=this.center.toArray(),t}};function Bi(e,t,n,r,i,a){Ai.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?ji.copy(Ai):(ji.x=a*Ai.x-i*Ai.y,ji.y=i*Ai.x+a*Ai.y),e.copy(t),e.x+=ji.x,e.y+=ji.y,e.applyMatrix4(Mi)}var Vi=new G,Hi=new G,Ui=new G,Wi=new G,Gi=class{constructor(e=new G,t=new G(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Vi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Vi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Vi.copy(this.origin).addScaledVector(this.direction,t),Vi.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Hi.copy(e).add(t).multiplyScalar(.5),Ui.copy(t).sub(e).normalize(),Wi.copy(this.origin).sub(Hi);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Ui),o=Wi.dot(this.direction),s=-Wi.dot(Ui),c=Wi.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Hi).addScaledVector(Ui,d),f}intersectSphere(e,t){if(e.radius<0)return null;Vi.subVectors(e.center,this.origin);let n=Vi.dot(this.direction),r=Vi.dot(Vi)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Vi)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,ee,M;if(y>=b&&y>=x?(w=s,D=u,A=p,M=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,ee=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,ee=_)):b>=x?(w=c,D=d,A=m,M=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,ee=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,ee=v)):(w=l,D=f,A=h,M=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,ee=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,ee=g)),w===0)return null;let N=S/w,te=C/w,ne=1/w,re=T-N*D,ie=E-te*D,ae=O-N*A,oe=k-te*A,se=j-N*M,ce=ee-te*M,le=se*oe-ce*ae,ue=re*ce-ie*se,de=ae*ie-oe*re;if(r){if(le<0||ue<0||de<0)return null}else if((le<0||ue<0||de<0)&&(le>0||ue>0||de>0))return null;let fe=le+ue+de;if(fe===0)return null;let pe=ne*(le*D+ue*A+de*M);return(fe>0?pe<0:pe>0)?null:this.at(pe/fe,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ki=class extends wi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new q(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Jn,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},qi=new Rn,Ji=new Gi,Yi=new oi,Xi=new G,Zi=new G,Qi=new G,$i=new G,ea=new G,ta=new G,na=new G,ra=new G,J=class extends dr{constructor(e=new mi,t=new Ki){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){ta.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&(ea.fromBufferAttribute(s,e),a?ta.addScaledVector(ea,r):ta.addScaledVector(ea.sub(t),r))}t.add(ta)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Yi.copy(n.boundingSphere),Yi.applyMatrix4(i),Ji.copy(e.ray).recast(e.near),Yi.containsPoint(Ji.origin)===!1&&(Ji.intersectSphere(Yi,Xi)===null||Ji.origin.distanceToSquared(Xi)>(e.far-e.near)**2)||(qi.copy(i).invert(),Ji.copy(e.ray).applyMatrix4(qi),(n.boundingBox===null||Ji.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,Ji)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=aa(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=aa(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=aa(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=aa(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function ia(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;ra.copy(s),ra.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(ra);return l<n.near||l>n.far?null:{distance:l,point:ra.clone(),object:e}}function aa(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Zi),e.getVertexPosition(c,Qi),e.getVertexPosition(l,$i);let u=ia(e,t,n,r,Zi,Qi,$i,na);if(u){let e=new G;Pr.getBarycoord(na,Zi,Qi,$i,e),i&&(u.uv=Pr.getInterpolatedAttribute(i,s,c,l,e,new W)),a&&(u.uv1=Pr.getInterpolatedAttribute(a,s,c,l,e,new W)),o&&(u.normal=Pr.getInterpolatedAttribute(o,s,c,l,e,new G),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new G,materialIndex:0};Pr.getNormal(Zi,Qi,$i,t.normal),u.face=t,u.barycoord=e}return u}var oa=class extends Mn{constructor(e=null,t=1,n=1,r,i,a,o,s,c=R,l=R,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},sa=class extends $r{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},ca=new Rn,la=new Rn,ua=[],da=new Fr,fa=new Rn,pa=new J,ma=new oi,ha=class extends J{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new sa(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,fa)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Fr),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ca),da.copy(e.boundingBox).applyMatrix4(ca),this.boundingBox.union(da)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new oi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,ca),ma.copy(e.boundingSphere).applyMatrix4(ca),this.boundingSphere.union(ma)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture===null?null:e.morphTexture.clone(),this.instanceColor=e.instanceColor===null?null:e.instanceColor.clone(),this.count=e.count,this.boundingBox=e.boundingBox===null?null:e.boundingBox.clone(),this.boundingSphere=e.boundingSphere===null?null:e.boundingSphere.clone(),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(pa.geometry=this.geometry,pa.material=this.material,pa.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ma.copy(this.boundingSphere),ma.applyMatrix4(n),e.ray.intersectsSphere(ma)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,ca),la.multiplyMatrices(n,ca),pa.matrixWorld=la,pa.raycast(e,ua);for(let e=0,n=ua.length;e<n;e++){let n=ua[e];n.instanceId=i,n.object=this,t.push(n)}ua.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new sa(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new oa(new Float32Array(r*this.count),r,this.count,Ue,je));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},ga=new oi,_a=new W(.5,.5),va=new G,ya=class{constructor(e=new Si,t=new Si,n=new Si,r=new Si,i=new Si,a=new Si){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Gt,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ga.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ga.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ga)}intersectsSprite(e){return ga.center.set(0,0,0),ga.radius=.7071067811865476+_a.distanceTo(e.center),ga.applyMatrix4(e.matrixWorld),this.intersectsSphere(ga)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(va.x=r.normal.x>0?e.max.x:e.min.x,va.y=r.normal.y>0?e.max.y:e.min.y,va.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(va)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},ba=new Rn,xa=class e{constructor(){this.coordinateSystem=Gt,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let e=0;e<t.length;e++){let r=t[e];ba.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[e]===void 0&&(n[e]=new ya),n[e].setFromProjectionMatrix(ba,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new ya),t[r].copy(n[r]);return this._count=e._count,this}clone(){return new e().copy(this)}},Sa=class extends wi{constructor(e){super(),this.isLineBasicMaterial=!0,this.type=`LineBasicMaterial`,this.color=new q(16777215),this.map=null,this.linewidth=1,this.linecap=`round`,this.linejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},Ca=new G,wa=new G,Ta=new Rn,Ea=new Gi,Da=new oi,Oa=new G,ka=new G,Aa=class extends dr{constructor(e=new mi,t=new Sa){super(),this.isLine=!0,this.type=`Line`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let e=1,r=t.count;e<r;e++)Ca.fromBufferAttribute(t,e-1),wa.fromBufferAttribute(t,e),n[e]=n[e-1],n[e]+=Ca.distanceTo(wa);e.setAttribute(`lineDistance`,new ni(n,1))}else H(`Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.`);return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Da.copy(n.boundingSphere),Da.applyMatrix4(r),Da.radius+=i,e.ray.intersectsSphere(Da)===!1)return;Ta.copy(r).invert(),Ea.copy(e.ray).applyMatrix4(Ta);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=this.isLineSegments?2:1,l=n.index,u=n.attributes.position;if(l!==null){let n=Math.max(0,a.start),r=Math.min(l.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=l.getX(i),r=l.getX(i+1),a=ja(this,e,Ea,s,n,r,i);a&&t.push(a)}if(this.isLineLoop){let i=l.getX(r-1),a=l.getX(n),o=ja(this,e,Ea,s,i,a,r-1);o&&t.push(o)}}else{let n=Math.max(0,a.start),r=Math.min(u.count,a.start+a.count);for(let i=n,a=r-1;i<a;i+=c){let n=ja(this,e,Ea,s,i,i+1,i);n&&t.push(n)}if(this.isLineLoop){let i=ja(this,e,Ea,s,r-1,n,r-1);i&&t.push(i)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function ja(e,t,n,r,i,a,o){let s=e.geometry.attributes.position;if(Ca.fromBufferAttribute(s,i),wa.fromBufferAttribute(s,a),n.distanceSqToSegment(Ca,wa,Oa,ka)>r)return;Oa.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(Oa);if(!(c<t.near||c>t.far))return{distance:c,point:ka.clone().applyMatrix4(e.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:e}}var Ma=class extends Mn{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},Na=class extends Mn{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},Pa=class extends Mn{constructor(e,t,n=Ae,r,i,a,o=R,s=R,c,l=Ve,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new On(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Fa=class extends Pa{constructor(e,t=Ae,n=301,r,i,a=R,o=R,s,c=Ve){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Ia=class extends Mn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},La=class e extends mi{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new ni(c,3)),this.setAttribute(`normal`,new ni(l,3)),this.setAttribute(`uv`,new ni(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new G;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Ra=class e extends mi{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type=`CircleGeometry`,this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);let i=[],a=[],o=[],s=[],c=new G,l=new W;a.push(0,0,0),o.push(0,0,1),s.push(.5,.5);for(let i=0,u=3;i<=t;i++,u+=3){let d=n+i/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),l.x=(a[u]/e+1)/2,l.y=(a[u+1]/e+1)/2,s.push(l.x,l.y)}for(let e=1;e<=t;e++)i.push(e,e+1,0);this.setIndex(i),this.setAttribute(`position`,new ni(a,3)),this.setAttribute(`normal`,new ni(o,3)),this.setAttribute(`uv`,new ni(s,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.segments,t.thetaStart,t.thetaLength)}},za=class e extends mi{constructor(e=1,t=1,n=1,r=32,i=1,a=!1,o=0,s=Math.PI*2){super(),this.type=`CylinderGeometry`,this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:i,openEnded:a,thetaStart:o,thetaLength:s};let c=this;r=Math.floor(r),i=Math.floor(i);let l=[],u=[],d=[],f=[],p=0,m=[],h=n/2,g=0;_(),a===!1&&(e>0&&v(!0),t>0&&v(!1)),this.setIndex(l),this.setAttribute(`position`,new ni(u,3)),this.setAttribute(`normal`,new ni(d,3)),this.setAttribute(`uv`,new ni(f,2));function _(){let a=new G,_=new G,v=0,y=(t-e)/n;for(let c=0;c<=i;c++){let l=[],g=c/i,v=g*(t-e)+e;for(let e=0;e<=r;e++){let t=e/r,i=t*s+o,c=Math.sin(i),m=Math.cos(i);_.x=v*c,_.y=-g*n+h,_.z=v*m,u.push(_.x,_.y,_.z),a.set(c,y,m).normalize(),d.push(a.x,a.y,a.z),f.push(t,1-g),l.push(p++)}m.push(l)}for(let n=0;n<r;n++)for(let r=0;r<i;r++){let a=m[r][n],o=m[r+1][n],s=m[r+1][n+1],c=m[r][n+1];(e>0||r!==0)&&(l.push(a,o,c),v+=3),(t>0||r!==i-1)&&(l.push(o,s,c),v+=3)}c.addGroup(g,v,0),g+=v}function v(n){let i=p,a=new W,m=new G,_=0,v=n===!0?e:t,y=n===!0?1:-1;for(let e=1;e<=r;e++)u.push(0,h*y,0),d.push(0,y,0),f.push(.5,.5),p++;let b=p;for(let e=0;e<=r;e++){let t=e/r*s+o,n=Math.cos(t),i=Math.sin(t);m.x=v*i,m.y=h*y,m.z=v*n,u.push(m.x,m.y,m.z),d.push(0,y,0),a.x=n*.5+.5,a.y=i*.5*y+.5,f.push(a.x,a.y),p++}for(let e=0;e<r;e++){let t=i+e,r=b+e;n===!0?l.push(r,r+1,t):l.push(r+1,r,t),_+=3}c.addGroup(g,_,n===!0?1:2),g+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Ba=class e extends za{constructor(e=1,t=1,n=32,r=1,i=!1,a=0,o=Math.PI*2){super(0,e,t,n,r,i,a,o),this.type=`ConeGeometry`,this.parameters={radius:e,height:t,radialSegments:n,heightSegments:r,openEnded:i,thetaStart:a,thetaLength:o}}static fromJSON(t){return new e(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}},Va=class e extends mi{constructor(e=[],t=[],n=1,r=0){super(),this.type=`PolyhedronGeometry`,this.parameters={vertices:e,indices:t,radius:n,detail:r};let i=[],a=[];o(r),c(n),l(),this.setAttribute(`position`,new ni(i,3)),this.setAttribute(`normal`,new ni(i.slice(),3)),this.setAttribute(`uv`,new ni(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(e){let n=new G,r=new G,i=new G;for(let a=0;a<t.length;a+=3)f(t[a+0],n),f(t[a+1],r),f(t[a+2],i),s(n,r,i,e)}function s(e,t,n,r){let i=r+1,a=[];for(let r=0;r<=i;r++){a[r]=[];let o=e.clone().lerp(n,r/i),s=t.clone().lerp(n,r/i),c=i-r;for(let e=0;e<=c;e++)e===0&&r===i?a[r][e]=o:a[r][e]=o.clone().lerp(s,e/c)}for(let e=0;e<i;e++)for(let t=0;t<2*(i-e)-1;t++){let n=Math.floor(t/2);t%2==0?(d(a[e][n+1]),d(a[e+1][n]),d(a[e][n])):(d(a[e][n+1]),d(a[e+1][n+1]),d(a[e+1][n]))}}function c(e){let t=new G;for(let n=0;n<i.length;n+=3)t.x=i[n+0],t.y=i[n+1],t.z=i[n+2],t.normalize().multiplyScalar(e),i[n+0]=t.x,i[n+1]=t.y,i[n+2]=t.z}function l(){let e=new G;for(let t=0;t<i.length;t+=3){e.x=i[t+0],e.y=i[t+1],e.z=i[t+2];let n=h(e)/2/Math.PI+.5,r=g(e)/Math.PI+.5;a.push(n,1-r)}p(),u()}function u(){for(let e=0;e<a.length;e+=6){let t=a[e+0],n=a[e+2],r=a[e+4];Math.max(t,n,r)>.9&&Math.min(t,n,r)<.1&&(t<.2&&(a[e+0]+=1),n<.2&&(a[e+2]+=1),r<.2&&(a[e+4]+=1))}}function d(e){i.push(e.x,e.y,e.z)}function f(t,n){let r=t*3;n.x=e[r+0],n.y=e[r+1],n.z=e[r+2]}function p(){let e=new G,t=new G,n=new G,r=new G,o=new W,s=new W,c=new W;for(let l=0,u=0;l<i.length;l+=9,u+=6){e.set(i[l+0],i[l+1],i[l+2]),t.set(i[l+3],i[l+4],i[l+5]),n.set(i[l+6],i[l+7],i[l+8]),o.set(a[u+0],a[u+1]),s.set(a[u+2],a[u+3]),c.set(a[u+4],a[u+5]),r.copy(e).add(t).add(n).divideScalar(3);let d=h(r);m(o,u+0,e,d),m(s,u+2,t,d),m(c,u+4,n,d)}}function m(e,t,n,r){r<0&&e.x===1&&(a[t]=e.x-1),n.x===0&&n.z===0&&(a[t]=r/2/Math.PI+.5)}function h(e){return Math.atan2(e.z,-e.x)}function g(e){return Math.atan2(-e.y,Math.sqrt(e.x*e.x+e.z*e.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.vertices,t.indices,t.radius,t.detail)}},Ha=class e extends Va{constructor(e=1,t=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],e,t),this.type=`OctahedronGeometry`,this.parameters={radius:e,detail:t}}static fromJSON(t){return new e(t.radius,t.detail)}},Ua=class e extends mi{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new ni(p,3)),this.setAttribute(`normal`,new ni(m,3)),this.setAttribute(`uv`,new ni(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},Wa=class e extends mi{constructor(e=.5,t=1,n=32,r=1,i=0,a=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:i,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);let o=[],s=[],c=[],l=[],u=e,d=(t-e)/r,f=new G,p=new W;for(let e=0;e<=r;e++){for(let e=0;e<=n;e++){let r=i+e/n*a;f.x=u*Math.cos(r),f.y=u*Math.sin(r),s.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,l.push(p.x,p.y)}u+=d}for(let e=0;e<r;e++){let t=e*(n+1);for(let e=0;e<n;e++){let r=e+t,i=r,a=r+n+1,s=r+n+2,c=r+1;o.push(i,a,c),o.push(a,s,c)}}this.setIndex(o),this.setAttribute(`position`,new ni(s,3)),this.setAttribute(`normal`,new ni(c,3)),this.setAttribute(`uv`,new ni(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}},Ga=class e extends mi{constructor(e=1,t=32,n=16,r=0,i=Math.PI*2,a=0,o=Math.PI){super(),this.type=`SphereGeometry`,this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:i,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));let s=Math.min(a+o,Math.PI),c=0,l=[],u=new G,d=new G,f=[],p=[],m=[],h=[];for(let f=0;f<=n;f++){let g=[],_=f/n,v=a+_*o,y=e*Math.cos(v),b=Math.sqrt(e*e-y*y),x=0;f===0&&a===0?x=.5/t:f===n&&s===Math.PI&&(x=-.5/t);for(let e=0;e<=t;e++){let n=e/t,a=r+n*i;u.x=-b*Math.cos(a),u.y=y,u.z=b*Math.sin(a),p.push(u.x,u.y,u.z),d.copy(u).normalize(),m.push(d.x,d.y,d.z),h.push(n+x,1-_),g.push(c++)}l.push(g)}for(let e=0;e<n;e++)for(let r=0;r<t;r++){let t=l[e][r+1],i=l[e][r],o=l[e+1][r],c=l[e+1][r+1];(e!==0||a>0)&&f.push(t,i,c),(e!==n-1||s<Math.PI)&&f.push(i,o,c)}this.setIndex(f),this.setAttribute(`position`,new ni(p,3)),this.setAttribute(`normal`,new ni(m,3)),this.setAttribute(`uv`,new ni(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}},Ka=class e extends mi{constructor(e=1,t=.4,n=12,r=48,i=Math.PI*2,a=0,o=Math.PI*2){super(),this.type=`TorusGeometry`,this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:i,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);let s=[],c=[],l=[],u=[],d=new G,f=new G,p=new G;for(let s=0;s<=n;s++){let m=a+s/n*o;for(let a=0;a<=r;a++){let o=a/r*i;f.x=(e+t*Math.cos(m))*Math.cos(o),f.y=(e+t*Math.cos(m))*Math.sin(o),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),d.x=e*Math.cos(o),d.y=e*Math.sin(o),p.subVectors(f,d).normalize(),l.push(p.x,p.y,p.z),u.push(a/r),u.push(s/n)}}for(let e=1;e<=n;e++)for(let t=1;t<=r;t++){let n=(r+1)*e+t-1,i=(r+1)*(e-1)+t-1,a=(r+1)*(e-1)+t,o=(r+1)*e+t;s.push(n,i,o),s.push(i,a,o)}this.setIndex(s),this.setAttribute(`position`,new ni(c,3)),this.setAttribute(`normal`,new ni(l,3)),this.setAttribute(`uv`,new ni(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};function qa(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(Ya(i))i.isRenderTargetTexture?(H(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(Ya(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function Ja(e){let t={};for(let n=0;n<e.length;n++){let r=qa(e[n]);for(let e in r)t[e]=r[e]}return t}function Ya(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Xa(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Za(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Sn.workingColorSpace}var Qa={clone:qa,merge:Ja},$a=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,eo=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,to=class extends wi{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=$a,this.fragmentShader=eo,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=qa(e.uniforms),this.uniformsGroups=Xa(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new q().setHex(r.value);break;case`v2`:this.uniforms[n].value=new W().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new G().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new Nn().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new K().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new Rn().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},no=class extends to{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},ro=class extends wi{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new q(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new q(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new W(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Jn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},io=class extends wi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=Lt,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},ao=class extends wi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function oo(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function so(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var co=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},lo=class extends co{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Pt,endingEnd:Pt}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Ft:i=e,o=2*t-n;break;case It:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case Ft:a=e,s=2*n-t;break;case It:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},uo=class extends co{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},fo=class extends co{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},po=class extends co{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=go(n,t,g,y,r);i[p]=mo(x,o,_,b,m)}return i}};function mo(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function ho(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function go(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=mo(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=ho(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var _o=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=oo(t,this.TimeBufferType),this.values=oo(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:oo(e.times,Array),values:oo(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),so(e.settings)&&(n.settings={inTangents:oo(e.settings.inTangents,Array),outTangents:oo(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new fo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new uo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new lo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new po(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case At:t=this.InterpolantFactoryMethodDiscrete;break;case jt:t=this.InterpolantFactoryMethodLinear;break;case Mt:t=this.InterpolantFactoryMethodSmooth;break;case Nt:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return H(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return At;case this.InterpolantFactoryMethodLinear:return jt;case this.InterpolantFactoryMethodSmooth:return Mt;case this.InterpolantFactoryMethodBezier:return Nt}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e;so(this.settings)&&(vo(this.settings.inTangents,e),vo(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;so(this.settings)&&(yo(this.settings.inTangents,e),yo(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(U(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(U(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){U(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){U(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&qt(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){U(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Mt,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,so(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function vo(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]+=t}function yo(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}_o.prototype.ValueTypeName=``,_o.prototype.TimeBufferType=Float32Array,_o.prototype.ValueBufferType=Float32Array,_o.prototype.DefaultInterpolation=jt;var bo=class extends _o{constructor(e,t,n){super(e,t,n)}};bo.prototype.ValueTypeName=`bool`,bo.prototype.ValueBufferType=Array,bo.prototype.DefaultInterpolation=At,bo.prototype.InterpolantFactoryMethodLinear=void 0,bo.prototype.InterpolantFactoryMethodSmooth=void 0;var xo=class extends _o{constructor(e,t,n,r){super(e,t,n,r)}};xo.prototype.ValueTypeName=`color`;var So=class extends _o{constructor(e,t,n,r){super(e,t,n,r)}};So.prototype.ValueTypeName=`number`;var Co=class extends co{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)hn.slerpFlat(i,0,a,c-o,a,c,s);return i}},wo=class extends _o{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new Co(this.times,this.values,this.getValueSize(),e)}};wo.prototype.ValueTypeName=`quaternion`,wo.prototype.InterpolantFactoryMethodSmooth=void 0;var To=class extends _o{constructor(e,t,n){super(e,t,n)}};To.prototype.ValueTypeName=`string`,To.prototype.ValueBufferType=Array,To.prototype.DefaultInterpolation=At,To.prototype.InterpolantFactoryMethodLinear=void 0,To.prototype.InterpolantFactoryMethodSmooth=void 0;var Eo=class extends _o{constructor(e,t,n,r){super(e,t,n,r)}};Eo.prototype.ValueTypeName=`vector`;var Do=class extends dr{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new q(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Oo=class extends Do{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(dr.DEFAULT_UP),this.updateMatrix(),this.groundColor=new q(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},ko=new Rn,Ao=new G,jo=new G,Mo=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new W(512,512),this.mapType=Ee,this.map=null,this.mapPass=null,this.matrix=new Rn,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ya,this._frameExtents=new W(1,1),this._viewportCount=1,this._viewports=[new Nn(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Ao.setFromMatrixPosition(e.matrixWorld),t.position.copy(Ao),jo.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(jo),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){ko.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(ko,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(ko)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},No=new G,Po=new hn,Fo=new G,Io=class extends dr{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new Rn,this.projectionMatrix=new Rn,this.projectionMatrixInverse=new Rn,this.coordinateSystem=Gt,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(No,Po,Fo),Fo.x===1&&Fo.y===1&&Fo.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(No,Po,Fo.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(No,Po,Fo),Fo.x===1&&Fo.y===1&&Fo.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(No,Po,Fo.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Lo=new G,Ro=new W,zo=new W,Bo=class extends Io{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=on*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(an*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return on*2*Math.atan(Math.tan(an*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Lo.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Lo.x,Lo.y).multiplyScalar(-e/Lo.z),Lo.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Lo.x,Lo.y).multiplyScalar(-e/Lo.z)}getViewSize(e,t){return this.getViewBounds(e,Ro,zo),t.subVectors(zo,Ro)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(an*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Vo=class extends Mo{constructor(){super(new Bo(90,1,.5,500)),this.isPointLightShadow=!0}},Ho=class extends Do{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type=`PointLight`,this.distance=n,this.decay=r,this.shadow=new Vo}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},Uo=class extends Io{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Wo=class extends Mo{constructor(){super(new Uo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Go=class extends Do{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(dr.DEFAULT_UP),this.updateMatrix(),this.target=new dr,this.shadow=new Wo}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},Ko=class extends Do{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type=`AmbientLight`}},qo=-90,Jo=1,Yo=class extends dr{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Bo(qo,Jo,e,t);r.layers=this.layers,this.add(r);let i=new Bo(qo,Jo,e,t);i.layers=this.layers,this.add(i);let a=new Bo(qo,Jo,e,t);a.layers=this.layers,this.add(a);let o=new Bo(qo,Jo,e,t);o.layers=this.layers,this.add(o);let s=new Bo(qo,Jo,e,t);s.layers=this.layers,this.add(s);let c=new Bo(qo,Jo,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Xo=class extends Bo{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}},Zo=`\\[\\]\\.:\\/`,Qo=RegExp(`[\\[\\]\\.:\\/]`,`g`),$o=`[^\\[\\]\\.:\\/]`,es=`[^`+Zo.replace(`\\.`,``)+`]`,ts=`((?:WC+[\\/:])*)`.replace(`WC`,$o),ns=`(WCOD+)?`.replace(`WCOD`,es),rs=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,$o),is=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,$o),as=RegExp(`^`+ts+ns+rs+is+`$`),os=[`material`,`materials`,`bones`,`map`],ss=class{constructor(e,t,n){let r=n||cs.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},cs=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(Qo,``)}static parseTrackName(e){let t=as.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);os.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){H(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){U(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){U(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){U(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){U(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){U(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){U(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){U(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;U(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){U(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){U(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};cs.Composite=ss,cs.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},cs.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},cs.prototype.GetterByBindingType=[cs.prototype._getValue_direct,cs.prototype._getValue_array,cs.prototype._getValue_arrayElement,cs.prototype._getValue_toArray],cs.prototype.SetterByBindingTypeAndVersioning=[[cs.prototype._setValue_direct,cs.prototype._setValue_direct_setNeedsUpdate,cs.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[cs.prototype._setValue_array,cs.prototype._setValue_array_setNeedsUpdate,cs.prototype._setValue_array_setMatrixWorldNeedsUpdate],[cs.prototype._setValue_arrayElement,cs.prototype._setValue_arrayElement_setNeedsUpdate,cs.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[cs.prototype._setValue_fromArray,cs.prototype._setValue_fromArray_setNeedsUpdate,cs.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]],class{static{this.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}};function ls(e,t,n,r){let i=us(r);switch(n){case Re:return e*t;case Ue:return e*t/i.components*i.byteLength;case We:return e*t/i.components*i.byteLength;case Ge:return e*t*2/i.components*i.byteLength;case Ke:return e*t*2/i.components*i.byteLength;case ze:return e*t*3/i.components*i.byteLength;case Be:return e*t*4/i.components*i.byteLength;case qe:return e*t*4/i.components*i.byteLength;case Je:case Ye:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Xe:case Ze:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case $e:case tt:return Math.max(e,16)*Math.max(t,8)/4;case Qe:case et:return Math.max(e,8)*Math.max(t,8)/2;case nt:case rt:case at:case ot:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case it:case st:case ct:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case lt:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case ut:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case dt:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case ft:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case pt:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case mt:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case ht:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case gt:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case _t:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case vt:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case yt:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case bt:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case xt:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case St:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Ct:case wt:case Tt:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Et:case Dt:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Ot:case kt:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function us(e){switch(e){case Ee:case V:return{byteLength:1,components:1};case Oe:case De:case Me:return{byteLength:2,components:1};case Ne:case Pe:return{byteLength:2,components:4};case Ae:case ke:case je:return{byteLength:4,components:1};case Ie:case Le:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`187`}})),typeof window<`u`&&(window.__THREE__?H(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`187`);function ds(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function fs(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var Y={alphahash_fragment:`#ifdef USE_ALPHAHASH
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
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
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
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
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
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
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
} // validated`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
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
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
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
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
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
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
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
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
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
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
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
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
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
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
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
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
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
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
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
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
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
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
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
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
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
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
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
		return 0.5 / max( gv + gl, EPSILON );
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
		float roughness = max( material.clearcoatRoughness, 0.045 );
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
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
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
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
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
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
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
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
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
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
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
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
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
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
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
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
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
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
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
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
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
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
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
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
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
	#ifdef DOUBLE_SIDED
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
	#ifdef DOUBLE_SIDED
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
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
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
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
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
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
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
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
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
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
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
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
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
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
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
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
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
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
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
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
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
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
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
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
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
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
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
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
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
}`,backgroundCube_frag:`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
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
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
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
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
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
#include <envmap_physical_pars_fragment>
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
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
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
#include <envmap_physical_pars_fragment>
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
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
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
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
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
	#include <premultiplied_alpha_fragment>
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
}`},X={common:{diffuse:{value:new q(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new K},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new K}},envmap:{envMap:{value:null},envMapRotation:{value:new K},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new K}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new K}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new K},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new K},normalScale:{value:new W(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new K},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new K}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new K}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new K}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new q(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new q(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0},uvTransform:{value:new K}},sprite:{diffuse:{value:new q(16777215)},opacity:{value:1},center:{value:new W(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new K},alphaMap:{value:null},alphaMapTransform:{value:new K},alphaTest:{value:0}}},ps={basic:{uniforms:Ja([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.fog]),vertexShader:Y.meshbasic_vert,fragmentShader:Y.meshbasic_frag},lambert:{uniforms:Ja([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.fog,X.lights,{emissive:{value:new q(0)},envMapIntensity:{value:1}}]),vertexShader:Y.meshlambert_vert,fragmentShader:Y.meshlambert_frag},phong:{uniforms:Ja([X.common,X.specularmap,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.fog,X.lights,{emissive:{value:new q(0)},specular:{value:new q(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Y.meshphong_vert,fragmentShader:Y.meshphong_frag},standard:{uniforms:Ja([X.common,X.envmap,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.roughnessmap,X.metalnessmap,X.fog,X.lights,{emissive:{value:new q(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Y.meshphysical_vert,fragmentShader:Y.meshphysical_frag},toon:{uniforms:Ja([X.common,X.aomap,X.lightmap,X.emissivemap,X.bumpmap,X.normalmap,X.displacementmap,X.gradientmap,X.fog,X.lights,{emissive:{value:new q(0)}}]),vertexShader:Y.meshtoon_vert,fragmentShader:Y.meshtoon_frag},matcap:{uniforms:Ja([X.common,X.bumpmap,X.normalmap,X.displacementmap,X.fog,{matcap:{value:null}}]),vertexShader:Y.meshmatcap_vert,fragmentShader:Y.meshmatcap_frag},points:{uniforms:Ja([X.points,X.fog]),vertexShader:Y.points_vert,fragmentShader:Y.points_frag},dashed:{uniforms:Ja([X.common,X.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Y.linedashed_vert,fragmentShader:Y.linedashed_frag},depth:{uniforms:Ja([X.common,X.displacementmap]),vertexShader:Y.depth_vert,fragmentShader:Y.depth_frag},normal:{uniforms:Ja([X.common,X.bumpmap,X.normalmap,X.displacementmap,{opacity:{value:1}}]),vertexShader:Y.meshnormal_vert,fragmentShader:Y.meshnormal_frag},sprite:{uniforms:Ja([X.sprite,X.fog]),vertexShader:Y.sprite_vert,fragmentShader:Y.sprite_frag},background:{uniforms:{uvTransform:{value:new K},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Y.background_vert,fragmentShader:Y.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new K}},vertexShader:Y.backgroundCube_vert,fragmentShader:Y.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Y.cube_vert,fragmentShader:Y.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Y.equirect_vert,fragmentShader:Y.equirect_frag},distance:{uniforms:Ja([X.common,X.displacementmap,{referencePosition:{value:new G},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Y.distance_vert,fragmentShader:Y.distance_frag},shadow:{uniforms:Ja([X.lights,X.fog,{color:{value:new q(0)},opacity:{value:1}}]),vertexShader:Y.shadow_vert,fragmentShader:Y.shadow_frag}};ps.physical={uniforms:Ja([ps.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new K},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new K},clearcoatNormalScale:{value:new W(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new K},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new K},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new K},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new K},sheen:{value:0},sheenColor:{value:new q(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new K},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new K},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new K},transmissionSamplerSize:{value:new W},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new K},attenuationDistance:{value:0},attenuationColor:{value:new q(0)},specularColor:{value:new q(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new K},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new K},anisotropyVector:{value:new W},anisotropyMap:{value:null},anisotropyMapTransform:{value:new K}}]),vertexShader:Y.meshphysical_vert,fragmentShader:Y.meshphysical_frag};var ms={r:0,b:0,g:0},hs=new Rn,gs=new K;gs.set(-1,0,0,0,1,0,0,0,1);function _s(e,t,n,r,i,a){let o=new q(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&i.isCubeTexture?(l===void 0&&(l=new J(new La(1,1,1),new to({name:`BackgroundCubeMaterial`,uniforms:qa(ps.backgroundCube.uniforms),vertexShader:ps.backgroundCube.vertexShader,fragmentShader:ps.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(hs.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(gs),l.material.toneMapped=Sn.getTransfer(i.colorSpace)!==Vt,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new J(new Ua(2,2),new to({name:`BackgroundMaterial`,uniforms:qa(ps.background.uniforms),vertexShader:ps.background.vertexShader,fragmentShader:ps.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=Sn.getTransfer(i.colorSpace)!==Vt,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(ms,Za(e)),n.buffers.color.setClear(ms.r,ms.g,ms.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function vs(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.isInterleavedBuffer===!0?t.stride:t.itemSize,p=s.offset;if(t.isInstancedInterleavedBuffer||t.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function ys(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function bs(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(H(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`),f=n.logarithmicDepthBuffer===!0&&d===!1;n.reversedDepthBuffer===!0&&d===!1&&H(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`),n.logarithmicDepthBuffer===!0&&d===!0&&H(`WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function xs(e){let t=this,n=null,r=0,i=!1,a=!1,o=new Si,s=new K,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var Ss=class extends Fn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Ma(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new La(5,5,5),i=new to({name:`CubemapFromEquirect`,uniforms:qa(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new J(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=we),new Yo(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}},Cs=256,ws=3,Ts=20,Es=256,Ds=16,Os=3,ks=new G,As=new q,js=class e{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Yo(1,10,null),this._boxMesh=new J(new La(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=ks}=i,s=this._renderer;this._setSize(a);let c=this._allocateTarget(),l=this._getSourceTarget(!0);t>0&&(l.texture.mipmapsAutoUpdate=!1);let u=s.autoClear,d=s.autoClearColor,f=s.autoClearDepth,p=s.autoClearStencil,m=e.background;s.autoClear=!0,s.autoClearColor=!0,s.autoClearDepth=!0,s.autoClearStencil=!0,m===null&&(e.background=s.getClearColor(As));let h=new Yo(n,r,l);return h.position.copy(o),h.update(s,e),s.autoClear=u,s.autoClearColor=d,s.autoClearDepth=f,s.autoClearStencil=p,e.background=m,t>0&&(l.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Rs(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ls(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(Cs,dn(e))}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?Cs:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=Ms(e,!1,!1),n=Math.log2(e)-ws;for(let r=0;r<=n;r++)t.texture.mipmaps.push({width:e>>r,height:e>>r});return t.texture.name=`PMREM`,t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Ms(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let r=this._boxMesh,i=this._cubeCamera;r.material=n,i.renderTarget=e,i.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),i.update(this._renderer,r),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===301||e.mapping===302?(this._cubemapMaterial===null&&(this._cubemapMaterial=Rs()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Ls()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=Ps(),this._integrationMaterial=Fs());let n=this._cubeSize,r=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(n/Ds);for(let o=0;o<=r;o++){let s=e.lodToRoughness(o,r);if(o>r-Os)a.roughness.value=s,this._renderCube(t,o,this._integrationMaterial);else{let e=s>0?Math.log2(n)+.5*Math.log2(6/(Es*s**4))+.5:0;i.roughness.value=s,i.lodBias.value=e,this._renderCube(t,o,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=Is());let n=this._blurMaterial,r=n.uniforms,i=this._sourceTarget;r.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,r.envMap.value=i.texture,this._renderCube(e,0,n),r.envMap.value=e.texture,this._renderCube(i,0,n)}};function Ms(e,t,n){return new Ss(e,{minFilter:Te,generateMipmaps:t,type:Me,colorSpace:zt,depthBuffer:n})}function Ns(e,t,n){return new to({name:e,uniforms:t,vertexShader:Y.cube_vert,fragmentShader:n,side:1,blending:0,depthTest:!1,depthWrite:!1})}function Ps(){return Ns(`PMREMGGXConvolution`,{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${Es}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Fs(){return Ns(`PMREMGGXIntegration`,{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Ds}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Is(){return Ns(`PMREMSphericalGaussianBlur`,{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Ts}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function Ls(){return Ns(`PMREMEquirectangularToCubemap`,{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function Rs(){return Ns(`PMREMCubemapToCubemap`,{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function zs(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new Ss(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture&&t.isPMREMTexture!==!0){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new js(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new js(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function Bs(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&$t(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Vs(e,t,n,r){let i={},a=new WeakMap,o=new FinalizationRegistry(e=>delete i[e]);function s(e){c(e.target)}function c(e){e.index!==null&&t.remove(e.index);for(let n in e.attributes)t.remove(e.attributes[n]);e.removeEventListener(`dispose`,s),delete i[e.id],o.unregister(e);let c=a.get(e);c&&(t.remove(c),a.delete(e)),r.releaseStatesOfGeometry(e),e.isInstancedBufferGeometry===!0&&delete e._maxInstanceCount,n.memory.geometries--}function l(e,t){return i[t.id]===void 0&&(t.addEventListener(`dispose`,s),i[t.id]=new WeakRef(t),o.register(t,t.id,t),n.memory.geometries++),t}function u(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function d(e){let n=e.index,r=e.attributes.position,i=0;if(r===void 0)return;let o=n===null?r.array.length/3-1:n.array.length,s=new(r.count>=65535?ti:ei)(Math.ceil(o/3)*6,1),c=s.array;if(n!==null){let e=n.array;i=n.version;for(let t=0,n=0;t<o;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];c[n++]=r,c[n++]=i,c[n++]=i,c[n++]=a,c[n++]=a,c[n++]=r}}else{i=r.version;for(let e=0,t=0;e<o;e+=3){let n=e+0,r=e+1,i=e+2;c[t++]=n,c[t++]=r,c[t++]=r,c[t++]=i,c[t++]=i,c[t++]=n}}s.version=i;let l=a.get(e);l&&t.remove(l),a.set(e,s)}function f(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&d(e)}else d(e);return a.get(e)}function p(){for(let e in i){let t=i[e].deref();t!==void 0&&c(t)}}return{get:l,update:u,getWireframeAttribute:f,dispose:p}}function Hs(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function Us(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:U(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Ws(e,t,n){let r=new WeakMap,i=new Nn;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new In(h,p,m,u);g.type=je,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new W(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function Gs(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var Ks={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function qs(e,t,n,r,i,a){let o=new Fn(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=null,u=new mi;u.setAttribute(`position`,new ni([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute(`uv`,new ni([0,2,0,0,2,0],2));let d=new no({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new J(u,d),p=new Uo(-1,1,1,-1,0,1),m=null,h=null,g=!1,_,v=null,y=[],b=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<y.length;n++){let r=y[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){y=e,b=y.length>0&&y[0].isRenderPass===!0;let t=o.width,n=o.height;y.length>0&&s===null&&(s=new Fn(t,n,{type:Me,depthBuffer:!1,stencilBuffer:!1}),c=new Fn(t,n,{type:Me,depthBuffer:!1,stencilBuffer:!1}));let r=i===!0&&y.some(e=>e.needsDepthTexture===!0);r!==(o.depthTexture!==null)&&(r===!0&&l===null&&(l=new Pa(t,n),a===!0&&(l.format=He,l.type=Fe)),o.dispose(),o.depthTexture=r?l:null,o.resolveDepthBuffer=r,o.storeMultisampledDepthBuffer=r);for(let e=0;e<y.length;e++){let i=y[e];i.setSize&&i.setSize(t,n),r&&i.needsDepthTexture===!0&&i.setDepthTexture&&i.setDepthTexture(l)}},this.begin=function(e,t){if(g||e.toneMapping===0&&y.length===0)return!1;if(v=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return b===!1&&e.setRenderTarget(o),_=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return b},this.end=function(e,t){e.toneMapping=_,g=!0;let n=o,r=s;for(let i=0;i<y.length;i++){let a=y[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(m!==e.outputColorSpace||h!==e.toneMapping){m=e.outputColorSpace,h=e.toneMapping,d.defines={},Sn.getTransfer(m)===`srgb`&&(d.defines.SRGB_TRANSFER=``);let t=Ks[h];t&&(d.defines[t]=``),d.needsUpdate=!0}d.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(v),e.render(f,p),v=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),u.dispose(),d.dispose()}}var Js=new Mn,Ys=new Pa(1,1),Xs=new Fa(1),Zs=new In,Qs=new Ln,$s=new Ma,ec=[],tc=[],nc=new Float32Array(16),rc=new Float32Array(9),ic=new Float32Array(4);function ac(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=ec[i];if(a===void 0&&(a=new Float32Array(i),ec[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function oc(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function sc(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function cc(e,t){let n=tc[t];n===void 0&&(n=new Int32Array(t),tc[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function lc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function uc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(oc(n,t))return;e.uniform2fv(this.addr,t),sc(n,t)}}function dc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(oc(n,t))return;e.uniform3fv(this.addr,t),sc(n,t)}}function fc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(oc(n,t))return;e.uniform4fv(this.addr,t),sc(n,t)}}function pc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(oc(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),sc(n,t)}else{if(oc(n,r))return;ic.set(r),e.uniformMatrix2fv(this.addr,!1,ic),sc(n,r)}}function mc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(oc(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),sc(n,t)}else{if(oc(n,r))return;rc.set(r),e.uniformMatrix3fv(this.addr,!1,rc),sc(n,r)}}function hc(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(oc(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),sc(n,t)}else{if(oc(n,r))return;nc.set(r),e.uniformMatrix4fv(this.addr,!1,nc),sc(n,r)}}function gc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function _c(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(oc(n,t))return;e.uniform2iv(this.addr,t),sc(n,t)}}function vc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(oc(n,t))return;e.uniform3iv(this.addr,t),sc(n,t)}}function yc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(oc(n,t))return;e.uniform4iv(this.addr,t),sc(n,t)}}function bc(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function xc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(oc(n,t))return;e.uniform2uiv(this.addr,t),sc(n,t)}}function Sc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(oc(n,t))return;e.uniform3uiv(this.addr,t),sc(n,t)}}function Cc(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(oc(n,t))return;e.uniform4uiv(this.addr,t),sc(n,t)}}function wc(e){return e.version===0&&(e.compareFunction=519,e.needsUpdate=!0),e}function Tc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_2D_SHADOW?wc(Ys):Js,n.setTexture2D(t||a,i)}function Ec(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||Qs,i)}function Dc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_CUBE_SHADOW?wc(Xs):$s,n.setTextureCube(t||a,i)}function Oc(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||Zs,i)}function kc(e){switch(e){case 5126:return lc;case 35664:return uc;case 35665:return dc;case 35666:return fc;case 35674:return pc;case 35675:return mc;case 35676:return hc;case 5124:case 35670:return gc;case 35667:case 35671:return _c;case 35668:case 35672:return vc;case 35669:case 35673:return yc;case 5125:return bc;case 36294:return xc;case 36295:return Sc;case 36296:return Cc;case 35678:case 36198:case 36298:case 36306:case 35682:return Tc;case 35679:case 36299:case 36307:return Ec;case 35680:case 36300:case 36308:case 36293:return Dc;case 36289:case 36303:case 36311:case 36292:return Oc}}function Ac(e,t){e.uniform1fv(this.addr,t)}function jc(e,t){let n=ac(t,this.size,2);e.uniform2fv(this.addr,n)}function Mc(e,t){let n=ac(t,this.size,3);e.uniform3fv(this.addr,n)}function Nc(e,t){let n=ac(t,this.size,4);e.uniform4fv(this.addr,n)}function Pc(e,t){let n=ac(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function Fc(e,t){let n=ac(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Ic(e,t){let n=ac(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Lc(e,t){e.uniform1iv(this.addr,t)}function Rc(e,t){e.uniform2iv(this.addr,t)}function zc(e,t){e.uniform3iv(this.addr,t)}function Bc(e,t){e.uniform4iv(this.addr,t)}function Vc(e,t){e.uniform1uiv(this.addr,t)}function Hc(e,t){e.uniform2uiv(this.addr,t)}function Uc(e,t){e.uniform3uiv(this.addr,t)}function Wc(e,t){e.uniform4uiv(this.addr,t)}function Gc(e,t,n){let r=this.cache,i=t.length,a=cc(n,i);oc(r,a)||(e.uniform1iv(this.addr,a),sc(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?wc(Ys):Js;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function Kc(e,t,n){let r=this.cache,i=t.length,a=cc(n,i);oc(r,a)||(e.uniform1iv(this.addr,a),sc(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||Qs,a[e])}function qc(e,t,n){let r=this.cache,i=t.length,a=cc(n,i);oc(r,a)||(e.uniform1iv(this.addr,a),sc(r,a));let o;o=this.type===e.SAMPLER_CUBE_SHADOW?wc(Xs):$s;for(let e=0;e!==i;++e)n.setTextureCube(t[e]||o,a[e])}function Jc(e,t,n){let r=this.cache,i=t.length,a=cc(n,i);oc(r,a)||(e.uniform1iv(this.addr,a),sc(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||Zs,a[e])}function Yc(e){switch(e){case 5126:return Ac;case 35664:return jc;case 35665:return Mc;case 35666:return Nc;case 35674:return Pc;case 35675:return Fc;case 35676:return Ic;case 5124:case 35670:return Lc;case 35667:case 35671:return Rc;case 35668:case 35672:return zc;case 35669:case 35673:return Bc;case 5125:return Vc;case 36294:return Hc;case 36295:return Uc;case 36296:return Wc;case 35678:case 36198:case 36298:case 36306:case 35682:return Gc;case 35679:case 36299:case 36307:return Kc;case 35680:case 36300:case 36308:case 36293:return qc;case 36289:case 36303:case 36311:case 36292:return Jc}}var Xc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=kc(t.type)}},Zc=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Yc(t.type)}},Qc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},$c=/(\w+)(\])?(\[|\.)?/g;function el(e,t){e.seq.push(t),e.map[t.id]=t}function tl(e,t,n){let r=e.name,i=r.length;for($c.lastIndex=0;;){let a=$c.exec(r),o=$c.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){el(n,l===void 0?new Xc(s,e,t):new Zc(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new Qc(s),el(n,e)),n=e}}}var nl=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);tl(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function rl(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var il=37297,al=0;function ol(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var sl=new K;function cl(e){Sn._getMatrix(sl,Sn.workingColorSpace,e);let t=`mat3( ${sl.elements.map(e=>e.toFixed(4))} )`;switch(Sn.getTransfer(e)){case Bt:return[t,`LinearTransferOETF`];case Vt:return[t,`sRGBTransferOETF`];default:return H(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function ll(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+ol(e.getShaderSource(t),r)}return i}function ul(e,t){let n=cl(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,`}`].join(`
`)}var dl={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function fl(e,t){let n=dl[t];return n===void 0?(H(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var pl=new G;function ml(){return Sn.getLuminanceCoefficients(pl),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${pl.x.toFixed(4)}, ${pl.y.toFixed(4)}, ${pl.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function hl(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(vl).join(`
`)}function gl(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function _l(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function vl(e){return e!==``}function yl(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function bl(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var xl=/^[ \t]*#include +<([\w\d./]+)>/gm;function Sl(e){return e.replace(xl,Cl)}function Cl(e,t){let n=Y[t];if(n===void 0)throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`);return Sl(n)}var wl=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Tl(e){return e.replace(wl,El)}function El(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Dl(e){let t=`precision ${e.precision} float;
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
#define LOW_PRECISION`),t}var Ol={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function kl(e){return Ol[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Al={302:`ENVMAP_MODE_REFRACTION`};function jl(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Al[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Ml={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function Nl(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Ml[e.combine]||`ENVMAP_BLENDING_NONE`}function Pl(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=kl(n),l=n.envMapPMREM===!0?`ENVMAP_TYPE_PMREM`:`ENVMAP_TYPE_CUBE`,u=jl(n),d=Nl(n),f=hl(n),p=gl(a),m=i.createProgram(),h,g,_=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(h=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(vl).join(`
`),h.length>0&&(h+=`
`),g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(vl).join(`
`),g.length>0&&(g+=`
`)):(h=[Dl(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.diffuseRoughnessMapUv?`#define DIFFUSE_ROUGHNESSMAP_UV `+n.diffuseRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(vl).join(`
`),g=[Dl(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,n.envMapPMREM?`#define ENVMAP_MAX_LOD `+n.envMapMaxLod+`.0`:``,n.envMapPMREM?`#define ENVMAP_SIZE `+n.envMapSize+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughness?`#define USE_DIFFUSE_ROUGHNESS`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Y.tonemapping_pars_fragment,n.toneMapping===0?``:fl(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Y.colorspace_pars_fragment,ul(`linearToOutputTexel`,n.outputColorSpace),ml(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(vl).join(`
`)),o=Sl(o),o=yl(o,n),o=bl(o,n),s=Sl(s),s=yl(s,n),s=bl(s,n),o=Tl(o),s=Tl(s),n.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,h=[f,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+h,g=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+g);let v=_+h+o,y=_+g+s,b=rl(i,i.VERTEX_SHADER,v),x=rl(i,i.FRAGMENT_SHADER,y);i.attachShader(m,b),i.attachShader(m,x),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(m,0,`position`):i.bindAttribLocation(m,0,n.index0AttributeName),i.linkProgram(m);function S(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(m)||``,r=i.getShaderInfoLog(b)||``,a=i.getShaderInfoLog(x)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,m,b,x);else{let e=ll(i,b,`vertex`),n=ll(i,x,`fragment`);U(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):H(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:h},fragmentShader:{log:c,prefix:g}})}i.deleteShader(b),i.deleteShader(x),C=new nl(i,m),w=_l(i,m)}let C;this.getUniforms=function(){return C===void 0&&S(this),C};let w;this.getAttributes=function(){return w===void 0&&S(this),w};let T=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=i.getProgramParameter(m,il)),T},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=al++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=x,this}var Fl=0,Il=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Ll(e),t.set(e,n)),n}},Ll=class{constructor(e){this.id=Fl++,this.code=e,this.usedTimes=0}};function Rl(e){return e===1030||e===37490||e===36285}function zl(e,t,n,r,i,a){let o=new Yn,s=new Il,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function p(e){return c.add(e),e===0?`uv`:`uv${e}`}function m(i,o,l,u,m,h){let g=u.fog,_=m.geometry,v=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,b=t.get(i.envMap||v,y),x=f[i.type],S=r.precision;i.precision!==null&&(S=r.getMaxPrecision(i.precision),S!==i.precision&&H(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,S,`instead.`));let C=_.morphAttributes.position||_.morphAttributes.normal||_.morphAttributes.color,w=C===void 0?0:C.length,T=0;_.morphAttributes.position!==void 0&&(T=1),_.morphAttributes.normal!==void 0&&(T=2),_.morphAttributes.color!==void 0&&(T=3);let E,D,O,k;if(x){let e=ps[x];E=e.vertexShader,D=e.fragmentShader}else{E=i.vertexShader,D=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),O=e.id,k=t.id}let A=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),ee=m.isInstancedMesh===!0,M=m.isBatchedMesh===!0,N=!!i.map,te=!!i.matcap,ne=!!b,re=ne&&b.isPMREMTexture===!0,ie=!!i.aoMap,ae=!!i.lightMap,oe=!!i.bumpMap&&i.wireframe===!1,se=!!i.normalMap,ce=!!i.displacementMap,le=!!i.emissiveMap,ue=!!i.metalnessMap,de=!!i.roughnessMap,fe=i.anisotropy>0,pe=i.clearcoat>0,P=i.diffuseRoughness>0,me=i.dispersion>0,he=i.retroreflectivity>0,ge=i.iridescence>0,_e=i.sheen>0,F=i.transmission>0,ve=fe&&!!i.anisotropyMap,I=pe&&!!i.clearcoatMap,ye=pe&&!!i.clearcoatNormalMap,be=pe&&!!i.clearcoatRoughnessMap,xe=P&&!!i.diffuseRoughnessMap,L=ge&&!!i.iridescenceMap,Se=ge&&!!i.iridescenceThicknessMap,R=_e&&!!i.sheenColorMap,Ce=_e&&!!i.sheenRoughnessMap,z=!!i.specularMap,we=!!i.specularColorMap,B=!!i.specularIntensityMap,Te=F&&!!i.transmissionMap,Ee=F&&!!i.thicknessMap,V=!!i.gradientMap,De=!!i.alphaMap,Oe=i.alphaTest>0,ke=!!i.alphaHash,Ae=!!i.extensions,je=0;i.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(je=e.toneMapping);let Me=re?b.isCompressedCubeTexture?b.image[0].mipmaps:b.mipmaps:null,Ne={shaderID:x,shaderType:i.type,shaderName:i.name,vertexShader:E,fragmentShader:D,defines:i.defines,customVertexShaderID:O,customFragmentShaderID:k,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:S,batching:M,batchingColor:M&&m._colorsTexture!==null,instancing:ee,instancingColor:ee&&m.instanceColor!==null,instancingMorph:ee&&m.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Sn.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:N,matcap:te,envMap:ne,envMapMode:ne&&b.mapping,envMapPMREM:re,envMapMaxLod:re?Me.length-1:null,envMapSize:re?Me[0].width:null,aoMap:ie,lightMap:ae,bumpMap:oe,normalMap:se,displacementMap:ce,emissiveMap:le,normalMapObjectSpace:se&&i.normalMapType===1,normalMapTangentSpace:se&&i.normalMapType===0,packedNormalMap:se&&i.normalMapType===0&&Rl(i.normalMap.format),metalnessMap:ue,roughnessMap:de,anisotropy:fe,anisotropyMap:ve,clearcoat:pe,clearcoatMap:I,clearcoatNormalMap:ye,clearcoatRoughnessMap:be,diffuseRoughness:P,diffuseRoughnessMap:xe,dispersion:me,retroreflection:he,iridescence:ge,iridescenceMap:L,iridescenceThicknessMap:Se,sheen:_e,sheenColorMap:R,sheenRoughnessMap:Ce,specularMap:z,specularColorMap:we,specularIntensityMap:B,transmission:F,transmissionMap:Te,thicknessMap:Ee,gradientMap:V,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:De,alphaTest:Oe,alphaHash:ke,combine:i.combine,mapUv:N&&p(i.map.channel),aoMapUv:ie&&p(i.aoMap.channel),lightMapUv:ae&&p(i.lightMap.channel),bumpMapUv:oe&&p(i.bumpMap.channel),normalMapUv:se&&p(i.normalMap.channel),displacementMapUv:ce&&p(i.displacementMap.channel),emissiveMapUv:le&&p(i.emissiveMap.channel),metalnessMapUv:ue&&p(i.metalnessMap.channel),roughnessMapUv:de&&p(i.roughnessMap.channel),anisotropyMapUv:ve&&p(i.anisotropyMap.channel),clearcoatMapUv:I&&p(i.clearcoatMap.channel),clearcoatNormalMapUv:ye&&p(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:be&&p(i.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:xe&&p(i.diffuseRoughnessMap.channel),iridescenceMapUv:L&&p(i.iridescenceMap.channel),iridescenceThicknessMapUv:Se&&p(i.iridescenceThicknessMap.channel),sheenColorMapUv:R&&p(i.sheenColorMap.channel),sheenRoughnessMapUv:Ce&&p(i.sheenRoughnessMap.channel),specularMapUv:z&&p(i.specularMap.channel),specularColorMapUv:we&&p(i.specularColorMap.channel),specularIntensityMapUv:B&&p(i.specularIntensityMap.channel),transmissionMapUv:Te&&p(i.transmissionMap.channel),thicknessMapUv:Ee&&p(i.thicknessMap.channel),alphaMapUv:De&&p(i.alphaMap.channel),vertexTangents:!!_.attributes.tangent&&(se||fe),vertexNormals:!!_.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!_.attributes.color&&_.attributes.color.itemSize===4,pointsUvs:m.isPoints===!0&&!!_.attributes.uv&&(N||De),fog:!!g,useFog:i.fog===!0,fogExp2:!!g&&g.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||_.attributes.normal===void 0&&se===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:m.isSkinnedMesh===!0,hasPositionAttribute:_.attributes.position!==void 0,morphTargets:_.morphAttributes.position!==void 0,morphNormals:_.morphAttributes.normal!==void 0,morphColors:_.morphAttributes.color!==void 0,morphTargetsCount:w,morphTextureStride:T,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:h.filter(e=>e.texture!==null).length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:je,decodeVideoTexture:N&&i.map.isVideoTexture===!0&&Sn.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:le&&i.emissiveMap.isVideoTexture===!0&&Sn.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Ae&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Ae&&i.extensions.multiDraw===!0||M)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return Ne.vertexUv1s=c.has(1),Ne.vertexUv2s=c.has(2),Ne.vertexUv3s=c.has(3),c.clear(),Ne}function h(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(g(n,t),_(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function g(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapPMREM),e.push(t.envMapMaxLod),e.push(t.envMapSize),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.diffuseRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.numLightProbeGrids),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function _(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.diffuseRoughness&&o.enable(25),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function v(e){let t=f[e.type],n;if(t){let e=ps[t];n=Qa.clone(e.uniforms)}else n=e.uniforms;return n}function y(t,n){let r=u.get(n);return r===void 0?(r=new Pl(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function b(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function x(e){s.remove(e)}function S(){s.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:v,acquireProgram:y,releaseProgram:b,releaseShaderCache:x,programs:l,dispose:S}}function Bl(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function Vl(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Hl(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Ul(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||Vl),r.length>1&&r.sort(t||Hl),i.length>1&&i.sort(t||Hl)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function Wl(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new Ul,e.set(t,[i])):n>=r.length?(i=new Ul,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Gl(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new G,color:new q};break;case`SpotLight`:n={position:new G,direction:new G,color:new q,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new G,color:new q,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new G,skyColor:new q,groundColor:new q};break;case`RectAreaLight`:n={color:new q,position:new G,halfWidth:new G,halfHeight:new G}}return e[t.id]=n,n}}}function Kl(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new W,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var ql=0;function Jl(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function Yl(e){let t=new Gl,n=Kl(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new G);let i=new G,a=new Rn,o=new Rn;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(Jl);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=X.LTC_FLOAT_1,r.rectAreaLTC2=X.LTC_FLOAT_2):(r.rectAreaLTC1=X.LTC_HALF_1,r.rectAreaLTC2=X.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=ql++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function Xl(e){let t=new Yl(e),n=[],r=[],i=[];function a(e){u.camera=e,n.length=0,r.length=0,i.length=0}function o(e){e.isLightProbeGrid?i.push(e):n.push(e)}function s(e){r.push(e)}function c(){t.setup(n),i.sort((e,t)=>e.priority-t.priority||e.id-t.id)}function l(e){t.setupView(n,e)}let u={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:u,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:s}}function Zl(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new Xl(e),t.set(n,[a])):r>=i.length?(a=new Xl(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Ql=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,$l=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,eu=[new G(1,0,0),new G(-1,0,0),new G(0,1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1)],tu=[new G(0,-1,0),new G(0,-1,0),new G(0,0,1),new G(0,0,-1),new G(0,-1,0),new G(0,-1,0)],nu=new Rn,ru=new G,iu=new G;function au(e,t,n){let r=new ya,i=new W,a=new W,o=new Nn,s=new io,c=new ao,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new to({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new W},radius:{value:4}},vertexShader:Ql,fragmentShader:$l}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new mi;m.setAttribute(`position`,new $r(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new J(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(H(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){H(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){H(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new Fn(i.x,i.y,{format:Ge,type:Me,minFilter:we,magFilter:we,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new Pa(i.x,i.y,je),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=Ve,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=R,d.map.depthTexture.magFilter=R}else l.isPointLight?(d.map=new Ss(i.x),d.map.depthTexture=new Fa(i.x,Ae)):(d.map=new Fn(i.x,i.y),d.map.depthTexture=new Pa(i.x,i.y,Ae)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=Ve,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=we,d.map.depthTexture.magFilter=we):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=R,d.map.depthTexture.magFilter=R);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);let _=d.camera.layers.mask&4294967294?d.camera.layers:s.layers;for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),ru.setFromMatrixPosition(l.matrixWorld),e.position.copy(ru),iu.copy(e.position),iu.add(eu[t]),e.up.copy(tu[t]),e.lookAt(iu),e.updateMatrixWorld(),n.makeTranslation(-ru.x,-ru.y,-ru.z),nu.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(nu,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,_,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new Fn(i.x,i.y,{format:Ge,type:Me}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s,c){if(n.visible===!1)return;if(n.layers.test(s)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&c===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),s=n.material;if(Array.isArray(s)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=s[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,c);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(s.visible){let t=y(n,s,o,c);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let l=n.children;for(let e=0,t=l.length;e<t;e++)b(l[e],i,a,o,s,c)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function ou(e,t){function n(){let t=!1,n=new Nn,r=null,i=new Nn(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?ue(e.DEPTH_TEST):de(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=tn[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?ue(e.STENCIL_TEST):de(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c={},l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new q(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ee=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),M=!1,N=0,te=e.getParameter(e.VERSION);te.indexOf(`WebGL`)===-1?te.indexOf(`OpenGL ES`)!==-1&&(N=parseFloat(/^OpenGL ES (\d)/.exec(te)[1]),M=N>=2):(N=parseFloat(/^WebGL (\d)/.exec(te)[1]),M=N>=1);let ne=null,re={},ie=e.getParameter(e.SCISSOR_BOX),ae=e.getParameter(e.VIEWPORT),oe=new Nn().fromArray(ie),se=new Nn().fromArray(ae);function ce(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let le={};le[e.TEXTURE_2D]=ce(e.TEXTURE_2D,e.TEXTURE_2D,1),le[e.TEXTURE_CUBE_MAP]=ce(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),le[e.TEXTURE_2D_ARRAY]=ce(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),le[e.TEXTURE_3D]=ce(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),ue(e.DEPTH_TEST),o.setFunc(3),F(!1),ve(1),ue(e.CULL_FACE),ge(0);function ue(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function de(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function fe(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function pe(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function P(t){return h!==t&&(e.useProgram(t),h=t,!0)}let me={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};me[103]=e.MIN,me[104]=e.MAX;let he={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function ge(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(de(e.BLEND),g=!1);else if(g===!1&&(ue(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:U(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:U(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:U(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:U(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(me[n],me[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(he[r],he[i],he[o],he[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function _e(t,n){t.side===2?de(e.CULL_FACE):ue(e.CULL_FACE);let r=t.side===1;n&&(r=!r),F(r),t.blending===1&&t.transparent===!1?ge(0):ge(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),ye(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?ue(e.SAMPLE_ALPHA_TO_COVERAGE):de(e.SAMPLE_ALPHA_TO_COVERAGE)}function F(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function ve(t){t===0?de(e.CULL_FACE):(ue(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function I(t){t!==k&&(M&&e.lineWidth(t),k=t)}function ye(t,n,r){t?(ue(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n,r=-r),e.polygonOffset(n,r))):de(e.POLYGON_OFFSET_FILL)}function be(t){t?ue(e.SCISSOR_TEST):de(e.SCISSOR_TEST)}function xe(t){t===void 0&&(t=e.TEXTURE0+ee-1),ne!==t&&(e.activeTexture(t),ne=t)}function L(t,n,r){r===void 0&&(r=ne===null?e.TEXTURE0+ee-1:ne);let i=re[r];i===void 0&&(i={type:void 0,texture:void 0},re[r]=i),(i.type!==t||i.texture!==n)&&(ne!==r&&(e.activeTexture(r),ne=r),e.bindTexture(t,n||le[t]),i.type=t,i.texture=n)}function Se(){let t=re[ne];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function R(){try{e.compressedTexImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Ce(){try{e.compressedTexImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function z(){try{e.texSubImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function we(){try{e.texSubImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function B(){try{e.compressedTexSubImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Te(){try{e.compressedTexSubImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Ee(){try{e.texStorage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function V(){try{e.texStorage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function De(){try{e.texImage2D(...arguments)}catch(e){U(`WebGLState:`,e)}}function Oe(){try{e.texImage3D(...arguments)}catch(e){U(`WebGLState:`,e)}}function ke(t){return d[t]===void 0?e.getParameter(t):d[t]}function Ae(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function je(t){oe.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),oe.copy(t))}function Me(t){se.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),se.copy(t))}function Ne(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),e.uniformBlockBinding(n,i,i),r.set(t,i))}function Pe(t,n,r){let i=l.get(n).get(t);c[i]!==r&&(e.bindBufferBase(e.UNIFORM_BUFFER,i,r),c[i]=r)}function Fe(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},ne=null,re={},f={},c={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new q(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,oe.set(0,0,e.canvas.width,e.canvas.height),se.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:ue,disable:de,bindFramebuffer:fe,drawBuffers:pe,useProgram:P,setBlending:ge,setMaterial:_e,setFlipSided:F,setCullFace:ve,setLineWidth:I,setPolygonOffset:ye,setScissorTest:be,activeTexture:xe,bindTexture:L,unbindTexture:Se,compressedTexImage2D:R,compressedTexImage3D:Ce,texImage2D:De,texImage3D:Oe,pixelStorei:Ae,getParameter:ke,updateUBOMapping:Ne,uniformBlockBinding:Pe,texStorage2D:Ee,texStorage3D:V,texSubImage2D:z,texSubImage3D:we,compressedTexSubImage2D:B,compressedTexSubImage3D:Te,scissor:je,viewport:Me,reset:Fe}}function su(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new W,u=new WeakMap,d=new Set,f,p=new WeakMap,m=new Set,h=new FinalizationRegistry(e=>m.delete(e)),g=!1;try{g=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function _(e,t){return g?new OffscreenCanvas(e,t):Jt(`canvas`)}function v(e,t,n){let r=1,i=Pe(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=_(n,a));let o=t?_(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),H(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&H(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function y(e){return e.generateMipmaps}function b(t){e.generateMipmap(t)}function x(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function S(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];H(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||H(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?Bt:Sn.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function C(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,H(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function w(e,t){return y(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function T(e){let t=new WeakRef(e);r.get(e).__ref=t,m.add(t),h.register(e,t,t)}function E(e){let t=r.get(e).__ref;t!==void 0&&(m.delete(t),h.unregister(t))}function D(e){k(e.target)}function O(e){A(e.target)}function k(e){e.removeEventListener(`dispose`,D),E(e),ee(e),e.isVideoTexture&&u.delete(e),e.isHTMLTexture&&d.delete(e)}function A(e){e.removeEventListener(`dispose`,O),E(e),N(e)}function j(){for(let e of m){let t=e.deref();t!==void 0&&(t.isRenderTarget===!0?A(t):k(t))}m.clear(),d.clear()}function ee(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&M(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function M(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function N(t){let n=r.get(t);n.__depthDisposeCallback&&n.__depthDisposeCallback();let i=t.depthTexture;if(i&&i.renderTarget===t&&k(i),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let a=t.textures;for(let t=0,n=a.length;t<n;t++){let n=r.get(a[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(a[t])}r.remove(t)}let te=0;function ne(){te=0}function re(){return te}function ie(e){te=e}function ae(){let e=te;return e>=i.maxTextures&&H(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),te+=1,e}function oe(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.mipmapsAutoUpdate),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function se(t,i){let a=r.get(t);if(t.isVideoTexture&&Me(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)H(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)H(`WebGLRenderer: Texture marked for update but image is incomplete`);else{_e(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function ce(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?_e(a,t,i):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i))}function le(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?_e(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function ue(t,i){let a=r.get(t);t.version>0&&a.__version!==t.version?F(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let de={[xe]:e.REPEAT,[L]:e.CLAMP_TO_EDGE,[Se]:e.MIRRORED_REPEAT},fe={[R]:e.NEAREST,[Ce]:e.NEAREST_MIPMAP_NEAREST,[z]:e.NEAREST_MIPMAP_LINEAR,[we]:e.LINEAR,[B]:e.LINEAR_MIPMAP_NEAREST,[Te]:e.LINEAR_MIPMAP_LINEAR},pe={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function P(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&H(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,de[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,de[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,de[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,fe[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,fe[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,pe[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function me(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,D),T(n));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=oe(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&M(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function he(e,t,n){return Math.floor(Math.floor(e/n)/t)}function ge(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=he(n.start,r.width,4),c=he(t.start,r.width,4);n.start<=i+1&&a===c&&he(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function _e(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=me(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=Sn.getPrimaries(Sn.workingColorSpace),r=o.colorSpace===``?null:Sn.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=v(o.image,!1,i.maxTextureSize);t=Ne(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=S(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);P(c,o);let h,g=o.mipmaps,_=o.isVideoTexture!==!0,x=f.__version===void 0||l===!0,T=u.dataReady,E=w(o,t);if(o.isDepthTexture)m=C(o.format===He,o.type),x&&(_?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(g.length>0){_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else _?(x&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&ge(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){_&&x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,g[0].width,g[0].height,t.depth);for(let i=0,a=g.length;i<a;i++)if(h=g[i],o.format!==1023){if(r!==null){if(_){if(T){if(o.layerUpdates.size>0){let t=ls(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else _?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],o.format===1023?_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):_?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(_){if(x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=ls(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)_?(x&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(x){if(_)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(g.length>0){if(_&&x){let t=Pe(g[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(_){if(x){let r=Pe(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);y(o)&&o.mipmapsAutoUpdate===!0&&b(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function F(t,o,s){if(o.image.length!==6)return;let c=me(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=Sn.getPrimaries(Sn.workingColorSpace),r=o.colorSpace===``?null:Sn.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=v(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=Ne(o,m[e]);let h=m[0],g=a.convert(o.format,o.colorSpace),_=a.convert(o.type),x=S(o.internalFormat,g,_,o.normalized,o.colorSpace),T=o.isVideoTexture!==!0,E=u.__version===void 0||c===!0,D=l.dataReady,O=w(o,h);P(e.TEXTURE_CUBE_MAP,o);let k;if(o.isDepthTexture){if(x=C(o.format===He,o.type),E){if(T)n.texStorage2D(e.TEXTURE_CUBE_MAP,1,x,h.width,h.height);else for(let t=0;t<6;t++)n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,h.width,h.height,0,g,_,null)}}else if(f){T&&E&&n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,h.width,h.height);for(let t=0;t<6;t++){k=m[t].mipmaps;for(let r=0;r<k.length;r++){let i=k[r];o.format===1023?T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,g,_,i.data):g===null?H(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):T?D&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,i.data)}}}else{if(k=o.mipmaps,T&&E){k.length>0&&O++;let t=Pe(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,t.width,t.height)}for(let t=0;t<6;t++)if(p){T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,g,_,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,m[t].width,m[t].height,0,g,_,m[t].data);for(let r=0;r<k.length;r++){let i=k[r].image[t].image;T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,i.width,i.height,0,g,_,i.data)}}else{T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,g,_,m[t]);for(let r=0;r<k.length;r++){let i=k[r];T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,g,_,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,g,_,i.image[t])}}}y(o)&&o.mipmapsAutoUpdate===!0&&b(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function ve(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=S(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),je(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,Ae(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function I(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=C(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;je(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Ae(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Ae(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=S(o.internalFormat,c,l,o.normalized,o.colorSpace);je(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Ae(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,Ae(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function ye(t,i,a){let o=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let c=r.get(i.depthTexture);c.__renderTarget=i;let l=o?i.depthTexture.image[0]:i.depthTexture.image;c.__webglTexture&&l.width===i.width&&l.height===i.height||(l.width=i.width,l.height=i.height,i.depthTexture.needsUpdate=!0),o?ue(i.depthTexture,0):se(i.depthTexture,0);let u=c.__webglTexture,d=Ae(i),f=o?e.TEXTURE_CUBE_MAP_POSITIVE_X+a:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)je(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)je(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function be(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)ye(i.__webglFramebuffer[e],t,e);else t.texture.mipmaps.length>0?ye(i.__webglFramebuffer[0],t,0):ye(i.__webglFramebuffer,t,0)}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),I(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else if(t.texture.mipmaps.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),I(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function Ee(t,n,i){let a=r.get(t);n!==void 0&&ve(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&be(t)}function V(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,O),T(t);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&je(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=S(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=Ae(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),I(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),P(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)ve(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else ve(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);y(i)?b(e.TEXTURE_CUBE_MAP):i.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),P(c,a),ve(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),y(a)&&b(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),P(r,i),i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)ve(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else ve(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);y(i)?b(r):i.mipmaps.length>0&&e.texParameteri(r,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}t.depthBuffer&&be(t)}function De(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(y(a)&&a.mipmapsAutoUpdate===!0){let t=x(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),b(t),n.unbindTexture()}}}let Oe=[];function ke(t){if(t.samples>0){if(je(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer),t.texture.mipmaps.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(Oe.length=0,Oe.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&Oe.push(l),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Oe))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function Ae(e){return Math.min(i.maxSamples,e.samples)}function je(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function Me(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function Ne(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(Sn.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&H(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):U(`WebGLTextures: Unsupported texture color space:`,n)),t}function Pe(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=ae,this.resetTextureUnits=ne,this.getTextureUnits=re,this.setTextureUnits=ie,this.setTexture2D=se,this.setTexture2DArray=ce,this.setTexture3D=le,this.setTextureCube=ue,this.rebindTextures=Ee,this.setupRenderTarget=V,this.updateRenderTargetMipmap=De,this.updateMultisampleRenderTarget=ke,this.setupDepthRenderbuffer=be,this.setupFrameBufferTexture=ve,this.useMultisampledRTT=je,this.dispose=j}function cu(e,t){function n(n,r=``){let i,a=Sn.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var lu=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,uu=`
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

}`,du=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Ia(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new to({vertexShader:lu,fragmentShader:uu,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new J(new Ua(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},fu=class extends nn{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new du,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new W,C=null,w=null,T=new Bo;T.viewport=new Nn;let E=new Bo;E.viewport=new Nn;let D=[T,E],O=new Xo,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new mr,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new mr,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new mr,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ee(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,ee),r.removeEventListener(`inputsourceschange`,M);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,ie.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&H(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&H(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,ee),r.addEventListener(`inputsourceschange`,M),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?He:Ve,a=_.stencil?Fe:Ae);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new Fn(d.textureWidth,d.textureHeight,{format:Be,type:Ee,depthTexture:new Pa(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new Fn(f.framebufferWidth,f.framebufferHeight,{format:Be,type:Ee,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),ie.setContext(r),ie.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function M(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}function N(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;N(O,i);for(let e=0;e<a.length;e++)N(a[e],i);O.projectionMatrix.copy(T.projectionMatrix),O.projectionMatrixInverse.copy(T.projectionMatrixInverse),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),te(e,O,i)};function te(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=on*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let ne=null;function re(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new Bo,o.layers.enable(n),o.viewport=new Nn,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new Ia,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ne&&ne(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let ie=new ds;ie.setAnimationLoop(re),this.setAnimationLoop=function(e){ne=e},this.dispose=function(){}}},pu=new Rn,mu=new K;mu.set(-1,0,0,0,1,0,0,0,1);function hu(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Za(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(pu.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(mu),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.diffuseRoughness>0&&(e.diffuseRoughness.value=t.diffuseRoughness,t.diffuseRoughnessMap&&(e.diffuseRoughnessMap.value=t.diffuseRoughnessMap,n(t.diffuseRoughnessMap,e.diffuseRoughnessMapTransform))),t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessMinimum,e.iridescenceThicknessMaximum.value=t.iridescenceThicknessMaximum,t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function gu(e,t,n,r){let i={},a={};function o(e,t){let n=t.program;r.uniformBlockBinding(e,n,i[e.id])}function s(e,n){let o=i[e.id];o===void 0&&(m(e),o=c(e),i[e.id]=o,e.addEventListener(`dispose`,g));let s=n.program;r.updateUBOMapping(e,s);let u=t.render.frame;a[e.id]!==u&&(l(e),a[e.id]=u)}function c(t){let n=e.createBuffer(),r=t.__size,i=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,n),e.bufferData(e.UNIFORM_BUFFER,r,i),e.bindBuffer(e.UNIFORM_BUFFER,null),n}function l(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)u(t[n],e,n,a);else u(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function u(t,n,r,i){if(f(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=h(i,!0);d(i,t.__data,e),e+=a.storage/Float32Array.BYTES_PER_ELEMENT}}else d(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function d(e,t,n){typeof e==`number`||typeof e==`boolean`?t[n]=e:e.isMatrix3?(t[n]=e.elements[0],t[n+1]=e.elements[1],t[n+2]=e.elements[2],t[n+3]=0,t[n+4]=e.elements[3],t[n+5]=e.elements[4],t[n+6]=e.elements[5],t[n+7]=0,t[n+8]=e.elements[6],t[n+9]=e.elements[7],t[n+10]=e.elements[8],t[n+11]=0):ArrayBuffer.isView(e)?t.set(e.subarray(0,t.length-n),n):e.toArray(t,n)}function f(e,t,n,r){let i=e.value,a=t+`_`+n;if(Array.isArray(i)){r[a]===void 0&&(r[a]=[]);let e=r[a],t=!1;for(let n=0;n<i.length;n++)p(i[n],e,n)===!0&&(t=!0);return t}return p(i,r,a)}function p(e,t,n){if(t[n]===void 0)return t[n]=typeof e==`number`||typeof e==`boolean`?e:ArrayBuffer.isView(e)?e.slice():e.clone(),!0;{let r=t[n];if(typeof e==`number`||typeof e==`boolean`){if(r!==e)return t[n]=e,!0}else if(ArrayBuffer.isView(e))return!0;else if(r.equals(e)===!1)return r.copy(e),!0}return!1}function m(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let i=0,a=r.length;i<a;i++){let a=r[i],o=Array.isArray(a.value)?a.value:[a.value],s=Array.isArray(t[e])||Array.isArray(a.value),c=n;for(let e=0,t=o.length;e<t;e++){let t=o[e],r=h(t,s),i=n%16,a=i%r.boundary,l=i+a;n+=a,l!==0&&16-l<r.storage&&(n+=16-l),e===0&&(c=n),n+=r.storage}a.__data=new(a.type===`int`?Int32Array:a.type===`uint`?Uint32Array:Float32Array)((n-c)/Float32Array.BYTES_PER_ELEMENT),a.__offset=c}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function h(e,t){let n={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(n.boundary=4,n.storage=4):e.isVector2?(n.boundary=8,n.storage=8):e.isVector3||e.isColor?(n.boundary=16,n.storage=12):e.isVector4?(n.boundary=16,n.storage=16):e.isMatrix3?(n.boundary=16,n.storage=48):e.isMatrix4?(n.boundary=16,n.storage=64):e.isTexture?H(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(n.boundary=16,n.storage=e.byteLength):H(`WebGLRenderer: Unsupported uniform value type.`,e),t===!0&&(n.boundary=16,n.storage=Math.ceil(n.storage/16)*16),n}function g(t){let n=t.target;n.removeEventListener(`dispose`,g),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function _(){for(let t in i)e.deleteBuffer(i[t]);i={},a={}}return{bind:o,update:s,dispose:_}}var _u=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),vu=null;function yu(){return vu===null&&(vu=new oa(_u,16,16,Ge,Me),vu.name=`DFG_LUT`,vu.minFilter=we,vu.magFilter=we,vu.wrapS=L,vu.wrapT=L,vu.generateMipmaps=!1,vu.needsUpdate=!0),vu}var bu=class{constructor(e={}){let{canvas:t=Yt(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Ee}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([qe,Ke,We]),g=new Set([Ee,Ae,Oe,Fe,Ne,Pe]),_=new Uint32Array(4),v=new Int32Array(4),y={textures:[],min:[],max:[],resolution:[]},b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=Rt;let j=0,ee=0,M=null,N=-1,te=null,ne=new Nn,re=new Nn,ie=null,ae=new q(0),oe=0,se=t.width,ce=t.height,le=1,ue=null,de=null,fe=new Nn(0,0,se,ce),pe=new Nn(0,0,se,ce),P=!1,me=new ya,he=new xa,ge=!1,_e=!1,F=new Rn,ve=new G,I=new Nn,ye={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},be=!1;function xe(){return M===null?le:1}let L=n;function Se(e,n){return t.getContext(e,n)}let R,Ce,z,we,B,V,De,ke,je,Ie,Le,Re,ze,Be,Ve,He,Ue,Ge,Je,Ye,Xe,Ze,Qe;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r187`),t.addEventListener(`webglcontextlost`,tt,!1),t.addEventListener(`webglcontextrestored`,nt,!1),t.addEventListener(`webglcontextcreationerror`,rt,!1),L===null){let t=`webgl2`;if(L=Se(t,e),L===null)throw Se(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}$e()}catch(e){throw t.removeEventListener(`webglcontextlost`,tt,!1),t.removeEventListener(`webglcontextrestored`,nt,!1),t.removeEventListener(`webglcontextcreationerror`,rt,!1),U(`WebGLRenderer: `+e.message),e}function $e(){R=new Bs(L),R.init(),Xe=new cu(L,R),Ce=new bs(L,R,e,Xe),z=new ou(L,R),Ce.reversedDepthBuffer&&d&&z.buffers.depth.setReversed(!0),O=L.createFramebuffer(),k=L.createFramebuffer(),A=L.createFramebuffer(),we=new Us(L),B=new Bl,V=new su(L,R,z,B,Ce,Xe,we),De=new zs(T),ke=new fs(L),Ze=new vs(L,ke),je=new Vs(L,ke,we,Ze),Ie=new Gs(L,je,ke,Ze,we),Ge=new Ws(L,Ce,V),Ve=new xs(B),Le=new zl(T,De,R,Ce,Ze,Ve),Re=new hu(T,B),ze=new Wl,Be=new Zl(R),Ue=new _s(T,De,z,Ie,p,s),He=new au(T,Ie,Ce),Qe=new gu(L,we,Ce,z),Je=new ys(L,R,we),Ye=new Hs(L,R,we),we.programs=Le.programs,T.capabilities=Ce,T.extensions=R,T.properties=B,T.renderLists=ze,T.shadowMap=He,T.state=z,T.info=we}m!==1009&&(w=new qs(m,t.width,t.height,o,r,i));let et=new fu(T,L);this.xr=et,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){let e=R.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=R.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return le},this.setPixelRatio=function(e){e!==void 0&&(le=e,this.setSize(se,ce,!1))},this.getSize=function(e){return e.set(se,ce)},this.setSize=function(e,n,r=!0){et.isPresenting?H(`WebGLRenderer: Can't change size while VR device is presenting.`):(se=e,ce=n,t.width=Math.floor(e*le),t.height=Math.floor(n*le),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(se*le,ce*le).floor()},this.setDrawingBufferSize=function(e,n,r){se=e,ce=n,le=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009)U(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){H(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(ne)},this.getViewport=function(e){return e.copy(fe)},this.setViewport=function(e,t,n,r){e.isVector4?fe.set(e.x,e.y,e.z,e.w):fe.set(e,t,n,r),z.viewport(ne.copy(fe).multiplyScalar(xe()).round())},this.getScissor=function(e){return e.copy(pe)},this.setScissor=function(e,t,n,r){e.isVector4?pe.set(e.x,e.y,e.z,e.w):pe.set(e,t,n,r),z.scissor(re.copy(pe).multiplyScalar(xe()).round())},this.getScissorTest=function(){return P},this.setScissorTest=function(e){z.setScissorTest(P=e)},this.setOpaqueSort=function(e){ue=e},this.setTransparentSort=function(e){de=e},this.getClearColor=function(e){return e.copy(Ue.getClearColor())},this.setClearColor=function(){Ue.setClearColor(...arguments)},this.getClearAlpha=function(){return Ue.getClearAlpha()},this.setClearAlpha=function(){Ue.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(M!==null){let t=M.texture.format;e=h.has(t)}if(e){let e=M.texture.type,t=g.has(e),n=Ue.getClearColor(),r=Ue.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,L.clearBufferuiv(L.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,L.clearBufferiv(L.COLOR,0,v))}else r|=L.COLOR_BUFFER_BIT}t&&(r|=L.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&L.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,tt,!1),t.removeEventListener(`webglcontextrestored`,nt,!1),t.removeEventListener(`webglcontextcreationerror`,rt,!1),Ue.dispose(),ze.dispose(),Be.dispose(),V.dispose(),B.dispose(),De.dispose(),Ie.dispose(),je.dispose(),Ze.dispose(),Qe.dispose(),Le.dispose(),et.dispose(),et.removeEventListener(`sessionstart`,ut),et.removeEventListener(`sessionend`,dt),ft.stop()};function tt(e){e.preventDefault(),Zt(`WebGLRenderer: Context Lost.`),E=!0}function nt(){Zt(`WebGLRenderer: Context Restored.`),E=!1;let e=we.autoReset,t=He.enabled,n=He.autoUpdate,r=He.needsUpdate,i=He.type;$e(),we.autoReset=e,He.enabled=t,He.autoUpdate=n,He.needsUpdate=r,He.type=i}function rt(e){U(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function it(e){let t=e.target;t.removeEventListener(`dispose`,it),at(t)}function at(e){ot(e),B.remove(e)}function ot(e){let t=B.get(e).programs;t!==void 0&&(t.forEach(function(e){Le.releaseProgram(e)}),e.isShaderMaterial&&Le.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=ye);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=Ct(e,t,n,r,i);z.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=je.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Ze.setup(i,r,s,n,c);let h,g=Je;if(c!==null&&(h=ke.get(c),g=Ye,g.setIndex(h)),i.isMesh)r.wireframe===!0?(z.setLineWidth(r.wireframeLinewidth*xe()),g.setMode(L.LINES)):g.setMode(L.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),z.setLineWidth(e*xe()),i.isLineSegments?g.setMode(L.LINES):i.isLineLoop?g.setMode(L.LINE_LOOP):g.setMode(L.LINE_STRIP)}else i.isPoints?g.setMode(L.POINTS):i.isSprite&&g.setMode(L.TRIANGLES);if(i.isBatchedMesh){if(R.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?ke.get(c).bytesPerElement:1,o=B.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(L,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function st(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),ge===!0&&Ve.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,yt(e,t,r),e.side=0,e.needsUpdate=!0,yt(e,t,r),e.side=2):yt(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=Be.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),_e=this.localClippingEnabled,ge=Ve.init(this.clippingPlanes,_e),ge===!0&&Ve.setGlobalState(this.clippingPlanes,t),D!==null&&He.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];st(o,n,t,e),r.add(o)}else st(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=B.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}R.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let ct=null;function lt(e){ct&&ct(e)}function ut(){ft.stop()}function dt(){ft.start()}let ft=new ds;ft.setAnimationLoop(lt),typeof self<`u`&&ft.setContext(self),this.setAnimationLoop=function(e){ct=e,et.setAnimationLoop(e),e===null?ft.stop():ft.start()},et.addEventListener(`sessionstart`,ut),et.addEventListener(`sessionend`,dt),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){U(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=et.enabled===!0&&et.isPresenting===!0,r=w!==null&&(M===null||n)&&w.begin(T,M);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),et.enabled===!0&&et.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(et.cameraAutoUpdate===!0&&et.updateCamera(t),t=et.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,M),x=Be.get(e,C.length),x.init(t),x.state.textureUnits=V.getTextureUnits(),C.push(x),F.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),t.isArrayCamera?he.setFromArrayCamera(t):me.setFromProjectionMatrix(F,Gt,t.reversedDepth),_e=this.localClippingEnabled,ge=Ve.init(this.clippingPlanes,_e),b=ze.get(e,S.length),b.init(),S.push(b),this.info.render.frame++,et.enabled===!0&&et.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&pt(e,t,-1/0,T.sortObjects)}pt(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(ue,de),be=et.enabled===!1||et.isPresenting===!1||et.hasDepthSensing()===!1,be&&Ue.addToRenderList(b,e),this.info.autoReset===!0&&this.info.reset(),ge===!0&&Ve.beginShadows();let i=x.state.shadowsArray;if(He.render(i,e,t),ge===!0&&Ve.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];ht(n,r,e,a)}be&&Ue.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];mt(b,e,n,n.viewport)}}else r.length>0&&ht(n,r,e,t),be&&Ue.render(e),mt(b,e,t)}M!==null&&ee===0&&(V.updateMultisampleRenderTarget(M),V.updateRenderTargetMipmap(M)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),Ze.resetDefaultState(),N=-1,te=null,C.pop(),C.length>0?(x=C[C.length-1],V.setTextureUnits(x.state.textureUnits),ge===!0&&Ve.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function pt(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){let i=t.isArrayCamera?he:me;if(!e.frustumCulled||e.intersectsFrustum(i)){r&&I.setFromMatrixPosition(e.matrixWorld).applyMatrix4(F);let i=Ie.update(e),a=e.material;a.visible&&b.push(e,i,a,n,I.z,null,t)}}else if(e.isMesh||e.isLine||e.isPoints){let i=t.isArrayCamera?he:me;if(!e.frustumCulled||e.intersectsFrustum(i)){let i=Ie.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),I.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),I.copy(e.boundingSphere.center)),I.applyMatrix4(e.matrixWorld).applyMatrix4(F)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,I.z,s,t)}}else a.visible&&b.push(e,i,a,n,I.z,null,t)}}}let i=e.children;for(let e=0,a=i.length;e<a;e++)pt(i[e],t,n,r)}function mt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),ge===!0&&Ve.setGlobalState(T.clippingPlanes,n),r&&z.viewport(ne.copy(r)),i.length>0&&gt(i,t,n),a.length>0&&gt(a,t,n),o.length>0&&gt(o,t,n),z.buffers.depth.setTest(!0),z.buffers.depth.setMask(!0),z.buffers.color.setMask(!0),z.setPolygonOffset(!1)}function ht(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=R.has(`EXT_color_buffer_half_float`)||R.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new Fn(1,1,{generateMipmaps:!0,type:e?Me:Ee,minFilter:Te,samples:Math.max(4,Ce.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Sn.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||ne;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(ae),oe=T.getClearAlpha(),oe<1&&T.setClearColor(16777215,.5),T.clear(),be&&Ue.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),ge===!0&&Ve.setGlobalState(T.clippingPlanes,r),gt(e,n,r),V.updateMultisampleRenderTarget(a),V.updateRenderTargetMipmap(a),R.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,_t(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(V.updateMultisampleRenderTarget(a),V.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(ae,oe),d!==void 0&&(r.viewport=d),T.toneMapping=u}function gt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&_t(o,t,n,s,l,c)}}function _t(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function vt(e){let t=0;for(let n of e)n.texture!==null&&t++;return t}function yt(e,t,n){t.isScene!==!0&&(t=ye);let r=B.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=Le.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=Le.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=De.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,it),l=new Map,r.programs=l,r.programVariants=new Map);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return St(e,s),d}else s.uniforms=Le.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=Le.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=Ve.uniform),St(e,s),r.needsLights=Tt(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.numLightProbeGrids=vt(x.state.lightProbeGridArray),r.currentProgram=d,r.uniformsList=null,d}function bt(e,t,n,r,i){let a=B.get(e),o=a.currentProgram.id+`,`+r+`,`+i,s=a.programVariants.get(o);return s===void 0?(s=yt(e,t,n),a.programVariants.set(o,s)):(a.currentProgram=s,a.uniformsList=null,a.outputColorSpace=r,a.toneMapping=i),s}function xt(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=nl.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function St(e,t){let n=B.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function Ct(e,t,n,r,i){t.isScene!==!0&&(t=ye),V.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=M===null?T.outputColorSpace:M.isXRRenderTarget===!0?M.texture.colorSpace:Sn.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=De.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(M===null||M.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=B.get(r),b=x.state.lights;if(ge===!0&&(_e===!0||e!==te)){let t=e===te&&r.id===N;Ve.setState(r,e,t)}let S=!1,C=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==b.state.version||i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?S=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==Ve.numPlanes||v.numIntersection!==Ve.numIntersection)?S=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.morphTargetsCount===_&&v.numLightProbeGrids===vt(x.state.lightProbeGridArray)?(v.outputColorSpace!==s||v.toneMapping!==h)&&(C=!0):S=!0:S=!0:(S=!0,v.__version=r.version);let w=v.currentProgram;(S===!0||C===!0)&&(w=C===!0?bt(r,t,i,s,h):yt(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,w,v));let E=!1,O=!1,k=!1,A=w.getUniforms(),j=v.uniforms;if(z.useProgram(w.program)&&(E=!0,O=!0,k=!0),r.id!==N&&(N=r.id,O=!0),E||te!==e){z.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),A.setValue(L,`projectionMatrix`,e.projectionMatrix),A.setValue(L,`viewMatrix`,e.matrixWorldInverse);let t=A.map.cameraPosition;t!==void 0&&t.setValue(L,ve.setFromMatrixPosition(e.matrixWorld)),Ce.logarithmicDepthBuffer&&A.setValue(L,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&A.setValue(L,`isOrthographic`,e.isOrthographicCamera===!0),te!==e&&(te=e,O=!0,k=!0)}if(v.needsLights&&(b.state.sunShadowMap.length>0&&A.setValue(L,`sunShadowMap`,b.state.sunShadowMap,V),b.state.directionalShadowMap.length>0&&A.setValue(L,`directionalShadowMap`,b.state.directionalShadowMap,V),b.state.spotShadowMap.length>0&&A.setValue(L,`spotShadowMap`,b.state.spotShadowMap,V),b.state.pointShadowMap.length>0&&A.setValue(L,`pointShadowMap`,b.state.pointShadowMap,V)),i.isSkinnedMesh){A.setOptional(L,i,`bindMatrix`),A.setOptional(L,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),A.setValue(L,`boneTexture`,e.boneTexture,V))}i.isBatchedMesh&&(A.setOptional(L,i,`batchingTexture`),A.setValue(L,`batchingTexture`,i._matricesTexture,V),A.setOptional(L,i,`batchingIdTexture`),A.setValue(L,`batchingIdTexture`,i._indirectTexture,V),A.setOptional(L,i,`batchingColorTexture`),i._colorsTexture!==null&&A.setValue(L,`batchingColorTexture`,i._colorsTexture,V));let ee=n.morphAttributes;if((ee.position!==void 0||ee.normal!==void 0||ee.color!==void 0)&&Ge.update(i,n,w),(O||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,A.setValue(L,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(j.envMapIntensity.value=t.environmentIntensity),j.dfgLUT!==void 0&&(j.dfgLUT.value=yu()),O){if(A.setValue(L,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&wt(j,k),a&&r.fog===!0&&Re.refreshFogUniforms(j,a),Re.refreshMaterialUniforms(j,r,le,ce,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.numLightProbeGrids>0){let e=y,t=0;for(let n of x.state.lightProbeGridArray)n.texture!==null&&(e.textures[t]=n.texture,e.min[t]=n.boundingBox.min,e.max[t]=n.boundingBox.max,e.resolution[t]=n.resolution,t++);for(let n in e)e[n].length=t;j.probesSH.value=e.textures,j.probesMin.value=e.min,j.probesMax.value=e.max,j.probesResolution.value=e.resolution}nl.upload(L,xt(v),j,V)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(nl.upload(L,xt(v),j,V),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&A.setValue(L,`center`,i.center),A.setValue(L,`modelViewMatrix`,i.modelViewMatrix),A.setValue(L,`normalMatrix`,i.normalMatrix),A.setValue(L,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];Qe.update(n,w),Qe.bind(n,w)}}return w}function wt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function Tt(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return ee},this.getRenderTarget=function(){return M},this.setRenderTargetTextures=function(e,t,n){let r=B.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),B.get(e.texture).__webglTexture=t,B.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=B.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){M=e,j=t,ee=n;let r=null,i=!1,a=!1;if(e){let o=B.get(e);if(o.__useDefaultFramebuffer!==void 0){z.bindFramebuffer(L.FRAMEBUFFER,o.__webglFramebuffer),ne.copy(e.viewport),re.copy(e.scissor),ie=e.scissorTest,z.viewport(ne),z.scissor(re),z.setScissorTest(ie),N=-1;return}if(o.__webglFramebuffer===void 0)V.setupRenderTarget(e);else if(o.__hasExternalTextures)V.rebindTextures(e,B.get(e.texture).__webglTexture,B.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&B.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);V.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=B.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&V.useMultisampledRTT(e)===!1?B.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,ne.copy(e.viewport),re.copy(e.scissor),ie=e.scissorTest}else ne.copy(fe).multiplyScalar(le).floor(),re.copy(pe).multiplyScalar(le).floor(),ie=P;if(n!==0&&(r=O),z.bindFramebuffer(L.FRAMEBUFFER,r)&&z.drawBuffers(e,r),z.viewport(ne),z.scissor(re),z.setScissorTest(ie),i){let r=B.get(e.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=B.get(e.textures[t]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=B.get(e.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,t.__webglTexture,n)}N=-1};function Et(e){let t=B.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=Ce.textureFormatReadable(e.format),t.__typeReadable=Ce.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=B.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){z.bindFramebuffer(L.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+s);let u=Et(o);if(u.__formatReadable===!1){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){U(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&L.readPixels(t,n,r,i,Xe.convert(c),Xe.convert(l),a)}finally{let e=M===null?null:B.get(M).__webglFramebuffer;z.bindFramebuffer(L.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=B.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){z.bindFramebuffer(L.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+s);let d=Et(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,f),L.bufferData(L.PIXEL_PACK_BUFFER,a.byteLength,L.STREAM_READ),L.readPixels(t,n,r,i,Xe.convert(l),Xe.convert(u),0),L.bindBuffer(L.PIXEL_PACK_BUFFER,null);let p=M===null?null:B.get(M).__webglFramebuffer;z.bindFramebuffer(L.FRAMEBUFFER,p);let m=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await en(L,m,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,f),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,a),L.bindBuffer(L.PIXEL_PACK_BUFFER,null),L.deleteBuffer(f),L.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;V.setTexture2D(e,0),L.copyTexSubImage2D(L.TEXTURE_2D,n,0,0,o,s,i,a),z.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Xe.convert(t.format),_=Xe.convert(t.type),v;t.isData3DTexture?(V.setTexture3D(t,0),v=L.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(V.setTexture2DArray(t,0),v=L.TEXTURE_2D_ARRAY):(V.setTexture2D(t,0),v=L.TEXTURE_2D),z.activeTexture(L.TEXTURE0),z.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,t.flipY),z.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),z.pixelStorei(L.UNPACK_ALIGNMENT,t.unpackAlignment);let y=z.getParameter(L.UNPACK_ROW_LENGTH),b=z.getParameter(L.UNPACK_IMAGE_HEIGHT),x=z.getParameter(L.UNPACK_SKIP_PIXELS),S=z.getParameter(L.UNPACK_SKIP_ROWS),C=z.getParameter(L.UNPACK_SKIP_IMAGES);z.pixelStorei(L.UNPACK_ROW_LENGTH,h.width),z.pixelStorei(L.UNPACK_IMAGE_HEIGHT,h.height),z.pixelStorei(L.UNPACK_SKIP_PIXELS,l),z.pixelStorei(L.UNPACK_SKIP_ROWS,u),z.pixelStorei(L.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=B.get(e),r=B.get(t),h=B.get(n.__renderTarget),g=B.get(r.__renderTarget);z.bindFramebuffer(L.READ_FRAMEBUFFER,h.__webglFramebuffer),z.bindFramebuffer(L.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,B.get(e).__webglTexture,i,d+n),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,B.get(t).__webglTexture,a,m+n)),L.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,L.DEPTH_BUFFER_BIT,L.NEAREST);z.bindFramebuffer(L.READ_FRAMEBUFFER,null),z.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||B.has(e)){let n=B.get(e),r=B.get(t);z.bindFramebuffer(L.READ_FRAMEBUFFER,k),z.bindFramebuffer(L.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,n.__webglTexture,i),T?L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,r.__webglTexture,a),i===0?T?L.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):L.copyTexSubImage2D(v,a,f,p,l,u,o,s):L.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,L.COLOR_BUFFER_BIT,L.NEAREST);z.bindFramebuffer(L.READ_FRAMEBUFFER,null),z.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?L.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?L.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):L.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):L.texSubImage2D(L.TEXTURE_2D,a,f,p,o,s,g,_,h);z.pixelStorei(L.UNPACK_ROW_LENGTH,y),z.pixelStorei(L.UNPACK_IMAGE_HEIGHT,b),z.pixelStorei(L.UNPACK_SKIP_PIXELS,x),z.pixelStorei(L.UNPACK_SKIP_ROWS,S),z.pixelStorei(L.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps===!0&&t.mipmapsAutoUpdate===!0&&L.generateMipmap(v),z.unbindTexture()},this.initRenderTarget=function(e){B.get(e).__webglFramebuffer===void 0&&V.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?V.setTextureCube(e,0):e.isData3DTexture?V.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?V.setTexture2DArray(e,0):V.setTexture2D(e,0),z.unbindTexture()},this.resetState=function(){j=0,ee=0,M=null,z.reset(),Ze.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return Gt}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=Sn._getDrawingBufferColorSpace(e),t.unpackColorSpace=Sn._getUnpackColorSpace()}};function xu(e,t=!1){let n=e[0].index!==null,r=new Set(Object.keys(e[0].attributes)),i=new Set(Object.keys(e[0].morphAttributes)),a={},o={},s=e[0].morphTargetsRelative,c=new mi;c.morphTargetsRelative=s;let l=0;for(let u=0;u<e.length;++u){let d=e[u],f=0,p=0;if(n!==(d.index!==null))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.`),null;for(let e in d.attributes){if(!r.has(e))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have compatible attributes; make sure "`+e+`" attribute exists among all geometries, or in none of them.`),null;a[e]===void 0&&(a[e]=[]),a[e].push(d.attributes[e]),f++}if(f!==r.size)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. Make sure all geometries have the same number of attributes.`),null;if(s!==d.morphTargetsRelative)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. .morphTargetsRelative must be consistent throughout all geometries.`),null;for(let t in d.morphAttributes){if(!i.has(t))return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`.  .morphAttributes must be consistent throughout all geometries.`),null;if(d.morphAttributes[t].length!==e[0].morphAttributes[t].length)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. All geometries must have the same number of morph targets for the "`+t+`" morph attribute.`),null;o[t]===void 0&&(o[t]=[]),o[t].push(d.morphAttributes[t]),p++}if(p!==i.size)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. Make sure all geometries have the same number of morph attributes.`),null;if(t){let e;if(n)e=d.index.count;else if(d.attributes.position!==void 0)e=d.attributes.position.count;else return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index `+u+`. The geometry must have either an index or a position attribute`),null;c.addGroup(l,e,u),l+=e}}if(n){let t=0,n=[];for(let r=0;r<e.length;++r){let i=e[r].index;for(let e=0;e<i.count;++e)n.push(i.getX(e)+t);t+=e[r].attributes.position.count}c.setIndex(n)}for(let e in a){let t=Su(a[e]);if(!t)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` attribute.`),null;c.setAttribute(e,t)}for(let e in o){let t=o[e][0].length;if(t!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[e]=[];for(let n=0;n<t;++n){let t=[];for(let r=0;r<o[e].length;++r)t.push(o[e][r][n]);let r=Su(t);if(!r)return console.error(`THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the `+e+` morphAttribute.`),null;c.morphAttributes[e].push(r)}}}return c}function Su(e){let t,n,r,i=-1,a=0;for(let o=0;o<e.length;++o){let s=e[o];if(t===void 0&&(t=s.array.constructor),t!==s.array.constructor)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.`),null;if(n===void 0&&(n=s.itemSize),n!==s.itemSize)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.`),null;if(r===void 0&&(r=s.normalized),r!==s.normalized)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.`),null;if(i===-1&&(i=s.gpuType),i!==s.gpuType)return console.error(`THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.`),null;a+=s.count*n}let o=new t(a),s=new $r(o,n,r),c=0;for(let t=0;t<e.length;++t){let r=e[t];if(r.isInterleavedBufferAttribute){let e=c/n;for(let t=0,i=r.count;t<i;t++)for(let i=0;i<n;i++){let n=r.getComponent(t,i);s.setComponent(t+e,i,n)}}else o.set(r.array,c);c+=r.count*n}return i!==void 0&&(s.gpuType=i),s}var Cu=2896440,wu=1777444,Tu=7108225,Eu={vela:5103871,rook:16757322,needle:11562239,kite:15915082,vectora:16735603,aster:3724981,krait:16747068,lumen:16727974,longglass:7317759,sable:8116586,rampart:13208154,atlas:10728266,tool:16727974},Du=new Map;function Ou(e,t=.6,n=.35){let r=e*100+Math.round(t*10)+Math.round(n*3),i=Du.get(r);return i||(i=new ro({color:e,roughness:t,metalness:n}),Du.set(r,i)),i}var ku=new Map;function Au(e){let t=ku.get(e);return t||(t=new Ki({color:e}),ku.set(e,t)),t}function Z(e,t,n,r,i,a=0,o=0,s=0,c=0){let l=new J(new La(t,n,r),i);return l.position.set(a,o,s),l.rotation.x=c,l.castShadow=!1,e.add(l),l}function ju(e,t,n,r,i=0,a=0,o=0){let s=new J(new za(t,t,n,12),r);return s.rotation.x=Math.PI/2,s.position.set(i,a,o),e.add(s),s}var Mu=new ro({vertexColors:!0,roughness:.7,metalness:.2});function Nu(e,t=[],n=!1){let r=[],i=[];for(let n of e.children){if(!(n instanceof J)||t.includes(n))continue;let e=n.material;n.updateMatrix();let a=n.geometry.clone().applyMatrix4(n.matrix),o=a.attributes.position.count,s=new Float32Array(o*3);for(let t=0;t<o;t++)s[t*3]=e.color.r,s[t*3+1]=e.color.g,s[t*3+2]=e.color.b;a.setAttribute(`color`,new $r(s,3)),r.push(a),i.push(n)}if(!r.length)return;for(let t of i)e.remove(t);let a=xu(r,!1);if(!a)return;let o=new J(a,Mu);o.castShadow=n,e.add(o)}function Pu(e){let t=new fr,n=Ou(Cu),r=Ou(wu,.8,.1),i=Ou(Tu,.4,.7),a=Au(Eu[e]),o=new dr,s,c=new G(0,-.02,-.25),l=new G(0,-.04,.02),u,d=I[e];switch(d.cls){case`pistol`:{let u=new fr;t.add(u),s=u,Z(u,.034,.042,.2,n,0,.03,-.08),Z(u,.036,.006,.14,a,0,.054,-.07),Z(t,.03,.07,.19,r,0,-0,-.08),Z(t,.03,.1,.045,r,0,-.07,.01,-.2),Z(t,.02,.03,.05,i,0,-.03,-.1),e===`rook`&&(ju(t,.016,.09,i,0,.012,-.2),Z(t,.04,.055,.16,n,0,.03,-.1)),e===`needle`&&Z(t,.028,.1,.035,r,0,-.085,-.04),o.position.set(0,.035,e===`rook`?-.255:-.185),c=new G(0,-.06,0),l=new G(0,-.07,.01);break}case`smg`:Z(t,.05,.075,.3,n,0,0,-.1),Z(t,.052,.012,.22,a,0,.044,-.1),Z(t,.03,.12,.05,r,0,-.1,-.12,.12),Z(t,.035,.1,.05,r,0,-.07,.02,-.25),Z(t,.045,.06,.12,r,0,0,.14),ju(t,.012,.18,i,0,.01,-.34),Z(t,.03,.04,.12,r,0,-.045,-.22),o.position.set(0,.01,-.44),c=new G(0,-.07,-.22),l=new G(0,-.08,.03);break;case`rifle`:{let s=e===`lumen`;Z(t,.055,.085,s?.46:.5,n,0,0,s?-.08:-.15),Z(t,.058,.014,s?.3:.32,a,0,.05,-.15),s||Z(t,.05,.055,.28,r,0,-.005,-.5),ju(t,.011,s?.14:.3,i,0,.012,s?-.4:-.76),Z(t,.045,.1,.22,r,0,-.01,.2),Z(t,.035,.14,.06,r,0,-.1,-.1,e===`krait`?.12:.28),Z(t,.035,.1,.05,r,0,-.08,.03,-.25),Z(t,.03,.03,.12,i,0,.068,-.12),e===`krait`&&Z(t,.06,.04,.12,n,0,.1,-.28),o.position.set(0,.012,s?-.5:-.95),c=new G(0,-.05,s?-.2:-.5),l=new G(0,-.08,.03);break}case`sniper`:case`dmr`:{let e=d.cls===`sniper`;Z(t,.05,.08,.6,n,0,0,-.2),ju(t,.012,e?.62:.42,i,0,.01,e?-.85:-.78),Z(t,.045,.1,.26,r,0,-.01,.22),Z(t,.035,.1,.05,r,0,-.08,.04,-.25),Z(t,.034,.1,.06,r,0,-.09,-.12),ju(t,.032,.3,r,0,.095,-.2),ju(t,.038,.06,i,0,.095,-.34),ju(t,.038,.06,i,0,.095,-.06);let f=new J(new Ra(.03,14),Au(7327999));f.position.set(0,.095,-.355),t.add(f),u=f;let p=new fr;t.add(p),s=p,Z(p,.012,.012,.07,i,.045,.03,-.05),ju(p,.012,.025,a,.07,.03,-.05),o.position.set(0,.01,e?-1.18:-1),c=new G(0,-.06,-.46),l=new G(0,-.08,.04);break}case`shotgun`:{Z(t,.05,.08,.3,n,0,0,-.05),ju(t,.02,.7,i,0,.02,-.55),ju(t,.016,.6,n,0,-.03,-.5);let e=new fr;t.add(e),s=e,Z(e,.06,.05,.16,r,0,-.03,-.45),Z(e,.062,.01,.1,a,0,-.005,-.45),Z(t,.045,.1,.24,r,0,-.01,.2,.06),Z(t,.035,.1,.05,r,0,-.08,.03,-.25),o.position.set(0,.02,-.9),c=new G(0,-.06,-.45),l=new G(0,-.08,.03);break}case`lmg`:Z(t,.07,.1,.5,n,0,0,-.15),Z(t,.072,.014,.34,a,0,.06,-.15),ju(t,.016,.45,i,0,.02,-.72),Z(t,.05,.05,.24,r,0,0,-.55),Z(t,.14,.12,.14,r,0,-.1,-.08),Z(t,.05,.1,.26,r,0,-.01,.24),Z(t,.035,.1,.05,r,0,-.09,.04,-.25),Z(t,.01,.12,.01,i,.04,-.09,-.6,.4),Z(t,.01,.12,.01,i,-.04,-.09,-.6,.4),o.position.set(0,.02,-.96),c=new G(0,-.06,-.48),l=new G(0,-.08,.03);break;default:{Z(t,.035,.035,.16,r,0,0,0),Z(t,.04,.012,.05,a,0,0,-.09);let e=Z(t,.012,.07,.24,i,0,.02,-.22);e.rotation.x=.1,Z(t,.004,.012,.2,a,0,.056,-.22),o.position.set(0,0,-.4),c=new G(0,-.05,0),l=new G(0,-.02,.04)}}return t.add(o),s&&Nu(s),Nu(t,u?[u]:[]),{group:t,muzzle:o,mover:s,supportHand:c,gripHand:l,scopeLens:u}}var Fu={default:{cus:3137791,int:16754470},deuteranopia:{cus:4033535,int:16765503},protanopia:{cus:5088255,int:16769354},mono:{cus:16777215,int:16765503}};function Iu(e,t){let n=new fr,r=new fr;n.add(r);let i=e===`cus`?t.cus:t.int,a=Ou(e===`cus`?12898524:9072466,.75,.1),o=Ou(e===`cus`?6122364:4536107,.8,.1),s=Ou(2763824,.6,.2),c=new Ki({color:i}),l=[c],u=(e,t,n,r,i,a,o,s)=>{let c=new J(new La(t,n,r),i);return c.position.set(a,o,s),c.castShadow=!0,e.add(c),c},d=new fr;d.position.set(-.12,.9,0),r.add(d);let f=new fr;f.position.set(.12,.9,0),r.add(f);for(let e of[d,f])u(e,.17,.46,.2,a,0,-.23,0),u(e,.15,.4,.17,o,0,-.65,.01),u(e,.17,.08,.28,Ou(1448221),0,-.86,-.04),u(e,.19,.06,.22,l[0],0,-.46,0);let p=new fr;p.position.y=.9,r.add(p),u(p,.46,.52,.27,a,0,.3,0),u(p,.4,.14,.24,o,0,.02,0),u(p,.2,.2,.01,c,0,.38,-.14),u(p,.4,.05,.2,c,0,.58,0),e===`cus`?(u(p,.62,.12,.3,o,0,.5,0),u(p,.3,.34,.12,o,0,.32,.2)):(u(p,.5,.1,.28,o,0,.52,0),u(p,.4,.46,.22,o,0,.32,.24),u(p,.34,.06,.2,c,0,.58,.24));let m=new fr;if(m.position.set(0,1.5,0),r.add(m),u(m,.2,.22,.22,s,0,0,0),e===`cus`){let e=new J(new Ga(.17,14,10),Ou(15856888,.5,.2));e.scale.set(1,.95,1.1),e.position.set(0,.05,.01),e.castShadow=!0,m.add(e),u(m,.2,.06,.05,c,0,.02,-.17)}else u(m,.26,.2,.28,Ou(3878695,.7,.2),0,.07,.01),u(m,.28,.05,.3,c,0,.18,.01),u(m,.2,.06,.05,c,0,0,-.15);let h=new fr;h.position.set(.3,1.38,0),r.add(h);let g=new fr;g.position.set(-.3,1.38,0),r.add(g);for(let e of[h,g])u(e,.12,.32,.13,a,0,-.16,0),u(e,.11,.3,.12,o,0,-.45,0),u(e,.1,.1,.1,Ou(1316634),0,-.64,0);let _=new fr;_.position.set(0,-.6,-.02),_.rotation.x=-Math.PI/2,h.add(_);let v=new J(new Ua(.5,.5),new Ki({color:16777215,transparent:!0,opacity:0,depthWrite:!1,blending:2}));v.visible=!1,r.add(v);for(let e of[d,f,p,m,h,g])Nu(e,[_],!0);return{root:n,body:r,legL:d,legR:f,armR:h,armL:g,head:m,weaponSlot:_,accentMats:l,weaponId:null,weaponModel:null,phase:0,deadT:0,glint:v,paletteKey:i}}function Lu(e,t){if(e.weaponId===t)return;if(e.weaponId=t,e.weaponModel&&e.weaponSlot.remove(e.weaponModel.group),t===`util`){e.weaponModel=null;return}let n=Pu(t);e.weaponSlot.add(n.group),n.group.traverse(e=>{e.castShadow=!1}),e.weaponModel=n}function Ru(e,t){return e===`cus`?t.cus:t.int}function zu(e){let t=new fr,n={veil:10466248,flash:16773552,thermite:16747068,pulse:5103871,frag:16735603},r=new J(e===`veil`?new za(.05,.05,.16,12):e===`pulse`?new Ha(.08):new Ga(.075,12,10),Ou(3357250,.5,.5));t.add(r);let i=new J(new Ka(.06,.012,6,14),Au(n[e]));return i.rotation.x=Math.PI/2,t.add(i),t}function Bu(){let e=new fr,t=new J(new La(.34,.12,.26),Ou(2106667,.5,.5));t.position.y=.06,e.add(t);let n=new J(new za(.07,.07,.14,12),Au(16727974));n.position.y=.16,e.add(n);let r=new J(new La(.28,.02,.2),Au(16727974));return r.position.y=.13,e.add(r),e}function Vu(e){return t(F.standHeight,F.crouchHeight,e.crouch)}function Hu(e){return t(F.standEye,F.crouchEye,e)}function Uu(e){return e.cur===`primary`&&e.slots.primary?I[e.slots.primary.id].moveSpeed:e.cur===`secondary`&&e.slots.secondary?I[e.slots.secondary.id].moveSpeed:e.cur.startsWith(`util`)?5.4:I.tool.moveSpeed}function Wu(e,t){let n=Uu(e);return e.crouch>.5?n*=F.crouchMul:t&&(n*=F.walkMul),n}function Gu(e){return Math.hypot(e.vel.x,e.vel.z)}function Ku(n,r,i){let{dt:a}=i,o=F.halfWidth,s=+!!r.crouch;if(n.crouch<s)n.crouch=Math.min(s,n.crouch+F.crouchRate*a);else if(n.crouch>s){let e=Math.max(s,n.crouch-F.crouchRate*a),r=t(F.standHeight,F.crouchHeight,e);N(n.pos.x,n.pos.y,n.pos.z,o,r)||(n.crouch=e)}let c=Vu(n),l=i.locked?0:e(r.moveX,-1,1),u=i.locked?0:e(r.moveZ,-1,1),d=Math.hypot(l,u);d>1&&(l/=d,u/=d);let f=Math.sin(n.yaw),p=Math.cos(n.yaw),m=-f*u+p*l,h=-p*u-f*l,g=Math.hypot(m,h),_=Wu(n,r.walk),v=g>0?m/g*_*Math.min(1,g):0,y=g>0?h/g*_*Math.min(1,g):0;if(n.landPenalty>0&&(n.landPenalty=Math.max(0,n.landPenalty-a*2.2)),n.onGround){let e=Math.hypot(n.vel.x,n.vel.z),t=Math.hypot(v,y),r=e>.1&&t>0&&(n.vel.x*v+n.vel.z*y)/(e*t)<.2,i=t<e-.01||r?F.decel:F.accel,o=v-n.vel.x,s=y-n.vel.z,c=Math.hypot(o,s),l=i*a;c<=l?(n.vel.x=v,n.vel.z=y):(n.vel.x+=o/c*l,n.vel.z+=s/c*l)}else if(g>0){n.vel.x+=v/Math.max(_,.01)*F.airAccel*a,n.vel.z+=y/Math.max(_,.01)*F.airAccel*a;let e=Math.hypot(n.vel.x,n.vel.z),t=Math.max(_,0);e>t&&(n.vel.x*=t/e,n.vel.z*=t/e)}r.jump&&n.onGround&&!i.locked&&n.landPenalty<.55&&(n.vel.y=F.jumpSpeed,n.onGround=!1,n.vel.x*=.9,n.vel.z*=.9,n.landPenalty=Math.min(1,n.landPenalty+.25),i.emit({t:`step`,id:n.id,p:{...n.pos},loud:.7,kind:`jump`}));let b=n.pos.x+n.vel.x*a,x=n.pos.z+n.vel.z*a;if(i.confine){let t=i.confine;b=e(b,t.x0+o,t.x1-o),x=e(x,t.z0+o,t.z1-o)}b=e(b,o,96-o),x=e(x,o,72-o),qu(n,`x`,b,o,c),qu(n,`z`,x,o,c);let S=te(n.pos.x,n.pos.z,o,n.pos.y+.03);if(n.onGround&&(n.pos.y-S>.04?n.onGround=!1:(n.pos.y=S,n.vel.y=0)),!n.onGround){n.vel.y-=F.gravity*a;let t=n.pos.y+n.vel.y*a;if(n.vel.y>0)N(n.pos.x,t,n.pos.z,o,c)&&(n.vel.y=0,t=n.pos.y),n.pos.y=t;else{let r=te(n.pos.x,n.pos.z,o,n.pos.y+.03);if(t<=r){let t=-n.vel.y;n.pos.y=r,n.vel.y=0,n.onGround=!0;let a=e((t-3)/8,0,1);n.landPenalty=Math.max(n.landPenalty,.2+a*.8),i.emit({t:`step`,id:n.id,p:{...n.pos},loud:.5+a*.5,kind:`land`})}else n.pos.y=t}}if(n.onGround){let e=Gu(n);if(n.stepAcc+=e*a,n.stepAcc>=1.75&&e>.8){n.stepAcc=0;let t=e/Math.max(.1,Uu(n))>.62?1:.12;i.emit({t:`step`,id:n.id,p:{...n.pos},loud:t,kind:`step`})}}n.pos.y<-20&&(n.pos.y=0)}function qu(e,t,n,r,i){let a=e.pos[t];if(n===a)return;let o={x:e.pos.x,y:e.pos.y,z:e.pos.z};if(o[t]=n,!N(o.x,o.y,o.z,r,i)){e.pos[t]=n;return}if(e.onGround||e.vel.y>-2){for(let a of[F.stepHeight])if(!N(o.x,o.y+a,o.z,r,i)){let s=te(o.x,o.z,r,o.y+a+.03);if(s>e.pos.y+.01&&s<=e.pos.y+a+.01&&!N(o.x,s,o.z,r,i)){e.pos[t]=n,e.pos.y=s;return}}}let s=Math.sign(n-a),c=0,l=Math.abs(n-a);for(let e=0;e<6;e++){let e=(c+l)/2;o[t]=a+s*e,N(o.x,o.y,o.z,r,i)?l=e:c=e}e.pos[t]=a+s*c,e.vel[t]=0}function Ju(e,t=!1){let n=I[e];return{id:e,mag:n.mag,reserve:n.reserve,nextFire:0,readyAt:0,reloadEnd:0,reloading:!1,burstLeft:0,burstNext:0,shots:0,lastShot:-100,heat:0,fresh:t,scopeLevel:0}}function Yu(e,t,n){if(e.shots<=0)return 0;let r=Math.max(.05,t.recoil.recovery),i=1-(n-e.lastShot)/r;return i<=0?0:e.shots*i}function Xu(e,r,i){let a=Yu(e,r,i);if(a<=0)return{pitch:0,yaw:0};let o=Math.floor(a),s=Math.ceil(a),c=be(r.recoil,o),l=be(r.recoil,s),u=a-o;return{pitch:t(c.pitch,l.pitch,u)*n,yaw:t(c.yaw,l.yaw,u)*n}}function Zu(n,r,i,a,o){let s=i.spread,c=Math.max(.1,i.moveSpeed),l=e((o-F.accuracySpeed)/Math.max(.1,c-F.accuracySpeed),0,1.25),u=s.stand+s.move*l;return n.onGround||(u+=s.air),u+=s.air*.6*n.landPenalty,u+=r.heat*Math.exp(-(a-r.lastShot)*7),u*=t(1,s.crouch,n.crouch),i.scoped&&(r.scopeLevel===0?u*=i.scoped.unscopedSpreadMul:u*=i.scoped.moveSpreadMul),u}function Qu(e){return e?I[e.id].price:0}function $u(e,t){let n=document.createElement(`canvas`);return n.width=e,n.height=t,[n,n.getContext(`2d`)]}function ed(e,t=!0){let n=new Na(e);return n.colorSpace=Rt,t&&(n.wrapS=xe,n.wrapT=xe),n.anisotropy=8,n.needsUpdate=!0,n}function td(e,t,n,r,i,a,o,s=1.6){for(let c=0;c<i;c++){e.fillStyle=r()<.5?a:o;let i=r()*s+.4;e.fillRect(r()*t,r()*n,i,i)}}function nd(e,t,n,r,i,a,o,s){for(let c=0;c<i;c++){let i=r()*t,c=r()*n,l=s*(.4+r()),u=e.createRadialGradient(i,c,0,i,c,l);u.addColorStop(0,a.replace(`A`,String(o))),u.addColorStop(1,a.replace(`A`,`0`)),e.fillStyle=u,e.fillRect(i-l,c-l,l*2,l*2)}}function rd(){let e=ye(1234),[t,n]=$u(512,768);n.fillStyle=`#c9cdd1`,n.fillRect(0,0,512,768),n.fillStyle=`#2a2f36`,n.fillRect(0,0,512,150);for(let e=0;e<512;e+=32)n.fillStyle=`rgba(0,0,0,0.35)`,n.fillRect(e,8,2,134);n.fillStyle=`rgba(255,255,255,0.05)`;for(let e=0;e<512;e+=32)n.fillRect(e+2,8,1,134);n.fillStyle=`#ffb24a`,n.fillRect(0,150,512,7),n.fillStyle=`rgba(255,178,74,0.25)`,n.fillRect(0,157,512,20);for(let e=0;e<512;e+=128){let t=n.createLinearGradient(0,160,0,560);t.addColorStop(0,`#d3d6d9`),t.addColorStop(1,`#bfc4c9`),n.fillStyle=t,n.fillRect(e+2,160,124,420),n.fillStyle=`rgba(40,46,54,0.55)`,n.fillRect(e,160,2,420)}nd(n,512,768,e,40,`rgba(120,125,130,A)`,.07,70),n.fillStyle=`#34263a`,n.fillRect(0,548,512,22),n.fillStyle=`#ff3fa6`,n.fillRect(0,553,512,6),n.fillStyle=`rgba(255,63,166,0.28)`,n.fillRect(0,559,512,10);for(let e=16;e<512;e+=128)n.fillStyle=`#6b6f78`,n.fillRect(e,545,10,28);n.fillStyle=`#8f959c`,n.fillRect(0,590,512,178),n.fillStyle=`#767c83`,n.fillRect(0,590,512,6);for(let e=0;e<512;e+=256)n.fillStyle=`rgba(30,34,40,0.5)`,n.fillRect(e,596,2,172);n.fillStyle=`#e8c53a`,n.fillRect(0,740,512,10);for(let e=0;e<512;e+=40)n.fillStyle=`#1c1c1c`,n.beginPath(),n.moveTo(e,740),n.lineTo(e+20,740),n.lineTo(e+10,750),n.lineTo(e-10,750),n.fill();td(n,512,768,e,2600,`rgba(255,255,255,0.12)`,`rgba(0,0,0,0.12)`);let[r,i]=$u(256,256);i.fillStyle=`#b9bdc0`,i.fillRect(0,0,256,256),nd(i,256,256,e,30,`rgba(90,95,100,A)`,.09,60),td(i,256,256,e,1800,`rgba(255,255,255,0.18)`,`rgba(0,0,0,0.15)`),i.fillStyle=`rgba(60,66,74,0.7)`,i.fillRect(0,0,256,2),i.fillRect(0,0,2,256),i.fillStyle=`rgba(255,255,255,0.1)`,i.fillRect(0,2,256,1),i.fillRect(2,0,1,256);let[a,o]=$u(256,256);o.fillStyle=`#5a5e63`,o.fillRect(0,0,256,256),nd(o,256,256,e,40,`rgba(30,32,36,A)`,.18,50),td(o,256,256,e,3400,`rgba(210,210,210,0.18)`,`rgba(0,0,0,0.25)`,2.2),o.fillStyle=`rgba(232,197,58,0.85)`,o.fillRect(0,0,256,7),o.fillStyle=`rgba(20,22,26,0.7)`,o.fillRect(0,7,256,2);let[s,c]=$u(256,256);c.fillStyle=`#2f343b`,c.fillRect(0,0,256,256);for(let e=0;e<256;e+=16)c.fillStyle=`#3f464f`,c.fillRect(e+1,0,14,256),c.fillStyle=`rgba(0,0,0,0.45)`,c.fillRect(e,0,2,256),c.fillRect(0,e,256,2);c.fillStyle=`rgba(255,255,255,0.06)`;for(let e=0;e<256;e+=16)c.fillRect(e+2,0,1,256);td(c,256,256,e,800,`rgba(255,255,255,0.1)`,`rgba(0,0,0,0.2)`),c.fillStyle=`#d8b53a`,c.fillRect(0,0,256,5);let[l,u]=$u(256,256);u.fillStyle=`#9fb7a2`,u.fillRect(0,0,256,256);for(let t=0;t<4;t++)for(let n=0;n<4;n++){let r=150+Math.floor(e()*30);u.fillStyle=`rgb(${r-12},${r+6},${r-8})`,u.fillRect(t*64+2,n*64+2,60,60)}u.fillStyle=`rgba(30,50,40,0.5)`;for(let e=0;e<256;e+=64)u.fillRect(e,0,2,256),u.fillRect(0,e,256,2);nd(u,256,256,e,20,`rgba(40,90,50,A)`,.12,40),td(u,256,256,e,1e3,`rgba(255,255,255,0.14)`,`rgba(0,0,0,0.14)`);let[d,f]=$u(256,256);{f.fillStyle=`#c3c8cf`,f.fillRect(0,0,256,256);let t=f.createRadialGradient(128,128,20,128,128,190);t.addColorStop(0,`rgba(255,255,255,0.25)`),t.addColorStop(1,`rgba(60,70,90,0.18)`),f.fillStyle=t,f.fillRect(0,0,256,256),f.strokeStyle=`rgba(255,63,166,0.35)`,f.lineWidth=3,f.beginPath(),f.arc(128,128,90,0,Math.PI*2),f.stroke(),f.fillStyle=`rgba(40,46,54,0.6)`,f.fillRect(0,0,256,2),f.fillRect(0,0,2,256),td(f,256,256,e,900,`rgba(255,255,255,0.2)`,`rgba(0,0,0,0.1)`)}let[p,m]=$u(256,256);m.fillStyle=`#20252b`,m.fillRect(0,0,256,256);for(let e=0;e<256;e+=64)m.fillStyle=`#2d343c`,m.fillRect(e+2,2,60,252);m.fillStyle=`rgba(0,0,0,0.5)`;for(let e=0;e<256;e+=64)m.fillRect(e,0,2,256),m.fillRect(0,e,256,2);td(m,256,256,e,500,`rgba(255,255,255,0.08)`,`rgba(0,0,0,0.2)`);let[h,g]=$u(256,256);g.fillStyle=`#d7d7d7`,g.fillRect(0,0,256,256);for(let e=0;e<256;e+=16)g.fillStyle=e%32==0?`rgba(0,0,0,0.22)`:`rgba(255,255,255,0.18)`,g.fillRect(e,0,8,256);g.fillStyle=`rgba(0,0,0,0.55)`,g.fillRect(0,0,256,8),g.fillRect(0,248,256,8),g.fillRect(0,0,8,256),g.fillRect(248,0,8,256),g.fillStyle=`rgba(255,255,255,0.2)`,g.fillRect(8,8,240,2),nd(g,256,256,e,14,`rgba(60,40,20,A)`,.2,40),td(g,256,256,e,800,`rgba(255,255,255,0.12)`,`rgba(0,0,0,0.18)`);let[_,v]=$u(256,256);v.fillStyle=`#8a929c`,v.fillRect(0,0,256,256);for(let e=0;e<256;e+=64)v.fillStyle=`rgba(0,0,0,0.35)`,v.fillRect(e,0,2,256),v.fillRect(0,e,256,2);for(let e=8;e<256;e+=32)for(let t=8;t<256;t+=32)v.fillStyle=`#4b5159`,v.beginPath(),v.arc(e,t,2.2,0,7),v.fill();nd(v,256,256,e,20,`rgba(255,255,255,A)`,.08,50),v.fillStyle=`#ff3fa6`,v.fillRect(0,120,256,5);let[y,b]=$u(256,256);b.fillStyle=`#2f7a43`,b.fillRect(0,0,256,256);for(let t=0;t<900;t++){let t=e()*256,n=e()*256,r=e()*6.28,i=6+e()*14,a=70+Math.floor(e()*110);b.fillStyle=`rgb(${20+Math.floor(e()*40)},${a},${30+Math.floor(e()*40)})`,b.beginPath(),b.ellipse(t,n,i,i*.4,r,0,7),b.fill()}b.fillStyle=`rgba(0,0,0,0.12)`;for(let e=0;e<256;e+=64)b.fillRect(e,0,2,256);let[x,S]=$u(256,256);S.fillStyle=`#3a4048`,S.fillRect(0,0,256,256),S.fillStyle=`#e1b83c`,S.fillRect(0,0,256,20),S.fillRect(0,236,256,20);for(let e=-20;e<276;e+=40)S.fillStyle=`#1b1b1b`,S.beginPath(),S.moveTo(e,0),S.lineTo(e+20,0),S.lineTo(e,20),S.lineTo(e-20,20),S.fill(),S.beginPath(),S.moveTo(e,236),S.lineTo(e+20,236),S.lineTo(e,256),S.lineTo(e-20,256),S.fill();for(let e=24;e<232;e+=14)S.fillStyle=`rgba(255,255,255,0.1)`,S.fillRect(0,e,256,2);td(S,256,256,e,800,`rgba(255,255,255,0.1)`,`rgba(0,0,0,0.2)`);let[C,w]=$u(256,256);w.fillStyle=`#e6e8e4`,w.fillRect(0,0,256,256),w.fillStyle=`rgba(0,0,0,0.12)`;for(let e=0;e<256;e+=128)w.fillRect(e,0,2,256);w.fillStyle=`rgba(60,70,80,0.5)`,w.fillRect(0,0,256,4),w.fillRect(0,252,256,4),w.fillStyle=`#ff3fa6`,w.fillRect(0,150,256,4),td(w,256,256,e,800,`rgba(255,255,255,0.15)`,`rgba(0,0,0,0.08)`);let[T,E]=$u(256,256);return E.fillStyle=`#a7acb2`,E.fillRect(0,0,256,256),E.fillStyle=`#383e46`,E.fillRect(0,0,256,38),E.fillStyle=`#e1b83c`,E.fillRect(0,38,256,6),nd(E,256,256,e,14,`rgba(70,75,80,A)`,.1,50),E.fillStyle=`rgba(0,0,0,0.25)`,E.fillRect(0,0,2,256),td(E,256,256,e,900,`rgba(255,255,255,0.15)`,`rgba(0,0,0,0.16)`),{wall:ed(t),floorConcrete:ed(r),floorYard:ed(a),floorGrate:ed(s),floorHydro:ed(l),floorMid:ed(d),ceiling:ed(p),crate:ed(h),metal:ed(_),foliage:ed(y),platform:ed(x),thin:ed(C),halfWall:ed(T)}}function id(e,t=`#ff3fa6`,n=512,r=160){let[i,a]=$u(n,r);return a.fillStyle=`#12161b`,a.fillRect(0,0,n,r),a.strokeStyle=t,a.lineWidth=6,a.strokeRect(6,6,n-12,r-12),a.fillStyle=t,a.fillRect(6,r-30,n-12,6),a.fillStyle=`#f3f6f8`,a.font=`800 64px "Segoe UI", system-ui, sans-serif`,a.textAlign=`center`,a.textBaseline=`middle`,a.fillText(e,n/2,r/2-10),ed(i,!1)}function ad(){let[e,t]=$u(128,128),n=t.createRadialGradient(64,64,0,64,64,64);return n.addColorStop(0,`rgba(255,255,255,1)`),n.addColorStop(.3,`rgba(255,255,255,0.55)`),n.addColorStop(1,`rgba(255,255,255,0)`),t.fillStyle=n,t.fillRect(0,0,128,128),ed(e,!1)}function od(e,t,n,r){let i=e.x1-e.x0,a=e.y1-e.y0,o=e.z1-e.z0,s=(e.x0+e.x1)/2,c=(e.y0+e.y1)/2,l=(e.z0+e.z1)/2,u=new La(i,a,o),d=u.attributes.uv,f=[[o,a,0,0],[o,a,0,0],[i,o,1,0],[i,o,1,0],[i,a,0,0],[i,a,0,0]];for(let i=0;i<6;i++){let[a,o,s]=f[i];for(let c=0;c<4;c++){let l=d.getX(i*4+c),u=d.getY(i*4+c);s?d.setXY(i*4+c,l*a/r+(e.x0+e.z0)*.013,u*o/r):d.setXY(i*4+c,l*a/t+(e.x0+e.z0)*.017,e.y0/n+u*o/n)}}return d.needsUpdate=!0,u.translate(s,c,l),u}var sd=[13660218,3116947,13214523,8019888,6261322];function cd(e){let t=rd(),n=new fr;n.name=`world`;let r=new ro({map:t.wall,roughness:.92,metalness:.02}),i=new ro({map:t.metal,roughness:.55,metalness:.5,color:13293288}),a=new ro({map:t.foliage,roughness:1,metalness:0}),o=new ro({map:t.platform,roughness:.8,metalness:.15}),s=new ro({map:t.thin,roughness:.95,metalness:0}),c=new ro({map:t.halfWall,roughness:.95,metalness:0}),l=new ro({color:10479359,transparent:!0,opacity:.2,roughness:.05,metalness:.1,side:2,depthWrite:!1}),u=sd.map(e=>new ro({map:t.crate,color:e,roughness:.7,metalness:.25})),d=new Map,f=(e,t)=>{let n=d.get(e)??[];n.push(t),d.set(e,n)};for(let e of v)switch(e.glyph){case`#`:case`k`:f(r,od(e,4,6,4));break;case`T`:f(i,od(e,2,2,2));break;case`C`:case`c`:f(u[(Math.floor(e.x0/2)*7+Math.floor(e.z0/2)*3)%u.length],od(e,2,2,2));break;case`H`:f(c,od(e,2,1.2,2));break;case`P`:f(a,od(e,2,2,2));break;case`1`:case`2`:case`3`:case`4`:f(o,od(e,2,2,2));break;case`v`:case`w`:f(s,od(e,2,4.2,2));break;case`g`:case`l`:f(l,od(e,2,2,2));break;default:f(r,od(e,4,6,4))}for(let[e,t]of d){let r=new J(xu(t,!1),e);r.castShadow=e!==l,r.receiveShadow=!0,e===l&&(r.renderOrder=2),n.add(r);for(let e of t)e.dispose()}let p={yard:new ro({map:t.floorYard,roughness:.95}),atrium:new ro({map:t.floorConcrete,roughness:.6,metalness:.05}),turbine:new ro({map:t.floorGrate,roughness:.7,metalness:.3}),hydro:new ro({map:t.floorHydro,roughness:.55,metalness:.05}),mid:new ro({map:t.floorMid,roughness:.35,metalness:.1}),corridor:new ro({map:t.floorConcrete,roughness:.85})},m={};for(let e=0;e<36;e++)for(let t=0;t<48;t++){if(h(t,e)===`#`)continue;let n=E(t,e),r=new Ua(2,2);r.rotateX(-Math.PI/2),r.translate(t*2+1,0,e*2+1);let i=r.attributes.uv;for(let e=0;e<4;e++)i.setXY(e,i.getX(e),i.getY(e));(m[n]??=[]).push(r)}for(let e of Object.keys(m)){let t=new J(xu(m[e],!1),p[e]);t.receiveShadow=!0,n.add(t)}let g=new ro({map:t.ceiling,roughness:.9,side:1});t.ceiling.repeat.set(24,18);let _=new J(new Ua(96,72).rotateX(Math.PI/2).translate(48,6,36),g);_.receiveShadow=!1,n.add(_);let y=[],x=[];for(let e=1;e<35;e+=3)for(let t=1;t<47;t+=3){if(h(t,e)===`#`)continue;let n=new La(2.4,.08,.7);n.translate(t*2+1,5.95,e*2+1),y.push(n);let r=new La(.08,.06,2.6);r.translate(t*2+3.1,5.95,e*2+1),h(t+1,e)!==`#`&&x.push(r)}let S=new J(xu(y,!1),new Ki({color:16767392}));n.add(S),x.length&&n.add(new J(xu(x,!1),new Ki({color:16727974})));let C=[{text:`A  TURBINE HALL`,x:20,z:4.03,y:3.4,ry:0,accent:`#ff3fa6`},{text:`B  HYDROPONICS`,x:78,z:4.03,y:3.4,ry:0,accent:`#42e8a0`},{text:`CALIBRATION`,x:40,z:18.03,y:3.6,ry:0,accent:`#4de0ff`},{text:`ATRIUM`,x:48,z:15.97,y:3.6,ry:Math.PI,accent:`#4de0ff`},{text:`FREIGHT YARD`,x:33,z:54.03,y:3.6,ry:0,accent:`#ffb24a`},{text:`DOCK LANE`,x:8,z:59.97,y:3.2,ry:Math.PI,accent:`#ffb24a`},{text:`GLASS CORRIDOR`,x:87,z:63.97,y:3.4,ry:Math.PI,accent:`#9fe6ff`},{text:`CARGO LANE`,x:20,z:53.97,y:3.2,ry:Math.PI,accent:`#ffb24a`}];for(let e of C){let t=new J(new Ua(5,1.56),new Ki({map:id(e.text,e.accent),transparent:!1}));t.position.set(e.x,e.y,e.z),t.rotation.y=e.ry,n.add(t)}let w=new fr;for(let e of[`A`,`B`]){let t=b[e],n=t.x1-t.x0,r=t.z1-t.z0,i=new J(new Ua(n,r).rotateX(-Math.PI/2),new Ki({color:16727974,transparent:!0,opacity:.1,depthWrite:!1}));i.position.set((t.x0+t.x1)/2,.03,(t.z0+t.z1)/2),w.add(i);let a=[],o=.12;for(let[e,i,s,c]of[[t.x0+n/2,t.z0,n,o],[t.x0+n/2,t.z1,n,o],[t.x0,t.z0+r/2,o,r],[t.x1,t.z0+r/2,o,r]]){let t=new Ua(s,c).rotateX(-Math.PI/2);t.translate(e,.04,i),a.push(t)}w.add(new J(xu(a,!1),new Ki({color:16727974})));let s=new J(new Ua(4.5,4.5).rotateX(-Math.PI/2),new Ki({map:ld(e),transparent:!0,depthWrite:!1,opacity:.9}));s.position.set((t.x0+t.x1)/2,.05,(t.z0+t.z1)/2),w.add(s)}n.add(w);let T=new Oo(15397375,9080472,1.35),D=new Ko(16773344,.32),O=new Go(16774374,1.65);O.position.set(86,46,6),O.target.position.set(48,0,36),O.castShadow=!0,O.shadow.mapSize.set(2048,2048);let k=O.shadow.camera;return k.left=-64,k.right=64,k.top=56,k.bottom=-56,k.near=4,k.far=130,O.shadow.bias=-4e-4,O.shadow.normalBias=.04,e.add(T,D,O,O.target,n),{group:n,textures:t,sun:O,hemi:T,siteMarkers:w,setShadowQuality(e){O.castShadow=e!==`off`;let t=e===`high`?4096:2048;O.shadow.mapSize.x!==t&&(O.shadow.mapSize.set(t,t),O.shadow.map?.dispose(),O.shadow.map=null)}}}function ld(e){let t=document.createElement(`canvas`);t.width=256,t.height=256;let n=t.getContext(`2d`);n.font=`900 190px "Segoe UI", system-ui, sans-serif`,n.textAlign=`center`,n.textBaseline=`middle`,n.lineWidth=12,n.strokeStyle=`rgba(20,10,30,0.9)`,n.strokeText(e,128,140),n.fillStyle=`#ff3fa6`,n.fillText(e,128,140);let r=new Na(t);return r.colorSpace=Rt,r}var ud=`
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`,dd=`
uniform vec3 uCenter; uniform float uRadius; uniform float uTime; uniform float uFade;
varying vec3 vWorld;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vWorld - ro);
  float dist = length(vWorld - ro);
  vec3 oc = ro - uCenter;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - uRadius * uRadius;
  float disc = b * b - c;
  if (disc < 0.0) discard;
  float s = sqrt(disc);
  float t0 = max(-b - s, 0.0);
  float t1 = min(-b + s, dist);
  float thick = max(t1 - t0, 0.0);
  float a = clamp(thick / 0.5, 0.0, 1.0) * 0.975 * uFade;
  vec3 mid = ro + rd * (t0 + t1) * 0.5;
  float n = noise(mid * 1.1 + vec3(uTime * 0.12, uTime * 0.05, 0.0)) * 0.6 + noise(mid * 2.7 - uTime * 0.2) * 0.4;
  vec3 col = mix(vec3(0.50, 0.57, 0.66), vec3(0.82, 0.87, 0.94), n);
  col *= 0.88 + 0.12 * clamp(thick / (uRadius * 1.6), 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`,fd=class{canvas;renderer;scene=new br;camera=new Bo(60,16/9,.05,160);vmScene=new br;vmCamera=new Bo(62,16/9,.01,10);world;rigs=new Map;rigSides=new Map;rigPrev=new Map;rigSpeed=new Map;grenades=new Map;smokes=new Map;fires=new Map;drops=new Map;spikeObj;spikeLight;tracers=[];particles=[];decals=[];partInst;decalInst;decalCount=0;tmpColor=new q;hideMat=new Rn().makeScale(0,0,0);decalIdx=0;corpses=[];muzzleSprite;flashLights=[];flashLightIdx=0;glowTex=ad();vmGroup=new fr;vmModel=null;vmWeapon=null;vmMuzzle;vmMuzzleT=0;bob=0;time=0;settings;aspect=16/9;smokeMat=[];pulseRings=[];trajectory;stats={drawCalls:0,triangles:0};qualityApplied=``;constructor(e,t){this.canvas=e,this.settings=t,this.renderer=new bu({canvas:e,antialias:!0,powerPreference:`high-performance`,preserveDrawingBuffer:!1}),this.renderer.outputColorSpace=Rt,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=1,this.renderer.autoClear=!1,this.renderer.info.autoReset=!1,this.scene.background=new q(1053721),this.world=cd(this.scene),this.vmScene.add(new Oo(16777215,8028300,2));let n=new Go(16773856,2.2);n.position.set(1,2,1.5),this.vmScene.add(n),this.vmScene.add(this.vmGroup),this.vmMuzzle=new zi(new Ti({map:this.glowTex,color:16767392,blending:2,transparent:!0,depthTest:!1})),this.vmMuzzle.scale.setScalar(.22),this.vmMuzzle.visible=!1,this.vmScene.add(this.vmMuzzle);for(let e=0;e<32;e++){let e=new J(new La(.012,.012,1),new Ki({color:16771248,transparent:!0,opacity:.85,depthWrite:!1,blending:2}));e.visible=!1,this.scene.add(e),this.tracers.push({mesh:e,life:0,max:.08})}let r=new Ua(.05,.05);for(let e=0;e<140;e++){let e=new J(r);e.visible=!1,this.particles.push({mesh:e,vel:new G,life:0,max:.4,grav:6})}this.partInst=new ha(r,new Ki({color:16777215,transparent:!0,depthWrite:!1,blending:2}),140),this.partInst.frustumCulled=!1,this.partInst.instanceMatrix.setUsage(Wt),this.partInst.setColorAt(0,new q(1,1,1)),this.scene.add(this.partInst);let i=new Ki({map:this.glowTex,color:329482,transparent:!0,opacity:.7,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-4}),a=new Ua(.17,.17);for(let e=0;e<120;e++){let e=new J(a);e.visible=!1,this.decals.push(e)}this.decalInst=new ha(a,i,120),this.decalInst.frustumCulled=!1,this.decalInst.count=0,this.scene.add(this.decalInst),this.muzzleSprite=new zi(new Ti({map:this.glowTex,color:16764800,blending:2,transparent:!0,depthWrite:!1})),this.muzzleSprite.scale.setScalar(.5),this.muzzleSprite.visible=!1,this.scene.add(this.muzzleSprite);for(let e=0;e<3;e++){let e=new Ho(16760944,0,9,2);this.scene.add(e),this.flashLights.push(e)}this.spikeObj=Bu(),this.spikeObj.visible=!1,this.scene.add(this.spikeObj),this.spikeLight=new Ho(16727974,0,7,2),this.scene.add(this.spikeLight);let o=new mi().setFromPoints(Array(60).fill(0).map(()=>new G));this.trajectory=new Aa(o,new Sa({color:7208921,transparent:!0,opacity:.8})),this.trajectory.visible=!1,this.trajectory.frustumCulled=!1,this.scene.add(this.trajectory),this.applyQuality(),this.resize()}setSettings(e){this.settings=e,this.applyQuality()}applyQuality(){let e=this.settings.quality;if(this.qualityApplied===e+this.settings.resolutionScale)return;this.qualityApplied=e+this.settings.resolutionScale;let t=Math.min(window.devicePixelRatio||1,e===`high`?2:e===`medium`?1.25:1);this.renderer.setPixelRatio(t*this.settings.resolutionScale*(e===`low`?.8:1)),this.world.setShadowQuality(e===`low`?`off`:e===`high`?`high`:`low`),this.resize()}resize(){let e=this.canvas.clientWidth||window.innerWidth,t=this.canvas.clientHeight||window.innerHeight;this.renderer.setSize(e,t,!1),this.aspect=e/t,this.camera.aspect=this.aspect,this.vmCamera.aspect=this.aspect,this.camera.updateProjectionMatrix(),this.vmCamera.updateProjectionMatrix()}vFov(e){let t=e*Math.PI/360;return 2*Math.atan(Math.tan(t)/this.aspect)*180/Math.PI}ensureRig(e,t){let n=this.rigs.get(e.id),r=Fu[this.settings.colorblind];return n&&this.rigSides.get(e.id)===t&&n.paletteKey===Ru(t,r)||(n&&this.scene.remove(n.root),n=Iu(t,r),this.rigs.set(e.id,n),this.rigSides.set(e.id,t),this.scene.add(n.root)),n}handleEvent(e,t,n){switch(e.t){case`shot`:{let t=new G(e.o.x,e.o.y-.12,e.o.z),r=new G(e.e.x,e.e.y,e.e.z);e.id===n?this.spawnTracer(t.clone().add(new G().subVectors(r,t).normalize().multiplyScalar(1.2)),r):(this.spawnTracer(t,r),this.muzzleFlash(t,e.id));break}case`impact`:this.spawnImpact(e.p,e.n,e.mat);break;case`kill`:this.spawnCorpse(e,t);break;case`nade`:e.kind===`pulsePing`&&this.spawnPulseRing(e.p),e.kind===`flash`&&this.flashLight(e.p,16777215,6,.25),e.kind===`frag`&&(this.flashLight(e.p,16751178,8,.3),this.burst(e.p,28,16754784,7)),e.kind===`thermite`&&this.flashLight(e.p,16742954,4,.4);break;case`spike`:e.kind===`explode`&&(this.flashLight(e.p,16747066,16,.6),this.burst(e.p,60,16751184,11))}}flashLight(e,t,n,r){let i=this.flashLights[this.flashLightIdx++%this.flashLights.length];i.position.set(e.x,e.y+.6,e.z),i.color.setHex(t),i.intensity=n*3,i._life=r}spawnTracer(e,t){let n=this.tracers.find(e=>e.life<=0)??this.tracers[0],r=new G().subVectors(t,e),i=r.length();i<.3||(n.mesh.position.copy(e).addScaledVector(r,.5),n.mesh.scale.set(1,1,i),n.mesh.lookAt(t),n.mesh.visible=!0,n.life=n.max,n.mesh.material.opacity=.8)}muzzleFlash(e,t){this.muzzleSprite.position.copy(e),this.muzzleSprite.visible=!0,this.muzzleFlashT=.05}muzzleFlashT=0;burst(e,t,n,r){for(let i=0;i<t;i++){let t=this.particles.find(e=>e.life<=0);if(!t)return;t.mesh.position.set(e.x,e.y+.3,e.z),t.vel.set((Math.random()-.5)*r,Math.random()*r*.8,(Math.random()-.5)*r),t.life=t.max=.5+Math.random()*.5,t.grav=8,t.mesh.userData.color=n,t.mesh.scale.setScalar(2.4),t.mesh.visible=!0}}spawnImpact(e,t,n){let r=n===`player`||n===`head`,i=this.settings.quality===`low`?2:5,a=r?12072255:n===`metal`?16767120:n===`foliage`?8177770:n===`glass`?13628671:14209732;for(let n=0;n<i;n++){let n=this.particles.find(e=>e.life<=0);if(!n)break;n.mesh.position.set(e.x+t.x*.03,e.y+t.y*.03,e.z+t.z*.03),n.vel.set(t.x*2+(Math.random()-.5)*2,t.y*2+Math.random()*1.5,t.z*2+(Math.random()-.5)*2),n.life=n.max=r?.35:.3,n.grav=7,n.mesh.userData.color=a,n.mesh.scale.setScalar(r?1.2:.9),n.mesh.visible=!0}if(!r&&n!==`glass`&&n!==`foliage`){let r=this.decals[this.decalIdx++%this.decals.length];r.position.set(e.x+t.x*.01,e.y+t.y*.01,e.z+t.z*.01),r.lookAt(e.x+t.x,e.y+t.y,e.z+t.z),r.rotateZ(Math.random()*6.28),r.scale.setScalar(c[n]?.cost<10?1.3:.8),r.updateMatrix();let i=(this.decalIdx-1)%this.decals.length;this.decalInst.setMatrixAt(i,r.matrix),this.decalCount=Math.max(this.decalCount,i+1),this.decalInst.count=this.decalCount,this.decalInst.instanceMatrix.needsUpdate=!0}}spawnPulseRing(e){let t=new J(new Wa(.2,.26,40),new Ki({color:5103871,transparent:!0,opacity:.9,depthWrite:!1,side:2}));t.rotation.x=-Math.PI/2,t.position.set(e.x,e.y+.1,e.z),this.scene.add(t),this.pulseRings.push({mesh:t,life:1.1})}spawnCorpse(e,t){let n=t.squadSide[e.victim<5?0:1],r=Iu(n,Fu[this.settings.colorblind]);r.root.position.set(e.pos.x,e.pos.y,e.pos.z);let i=this.rigs.get(e.victim);if(r.root.rotation.y=i?i.root.rotation.y:Math.random()*6,r.body.rotation.x=0,this.scene.add(r.root),this.corpses.push({rig:r,t:0,spin:(Math.random()-.5)*.6}),this.corpses.length>6){let e=this.corpses.shift();this.scene.remove(e.rig.root)}this.burst(e.pos,6,10103347,3)}clearRound(){for(let e of this.corpses)this.scene.remove(e.rig.root);this.corpses=[],this.decalCount=0,this.decalInst.count=0,this.decalIdx=0;for(let e of this.pulseRings)this.scene.remove(e.mesh);this.pulseRings=[]}render(n,r,i,a,o,s,c,l,u){this.time+=n,this.applyQuality();let d=new G(a.pos.x,a.pos.y,a.pos.z),f=a.zoomFov??this.settings.fov;this.camera.fov=this.vFov(f),this.camera.position.copy(d),this.camera.rotation.order=`YXZ`,this.camera.rotation.set(e(a.pitch+a.kickPitch,-1.55,1.55),a.yaw+a.kickYaw,a.roll),this.camera.updateProjectionMatrix(),this.vmCamera.fov=60,this.vmCamera.updateProjectionMatrix();let p={x:a.pos.x,y:a.pos.y,z:a.pos.z},m=e=>r.squadSide[e<5?0:1],h=new Set;for(let e of i){if(e.id===c)continue;let i=m(e.id),a=this.ensureRig(e,i);if(h.add(e.id),!e.alive){a.root.visible=!1;continue}let o=e.spotted,s=!1;if(o){let t={x:e.pos.x,y:e.pos.y+1.1,z:e.pos.z};for(let e of r.smokes)if(!(e.bloomIn>0)&&pd(p,t,e,e.r)>.5){s=!0;break}}let l=Math.hypot(e.pos.x-p.x,e.pos.z-p.z)<1.05&&Math.abs(e.pos.y+.9-p.y)<1.4;a.root.visible=!s&&!l&&u!==e.id,a.root.position.set(e.pos.x,e.pos.y,e.pos.z),a.root.rotation.y=e.yaw,Lu(a,e.weapon);let f=this.rigPrev.get(e.id),g=this.rigSpeed.get(e.id)??0;if(f){let r=Math.hypot(e.pos.x-f.x,e.pos.z-f.z)/Math.max(n,.001);g=t(g,Math.min(r,7),.25)}this.rigPrev.set(e.id,{x:e.pos.x,z:e.pos.z}),this.rigSpeed.set(e.id,g),this.animateRig(a,e,g,n,d)}for(let[e,t]of this.rigs)h.has(e)||(t.root.visible=!1);for(let e of this.corpses){e.t+=n;let t=Math.min(1,e.t/.55),r=1-(1-t)**3;e.rig.body.rotation.x=-Math.PI/2*r,e.rig.body.position.set(0,.18*r,0+.5*r),e.rig.root.rotation.y+=e.spin*n*(1-t),e.rig.legL.rotation.x=.3*r,e.rig.legR.rotation.x=-.2*r,e.rig.armR.rotation.x=.4*r,e.rig.armL.rotation.x=.9*r}let g=new Set;for(let e of r.grenades){g.add(e.id);let t=this.grenades.get(e.id);t||(t=zu(e.type),this.scene.add(t),this.grenades.set(e.id,t)),t.position.set(e.x,e.y,e.z),t.rotation.x+=n*(e.landed?0:9),t.rotation.z+=n*(e.landed?0:6),e.type===`pulse`&&e.landed&&(t.rotation.y+=n*3)}for(let[e,t]of this.grenades)g.has(e)||(this.scene.remove(t),this.grenades.delete(e));let _=new Set;for(let t of r.smokes){_.add(t.id);let n=this.smokes.get(t.id);if(!n){let e=new to({vertexShader:ud,fragmentShader:dd,side:1,transparent:!0,depthWrite:!1,uniforms:{uCenter:{value:new G(t.x,t.y,t.z)},uRadius:{value:t.r},uTime:{value:0},uFade:{value:0}}});n=new J(new Ga(t.r,40,28),e),n.position.set(t.x,t.y,t.z),n.renderOrder=3,n.frustumCulled=!1,this.scene.add(n),this.smokes.set(t.id,n),this.smokeMat.push(e)}let r=n.material;r.uniforms.uTime.value=this.time;let i=e(1-t.bloomIn/.4,0,1),a=e(t.remaining/1.5,0,1);r.uniforms.uFade.value=i*a}for(let[e,t]of this.smokes)_.has(e)||(this.scene.remove(t),t.material.dispose(),t.geometry.dispose(),this.smokes.delete(e));let v=new Set;for(let t of r.fires){v.add(t.id);let n=this.fires.get(t.id);if(!n){n=new fr;let e=new Ki({color:10692108,transparent:!0,opacity:.85,depthWrite:!1}),r=new Ki({color:16751146,transparent:!0,opacity:.8,depthWrite:!1,blending:2});for(let i=0;i<t.cells.length;i+=3){let a=t.cells[i],o=t.cells[i+1],s=t.cells[i+2],c=new J(new Ua(1,1).rotateX(-Math.PI/2),e);c.position.set(a,o+.03,s);let l=new J(new Ua(.86,.86).rotateX(-Math.PI/2),r);l.position.set(a,o+.045,s);let u=new J(new Ba(.28,.9,5),r);u.position.set(a+(i*7%5-2)*.06,o+.4,s+(i*3%5-2)*.06),u.userData.seed=i,n.add(c,l,u)}let i=new Ho(16742954,3,8,2);i.position.set(t.cells[0],t.cells[1]+1,t.cells[2]),n.add(i),this.scene.add(n),this.fires.set(t.id,n)}for(let e of n.children)if(e instanceof J&&e.userData.seed!==void 0){let t=e.userData.seed;e.scale.set(1,.6+.6*Math.abs(Math.sin(this.time*9+t)),1)}let r=e(t.remaining/.8,0,1);n.visible=r>.02}for(let[e,t]of this.fires)v.has(e)||(this.scene.remove(t),this.fires.delete(e));let y=new Set;for(let e of r.drops){y.add(e.id);let t=this.drops.get(e.id);t||(t=Pu(e.weapon).group,this.scene.add(t),this.drops.set(e.id,t)),t.position.set(e.x,e.y+.12,e.z),t.rotation.set(0,e.id*1.7,Math.PI/2*0),t.rotateZ(Math.PI/2),t.rotation.y+=this.time*.8}for(let[e,t]of this.drops)y.has(e)||(this.scene.remove(t),this.drops.delete(e));let b=r.spike;if(b.pos&&(b.state===`planted`||b.state===`dropped`||b.state===`defused`)){this.spikeObj.visible=!0,this.spikeObj.position.set(b.pos.x,b.pos.y,b.pos.z);let e=b.state===`planted`?.5+.5*Math.abs(Math.sin(this.time*(b.remaining<10?10:4))):.2;this.spikeLight.position.set(b.pos.x,b.pos.y+.4,b.pos.z),this.spikeLight.intensity=b.state===`defused`?0:e*4}else this.spikeObj.visible=!1,this.spikeLight.intensity=0;for(let e of this.tracers)e.life>0&&(e.life-=n,e.mesh.material.opacity=Math.max(0,e.life/e.max)*.8,e.life<=0&&(e.mesh.visible=!1));for(let e=0;e<this.particles.length;e++){let t=this.particles[e];if(t.life>0){t.life-=n,t.vel.y-=t.grav*n,t.mesh.position.addScaledVector(t.vel,n),t.mesh.quaternion.copy(this.camera.quaternion);let r=Math.max(0,t.life/t.max),i=t.mesh.scale.x;t.mesh.scale.setScalar(i*(.97+.03*r)),t.mesh.updateMatrix(),this.tmpColor.setHex(t.mesh.userData.color??16767392).multiplyScalar(r),this.partInst.setMatrixAt(e,r>0?t.mesh.matrix:this.hideMat),this.partInst.setColorAt(e,this.tmpColor)}else this.partInst.setMatrixAt(e,this.hideMat)}this.partInst.instanceMatrix.needsUpdate=!0,this.partInst.instanceColor&&(this.partInst.instanceColor.needsUpdate=!0);for(let e of this.flashLights){let t=(e._life??0)-n;e._life=t,t<=0&&(e.intensity=0)}this.muzzleFlashT>0&&(this.muzzleFlashT-=n,this.muzzleFlashT<=0&&(this.muzzleSprite.visible=!1));for(let e=this.pulseRings.length-1;e>=0;e--){let t=this.pulseRings[e];t.life-=n;let r=1-t.life/1.1;t.mesh.scale.setScalar(1+r*40),t.mesh.material.opacity=Math.max(0,.9*(1-r)),t.life<=0&&(this.scene.remove(t.mesh),this.pulseRings.splice(e,1))}if(l&&l.length>1){let e=this.trajectory.geometry.attributes.position;for(let t=0;t<60;t++){let n=l[Math.min(t,l.length-1)];e.setXYZ(t,n.x,n.y,n.z)}e.needsUpdate=!0,this.trajectory.visible=!0}else this.trajectory.visible=!1;this.updateViewmodel(n,o,a),this.renderer.info.reset(),this.renderer.clear(),this.renderer.render(this.scene,this.camera),o.visible&&o.weapon&&(this.renderer.clearDepth(),this.renderer.render(this.vmScene,this.vmCamera));let x=this.renderer.info.render;this.stats.drawCalls=x.calls,this.stats.triangles=x.triangles}animateRig(n,r,i,a,o){let s=Math.min(1,i/3.2);n.phase+=i*a*2.3;let c=Math.sin(n.phase)*.75*s;n.legL.rotation.x=c,n.legR.rotation.x=-c;let l=r.crouch;n.body.scale.y=t(1,.74,l),n.body.position.y=0;let u=e(r.pitch,-1.2,1.2),d=r.weapon===`util`;if(n.armR.rotation.x=d?.3+c*.3:Math.PI/2+u,n.armR.rotation.z=d?0:-.05,n.armL.rotation.x=d?.3-c*.3:Math.PI/2+u*.9-(r.reloading?.5:0),n.armL.rotation.z=d?0:.42,n.head.rotation.x=-u*.5,n.body.rotation.x=.06*s,r.swing&&r.weapon===`tool`&&(n.armR.rotation.x+=Math.sin(this.time*30)*.6),r.scoped&&r.spotted){let e=o.x-r.pos.x,t=o.z-r.pos.z,i=Math.hypot(e,t)||1,a=-Math.sin(r.yaw),s=-Math.cos(r.yaw),c=(e*a+t*s)/i;n.glint.visible=c>.985,n.glint.visible&&(n.glint.material.opacity=.6+.4*Math.sin(this.time*14),n.glint.position.set(.18,1.6,-.5),n.glint.quaternion.copy(this.camera.quaternion),n.glint.scale.setScalar(2+i*.05))}else n.glint.visible=!1}updateViewmodel(t,n,r){if(n.weapon!==this.vmWeapon&&(this.vmModel&&this.vmGroup.remove(this.vmModel.group),this.vmWeapon=n.weapon,this.vmModel=n.weapon?Pu(n.weapon):null,this.vmModel&&(this.addHands(this.vmModel,n.weapon),this.vmGroup.add(this.vmModel.group))),!this.vmModel||!n.weapon)return;let i=I[n.weapon],a=this.settings.leftHand?-1:1,o=this.settings.reduceMotion?.25:1;this.bob+=t*(n.speed>.5&&n.onGround?n.speed*2.3:0);let s=Math.min(1,n.speed/4.5)*(n.onGround?1:.2)*o,c=Math.sin(this.bob)*.006*s,l=Math.abs(Math.cos(this.bob))*.008*s,u=this.vmModel.group,d=i.cls,f=new G(.12*a,-.13,-.3);d===`pistol`&&f.set(.1*a,-.1,-.27),(d===`sniper`||d===`dmr`)&&f.set(.13*a,-.15,-.3),d===`melee`&&f.set(.15*a,-.17,-.36),u.scale.setScalar(d===`pistol`?.7:.62);let p=n.reloading?Math.sin(Math.min(1,n.reloadProgress)*Math.PI):0,m=1-e(n.drawProgress,0,1),h=Math.exp(-n.sinceShot*18),g=+!this.settings.reduceMotion,_=e(n.swayX*-35e-5,-.03,.03)*g,v=e(n.swayY*35e-5,-.03,.03)*g;if(u.position.set(f.x+c+_,f.y-l-p*.12-m*.25+v,f.z+h*.05*(d===`sniper`?2:1)+(n.interacting?.05:0)),u.rotation.set(h*.07+p*.5+m*.6+(n.interacting?.5:0),p*.2*a+(n.inspect>0?Math.sin(n.inspect*3)*.5:0),n.inspect>0?Math.sin(n.inspect*2.2)*.4:0),this.vmModel.mover){let e=Math.exp(-n.sinceShot*9);d===`pistol`?this.vmModel.mover.position.z=e*.03:d===`sniper`||d===`dmr`?this.vmModel.mover.position.z=n.sinceShot<.9&&n.sinceShot>.25?Math.sin((n.sinceShot-.25)*5)*.05:0:d===`shotgun`&&(this.vmModel.mover.position.z=n.sinceShot>.2&&n.sinceShot<.7?Math.sin((n.sinceShot-.2)*6.3)*.12:0)}if(this.vmGroup.scale.x=a,n.sinceShot<.045&&i.mode!==`melee`){let e=this.vmModel.muzzle.getWorldPosition(new G);this.vmMuzzle.position.copy(e),this.vmMuzzle.visible=!0,this.vmMuzzle.scale.setScalar(.12+Math.random()*.12)}else this.vmMuzzle.visible=!1}addHands(e,t){let n=I[t],r=new ro({color:1711393,roughness:.75,metalness:.1}),i=new ro({color:9082534,roughness:.85}),a=new Ki({color:3137791}),o=e.group,s=(e,t,n,r,i,a=0,s=0)=>{let c=new J(new La(e,t,n),r);c.position.copy(i),c.rotation.set(a,s,0),o.add(c)},c=e.gripHand,l=e.supportHand;s(.06,.085,.1,r,c.clone().add(new G(0,.01,0))),s(.065,.02,.07,a,c.clone().add(new G(0,-.035,.09))),s(.075,.075,.5,i,c.clone().add(new G(.03,-.06,.36)),.2,-.1),n.cls!==`pistol`&&n.cls!==`melee`?(s(.06,.07,.11,r,l.clone()),s(.065,.02,.07,a,l.clone().add(new G(0,-.04,.09))),s(.075,.075,.5,i,l.clone().add(new G(-.1,-.1,.34)),.18,.28)):n.cls===`pistol`&&(s(.055,.07,.1,r,new G(-.02,-.065,.015)),s(.075,.075,.5,i,new G(-.07,-.11,.3),.18,.3))}localShotFlash(e){this.flashLight(e,16760944,1.4,.04)}dispose(){this.renderer.dispose()}};function pd(e,t,n,r){let i=t.x-e.x,a=t.y-e.y,o=t.z-e.z,s=Math.hypot(i,a,o);if(s<1e-6)return 0;let c=i/s,l=a/s,u=o/s,d=e.x-n.x,f=e.y-n.y,p=e.z-n.z,m=d*c+f*l+p*u,h=d*d+f*f+p*p-r*r,g=m*m-h;if(g<=0)return 0;let _=Math.sqrt(g);return Math.max(0,Math.min(s,-m+_)-Math.max(0,-m-_))}var md={latency:0,jitter:0,loss:0,duplicate:0};function hd(e,t){return typeof t==`number`?Math.round(t*1e3)/1e3:t}var gd=class{cond;now=0;bytesUp=0;bytesDown=0;toServer=[];toClient=[];seq=0;rng;closed=!1;constructor(e=md,t=99){this.cond=e,this.rng=ye(t)}push(e,t){if(this.closed||this.rng()<this.cond.loss)return;let n=this.rng()<this.cond.duplicate?2:1;for(let r=0;r<n;r++){let n=(this.rng()*2-1)*this.cond.jitter;e.push({at:this.now+Math.max(0,this.cond.latency+n),data:t,seq:this.seq++})}}drain(e){let t=[],n=[];for(let r of e)(r.at<=this.now?t:n).push(r);return e.length=0,e.push(...n),t.sort((e,t)=>e.at-t.at||e.seq-t.seq),t.map(e=>JSON.parse(e.data))}client={send:e=>{let t=JSON.stringify(e,hd);this.bytesUp+=t.length,this.push(this.toServer,t)},recv:()=>this.drain(this.toClient),close:()=>{this.closed=!0}};server={send:e=>{let t=JSON.stringify(e,hd);this.bytesDown+=t.length,this.push(this.toClient,t)},recv:()=>this.drain(this.toServer),close:()=>{this.closed=!0}}},_d=[`vela`,`rook`,`needle`,`kite`,`vectora`,`aster`,`krait`,`lumen`,`longglass`,`sable`,`rampart`,`atlas`,`tool`,`util`];function vd(e){let{players:t,...n}=e,r=t.map(e=>[e.id,e.pos.x,e.pos.y,e.pos.z,e.yaw,e.pitch,e.crouch,+!!e.alive|(e.scoped?2:0)|(e.swing?4:0)|(e.reloading?8:0)|(e.spotted?16:0),_d.indexOf(e.weapon)]);return{...n,pl:r}}function yd(e){let{pl:t,...n}=e,r=t.map(e=>({id:e[0],pos:{x:e[1],y:e[2],z:e[3]},yaw:e[4],pitch:e[5],crouch:e[6],alive:!!(e[7]&1),scoped:!!(e[7]&2),swing:e[7]&4?1:0,reloading:!!(e[7]&8),spotted:!!(e[7]&16),weapon:_d[e[8]]??`util`}));return{...n,players:r}}var bd=e=>typeof e==`number`&&Number.isFinite(e),xd=e=>typeof e==`boolean`||e===void 0;function Sd(e){if(!e||typeof e!=`object`||![e.seq,e.viewTick,e.moveX,e.moveZ,e.yaw,e.pitch].every(bd))return null;for(let t of[`fire`,`alt`,`jump`,`crouch`,`walk`,`use`,`reload`,`drop`,`quick`,`inspect`])if(!xd(e[t]))return null;let t={seq:Math.floor(e.seq),viewTick:e.viewTick,moveX:e.moveX,moveZ:e.moveZ,yaw:e.yaw,pitch:e.pitch,fire:!!e.fire,alt:!!e.alt,jump:!!e.jump,crouch:!!e.crouch,walk:!!e.walk,use:!!e.use};if(e.reload&&(t.reload=!0),e.drop&&(t.drop=!0),e.quick&&(t.quick=!0),e.inspect&&(t.inspect=!0),e.select!==void 0){if(typeof e.select!=`string`||!/^(primary|secondary|tool|next|prev|util[0-3])$/.test(e.select))return null;t.select=e.select}for(let n of[`buy`,`refund`])if(e[n]!==void 0){let r=e[n];if(!r||!bd(r.req)||typeof r.item!=`string`||r.item.length>24)return null;t[n]={req:Math.floor(r.req),item:r.item}}return t}function Cd(e){if(!e||typeof e!=`object`)return null;let t=e;switch(t.t){case`hello`:return!bd(t.v)||typeof t.ruleset!=`string`||typeof t.mapHash!=`string`||typeof t.name!=`string`?null:{t:`hello`,v:t.v,ruleset:t.ruleset,mapHash:t.mapHash,name:t.name.slice(0,16)};case`input`:{let e=Sd(t.cmd);return e?{t:`input`,cmd:e}:null}case`ping`:return bd(t.ct)?{t:`ping`,ct:t.ct}:null;default:return null}}function wd(e){return t(F.standHeight,F.crouchHeight,e)}var Td=.3;function Ed(e,t,n,r){let i=wd(r.crouchQ),a=ve.headRadius,o=r.y+i-a,s=null;{let i=e.x-r.x,c=e.y-o,l=e.z-r.z,u=i*t.x+c*t.y+l*t.z,d=i*i+c*c+l*l-a*a,f=u*u-d;if(f>=0){let r=Math.sqrt(f),i=-u-r;i<0&&(i=-u+r),i>=0&&i<=n&&(s={t:i,zone:`head`,point:{x:e.x+t.x*i,y:e.y+t.y*i,z:e.z+t.z*i}})}}{let o=r.y,c=r.y+i-a*1.7,l=e.x-r.x,u=e.z-r.z,d=t.x*t.x+t.z*t.z,f=0,p=n,m=!0;if(d<1e-9)l*l+u*u>Td*Td&&(m=!1);else{let e=l*t.x+u*t.z,n=l*l+u*u-Td*Td,r=e*e-d*n;if(r<0)m=!1;else{let t=Math.sqrt(r);f=(-e-t)/d,p=(-e+t)/d}}if(m){let a=-1/0,l=1/0;if(Math.abs(t.y)<1e-9)(e.y<o||e.y>c)&&(m=!1);else{let n=(o-e.y)/t.y,r=(c-e.y)/t.y;if(n>r){let e=n;n=r,r=e}a=n,l=r}if(m){let o=Math.max(f,a,0);if(o<=Math.min(p,l,n)&&(!s||o<s.t)){let n={x:e.x+t.x*o,y:e.y+t.y*o,z:e.z+t.z*o};s={t:o,zone:Dd(n,r,i),point:n}}}}}return s}function Dd(e,t,n){let r=(e.y-t.y)/n;if(r<.48)return`leg`;let i=Math.cos(t.yaw),a=Math.sin(t.yaw),o=(e.x-t.x)*i+(e.z-t.z)*-a;return Math.abs(o)>.2&&r<.86?`arm`:r<.66?`abdomen`:`chest`}function Od(e,t){switch(t){case`head`:return e.headMult;case`chest`:return e.chestMult;case`abdomen`:return e.abdomenMult;case`arm`:return e.armMult;case`leg`:return e.legMult}}function kd(e,t,n,r){if(!(n===`head`?r.helmet:n!==`leg`&&r.armor>0))return{health:e,armorLoss:0,raw:e};let i=e*t.armorPen,a=e-i;return{health:i,armorLoss:n===`head`?0:Math.min(r.armor,a*.5),raw:e}}function Ad(e,t){return e.falloff**(t/10)}function jd(t,n,r,i,a){let o=ie(t,n,r),s=Math.max(1e-4,i.penetration),l=0,u=r,d=[],f=[],p=!1;for(let r of o){let a=c[r.box.mat],o=Math.max(0,r.t1-r.t0);if(o<1e-4)continue;if(!p){p=!0;let e={x:t.x+n.x*r.t0,y:t.y+n.y*r.t0,z:t.z+n.z*r.t0};f.push({p:e,n:Md(e,r.box),mat:r.box.mat})}if(!isFinite(a.cost)){u=r.t0;break}let m=o*a.cost;if(i.penetration<=0||l+m>=s){let t=i.penetration<=0?0:(s-l)/m;u=r.t0+o*e(t,0,1),d.push({t0:r.t0,t1:u,used0:l,cost:a.cost}),l=s;break}d.push({t0:r.t0,t1:r.t1,used0:l,cost:a.cost}),l+=m}if(n.y>1e-6){let e=(6-t.y)/n.y;e>0&&e<u&&(u=e,f.push({p:{x:t.x+n.x*e,y:6,z:t.z+n.z*e},n:{x:0,y:-1,z:0},mat:`concrete`}))}if(n.y<-1e-6){let e=-t.y/n.y;if(e>0&&e<u){u=e;let r={x:t.x+n.x*e,y:0,z:t.z+n.z*e};f.push({p:r,n:{x:0,y:1,z:0},mat:`ground`})}}let m=e=>{let t=0;for(let n of d)if(e>=n.t1)t=n.used0+(n.t1-n.t0)*n.cost;else if(e>n.t0){t=n.used0+(e-n.t0)*n.cost;break}else break;return t},h=null;for(let r of a){let i=Ed(t,n,u,r.pose);if(!i||h&&i.t>=h.dist)continue;let a=m(i.t),o=e(1-a/s,.05,1);h={id:r.id,zone:i.zone,dist:i.t,penetrated:a>0,penMult:o,point:i.point}}let g={x:t.x+n.x*u,y:t.y+n.y*u,z:t.z+n.z*u};return h&&(g=h.point,f.push({p:h.point,n:{x:-n.x,y:-n.y,z:-n.z},mat:h.zone===`head`?`head`:`player`})),{end:g,impacts:f,hit:h}}function Md(e,t){let n=[Math.abs(e.x-t.x0),Math.abs(e.x-t.x1),Math.abs(e.y-t.y0),Math.abs(e.y-t.y1),Math.abs(e.z-t.z0),Math.abs(e.z-t.z1)],r=0;for(let e=1;e<6;e++)n[e]<n[r]&&(r=e);return[{x:-1,y:0,z:0},{x:1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:1,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:1}][r]}function Nd(e,t,n,r=1){return e.damage*Od(e,t)*Ad(e,n)*r}var Pd=96,Fd=72,Id=.28,Ld=new Float32Array(Pd*Fd),Rd=new Uint8Array(Pd*Fd),zd=new Float32Array(Pd*Fd),Bd=(e,t)=>t*Pd+e;function Vd(){for(let e=0;e<Fd;e++)for(let t=0;t<Pd;t++){let n=(t+.5)*1,r=(e+.5)*1,i=te(n,r,.25,1.9,.02,!0);Ld[Bd(t,e)]=i,Rd[Bd(t,e)]=+!N(n,i,r,Id,F.standHeight)}for(let e=0;e<Fd;e++)for(let t=0;t<Pd;t++){if(!Rd[Bd(t,e)])continue;let n=0;for(let[r,i]of[[1,0],[-1,0],[0,1],[0,-1]]){let a=t+r,o=e+i;(a<0||o<0||a>=Pd||o>=Fd||!Rd[Bd(a,o)])&&(n+=.35)}zd[Bd(t,e)]=n}}Vd();function Hd(e,t,n,r){let i=Bd(e,t),a=Bd(n,r);if(!Rd[i]||!Rd[a])return!1;let o=Ld[a]-Ld[i];if(Math.abs(o)>F.stepHeight+.02&&o>0||o<-1.2||e!==n&&t!==r&&(!Rd[Bd(n,t)]||!Rd[Bd(e,r)]))return!1;let s=((e+n)/2+.5)*1,c=((t+r)/2+.5)*1;return!N(s,Math.max(Ld[i],Ld[a]),c,Id,F.standHeight)}function Ud(e,t){return[Math.min(Pd-1,Math.max(0,Math.floor(e/1))),Math.min(Fd-1,Math.max(0,Math.floor(t/1)))]}function Wd(e,t){let[n,r]=Ud(e,t);return Rd[Bd(n,r)]===1}function Gd(e,t){let[n,r]=Ud(e,t);return Ld[Bd(n,r)]}function Kd(e,t){let[n,r]=Ud(e,t);if(Rd[Bd(n,r)])return[n,r];for(let e=1;e<8;e++){let t=null,i=1/0;for(let a=-e;a<=e;a++)for(let o=-e;o<=e;o++){if(Math.max(Math.abs(o),Math.abs(a))!==e)continue;let s=n+o,c=r+a;if(s<0||c<0||s>=Pd||c>=Fd||!Rd[Bd(s,c)])continue;let l=o*o+a*a;l<i&&(i=l,t=[s,c])}if(t)return t}return null}var qd=class{keys=[];vals=[];get size(){return this.keys.length}push(e,t){let n=this.keys,r=this.vals,i=n.length;for(n.push(e),r.push(t);i>0;){let e=i-1>>1;if(n[e]<=n[i])break;[n[e],n[i]]=[n[i],n[e]],[r[e],r[i]]=[r[i],r[e]],i=e}}pop(){let e=this.keys,t=this.vals,n=t[0],r=e.pop(),i=t.pop();if(e.length){e[0]=r,t[0]=i;let n=0;for(;;){let r=n*2+1,i=r+1,a=n;if(r<e.length&&e[r]<e[a]&&(a=r),i<e.length&&e[i]<e[a]&&(a=i),a===n)break;[e[a],e[n]]=[e[n],e[a]],[t[a],t[n]]=[t[n],t[a]],n=a}}return n}},Jd=new Float32Array(Pd*Fd),Yd=new Int32Array(Pd*Fd),Xd=new Uint8Array(Pd*Fd),Zd=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[-1,1,1.4142],[1,-1,1.4142],[-1,-1,1.4142]];function Qd(e,t,n={}){let r=Kd(e.x,e.z),i=Kd(t.x,t.z);if(!r||!i)return null;let a=Bd(r[0],r[1]),o=Bd(i[0],i[1]);Jd.fill(1/0),Xd.fill(0),Yd.fill(-1);let s=new qd;Jd[a]=0,s.push(0,a);let c=i[0],l=i[1],u=!1;for(;s.size;){let e=s.pop();if(Xd[e])continue;if(Xd[e]=1,e===o){u=!0;break}let t=e%Pd,r=e/Pd|0;for(let[i,a,o]of Zd){let u=t+i,d=r+a;if(u<0||d<0||u>=Pd||d>=Fd)continue;let f=Bd(u,d);if(Xd[f]||!Hd(t,r,u,d))continue;let p=o+zd[f];n.extraCost&&(p+=n.extraCost((u+.5)*1,(d+.5)*1));let m=Jd[e]+p;if(m<Jd[f]){Jd[f]=m,Yd[f]=e;let t=Math.hypot(u-c,d-l);s.push(m+t,f)}}}if(!u)return null;let d=[],f=o;for(;f!==-1;){let e=f%Pd,t=f/Pd|0;d.push({x:(e+.5)*1,y:Ld[f],z:(t+.5)*1}),f=Yd[f]}return d.reverse(),d}function $d(e,t){let n=t.x-e.x,r=t.z-e.z,i=Math.max(1,Math.ceil(Math.hypot(n,r)/.3)),a=Gd(e.x,e.z);for(let t=1;t<=i;t++){let o=e.x+n*t/i,s=e.z+r*t/i,[c,l]=Ud(o,s);if(!Rd[Bd(c,l)])return!1;let u=Ld[Bd(c,l)];if(u-a>F.stepHeight+.02||a-u>1.2||N(o,Math.max(u,a),s,.3,F.standHeight))return!1;a=u}return!0}function ef(e,t,n={}){let r=Qd(e,t,n);if(!r)return null;let i=[{x:e.x,y:e.y,z:e.z},...r.slice(1)],a=[],o=0;for(;o<i.length-1;){let e=o+1;for(let t=i.length-1;t>o+1;t--)if($d(i[o],i[t])){e=t;break}a.push(i[e]),o=e}if(a.length){let e=a[a.length-1];Math.hypot(e.x-t.x,e.z-t.z)<1.5&&Wd(t.x,t.z)&&(a[a.length-1]={x:t.x,y:Gd(t.x,t.z),z:t.z})}return a}var tf=.11,nf=1/64,rf={concrete:.42,metal:.5,glass:.3,thin:.28,foliage:.08,crate:.34,platform:.38},af=3.1,of=.7;function sf(e,t){let n=r(e.yaw,e.pitch+.1);return{x:n.x*t+e.vel.x*.5,y:n.y*t+e.vel.y*.3,z:n.z*t+e.vel.z*.5}}function cf(e,t,n,i){let a=e.eyePos(t),o=r(t.yaw,t.pitch+.1),s={x:a.x+o.x*.45,y:a.y+o.y*.45-.1,z:a.z+o.z*.45},c=ae(a,o,.5);c&&(s={x:a.x+o.x*Math.max(0,c.t0-.15),y:a.y+o.y*Math.max(0,c.t0-.15)-.05,z:a.z+o.z*Math.max(0,c.t0-.15)});let l={id:e.nextId(),type:n,owner:t.id,side:t.side,pos:s,vel:sf(t,i),born:e.time,detonateAt:n===`flash`?e.time+1.5:n===`frag`?e.time+1.9:-1,landed:!1,landedAt:0,bounces:0,sleep:!1,pulses:0,nextPulse:0,destroyed:!1};return e.grenades.push(l),e.emit({t:`sfx`,id:t.id,kind:`throw`,p:{...t.pos}}),l}function lf(e){e.vel.y-=18*nf;let t={x:e.pos.x+e.vel.x*nf,y:e.pos.y+e.vel.y*nf,z:e.pos.z+e.vel.z*nf},n=!1,r,i=!1,a=ce(e.pos,t,tf);if(a&&a.t<1){let o=e.pos.x+(t.x-e.pos.x)*a.t,s=e.pos.y+(t.y-e.pos.y)*a.t,c=e.pos.z+(t.z-e.pos.z)*a.t,l=rf[a.box.mat],u=e.vel.x*a.nx+e.vel.y*a.ny+e.vel.z*a.nz;u<0&&(e.vel.x-=(1+l)*u*a.nx,e.vel.y-=(1+l)*u*a.ny,e.vel.z-=(1+l)*u*a.nz,a.ny>.7?(e.vel.x*=.82,e.vel.z*=.82,i=!0):(e.vel.x*=.9,e.vel.y*=.95,e.vel.z*=.9),-u>1.2&&(n=!0,r=a.box.mat,e.bounces++)),e.pos.x=o+a.nx*.004,e.pos.y=s+a.ny*.004,e.pos.z=c+a.nz*.004}else e.pos.x=t.x,e.pos.y=t.y,e.pos.z=t.z;e.pos.y<.11&&(e.pos.y=tf,e.vel.y<0&&(-e.vel.y>1.2&&(n=!0,r??=`concrete`,e.bounces++),e.vel.y=-e.vel.y*.4,Math.abs(e.vel.y)<1&&(e.vel.y=0),e.vel.x*=.8,e.vel.z*=.8),i=!0),e.pos.y>5.89&&(e.pos.y=6-tf,e.vel.y>0&&(e.vel.y=-e.vel.y*.3)),e.pos.x<.11&&(e.pos.x=tf,e.vel.x=Math.abs(e.vel.x)*.4),e.pos.z<.11&&(e.pos.z=tf,e.vel.z=Math.abs(e.vel.z)*.4),e.pos.x>95.89&&(e.pos.x=96-tf,e.vel.x=-Math.abs(e.vel.x)*.4),e.pos.z>71.89&&(e.pos.z=72-tf,e.vel.z=-Math.abs(e.vel.z)*.4);let o=Math.hypot(e.vel.x,e.vel.y,e.vel.z);return i&&o<.9&&(e.vel.x=e.vel.y=e.vel.z=0,e.sleep=!0,e.landed=!0),{bounced:n,mat:r,speed:o}}function uf(e,t,n=320){let r={pos:{...e},vel:{...t},bounces:0,sleep:!1,landed:!1},i=[{...r.pos}],a=0;for(;a<n&&(lf(r),a%4==0&&i.push({...r.pos}),!r.sleep);a++);return i.push({...r.pos}),{end:{...r.pos},path:i,steps:a}}function df(e){if(e.grenades.length){for(let t of e.grenades)if(!t.destroyed){if(!t.sleep){let n=lf(t);n.bounced&&e.emit({t:`nade`,kind:`bounce`,type:t.type,p:{...t.pos},id:t.id,owner:t.owner,side:t.side,data:[n.mat===`glass`?1:n.mat===`metal`?2:0]}),t.landed&&t.landedAt===0&&(t.landedAt=e.time)}switch(t.type){case`flash`:e.time>=t.detonateAt&&(ff(e,t),t.destroyed=!0);break;case`frag`:e.time>=t.detonateAt&&(pf(e,t),t.destroyed=!0);break;case`veil`:(t.landed&&e.time-t.landedAt>.35||e.time-t.born>4)&&(mf(e,t),t.destroyed=!0);break;case`thermite`:(t.landed&&e.time-t.landedAt>.2||e.time-t.born>3)&&(gf(e,t),t.destroyed=!0);break;case`pulse`:_f(e,t)}}e.grenades=e.grenades.filter(e=>!e.destroyed),e.smokes=e.smokes.filter(t=>e.time<t.until)}}function ff(t,n){let i=t.players[n.owner];t.emit({t:`nade`,kind:`flash`,type:`flash`,p:{...n.pos},id:n.id,owner:n.owner,side:n.side});for(let a of t.players){if(!a.alive)continue;let o=t.eyePos(a),s=n.pos.x-o.x,c=n.pos.y-o.y,l=n.pos.z-o.z,u=Math.hypot(s,c,l);if(u>32||!oe(n.pos,o)||t.isSmoked(n.pos,o))continue;let d=r(a.yaw,a.pitch),f=e(((d.x*s+d.y*c+d.z*l)/Math.max(u,.001)+.4)/1.4,0,1),p=e(1-u/32,.12,1),m=.3+3.6*f**1.6*p,h=t.time+m;h>a.flashUntil&&(a.flashUntil=h,a.flashFull=t.time+m*.5),i&&a.side!==i.side&&m>.8&&i.stats.flashed++}}function pf(e,t){let n=e.players[t.owner];e.emit({t:`nade`,kind:`frag`,type:`frag`,p:{...t.pos},id:t.id,owner:t.owner,side:t.side});let r={x:t.pos.x,y:t.pos.y+.35,z:t.pos.z};for(let t of e.players){if(!t.alive||n&&t.side===n.side&&t.id!==n.id)continue;let i={x:t.pos.x,y:t.pos.y+1,z:t.pos.z},a=Math.hypot(i.x-r.x,i.y-r.y,i.z-r.z);if(a>8||se(r,i))continue;let o=(1-a/8)**1.1,s=165*o,c=t.armor>0?s*.72:s,l=Math.hypot(i.x-r.x,i.z-r.z)||1;t.vel.x+=(i.x-r.x)/l*7*o,t.vel.z+=(i.z-r.z)/l*7*o,t.vel.y=Math.max(t.vel.y,2.2*o),t.onGround=o<.25&&t.onGround,e.applyDamage(t,n??null,c,t.armor>0?s*.14:0,`chest`,`frag`,`frag`,!1,!1)}}function mf(e,t){let n={id:e.nextId(),pos:{x:t.pos.x,y:t.pos.y+1.5,z:t.pos.z},radius:af,bloomAt:e.time+of,until:e.time+of+17};for(e.smokes.push(n);e.smokes.length>4;)e.smokes.shift();e.emit({t:`nade`,kind:`veil`,type:`veil`,p:{...n.pos},id:n.id,owner:t.owner,side:t.side})}function hf(e,t,n,r){let i=[],a=Math.floor(e)+.5,o=Math.floor(t)+.5;if(!Wd(a,o))return i;let s=new Set,c=[[a,o]];for(s.add(`${a},${o}`);c.length&&i.length<r;){let[e,t]=c.shift();i.push({x:e,y:Gd(e,t),z:t});for(let[r,i]of[[1,0],[-1,0],[0,1],[0,-1]]){let l=e+r,u=t+i,d=`${l},${u}`;s.has(d)||Math.hypot(l-a,u-o)>n||Wd(l,u)&&$d({x:e,y:Gd(e,t),z:t},{x:l,y:Gd(l,u),z:u})&&(s.add(d),c.push([l,u]))}}return i}function gf(e,t){let n=hf(t.pos.x,t.pos.z,3.2,26);n.length||n.push({x:t.pos.x,y:Math.max(0,t.pos.y-tf),z:t.pos.z});let r={id:e.nextId(),owner:t.owner,cells:n,until:e.time+7};e.fires.push(r),e.emit({t:`nade`,kind:`thermite`,type:`thermite`,p:{...t.pos},id:r.id,owner:t.owner,side:t.side,data:n.flatMap(e=>[e.x,e.y,e.z])})}function _f(e,t){if(t.landed){if(t.pulses===0&&t.nextPulse===0&&(t.nextPulse=t.landedAt+.5),t.pulses<2&&e.time>=t.nextPulse){t.pulses++,t.nextPulse=t.landedAt+.5+1.5*t.pulses;let n=[];for(let r of e.players){if(!r.alive||r.side===t.side)continue;let e=r.pos.x-t.pos.x,i=r.pos.z-t.pos.z,a=Math.hypot(e,i);if(a>22||Math.hypot(r.vel.x,r.vel.z)<1)continue;let o=(Math.atan2(e,-i)+Math.PI*2)%(Math.PI*2),s=Math.round(o/(Math.PI/4))%8,c=a<8?0:a<15?1:2;n.push(s,c)}e.emit({t:`nade`,kind:`pulsePing`,type:`pulse`,p:{...t.pos},id:t.id,owner:t.owner,side:t.side,data:n})}t.pulses>=2&&e.time>t.landedAt+3.6&&(t.destroyed=!0)}}var vf=1/64,yf=24,bf=[`Vesper`,`Halcyon`,`Quill`,`Ember`,`Tarn`,`Juno`,`Cobalt`,`Sable`,`Pike`,`Mira`,`Orrin`,`Lyra`,`Dax`,`Nova`,`Fenn`,`Iris`,`Rue`,`Kestrel`,`Wren`,`Brine`];function xf(){return{kills:0,deaths:0,assists:0,damage:0,headshots:0,shots:0,hits:0,plants:0,defuses:0,utilDamage:0,flashed:0,openingKills:0,spent:0,score:0}}function Sf(e){return{seq:e,viewTick:0,moveX:0,moveZ:0,yaw:0,pitch:0,fire:!1,alt:!1,jump:!1,crouch:!1,walk:!1,use:!1}}P.vest.price,P.helmetUpgrade,P.vestHelmet.price,P.kit.price;var Cf=class{cfg;rules;rng;tick=0;time=0;players=[];phase=`buy`;phaseEnds=0;round=0;liveStart=0;score=[0,0];squadSide;lossTier=[0,0];spike;grenades=[];smokes=[];fires=[];drops=[];events=[];rounds=[];winnerSquad=null;plantedThisRound=!1;firstKill=null;lastRoundEnd=null;hist=[];brains=new Map;idSeq=1;moneyBefore=[0,0];equipAtLive=[0,0];halfDone=!1;rulesetVersion=de;constructor(e){this.cfg=e,this.rules=e.rules,this.rng=ye(e.seed),this.squadSide=[e.squad0Side,e.squad0Side===`int`?`cus`:`int`],this.spike=this.freshSpike(),this.createPlayers(),this.startRound()}nextId(){return this.idSeq++}emit(e){this.events.push(e)}createPlayers(){for(let e=0;e<10;e++){let t=e<5?0:1,n=this.cfg.humanIds.includes(e),r=this.cfg.names?.[e]??(n?`You`:bf[e%bf.length]);this.players.push(this.makePlayer(e,t,r,n?`human`:`bot`))}}makePlayer(e,t,n,r){return{id:e,name:n,squad:t,side:this.squadSide[t],controller:r,pos:{x:0,y:0,z:0},vel:{x:0,y:0,z:0},yaw:0,pitch:0,crouch:0,onGround:!0,alive:!0,hp:100,armor:0,helmet:!1,armorFresh:!1,kit:!1,spike:!1,money:me.startMoney,slots:{primary:null,secondary:Ju(`vela`),tool:Ju(`tool`)},cur:`secondary`,prev:`tool`,util:[],utilBought:{},throwHeld:0,interact:{kind:null,progress:0},stats:xf(),killedRound:!1,landPenalty:0,flashUntil:0,flashFull:0,lastSeq:-1,lastCmd:null,cmdQueue:[],starve:0,processedReqs:new Set,purchases:[],damagers:new Map,stepAcc:0,stance:0,ping:0,dropLock:0,inspectUntil:0,swing:0,lastHurtDir:0,connected:!0,firePrev:!1,altPrev:!1,usePrev:!1,jumpPrev:!1,idleSince:0}}freshSpike(){return{state:`carried`,carrier:-1,pos:{x:0,y:0,z:0},site:null,plantedAt:0,explodeAt:0,nextBeep:0,defuser:-1,defuseProgress:0,defuseNeeded:ge.defuseTime}}playersOf(e){return this.players.filter(t=>t.side===e)}alive(e){return this.players.filter(t=>t.side===e&&t.alive)}squadOf(e){return this.squadSide[0]===e?0:1}intSquad(){return this.squadOf(`int`)}setSidesForSquad0(e){this.squadSide=[e,e===`int`?`cus`:`int`];for(let e of this.players)e.side=this.squadSide[e.squad]}resetLoadout(e){e.armor=0,e.helmet=!1,e.armorFresh=!1,e.kit=!1,e.slots={primary:null,secondary:Ju(`vela`),tool:Ju(`tool`)},e.util=[],e.utilBought={},e.spike=!1}startRound(){this.round++,this.grenades=[],this.smokes=[],this.fires=[],this.drops=[],this.spike=this.freshSpike(),this.plantedThisRound=!1,this.firstKill=null,this.lastRoundEnd=null;for(let e of[`cus`,`int`])this.players.filter(t=>t.side===e).forEach((t,n)=>{t.alive||this.resetLoadout(t),t.alive=!0,t.hp=100,t.killedRound=!1,t.spike=!1,t.vel={x:0,y:0,z:0};let r=x[e][n%5];t.pos={x:r.x,y:0,z:r.z},t.yaw=r.yaw,t.pitch=0,t.crouch=0,t.onGround=!0,t.landPenalty=0,t.flashUntil=0,t.flashFull=0,t.interact={kind:null,progress:0},t.purchases=[],t.processedReqs=new Set,t.damagers=new Map,t.cmdQueue=[],t.starve=0,t.lastCmd=null,t.firePrev=t.altPrev=t.usePrev=t.jumpPrev=!1,t.utilBought={},t.armorFresh=!1,t.cur=t.slots.primary?`primary`:`secondary`,t.prev=`tool`;for(let e of[t.slots.primary,t.slots.secondary,t.slots.tool])e&&(e.nextFire=0,e.readyAt=this.time+.2,e.reloading=!1,e.shots=0,e.lastShot=-100,e.heat=0,e.burstLeft=0,e.fresh=!1,e.scopeLevel=0);t.kit&&e!==`cus`&&(t.kit=!1)});let e=this.players.filter(e=>e.side===`int`),t=e[Math.floor(this.rng()*e.length)];t.spike=!0,this.spike.carrier=t.id,this.moneyBefore=[this.teamMoney(0),this.teamMoney(1)],this.phase=`buy`,this.phaseEnds=this.time+he.buy,this.emit({t:`phase`,phase:`buy`,round:this.round,at:this.time})}teamMoney(e){return this.players.filter(t=>t.squad===e).reduce((e,t)=>e+t.money,0)}equipValue(e){let t=Qu(e.slots.primary)+(e.slots.secondary&&e.slots.secondary.id!==`vela`?Qu(e.slots.secondary):0);t+=e.armor>0?P.vest.price:0,t+=e.helmet?P.helmetUpgrade:0,t+=e.kit?P.kit.price:0;for(let n of e.util)t+=fe[n].price;return t}beginLive(){this.phase=`live`,this.liveStart=this.time,this.phaseEnds=this.time+he.action,this.equipAtLive=[this.players.filter(e=>e.squad===0).reduce((e,t)=>e+this.equipValue(t),0),this.players.filter(e=>e.squad===1).reduce((e,t)=>e+this.equipValue(t),0)],this.emit({t:`phase`,phase:`live`,round:this.round,at:this.time})}endRound(e,t){if(this.phase===`roundEnd`||this.phase===`matchEnd`||this.phase===`halftime`)return;let n=this.squadSide[e];this.score[e]++,this.lastRoundEnd={winnerSquad:e,winnerSide:n,reason:t},this.intSquad();for(let n of[0,1]){let r=n===e,i=this.squadSide[n],a=this.lossTier[n],o=0;r?o+=me.roundWin:(o+=me.lossBase+me.lossStep*a,i===`int`&&t===`timeExpired`&&!this.plantedThisRound&&(o-=me.timeoutNoArmPenalty)),i===`int`&&this.plantedThisRound&&(o+=me.armTeam);for(let e of this.players.filter(e=>e.squad===n))this.addMoney(e,o,r?`Round won`:`Round lost`);this.lossTier[n]=r?Math.max(0,a-1):Math.min(me.lossMaxTier,a+1)}this.rounds.push({round:this.round,winnerSide:n,winnerSquad:e,reason:t,planted:this.plantedThisRound,duration:this.time-this.liveStart,moneyBefore:this.moneyBefore,equipValue:this.equipAtLive,score:[this.score[0],this.score[1]],firstKill:this.firstKill??void 0});for(let e of this.players)e.interact={kind:null,progress:0};this.phase=`roundEnd`,this.phaseEnds=this.time+he.roundEnd,this.emit({t:`roundEnd`,winnerSquad:e,winnerSide:n,reason:t,score:[this.score[0],this.score[1]]}),this.emit({t:`phase`,phase:`roundEnd`,round:this.round,at:this.time})}matchResult(){let[e,t]=this.score,n=this.rules;return Math.max(e,t)>=n.winRounds&&Math.abs(e-t)>=n.winBy?{winner:e>t?0:1}:e+t>=n.maxRounds?{winner:e>t?0:t>e?1:-1}:null}resetEconomyForSwap(e){for(let t of this.players)this.resetLoadout(t),t.alive=!1,t.money=e;this.lossTier=[0,0]}advanceAfterRoundEnd(){let e=this.matchResult();if(e){this.phase=`matchEnd`,this.winnerSquad=e.winner,this.phaseEnds=1/0,this.emit({t:`phase`,phase:`matchEnd`,round:this.round,at:this.time});return}let t=this.score[0]+this.score[1],n=this.rules.halfRounds*2,r=!1,i=me.startMoney;t===this.rules.halfRounds?r=!0:t>=n&&(t-n)%2==0&&(r=!0,i=2400),r?(this.setSidesForSquad0(this.squadSide[0]===`int`?`cus`:`int`),this.resetEconomyForSwap(i),this.phase=`halftime`,this.phaseEnds=this.time+he.halftime,this.emit({t:`phase`,phase:`halftime`,round:this.round,at:this.time}),this.emit({t:`info`,text:t===this.rules.halfRounds?`Halftime: sides swap`:`Overtime: sides swap`})):this.startRound()}addMoney(t,n,r){if(this.cfg.practice){t.money=me.cap;return}let i=t.money;t.money=e(t.money+n,0,me.cap);let a=t.money-i;a!==0&&this.emit({t:`econ`,id:t.id,delta:a,reason:r})}submitInput(e,t){let n=this.players[e];return!n||!n.connected||!Ef(t)||t.seq<=n.lastSeq||n.cmdQueue.some(e=>e.seq===t.seq)?!1:(n.cmdQueue.length>=24&&n.cmdQueue.shift(),n.cmdQueue.push(t),n.cmdQueue.sort((e,t)=>e.seq-t.seq),!0)}pullCmd(e){let t=e.cmdQueue.shift();if(t)return e.starve=0,e.lastSeq=t.seq,e.lastCmd=t,t;e.starve++;let n={...e.lastCmd??Sf(e.lastSeq),reload:!1,drop:!1,quick:!1,inspect:!1,select:void 0,buy:void 0,refund:void 0};return e.starve>20&&(n.moveX=0,n.moveZ=0,n.fire=!1,n.alt=!1,n.jump=!1,n.use=!1),n}step(){this.tick++,this.time=this.tick*vf,this.events=[];for(let e of this.players){let t=this.brains.get(e.id);if(t&&e.controller===`bot`){let n=t.think(this,e);n.seq=e.lastSeq+1,n.viewTick=this.tick,e.cmdQueue.push(n)}}for(let e of this.players){let t=this.pullCmd(e);this.processCmd(e,t)}switch(this.separatePlayers(),df(this),this.stepFires(),this.stepSpike(),this.stepFlashRecovery(),this.phase){case`buy`:this.time>=this.phaseEnds&&this.beginLive();break;case`live`:case`armed`:this.checkRoundEnd();break;case`roundEnd`:this.time>=this.phaseEnds&&this.advanceAfterRoundEnd();break;case`halftime`:this.time>=this.phaseEnds&&this.startRound()}this.hist.push({tick:this.tick,poses:this.players.map(e=>this.poseOf(e))}),this.hist.length>yf&&this.hist.shift()}separatePlayers(){let e=this.players;for(let t=0;t<e.length;t++){let n=e[t];if(n.alive)for(let r=t+1;r<e.length;r++){let t=e[r];if(!t.alive||Math.abs(n.pos.y-t.pos.y)>1.2)continue;let i=t.pos.x-n.pos.x,a=t.pos.z-n.pos.z,o=Math.hypot(i,a),s=.62;if(o>=s)continue;let c=o>1e-4?i/o:1,l=o>1e-4?a/o:0,u=(s-o)/2,d=n.pos.x-c*u,f=n.pos.z-l*u,p=t.pos.x+c*u,m=t.pos.z+l*u;N(d,n.pos.y,f,F.halfWidth,Vu(n))||(n.pos.x=d,n.pos.z=f),N(p,t.pos.y,m,F.halfWidth,Vu(t))||(t.pos.x=p,t.pos.z=m)}}}stepFlashRecovery(){}poseOf(e){return{x:e.pos.x,y:e.pos.y,z:e.pos.z,yaw:e.yaw,crouchQ:o(e.crouch,.25)}}eyePos(e){return{x:e.pos.x,y:e.pos.y+Hu(e.crouch),z:e.pos.z}}poseAt(e,t){for(let n=this.hist.length-1;n>=0;n--)if(this.hist[n].tick<=t)return this.hist[n].poses[e.id];return this.hist.length?this.hist[0].poses[e.id]:this.poseOf(e)}fireAllowed(){return this.phase===`live`||this.phase===`armed`||this.cfg.practice===!0&&this.phase===`buy`}processCmd(t,n){if(t.yaw=i(n.yaw),t.pitch=e(n.pitch,-1.55,1.55),n.buy&&this.handleBuy(t,n.buy.req,n.buy.item),n.refund&&this.handleRefund(t,n.refund.req,n.refund.item),!t.alive){t.firePrev=n.fire;return}let r=this.phase===`halftime`||this.phase===`matchEnd`;n.select&&this.selectItem(t,n.select),n.quick&&this.selectItem(t,t.prev),n.drop&&this.dropCurrent(t),n.reload&&this.startReload(t),n.inspect&&(t.inspectUntil=this.time+2.2),n.use&&!t.usePrev&&this.tryPickup(t);let a=this.updateInteract(t,n),o={moveX:n.moveX,moveZ:n.moveZ,jump:n.jump,crouch:n.crouch,walk:n.walk};t.crouch,Ku(t,o,{dt:vf,time:this.time,locked:r||a,confine:this.phase===`buy`&&!this.cfg.practice?S[t.side]:null,emit:e=>this.events.push(e)}),this.updateReload(t),!r&&!a?this.updateFire(t,n):(t.firePrev=n.fire,t.altPrev=n.alt),t.usePrev=n.use,t.jumpPrev=n.jump,this.autoPickupSpike(t)}heldSlotWeapon(e){return e.cur===`primary`?e.slots.primary:e.cur===`secondary`?e.slots.secondary:e.cur===`tool`?e.slots.tool:null}heldWeapon(e){return this.heldSlotWeapon(e)}heldDef(e){let t=this.heldSlotWeapon(e);return t?I[t.id]:null}selectItem(e,t){let n=null,r=[];if(e.slots.primary&&r.push(`primary`),e.slots.secondary&&r.push(`secondary`),r.push(`tool`),e.util.forEach((e,t)=>r.push(`util${t}`)),t===`next`||t===`prev`)n=r[(r.indexOf(e.cur)+(t===`next`?1:-1)+r.length)%r.length];else if(t===`primary`||t===`secondary`||t===`tool`){if(t===`primary`&&!e.slots.primary||t===`secondary`&&!e.slots.secondary)return;n=t}else if(t.startsWith(`util`)){let r=Number(t.slice(4));r<e.util.length&&(n=`util${r}`)}if(!n||n===e.cur)return;e.cur.startsWith(`util`)||(e.prev=e.cur);let i=this.heldSlotWeapon(e);i&&(i.reloading=!1,i.scopeLevel=0,i.burstLeft=0),e.cur=n;let a=this.heldSlotWeapon(e),o=a?I[a.id]:null;a&&o&&(a.readyAt=this.time+o.drawTime),e.throwHeld=0,this.emit({t:`sfx`,id:e.id,kind:`draw`,p:{...e.pos},weapon:a?.id})}startReload(e){let t=this.heldSlotWeapon(e);if(!t)return;let n=I[t.id];n.mode===`melee`||t.reloading||t.mag>=n.mag||t.reserve<=0||this.time<t.readyAt||(t.reloading=!0,t.scopeLevel=0,t.reloadEnd=this.time+n.reloadTime,this.emit({t:`sfx`,id:e.id,kind:`reload`,p:{...e.pos},weapon:t.id}))}updateReload(e){let t=this.heldSlotWeapon(e);if(!t||!t.reloading)return;let n=I[t.id];if(!(this.time<t.reloadEnd)){if(n.shellTime)t.mag++,t.reserve--,t.mag<n.mag&&t.reserve>0?(t.reloadEnd=this.time+n.shellTime,this.emit({t:`sfx`,id:e.id,kind:`reload`,p:{...e.pos},weapon:t.id})):t.reloading=!1;else{let e=n.mag-t.mag,r=Math.min(e,t.reserve);t.mag+=r,t.reserve-=r,t.reloading=!1}}}dropCurrent(e){if(this.time<e.dropLock)return;let t=e.cur;if(t!==`primary`&&t!==`secondary`)return;let n=e.slots[t];n&&(e.slots[t]=null,n.reloading=!1,n.fresh=!1,this.spawnDrop(n,e,!0),e.dropLock=this.time+.4,e.cur=e.slots.primary?`primary`:e.slots.secondary?`secondary`:`tool`,this.emit({t:`sfx`,id:e.id,kind:`drop`,p:{...e.pos}}))}spawnDrop(t,n,i){let a=r(n.yaw,0),o=i?.9:0,s=e(n.pos.x+a.x*o,.5,95.5),c=e(n.pos.z+a.z*o,.5,71.5);this.drops.push({id:this.nextId(),weapon:t,pos:{x:s,y:n.pos.y,z:c},born:this.time})}tryPickup(e){let t=null,n=1.9;for(let r of this.drops){let i=Math.hypot(r.pos.x-e.pos.x,r.pos.z-e.pos.z);i<n&&Math.abs(r.pos.y-e.pos.y)<1.2&&(n=i,t=r)}if(!t)return;let r=I[t.weapon.id],i=r.slot===`secondary`?`secondary`:`primary`,a=e.slots[i];a&&(a.reloading=!1,this.spawnDrop(a,e,!1)),e.slots[i]=t.weapon,t.weapon.readyAt=this.time+r.drawTime,t.weapon.reloading=!1,this.drops=this.drops.filter(e=>e!==t),e.cur=i,this.emit({t:`sfx`,id:e.id,kind:`pickup`,p:{...e.pos},weapon:t.weapon.id})}inBuyZone(e){return this.cfg.practice?!0:T(S[e.side],e.pos.x,e.pos.z)}canBuyNow(e){return e.alive?this.cfg.practice?this.phase!==`matchEnd`&&this.phase!==`halftime`:this.phase===`buy`&&this.inBuyZone(e):!1}priceOf(e,t){return t===`vesthelmet`?P.vestHelmet.price-(e.armor>=100?P.vest.price:0)-(e.helmet?P.helmetUpgrade:0):t===`vest`?P.vest.price:t===`helmet`?P.helmetUpgrade:t===`kit`?P.kit.price:t in fe?fe[t].price:t in I?I[t].price:-1}handleBuy(e,t,n){if(e.processedReqs.has(t))return!1;e.processedReqs.add(t);let r=r=>(this.emit({t:`buy`,id:e.id,item:n,ok:!1,reason:r,req:t}),!1);if(!this.canBuyNow(e))return r(this.phase===`buy`?`Out of buy zone`:`Buy phase over`);let i=this.priceOf(e,n);if(i<0)return r(`Unknown item`);if(i===0)return r(`Nothing to buy`);if(e.money<i)return r(`Not enough money`);if(n in I){let t=I[n];if(t.slot===`tool`)return r(`Not for sale`);let i=t.slot===`secondary`?`secondary`:`primary`,a=e.slots[i];if(a&&a.id===t.id&&!this.cfg.practice)return r(`Already owned`);a&&this.spawnDrop(a,e,!1);let o=Ju(t.id,!0);o.readyAt=this.time+t.drawTime,e.slots[i]=o,e.cur=i}else if(n===`vest`){if(e.armor>=100)return r(`Already owned`);e.armor=100,e.armorFresh=!0}else if(n===`helmet`){if(e.helmet)return r(`Already owned`);e.helmet=!0}else if(n===`vesthelmet`){if(e.armor>=100&&e.helmet)return r(`Already owned`);e.armor=100,e.helmet=!0,e.armorFresh=!0}else if(n===`kit`){if(e.side!==`cus`)return r(`Custodians only`);if(e.kit)return r(`Already owned`);e.kit=!0}else if(n in fe){let t=fe[n];if(e.util.length>=4)return r(`Utility slots full`);if(e.util.filter(e=>e===t.id).length>=t.max)return r(`At carry limit`);e.util.push(t.id),e.utilBought[t.id]=(e.utilBought[t.id]??0)+1}return this.cfg.practice?e.money=me.cap:e.money-=i,e.stats.spent+=i,e.purchases.push({item:n,price:i}),this.emit({t:`buy`,id:e.id,item:n,ok:!0,req:t}),!0}handleRefund(t,n,r){if(t.processedReqs.has(n))return!1;t.processedReqs.add(n);let i=e=>(this.emit({t:`buy`,id:t.id,item:r,ok:!1,reason:e,req:n,refund:!0}),!1);if(!this.canBuyNow(t)||this.cfg.practice)return i(`Refunds only during buy phase`);let a=[...t.purchases].map(e=>e.item).lastIndexOf(r);if(a<0)return i(`Not purchased this round`);let o=t.purchases[a];if(r in I){let e=I[r],n=e.slot===`secondary`?`secondary`:`primary`,a=t.slots[n];if(!a||a.id!==e.id||!a.fresh)return i(`Item no longer refundable`);t.slots[n]=n===`secondary`?Ju(`vela`):null,t.cur===n&&(t.cur=t.slots.primary?`primary`:`secondary`)}else if(r===`vest`||r===`vesthelmet`){if(!t.armorFresh)return i(`Armour was damaged`);t.armor=0,r===`vesthelmet`&&(t.helmet=!1)}else if(r===`helmet`)t.helmet=!1;else if(r===`kit`)t.kit=!1;else if(r in fe){let e=r,n=t.util.lastIndexOf(e);if(n<0)return i(`Already used`);t.util.splice(n,1),t.utilBought[e]=Math.max(0,(t.utilBought[e]??1)-1),t.cur.startsWith(`util`)&&(t.cur=t.slots.primary?`primary`:`secondary`)}return t.purchases.splice(a,1),t.money=e(t.money+o.price,0,me.cap),t.stats.spent-=o.price,this.emit({t:`buy`,id:t.id,item:r,ok:!0,req:n,refund:!0}),!0}updateInteract(e,t){let n=e.interact;if(e.side===`int`&&e.spike&&this.phase===`live`&&t.use&&e.onGround){let t=[`A`,`B`].find(t=>T(b[t],e.pos.x,e.pos.z));if(t)return n.kind!==`arm`&&(n.kind=`arm`,n.progress=0,this.emit({t:`spike`,kind:`armStart`,p:{...e.pos},id:e.id})),n.progress+=vf,n.progress>=ge.armTime?(this.plant(e,t),n.kind=null,n.progress=0,!1):!0}if(n.kind===`arm`&&(this.emit({t:`spike`,kind:`armCancel`,p:{...e.pos},id:e.id}),n.kind=null,n.progress=0),e.side===`cus`&&this.phase===`armed`&&this.spike.state===`planted`&&t.use){let t=this.spike;if(Math.hypot(t.pos.x-e.pos.x,t.pos.z-e.pos.z)<=ge.defuseRange&&Math.abs(t.pos.y-e.pos.y)<1.6&&(t.defuser===-1||t.defuser===e.id))return n.kind!==`defuse`&&(n.kind=`defuse`,n.progress=0,t.defuser=e.id,t.defuseNeeded=e.kit?ge.defuseTimeKit:ge.defuseTime,this.emit({t:`spike`,kind:`defuseStart`,p:{...e.pos},id:e.id})),n.progress+=vf,t.defuseProgress=n.progress,n.progress>=t.defuseNeeded?(t.state=`defused`,this.emit({t:`spike`,kind:`defused`,p:{...t.pos},id:e.id}),e.stats.defuses++,this.addMoney(e,me.defusePersonal,`Defuse`),n.kind=null,n.progress=0,t.defuser=-1,this.endRound(e.squad,`disarmed`),!1):!0}return n.kind===`defuse`&&(this.emit({t:`spike`,kind:`defuseCancel`,p:{...e.pos},id:e.id}),n.kind=null,n.progress=0,this.spike.defuser===e.id&&(this.spike.defuser=-1,this.spike.defuseProgress=0)),!1}plant(e,t){let n=this.spike;n.state=`planted`,n.site=t,n.pos={x:e.pos.x,y:e.pos.y,z:e.pos.z},n.plantedAt=this.time,n.explodeAt=this.time+he.armed,n.nextBeep=this.time+1,n.carrier=-1,e.spike=!1,e.stats.plants++,this.plantedThisRound=!0,this.phase=`armed`,this.phaseEnds=n.explodeAt,this.addMoney(e,me.armPersonal,`Spike armed`),this.emit({t:`spike`,kind:`planted`,p:{...n.pos},id:e.id}),this.emit({t:`phase`,phase:`armed`,round:this.round,at:this.time})}autoPickupSpike(e){let t=this.spike;t.state===`dropped`&&e.side===`int`&&e.alive&&Math.hypot(t.pos.x-e.pos.x,t.pos.z-e.pos.z)<1.4&&Math.abs(t.pos.y-e.pos.y)<1.4&&(t.state=`carried`,t.carrier=e.id,e.spike=!0,this.emit({t:`spike`,kind:`pickup`,p:{...t.pos},id:e.id}))}stepSpike(){let e=this.spike;if(e.state!==`planted`)return;let t=e.explodeAt-this.time;if(this.time>=e.nextBeep&&t>0&&(this.emit({t:`spike`,kind:`beep`,p:{...e.pos},id:-1,remaining:t}),e.nextBeep+=ge.beepInterval(t)),t<=0){e.state=`exploded`,this.emit({t:`spike`,kind:`explode`,p:{...e.pos},id:-1});for(let t of this.players){if(!t.alive)continue;let n=Math.hypot(t.pos.x-e.pos.x,t.pos.z-e.pos.z);if(n>16)continue;let r=n<8?400:400*(1-(n-8)/8);this.applyDamage(t,null,r,0,`chest`,`world`,`spike`,!1,!1)}this.endRound(this.intSquad(),`detonated`)}}stepFires(){if(this.fires.length){for(let e of this.fires)for(let t of this.players){if(!t.alive||!t.onGround)continue;let n=this.players[e.owner];if(n&&t.side===n.side&&t.id!==n.id)continue;let r=!1;for(let n of e.cells)if(Math.abs(n.x-t.pos.x)<.6&&Math.abs(n.z-t.pos.z)<.6&&Math.abs(n.y-t.pos.y)<.7){r=!0;break}r&&this.applyDamage(t,n??null,15*vf*2.2,0,`leg`,`fire`,`fire`,!1,!1)}this.fires=this.fires.filter(e=>this.time<e.until||(this.emit({t:`nade`,kind:`fireEnd`,type:`thermite`,p:e.cells[0]??{x:0,y:0,z:0},id:e.id,owner:e.owner,side:`int`}),!1))}}updateFire(e,t){let n=t.fire&&!e.firePrev,r=t.alt&&!e.altPrev;if(e.firePrev=t.fire,e.altPrev=t.alt,!this.fireAllowed())return;if(e.cur.startsWith(`util`)){let t=Number(e.cur.slice(4)),i=e.util[t];if(i&&this.time>=e.dropLock&&(n||r)){e.util.splice(t,1),e.utilBought[i]=Math.max(0,(e.utilBought[i]??1)-1);let r=[...e.purchases].map(e=>e.item).lastIndexOf(i);r>=0&&e.purchases.splice(r,1),cf(this,e,i,n?20:9),e.cur=e.prev;let a=this.heldSlotWeapon(e);a&&(a.readyAt=this.time+.4),e.dropLock=this.time+.5}return}let i=this.heldSlotWeapon(e);if(!i)return;let a=I[i.id];if(!(this.time<i.readyAt)){if(a.scoped&&r&&!i.reloading&&(i.scopeLevel=(i.scopeLevel+1)%(a.scoped.zoomFov.length+1),this.emit({t:`sfx`,id:e.id,kind:`scope`,p:{...e.pos},weapon:i.id})),a.mode===`melee`){if(this.time<i.nextFire)return;(n||r)&&this.melee(e,i,a,r&&!n)}else if(i.burstLeft>0&&this.time>=i.burstNext)this.shoot(e,i,a),i.burstLeft--,i.burstNext=this.time+60/(a.burstRpm??900);else if(!(!(a.mode===`auto`?t.fire:n)||this.time<i.nextFire)){if(i.reloading){if(a.shellTime&&i.mag>0)i.reloading=!1;else return}i.mag<=0?(n&&this.emit({t:`sfx`,id:e.id,kind:`dry`,p:{...e.pos},weapon:i.id}),i.reserve>0&&this.startReload(e),i.nextFire=this.time+.2):(this.shoot(e,i,a),a.mode===`burst`?(i.burstLeft=Math.min(a.burstCount-1,i.mag),i.burstNext=this.time+60/(a.burstRpm??900),i.nextFire=this.time+(a.cycle??.4)):a.mode===`bolt`||a.mode===`pump`?(i.nextFire=this.time+(a.cycle??1),a.mode===`bolt`&&this.emit({t:`sfx`,id:e.id,kind:`bolt`,p:{...e.pos},weapon:i.id})):i.nextFire=this.time+60/a.rpm,i.mag===0&&i.reserve>0&&a.mode!==`pump`&&this.startReload(e))}}}melee(e,t,n,i){t.nextFire=this.time+(i?1.1:.55),e.swing=this.time,this.emit({t:`sfx`,id:e.id,kind:`melee`,p:{...e.pos}});let o=this.eyePos(e),s=r(e.yaw,e.pitch),c=n.range,l=null;for(let t of this.players){if(!t.alive||t.side===e.side)continue;let r=this.poseOf(t),i=jd(o,s,n.range,I.tool,[{id:t.id,pose:r}]);i.hit&&i.hit.dist<c&&(c=i.hit.dist,l=t)}if(!l)return;let u=i?75:n.damage,d=Math.atan2(-(e.pos.x-l.pos.x),-(e.pos.z-l.pos.z));Math.abs(a(l.yaw,d+Math.PI))<1&&(u*=3);let f=kd(u,n,`chest`,{armor:l.armor,helmet:l.helmet});this.applyDamage(l,e,f.health,f.armorLoss,`chest`,`bullet`,`tool`,!1,!1)}shoot(t,n,i){let a=this.time,o=Xu(n,i,a),s=Gu(t),c=(this.rng()*2-1)*i.recoil.seedDev*(Math.PI/180),l=(this.rng()*2-1)*i.recoil.seedDev*(Math.PI/180),u=Zu(t,n,i,a,s),d=this.eyePos(t),f=t.yaw+o.yaw+l,p=t.pitch+o.pitch+c,m=t.lastCmd,h=0;t.controller===`human`&&m&&isFinite(m.viewTick)&&m.viewTick>0&&(h=e(Math.round(this.tick-m.viewTick),0,12));let g=this.tick-h,_=[];for(let e of this.players)e.alive&&e.side!==t.side&&_.push({id:e.id,pose:h>0?this.poseAt(e,g):this.poseOf(e)});let v=new Map,y=d;for(let e=0;e<i.pellets;e++){let t=f,n=p;if(u>0){let e=u*Math.sqrt(this.rng()),r=this.rng()*Math.PI*2;t+=Math.cos(r)*e,n+=Math.sin(r)*e}let a=r(t,n),o=jd(d,a,i.range,i,_);e===0&&(y=o.end),this.shootShards(d,a,o.hit?o.hit.dist:i.range);for(let t=0;t<o.impacts.length&&!(i.pellets>1&&e>2);t++)this.emit({t:`impact`,p:o.impacts[t].p,n:o.impacts[t].n,mat:o.impacts[t].mat});if(o.hit){let e=this.players[o.hit.id],t=kd(Nd(i,o.hit.zone,o.hit.dist,o.hit.penMult),i,o.hit.zone,{armor:e.armor,helmet:e.helmet}),n=v.get(e.id)??{health:0,armor:0,zone:o.hit.zone,wall:!1,head:!1,pellets:0};n.health+=t.health,n.armor+=t.armorLoss,n.pellets++,n.wall=n.wall||o.hit.penetrated,o.hit.zone===`head`&&(n.head=!0,n.zone=`head`),v.set(e.id,n)}}this.emit({t:`shot`,id:t.id,weapon:i.id,o:d,e:y,side:t.side}),t.stats.shots++;for(let[e,n]of v){let r=this.players[e];t.stats.hits++,this.applyDamage(r,t,n.health,n.armor,n.zone,`bullet`,i.id,n.wall,n.head)}n.mag=Math.max(0,n.mag-1),n.fresh=!1,n.heat=Math.min(.05,n.heat*Math.exp(-(a-n.lastShot)*7)+i.spread.sustain),n.shots=Math.min(40,wf(n,i,a)+1),n.lastShot=a,v=new Map}shootShards(e,t,n){for(let r of this.grenades){if(r.type!==`pulse`||r.destroyed||!r.landed)continue;let i=e.x-r.pos.x,a=e.y-r.pos.y,o=e.z-r.pos.z,s=i*t.x+a*t.y+o*t.z,c=i*i+a*a+o*o-.2*.2,l=s*s-c;if(l<0)continue;let u=-s-Math.sqrt(l);u>0&&u<n&&r.pulses<2&&(r.destroyed=!0,this.emit({t:`nade`,kind:`pulseDestroyed`,type:`pulse`,p:{...r.pos},id:r.id,owner:r.owner,side:r.side}))}}applyDamage(e,t,n,r,i,a,o,s,c){if(!e.alive||n<=0||this.phase===`roundEnd`&&a===`bullet`||t&&t.id!==e.id&&t.side===e.side)return;let l=Math.min(e.hp,n);if(e.hp-=n,r>0&&(e.armor=Math.max(0,e.armor-r),e.armorFresh=!1),t&&t.id!==e.id){t.stats.damage+=l,(a===`frag`||a===`fire`)&&(t.stats.utilDamage+=l);let n=e.damagers.get(t.id)??{dmg:0,t:this.time};n.dmg+=l,n.t=this.time,e.damagers.set(t.id,n)}let u=t?{...t.pos}:{...e.pos};e.lastHurtDir=Math.atan2(-(u.x-e.pos.x),-(u.z-e.pos.z)),this.emit({t:`hurt`,victim:e.id,dmg:l,from:u,kind:a});let d=e.hp<=0;t&&t.id!==e.id&&this.emit({t:`hit`,shooter:t.id,victim:e.id,dmg:l,head:c,killed:d}),d&&this.killPlayer(e,t,o,c,s)}killPlayer(e,t,n,r,i){e.alive=!1,e.hp=0,e.stats.deaths++,e.killedRound=!0,e.interact={kind:null,progress:0},this.spike.defuser===e.id&&(this.spike.defuser=-1,this.spike.defuseProgress=0),e.slots.primary&&(this.spawnDrop(e.slots.primary,e,!1),e.slots.primary=null),e.spike&&(e.spike=!1,this.spike.state=`dropped`,this.spike.pos={x:e.pos.x,y:e.pos.y,z:e.pos.z},this.spike.carrier=-1,this.emit({t:`spike`,kind:`drop`,p:{...e.pos},id:e.id}));let a=-1;if(t&&t.id!==e.id){t.stats.kills++,r&&t.stats.headshots++,t.stats.score+=2,this.firstKill||(this.firstKill={killer:t.id,victim:e.id},t.stats.openingKills++);let i=n===`frag`||n===`fire`?300:n in I?I[n].killReward:300;this.addMoney(t,i,`Elimination`);let o=0;for(let[n,r]of e.damagers)n!==t.id&&this.players[n].side===t.side&&this.time-r.t<8&&r.dmg>=30&&r.dmg>o&&(o=r.dmg,a=n);a>=0&&(this.players[a].stats.assists++,this.players[a].stats.score+=1)}this.emit({t:`kill`,killer:t&&t.id!==e.id?t.id:-1,victim:e.id,weapon:n,head:r,wall:i,assist:a,pos:{...e.pos}})}checkRoundEnd(){let e=this.alive(`int`).length,t=this.alive(`cus`).length,n=this.spike,r=this.squadOf(`int`),i=this.squadOf(`cus`);if(this.phase===`armed`){if(n.state===`defused`)return;if(t===0){this.endRound(r,`defendersEliminated`);return}}else e===0&&t===0?this.endRound(i,`eliminated`):t===0?this.endRound(r,`eliminated`):e===0?this.endRound(i,`eliminated`):this.time>=this.phaseEnds&&this.endRound(i,`timeExpired`)}phaseRemaining(){return Math.max(0,this.phaseEnds-this.time)}isSmoked(e,t){for(let n of this.smokes)if(!(this.time<n.bloomAt||this.time>=n.until)&&Tf(e,t,n.pos,n.radius)>.5)return!0;return!1}result(){return this.phase!==`matchEnd`||this.winnerSquad===null?null:{winner:this.winnerSquad,score:[this.score[0],this.score[1]]}}};function wf(e,t,n){if(e.shots<=0)return 0;let r=1-(n-e.lastShot)/Math.max(.05,t.recoil.recovery);return r<=0?0:e.shots*r}function Tf(e,t,n,r){let i=t.x-e.x,a=t.y-e.y,o=t.z-e.z,s=Math.hypot(i,a,o);if(s<1e-6)return 0;let c=i/s,l=a/s,u=o/s,d=e.x-n.x,f=e.y-n.y,p=e.z-n.z,m=d*c+f*l+p*u,h=d*d+f*f+p*p-r*r,g=m*m-h;if(g<=0)return 0;let _=Math.sqrt(g),v=Math.max(0,-m-_),y=Math.min(s,-m+_);return Math.max(0,y-v)}function Ef(t){let n=[t.seq,t.viewTick,t.moveX,t.moveZ,t.yaw,t.pitch];for(let e of n)if(typeof e!=`number`||!isFinite(e))return!1;return t.moveX=e(t.moveX,-1,1),t.moveZ=e(t.moveZ,-1,1),t.fire=!!t.fire,t.alt=!!t.alt,t.jump=!!t.jump,t.crouch=!!t.crouch,t.walk=!!t.walk,t.use=!!t.use,!(t.buy&&(typeof t.buy.item!=`string`||!isFinite(t.buy.req))||t.refund&&(typeof t.refund.item!=`string`||!isFinite(t.refund.req))||t.select!==void 0&&typeof t.select!=`string`)}function Df(e={}){return new Cf({seed:e.seed??1337,rules:e.rules??_e.quick,squad0Side:e.squad0Side??`int`,humanIds:e.humanIds??[],practice:e.practice,names:e.names})}var Of=e=>Math.round(e*64)/64,kf=class{match;clients=new Map;pending=[];stats={snapshots:0,snapshotBytes:[],inputsAccepted:0,inputsRejected:0,quotaDrops:0};quota=260;constructor(e){this.match=e}addClient(e,t){let n=this.clients.get(e);n&&n.end.close?.(),this.clients.set(e,{playerId:e,end:t,welcomed:!1,msgWindow:0,msgCount:0,rejected:0,spotted:new Map,lastSnapTick:-1})}removeClient(e){this.clients.delete(e)}handleMessage(e,t){let n=Cd(t);if(!n)e.rejected++,this.stats.inputsRejected++;else switch(n.t){case`hello`:if(n.v!==1){e.end.send({t:`reject`,reason:`version mismatch`});return}if(n.mapHash!==ee){e.end.send({t:`reject`,reason:`map checksum mismatch`});return}if(n.ruleset!==`2026.11.1-slice`){e.end.send({t:`reject`,reason:`ruleset mismatch`});return}e.welcomed=!0,this.match.players[e.playerId].name=n.name||this.match.players[e.playerId].name,e.end.send({t:`welcome`,v:1,playerId:e.playerId,ruleset:de,mapHash:ee,tickRate:64,side:this.match.players[e.playerId].side});break;case`input`:if(!e.welcomed)return;this.match.submitInput(e.playerId,n.cmd)?this.stats.inputsAccepted++:this.stats.inputsRejected++;break;case`ping`:e.end.send({t:`pong`,ct:n.ct,st:this.match.time,tick:this.match.tick})}}step(){let e=this.match,t=Math.floor(e.tick/64);for(let e of this.clients.values()){e.msgWindow!==t&&(e.msgWindow=t,e.msgCount=0);for(let t of e.end.recv())e.msgCount++,e.msgCount>this.quota?this.stats.quotaDrops++:this.handleMessage(e,t)}e.step();for(let t of e.events)this.pending.push(t);if(e.tick%3==0){for(let e of this.clients.values()){if(!e.welcomed)continue;let t={t:`snap`,snap:vd(this.buildSnapshot(e))};e.end.send(t),this.stats.snapshots++}this.pending=[]}}weaponSnap(e){return{id:e.id,mag:e.mag,reserve:e.reserve,reloading:e.reloading,reloadEnd:e.reloadEnd,readyAt:e.readyAt,nextFire:e.nextFire,shots:e.shots,lastShot:e.lastShot,scope:e.scopeLevel}}spottedEnemies(e,t){let n=this.match,r=new Set,i=n.players.filter(e=>e.side===t.side&&e.alive);for(let a of n.players){if(a.side===t.side||!a.alive)continue;let o={x:a.pos.x,y:a.pos.y+Hu(a.crouch)-.05,z:a.pos.z},s={x:a.pos.x,y:a.pos.y+1,z:a.pos.z},c=!1;for(let e of i){let t=n.eyePos(e);if(!(Math.hypot(a.pos.x-e.pos.x,a.pos.z-e.pos.z)>90)&&(oe(t,o)||oe(t,s))&&!n.isSmoked(t,s)){c=!0;break}}c&&e.spotted.set(a.id,n.time);let l=e.spotted.get(a.id);l!==void 0&&n.time-l<.28&&r.add(a.id)}return r}audible(e,t,n){this.match;let r=e=>Math.hypot(e.x-t.pos.x,e.z-t.pos.z);switch(e.t){case`phase`:case`roundEnd`:case`kill`:case`info`:return!0;case`econ`:case`buy`:return e.id===t.id;case`hit`:return e.shooter===t.id||!t.alive&&n(e.shooter);case`hurt`:return e.victim===t.id;case`shot`:return e.id===t.id||n(e.id)||r(e.o)<75;case`impact`:return r(e.p)<45;case`step`:return e.id===t.id||n(e.id)||r(e.p)<4+28*e.loud;case`sfx`:return e.id===t.id||n(e.id)||r(e.p)<(e.kind===`throw`||e.kind===`drop`?22:14);case`nade`:return e.kind===`pulsePing`?e.side===t.side:e.kind===`flash`||e.kind===`frag`||e.kind===`veil`||e.kind===`thermite`?r(e.p)<60||e.side===t.side:r(e.p)<32||e.side===t.side;case`spike`:return e.kind===`planted`||e.kind===`defused`||e.kind===`explode`?!0:e.kind===`beep`?r(e.p)<70:t.side===`int`&&(e.kind===`pickup`||e.kind===`drop`)||r(e.p)<25}return!1}buildSnapshot(e,t=!1){let n=this.match,r=n.players[e.playerId],i=this.spottedEnemies(e,r),a=e=>n.players[e]?.side===r.side,o=[];for(let e of n.players){let t=e.side===r.side;if(!t&&!i.has(e.id)||!e.alive&&!t)continue;let a=n.heldWeapon(e);o.push({id:e.id,pos:{x:Of(e.pos.x),y:Of(e.pos.y),z:Of(e.pos.z)},yaw:Math.round(e.yaw*100)/100,pitch:Math.round(e.pitch*100)/100,crouch:Math.round(e.crouch*4)/4,alive:e.alive,weapon:a?a.id:`util`,scoped:!!a&&a.scopeLevel>0,swing:+(e.swing>0&&n.time-e.swing<.6),reloading:!!a&&a.reloading,spotted:!t})}let s=t||n.tick%32==0||this.pending.some(e=>e.t===`kill`||e.t===`phase`||e.t===`roundEnd`||e.t===`buy`&&e.id===r.id||e.t===`econ`&&e.id===r.id)||e.lastSnapTick<0;e.lastSnapTick=n.tick;let c=s?n.players.map(e=>{let t=e.side===r.side,n={id:e.id,name:e.name,squad:e.squad,side:e.side,alive:e.alive,kills:e.stats.kills,deaths:e.stats.deaths,assists:e.stats.assists,score:e.stats.score,damage:Math.round(e.stats.damage),plants:e.stats.plants,defuses:e.stats.defuses,headshots:e.stats.headshots,shots:e.stats.shots,hits:e.stats.hits,utilDamage:Math.round(e.stats.utilDamage),flashed:e.stats.flashed,controller:e.controller,ping:e.ping};return t&&(n.money=e.money,n.primary=e.slots.primary?.id??null,n.secondary=e.slots.secondary?.id??null,n.armor=e.armor,n.helmet=e.helmet,n.kit=e.kit,n.util=[...e.util],n.hp=e.hp,n.spike=e.spike),n}):void 0,l=n.players.filter(e=>e.side===r.side&&e.alive),u=e=>l.some(t=>oe(n.eyePos(t),{x:e.x,y:e.y+.3,z:e.z})),d=[];for(let e of n.grenades)(e.side===r.side||u(e.pos))&&d.push({id:e.id,type:e.type,x:Of(e.pos.x),y:Of(e.pos.y),z:Of(e.pos.z),owner:e.owner,landed:e.landed});let f=n.smokes.map(e=>({id:e.id,x:Of(e.pos.x),y:Of(e.pos.y),z:Of(e.pos.z),r:e.radius,bloomIn:Math.max(0,e.bloomAt-n.time),remaining:Math.max(0,e.until-n.time)})),p=n.fires.map(e=>({id:e.id,cells:e.cells.flatMap(e=>[e.x,e.y,e.z]),remaining:Math.max(0,e.until-n.time)})),m=[];for(let e of n.drops)u(e.pos)&&m.push({id:e.id,weapon:e.weapon.id,x:Of(e.pos.x),y:Of(e.pos.y),z:Of(e.pos.z),mag:e.weapon.mag});let h=n.spike,g={state:h.state,carrier:r.side===`int`?h.carrier:-1,site:h.site,remaining:h.state===`planted`?Math.max(0,h.explodeAt-n.time):0,defuseProgress:h.defuseProgress,defuseNeeded:h.defuseNeeded,defuser:h.defuser};(h.state===`planted`||h.state===`defused`||h.state===`exploded`||h.state===`dropped`&&(r.side===`int`||u(h.pos)))&&(g.pos={x:h.pos.x,y:h.pos.y,z:h.pos.z});let _=this.pending.filter(e=>this.audible(e,r,a)),v=r.slots;return{tick:n.tick,time:n.time,phase:n.phase,phaseRemaining:n.phaseRemaining(),round:n.round,score:[n.score[0],n.score[1]],squadSide:[n.squadSide[0],n.squadSide[1]],lossTier:[n.lossTier[0],n.lossTier[1]],rules:{winRounds:n.rules.winRounds,halfRounds:n.rules.halfRounds,maxRounds:n.rules.maxRounds},self:{id:r.id,alive:r.alive,hp:r.hp,armor:r.armor,helmet:r.helmet,kit:r.kit,spike:r.spike,money:r.money,cur:r.cur,weapons:{primary:v.primary?this.weaponSnap(v.primary):null,secondary:v.secondary?this.weaponSnap(v.secondary):null,tool:this.weaponSnap(v.tool)},util:[...r.util],interact:{kind:r.interact.kind,progress:r.interact.progress},flashUntil:r.flashUntil,flashFull:r.flashFull,canBuy:n.canBuyNow(r),pos:{x:r.pos.x,y:r.pos.y,z:r.pos.z},vel:{x:r.vel.x,y:r.vel.y,z:r.vel.z},crouch:r.crouch,onGround:r.onGround,landPenalty:r.landPenalty,stepAcc:r.stepAcc,ack:r.lastSeq,hurtDir:r.lastHurtDir,purchases:r.purchases.map(e=>e.item),doneReqs:[...r.processedReqs]},players:o,roster:c,grenades:d,smokes:f,fires:p,drops:m,spike:g,events:_,winnerSquad:n.winnerSquad,rounds:n.phase===`matchEnd`?n.rounds.map(e=>({round:e.round,winnerSquad:e.winnerSquad,winnerSide:e.winnerSide,reason:e.reason,planted:e.planted,score:e.score,moneyBefore:e.moneyBefore,equipValue:e.equipValue,duration:e.duration})):void 0,lastRound:n.lastRoundEnd?{winnerSquad:n.lastRoundEnd.winnerSquad,winnerSide:n.lastRoundEnd.winnerSide,reason:n.lastRoundEnd.reason}:null}}};function Af(e,t){return Math.atan2(-(t.x-e.x),-(t.z-e.z))}var jf={A:{lanes:[{name:`Dock`,stage:[{x:8,z:50},{x:9,z:53}],entry:{x:8,z:31},push:[{x:8,z:29},{x:8,z:24}]},{name:`Cargo`,stage:[{x:20,z:50},{x:19,z:47}],entry:{x:20,z:31},push:[{x:20,z:29},{x:19,z:23}]}],plant:[{x:19,z:21},{x:13,z:25},{x:20,z:18}],postPlant:[{x:8,z:27,yaw:Af({x:8,z:27},{x:26,z:12}),label:`dock`},{x:21,z:28,yaw:Af({x:21,z:28},{x:26,z:14}),label:`cargo`},{x:16,z:16,yaw:Af({x:16,z:16},{x:29,z:10}),label:`turbine`},{x:22,z:23,yaw:Af({x:22,z:23},{x:27,z:14}),label:`wall`}],clear:[{x:9,z:22},{x:15,z:24},{x:21,z:16},{x:12,z:16}],smoke:[{x:8,z:10},{x:25,z:15}],flash:[{x:18,z:14},{x:24,z:24}],hold:[{x:27,z:19,yaw:Af({x:27,z:19},{x:18,z:26}),label:`fallback`},{x:7,z:7,yaw:Af({x:7,z:7},{x:15,z:22}),label:`gantry`}],retake:[{stage:{x:26,z:11},entry:{x:22,z:15}},{stage:{x:28,z:27},entry:{x:23,z:25}}]},B:{lanes:[{name:`Glass East`,stage:[{x:90,z:52},{x:90,z:49}],entry:{x:90,z:31},push:[{x:90,z:29},{x:86,z:22}]},{name:`Glass West`,stage:[{x:84,z:52},{x:84,z:49}],entry:{x:84,z:31},push:[{x:84,z:29},{x:80,z:22}]}],plant:[{x:79,z:13},{x:85,z:19},{x:89,z:11}],postPlant:[{x:86,z:27,yaw:Af({x:86,z:27},{x:70,z:10}),label:`glass`},{x:75,z:26,yaw:Af({x:75,z:26},{x:68,z:11}),label:`crawl`},{x:90,z:21,yaw:Af({x:90,z:21},{x:72,z:11}),label:`rail`},{x:83,z:22,yaw:Af({x:83,z:22},{x:68,z:9}),label:`mid`}],clear:[{x:83,z:19},{x:85,z:15},{x:89,z:12},{x:81,z:12}],smoke:[{x:74,z:12},{x:88,z:8}],flash:[{x:80,z:12},{x:86,z:14}],hold:[{x:78,z:25,yaw:Af({x:78,z:25},{x:80,z:36}),label:`south`},{x:88,z:10,yaw:Af({x:88,z:10},{x:80,z:22}),label:`corner`}],retake:[{stage:{x:68,z:11},entry:{x:74,z:14}},{stage:{x:66,z:27},entry:{x:74,z:25}}]}},Mf={x:46,z:40,yaw:Af({x:46,z:40},{x:46,z:56}),label:`mid`},Nf={cus:[{x:38,z:4},{x:56,z:4},{x:44,z:14},{x:52,z:14},{x:60,z:8}],int:[{x:30,z:66},{x:22,z:62},{x:67,z:66},{x:78,z:62},{x:50,z:68}]},Pf={easy:{id:`easy`,reaction:.55,aimSpeed:5.5,aimErr:.045,recoilSkill:.35,memory:4,headBias:.05,utility:.5},normal:{id:`normal`,reaction:.34,aimSpeed:9,aimErr:.028,recoilSkill:.65,memory:7,headBias:.15,utility:.8},hard:{id:`hard`,reaction:.22,aimSpeed:13,aimErr:.016,recoilSkill:.88,memory:10,headBias:.3,utility:1}},Ff=class{side;round=-1;site=`A`;intMode=`default`;cusMode=`default`;executeAt=0;assign=new Map;contacts=[];rotatedTo=null;retakeSite=`A`;retakeGoAt=0;lastSyncTick=-1;smokeAt=0;constructor(e){this.side=e}siteOf(e,t=8){for(let n of[`A`,`B`]){let r=b[n];if(e.x>=r.x0-t&&e.x<=r.x1+t&&e.z>=r.z0-t&&e.z<=r.z1+t)return n}return e.x<30&&e.z<36?`A`:e.x>66&&e.z<36?`B`:null}report(e,t,n){this.contacts.push({pos:{...e},t,site:this.siteOf(e),certain:n}),this.contacts.length>24&&this.contacts.shift()}recentSiteContacts(e,t,n=8){return this.contacts.filter(r=>r.site===e&&t-r.t<n).length}sync(e){if(this.lastSyncTick===e.tick)return;this.lastSyncTick=e.tick;let t=e.alive(this.side);if(this.round!==e.round&&(this.round=e.round,this.contacts=[],this.rotatedTo=null,this.intMode=`default`,this.cusMode=`default`,this.assign.clear(),this.planRound(e)),e.phase!==`buy`){for(let n of e.events){let r=null,i=0,a=null;if(n.t===`step`?(r=e.players[n.id],i=5+26*n.loud,a=n.p):n.t===`shot`?(r=e.players[n.id],i=70,a=n.o):n.t===`sfx`&&(n.kind===`reload`||n.kind===`pickup`||n.kind===`drop`||n.kind===`throw`)?(r=e.players[n.id],i=16,a=n.p):n.t===`spike`&&(n.kind===`armStart`||n.kind===`planted`)&&(r=e.players[n.id],i=40,a=n.p),r&&a&&r.side!==this.side)for(let n of t){let t=Math.hypot(a.x-n.pos.x,a.z-n.pos.z);if(t<=i){let n=Math.min(6,t*.18),r={x:a.x+(e.rng()*2-1)*n,y:a.y,z:a.z+(e.rng()*2-1)*n};this.report(r,e.time,!1);break}}}this.side===`int`?this.updateAttack(e,t):this.updateDefense(e,t)}}planRound(e){let t=e.playersOf(this.side);if(this.side===`int`){this.site=e.rng()<.5?`A`:`B`,this.executeAt=14+e.rng()*12;let n=jf[this.site];t.find(e=>e.spike),t.forEach((e,t)=>{let r=t%2,i=n.lanes[r],a=e.spike?`carrier`:t===0?`entry`:t===1?`support`:t===2?`trade`:`lurk`;this.assign.set(e.id,{role:a,lane:r,stage:i.stage[(t>>1)%i.stage.length],clear:n.clear[t%n.clear.length],smoked:!1})})}else{let e=jf.A.hold,n=jf.B.hold,r=[{role:`anchor`,hold:e[0],site:`A`},{role:`anchor`,hold:e[1],site:`A`},{role:`anchor`,hold:n[0],site:`B`},{role:`anchor`,hold:n[1],site:`B`},{role:`rotator`,hold:Mf,site:null}];t.forEach((e,t)=>{let n=r[t%r.length];this.assign.set(e.id,{role:n.role,lane:0,stage:n.hold,hold:n.hold,clear:n.hold,smoked:!1})})}}updateAttack(e,t){let n=e.spike,r=e.time-e.liveStart;n.state===`planted`?this.intMode=`postplant`:(e.phase===`live`&&this.intMode==="default"&&r>=this.executeAt&&(this.intMode=`execute`,this.smokeAt=e.time),e.phase===`live`&&e.phaseRemaining()<9&&(this.intMode=`save`),this.intMode==="default"&&r>8&&t.length>=3&&this.recentSiteContacts(this.site,e.time,12))}updateDefense(e,t){let n=e.spike;if(n.state===`planted`&&e.phase===`armed`)this.cusMode!==`retake`&&this.cusMode!==`save`&&(this.cusMode=`retake`,this.retakeSite=n.site??`A`,this.retakeGoAt=e.time+3.2+e.rng()*1.5);else if(e.phase===`live`)for(let n of[`A`,`B`])this.recentSiteContacts(n,e.time,7)>=2&&this.rotatedTo!==n&&(this.rotatedTo=n,t.filter(e=>{let t=this.assign.get(e.id);return t&&(t.role===`rotator`||t.role===`anchor`&&this.siteOfHold(t)!==n)}).slice(0,2).forEach(e=>{let t=this.assign.get(e.id),r=jf[n].hold[0];this.assign.set(e.id,{...t,role:`rotator`,hold:{...r},stage:r})}))}siteOfHold(e){return e.hold?this.siteOf({x:e.hold.x,y:0,z:e.hold.z},6):null}},If=.4,Lf=class{diff;ai;yaw=0;pitch=0;path=[];pathIdx=0;goal=null;repathAt=0;stuckT=0;lastPos={x:0,y:0,z:0};lastPosT=0;contacts=new Map;heard=null;target=-1;aimErrYaw=0;aimErrPitch=0;aimErrT=0;fireUntil=0;holdFireUntil=0;fireToggle=!1;bought=-1;buyReq=1;lookAround=0;lookYaw=0;jumpT=0;visCheck=0;strafeDir=1;strafeUntil=0;lastRound=-1;throwPlan=null;thrown=new Set;defuseStartedAt=0;crouching=!1;savedSpot=null;constructor(e,t){this.diff=e,this.ai=t}think(e,t){let n={seq:0,viewTick:e.tick,moveX:0,moveZ:0,yaw:t.yaw,pitch:t.pitch,fire:!1,alt:!1,jump:!1,crouch:!1,walk:!1,use:!1},r=this.ai[t.side];if(r.sync(e),this.lastRound!==e.round&&(this.lastRound=e.round,this.contacts.clear(),this.path=[],this.goal=null,this.target=-1,this.bought=-1,this.thrown.clear(),this.throwPlan=null,this.yaw=t.yaw,this.pitch=0,this.heard=null,this.savedSpot=null,this.defuseStartedAt=0),!t.alive)return n.yaw=this.yaw,n.pitch=this.pitch,n;if(e.phase===`buy`)return this.doBuy(e,t,n),n.yaw=this.yaw,n.pitch=this.pitch,n;if(e.phase===`halftime`||e.phase===`matchEnd`)return n.yaw=this.yaw,n.pitch=this.pitch,n;this.perceive(e,t,r);let i=e.eyePos(t),a=e.heldWeapon(t),o=a?I[a.id]:null;!this.throwPlan&&(t.cur===`tool`||t.cur.startsWith(`util`))&&(t.slots.primary||t.slots.secondary)&&(n.select=t.slots.primary&&(t.slots.primary.mag>0||t.slots.primary.reserve>0)?`primary`:`secondary`);let s=null,c=null,l=!1,u=!1,d=!1,f=r.assign.get(t.id);t.side===`int`?{moveGoal:s,lookAt:c,walk:l,holdPosition:u,wantUse:d}=this.planAttack(e,t,r,f):{moveGoal:s,lookAt:c,walk:l,holdPosition:u,wantUse:d}=this.planDefense(e,t,r,f);let p=this.pickTarget(e,t,i),m=!1;p&&o&&a&&(m=this.combat(e,t,i,p,o,a,n)),m||this.useUtility(e,t,r,f,n),a&&o&&o.mode!==`melee`&&a.mag<o.mag*.4&&a.reserve>0&&!m&&!a.reloading&&(n.reload=!0),a&&o&&o.mode!==`melee`&&a.mag===0&&a.reserve>0&&!a.reloading&&(n.reload=!0);let h=!(m&&this.stopToShoot(t,o));return(d&&!m||d&&m&&t.interact.progress>1.2)&&(n.use=!0),s&&!u&&h&&!n.use?this.follow(e,t,s,n,l):(!s||u)&&(this.path=[],this.goal=null),this.updateView(e,t,i,p&&m?p:null,c,n,o,a),n.yaw=this.yaw,n.pitch=this.pitch,this.toLocalMove(t,n),this.stuckCheck(e,t,n),n}doBuy(e,t,n){let r=e.time-(e.phaseEnds-20),i=e.playersOf(t.side).indexOf(t);if(this.bought<0&&r>.6+i*If&&(this.bought=0,this.buyList(e,t)),this.bought>=0&&this.queue.length){let e=this.queue.shift();n.buy={req:this.buyReq++,item:e},this.bought++}let a=(t.side,{x:t.pos.x,z:30});this.yaw=this.smoothAngle(this.yaw,Af(t.pos,a),.05)}queue=[];buyList(e,t){let n=[],r=t.money,i=t.side,a=e.playersOf(i).reduce((e,t)=>e+t.money,0)/5,o=e.playersOf(i),s=(e,t)=>r>=t&&(n.push(e),r-=t,!0),c=r>=3300&&a>2600,l=!!t.slots.primary&&I[t.slots.primary.id].price>=2300;if(!l){let n=o.some(e=>e.slots.primary?.id===`longglass`),l=o.indexOf(t);if(c&&!n&&r>=5800&&l===3)s(`longglass`,4650);else if(c){let t=e.rng(),n=i===`int`?[[`aster`,2650],[`krait`,2900],[`lumen`,2350],[`aster`,2650]]:[[`aster`,2650],[`krait`,2900],[`lumen`,2350],[`sable`,3100]],r=n[Math.floor(t*n.length)];s(r[0],r[1])||s(`aster`,2650)}else if(r>=1900&&a>1500){let t=e.rng();t<.5?s(`kite`,1250):t<.8&&r>=1700?s(`vectora`,1700):r>=1900&&s(`rampart`,1900)}else r>=900&&t.slots.secondary?.id===`vela`&&s(e.rng()<.5?`rook`:`needle`,e.rng()<.5?700:900)}(t.armor<100||!t.helmet)&&(r>=P.vestHelmet.price+200&&(t.slots.primary||r>=1500)?s(`vesthelmet`,P.vestHelmet.price-(t.armor>=100?P.vest.price:0)-(t.helmet?P.helmetUpgrade:0)):t.armor<100&&r>=P.vest.price+100&&s(`vest`,P.vest.price)),i===`cus`&&!t.kit&&r>=P.kit.price&&(t.slots.primary||r>=800)&&s(`kit`,P.kit.price);let u=i===`int`?[`flash`,`veil`,`frag`,`thermite`,`flash`,`pulse`]:[`veil`,`flash`,`frag`,`pulse`,`thermite`,`flash`],d=l||r>1200||t.slots.primary?3:1,f=t.util.length;for(let i of u){if(f>=d)break;t.util.filter(e=>e===i).length>=fe[i].max||n.filter(e=>e===i).length>=fe[i].max||r>=fe[i].price+100&&e.rng()<.7*this.diff.utility+.2&&s(i,fe[i].price)&&f++}this.queue=n}perceive(e,t,i){let o=e.eyePos(t),s=e.time<t.flashUntil;r(this.yaw,this.pitch),this.visCheck++;for(let r of e.players){if(!r.alive||r.side===t.side||(this.visCheck+r.id)%3!=0)continue;let c=this.contacts.get(r.id),l=!1;if(!s){let t={x:r.pos.x,y:r.pos.y+Hu(r.crouch)-.05,z:r.pos.z},i={x:r.pos.x,y:r.pos.y+1.1-r.crouch*.35,z:r.pos.z},s=i.x-o.x,c=i.z-o.z,u=Math.hypot(s,c);if(u<80){let r=Math.abs(a(Math.atan2(-s,-c),this.yaw)),d=u<3.5;(r<62*n||d)&&(oe(o,t)||oe(o,i))&&!e.isSmoked(o,i)&&(l=!0)}}l?(c?(!c.visible&&e.time-c.t>.6&&(c.firstSeen=e.time),c.pos={...r.pos},c.t=e.time,c.visible=!0):(c={id:r.id,pos:{...r.pos},t:e.time,visible:!0,firstSeen:e.time},this.contacts.set(r.id,c)),i.report(r.pos,e.time,!0)):c&&(c.visible=!1,e.time-c.t>this.diff.memory&&this.contacts.delete(r.id))}for(let n of e.events)if(n.t===`step`){if(e.players[n.id].side===t.side)continue;Math.hypot(n.p.x-t.pos.x,n.p.z-t.pos.z)<5+26*n.loud&&(this.heard={pos:{x:n.p.x,y:n.p.y,z:n.p.z},t:e.time,kind:`step`})}else n.t===`shot`&&n.side!==t.side&&(this.heard={pos:{...n.o},t:e.time,kind:`shot`})}pickTarget(e,t,n){let r=null,i=1/0;for(let t of this.contacts.values()){if(!t.visible)continue;if(!e.players[t.id].alive){this.contacts.delete(t.id);continue}let a=Math.hypot(t.pos.x-n.x,t.pos.z-n.z);a<i&&(i=a,r=t)}return r&&r.id!==this.target&&(this.target=r.id),r}stopToShoot(e,t){return t?t.cls!==`smg`:!1}combat(t,n,r,i,o,s,c){let l=t.players[i.id],u=t.time-i.firstSeen>=this.diff.reaction,d=this.diff.headBias,f=(i.id*7+Math.floor(t.time*2))%100<d*100,p=f?Hu(l.crouch)-.08:1.15-l.crouch*.35,m={x:l.pos.x,y:l.pos.y+p,z:l.pos.z};if(!oe(r,m)){let e={x:l.pos.x,y:l.pos.y+(f?1.1-l.crouch*.35:Hu(l.crouch)-.08),z:l.pos.z};if(!oe(r,e))return!1;m.y=e.y}if(s.mag===0&&s.reserve===0&&!(n.slots.secondary&&n.slots.secondary!==s&&(n.slots.secondary.mag>0||n.slots.secondary.reserve>0)))return!1;let h=m.x-r.x,g=m.y-r.y,_=m.z-r.z,v=Math.hypot(h,_),y=Math.hypot(v,g);this.aimTargetYaw=Math.atan2(-h,-_),this.aimTargetPitch=Math.atan2(g,v),this.diff.id===`hard`&&(this.aimTargetYaw+=e((l.vel.x*Math.cos(this.aimTargetYaw)-l.vel.z*Math.sin(this.aimTargetYaw))*-0,-.02,.02)),this.aimActive=!0;let b=Math.abs(a(this.aimTargetYaw,this.effectiveYaw(t,n,s,o))),x=Math.abs(this.aimTargetPitch-this.effectivePitch(t,n,s,o)),S=Math.atan2(.3,Math.max(y,2))+.012,C=b<S&&x<S*1.2,w=Gu(n)<(o.cls===`smg`||o.cls===`pistol`?2.2:1.1)||o.cls===`shotgun`,T=y<o.range*.9;if(o.scoped&&s.scopeLevel===0&&y>18&&(c.alt=t.tick%2==0),o.scoped&&s.scopeLevel>0&&y<10&&(c.alt=t.tick%2==0),u&&C&&w&&T&&t.time>=this.holdFireUntil){if(o.mode===`auto`){c.fire=!0;let e=y<12?14:y<28?5:3;this.sprayCount++,this.sprayCount>=e+Math.floor(t.rng()*3)&&(this.sprayCount=0,this.holdFireUntil=t.time+(y<12?.12:.22+t.rng()*.2))}else this.fireToggle=!this.fireToggle,c.fire=this.fireToggle}else this.sprayCount=0;return!w&&o.cls,c.crouch=y>28&&(o.cls===`rifle`||o.cls===`lmg`||o.cls===`dmr`),s.mag===0&&s.reserve===0&&n.cur===`primary`&&n.slots.secondary&&(c.select=`secondary`),!0}aimTargetYaw=0;aimTargetPitch=0;aimActive=!1;sprayCount=0;effectiveYaw(e,t,n,r){let i=Xu(n,r,e.time);return this.yaw+i.yaw}effectivePitch(e,t,n,r){let i=Xu(n,r,e.time);return this.pitch+i.pitch}smoothAngle(e,t,n){return i(e+a(t,e)*n)}updateView(t,n,r,o,s,c,l,u){let d=1/64;if(o&&this.aimActive&&l&&u){if(this.aimErrT-=d,this.aimErrT<=0){this.aimErrT=.25+t.rng()*.25;let e=Math.max(2,Math.hypot(o.pos.x-r.x,o.pos.z-r.z)),n=this.diff.aimErr*Math.min(2.2,8/Math.max(2,Math.sqrt(e)));this.aimErrYaw=(t.rng()*2-1)*n,this.aimErrPitch=(t.rng()*2-1)*n}let n=Xu(u,l,t.time),s=this.aimTargetYaw-n.yaw*this.diff.recoilSkill+this.aimErrYaw,c=this.aimTargetPitch-n.pitch*this.diff.recoilSkill+this.aimErrPitch,f=this.diff.aimSpeed*d*(this.diff.id===`easy`?1:1.4),p=a(s,this.yaw),m=c-this.pitch,h=.35;this.yaw=i(this.yaw+e(p*h,-f*3,f*3)),this.pitch=e(this.pitch+e(m*h,-f*3,f*3),-1.2,1.2),this.aimActive=!1;return}this.aimActive=!1;let f=this.yaw,p=0,m=this.heard&&t.time-this.heard.t<2;if(m&&!s)f=Af(n.pos,this.heard.pos);else if(s){f=Af(n.pos,s);let t=Math.hypot(s.x-n.pos.x,s.z-n.pos.z);p=e(Math.atan2(-.1,Math.max(t,1)),-.2,.1)}else if(this.path.length&&this.pathIdx<this.path.length){let e=this.path[this.pathIdx];f=Af(n.pos,e)}else this.lookAround>0&&(f=this.lookYaw);let h=a(f,this.yaw),g=Math.min(Math.abs(h),6*d*(m?1.8:1));this.yaw=i(this.yaw+Math.sign(h)*g),this.pitch+=(p-this.pitch)*.1}planAttack(e,t,n,r){let i={moveGoal:null,lookAt:null,walk:!1,holdPosition:!1,wantUse:!1};if(!r)return i;let a=jf[n.site],o=e.spike;if(o.state===`dropped`){let n=e.alive(`int`),r=null,a=1/0;for(let e of n){let t=Math.hypot(e.pos.x-o.pos.x,e.pos.z-o.pos.z);t<a&&(a=t,r=e)}if(r&&r.id===t.id)return{...i,moveGoal:{x:o.pos.x,z:o.pos.z}}}if(n.intMode===`save`)return this.savedSpot=this.savedSpot??Nf.int[t.id*3%Nf.int.length],{...i,moveGoal:this.savedSpot,walk:!1};if(n.intMode===`postplant`||o.state===`planted`){let e=jf[o.site??n.site].postPlant,r=e[(n.assign.get(t.id)?Array.from(n.assign.keys()).indexOf(t.id):t.id)%e.length];return{moveGoal:{x:r.x,z:r.z},lookAt:{x:r.x+Math.sin(-r.yaw)*10,z:r.z-Math.cos(r.yaw)*10},walk:!1,holdPosition:Math.hypot(r.x-t.pos.x,r.z-t.pos.z)<1.2,wantUse:!1}}let s=a.lanes[r.lane];if(n.intMode==="default")return Math.hypot(r.stage.x-t.pos.x,r.stage.z-t.pos.z)<1.5?{...i,holdPosition:!0,lookAt:s.entry}:{...i,moveGoal:r.stage};let c=T(b[n.site],t.pos.x,t.pos.z);if(t.spike){let r=e.alive(`int`).filter(e=>e.id!==t.id),o=r.filter(e=>T(b[n.site],e.pos.x,e.pos.z)).length,l=e.time-(e.liveStart+n.executeAt);if(!(o>=Math.min(2,r.length)||l>14||r.length===0)){let e=s.push[0];return{...i,moveGoal:e,walk:!1}}let u=a.plant[Math.floor(t.id)%a.plant.length];if(c&&Math.hypot(u.x-t.pos.x,u.z-t.pos.z)<1.5&&t.onGround){let e=Array.from(this.contacts.values()).some(e=>e.visible);return{...i,holdPosition:!0,wantUse:!e,lookAt:u}}return{...i,moveGoal:u}}return s.push[s.push.length-1],!r.smoked&&e.time<n.smokeAt+2?{...i,holdPosition:Math.hypot(r.stage.x-t.pos.x,r.stage.z-t.pos.z)<2}:t.pos.z<s.entry.z+3||c?Math.hypot(r.clear.x-t.pos.x,r.clear.z-t.pos.z)<1.5?{...i,holdPosition:!0,lookAt:jf[n.site].smoke[1]}:{...i,moveGoal:r.clear}:{...i,moveGoal:s.entry}}planDefense(e,t,n,r){let i={moveGoal:null,lookAt:null,walk:!1,holdPosition:!1,wantUse:!1},a=e.spike,o=t.kit?5:8;if(n.cusMode===`retake`&&a.state===`planted`){let r=a.explodeAt-e.time,s=Math.hypot(a.pos.x-t.pos.x,a.pos.z-t.pos.z);if(r<s/4.2+o*.6&&a.defuser!==t.id)return this.savedSpot=this.savedSpot??Nf.cus[t.id*3%Nf.cus.length],{...i,moveGoal:this.savedSpot};let c=n.retakeSite,l=jf[c].retake,u=l[Array.from(n.assign.keys()).indexOf(t.id)%l.length],d=Math.hypot(u.stage.x-t.pos.x,u.stage.z-t.pos.z);if(e.time<n.retakeGoAt&&d>2)return{...i,moveGoal:u.stage};if(e.time<n.retakeGoAt)return{...i,holdPosition:!0,lookAt:u.entry};let f=e.alive(`cus`),p=null,m=1/0;for(let e of f){let t=Math.hypot(e.pos.x-a.pos.x,e.pos.z-a.pos.z)-(e.kit?4:0);t<m&&(m=t,p=e)}let h=p&&p.id===t.id,g=Array.from(this.contacts.values()).some(e=>e.visible);if(h)return s<=1.3?{...i,holdPosition:!0,wantUse:!g||t.interact.progress>.5,lookAt:{x:a.pos.x,z:a.pos.z}}:{...i,moveGoal:{x:a.pos.x,z:a.pos.z}};let _=jf[c].clear,v=_[t.id%_.length];return{...i,moveGoal:v}}if(n.cusMode===`save`||!r||!r.hold)return i;let s=r.hold;if(e.phase===`live`&&e.phaseRemaining()<1)return i;let c=Math.hypot(s.x-t.pos.x,s.z-t.pos.z),l=r.role===`rotator`&&this.heardRotation(n,e);return c>1.2?{...i,moveGoal:s,walk:e.time-e.liveStart>3&&!l&&c<6}:(this.lookAround-=1/64,this.lookAround<-3&&(this.lookAround=.8,this.lookYaw=s.yaw+(e.rng()-.5)*1.8),{...i,holdPosition:!0,lookAt:this.lookAround>0?{x:s.x-Math.sin(this.lookYaw)*10,z:s.z-Math.cos(this.lookYaw)*10}:{x:s.x-Math.sin(s.yaw)*10,z:s.z-Math.cos(s.yaw)*10}})}heardRotation(e,t){return e.rotatedTo!==null}useUtility(e,t,n,r,i){if(t.util.length!==0||this.throwPlan){if(this.throwPlan){let n=this.throwPlan,r=n.type,o=t.util.indexOf(r);if(o<0){this.throwPlan=null;return}if(t.cur!==`util${o}`){i.select=`util${o}`,this.aimTo(n.yaw,n.pitch);return}this.aimTo(n.yaw,n.pitch),e.heldWeapon(t),Math.abs(a(n.yaw,this.yaw))<.03&&Math.abs(n.pitch-this.pitch)<.04&&e.time>=t.dropLock&&(i.fire=n.speed>15,i.alt=n.speed<=15,this.thrown.add(r+n.target.x),this.throwPlan=null)}else{if(t.side===`int`){if(n.intMode!==`execute`||t.spike)return;let i=jf[n.site];if(e.time>n.smokeAt+.2&&e.time<n.smokeAt+9){let a=t.util.indexOf(`veil`),o=`veil`+t.id;if(a>=0&&!this.thrown.has(o)&&e.rng()<.06*this.diff.utility+.04){let n=i.smoke[t.id%i.smoke.length],a=this.solveThrow(e,t,n,`veil`);this.thrown.add(o),a&&(this.throwPlan=a),r&&(r.smoked=!0)}let s=t.util.indexOf(`flash`),c=`flash`+t.id;if(s>=0&&!this.thrown.has(c)&&e.time>n.smokeAt+1.2&&e.rng()<.05*this.diff.utility+.03){let n=i.flash[t.id%i.flash.length],r=this.solveThrow(e,t,n,`flash`);this.thrown.add(c),r&&(this.throwPlan=r)}r&&!r.smoked&&e.time>n.smokeAt+1.5&&(r.smoked=!0)}}else{let r=Array.from(this.contacts.values()).filter(t=>e.time-t.t<3&&!t.visible).sort((e,t)=>t.t-e.t)[0];if(r&&e.rng()<.01*this.diff.utility){let n=t.util.includes(`frag`)?`frag`:t.util.includes(`flash`)?`flash`:null;if(n&&!this.thrown.has(n+Math.floor(e.time/5))){let i=this.solveThrow(e,t,{x:r.pos.x,z:r.pos.z},n);this.thrown.add(n+Math.floor(e.time/5)),i&&(this.throwPlan=i)}}if(n.cusMode===`retake`&&e.time>n.retakeGoAt-1.2&&e.time<n.retakeGoAt+3&&t.util.length){let n=`retake`+t.id;if(!this.thrown.has(n)){this.thrown.add(n);let r=t.util.includes(`veil`)?`veil`:t.util.includes(`flash`)?`flash`:t.util.includes(`thermite`)?`thermite`:t.util.includes(`frag`)?`frag`:null;if(r){let n=e.spike,i=r===`veil`?{x:n.pos.x+2,z:n.pos.z-2}:{x:n.pos.x,z:n.pos.z},a=this.solveThrow(e,t,i,r);a&&(this.throwPlan=a)}}}}if(t.side===`int`&&e.spike.state===`planted`&&e.spike.defuser>=0&&t.util.includes(`frag`)){let n=`defuseFrag`+t.id;if(!this.thrown.has(n)){this.thrown.add(n);let r=this.solveThrow(e,t,{x:e.spike.pos.x,z:e.spike.pos.z},`frag`);r&&(this.throwPlan=r)}}}}}aimTo(t,n){let r=a(t,this.yaw);this.yaw=i(this.yaw+e(r,-.12,.12)),this.pitch+=e(n-this.pitch,-.08,.08)}solveThrow(e,t,i,a){let o=e.eyePos(t),s=Af(t.pos,i),c=null;for(let e of[20,9])for(let t=-5;t<=60;t+=5){let a=t*n,l=r(s,a+.1),u=uf({x:o.x+l.x*.45,y:o.y+l.y*.45-.1,z:o.z+l.z*.45},{x:l.x*e,y:l.y*e,z:l.z*e},256),d=Math.hypot(u.end.x-i.x,u.end.z-i.z);(!c||d<c.err)&&(c={err:d,pitch:a,speed:e})}return!c||c.err>3.5?null:{type:a,target:i,yaw:s,pitch:c.pitch,speed:c.speed,from:{x:t.pos.x,z:t.pos.z}}}follow(e,t,n,r,i){if(!this.goal||Math.hypot(this.goal.x-n.x,this.goal.z-n.z)>1||e.time>=this.repathAt||!this.path.length){this.goal={...n},this.repathAt=e.time+2.5;let r=e.fires.length?(t,n)=>{for(let r of e.fires)for(let e of r.cells)if(Math.abs(e.x-t)<1&&Math.abs(e.z-n)<1)return 12;return 0}:void 0,i=ef(t.pos,{x:n.x,y:0,z:n.z},{extraCost:r});this.path=i??[],this.pathIdx=0}if(!this.path.length)return;for(;this.pathIdx<this.path.length-1&&Math.hypot(this.path[this.pathIdx].x-t.pos.x,this.path[this.pathIdx].z-t.pos.z)<.7;)this.pathIdx++;let a=this.path[this.pathIdx],o=a.x-t.pos.x,s=a.z-t.pos.z,c=Math.hypot(o,s);c<.35&&this.pathIdx>=this.path.length-1?this.path=[]:(this.worldMove={x:o/Math.max(c,.001),z:s/Math.max(c,.001)},r.walk=i)}worldMove=null;toLocalMove(t,n){if(!this.worldMove){n.moveX=0,n.moveZ=0;return}let r=this.worldMove;this.worldMove=null;let i=Math.sin(this.yaw),a=Math.cos(this.yaw);n.moveZ=e(r.x*-i+r.z*-a,-1,1),n.moveX=e(r.x*a+r.z*-i,-1,1)}stuckCheck(e,t,n){if(e.time-this.lastPosT>1){let r=Math.hypot(t.pos.x-this.lastPos.x,t.pos.z-this.lastPos.z);(n.moveX!==0||n.moveZ!==0)&&r<.3&&!n.use?(this.stuckT+=1,this.repathAt=0,n.jump=!0,this.stuckT>=3&&(this.path=[],this.goal=null,this.stuckT=0,this.strafeDir=-this.strafeDir)):this.stuckT=0,this.lastPos={...t.pos},this.lastPosT=e.time}this.stuckT>0&&e.time-this.lastPosT<.3&&(n.moveX+=0),this.crouching}};function Rf(e,t=`normal`,n={}){let r=Pf[t],i={cus:new Ff(`cus`),int:new Ff(`int`)};for(let t of e.players){if(t.controller!==`bot`||n.squad!==void 0&&t.squad!==n.squad)continue;let a=new Lf(r,i);e.brains.set(t.id,a)}return[i.cus,i.int]}var zf=8,Bf=null;function Vf(){if(Bf)return Bf;let e=document.createElement(`canvas`);e.width=96*zf,e.height=72*zf;let t=e.getContext(`2d`),n=zf;t.fillStyle=`#0b0f14`,t.fillRect(0,0,e.width,e.height);for(let e=0;e<36;e++)for(let r=0;r<48;r++){let i=h(r,e),a=`#3a4552`;i===`#`?a=`#10151b`:i===`C`||i===`c`?a=`#6a5a46`:i===`H`?a=`#566070`:i===`P`?a=`#2f6a3d`:i===`T`?a=`#4f6584`:`1234`.includes(i)?a=[`#445063`,`#4a586c`,`#516076`,`#58687f`][Number(i)-1]:i===`k`&&(a=`#2a323c`),t.fillStyle=a,t.fillRect(r*2*n,e*2*n,2*n+.5,2*n+.5)}for(let e of v)(e.mat===`thin`||e.mat===`glass`)&&(t.fillStyle=e.mat===`glass`?`#7fd8f0`:`#b9c3cf`,t.fillRect(e.x0*n,e.z0*n,Math.max(1.2,(e.x1-e.x0)*n),Math.max(1.2,(e.z1-e.z0)*n)));for(let e of[`A`,`B`]){let r=b[e];t.strokeStyle=`#ff3fa6`,t.lineWidth=2,t.fillStyle=`rgba(255,63,166,0.14)`,t.fillRect(r.x0*n,r.z0*n,(r.x1-r.x0)*n,(r.z1-r.z0)*n),t.strokeRect(r.x0*n,r.z0*n,(r.x1-r.x0)*n,(r.z1-r.z0)*n),t.fillStyle=`#ff7ac2`,t.font=`700 48px sans-serif`,t.textAlign=`center`,t.textBaseline=`middle`,t.fillText(e,(r.x0+r.x1)/2*n,(r.z0+r.z1)/2*n)}return Bf=e,e}function Hf(e,t,n,r,i){let a=Vf();e.clearRect(0,0,t,n),e.drawImage(a,0,0,t,n);let o=t/96,s=n/72;for(let t of r.smokes)e.fillStyle=`rgba(190,205,222,0.7)`,e.beginPath(),e.arc(t.x*o,t.z*s,t.r*o,0,Math.PI*2),e.fill();for(let t of r.fires)e.fillStyle=`rgba(255,120,40,0.8)`,e.fillRect((t.x-.5)*o,(t.z-.5)*s,o,s);for(let t of r.pulses){let n=Math.max(0,1-t.age/3),r=-Math.PI/2+t.sector*(Math.PI/4),i=[8,15,22][t.band]*o;e.fillStyle=`rgba(77,224,255,${.28*n})`,e.strokeStyle=`rgba(77,224,255,${.8*n})`,e.beginPath(),e.moveTo(t.x*o,t.z*s),e.arc(t.x*o,t.z*s,i,r-Math.PI/8,r+Math.PI/8),e.closePath(),e.fill(),e.stroke()}if(i){e.fillStyle=`rgba(220,230,240,0.78)`,e.font=`600 `+Math.max(10,t/70)+`px "Segoe UI", sans-serif`,e.textAlign=`center`,e.textBaseline=`middle`;for(let t of C)[`West Link`,`East Link`,`Mid Gate`,`Cal Ramp`,`Turbine Hall`,`Hydroponics`,`Calibration`,`A Site`,`B Site`,`Gantry`,`Mid Deck`,`West Dock`,`East Gate`,`Lab Link`,`Turbine Ramp`,`Fallback Lane`].includes(t.name)||e.fillText(t.name.toUpperCase(),(t.x0+t.x1)/2*o,(t.z0+t.z1)/2*s);for(let t of C)[`Gantry`,`Mid Deck`,`Fallback Lane`,`Turbine Ramp`,`Lab Link`,`Atrium`,`Freight Yard`,`Calibration`].includes(t.name)&&(e.fillStyle=`rgba(220,230,240,0.55)`,e.fillText(t.name.toUpperCase(),(t.x0+t.x1)/2*o,(t.z0+t.z1)/2*s+(t.name===`Calibration`?28:0)))}for(let t of r.grenades)e.fillStyle=`#fff`,e.beginPath(),e.arc(t.x*o,t.z*s,2.4,0,7),e.fill();r.spike&&(e.fillStyle=`#ff3fa6`,e.strokeStyle=`#fff`,e.lineWidth=1.5,e.beginPath(),e.rect(r.spike.x*o-5,r.spike.z*s-5,10,10),e.fill(),e.stroke(),r.spike.state===`planted`&&(e.strokeStyle=`rgba(255,63,166,0.6)`,e.beginPath(),e.arc(r.spike.x*o,r.spike.z*s,12+performance.now()%700/40,0,7),e.stroke()));for(let t of r.players){let n=t.side===`cus`?r.colors.cus:r.colors.int,i=t.x*o,a=t.z*s;if(!t.alive){e.strokeStyle=n,e.lineWidth=2,e.beginPath(),e.moveTo(i-4,a-4),e.lineTo(i+4,a+4),e.moveTo(i+4,a-4),e.lineTo(i-4,a+4),e.stroke();continue}e.save(),e.translate(i,a),e.rotate(-t.yaw),e.fillStyle=n,e.strokeStyle=t.spotted?`#ff3b4d`:`#0b0f14`,e.lineWidth=t.spotted?2.4:1.4;let c=t.self?8.5:7;e.beginPath(),e.moveTo(0,-c),e.lineTo(c*.72,c*.7),e.lineTo(0,c*.3),e.lineTo(-c*.72,c*.7),e.closePath(),e.fill(),e.stroke(),t.self&&(e.strokeStyle=`#fff`,e.lineWidth=1.6,e.stroke()),e.restore()}}function Q(e,t=``,n=``){let r=document.createElement(e);return t&&(r.className=t),n&&(r.innerHTML=n),r}var Uf={detonated:`Cipher detonated`,eliminated:`Team eliminated`,disarmed:`Cipher disarmed`,timeExpired:`Time expired`,defendersEliminated:`Defenders eliminated`},Wf=class{root;cache=new Map;refs={};radar;radarCtx;killfeed;toast;captions;ch;chParts=[];chDot;dmgInd;bannerT=0;hitT=0;flashLevel=0;bloodLevel=0;scope;constructor(e){this.root=e,e.innerHTML=``;let t=Q(`div`,`hud-top`),n=Q(`div`,`scorebar`),r=(e,t)=>{let n=Q(`div`,`score-team `+t),r=Q(`div`,`tname`),i=Q(`div`,`tscore`),a=Q(`div`,`pips`);return n.append(r,i,a),this.refs[e+`Name`]=r,this.refs[e+`Score`]=i,this.refs[e+`Pips`]=a,this.refs[e+`Team`]=n,n},i=Q(`div`,`score-mid`);this.refs.phase=Q(`div`,`phase-label`),this.refs.timer=Q(`div`,`timer`),this.refs.round=Q(`div`,`phase-label`),i.append(this.refs.phase,this.refs.timer,this.refs.round),n.append(r(`left`,`cus`),i,r(`right`,`int`)),this.refs.objective=Q(`div`,`objective hidden`),t.append(n,this.refs.objective);let a=Q(`div`);a.id=`radar-wrap`,this.radar=Q(`canvas`),this.radar.id=`radar`,this.radar.width=448,this.radar.height=336,a.append(this.radar),this.radarCtx=this.radar.getContext(`2d`),this.refs.callout=Q(`div`,`callout`),this.killfeed=Q(`div`,`killfeed`),this.toast=Q(`div`,`toast`),this.captions=Q(`div`,`captions`),this.ch=Q(`div`,`crosshair`);for(let e=0;e<4;e++){let e=Q(`div`,`ch`);this.ch.append(e),this.chParts.push(e)}this.chDot=Q(`div`,`dot`),this.ch.append(this.chDot),this.refs.hit=Q(`div`,`hitmarker`),this.refs.prompt=Q(`div`,`prompt hidden`),this.refs.banner=Q(`div`,`banner hidden`);let o=Q(`div`,`bottom-left`),s=Q(`div`,`stat hp`);s.innerHTML=`<div class="num">100</div><div class="cap">Health</div><div class="bar"><i></i></div>`;let c=Q(`div`,`stat armor`);c.innerHTML=`<div class="num">0</div><div class="cap">Armor</div><div class="bar"><i></i></div>`,this.refs.hp=s,this.refs.armor=c,this.refs.money=Q(`div`,`money`);let l=Q(`div`);l.append(this.refs.money,Q(`div`,``));let u=Q(`div`);u.style.display=`flex`,u.style.gap=`10px`,u.append(s,c),l.append(u),o.append(l);let d=Q(`div`,`bottom-right`);this.refs.ammo=Q(`div`,`ammo`),this.refs.slots=Q(`div`,`slots`),this.refs.utils=Q(`div`,`slots`),d.append(this.refs.ammo,this.refs.slots,this.refs.utils),this.refs.spectate=Q(`div`,`spectate hidden`),this.refs.fps=Q(`div`,`fps hidden`),this.refs.dmg=Q(`div`,`dmg-ind`),this.dmgInd=this.refs.dmg,this.scope=Q(`div`,`scope-overlay hidden`);let f=Q(`div`);f.id=`flash-overlay`;let p=Q(`div`);p.id=`blood-overlay`;let m=Q(`div`);m.id=`smoke-overlay`,this.refs.flash=f,this.refs.blood=p,this.refs.smoke=m,document.body.append(f,p,m),e.append(t,a,this.refs.callout,this.killfeed,this.toast,this.captions,this.ch,this.refs.hit,this.refs.prompt,this.refs.banner,o,d,this.refs.spectate,this.refs.fps,this.dmgInd,this.scope)}setText(e,t){this.cache.get(e)!==t&&(this.cache.set(e,t),this.refs[e].textContent=t)}setHtml(e,t){this.cache.get(e)!==t&&(this.cache.set(e,t),this.refs[e].innerHTML=t)}killEntry(e,t,n,r,i,a,o,s){let c=Q(`div`,`kill`+(s===`killer`?` me`:s===`victim`?` died`:``));for(c.innerHTML=`<span class="${t}">${$(e)}</span><span class="wpn">${$(i)}${o?` ▪ wall`:``}</span>${a?`<span class="hs">◉ HEAD</span>`:``}<span class="${r}">${$(n)}</span>`,this.killfeed.prepend(c);this.killfeed.children.length>6;)this.killfeed.lastElementChild.remove();setTimeout(()=>c.remove(),6500)}popup(e,t=``){let n=Q(`div`,t,$(e));for(this.toast.append(n);this.toast.children.length>4;)this.toast.firstElementChild.remove();setTimeout(()=>n.remove(),2800)}caption(e){let t=Q(`div`,``,$(e));for(this.captions.append(t);this.captions.children.length>3;)this.captions.firstElementChild.remove();setTimeout(()=>t.remove(),1800)}hitMarker(e,t){let n=this.refs.hit;n.className=`hitmarker`,n.offsetWidth,n.className=`hitmarker on`+(t?` kill`:e?` head`:``),this.hitT=.3}damageFrom(e){let t=document.createElement(`i`);t.style.transform=`rotate(${e}rad)`,t.style.opacity=`1`,t.style.transition=`opacity 1.2s ease-out`,this.dmgInd.append(t),requestAnimationFrame(()=>{t.style.opacity=`0`}),setTimeout(()=>t.remove(),1300),this.bloodLevel=Math.min(.8,this.bloodLevel+.4)}flash(e,t,n){this.flashLevel=Math.max(this.flashLevel,e),this.flashFull=Math.max(this.flashFull,t),this.flashReduce=n}flashFull=0;flashReduce=!1;showBanner(e,t,n,r){let i=this.refs.banner;i.className=`banner `+(e?`win`:`lose`),i.innerHTML=`<div class="big">${e?`Round won`:`Round lost`}</div><div class="small">${$(Uf[t]??t)}</div>${n?`<div class="small">${$(n)}</div>`:``}${r?`<div class="hl">${$(r)}</div>`:``}`,this.bannerT=4.2}showStatusBanner(e,t,n=2500){let r=this.refs.banner;r.className=`banner`,r.innerHTML=`<div class="big">${$(e)}</div><div class="small">${$(t)}</div>`,this.bannerT=n/1e3}hideBanner(){this.bannerT=0,this.refs.banner.classList.add(`hidden`)}clearTransient(){this.killfeed.innerHTML=``,this.toast.innerHTML=``,this.flashLevel=0,this.flashFull=0,this.bloodLevel=0,this.refs.flash.style.opacity=`0`,this.refs.blood.style.opacity=`0`,this.refs.smoke.style.opacity=`0`}update(e,t,n){let{snap:r,settings:i}=t,a=r.self,o=a.id<5?0:1,s=r.squadSide[o],c=s===`cus`?`int`:`cus`;this.refs.leftTeam.className=`score-team `+s,this.refs.rightTeam.className=`score-team `+c,this.setText(`leftName`,s===`cus`?`Custodian · You`:`Intrusion · You`),this.setText(`rightName`,c===`cus`?`Custodian`:`Intrusion`),this.setText(`leftScore`,String(r.score[o])),this.setText(`rightScore`,String(r.score[1-o]));let l=e=>r.roster?r.roster.filter(t=>t.side===e):[];this.pips(`leftPips`,l(s)),this.pips(`rightPips`,l(c));let u=Math.max(0,r.phaseRemaining-Math.max(0,t.serverTime-r.time)),d=Math.floor(u/60),f=Math.floor(u%60),p=r.phase===`armed`,m=`Round `+r.round,h=``;switch(r.phase){case`buy`:h=`Buy phase`;break;case`live`:h=`Live`;break;case`armed`:h=`Cipher armed`;break;case`roundEnd`:h=`Round over`;break;case`halftime`:h=`Sides swap`;break;case`matchEnd`:h=`Match over`;break;default:h=``}this.setText(`phase`,h),this.setText(`timer`,r.phase===`roundEnd`||r.phase===`matchEnd`?`–:––`:`${d}:${String(f).padStart(2,`0`)}`),this.refs.timer.className=`timer`+(p?` armed`:u<10&&r.phase===`live`?` low`:``);let g=r.rules.winRounds;this.setText(`round`,m+` · first to `+g);let _=r.spike,v=``,y=`objective hidden`;p?(v=s===`int`?`Defend the Cipher · `+Math.ceil(_.remaining-Math.max(0,t.serverTime-r.time))+`s`:`Disarm the Cipher at `+(_.site??``)+` · `+Math.ceil(_.remaining-Math.max(0,t.serverTime-r.time))+`s`,y=`objective armed`,_.defuser>=0&&_.defuseProgress>0&&(v+=` · defusing`)):(r.phase===`live`||r.phase===`buy`)&&(s===`int`?(a.spike?v=`You carry the Cipher Spike · arm it inside a vault (E)`:_.state===`dropped`?v=_.pos?`The Cipher Spike is on the ground`:`The Spike was dropped`:_.state===`carried`&&(v=`Escort the Spike carrier to a vault`),y=v?`objective`:`objective hidden`):(v=`Stop the Intrusion from arming the Cipher at A or B`,y=`objective`)),this.setText(`objective`,v),this.refs.objective.className=y,this.setText(`callout`,w(t.pos.x,t.pos.z));let b=t.snap.roster?.find(e=>e.id===t.viewId),x=t.spectating?b?.hp??0:a.hp,S=t.spectating?b?.armor??0:a.armor;this.setHtml(`hp`,`<div class="num">${Math.max(0,Math.round(x))}</div><div class="cap">Health</div><div class="bar"><i style="width:${Gf(x/100)*100}%"></i></div>`),this.refs.hp.className=`stat hp`+(x<30?` low`:``),this.setHtml(`armor`,`<div class="num">${Math.round(S)}</div><div class="cap">Armor${(t.spectating?b?.helmet:a.helmet)?` + Helm`:``}</div><div class="bar"><i style="width:${Gf(S/100)*100}%"></i></div>`);let C=r.phase===`buy`||r.phase===`roundEnd`||r.phase===`halftime`;this.setText(`money`,t.spectating?``:(C||r.self.canBuy,`$`+a.money.toLocaleString())),this.refs.money.style.opacity=C?`1`:`0.75`,this.drawAmmo(t);let T=``,E=0;if(!t.spectating&&a.alive&&(a.interact.kind===`arm`?(T=`Arming the Cipher…`,E=a.interact.progress/3.2):a.interact.kind===`defuse`?(T=`Disarming…`,E=a.interact.progress/_.defuseNeeded):a.spike&&r.phase===`live`?Kf(t.pos)&&(T=`Hold [E] to arm the Cipher`):s===`cus`&&p&&_.pos&&Math.hypot(_.pos.x-t.pos.x,_.pos.z-t.pos.z)<2.4?T=`Hold [E] to disarm`+(a.kit?` (kit: 5 s)`:` (8 s)`):r.phase===`buy`&&a.canBuy&&(T=`Press [B] to open the buy menu`)),T?(this.refs.prompt.classList.remove(`hidden`),this.setHtml(`prompt`,`<div>${$(T)}</div>${E>0?`<div class="pbar"><i style="width:${Gf(E)*100}%"></i></div>`:``}`)):this.refs.prompt.classList.add(`hidden`),t.spectating?(this.refs.spectate.classList.remove(`hidden`),this.setHtml(`spectate`,`Spectating <b>${$(t.names[t.viewId]??``)}</b><small>Click or ←/→ to switch teammate · you can only see what your team sees</small>`)):this.refs.spectate.classList.add(`hidden`),this.updateCrosshair(t,i),Hf(this.radarCtx,this.radar.width,this.radar.height,t.mapData,!1),this.hitT>0&&(this.hitT-=e),this.bannerT>0&&(this.bannerT-=e,this.refs.banner.classList.toggle(`hidden`,this.bannerT<=0)),this.flashLevel>0){this.flashLevel-=e,this.flashFull-=e;let t=this.flashReduce?.55:1,n=this.flashFull>0?1:Math.max(0,this.flashLevel/Math.max(.3,Math.min(1.5,this.flashLevel+this.flashFull+.5)));n=Math.min(1,n*1)*t,this.refs.flash.style.opacity=String(Math.max(0,n))}else this.refs.flash.style.opacity=`0`,this.flashFull=0;this.bloodLevel>0&&(this.bloodLevel=Math.max(0,this.bloodLevel-e*.6));let D=!t.spectating&&a.alive&&a.hp<30?.35:0;this.refs.blood.style.opacity=String(Math.max(this.bloodLevel,D)),this.refs.smoke.style.opacity=String(n),this.scope.classList.toggle(`hidden`,t.scopeLevel<=0),this.refs.fps.classList.toggle(`hidden`,!i.showFps),i.showFps&&this.setText(`fps`,t.fps.toFixed(0)+` fps`)}pips(e,t){let n=t.map(e=>`<div class="pip${e.alive?``:` dead`}"></div>`).join(``);this.setHtml(e,n)}drawAmmo(e){let t=e.snap.self,n=t.cur,r=n===`primary`?t.weapons.primary:n===`secondary`?t.weapons.secondary:n===`tool`?t.weapons.tool:null,i=r?I[r.id]:null,a=!!r?.reloading;if(e.spectating){let t=e.snap.roster?.find(t=>t.id===e.viewId);this.setHtml(`ammo`,`<div class="wname">${$(t?.primary?I[t.primary].name:t?.secondary?I[t.secondary].name:``)}</div>`),this.refs.slots.innerHTML=``,this.refs.utils.innerHTML=``,this.cache.delete(`slots`),this.cache.delete(`utils`);return}if(i&&i.mode!==`melee`)this.setHtml(`ammo`,`<div class="wname">${$(i.name)}${a?` · reloading`:``}</div><div class="mag">${r.mag}<small>/ ${r.reserve}</small></div>`);else if(i)this.setHtml(`ammo`,`<div class="wname">${$(i.name)}</div><div class="mag">—</div>`);else if(n.startsWith(`util`)){let e=t.util[Number(n.slice(4))];this.setHtml(`ammo`,`<div class="wname">${e?$(fe[e].name):``}</div><div class="mag" style="font-size:22px">LMB throw · RMB lob</div>`)}this.refs.ammo.className=`ammo`+(a?` reloading`:``);let o=(e,t,n,r)=>n?`<div class="slot${r?` on`:``}"><b>${e}</b>${$(t)}</div>`:``;this.setHtml(`slots`,o(`1`,t.weapons.primary?I[t.weapons.primary.id].name:``,t.weapons.primary?`p`:null,n===`primary`)+o(`2`,t.weapons.secondary?I[t.weapons.secondary.id].name:``,t.weapons.secondary?`s`:null,n===`secondary`)+o(`3`,`Tool`,`t`,n===`tool`)),this.setHtml(`utils`,t.util.map((e,t)=>`<div class="slot util${n===`util`+t?` on`:``}" style="border-bottom:3px solid ${fe[e].color}"><b>${4+t}</b>${$(fe[e].name.split(` `)[0])}</div>`).join(``)+(t.kit?`<div class="slot util">Kit</div>`:``)+(t.spike?`<div class="slot util" style="border-color:#ff3fa6">Spike</div>`:``))}updateCrosshair(e,t){let n=t.crosshair,r=e.scopeLevel>0||e.spectating;if(this.ch.style.display=r?`none`:`block`,r)return;let i=window.innerHeight/2/Math.tan(e.vfov*Math.PI/360),a=n.dynamic?Math.tan(e.spread)*i:0,o=n.gap+Math.min(60,a),s=n.size,c=n.thickness;this.ch.style.setProperty(`--ch-color`,n.color),this.ch.style.opacity=String(n.opacity);let l=this.chParts,u=(e,t,r,i,a)=>{e.style.left=t+`px`,e.style.top=r+`px`,e.style.width=i+`px`,e.style.height=a+`px`,e.className=`ch`+(n.outline?` outline`:``)};u(l[0],-c/2,-o-s,c,s),u(l[1],-c/2,o,c,s),u(l[2],-o-s,-c/2,s,c),u(l[3],o,-c/2,s,c),this.chDot.style.display=n.dot?`block`:`none`,this.chDot.style.width=this.chDot.style.height=Math.max(2,c+1)+`px`}setVisible(e){this.root.classList.toggle(`hidden`,!e),document.getElementById(`flash-overlay`).style.display=e?`block`:`none`}destroy(){this.refs.flash.remove(),this.refs.blood.remove(),this.refs.smoke.remove()}};function Gf(e){return Math.max(0,Math.min(1,e))}function $(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`})[e])}function Kf(e){return T(b.A,e.x,e.z)||T(b.B,e.x,e.z)}var qf=[`Sidearms`,`SMGs`,`Rifles`,`Heavy`,`Armor & Kit`,`Utility`];function Jf(){let e=[],t=(t,n)=>e.push({id:t,name:I[t].name,price:I[t].price,blurb:I[t].blurb,cat:n,weapon:t});t(`vela`,0),t(`rook`,0),t(`needle`,0),t(`kite`,1),t(`vectora`,1),t(`aster`,2),t(`krait`,2),t(`lumen`,2),t(`longglass`,3),t(`sable`,3),t(`rampart`,3),t(`atlas`,3),e.push({id:`vest`,name:P.vest.name,price:P.vest.price,blurb:`Absorbs part of body damage. Degrades as it absorbs.`,cat:4}),e.push({id:`vesthelmet`,name:P.vestHelmet.name,price:P.vestHelmet.price,blurb:`Vest plus a helmet that cuts headshot damage.`,cat:4}),e.push({id:`helmet`,name:`Helmet`,price:P.helmetUpgrade,blurb:`Helmet only (upgrade).`,cat:4}),e.push({id:`kit`,name:P.kit.name,price:P.kit.price,blurb:`Disarm the Cipher in 5 s instead of 8 s. Custodians only.`,cat:4,side:`cus`});for(let t of pe)e.push({id:t.id,name:t.name,price:t.price,blurb:t.blurb,cat:5});return e}var Yf=Jf(),Xf=class{root;cat=2;catsEl;itemsEl;sideEl;open=!1;onBuy=()=>void 0;onRefund=()=>void 0;onClose=()=>void 0;view=null;lastKey=``;constructor(e){this.root=Q(`div`,`overlay hidden`);let t=Q(`div`,`buy`),n=Q(`div`);n.innerHTML=`<h3>Buy menu</h3>`,this.catsEl=Q(`div`,`cats`),n.append(this.catsEl);let r=Q(`div`);r.style.cssText=`margin-top:14px;color:var(--dim);font-size:12px;line-height:1.6`,r.innerHTML=`<kbd>1-6</kbd> category · <kbd>1-9</kbd> item<br>Click an owned, unused item to refund<br><kbd>B</kbd> / <kbd>Esc</kbd> close`,n.append(r);let i=Q(`div`);i.style.cssText=`display:flex;flex-direction:column;min-height:0`,i.innerHTML=`<h3 id="buy-cat-title">Rifles</h3>`,this.itemsEl=Q(`div`,`items`),i.append(this.itemsEl),this.sideEl=Q(`div`,`side`),t.append(n,i,this.sideEl),this.root.append(t),e.append(this.root),this.root.addEventListener(`mousedown`,e=>{e.target===this.root&&this.onClose()}),this.renderCats()}show(e){this.open=e,this.root.classList.toggle(`hidden`,!e),this.lastKey=``}renderCats(){this.catsEl.innerHTML=``,qf.forEach((e,t)=>{let n=Q(`div`,`cat`+(t===this.cat?` on`:``),`<kbd>${t+1}</kbd>${e}`);n.addEventListener(`click`,()=>{this.cat=t,this.lastKey=``,this.renderCats(),this.render()}),this.catsEl.append(n)})}handleKey(e){if(!this.open)return!1;if(e===`KeyB`||e===`Escape`)return this.onClose(),!0;let t=/^Digit(\d)$/.exec(e);if(!t)return!1;let n=Number(t[1]),r=this.visibleItems();if(this.itemMode){let e=r[n-1];return this.itemMode=!1,e&&this.activate(e),!0}return n>=1&&n<=qf.length&&(this.cat=n-1,this.itemMode=!0,setTimeout(()=>{this.itemMode=!1},2500),this.lastKey=``,this.renderCats(),this.render()),!0}itemMode=!1;visibleItems(){return Yf.filter(e=>e.cat===this.cat&&(!e.side||e.side===this.view?.side))}owned(e){let t=this.view.snap.self;if(e.weapon){let n=I[e.weapon].slot===`secondary`?t.weapons.secondary:t.weapons.primary;return!!n&&n.id===e.weapon}if(e.id===`vest`)return t.armor>=100;if(e.id===`helmet`)return t.helmet;if(e.id===`vesthelmet`)return t.armor>=100&&t.helmet;if(e.id===`kit`)return t.kit;let n=fe[e.id];return!!n&&t.util.filter(e=>e===n.id).length>=n.max}activate(e){let t=this.view,n=t.snap.self,r=!t.practice&&n.purchases.includes(e.id)&&t.snap.phase===`buy`;this.owned(e)&&r?this.onRefund(e.id):this.onBuy(e.id)}update(e){this.view=e,this.open&&this.render()}render(){let e=this.view;if(!e)return;let t=e.snap.self,n=JSON.stringify([this.cat,t.money,t.weapons.primary?.id,t.weapons.secondary?.id,t.armor,t.helmet,t.kit,t.util,t.purchases,t.canBuy,e.snap.phase,e.snap.roster?.map(e=>[e.money,e.primary,e.secondary,e.alive,e.util?.length])]);if(n===this.lastKey)return;this.lastKey=n;let r=this.root.querySelector(`#buy-cat-title`);r&&(r.textContent=qf[this.cat]),this.itemsEl.innerHTML=``,this.visibleItems().forEach((n,r)=>{let i=n.id===`vesthelmet`?P.vestHelmet.price-(t.armor>=100?P.vest.price:0)-(t.helmet?P.helmetUpgrade:0):n.price,a=this.owned(n),o=!e.practice&&t.purchases.includes(n.id)&&e.snap.phase===`buy`,s=e.practice||t.money>=i,c=!t.canBuy||!s&&!(a&&o)||a&&!o&&n.weapon===void 0&&n.cat!==5,l=Q(`div`,`item`+(a?` owned`:``)+(c?` disabled`:``)),u=``;if(n.weapon){let e=I[n.weapon],t=(e,t)=>`<span>${e}</span><i><b style="width:${Math.max(4,Math.min(100,t*100))}%"></b></i>`;e.mode!==`melee`&&(u=`<div class="st">${t(`Damage`,e.damage*Math.min(e.pellets,4)*(e.pellets>1?.7:1)/125)}${t(`Rate`,Math.min(1,(e.mode===`bolt`?90:e.rpm)/900))}${t(`Mobility`,e.moveSpeed/5.4)}${t(`Armor pen`,e.armorPen)}</div>`)}l.innerHTML=`<div class="top"><span class="nm">${$(n.name)}</span><span class="pr">${i>0?`$`+i.toLocaleString():``}</span></div><div class="ds">${$(n.blurb)}</div>${u}<span class="key"><kbd>${r+1}</kbd></span>${a?`<span class="own-tag">${o?`OWNED · CLICK TO REFUND`:`OWNED`}</span>`:``}`,l.addEventListener(`click`,()=>{c||this.activate(n)}),this.itemsEl.append(l)});let i=e.snap.lossTier[t.id<5?0:1],a=(e.snap.roster??[]).filter(t=>t.side===e.side),o=e=>[e.primary?I[e.primary].name:e.secondary?I[e.secondary].name:`Pistol`,(e.armor??0)>0?e.helmet?`Vest+Helm`:`Vest`:``,e.kit?`Kit`:``,...(e.util??[]).map(e=>fe[e].name.split(` `)[0])].filter(Boolean).join(` · `);this.sideEl.innerHTML=`<h3>Your money</h3><div class="cash">$${t.money.toLocaleString()}</div>
      <div style="color:var(--dim);font-size:12px;letter-spacing:.06em">Next round minimum: <b style="color:#9dff9a">$${me.lossBase+me.lossStep*i}</b> (loss) · <b style="color:#9dff9a">$${me.roundWin}</b> (win)${e.side===`int`?`<br>Arming the Cipher earns $600 for the team even in defeat.`:``}</div>
      ${t.canBuy?``:`<div style="color:var(--bad);font-size:13px">Buying is locked: `+(e.snap.phase===`buy`?`return to your spawn area`:`buy phase is over`)+`.</div>`}
      <h3 style="margin-top:8px">Team</h3>
      ${a.map(e=>`<div class="team-row"><span>${$(e.name)}${e.id===t.id?` (you)`:``}</span><span style="color:#9dff9a">$${(e.money??0).toLocaleString()}</span><span class="eq">${$(o(e))}</span></div>`).join(``)}`}},Zf={sensitivity:2,adsSensitivity:.8,fov:90,volume:.7,sfxVolume:1,musicVolume:.5,quality:`medium`,resolutionScale:1,reduceFlash:!1,reduceMotion:!1,colorblind:`default`,holdCrouch:!0,holdWalk:!0,showFps:!1,leftHand:!1,captions:!0,crosshair:{color:`#6dffd9`,size:7,thickness:2,gap:4,dot:!1,outline:!0,dynamic:!0,opacity:1},difficulty:`normal`,rules:`quick`,side:`int`},Qf=`last-protocol.settings.v1`;function $f(){try{let e=localStorage.getItem(Qf);if(!e)return structuredClone(Zf);let t=JSON.parse(e);return{...structuredClone(Zf),...t,crosshair:{...Zf.crosshair,...t.crosshair??{}}}}catch{return structuredClone(Zf)}}function ep(e){try{localStorage.setItem(Qf,JSON.stringify(e))}catch{}}function tp(e){return JSON.stringify({sensitivity:e.sensitivity,adsSensitivity:e.adsSensitivity,fov:e.fov})}var np=class{settings;root;onStart=()=>void 0;onResume=()=>void 0;onQuit=()=>void 0;onSettingsChanged=()=>void 0;onUiClick=()=>void 0;constructor(e,t){this.settings=t,this.root=Q(`div`),e.append(this.root)}set(e){this.root.innerHTML=``,this.root.append(e)}clear(){this.root.innerHTML=``}get visible(){return this.root.childElementCount>0}click(e){return()=>{this.onUiClick(),e()}}showTitle(){let e=Q(`div`,`screen dim`),t=Q(`div`,`title-wrap`),n=Q(`div`);n.innerHTML=`<div class="logo">Last<span>Protocol</span></div><div class="tagline">Tactical 5v5 · Cipher Breach · Aperture Annex</div>
      <div class="badge-row"><span class="badge">No respawns</span><span class="badge">Buy · Save · Retake</span><span class="badge">Utility is a language</span></div>
      <p style="max-width:470px;color:var(--dim);line-height:1.6;margin-top:22px">Intrusion arms the Cipher at a vault; Custodians stop them. One life per round, money carries over, every sound is a clue. You play on a squad of bots against a bot squad, with the full economy and round rules.</p>`;let r=Q(`div`,`menu`),i=(e,t,n,i=``)=>{let a=Q(`button`,`btn `+i,`${$(e)}<span class="sub">${$(t)}</span>`);a.addEventListener(`click`,this.click(n)),r.append(a)};i(`Play`,`Cipher Breach vs bots · quick or full match`,()=>this.showPlay(),`primary`),i(`Practice`,`Infinite money, buy anywhere, grenade trajectory preview`,()=>this.showPlay(!0)),i(`Learn`,`Controls, rules, economy`,()=>this.showLearn()),i(`Settings`,`Mouse, video, audio, crosshair, accessibility`,()=>this.showSettings(()=>this.showTitle())),i(`Credits`,`Assets and licences`,()=>this.showCredits()),t.append(n,r),e.append(t),this.set(e)}showPlay(e=!1){let t=this.settings(),n=Q(`div`,`screen dim`),r=Q(`div`,`panel-wide`);r.style.width=`min(760px,94vw)`,r.innerHTML=`<h2>${e?`Practice`:`Play`}</h2><div style="color:var(--dim);font-size:14px;line-height:1.5">${e?`Practice server: unlimited money, buy at any time and place, grenade trajectory preview (hold a grenade). Bots fight on both sides.`:`Your squad of four bots joins you against five bots. Full economy, objective, side swap and overtime rules.`}</div>`;let i=t.rules,a=t.side,o=t.difficulty,s=(e,t,n,r)=>{let i=Q(`div`);i.append(Q(`div`,`label`,e));let a=Q(`div`,`row`);for(let[e,i]of t){let t=Q(`button`,`chip`+(n()===e?` on`:``),$(i));t.addEventListener(`click`,()=>{this.onUiClick(),r(e),a.querySelectorAll(`.chip`).forEach(e=>e.classList.remove(`on`)),t.classList.add(`on`)}),a.append(t)}return i.append(a),i};e||r.append(s(`Match length`,[[`quick`,`${_e.quick.name} · ${_e.quick.blurb}`],[`full`,`${_e.full.name} · ${_e.full.blurb}`]],()=>i,e=>{i=e})),r.append(s(`Starting side`,[[`int`,`Intrusion (attack)`],[`cus`,`Custodian (defend)`],[`random`,`Random`]],()=>a,e=>{a=e})),r.append(s(`Bot skill`,[[`easy`,`Easy`],[`normal`,`Normal`],[`hard`,`Hard`]],()=>o,e=>{o=e}));let c=Q(`div`,`row`);c.style.marginTop=`24px`;let l=Q(`button`,`btn primary`,e?`Start practice`:`Deploy`);l.addEventListener(`click`,this.click(()=>{let t=this.settings();t.rules=i,t.side=a,t.difficulty=o,ep(t),this.onStart({mode:e?`practice`:`match`,rules:i,side:a,difficulty:o})}));let u=Q(`button`,`btn`,`Back`);u.addEventListener(`click`,this.click(()=>this.showTitle())),c.append(l,u),r.append(c),n.append(r),this.set(n)}showLearn(){let e=Q(`div`,`screen dim`),t=Q(`div`,`panel-wide`),n=(e,t)=>`<b>${$(t)}</b><span>${e}</span>`;t.innerHTML=`<h2>Learn</h2><div class="grid2">
      <div><div class="label">Controls</div><div class="kv">
        ${n(`<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>`,`Move`)}${n(`<kbd>Shift</kbd> hold`,`Silent walk (52%)`)}${n(`<kbd>Ctrl</kbd> / <kbd>C</kbd>`,`Crouch (40%)`)}${n(`<kbd>Space</kbd>`,`Jump`)}
        ${n(`<kbd>LMB</kbd> / <kbd>RMB</kbd>`,`Fire / scope or lob`)}${n(`<kbd>R</kbd>`,`Reload`)}${n(`<kbd>E</kbd> hold`,`Arm · disarm · pick up`)}${n(`<kbd>G</kbd>`,`Drop weapon`)}
        ${n(`<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd>`,`Primary · sidearm · tool`)}${n(`<kbd>4</kbd>–<kbd>7</kbd>`,`Utility slots`)}${n(`<kbd>Q</kbd> · wheel`,`Quick switch · cycle`)}${n(`<kbd>B</kbd>`,`Buy menu (buy phase)`)}
        ${n(`<kbd>Tab</kbd> hold`,`Scoreboard · economy`)}${n(`<kbd>M</kbd>`,`Tactical map`)}${n(`<kbd>F</kbd>`,`Inspect`)}${n(`<kbd>Esc</kbd>`,`Menu`)}
      </div></div>
      <div><div class="label">Round rules</div>
        <div style="line-height:1.6;font-size:14px;color:#cdd6df">
        • 20 s buy phase, 105 s action clock, one life per round.<br>
        • Intrusion carries the Cipher Spike and must <b>hold E for 3.2 s inside vault A or B</b>. Then a <b>35 s</b> timer runs.<br>
        • Custodians <b>disarm in 8 s (5 s with a Defuse Tool)</b>; letting go resets progress.<br>
        • Win a round: detonation, elimination, successful disarm, or time expiring before arming.<br>
        • Economy: $800 start · win $3,000 · loss $1,900 rising by $400 to $3,100 · arming pays $300 plus $600 team · survivors keep gear.<br>
        • First to 9 (quick: 5), sides swap at the half, win by 2, max 20 rounds.</div>
        <div class="label">Tips</div>
        <div style="line-height:1.6;font-size:14px;color:#cdd6df">Stop moving before you shoot. Spray patterns are learnable: pull down and against the sway. Footsteps travel; silent walk is nearly silent. Smoke is opaque the same on every setting.</div>
      </div></div>
      <div class="row" style="margin-top:20px"><button class="btn primary">Back</button></div>`,t.querySelector(`button`).addEventListener(`click`,this.click(()=>this.showTitle())),e.append(t),this.set(e)}showCredits(){let e=Q(`div`,`screen dim`),t=Q(`div`,`panel-wide`);t.innerHTML=`<h2>Credits</h2><div style="line-height:1.7;color:#cdd6df;font-size:15px">
      <b>Last Protocol</b> is an original game: fictional security teams, an original objective (the Cipher Spike), original weapons, map and rules.<br><br>
      All geometry, textures, models, particles, sounds and music are generated procedurally at runtime from code. No external art, audio or font files are used.<br>
      Rendering by <b>three.js</b> (MIT). Built with Vite and TypeScript. See ASSETS.md in the repository for the full list.</div>
      <div class="row" style="margin-top:20px"><button class="btn primary">Back</button></div>`,t.querySelector(`button`).addEventListener(`click`,this.click(()=>this.showTitle())),e.append(t),this.set(e)}showSettings(e){let t=this.settings(),n=Q(`div`,`screen dim`),r=Q(`div`,`panel-wide`);r.innerHTML=`<h2>Settings</h2>`;let i=()=>{ep(t),this.onSettingsChanged()},a=(e,t,n,r,a,o,s,c=e=>String(e))=>{let l=Q(`div`,`slider-row`),u=Q(`label`,``,$(t)),d=Q(`input`);d.type=`range`,d.min=String(n),d.max=String(r),d.step=String(a),d.value=String(o());let f=Q(`span`,``,c(o()));d.addEventListener(`input`,()=>{s(Number(d.value)),f.textContent=c(Number(d.value)),i()}),l.append(u,d,f),e.append(l)},o=(e,t,n,r)=>{let a=Q(`label`,`toggle`),o=Q(`input`);o.type=`checkbox`,o.checked=n(),o.addEventListener(`change`,()=>{r(o.checked),i()}),a.append(o,document.createTextNode(t)),e.append(a)},s=(e,t,n,r,a)=>{let o=Q(`div`,`slider-row`);o.append(Q(`label`,``,$(t)));let s=Q(`select`);for(let[e,t]of n){let n=Q(`option`);n.value=e,n.textContent=t,e===r()&&(n.selected=!0),s.append(n)}s.addEventListener(`change`,()=>{a(s.value),i()}),o.append(s),e.append(o)},c=Q(`div`,`grid2`),l=Q(`div`),u=Q(`div`);l.append(Q(`div`,`label`,`Mouse & view`)),a(l,`Sensitivity`,.2,6,.05,()=>t.sensitivity,e=>{t.sensitivity=e},e=>e.toFixed(2)),a(l,`Scoped multiplier`,.2,1.5,.05,()=>t.adsSensitivity,e=>{t.adsSensitivity=e},e=>e.toFixed(2)),a(l,`Field of view`,80,105,1,()=>t.fov,e=>{t.fov=e},e=>e+`°`),o(l,`Hold to crouch (off = toggle)`,()=>t.holdCrouch,e=>{t.holdCrouch=e}),o(l,`Hold to walk (off = toggle)`,()=>t.holdWalk,e=>{t.holdWalk=e}),o(l,`Left-hand viewmodel`,()=>t.leftHand,e=>{t.leftHand=e});let d=Q(`button`,`btn small`,`Copy sensitivity (JSON)`);d.addEventListener(`click`,()=>{try{navigator.clipboard.writeText(tp(t))}catch{}}),l.append(d),l.append(Q(`div`,`label`,`Audio`)),a(l,`Master volume`,0,1,.05,()=>t.volume,e=>{t.volume=e},e=>Math.round(e*100)+`%`),a(l,`Effects`,0,1,.05,()=>t.sfxVolume,e=>{t.sfxVolume=e},e=>Math.round(e*100)+`%`),a(l,`Menu music`,0,1,.05,()=>t.musicVolume,e=>{t.musicVolume=e},e=>Math.round(e*100)+`%`),o(l,`Captions for critical sounds`,()=>t.captions,e=>{t.captions=e}),u.append(Q(`div`,`label`,`Video`)),s(u,`Quality`,[[`low`,`Low`],[`medium`,`Medium`],[`high`,`High`]],()=>t.quality,e=>{t.quality=e}),a(u,`Resolution scale`,.5,1,.05,()=>t.resolutionScale,e=>{t.resolutionScale=e},e=>Math.round(e*100)+`%`),o(u,`Show FPS`,()=>t.showFps,e=>{t.showFps=e}),u.append(Q(`div`,`label`,`Accessibility`)),s(u,`Team colours`,[[`default`,`Cyan / amber`],[`deuteranopia`,`Blue / yellow (deuteranopia)`],[`protanopia`,`Blue / yellow (protanopia)`],[`mono`,`White / yellow (high contrast)`]],()=>t.colorblind,e=>{t.colorblind=e,document.documentElement.dataset.cb=e}),o(u,`Reduce flash intensity`,()=>t.reduceFlash,e=>{t.reduceFlash=e}),o(u,`Reduce motion (bob, sway)`,()=>t.reduceMotion,e=>{t.reduceMotion=e}),u.append(Q(`div`,`label`,`Crosshair`));let f=t.crosshair,p=Q(`div`);p.style.cssText=`height:70px;border:1px solid var(--line);border-radius:4px;background:#2a3038;position:relative;margin-bottom:6px`;let m=Q(`div`);m.style.cssText=`position:absolute;left:50%;top:50%`,p.append(m);let h=()=>{m.innerHTML=``;let e=(e,t,n,r)=>{let i=Q(`div`);i.style.cssText=`position:absolute;left:${e}px;top:${t}px;width:${n}px;height:${r}px;background:${f.color};opacity:${f.opacity};${f.outline?`box-shadow:0 0 0 1px rgba(0,0,0,.85);`:``}`,m.append(i)};e(-f.thickness/2,-f.gap-f.size,f.thickness,f.size),e(-f.thickness/2,f.gap,f.thickness,f.size),e(-f.gap-f.size,-f.thickness/2,f.size,f.thickness),e(f.gap,-f.thickness/2,f.size,f.thickness),f.dot&&e(-1,-1,2,2)};u.append(p);let g=(e,t,n,r,i)=>a(u,e,t,n,r,()=>f[i],e=>{f[i]=e,h()},e=>String(e));g(`Length`,1,20,1,`size`),g(`Thickness`,1,6,1,`thickness`),g(`Gap`,0,14,1,`gap`),g(`Opacity`,.3,1,.05,`opacity`);let _=Q(`div`,`slider-row`);_.append(Q(`label`,``,`Colour`));let v=Q(`div`,`row`);for(let e of[`#6dffd9`,`#ffffff`,`#ffe14a`,`#ff5d73`,`#7cb7ff`,`#ff3fa6`]){let t=Q(`button`,`chip`,``);t.style.cssText=`background:${e};width:28px;height:28px;padding:0;border-color:${f.color===e?`#fff`:`transparent`}`,t.addEventListener(`click`,()=>{f.color=e,i(),h(),v.querySelectorAll(`button`).forEach(e=>e.style.borderColor=`transparent`),t.style.borderColor=`#fff`}),v.append(t)}_.append(v),u.append(_),o(u,`Center dot`,()=>f.dot,e=>{f.dot=e,h()}),o(u,`Outline`,()=>f.outline,e=>{f.outline=e,h()}),o(u,`Dynamic gap (shows movement inaccuracy only)`,()=>f.dynamic,e=>{f.dynamic=e}),h(),c.append(l,u),r.append(c);let y=Q(`div`,`row`);y.style.marginTop=`18px`;let b=Q(`button`,`btn primary`,`Done`);b.addEventListener(`click`,this.click(()=>{ep(t),e()}));let x=Q(`button`,`btn`,`Reset to defaults`);x.addEventListener(`click`,this.click(()=>{Object.assign(t,structuredClone(Zf)),ep(t),this.onSettingsChanged(),this.showSettings(e)})),y.append(b,x),r.append(y),n.append(r),this.set(n)}showPause(){let e=Q(`div`,`screen dim`),t=Q(`div`,`menu-card pause`);t.innerHTML=`<h2>Paused</h2><div style="color:var(--dim);font-size:13px;margin-bottom:12px">Local match: the simulation is paused while this menu is open.</div>`;let n=Q(`div`,`menu`),r=(e,t,r=``)=>{let i=Q(`button`,`btn `+r,$(e));i.addEventListener(`click`,this.click(t)),n.append(i)};r(`Resume`,()=>this.onResume(),`primary`),r(`Settings`,()=>this.showSettings(()=>this.showPause())),r(`Learn`,()=>this.showLearnFromPause()),r(`Leave match`,()=>this.onQuit()),t.append(n),e.append(t),this.set(e)}showLearnFromPause(){this.showLearn();let e=this.root.querySelector(`.panel-wide button`);if(e){let t=e.cloneNode(!0);e.replaceWith(t),t.addEventListener(`click`,this.click(()=>this.showPause()))}}showLoading(e,t){let n=Q(`div`,`screen dim`),r=Q(`div`,`menu-card deploy`);r.style.width=`min(460px,90vw)`,r.innerHTML=`<h2>${$(e)}</h2><div class="loading-bar"><i style="width:${Math.round(t*100)}%"></i></div>`,n.append(r),this.set(n)}showDeploy(e,t){let n=Q(`div`,`screen dim`);n.style.cursor=`pointer`;let r=Q(`div`,`menu-card deploy`);r.innerHTML=`<h2>Click to deploy</h2><div style="color:var(--dim);margin-top:6px">${$(t)}</div><div style="margin-top:16px;color:var(--dim);font-size:13px">Mouse is captured while playing · <kbd>Esc</kbd> releases it and pauses</div>`,n.append(r),n.addEventListener(`click`,()=>e()),this.set(n)}showError(e,t,n=``){let r=Q(`div`,`screen dim`),i=Q(`div`,`menu-card error-card`);i.innerHTML=`<h2>${$(e)}</h2><div style="color:#cdd6df;line-height:1.6">${$(t)}</div>${n}`,r.append(i),this.set(r)}},rp=e=>e===`cus`?`Custodian`:`Intrusion`;function ip(e){let t=[e.primary?I[e.primary].name:e.secondary?I[e.secondary].name:`Pistol`];(e.armor??0)>0&&t.push(e.helmet?`Vest+Helm`:`Vest`),e.kit&&t.push(`Kit`);for(let n of e.util??[])t.push(fe[n].name.split(` `)[0]);return t.join(` · `)}var ap=class{root;box;shown=!1;constructor(e){this.root=Q(`div`,`overlay pass hidden`),this.box=Q(`div`,`sb`),this.root.append(this.box),e.append(this.root)}show(e){this.shown=e,this.root.classList.toggle(`hidden`,!e)}update(e){if(!this.shown)return;let t=e.roster??[],n=e.self.id,r=n<5?0:1,i=e.squadSide[r];e.phase;let a=i=>{let a=e.squadSide[i],o=i===r,s=t.filter(e=>e.squad===i).sort((e,t)=>t.score-e.score||t.kills-e.kills);return`<h3 class="${a}-h">${rp(a)}${o?` (your team)`:``} — ${e.score[i]}</h3>
      <table><thead><tr><th>Player</th>${o?`<th style="text-align:left">Equipment</th><th>$</th>`:``}<th>K</th><th>D</th><th>A</th><th>DMG</th><th>HS%</th><th>Plant/Def</th><th>Ping</th></tr></thead><tbody>
      ${s.map(e=>`<tr class="${e.id===n?`me`:``}${e.alive?``:` dead`}"><td>${$(e.name)}${e.controller===`bot`?` <small style="color:var(--dim)">BOT</small>`:``}</td>${o?`<td class="eqcell">${$(ip(e))}</td><td style="color:#9dff9a">${e.money===void 0?``:`$`+e.money.toLocaleString()}</td>`:``}<td>${e.kills}</td><td>${e.deaths}</td><td>${e.assists}</td><td>${e.damage}</td><td>${e.kills?Math.round(e.headshots/e.kills*100):0}</td><td>${e.plants}/${e.defuses}</td><td>${e.controller===`bot`?`—`:e.ping}</td></tr>`).join(``)}
      </tbody></table>`},o=`<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="letter-spacing:.2em;text-transform:uppercase">Aperture Annex · Cipher Breach</b><span style="color:var(--dim);font-size:13px;letter-spacing:.1em">Round ${e.round} · ${rp(i)} side</span></div>`;this.box.innerHTML=o+a(r)+a(1-r)}},op=class{root;canvas;ctx;open=!1;constructor(e){this.root=Q(`div`,`overlay pass hidden`);let t=Q(`div`,`tacmap`);this.canvas=Q(`canvas`),this.canvas.width=1152,this.canvas.height=864,this.ctx=this.canvas.getContext(`2d`);let n=Q(`div`,`cap`,`Tactical map · teammates, the Spike when known, smoke, and only what your team can legally see · <kbd>M</kbd> close`);t.append(this.canvas,n),this.root.append(t),e.append(this.root)}show(e){this.open=e,this.root.classList.toggle(`hidden`,!e)}update(e){this.open&&Hf(this.ctx,this.canvas.width,this.canvas.height,e,!0)}},sp=class{root;onRematch=()=>void 0;onMenu=()=>void 0;constructor(e){this.root=Q(`div`,`overlay hidden`),e.append(this.root)}hide(){this.root.classList.add(`hidden`),this.root.innerHTML=``}show(e){let t=e.snap,n=t.self.id<5?0:1,r=e.winnerSquad===n,i=e.winnerSquad===-1,a=t.rounds??[],o=t.roster??[],s=Q(`div`,`end`),c=`<div class="headline"><span class="res ${i?``:r?`win`:`lose`}">${i?`Draw`:r?`Victory`:`Defeat`}</span><span class="sc">${t.score[n]} : ${t.score[1-n]}</span><span style="color:var(--dim);letter-spacing:.12em;text-transform:uppercase;font-size:13px">Cipher Breach · Aperture Annex · ${a.length} rounds · unranked (rating hidden)</span></div>`,l=`<h3 style="letter-spacing:.18em;text-transform:uppercase;font-size:13px;color:var(--dim);margin:14px 0 4px">Round timeline</h3><div class="timeline">${a.map(t=>{let r=t.winnerSquad===n,i=t.reason===`detonated`?`✹`:t.reason===`disarmed`?`✔`:t.reason===`timeExpired`?`⏱`:`✖`;return`<div class="tl ${r?`w`:`l`}" title="${$(t.reason)}${t.planted?` · Cipher armed`:``}"><span class="rn">R${t.round}</span><span class="ic" style="color:${t.winnerSide===`cus`?e.colors.cus:e.colors.int}">${i}</span>${t.planted?`<span style="color:var(--accent)">armed</span>`:`&nbsp;`}</div>`}).join(``)}</div>`,u=e=>o.filter(t=>t.squad===e).sort((e,t)=>t.score-e.score).map(e=>{let n=e.shots?Math.round(e.hits/e.shots*100):0;return`<tr class="${e.id===t.self.id?`me`:``}"><td>${$(e.name)}</td><td>${e.kills}</td><td>${e.deaths}</td><td>${e.assists}</td><td>${e.damage}</td><td>${e.kills?Math.round(e.headshots/e.kills*100):0}%</td><td>${n}%</td><td>${e.plants}/${e.defuses}</td><td>${e.utilDamage}</td><td>${e.flashed}</td></tr>`}).join(``)+``,d=(e,t)=>`<h3 style="letter-spacing:.18em;text-transform:uppercase;font-size:13px;margin:12px 0 4px">${t}</h3><table><thead><tr><th>Player</th><th>K</th><th>D</th><th>A</th><th>DMG</th><th>HS</th><th>ACC</th><th>Plant/Def</th><th>Util DMG</th><th>Flashed</th></tr></thead><tbody>${u(e)}</tbody></table>`;s.innerHTML=c+l+`<div class="charts"><div><canvas id="econ-chart" width="720" height="300"></canvas><div style="color:var(--dim);font-size:12px;letter-spacing:.08em;margin-top:4px">Team equipment value at round start (solid) and bank before buying (dashed). Your team is bright; the opponent is dim.</div></div><div>${d(n,`Your team`)}${d(1-n,`Opponents`)}</div></div>
      <div class="row" style="margin-top:18px"><button class="btn primary" id="end-rematch">Play again</button><button class="btn" id="end-menu">Main menu</button></div>`,this.root.innerHTML=``,this.root.append(s),this.root.classList.remove(`hidden`),s.querySelector(`#end-rematch`).addEventListener(`click`,()=>this.onRematch()),s.querySelector(`#end-menu`).addEventListener(`click`,()=>this.onMenu()),this.drawChart(s.querySelector(`#econ-chart`),t,n,e.colors)}drawChart(e,t,n,r){let i=e.getContext(`2d`),a=t.rounds??[],o=e.width,s=e.height;if(i.clearRect(0,0,o,s),i.font=`12px "Segoe UI", sans-serif`,!a.length)return;let c=Math.max(5e3,...a.flatMap(e=>[e.equipValue[0],e.equipValue[1],e.moneyBefore[0],e.moneyBefore[1]]))*1.1,l=e=>38+e/Math.max(1,a.length-1)*(o-76),u=e=>s-38-e/c*(s-76);i.strokeStyle=`rgba(255,255,255,0.1)`,i.fillStyle=`rgba(255,255,255,0.5)`;for(let e=0;e<=4;e++){let t=c/4*e;i.beginPath(),i.moveTo(38,u(t)),i.lineTo(o-38,u(t)),i.stroke(),i.fillText(`$`+Math.round(t/1e3)+`k`,4,u(t)+4)}a.forEach((e,t)=>{i.fillText(`R`+e.round,l(t)-8,s-12)});let d=(e,t,n,r)=>{i.strokeStyle=t,i.lineWidth=r,i.setLineDash(n?[5,4]:[]),i.beginPath(),a.forEach((t,n)=>{let r=l(n),a=u(e(t));n?i.lineTo(r,a):i.moveTo(r,a)}),i.stroke(),i.setLineDash([])},f=(e,t)=>{let r=a[0];return r.winnerSquad,r.winnerSide,e===n?t?`#ffffff`:`#c8d2dc`:t?`#ff7a90`:`#a05a68`};d(e=>e.equipValue[1-n],f(1-n,!0),!1,2),d(e=>e.moneyBefore[1-n],f(1-n,!1),!0,1.4),d(e=>e.equipValue[n],f(n,!0),!1,2.6),d(e=>e.moneyBefore[n],f(n,!1),!0,1.6),a.forEach((e,t)=>{i.fillStyle=e.winnerSquad===n?`#6dffd9`:`#ff5d73`,i.fillRect(l(t)-3,20,6,6)})}},cp=1/64,lp=128,up=class{end;playerId=-1;welcomed=!1;rejected=null;side=`int`;latest=null;snaps=[];lastTick=-1;seq=0;pending=[];body={pos:{x:0,y:0,z:0},vel:{x:0,y:0,z:0},crouch:0,onGround:!0,landPenalty:0,stepAcc:0};errX=0;errY=0;errZ=0;corrections=0;maxCorrection=0;newEvents=[];rttMs=0;pingSentAt=0;pingSeq=0;fake;clockOffsetTicks=0;haveClock=!1;duplicateSnapshots=0;constructor(e){this.end=e,this.fake={id:0,name:``,squad:0,side:`int`,controller:`human`,pos:this.body.pos,vel:this.body.vel,yaw:0,pitch:0,crouch:0,onGround:!0,alive:!0,hp:100,armor:0,helmet:!1,armorFresh:!1,kit:!1,spike:!1,money:0,slots:{primary:null,secondary:null,tool:null},cur:`secondary`,prev:`tool`,util:[],utilBought:{},throwHeld:0,interact:{kind:null,progress:0},landPenalty:0,stepAcc:0}}hello(e){this.end.send({t:`hello`,v:1,ruleset:de,mapHash:ee,name:e})}sendPing(e){this.pingSentAt=e,this.pingSeq++,this.end.send({t:`ping`,ct:e})}serverTickAt(e){let t=this.snaps[this.snaps.length-1];if(!t)return 0;let n=Math.min(8,Math.max(0,(e-t.at)/(1e3/64)));return t.snap.tick+n}renderTick(e){return this.serverTickAt(e)-6}buyReq=1;openRequests=[];requestBuy(e){let t=this.buyReq++;return this.openRequests.push({kind:`buy`,req:t,item:e}),t}requestRefund(e){let t=this.buyReq++;return this.openRequests.push({kind:`refund`,req:t,item:e}),t}get openRequestCount(){return this.openRequests.length}sendInput(e,t){let n={...e,seq:this.seq++,viewTick:this.renderTick(t)},r=this.openRequests[0];return r&&(n[r.kind]={req:r.req,item:r.item}),this.predict(n),this.pending.push(n),this.pending.length>lp&&this.pending.shift(),this.end.send({t:`input`,cmd:n}),n}canMoveLocked(){let e=this.latest;return!e||e.self.interact.kind!==null||e.phase===`halftime`||e.phase===`matchEnd`||!e.self.alive}predict(e){let t=this.latest;if(!t||!t.self.alive)return;let n=this.fake;n.pos=this.body.pos,n.vel=this.body.vel,n.crouch=this.body.crouch,n.onGround=this.body.onGround,n.landPenalty=this.body.landPenalty,n.stepAcc=this.body.stepAcc,n.yaw=e.yaw,n.pitch=e.pitch,n.side=this.side,n.cur=t.self.cur,n.slots={primary:t.self.weapons.primary?{id:t.self.weapons.primary.id}:null,secondary:t.self.weapons.secondary?{id:t.self.weapons.secondary.id}:null,tool:{id:`tool`}};let r=this.canMoveLocked();Ku(n,{moveX:e.moveX,moveZ:e.moveZ,jump:e.jump,crouch:e.crouch,walk:e.walk},{dt:cp,time:0,locked:r,confine:t.phase===`buy`&&!this.practice?S[this.side]:null,emit:()=>void 0}),this.body.crouch=n.crouch,this.body.onGround=n.onGround,this.body.landPenalty=n.landPenalty,this.body.stepAcc=n.stepAcc}practice=!1;poll(e){let t=0;for(let n of this.end.recv()){let r=n;switch(r.t){case`welcome`:this.welcomed=!0,this.playerId=r.playerId,this.side=r.side;break;case`reject`:this.rejected=r.reason;break;case`pong`:this.rttMs=e-r.ct;break;case`snap`:this.onSnapshot(yd(r.snap),e)&&t++}}return t}onSnapshot(e,t){if(e.tick<=this.lastTick)return this.duplicateSnapshots++,!1;this.lastTick=e.tick,e.roster?this.lastRoster=e.roster:e.roster=this.lastRoster,this.latest=e,this.side=e.squadSide[e.self.id<5?0:1],this.snaps.push({snap:e,at:t}),this.snaps.length>24&&this.snaps.shift();for(let t of e.events)this.newEvents.push(t),t.t===`buy`&&(this.openRequests=this.openRequests.filter(e=>e.req!==t.req));let n=e.self;if(n.doneReqs.length){let e=new Set(n.doneReqs);this.openRequests=this.openRequests.filter(t=>!e.has(t.req))}this.pending=this.pending.filter(e=>e.seq>n.ack);let r={x:this.body.pos.x,y:this.body.pos.y,z:this.body.pos.z};if(this.body.pos={x:n.pos.x,y:n.pos.y,z:n.pos.z},this.body.vel={x:n.vel.x,y:n.vel.y,z:n.vel.z},this.body.crouch=n.crouch,this.body.onGround=n.onGround,this.body.landPenalty=n.landPenalty,this.body.stepAcc=n.stepAcc,n.alive)for(let e of this.pending)this.predict(e);let i=r.x-this.body.pos.x,a=r.y-this.body.pos.y,o=r.z-this.body.pos.z,s=Math.hypot(i,a,o);return s>.003&&this.hasPredicted&&(this.corrections++,this.maxCorrection=Math.max(this.maxCorrection,s),s<1.5&&(this.errX+=i,this.errY+=a,this.errZ+=o)),this.hasPredicted=!0,!0}hasPredicted=!1;lastRoster=[];smooth(e){let t=Math.exp(-e*14);this.errX*=t,this.errY*=t,this.errZ*=t}interpolated(e){let n=this.renderTick(e),r=[];if(!this.snaps.length)return r;let a=this.snaps[0],o=this.snaps[this.snaps.length-1];for(let e=this.snaps.length-1;e>=0;e--)if(this.snaps[e].snap.tick<=n){a=this.snaps[e],o=this.snaps[Math.min(e+1,this.snaps.length-1)];break}let s=o.snap.tick-a.snap.tick,c=s>0?Math.min(1,Math.max(0,(n-a.snap.tick)/s)):1,l=new Map(a.snap.players.map(e=>[e.id,e]));for(let e of o.snap.players){let n=l.get(e.id);if(e.id===this.playerId)continue;if(!n){r.push({...e,yawOut:e.yaw});continue}let a=Math.hypot(e.pos.x-n.pos.x,e.pos.z-n.pos.z)>3?1:c;r.push({...e,pos:{x:t(n.pos.x,e.pos.x,a),y:t(n.pos.y,e.pos.y,a),z:t(n.pos.z,e.pos.z,a)},yaw:n.yaw+i(e.yaw-n.yaw)*a,pitch:t(n.pitch,e.pitch,a),crouch:t(n.crouch,e.crouch,a),yawOut:n.yaw+i(e.yaw-n.yaw)*a})}return r}drainEvents(){let e=this.newEvents;return this.newEvents=[],e}weaponDef(e){return I[e]}},dp=class{canvas;settings;yaw=0;pitch=0;keys=new Set;buttons=new Set;locked=!1;edges={};wheel=0;crouchToggle=!1;walkToggle=!1;onPointerLockChange;onKeyAction;onWheelSpectate;swayX=0;swayY=0;scopeSens=1;enabled=!0;captureDigits=!1;captureWithoutLock=!1;pendingDX=0;pendingDY=0;constructor(e,t){this.canvas=e,this.settings=t,document.addEventListener(`pointerlockchange`,()=>{this.locked=document.pointerLockElement===this.canvas,this.locked||this.buttons.clear(),this.onPointerLockChange?.(this.locked)}),document.addEventListener(`mousemove`,e=>{this.locked&&this.enabled&&(this.pendingDX+=e.movementX,this.pendingDY+=e.movementY)}),document.addEventListener(`mousedown`,e=>{this.locked&&(this.buttons.add(e.button),e.preventDefault())}),document.addEventListener(`mouseup`,e=>{this.buttons.delete(e.button)}),document.addEventListener(`contextmenu`,e=>{this.locked&&e.preventDefault()}),document.addEventListener(`wheel`,e=>{this.locked&&(this.wheel+=Math.sign(e.deltaY),e.preventDefault())},{passive:!1}),window.addEventListener(`keydown`,e=>this.keyDown(e)),window.addEventListener(`keyup`,e=>this.keyUp(e)),window.addEventListener(`blur`,()=>{this.keys.clear(),this.buttons.clear()})}lock(){try{let e=this.canvas.requestPointerLock({unadjustedMovement:!0});e&&typeof e.catch==`function`&&e.catch(()=>{try{this.canvas.requestPointerLock()}catch{}})}catch{try{this.canvas.requestPointerLock()}catch{}}}unlock(){document.pointerLockElement&&document.exitPointerLock()}keyDown(e){if(!this.locked&&!this.captureWithoutLock){this.onKeyAction?.(e.code,!0);return}if(e.repeat){e.code===`Tab`&&e.preventDefault();return}([`Tab`,`Space`,`ControlLeft`,`AltLeft`,`F5`,`F1`].includes(e.code)||e.code.startsWith(`Digit`))&&e.preventDefault(),this.keys.add(e.code);let t=this.settings();switch(e.code){case`KeyR`:this.edges.reload=!0;break;case`KeyG`:this.edges.drop=!0;break;case`KeyQ`:this.edges.quick=!0;break;case`KeyF`:this.edges.inspect=!0;break;case`Digit1`:this.captureDigits||(this.edges.select=`primary`);break;case`Digit2`:this.captureDigits||(this.edges.select=`secondary`);break;case`Digit3`:this.captureDigits||(this.edges.select=`tool`);break;case`Digit4`:this.captureDigits||(this.edges.select=`util0`);break;case`Digit5`:this.captureDigits||(this.edges.select=`util1`);break;case`Digit6`:this.captureDigits||(this.edges.select=`util2`);break;case`Digit7`:this.captureDigits||(this.edges.select=`util3`);break;case`ControlLeft`:case`KeyC`:t.holdCrouch||(this.crouchToggle=!this.crouchToggle);break;case`ShiftLeft`:t.holdWalk||(this.walkToggle=!this.walkToggle)}this.onKeyAction?.(e.code,!0)}keyUp(e){this.keys.delete(e.code),this.onKeyAction?.(e.code,!1)}applyLook(e=1){let t=this.settings().sensitivity*.022*n*e;this.yaw-=this.pendingDX*t,this.pitch-=this.pendingDY*t,this.pitch=Math.max(-1.5,Math.min(1.5,this.pitch)),this.swayX=this.pendingDX,this.swayY=this.pendingDY,this.pendingDX=0,this.pendingDY=0,this.yaw>Math.PI&&(this.yaw-=Math.PI*2),this.yaw<-Math.PI&&(this.yaw+=Math.PI*2)}sample(e){let t=this.settings(),n=this.keys,r=n.has(`ControlLeft`)||n.has(`KeyC`),i=t.holdCrouch?r:this.crouchToggle,a=t.holdWalk?n.has(`ShiftLeft`):this.walkToggle,o=+!!n.has(`KeyD`)-!!n.has(`KeyA`),s=+!!n.has(`KeyW`)-!!n.has(`KeyS`);e&&(o=0,s=0);let c={moveX:o,moveZ:s,yaw:this.yaw,pitch:this.pitch,fire:!e&&this.buttons.has(0),alt:!e&&this.buttons.has(2),jump:!e&&n.has(`Space`),crouch:i,walk:a,use:n.has(`KeyE`)};return this.edges.reload&&(c.reload=!0),this.edges.drop&&(c.drop=!0),this.edges.quick&&(c.quick=!0),this.edges.inspect&&(c.inspect=!0),this.edges.select&&(c.select=this.edges.select),this.wheel!==0&&(c.select=this.wheel>0?`next`:`prev`,this.wheel=0,this.onWheelSpectate?.()),this.edges={},c}held(e){return this.keys.has(e)}},fp=1/64,pp=1e3/64,mp=class{canvas;settings=$f();audio=new ue;renderer;input;hud;buy;scoreboard;tacmap;endScreen;menus;match=null;room=null;link=null;net=null;autoplayBrain=null;startOpts=null;practice=!1;lastFrame=performance.now();acc=0;clockMs=0;running=!1;paused=!1;ended=!1;endShownAt=0;fps=60;frames=0;fpsT=0;bodyPrev={x:0,y:0,z:0};bodyCur={x:0,y:0,z:0};eyeY=0;haveEye=!1;shownKick={pitch:0,yaw:0};pulses=[];roundKills=new Map;lastFlashUntil=0;spectateId=-1;names=[];lastPhase=``;lastRound=0;firstBuyOpened=!1;autoBuyPending=!1;lastStepAudioT=0;lastScoped=0;flashFx={duration:0};statsAcc={ticks:0,tickMs:0,maxTickMs:0};dev;shotAt=new Map;prevSnapTick=-1;backdropT=0;lastAmmoWarn=0;constructor(e,t,n){this.canvas=e,this.dev=n,this.renderer=new fd(e,this.settings),this.input=new dp(e,()=>this.settings);let r=document.getElementById(`hud`);this.hud=new Wf(r);let i=document.getElementById(`screens`);this.buy=new Xf(i),this.scoreboard=new ap(i),this.tacmap=new op(i),this.endScreen=new sp(i),this.menus=new np(i,()=>this.settings),this.menus.onStart=e=>this.startMatch(e),this.menus.onResume=()=>this.resume(),this.menus.onQuit=()=>this.quitToMenu(),this.menus.onUiClick=()=>{this.audio.resume(),this.audio.uiClick()},this.menus.onSettingsChanged=()=>this.applySettings(),this.endScreen.onRematch=()=>{this.startOpts&&this.startMatch(this.startOpts)},this.endScreen.onMenu=()=>this.quitToMenu(),this.buy.onBuy=e=>this.net?.requestBuy(e),this.buy.onRefund=e=>this.net?.requestRefund(e),this.buy.onClose=()=>this.closeBuy(),this.input.onPointerLockChange=e=>this.onLockChange(e),this.input.onKeyAction=(e,t)=>this.onKey(e,t),this.input.onWheelSpectate=()=>void 0,document.addEventListener(`mousedown`,e=>{this.running&&this.input.locked&&this.isDead()&&e.button===0&&this.cycleSpectate(1)}),window.addEventListener(`resize`,()=>this.renderer.resize()),this.applySettings(),requestAnimationFrame(e=>this.frame(e))}applySettings(){this.renderer.setSettings(this.settings),this.audio.volume=this.settings.volume,this.audio.sfxVolume=this.settings.sfxVolume,this.audio.musicVolume=this.settings.musicVolume,this.audio.applyVolumes();let e=Fu[this.settings.colorblind];document.documentElement.style.setProperty(`--cus`,`#`+e.cus.toString(16).padStart(6,`0`)),document.documentElement.style.setProperty(`--int`,`#`+e.int.toString(16).padStart(6,`0`)),ep(this.settings)}startMatch(e){this.audio.resume(),this.audio.stopMusic(),this.startOpts=e,this.practice=e.mode===`practice`;let t=e.side===`random`?Math.random()<.5?`int`:`cus`:e.side,n=this.dev.seed??(Date.now()^Math.random()*4294967295)>>>0,r=this.practice?_e.practice:_e[e.rules],i=[0],a=[`You`,`Vesper`,`Halcyon`,`Quill`,`Ember`,`Tarn`,`Juno`,`Cobalt`,`Sable`,`Pike`];if(this.match=Df({seed:n,rules:r,squad0Side:t,humanIds:i,practice:this.practice,names:a}),Rf(this.match,e.difficulty),this.names=a,this.room=new kf(this.match),this.link=new gd(md),this.room.addClient(0,this.link.server),this.net=new up(this.link.client),this.net.practice=this.practice,this.net.hello(`You`),this.dev.autoplay){let e={cus:new Ff(`cus`),int:new Ff(`int`)};Array.from(this.match.brains.values()),this.autoplayBrain=new Lf(Pf.hard,e);let t=this.match.brains.get(1);t&&(this.autoplayBrain.ai=t.ai)}else this.autoplayBrain=null;this.clockMs=performance.now(),this.acc=0,this.ended=!1,this.endShownAt=0,this.input.yaw=0,this.input.pitch=0,this.haveEye=!1,this.pulses=[],this.roundKills.clear(),this.lastPhase=``,this.lastRound=0,this.firstBuyOpened=!1,this.prevSnapTick=-1,this.spectateId=-1,this.shownKick={pitch:0,yaw:0},this.hud.clearTransient(),this.endScreen.hide(),this.menus.showLoading(`Loading Aperture Annex`,.3);for(let e=0;e<8;e++)this.tick(!1);this.running=!0,this.paused=!0,this.hud.setVisible(!0),this.renderer.clearRound(),this.dev.dev?this.deploy():this.menus.showDeploy(()=>this.deploy(),`${this.practice?`Practice`:_e[e.rules].name} · you play ${t===`int`?`Intrusion (attack)`:`Custodian (defend)`} first`)}deploy(){this.audio.resume(),this.menus.clear(),this.paused=!1,this.lastFrame=performance.now(),this.clockMs=performance.now(),this.acc=0,this.dev.autoplay||this.input.lock(),this.autoBuyPending&&!this.firstBuyOpened&&(this.firstBuyOpened=!0,this.autoBuyPending=!1,setTimeout(()=>{this.running&&!this.paused&&this.net?.latest?.phase===`buy`&&this.openBuy()},900)),document.getElementById(`hud`).classList.remove(`hidden`)}resume(){this.menus.clear(),this.paused=!1,this.lastFrame=performance.now(),this.input.lock()}pause(){!this.running||this.paused||this.ended||(this.paused=!0,this.menus.showPause())}quitToMenu(){this.running=!1,this.paused=!1,this.match=null,this.room=null,this.net=null,this.link=null,this.input.unlock(),this.hud.setVisible(!1),this.buy.show(!1),this.tacmap.show(!1),this.scoreboard.show(!1),this.endScreen.hide(),this.renderer.clearRound(),this.menus.showTitle(),this.audio.startMusic()}onLockChange(e){!this.running||this.ended||this.dev.autoplay||(e?this.paused&&this.menus.visible&&(this.menus.clear(),this.paused=!1,this.lastFrame=performance.now()):!this.buy.open&&this.endScreen.root.classList.contains(`hidden`)&&this.pause())}onKey(e,t){if(this.running&&!(t&&this.buy.open&&this.buy.handleKey(e))){if(e===`Tab`)this.scoreboard.show(t&&!this.paused);else if(t&&!(this.paused||this.ended))switch(e){case`KeyB`:{let e=this.net?.latest;e&&e.self.alive&&(e.self.canBuy||this.practice)&&this.openBuy();break}case`KeyM`:this.tacmap.show(!this.tacmap.open);break;case`ArrowRight`:this.isDead()&&this.cycleSpectate(1);break;case`ArrowLeft`:this.isDead()&&this.cycleSpectate(-1);break;case`Escape`:!this.input.locked&&!this.buy.open&&this.pause()}}}openBuy(){this.buy.show(!0),this.input.captureDigits=!0,this.input.captureWithoutLock=!0,this.input.unlock(),this.audio.uiClick()}closeBuy(){this.buy.show(!1),this.input.captureDigits=!1,this.input.captureWithoutLock=!1,this.running&&!this.paused&&!this.ended&&!this.dev.autoplay&&this.input.lock()}isDead(){return!!this.net?.latest&&!this.net.latest.self.alive}cycleSpectate(e){let t=this.net?.latest;if(!t)return;let n=t.players.filter(e=>!e.spotted&&e.alive&&e.id!==t.self.id).map(e=>e.id);if(!n.length)return;let r=n.indexOf(this.spectateId);this.spectateId=n[(r+e+n.length*2)%n.length]}tick(e=!0){let t=this.match,n=this.room,r=this.net,i=this.link;if(!t||!n||!r||!i)return;let a=performance.now();if(this.clockMs+=pp,i.now=this.clockMs,e){let e=r.latest,n=!!e&&(e.phase===`matchEnd`||e.phase===`halftime`||!e.self.alive)&&!this.input.captureWithoutLock,i;if(this.autoplayBrain){let e=t.players[0],n=this.autoplayBrain.think(t,e);i={moveX:n.moveX,moveZ:n.moveZ,yaw:n.yaw,pitch:n.pitch,fire:n.fire,alt:n.alt,jump:n.jump,crouch:n.crouch,walk:n.walk,use:n.use,reload:n.reload,select:n.select,buy:(n.buy,void 0)},n.buy&&r.requestBuy(n.buy.item),this.input.yaw=n.yaw,this.input.pitch=n.pitch}else i=this.input.sample(n||this.paused),this.buy.open&&(i.fire=!1,i.alt=!1);this.bodyPrev={...r.body.pos},r.sendInput(i,this.clockMs),this.bodyCur={...r.body.pos}}n.step(),r.poll(this.clockMs);let o=performance.now()-a;this.statsAcc.ticks++,this.statsAcc.tickMs+=o,this.statsAcc.maxTickMs=Math.max(this.statsAcc.maxTickMs,o)}frame(n){requestAnimationFrame(e=>this.frame(e));let i=performance.now(),a=Math.min(.1,(i-this.lastFrame)/1e3);if(this.lastFrame=i,this.frames++,this.fpsT+=a,this.fpsT>=.5&&(this.fps=this.frames/this.fpsT,this.frames=0,this.fpsT=0),!this.running||!this.net||!this.net.latest||!this.match){this.renderBackdrop(a);return}let o=this.net;if(!this.paused){this.acc+=a;let e=0;for(;this.acc>=fp&&e++<8;)this.tick(),this.acc-=fp;e>=8&&(this.acc=0)}let s=o.latest,c=this.clockMs+this.acc*1e3,l=o.serverTickAt(c)/64,u=o.drainEvents();u.length&&this.handleEvents(u,s,l),this.phaseUi(s);let d=s.self,f=!d.alive,p=d.cur===`primary`?d.weapons.primary:d.cur===`secondary`?d.weapons.secondary:d.cur===`tool`?d.weapons.tool:null,m=p?I[p.id]:null,h=p?.scope??0,g=m?.scoped&&h>0?m.scoped.zoomFov[h-1]:null;if(this.input.locked&&!this.paused&&!this.buy.open&&!this.ended&&!this.dev.autoplay&&!f){let e=g?g/this.settings.fov*this.settings.adsSensitivity:1;this.input.applyLook(e)}else this.input.applyLook(0);h!==this.lastScoped&&(this.lastScoped=h),o.smooth(a);let _=o.interpolated(c),v=d.id,y=!1,b,x=this.input.yaw,S=this.input.pitch,C;if(f){let e=_.filter(e=>!e.spotted&&e.alive);e.some(e=>e.id===this.spectateId)||(this.spectateId=e.length?e[0].id:-1),C=e.find(e=>e.id===this.spectateId)}if(f&&C)y=!0,v=C.id,b={x:C.pos.x,y:C.pos.y+Hu(C.crouch),z:C.pos.z},x=C.yawOut,S=C.pitch;else{let n=this.paused?0:this.acc/fp;t(this.bodyPrev.x,o.body.pos.x,0),t(this.bodyPrev.z,o.body.pos.z,0);let r=t(this.bodyPrev.x,this.bodyCur.x,e(n,0,1)),i=t(this.bodyPrev.z,this.bodyCur.z,e(n,0,1)),s=t(this.bodyPrev.y,this.bodyCur.y,e(n,0,1)),c=f?{x:d.pos.x,y:d.pos.y,z:d.pos.z}:{x:r+o.errX,y:s+o.errY,z:i+o.errZ},l=c.y+Hu(o.body.crouch);!this.haveEye||Math.abs(l-this.eyeY)>.6?(this.eyeY=l,this.haveEye=!0):this.eyeY+=(l-this.eyeY)*(1-Math.exp(-a*26)),b={x:c.x,y:this.eyeY,z:c.z},f&&(x=this.input.yaw,S=this.input.pitch)}let w=0,T=0;if(!y&&p&&m&&m.mode!==`melee`&&d.alive){let e=Xu(p,m,l);this.shownKick.pitch+=(e.pitch-this.shownKick.pitch)*Math.min(1,a*60),this.shownKick.yaw+=(e.yaw-this.shownKick.yaw)*Math.min(1,a*60),w=this.shownKick.pitch,T=this.shownKick.yaw}else this.shownKick.pitch*=.8,this.shownKick.yaw*=.8;let E={pos:b,yaw:x,pitch:S,kickPitch:w,kickYaw:T,zoomFov:y?null:g,roll:0},D=this.viewmodelState(s,C,l,h,a),O=null;if(this.practice&&d.alive&&d.cur.startsWith(`util`)){let e=r(this.input.yaw,this.input.pitch+.1),t=b,n={x:t.x+e.x*.45,y:t.y+e.y*.45-.1,z:t.z+e.z*.45},i=this.input.buttons.has(2)?9:20;O=uf(n,{x:e.x*i+o.body.vel.x*.5,y:e.y*i+o.body.vel.y*.3,z:e.z*i+o.body.vel.z*.5},256).path}this.audio.listener={x:b.x,y:b.y,z:b.z,yaw:x},this.renderer.render(a,s,_,E,D,l,d.id,O,y?v:null);let k=this.mapData(s,_,b,x),A=this.currentSpread(s,p,m,l),j=this.renderer.camera.fov,ee={snap:s,serverTime:l,settings:this.settings,viewId:v,spectating:y,spread:A,vfov:j,mapData:k,pos:{x:b.x,z:b.z},scopeLevel:y?0:h,fps:this.fps,names:this.names,highlight:``};this.hud.update(a,ee,0),this.scoreboard.update(s),this.tacmap.update(k),this.buy.open&&this.buy.update({snap:s,side:s.squadSide[d.id<5?0:1],practice:this.practice});for(let e of this.pulses)e.age+=a;this.pulses=this.pulses.filter(e=>e.age<3),d.alive&&d.flashUntil>l+.05&&d.flashUntil!==this.lastFlashUntil&&(this.lastFlashUntil=d.flashUntil,this.hud.flash(d.flashUntil-l,Math.max(0,d.flashFull-l),this.settings.reduceFlash),this.audio.flashPop({x:b.x,y:b.y,z:b.z})),s.phase===`matchEnd`&&!this.ended&&(this.endShownAt=performance.now(),this.ended=!0,this.audio.stinger(s.winnerSquad===(d.id<5?0:1)?`win`:`lose`),setTimeout(()=>{if(!this.running||!this.net?.latest)return;this.input.unlock(),this.scoreboard.show(!1),this.buy.show(!1),this.hud.hideBanner();let e=this.net.latest;this.endScreen.show({snap:e,winnerSquad:e.winnerSquad??-1,names:this.names,colors:{cus:`#2fe0ff`,int:`#ffa726`}}),this.audio.startMusic()},3e3))}renderBackdrop(e){this.backdropT+=e;let t=this.backdropT*.07,n=this.renderer,r=52+Math.sin(t)*12,i=48+Math.sin(t*.7)*5;n.camera.fov=66,n.camera.position.set(i,3.4,r),n.camera.rotation.order=`YXZ`,n.camera.rotation.set(-.1,Math.sin(t*.9)*.6,0),n.camera.updateProjectionMatrix(),n.renderer.clear(),n.renderer.render(n.scene,n.camera)}viewmodelState(t,n,r,i,a){let o=t.self,s=null,c=null;n?s=n.weapon===`util`?null:n.weapon:o.alive&&(c=o.cur===`primary`?o.weapons.primary:o.cur===`secondary`?o.weapons.secondary:o.cur===`tool`?o.weapons.tool:null,s=c?c.id:null);let l=s?I[s]:null,u=c?Math.max(0,r-c.lastShot):9,d=!!c?.reloading,f=c&&l&&d?1-e((c.reloadEnd-r)/Math.max(.1,l.reloadTime),0,1):0,p=c&&l?e((r-(c.readyAt-l.drawTime))/Math.max(.1,l.drawTime),0,1):1,m=n?0:Math.hypot(this.net.body.vel.x,this.net.body.vel.z);return{weapon:s,visible:s!==null&&i===0&&!(!o.alive&&!n),speed:m,onGround:this.net.body.onGround,crouch:this.net.body.crouch,sinceShot:u,reloading:d,reloadProgress:f,drawProgress:p,inspect:0,swingT:0,swayX:this.input.swayX,swayY:this.input.swayY,interacting:o.interact.kind!==null}}currentSpread(e,t,n,r){if(!t||!n||n.mode===`melee`)return 0;let i=this.net.body,a={onGround:i.onGround,landPenalty:i.landPenalty,crouch:i.crouch},o=Math.hypot(i.vel.x,i.vel.z);return Zu(a,{heat:0,lastShot:t.lastShot,scopeLevel:t.scope},n,r,o)}mapData(e,t,n,r){let i=e.self,a=i.id<5?0:1,o=e.squadSide[a],s=t.map(e=>({id:e.id,x:e.pos.x,z:e.pos.z,yaw:e.yawOut,alive:e.alive,spotted:e.spotted,side:e.spotted?o===`cus`?`int`:`cus`:o,self:!1}));s.push({id:i.id,x:n.x,z:n.z,yaw:r,alive:i.alive,spotted:!1,side:o,self:!0});let c=e.spike,l=Fu[this.settings.colorblind];return{players:s,spike:c.pos&&(c.state===`planted`||c.state===`dropped`)?{x:c.pos.x,z:c.pos.z,state:c.state}:null,smokes:e.smokes.filter(e=>e.bloomIn<=0).map(e=>({x:e.x,z:e.z,r:e.r})),fires:e.fires.flatMap(e=>{let t=[];for(let n=0;n<e.cells.length;n+=3)t.push({x:e.cells[n],z:e.cells[n+2]});return t}),pulses:this.pulses,colors:{cus:`#`+l.cus.toString(16).padStart(6,`0`),int:`#`+l.int.toString(16).padStart(6,`0`)},grenades:e.grenades.filter(e=>e.owner===i.id||!0).map(e=>({x:e.x,z:e.z,type:e.type}))}}phaseUi(e){let t=e.self.id<5?0:1,n=e.squadSide[t];if(e.phase!==this.lastPhase||e.round!==this.lastRound){let t=this.lastPhase;this.lastPhase=e.phase,this.lastRound=e.round,e.phase===`buy`?(this.roundKills.clear(),this.renderer.clearRound(),this.hud.clearTransient(),this.audio.stopMusic(),this.hud.showStatusBanner(`Round ${e.round}`,n===`int`?`Intrusion · carry the Spike to A or B`:`Custodian · hold both vaults`,3e3),e.round===1&&!this.dev.autoplay&&(this.autoBuyPending=!0)):e.phase===`live`&&t===`buy`?(this.buy.open&&this.closeBuy(),this.audio.stinger(`start`),this.hud.showStatusBanner(`Go`,`Round live`,1200)):e.phase===`halftime`&&(this.hud.showStatusBanner(`Halftime`,`Sides swap · economy resets`,5500),this.audio.stinger(`half`),this.audio.startMusic(),this.buy.open&&this.closeBuy())}e.phase===`buy`&&e.phaseRemaining<.2&&this.buy.open&&this.closeBuy()}handleEvents(e,t,n){let r=t.self.id,i=r<5?0:1,a=e=>t.squadSide[e<5?0:1],o=e=>e>=0?this.names[e]??`Player`:`World`,s=e=>({x:e.x,y:e.y,z:e.z}),c=this.settings.captions;for(let n of e)switch(this.renderer.handleEvent(n,t,r),n.t){case`shot`:{let e=I[n.weapon];this.audio.shot(e.cls,s(n.o),n.id===r),n.id===r?this.renderer.localShotFlash(n.o):c&&a(n.id)!==a(r)&&this.captionDir(`Gunfire`,n.o);break}case`step`:n.id===r?n.kind===`land`?this.audio.land(void 0,!0):n.kind===`jump`?this.audio.click(void 0,`jump`,!0):this.audio.step(void 0,n.loud,!0):(n.kind===`land`?this.audio.land(s(n.p)):this.audio.step(s(n.p),n.loud),c&&a(n.id)!==a(r)&&n.loud>.5&&performance.now()-this.lastStepAudioT>700&&(this.lastStepAudioT=performance.now(),this.captionDir(`Footsteps`,n.p)));break;case`sfx`:this.audio.click(n.id===r?void 0:s(n.p),n.kind,n.id===r);break;case`nade`:if(n.kind===`bounce`)this.audio.bounce(s(n.p),n.data?.[0]??0);else if(n.kind===`flash`)this.audio.flashPop(s(n.p));else if(n.kind===`frag`)this.audio.boom(s(n.p));else if(n.kind===`veil`)this.audio.hiss(s(n.p)),c&&this.captionDir(`Veil bloom`,n.p);else if(n.kind===`thermite`)this.audio.ignite(s(n.p));else if(n.kind===`pulsePing`){this.audio.pulsePing(s(n.p));let e=n.data??[];for(let t=0;t+1<e.length;t+=2)this.pulses.push({x:n.p.x,z:n.p.z,sector:e[t],band:e[t+1],age:0});e.length||this.pulses.push({x:n.p.x,z:n.p.z,sector:-99,band:0,age:2.9}),this.hud.popup(e.length?`Pulse: ${e.length/2} contact${e.length>2?`s`:``} (coarse)`:`Pulse: no motion`)}else n.kind===`pulseDestroyed`&&this.audio.bounce(s(n.p),2);break;case`spike`:n.kind===`beep`?(this.audio.beep(s(n.p),n.remaining??30),c&&(n.remaining??30)<10&&this.hud.caption(`Beep · `+Math.ceil(n.remaining??0)+`s`)):n.kind===`planted`?(this.audio.stinger(`plant`),this.hud.showStatusBanner(`Cipher armed`,`Site ${t.spike.site??``} · 35 seconds`,3e3)):n.kind===`armStart`?(this.audio.armLoop(n.id===r?void 0:s(n.p)),c&&n.id!==r&&this.captionDir(`Arming`,n.p)):n.kind===`defuseStart`?this.audio.armLoop(n.id===r?void 0:s(n.p)):n.kind===`defused`?this.audio.stinger(`defuse`):n.kind===`explode`?this.audio.boom(s(n.p),!0):n.kind===`pickup`&&n.id===r?this.hud.popup(`Picked up the Cipher Spike`):n.kind===`drop`&&this.audio.click(s(n.p),`drop`);break;case`kill`:{let e=n.killer>=0?a(n.killer):a(n.victim)===`cus`?`int`:`cus`,t=a(n.victim),i=n.killer===r?`killer`:n.victim===r?`victim`:null,s=n.weapon===`spike`?`Cipher blast`:n.weapon===`fire`?`Thermite`:n.weapon===`frag`?`Fragment`:n.weapon===`world`?`World`:I[n.weapon].name;this.hud.killEntry(n.killer>=0?o(n.killer):`World`,e,o(n.victim),t,s,n.head,n.wall,i),n.killer>=0&&this.roundKills.set(n.killer,(this.roundKills.get(n.killer)??0)+1);break}case`hit`:n.shooter===r&&(this.hud.hitMarker(n.head,n.killed),this.audio.hitMarker(n.head,n.killed));break;case`hurt`:if(n.victim===r){this.audio.hurt();let e=this.net.body.pos,t=Math.atan2(-(n.from.x-e.x),-(n.from.z-e.z));this.hud.damageFrom(-(t-this.input.yaw))}break;case`econ`:n.id===r&&this.hud.popup((n.delta>0?`+$`:`-$`)+Math.abs(n.delta).toLocaleString()+` · `+n.reason,n.delta>0?`pos`:`neg`);break;case`buy`:n.id===r&&(this.audio.buy(n.ok),n.ok||this.hud.popup(n.reason??`Cannot buy`,`neg`));break;case`roundEnd`:{let e=n.winnerSquad===i;this.audio.stinger(e?`win`:`lose`);let t=-1,r=0;for(let[e,n]of this.roundKills)n>r&&(r=n,t=e);let a=r>=2?`${o(t)} got ${r} eliminations`:``;this.hud.showBanner(e,n.reason,`${n.score[i]} – ${n.score[1-i]}`,a);break}case`info`:this.hud.popup(n.text)}}captionDir(e,t){let n=this.net.body.pos,r=(Math.atan2(-(t.x-n.x),-(t.z-n.z))-this.input.yaw+Math.PI*3)%(Math.PI*2)-Math.PI,i=Math.abs(r)<.5?`↑`:r>2.6||r<-2.6?`↓`:r>0?`←`:`→`;this.hud.caption(`${e} ${i}`)}devAdvance(e){for(let t=0;t<Math.round(e*64);t++)this.tick()}devFreeze(e){this.paused=e}debugState(){let e=this.match,t=this.net?.latest;return{running:this.running,paused:this.paused,fps:Math.round(this.fps),phase:t?.phase,round:t?.round,score:t?.score,drawCalls:this.renderer.stats.drawCalls,triangles:this.renderer.stats.triangles,tickMsAvg:this.statsAcc.ticks?this.statsAcc.tickMs/this.statsAcc.ticks:0,tickMsMax:this.statsAcc.maxTickMs,self:t?{alive:t.self.alive,hp:t.self.hp,money:t.self.money,pos:t.self.pos,cur:t.self.cur}:null,time:e?.time,downKBps:this.link?this.link.bytesDown/1024/Math.max(1,e?.time??1):0}}};function hp(e){let t=[],n=null;try{n=e.getContext(`webgl2`)}catch{n=null}n||t.push(`WebGL 2 is not available. Use a current desktop Chrome or Edge with hardware acceleration enabled.`),`requestPointerLock`in HTMLElement.prototype||t.push(`Pointer Lock is not supported by this browser.`),window.AudioContext===void 0&&window.webkitAudioContext===void 0&&t.push(`Web Audio is not available.`);try{localStorage.getItem(`x`)}catch{}return t}function gp(){let e=new URLSearchParams(location.search),t=e.get(`dev`)===`1`;return{dev:t,autoplay:t&&e.get(`autoplay`)===`1`,seed:e.has(`seed`)?Number(e.get(`seed`)):void 0,side:e.get(`side`)===`cus`?`cus`:e.get(`side`)===`int`?`int`:void 0,rules:e.get(`rules`)===`full`?`full`:`quick`,difficulty:[`easy`,`normal`,`hard`].find(t=>t===e.get(`difficulty`)),practice:e.get(`practice`)===`1`}}function _p(){let e=document.getElementById(`view`),t=document.getElementById(`screens`),n=hp(e);if(n.length){new np(t,()=>({})).showError(`Cannot start Last Protocol`,n.join(` `),`<p style="color:var(--dim);margin-top:14px">Required: WebGL 2, Pointer Lock, Web Audio. Target: desktop Chrome or Edge, keyboard and mouse.</p>`);return}let r;try{r=new mp(e,document.getElementById(`app`),gp())}catch(e){new np(t,()=>({})).showError(`Graphics initialisation failed`,String(e?.message??e),`<p style="color:var(--dim);margin-top:14px">Check that hardware acceleration is enabled and reload.</p>`);return}let i=r.dev;window.__lp={game:r,state:()=>r.debugState()},r.menus.showTitle(),i.dev&&new URLSearchParams(location.search).get(`start`)===`1`&&r.startMatch({mode:i.practice?`practice`:`match`,rules:i.rules??`quick`,side:i.side??`int`,difficulty:i.difficulty??`normal`}),e.addEventListener(`webglcontextlost`,e=>{e.preventDefault(),new np(t,()=>({})).showError(`Graphics context lost`,`The GPU reset the WebGL context. Reload the page to continue.`)})}_p();