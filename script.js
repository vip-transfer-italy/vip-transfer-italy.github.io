/* ============================================================
   VIP TRANSFER ITALY — script.js
   Локалізація EN/RU, автопідказки Nominatim, відправка форми
   ============================================================ */

/* ============================================================
   НАЛАШТУВАННЯ ВІДПРАВКИ ЗАЯВОК — ЗАМІНИ НА СВОЇ ЗНАЧЕННЯ
   ------------------------------------------------------------
   ВАРІАНТ A (основний): Telegram Bot API
   1. Створи бота через @BotFather → отримаєш BOT_TOKEN
   2. Напиши своєму боту будь-яке повідомлення, потім відкрий
      https://api.telegram.org/bot<ТВІЙ_ТОКЕН>/getUpdates
      і скопіюй "chat":{"id": ЧИСЛО} → це CHAT_ID
   (детальна інструкція — у README.md)
   ============================================================ */
const TELEGRAM_BOT_TOKEN = '8759888209:AAHWrMXnGG0fAoaI84lkCvDmEeG7hRq2DkA';
const TELEGRAM_CHAT_ID   = '8558195511';

/* ------------------------------------------------------------
   ВАРІАНТ B (альтернатива, без бота): FormSubmit.co — заявки
   приходять на email. Щоб увімкнути:
   1. Постав USE_FORMSUBMIT = true і вкажи свою пошту нижче
   2. Після ПЕРШОЇ відправки FormSubmit пришле лист-підтвердження
      на цю пошту — підтверди його, далі все працює автоматично
   Нічого реєструвати не треба, API-ключ не потрібен.
   (Ще одна альтернатива — EmailJS: emailjs.com, потребує
   реєстрації і ключів, тому FormSubmit простіший.)
   ------------------------------------------------------------ */
const USE_FORMSUBMIT = false;
const FORMSUBMIT_EMAIL = 'ЗАМІНИ_НА_СВОЮ_ПОШТУ@gmail.com';

/* ============================================================
   СЛОВНИК ПЕРЕКЛАДІВ
   ============================================================ */
