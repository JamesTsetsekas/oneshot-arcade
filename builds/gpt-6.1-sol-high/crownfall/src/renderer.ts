import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Game,type Entity,type Point,segmentDistance,distance} from './simulation';
import {lanes,HEROES} from './content';
const TEAM=[0x66e4dc,0xff817b,0xd79cff];
export class World {
 scene=new T.Scene();camera:T.OrthographicCamera;renderer:T.WebGLRenderer;canvas:HTMLCanvasElement;overlay:HTMLCanvasElement;ctx:CanvasRenderingContext2D;actors=new Map<number,T.Group>();fx=new T.Group();ray=new T.Raycaster();mouse=new T.Vector2();zoom=1;pan={x:0,z:0};selected=0;aim:Point={x:0,z:0};private batches=new Map<string,{geo:T.BufferGeometry[],mat:T.MeshStandardMaterial}>();
 constructor(public host:HTMLElement,public game:Game){
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setClearColor(0x0c1929);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;this.canvas=this.renderer.domElement;host.appendChild(this.canvas);this.overlay=document.createElement('canvas');this.overlay.className='world-labels';host.appendChild(this.overlay);this.ctx=this.overlay.getContext('2d')!;
  this.camera=new T.OrthographicCamera(-75,75,43,-43,.1,350);this.camera.position.set(48,88,70);this.camera.lookAt(0,0,0);this.scene.add(new T.HemisphereLight(0xc0e7f7,0x283b3a,2.5));const sun=new T.DirectionalLight(0xffe4b6,3.2);sun.position.set(-30,65,20);this.scene.add(sun);this.scene.fog=new T.FogExp2(0x0c1929,.0028);
  this.buildMap();this.scene.add(this.fx);this.resize();window.addEventListener('resize',this.resize);this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();document.body.insertAdjacentHTML('beforeend','<div class="fatal">Graphics context lost. Reload to return to the draft.</div>');});
 }
 resize=()=>{const w=this.host.clientWidth,h=this.host.clientHeight;this.renderer.setSize(w,h);this.overlay.width=w*devicePixelRatio;this.overlay.height=h*devicePixelRatio;this.overlay.style.width=w+'px';this.overlay.style.height=h+'px';this.ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);this.camera.left=-43*w/h;this.camera.right=43*w/h;this.camera.top=43;this.camera.bottom=-43;this.camera.updateProjectionMatrix();};
 material(color:T.ColorRepresentation,metalness=.15){return new T.MeshStandardMaterial({color,roughness:.85,metalness});}
 staticMesh(geo:T.BufferGeometry,color:T.ColorRepresentation,x:number,y:number,z:number,sx=1,sy=1,sz=1,ry=0){const key=String(color);const mat=this.material(color);const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.y=ry;m.updateMatrix();let b=this.batches.get(key);if(!b){b={geo:[],mat};this.batches.set(key,b);}b.geo.push(geo.clone().applyMatrix4(m.matrix));geo.dispose();}
 box(color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,ry=0){this.staticMesh(new T.BoxGeometry(1,1,1),color,x,y,z,sx,sy,sz,ry);}
 cylinder(color:number,x:number,y:number,z:number,r:number,h:number,n=8,r2=r){this.staticMesh(new T.CylinderGeometry(r2,r,h,n),color,x,y,z);}
 buildMap(){
  const outline=[[-48,-6],[-44,-19],[-32,-29],[-14,-32],[6,-31],[22,-29],[39,-25],[48,-14],[50,4],[43,22],[27,29],[7,32],[-15,31],[-36,25],[-47,13]];
  const shape=new T.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const cliff=new T.ExtrudeGeometry(shape,{depth:5,bevelEnabled:true,bevelThickness:1,bevelSize:1.5,bevelSegments:1,steps:1});cliff.rotateX(-Math.PI/2);cliff.translate(0,-6,0);this.staticMesh(cliff,0x354b50,0,0,0);const grass=new T.ShapeGeometry(shape);grass.rotateX(-Math.PI/2);this.staticMesh(grass,0x45665b,0,.06,0);
  // Brass-bound, individually jointed ivory causeways.
  for(const lane of lanes)for(let i=0;i<lane.length-1;i++){const a=lane[i],b=lane[i+1],len=distance(a,b),angle=-Math.atan2(b.z-a.z,b.x-a.x);this.box(0x93866c,(a.x+b.x)/2,.12,(a.z+b.z)/2,len+1,.28,7.2,angle);this.box(0xb9b7a0,(a.x+b.x)/2,.3,(a.z+b.z)/2,len+1,.3,6.2,angle);
   const n=Math.ceil(len/2.6);for(let j=0;j<n;j++){const t=(j+.5)/n;this.box(j%3===0?0xd0ccaf:0xbfc4ad,a.x+(b.x-a.x)*t,.49,a.z+(b.z-a.z)*t,len/n-.15,.12,5.85,angle);}
   for(const side of [-1,1]){const nx=-(b.z-a.z)/len*3.25*side,nz=(b.x-a.x)/len*3.25*side;this.box(0xd2ae63,(a.x+b.x)/2+nx,.54,(a.z+b.z)/2+nz,len,.18,.16,angle);}
  }
  this.box(0x294d59,0,.16,0,7,.2,59,.12);for(let z=-25;z<28;z+=5)this.box(0x5e8a88,0,.3,z,5.6,.2,3.8,.12);
  this.cylinder(0x77766d,0,.4,0,9,.6,12);this.cylinder(0x393e50,0,.75,0,7.7,.3,12);this.cylinder(0x9c799e,0,.93,0,6.6,.12,12);this.cylinder(0x353b4b,0,1.02,0,6,.12,12);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;this.box(0xd2bc8b,Math.cos(a)*7.9,1.1,Math.sin(a)*7.9,.6,.35,1.5,-a);}
  for(const x of [-42,42]){this.cylinder(0x717d77,x,.45,0,8.5,.7,12);this.cylinder(0xd0cbb1,x,.87,0,7.5,.2,12);this.cylinder(x<0?0x447c7c:0x955d63,x,1,0,6.2,.12,12);for(let i=0;i<8;i++){const a=i*Math.PI/4;this.cylinder(0xceb987,x+Math.cos(a)*7,1.3,Math.sin(a)*7,.38,.8,6);}}
  let seed=817;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<220;i++){const x=(random()-.5)*84,z=(random()-.5)*51;if(Math.abs(x)<7||Math.abs(x)>34&&Math.abs(z)<13||Math.hypot(x,z)<12||lanes.some(l=>l.slice(1).some((b,j)=>segmentDistance({x,z},l[j],b)<5)))continue;const r=.8+random()*1.3,h=3+random()*4;this.cylinder(0x555445,x,h/3,z,.3,h*.65,5);this.staticMesh(new T.ConeGeometry(r*1.6,h*.7,6),i%4===0?0x587d68:0x28574e,x,h*.62,z);this.staticMesh(new T.ConeGeometry(r*1.2,h*.65,6),i%4===0?0x719779:0x326c5c,x,h*.95,z);
   if(i%3===0)this.staticMesh(new T.DodecahedronGeometry(1),0x70827a,x+2,.7,z+1,1.3,.9,1.1);
  }
  for(let i=0;i<36;i++){const a=i/36*Math.PI*2,x=Math.cos(a)*48,z=Math.sin(a)*30;this.box(0x607575,x,-1.9,z,2+random()*3,4+random()*3,2+random()*3,random());if(i%3===0){this.staticMesh(new T.OctahedronGeometry(1),0xe7a39d,x,1.1,z,.8,2,.8);this.cylinder(0x9b8180,x,.5,z,.2,2,5);}}
  for(const [x,z] of [[-53,19],[42,-34],[-29,-37],[52,9]]){this.staticMesh(new T.DodecahedronGeometry(1),0x344957,x,-4,z,5,3,4);this.staticMesh(new T.OctahedronGeometry(1),0x64b8ad,x,-.8,z,1,2,1);}
  for(const b of this.batches.values()){const geo=mergeGeometries(b.geo,false)!;this.scene.add(new T.Mesh(geo,b.mat));b.geo.forEach(g=>g.dispose());}this.batches.clear();
 }
 mesh(g:T.BufferGeometry,c:T.ColorRepresentation,group:T.Group,x=0,y=0,z=0){const m=new T.Mesh(g,this.material(c));m.position.set(x,y,z);group.add(m);return m;}
 actor(e:Entity){const g=new T.Group(),color=TEAM[e.team];
  const ring=this.mesh(new T.RingGeometry(e.kind==='hero'?1:1.5,e.kind==='hero'?1.17:1.7,32),color,g,0,.16,0);ring.rotation.x=-Math.PI/2;
  if(e.kind==='hero'){const c=HEROES[e.hero].color;this.mesh(new T.CylinderGeometry(.58,.95,1.7,6),c,g,0,1.4);this.mesh(new T.SphereGeometry(.45,8,6),0xe8d6b2,g,0,2.65);this.mesh(new T.ConeGeometry(.6,.5,6),c,g,0,3.03);this.mesh(new T.BoxGeometry(.25,2,.25),0xe0bd71,g,.95,1.6);this.mesh(new T.OctahedronGeometry(.38),color,g,.95,2.8);this.mesh(new T.BoxGeometry(.6,.7,.6),0x293b4a,g,-.6,1.8);if(e===this.game.player){const marker=this.mesh(new T.ConeGeometry(.5,.8,3),0xffdd8a,g,0,4.3);marker.rotation.z=Math.PI;}}
  else if(e.kind==='minion'){this.mesh(new T.BoxGeometry(.8,1,.8),e.team===0?0x4eaaa6:0xb7696b,g,0,.8);this.mesh(new T.ConeGeometry(.6,.7,4),0xdfd2aa,g,0,1.5);this.mesh(new T.BoxGeometry(.13,1.5,.13),0xd3b37a,g,.65,1);}
  else if(e.kind==='boss'){this.mesh(new T.IcosahedronGeometry(2.7,0),0x76728e,g,0,3.2);this.mesh(new T.OctahedronGeometry(1.3),0xe2a5fa,g,0,5.7);for(const s of [-1,1])this.mesh(new T.BoxGeometry(1.4,3.5,1.6),0x9990a5,g,s*2.7,2.8);this.mesh(new T.TorusGeometry(3,.16,5,12),0xe1bd8a,g,0,3.5).rotation.x=Math.PI/2;}
  else {const r=e.kind==='engine'?3:1.7;this.mesh(new T.CylinderGeometry(r,r*1.25,.8,8),0x7d8177,g,0,.7);this.mesh(new T.CylinderGeometry(r*.7,r*.9,1.7,8),0xd3ccb0,g,0,1.9);this.mesh(new T.CylinderGeometry(r*.85,r*.6,.4,8),0xb59a64,g,0,2.9);this.mesh(new T.OctahedronGeometry(r*.85),color,g,0,e.kind==='engine'?4.7:4);for(let j=0;j<4;j++){const a=j*Math.PI/2;this.mesh(new T.BoxGeometry(.35,2.5,.35),0xe0ce9e,g,Math.cos(a)*r,3,Math.sin(a)*r);}if(e.kind==='seal')g.scale.y=.65;}
  this.scene.add(g);this.actors.set(e.id,g);return g;
 }
 project(p:Point,y=0){const v=new T.Vector3(p.x,y,p.z).project(this.camera);return {x:(v.x+1)*this.host.clientWidth/2,y:(1-v.y)*this.host.clientHeight/2};}
 ground(clientX:number,clientY:number):Point{const r=this.canvas.getBoundingClientRect();this.mouse.set((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.mouse,this.camera);const p=new T.Vector3();this.ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p);return {x:p.x,z:p.z};}
 pick(p:Point){return this.game.entities.filter(e=>e.team!==0&&e.hp>0&&this.game.visible(e)&&distance(e,p)<3.6).sort((a,b)=>distance(a,p)-distance(b,p))[0];}
 render(){const game=this.game,ctx=this.ctx;this.camera.zoom=this.zoom;this.camera.position.set(48+this.pan.x,88,70+this.pan.z);this.camera.lookAt(this.pan.x,0,this.pan.z);this.camera.updateProjectionMatrix();ctx.clearRect(0,0,this.host.clientWidth,this.host.clientHeight);
  for(const e of game.entities){let g=this.actors.get(e.id);if(!g&&e.hp>0)g=this.actor(e);if(!g)continue;g.visible=e.hp>0&&game.visible(e);if(!g.visible)continue;g.position.set(e.x,.15,e.z);if(e.move)g.rotation.y=Math.atan2(e.move.x-e.x,e.move.z-e.z);if(e.kind==='hero')g.position.y+=Math.sin(game.time*5+e.id)*.06;
   const p=this.project(e,e.kind==='hero'?4:e.kind==='minion'?2.6:6);const width=e.kind==='minion'?20:e.kind==='hero'?58:70;ctx.fillStyle='#07141ee8';ctx.fillRect(p.x-width/2-2,p.y-2,width+4,7);ctx.fillStyle=e.team===0?'#78e2cc':e.team===1?'#f08c80':'#cf9bef';ctx.fillRect(p.x-width/2,p.y,width*e.hp/e.maxHp,3);if(!game.vulnerable(e)){ctx.fillStyle='#ead8a0';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('◇',p.x,p.y-7);}else if(e.kind==='hero'||e.kind==='boss'){ctx.font=e===game.player?'bold 11px sans-serif':'10px sans-serif';ctx.textAlign='center';ctx.fillStyle=e===game.player?'#ffdf9c':'#eceada';ctx.fillText(e.kind==='hero'?`${e.name}  ${e.level}`:e.name.toUpperCase(),p.x,p.y-6);}
  }
  while(this.fx.children.length){const c=this.fx.children[0] as T.Mesh;this.fx.remove(c);c.geometry.dispose();(c.material as T.Material).dispose();}
  for(const f of game.effects){const alpha=f.life/f.maxLife,mat=new T.MeshBasicMaterial({color:f.color,transparent:true,opacity:alpha*.8,side:T.DoubleSide,depthWrite:false});let m:T.Mesh;
   if(f.type==='shot'||f.type==='dash'){const len=Math.hypot(f.tx-f.x,f.tz-f.z);m=new T.Mesh(new T.BoxGeometry(f.size,.2,len),mat);m.position.set((f.x+f.tx)/2,1.5,(f.z+f.tz)/2);m.rotation.y=Math.atan2(f.tx-f.x,f.tz-f.z);}
   else {const r=f.type==='warning'?f.size:f.size*(1.3-alpha*.5);m=new T.Mesh(new T.RingGeometry(Math.max(.1,r-.16),r,40),mat);m.rotation.x=-Math.PI/2;m.position.set(f.x,.75,f.z);}this.fx.add(m);
  }
  for(const w of game.wards){const m=new T.Mesh(new T.OctahedronGeometry(.65),new T.MeshBasicMaterial({color:0x94e6d5}));m.position.set(w.x,1.8+Math.sin(game.time*3)*.2,w.z);this.fx.add(m);}
  this.renderer.render(this.scene,this.camera);
 }
 destroy(){window.removeEventListener('resize',this.resize);this.renderer.dispose();this.host.replaceChildren();}
}
