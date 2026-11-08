// Translations of the existing shared interface; destinations remain in config.mjs.
export const SITE_LANGUAGES = ['ru', 'en', 'es', 'pt', 'de', 'zh', 'hi', 'ar'];

export const SITE_LOCALES = {
  ru: {
    languageTag: 'ru', ogLocale: 'ru_RU', name: 'Русский', dir: 'ltr',
    ui: {
      home: 'Главная', allPages: 'Все страницы раздела', categoriesHeading: 'Категории трансляций', allCategories: 'Все категории', guidesHeading: 'Гиды для зрителей',
      relatedWatch: 'Смотрите также', relatedRead: 'Читайте также', mainMenu: 'Основное меню', sectionsMenu: 'Разделы сайта', aboutMenu: 'О сайте', breadcrumbs: 'Хлебные крошки', language: 'Язык',
      onlyAdults: 'Только для лиц старше 18 лет', liveStreams: 'Трансляции онлайн', watchStreams: 'Смотреть трансляции онлайн', brandHome: 'на главную', faq: 'Частые вопросы',
      promoLabel: 'Заработок со Stripchat', modelTitle: 'Станьте вебкам-моделью', modelText: 'Работа из дома в своём графике. Узнайте, как начать и сколько можно зарабатывать.',
      partnerTitle: 'Зарабатывайте на трафике', partnerText: 'Партнёрская программа Stripcash: процент с покупок приведённых вами зрителей.',
      ctaModelTitle: 'Готовы попробовать?', ctaModelText: 'Регистрация бесплатная и занимает несколько минут. Понадобится документ, подтверждающий, что вам есть 18 лет.',
      ctaPartnerTitle: 'Начните зарабатывать на трафике', ctaPartnerText: 'Регистрация в партнёрской программе бесплатная. После неё вы получите ссылки и промо-материалы в личном кабинете.',
      helpLink: 'Технический справочник: камера и микрофон · 8 языков', helpNav: 'Камера и звук', aboutSite: 'О сайте',
      notFoundTitle: 'Страница не найдена — Stripchat.su', notFoundMessage: 'Такой страницы нет. Все трансляции на главной.', notFoundHome: 'Перейти на главную',
    },
    sections: {
      watch: {
        nav: ['Категории', 'Гиды', 'Камера и звук', 'Стать моделью', 'Партнёрам'], ctaText: 'Смотреть трансляции',
        footer: ['<strong>18+</strong> Сайт содержит материалы для взрослых. Покиньте его, если вам нет 18 лет или такой контент запрещён в вашей стране.', 'Stripchat.su не является официальным сайтом Stripchat. Трансляции предоставлены через партнёрскую программу, все модели старше 18 лет.'],
        footerNav: ['Главная', 'Категории', 'Гиды для зрителей', 'Работа моделью', 'Партнёрская программа'],
      },
      model: {
        nav: ['Работа моделью', 'Доход', 'Как начать', 'Камера и звук'], ctaText: 'Стать моделью',
        footer: ['Работать моделью можно только с 18 лет: возраст подтверждается документами при регистрации.', 'Доход зависит от вашей активности и не гарантирован. Регистрация проходит на платформе Stripchat, Stripchat.su не является её официальным сайтом.'],
        footerNav: ['Главная', 'Работа моделью'],
      },
      partner: {
        nav: ['Партнёрская программа', 'Как заработать', 'Инструменты', 'Камера и звук'], ctaText: 'Регистрация в Stripcash',
        footer: ['Stripcash — партнёрская программа Stripchat. Доход партнёра зависит от трафика и не гарантирован.', 'Stripchat.su не является официальным сайтом Stripchat или Stripcash. Продвигайте сервисы для взрослых только там, где это разрешено правилами площадки и законом.'],
        footerNav: ['Главная', 'Партнёрская программа'],
      },
    },
    infoLinks: ['О сайте', 'Политика конфиденциальности', 'Отказ от ответственности'],
    dirLabels: {kategorii: 'Категории', gid: 'Гиды', model: 'Работа моделью', partner: 'Партнёрам'},
  },
  en: {
    languageTag: 'en', ogLocale: 'en_US', name: 'English', dir: 'ltr',
    ui: {
      home: 'Home', allPages: 'All pages in this section', categoriesHeading: 'Stream categories', allCategories: 'All categories', guidesHeading: 'Viewer guides',
      relatedWatch: 'See also', relatedRead: 'Read also', mainMenu: 'Main menu', sectionsMenu: 'Site sections', aboutMenu: 'About this site', breadcrumbs: 'Breadcrumbs', language: 'Language',
      onlyAdults: 'For adults aged 18 and over only', liveStreams: 'Live streams', watchStreams: 'Watch live streams', brandHome: 'home', faq: 'Frequently asked questions',
      promoLabel: 'Earning with Stripchat', modelTitle: 'Become a webcam model', modelText: 'Work from home on your own schedule. Learn how to start and how much you could earn.',
      partnerTitle: 'Earn from your traffic', partnerText: 'The Stripcash affiliate program: a share of purchases made by viewers you refer.',
      ctaModelTitle: 'Ready to try?', ctaModelText: 'Registration is free and takes a few minutes. You will need a document confirming that you are at least 18.',
      ctaPartnerTitle: 'Start earning from your traffic', ctaPartnerText: 'Joining the affiliate program is free. After registration, you will find links and promotional materials in your account.',
      helpLink: 'Technical help: camera and microphone · 8 languages', helpNav: 'Camera and audio', aboutSite: 'About this site',
      notFoundTitle: 'Page not found — Stripchat.su', notFoundMessage: 'This page does not exist. All streams are on the home page.', notFoundHome: 'Go to the home page',
    },
    sections: {
      watch: {
        nav: ['Categories', 'Guides', 'Camera and audio', 'Become a model', 'Affiliates'], ctaText: 'Watch streams',
        footer: ['<strong>18+</strong> This site contains adult material. Leave if you are under 18 or this content is prohibited in your country.', 'Stripchat.su is not the official Stripchat website. Streams are provided through the affiliate program; all models are at least 18.'],
        footerNav: ['Home', 'Categories', 'Viewer guides', 'Working as a model', 'Affiliate program'],
      },
      model: {
        nav: ['Working as a model', 'Earnings', 'Getting started', 'Camera and audio'], ctaText: 'Become a model',
        footer: ['You must be at least 18 to work as a model. Your age is verified with documents during registration.', 'Earnings depend on your activity and are not guaranteed. Registration takes place on the Stripchat platform; Stripchat.su is not its official website.'],
        footerNav: ['Home', 'Working as a model'],
      },
      partner: {
        nav: ['Affiliate program', 'How to earn', 'Tools', 'Camera and audio'], ctaText: 'Register with Stripcash',
        footer: ['Stripcash is the Stripchat affiliate program. Affiliate earnings depend on traffic and are not guaranteed.', 'Stripchat.su is not the official website of Stripchat or Stripcash. Promote adult services only where platform rules and the law allow it.'],
        footerNav: ['Home', 'Affiliate program'],
      },
    },
    infoLinks: ['About this site', 'Privacy policy', 'Disclaimer'],
    dirLabels: {kategorii: 'Categories', gid: 'Guides', model: 'Working as a model', partner: 'Affiliates'},
  },
  es: {
    languageTag: 'es', ogLocale: 'es_ES', name: 'Español', dir: 'ltr',
    ui: {
      home: 'Inicio', allPages: 'Todas las páginas de esta sección', categoriesHeading: 'Categorías de transmisiones', allCategories: 'Todas las categorías', guidesHeading: 'Guías para espectadores',
      relatedWatch: 'Ver también', relatedRead: 'Leer también', mainMenu: 'Menú principal', sectionsMenu: 'Secciones del sitio', aboutMenu: 'Sobre el sitio', breadcrumbs: 'Ruta de navegación', language: 'Idioma',
      onlyAdults: 'Solo para personas de 18 años o más', liveStreams: 'Transmisiones en directo', watchStreams: 'Ver transmisiones en directo', brandHome: 'ir al inicio', faq: 'Preguntas frecuentes',
      promoLabel: 'Ingresos con Stripchat', modelTitle: 'Trabaja como modelo webcam', modelText: 'Trabaja desde casa con tu propio horario. Descubre cómo empezar y cuánto podrías ganar.',
      partnerTitle: 'Obtén ingresos con tu tráfico', partnerText: 'Programa de afiliados de Stripcash: un porcentaje de las compras de los espectadores que recomiendes.',
      ctaModelTitle: '¿Quieres probar?', ctaModelText: 'El registro es gratuito y tarda unos minutos. Necesitarás un documento que confirme que tienes al menos 18 años.',
      ctaPartnerTitle: 'Empieza a obtener ingresos con tu tráfico', ctaPartnerText: 'Registrarse en el programa de afiliados es gratuito. Después encontrarás enlaces y materiales promocionales en tu cuenta.',
      helpLink: 'Ayuda técnica: cámara y micrófono · 8 idiomas', helpNav: 'Cámara y audio', aboutSite: 'Sobre el sitio',
      notFoundTitle: 'Página no encontrada — Stripchat.su', notFoundMessage: 'Esta página no existe. Todas las transmisiones están en la página de inicio.', notFoundHome: 'Ir a la página de inicio',
    },
    sections: {
      watch: {
        nav: ['Categorías', 'Guías', 'Cámara y audio', 'Trabajar como modelo', 'Afiliados'], ctaText: 'Ver transmisiones',
        footer: ['<strong>18+</strong> Este sitio contiene material para adultos. Sal si tienes menos de 18 años o si este contenido está prohibido en tu país.', 'Stripchat.su no es el sitio oficial de Stripchat. Las transmisiones se ofrecen a través del programa de afiliados; todas las personas que trabajan como modelos tienen al menos 18 años.'],
        footerNav: ['Inicio', 'Categorías', 'Guías para espectadores', 'Trabajo como modelo', 'Programa de afiliados'],
      },
      model: {
        nav: ['Trabajo como modelo', 'Ingresos', 'Cómo empezar', 'Cámara y audio'], ctaText: 'Trabajar como modelo',
        footer: ['Para trabajar como modelo debes tener al menos 18 años. La edad se verifica mediante documentos durante el registro.', 'Los ingresos dependen de tu actividad y no están garantizados. El registro se realiza en la plataforma Stripchat; Stripchat.su no es su sitio oficial.'],
        footerNav: ['Inicio', 'Trabajo como modelo'],
      },
      partner: {
        nav: ['Programa de afiliados', 'Cómo obtener ingresos', 'Herramientas', 'Cámara y audio'], ctaText: 'Registrarse en Stripcash',
        footer: ['Stripcash es el programa de afiliados de Stripchat. Los ingresos del afiliado dependen del tráfico y no están garantizados.', 'Stripchat.su no es el sitio oficial de Stripchat ni de Stripcash. Promociona servicios para adultos solo donde lo permitan las normas de la plataforma y la ley.'],
        footerNav: ['Inicio', 'Programa de afiliados'],
      },
    },
    infoLinks: ['Sobre el sitio', 'Política de privacidad', 'Aviso de exención de responsabilidad'],
    dirLabels: {kategorii: 'Categorías', gid: 'Guías', model: 'Trabajo como modelo', partner: 'Afiliados'},
  },
  pt: {
    languageTag: 'pt', ogLocale: 'pt_BR', name: 'Português', dir: 'ltr',
    ui: {
      home: 'Início', allPages: 'Todas as páginas desta seção', categoriesHeading: 'Categorias de transmissões', allCategories: 'Todas as categorias', guidesHeading: 'Guias para espectadores',
      relatedWatch: 'Veja também', relatedRead: 'Leia também', mainMenu: 'Menu principal', sectionsMenu: 'Seções do site', aboutMenu: 'Sobre o site', breadcrumbs: 'Caminho de navegação', language: 'Idioma',
      onlyAdults: 'Somente para pessoas com 18 anos ou mais', liveStreams: 'Transmissões ao vivo', watchStreams: 'Assistir às transmissões ao vivo', brandHome: 'ir para o início', faq: 'Perguntas frequentes',
      promoLabel: 'Ganhos com o Stripchat', modelTitle: 'Trabalhe como modelo de webcam', modelText: 'Trabalhe de casa no seu próprio horário. Saiba como começar e quanto você pode ganhar.',
      partnerTitle: 'Ganhe com seu tráfego', partnerText: 'Programa de afiliados Stripcash: uma porcentagem das compras dos espectadores que você indicar.',
      ctaModelTitle: 'Quer experimentar?', ctaModelText: 'O cadastro é gratuito e leva alguns minutos. Você precisará de um documento que comprove que tem pelo menos 18 anos.',
      ctaPartnerTitle: 'Comece a ganhar com seu tráfego', ctaPartnerText: 'O cadastro no programa de afiliados é gratuito. Depois, você encontrará links e materiais promocionais na sua conta.',
      helpLink: 'Ajuda técnica: câmera e microfone · 8 idiomas', helpNav: 'Câmera e áudio', aboutSite: 'Sobre o site',
      notFoundTitle: 'Página não encontrada — Stripchat.su', notFoundMessage: 'Esta página não existe. Todas as transmissões estão na página inicial.', notFoundHome: 'Ir para a página inicial',
    },
    sections: {
      watch: {
        nav: ['Categorias', 'Guias', 'Câmera e áudio', 'Trabalhar como modelo', 'Afiliados'], ctaText: 'Assistir às transmissões',
        footer: ['<strong>18+</strong> Este site contém material para adultos. Saia se você tem menos de 18 anos ou se esse conteúdo é proibido no seu país.', 'Stripchat.su não é o site oficial do Stripchat. As transmissões são fornecidas pelo programa de afiliados; todas as pessoas que atuam como modelos têm pelo menos 18 anos.'],
        footerNav: ['Início', 'Categorias', 'Guias para espectadores', 'Trabalho como modelo', 'Programa de afiliados'],
      },
      model: {
        nav: ['Trabalho como modelo', 'Ganhos', 'Como começar', 'Câmera e áudio'], ctaText: 'Trabalhar como modelo',
        footer: ['É preciso ter pelo menos 18 anos para trabalhar como modelo. A idade é comprovada por documentos no cadastro.', 'Os ganhos dependem da sua atividade e não são garantidos. O cadastro é feito na plataforma Stripchat; Stripchat.su não é o site oficial dela.'],
        footerNav: ['Início', 'Trabalho como modelo'],
      },
      partner: {
        nav: ['Programa de afiliados', 'Como ganhar', 'Ferramentas', 'Câmera e áudio'], ctaText: 'Cadastrar-se no Stripcash',
        footer: ['Stripcash é o programa de afiliados do Stripchat. Os ganhos do afiliado dependem do tráfego e não são garantidos.', 'Stripchat.su não é o site oficial do Stripchat nem do Stripcash. Divulgue serviços para adultos apenas onde as regras da plataforma e a lei permitirem.'],
        footerNav: ['Início', 'Programa de afiliados'],
      },
    },
    infoLinks: ['Sobre o site', 'Política de privacidade', 'Isenção de responsabilidade'],
    dirLabels: {kategorii: 'Categorias', gid: 'Guias', model: 'Trabalho como modelo', partner: 'Afiliados'},
  },
  de: {
    languageTag: 'de', ogLocale: 'de_DE', name: 'Deutsch', dir: 'ltr',
    ui: {
      home: 'Startseite', allPages: 'Alle Seiten dieses Bereichs', categoriesHeading: 'Stream-Kategorien', allCategories: 'Alle Kategorien', guidesHeading: 'Ratgeber für Zuschauer',
      relatedWatch: 'Siehe auch', relatedRead: 'Weitere Artikel', mainMenu: 'Hauptmenü', sectionsMenu: 'Website-Bereiche', aboutMenu: 'Über die Website', breadcrumbs: 'Navigationspfad', language: 'Sprache',
      onlyAdults: 'Nur für Personen ab 18 Jahren', liveStreams: 'Live-Streams', watchStreams: 'Live-Streams ansehen', brandHome: 'zur Startseite', faq: 'Häufige Fragen',
      promoLabel: 'Mit Stripchat Geld verdienen', modelTitle: 'Als Webcam-Model arbeiten', modelText: 'Von zu Hause aus nach deinem eigenen Zeitplan arbeiten. Erfahre, wie du anfängst und wie viel du verdienen könntest.',
      partnerTitle: 'Mit deinem Traffic Geld verdienen', partnerText: 'Das Stripcash-Partnerprogramm: eine Beteiligung an den Käufen der von dir geworbenen Zuschauer.',
      ctaModelTitle: 'Bereit, es auszuprobieren?', ctaModelText: 'Die Registrierung ist kostenlos und dauert wenige Minuten. Du brauchst ein Dokument, das bestätigt, dass du mindestens 18 Jahre alt bist.',
      ctaPartnerTitle: 'Verdiene mit deinem Traffic', ctaPartnerText: 'Die Anmeldung zum Partnerprogramm ist kostenlos. Danach findest du Links und Werbematerialien in deinem Konto.',
      helpLink: 'Technische Hilfe: Kamera und Mikrofon · 8 Sprachen', helpNav: 'Kamera und Ton', aboutSite: 'Über die Website',
      notFoundTitle: 'Seite nicht gefunden — Stripchat.su', notFoundMessage: 'Diese Seite existiert nicht. Alle Streams findest du auf der Startseite.', notFoundHome: 'Zur Startseite',
    },
    sections: {
      watch: {
        nav: ['Kategorien', 'Ratgeber', 'Kamera und Ton', 'Model werden', 'Partner'], ctaText: 'Streams ansehen',
        footer: ['<strong>18+</strong> Diese Website enthält Inhalte für Erwachsene. Verlasse sie, wenn du unter 18 bist oder diese Inhalte in deinem Land verboten sind.', 'Stripchat.su ist nicht die offizielle Website von Stripchat. Die Streams werden über das Partnerprogramm bereitgestellt; alle Models sind mindestens 18 Jahre alt.'],
        footerNav: ['Startseite', 'Kategorien', 'Ratgeber für Zuschauer', 'Arbeit als Model', 'Partnerprogramm'],
      },
      model: {
        nav: ['Arbeit als Model', 'Einkommen', 'Erste Schritte', 'Kamera und Ton'], ctaText: 'Model werden',
        footer: ['Als Model darfst du erst ab 18 Jahren arbeiten. Das Alter wird bei der Registrierung anhand von Dokumenten geprüft.', 'Dein Einkommen hängt von deiner Aktivität ab und ist nicht garantiert. Die Registrierung erfolgt auf der Stripchat-Plattform; Stripchat.su ist nicht deren offizielle Website.'],
        footerNav: ['Startseite', 'Arbeit als Model'],
      },
      partner: {
        nav: ['Partnerprogramm', 'Geld verdienen', 'Werkzeuge', 'Kamera und Ton'], ctaText: 'Bei Stripcash registrieren',
        footer: ['Stripcash ist das Partnerprogramm von Stripchat. Partnereinnahmen hängen vom Traffic ab und sind nicht garantiert.', 'Stripchat.su ist weder die offizielle Website von Stripchat noch von Stripcash. Bewirb Dienste für Erwachsene nur dort, wo die Regeln der Plattform und das Gesetz dies erlauben.'],
        footerNav: ['Startseite', 'Partnerprogramm'],
      },
    },
    infoLinks: ['Über die Website', 'Datenschutzerklärung', 'Haftungsausschluss'],
    dirLabels: {kategorii: 'Kategorien', gid: 'Ratgeber', model: 'Arbeit als Model', partner: 'Partner'},
  },
  zh: {
    languageTag: 'zh-Hans', ogLocale: 'zh_CN', name: '简体中文', dir: 'ltr',
    ui: {
      home: '首页', allPages: '本栏目所有页面', categoriesHeading: '直播分类', allCategories: '所有分类', guidesHeading: '观众指南',
      relatedWatch: '另请参阅', relatedRead: '相关阅读', mainMenu: '主菜单', sectionsMenu: '网站栏目', aboutMenu: '关于本站', breadcrumbs: '面包屑导航', language: '语言',
      onlyAdults: '仅限年满 18 岁的成年人', liveStreams: '在线直播', watchStreams: '观看在线直播', brandHome: '返回首页', faq: '常见问题',
      promoLabel: '通过 Stripchat 获得收入', modelTitle: '成为网络摄像头主播', modelText: '在家按自己的时间安排工作。了解如何开始以及可能获得多少收入。',
      partnerTitle: '通过流量获得收入', partnerText: 'Stripcash 联盟计划：从您推荐的观众的消费中获得一定比例的分成。',
      ctaModelTitle: '准备尝试了吗？', ctaModelText: '注册免费，只需几分钟。您需要提供能证明自己已满 18 岁的证件。',
      ctaPartnerTitle: '开始通过流量获得收入', ctaPartnerText: '加入联盟计划无需费用。注册后，您可以在个人账户中获取链接和推广素材。',
      helpLink: '技术帮助：摄像头和麦克风 · 8 种语言', helpNav: '摄像头与音频', aboutSite: '关于本站',
      notFoundTitle: '页面未找到 — Stripchat.su', notFoundMessage: '此页面不存在。所有直播都在首页。', notFoundHome: '前往首页',
    },
    sections: {
      watch: {
        nav: ['分类', '指南', '摄像头与音频', '成为主播', '联盟伙伴'], ctaText: '观看直播',
        footer: ['<strong>18+</strong> 本站包含成人内容。如果您未满 18 岁，或所在国家禁止此类内容，请离开本站。', 'Stripchat.su 并非 Stripchat 官方网站。直播通过联盟计划提供，所有主播均已年满 18 岁。'],
        footerNav: ['首页', '分类', '观众指南', '主播工作', '联盟计划'],
      },
      model: {
        nav: ['主播工作', '收入', '如何开始', '摄像头与音频'], ctaText: '成为主播',
        footer: ['只有年满 18 岁才可从事主播工作，注册时须通过证件验证年龄。', '收入取决于您的投入，不能保证。注册在 Stripchat 平台进行，Stripchat.su 并非其官方网站。'],
        footerNav: ['首页', '主播工作'],
      },
      partner: {
        nav: ['联盟计划', '如何获得收入', '工具', '摄像头与音频'], ctaText: '注册 Stripcash',
        footer: ['Stripcash 是 Stripchat 的联盟计划。联盟伙伴的收入取决于流量，不能保证。', 'Stripchat.su 并非 Stripchat 或 Stripcash 的官方网站。仅在平台规则和法律允许的地方推广成人服务。'],
        footerNav: ['首页', '联盟计划'],
      },
    },
    infoLinks: ['关于本站', '隐私政策', '免责声明'],
    dirLabels: {kategorii: '分类', gid: '指南', model: '主播工作', partner: '联盟伙伴'},
  },
  hi: {
    languageTag: 'hi', ogLocale: 'hi_IN', name: 'हिन्दी', dir: 'ltr',
    ui: {
      home: 'मुखपृष्ठ', allPages: 'इस अनुभाग के सभी पृष्ठ', categoriesHeading: 'प्रसारण की श्रेणियाँ', allCategories: 'सभी श्रेणियाँ', guidesHeading: 'दर्शकों के लिए गाइड',
      relatedWatch: 'यह भी देखें', relatedRead: 'यह भी पढ़ें', mainMenu: 'मुख्य मेनू', sectionsMenu: 'साइट के अनुभाग', aboutMenu: 'साइट के बारे में', breadcrumbs: 'नेविगेशन पथ', language: 'भाषा',
      onlyAdults: 'केवल 18 वर्ष या उससे अधिक आयु के लोगों के लिए', liveStreams: 'लाइव प्रसारण', watchStreams: 'लाइव प्रसारण देखें', brandHome: 'मुखपृष्ठ पर जाएँ', faq: 'अक्सर पूछे जाने वाले प्रश्न',
      promoLabel: 'Stripchat से कमाई', modelTitle: 'वेबकैम मॉडल बनें', modelText: 'अपने समय के अनुसार घर से काम करें। जानें कि शुरुआत कैसे करें और कितनी कमाई हो सकती है।',
      partnerTitle: 'अपने ट्रैफ़िक से कमाई करें', partnerText: 'Stripcash का एफिलिएट कार्यक्रम: आपके द्वारा भेजे गए दर्शकों की खरीदारी में से एक प्रतिशत।',
      ctaModelTitle: 'आज़माने के लिए तैयार हैं?', ctaModelText: 'पंजीकरण मुफ़्त है और इसमें कुछ मिनट लगते हैं। आपको ऐसा दस्तावेज़ चाहिए जो पुष्टि करे कि आपकी आयु कम से कम 18 वर्ष है।',
      ctaPartnerTitle: 'अपने ट्रैफ़िक से कमाना शुरू करें', ctaPartnerText: 'एफिलिएट कार्यक्रम में पंजीकरण मुफ़्त है। उसके बाद आपके खाते में लिंक और प्रचार सामग्री उपलब्ध होगी।',
      helpLink: 'तकनीकी सहायता: कैमरा और माइक्रोफ़ोन · 8 भाषाएँ', helpNav: 'कैमरा और आवाज़', aboutSite: 'साइट के बारे में',
      notFoundTitle: 'पृष्ठ नहीं मिला — Stripchat.su', notFoundMessage: 'यह पृष्ठ मौजूद नहीं है। सभी प्रसारण मुखपृष्ठ पर हैं।', notFoundHome: 'मुखपृष्ठ पर जाएँ',
    },
    sections: {
      watch: {
        nav: ['श्रेणियाँ', 'गाइड', 'कैमरा और आवाज़', 'मॉडल बनें', 'एफिलिएट साझेदार'], ctaText: 'प्रसारण देखें',
        footer: ['<strong>18+</strong> इस साइट पर वयस्कों के लिए सामग्री है। यदि आपकी आयु 18 वर्ष से कम है या आपके देश में ऐसी सामग्री प्रतिबंधित है, तो साइट छोड़ दें।', 'Stripchat.su, Stripchat की आधिकारिक साइट नहीं है। प्रसारण एफिलिएट कार्यक्रम के माध्यम से उपलब्ध हैं और सभी मॉडलों की आयु कम से कम 18 वर्ष है।'],
        footerNav: ['मुखपृष्ठ', 'श्रेणियाँ', 'दर्शकों के लिए गाइड', 'मॉडल के रूप में काम', 'एफिलिएट कार्यक्रम'],
      },
      model: {
        nav: ['मॉडल के रूप में काम', 'आय', 'शुरुआत कैसे करें', 'कैमरा और आवाज़'], ctaText: 'मॉडल बनें',
        footer: ['मॉडल के रूप में काम करने के लिए आयु कम से कम 18 वर्ष होनी चाहिए। पंजीकरण के समय दस्तावेज़ों से आयु की पुष्टि की जाती है।', 'आय आपकी सक्रियता पर निर्भर करती है और इसकी गारंटी नहीं है। पंजीकरण Stripchat प्लेटफ़ॉर्म पर होता है; Stripchat.su उसकी आधिकारिक साइट नहीं है।'],
        footerNav: ['मुखपृष्ठ', 'मॉडल के रूप में काम'],
      },
      partner: {
        nav: ['एफिलिएट कार्यक्रम', 'कमाई कैसे करें', 'उपकरण', 'कैमरा और आवाज़'], ctaText: 'Stripcash पर पंजीकरण करें',
        footer: ['Stripcash, Stripchat का एफिलिएट कार्यक्रम है। साझेदार की आय ट्रैफ़िक पर निर्भर करती है और इसकी गारंटी नहीं है।', 'Stripchat.su, Stripchat या Stripcash की आधिकारिक साइट नहीं है। वयस्क सेवाओं का प्रचार केवल वहीं करें जहाँ प्लेटफ़ॉर्म के नियम और कानून इसकी अनुमति देते हैं।'],
        footerNav: ['मुखपृष्ठ', 'एफिलिएट कार्यक्रम'],
      },
    },
    infoLinks: ['साइट के बारे में', 'गोपनीयता नीति', 'अस्वीकरण'],
    dirLabels: {kategorii: 'श्रेणियाँ', gid: 'गाइड', model: 'मॉडल के रूप में काम', partner: 'एफिलिएट साझेदार'},
  },
  ar: {
    languageTag: 'ar', ogLocale: 'ar_SA', name: 'العربية', dir: 'rtl',
    ui: {
      home: 'الرئيسية', allPages: 'جميع صفحات هذا القسم', categoriesHeading: 'فئات البث', allCategories: 'جميع الفئات', guidesHeading: 'أدلة المشاهدين',
      relatedWatch: 'شاهد أيضًا', relatedRead: 'اقرأ أيضًا', mainMenu: 'القائمة الرئيسية', sectionsMenu: 'أقسام الموقع', aboutMenu: 'عن الموقع', breadcrumbs: 'مسار التنقل', language: 'اللغة',
      onlyAdults: 'لمن بلغوا 18 عامًا فأكثر فقط', liveStreams: 'البث المباشر', watchStreams: 'مشاهدة البث المباشر', brandHome: 'إلى الصفحة الرئيسية', faq: 'الأسئلة الشائعة',
      promoLabel: 'الربح مع Stripchat', modelTitle: 'اعمل كعارض أمام كاميرا الويب', modelText: 'اعمل من المنزل وفق جدولك الخاص. تعرّف على كيفية البدء ومقدار الدخل الممكن.',
      partnerTitle: 'اربح من الزيارات التي تجلبها', partnerText: 'برنامج Stripcash للشركاء: نسبة من مشتريات المشاهدين الذين تحيلهم.',
      ctaModelTitle: 'هل أنت مستعد للتجربة؟', ctaModelText: 'التسجيل مجاني ويستغرق بضع دقائق. ستحتاج إلى وثيقة تثبت أن عمرك 18 عامًا على الأقل.',
      ctaPartnerTitle: 'ابدأ الربح من الزيارات التي تجلبها', ctaPartnerText: 'التسجيل في برنامج الشركاء مجاني. بعد التسجيل ستجد الروابط والمواد الترويجية في حسابك.',
      helpLink: 'مساعدة تقنية: الكاميرا والميكروفون · 8 لغات', helpNav: 'الكاميرا والصوت', aboutSite: 'عن الموقع',
      notFoundTitle: 'الصفحة غير موجودة — Stripchat.su', notFoundMessage: 'هذه الصفحة غير موجودة. جميع البثوث متاحة في الصفحة الرئيسية.', notFoundHome: 'الانتقال إلى الصفحة الرئيسية',
    },
    sections: {
      watch: {
        nav: ['الفئات', 'الأدلة', 'الكاميرا والصوت', 'العمل كعارض', 'الشركاء'], ctaText: 'مشاهدة البثوث',
        footer: ['<strong>18+</strong> يحتوي الموقع على مواد للبالغين. غادره إذا كان عمرك أقل من 18 عامًا أو كان هذا المحتوى محظورًا في بلدك.', 'Stripchat.su ليس الموقع الرسمي لـ Stripchat. تُقدَّم البثوث من خلال برنامج الشركاء، وجميع العارضين بلغوا 18 عامًا على الأقل.'],
        footerNav: ['الرئيسية', 'الفئات', 'أدلة المشاهدين', 'العمل كعارض', 'برنامج الشركاء'],
      },
      model: {
        nav: ['العمل كعارض', 'الدخل', 'كيفية البدء', 'الكاميرا والصوت'], ctaText: 'العمل كعارض',
        footer: ['لا يمكن العمل كعارض إلا من سن 18 عامًا، ويُتحقق من العمر بوثائق عند التسجيل.', 'يعتمد الدخل على نشاطك وهو غير مضمون. يتم التسجيل على منصة Stripchat؛ وStripchat.su ليس موقعها الرسمي.'],
        footerNav: ['الرئيسية', 'العمل كعارض'],
      },
      partner: {
        nav: ['برنامج الشركاء', 'كيفية الربح', 'الأدوات', 'الكاميرا والصوت'], ctaText: 'التسجيل في Stripcash',
        footer: ['Stripcash هو برنامج الشركاء الخاص بـ Stripchat. يعتمد دخل الشريك على الزيارات وهو غير مضمون.', 'Stripchat.su ليس الموقع الرسمي لـ Stripchat أو Stripcash. روّج لخدمات البالغين فقط حيث تسمح قواعد المنصة والقانون بذلك.'],
        footerNav: ['الرئيسية', 'برنامج الشركاء'],
      },
    },
    infoLinks: ['عن الموقع', 'سياسة الخصوصية', 'إخلاء المسؤولية'],
    dirLabels: {kategorii: 'الفئات', gid: 'الأدلة', model: 'العمل كعارض', partner: 'الشركاء'},
  },
};

