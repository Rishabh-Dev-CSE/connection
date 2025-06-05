from django.shortcuts import render

def index(request):
    return render(request, 'index.html')

def newCanvas(request):
    userName = request.GET.get('userName')
    toUser = request.GET.get('toUser')
    print(userName)
    return render(request, 'canvas.html',{'userName':userName,'toUser':toUser})
