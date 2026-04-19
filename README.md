# Kishor Tyres - Tyre Remoulding Factory Management System

A comprehensive web application for managing a tyre remoulding factory, built with Django REST Framework backend and React frontend.

## Features

### Admin Dashboard
- **Dashboard Overview**: View stock levels, job statistics, and customer counts
- **Stock Management**: Track tyres in godown and remoulded tyres for sale
- **For Sale Search**: Search remoulded tyres by size
- **Customer Management**: View customer remoulded tyres with search by name
- **Jobs in Progress**: Track and update remoulding jobs with filters
- **New Entry Form**: Create new remoulding jobs with customer details, auto-generate invoices

### User Website
- **Public Pages**: Company info, tyre listings, gallery, testimonials
- **Contact Form**: Reach out for inquiries
- **Login System**: Separate login for admin and customers

### Automated Features
- **PDF Invoice Generation**: Auto-generated invoices for each job
- **WhatsApp Notifications**: Send invoice and status updates via WhatsApp
- **Email Notifications**: Email invoices to customers

## Project Structure

```
kishor_tyres/
├── backend/                 # Django REST API
│   ├── accounts/           # User authentication
│   ├── tyres/              # Core business logic
│   │   ├── models.py       # TyreSize, Customer, RemouldingJob, Stock, etc.
│   │   ├── views.py        # API endpoints
│   │   ├── serializers.py  # Data serialization
│   │   └── utils/          # PDF generator & notifications
│   └── kishor_tyres/       # Django settings
│
└── frontend/               # React App
    ├── src/
    │   ├── pages/          # Home, Login, AdminDashboard
    │   ├── services/       # API service layer
    │   ├── context/        # Auth context
    │   └── ...
    └── public/
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd kishor_tyres/backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create .env file from template:
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

5. Run setup script to initialize database:
```bash
python setup.py
```

6. Start the development server:
```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`

Default admin credentials:
- Username: `admin`
- Password: `admin123`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd kishor_tyres/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000/`

## API Endpoints

### Authentication
- `POST /api/accounts/login/` - Login
- `POST /api/accounts/register/` - Register
- `POST /api/accounts/logout/` - Logout
- `GET /api/accounts/check-admin/` - Check if user is admin

### Tyre Management
- `GET /api/tyre-sizes/` - List all tyre sizes
- `GET /api/tyre-sizes/available/` - Available tyres for sale

### Customers
- `GET /api/customers/` - List customers
- `GET /api/customers/search/?q=query` - Search customers

### Remoulding Jobs
- `GET /api/remoulding-jobs/` - List all jobs
- `GET /api/remoulding-jobs/in_progress/` - Jobs in progress
- `GET /api/remoulding-jobs/customer_tyres/` - Completed customer jobs
- `POST /api/remoulding-jobs/` - Create new job
- `POST /api/remoulding-jobs/{id}/send_invoice/` - Send invoice

### Stock
- `GET /api/stock/` - Stock list
- `GET /api/stock/summary/` - Stock summary stats
- `GET /api/stock/for_sale/` - Remoulded tyres for sale

### Dashboard
- `GET /api/dashboard/stats/` - Dashboard statistics

## Environment Variables

### Backend (.env)
```
DEBUG=True
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Email Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Frontend (.env)
```
REACT_APP_API_URL=http://127.0.0.1:8000/api
```

## Usage

1. **Login as Admin**: Visit `http://localhost:3000/login` and use admin credentials
2. **Create New Entry**: Go to Admin Dashboard > New Entry, fill customer and tyre details
3. **Invoice Generation**: Invoice is automatically generated and sent via WhatsApp/Email
4. **Track Jobs**: Monitor job status in "In Progress" tab
5. **Stock Management**: View stock levels in "Stock in Godown" tab

## Production Deployment

### Backend
1. Set `DEBUG=False` in .env
2. Configure proper database (PostgreSQL recommended)
3. Set up proper email backend
4. Configure WhatsApp Business API
5. Use Gunicorn or uWSGI with Nginx

### Frontend
1. Build for production:
```bash
npm run build
```
2. Serve the build folder using Nginx or upload to hosting service

## Technologies Used

### Backend
- Django 4.2
- Django REST Framework
- ReportLab (PDF generation)
- Twilio (WhatsApp)
- python-dotenv

### Frontend
- React 18
- React Router 6
- Axios
- CSS3 with custom properties

## License

This project is proprietary software for Kishor Tyres.
