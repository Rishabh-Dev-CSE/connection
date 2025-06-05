from django.urls import path
from . import views

urlpatterns = [
    path('', views.index),
    path('canvas/',views.newCanvas)

]