'use strict';
var canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
var W=0,H=0,DPR=1;
var WORLD={w:1600,h:800};
var FLOORS=[{y:660,ceil:480,name:'入口层'},{y:480,ceil:300,name:'中层'},{y:300,ceil:120,name:'上层'}];
var TOWER={l:100,r:700};
var STAIRS=[{x1:200,x2:320,from:0,to:1},{x1:420,x2:540,from:1,to:2}];
var OBJECTS=[
    {id:'tool1',label:'入口工具标记',floor:0,x:180,range:55,type:'mark',mIdx:0},
    {id:'wood2',label:'中层木料刻痕',floor:1,x:350,range:55,type:'mark',mIdx:1},
    {id:'bench3',label:'操作台检查图',floor:1,x:550,range:55,type:'mark',mIdx:2},
    {id:'bench',label:'构件操作台',floor:1,x:550,range:60,type:'bench'},
    {id:'part1',label:'支柱归位',floor:1,x:300,range:55,type:'part',partIdx:0},
    {id:'part2',label:'横梁归位',floor:1,x:450,range:55,type:'part',partIdx:1},
    {id:'part3',label:'连接复核',floor:1,x:600,range:55,type:'part',partIdx:2},
    {id:'ledger',label:'营造账册',floor:2,x:400,range:60,type:'ledger'},
    {id:'page1',label:'入口记录页',floor:0,x:250,range:55,type:'page',pageIdx:0},
    {id:'page2',label:'中层记录页',floor:1,x:400,range:55,type:'page',pageIdx:1},
    {id:'page3',label:'上层记录页',floor:2,x:500,range:55,type:'page',pageIdx:2},
    {id:'final_fix',label:'遗漏的连接',floor:0,x:150,range:55,type:'finalFix'},
    {id:'apprentice',label:'小学徒',floor:0,x:400,range:70,type:'apprentice'},
    {id:'exit',label:'出口',floor:0,x:650,range:60,type:'exit'}
];
var TASKS=[
    {title:'任务一 · 读懂工具痕迹',desc:'对照工具与木料上的标记，找到师傅留下的检查顺序。'},
    {title:'任务二 · 完成承托任务',desc:'在操作台上拼合简化的连接构件，恢复几处承托关系。'},
    {title:'任务三 · 找到自己的名字',desc:'依照上层光线找到账册，把各层记录页归位。'},
    {title:'任务四 · 留下最后一次修补',desc:'陪学徒回到入口，补好最早遗漏的一处连接。'}
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
        marks:[false,false,false],benchOpen:false,parts:[false,false,false],partsDone:false,
        ledgerFound:false,pages:[false,false,false],pagesPlaced:false,
        finalFixed:false,apprenticeDone:false,
        nearObj:null,beamAlpha:0};
    camera.x=0;camera.y=0;
}

