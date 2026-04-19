from django.urls import path
from .views import RegisterView, LoginView, LogoutView, UserProfileView, AdminCheckView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('check-admin/', AdminCheckView.as_view(), name='check-admin'),
]
