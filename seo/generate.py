#!/usr/bin/env python3
"""
SEO-генератор сторінок маршрутів для viptransferitaliy.com.

Бере seo/places.json (аеропорти + напрямки) і створює:
  /transfer/<from>-to-<to>/index.html  — сторінка кожного маршруту з цінами
  /transfer/<hub>/index.html           — сторінка кожного аеропорту
  /transfers/index.html                — каталог усіх маршрутів
  /sitemap.xml                         — оновлена карта сайту

Кожна сторінка ловить пошукові запити типу
"Malpensa to Como transfer price", "private taxi Fiumicino Positano"
і веде клієнта в WhatsApp / Telegram / форму бронювання.

Запуск: python3 seo/generate.py   (тільки стандартна бібліотека)
Автоматично запускається GitHub Action'ом (.github/workflows/seo.yml).
"""
import html
import json
import math
import os
import shutil
import urllib.parse
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://viptransferitaliy.com"
PHONE = "+39 351 397 5476"
WA = "393513975476"
TG = "VipTransferIt"
GA_ID = "G-GM8BZHSY4C"
ADS_ID = "AW-18393778159"

# Та сама формула, що й у калькуляторі script.js
PRICE_BASE, PRICE_PER_KM, PRICE_MIN, PRICE_DISCOUNT = 15, 1.4, 35, 0.99

# Класи авто: (назва, множник, мінімум, пасажири, валізи, приклади)
CLASSES = [
    ("Economy", 1.0, 35, 3, 2, "Skoda Octavia, VW Golf"),
    ("Comfort", 1.3, 45, 3, 3, "VW Passat, Toyota RAV4"),
    ("Business", 1.7, 60, 3, 3, "Mercedes E/S-Class"),
    ("Standard Minivan", 2.0, 70, 7, 7, "VW Caravelle, Renault Trafic"),
    ("VIP Minivan", 2.6, 90, 7, 7, "Mercedes V-Class"),
]

MIN_KM, MAX_KM = 3, 330  # відстань по прямій для пар "аеропорт → напрямок"

TAG_TEXT = {
    "lake": "lakeside hotels and villas",
    "ski": "ski resorts and mountain chalets",
    "sea": "seaside hotels and resorts",
    "city": "hotels, apartments and business addresses",
    "port": "cruise terminals",
    "shopping": "outlet and shopping centres",
}


def esc(s):
    return html.escape(str(s), quote=True)


def haversine(a, b):
    r = 6371.0
    p1, p2 = math.radians(a["lat"]), math.radians(b["lat"])
    dp = p2 - p1
    dl = math.radians(b["lon"] - a["lon"])
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def road_km(a, b):
    straight = haversine(a, b)
    factor = 1.45 if b.get("tag") == "ski" else 1.3
    if straight < 15:
        factor = 1.5
    return max(5, round(straight * factor))


def duration_min(km, tag):
    speed = 62 if tag == "ski" else 78
    if km < 40:
        speed = 50
    return int(round((km / speed * 60 + 10) / 5.0) * 5)


def fmt_dur(m):
    h, mm = divmod(m, 60)
    if h == 0:
        return f"{mm} min"
    return f"{h} h {mm:02d} min" if mm else f"{h} h"


def base_price(km):
    return max(PRICE_MIN, PRICE_BASE + PRICE_PER_KM * km) * PRICE_DISCOUNT


def class_prices(km):
    b = base_price(km)
    return [(c[0], int(max(c[2], round(b * c[1] / 5.0) * 5)), c) for c in CLASSES]


def wa_link(text):
    return f"https://wa.me/{WA}?text=" + urllib.parse.quote(text)


