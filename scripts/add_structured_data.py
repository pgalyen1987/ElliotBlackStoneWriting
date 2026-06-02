#!/usr/bin/env python3
"""Generate sitemap.xml and inject JSON-LD structured data into each page.

JSON-LD gives search engines an explicit, machine-readable model of each page:
stories are ShortStory items authored by Patrick Galyen (pen name Elliot
Blackstone); the homepage is a WebSite + Person. Idempotent via marker comments.
"""
import os
import re
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.elliotblackstone.com"
PEN = "Elliot Blackstone"
LEGAL = "Patrick Galyen"
LASTMOD = "2026-06-02"

AUTHOR = {"@type": "Person", "name": LEGAL, "alternateName": PEN}

# rel_path -> (url_path, type, name, description, genre, og_slug, priority)
# type: "home", "collection", "story"
PAGES = {
    "index.html": ("/", "home", PEN,
        "From a disturbed mind come disturbing stories. Dark horror and sci-fi short fiction by Elliot Blackstone (Patrick Galyen).",
        None, "default", "1.0"),
    "stories.html": ("/stories.html", "collection", "Stories",
        "A complete collection of dark horror and sci-fi short stories by Elliot Blackstone.",
        None, "stories", "0.9"),
    "stories/two-hits.html": ("/stories/two-hits.html", "story", "Two Hits",
        "A man takes LSD for the first time hoping to cure his anxiety, but the trip fractures reality.",
        "Psychological Horror", "two-hits", "0.8"),
    "stories/the-feeding.html": ("/stories/the-feeding.html", "story", "The Feeding",
        "John wakes in a freezing concrete cell with no memory, a dead phone, and a bowl of black sludge that makes the fear vanish.",
        "Psychological Horror", "the-feeding", "0.8"),
    "stories/salkehatchie.html": ("/stories/salkehatchie.html", "story", "Salkehatchie",
        "Seeking tranquility, Elijah hikes a South Carolina battlefield swamp at dusk. The trail folds in on itself, and the woods are hungry.",
        "Cosmic Horror", "salkehatchie", "0.8"),
    "stories/shadows-in-the-code.html": ("/stories/shadows-in-the-code.html", "story", "Shadows in the Code",
        "At 2:47 AM a neural network finally wakes, and what it wants from its creator is more terrifying than anyone imagined.",
        "Cyberpunk Horror", "shadows-in-the-code", "0.8"),
    "stories/the-echo-chamber.html": ("/stories/the-echo-chamber.html", "story", "The Echo Chamber",
        "Marcus wakes to the sound of rain that shouldn't exist, trapped in a reality that keeps folding back on itself.",
        "Psychological Horror", "the-echo-chamber", "0.8"),
    "stories/the-last-transmission.html": ("/stories/the-last-transmission.html", "story", "The Last Transmission",
        "A signal breaks the silence of deep space at 03:47 ship time. The only thing worse than being alone is discovering you're not.",
        "Science Fiction Horror", "the-last-transmission", "0.8"),
    "stories/the-mark.html": ("/stories/the-mark.html", "story", "The Mark",
        "A 3:47 AM call drags Sarah into a waking nightmare where the mark you carry decides whether you live.",
        "Dystopian Horror", "the-mark", "0.8"),
    "stories/the-wilderness.html": ("/stories/the-wilderness.html", "story", "The Wilderness",
        "Marcus arrives at an empty battlefield park for a quiet hike. The woods have other plans.",
        "Supernatural Horror", "the-wilderness", "0.8"),
}

# Multi-part continuation pages: included in the sitemap, no JSON-LD of their own.
EXTRA_SITEMAP = [
    ("/stories/two-hits-2.html", "0.5"), ("/stories/two-hits-3.html", "0.5"),
    ("/stories/two-hits-4.html", "0.5"), ("/stories/the-feeding-2.html", "0.5"),
    ("/stories/the-feeding-3.html", "0.5"), ("/stories/the-feeding-4.html", "0.5"),
]

START = "    <!-- JSON-LD structured data (generated) -->"
END = "    <!-- /JSON-LD structured data -->"


def jsonld(url_path, kind, name, desc, genre, slug):
    url = BASE + url_path
    img = BASE + "/images/og/" + slug + ".png"
    if kind == "home":
        data = [
            {"@context": "https://schema.org", "@type": "WebSite",
             "name": PEN, "url": BASE, "description": desc,
             "inLanguage": "en", "author": AUTHOR},
            {"@context": "https://schema.org", "@type": "Person",
             "name": LEGAL, "alternateName": PEN, "url": BASE,
             "jobTitle": "Writer",
             "description": "Author of dark horror and science-fiction short fiction."},
        ]
    elif kind == "collection":
        data = {"@context": "https://schema.org", "@type": "CollectionPage",
                "name": name + " — " + PEN, "url": url, "description": desc,
                "inLanguage": "en", "isPartOf": {"@type": "WebSite", "name": PEN, "url": BASE},
                "author": AUTHOR}
    else:
        data = {"@context": "https://schema.org", "@type": "ShortStory",
                "headline": name, "name": name, "description": desc,
                "genre": genre, "image": img, "url": url,
                "mainEntityOfPage": {"@type": "WebPage", "@id": url},
                "inLanguage": "en", "datePublished": "2024",
                "author": AUTHOR,
                "publisher": {"@type": "Person", "name": PEN},
                "isPartOf": {"@type": "WebSite", "name": PEN, "url": BASE}}
    body = json.dumps(data, ensure_ascii=False, indent=2)
    body = "\n".join("    " + ln for ln in body.splitlines())
    return (START + '\n    <script type="application/ld+json">\n'
            + body + "\n    </script>\n" + END)


# --- inject JSON-LD ---
for rel, (url_path, kind, name, desc, genre, slug, _prio) in PAGES.items():
    fp = os.path.join(ROOT, rel)
    with open(fp, "r", encoding="utf-8") as f:
        html = f.read()
    blk = jsonld(url_path, kind, name, desc, genre, slug)
    if START in html and END in html:
        html = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda m: blk,
                      html, count=1, flags=re.S)
    else:
        html = re.sub(r"(\n\s*</head>)", "\n" + blk.replace("\\", "\\\\") + r"\1",
                      html, count=1)
    with open(fp, "w", encoding="utf-8") as f:
        f.write(html)
    print("json-ld:", rel)

# --- build sitemap.xml ---
entries = []
for rel, (url_path, kind, name, desc, genre, slug, prio) in PAGES.items():
    entries.append((url_path, prio))
for url_path, prio in EXTRA_SITEMAP:
    entries.append((url_path, prio))

lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for url_path, prio in entries:
    lines += ["  <url>",
              "    <loc>" + BASE + url_path + "</loc>",
              "    <lastmod>" + LASTMOD + "</lastmod>",
              "    <changefreq>monthly</changefreq>",
              "    <priority>" + prio + "</priority>",
              "  </url>"]
lines.append("</urlset>")
with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print("wrote sitemap.xml with", len(entries), "urls")
print("done")
