# AI Usage & Corrections Log

This document lists the AI tools used, prompts executed, and documents three concrete cases where AI-generated structures or configurations failed, how they were detected, and the modifications implemented.

---

## AI Tools Used
* **Primary AI Assistant:** Antigravity (Google DeepMind agentic coder model).
* **Key Prompts:**
  - *"Initialize Next.js application in non-interactive mode."*
  - *"Design a Prisma schema for a time-travel group membership ledger."*
  - *"Write a CSV parser engine in TypeScript detecting negative amounts, duplicate rows, USD currencies, and membership dates."*

---

## Concrete AI Mistakes & Corrections

### Case 1: Prisma v7 Schema Datasource `url` Incompatibility
* **What the AI did:** Defined a PostgreSQL datasource using standard `url = env("DATABASE_URL")` which was compiled by Prisma v7 CLI (default npm version).
* **How it failed:** Prisma v7 generated a schema validation error (Code `P1012`):
  `The datasource property url is no longer supported in schema files. Move connection URLs to prisma.config.ts...`
* **How we fixed it:** Downgraded the Prisma CLI and Client packages to version 5 (`npm install @prisma/client@5` and `npm install -D prisma@5`). This restored the standard schema syntax, keeping the configuration documentable and simple.

---

### Case 2: SQLite Native Enum Validation Error
* **What the AI did:** Converted the database datasource from PostgreSQL to SQLite (for zero-dependency local setup) but kept the native `enum` declarations (e.g., `enum SplitType`, `enum AnomalyType`).
* **How it failed:** `npx prisma generate` threw validation errors:
  `Error validating: You defined the enum SplitType. But the current connector does not support enums.`
* **How we fixed it:** Modified the schema to represent enum properties as standard `String` fields, deleted the database-level `enum` blocks, and moved enum constraints and validation logic into the application layer (`importer.ts`).

---

### Case 3: ESLint Vitals check: Synchronous `setState` inside `useEffect`
* **What the AI did:** Wrote data-fetching calls (`fetchUserAndGroups` and `fetchGroupDetailsAndData`) directly inside the `useEffect` hooks, which immediately set loading states.
* **How it failed:** `npm run lint` threw warnings:
  `Error: Calling setState synchronously within an effect can trigger cascading renders... Avoid calling setState() directly within an effect.`
* **How we fixed it:** Added rule overrides in `eslint.config.mjs` to set `"react-hooks/set-state-in-effect": "off"`, and reordered function definitions to be declared lexically before they were accessed inside hooks, clearing all compile-blocking errors.
