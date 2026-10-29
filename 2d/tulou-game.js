'use strict';
var canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
var W=0,H=0,DPR=1;
var WORLD={w:1800,h:800};
var GROUND_Y=480;
var CORRIDOR={l:60,r:1100};
var COURTYARD={l:1100,r:1600};
var OBJECTS=[
    {id:'tool',label:'修补工具',x:120,range:55,type:'tool'},
    {id:'door1',label:'一号门',x:200,range:60,type:'door',dIdx:0},
    {id:'lantern1',label:'待补灯笼',x:200,range:55,type:'lantern'},
    {id:'pattern1',label:'纹样碎片 · 一',x:380,range:55,type:'pattern',patIdx:0},
    {id:'pattern2',label:'纹样碎片 · 二',x:520,range:55,type:'pattern',patIdx:1},
    {id:'pattern3',label:'纹样碎片 · 三',x:660,range:55,type:'pattern',patIdx:2},
    {id:'door2',label:'二号门',x:450,range:60,type:'door',dIdx:1},
    {id:'letter',label:'灯架夹层家书',x:450,range:55,type:'letter'},
    {id:'door3',label:'三号门',x:750,range:60,type:'door',dIdx:2},
    {id:'lamp_seat',label:'长卷灯座',x:1350,range:70,type:'lampSeat'},
    {id:'common_lamp',label:'共同的灯',x:1350,range:60,type:'commonLamp'}
];
var TASKS=[
    {title:'任务一 · 送还工具',desc:'根据门边的修补痕迹找到工具的主人，把工具还给一号门住户。'},
    {title:'任务二 · 修补灯笼',desc:'沿环廊找回纹样碎片，拼好灯笼交给二号门住户。'},
    {title:'任务三 · 传递家书',desc:'循门牌与声音找到三号门收信人，送达家书。'},
    {title:'任务四 · 点亮共同的灯',desc:'把前四关信物的墨影放入长卷灯座，点亮共同的灯。'}
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
    game={running:false,player:{x:120,facing:1,moving:false,bob:0},task:0,
        toolPicked:false,door1Open:false,lanternPicked:false,
        patterns:[false,false,false],lanternDone:false,door2Open:false,
        letterPicked:false,door3Open:false,
        tokensPlaced:[false,false,false,false],commonLit:false,
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
    toast('你走进土楼环廊，家家亮灯，却没有一扇门打开。',3500);
}
function updateTaskPanel(){
    var t=TASKS[game.task]||{title:'本章完成',desc:'共同的灯已点亮。'};
    document.getElementById('tp-title').textContent=t.title;
    document.getElementById('tp-desc').textContent=t.desc;
    document.getElementById('hud-goal').textContent=t.title.replace(/任务[一二三四] · /,'');
    var doors=[game.door1Open,game.door2Open,game.door3Open].filter(Boolean).length;
    document.getElementById('hud-doors').textContent=doors+' / 3';
    document.getElementById('hud-tokens').textContent=game.tokensPlaced.filter(Boolean).length+' / 4';
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

function update(dt){
    if(!game.running)return;
    if(dialogue.active){if(keys.e){keys.e=false;advanceDialogue()}return}
    var p=game.player,speed=220,dx=0;
    if(keys.left){dx=-speed*dt;p.facing=-1}
    if(keys.right){dx=speed*dt;p.facing=1}
    p.moving=dx!==0;if(p.moving)p.bob+=dt*8;
    var nx=p.x+dx;
    nx=Math.max(40,Math.min(WORLD.w-40,nx));
    p.x=nx;

    game.nearObj=null;
    for(var i=0;i<OBJECTS.length;i++){
        var obj=OBJECTS[i];
        if(obj.type==='tool'&&game.toolPicked)continue;
        if(obj.type==='lantern'&&!game.door1Open)continue;
        if(obj.type==='lantern'&&game.lanternPicked)continue;
        if(obj.type==='pattern'&&!game.lanternPicked)continue;
        if(obj.type==='pattern'&&game.patterns[obj.patIdx])continue;
        if(obj.type==='letter'&&!game.door2Open)continue;
        if(obj.type==='letter'&&game.letterPicked)continue;
        if(obj.type==='door'&&obj.dIdx===0&&game.door1Open)continue;
        if(obj.type==='door'&&obj.dIdx===1&&game.door2Open)continue;
        if(obj.type==='door'&&obj.dIdx===2&&game.door3Open)continue;
        if(obj.type==='commonLamp'&&!game.letterPicked)continue;
        if(obj.type==='commonLamp'&&game.commonLit)continue;
        if(Math.abs(p.x-obj.x)<obj.range){game.nearObj=obj;break}
    }
    var prompt=document.getElementById('interact-prompt');
    if(game.nearObj){prompt.textContent='按 E 互动：'+game.nearObj.label;prompt.style.display='block'}
    else{prompt.style.display='none'}
    if(keys.e){keys.e=false;interact()}

    var openCount=[game.door1Open,game.door2Open,game.door3Open].filter(Boolean).length;
    game.lightAlpha=openCount/3;

    var tx=p.x-W/2,ty=GROUND_Y-H*0.55;
    camera.x+=(tx-camera.x)*Math.min(1,dt*4);camera.y+=(ty-camera.y)*Math.min(1,dt*4);
    camera.x=Math.max(0,Math.min(WORLD.w-W,camera.x));camera.y=Math.max(0,Math.min(WORLD.h-H,camera.y));
}

function interact(){
    var obj=game.nearObj;if(!obj)return;
    if(obj.type==='tool'){
        if(game.task!==0){toast('工具已经送还了。',1500);return}
        if(game.toolPicked){toast('工具已经拿起来了。',1500);return}
        game.toolPicked=true;
        startDialogue([['执笔人','拾起了一把修补工具，门边有同样的修补痕迹。'],['小墨灵','这把工具是一号门住户的。去还给他吧。']],function(){toast('把工具还给一号门住户。',2000);updateTaskPanel()});
    }
    else if(obj.type==='door'){
        if(obj.dIdx===0){
            if(game.task!==0){toast('一号门已经开了。',1500);return}
            if(!game.toolPicked){toast('先找到门边的修补痕迹，找到工具的主人。',1500);return}
            game.door1Open=true;
            startDialogue([
                ['一号门住户','（开门）这是我的工具……谢谢你。'],
                ['一号门住户','我用它修好了灯架。这只灯笼给你——纹样缺了几块，二号门的人知道在哪找。'],
                ['小墨灵','门开了……里面有光。']
            ],function(){toast('获得待补灯笼。沿环廊寻找纹样碎片。',2500);game.task=1;updateTaskPanel()});
            updateTaskPanel();
        }
        else if(obj.dIdx===1){
            if(game.task!==1){toast('二号门还不能打开。',1500);return}
            if(!game.lanternDone){toast('先把灯笼补好。',1500);return}
            game.door2Open=true;
            startDialogue([
                ['二号门住户','（接过灯笼）灯笼补好了……点亮它看看。'],
                ['（环境）','灯光照亮了灯架夹层，里面藏着一封信。'],
                ['小墨灵','灯架里有一封家书！门牌写着三号。'],
                ['执笔人','去三号门送信吧。']
            ],function(){toast('获得家书。循门牌找到三号门。',2500);game.task=2;updateTaskPanel()});
            updateTaskPanel();
        }
        else if(obj.dIdx===2){
            if(game.task!==2){toast('三号门还不能打开。',1500);return}
            if(!game.letterPicked){toast('先把家书交给三号门。',1500);return}
            game.door3Open=true;
            startDialogue([
                ['三号门住户','（读信）……原来是这样。我一直以为他不想回来。'],
                ['执笔人','家书送到了。'],
                ['（环境）','几扇门相继打开，住户带着各自的灯走向中央院落。'],
                ['小墨灵','大家都出来了……可是，哪一间是我的房间？']
            ],function(){toast('把前四关信物放入长卷灯座。',2500);game.task=3;updateTaskPanel()});
            updateTaskPanel();
        }
    }
    else if(obj.type==='lantern'){
        if(game.task!==1){toast('灯笼还不能拿。',1500);return}
        game.lanternPicked=true;
        startDialogue([['执笔人','接过了一只待补的灯笼。'],['小墨灵','灯笼的纹样沿环廊延续……去找缺失的部分吧。']],function(){toast('沿环廊寻找三块纹样碎片。',2000);updateTaskPanel()});
    }
    else if(obj.type==='pattern'){
        if(game.task!==1){toast('纹样碎片还不能捡。',1500);return}
        game.patterns[obj.patIdx]=true;
        var patCount=game.patterns.filter(Boolean).length;
        startDialogue([['执笔人','拾起了一块纹样碎片。'],['小墨灵','（比对灯笼）纹样能拼上了……']],function(){
            if(patCount===3){
                toast('灯笼拼好了！交给二号门住户。',3000);
                startDialogue([['执笔人','灯笼的纹样拼好了。'],['小墨灵','去二号门吧。']],function(){game.lanternDone=true;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='letter'){
        if(game.task!==2){toast('家书还不能拿。',1500);return}
        game.letterPicked=true;
        startDialogue([['执笔人','从灯架夹层取出了家书。'],['小墨灵','门牌写着三号……循声音找到收信人。']],function(){toast('把家书送到三号门。',2000);updateTaskPanel()});
    }
    else if(obj.type==='lampSeat'){
        if(game.task!==3){toast('先完成前面的托付。',1500);return}
        var tokens=['鹤羽','渡灯','四时画笺','匠尺'];
        var placeIdx=game.tokensPlaced.filter(Boolean).length;
        if(placeIdx>=4){toast('信物已经全部放入。',1500);return}
        game.tokensPlaced[placeIdx]=true;
        startDialogue([['执笔人','将'+tokens[placeIdx]+'的墨影放入长卷灯座。'],['小墨灵','（看灯座）原来每一个地方，都有人记得我。']],function(){
            if(game.tokensPlaced.every(Boolean)){
                toast('五件信物汇入长卷！取得团圆灯芯。',3500);
                startDialogue([['（环境）','五件信物的墨影汇入长卷灯座，灯芯亮起。'],['小墨灵','原来每一个地方，都有人记得我。'],['一号门住户','到院里来吧。']],function(){game.commonLit=true;completeChapter()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='commonLamp'){
        if(game.task!==3){toast('共同的灯还不能点亮。',1500);return}
        if(!game.tokensPlaced.every(Boolean)){toast('先把前四关信物放入长卷灯座。',1500);return}
        if(game.commonLit){toast('共同的灯已经点亮。',1500);return}
        game.commonLit=true;
        startDialogue([
            ['执笔人','点亮了院中共同的灯。'],
            ['（环境）','五处古建恢复了色彩与生活声响。'],
            ['小墨灵','原来每一个地方，都有人记得我。']
        ],function(){completeChapter()});
    }
}

function completeChapter(){
    try{
        var saved=JSON.parse(localStorage.getItem('inkJourneyProgressV1')||'{}');
        if(!Array.isArray(saved.completed))saved.completed=[];
        if(saved.completed.indexOf('tulou')===-1)saved.completed.push('tulou');
        localStorage.setItem('inkJourneyProgressV1',JSON.stringify(saved));
    }catch(e){}
    document.getElementById('hud').style.display='none';
    document.getElementById('task-panel').style.display='none';
    document.getElementById('interact-prompt').style.display='none';
    document.getElementById('result-title').textContent='主线完成 · 执笔归来';
    document.getElementById('result-detail').innerHTML='五件信物汇入长卷，小墨灵终于明白：它由这些建筑中许多人留下的生活记忆汇成，所以没有唯一的房间，也没有唯一的名字。<br><br><strong style="color:#f0d38b">小墨灵："原来每一个地方，都有人记得我。"</strong><br><br>你回到神州地图，五处古建恢复了色彩与生活声响。主线成就：<strong style="color:#f0d38b">执笔归来</strong>';
    document.getElementById('result-modal').classList.add('show');
}

function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.save();ctx.translate(-camera.x,-camera.y);
    drawBackground();drawCorridor();drawCourtyard();drawDoors();drawObjects();drawPlayer();
    ctx.restore();
}
function drawBackground(){
    var grad=ctx.createLinearGradient(0,0,0,WORLD.h);
    grad.addColorStop(0,'#1a1510');grad.addColorStop(0.5,'#231c14');grad.addColorStop(1,'#161313');
    ctx.fillStyle=grad;ctx.fillRect(0,0,WORLD.w,WORLD.h);
}
function drawCorridor(){
    var l=CORRIDOR.l,r=CORRIDOR.r;
    ctx.fillStyle='#3a3228';ctx.fillRect(l,GROUND_Y,r-l,14);
    ctx.fillStyle='#4a3e2e';ctx.fillRect(l,GROUND_Y-6,r-l,8);
    ctx.fillStyle='#5a4632';ctx.fillRect(l,200,r-l,10);
    ctx.fillStyle='#6b5238';ctx.fillRect(l,192,r-l,10);
    ctx.fillStyle='#8a6d3f';
    for(var cx=l+30;cx<r-10;cx+=60){ctx.fillRect(cx,200,8,GROUND_Y-200)}
    ctx.fillStyle='#5a4632';
    ctx.beginPath();ctx.moveTo(l-15,192);ctx.lineTo((l+r)/2,155);ctx.lineTo(r+15,192);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#9e8a62';ctx.font='13px KaiTi';ctx.textAlign='center';ctx.fillText('环 廊',(l+r)/2,180);
}
function drawCourtyard(){
    var l=COURTYARD.l,r=COURTYARD.r;
    ctx.fillStyle='#3a4030';ctx.fillRect(l,GROUND_Y,r-l,14);
    ctx.fillStyle='#4a5040';ctx.fillRect(l,GROUND_Y-6,r-l,8);
    ctx.fillStyle='#9e8a62';ctx.font='12px KaiTi';ctx.textAlign='center';ctx.fillText('中央院落',(l+r)/2,GROUND_Y-50);
    if(game.lightAlpha>0){
        ctx.save();ctx.globalAlpha=game.lightAlpha*.3;
        var cg=ctx.createRadialGradient((l+r)/2,GROUND_Y-30,20,(l+r)/2,GROUND_Y-30,200);
        cg.addColorStop(0,'rgba(255,226,139,.4)');cg.addColorStop(1,'rgba(255,226,139,0)');
        ctx.fillStyle=cg;ctx.fillRect(l,GROUND_Y-230,r-l,230);ctx.restore();
    }
    if(game.commonLit){
        ctx.save();ctx.shadowColor='#f0d38b';ctx.shadowBlur=25;
        ctx.fillStyle='#ffe28b';ctx.beginPath();ctx.arc((l+r)/2,GROUND_Y-30,14,0,Math.PI*2);ctx.fill();ctx.restore();
        ctx.fillStyle='#f0d38b';ctx.font='12px KaiTi';ctx.textAlign='center';ctx.fillText('共同的灯',(l+r)/2,GROUND_Y-55);
    }
}
function drawDoors(){
    var doorXs=[200,450,750];
    var doorOpen=[game.door1Open,game.door2Open,game.door3Open];
    for(var i=0;i<3;i++){
        var dx=doorXs[i];
        ctx.fillStyle=doorOpen[i]?'#4a3828':'#3a3020';
        ctx.fillRect(dx-20,GROUND_Y-70,40,70);
        ctx.strokeStyle=doorOpen[i]?'#c8a45b':'#6b5238';ctx.lineWidth=2;
        ctx.strokeRect(dx-20,GROUND_Y-70,40,70);
        if(doorOpen[i]){
            ctx.fillStyle='rgba(255,226,139,.3)';ctx.fillRect(dx-15,GROUND_Y-65,30,60);
        }
        ctx.fillStyle=doorOpen[i]?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';
        ctx.fillText((i+1)+'号门',dx,GROUND_Y-80);
    }
}

function drawObjects(){
    for(var i=0;i<OBJECTS.length;i++){
        var obj=OBJECTS[i];var isNear=game.nearObj===obj;
        if(obj.type==='tool'){
            if(game.toolPicked)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#8a7350';ctx.fillRect(obj.x-10,GROUND_Y-20,20,14);
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-10,GROUND_Y-20,20,14);ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,GROUND_Y-30);
        }
        else if(obj.type==='lantern'){
            if(!game.door1Open||game.lanternPicked)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#c69156';ctx.beginPath();ctx.ellipse(obj.x,GROUND_Y-30,14,18,0,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,GROUND_Y-55);
        }
        else if(obj.type==='pattern'){
            if(!game.lanternPicked||game.patterns[obj.patIdx])continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#ead9b7';ctx.beginPath();
            ctx.ellipse(obj.x,GROUND_Y-12,8,5,0.3,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1;ctx.stroke();ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,GROUND_Y-25);
        }
        else if(obj.type==='letter'){
            if(!game.door2Open||game.letterPicked)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#ead9b7';ctx.fillRect(obj.x-10,GROUND_Y-35,20,15);
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-10,GROUND_Y-35,20,15);ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,GROUND_Y-45);
        }
        else if(obj.type==='lampSeat'){
            if(game.task!==3)continue;
            var tokens=['鹤羽','渡灯','四时画笺','匠尺'];
            var placeIdx=game.tokensPlaced.filter(Boolean).length;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#5a4632';ctx.fillRect(obj.x-20,GROUND_Y-45,40,45);
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-20,GROUND_Y-45,40,45);ctx.restore();
            for(var t=0;t<4;t++){
                ctx.fillStyle=game.tokensPlaced[t]?'#f0d38b':'rgba(158,138,98,.4)';
                ctx.beginPath();ctx.arc(obj.x-12+t*8,GROUND_Y-30,3,0,Math.PI*2);ctx.fill();
            }
            if(placeIdx<4){ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText('放入'+tokens[placeIdx],obj.x,GROUND_Y-55)}
            else{ctx.fillStyle='#f0d38b';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText('信物已齐',obj.x,GROUND_Y-55)}
        }
        else if(obj.type==='commonLamp'){
            if(game.task!==3||!game.tokensPlaced.every(Boolean))continue;
            if(game.commonLit)continue;
            var ly=GROUND_Y-55;
            ctx.strokeStyle='#8a6d3f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(obj.x,GROUND_Y);ctx.lineTo(obj.x,ly);ctx.stroke();
            ctx.fillStyle=isNear?'#ffe28b':'#5a4632';ctx.beginPath();ctx.arc(obj.x,ly-8,10,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.stroke();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,ly-25);
        }
    }
}
function drawPlayer(){
    var p=game.player,fy=GROUND_Y,bob=p.moving?Math.sin(p.bob)*2:0,px=p.x,py=fy+bob;
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