import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {SITE_LANGUAGES, localizePath} from './site-ui.mjs';

export const TRANSLATED_FIELDS = ['title','description','h1','nav','card','listTitle','ctaTitle','ctaText','streamTitle'];

export function sourceDigest(root, basePages) {
  const hash = crypto.createHash('sha256');
  for (const page of [...basePages].sort((a,b) => a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0)) {
    const raw = fs.readFileSync(path.join(root,'_src/pages',page.rel),'utf8').replace(/\r\n/g,'\n');
    hash.update(page.rel + '\0' + raw + '\0');
  }
  return hash.digest('hex');
}

const tags = html => JSON.stringify(html.replace(/\r\n/g,'\n').match(/<[^>]*>/g) || []);
const ctaCount = html => (html.match(/\{\{cta\}\}/g) || []).length;

export function localizedPages(root, basePages, images, languages = SITE_LANGUAGES) {
  const digest = sourceDigest(root,basePages);
  const imagesDigest = crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'_src/images.json'),'utf8').replace(/\r\n/g,'\n')).digest('hex');
  const pages = basePages.map(p => ({...p, locale:'ru', basePath:p.urlPath, imageAlt:images[p.urlPath]?.alt}));
  const baseKeys = basePages.map(p => p.urlPath).sort();
  for (const locale of languages.filter(code => code !== 'ru')) {
    const file = path.join(root,'_src/site-locales',locale+'.json');
    const data = JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
    if (data.locale !== locale || data.sourceDigest !== digest) throw new Error(`${locale}: translation missing or out of date; regenerate from current Russian sources`);
    if (data.sourceImagesDigest !== imagesDigest) throw new Error(`${locale}: image descriptions changed; refresh translated image alt text`);
    if (JSON.stringify(Object.keys(data.pages || {}).sort()) !== JSON.stringify(baseKeys)) throw new Error(`${locale}: expected all ${basePages.length} original routes`);
    for (const source of basePages) {
      const translated = data.pages[source.urlPath];
      const meta = {...source.meta};
      for (const field of TRANSLATED_FIELDS) {
        if (typeof source.meta[field] !== 'string') continue;
        if (typeof translated.meta?.[field] !== 'string' || !translated.meta[field].trim()) throw new Error(`${locale}${source.urlPath}: untranslated ${field}`);
        meta[field] = translated.meta[field];
      }
      if (!Array.isArray(translated.meta?.faq) || translated.meta.faq.length !== source.meta.faq.length) throw new Error(`${locale}${source.urlPath}: incomplete FAQ`);
      meta.faq = translated.meta.faq;
      if (meta.faq.some(f => typeof f.q !== 'string' || !f.q.trim() || typeof f.a !== 'string' || !f.a.trim())) throw new Error(`${locale}${source.urlPath}: invalid FAQ`);
      if (typeof translated.body !== 'string' || !translated.body.trim()) throw new Error(`${locale}${source.urlPath}: missing body`);
      if (tags(translated.body) !== tags(source.body) || ctaCount(translated.body) !== ctaCount(source.body)) throw new Error(`${locale}${source.urlPath}: translation changed markup or placeholders`);
      if (images[source.urlPath] && !translated.imageAlt?.trim()) throw new Error(`${locale}${source.urlPath}: untranslated image alt`);
      pages.push({...source, locale, basePath:source.urlPath, urlPath:localizePath(locale,source.urlPath), meta, body:translated.body, imageAlt:translated.imageAlt, modified:data.reviewed || '2026-11-08'});
    }
  }
  return pages;
}

export function localizedBody(body, locale, knownPaths) {
  return body.replace(/href="(\/[^\"]*)"/g,(match,href) => {
    const base = href.split(/[?#]/)[0];
    if (!knownPaths.has(base)) return match;
    return `href="${localizePath(locale,href)}"`;
  });
}
