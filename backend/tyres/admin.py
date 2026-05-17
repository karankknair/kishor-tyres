from django.contrib import admin
from .models import (
    TyreSize, Customer, RemouldingJob, Stock, CompanyInfo,
    Testimonial, GalleryImage, TyreNumber, RateCard,
)


class TyreNumberInline(admin.TabularInline):
    model = TyreNumber
    extra = 1
    fields = ('tyre_number', 'status', 'notes')


@admin.register(TyreSize)
class TyreSizeAdmin(admin.ModelAdmin):
    list_display = ('size', 'vehicle_category', 'is_active')
    list_filter = ('vehicle_category', 'is_active')
    search_fields = ('size',)
    list_editable = ('is_active',)


@admin.register(RateCard)
class RateCardAdmin(admin.ModelAdmin):
    list_display = ('tyre_brand', 'tyre_size', 'remoulding_type', 'remoulding_sub_type', 'price', 'is_active')
    list_filter = ('tyre_brand', 'remoulding_type', 'remoulding_sub_type', 'is_active')
    search_fields = ('tyre_brand', 'tyre_size__size')
    list_editable = ('price', 'is_active')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'created_at')
    search_fields = ('name', 'phone', 'email')
    list_filter = ('created_at',)


@admin.register(RemouldingJob)
class RemouldingJobAdmin(admin.ModelAdmin):
    list_display = (
        'job_number', 'customer', 'tyre_size', 'tyre_brand',
        'quantity', 'status', 'in_date', 'expected_delivery',
    )
    list_filter = ('status', 'remoulding_type', 'in_date', 'expected_delivery')
    search_fields = ('job_number', 'customer__name', 'customer__phone', 'tyre_brand')
    date_hierarchy = 'in_date'
    inlines = [TyreNumberInline]


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('tyre_size', 'quantity', 'remoulded_for_sale', 'minimum_threshold', 'last_updated')
    list_filter = ('last_updated',)
    search_fields = ('tyre_size__size',)


@admin.register(CompanyInfo)
class CompanyInfoAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'established_year')


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('customer_name', 'rating', 'is_active', 'created_at')
    list_filter = ('rating', 'is_active')


@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'is_active', 'uploaded_at')
    list_filter = ('category', 'is_active')


@admin.register(TyreNumber)
class TyreNumberAdmin(admin.ModelAdmin):
    list_display = ('tyre_number', 'remoulding_job', 'status', 'updated_at')
    list_filter = ('status',)
    search_fields = ('tyre_number', 'remoulding_job__job_number')
    list_select_related = ('remoulding_job',)
