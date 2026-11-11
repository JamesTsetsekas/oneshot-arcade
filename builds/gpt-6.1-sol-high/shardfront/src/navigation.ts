import {walkable} from './data';
// Shared coarse-grid A*; bounded deterministic queries with local separation in simulation.
export function route(sx:number,sz:number,tx:number,tz:number):{x:number,z:number}[]{
 const cell=2, w=56,h=44; const start=Math.floor(sz/cell)*w+Math.floor(sx/cell), goal=Math.floor(tz/cell)*w+Math.floor(tx/cell);
 if(!walkable(tx,tz))return [];
 const open=[start],g=new Map([[start,0]]),prev=new Map<number,number>(); let count=0;
 const heuristic=(n:number)=>Math.abs(n%w-goal%w)+Math.abs(Math.floor(n/w)-Math.floor(goal/w));
 while(open.length&&count++<2500){open.sort((a,b)=>(g.get(a)!+heuristic(a))-(g.get(b)!+heuristic(b)));const n=open.shift()!;if(n===goal){const path=[{x:tx,z:tz}];let c=n;while(prev.has(c)){path.push({x:(c%w)*cell+1,z:Math.floor(c/w)*cell+1});c=prev.get(c)!;}return path.reverse();}for(const d of [-1,1,-w,w]){const q=n+d,x=q%w,z=Math.floor(q/w);if(x<1||x>=w-1||z<1||z>=h-1||!walkable(x*cell+1,z*cell+1))continue;const cost=g.get(n)!+1;if(cost<(g.get(q)??Infinity)){g.set(q,cost);prev.set(q,n);if(!open.includes(q))open.push(q);}}}return [];
}

