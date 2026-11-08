// Сборка сайта из _src/pages в корень репозитория. Без зависимостей: node _build/build.mjs
//
// Формат страницы: в начале файла комментарий с JSON-метаданными, дальше HTML тела.
//   _src/pages/index.html           -> /
//   _src/pages/gid/index.html       -> /gid/          (хаб: к телу добавляется список дочерних страниц)
//   _src/pages/gid/tokeny.html      -> /gid/tokeny/

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { SITE, SECTIONS, IFRAME_TAGS, iframeSrc } from './config.mjs';
import { prepareHelpSite, writeHelpSite, helpSitemapEntries, readHelpLocales } from './help.mjs';
import {SITE_LANGUAGES as ALL_SITE_LANGUAGES, SITE_LOCALES, localizePath} from './site-ui.mjs';
import {localizedPages, localizedBody} from './site-locales.mjs';
import {writeLocalizedStatic} from './site-static.mjs';
import {renderLanguageSwitcher, LANGUAGE_SWITCHER_JS} from './language-switcher.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, '_src', 'pages');
const PREVIEW_READY = process.argv.includes('--preview-ready');
const SITE_LANGUAGES = PREVIEW_READY
  ? ALL_SITE_LANGUAGES.filter(locale => locale === 'ru' || fs.existsSync(path.join(ROOT,'_src/site-locales',locale+'.json')))
  : ALL_SITE_LANGUAGES;
const TODAY = new Date().toISOString().slice(0, 10);
const RELATED_COUNT = 6;

// Dates describe content changes, not the day a static build happens to run.
function contentDate(file, meta) {
  const explicit = meta.modified;
  if (explicit && /^\d{4}-\d{2}-\d{2}$/.test(explicit)) return explicit;
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', path.relative(ROOT, file)], {cwd: ROOT, encoding: 'utf8', windowsHide: true}).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  } catch { /* Archives may not include Git history. */ }
  return /^\d{4}-\d{2}-\d{2}$/.test(meta.published || '') ? meta.published : null;
}

const errors = [];
const warnings = [];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const words = (s) => stripTags(s).split(' ').filter(Boolean).length;

// ---------- чтение страниц ----------

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []);
}

function parsePage(file) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^\s*<!--([\s\S]*?)-->\s*([\s\S]*)$/);
  if (!m) { errors.push(`${rel}: нет блока метаданных <!-- {...} -->`); return null; }
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e) { errors.push(`${rel}: ошибка JSON в метаданных: ${e.message}`); return null; }

  const parts = rel.replace(/\.html$/, '').split('/');
  const isHub = parts.at(-1) === 'index';
  if (isHub) parts.pop();
  const urlPath = parts.length ? `/${parts.join('/')}/` : '/';
  const dir = parts.slice(0, -1).join('/');
  const section = ['model', 'partner'].includes(parts[0]) ? parts[0] : 'watch';

  for (const k of ['title', 'description', 'h1', 'nav']) if (!meta[k]) errors.push(`${rel}: нет поля "${k}"`);
  if (meta.tag && !IFRAME_TAGS.includes(meta.tag)) errors.push(`${rel}: tag "${meta.tag}" не поддерживается, допустимы ${IFRAME_TAGS.join(', ')}`);
  if (section !== 'watch' && meta.iframe && meta.iframe !== 'none') errors.push(`${rel}: в разделе ${section} iframe не используется`);

  return {
    rel, urlPath, isHub, section, modified: contentDate(file, meta),
    dir: isHub ? parts.join('/') : dir,       // каталог, к которому относится страница (для хаба — свой)
    parentDir: dir,                           // каталог-родитель
    meta: { iframe: section === 'watch' ? 'top' : 'none', tag: 'girls', faq: [], type: 'WebPage', ...meta },
    body: m[2].trim(),
  };
}

