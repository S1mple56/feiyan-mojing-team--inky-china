'use strict';
var canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
var W=0,H=0,DPR=1;
var WORLD={w:1800,h:800};
var TOWER={l:80,r:680};
var FLOORS=[{y:660,ceil:480,name:'底层'},{y:480,ceil:300,name:'中层'},{y:300,ceil:120,name:'上层'}];
var STAIRS=[{x1:190,x2:310,from:0,to:1},{x1:410,x2:530,from:1,to:2}];
var FERRY={l:700,r:1700,shoreY:660,riverTop:600,riverBot:760};
var OBJECTS=[
    {id:'wall',label:'题壁',floor:1,x:150,range:60,type:'fragment',fragIdx:0},
    {id:'screen',label:'屏风',floor:2,x:350,range:60,type:'fragment',fragIdx:1},
    {id:'railing',label:'栏杆',floor:2,x:610,range:60,type:'fragment',fragIdx:2},
    {id:'win_tree',label:'树影窗',floor:0,x:620,range:60,type:'window',winIdx:0},
    {id:'win_sail',label:'帆影窗',floor:1,x:620,range:60,type:'window',winIdx:1},
    {id:'win_twilight',label:'暮色窗',floor:2,x:620,range:60,type:'window',winIdx:2},
    {id:'sender',label:'送行人',floor:0,x:1000,range:70,type:'char',charIdx:0,outside:true},
    {id:'traveler',label:'旅人',floor:0,x:1150,range:70,type:'char',charIdx:1,outside:true},
    {id:'lamp',label:'岸灯',floor:0,x:1300,range:60,type:'lamp',outside:true}
];
var TASKS=[
    {title:'任务一 · 拼合信件',desc:'在题壁、屏风和栏杆旁找到三片信纸，借夕照拼出江景线索。'},
    {title:'任务二 · 打开窗景',desc:'按顺序打开三处窗景：树影 → 帆影 → 暮色。'},
    {title:'任务三 · 寻找渡口',desc:'循光路下楼，走出楼门，来到渡口。'},
    {title:'任务四 · 完成告别',desc:'读出祝愿，把信交给旅人，点亮岸灯。'}
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
    game={running:false,player:{x:350,floor:0,facing:1,moving:false,bob:0},task:0,
        fragments:[false,false,false],windows:[false,false,false],
        ferryReached:false,blessingRead:false,letterGiven:false,lampLit:false,
        senderTalked:false,travelerTalked:false,boatDeparted:false,nearbyObj:null,lightPathAlpha:0};
    camera.x=game.player.x-W/2;camera.y=game.player.y-H/2;
}
function startGame(){
    resetGame();game.running=true;
    document.getElementById('start-screen').classList.add('hide');
    document.getElementById('hud').style.display='block';
    document.getElementById('task-panel').style.display='block';
    document.getElementById('top-actions').style.display='flex';
    updateTaskPanel();
    toast('你在黄鹤楼底层醒来，暮色将尽。',3000);
}
function updateTaskPanel(){
    var t=TASKS[game.task]||{title:'本章完成',desc:'告别已完成。'};
    document.getElementById('tp-title').textContent=t.title;
    document.getElementById('tp-desc').textContent=t.desc;
    document.getElementById('hud-goal').textContent=t.title.replace(/任务[一二三四] · /,'');
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
    var line=dialogue.queue[dialogue.index];
    document.getElementById('dialogue-speaker').textContent=line[0];
    document.getElementById('dialogue-text').textContent=line[1];
}
function advanceDialogue(){if(!dialogue.active)return;dialogue.index++;showDialogueLine()}

function isNearStair(){
    for(var i=0;i<STAIRS.length;i++){
        var s=STAIRS[i];
        if(game.player.x>=s.x1&&game.player.x<=s.x2){
            if(game.player.floor===s.from)return{dir:'up',to:s.to,stair:i};
            if(game.player.floor===s.to)return{dir:'down',to:s.from,stair:i};
        }
    }
    return null;
}

