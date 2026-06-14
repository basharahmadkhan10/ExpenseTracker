# Project Scope & Anomaly Log

This document catalogs the data problems (anomalies) detected in `Expenses Export.csv` and details the relational database schema used to enforce clean financial records.

## CSV Anomaly Log

The import engine processed `Expenses Export.csv` row-by-row and detected **20 deliberate data problems**. They are cataloged below alongside our resolution policies:

### Category A: Data Formatting Problems (Auto-Resolved)
1. **Row 7 (Double-quoted amounts with commas):** `"1,200"`
   - *Detection:* Detected double-quotes and comma separators inside the amount field.
   - *Policy:* Stripped symbols and successfully parsed as float `1200.00`.
2. **Row 9 (Payer casing issue):** Payer field contains `"priya"` (lowercase).
   - *Detection:* Case-insensitive lookup matches the user `Priya`.
   - *Policy:* Normalized name to `"Priya"` and imported.
3. **Row 10 (Rounding precision):** Cylinder refill amount is `899.995` (3 decimals).
   - *Detection:* Length of fractional part exceeds 2.
   - *Policy:* Rounded to 2 decimal places (`900.00` INR) and split equally.
4. **Row 27 (Irregular date & padding):** Date is `"Mar-14"` and payer is `"rohan "` (trailing space).
   - *Detection:* Failed standard date parser. Regex match captured month/day. Payer check detected trailing whitespace.
   - *Policy:* Resolved date to `14-03-2026` using contextual year 2026. Trimmed payer name to `"Rohan"` and matched.
5. **Row 28 (Missing currency):** Currency field is blank.
   - *Detection:* Found null or empty string.
   - *Policy:* Defaulted to INR and imported.

### Category B: Multi-Currency & Refunds (Auto-Resolved)
6. **Row 20 & 21 (USD Currency):** Goa villa booking `540 USD`, beach shack lunch `84 USD`.
   - *Detection:* Checked currency field for `USD`.
   - *Policy:* Converted USD to INR using import-time rate of `83.4` (e.g. `540 * 83.4 = 45036.00` INR). Saved original currency, original amount, rate, and converted amount for auditability.
7. **Row 26 (Negative Refund):** Parasailing refund is `-30` USD.
   - *Detection:* Amount is less than 0.
   - *Policy:* Imported as a refund, creating negative split shares for active members (crediting members).
8. **Row 42 (Split details conflict):** Split type is `"equal"` but `split_details` lists manual shares.
   - *Detection:* Both `split_type == "equal"` and non-empty `split_details` present.
   - *Policy:* Bypassed custom shares and split equally among listed users as split type dictates. Logged warning.

### Category C: Accounting Semantics (Auto-Resolved)
9. **Row 14 (Settlement logged as expense):** Rohan paid Aisha back ₹5000.
   - *Detection:* Split type is empty, split with contains one person, notes/desc describe settlement.
   - *Policy:* Ingested as a `Settlement` record between Rohan and Aisha instead of an `Expense` to avoid double-charging.

### Category D: Critical Validation Violations (Parked as PENDING in review queue)
10. **Row 6 (Exact Duplicate Row):** Dinner at Marina Bites Dev `3200` INR duplicated.
    - *Detection:* Matching date, amount, and payer.
    - *Policy:* Parked in review queue. Meera can reject (discard) or approve.
11. **Row 11 (Typo in Payer Name):** Payer is `"Priya S"`.
    - *Detection:* Payer user does not exist.
    - *Policy:* Parked in queue. Meera can override value to `"Priya"` and approve.
12. **Row 13 (Missing Payer):** Payer field is blank.
    - *Detection:* Null/empty value.
    - *Policy:* Parked in queue. Meera can specify payer and approve.
13. **Row 15 (Percentage splits sum mismatch):** Percentages sum to `110%` (`30% + 30% + 30% + 20%`).
    - *Detection:* Parsed percentages sum exceeds 100%.
    - *Policy:* Parked in queue.
14. **Row 23 (Unknown split member):** Includes `"Dev's friend Kabir"` who is not a group member.
    - *Detection:* User `Dev's friend Kabir` does not exist.
    - *Policy:* Parked in queue.
