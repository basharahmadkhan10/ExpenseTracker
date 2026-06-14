# AI Usage & Corrections Log

This document lists the AI tools used, the key prompts issued, and documents **five concrete cases** where AI-generated code or configurations failed — how they were caught, and what was changed.

---

## AI Tools Used

- **Primary AI Assistant:** Antigravity (Google DeepMind Advanced Agentic Coding model)
- **Secondary:** GitHub Copilot (inline autocompletion for boilerplate)

---

## Key Prompts Used

1. _"Initialize a Next.js 14 App Router project with TypeScript in non-interactive mode."_
2. _"Design a Prisma relational schema for a flatmate expense tracker supporting time-travel group memberships, multi-currency expenses, and a CSV import anomaly queue."_
3. _"Write a TypeScript CSV parser engine that detects 20 categories of data problems including duplicates, negative amounts, USD currency, payer typos, date format inconsistencies, membership boundary violations, and percentage mismatches."_
4. _"Build a JWT authentication system with HTTP-only cookies and bcrypt password hashing using Next.js API routes."_
5. _"Implement a debt minimisation algorithm using a greedy creditor-debtor matching strategy to generate optimal settlement instructions."_
6. _"Set up Prisma with Neon Serverless PostgreSQL on Vercel, including connection pooling via PgBouncer, a postinstall prisma generate hook, and the serverExternalPackages config."_
7. _"Create a responsive mobile-first CSS design system with safe-area insets for iPhone Dynamic Island and Samsung S23 punch-hole cameras."_

---

## Concrete AI Mistakes & Corrections

### Case 1: Prisma v7 Schema Datasource `url` Incompatibility
- **What the AI did:** Defined a PostgreSQL datasource using the standard `url = env("DATABASE_URL")` field in `schema.prisma`.
- **How it failed:** The default `npm install prisma` resolved to Prisma CLI v7, which changed the schema format. Running `npx prisma generate` threw a `P1012` validation error:
  ```
  The datasource property url is no longer supported in schema files.
  Move connection URLs to prisma.config.ts.
  ```
- **How we caught it:** The error surfaced immediately during `prisma generate` in the terminal.
- **What we changed:** Downgraded Prisma CLI and Client to v5 (`npm install -D prisma@5 @prisma/client@5`). This restored the standard `schema.prisma` syntax and kept the configuration fully portable and documentable.

---

### Case 2: SQLite Native Enum Validation Error
- **What the AI did:** Initially designed the schema for SQLite (zero-config local DB) and included native `enum` declarations (e.g., `enum SplitType { EQUAL EXACT PERCENTAGE }`, `enum AnomalyType`).
- **How it failed:** SQLite does not support native enums. `npx prisma generate` threw:
  ```
  Error validating: You defined the enum SplitType. But the current connector does not support enums.
  ```
- **How we caught it:** Immediate terminal error during the initial `prisma db push`.
- **What we changed:** Removed all `enum` blocks from `schema.prisma` and replaced them with `String` fields. Enum validation logic (accepted values, default fallback) was moved into the application layer inside `importer.ts` and the API route handlers.

---

### Case 3: ESLint Blocking Build — `setState` Inside `useEffect`
- **What the AI did:** Wrote the `useEffect` hooks in `dashboard/page.tsx` to directly call `setLoading(true)` and `setError(...)` at the top level of the effect callback — a common React anti-pattern.
- **How it failed:** `npm run lint` (required by Next.js build) threw blocking warnings treated as errors:
  ```
  Calling setState synchronously within an effect can trigger cascading renders.
  ```
- **How we caught it:** The build failed during `npm run build` with exit code 1.
- **What we changed:** Reordered function definitions so they were declared before being called inside `useEffect`, and added a targeted ESLint rule override in `eslint.config.mjs`:
  ```js
  "react-hooks/exhaustive-deps": "warn"
  ```

---

### Case 4: Neon PostgreSQL Connection Timeout on Vercel (Missing `directUrl`)
- **What the AI did:** Initially configured the Neon database with only a single `DATABASE_URL` (the pooled PgBouncer URL) in `schema.prisma`.
- **How it failed:** Prisma migrations (`prisma db push`, `prisma migrate deploy`) timed out silently when run against the pooled URL, because PgBouncer intercepts DDL statements. No schema changes were applied.
- **How we caught it:** Vercel build logs showed `ERROR: prepared statement "s0" already exists` — a known PgBouncer incompatibility.
- **What we changed:** Added a separate `directUrl = env("DIRECT_URL")` in the Prisma datasource block pointing to the non-pooled Neon connection string. Migrations now run against the direct URL while runtime queries use the pooled URL for performance.

---

### Case 5: Aggressive Regex Comment-Stripping Breaking URLs
- **What the AI did:** When running an automated refactoring script to strip all `// comment` lines from source files, it applied the regex `/\/\/.*?\n/g` globally across all TypeScript/TSX files.
- **How it failed:** The regex incorrectly matched the `//` protocol prefix in hardcoded URL strings. Lines like:
  ```tsx
  { icon: GithubIcon, href: 'https://github.com' }
  ```
  were truncated to:
  ```tsx
  { icon: GithubIcon, href: 'https:
  ```
  This caused a `SyntaxError: Unterminated string literal` in `page.tsx` and `layout.tsx`, detected immediately by Prettier and the TypeScript compiler.
- **How we caught it:** Running `npx prettier --write "src/**/*.tsx"` returned syntax errors pointing to the exact broken lines.
- **What we changed:** Manually restored all broken URL strings. Improved the regex to only match `//` preceded by whitespace or a line start (`/(?:^|\s)\/\/.*$/gm`) to avoid matching protocol prefixes inside string literals.
