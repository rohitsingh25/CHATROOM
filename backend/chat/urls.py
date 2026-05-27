from django.urls import path
from .views import CreateRoomView, JoinRoomView, FileUploadView, HealthView, ActiveRoomsView, AdminLoginView, AdminRoomsView

urlpatterns = [
    path('rooms/create/', CreateRoomView.as_view(),  name='create_room'),
    path('rooms/join/',   JoinRoomView.as_view(),    name='join_room'),
    path('rooms/active/', ActiveRoomsView.as_view(), name='active_rooms'),  # homepage badge
    path('upload/',       FileUploadView.as_view(),  name='file_upload'),
    path('health/',       HealthView.as_view(),       name='health'),
    path('admin/login/',  AdminLoginView.as_view(),  name='admin_login'),
    path('admin/rooms/',  AdminRoomsView.as_view(),  name='admin_rooms'),
]

