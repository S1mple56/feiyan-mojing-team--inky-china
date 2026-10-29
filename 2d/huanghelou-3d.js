'use strict';
var scene,camera,renderer,clock;
var player,playerGroup,playerHead,playerBodyMesh,legL,legR,armL,armR;
var fpCam,tpCam,activeCam;
var isFP=false;
var keys={},game={};
var colliders=[],interactables=[];
var dialogue={active:false,queue:[],index:0,onDone:null};
var toastTimer=null,animTime=0;
var riverMesh,skyMesh,sunMesh,cloudGroup,boatMesh,lightPathGroup;
var envFlow=0,walkPhase=0;
var dustParticles,leafParticles,sparkleSystem;
var mouseDown=false,mouseX=0,mouseY=0;
var yaw=0,pitch=-0.15;
var tpDistance=5.5,tpTargetDist=5.5;
var interactTarget=null;
var particles=[];

function init(){
    scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x2a2018,0.006);
    camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,600);
    renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.1;
    document.body.appendChild(renderer.domElement);
    clock=new THREE.Clock();

    buildSky();
    buildLighting();
    buildGround();
    buildTower();
    buildRiver();
    buildFerry();
    buildScenery();
    buildParticles();
    buildPlayer();
    buildInteractables();
    resetGame();

    window.addEventListener('resize',onResize);
}

function makeCanvasTexture(w,h,drawFn){
    var c=document.createElement('canvas');c.width=w;c.height=h;
    var ctx=c.getContext('2d');drawFn(ctx,w,h);
    var tex=new THREE.CanvasTexture(c);tex.needsUpdate=true;return tex;
}

function buildSky(){
    var skyTex=makeCanvasTexture(512,512,function(ctx,w,h){
        var grad=ctx.createLinearGradient(0,0,0,h);
        grad.addColorStop(0,'#1a1520');grad.addColorStop(0.3,'#2a2030');
        grad.addColorStop(0.55,'#4a3020');grad.addColorStop(0.7,'#6a4020');
        grad.addColorStop(0.85,'#8a5828');grad.addColorStop(1,'#3a2818');
        ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
        for(var i=0;i<200;i++){
            ctx.fillStyle='rgba(240,200,120,'+(Math.random()*0.15)+')';
            ctx.fillRect(Math.random()*w,Math.random()*h*0.4,1,1);
        }
    });
    skyMesh=new THREE.Mesh(new THREE.SphereGeometry(300,32,24),new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide}));
    scene.add(skyMesh);

    var sunGlow=makeCanvasTexture(256,256,function(ctx,w,h){
        var g=ctx.createRadialGradient(w/2,h/2,10,w/2,h/2,w/2);
        g.addColorStop(0,'rgba(255,220,140,1)');g.addColorStop(0.3,'rgba(255,180,80,0.6)');
        g.addColorStop(0.7,'rgba(255,120,40,0.15)');g.addColorStop(1,'rgba(255,100,20,0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    });
    sunMesh=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial({map:sunGlow,transparent:true,depthWrite:false}));
    sunMesh.position.set(80,30,-100);scene.add(sunMesh);

    var sunCore=new THREE.Mesh(new THREE.SphereGeometry(5,16,16),new THREE.MeshBasicMaterial({color:0xffcc70}));
    sunCore.position.set(80,30,-100);scene.add(sunCore);

    cloudGroup=new THREE.Group();
    var cloudTex=makeCanvasTexture(256,64,function(ctx,w,h){
        for(var i=0;i<12;i++){
            var cx=20+i*20+Math.random()*10,cy=20+Math.random()*20,r=12+Math.random()*18;
            var g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);
            g.addColorStop(0,'rgba(180,160,130,0.35)');g.addColorStop(1,'rgba(180,160,130,0)');
            ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
        }
    });
    for(var c=0;c<6;c++){
        var cloud=new THREE.Mesh(new THREE.PlaneGeometry(40+Math.random()*30,10+Math.random()*8),new THREE.MeshBasicMaterial({map:cloudTex,transparent:true,opacity:0.4+Math.random()*0.3,depthWrite:false,side:THREE.DoubleSide}));
        cloud.position.set(-100+c*40,35+Math.random()*15,-120-Math.random()*30);
        cloudGroup.add(cloud);
    }
    scene.add(cloudGroup);
}

function buildLighting(){
    var amb=new THREE.AmbientLight(0x6a5030,0.5);scene.add(amb);
    var sun=new THREE.DirectionalLight(0xf0a850,1.6);
    sun.position.set(80,30,-100);sun.castShadow=true;
    sun.shadow.mapSize.set(4096,4096);
    sun.shadow.camera.left=-60;sun.shadow.camera.right=60;
    sun.shadow.camera.top=60;sun.shadow.camera.bottom=-60;
    sun.shadow.camera.far=300;sun.shadow.bias=-0.0005;
    scene.add(sun);
    var hemi=new THREE.HemisphereLight(0x4a6080,0x3a2a1a,0.35);scene.add(hemi);
    var warm=new THREE.PointLight(0xf0a850,0.3,40);warm.position.set(0,6,0);scene.add(warm);
}

function buildGround(){
    var groundTex=makeCanvasTexture(512,512,function(ctx,w,h){
        ctx.fillStyle='#3a3028';ctx.fillRect(0,0,w,h);
        for(var i=0;i<800;i++){
            var v=Math.random()*30|0;
            ctx.fillStyle='rgb('+(50+v)+','+(42+v)+','+(34+v)+')';
            ctx.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*4,2+Math.random()*4);
        }
        for(var i=0;i<30;i++){
            ctx.strokeStyle='rgba(70,60,50,'+(0.2+Math.random()*0.3)+')';
            ctx.lineWidth=0.5+Math.random();
            ctx.beginPath();ctx.moveTo(Math.random()*w,Math.random()*h);
            ctx.lineTo(Math.random()*w,Math.random()*h);ctx.stroke();
        }
    });
    groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping;groundTex.repeat.set(8,8);
    var ground=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshStandardMaterial({map:groundTex,roughness:0.9,metalness:0}));
    ground.rotation.x=-Math.PI/2;ground.position.y=-0.3;ground.receiveShadow=true;scene.add(ground);
}

