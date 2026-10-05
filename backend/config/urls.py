from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # Enlaces para compartir (HTML con vista previa + imagen), fuera de /api
    path("share/", include("apps.events.share_urls")),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.friends.urls")),
    path("api/", include("apps.groups.urls")),
    path("api/events/", include("apps.events.urls")),
    path("api/", include("apps.polls.urls")),
    path("api/", include("apps.expenses.urls")),
    path("api/", include("apps.stats.urls")),
    path("api/", include("apps.profiles.urls")),
    path("api/", include("apps.notifications.urls")),
    path("api/", include("apps.bringlist.urls")),
    path("api/", include("apps.comments.urls")),
    path("api/", include("apps.chat.urls")),
    path("api/", include("apps.photos.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
