from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q, Count
from django.http import FileResponse
from django.utils import timezone

from .models import (
    TyreSize, Customer, RemouldingJob, Stock, CompanyInfo,
    Testimonial, GalleryImage, RateCard, REMOULDING_SUB_TYPE_MAP,
)
from .serializers import (
    TyreSizeSerializer, CustomerSerializer, CustomerSearchSerializer,
    RemouldingJobSerializer, RemouldingJobListSerializer, StockSerializer,
    StockSummarySerializer, CompanyInfoSerializer, TestimonialSerializer,
    GalleryImageSerializer, RateCardSerializer,
)
from .utils.pdf_generator import generate_invoice
from .utils.notifications import send_invoice_email, send_whatsapp_message


class IsAdminUser(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_admin_user()


class TyreSizeViewSet(viewsets.ModelViewSet):
    queryset = TyreSize.objects.filter(is_active=True)
    serializer_class = TyreSizeSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        """All active tyre sizes grouped by vehicle category."""
        sizes = TyreSize.objects.filter(is_active=True).order_by('vehicle_category', 'size')
        grouped = {}
        for s in sizes:
            cat = s.get_vehicle_category_display()
            grouped.setdefault(cat, []).append(TyreSizeSerializer(s).data)
        return Response(grouped)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def available(self, request):
        """Tyre sizes that have stock available for sale."""
        sizes = TyreSize.objects.filter(stock__remoulded_for_sale__gt=0, is_active=True)
        return Response(TyreSizeSerializer(sizes, many=True).data)


class RateCardViewSet(viewsets.ModelViewSet):
    queryset = RateCard.objects.select_related('tyre_size').all()
    serializer_class = RateCardSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    filterset_fields = ['tyre_brand', 'remoulding_type', 'remoulding_sub_type', 'tyre_size', 'is_active']
    search_fields = ['tyre_brand', 'tyre_size__size']

    @action(detail=False, methods=['get'])
    def lookup(self, request):
        """Look up price for a specific brand/type/subtype/size combination."""
        tyre_brand = request.query_params.get('tyre_brand', '')
        remoulding_type = request.query_params.get('remoulding_type', '')
        remoulding_sub_type = request.query_params.get('remoulding_sub_type', '')
        tyre_size_id = request.query_params.get('tyre_size_id', '')

        rate = RateCard.objects.filter(
            tyre_brand__iexact=tyre_brand,
            remoulding_type=remoulding_type,
            remoulding_sub_type=remoulding_sub_type,
            tyre_size_id=tyre_size_id,
            is_active=True,
        ).first()

        if rate:
            return Response({'price': str(rate.price), 'rate_card_id': rate.id})
        return Response({'price': None, 'rate_card_id': None})

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def sub_types(self, request):
        """Return valid sub-types for a given remoulding type."""
        remoulding_type = request.query_params.get('type', '')
        return Response(REMOULDING_SUB_TYPE_MAP.get(remoulding_type, []))


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'phone', 'email']

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        customers = Customer.objects.filter(
            Q(name__icontains=query) | Q(phone__icontains=query)
        )[:20]
        return Response(CustomerSearchSerializer(customers, many=True).data)