function woodMat(color){return new THREE.MeshStandardMaterial({color:color||0x6b5238,roughness:0.75,metalness:0.05})}
function stoneMat(color){return new THREE.MeshStandardMaterial({color:color||0x5a5048,roughness:0.85,metalness:0.02})}
function goldMat(){return new THREE.MeshStandardMaterial({color:0xc8a45b,roughness:0.4,metalness:0.5,emissive:0x4a3820,emissiveIntensity:0.15})}

function box(w,h,d,material,x,y,z,noCollide,rotY){
    var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    m.position.set(x,y,z);if(rotY)m.rotation.y=rotY;
    m.castShadow=true;m.receiveShadow=true;scene.add(m);
    if(!noCollide)colliders.push({min:new THREE.Vector3(x-w/2,y-h/2,z-d/2),max:new THREE.Vector3(x+w/2,y+h/2,z+d/2)});
    return m;
}

function buildTower(){
    var FH=4;
    var pillarMat=woodMat(0x7a5e3a);
    var beamMat=woodMat(0x6b5238);
    var floorMat=woodMat(0x5a4632);
    var wallMat=woodMat(0x4a3828);
    var roofMat=woodMat(0x5a3a22);
    var g=goldMat();

    for(var f=0;f<3;f++){
        var fy=f*FH;
        box(16,0.25,12,floorMat,0,fy,0);
        box(16,0.15,12,beamMat,0,fy+FH-0.15,0,true);
        for(var px=-7;px<=7;px+=3.5){
            var pillar=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.22,FH,8),pillarMat);
            pillar.position.set(px,fy+FH/2,5.5);pillar.castShadow=true;scene.add(pillar);
            colliders.push({min:new THREE.Vector3(px-0.25,fy,5.25),max:new THREE.Vector3(px+0.25,fy+FH,5.75)});
        }
        box(16,0.25,0.25,beamMat,0,fy+FH-0.4,5.5,true);
        box(0.3,FH,12,wallMat,-7.8,fy+FH/2,0);
        box(0.3,FH,12,wallMat,7.8,fy+FH/2,0);
        box(16,FH,0.3,wallMat,0,fy+FH/2,-5.8);
        for(var rx=-7;rx<=7;rx+=1.2){
            var bal=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.7,6),beamMat);
            bal.position.set(rx,fy+0.55,5.5);scene.add(bal);
        }
        box(16,0.08,0.08,g,0,fy+0.9,5.5,true);
        box(16,0.08,0.08,g,0,fy+0.25,5.5,true);
    }

    for(var f=0;f<3;f++){
        var ey=f*FH+FH;
        var eave=new THREE.Mesh(new THREE.BoxGeometry(18,0.15,14),roofMat);
        eave.position.set(0,ey,0);eave.castShadow=true;scene.add(eave);
        var eave2=new THREE.Mesh(new THREE.BoxGeometry(19,0.1,15),roofMat);
        eave2.position.set(0,ey+0.12,0);scene.add(eave2);
        for(var bx=-7;bx<=7;bx+=1.75){
            var bracket=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.4,0.6),beamMat);
            bracket.position.set(bx,ey+0.2,6.2);scene.add(bracket);
        }
    }

    var roofShape=new THREE.ConeGeometry(13,5,4);
    var roof=new THREE.Mesh(roofShape,roofMat);
    roof.position.set(0,14.5,0);roof.rotation.y=Math.PI/4;roof.castShadow=true;scene.add(roof);
    var roofTrim=new THREE.Mesh(new THREE.ConeGeometry(13.5,0.3,4),g);
    roofTrim.position.set(0,12.2,0);roofTrim.rotation.y=Math.PI/4;scene.add(roofTrim);
    var spire=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.2,2.5,8),g);
    spire.position.set(0,18,0);scene.add(spire);
    var spireOrb=new THREE.Mesh(new THREE.SphereGeometry(0.2,8,8),g);
    spireOrb.position.set(0,19.3,0);scene.add(spireOrb);

    for(var i=0;i<3;i++){
        var lan=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,8),new THREE.MeshStandardMaterial({color:0xf0c060,emissive:0xc8a45b,emissiveIntensity:0.5}));
        lan.position.set(-5+i*5,FH-0.8,5.2);scene.add(lan);
    }

    var stairMat=woodMat(0x6b5238);
    for(var s=0;s<2;s++){
        var sy=s*FH;
        for(var i=0;i<8;i++){
            var sm=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.12,1.2),stairMat);
            sm.position.set(-5+i*0.5,sy+i*0.5,4);sm.castShadow=true;scene.add(sm);
            var srail=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.06,0.06),g);
            srail.position.set(-5+i*0.5,sy+i*0.5+0.7,3.4);scene.add(srail);
        }
    }
}

function buildRiver(){
    var riverGeo=new THREE.PlaneGeometry(300,80,60,20);
    var riverMat=new THREE.MeshStandardMaterial({color:0x2a4050,roughness:0.15,metalness:0.3,transparent:true,opacity:0.85});
    riverMesh=new THREE.Mesh(riverGeo,riverMat);
    riverMesh.rotation.x=-Math.PI/2;riverMesh.position.set(40,-0.15,-50);scene.add(riverMesh);
    riverMesh.userData.origPos=riverGeo.attributes.position.array.slice();
}

