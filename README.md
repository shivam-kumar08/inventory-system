# InvenTrack — Inventory & Order Management System

A full-stack production-ready inventory system built with Flask, PostgreSQL, React, and Docker.

## Tech Stack

| Layer    | Technology              |
|----------|------------------------|
| Backend  | Flask + SQLAlchemy      |
| Database | PostgreSQL 16           |
| Frontend | React 18 + React Router |
| DevOps   | Docker + Docker Compose |

## Features

- **Products**: Full CRUD with unique SKU enforcement
- **Customers**: Full CRUD with unique email enforcement
- **Orders**: Create orders with multi-item support, auto stock deduction, stock validation
- **Dashboard**: Live stats, low-stock alerts, recent orders
- Business rules enforced at API level (stock insufficient → 422 error)

---

## Project Structure

```
inventory-system/
├── backend/
│   ├── app/
│   │   ├── __init__.py         # Flask app factory
│   │   ├── models/
│   │   │   └── __init__.py     # SQLAlchemy models
│   │   └── routes/
│   │       ├── products.py
│   │       ├── customers.py
│   │       └── orders.py
│   ├── run.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/index.js        # Axios API client
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Products.js
│   │   │   ├── Customers.js
│   │   │   └── Orders.js
│   │   ├── App.js
│   │   └── index.js
│   ├── public/index.html
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start (Docker — Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/inventory-system.git
cd inventory-system
```

### Step 2 — Create Environment File

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work out of the box for local dev):

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=inventory
SECRET_KEY=change-me-in-production
FLASK_ENV=production
REACT_APP_API_URL=http://localhost:5000
```

### Step 3 — Build and Start All Services

```bash
docker compose up --build
```

This will:
1. Pull PostgreSQL 16 image
2. Build the Flask backend (installs Python dependencies)
3. Build the React frontend (npm install + npm run build + nginx)
4. Auto-create all database tables via SQLAlchemy

Wait for logs to show:
```
inventory_backend  | [INFO] Starting gunicorn ...
inventory_frontend | nginx: configuration file /etc/nginx/conf.d/default.conf test is successful
```

### Step 4 — Open the App

| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:3000     |
| Backend  | http://localhost:5000     |
| API docs | http://localhost:5000/api/health |

---

## Running Without Docker (Local Dev)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env → set DATABASE_URL to your local PostgreSQL instance

# Run database migrations
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"

# Start backend
python run.py
# Backend runs on http://localhost:5000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Set API URL
echo "REACT_APP_API_URL=http://localhost:5000" > .env.local

# Start frontend
npm start
# Frontend runs on http://localhost:3000
```

---

## API Reference

### Health
```
GET /api/health
```

### Products
```
GET    /api/products/           List all products
GET    /api/products/<id>       Get one product
POST   /api/products/           Create product
PUT    /api/products/<id>       Update product
DELETE /api/products/<id>       Delete product
```

**Create/Update body:**
```json
{
  "name": "Laptop",
  "sku": "LAP-001",
  "description": "15-inch laptop",
  "price": 45000.00,
  "stock": 50
}
```

### Customers
```
GET    /api/customers/          List all customers
GET    /api/customers/<id>      Get one customer
POST   /api/customers/          Create customer
PUT    /api/customers/<id>      Update customer
DELETE /api/customers/<id>      Delete customer
```

**Create/Update body:**
```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "phone": "+91 98765 43210",
  "address": "Meerut, UP"
}
```

### Orders
```
GET    /api/orders/             List all orders
GET    /api/orders/<id>         Get one order
POST   /api/orders/             Create order (auto-deducts stock)
PUT    /api/orders/<id>         Update order status
DELETE /api/orders/<id>         Delete order
```

**Create body:**
```json
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

**Business Rules enforced:**
- SKU must be unique (409 Conflict if duplicate)
- Email must be unique (409 Conflict if duplicate)
- Each order item: quantity must be ≤ available stock (422 if insufficient)
- Stock is deducted atomically when order is placed

---

## Docker Hub Push (for assignment submission)

```bash
# Login
docker login

# Tag and push backend
docker build -t YOUR_DOCKERHUB_USERNAME/inventory-backend:latest ./backend
docker push YOUR_DOCKERHUB_USERNAME/inventory-backend:latest

# Tag and push frontend
docker build -t YOUR_DOCKERHUB_USERNAME/inventory-frontend:latest ./frontend
docker push YOUR_DOCKERHUB_USERNAME/inventory-frontend:latest
```

---

## Deploying to Free Hosting

### Backend → Render.com (Free)

1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo → select `backend/` as root
3. Set:
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn --bind 0.0.0.0:$PORT run:app`
4. Add environment variables:
   - `DATABASE_URL` → your Render PostgreSQL URL
   - `SECRET_KEY` → any random string
5. Add a **PostgreSQL** database from Render dashboard → copy the internal URL

### Frontend → Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → New Project → Import GitHub repo
2. Set root to `frontend/`
3. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-render-backend.onrender.com`
4. Deploy

---

## Useful Docker Commands

```bash
# Start in background
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop everything
docker compose down

# Stop and wipe database
docker compose down -v

# Rebuild a single service
docker compose up --build backend

# Open bash in backend container
docker compose exec backend bash

# Run a one-off command in backend
docker compose exec backend python -c "from app import create_app, db; ..."
```

---

## Environment Variables

| Variable           | Description                        | Default            |
|--------------------|------------------------------------|--------------------|
| `POSTGRES_USER`    | DB username                        | postgres           |
| `POSTGRES_PASSWORD`| DB password                        | postgres           |
| `POSTGRES_DB`      | DB name                            | inventory          |
| `DATABASE_URL`     | Full PostgreSQL connection string  | (auto-built)       |
| `SECRET_KEY`       | Flask secret key                   | dev-secret-key     |
| `FLASK_ENV`        | production / development           | production         |
| `REACT_APP_API_URL`| Backend base URL for frontend      | http://localhost:5000 |
