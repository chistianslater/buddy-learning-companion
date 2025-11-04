# Backend Structure Document for "Der Digitale Lernbegleiter"

## 1. Backend Architecture

Our backend is designed as a modular, layered system that keeps business logic, AI integration, and data management cleanly separated. We rely on Next.js App Router for server-side logic, together with utility modules for database and AI. This setup supports scalability, maintainability, and high performance.

Key design choices:

- Next.js App Router
  - Server Actions for secure, server-only operations
  - API Routes for external integrations (e.g., Stripe webhooks)
- Utility layers under `utils/`:
  - `utils/supabase/` handles all database operations
  - `utils/ai/openai.ts` encapsulates our OpenAI logic and prompt engineering
- Separation of concerns:
  - AI prompting never touches the UI layer directly
  - Database updates happen invisibly on the server

How it supports our goals:

- Scalability: Each layer can be scaled independently (e.g., multiple serverless functions for AI calls)
- Maintainability: Clear boundaries mean new features fit into existing modules
- Performance: Server Actions and direct database calls avoid unnecessary round trips

## 2. Database Management

We use Supabase (PostgreSQL) as our primary data store. Supabase gives us:

- A fully managed PostgreSQL database with built-in authentication
- Row Level Security (RLS) to isolate each learner’s data
- Real-time capabilities (if we choose to stream updates later)

Data organization:

- Structured, relational tables for user profiles, interests, competencies, progress, and learning context
- Each table has clear primary keys and foreign keys to express relationships
- RLS policies ensure a learner or guardian only sees their own rows

Best practices:

- Perform all writes via server-side functions to keep logic centralized
- Use migrations under `supabase/migrations/` for version control of schema changes
- Back up data regularly via Supabase’s automated backups

## 3. Database Schema

Below is a human-readable overview followed by PostgreSQL definitions.

Tables and relationships:

- Users (managed by Supabase Auth)
- Profiles: extends user with role (learner or guardian)
- user_interests: links a user to topics they care about
- competencies: catalog of learning targets (grade level, subject, description)
- competency_progress: tracks a user’s progress on each competency
- learning_context: stores metadata about each AI-driven interaction

PostgreSQL schema:

```sql
-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role varchar NOT NULL CHECK(role IN ('learner', 'guardian')),
  created_at timestamp with time zone DEFAULT now()
);

-- User Interests
CREATE TABLE user_interests (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id),
  interest varchar NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Competencies
CREATE TABLE competencies (
  id serial PRIMARY KEY,
  title varchar NOT NULL,
  description text,
  grade_level varchar,
  federal_state varchar,
  created_at timestamp with time zone DEFAULT now()
);

-- Competency Progress
CREATE TABLE competency_progress (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id),
  competency_id int NOT NULL REFERENCES competencies(id),
  status varchar NOT NULL CHECK(status IN ('not_started', 'in_progress', 'completed')),
  last_updated timestamp with time zone DEFAULT now()
);

-- Learning Context
CREATE TABLE learning_context (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id),
  competency_id int NOT NULL REFERENCES competencies(id),
  context_data jsonb,
  created_at timestamp with time zone DEFAULT now()
);
```

## 4. API Design and Endpoints

We follow a RESTful style using Next.js API Routes and Server Actions. Frontend components call Server Actions directly; external systems use API routes.

Key endpoints and their roles:

- **Server Actions** (invoked from React components, not exposed as public URLs)
  - `selectNextCompetency(userId)` – picks a new competency based on interests
  - `recordProgress(userId, competencyId, status)` – updates competency_progress
  - `fetchLearningContext(userId, competencyId)` – retrieves context for AI prompting
  - `invokeBuddyAI(promptContext)` – calls OpenAI and streams responses

- **Public API Routes**
  - `POST /api/webhooks/stripe` – receives Stripe subscription events and updates profiles
  - `GET /api/competencies` – (optional) fetches competency catalog (for admin dashboards)
  - `GET /api/interests` – (optional) lists a user’s interests

Data flow:

1. Frontend triggers a Server Action to load the next AI question
2. Server Action gathers data from Supabase, constructs a prompt, and calls OpenAI
3. Streaming response is sent back to the UI
4. Once the learner completes a task, the UI triggers another Server Action to record progress

## 5. Hosting Solutions

We host the backend on a serverless platform (e.g., Vercel) with Supabase and Stripe managed separately.

- Vercel for Next.js serverless functions:
  - Auto-scaling based on request volume
  - Zero-maintenance infrastructure
- Supabase for database and auth:
  - SLA-backed uptime
  - Automated backups and monitoring
- Stripe for payments:
  - Worldwide compliance
  - Webhook delivery guarantees

Why this setup?

- Reliability: Each provider offers high availability
- Scalability: Serverless functions and managed databases scale automatically
- Cost-effectiveness: Pay-as-you-go pricing keeps costs low in early stages

## 6. Infrastructure Components

To ensure performance and a smooth user experience, we layer in additional components:

- Load Balancer (built into Vercel) to distribute traffic across function instances
- CDN (Vercel’s global edge network) to serve static assets with low latency
- Caching:
  - In-memory caches for repeated AI prompts or competency lists (optional Redis layer in future)
  - HTTP caching headers for static assets

Interaction:

- Requests hit Vercel’s edge network, are routed to the nearest serverless function, and data is fetched from Supabase close to the database region

## 7. Security Measures

We protect user data and comply with regulations through multiple layers of security:

- Authentication & Authorization:
  - Clerk-managed sessions for identity
  - Supabase RLS policies to enforce per-user data access
- Data Encryption:
  - SSL/TLS for all data in transit
  - Encryption at rest for database backups
- API Security:
  - Webhook secret verification for Stripe
  - CSRF protection inherent in Next.js Server Actions
- Environment Management:
  - Secrets (API keys, database URLs) stored in encrypted environment variables
- Compliance:
  - GDPR-ready data handling practices
  - No child data is exposed to third-party analytics beyond necessary billing

## 8. Monitoring and Maintenance

We maintain visibility and reliability via:

- Logging & Error Tracking:
  - Sentry for serverless function errors and AI abnormalities
  - Supabase Logs for database queries and RLS violations
- Performance Monitoring:
  - Vercel Analytics for function invocation metrics
  - Supabase monitoring dashboard for query performance
- Maintenance Strategies:
  - Regular backups via Supabase
  - Automated migration scripts for schema changes
  - Scheduled dependency updates and security audits

## 9. Conclusion and Overall Backend Summary

Our backend combines Next.js serverless functions, Supabase’s managed PostgreSQL, and OpenAI’s API into a clear, modular setup. Each piece serves a distinct role:

- Authentication and user data isolation (Clerk + Supabase)
- Structured learning data (PostgreSQL with RLS)
- Invisible, server-driven AI interactions (Server Actions + OpenAI)
- Secure subscription handling (Stripe webhooks)

This architecture meets the goals of a low-stimulus, neurodivergent-friendly learning companion by keeping complexity hidden behind a calm, text-first interface. The modular layers, managed hosting solutions, and robust security and monitoring practices ensure that "Der Digitale Lernbegleiter" is reliable, scalable, and easy to maintain as it grows.