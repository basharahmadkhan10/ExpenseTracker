# Architecture & Design Decision Log

This document records every significant architectural decision made while building the Shared Expense Tracker application — the options considered, and the reasoning behind each choice.

---

## Decision 1: Next.js App Router (TypeScript) as the Full-Stack Framework

- **Context:** The assignment requires a web application with both a UI and a backend. The technology choice is free.
- **Options Considered:**
  1. *React + Express (separate backend):* More explicit separation of concerns but requires two running processes, complex CORS configuration, and doubles the deployment complexity.
  2. *Next.js App Router:* API routes and UI pages coexist in the same project. Single `npm run dev` command starts everything. Vercel deployment is a one-click operation.
- **Decision:** Next.js App Router with TypeScript. The co-location of backend (API routes) and frontend in one repo simplifies review, eliminates CORS setup, and allows a single `npm install` for evaluators.

---

## Decision 2: Neon Serverless PostgreSQL as the Database

- **Context:** The app must be deployed to a public URL for evaluation. SQLite was used locally during development for zero-config startup.
- **Options Considered:**
  1. *Keep SQLite on Vercel:* Vercel uses a read-only serverless filesystem. SQLite writes fail silently in production. Unsuitable.
  2. *Supabase PostgreSQL:* Viable but requires a Supabase project, has more complex row-level-security setup.
  3. *Neon Serverless PostgreSQL:* Free tier, serverless-native (designed for Vercel), supports PgBouncer connection pooling, provides both a pooled and a direct connection URL — exactly what Prisma requires.
- **Decision:** Neon PostgreSQL. It maps directly to Prisma's two-URL pattern (`DATABASE_URL` for runtime pooling, `DIRECT_URL` for migrations), integrates with Vercel in one click, and has a permanent free tier.

---

## Decision 3: Prisma ORM (v5) for Database Access

- **Context:** The app requires relational integrity across 7 tables with complex join/leave date constraints.
- **Options Considered:**
  1. *Raw SQL queries:* Maximum control but high boilerplate, no type safety, error-prone date handling.
  2. *Drizzle ORM:* Lightweight, TypeScript-native, but smaller ecosystem and less documentation at the time of development.
  3. *Prisma v5:* Mature, schema-first, auto-generates a fully-typed client. `prisma db push` auto-migrates. `Prisma.validator` provides compile-time query safety.
- **Decision:** Prisma v5. The typed client catches data shape bugs at compile time, not runtime. The schema file is self-documenting and can be shared directly as the database design artifact. *(Note: v7 was initially resolved by npm but was downgraded due to breaking schema syntax changes — see AI_USAGE.md Case 1.)*

---

## Decision 4: Pre-Computing & Storing Splits at Insert Time

- **Context:** Balance calculations must be membership-aware (Trap 1: time-travel memberships). When calculating who owes whom, the system must check group memberships on the exact date of the expense.
- **Options Considered:**
  1. *On-the-fly aggregation:* Every balance query runs complex subqueries checking `joinedAt` and `leftAt` for all members. Slow, timezone-prone, and difficult to debug during a live evaluation.
  2. *Store splits in `ExpenseSplit` at creation time:* When an expense is created or approved from the review queue, the app queries which members were active on that exact date, calculates their shares, and writes one `ExpenseSplit` row per member.
- **Decision:** Option 2 — pre-computed splits. This resolves **Trap 5 (No Magic Numbers)**. Rohan's drilldown query becomes a simple indexed join: `SELECT * FROM ExpenseSplit WHERE userId = X`. It also creates an immutable ledger — changing a membership date later does not silently alter historical balances.

---

## Decision 5: Hardcoded Exchange Rate Stored Per Transaction

- **Context:** The CSV contains USD-denominated expenses from a Goa trip that must be converted to INR for balance calculations.
- **Options Considered:**
  1. *Dynamic exchange rate API call at import time:* Queries a live API for the historical rate on the transaction date. Breaks with network failures, API rate limits, key expiration, and produces non-reproducible results.
  2. *Store the rate used at import time:* Convert at the moment of import using the stated rate (`83.4` INR/USD from the assignment specification), and persist the `currency`, `exchangeRate`, `amount` (original), and `convertedAmount` in the `Expense` table.
- **Decision:** Option 2. Every expense carries a complete audit trail: original currency, original amount, exact exchange rate applied, and resulting INR amount. This satisfies Priya's transparency requirement — the conversion is visible in the UI next to every USD expense.

---

## Decision 6: Separate `Settlement` Table (Not Negative Expenses)

- **Context:** Flatmates settling debts (e.g. Rohan paying Aisha ₹5,000 cash) need to be tracked.
- **Options Considered:**
  1. *Log settlements as expenses with negative amounts:* Confuses the accounting ledger because settlements have different semantics — they are bilateral cash transfers, not shared costs with splits.
  2. *Separate `Settlement` model:* A dedicated table with `payerId`, `receiverId`, `amount`, and `date`. The balance engine handles it separately from expense splits.
- **Decision:** Separate `Settlement` table. The ledger remains intuitive: expenses represent shared costs, settlements represent debt repayments. The balance engine correctly applies settlements as debt reductions in one branch, rather than trying to model them as special-case negative splits.

---

## Decision 7: Soft-Resolve Anomalies (Status-Based) vs. Hard Delete

- **Context:** When Meera rejects a duplicate or invalid CSV row from the review queue, it needs to be removed from the pending list.
- **Options Considered:**
  1. *Hard-delete:* Remove the `ImportAnomaly` record from the database entirely.
  2. *Soft-resolve:* Change the `status` field to `REJECTED` and keep the row.
- **Decision:** Soft-resolve. Keeping `REJECTED` anomalies in the database provides a permanent audit trail showing exactly which CSV rows were examined, when, and what decision was made. This is critical evidence during the evaluation review that the system processed every anomalous row intentionally rather than silently discarding them.

---

## Decision 8: JWT in HTTP-Only Cookies (Not localStorage)

- **Context:** User sessions must persist across page reloads and be sent automatically with API requests.
- **Options Considered:**
  1. *localStorage JWT:* Simple to implement but vulnerable to XSS attacks — any injected script can read and exfiltrate the token.
  2. *HTTP-only Cookie JWT:* The cookie is automatically included in every same-origin request and is inaccessible to JavaScript, eliminating XSS token theft.
- **Decision:** HTTP-only cookie. The `Set-Cookie` header is written server-side in the `/api/auth/login` route. All authenticated API routes read and verify the token from `request.cookies`, not request headers, making it invisible to client-side code.