const basePages = walk(SRC).map(parsePage).filter(Boolean).sort((a, b) => a.urlPath.localeCompare(b.urlPath));
const IMAGES_FILE = path.join(ROOT, '_src', 'images.json');
const IMAGES = fs.existsSync(IMAGES_FILE) ? JSON.parse(fs.readFileSync(IMAGES_FILE, 'utf8')) : {};
const pages = localizedPages(ROOT,basePages,IMAGES,SITE_LANGUAGES);
const byUrl = new Map(pages.map((p) => [p.urlPath, p]));
const help = prepareHelpSite(ROOT, SITE.origin, SITE_LANGUAGES);
const helpUrls = new Set(help.pages.map(p => p.urlPath));
const basePaths = new Set([...basePages.map(p=>p.urlPath),...help.pages.filter(p=>p.locale==='ru').map(p=>p.urlPath)]);
const helpContent = new Map(readHelpLocales(ROOT).map(data=>[data.locale,data]));
const loc = p => SITE_LOCALES[p.locale];
const route = (p,url) => localizePath(p.locale,url);
const alternates = p => [...SITE_LANGUAGES.map(locale=>({lang:SITE_LOCALES[locale].languageTag,url:SITE.origin+localizePath(locale,p.basePath)})),{lang:'x-default',url:SITE.origin+localizePath('en',p.basePath)}];

// ---------- проверки содержимого ----------

const seen = { title: new Map(), description: new Map(), h1: new Map() };
for (const p of pages) {
  for (const k of Object.keys(seen)) {
    const v = p.locale + ':' + p.meta[k];
    if (seen[k].has(v)) errors.push(`${p.rel}: ${k} совпадает с ${seen[k].get(v)}`);
    else seen[k].set(v, p.rel);
  }
  if (p.locale === 'ru' && p.meta.title.length > 70) warnings.push(`${p.rel}: title длиннее 70 символов (${p.meta.title.length})`);
  const dl = p.meta.description.length;
  if (p.locale === 'ru' && (dl < 70 || dl > 170)) warnings.push(`${p.rel}: description ${dl} символов, лучше 70–170`);

  const hrefs = [...p.body.matchAll(/href="([^"]+)"/g)].map((x) => x[1]);
  for (const h of hrefs) {
    if (/^https?:/.test(h)) errors.push(`${p.rel}: внешняя ссылка в тексте (${h}), используйте {{cta}}`);
    else if (h.startsWith('/')) {
      const target = route(p,h.split('#')[0]);
      if (helpUrls.has(target)) continue;
      if (!byUrl.has(target)) errors.push(`${p.rel}: ссылка на несуществующую страницу ${h}`);
      else checkCrossLink(p, byUrl.get(target).section, h);
    }
  }
  const low = p.body.toLowerCase();
  if (p.section === 'model' && low.includes('stripcash')) errors.push(`${p.rel}: раздел моделей упоминает Stripcash`);
  if (p.section === 'partner' && /стать моделью|работа моделью|работать моделью/.test(low)) errors.push(`${p.rel}: раздел партнёров зовёт в модели`);
}

function checkCrossLink(p, targetSection, h) {
  const cross = (p.section === 'model' && targetSection === 'partner') || (p.section === 'partner' && targetSection === 'model');
  if (cross) errors.push(`${p.rel}: ссылка ${h} смешивает разделы моделей и партнёров`);
}

// ---------- сборка HTML ----------

const css = fs.readFileSync(path.join(ROOT, '_build', 'site.css'), 'utf8');
const cssVersion = crypto.createHash('md5').update(css).digest('hex').slice(0, 8);

const abs = (u) => SITE.origin + u;

// Иллюстрации страниц: адрес страницы -> { src, og, w, h, alt }. Файл пишет _build/images.py
for (const u of Object.keys(IMAGES)) if (!byUrl.has(u)) errors.push(`_src/images.json: нет страницы ${u}`);

function ogImage(p) {
  const img = IMAGES[p.basePath];
  const fallback = p.locale === 'ru' ? SECTIONS[p.section].ogImage : `/img/social/${p.locale}-${p.section}.png`;
  return img ? { url: abs(img.og), type: 'image/jpeg' } : { url: abs(fallback), type: 'image/png' };
}

function figure(p, lazy) {
  const img = IMAGES[p.basePath];
  if (!img) return '';
  const load = lazy ? 'loading="lazy"' : 'fetchpriority="high"';
  return `<figure class="hero-img"><img src="${img.src}" width="${img.w}" height="${img.h}" alt="${esc(p.imageAlt)}" ${load} decoding="async"></figure>`;
}
const extAttrs = 'target="_blank" rel="sponsored noopener"';

