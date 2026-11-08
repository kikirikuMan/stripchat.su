"""Export source-aligned age, adulthood and negation review queues."""
import importlib.util
import json
import re
from pathlib import Path

spec=importlib.util.spec_from_file_location('pipeline',Path(__file__).with_name('translate-site.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
images=json.loads((m.ROOT/'_src/images.json').read_text(encoding='utf-8'))
sources={p['url']:p for f in m.SRC.rglob('*.html') for p in [m.source_page(f,images)]}
age=re.compile(r'совершеннолет|несовершеннолет|взросл|(?<!\d)18(?!\d)|возраст|старше|младше',re.I)
minor={
'en':re.compile(r'\b(?:minors?|underage|children|child)\b',re.I),
'es':re.compile(r'menor(?:es)? de (?:edad|18)|\bniñ[oa]s?\b',re.I),
'pt':re.compile(r'menor(?:es)? de (?:idade|18)|\bcrianças?\b',re.I),
'de':re.compile(r'Minderjähr|\bKinder?\b',re.I),
'zh':re.compile(r'未成年|儿童|孩子'),
'hi':re.compile(r'नाबालिग|बच्च'),
'ar':re.compile(r'قاصر|[أا]طفال|طفل')}
outdir=m.ROOT/'_build/qa-output/site-age-review'
for locale in m.LANGS:
    path=m.OUT/(locale+'.json')
    if not path.exists():path=m.OUT/(locale+'.partial.json')
    if not path.exists():continue
    data=json.loads(path.read_text(encoding='utf-8'));entries=[]
    def add(route,path,source,target):
        if age.search(source) or minor[locale].search(target):
            entries.append({'route':route,'path':path,'source':source,'translation':target,'targetMentionsMinors':bool(minor[locale].search(target))})
    for route,target in data['pages'].items():
        source=sources[route]
        for field in m.FIELDS:
            if field in source['meta']:add(route,'meta.'+field,source['meta'][field],target['meta'][field])
        for i,(before,after) in enumerate(zip(source['meta'].get('faq',[]),target['meta'].get('faq',[]))):
            for key in ('q','a'):add(route,f'meta.faq.{i}.{key}',before[key],after[key])
        if source.get('imageAlt') is not None:add(route,'imageAlt',source['imageAlt'],target['imageAlt'])
        before=m.TAGS.split(source['body']);after=m.TAGS.split(target['body'])
        assert len(before)==len(after),(locale,route,'text boundary mismatch')
        for i,(old,new) in enumerate(zip(before,after)):
            if old.strip():add(route,f'body.textNode.{i}',old.strip(),new.strip())
    m.write_json(outdir/(locale+'.json'),{'locale':locale,'sourceDigest':data['sourceDigest'],'translatedPages':len(data['pages']),'reviewed':False,'items':entries})
    print(locale,len(data['pages']),'pages',len(entries),'critical-age units')
