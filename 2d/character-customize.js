'use strict';
var scene,camera,renderer,charGroup,clock;
var rotY=0.3,rotX=0.1,dist=4.5,mouseDown=false,mouseX=0,mouseY=0;
var currentTab='body';

var PALETTE=[
    {name:'月白',hex:0xe8e4d8},{name:'天青',hex:0x8ba8a0},{name:'黛蓝',hex:0x3a4a5a},
    {name:'藕荷',hex:0xc8a0a8},{name:'缃色',hex:0xc8a850},{name:'绛红',hex:0x8a3030},
    {name:'黛紫',hex:0x5a4060},{name:'松花',hex:0x8a9a60},{name:'秋香',hex:0x9a8a50},
    {name:'墨色',hex:0x2a2520},{name:'朱砂',hex:0xb84030},{name:'竹青',hex:0x6a8a60},
    {name:'牙色',hex:0xd8c8a0},{name:'靛蓝',hex:0x305080},{name:'赭石',hex:0x8a6040},
    {name:'鸦青',hex:0x3a3a48},{name:'桃夭',hex:0xe0a8a0},{name:'青瓷',hex:0x80b0a8}
];

var SKIN_TONES=[0xf0d8b8,0xe0c4a0,0xc8a880];
var HAIR_COLORS=[0x1a1510,0x3a2818,0x8a8078,0x6a3028];

var config={
    bodyType:1,faceType:1,skinTone:1,
    hairStyle:0,hairColor:0,
    topStyle:0,topColor:0,bottomStyle:0,bottomColor:14,
    beltStyle:0,beltColor:8,
    accessory:0,shoeStyle:0
};

var TAB_DATA={
    body:[
        {group:'体型',key:'bodyType',options:['瘦削','匀称','魁梧']},
        {group:'肤色',key:'skinTone',type:'color',colors:SKIN_TONES,names:['白皙','自然','小麦']}
    ],
    face:[
        {group:'脸型',key:'faceType',options:['圆润','清秀','棱角']},
        {group:'肤色',key:'skinTone',type:'color',colors:SKIN_TONES,names:['白皙','自然','小麦']}
    ],
    hair:[
        {group:'发式',key:'hairStyle',options:['束发','散发','编发','短发']},
        {group:'发色',key:'hairColor',type:'color',colors:HAIR_COLORS,names:['墨黑','深棕','灰白','暗红']}
    ],
    clothes:[
        {group:'上衣样式',key:'topStyle',options:['交领','对襟','圆领']},
        {group:'上衣颜色',key:'topColor',type:'palette'},
        {group:'下裳样式',key:'bottomStyle',options:['长裙','长裤','短打']},
        {group:'下裳颜色',key:'bottomColor',type:'palette'},
        {group:'腰带',key:'beltStyle',options:['皮革','织锦','绳结']},
        {group:'腰带颜色',key:'beltColor',type:'palette'}
    ],
    acc:[
        {group:'佩饰',key:'accessory',options:['鹤羽','玉佩','香囊','无']},
        {group:'鞋履',key:'shoeStyle',options:['布靴','草鞋','皮靴']}
    ]
};

