# lareta.cl

App para organizar juntas con amigos. Backend en Django + DRF (PostgreSQL) y frontend en React + Vite + TypeScript.

## Requisitos

- Python 3.12+
- Node.js 20+ (LTS)
- PostgreSQL 15+

## Base de datos (una sola vez)

Desde `psql` o pgAdmin, con el usuario `postgres`:

```sql
CREATE USER juntas WITH PASSWORD 'juntas';
CREATE DATABASE juntas OWNER juntas;
ALTER USER juntas CREATEDB;  -- para que los tests puedan crear su BD temporal
```

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows (en Linux/macOS: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env          # y revisa DATABASE_URL
python manage.py migrate
python manage.py createsuperuser   # opcional, para /admin
python manage.py runserver
```

`runserver` arranca con **Daphne** (servidor ASGI), que atiende HTTP y también los
WebSockets del chat de grupos.

Tests: `python manage.py test`

**Emails** (p. ej. "Olvidé mi contraseña"): en desarrollo no se envían, se imprimen en la
terminal donde corre `runserver` (ahí verás el enlace). Para enviarlos de verdad, define
`EMAIL_URL` y `DEFAULT_FROM_EMAIL` en `.env` (ver `.env.example`).

## Frontend

En otra terminal, con el backend corriendo:

```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173. Vite reenvía `/api`, `/media`, `/share` y `/ws` (WebSockets) a Django (ver `vite.config.ts`),
así que el navegador ve un solo origen y la cookie de sesión funciona sin CORS.

Comprobar tipos: `npm run typecheck` · Build de producción: `npm run build`

### Usuarios de prueba (solo desarrollo)

Durante el desarrollo se crearon en la BD local `prueba_ana` y `prueba_beto`,
ambos con la contraseña `pastel-junta-2026`. Puedes borrarlos desde `/admin`.

## API

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/auth/csrf/` | Entrega la cookie CSRF |
| POST | `/api/auth/register/` | Crea cuenta e inicia sesión |
| POST | `/api/auth/login/` | Inicia sesión |
| POST | `/api/auth/logout/` | Cierra sesión |
| POST | `/api/auth/password-reset/` | `{"email"}` → envía el enlace (responde igual exista o no; máx. 5/hora) |
| POST | `/api/auth/password-reset/confirm/` | `{"uid", "token", "new_password"}` → cambia la contraseña e inicia sesión |
| GET | `/api/friends/` | Mis amigos |
| GET | `/api/friends/search/?q=` | Buscar personas (con el estado de la relación) |
| GET / POST | `/api/friends/requests/` | Solicitudes recibidas y enviadas / enviar `{"username"}` |
| POST | `/api/friends/requests/{id}/accept/` | Aceptar solicitud |
| DELETE | `/api/friends/requests/{id}/` | Rechazar o cancelar solicitud |
| DELETE | `/api/friends/{user_id}/` | Dejar de ser amigos |
| GET / POST | `/api/groups/` | Mis grupos / crear `{"name", "description", "member_ids"}` |
| GET / PATCH / DELETE | `/api/groups/{id}/` | Ver (solo miembros) / editar, foto (`photo` multipart o `null`) y borrar (quien administra) |
| POST | `/api/groups/{id}/members/` | Agregar a un amigo `{"user_id"}` (cualquier miembro) |
| DELETE | `/api/groups/{id}/members/{user_id}/` | Salirse (uno mismo) o sacar a alguien (quien administra) |
| GET / POST | `/api/groups/{id}/messages/` | Chat del grupo (solo miembros): últimos 50, `?before={id}` anteriores, `?after={id}` nuevos / enviar `{"body"}`, con `image` (multipart, máx. 8 MB) o `{"gif_url", "gif_width", "gif_height"}` (solo GIFs de KLIPY) |
| GET | `/api/gifs/?q=&page=` | Buscar GIFs en KLIPY (vacío = los del momento). 503 si falta `KLIPY_API_KEY` |
| DELETE | `/api/messages/{id}/` | Borrar mensaje del chat (autor o quien administra) |
| WS | `/ws/groups/{id}/chat/` | Avisos en tiempo real del chat (ver "Chat de grupos") |
| GET | `/api/notifications/` | Mis notificaciones (+ `unread_count`); crea los recordatorios pendientes |
| GET | `/api/notifications/unread-count/` | Solo el contador (el frontend lo consulta cada minuto) |
| POST | `/api/notifications/{id}/read/` · `/api/notifications/read-all/` | Marcar leída(s) |
| GET | `/share/events/{id}/` | Enlace para compartir: HTML con vista previa (Open Graph) que redirige a la junta |
| GET | `/share/events/{id}/image.png` | Imagen de vista previa generada para la junta |
| GET | `/api/users/{username}/profile/` | Perfil de alguien: nivel, relación, grupos y juntas en común (estadísticas solo entre amigos) |
| GET / PATCH | `/api/users/me/` | Ver / editar mi perfil (avatar en multipart, `theme_color`, `theme_mode`) |
| GET | `/api/events/?scope=upcoming\|created\|past` | Feed (mías, respondidas y de mis grupos; incluye canceladas marcadas) / las que creé / historial (pasadas, sin canceladas, con `photo_count` y `cover_image`) |
| GET | `/api/events/?group={id}` | Próximas juntas de un grupo (solo miembros) |
| POST | `/api/events/` | Crear junta (`group` opcional; `money_mode`: `none` \| `fixed` \| `shared`, `fee_amount`; secciones `bring_list_enabled`, `polls_enabled`, `comments_enabled`; `bring_items`: lista inicial de "qué llevar") |
| GET | `/api/events/{id}/` | Ver junta (cualquiera con el enlace) |
| PUT / PATCH / DELETE | `/api/events/{id}/` | Editar / borrar (solo el creador) |
| PUT | `/api/events/{id}/attendance/` | `{"status": "going" \| "not_going"}` |
| POST / DELETE | `/api/events/{id}/cancel/` | Organizador: cancelar `{"reason"}` (avisa a quienes iban) / reactivar |
| GET / POST | `/api/events/{id}/photos/` | Álbum de la junta (cualquiera con el enlace) / subir `image` (multipart; una vez empezada, quienes pueden unirse) |
| DELETE | `/api/photos/{id}/` | Borrar foto (quien la subió u organizador) |
| PATCH | `/api/events/{id}/participants/{user_id}/` | Organizador: `{"arrival": "on_time" \| "late" \| "absent" \| null, "fee_paid": bool}` |
| GET / POST | `/api/events/{id}/polls/` | Votaciones de la junta / crear una |
| DELETE | `/api/polls/{id}/` | Borrar votación (autor u organizador) |
| PUT / DELETE | `/api/polls/{id}/vote/` | Votar `{"option": id}` / quitar mi voto |
| GET / POST | `/api/events/{id}/items/` | Lista de "qué llevar" / agregar `{"name"}` |
| PATCH / DELETE | `/api/items/{id}/` | `{"claim": true}` = yo lo llevo, `false` = lo suelto / borrar |
| GET / POST | `/api/events/{id}/comments/` | Comentarios de la junta / comentar `{"body"}` |
| DELETE | `/api/comments/{id}/` | Borrar comentario (autor u organizador) |
| GET / POST | `/api/events/{id}/expenses/` | Resumen de gastos compartidos / anotar gasto |
| DELETE | `/api/expenses/{id}/` | Borrar gasto |
| GET | `/api/stats/me/` | Mis puntos, nivel y desglose |
| GET | `/api/stats/rankings/?group={id}` | Rankings entre mis amigos, o entre los miembros de un grupo |

## Estructura del backend

```
backend/
├── config/settings/   base.py (común) · dev.py · prod.py
└── apps/
    ├── users/         usuario propio (AbstractUser + avatar + tema) y autenticación
    ├── friends/       solicitudes de amistad (pendiente → aceptada)
    ├── groups/        grupos de amigos y sus miembros
    ├── events/        juntas (opcionalmente de un grupo), asistencia, llegada y dinero
    ├── polls/         votaciones dentro de una junta
    ├── expenses/      gastos compartidos (splitting.py: quién le debe a quién)
    ├── bringlist/     lista de "qué llevar" de cada junta
    ├── comments/      comentarios de cada junta
    ├── chat/          chat de cada grupo en tiempo real (Django Channels)
    ├── photos/        álbum de fotos de cada junta
    ├── common/        utilidades compartidas (no es una app): procesar imágenes subidas
    └── stats/         puntos, niveles y rankings (sin tablas: se calcula todo)
```

### Puntos, niveles y rankings

Las reglas están en `apps/stats/rules.py` (puntos por acción, niveles y rankings):
cambia ese archivo para ajustar el balance del juego. Nada se guarda: los puntos se
calculan con los datos reales, así que no se pueden "farmear" ni quedan desincronizados.

- **Crear una junta (+10)** solo cuenta si ya pasó y alguien más confirmó.
- **Asistir (+5) / A tiempo (+5)** dependen de la llegada que marca el organizador.
- **Muchos asistentes (+10)**: 5 o más personas llegaron.
- Los rankings se calculan **entre tus amigos**, o entre los miembros de un grupo.

### Notificaciones

`apps/notifications`: cada app llama a `notifications.services.notify(...)` desde sus
servicios (solicitud de amistad, aceptada, te agregaron a un grupo, junta nueva en tu
grupo, cambió la fecha/lugar). El texto se arma al mostrarla (`messages.py`).

Los **recordatorios** ("«X» es mañana a las 20:00", para juntas a las que vas en las
próximas 24 h) se crean al consultar las notificaciones, sin procesos en segundo plano.
Si más adelante se quieren avisos por email o push, conviene un cron o Celery.

### Juntas canceladas, historial y álbum

- **Cancelar** (solo el organizador, con motivo opcional): la junta sigue visible con un
  aviso, pero `events.services.can_respond` pasa a ser False, así que nadie puede confirmar,
  votar, anotar cosas, comentar ni subir fotos. Se avisa a quienes iban, no cuenta para
  puntos ni rankings y no genera recordatorios. Se puede **reactivar** (también avisa).
- **Historial** (`/history`): juntas pasadas relacionadas contigo, por mes, con la portada
  de su álbum. Las canceladas no aparecen.
- **Álbum** (`apps/photos`): se abre cuando la junta empieza. Suben fotos quienes pueden
  unirse (máx. 200 por junta); se ven a pantalla completa con flechas. Al borrar una foto,
  o la junta entera, también se borran los archivos (señal `post_delete`).

### Chat de grupos (tiempo real)

`apps/chat` usa **Django Channels**:

1. Al abrir el grupo, el frontend carga los últimos mensajes por la API y abre un
   WebSocket en `/ws/groups/{id}/chat/` (`consumers.py`). Solo entran miembros, con la
   misma sesión de Django.
2. Los mensajes se **envían por la API REST** (valida y guarda). Al guardarse,
   `services.py` avisa a la "sala" del grupo (`realtime.broadcast`) y todos los
   WebSockets abiertos lo reciben al instante: `message.created`, `message.deleted`.
3. Por el WebSocket el navegador también manda `{"type": "typing"}` para mostrar
   "fulano está escribiendo…" a los demás.
4. Si la conexión se corta, el frontend reintenta y, al volver, pide por la API los
   mensajes que se perdió (`?after=`). Si sacan a alguien del grupo, se le cierra el chat.

**Imágenes y GIFs:** un mensaje puede llevar una imagen (botón, pegar con Ctrl+V o
arrastrar al chat) o un GIF de KLIPY. Las imágenes se enderezan y se achican a 1600 px
(`apps/common/images.py`, lo mismo para el álbum); los GIF animados se guardan tal cual. El buscador de GIFs pasa por Django
(`gifs.py`), así la clave de KLIPY nunca llega al navegador: créala gratis en
https://partner.klipy.com y ponla en `.env` como `KLIPY_API_KEY`. Sin clave, el chat
funciona igual pero el botón GIF avisa que no está configurado.

La "capa de canales" (cómo un proceso avisa a los WebSockets) es **en memoria** por
defecto: sirve con un solo proceso (desarrollo). En producción con varios procesos o
servidores instala `channels-redis` y define `REDIS_URL=redis://...`. El proxy (Nginx,
etc.) debe dejar pasar `/ws/` con `Upgrade: websocket`, y el servidor se arranca con
`daphne config.asgi:application`.