class RemouldingJobViewSet(viewsets.ModelViewSet):
    queryset = RemouldingJob.objects.select_related('customer', 'tyre_size').all()
    serializer_class = RemouldingJobSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'tyre_size', 'in_date', 'remoulding_type']
    search_fields = ['customer__name', 'job_number', 'tyre_brand']
    ordering_fields = ['in_date', 'expected_delivery', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return RemouldingJobListSerializer
        return RemouldingJobSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        p = self.request.query_params

        if p.get('customer_name'):
            qs = qs.filter(customer__name__icontains=p['customer_name'])
        if p.get('tyre_size'):
            qs = qs.filter(tyre_size__size__icontains=p['tyre_size'])
        if p.get('date_from'):
            qs = qs.filter(in_date__gte=p['date_from'])
        if p.get('date_to'):
            qs = qs.filter(in_date__lte=p['date_to'])

        return qs

    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        jobs = self.get_queryset().filter(status='in_progress')
        return Response(RemouldingJobListSerializer(jobs, many=True).data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        today = timezone.now().date()
        jobs = self.get_queryset().filter(
            expected_delivery__lt=today,
        ).exclude(status='delivered')
        return Response(RemouldingJobListSerializer(jobs, many=True).data)

    @action(detail=False, methods=['get'])
    def customer_tyres(self, request):
        jobs = self.get_queryset().filter(status__in=['completed', 'delivered'])
        name = request.query_params.get('customer_name')
        if name:
            jobs = jobs.filter(customer__name__icontains=name)
        return Response(RemouldingJobListSerializer(jobs, many=True).data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        job = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(RemouldingJob.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        job.status = new_status
        job.save()
        return Response(RemouldingJobSerializer(job).data)

    @action(detail=True, methods=['get'])
    def invoice(self, request, pk=None):
        job = self.get_object()
        pdf_buffer = generate_invoice(job)
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"Invoice_{job.job_number}.pdf",
            content_type='application/pdf',
        )

    @action(detail=True, methods=['post'])
    def send_invoice(self, request, pk=None):
        job = self.get_object()
        pdf_buffer = generate_invoice(job)
        results = {}

        ok, msg = send_invoice_email(job.customer, job, pdf_buffer)
        results['email'] = {'success': ok, 'message': msg}

        pdf_buffer.seek(0)
        ok2, msg2 = send_whatsapp_message(job.customer, job)
        results['whatsapp'] = {'success': ok2, 'message': msg2}

        if ok or ok2:
            job.invoice_sent = True
            job.save()

        return Response(results)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save()

        if request.data.get('send_invoice'):
            pdf_buffer = generate_invoice(job)
            if job.customer.email:
                send_invoice_email(job.customer, job, pdf_buffer)
            pdf_buffer.seek(0)
            send_whatsapp_message(job.customer, job)
            job.invoice_sent = True
            job.save()

        return Response(RemouldingJobSerializer(job).data, status=status.HTTP_201_CREATED)


class StockViewSet(viewsets.ModelViewSet):
    queryset = Stock.objects.select_related('tyre_size').all()
    serializer_class = StockSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def summary(self, request):
        total_in_stock = Stock.objects.aggregate(total=Sum('quantity'))['total'] or 0
        total_for_sale = Stock.objects.aggregate(total=Sum('remoulded_for_sale'))['total'] or 0
        from django.db import models as m
        low_stock_count = Stock.objects.filter(quantity__lte=m.F('minimum_threshold')).count()
        return Response({
            'total_in_stock': total_in_stock,
            'total_for_sale': total_for_sale,
            'low_stock_count': low_stock_count,
        })

    @action(detail=False, methods=['get'])
    def for_sale(self, request):
        qs = Stock.objects.filter(remoulded_for_sale__gt=0)
        if request.query_params.get('tyre_size'):
            qs = qs.filter(tyre_size__size__icontains=request.query_params['tyre_size'])
        return Response(StockSerializer(qs, many=True).data)


class CompanyInfoViewSet(viewsets.ModelViewSet):
    queryset = CompanyInfo.objects.all()
    serializer_class = CompanyInfoSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public(self, request):
        info = CompanyInfo.objects.first()
        if not info:
            return Response({'name': 'Kishor Tyres', 'description': 'Professional Tyre Remoulding Services'})
        return Response(CompanyInfoSerializer(info).data)


class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def active(self, request):
        testimonials = Testimonial.objects.filter(is_active=True).order_by('-created_at')
        return Response(TestimonialSerializer(testimonials, many=True).data)


class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.all()
    serializer_class = GalleryImageSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def by_category(self, request):
        qs = GalleryImage.objects.filter(is_active=True)
        if request.query_params.get('category'):
            qs = qs.filter(category=request.query_params['category'])
        return Response(GalleryImageSerializer(qs, many=True).data)


class DashboardStatsView(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.now().date()

        total_jobs = RemouldingJob.objects.count()
        in_progress_jobs = RemouldingJob.objects.filter(status='in_progress').count()
        completed_jobs = RemouldingJob.objects.filter(status='completed').count()
        delivered_jobs = RemouldingJob.objects.filter(status='delivered').count()
        overdue_jobs = RemouldingJob.objects.filter(
            expected_delivery__lt=today,
        ).exclude(status='delivered').count()

        in_godown = RemouldingJob.objects.exclude(status='delivered').aggregate(
            total=Sum('quantity')
        )['total'] or 0

        total_customers = Customer.objects.count()
        total_stock = Stock.objects.aggregate(Sum('quantity'))['quantity__sum'] or 0
        for_sale = Stock.objects.aggregate(Sum('remoulded_for_sale'))['remoulded_for_sale__sum'] or 0

        return Response({
            'total_jobs': total_jobs,
            'in_progress_jobs': in_progress_jobs,
            'completed_jobs': completed_jobs,
            'delivered_jobs': delivered_jobs,
            'overdue_jobs': overdue_jobs,
            'tyres_in_godown': in_godown,
            'total_customers': total_customers,
            'total_in_stock': total_stock,
            'remoulded_for_sale': for_sale,
        })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def ocr_extract(request):
    """Extract tyre number from uploaded image using Tesseract OCR."""
    if 'image' not in request.FILES:
        return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        import pytesseract
        from PIL import Image
        import io

        image_file = request.FILES['image']
        image = Image.open(io.BytesIO(image_file.read()))

        # Pre-process: convert to grayscale
        image = image.convert('L')

        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(image, config=custom_config)

        # Extract potential tyre serial numbers (alphanumeric clusters 6-20 chars)
        import re
        candidates = re.findall(r'\b[A-Z0-9]{6,20}\b', text.upper())

        return Response({
            'raw_text': text.strip(),
            'candidates': candidates,
            'suggested': candidates[0] if candidates else '',
        })

    except ImportError:
        return Response(
            {'error': 'pytesseract not installed. Install with: pip install pytesseract'},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
