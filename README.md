# Kishor Tyres — Tyre Remoulding Business Management System

Full-stack web application for a tyre remoulding business.  
**Backend:** Django REST Framework · **Frontend:** React (CRA) · **DB:** PostgreSQL (SQLite in dev) · **Queue:** Celery + Redis · **OCR:** Tesseract · **PDF:** ReportLab

---

## Features

### Public Website
| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Hero, About, Gallery, Testimonials, Contact |
| Services | `/services` | Detailed service descriptions + remoulding process |
| Tyre Sizes | `/tyre-sizes` | All sizes grouped by vehicle category |
| Portfolio | `/portfolio` | Filterable gallery with lightbox |
| Feedback | `/feedback` | Customer reviews with rating breakdown |

### Admin Panel (`/admin`)
- **Dashboard** — live counts: tyres in godown, in-progress, overdue, delivered
- **New Entry** — create remoulding job with customer search/autocomplete, remoulding type/sub-type, rate card auto-fill, OCR tyre number extraction
- **All Jobs** — filterable table of every job with inline status update + invoice download
- **Overdue Jobs** — jobs past delivery date that aren't delivered
- **In Progress** — active jobs with filter & status update
- **Customer Tyres** — completed/delivered jobs searchable by customer name
- **Godown Stock** — tyre inventory with low-stock highlighting
- **Rate Card** — CRUD for Brand × Type × Sub-type × Size → Price (auto-fills job amount)
- **Tyre Sizes** — add/edit tyre sizes grouped by vehicle category
- **Testimonials** — add/edit/show-hide customer reviews shown on public Feedback page

### Automated Notifications (Celery)
- 1 day before delivery → WhatsApp reminder to customer
- On delivery day → WhatsApp reminder to customer
- Runs hourly via Celery Beat

---

## Project Structure

```
kishor_tyres/
├── backend/
│   ├── kishor_tyres/        Django project (settings, celery.py, urls.py)
│   ├── tyres/               Core app
│   │   ├── models.py        TyreSize, RateCard, Customer, RemouldingJob, Stock, …
│   │   ├── views.py         REST API + OCR endpoint
│   │   ├── serializers.py
│   │   ├── tasks.py         Celery delivery reminder tasks
│   │   ├── utils/           pdf_generator.py, notifications.py
│   │   └── management/commands/seed_tyre_sizes.py
│   ├── accounts/            Custom User model + token auth
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           Home, Services, TyreSizes, Portfolio, Feedback
│   │   │                    Login, AdminDashboard
│   │   ├── services/api.js  All API calls
│   │   └── context/         AuthContext
│   └── Dockerfile
└── docker-compose.yml       PostgreSQL + Redis + Django + Celery worker + Beat + React
```

---

## Local Development Setup

### Prerequisites
- Python 3.9+ and `pip`
- Node.js 18+ and `npm`
- (Optional) Redis for Celery; skip if you don't need scheduled notifications

### 1 — Backend

```bash
cd kishor_tyres/backend

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env              # then edit .env

python manage.py migrate
python manage.py seed_tyre_sizes  # seeds 31 tyre sizes + company info + sample reviews
python manage.py createsuperuser  # create admin account
python manage.py runserver
```

API available at **http://127.0.0.1:8000/api/**  
Django admin at **http://127.0.0.1:8000/admin/**

### 2 — Frontend

```bash
cd kishor_tyres/frontend

npm install
cp .env.example .env              # REACT_APP_API_URL=http://127.0.0.1:8000/api

npm start
```

Frontend at **http://localhost:3000/**

### 3 — Celery (optional, for notifications)

Requires Redis running locally (`redis-server`).

```bash
# Worker
celery -A kishor_tyres worker --loglevel=info

# Beat scheduler (in a separate terminal)
celery -A kishor_tyres beat --loglevel=info
```

---

## Docker Compose (Full Stack)

Runs Django, React, PostgreSQL, Redis, Celery worker, and Celery Beat in one command.

