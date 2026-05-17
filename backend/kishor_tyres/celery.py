import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kishor_tyres.settings')

app = Celery('kishor_tyres')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
