'use strict';
var canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
var W=0,H=0,DPR=1;
var WORLD={w:1800,h:800};
var DECK_Y=400,UNDER_Y=560;
var BRIDGE={l:180,r:1420};
var BANK_L={l:0,r:180},BANK_R={l:1420,r:1800};
var RIVER={top:520,bot:760};
var OBJECTS=[
    {id:'bag',label:'旧行囊',level:0,x:80,range:60,type:'bag'},
    {id:'carve1',label:'刻痕 · 一',level:0,x:420,range:55,type:'carving',cIdx:0},
    {id:'carve2',label:'刻痕 · 二',level:0,x:750,range:55,type:'carving',cIdx:1},
    {id:'carve3',label:'刻痕 · 三',level:0,x:1080,range:55,type:'carving',cIdx:2},
    {id:'stone1',label:'左岸拱石',level:1,x:480,range:60,type:'stone',sIdx:0},
    {id:'stone2',label:'拱顶石',level:1,x:750,range:60,type:'stone',sIdx:1},
    {id:'stone3',label:'右岸拱石',level:1,x:1020,range:60,type:'stone',sIdx:2},
    {id:'box',label:'信匣',level:1,x:1200,range:60,type:'box'},
    {id:'oldman',label:'守桥老人',level:0,x:80,range:70,type:'char'},
    {id:'lamp_center',label:'桥中央灯座',level:0,x:750,range:60,type:'lampCenter'},
    {id:'stairs_up',label:'上桥',level:1,x:300,range:50,type:'stairs',to:0},
    {id:'stairs_down',label:'下桥',level:0,x:300,range:50,type:'stairs',to:1}
];
var TASKS=[
    {title:'任务一 · 找到修桥记录',desc:'打开桥头旧行囊，沿桥面寻找相同的刻痕，找到缺页。'},
    {title:'任务二 · 接通两岸',desc:'进入桥下，按草图顺序复位三块拱石。'},
    {title:'任务三 · 读出未尽的约定',desc:'打开信匣，把信带回桥头交给老人。'},
    {title:'任务四 · 把灯移到中央',desc:'接过渡灯，走到桥中央挂上它。'}
];
var keys={left:false,right:false,up:false,down:false,e:false};
var game={};
var camera={x:0,y:0};
var dialogue={active:false,queue:[],index:0,onDone:null};
var toastTimer=null;
var animTime=0;

function resize(){DPR=Math.max(1,Math.min(window.devicePixelRatio||1,2));W=window.innerWidth;H=window.innerHeight;canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0)}
window.addEventListener('resize',resize);resize();

function resetGame(){
    keys.left=keys.right=keys.up=keys.down=keys.e=false;
    game={running:false,player:{x:100,level:0,facing:1,moving:false,bob:0},task:0,
        bagOpened:false,carvings:[false,false,false],stones:[false,false,false],
        boxOpened:false,letterRead:false,letterGiven:false,
        lampTaken:false,lampPlaced:false,fogAlpha:0.85,
        nearObj:null,lightAlpha:0};
    camera.x=0;camera.y=0;
}

function startGame(){
    resetGame();game.running=true;
    document.getElementById('start-screen').classList.add('hide');
    document.getElementById('hud').style.display='block';
    document.getElementById('task-panel').style.display='block';
    document.getElementById('top-actions').style.display='flex';
    updateTaskPanel();
    toast('你来到赵州桥头，暮色沉沉。',3000);
}
function updateTaskPanel(){
    var t=TASKS[game.task]||{title:'本章完成',desc:'告别已完成。'};
    document.getElementById('tp-title').textContent=t.title;
    document.getElementById('tp-desc').textContent=t.desc;
    document.getElementById('hud-goal').textContent=t.title.replace(/任务[一二三四] · /,'');
    document.getElementById('hud-carvings').textContent=game.carvings.filter(Boolean).length+' / 3';
    document.getElementById('hud-stones').textContent=game.stones.filter(Boolean).length+' / 3';
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
    var line=dialogue.queue[dialogue.index];
    document.getElementById('dialogue-speaker').textContent=line[0];
    document.getElementById('dialogue-text').textContent=line[1];
}
function advanceDialogue(){if(!dialogue.active)return;dialogue.index++;showDialogueLine()}

