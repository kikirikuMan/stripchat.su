"""Source-faithful, manually reviewed Spanish core pages; writes an override file."""
import importlib.util
import html
import json
import re
from pathlib import Path

spec=importlib.util.spec_from_file_location('pipeline',Path(__file__).with_name('translate-site.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

PAGES={
'index.html': {
'meta': {
'title':'Stripchat: transmisiones por webcam gratis · 18+',
'description':'Stripchat online: transmisiones por webcam en vivo y chat erótico con chicas 24/7. Mira gratis y sin registrarte, desde tu computadora o teléfono. 18+',
'h1':'Stripchat: chat por webcam gratis con chicas en línea','nav':'Inicio',
'faq':[
{'q':'¿Puedo ver Stripchat gratis?','a':'Sí. Las transmisiones públicas son gratuitas y no requieren registro. Solo se pagan con tokens los shows privados y las propinas para las modelos.'},
{'q':'¿Es necesario registrarse?','a':'Para mirar, no. Una cuenta te servirá si quieres escribir en el chat, añadir modelos a tus favoritos y comprar tokens.'},
{'q':'¿El sitio funciona en el teléfono?','a':'Sí. Las transmisiones se abren en cualquier navegador móvil moderno de Android y iPhone, sin necesidad de instalar una aplicación.'},
{'q':'¿Es este el sitio oficial de Stripchat?','a':'No. Stripchat.su es un sitio afiliado independiente. Las transmisiones se integran a través del programa de afiliados y pertenecen a sus titulares de derechos.'},
{'q':'¿A partir de qué edad se puede utilizar el sitio?','a':'Solo a partir de los 18 años. El sitio contiene material para adultos y el acceso de menores está prohibido.'}
]},
'texts':[
'Stripchat online: transmisiones en vivo 24/7',
'Stripchat es uno de los mayores servicios de webcam del mundo. Miles de transmisiones en vivo se emiten a cualquier hora y puedes verlas directamente en esta página, gratis, sin registrarte y sin instalar aplicaciones.',
'Encuentra una modelo que te guste, conversa con ella en el chat en tiempo real y, si quieres algo más, invítala a un show privado. Todo funciona con la misma comodidad en computadoras, tabletas y teléfonos. Si es tu primera visita, empieza por la',
'guía para principiantes',
'Qué ofrece Stripchat',
'Visualización gratuita',
'Las transmisiones públicas están abiertas a todos y no se paga por acceder.',
'Sin registro',
'Puedes empezar a mirar de inmediato. Solo necesitas una cuenta para chatear y realizar compras.',
'Miles de modelos en línea',
'Chicas de distintos países y filtros prácticos por edad, apariencia e idioma.',
'Chat en tiempo real',
'Escribe a la modelo durante la transmisión: ella puede ver tus mensajes.',
'Shows privados',
'Conversaciones uno a uno que se pagan con',
'tokens',
'Desde cualquier dispositivo',
'Las transmisiones se abren en el navegador de Android, iPhone, Windows y macOS.',
'Cómo empezar a mirar',
'Desplázate hacia arriba hasta el bloque de transmisiones.',
'Elige una modelo que te guste y abre su transmisión.',
'Si quieres escribir en el chat y guardar modelos en tus favoritos,',
'crea una cuenta gratuita',
'Para los shows privados y las propinas, recarga tu saldo de tokens.',
'Privacidad y seguridad',
'Para mirar no tienes que facilitar tu nombre ni tu teléfono. Al registrarte, elige un apodo independiente y no compartas información personal con las modelos. Encontrarás más detalles en la guía',
'sobre el anonimato'
]},
'o-sajte.html':{
'meta':{'title':'Acerca de Stripchat.su: quiénes somos y cómo funciona el sitio','description':'Qué es Stripchat.su: un sitio afiliado independiente sobre las transmisiones por webcam de Stripchat. De dónde vienen las transmisiones, cómo se financia y qué normas sigue.','h1':'Acerca de Stripchat.su','nav':'Acerca del sitio','card':'Quién hace el sitio, de dónde vienen las transmisiones y cómo se financia','faq':[
{'q':'¿Stripchat.su es el sitio oficial de Stripchat?','a':'No, es un sitio afiliado independiente. Las transmisiones se integran mediante el widget oficial del programa de afiliados. La propia plataforma gestiona el registro y los pagos.'},
{'q':'¿Cómo obtiene ingresos el sitio?','a':'A través del programa de afiliados de Stripchat. Cuando un visitante se registra desde un enlace de este sitio y realiza una compra en la plataforma, el sitio recibe una comisión. El precio para el visitante no cambia.'},
{'q':'¿Dónde puedo consultar dudas sobre mi cuenta o un pago?','a':'En el servicio de asistencia de Stripchat. La propia plataforma gestiona las cuentas, los tokens y los pagos; Stripchat.su no tiene acceso a ellos.'}
]},
'texts':[
'Qué es este sitio',
'Stripchat.su es un sitio informativo independiente sobre las transmisiones por webcam de Stripchat. Reúne transmisiones en vivo, guías claras para espectadores y una explicación honesta de cómo funcionan el trabajo de las modelos y el programa de afiliados.',
'No es el sitio oficial de Stripchat y su única relación con la empresa es el programa de afiliados. Este sitio no administra la plataforma, no procesa pagos ni almacena datos de cuentas.',
'De dónde vienen las transmisiones',
'El bloque de transmisiones de las páginas es el widget oficial del programa de afiliados. Se carga directamente desde los servidores de la plataforma y muestra a las modelos que están transmitiendo en ese momento. La propia plataforma gestiona todo lo que ocurre dentro del widget, ya sea el registro, el chat o la compra de tokens, conforme a sus normas.',
'Las vistas previas del widget están configuradas para no mostrar contenido explícito. La plataforma verifica la edad de las modelos mediante documentos y solo permite transmitir a personas adultas.',
'Cómo obtiene ingresos el sitio',
'Stripchat.su participa en el programa de afiliados. Si te registras en la plataforma a través de un enlace del sitio y realizas una compra, el sitio recibe un porcentaje de ella. Pagarás lo mismo que sin ese enlace. Los enlaces de registro están identificados como publicidad.',
'Esto permite que el sitio sea gratuito y que no tenga banners ni scripts publicitarios de terceros.',
'Normas del sitio',
'Solo para mayores de 18 años.',
'El sitio está destinado a adultos. No hay ni habrá contenido relacionado con menores.',
'La piratería no tiene cabida aquí. El sitio no publica ni promociona grabaciones de transmisiones ajenas ni filtraciones, porque vulneran los derechos de las modelos.',
'No se inventan cifras. Los textos no contienen promesas de ingresos garantizados ni estadísticas inventadas. Cuando las condiciones dependen de la plataforma, se indica expresamente.',
'El tono es respetuoso. Los textos explican cómo funciona todo sin incluir descripciones explícitas.',
'Qué encontrarás en el sitio',
'A los espectadores les resultarán útiles las',
'categorías de transmisiones',
'y las',
'guías',
': cómo mirar gratis, qué son los tokens y cómo mantener el anonimato. Quienes estén pensando en trabajar como modelos de webcam pueden consultar la',
'sección para modelos',
', y los propietarios de sitios web y canales, la',
'sección sobre el programa de afiliados',
'Los datos que se procesan cuando visitas el sitio se explican en la',
'política de privacidad',
'. Las limitaciones de responsabilidad se describen en la página de',
'exención de responsabilidad',
'Guía técnica en ocho idiomas',
'La sección',
'«Cámara y sonido»',
'reúne 20 instrucciones para configurar la cámara, el micrófono, el teléfono y OBS. El selector de idioma abre la traducción del mismo tema. Las pruebas de dispositivos se inician al pulsar un botón y procesan la imagen y el sonido localmente en el navegador.'
]},
'politika-konfidencialnosti.html':{
'meta':{'title':'Política de privacidad de Stripchat.su','description':'Qué datos se procesan en Stripchat.su: el sitio no recopila datos personales ni instala cookies propias. Las transmisiones integradas se rigen por las normas de la plataforma.','h1':'Política de privacidad','nav':'Privacidad','card':'Qué datos se procesan al visitar el sitio','faq':[]},
'texts':[
'Disposiciones generales',
'Stripchat.su es un sitio estático. No tiene formularios, registro ni comentarios; no recopila tus datos personales ni instala cookies propias.',
'Los servicios de terceros presentes en las páginas pueden procesar datos: el alojamiento, el widget de transmisiones y los sistemas de análisis, si están conectados. A continuación se explica de qué datos se trata y dónde puedes obtener más información.',
'Alojamiento',
'El sitio está alojado en GitHub Pages. Como cualquier servidor web, el servicio de alojamiento recibe datos técnicos de la solicitud: dirección IP, tipo de navegador, dirección de la página y hora de acceso. GitHub los procesa conforme a su propia política de privacidad. El propietario del sitio no tiene acceso a los registros del servidor.',
'Widget de transmisiones',
'El bloque de transmisiones se carga desde los servidores del programa de afiliados de Stripchat y se rige por las normas de la plataforma. Esta puede instalar sus propias cookies, registrar las visitas procedentes del enlace de afiliado y procesar los datos que introduces al registrarte o pagar. Estos datos llegan a la plataforma; Stripchat.su no los recibe.',
'Si te registras en la plataforma o compras tokens, lee su política de privacidad y sus condiciones de uso.',
'Enlaces de afiliado',
'Los enlaces de registro para espectadores, modelos y afiliados incluyen el identificador de la cuenta de afiliado del sitio. Esto permite a la plataforma saber que has llegado desde aquí. El propietario del sitio no recibe datos personales; las estadísticas de afiliación solo muestran registros y compras anonimizados.',
'Análisis de visitas',
'Si el sitio tiene conectados sistemas de análisis web, como Yandex Metrica o Google Analytics, recopilan estadísticas anónimas de las visitas: qué páginas se abren, cuánto tiempo se pasa en ellas y desde qué dispositivos se accede. Esta información se utiliza para mejorar el sitio y no para identificar a las personas. Puedes desactivar la recopilación en los ajustes del navegador o mediante un bloqueador de rastreadores.',
'Qué puedes hacer',
'Borrar las cookies y los datos de los sitios desde los ajustes del navegador.',
'Bloquear las cookies de terceros, aunque el widget de transmisiones podría funcionar peor.',
'Abrir el sitio en modo incógnito para que las visitas no queden en el historial del navegador.',
'La guía',
'sobre el anonimato',
'Cambios en la política',
'Esta página se actualizará si el sitio incorpora nuevos servicios que procesen datos. Encontrarás información general en la página',
'«Acerca del sitio»'
]},
'otkaz-ot-otvetstvennosti.html':{
'meta':{'title':'Exención de responsabilidad y normas de Stripchat.su','description':'Condiciones de uso de Stripchat.su: solo para mayores de 18 años. No es el sitio oficial de Stripchat; los textos son informativos y no se garantizan ingresos.','h1':'Exención de responsabilidad','nav':'Exención de responsabilidad','card':'Restricción de edad, condición del sitio y limitaciones de responsabilidad','faq':[]},
'texts':[
'Solo para adultos',
'El sitio contiene información sobre servicios para adultos y transmisiones integradas de una plataforma para adultos. Solo pueden utilizarlo personas mayores de 18 años. Si en tu país la mayoría de edad se alcanza más tarde, debes haber cumplido esa edad.',
'Si tienes menos de 18 años o la ley prohíbe este contenido en el lugar donde te encuentras, abandona el sitio.',
'Condición del sitio',
'Stripchat.su es un sitio afiliado independiente. No es el sitio oficial de Stripchat ni de Stripcash, no representa a estas empresas ni actúa en su nombre. Los nombres de los servicios se mencionan únicamente para identificar de qué se habla.',
'La plataforma gestiona íntegramente las transmisiones, las cuentas, los pagos, los tokens y los cobros. Su servicio de asistencia resuelve las consultas relacionadas con ellos.',
'Carácter informativo de los textos',
'Los artículos del sitio ofrecen información general. Las funciones, las normas y las condiciones de las plataformas cambian, por lo que debes consultar las condiciones vigentes en la propia plataforma antes de tomar una decisión.',
'Los textos sobre el trabajo como modelo y el programa de afiliados no constituyen una oferta de empleo ni asesoramiento financiero o jurídico.',
'Los ingresos de modelos y afiliados no están garantizados y dependen de muchos factores.',
'Las cuestiones fiscales y legales varían según el país. Si lo necesitas, consulta a un profesional.',
'Cumplimiento de la ley',
'Es tu responsabilidad comprobar que el uso de servicios para adultos sea legal en el lugar donde te encuentras. El sitio no ayuda a eludir restricciones ni bloqueos y no publica instrucciones al respecto.',
'Recursos de terceros',
'Los enlaces de afiliado y el widget de transmisiones llevan a recursos de terceros cuyo contenido y normas el sitio no controla. Puedes consultar más información sobre los datos en la',
'política de privacidad',
', y sobre el propio sitio en la página',
'«Acerca del sitio»'
]}
}

images=json.loads((m.ROOT/'_src/images.json').read_text(encoding='utf-8'))
out={'locale':'es','method':'AI-assisted direct translation with full source comparison of these four pages','pages':{}}
for filename,item in PAGES.items():
    source=m.source_page(m.SRC/filename,images)
    tokens=re.split(r'(<!--[\s\S]*?-->|<[^>]+>)',source['body'])
    positions=[i for i,t in enumerate(tokens) if i%2==0 and m.CYRILLIC.search(t)]
    assert len(positions)==len(item['texts']),(filename,len(positions),len(item['texts']))
    for i,text in zip(positions,item['texts']):
        old=tokens[i];tokens[i]=re.match(r'^\s*',old)[0]+html.escape(text,quote=False)+re.search(r'\s*$',old)[0]
    body=''.join(tokens)
    if filename=='politika-konfidencialnosti.html':
        body=body.replace('sobre el anonimato</a>.','sobre el anonimato</a> explica cómo mantener la privacidad en la propia plataforma.')
    page={'meta':item['meta'],'body':body}
    assert source['imageAlt'] is None,'Manual image alt required'
    m.validate_page(source,page)
    assert page['body'].count('{{cta}}')==source['body'].count('{{cta}}')
    out['pages'][source['url']]=page
m.write_json(m.ROOT/'_build/qa-output/manual-es-core.json',out)
print('Four Spanish pages translated and markup validated')
