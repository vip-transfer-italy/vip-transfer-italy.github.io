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
const TELEGRAM_BOT_TOKEN = '8942880584:AAEmhwvD4kaDen1cnkv1vB_V0jG2YhxWgwY';
// Заявка приходить УСІМ, хто вказаний у списку.
// Щоб додати ще одного отримувача: він відкриває бота, натискає Start,
// а його chat_id береться з https://api.telegram.org/bot<ТОКЕН>/getUpdates
const TELEGRAM_CHAT_IDS = [
  '8952003342'   // @VipTransferIt (Ioano)
];

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
   GOOGLE ANALYTICS: відстеження важливих дій
   Працює тихо — якщо аналітика не завантажилась (блокувальник
   реклами тощо), сайт продовжує працювати без помилок.
   ============================================================ */
function track(eventName, params) {
  try {
    if (typeof gtag === 'function') gtag('event', eventName, params || {});
  } catch (e) { /* ignore */ }
}

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
    hero_langs: 'We speak',
    hero_title: 'Premium Private Transfers in Italy',
    hero_slogan: 'Comfort. Punctuality. Style.',
    hero_badge: 'Best Price in Europe',
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
    car3_badge: 'Premium SUV',
    car3_desc: 'A commanding premium SUV for those who value presence and power. Confident on mountain roads, refined in the city.',
    car4_badge: 'Premium Van',
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
    f_hh: 'Hour',
    f_mm: 'Min',
    f_pax: 'Passengers',
    f_phone: 'Contact phone',
    f_phone_ph: '+39 ...',
    f_submit: 'Book Now',
    f_or: 'or',
    f_whatsapp: 'Book via WhatsApp',
    f_wa_msg: 'Hello! I would like to book a transfer.',
    f_success: 'Thank you for your order! Our manager will contact you on WhatsApp shortly.',
    f_error: 'Please fill in all required fields correctly.',

    routes_eyebrow: 'Directions',
    routes_title: 'Popular routes',
    routes_note: 'Tap a route to fill in the form — we will send you the exact price.',
    routes_any: 'Any other direction in Italy or Europe — just ask.',

    faq_eyebrow: 'FAQ',
    faq_title: 'Good to know',
    faq_q1: 'What if my flight is delayed?',
    faq_a1: 'We track your flight number and adjust the pickup time automatically. Waiting is free for 60 minutes after landing.',
    faq_q2: 'How do I pay?',
    faq_a2: 'Cash to the driver, or by bank transfer in advance. The price is fixed and confirmed before the ride.',
    faq_q3: 'Do you provide child seats?',
    faq_a3: 'Yes, free of charge. Just mention the age of the children when booking and we will prepare the right seat.',
    faq_q4: 'Where will I meet the driver?',
    faq_a4: 'In the arrivals hall with a name sign. He will help with the luggage and walk you to the car.',
    faq_q5: 'Can I cancel my booking?',
    faq_a5: 'Yes — free cancellation up to 24 hours before the ride. Just message us on WhatsApp or Telegram.',
    faq_q6: 'Do you drive outside Italy?',
    faq_a6: 'Yes. We also handle transfers to Switzerland, France, Austria and other neighbouring countries.',

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
    rf_title: 'Leave your review',
    rf_note: 'Tell us about your ride — we publish every honest review.',
    rf_name: 'Your name',
    rf_name_ph: 'James R.',
    rf_text: 'Your review',
    rf_text_ph: 'How was your transfer?',
    rf_submit: 'Send review',
    rf_error: 'Please add your name and a few words about the ride.',
    rf_success: 'Thank you for your review! It will be published shortly.',

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
    hero_langs: 'Parliamo',
    hero_title: 'Transfer Privati Premium in Italia',
    hero_slogan: 'Comfort. Puntualità. Stile.',
    hero_badge: 'Miglior Prezzo in Europa',
    hero_cta: 'Prenota Ora',
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
    car4_badge: 'Premium Van',
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
    f_hh: 'Ora',
    f_mm: 'Min',
    f_pax: 'Passeggeri',
    f_phone: 'Telefono di contatto',
    f_phone_ph: '+39 ...',
    f_submit: 'Prenota',
    f_or: 'oppure',
    f_whatsapp: 'Prenota su WhatsApp',
    f_wa_msg: 'Salve! Vorrei prenotare un transfer.',
    f_success: 'Grazie per la richiesta! Un nostro manager ti contatterà su WhatsApp a breve.',
    f_error: 'Compila correttamente tutti i campi obbligatori.',

    routes_eyebrow: 'Destinazioni',
    routes_title: 'Tratte più richieste',
    routes_note: 'Tocca una tratta per compilare il modulo — ti inviamo il prezzo esatto.',
    routes_any: 'Qualsiasi altra destinazione in Italia o in Europa — chiedi pure.',

    faq_eyebrow: 'FAQ',
    faq_title: 'Buono a sapersi',
    faq_q1: 'E se il mio volo è in ritardo?',
    faq_a1: 'Monitoriamo il numero del volo e adattiamo l\'orario automaticamente. L\'attesa è gratuita per 60 minuti dall\'atterraggio.',
    faq_q2: 'Come si paga?',
    faq_a2: 'In contanti all\'autista, oppure con bonifico in anticipo. Il prezzo è fisso e confermato prima del viaggio.',
    faq_q3: 'Avete seggiolini per bambini?',
    faq_a3: 'Sì, gratuitamente. Indica l\'età dei bambini al momento della prenotazione e prepareremo il seggiolino adatto.',
    faq_q4: 'Dove incontro l\'autista?',
    faq_a4: 'Nell\'area arrivi con un cartello con il tuo nome. Ti aiuterà con i bagagli e ti accompagnerà all\'auto.',
    faq_q5: 'Posso annullare la prenotazione?',
    faq_a5: 'Sì — cancellazione gratuita fino a 24 ore prima del viaggio. Scrivici su WhatsApp o Telegram.',
    faq_q6: 'Viaggiate anche fuori dall\'Italia?',
    faq_a6: 'Sì. Effettuiamo transfer anche verso Svizzera, Francia, Austria e altri paesi confinanti.',

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
    rf_title: 'Lascia la tua recensione',
    rf_note: 'Raccontaci del tuo viaggio — pubblichiamo ogni recensione sincera.',
    rf_name: 'Il tuo nome',
    rf_name_ph: 'Marco B.',
    rf_text: 'La tua recensione',
    rf_text_ph: 'Com\'è andato il transfer?',
    rf_submit: 'Invia recensione',
    rf_error: 'Inserisci il tuo nome e qualche parola sul viaggio.',
    rf_success: 'Grazie per la tua recensione! Sarà pubblicata a breve.',

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
    hero_langs: 'Hablamos',
    hero_title: 'Traslados Privados Premium en Italia',
    hero_slogan: 'Confort. Puntualidad. Estilo.',
    hero_badge: 'Mejor Precio de Europa',
    hero_cta: 'Reservar',
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
    car4_badge: 'Premium Van',
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
    f_hh: 'Hora',
    f_mm: 'Min',
    f_pax: 'Pasajeros',
    f_phone: 'Teléfono de contacto',
    f_phone_ph: '+39 ...',
    f_submit: 'Reservar',
    f_or: 'o',
    f_whatsapp: 'Reservar por WhatsApp',
    f_wa_msg: '¡Hola! Quiero reservar un traslado.',
    f_success: '¡Gracias por tu solicitud! Un gestor te contactará por WhatsApp en breve.',
    f_error: 'Por favor, rellena correctamente todos los campos obligatorios.',

    routes_eyebrow: 'Destinos',
    routes_title: 'Rutas más solicitadas',
    routes_note: 'Toca una ruta para rellenar el formulario — te enviaremos el precio exacto.',
    routes_any: 'Cualquier otro destino en Italia o Europa — solo pregunta.',

    faq_eyebrow: 'FAQ',
    faq_title: 'Bueno saberlo',
    faq_q1: '¿Y si mi vuelo se retrasa?',
    faq_a1: 'Seguimos tu número de vuelo y ajustamos la hora automáticamente. La espera es gratuita durante 60 minutos tras el aterrizaje.',
    faq_q2: '¿Cómo se paga?',
    faq_a2: 'En efectivo al conductor, o por transferencia por adelantado. El precio es fijo y se confirma antes del viaje.',
    faq_q3: '¿Tienen sillas infantiles?',
    faq_a3: 'Sí, sin coste. Indica la edad de los niños al reservar y prepararemos la silla adecuada.',
    faq_q4: '¿Dónde encuentro al conductor?',
    faq_a4: 'En la sala de llegadas con un cartel con tu nombre. Te ayudará con el equipaje y te acompañará al coche.',
    faq_q5: '¿Puedo cancelar la reserva?',
    faq_a5: 'Sí — cancelación gratuita hasta 24 horas antes del viaje. Escríbenos por WhatsApp o Telegram.',
    faq_q6: '¿Viajan fuera de Italia?',
    faq_a6: 'Sí. También realizamos traslados a Suiza, Francia, Austria y otros países vecinos.',

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
    rf_title: 'Deja tu reseña',
    rf_note: 'Cuéntanos sobre tu viaje — publicamos todas las reseñas sinceras.',
    rf_name: 'Tu nombre',
    rf_name_ph: 'Carlos M.',
    rf_text: 'Tu reseña',
    rf_text_ph: '¿Qué tal fue tu traslado?',
    rf_submit: 'Enviar reseña',
    rf_error: 'Añade tu nombre y unas palabras sobre el viaje.',
    rf_success: '¡Gracias por tu reseña! Se publicará en breve.',

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
    hero_langs: 'Мы говорим',
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
    car4_badge: 'Premium Van',
    car4_desc: 'Простор для всей компании. Восемь комфортных мест и место для багажа каждого — идеален для групп и больших семей.',
    car_pax: 'пассажиров',
    car_bags: 'чемоданов',
    car_book: 'Узнать цену на это авто',

    booking_eyebrow: 'Бронирование',
    booking_title: 'Забронируйте трансфер',
    booking_note: 'Заполните форму — мы подтвердим поездку и точную цену в ближайшее время.',
    f_pickup: 'Откуда',
    f_dest: 'Куда',
    f_addr_ph: 'Адрес, аэропорт, отель...',
    f_date: 'Дата',
    f_time: 'Время',
    f_hh: 'Час',
    f_mm: 'Мин',
    f_pax: 'Пассажиры',
    f_phone: 'Контактный телефон',
    f_phone_ph: '+39 ...',
    f_submit: 'Узнать цену',
    f_or: 'или',
    f_whatsapp: 'Узнать цену в WhatsApp',
    f_wa_msg: 'Здравствуйте! Хочу забронировать трансфер.',
    f_success: 'Спасибо за заказ! С вами свяжется менеджер в WhatsApp.',
    f_error: 'Пожалуйста, заполните все обязательные поля корректно.',

    routes_eyebrow: 'Направления',
    routes_title: 'Популярные маршруты',
    routes_note: 'Нажмите на маршрут — он подставится в форму, и мы пришлём точную цену.',
    routes_any: 'Любое другое направление по Италии или Европе — просто спросите.',

    faq_eyebrow: 'Вопросы',
    faq_title: 'Полезно знать',
    faq_q1: 'А если мой рейс задержат?',
    faq_a1: 'Мы отслеживаем номер рейса и сами сдвигаем время подачи. Ожидание бесплатно в течение 60 минут после посадки.',
    faq_q2: 'Как оплатить?',
    faq_a2: 'Наличными водителю, либо переводом заранее. Цена фиксированная и подтверждается до поездки.',
    faq_q3: 'Есть ли детские кресла?',
    faq_a3: 'Да, бесплатно. Укажите возраст детей при бронировании — подготовим подходящее кресло.',
    faq_q4: 'Где я встречу водителя?',
    faq_a4: 'В зале прилёта с табличкой с вашим именем. Он поможет с багажом и проводит до машины.',
    faq_q5: 'Можно ли отменить бронь?',
    faq_a5: 'Да — бесплатная отмена за 24 часа до поездки. Просто напишите нам в WhatsApp или Telegram.',
    faq_q6: 'Возите ли вы за пределы Италии?',
    faq_a6: 'Да. Выполняем трансферы в Швейцарию, Францию, Австрию и другие соседние страны.',

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
    rf_title: 'Оставьте свой отзыв',
    rf_note: 'Расскажите о поездке — мы публикуем каждый честный отзыв.',
    rf_name: 'Ваше имя',
    rf_name_ph: 'Анна С.',
    rf_text: 'Ваш отзыв',
    rf_text_ph: 'Как прошёл ваш трансфер?',
    rf_submit: 'Отправить отзыв',
    rf_error: 'Укажите имя и напишите пару слов о поездке.',
    rf_success: 'Спасибо за отзыв! Он будет опубликован в ближайшее время.',

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

