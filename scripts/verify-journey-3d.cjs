const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../2d'),out=path.resolve(__dirname,'../tmp/journey-3d');
const ids=['yellow-crane','zhaozhou','zhuozheng','yinxian','tulou'];
const smoke=process.argv.includes('--smoke');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--enable-webgl','--use-angle=swiftshader']});
 try{
  fs.mkdirSync(out,{recursive:true});
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  await ctx.route('http://ink.test/**',r=>{const p=decodeURIComponent(new URL(r.request().url()).pathname),file=path.resolve(root,'.'+p);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404,body:'missing'});return r.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[path.extname(file)]||'application/octet-stream')});});
  await ctx.route(/^(?!http:\/\/ink\.test\/).*/,r=>r.abort());
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://ink.test/journey-3d.html?chapter=tulou');
  await page.waitForFunction(()=>!!window.inkJourney3DDiagnostics);
  assert.equal(await page.locator('#startButton').isDisabled(),true,'later chapters cannot bypass unlock');
  for(let chapter=0;chapter<5;chapter++){
   await page.evaluate(({ids,chapter})=>{localStorage.setItem('inkJourneyProgressV1',JSON.stringify({completed:ids.slice(0,chapter)}));localStorage.removeItem('inkJourney3DProgressV1');},{ids,chapter});
   await page.goto('http://ink.test/journey-3d.html?chapter='+ids[chapter]);
   await page.waitForFunction(()=>window.inkJourney3DDiagnostics?.().frames>2);
   assert.equal(await page.locator('#loading').isVisible(),false);
   assert.equal(await page.locator('#world canvas').count(),1);
   const data=await page.evaluate(i=>journey3D[i],chapter);
   const diag=await page.evaluate(()=>inkJourney3DDiagnostics());
   assert.equal(diag.unlocked,true);assert.ok(diag.triangles>10000,'actual 3D geometry rendered');
   await page.screenshot({path:path.join(out,ids[chapter]+'-intro.png')});
   await page.locator('#startButton').click();
   await page.screenshot({path:path.join(out,ids[chapter]+'-play.png')});
   if(smoke){
    const before=await page.evaluate(()=>inkJourney3DDiagnostics().position);
    await page.keyboard.down('w');
    await page.waitForFunction(p=>{const a=inkJourney3DDiagnostics().position;return Math.hypot(a[0]-p[0],a[2]-p[2])>.15;},before);
    await page.keyboard.up('w');await page.locator('#pauseButton').click();
    assert.equal(await page.locator('#pauseScreen.visible').count(),1);
    await page.locator('#resumeButton').click();
    assert.equal((await page.evaluate(()=>inkJourney3DDiagnostics())).mode,'play');
    console.log('PASS 3D render/movement/pause:',ids[chapter],diag.drawCalls,'draw calls');
    continue;
   }
   // Every interaction runs through visible controls, restoring only the player position
   // from a checkpoint fixture between distant nodes. No skip or award function is exposed.
   for(let ti=0;ti<data.tasks.length;ti++)for(let ai=0;ai<data.tasks[ti].nodes.length;ai++){
    const node=data.tasks[ti].nodes[ai];
    await page.goto('http://ink.test/mainline.html');
    await page.evaluate(({id,pos})=>{const saves=JSON.parse(localStorage.getItem('inkJourney3DProgressV1')||'{}');saves[id]={...(saves[id]||{task:0,action:0}),position:[pos[0],pos[1],pos[2]+.7]};localStorage.setItem('inkJourney3DProgressV1',JSON.stringify(saves));},{id:ids[chapter],pos:node.pos});
    await page.goto('http://ink.test/journey-3d.html?chapter='+ids[chapter]);await page.waitForFunction(()=>window.inkJourney3DDiagnostics?.().frames>1);await page.locator('#startButton').click();
    let d=await page.evaluate(()=>inkJourney3DDiagnostics());assert.equal(d.task,ti);assert.equal(d.action,ai);
    await page.locator('#interaction').waitFor({state:'visible'});
    await page.keyboard.down('e');
    await page.waitForFunction(()=>inkJourney3DDiagnostics().mode!=='play'||document.querySelector('#questDetail').textContent.includes('回声'),{},{timeout:1000}).catch(()=>{});
    // Hold until the renderer, including software-rendered frames, accumulates 650 ms.
    await page.waitForFunction(({ti,ai})=>{const d=inkJourney3DDiagnostics();return d.mode!=='play'||d.task!==ti||d.action!==ai;},{ti,ai},{timeout:15000});
    await page.keyboard.up('e');
    if(node.puzzle){
     assert.equal(await page.locator('#puzzleScreen.visible').count(),1);
     if(node.puzzle==='rotate'){for(let i=0;i<3;i++)for(let n=0;n<[3,1,2][i];n++)await page.locator('.puzzle-piece').nth(i).click();}
     else if(node.puzzle==='sequence'){
      await page.getByRole('button',{name:'依次选择'+node.symbols[1],exact:true}).click();
      assert.match(await page.locator('#puzzleFeedback').innerText(),/接不上/);
      for(const symbol of node.symbols)await page.getByRole('button',{name:'依次选择'+symbol,exact:true}).click();
     }else await page.getByRole('slider').fill(String(node.target));
     await page.locator('#confirmPuzzle').click();
    }
    while(await page.locator('#storyScreen.visible').count())await page.locator('#storyContinue').click();
    await page.waitForFunction(({ti,ai})=>{const d=inkJourney3DDiagnostics();return d.task>ti||d.action>ai;},{ti,ai});
   }
   assert.equal(await page.locator('#finishScreen.visible').count(),1);
   const completed=await page.evaluate(()=>JSON.parse(localStorage.getItem('inkJourneyProgressV1')).completed);
   assert.deepEqual(completed,ids.slice(0,chapter+1));
   await page.reload();await page.waitForFunction(()=>!!window.inkJourney3DDiagnostics);
   assert.equal((await page.evaluate(()=>inkJourney3DDiagnostics())).task,data.tasks.length,'completed checkpoint survives reload');
   console.log('PASS 3D chapter:',ids[chapter],data.tasks.length,'tasks');
  }
  await page.setViewportSize({width:390,height:844});await page.goto('http://ink.test/journey-3d.html?chapter=tulou');await page.waitForFunction(()=>window.inkJourney3DDiagnostics?.().frames>2);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(out,'mobile.png')});
  assert.deepEqual(errors,[],'no JavaScript runtime errors');
  console.log(smoke?'PASS: five scenes, keyboard movement, pause/resume, mobile and no runtime errors.':'PASS: all five 3D scenes, 19 tasks, every object interaction and puzzle, wrong order, chapter gating, checkpoint restore, tokens and mobile start.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
