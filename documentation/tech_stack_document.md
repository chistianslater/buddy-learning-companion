# Tech Stack Document for "Der Digitale Lernbegleiter"

This document explains, in everyday terms, the technologies chosen to build **Der Digitale Lernbegleiter**. You don’t need a technical background to understand why each tool or service was selected and how they work together to create a calm, secure, and reliable learning companion for neurodivergent users.

---

## 1. Frontend Technologies

The frontend is what learners and their guardians actually see and interact with in their web browser. We chose tools that let us build a simple, clean, and low-stimulus interface quickly and reliably.

- **Next.js (v14 App Router)**
  • Provides the basic structure for pages and navigation
  • Allows parts of the page to load on the server, reducing flicker and improving performance

- **TypeScript**
  • Adds basic checks to our code so mistakes are caught early
  • Helps keep the interface stable as it grows

- **Tailwind CSS**
  • A utility-first styling system that keeps our design consistent
  • Lets us control colors, spacing, and text styles without writing custom CSS

- **Shadcn UI**
  • A set of ready-made components (buttons, dialogs, forms) styled to match Tailwind
  • Customizable so we can enforce a low-distraction, text-first experience

- **TanStack React Query**
  • Manages loading and caching of data behind the scenes
  • Prevents jarring reloads in the chat interface by updating only what’s needed

Why these choices matter:

• They enable us to build a **minimalist** interface that loads quickly and feels smooth.  
• They give us the **flexibility** to tune every visual detail for a calm experience.  
• They help us maintain **quality and consistency** as the project grows.

---

## 2. Backend Technologies

The backend powers all the behind-the-scenes logic—storing learner data, protecting it, and coordinating with our AI “Buddy.”

- **Supabase (PostgreSQL database)**
  • Stores structured data like user interests, competency definitions, and progress records  
  • Includes **Row Level Security (RLS)** to make sure each user can only see their own data

- **Next.js Server Actions & API Routes**
  • Handle secure operations like selecting a new learning competency or saving progress  
  • Keep all critical logic on the server, invisible to the learner, so there’s **no pressure** and no accidental exposure of internal details

- **TypeScript (on the server)**
  • Extends type safety to backend code  
  • Helps prevent errors in our database queries and API logic

- **Organization of Utility Code**
  • `utils/ai/openai.ts`: Contains all logic to craft prompts and send/receive messages from OpenAI  
  • `utils/supabase/server.ts` & `utils/supabase/admin.ts`: Handle safe database reads and writes  
  • `supabase/migrations/`: Holds the definitions for our custom tables (`user_interests`, `competencies`, `competency_progress`, `learning_context`)

Why these choices matter:

• We maintain **data privacy** and **security** by enforcing rules on the server.  
• The clear separation of concerns keeps our AI logic and data logic easy to develop and review.  
• Supabase’s RLS ensures compliance with best practices for handling children’s data.

---

## 3. Infrastructure and Deployment

We rely on modern hosting and development workflows to make sure the application is always available, up-to-date, and easy to maintain.

- **Version Control: Git & GitHub**
  • All code lives in a GitHub repository  
  • Every change is tracked, reviewed, and approved before it goes live

- **CI/CD Pipeline**
  • Automated checks (linting, tests) run on every code change  
  • Successful builds are automatically deployed to our hosting platform

- **Hosting Platform (Vercel)**
  • Optimized for Next.js applications  
  • Provides instant global deployment and edge caching  
  • Scales automatically with usage

- **Logging & Monitoring (Sentry or similar)**
  • Captures errors and performance issues in real time  
  • Helps us ensure the Buddy behaves correctly and quickly troubleshoot any problems

Why these choices matter:

• **Reliability**: Users always get the latest, tested version without downtime.  
• **Scalability**: As more learners join, the platform grows seamlessly.  
• **Visibility**: We can monitor user interactions and system health to continuously improve.

---

## 4. Third-Party Integrations

We connect to specialized services so we don’t have to build everything from scratch.

- **Clerk (User Authentication)**
  • Handles sign-up, login, password resets, and session management for learners and guardians  
  • Provides role-based access so learners see only what they need, and guardians manage subscriptions

- **Stripe (Subscription Management)**
  • Manages payment plans, billing, and invoicing  
  • Keeps all financial details separate from the learner’s experience (no pressure, ever)

- **OpenAI API**
  • Powers the Buddy’s conversational abilities  
  • We carefully craft prompts to enforce the Buddy’s patient, curiosity-led style

- **Accessibility Tools (ESLint plugins, Axe audits)**
  • Ensure compliance with accessibility standards  
  • Guard against any unintended high-pressure language in the UI

Why these choices matter:

• They let us focus on the unique educational experience, while **experts** handle authentication, payments, and AI.  
• They improve **security**, **reliability**, and **compliance** by using proven solutions.

---

## 5. Security and Performance Considerations

We’ve baked in safeguards and optimizations to protect user data and ensure a smooth experience.

- **Authentication & Authorization**
  • Clerk provides industry-standard security for user accounts  
  • Supabase’s RLS ensures learners can only access their own data

- **Data Protection**
  • All communication is encrypted (HTTPS/TLS)  
  • Sensitive operations (updating progress, payment events) happen only on the server

- **Performance Optimizations**
  • Server-side rendering and edge caching via Next.js and Vercel reduce load times  
  • React Query minimizes unnecessary network requests in the chat interface

- **AI Error Handling**
  • Pre-scripted fallback responses so the Buddy never shows raw error messages  
  • Graceful retries and user-friendly messages (e.g., “Let’s pause for a moment!”)

Why these choices matter:

• We protect learners’ privacy and guardians’ trust.  
• We deliver a **fast, frustration-free** experience, even under heavy use or temporary network hiccups.  
• The Buddy always feels calm and reliable, even when something unexpected happens.

---

## 6. Conclusion and Overall Tech Stack Summary

**In summary**, every technology in this project was chosen to support the core goals of **simplicity, security, low stimulus, and personalized learning**:

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Shadcn UI, React Query
- **Backend**: Supabase (PostgreSQL + RLS), Next.js Server Actions, TypeScript, well-organized utility modules
- **Infrastructure**: GitHub, Vercel, automated CI/CD, logging & monitoring
- **Third-Party**: Clerk, Stripe, OpenAI API, accessibility audits

This combination gives us a **robust foundation**—a calm, invisible engine powering a friendly, AI-driven chat companion—while keeping all sensitive data safe and ensuring an effortless experience for both learners and their guardians.

Should you have any questions about these choices or want to dive deeper into any area, we’re here to help!