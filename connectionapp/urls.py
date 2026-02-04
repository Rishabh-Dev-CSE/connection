from django.urls import path
from . import views

urlpatterns = [
    path('', views.index),
    path("make-connection/writer-board/", views.writer_connection),
    path('writer/', views.write_view, name='write'),
    path('board/', views.board_view, name='board'),
]