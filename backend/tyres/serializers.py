from rest_framework import serializers
from .models import TyreSize, Customer, RemouldingJob, Stock, CompanyInfo, Testimonial, GalleryImage, TyreNumber


class TyreSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TyreSize
        fields = '__all__'


class TyreNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TyreNumber
        fields = '__all__'
        read_only_fields = ['remoulding_job']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'


class CustomerSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'email']


class RemouldingJobSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), source='customer', write_only=True
    )
    tyre_size = TyreSizeSerializer(read_only=True)
    tyre_size_id = serializers.PrimaryKeyRelatedField(
        queryset=TyreSize.objects.all(), source='tyre_size', write_only=True
    )
    tyre_numbers = TyreNumberSerializer(many=True, read_only=True)
    tyre_numbers_data = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False,
        help_text="List of tyre numbers to create"
    )

    class Meta:
        model = RemouldingJob
        fields = '__all__'

    def create(self, validated_data):
        tyre_numbers_data = validated_data.pop('tyre_numbers_data', [])
        job = super().create(validated_data)

        # Create tyre numbers
        for tyre_number in tyre_numbers_data:
            TyreNumber.objects.create(
                remoulding_job=job,
                tyre_number=tyre_number,
                status='received'
            )

        return job


class RemouldingJobListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    tyre_size_name = serializers.CharField(source='tyre_size.size', read_only=True)

    class Meta:
        model = RemouldingJob
        fields = ['id', 'job_number', 'customer_name', 'customer_phone',
                  'tyre_size_name', 'quantity', 'date_entered', 'expected_delivery',
                  'status', 'total_cost']


class StockSerializer(serializers.ModelSerializer):
    tyre_size = TyreSizeSerializer(read_only=True)
    tyre_size_id = serializers.PrimaryKeyRelatedField(
        queryset=TyreSize.objects.all(), source='tyre_size', write_only=True
    )
    available_for_sale = serializers.ReadOnlyField()

    class Meta:
        model = Stock
        fields = '__all__'


class StockSummarySerializer(serializers.Serializer):
    total_in_stock = serializers.IntegerField()
    total_for_sale = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()


class CompanyInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyInfo
        fields = '__all__'


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = '__all__'


class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = '__all__'
