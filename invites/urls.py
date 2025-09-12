
from django.urls import path
from . import views

app_name = 'invites'

urlpatterns = [
    path('', views.code_login, name='code_login'),
    path('rsvp/<str:code>/', views.rsvp_with_code, name='rsvp_with_code'),
    path('qrcode/<str:code>/', views.qr_code_image, name='qr_code_image'),
]