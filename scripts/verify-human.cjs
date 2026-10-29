const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../2d'),out=path.resolve(__dirname,'../tmp/human');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-webgl','--use-angle=swiftshader']});
 try{
  fs.mkdirSync(out,{recursive:true});const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.route('http://human.test/**',r=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(r.request().url()).pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404,body:'missing'});return r.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.glb':'model/gltf-binary'}[path.extname(file)]||'application/octet-stream')});});
  await context.route(/^(?!http:\/\/human\.test\/).*/,r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://human.test/journey-3d.html?chapter=yellow-crane');
  await page.waitForFunction(()=>window.inkJourney3DDiagnostics?.().humanAssets==='ready',{},{timeout:60000});
  let d=await page.evaluate(()=>inkJourney3DDiagnostics());assert.equal(d.scannedActors,3);
  await page.locator('#startPortrait').click();
  assert.equal(await page.locator('#characterScreen.visible').count(),1);
  // Allow the camera to settle using frame count, not a fixed screenshot delay.
  let frames=d.frames;await page.waitForFunction(n=>inkJourney3DDiagnostics().frames>n+35,frames);
  await page.screenshot({path:path.join(out,'full-body.png')});
  await page.locator('#portraitFace').click();frames=(await page.evaluate(()=>inkJourney3DDiagnostics())).frames;await page.waitForFunction(n=>inkJourney3DDiagnostics().frames>n+30,frames);
  await page.screenshot({path:path.join(out,'face.png')});
  await page.locator('#portraitRotate').click();frames=(await page.evaluate(()=>inkJourney3DDiagnostics())).frames;await page.waitForFunction(n=>inkJourney3DDiagnostics().frames>n+25,frames);
  await page.screenshot({path:path.join(out,'face-three-quarter.png')});
  await page.keyboard.press('Escape');assert.equal(await page.locator('#startScreen.visible').count(),1);
  await page.locator('#startButton').click();
  const before=await page.evaluate(()=>inkJourney3DDiagnostics().position);await page.keyboard.down('w');await page.waitForFunction(p=>{const a=inkJourney3DDiagnostics().position;return Math.hypot(a[0]-p[0],a[2]-p[2])>.15;},before);await page.keyboard.up('w');
  await page.locator('#characterButton').click();assert.equal((await page.evaluate(()=>inkJourney3DDiagnostics())).mode,'portrait');await page.locator('#closePortrait').click();assert.equal((await page.evaluate(()=>inkJourney3DDiagnostics())).mode,'play');
  await page.setViewportSize({width:390,height:844});await page.locator('#characterButton').click();await page.locator('#portraitFace').click();frames=(await page.evaluate(()=>inkJourney3DDiagnostics())).frames;await page.waitForFunction(n=>inkJourney3DDiagnostics().frames>n+30,frames);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:path.join(out,'mobile-face.png')});
  await page.route('**/assets/characters/scan/head.glb',r=>r.abort());
  await page.reload();await page.waitForFunction(()=>window.inkJourney3DDiagnostics?.().humanAssets==='failed');
  await page.locator('#startPortrait').click();assert.match(await page.locator('#humanAssetStatus').innerText(),/加载失败/);await page.locator('#closePortrait').click();await page.locator('#startButton').click();assert.equal((await page.evaluate(()=>inkJourney3DDiagnostics())).mode,'play');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile game header fits');assert.deepEqual(errors,[]);
  console.log('PASS: local scanned face and textures; all characters upgraded; full body / face / rotation; return from intro and game; movement; mobile; missing-model fallback; no runtime errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
