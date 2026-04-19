from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class TyreSize(models.Model):
    REMOULDING_TYPE_CHOICES = (
        ('hot', 'Hot'),
        ('cold', 'Cold'),
    )

    size = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    company = models.CharField(max_length=100, blank=True, null=True, help_text="Tyre company/brand")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Rate/Price for remoulding")
    remoulding_type = models.CharField(max_length=10, choices=REMOULDING_TYPE_CHOICES, default='hot')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        company_str = f" ({self.company})" if self.company else ""
        return f"{self.size}{company_str}"


class Customer(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.phone}"


class RemouldingJob(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('delivered', 'Delivered'),
    )

    job_number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='jobs')
    tyre_size = models.ForeignKey(TyreSize, on_delete=models.CASCADE, related_name='jobs')
    quantity = models.PositiveIntegerField(default=1)
    date_entered = models.DateField(auto_now_add=True)
    expected_delivery = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    invoice_generated = models.BooleanField(default=False)
    invoice_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.job_number:
            self.job_number = f"KT{uuid.uuid4().hex[:8].upper()}"
        if not self.total_cost:
            self.total_cost = self.quantity * self.tyre_size.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.job_number} - {self.customer.name}"


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
    STATUS_CHOICES = (
        ('received', 'Received'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('delivered', 'Delivered'),
    )

    remoulding_job = models.ForeignKey(RemouldingJob, on_delete=models.CASCADE, related_name='tyre_numbers')
    tyre_number = models.CharField(max_length=100, help_text="Individual tyre number/serial number")
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
    name = models.CharField(max_length=200, default="Kishor Tyres")
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
        verbose_name_plural = "Company Info"


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
