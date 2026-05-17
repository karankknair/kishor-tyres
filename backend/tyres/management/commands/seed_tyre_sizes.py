from django.core.management.base import BaseCommand
from tyres.models import TyreSize, CompanyInfo, Testimonial

TYRE_DATA = {
    'tractor': [
        '16.9*28', '14.9*28', '13.6*28', '12.4*28',
        '11.2*24', '8.3*20', '800*18', '600*12',
        '180/85*D12', '600*16', '750*16', '900*16', '900*20',
    ],
    'earth_mover': [
        '1400*25',
    ],
    'truck': [
        '295/95D20', '1000*20', '1100*20', '1000*R20',
        '900*20', '900*R20', '825*20', '825*R20',
    ],
    'truck_bus_tubeless': [
        '22.5', '17.5',
    ],
    'tempo': [
        '825*16', '825*R16', '750*16', '750*R16',
    ],
    'mini_truck': [
        '155D12', '165D12', '4.50*10',
    ],
}

DEFAULT_COMPANY = {
    'name': 'Kishor Tyres',
    'tagline': 'Quality Remoulding — Miles of Trust',
    'description': (
        'Kishor Tyres has been a pioneer in tyre remoulding services. '
        'We specialise in giving old tyres a new life using state-of-the-art '
        'pre-cure and mold-cure technology for tractors, trucks, JCBs, and more.'
    ),
    'phone': '+91 98765 43210',
    'email': 'info@kishortyres.com',
    'address': 'Industrial Area, Near Highway, Maharashtra',
    'working_hours': 'Monday – Saturday: 9:00 AM – 7:00 PM',
    'established_year': 1995,
}

DEFAULT_TESTIMONIALS = [
    {
        'customer_name': 'Rahul Sharma',
        'content': 'Excellent service! My tractor tyres look brand new. Quality remoulding at a very reasonable price.',
        'rating': 5,
    },
    {
        'customer_name': 'Priya Patel',
        'content': 'Professional team and quick turnaround time. Have been using Kishor Tyres for years. Highly recommended!',
        'rating': 5,
    },
    {
        'customer_name': 'Amit Kumar',
        'content': 'Great experience. The staff is knowledgeable and helped me choose the right remoulding type for my truck.',
        'rating': 4,
    },
    {
        'customer_name': 'Suresh Yadav',
        'content': 'Very happy with the pre-cure remoulding. My JCB tyres are running perfectly after the remould.',
        'rating': 5,
    },
]


class Command(BaseCommand):
    help = 'Seed the database with tyre sizes, company info, and sample testimonials'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete existing tyre sizes before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            TyreSize.objects.all().delete()
            self.stdout.write(self.style.WARNING('Cleared existing tyre sizes.'))

        # Seed tyre sizes
        created = 0
        skipped = 0
        for category, sizes in TYRE_DATA.items():
            for size in sizes:
                _, was_created = TyreSize.objects.get_or_create(
                    size=size,
                    vehicle_category=category,
                    defaults={'is_active': True},
                )
                if was_created:
                    created += 1
                else:
                    skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Tyre sizes: {created} created, {skipped} already existed.'
            )
        )

        # Seed company info
        if not CompanyInfo.objects.exists():
            CompanyInfo.objects.create(**DEFAULT_COMPANY)
            self.stdout.write(self.style.SUCCESS('Company info created.'))
        else:
            self.stdout.write('Company info already exists — skipped.')

        # Seed testimonials
        t_created = 0
        for t in DEFAULT_TESTIMONIALS:
            _, was_created = Testimonial.objects.get_or_create(
                customer_name=t['customer_name'],
                defaults={**t, 'is_active': True},
            )
            if was_created:
                t_created += 1

        self.stdout.write(
            self.style.SUCCESS(f'Testimonials: {t_created} created.')
        )
        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
