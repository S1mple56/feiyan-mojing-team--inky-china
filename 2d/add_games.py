import re

file_path = "d:/CN建筑/2d/games.html"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace Hub Cards
old_cards = """        <!-- 装饰性占位游戏 -->
        <div class="game-card" onclick="openWIP('银牌试毒')"><div class="icon">🍲</div><div class="title">银牌试毒</div></div>
        <div class="game-card" onclick="openWIP('太和殿的脊兽')"><div class="icon">🐉</div><div class="title">太和殿的脊兽</div></div>
        <div class="game-card" onclick="openWIP('游戏畅音阁')"><div class="icon">🎭</div><div class="title">游戏畅音阁</div></div>
        <div class="game-card" onclick="openWIP('宫门关')"><div class="icon">⛩️</div><div class="title">宫门关</div></div>
        <div class="game-card" onclick="openWIP('曲水流觞')"><div class="icon">🌊</div><div class="title">曲水流觞</div></div>
        <div class="game-card" onclick="openWIP('明帝王图')"><div class="icon">📜</div><div class="title">明帝王图</div></div>
        <div class="game-card" onclick="openWIP('九九消寒图')"><div class="icon">🌸</div><div class="title">九九消寒图</div></div>
        <div class="game-card" onclick="openWIP('皇子的课表')"><div class="icon">📚</div><div class="title">皇子的课表</div></div>"""

new_cards = """        <!-- 新增的 8 款小游戏入口 -->
        <div class="game-card" onclick="openGame('game-poison')"><div class="icon">🍲</div><div class="title">银牌试毒</div></div>
        <div class="game-card" onclick="openGame('game-beasts')"><div class="icon">🐉</div><div class="title">太和殿的脊兽</div></div>
        <div class="game-card" onclick="openGame('game-opera')"><div class="icon">🎭</div><div class="title">游戏畅音阁</div></div>
        <div class="game-card" onclick="openGame('game-gate')"><div class="icon">⛩️</div><div class="title">宫门关</div></div>
        <div class="game-card" onclick="openGame('game-poem')"><div class="icon">🌊</div><div class="title">曲水流觞</div></div>
        <div class="game-card" onclick="openGame('game-emperors')"><div class="icon">📜</div><div class="title">明帝王图</div></div>
        <div class="game-card" onclick="openGame('game-plum')"><div class="icon\">🌸</div><div class="title">九九消寒图</div></div>
        <div class="game-card" onclick="openGame('game-schedule')"><div class="icon\">📚</div><div class="title">皇子的课表</div></div>"""

content = content.replace(old_cards, new_cards)

