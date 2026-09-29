/* ===== 水墨神州 全局数字人（语音对话版） ===== */
(function(){
  if(window.__digitalHumanLoaded) return;
  window.__digitalHumanLoaded = true;

  /* ---------- 注入CSS ---------- */
  const style = document.createElement('style');
  style.textContent = `
    #dh-container {
      position: fixed; bottom: 20px; right: 20px; z-index: 99999;
      pointer-events: auto; cursor: pointer;
      transition: transform 0.3s ease;
    }
    #dh-container:hover { transform: scale(1.05); }
    /* speaking glow disabled */
    /* dh-glow removed */
    #dh-avatar { border-radius: 50%; width: 70px; height: 70px; object-fit: cover;
      background: rgba(18,18,18,0.6); border: 2px solid rgba(206,174,117,0.5); }
    #dh-panel {
      position: absolute; bottom: 80px; right: 0; z-index: 99998;
      width: 380px; max-height: 520px;
      background: rgba(20,18,15,0.96);
      border: 1.5px solid rgba(206,174,117,0.5);
      border-radius: 16px;
      display: none; flex-direction: column;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(206,174,117,0.15);
      overflow: hidden;
      font-family: 'KaiTi','楷体',serif;
    }
    #dh-panel.show { display: flex; animation: dh-slideUp 0.35s ease; }
    @keyframes dh-slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    .dh-header {
      padding: 12px 16px;
      background: linear-gradient(135deg, rgba(139,69,19,0.3), rgba(206,174,117,0.15));
      border-bottom: 1px solid rgba(206,174,117,0.3);
      display: flex; justify-content: space-between; align-items: center;
    }
    .dh-header span { color: #ffd700; font-size: 17px; font-weight: bold; letter-spacing: 2px; }
    .dh-close { background:none; border:none; color:#ceae75; font-size:22px; cursor:pointer; padding:0 4px; }
    .dh-close:hover { color:#ffd700; }
    .dh-settings-bar {
      display: flex; gap: 6px; padding: 8px 14px; align-items: center;
      border-bottom: 1px solid rgba(206,174,117,0.15);
      background: rgba(0,0,0,0.15);
    }
    .dh-settings-bar label { color: #f0e6d0; font-size: 13px; white-space: nowrap; }
    .dh-settings-bar select {
      flex:1; background: rgba(255,255,255,0.08); border: 1px solid rgba(206,174,117,0.3);
      color: #f0e6d0; border-radius: 6px; padding: 4px 8px; font-size: 13px;
      font-family: 'KaiTi','楷体',serif; outline: none;
    }
    .dh-settings-bar select:focus { border-color: #ceae75; }
    .dh-settings-bar select option { background: #1a1210; color: #f0e6d0; padding: 6px; }
    .dh-toggle-btn {
      background: none; border: 1px solid rgba(206,174,117,0.3); border-radius: 12px;
      padding: 2px 10px; font-size: 12px; cursor: pointer; color: #ffd700;
      transition: all 0.2s;
    }
    .dh-toggle-btn.active { background: rgba(206,174,117,0.25); border-color: #ffd700; color: #ffd700; }
    .dh-messages {
      flex:1; overflow-y:auto; padding:14px 16px; min-height:180px; max-height:300px;
    }
    .dh-messages::-webkit-scrollbar { width:5px; }
    .dh-messages::-webkit-scrollbar-thumb { background:rgba(206,174,117,0.4); border-radius:4px; }
    .dh-msg { margin-bottom:12px; display:flex; gap:10px; align-items:flex-start; }
    .dh-msg.user { flex-direction:row-reverse; }
    .dh-msg-avatar {
      width:32px; height:32px; border-radius:50%;
      background:linear-gradient(135deg,#8b6914,#ceae75);
      display:flex; align-items:center; justify-content:center;
      font-size:16px; flex-shrink:0;
    }
    .dh-msg.user .dh-msg-avatar { background:linear-gradient(135deg,#4a6fa5,#7ba0d4); }
    .dh-msg-bubble {
      max-width:240px; padding:10px 14px; border-radius:12px; font-size:15px; line-height:1.7;
      color:#fff;
    }
    .dh-msg:not(.user) .dh-msg-bubble { background:rgba(206,174,117,0.12); border:1px solid rgba(206,174,117,0.2); }
    .dh-msg.user .dh-msg-bubble { background:rgba(74,111,165,0.25); border:1px solid rgba(123,160,212,0.3); }
    .dh-input-area {
      display:flex; gap:6px; padding:10px 12px;
      border-top:1px solid rgba(206,174,117,0.2);
      background:rgba(0,0,0,0.2);
    }
    #dh-input {
      flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(206,174,117,0.3);
      border-radius:8px; padding:8px 12px; color:#fff; font-size:15px;
      font-family:'KaiTi','楷体',serif; outline:none;
    }
    #dh-input:focus { border-color:#ceae75; }
    #dh-input::placeholder { color:rgba(206,174,117,0.7); }
    .dh-input-btn {
      background:linear-gradient(135deg,#8b6914,#ceae75); border:none; border-radius:8px;
      padding:8px 14px; color:#1a1207; font-weight:bold; font-size:15px; cursor:pointer;
      font-family:'KaiTi','楷体',serif; transition: all 0.2s;
    }
    .dh-input-btn:hover { filter:brightness(1.15); }
    #dh-mic-btn {
      background: rgba(206,174,117,0.15); border: 1px solid rgba(206,174,117,0.3);
      border-radius: 8px; padding: 8px 10px; font-size: 18px; cursor: pointer;
      transition: all 0.2s; line-height: 1;
    }
    #dh-mic-btn:hover { background: rgba(206,174,117,0.3); }
    #dh-mic-btn.recording {
      background: rgba(255,60,60,0.3); border-color: #ff4444;
      animation: dh-mic-pulse 1s ease-in-out infinite;
    }
    @keyframes dh-mic-pulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(255,60,60,0.4); }
      50% { box-shadow: 0 0 0 8px rgba(255,60,60,0); }
    }
    .dh-typing { color:#ffd700; font-style:italic; padding:4px 0; }
    .dh-welcome { color:#ffd700; text-align:center; padding:20px 10px; font-size:15px; line-height:1.8; }
    .dh-voice-tag { font-size:11px; color:#ffd700; margin-left:6px; }
  `;
  document.head.appendChild(style);

  /* ---------- 页面上下文 ---------- */
  const pageName = location.pathname.split('/').pop().replace('.html','') || 'index';
  const pageTips = {
    'index': '这里是水墨神州的主页面，你可以浏览中国各大古建筑的全景地图。',
    'gugong': '你现在正浏览北京故宫，这是明清两代的皇家宫殿，世界上现存规模最大的宫殿建筑群。',
    'changcheng': '万里长城是中国古代的军事防御工程，被誉为世界七大奇迹之一。',
    'budalagong': '布达拉宫坐落于西藏拉萨，是世界上海拔最高的宏伟建筑群。',
    'yinxu': '殷墟是中国商朝晚期的都城遗址，出土了大量甲骨文和青铜器。',
    'shaolinsi': '少林寺位于河南嵩山，是中国佛教禅宗的发源地。',
    'longmenshiku': '龙门石窟是中国石刻艺术宝库之一，展现了北魏至唐代的造像艺术。',
    'tiantan': '天坛是明清两代帝王祭天祈谷的场所，是中国现存最大的古代祭祀性建筑群。',
    'foguangsi': '佛光寺位于山西五台山，是中国现存最古老的木结构建筑之一。',
    'huanghelou': '黄鹤楼位于湖北武汉，是江南三大名楼之一，因崔颢的诗而闻名天下。',
    'tengwangge': '滕王阁位于江西南昌，因王勃的《滕王阁序》而名扬天下。',
    'zhuozhengyuan': '拙政园是苏州最大的古典园林，被誉为"天下园林之母"。',
    'yueyanglou': '岳阳楼位于湖南岳阳，因范仲淹的《岳阳楼记》而闻名于世。',
    'penglaige': '蓬莱阁位于山东蓬莱，是中国古代四大名楼之一，传说中的蓬莱仙境所在地。',
    'zhaozhouqiao': '赵州桥位于河北赵县，是世界上现存最早、保存最好的大跨度石拱桥。',
    'bingmayong': '秦始皇兵马俑是世界第八大奇迹，展现了秦代雕塑艺术的最高成就。',
    'wenchuang': '欢迎来到文创商城！这里有精美的水墨风文创产品。',
    'games': '欢迎来到游艺区！这里有各种有趣的互动游戏等你来玩。',
    'yuntaishan': '云台山位于河南焦作，以红石峡、茱萸峰等景观闻名。',
  };
  const currentTip = pageTips[pageName] || '水墨神州带你领略中国古建筑之美。';

  /* ---------- DOM构建 ---------- */
  const container = document.createElement('div');
  container.id = 'dh-container';
  container.innerHTML = `
    <img id="dh-avatar" src="xianzi.png" alt="墨韵书生" onerror="this.style.display='none'" />
    <div id="dh-panel">
      <div class="dh-header">
        <span>\u{1F4DC} 墨韵书生</span>
        <button class="dh-close" id="dh-close">\u2715</button>
      </div>
      <div class="dh-settings-bar">
        <label>\u{1F3A4} 方言：</label>
        <select id="dh-dialect">
          <option value="mandarin">\u{1F1E8}\u{1F1F3} 普通话</option>
          <option value="cantonese">\u{1F1E8}\u{1F1F3} 粤语</option>
          <option value="sichuan">\u{1F1E8}\u{1F1F3} 四川话</option>
          <option value="northeast">\u{1F1E8}\u{1F1F3} 东北话</option>
          <option value="taiwan">\u{1F1E8}\u{1F1F3} 台湾腔</option>
          <option value="henan">\u{1F1E8}\u{1F1F3} 河南话</option>
          <option value="shandong">\u{1F1E8}\u{1F1F3} 山东话</option>
        </select>
        <button class="dh-toggle-btn active" id="dh-auto-speak" title="自动朗读开关">\u{1F50A}</button>
      </div>
      <div class="dh-messages" id="dh-messages">
        <div class="dh-welcome">\u{1F4DC} 书生在此恭候~<br>点击麦克风语音提问，或直接输入文字。<br>回答将用您选择的方言朗读。</div>
      </div>
      <div class="dh-input-area">
        <button id="dh-mic-btn" title="按住说话">&#x1F3A4;</button>
        <input type="text" id="dh-input" placeholder="输入你的问题..." />
        <button class="dh-input-btn" id="dh-send">问</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  /* ---------- 头像：用图片替代Canvas ---------- */
  // dh-avatar 已通过 <img> 标签实现

  /* ---------- 对话面板交互 ---------- */
  const panel = document.getElementById('dh-panel');
  const messagesEl = document.getElementById('dh-messages');
  const inputEl = document.getElementById('dh-input');
  const sendBtn = document.getElementById('dh-send');
  const micBtn = document.getElementById('dh-mic-btn');
  const dialectSelect = document.getElementById('dh-dialect');
  const autoSpeakBtn = document.getElementById('dh-auto-speak');

  let autoSpeak = true;
  let isSpeaking = false;
  let currentAudio = null;

  /* ---------- 拖拽功能 ---------- */
  let isDragging = false, dragMoved = false;
  let dragStartX, dragStartY, startLeft, startTop;

  container.addEventListener('mousedown', function(e) {
    if(e.target.closest('#dh-panel')) return;
    isDragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = container.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    // 切换为left/top定位以便拖拽
    container.style.right = 'auto';
    container.style.bottom = 'auto';
    container.style.left = startLeft + 'px';
    container.style.top = startTop + 'px';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if(!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if(Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved = true;
    container.style.left = (startLeft + dx) + 'px';
    container.style.top = (startTop + dy) + 'px';
    panel.style.left = 'auto';
    panel.style.right = '0';
  });

  document.addEventListener('mouseup', function() {
    if(!isDragging) return;
    isDragging = false;
  });

  container.addEventListener('click', function(e){
    if(dragMoved) { dragMoved = false; return; }
    if(e.target.closest('#dh-panel')) return;
    panel.classList.toggle('show');
  });

  document.getElementById('dh-close').addEventListener('click', function(){
    panel.classList.remove('show');
  });

  /* ---------- 自动朗读开关 ---------- */
  autoSpeakBtn.addEventListener('click', function(){
    autoSpeak = !autoSpeak;
    this.classList.toggle('active', autoSpeak);
    this.textContent = autoSpeak ? '\u{1F50A}' : '\u{1F507}';
    if(!autoSpeak && currentAudio) { currentAudio.pause(); currentAudio = null; }
  });

  /* ---------- 消息渲染 ---------- */
  function addMessage(text, isUser, voiceName) {
    const msg = document.createElement('div');
    msg.className = 'dh-msg' + (isUser ? ' user' : '');
    const voiceTag = (!isUser && voiceName) ? `<span class="dh-voice-tag">\u{1F50A} ${voiceName}</span>` : '';
    msg.innerHTML = `
      <div class="dh-msg-avatar">${isUser ? '\u{1F464}' : '\u{1F4DC}'}</div>
      <div class="dh-msg-bubble">${text}${voiceTag}</div>
    `;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ---------- TTS语音合成 ---------- */
  async function speakText(text, dialect) {
    if(!autoSpeak) return;
    if(currentAudio) { currentAudio.pause(); currentAudio = null; }
    // 截取前200字避免TTS过长
    const shortText = text.length > 200 ? text.substring(0, 200) + '...' : text;
    try {
      const res = await fetch('http://127.0.0.1:5000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: shortText, dialect: dialect })
      });
      const data = await res.json();
      if(data.success && data.audio) {
        const audioSrc = 'data:audio/mp3;base64,' + data.audio;
        currentAudio = new Audio(audioSrc);
        isSpeaking = true;
        // container.// speaking glow disabled;
        currentAudio.onended = function() {
          isSpeaking = false;
          // container.// speaking glow disabled;
          currentAudio = null;
        };
        currentAudio.onerror = function() {
          isSpeaking = false;
          // container.// speaking glow disabled;
          currentAudio = null;
        };
        await currentAudio.play();
      }
    } catch(e) {
      console.log('TTS调用失败:', e);
    }
  }

  /* ---------- 发送消息 ---------- */
  async function sendMessage(text) {
    if(!text) return;
    inputEl.value = '';
    addMessage(text, true);

    // 打字指示
    const typing = document.createElement('div');
    typing.className = 'dh-msg';
    typing.innerHTML = '<div class="dh-msg-avatar">\u{1F4DC}</div><div class="dh-msg-bubble dh-typing">墨韵书生正在思索...</div>';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    isSpeaking = true;
    // container.// speaking glow disabled;

    try {
      const res = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: '你是"墨韵书生"，一位精通中国古建筑与历史文化的学者。你说话温文尔雅，引经据典，乐于为游客讲解中国传统文化。当前页面是：' + pageName + '。' + currentTip,
          system: '你是一位中国古代学者，擅长讲解中国古建筑、历史和文化。请用简洁优雅的语言回答，适当引用古诗词。'
        })
      });
      const data = await res.json();
      typing.remove();
      const reply = (data.reply || data.response || data.message || data.answer || '书生正在整理思绪，稍后再答~').replace(/^(墨韵书生|书生|接引仙子)[\uff1a:]\s*/,'');
      const dialect = dialectSelect.value;
      addMessage(reply, false, dialectSelect.options[dialectSelect.selectedIndex].text);

      // 语音朗读
      speakText(reply, dialect);
    } catch(err) {
      typing.remove();
      addMessage('抱歉，书生暂时无法回应，请稍后再试。', false);
    }

    isSpeaking = false;
    // container.// speaking glow disabled;
  }

  sendBtn.addEventListener('click', function(){ sendMessage(inputEl.value.trim()); });
  inputEl.addEventListener('keydown', function(e){
    if(e.key === 'Enter') sendMessage(inputEl.value.trim());
  });

  /* ---------- 语音识别（STT） ---------- */
  let recognition = null;
  let isRecording = false;

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition) {
      console.log('浏览器不支持语音识别');
      micBtn.title = '您的浏览器不支持语音识别，请使用Chrome';
      micBtn.style.opacity = '0.4';
      return null;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'zh-CN';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = function() {
      isRecording = true;
      micBtn.classList.add('recording');
      inputEl.placeholder = '正在聆听...请说话';
    };

    rec.onresult = function(event) {
      let finalTranscript = '';
      let interimTranscript = '';
      for(let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if(event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      inputEl.value = finalTranscript || interimTranscript;
    };

    rec.onend = function() {
      isRecording = false;
      micBtn.classList.remove('recording');
      inputEl.placeholder = '输入你的问题...';
      // 如果有识别结果，自动发送
      const text = inputEl.value.trim();
      if(text) {
        sendMessage(text);
      }
    };

    rec.onerror = function(event) {
      isRecording = false;
      micBtn.classList.remove('recording');
      inputEl.placeholder = '输入你的问题...';
      if(event.error === 'not-allowed') {
        addMessage('请允许麦克风权限后重试~', false);
      } else if(event.error !== 'aborted' && event.error !== 'no-speech') {
        addMessage('语音识别出错：' + event.error, false);
      }
    };

    return rec;
  }

  micBtn.addEventListener('click', function() {
    if(!recognition) {
      recognition = initSpeechRecognition();
    }
    if(!recognition) return;

    if(isRecording) {
      recognition.stop();
    } else {
      // 如果有正在播放的语音，先停止
      if(currentAudio) { currentAudio.pause(); currentAudio = null; isSpeaking = false; }
      try {
        recognition.start();
      } catch(e) {
        console.log('语音识别启动失败:', e);
      }
    }
  });

})();