CSS = """
:root{--bg:#0a0a0c;--bg2:#111114;--card:#16161a;--gold:#c9a24b;--gold2:#e8c97a;--text:#f2efe9;--muted:#a09a8e;--line:rgba(201,162,75,.22)}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:'Jost','Segoe UI',sans-serif;font-weight:300;line-height:1.65}
a{color:var(--gold2)}
.wrap{max-width:980px;margin:0 auto;padding:0 16px}
header{border-bottom:1px solid var(--line);padding:14px 0;position:sticky;top:0;background:rgba(10,10,12,.92);backdrop-filter:blur(8px);z-index:5}
header .wrap{display:flex;justify-content:space-between;align-items:center;gap:12px}
.logo{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;letter-spacing:.08em;color:var(--text);text-decoration:none;font-size:1.15rem}
.logo em{color:var(--gold);font-style:normal}
.btn{display:inline-block;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:500;letter-spacing:.03em;border:1px solid var(--gold);color:var(--gold2);white-space:nowrap}
.btn--gold{background:linear-gradient(135deg,#b8903a,#e8c97a 50%,#b8903a);color:#0a0a0c;border:0}
.btn--sm{padding:8px 16px;font-size:.9rem}
h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;line-height:1.2}
h1{font-size:clamp(2rem,5vw,3rem);margin:28px 0 12px}
h2{font-size:1.8rem;margin:40px 0 14px;color:var(--gold2)}
h3{font-size:1.25rem;margin-bottom:6px}
.crumbs{font-size:.85rem;color:var(--muted);margin-top:20px}
.crumbs a{color:var(--muted)}
.lead{color:var(--muted);font-size:1.1rem;max-width:720px}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:24px 0}
.fact{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px}
.fact b{display:block;font-size:1.5rem;color:var(--gold2);font-weight:500}
.fact span{color:var(--muted);font-size:.9rem}
.cta{display:flex;flex-wrap:wrap;gap:10px;margin:20px 0}
table{width:100%;border-collapse:collapse;background:var(--card);border-radius:14px;overflow:hidden;border:1px solid var(--line)}
th,td{padding:14px 12px;text-align:left;border-bottom:1px solid var(--line);font-size:.95rem}
th{color:var(--muted);font-weight:400;font-size:.8rem;text-transform:uppercase;letter-spacing:.08em}
td.p{color:var(--gold2);font-weight:500;font-size:1.1rem;white-space:nowrap}
td small{color:var(--muted);display:block}
.note{color:var(--muted);font-size:.85rem;margin-top:8px}
ul.list{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
ul.list a{display:block;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;text-decoration:none;color:var(--text)}
ul.list a small{display:block;color:var(--muted)}
ul.list a:hover{border-color:var(--gold)}
ol.steps{padding-left:20px}
ol.steps li{margin-bottom:8px}
details{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:10px}
summary{cursor:pointer;font-weight:500}
details p{color:var(--muted);margin-top:8px}
footer{border-top:1px solid var(--line);margin-top:60px;padding:28px 0;color:var(--muted);font-size:.9rem}
.fab{position:fixed;right:16px;bottom:16px;z-index:9;background:#25d366;color:#fff;border-radius:999px;padding:14px 20px;text-decoration:none;font-weight:500;box-shadow:0 10px 30px rgba(0,0,0,.5)}
@media(max-width:600px){th:nth-child(2),td:nth-child(2){display:none}.hide-sm{display:none}}
"""

TRACK_JS = """
<script>
document.addEventListener('click',function(e){var a=e.target.closest('a[data-ch]');if(!a||typeof gtag!=='function')return;
gtag('event','contact_click',{channel:a.dataset.ch,placement:'seo_route_page',page:location.pathname});
gtag('event','generate_lead',{method:a.dataset.ch,placement:'seo_route_page'});});
</script>"""


def head(title, desc, path, jsonld):
    ld = "\n".join(
        f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in jsonld
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{SITE}{path}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="VIP Transfer Italy">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{SITE}{path}">
<meta property="og:image" content="{SITE}/images/mercedes-v-class.jpg">
<meta name="theme-color" content="#0a0a0c">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/images/favicon.svg">
<link rel="apple-touch-icon" sizes="180x180" href="/images/favicon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Jost:wght@300;400;500&display=swap" rel="stylesheet">
<script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments);}}gtag('js',new Date());gtag('config','{GA_ID}');gtag('config','{ADS_ID}');</script>
<style>{CSS}</style>
{ld}
</head>
<body>
<header><div class="wrap">
<a class="logo" href="/">VIP TRANSFER <em>ITALY</em></a>
<a class="btn btn--gold btn--sm" data-ch="whatsapp" href="{wa_link('Hello! I would like to book a transfer.')}" target="_blank" rel="noopener">Book on WhatsApp</a>
</div></header>
<main class="wrap">
"""


def foot(wa_text):
    return f"""
