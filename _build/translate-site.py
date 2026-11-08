"""Build static translations of existing source text, preserving source markup.

Defaults to Chrome's on-device Translator API through a localhost bridge.
The optional earlier Google public endpoint adapter is retained for provenance
and reproducibility; it is never a fallback for a failed local translation.
No credentials, billing, proxy rotation or authentication bypass are used.
Draft translations require editorial review; provenance is stored outside UI.
Successful responses are cached. Source pages and nonlinguistic metadata stay intact.
"""
from __future__ import annotations
import argparse
import concurrent.futures
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import sys
import threading
import time
import unicodedata
from collections import Counter
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / '_src/pages'
OUT = ROOT / '_src/site-locales'
CACHE = ROOT / '_build/qa-output/translation-cache'
FIELDS = ('title','description','h1','nav','card','listTitle','ctaTitle','ctaText','streamTitle')
LANGS = ('en','es','pt','de','zh','hi','ar')
TAGS = re.compile(r'<!--[\s\S]*?-->|<[^>]+>')
CYRILLIC = re.compile(r'[А-Яа-яЁё]')
LOCK = threading.Lock()
LAST = 0.0
REQUESTS = 0
THROTTLED_UNTIL = 0.0
GLOSSARY_VERSION = 'ru-site-terms-v2'
RATE_FILE = CACHE / 'rate-state.json'
RATE_LOCK = CACHE / 'rate-state.lock'
REQUEST_INTERVAL = 1.5
PROVIDER = 'local'
BRIDGE_URL = 'http://127.0.0.1:4186/translate'
CURRENT_SOURCE_DIGEST = None
TEXT_REVIEW_CACHE = {}
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def normalize(s):
    return s.replace('\r\n','\n').replace('\r','\n')


def digest_sources(files):
    joined = ''.join(p.relative_to(SRC).as_posix()+'\0'+normalize(p.read_text(encoding='utf-8'))+'\0' for p in files)
    return hashlib.sha256(joined.encode('utf-8')).hexdigest()