function init(){
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x1a1510);
    camera=new THREE.PerspectiveCamera(35,1,0.1,100);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    document.getElementById('preview').parentNode.appendChild(renderer.domElement);
    renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';
    renderer.domElement.style.position='absolute';renderer.domElement.style.top='0';renderer.domElement.style.left='0';
    clock=new THREE.Clock();

    var amb=new THREE.AmbientLight(0x8a7350,0.7);scene.add(amb);
    var key=new THREE.DirectionalLight(0xf0d8a0,1.2);key.position.set(3,5,4);key.castShadow=true;scene.add(key);
    var fill=new THREE.HemisphereLight(0x6080a0,0x3a2a1a,0.4);scene.add(fill);
    var rim=new THREE.DirectionalLight(0xc8a45b,0.5);rim.position.set(-3,3,-3);scene.add(rim);

    var floor=new THREE.Mesh(new THREE.CircleGeometry(1.5,48),new THREE.MeshStandardMaterial({color:0x2a2218,roughness:0.9}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-0.01;floor.receiveShadow=true;scene.add(floor);
    var floorRing=new THREE.Mesh(new THREE.RingGeometry(1.4,1.5,48),new THREE.MeshBasicMaterial({color:0xc8a45b,transparent:true,opacity:0.3,side:THREE.DoubleSide}));
    floorRing.rotation.x=-Math.PI/2;floorRing.position.y=0.01;scene.add(floorRing);

    charGroup=new THREE.Group();scene.add(charGroup);
    buildCharacter();
    renderOptions();
    setupInput();
    animate();
    onResize();window.addEventListener('resize',onResize);
}

function onResize(){
    var area=document.getElementById('preview-area');
    var w=area.clientWidth,h=area.clientHeight;
    camera.aspect=w/h;camera.updateProjectionMatrix();
    renderer.setSize(w,h);
}

function buildCharacter(){
    while(charGroup.children.length)charGroup.remove(charGroup.children[0]);
    var skin=SKIN_TONES[config.skinTone];
    var hairC=HAIR_COLORS[config.hairColor];
    var topC=PALETTE[config.topColor].hex;
    var botC=PALETTE[config.bottomColor].hex;
    var beltC=PALETTE[config.beltColor].hex;
    var bodyScale=config.bodyType===0?0.85:config.bodyType===2?1.15:1;

    var skinMat=new THREE.MeshStandardMaterial({color:skin,roughness:0.7});
    var hairMat=new THREE.MeshStandardMaterial({color:hairC,roughness:0.85});
    var topMat=new THREE.MeshStandardMaterial({color:topC,roughness:0.8});
    var botMat=new THREE.MeshStandardMaterial({color:botC,roughness:0.85});
    var beltMat=new THREE.MeshStandardMaterial({color:beltC,roughness:0.5,metalness:0.2});

    var torsoW=0.3*bodyScale,torsoD=0.18*bodyScale;
    var headR=config.faceType===0?0.2:config.faceType===2?0.17:0.185;

    var torso=new THREE.Mesh(new THREE.CylinderGeometry(torsoW,torsoW*0.9,0.55,10),topMat);
    torso.position.y=1.15;torso.castShadow=true;charGroup.add(torso);

    if(config.topStyle===0){
        var collar=new THREE.Mesh(new THREE.BoxGeometry(torsoW*1.2,0.06,torsoD*1.3),beltMat);
        collar.position.y=1.42;collar.rotation.x=0.15;charGroup.add(collar);
        var collarL=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.25,torsoD*1.1),topMat);
        collarL.position.set(-torsoW*0.3,1.35,torsoD*0.5);collarL.rotation.z=0.3;charGroup.add(collarL);
        var collarR=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.25,torsoD*1.1),topMat);
        collarR.position.set(torsoW*0.3,1.35,torsoD*0.5);collarR.rotation.z=-0.3;charGroup.add(collarR);
    }else if(config.topStyle===1){
        var seamL=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.55,torsoD*1.05),beltMat);
        seamL.position.set(0,1.15,torsoD*0.5);charGroup.add(seamL);
    }else{
        var collarR2=new THREE.Mesh(new THREE.TorusGeometry(torsoW*0.5,0.025,6,16,Math.PI),beltMat);
        collarR2.position.y=1.42;collarR2.rotation.x=Math.PI/2;charGroup.add(collarR2);
    }

    var belt=new THREE.Mesh(new THREE.CylinderGeometry(torsoW*1.05,torsoW*1.05,0.08,10),beltMat);
    belt.position.y=0.92;charGroup.add(belt);

    if(config.bottomStyle===0){
        var skirt=new THREE.Mesh(new THREE.CylinderGeometry(torsoW*1.1,torsoW*2.2,0.75,12),botMat);
        skirt.position.y=0.52;skirt.castShadow=true;charGroup.add(skirt);
    }else if(config.bottomStyle===1){
        var legL=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.07,0.7,8),botMat);
        legL.position.set(-0.11,0.35,0);legL.castShadow=true;charGroup.add(legL);
        var legR=legL.clone();legR.position.x=0.11;charGroup.add(legR);
    }else{
        var robeL=new THREE.Mesh(new THREE.CylinderGeometry(torsoW*1.1,torsoW*1.5,0.45,10),botMat);
        robeL.position.y=0.68;charGroup.add(robeL);
        var legL2=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.06,0.4,8),skinMat);
        legL2.position.set(-0.1,0.2,0);charGroup.add(legL2);
        var legR2=legL2.clone();legR2.position.x=0.1;charGroup.add(legR2);
    }

    var head=new THREE.Mesh(new THREE.SphereGeometry(headR,16,16),skinMat);
    head.position.y=1.68;head.scale.y=config.faceType===0?1.05:config.faceType===2?0.95:1;
    head.castShadow=true;charGroup.add(head);
    var neck=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.07,0.12,8),skinMat);
    neck.position.y=1.52;charGroup.add(neck);

    var eyeL=new THREE.Mesh(new THREE.SphereGeometry(0.025,8,8),new THREE.MeshStandardMaterial({color:0x1a1510}));
    eyeL.position.set(-0.06,1.7,headR*0.85);charGroup.add(eyeL);
    var eyeR=eyeL.clone();eyeR.position.x=0.06;charGroup.add(eyeR);

    if(config.hairStyle===0){
        var hairTop=new THREE.Mesh(new THREE.SphereGeometry(headR+0.02,16,8,0,Math.PI*2,0,Math.PI/2),hairMat);
        hairTop.position.y=1.7;charGroup.add(hairTop);
        var bun=new THREE.Mesh(new THREE.SphereGeometry(0.09,10,10),hairMat);
        bun.position.y=1.92;charGroup.add(bun);
        var pin=new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,0.2,6),beltMat);
        pin.position.set(0,1.92,0);pin.rotation.z=Math.PI/4;charGroup.add(pin);
        var ribbon=new THREE.Mesh(new THREE.PlaneGeometry(0.04,0.35),new THREE.MeshStandardMaterial({color:beltC,side:THREE.DoubleSide}));
        ribbon.position.set(0,1.78,-0.08);charGroup.add(ribbon);
    }else if(config.hairStyle===1){
        var hairAll=new THREE.Mesh(new THREE.SphereGeometry(headR+0.03,16,16),hairMat);
        hairAll.position.y=1.68;hairAll.scale.set(1.05,1.1,1.05);charGroup.add(hairAll);
        var hairBack=new THREE.Mesh(new THREE.BoxGeometry(headR*1.2,0.5,0.08),hairMat);
        hairBack.position.set(0,1.45,-headR*0.7);charGroup.add(hairBack);
    }else if(config.hairStyle===2){
        var hairTop2=new THREE.Mesh(new THREE.SphereGeometry(headR+0.02,16,8,0,Math.PI*2,0,Math.PI/2),hairMat);
        hairTop2.position.y=1.7;charGroup.add(hairTop2);
        for(var b=0;b<3;b++){
            var bead=new THREE.Mesh(new THREE.SphereGeometry(0.04,8,8),hairMat);
            bead.position.set(0,1.55-b*0.12,-headR*0.6-b*0.03);charGroup.add(bead);
        }
    }else{
        var hairShort=new THREE.Mesh(new THREE.SphereGeometry(headR+0.02,16,8,0,Math.PI*2,0,Math.PI*0.6),hairMat);
        hairShort.position.y=1.72;charGroup.add(hairShort);
    }

    var armL=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.04,0.55,8),topMat);
    armL.position.set(-torsoW-0.04,1.15,0);armL.rotation.z=0.12;armL.castShadow=true;charGroup.add(armL);
    var armR=armL.clone();armR.position.x=torsoW+0.04;armR.rotation.z=-0.12;charGroup.add(armR);
    var handL=new THREE.Mesh(new THREE.SphereGeometry(0.045,8,8),skinMat);
    handL.position.set(-torsoW-0.06,0.85,0);charGroup.add(handL);
    var handR=handL.clone();handR.position.x=torsoW+0.06;charGroup.add(handR);

    if(config.accessory===0){
        var feather=new THREE.Mesh(new THREE.PlaneGeometry(0.06,0.3),new THREE.MeshStandardMaterial({color:0x2a2520,side:THREE.DoubleSide,roughness:0.9}));
        feather.position.set(torsoW*0.8,1.0,torsoD*0.6);feather.rotation.z=0.3;feather.rotation.y=0.2;charGroup.add(feather);
        var featherGlow=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,8),new THREE.MeshBasicMaterial({color:0xc8a45b,transparent:true,opacity:0.6}));
        featherGlow.position.copy(feather.position);charGroup.add(featherGlow);
    }else if(config.accessory===1){
        var jade=new THREE.Mesh(new THREE.TorusGeometry(0.04,0.015,8,16),new THREE.MeshStandardMaterial({color:0x80b088,roughness:0.3,metalness:0.1}));
        jade.position.set(-torsoW*0.5,0.88,torsoD*0.7);charGroup.add(jade);
    }else if(config.accessory===2){
        var sachet=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.08,0.04),new THREE.MeshStandardMaterial({color:0xb84030,roughness:0.8}));
        sachet.position.set(torsoW*0.5,0.88,torsoD*0.7);charGroup.add(sachet);
        var cord=new THREE.Mesh(new THREE.CylinderGeometry(0.005,0.005,0.15,4),beltMat);
        cord.position.set(torsoW*0.5,0.98,torsoD*0.7);charGroup.add(cord);
    }

    var shoeMat=config.shoeStyle===2?new THREE.MeshStandardMaterial({color:0x3a2818,roughness:0.7}):config.shoeStyle===1?new THREE.MeshStandardMaterial({color:0x8a7a50,roughness:0.9}):new THREE.MeshStandardMaterial({color:0x2a2520,roughness:0.8});
    var shoeL=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.06,0.18),shoeMat);
    shoeL.position.set(-0.11,0.03,0.02);charGroup.add(shoeL);
    var shoeR=shoeL.clone();shoeR.position.x=0.11;charGroup.add(shoeR);
}

