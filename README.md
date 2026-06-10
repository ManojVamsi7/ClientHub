# ClientHub — Corporate Client & Recruiter QA Tracker

ClientHub is a premium, full-stack client management portal designed to centralize support operations and recruiter quality auditing. It replaces fragmented workflows and spreadsheets with a cohesive PostgreSQL database, secure JWT authorization, and a glassy, dark-themed React visualization dashboard.

---

## 🚀 Quick Start (Docker Compose)

Start the entire stack (PostgreSQL database, backend REST API, and built React client) in a single command.

1. Ensure you have **Docker** and **Docker Compose** installed.
2. In the root directory, run:
   ```bash
   docker-compose up --build
   ```
3. The app is ready! Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Sign in with the default credentials listed below.

---

## 🔑 Default Credentials (Seeded Users)

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@example.com` | `Admin123!` | Full CRUD on all data, register users, permanent deletes |
| **Recruiter** | `sarah@example.com` | `Recruit123!` | Create & edit clients, queries, calls, mistakes. Cannot delete. |
| **Recruiter** | `mike@example.com` | `Recruit123!` | Create & edit clients, queries, calls, mistakes. Cannot delete. |
| **Viewer** | `viewer@example.com` | `Viewer123!` | Read-only access to all dashboards and tables. No updates. |

---

## 🛠️ Local Development (Separate Services)

If you prefer running services separately for rapid development:

### 1. Database Setup
Ensure you have **PostgreSQL** running locally and create a database named `client_mgmt` (plus `client_mgmt_test` for running tests):
```sql
CREATE DATABASE client_mgmt;
CREATE DATABASE client_mgmt_test;
```

### 2. Backend API Setup
1. Open the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment file and configure DB parameters (matching your local Postgres instance):
   ```bash
   cp .env.example .env
   ```
4. Run migrations and database seeds:
   ```bash
   npm run migrate
   ```
   ```bash
   npm run seed
   ```
5. Start development server (nodemon):
   ```bash
   npm run dev
   ```
   Backend will run on [http://localhost:3000](http://localhost:3000).

### 3. Frontend Client Setup
1. Open the client directory in a separate terminal:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   Frontend will run on [http://localhost:5173](http://localhost:5173) and proxy API requests automatically to port `3000`.

---

## 🧪 Running Backend Tests

Run unit and integration tests (using Jest & Supertest):
```bash
cd server
npm test
```
To check test coverage report:
```bash
npm run test:coverage
```

---

## 📂 Project Structure

```
Management/
├── client/                          # ─── FRONTEND (Vite + React) ───
│   ├── src/
│   │   ├── components/              # Reusable UI & Chart wrappers
│   │   ├── context/                 # AuthContext & Protected Routes
│   │   ├── hooks/                   # useAuth, usePagination, useDebounce
│   │   ├── pages/                   # Login, Dashboard, Clients, Queries, QA
│   │   ├── services/                # Axios instance + API client layers
│   │   └── utils/                   # Constants (Color maps) & Formatters
│   ├── index.html                   # HTML Entry Point
│   └── vite.config.js               # Dev server port & proxy configurations
│
├── server/                          # ─── BACKEND (Express + Knex + PG) ───
│   ├── db/                          # Database migrations & seed scripts
│   ├── src/
│   │   ├── config/                  # Database connections & Env loaders
│   │   ├── controllers/             # REST controller handlers
│   │   ├── middleware/              # Auth, RBAC validation, error hooks
│   │   ├── routes/                  # Express route endpoint mounts
│   │   ├── services/                # Database Knex query builders
│   │   └── validations/             # Joi input body schema guards
│   ├── knexfile.js                  # Database environment configurations
│   └── server.js                    # Server launcher
│
├── Dockerfile                       # Production multi-stage build runner
└── docker-compose.yml               # Container orchestrator
```