const I18N = {
  en: {
    nav_about: 'About',
    nav_fleet: 'Fleet',
    nav_booking: 'Booking',
    nav_contacts: 'Contacts',

    hero_eyebrow: 'Private Chauffeur Service',
    hero_title: 'Premium Private Transfers in Italy',
    hero_slogan: 'Comfort. Punctuality. Style.',
    hero_badge: 'Best Price in Europe',
    hero_cta: 'Get a Price',
    hero_cta2: 'Our Fleet',

    about_eyebrow: 'About Us',
    about_title: 'Travel Italy the First-Class Way',
    about_text: 'VIP Transfer Italy provides premium private transfers across the whole country — airports, hotels, lakes, ski resorts and city-to-city rides. One car, one driver, one fixed price. No queues, no stress, no surprises.',
    feat1_title: 'Always On Time',
    feat1_text: 'Flight tracking and free waiting time. We are there before you land.',
    feat2_title: 'Fixed Price',
    feat2_text: 'The price you confirm is the price you pay. No hidden fees, no meters.',
    feat3_title: 'English-Speaking Drivers',
    feat3_text: 'Professional, discreet chauffeurs who speak your language.',
    feat4_title: 'Premium Comfort',
    feat4_text: 'Spotless business-class vehicles, water on board, child seats on request.',

    fleet_eyebrow: 'Our Fleet',
    fleet_title: 'Choose Your Class',
    car1_badge: 'Business Van',
    car1_desc: 'The flagship of our fleet. First-class space for families and groups — leather interior, climate zones and room for everyone’s luggage.',
    car2_badge: 'Comfort Sedan',
    car2_desc: 'An elegant business sedan for solo travellers and couples. Smooth, quiet and refined — perfect for airport transfers.',
    car3_badge: 'Premium SUV',
    car3_desc: 'A commanding premium SUV for those who value presence and power. Confident on mountain roads, refined in the city.',
    car4_badge: 'Group Van',
    car4_desc: 'Space for the whole company. Eight comfortable seats and room for everyone’s luggage — ideal for groups and big families.',
    car_pax: 'passengers',
    car_bags: 'suitcases',
    car_book: 'Book This Car',

    booking_eyebrow: 'Reservation',
    booking_title: 'Book Your Transfer',
    booking_note: 'Fill in the form — we will confirm your ride and the exact price shortly.',
    f_pickup: 'Pickup location',
    f_dest: 'Destination',
    f_addr_ph: 'Address, airport, hotel...',
    f_date: 'Date',
    f_time: 'Time',
    f_pax: 'Passengers',
    f_bags: 'Luggage',
    f_phone: 'Contact phone',
    f_phone_ph: '+39 ...',
    f_submit: 'Get a Price',
    f_or: 'or',
    f_whatsapp: 'Book via WhatsApp',
    f_wa_msg: 'Hello! I would like to book a transfer.',
    f_success: 'Thank you for your order! Our manager will contact you on WhatsApp shortly.',
    f_error: 'Please fill in all required fields correctly.',

    stats_eyebrow: 'Why Us',
    stats_title: 'Numbers speak louder than words',
    stats1: 'Years of experience',
    stats2: 'Transfers completed',
    stats3: 'Happy clients',
    stats4: 'Support on WhatsApp',

    nav_reviews: 'Reviews',
    reviews_eyebrow: 'Reviews',
    reviews_title: 'What Our Clients Say',
    rev1_text: 'Flawless from start to finish. The driver was waiting at arrivals with a sign, helped with every suitcase, and the car was immaculate. We reached our hotel on Lake Como completely relaxed.',
    rev2_text: 'Booked a transfer from Fiumicino for a business meeting. On time to the minute, a quiet ride, fixed price with no surprises. Exactly what a premium service should be.',
    rev3_text: 'We travelled as a family of seven with a mountain of luggage — the Caravelle swallowed it all. The driver was patient with our kids and even suggested a great lunch stop. Highly recommended!',

    footer_tag: 'Premium private transfers across Italy.',
    footer_contacts: 'Contacts',
    footer_menu: 'Menu',
    footer_rights: 'All rights reserved.'
  },

  it: {
    nav_about: 'Chi siamo',
    nav_fleet: 'Flotta',
    nav_booking: 'Prenotazione',
    nav_contacts: 'Contatti',

    hero_eyebrow: 'Servizio Autista Privato',
    hero_title: 'Transfer Privati Premium in Italia',
    hero_slogan: 'Comfort. Puntualità. Stile.',
    hero_badge: 'Miglior Prezzo in Europa',
    hero_cta: 'Scopri il Prezzo',
    hero_cta2: 'La Nostra Flotta',

    about_eyebrow: 'Chi Siamo',
    about_title: 'Viaggia in Italia in Prima Classe',
    about_text: 'VIP Transfer Italy offre transfer privati premium in tutto il paese — aeroporti, hotel, laghi, località sciistiche e viaggi tra città. Un\'auto, un autista, un prezzo fisso. Niente code, niente stress, niente sorprese.',
    feat1_title: 'Sempre Puntuali',
    feat1_text: 'Monitoriamo il tuo volo, attesa gratuita. Siamo lì prima del tuo atterraggio.',
    feat2_title: 'Prezzo Fisso',
    feat2_text: 'Il prezzo confermato è quello che paghi. Nessun costo nascosto, nessun tassametro.',
    feat3_title: 'Autisti Multilingue',
    feat3_text: 'Autisti professionali e discreti che parlano la tua lingua.',
    feat4_title: 'Comfort Premium',
    feat4_text: 'Auto business impeccabili, acqua a bordo, seggiolini per bambini su richiesta.',

    fleet_eyebrow: 'La Nostra Flotta',
    fleet_title: 'Scegli la Tua Classe',
    car1_badge: 'Van Business',
    car1_desc: 'L\'ammiraglia della nostra flotta. Spazio di prima classe per famiglie e gruppi — interni in pelle, zone climatiche e spazio per i bagagli di tutti.',
    car2_badge: 'Berlina Comfort',
    car2_desc: 'Un\'elegante berlina business per chi viaggia da solo o in coppia. Fluida, silenziosa e raffinata — perfetta per i transfer aeroportuali.',
    car3_badge: 'SUV Premium',
    car3_desc: 'Un SUV premium imponente per chi apprezza presenza e potenza. Sicuro sulle strade di montagna, raffinato in città.',
    car4_badge: 'Van per Gruppi',
    car4_desc: 'Spazio per tutta la compagnia. Otto comodi posti e spazio per i bagagli di tutti — ideale per gruppi e famiglie numerose.',
    car_pax: 'passeggeri',
    car_bags: 'valigie',
    car_book: 'Prenota Questa Auto',

    booking_eyebrow: 'Prenotazione',
    booking_title: 'Prenota il Tuo Transfer',
    booking_note: 'Compila il modulo — confermeremo il viaggio e il prezzo esatto a breve.',
    f_pickup: 'Punto di partenza',
    f_dest: 'Destinazione',
    f_addr_ph: 'Indirizzo, aeroporto, hotel...',
    f_date: 'Data',
    f_time: 'Ora',
    f_pax: 'Passeggeri',
    f_bags: 'Bagagli',
    f_phone: 'Telefono di contatto',
    f_phone_ph: '+39 ...',
    f_submit: 'Scopri il Prezzo',
    f_or: 'oppure',
    f_whatsapp: 'Prenota su WhatsApp',
    f_wa_msg: 'Salve! Vorrei prenotare un transfer.',
    f_success: 'Grazie per la richiesta! Un nostro manager ti contatterà su WhatsApp a breve.',
    f_error: 'Compila correttamente tutti i campi obbligatori.',

    stats_eyebrow: 'Perché Noi',
    stats_title: 'I numeri parlano più delle parole',
    stats1: 'Anni di esperienza',
    stats2: 'Transfer completati',
    stats3: 'Clienti soddisfatti',
    stats4: 'Assistenza su WhatsApp',

    nav_reviews: 'Recensioni',
    reviews_eyebrow: 'Recensioni',
    reviews_title: 'Cosa Dicono i Nostri Clienti',
    rev1_text: 'Impeccabile dall\'inizio alla fine. L\'autista ci aspettava agli arrivi con un cartello, ci ha aiutato con tutte le valigie e l\'auto era immacolata. Siamo arrivati in hotel sul Lago di Como completamente rilassati.',
    rev2_text: 'Ho prenotato un transfer da Fiumicino per una riunione di lavoro. Puntuale al minuto, viaggio silenzioso, prezzo fisso senza sorprese. Esattamente ciò che dovrebbe essere un servizio premium.',
    rev3_text: 'Abbiamo viaggiato in sette con una montagna di bagagli — la Caravelle ha accolto tutto. L\'autista è stato paziente con i bambini e ci ha persino consigliato un\'ottima sosta pranzo. Consigliatissimo!',

    footer_tag: 'Transfer privati premium in tutta Italia.',
    footer_contacts: 'Contatti',
    footer_menu: 'Menu',
    footer_rights: 'Tutti i diritti riservati.'
  },

  es: {
    nav_about: 'Nosotros',
    nav_fleet: 'Flota',
    nav_booking: 'Reserva',
    nav_contacts: 'Contacto',

    hero_eyebrow: 'Servicio de Chófer Privado',
    hero_title: 'Traslados Privados Premium en Italia',
    hero_slogan: 'Confort. Puntualidad. Estilo.',
    hero_badge: 'Mejor Precio de Europa',
    hero_cta: 'Consultar Precio',
    hero_cta2: 'Nuestra Flota',

    about_eyebrow: 'Nosotros',
    about_title: 'Viaja por Italia en Primera Clase',
    about_text: 'VIP Transfer Italy ofrece traslados privados premium por todo el país — aeropuertos, hoteles, lagos, estaciones de esquí y viajes entre ciudades. Un coche, un conductor, un precio fijo. Sin colas, sin estrés, sin sorpresas.',
    feat1_title: 'Siempre Puntuales',
    feat1_text: 'Seguimos tu vuelo, espera gratuita. Estamos allí antes de que aterrices.',
    feat2_title: 'Precio Fijo',
    feat2_text: 'El precio confirmado es el que pagas. Sin cargos ocultos, sin taxímetro.',
    feat3_title: 'Conductores Multilingües',
    feat3_text: 'Chóferes profesionales y discretos que hablan tu idioma.',
    feat4_title: 'Confort Premium',
    feat4_text: 'Vehículos business impecables, agua a bordo, sillas infantiles bajo petición.',

    fleet_eyebrow: 'Nuestra Flota',
    fleet_title: 'Elige Tu Clase',
    car1_badge: 'Van Business',
    car1_desc: 'El buque insignia de nuestra flota. Espacio de primera clase para familias y grupos — interior de cuero, zonas de clima y sitio para el equipaje de todos.',
    car2_badge: 'Berlina Confort',
    car2_desc: 'Una elegante berlina business para viajeros solos y parejas. Suave, silenciosa y refinada — perfecta para traslados al aeropuerto.',
    car3_badge: 'SUV Premium',
    car3_desc: 'Un imponente SUV premium para quienes valoran presencia y potencia. Seguro en carreteras de montaña, refinado en la ciudad.',
    car4_badge: 'Van para Grupos',
    car4_desc: 'Espacio para todo el grupo. Ocho cómodos asientos y sitio para el equipaje de todos — ideal para grupos y familias numerosas.',
    car_pax: 'pasajeros',
    car_bags: 'maletas',
    car_book: 'Reservar Este Coche',

    booking_eyebrow: 'Reserva',
    booking_title: 'Reserva Tu Traslado',
    booking_note: 'Rellena el formulario — confirmaremos el viaje y el precio exacto en breve.',
    f_pickup: 'Punto de recogida',
    f_dest: 'Destino',
    f_addr_ph: 'Dirección, aeropuerto, hotel...',
    f_date: 'Fecha',
    f_time: 'Hora',
    f_pax: 'Pasajeros',
    f_bags: 'Equipaje',
    f_phone: 'Teléfono de contacto',
    f_phone_ph: '+39 ...',
    f_submit: 'Consultar Precio',
    f_or: 'o',
    f_whatsapp: 'Reservar por WhatsApp',
    f_wa_msg: '¡Hola! Quiero reservar un traslado.',
    f_success: '¡Gracias por tu solicitud! Un gestor te contactará por WhatsApp en breve.',
    f_error: 'Por favor, rellena correctamente todos los campos obligatorios.',

    stats_eyebrow: 'Por Qué Nosotros',
    stats_title: 'Los números hablan más que las palabras',
    stats1: 'Años de experiencia',
    stats2: 'Traslados realizados',
    stats3: 'Clientes satisfechos',
    stats4: 'Asistencia por WhatsApp',

    nav_reviews: 'Reseñas',
    reviews_eyebrow: 'Reseñas',
    reviews_title: 'Lo Que Dicen Nuestros Clientes',
    rev1_text: 'Impecable de principio a fin. El conductor nos esperaba en llegadas con un cartel, ayudó con todas las maletas y el coche estaba impecable. Llegamos a nuestro hotel del Lago de Como totalmente relajados.',
    rev2_text: 'Reservé un traslado desde Fiumicino para una reunión de negocios. Puntual al minuto, viaje silencioso, precio fijo sin sorpresas. Exactamente lo que debe ser un servicio premium.',
    rev3_text: 'Viajamos siete personas con una montaña de equipaje — la Caravelle lo tragó todo. El conductor fue paciente con los niños y hasta nos recomendó una parada para comer. ¡Muy recomendable!',

    footer_tag: 'Traslados privados premium por toda Italia.',
    footer_contacts: 'Contacto',
    footer_menu: 'Menú',
    footer_rights: 'Todos los derechos reservados.'
  },

  ru: {
    nav_about: 'О нас',
    nav_fleet: 'Автопарк',
    nav_booking: 'Бронирование',
    nav_contacts: 'Контакты',

    hero_eyebrow: 'Частный трансферный сервис',
    hero_title: 'Премиальные частные трансферы по Италии',
    hero_slogan: 'Комфорт. Пунктуальность. Стиль.',
    hero_badge: 'Лучшая цена в Европе',
    hero_cta: 'Узнать цену',
    hero_cta2: 'Наш автопарк',

    about_eyebrow: 'О нас',
    about_title: 'Путешествуйте по Италии первым классом',
    about_text: 'VIP Transfer Italy — премиальные частные трансферы по всей стране: аэропорты, отели, озёра, горнолыжные курорты и поездки между городами. Одна машина, один водитель, одна фиксированная цена. Без очередей, стресса и сюрпризов.',
    feat1_title: 'Всегда вовремя',
    feat1_text: 'Отслеживаем рейс, ожидание бесплатно. Мы на месте до вашей посадки.',
    feat2_title: 'Фиксированная цена',
    feat2_text: 'Цена, которую вы подтвердили, — это цена, которую вы платите. Без скрытых доплат.',
    feat3_title: 'Англоговорящие водители',
    feat3_text: 'Профессиональные, деликатные водители, говорящие на вашем языке.',
    feat4_title: 'Премиальный комфорт',
    feat4_text: 'Безупречные автомобили бизнес-класса, вода в салоне, детские кресла по запросу.',

    fleet_eyebrow: 'Автопарк',
    fleet_title: 'Выберите свой класс',
    car1_badge: 'Бизнес-вэн',
    car1_desc: 'Флагман нашего автопарка. Первоклассный простор для семей и групп — кожаный салон, климат-зоны и место для багажа каждого.',
    car2_badge: 'Комфорт-седан',
    car2_desc: 'Элегантный бизнес-седан для одиночных путешественников и пар. Плавный, тихий и утончённый — идеален для трансферов из аэропорта.',
    car3_badge: 'Премиум-внедорожник',
    car3_desc: 'Статусный премиальный внедорожник для тех, кто ценит присутствие и мощь. Уверен на горных дорогах, утончён в городе.',
    car4_badge: 'Микроавтобус',
    car4_desc: 'Простор для всей компании. Восемь комфортных мест и место для багажа каждого — идеален для групп и больших семей.',
    car_pax: 'пассажиров',
    car_bags: 'чемоданов',
    car_book: 'Забронировать это авто',

    booking_eyebrow: 'Бронирование',
    booking_title: 'Забронируйте трансфер',
    booking_note: 'Заполните форму — мы подтвердим поездку и точную цену в ближайшее время.',
    f_pickup: 'Откуда',
    f_dest: 'Куда',
    f_addr_ph: 'Адрес, аэропорт, отель...',
    f_date: 'Дата',
    f_time: 'Время',
    f_pax: 'Пассажиры',
    f_bags: 'Багаж',
    f_phone: 'Контактный телефон',
    f_phone_ph: '+39 ...',
    f_submit: 'Узнать цену',
    f_or: 'или',
    f_whatsapp: 'Забронировать в WhatsApp',
    f_wa_msg: 'Здравствуйте! Хочу забронировать трансфер.',
    f_success: 'Спасибо за заказ! С вами свяжется менеджер в WhatsApp.',
    f_error: 'Пожалуйста, заполните все обязательные поля корректно.',

    stats_eyebrow: 'Почему мы',
    stats_title: 'Цифры говорят громче слов',
    stats1: 'Лет опыта',
    stats2: 'Выполненных трансферов',
    stats3: 'Довольных клиентов',
    stats4: 'Поддержка в WhatsApp',

    nav_reviews: 'Отзывы',
    reviews_eyebrow: 'Отзывы',
    reviews_title: 'Что говорят наши клиенты',
    rev1_text: 'Безупречно от начала до конца. Водитель ждал в зале прилёта с табличкой, помог со всеми чемоданами, машина идеально чистая. Доехали до отеля на озере Комо совершенно расслабленными.',
    rev2_text: 'Бронировал трансфер из Фьюмичино на деловую встречу. Вовремя с точностью до минуты, тихая поездка, фиксированная цена без сюрпризов. Именно таким и должен быть премиум-сервис.',
    rev3_text: 'Ехали всемером с горой багажа — Caravelle вместила всё. Водитель был терпелив с детьми и даже посоветовал отличное место для обеда. Очень рекомендуем!',

    footer_tag: 'Премиальные частные трансферы по Италии.',
    footer_contacts: 'Контакты',
    footer_menu: 'Меню',
    footer_rights: 'Все права защищены.'
  }
};

