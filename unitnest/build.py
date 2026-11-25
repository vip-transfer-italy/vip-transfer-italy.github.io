#!/usr/bin/env python3
"""
UnitNest — static site generator for unit-conversion pages.

Builds ~4000 SEO pages like /175-cm-to-inches/ that answer real search
queries ("175 cm in inches", "70 kg to lbs", "350 f to c"), plus hub pages,
sitemap, robots.txt and optional ads.txt.

Usage:  SITE_URL=https://example.com ADSENSE_CLIENT=ca-pub-XXXX python3 build.py
Output: ./dist   (standard library only, no dependencies)
"""
import html
import json
import os
import shutil
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "dist")
SITE_URL = os.environ.get("SITE_URL", "https://example.github.io/unitnest").rstrip("/")
ADSENSE = os.environ.get("ADSENSE_CLIENT", "").strip()      # ca-pub-XXXXXXXXXXXXXXXX
GA_ID = os.environ.get("GA_ID", "").strip()                  # G-XXXXXXX (optional)
NAME = "UnitNest"

# ---------------------------------------------------------------- units
# key: (singular, plural, symbol, dimension, factor_to_base)
U = {
    "mm": ("millimeter", "millimeters", "mm", "length", 0.001),
    "cm": ("centimeter", "centimeters", "cm", "length", 0.01),
    "m": ("meter", "meters", "m", "length", 1.0),
    "km": ("kilometer", "kilometers", "km", "length", 1000.0),
    "inch": ("inch", "inches", "in", "length", 0.0254),
    "ft": ("foot", "feet", "ft", "length", 0.3048),
    "yd": ("yard", "yards", "yd", "length", 0.9144),
    "mi": ("mile", "miles", "mi", "length", 1609.344),
    "g": ("gram", "grams", "g", "weight", 0.001),
    "kg": ("kilogram", "kilograms", "kg", "weight", 1.0),
    "lb": ("pound", "pounds", "lb", "weight", 0.45359237),
    "oz": ("ounce", "ounces", "oz", "weight", 0.028349523125),
    "st": ("stone", "stone", "st", "weight", 6.35029318),
    "ml": ("milliliter", "milliliters", "ml", "volume", 0.001),
    "l": ("liter", "liters", "L", "volume", 1.0),
    "gal": ("US gallon", "US gallons", "gal", "volume", 3.785411784),
    "floz": ("US fluid ounce", "US fluid ounces", "fl oz", "volume", 0.0295735295625),
    "cup": ("US cup", "US cups", "cup", "volume", 0.2365882365),
    "tbsp": ("tablespoon", "tablespoons", "tbsp", "volume", 0.01478676478125),
    "tsp": ("teaspoon", "teaspoons", "tsp", "volume", 0.00492892159375),
    "kmh": ("kilometer per hour", "kilometers per hour", "km/h", "speed", 1 / 3.6),
    "mph": ("mile per hour", "miles per hour", "mph", "speed", 0.44704),
    "knot": ("knot", "knots", "kn", "speed", 0.514444),
    "sqm": ("square meter", "square meters", "m²", "area", 1.0),
    "sqft": ("square foot", "square feet", "ft²", "area", 0.09290304),
    "acre": ("acre", "acres", "ac", "area", 4046.8564224),
    "ha": ("hectare", "hectares", "ha", "area", 10000.0),
    "c": ("degree Celsius", "degrees Celsius", "°C", "temperature", None),
    "f": ("degree Fahrenheit", "degrees Fahrenheit", "°F", "temperature", None),
    "k": ("kelvin", "kelvins", "K", "temperature", None),
}
# URL words for slugs
SLUG = {"mm": "mm", "cm": "cm", "m": "meters", "km": "km", "inch": "inches", "ft": "feet", "yd": "yards",
        "mi": "miles", "g": "grams", "kg": "kg", "lb": "lbs", "oz": "oz", "st": "stone", "ml": "ml",
        "l": "liters", "gal": "gallons", "floz": "fl-oz", "cup": "cups", "tbsp": "tbsp", "tsp": "tsp",
        "kmh": "kmh", "mph": "mph", "knot": "knots", "sqm": "sqm", "sqft": "sqft", "acre": "acres",
        "ha": "hectares", "c": "celsius", "f": "fahrenheit", "k": "kelvin"}

DIM_TITLE = {"length": "Length", "weight": "Weight", "volume": "Volume & Cooking",
             "speed": "Speed", "area": "Area", "temperature": "Temperature"}


