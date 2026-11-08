"""Report translation fidelity signals for editorial review, without network I/O."""
import collections
import html
import importlib.util
import json
from pathlib import Path
import re
import unicodedata

ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('translate_site',ROOT/'_build/translate-site.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
files=sorted(module.SRC.rglob('*.html'),key=lambda p:p.relative_to(module.SRC).as_posix())
images=json.loads((ROOT/'_src/images.json').read_text(encoding='utf8'))
sources={p['url']:p for p in (module.source_page(file,images) for file in files)}

def strings(value):
    if isinstance(value,str):return [value]
    if isinstance(value,list):return [s for v in value for s in strings(v)]
    if isinstance(value,dict):return [s for v in value.values() for s in strings(v)]
    return []

def visible(s):return html.unescape(module.TAGS.sub(' ',s))
def numbers(s):
    s=visible(s)
    s=''.join(str(unicodedata.digit(c)) if c.isdigit() else c for c in s)
    return collections.Counter(re.findall(r'\d+',s))

report={}
for locale in module.LANGS:
    file=module.OUT/(locale+'.json')
    if not file.exists():file=module.OUT/(locale+'.partial.json')
    if not file.exists():continue
    data=json.loads(file.read_text(encoding='utf8'))
    item={'pages':len(data['pages']),'complete':len(data['pages'])==len(sources),'sourceDigestMatches':data['sourceDigest']==module.digest_sources(files),'structuralErrors':[],'numberDifferences':[],'cyrillicResidue':[],'untranslatedFields':[],'englishTerminology':[]}
    for route,page in data['pages'].items():
        source=sources[route]
        try:module.validate_page(source,page)
        except Exception as e:item['structuralErrors'].append({'route':route,'error':str(e)})
        values={'body':page['body'],**page['meta']}
        for name,value in values.items():
            content=' '.join(strings(value));original=source['body'] if name=='body' else source['meta'].get(name,'')
            original=' '.join(strings(original))
            if numbers(original)!=numbers(content):item['numberDifferences'].append({'route':route,'field':name,'source':dict(numbers(original)),'target':dict(numbers(content))})
            residues=re.findall(r'[^.!?\n<>]{0,70}[А-Яа-яЁё][^.!?\n<>]{0,70}',visible(content))
            if residues:item['cyrillicResidue'].append({'route':route,'field':name,'samples':residues[:5]})
            if module.CYRILLIC.search(original) and original==content:item['untranslatedFields'].append({'route':route,'field':name})
            if locale=='en':
                for phrase in ('without water','privates','call her privately','airwaves','menu type','type menu'):
                    if phrase in content:item['englishTerminology'].append({'route':route,'field':name,'phrase':phrase})
    report[locale]=item
    print(locale, 'pages',item['pages'],'structural',len(item['structuralErrors']),'numbers',len(item['numberDifferences']),'Cyrillic',len(item['cyrillicResidue']),'untranslated',len(item['untranslatedFields']),'terminology',len(item['englishTerminology']))
output=ROOT/'_build/qa-output/site-translation-audit.json'
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
