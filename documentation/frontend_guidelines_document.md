# Frontend Guidelines Document for "Der Digitale Lernbegleiter"

This document outlines the frontend architecture, design principles, and technologies used in building the AI-driven educational companion "Der Digitale Lernbegleiter." It serves as a clear guide for developers and non-technical stakeholders alike to understand how the system is structured, styled, and maintained.

## 1. Frontend Architecture

### Frameworks and Libraries
- **Next.js 14 (App Router)**: Provides server-side rendering (SSR), server actions, API routes, and file-based routing. Ideal for seamless data fetching and background logic without exposing implementation details to the user.
- **React & TypeScript**: Enables a component-based approach with strong type safety for better maintainability and fewer runtime errors.
- **Tailwind CSS & Shadcn UI**: Utility-first styling with pre-built, accessible components. Allows precise control over visuals while enforcing consistency.
- **Clerk**: Manages user authentication and role-based access (learners vs. guardians) with minimal setup.
- **Supabase**: Serves as the PostgreSQL database with built-in Row Level Security (RLS) for private, per-user data isolation.
- **Stripe**: Handles subscription billing and plan management through secure webhooks.
- **TanStack React Query**: Simplifies data fetching, caching, and synchronization between UI and server, ensuring a fluid chat experience.
- **OpenAI API**: Powers the Buddy’s conversational logic and pedagogical flow.

### Scalability, Maintainability, Performance
- **Modular Directory Structure** (`app/`, `components/`, `utils/`): Separates presentation, business logic, and data access layers.
- **Server-Side Actions & API Routes**: Encapsulate sensitive operations (competency selection, progress updates) on the server to reduce client bundle size and improve security.
- **TypeScript & ESLint**: Enforce code consistency and catch errors early.
- **Utility-First CSS**: Minimizes custom CSS and avoids style conflicts, speeding up development and stylesheet generation.

## 2. Design Principles

### Key Principles
- **Usability**: Simple, text-first interface focused on chat. All controls and interactions are intuitive and minimal.
- **Accessibility (A11y)**: Adheres to WCAG guidelines—proper color contrast, keyboard navigation, and ARIA attributes. Custom ESLint rules guard against language that could induce stress (e.g., avoiding words like "hurry").
- **Responsiveness**: Fluid, mobile-first design that scales from small to large screens. Layouts adapt seamlessly using Tailwind’s responsive utilities.
- **Low-Stimulus**: Minimal animations, muted colors, and restrained use of graphical elements to reduce cognitive load for neurodivergent users.

### Application in UI Design
- **Clean Chat Layout**: Single-column view, clear separation of user vs. Buddy messages with subtle shading.
- **Controlled Typography**: Generous line spacing and font sizes; no flashy headings or rapid text transitions.
- **Focus Management**: Keyboard focus is visibly outlined; input fields are automatically scrolled into view.

## 3. Styling and Theming

### Styling Approach
- **Utility-First (Tailwind CSS)**: Rapid styling via predefined classes; custom design tokens configured in `tailwind.config.js`.
- **Component Library (Shadcn UI)**: Provides accessible base components (buttons, modals, form controls) that integrate with Tailwind.

### Theming
- **Global Theme Tokens**: Defined in `theme.ts`, including colors, spacing, and shadows. The theme is extensible for future branding.
- **Dark Mode**: Optional, toggled via a root-level CSS class, with inverted background and text colors.

### Visual Style
- **Modern Minimalist**: Flat UI with subtle shadows. No skeuomorphic elements or gaudy animations.
- **Color Palette** (muted, low-contrast):
  - Primary Background: #F7FAFC (Gray 50)
  - Secondary Background: #EDF2F7 (Gray 100)
  - Text Primary: #2D3748 (Gray 800)
  - Text Secondary: #4A5568 (Gray 600)
  - Accent: #BEE3F8 (Light Blue 200)
  - Interactive: #63B3ED (Blue 400)
  - Error/Warning: #FEB2B2 (Red 200)

