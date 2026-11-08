import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {SITE} from './config.mjs';
import {SITE_LOCALES, localizePath} from './site-ui.mjs';
import {renderLanguageSwitcher} from './language-switcher.mjs';

export const LANGUAGES = ['ru', 'en', 'es', 'pt', 'de', 'zh', 'hi', 'ar'];
export const TOPICS = ['webcam-test', 'webcam-for-pc', 'iriun-webcam', 'logitech-webcam', 'camera-permissions', 'webcam-black-screen', 'microphone-test', 'webcam-image-quality', 'webcam-in-use', 'webcam-background', 'webcam-resolution-fps', 'webcam-mirror', 'obs-webcam-setup', 'obs-webcam-frame', 'phone-as-webcam', 'webcam-setup', 'webcam-on-off', 'obs-webcam-black-screen', 'webcam-crop', 'webcam-lighting'];
export const REVIEWED = '2026-11-08';
const languageTags = { zh: 'zh-Hans' };
const ogLocales = { ru: 'ru_RU', en: 'en_US', es: 'es_ES', pt: 'pt_BR', de: 'de_DE', zh: 'zh_CN', hi: 'hi_IN', ar: 'ar_SA' };
export const helpUrl = (locale, id = '') => `${locale === 'ru' ? '' : '/' + locale}/help/${id ? id + '/' : ''}`;
export const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const tag = locale => languageTags[locale] || locale;
const uiKeys = ['name', 'dir', 'title', 'description', 'heading', 'intro', 'guides', 'languages', 'contents', 'sources', 'related', 'updated', 'skip', 'back', 'privacy', 'privacyText', 'startCamera', 'startMic', 'stop', 'idle', 'pending', 'active', 'stopped', 'denied', 'missing', 'busy', 'error', 'unsupported', 'level', 'settings', 'noScript', 'toolHeading', 'toolNote', 'mirrorPreview', 'configuredFrameRate', 'aboutSite'];

export function readHelpLocales(root) {
  const locales = LANGUAGES.map(locale => {
    const data = JSON.parse(fs.readFileSync(path.join(root, '_src/help/locales', locale + '.json'), 'utf8').replace(/^\uFEFF/, ''));
    if (data.locale !== locale) throw new Error(`Invalid locale: ${locale}`);
    for (const key of uiKeys) if (typeof data.ui?.[key] !== 'string' || !data.ui[key].trim()) throw new Error(`${locale}: missing ui.${key}`);
    if (data.ui.dir !== (locale === 'ar' ? 'rtl' : 'ltr')) throw new Error(`${locale}: wrong text direction`);
    if (data.articles?.length !== TOPICS.length || new Set(data.articles.map(a => a.id)).size !== TOPICS.length) throw new Error(`${locale}: expected ${TOPICS.length} unique topics`);
    for (const article of data.articles) {
      if (!TOPICS.includes(article.id)) throw new Error(`${locale}: unknown topic ${article.id}`);
      for (const key of ['title', 'description', 'heading', 'lead', 'imageAlt']) if (!article[key]?.trim()) throw new Error(`${locale}/${article.id}: missing ${key}`);
      if (article.sections.length < 3 || !article.sources?.length) throw new Error(`${locale}/${article.id}: missing sections or sources`);
      for (const section of article.sections) {
        if (!section.heading || ![...(section.paragraphs || []), ...(section.steps || [])].length) throw new Error(`${locale}/${article.id}: empty section`);
      }
      for (const source of article.sources) {
        const url = new URL(source.url);
        if (url.protocol !== 'https:' || !source.label?.trim()) throw new Error(`${locale}/${article.id}: invalid source`);
      }
      if (!article.related?.length || article.related.some(id => !TOPICS.includes(id) || id === article.id)) throw new Error(`${locale}/${article.id}: invalid related guides`);
    }
    return data;
  });
  return locales;
}

function tool(article, ui) {
  const mode = article.id === 'webcam-test' ? 'video' : article.id === 'microphone-test' ? 'audio' : null;
  if (!mode) return '';
  return `<section class="device-test" data-device-test="${mode}" aria-labelledby="device-test-title">
    <h2 id="device-test-title">${escapeHtml(ui.toolHeading)}</h2>
    <p>${escapeHtml(ui.toolNote)}</p>
    <div class="test-controls"><button type="button" class="btn" data-start>${escapeHtml(mode === 'video' ? ui.startCamera : ui.startMic)}</button><button type="button" class="btn secondary" data-stop disabled>${escapeHtml(ui.stop)}</button></div>
    <p role="status" data-status aria-live="polite">${escapeHtml(ui.idle)}</p>
    ${mode === 'video' ? `<label class="mirror-control"><input type="checkbox" data-mirror checked> ${escapeHtml(ui.mirrorPreview)}</label><video data-preview class="is-mirrored" autoplay muted playsinline hidden></video>` : `<label class="meter-label" hidden data-meter-label>${escapeHtml(ui.level)} <meter data-meter min="0" max="100" value="0"></meter></label>`}
    <p data-settings class="device-settings" hidden dir="auto"></p>
    <noscript><p>${escapeHtml(ui.noScript)}</p></noscript>
    <script type="application/json" data-messages>${json(ui)}</script>
  </section>`;
}