def fingerprint(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def write_json(file,value,indent=2):
    file.parent.mkdir(parents=True,exist_ok=True)
    temporary=file.with_name(file.name+'.tmp')
    temporary.write_text(json.dumps(value,ensure_ascii=False,indent=indent)+'\n',encoding='utf-8')
    os.replace(temporary,file)


def rate_state(update=None):
    """An exclusive filesystem lock coordinates all locale worker processes."""
    CACHE.mkdir(parents=True,exist_ok=True)
    while True:
        try:
            fd=os.open(RATE_LOCK,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
            os.close(fd);break
        except FileExistsError:
            try:
                if time.time()-RATE_LOCK.stat().st_mtime>60:RATE_LOCK.unlink()
            except FileNotFoundError:pass
            time.sleep(.1)
    try:
        try: state=json.loads(RATE_FILE.read_text(encoding='utf-8'))
        except (FileNotFoundError,json.JSONDecodeError):state={}
        if update:
            update(state)
            RATE_FILE.write_text(json.dumps(state),encoding='utf-8')
        return state
    finally:
        RATE_LOCK.unlink(missing_ok=True)


def await_rate_slot():
    while True:
        outcome={}
        def reserve(state):
            now=time.time()
            available=max(state.get('nextRequestAt',0),state.get('throttledUntil',0))
            outcome['wait']=max(0,available-now)
            if outcome['wait']==0:state['nextRequestAt']=now+REQUEST_INTERVAL
        rate_state(reserve)
        if outcome['wait']==0:return
        time.sleep(min(5,outcome['wait']))


def backoff_all(delay):
    def update(state):
        state['throttledUntil']=max(state.get('throttledUntil',0),time.time()+delay)
    rate_state(update)


def signature(tag):
    if tag.startswith('<!--'): return 'comment'
    m = re.match(r'<\s*(/?)\s*([\w:-]+)',tag)
    return (m[1],m[2].lower(),tag.rstrip().endswith('/>')) if m else tag


def restore_tags(original, translated):
    before, after = TAGS.findall(original), TAGS.findall(translated)
    if [signature(t) for t in before] != [signature(t) for t in after]:
        raise ValueError('HTML tag sequence changed')
    it = iter(before)
    return TAGS.sub(lambda _:next(it),translated)


def request_translation(text, locale, protect_brands=False):
    global LAST, REQUESTS, THROTTLED_UNTIL
    key = fingerprint(('chrome-on-device-v1' if PROVIDER=='local' else 'google-gtx-v2')+('\0protected-brands' if protect_brands else '')+'\0'+locale+'\0'+text)
    file = CACHE / locale / (key+'.json')
    if file.exists():
        return json.loads(file.read_text(encoding='utf-8'))['translated']
    # Expand unambiguous site terminology and an idiom before translation. This
    # does not change source files or add claims: it disambiguates the same text.
    glossary = {'приват':'приватное шоу','привата':'приватного шоу','привату':'приватному шоу','приватом':'приватным шоу','привате':'приватном шоу','приваты':'приватные шоу','приватов':'приватных шоу','приватам':'приватным шоу','приватами':'приватными шоу','приватах':'приватных шоу','эфир':'прямая трансляция','эфира':'прямой трансляции','эфиру':'прямой трансляции','эфиром':'прямой трансляцией','эфире':'прямой трансляции','эфиры':'прямые трансляции','эфиров':'прямых трансляций','эфирам':'прямым трансляциям','эфирами':'прямыми трансляциями','эфирах':'прямых трансляциях'}
    def term(match):
        word=match[0]; replacement=glossary[word.lower()]
        return replacement[0].upper()+replacement[1:] if word[0].isupper() else replacement
    prepared=re.sub(r'\b(?:'+ '|'.join(glossary) +r')\b',term,text,flags=re.I)
    prepared=re.sub(r'по делу и без воды','кратко и по делу',prepared,flags=re.I)
    prepared=re.sub(r'без воды','кратко и по делу',prepared,flags=re.I)
    prepared=re.sub(r'\bИИ\b','искусственный интеллект',prepared)
    prepared=re.sub(r'\bчаевые\b','денежные чаевые',prepared,flags=re.I)
    prepared=re.sub(r'\bчаевых\b','денежных чаевых',prepared,flags=re.I)
    prepared=re.sub(r'\bчаевыми\b','денежными чаевыми',prepared,flags=re.I)
    adulthood={'совершеннолетний':'взрослый','совершеннолетняя':'взрослая','совершеннолетнее':'взрослое','совершеннолетние':'взрослые','совершеннолетнего':'взрослого','совершеннолетней':'взрослой','совершеннолетнему':'взрослому','совершеннолетних':'взрослых','совершеннолетним':'взрослым','совершеннолетнюю':'взрослую','совершеннолетнем':'взрослом','совершеннолетними':'взрослыми'}
    def adult_term(match):
        value=adulthood[match[0].lower()]
        return value.capitalize() if match[0][0].isupper() else value
    prepared=re.sub(r'\b(?:'+'|'.join(adulthood)+r')\b',adult_term,prepared,flags=re.I)
    prepared=re.sub(r'(?<!\d)(18|30)\+',lambda match:match[1]+' лет и старше',prepared)
    protected={}
    if protect_brands:
        for index,brand in enumerate(('Stripchat','Stripcash','OBS','Iriun','GitHub','Android','iPhone')):
            if re.search(re.escape(brand),prepared,re.I):
                marker=str(801000+index);protected[marker]=brand
                prepared=re.sub(re.escape(brand),f'[[{marker}]]',prepared,flags=re.I)
    if PROVIDER=='local':
        body=json.dumps({'language':locale,'text':prepared},ensure_ascii=False).encode('utf-8')
        request=urllib.request.Request(BRIDGE_URL,data=body,headers={'Content-Type':'application/json; charset=utf-8'})
    else:
        params = {'client':'gtx','sl':'ru','tl':'zh-CN' if locale=='zh' else locale,'dt':'t','q':prepared}
        body = urllib.parse.urlencode(params).encode('utf-8')
        request = urllib.request.Request('https://translate.googleapis.com/translate_a/single',data=body,
            headers={'User-Agent':'Mozilla/5.0','Content-Type':'application/x-www-form-urlencoded; charset=utf-8'})
    for attempt in range(7):
        if PROVIDER!='local':await_rate_slot()
        try:
            with urllib.request.urlopen(request,timeout=600 if PROVIDER=='local' else 40) as response:
                raw = json.loads(response.read().decode('utf-8'))
            translated=raw.get('translation') if PROVIDER=='local' else ''.join(part[0] for part in raw[0] if part and isinstance(part[0],str))
            if not isinstance(translated,str):raise ValueError('Bridge returned no translation string')
            if not translated.strip(): raise ValueError('Empty translation response')
            for marker,brand in protected.items():
                pattern=r'(?:\[\s*)*'+marker+r'(?:\s*\])*'
                translated,count=re.subn(pattern,brand,translated)
                if not count:raise ValueError('Protected brand marker missing: '+brand)
            file.parent.mkdir(parents=True,exist_ok=True)
            write_json(file,{'locale':locale,'sourceHash':fingerprint(text),'translated':translated},indent=None)
            with LOCK:
                REQUESTS += 1
                if REQUESTS % 25 == 0: print(f'Provider responses: {REQUESTS}',flush=True)
            return translated
        except urllib.error.HTTPError as error:
            if error.code not in (429,500,502,503,504): raise
            delay = min(300,60*(2**attempt)) if error.code==429 else min(60,5*(2**attempt))
            retry = error.headers.get('Retry-After')
            if retry and retry.isdigit(): delay = max(delay,min(int(retry),300))
            if PROVIDER=='local':time.sleep(min(30,delay))
            else:backoff_all(delay)
            print(f'Provider HTTP {error.code}; respecting backoff {delay}s (attempt {attempt+1})',flush=True)
        except (TimeoutError,ConnectionError,urllib.error.URLError,json.JSONDecodeError) as error:
            if attempt == 6: raise
            delay=min(30,2**attempt)
            print(f'Transient {type(error).__name__}; retry in {delay}s',flush=True)
            time.sleep(delay)
    raise RuntimeError('Translation provider remains unavailable after bounded retries')


class DivValues(HTMLParser):
    def __init__(self,markup):
        super().__init__(convert_charrefs=True)
        self.values={};self.active=None;self.parts=[]
        self.feed(markup)
    def handle_starttag(self,tag,attrs):
        if tag=='div' and 'data-k' in dict(attrs):
            self.active=dict(attrs)['data-k'];self.parts=[]
    def handle_data(self,data):
        if self.active is not None:self.parts.append(data)
    def handle_endtag(self,tag):
        if tag=='div' and self.active is not None:
            self.values[self.active]=''.join(self.parts).strip();self.active=None


def translation_sanity(source,translated,locale):
    """Catch lost sentences and numerals; this is not a linguistic quality score."""
    if not translated.strip():raise ValueError('Empty translated text unit')
    before=re.sub(r'\s+','',html.unescape(source))
    after=re.sub(r'\s+','',html.unescape(translated))
    floor={'zh':.18,'hi':.40,'ar':.35}.get(locale,.55)
    if len(before)>70 and len(after)<len(before)*floor:
        raise ValueError('Translated text is suspiciously short')
    def numbers(value):
        value=''.join(str(unicodedata.digit(c)) if c.isdigit() else c for c in value)
        return Counter(re.findall(r'\d+',value))
    missing=numbers(source)-numbers(translated)
    if missing:raise ValueError('Source numerals missing from translated text: '+','.join(missing))
    if any(translated.count(c)>source.count(c) for c in '[]'):
        raise ValueError('Unexpected boundary-marker brackets remain')
    for brand in ('Stripchat','Stripcash','OBS','Iriun','GitHub','Android','iPhone'):
        if re.search(re.escape(brand),source,re.I) and not re.search(re.escape(brand),translated,re.I):
            raise ValueError('Brand name changed: '+brand)
    if CYRILLIC.search(translated):raise ValueError('Russian text remains in translated unit')


def reviewed_text_map(locale):
    global CURRENT_SOURCE_DIGEST
    file=ROOT/('_build/translate-site-text-'+locale+'.json')
    if not file.exists():return {}
    stamp=(file.stat().st_mtime_ns,file.stat().st_size)
    if TEXT_REVIEW_CACHE.get(locale,{}).get('stamp')==stamp:return TEXT_REVIEW_CACHE[locale]['values']
    if CURRENT_SOURCE_DIGEST is None:
        CURRENT_SOURCE_DIGEST=digest_sources(sorted(SRC.rglob('*.html'),key=lambda p:p.relative_to(SRC).as_posix()))
    data=json.loads(file.read_text(encoding='utf-8'))
    if data.get('sourceDigest')!=CURRENT_SOURCE_DIGEST:raise ValueError('Reviewed text fragments are stale: '+file.name)
    values={}
    for entry in data.get('translations',[]):
        source=entry['source'].strip();target=entry['target'].strip()
        translation_sanity(source,target,locale)
        if source in values and values[source]!=target:raise ValueError('Conflicting reviewed source fragment')
        values[source]=target
    TEXT_REVIEW_CACHE[locale]={'stamp':stamp,'values':values}
    return values


def translate_local_values(values,locale):
    result=list(values)
    reviewed=reviewed_text_map(locale)
    for i,value in enumerate(values):
        if value.strip() in reviewed:result[i]=reviewed[value.strip()]
    selected=[i for i,v in enumerate(values) if CYRILLIC.search(v) and v.strip() not in reviewed]
    def batch(indices):
        if not indices:return
        if len(indices)==1:
            i=indices[0];result[i]=translate_plain(values[i],locale);return
        source='\n'.join(f'[[{900000+i}]] {values[i]}' for i in indices)
        try:
            translated=request_translation(source,locale)
            # Bracket counts sometimes normalize, but every unique numeric
            # boundary must survive once and in the original sequence.
            markers=list(re.finditer(r'(?:\[\s*){1,3}(9\d{5})(?:\s*\]){1,3}',translated))
            if [int(x[1])-900000 for x in markers]!=indices:raise ValueError('Text boundary markers changed')
            if translated[:markers[0].start()].strip():raise ValueError('Unexpected text before first marker')
            pieces=[]
            for j,(i,marker) in enumerate(zip(indices,markers)):
                end=markers[j+1].start() if j+1<len(markers) else len(translated)
                value=translated[marker.end():end].strip()
                translation_sanity(values[i],value,locale);pieces.append((i,value))
            for i,value in pieces:result[i]=value
        except ValueError:
            mid=len(indices)//2;batch(indices[:mid]);batch(indices[mid:])
    pending=[];size=0
    for i in selected:
        length=len(values[i])+13
        if pending and size+length>900:batch(pending);pending=[];size=0
        pending.append(i);size+=length
    batch(pending)
    return result


def translate_values(values,locale):
    """Use HTML wrappers to retain exact boundaries and translate values in batches."""
    if PROVIDER=='local':return translate_local_values(values,locale)
    result=[None]*len(values); units=[]; indices=[]; size=0
    def flush():
        nonlocal units,indices,size
        if not units:return
        def batch(batch_units,batch_indices):
            source='\n'.join(batch_units)
            try:
                if PROVIDER=='local' and len(source)>1200:raise ValueError('Local field needs text segmentation')
                translated=restore_tags(source,request_translation(source,locale))
                parsed=DivValues(translated).values
                if set(parsed)!=set(str(i) for i in batch_indices):raise ValueError('Translation field boundaries changed')
                for i in batch_indices:
                    if not parsed[str(i)]:raise ValueError('Empty translated field')
                    result[i]=parsed[str(i)]
            except ValueError:
                if len(batch_indices)>1:
                    mid=len(batch_indices)//2
                    batch(batch_units[:mid],batch_indices[:mid]);batch(batch_units[mid:],batch_indices[mid:])
                else:
                    i=batch_indices[0]
                    result[i]=translate_plain(values[i],locale)
        batch(units,indices)
        units=[];indices=[];size=0
    for i,value in enumerate(values):
        if not CYRILLIC.search(value):result[i]=value;continue
        unit=f'<div data-k="{i}">{html.escape(value,quote=False)}</div>'
        if units and size+len(unit)>(900 if PROVIDER=='local' else 3600):flush()
        units.append(unit);indices.append(i);size+=len(unit)+1
    flush()
    return result


def translate_plain(text,locale):
    """Bound local model input; original text boundaries remain with the caller."""
    reviewed=reviewed_text_map(locale)
    if text.strip() in reviewed:return reviewed[text.strip()]
    if not CYRILLIC.search(text):return text
    if PROVIDER!='local':return request_translation(text,locale).strip()
    if len(text)<=900:
        result=request_translation(text,locale).strip()
        try:
            translation_sanity(text,result,locale)
            return result
        except ValueError as error:
            if 'Brand name changed:' in str(error):
                try:
                    result=request_translation(text,locale,protect_brands=True).strip()
                    translation_sanity(text,result,locale)
                    return result
                except ValueError:
                    # A named brand is not linguistic text. If model markers
                    # also fail, splice these names literally into translated
                    # surrounding text, exactly as we preserve HTML anchors.
                    brands=('Stripchat','Stripcash','OBS','Iriun','GitHub','Android','iPhone')
                    pattern='('+'|'.join(map(re.escape,brands))+')'
                    parts=re.split(pattern,text,flags=re.I)
                    for i,part in enumerate(parts):
                        if not part:continue
                        if i%2:
                            parts[i]=next(b for b in brands if b.lower()==part.lower())
                        elif CYRILLIC.search(part):
                            parts[i]=re.match(r'^\s*',part)[0]+translate_plain(part.strip(),locale)+re.search(r'\s*$',part)[0]
                    result=''.join(parts)
                    translation_sanity(text,result,locale)
                    return result
            if len(text)<100:raise
    # Prefer a sentence boundary, falling back to an existing word boundary.
    maximum=850 if len(text)>900 else max(40,len(text)//2)
    cut=max((m.end() for m in re.finditer(r'[.!?;:]\s+',text[:maximum])),default=0)
    if cut<maximum//3:cut=text.rfind(' ',0,maximum)
    if cut<=0:cut=maximum
    return translate_plain(text[:cut],locale).rstrip()+' '+translate_plain(text[cut:],locale).lstrip()


def split_markup(body):
    """Split only at existing line boundaries; never cut a source tag or text node."""
    parts=[];current=''
    for line in body.splitlines(keepends=True):
        if len(line)>4400:raise ValueError('Source line too large for bounded translation')
        if current and len(current)+len(line)>(900 if PROVIDER=='local' else 3600):
            parts.append(current);current=''
        current+=line
    if current:parts.append(current)
    return parts


def translate_body(body,locale):
    if PROVIDER=='local':
        tokens=re.split(r'(<!--[\s\S]*?-->|<[^>]+>)',body)
        positions=[i for i,t in enumerate(tokens) if i%2==0 and CYRILLIC.search(t)]
        values=translate_values([html.unescape(tokens[i].strip()) for i in positions],locale)
        for i,value in zip(positions,values):
            original=tokens[i]
            tokens[i]=re.match(r'^\s*',original)[0]+html.escape(value,quote=False)+re.search(r'\s*$',original)[0]
        result=''.join(tokens)
        restore_tags(body,result)
        if result.count('{{cta}}')!=body.count('{{cta}}'):raise ValueError('CTA placeholder changed')
        return result
    chunks=[]
    for chunk in split_markup(body):
        if not CYRILLIC.search(TAGS.sub('',chunk)):
            chunks.append(chunk);continue
        try:
            if PROVIDER=='local' and len(chunk)>1200:raise ValueError('Local model chunk needs text segmentation')
            translated=restore_tags(chunk,request_translation(chunk,locale))
            if translated.count('{{cta}}')!=chunk.count('{{cta}}'):raise ValueError('CTA placeholder changed')
        except ValueError:
            # A provider may normalize broken-across-chunk HTML. Preserve each
            # source text boundary as a conservative fallback, never rewrite links.
            tokens=re.split(r'(<!--[\s\S]*?-->|<[^>]+>)',chunk)
            positions=[i for i,t in enumerate(tokens) if i%2==0 and CYRILLIC.search(t)]
            values=translate_values([html.unescape(tokens[i].strip()) for i in positions],locale)
            for i,value in zip(positions,values):
                original=tokens[i]
                tokens[i]=re.match(r'^\s*',original)[0]+html.escape(value,quote=False)+re.search(r'\s*$',original)[0]
            translated=''.join(tokens)
        # Preserve the whitespace between source lines and chunk boundaries.
        leading=re.match(r'^\s*',chunk)[0];trailing=re.search(r'\s*$',chunk)[0]
        chunks.append(leading+translated.strip()+trailing)
    result=''.join(chunks)
    restore_tags(body,result)
    if result.count('{{cta}}')!=body.count('{{cta}}'):raise ValueError('CTA placeholder changed in final body')
    return result


def source_page(file,images):
    raw=normalize(file.read_text(encoding='utf-8'))
    m=re.match(r'^\s*<!--([\s\S]*?)-->\s*([\s\S]*)$',raw)
    if not m:raise ValueError(f'Missing metadata: {file}')
    meta=json.loads(m[1]);parts=file.relative_to(SRC).with_suffix('').parts
    if parts[-1]=='index':parts=parts[:-1]
    url='/'+('/'.join(parts)+'/') if parts else '/'
    return {'url':url,'rel':file.relative_to(SRC).as_posix(),'meta':meta,'body':m[2].strip(),'imageAlt':images.get(url,{}).get('alt')}


def reviewed_metadata(page,locale):
    """Use already source-reviewed translations instead of requesting them again."""
    global CURRENT_SOURCE_DIGEST
    if CURRENT_SOURCE_DIGEST is None:
        CURRENT_SOURCE_DIGEST=digest_sources(sorted(SRC.rglob('*.html'),key=lambda p:p.relative_to(SRC).as_posix()))
    result={}
    file=ROOT/('_build/translate-site-meta-'+locale+'.json')
    if file.exists():
        data=json.loads(file.read_text(encoding='utf-8'))
        if data.get('sourceDigest')!=CURRENT_SOURCE_DIGEST:raise ValueError('Reviewed metadata is stale: '+file.name)
        for entry in data.get('metadataOverrides',[]):
            if entry['locale']==locale and entry['route']==page['url']:result.update(entry['fields'])
    if locale in ('pt','de'):
        file=ROOT/'_build/locale-review-pt-de.json'
        if file.exists():
            data=json.loads(file.read_text(encoding='utf-8'))
            if data.get('sourceDigest')!=CURRENT_SOURCE_DIGEST:raise ValueError('Reviewed metadata is stale: '+file.name)
            result.update(data.get(locale,{}).get(page['url'],{}))
    if 'faq' in result and len(result['faq'])!=len(page['meta'].get('faq',[])):
        raise ValueError('Reviewed FAQ count differs from source')
    return result


def translate_page(page,locale):
    labels=[];values=[]
    for field in FIELDS:
        if field in page['meta']:
            labels.append(('field',field));values.append(page['meta'][field])
    for i,entry in enumerate(page['meta'].get('faq',[])):
        for key in ('q','a'):labels.append(('faq',i,key));values.append(entry[key])
    if page['imageAlt'] is not None:labels.append(('imageAlt',));values.append(page['imageAlt'])
    # Search metadata and FAQ fields must not borrow neighboring field text.
    # Short independent calls are safer than boundary markers for these labels.
    reviewed=reviewed_metadata(page,locale)
    if PROVIDER=='local':
        translated=[]
        for label,value in zip(labels,values):
            ready=reviewed.get(label[1]) if label[0]=='field' else None
            if label[0]=='faq' and 'faq' in reviewed:ready=reviewed['faq'][label[1]].get(label[2])
            translated.append(ready if ready is not None else translate_plain(value,locale))
    else:translated=translate_values(values,locale)
    result={'meta':{'faq':[{} for _ in page['meta'].get('faq',[])]}}
    for key,value in zip(labels,translated):
        if key[0]=='field':result['meta'][key[1]]=value
        elif key[0]=='faq':result['meta']['faq'][key[1]][key[2]]=value
        else:result['imageAlt']=value
    result['body']=translate_body(page['body'],locale)
    return result


def validate_page(source,target):
    before,after=TAGS.findall(source['body']),TAGS.findall(target['body'])
    if before!=after:raise ValueError(f"{source['url']}: original markup changed")
    for field in FIELDS:
        if field in source['meta'] and not target['meta'].get(field):raise ValueError(f'Missing {field}')
    if len(source['meta'].get('faq',[]))!=len(target['meta']['faq']):raise ValueError('FAQ count mismatch')
    if source['imageAlt'] is not None and not target.get('imageAlt'):raise ValueError('Missing image alt')
    if target['body']==source['body'] and CYRILLIC.search(source['body']):raise ValueError('Untranslated body')
    return True


def apply_targeted_review(output):
    """Apply exact reviewed fidelity corrections, retaining the supplied HTML."""
    files=[ROOT/'_build/translate-site-review.json',ROOT/'_build/translate-site-reviewed-en-es.json',ROOT/'_build/translate-site-reviewed-zh-hi-ar.json']
    files.extend(ROOT/('_build/translate-site-reviewed-'+language+'-age.json') for language in LANGS)
    files.extend(ROOT/('_build/translate-site-meta-'+language+'.json') for language in LANGS)
    if not files[0].exists():files[0]=ROOT/'_build/qa-output/site-translation-review.json'
    review={'globalEdits':[],'edits':[],'preEdits':[],'metadataOverrides':[]}
    for file in files:
        if file.exists():
            data=json.loads(file.read_text(encoding='utf-8'))
            if data.get('sourceDigest') and data['sourceDigest']!=output['sourceDigest']:
                raise ValueError('Review file is stale: '+str(file))
            for key in review:
                destination='preEdits' if file.name.endswith('-age.json') and key=='edits' else key
                review[destination].extend(data.get(key,[]))
    locale=output['locale'];changes=0
    def replace_reviewed(text,old,new):
        """Do not re-edit an already corrected occurrence of the replacement."""
        nonlocal changes
        if not old or old==new:return text
        parts=text.split(new) if new else [text]
        changes+=sum(part.count(old) for part in parts)
        return new.join(part.replace(old,new) for part in parts)
    def replace_strings(value,old,new):
        nonlocal changes
        if isinstance(value,str):
            return replace_reviewed(value,old,new)
        if isinstance(value,list):return [replace_strings(v,old,new) for v in value]
        if isinstance(value,dict):return {k:replace_strings(v,old,new) for k,v in value.items()}
        return value
    def exact_edits(edits):
        nonlocal changes
        for edit in edits:
            if edit['locale']!=locale or edit['route'] not in output['pages']:continue
            obj=output['pages'][edit['route']];keys=edit['path'].split('.')
            for key in keys[:-1]:obj=obj[int(key)] if isinstance(obj,list) else obj[key]
            key=int(keys[-1]) if isinstance(obj,list) else keys[-1]
            if edit['from'] in obj[key]:
                obj[key]=replace_reviewed(obj[key],edit['from'],edit['to'])
    exact_edits(review['preEdits'])
    for edit in review.get('globalEdits',[]):
        if edit['locale']==locale:
            output['pages']=replace_strings(output['pages'],edit['from'],edit['to'])
    exact_edits(review['edits'])
    fragments=reviewed_text_map(locale)
    if fragments:
        images=json.loads((ROOT/'_src/images.json').read_text(encoding='utf-8'))
        sources={p['url']:p for f in SRC.rglob('*.html') for p in [source_page(f,images)]}
        for route,page in output['pages'].items():
            source=sources[route]
            for field in FIELDS:
                if field in source['meta'] and source['meta'][field].strip() in fragments:
                    value=fragments[source['meta'][field].strip()]
                    if page['meta'][field]!=value:page['meta'][field]=value;changes+=1
            for i,item in enumerate(source['meta'].get('faq',[])):
                for key in ('q','a'):
                    value=fragments.get(item[key].strip())
                    if value is not None and page['meta']['faq'][i][key]!=value:page['meta']['faq'][i][key]=value;changes+=1
            if source.get('imageAlt') is not None and source['imageAlt'].strip() in fragments:
                value=fragments[source['imageAlt'].strip()]
                if page['imageAlt']!=value:page['imageAlt']=value;changes+=1
            old_tokens=re.split(r'(<!--[\s\S]*?-->|<[^>]+>)',source['body'])
            tokens=re.split(r'(<!--[\s\S]*?-->|<[^>]+>)',page['body'])
            if len(old_tokens)!=len(tokens):raise ValueError('Manual fragment text-node mismatch')
            for i in range(0,len(tokens),2):
                if old_tokens[i].strip() in fragments:
                    value=re.match(r'^\s*',tokens[i])[0]+html.escape(fragments[old_tokens[i].strip()],quote=False)+re.search(r'\s*$',tokens[i])[0]
                    if tokens[i]!=value:tokens[i]=value;changes+=1
            page['body']=''.join(tokens)
        output['translation']['manualTextOverrides']={'file':'_build/translate-site-text-'+locale+'.json','sourceFragments':len(fragments),'method':'AI-assisted source-compared literal fragment translations'}
    for entry in review.get('metadataOverrides',[]):
        if entry['locale']!=locale or entry['route'] not in output['pages']:continue
        meta=output['pages'][entry['route']]['meta']
        for key,value in entry['fields'].items():
            if key not in meta:raise ValueError('Review adds unknown metadata field '+key)
            if meta[key]!=value:meta[key]=value;changes+=1
    if locale=='es':
        # The Russian site explicitly concerns adults. Preserve that meaning:
        # adult women/men must never become Spanish words for children. Apply
        # only to aligned source units naming adult women/men, and never to
        # units that explicitly discuss minors or prohibited child content.
        images=json.loads((ROOT/'_src/images.json').read_text(encoding='utf-8'))
        sources={p['url']:p for f in SRC.rglob('*.html') for p in [source_page(f,images)]}
        def source_word_replace(text,old,new):
            nonlocal changes
            def replace(match):
                nonlocal changes
                changes+=1
                return new[0].upper()+new[1:] if match[0][0].isupper() else new
            return re.sub(r'\b'+re.escape(old)+r'\b',replace,text,flags=re.I)
        def source_correction(source,target):
            if '[' not in source and ']' not in source:
                target=replace_reviewed(replace_reviewed(target,'[',''),']','')
            explicit_minor=re.search(r'несовершеннолет|реб[её]н|детей|детск|младше|до 18',source,re.I)
            if not explicit_minor:
                pairs=[]
                if re.search(r'девуш|девич',source,re.I):pairs.extend([('niñas','mujeres'),('niña','mujer'),('Niñas','Mujeres'),('Niña','Mujer')])
                if re.search(r'парн|мужчин',source,re.I):pairs.extend([('niños','hombres'),('niño','hombre'),('Niños','Hombres'),('Niño','Hombre')])
                for old,new in pairs:target=source_word_replace(target,old,new)
            if re.search(r'чаев',source,re.I) and not re.search(r'совет',source,re.I):
                for old,new in [('consejos en efectivo','propinas'),('consejo en efectivo','propina'),('consejos','propinas'),('consejo','propina')]:target=source_word_replace(target,old,new)
            if re.search(r'трансляц',source,re.I) and not re.search(r'перевод',source,re.I):
                target=replace_reviewed(target,'traducciones en vivo','transmisiones en vivo')
            if re.search(r'возраст[а-я]*\s+и\s+личност',source,re.I):
                target=source_word_replace(target,'personalidad','identidad')
            if re.search(r'\bприват',source,re.I):
                for old,new in [('programas privados','shows privados'),('programa privado','show privado')]:target=source_word_replace(target,old,new)
            return target
        for route,page in output['pages'].items():
            source=sources[route]
            for field in FIELDS:
                if field in source['meta']:page['meta'][field]=source_correction(source['meta'][field],page['meta'][field])
            for i,item in enumerate(source['meta'].get('faq',[])):
                for key in ('q','a'):page['meta']['faq'][i][key]=source_correction(item[key],page['meta']['faq'][i][key])
            if source.get('imageAlt') is not None:page['imageAlt']=source_correction(source['imageAlt'],page['imageAlt'])
            old_tokens=re.split(r'(<!--[\s\S]*?-->|<[^>]+>)',source['body'])
            tokens=re.split(r'(<!--[\s\S]*?-->|<[^>]+>)',page['body'])
            if len(old_tokens)!=len(tokens):raise ValueError('Source-bound review text-node mismatch')
            for i in range(0,len(tokens),2):tokens[i]=source_correction(old_tokens[i],tokens[i])
            page['body']=''.join(tokens)
    if changes:
        output['translation']['editorialReview']='Targeted source-comparison corrections applied; independent native-speaker review not performed.'
        output['translation']['editorialCorrections']=output['translation'].get('editorialCorrections',0)+changes
    return changes


def main():
    global PROVIDER,BRIDGE_URL,CURRENT_SOURCE_DIGEST
    parser=argparse.ArgumentParser()
    parser.add_argument('--locales',nargs='+',default=list(LANGS),choices=LANGS)
    parser.add_argument('--workers',type=int,default=2)
    parser.add_argument('--limit',type=int,default=0)
    parser.add_argument('--validate-only',action='store_true')
    parser.add_argument('--provider',choices=('local','google'),default='local')
    parser.add_argument('--bridge-url',default=BRIDGE_URL)
    args=parser.parse_args()
    PROVIDER=args.provider;BRIDGE_URL=args.bridge_url
    if PROVIDER=='local' and urllib.parse.urlsplit(BRIDGE_URL).hostname not in ('127.0.0.1','localhost','::1'):
        raise ValueError('The on-device translator bridge must be on localhost')
    files=sorted(SRC.rglob('*.html'),key=lambda p:p.relative_to(SRC).as_posix())
    digest=digest_sources(files)
    CURRENT_SOURCE_DIGEST=digest
    image_path=ROOT/'_src/images.json'
    images=json.loads(image_path.read_text(encoding='utf-8'))
    sources=[source_page(p,images) for p in files]
    # Homepage first to permit early editorial sampling.
    sources.sort(key=lambda p:(p['url']!='/',p['url']))
    if args.limit:sources=sources[:args.limit]
    OUT.mkdir(parents=True,exist_ok=True)
    results={};failed_results={};mutex=threading.Lock()
    def run_locale(locale):
        failures=[]
        target=OUT/(locale+('.partial' if args.limit else '')+'.json')
        partial=OUT/(locale+'.partial.json')
        output={'locale':locale,'sourceDigest':digest,'sourceImagesDigest':fingerprint(normalize(image_path.read_text(encoding='utf-8'))),
            'translation':{'method':'machine translation with terminology preparation and structural validation','provider':'Chrome on-device Translator API' if PROVIDER=='local' else 'Google Translate public text endpoint (unofficial API)','sourceLanguage':'ru','glossaryVersion':GLOSSARY_VERSION,'reviewDate':'2026-11-08','editorialReview':'pending'},'pages':{}}
        saved=target if target.exists() else partial
        if saved.exists():
            previous=json.loads(saved.read_text(encoding='utf-8'))
            if previous.get('sourceDigest')==digest and previous.get('sourceImagesDigest')==output['sourceImagesDigest']:
                output['pages']=previous['pages']
                prior=previous.get('translation',{})
                if args.validate_only or len(previous['pages'])==len(sources):
                    output['translation']=prior
                elif prior.get('provider')==output['translation']['provider']:
                    output['translation']={**prior,**{k:v for k,v in output['translation'].items() if k not in prior}}
                else:
                    output['translation']['reusedEarlierDraft']={'provider':prior.get('provider'),'pages':list(previous['pages']),'provenance':prior}
                    if prior.get('editorialReview'):output['translation']['editorialReview']=prior['editorialReview']
                    if prior.get('editorialCorrections'):output['translation']['editorialCorrections']=prior['editorialCorrections']
                if prior.get('glossaryVersion')!=GLOSSARY_VERSION:
                    output['translation']['earlierDraftPagesForReview']=list(previous['pages'])
        for index,page in enumerate(sources):
            if page['url'] in output['pages']:
                try:validate_page(page,output['pages'][page['url']])
                except ValueError:
                    if args.validate_only:raise
                    del output['pages'][page['url']]
                    print(f"Regenerating structurally invalid translation {locale}{page['url']}",flush=True)
            if page['url'] not in output['pages']:
                if args.validate_only:raise ValueError(f"Missing translation {locale}{page['url']}")
                try:output['pages'][page['url']]=translate_page(page,locale)
                except ValueError as error:
                    failures.append({'route':page['url'],'error':str(error)})
                    print(f"DATA REVIEW REQUIRED {locale}{page['url']}: {error}",flush=True)
                    continue
                validate_page(page,output['pages'][page['url']])
                write_json(partial,output)
            validate_page(page,output['pages'][page['url']])
            if (index+1)%5==0 or index==0:print(f'{locale}: {index+1}/{len(sources)} pages validated',flush=True)
        if args.validate_only:
            with mutex:results[locale]=len(output['pages'])
            print(f'{locale}: validated {len(sources)} existing pages without rewriting output',flush=True)
            return
        if failures:
            corrections=apply_targeted_review(output)
            write_json(partial,output)
            write_json(ROOT/'_build/qa-output/translation-failures'/(locale+'.json'),{'locale':locale,'sourceDigest':digest,'failedPages':failures})
            with mutex:failed_results[locale]=failures
            print(f'{locale}: incomplete, {len(output["pages"])} pages saved, {len(failures)} pages require review',flush=True)
            return
        corrections=apply_targeted_review(output)
        for page in sources:validate_page(page,output['pages'][page['url']])
        write_json(target,output)
        if not args.limit and partial.exists():partial.unlink()
        with mutex:results[locale]=len(output['pages'])
        print(f'{locale}: COMPLETE {len(sources)} pages, {corrections} reviewed corrections -> {target.relative_to(ROOT)}',flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1,min(args.workers,3))) as pool:
        pending={pool.submit(run_locale,locale):locale for locale in args.locales}
        for future in concurrent.futures.as_completed(pending):
            try:future.result()
            except Exception as error:
                print(f'FAILED {pending[future]}: {type(error).__name__}: {error}',flush=True)
                for task in pending:task.cancel()
                raise
    if digest_sources(files)!=digest:raise ValueError('Sources changed during translation; rerun against latest source')
    if failed_results:raise ValueError('Incomplete locale pages: '+json.dumps(failed_results,ensure_ascii=False))
    print(json.dumps({'complete':results,'sourceDigest':digest},ensure_ascii=False),flush=True)


if __name__=='__main__':main()
