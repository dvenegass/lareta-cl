"""
Enlace para compartir una junta (/share/events/<id>/).

WhatsApp y otras apps leen las etiquetas "Open Graph" del HTML para armar la
vista previa, pero no ejecutan JavaScript: por eso esta página la genera
Django (con título, descripción e imagen de la junta) y luego redirige a la
junta en el frontend. Son públicas: cualquiera con el enlace ya puede ver la junta.
"""

from django.conf import settings
from django.db.models import Count, Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from django.utils.formats import date_format
from django.views import View

from .models import Event, EventParticipant
from .share_image import render_event_card


def _event_with_count(event_id) -> Event:
    events = Event.objects.annotate(
        going_count=Count("participants", filter=Q(participants__status=EventParticipant.Status.GOING))
    )
    return get_object_or_404(events, pk=event_id)


# Formato de Django: "miércoles 14 de octubre" (el \d\e escapa la palabra "de").
DAY_FORMAT = r"l j \d\e F"


def _date_line(event: Event) -> str:
    """"miércoles 14 de octubre, 20:00" (en la zona horaria del sitio)."""
    local = timezone.localtime(event.starts_at)
    return f"{date_format(local, DAY_FORMAT)}, {local.strftime('%H:%M')}"


def _going_line(event: Event) -> str:
    return f"{event.going_count} {'confirmado' if event.going_count == 1 else 'confirmados'}"


class EventSharePageView(View):
    def get(self, request, event_id):
        event = _event_with_count(event_id)
        base = settings.FRONTEND_URL.rstrip("/")
        context = {
            "title": event.title,
            "description": f"{_date_line(event)} · {event.location} · {_going_line(event)}. ¿Vienes?",
            "image_url": f"{base}/share/events/{event.pk}/image.png",
            "share_url": f"{base}/share/events/{event.pk}/",
            "app_url": f"{base}/events/{event.pk}",
        }
        return render(request, "events/share.html", context)


class EventShareImageView(View):
    def get(self, request, event_id):
        event = _event_with_count(event_id)
        png = render_event_card(
            title=event.title,
            date_line=_date_line(event),
            place_line=event.location,
            footer=f"{_going_line(event)} · ¿Vienes? Confirma en reta.cl",
        )
        response = HttpResponse(png, content_type="image/png")
        response["Cache-Control"] = "public, max-age=300"  # 5 min: se actualiza si cambia la junta
        return response