function cards(locale, articles) {
  return `<ul class="cards help-cards">${articles.map(a => `<li><a href="${helpUrl(locale, a.id)}"><img src="/img/help/${a.id}.svg" width="1200" height="630" alt="" loading="lazy" decoding="async"><h3>${escapeHtml(a.heading)}</h3><p>${escapeHtml(a.description)}</p></a></li>`).join('')}</ul>`;
}

export function prepareHelpSite(root, origin, languages = LANGUAGES) {
  const locales = readHelpLocales(root).filter(data => languages.includes(data.locale));
  const css = fs.readFileSync(path.join(root, '_build/help.css'), 'utf8');
  const siteCss = fs.readFileSync(path.join(root, '_build/site.css'), 'utf8');
  const siteCssVersion = crypto.createHash('md5').update(siteCss).digest('hex').slice(0, 8);
  const js = fs.readFileSync(path.join(root, '_build/device-test.js'), 'utf8');
  const hash = s => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
  const abs = url => origin + url;
  const pages = [];
  for (const data of locales) {
    const {locale, ui} = data;
    const siteLocale = SITE_LOCALES[locale];
    const home = localizePath(locale,'/');
    const infoNav = SITE.infoLinks.map(([url],i) => `<a href="${localizePath(locale,url)}">${escapeHtml(siteLocale.infoLinks[i])}</a>`).join('');
    for (const article of [null, ...data.articles]) {
      const id = article?.id || '';
      const urlPath = helpUrl(locale, id);
      const url = abs(urlPath);
      const title = article?.title || ui.title;
      const description = article?.description || ui.description;
      const heading = article?.heading || ui.heading;
      const imagePath = `/img/help/${id || 'webcam-test'}.png`;
      const alternates = locales.map(other => ({ lang: tag(other.locale), url: abs(helpUrl(other.locale, id)) }));
      alternates.push({lang: 'x-default', url: abs(helpUrl('en', id))});
      const graph = [
        { '@type': article ? 'WebPage' : 'CollectionPage', '@id': url + '#page', url, name: title, description, inLanguage: tag(locale), dateModified: REVIEWED, isPartOf: {'@id': abs(home) + '#website'}, breadcrumb: {'@id': url + '#breadcrumb'} },
        { '@type': 'WebSite', '@id': abs(home) + '#website', url: abs(home), name: SITE.name, inLanguage: tag(locale) },
      ];
      graph.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: [
        {'@type':'ListItem', position:1, name:siteLocale.ui.home, item:abs(home)},
        {'@type':'ListItem', position:2, name:ui.heading, item:abs(helpUrl(locale))},
        ...(article ? [{'@type':'ListItem', position:3, name:heading, item:url}] : []),
      ] });
      if (article) {
        graph.push({ '@type': 'TechArticle', '@id': url + '#article', headline: heading, description, inLanguage: tag(locale), dateModified: REVIEWED, mainEntityOfPage: {'@id': url + '#page'}, image: abs(imagePath), citation: article.sources.map(s => s.url) });
      }
      const articleBody = article ? `
        ${tool(article, ui)}
        <figure class="article-image"><img src="/img/help/${id}.svg" width="1200" height="630" alt="${escapeHtml(article.imageAlt)}" decoding="async" fetchpriority="high"></figure>
        <nav class="contents" aria-label="${escapeHtml(ui.contents)}"><h2>${escapeHtml(ui.contents)}</h2><ol>${article.sections.map((s,i) => `<li><a href="#section-${i + 1}">${escapeHtml(s.heading)}</a></li>`).join('')}</ol></nav>
        ${article.sections.map((s,i) => `<section class="article-section" aria-labelledby="section-${i+1}"><h2 id="section-${i+1}">${escapeHtml(s.heading)}</h2>${(s.paragraphs || []).map(p => `<p>${escapeHtml(p)}</p>`).join('')}${s.steps?.length ? `<ol>${s.steps.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ol>` : ''}</section>`).join('')}
        <section class="sources" aria-labelledby="sources"><h2 id="sources">${escapeHtml(ui.sources)}</h2><ul>${article.sources.map(s => `<li><a href="${escapeHtml(s.url)}" rel="noopener noreferrer">${escapeHtml(s.label)}</a></li>`).join('')}</ul></section>
        <section aria-labelledby="related"><h2 id="related">${escapeHtml(ui.related)}</h2>${cards(locale, article.related.map(id => data.articles.find(a => a.id === id)))}</section>
      ` : `<section aria-labelledby="guides"><h2 id="guides">${escapeHtml(ui.guides)}</h2>${cards(locale, data.articles)}</section>`;
      const html = `<!doctype html>
<html lang="${tag(locale)}" dir="${ui.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${url}">
  ${alternates.map(a => `<link rel="alternate" hreflang="${a.lang}" href="${a.url}">`).join('\n  ')}
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="theme-color" content="${escapeHtml(SITE.themeColor)}">
  <meta property="og:type" content="${article ? 'article' : 'website'}">
  <meta property="og:locale" content="${ogLocales[locale]}">
  ${locales.filter(d => d.locale !== locale).map(d => `<meta property="og:locale:alternate" content="${ogLocales[d.locale]}">`).join('\n  ')}
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${abs(imagePath)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(article?.imageAlt || heading)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${abs(imagePath)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="manifest" href="${locale==='ru'?'':'/'+locale}/site.webmanifest">
  <link rel="stylesheet" href="/assets/site.css?v=${siteCssVersion}">
  <link rel="stylesheet" href="/assets/help.css?v=${hash(css)}">
  <script type="application/ld+json">${json({'@context':'https://schema.org','@graph':graph})}</script>
  ${['webcam-test','microphone-test'].includes(id) ? `<script src="/assets/device-test.js?v=${hash(js)}" defer></script>` : ''}
</head>
<body class="section-help">
  <a class="skip-link" href="#main">${escapeHtml(ui.skip)}</a>
  <header class="site-header"><a class="logo" href="${home}"><img src="/favicon.svg" width="28" height="28" alt=""><span dir="ltr">${escapeHtml(SITE.name)}</span></a><nav class="site-nav" dir="${siteLocale.dir}" aria-label="${escapeHtml(siteLocale.ui.mainMenu)}"><a href="${home}">${escapeHtml(siteLocale.ui.home)}</a><a href="${helpUrl(locale)}"${article ? '' : ' aria-current="page"'}>${escapeHtml(ui.guides)}</a><a href="${localizePath(locale,'/o-sajte/')}">${escapeHtml(siteLocale.ui.aboutSite)}</a></nav>${renderLanguageSwitcher(locale,helpUrl('ru',id),locales.map(other=>other.locale))}</header>
  <main id="main">
    <nav class="crumbs breadcrumbs" aria-label="${escapeHtml(siteLocale.ui.breadcrumbs)}"><a href="${home}">${escapeHtml(siteLocale.ui.home)}</a><span class="sep" aria-hidden="true">›</span>${article ? `<a href="${helpUrl(locale)}">${escapeHtml(ui.heading)}</a><span class="sep" aria-hidden="true">›</span><span aria-current="page">${escapeHtml(heading)}</span>` : `<span aria-current="page">${escapeHtml(ui.heading)}</span>`}</nav>
    <article>
      <header class="article-header"><p class="eyebrow">${escapeHtml(ui.updated)} <time datetime="${REVIEWED}">${new Intl.DateTimeFormat(tag(locale), {dateStyle:'long', timeZone:'UTC'}).format(new Date(REVIEWED+'T12:00:00Z'))}</time></p><h1 class="page-title">${escapeHtml(heading)}</h1><p class="lead">${escapeHtml(article?.lead || ui.intro)}</p></header>
      ${articleBody}
    </article>
  </main>
  <footer class="site-footer"><section id="privacy"><h2>${escapeHtml(ui.privacy)}</h2><p>${escapeHtml(ui.privacyText)}</p><nav class="footer-nav" aria-label="${escapeHtml(siteLocale.ui.sectionsMenu)}"><a href="${home}">${escapeHtml(siteLocale.ui.home)}</a><a href="${helpUrl(locale)}">${escapeHtml(ui.back)}</a></nav><nav class="footer-nav footer-nav--info" aria-label="${escapeHtml(siteLocale.ui.aboutMenu)}">${infoNav}</nav><p dir="ltr">© ${REVIEWED.slice(0,4)} ${escapeHtml(SITE.name)}</p></section></footer>
</body>
</html>
`;
      pages.push({urlPath, locale, id, html, alternates, imagePath, lastmod: REVIEWED});
    }
  }
  return { pages, css, js };
}

export function writeHelpSite(root, help) {
  for (const page of help.pages) {
    const file = path.join(root, page.urlPath, 'index.html');
    fs.mkdirSync(path.dirname(file), {recursive:true});
    fs.writeFileSync(file, page.html.replace(/^[\t ]+(?=\r?$)/gm, ''));
  }
  fs.mkdirSync(path.join(root, 'assets'), {recursive:true});
  fs.writeFileSync(path.join(root, 'assets/help.css'), help.css);
  fs.writeFileSync(path.join(root, 'assets/device-test.js'), help.js);
}

export function helpSitemapEntries(help, origin) {
  return help.pages.map(p => `  <url>\n    <loc>${origin + p.urlPath}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n${p.alternates.map(a => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.url}"/>`).join('\n')}\n    <image:image><image:loc>${origin + p.imagePath}</image:loc></image:image>\n  </url>`).join('\n');
}