def rng(a, b, step=1):
    out, v = [], a
    while v <= b + 1e-9:
        out.append(round(v, 4))
        v += step
    return out


MARATHON = [5, 10, 21.1, 42.2, 50, 100]
PAIRS = [
    ("cm", "inch", rng(1, 300)),
    ("inch", "cm", rng(1, 120)),
    ("cm", "ft", rng(100, 230)),
    ("ft", "m", rng(1, 100)),
    ("m", "ft", rng(1, 100)),
    ("km", "mi", sorted(set(rng(1, 100) + MARATHON + [150, 200, 250, 300, 400, 500, 1000]))),
    ("mi", "km", sorted(set(rng(1, 100) + [150, 200, 250, 300, 500, 1000]))),
    ("mm", "inch", rng(1, 100)),
    ("inch", "mm", rng(1, 50)),
    ("m", "yd", rng(1, 100)),
    ("kg", "lb", rng(1, 200)),
    ("lb", "kg", rng(1, 400)),
    ("g", "oz", sorted(set(rng(1, 100) + rng(125, 1000, 25)))),
    ("oz", "g", rng(1, 64)),
    ("st", "kg", rng(6, 30)),
    ("kg", "st", rng(40, 150)),
    ("c", "f", rng(-50, 250)),
    ("f", "c", rng(-40, 500)),
    ("c", "k", rng(-50, 100, 5)),
    ("l", "gal", rng(1, 100)),
    ("gal", "l", rng(1, 100)),
    ("ml", "floz", sorted(set(rng(5, 100, 5) + rng(150, 1000, 50)))),
    ("floz", "ml", rng(1, 64)),
    ("cup", "ml", [0.25, 0.33, 0.5, 0.67, 0.75] + rng(1, 10)),
    ("ml", "cup", rng(50, 1000, 50)),
    ("tbsp", "ml", rng(1, 10)),
    ("tsp", "ml", rng(1, 10)),
    ("kmh", "mph", sorted(set(rng(10, 300, 5) + [1, 2, 3, 4, 5, 6, 7, 8, 9]))),
    ("mph", "kmh", rng(5, 200, 5)),
    ("knot", "kmh", rng(5, 100, 5)),
    ("sqm", "sqft", sorted(set(rng(1, 10) + rng(15, 300, 5) + rng(350, 1000, 50)))),
    ("sqft", "sqm", rng(100, 5000, 50)),
    ("acre", "ha", rng(1, 100)),
    ("ha", "acre", rng(1, 100)),
]


# ---------------------------------------------------------------- math
def convert(v, a, b):
    if U[a][3] == "temperature":
        c = {"c": v, "f": (v - 32) * 5 / 9, "k": v - 273.15}[a]
        return {"c": c, "f": c * 9 / 5 + 32, "k": c + 273.15}[b]
    return v * U[a][4] / U[b][4]


def fmt(x):
    if abs(x) >= 1000:
        s = f"{x:,.2f}"
    elif abs(x) >= 100:
        s = f"{x:.2f}"
    elif abs(x) >= 1:
        s = f"{x:.3f}"
    elif x == 0:
        return "0"
    else:
        s = f"{x:.4f}"
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    return s


def vstr(v):
    return str(int(v)) if float(v).is_integer() else fmt(v)


def vslug(v):
    s = vstr(v).replace(",", "")
    return ("minus-" + s[1:]) if s.startswith("-") else s


def name(u, v):
    return U[u][0] if abs(v) == 1 else U[u][1]


def feet_inches(cm):
    total = cm / 2.54
    ft, inch = int(total // 12), total - 12 * int(total // 12)
    inch = round(inch, 1)
    if inch >= 12:
        ft, inch = ft + 1, 0
    return f"{ft}′ {vstr(inch)}″"


def formula(a, b):
    if U[a][3] == "temperature":
        return {("c", "f"): "°F = °C × 9/5 + 32", ("f", "c"): "°C = (°F − 32) × 5/9",
                ("c", "k"): "K = °C + 273.15"}[(a, b)]
    f = U[a][4] / U[b][4]
    return f"{U[b][2]} = {U[a][2]} × {fmt(f) if f >= 0.001 else f'{f:.6g}'}"


def pair_slug(a, b):
    return f"{SLUG[a]}-to-{SLUG[b]}"


def page_slug(v, a, b):
    return f"{vslug(v)}-{SLUG[a]}-to-{SLUG[b]}"


# ---------------------------------------------------------------- html
def esc(s):
    return html.escape(str(s), quote=True)


def ad_slot():
    if not ADSENSE:
        return ""
    return (f'<ins class="adsbygoogle ad" style="display:block" data-ad-client="{ADSENSE}" '
            'data-ad-format="auto" data-full-width-responsive="true"></ins>'
            '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>')


def layout(title, desc, path, body, jsonld=()):
    ads = (f'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={ADSENSE}" '
           'crossorigin="anonymous"></script>') if ADSENSE else ""
    ga = (f'<script async src="https://www.googletagmanager.com/gtag/js?id={GA_ID}"></script>'
          f"<script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}"
          f"gtag('js',new Date());gtag('config','{GA_ID}');</script>") if GA_ID else ""
    ld = "".join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in jsonld)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{SITE_URL}{path}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{SITE_URL}{path}">
