from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

VEHICLE_CATEGORY_CHOICES = [
    ('tractor', 'Tractor'),
    ('earth_mover', 'Earth Mover'),
    ('truck', 'Truck'),
    ('truck_bus_tubeless', 'Truck/Bus Tubeless'),
    ('tempo', 'Tempo'),
    ('mini_truck', 'Mini Truck'),
]

REMOULDING_TYPE_CHOICES = [
    ('pre_cure', 'Pre-cure'),
    ('mold_cure', 'Mold-cure'),
]

REMOULDING_SUB_TYPE_MAP = {
    'pre_cure': [
        ('rib', 'Rib'),
        ('lug', 'Lug'),
        ('mixed', 'Mixed'),
        ('highway', 'Highway'),
    ],
    'mold_cure': [
        ('hot', 'Hot'),
        ('cold', 'Cold'),
    ],
}

REMOULDING_SUB_TYPE_CHOICES = [
    ('rib', 'Rib'),
    ('lug', 'Lug'),
    ('mixed', 'Mixed'),
    ('highway', 'Highway'),
    ('hot', 'Hot'),
    ('cold', 'Cold'),
]


class TyreSize(models.Model):
    size = models.CharField(max_length=50)
    vehicle_category = models.CharField(
        max_length=30,
        choices=VEHICLE_CATEGORY_CHOICES,
        default='truck',
    )
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        unique_together = ['size', 'vehicle_category']
        ordering = ['vehicle_category', 'size']

    def __str__(self):
        return f"{self.size} ({self.get_vehicle_category_display()})"


class RateCard(models.Model):
    tyre_brand = models.CharField(max_length=100)
    remoulding_type = models.CharField(max_length=20, choices=REMOULDING_TYPE_CHOICES)
    remoulding_sub_type = models.CharField(max_length=20, choices=REMOULDING_SUB_TYPE_CHOICES)
    tyre_size = models.ForeignKey(TyreSize, on_delete=models.CASCADE, related_name='rate_cards')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['tyre_brand', 'remoulding_type', 'remoulding_sub_type', 'tyre_size']
        ordering = ['tyre_brand', 'remoulding_type', 'tyre_size']

    def __str__(self):
        return (
            f"{self.tyre_brand} | {self.get_remoulding_type_display()} "
            f"({self.get_remoulding_sub_type_display()}) | {self.tyre_size.size} — ₹{self.price}"
        )


class Customer(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.phone}"


class RemouldingJob(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('delivered', 'Delivered'),
    ]

    job_number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='jobs')
    tyre_size = models.ForeignKey(TyreSize, on_delete=models.CASCADE, related_name='jobs')
    quantity = models.PositiveIntegerField(default=1)
    tyre_brand = models.CharField(max_length=100, blank=True, default='')
    remoulding_type = models.CharField(
        max_length=20, choices=REMOULDING_TYPE_CHOICES, default='pre_cure'
    )
    remoulding_sub_type = models.CharField(
        max_length=20, choices=REMOULDING_SUB_TYPE_CHOICES, default='rib'
    )
    in_date = models.DateField(default=timezone.now)
    expected_delivery = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    cuts_repairs = models.TextField(blank=True, default='', help_text='Notes on cuts, repairs, or damage')
    notes = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    invoice_generated = models.BooleanField(default=False)
    invoice_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.job_number:
            self.job_number = f"KT{uuid.uuid4().hex[:8].upper()}"
        if not self.amount:
            rate = RateCard.objects.filter(
                tyre_size=self.tyre_size,
                tyre_brand__iexact=self.tyre_brand,
                remoulding_type=self.remoulding_type,
                remoulding_sub_type=self.remoulding_sub_type,
                is_active=True,
            ).first()
            if rate:
                self.amount = self.quantity * rate.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.job_number} - {self.customer.name}"

    @property
    def is_overdue(self):
        from django.utils.timezone import now
        return self.status != 'delivered' and self.expected_delivery < now().date()


class Stock(models.Model):
    tyre_size = models.ForeignKey(TyreSize, on_delete=models.CASCADE, related_name='stock')
    quantity = models.PositiveIntegerField(default=0)
    remoulded_for_sale = models.PositiveIntegerField(default=0)
    minimum_threshold = models.PositiveIntegerField(default=5)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Stock"

    def __str__(self):
        return f"{self.tyre_size.size} - Stock: {self.quantity}"

    def available_for_sale(self):
        return self.remoulded_for_sale


class TyreNumber(models.Model):
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('delivered', 'Delivered'),
    ]

    remoulding_job = models.ForeignKey(RemouldingJob, on_delete=models.CASCADE, related_name='tyre_numbers')
    tyre_number = models.CharField(max_length=100, help_text='Individual tyre serial number')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['remoulding_job', 'tyre_number']
        ordering = ['created_at']

    def __str__(self):
        return f"{self.tyre_number} - {self.status}"


class CompanyInfo(models.Model):
    name = models.CharField(max_length=200, default='Kishor Tyres')
    tagline = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField()
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    address = models.TextField()
    working_hours = models.CharField(max_length=100)
    established_year = models.PositiveIntegerField()
    logo = models.ImageField(upload_to='company/', blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Company Info'


class Testimonial(models.Model):
    customer_name = models.CharField(max_length=100)
    customer_image = models.ImageField(upload_to='testimonials/', blank=True, null=True)
    content = models.TextField()
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.customer_name} - {self.rating} stars"


class GalleryImage(models.Model):
    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to='gallery/')
    category = models.CharField(max_length=50, choices=[
        ('factory', 'Factory'),
        ('products', 'Products'),
        ('process', 'Process'),
        ('team', 'Team'),
    ])
    is_active = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