/* ============================================================
   ЛОКАЛІЗАЦІЯ
   ============================================================ */
let currentLang = 'en'; // мова за замовчуванням — англійська

const LANG_META = {
  en: '🇬🇧 EN',
  it: '🇮🇹 IT',
  es: '🇪🇸 ES',
  ru: '🇷🇺 RU'
};

const langSwitch = document.getElementById('langSwitch');
const langToggle = document.getElementById('langToggle');
const langMenu = document.getElementById('langMenu');

function applyLang(lang) {
  currentLang = lang;
  const dict = I18N[lang];

  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (dict[key] !== undefined) el.placeholder = dict[key];
  });

  langToggle.innerHTML = LANG_META[lang] + ' <i>▾</i>';
  langMenu.querySelectorAll('button').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });

  try { localStorage.setItem('vti_lang', lang); } catch (e) { /* ignore */ }
}

langToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  langSwitch.classList.toggle('is-open');
});
langMenu.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', () => {
    applyLang(btn.dataset.lang);
    langSwitch.classList.remove('is-open');
  });
});
document.addEventListener('click', (e) => {
  if (!langSwitch.contains(e.target)) langSwitch.classList.remove('is-open');
});

// відновлюємо збережену мову (якщо була)
try {
  const saved = localStorage.getItem('vti_lang');
  if (saved && I18N[saved]) applyLang(saved);
} catch (e) { /* ignore */ }

