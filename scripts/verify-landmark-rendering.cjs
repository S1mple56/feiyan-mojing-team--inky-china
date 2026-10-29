const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto('http://127.0.0.1:8766/index.html#map-china');
  assert.equal(await page.evaluate(()=>Array.from(document.querySelectorAll('.landmark-spot')).every(el=>el.dataset.artState==='pending'&&getComputedStyle(el).backgroundImage==='none')),true,'unloaded icons never flash the old rectangular background');
  const results=await page.evaluate(async()=>{
   const output=[];
   for(const [id,province]of Object.entries(provinceContent)){
    enterProvince(id);
    for(const spot of province.spots){
     const element=document.getElementById(spot.id);await LandmarkRenderer.mount(element,spot.icon);
     const canvas=element.querySelector('canvas'),rgba=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
     let removed=0,opaque=0,dark=0;for(let p=0;p<rgba.length;p+=4){if(rgba[p+3]===0)removed++;else{opaque++;if(Math.max(rgba[p],rgba[p+1],rgba[p+2])<38)dark++;}}
     output.push({id:spot.id,removed,opaque,dark,background:getComputedStyle(element).backgroundImage});
    }
   }
   return output;
  });
  assert.equal(results.length,39);for(const r of results){assert.ok(r.removed>100,r.id+' exterior backdrop removed');assert.ok(r.opaque>100,r.id+' artwork remains');assert.equal(r.background,'none');}
  assert.equal(await page.locator('.landmark-label').count(),39);
  await page.evaluate(()=>enterProvince('fujian'));
  const spot=page.locator('#spot-qingjingsi'),entry=page.locator('[data-spot="spot-qingjingsi"]');
  const originalHeight=await spot.evaluate(el=>el.offsetHeight);
  await entry.hover();assert.equal(await spot.evaluate(el=>el.classList.contains('is-highlighted')),true);
  await page.mouse.move(1400,850);await spot.hover();assert.equal(await entry.evaluate(el=>el.classList.contains('is-highlighted')),true);
  assert.equal(await spot.evaluate(el=>el.offsetHeight),originalHeight,'hover never shifts artwork layout');
  await spot.focus();assert.equal(await spot.locator('.landmark-label small').isVisible(),true);
  await page.screenshot({path:path.join(__dirname,'../tmp/provinces/fujian-landmark-labels.png')});
  await page.mouse.move(1400,850);await spot.evaluate(el=>el.blur());
  for(const province of ['fujian','beijing','henan','shanxi','tianjin']){await page.evaluate(id=>enterProvince(id),province);await page.waitForTimeout(300);await page.screenshot({path:path.join(__dirname,'../tmp/provinces/'+province+'-clean-icons.png')});}
  // Preview navigation still works on a cleaned icon.
  await page.evaluate(()=>enterProvince('fujian'));await page.locator('#spot-qingjingsi').click();assert.equal(await page.locator('#attractionPreviewTitle').innerText(),'清净寺');
  await page.waitForSelector('.landmark-preview-art');assert.equal(await page.locator('#attractionPreviewImage').isVisible(),false);await page.screenshot({path:path.join(__dirname,'../tmp/provinces/qingjingsi-clean-preview.png')});
  fs.writeFileSync(path.join(__dirname,'../tmp/provinces/landmark-rendering-audit.json'),JSON.stringify(results,null,2));
  console.log('PASS: all 39 landmarks render without rectangular backdrops; artwork retained, preview click works.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