function startGame(){
    resetGame();game.running=true;
    document.getElementById('start-screen').classList.add('hide');
    document.getElementById('hud').style.display='block';
    document.getElementById('task-panel').style.display='block';
    document.getElementById('top-actions').style.display='flex';
    updateTaskPanel();
    toast('你在应县木塔入口层醒来，小学徒正搬动木料。',3500);
}
function updateTaskPanel(){
    var t=TASKS[game.task]||{title:'本章完成',desc:'修补已完成。'};
    document.getElementById('tp-title').textContent=t.title;
    document.getElementById('tp-desc').textContent=t.desc;
    document.getElementById('hud-goal').textContent=t.title.replace(/任务[一二三四] · /,'');
    document.getElementById('hud-parts').textContent=game.parts.filter(Boolean).length+' / 3';
    document.getElementById('hud-pages').textContent=game.pages.filter(Boolean).length+' / 3';
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

function playerY(){return FLOORS[game.player.floor].y}

function update(dt){
    if(!game.running)return;
    if(dialogue.active){if(keys.e){keys.e=false;advanceDialogue()}return}
    var p=game.player,speed=220,dx=0;
    if(keys.left){dx=-speed*dt;p.facing=-1}
    if(keys.right){dx=speed*dt;p.facing=1}
    p.moving=dx!==0;if(p.moving)p.bob+=dt*8;
    var nx=p.x+dx;
    nx=Math.max(TOWER.l+20,Math.min(TOWER.r-20,nx));
    p.x=nx;

    var stair=null;
    for(var i=0;i<STAIRS.length;i++){
        var s=STAIRS[i];
        if(p.x>=s.x1&&p.x<=s.x2){
            if(p.floor===s.from)stair={dir:'up',to:s.to,stair:i};
            if(p.floor===s.to)stair={dir:'down',to:s.from,stair:i};
            break;
        }
    }
    if(stair){
        if(stair.dir==='up'&&keys.up){
            if(!game.partsDone&&p.floor===1){keys.up=false;toast('楼梯又落回去了……梁柱还没稳定。',2500);return}
            keys.up=false;p.floor=stair.to;p.x=(STAIRS[stair.stair].x1+STAIRS[stair.stair].x2)/2;
            toast('上楼 → '+FLOORS[p.floor].name,1200);
        }
        if(stair.dir==='down'&&keys.down){keys.down=false;p.floor=stair.to;p.x=(STAIRS[stair.stair].x1+STAIRS[stair.stair].x2)/2;toast('下楼 → '+FLOORS[p.floor].name,1200)}
    }

    game.nearObj=null;
    for(var i=0;i<OBJECTS.length;i++){
        var obj=OBJECTS[i];
        if(obj.floor!==p.floor)continue;
        if(obj.type==='part'&&!game.benchOpen)continue;
        if(obj.type==='part'&&game.partsDone)continue;
        if(obj.type==='ledger'&&!game.partsDone)continue;
        if(obj.type==='page'&&(!game.ledgerFound||game.pagesPlaced))continue;
        if(obj.type==='finalFix'&&!game.ledgerFound)continue;
        if(obj.type==='exit'&&!game.finalFixed)continue;
        if(obj.type==='apprentice'&&game.apprenticeDone)continue;
        if(Math.abs(p.x-obj.x)<obj.range){game.nearObj=obj;break}
    }
    var prompt=document.getElementById('interact-prompt');
    if(game.nearObj){prompt.textContent='按 E 互动：'+game.nearObj.label;prompt.style.display='block'}
    else{prompt.style.display='none'}
    if(keys.e){keys.e=false;interact()}

    if(game.partsDone)game.beamAlpha=Math.min(1,game.beamAlpha+dt*0.5);

    var tx=p.x-W/2,ty=playerY()-H*0.55;
    camera.x+=(tx-camera.x)*Math.min(1,dt*4);camera.y+=(ty-camera.y)*Math.min(1,dt*4);
    camera.x=Math.max(0,Math.min(WORLD.w-W,camera.x));camera.y=Math.max(0,Math.min(WORLD.h-H,camera.y));
}

function interact(){
    var obj=game.nearObj;if(!obj)return;
    if(obj.type==='mark'){
        if(game.task!==0){toast('痕迹已经看过了。',1500);return}
        if(game.marks[obj.mIdx]){toast('这处痕迹已经看过。',1500);return}
        game.marks[obj.mIdx]=true;
        var mNames=['入口工具标记','中层木料刻痕','操作台检查图'];
        var mCount=game.marks.filter(Boolean).length;
        startDialogue([['执笔人','看到了'+mNames[obj.mIdx]+'。'],['小墨灵','（比对）这些标记连起来，是一个检查顺序……']],function(){
            if(mCount===3){
                toast('检查顺序找到！操作台已开启。',3500);
                startDialogue([['执笔人','检查图提示：先立支柱，再接横梁，最后复核连接。'],['小墨灵','去操作台完成承托任务吧。']],function(){game.task=1;game.benchOpen=true;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='part'){
        if(game.task!==1){toast('先读懂工具痕迹。',1500);return}
        if(game.parts[obj.partIdx]){toast('这处构件已经复位。',1500);return}
        var expected=game.parts.filter(Boolean).length;
        if(obj.partIdx!==expected){toast('顺序不对。检查图：先立支柱，再接横梁，最后复核连接。',3000);return}
        game.parts[obj.partIdx]=true;
        var partNames=['支柱','横梁','连接'];
        var partCount=game.parts.filter(Boolean).length;
        startDialogue([['执笔人','复位了'+partNames[obj.partIdx]+'。'],['小墨灵','梁柱虚影稳定了……楼梯不再回落！']],function(){
            if(partCount===3){
                toast('承托完成！楼梯终于通向上层。',3500);
                startDialogue([['小墨灵','梁柱稳定了！上层的楼梯可以走了。'],['执笔人','上楼去找账册吧。']],function(){game.task=2;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='ledger'){
        if(game.task!==2){toast('账册还找不到。',1500);return}
        if(game.ledgerFound){toast('账册已经找到了。',1500);return}
        game.ledgerFound=true;
        startDialogue([['执笔人','找到了营造账册。'],['小墨灵','账册上有很多名字……还有学徒的工作记录。'],['执笔人','把各层的记录页归位，就能看到完整的记录了。']],function(){toast('找到三层记录页，归位到账册。',2500);updateTaskPanel()});
    }
    else if(obj.type==='page'){
        if(game.task!==2){toast('先找到账册。',1500);return}
        if(game.pages[obj.pageIdx]){toast('这页已经找到。',1500);return}
        game.pages[obj.pageIdx]=true;
        var pgNames=['入口记录页','中层记录页','上层记录页'];
        var pgCount=game.pages.filter(Boolean).length;
        startDialogue([['执笔人','找到了'+pgNames[obj.pageIdx]+'。'],['小墨灵','（看内容）学徒做的检查与修补，都记在这里……']],function(){
            if(pgCount===3){
                toast('记录页归位！账册显示学徒的工作一直托住这座塔。',4000);
                startDialogue([['执笔人','账册将学徒的修补与塔中位置连在一起。'],['小墨灵','他并非"什么也没做成"……他的工作一直托住这座塔。'],['小学徒','（眼眶泛红）师傅……原来他都记下来了。'],['小学徒','可是出口还没开……我要回去补好最后一处。']],function(){game.task=3;updateTaskPanel()});
            }else{updateTaskPanel()}
        });
        updateTaskPanel();
    }
    else if(obj.type==='finalFix'){
        if(game.task!==3){toast('先找到账册和记录页。',1500);return}
        if(game.finalFixed){toast('这处连接已经补好了。',1500);return}
        game.finalFixed=true;
        startDialogue([
            ['小学徒','（回到入口）就是这里……最早遗漏的一处连接。'],
            ['执笔人','补好它。'],
            ['小学徒','（动手修补）……这一处，我补好了。'],
            ['（环境）','塔内响起许多无名匠人的工作回声，随后安静下来。'],
            ['小学徒','账册我留在塔里。工具……交给下一位来者。'],
            ['小墨灵','有人托住了你看不见的地方。']
        ],function(){game.apprenticeDone=true;completeChapter()});
    }
    else if(obj.type==='exit'){
        if(!game.finalFixed){toast('出口还没开启。',1500);return}
        completeChapter();
    }
}

function completeChapter(){
    try{
        var saved=JSON.parse(localStorage.getItem('inkJourneyProgressV1')||'{}');
        if(!Array.isArray(saved.completed))saved.completed=[];
        if(saved.completed.indexOf('yinxian')===-1)saved.completed.push('yinxian');
        localStorage.setItem('inkJourneyProgressV1',JSON.stringify(saved));
    }catch(e){}
    document.getElementById('hud').style.display='none';
    document.getElementById('task-panel').style.display='none';
    document.getElementById('interact-prompt').style.display='none';
    document.getElementById('result-title').textContent='获得信物 · 匠尺';
    document.getElementById('result-detail').innerHTML='一把留有修补痕迹的匠尺，记录着许多无名匠人的具体劳作。<br><br><strong style="color:#f0d38b">小墨灵："有人托住了你看不见的地方。"</strong><br><br>第四段记忆已恢复。回到主线，继续最后一段旅程。';
    document.getElementById('result-modal').classList.add('show');
}

function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.save();ctx.translate(-camera.x,-camera.y);
    drawBackground();drawTower();drawBeams();drawStairs();drawObjects();drawPlayer();
    ctx.restore();
}
function drawBackground(){
    var grad=ctx.createLinearGradient(0,0,0,WORLD.h);
    grad.addColorStop(0,'#1a1510');grad.addColorStop(0.5,'#231c14');grad.addColorStop(1,'#161313');
    ctx.fillStyle=grad;ctx.fillRect(0,0,WORLD.w,WORLD.h);
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
}
function drawBeams(){
    if(game.beamAlpha<=0)return;
    ctx.save();ctx.globalAlpha=game.beamAlpha;
    ctx.strokeStyle='#c8a45b';ctx.lineWidth=3;
    for(var f=0;f<3;f++){
        var fy=FLOORS[f].y,ceil=FLOORS[f].ceil;
        ctx.beginPath();ctx.moveTo(TOWER.l+30,ceil+20);ctx.lineTo(TOWER.r-30,ceil+20);ctx.stroke();
        ctx.beginPath();ctx.moveTo(TOWER.l+30,fy-20);ctx.lineTo(TOWER.r-30,fy-20);ctx.stroke();
        ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(TOWER.l+100,ceil);ctx.lineTo(TOWER.l+100,fy);ctx.stroke();
        ctx.beginPath();ctx.moveTo(TOWER.r-100,ceil);ctx.lineTo(TOWER.r-100,fy);ctx.stroke();
        ctx.lineWidth=3;
    }
    ctx.restore();
}
function drawStairs(){
    for(var i=0;i<STAIRS.length;i++){
        var s=STAIRS[i],fy1=FLOORS[s.from].y,fy2=FLOORS[s.to].y;
        ctx.strokeStyle=game.partsDone?'#c8a45b':'#8a6d3f';ctx.lineWidth=3;
        for(var j=0;j<8;j++){var sx=s.x1+(s.x2-s.x1)*(j/8),sy=fy1+(fy2-fy1)*((j+1)/8);ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+(s.x2-s.x1)/8,sy);ctx.stroke()}
        ctx.strokeStyle=game.partsDone?'#c8a45b':'#6b5238';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(s.x1,fy1);ctx.lineTo(s.x2,fy2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(s.x2,fy1);ctx.lineTo(s.x1,fy2);ctx.stroke();
    }
}

function drawObjects(){
    for(var i=0;i<OBJECTS.length;i++){
        var obj=OBJECTS[i];var isNear=game.nearObj===obj;
        var fy=FLOORS[obj.floor].y;
        if(obj.type==='mark'){
            if(game.marks[obj.mIdx])continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=2;
            ctx.beginPath();ctx.moveTo(obj.x-10,fy-15);ctx.lineTo(obj.x-3,fy-22);ctx.lineTo(obj.x+4,fy-15);ctx.lineTo(obj.x+11,fy-22);ctx.stroke();
            ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,fy-32);
        }
        else if(obj.type==='bench'){
            if(game.benchOpen)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#5a4632';ctx.fillRect(obj.x-25,fy-30,50,30);
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-25,fy-30,50,30);ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,fy-40);
        }
        else if(obj.type==='part'){
            if(game.parts[obj.partIdx])continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#6b5238';ctx.beginPath();ctx.arc(obj.x,fy-25,18,0,Math.PI*2);ctx.fill();
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=2;ctx.stroke();ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,fy-52);
        }
        else if(obj.type==='ledger'){
            if(!game.partsDone)continue;
            if(game.ledgerFound)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#8a7350';ctx.fillRect(obj.x-18,fy-40,36,28);
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-18,fy-40,36,28);ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,fy-50);
        }
        else if(obj.type==='page'){
            if(!game.ledgerFound)continue;
            if(game.pages[obj.pageIdx])continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.fillStyle='#ead9b7';ctx.fillRect(obj.x-10,fy-35,20,25);
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=1.5;ctx.strokeRect(obj.x-10,fy-35,20,25);ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,fy-45);
        }
        else if(obj.type==='finalFix'){
            if(!game.ledgerFound)continue;
            if(game.finalFixed)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=12}
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=2.5;
            ctx.beginPath();ctx.moveTo(obj.x-8,fy-20);ctx.lineTo(obj.x+8,fy-8);ctx.stroke();
            ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText(obj.label,obj.x,fy-30);
        }
        else if(obj.type==='apprentice'){
            if(game.apprenticeDone)continue;
            drawPerson(obj.x,fy,'#4a3828','#ead9b7',isNear);
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='12px KaiTi';ctx.textAlign='center';ctx.fillText('小学徒',obj.x,fy-58);
        }
        else if(obj.type==='exit'){
            if(!game.finalFixed)continue;
            ctx.save();if(isNear){ctx.shadowColor='#f0d38b';ctx.shadowBlur=15}
            ctx.fillStyle='#4a3828';ctx.fillRect(obj.x-15,fy-50,30,50);
            ctx.strokeStyle='#c8a45b';ctx.lineWidth=2;ctx.strokeRect(obj.x-15,fy-50,30,50);ctx.restore();
            ctx.fillStyle=isNear?'#f0d38b':'#9e8a62';ctx.font='11px KaiTi';ctx.textAlign='center';ctx.fillText('出口',obj.x,fy-60);
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