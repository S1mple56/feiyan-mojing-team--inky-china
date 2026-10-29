'use strict';
var canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
var W=0,H=0,DPR=1;
var WORLD={w:2000,h:800};
var GROUND_Y=480;
var CORRIDOR={l:60,r:1100};
var COURTYARD={l:1100,r:1600};
var ROCKERY={l:1600,r:2000};
var OBJECTS=[
    {id:'paint_tree',label:'树影画',x:180,range:55,type:'painting',pIdx:0},
    {id:'paint_shore',label:'水岸画',x:380,range:55,type:'painting',pIdx:1},
    {id:'paint_pavilion',label:'亭角画',x:580,range:55,type:'painting',pIdx:2},
    {id:'paint_rock',label:'山石画',x:780,range:55,type:'painting',pIdx:3},
    {id:'win_round',label:'圆窗',x:280,range:50,type:'window',wIdx:0},
    {id:'win_long',label:'长窗',x:480,range:50,type:'window',wIdx:1},
    {id:'win_fan',label:'扇窗',x:680,range:50,type:'window',wIdx:2},
    {id:'win_leaky',label:'漏窗',x:880,range:50,type:'window',wIdx:3},
    {id:'screen1',label:'屏风 · 圆窗',x:280,range:50,type:'screen',sIdx:0},
    {id:'screen2',label:'屏风 · 长窗',x:480,range:50,type:'screen',sIdx:1},
    {id:'screen3',label:'屏风 · 扇窗',x:680,range:50,type:'screen',sIdx:2},
    {id:'screen4',label:'屏风 · 漏窗',x:880,range:50,type:'screen',sIdx:3},
    {id:'watergate',label:'水闸',x:1700,range:60,type:'watergate'},
    {id:'pos_spring',label:'春雨位',x:1200,range:55,type:'seasonPos',seIdx:0},
    {id:'pos_summer',label:'夏声位',x:1320,range:55,type:'seasonPos',seIdx:1},
    {id:'pos_autumn',label:'秋叶位',x:1440,range:55,type:'seasonPos',seIdx:2},
    {id:'pos_winter',label:'冬影位',x:1560,range:55,type:'seasonPos',seIdx:3},
    {id:'autumn_leaf',label:'秋叶',x:1440,range:55,type:'leaf'},
    {id:'painter',label:'画师',x:1850,range:70,type:'painter'}
];
var TASKS=[
    {title:'任务一 · 认出四幅景',desc:'沿回廊找到四幅景画，透过漏窗辨认园中景色。'},
    {title:'任务二 · 找到真正的路径',desc:'按顺序调整四处屏风，让回廊不再重复，显露假山后的水闸。'},
    {title:'任务三 · 让四季归位',desc:'开启水闸，让水流恢复，将四幅画放回对应位置。'},
    {title:'任务四 · 完成新的画',desc:'把秋叶放入画面，让画师落下最后一笔。'}
];
var keys={left:false,right:false,up:false,down:false,e:false};
var game={};
var camera={x:0,y:0};
var dialogue={active:false,queue:[],index:0,onDone:null};
var toastTimer=null;
var animTime=0;
var SCREEN_ORDER=[2,3,0,1];

function resize(){DPR=Math.max(1,Math.min(window.devicePixelRatio||1,2));W=window.innerWidth;H=window.innerHeight;canvas.width=Math.floor(W*DPR);canvas.height=Math.floor(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0)}
window.addEventListener('resize',resize);resize();

function resetGame(){
    keys.left=keys.right=keys.up=keys.down=keys.e=false;
    game={running:false,player:{x:120,facing:1,moving:false,bob:0},task:0,
        paintings:[false,false,false,false],windows:[false,false,false,false],
        screens:[false,false,false,false],screensDone:false,
        waterOpen:false,seasonsPlaced:[false,false,false,false],
        leafPicked:false,leafPlaced:false,painterDone:false,
        nearObj:null,flowAlpha:0};
    camera.x=0;camera.y=0;
}

