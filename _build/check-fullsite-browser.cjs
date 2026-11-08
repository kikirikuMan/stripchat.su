// Representative full-site rendering checks. External frames are replaced in memory;
// no third-party media or real camera/microphone is loaded by this test.
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const allLocales = ['ru','en','es','pt','de','zh','hi','ar'];
const selected = process.env.FULLSITE_LOCALES?.split(/[ ,]+/).filter(Boolean) || allLocales;
assert.ok(selected.length && selected.every(lang => allLocales.includes(lang)), 'Invalid FULLSITE_LOCALES');
const locales = allLocales.filter(lang => selected.includes(lang));
const tag = lang => lang === 'zh' ? 'zh-Hans' : lang;
const localize = (lang, route) => lang === 'ru' ? route : '/' + lang + route;
const identify = route => {
  const parts = route.split('/').filter(Boolean);
  return allLocales.slice(1).includes(parts[0]) ? parts[0] : 'ru';
};
const routes = ['/', '/o-sajte/', '/politika-konfidencialnosti/', '/kategorii/', '/gid/anonimnost/', '/model/oborudovanie/', '/partner/instrumenty/', '/help/'];
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.webmanifest':'application/manifest+json'};
const server = http.createServer((req,res) => {
  let file;
  try {file = path.resolve(root,'.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));}
  catch {res.writeHead(400); res.end(); return;}
  if (file !== root && !file.startsWith(root + path.sep)) {res.writeHead(403); res.end(); return;}
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404); res.end(); return;}
  res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});

function metadata(lang, route) {
  if (route === '/help/') return JSON.parse(fs.readFileSync(path.join(root,'_src/help/locales',lang+'.json'),'utf8')).ui;
  let original = route === '/' ? 'index.html' : route.slice(1,-1) + '.html';
  if (!fs.existsSync(path.join(root,'_src/pages',original))) original = route.slice(1) + 'index.html';
  const raw = fs.readFileSync(path.join(root,'_src/pages',original),'utf8');
  const source = JSON.parse(raw.match(/^\s*<!--([\s\S]*?)-->/)[1]);
  if (lang === 'ru') return source;
  const translated = JSON.parse(fs.readFileSync(path.join(root,'_src/site-locales',lang+'.json'),'utf8'));
  assert.ok(translated.pages[route],`${lang}: missing source translation ${route}`);
  return {...source,...translated.pages[route].meta};
}