```bash
cp backend/.env.example backend/.env   # fill in Twilio keys if needed
docker-compose up --build
```

| Service | URL |
|---------|-----|
| React frontend | http://localhost:3000 |
| Django API | http://localhost:8000/api/ |
| Django admin | http://localhost:8000/admin/ |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

The backend container auto-runs migrations and seeds tyre sizes on startup.

Create an admin user after first start:
```bash
docker-compose exec backend python manage.py createsuperuser
```

---

## API Reference

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/accounts/login/` | Public |
| POST | `/api/accounts/logout/` | Auth |
| GET | `/api/accounts/check-admin/` | Auth |

### Tyre Sizes
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/tyres/tyre-sizes/` | Admin — all sizes |
| GET | `/api/tyres/tyre-sizes/public/` | Public — grouped by category |
| GET | `/api/tyres/tyre-sizes/available/` | Public — in-stock for sale |

### Rate Card
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET/POST | `/api/tyres/rate-cards/` | Admin CRUD |
| GET | `/api/tyres/rate-cards/lookup/` | Price lookup for job form |
| GET | `/api/tyres/rate-cards/sub_types/?type=pre_cure` | Get valid sub-types |

### Jobs
| Method | Endpoint | Notes |
|--------|----------|-------|
| GET/POST | `/api/tyres/remoulding-jobs/` | List / create |
| GET | `/api/tyres/remoulding-jobs/in_progress/` | Active jobs |
| GET | `/api/tyres/remoulding-jobs/overdue/` | Past due date, not delivered |
| GET | `/api/tyres/remoulding-jobs/customer_tyres/` | Completed/delivered |
| POST | `/api/tyres/remoulding-jobs/{id}/update_status/` | Change status |
| GET | `/api/tyres/remoulding-jobs/{id}/invoice/` | Download PDF |

### OCR
| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/api/tyres/ocr/extract/` | `multipart/form-data`, field `image` |

Requires `tesseract-ocr` installed on the system (included in Docker image).

### Dashboard
| Method | Endpoint |
|--------|----------|
| GET | `/api/tyres/dashboard/stats/` |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | — | Django secret key |
| `DEBUG` | `True` | Set `False` in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated |
| `DATABASE_URL` | *(blank = SQLite)* | PostgreSQL DSN |
| `REDIS_URL` | `redis://localhost:6379/0` | Celery broker |
| `TWILIO_ACCOUNT_SID` | — | Twilio credentials |
| `TWILIO_AUTH_TOKEN` | — | Twilio credentials |
| `TWILIO_WHATSAPP_NUMBER` | — | e.g. `whatsapp:+14155238886` |
| `FRONTEND_URL` | — | Added to CORS allow-list |

### Frontend (`frontend/.env`)

| Variable | Default |
|----------|---------|
| `REACT_APP_API_URL` | `http://127.0.0.1:8000/api` |

---

## Tyre Sizes Seeded

| Category | Sizes |
|----------|-------|
| Tractor | 16.9\*28, 14.9\*28, 13.6\*28, 12.4\*28, 11.2\*24, 8.3\*20, 800\*18, 600\*12, 180/85\*D12, 600\*16, 750\*16, 900\*16, 900\*20 |
| Earth Mover | 1400\*25 |
| Truck | 295/95D20, 1000\*20, 1100\*20, 1000\*R20, 900\*20, 900\*R20, 825\*20, 825\*R20 |
| Truck/Bus Tubeless | 22.5, 17.5 |
| Tempo | 825\*16, 825\*R16, 750\*16, 750\*R16 |
| Mini Truck | 155D12, 165D12, 4.50\*10 |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, Django REST Framework, django-filter |
| Auth | Token authentication |
| Database | PostgreSQL (prod) / SQLite (dev) |
| PDF | ReportLab |
| Notifications | Twilio (WhatsApp), Django Email |
| OCR | pytesseract + Tesseract |
| Task Queue | Celery 5 + Redis |
| Frontend | React 18, React Router 6, Axios |
| Containerisation | Docker, Docker Compose |
