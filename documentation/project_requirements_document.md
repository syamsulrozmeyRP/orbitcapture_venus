# Project Requirements Document (PRD) for ContentOS

## 1. Project Overview

ContentOS is a unified content management platform built for marketing teams and agencies. It solves the problem of fragmented workflows—where planning, writing, approving, publishing, and analyzing content happen in separate tools—by bringing everything into one collaborative hub. Advanced AI models power ideation, drafting, SEO optimization, tone and persona alignment, and multi-channel adaptation, so teams can work faster and with consistent quality.

We’re building ContentOS to streamline the full content lifecycle, reduce manual handoffs, and deliver data-driven insights. Key success criteria include faster turnaround times (24–48 hour review cycles), higher content engagement (measured by click-through rates and conversions), and adoption by agencies using the white-label option. The platform must be easy to use, secure (GDPR/CCPA compliant), and scalable across small teams and large enterprises.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (MVP Features)

*   User registration, email login, and single sign-on (SSO) via Clerk.
*   Workspace creation with custom branding (white-label domains, light/dark themes).
*   Role-based permissions: Admin, Editor, Writer, Viewer.
*   Centralized content calendar for planning and scheduling.
*   AI-powered content editor with real-time SEO suggestions and persona prompts.
*   Full version history and rollback for every piece of content.
*   Two-step approval workflow with email and Slack notifications.
*   Multi-channel distribution: Webflow, WordPress, LinkedIn, Facebook, Instagram, Reddit, Mailchimp, Substack.
*   Automated content adaptation (formatting, image sizing, metadata) per channel.
*   Analytics dashboard: CTR, time on page, conversion rate, engagement KPIs, newsletter open rates.
*   Integrations: Google Search Console, GA4, Microsoft Webmaster.
*   Data security and privacy controls aligned with GDPR and CCPA.
*   Basic AI-credits usage tracking and subscription tiers with free trial.

### Out-of-Scope (Future Phases)

*   Support for multiple languages or region-specific variations beyond English (UK/US).
*   Mobile-native apps (iOS/Android).
*   Advanced workflow automation (e.g., custom triggers, webhooks).
*   Additional channel integrations (e.g., Twitter/X, Medium, Google My Business).
*   Deep analytics forecasting or machine-learning–driven insights beyond initial AI suggestions.
*   Offline or desktop editing modes.
*   Custom plugin or extension marketplaces.

## 3. User Flow

When a new user arrives, they land on a signup page and choose between email/password registration or single sign-on (SSO). After verifying their email, users pick or create a workspace, configure a custom domain and theme (light/dark), and define initial AI goals (tone of voice, ICP). The onboarding wizard then highlights core modules (Planner, Editor, Distribution, Analytics).

Inside a workspace, the user sees a Dashboard summarizing upcoming tasks, AI credit balance, and key metrics. From here they jump into the Content Planner (calendar view) to schedule new items. Clicking a date opens the AI-assisted editor where they draft content, adjust tone or keywords, and invite collaborators. Once the draft is ready, they assign it for review. Assigned editors receive Slack and email alerts, review inline comments, and either request changes or approve. After final approval, the item moves to the Distribution Center, where the user picks channels, customizes formats, and hits “Publish.” Post-publish metrics appear in Analytics, guiding future planning.

## 4. Core Features

*   **Authentication & Workspaces**\
    ­– Email/password and SSO (Clerk)\
    ­– Multiple isolated workspaces with custom domains and themes\
    ­– Role-based access: Admin, Editor, Writer, Viewer
*   **Content Planning & Calendar**\
    ­– Month/week/day views\
    ­– AI headline and outline suggestions tied to persona/ICP\
    ­– Task assignments and due dates
*   **AI-Powered Editor**\
    ­– GPT-4o and Claude 3.5 Sonnet via OpenRouter\
    ­– Inline SEO (AEO/GEO/SEO) prompts, tone controls, persona targeting\
    ­– Block-based editing powered by Editor.js\
    ­– Real-time collaboration (Liveblocks.io)\
    ­– Full version history and rollback
*   **Approval Workflow**\
    ­– Two-step review: Editor, then Manager\
    ­– Email and Slack notifications\
    ­– Approval queue with status tracking
*   **Multi-Channel Distribution**\
    ­– Webflow, WordPress, LinkedIn, Facebook, Instagram, Reddit, Mailchimp, Substack\
    ­– Auto-adapt formatting, images, metadata per channel\
    ­– Scheduling and immediate publish options