async function checkDropdown(page, lang, route, base, enhanced = true) {
  const details = page.locator('details.language-switcher');
  const toggle = details.locator('summary');
  const menu = details.locator('.language-nav');
  assert.equal(await details.count(), 1, `${lang}${route}: one language disclosure`);
  assert.ok(await toggle.isVisible(), `${lang}${route}: language button is hidden`);
  assert.ok(await toggle.getAttribute('aria-label'), `${lang}${route}: button lacks accessible name`);
  assert.equal(await details.evaluate(node => node.open), false, `${lang}${route}: menu should begin closed`);
  assert.equal(await menu.isVisible(), false, `${lang}${route}: closed menu is visible`);
  const button = await toggle.boundingBox();
  const logo = await page.locator('.site-header .logo').boundingBox();
  assert.ok(button && logo && button.x >= logo.x + logo.width - 1, `${lang}${route}: language button is not to the right of logo`);
  await toggle.click();
  assert.ok(await menu.isVisible(), `${lang}${route}: language menu does not open`);
  assert.ok(await menu.locator('[aria-current="page"]').isVisible(), `${lang}${route}: current language not visible`);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${lang}${route}: open dropdown causes overflow`);
  const bounds = await menu.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(bounds && bounds.x >= -1 && bounds.x + bounds.width <= viewport.width + 1, `${lang}${route}: dropdown extends outside viewport`);
  if (enhanced) {
    await page.keyboard.press('Escape');
    assert.equal(await details.evaluate(node => node.open), false, `${lang}${route}: Escape does not close menu`);
    assert.ok(await toggle.evaluate(node => node === document.activeElement), `${lang}${route}: Escape does not restore focus`);
    await toggle.click();
    // At narrow widths the expanded menu intentionally overlays the heading.
    await page.mouse.click(4, 4);
    assert.equal(await details.evaluate(node => node.open), false, `${lang}${route}: outside click does not close menu`);
    await toggle.click();
  }
  const other = locales.find(candidate => candidate !== lang) || lang;
  await menu.locator(`a[href="${localize(other,route)}"]`).click();
  await page.waitForURL(base + localize(other,route));
  assert.equal(await page.locator('html').getAttribute('lang'),tag(other),`${lang}${route}: language link failed`);
  assert.equal(await page.locator('h1').textContent(),metadata(other,route).h1 || metadata(other,route).heading,`${lang}${route}: topic changed on language switch`);
}

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const channel = process.env.HELP_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined);
  const browser = await chromium.launch({channel,headless:true});
  const context = await browser.newContext();
  const failures = [], blockedFrames = new Set();
  await context.route('**/*', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === base) return route.continue();
    if (request.isNavigationRequest() && request.frame().parentFrame()) {
      blockedFrames.add(url.hostname + url.pathname);
      return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><head><title>External media disabled for local QA</title></head><body></body></html>'});
    }
    failures.push('Unexpected external resource: ' + url.hostname + url.pathname);
    return route.abort();
  });
  await context.addInitScript(() => {
    window.mediaRequests = 0;
    if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => {window.mediaRequests += 1; throw new Error('Real device access disabled in QA');};
  });
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => {if (message.type() === 'error') failures.push(message.text());});
  page.on('response', response => {if (response.url().startsWith(base) && response.status() >= 400) failures.push(`${response.status()} ${new URL(response.url()).pathname}`);});
  let renders = 0;
  try {
    for (const lang of locales) {
      for (const route of routes) {
        const expected = metadata(lang,route);
        for (const width of [320,1440]) {
          await page.setViewportSize({width,height:900});
          const response = await page.goto(base + localize(lang,route));
          assert.equal(response.status(),200,`${lang}${route}: HTTP status`);
          await page.evaluate(() => document.fonts.ready);
          const dimensions = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
          assert.ok(dimensions.scroll <= dimensions.client+1,`${lang}${route}: document overflow at ${width}`);
          assert.equal(await page.locator('html').getAttribute('lang'),tag(lang),`${lang}${route}: language`);
          assert.equal(await page.locator('html').getAttribute('dir'),lang === 'ar' ? 'rtl' : 'ltr',`${lang}${route}: direction`);
          assert.equal(await page.locator('h1').count(),1,`${lang}${route}: H1 count`);
          assert.equal(await page.locator('h1').textContent(),expected.h1 || expected.heading,`${lang}${route}: translated H1`);
          assert.equal(await page.title(),expected.title,`${lang}${route}: translated title`);
          const languageLinks = await page.locator('.language-nav a').evaluateAll(items => items.map(a => a.getAttribute('href')));
          assert.deepEqual(languageLinks,locales.map(other => localize(other,route)),`${lang}${route}: same-topic language switch`);
          assert.equal(await page.locator('.language-nav [aria-current="page"]').getAttribute('href'),localize(lang,route),`${lang}${route}: current language`);
          const ordinaryLinks = await page.locator('a[href]').evaluateAll(items => items.filter(a => !a.closest('.language-nav')).map(a => a.getAttribute('href')));
          for (const href of ordinaryLinks) {
            if (!href.startsWith('/') || href.startsWith('//')) continue;
            const pathname = new URL(href,base).pathname;
            if (/\.[a-z0-9]+$/i.test(pathname)) continue;
            assert.equal(identify(pathname),lang,`${lang}${route}: navigation leaves language: ${pathname}`);
          }
          if (route !== '/help/') assert.ok(await page.locator(`.site-nav a[href="${localize(lang,'/help/')}"]`).count(),`${lang}${route}: no help integration in main menu`);
          else assert.ok(await page.locator(`a[href="${localize(lang,'/o-sajte/')}"]`).count(),`${lang}: help About link is not localized`);
          assert.equal(await page.evaluate(() => window.mediaRequests),0,`${lang}${route}: unexpected device request`);
          if (route === '/' || route === '/help/' || route === '/o-sajte/') await checkDropdown(page,lang,route,base);
          renders += 1;
        }
      }
      const manifestResponse = await context.request.get(base + localize(lang,'/site.webmanifest'));
      assert.equal(manifestResponse.status(),200,`${lang}: manifest status`);
      const manifest = await manifestResponse.json();
      assert.equal(manifest.lang,tag(lang),`${lang}: manifest language`);
      assert.equal(manifest.start_url,localize(lang,'/'),`${lang}: manifest start URL`);
      await page.goto(base + localize(lang,'/404.html'));
      assert.equal(await page.locator('html').getAttribute('lang'),tag(lang),`${lang}: 404 language`);
      assert.match(await page.locator('meta[name="robots"]').getAttribute('content'),/noindex/,`${lang}: 404 indexability`);
      assert.ok(await page.locator(`a[href="${localize(lang,'/')}"]`).count(),`${lang}: 404 missing localized home link`);
    }
    for (const lang of ['en','ar'].filter(lang => locales.includes(lang))) {
      await page.setViewportSize({width:780,height:900});
      await page.goto(base + localize(lang,'/o-sajte/'));
      const before = await page.locator('main p').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize));
      await page.evaluate(() => {document.documentElement.style.fontSize='200%';});
      const after = await page.locator('main p').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize));
      assert.equal(after,before*2,`${lang}: main text does not scale to200%`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth+1),`${lang}: text zoom overflow`);
      await checkDropdown(page,lang,'/o-sajte/',base);
    }
    const plainContext = await browser.newContext({javaScriptEnabled:false});
    await plainContext.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    const plain = await plainContext.newPage();
    const plainLang = locales.includes('ar') ? 'ar' : locales[0];
    await plain.setViewportSize({width:320,height:900});
    await plain.goto(base + localize(plainLang,'/o-sajte/'));
    assert.equal(await plain.locator('h1').textContent(),metadata(plainLang,'/o-sajte/').h1,'Content requires JS');
    assert.ok(await plain.locator('main p').count() >= 3,'No-JS body missing');
    await checkDropdown(plain,plainLang,'/o-sajte/',base,false);
    await plainContext.close();
    if (process.env.FULLSITE_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.FULLSITE_SCREENSHOT_DIR,{recursive:true});
      for (const [lang,width] of [['en',1440],['ar',320],['de',320]]) {
        if (!locales.includes(lang)) continue;
        await page.setViewportSize({width,height:1000});
        await page.goto(base + localize(lang,'/o-sajte/'));
        await page.screenshot({path:path.join(process.env.FULLSITE_SCREENSHOT_DIR,`about-${lang}-${width}.png`),fullPage:true});
      }
    }
    assert.deepEqual(failures,[],'Console/resource failures');
    console.log(`PASS: ${renders} representative main/help renders across ${locales.length} locales at320/1440; translated metadata, RTL when selected, localized navigation, dropdown opening/closing and same-topic switches, manifests, 404s,200% text and no-JS content. External frame destinations blocked:${blockedFrames.size}; real device requests:0.`);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {console.error(error);server.close();process.exitCode=1;});
