"""Apply source-context linguistic corrections to Portuguese and German drafts.

Run only when the corresponding translation writer has stopped. Metadata review
is stored separately for reproducibility; markup, destinations and source pages
are never changed. This is targeted review, not native-speaker certification.
"""
import argparse
import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('translation_pipeline', ROOT / '_build/translate-site.py')
pipeline = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pipeline)
REVIEW = ROOT / '_build/locale-review-pt-de.json'
TAGS = r'(<!--[\s\S]*?-->|<[^>]+>)'


def substitute(text, pattern, replacement):
    def replace(match):
        value = replacement(match) if callable(replacement) else replacement
        if match[0][0].isupper() and value:
            value = value[0].upper() + value[1:]
        return value
    return re.sub(pattern, replace, text, flags=re.I)


def fix_text(original, translated, locale):
    # Brand names are names, not lowercased common nouns or camel-case variants.
    translated = re.sub(r'\bstripchat\b', 'Stripchat', translated, flags=re.I)
    translated = re.sub(r'\bstripcash\b', 'Stripcash', translated, flags=re.I)
    tips = re.search(r'чаев', original, re.I) and not re.search(r'совет|подсказ', original, re.I)
    streams = re.search(r'эфир|трансляц', original, re.I) and not re.search(r'перевод', original, re.I)
    if locale == 'pt':
        if re.search(r'девуш', original, re.I) and not re.search(r'несовершеннолет', original, re.I):
            translated = substitute(translated, r'\bmeninas\b', 'mulheres')
            translated = substitute(translated, r'\bmenina\b', 'mulher')
        if tips:
            translated = substitute(translated, r'\bdicas\b', 'gorjetas')
            translated = substitute(translated, r'\bdica\b', 'gorjeta')
            translated = substitute(translated, r'\bgorjetas de dinheiro\b', 'gorjetas')
            translated = substitute(translated, r'\bgorjeta de dinheiro\b', 'gorjeta')
        if re.search(r'тип[ -]?меню|меню чаев', original, re.I):
            translated = substitute(translated, r'\b(?:tipos? de menu|menu de tipos?|tipo-menu|menu de digitação)\b', 'menu de gorjetas')
        if streams:
            translated = substitute(translated, r'\btraduções ao vivo\b', 'transmissões ao vivo')
            translated = substitute(translated, r'\btradução ao vivo\b', 'transmissão ao vivo')
            translated = substitute(translated, r'\béteres\b', 'transmissões')
            translated = substitute(translated, r'\béter\b', 'transmissão')
        if re.search(r'зрител', original, re.I):
            translated = substitute(translated, r'\bvisualizadores\b', 'espectadores')
            translated = substitute(translated, r'\bvisualizador\b', 'espectador')
        if re.search(r'пиш|писа', original, re.I):
            translated = substitute(translated, r'\bgrava no chat\b', 'escreve no chat')
        if re.search(r'почт', original, re.I) and not re.search(r'переписк', original, re.I):
            translated = substitute(translated, r'\bcorrespondência\b', 'e-mail')
        if re.search(r'гоал', original, re.I):
            translated = substitute(translated, r'\b(?:goals|gols)\b', 'metas')
            translated = substitute(translated, r'\b(?:goal|gol)\b', 'meta')
        if re.search(r'лент', original, re.I):
            translated = substitute(translated, r'\bfitas\b', 'listas')
            translated = substitute(translated, r'\bfita\b', 'lista')
        if re.search(r'отдач', original, re.I):
            translated = substitute(translated, r'\bvelocidade de recuo\b', 'velocidade de upload')
            translated = substitute(translated, r'\brecuo\b', 'upload')
        if re.search(r'\bИИ\b', original):
            translated = re.sub(r'\bAI\b', 'IA', translated)
    elif locale == 'de':
        if re.search(r'\bтранс(?!ляц)', original, re.I):
            translated = translated.replace('Trance-Modelle', 'Trans-Models')
        if re.search(r'девуш', original, re.I) and not re.search(r'несовершеннолет', original, re.I):
            # Mädchen is identical in singular/plural; preserve grammatical number.
            translated = re.sub(r'\berwachsene Mädchen\b', 'erwachsene Frauen', translated)
            translated = re.sub(r'\bzwei Mädchen\b', 'zwei Frauen', translated)
            for old, new in [('ein Frauen', 'eine Frau'), ('einem Frauen', 'einer Frau'), ('eines der Frauen', 'eine der Frauen')]:
                translated = translated.replace(old, new)
        if tips:
            translated = re.sub(r'\b(?:Cash-|Geld-)Trinkgelder\b', 'Trinkgelder', translated, flags=re.I)
            translated = re.sub(r'\bBargeldtipps\b', 'Trinkgelder', translated, flags=re.I)
            translated = re.sub(r'\bKassentipp\b', 'Trinkgeld', translated, flags=re.I)
            translated = re.sub(r'\b(?:Cash[- ](?:Tipps|Tips)|Geld-Tipps)\b', 'Trinkgelder', translated, flags=re.I)
            translated = re.sub(r'\bCash[- ]Tip\b', 'Trinkgeld', translated, flags=re.I)
            translated = re.sub(r'\bGeld-Tipp\b', 'Trinkgeld', translated, flags=re.I)
            translated = translated.replace('Trinkgelder zum Geld', 'Trinkgelder')
            translated = substitute(translated, r'\bTipps\b', 'Trinkgelder')
            translated = substitute(translated, r'\bTipp\b', 'Trinkgeld')
        if re.search(r'тип[ -]?меню|меню чаев', original, re.I):
            translated = re.sub(r'\bTipp[- ]?Menü\b', 'Trinkgeldmenü', translated, flags=re.I)
            translated = re.sub(r'\b(?:Typen?[- ]?Menü|Menütyp)\b', 'Trinkgeldmenü', translated, flags=re.I)
        if streams:
            translated = re.sub(r'\bLive[- ]?Übersetzungen\b', 'Livestreams', translated, flags=re.I)
            translated = re.sub(r'\bLive[- ]?Übersetzung\b', 'Livestream', translated, flags=re.I)
            translated = re.sub(r'\bÄther\b', 'Stream', translated, flags=re.I)
        if re.search(r'отдач', original, re.I):
            translated = re.sub(r'\bRückstoßgeschwindigkeit\b', 'Upload-Geschwindigkeit', translated)
            translated = re.sub(r'\bRückstoß\b', 'Upload', translated)
        if re.search(r'\bИИ\b', original):
            translated = re.sub(r'\bAI\b', 'KI', translated)
    return translated


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--locales', nargs='+', choices=('pt', 'de'), default=['pt', 'de'])
    parser.add_argument('--partial', action='store_true')
    args = parser.parse_args()
    images = json.loads((ROOT / '_src/images.json').read_text(encoding='utf-8'))
    sources = {}
    for file in pipeline.SRC.rglob('*.html'):
        source = pipeline.source_page(file, images)
        sources[source['url']] = source
    review = json.loads(REVIEW.read_text(encoding='utf-8'))
    results = []
    for locale in args.locales:
        file = pipeline.OUT / (locale + ('.partial' if args.partial else '') + '.json')
        output = json.loads(file.read_text(encoding='utf-8'))
        if review.get('sourceDigest') != output['sourceDigest']:
            raise ValueError('Portuguese/German linguistic review is stale; compare the updated Russian source first')
        changed = 0
        metadata_routes = []
        for route, page in output['pages'].items():
            source = sources[route]
            old = json.dumps(page, ensure_ascii=False)
            source_parts = re.split(TAGS, source['body'])
            parts = re.split(TAGS, page['body'])
            assert len(source_parts) == len(parts), route
            for index in range(0, len(parts), 2):
                parts[index] = fix_text(source_parts[index], parts[index], locale)
                for correction in review.get('bodyNodeOverrides', {}).get(locale, {}).get(route, []):
                    if source_parts[index].strip() == correction['source']:
                        # Anchor spacing to immutable source, so a reviewed target
                        # that needs leading space after a link stays idempotent.
                        leading = re.match(r'^\s*', source_parts[index])[0]
                        trailing = re.search(r'\s*$', source_parts[index])[0]
                        parts[index] = leading + correction['target'] + trailing
            page['body'] = ''.join(parts)
            for key in pipeline.FIELDS:
                if key in page['meta']:
                    page['meta'][key] = fix_text(source['meta'].get(key, ''), page['meta'][key], locale)
            for i, faq in enumerate(page['meta'].get('faq', [])):
                for key in ('q', 'a'):
                    faq[key] = fix_text(source['meta']['faq'][i][key], faq[key], locale)
            if page.get('imageAlt'):
                page['imageAlt'] = fix_text(source.get('imageAlt') or '', page['imageAlt'], locale)
            if route in review.get(locale, {}):
                page['meta'].update(review[locale][route])
                metadata_routes.append(route)
            for index, values in review.get('faqOverrides', {}).get(locale, {}).get(route, {}).items():
                page['meta']['faq'][int(index)].update(values)
            pipeline.validate_page(source, page)
            if old != json.dumps(page, ensure_ascii=False):
                changed += 1
        output['translation']['editorialReview'] = 'Source-context terminology corrections and selected metadata/full-page review; independent native-speaker review not performed.'
        output['translation']['reviewedMetadataRoutes'] = metadata_routes
        output['translation']['contextualReviewDate'] = review['reviewDate']
        pipeline.write_json(file, output)
        results.append({'locale': locale, 'pages': len(output['pages']), 'changedPages': changed, 'reviewedMetadataPages': len(metadata_routes)})
    print(json.dumps(results, ensure_ascii=False))


if __name__ == '__main__':
    main()
