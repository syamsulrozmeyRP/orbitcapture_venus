# Backend Structure Document for ContentOS

## 1. Backend Architecture

**Overview**  
ContentOS’s backend is built as a set of serverless functions and managed services, centered around a self-hosted PostgreSQL database that runs inside Docker and Vercel’s serverless platform. The system follows a modular, micro-service-like design pattern where each major feature (auth, content management, AI integration, distribution, analytics) is handled by its own function or service.

How it supports our goals:  
- **Scalability:** Serverless functions scale automatically with demand. The Dockerized PostgreSQL cluster can scale vertically (larger instances) and horizontally via read replicas.  
- **Maintainability:** Clear separation of concerns (auth, content, billing, analytics) makes code easy to update and test.  
- **Performance:** Cold starts are minimized via warm-up strategies; caching and CDNs deliver low latency.

**Key Components**  
- Serverless API layer on Vercel (Next.js API routes)  
- Self-hosted PostgreSQL (Docker) for relational data and RLS enforcement  
- OpenRouter for LLM calls (GPT-4o, Claude 3.5 Sonnet)  
- Third-party APIs (social platforms, analytics tools)

---

## 2. Database Management

**Database Technology**  
- Type: Relational (SQL)  
- System: Self-hosted PostgreSQL (Docker)

**Data Structure & Access**  
- Data is organized into normalized tables (users, workspaces, content, versions, analytics, billing, etc.)  
- Access via Prisma/Drizzle or direct SQL over a secure private network (Row-level security rules enforce workspace isolation)  
- Backups and point-in-time recovery handled via pgBackRest or wal-g with automated Docker-based snapshot jobs
n**Data Management Practices**  
- Use of migrations for schema changes  
- Role-based access control at the RLS level  
- Audit logs for compliance (track record changes, user actions)  
- Encryption at rest and in transit (TLS everywhere)

---

## 3. Database Schema

**Human-Readable Table Descriptions**  
- **users**: stores user account info (id, email, hashed password, name, created_at)  
- **workspaces**: holds workspace details (id, name, branding settings, owner_id)  
- **workspace_members**: links users to workspaces with a role (Admin, Editor, Writer, Viewer)  
- **content_items**: top-level content entities (id, workspace_id, title, status, created_by, created_at)  
- **content_versions**: version history (id, content_item_id, version_number, body, updated_by, updated_at)  
- **approval_workflows**: tracks submission and approval steps (id, content_item_id, step, submitted_by, approved_by, status, timestamps)  
- **distribution_schedules**: records channel publishes (id, content_item_id, channel, scheduled_time, status)  
- **analytics_metrics**: stores aggregated metrics (id, content_item_id, metric_type, value, recorded_at)  
- **personas**: audience definitions (id, workspace_id, name, attributes)  
- **billing_subscriptions**: subscription and usage info (id, workspace_id, tier, ai_credits_used, next_billing_date)

