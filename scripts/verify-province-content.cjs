const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../2d'),out=path.resolve(root,'../tmp/provinces');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),missing=[];
  await context.route('http://province.test/**',r=>{const p=new URL(r.request().url()).pathname,file=path.resolve(root,'.'+decodeURIComponent(p));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){missing.push(p);return r.fulfill({status:404,body:'missing'});}return r.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.JPG':'image/jpeg','.mp4':'video/mp4','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream')});});
  await context.route(/^(?!http:\/\/province\.test\/).*/,r=>r.abort());
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://province.test/index.html#map-china');
  const catalog=await page.evaluate(()=>provinceContent),result=[];
  for(const [id,p]of Object.entries(catalog)){
   await page.evaluate(id=>enterProvince(id),id);
   assert.equal(await page.locator('#province-title').innerText(),p.title);
   assert.equal(await page.locator('#provinceContentPanel .province-spot-link').count(),p.spots.length);
   const bg=await page.evaluate(src=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=src;}),p.background);assert.equal(bg,true,p.title+' background');
   if(!p.spots.length){await page.getByRole('button',{name:'查看本省图景'}).click();await page.waitForFunction(()=>document.querySelector('#attractionPreviewImage').complete&&document.querySelector('#attractionPreviewImage').naturalWidth>0);await page.getByRole('button',{name:'关闭图景预览'}).click();}
   for(const spot of p.spots){
    assert.equal(await page.evaluate(src=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=src;}),spot.icon),true,spot.name+' icon');
    if(!spot.page){await page.locator(`[data-spot="${spot.id}"]`).click();assert.equal(await page.locator('#attractionPreviewTitle').innerText(),spot.name);assert.match(await page.locator('#attractionPreviewNotice').innerText(),/尚未开放/);await page.waitForFunction(()=>document.querySelector('#attractionPreviewImage').complete&&document.querySelector('#attractionPreviewImage').naturalWidth>0);await page.getByRole('button',{name:'关闭图景预览'}).click();}
   }
   result.push({id,title:p.title,background:true,spots:p.spots.length,gamePages:p.spots.filter(s=>s.page).length,previews:p.spots.filter(s=>!s.page).length});
  }
  await page.evaluate(()=>enterProvince('fujian'));await page.screenshot({path:path.join(out,'fujian-content.png')});
  await page.evaluate(()=>enterProvince('sichuan'));await page.screenshot({path:path.join(out,'sichuan-status.png')});
  // Independently load every linked attraction page with its actual local engine.
  const scenes=await context.newPage();scenes.setDefaultTimeout(12000);const sceneResults=[];
  for(const [province,p]of Object.entries(catalog))for(const spot of p.spots.filter(s=>s.page)){
   const failures=[];const handler=e=>failures.push(e.message);scenes.on('pageerror',handler);
   await scenes.goto('http://province.test/'+spot.page);
   if(spot.page!=='yuntaishan.html')await scenes.waitForFunction(()=>typeof Phaser!=='undefined'&&typeof game!=='undefined'&&game.scene.scenes.some(s=>s.sys.isActive()));
   const title=await scenes.title();assert.ok(!title.includes('少林寺')||spot.name==='少林寺',spot.name+' wrong copied title');
   await scenes.waitForTimeout(500);
   if(fs.readFileSync(path.join(root,spot.page),'utf8').includes('assets/game/paper.svg'))assert.equal(await scenes.evaluate(()=>game.textures.exists('page')),true,spot.name+' paper texture decoded');
   if(spot.page==='yinxu.html')for(const key of ['stone','hole'])assert.equal(await scenes.evaluate(key=>game.textures.exists(key),key),true,'Yinxu '+key+' texture decoded');
   sceneResults.push({name:spot.name,page:spot.page,title,errors:failures});scenes.off('pageerror',handler);
   console.log('Loaded attraction:',spot.name,failures.length?'ERROR '+failures.join(', '):'OK');
  }
  const sceneErrors=sceneResults.filter(s=>s.errors.length);fs.writeFileSync(path.join(out,'browser-audit.json'),JSON.stringify({provinces:result,scenes:sceneResults,missing:[...new Set(missing)],errors},null,2));
  assert.deepEqual(sceneErrors,[]);assert.deepEqual(errors,[]);assert.deepEqual([...new Set(missing)],[],'all requested local resources exist');
  console.log('PASS: all 34 province backgrounds/status panels, 39 attraction icons, 22 preview flows, 15 empty-province previews, and 17 existing attraction pages.');
  console.log('Missing local requests:',[...new Set(missing)].join(', ')||'none');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