*   **Analytics & Insights**\
    ­– Aggregated metrics: CTR, time on page, conversions, engagement (likes, shares, comments)\
    ­– Channel-specific KPIs: open rates, impressions, reach\
    ­– AI-driven optimization suggestions
*   **Persona & Competitor Management**\
    ­– Define and store ICPs and audience personas\
    ­– Competitor list with URL/keyword tracking\
    ­– Automated gap analysis reports
*   **Billing & AI Credits**\
    ­– Subscription tiers with included seats and credits\
    ­– Usage-based billing for extra AI credits\
    ­– Free trial period
*   **Security & Compliance**\
    ­– GDPR & CCPA alignment\
    ­– Data export, deletion, and consent management\
    ­– Clerk auth with PostgreSQL row-level security

## 5. Tech Stack & Tools

*   **Frontend**\
    ­– Next.js 16 (app router) for server-rendering and routing\
    ­– TypeScript for type safety\
    ­– Tailwind CSS + shadcn UI for styling/components
*   **Backend & Storage**\
    ­– Self-hosted PostgreSQL (Docker) with custom APIs\
    ­– Liveblocks.io for real-time collaboration\
    ­– Clerk for SSO integration
*   **AI Integration**\
    ­– GPT-4o and Claude 3.5 Sonnet via OpenRouter for flexible LLM selection\
    ­– Custom AI agents for continuous optimization
*   **Integrations & Analytics**\
    ­– Google Search Console, GA4, Microsoft Webmaster APIs\
    ­– Social and email platform SDKs (WordPress, Webflow, LinkedIn, Facebook, Instagram, Reddit, Mailchimp, Substack)
*   **IDE & Plugins (optional)**\
    ­– VS Code with Cursor for AI-assisted coding\
    ­– Windsurf for workflow automation

## 6. Non-Functional Requirements

*   **Performance**\
    ­– Dashboard and editor should load within 2 seconds on a 4G connection\
    ­– Support 100 concurrent users per workspace without degradation
*   **Security**\
    ­– All data encrypted in transit (TLS) and at rest\
    ­– Native PostgreSQL row-level security policies to isolate workspaces\
    ­– Clerk-managed auth with short-lived JWTs
*   **Compliance**\
    ­– GDPR/CCPA: user consent, data export/deletion workflows\
    ­– Privacy policy and cookie consent banners
*   **Usability**\
    ­– Onboarding wizard completion rate > 80%\
    ­– Editor autosaves every 10 seconds\
    ­– Accessible UI (WCAG 2.1 AA standards)

## 7. Constraints & Assumptions

*   **Constraints**\
    ­– GPT-4o and Claude 3.5 availability via OpenRouter may experience rate limits.\
    ­– Third-party API quotas (social platforms, analytics) must be monitored.\
    ­– Docker-hosted PostgreSQL requires capacity planning for storage, memory, and backups.
*   **Assumptions**\
    ­– Initial user base is English-speaking (UK/US).\
    ­– Users have Slack access for notifications.\
    ­– Agencies will configure custom domains before white-label rollout.\
    ­– Teams will supply branding assets or use default themes.

## 8. Known Issues & Potential Pitfalls

*   **AI Hallucinations**\
    ­– Models may generate inaccurate facts. Mitigation: prompt engineering, user reviews, fallback templates.
*   **API Rate Limits & Errors**\
    ­– Social and analytics APIs can throttle requests. Mitigation: implement exponential backoff, caching layers.
*   **Content Publishing Variations**\
    ­– Each CMS/platform has unique formatting rules. Mitigation: build channel-specific adapters and preview modes.
*   **Real-Time Sync Conflicts**\
    ­– Multiple users editing same section can cause merge issues. Mitigation: leverage Liveblocks’ presence/state models and conflict resolution UIs.
*   **Compliance Updates**\
    ­– GDPR/CCPA rules may change. Mitigation: modular privacy settings and regular policy reviews.

This document serves as the authoritative source for ContentOS’s first release. It provides clear guidance on what to build, how users will interact with the system, and the technical guardrails needed to deliver a secure, performant, and user-friendly platform. Subsequent documents (technical architecture, UI guidelines, backend structure) should reference these requirements to ensure consistency and completeness.
