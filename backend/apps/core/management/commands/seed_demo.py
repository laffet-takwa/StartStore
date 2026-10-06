"""
Management command to seed demo data for STAR STORE MANAGER.
"""
import random
from datetime import timedelta, date
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from apps.accounts.models import Employee
from apps.customers.models import Customer, Device, DeviceType
from apps.inventory.models import Category, Supplier, Product, InventoryMovement
from apps.repairs.models import RepairTicket, RepairStatus
from apps.sales.models import Sale, SaleItem, Payment
from apps.invoices.models import Invoice


class Command(BaseCommand):
    help = 'Seed demo data for STAR STORE MANAGER'

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")

        with transaction.atomic():
            self.create_employees()
            self.create_categories_and_suppliers()
            self.create_products()
            self.create_customers_and_devices()
            self.create_repairs()
            self.create_sales()
            self.create_invoices()
            self.create_notifications()

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully!"))

    def create_employees(self):
        self.stdout.write("Creating employees...")
        Employee.objects.filter(email='admin@starstore.tn').delete()
        Employee.objects.filter(email='manager@starstore.tn').delete()
        Employee.objects.filter(email='tech@starstore.tn').delete()
        Employee.objects.filter(email='sales@starstore.tn').delete()

        self.admin = Employee.objects.create_superuser(
            email='admin@starstore.tn',
            password='admin123',
            first_name='Mohamed',
            last_name='Ben Ali',
            phone='+216 71 000 001',
            role=Employee.Role.ADMIN,
        )

        self.manager = Employee.objects.create_user(
            email='manager@starstore.tn',
            password='manager123',
            first_name='Ahmed',
            last_name='Trabelsi',
            phone='+216 71 000 002',
            role=Employee.Role.MANAGER,
        )

        self.technician = Employee.objects.create_user(
            email='tech@starstore.tn',
            password='tech123',
            first_name='Youssef',
            last_name='Khalifa',
            phone='+216 71 000 003',
            role=Employee.Role.TECHNICIAN,
        )

        self.sales_emp = Employee.objects.create_user(
            email='sales@starstore.tn',
            password='sales123',
            first_name='Fatma',
            last_name='Mansouri',
            phone='+216 71 000 004',
            role=Employee.Role.SALES,
        )

    def create_categories_and_suppliers(self):
        self.stdout.write("Creating categories and suppliers...")
        Category.objects.all().delete()
        Supplier.objects.all().delete()

        self.categories = {}
        cat_data = [
            ('Laptops', 'Ordinateurs portables'),
            ('Desktops', 'Ordinateurs de bureau'),
            ('Components', 'Composants informatiques'),
            ('Peripherals', 'Périphériques'),
            ('Networking', 'Réseau'),
            ('Software', 'Logiciels'),
        ]

        for name, desc in cat_data:
            slug = name.lower().replace(' ', '-')
            cat = Category.objects.create(name=name, slug=slug, description=desc)
            self.categories[name] = cat

        self.suppliers = {}
        sup_data = [
            ('TechSupply Tunisia', 'Mohamed Ben Amor', '+216 71 100 001', 'info@techsupply.tn'),
            ('Computer World', 'Sonia Gharbi', '+216 71 100 002', 'contact@computerworld.tn'),
            ('IT Solutions Pro', 'Karim Bouazizi', '+216 71 100 003', 'sales@itsolutionspro.tn'),
            ('Digital Parts Co', 'Leila Hamdi', '+216 71 100 004', 'info@digitalparts.tn'),
        ]

        for name, contact, phone, email in sup_data:
            sup = Supplier.objects.create(
                name=name, contact_person=contact, phone=phone, email=email
            )
            self.suppliers[name] = sup

    def create_products(self):
        self.stdout.write("Creating products...")
        Product.objects.all().delete()

        products_data = [
            ('Dell Latitude 5420', 'LAP-DELL-5420', 'Laptops', 1200, 1500, 5),
            ('HP ProBook 450', 'LAP-HP-450', 'Laptops', 800, 1100, 8),
            ('Lenovo ThinkPad X1', 'LAP-LENOVO-X1', 'Laptops', 1300, 1700, 3),
            ('Dell OptiPlex 3080', 'DES-DELL-3080', 'Desktops', 600, 850, 4),
            ('HP ProDesk 400', 'DES-HP-400', 'Desktops', 500, 750, 6),
            ('Intel Core i7-12700K', 'CPU-I7-12700K', 'Components', 350, 450, 15),
            ('DDR4 16GB RAM', 'RAM-DDR4-16G', 'Components', 60, 85, 50),
            ('SSD 512GB NVMe', 'SSD-NVME-512', 'Components', 70, 95, 30),
            ('RTX 3060 12GB', 'GPU-RTX3060', 'Components', 350, 450, 8),
            ('Logitech MX Master 3', 'PER-LOGI-MX3', 'Peripherals', 80, 120, 20),
            ('Samsung 24" Monitor', 'PER-SAM-24', 'Peripherals', 180, 250, 10),
            ('Corsair K70 Keyboard', 'PER-CORSAIR-K70', 'Peripherals', 120, 160, 12),
            ('TP-Link Archer C80', 'NET-TPLINK-C80', 'Networking', 45, 70, 25),
            ('Cisco Catalyst 2960', 'NET-CISCO-2960', 'Networking', 400, 550, 3),
            ('Windows 11 Pro', 'SW-WIN11PRO', 'Software', 0, 180, 100),
            ('Microsoft Office 365', 'SW-O365', 'Software', 0, 120, 100),
        ]

        for name, sku, cat_name, purchase, selling, stock in products_data:
            category = self.categories.get(cat_name)
            supplier = random.choice(list(self.suppliers.values()))

            Product.objects.create(
                category=category,
                supplier=supplier,
                name=name,
                sku=sku,
                barcode=f"BAR-{sku}",
                brand=name.split()[0] if ' ' in name else 'Generic',
                description=f"Professional {name.lower()} for business use.",
                purchase_price=purchase,
                selling_price=selling,
                stock_quantity=stock,
                minimum_stock=max(3, stock // 5),
                is_active=True,
            )

    def create_customers_and_devices(self):
        self.stdout.write("Creating customers and devices...")
        Customer.objects.all().delete()
        Device.objects.all().delete()

        customers_data = [
            ('Mohamed', 'Ben Ali', '+216 98 000 001', 'mohamed.benali@email.tn', 'Tunis', 'Tunis'),
            ('Fatma', 'Trabelsi', '+216 98 000 002', 'fatma.trabelsi@email.tn', 'Sfax', 'Sfax'),
            ('Ahmed', 'Gharbi', '+216 98 000 003', 'ahmed.gharbi@email.tn', 'Sousse', 'Sousse'),
            ('Leila', 'Mansouri', '+216 98 000 004', 'leila.mansouri@email.tn', 'Gabès', 'Gabès'),
            ('Youssef', 'Bouazizi', '+216 98 000 005', 'youssef.bouazizi@email.tn', 'Bizerte', 'Bizerte'),
            ('Sonia', 'Hamdi', '+216 98 000 006', 'sonia.hamdi@email.tn', 'Kairouan', 'Kairouan'),
            ('Karim', 'Ben Amor', '+216 98 000 007', 'karim.benamor@email.tn', 'Monastir', 'Monastir'),
            ('Nour', 'Khalifa', '+216 98 000 008', 'nour.khalifa@email.tn', 'Nabeul', 'Nabeul'),
            ('Omar', 'Rahmani', '+216 98 000 009', 'omar.rahmani@email.tn', 'Ariana', 'Ariana'),
            ('Mariem', 'Jendoubi', '+216 98 000 010', 'mariem.jendoubi@email.tn', 'Ben Arous', 'Ben Arous'),
        ]

        self.customers = []
        for first, last, phone, email, city, gov in customers_data:
            customer = Customer.objects.create(
                first_name=first,
                last_name=last,
                phone=phone,
                email=email,
                city=city,
                governorate=gov.lower().replace(' ', '_'),
                address=f"123 Avenue {first} {last}",
                notes="VIP customer",
                is_active=True,
            )
            self.customers.append(customer)

        device_types = [DeviceType.LAPTOP, DeviceType.DESKTOP, DeviceType.LAPTOP, DeviceType.DESKTOP, DeviceType.LAPTOP]
        for customer in self.customers:
            for i in range(random.randint(1, 2)):
                Device.objects.create(
                    customer=customer,
                    device_type=random.choice(device_types),
                    brand=random.choice(['Dell', 'HP', 'Lenovo', 'Asus', 'Acer']),
                    model=random.choice(['ProBook', 'Latitude', 'ThinkPad', 'Inspiron', 'Pavilion']),
                    serial_number=f"SN{random.randint(100000, 999999)}",
                    device_password="",
                    physical_condition=random.choice(['Good', 'Fair', 'Needs repair']),
                    notes=f"Device {i+1} for {customer.get_full_name()}",
                )

    def create_repairs(self):
        self.stdout.write("Creating repairs...")
        RepairTicket.objects.all().delete()

        statuses = list(RepairStatus.values)
        weighted_statuses = (
            [RepairStatus.RECEIVED] * 3 +
            [RepairStatus.DIAGNOSIS] * 2 +
            [RepairStatus.WAITING_CUSTOMER] * 2 +
            [RepairStatus.APPROVED] * 2 +
            [RepairStatus.REPAIRING] * 3 +
            [RepairStatus.TESTING] * 2 +
            [RepairStatus.READY] * 2 +
            [RepairStatus.DELIVERED] * 5 +
            [RepairStatus.CANCELLED] * 2
        )

        for i in range(15):
            customer = random.choice(self.customers)
            devices = customer.devices.all()
            device = random.choice(devices) if devices else customer.devices.first()

            status = weighted_statuses[i % len(weighted_statuses)]
            days_ago = random.randint(1, 30)

            repair = RepairTicket.objects.create(
                customer=customer,
                device=device,
                technician=self.technician if status != RepairStatus.RECEIVED else None,
                problem_description=random.choice([
                    "Computer won't start",
                    "Blue screen error",
                    "Slow performance",
                    "Hard drive failure",
                    "Screen display issues",
                    "Overheating",
                    "Power issues",
                ]),
                diagnosis="Hard drive replacement needed" if status != RepairStatus.RECEIVED else "",
                repair_solution="Replace HDD with SSD" if status == RepairStatus.DELIVERED else "",
                internal_notes="Customer requested priority service" if status == RepairStatus.DELIVERED else "",
                status=status,
                estimated_cost=random.randint(100, 500),
                final_cost=random.randint(100, 500) if status == RepairStatus.DELIVERED else None,
                estimated_completion_date=date.today() + timedelta(days=random.randint(3, 10)),
                received_at=timezone.now() - timedelta(days=days_ago),
            )

            if status == RepairStatus.DELIVERED:
                repair.delivered_at = repair.received_at + timedelta(days=random.randint(2, 7))
                repair.completed_at = repair.delivered_at
                repair.save()

        # Ensure we have specific demo matricules
        try:
            demo_repair = RepairTicket.objects.filter(status=RepairStatus.REPAIRING).first()
            if demo_repair:
                demo_repair.tracking_matricule = "ST-20261005-A1B2C3"
                demo_repair.save()
        except:
            pass

        try:
            demo_repair2 = RepairTicket.objects.filter(status=RepairStatus.READY).first()
            if demo_repair2:
                demo_repair2.tracking_matricule = "ST-20261005-D4E5F6"
                demo_repair2.save()
        except:
            pass

    def create_sales(self):
        self.stdout.write("Creating sales...")
        Sale.objects.all().delete()

        products = list(Product.objects.filter(is_active=True))
        for i in range(8):
            customer = random.choice(self.customers)
            sale = Sale.objects.create(
                customer=customer,
                employee=self.sales_emp,
                status=Sale.Status.CONFIRMED,
                discount=random.randint(0, 50),
                tax=19,
                confirmed_at=timezone.now() - timedelta(days=random.randint(1, 30)),
            )

            num_items = random.randint(1, 4)
            subtotal = 0
            for j in range(num_items):
                product = random.choice(products)
                quantity = random.randint(1, 3)
                unit_price = product.selling_price
                discount = 0

                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    discount=discount,
                )
                subtotal += unit_price * quantity

            sale.subtotal = subtotal
            sale.total = subtotal - sale.discount + sale.tax
            sale.save()

            # Add payment
            Payment.objects.create(
                sale=sale,
                amount=sale.total,
                payment_method=random.choice(['cash', 'card', 'bank_transfer', 'other']),
                paid_at=sale.confirmed_at,
            )

    def create_invoices(self):
        self.stdout.write("Creating invoices...")
        Invoice.objects.all().delete()

        sales = Sale.objects.filter(status=Sale.Status.CONFIRMED)
        for sale in sales[:5]:
            Invoice.create_from_sale(sale, notes="Thank you for your purchase!")

    def create_notifications(self):
        self.stdout.write("Creating notifications...")
        from apps.notifications.models import Notification

        Notification.objects.all().delete()

        # Create sample notifications
        Notification.objects.create(
            employee=self.manager,
            title="Stock faible",
            message="Several products are running low on stock.",
            type=Notification.Type.LOW_STOCK,
        )

        Notification.objects.create(
            employee=self.technician,
            title="Nouvelle réparation",
            message="You have been assigned a new repair ticket.",
            type=Notification.Type.REPAIR_ASSIGNED,
        )