function ctaButton(p, extraClass = '') {
  const c = SECTIONS[p.section].cta;
  return `<a class="btn ${extraClass}" href="${esc(route(p,c.href))}"${c.external ? ' ' + extAttrs : ''}>${esc(loc(p).sections[p.section].ctaText)}</a>`;
}

function breadcrumbs(p) {
  const crumbs = [[route(p,'/'), loc(p).ui.home]];
  const parts = p.basePath.split('/').filter(Boolean);
  let acc = '/';
  parts.forEach((part, i) => {
    acc += part + '/';
    const pg = byUrl.get(route(p,acc));
    const label = i === parts.length - 1 ? p.meta.nav : (pg?.meta.nav || loc(p).dirLabels[part] || part);
    crumbs.push([route(p,acc), label]);
  });
  return crumbs;
}

function childrenOf(dir, locale) {
  return pages.filter((c) => c.locale === locale && !c.isHub && c.parentDir === dir);
}

function cardGrid(list) {
  return `<ul class="cards">${list.map((c) =>
    `<li><a href="${c.urlPath}"><strong>${esc(c.meta.nav)}</strong><span>${esc(c.meta.card || c.meta.description)}</span></a></li>`).join('')}</ul>`;
}

// Соседние страницы того же каталога: берём следующие по кругу, так ссылки распределяются равномерно
function related(p) {
  const sib = pages.filter((c) => c.locale === p.locale && c.parentDir === p.parentDir && !c.isHub);
  const i = sib.indexOf(p);
  if (i < 0 || sib.length < 2) return [];
  const out = [];
  for (let k = 1; k < sib.length && out.length < RELATED_COUNT; k++) out.push(sib[(i + k) % sib.length]);
  return out;
}

function streamBlock(p, heading) {
  return `<section class="stream${heading ? ' stream--inline' : ''}" id="stream" aria-label="${esc(loc(p).ui.liveStreams)}">
    ${heading ? `<h2>${esc(heading)}</h2>` : ''}
    <iframe title="${esc(p.meta.nav)}: ${esc(loc(p).ui.liveStreams)}" src="${esc(iframeSrc(p.meta.tag))}"${heading ? ' loading="lazy"' : ''} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>
  </section>`;
}

function promoBlock(p) {
  const ui = loc(p).ui;
  return `<section class="promo" aria-label="${esc(ui.promoLabel)}">
    <a class="promo-card" href="${route(p,'/model/')}"><strong>${esc(ui.modelTitle)}</strong><span>${esc(ui.modelText)}</span></a>
    <a class="promo-card" href="${route(p,'/partner/')}"><strong>${esc(ui.partnerTitle)}</strong><span>${esc(ui.partnerText)}</span></a>
  </section>`;
}

function faqBlock(faq, p) {
  if (!faq.length) return '';
  return `<section class="faq" aria-labelledby="faq">
      <h2 id="faq">${esc(loc(p).ui.faq)}</h2>
      ${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n      ')}
    </section>`;
}

