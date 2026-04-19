from django.contrib import admin
from .models import TyreSize, Customer, RemouldingJob, Stock, CompanyInfo, Testimonial, GalleryImage, TyreNumber


class TyreNumberInline(admin.TabularInline):
    model = TyreNumber
    extra = 1
    fields = ('tyre_number', 'status', 'notes')


@admin.register(TyreSize)
class TyreSizeAdmin(admin.ModelAdmin):
    list_display = ('size', 'company', 'price', 'remoulding_type', 'is_active')
    list_filter = ('company', 'remoulding_type', 'is_active')
    search_fields = ('size', 'company')
    list_editable = ('price', 'is_active')


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'email', 'created_at')
    search_fields = ('name', 'phone', 'email')
    list_filter = ('created_at',)


@admin.register(RemouldingJob)
class RemouldingJobAdmin(admin.ModelAdmin):
    list_display = ('job_number', 'customer', 'tyre_size', 'quantity',
                    'status', 'date_entered', 'expected_delivery')
    list_filter = ('status', 'date_entered', 'expected_delivery')
    search_fields = ('job_number', 'customer__name', 'customer__phone')
    date_hierarchy = 'date_entered'
    inlines = [TyreNumberInline]


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('tyre_size', 'quantity', 'remoulded_for_sale',
                    'minimum_threshold', 'last_updated')
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
