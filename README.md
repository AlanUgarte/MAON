# COMPVEN · CRM Comercial (WhatsApp Business + Meta Ads + IA Claude)

CRM para administrar leads de **Meta Ads** y **WhatsApp Business**, con clasificación por IA (**Claude / Anthropic**), automatización de seguimientos y campañas masivas. Pensado para venta de productos físicos.

- **Frontend:** Next.js 15 · React 19 · TypeScript · Tailwind · diseño "sales cockpit" (modo oscuro/claro)
- **Backend:** NestJS · TypeScript · Prisma · PostgreSQL · JWT · Swagger
- **IA:** Anthropic Claude vía `AIService` con **sistema híbrido** para reducir costos
- **Infra:** Docker + Docker Compose

> **Estado:** MVP funcional (Fase 1). El backend incluye auth, CRM, bandeja, webhook de WhatsApp, IA, productos, campañas, automatizaciones y dashboard. El frontend trae todas las pantallas con datos mock para verse "vivo" sin backend. Al final hay un **roadmap** de lo que sigue.

---

## 1. Requisitos

- Node.js 20+
- PostgreSQL 16+ (o usar el contenedor de Docker)
- Una API key de Anthropic (opcional: sin ella, la IA usa un fallback heurístico y el CRM sigue funcionando)

---

## 2. Arranque rápido con Docker (recomendado)

```bash
cp .env.example .env        # completá ANTHROPIC_API_KEY si tenés
docker compose up --build
```

Esto levanta tres servicios:

| Servicio  | URL                          |
|-----------|------------------------------|
| Frontend  | http://localhost:3000        |
| Backend   | http://localhost:4000/api    |
| API Docs  | http://localhost:4000/docs   |
| Postgres  | localhost:5432               |

Luego, cargá los datos de prueba (una sola vez):

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```

**Login demo:** `admin@crm.com` / `admin1234`

---

## 3. Desarrollo local (sin Docker)

### Backend

```bash
cd backend
npm install
cp .env.example .env         # configurá DATABASE_URL y, opcional, ANTHROPIC_API_KEY
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev            # API en http://localhost:4000/api  ·  Docs en /docs
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                  # http://localhost:3000
```

> El frontend funciona con datos **mock** (`src/lib/mock.ts`) para verse completo sin backend. Para conectarlo a la API real, usá los métodos de `src/lib/api.ts` en lugar de los mocks.

---

## 4. La IA y el ahorro de costos

Toda la lógica de IA pasa por `backend/src/ai/ai.service.ts`. Estrategia híbrida:

1. **Respuestas predefinidas (sin costo):** precio, stock, horarios, ubicación, medios de pago y envíos se resuelven con plantillas en `predefined-responses.ts`.
2. **Claude (sólo cuando aporta):** negociación, mayoristas, múltiples preguntas o ambigüedad.

Un **único** llamado a Claude (`analyzeConversation`) devuelve todas las funciones a la vez: intención de compra (Alta/Media/Baja), lead score (0–100), sentimiento, objeción, próxima acción, resumen ejecutivo y 3 respuestas sugeridas. Cada análisis registra tokens consumidos en la tabla `AIAnalysis` (auditoría de costos).

Sin `ANTHROPIC_API_KEY`, el servicio usa heurísticas: el CRM sigue 100% operativo para demo.

---

## 5. Integración WhatsApp Business Cloud API

- **Webhook:** `GET/POST /api/whatsapp/webhook`
- Verificá el webhook en Meta con `WHATSAPP_VERIFY_TOKEN`.
- Cada mensaje entrante crea automáticamente: **lead → conversación → mensaje**, dispara la capa de IA y, si corresponde, responde una FAQ sin gastar IA.
- Sin token de WhatsApp configurado, los envíos quedan en **modo simulado** (se loguean), ideal para desarrollo.

---

## 6. Despliegue en VPS Ubuntu

```bash
# 1. Instalar Docker + Compose
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker

# 2. Clonar y configurar
git clone <tu-repo> vendix && cd vendix
cp .env.example .env
nano .env     # JWT_SECRET fuerte, ANTHROPIC_API_KEY, credenciales WhatsApp

# 3. Levantar
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed   # opcional

# 4. (Recomendado) Nginx + HTTPS como reverse proxy
#    frontend → puerto 3000 · backend (/api, /docs, /whatsapp) → puerto 4000
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

Ejemplo mínimo de Nginx:

```nginx
server {
  server_name tudominio.com;
  location /api      { proxy_pass http://localhost:4000; }
  location /docs     { proxy_pass http://localhost:4000; }
  location /whatsapp { proxy_pass http://localhost:4000; }
  location /         { proxy_pass http://localhost:3000; }
}
```

---

## 7. Estructura

```
crm-comercial/
├─ backend/                 NestJS + Prisma
│  ├─ prisma/               schema.prisma · seed.ts
│  └─ src/
│     ├─ ai/                AIService · sistema híbrido · prompts
│     ├─ auth/              JWT + roles
│     ├─ clients/           CRM (filtros, pipeline, notas, tags)
│     ├─ conversations/     bandeja
│     ├─ whatsapp/          webhook Cloud API + sender
│     ├─ products/  campaigns/  automations/  dashboard/
│     └─ common/            guards · decorators
├─ frontend/                Next.js 15 (App Router)
│  └─ src/
│     ├─ app/               login + dashboard, clientes, bandeja, productos, campañas, seguimientos
│     ├─ components/        ui/ (shadcn-style) + app/ (sidebar, score-gauge, charts…)
│     └─ lib/               utils · mock · api
├─ docker-compose.yml
└─ .env.example
```

---

## 8. Roadmap (próximas fases)

Implementado en Fase 1: dashboard, CRM, bandeja, WhatsApp webhook, IA híbrida, productos, campañas, automatizaciones, auth con roles, seeds, Docker.

Pendiente / mejoras:

- **Reportes (módulo 11):** exportación a Excel/CSV/PDF de clientes, ventas, conversión y campañas.
- **Meta Ads (módulo 10):** sincronización real de campañas/ad sets/ads vía Marketing API (hoy queda el modelo `MetaCampaign` y la atribución por lead/venta).
- **Usuarios y permisos (módulo 12):** ABM de usuarios y matriz de permisos desde la UI (el backend ya distingue ADMINISTRADOR / SUPERVISOR / VENDEDOR).
- **Conexión front↔back:** reemplazar los mocks del frontend por los llamados de `lib/api.ts` + manejo de sesión JWT.
- **Realtime:** WebSocket/SSE para que la bandeja se actualice en vivo.
- **Plantillas de WhatsApp:** gestor de plantillas aprobadas por Meta.

---

Hecho con foco en un MVP que se pueda correr hoy y escalar mañana.
