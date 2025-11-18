# Tech Stack Document for ContentOS

This document explains, in simple terms, the technology choices behind ContentOS. It shows how each piece works together to help marketing teams plan, create, optimize, and distribute content—all in one place.

## 1. Frontend Technologies
These are the tools we use to build what users see and interact with.

- **Next.js 16 (App Router)**
  - A React-based framework that makes page routing, server-side rendering, and performance optimizations easy.
  - Provides fast page loads and SEO-friendly pages out of the box.
- **TypeScript**
  - A superset of JavaScript that adds type checking.
  - Helps catch errors early and makes code easier to understand and maintain.
- **Tailwind CSS**
  - A utility-first styling tool that lets us create custom designs without writing a lot of custom CSS.
  - Ensures a consistent, responsive look across the entire app.
- **shadcn UI**
  - A library of pre-built, accessible UI components styled with Tailwind CSS.
  - Speeds up development while keeping the interface clean and modern.
- **Liveblocks.io**
  - Enables real-time collaboration in the content editor (multiple users can edit at once).
  - Syncs changes instantly, like Google Docs.
- **Editor.js**
  - Provides the block-based editing canvas described in the base concepts guide.
  - Supports custom tools for SEO metadata, personas, and channel snippets.
- **Clerk**
  - Provides pre-built user authentication components (signup, login, user profile).
  - Works alongside our PostgreSQL-backed RBAC service to give flexible sign-in options (email, social logins, SSO).

**How these choices improve the user experience**
- Fast, interactive pages with minimal loading delays.
- A sleek, consistent design that adapts to any screen size.
- Real-time co-editing so teams can work together smoothly.
- Built-in accessibility and SEO optimizations.

## 2. Backend Technologies
These tools power the business logic, data storage, and real-time features.

- **Self-Hosted PostgreSQL (Docker)**
  - Stores all content, version history, persona data, and analytics.
  - Uses native row-level security for fine-grained access control.
- **RBAC & Workspace Services**
  - Clerk issues auth tokens while PostgreSQL enforces workspace membership and roles (Admin, Editor, Writer, Viewer).
  - Fully under our control for compliance and tenancy guarantees.
- **S3-Compatible Object Storage (e.g., MinIO/AWS S3)**
  - Stores media assets (images, documents) securely.
  - Provides signed URLs for safe file access.
- **OpenRouter**
  - Routes requests to different large language models (LLMs) based on needs or availability.
  - Allows flexibility to add or swap AI providers in the future.

**How these components work together**
1. Users log in via Clerk.  
2. Requests go to Next.js API routes or Edge Functions.  
3. Data is saved or retrieved from the Dockerized PostgreSQL database and S3-compatible storage.  
4. AI calls are routed through OpenRouter to GPT-4o, Claude 3.5 Sonnet, or other models.  
5. Real-time updates (like co-editing) sync through Liveblocks.io.
- **Security and Performance Considerations**

- **Authentication & Access Control**
  - Role-based permissions enforced by PostgreSQL row-level security and Clerk-issued identities.
  - Optional multi-factor authentication handled by Clerk.
- **Data Protection**
  - Encrypted in transit (HTTPS) and at rest (disk encryption & encrypted object storage).
  - GDPR & CCPA compliance: data export, deletion, and user consent flows.
- **Performance Optimizations**
  - Server-side rendering and static generation in Next.js for faster page loads.
  - Tailwind CSS tree-shaking to remove unused styles.
  - Edge caching on Vercel to serve assets from locations close to users.
  - Database indexing and query optimization managed directly on PostgreSQL.
  - Uses encrypted environment variables for API keys, database URLs, and secrets.

**Benefits**
- Instant preview deployments for testing new features.
- Automated quality checks to catch bugs before they reach production.
- Scales easily as user traffic grows.

## 4. Third-Party Integrations
These are external services we connect to, adding extra capabilities without building everything from scratch.

- **Content Channels**
  - Webflow, WordPress: Website publishing
  - LinkedIn, Facebook, Instagram, Reddit: Social media distribution
  - Mailchimp, Substack: Email newsletters
- **Analytics**
  - Google Search Console, GA4, Microsoft Webmaster: Traffic and engagement data
- **Communication**
  - Slack: Notifications for approval steps and AI agent alerts
- **AI Models**
  - GPT-4o, Claude 3.5 Sonnet: Core content generation and optimization
  - OpenRouter: Flexible model routing

**Why these integrations matter**
- One-click publishing across multiple channels.
- Centralized performance tracking in our dashboard.
- Automated notifications keep teams on schedule.
- Ability to swap or add AI models without major code changes.

## 5. Security and Performance Considerations
We built security and speed in from the start to protect user data and ensure a smooth experience.

- **Authentication & Access Control**
  - Role-based permissions enforced by PostgreSQL row-level security and Clerk.
  - Two-factor authentication options provided through Clerk.
- **Data Protection**
  - Encrypted in transit (HTTPS) and at rest (database encryption).
  - GDPR & CCPA compliance: data export, deletion, and user consent flows.
- **Performance Optimizations**
  - Server-side rendering and static generation in Next.js for faster page loads.
  - Tailwind CSS tree-shaking to remove unused styles.
  - Edge caching on Vercel to serve assets from locations close to users.
  - Database indexing and query optimization managed directly on PostgreSQL.

## 6. Conclusion and Overall Tech Stack Summary

ContentOS brings together cutting-edge frontend tools, a flexible serverless backend, and powerful AI integrations to deliver a unified content management platform. Here’s how it all aligns:

- **User-Friendly Interface** built with Next.js, TypeScript, Tailwind CSS, and shadcn UI.
- **Secure, Scalable Backend** powered by Dockerized PostgreSQL plus S3-compatible storage for data and assets.
- **Real-Time Collaboration** via Liveblocks.io, plus flexible authentication by Clerk.
- **AI-Driven Content** from GPT-4o, Claude 3.5 Sonnet, managed through OpenRouter.
- **Seamless Deployments** on Vercel with GitHub Actions and GitHub version control.
- **Extensive Integrations** for publishing, analytics, and communications.
- **Robust Security & Compliance** with GDPR/CCPA, TLS, encryption, and RLS.

This stack ensures that marketing teams and agencies can plan, create, approve, publish, and analyze content all within one reliable, high-performance platform.