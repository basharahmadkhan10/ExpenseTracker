# Flatmate Expense Tracker & Reconciliation App

A full-stack, production-ready **Next.js 14+** application built to solve shared flatmate expense management. It parses messy historical CSV records, enforces time-travel group membership boundaries, transparently handles multi-currency conversions, and routes anomalous data through an oversight review queue before committing to the ledger.

**Live Deployment:** https://expense-tracker-eight-nu-64.vercel.app
**GitHub Repo:** https://github.com/basharahmadkhan10/ExpenseTracker

---

## Core Features

| Feature | Description |
|---|---|
| **JWT Authentication** | HTTP-only cookie sessions, bcrypt password hashing |
| **Time-Travel Memberships** | Join/leave dates enforced per expense date — Meera excluded from April splits, Sam excluded from March splits |
| **Traceable CSV Importer** | Row-by-row parsing with live import report. Clean rows committed instantly; anomalies queued |
| **Anomaly Review Queue** | Inline Approve (with corrections) or Reject for each flagged CSV row |
| **Balance Drilldown** | Click any net balance to see exact split equations (no magic numbers) |
| **Exchange Rate Transparency** | USD amounts stored with original amount, currency, rate, and INR conversion |
| **Balance Timeline Chart** | Recharts running balance visualization over time |
| **Debt Minimisation Engine** | Optimal settlement instructions (who pays whom, minimum transactions) |
| **Manual Expense & Settlement CRUD** | Create expenses with equal/exact/percentage splits |
| **Dark / Light Mode** | System-aware theme with carbon gradient dark mode |
| **Responsive Mobile UI** | Optimised for Samsung S23, iPhone 14, Realme — safe areas, 44px touch targets |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Neon Serverless PostgreSQL |
| ORM | Prisma v5 |
| Styling | Tailwind CSS v4 + Custom CSS Design System |
| Auth | JWT (jose) + bcryptjs |
| Charts | Recharts |
| Hosting | Vercel |
| AI Assistant | Antigravity (Google DeepMind) |

---

## Local Setup & Quickstart

### Prerequisites
- Node.js 18+ 
- A Neon database account (free) or local PostgreSQL

### 1. Clone the Repository
```bash
git clone https://github.com/basharahmadkhan10/ExpenseTracker.git
cd ExpenseTracker/expense-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example and fill in your values:
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:password@host/db?sslmode=require"
JWT_SECRET="your-secure-random-string-at-least-32-chars"
```

### 4. Push Schema & Seed Database
```bash
# Apply Prisma schema to the database
npx prisma db push

# Seed initial members and group (Aisha, Rohan, Priya, Meera, Sam, Dev)
npx tsx prisma/seed.ts
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Vercel Deployment

1. Import the `basharahmadkhan10/ExpenseTracker` GitHub repo into Vercel.
2. Set **Root Directory** to `expense-app`.
3. Add these Environment Variables in Vercel dashboard:
   - `DATABASE_URL` (Neon pooled connection string)
   - `DIRECT_URL` (Neon direct connection string)
   - `JWT_SECRET` (any secure random string)
4. Deploy. Vercel auto-runs `prisma generate` via the `postinstall` hook.

---

## Evaluation Walkthrough

1. **Sign In:** Use `Aisha` / `password123` (or any seeded user).
2. **Select the "Flatmates" Group** from the left sidebar.
3. **Inspect Members Tab:** Verify Meera (`leftAt: 2026-03-31`) and Sam (`joinedAt: 2026-04-15`) date boundaries.
4. **Import CSV:**
   - Go to *Expenses* tab → Upload `Expenses Export.csv` → Click **Upload & Parse**
   - The **Live Import Report** shows row-by-row status, anomaly flags, and auto-resolution notes.
5. **Review Anomalies Tab:**
   - Resolve Row 11 (typo `"Priya S"`) — correct to `"Priya"` and Approve.
   - Reject Row 6 (exact duplicate of Marina Bites dinner).
6. **Balances Tab:**
   - View optimal settlement instructions.
   - Click **Explain Balance** next to any member for the full drilldown.
   - Set date filter `2026-04-15` → present to verify Sam's boundary is respected.
7. **Toggle Dark Mode** in the top-right to verify the carbon-gradient dark theme.

---

## Project Structure

```
expense-app/
├── prisma/
│   ├── schema.prisma      # Relational schema (PostgreSQL)
│   ├── seed.ts            # Seeds users, group, memberships
│   └── migrations/        # Migration history
├── src/
│   ├── app/
│   │   ├── api/           # Next.js API routes (auth, groups, expenses, etc.)
│   │   ├── dashboard/     # Main dashboard UI
│   │   ├── login/         # Login page
│   │   ├── register/      # Registration page
│   │   └── globals.css    # Design system + mobile CSS
│   ├── components/
│   │   └── Preloader.tsx  # Curtain animation preloader
│   └── lib/
│       ├── auth.ts        # JWT + bcrypt utilities
│       ├── db.ts          # Prisma singleton
│       ├── importer.ts    # CSV parsing & anomaly detection engine
│       └── constants.ts   # App-wide constants
├── SCOPE.md               # Anomaly log + database schema
├── DECISIONS.md           # Architecture decision log
├── AI_USAGE.md            # AI tools, prompts, and error cases
└── README.md              # This file
```
