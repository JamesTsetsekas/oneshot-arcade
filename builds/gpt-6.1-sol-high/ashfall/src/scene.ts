import '@babylonjs/core/Culling/ray';
import {Engine} from '@babylonjs/core/Engines/engine';
import {Scene} from '@babylonjs/core/scene';
import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera';
import {Vector3,Matrix} from '@babylonjs/core/Maths/math.vector';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {PointerEventTypes} from '@babylonjs/core/Events/pointerEvents';
import {GlowLayer} from '@babylonjs/core/Layers/glowLayer';
import {Game,rng} from './game';
export function createScene(canvas:HTMLCanvasElement,g:Game){
 const engine=new Engine(canvas,true,{stencil:true,preserveDrawingBuffer:true});const scene=new Scene(engine);scene.clearColor=new Color4(.025,.038,.044,1);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.019;scene.fogColor=new Color3(.045,.065,.075);
 const camera=new ArcRotateCamera('camera',-Math.PI/2-Math.PI/4,Math.PI/3.15,29,new Vector3(0,0,0),scene);camera.fov=.72;camera.lowerRadiusLimit=20;camera.upperRadiusLimit=37;camera.minZ=.1;
 const sky=new HemisphericLight('moon',new Vector3(.3,1,.2),scene);sky.intensity=1.15;sky.diffuse=new Color3(.54,.7,.8);sky.groundColor=new Color3(.17,.12,.12);const sun=new DirectionalLight('rim',new Vector3(.3,-1,.6),scene);sun.intensity=1.8;sun.diffuse=new Color3(.9,.64,.39);new GlowLayer('embers',scene,{blurKernelSize:32}).intensity=.6;
 const materials=new Map<string,StandardMaterial>();function mat(hex:string,emissive=false){const key=hex+emissive;if(materials.has(key))return materials.get(key)!;const m=new StandardMaterial(key,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.08,.08,.08);if(emissive)m.emissiveColor=Color3.FromHexString(hex).scale(.8);materials.set(key,m);return m;}
 const world=new TransformNode('world',scene);const actorRoot=new TransformNode('actors',scene);let zone=-1;const actors=new Map<number,TransformNode>();const itemViews=new Map<number,TransformNode>();let decorations:Mesh[]=[];
 function box(name:string,x:number,y:number,z:number,w:number,h:number,d:number,c:string,parent:TransformNode=world){const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.material=mat(c);m.parent=parent;return m;}
 function sphere(name:string,x:number,y:number,z:number,r:number,c:string,parent:TransformNode,glow=false){const m=MeshBuilder.CreateSphere(name,{diameter:r,segments:6},scene);m.position.set(x,y,z);m.material=mat(c,glow);m.parent=parent;return m;}
 function ring(name:string,x:number,z:number,r:number,c:string,parent:TransformNode=world){const m=MeshBuilder.CreateTorus(name,{diameter:r*2,thickness:.075,tessellation:64},scene);m.position.set(x,.08,z);m.material=mat(c,true);m.parent=parent;return m;}
 function pillar(x:number,z:number,h:number){box('plinth',x,.25,z,1.5,.5,1.5,'#454c4e');const m=MeshBuilder.CreateCylinder('fluted stone',{height:h,diameter:.85,tessellation:8},scene);m.position.set(x,h/2+.5,z);m.material=mat('#656c6b');m.parent=world;box('capital',x,h+.45,z,1.3,.3,1.3,'#737573');}
 function brazier(x:number,z:number){box('brazier',x,.5,z,.65,1,.65,'#605044');sphere('flame',x,1.2,z,.45,'#ffb14f',world,true);ring('warmth',x,z,.8,'#b46e32');}
 function rebuild(){world.getChildren().forEach(n=>n.dispose());actors.forEach((n,id)=>{if(id!==0)n.dispose();});actors.clear();itemViews.clear();zone=g.zone;const r=rng(g.seed+zone);const crypt=zone>=2;
 box('foundation',0,-.8,8,29,1.4,51,'#202b2e');box('walkable',0,-.15,8,27,.3,49,crypt?'#343b3d':'#303b39');
 for(let x=-12;x<=12;x+=2)for(let z=-12;z<=32;z+=2){const m=box('ground',x,-.005+r()*.035,z,1.93,.12,1.93,['#3b4444','#414948','#36403f','#454b48'][Math.floor(r()*4)]);m.isPickable=false;}
 for(const material of materials.values()){const tiles=world.getChildMeshes().filter(m=>m.name==='ground'&&m.material===material) as Mesh[];if(tiles.length){const merged=Mesh.MergeMeshes(tiles,true,true,undefined,false,false);if(merged){merged.parent=world;merged.isPickable=false;}}}
 for(let i=0;i<110;i++){const x=(r()-.5)*25,z=r()*46-13;if(Math.abs(x)<4)continue;const m=box('rubble',x,.1,z,r()*.65+.15,r()*.35+.1,r()*.5+.15,'#56605b');m.rotation.y=r()*3;}
 for(let side=-1;side<=1;side+=2){for(let z=-12;z<34;z+=5){box('edge',side*13.5,.35,z,.7,.8,4.9,'#555b55');if(crypt||r()>.35)pillar(side*11.8,z,2+r()*2.5);else{const tree=MeshBuilder.CreateCylinder('charred cypress',{height:5+r()*3,diameterBottom:2,diameterTop:0,tessellation:5},scene);tree.position.set(side*(14+r()*3),2,z);tree.material=mat('#182b2a');tree.parent=world;}}
 for(let z=-11;z<32;z+=12)brazier(side*8,z);}
 for(let z=-8;z<32;z+=8){box('processional inlay',0,.07,z,.16,.035,4,'#8c7853');box('inlay',0,.07,z,3,.035,.1,'#8c7853');}
 if(zone===0){for(let side=-1;side<=1;side+=2){box('refuge wall',side*7,1,10,5,2,2,'#51534c');box('roof',side*7,2.2,10,6,.5,3,'#333736');}ring('hearth',0,0,2.3,'#d6954d');sphere('refuge fire',0,.7,0,1,'#ffb95e',world,true);box('forge',-7,.6,-3,2,1.2,1,'#73664d');sphere('forge ember',-7,1.3,-3,.7,'#e88e44',world,true);}
 if(zone===1){ring('waypoint',-7,9,1.7,'#5ce0d0');const s=box('waystone',-7,1.3,9,.7,2.6,.7,'#61b7b2');s.rotation.z=.12;s.material=mat('#60c6bc',true);}
 if(zone===2){box('captive platform',7,.3,18,3,.6,3,'#625c4b');for(let i=-1;i<=1;i++)box('cage',7+i,.8,18,.1,2,.1,'#bb9c62');sphere('artificer',7,1,18,.9,'#86a99e',world);}
 if(zone===3){ring('outer sigil',0,6,8,'#726c4a');ring('inner sigil',0,6,6,'#6b8e8c');for(let i=0;i<8;i++){const a=i*Math.PI/4;const x=Math.cos(a)*9,z=6+Math.sin(a)*9;pillar(x,z,3);sphere('conduit',x,4,z,.55,'#8cf3de',world,true);}}
 for(let side=-1;side<=1;side+=2)pillar(side*3.5,31,5);box('lintel',0,5.3,31,8,.8,1.2,'#76796f');ring('gate',0,31,2.3,zone===0?'#8cdacb':'#d8a65b');
 decorations=[];for(let i=0;i<55;i++){const m=sphere('falling ash',(r()-.5)*30,r()*10,r()*48-14,.035+r()*.03,'#b7a37b',world,true);decorations.push(m);}
 }
 function actor(id:number,kind:string,boss=false){const root=new TransformNode('actor '+id,scene);root.parent=actorRoot;const player=id===0;const scale=boss?2.2:1;const metal=player?'#bac4bd':boss?'#83765e':kind==='Grave Scribe'?'#776582':'#807e70';
 const body=box('body',0,1*scale,0,.65*scale,.85*scale,.45*scale,metal,root);body.rotation.z=player?0:.12;
 sphere('head',0,1.7*scale,0,.44*scale,player?'#b7ae95':'#c2bba1',root);sphere('eyes',0,1.72*scale,.22*scale,.14*scale,player?'#9df1dc':boss?'#ffbf5d':'#ee9068',root,true);
 box('shoulder',-.5*scale,1.3*scale,0,.6*scale,.3*scale,.65*scale,metal,root);box('shoulder',.5*scale,1.3*scale,0,.6*scale,.3*scale,.65*scale,metal,root);
 box('cloak',0,.9*scale,-.3*scale,.8*scale,1.3*scale,.15*scale,player?'#386d68':'#3d3539',root);for(const x of [-.2,.2])box('leg',x*scale,.35*scale,0,.22*scale,.7*scale,.25*scale,'#373e3d',root);
 const weapon=box('weapon',.65*scale,1.1*scale,.5*scale,.14*scale,1.35*scale,.15*scale,'#c3a56b',root);weapon.rotation.x=.6;
 if(player&&g.cls==='Veil Ranger'){const bow=MeshBuilder.CreateTorus('star bow',{diameter:1.3,thickness:.08,tessellation:16},scene);bow.parent=root;bow.position.set(.65,1.3,.5);bow.rotation.x=Math.PI/2;bow.scaling.x=.45;bow.material=mat('#8ad2c1',true);}else sphere('weapon head',.65*scale,1.6*scale,.8*scale,.44*scale,player?'#83d7cb':'#e3ac62',root,true);
 if(kind==='Ash Crawler'){root.scaling.set(.85,.65,1);body.rotation.x=.6;}
 if(kind==='Grave Scribe'){root.scaling.set(.7,1.15,.7);const halo=ring('scribe halo',0,0,.7,'#bd98da',root);halo.position.y=2;}
 if(kind==='Orison Engine'){const wheel=MeshBuilder.CreateTorus('engine wheel',{diameter:5.7,thickness:.3,tessellation:16},scene);wheel.parent=root;wheel.position.y=3;wheel.rotation.x=Math.PI/2;wheel.material=mat('#b99d62');sphere('buried star',0,3,.8,1.2,'#91e6d2',root,true);for(const x of [-2.2,2.2])box('engine leg',x,1.2,0,.45,2.4,.7,'#8c8466',root);}
 const shadow=MeshBuilder.CreateDisc('shadow',{radius:.75*scale,tessellation:24},scene);shadow.rotation.x=-Math.PI/2;shadow.position.y=.035;shadow.material=mat('#182224');shadow.parent=root;
 root.getChildMeshes().forEach(m=>{m.isPickable=!player;m.metadata={enemy:id};});actors.set(id,root);return root;}
 const player=actor(0,'player');
 let fx:Mesh[]=[];let accumulator=0;let last=performance.now();let uiTime=0;
 scene.onPointerObservable.add(info=>{const p=scene.pick(scene.pointerX,scene.pointerY,m=>m.name==='walkable');if(!p?.pickedPoint)return;g.aim={x:p.pickedPoint.x,z:p.pickedPoint.z};if(info.type===PointerEventTypes.POINTERDOWN){canvas.focus();if(info.event.button===2){g.cast(0);return;}if(info.event.button===0){const hit=scene.pick(scene.pointerX,scene.pointerY,m=>m.metadata?.enemy>0);g.command(g.aim,hit?.pickedMesh?.metadata?.enemy);g.hold=true;}}if(info.type===PointerEventTypes.POINTERUP)g.hold=false;});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{e.preventDefault();camera.radius=Math.max(20,Math.min(37,camera.radius+e.deltaY*.012));},{passive:false});
 engine.runRenderLoop(()=>{const now=performance.now();accumulator+=Math.min(.1,(now-last)/1000);last=now;while(accumulator>=1/30){g.tick(1/30);accumulator-=1/30;}if(zone!==g.zone){rebuild();actors.set(0,player);}player.position.set(g.player.x,0,g.player.z);if(g.target)player.rotation.y=Math.atan2(g.target.x-g.player.x,g.target.z-g.player.z);const follow=new Vector3(g.player.x,0,g.player.z+2);camera.target=Vector3.Lerp(camera.target,follow,.09);
 for(const e of g.enemies){let node=actors.get(e.id);if(e.hp<=0){node?.setEnabled(false);continue;}if(!node)node=actor(e.id,e.kind,e.boss);node.position.set(e.x,Math.sin(g.time*3+e.id)*.035,e.z);node.rotation.y=Math.atan2(g.player.x-e.x,g.player.z-e.z);}
 for(const entry of g.items){if(!itemViews.has(entry.item.id)){const n=new TransformNode('loot',scene);n.parent=world;const m=box('loot shard',0,.5,0,.3,.7,.3,'#bba7f0',n);m.material=mat('#bba7f0',true);m.rotation.z=.5;ring('loot ring',0,0,.45,'#bba7f0',n);n.position.set(entry.x,0,entry.z);itemViews.set(entry.item.id,n);}}
 for(const [id,n] of itemViews)if(!g.items.some(v=>v.item.id===id)){n.dispose();itemViews.delete(id);}
 fx.forEach(m=>m.dispose());fx=[];
 for(const e of g.enemies)if(e.hp>0&&e.state==='Telegraph'){const pos=e.kind==='Grave Scribe'?e.origin:e;const rad=e.boss?4+e.phase*.5:e.kind==='Grave Scribe'?2.5:2.4;const m=ring('danger',pos.x,pos.z,rad,'#f07345');fx.push(m);const fill=MeshBuilder.CreateDisc('danger fill',{radius:rad,tessellation:48},scene);fill.rotation.x=-Math.PI/2;fill.position.set(pos.x,.04,pos.z);const material=mat('#a33f27');material.alpha=.23;fill.material=material;fx.push(fill);const inner=ring('danger progress',pos.x,pos.z,rad*Math.max(.05,1-e.timer/(e.boss?1.2:1)),'#ffb46d');fx.push(inner);}
 for(const e of g.effects){if(e.kind==='text')continue;const c=e.kind==='enemyBlast'||e.kind==='hurt'?'#ff7950':e.kind==='heal'?'#93eed1':e.kind==='death'?'#dbbd79':'#88dfd5';const m=ring(e.kind,e.x,e.z,e.radius*(1.2-e.life/e.max*.8),c);fx.push(m);}
 for(const m of decorations){m.position.y-=.007;if(m.position.y<0)m.position.y=9;}
 if(g.echo){const m=ring('echo',g.echo.x,g.echo.z,1,'#a5cef5');fx.push(m);}
 scene.render();uiTime+=engine.getDeltaTime();if(uiTime>80){g.changed();uiTime=0;}
 });
 const resize=()=>engine.resize();window.addEventListener('resize',resize);
 return {scene,camera,project(p:{x:number;z:number},height=2){const v=Vector3.Project(new Vector3(p.x,height,p.z),Matrix.IdentityReadOnly,scene.getTransformMatrix(),camera.viewport.toGlobal(engine.getRenderWidth(),engine.getRenderHeight()));return {x:v.x/engine.getRenderWidth()*100,y:v.y/engine.getRenderHeight()*100};},dispose(){window.removeEventListener('resize',resize);engine.dispose();}};
}





