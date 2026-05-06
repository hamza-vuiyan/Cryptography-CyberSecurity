from django.urls import path
from stegapp import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', views.index, name='index'),
    path('encode/', views.encode_view, name='encode'),
    path('decode/', views.decode_view, name='decode'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
