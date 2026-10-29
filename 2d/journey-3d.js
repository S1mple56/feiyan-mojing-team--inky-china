/* 墨境：五章共享的第三人称探索、建筑场景、机关、镜头与检查点。 */
'use strict';
(() => {
const $=id=>document.getElementById(id), PI=Math.PI, TAU=PI*2;
const ids=chapters.map(c=>c.id), requested=new URLSearchParams(location.search).get('chapter');
const chapterIndex=Math.max(0,ids.indexOf(requested)), chapter=chapters[chapterIndex], config=journey3D[chapterIndex];
const SAVE='inkJourney3DProgressV1', MAIN='inkJourneyProgressV1';
let mainSave={}, slots={}, progress, unlocked=false, renderer, scene, camera, player, spirit, water, sun, lampLights=[];
let nodes=[], structures=[], effectObjects=[], obstacles=[], clock, running=false, mode='start', elapsed=0, currentTarget=null, hold=0, holding=false;
let yaw=.5,pitch=.48,distance=10,drag=null,keys={},joystick={x:0,y:0},sense=0,toastTimer,saveTimer=0;
let puzzle=null, puzzleState=null, storyDone=null, previousFocus=null, cinematic=null, lastSpawn=null;
let audio=null,audioEnabled=false, ambience=[], resultCount=0, frameCount=0;
let portrait={close:false,angle:0,returnMode:'start'},portraitLight;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const v=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let randomSeed=1201+chapterIndex*31;
function rand(){randomSeed=(randomSeed*1664525+1013904223)>>>0;return randomSeed/4294967296;}
function read(key,fallback){try {return JSON.parse(localStorage.getItem(key)||'null')||fallback;}catch{return fallback;}}
function completedPrefix(saved){const out=[];for(const id of ids){if(!Array.isArray(saved.completed)||!saved.completed.includes(id))break;out.push(id);}return out;}
mainSave=read(MAIN,{});unlocked=chapterIndex===0||completedPrefix(mainSave).includes(ids[chapterIndex-1]);
slots=read(SAVE,{});if(typeof slots!=='object'||Array.isArray(slots))slots={};
function load(){
    const raw=slots[chapter.id]||{};
    const task=Number.isInteger(raw.task)?clamp(raw.task,0,config.tasks.length):0;
    const action=task<config.tasks.length&&Number.isInteger(raw.action)?clamp(raw.action,0,config.tasks[task].nodes.length-1):0;
    let pos=config.spawn.slice();
    if(Array.isArray(raw.position)&&raw.position.length===3&&raw.position.every(Number.isFinite)&&Math.abs(raw.position[0])<=34&&raw.position[2]>=-23&&raw.position[2]<=34&&raw.position[1]>=0&&raw.position[1]<=8.4&&Math.abs(walkHeight(raw.position[0],raw.position[2],raw.position[1])-raw.position[1])<.75)pos=raw.position;
    return {task,action,position:pos,finished:task===config.tasks.length};
}
progress=load();
function save(){
    if(!player)return;
    progress.position=player.position.toArray();slots[chapter.id]=progress;
    try{localStorage.setItem(SAVE,JSON.stringify(slots));$('saveNote').textContent='墨迹已存';}catch{$('saveNote').textContent='存储不可用';toast('浏览器无法保存，请保持页面打开。');}
}
function toast(text){$('toast').textContent=text;$('toast').style.opacity='1';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.opacity='0',4000);}
function mat(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.86,...extra});}
const mats={};
function mesh(geo,material,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,x,y,z,material=mats.wood,parent=scene){return mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,parent);}
function cylinder(r1,r2,h,x,y,z,material=mats.wood,parent=scene,segments=10){if(parent===scene&&h>=3&&r2<.3)obstacles.push({x,z,r:r2,min:y-h/2,max:y+h/2});return mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material,x,y,z,parent);}
function lineBetween(a,b,r,material,parent=scene){const mid=a.clone().add(b).multiplyScalar(.5);const m=cylinder(r,r,a.distanceTo(b),mid.x,mid.y,mid.z,material,parent,6);m.quaternion.setFromUnitVectors(v(0,1,0),b.clone().sub(a).normalize());return m;}
function texture(type){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle=type==='roof'?'#355050':type==='wood'?'#655349':type==='terrain'?'#91a18b':'#78827b';x.fillRect(0,0,256,256);
    for(let i=0;i<160;i++){x.strokeStyle=type==='roof'?'rgba(12,30,31,.25)':'rgba(18,26,24,.12)';x.lineWidth=.5+rand()*2;x.beginPath();if(type==='roof'){const k=i*8;x.moveTo(k,0);x.lineTo(k,256);}else{x.moveTo(0,rand()*256);x.bezierCurveTo(80,rand()*256,150,rand()*256,256,rand()*256);}x.stroke();}
    if(type==='stone'){for(let a=0;a<256;a+=32){x.strokeRect(0,a,256,32);for(let b=(a/32%2)*32;b<256;b+=64)x.strokeRect(b,a,64,32);}}
    if(type==='terrain'){for(let i=0;i<8000;i++){const n=rand()*45;x.fillStyle=`rgba(${75+n},${99+n},${75+n},.25)`;x.fillRect(rand()*256,rand()*256,1+rand()*5,1+rand()*5);}for(let i=0;i<22;i++){x.fillStyle='rgba(191,187,149,.14)';x.beginPath();x.ellipse(rand()*256,rand()*256,10+rand()*30,5+rand()*16,rand()*PI,0,TAU);x.fill();}}
    const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(type==='roof'?3:2,2);tex.anisotropy=4;return tex;
}
function roof(w,d,x,y,z,parent=scene,open=false){
    const n=20,pos=[],uv=[],indices=[];
    for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const a=i/n*2-1,b=j/n*2-1,e=Math.max(Math.abs(a),Math.abs(b));pos.push(a*w/2,(1-e)*2.1+Math.pow(e,6)*Math.abs(a*b)*.9,b*d/2);uv.push(i/n,j/n);}
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){if(open&&Math.max(Math.abs((i+.5)/n*2-1),Math.abs((j+.5)/n*2-1))<.76)continue;const q=j*(n+1)+i;indices.push(q,q+n+1,q+1,q+1,q+n+1,q+n+2);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
    mesh(g,mats.roof,x,y,z,parent);
    const outline=[];for(let k=0;k<=n;k++){const a=k/n*2-1;outline.push(v(a*w/2,y+.9*Math.abs(a),z+d/2));}
    const trim=new THREE.Line(new THREE.BufferGeometry().setFromPoints(outline.map(p=>v(p.x+x,p.y,p.z))),new THREE.LineBasicMaterial({color:0xa6a17b}));parent.add(trim);
}
function lantern(x,y,z,on=true,scale=1){const group=new THREE.Group();group.position.set(x,y,z);group.scale.setScalar(scale);scene.add(group);
    cylinder(.08,.08,.8,0,.4,0,mats.dark,group);cylinder(.28,.28,.5,0,.95,0,on?mats.lit:mats.paper,group,10);box(.7,.08,.6,0,1.24,0,mats.wood,group);box(.7,.08,.6,0,.68,0,mats.wood,group);
    if(on){const light=new THREE.PointLight(0xffc97d,.55,7,2);light.position.set(x,y+1,z);scene.add(light);lampLights.push(light);}return group;
}
function pavilion(x,z,w=7,d=7,y=0){box(w+.6,.25,d+.6,x,y-.04,z,mats.stone);for(const a of [-1,1])for(const b of [-1,1])cylinder(.13,.17,3.2,x+a*(w/2-.4),y+1.6,z+b*(d/2-.4));roof(w+2,d+2,x,y+3.2,z);}
function tree(x,z,s=1,autumn=false){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);const trunk=mat(0x4e5348);lineBetween(v(),v(.3,3,0),.16,trunk,g);for(let i=0;i<4;i++){const a=i*2.2,p=v(Math.cos(a)*1.5,3.3+i*.3,Math.sin(a)*1.2);lineBetween(v(.2,2,0),p,.07,trunk,g);const leaves=mesh(new THREE.IcosahedronGeometry(1.5,1),autumn?mats.autumn:mats.leaves,p.x,p.y,p.z,g);leaves.scale.y=.45;}}
function gate(x,z,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);box(.35,3.5,.35,-2,1.75,0,mats.wood,g);box(.35,3.5,.35,2,1.75,0,mats.wood,g);roof(5.5,2,0,3.5,0,g);return g;}
function buildWorld(){
    scene.background=new THREE.Color(config.sky);scene.fog=new THREE.FogExp2(config.fog,.008);
    const sky=new THREE.Mesh(new THREE.SphereGeometry(180,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,uniforms:{top:{value:new THREE.Color(0x315263)},bottom:{value:new THREE.Color(config.sky)}},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;uniform vec3 top;uniform vec3 bottom;void main(){float h=clamp(normalize(p).y*1.4,0.,1.);gl_FragColor=vec4(mix(bottom,top,h),1.);}'}));scene.add(sky);
    scene.add(new THREE.HemisphereLight(0xd8edf0,0x5c6558,.8));sun=new THREE.DirectionalLight(config.color,1.65);sun.position.set(-25,42,-15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-45,right:45,top:45,bottom:-45,far:130});sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;scene.add(sun);scene.add(sun.target);
    mesh(new THREE.SphereGeometry(5,24,24),new THREE.MeshBasicMaterial({color:0xffe5b6}),-70,35,-100);
    const waterGeo=new THREE.PlaneGeometry(350,350,1,1);
    water=mesh(waterGeo,new THREE.ShaderMaterial({transparent:true,uniforms:{time:{value:0},awaken:{value:0},tint:{value:new THREE.Color(chapterIndex===2?0x3e807a:0x466b7b)}},vertexShader:'varying vec3 wp;void main(){vec4 p=modelMatrix*vec4(position,1.);wp=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',fragmentShader:`varying vec3 wp;uniform float time;uniform float awaken;uniform vec3 tint;
        void main(){
          float swell=sin(wp.z*.65+sin(wp.x*.19+time*.14)*3.-time*.45);
          float ripple=sin(wp.x*.42+sin(wp.z*.23)*4.+time*.25);
          float glitter=pow(max(0.,swell*ripple),12.)*.075;
          vec3 eye=normalize(cameraPosition-wp);
          float fresnel=pow(1.-clamp(eye.y,0.,1.),3.);
          vec3 col=mix(tint,vec3(.65,.75,.74),fresnel*.45)+vec3(swell*.018+glitter)+awaken*.025;
          gl_FragColor=vec4(col,.97);
        }`}),0,-.24,0);water.rotation.x=-PI/2;water.castShadow=false;
    if(chapterIndex===2){box(30,.65,75,-25,-.335,12,mats.ground);box(30,.65,75,25,-.335,12,mats.ground);box(20,.65,15,0,-.335,-15.5,mats.ground);box(20,.65,30,0,-.335,23,mats.ground);}
    else if(chapterIndex!==1)box(80,.65,75,0,-.335,12,mats.ground);else{box(42,.65,75,-42,-.335,0,mats.ground);box(42,.65,75,42,-.335,0,mats.ground);box(40,.3,10,0,-.2,7,mats.stone);}
    for(let i=0;i<14;i++){const x=(i-6.5)*23,z=-85-rand()*45,h=12+rand()*20,w=32+rand()*28,shape=new THREE.Shape();shape.moveTo(-w/2,-3);for(let j=0;j<=12;j++){const u=j/12;shape.lineTo((u-.5)*w,Math.sin(u*PI)*h*(.65+rand()*.35));}shape.lineTo(w/2,-3);shape.closePath();const m=mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:i%2?0x6b8c8a:0x567f85,side:THREE.DoubleSide}),x,0,z);m.castShadow=false;}
    // Floating dust and wind-blown specks use one draw call.
    const arr=new Float32Array(450*3);for(let i=0;i<450;i++){arr[i*3]=(rand()-.5)*90;arr[i*3+1]=rand()*20;arr[i*3+2]=(rand()-.5)*65;}
    const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(arr,3));const dust=new THREE.Points(pg,new THREE.PointsMaterial({color:0xe7d6a3,size:.065,transparent:true,opacity:.55,depthWrite:false}));scene.add(dust);effectObjects.push({type:'dust',object:dust});
    if(chapterIndex===0||chapterIndex===3)buildTower(chapterIndex===3);
    if(chapterIndex===1)buildBridge();if(chapterIndex===2)buildGarden();if(chapterIndex===4)buildTulou();
    for(let i=0;i<11;i++){const x=-31+rand()*62,z=20+rand()*16;if(chapterIndex===1&&Math.abs(x)<23)continue;tree(x,z,.6+rand()*.6,chapterIndex===2&&i%3===0);}
    for(let i=0;i<16;i++){const x=-30+rand()*60,z=-23+rand()*10;if(chapterIndex===1&&Math.abs(x)<23)continue;const r=mesh(new THREE.DodecahedronGeometry(.7+rand()*1.2),mats.rock,x,0,z);r.scale.y=.7;}
    const stonePositions=chapterIndex===1?[[-26,9],[24,9]]:[[-5,16],[5,16],[-12,18],[12,18]];
    stonePositions.forEach(([x,z])=>{for(let k=0;k<4;k++)box(1.3,.08,1.8,x,0,z-k*2,mats.stone);});
    buildGroundDetail();
}
function buildGroundDetail(){
    const blade=new THREE.Shape();blade.moveTo(-.045,0);blade.quadraticCurveTo(-.02,.35,.15,.62);blade.quadraticCurveTo(.04,.28,.045,0);blade.closePath();const geo=new THREE.ShapeGeometry(blade);
    const material=mat(0x6f8c70,{side:THREE.DoubleSide,roughness:1});
    const grass=new THREE.InstancedMesh(geo,material,380),dummy=new THREE.Object3D();
    for(let i=0;i<380;i++){let x=(rand()-.5)*65,z=(rand()-.5)*46+8;if(chapterIndex===1&&Math.abs(x)<23) x=x<0?-26:26;if(chapterIndex===2&&Math.abs(x)<17&&Math.abs(z)<17){x=x<0?-22:22;}
        if(chapterIndex===4&&Math.hypot(x,z)<21){x=Math.sin(i)*27;z=Math.cos(i)*27;}
        if((chapterIndex===0||chapterIndex===3)&&Math.abs(x)<13&&Math.abs(z)<10)z=22+rand()*6;
        dummy.position.set(x,.015,z);dummy.rotation.y=rand()*TAU;dummy.scale.setScalar(.6+rand()*1.3);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);
    }grass.castShadow=false;grass.receiveShadow=true;scene.add(grass);
}
function buildTower(wooden){
    const n=wooden?5:3;
    for(let floor=0;floor<n;floor++){
        const y=floor*4.2,w=wooden?15-floor*.5:16-floor*.5,d=12;
        box(w+.8,.3,d+.8,0,y-.15,0,mats.stone);box(w,.18,d,0,y+.02,0,mats.floor);
        for(let x=-6;x<=6;x+=4)for(const z of [-5,5]){cylinder(.18,.23,3.8,x,y+1.95,z,wooden?mats.wood:mats.red);box(1.1,.18,.7,x,y+3.7,z,mats.wood);box(.65,.18,1.2,x,y+3.52,z,mats.wood);}
        for(const z of [-5.4,5.4]){box(14,.13,.12,0,y+1,z,mats.wood);for(let x=-7;x<=7;x++)box(.07,.8,.07,x,y+.55,z,mats.wood);}
        roof(w+3,d+3,0,y+3.9,0,scene,floor<n-1);
        if(wooden){for(let i=0;i<8;i++){const a=i*TAU/8;lineBetween(v(Math.cos(a)*6,y+3.6,Math.sin(a)*4.8),v(0,y+3.6,0),.12,mats.wood);}}
    }
    cylinder(.1,.2,2.5,0,n*4.2+2,0,mats.gold);mesh(new THREE.SphereGeometry(.22,12,12),mats.gold,0,n*4.2+3.3,0);
    // Walkable, continuous stair runs on opposite sides of the first three floors.
    for(let side=0;side<2;side++){
        const x=side===0?10:-10,base=side*4.2;
        for(let s=0;s<28;s++){const t=(s+.5)/28,z=side===0?7-t*14:-7+t*14;box(2.8,.2,14/28,x,base+t*4.2-.08,z,mats.stone);}
        for(const z of [-7,7])box(4,.2,2,x/1.12,base+(side===0?(z===-7?4.2:0):(z===7?4.2:0)),z,mats.floor);
        const start=v(x,base+1,side===0?7:-7),end=v(x,base+5.2,side===0?-7:7);lineBetween(start,end,.045,mats.gold);
    }
    lantern(-6,0,8);lantern(6,0,8);
    if(!wooden){
        box(16,.2,5,24,-.06,14,mats.floor);for(let x=17;x<=31;x+=2){cylinder(.09,.1,1.5,x,-.6,12,mats.wood);cylinder(.09,.1,1.5,x,-.6,16,mats.wood);}
        const boat=new THREE.Group();boat.position.set(32,-.1,10);scene.add(boat);mesh(new THREE.SphereGeometry(1,12,8),mats.dark,0,.1,0,boat).scale.set(3,.5,1);cylinder(.04,.05,4,0,2,0,mats.wood,boat);const sail=mesh(new THREE.PlaneGeometry(2.3,3),mats.paper,1,2.5,0,boat);sail.rotation.y=.2;effectObjects.push({type:'boat',object:boat,origin:boat.position.clone()});
    }
}
function bridgeHeight(x){return 5*Math.max(0,1-Math.pow(x/22,2));}
function buildBridge(){
    const sh=new THREE.Shape();sh.moveTo(-22,-.3);for(let i=0;i<=60;i++){const x=-22+i*44/60;sh.lineTo(x,bridgeHeight(x));}sh.lineTo(22,-.3);sh.lineTo(18,-.3);for(let i=0;i<=60;i++){const x=18-i*36/60;sh.lineTo(x,Math.max(-.3,3.8*(1-Math.pow(x/18,2))));}sh.lineTo(-22,-.3);
    const g=new THREE.ExtrudeGeometry(sh,{depth:6,bevelEnabled:false});mesh(g,mats.stone,0,0,-3);
    for(let i=0;i<44;i++){const x=-21.5+i,y=bridgeHeight(x),deckMat=mats.stone.clone();deckMat.transparent=true;deckMat.opacity=.2;const deck=box(.98,.13,6,x,y+.06,0,deckMat);structures.push({object:deck,chapter:1,task:1,index:Math.min(2,Math.floor(i/15)),deck:true});for(const z of [-3,3]){box(.13,1,.13,x,y+.6,z,mats.stone);if(i>0)lineBetween(v(x-1,bridgeHeight(x-1)+1,z),v(x,y+1,z),.06,mats.stone);}}
    gate(-25,-2);gate(25,-2);lantern(-24,0,4);lantern(24,0,4);
    for(let i=0;i<3;i++){const ghost=box(7,.12,6,-12+i*12,bridgeHeight(-12+i*12)+.3,0,new THREE.MeshStandardMaterial({color:0x9ac8c5,transparent:true,opacity:.17,emissive:0x518b89,emissiveIntensity:.4}));structures.push({object:ghost,chapter:1,task:1,index:i});}
}
function buildGarden(){
    box(20,.3,16,0,-.7,0,mats.dark); // pool below the surrounding footpaths
    for(const x of [-15,15]){box(5,.16,32,x,0,1,mats.stone);for(let z=-13;z<=15;z+=7){cylinder(.12,.16,3.2,x-1.7,1.6,z);cylinder(.12,.16,3.2,x+1.7,1.6,z);}roof(7,34,x,3.2,1);}
    for(const x of [-12,12])for(const z of [-9,9]){const frame=new THREE.Group();frame.position.set(x,1.7,z);scene.add(frame);box(3.5,.18,.22,0,1.7,0,mats.wood,frame);box(3.5,.18,.22,0,-1.7,0,mats.wood,frame);box(.18,3.5,.22,-1.7,0,0,mats.wood,frame);box(.18,3.5,.22,1.7,0,0,mats.wood,frame);}
    pavilion(0,-15,7,6);tree(-5,-6,1.2);tree(6,6,1,true);gate(0,21);
    for(let i=0;i<6;i++){const rock=mesh(new THREE.DodecahedronGeometry(1+rand()),mats.rock,-4+i*1.6,1,-11-rand()*3);rock.scale.y=1.6;}
    const seasons=[0xc3d8d1,0x6d9d78,0xc3904d,0xd2ded7];seasons.forEach((c,i)=>{const cloud=mesh(new THREE.SphereGeometry(1.5,10,8),mat(c,{transparent:true,opacity:.15}),-8+i*5,1,-6);cloud.scale.set(1.5,.3,1);structures.push({object:cloud,chapter:2,task:2,index:i});});
    // A continuous ring walk and a narrow stone crossing leave the pool readable.
    box(24,.15,3,0,0,11,mats.stone);box(24,.15,3,0,0,-10,mats.stone);box(3,.15,21,0,0,0,mats.stone);
}
function buildTulou(){
    const count=40,r=21;
    for(let i=0;i<count;i++){
        const a=i/count*TAU,x=Math.sin(a)*r,z=Math.cos(a)*r;
        if(i===0||i===1||i===count-1)continue;
        const seg=new THREE.Group();seg.position.set(x,0,z);seg.rotation.y=a;scene.add(seg);
        box(3.5,10,3,0,5,0,mats.clay,seg);
        for(let f=0;f<3;f++){
            box(3.6,.2,2.8,0,f*3.2+.1,-2.2,mats.floor,seg);cylinder(.1,.12,3.2,-1.5,f*3.2+1.6,-3.1,mats.wood,seg);
            box(1.1,2,.14,0,f*3.2+1.1,-1.6,mats.dark,seg);box(3.4,.08,.08,0,f*3.2+1,-3.1,mats.wood,seg);
        }
        roof(3.9,7,0,10.1,-1,seg);
        if(i%3===0)lantern(x*.85,1,z*.85,i%2===0,.8);
        structures.push({object:seg,chapter:4,task:Math.floor(i/14),index:i});
    }
    gate(0,22);pavilion(0,0,5,5);for(let i=0;i<12;i++){const a=i*TAU/12;box(1.4,.06,2,Math.sin(a)*9,0,Math.cos(a)*9,mats.stone);}
}
function person(x,y,z,color=0x8eaca5,elder=false){const g=InkHuman.create({color,elder});g.position.set(x,y,z);scene.add(g);return g;}
function buildPlayer(){player=person(...progress.position,0x405f65);player.userData.player=true;
    spirit=new THREE.Group();const orb=mesh(new THREE.SphereGeometry(.18,16,12),mat(0xe0e6ca,{emissive:0x8ec1b3,emissiveIntensity:.8}),0,0,0,spirit);const tail=mesh(new THREE.ConeGeometry(.12,.5,12),mats.lit,0,-.2,0,spirit);tail.rotation.z=.7;spirit.add(new THREE.PointLight(0xa4e0ce,.8,4));scene.add(spirit);spirit.position.copy(player.position).add(v(-1,1.8,0));
}
function buildNodes(){
    config.tasks.forEach((task,ti)=>task.nodes.forEach((node,ai)=>{
        const p=v(...node.pos),g=new THREE.Group();g.position.copy(p);scene.add(g);
        if(node.kind==='person'){scene.remove(g);node.object=person(...node.pos,ti%2?0x9d826b:0x7d9a94,chapterIndex===1);}
        else {node.object=g;
            if(node.kind==='paper'||node.kind==='leaf'){const m=mesh(new THREE.BoxGeometry(.65,.08,.8),node.kind==='leaf'?mats.autumn:mats.paper,0,.7,0,g);m.rotation.z=.1;box(.8,.6,.8,0,.3,0,mats.wood,g);}
            else if(node.kind==='lamp'){const l=lantern(...node.pos,false);scene.remove(g);node.object=l;}
            else if(node.kind==='window'){box(1.8,.15,.3,0,.2,0,mats.wood,g);box(1.8,.15,.3,0,2.1,0,mats.wood,g);box(.15,2.1,.3,-.85,1.15,0,mats.wood,g);box(.15,2.1,.3,.85,1.15,0,mats.wood,g);const pane=mesh(new THREE.PlaneGeometry(1.5,1.7),mat(0x8bab9c,{side:THREE.DoubleSide,transparent:true,opacity:.45}),0,1.15,0,g);}
            else if(node.kind==='stone')mesh(new THREE.DodecahedronGeometry(.65,0),mats.stone,0,.6,0,g);
            else if(node.kind==='wood'){box(1.5,.2,.35,0,.6,0,mats.wood,g);box(.4,.8,.5,0,.3,0,mats.wood,g);}
            else if(node.kind==='tool'){box(.12,.15,1,0,.8,0,mats.wood,g);box(.65,.15,.15,0,.8,-.4,mats.gold,g);}
            else{box(1,.65,.7,0,.35,0,mats.wood,g);box(1.05,.1,.75,0,.7,0,mats.gold,g);}
        }
        const ring=mesh(new THREE.RingGeometry(.46,.5,40),new THREE.MeshBasicMaterial({color:0xedcd85,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}),p.x,p.y+.05,p.z);ring.rotation.x=-PI/2;ring.castShadow=false;
        const beacon=mesh(new THREE.OctahedronGeometry(.12),mats.lit,p.x,p.y+2.25,p.z);beacon.castShadow=false;
        nodes.push({data:node,ti,ai,ring,beacon});
    }));
}
function doneNode(n){return progress.task>n.ti||(progress.task===n.ti&&progress.action>n.ai);}
function activeNode(){return nodes.find(n=>n.ti===progress.task&&n.ai===progress.action);}
function restoreWorld(){
    nodes.forEach(n=>{const done=doneNode(n);n.data.object.visible=!done||['person','window','lamp','wood','stone'].includes(n.data.kind);n.ring.visible=!done;n.beacon.visible=!done;if(done&&n.data.kind==='lamp'){n.data.object.traverse(o=>{if(o.isMesh&&o.material===mats.paper)o.material=mats.lit;});}if(done&&n.data.kind==='window')n.data.object.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry')o.material=mats.lit;});});
    structures.forEach(s=>{if(s.chapter===1){const restored=progress.task>1||(progress.task===1&&progress.action>s.index);s.object.material.opacity=s.deck?(restored?1:.18):(restored?0:.17);}if(s.chapter===2)s.object.material.opacity=progress.task>2?.85:.15;if(s.chapter===4&&progress.task>s.task)s.object.traverse(o=>{if(o.isMesh&&o.material===mats.dark)o.material=mats.lit;});});
    if(chapterIndex===4){lampLights.forEach(l=>l.intensity=.35+progress.task*.23);}
    water.material.uniforms.awaken.value=progress.task/config.tasks.length;
}
function updateHUD(){const task=config.tasks[progress.task];$('questCount').textContent=`${Math.min(progress.task+1,config.tasks.length)} / ${config.tasks.length}`;$('questTitle').textContent=task?task.title:'记忆已经归来';$('questDesc').textContent=task?task.desc:'这段往事已经继续，长卷出口在你身后。';$('questProgress').style.width=`${(progress.task+(task?progress.action/task.nodes.length:0))/config.tasks.length*100}%`;$('questDetail').textContent=task?`本段回声 ${progress.action} / ${task.nodes.length} · ${config.mood}`:'信物与记忆已收入行囊';restoreWorld();}
function modal(id,show){const e=$(id);e.classList.toggle('visible',show);if(show){previousFocus=document.activeElement;const b=e.querySelector('button:not(:disabled),a');if(b)b.focus();}}
function showStory(title,text,callback,speaker='小墨灵 · 建筑的回声'){mode='story';holding=false;hold=0;$('storySpeaker').textContent=speaker;$('storyTitle').textContent=title;$('storyText').innerText=text;storyDone=callback;modal('storyScreen',true);}
function completeNode(){
    const n=activeNode();if(!n)return;
    playTone(540,.13);progress.action++;resultCount++;
    const task=config.tasks[progress.task];
    if(progress.action>=task.nodes.length){const result=task.result;progress.task++;progress.action=0;updateHUD();save();
        showStory(task.title,result,()=>{if(progress.task>=config.tasks.length)finish();else{mode='play';sense=7;cinematic={time:0,duration:reduced?0:1.2};}},'长卷 · 往事继续');
    }else{mode='play';updateHUD();save();sense=4;toast('回声已接续 · '+activeNode().data.label);}
}
function interact(){if(mode!=='play'||!currentTarget)return;const n=currentTarget;if(n!==activeNode())return;
    if(n.data.puzzle){openPuzzle(n.data);return;}
    if(n.data.words)showStory(n.data.label,n.data.words,completeNode,'往事中的人');else completeNode();
}
function openPuzzle(data){
    mode='puzzle';puzzle=data;holding=false;hold=0;
    puzzleState={values:data.puzzle==='rotate'?[1,3,2]:[],picked:[],offset:0,hinted:false};
    $('puzzleType').textContent={rotate:'转墨 · 对齐纹路',frame:'框景 · 寻找视线',sequence:'循迹 · 接续次序'}[data.puzzle];$('puzzleTitle').textContent=data.label;
    $('puzzleDesc').textContent=data.clue||(data.puzzle==='frame'?'调整观看角度，让窗中景物与画上的轮廓重合。':'转动三枚纹片，使顶部的金色记号全部归向上方，接通墨迹。');$('puzzleFeedback').textContent='';
    renderPuzzle();modal('puzzleScreen',true);
}
function renderPuzzle(){const board=$('puzzleBoard');board.replaceChildren();if(puzzle.puzzle==='rotate'){
    (puzzle.symbols||['承','接','合']).forEach((symbol,i)=>{const b=document.createElement('button');b.className='puzzle-piece';b.setAttribute('aria-label',`转动${symbol}纹片`);const rune=document.createElement('span');rune.className='rune';rune.textContent=symbol;rune.style.transform=`rotate(${puzzleState.values[i]*90}deg)`;b.append(rune);const s=document.createElement('small');s.textContent='点击 · 旋转九十度';b.append(s);b.onclick=()=>{puzzleState.values[i]=(puzzleState.values[i]+1)%4;rune.style.transform=`rotate(${puzzleState.values[i]*90}deg)`;playTone(280+i*60,.04);};board.append(b);});
    }else if(puzzle.puzzle==='sequence'){
        const clue=document.createElement('div');clue.className='sequence-clue';clue.textContent=puzzle.clue;board.append(clue);
        const order=puzzle.symbols.map((_,i)=>(i+1)%puzzle.symbols.length).reverse();order.forEach(i=>{const b=document.createElement('button');b.className='puzzle-piece';b.textContent=puzzle.symbols[i];b.setAttribute('aria-label','依次选择'+puzzle.symbols[i]);if(puzzleState.picked.includes(i)){b.classList.add('matched');b.textContent=`${puzzleState.picked.indexOf(i)+1} · ${puzzle.symbols[i]}`;b.disabled=true;}b.onclick=()=>{if(i!==puzzleState.picked.length){$('puzzleFeedback').textContent='这一笔还接不上。已完成的次序会保留，再看看线索。';playTone(140,.07);return;}puzzleState.picked.push(i);$('puzzleFeedback').textContent=`已接通 ${puzzleState.picked.length} / ${puzzle.symbols.length} 段回声`;playTone(300+i*70,.08);renderPuzzle();};board.append(b);});
    }else{
        const wrap=document.createElement('div');wrap.style.cssText='grid-column:1/-1;text-align:center';
        const frame=document.createElement('div');frame.style.cssText='height:160px;border:7px solid #746844;border-radius:80px 80px 5px 5px;position:relative;overflow:hidden;background:linear-gradient(#6d999c,#b3c8b3);margin:0 auto 20px;max-width:400px';
        const ghost=document.createElement('div');ghost.style.cssText='position:absolute;left:50%;top:25px;transform:translateX(-50%);font-size:48px;opacity:.32;color:#fff9db;border:1px dashed #fff9db;padding:12px';ghost.textContent=puzzle.symbol;frame.append(ghost);
        const image=document.createElement('div');image.textContent=puzzle.symbol;image.style.cssText='position:absolute;top:25px;font-size:48px;color:#163d42;padding:12px;transition:left .1s';frame.append(image);
        const range=document.createElement('input');range.type='range';range.min=0;range.max=100;range.value=0;range.setAttribute('aria-label','调整框景视角');range.style.cssText='width:90%;accent-color:#cfbb85';
        function sync(){puzzleState.offset=Number(range.value);image.style.left=`calc(50% + ${(puzzleState.offset-puzzle.target)*2}px)`;image.style.transform='translateX(-50%)';$('puzzleFeedback').textContent=Math.abs(puzzleState.offset-puzzle.target)<=4?'轮廓重合了。现在可以让记忆归位。':'拖动滑块，让实景与浅色画影重合。';}
        range.oninput=sync;sync();wrap.append(frame,range);board.append(wrap);
    }
}
function confirmPuzzle(){if(mode!=='puzzle')return;const success=puzzle.puzzle==='rotate'?puzzleState.values.every(x=>x===0):puzzle.puzzle==='sequence'?puzzleState.picked.length===puzzle.symbols.length:Math.abs(puzzleState.offset-puzzle.target)<=4;
    if(!success){$('puzzleFeedback').textContent='纹路还没有完全接通。可以请小墨灵提示。';return;}modal('puzzleScreen',false);mode='play';completeNode();}
function finish(){
    progress.finished=true;save();const saved=read(MAIN,{}),prefix=completedPrefix(saved);
    if(!prefix.includes(chapter.id)&&prefix.length===chapterIndex)prefix.push(chapter.id);
    saved.completed=prefix;try{localStorage.setItem(MAIN,JSON.stringify(saved));}catch{toast('信物已在本次旅程取得，但浏览器无法保存完成记录。');}
    mode='finish';$('finishTitle').textContent='获得信物 · '+chapter.token;$('finishMemory').textContent='“'+chapter.memory+'”';$('finishDesc').textContent=chapterIndex===4?'五件信物汇入长卷，五处古建恢复色彩与生活声响。主线成就：执笔归来。':chapter.tokenDesc+' 这段记忆已经回到神州长卷。';$('nextChapter').textContent=chapterIndex===4?'执笔归来 · 回到长卷 →':'走向'+chapters[chapterIndex+1].name+' →';modal('finishScreen',true);playTone(660,.8);
}
function walkHeight(x,z,currentY){
    if(chapterIndex===0||chapterIndex===3){
        if(x>8.3&&x<11.6&&z>=-7.7&&z<=7.7)return clamp((7-z)/14,0,1)*4.2;
        if(x< -8.3&&x> -11.6&&z>=-7.7&&z<=7.7)return 4.2+clamp((z+7)/14,0,1)*4.2;
        if(Math.abs(x)<8.5&&Math.abs(z)<8.1)return clamp(Math.round(currentY/4.2),0,2)*4.2;
        if(Math.abs(x)>7.7&&Math.abs(x)<11.6&&Math.abs(z)>6.5&&Math.abs(z)<8.1)return clamp(Math.round(currentY/4.2),0,2)*4.2;
        return 0;
    }
    if(chapterIndex===1&&Math.abs(z)<3.2&&Math.abs(x)<22)return bridgeHeight(x);
    return 0;
}
function canWalk(x,z,oldY){
    if(Math.abs(x)>34||z< -23||z>34)return false;
    if(chapterIndex===4){const r=Math.hypot(x,z);if(r>19.8&&!(Math.abs(x)<3.2&&z>0))return false;}
    if(chapterIndex===2&&Math.abs(x)<10&&Math.abs(z)<8&&Math.abs(x)>2)return false;
    if(obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.28&&oldY+1.4>o.min&&oldY<o.max-.1))return false;
    const h=walkHeight(x,z,oldY);return Math.abs(h-oldY)<.75;
}
function updatePlayer(dt){
    if(player)player.userData.walkSpeed=0;
    if(mode!=='play'||cinematic)return;
    const inputX=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joystick.x;
    const inputZ=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joystick.y;
    let dx=inputX*Math.cos(yaw)+inputZ*Math.sin(yaw),dz=-inputX*Math.sin(yaw)+inputZ*Math.cos(yaw),length=Math.hypot(dx,dz);
    if(length>.1){dx/=Math.max(1,length);dz/=Math.max(1,length);const speed=(keys.ShiftLeft||keys.ShiftRight?7:4)*dt;
        const nextX=player.position.x+dx*speed,nextZ=player.position.z+dz*speed;
        if(canWalk(nextX,player.position.z,player.position.y))player.position.x=nextX;
        if(canWalk(player.position.x,nextZ,player.position.y))player.position.z=nextZ;
        player.position.y=walkHeight(player.position.x,player.position.z,player.position.y);
        const angle=Math.atan2(dx,dz);player.rotation.y+=Math.atan2(Math.sin(angle-player.rotation.y),Math.cos(angle-player.rotation.y))*Math.min(1,dt*12);
        player.userData.walkSpeed=keys.ShiftLeft||keys.ShiftRight?7:4;saveTimer+=dt;if(saveTimer>3){save();saveTimer=0;}
    }
}
function updateCamera(dt){
    if(mode==='portrait'){
        const mobile=innerWidth<600,close=portrait.close,a=player.rotation.y+portrait.angle;
        const target=player.position.clone().add(v(0,close?1.66:1.05,0));
        const d=close?(mobile?1.02:.92):(mobile?3.8:3.1);
        const pos=target.clone().add(v(Math.sin(a)*d,close?.02:.12,Math.cos(a)*d));
        camera.position.lerp(pos,Math.min(1,dt*7));camera.setViewOffset(innerWidth,innerHeight,mobile?0:-innerWidth*.13,mobile?innerHeight*.17:0,innerWidth,innerHeight);camera.lookAt(target);
        if(portraitLight){portraitLight.position.copy(pos).add(v(-.6,.45,.1));portraitLight.target.position.copy(target);}
        return;
    }
    if(camera.view?.enabled)camera.clearViewOffset();
    const target=running?player.position.clone().add(v(0,1.4,0)):v(chapterIndex===1?0:0,chapterIndex===0||chapterIndex===3?5:2,0);
    const d=running?distance:chapterIndex===4?42:36, a=running?yaw:elapsed*.035+.5, p=running?pitch:chapterIndex===4?.68:chapterIndex===2?.6:.42;
    const pos=target.clone().add(v(Math.sin(a)*Math.cos(p)*d,Math.sin(p)*d,Math.cos(a)*Math.cos(p)*d));
    if(cinematic){cinematic.time+=dt;pos.add(v(Math.sin(cinematic.time*2)*.7,.6,1));if(cinematic.time>=cinematic.duration)cinematic=null;}
    camera.position.lerp(pos,Math.min(1,dt*6));camera.lookAt(target);
}
function updateTarget(dt){
    const n=activeNode();currentTarget=null;
    $('interaction').style.display='none';$('marker').style.display='none';
    if(!n||mode!=='play')return;
    const p=v(...n.data.pos),dist=player.position.distanceTo(p),height=Math.abs(player.position.y-p.y);
    $('targetName').textContent=n.data.label;$('targetDistance').textContent=`${Math.round(dist)} 步${height>2?' · '+(p.y>player.position.y?'上层':'下层'):''}`;
    if(dist<2.7&&height<1){currentTarget=n;$('interaction').style.display='block';$('interactionLabel').textContent=n.data.label;}
    if(sense>0||dist<9){const point=p.clone().add(v(0,2.5,0)).project(camera);if(point.z<1&&Math.abs(point.x)<.95&&Math.abs(point.y)<.9){$('marker').style.display='block';$('marker').style.left=(point.x*.5+.5)*innerWidth+'px';$('marker').style.top=(-point.y*.5+.5)*innerHeight+'px';$('markerLabel').textContent=n.data.label;}}
    if(holding&&currentTarget){hold+=dt;$('interactButton').querySelector('circle').style.strokeDashoffset=120*(1-clamp(hold/.65,0,1));if(hold>=.65){holding=false;hold=0;interact();}}else{hold=0;$('interactButton').querySelector('circle').style.strokeDashoffset=120;}
}
function updateEnvironment(dt){
    spirit.visible=mode!=='portrait';
    InkHuman.actors.forEach(actor=>InkHuman.update(actor,dt,elapsed,actor===player?(player.userData.walkSpeed||0):0));
    $('humanAssetStatus').textContent=InkHuman.status==='ready'?'真人扫描面部已加载 · 本地纹理':InkHuman.status==='failed'?'面部资源加载失败，当前显示备用角色':'正在加载真人面部与皮肤细节…';
    const flow=progress.task/config.tasks.length;
    water.material.uniforms.time.value=elapsed*(chapterIndex===0&&progress.task<3?.08:1);
    spirit.position.lerp(player.position.clone().add(v(Math.cos(elapsed*.7)*.9,1.9+Math.sin(elapsed*1.5)*.18,-.4)),Math.min(1,dt*3));
    nodes.forEach(n=>{const active=n===activeNode(),done=doneNode(n);n.ring.material.opacity=done?0:active?.5+Math.sin(elapsed*2)*.2:.1;n.beacon.visible=!done&&(active||sense>0);n.beacon.rotation.y=elapsed;n.beacon.position.y=n.data.pos[1]+2.15+Math.sin(elapsed*2)*.12;});
    effectObjects.forEach(e=>{if(e.type==='dust')e.object.rotation.y=elapsed*.006;if(e.type==='boat'&&progress.task>=3){e.departure=(e.departure||0)+dt;e.object.position.copy(e.origin).add(v(e.departure*.15,Math.sin(elapsed)*.05,-e.departure*.3));}});
    sense=Math.max(0,sense-dt);
    if(trail){const n=activeNode();trail.visible=sense>0&&mode==='play'&&!!n;if(n){const start=player.position.clone().add(v(0,.12,0)),end=v(...n.data.pos).add(v(0,.12,0));const arr=trail.geometry.attributes.position.array;for(let i=0;i<32;i++){const t=i/31;const p=start.clone().lerp(end,t);p.y+=Math.sin(t*PI)*.35;arr[i*3]=p.x;arr[i*3+1]=p.y;arr[i*3+2]=p.z;}trail.geometry.attributes.position.needsUpdate=true;trail.geometry.computeBoundingSphere();trail.material.opacity=.35+Math.sin(elapsed*3)*.15;}}
}
let trail;
function senseWorld(){if(mode!=='play')return;sense=9;const n=activeNode();if(n){const diff=n.data.pos[1]-player.position.y;toast(diff>2?'回声来自上层。沿楼阁两侧的石阶登临。':diff< -2?'回声来自下层。沿两侧石阶返回。':'跟随金色墨光，寻找“'+n.data.label+'”。');}playTone(760,.2);}
function playTone(freq,duration){if(!audioEnabled||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.0001,audio.currentTime);g.gain.exponentialRampToValueAtTime(.06,audio.currentTime+.02);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration+.05);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration+.1);}
async function sound(){
    try{if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();[110,165,220].forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.value=0;o.connect(g).connect(audio.destination);o.start();ambience.push(g);});}await audio.resume();audioEnabled=!audioEnabled;ambience.forEach((g,i)=>g.gain.setTargetAtTime(audioEnabled?.009/(i+1):0,audio.currentTime,.5));$('soundButton').textContent='声音 · '+(audioEnabled?'开':'关');$('soundButton').setAttribute('aria-pressed',audioEnabled);}catch{toast('当前浏览器无法启用声音。');}
}
function pause(){if(!running||!['play','pause'].includes(mode))return;keys={};holding=false;hold=0;joystick={x:0,y:0};if(mode==='pause'){mode='play';modal('pauseScreen',false);}else{mode='pause';save();modal('pauseScreen',true);}}
function openPortrait(){
    if(!['start','play'].includes(mode))return;
    portrait={close:false,angle:0,returnMode:mode};keys={};holding=false;joystick={x:0,y:0};
    if(mode==='start')modal('startScreen',false);else save();
    mode='portrait';document.body.classList.add('is-portrait');
    if(!portraitLight){portraitLight=new THREE.DirectionalLight(0xffedd8,.65);portraitLight.target=new THREE.Object3D();scene.add(portraitLight,portraitLight.target);}portraitLight.visible=true;
    modal('characterScreen',true);
}
function closePortrait(){modal('characterScreen',false);document.body.classList.remove('is-portrait');mode=portrait.returnMode;portraitLight.visible=false;if(mode==='start')modal('startScreen',true);}
function start(){if(!unlocked)return;modal('startScreen',false);document.body.classList.remove('is-intro');running=true;mode='play';sense=7;updateHUD();if(progress.finished){showStory('再听一次回声','这段往事已经完成。你可以继续游览这处墨境，或回到长卷前往下一章。',()=>{mode='play';});}else{toast(chapterIndex===0||chapterIndex===3?'Q 唤起小墨灵 · 沿楼阁两侧石阶可登临上层。':'Q 唤起小墨灵 · 靠近发光物件，按住 E 与它互动。');}}
function input(){
    $('characterButton').onclick=openPortrait;$('startPortrait').onclick=openPortrait;$('closePortrait').onclick=closePortrait;
    $('portraitFull').onclick=()=>portrait.close=false;$('portraitFace').onclick=()=>portrait.close=true;$('portraitRotate').onclick=()=>portrait.angle+=Math.PI/4;
    $('startButton').onclick=start;$('pauseButton').onclick=pause;$('helpButton').onclick=pause;$('resumeButton').onclick=pause;
    $('senseButton').onclick=senseWorld;$('touchSense').onclick=senseWorld;$('soundButton').onclick=sound;
    $('closePuzzle').onclick=()=>{modal('puzzleScreen',false);mode='play';};$('confirmPuzzle').onclick=confirmPuzzle;
    $('puzzleHint').onclick=()=>{$('puzzleFeedback').textContent=puzzle.puzzle==='rotate'?'每枚纹片顶端有金色圆点，把三个圆点都转到十二点方向。':puzzle.puzzle==='sequence'?'依次选择：'+puzzle.symbols.join(' → '):'画影固定在窗中央。移动滑块，使两组轮廓重合，再确认。';};
    $('storyContinue').onclick=()=>{modal('storyScreen',false);const cb=storyDone;storyDone=null;if(cb)cb();};
    $('nextChapter').onclick=()=>location.href=chapterIndex===4?'mainline.html':`journey-3d.html?chapter=${ids[chapterIndex+1]}`;
    document.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&!e.target.matches('input,button,a'))e.preventDefault();if(e.code==='Escape'){if(mode==='portrait')closePortrait();else if(mode==='puzzle')$('closePuzzle').click();else if(mode==='story')$('storyContinue').click();else pause();return;}if(e.code==='KeyC'&&!e.repeat)openPortrait();if(e.code==='KeyQ'&&!e.repeat)senseWorld();if(mode==='play'){keys[e.code]=true;if(e.code==='KeyE'&&!e.repeat)holding=true;}});
    document.addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyE')holding=false;});
    window.addEventListener('blur',()=>{keys={};holding=false;joystick={x:0,y:0};if(mode==='play')pause();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')pause();});
    for(const id of ['interactButton','touchInteract']){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(mode==='play')holding=true;});b.addEventListener('pointerup',()=>holding=false);b.addEventListener('pointercancel',()=>holding=false);}
    renderer.domElement.addEventListener('pointerdown',e=>{if(mode!=='play')return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);});
    renderer.domElement.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.006;pitch=clamp(pitch+(e.clientY-drag.y)*.004,.15,1.25);drag.x=e.clientX;drag.y=e.clientY;});
    renderer.domElement.addEventListener('pointerup',()=>drag=null);renderer.domElement.addEventListener('pointercancel',()=>drag=null);
    renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();distance=clamp(distance+e.deltaY*.008,5,19);},{passive:false});
    const joy=$('joystick'),knob=joy.querySelector('i');let joyId=null;
    function joyMove(e){if(e.pointerId!==joyId)return;const r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,l=Math.max(1,Math.hypot(dx,dy)/35);joystick={x:dx/l/35,y:dy/l/35};knob.style.transform=`translate(${joystick.x*35}px,${joystick.y*35}px)`;}
    joy.onpointerdown=e=>{joyId=e.pointerId;joy.setPointerCapture(e.pointerId);joyMove(e);};joy.onpointermove=joyMove;joy.onpointerup=joy.onpointercancel=()=>{joyId=null;joystick={x:0,y:0};knob.style.transform='';};
    document.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const screen=document.querySelector('.screen.visible');if(!screen)return;const els=[...screen.querySelectorAll('button:not(:disabled),a,input')].filter(b=>b.getClientRects().length),first=els[0],last=els.at(-1);if(!first)return;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
}
function init(){
    if(typeof THREE==='undefined')throw Error('三维引擎文件未能加载');
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,300);renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(pointer:coarse)').matches?1.25:1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;$('world').append(renderer.domElement);
    mats.wood=mat(0x897762,{map:texture('wood')});mats.floor=mat(0xa0957e,{map:texture('wood')});mats.stone=mat(0xaeb9af,{map:texture('stone')});mats.roof=mat(0x77938d,{map:texture('roof'),side:THREE.DoubleSide});mats.red=mat(0x815b4d);mats.gold=mat(0xb9aa76,{metalness:.35,roughness:.5});mats.dark=mat(0x263d40);mats.ground=mat(0x758d78,{map:texture('terrain')});mats.leaves=mat(0x527e6d);mats.autumn=mat(0xc19454);mats.rock=mat(0x6f8580);mats.paper=mat(0xe3d9b8,{side:THREE.DoubleSide});mats.lit=mat(0xf3d590,{emissive:0xecc48a,emissiveIntensity:.8});mats.skin=mat(0xd8bda0);mats.clay=mat(0x9d9275);
    buildWorld();buildPlayer();buildNodes();restoreWorld();updateHUD();clock=new THREE.Clock();
    const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(96),3));trail=new THREE.Line(tg,new THREE.LineBasicMaterial({color:0xf4d893,transparent:true,opacity:.6,depthTest:false}));trail.frustumCulled=false;scene.add(trail);
    input();camera.position.set(28,19,35);$('chapterNumber').textContent=chapter.number+' · '+config.mood;$('chapterName').textContent=chapter.name;$('startTitle').textContent=chapter.name;$('startSubtitle').textContent=chapter.subtitle;$('startStory').textContent=chapter.story;$('startEyebrow').textContent=chapter.number+' · '+chapterGuides[chapterIndex].theme;$('sealText').textContent=config.seal;document.title=chapter.name+' · 墨境探索';
    if(!unlocked){$('startButton').disabled=true;$('startButton').textContent='请先完成上一章';$('startStory').textContent='这段记忆尚未开启。回到神州长卷，接续此前的往事，再来这里。';}
    else if(progress.task||progress.action)$('startButton').textContent=progress.finished?'重游这处墨境 →':'从墨迹中继续 →';
    $('loading').style.display='none';
    if(new URLSearchParams(location.search).get('view')==='character')InkHuman.ready.then(openPortrait);
    window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
    window.addEventListener('pagehide',()=>{if(running)save();});
    // Read-only inspection supports regression checks without exposing a skip/award API.
    window.inkJourney3DDiagnostics=()=>({chapter:chapter.id,task:progress.task,action:progress.action,position:player.position.toArray(),target:activeNode()?.data.label,mode,unlocked,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,frames:frameCount,humanAssets:InkHuman.status,scannedActors:InkHuman.actors.filter(a=>a.userData.scanned).length});
    requestAnimationFrame(loop);
}
function loop(){const dt=Math.min(clock.getDelta(),.045);elapsed+=dt;frameCount++;updatePlayer(dt);updateCamera(dt);updateEnvironment(dt);updateTarget(dt);renderer.render(scene,camera);requestAnimationFrame(loop);}
try{init();}catch(error){$('loading').textContent='暂时无法展开三维墨境：'+error.message+'。请启用浏览器硬件加速后刷新。';const a=document.createElement('a');a.href='mainline.html';a.textContent='返回主线';a.style.color='#e5cf99';$('loading').append(a);console.error(error);}
})();