<meta name="theme-color" content="#0f766e">
<link rel="icon" href="{SITE_URL}/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{SITE_URL}/style.css">
{ads}{ga}{ld}
</head>
<body>
<header class="top"><div class="wrap">
<a class="logo" href="{SITE_URL}/"><span>⇄</span> {NAME}</a>
<nav><a href="{SITE_URL}/#length">Length</a><a href="{SITE_URL}/#weight">Weight</a><a href="{SITE_URL}/#temperature">Temp</a><a href="{SITE_URL}/#volume">Cooking</a></nav>
</div></header>
<main class="wrap">
{body}
</main>
<footer><div class="wrap">
<p>© {date.today().year} {NAME} — free, fast unit converters. <a href="{SITE_URL}/about/">About</a> · <a href="{SITE_URL}/privacy/">Privacy</a></p>
</div></footer>
<script src="{SITE_URL}/app.js" defer></script>
</body>
</html>
"""


def converter_widget(a, b, v=""):
    return f"""<div class="conv" data-from="{a}" data-to="{b}">
<label><input type="number" step="any" inputmode="decimal" value="{esc(v)}" class="conv-in" aria-label="{esc(U[a][1])}"><span>{esc(U[a][2])}</span></label>
<button type="button" class="conv-swap" aria-label="Swap units" data-href="{SITE_URL}/{pair_slug(b, a)}/">⇄</button>
<label><input type="text" readonly class="conv-out" aria-label="{esc(U[b][1])}"><span>{esc(U[b][2])}</span></label>
</div>"""


def value_page(v, a, b, values, related):
    r = convert(v, a, b)
    vs, rs = vstr(v), fmt(r)
    path = f"/{page_slug(v, a, b)}/"
    extra = f" ({feet_inches(v)})" if (a, b) == ("cm", "ft") else ""
    title = f"{vs} {U[a][2]} to {U[b][1]} — {vs} {U[a][2]} = {rs} {U[b][2]}"
    desc = (f"{vs} {name(a, v)} equals {rs} {name(b, r)}{extra}. Instant {U[a][1]} to {U[b][1]} converter "
            f"with formula, step-by-step calculation and conversion table.")
    i = values.index(v)
    near = values[max(0, i - 8): i + 9]
    rows = "".join(
        f'<tr{" class=cur" if x == v else ""}><td><a href="{SITE_URL}/{page_slug(x, a, b)}/">{vstr(x)} {esc(U[a][2])}</a></td>'
        f'<td>{fmt(convert(x, a, b))} {esc(U[b][2])}'
        + (f" <small>{feet_inches(x)}</small>" if (a, b) == ("cm", "ft") else "") + "</td></tr>"
        for x in near
    )
    others = [u for u in U if U[u][3] == U[a][3] and u not in (a, b)]
    alt = "".join(f"<li>{vs} {esc(U[a][2])} = <b>{fmt(convert(v, a, u))}</b> {esc(name(u, convert(v, a, u)))}</li>" for u in others)
    if U[a][3] == "temperature":
        steps = f"<p><code>{esc(formula(a, b))}</code></p><p>{vs} {esc(U[a][2])} → <b>{rs} {esc(U[b][2])}</b></p>"
    else:
        f = U[a][4] / U[b][4]
        steps = (f"<p>1 {esc(U[a][0])} = {fmt(f) if f >= 0.001 else f'{f:.6g}'} {esc(U[b][1])}</p>"
                 f"<p><code>{vs} × {fmt(f) if f >= 0.001 else f'{f:.6g}'} = {rs}</code></p>")
    faq = [
        (f"How many {U[b][1]} is {vs} {U[a][2]}?", f"{vs} {name(a, v)} is equal to {rs} {name(b, r)}{extra}."),
        (f"How do you convert {U[a][1]} to {U[b][1]}?", f"Use the formula {formula(a, b)}."),
    ]
    rel = "".join(f'<li><a href="{SITE_URL}/{s}/">{esc(t)}</a></li>' for s, t in related)
    body = f"""