function jsonLd(p, crumbs) {
  const url = abs(p.urlPath);
  const sec = SECTIONS[p.section];
  const graph = [
    { '@type': 'WebSite', '@id': `${abs(route(p,'/'))}#website`, url: abs(route(p,'/')), name: SITE.name, alternateName: ['Stripchat'], inLanguage: loc(p).languageTag },
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`, url, name: p.meta.title, description: p.meta.description,
      isPartOf: { '@id': `${abs(route(p,'/'))}#website` }, inLanguage: loc(p).languageTag, isFamilyFriendly: !sec.adult,
      ...(p.modified ? {dateModified: p.modified} : {}),
      primaryImageOfPage: { '@type': 'ImageObject', url: ogImage(p).url, width: 1200, height: 630 },
      ...(crumbs.length > 1 ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    },
  ];
  if (p.meta.type === 'Article') {
    graph.push({
      '@type': 'Article', '@id': `${url}#article`, headline: p.meta.h1, description: p.meta.description,
      mainEntityOfPage: { '@id': `${url}#webpage` }, inLanguage: loc(p).languageTag,
      ...(p.modified ? {dateModified: p.modified} : {}),
      ...(p.meta.published ? {datePublished: p.meta.published} : {}), image: ogImage(p).url,
      author: { '@type': 'Organization', name: SITE.name, url: abs(route(p,'/')) },
      publisher: { '@type': 'Organization', name: SITE.name, url: abs(route(p,'/')) },
    });
  }
  if (crumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: crumbs.map(([u, n], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: abs(u) })),
    });
  }
  if (p.meta.faq.length) {
    graph.push({
      '@type': 'FAQPage', '@id': `${url}#faq`,
      mainEntity: p.meta.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 1).replace(/</g, '\\u003c');
}

function render(p) {
  const sec = SECTIONS[p.section];
  const language = loc(p);
  const ui = language.ui;
  const sectionUi = language.sections[p.section];
  const crumbs = breadcrumbs(p);
  const url = abs(p.urlPath);
  const og = ogImage(p);
  const isHome = p.basePath === '/';

  let body = localizedBody(p.body,p.locale,basePaths).replaceAll('{{cta}}', `<p class="cta-row">${ctaButton(p)}</p>`);
  if (p.isHub) {
    const kids = childrenOf(p.dir,p.locale);
    if (kids.length) body += `\n<section aria-labelledby="list"><h2 id="list">${esc(p.meta.listTitle || ui.allPages)}</h2>${cardGrid(kids)}</section>`;
  }
  if (isHome) {
    body += `\n<section aria-labelledby="cats"><h2 id="cats">${esc(ui.categoriesHeading)}</h2>${cardGrid(childrenOf('kategorii',p.locale))}<p><a href="${route(p,'/kategorii/')}">${esc(ui.allCategories)}</a></p></section>`;
    body += `\n<section aria-labelledby="guides"><h2 id="guides">${esc(ui.guidesHeading)}</h2>${cardGrid(childrenOf('gid',p.locale))}</section>`;
    const guideData = helpContent.get(p.locale);
    const tools = ['webcam-test','microphone-test','webcam-for-pc','obs-webcam-setup'].map(id => guideData.articles.find(a=>a.id===id));
    body += `\n<section aria-labelledby="technical-help"><h2 id="technical-help">${esc(ui.helpNav)}</h2><p>${esc(guideData.ui.intro)}</p><ul class="cards">${tools.map(a=>`<li><a href="${route(p,'/help/'+a.id+'/')}"><strong>${esc(a.heading)}</strong><span>${esc(a.description)}</span></a></li>`).join('')}</ul><p><a href="${route(p,'/help/')}">${esc(guideData.ui.guides)}</a></p></section>`;
  }

  const rel = related(p);
  const relatedHtml = rel.length ? `<section aria-labelledby="related"><h2 id="related">${esc(p.section === 'watch' ? ui.relatedWatch : ui.relatedRead)}</h2>${cardGrid(rel)}</section>` : '';

  const navHtml = sec.nav.map(([u],i) => `<a href="${route(p,u)}"${u === p.basePath ? ' aria-current="page"' : ''}>${esc(sectionUi.nav[i])}</a>`).join('');
  const headerCta = p.section === 'watch' ? `<span class="badge-18" dir="ltr" title="${esc(ui.onlyAdults)}">18+</span>` : ctaButton(p, 'btn--small');

  const crumbsHtml = crumbs.length > 1
    ? `<nav class="crumbs" aria-label="${esc(ui.breadcrumbs)}">${crumbs.map(([u, n], i) => i === crumbs.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${u}">${esc(n)}</a>`).join('<span class="sep" aria-hidden="true">›</span>')}</nav>`
    : '';

  const top = p.meta.iframe === 'top';
  const streamHtml = p.meta.iframe === 'none' ? '' : streamBlock(p, top ? '' : (p.meta.streamTitle || ui.watchStreams));
  const ctaFinal = p.section === 'watch' ? '' : `<section class="cta-final"><h2>${esc(p.meta.ctaTitle || (p.section === 'model' ? ui.ctaModelTitle : ui.ctaPartnerTitle))}</h2><p>${esc(p.meta.ctaText || (p.section === 'model' ? ui.ctaModelText : ui.ctaPartnerText))}</p>${ctaButton(p)}</section>`;

  return `<!DOCTYPE html>