# 2. Add Styles
styles_to_add = """
        /* ================= 游戏 5：银牌试毒 ================= */
        #poison-grid {
            display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap; justify-content: center;
        }
        .poison-plate {
            width: 80px; height: 80px; background: #c2b280; border: 3px solid #8b4513; border-radius: 50%;
            display: flex; justify-content: center; align-items: center; font-size: 35px; cursor: pointer; transition: 0.3s;
        }
        .poison-plate:hover { transform: scale(1.1); box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        .silver-pin {
            width: 60px; height: 20px; background: silver; border: 1px solid #999; border-radius: 10px; margin: 0 auto 20px; box-shadow: inset 0 0 5px #fff;
        }
        .pin-safe { background: lightblue; }
        .pin-poison { background: #333; }

        /* ================= 游戏 6：太和殿的脊兽 ================= */
        #beasts-container {
            display: flex; gap: 10px; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; margin-top: 20px; min-height: 80px;
        }
        .beast-slot {
            width: 50px; height: 50px; border: 2px dashed #ceae75; display: flex; justify-content: center; align-items: center; border-radius: 5px;
        }
        #beasts-pool {
            display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; justify-content: center;
        }
        .beast-item {
            width: 50px; height: 50px; background: #c2b280; border: 2px solid #8b4513; display: flex; justify-content: center; align-items: center; cursor: pointer; border-radius: 5px; font-size: 24px; transition: 0.2s;
        }
        .beast-item:active { transform: scale(0.9); }

        /* ================= 游戏 7：游戏畅音阁 ================= */
        #opera-stage {
            display: grid; grid-template-columns: repeat(2, 120px); gap: 20px; margin-top: 20px;
        }
        .opera-btn {
            width: 120px; height: 120px; background: #5c3a21; border: 4px solid #8b4513; border-radius: 10px;
            font-size: 50px; display: flex; justify-content: center; align-items: center; cursor: pointer;
            transition: 0.1s; filter: brightness(0.6);
        }
        .opera-btn.active { filter: brightness(1.5); box-shadow: 0 0 20px #ffd700; transform: scale(1.05); }

        /* ================= 游戏 8：宫门关 ================= */
        #gate-track {
            width: 400px; height: 50px; background: #222; border: 3px solid #8b4513; border-radius: 10px; position: relative; margin-top: 40px; overflow: hidden;
        }
        #gate-target {
            position: absolute; right: 20px; width: 60px; height: 100%; background: rgba(0, 255, 0, 0.4); border-left: 2px solid lime;
        }
        #gate-slider {
            position: absolute; left: 0; width: 30px; height: 100%; background: #d32f2f; border-radius: 5px;
        }

        /* ================= 游戏 9：曲水流觞 ================= */
        #river-container {
            width: 100%; max-width: 400px; height: 100px; background: #1976d2; border: 4px solid #8b4513; border-radius: 20px; position: relative; overflow: hidden; margin-top: 20px;
        }
        #cup {
            position: absolute; left: -50px; top: 30px; font-size: 40px; cursor: pointer; transition: left linear;
        }
        .cup-highlight {
            position: absolute; left: 150px; width: 100px; height: 100%; background: rgba(255,255,255,0.3); pointer-events: none;
        }
        #poem-options { display: flex; gap: 10px; margin-top: 20px; }
        .poem-btn { padding: 10px 20px; font-size: 20px; background: #fdf5e6; border: 2px solid #8b4513; border-radius: 5px; cursor: pointer; }
        .poem-btn:hover { background: #ffd700; }

        /* ================= 游戏 10：明帝王图 ================= */
        .emperor-match { display: flex; justify-content: space-around; width: 100%; max-width: 500px; margin-top: 20px; }
        .emperor-col { display: flex; flex-direction: column; gap: 15px; }
        .emperor-card, .emperor-name {
            width: 120px; height: 50px; background: #c2b280; border: 2px solid #8b4513; border-radius: 5px; cursor: pointer;
            display: flex; justify-content: center; align-items: center; font-size: 18px; font-weight: bold;
        }
        .emperor-card.selected { background: #ffd700; }
        .emperor-name.matched { background: lightgreen; pointer-events: none; opacity: 0.7; }
        .emperor-card.matched { visibility: hidden; }

        /* ================= 游戏 11：九九消寒图 ================= */
        #plum-grid { display: grid; grid-template-columns: repeat(3, auto); gap: 20px; margin-top: 20px; }
        .plum-flower { display: grid; grid-template-columns: repeat(3, 20px); gap: 2px; }
        .plum-petal { width: 20px; height: 20px; background: #fff; border: 1px solid #ccc; border-radius: 50%; cursor: pointer; }
        .plum-petal.painted { background: #ff4081; border-color: #c2185b; }

        /* ================= 游戏 12：皇子的课表 ================= */
        #schedule-container { display: flex; gap: 20px; margin-top: 20px; }
        .schedule-col { display: flex; flex-direction: column; gap: 10px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 10px; width: 120px; }
        .schedule-slot { height: 40px; border: 1px dashed #ceae75; border-radius: 5px; display: flex; justify-content: center; align-items: center; color: #ccc; }
        .schedule-item { height: 40px; background: #fdf5e6; color: #5c3a21; border: 2px solid #8b4513; border-radius: 5px; font-weight: bold; display: flex; justify-content: center; align-items: center; cursor: grab; }
        .schedule-slot.filled { border: none; }
"""

