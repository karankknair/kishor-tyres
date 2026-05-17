from celery import shared_task
from django.utils import timezone
from datetime import timedelta


@shared_task
def send_delivery_reminders():
    """
    Runs hourly via Celery Beat.
    Sends reminders 1 day before delivery and on the delivery date.
    """
    from .models import RemouldingJob
    from .utils.notifications import send_whatsapp_message

    today = timezone.now().date()
    tomorrow = today + timedelta(days=1)

    # Jobs due tomorrow (1-day warning)
    due_tomorrow = RemouldingJob.objects.filter(
        expected_delivery=tomorrow,
        status__in=['in_progress', 'completed'],
    ).select_related('customer', 'tyre_size')

    for job in due_tomorrow:
        _send_reminder(job, message_type='tomorrow')

    # Jobs due today (delivery day)
    due_today = RemouldingJob.objects.filter(
        expected_delivery=today,
        status__in=['in_progress', 'completed'],
    ).select_related('customer', 'tyre_size')

    for job in due_today:
        _send_reminder(job, message_type='today')

    return {
        'reminders_tomorrow': due_tomorrow.count(),
        'reminders_today': due_today.count(),
    }


def _send_reminder(job, message_type):
    """Send a WhatsApp/SMS reminder for a job."""
    from twilio.rest import Client
    from django.conf import settings

    customer = job.customer

    if message_type == 'tomorrow':
        body = (
            f"Hello {customer.name},\n\n"
            f"Reminder: Your remoulded tyres are due for pickup *tomorrow*.\n\n"
            f"*Job:* {job.job_number}\n"
            f"*Tyre Size:* {job.tyre_size.size}\n"
            f"*Quantity:* {job.quantity}\n"
            f"*Delivery Date:* {job.expected_delivery.strftime('%d-%m-%Y')}\n\n"
            f"— Kishor Tyres"
        )
    else:
        body = (
            f"Hello {customer.name},\n\n"
            f"Your remoulded tyres are ready for pickup *today*!\n\n"
            f"*Job:* {job.job_number}\n"
            f"*Tyre Size:* {job.tyre_size.size}\n"
            f"*Quantity:* {job.quantity}\n"
            f"*Amount Due:* ₹{job.amount:,.0f}\n\n"
            f"Please visit us at your earliest convenience.\n"
            f"— Kishor Tyres"
        )

    phone = customer.phone
    if not phone:
        return

    if not phone.startswith('+'):
        phone = f"+91{phone}" if len(phone) == 10 else f"+{phone}"

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=body,
            from_=settings.TWILIO_WHATSAPP_NUMBER,
            to=f"whatsapp:{phone}",
        )
    except Exception:
        pass  # log via Celery task error in production
