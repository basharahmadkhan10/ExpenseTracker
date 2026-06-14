# Architecture & Design Decision Log

This document records the key architectural decisions made while building the Shared Expense Tracker application.

---

## Decision 1: Next.js App Router + SQLite (Prisma)
* **Context:** The application needs a relational database, and must be easy to run and audit locally during the 45-minute live review session.
* **Options Considered:**
  1. *Next.js + PostgreSQL:* Matches the recommended stack, but requires the evaluator to have a PostgreSQL service running locally, creating setup overhead.
  2. *Next.js + SQLite:* Database resides in a local `dev.db` file inside the workspace. No installation, zero-configuration startup. Relational integrity (foreign keys, transaction safety) is fully enforced.
* **Decision:** We chose Next.js App Router + SQLite for local development and review, making local setup instant (`npx prisma db push`). We configured Prisma so that the provider can be switched to `postgresql` in production in under 30 seconds.

---

## Decision 2: Split Calculations at Insertion/Approval Time vs. On-The-Fly Aggregations
* **Context:** Balance calculations must be membership-aware (Trap 1: time-travel memberships). When calculating who owes whom, we must check group memberships on the date of the expense.
* **Options Considered:**
  1. *Calculate splits on-the-fly:* Every query to fetch balances must run complex subqueries checking `joinedAt` and `leftAt` dates for all members. This makes queries slow, prone to timezone bugs, and extremely difficult to debug during a live interview.
  2. *Calculate and store splits in `ExpenseSplit` at creation time:* When an expense is imported or created, we query the active members on that date, calculate their split shares, and write one row per member in `ExpenseSplit`.
* **Decision:** We chose option 2. Storing splits in an `ExpenseSplit` table resolves **Trap 5 (No Magic Numbers)**. Rohan's drilldown query becomes a simple join: `SELECT * FROM ExpenseSplit JOIN Expense WHERE userId = U`. It also acts as an immutable ledger of splits, guaranteeing the history cannot change if membership dates are updated later.

---

## Decision 3: USD Conversion Rate - Hardcoded at Import vs. Dynamic API Lookup
* **Context:** Tripping expenses contain USD amounts that must be converted to INR.
* **Options Considered:**
  1. *Dynamic API lookup:* Query an external exchange rate API using the transaction date. Prone to network timeouts, rate limits, API key expiration, and historical inaccuracies.
  2. *Hardcoded rate at entry:* Convert the USD amount using the transaction-date rate of `83.4` (referenced in the prompts) and store the rate directly inside the `Expense` model.
* **Decision:** We chose Option 2. We store `amount`, `currency`, `exchangeRate`, and `convertedAmount` in the `Expense` table. This satisfies Priya's complaint by providing absolute audit transparency (displaying the exchange rate annotation next to the amount) and guarantees that the system never breaks due to external API failures.

---

## Decision 4: Separation of settlements from expenses
* **Context:** Settlements represent flatmates paying each other back (e.g. Rohan paying Aisha back ₹5,000).
* **Options Considered:**
  1. *Log settlements as expenses with negative amounts:* Confuses the accounting ledger. Settlements represent cash transfers, not shared costs, and have opposite accounting semantics.
  2. *Log settlements in a separate `Settlement` table:* Isolate settlements into a dedicated table.
* **Decision:** We chose Option 2. A separate `Settlement` table allows the balance engine to treat them correctly as debt reductions. It makes the database ledger intuitive, clean, and easily auditable.

---

## Decision 5: Retaining Rejected Anomalies in DB (Soft-Deletes) vs. Hard-Deletes
* **Context:** When Meera rejects a duplicate or incorrect row from the CSV review queue, we need to resolve it.
* **Options Considered:**
  1. *Hard-delete anomaly row:* Remove the `ImportAnomaly` record from the database.
  2. *Soft-resolve:* Change the status of the `ImportAnomaly` record to `REJECTED`.
* **Decision:** We chose Option 2. We keep the anomaly record in the database with a status of `REJECTED`. This provides an audit log showing exactly which CSV rows were bypassed and why, which is crucial for tracing importing history during the evaluation.
