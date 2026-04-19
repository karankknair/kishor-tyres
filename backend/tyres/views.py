from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404

from .models import TyreSize, Customer, RemouldingJob, Stock, CompanyInfo, Testimonial, GalleryImage
from .serializers import (
    TyreSizeSerializer, CustomerSerializer, CustomerSearchSerializer,
    RemouldingJobSerializer, RemouldingJobListSerializer, StockSerializer,
    StockSummarySerializer, CompanyInfoSerializer, TestimonialSerializer,
    GalleryImageSerializer
)
from .utils.pdf_generator import generate_invoice
from .utils.notifications import send_invoice_email, send_whatsapp_message

import os
from io import BytesIO


class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_admin_user()


class TyreSizeViewSet(viewsets.ModelViewSet):
    queryset = TyreSize.objects.all()
    serializer_class = TyreSizeSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def available(self, request):
        """Get tyre sizes available for sale"""
        sizes = TyreSize.objects.filter(stock__remoulded_for_sale__gt=0)
        serializer = self.get_serializer(sizes, many=True)
        return Response(serializer.data)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'email']

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search customers by name"""
        query = request.query_params.get('q', '')
        customers = Customer.objects.filter(name__icontains=query)[:20]
        serializer = CustomerSearchSerializer(customers, many=True)
        return Response(serializer.data)


class RemouldingJobViewSet(viewsets.ModelViewSet):
    queryset = RemouldingJob.objects.all()
    serializer_class = RemouldingJobSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tyre_size', 'date_entered']
    search_fields = ['customer__name', 'job_number']
    ordering_fields = ['date_entered', 'expected_delivery', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return RemouldingJobListSerializer
        return RemouldingJobSerializer

    def get_queryset(self):
        queryset = RemouldingJob.objects.all()

        # Filter by customer name
        customer_name = self.request.query_params.get('customer_name', None)
        if customer_name:
            queryset = queryset.filter(customer__name__icontains=customer_name)

        # Filter by tyre size
        tyre_size = self.request.query_params.get('tyre_size', None)
        if tyre_size:
            queryset = queryset.filter(tyre_size__size__icontains=tyre_size)

        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(date_entered__gte=date_from)
        if date_to:
            queryset = queryset.filter(date_entered__lte=date_to)

        return queryset.select_related('customer', 'tyre_size')

    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        """Get tyres under remoulding"""
        jobs = RemouldingJob.objects.filter(
            status__in=['pending', 'in_progress']
        ).select_related('customer', 'tyre_size')

        # Apply filters
        customer_name = request.query_params.get('customer_name', None)
        if customer_name:
            jobs = jobs.filter(customer__name__icontains=customer_name)

        tyre_size = request.query_params.get('tyre_size', None)
        if tyre_size:
            jobs = jobs.filter(tyre_size__size__icontains=tyre_size)

        serializer = RemouldingJobListSerializer(jobs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def customer_tyres(self, request):
        """Get customer remoulded tyres"""
        jobs = RemouldingJob.objects.filter(
            status__in=['completed', 'delivered']
        ).select_related('customer', 'tyre_size')

        # Filter by customer name
        customer_name = request.query_params.get('customer_name', None)
        if customer_name:
            jobs = jobs.filter(customer__name__icontains=customer_name)

        serializer = RemouldingJobListSerializer(jobs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update job status"""
        job = self.get_object()
        new_status = request.data.get('status')

        if new_status not in dict(RemouldingJob.STATUS_CHOICES).keys():
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        job.status = new_status
        job.save()

        return Response(RemouldingJobSerializer(job).data)

    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        """Generate and download invoice PDF"""
        job = self.get_object()
        pdf_buffer = generate_invoice(job)

        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"Invoice_{job.job_number}.pdf",
            content_type='application/pdf'
        )

    @action(detail=True, methods=['post'])
    def send_invoice(self, request, pk=None):
        """Generate and send invoice to customer"""
        job = self.get_object()

        # Generate PDF
        pdf_buffer = generate_invoice(job)

        results = {}

        # Send Email
        email_result, email_msg = send_invoice_email(job.customer, job, pdf_buffer)
        results['email'] = {'success': email_result, 'message': email_msg}

        # Reset buffer for WhatsApp
        pdf_buffer.seek(0)

        # Send WhatsApp
        wa_result, wa_msg = send_whatsapp_message(job.customer, job)
        results['whatsapp'] = {'success': wa_result, 'message': wa_msg}

        # Update job status
        if email_result or wa_result:
            job.invoice_sent = True
            job.save()

        return Response(results)

    def create(self, request, *args, **kwargs):
        """Create new job and optionally send invoice"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save()

        # Generate and send invoice if requested
        send_invoice = request.data.get('send_invoice', False)
        if send_invoice:
            pdf_buffer = generate_invoice(job)

            if job.customer.email:
                send_invoice_email(job.customer, job, pdf_buffer)

            pdf_buffer.seek(0)
            send_whatsapp_message(job.customer, job)

            job.invoice_sent = True
            job.save()

        return Response(RemouldingJobSerializer(job).data, status=status.HTTP_201_CREATED)


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get stock summary"""
        total_in_stock = Stock.objects.aggregate(total=Sum('quantity'))['total'] or 0
        total_for_sale = Stock.objects.aggregate(total=Sum('remoulded_for_sale'))['total'] or 0
        low_stock_count = Stock.objects.filter(quantity__lte=models.F('minimum_threshold')).count()

        data = {
            'total_in_stock': total_in_stock,
            'total_for_sale': total_for_sale,
            'low_stock_count': low_stock_count
        }
        return Response(data)

    @action(detail=False, methods=['get'])
    def for_sale(self, request):
        """Get remoulded tyres available for sale"""
        tyre_size = request.query_params.get('tyre_size', None)

        queryset = Stock.objects.filter(remoulded_for_sale__gt=0)
        if tyre_size:
            queryset = queryset.filter(tyre_size__size__icontains=tyre_size)

        serializer = StockSerializer(queryset, many=True)
        return Response(serializer.data)


