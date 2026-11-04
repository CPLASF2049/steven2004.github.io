'use strict';
// Local, finite browser QA. No dependency installation or changes to the live GUI.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'preview');
fs.mkdirSync(out, { recursive: true });
const profile = path.join(out, `chrome-${Date.now()}`);
const prefix = '/steven2004.github.io/';
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.png':'image/png', '.jpg':'image/jpeg', '.gif':'image/gif', '.svg':'image/svg+xml', '.xml':'application/xml', '.woff2':'font/woff2' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser, ws, server;
async function main() {
  server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) { res.writeHead(302, { Location: prefix }); res.end(); return; }
    let file = path.resolve(root, 'public', pathname.slice(prefix.length));
    if (!file.startsWith(path.join(root, 'public'))) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = process.env.BLOG_PREVIEW_ORIGIN || `http://127.0.0.1:${server.address().port}`;
  browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', ...(process.env.BLOG_TOUCH_ONLY === '1' ? [] : ['--disable-gpu']), '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-networking', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, ...(process.env.BLOG_PREVIEW_PROXY ? [`--proxy-server=${process.env.BLOG_PREVIEW_PROXY}`] : []), 'about:blank'
  ], { stdio: 'inherit' });
  browser.on('error', e => { console.error(e.message); });
  browser.on('exit', code => { if (code) console.error('Chrome exited with code ' + code); });
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let n = 0; n < 100 && !fs.existsSync(portFile); n++) await sleep(100);
  if (!fs.existsSync(portFile)) throw new Error('Chrome did not expose a debugging port.');
  const debugPort = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  const target = targets.find(t => t.type === 'page');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  let seq = 0;
  const pending = new Map();
  const errors = [], failedRequests = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) { const p = pending.get(message.id); if (!p) return; clearTimeout(p.timer); pending.delete(message.id); message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Network.loadingFailed') failedRequests.push(message.params.errorText);
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 20000);
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  };
  await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
  const results = [];
  async function visit(name, route, width, height, dark = false, scrollSelector = '') {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
    await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
    await call('Page.navigate', { url: origin + prefix + route });
    for (let n = 0; n < 100; n++) {
      if (await evaluate(`document.readyState === 'complete' && !!document.querySelector('#board')`)) break;
      await sleep(150);
    }
    // Never modify image attributes: verify exactly what a visitor receives.
    await evaluate(`document.documentElement.setAttribute('data-user-color-scheme', '${dark ? 'dark' : 'light'}');`);
    await sleep(1000);
    if (scrollSelector) await evaluate(`document.querySelector(${JSON.stringify(scrollSelector)})?.scrollIntoView(); window.scrollBy(0, -100);`);
    for (let n = 0; n < 40; n++) {
      const ready = await evaluate(`Array.from(document.images).filter(i => i.getBoundingClientRect().top < innerHeight && i.getBoundingClientRect().bottom > 0).every(i => i.complete && i.naturalWidth > 0 && i.currentSrc === i.src)`);
      if (ready) break;
      await sleep(150);
    }
    const info = await evaluate(`(() => ({title: document.title, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, css: [...document.styleSheets].filter(s => s.href).map(s => {try{return {href:s.href, rules:s.cssRules.length}}catch{return {href:s.href,crossOrigin:true}}}), images: [...document.images].filter(i => i.getBoundingClientRect().top < innerHeight && i.getBoundingClientRect().bottom > 0).map(i=>({src:i.src,currentSrc:i.currentSrc,naturalWidth:i.naturalWidth,ok:i.complete&&i.naturalWidth>0&&i.currentSrc===i.src&&!i.hasAttribute('lazyload')})), headings: [...document.querySelectorAll('h1')].map(e=>e.textContent), cards: document.querySelectorAll('.journal-card').length, bodyColor: getComputedStyle(document.body).backgroundColor, overflow: [...document.querySelectorAll('body *')].filter(e => {const r=e.getBoundingClientRect();return r.width>0 && r.right>innerWidth+2 && getComputedStyle(e).position!=='fixed' && !e.closest('pre,table,.katex-display,.modal')}).slice(0,8).map(e=>e.tagName+'.'+e.className) }))()`);
    const design = await evaluate(`(() => { const banner=document.querySelector('.header-inner'); const latest=document.querySelector('.journal-latest'); const cards=[...document.querySelectorAll('.journal-card')]; const toc=document.querySelector('#toc-body > ol > li > a'); const glass=document.querySelector('.journal-feature') || document.querySelector('#board'); return {bannerHeight:banner?.getBoundingClientRect().height, latestBelowBanner:!latest || latest.getBoundingClientRect().top >= banner.getBoundingClientRect().bottom - 2, singleColumn:cards.every((c,i)=>!i || c.getBoundingClientRect().top >= cards[i-1].getBoundingClientRect().bottom - 2), tocFont:toc ? getComputedStyle(toc).fontSize : null, glassBlur:glass ? getComputedStyle(glass).backdropFilter : null}; })()`);
    Object.assign(info, design);
    const image = await call('Page.captureScreenshot', { format:'png', captureBeyondViewport:false });
    fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(image.data, 'base64'));
    results.push({ name, ...info });
    console.log(JSON.stringify({name,width:info.width,scrollWidth:info.scrollWidth,cards:info.cards,images:info.images.length,overflow:info.overflow}));
  }
  async function auditImages(route, name, withoutScripts = false) {
    await call('Emulation.setScriptExecutionDisabled', {value:withoutScripts});
    await call('Network.setCacheDisabled', {cacheDisabled:true});
    await call('Page.navigate', {url:origin + prefix + route});
    for (let n=0; n<100; n++) {
      if (await evaluate(`document.readyState === 'complete' && !!document.querySelector('#board')`)) break;
      await sleep(150);
    }
    const count = await evaluate('document.images.length');
    const images = [];
    for (let i=0; i<count; i++) {
      await evaluate(`document.images[${i}].scrollIntoView({block:'center'})`);
      let result;
      for (let n=0;n<40;n++) {
        result = await evaluate(`(() => {const i=document.images[${i}];return {src:i.src,currentSrc:i.currentSrc,naturalWidth:i.naturalWidth,ok:i.complete&&i.naturalWidth>0&&i.currentSrc===i.src&&!i.hasAttribute('lazyload')}})()`);
        if (result.ok) break;
        await sleep(150);
      }
      images.push(result);
    }
    await call('Emulation.setScriptExecutionDisabled', {value:false});
    results.push({name,images});
    console.log(JSON.stringify({name,count,loaded:images.filter(i=>i.ok).length,failures:images.filter(i=>!i.ok)}));
  }
  if (process.env.BLOG_TOUCH_ONLY === '1') {
    await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
    await call('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Linux; Android 12; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'});
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await call('Network.setCacheDisabled',{cacheDisabled:true});
    await call('Network.emulateNetworkConditions',{offline:false,latency:120,downloadThroughput:200000,uploadThroughput:100000,connectionType:'cellular4g'});
    const checks=[];
    for (const width of [390,320,430]) {
      await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:2,mobile:true});
      await call('Page.navigate',{url:origin+prefix+'?mobile-check=stability'});
      let ready=false;
      for(let n=0;n<200;n++) {ready=await evaluate(`document.readyState==='complete' && !!document.querySelector('.hero-writing[data-typewriter-ready]')`);if(ready)break;await sleep(200);}
      if(!ready) throw new Error('Touch page did not finish initialization');
      const capabilities=await evaluate(`({touch:navigator.maxTouchPoints,coarse:matchMedia('(pointer:coarse)').matches,motion:matchMedia('(prefers-reduced-motion:reduce)').matches})`);
      if(!capabilities.touch||!capabilities.coarse||capabilities.motion)throw new Error('Touch test not exercising real touch media settings');
      // Scroll down and back up twice with normal animations enabled, never altering image attributes.
      for(let cycle=0;cycle<2;cycle++) {
        for(const direction of [-1,1]) {
          for(let step=0;step<10;step++) {
            const startY=direction<0?700:180;
            await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:Math.floor(width/2),y:startY}]});
            for(let move=1;move<=6;move++) {
              await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.floor(width/2),y:startY+direction*move*80}]});
              await sleep(25);
            }
            await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
            await sleep(120);
            const state=await evaluate(`(() => {const cards=[...document.querySelectorAll('.journal-card')];const styles=cards.map(c=>getComputedStyle(c)); return {y:scrollY,overflow:document.documentElement.scrollWidth>innerWidth+1,visible:styles.every(s=>s.opacity==='1'&&s.visibility==='visible'&&s.transform==='none'&&s.animationName==='none'&&s.backdropFilter==='none'&&s.transformStyle==='flat'),ordered:cards.every((c,i)=>!i||c.getBoundingClientRect().top>=cards[i-1].getBoundingClientRect().bottom-1)};})()`);
            checks.push({width,cycle,direction,...state});
          }
        }
      }
      const imageCount=await evaluate('document.images.length');
      for(let i=0;i<imageCount;i++) {
        await evaluate(`document.images[${i}].scrollIntoView({block:'center'})`);
        let image;
        for(let n=0;n<80;n++) {image=await evaluate(`(() => {const i=document.images[${i}],r=i.getBoundingClientRect(),p=i.parentElement.getBoundingClientRect();return {loaded:i.complete&&i.naturalWidth>0&&i.currentSrc===i.src,height:r.height,ratio:p.width/p.height,bodyBelow:!i.closest('.journal-card')||i.closest('.journal-card').querySelector('.journal-card-body').getBoundingClientRect().top>=p.bottom-1};})()`);if(image.loaded)break;await sleep(200);}
        if(!image.loaded||image.height<50||Math.abs(image.ratio-16/9)>.05||!image.bodyBelow)throw new Error('Touch image sizing/loading failure '+JSON.stringify(image));
        if(i===imageCount-1){const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,'touch-after-scroll-'+width+'.png'),Buffer.from(shot.data,'base64'));}
      }
      console.log(JSON.stringify({width,capabilities,scrollChecks:checks.filter(c=>c.width===width).length,images:imageCount}));
    }
    const failures=checks.filter(c=>c.overflow||!c.visible||!c.ordered);
    for(const width of [390,320,430]) {const positions=checks.filter(c=>c.width===width).map(c=>c.y);if(Math.max(...positions)<2000||Math.min(...positions)>50) failures.push({width,reason:'Touch gestures did not traverse the page'});}
    fs.writeFileSync(path.join(out,'touch-check.json'),JSON.stringify({checks,errors,failures},null,2));
    await call('Browser.close');
    if(failures.length||errors.length)throw new Error('Touch scroll checks failed');
    console.log('Touch gestures, repeated scrolling, stable layout and actual image loading passed under throttling.');
    return;
  }
  await auditImages('', 'all-home-images');
  await auditImages('2026/10/30/quantum-autoencoder-notes/', 'all-article-images');
  await auditImages('about/', 'about-image');
  await auditImages('', 'home-images-without-javascript', true);
  if (process.env.BLOG_INNER_ONLY === '1') {
    const routes = [
      ['archives','archives/','.archive-journal'],
      ['categories','categories/','.collection-grid'],
      ['tags','tags/','.topic-cloud'],
      ['category-detail','categories/项目实践/','.archive-journal'],
      ['tag-detail','tags/Agent/','.archive-journal'],
      ['archive-month','archives/2026/10/','.archive-journal'],
      ['about','about/','.about-journal .about-section-nav a'],
      ['reading','2026/11/04/fin-agent-version-log/','.reading-toolbar']
    ];
    const checks=[];
    for (const [name,route,selector] of routes) {
      for (const [width,height,dark,suffix] of [[1440,1000,false,'desktop'],[390,844,false,'mobile'],[1440,1000,true,'dark']]) {
        await visit('inner-'+name+'-'+suffix,route,width,height,dark,'#board');
        const result=await evaluate(`(() => { const section=document.querySelector(${JSON.stringify(selector)}); const localLinks=[...document.querySelectorAll('#board a[href^="#"]')].filter(a=>a.hash.length>1); return {structure:!!section,brokenAnchors:localLinks.filter(a=>!document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a=>a.hash),content:document.querySelector('#board').textContent.length}; })()`);
        checks.push({name,suffix,...result});
        if(name==='reading' && suffix==='mobile') {
          await evaluate(`document.querySelector('.mobile-reading-toc summary').click()`);
          const opened=await evaluate(`document.querySelector('.mobile-reading-toc').open`);
          await evaluate(`document.querySelector('.mobile-reading-toc a').click()`);
          const jumped=await evaluate(`!!location.hash && !!document.getElementById(decodeURIComponent(location.hash.slice(1)))`);
          if(!opened||!jumped) throw new Error('Mobile TOC interaction failed');
          console.log('Mobile TOC opens and navigates to its chapter.');
        }
      }
    }
    // Every generated site-local href should map to an existing output route.
    const missing=[];
    function walk(dir) { for(const entry of fs.readdirSync(dir,{withFileTypes:true})) { const f=path.join(dir,entry.name); if(entry.isDirectory())walk(f); else if(f.endsWith('.html')) {const html=fs.readFileSync(f,'utf8'); for(const m of html.matchAll(/href="([^"#]*)"/g)) {if(!m[1].startsWith(prefix))continue; const p=decodeURIComponent(m[1].slice(prefix.length).split('?')[0]); if(!fs.existsSync(path.join(root,'public',p)))missing.push({file:f,href:m[1]});}} } }
    walk(path.join(root,'public'));
    const report={checks,results,errors:[...new Set(errors)],missing};
    fs.writeFileSync(path.join(out,'inner-check.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({checks,errors:report.errors,missing},null,2));
    await call('Browser.close');
    if(checks.some(c=>!c.structure||c.brokenAnchors.length||c.content<100)||errors.length||missing.length||results.some(r=>(r.width&&r.scrollWidth>r.width+1)||r.images?.some(i=>!i.ok))) throw new Error('Inner page checks failed.');
    console.log('Inner page structure, links, mobile TOC, layout and images passed.');
    return;
  }
  if (process.env.BLOG_HERO_ONLY === '1') {
    await visit('hero-desktop', '', 1440, 1000);
    await visit('hero-mobile', '', 390, 844);
    const reduced = await evaluate(`document.querySelector('.hero-writing').classList.contains('is-paused') && !!document.querySelector('[data-hero-verse]').textContent`);
    await call('Emulation.setScriptExecutionDisabled', {value:true});
    await call('Page.navigate', {url:origin+prefix});
    await sleep(1800);
    const fallback = await evaluate(`!!document.querySelector('[data-hero-title]')?.textContent && !!document.querySelector('[data-hero-verse]')?.textContent`);
    await call('Emulation.setScriptExecutionDisabled', {value:false});
    await call('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
    await call('Page.navigate', {url:origin+prefix});
    for (let n=0;n<100;n++) { if(await evaluate(`document.querySelector('.hero-writing')?.dataset.typewriterReady === 'true'`)) break; await sleep(100); }
    const titleA = await evaluate(`document.querySelector('[data-hero-title]').textContent`);
    await sleep(500);
    const titleB = await evaluate(`document.querySelector('[data-hero-title]').textContent`);
    await evaluate(`document.querySelector('[data-hero-next]').click()`);
    await sleep(450);
    const verseA = await evaluate(`document.querySelector('[data-hero-verse]').textContent`);
    await sleep(550);
    const verseB = await evaluate(`document.querySelector('[data-hero-verse]').textContent`);
    await evaluate(`document.querySelector('[data-hero-pause]').click()`);
    const pausedVerse = await evaluate(`document.querySelector('[data-hero-verse]').textContent`);
    await sleep(350);
    const pausedWorks = await evaluate(`document.querySelector('[data-hero-pause]').getAttribute('aria-pressed') === 'true' && document.querySelector('[data-hero-verse]').textContent === ${JSON.stringify(pausedVerse)}`);
    await evaluate(`document.querySelector('[data-hero-next]').click()`);
    const nextWorks = await evaluate(`document.querySelector('[data-hero-verse]').textContent !== ${JSON.stringify(pausedVerse)}`);
    const oldIndex = await evaluate(`document.querySelector('[data-hero-count]').textContent`);
    await evaluate(`document.querySelector('[data-hero-pause]').click()`);
    let cycles = false;
    for(let n=0;n<100;n++) { cycles=await evaluate(`document.querySelector('[data-hero-count]').textContent !== ${JSON.stringify(oldIndex)}`); if(cycles)break; await sleep(150); }
    const poemCount = await evaluate(`JSON.parse(document.querySelector('.hero-writing').dataset.poems).length`);
    const checks = {reduced,fallback,titleTypes:titleA!==titleB,verseTypes:verseA!==verseB,pausedWorks,nextWorks,cycles,poemCount};
    console.log(JSON.stringify(checks));
    fs.writeFileSync(path.join(out,'hero-check.json'),JSON.stringify({checks,results,errors},null,2));
    await call('Browser.close');
    if(Object.entries(checks).some(([k,v])=>k==='poemCount'?v<30:!v) || errors.length || results.some(r=>r.images?.some(i=>!i.ok))) throw new Error('Hero checks failed');
    console.log('Hero typing, rotation, controls, fallback and images passed.');
    return;
  }
  if (process.env.BLOG_IMAGES_ONLY === '1') {
    await visit('image-fix-live', '', 1440, 1000, false, '#latest-post');
    const failed = results.some(r=>r.images?.some(i=>!i.ok));
    fs.writeFileSync(path.join(out,'image-check.json'),JSON.stringify({results,errors},null,2));
    await call('Browser.close');
    if (failed) throw new Error('Actual browser image loading failed.');
    console.log('All actual images loaded, including without JavaScript.');
    return;
  }
  await visit('home-desktop', '', 1440, 1000);
  await visit('home-latest', '', 1440, 1000, false, '#latest-post');
  await visit('home-cards', '', 1440, 1000, false, '#journal-posts');
  await visit('home-mobile', '', 390, 844);
  const menu = await evaluate(`(() => { const t=document.querySelector('.navbar-toggler'); t?.click(); return !!t; })()`);
  await sleep(400);
  const menuVisible = await evaluate(`document.querySelector('#navbarSupportedContent')?.classList.contains('show') || !!document.querySelector('.navbar-collapse.show')`);
  results.push({ name:'mobile-menu', exists:menu, opens:menuVisible });
  await visit('home-small-mobile', '', 320, 740);
  await visit('home-tablet', '', 768, 1024);
  await visit('home-dark', '', 1440, 1000, true, '#latest-post');
  await visit('home-mobile-cards', '', 390, 844, false, '#journal-posts');
  await visit('article-desktop', '2026/11/04/fin-agent-version-log/', 1440, 1000);
  const search = await evaluate(`(() => {const b=document.querySelector('[data-target="#modalSearch"]');b?.click();return !!b})()`);
  await sleep(500);
  const searchVisible = await evaluate(`!!document.querySelector('#modalSearch.show')`);
  if (searchVisible) {
    await evaluate(`(() => {const i=document.querySelector('#local-search-input');i.value='Agent';i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await sleep(1000);
  }
  const searchText = await evaluate(`document.querySelector('#local-search-result')?.textContent.trim().slice(0,300) || ''`);
  results.push({ name:'search', exists:search, opens:searchVisible, results:searchText });
  await visit('article-mobile', '2026/11/04/fin-agent-version-log/', 390, 844, false, '#board');
  await visit('article-dark', '2026/11/04/fin-agent-version-log/', 1440, 1000, true, '#board');
  await visit('math-mobile', '2026/10/30/quantum-autoencoder-notes/', 390, 844, false, '.katex-display');
  await visit('archive-desktop', 'archives/', 1440, 1000);
  await call('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await call('Page.navigate', {url: origin + prefix});
  await sleep(2500);
  const hearts = await evaluate(`(() => { document.body.dispatchEvent(new MouseEvent('click', {bubbles:true,clientX:300,clientY:300})); return document.querySelectorAll('.fx-heart').length; })()`);
  await sleep(2000);
  const heartsAfter = await evaluate(`document.querySelectorAll('.fx-heart').length`);
  results.push({name:'hearts', count:hearts, cleaned:heartsAfter===0});
  // Check all homepage same-site links resolve to generated files.
  const home = fs.readFileSync(path.join(root,'public','index.html'),'utf8');
  const missingLinks = [...home.matchAll(/href="(\/steven2004\.github\.io\/[^"#]*)"/g)].map(m=>decodeURIComponent(m[1].slice(prefix.length))).filter(p=> !fs.existsSync(path.join(root,'public',p.split('?')[0])));
  const report = {results, errors:[...new Set(errors)], failedRequests:[...new Set(failedRequests)], missingLinks:[...new Set(missingLinks)]};
  fs.writeFileSync(path.join(out,'visual-check.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify({errors:report.errors, missingLinks:report.missingLinks, interactions:results.filter(x=>x.name==='search'||x.name==='mobile-menu')},null,2));
  const failures = results.filter(r => (r.latestBelowBanner === false) || (r.singleColumn === false) || (r.name === 'home-desktop' && r.bannerHeight < 990) || (r.tocFont && parseFloat(r.tocFont) < 18) || (r.name === 'hearts' && (r.count !== 3 || !r.cleaned)) || (r.width && r.scrollWidth > r.width + 1) || (r.images && r.images.some(i => !i.ok)) || (r.name === 'mobile-menu' && !r.opens) || (r.name === 'search' && (!r.opens || !r.results.includes('金融Fin-agent'))));
  await call('Browser.close');
  if (report.errors.length || report.missingLinks.length || failures.length) throw new Error('Browser validation failed: ' + JSON.stringify(failures.map(r => r.name)));
  console.log('Browser checks passed.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>{
  if (ws) ws.close();
  if (browser && !browser.killed) browser.kill();
  if (server) server.close();
});
