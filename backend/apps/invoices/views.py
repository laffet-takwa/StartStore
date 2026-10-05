"""
Views for invoices app.
"""
import io
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.http import FileResponse
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

from .models import Invoice
from .serializers import (
    InvoiceSerializer,
    InvoiceListSerializer,
    InvoiceCreateSerializer,
)
from apps.accounts.permissions import IsManagerOrAdmin, IsSalesOrAbove


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Invoice management."""

    queryset = Invoice.objects.all()
    permission_classes = [IsSalesOrAbove]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['customer']
    search_fields = ['invoice_number', 'customer__first_name', 'customer__last_name', 'customer__phone']
    ordering_fields = ['issued_at', 'total']
    ordering = ['-issued_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        elif self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.select_related('customer', 'sale', 'repair').all()

    def create(self, request, *args, **kwargs):
        """Create invoice from sale or repair."""
        serializer = InvoiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        sale_id = serializer.validated_data.get('sale_id')
        repair_id = serializer.validated_data.get('repair_id')
        notes = serializer.validated_data.get('notes', '')

        with transaction.atomic():
            if sale_id:
                from apps.sales.models import Sale
                try:
                    sale = Sale.objects.get(id=sale_id)
                except Sale.DoesNotExist:
                    return Response(
                        {'detail': 'Sale not found.', 'code': 'SALE_NOT_FOUND'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                if sale.status != Sale.Status.CONFIRMED:
                    return Response(
                        {'detail': 'Only confirmed sales can be invoiced.', 'code': 'INVALID_SALE_STATUS'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if hasattr(sale, 'invoices') and sale.invoices.exists():
                    return Response(
                        {'detail': 'Invoice already exists for this sale.', 'code': 'INVOICE_EXISTS'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                invoice = Invoice.create_from_sale(sale, notes)

            else:
                from apps.repairs.models import RepairTicket
                try:
                    repair = RepairTicket.objects.get(id=repair_id)
                except RepairTicket.DoesNotExist:
                    return Response(
                        {'detail': 'Repair not found.', 'code': 'REPAIR_NOT_FOUND'},
                        status=status.HTTP_404_NOT_FOUND
                    )

                if repair.status != RepairTicket.Status.DELIVERED:
                    return Response(
                        {'detail': 'Only delivered repairs can be invoiced.', 'code': 'INVALID_REPAIR_STATUS'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if hasattr(repair, 'invoices') and repair.invoices.exists():
                    return Response(
                        {'detail': 'Invoice already exists for this repair.', 'code': 'INVOICE_EXISTS'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                invoice = Invoice.create_from_repair(repair, notes)

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        """Generate and return PDF invoice."""
        invoice = self.get_object()
        pdf_buffer = self.generate_pdf(invoice)

        response = FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"invoice_{invoice.invoice_number}.pdf"
        )
        response['Content-Type'] = 'application/pdf'
        return response

    def generate_pdf(self, invoice):
        """Generate PDF invoice using reportlab."""
        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm,
        )

        styles = getSampleStyleSheet()
        elements = []

        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a3c5e'),
            spaceAfter=6,
            alignment=TA_CENTER,
        )

        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#666666'),
            spaceAfter=20,
            alignment=TA_CENTER,
        )

        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
        )

        detail_style = ParagraphStyle(
            'DetailStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            alignment=TA_RIGHT,
        )

        # Company header
        elements.append(Paragraph("STAR STORE", title_style))
        elements.append(Paragraph("Advanced Computer Repair & IT Solutions", subtitle_style))

        # Company info
        company_info = [
            ["Adresse:", "123 Avenue Habib Bourguiba, Tunis 1000, Tunisie"],
            ["Téléphone:", "+216 71 123 456"],
            ["Email:", "contact@starstore.tn"],
            ["Matricule Fiscal:", "1234567A/M"],
        ]

        company_table = Table(company_info, colWidths=[3*cm, 12*cm])
        company_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#666666')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(company_table)
        elements.append(Spacer(1, 20))

        # Invoice title and info
        invoice_title = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor('#1a3c5e'),
            spaceAfter=10,
        )
        elements.append(Paragraph(f"FACTURE #{invoice.invoice_number}", invoice_title))

        # Invoice metadata table
        invoice_info = [
            ["Date d'émission:", invoice.issued_at.strftime('%d/%m/%Y %H:%M')],
            ["Client:", invoice.customer.get_full_name()],
        ]

        if invoice.customer.company_name:
            invoice_info.append(["Entreprise:", invoice.customer.company_name])

        if invoice.customer.address:
            invoice_info.append(["Adresse:", invoice.customer.address])

        if invoice.customer.city:
            invoice_info.append(["Ville:", invoice.customer.city])

        if invoice.customer.phone:
            invoice_info.append(["Téléphone:", invoice.customer.phone])

        if invoice.customer.email:
            invoice_info.append(["Email:", invoice.customer.email])

        if invoice.sale:
            invoice_info.append(["Source:", f"Vente #{invoice.sale.sale_number}"])
        elif invoice.repair:
            invoice_info.append(["Source:", f"Réparation #{invoice.repair.ticket_number}"])

        info_table = Table(invoice_info, colWidths=[4*cm, 12*cm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#333333')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))

        # Items table
        elements.append(Paragraph("Détails", styles['Heading3']))
        elements.append(Spacer(1, 10))

        if invoice.sale:
            # Sale items
            headers = ['#', 'Produit / Service', 'Qté', 'Prix unitaire', 'Remise', 'Total']
            data = [headers]

            for idx, item in enumerate(invoice.sale.items.all(), 1):
                data.append([
                    str(idx),
                    item.product.name,
                    str(item.quantity),
                    f"{item.unit_price:.3f} TND",
                    f"{item.discount:.3f} TND" if item.discount else "0.000 TND",
                    f"{item.total_price:.3f} TND",
                ])

        elif invoice.repair:
            # Repair items
            headers = ['#', 'Description', 'Qté', 'Prix unitaire', 'Total']
            data = [headers]

            # Main repair service
            data.append([
                '1',
                f"Réparation: {invoice.repair.device.brand} {invoice.repair.device.model} ({invoice.repair.get_status_display()})",
                '1',
                f"{invoice.subtotal:.3f} TND",
                f"{invoice.total:.3f} TND",
            ])

            # Repair parts
            for idx, part in enumerate(invoice.repair.parts.all(), 2):
                data.append([
                    str(idx),
                    f"Pièce: {part.product.name}",
                    str(part.quantity),
                    f"{part.unit_price:.3f} TND",
                    f"{part.total_price:.3f} TND",
                ])

        else:
            # Manual invoice
            headers = ['#', 'Description', 'Qté', 'Prix unitaire', 'Total']
            data = [headers]
            data.append(['1', 'Service', '1', f"{invoice.subtotal:.3f} TND", f"{invoice.total:.3f} TND"])

        col_widths = [1*cm, 7*cm, 1.5*cm, 2.5*cm, 2.5*cm, 2.5*cm] if invoice.sale else [1*cm, 7*cm, 1.5*cm, 3*cm, 3*cm]

        items_table = Table(data, colWidths=col_widths)
        items_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a3c5e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            # Data rows
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dddddd')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 20))

        # Totals
        totals_data = [
            ["Sous-total:", f"{invoice.subtotal:.3f} TND"],
        ]

        if invoice.discount > 0:
            totals_data.append(["Remise:", f"-{invoice.discount:.3f} TND"])

        if invoice.tax > 0:
            totals_data.append(["TVA (19%):", f"{invoice.tax:.3f} TND"])

        totals_data.append(["TOTAL:", f"{invoice.total:.3f} TND"])

        totals_table = Table(totals_data, colWidths=[12*cm, 3*cm])
        totals_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -2), 10),
            ('FONTSIZE', (0, -1), (1, -1), 12),
            ('FONTNAME', (0, -1), (1, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#1a3c5e')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0f4f8')),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 30))

        # Payment status
        if invoice.sale:
            payment_status = invoice.sale.get_payment_status_display()
            paid_amount = invoice.sale.paid_amount
            remaining = invoice.sale.remaining_amount

            payment_info = [
                ["Statut de paiement:", payment_status],
                ["Montant payé:", f"{paid_amount:.3f} TND"],
                ["Reste à payer:", f"{remaining:.3f} TND"],
            ]

            payment_table = Table(payment_info, colWidths=[4*cm, 4*cm])
            payment_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#333333')),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            elements.append(payment_table)
            elements.append(Spacer(1, 20))

        # Notes
        if invoice.notes:
            elements.append(Paragraph("Notes:", styles['Heading3']))
            elements.append(Paragraph(invoice.notes, styles['Normal']))
            elements.append(Spacer(1, 20))

        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#999999'),
            alignment=TA_CENTER,
        )
        elements.append(Spacer(1, 30))
        elements.append(Paragraph("Merci pour votre confiance - STAR STORE", footer_style))
        elements.append(Paragraph(f"Facture générée le {timezone.now().strftime('%d/%m/%Y à %H:%M')}", footer_style))

        doc.build(elements)
        buffer.seek(0)
        return buffer