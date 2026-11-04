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
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
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
    await evaluate(`document.documentElement.setAttribute('data-user-color-scheme', '${dark ? 'dark' : 'light'}'); document.querySelectorAll('img[lazyload]').forEach(i => { i.removeAttribute('srcset'); i.removeAttribute('lazyload'); });`);
    await sleep(1000);
    if (scrollSelector) await evaluate(`document.querySelector(${JSON.stringify(scrollSelector)})?.scrollIntoView(); window.scrollBy(0, -100);`);
    await sleep(150);
    const info = await evaluate(`(() => ({title: document.title, width: innerWidth, scrollWidth: document.documentElement.scrollWidth, css: [...document.styleSheets].filter(s => s.href).map(s => {try{return {href:s.href, rules:s.cssRules.length}}catch{return {href:s.href,crossOrigin:true}}}), images: [...document.images].filter(i => i.getBoundingClientRect().top < innerHeight && i.getBoundingClientRect().bottom > 0).map(i=>({src:i.src,ok:i.complete&&i.naturalWidth>0})), headings: [...document.querySelectorAll('h1')].map(e=>e.textContent), cards: document.querySelectorAll('.journal-card').length, bodyColor: getComputedStyle(document.body).backgroundColor, overflow: [...document.querySelectorAll('body *')].filter(e => {const r=e.getBoundingClientRect();return r.width>0 && r.right>innerWidth+2 && getComputedStyle(e).position!=='fixed' && !e.closest('pre,table,.katex-display,.modal')}).slice(0,8).map(e=>e.tagName+'.'+e.className) }))()`);
    const image = await call('Page.captureScreenshot', { format:'png', captureBeyondViewport:false });
    fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(image.data, 'base64'));
    results.push({ name, ...info });
    console.log(JSON.stringify({name,width:info.width,scrollWidth:info.scrollWidth,cards:info.cards,images:info.images.length,overflow:info.overflow}));
  }
  await visit('home-desktop', '', 1440, 1000);
  await visit('home-cards', '', 1440, 1000, false, '#journal-posts');
  await visit('home-mobile', '', 390, 844);
  const menu = await evaluate(`(() => { const t=document.querySelector('.navbar-toggler'); t?.click(); return !!t; })()`);
  await sleep(400);
  const menuVisible = await evaluate(`document.querySelector('#navbarSupportedContent')?.classList.contains('show') || !!document.querySelector('.navbar-collapse.show')`);
  results.push({ name:'mobile-menu', exists:menu, opens:menuVisible });
  await visit('home-small-mobile', '', 320, 740);
  await visit('home-tablet', '', 768, 1024);
  await visit('home-dark', '', 1440, 1000, true);
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
  // Check all homepage same-site links resolve to generated files.
  const home = fs.readFileSync(path.join(root,'public','index.html'),'utf8');
  const missingLinks = [...home.matchAll(/href="(\/steven2004\.github\.io\/[^"#]*)"/g)].map(m=>decodeURIComponent(m[1].slice(prefix.length))).filter(p=> !fs.existsSync(path.join(root,'public',p.split('?')[0])));
  const report = {results, errors:[...new Set(errors)], failedRequests:[...new Set(failedRequests)], missingLinks:[...new Set(missingLinks)]};
  fs.writeFileSync(path.join(out,'visual-check.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify({errors:report.errors, missingLinks:report.missingLinks, interactions:results.filter(x=>x.name==='search'||x.name==='mobile-menu')},null,2));
  const failures = results.filter(r => (r.width && r.scrollWidth > r.width + 1) || (r.images && r.images.some(i => !i.ok)) || (r.name === 'mobile-menu' && !r.opens) || (r.name === 'search' && (!r.opens || !r.results.includes('金融Fin-agent'))));
  await call('Browser.close');
  if (report.errors.length || report.missingLinks.length || failures.length) throw new Error('Browser validation failed: ' + JSON.stringify(failures.map(r => r.name)));
  console.log('Browser checks passed.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;}).finally(()=>{
  if (ws) ws.close();
  if (browser && !browser.killed) browser.kill();
  if (server) server.close();
});
