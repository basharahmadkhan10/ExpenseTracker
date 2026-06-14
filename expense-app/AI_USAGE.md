# AI Usage & Developer Intervention Log

This document describes how AI tools were used as **assistants** during the development of this project, the specific prompts issued, and — critically — the multiple cases where I identified incorrect AI-generated output, understood why it was wrong, and independently corrected it based on my own knowledge of the architecture.

> **Important context:** I designed the full system architecture independently — the relational schema, the time-travel membership model, the split-at-insert strategy, and the anomaly pipeline design were all decisions I made before writing a single line of code. AI was used as a code-generation and boilerplate accelerator, similar to how any developer uses documentation, Stack Overflow, or an IDE autocomplete engine. Every AI suggestion was reviewed, validated, and in several cases overridden or substantially changed by me.

---

## AI Tools Used

- **Antigravity (Google DeepMind):** Used for code scaffolding, repetitive API route boilerplate, and CSS generation.
- **GitHub Copilot (inline):** Used for autocompletion of repetitive TypeScript patterns and Prisma query syntax.

---

## How I Used AI — With Deliberate Guidance

I did not simply ask "build me an expense tracker." My approach:

1. I first drafted the complete **relational schema on paper** — 7 tables, the `ExpenseSplit` pre-computation model, the `ImportAnomaly` queue, and the `Settlement` separation — before asking AI to translate it into Prisma syntax.
2. I specified the **exact business rules** to the AI: time-travel membership date constraints, the 5 named traps from the assignment, the specific anomaly categories from the CSV.
3. When AI output was incorrect, I **diagnosed the root cause myself** and provided precise corrective instructions rather than asking the AI to "try again."

---

## Key Prompts Issued

These prompts reflect my directed, technical instructions — not open-ended vague requests:

1. *"Translate this table design into Prisma schema: User, Group, GroupMembership with joinedAt/leftAt, Expense with currency/exchangeRate/convertedAmount, ExpenseSplit, Settlement, ImportAnomaly with status PENDING/APPROVED/REJECTED."*
2. *"Write the CSV row parser in TypeScript. It must: normalise payer names case-insensitively, detect amounts with comma-separators and strip them, detect USD currency and convert at 83.4, detect negative amounts as refunds, detect blank payer as ANOMALY, detect payer names not in the members list as ANOMALY, detect exact duplicates by matching date+amount+payer, detect percentage splits not summing to 100."*
3. *"Write the `/api/groups/[id]/balances` route. It must join ExpenseSplit to get per-user totals, then apply a greedy creditor-debtor matching loop to produce the minimum number of settlement transactions. Do not aggregate raw expenses — use the pre-computed splits table."*
4. *"Set up Next.js JWT auth with HTTP-only cookies. Hash passwords with bcryptjs on register. Verify the JWT on every API route by reading `request.cookies` — not Authorization headers."*
5. *"Configure Prisma datasource for Neon PostgreSQL with two URLs: DATABASE_URL for pooled PgBouncer runtime queries, DIRECT_URL for unpooled migration operations. Add a postinstall script to run `prisma generate` automatically on Vercel."*

---

## Cases Where I Caught and Corrected AI Mistakes

### Case 1: Prisma v7 Breaking Schema Change (AI used outdated syntax)

- **What AI generated:** Standard `url = env("DATABASE_URL")` in `schema.prisma`.
- **What went wrong:** `npm install prisma` resolved to v7, which deprecated this syntax entirely. Running `npx prisma generate` threw `P1012`.
- **How I caught it:** I read the error output carefully. The message referenced a `prisma.config.ts` migration — I recognised this as a version incompatibility, not a config error.
- **My intervention:** I did not ask AI to fix it. I independently decided to pin Prisma to v5 (`npm install -D prisma@5 @prisma/client@5`), which I knew maintained the conventional `schema.prisma` format. I understood that v7's new config system would overcomplicate a project meant to be evaluated by a third party.

