import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Create admin user from env vars if one does not exist'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        username = os.getenv('ADMIN_USERNAME') or 'admin'
        password = os.getenv('ADMIN_PASSWORD')
        email = os.getenv('ADMIN_EMAIL', '')

        if not password:
            self.stdout.write('ADMIN_PASSWORD not set, skipping.')
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(f'Admin user "{username}" already exists.')
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f'Admin user "{username}" created.'))
