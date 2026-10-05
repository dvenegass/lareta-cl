"""
Búsqueda de GIFs en KLIPY (https://klipy.com).

El navegador nunca habla con KLIPY directamente: pregunta a nuestra API y
Django consulta KLIPY con la clave secreta (KLIPY_API_KEY en el .env).
Aquí también se "aplana" la respuesta de KLIPY a lo poco que usa el chat.
"""

import json
from urllib.error import URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from django.conf import settings

API_BASE = "https://api.klipy.com/api/v1"
TIMEOUT_SECONDS = 6
PER_PAGE = 24
# Solo se aceptan GIFs servidos por KLIPY (evita que un mensaje apunte a cualquier sitio).
ALLOWED_HOST_SUFFIX = "klipy.com"


class GifsUnavailable(Exception):
    """KLIPY no está configurado o no respondió."""


def is_configured() -> bool:
    return bool(settings.KLIPY_API_KEY)


def is_klipy_url(url: str) -> bool:
    parsed = urlparse(url)
    host = parsed.hostname or ""
    return parsed.scheme == "https" and (host == ALLOWED_HOST_SUFFIX or host.endswith("." + ALLOWED_HOST_SUFFIX))


def search(query: str = "", page: int = 1) -> dict:
    """GIFs que coinciden con `query` (o los del momento, si viene vacío)."""
    if not is_configured():
        raise GifsUnavailable("Los GIFs no están configurados.")

    endpoint = "search" if query else "trending"
    params = {"page": page, "per_page": PER_PAGE, "rating": "pg-13"}
    if query:
        params["q"] = query
    url = f"{API_BASE}/{settings.KLIPY_API_KEY}/gifs/{endpoint}?{urlencode(params)}"

    try:
        with urlopen(Request(url, headers={"Accept": "application/json"}), timeout=TIMEOUT_SECONDS) as response:
            payload = json.load(response)
    except (URLError, TimeoutError, ValueError) as error:
        raise GifsUnavailable("KLIPY no respondió. Inténtalo de nuevo.") from error

    data = payload.get("data") or {}
    results = [gif for gif in (_simplify(item) for item in data.get("data", [])) if gif]
    return {"results": results, "has_next": bool(data.get("has_next"))}


def _pick(files: dict, sizes: tuple[str, ...]) -> dict | None:
    """El primer tamaño disponible (con su versión .gif) de la lista."""
    for size in sizes:
        gif = (files.get(size) or {}).get("gif") or {}
        if gif.get("url"):
            return gif
    return None


def _simplify(item: dict) -> dict | None:
    files = item.get("file") or {}
    full = _pick(files, ("md", "hd", "sm", "xs"))  # el que se envía al chat
    preview = _pick(files, ("sm", "xs", "md"))  # el que se ve en el buscador
    if not full or not preview:
        return None
    return {
        "id": str(item.get("id") or item.get("slug")),
        "title": item.get("title", ""),
        "url": full["url"],
        "width": full.get("width"),
        "height": full.get("height"),
        "preview_url": preview["url"],
        "preview_width": preview.get("width"),
        "preview_height": preview.get("height"),
    }
