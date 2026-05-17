import os
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime


def generate_invoice(job, output_path=None):
    """Generate PDF invoice for a remoulding job"""

    if output_path:
        buffer = output_path
    else:
        buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )

    elements = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    header_style = ParagraphStyle(
        'CustomHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#333333'),
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#333333'),
        spaceAfter=8
    )

    # Company Header
    elements.append(Paragraph("KISHOR TYRES", title_style))
    elements.append(Paragraph("Professional Tyre Remoulding Services", normal_style))
    elements.append(Paragraph("Phone: +91 XXXXX XXXXX | Email: info@kishortyres.com", normal_style))
    elements.append(Spacer(1, 0.3*inch))

    # Invoice Title
    elements.append(Paragraph("INVOICE", header_style))
    elements.append(Spacer(1, 0.2*inch))

    # Invoice Details Table
    invoice_data = [
        ['Invoice Number:', f"INV-{job.job_number}"],
        ['Date:', job.in_date.strftime('%d-%m-%Y')],
        ['Job Number:', job.job_number],
        ['Expected Delivery:', job.expected_delivery.strftime('%d-%m-%Y')],
    ]

    invoice_table = Table(invoice_data, colWidths=[2*inch, 3*inch])
    invoice_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(invoice_table)
    elements.append(Spacer(1, 0.3*inch))

    # Customer Details
    elements.append(Paragraph("CUSTOMER DETAILS", header_style))
    customer_data = [
        ['Customer Name:', job.customer.name],
        ['Phone:', job.customer.phone],
        ['Email:', job.customer.email or 'N/A'],
        ['Address:', job.customer.address],
    ]

    customer_table = Table(customer_data, colWidths=[2*inch, 3*inch])
    customer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(customer_table)
    elements.append(Spacer(1, 0.3*inch))

    # Tyre Details
    elements.append(Paragraph("TYRE DETAILS", header_style))
    tyre_data = [
        ['Description', 'Quantity', 'Unit Price', 'Total'],
        [f"Tyre Remoulding - Size {job.tyre_size.size}",
         str(job.quantity),
         f"Rs. {(job.amount / job.quantity):,.2f}" if job.quantity else "—",
         f"Rs. {job.amount:,.2f}"],
    ]

    tyre_table = Table(tyre_data, colWidths=[2.5*inch, 1*inch, 1*inch, 1.5*inch])
    tyre_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(tyre_table)
    elements.append(Spacer(1, 0.2*inch))

    # Total
    total_data = [
        ['', '', 'Total Amount:', f"Rs. {job.amount:,.2f}"],
    ]

    total_table = Table(total_data, colWidths=[2.5*inch, 1*inch, 1*inch, 1.5*inch])
    total_table.setStyle(TableStyle([
        ('BACKGROUND', (2, 0), (-1, -1), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (2, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTNAME', (0, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 0.4*inch))

    # Terms and Conditions
    elements.append(Paragraph("TERMS & CONDITIONS", header_style))
    terms = [
        "1. Payment is due upon delivery.",
        "2. Expected delivery date is subject to change based on workload.",
        "3. Warranty covers manufacturing defects only.",
        "4. Please bring this invoice when collecting your tyres."
    ]
    for term in terms:
        elements.append(Paragraph(term, normal_style))

    elements.append(Spacer(1, 0.3*inch))

    # Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.grey,
        alignment=TA_CENTER
    )
    elements.append(Paragraph("Thank you for choosing Kishor Tyres!", footer_style))
    elements.append(Paragraph("Quality remoulding for a safer ride.", footer_style))

    # Build PDF
    doc.build(elements)

    if output_path:
        return output_path
    else:
        buffer.seek(0)
        return buffer
