(function () {
    'use strict';
    const tokens = [
        {id:'yellow-crane',name:'黄鹤楼',token:'鹤羽',memory:'楼不是为了把人留下。'},
        {id:'zhaozhou',name:'赵州桥',token:'渡灯',memory:'桥要让人过去。'},
        {id:'zhuozheng',name:'拙政园',token:'四时画笺',memory:'留一扇窗，让时间经过。'},
        {id:'yinxian',name:'应县木塔',token:'匠尺',memory:'有人托住了你看不见的地方。'},
        {id:'tulou',name:'福建土楼',token:'团圆灯芯',memory:'原来每一个地方，都有人记得我。'}
    ];
    function completed() {
        try {
            const data=JSON.parse(localStorage.getItem('inkJourneyProgressV1') || '{}');
            const result=[];
            for(const t of tokens) {if(!Array.isArray(data?.completed) || !data.completed.includes(t.id)) break; result.push(t);}
            return result;
        } catch {return [];}
    }
    window.getJourneyItems = function () {
        return completed().map(t=>({item_name:t.token,item_desc:`神州长卷寻墨记 · ${t.name}：${t.memory}`,acquired_at:'',_source:'local'}));
    };
    function update() {
        const target=document.getElementById('journeyMapProgress');
        if(!target) return;
        const done=completed();
        target.replaceChildren();
        const panel=document.createElement('details');
        panel.style.cssText='padding:12px 15px;background:rgba(20,18,15,.94);border:1px solid #c8a45b;border-radius:12px';
        const title=document.createElement('summary');
        title.style.cssText='cursor:pointer;line-height:1.6';
        title.textContent=done.length===5?'执笔归来 · 长卷已复苏':`寻墨记 · 长卷修复 ${done.length} / 5`;
        panel.append(title);target.append(panel);
        const row=document.createElement('div');
        row.style.cssText='display:flex;flex-wrap:wrap;gap:8px;margin-top:10px';
        tokens.forEach((t,i)=>{
            const mark=document.createElement('span');
            const restored=i<done.length;
            mark.textContent=`${restored?'✓ ':''}${t.name}`;
            mark.style.cssText=`padding:5px 8px;border:1px solid ${restored?'#a4cbac':'#8b806b'};border-radius:6px;color:${restored?'#cef0ca':'#b8aa90'}`;
            row.append(mark);
        });
        panel.append(row);
        const link=document.createElement('a');
        link.href='mainline.html';link.textContent=done.length===5?'查看五件信物与记忆 →':'进入墨灵空间 / 继续上次进度 →';
        link.style.cssText='display:block;color:#f0d38b;margin-top:12px';panel.append(link);
    }
    update();
    window.addEventListener('pageshow',()=>{
        update();
        if(location.hash==='#map-china' && typeof window.showScreen==='function') window.showScreen('map-china');
    });
    window.addEventListener('storage',e=>{if(e.key==='inkJourneyProgressV1') update();});
})();
