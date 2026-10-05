"""
Imagen de vista previa (1200×630) de una junta, para cuando se comparte el enlace
en WhatsApp, Telegram, Discord, etc. Se dibuja con Pillow, en el estilo de reta.cl.
"""

from functools import lru_cache
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1200, 630

BG = (249, 248, 252)
SURFACE = (255, 255, 255)
PRIMARY = (199, 181, 245)
PRIMARY_SOFT = (240, 236, 252)
PRIMARY_TEXT = (46, 36, 71)
TEXT = (38, 32, 52)
MUTED = (112, 106, 128)


# Fuentes a probar, en orden. La de Pillow por defecto no tiene tildes ni ñ,
# así que primero se busca DM Sans en el proyecto y luego fuentes del sistema.
FONTS_DIR = Path(__file__).resolve().parent / "fonts"
FONT_CANDIDATES = {
    "regular": [
        FONTS_DIR / "DMSans-Regular.ttf",
        Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
    ],
    "bold": [
        FONTS_DIR / "DMSans-Bold.ttf",
        Path("C:/Windows/Fonts/segoeuib.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
        Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
    ],
}


@lru_cache
def _font_path(weight: str) -> Path | None:
    return next((path for path in FONT_CANDIDATES[weight] if path.exists()), None)


def _font(size: int, weight: str = "regular"):
    path = _font_path(weight)
    if path:
        return ImageFont.truetype(str(path), size)
    # Último recurso: la fuente de Pillow (sin tildes).
    return ImageFont.load_default(size=size)


def _wrap(draw: ImageDraw.ImageDraw, text: str, font, max_width: int, max_lines: int) -> list[str]:
    """Corta el texto en líneas que quepan; si sobra, termina la última con "…"."""
    lines: list[str] = []
    current = ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)

    if len(lines) > max_lines:
        lines = lines[:max_lines]
        last = lines[-1]
        while last and draw.textlength(f"{last}…", font=font) > max_width:
            last = last[:-1]
        lines[-1] = f"{last.rstrip()}…"
    return lines


def render_event_card(*, title: str, date_line: str, place_line: str, footer: str) -> bytes:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)

    # Formas de fondo, como en la web
    draw.ellipse((870, -150, 1350, 330), outline=PRIMARY, width=44)
    draw.ellipse((-130, 460, 250, 840), fill=PRIMARY_SOFT)

    # Tarjeta con barrita de color a la izquierda
    draw.rounded_rectangle((70, 70, 1130, 560), radius=40, fill=SURFACE)
    draw.rounded_rectangle((70, 110, 84, 520), radius=7, fill=PRIMARY)

    # Logo: isotipo + nombre
    draw.rounded_rectangle((130, 115, 190, 175), radius=18, fill=PRIMARY)
    draw.text((160, 143), "r.", font=_font(40, "bold"), fill=PRIMARY_TEXT, anchor="mm")
    draw.text((208, 145), "reta.cl", font=_font(36, "bold"), fill=TEXT, anchor="lm")

    # Título (hasta 2 líneas)
    y = 215
    title_font = _font(70, "bold")
    for line in _wrap(draw, title, title_font, max_width=930, max_lines=2):
        draw.text((130, y), line, font=title_font, fill=TEXT)
        y += 84

    # Fecha y lugar
    meta_font = _font(36)
    draw.text((130, y + 18), date_line, font=meta_font, fill=MUTED)
    place = _wrap(draw, place_line, meta_font, max_width=930, max_lines=1)[0] if place_line else ""
    draw.text((130, y + 66), place, font=meta_font, fill=MUTED)

    # Pie: "¿Vienes? Confirma en reta.cl"
    footer_font = _font(30)
    footer_width = int(draw.textlength(footer, font=footer_font))
    draw.rounded_rectangle((130, 470, 130 + footer_width + 48, 524), radius=27, fill=PRIMARY_SOFT)
    draw.text((154, 497), footer, font=footer_font, fill=PRIMARY_TEXT, anchor="lm")

    buffer = BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    return buffer.getvalue()
