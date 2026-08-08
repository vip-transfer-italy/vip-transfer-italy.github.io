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
const TELEGRAM_BOT_TOKEN = 'ЗАМІНИ_НА_СВІЙ_BOT_TOKEN';   // напр. '7123456789:AAH...'
const TELEGRAM_CHAT_ID   = 'ЗАМІНИ_НА_СВІЙ_CHAT_ID';     // напр. '123456789'

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
    hero_cta: 'Book Now',
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
    f_submit: 'Book Now',
    f_success: 'Thank you! We will contact you shortly.',
    f_error: 'Please fill in all required fields correctly.',

    footer_tag: 'Premium private transfers across Italy.',
    footer_contacts: 'Contacts',
    footer_menu: 'Menu',
    footer_rights: 'All rights reserved.'
  },

  ru: {
    nav_about: 'О нас',
    nav_fleet: 'Автопарк',
    nav_booking: 'Бронирование',
    nav_contacts: 'Контакты',

    hero_eyebrow: 'Частный трансферный сервис',
    hero_title: 'Премиальные частные трансферы по Италии',
    hero_slogan: 'Комфорт. Пунктуальность. Стиль.',
    hero_cta: 'Забронировать',
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
    f_submit: 'Забронировать',
    f_success: 'Спасибо! Мы свяжемся с вами в ближайшее время.',
    f_error: 'Пожалуйста, заполните все обязательные поля корректно.',

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

  document.querySelectorAll('.lang-switch__btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });

  try { localStorage.setItem('vti_lang', lang); } catch (e) { /* ignore */ }
}

document.querySelectorAll('.lang-switch__btn').forEach(btn => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
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

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

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

  const search = debounce(async (query) => {
    if (abortCtrl) abortCtrl.abort();
    abortCtrl = new AbortController();

    try {
      const url = 'https://nominatim.openstreetmap.org/search'
        + '?q=' + encodeURIComponent(query)
        + '&format=json&countrycodes=it&limit=5&addressdetails=0'
        + '&accept-language=' + (currentLang === 'ru' ? 'ru' : 'en');

      const res = await fetch(url, {
        signal: abortCtrl.signal,
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('Nominatim HTTP ' + res.status);

      const data = await res.json();
      list.innerHTML = '';

      if (!Array.isArray(data) || data.length === 0) {
        closeList();
        return;
      }

      data.forEach(place => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        const icon = document.createElement('span');
        icon.className = 'ac-icon';
        icon.textContent = '📍';
        li.appendChild(icon);
        li.appendChild(document.createTextNode(place.display_name));
        // mousedown, а не click — щоб спрацювало до blur інпута
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          input.value = place.display_name;
          closeList();
        });
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
    // невелика затримка, щоб mousedown по пункту встиг спрацювати
    setTimeout(closeList, 150);
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
   ДРІБНИЦІ
   ============================================================ */
document.getElementById('year').textContent = new Date().getFullYear();
