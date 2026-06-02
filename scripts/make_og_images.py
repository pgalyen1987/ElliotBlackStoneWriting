#!/usr/bin/env python3
"""Generate 1200x630 Open Graph share cards for each story / page.

Layout: a sharp cover-cropped art panel on the left, a dark text panel on the
right with category, title, a one-line hook, and the author credit. The full
card uses a blurred, darkened copy of the art as an atmospheric background.
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "images")
OUT = os.path.join(IMG, "og")
os.makedirs(OUT, exist_ok=True)

W, H = 1200, 630
ART_W = 560                       # width of the left art panel
PAD = 60                          # text padding
TEXT_X = ART_W + 55               # left edge of text column
TEXT_RIGHT = W - PAD              # right edge of text column
TEXT_W = TEXT_RIGHT - TEXT_X

BG = (10, 15, 10)
ACCENT = (139, 181, 107)          # moss/forest green accent (matches site theme)
TITLE_COL = (245, 243, 250)
BODY_COL = (176, 176, 188)
CREDIT_COL = (138, 138, 150)

FONT = "/usr/share/fonts/truetype/dejavu/%s"
f_cat = ImageFont.truetype(FONT % "DejaVuSans-Bold.ttf", 26)
f_title = ImageFont.truetype(FONT % "DejaVuSerif-Bold.ttf", 60)
f_title_sm = ImageFont.truetype(FONT % "DejaVuSerif-Bold.ttf", 48)
f_body = ImageFont.truetype(FONT % "DejaVuSans.ttf", 27)
f_credit = ImageFont.truetype(FONT % "DejaVuSans-Bold.ttf", 24)


def cover(src, tw, th):
    """Scale + center-crop src to exactly fill tw x th."""
    sw, sh = src.size
    scale = max(tw / sw, th / sh)
    nw, nh = int(sw * scale + 0.5), int(sh * scale + 0.5)
    r = src.resize((nw, nh), Image.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return r.crop((left, top, left + tw, top + th))


def wrap(draw, text, font, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def make_card(out_name, art_path, category, title, hook):
    art = Image.open(art_path).convert("RGB")

    # Atmospheric blurred background across the whole card.
    bg = cover(art, W, H).filter(ImageFilter.GaussianBlur(34))
    bg = ImageEnhance.Brightness(bg).enhance(0.32)
    card = Image.new("RGB", (W, H), BG)
    card.paste(bg, (0, 0))

    # Sharp art panel on the left.
    panel = cover(art, ART_W, H)
    card.paste(panel, (0, 0))

    # Dark gradient sweeping from the art into the text column for legibility.
    grad = Image.new("L", (W, 1), 0)
    g0, g1 = ART_W - 120, ART_W + 90
    for x in range(W):
        if x <= g0:
            a = 0
        elif x >= g1:
            a = 235
        else:
            a = int(235 * (x - g0) / (g1 - g0))
        grad.putpixel((x, 0), a)
    grad = grad.resize((W, H))
    shade = Image.new("RGB", (W, H), BG)
    card = Image.composite(shade, card, grad)

    draw = ImageDraw.Draw(card)

    # Accent rule + category (letter-spaced).
    y = 92
    draw.rectangle([TEXT_X, y, TEXT_X + 56, y + 4], fill=ACCENT)
    y += 22
    cat = " ".join(category.upper())
    draw.text((TEXT_X, y), cat, font=f_cat, fill=ACCENT)
    y += 58

    # Title (wrapped, drop to smaller font if it would overflow vertically).
    tfont = f_title
    lines = wrap(draw, title, tfont, TEXT_W)
    if len(lines) > 3:
        tfont = f_title_sm
        lines = wrap(draw, title, tfont, TEXT_W)
    lh = tfont.size + 12
    for ln in lines:
        draw.text((TEXT_X, y), ln, font=tfont, fill=TITLE_COL)
        y += lh
    y += 18

    # Hook / one-line description.
    for ln in wrap(draw, hook, f_body, TEXT_W)[:3]:
        draw.text((TEXT_X, y), ln, font=f_body, fill=BODY_COL)
        y += f_body.size + 10

    # Author credit pinned near the bottom.
    cy = H - 78
    draw.text((TEXT_X, cy), "ELLIOT BLACKSTONE", font=f_credit, fill=ACCENT)
    draw.text((TEXT_X, cy + 32), "by Patrick Galyen", font=f_body, fill=CREDIT_COL)

    path = os.path.join(OUT, out_name)
    card.save(path, "PNG", optimize=True)
    print("wrote", path, card.size)


P = lambda n: os.path.join(IMG, n)
FOREST = P("dark_forest.jpg")

JOBS = [
    ("two-hits.png", P("2HitsPreview.png"), "Psychological Horror", "Two Hits",
     "A man takes LSD for the first time to quiet his anxiety. Reality has other plans."),
    ("the-feeding.png", P("the_feeding.png"), "Psychological Horror", "The Feeding",
     "A cold cell, no memory, a dead phone, and a bowl of black sludge that makes the fear go away."),
    ("salkehatchie.png", P("salkehatchie.png"), "Cosmic Horror", "Salkehatchie",
     "A quiet hike through a battlefield swamp folds in on itself. The woods are hungry."),
    ("shadows-in-the-code.png", FOREST, "Cyberpunk Horror", "Shadows in the Code",
     "A neural network wakes at 2:47 AM. What it wants is worse than anyone imagined."),
    ("the-echo-chamber.png", FOREST, "Psychological Horror", "The Echo Chamber",
     "Marcus wakes to rain that shouldn't exist, trapped in a reality that folds back on itself."),
    ("the-last-transmission.png", FOREST, "Sci-Fi Horror", "The Last Transmission",
     "A signal breaks the silence of deep space. The only thing worse than being alone is finding out you're not."),
    ("the-mark.png", FOREST, "Dystopian Horror", "The Mark",
     "A 3:47 AM call drags Sarah into a waking nightmare where the mark you carry decides if you live."),
    ("the-wilderness.png", FOREST, "Supernatural Horror", "The Wilderness",
     "An empty battlefield park, a quiet hike. The woods have other plans and will not let him leave."),
    ("default.png", FOREST, "Dark Horror & Sci-Fi", "Elliot Blackstone",
     "From a disturbed mind come disturbing stories. Tales of horror and the dark unknown."),
    ("stories.png", FOREST, "Short Fiction", "Stories",
     "A complete collection of dark horror and sci-fi short stories. Journey into the dark."),
]

for job in JOBS:
    make_card(*job)
print("done")
