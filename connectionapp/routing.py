from django.urls import path
from .consumers import *

websocket_urlpatterns = [
    path("ws/chat/<str:room>/", WriterBoard.as_asgi()),
    path("ws/video/<str:room>/", VideoCallConsumer.as_asgi()), 
]