function buildFerry(){
    var dockMat=woodMat(0x5a4632);
    box(12,0.3,4,dockMat,35,0.1,-15);
    for(var i=0;i<6;i++){
        var post=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,2,6),dockMat);
        post.position.set(30+i*2,-0.5,-13);scene.add(post);
        post.position.y=-0.5;
    }
    box(12,0.06,0.06,goldMat(),35,0.5,-13,true);
    box(12,0.06,0.06,goldMat(),35,0.5,-17,true);

    boatMesh=new THREE.Group();
    var hullShape=new THREE.Shape();
    hullShape.moveTo(-3,0);hullShape.lineTo(3,0);hullShape.lineTo(2.5,0.8);hullShape.lineTo(-2.5,0.8);hullShape.closePath();
    var hull=new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape,{depth:1.5,bevelEnabled:true,bevelThickness:0.1,bevelSize:0.1}),woodMat(0x4a3828));
    hull.rotation.x=-Math.PI/2;hull.position.set(0,0.2,-0.75);boatMesh.add(hull);
    var mast=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,5,6),woodMat(0x6b5238));
    mast.position.set(0,3,0);boatMesh.add(mast);
    var sailShape=new THREE.Shape();
    sailShape.moveTo(0,0);sailShape.lineTo(2.5,1.5);sailShape.lineTo(0,4);sailShape.closePath();
    var sail=new THREE.Mesh(new THREE.ShapeGeometry(sailShape),new THREE.MeshStandardMaterial({color:0xead9b7,roughness:0.9,side:THREE.DoubleSide,transparent:true,opacity:0.9}));
    sail.position.set(0.1,1,0);boatMesh.add(sail);
    boatMesh.position.set(45,0,-40);scene.add(boatMesh);

    lightPathGroup=new THREE.Group();scene.add(lightPathGroup);
    for(var i=0;i<20;i++){
        var lp=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6),new THREE.MeshBasicMaterial({color:0xf0d38b,transparent:true,opacity:0}));
        var t=i/19;
        lp.position.set(8+t*30,0.1+Math.sin(t*Math.PI)*0.3,5-t*20);
        lightPathGroup.add(lp);
    }
}

function buildScenery(){
    var mtnMat=new THREE.MeshStandardMaterial({color:0x2a3040,roughness:1,metalness:0});
    for(var i=0;i<8;i++){
        var h=8+Math.random()*15;
        var mtn=new THREE.Mesh(new THREE.ConeGeometry(8+Math.random()*8,h,5),mtnMat);
        mtn.position.set(-40+i*22,h/2-2,-80-Math.random()*30);
        scene.add(mtn);
    }
    var treeMat=woodMat(0x3a4a30);
    for(var i=0;i<12;i++){
        var trunk=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.2,3,6),woodMat(0x4a3828));
        var tx=-15+Math.random()*25,tz=-20+Math.random()*10;
        trunk.position.set(tx,1.5,tz);scene.add(trunk);
        var canopy=new THREE.Mesh(new THREE.SphereGeometry(1.2+Math.random()*0.8,8,8),treeMat);
        canopy.position.set(tx,3.5,tz);canopy.scale.y=0.7;scene.add(canopy);
    }
}

function buildParticles(){
    var dustGeo=new THREE.BufferGeometry();
    var dustCount=500,dustPos=new Float32Array(dustCount*3);
    for(var i=0;i<dustCount;i++){
        dustPos[i*3]=(Math.random()-0.5)*60;dustPos[i*3+1]=Math.random()*15;dustPos[i*3+2]=(Math.random()-0.5)*40;
    }
    dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
    var dustTex=makeCanvasTexture(32,32,function(ctx,w,h){
        var g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
        g.addColorStop(0,'rgba(240,200,130,0.8)');g.addColorStop(1,'rgba(240,200,130,0)');
        ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    });
    dustParticles=new THREE.Points(dustGeo,new THREE.PointsMaterial({map:dustTex,size:0.15,transparent:true,opacity:0.5,depthWrite:false}));
    scene.add(dustParticles);

    var leafGeo=new THREE.BufferGeometry();
    var leafCount=30,leafPos=new Float32Array(leafCount*3);
    for(var i=0;i<leafCount;i++){
        leafPos[i*3]=(Math.random()-0.5)*30;leafPos[i*3+1]=2+Math.random()*8;leafPos[i*3+2]=(Math.random()-0.5)*20;
    }
    leafGeo.setAttribute('position',new THREE.BufferAttribute(leafPos,3));
    leafParticles=new THREE.Points(leafGeo,new THREE.PointsMaterial({color:0xc8a45b,size:0.12,transparent:true,opacity:0.6,depthWrite:false}));
    scene.add(leafParticles);
}

var CHAR_PALETTE=[0xe8e4d8,0x8ba8a0,0x3a4a5a,0xc8a0a8,0xc8a850,0x8a3030,0x5a4060,0x8a9a60,0x9a8a50,0x2a2520,0xb84030,0x6a8a60,0xd8c8a0,0x305080,0x8a6040,0x3a3a48,0xe0a8a0,0x80b0a8];
var CHAR_SKIN=[0xf0d8b8,0xe0c4a0,0xc8a880];
var CHAR_HAIR=[0x1a1510,0x3a2818,0x8a8078,0x6a3028];
var charCfg={bodyType:1,faceType:1,skinTone:1,hairStyle:0,hairColor:0,topStyle:0,topColor:0,bottomStyle:0,bottomColor:14,beltStyle:0,beltColor:8,accessory:0,shoeStyle:0};
try{var s=JSON.parse(localStorage.getItem('inkCharacterConfig')||'null');if(s)Object.keys(s).forEach(function(k){if(k in charCfg)charCfg[k]=s[k]})}catch(e){}