<html lang="${language.languageTag}" dir="${language.dir}" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(p.meta.title)}</title>
  <meta name="description" content="${esc(p.meta.description)}">
  <link rel="canonical" href="${url}">
  ${alternates(p).map(a=>`<link rel="alternate" hreflang="${a.lang}" href="${a.url}">`).join('\n  ')}
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
${sec.adult ? `  <!-- Метка контента для взрослых (рекомендация Google для SafeSearch) и стандартная метка RTA -->
  <meta name="rating" content="adult">
  <meta name="RATING" content="RTA-5042-1996-1400-1577-RTA">
` : ''}  <meta name="format-detection" content="telephone=no">
  <meta name="theme-color" content="${SITE.themeColor}">
  <meta name="color-scheme" content="dark">
  <!-- Подтверждение прав в панелях вебмастеров: раскомментируйте и вставьте свои коды -->
  <!-- <meta name="google-site-verification" content="ВАШ_КОД_GOOGLE"> -->
  <!-- <meta name="yandex-verification" content="ВАШ_КОД_ЯНДЕКС"> -->
  <meta property="og:type" content="${p.meta.type === 'Article' ? 'article' : 'website'}">
  <meta property="og:site_name" content="${SITE.name}">
  <meta property="og:locale" content="${language.ogLocale}">
  ${SITE_LANGUAGES.filter(code=>code!==p.locale).map(code=>`<meta property="og:locale:alternate" content="${SITE_LOCALES[code].ogLocale}">`).join('\n  ')}
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(p.meta.title)}">
  <meta property="og:description" content="${esc(p.meta.description)}">
  <meta property="og:image" content="${og.url}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="${og.type}">
  <meta property="og:image:alt" content="${esc(p.meta.h1)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(p.meta.title)}">
  <meta name="twitter:description" content="${esc(p.meta.description)}">
  <meta name="twitter:image" content="${og.url}">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="${p.locale==='ru'?'':'/'+p.locale}/site.webmanifest">
${p.meta.iframe !== 'none' ? `  <link rel="preconnect" href="https://creative.world-webcam.com">
  <link rel="dns-prefetch" href="https://creative.world-webcam.com">
` : ''}  <link rel="stylesheet" href="/assets/site.css?v=${cssVersion}">
  <script type="application/ld+json">
${jsonLd(p, crumbs)}
  </script>
</head>
<body class="section-${p.section}">
  <header class="site-header site-header--actions">
    <a class="logo" href="${route(p,'/')}" aria-label="${SITE.name} — ${esc(ui.brandHome)}">
      <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#ff3d6e"/><circle cx="16" cy="16" r="7" fill="none" stroke="#fff" stroke-width="3"/><circle cx="16" cy="16" r="2.5" fill="#fff"/></svg>
      <span dir="ltr">${SITE.name}</span>
    </a>
    <nav class="site-nav" dir="${language.dir}" aria-label="${esc(ui.mainMenu)}">${navHtml}</nav>
    <div class="header-extra${p.section === 'watch' ? '' : ' header-extra--cta'}" dir="${language.dir}">${headerCta}</div>
    ${renderLanguageSwitcher(p.locale,p.basePath,SITE_LANGUAGES)}
  </header>
${top ? `  <div class="titlebar"><h1>${esc(p.meta.h1)}</h1></div>
  ${streamHtml}
` : ''}  <main>
    ${crumbsHtml}
