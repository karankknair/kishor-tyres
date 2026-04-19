# Kishor Tyres - Deployment Guide

Complete guide to deploy your Django + React application to production using **Render (Free Tier)** for the backend and **Vercel (Free Tier)** for the frontend.

---

## Prerequisites

- GitHub account with your code pushed
- Render account (render.com)
- Vercel account (vercel.com)

---

## Step 1: Push Code to GitHub

```bash
# Make sure all files are committed
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

---

## Step 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Complete onboarding

### 2.2 Create New Web Service
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the repository with your code

### 2.3 Configure Web Service
Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | kishor-tyres-backend |
| **Runtime** | Python 3 |
| **Build Command** | `cd backend && pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate` |
| **Start Command** | `cd backend && gunicorn kishor_tyres.wsgi:application --bind 0.0.0.0:$PORT` |

### 2.4 Add Environment Variables
In Render Dashboard → Environment:

```
DEBUG=False
SECRET_KEY=<generate-secure-key>
ALLOWED_HOSTS=kishor-tyres-backend.onrender.com,localhost
FRONTEND_URL=https://kishor-tyres.vercel.app

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Twilio (optional)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 2.5 Create PostgreSQL Database
1. Click **"New"** → **"PostgreSQL"**
2. Name: `kishor-tyres-db`
3. Plan: **Free**
4. Click **"Create Database"**

The `DATABASE_URL` will be automatically added to your web service.

### 2.6 Deploy Backend
Click **"Create Web Service"**

Wait for deployment to complete. Note your backend URL: `https://kishor-tyres-backend.onrender.com`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 3.2 Import Project
1. Click **"Add New Project"**
2. Import your GitHub repository
3. Click **"Import"**

### 3.3 Configure Build Settings

| Setting | Value |
|---------|-------|
| **Framework** | Create React App |
| **Root Directory** | frontend |
| **Build Command** | npm run build |
| **Output Directory** | build |

### 3.4 Add Environment Variable
Add this environment variable:

```
REACT_APP_API_URL=https://kishor-tyres-backend.onrender.com/api
```

**Important:** Use your actual Render backend URL!

### 3.5 Deploy Frontend
Click **"Deploy"**

Wait for deployment. Note your frontend URL: `https://kishor-tyres.vercel.app`

---

## Step 4: Update CORS (Important!)

Go back to Render Dashboard → your backend → Environment:

Add/update the `FRONTEND_URL` variable:
```
FRONTEND_URL=https://kishor-tyres.vercel.app
```

This matches your actual Vercel URL.

**Redeploy** the backend (Manual Deploy → Deploy Latest Version).

---

## Step 5: Create Admin User

In Render Dashboard → your backend → Shell:

```bash
cd backend
python manage.py createsuperuser
```

Enter username, email, and password.

---

## Step 6: Test Your Deployment

1. Visit your frontend: `https://kishor-tyres.vercel.app`
2. Try logging in with admin credentials
3. Test creating a new entry
4. Verify PDF generation and WhatsApp/email features

---

## Step 7: Setup CI/CD (Auto-Deploy)

### 7.1 Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret:

**For Render:**
1. Go to Render Dashboard → Account Settings → API Keys
2. Create new key: `RENDER_API_KEY`
3. Get Service ID from your web service URL
4. Add to GitHub Secrets:
   - `RENDER_API_KEY` - Your API key
   - `RENDER_SERVICE_ID` - Your service ID

**For Vercel:**
1. Go to Vercel Dashboard → Settings → Tokens
2. Create new token: `VERCEL_TOKEN`
3. Get Project ID from project settings
4. Get Org ID from Vercel CLI or URL
5. Add to GitHub Secrets:
   - `VERCEL_TOKEN` - Your token
   - `VERCEL_ORG_ID` - Your org ID
   - `VERCEL_PROJECT_ID` - Your project ID

### 7.2 Verify CI/CD

Now when you push to `main` branch:
1. Tests run automatically
2. Backend deploys to Render
3. Frontend deploys to Vercel

---

## Feature Development Workflow (After Deploy)

### Adding New Features

**1. Create Feature Branch**
```bash
git checkout -b feature/new-feature-name
```

**2. Make Changes**
- Edit backend: `backend/tyres/views.py`, models.py, etc.
- Edit frontend: `frontend/src/pages/...`

**3. Test Locally**
```bash
# Backend
python manage.py runserver

# Frontend (new terminal)
npm start
```

**4. Commit and Push**
```bash
git add .
git commit -m "feat: add new feature description"
git push origin feature/new-feature-name
```

**5. Create Pull Request**
- Open PR on GitHub
- Merge to `main`

**6. Auto-Deploy**
- CI/CD automatically deploys to production!
- Check GitHub Actions tab for status

### Database Migrations

If you change models:

```bash
# Local
python manage.py makemigrations
python manage.py migrate

# Push changes - migrations run automatically on Render
# OR manually in Render Shell:
cd backend
python manage.py migrate
```

---

## Free Tier Limits

### Render (Free)
- **Web Service**: Sleeps after 15 min inactivity (wakes on request)
- **PostgreSQL**: 1GB storage, sleeps after 90 days inactivity
- **Bandwidth**: 100GB/month
- **Build**: 500 minutes/month

### Vercel (Free)
- **Bandwidth**: 100GB/month
- **Builds**: 6000 minutes/month
- **Team Members**: 1
- **Concurrent Builds**: 1

**For a small tyre business, this is more than enough!**

---

## Troubleshooting

### Backend Not Connecting
1. Check `FRONTEND_URL` in Render env vars
2. Check CORS settings in `settings.py`
3. Check browser console for CORS errors

### Database Issues
1. Check `DATABASE_URL` is set
2. Run migrations manually in Render shell
3. Check PostgreSQL service is running

### Static Files Not Loading
1. Check `collectstatic` ran during build
2. Check Whitenoise is installed and configured

### Media Files (Images) Not Persisting
1. Free tier has ephemeral filesystem
2. For production, use AWS S3 or Cloudinary
3. Or upgrade to paid tier with persistent disk

---

## Upgrading to Production

When ready to scale:

### Render
- Upgrade Web Service to **Starter** ($7/month) - No sleeping
- Upgrade PostgreSQL to **Starter** ($7/month) - 10GB, no sleeping

### Vercel
- Upgrade to **Pro** ($20/month) - More bandwidth, team features

### Media Storage
- Add AWS S3 or Cloudinary for persistent file storage
- Install `django-storages` and `boto3`

---

## Summary

You now have:
- **Backend**: Deployed on Render with PostgreSQL
- **Frontend**: Deployed on Vercel with CDN
- **CI/CD**: Auto-deploy on every push to main
- **Free**: $0/month cost
- **Secure**: Environment variables, HTTPS, production settings

**Your app is live and ready for business!**
