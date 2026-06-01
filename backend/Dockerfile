FROM python:3.12-slim

WORKDIR /app

# Install system deps for psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Wait for DB then run migrations and start server
CMD ["sh", "-c", "python -c \"from app import create_app, db; app = create_app(); app.app_context().push(); db.create_all()\" && gunicorn --bind 0.0.0.0:5000 --workers 2 run:app"]