/* ============================================================
   ШАПКА: фон при скролі + мобільне меню
   ============================================================ */
const header = document.getElementById('header');
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  header.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });

burger.addEventListener('click', () => {
  burger.classList.toggle('is-open');
  nav.classList.toggle('is-open');
});
nav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
  });
});

/* ============================================================
   АНІМАЦІЇ ПРИ СКРОЛІ (IntersectionObserver)
   ============================================================ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

let revealsStarted = false;
function startReveals() {
  if (revealsStarted) return;
  revealsStarted = true;
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/* ============================================================
   ІНТРО-ЛОАДЕР: лічильник 000→100, потім екран їде вгору.
   Показується раз за сесію; анімації сайту стартують після нього.
   ============================================================ */
(function () {
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loaderFill');
  const num = document.getElementById('loaderNum');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seen = false;
  try { seen = !!sessionStorage.getItem('vti_intro'); } catch (e) { /* ignore */ }

  if (!loader || reduced || seen) {
    if (loader) loader.remove();
    startReveals();
    return;
  }

  document.documentElement.style.overflow = 'hidden';
  window.scrollTo(0, 0); // інтро завжди починається з верху сторінки
  const FILL_MS = 1300;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let t0 = null;

  function frame(ts) {
    if (t0 === null) t0 = ts;
    const p = Math.min((ts - t0) / FILL_MS, 1);
    const v = Math.round(ease(p) * 100);
    fill.style.width = v + '%';
    num.textContent = String(v).padStart(3, '0');
    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      loader.classList.add('done');
      try { sessionStorage.setItem('vti_intro', '1'); } catch (e) { /* ignore */ }
      setTimeout(() => {
        document.documentElement.style.overflow = '';
        startReveals();
        setTimeout(() => loader.remove(), 400);
      }, 550);
    }
  }
  requestAnimationFrame(frame);
})();