class CompanyInfoViewSet(viewsets.ModelViewSet):
    queryset = CompanyInfo.objects.all()
    serializer_class = CompanyInfoSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """Get public company info"""
        info = CompanyInfo.objects.first()
        if not info:
            return Response({
                'name': 'Kishor Tyres',
                'description': 'Professional Tyre Remoulding Services'
            })
        serializer = self.get_serializer(info)
        return Response(serializer.data)


class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def active(self, request):
        """Get active testimonials"""
        testimonials = Testimonial.objects.filter(is_active=True)
        serializer = self.get_serializer(testimonials, many=True)
        return Response(serializer.data)


class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def by_category(self, request):
        """Get gallery images by category"""
        category = request.query_params.get('category', None)
        images = GalleryImage.objects.filter(is_active=True)

        if category:
            images = images.filter(category=category)

        serializer = self.get_serializer(images, many=True)
        return Response(serializer.data)


class DashboardStatsView(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics"""
        from django.db.models import Count

        total_jobs = RemouldingJob.objects.count()
        pending_jobs = RemouldingJob.objects.filter(status='pending').count()
        in_progress_jobs = RemouldingJob.objects.filter(status='in_progress').count()
        completed_jobs = RemouldingJob.objects.filter(status='completed').count()
        delivered_jobs = RemouldingJob.objects.filter(status='delivered').count()

        total_customers = Customer.objects.count()
        total_stock = Stock.objects.aggregate(Sum('quantity'))['quantity__sum'] or 0
        for_sale = Stock.objects.aggregate(Sum('remoulded_for_sale'))['remoulded_for_sale__sum'] or 0

        data = {
            'total_jobs': total_jobs,
            'pending_jobs': pending_jobs,
            'in_progress_jobs': in_progress_jobs,
            'completed_jobs': completed_jobs,
            'delivered_jobs': delivered_jobs,
            'total_customers': total_customers,
            'total_in_stock': total_stock,
            'remoulded_for_sale': for_sale,
        }

        return Response(data)