function buildPlayer(){
    playerGroup=new THREE.Group();
    var cs=charCfg.bodyType===0?0.85:charCfg.bodyType===2?1.15:1;
    var skinMat=new THREE.MeshStandardMaterial({color:CHAR_SKIN[charCfg.skinTone]||0xf0d8b0,roughness:0.7});
    var hairMat=new THREE.MeshStandardMaterial({color:CHAR_HAIR[charCfg.hairColor]||0x2a2018,roughness:0.9});
    var robeMat=new THREE.MeshStandardMaterial({color:CHAR_PALETTE[charCfg.topColor]||0xead9b7,roughness:0.85});
    var botMat=new THREE.MeshStandardMaterial({color:CHAR_PALETTE[charCfg.bottomColor]||0x8a6040,roughness:0.85});
    var trimMat=new THREE.MeshStandardMaterial({color:CHAR_PALETTE[charCfg.beltColor]||0xc8a45b,roughness:0.5,metalness:0.3});

    playerBodyMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.4,1.2,8),robeMat);
    playerBodyMesh.position.y=0.8;playerBodyMesh.castShadow=true;playerGroup.add(playerBodyMesh);
    var belt=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.08,8),trimMat);
    belt.position.y=1.1;playerGroup.add(belt);
    playerHead=new THREE.Mesh(new THREE.SphereGeometry(0.2,12,12),skinMat);
    playerHead.position.y=1.65;playerHead.castShadow=true;playerGroup.add(playerHead);
    var hairTop=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,6,0,Math.PI*2,0,Math.PI/2),hairMat);
    hairTop.position.y=1.68;playerGroup.add(hairTop);
    var bun=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,8),hairMat);
    bun.position.set(0,1.9,0);playerGroup.add(bun);
    legL=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.06,0.6,6),robeMat);
    legL.position.set(-0.12,0.3,0);playerGroup.add(legL);
    legR=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.06,0.6,6),robeMat);
    legR.position.set(0.12,0.3,0);playerGroup.add(legR);
    armL=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.05,0.7,6),robeMat);
    armL.position.set(-0.35,0.9,0);armL.rotation.z=0.15;playerGroup.add(armL);
    armR=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.05,0.7,6),robeMat);
    armR.position.set(0.35,0.9,0);armR.rotation.z=-0.15;playerGroup.add(armR);
    scene.add(playerGroup);

    fpCam=new THREE.PerspectiveCamera(65,window.innerWidth/window.innerHeight,0.1,600);
    tpCam=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.1,600);
    activeCam=tpCam;
}

