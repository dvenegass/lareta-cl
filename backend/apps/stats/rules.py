"""
Reglas del juego: cuántos puntos da cada cosa, los niveles y los rankings.
Para ajustar el balance basta con cambiar este archivo.
"""

from dataclasses import dataclass

# Una junta cuenta como "con muchos asistentes" desde este número de llegadas.
BIG_EVENT_MIN_ATTENDEES = 5


@dataclass(frozen=True)
class PointRule:
    stat: str  # clave en el diccionario de estadísticas (ver selectors.STAT_KEYS)
    label: str
    points: int


POINT_RULES = (
    PointRule("events_organized", "Crear una junta", 10),
    PointRule("attended", "Asistir", 5),
    PointRule("confirmations", "Confirmar asistencia", 2),
    PointRule("polls_created", "Crear una encuesta", 3),
    PointRule("big_events", f"Organizar una junta con {BIG_EVENT_MIN_ATTENDEES}+ asistentes", 10),
    PointRule("on_time", "Llegar a tiempo", 5),
)


def points_for(stats: dict) -> int:
    return sum(stats[rule.stat] * rule.points for rule in POINT_RULES)


# Los iconos de niveles y rankings los elige el frontend (por `number` / `key`).


@dataclass(frozen=True)
class Level:
    number: int
    name: str
    min_points: int


LEVELS = (
    Level(1, "Recién llegado", 0),
    Level(2, "Juntero", 30),
    Level(3, "Habitué", 80),
    Level(4, "Alma de la fiesta", 160),
    Level(5, "Leyenda", 300),
    Level(6, "Mito viviente", 500),
)


def level_for(points: int) -> tuple[Level, Level | None]:
    """Nivel actual y el siguiente (None si ya está en el máximo)."""
    current = LEVELS[0]
    for level in LEVELS:
        if points >= level.min_points:
            current = level
    following = next((level for level in LEVELS if level.min_points > points), None)
    return current, following


@dataclass(frozen=True)
class Ranking:
    key: str
    title: str
    stat: str
    unit: str


RANKINGS = (
    Ranking("punctual", "El más puntual", "on_time", "llegadas a tiempo"),
    Ranking("late", "El que siempre llega tarde", "late", "llegadas tarde"),
    Ranking("attended", "El que más juntas ha asistido", "attended", "juntas"),
    Ranking("cancelled", "El que más cancela", "cancelled", "cancelaciones"),
    Ranking("soul", "El alma de las juntas", "points", "puntos"),
    Ranking("places", "El que más lugares ha visitado", "places", "lugares"),
    Ranking("organizer", "El organizador oficial", "events_organized", "juntas organizadas"),
    Ranking("spender", "El que más ha gastado", "spent", "plata puesta"),
)

RANKING_SIZE = 3
