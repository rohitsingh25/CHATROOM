from django.urls import path
from .views import CreateRoomView, JoinRoomView, FileUploadView, HealthView

urlpatterns = [
    path('rooms/create/', CreateRoomView.as_view(), name='create_room'),
    path('rooms/join/', JoinRoomView.as_view(), name='join_room'),
    path('upload/', FileUploadView.as_view(), name='file_upload'),
    path('health/', HealthView.as_view(), name='health'),
]
