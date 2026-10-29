/* Map PSD/video hotspots onto the existing module entry points. */
(() => {
    'use strict';
    const stage=document.getElementById('main-menu-stage');if(!stage)return;
    const main=document.getElementById('screen-main'),video=document.getElementById('bg-video');
    const music=document.getElementById('main-menu-music'),musicState=document.getElementById('main-menu-music-state');
    const account=document.getElementById('menu-account'),accountPanel=document.getElementById('main-menu-account-panel');
    const play=document.getElementById('main-menu-play'),status=document.getElementById('main-menu-status');
    stage.querySelectorAll('[data-screen]').forEach(link=>link.addEventListener('click',event=>{
        event.preventDefault();accountPanel.hidden=true;window.showScreen(link.dataset.screen);
    }));
    const closeAccount=()=>{accountPanel.hidden=true;account.setAttribute('aria-expanded','false');};
    function syncAccount(){
        const loggedIn=Boolean(localStorage.getItem('ancient_username'));
        account.setAttribute('aria-label',loggedIn?'个人中心':'登录 / 注册');
        account.querySelector('.menu-tooltip').textContent=loggedIn?'个人中心':'登录 / 注册';
        if(loggedIn){account.setAttribute('aria-haspopup','true');account.setAttribute('aria-expanded',String(!accountPanel.hidden));}
        else{account.removeAttribute('aria-haspopup');closeAccount();}
    }
    account.addEventListener('click',()=>{
        syncAccount();
        if(localStorage.getItem('ancient_username')){accountPanel.hidden=!accountPanel.hidden;account.setAttribute('aria-expanded',String(!accountPanel.hidden));}
        else document.getElementById('top-login-btn').click();
    });
    document.getElementById('main-menu-backpack').addEventListener('click',()=>{closeAccount();document.getElementById('top-backpack-btn').click();});
    document.getElementById('main-menu-login').addEventListener('click',()=>{closeAccount();document.getElementById('top-login-btn').click();syncAccount();});
    document.addEventListener('click',event=>{if(!accountPanel.contains(event.target)&&!account.contains(event.target))closeAccount();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!accountPanel.hidden){closeAccount();account.focus();}});
    const syncMusic=()=>{
        const enabled=!video.muted&&!video.paused;music.setAttribute('aria-pressed',String(enabled));
        music.setAttribute('aria-label',enabled?'关闭背景音乐':'开启背景音乐');
        music.querySelector('.menu-tooltip').textContent=enabled?'关闭背景音乐':'开启背景音乐';
        musicState.textContent=enabled?'已开启':'点击开启';
    };
    music.addEventListener('click',async()=>{
        if(!video.muted){video.muted=true;syncMusic();return;}
        try{video.volume=.45;video.muted=false;await video.play();syncMusic();}
        catch{video.muted=true;syncMusic();status.textContent='音乐暂未播放，请再次点击右下角背景音乐。';}
    });
    video.muted=true;video.volume=.45;
    video.addEventListener('volumechange',syncMusic);video.addEventListener('playing',syncMusic);video.addEventListener('pause',syncMusic);syncMusic();
    async function resume(){
        if(!main.classList.contains('active')||document.hidden)return;
        try{await video.play();play.hidden=true;}catch{play.hidden=false;}
    }
    play.addEventListener('click',resume);video.addEventListener('playing',()=>{play.hidden=true;});
    video.addEventListener('error',()=>{play.hidden=true;status.textContent='背景视频暂未载入，仍可使用全部菜单入口。';});
    const syncScreen=()=>{closeAccount();syncAccount();if(main.classList.contains('active'))resume();else{video.pause();play.hidden=true;}};
    new MutationObserver(syncScreen).observe(main,{attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else resume();});
    window.addEventListener('pageshow',syncScreen);syncScreen();
})();
