// Render localized social cards from HTML. Existing image originals are untouched.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {SITE} from './config.mjs';
import {SITE_LANGUAGES,SITE_LOCALES} from './site-ui.mjs';
import {escapeHtml as esc} from './help.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out = path.join(root,'img/social');
fs.mkdirSync(out,{recursive:true});
const logo = fs.readFileSync(path.join(root,'favicon.svg'),'utf8');
const browser = await chromium.launch({channel:process.env.HELP_BROWSER_CHANNEL || (process.platform==='win32'?'msedge':undefined),headless:true});
try {
  const page = await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  for (const locale of SITE_LANGUAGES.filter(code=>code!=='ru')) {
    const data = SITE_LOCALES[locale];
    for (const section of ['watch','model','partner']) {
      const heading = section==='watch'?data.ui.liveStreams:section==='model'?data.ui.modelTitle:data.ui.partnerTitle;
      const subtitle = section==='watch'?data.ui.onlyAdults:section==='model'?data.ui.modelText:data.ui.partnerText;
      await page.setContent(`<!doctype html><html lang="${data.languageTag}" dir="${data.dir}"><meta charset="utf-8"><style>
* {box-sizing:border-box} body {margin:0;width:1200px;height:630px;background:#0f0f14;color:#ececf1;font:32px/1.4 system-ui,"Segoe UI","Microsoft YaHei",sans-serif;padding:64px 72px;overflow:hidden}
header {display:flex;align-items:center;gap:24px} header svg {width:84px;height:84px;flex:none} .brand {font-size:52px;font-weight:750} .age {margin-inline-start:auto;color:#ff3d6e;border:3px solid #ff3d6e;border-radius:12px;padding:6px 15px;font-size:34px;font-weight:700}
html[dir=rtl] .age {margin-left:0;margin-right:auto}
main {border-inline-start:6px solid #ff3d6e;padding-inline-start:26px;margin-top:70px} h1 {font-size:55px;line-height:1.15;margin:0 0 22px;max-width:1010px;overflow-wrap:anywhere} p {margin:0;color:#a3a3b5;font-size:29px;max-width:970px}.locale {margin-top:32px;font-size:24px;color:#ff3d6e}
</style><header>${logo}<span class="brand" dir="ltr">${esc(SITE.name)}</span><span class="age" dir="ltr">18+</span></header><main><h1>${esc(heading)}</h1><p>${esc(subtitle)}</p></main><div class="locale">${esc(data.name)}</div></html>`);
      await page.evaluate(()=>document.fonts.ready);
      const clipped = await page.evaluate(()=>document.querySelector('.locale').getBoundingClientRect().bottom>610 || document.documentElement.scrollWidth>1200);
      if (clipped) throw new Error(`Localized social card clipped: ${locale}/${section}`);
      await page.screenshot({path:path.join(out,`${locale}-${section}.png`)});
    }
  }
  console.log('Rendered 21 localized social cards at 1200 × 630.');
} finally {await browser.close();}
