from django.urls import path
from . import views

urlpatterns = [
    path('', views.index),
    path('ads.txt', views.ads_txt),
    path("make-connection/writer-board/", views.writer_connection),
    path('writer/', views.write_view, name='write'),
    path('board/', views.board_view, name='board'),
]
