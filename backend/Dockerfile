FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema operativo (para psycopg2 y criptografía)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Instalar adaptador de Postgres puro para producción
RUN pip install --no-cache-dir psycopg2-binary asyncpg

COPY . .

# Comando de producción de la API
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