function renderOptions(){
    var container=document.getElementById('options');
    var data=TAB_DATA[currentTab];
    var html='';
    data.forEach(function(item){
        html+='<div class="opt-group"><h4>'+item.group+'</h4>';
        if(item.type==='palette'){
            html+='<div class="color-grid">';
            PALETTE.forEach(function(c,i){
                var hex='#'+c.hex.toString(16).padStart(6,'0');
                html+='<div class="color-swatch'+(config[item.key]===i?' active':'')+'" style="background:'+hex+'" onclick="setOption(\''+item.key+'\','+i+')" title="'+c.name+'"><span class="name">'+c.name+'</span></div>';
            });
            html+='</div>';
        }else if(item.type==='color'){
            html+='<div class="color-grid">';
            item.colors.forEach(function(hexVal,i){
                var hex='#'+hexVal.toString(16).padStart(6,'0');
                html+='<div class="color-swatch'+(config[item.key]===i?' active':'')+'" style="background:'+hex+'" onclick="setOption(\''+item.key+'\','+i+')" title="'+item.names[i]+'"><span class="name">'+item.names[i]+'</span></div>';
            });
            html+='</div>';
        }else{
            html+='<div class="opt-grid">';
            item.options.forEach(function(opt,i){
                html+='<div class="opt-btn'+(config[item.key]===i?' active':'')+'" onclick="setOption(\''+item.key+'\','+i+')">'+opt+'</div>';
            });
            html+='</div>';
        }
        html+='</div>';
    });
    container.innerHTML=html;
}