/* ============================================================
   СТАТИСТИКА: цифри набігають, коли панель з'являється на екрані
   ============================================================ */
const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    statsObserver.unobserve(entry.target);
    const el = entry.target;
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const DUR = 1500;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / DUR, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stats__num').forEach(el => statsObserver.observe(el));

/* ============================================================
   АВТОПІДКАЗКИ АДРЕС — Nominatim (OpenStreetMap)
   ------------------------------------------------------------
   - запити тільки після 3+ символів, debounce 400 мс
   - результати обмежені Італією (countrycodes=it)
   - Примітка щодо User-Agent: браузер НЕ дозволяє змінювати
     заголовок User-Agent у fetch (це "forbidden header").
     Nominatim usage policy для браузерних застосунків
     задовольняється заголовком Referer, який браузер додає
     автоматично. Якщо API недоступний — користувач просто
     продовжує вводити адресу вручну, форма не блокується.
   ============================================================ */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function setupAutocomplete(inputId, listId) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  let abortCtrl = null;

  const closeList = () => {
    list.classList.remove('is-open');
    list.innerHTML = '';
  };

  // Два незалежні джерела підказок, запитуються ПАРАЛЕЛЬНО:
  // 1) Nominatim — добре розуміє кирилицю, але жорстко ріже запити
  //    за IP (мобільні оператори часто заблоковані)
  // 2) Photon (komoot) — лояльний до мобільних IP, чудовий для латиниці
  // Використовуємо перший непорожній результат (пріоритет — Nominatim).
  async function fetchNominatim(query, signal) {
    const url = 'https://nominatim.openstreetmap.org/search'
      + '?q=' + encodeURIComponent(query)
      + '&format=json&countrycodes=it&limit=5&addressdetails=0'
      + '&accept-language=' + currentLang;
    const res = await fetch(url, { signal, headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Nominatim HTTP ' + res.status);
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map(p => p.display_name).filter(Boolean);
  }

  async function fetchPhoton(query, signal) {
    // bbox ≈ Італія; Photon не приймає lang=ru, тому завжди en
    const url = 'https://photon.komoot.io/api/'
      + '?q=' + encodeURIComponent(query)
      + '&limit=5&lang=en&bbox=6.6,35.4,18.6,47.2';
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error('Photon HTTP ' + res.status);
    const data = await res.json();
    return (data.features || []).map(f => {
      const p = f.properties || {};
      return [p.name, p.street, p.housenumber, p.city, p.state, p.country]
        .filter(Boolean).join(', ');
    }).filter(Boolean);
  }

  const search = debounce(async (query) => {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();
    const signal = abortCtrl.signal;

    try {
      const results = await Promise.allSettled([
        fetchNominatim(query, signal),
        fetchPhoton(query, signal)
      ]);
      if (signal.aborted) return;

      const nomi = results[0].status === 'fulfilled' ? results[0].value : [];
      const photon = results[1].status === 'fulfilled' ? results[1].value : [];
      // об'єднуємо: спочатку Nominatim, потім унікальні з Photon
      const seen = new Set();
      const items = [];
      [...nomi, ...photon].forEach(name => {
        const key = name.toLowerCase().slice(0, 60);
        if (!seen.has(key) && items.length < 5) { seen.add(key); items.push(name); }
      });

      list.innerHTML = '';

      if (items.length === 0) {
        closeList();
        return;
      }

      items.forEach(display_name => {
        const place = { display_name };
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        const icon = document.createElement('span');
        icon.className = 'ac-icon';
        icon.textContent = '📍';
        li.appendChild(icon);
        li.appendChild(document.createTextNode(place.display_name));
        // pointerdown спрацьовує і для миші, і для тапів на телефоні,
        // ДО blur інпута (mousedown на iOS іноді губиться)
        const pick = (e) => {
          e.preventDefault();
          input.value = place.display_name;
          closeList();
        };
        li.addEventListener('pointerdown', pick);
        li.addEventListener('touchstart', pick, { passive: false });
        list.appendChild(li);
      });
      list.classList.add('is-open');
    } catch (err) {
      // немає інтернету / ліміт API — тихо ігноруємо,
      // користувач продовжує вводити адресу вручну
      if (err.name !== 'AbortError') closeList();
    }
  }, 400);

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (q.length < 3) {
      closeList();
      return;
    }
    search(q);
  });

  input.addEventListener('blur', () => {
    // затримка, щоб тап/клік по пункту встиг спрацювати (на мобільних
    // події приходять пізніше, тому запас більший)
    setTimeout(closeList, 300);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeList();
  });
}

