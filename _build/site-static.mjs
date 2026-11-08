import fs from 'node:fs';
import path from 'node:path';
import {SITE} from './config.mjs';
import {SITE_LANGUAGES, SITE_LOCALES, localizePath} from './site-ui.mjs';
import {escapeHtml as esc} from './help.mjs';

export function writeLocalizedStatic(root, pages, cssVersion, languages = SITE_LANGUAGES) {
  for (const locale of languages) {
    const language = SITE_LOCALES[locale];
    const ui = language.ui;
    const home = localizePath(locale,'/');
    const dir = path.join(root,locale === 'ru' ? '' : locale);
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'site.webmanifest'),JSON.stringify({
      name:pages.find(p=>p.locale===locale && p.basePath==='/').meta.title,
      short_name:SITE.name, lang:language.languageTag, dir:language.dir,
      start_url:home, scope:home, display:'standalone',
      background_color:SITE.themeColor, theme_color:SITE.themeColor,
      icons:[
        {src:'/icon-192.png',sizes:'192x192',type:'image/png'},
        {src:'/icon-512.png',sizes:'512x512',type:'image/png'},
        {src:'/icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'},
      ],
    },null,2)+'\n');
    const html = `<!doctype html>
<html lang="${language.languageTag}" dir="${language.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(ui.notFoundTitle)}</title>
  <meta name="robots" content="noindex, follow">
  <meta name="theme-color" content="${SITE.themeColor}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/site.css?v=${cssVersion}">
  <style>body { min-height: 100vh; display: grid; place-items: center; text-align: center; } main { width: 100%; } h1 { font-size: 4rem; color: var(--accent); } .footer-nav { margin-top: 1.5rem; }</style>
</head>
<body><main>
  <h1>404</h1>
  <p>${esc(ui.notFoundMessage)}</p>
  <a class="btn" href="${home}">${esc(ui.notFoundHome)}</a>
  <nav class="footer-nav" aria-label="${esc(ui.sectionsMenu)}"><a href="${localizePath(locale,'/kategorii/')}">${esc(ui.categoriesHeading)}</a><a href="${localizePath(locale,'/gid/')}">${esc(ui.guidesHeading)}</a><a href="${localizePath(locale,'/help/')}">${esc(ui.helpNav)}</a></nav>
</main></body>
</html>
`;
    fs.writeFileSync(path.join(dir,'404.html'),html);
  }
}
