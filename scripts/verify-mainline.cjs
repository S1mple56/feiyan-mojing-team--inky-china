/* Run with Node and Playwright. No backend or paid AI calls required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(require.resolve('playwright', {paths: [process.env.NODE_PATH || path.join(process.env.USERPROFILE, '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules')]}));
const root = path.resolve(__dirname, '../2d');
(async () => {
    const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
    const browser = await chromium.launch({headless: true, ...(fs.existsSync(edge) ? {executablePath:edge} : {})});
    try {
        const context = await browser.newContext();
        await context.route('http://journey.test/**', route => {
            const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
            const file = path.resolve(root, '.' + (pathname === '/' ? '/mainline.html' : pathname));
            if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return route.fulfill({status:404,body:'Not found'});
            const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'}[path.extname(file)] || 'application/octet-stream';
            return route.fulfill({body:fs.readFileSync(file),contentType:type});
        });
        // Keep verification offline, including homepage CDN and media requests.
        await context.route(/^(?!http:\/\/journey\.test\/).*/, route=>route.abort());
        const page=await context.newPage();
        const errors=[];
        page.on('pageerror', e=>errors.push(e.message));
        await page.goto('http://journey.test/mainline.html');
        assert.equal(await page.locator('.chapter-card:disabled').count(),4);
        assert.equal(await page.locator('.guide-tab').count(),5);
        assert.match(await page.locator('h1').innerText(),/神州长卷/);
        const chapterTaskCounts=[3,4,4,4,4];
        for(let i=0;i<5;i++) {
            await page.locator('.guide-tab').nth(i).click();
            assert.equal(await page.locator('.guide-task-list li').count(),chapterTaskCounts[i]);
            assert.equal(await page.locator('.guide-tab').nth(i).getAttribute('aria-pressed'),'true');
            assert.equal(await page.locator('.guide-reward').innerText().then(t=>t.includes('小墨灵：')),false,'locked memory does not reveal ending');
            assert.equal(await page.locator('.guide-actions .primary-btn').isDisabled(),i>0);
        }
        await page.locator('.guide-tab').first().click();
        // Main chapter cards retain the existing explorable game routes.
        await page.locator('.chapter-card').first().click();
        await page.waitForURL('**/journey-3d.html?chapter=yellow-crane');
        assert.equal(await page.locator('#startScreen').count(),1);
        await page.goto('http://journey.test/mainline.html');
        await page.getByRole('button',{name:'打开交互手记'}).click();
        await page.locator('.operation-btn').nth(0).click();
        await page.reload();
        await page.getByRole('button',{name:'打开交互手记'}).click();
        assert.equal(await page.locator('.operation-btn:disabled').count(),1,'partial action survives reload');
        await page.locator('.operation-btn').nth(1).click();
        await page.locator('.operation-btn').nth(2).click();
        await page.locator('#nextTaskBtn').click();
        await page.locator('.operation-btn').nth(1).click();
        assert.equal(await page.locator('.operation-btn:disabled').count(),0,'wrong window cannot advance');
        assert.match(await page.locator('#feedback').innerText(),/缺少前一步/);
        // Complete every action using the intended sequences through visible controls.
        const orders=await page.evaluate(()=>encounters.map(list=>list.map(op=>op.order)));
        for(let chapter=0;chapter<5;chapter++) {
            if(chapter>0) {
                await page.locator('.guide-tab').nth(chapter).click();
                await page.getByRole('button',{name:'打开交互手记'}).click();
            }
            for(let task=chapter===0?1:0;task<orders[chapter].length;task++) {
                for(const action of orders[chapter][task]) await page.locator('.operation-btn').nth(action).click();
                await page.locator('#nextTaskBtn').click();
            }
            await page.getByRole('button',{name:'走出长卷 · 查看行囊'}).click();
            assert.equal(await page.locator('.memory-token').count(),chapter+1);
        }
        assert.equal(await page.locator('#endingSection.show').count(),1);
        await page.reload();
        assert.equal(await page.locator('.memory-token').count(),5,'all rewards survive reload');
        await page.locator('.guide-tab').first().click();
        await page.getByRole('button',{name:'打开交互手记'}).click();
        assert.equal(await page.locator('.operation-btn').count(),0,'completed chapter is read only');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#journeyOverlay.show').count(),0);
        fs.mkdirSync(path.join(root,'../tmp/journey'),{recursive:true});
        await page.screenshot({path:path.join(root,'../tmp/journey/desktop.png'),fullPage:true});
        await page.setViewportSize({width:390,height:844});
        await page.locator('.guide-tab').nth(4).click();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,'mobile guide fits viewport');
        await page.screenshot({path:path.join(root,'../tmp/journey/mobile-guide.png'),fullPage:true});
        await page.getByRole('button',{name:'打开交互手记'}).click();
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,'mobile page fits viewport');
        await page.screenshot({path:path.join(root,'../tmp/journey/mobile.png'),fullPage:true});
        assert.deepEqual(errors,[]);
        await page.goto('http://journey.test/index.html#map-china');
        assert.match(await page.locator('#journeyMapProgress').innerText(),/执笔归来/);
        assert.equal(await page.evaluate(()=>getLocalStorageItems().filter(it=>it.item_desc.includes('神州长卷寻墨记')).length),5);
        // Corrupt/legacy saves must not grant arbitrary chapters or crash startup.
        await page.evaluate(()=>localStorage.setItem('inkJourneyProgressV1',JSON.stringify({completed:['bogus','tulou'],progress:{'yellow-crane':{task:999,actions:[999]}}})));
        await page.goto('http://journey.test/mainline.html');
        assert.equal(await page.locator('.chapter-card:disabled').count(),4);
        await page.evaluate(()=>localStorage.setItem('inkJourneyProgressV1','invalid-json'));
        await page.reload();
        assert.equal(await page.locator('.chapter-card:disabled').count(),4);
        for(const oldTask of [2,3]) {
            await page.evaluate(task=>localStorage.setItem('inkJourneyProgressV1',JSON.stringify({completed:[],progress:{'yellow-crane':{task,actions:[0,1]}}})),oldTask);
            await page.reload();
            await page.getByRole('button',{name:'打开交互手记'}).click();
            assert.equal(await page.locator('.operation-btn:disabled').count(),oldTask===3?5:2,'old ferry/farewell save migrates');
            await page.keyboard.press('Escape');
            await page.reload();
            await page.getByRole('button',{name:'打开交互手记'}).click();
            assert.equal(await page.locator('.operation-btn:disabled').count(),oldTask===3?5:2,'migrated save survives a second load');
            await page.keyboard.press('Escape');
        }
        console.log('PASS: chapter gating, action dependencies, partial saves, 19-task completion, tokens, ending, map/backpack, mobile layout, corrupt saves.');
    } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
