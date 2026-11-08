import {SITE_LANGUAGES, SITE_LOCALES, localizePath} from './site-ui.mjs';
import {createHash} from 'node:crypto';

const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));

/** Native disclosure keeps language navigation available without JavaScript. */
export function renderLanguageSwitcher(locale, basePath, languages = SITE_LANGUAGES) {
  const current = SITE_LOCALES[locale];
  if (!current) throw new Error(`Unknown site language: ${locale}`);
  const available = [...new Set(languages)].filter(language => SITE_LOCALES[language]);
  const links = available.map(language => {
    const target = SITE_LOCALES[language];
    return `<a href="${escape(localizePath(language, basePath))}" lang="${escape(target.languageTag)}" hreflang="${escape(target.languageTag)}" dir="${target.dir}"${language === locale ? ' aria-current="page"' : ''}>${escape(target.name)}${language === locale ? '<span class="language-check" aria-hidden="true">✓</span>' : ''}</a>`;
  }).join('');
  return `<details class="language-switcher" dir="${current.dir}"><summary class="language-toggle" aria-label="${escape(current.ui.language)}: ${escape(current.name)}" title="${escape(current.ui.language)}"><svg class="language-globe" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg><span class="language-current" lang="${escape(current.languageTag)}">${escape(current.name)}</span><span class="language-code" aria-hidden="true">${escape(locale.toUpperCase())}</span><svg class="language-chevron" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></summary><nav class="language-nav" aria-label="${escape(current.ui.language)}">${links}</nav></details><script src="/assets/language-switcher.js?v=${LANGUAGE_SWITCHER_VERSION}" defer></script>`;
}

export const LANGUAGE_SWITCHER_JS = `(() => {
  const switchers = [...document.querySelectorAll('.language-switcher')];
  document.addEventListener('click', event => {
    for (const switcher of switchers) {
      if (switcher.open && !switcher.contains(event.target)) switcher.open = false;
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    for (const switcher of switchers) {
      if (!switcher.open) continue;
      switcher.open = false;
      switcher.querySelector('summary').focus();
      event.preventDefault();
    }
  });
})();
`;

const LANGUAGE_SWITCHER_VERSION = createHash('sha256').update(LANGUAGE_SWITCHER_JS).digest('hex').slice(0, 12);