### Compartir

En producción, `/share/` debe llegar a Django (igual que `/api/` y `/media/`), y
`FRONTEND_URL` debe ser el dominio público: con eso WhatsApp, Telegram o Discord
muestran la vista previa con la imagen de la junta.

### Amigos, grupos y visibilidad

- **Amigos:** solicitud → la otra persona acepta. Si ambos se envían solicitud, se aceptan solas.
- **Grupos:** cualquier miembro agrega a sus amigos; quien administra puede editar, sacar
  gente y borrar el grupo. Si quien administra se va, el grupo pasa al miembro más antiguo.
- **Juntas de grupo:** salen en el feed de todos los miembros. Cualquiera con el enlace
  puede *verlas*, pero solo los miembros pueden unirse, votar y anotar gastos
  (`events.services.can_respond`).
- **Juntas sin grupo:** como siempre, solo por enlace.

Cada app separa responsabilidades:

- `models.py` — tablas
- `serializers.py` — validación de entrada y forma del JSON de salida
- `selectors.py` — consultas de lectura
- `services.py` — escrituras con reglas de negocio
- `permissions.py` — quién puede hacer qué
- `views.py` — solo HTTP: recibe, llama a services/selectors, responde

## Estructura del frontend

```
frontend/src/
├── api/          única capa que habla con el backend (client.ts gestiona JSON y CSRF)
├── context/      AuthContext: usuario actual, login, registro, logout
├── hooks/        useAuth · useFetch (carga genérica) · useEvents · useEvent
├── components/
│   ├── ui/       piezas genéricas: Button, Card, TextField, Avatar, StatusMessage
│   ├── layout/   AppShell (Sidebar + Topbar + MobileTabBar, con sesión),
│   │             PublicLayout + Navbar (landing/login), PageHeader, RouteGuards
│   ├── dashboard/ StatsStrip, NextEventCard, WeekAgenda, EventListCard, EventRow
│   ├── auth/     AuthCard
│   ├── events/   EventCard, EventGrid, EventForm, RsvpButtons, AttendeeList, ArrivalPicker...
│   ├── friends/  UserSearch
│   ├── groups/   GroupCard, GroupMembersCard, FriendPicker, GroupEditForm
│   ├── polls/    PollsSection, PollCard, PollForm
│   ├── money/    MoneySection, FixedFeePanel, SharedExpensesPanel, ExpenseForm
│   ├── stats/    LevelCard, RankingCard
│   ├── fun/      WhatToDo ("¿Qué hacemos?")
│   └── settings/ ColorPicker, ThemeModePicker, ThemePreview
├── pages/        una por ruta; solo componen componentes y hooks
├── theme/        color elegido → variables CSS; modo día / noche / automático
├── styles/       tokens.css (paleta generada y medidas) · global.css
├── utils/        fechas y colores
└── types.ts      tipos de las respuestas de la API
```

