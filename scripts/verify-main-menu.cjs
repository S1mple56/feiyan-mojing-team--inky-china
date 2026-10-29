const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../2d'),out=path.resolve(__dirname,'../tmp/main-menu');
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const before=JSON.parse(fs.readFileSync(path.join(out,'before-code-hashes.json'),'utf8'));
const changed=Object.keys(before).filter(file=>digest(path.join(root,file))!==before[file]);assert.deepEqual(changed,['index.html'],'only the existing main-menu HTML may change');
assert.equal(digest(path.join(root,'assets/main-menu/background.mp4')),digest('C:/Users/18780/Desktop/水墨主菜单背景视频.mp4'),'original background video copied unchanged');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),missing=[],errors=[];
  await context.route('http://menu.test/**',route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/__menu-before.html')return route.fulfill({body:fs.readFileSync(path.join(out,'before-index.html')),contentType:'text/html; charset=utf-8'});
   const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){missing.push(url.pathname);return route.fulfill({status:404,body:'missing'});}
   return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.ogg':'audio/ogg','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream')});
  });
  await context.route(/^(?!http:\/\/menu\.test\/).*/,route=>route.abort());
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://menu.test/index.html');await page.waitForFunction(()=>document.getElementById('bg-video').readyState>=2);
  assert.equal(await page.locator('#bg-video').evaluate(video=>video.currentSrc.endsWith('/assets/main-menu/background-hq.mp4')),true,'higher-quality dynamic video is active');
  assert.equal(await page.locator('#cloth-menu-container canvas').count(),0,'old menu is not initialized');
  assert.equal(await page.locator('#top-right-ui-container').isVisible(),false);
  assert.equal(await page.locator('#dh-container').isVisible(),false);
  const time=await page.locator('#bg-video').evaluate(video=>video.currentTime);await page.waitForTimeout(500);assert.ok(await page.locator('#bg-video').evaluate(video=>video.currentTime)>time,'background plays');
  for(const [width,height]of [[1920,1080],[1440,900],[1280,720],[390,844],[844,390]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(120);
   const layout=await page.evaluate(()=>{
    const stage=document.getElementById('main-menu-stage').getBoundingClientRect(),video=document.getElementById('bg-video').getBoundingClientRect();
    return {stage:{x:stage.x,y:stage.y,w:stage.width,h:stage.height},video:{x:video.x,y:video.y,w:video.width,h:video.height},hits:Array.from(document.querySelectorAll('#main-menu-stage .menu-hotspot')).map(element=>{const r=element.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{id:element.id,clickable:hit===element||element.contains(hit)};})};
   });
   assert.deepEqual(layout.stage,layout.video);assert.ok(Math.abs(layout.stage.w/layout.stage.h-16/9)<.001);assert.ok(layout.stage.x>=-.1&&layout.stage.y>=-.1,JSON.stringify({width,height,...layout.stage}));
   for(const hit of layout.hits)assert.equal(hit.clickable,true,width+' '+height+' '+hit.id+' aligned');
   await page.screenshot({path:path.join(out,'menu-'+width+'x'+height+'.png')});
   for(const [id,target]of [['menu-character','screen-char-select'],['menu-ai','screen-ai-custom'],['menu-teleport','screen-virtual-guide'],['menu-roam','map-china'],['menu-search','screen-virtual-guide']]){
    await page.locator('#'+id).click();assert.equal(await page.locator('#'+target).evaluate(el=>el.classList.contains('active')),true,id+' original screen');
    assert.equal(await page.locator('#top-right-ui-container').isVisible(),true,'secondary UI preserved');await page.evaluate(()=>showScreen('screen-main'));await page.waitForTimeout(30);
   }
  }
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#menu-account').click();assert.equal(await page.locator('#auth-modal').isVisible(),true);await page.evaluate(()=>closeAuthModal());
  for(const [id,target]of [['menu-games','games.html'],['menu-shop','wenchuang.html'],['menu-story','mainline.html']]){
   await page.locator('#'+id).click();await page.waitForURL('**/'+target);assert.ok(page.url().endsWith('/'+target));await page.goBack();
  }
  for(let i=0;i<2;i++){
   await page.locator('#main-menu-music').click();await page.waitForFunction(()=>{const video=document.getElementById('bg-video');return !video.muted&&!video.paused;});assert.equal(await page.locator('#main-menu-music').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#main-menu-music-state').innerText(),'已开启');
   await page.locator('#main-menu-music').click();assert.equal(await page.locator('#bg-video').evaluate(video=>video.muted&&!video.paused),true,'music off keeps background animation playing');assert.equal(await page.locator('#main-menu-music').getAttribute('aria-pressed'),'false');
  }
  assert.equal(await page.locator('#bgm-map').evaluate(audio=>audio.paused),true,'legacy music never overlaps the video soundtrack');
  await page.evaluate(()=>{localStorage.setItem('ancient_username','menu-qa');});await page.reload();
  await page.locator('#menu-account').click();assert.equal(await page.locator('#main-menu-account-panel').isVisible(),true);
  await page.evaluate(()=>{window.openBackpackModal=()=>window.__openedBackpack=true;});await page.locator('#main-menu-backpack').click();assert.equal(await page.evaluate(()=>window.__openedBackpack),true);
  await page.locator('#menu-account').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#main-menu-account-panel').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#main-menu-account-panel').isVisible(),false);
  const baselinePage=await context.newPage(),baselineErrors=[];baselinePage.on('pageerror',error=>baselineErrors.push(error.message));
  await baselinePage.goto('http://menu.test/__menu-before.html');await baselinePage.waitForTimeout(500);await baselinePage.close();
  assert.deepEqual([...new Set(missing)],[]);assert.deepEqual(errors.filter(error=>!baselineErrors.includes(error)),[],'no new runtime errors compared with original menu');
  fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({changedExistingFiles:changed,viewports:5,originalVideo:true,missing,errors,baselineErrors},null,2));
  console.log('PASS: PSD/video alignment at 5 viewport sizes; original module navigation, login/backpack/music actions; no unrelated existing code changes.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
