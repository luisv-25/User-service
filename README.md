# user-service

Registro, login (JWT), perfiles, disponibilidad y verificación de credenciales de tutores.

Parte de **EduConecta** (plataforma de tutorías, arquitectura de microservicios). Stack: NestJS · TypeORM · PostgreSQL · RabbitMQ.

## Requisitos
- Node.js 20+
- PostgreSQL 14+ (local o Neon)
- RabbitMQ (CloudAMQP o local)

## Puesta en marcha
```bash
cd user-service
cp .env.example .env   # completar valores
npm install
npm run start:dev      # desarrollo
npm run build && npm start   # producción
```
El servicio escucha en `PORT` (por defecto 5433). Salud: `GET /health` y `GET /ready`; métricas: `GET /metrics`.

## Variables de entorno
Ver `.env.example`. Todos los servicios que validan JWT deben usar el **mismo** `JWT_SECRET` (y el gateway también).

## Endpoints
| Método | Ruta |
|---|---|
| POST | `/api/v1/auth/register` |
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/refresh-token` |
| POST | `/api/v1/users/:id/credentials` |
| GET | `/api/v1/users/:id/credentials` |
| GET | `/api/v1/credentials/pending` |
| PATCH | `/api/v1/credentials/:credentialId/verify` |
| PATCH | `/api/v1/users/:id` |
| GET | `/api/v1/users` |
| GET | `/api/v1/users/:id` |
| DELETE | `/api/v1/users/:id` |
| GET | `/api/v1/users/:id/availability` |
| PATCH | `/api/v1/users/:id/availability` |

## Mensajería (RabbitMQ)
- Colas: `user_events_queue`
- Publica: `tutor.verification.updated`, `user.created`, `user.deleted`, `user.updated`

## Pruebas
```bash
npm run test:unit
npm run test:integration   # requiere PostgreSQL (TEST_DB_PASSWORD)
```
CI/CD: GitHub Actions (`.github/workflows/ci.yml` y `deploy.yml`, despliegue a Render por Deploy Hook).