function addInteractable(id,label,pos,type,idx){
    var geo,mesh;
    if(type==='fragment'){
        geo=new THREE.PlaneGeometry(0.5,0.7);
        mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0xead9b7,roughness:0.9,side:THREE.DoubleSide,emissive:0x4a3820,emissiveIntensity:0.1}));
    }else if(type==='window'){
        geo=new THREE.PlaneGeometry(1.8,2.2);
        mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x1a1510,roughness:0.9,side:THREE.DoubleSide}));
    }else if(type==='npc'){
        mesh=new THREE.Group();
        var bodyM=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.42,1.3,8),new THREE.MeshStandardMaterial({color:0x3a3020,roughness:0.85}));
        bodyM.position.y=0.8;bodyM.castShadow=true;mesh.add(bodyM);
        var headM=new THREE.Mesh(new THREE.SphereGeometry(0.2,10,10),new THREE.MeshStandardMaterial({color:0xf0d8b0,roughness:0.7}));
        headM.position.y=1.7;mesh.add(headM);
        var hairM=new THREE.Mesh(new THREE.SphereGeometry(0.22,10,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x2a2018}));
        hairM.position.y=1.73;mesh.add(hairM);
    }else{
        geo=new THREE.CylinderGeometry(0.06,0.06,0.4,8);
        mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x8a6d3f,roughness:0.6,emissive:0x4a3820,emissiveIntensity:0.2}));
    }
    mesh.position.copy(pos);scene.add(mesh);
    var glowMat=new THREE.MeshBasicMaterial({color:0xf0d38b,transparent:true,opacity:0.4,depthWrite:false});
    var glow=new THREE.Mesh(new THREE.SphereGeometry(0.25,12,12),glowMat);
    glow.position.copy(pos);glow.position.y+=1;scene.add(glow);
    var ring=new THREE.Mesh(new THREE.RingGeometry(0.3,0.35,32),new THREE.MeshBasicMaterial({color:0xf0d38b,transparent:true,opacity:0.3,side:THREE.DoubleSide,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;ring.position.copy(pos);ring.position.y=0.05;scene.add(ring);
    interactables.push({id:id,label:label,pos:pos.clone(),type:type,idx:idx,mesh:mesh,glow:glow,ring:ring,collected:false,origColor:type==='window'?0x1a1510:null});
}

function buildInteractables(){
    addInteractable('wall','题壁',new THREE.Vector3(-6,2,5.4),'fragment',0);
    addInteractable('screen','屏风',new THREE.Vector3(2,6,-3),'fragment',1);
    addInteractable('railing','栏杆',new THREE.Vector3(6,9.5,5.3),'fragment',2);
    addInteractable('win_tree','树影窗',new THREE.Vector3(7.65,2,0),'window',0);
    addInteractable('win_sail','帆影窗',new THREE.Vector3(7.65,6,0),'window',1);
    addInteractable('win_twilight','暮色窗',new THREE.Vector3(7.65,10,0),'window',2);
    addInteractable('sender','送行人',new THREE.Vector3(32,0,-13),'npc',0);
    addInteractable('traveler','旅人',new THREE.Vector3(38,0,-15),'npc',1);
    addInteractable('lamp','岸灯',new THREE.Vector3(36,0,-11),'lamp',0);
}

function resetGame(){
    keys={};game={running:false,task:0,fragments:[false,false,false],windows:[false,false,false],
        ferryReached:false,blessingRead:false,letterGiven:false,lampLit:false,
        nearObj:null};
    playerGroup.position.set(0,0.2,2);playerGroup.rotation.y=0;
    isFP=false;activeCam=tpCam;yaw=0;pitch=-0.15;
    document.getElementById('crosshair').style.display='none';
    interactables.forEach(function(it){it.collected=false;it.mesh.visible=true;it.glow.visible=true;it.ring.visible=true;
        if(it.type==='window')it.mesh.material.color.setHex(it.origColor)});
    lightPathGroup.children.forEach(function(lp){lp.material.opacity=0});
    if(boatMesh){boatMesh.position.set(45,0,-40);boatMesh.rotation.y=0}
}

function startGame(){
    resetGame();game.running=true;
    document.getElementById('start-screen').classList.add('hide');
    document.getElementById('hud').style.display='block';
    document.getElementById('task-panel').style.display='block';
    document.getElementById('top-actions').style.display='flex';
    document.getElementById('view-btn').style.display='block';
    updateTaskPanel();
    toast('你在黄鹤楼底层醒来，暮色将尽。',3500);
}

function updateTaskPanel(){
    var titles=['任务一 · 读回信件','任务二 · 找到渡口','任务三 · 完成告别','本章完成'];
    var descs=['在题壁、屏风和栏杆旁找到三片信纸。','按顺序打开三扇窗：树影 → 帆影 → 暮色。','循光路来到渡口，完成告别。','告别已完成。'];
    var goals=['寻找信纸','打开窗景','完成告别','已完成'];
    var t=Math.min(game.task,3);
    document.getElementById('tp-title').textContent=titles[t];
    document.getElementById('tp-desc').textContent=descs[t];
    document.getElementById('hud-goal').textContent=goals[t];
    document.getElementById('hud-fragments').textContent=game.fragments.filter(Boolean).length+' / 3';
    document.getElementById('hud-windows').textContent=game.windows.filter(Boolean).length+' / 3';
}

function toast(msg,dur){
    var el=document.getElementById('toast');el.textContent=msg;el.style.display='block';
    clearTimeout(toastTimer);toastTimer=setTimeout(function(){el.style.display='none'},dur||2800);
}
function startDialogue(lines,onDone){
    dialogue.active=true;dialogue.queue=lines;dialogue.index=0;dialogue.onDone=onDone||null;
    showDialogueLine();document.getElementById('dialogue-box').style.display='block';
}
function showDialogueLine(){
    if(dialogue.index>=dialogue.queue.length){
        dialogue.active=false;document.getElementById('dialogue-box').style.display='none';
        if(dialogue.onDone){var cb=dialogue.onDone;dialogue.onDone=null;cb()}return;
    }
    document.getElementById('dialogue-speaker').textContent=dialogue.queue[dialogue.index][0];
    document.getElementById('dialogue-text').textContent=dialogue.queue[dialogue.index][1];
}
function advanceDialogue(){if(!dialogue.active)return;dialogue.index++;showDialogueLine()}
function toggleView(){
    isFP=!isFP;activeCam=isFP?fpCam:tpCam;
    document.getElementById('crosshair').style.display=isFP?'block':'none';
    toast(isFP?'第一人称视角':'第三人称视角',1200);
}

function getPlayerFloor(){return playerGroup.position.y>6?2:playerGroup.position.y>2?1:0}

function checkCollide(np){
    var r=0.35;
    for(var i=0;i<colliders.length;i++){
        var c=colliders[i];
        if(np.x+r>c.min.x&&np.x-r<c.max.x&&np.z+r>c.min.z&&np.z-r<c.max.z&&np.y+0.1>c.min.y&&np.y+1.7<c.max.y)return true;
    }
    return false;
}

function spawnSparkle(pos,color){
    for(var i=0;i<8;i++){
        var sp=new THREE.Mesh(new THREE.SphereGeometry(0.05,4,4),new THREE.MeshBasicMaterial({color:color||0xf0d38b,transparent:true,opacity:1}));
        sp.position.copy(pos);
        var vx=(Math.random()-0.5)*3,vy=Math.random()*2+1,vz=(Math.random()-0.5)*3;
        scene.add(sp);
        particles.push({mesh:sp,vx:vx,vy:vy,vz:vz,life:1});
    }
}

function updateParticles(dt){
    for(var i=particles.length-1;i>=0;i--){
        var p=particles[i];
        p.mesh.position.x+=p.vx*dt;p.mesh.position.y+=p.vy*dt;p.mesh.position.z+=p.vz*dt;
        p.vy-=dt*3;p.life-=dt*1.5;
        p.mesh.material.opacity=Math.max(0,p.life);
        if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1)}
    }
}

function updatePlayer(dt){
    if(!game.running||dialogue.active)return;
    var speed=5.5;
    var forward=new THREE.Vector3();activeCam.getWorldDirection(forward);forward.y=0;forward.normalize();
    var right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0)).normalize();
    var move=new THREE.Vector3();
    if(keys.KeyW||keys.ArrowUp)move.add(forward);
    if(keys.KeyS||keys.ArrowDown)move.sub(forward);
    if(keys.KeyA||keys.ArrowLeft)move.sub(right);
    if(keys.KeyD||keys.ArrowRight)move.add(right);
    var isMoving=move.lengthSq()>0;
    if(isMoving){
        move.normalize().multiplyScalar(speed*dt);
        var np=playerGroup.position.clone().add(move);np.y=playerGroup.position.y;
        if(!checkCollide(np)){playerGroup.position.copy(np)}
        var targetRot=Math.atan2(move.x,move.z);
        var diff=targetRot-playerGroup.rotation.y;
        while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
        playerGroup.rotation.y+=diff*Math.min(1,dt*10);
        walkPhase+=dt*8;
        legL.rotation.x=Math.sin(walkPhase)*0.4;legR.rotation.x=Math.sin(walkPhase+Math.PI)*0.4;
        armL.rotation.x=Math.sin(walkPhase+Math.PI)*0.3;armR.rotation.x=Math.sin(walkPhase)*0.3;
        playerBodyMesh.position.y=0.8+Math.sin(walkPhase*2)*0.02;
    }else{
        legL.rotation.x*=0.9;legR.rotation.x*=0.9;armL.rotation.x*=0.9;armR.rotation.x*=0.9;
    }
    var pf=getPlayerFloor();var targetY=pf*4+0.2;
    playerGroup.position.y+=(targetY-playerGroup.position.y)*Math.min(1,dt*5);
}