setupAutocomplete('pickup', 'pickupList');
setupAutocomplete('destination', 'destinationList');

/* ============================================================
   ФОРМА БРОНЮВАННЯ: валідація + відправка
   ============================================================ */
const form = document.getElementById('bookingForm');
const submitBtn = document.getElementById('submitBtn');
const formError = document.getElementById('formError');
const formSuccess = document.getElementById('formSuccess');

// мінімальна дата — сьогодні
document.getElementById('date').min = new Date().toISOString().split('T')[0];

function validateForm() {
  let valid = true;
  const required = ['pickup', 'destination', 'date', 'time', 'phone'];

  required.forEach(id => {
    const el = document.getElementById(id);
    const ok = el.value.trim().length > 0;
    el.classList.toggle('is-invalid', !ok);
    if (!ok) valid = false;
  });

  // валідація телефону: +, цифри, пробіли, дужки, дефіси; 7–15 цифр
  const phone = document.getElementById('phone');
  const digits = phone.value.replace(/\D/g, '');
  const phoneOk = /^[+\d][\d\s\-()]{5,20}$/.test(phone.value.trim())
    && digits.length >= 7 && digits.length <= 15;
  if (!phoneOk) {
    phone.classList.add('is-invalid');
    valid = false;
  }

  return valid;
}

