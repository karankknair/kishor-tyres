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

        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password(password)
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.user_type = 'admin'
        user.save()
        action = 'created' if created else 'updated'
        self.stdout.write(self.style.SUCCESS(f'Admin user "{username}" {action}.'))
