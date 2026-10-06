"""
URLs for accounts app (authentication).
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, LogoutView, MeView, SignupView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', SignupView.as_view({'post': 'create'}), name='signup'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view({'post': 'logout'}), name='logout'),
    path('me/', MeView.as_view({'get': 'list'}), name='me'),
    path('me/update/', MeView.as_view({'patch': 'update_profile'}), name='me_update'),
    path('me/password/', MeView.as_view({'post': 'change_password'}), name='change_password'),
]