<p class="crumbs"><a href="{SITE_URL}/">Home</a> › <a href="{SITE_URL}/#{U[a][3]}">{DIM_TITLE[U[a][3]]}</a> › <a href="{SITE_URL}/{pair_slug(a, b)}/">{esc(U[a][2])} to {esc(U[b][2])}</a> › {vs}</p>
<h1>{vs} {esc(U[a][2])} to {esc(U[b][1])}</h1>
<div class="answer">{vs} {esc(name(a, v))} = <b>{rs} {esc(name(b, r))}</b>{esc(extra)}</div>
{converter_widget(a, b, vs.replace(",", ""))}
{ad_slot()}
<h2>How to convert {vs} {esc(U[a][2])} to {esc(U[b][2])}</h2>
{steps}
<h2>{vs} {esc(U[a][2])} in other units</h2>
<ul class="alt">{alt}</ul>
<h2>Nearby values</h2>
<table><thead><tr><th>{esc(U[a][1].capitalize())}</th><th>{esc(U[b][1].capitalize())}</th></tr></thead><tbody>{rows}</tbody></table>
{ad_slot()}
<h2>FAQ</h2>
{''.join(f'<details><summary>{esc(q)}</summary><p>{esc(x)}</p></details>' for q, x in faq)}
<h2>Related converters</h2>
<ul class="links">{rel}</ul>
"""
    jsonld = [
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": x}} for q, x in faq]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": f"{U[a][2]} to {U[b][2]}", "item": f"{SITE_URL}/{pair_slug(a, b)}/"},
            {"@type": "ListItem", "position": 3, "name": f"{vs} {U[a][2]}", "item": SITE_URL + path}]},
    ]
    return path, layout(title, desc, path, body, jsonld)


def pair_page(a, b, values, related):
    path = f"/{pair_slug(a, b)}/"
    title = f"{U[a][1].capitalize()} to {U[b][1].capitalize()} Converter ({U[a][2]} to {U[b][2]})"
    desc = f"Convert {U[a][1]} to {U[b][1]} instantly. Formula: {formula(a, b)}. Free online converter with full conversion chart."
    rows = "".join(
        f'<tr><td><a href="{SITE_URL}/{page_slug(x, a, b)}/">{vstr(x)} {esc(U[a][2])}</a></td><td>{fmt(convert(x, a, b))} {esc(U[b][2])}</td></tr>'
        for x in values
    )
    rel = "".join(f'<li><a href="{SITE_URL}/{s}/">{esc(t)}</a></li>' for s, t in related)
    body = f"""
<p class="crumbs"><a href="{SITE_URL}/">Home</a> › <a href="{SITE_URL}/#{U[a][3]}">{DIM_TITLE[U[a][3]]}</a> › {esc(U[a][2])} to {esc(U[b][2])}</p>
<h1>{esc(U[a][1].capitalize())} to {esc(U[b][1])}</h1>
<p class="lead">Formula: <code>{esc(formula(a, b))}</code></p>
{converter_widget(a, b, vstr(values[min(len(values) - 1, 9)]))}
{ad_slot()}
<h2>{esc(U[a][2])} to {esc(U[b][2])} conversion chart</h2>
<table><thead><tr><th>{esc(U[a][1].capitalize())}</th><th>{esc(U[b][1].capitalize())}</th></tr></thead><tbody>{rows}</tbody></table>
<h2>Related converters</h2>
<ul class="links">{rel}</ul>
"""
    return path, layout(title, desc, path, body)


def home(pairs_by_dim):
    sections = ""
    for dim, pairs in pairs_by_dim.items():
        links = "".join(f'<li><a href="{SITE_URL}/{pair_slug(a, b)}/">{esc(U[a][1].capitalize())} → {esc(U[b][1])}</a></li>'
                        for a, b in pairs)
        sections += f'<h2 id="{dim}">{DIM_TITLE[dim]}</h2><ul class="links">{links}</ul>'
    body = f"""
