from django.urls import path
from . import views

from django.views.static import serve
import os
from django.conf import settings

urlpatterns = [
    path('', views.index),
    path("make-connection/writer-board/", views.writer_connection),
    path('writer/', views.write_view, name='write'),
    path('board/', views.board_view, name='board'),
    path('ads.txt', serve, {
        'document_root': settings.BASE_DIR,
        'path': 'ads.txt'}),
]
