/* Scanned face + tailored procedural costume. See assets/characters/ATTRIBUTION.md. */
'use strict';
window.InkHuman=(()=>{
 const T=THREE, actors=[], cache={}, root='assets/characters/scan/';
 let geometry=null,skin=null,status='loading';
 const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
 function fabric(){
  const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#c5c0ae';x.fillRect(0,0,256,256);
  for(let a=0;a<256;a++){x.strokeStyle=a%2?'#b8b4a4':'#d7d1bd';x.lineWidth=.5;x.beginPath();x.moveTo(a,0);x.lineTo(a,256);x.stroke();x.globalAlpha=.35;x.beginPath();x.moveTo(0,a);x.lineTo(256,a);x.stroke();x.globalAlpha=1;}
  const tex=new T.CanvasTexture(c);tex.encoding=T.sRGBEncoding;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(4,5);return tex;
 }
 const weave=fabric();
 function material(color,options={}){return new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness:.86,...options});}
 const hair=material(0x1d201f,{roughness:.68}),greyHair=material(0x6e7169),ivory=material(0xcbbfaa,{map:weave}),leather=material(0x453d30,{roughness:.68}),shoe=material(0x242c2a),flesh=material(0xc7997d,{roughness:.56}),trim=material(0x8b805f,{metalness:.2,roughness:.65});
 function add(parent,geo,mat,x=0,y=0,z=0){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
 function ellipsoid(parent,rx,ry,rz,x,y,z,mat){const m=add(parent,new T.SphereGeometry(1,24,16),mat,x,y,z);m.scale.set(rx,ry,rz);return m;}
 function surface(rings,folds=12){
  const p=[],uv=[],idx=[],n=64;
  rings.forEach(([y,rx,rz],j)=>{for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,f=1+Math.sin(a*folds+j*.22)*.032;p.push(Math.sin(a)*rx*f,y,Math.cos(a)*rz*f);uv.push(i/n,j/(rings.length-1));}});
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const k=j*(n+1)+i;if(rings[0][0]>rings[rings.length-1][0])idx.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);else idx.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 function ribbon(parent,points,width,mat){
  const curve=new T.CatmullRomCurve3(points.map(p=>V(...p))),p=[],uv=[],idx=[];
  for(let i=0;i<=24;i++){const a=curve.getPoint(i/24),t=curve.getTangent(i/24),offset=V(t.y,-t.x,0).normalize().multiplyScalar(width/2);const left=a.clone().sub(offset),right=a.clone().add(offset);p.push(...left.toArray(),...right.toArray());uv.push(0,i/24,1,i/24);if(i<24){const n=i*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const m=add(parent,g,mat);m.material.side=T.DoubleSide;return m;
 }
 function hand(parent,sign){
  const g=new T.Group();g.position.y=-.64;parent.add(g);ellipsoid(g,.045,.074,.022,0,-.035,0,flesh);
  for(let i=0;i<4;i++){const f=new T.Group();f.position.set((i-1.5)*.021,-.077,.005);f.rotation.z=(i-1.5)*.04;g.add(f);const len=[.054,.064,.061,.046][i];add(f,new T.CylinderGeometry(.008,.009,len,8),flesh,0,-len/2,0);ellipsoid(f,.008,.01,.009,0,-len,0,flesh);}
  const thumb=ellipsoid(g,.014,.047,.015,sign*.044,-.03,.018,flesh);thumb.rotation.z=-sign*.5;return g;
 }
 function attachHead(actor){
  if(!geometry||actor.userData.scanned)return;
  const head=actor.userData.headPivot;head.remove(actor.userData.fallback);
  const scan=add(head,geometry,skin,0,-.02,.012);scan.scale.set(.05,.05,.05);scan.name='licensed-scanned-face';actor.userData.scanned=true;
 }
 function hairShell(){
  const p=[],idx=[],n=48,m=20;
  for(let j=0;j<=m;j++)for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,front=(Math.sin(a)+1)/2,limit=2.5-front*1.18,theta=j/m*limit;p.push(-Math.cos(a)*Math.sin(theta)*.095,Math.cos(theta)*.103+.115,Math.sin(a)*Math.sin(theta)*.112+.01);}
  for(let j=0;j<m;j++)for(let i=0;i<n;i++){const k=j*(n+1)+i;idx.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
 }
 function eyes(parent){
  const groups=[],white=material(0xe2ddd2,{roughness:.32}),iris=material(0x493826,{roughness:.34}),black=material(0x10110e,{roughness:.25}),lid=material(0xa57761,{roughness:.68});
  for(const sign of [-1,1]){
   const eye=new T.Group();eye.position.set(sign*.034,.06,.1005);parent.add(eye);groups.push(eye);
   ellipsoid(eye,.015,.0055,.005,0,0,0,white);ellipsoid(eye,.0047,.005,.001,0,0,.0047,iris);ellipsoid(eye,.002,.0025,.0007,0,0,.0055,black);
   ellipsoid(eye,.0007,.0007,.0003,-.0015,.0015,.006,material(0xffffff,{emissive:0x333333}));
   const arc=[];for(let i=0;i<=16;i++){const a=i/16*Math.PI;arc.push(V(-Math.cos(a)*.015,Math.sin(a)*.0058,.002));}
   add(eye,new T.TubeGeometry(new T.CatmullRomCurve3(arc),24,.001,5,false),lid);
  }
  return groups;
 }
 function create({color=0x536b70,elder=false,player=false}={}){
  const actor=new T.Group(),body=new T.Group();actor.add(body);actor.userData.body=body;
  const cloth=material(color,{map:weave,roughness:.91});
  const torso=add(body,surface([[.88,.18,.115],[1.02,.19,.12],[1.18,.23,.135],[1.33,.255,.13],[1.4,.21,.10],[1.46,.095,.075]],9),cloth);
  const skirt=add(body,surface([[.16,.30,.19],[.24,.31,.195],[.42,.28,.18],[.65,.245,.15],[.86,.19,.12],[.94,.185,.12]],18),cloth);
  skirt.userData.original=skirt.geometry.attributes.position.array.slice();actor.userData.skirt=skirt;
  const under=add(body,surface([[.14,.255,.16],[.4,.24,.14],[.87,.17,.10]],14),ivory);
  const neck=add(body,surface([[1.405,.105,.08],[1.46,.076,.068],[1.51,.061,.064],[1.55,.06,.064]],0),flesh);
  ribbon(body,[[-.083,1.45,.079],[-.04,1.32,.143],[.07,1.13,.14],[.155,.98,.13]],.057,ivory);
  ribbon(body,[[.083,1.45,.079],[.05,1.32,.15],[-.04,1.15,.146],[-.155,.98,.13]],.044,ivory);
  const belt=add(body,surface([[.88,.196,.132],[.945,.196,.132]],0),leather);
  const clasp=add(body,new T.BoxGeometry(.065,.044,.025),trim,.06,.914,.14);
  ribbon(body,[[.13,.91,.14],[.15,.76,.16],[.18,.57,.19]],.025,leather);
  const arms=[];
  for(const sign of [-1,1]){
   const arm=new T.Group();arm.position.set(sign*.245,1.34,0);arm.rotation.z=sign*.12;body.add(arm);arms.push(arm);
   add(arm,surface([[0,.095,.10],[-.16,.13,.12],[-.36,.155,.135],[-.55,.12,.105],[-.59,.115,.10]],9),cloth);
   add(arm,surface([[-.545,.122,.106],[-.59,.117,.103]],0),ivory);hand(arm,sign);
  }
  const legs=[];
  for(const sign of [-1,1]){
   const leg=new T.Group();leg.position.set(sign*.105,.82,0);actor.add(leg);legs.push(leg);
   add(leg,new T.CylinderGeometry(.078,.055,.67,16),ivory,0,-.36,0);ellipsoid(leg,.071,.057,.145,0,-.76,.06,shoe);
  }
  const headPivot=new T.Group();headPivot.position.set(0,1.59,0);body.add(headPivot);actor.userData.headPivot=headPivot;
  const fallback=ellipsoid(headPivot,.08,.125,.095,0,.04,0,flesh);actor.userData.fallback=fallback;
  // Scalp and tied hair are fitted around the actual scan rather than a spherical head.
  const hairMat=elder?greyHair:hair;
  const cap=add(headPivot,hairShell(),hairMat);cap.material.side=T.DoubleSide;
  const bun=ellipsoid(headPivot,.045,.04,.042,0,.225,-.035,hairMat);bun.rotation.x=-.2;
  add(headPivot,new T.CylinderGeometry(.006,.006,.16,12),trim,0,.225,-.035).rotation.z=Math.PI/2;
  // Fine curved strands make the silhouette and surface catch the key light.
  for(let i=0;i<20;i++){const a=(i/19-.5)*2.5;const curve=new T.CatmullRomCurve3([V(Math.sin(a)*.091,.132,Math.cos(a)*.108+.006),V(Math.sin(a)*.07,.205,.005),V(Math.sin(a)*.025,.235,-.035)]);add(headPivot,new T.TubeGeometry(curve,12,.001,3,false),elder?hair:material(0x3c3b32));}
  actor.userData.arms=arms;actor.userData.legs=legs;actor.userData.phase=actors.length*.73;actor.userData.player=player;
  actor.userData.eyes=eyes(headPivot);
  actor.userData.cape=skirt;actor.userData.isHuman=true;actors.push(actor);attachHead(actor);return actor;
 }
 function update(actor,dt,time,speed=0){
  if(!actor.userData.isHuman)return;const data=actor.userData,blend=Math.min(1,dt*9),phase=time*(speed>4?10:7.5)+data.phase,moving=speed>.1;
  const swing=moving?Math.sin(phase)*(speed>4?.4:.27):0;
  data.arms.forEach((a,i)=>a.rotation.x=T.MathUtils.lerp(a.rotation.x,(i===0?swing:-swing)*.65,blend));
  data.legs.forEach((l,i)=>l.rotation.x=T.MathUtils.lerp(l.rotation.x,i===0?-swing:swing,blend));
  data.body.position.y=moving?Math.abs(Math.sin(phase))* .018:Math.sin(time*1.4+data.phase)*.003;
  data.headPivot.rotation.y=Math.sin(time*.6+data.phase)*.016;
  const cycle=(time+data.phase)%5.1,blink=cycle<.16?Math.max(.1,Math.abs(cycle-.08)/.08):1;data.eyes.forEach(eye=>eye.scale.y=blink);
  const p=data.skirt.geometry.attributes.position,base=data.skirt.userData.original;
  for(let i=0;i<p.count;i++){const y=base[i*3+1],weight=Math.max(0,1-y/.95);p.array[i*3+2]=base[i*3+2]+Math.sin(time*(moving?7:1.7)+base[i*3]*9)*weight*(moving?.025:.006);}
  p.needsUpdate=true;
 }
 const ready=(async()=>{
  try{
   const loader=new T.TextureLoader();const [model,color,normal]=await Promise.all([
    new Promise((resolve,reject)=>new T.GLTFLoader().load(root+'head.glb',resolve,undefined,reject)),
    new Promise((resolve,reject)=>loader.load(root+'skin-color.jpg',resolve,undefined,reject)),
    new Promise((resolve,reject)=>loader.load(root+'skin-normal.jpg',resolve,undefined,reject))
   ]);
   model.scene.traverse(o=>{if(o.isMesh&&!geometry)geometry=o.geometry.clone();});if(!geometry)throw Error('missing face geometry');
   // Original asset is a bust. Retain the head and upper neck, removing shoulders
   // before attaching it to the tailored body. Keep original UVs and attribution.
   const position=geometry.attributes.position,index=geometry.index,kept=[];
   for(let i=0;i<index.count;i+=3){
    const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2),x=(position.getX(a)+position.getX(b)+position.getX(c))/3,y=(position.getY(a)+position.getY(b)+position.getY(c))/3,z=(position.getZ(a)+position.getZ(b)+position.getZ(c))/3;
    const socket=z>1.4&&Math.pow((Math.abs(x)-.68)/.30,2)+Math.pow((y-1.6)/.11,2)<1;
    if(Math.min(position.getY(a),position.getY(b),position.getY(c))>=-1.55&&!socket)kept.push(a,b,c);
   }
   geometry.setIndex(kept);geometry.computeBoundingSphere();
   color.encoding=T.sRGBEncoding;color.flipY=true;normal.flipY=true;skin=material(0xffffff,{map:color,normalMap:normal,normalScale:new T.Vector2(.65,.65),roughness:.57});
   actors.forEach(attachHead);status='ready';return true;
  }catch(e){status='failed';console.warn('写实面部加载失败，保留本地人体比例模型。',e);return false;}
 })();
 return {create,update,ready,get status(){return status;},get actors(){return actors;}};
})();