15. **Row 25 (Double Logging / Payer Conflict):** Aisha logged Thalassa dinner (₹2400) and Rohan logged it (₹2450) on same day.
    - *Detection:* Matching description on same day by different payers.
    - *Policy:* Parked in queue to let Meera decide which entry wins.
16. **Row 31 (Zero Amount):** SWIGGY order logged as ₹0.
    - *Detection:* Amount parsed is exactly 0.
    - *Policy:* Parked in queue.
17. **Row 34 (Date Ambiguity):** Date `04-05-2026` represents May 4th (out-of-order) or April 5th (in-order).
    - *Detection:* Specific date `04-05-2026` flagged.
    - *Policy:* Parked in queue for manual date clarification.
18. **Row 36 (Post-Membership Date Conflict):** Meera included on April 2nd expense, after leaving March 31st.
    - *Detection:* Expense date is greater than Meera's `leftAt` date boundary.
    - *Policy:* Parked in queue.
19. **Row 38 (Pre-Membership Settlement):** Sam deposit share logged April 8th before joining April 15th.
    - *Detection:* Transaction date is before Sam's group `joinedAt` date.
    - *Policy:* Parked in queue.
20. **Row 39 & 40 (Pre-Membership Active Splits):** Sam included on April 10th and April 12th before joining April 15th.
    - *Detection:* Splits date is before Sam's group `joinedAt` date.
    - *Policy:* Parked in queue.

---

## Database Schema (Prisma)

```prisma
model User {
  id            String         @id @default(uuid())
  name          String         @unique
  passwordHash  String
  createdAt     DateTime       @default(now())
  memberships   GroupMember[]
  paidExpenses  Expense[]      @relation("Payer")
  splits        ExpenseSplit[]
  sentSettlements     Settlement[] @relation("SettlementPayer")
  receivedSettlements Settlement[] @relation("SettlementReceiver")
}

model Group {
  id          String        @id @default(uuid())
  name        String
  createdAt   DateTime      @default(now())
  members     GroupMember[]
  expenses    Expense[]
  settlements Settlement[]
  sessions    ImportSession[]
}

model GroupMember {
  id        String    @id @default(uuid())
  groupId   String
  userId    String
  joinedAt  DateTime
  leftAt    DateTime?
  createdAt DateTime  @default(now())
  group     Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([groupId, userId])
}

model Expense {
  id              String         @id @default(uuid())
  groupId         String
  payerId         String
  description     String
  amount          Float
  currency        String         @default("INR")
  exchangeRate    Float          @default(1.0)
  convertedAmount Float
  date            DateTime
  splitType       String
  createdAt       DateTime       @default(now())
  group           Group          @relation(fields: [groupId], references: [id], onDelete: Cascade)
  payer           User           @relation("Payer", fields: [payerId], references: [id], onDelete: Cascade)
  splits          ExpenseSplit[]
}

model ExpenseSplit {
  id        String   @id @default(uuid())
  expenseId String
  userId    String
  amount    Float
  createdAt DateTime @default(now())
  expense   Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([expenseId, userId])
}

model Settlement {
  id          String   @id @default(uuid())
  groupId     String
  payerId     String
  receiverId  String
  amount      Float
  date        DateTime
  createdAt   DateTime @default(now())
  group       Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  payer       User     @relation("SettlementPayer", fields: [payerId], references: [id], onDelete: Cascade)
  receiver    User     @relation("SettlementReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
}

model ImportSession {
  id         String          @id @default(uuid())
  groupId    String
  fileName   String
  uploadedAt DateTime        @default(now())
  status     String          @default("PENDING")
  group      Group           @relation(fields: [groupId], references: [id], onDelete: Cascade)
  anomalies  ImportAnomaly[]
}

model ImportAnomaly {
  id           String        @id @default(uuid())
  sessionId    String
  rowNumber    Int
  rawRowData   String
  anomalyType  String
  description  String
  status       String        @default("PENDING")
  createdAt    DateTime      @default(now())
  session      ImportSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}
```
