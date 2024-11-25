# models_app/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ModelEntryViewSet, TrainingJobViewSet

router = DefaultRouter()
router.register(r'models', ModelEntryViewSet)
router.register(r'training-jobs', TrainingJobViewSet, basename='trainingjob')

urlpatterns = [
    path('', include(router.urls)),
]
