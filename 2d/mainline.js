/* 神州长卷寻墨记：固定规则驱动任务，浏览器保存途中进度。 */
'use strict';
const STORAGE_KEY = 'inkJourneyProgressV1';
const step = (labels, order, clue, result, ordered = true) => ({labels, order, clue, result, ordered});
const encounters = [
    [
        step(['题壁的信纸','屏风的信纸','栏杆的信纸'],[0,1,2],'三片信纸散落在题壁、屏风和栏杆上。逐一拾起，借夕照拼出江景线索。','信件拼合：近岸树影 → 远处帆影 → 江面暮色。信末有一句未送出的祝愿。',false),
        step(['下层窗 · 树影','中层窗 · 帆影','上层窗 · 暮色'],[0,1,2],'信中写着：先看近岸树影，再找远处帆影，最后望向江面暮色。按此顺序打开三处窗景。','三处窗景依次打开，光连成一条通向江面的光路。墨雾中渡口的轮廓渐渐显现。'),
        step(['循光路下到渡口','望见等待的旅人','与送行人交谈','将信末祝愿读给送行人','把拼好的信交给旅人','点亮渡口的岸灯'],[0,1,2,3,4,5],'循光路来到渡口，与送行人交谈，读出祝愿，再把拼好的信交给旅人，最后点亮岸灯。','送行人松开手："你往前走，我会记得这一程。"船离岸，岸灯亮起，时间终于向前。')
    ],
    [
        step(['桥头旧行囊','桥面同纹刻痕','刻痕旁的缺页'],[0,1,2],'先打开旧行囊，依照草图上的刻痕寻找缺页。','草图补全，标出桥下入口与拱石顺序：左岸 → 拱顶 → 右岸。'),
        step(['右岸拱石','拱顶石','左岸拱石'],[2,1,0],'沿草图依次复位左岸、拱顶、右岸的记忆石块。','两岸路径逐段成为实体，石缝中的信匣打开。'),
        step(['打开信匣','读给老人的家书','读被帮助者的感谢','把信带回桥头'],[0,1,2,3],'信匣中不只有家书，还有几封感谢。读完再交给老人。','老人认出笔迹：亲人曾留在别处为遇险的人引路。'),
        step(['接过老人手中的渡灯','走到桥中央','挂灯照亮两岸'],[0,1,2],'老人愿意让灯为过路人照路。将灯从桥头带到中央。','老人：“这盏灯先替他照着路。”两岸雾散，对岸出口出现。')
    ],
    [
        step(['树影画与圆窗','水岸画与长窗','亭角画与扇窗','山石画与漏窗'],[0,1,2,3],'四幅局部画分别藏在回廊四处窗景旁，逐一观察。','四幅画背面连成路线：圆窗 → 长窗 → 扇窗 → 漏窗。',false),
        step(['扇窗屏风','漏窗屏风','圆窗屏风','长窗屏风'],[2,3,0,1],'按行囊中的游览路线移开屏风，每次重新观察窗外。','回廊不再重复，假山后的水闸显现。'),
        step(['开启水闸','春雨画归位','夏声画归位','秋叶画归位','冬影画归位'],[0,1,2,3,4],'先让水流恢复，倒影才会显示季节。随后依春、夏、秋、冬归位。','春雨、夏声、秋叶与冬影在四处庭院里依次出现。'),
        step(['拾起水院秋叶','将秋叶放入画面','邀请画师完成最后一笔'],[0,1,2],'画师想清走秋叶。你可以把变化留在画里。','画师：“下次来，也许会有另一种好看。”流水声中园门打开。')
    ],
    [
        step(['入口工具标记','中层木料刻痕','操作台检查图'],[0,1,2],'工具标着一，木料刻着二，操作台留下第三道检查记号。','检查图提示：先立支柱，再接横梁，最后复核连接。'),
        step(['横梁归位','复核连接','支柱归位'],[2,0,1],'依操作台提示完成支柱 → 横梁 → 连接的简化承托示意。','梁柱虚影稳定，回落的楼梯终于通向上层。'),
        step(['循光找到营造账册','入口记录页归位','中层记录页归位','上层记录页归位'],[0,1,2,3],'新光线指向营造账册，记录页按入口、中层、上层归位。','账册将学徒的修补与塔中位置对应：他的工作一直托住这座塔。'),
        step(['沿原路回到入口','修补遗漏连接','把账册留在塔内','交工具给下一位来者'],[0,1,2,3],'账册不是离塔的通行证。入口还有一处遗漏的修补。','学徒：“这一处，我补好了。”无名匠人的回声响起，出口开启。')
    ],
    [
        step(['拾起门边工具并观察修补痕迹','将工具还给一号门住户','接过待补灯笼'],[0,1,2],'门边有一把待归还的工具；一号门的灯架留着相同的修补痕迹。','第一扇门打开，住户修好灯架，给你灯笼和二号门线索。'),
        step(['沿环廊找回纹样碎片','拼合灯笼','交给二号门住户','点灯查看夹层家书'],[0,1,2,3],'灯笼的纹样沿环廊延续；补好后交给二号门，灯光照出家书。','灯架夹层显露家书，门牌写着三号，门后传来熟悉声音。'),
        step(['循门牌找到三号门','聆听门后的声音','送达家书','邀请住户来到院落'],[0,1,2,3],'门牌与声音共同指向收信人，送信后邀请大家走出房门。','误会化解，门户相继打开，各家的光照向共同的院落。'),
        step(['鹤羽墨影','渡灯墨影','四时画笺墨影','匠尺墨影','取团圆灯芯','点亮院落共同的灯'],[0,1,2,3,4,5],'将前四章信物的墨影汇入长卷灯座，再取灯芯、点灯。','住户：“到院里来吧。”小墨灵终于拥有共同的归处。')
    ]
];
const sceneArt = [
    {src:'province/hubei/Architecture/location/bg_huanghelou.jpg', label:'黄鹤楼 · 现有场景图'},
    {src:'province/hebei/Architecture/location/bg_zhaozhouqiao.jpg', label:'赵州桥 · 现有场景图'},
    {src:'province/jiangsu/Architecture/location/bg_zhuozhengyuan.jpg', label:'拙政园 · 现有场景图'},
    {src:null, label:'应县木塔 · 待生成场景图'},
    {src:null, label:'福建土楼 · 待生成场景图'}
];
let state = loadState();
let activeChapterIndex = 0;
let hintLevel = 0;
let returnFocus = null;
let toastTimer;
let guideChapterIndex = Math.min(state.completed.length, chapters.length - 1);
const $ = id => document.getElementById(id);