// прибираємо підсвітку помилки при введенні
['pickup', 'destination', 'date', 'time', 'phone'].forEach(id => {
  document.getElementById(id).addEventListener('input', (e) => {
    e.target.classList.remove('is-invalid');
    formError.hidden = true;
  });
});

function collectData() {
  return {
    pickup: document.getElementById('pickup').value.trim(),
    destination: document.getElementById('destination').value.trim(),
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    passengers: document.getElementById('passengers').value,
    luggage: document.getElementById('luggage').value,
    phone: document.getElementById('phone').value.trim()
  };
}

/* ---- ВАРІАНТ A: відправка власнику в Telegram ---- */
async function sendToTelegram(d) {
  const text =
    '🚘 НОВА ЗАЯВКА — VIP Transfer Italy\n\n' +
    '📍 Звідки: ' + d.pickup + '\n' +
    '🏁 Куди: ' + d.destination + '\n' +
    '📅 Дата: ' + d.date + '  🕒 ' + d.time + '\n' +
    '👥 Пасажирів: ' + d.passengers + '\n' +
    '🧳 Багаж: ' + d.luggage + '\n' +
    '📞 Телефон: ' + d.phone;

  const res = await fetch(
    'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
    }
  );
  if (!res.ok) throw new Error('Telegram API error ' + res.status);
}