// Страхування: якщо IntersectionObserver недоступний або не спрацьовує
// (деякі вбудовані браузери), перемикаємось на перевірку по скролу —
// інакше блоки залишились би невидимими (opacity: 0).
function revealInView() {
  document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight - 40 && r.bottom > 0) el.classList.add('is-visible');
  });
}

function useScrollFallback() {
  revealInView();
  window.addEventListener('scroll', revealInView, { passive: true });
  window.addEventListener('resize', revealInView);
}

let revealsStarted = false;
function startReveals() {
  if (revealsStarted) return;
  revealsStarted = true;

  if (!('IntersectionObserver' in window)) {
    useScrollFallback();
    return;
  }

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // якщо за 1.2 с жоден блок не з'явився — обсервер не працює
  setTimeout(() => {
    if (!document.querySelector('.reveal.is-visible')) useScrollFallback();
  }, 1200);
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
  const required = ['pickup', 'destination', 'date', 'timeHour', 'timeMinute', 'phone'];

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
['pickup', 'destination', 'date', 'timeHour', 'timeMinute', 'phone'].forEach(id => {
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
    time: (function () {
      const h = document.getElementById('timeHour').value;
      const m = document.getElementById('timeMinute').value;
      return (h && m) ? h + ':' + m : '';   // порожньо, поки не обрано обидва
    })(),
    passengers: document.getElementById('passengers').value,
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
    '📞 Телефон: ' + d.phone;

  // шлемо всім отримувачам паралельно; якщо один чат недоступний
  // (заблокував бота тощо) — інші все одно отримають заявку
  const results = await Promise.allSettled(
    TELEGRAM_CHAT_IDS.map(id => fetch(
      'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: id, text: text })
      }
    ))
  );

  const delivered = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
  if (delivered === 0) throw new Error('Telegram: жоден отримувач не отримав заявку');
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
        'вкажи TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_IDS вгорі script.js', data);
    }
  } catch (err) {
    // не блокуємо користувача, якщо сповіщення не пішло —
    // він у будь-якому разі бачить підтвердження і лишив телефон
    console.error('[VIP Transfer] Не вдалося відправити сповіщення:', err);
  }

  // головна подія для статистики — заявка з форми
  track('generate_lead', {
    method: 'booking_form',
    language: currentLang,
    passengers: data.passengers
  });

  form.querySelector('.form__grid').style.display = 'none';
  submitBtn.style.display = 'none';
  formSuccess.hidden = false;
  formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* ============================================================
   ПОПУЛЯРНІ НАПРЯМКИ: клік підставляє маршрут у форму
   ============================================================ */
