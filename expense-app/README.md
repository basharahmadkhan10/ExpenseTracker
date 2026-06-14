# Flatmate Expense Tracker & Reconciliation App

A robust Next.js application built with TypeScript, Prisma, SQLite, and Tailwind CSS. The app simplifies flatmate expense sharing by parsing historical records, enforcing time-travel membership constraints, and resolving messy spreadsheet data anomalies.

## Features

1. **Authentication:** JWT-based session security via HTTP-only cookies.
2. **Time-Travel Memberships:** Manage join/leave dates for group members. Balance splits automatically exclude members on dates they were inactive (e.g. Meera in April, Sam in March).
3. **Traceable CSV Importer:** Ingests CSV spreadsheet records. Clean records are imported immediately, while anomalies are parked in a DB-backed review queue.
4. **Meera's Anomaly Review Screen:** View flagged anomalies (duplicates, typos, conflicts) and resolve them inline (Approve with corrections or Reject/Discard).
5. **Rohan's Explain Balance Drill-down:** Click any net balance to see the exact split equations and transfers composing it (no magic numbers).
6. **Priya's Exchange Rate Transparency:** Auditable exchange rate annotations next to USD trip bookings.
7. **Timeline View:** Recharts running balance visualization tracking member accounts over time.
8. **Reconciliation:** Simplified debt payouts (who pays whom, how much).
9. **Manual CRUD:** Create expenses (equal/custom splits) and settle transfers.

---

## Local Setup & Quickstart

### 1. Install Dependencies
Run from the `expense-app` directory:
```bash
npm install
```

### 2. Configure Database & Seed Default Users
Initialize the local SQLite database and populate initial members (Aisha, Rohan, Priya, Meera, Sam, Dev) with their correct join and departure date boundaries:
```bash
# Push Prisma schema to SQLite dev.db
npx prisma db push

# Seed the database
npx tsx prisma/seed.ts
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Evaluation Workflow Walkthrough

1. **Sign In:** Use a seeded user (e.g., `Aisha` with password `password123`).
2. **Select Group:** The dashboard displays the default seeded group **"Flatmates"**.
3. **Inspect Initial State:** Check the *Manage Members* tab. Notice Meera is marked as left on March 31st, and Sam joined April 15th.
4. **Import Spreadsheet:** 
   - Click the *Expenses List* tab.
   - Select `Expenses Export.csv` located in the project root.
   - Click **Upload & Parse**.
   - Notice the *Live CSV Import Report* rendering row-by-row status. Clean items (rent, groceries) are imported directly, while USD amounts are auto-converted at `83.4` rate.
5. **Review Anomalies:**
   - Click the *Anomalies review* tab (representing Meera's screen).
   - Resolve **Row 11** (typo `"Priya S"`): Click **Approve/Resolve**, change `"Priya S"` to `"Priya"` in the paid_by input, and click **Approve & Insert**.
   - Resolve **Row 6** (duplicate swiggySwiggy swat swish Swiggy swap Marina Bites swiggy): Click **Reject** to discard it.
   - Resolve date conflicts and percentage mismatches.
6. **Verify Balance Calculations:**
   - Under the *Balances Summary* tab, view the net balances table and Aisha's simplified payments list.
   - Click **Explain Balance** next to Rohan. You will see a detailed breakdown of splits (Rohan's request). Notice the USD conversion annotations (Priya's request).
   - Toggle the *Date Filter* (e.g. from `2026-04-15` onwards) to verify Sam's balance behaves correctly, excluding pre-April utilities.
   - Review the *Balance Timeline View* chart showing inflection points at Meera's departure and Sam's arrival.


## 🏗️ Deployment Architecture
- **Frontend**: Next.js 14+ (App Router)
- **Database**: Neon Serverless Postgres
- **ORM**: Prisma
- **Hosting**: Vercel
- **Styling**: Tailwind CSS v4
