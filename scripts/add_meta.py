#!/usr/bin/env python3
"""Insert SEO + social-share meta tags into each page's <head>.

Idempotent: if a page already has a description meta, its block is replaced.
Author is set to Patrick Galyen; social cards point at /images/og/<slug>.png.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://www.elliotblackstone.com"
SITE = "Elliot Blackstone"
AUTHOR = "Patrick Galyen"

# path -> (url_path, og_image_slug, kind, og_title, description, title_tag_override)
# kind: "website" or "article"
PAGES = {
    "index.html": (
        "/", "default", "website",
        "Elliot Blackstone — Dark Horror & Sci-Fi Writer",
        "From a disturbed mind come disturbing stories. Read dark horror and sci-fi short fiction by Elliot Blackstone (Patrick Galyen).",
        None),
    "stories.html": (
        "/stories.html", "stories", "website",
        "Stories — Elliot Blackstone",
        "A complete collection of dark horror and sci-fi short stories by Elliot Blackstone. Journey into darkness and beyond.",
        None),
    "stories/two-hits.html": (
        "/stories/two-hits.html", "two-hits", "article", "Two Hits",
        "A man takes LSD for the first time hoping to cure his anxiety, but the trip fractures reality and the line between real and unreal disappears. A psychological horror story.",
        None),
    "stories/two-hits-2.html": (
        "/stories/two-hits-2.html", "two-hits", "article", "Two Hits (Part 2)",
        "Part 2 of \"Two Hits,\" a psychological horror story by Elliot Blackstone, as the trip fractures reality.",
        "Two Hits (Part 2) - Elliot Blackstone"),
    "stories/two-hits-3.html": (
        "/stories/two-hits-3.html", "two-hits", "article", "Two Hits (Part 3)",
        "Part 3 of \"Two Hits,\" a psychological horror story by Elliot Blackstone, as the trip fractures reality.",
        "Two Hits (Part 3) - Elliot Blackstone"),
    "stories/two-hits-4.html": (
        "/stories/two-hits-4.html", "two-hits", "article", "Two Hits (Part 4)",
        "The conclusion of \"Two Hits,\" a psychological horror story by Elliot Blackstone.",
        "Two Hits (Part 4) - Elliot Blackstone"),
    "stories/the-feeding.html": (
        "/stories/the-feeding.html", "the-feeding", "article", "The Feeding",
        "John wakes in a freezing concrete cell with no memory, a dead phone, and a bowl of black sludge that makes the fear vanish. A psychological horror story.",
        None),
    "stories/the-feeding-2.html": (
        "/stories/the-feeding-2.html", "the-feeding", "article", "The Feeding (Part 2)",
        "Part 2 of \"The Feeding,\" a psychological horror story by Elliot Blackstone.",
        "The Feeding (Part 2) - Elliot Blackstone"),
    "stories/the-feeding-3.html": (
        "/stories/the-feeding-3.html", "the-feeding", "article", "The Feeding (Part 3)",
        "Part 3 of \"The Feeding,\" a psychological horror story by Elliot Blackstone.",
        "The Feeding (Part 3) - Elliot Blackstone"),
    "stories/the-feeding-4.html": (
        "/stories/the-feeding-4.html", "the-feeding", "article", "The Feeding (Part 4)",
        "The conclusion of \"The Feeding,\" a psychological horror story by Elliot Blackstone.",
        "The Feeding (Part 4) - Elliot Blackstone"),
    "stories/salkehatchie.html": (
        "/stories/salkehatchie.html", "salkehatchie", "article", "Salkehatchie",
        "Seeking tranquility, Elijah hikes a South Carolina battlefield swamp at dusk. The trail folds in on itself, and the woods are hungry. A cosmic horror story.",
        None),
    "stories/shadows-in-the-code.html": (
        "/stories/shadows-in-the-code.html", "shadows-in-the-code", "article", "Shadows in the Code",
        "At 2:47 AM a neural network finally wakes, and what it wants from its creator is more terrifying than anyone imagined. A cyberpunk horror story.",
        None),
    "stories/the-echo-chamber.html": (
        "/stories/the-echo-chamber.html", "the-echo-chamber", "article", "The Echo Chamber",
        "Marcus wakes to the sound of rain that shouldn't exist, trapped in a reality that keeps folding back on itself. A psychological horror story.",
        None),
    "stories/the-last-transmission.html": (
        "/stories/the-last-transmission.html", "the-last-transmission", "article", "The Last Transmission",
        "A signal breaks the silence of deep space at 03:47 ship time. The only thing worse than being alone out here is discovering you're not. A sci-fi horror story.",
        None),
    "stories/the-mark.html": (
        "/stories/the-mark.html", "the-mark", "article", "The Mark",
        "A 3:47 AM call drags Sarah into a waking nightmare where compliance is survival and the mark you carry decides whether you live. A dystopian horror story.",
        None),
    "stories/the-wilderness.html": (
        "/stories/the-wilderness.html", "the-wilderness", "article", "The Wilderness",
        "Marcus arrives at an empty battlefield park for a quiet hike. The woods have other plans, and they don't intend to let him leave. A supernatural horror story.",
        None),
}

START = "    <!-- SEO & social meta (generated) -->"
END = "    <!-- /SEO & social meta -->"


def esc(s):
    return (s.replace("&", "&amp;").replace('"', "&quot;")
             .replace("<", "&lt;").replace(">", "&gt;"))


def block(url_path, slug, kind, og_title, desc):
    url = BASE + url_path
    img = BASE + "/images/og/" + slug + ".png"
    d, t, ot = esc(desc), esc(SITE), esc(og_title)
    lines = [
        START,
        f'    <meta name="description" content="{d}">',
        f'    <meta name="author" content="{AUTHOR}">',
        '    <meta name="robots" content="index, follow">',
        f'    <link rel="canonical" href="{url}">',
        f'    <meta property="og:type" content="{kind}">',
        f'    <meta property="og:site_name" content="{t}">',
        f'    <meta property="og:title" content="{ot}">',
        f'    <meta property="og:description" content="{d}">',
        f'    <meta property="og:url" content="{url}">',
        f'    <meta property="og:image" content="{img}">',
        '    <meta property="og:image:width" content="1200">',
        '    <meta property="og:image:height" content="630">',
        f'    <meta property="og:image:alt" content="{ot} — {t}">',
    ]
    if kind == "article":
        lines.append(f'    <meta property="article:author" content="{esc(AUTHOR)}">')
    lines += [
        '    <meta name="twitter:card" content="summary_large_image">',
        f'    <meta name="twitter:title" content="{ot}">',
        f'    <meta name="twitter:description" content="{d}">',
        f'    <meta name="twitter:image" content="{img}">',
        f'    <meta name="twitter:image:alt" content="{ot} — {t}">',
        END,
    ]
    return "\n".join(lines)


for rel, (url_path, slug, kind, og_title, desc, title_override) in PAGES.items():
    fp = os.path.join(ROOT, rel)
    with open(fp, "r", encoding="utf-8") as f:
        html = f.read()

    if title_override:
        html = re.sub(r"<title>.*?</title>",
                      "<title>" + esc(title_override) + "</title>", html, count=1)

    blk = block(url_path, slug, kind, og_title, desc)

    # Replace an existing generated block, else insert right after </title>.
    if START in html and END in html:
        html = re.sub(re.escape(START) + r".*?" + re.escape(END), blk, html,
                      count=1, flags=re.S)
    else:
        html = re.sub(r"(</title>)", r"\1\n" + blk.replace("\\", "\\\\"),
                      html, count=1)

    with open(fp, "w", encoding="utf-8") as f:
        f.write(html)
    print("updated", rel)

print("done")
