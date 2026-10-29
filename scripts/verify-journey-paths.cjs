// Check that every objective lies within interaction distance of the walkable region.
// Uses the production height/boundary rules rather than a second navigation model.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../2d');
const source=fs.readFileSync(path.join(root,'journey-3d.js'),'utf8');
const rules=source.slice(source.indexOf('function bridgeHeight('),source.indexOf('function buildBridge('))+source.slice(source.indexOf('function walkHeight('),source.indexOf('function updatePlayer('));
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'journey-3d-data.js'),'utf8')+';this.data=journey3D;',context);
context.data.forEach((chapter,chapterIndex)=>{
 const api=new Function('chapterIndex','obstacles','clamp',rules+';return {walkHeight,canWalk};')(chapterIndex,[],(x,a,b)=>Math.max(a,Math.min(b,x)));
 const queue=[chapter.spawn],seen=new Set(),reachable=[],step=.5;
 const key=(x,y,z)=>`${x},${Math.round(y*1000)},${z}`;
 seen.add(key(...chapter.spawn));
 for(let n=0;n<queue.length;n++){
  const [x,y,z]=queue[n];reachable.push([x,y,z]);
  for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){
   const a=x+dx,b=z+dz;if(!api.canWalk(a,b,y))continue;const h=api.walkHeight(a,b,y),k=key(a,h,b);
   if(!seen.has(k)){seen.add(k);queue.push([a,h,b]);}
  }
 }
 for(const task of chapter.tasks)for(const node of task.nodes){const [x,y,z]=node.pos;assert.ok(reachable.some(p=>Math.abs(p[1]-y)<1&&Math.hypot(p[0]-x,p[1]-y,p[2]-z)<2.7),chapter.id+': unreachable '+node.label);}
 console.log('PASS paths:',chapter.id,reachable.length,'reachable positions; all targets accessible.');
});
