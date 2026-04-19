import os
from django.core.mail import EmailMessage
from django.conf import settings
from twilio.rest import Client


def send_invoice_email(customer, job, pdf_buffer):
    """Send invoice via email"""
    if not customer.email:
        return False, "Customer has no email address"

    try:
        subject = f"Invoice for Tyre Remoulding - Job #{job.job_number}"
        body = f"""Dear {customer.name},

Thank you for choosing Kishor Tyres for your tyre remoulding needs.

Please find attached your invoice for the following job:
- Job Number: {job.job_number}
- Tyre Size: {job.tyre_size.size}
- Quantity: {job.quantity}
- Expected Delivery: {job.expected_delivery}
- Total Amount: Rs. {job.total_cost:,.2f}

We look forward to serving you again.

Best regards,
Kishor Tyres Team
"""

        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.EMAIL_HOST_USER,
            to=[customer.email],
        )

        # Attach PDF
        email.attach(f"Invoice_{job.job_number}.pdf", pdf_buffer.read(), 'application/pdf')

        email.send()
        return True, "Email sent successfully"

    except Exception as e:
        return False, str(e)


def send_whatsapp_message(customer, job, pdf_url=None):
    """Send WhatsApp message using Twilio"""
    if not customer.phone:
        return False, "Customer has no phone number"

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        message_body = f"""Hello {customer.name},

Thank you for choosing Kishor Tyres!

Your tyre remoulding job has been registered:
*Job Number:* {job.job_number}
*Tyre Size:* {job.tyre_size.size}
*Quantity:* {job.quantity}
*Expected Delivery:* {job.expected_delivery}
*Total Amount:* Rs. {job.total_cost:,.2f}

We'll notify you once your tyres are ready for pickup.

-Kishor Tyres
"""

        # Format phone number (assuming Indian numbers)
        to_number = customer.phone
        if not to_number.startswith('+'):
            if len(to_number) == 10:
                to_number = f"+91{to_number}"
            elif len(to_number) == 12 and to_number.startswith('91'):
                to_number = f"+{to_number}"
            else:
                to_number = f"+{to_number}"

        message = client.messages.create(
            body=message_body,
            from_=settings.TWILIO_WHATSAPP_NUMBER,
            to=f"whatsapp:{to_number}"
        )

        return True, f"WhatsApp message sent. SID: {message.sid}"

    except Exception as e:
        return False, str(e)


def send_status_update(customer, job):
    """Send status update to customer"""
    messages = []

    # Email update
    if customer.email:
        try:
            subject = f"Status Update - Job #{job.job_number}"
            body = f"""Dear {customer.name},

Your tyre remoulding job has been updated.

Job Number: {job.job_number}
Current Status: {job.get_status_display()}

Thank you for your patience.

Best regards,
Kishor Tyres Team
"""

            email = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.EMAIL_HOST_USER,
                to=[customer.email],
            )
            email.send()
            messages.append("Email notification sent")
        except Exception as e:
            messages.append(f"Email failed: {str(e)}")

    # WhatsApp update
    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        to_number = customer.phone
        if not to_number.startswith('+'):
            if len(to_number) == 10:
                to_number = f"+91{to_number}"
            elif len(to_number) == 12 and to_number.startswith('91'):
                to_number = f"+{to_number}"
            else:
                to_number = f"+{to_number}"

        message_body = f"""Hi {customer.name},

*Status Update*
Job #{job.job_number} is now *{job.get_status_display()}*

-Kishor Tyres"""

        message = client.messages.create(
            body=message_body,
            from_=settings.TWILIO_WHATSAPP_NUMBER,
            to=f"whatsapp:{to_number}"
        )
        messages.append(f"WhatsApp notification sent")
    except Exception as e:
        messages.append(f"WhatsApp failed: {str(e)}")

    return messages
