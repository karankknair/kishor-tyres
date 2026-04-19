#!/usr/bin/env python
"""Setup script for Kishor Tyres"""
import os
import sys
import django

def setup_django():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kishor_tyres.settings')
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    django.setup()

def create_superuser():
    from accounts.models import User
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@kishortyres.com',
            password='admin123',
            user_type='admin',
            first_name='Admin',
            last_name='User'
        )
        print("Superuser 'admin' created with password 'admin123'")

def create_initial_data():
    from tyres.models import TyreSize, CompanyInfo, Stock

    # Create default tyre sizes
    sizes = [
        ('145/70 R12', 1500),
        ('155/70 R13', 1600),
        ('165/65 R14', 1700),
        ('175/65 R14', 1800),
        ('185/65 R15', 1900),
        ('195/65 R15', 2000),
        ('205/55 R16', 2200),
        ('215/55 R17', 2400),
        ('225/45 R17', 2600),
        ('235/45 R18', 2800),
        ('145 R12 LT', 1600),
        ('155 R13 LT', 1700),
        ('165 R13 LT', 1800),
    ]

    for size, price in sizes:
        tyre_size, created = TyreSize.objects.get_or_create(
            size=size,
            defaults={'price': price, 'description': f'Tyre size {size}'}
        )
        if created:
            Stock.objects.create(tyre_size=tyre_size, quantity=0, remoulded_for_sale=0)

    print("Tyre sizes created")

    # Create company info if not exists
    if not CompanyInfo.objects.exists():
        CompanyInfo.objects.create(
            name='Kishor Tyres',
            tagline='Professional Tyre Remoulding Services',
            description='Kishor Tyres has been providing quality tyre remoulding services since 1995. '
                       'We specialize in giving old tyres a new life with our state-of-the-art '
                       'remoulding technology.',
            phone='+91 98765 43210',
            email='info@kishortyres.com',
            address='123 Industrial Area, Mumbai-Pune Highway, Maharashtra 410206',
            working_hours='Monday - Saturday: 9:00 AM - 7:00 PM',
            established_year=1995
        )
        print("Company info created")

def main():
    setup_django()
    from django.core.management import call_command

    print("Setting up Kishor Tyres...")

    # Run migrations
    print("\nRunning migrations...")
    call_command('migrate')

    # Create superuser
    print("\nCreating superuser...")
    create_superuser()

    # Create initial data
    print("\nCreating initial data...")
    create_initial_data()

    print("\n" + "="*50)
    print("Setup complete!")
    print("="*50)
    print("\nAdmin credentials:")
    print("  Username: admin")
    print("  Password: admin123")
    print("\nRun the server with: python manage.py runserver")
    print("API will be available at: http://127.0.0.1:8000/api/")

if __name__ == '__main__':
    main()
