"""
Tests for STAR STORE MANAGER API.
"""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import Employee


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return Employee.objects.create_superuser(
        email='admin@test.com',
        password='testpass123',
        first_name='Admin',
        last_name='User',
    )


@pytest.fixture
def manager_user(db):
    return Employee.objects.create_user(
        email='manager@test.com',
        password='testpass123',
        first_name='Manager',
        last_name='User',
        role=Employee.Role.MANAGER,
    )


@pytest.fixture
def technician_user(db):
    return Employee.objects.create_user(
        email='tech@test.com',
        password='testpass123',
        first_name='Tech',
        last_name='User',
        role=Employee.Role.TECHNICIAN,
    )


@pytest.fixture
def sales_user(db):
    return Employee.objects.create_user(
        email='sales@test.com',
        password='testpass123',
        first_name='Sales',
        last_name='User',
        role=Employee.Role.SALES,
    )


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class TestAuthentication:
    def test_login_success(self, api_client, admin_user):
        response = api_client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'testpass123',
        }, format='json')
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['email'] == 'admin@test.com'

    def test_login_invalid_credentials(self, api_client, admin_user):
        response = api_client.post('/api/auth/login/', {
            'email': 'admin@test.com',
            'password': 'wrongpassword',
        }, format='json')
        assert response.status_code == 401

    def test_get_current_user(self, api_client, admin_user):
        tokens = get_tokens(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = api_client.get('/api/auth/me/')
        assert response.status_code == 200
        assert response.data['email'] == 'admin@test.com'


class TestCustomers:
    def test_list_customers(self, api_client, admin_user):
        tokens = get_tokens(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = api_client.get('/api/customers/')
        assert response.status_code == 200
        assert 'results' in response.data

    def test_create_customer(self, api_client, admin_user):
        tokens = get_tokens(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = api_client.post('/api/customers/', {
            'first_name': 'Test',
            'last_name': 'Customer',
            'phone': '+216 99 000 001',
        }, format='json')
        assert response.status_code == 201
        assert response.data['first_name'] == 'Test'

    def test_search_customers(self, api_client, admin_user):
        tokens = get_tokens(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = api_client.get('/api/customers/?search=Test')
        assert response.status_code == 200


class TestRepairs:
    def test_list_repairs(self, api_client, admin_user):
        tokens = get_tokens(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = api_client.get('/api/repairs/')
        assert response.status_code == 200

    def test_create_repair(self, api_client, admin_user):
        tokens = get_tokens(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        # Would need customer and device to be created first
        # This is a placeholder for the test structure


class TestPublicTracking:
    def test_public_tracking_no_auth(self, api_client):
        response = api_client.get('/api/public/repairs/status/', {'matricule': 'ST-20261005-A1B2C3'})
        assert response.status_code == 404

    def test_public_tracking_invalid_matricule(self, api_client):
        response = api_client.get('/api/public/repairs/status/', {'matricule': 'INVALID'})
        assert response.status_code == 404
        assert 'detail' in response.data


class TestInventory:
    def test_low_stock_products(self, api_client, admin_user):
        tokens = get_tokens(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = api_client.get('/api/inventory/low-stock/')
        assert response.status_code == 200


class TestDashboard:
    def test_dashboard_overview(self, api_client, admin_user):
        tokens = get_tokens(admin_user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = api_client.get('/api/dashboard/')
        assert response.status_code == 200
        assert 'revenue' in response.data
        assert 'repairs' in response.data