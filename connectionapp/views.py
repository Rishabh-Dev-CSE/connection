import uuid
from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse
import random

# Home / connect page
def index(request):
    return render(request, "index.html")


# Room create page (agar alag se use kar rahe ho)
def writer_connection(request):
    return render(request, "writer/make_connection.html")


# Writer pad (Phone)
def write_view(request):
    room = request.GET.get("room")

    if not room:
        return HttpResponse("Room ID missing", status=400)

    return render(
        request,
        "writer/writer.html",
        {
            "room": room
        }
    )


# Board screen (PC)
def board_view(request):
    room = request.GET.get("room")

    if not room:
        return HttpResponse("Room ID missing", status=400)

    return render(
        request,
        "writer/board.html",
        {
            "room": room
        }
    )

def create_video(request):
    return render(request, "video/create_video.html")

def video_page(request):
    room = request.GET.get("room")
    if not room:
        return HttpResponse("Room missing")
    return render(request, "video/video.html", {"room": room})


def random_video_page(request):
    return render(request, "video/random_video.html")