function setOption(key,value){
    config[key]=value;
    buildCharacter();
    renderOptions();
}

function resetChar(){
    config={bodyType:1,faceType:1,skinTone:1,hairStyle:0,hairColor:0,topStyle:0,topColor:0,bottomStyle:0,bottomColor:14,beltStyle:0,beltColor:8,accessory:0,shoeStyle:0};
    buildCharacter();renderOptions();
}

function saveAndGo(){
    try{localStorage.setItem('inkCharacterConfig',JSON.stringify(config))}catch(e){}
    window.location.href='huanghelou-3d.html';
}

function setupInput(){
    var canvas=renderer.domElement;
    canvas.addEventListener('mousedown',function(e){mouseDown=true;mouseX=e.clientX;mouseY=e.clientY});
    document.addEventListener('mouseup',function(){mouseDown=false});
    document.addEventListener('mousemove',function(e){
        if(!mouseDown)return;
        rotY+=(e.clientX-mouseX)*0.008;rotX+=(e.clientY-mouseY)*0.004;
        rotX=Math.max(-0.3,Math.min(0.5,rotX));mouseX=e.clientX;mouseY=e.clientY;
    });
    canvas.addEventListener('wheel',function(e){e.preventDefault();dist=Math.max(2.5,Math.min(8,dist+e.deltaY*0.003))},{passive:false});
    canvas.addEventListener('touchstart',function(e){if(e.touches.length===1){mouseDown=true;mouseX=e.touches[0].clientX;mouseY=e.touches[0].clientY}});
    canvas.addEventListener('touchmove',function(e){
        e.preventDefault();
        if(e.touches.length===1&&mouseDown){
            rotY+=(e.touches[0].clientX-mouseX)*0.01;rotX+=(e.touches[0].clientY-mouseY)*0.005;
            rotX=Math.max(-0.3,Math.min(0.5,rotX));mouseX=e.touches[0].clientX;mouseY=e.touches[0].clientY;
        }
    },{passive:false});
    canvas.addEventListener('touchend',function(){mouseDown=false});

    document.querySelectorAll('.tab').forEach(function(tab){
        tab.addEventListener('click',function(){
            document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active')});
            tab.classList.add('active');
            currentTab=tab.dataset.tab;
            renderOptions();
        });
    });
}

function animate(){
    requestAnimationFrame(animate);
    var t=clock.getElapsedTime();
    charGroup.rotation.y=rotY;
    camera.position.set(Math.sin(rotX)*dist,1.3+rotX*2,Math.cos(rotX)*dist);
    camera.lookAt(0,1.0,0);
    renderer.render(scene,camera);
}

try{
    var saved=JSON.parse(localStorage.getItem('inkCharacterConfig')||'null');
    if(saved)Object.keys(saved).forEach(function(k){if(k in config)config[k]=saved[k]});
}catch(e){}

init();