/* ---- ВАРІАНТ B: відправка на email через FormSubmit.co ---- */
async function sendToFormSubmit(d) {
  const res = await fetch('https://formsubmit.co/ajax/' + FORMSUBMIT_EMAIL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _subject: 'New booking — VIP Transfer Italy',
      Pickup: d.pickup,
      Destination: d.destination,
      Date: d.date,
      Time: d.time,
      Passengers: d.passengers,
      Luggage: d.luggage,
      Phone: d.phone
    })
  });
  if (!res.ok) throw new Error('FormSubmit error ' + res.status);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    formError.hidden = false;
    return;
  }
  formError.hidden = true;

  const data = collectData();

  // одразу показуємо успіх (без перезавантаження сторінки),
  // відправка власнику йде у фоні
  submitBtn.disabled = true;

  try {
    if (USE_FORMSUBMIT) {
      await sendToFormSubmit(data);
    } else if (TELEGRAM_BOT_TOKEN.indexOf('ЗАМІНИ') === -1) {
      await sendToTelegram(data);
    } else {
      // токен ще не налаштований — лише лог для розробника
      console.warn('[VIP Transfer] Заявка не відправлена власнику: ' +
        'вкажи TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID вгорі script.js', data);
    }
  } catch (err) {
    // не блокуємо користувача, якщо сповіщення не пішло —
    // він у будь-якому разі бачить підтвердження і лишив телефон
    console.error('[VIP Transfer] Не вдалося відправити сповіщення:', err);
  }

  form.querySelector('.form__grid').style.display = 'none';
  submitBtn.style.display = 'none';
  formSuccess.hidden = false;
  formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* ============================================================
   КНОПКА "ЗАБРОНЮВАТИ В WHATSAPP"
   Підставляє в повідомлення все, що клієнт уже заповнив у формі
   ============================================================ */
document.getElementById('waBookBtn').addEventListener('click', function () {
  const d = collectData();
  const t = I18N[currentLang];
  const lines = [t.f_wa_msg];
  if (d.pickup)      lines.push('📍 ' + t.f_pickup + ': ' + d.pickup);
  if (d.destination) lines.push('🏁 ' + t.f_dest + ': ' + d.destination);
  if (d.date)        lines.push('📅 ' + d.date + (d.time ? ' 🕒 ' + d.time : ''));
  if (d.passengers)  lines.push('👥 ' + t.f_pax + ': ' + d.passengers);
  if (d.luggage && d.luggage !== '0') lines.push('🧳 ' + t.f_bags + ': ' + d.luggage);
  this.href = 'https://wa.me/393513975476?text=' + encodeURIComponent(lines.join('\n'));
});

/* ============================================================
   ДРІБНИЦІ
   ============================================================ */
document.getElementById('year').textContent = new Date().getFullYear();