${top ? '' : `    <h1 class="page-title">${esc(p.meta.h1)}</h1>\n`}    ${figure(p, top)}
    ${body}
    ${top ? '' : streamHtml}
    ${p.section === 'watch' ? promoBlock(p) : ''}
    ${ctaFinal}
    ${faqBlock(p.meta.faq,p)}
    ${relatedHtml}
  </main>
  <footer class="site-footer">
    <nav class="footer-nav" aria-label="${esc(ui.sectionsMenu)}">${sec.footerNav.map(([u],i) => `<a href="${route(p,u)}">${esc(sectionUi.footerNav[i])}</a>`).join('')}</nav>
    ${sectionUi.footer.map((t) => `<p>${t}</p>`).join('\n    ')}
    <nav class="footer-nav footer-nav--info" aria-label="${esc(ui.aboutMenu)}">${SITE.infoLinks.map(([u],i) => `<a href="${route(p,u)}">${esc(language.infoLinks[i])}</a>`).join("")}</nav>
    <p><a href="${route(p,'/help/')}">${esc(ui.helpLink)}</a></p>
    <p>© ${TODAY.slice(0, 4)} ${SITE.name}</p>
  </footer>
</body>
</html>
`;
}

// ---------- запись ----------

if (!errors.length) {
  fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'assets', 'site.css'), css);
  fs.writeFileSync(path.join(ROOT, 'assets', 'language-switcher.js'), LANGUAGE_SWITCHER_JS);
  for (const p of pages) {
    const out = path.join(ROOT, ...p.urlPath.split('/').filter(Boolean), 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const html = render(p).replace(/^[\t ]+(?=\r?$)/gm, '');
    fs.writeFileSync(out, PREVIEW_READY ? html.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, nofollow">') : html);
  }

  const sitemapCss = fs.readFileSync(path.join(ROOT, '_build', 'sitemap.css'), 'utf8')
    .replaceAll('{{PAGE_COUNT}}', String(pages.length + help.pages.length))
    .replaceAll('{{LANGUAGE_COUNT}}', String(SITE_LANGUAGES.length));
  fs.writeFileSync(path.join(ROOT, 'assets', 'sitemap.css'), sitemapCss);
  const sitemapCssVersion = crypto.createHash('sha256').update(sitemapCss).digest('hex').slice(0, 12);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/css" href="/assets/sitemap.css?v=${sitemapCssVersion}"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${pages.map((p) => {
    const img = IMAGES[p.basePath];
    const imgXml = img ? `\n    <image:image>\n      <image:loc>${esc(abs(img.src))}</image:loc>\n    </image:image>` : '';
    return `  <url>\n    <loc>${esc(abs(p.urlPath))}</loc>${p.modified ? `\n    <lastmod>${esc(p.modified)}</lastmod>` : ''}${alternates(p).map(a=>`\n    <xhtml:link rel="alternate" hreflang="${esc(a.lang)}" href="${esc(a.url)}"/>`).join('')}${imgXml}\n  </url>`;
  }).join('\n')}
${helpSitemapEntries(help, SITE.origin)}
</urlset>
`;
  if (PREVIEW_READY) for (const page of help.pages) page.html = page.html.replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, nofollow">');
  writeHelpSite(ROOT, help);
  writeLocalizedStatic(ROOT, pages, cssVersion, SITE_LANGUAGES);
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
}

// ---------- отчёт ----------

const bySection = pages.reduce((a, p) => ((a[p.section] = (a[p.section] || 0) + 1), a), {});
console.log(`Страниц: ${pages.length} (${Object.entries(bySection).map(([k, v]) => `${k}: ${v}`).join(', ')})`);
console.log(`Технический справочник: ${help.pages.length} страниц на ${SITE_LANGUAGES.length} языках`);
if (PREVIEW_READY) console.log(`LOCAL PREVIEW ONLY (noindex): ${SITE_LANGUAGES.join(', ')}. Run the default build for the complete release.`);
const thin = pages.filter((p) => p.locale === 'ru' && !p.isHub && !p.meta.short && p.basePath !== '/' && words(p.body) < 400);
if (thin.length) warnings.push(...thin.map((p) => `${p.rel}: мало текста (${words(p.body)} слов)`));
for (const w of warnings) console.log('ПРЕДУПРЕЖДЕНИЕ', w);
for (const e of errors) console.log('ОШИБКА', e);
if (errors.length) { console.log('Сборка остановлена, файлы не записаны'); process.exit(1); }
if (process.argv.includes('--stats')) for (const p of pages) console.log(String(words(p.body)).padStart(5), p.urlPath);

