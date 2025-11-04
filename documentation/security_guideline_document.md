# Security Guidelines for "Der Digitale Lernbegleiter" (Buddy Learning Companion)

This document defines the security requirements and best practices tailored to the Buddy Learning Companion Starter Kit as you build "Der Digitale Lernbegleiter," an AI-driven, low-stimulus educational SaaS for neurodivergent learners.

---

## 1. Authentication & Access Control

- **Managed Authentication (Clerk):**
  - Enforce multi-factor authentication (MFA) for guardian and administrative accounts.
  - Require strong password policies: minimum 12 characters, mixed case, numbers, symbols.
  - Use Clerk’s secure session management: set idle timeouts (e.g., 15 min) and absolute expirations (e.g., 24 hr).
  - Protect against session fixation by regenerating session IDs upon login.
- **Role-Based Access Control (RBAC):**
  - Define two primary roles: **Learner** (minimal privileges) and **Guardian/Admin** (manage subscriptions, interests).
  - Perform server-side authorization checks in every API route and server action.
  - Leverage Supabase Row-Level Security (RLS) to ensure learners can only access their own records.

## 2. Input Handling & Validation

- **General Input Validation:**
  - Validate all user input on the server (Clerk webhooks, Next.js API routes, Server Actions).
  - Use TypeScript interfaces or Zod schemas to enforce shape and types of incoming JSON.
- **Prevent Injection Attacks:**
  - Use parameterized queries via the Supabase client; avoid raw SQL whenever possible.
  - Sanitize any text passed into AI prompt templates to prevent prompt injection (e.g., escape user-supplied text).
- **AI Prompt Security:**
  - Limit prompt size and strip control characters to defend against malicious payloads.
  - Enforce a allow-list of permissible prompt tokens or patterns if customizing content.
- **File Uploads (if applicable):**
  - Restrict file types, scan for malware, store outside webroot.
  - Normalize file paths to prevent path traversal.

## 3. Data Protection & Privacy

- **Encryption:**
  - Enforce TLS 1.2+ (preferably TLS 1.3) for all traffic to Clerk, Supabase, Stripe, and OpenAI.
  - Enable Transparent Data Encryption (TDE) or disk-level encryption for the PostgreSQL database.
- **Secrets Management:**
  - Store API keys and credentials (Clerk, Supabase, Stripe, OpenAI) in a secure vault (e.g., AWS Secrets Manager) or environment variables injected at runtime.
  - Do **not** commit secrets or `.env` files to source control.
- **Sensitive Data Handling:**
  - Hash any sensitive PII or tokens with Argon2 or bcrypt (e.g., guardian data if stored in custom tables).
  - Mask or redact personal data in logs and error messages.

## 4. API & Service Security

- **HTTPS Everywhere:**
  - Redirect all HTTP traffic to HTTPS. Enforce HSTS with `max-age=63072000; includeSubDomains; preload`.
- **CORS Policy:**
  - Allow only the official UI origins (e.g., `https://app.example.com`), block all others.
- **Rate Limiting & Throttling:**
  - Apply rate limits on chat API calls to prevent abuse (e.g., 20 requests/min per user).
  - Use an in-memory store (Redis) or API gateway to throttle OpenAI proxy endpoints.
- **API Versioning:**
  - Prefix your Next.js API routes (e.g., `/api/v1/chat`, `/api/v2/progress`) to ensure backward compatibility.

## 5. Web Application Security Hygiene

- **HTTP Security Headers:**
  - `Content-Security-Policy`: restrict sources for scripts, styles, images (`self` + approved CDNs).
  - `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'` to prevent clickjacking.
  - `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Strict-Transport-Security` as noted above.
- **Secure Cookies:**
  - Set `Secure`, `HttpOnly`, and `SameSite=Strict` on session cookies.
- **Subresource Integrity (SRI):**
  - Apply SRI hashes to third-party scripts/styles (e.g., Tailwind CDN).
- **Disable Debug in Production:**
  - Ensure `NEXT_PUBLIC_NODE_ENV === 'production'` disables detailed errors and stack traces.

## 6. Infrastructure & Configuration Management

- **Server Hardening:**
  - Keep OS and dependencies patched. Use managed services (Vercel, Supabase Cloud) if possible.
  - Disable unnecessary ports and services; restrict SSH to a bastion host.
- **Cloud Configuration:**
  - Use Vercel environment variables for build/deploy secrets.
  - Lock down Supabase service roles: grant the minimum privileges for server actions and functions.
- **TLS Configuration:**
  - Use strong cipher suites; disable SSLv3/TLS 1.0/1.1.

## 7. Dependency Management

- **Secure Libraries:**
  - Vet and pin versions of all npm packages (`package-lock.json`).
  - Run automated SCA tools (e.g., GitHub Dependabot) to detect vulnerabilities.
  - Remove unused dependencies to minimize attack surface.

## 8. Logging, Monitoring & Incident Response

- **Centralized Logging:**
  - Integrate Sentry or Datadog for error tracking of AI prompts and backend exceptions.
  - Redact PII in logs; only log a user’s anonymized ID and event metadata.
- **Monitoring:**
  - Set up alerts for unusual error rates, failed login attempts, or spike in API usage.
- **Incident Response Plan:**
  - Document roles and escalation paths. Perform periodic simulated breach drills.

## 9. Recommended Next Steps

1. **Security Review:** Conduct a formal threat model or pen test before production launch.
2. **Audit Supabase RLS Policies:** Ensure every table used in the learning flow has strict policies.
3. **Implement Automated Tests:** Include security smoke tests for authentication flows, CSRF, and XSS.
4. **Periodic Dependency Audits:** Automate monthly scans and patch workflows.
5. **Accessibility and Pressure-Language Checks:** Extend ESLint with custom rules to ban high-pressure language in UI strings.

---

By following these guidelines, you will build "Der Digitale Lernbegleiter" on a foundation of security by design, protecting both your young learners and their guardians while fostering a calm, low-stimulus, AI-powered educational experience.