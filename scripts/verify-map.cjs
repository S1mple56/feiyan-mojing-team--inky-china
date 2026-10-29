const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../2d');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  await context.route('http://map.test/**',r=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(r.request().url()).pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404,body:'missing'});return r.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.JPG':'image/jpeg'}[path.extname(file)]||'application/octet-stream')});});
  await context.route(/^(?!http:\/\/map\.test\/).*/,r=>r.abort());
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE:',e.message);});
  await page.goto('http://map.test/index.html#map-china');
  await page.waitForFunction(()=>pixelEngine.hotspots.length>0&&Object.values(pixelEngine.cache).every(c=>c.loaded&&c.pixels)).catch(async e=>{console.error('CACHE:',await page.evaluate(()=>Object.entries(pixelEngine.cache).map(([key,val])=>[key,val.loaded,!!val.pixels])));throw e;});
  console.log('Loaded map masks.');
  const ids=await page.locator('.region-hotspot').evaluateAll(els=>els.map(e=>e.id));
  assert.equal(await page.locator('#journeyMapProgress details').getAttribute('open'),null,'progress panel starts collapsed');
  for(const id of ids){
   const point=await page.evaluate(id=>{
    const target=document.getElementById(id),r=pixelEngine.hitRect(target),candidates=[];
    for(let iy=1;iy<20;iy++)for(let ix=1;ix<20;ix++){const x=r.left+r.width*ix/20,y=r.top+r.height*iy/20;const top=document.elementFromPoint(x,y);if(!top?.closest('#map-china')||top.closest('button,a,summary,#journeyMapProgress'))continue;
     const hit=pixelEngine.hotspots.find(el=>{const b=pixelEngine.hitRect(el);return x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom&&!pixelEngine.isTransparent(el,x,y);});
     if(hit===target)candidates.push({x,y,d:Math.hypot(ix-10,iy-10)});
    }return candidates.sort((a,b)=>a.d-b.d)[0];
   },id);
   assert.ok(point,'visible hit area for '+id);
   await page.mouse.click(point.x,point.y);
   await page.locator('#province-preview-modal.active').waitFor();
   assert.equal(await page.evaluate(()=>window._previewProvinceKey),id.replace('region-',''));
   await page.waitForFunction(()=>{const i=document.querySelector('#province-preview-img');return i.complete&&i.naturalWidth>0;});
   await page.locator('#province-preview-cancel-btn').click();
   console.log('Clicked',id);
  }
  await page.locator('#journeyMapProgress summary').click();
  assert.equal(await page.locator('#province-preview-modal.active').count(),0,'progress toggle cannot click through to a province');
  await page.locator('#journeyMapProgress summary').click();
  // Verify a representative province and attraction after the board click.
  await page.evaluate(()=>showProvincePreview('henan'));
  await page.locator('#province-preview-enter-btn').click();
  assert.equal(await page.locator('#map-province.active').count(),1);
  assert.equal(await page.locator('#province-title').innerText(),'河南');
  assert.equal(await page.locator('#spot-yuntaishan').isVisible(),true);
  assert.ok(await page.locator('#spot-yuntaishan').evaluate(e=>!getComputedStyle(e).backgroundImage.includes('.png')));
  await page.getByRole('button',{name:'返回神州',exact:true}).click();
  assert.equal(await page.locator('#map-china.active').count(),1);
  fs.mkdirSync(path.resolve(root,'../tmp/map'),{recursive:true});await page.screenshot({path:path.resolve(root,'../tmp/map/map-fixed.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS:',ids.length,'province boards clickable; previews, province entry, attraction assets, return and progress-panel event isolation; offline local engine.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
