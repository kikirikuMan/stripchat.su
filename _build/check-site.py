"""Validate all generated locale pages without third-party dependencies.

This checks translation coverage and technical consistency, not linguistic quality.
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, urljoin, unquote
import json
import argparse
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
ORIGIN = 'https://stripchat.su'
LANGUAGES = ('ru', 'en', 'es', 'pt', 'de', 'zh', 'hi', 'ar')
TAGS = {lang: 'zh-Hans' if lang == 'zh' else lang for lang in LANGUAGES}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--locales', nargs='+', choices=LANGUAGES, default=list(LANGUAGES))
parser.add_argument('--preview', action='store_true', help='Require noindex on every selected preview page')
args = parser.parse_args()
SELECTED = tuple(lang for lang in LANGUAGES if lang in args.locales)
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9', 'x': 'http://www.w3.org/1999/xhtml'}
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
errors = []


def localized(locale, base):
    return base if locale == 'ru' else '/' + locale + base


def identify(route):
    parts = route.lstrip('/').split('/')
    if parts[0] in LANGUAGES[1:]:
        return parts[0], '/' + '/'.join(parts[1:])
    return 'ru', route


def source_route(file):
    parts = list(file.relative_to(ROOT / '_src/pages').with_suffix('').parts)
    if parts[-1] == 'index':
        parts.pop()
    return '/' + '/'.join(parts) + ('/' if parts else '')


class Page(HTMLParser):
    def __init__(self, html, route='', strict=True):
        super().__init__(convert_charrefs=True)
        self.route, self.strict = route, strict
        self.lang = self.direction = None
        self.canonical, self.graphs, self.iframes = [], [], []
        self.alternates, self.ids = {}, set()
        self.links, self.assets, self.images, self.visible = [], [], [], []
        self.title = self.description = self.h1_text = ''
        self.h1 = 0
        self.noindex = False
        self.stack = []
        self.script = None
        self.feed(html)

    def problem(self, message):
        if self.strict:
            errors.append(f'{self.route}: {message}')

    def handle_starttag(self, name, attrs):
        a = dict(attrs)
        inherited = self.stack[-1][1] if self.stack else {'body': False, 'language': False, 'excluded': False}
        state = {
            'body': inherited['body'] or name == 'body',
            'language': inherited['language'] or 'language-nav' in a.get('class', '').split(),
            'excluded': inherited['excluded'] or name in ('script', 'style'),
        }
        if a.get('id'):
            if a['id'] in self.ids:
                self.problem('duplicate HTML id: ' + a['id'])
            self.ids.add(a['id'])
        if name == 'html':
            self.lang, self.direction = a.get('lang'), a.get('dir')
        if name == 'h1':
            self.h1 += 1
        if name == 'meta' and a.get('name', '').lower() == 'description':
            self.description = a.get('content', '')
        if name == 'meta' and a.get('name', '').lower() == 'robots' and 'noindex' in a.get('content', '').lower():
            self.noindex = True
            if not args.preview:
                self.problem('sitemap page is marked noindex')
        if name == 'link':
            if a.get('rel') == 'canonical':
                self.canonical.append(a.get('href'))
            if a.get('rel') == 'alternate' and 'hreflang' in a:
                if a['hreflang'] in self.alternates:
                    self.problem('duplicate hreflang: ' + a['hreflang'])
                self.alternates[a['hreflang']] = a.get('href')
            if a.get('rel') in ('stylesheet', 'icon', 'apple-touch-icon', 'manifest'):
                self.assets.append(a.get('href'))
        if name == 'a':
            self.links.append({'href': a.get('href', ''), 'language_switch': state['language'], 'hreflang': a.get('hreflang'), 'current': a.get('aria-current')})
        if name == 'img':
            self.assets.append(a.get('src'))
            self.images.append(a)
            if 'alt' not in a:
                self.problem('image is missing alt')
        if name == 'script':
            if a.get('src'):
                self.assets.append(a['src'])
            if a.get('type') == 'application/ld+json':
                self.script = ''
        if name == 'iframe':
            self.iframes.append(a.get('src'))
        if name not in VOID:
            self.stack.append((name, state))

    def handle_endtag(self, name):
        if name == 'script' and self.script is not None:
            try:
                self.graphs.append(json.loads(self.script))
            except json.JSONDecodeError:
                self.problem('invalid JSON-LD')
            self.script = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == name:
                del self.stack[i:]
                break

    def handle_data(self, data):
        names = [entry[0] for entry in self.stack]
        if 'title' in names:
            self.title += data
        if 'h1' in names:
            self.h1_text += data
        if self.script is not None:
            self.script += data
        if self.stack:
            state = self.stack[-1][1]
            if state['body'] and not state['language'] and not state['excluded']:
                self.visible.append(data)


def original_iframes(base_routes):
    """Read all original Russian HTML in one Git process, rather than 624 calls."""
    routes = sorted(base_routes)
    refs = ['HEAD:' + (route.lstrip('/') + 'index.html') for route in routes]
    process = subprocess.run(['git', 'cat-file', '--batch'], input=('\n'.join(refs) + '\n').encode(), cwd=ROOT, capture_output=True)
    if process.returncode:
        errors.append('Cannot read original iframe baselines from Git HEAD')
        return {}
    output, position, result = process.stdout, 0, {}
    for route in routes:
        end = output.find(b'\n', position)
        if end < 0:
            errors.append('Incomplete Git batch response for iframe baselines')
            break
        header = output[position:end].decode('utf-8')
        position = end + 1
        if header.endswith(' missing'):
            continue
        size = int(header.rsplit(' ', 1)[1])
        blob = output[position:position + size]
        position += size + 1
        result[route] = Page(blob.decode('utf-8'), strict=False).iframes
    return result


main_routes = {source_route(file) for file in (ROOT / '_src/pages').rglob('*.html')}
help_data = json.loads((ROOT / '_src/help/locales/ru.json').read_text(encoding='utf-8-sig'))
help_routes = {'/help/'} | {'/help/' + article['id'] + '/' for article in help_data['articles']}
base_routes = main_routes | help_routes
expected_routes = {localized(locale, route) for locale in SELECTED for route in base_routes}
baselines = original_iframes(main_routes)
tree = ET.parse(ROOT / 'sitemap.xml')
records = tree.findall('s:url', NS)
urls = [record.findtext('s:loc', namespaces=NS) for record in records]
if len(urls) != len(set(urls)):
    errors.append('Duplicate sitemap URLs')
actual_routes = {urlsplit(url).path for url in urls if url}
for missing in sorted(expected_routes - actual_routes):
    errors.append('Missing locale page in sitemap: ' + missing)
for extra in sorted(actual_routes - expected_routes):
    errors.append('Unexpected sitemap page: ' + extra)

pages = {}
for url in urls:
    if not url or not url.startswith(ORIGIN + '/'):
        errors.append('Unexpected sitemap origin: ' + str(url))
        continue
    parts = urlsplit(url)
    route = parts.path
    if parts.query or parts.fragment:
        errors.append('Sitemap URL has query or fragment: ' + url)
    locale, base = identify(route)
    file = ROOT / route.lstrip('/') / 'index.html'
    if not file.is_file():
        errors.append('Missing generated page: ' + route)
        continue
    html = file.read_text(encoding='utf-8')
    page = Page(html, route)
    pages[url] = page
    expected_alternates = {TAGS[lang]: ORIGIN + localized(lang, base) for lang in SELECTED}
    expected_alternates['x-default'] = ORIGIN + localized('en' if 'en' in SELECTED else 'ru', base)
    if args.preview and not page.noindex:
        errors.append(f'{route}: preview page is missing noindex')
    if page.canonical != [url]:
        errors.append(f'{route}: canonical mismatch')
    if page.alternates != expected_alternates:
        errors.append(f'{route}: incomplete or wrong same-page hreflang cluster')
    switch_links = [link for link in page.links if link['language_switch']]
    switch_targets = [(link['hreflang'], link['href']) for link in switch_links]
    if switch_targets != [(TAGS[lang], localized(lang, base)) for lang in SELECTED]:
        errors.append(f'{route}: language menu does not contain each selected same-topic version exactly once')
    if [link['href'] for link in switch_links if link['current'] == 'page'] != [route]:
        errors.append(f'{route}: language menu current-page marker is wrong')
    if page.lang != TAGS[locale]:
        errors.append(f'{route}: wrong HTML language {page.lang!r}')
    if page.direction != ('rtl' if locale == 'ar' else 'ltr'):
        errors.append(f'{route}: wrong text direction {page.direction!r}')
    if page.h1 != 1 or not page.title.strip() or not page.description.strip():
        errors.append(f'{route}: missing or duplicate H1/title/description')
    if not page.graphs:
        errors.append(f'{route}: missing JSON-LD')
    if '{{' in html or '}}' in html:
        # JSON-LD legitimately contains adjacent closing braces; check template names only.
        if re.search(r'\{\{\s*[A-Za-z][A-Za-z0-9_]*\s*\}\}', html):
            errors.append(f'{route}: unexpanded template placeholder')
    if base in help_routes:
        if page.iframes:
            errors.append(f'{route}: help page contains third-party iframe')
    elif base in baselines and page.iframes != baselines[base]:
        errors.append(f'{route}: original iframe destination changed')
    if re.search(r'[\u200b\u00ad\u2060\ufeff]', html):
        errors.append(f'{route}: unexpected invisible formatting character')
    for asset in page.assets:
        if asset and asset.startswith('/') and not asset.startswith('//'):
            local = ROOT / unquote(urlsplit(asset).path).lstrip('/')
            if not local.is_file():
                errors.append(f'{route}: missing asset {asset}')
    for graph in page.graphs:
        nodes = graph.get('@graph', [graph]) if isinstance(graph, dict) else graph
        for node in nodes:
            if not isinstance(node, dict):
                continue
            if node.get('@type') in ('WebSite', 'WebPage', 'CollectionPage', 'Article', 'TechArticle'):
                language = node.get('inLanguage', '')
                if not isinstance(language, str) or not (language == TAGS[locale] or language.startswith(TAGS[locale] + '-')):
                    errors.append(f'{route}: wrong JSON-LD inLanguage for {node.get("@type")}')
            if node.get('@type') == 'BreadcrumbList':
                for item in node.get('itemListElement', []):
                    target = item.get('item', '')
                    if isinstance(target, dict):
                        target = target.get('@id', '')
                    if isinstance(target, str) and target.startswith(ORIGIN + '/') and identify(urlsplit(target).path)[0] != locale:
                        errors.append(f'{route}: breadcrumb JSON-LD points to another locale')
    if locale != 'ru':
        # A flag for obvious incomplete translation, not a language-quality verdict.
        for label, text in [('title', page.title), ('description', page.description), ('H1', page.h1_text)]:
            cyrillic = len(re.findall(r'[А-Яа-яЁё]', text))
            if cyrillic > 12 and cyrillic > len(text) * .15:
                errors.append(f'{route}: substantial Russian text remains in {label}')
        visible = ' '.join(page.visible)
        cyrillic = len(re.findall(r'[А-Яа-яЁё]', visible))
        if cyrillic > 80 and cyrillic > len(visible) * .08:
            errors.append(f'{route}: substantial Russian body text remains outside language menu')
        for image in page.images:
            if len(re.findall(r'\b[А-Яа-яЁё]{2,}\b', image.get('alt', ''))) >= 2:
                errors.append(f'{route}: image alt appears untranslated: {image.get("src")}')

for url, page in pages.items():
    locale, base = identify(urlsplit(url).path)
    for language, target in page.alternates.items():
        other = pages.get(target)
        if other is None:
            errors.append(f'{page.route}: missing hreflang target {target}')
        elif other.alternates.get(page.lang) != url:
            errors.append(f'{page.route}: missing reciprocal hreflang from {target}')
        elif language != 'x-default' and other.lang != language:
            errors.append(f'{page.route}: target language disagrees with hreflang')
    for link in page.links:
        href = link['href']
        if not href or href.startswith(('mailto:', 'tel:', 'javascript:')):
            continue
        target_url = urljoin(url, href)
        target_parts = urlsplit(target_url)
        if target_parts.netloc != urlsplit(ORIGIN).netloc:
            continue
        target = pages.get(ORIGIN + target_parts.path)
        if target is None:
            if not (ROOT / unquote(target_parts.path).lstrip('/')).is_file():
                errors.append(f'{page.route}: broken internal link {href}')
            continue
        if target_parts.fragment and unquote(target_parts.fragment) not in target.ids:
            errors.append(f'{page.route}: broken anchor {href}')
        target_locale, target_base = identify(target_parts.path)
        if link['language_switch']:
            if target_base != base:
                errors.append(f'{page.route}: language switch changes the current topic')
        elif target_locale != locale:
            errors.append(f'{page.route}: ordinary navigation leaves current language: {href}')
        if (base.startswith('/model/') and target_base.startswith('/partner/')) or (base.startswith('/partner/') and target_base.startswith('/model/')):
            errors.append(f'{page.route}: model/partner section boundaries crossed by {href}')

for field in ('title', 'description'):
    values = {}
    for url, page in pages.items():
        locale = identify(urlsplit(url).path)[0]
        value = (locale, getattr(page, field))
        if value in values:
            errors.append(f'Duplicate {field} in {locale}: {url} and {values[value]}')
        values[value] = url

for record in records:
    url = record.findtext('s:loc', namespaces=NS)
    annotations_list = record.findall('x:link', NS)
    annotations = {a.attrib.get('hreflang'): a.attrib.get('href') for a in annotations_list}
    if len(annotations) != len(annotations_list):
        errors.append(f'{url}: duplicate sitemap hreflang')
    if url in pages and annotations != pages[url].alternates:
        errors.append(f'{url}: HTML/sitemap hreflang mismatch')

reachable, pending = set(), [ORIGIN + localized(SELECTED[0], '/')]
while pending:
    current = pending.pop()
    if current in reachable or current not in pages:
        continue
    reachable.add(current)
    for link in pages[current].links:
        target = urlsplit(urljoin(current, link['href']))
        if target.netloc == urlsplit(ORIGIN).netloc:
            pending.append(ORIGIN + target.path)
for orphan in sorted(set(pages) - reachable):
    errors.append('Page unreachable from homepage: ' + orphan)

for locale in SELECTED:
    manifest_route = localized(locale, '/site.webmanifest')
    manifest_file = ROOT / manifest_route.lstrip('/')
    if not manifest_file.is_file():
        errors.append('Missing localized manifest: ' + manifest_route)
    else:
        try:
            manifest = json.loads(manifest_file.read_text(encoding='utf-8'))
            if manifest.get('lang') != TAGS[locale] or manifest.get('start_url') != localized(locale, '/'):
                errors.append(f'{manifest_route}: wrong language or start URL')
            if not manifest.get('name') or not manifest.get('short_name'):
                errors.append(f'{manifest_route}: missing manifest name')
            if locale != 'ru' and len(re.findall(r'\b[А-Яа-яЁё]{2,}\b', manifest.get('name', ''))) >= 2:
                errors.append(f'{manifest_route}: untranslated manifest name')
            for icon in manifest.get('icons', []):
                icon_url = urlsplit(urljoin(ORIGIN + manifest_route, icon.get('src', '')))
                if icon_url.netloc == urlsplit(ORIGIN).netloc and not (ROOT / unquote(icon_url.path).lstrip('/')).is_file():
                    errors.append(f'{manifest_route}: missing icon {icon.get("src")}')
        except json.JSONDecodeError:
            errors.append('Invalid manifest JSON: ' + manifest_route)
    error_route = localized(locale, '/404.html')
    error_file = ROOT / error_route.lstrip('/')
    if not error_file.is_file():
        errors.append('Missing localized 404: ' + error_route)
        continue
    error_html = error_file.read_text(encoding='utf-8')
    error_page = Page(error_html, error_route, strict=False)
    if error_page.lang != TAGS[locale] or error_page.direction != ('rtl' if locale == 'ar' else 'ltr'):
        errors.append(f'{error_route}: wrong language or direction')
    if error_page.h1 != 1 or not error_page.title:
        errors.append(f'{error_route}: missing heading/title')
    if not re.search(r'<meta\s+[^>]*name=["\']robots["\'][^>]*content=["\'][^"\']*noindex', error_html, re.I):
        errors.append(f'{error_route}: 404 must be noindex')
    if ORIGIN + error_route in pages:
        errors.append(f'{error_route}: 404 must not be in sitemap')
    for link in error_page.links:
        target = urlsplit(urljoin(ORIGIN + error_route, link['href']))
        if target.netloc != urlsplit(ORIGIN).netloc:
            continue
        if not link['language_switch'] and identify(target.path)[0] != locale:
            errors.append(f'{error_route}: navigation leaves current locale')
        if ORIGIN + target.path not in pages and not (ROOT / target.path.lstrip('/')).is_file():
            errors.append(f'{error_route}: broken internal link {link["href"]}')

if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
help_count = sum(identify(urlsplit(url).path)[1] in help_routes for url in urls)
print(f'PASS: {len(urls)} pages ({len(urls)-help_count} main, {help_count} help), {len(SELECTED)} locales; route coverage, canonical, reciprocal hreflang, sitemap, localized navigation, JSON-LD, assets, localized manifests/404s and original iframe destinations.')
print('Translation checks cover structure and obvious residual source text; they do not replace linguistic review.')