document.querySelectorAll('.route').forEach(btn => {
  btn.addEventListener('click', () => {
    const pickup = document.getElementById('pickup');
    const dest = document.getElementById('destination');
    track('select_route', { route: btn.dataset.from + ' -> ' + btn.dataset.to });
    pickup.value = btn.dataset.from;
    dest.value = btn.dataset.to;
    pickup.classList.remove('is-invalid');
    dest.classList.remove('is-invalid');
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ============================================================
   ЛИПКА КНОПКА НА МОБІЛЬНОМУ: з'являється після hero
   і ховається, коли форма бронювання вже на екрані
   ============================================================ */
(function () {
  const bar = document.getElementById('ctaBar');
  const hero = document.getElementById('hero');
  const booking = document.getElementById('booking');
  if (!bar || !hero || !booking) return;

  function update() {
    const pastHero = window.scrollY > hero.offsetHeight * 0.6;
    const b = booking.getBoundingClientRect();
    const bookingVisible = b.top < window.innerHeight && b.bottom > 120;
    bar.classList.toggle('is-shown', pastHero && !bookingVisible);
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ============================================================
   ФОРМА ВІДГУКУ: зірки + відправка власнику на модерацію
   ============================================================ */
(function () {
  const form = document.getElementById('reviewForm');
  if (!form) return;

  const starsBox = document.getElementById('reviewStars');
  const stars = [...starsBox.querySelectorAll('button')];
  const nameInput = document.getElementById('revName');
  const textInput = document.getElementById('revText');
  const errorBox = document.getElementById('reviewError');
  const successBox = document.getElementById('reviewSuccess');
  const submitBtn = document.getElementById('reviewSubmit');
  let rating = 5;

  function paintStars(n) {
    stars.forEach(s => s.classList.toggle('is-on', +s.dataset.value <= n));
  }
  stars.forEach(s => {
    s.addEventListener('click', () => { rating = +s.dataset.value; paintStars(rating); });
    s.addEventListener('mouseenter', () => paintStars(+s.dataset.value));
  });
  starsBox.addEventListener('mouseleave', () => paintStars(rating));

  [nameInput, textInput].forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('is-invalid');
      errorBox.hidden = true;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameOk = nameInput.value.trim().length > 1;
    const textOk = textInput.value.trim().length > 4;
    nameInput.classList.toggle('is-invalid', !nameOk);
    textInput.classList.toggle('is-invalid', !textOk);
    if (!nameOk || !textOk) {
      errorBox.hidden = false;
      return;
    }
    errorBox.hidden = true;
    submitBtn.disabled = true;

    const text =
      '⭐ НОВИЙ ВІДГУК — VIP Transfer Italy\n\n' +
      'Оцінка: ' + '★'.repeat(rating) + '☆'.repeat(5 - rating) + ' (' + rating + '/5)\n' +
      'Ім\'я: ' + nameInput.value.trim() + '\n' +
      'Мова сайту: ' + currentLang.toUpperCase() + '\n\n' +
      nameInput.value.trim() + ':\n"' + textInput.value.trim() + '"';

    try {
      if (TELEGRAM_BOT_TOKEN.indexOf('ЗАМІНИ') === -1) {
        await Promise.allSettled(
          TELEGRAM_CHAT_IDS.map(id => fetch(
            'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: id, text: text })
            }
          ))
        );
      } else {
        console.warn('[VIP Transfer] Відгук не відправлено: не налаштований бот', text);
      }
    } catch (err) {
      console.error('[VIP Transfer] Помилка відправки відгуку:', err);
    }

    track('submit_review', { rating: rating, language: currentLang });

    // клієнт у будь-якому разі бачить подяку
    form.querySelectorAll('.review-form__stars, .form__field, .review-form__note')
      .forEach(el => { el.style.display = 'none'; });
    submitBtn.style.display = 'none';
    successBox.hidden = false;
  });
})();

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
  this.href = 'https://wa.me/393513975476?text=' + encodeURIComponent(lines.join('\n'));
});

/* ============================================================
   ВІДСТЕЖЕННЯ КОНТАКТІВ (WhatsApp / Telegram / телефон)
   ============================================================ */
document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
  a.addEventListener('click', () => {
    track('contact_click', {
      channel: 'whatsapp',
      placement: a.id === 'waBookBtn' ? 'booking_form' : 'floating_button',
      language: currentLang
    });
  });
});

document.querySelectorAll('a[href*="t.me"]').forEach(a => {
  a.addEventListener('click', () => {
    track('contact_click', { channel: 'telegram', language: currentLang });
  });
});

document.querySelectorAll('a[href^="tel:"]').forEach(a => {
  a.addEventListener('click', () => {
    track('contact_click', { channel: 'phone', language: currentLang });
  });
});

/* ============================================================
   ДРІБНИЦІ
   ============================================================ */
document.getElementById('year').textContent = new Date().getFullYear();
