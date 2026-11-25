# UnitNest — пассивный доход с сайта-конвертера

Сайт бесплатных конвертеров единиц: **3 928 страниц** под реальные поисковые запросы
(«175 cm to inches», «70 kg to lbs», «350 F to C», «1/2 cup to ml»…).
Такие запросы ищут миллионы раз в месяц и не устаревают. Люди приходят из Google →
видят рекламу → вы получаете деньги. Обслуживать ничего не нужно: сайт статический,
хостинг бесплатный, раз в неделю пересобирается сам.

## Запуск (≈10 минут, один раз)

1. **github.com → New repository** → имя например `unitnest`, Public → Create.
2. На странице репозитория: **uploading an existing file** → перетащите *всё содержимое*
   этой папки (включая скрытую папку `.github`) → Commit.
   (Если папка `.github` не перетащилась — создайте файл `.github/workflows/deploy.yml`
   через «Add file → Create new file» и вставьте содержимое.)
3. **Settings → Pages → Source: GitHub Actions.** Через 1–2 минуты сайт будет на
   `https://<ваш-ник>.github.io/unitnest/`.
4. **Google Search Console** (search.google.com/search-console) → добавить сайт →
   Sitemaps → `sitemap.xml`. Так Google быстрее найдёт все страницы.

## Включить заработок

Google AdSense не принимает адреса `*.github.io`, поэтому нужен свой домен (~10 $/год):

1. Купите домен (Cloudflare Registrar, Namecheap, Porkbun).
2. Settings → Pages → Custom domain → ваш домен; у регистратора добавьте DNS-записи,
   которые покажет GitHub.
3. Settings → Secrets and variables → Actions → **Variables**:
   - `SITE_URL` = `https://вашдомен.com`
4. Зарегистрируйтесь в **Google AdSense**, добавьте домен, получите `ca-pub-…` и добавьте
   переменную `ADSENSE_CLIENT` = `ca-pub-…`. Actions → Build & deploy → Run workflow.
   Код рекламы и `ads.txt` вставятся во все страницы автоматически.
   В AdSense включите «Privacy & messaging → European regulations» (баннер согласия для ЕС).
5. (необязательно) `GA_ID` = `G-…` — Google Analytics.

## Чего ожидать

- Google индексирует новый сайт 1–3 месяца; трафик растёт медленно, 6–12 месяцев.
- Доход с такого сайта — центы-доллары за 1000 просмотров, т.е. это небольшой, но реальный
  и полностью пассивный источник. Гарантий никто дать не может.

## Как расширить (по желанию)

Добавить новую пару единиц — одна строка в `PAIRS` в `build.py` (например
`("cm", "m", rng(1, 500))`) → коммит → сайт пересоберётся сам.
Локальная сборка: `python3 build.py` → папка `dist/`.