function updateInteraction(){
    if(!game.running||dialogue.active){game.nearObj=null;document.getElementById('interact-prompt').style.display='none';return}
    var near=null,minDist=3.5;
    for(var i=0;i<interactables.length;i++){
        var it=interactables[i];
        if(it.collected)continue;
        if(it.type==='window'&&game.task!==1)continue;
        if(it.type==='window'&&it.idx!==game.windows.filter(Boolean).length)continue;
        if(it.type==='npc'&&game.task<2)continue;
        if(it.type==='lamp'&&game.task<2)continue;
        var d=playerGroup.position.distanceTo(it.pos);
        if(d<minDist){minDist=d;near=it}
    }
    game.nearObj=near;
    var prompt=document.getElementById('interact-prompt');
    if(near){
        var verbs={fragment:'拾取',window:'开窗',npc:'交谈',lamp:'点灯'};
        prompt.textContent=verbs[near.type]+'：'+near.label;
        prompt.style.display='block';
        near.glow.material.opacity=0.7+Math.sin(animTime*4)*0.2;
        near.ring.material.opacity=0.4+Math.sin(animTime*3)*0.15;
        near.ring.scale.setScalar(1+Math.sin(animTime*3)*0.1);
    }else{prompt.style.display='none'}
    interactables.forEach(function(it){
        if(it!==near&&!it.collected){
            it.glow.material.opacity=0.15+Math.sin(animTime*2+it.idx*2)*0.08;
            it.ring.material.opacity=0.1;
            it.ring.scale.setScalar(1);
        }
    });
}