function update(dt){
    if(!game.running)return;
    if(dialogue.active){if(keys.e){keys.e=false;advanceDialogue()}return}
    var p=game.player,speed=220,dx=0;
    if(keys.left){dx=-speed*dt;p.facing=-1}
    if(keys.right){dx=speed*dt;p.facing=1}
    p.moving=dx!==0;if(p.moving)p.bob+=dt*8;
    var nx=p.x+dx;
    var maxX=(game.ferryReached||game.task>=2)?FERRY.r-40:TOWER.r;
    nx=Math.max(TOWER.l+20,Math.min(maxX,nx));
    p.x=nx;
    var stair=isNearStair();
    if(stair){
        if(stair.dir==='up'&&keys.up){keys.up=false;p.floor=stair.to;p.x=(STAIRS[stair.stair].x1+STAIRS[stair.stair].x2)/2;toast('上楼 → '+FLOORS[p.floor].name,1200)}
        if(stair.dir==='down'&&keys.down){keys.down=false;p.floor=stair.to;p.x=(STAIRS[stair.stair].x1+STAIRS[stair.stair].x2)/2;toast('下楼 → '+FLOORS[p.floor].name,1200)}
    }
    if(game.task>=2&&!game.ferryReached&&p.floor===0&&p.x>TOWER.r-30){
        game.ferryReached=true;
        toast('你走出楼门，江风扑面。光路通向渡口。',3000);updateTaskPanel();
    }
    game.nearbyObj=null;
    for(var i=0;i<OBJECTS.length;i++){
        var obj=OBJECTS[i];
        if(obj.outside&&!game.ferryReached)continue;
        if(obj.outside){if(p.floor!==0)continue}
        else if(obj.floor!==p.floor)continue;
        if(Math.abs(p.x-obj.x)<obj.range){game.nearbyObj=obj;break}
    }
    var prompt=document.getElementById('interact-prompt');
    if(game.nearbyObj){prompt.textContent='按 E 互动：'+game.nearbyObj.label;prompt.style.display='block'}
    else{prompt.style.display='none'}
    if(keys.e){keys.e=false;interact()}
    if(game.task===1&&game.windows.every(Boolean))game.lightPathAlpha=Math.min(1,game.lightPathAlpha+dt*0.5);
    else if(game.task>=2)game.lightPathAlpha=1;
    var tx=p.x-W/2,ty=FLOORS[p.floor].y-H*0.55;
    camera.x+=(tx-camera.x)*Math.min(1,dt*4);camera.y+=(ty-camera.y)*Math.min(1,dt*4);
    camera.x=Math.max(0,Math.min(WORLD.w-W,camera.x));camera.y=Math.max(0,Math.min(WORLD.h-H,camera.y));
}