content = content.replace("</style>", styles_to_add + "\n    </style>")

# 3. Add Modals
modals_to_add = """
    <!-- =============== Game 5: 银牌试毒 =============== -->
    <div id="game-poison" class="game-modal">
        <div class="modal-header">
            <h2 class="modal-title">银牌试毒</h2>
            <button class="close-btn" onclick="closeAllGames()">返回大厅</button>
        </div>
        <div class="silver-pin" id="silver-pin"></div>
        <h3 id="poison-msg">用银牌点验御膳，找出含毒的一盘（银牌变黑）！</h3>
        <div id="poison-grid"></div>
        <div class="controls">
            <button class="action-btn" onclick="initPoison()">换一桌菜</button>
        </div>
    </div>

    <!-- =============== Game 6: 太和殿的脊兽 =============== -->
    <div id="game-beasts" class="game-modal">
        <div class="modal-header">
            <h2 class="modal-title">太和殿的脊兽</h2>
            <button class="close-btn" onclick="closeAllGames()">返回大厅</button>
        </div>
        <h3 id="beasts-msg">请按太和殿琉璃脊兽顺序，依次放回原位！</h3>
        <div id="beasts-container"></div>
        <div id="beasts-pool"></div>
        <div class="controls">
            <button class="action-btn" onclick="initBeasts()">重新排列</button>
        </div>
    </div>

    <!-- =============== Game 7: 游戏畅音阁 =============== -->
    <div id="game-opera" class="game-modal">
        <div class="modal-header">
            <h2 class="modal-title">游戏畅音阁</h2>
            <button class="close-btn" onclick="closeAllGames()">返回大厅</button>
        </div>
        <h3 id="opera-msg">看仔细了，跟着戏班子的节奏点按乐器！</h3>
        <div id="opera-stage">
            <div class="opera-btn" id="op-0" onclick="playOpera(0)">🥁</div>
            <div class="opera-btn" id="op-1" onclick="playOpera(1)">🪘</div>
            <div class="opera-btn" id="op-2" onclick="playOpera(2)">🎺</div>
            <div class="opera-btn" id="op-3" onclick="playOpera(3)">🪕</div>
        </div>
        <div class="controls">
            <button class="action-btn" onclick="initOpera()">登台开唱</button>
        </div>
    </div>

    <!-- =============== Game 8: 宫门关 =============== -->
    <div id="game-gate" class="game-modal">
        <div class="modal-header">
            <h2 class="modal-title">宫门关</h2>
            <button class="close-btn" onclick="closeAllGames()">返回大厅</button>
        </div>
        <h3 id="gate-msg">待刺客跑入安全区，立即点击擒拿！</h3>
        <div id="gate-track">
            <div id="gate-target"></div>
            <div id="gate-slider"></div>
        </div>
        <div class="controls">
            <button class="action-btn" onclick="catchGate()">关门擒贼！</button>
            <button class="action-btn" onclick="initGate()">重开大门</button>
        </div>
    </div>

    <!-- =============== Game 9: 曲水流觞 =============== -->
    <div id="game-poem" class="game-modal">
        <div class="modal-header">
            <h2 class="modal-title">曲水流觞</h2>
            <button class="close-btn" onclick="closeAllGames()">返回大厅</button>
        </div>
        <h3 id="poem-msg">点击高亮处的酒杯，回答诗词！</h3>
        <div id="river-container">
            <div class="cup-highlight"></div>
            <div id="cup" onclick="catchCup()">🏮</div>
        </div>
        <h2 id="poem-question" style="display:none; color:#ffd700;">床前明月__？</h2>
        <div id="poem-options" style="display:none;">
            <button class="poem-btn" onclick="answerPoem('光')">光</button>
            <button class="poem-btn" onclick="answerPoem('霜')">霜</button>
            <button class="poem-btn" onclick="answerPoem('明')">明</button>
        </div>
        <div class="controls">
            <button class="action-btn" onclick="initPoem()">放杯漂流</button>
        </div>
    </div>

    <!-- =============== Game 10: 明帝王图 =============== -->
    <div id="game-emperors" class="game-modal">
        <div class="modal-header">
            <h2 class="modal-title">明帝王图</h2>
            <button class="close-btn" onclick="closeAllGames()">返回大厅</button>
        </div>
        <h3 id="emperor-msg">点击左侧帝王画像，再点击右侧对应庙号连线！</h3>
        <div class="emperor-match">
            <div class="emperor-col" id="emp-pics"></div>
            <div class="emperor-col" id="emp-names"></div>
        </div>
        <div class="controls">
            <button class="action-btn" onclick="initEmperors()">重新匹配</button>
        </div>
    </div>

    <!-- =============== Game 11: 九九消寒图 =============== -->
    <div id="game-plum" class="game-modal">
        <div class="modal-header">
            <h2 class="modal-title">九九消寒图</h2>
            <button class="close-btn" onclick="closeAllGames()">返回大厅</button>
        </div>
        <h3 id="plum-msg">点击花瓣染梅，待八十一瓣全红便逢春！ (已染: 0)</h3>
        <div id="plum-grid"></div>
        <div class="controls">
            <button class="action-btn" onclick="initPlum()">拿新宣纸</button>
        </div>
    </div>

    <!-- =============== Game 12: 皇子的课表 =============== -->
    <div id="game-schedule" class="game-modal">
        <div class="modal-header">
            <h2 class="modal-title">皇子的课表</h2>
            <button class="close-btn" onclick="closeAllGames()">返回大厅</button>
        </div>
        <h3 id="schedule-msg">请将课程按清代皇子真实作息点击安放！</h3>
        <div id="schedule-container">
            <div class="schedule-col" id="sch-slots">
                <div class="schedule-slot" data-id="1">寅时 (3-5点)</div>
                <div class="schedule-slot" data-id="2">卯时 (5-7点)</div>
                <div class="schedule-slot" data-id="3">辰时 (7-9点)</div>
                <div class="schedule-slot" data-id="4">申时 (15-17点)</div>
            </div>
            <div class="schedule-col" id="sch-items"></div>
        </div>
        <div class="controls">
            <button class="action-btn" onclick="initSchedule()">重新安排</button>
        </div>
    </div>
"""