Cada componente tiene su `.module.css` al lado. Para cambiar colores o
espaciados de toda la app, edita `styles/tokens.css`.

### Temas

Cada usuario elige un color y un modo en **Perfil → Apariencia** (se guarda en su cuenta).

- `theme/theme.ts` extrae del color su tono (`--hue`) y su intensidad (`--chroma`).
- `styles/tokens.css` calcula **todos** los colores con `hsl()` a partir de esas dos
  variables, con un bloque para día y otro para noche (`data-theme="dark"`).
- Los colores con significado (`--color-success-*`, `--color-danger-*`, `--color-warning-*`)
  tienen tono fijo: "Vas" siempre es verde aunque el tema sea rosa.
- Un script en `index.html` aplica el último tema antes de que cargue React, para evitar
  un parpadeo de colores.

Regla para componentes nuevos: usar siempre variables (`var(--color-...)`, `var(--accent-N)`),
nunca colores fijos, para que funcionen con cualquier tema y en modo noche.

Para que la interfaz sea cómoda a la vista, el color se usa con moderación:

- `--color-neutral-soft` para fondos de apoyo (cajas de iconos, etiquetas, pestañas, fechas).
- `--color-primary-soft` solo para estados "seleccionado/activo" y focos.
- `--color-primary` para la acción principal (un botón fuerte por pantalla) y detalles pequeños.
- `--color-primary-strong` para iconos e indicadores que deben destacar sin rellenar con color.

## Cómo crecer

- **Nuevo dominio** (amigos, grupos, chat, gastos): nueva app en `backend/apps/` con la
  misma estructura, y en el frontend su archivo en `api/`, sus hooks y su carpeta en `components/`.
- **Algo que cuelga de una junta** (lista de cosas, fotos, encuesta de fecha): modelo con
  `ForeignKey` a `Event` y endpoints bajo `/api/events/{id}/...`.
- **Invitaciones**: añadir el estado `invited` a `EventParticipant.Status` y restringir
  `event_detail_queryset` según corresponda.
