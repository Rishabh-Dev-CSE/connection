from django.http import HttpResponse
from django.shortcuts import render

def index(request):
    return render(request, 'index.html')

def writer_connection(request):
    return render(request, 'writer/make_connection.html')



def write_view(request):
    me = request.GET.get('me')
    to = request.GET.get('to')
    role = request.GET.get('role')
    
    if not me or not to:
        return HttpResponse("Invalid URL", status=400)

    if role != "writer":
        return HttpResponse("Unauthorized", status=403)

    return render(
        request,
        'writer/write_pad.html',
        {'me': int(me), 'to': int(to)}
    )
    
    
def board_view(request):
    me = request.GET.get('me')
    to = request.GET.get('to')

    if not me or not to:
        return HttpResponse("Invalid URL", status=400)

    return render(
        request,
        'writer/board.html',
        {'me': int(me), 'to': int(to)}
    )