function playerY(){return game.player.level===0?DECK_Y:UNDER_Y}

function update(dt){
    if(!game.running)return;
    if(dialogue.active){if(keys.e){keys.e=false;advanceDialogue()}return}
    var p=game.player,speed=220,dx=0;
    if(keys.left){dx=-speed*dt;p.facing=-1}
    if(keys.right){dx=speed*dt;p.facing=1}
    p.moving=dx!==0;if(p.moving)p.bob+=dt*8;
    var nx=p.x+dx;
    nx=Math.max(30,Math.min(WORLD.w-30,nx));
    p.x=nx;

    game.nearObj=null;
    for(var i=0;i<OBJECTS.length;i++){
        var obj=OBJECTS[i];
        if(obj.level!==p.level)continue;
        if(obj.id==='stairs_up'&&p.level===0)continue;
        if(obj.id==='stairs_down'&&p.level===1)continue;
        if(Math.abs(p.x-obj.x)<obj.range){game.nearObj=obj;break}
    }
    var prompt=document.getElementById('interact-prompt');
    if(game.nearObj){prompt.textContent='按 E 互动：'+game.nearObj.label;prompt.style.display='block'}
    else{prompt.style.display='none'}
    if(keys.e){keys.e=false;interact()}

    if(game.lampPlaced)game.fogAlpha=Math.max(0,game.fogAlpha-dt*0.4);

    var tx=p.x-W/2,ty=playerY()-H*0.55;
    camera.x+=(tx-camera.x)*Math.min(1,dt*4);camera.y+=(ty-camera.y)*Math.min(1,dt*4);
    camera.x=Math.max(0,Math.min(WORLD.w-W,camera.x));camera.y=Math.max(0,Math.min(WORLD.h-H,camera.y));
}