**PostgreSQL Schema (sample)**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  branding JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id),
  user_id UUID REFERENCES users(id),
  role TEXT CHECK(role IN ('Admin','Editor','Writer','Viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(workspace_id, user_id)
);

CREATE TABLE content_items (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  title TEXT,
  status TEXT CHECK(status IN ('Draft','InReview','Approved','Published')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE content_versions (
  id UUID PRIMARY KEY,
  content_item_id UUID REFERENCES content_items(id),
  version_number INT,
  body TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (content_item_id, version_number)
);

-- Additional tables: approval_workflows, distribution_schedules,
-- analytics_metrics, personas, billing_subscriptions
```  
> Note: All tables use row-level security to ensure workspace isolation.

---

## 4. API Design and Endpoints

**Design Approach**  
- RESTful API using Next.js API routes  
- JSON over HTTPS  
- Session and service tokens issued via Clerk plus signed JWTs for internal services  
- Versioned endpoints (v1)

**Key Endpoints**  
- **Auth & Users**  
  - `POST /api/v1/auth/signup` – register via email/password  
  - `POST /api/v1/auth/login` – login and receive JWT  
  - `POST /api/v1/auth/ssologin` – Clerk SSO callback

- **Workspaces & Memberships**  
  - `GET /api/v1/workspaces` – list user’s workspaces  
  - `POST /api/v1/workspaces` – create new workspace  
  - `PUT /api/v1/workspaces/:id` – update branding/settings  
  - `POST /api/v1/workspaces/:id/members` – invite member

- **Content Planning & Editing**  
  - `GET /api/v1/content` – list content items  
  - `POST /api/v1/content` – create draft  
  - `PUT /api/v1/content/:id` – update metadata  
  - `GET /api/v1/content/:id/versions` – list versions  
  - `POST /api/v1/content/:id/versions` – save new version

- **AI Integration**  
  - `POST /api/v1/ai/headline` – generate headline suggestions  
  - `POST /api/v1/ai/seo` – run SEO analysis  
  - `POST /api/v1/ai/adapt` – adapt content for a channel

- **Approval Workflow**  
  - `POST /api/v1/content/:id/submit` – send for review  
  - `POST /api/v1/approval/:id/approve` – approve step  
  - `POST /api/v1/approval/:id/reject` – reject step

- **Distribution & Scheduling**  
  - `POST /api/v1/distribution/schedule` – schedule post  
  - `GET /api/v1/distribution/:id/status` – check publish status

- **Analytics & Reporting**  
  - `GET /api/v1/analytics/content/:id` – fetch metrics  
  - `GET /api/v1/analytics/workspace/:id` – workspace KPIs

- **Billing & Credits**  
  - `GET /api/v1/billing/subscription` – current plan  
  - `POST /api/v1/billing/upgrade` – change tier

- **Personas & ICP**  
  - `GET /api/v1/personas` – list personas  
  - `POST /api/v1/personas` – create persona

Each endpoint enforces RBAC and workspace isolation.

---

## 5. Hosting Solutions

- **Serverless API & Frontend:** Vercel  
  - Auto-scaling, global edge network, built-in CDN  
  - Seamless GitHub integration for CI/CD

- **Database:** Dockerized PostgreSQL cluster (e.g., managed via AWS ECS/Fargate, Fly.io, or bare-metal Docker host)  
  - Infrastructure-as-code provisions compute, networking, and storage volumes  
  - Automated backups and replicas managed through Docker cron jobs and pgBackRest

- **Asset Storage:** S3-compatible object storage (e.g., MinIO or AWS S3) for uploads and branding files

**Benefits**  
- **Reliability:** SLAs from Vercel and the chosen IaaS provider hosting Docker workloads  
- **Scalability:** Auto-scaling functions plus vertically scalable PostgreSQL containers with replica support  
- **Cost-effectiveness:** Pay-as-you-go serverless plus right-sized container infrastructure

---

## 6. Infrastructure Components

- **Load Balancing:** Handled by Vercel’s edge network  
- **CDN & Caching:**  
  - Vercel edge cache for static assets and API responses  
  - Object storage CDN (S3/CloudFront, R2, etc.) for images/documents

- **Cache Layer (optional/future):** Redis or in-memory cache for hot data

- **Storage:** S3-compatible object storage (MinIO in Docker for local/staging, managed S3/R2 in production) for user uploads and branding assets

- **Notifications:**  
  - Email via transactional email service (e.g., SendGrid)  
  - Slack via incoming webhooks

- **LLM Proxying:** OpenRouter as a unified gateway to multiple LLMs

These components work together to minimize latency, offload work from the DB, and ensure assets are served close to the user.

---

## 7. Security Measures

- **Authentication:** Clerk SSO + JWT session tokens issued by our auth service  
- **Authorization:** Row-Level Security in Postgres + middleware RBAC checks  
- **Data Encryption:** TLS in transit, AES-256 at rest

- **Compliance Practices:**  
  - GDPR/CCPA: Data access/deletion endpoints, privacy policy clarity  
  - Audit logs for user actions and data changes  
  - Secure data residency per region requirements

- **API Hardening:**  
  - Rate limiting on sensitive endpoints  
  - Input validation and sanitization  
  - Helmet-like security headers in responses

- **Secrets Management:**  
  - Environment variables stored securely in Vercel and the container orchestration platform (e.g., AWS SSM, Doppler)

---

## 8. Monitoring and Maintenance

- **Performance Monitoring:**  
  - Vercel Analytics for function latencies and traffic  
  - pg_stat_statements + APM (New Relic/Datadog/pgHero) for DB query performance

- **Error Tracking:** Sentry or Logflare for capturing exceptions

- **Logging:**  
  - Structured logs emitted by serverless functions and containerized services  
  - Centralized aggregation via a log management service

- **Maintenance Strategies:**  
  - Automated database migrations via Prisma/Drizzle CLI (or custom Flyway scripts) targeting Dockerized PostgreSQL  
  - Regular dependency updates via Dependabot  
  - Daily backups and point-in-time recovery tests  
  - On-call rotation and alerting (PagerDuty)

---

## 9. Conclusion and Overall Backend Summary

ContentOS’s backend combines serverless functions (Vercel) with a Docker-hosted PostgreSQL foundation to deliver a scalable, maintainable, and high-performance platform. Every component—from authentication to AI integrations and analytics—is designed with modularity, security, and compliance in mind. This setup ensures marketing teams and agencies enjoy fast content turnaround, robust security (GDPR/CCPA), and the flexibility to grow from a small team to enterprise scale without re-architecting the core backend.

**Unique Differentiators:**  
- True workspace isolation via row-level security  
- Unified LLM gateway for flexible AI provider switching  
- Built-in version history and two-step approval workflow  
- White-label branding at the hosting/CDN level

This document should serve as a clear guide to understand, maintain, and extend ContentOS’s backend architecture.