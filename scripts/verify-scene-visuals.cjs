const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[path.join(process.env.USERPROFILE,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root=path.resolve(__dirname,'../2d'),out=path.resolve(__dirname,'../tmp/scene-visuals');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:900}}),missing=[],errors=[];
  await context.route('http://scene.test/**',route=>{
   const url=new URL(route.request().url()),file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){missing.push(url.pathname);return route.fulfill({status:404,body:'missing'});}
   return route.fulfill({body:fs.readFileSync(file),contentType:({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.css':'text/css','.svg':'image/svg+xml','.wav':'audio/wav','.mp3':'audio/mpeg','.mp4':'video/mp4'}[path.extname(file)]||'application/octet-stream')});
  });
  await context.route(/^(?!http:\/\/scene\.test\/).*/,route=>route.abort());
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(20000);
  const names=['zhuyufeng','hongshixia','wanshansi','zifanghu','diecaidong'];
  for(const file of ['yuntaishan.html',...names.map(name=>'yuntaishan/'+name+'.html')]){
   await page.goto('http://scene.test/'+file);
   assert.equal(await page.evaluate(async()=>{const value=getComputedStyle(document.getElementById('bg')).backgroundImage;const src=value.slice(5,-2);const image=new Image();image.src=src;await image.decode();return image.naturalWidth>100;}),true,file+' backdrop');
   await page.waitForFunction(()=>{const img=document.getElementById('dh-avatar');return !img||img.complete&&img.naturalWidth>0;});
   await page.screenshot({path:path.join(out,path.basename(file,'.html')+'-background.png')});console.log('Background OK:',file);
  }
  const pages=fs.readdirSync(root).filter(file=>file.endsWith('.html')&&fs.readFileSync(path.join(root,file),'utf8').includes('SceneCharacterRenderer.attach(this)')).concat(names.map(name=>'yuntaishan/'+name+'_scene.html'));
  const results=[];
  for(const file of pages.filter(file=>!process.env.SCENE_PAGE||file===process.env.SCENE_PAGE)){
   await page.goto('http://scene.test/'+file);await page.waitForFunction(()=>document.documentElement.dataset.characterRendering==='ready');
   const result=await page.evaluate(()=>{
    const scene=game.scene.scenes.find(scene=>scene.sys.isActive()),actors=scene.children.list.filter(actor=>actor.npcData&&actor.texture);
    return {background:scene.textures.exists('bg'),actors:actors.map(actor=>{
     const key=actor.texture.key,source=actor.texture.getSourceImage(),clean=key.endsWith('__transparent');
     let transparent=null;
     if(clean){const pixels=source.getContext('2d').getImageData(0,0,source.width,source.height).data;transparent=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]===0)transparent++;}
     return {key,clean,transparent,visible:actor.visible,source:source.src||'',size:[source.width,source.height],originalSize:clean?(()=>{const original=scene.textures.get(key.replace(/__transparent$/,'')).getSourceImage();return [original.width,original.height];})():null};
    })};
   });
   assert.equal(result.background,true,file+' background');assert.ok(result.actors.length>0,file+' NPCs');
   for(const actor of result.actors){assert.equal(actor.visible,true,file+' actor visible');assert.equal(actor.clean,true,file+' NPC must have transparent display');assert.ok(actor.transparent>actor.size[0]*actor.size[1]*.02,file+' alpha backdrop');assert.deepEqual(actor.size,actor.originalSize,file+' original physics dimensions preserved');}
   if(file.includes('yuntaishan/')||file==='huanghelou.html'){
    await page.evaluate(()=>{const scene=game.scene.scenes.find(scene=>scene.sys.isActive()),actor=scene.children.list.find(actor=>actor.npcData);scene.cameras.main.stopFollow();scene.cameras.main.centerOn(actor.x,actor.y);});
    await page.waitForTimeout(200);await page.screenshot({path:path.join(out,path.basename(file,'.html')+'-characters.png')});
   }
   results.push({file,...result});console.log('NPCs + background OK:',file,result.actors.length);
  }
  assert.deepEqual([...new Set(missing)],[],'local asset requests');assert.deepEqual(errors,[],'runtime errors');
  fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify({results,missing,errors},null,2));
  console.log('PASS: 6 Yuntai background pages and '+results.length+' exploration scenes; transparent NPCs, preserved dimensions, no local 404 or runtime errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