function loadState() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch { saved = {}; }
    const completed = [];
    // Preserve older completed chapters, but never unlock gaps or unknown IDs.
    for (const c of chapters) {
        if (!Array.isArray(saved.completed) || !saved.completed.includes(c.id)) break;
        completed.push(c.id);
    }
    const progress = {};
    chapters.forEach((c,i) => {
        let p = saved.progress && saved.progress[c.id];
        // Merge the former ferry + farewell tasks without dropping old midway saves.
        if (i === 0 && saved.progressSchema !== 2 && p && (p.task === 2 || p.task === 3)) {
            const oldOrder = [0, 1, 2];
            const prefix = [];
            if (Array.isArray(p.actions)) {
                for (const action of p.actions) {
                    if (action !== oldOrder[prefix.length]) break;
                    prefix.push(action);
                }
            }
            p = {task: 2, actions: p.task === 3 ? [0, 1, 2, ...prefix.map(a => a + 3)] : prefix};
        }
        let task = p && Number.isInteger(p.task) ? Math.max(0, Math.min(p.task, c.tasks.length - 1)) : 0;
        const valid = encounters[i][task].order;
        let actions = [];
        if (p && Array.isArray(p.actions)) {
            for (const a of p.actions) {
                if (!Number.isInteger(a) || !valid.includes(a) || actions.includes(a)) break;
                if (encounters[i][task].ordered && a !== valid[actions.length]) break;
                actions.push(a);
            }
        }
        progress[c.id] = {task, actions};
    });
    return {completed, progress, progressSchema: 2};
}
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        $('saveStatus').textContent = '交互手记已自动保存 · 离开后可从当前操作继续';
    } catch { $('saveStatus').textContent = '浏览器无法保存进度，请保持本页打开'; }
}
function isUnlocked(i) {return i === 0 || state.completed.includes(chapters[i - 1].id);}
function renderOverview() {
    $('chapterGrid').innerHTML = chapters.map((c,i) => {
        const done = state.completed.includes(c.id), unlocked = isUnlocked(i);
        const guide = chapterGuides[i];
        return `<button class="chapter-card ${done?'complete':''} ${unlocked?'':'locked'}" onclick="window.location.href='${guide.gameHref}'" ${unlocked?'':'disabled'} aria-label="${c.number} ${c.name}，${guide.theme}，${done?'重游此章':unlocked?'进入三维关卡':'完成前一章后开启'}"><span class="status ${done?'done':''}">${done?'已完成':unlocked?'可进入':'未开启'}</span><div class="chapter-number">${c.number} · ${guide.theme}</div><h3>${c.name}</h3><div class="subtitle">${c.subtitle.split(' · ')[0]}</div><p>${guide.teaser}</p><div class="chapter-meta">${c.tasks.length} 个连续任务 · ${guide.space}</div><div class="chapter-token">信物 · ${c.token}</div><span class="chapter-entry">${done?'重游三维墨境 →':unlocked?'进入三维墨境 →':'完成前一章后开启'}</span></button>`;
    }).join('');
    $('progressFill').style.width = `${state.completed.length / 5 * 100}%`;
    $('journeyProgress').setAttribute('aria-valuenow', state.completed.length);
    $('progressText').textContent = `${state.completed.length} / 5 章`;
    const current = chapters.findIndex(c => !state.completed.includes(c.id));
    $('continueJourney').textContent = current < 0 ? '重游黄鹤楼 →' : `前往 · ${chapters[current].name} →`;
    $('journeyDirection').textContent = current < 0 ? '五处古建的生活回声已重回长卷。你的信物与记忆保存在下方行囊。' : `下一段记忆：${chapters[current].name} · ${chapterGuides[current].theme}。在人物的愿望中找线索，用行动让往事继续。`;
    $('endingSection').classList.toggle('show', state.completed.length === 5);
    $('journeyBag').innerHTML = chapters.filter(c => state.completed.includes(c.id)).map(c => `<div class="memory-token"><strong>${c.token}</strong><span>${c.tokenDesc}</span><span>小墨灵：${c.memory}</span></div>`).join('') || '<p>行囊里还没有信物。先到黄鹤楼找回那封未送出的信。</p>';
    renderGuide(guideChapterIndex);
}
function continueJourney() {
    const next = chapters.findIndex(c => !state.completed.includes(c.id));
    window.location.href = chapterGuides[next < 0 ? 0 : next].gameHref;
}
function renderGuide(i) {
    if (!Number.isInteger(i) || !chapters[i]) return;
    guideChapterIndex = i;
    const c = chapters[i], g = chapterGuides[i], done = state.completed.includes(c.id), unlocked = isUnlocked(i);
    if (!$('guideTabs').children.length) {
        $('guideTabs').innerHTML = chapters.map((chapter, n) => `<button type="button" class="guide-tab" onclick="renderGuide(${n})">${chapter.number}<span>${chapter.name}</span></button>`).join('');
    }
    Array.from($('guideTabs').children).forEach((tab,n) => {
        tab.classList.toggle('selected',n===i);
        tab.setAttribute('aria-pressed',String(n===i));
    });
    $('guideContent').innerHTML = `<div class="guide-heading"><div><span class="eyebrow">${g.space} · ${g.theme}</span><h3>${c.name} · ${c.subtitle.split(' · ')[0]}</h3></div><span class="guide-state">${done?'记忆已找回':unlocked?'这段记忆正等待你':'完成前一章后可进入'}</span></div><div class="guide-columns"><div><h4>人物与愿望 · ${g.person}</h4><p>${g.wish}</p><h4>连续任务</h4><ol class="guide-task-list">${c.tasks.map((task,n)=>`<li><strong>${task.title.replace(/^任务[一二三四] · /,'')}</strong><p>${g.actions[n]}</p></li>`).join('')}</ol></div><div class="guide-environment"><h4>空间如何讲述故事</h4><p class="guide-route">${g.route}</p><p>${g.environment}</p><h4>沿途建筑观察</h4><p>${g.observation}</p><div class="guide-reward"><span>本章信物</span><strong>${c.token}</strong><p>${done ? c.tokenDesc : '完成这段往事后，收入行囊。'}${done ? `<br>小墨灵：“${c.memory}”` : ''}</p></div></div></div><div class="guide-actions"><button class="primary-btn" onclick="window.location.href='${g.gameHref}'" ${unlocked?'':'disabled'}>${done?'重游记忆空间':unlocked?'进入记忆空间':'完成前一章后开启'} →</button><button class="ghost-btn" onclick="openChapter(${i})" ${unlocked?'':'disabled'}>打开交互手记</button><span>交互手记可逐步记录线索，并保存当前操作。</span></div>`;
}
function openChapter(i) {
    if (!Number.isInteger(i) || !chapters[i] || !isUnlocked(i)) return;
    returnFocus = document.activeElement;
    activeChapterIndex = i;
    hintLevel = 0;
    $('journeyOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
    const c = chapters[i];
    $('panelTitle').textContent = `${c.number} · ${c.name}`;
    $('panelTheme').textContent = c.subtitle;
    $('storyBox').textContent = c.story;
    $('knowledgeBox').textContent = c.knowledge + ' 本空间为原创记忆故事，机关为简化示意。';
    renderTask();
    document.querySelector('.panel-close').focus();
}
function closeChapterPanel() {
    saveState();
    $('journeyOverlay').classList.remove('show');
    document.body.style.overflow = '';
    renderOverview();
    if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    else $('guideContent').querySelector('.ghost-btn').focus();
}
function renderTask() {
    const c = chapters[activeChapterIndex], p = state.progress[c.id];
    $('tokenBox').classList.remove('show');
    $('feedback').textContent = '';
    if (state.completed.includes(c.id)) { renderCompletion(); return; }
    const task = c.tasks[p.task], op = encounters[activeChapterIndex][p.task];
    const ready = p.actions.length === op.order.length;
    $('taskTitle').textContent = task.title;
    $('taskCounter').textContent = `任务 ${p.task+1} / ${c.tasks.length} · 操作 ${p.actions.length} / ${op.order.length}`;
    $('taskDesc').textContent = task.desc;
    $('choiceList').innerHTML = `<div class="clue-sheet">线索记录：${op.clue}</div><div class="operation-board">${op.labels.map((label,i)=>`<button class="operation-btn" onclick="performAction(${i})" ${p.actions.includes(i)?'disabled':''}>${p.actions.includes(i)?'✓ ':''}${label}</button>`).join('')}</div>`;
    $('feedback').textContent = ready ? op.result : '观察线索，再操作场景中的物件。';
    $('hintBtn').style.display = ready ? 'none' : '';
    $('nextTaskBtn').style.display = ready ? '' : 'none';
    $('nextTaskBtn').textContent = p.task === c.tasks.length - 1 ? `领取信物 · ${c.token}` : '沿新路径继续 →';
    renderScene(ready ? op.result : op.clue);
}
function performAction(i) {
    const c=chapters[activeChapterIndex], p=state.progress[c.id], op=encounters[activeChapterIndex][p.task];
    if (state.completed.includes(c.id) || !Number.isInteger(i) || !op.order.includes(i) || p.actions.includes(i)) return;
    if (op.ordered && op.order[p.actions.length] !== i) {
        $('feedback').textContent = '这里还缺少前一步的条件。看看线索记录，当前操作已保留。';
        return;
    }
    if (activeChapterIndex===4 && p.task===3 && i<4 && !state.completed.includes(chapters[i].id)) return;
    p.actions.push(i);
    saveState();
    renderTask();
}
function nextTask() {
    const c=chapters[activeChapterIndex], p=state.progress[c.id], op=encounters[activeChapterIndex][p.task];
    if (state.completed.includes(c.id) || p.actions.length !== op.order.length) return;
    if (p.task < c.tasks.length-1) {p.task++; p.actions=[]; hintLevel=0;}
    else {state.completed.push(c.id); showToast(`获得${c.token} · ${activeChapterIndex===4?'执笔归来': '下一段记忆已开启'}`);}
    saveState(); renderOverview(); renderTask();
}
function renderCompletion() {
    const c=chapters[activeChapterIndex];
    $('taskTitle').textContent='长卷出口已经出现';
    $('taskCounter').textContent='本章完成';
    $('taskDesc').textContent=encounters[activeChapterIndex].at(-1).result;
    $('choiceList').innerHTML='';
    $('hintBtn').style.display='none';
    $('nextTaskBtn').style.display='none';
    $('tokenBox').classList.add('show');
    $('tokenBox').innerHTML=`<h4>信物 · ${c.token}</h4><p>${c.tokenDesc}</p><p>小墨灵：“${c.memory}”</p><button class="scene-btn" onclick="closeChapterPanel()">走出长卷 · 查看行囊</button>`;
    renderScene(c.memory);
}
function showHint() {
    const c=chapters[activeChapterIndex], p=state.progress[c.id], op=encounters[activeChapterIndex][p.task];
    if (state.completed.includes(c.id)) return;
    const next=op.order.find(i=>!p.actions.includes(i));
    const hints=[c.tasks[p.task].hint, op.clue, next===undefined?'线索已经接通，沿新路径继续。':`试着操作“${op.labels[next]}”。`];
    $('feedback').textContent=`小墨灵 · 提示 ${Math.min(++hintLevel,3)}：${hints[Math.min(hintLevel-1,2)]}`;
}
function renderScene(caption) {
    const c=chapters[activeChapterIndex], p=state.progress[c.id];
    const done=state.completed.includes(c.id), level=done?1:(p.task+p.actions.length/encounters[activeChapterIndex][p.task].order.length)/c.tasks.length;
    const landscape=[
        `<path d="M185 240V100h230v140M175 100l125-52 125 52M195 135h210M195 170h210M195 205h210M250 100v140m50-140v140m50-140v140"/>`,
        `<path d="M35 220Q300 15 565 220M50 215Q300 65 550 215M75 190v45m450-45v45" stroke-width="13"/><path d="M280 85v-40h35v40" fill="#e3ba68"/>`,
        `<path d="M50 210v-120h115v120M190 210V70h110v140M335 210V95h100v115M470 210V70h80v140"/><circle cx="108" cy="143" r="35"/><path d="M220 110h50v60h-50zM360 165q25-75 50 0zM490 110h40v60h-40z"/>`,
        `<path d="M230 240V65h140v175M205 65l95-40 95 40M205 120l95-35 95 35M205 180l95-35 95 35M230 120h140M230 180h140M260 65v175m40-175v175m40-175v175"/>`,
        `<ellipse cx="300" cy="150" rx="230" ry="105"/><ellipse cx="300" cy="150" rx="145" ry="65"/><path d="M90 140v60m60-100v45m70-70v40m160-40v40m70-15v45m60-5v60"/><path d="M285 170v-35h30v35z" fill="#e3ba68"/>`
    ][activeChapterIndex];
    // Changes are tied to actual actions rather than a timer or an AI response.
    let details='';
    if(activeChapterIndex===0) {
        const p0=state.progress[chapters[0].id];
        details+='<g stroke="#8a7350" stroke-width="2.5" fill="none">';
        details+='<rect x="200" y="200" width="200" height="40" fill="#3a3228"/>';
        details+='<path d="M185 200 L215 168 L385 168 L415 200" fill="#4a3f30" stroke="#c8a45b"/>';
        details+='<rect x="215" y="168" width="170" height="32" fill="#3a3228"/>';
        details+='<path d="M195 168 L225 138 L375 138 L405 168" fill="#4a3f30" stroke="#c8a45b"/>';
        details+='<rect x="225" y="138" width="150" height="30" fill="#3a3228"/>';
        details+='<path d="M208 138 L235 110 L365 110 L392 138" fill="#4a3f30" stroke="#c8a45b"/>';
        details+='<rect x="235" y="110" width="130" height="28" fill="#3a3228"/>';
        details+='<path d="M222 110 L250 85 L350 85 L378 110" fill="#4a3f30" stroke="#c8a45b"/>';
        details+='<rect x="250" y="85" width="100" height="25" fill="#3a3228"/>';
        details+='<path d="M235 85 L300 48 L365 85" fill="#5a4a35" stroke="#c8a45b"/>';
        details+='<line x1="300" y1="48" x2="300" y2="32" stroke="#c8a45b" stroke-width="3"/>';
        details+='<circle cx="300" cy="30" r="3" fill="#f0d38b"/>';
        details+='</g>';
        const winY=[175,145,117], winC=['#779764','#bbd2d2','#cb8250'], winL=['树影','帆影','暮色'];
        const nWin=done||p0.task>1?3:p0.task===1?p0.actions.length:0;
        for(let n=0;n<nWin;n++){
            details+='<rect x="275" y="'+winY[n]+'" width="50" height="20" rx="2" fill="'+winC[n]+'" opacity=".9" stroke="#f0d38b" stroke-width="1.5"/>';
            details+='<text x="300" y="'+(winY[n]+14)+'" text-anchor="middle" font-size="10" fill="#1a1510" font-family="KaiTi">'+winL[n]+'</text>';
        }
        if(done||p0.task>=2){
            details+='<path d="M300 225 Q370 232 440 236 Q500 240 560 238" stroke="#f0d38b" stroke-width="3" fill="none" opacity=".8" stroke-dasharray="8 4"/>';
        }
        if(done||(p0.task===2&&p0.actions.length>=1)){
            details+='<g transform="translate(500,228)"><path d="M-14 7 Q0 13 14 7 L11 0 H-11 Z" fill="#5a4a35" stroke="#c8a45b"/><line x1="0" y1="0" x2="0" y2="-16" stroke="#c8a45b"/><path d="M0 -16 L11 -4 H0" fill="#ead9b7" opacity=".8"/></g>';
            details+='<g transform="translate(430,212)" fill="#2a2520" stroke="#8a7350"><circle cx="0" cy="-16" r="5"/><path d="M-4 -11 L4 -11 L6 0 H-6 Z"/></g>';
            details+='<g transform="translate(452,214)" fill="#3a3228" stroke="#8a7350"><circle cx="0" cy="-14" r="4.5"/><path d="M-3.5 -9.5 L3.5 -9.5 L5 0 H-5 Z"/></g>';
        }
        if(done||(p0.task===2&&p0.actions.length>=5)){
            details+='<circle cx="440" cy="207" r="7" fill="#f0d38b" opacity=".7"><animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values=".5;.9;.5" dur="2s" repeatCount="indefinite"/></circle>';
        }
        if(done||(p0.task===2&&p0.actions.length>=6)){
            details+='<line x1="555" y1="238" x2="555" y2="220" stroke="#8a7350" stroke-width="2"/><circle cx="555" cy="217" r="5" fill="#ffe28b"><animate attributeName="opacity" values=".7;1;.7" dur="1.5s" repeatCount="indefinite"/></circle><path d="M545 238 Q555 205 565 238" fill="#f0d38b" opacity=".15"/>';
        }
    } else if(activeChapterIndex===1) {
        const stones=done || p.task>1 ? 3 : p.task===1 ? p.actions.length : 0;
        for(let n=0;n<stones;n++) details+=`<path d="M${120+n*115} ${145-Math.sin(n*Math.PI/2)*35}h80" stroke="#f0d38b" stroke-width="10"/>`;
        if(done || (p.task===3 && p.actions.length===3)) details+='<path d="M290 70L80 235H520L310 70" fill="#f0d38b" opacity=".15"/>';
    } else if(activeChapterIndex===2) {
        const seasons=done || p.task>2 ? 4 : p.task===2 ? Math.max(0,p.actions.length-1) : 0;
        ['#8bab71','#a7c9bd','#c69156','#c5d1db'].slice(0,seasons).forEach((color,i)=>{details+=`<circle cx="${110+i*130}" cy="180" r="24" fill="${color}" opacity=".8"/>`;});
        if(done || p.task>2 || (p.task===2 && p.actions.length)) details+='<path d="M80 237Q220 210 370 237T540 237" stroke="#aacdd7" stroke-width="4" fill="none"/>';
    } else if(activeChapterIndex===3) {
        if(done || p.task>1 || (p.task===1 && p.actions.length===3)) details+='<path d="M240 238l30-40h20l30-40h20l20-35" stroke="#f0d38b" stroke-width="6" fill="none"/>';
        if(done || p.task>2) details+='<rect x="410" y="130" width="55" height="70" fill="#ead9b7"/><path d="M420 145h30m-30 15h30m-30 15h20" stroke="#51422b" stroke-width="3"/>';
    } else {
        const doors=done || p.task>2 ? 3 : p.task;
        for(let n=0;n<doors;n++) details+=`<rect x="${140+n*130}" y="105" width="24" height="35" fill="#eed290"/>`;
        if(done) details+='<circle cx="300" cy="150" r="40" fill="#f0d38b" opacity=".28"/><circle cx="300" cy="150" r="10" fill="#ffe69d"/>';
    }
    const art = sceneArt[activeChapterIndex];
    $('memoryScene').classList.toggle('awakened',level>.5);
    $('memoryScene').classList.toggle('has-art',Boolean(art.src));
    $('memoryScene').style.backgroundImage = art.src ? `url("${art.src}")` : '';
    $('memoryScene').innerHTML=`<span class="scene-art-note">${art.label}</span><svg viewBox="0 0 600 290" role="img" aria-label="${c.name}记忆空间"><rect width="600" height="290" fill="${level>.5?'#665039':'#292c30'}"/><circle cx="510" cy="48" r="26" fill="#e3ba68" opacity="${.2+level*.8}"/><g stroke="#d2b985" stroke-width="5" fill="none">${landscape}</g>${details}<path d="M0 250Q150 230 300 250T600 250" stroke="#a3b9bd" stroke-width="3" fill="none"/><rect width="600" height="250" fill="#c4c8c7" opacity="${.3*(1-level)}"/></svg><div class="scene-caption">${caption}</div>`;
}
function showToast(message) { $('toast').textContent=message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600); }
$('journeyOverlay').addEventListener('click',e=>{if(e.target===$('journeyOverlay')) closeChapterPanel();});
document.addEventListener('keydown',e=>{
    if (!$('journeyOverlay').classList.contains('show')) return;
    if (e.key==='Escape') closeChapterPanel();
    if (e.key==='Tab') {
        const buttons=Array.from($('journeyOverlay').querySelectorAll('button:not(:disabled)')).filter(b=>b.getClientRects().length);
        const first=buttons[0], last=buttons.at(-1);
        if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
});
renderOverview();
