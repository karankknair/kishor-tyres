from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TyreSizeViewSet, CustomerViewSet, RemouldingJobViewSet,
    StockViewSet, CompanyInfoViewSet, TestimonialViewSet,
    GalleryImageViewSet, DashboardStatsView, RateCardViewSet,
    ocr_extract,
)

router = DefaultRouter()
router.register(r'tyre-sizes', TyreSizeViewSet)
router.register(r'rate-cards', RateCardViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'remoulding-jobs', RemouldingJobViewSet, basename='remouldingjob')
router.register(r'stock', StockViewSet)
router.register(r'company-info', CompanyInfoViewSet)
router.register(r'testimonials', TestimonialViewSet)
router.register(r'gallery', GalleryImageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view({'get': 'stats'}), name='dashboard-stats'),
    path('ocr/extract/', ocr_extract, name='ocr-extract'),
]
