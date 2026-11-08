// Development-only bridge to Chrome's on-device Translator API.
// Source text is processed locally; Chrome may download language models.
const {chromium} = require('playwright');
const http = require('node:http');
const path = require('node:path');

const port = 4186;
const origin = `http://127.0.0.1:${port}`;
const languages = new Set(['en','es','pt','de','zh','hi','ar']);
const profile = path.resolve(__dirname,'qa-output/translator-browser');
const bodyLimit = 100 * 1024;
let context, page, ready = false, queue = Promise.resolve();
let waiting = 0, completed = 0, failed = 0, activeLanguage = null, activeStage = null;
const preparedLanguages = new Set();
const progress = new Map();

function json(res,status,value) {
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(value));
}

async function prepare(language) {
  const cached = await page.evaluate(lang => window.localTranslators.has(lang),language);
  if (cached) return;
  await page.evaluate(lang => {window.requestedLanguage=lang;window.createResult=null;},language);
  await page.locator('#prepare').click();
  await page.waitForFunction(() => window.createResult !== null,null,{timeout:185000});
  const result = await page.evaluate(() => window.createResult);
  if (!result.ok) {
    const error = new Error(result.code);
    error.code = result.code;
    throw error;
  }
  preparedLanguages.add(language);
  console.log(`MODEL_READY ${language}`);
}

async function translate(language,text) {
  activeLanguage = language;
  try {
    activeStage = 'prepare';
    await prepare(language);
    activeStage = 'translate';
    const run = () => page.evaluate(async ({language,text}) => {
      try {
        return {ok:true,translation:await window.localTranslators.get(language).translate(text)};
      } catch (error) {
        const names=['AbortError','InvalidStateError','NotReadableError','NotSupportedError','QuotaExceededError','UnknownError','OperationError','TypeError','SyntaxError','Error'];
        return {ok:false,code:names.includes(error.name)?error.name:'TRANSLATOR_ERROR'};
      }
    },{language,text});
    let outcome = await run();
    if (!outcome.ok) {
      // A newly downloaded component can invalidate existing Translator handles.
      // Recreate only the failed pair and retry once; never loop indefinitely.
      console.log(`MODEL_RECOVERY ${language} ${outcome.code}`);
      await page.evaluate(lang => {
        try {window.localTranslators.get(lang)?.destroy();} catch {}
        window.localTranslators.delete(lang);
      },language);
      activeStage = 'recover';
      await prepare(language);
      activeStage = 'translate';
      outcome = await run();
    }
    if (!outcome.ok) {const error=new Error(outcome.code);error.code=outcome.code;throw error;}
    const result=outcome.translation;
    if (typeof result !== 'string' || !result.trim()) {const error=new Error('EMPTY_TRANSLATION');error.code='EMPTY_TRANSLATION';throw error;}
    completed += 1;
    if (completed % 25 === 0) console.log(`LOCAL_TRANSLATIONS ${completed}`);
    return result;
  } finally {
    activeLanguage = null;
    activeStage = null;
  }
}

