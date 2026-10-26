// Общие настройки сайта. Ссылки и тексты разделов меняются здесь, страницы пересобираются командой
//   node _build/build.mjs

export const SITE = {
  origin: 'https://stripchat.su',
  name: 'Stripchat.su',
  themeColor: '#0f0f14',
};

const IFRAME_BASE = 'https://creative.world-webcam.com/LPAkira?userId=b69f1e454a7b497f99182f84c66c6398682a5b7f5fb47e8d30521d8a44aff9c9&targetDomain=world-webcam.com';

// Креатив понимает только эти категории, всё остальное он показывает как girls
export const IFRAME_TAGS = ['girls', 'couples', 'men', 'trans'];

export const iframeSrc = (tag = 'girls') => `${IFRAME_BASE}&tag=${tag}&nonNudeContent=1&hideLogo=1`;

export const LINKS = {
  modelSignup: 'https://go.mavrtracktor.com/signup/model?userId=b69f1e454a7b497f99182f84c66c6398682a5b7f5fb47e8d30521d8a44aff9c9',
  partnerSignup: 'https://stripcash.com/sign-up/Dosash',
};

// Разделы сайта. Разделы model и partner не ссылаются друг на друга: ни в меню, ни в подвале, ни в тексте
export const SECTIONS = {
  watch: {
    adult: true,
    ogImage: '/og-image.png',
    nav: [
      ['/kategorii/', 'Категории'],
      ['/gid/', 'Гиды'],
      ['/model/', 'Стать моделью'],
      ['/partner/', 'Партнёрам'],
    ],
    cta: { href: '#stream', text: 'Смотреть трансляции', external: false },
    footer: [
      '<strong>18+</strong> Сайт содержит материалы для взрослых. Покиньте его, если вам нет 18 лет или такой контент запрещён в вашей стране.',
      'Stripchat.su не является официальным сайтом Stripchat. Трансляции предоставлены через партнёрскую программу, все модели старше 18 лет.',
    ],
    footerNav: [
      ['/', 'Главная'],
      ['/kategorii/', 'Категории'],
      ['/gid/', 'Гиды для зрителей'],
      ['/model/', 'Работа моделью'],
      ['/partner/', 'Партнёрская программа'],
    ],
  },
  model: {
    adult: false,
    ogImage: '/og-model.png',
    nav: [
      ['/model/', 'Работа моделью'],
      ['/model/skolko-zarabatyvayut/', 'Доход'],
      ['/model/kak-nachat/', 'Как начать'],
    ],
    cta: { href: LINKS.modelSignup, text: 'Стать моделью', external: true },
    footer: [
      'Работать моделью можно только с 18 лет: возраст подтверждается документами при регистрации.',
      'Доход зависит от вашей активности и не гарантирован. Регистрация проходит на платформе Stripchat, Stripchat.su не является её официальным сайтом.',
    ],
    footerNav: [
      ['/', 'Главная'],
      ['/model/', 'Работа моделью'],
    ],
  },
  partner: {
    adult: false,
    ogImage: '/og-partner.png',
    nav: [
      ['/partner/', 'Партнёрская программа'],
      ['/partner/kak-zarabotat/', 'Как заработать'],
      ['/partner/instrumenty/', 'Инструменты'],
    ],
    cta: { href: LINKS.partnerSignup, text: 'Регистрация в Stripcash', external: true },
    footer: [
      'Stripcash — партнёрская программа Stripchat. Доход партнёра зависит от трафика и не гарантирован.',
      'Stripchat.su не является официальным сайтом Stripchat или Stripcash. Продвигайте сервисы для взрослых только там, где это разрешено правилами площадки и законом.',
    ],
    footerNav: [
      ['/', 'Главная'],
      ['/partner/', 'Партнёрская программа'],
    ],
  },
};

// Подписи разделов для хлебных крошек
export const DIR_LABELS = {
  kategorii: 'Категории',
  gid: 'Гиды',
  model: 'Работа моделью',
  partner: 'Партнёрам',
};
