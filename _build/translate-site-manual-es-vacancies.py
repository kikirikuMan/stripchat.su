"""Direct source-faithful Spanish translation of the job-ad safety guide."""
import importlib.util
import json
from pathlib import Path

spec=importlib.util.spec_from_file_location('pipeline',Path(__file__).with_name('translate-site.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
body='''<section aria-labelledby="market">
  <h2 id="market">Por qué conviene revisar las ofertas de trabajo por webcam</h2>
  <p class="lead">Las ofertas de trabajo por webcam aparecen en portales de empleo, redes sociales y aplicaciones de mensajería: «modelo de webcam, horario flexible», «se busca mujer para chat, ingresos desde…». Hay propuestas honestas de estudios, pero también muchas trampas. Antes de responder a una oferta, conviene aprender a distinguirlas.</p>
  <p>Esta página trata de cómo comprobar los anuncios y a los empleadores. Las diferencias entre trabajar en un estudio y por cuenta propia se explican en la comparación de <a href="/model/studiya-ili-samostoyatelno/">estudios y trabajo independiente</a>.</p>
</section>

<section aria-labelledby="flags">
  <h2 id="flags">Señales de alerta en anuncios y entrevistas</h2>
  <p>Cualquiera de estos puntos es una razón seria para detenerse. Si coinciden varios, es muy probable que se trate de una estafa.</p>
  <ul class="features">
    <li><h3>Pagar para empezar</h3><p>Te piden dinero por «formación», «cursos», «fotos para el portafolio», una «semana de prueba» o el alquiler del equipo antes de trabajar. Un empleador legítimo obtiene ingresos junto con las modelos, no a costa de quienes solicitan el puesto.</p></li>
    <li><h3>Se quedan con tus documentos</h3><p>Te proponen dejar el pasaporte «en custodia», entregar los originales o enviar una foto del documento a un desconocido por chat «para los trámites». Los documentos solo son necesarios para verificar la edad en la propia plataforma.</p></li>
    <li><h3>Deudas y multas</h3><p>Un adelanto que después debes «devolver trabajando», alojamiento y viaje descontados de futuros ingresos, multas por llegar tarde. Salir de esa dependencia puede resultar muy difícil.</p></li>
    <li><h3>Otra persona controla tu cuenta</h3><p>Solo el «representante» conoce el usuario y la contraseña. Tú no puedes ver tus ingresos ni entrar en tu panel sin él.</p></li>
    <li><h3>Ingresos garantizados</h3><p>Te prometen una cantidad concreta por semana o mes. Los ingresos de una modelo dependen de muchos factores, explicados en el artículo <a href="/model/skolko-zarabatyvayut/">sobre los ingresos</a>, y nadie puede garantizarlos.</p></li>
    <li><h3>Presión y prisas</h3><p>«Quedan pocas plazas, decide hoy». No te dejan llevarte el contrato para leerlo o te prohíben hablar del trabajo con personas cercanas.</p></li>
    <li><h3>Descripción imprecisa</h3><p>El anuncio dice «administradora de chat», «modelo para fotos» o «anfitriona», pero solo en la reunión queda claro qué trabajo se espera de ti.</p></li>
  </ul>
</section>

<section aria-labelledby="under18">
  <h2 id="under18">Prohibido para menores: sin excepciones</h2>
  <p>Solo se puede trabajar como modelo a partir de los 18 años, y la plataforma verifica la edad mediante documentos. Un anuncio dirigido a menores de 18 años, una oferta de «ayuda con los documentos» o una propuesta para eludir la verificación de edad no son una oferta de trabajo: son un delito. No entables conversación y denuncia el anuncio a la administración del sitio donde aparece o a la policía.</p>
</section>

<section aria-labelledby="abroad">
  <h2 id="abroad">Ofertas que implican mudarse al extranjero</h2>
  <p>Conviene prestar especial atención a anuncios como «trabajo de modelo de webcam en el extranjero, viaje y alojamiento pagados». Pueden resultar atractivos, pero también se utilizan para captar personas para redes de trata. Al llegar, pueden quitarles el pasaporte, imponerles una «deuda» por el viaje y el alojamiento y restringir su libertad de movimiento.</p>
  <p>Para trabajar por webcam no hace falta mudarse: se puede transmitir desde cualquier lugar con una conexión adecuada. Si aun así consideras una oferta de ese tipo, deja a alguien de confianza copias de tus documentos, la dirección y los datos del empleador. Acuerden mantener contacto regular y anota de antemano los datos del consulado de tu país. Conserva siempre tu pasaporte contigo.</p>
</section>

<section aria-labelledby="good">
  <h2 id="good">Cómo es una oferta razonable</h2>
  <p>También existen ofertas honestas y no es difícil reconocerlas. El empleador identifica la organización y su dirección, explica claramente que se trata de trabajo por webcam y describe las condiciones antes de reunirse. Te deja leer el contrato de antemano, no retiene los documentos originales y la modelo verifica su edad en la propia plataforma. No promete cantidades concretas: explica de qué dependen los ingresos y cómo se calcula la parte del estudio.</p>
  <p>Es buena señal que te den tiempo para pensarlo, consultar con personas cercanas y rechazar la oferta sin tener que justificarte. Si cualquier pregunta provoca irritación, eso dice más sobre la futura relación de trabajo que el anuncio.</p>
</section>

<section aria-labelledby="questions">
  <h2 id="questions">Preguntas que conviene hacer al empleador</h2>
  <p>Un empleador honesto responderá de forma directa y por escrito. Si evita las preguntas, esa actitud ya permite sacar conclusiones.</p>
  <ol class="steps">
    <li>¿Cómo se llama la organización, está constituida legalmente y ofrece un contrato escrito?</li>
    <li>¿En qué plataforma trabajaré y a nombre de quién estará la cuenta?</li>
    <li>¿Conoceré la contraseña y podré consultar mis ingresos en el panel?</li>
    <li>¿Qué parte se queda el estudio y cómo y cuándo recibiré el dinero?</li>
    <li>¿Tendré que pagar por el equipo, la formación o el espacio?</li>
    <li>¿Hay multas o un mínimo obligatorio de horas?</li>
    <li>¿Qué ocurrirá con la cuenta y el dinero si decido dejar el trabajo?</li>
    <li>¿Puedo negarme a realizar cualquier acción durante una transmisión?</li>
  </ol>
  <p>Es preferible acudir a la entrevista de día, en una oficina o un lugar concurrido, e informar antes a alguien de confianza de dónde estarás.</p>
</section>

<section aria-labelledby="direct">
  <h2 id="direct">Una alternativa: sin oferta de empleo ni intermediario</h2>
  <p>Muchas personas buscan «ofertas de modelo de webcam» sin saber que no es imprescindible tener un empleador. Una persona adulta puede registrarse directamente en la plataforma, verificar sus documentos y transmitir desde casa. El registro es gratuito, la propia plataforma comprueba los documentos y tú conservas el control de la contraseña y los datos para cobrar.</p>
  <p>Eso no hace que todo sea más fácil: tendrás que organizar el equipo, el perfil y el horario. Pero nadie retendrá tus documentos, te impondrá deudas ni decidirá por ti cuándo y cómo trabajar. Encontrarás las instrucciones paso a paso en la guía <a href="/model/kak-nachat/">sobre cómo empezar</a>.</p>
  {{cta}}
</section>

<section aria-labelledby="already">
  <h2 id="already">Si ya estás en una situación sospechosa</h2>
  <ul>
    <li>No pagues nuevas «cuotas» esperando recuperar lo que ya has gastado.</li>
    <li>Guarda las conversaciones, el contrato, los contactos y los datos de las cuentas a las que enviaste dinero.</li>
    <li>Si te han quitado los documentos o te retienen por la fuerza, llama a la policía; en el extranjero, acude también al consulado.</li>
    <li>Cuéntaselo a alguien de confianza. No tienes por qué avergonzarte: la responsabilidad es de quien te engaña.</li>
  </ul>
  <p>Una persona adulta debe decidir libremente si trabaja como modelo. Si te presionan, se trata de coacción y puedes y debes pedir ayuda.</p>
</section>'''
images=json.loads((m.ROOT/'_src/images.json').read_text(encoding='utf-8'))
source=m.source_page(m.SRC/'model/vakansii.html',images)
metadata=json.loads((m.ROOT/'_build/translate-site-meta-es.json').read_text(encoding='utf-8'))
meta=next(e['fields'] for e in metadata['metadataOverrides'] if e['route']==source['url'])
meta['faq']=[
{'q':'¿Es normal que pidan dinero para formar a una modelo de webcam?','a':'Pedir dinero para empezar es una de las señales más claras de una oferta deshonesta. El registro como modelo en la plataforma es gratuito y un empleador legítimo no cobra a una candidata por comenzar a trabajar.'},
{'q':'¿Puedo responder a una oferta de modelo de webcam si todavía no tengo 18 años?','a':'No. Solo se puede trabajar como modelo a partir de los 18 años y después de verificar los documentos. Si un anuncio busca menores, denúncialo a la policía o a la administración del sitio donde aparece.'},
{'q':'¿Conviene aceptar un trabajo por webcam que implique mudarse al extranjero?','a':'Solo debe considerarse con mucha precaución. Algunas ofertas esconden redes que retienen documentos e imponen deudas. Para trabajar por webcam no hace falta mudarse: se puede transmitir desde casa.'},
{'q':'¿Qué hago si el empleador no me devuelve el pasaporte?','a':'Retener el pasaporte de otra persona es ilegal. Acude a la policía y, si estás en el extranjero, al consulado de tu país. No intentes «recuperarlo trabajando».'}]
page={'meta':meta,'body':body}
m.validate_page(source,page)
assert body.count('{{cta}}')==source['body'].count('{{cta}}')
assert source['imageAlt'] is None
m.write_json(m.ROOT/'_build/qa-output/manual-es-vacancies.json',{'locale':'es','sourceDigest':m.digest_sources(sorted(m.SRC.rglob('*.html'),key=lambda p:p.relative_to(m.SRC).as_posix())),'pages':{source['url']:page}})
m.write_json(m.ROOT/'_build/translate-site-meta-es.json',metadata)
print('Spanish vacancy safety guide translated and exact source markup validated')