function interact(){
    if(dialogue.active){advanceDialogue();return}
    var it=game.nearObj;if(!it)return;
    if(it.type==='fragment'){
        if(game.task!==0){toast('信纸已经拼合完成。',1500);return}
        if(game.fragments[it.idx])return;
        game.fragments[it.idx]=true;it.collected=true;it.mesh.visible=false;it.glow.visible=false;it.ring.visible=false;
        spawnSparkle(it.pos,0xead9b7);
        var names=['题壁上的信纸','屏风后的信纸','栏杆旁的信纸'];
        var count=game.fragments.filter(Boolean).length;
        startDialogue([['执笔人','拾起了'+names[it.idx]+'。字迹借着夕照浮现……'],['小墨灵','（凑近看）这片纸上画着一处江景！']],function(){
            if(count===3){
                toast('三片信纸拼合完成！近岸树影 → 远处帆影 → 江面暮色。',3500);
                startDialogue([['执笔人','信件拼合完成：近岸树影 → 远处帆影 → 江面暮色。'],['小墨灵','信末还有一句未送出的祝愿……原来如此。'],['小墨灵','接下来按顺序打开三扇窗：先树影，再帆影，最后暮色。']],function(){game.task=1;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(it.type==='window'){
        if(game.task!==1){toast('先找到三片信纸。',1500);return}
        if(game.windows[it.idx])return;
        var expected=game.windows.filter(Boolean).length;
        if(it.idx!==expected){toast('顺序不对。信中写着：先近岸树影，再远处帆影，最后江面暮色。',3000);return}
        game.windows[it.idx]=true;
        var winColors=[0x779764,0xbbd2d2,0xcb8250];
        it.mesh.material.color.setHex(winColors[it.idx]);
        it.mesh.material.emissive=new THREE.Color(winColors[it.idx]);
        it.mesh.material.emissiveIntensity=0.15;
        spawnSparkle(it.pos,winColors[it.idx]);
        var wNames=['树影窗','帆影窗','暮色窗'];
        var wDescs=['窗外：近岸的树影在风中摇曳，江水缓缓流动。','窗外：远处的帆影点点，一艘船正要离岸。','窗外：横在江面的暮色铺展开来，渡口的轮廓隐约可见。'];
        startDialogue([['执笔人','打开了'+wNames[it.idx]+'。'],['小墨灵',wDescs[it.idx]]],function(){
            if(game.windows.every(Boolean)){
                lightPathGroup.children.forEach(function(lp,i){lp.material.opacity=0.6+Math.sin(i)*0.2});
                toast('三扇窗连成光路！渡口显现。',3500);
                startDialogue([['小墨灵','三扇窗的光连成一条路……通向江边的渡口！'],['执笔人','下楼吧，循着光走。']],function(){game.task=2;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(it.type==='npc'&&it.id==='sender'){
        if(game.task!==2)return;
        if(game.blessingRead){toast('把信交给旅人吧。',1500);return}
        game.blessingRead=true;
        startDialogue([
            ['送行人','你……你是谁？别过来。'],['执笔人','我是一名执笔人。我看到你一直望着渡口。'],
            ['送行人','那封信……我写好了，却始终送不出去。'],['小墨灵','为什么？'],
            ['送行人','……我怕。怕这封信送出去以后，他就再也不会回来了。'],
            ['执笔人','可是，不送出这封信，他就永远不会知道你的心意。'],
            ['小墨灵','先把信末的祝愿读给他听吧。也许读出来，你就不怕了。'],
            ['送行人','（沉默）……祝愿……我写的是："你往前走，我会记得这一程。"'],
            ['执笔人','说出来吧。把这封信交给旅人。'],['送行人','（深吸一口气）好。']
        ],function(){toast('送行人终于说出了祝愿。把信交给旅人吧。',3000);updateTaskPanel()});
    }
    else if(it.type==='npc'&&it.id==='traveler'){
        if(game.task!==2||!game.blessingRead){toast('先和送行人谈谈。',1500);return}
        if(game.letterGiven){toast('信已经交给旅人了。',1500);return}
        game.letterGiven=true;
        startDialogue([['旅人','这是……给我的信？'],['执笔人','是的。他一直想送给你，却害怕你不再回来。'],['旅人','（读信）"你往前走，我会记得这一程。"……'],['旅人','这份祝愿，我会带在身边。请替我谢谢他。'],['小墨灵','信送到了……渡口的岸灯还没有点亮。'],['执笔人','点亮岸灯，让这一程继续吧。']],function(){toast('信已送达。点亮岸灯。',2500);updateTaskPanel()});
    }
    else if(it.type==='lamp'){
        if(game.task!==2||!game.letterGiven){toast('先完成送信。',1500);return}
        if(game.lampLit){toast('船灯已经点亮。',1500);return}
        game.lampLit=true;
        it.mesh.material.emissive=new THREE.Color(0xffe28b);it.mesh.material.emissiveIntensity=0.8;
        var lampLight=new THREE.PointLight(0xffe28b,2,15);lampLight.position.copy(it.pos);lampLight.position.y+=1;scene.add(lampLight);
        spawnSparkle(it.pos,0xffe28b);
        startDialogue([['执笔人','点亮了船灯。'],['送行人','你往前走，我会记得这一程。'],['（环境）','江水开始流动，风声渐起。船离岸，暮色中的光路缓缓消散。'],['小墨灵','楼不是为了把人留下。']],function(){completeChapter()});
    }
}

function updateCamera(dt){
    var p=playerGroup.position;
    if(isFP){
        fpCam.position.set(p.x,p.y+1.65,p.z);
        var euler=new THREE.Euler(pitch,yaw,0,'YXZ');
        fpCam.quaternion.setFromEuler(euler);
    }else{
        var euler=new THREE.Euler(pitch,yaw,0,'YXZ');
        var offset=new THREE.Vector3(0,0,tpDistance);
        offset.applyEuler(euler);
        var camPos=p.clone().add(offset);camPos.y+=1.5;
        camPos.y=Math.max(camPos.y,0.5);
        tpCam.position.lerp(camPos,Math.min(1,dt*6));
        tpCam.lookAt(p.x,p.y+1.5,p.z);
    }
}

function updateEnvironment(dt){
    var target=game.lampLit?1:0;
    envFlow+=(target-envFlow)*Math.min(1,dt*0.3);
    if(riverMesh){
        var pos=riverMesh.geometry.attributes.position;
        var orig=riverMesh.userData.origPos;
        for(var i=0;i<pos.count;i++){
            var ox=orig[i*3],oy=orig[i*3+1];
            pos.setZ(i,Math.sin(ox*0.08+animTime*(0.3+envFlow*1.8))*0.2*(0.15+envFlow*0.85)+Math.cos(oy*0.1+animTime*0.2)*0.12*(0.15+envFlow*0.85));
        }
        pos.needsUpdate=true;riverMesh.geometry.computeVertexNormals();
    }
    if(cloudGroup){
        cloudGroup.children.forEach(function(cloud,i){
            cloud.position.x+=dt*(0.15+envFlow*1.2)*(i%2===0?1:-0.7);
            if(cloud.position.x>150)cloud.position.x=-150;
            if(cloud.position.x<-150)cloud.position.x=150;
        });
    }
    if(boatMesh&&game.lampLit){
        boatMesh.position.x+=dt*1.5;boatMesh.position.z-=dt*0.3;
        boatMesh.position.y=Math.sin(animTime*1.2)*0.1*envFlow;
        boatMesh.rotation.z=Math.sin(animTime*0.8)*0.02*envFlow;
    }
    if(lightPathGroup){
        lightPathGroup.children.forEach(function(lp,i){
            if(game.lampLit){lp.material.opacity*=Math.max(0,1-dt*0.4)}
            else{lp.material.opacity=0.3+Math.sin(animTime*2+i*0.5)*0.2}
        });
    }
    if(dustParticles){
        var dp=dustParticles.geometry.attributes.position;
        for(var i=0;i<dp.count;i++){
            var y=dp.getY(i);y+=dt*(0.1+envFlow*0.3);
            if(y>15)y=0;dp.setY(i,y);
            dp.setX(i,dp.getX(i)+Math.sin(animTime*0.5+i)*dt*0.1);
        }
        dp.needsUpdate=true;
    }
    if(leafParticles){
        var lp2=leafParticles.geometry.attributes.position;
        for(var i=0;i<lp2.count;i++){
            var x=lp2.getX(i)+dt*(0.2+envFlow*0.8);var y=lp2.getY(i)-dt*0.1;
            if(x>20)x=-20;if(y<0)y=8+Math.random()*4;
            lp2.setX(i,x);lp2.setY(i,y);
        }
        lp2.needsUpdate=true;
    }
}

function completeChapter(){
    try{
        var saved=JSON.parse(localStorage.getItem('inkJourneyProgressV1')||'{}');
        if(!Array.isArray(saved.completed))saved.completed=[];
        if(saved.completed.indexOf('yellow-crane')===-1)saved.completed.push('yellow-crane');
        localStorage.setItem('inkJourneyProgressV1',JSON.stringify(saved));
    }catch(e){}
    document.getElementById('hud').style.display='none';
    document.getElementById('task-panel').style.display='none';
    document.getElementById('interact-prompt').style.display='none';
    document.getElementById('view-btn').style.display='none';
    document.getElementById('result-title').textContent='获得信物 · 鹤羽';
    document.getElementById('result-detail').innerHTML='一枚墨色鹤羽落在空白信封上，化为信物。<br><br><strong style="color:#f0d38b">小墨灵："楼不是为了把人留下。"</strong><br><br>第一段记忆已恢复。回到主线，继续下一段旅程。';
    document.getElementById('result-modal').classList.add('show');
}

function update(){
    var dt=Math.min(0.05,clock.getDelta());
    animTime+=dt;
    if(game.running){
        updatePlayer(dt);updateCamera(dt);updateInteraction();updateEnvironment(dt);updateParticles(dt);
    }
    renderer.render(scene,activeCam);
    requestAnimationFrame(update);
}

function onResize(){
    camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();
    fpCam.aspect=window.innerWidth/window.innerHeight;fpCam.updateProjectionMatrix();
    tpCam.aspect=window.innerWidth/window.innerHeight;tpCam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
}

document.addEventListener('keydown',function(e){
    keys[e.code]=true;
    if(e.code==='KeyE'||e.code==='Space'){e.preventDefault();interact()}
    if(e.code==='KeyV')toggleView();
});
document.addEventListener('keyup',function(e){keys[e.code]=false});

document.addEventListener('mousedown',function(e){
    if(e.target===renderer.domElement){mouseDown=true;mouseX=e.clientX;mouseY=e.clientY}
});
document.addEventListener('mouseup',function(){mouseDown=false});
document.addEventListener('mousemove',function(e){
    if(!mouseDown)return;
    var dx=(e.clientX-mouseX)*0.004,dy=(e.clientY-mouseY)*0.004;
    mouseX=e.clientX;mouseY=e.clientY;
    yaw-=dx;pitch=Math.max(-1.2,Math.min(0.8,pitch-dy));
});
document.addEventListener('wheel',function(e){
    if(isFP)return;
    tpTargetDist=Math.max(2,Math.min(12,tpTargetDist+e.deltaY*0.005));
});

var joyBase=document.getElementById('joy-base'),joyStick=document.getElementById('joy-stick');
var joyTouch=null,joyCenter={x:0,y:0};
joyBase.addEventListener('touchstart',function(e){
    e.preventDefault();joyTouch=e.changedTouches[0].identifier;
    var r=joyBase.getBoundingClientRect();joyCenter={x:r.left+r.width/2,y:r.top+r.height/2};
});
joyBase.addEventListener('touchmove',function(e){
    e.preventDefault();
    for(var i=0;i<e.changedTouches.length;i++){
        if(e.changedTouches[i].identifier===joyTouch){
            var dx=e.changedTouches[i].clientX-joyCenter.x,dy=e.changedTouches[i].clientY-joyCenter.y;
            var max=40,len=Math.sqrt(dx*dx+dy*dy);
            if(len>max){dx=dx/len*max;dy=dy/len*max}
            joyStick.style.transform='translate('+dx+'px,'+dy+'px)';
            keys.KeyW=dy<-10;keys.KeyS=dy>10;keys.KeyA=dx<-10;keys.KeyD=dx>10;
        }
    }
});
joyBase.addEventListener('touchend',function(e){
    e.preventDefault();joyTouch=null;joyStick.style.transform='';
    keys.KeyW=keys.KeyS=keys.KeyA=keys.KeyD=false;
});
var viewTouch=null;
document.addEventListener('touchstart',function(e){
    for(var i=0;i<e.changedTouches.length;i++){
        if(e.changedTouches[i].clientX>window.innerWidth/2&&viewTouch===null){
            viewTouch={x:e.changedTouches[i].clientX,y:e.changedTouches[i].clientY,id:e.changedTouches[i].identifier};
        }
    }
});
document.addEventListener('touchmove',function(e){
    for(var i=0;i<e.changedTouches.length;i++){
        if(viewTouch&&e.changedTouches[i].identifier===viewTouch.id){
            var dx=(e.changedTouches[i].clientX-viewTouch.x)*0.006;
            var dy=(e.changedTouches[i].clientY-viewTouch.y)*0.006;
            yaw-=dx;pitch=Math.max(-1.2,Math.min(0.8,pitch-dy));
            viewTouch={x:e.changedTouches[i].clientX,y:e.changedTouches[i].clientY,id:e.changedTouches[i].identifier};
        }
    }
},{passive:false});
document.addEventListener('touchend',function(e){viewTouch=null});
document.getElementById('mobile-e').addEventListener('touchstart',function(e){e.preventDefault();interact()});
document.getElementById('mobile-view').addEventListener('touchstart',function(e){e.preventDefault();toggleView()});

function pollGamepad(){
    var pads=navigator.getGamepads?navigator.getGamepads():[];
    for(var i=0;i<pads.length;i++){
        var p=pads[i];if(!p)continue;
        keys.KeyA=p.axes[0]<-0.2;keys.KeyD=p.axes[0]>0.2;
        keys.KeyW=p.axes[1]<-0.2;keys.KeyS=p.axes[1]>0.2;
        if(Math.abs(p.axes[2])>0.1)yaw-=p.axes[2]*0.04;
        if(Math.abs(p.axes[3])>0.1)pitch=Math.max(-1.2,Math.min(0.8,pitch-p.axes[3]*0.04));
        if(p.buttons[0]&&p.buttons[0].pressed)interact();
        if(p.buttons[11]&&p.buttons[11].pressed)toggleView();
    }
    requestAnimationFrame(pollGamepad);
}

init();update();pollGamepad();