function interact(){
    var obj=game.nearObj;if(!obj)return;
    if(obj.type==='bag'){
        if(game.task!==0){toast('行囊已经看过了。',1500);return}
        if(game.bagOpened){toast('行囊里只有一张缺角的草图。',1500);return}
        game.bagOpened=true;
        startDialogue([['执笔人','打开桥头的旧行囊……里面有一张缺角的修桥草图。'],['小墨灵','草图上标着三个刻痕的位置。沿桥面找找看。'],['执笔人','草图缺了一角，需要找到同样的刻痕才能补全。']],function(){toast('沿桥面寻找三处刻痕。',2500);updateTaskPanel()});
    }
    else if(obj.type==='carving'){
        if(game.task!==0){toast('刻痕已经找齐了。',1500);return}
        if(!game.bagOpened){toast('先打开旧行囊，看看草图。',1500);return}
        if(game.carvings[obj.cIdx]){toast('这处刻痕已经看过。',1500);return}
        game.carvings[obj.cIdx]=true;
        var names=['第一处刻痕','第二处刻痕','第三处刻痕'];
        var count=game.carvings.filter(Boolean).length;
        startDialogue([['执笔人','找到了'+names[obj.cIdx]+'，和草图上的纹路一样。'],['小墨灵','（比对草图）这处刻痕旁边有一块缺页……补上了！']],function(){
            if(count===3){
                toast('修桥记录补全！桥下入口与拱石顺序已知。',3500);
                startDialogue([['执笔人','草图补全了：左岸 → 拱顶 → 右岸。'],['小墨灵','桥下有一段隐藏的入口，按这个顺序复位拱石，桥面就能接通。'],['执笔人','下桥去吧。']],function(){game.task=1;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='stairs'){
        p=game.player;p.level=obj.to;
        p.x=obj.x+60;
        toast(obj.to===1?'下到桥下':'回到桥面',1200);
    }
    else if(obj.type==='stone'){
        if(game.task!==1){toast('先找到修桥记录，才知道拱石顺序。',1500);return}
        if(game.stones[obj.sIdx]){toast('这块拱石已经复位。',1500);return}
        var expected=game.stones.filter(Boolean).length;
        if(obj.sIdx!==expected){toast('顺序不对。草图写着：左岸 → 拱顶 → 右岸。',2500);return}
        game.stones[obj.sIdx]=true;
        var sNames=['左岸拱石','拱顶石','右岸拱石'];
        var sCount=game.stones.filter(Boolean).length;
        startDialogue([['执笔人','复位了'+sNames[obj.sIdx]+'。'],['小墨灵','桥面上的一段虚影变成了实体……']],function(){
            if(sCount===3){
                toast('两岸接通！石缝中的信匣打开了。',3500);
                startDialogue([['小墨灵','桥接通了！石缝里有一个信匣……'],['执笔人','去看看里面有什么。']],function(){game.task=2;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='box'){
        if(game.task!==2){toast('信匣还打不开。',1500);return}
        if(game.boxOpened){toast('信匣已经空了。',1500);return}
        game.boxOpened=true;
        startDialogue([
            ['执笔人','信匣里有两封信。一封是给守桥老人的家书……'],
            ['小墨灵','另一封是几位被帮助的人留下的感谢。'],
            ['执笔人','"谢谢你当年在河上为我引路。"'],
            ['小墨灵','原来年轻人留在别处，帮助了更多人。'],
            ['执笔人','把信带回桥头，交给老人吧。']
        ],function(){toast('把信带回桥头。',2500);game.task=2;updateTaskPanel()});
    }
    else if(obj.type==='char'){
        if(game.task===2){
            if(!game.boxOpened){toast('先打开信匣。',1500);return}
            if(game.letterGiven){toast('信已经交给老人了。',1500);return}
            game.letterGiven=true;
            startDialogue([
                ['守桥老人','这是……他的笔迹？'],
                ['执笔人','是的。他写给您的家书，还有一封感谢信。'],
                ['守桥老人','（读信）"爹，河上还有人需要引路。我暂时回不来……"'],
                ['守桥老人','（沉默）……他一直在帮助别人。'],
                ['小墨灵','老人，那盏灯……也许可以为更多人照路。'],
                ['守桥老人','（长叹）……你说得对。这盏灯，先替他照着路。'],
                ['守桥老人','拿去吧。把它挂到桥中央，让两岸都能看见。']
            ],function(){toast('老人交出了渡灯。把它挂到桥中央。',3000);game.task=3;updateTaskPanel()});
            updateTaskPanel();
        }
        else if(game.task===3){toast('老人已经把灯交给你了。去桥中央吧。',1500)}
    }
    else if(obj.type==='lampCenter'){
        if(game.task!==3){toast('这盏灯还不能挂上去。',1500);return}
        if(game.lampPlaced){toast('渡灯已经挂在桥中央。',1500);return}
        game.lampPlaced=true;
        startDialogue([
            ['执笔人','把渡灯挂到了桥中央。'],
            ['（环境）','灯影落入河面，两岸的雾同时散去。'],
            ['小墨灵','雾散了……桥那头的路，终于出现了。'],
            ['守桥老人','这盏灯先替他照着路。'],
            ['小墨灵','桥要让人过去。']
        ],function(){completeChapter()});
    }
}

function completeChapter(){
    try{
        var saved=JSON.parse(localStorage.getItem('inkJourneyProgressV1')||'{}');
        if(!Array.isArray(saved.completed))saved.completed=[];
        if(saved.completed.indexOf('zhaozhou')===-1)saved.completed.push('zhaozhou');
        localStorage.setItem('inkJourneyProgressV1',JSON.stringify(saved));
    }catch(e){}
    document.getElementById('hud').style.display='none';
    document.getElementById('task-panel').style.display='none';
    document.getElementById('interact-prompt').style.display='none';
    document.getElementById('result-title').textContent='获得信物 · 渡灯';
    document.getElementById('result-detail').innerHTML='一盏可带走的墨色灯影，让桥上的光不再只照向一侧。<br><br><strong style="color:#f0d38b">小墨灵："桥要让人过去。"</strong><br><br>第二段记忆已恢复。回到主线，继续下一段旅程。';
    document.getElementById('result-modal').classList.add('show');
}

function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.save();ctx.translate(-camera.x,-camera.y);
    drawBackground();drawBridge();drawUnderBridge();drawRiver();drawFog();drawLightPath();drawObjects();drawPlayer();
    ctx.restore();
}
function drawBackground(){
    var grad=ctx.createLinearGradient(0,0,0,WORLD.h);
    grad.addColorStop(0,'#1a1510');grad.addColorStop(0.5,'#231c14');grad.addColorStop(1,'#161313');
    ctx.fillStyle=grad;ctx.fillRect(0,0,WORLD.w,WORLD.h);
}
function drawBridge(){
    var l=BRIDGE.l,r=BRIDGE.r,deckY=DECK_Y;
    ctx.fillStyle='#5a4e3e';ctx.fillRect(l,deckY,r-l,18);
    ctx.fillStyle='#6b5e4a';ctx.fillRect(l,deckY-4,r-l,6);
    ctx.strokeStyle='#7a6d58';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(l,deckY);ctx.lineTo(l,deckY-30);ctx.lineTo(r,deckY-30);ctx.lineTo(r,deckY);ctx.stroke();
    for(var rx=l+20;rx<r-10;rx+=30){ctx.beginPath();ctx.moveTo(rx,deckY);ctx.lineTo(rx,deckY-28);ctx.stroke()}
    var archCx=(l+r)/2,archRx=(r-l)/2,archRy=120,archCy=deckY+archRy;
    ctx.strokeStyle='#7a6d58';ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(archCx,archCy,archRx,archRy,0,Math.PI,0);ctx.stroke();
    ctx.strokeStyle='#5a4e3e';ctx.lineWidth=8;
    ctx.beginPath();ctx.ellipse(archCx,archCy+5,archRx-10,archRy-5,0,Math.PI,0);ctx.stroke();
    ctx.fillStyle='#3a3020';ctx.fillRect(l-30,deckY-10,30,120);
    ctx.fillRect(r,deckY-10,30,120);
    ctx.fillStyle='#4a3e2e';ctx.fillRect(l-35,deckY-25,40,18);ctx.fillRect(r-5,deckY-25,40,18);
    if(!game.carvings.every(Boolean)){
        ctx.strokeStyle='rgba(200,164,91,.35)';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
        var partial=Math.floor(game.carvings.filter(Boolean).length/3*(r-l));
        if(partial>0){ctx.beginPath();ctx.moveTo(l,deckY-2);ctx.lineTo(l+partial,deckY-2);ctx.stroke()}
        ctx.setLineDash([]);
    }
    if(game.lampPlaced){
        var lampG=ctx.createRadialGradient(750,deckY-20,5,750,deckY-20,60);
        lampG.addColorStop(0,'rgba(255,226,139,.5)');lampG.addColorStop(1,'rgba(255,226,139,0)');
        ctx.fillStyle=lampG;ctx.fillRect(690,deckY-80,120,120);
    }
}
function drawUnderBridge(){
    if(game.player.level!==1&&game.task<1)return;
    var y=UNDER_Y;
    ctx.fillStyle='#4a3e2e';ctx.fillRect(200,y-10,1200,16);
    ctx.fillStyle='#5a4e3e';ctx.fillRect(200,y-14,1200,6);
    ctx.strokeStyle='#7a6d58';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(200,y);ctx.lineTo(200,y-40);ctx.moveTo(1400,y);ctx.lineTo(1400,y-40);ctx.stroke();
    var archCx=800,archRx=350,archRy=100,archCy=y+archRy;
    ctx.strokeStyle='#7a6d58';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(archCx,archCy,archRx,archRy,0,Math.PI,0);ctx.stroke();
    for(var i=0;i<3;i++){
        var sx=480+i*270,sy=y-30;
        if(game.stones[i]){ctx.fillStyle='#c8a45b';ctx.globalAlpha=.7}
        else{ctx.fillStyle='#5a4e3e';ctx.globalAlpha=.8}
        ctx.beginPath();ctx.arc(sx,sy,22,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
        ctx.strokeStyle=game.stones[i]?'#f0d38b':'#7a6d58';ctx.lineWidth=2;ctx.stroke();
    }
    if(game.boxOpened){
        ctx.fillStyle='#8a7350';ctx.fillRect(1180,y-40,40,28);
        ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(1180,y-40,40,28);
    }else if(game.task===2){
        ctx.save();ctx.shadowColor='#f0d38b';ctx.shadowBlur=12;
        ctx.fillStyle='#8a7350';ctx.fillRect(1180,y-40,40,28);
        ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(1180,y-40,40,28);ctx.restore();
    }
    ctx.fillStyle='#9e8a62';ctx.font='12px KaiTi';ctx.textAlign='center';ctx.fillText('桥下',800,y-50);
}
function drawRiver(){
    ctx.fillStyle='#3a5560';ctx.fillRect(0,RIVER.top,WORLD.w,RIVER.bot-RIVER.top);
    ctx.strokeStyle='rgba(160,200,210,.2)';ctx.lineWidth=1.5;
    for(var wy=RIVER.top+12;wy<RIVER.bot;wy+=18){
        ctx.beginPath();ctx.moveTo(0,wy);
        for(var wx=0;wx<WORLD.w;wx+=50){ctx.quadraticCurveTo(wx+12,wy+Math.sin(animTime*1.2+wx*.015)*3,wx+25,wy)}
        ctx.stroke();
    }
    if(game.lampPlaced){
        ctx.save();ctx.globalAlpha=.5;
        var refl=ctx.createRadialGradient(750,RIVER.top+30,5,750,RIVER.top+30,50);
        refl.addColorStop(0,'rgba(255,226,139,.4)');refl.addColorStop(1,'rgba(255,226,139,0)');
        ctx.fillStyle=refl;ctx.fillRect(700,RIVER.top-20,100,100);ctx.restore();
    }
}
function drawFog(){
    if(game.fogAlpha<=0)return;
    ctx.save();ctx.globalAlpha=game.fogAlpha;
    ctx.fillStyle='#9a9a9a';
    ctx.fillRect(1400,0,400,WORLD.h);
    ctx.restore();
}
function drawLightPath(){
    if(!game.lampPlaced)return;
    ctx.save();ctx.globalAlpha=Math.min(1,(0.85-game.fogAlpha)/0.5);
    ctx.strokeStyle='#f0d38b';ctx.lineWidth=2;ctx.setLineDash([6,5]);
    ctx.beginPath();ctx.moveTo(750,DECK_Y-20);ctx.lineTo(1420,DECK_Y-20);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
}

function drawObjects(){
    for(var i=0;i<OBJECTS.length;i++){
        var obj=OBJECTS[i];
        if(obj.id==='stairs_up'||obj.id==='stairs_down')continue;
        var isNear=game.nearObj===obj;
        var oy=obj.level===0?DECK_Y:UNDER_Y;
        if(obj.type==='bag'){
            if(game.bagOpened)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=15}
            ctx.fillStyle='#8a7350';ctx.fillRect(obj.x-15,oy-25,30,22);
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-15,oy-25,30,22);
            ctx.fillStyle='#6b5238';ctx.fillRect(obj.x-10,oy-30,20,6);ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,oy-38);
        }
        else if(obj.type==='carving'){
            if(game.carvings[obj.cIdx])continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=2;
            ctx.beginPath();ctx.moveTo(obj.x-12,oy-8);ctx.lineTo(obj.x-4,oy-16);ctx.lineTo(obj.x+4,oy-8);ctx.lineTo(obj.x+12,oy-16);ctx.stroke();
            ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,oy-22);
        }
        else if(obj.type==='stone'){
            if(game.stones[obj.sIdx])continue;
            if(game.task<1)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#5a4e3e';ctx.beginPath();ctx.arc(obj.x,oy-30,22,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='#7a6d58';ctx.lineWidth=2;ctx.stroke();ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,oy-60);
        }
        else if(obj.type==='box'){
            if(game.task<2)continue;
            if(game.boxOpened)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#8a7350';ctx.fillRect(obj.x-20,oy-40,40,28);
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-20,oy-40,40,28);ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,oy-50);
        }
        else if(obj.type==='char'){
            drawPerson(obj.x,oy,'#3a3020','#c8a45b',isNear);
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='12px KaiTi';ctx.textAlign='center';ctx.fillText('守桥老人',obj.x,oy-58);
            if(game.task===2&&game.boxOpened&&!game.letterGiven){ctx.fillStyle='#f0d38b';ctx.font='16px KaiTi';ctx.fillText('…',obj.x,oy-70)}
        }
        else if(obj.type==='lampCenter'){
            if(!game.lampTaken)continue;
            var ly=oy-55;
            ctx.strokeStyle='#8a6d3f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(obj.x,oy);ctx.lineTo(obj.x,ly);ctx.stroke();
            ctx.fillStyle=game.lampPlaced?'#ffe28b':'#5a4632';ctx.beginPath();ctx.arc(obj.x,ly-8,10,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.stroke();
            if(game.lampPlaced){var lg=ctx.createRadialGradient(obj.x,ly-8,5,obj.x,ly-8,50);lg.addColorStop(0,'rgba(255,226,139,.5)');lg.addColorStop(1,'rgba(255,226,139,0)');ctx.fillStyle=lg;ctx.fillRect(obj.x-50,ly-58,100,100)}
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,ly-25);
        }
    }
}
function drawPerson(x,y,robeColor,accentColor,isNear){
    if(isNear){ctx.save();ctx.shadowColor='#f0d38b';ctx.shadowBlur=15}
    ctx.fillStyle=robeColor;ctx.beginPath();ctx.moveTo(x-12,y);ctx.lineTo(x-8,y-35);ctx.lineTo(x+8,y-35);ctx.lineTo(x+12,y);ctx.closePath();ctx.fill();
    ctx.fillStyle=accentColor;ctx.fillRect(x-8,y-33,16,4);
    ctx.fillStyle='#ead9b7';ctx.beginPath();ctx.arc(x,y-44,9,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=robeColor;ctx.beginPath();ctx.arc(x,y-47,9,Math.PI,0);ctx.fill();
    if(isNear)ctx.restore();
}
function drawPlayer(){
    var p=game.player,fy=playerY(),bob=p.moving?Math.sin(p.bob)*2:0,px=p.x,py=fy+bob;
    ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=8;ctx.shadowOffsetY=3;
    ctx.fillStyle='#ead9b7';ctx.beginPath();ctx.moveTo(px-14,py);ctx.lineTo(px-9,py-38);ctx.lineTo(px+9,py-38);ctx.lineTo(px+14,py);ctx.closePath();ctx.fill();
    ctx.fillStyle='#c8a45b';ctx.fillRect(px-9,py-36,18,4);
    ctx.fillStyle='#f0d38b';ctx.beginPath();ctx.arc(px,py-48,10,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3a3020';ctx.beginPath();ctx.arc(px,py-51,10,Math.PI,0);ctx.fill();
    ctx.fillStyle='#161313';ctx.beginPath();ctx.arc(px+p.facing*3,py-47,1.5,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.fillStyle='rgba(240,211,139,.4)';ctx.font='10px KaiTi';ctx.textAlign='center';ctx.fillText('执笔人',px,py-62);
}
function gameLoop(ts){
    var dt=Math.min(0.05,(ts-(gameLoop.last||ts))/1000);gameLoop.last=ts;animTime+=dt;
    if(game.running){update(dt);draw()}requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
document.addEventListener('keydown',function(e){
    if(e.key==='a'||e.key==='A'||e.key==='ArrowLeft')keys.left=true;
    if(e.key==='d'||e.key==='D'||e.key==='ArrowRight')keys.right=true;
    if(e.key==='w'||e.key==='W'||e.key==='ArrowUp')keys.up=true;
    if(e.key==='s'||e.key==='S'||e.key==='ArrowDown')keys.down=true;
    if(e.key==='e'||e.key==='E'||e.key===' '){if(!keys.e)keys.e=true;e.preventDefault()}
});
document.addEventListener('keyup',function(e){
    if(e.key==='a'||e.key==='A'||e.key==='ArrowLeft')keys.left=false;
    if(e.key==='d'||e.key==='D'||e.key==='ArrowRight')keys.right=false;
    if(e.key==='w'||e.key==='W'||e.key==='ArrowUp')keys.up=false;
    if(e.key==='s'||e.key==='S'||e.key==='ArrowDown')keys.down=false;
});
document.querySelectorAll('.pad-btn').forEach(function(btn){
    var k=btn.dataset.k;
    btn.addEventListener('touchstart',function(e){e.preventDefault();btn.classList.add('pressed');if(k==='e')keys.e=true;else keys[k]=true});
    btn.addEventListener('touchend',function(e){e.preventDefault();btn.classList.remove('pressed');if(k!=='e')keys[k]=false});
    btn.addEventListener('mousedown',function(e){e.preventDefault();btn.classList.add('pressed');if(k==='e')keys.e=true;else keys[k]=true});
    btn.addEventListener('mouseup',function(e){e.preventDefault();btn.classList.remove('pressed');if(k!=='e')keys[k]=false});
});
resetGame();