# Project Requirements Document (PRD)

## 1. Project Overview

**Der Digitale Lernbegleiter** is an AI-driven, web-based learning companion designed specifically for neurodivergent learners. It offers a calm, text-first chat interface where a friendly “Buddy” guides each student through personalized, interest-led lessons. Behind the scenes, the system selects relevant competencies, adapts its teaching style, and tracks progress—while learners see only a simple conversation, never grades or pressure.

We’re building this tool to give learners a low-stimulus, compassionate environment that respects their pace and avoids anxiety. Key objectives for version 1 include: seamless user authentication and subscription flows, a lightweight chat interface, accurate AI-powered lesson delivery, silent progress tracking in a secure database, and clear success criteria—measured by user engagement metrics, subscription retention, and adherence of AI responses to our “no pressure” guidelines.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1)

• User Authentication via Clerk (learners + guardians)  
• Subscription Management via Stripe (guardians only)  
• Core Database Schema in Supabase for:
  - `user_interests`  
  - `competencies` (with `grade_level`, `federal_state`)  
  - `competency_progress`  
  - `learning_context`  
• Minimalist Chat Interface (Next.js + Shadcn UI + Tailwind)  
• AI Integration Module (OpenAI API) implementing the 6-step pedagogical flow:
  1. Identify Interest  
  2. Select Competency  
  3. Build Bridge Question  
  4. Guided Conversation  
  5. Reinforcement  
  6. Silent Backend Update  
• Server-Side Actions for:
  - Fetching interests + competencies  
  - Invoking AI prompts  
  - Writing progress updates  
• Basic Logging/Monitoring (e.g., Sentry)  
• Accessibility (WCAG 2.1 AA) and low-stimulus UI constraints

### Out-of-Scope (Later Phases)

• Visual dashboards or progress bars for learners  
• Gamification elements (badges, points)  
• Multi-language support beyond German  
• Mobile-native apps (iOS/Android)  
• Offline mode or local caching  
• Detailed analytics portal for guardians  
• Advanced AI fine-tuning or custom model training  

## 3. User Flow

A guardian visits the site, signs up through Clerk, and selects a subscription plan via Stripe. Once payment succeeds, the guardian creates a learner profile, inputs the learner’s initial interests (e.g., Minecraft, dinosaurs), and logs out. The learner then logs in with their simple Clerk interface and lands directly on a chat page titled “Your Lernbegleiter.”

On the chat page, the Buddy greets the learner by name and asks a low-pressure question tied to a stored interest. As the learner responds, each message is sent to the server via a Next.js Server Action. The server fetches the learner’s current competency target, constructs an OpenAI prompt according to our pedagogical rules, and streams the AI’s reply back into the chat UI. Once the learner demonstrates understanding, the server quietly updates `competency_progress` in Supabase, and the Buddy transitions to the next concept—all without ever showing scores or progress bars to the learner.

## 4. Core Features

• **Authentication Module**  
  - Clerk-powered sign-up, sign-in, session management  
  - Role separation: learner vs. guardian  

• **Subscription Management**  
  - Stripe webhooks to sync payment status  
  - Guarded access based on active subscription  

• **Database & Persistence**  
  - Supabase/PostgreSQL with RLS policies  
  - Tables: `user_interests`, `competencies`, `competency_progress`, `learning_context`  

• **Chat Interface**  
  - Next.js App Router page for conversation  
  - Shadcn UI components, Tailwind CSS theme tokens  
  - Accessibility support (keyboard nav, screen-reader labels)  

• **AI Integration**  
  - `utils/ai/openai.ts` for prompt engineering  
  - Enforce no evaluative or pressure language  
  - 6-step pedagogical strategy encapsulated in functions  

• **Server-Side Logic**  
  - Next.js Server Actions for DB queries and AI calls  
  - `utils/supabase/server.ts` & `admin.ts` abstractions  

• **Logging & Monitoring**  
  - Sentry or similar for error tracking  
  - Custom logs for AI misbehavior alerts  

## 5. Tech Stack & Tools

**Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Shadcn UI  
**Backend:** Node.js, Next.js Server Actions, Supabase (PostgreSQL + RLS), Stripe webhooks  
**AI:** OpenAI API (e.g., GPT-4) via `openai.ts`  
**State/Cache:** TanStack React Query  
**Auth:** Clerk  
**Testing & Linting:** Jest or Testing Library, ESLint (custom rules to block pressure words)  
**Monitoring:** Sentry  
**IDE Integrations:** Cursor.ai for code suggestions, Windsurf for prompt development (optional)

## 6. Non-Functional Requirements

• **Performance:**  
  - Chat page hydrated in < 1 s  
  - AI response stream starts in < 500 ms  
• **Availability:** 99.9% uptime (excluding scheduled maintenance)  
• **Security & Compliance:**  
  - Data encrypted at rest & in transit (TLS)  
  - Supabase RLS ensures per-user data isolation  
  - GDPR and COPPA compliance for children’s data  
• **Usability & Accessibility:**  
  - WCAG 2.1 AA standards  
  - Minimal animations, controlled color contrast  

## 7. Constraints & Assumptions

• Depends on OpenAI service availability and rate limits.  
• Requires an active Stripe and Supabase account.  
• Users will have modern browsers with JavaScript enabled.  
• Deployment target: Vercel or similar Node.js-friendly platform.  
• Guardians can provide initial interests accurately at signup.  

## 8. Known Issues & Potential Pitfalls

• **API Rate Limits:**  
  - Mitigation: implement exponential backoff, local caching of prompts.  
• **Prompt Drift:**  
  - Mitigation: write comprehensive unit tests for prompt templates; monitor flagged responses.  
• **RLS Complexity:**  
  - Mitigation: draft clear Supabase policies and test with multiple user roles.  
• **Streaming Latency:**  
  - Mitigation: show placeholder typing indicator if AI stream takes >1 s.  
• **Accessibility Oversights:**  
  - Mitigation: schedule a formal A11y audit; use automated tools and manual testing.  


*End of PRD for “Der Digitale Lernbegleiter”*