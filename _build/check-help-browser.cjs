// Install pinned development tools with npm ci --ignore-scripts.
// Tests use synthetic media, never real devices.
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png'};
const server = http.createServer((req,res) => {
  let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403); res.end(); return;}
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
  if (!fs.existsSync(file)) {res.writeHead(404); res.end(); return;}
  res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');
  res.end(fs.readFileSync(file));
});

(async () => {
  const {readHelpLocales, helpUrl: urlFor, TOPICS} = await import(pathToFileURL(path.join(__dirname,'help.mjs')).href);
  const localeData = readHelpLocales(root);
  const locales = localeData.map(data => data.locale);
  const viewports = [320,1440];
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const channel = process.env.HELP_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined);
  const browser = await chromium.launch({channel,headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
  const context = await browser.newContext({permissions:['camera','microphone']});
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => {if(message.type() === 'error') failures.push(message.text());});
  page.on('response', response => {if(response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);});
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin !== base) {
      failures.push('Unexpected external request: '+route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.addInitScript(() => {
    const get = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    window.testRequests = [];
    window.testStreams = [];
    navigator.mediaDevices.getUserMedia = async options => {
      window.testRequests.push(options);
      const stream = await get(options);
      window.testStreams.push(stream);
      return stream;
    };
  });
  try {
    for (const data of localeData) {
      for (const article of [null,...data.articles]) {
        const id = article?.id || '';
        const route = urlFor(data.locale,id);
        for (const width of viewports) {
          await page.setViewportSize({width,height:900});
          const response = await page.goto(base + route);
          assert.equal(response.status(),200,`${route} is not available`);
          await page.evaluate(() => document.fonts.ready);
          await page.locator('img').evaluateAll(async images => {
            for (const image of images) image.loading = 'eager';
            await Promise.all(images.map(image => image.decode()));
          });
          const dimensions = await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
          assert.ok(dimensions.scroll <= dimensions.client + 1,`${route} overflow at ${width}`);
          assert.equal(await page.locator('h1').count(),1,`${route}: H1 count`);
          assert.equal(await page.locator('h1').textContent(),article?.heading || data.ui.heading,`${route}: wrong localized heading`);
          assert.equal(await page.title(),article?.title || data.ui.title,`${route}: wrong localized title`);
          assert.equal(await page.locator('html').getAttribute('dir'),data.ui.dir,`${route}: wrong text direction`);
          const expectedLanguage = data.locale === 'zh' ? 'zh-Hans' : data.locale;
          assert.equal(await page.locator('html').getAttribute('lang'),expectedLanguage,`${route}: wrong language`);
          const languageLinks = await page.locator('.language-nav a').evaluateAll(links => links.map(a => a.getAttribute('href')));
          assert.deepEqual(languageLinks,locales.map(lang => urlFor(lang,id)),`${route}: language switch changes topic`);
          assert.equal(await page.locator('.language-nav [aria-current="page"]').getAttribute('href'),route,`${route}: wrong current language`);
          assert.equal(await page.evaluate(() => window.testRequests.length),0,`${route}: media permission requested on load`);
          if (article) {
            assert.equal(await page.locator('.article-section').count(),article.sections.length,`${route}: missing article sections`);
            assert.deepEqual(await page.locator('.article-section h2').allTextContents(),article.sections.map(section => section.heading),`${route}: wrong localized sections`);
            assert.deepEqual(await page.locator('.article-section p').allTextContents(),article.sections.flatMap(section => section.paragraphs || []),`${route}: wrong localized paragraphs`);
            assert.deepEqual(await page.locator('.article-section li').allTextContents(),article.sections.flatMap(section => section.steps || []),`${route}: wrong localized steps`);
          } else {
            assert.equal(await page.locator('.help-cards > li').count(),TOPICS.length,`${route}: missing topic cards`);
          }
        }
      }
    }
    await page.setViewportSize({width:780,height:900});
    await page.goto(base + urlFor('de','camera-permissions'));
    const normalTextSize = await page.locator('.article-section p').first().evaluate(p => parseFloat(getComputedStyle(p).fontSize));
    await page.evaluate(() => {document.documentElement.style.fontSize='200%';});
    const enlargedTextSize = await page.locator('.article-section p').first().evaluate(p => parseFloat(getComputedStyle(p).fontSize));
    assert.equal(enlargedTextSize,normalTextSize*2,'Body text did not grow to 200%');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth+1),'Text zoom overflow');

    await page.goto(base + urlFor('en','webcam-test'));
    const ui = JSON.parse(await page.locator('[data-messages]').textContent());
    assert.equal(await page.evaluate(() => window.testRequests.length),0,'Camera requested on load');
    assert.ok(await page.locator('[data-mirror]').isChecked(),'Mirror preview should be enabled initially');
    await page.locator('[data-mirror]').uncheck();
    assert.equal(await page.evaluate(() => window.testRequests.length),0,'Changing mirror option requested camera access');
    await page.locator('[data-start]').click();
    await page.waitForFunction(active => document.querySelector('[data-status]').textContent === active,ui.active);
    assert.deepEqual(await page.evaluate(() => window.testRequests[0]),{video:true,audio:false});
    assert.ok(await page.locator('video').evaluate(v => v.videoWidth > 0),'No preview');
    const deviceInfo = await page.locator('video').evaluate(video => {
      const track = video.srcObject.getVideoTracks()[0];
      const settings = track.getSettings();
      return {id:track.id,settings,formattedFrameRate:Number.isFinite(settings.frameRate) ? new Intl.NumberFormat(document.documentElement.lang,{maximumFractionDigits:2}).format(settings.frameRate) : null};
    });
    if (deviceInfo.formattedFrameRate !== null) {
      assert.ok((await page.locator('[data-settings]').textContent()).includes(`${ui.configuredFrameRate}: ${deviceInfo.formattedFrameRate}`),'Configured frame rate is missing or not localized');
    }
    if (deviceInfo.settings.width && deviceInfo.settings.height) {
      assert.ok((await page.locator('[data-settings]').textContent()).includes(`${deviceInfo.settings.width} × ${deviceInfo.settings.height}`),'Configured video dimensions are missing');
    }
    assert.equal(await page.locator('video').evaluate(v => getComputedStyle(v).transform),'none','Unchecked mirror still flips the video');
    await page.locator('[data-mirror]').check();
    assert.equal(await page.locator('video').evaluate(v => getComputedStyle(v).transform),'matrix(-1, 0, 0, 1, 0, 0)','Checked mirror did not flip the preview');
    await page.locator('[data-mirror]').uncheck();
    assert.equal(await page.locator('video').evaluate(v => getComputedStyle(v).transform),'none','Mirror toggle did not restore the preview');
    assert.equal(await page.evaluate(() => window.testRequests.length),1,'Mirror toggle requested another stream');
    assert.equal(await page.locator('video').evaluate(v => v.srcObject.getVideoTracks()[0].id),deviceInfo.id,'Mirror toggle replaced the active camera track');
    assert.ok(await page.evaluate(() => window.testStreams.every(s => s.getTracks().every(t => t.readyState === 'live'))),'Mirror toggle stopped the active camera');
    await page.locator('[data-stop]').click();
    assert.ok(await page.evaluate(() => window.testStreams.every(s => s.getTracks().every(t => t.readyState === 'ended'))),'Stop left camera active');
    await page.locator('[data-start]').click();
    await page.waitForFunction(active => document.querySelector('[data-status]').textContent === active,ui.active);
    await page.evaluate(() => {Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
    assert.ok(await page.evaluate(() => window.testStreams.every(s => s.getTracks().every(t => t.readyState === 'ended'))),'Background tab left camera active');

    await page.goto(base + urlFor('en','microphone-test'));
    await page.locator('[data-start]').click();
    await page.waitForFunction(active => document.querySelector('[data-status]').textContent === active,ui.active);
    assert.deepEqual(await page.evaluate(() => window.testRequests[0]),{audio:true,video:false});
    assert.ok(await page.locator('[data-meter]').isVisible());
    await page.locator('[data-stop]').click();
    assert.ok(await page.evaluate(() => window.testStreams.every(s => s.getTracks().every(t => t.readyState === 'ended'))),'Stop left microphone active');

    await page.goto(base + urlFor('en','webcam-test'));
    await page.evaluate(() => {navigator.mediaDevices.getUserMedia = async () => {throw Object.assign(new Error('denied'),{name:'NotAllowedError'});};});
    await page.locator('[data-start]').click();
    await page.waitForFunction(denied => document.querySelector('[data-status]').textContent === denied,ui.denied);
    assert.ok(await page.locator('[data-start]').isEnabled());

    await page.goto(base + urlFor('en','webcam-test'));
    await page.evaluate(() => {
      window.pendingTrack = {readyState:'live',stop(){this.readyState='ended';}};
      navigator.mediaDevices.getUserMedia = () => new Promise(resolve => {window.grantLater=()=>resolve({getTracks:()=>[window.pendingTrack]});});
    });
    await page.locator('[data-start]').click();
    await page.locator('[data-stop]').click();
    await page.evaluate(() => window.grantLater());
    assert.equal(await page.evaluate(() => window.pendingTrack.readyState),'ended','Late permission grant leaked a stream');
    assert.equal(await page.locator('[data-status]').textContent(),ui.stopped);

    const noJs = await browser.newContext({javaScriptEnabled:false});
    const plain = await noJs.newPage();
    await plain.goto(base + urlFor('ar','camera-permissions'));
    assert.equal(await plain.locator('h1').count(),1);
    assert.ok((await plain.locator('.article-section').count()) >= 3);
    await noJs.close();

    if (process.env.HELP_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.HELP_SCREENSHOT_DIR,{recursive:true});
      await page.setViewportSize({width:1440,height:1050});
      await page.goto(base+urlFor('en'));
      await page.screenshot({path:path.join(process.env.HELP_SCREENSHOT_DIR,'help-en-desktop.png')});
      await page.setViewportSize({width:390,height:844});
      await page.goto(base+urlFor('ar','webcam-test'));
      await page.locator('img').evaluateAll(async images => {
        for (const image of images) image.loading = 'eager';
        await Promise.all(images.map(image => image.decode()));
      });
      await page.screenshot({path:path.join(process.env.HELP_SCREENSHOT_DIR,'help-ar-mobile.png'),fullPage:true});
    }
    assert.deepEqual(failures,[]);
    console.log(`PASS: ${locales.length} locales × ${TOPICS.length} articles and hubs × ${viewports.length} viewport widths; complete localized content, topic-preserving language links, decoded images, RTL, 200% text size, no-JS content, synthetic camera/microphone, stop/background/denial/pending cancellation; no console, asset or external-request errors.`);
  } finally {
    await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error => {console.error(error);server.close();process.exitCode=1;});
