# STAR STORE MANAGER

A complete management system for STAR STORE — IT equipment sales, repairs, and inventory management. Built with Django REST Framework (backend) and React + TypeScript + Vite (frontend).

---

## 🏗 Architecture

```
smartstore/
├── backend/          # Django REST API
│   ├── apps/         # Django apps (users, repairs, products, inventory, etc.)
│   ├── config/       # Django settings
│   └── requirements/ # Python dependencies
├── frontend/         # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── api/          # API client & TanStack Query hooks
│   │   ├── context/      # React context providers
│   │   └── i18n/         # Internationalization (ar, fr, en)
└── images/           # Static assets
```

---

## 🛠 Tech Stack

### Backend
- **Django 5** + **Django REST Framework**
- **PostgreSQL** (production) / SQLite (dev)
- **JWT Authentication** (djangorestframework-simplejwt)
- **CORS** configured for frontend
- **Pytest** for testing

### Frontend
- **React 18** + **TypeScript**
- **Vite** build tool
- **Tailwind CSS v4** (custom STAR STORE theme)
- **React Router v7** for routing
- **TanStack Query** for server state
- **React Hook Form + Zod** for forms
- **Recharts** for dashboard charts
- **Lucide React** for icons
- **Sonner** for toasts
- **date-fns** for date formatting

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (for production)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/dev.txt  # or requirements/base.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver 0.0.0.0:8000
```

API available at `http://localhost:8000/api/`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env

# Start dev server
npm run dev
```

Frontend available at `http://localhost:5173`

---

## 🌍 Internationalization

Supports **Arabic (RTL)**, **French**, and **English**.

- Language selector in top navbar
- RTL layout support for Arabic
- Translations in `frontend/src/i18n/{ar,fr,en}.json`

---

## 🔐 Authentication & Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access including employees, audit logs, reports |
| **Manager** | All operations, inventory, finance, reports |
| **Technician** | Repairs, devices, customers |
| **Sales** | Sales, customers, products, repairs |

JWT tokens: 60min access / 7 days refresh

---

## 📦 Key Features

- **Dashboard** — Revenue, repairs, customers, low stock overview
- **Repairs** — Full lifecycle: received → diagnosis → approved → repairing → testing → ready → delivered
- **Public Tracking** — Customers track repairs via ticket number
- **Products & Categories** — CRUD with stock management
- **Inventory** — Movements, low stock alerts
- **Sales & Payments** — Orders, invoices, PDF generation
- **Customers** — Profiles, devices, repair history
- **Employees** — Admin-only management
- **Notifications** — Real-time in-app notifications
- **Audit Logs** — Full activity tracking
- **Reports** — Revenue, repairs, inventory analytics

---

## 🧪 Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm run test        # if configured
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

---

## 📁 Environment Variables

### Backend (`.env`)
```env
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost:5432/starstore
CORS_ALLOWED_ORIGINS=http://localhost:5173
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🔧 Available Scripts

### Frontend
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |

### Backend
| Command | Description |
|---------|-------------|
| `python manage.py runserver` | Start dev server |
| `python manage.py migrate` | Apply migrations |
| `python manage.py makemigrations` | Create migrations |
| `pytest` | Run tests |

---

## 📄 License

Internal use only — STAR STORE MANAGER