content = content.replace("    <!-- ================= 脚本区 ================= -->", modals_to_add + "\n    <!-- ================= 脚本区 ================= -->")

# 4. Add Scripts
scripts_to_add = """
        // ======= UI Framework 新增 =======
        const extOpenGame = window.openGame;
        window.openGame = function(id) {
            extOpenGame(id);
            if(id === 'game-poison') initPoison();
            if(id === 'game-beasts') initBeasts();
            if(id === 'game-opera') initOpera();
            if(id === 'game-gate') initGate();
            if(id === 'game-poem') initPoem();
            if(id === 'game-emperors') initEmperors();
            if(id === 'game-plum') initPlum();
            if(id === 'game-schedule') initSchedule();
        };

        // ================= Game 5: 银牌试毒 =================
        let poisonIdx = 0;
        let poisonOver = false;
        function initPoison() {
            poisonOver = false;
            document.getElementById('poison-msg').innerText = "用银牌点验御膳，找出含毒的一盘！";
            document.getElementById('silver-pin').className = "silver-pin";
            let grid = document.getElementById('poison-grid');
            grid.innerHTML = '';
            poisonIdx = Math.floor(Math.random() * 6);
            let foods = ['🍲', '🥘', '🥣', '🥗', '🍛', '🍱'];
            foods.sort(() => Math.random() - 0.5);
            for(let i=0; i<6; i++) {
                let div = document.createElement('div');
                div.className = 'poison-plate';
                div.innerText = foods[i];
                div.onclick = () => checkPoison(i, div);
                grid.appendChild(div);
            }
        }
        function checkPoison(i, el) {
            if(poisonOver || el.style.opacity === '0.5') return;
            let pin = document.getElementById('silver-pin');
            if(i === poisonIdx) {
                pin.className = 'silver-pin pin-poison';
                document.getElementById('poison-msg').innerText = "银牌发黑！此菜有剧毒，试毒失败！";
                el.style.background = '#800000';
                poisonOver = true;
            } else {
                pin.className = 'silver-pin pin-safe';
                el.style.opacity = '0.5';
                el.style.background = 'lightgreen';
                let remaining = Array.from(document.querySelectorAll('.poison-plate')).filter(d => d.style.opacity !== '0.5').length;
                if(remaining === 1) {
                    document.getElementById('poison-msg').innerText = "安全菜品全被找出，慧眼识毒！";
                    poisonOver = true;
                }
            }
        }

        // ================= Game 6: 太和殿的脊兽 =================
        const beastsOrder = ["🐉龙", "🦅凤", "🦁狮", "🐎海马"];
        let beastTries = 0;
        function initBeasts() {
            beastTries = 0;
            document.getElementById('beasts-msg').innerText = "按正确顺序(龙->凤->狮->海马)放回原位！";
            let c = document.getElementById('beasts-container');
            let p = document.getElementById('beasts-pool');
            c.innerHTML = ''; p.innerHTML = '';
            for(let i=0; i<beastsOrder.length; i++) {
                let s = document.createElement('div'); s.className = 'beast-slot'; c.appendChild(s);
            }
            let shuffled = [...beastsOrder].sort(()=>Math.random()-0.5);
            shuffled.forEach(b => {
                let d = document.createElement('div');
                d.className = 'beast-item'; d.innerText = b[0];
                d.onclick = () => placeBeast(d, b);
                p.appendChild(d);
            });
        }
        function placeBeast(el, name) {
            if(!el.parentElement || el.parentElement.id !== 'beasts-pool') return;
            if(name === beastsOrder[beastTries]) {
                document.querySelectorAll('.beast-slot')[beastTries].innerText = name[0];
                el.remove();
                beastTries++;
                if(beastTries === beastsOrder.length) document.getElementById('beasts-msg').innerText = "脊兽归位，殿宇安宁！";
            } else {
                document.getElementById('beasts-msg').innerText = "顺序错误！这只不是放这里的！";
                setTimeout(()=>document.getElementById('beasts-msg').innerText = "按正确顺序(龙->凤->狮->海马)放回原位！", 1500);
            }
        }

        // ================= Game 7: 游戏畅音阁 =================
        let operaSeq = [], operaUserSeq = [];
        let operaPlaying = false;
        function initOpera() {
            operaSeq = []; operaUserSeq = [];
            nextOperaLevel();
        }
        function nextOperaLevel() {
            operaUserSeq = [];
            operaSeq.push(Math.floor(Math.random()*4));
            document.getElementById('opera-msg').innerText = `第 ${operaSeq.length} 幕：请听题！`;
            operaPlaying = true;
            let i = 0;
            let itv = setInterval(() => {
                flashOpera(operaSeq[i]);
                i++;
                if(i >= operaSeq.length) { clearInterval(itv); operaPlaying = false; document.getElementById('opera-msg').innerText = `请复现戏曲节奏！`; }
            }, 800);
        }
        function playOpera(idx) {
            if(operaPlaying) return;
            flashOpera(idx);
            operaUserSeq.push(idx);
            if(operaUserSeq[operaUserSeq.length-1] !== operaSeq[operaUserSeq.length-1]) {
                document.getElementById('opera-msg').innerText = "哎呀，弹错啦！满堂倒彩！";
                operaSeq = [];
            } else {
                if(operaUserSeq.length === operaSeq.length) {
                    if(operaSeq.length >= 5) { document.getElementById('opera-msg').innerText = "五幕全通，满堂喝彩！"; operaSeq=[]; }
                    else { setTimeout(nextOperaLevel, 1000); }
                }
            }
        }
        function flashOpera(idx) {
            let el = document.getElementById('op-'+idx);
            el.classList.add('active');
            setTimeout(()=>el.classList.remove('active'), 300);
        }

        // ================= Game 8: 宫门关 =================
        let gateInterval = null;
        let sliderPos = 0;
        let gateRunning = false;
        function initGate() {
            document.getElementById('gate-msg').innerText = "待刺客跑入安全区，立即点击擒拿！";
            sliderPos = 0; clearInterval(gateInterval);
            let s = document.getElementById('gate-slider');
            s.style.left = '0px';
            gateRunning = true;
            gateInterval = setInterval(() => {
                sliderPos += 4;
                if(sliderPos > 370) sliderPos = 0;
                s.style.left = sliderPos + 'px';
            }, 20);
        }
        function catchGate() {
            if(!gateRunning) return;
            clearInterval(gateInterval);
            gateRunning = false;
            // Target is at right: 20px -> left: 320px to 380px roughly
            if(sliderPos >= 310 && sliderPos <= 370) {
                document.getElementById('gate-msg').innerText = "擒拿成功！安全守卫！";
            } else {
                document.getElementById('gate-msg').innerText = "让刺客逃了或者关早了！重试！";
            }
        }

        // ================= Game 9: 曲水流觞 =================
        let cupInt = null, cupPos = -50;
        let poems = [
            {q: "床前明月__？", a: "光", o: ["光","霜","明"]},
            {q: "白日依山__？", a: "尽", o: ["近","尽","进"]},
            {q: "春眠不觉__？", a: "晓", o: ["小","晓","了"]},
        ];
        let curPoem = 0;
        function initPoem() {
            document.getElementById('poem-msg').innerText = "点击高亮区域的酒杯！";
            document.getElementById('poem-question').style.display = 'none';
            document.getElementById('poem-options').style.display = 'none';
            cupPos = -50; clearInterval(cupInt);
            let c = document.getElementById('cup');
            c.style.display = 'block'; c.style.left = '-50px';
            cupInt = setInterval(() => {
                cupPos += 2;
                if(cupPos > 400) { clearInterval(cupInt); document.getElementById('poem-msg').innerText = "酒杯飘走了~重新放杯！"; }
                else c.style.left = cupPos + 'px';
            }, 30);
        }
        function catchCup() {
            if(cupPos >= 130 && cupPos <= 230) {
                clearInterval(cupInt);
                document.getElementById('cup').style.display = 'none';
                curPoem = Math.floor(Math.random()*poems.length);
                let p = poems[curPoem];
                document.getElementById('poem-question').innerText = p.q;
                document.getElementById('poem-question').style.display = 'block';
                let opts = document.querySelectorAll('.poem-btn');
                p.o.forEach((txt, i) => { opts[i].innerText = txt; opts[i].setAttribute('onclick', `answerPoem('${txt}')`); });
                document.getElementById('poem-options').style.display = 'flex';
                document.getElementById('poem-msg').innerText = "请对诗！";
            }
        }
        function answerPoem(ans) {
            if(ans === poems[curPoem].a) {
                document.getElementById('poem-msg').innerText = "文采飞扬，答对啦！";
            } else {
                document.getElementById('poem-msg').innerText = "哎呀，诗句有点忘了吧？";
            }
            document.getElementById('poem-options').style.display = 'none';
        }

        // ================= Game 10: 明帝王图 =================
        let selEmp = null;
        let empMatchCount = 0;
        let emps = [{id: 1, c: '太祖', n: '朱元璋'}, {id: 2, c: '成祖', n: '朱棣'}, {id: 3, c: '崇祯', n: '朱由检'}];
        function initEmperors() {
            empMatchCount = 0; selEmp = null;
            document.getElementById('emperor-msg').innerText = "点击左侧称号，再点击右侧对应真名连线！";
            let pl = document.getElementById('emp-pics'); pl.innerHTML = '';
            let nl = document.getElementById('emp-names'); nl.innerHTML = '';
            let pArr = [...emps].sort(()=>Math.random()-0.5);
            let nArr = [...emps].sort(()=>Math.random()-0.5);
            pArr.forEach(e => {
                let d = document.createElement('div'); d.className = 'emperor-card'; d.innerText = e.c;
                d.onclick = () => { if(selEmp) selEmp.classList.remove('selected'); selEmp = d; d.classList.add('selected'); d.dataset.id = e.id; };
                pl.appendChild(d);
            });
            nArr.forEach(e => {
                let d = document.createElement('div'); d.className = 'emperor-name'; d.innerText = e.n;
                d.onclick = () => {
                    if(selEmp && selEmp.dataset.id == e.id) {
                        d.classList.add('matched'); selEmp.classList.add('matched'); selEmp = null; empMatchCount++;
                        if(empMatchCount >= 3) document.getElementById('emperor-msg').innerText = "全部匹配成功！《明帝王图》还原！";
                    } else if(selEmp) {
                        document.getElementById('emperor-msg').innerText = "张冠李戴了，重试！"; selEmp.classList.remove('selected'); selEmp = null;
                    }
                };
                nl.appendChild(d);
            });
        }

        // ================= Game 11: 九九消寒图 =================
        let plumCount = 0;
        function initPlum() {
            plumCount = 0;
            document.getElementById('plum-msg').innerText = "点击花瓣染梅，待八十一瓣全红便逢春！ (已染: 0)";
            let g = document.getElementById('plum-grid'); g.innerHTML = '';
            for(let i=0; i<9; i++) {
                let md = document.createElement('div'); md.className = 'plum-flower';
                for(let j=0; j<9; j++) {
                    let p = document.createElement('div'); p.className = 'plum-petal';
                    p.onclick = () => { if(!p.classList.contains('painted')){ p.classList.add('painted'); plumCount++; document.getElementById('plum-msg').innerText = `点击花瓣染梅... (已染: ${plumCount}/81)`; if(plumCount>=81) document.getElementById('plum-msg').innerText = "九九尽，春已深！"; } };
                    md.appendChild(p);
                }
                g.appendChild(md);
            }
        }

        // ================= Game 12: 皇子的课表 =================
        let schReq = ["早读", "早膳", "汉书", "骑射"];
        let schTries = 0;
        function initSchedule() {
            schTries = 0;
            document.getElementById('schedule-msg').innerText = "请将对应课程依次填入作息表(早读->早膳->汉书->骑射)！";
            document.querySelectorAll('.schedule-slot').forEach(s => { s.innerText = s.dataset.id==1?"寅时 (3-5点)":s.dataset.id==2?"卯时 (5-7点)":s.dataset.id==3?"辰时 (7-9点)":"申时 (15-17点)"; s.classList.remove('filled'); });
            let p = document.getElementById('sch-items'); p.innerHTML = '';
            [...schReq].sort(()=>Math.random()-0.5).forEach(txt => {
                let item = document.createElement('div'); item.className = 'schedule-item'; item.innerText = txt;
                item.onclick = () => fillSchedule(item, txt);
                p.appendChild(item);
            });
        }
        function fillSchedule(el, txt) {
            if(txt === schReq[schTries]) {
                let slot = document.querySelectorAll('.schedule-slot')[schTries];
                slot.innerText = txt; slot.classList.add('filled');
                el.remove(); schTries++;
                if(schTries >= 4) document.getElementById('schedule-msg').innerText = "排表无误，上书房行走准了！";
            } else {
                document.getElementById('schedule-msg').innerText = "休得胡闹，先苦后甜，早课不可乱！";
            }
        }
"""

content = content.replace("        // ======= UI Framework =======", scripts_to_add + "\n        // ======= UI Framework 原始 =======")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