function interact(){
    var obj=game.nearbyObj;if(!obj)return;
    if(obj.type==='fragment'){
        if(game.task!==0){toast('信纸已经拼合完成。',1500);return}
        if(game.fragments[obj.fragIdx]){toast('这片信纸已经拾起。',1500);return}
        game.fragments[obj.fragIdx]=true;
        var names=['题壁上的信纸','屏风后的信纸','栏杆旁的信纸'];
        var fragCount=game.fragments.filter(Boolean).length;
        startDialogue([['执笔人','拾起了'+names[obj.fragIdx]+'。字迹借着夕照浮现……'],['小墨灵','（凑近看）这片纸上画着一处江景！']],function(){
            if(fragCount===3){
                toast('三片信纸拼合完成！近岸树影 → 远处帆影 → 江面暮色。',3500);
                startDialogue([['执笔人','信件拼合完成：近岸树影 → 远处帆影 → 江面暮色。'],['小墨灵','信末还有一句未送出的祝愿……原来如此。'],['小墨灵','接下来按顺序打开三处窗景：先树影，再帆影，最后暮色。']],function(){game.task=1;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='window'){
        if(game.task===0){toast('先找到三片信纸，拼出打开窗景的顺序。',2000);return}
        if(game.task>1){toast('窗景已经全部打开。',1500);return}
        if(game.windows[obj.winIdx]){toast('这扇窗已经打开。',1500);return}
        var expected=game.windows.filter(Boolean).length;
        if(obj.winIdx!==expected){toast('顺序不对。信中写着：先近岸树影，再远处帆影，最后江面暮色。',3000);return}
        game.windows[obj.winIdx]=true;
        var winNames=['树影窗','帆影窗','暮色窗'];
        var winDescs=['窗外：近岸的树影在风中摇曳，江水缓缓流动。','窗外：远处的帆影点点，一艘船正要离岸。','窗外：横在江面的暮色铺展开来，渡口的轮廓隐约可见。'];
        startDialogue([['执笔人','打开了'+winNames[obj.winIdx]+'。'],['小墨灵',winDescs[obj.winIdx]]],function(){
            if(game.windows.every(Boolean)){
                toast('三处窗景连成光路！渡口显现，下楼的路开启了。',3500);
                startDialogue([['小墨灵','三处窗景的光连成一条路……通向江边的渡口！'],['执笔人','下楼吧，循着光走。']],function(){game.task=2;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='char'&&obj.charIdx===0){
        if(game.task===2){
            if(!game.senderTalked){
                game.senderTalked=true;
                startDialogue([
                    ['送行人','你……你是谁？别过来。'],
                    ['执笔人','我是一名执笔人。我看到你一直望着渡口。'],
                    ['送行人','那封信……我写好了，却始终送不出去。'],
                    ['小墨灵','为什么？'],
                    ['送行人','……我怕。怕这封信送出去以后，他就再也不会回来了。'],
                    ['执笔人','可是，不送出这封信，他就永远不会知道你的心意。'],
                    ['小墨灵','先把信末的祝愿读给他听吧。也许读出来，你就不怕了。'],
                    ['送行人','（沉默）……祝愿……我写的是："你往前走，我会记得这一程。"'],
                    ['执笔人','说出来吧。把这封信交给旅人。'],
                    ['送行人','（深吸一口气）好。']
                ],function(){game.blessingRead=true;toast('送行人终于说出了祝愿。把信交给旅人吧。',3000);updateTaskPanel()});
            }else if(!game.letterGiven){toast('把信交给旅人吧。',1500)}
        }
        else if(game.task===3){
            if(!game.blessingRead){toast('先读出信末的祝愿。',1500)}
            else if(!game.letterGiven){toast('把信交给旅人。',1500)}
        }
    }
    else if(obj.type==='char'&&obj.charIdx===1){
        if(game.task===2||game.task===3){
            if(!game.blessingRead){toast('送行人还没准备好。先和他谈谈。',2000);return}
            if(game.letterGiven){toast('信已经交给旅人了。',1500);return}
            game.letterGiven=true;
            startDialogue([['旅人','这是……给我的信？'],['执笔人','是的。他一直想送给你，却害怕你不再回来。'],['旅人','（读信）"你往前走，我会记得这一程。"……'],['旅人','告诉他，我会回来的。这条路，我一直记着。'],['小墨灵','信送到了……可是，渡口的灯还亮着。'],['执笔人','最后一步：点亮岸灯，让船知道方向。']],function(){
                toast('信已送达。点亮岸灯，完成告别。',3000);game.task=3;updateTaskPanel();
            });
            updateTaskPanel();
        }
    }
    else if(obj.type==='lamp'){
        if(game.task<3){toast('这盏灯还不能点亮。',1500);return}
        if(game.lampLit){toast('岸灯已经点亮。',1500);return}
        game.lampLit=true;
        startDialogue([['执笔人','点亮了渡口的岸灯。'],['送行人','你往前走，我会记得这一程。'],['小墨灵','……时间，终于向前了。'],['（环境）','江水开始流动，风声渐起。船离岸，暮色中的光路缓缓消散。'],['小墨灵','楼不是为了把人留下。']],function(){
            game.boatDeparted=true;game.task=4;completeChapter();
        });
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
    document.getElementById('result-title').textContent='获得信物 · 鹤羽';
    document.getElementById('result-detail').innerHTML='一枚墨色鹤羽落在空白信封上，化为信物。<br><br><strong style="color:#f0d38b">小墨灵："楼不是为了把人留下。"</strong><br><br>第一段记忆已恢复。回到主线，继续下一段旅程。';
    document.getElementById('result-modal').classList.add('show');
}

function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.save();ctx.translate(-camera.x,-camera.y);
    drawBackground();drawTower();drawFerryArea();drawLightPath();drawObjects();drawPlayer();
    ctx.restore();
}
function drawBackground(){
    var grad=ctx.createLinearGradient(0,0,0,WORLD.h);
    grad.addColorStop(0,'#1a1510');grad.addColorStop(0.5,'#231c14');grad.addColorStop(1,'#161313');
    ctx.fillStyle=grad;ctx.fillRect(0,0,WORLD.w,WORLD.h);
    var sunX=520,sunY=80;
    var sunGrad=ctx.createRadialGradient(sunX,sunY,10,sunX,sunY,120);
    sunGrad.addColorStop(0,'rgba(240,200,100,.5)');sunGrad.addColorStop(1,'rgba(240,200,100,0)');
    ctx.fillStyle=sunGrad;ctx.fillRect(sunX-120,sunY-120,240,240);
    ctx.fillStyle='rgba(230,180,80,.6)';ctx.beginPath();ctx.arc(sunX,sunY,22,0,Math.PI*2);ctx.fill();
}
function drawTower(){
    var l=TOWER.l,r=TOWER.r;
    ctx.fillStyle='#2a2218';ctx.fillRect(l-15,100,r-l+30,580);
    for(var f=0;f<3;f++){
        var fy=FLOORS[f].y,ceil=FLOORS[f].ceil;
        ctx.fillStyle='#352a1e';ctx.fillRect(l,ceil,r-l,fy-ceil);
        ctx.fillStyle='#4a3828';ctx.fillRect(l-8,fy,r-l+16,14);
        ctx.fillStyle='#5a4632';ctx.fillRect(l-8,ceil-8,r-l+16,10);
        ctx.fillStyle='#6b5238';ctx.fillRect(l-12,ceil,14,fy-ceil);ctx.fillRect(r-2,ceil,14,fy-ceil);
        ctx.fillStyle='#8a6d3f';ctx.fillRect(l+40,ceil,8,fy-ceil);ctx.fillRect(r-48,ceil,8,fy-ceil);
        ctx.fillStyle='#f0d38b';ctx.font='13px KaiTi';ctx.textAlign='left';ctx.fillText(FLOORS[f].name,l+15,ceil+22);
    }
    ctx.fillStyle='#5a4632';ctx.beginPath();ctx.moveTo(l-40,100);ctx.lineTo((l+r)/2,30);ctx.lineTo(r+40,100);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#c8a45b';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#6b5238';ctx.beginPath();ctx.moveTo(l-50,105);ctx.quadraticCurveTo(l-20,95,l,100);ctx.lineTo(r,100);ctx.quadraticCurveTo(r+20,95,r+50,105);ctx.lineTo(r+40,90);ctx.lineTo((l+r)/2,22);ctx.lineTo(l-40,90);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#c8a45b';ctx.lineWidth=2;ctx.stroke();
    for(var i=0;i<STAIRS.length;i++){
        var s=STAIRS[i],fy1=FLOORS[s.from].y,fy2=FLOORS[s.to].y;
        ctx.strokeStyle='#8a6d3f';ctx.lineWidth=3;
        for(var j=0;j<8;j++){var sx=s.x1+(s.x2-s.x1)*(j/8),sy=fy1+(fy2-fy1)*((j+1)/8);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+(s.x2-s.x1)/8,sy);ctx.stroke()}
        ctx.strokeStyle='#6b5238';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(s.x1,fy1);ctx.lineTo(s.x2,fy2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(s.x2,fy1);ctx.lineTo(s.x1,fy2);ctx.stroke();
    }
    for(var f=0;f<3;f++){
        var wy=FLOORS[f].ceil+40,ww=50,wh=60,wx=r-ww-20;
        if(game.windows[f]){
            var colors=['#779764','#bbd2d2','#cb8250'];
            ctx.fillStyle=colors[f];ctx.globalAlpha=.85;ctx.fillRect(wx,wy,ww,wh);ctx.globalAlpha=1;
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=2;ctx.strokeRect(wx,wy,ww,wh);
        }else{ctx.fillStyle='#1e1a14';ctx.fillRect(wx,wy,ww,wh);ctx.strokeStyle='#5a4632';ctx.lineWidth=2;ctx.strokeRect(wx,wy,ww,wh)}
        ctx.fillStyle='#9e8a62';ctx.font='10px KaiTi';ctx.textAlign='center';ctx.fillText(['树影窗','帆影窗','暮色窗'][f],wx+ww/2,wy-6);
    }
    ctx.fillStyle='#4a3828';ctx.fillRect(r,620,60,40);
    ctx.fillStyle='#2a2218';ctx.fillRect(r+10,625,40,35);
    ctx.fillStyle='#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText('楼门',r+30,615);
}
function drawFerryArea(){
    var l=FERRY.l,r=FERRY.r;
    ctx.fillStyle='#3a3020';ctx.fillRect(l,FERRY.shoreY,r-l,WORLD.h-FERRY.shoreY);
    ctx.fillStyle='#4a6670';ctx.fillRect(l,FERRY.riverTop,r-l,FERRY.riverBot-FERRY.riverTop);
    ctx.strokeStyle='rgba(160,200,210,.25)';ctx.lineWidth=1.5;
    for(var wy=FERRY.riverTop+10;wy<FERRY.riverBot;wy+=18){ctx.beginPath();ctx.moveTo(l,wy);for(var wx=l;wx<r;wx+=40){ctx.quadraticCurveTo(wx+10,wy+Math.sin(animTime*1.5+wx*.02)*3,wx+20,wy)}ctx.stroke()}
    ctx.fillStyle='#5a4632';ctx.fillRect(l,FERRY.shoreY,30,10);
    ctx.fillStyle='#6b5238';ctx.fillRect(1250,FERRY.shoreY-15,120,15);
    if(game.boatDeparted){
        var bx=1400+animTime*20;
        ctx.fillStyle='#5a4632';ctx.beginPath();ctx.moveTo(bx,FERRY.riverTop-10);ctx.lineTo(bx+80,FERRY.riverTop-10);ctx.lineTo(bx+70,FERRY.riverTop+5);ctx.lineTo(bx+10,FERRY.riverTop+5);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.stroke();
        ctx.fillStyle='#ead9b7';ctx.beginPath();ctx.moveTo(bx+40,FERRY.riverTop-10);ctx.lineTo(bx+40,FERRY.riverTop-40);ctx.lineTo(bx+65,FERRY.riverTop-15);ctx.closePath();ctx.fill();
    }else{
        ctx.fillStyle='#5a4632';ctx.beginPath();ctx.moveTo(1400,FERRY.riverTop);ctx.lineTo(1480,FERRY.riverTop);ctx.lineTo(1470,FERRY.riverTop+12);ctx.lineTo(1410,FERRY.riverTop+12);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.stroke();
        ctx.fillStyle='#ead9b7';ctx.beginPath();ctx.moveTo(1440,FERRY.riverTop);ctx.lineTo(1440,FERRY.riverTop-35);ctx.lineTo(1465,FERRY.riverTop-8);ctx.closePath();ctx.fill();
    }
    if(game.ferryReached){ctx.fillStyle='#f0d38b';ctx.font='13px KaiTi';ctx.textAlign='center';ctx.fillText('渡 口',1100,FERRY.shoreY-60)}
}
function drawLightPath(){
    if(game.lightPathAlpha<=0)return;
    ctx.save();ctx.globalAlpha=game.lightPathAlpha;
    ctx.strokeStyle='#f0d38b';ctx.lineWidth=3;ctx.setLineDash([8,6]);
    ctx.beginPath();ctx.moveTo(TOWER.r,FERRY.shoreY-20);ctx.quadraticCurveTo(900,FERRY.shoreY-35,1100,FERRY.shoreY-15);ctx.stroke();ctx.setLineDash([]);
    for(var i=0;i<8;i++){var lx=750+i*45,ly=FERRY.shoreY-25-Math.sin(i*.8)*8,alpha=.4+.3*Math.sin(animTime*3+i);ctx.fillStyle='rgba(240,211,139,'+alpha+')';ctx.beginPath();ctx.arc(lx,ly,3,0,Math.PI*2);ctx.fill()}
    ctx.restore();
}
function drawObjects(){
    for(var i=0;i<OBJECTS.length;i++){
        var obj=OBJECTS[i];
        if(obj.outside&&!game.ferryReached)continue;
        if(obj.outside)drawFerryObject(obj);else drawTowerObject(obj);
    }
}
function drawTowerObject(obj){
    var fy=FLOORS[obj.floor].y,isNear=game.nearbyObj===obj;
    if(obj.type==='fragment'){
        if(game.fragments[obj.fragIdx])return;
        ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=15}
        ctx.fillStyle='#ead9b7';ctx.fillRect(obj.x-12,fy-40,24,30);
        ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-12,fy-40,24,30);
        ctx.fillStyle='#8a6d3f';ctx.font='9px KaiTi';ctx.textAlign='center';ctx.fillText('信',obj.x,fy-22);ctx.restore();
        ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,fy-50);
    }
    else if(obj.type==='window'){
        if(game.windows[obj.winIdx])return;
        var wx=obj.x-25,wy=FLOORS[obj.floor].ceil+40;
        if(isNear){ctx.save();ctx.shadowColor='#f0d38b';ctx.shadowBlur=12;ctx.strokeStyle='#f0d38b';ctx.lineWidth=2.5;ctx.strokeRect(wx,wy,50,60);ctx.restore()}
    }
    else if(obj.type==='railing'){
        var ry=FLOORS[obj.floor].y-50;
        ctx.strokeStyle='#8a6d3f';ctx.lineWidth=2;
        for(var rx=obj.x-30;rx<=obj.x+30;rx+=12){ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx,ry+50);ctx.stroke()}
        ctx.beginPath();ctx.moveTo(obj.x-35,ry);ctx.lineTo(obj.x+35,ry);ctx.stroke();
        if(!game.fragments[obj.fragIdx]){ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=15}ctx.fillStyle='#ead9b7';ctx.fillRect(obj.x-10,ry-15,20,22);ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-10,ry-15,20,22);ctx.restore()}
        ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,ry-22);
    }
    else if(obj.type==='screen'){
        if(game.fragments[obj.fragIdx])return;
        var sy=fy-70;ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=15}
        ctx.fillStyle='#5a4632';ctx.fillRect(obj.x-25,sy,50,70);ctx.strokeStyle='#c8a45b';ctx.lineWidth=2;ctx.strokeRect(obj.x-25,sy,50,70);
        ctx.fillStyle='#ead9b7';ctx.fillRect(obj.x-10,sy+20,20,28);ctx.strokeStyle='#c8a45b';ctx.lineWidth=1;ctx.strokeRect(obj.x-10,sy+20,20,28);ctx.restore();
        ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,sy-8);
    }
    else if(obj.type==='wall'){
        if(game.fragments[obj.fragIdx])return;
        ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=15}
        ctx.fillStyle='#ead9b7';ctx.fillRect(obj.x-12,fy-45,24,30);ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-12,fy-45,24,30);
        ctx.fillStyle='#8a6d3f';ctx.font='9px KaiTi';ctx.textAlign='center';ctx.fillText('信',obj.x,fy-27);ctx.restore();
        ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,fy-55);
    }
}
function drawFerryObject(obj){
    var sy=FERRY.shoreY,isNear=game.nearbyObj===obj;
    if(obj.type==='char'&&obj.charIdx===0){
        drawPerson(obj.x,sy,'#3a3020','#c8a45b',isNear);
        ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='12px KaiTi';ctx.textAlign='center';ctx.fillText('送行人',obj.x,sy-58);
        if(game.blessingRead&&!game.letterGiven){ctx.fillStyle='#f0d38b';ctx.font='16px KaiTi';ctx.fillText('…',obj.x,sy-70)}
    }
    else if(obj.type==='char'&&obj.charIdx===1){
        drawPerson(obj.x,sy,'#4a3828','#ead9b7',isNear);
        ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='12px KaiTi';ctx.textAlign='center';ctx.fillText('旅人',obj.x,sy-58);
        if(game.blessingRead&&!game.letterGiven){ctx.fillStyle='#f0d38b';ctx.font='14px KaiTi';ctx.fillText('?',obj.x,sy-70)}
    }
    else if(obj.type==='lamp'){
        var ly=sy-55;ctx.strokeStyle='#8a6d3f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(obj.x,sy);ctx.lineTo(obj.x,ly);ctx.stroke();
        ctx.fillStyle=game.lampLit?'#ffe28b':'#5a4632';ctx.beginPath();ctx.arc(obj.x,ly-8,10,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.stroke();
        if(game.lampLit){var lg=ctx.createRadialGradient(obj.x,ly-8,5,obj.x,ly-8,40);lg.addColorStop(0,'rgba(255,226,139,.5)');lg.addColorStop(1,'rgba(255,226,139,0)');ctx.fillStyle=lg;ctx.fillRect(obj.x-40,ly-48,80,80)}
        ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText('岸灯',obj.x,ly-25);
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
    var p=game.player,fy=FLOORS[p.floor].y,bob=p.moving?Math.sin(p.bob)*2:0,px=p.x,py=fy+bob;
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