/** Localize page paths only; asset files, external URLs and same-page anchors stay intact. */
export function localizePath(locale, basePath) {
  if (!SITE_LANGUAGES.includes(locale)) throw new Error(`Unsupported site locale: ${locale}`);
  if (typeof basePath !== 'string') throw new TypeError('Page path must be a string.');
  if (!basePath.startsWith('/') || basePath.startsWith('//')) return basePath;
  const [, rawPath, suffix] = basePath.match(/^([^?#]*)([\s\S]*)$/);
  if (/^\/(?:assets|img)(?:\/|$)/.test(rawPath) || /\.[a-z\d]{1,12}$/i.test(rawPath)) return basePath;
  const pagePath = rawPath.replace(/^\/(?:en|es|pt|de|zh|hi|ar)(?=\/|$)/, '') || '/';
  return (locale === 'ru' ? pagePath : `/${locale}${pagePath}`) + suffix;
}

// Fail rather than silently mixing languages when a shared label is missing.
const requiredUiKeys = Object.keys(SITE_LOCALES.ru.ui).sort();
for (const locale of SITE_LANGUAGES) {
  const data = SITE_LOCALES[locale];
  if (JSON.stringify(Object.keys(data.ui).sort()) !== JSON.stringify(requiredUiKeys)) throw new Error(`${locale}: UI keys differ`);
  for (const [key, value] of Object.entries(data.ui)) if (typeof value !== 'string' || !value.trim()) throw new Error(`${locale}: missing UI ${key}`);
  if (data.infoLinks.length !== 3 || Object.keys(data.dirLabels).length !== 4) throw new Error(`${locale}: incomplete common navigation`);
  for (const section of ['watch', 'model', 'partner']) {
    const current = data.sections[section];
    const original = SITE_LOCALES.ru.sections[section];
    for (const key of ['nav', 'footer', 'footerNav']) {
      if (current[key].length !== original[key].length || current[key].some(value => typeof value !== 'string' || !value.trim())) throw new Error(`${locale}/${section}: incomplete ${key}`);
    }
  }
}
