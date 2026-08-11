# Docker e CI/CD di Base

## Perché containerizzare fin da subito

Anche per un progetto didattico o un MVP, avviare Postgres, Redis, backend e frontend tutti insieme con un comando solo evita il classico problema "sul mio computer funziona": ogni collaboratore (o il proprio io futuro, mesi dopo) riparte da un ambiente identico.

## docker-compose.yml (sviluppo locale)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: gestionale
      POSTGRES_PASSWORD: gestionale
      POSTGRES_DB: gestionale
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gestionale"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  adminer:
    image: adminer
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  backend:
    build:
      context: ./backend
      target: development
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      DATABASE_URL: postgresql://gestionale:gestionale@postgres:5432/gestionale
      REDIS_URL: redis://redis:6379
      DJANGO_SECRET_KEY: ${DJANGO_SECRET_KEY}
      DJANGO_DEBUG: "True"
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    command: python manage.py runserver 0.0.0.0:8000

  celery-worker:
    build:
      context: ./backend
      target: development
    restart: unless-stopped
    depends_on:
      - backend
      - redis
    environment:
      DATABASE_URL: postgresql://gestionale:gestionale@postgres:5432/gestionale
      REDIS_URL: redis://redis:6379
      DJANGO_SECRET_KEY: ${DJANGO_SECRET_KEY}
    volumes:
      - ./backend:/app
    command: celery -A config worker -l info

  frontend:
    build:
      context: ./frontend
      target: development
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:8000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev -- --host

volumes:
  postgres_data:
  redis_data:
```

Rispetto a uno stack Node, qui si aggiunge `celery-worker`: il processo separato che esegue i task asincroni (invio email, generazione report, promemoria prenotazioni) descritti negli altri file. `adminer` è un client DB via browser, comodo in sviluppo (`http://localhost:8080`); da rimuovere in produzione.

## Dockerfile — backend (Django, multi-stage)

```dockerfile
# ---- Base ----
FROM python:3.13-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt .

# ---- Sviluppo ----
FROM base AS development
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ---- Produzione ----
FROM base AS production
RUN pip install --no-cache-dir -r requirements.txt gunicorn
COPY . .
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

A differenza di un backend Node, non serve uno stage di build separato (Python è interpretato): lo stage `production` installa le dipendenze e serve l'app con **Gunicorn** invece del server di sviluppo di Django.

## Dockerfile — frontend (Vite + React, multi-stage)

Il frontend resta React indipendentemente dal linguaggio del backend, quindi il Dockerfile non cambia:

```dockerfile
# ---- Base ----
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- Sviluppo ----
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ---- Build (per produzione) ----
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# ---- Produzione ----
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

`nginx.conf` minimo, necessario perché il routing di React Router funzioni anche dopo il refresh della pagina:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## .env.example

```
# Database
DATABASE_URL=postgresql://gestionale:gestionale@localhost:5432/gestionale

# Redis
REDIS_URL=redis://localhost:6379

# Django
DJANGO_SECRET_KEY=cambia-questo-con-un-segreto-forte-e-casuale
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# JWT (djangorestframework-simplejwt)
JWT_ACCESS_EXPIRATION_MINUTES=15
JWT_REFRESH_EXPIRATION_DAYS=30

# Frontend
VITE_API_URL=http://localhost:8000/api/v1

# Storage compatibile S3 (opzionale)
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

`.env.example` va committato nel repository (senza valori reali); il file `.env` effettivo resta sempre in `.gitignore`.

## Sviluppo vs produzione

- **Sviluppo**: `docker-compose.yml` con stage `development`, codice montato come volume, `runserver` con reload automatico
- **Produzione**: build con stage `production` (`docker build --target production`), nessun codice sorgente montato, servito da Gunicorn dietro un reverse proxy (nginx o quello del provider di hosting)

## Healthcheck applicativo

- **django-health-check** espone un endpoint `/health` che verifica DB, cache/Redis e altri servizi collegati — equivalente Python di `@nestjs/terminus`, utile sia per gli healthcheck di Docker sia per il monitoraggio in produzione

## CI — GitHub Actions di base

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
          cache: pip
      - run: pip install -r requirements.txt
      - run: ruff check .
      - run: pytest
      - run: python manage.py migrate --check

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**ruff** è oggi il linter/formatter Python più veloce e diffuso, equivalente a ESLint+Prettier lato Node.

## CD — cenni al deploy

Lo step di deploy vero e proprio dipende dall'hosting scelto (vedi `09-hosting-e-dominio.md`), ma il pattern generale è:

1. Un secondo workflow (es. `.github/workflows/deploy.yml`), attivato solo su push a `main` e solo se la CI è passata
2. Costruzione dell'immagine Docker con lo stage `production`
3. Push dell'immagine a un registry (es. GitHub Container Registry) oppure deploy diretto tramite la CLI/azione ufficiale del provider scelto (Railway, Render...)
4. Su VPS con Docker Compose: uno step che si connette via SSH ed esegue `docker compose pull && docker compose up -d`

## Checklist

- [ ] `docker compose up` avvia l'intero ambiente (DB, cache, backend, worker, frontend) con un solo comando
- [ ] `.env.example` presente e aggiornato, `.env` reale mai committato
- [ ] Dockerfile con stage separati per sviluppo e produzione
- [ ] Endpoint di healthcheck applicativo funzionante
- [ ] Pipeline CI verde su lint, test e build per entrambi i progetti
- [ ] Pipeline di deploy testata almeno una volta end-to-end verso l'ambiente di staging