function startGame(){
    resetGame();game.running=true;
    document.getElementById('start-screen').classList.add('hide');
    document.getElementById('hud').style.display='block';
    document.getElementById('task-panel').style.display='block';
    document.getElementById('top-actions').style.display='flex';
    updateTaskPanel();
    toast('你步入拙政园，花盛开，水不流。',3000);
}
function updateTaskPanel(){
    var t=TASKS[game.task]||{title:'本章完成',desc:'新的画已完成。'};
    document.getElementById('tp-title').textContent=t.title;
    document.getElementById('tp-desc').textContent=t.desc;
    document.getElementById('hud-goal').textContent=t.title.replace(/任务[一二三四] · /,'');
    document.getElementById('hud-paintings').textContent=game.paintings.filter(Boolean).length+' / 4';
    document.getElementById('hud-screens').textContent=game.screens.filter(Boolean).length+' / 4';
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
        if(obj.type==='leaf'&&(!game.waterOpen||game.leafPicked))continue;
        if(obj.type==='seasonPos'&&!game.waterOpen)continue;
        if(obj.type==='watergate'&&game.waterOpen)continue;
        if(obj.type==='screen'&&game.screensDone)continue;
        if(obj.type==='painter'&&game.painterDone)continue;
        if(Math.abs(p.x-obj.x)<obj.range){game.nearObj=obj;break}
    }
    var prompt=document.getElementById('interact-prompt');
    if(game.nearObj){prompt.textContent='按 E 互动：'+game.nearObj.label;prompt.style.display='block'}
    else{prompt.style.display='none'}
    if(keys.e){keys.e=false;interact()}

    if(game.waterOpen)game.flowAlpha=Math.min(1,game.flowAlpha+dt*0.5);

    var tx=p.x-W/2,ty=GROUND_Y-H*0.55;
    camera.x+=(tx-camera.x)*Math.min(1,dt*4);camera.y+=(ty-camera.y)*Math.min(1,dt*4);
    camera.x=Math.max(0,Math.min(WORLD.w-W,camera.x));camera.y=Math.max(0,Math.min(WORLD.h-H,camera.y));
}