---

### Case 2: AI Used SQLite Enums (Misread My Schema Requirement)

- **What AI generated:** Native `enum SplitType`, `enum AnomalyStatus` blocks in `schema.prisma` despite being told we were using SQLite locally.
- **What went wrong:** SQLite does not support database-native enums. `prisma db push` threw a connector validation error.
- **How I caught it:** I knew SQLite's type system before starting. I identified the error as an AI assumption carryover from the PostgreSQL schema pattern — it defaulted to Postgres conventions without adapting to the stated provider.
- **My intervention:** I removed all enum blocks and replaced them with `String` typed fields. I then wrote the enum validation logic myself in `importer.ts` — using explicit `const VALID_SPLIT_TYPES = ['EQUAL', 'EXACT', 'PERCENTAGE']` arrays rather than relying on DB-level constraint enforcement.

---

### Case 3: AI Calculated Splits at Query Time (Wrong Architecture)

- **What AI initially suggested:** Computing balance splits on-the-fly inside the `/balances` API route using a complex `GROUP BY` + date-range subquery across `Expense` and `GroupMembership` tables.
- **What went wrong:** I immediately recognised this was architecturally wrong. On-the-fly membership-aware split calculation is O(n × m) per request, extremely difficult to debug, and would produce wrong results for historical expenses if a membership date was ever corrected after the fact.
- **How I caught it:** I had already decided during design that splits must be **pre-computed and stored** as immutable `ExpenseSplit` rows at the moment an expense is inserted or approved from the queue. This was a deliberate choice I made independently.
- **My intervention:** I rejected the AI's approach entirely. I instructed it to: (1) compute splits at insert time in `importer.ts` and the `POST /expenses` route by querying active members on the expense date, (2) write one `ExpenseSplit` row per member, and (3) make the balance route a simple `SUM` aggregation over the `ExpenseSplit` table. I wrote the member-active-date logic myself.

---

### Case 4: Neon Connection Timeout — AI Didn't Know the `directUrl` Pattern

- **What AI generated:** A Neon datasource with only a single `DATABASE_URL` pointing to the PgBouncer pooled connection string.
- **What went wrong:** Prisma migrations (`prisma db push`) silently timed out or produced `prepared statement already exists` errors. PgBouncer intercepts DDL statements and does not forward them correctly.
- **How I caught it:** I read the Vercel build logs and recognised the PgBouncer-specific error. I already knew from reading Neon's documentation that migrations require a direct (non-pooled) connection — this is a well-known gotcha that the AI was unaware of.
- **My intervention:** I added `directUrl = env("DIRECT_URL")` to the Prisma datasource block. I configured two separate env variables — `DATABASE_URL` (pooled, for runtime) and `DIRECT_URL` (direct, for migrations). I also added `serverExternalPackages: ["@prisma/client"]` to `next.config.ts` myself, knowing that Vercel's bundler would otherwise attempt to bundle the native Prisma binary.

---

### Case 5: Regex Destroyed URL Strings During Automated Refactoring

- **What AI generated:** A Node.js script to strip all `// comment` lines using the regex `/\/\/.*?\n/g` applied globally across all `.tsx` and `.ts` files.
- **What went wrong:** The regex matched the `//` protocol separator in hardcoded URL strings like `href: 'https://github.com'`, truncating them to `href: 'https:` — an unterminated string literal.
- **How I caught it:** I ran `npx prettier --write "src/**/*.tsx"` as a validation step after the script, which immediately surfaced syntax errors at exact line numbers in `page.tsx` and `layout.tsx`. I looked at the diff and instantly understood the regex over-match.
- **My intervention:** I manually restored all broken URL strings. I identified the correct regex fix — `/(?:^|\s)\/\/(?!.*https?:).*$/gm` — which anchors to line-start and excludes matches inside string literals containing protocol prefixes. I also added the prettier validation step as a mandatory post-refactor check going forward.
