from django.urls import path
from . import views
from django.views.static import serve
from django.conf import settings

urlpatterns = [
    path('', views.index),

    path("make-connection/writer-board/", views.writer_connection),

    path("writer/", views.write_view),
    path("board/", views.board_view),
    path("video/", views.video_page),
    path("create-video/", views.create_video),

    path('ads.txt', serve, {
        'document_root': settings.BASE_DIR,
        'path': 'ads.txt'
    }),
]