const server = http.createServer(async (req,res) => {
  if (req.headers.host !== `127.0.0.1:${port}` || (req.headers.origin && req.headers.origin !== origin)) {
    json(res,403,{error:'LOCAL_ORIGIN_REQUIRED'});return;
  }
  const route = new URL(req.url,origin).pathname;
  if (req.method === 'GET' && route === '/health') {
    json(res,200,{ready,provider:'Chrome on-device Translator',preparedLanguages:[...preparedLanguages],activeLanguage,activeStage,waiting,completed,failed});return;
  }
  if (req.method === 'GET' && route === '/bridge') {
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end('<!doctype html><html lang="en"><meta charset="utf-8"><title>Local translation bridge</title><button id="prepare">Prepare local translator</button></html>');return;
  }
  if (req.method !== 'POST' || route !== '/translate') {json(res,404,{error:'NOT_FOUND'});return;}
  if (!ready) {json(res,503,{error:'LOCAL_TRANSLATOR_STARTING'});return;}
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {json(res,415,{error:'JSON_REQUIRED'});return;}
  if (waiting >= 32) {json(res,429,{error:'LOCAL_QUEUE_FULL'});return;}
  let bytes = 0, chunks = [], tooLarge = false;
  try {
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > bodyLimit) {tooLarge=true;break;}
      chunks.push(chunk);
    }
  } catch {json(res,400,{error:'BODY_READ_FAILED'});return;}
  if (tooLarge) {json(res,413,{error:'BODY_TOO_LARGE'});return;}
  let input;
  try {input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  catch {json(res,400,{error:'INVALID_JSON'});return;}
  if (!input || typeof input !== 'object' || Array.isArray(input) || !languages.has(input.language) || typeof input.text !== 'string' || !input.text.trim()) {
    json(res,400,{error:'INVALID_LANGUAGE_OR_TEXT'});return;
  }
  waiting += 1;
  const job = queue.then(() => translate(input.language,input.text));
  queue = job.catch(() => {});
  try {
    const translation = await job;
    json(res,200,{translation});
  } catch (error) {
    failed += 1;
    // Never log the submitted text, translated text or arbitrary error messages.
    console.error(`LOCAL_TRANSLATION_FAILED ${input.language} ${error.code || error.name || 'Error'}`);
    json(res,500,{error:error.code || 'LOCAL_TRANSLATION_FAILED'});
  } finally {waiting -= 1;}
});

async function boot() {
  await new Promise((resolve,reject) => {server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  context = await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,ignoreDefaultArgs:['--disable-component-update','--disable-background-networking']});
  page = await context.newPage();
  await page.exposeFunction('reportModelProgress',(language,loaded) => {
    const percent = Math.min(100,Math.max(0,Math.floor(loaded*10)*10));
    if (progress.get(language) !== percent) {progress.set(language,percent);console.log(`MODEL_DOWNLOAD ${language} ${percent}%`);}
  });
  await page.goto(origin + '/bridge');
  const supported = await page.evaluate(() => typeof Translator !== 'undefined');
  if (!supported) throw new Error('Translator API is unavailable in this Chrome installation');
  await page.evaluate(() => {
    window.localTranslators = new Map();
    window.requestedLanguage = null;
    window.createResult = null;
    document.querySelector('#prepare').addEventListener('click',async () => {
      const language = window.requestedLanguage;
      const controller = new AbortController();
      const expiry = setTimeout(() => controller.abort(),180000);
      try {
        // Retain all seven authorized language pairs; requests remain serialized.
        // Downloaded model packs remain cached on disk.
        if (window.localTranslators.size >= 7) {
          const oldest = window.localTranslators.keys().next().value;
          window.localTranslators.get(oldest).destroy();
          window.localTranslators.delete(oldest);
        }
        const translator = await Translator.create({sourceLanguage:'ru',targetLanguage:language,signal:controller.signal,monitor(monitor){monitor.addEventListener('downloadprogress',event => window.reportModelProgress(language,event.loaded));}});
        if (controller.signal.aborted) {translator.destroy();throw new DOMException('Model creation timed out','AbortError');}
        window.localTranslators.set(language,translator);
        window.createResult = {ok:true};
      } catch (error) {window.createResult={ok:false,code:error.name || 'MODEL_CREATION_FAILED'};}
      finally {clearTimeout(expiry);}
    });
  });
  ready=true;
  console.log(`LOCAL_TRANSLATION_BRIDGE_READY ${origin}`);
}

let closing = false;
async function close() {
  if (closing) return;
  closing=true;ready=false;
  try {await context?.close();} catch {}
  server.close(() => process.exit(0));
}
process.on('SIGINT',close);
process.on('SIGTERM',close);
boot().catch(async error => {console.error('LOCAL_TRANSLATION_START_FAILED '+(error.code || error.name));try{await context?.close();}catch{}server.close();process.exitCode=1;});