</main>
<footer><div class="wrap">
<p><a href="/">VIP Transfer Italy</a> — premium private transfers across Italy, 24/7.
📞 <a href="tel:{PHONE.replace(' ', '')}" data-ch="phone">{PHONE}</a> ·
<a href="https://wa.me/{WA}" data-ch="whatsapp" target="_blank" rel="noopener">WhatsApp</a> ·
<a href="https://t.me/{TG}" data-ch="telegram" target="_blank" rel="noopener">Telegram</a> ·
<a href="/transfers/">All routes</a></p>
<p>© {date.today().year} VIP Transfer Italy.</p>
</div></footer>
<a class="fab" data-ch="whatsapp" href="{wa_link(wa_text)}" target="_blank" rel="noopener">💬 WhatsApp</a>
{TRACK_JS}
</body>
</html>
"""


def breadcrumbs_ld(items):
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": SITE + p} for i, (n, p) in enumerate(items)
        ],
    }


def route_page(r, related_hub, related_dest):
    h, d, km, mins, prices = r["hub"], r["dest"], r["km"], r["min"], r["prices"]
    eco = prices[0][1]
    title = f"{h['short']} to {d['short']} Transfer — Private Car from €{eco} | VIP Transfer Italy"
    desc = (
        f"Private transfer from {h['name']} ({h['code']}) to {d['name']}: ~{km} km, about {fmt_dur(mins)}. "
        f"Fixed price from €{eco}, meet & greet, English-speaking driver, 24/7. Book on WhatsApp."
    )
    path = f"/transfer/{r['slug']}/"
    wa_text = f"Hello! I'd like to book a transfer from {h['name']} to {d['name']}. Date: ... Passengers: ..."
    faq = [
        (f"How much is a taxi from {h['short']} to {d['short']}?",
         f"A private transfer from {h['name']} to {d['name']} starts at €{eco} for an Economy sedan "
         f"and €{prices[4][1]} for a Mercedes V-Class. The price is fixed per car, not per person, and includes "
         f"tolls, fuel, waiting for delayed flights and meet & greet."),
        (f"How long is the drive from {h['short']} to {d['short']}?",
         f"The distance is about {km} km and the drive takes around {fmt_dur(mins)}, depending on traffic."),
        ("Will the driver wait if my flight is delayed?",
         "Yes. We track your flight number and adjust the pickup time automatically. Waiting for flight delays is free."),
        ("How do I pay?",
         "Cash to the driver or bank transfer in advance. The price is confirmed before the ride — no meters, no hidden fees."),
        ("Can I book a return transfer?",
         f"Of course — the return trip from {d['short']} to {h['short']} costs the same. Just mention it in your request."),
    ]
    jsonld = [
        {
            "@context": "https://schema.org",
            "@type": "TaxiService",
            "name": f"Private transfer {h['short']} → {d['short']}",
            "provider": {"@type": "LocalBusiness", "name": "VIP Transfer Italy", "telephone": PHONE, "url": SITE + "/",
                         "image": SITE + "/images/mercedes-v-class.jpg", "priceRange": "€€",
                         "address": {"@type": "PostalAddress", "addressCountry": "IT"}},
            "areaServed": [h["name"], d["name"]],
            "offers": [
                {"@type": "Offer", "name": f"{n} class", "price": p, "priceCurrency": "EUR",
                 "availability": "https://schema.org/InStock", "url": SITE + path}
                for n, p, _ in prices
            ],
        },
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq
            ],
        },
        breadcrumbs_ld([("Home", "/"), ("Transfers", "/transfers/"), (h["short"], f"/transfer/{h['id']}/"),
                        (f"{h['short']} → {d['short']}", path)]),
    ]
    hn, dn = h["name"], d["name"]
    rows = "\n".join(
        f"<tr><td><b>{esc(n)}</b><small>{esc(c[5])}</small></td><td>{c[3]} pax · {c[4]} bags</td>"
        f"<td class=\"p\">€{p}</td><td><a class=\"btn btn--sm\" data-ch=\"whatsapp\" target=\"_blank\" rel=\"noopener\" "
        + 'href="' + esc(wa_link(f"Hello! I would like to book a {n} transfer from {hn} to {dn} (€{p}). Date: ... Passengers: ...")) + '">Book</a></td></tr>'
        for n, p, c in prices
    )
    rows += ("\n<tr><td><b>Microbus</b><small>Mercedes Sprinter</small></td><td>16 pax · 16 bags</td>"
             "<td class=\"p\">On request</td><td><a class=\"btn btn--sm\" data-ch=\"whatsapp\" target=\"_blank\" "
             f"rel=\"noopener\" href=\"{esc(wa_link(wa_text + ' (Microbus)'))}\">Ask</a></td></tr>")

    def lst(items):
        return "\n".join(
            f'<li><a href="/transfer/{x["slug"]}/">{esc(x["hub"]["short"])} → {esc(x["dest"]["short"])}'
            f'<small>{x["km"]} km · from €{x["prices"][0][1]}</small></a></li>' for x in items
        )

    where = TAG_TEXT.get(d.get("tag"), "any address")
    body = f"""