<h1>Free unit converters</h1>
<p class="lead">Fast, accurate conversions for length, weight, temperature, cooking, speed and area — with formulas and charts.</p>
{converter_widget("cm", "inch", "175")}
{ad_slot()}
{sections}
"""
    title = f"{NAME} — Free Online Unit Converter (cm to inches, kg to lbs, °C to °F)"
    desc = "Free online unit converter: cm to inches, kg to lbs, Celsius to Fahrenheit, km to miles, cups to ml and more. Instant answers with formulas."
    jsonld = [{"@context": "https://schema.org", "@type": "WebSite", "name": NAME, "url": SITE_URL + "/"}]
    return "/", layout(title, desc, "/", body, jsonld)


def static_page(path, title, text):
    return path, layout(f"{title} — {NAME}", title, path, f"<h1>{esc(title)}</h1>{text}")


PRIVACY = """
<p>{name} does not require registration and does not collect personal data directly.</p>
<p>We use third-party services that may set cookies: Google AdSense to show ads and, optionally, Google Analytics
to measure traffic. Google uses cookies to serve ads based on your prior visits to this and other websites.
You can opt out of personalised advertising at <a href="https://www.google.com/settings/ads">Google Ads Settings</a>.
See <a href="https://policies.google.com/technologies/partner-sites">how Google uses data from partner sites</a>.</p>
<p>Conversion results are provided for general information; always double-check critical measurements.</p>
""".format(name=NAME)

ABOUT = f"""
<p>{NAME} is a free collection of fast unit converters. Every page shows the exact formula, a step-by-step
calculation and a conversion chart, so you can trust the result and understand it.</p>
<p>Conversion factors follow international definitions (e.g. 1 inch = 2.54 cm exactly, 1 lb = 0.45359237 kg exactly,
US customary volume units).</p>
"""


def main():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)
    pages = []

    pairs_by_dim = {}
    for a, b, _ in PAIRS:
        pairs_by_dim.setdefault(U[a][3], []).append((a, b))

    for a, b, values in PAIRS:
        dim_pairs = [(x, y) for x, y in pairs_by_dim[U[a][3]] if (x, y) != (a, b)]
        related_pairs = [(pair_slug(x, y), f"{U[x][2]} to {U[y][2]}") for x, y in dim_pairs][:10]
        pages.append(pair_page(a, b, values, related_pairs))
        for v in values:
            rel = list(related_pairs[:6])
            if (b, a) in pairs_by_dim[U[a][3]]:
                rv = round(convert(v, a, b))
                back_vals = [vals for x, y, vals in PAIRS if (x, y) == (b, a)][0]
                if rv in back_vals:
                    rel.insert(0, (page_slug(rv, b, a), f"{vstr(rv)} {U[b][2]} to {U[a][2]}"))
            pages.append(value_page(v, a, b, values, rel))

    pages.append(home(pairs_by_dim))
    pages.append(static_page("/privacy/", "Privacy Policy", PRIVACY))
    pages.append(static_page("/about/", f"About {NAME}", ABOUT))

    for path, content in pages:
        d = os.path.join(OUT, path.strip("/"))
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as f:
            f.write(content)

    for fn in ("style.css", "app.js", "favicon.svg"):
        shutil.copy(os.path.join(HERE, "static", fn), os.path.join(OUT, fn))

    # app.js needs unit data
    data = {k: {"t": v[3], "f": v[4]} for k, v in U.items()}
    with open(os.path.join(OUT, "app.js"), "r+", encoding="utf-8") as f:
        js = f.read()
        f.seek(0)
        f.write("window.UNITS=" + json.dumps(data) + ";\n" + js)

    today = date.today().isoformat()
    # several sitemaps would be needed above 50k URLs; we are far below
    with open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for path, _ in pages:
            f.write(f"<url><loc>{SITE_URL}{path}</loc><lastmod>{today}</lastmod></url>\n")
        f.write("</urlset>\n")
    with open(os.path.join(OUT, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n")
    if ADSENSE:
        with open(os.path.join(OUT, "ads.txt"), "w") as f:
            f.write(f"google.com, {ADSENSE.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n")
    with open(os.path.join(OUT, "404.html"), "w", encoding="utf-8") as f:
        f.write(layout(f"Page not found — {NAME}", "Page not found", "/404.html",
                       f'<h1>Page not found</h1><p><a href="{SITE_URL}/">Go to all converters →</a></p>'))
    with open(os.path.join(OUT, ".nojekyll"), "w") as f:
        f.write("")
    print(f"Built {len(pages)} pages into {OUT} for {SITE_URL} (ads: {'on' if ADSENSE else 'off'})")


if __name__ == "__main__":
    main()