### Typography
- **Font Family**: Inter, a clean, humanist sans-serif optimized for screen readability.
- **Font Sizes**: Base 16px; headings scaled by 1.25× with consistent line heights.

## 4. Component Structure

### Organization
- `app/`: Pages and layouts (Next.js App Router).
- `components/`: Reusable UI elements (chat bubbles, forms, headers).
- `components/ui/`: Shadcn-wrapped primitives configured for theme tokens.
- `utils/`: Business logic split into `ai/` (OpenAI prompts) and `supabase/` (database interactions).

### Reusability & Maintainability
- **Atomic Components**: Small, focused components (buttons, inputs) compose into larger ones (chat window, onboarding form).
- **Props & Context**: Components receive data via props; shared behavior (e.g., theme, user session) is provided by React Context and hooks.
- **Documentation & Storybook**: Each UI component is documented in Storybook for visual reference and testing.

## 5. State Management

- **TanStack React Query**: Handles server state (chat history, user data, progress updates) with automatic caching and background refetching.
- **React Context**: Manages global client state (theme, authentication status).
- **Local State (`useState`)**: Used for ephemeral UI concerns like input field values and modal toggles.

## 6. Routing and Navigation

- **Next.js App Router**: File-based routing under `app/` folder. Each folder represents a route segment.
- **Server Actions**: Decorated functions in page files handle secure data mutations (e.g., recording progress).
- **Linking & Navigation**: Next.js `<Link>` component ensures client-side transitions without full reloads.
- **Protected Routes**: Higher-order component or middleware checks Clerk’s session before granting access to learner or guardian pages.

## 7. Performance Optimization

- **Code Splitting & Dynamic Imports**: Heavy components (e.g., charts or admin views) are loaded on demand.
- **Lazy Loading**: Images and optional UI parts loaded only when in viewport.
- **Asset Optimization**: Next.js Image component for automatic resizing, compression, and caching.
- **Server-Side Rendering & Streaming**: Delivers first content quickly, improving Time to Interactive (TTI).
- **Caching Strategies**: React Query’s stale-while-revalidate for chat messages and user data.

## 8. Testing and Quality Assurance

### Unit & Integration Testing
- **Vitest** or **Jest** with React Testing Library: Test individual components and hooks for expected behavior and accessibility attributes.
- **Mock Service Worker (MSW)**: Simulate API responses (OpenAI, Supabase, Stripe) in a controlled environment.

### End-to-End Testing
- **Cypress**: Script realistic user flows (login, chat interaction, subscription changes) to catch regressions.

### Linters & Formatters
- **ESLint**: Enforce code standards and custom rules (e.g., no high-pressure phrases in UI text).
- **Prettier**: Uniform code formatting across the codebase.

### Accessibility Auditing
- **axe-core** integration in tests to automatically flag accessibility violations.
- Manual keyboard-only navigation checks and screen reader verifications.

### Monitoring & Logging
- **Sentry**: Captures runtime errors and uncaught promise rejections, including those from OpenAI calls.
- **Custom Logs**: Server-side logs for AI prompts and responses to audit Buddy’s adherence to pedagogical constraints.

## 9. Conclusion and Overall Frontend Summary

This frontend setup delivers a scalable, maintainable, and high-performance foundation for "Der Digitale Lernbegleiter." By leveraging Next.js, Tailwind CSS, Shadcn UI, and a modular architecture, we ensure a low-stimulus, accessible environment tailored to neurodivergent learners. State-of-the-art practices like server actions, React Query, and rigorous testing guarantee a smooth user experience and robust code quality. Unique aspects—such as invisible server-side logic for competency selection and a carefully engineered AI prompt module—set this project apart as a next-generation educational companion.

With these guidelines, developers and stakeholders have a clear roadmap for extending, styling, and maintaining the frontend while upholding the project’s core values: simplicity, security, and a pressure-free learning environment.