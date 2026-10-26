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
import { SITE, SECTIONS, DIR_LABELS, IFRAME_TAGS, iframeSrc } from './config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, '_src', 'pages');
const TODAY = new Date().toISOString().slice(0, 10);
const RELATED_COUNT = 6;

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
    rel, urlPath, isHub, section,
    dir: isHub ? parts.join('/') : dir,       // каталог, к которому относится страница (для хаба — свой)
    parentDir: dir,                           // каталог-родитель
    meta: { iframe: section === 'watch' ? 'top' : 'none', tag: 'girls', faq: [], type: 'WebPage', ...meta },
    body: m[2].trim(),
  };
}

const pages = walk(SRC).map(parsePage).filter(Boolean).sort((a, b) => a.urlPath.localeCompare(b.urlPath));
const byUrl = new Map(pages.map((p) => [p.urlPath, p]));

// ---------- проверки содержимого ----------

const seen = { title: new Map(), description: new Map(), h1: new Map() };
for (const p of pages) {
  for (const k of Object.keys(seen)) {
    const v = p.meta[k];
    if (seen[k].has(v)) errors.push(`${p.rel}: ${k} совпадает с ${seen[k].get(v)}`);
    else seen[k].set(v, p.rel);
  }
  if (p.meta.title.length > 70) warnings.push(`${p.rel}: title длиннее 70 символов (${p.meta.title.length})`);
  const dl = p.meta.description.length;
  if (dl < 70 || dl > 170) warnings.push(`${p.rel}: description ${dl} символов, лучше 70–170`);

  const hrefs = [...p.body.matchAll(/href="([^"]+)"/g)].map((x) => x[1]);
  for (const h of hrefs) {
    if (/^https?:/.test(h)) errors.push(`${p.rel}: внешняя ссылка в тексте (${h}), используйте {{cta}}`);
    else if (h.startsWith('/')) {
      const target = h.split('#')[0];
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
fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'assets', 'site.css'), css);

const abs = (u) => SITE.origin + u;

// Иллюстрации страниц: адрес страницы -> { src, og, w, h, alt }. Файл пишет _build/images.py
const IMAGES_FILE = path.join(ROOT, '_src', 'images.json');
const IMAGES = fs.existsSync(IMAGES_FILE) ? JSON.parse(fs.readFileSync(IMAGES_FILE, 'utf8')) : {};
for (const u of Object.keys(IMAGES)) if (!byUrl.has(u)) errors.push(`_src/images.json: нет страницы ${u}`);

function ogImage(p) {
  const img = IMAGES[p.urlPath];
  return img ? { url: abs(img.og), type: 'image/jpeg' } : { url: abs(SECTIONS[p.section].ogImage), type: 'image/png' };
}

function figure(p, lazy) {
  const img = IMAGES[p.urlPath];
  if (!img) return '';
  const load = lazy ? 'loading="lazy"' : 'fetchpriority="high"';
  return `<figure class="hero-img"><img src="${img.src}" width="${img.w}" height="${img.h}" alt="${esc(img.alt)}" ${load} decoding="async"></figure>`;
}
const extAttrs = 'target="_blank" rel="sponsored noopener"';

function ctaButton(section, extraClass = '') {
  const c = SECTIONS[section].cta;
  return `<a class="btn ${extraClass}" href="${esc(c.href)}"${c.external ? ' ' + extAttrs : ''}>${esc(c.text)}</a>`;
}

function breadcrumbs(p) {
  const crumbs = [['/', 'Главная']];
  const parts = p.urlPath.split('/').filter(Boolean);
  let acc = '/';
  parts.forEach((part, i) => {
    acc += part + '/';
    const pg = byUrl.get(acc);
    const label = i === parts.length - 1 ? p.meta.nav : (pg?.meta.nav || DIR_LABELS[part] || part);
    crumbs.push([acc, label]);
  });
  return crumbs;
}

function childrenOf(dir) {
  return pages.filter((c) => !c.isHub && c.parentDir === dir);
}

function cardGrid(list) {
  return `<ul class="cards">${list.map((c) =>
    `<li><a href="${c.urlPath}"><strong>${esc(c.meta.nav)}</strong><span>${esc(c.meta.card || c.meta.description)}</span></a></li>`).join('')}</ul>`;
}

// Соседние страницы того же каталога: берём следующие по кругу, так ссылки распределяются равномерно
function related(p) {
  const sib = pages.filter((c) => c.parentDir === p.parentDir && !c.isHub);
  const i = sib.indexOf(p);
  if (i < 0 || sib.length < 2) return [];
  const out = [];
  for (let k = 1; k < sib.length && out.length < RELATED_COUNT; k++) out.push(sib[(i + k) % sib.length]);
  return out;
}

function streamBlock(p, heading) {
  return `<section class="stream${heading ? ' stream--inline' : ''}" id="stream" aria-label="Трансляции онлайн">
    ${heading ? `<h2>${esc(heading)}</h2>` : ''}
    <iframe title="${esc(p.meta.nav)}: трансляции онлайн" src="${esc(iframeSrc(p.meta.tag))}"${heading ? ' loading="lazy"' : ''} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen></iframe>
  </section>`;
}

function promoBlock() {
  return `<section class="promo" aria-label="Заработок со Stripchat">
    <a class="promo-card" href="/model/"><strong>Станьте вебкам-моделью</strong><span>Работа из дома в своём графике. Узнайте, как начать и сколько можно зарабатывать.</span></a>
    <a class="promo-card" href="/partner/"><strong>Зарабатывайте на трафике</strong><span>Партнёрская программа Stripcash: процент с покупок приведённых вами зрителей.</span></a>
  </section>`;
}

function faqBlock(faq) {
  if (!faq.length) return '';
  return `<section class="faq" aria-labelledby="faq">
      <h2 id="faq">Частые вопросы</h2>
      ${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n      ')}
    </section>`;
}

function jsonLd(p, crumbs) {
  const url = abs(p.urlPath);
  const sec = SECTIONS[p.section];
  const graph = [
    { '@type': 'WebSite', '@id': `${SITE.origin}/#website`, url: `${SITE.origin}/`, name: SITE.name, alternateName: ['Stripchat', 'Стрипчат'], inLanguage: 'ru-RU' },
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`, url, name: p.meta.title, description: p.meta.description,
      isPartOf: { '@id': `${SITE.origin}/#website` }, inLanguage: 'ru-RU', isFamilyFriendly: !sec.adult,
      dateModified: TODAY,
      primaryImageOfPage: { '@type': 'ImageObject', url: ogImage(p).url, width: 1200, height: 630 },
      ...(crumbs.length > 1 ? { breadcrumb: { '@id': `${url}#breadcrumb` } } : {}),
    },
  ];
  if (p.meta.type === 'Article') {
    graph.push({
      '@type': 'Article', '@id': `${url}#article`, headline: p.meta.h1, description: p.meta.description,
      mainEntityOfPage: { '@id': `${url}#webpage` }, inLanguage: 'ru-RU', dateModified: TODAY,
      datePublished: p.meta.published || TODAY, image: ogImage(p).url,
      author: { '@type': 'Organization', name: SITE.name, url: `${SITE.origin}/` },
      publisher: { '@type': 'Organization', name: SITE.name, url: `${SITE.origin}/` },
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
  const crumbs = breadcrumbs(p);
  const url = abs(p.urlPath);
  const og = ogImage(p);
  const isHome = p.urlPath === '/';

  let body = p.body.replaceAll('{{cta}}', `<p class="cta-row">${ctaButton(p.section)}</p>`);
  if (p.isHub) {
    const kids = childrenOf(p.dir);
    if (kids.length) body += `\n<section aria-labelledby="list"><h2 id="list">${esc(p.meta.listTitle || 'Все страницы раздела')}</h2>${cardGrid(kids)}</section>`;
  }
  if (isHome) {
    body += `\n<section aria-labelledby="cats"><h2 id="cats">Категории трансляций</h2>${cardGrid(childrenOf('kategorii'))}<p><a href="/kategorii/">Все категории</a></p></section>`;
    body += `\n<section aria-labelledby="guides"><h2 id="guides">Гиды для зрителей</h2>${cardGrid(childrenOf('gid'))}</section>`;
  }

  const rel = related(p);
  const relatedHtml = rel.length ? `<section aria-labelledby="related"><h2 id="related">${p.section === 'watch' ? 'Смотрите также' : 'Читайте также'}</h2>${cardGrid(rel)}</section>` : '';

  const navHtml = sec.nav.map(([u, t]) => `<a href="${u}"${u === p.urlPath ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  const headerCta = p.section === 'watch' ? '<span class="badge-18" title="Только для лиц старше 18 лет">18+</span>' : ctaButton(p.section, 'btn--small');

  const crumbsHtml = crumbs.length > 1
    ? `<nav class="crumbs" aria-label="Хлебные крошки">${crumbs.map(([u, n], i) => i === crumbs.length - 1 ? `<span aria-current="page">${esc(n)}</span>` : `<a href="${u}">${esc(n)}</a>`).join('<span class="sep">›</span>')}</nav>`
    : '';

  const top = p.meta.iframe === 'top';
  const streamHtml = p.meta.iframe === 'none' ? '' : streamBlock(p, top ? '' : (p.meta.streamTitle || 'Смотреть трансляции онлайн'));
  const ctaFinal = p.section === 'watch' ? '' : `<section class="cta-final"><h2>${esc(p.meta.ctaTitle || (p.section === 'model' ? 'Готовы попробовать?' : 'Начните зарабатывать на трафике'))}</h2><p>${esc(p.meta.ctaText || (p.section === 'model' ? 'Регистрация бесплатная и занимает несколько минут. Понадобится документ, подтверждающий, что вам есть 18 лет.' : 'Регистрация в партнёрской программе бесплатная. После неё вы получите ссылки и промо-материалы в личном кабинете.'))}</p>${ctaButton(p.section)}</section>`;

  return `<!DOCTYPE html>
<html lang="ru" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(p.meta.title)}</title>
  <meta name="description" content="${esc(p.meta.description)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="ru" href="${url}">
  <link rel="alternate" hreflang="x-default" href="${url}">
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
  <meta property="og:locale" content="ru_RU">
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
  <link rel="manifest" href="/site.webmanifest">
${p.meta.iframe !== 'none' ? `  <link rel="preconnect" href="https://creative.world-webcam.com">
  <link rel="dns-prefetch" href="https://creative.world-webcam.com">
` : ''}  <link rel="stylesheet" href="/assets/site.css?v=${cssVersion}">
  <script type="application/ld+json">
${jsonLd(p, crumbs)}
  </script>
</head>
<body class="section-${p.section}">
  <header class="site-header">
    <a class="logo" href="/" aria-label="${SITE.name} — на главную">
      <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#ff3d6e"/><circle cx="16" cy="16" r="7" fill="none" stroke="#fff" stroke-width="3"/><circle cx="16" cy="16" r="2.5" fill="#fff"/></svg>
      <span>${SITE.name}</span>
    </a>
    <nav class="site-nav" aria-label="Основное меню">${navHtml}</nav>
    ${headerCta}
  </header>
${top ? `  <div class="titlebar"><h1>${esc(p.meta.h1)}</h1></div>
  ${streamHtml}
` : ''}  <main>
    ${crumbsHtml}
${top ? '' : `    <h1 class="page-title">${esc(p.meta.h1)}</h1>\n`}    ${figure(p, top)}
    ${body}
    ${top ? '' : streamHtml}
    ${p.section === 'watch' ? promoBlock() : ''}
    ${ctaFinal}
    ${faqBlock(p.meta.faq)}
    ${relatedHtml}
  </main>
  <footer class="site-footer">
    <nav class="footer-nav" aria-label="Разделы сайта">${sec.footerNav.map(([u, t]) => `<a href="${u}">${esc(t)}</a>`).join('')}</nav>
    ${sec.footer.map((t) => `<p>${t}</p>`).join('\n    ')}
    <nav class="footer-nav footer-nav--info" aria-label="О сайте">${SITE.infoLinks.map(([u, t]) => `<a href="${u}">${esc(t)}</a>`).join("")}</nav>
    <p>© ${TODAY.slice(0, 4)} ${SITE.name}</p>
  </footer>
</body>
</html>
`;
}

// ---------- запись ----------

if (!errors.length) {
  for (const p of pages) {
    const out = path.join(ROOT, ...p.urlPath.split('/').filter(Boolean), 'index.html');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, render(p));
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.map((p) => {
    const img = IMAGES[p.urlPath];
    const imgXml = img ? `\n    <image:image>\n      <image:loc>${abs(img.src)}</image:loc>\n    </image:image>` : '';
    return `  <url>\n    <loc>${abs(p.urlPath)}</loc>\n    <lastmod>${TODAY}</lastmod>${imgXml}\n  </url>`;
  }).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);
}

// ---------- отчёт ----------

const bySection = pages.reduce((a, p) => ((a[p.section] = (a[p.section] || 0) + 1), a), {});
console.log(`Страниц: ${pages.length} (${Object.entries(bySection).map(([k, v]) => `${k}: ${v}`).join(', ')})`);
const thin = pages.filter((p) => !p.isHub && !p.meta.short && p.urlPath !== '/' && words(p.body) < 400);
if (thin.length) warnings.push(...thin.map((p) => `${p.rel}: мало текста (${words(p.body)} слов)`));
for (const w of warnings) console.log('ПРЕДУПРЕЖДЕНИЕ', w);
for (const e of errors) console.log('ОШИБКА', e);
if (errors.length) { console.log('Сборка остановлена, файлы не записаны'); process.exit(1); }
if (process.argv.includes('--stats')) for (const p of pages) console.log(String(words(p.body)).padStart(5), p.urlPath);