<p class="crumbs"><a href="/">Home</a> › <a href="/transfers/">Transfers</a> › <a href="/transfer/{h['id']}/">{esc(h['short'])}</a> › {esc(d['short'])}</p>
<h1>Private transfer from {esc(h['name'])} to {esc(d['short'])}</h1>
<p class="lead">Door-to-door private car from {esc(h['name'])} ({esc(h['code'])}) to {esc(d['name'])} — including {esc(where)}.
Your driver meets you in arrivals with a name sign, helps with luggage and takes you straight to your address. Fixed price, no queues.</p>
<div class="facts">
<div class="fact"><b>€{eco}</b><span>from, per car</span></div>
<div class="fact"><b>~{km} km</b><span>distance</span></div>
<div class="fact"><b>{fmt_dur(mins)}</b><span>approx. drive</span></div>
<div class="fact"><b>24/7</b><span>any flight time</span></div>
</div>
<div class="cta">
<a class="btn btn--gold" data-ch="whatsapp" target="_blank" rel="noopener" href="{esc(wa_link(wa_text))}">Get exact price on WhatsApp</a>
<a class="btn" data-ch="telegram" target="_blank" rel="noopener" href="https://t.me/{TG}">Telegram</a>
<a class="btn hide-sm" href="/#booking">Booking form</a>
</div>

<h2>Prices {esc(h['short'])} → {esc(d['short'])}</h2>
<table>
<thead><tr><th>Class</th><th>Capacity</th><th>Price</th><th></th></tr></thead>
<tbody>
{rows}
</tbody></table>
<p class="note">Price per vehicle, one way. Includes tolls, fuel, parking, flight tracking and meet &amp; greet. Child seats free on request. Night surcharge may apply 23:00–06:00. The exact price is confirmed before the ride.</p>

<h2>How it works</h2>
<ol class="steps">
<li>Send us your flight number, date, address in {esc(d['short'])} and number of passengers on WhatsApp, Telegram or via the <a href="/#booking">booking form</a>.</li>
<li>We confirm the fixed price and your driver's details — usually within 15 minutes.</li>
<li>Your driver waits in arrivals at {esc(h['name'])} with a name sign, even if your flight is late.</li>
<li>Relax in a clean, air-conditioned car — about {fmt_dur(mins)} later you are at your door in {esc(d['short'])}.</li>
</ol>

<h2>Frequently asked questions</h2>
{''.join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in faq)}

<h2>Other transfers from {esc(h['short'])}</h2>
<ul class="list">{lst(related_hub)}</ul>
"""
    if related_dest:
        body += f"""
<h2>Transfers to {esc(d['short'])} from other airports</h2>
<ul class="list">{lst(related_dest)}</ul>
"""
    return head(title, desc, path, jsonld) + body + foot(wa_text)


def hub_page(h, routes):
    path = f"/transfer/{h['id']}/"
    cheapest = min(r["prices"][0][1] for r in routes)
    title = f"{h['name']} ({h['code']}) Private Transfers — Fixed Prices from €{cheapest}"
    desc = (f"Private transfers from {h['name']} to {len(routes)} destinations: "
            + ", ".join(r["dest"]["short"] for r in routes[:6]) + ". Fixed prices, meet & greet, 24/7.")
    items = "\n".join(
        f'<li><a href="/transfer/{r["slug"]}/">{esc(h["short"])} → {esc(r["dest"]["short"])}'
        f'<small>{r["km"]} km · {fmt_dur(r["min"])} · from €{r["prices"][0][1]}</small></a></li>' for r in routes
    )
    body = f"""