function interact(){
    var obj=game.nearObj;if(!obj)return;
    if(obj.type==='painting'){
        if(game.task!==0){toast('景画已经找齐了。',1500);return}
        if(game.paintings[obj.pIdx]){toast('这幅画已经看过。',1500);return}
        game.paintings[obj.pIdx]=true;
        var pNames=['树影画','水岸画','亭角画','山石画'];
        var pCount=game.paintings.filter(Boolean).length;
        startDialogue([['执笔人','拾起了'+pNames[obj.pIdx]+'，画中只有局部景物。'],['小墨灵','透过漏窗看看，也许能对应到园中的景色。']],function(){
            if(pCount===4){
                toast('四幅景画找齐！透过漏窗辨认顺序。',3500);
                startDialogue([['执笔人','四幅画分别是：树影、水岸、亭角、山石。'],['小墨灵','透过不同形状的窗，把它们和园中景色对应起来。']],function(){game.task=0;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='window'){
        if(game.task!==0){toast('窗景已经看过了。',1500);return}
        if(game.windows[obj.wIdx]){toast('这扇窗已经看过。',1500);return}
        if(!game.paintings.every(Boolean)){toast('先找到四幅景画。',1500);return}
        game.windows[obj.wIdx]=true;
        var wNames=['圆窗 · 树影','长窗 · 水岸','扇窗 · 亭角','漏窗 · 山石'];
        var wCount=game.windows.filter(Boolean).length;
        startDialogue([['执笔人','透过'+wNames[obj.wIdx]+'，画中的景物与园中对应上了。'],['小墨灵','背面好像有字……是游览顺序！']],function(){
            if(wCount===4){
                toast('游览顺序：扇窗 → 漏窗 → 圆窗 → 长窗。',3500);
                startDialogue([['执笔人','游览顺序：扇窗 → 漏窗 → 圆窗 → 长窗。'],['小墨灵','按这个顺序调整屏风，回廊也许就不重复了。']],function(){game.task=1;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='screen'){
        if(game.task!==1){toast('先找到游览顺序。',1500);return}
        if(game.screens[obj.sIdx]){toast('这扇屏风已经调整过了。',1500);return}
        var expected=game.screens.filter(Boolean).length;
        if(obj.sIdx!==SCREEN_ORDER[expected]){toast('顺序不对。游览顺序：扇窗 → 漏窗 → 圆窗 → 长窗。',3000);return}
        game.screens[obj.sIdx]=true;
        var sNames=['圆窗屏风','长窗屏风','扇窗屏风','漏窗屏风'];
        var sCount=game.screens.filter(Boolean).length;
        startDialogue([['执笔人','调整了'+sNames[obj.sIdx]+'。'],['小墨灵','回廊不再重复了……假山后面好像有什么。']],function(){
            if(sCount===4){
                toast('回廊不再重复！假山后的水闸显现。',3500);
                startDialogue([['小墨灵','假山后面有一道水闸！'],['执笔人','打开它，让水流恢复。']],function(){game.task=2;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='watergate'){
        if(game.task!==2){toast('水闸还不能打开。',1500);return}
        if(game.waterOpen){toast('水闸已经打开。',1500);return}
        game.waterOpen=true;
        startDialogue([['执笔人','打开了水闸。'],['（环境）','水流恢复，倒影开始流动。'],['小墨灵','四幅画的背面出现了季节标记！'],['执笔人','把它们放回对应的位置。']],function(){toast('将四幅画放回对应位置。',2500);updateTaskPanel()});
    }
    else if(obj.type==='seasonPos'){
        if(game.task!==2){toast('先打开水闸。',1500);return}
        if(game.seasonsPlaced[obj.seIdx]){toast('这幅画已经放好了。',1500);return}
        game.seasonsPlaced[obj.seIdx]=true;
        var seNames=['春雨画','夏声画','秋叶画','冬影画'];
        var seCount=game.seasonsPlaced.filter(Boolean).length;
        startDialogue([['执笔人','放回了'+seNames[obj.seIdx]+'。'],['小墨灵','园中出现了'+seNames[obj.seIdx].replace('画','')+'……']],function(){
            if(seCount===4){
                toast('四季归位！园中重现春雨、夏声、秋叶与冬影。',3500);
                startDialogue([['小墨灵','四季回来了……可是水院里有一片落叶。'],['执笔人','去水院看看。']],function(){game.task=3;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='leaf'){
        if(game.task!==3){toast('这片叶子还不能捡。',1500);return}
        game.leafPicked=true;
        startDialogue([['执笔人','捡起了一片秋叶。'],['小墨灵','画师想把落叶清走，恢复原来的春景……'],['执笔人','可是，这片落叶也是时间留下的痕迹。']],function(){toast('把秋叶带给画师。',2000);updateTaskPanel()});
    }
    else if(obj.type==='painter'){
        if(game.task!==3){toast('画师还在等待。',1500);return}
        if(!game.leafPicked){toast('先去水院捡起秋叶。',1500);return}
        if(game.leafPlaced){toast('画已经完成了。',1500);return}
        game.leafPlaced=true;
        startDialogue([
            ['画师','把落叶清走吧，恢复原来的春景。'],
            ['执笔人','可是……这片落叶，也是时间留下的痕迹。'],
            ['画师','（沉默）……'],
            ['小墨灵','让时间经过，也许会有另一种好看。'],
            ['画师','（看着落叶）……你说得对。'],
            ['画师','（落下最后一笔）下次来，也许会有另一种好看。']
        ],function(){game.painterDone=true;completeChapter()});
    }
}

function completeChapter(){
    try{
        var saved=JSON.parse(localStorage.getItem('inkJourneyProgressV1')||'{}');
        if(!Array.isArray(saved.completed))saved.completed=[];
        if(saved.completed.indexOf('zhuozheng')===-1)saved.completed.push('zhuozheng');
        localStorage.setItem('inkJourneyProgressV1',JSON.stringify(saved));
    }catch(e){}
    document.getElementById('hud').style.display='none';
    document.getElementById('task-panel').style.display='none';
    document.getElementById('interact-prompt').style.display='none';
    document.getElementById('result-title').textContent='获得信物 · 四时画笺';
    document.getElementById('result-detail').innerHTML='带有落叶与残荷的四时画笺，让静止的春天重新拥有变化。<br><br><strong style="color:#f0d38b">小墨灵："留一扇窗，让时间经过。"</strong><br><br>第三段记忆已恢复。回到主线，继续下一段旅程。';
    document.getElementById('result-modal').classList.add('show');
}

function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.save();ctx.translate(-camera.x,-camera.y);
    drawBackground();drawCorridor();drawWindows();drawScreens();drawCourtyard();drawRockery();drawWater();drawObjects();drawPlayer();
    ctx.restore();
}
function drawBackground(){
    var grad=ctx.createLinearGradient(0,0,0,WORLD.h);
    grad.addColorStop(0,'#1a1f14');grad.addColorStop(0.5,'#232a1a');grad.addColorStop(1,'#161813');
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
    ctx.fillStyle='#9e8a62';ctx.font='13px KaiTi';ctx.textAlign='center';ctx.fillText('回 廊',(l+r)/2,180);
}
function drawWindows(){
    for(var i=0;i<4;i++){
        var wx=[280,480,680,880][i],wy=310;
        ctx.save();
        if(game.windows[i]){ctx.shadowColor='#f0d38b';ctx.shadowBlur=10}
        ctx.strokeStyle=game.windows[i]?'#c8a45b':'#6b5238';ctx.lineWidth=2.5;
        if(i===0){ctx.beginPath();ctx.arc(wx,wy+30,32,0,Math.PI*2);ctx.stroke()}
        else if(i===1){ctx.strokeRect(wx-22,wy,44,60)}
        else if(i===2){ctx.beginPath();ctx.arc(wx,wy+30,32,Math.PI*0.8,Math.PI*0.2);ctx.stroke()}
        else{
            ctx.strokeRect(wx-25,wy,50,60);
            ctx.lineWidth=1;ctx.strokeStyle=game.windows[i]?'#c8a45b':'#6b5238';
            ctx.beginPath();ctx.moveTo(wx-10,wy);ctx.lineTo(wx-10,wy+60);ctx.moveTo(wx+10,wy);ctx.lineTo(wx+10,wy+60);ctx.stroke();
        }
        ctx.restore();
        var wNames=['圆窗','长窗','扇窗','漏窗'];
        ctx.fillStyle=game.windows[i]?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(wNames[i],wx,wy-8);
    }
}
function drawScreens(){
    if(game.screensDone)return;
    for(var i=0;i<4;i++){
        if(game.screens[i])continue;
        var sx=[280,480,680,880][i];
        ctx.fillStyle='#5a4632';ctx.fillRect(sx-18,GROUND_Y-80,36,80);
        ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(sx-18,GROUND_Y-80,36,80);
        ctx.fillStyle='#ead9b7';ctx.font='10px KaiTi';ctx.textAlign='center';ctx.fillText('屏',sx,GROUND_Y-35);
        var isNear=game.nearObj&&game.nearObj.id==='screen'+(i+1);
        if(isNear){ctx.save();ctx.shadowColor='#f0d38b';ctx.shadowBlur=12;ctx.strokeStyle='#f0d38b';ctx.lineWidth=2;ctx.strokeRect(sx-20,GROUND_Y-82,40,84);ctx.restore()}
    }
}
function drawCourtyard(){
    var l=COURTYARD.l,r=COURTYARD.r;
    ctx.fillStyle='#3a4030';ctx.fillRect(l,GROUND_Y,r-l,14);
    ctx.fillStyle='#4a5040';ctx.fillRect(l,GROUND_Y-6,r-l,8);
    if(game.waterOpen){
        ctx.fillStyle='rgba(120,160,140,.3)';ctx.fillRect(l,GROUND_Y-40,r-l,40);
        ctx.strokeStyle='rgba(160,200,180,.3)';ctx.lineWidth=1;
        for(var wy=GROUND_Y-36;wy<GROUND_Y-5;wy+=8){ctx.beginPath();ctx.moveTo(l,wy);for(var wx=l;wx<r;wx+=30){ctx.quadraticCurveTo(wx+8,wy+Math.sin(animTime*2+wx*.02)*2,wx+15,wy)}ctx.stroke()}
    }
    ctx.fillStyle='#9e8a62';ctx.font='12px KaiTi';ctx.textAlign='center';ctx.fillText('水 院',(l+r)/2,GROUND_Y-50);
}
function drawRockery(){
    var l=ROCKERY.l,r=ROCKERY.r;
    ctx.fillStyle='#4a4538';
    ctx.beginPath();ctx.moveTo(l,GROUND_Y);
    ctx.lineTo(l+40,GROUND_Y-60);ctx.lineTo(l+80,GROUND_Y-40);ctx.lineTo(l+120,GROUND_Y-90);
    ctx.lineTo(l+160,GROUND_Y-50);ctx.lineTo(l+200,GROUND_Y-80);ctx.lineTo(l+240,GROUND_Y-30);
    ctx.lineTo(l+280,GROUND_Y-70);ctx.lineTo(l+320,GROUND_Y-20);ctx.lineTo(l+360,GROUND_Y);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='#6b6048';ctx.lineWidth=2;ctx.stroke();
    if(!game.waterOpen){
        ctx.fillStyle='#5a5545';ctx.fillRect(1660,GROUND_Y-50,80,50);
        ctx.strokeStyle='#7a7058';ctx.lineWidth=2;ctx.strokeRect(1660,GROUND_Y-50,80,50);
        ctx.fillStyle='#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText('假山',1700,GROUND_Y-60);
    }else{
        ctx.fillStyle='#5a4632';ctx.fillRect(1660,GROUND_Y-50,80,50);
        ctx.strokeStyle='#c8a45b';ctx.lineWidth=2;ctx.strokeRect(1660,GROUND_Y-50,80,50);
        ctx.fillStyle='#7ab8a0';ctx.fillRect(1670,GROUND_Y-30,60,30);
        ctx.fillStyle='#f0d38b';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText('水闸 · 开',1700,GROUND_Y-60);
    }
}
function drawWater(){
    if(!game.waterOpen)return;
    ctx.save();ctx.globalAlpha=game.flowAlpha;
    ctx.strokeStyle='rgba(160,200,180,.25)';ctx.lineWidth=1.5;
    for(var wy=GROUND_Y+16;wy<WORLD.h;wy+=14){
        ctx.beginPath();ctx.moveTo(0,wy);
        for(var wx=0;wx<WORLD.w;wx+=40){ctx.quadraticCurveTo(wx+10,wy+Math.sin(animTime*1.8+wx*.02)*3,wx+20,wy)}
        ctx.stroke();
    }
    ctx.restore();
}

function drawObjects(){
    for(var i=0;i<OBJECTS.length;i++){
        var obj=OBJECTS[i];var isNear=game.nearObj===obj;
        if(obj.type==='painting'){
            if(game.paintings[obj.pIdx])continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#ead9b7';ctx.fillRect(obj.x-14,GROUND_Y-45,28,34);
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-14,GROUND_Y-45,28,34);
            ctx.fillStyle='#8a6d3f';ctx.font='8px KaiTi';ctx.textAlign='center';ctx.fillText('画',obj.x,GROUND_Y-26);ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,GROUND_Y-55);
        }
        else if(obj.type==='seasonPos'){
            if(game.seasonsPlaced[obj.seIdx])continue;
            var colors=['#8bab71','#a7c9bd','#c69156','#c5d1db'];
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle=colors[obj.seIdx];ctx.globalAlpha=.6;
            ctx.fillRect(obj.x-16,GROUND_Y-40,32,30);ctx.globalAlpha=1;
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-16,GROUND_Y-40,32,30);ctx.restore();
            var seNames=['春雨','夏声','秋叶','冬影'];
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(seNames[obj.seIdx],obj.x,GROUND_Y-50);
        }
        else if(obj.type==='leaf'){
            if(game.leafPicked)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#c69156';ctx.beginPath();
            ctx.ellipse(obj.x,GROUND_Y-12,10,6,0.3,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='#a07040';ctx.lineWidth=1;ctx.stroke();ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText('秋叶',obj.x,GROUND_Y-25);
        }
        else if(obj.type==='painter'){
            if(game.painterDone)return;
            drawPerson(obj.x,GROUND_Y,'#4a3828','#ead9b7',isNear);
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='12px KaiTi';ctx.textAlign='center';ctx.fillText('画师',obj.x,GROUND_Y-58);
            if(game.leafPicked&&!game.leafPlaced){ctx.fillStyle='#f0d38b';ctx.font='14px KaiTi';ctx.fillText('?',obj.x,GROUND_Y-70)}
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