<p class="crumbs"><a href="/">Home</a> › <a href="/transfers/">Transfers</a> › {esc(h['short'])}</p>
<h1>Private transfers from {esc(h['name'])}</h1>
<p class="lead">Fixed-price private cars and minivans from {esc(h['name'])} ({esc(h['code'])}) to hotels, cities, lakes, the sea and ski resorts. Meet &amp; greet in arrivals, free waiting for delayed flights, 24/7.</p>
<div class="cta"><a class="btn btn--gold" data-ch="whatsapp" target="_blank" rel="noopener" href="{esc(wa_link(f'Hello! I need a transfer from {h["name"]}.'))}">Get a price on WhatsApp</a></div>
<h2>Popular destinations</h2>
<ul class="list">{items}</ul>
"""
    jsonld = [breadcrumbs_ld([("Home", "/"), ("Transfers", "/transfers/"), (h["short"], path)])]
    return head(title, desc, path, jsonld) + body + foot(f"Hello! I need a transfer from {h['name']}.")


def index_page(hubs_routes):
    path = "/transfers/"
    total = sum(len(v) for _, v in hubs_routes)
    title = "Airport Transfers in Italy — All Routes & Prices | VIP Transfer Italy"
    desc = f"{total} private transfer routes from Italian airports with fixed prices: Malpensa, Fiumicino, Venice, Naples, Florence, Pisa and more."
    sections = ""
    for h, routes in hubs_routes:
        items = "\n".join(
            f'<li><a href="/transfer/{r["slug"]}/">{esc(r["dest"]["short"])}<small>{r["km"]} km · from €{r["prices"][0][1]}</small></a></li>'
            for r in routes
        )
        sections += f'<h2><a href="/transfer/{h["id"]}/">{esc(h["name"])} ({esc(h["code"])})</a></h2>\n<ul class="list">{items}</ul>\n'
    body = f"""
<p class="crumbs"><a href="/">Home</a> › Transfers</p>
<h1>Private airport transfers in Italy</h1>
<p class="lead">{total} routes with fixed prices. Don't see yours? We drive anywhere in Italy and Europe — just ask on WhatsApp.</p>
{sections}
"""
    jsonld = [breadcrumbs_ld([("Home", "/"), ("Transfers", path)])]
    return head(title, desc, path, jsonld) + body + foot("Hello! I need a transfer in Italy.")


def write(rel, content):
    full = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)


def main():
    with open(os.path.join(ROOT, "seo", "places.json"), encoding="utf-8") as f:
        data = json.load(f)

    routes = []
    for h in data["hubs"]:
        for d in data["destinations"]:
            s = haversine(h, d)
            if MIN_KM <= s <= MAX_KM:
                km = road_km(h, d)
                routes.append({
                    "hub": h, "dest": d, "km": km, "min": duration_min(km, d.get("tag")),
                    "prices": class_prices(km), "slug": f"{h['id']}-to-{d['id']}",
                })

    # чистимо стару генерацію, щоб видалені маршрути не висіли
    out_dir = os.path.join(ROOT, "transfer")
    if os.path.isdir(out_dir):
        shutil.rmtree(out_dir)

    by_hub = {}
    by_dest = {}
    for r in routes:
        by_hub.setdefault(r["hub"]["id"], []).append(r)
        by_dest.setdefault(r["dest"]["id"], []).append(r)
    for lst in list(by_hub.values()) + list(by_dest.values()):
        lst.sort(key=lambda x: x["km"])

    for r in routes:
        rel_hub = [x for x in by_hub[r["hub"]["id"]] if x is not r][:8]
        rel_dest = [x for x in by_dest[r["dest"]["id"]] if x is not r][:6]
        write(f"transfer/{r['slug']}/index.html", route_page(r, rel_hub, rel_dest))

    hubs_routes = []
    for h in data["hubs"]:
        rs = by_hub.get(h["id"], [])
        if rs:
            write(f"transfer/{h['id']}/index.html", hub_page(h, rs))
            hubs_routes.append((h, rs))
    write("transfers/index.html", index_page(hubs_routes))

    today = date.today().isoformat()
    urls = [("/", "1.0", "weekly"), ("/transfers/", "0.9", "weekly")]
    urls += [(f"/transfer/{h['id']}/", "0.8", "weekly") for h, _ in hubs_routes]
    urls += [(f"/transfer/{r['slug']}/", "0.7", "monthly") for r in routes]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u, p, c in urls:
        sm.append(f"  <url><loc>{SITE}{u}</loc><lastmod>{today}</lastmod><changefreq>{c}</changefreq><priority>{p}</priority></url>")
    sm.append("</urlset>\n")
    write("sitemap.xml", "\n".join(sm))

    with open(os.path.join(ROOT, "seo", "urls.txt"), "w") as f:
        f.write("\n".join(SITE + u for u, _, _ in urls) + "\n")

    print(f"Generated {len(routes)} route pages, {len(hubs_routes)} hub pages, sitemap with {len(urls)} URLs")


if __name__ == "__main__":
    main()
