# 📊 CSV Import & Anomaly Report

**File Processed:** `Expenses Export.csv`  
**Application URL:** [Flatmate Expense Tracker](https://expense-tracker-eight-nu-64.vercel.app)  

---

## 📈 Import Summary

> [!NOTE]
> This report details the data parsing and reconciliation process of the historical CSV dataset. Out of **42 total records** analyzed, **29 clean or auto-resolved records** were successfully imported, and **13 anomalies** were flagged for manual review.

* **Total Transactions:** `42`
* **Auto-Resolved & Ingested:** `29`
* **Flagged for Review (Pending Queue):** `13`

---

## 📝 Detailed Processing Log

| Row | Date | Description | Raw Amount | Payer | Status | Anomalies & Warnings | Action Taken |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **2** | 01-02-2026 | February rent | 48000 | Aisha | `✅ INSERTED` | *None* | Split equally between Aisha, Rohan, Priya, Meera. |
| **3** | 03-02-2026 | Groceries BigBasket | 2340 | Priya | `✅ INSERTED` | *None* | Split equally between Aisha, Rohan, Priya, Meera. |
| **4** | 05-02-2026 | Wifi bill Feb | 1199 | Rohan | `✅ INSERTED` | *None* | Split equally between Aisha, Rohan, Priya, Meera. |
| **5** | 08-02-2026 | Dinner at Marina Bites | 3200 | Dev | `❌ FLAGGED` | Payer & split member not active. | Dev was not a member on this date (Goa trip interval). |
| **6** | 08-02-2026 | dinner - marina bites | 3200 | Dev | `❌ FLAGGED` | Duplicate of Row 5; member not active. | Parked in queue as potential duplicate record. |
| **7** | 10-02-2026 | Electricity Feb | 1,200 | Aisha | `✅ INSERTED` | *None* | Cleaned quoted comma string to `1200.00` INR; split equally. |
| **8** | 12-02-2026 | Maid salary Feb | 3000 | Meera | `✅ INSERTED` | *None* | Split equally between Aisha, Rohan, Priya, Meera. |
| **9** | 14-02-2026 | Movie night snacks | 640 | priya | `✅ INSERTED` | Normalized name to "Priya". | Auto-corrected casing and split equally (Meera skipped). |
| **10** | 15-02-2026 | Cylinder refill | 899.995 | Rohan | `✅ INSERTED` | Rounded amount to 2 decimals. | Normalized `899.995` to `900.00` and split equally. |
| **11** | 18-02-2026 | Groceries DMart | 1875 | Priya S | `❌ FLAGGED` | Unknown payer name "Priya S". | Parked in queue for name correction to "Priya". |
| **12** | 20-02-2026 | Aisha birthday cake | 1500 | Rohan | `✅ INSERTED` | *None* | Applied unequal split values (Aisha excluded). |
| **13** | 22-02-2026 | House cleaning supplies | 780 | *(blank)* | `❌ FLAGGED` | Missing payer field. | Parked in queue to manually assign payer. |
| **14** | 25-02-2026 | Rohan paid Aisha back | 5000 | Rohan | `🤝 SETTLEMENT` | *None* | Auto-detected as peer settlement; saved as Settlement record. |
| **15** | 28-02-2026 | Pizza Friday | 1440 | Aisha | `✅ INSERTED` | *None* | Applied percentage split values. |
| **16** | 01-03-2026 | March rent | 48000 | Aisha | `✅ INSERTED` | *None* | Split equally between Aisha, Rohan, Priya, Meera. |
| **17** | 03-03-2026 | Groceries BigBasket | 2810 | Meera | `✅ INSERTED` | *None* | Split equally between Aisha, Rohan, Priya, Meera. |
| **18** | 05-03-2026 | Wifi bill Mar | 1199 | Rohan | `✅ INSERTED` | *None* | Split equally between Aisha, Rohan, Priya, Meera. |
| **19** | 08-03-2026 | Goa flights | 32400 | Aisha | `✅ INSERTED` | *None* | Split equally between Aisha, Rohan, Priya, Dev. |
| **20** | 09-03-2026 | Goa villa booking | 540 | Dev | `✅ INSERTED` | USD converted to INR. | Converted at 83.4 to ₹45,036.00. |
| **21** | 10-03-2026 | Beach shack lunch | 84 | Rohan | `✅ INSERTED` | USD converted to INR. | Converted at 83.4 to ₹7,005.60. |
| **22** | 10-03-2026 | Scooter rentals | 3600 | Priya | `✅ INSERTED` | *None* | Split using relative shares (Rohan/Dev took larger ones). |
| **23** | 11-03-2026 | Parasailing | 150 | Dev | `❌ FLAGGED` | Unknown member: Dev's friend Kabir. | Staged in queue for split list correction. |
| **24** | 11-03-2026 | Dinner at Thalassa | 2400 | Aisha | `✅ INSERTED` | *None* | Split equally between Aisha, Rohan, Priya, Dev. |
| **25** | 11-03-2026 | Thalassa dinner | 2450 | Rohan | `✅ INSERTED` | *None* | Split equally between Aisha, Rohan, Priya, Dev. |
| **26** | 12-03-2026 | Parasailing refund | -30 | Dev | `✅ INSERTED` | Negative refund; USD converted. | Converted at 83.4 (-₹2,502) and applied negative split credit. |
| **27** | Mar-14 | Airport cab | 1100 | rohan  | `❌ FLAGGED` | Casing issue; split member not active. | Normalized "rohan " but flagged because Dev was not active. |
| **28** | 15-03-2026 | Groceries DMart | 2105 | Priya | `✅ INSERTED` | Blank currency defaulted to INR. | Split equally. |
| **29** | 18-03-2026 | Electricity Mar | 1450 | Aisha | `✅ INSERTED` | *None* | Split equally. |
| **30** | 20-03-2026 | Maid salary Mar | 3000 | Meera | `✅ INSERTED` | *None* | Split equally. |
| **31** | 22-03-2026 | Dinner order Swiggy | 0 | Priya | `❌ FLAGGED` | Zero amount logged. | Parked in queue to review double entry. |
| **32** | 25-03-2026 | Weekend brunch | 2200 | Meera | `✅ INSERTED` | *None* | Applied percentage split values. |
| **33** | 28-03-2026 | Meera farewell dinner | 4800 | Aisha | `✅ INSERTED` | *None* | Split equally (Meera farewell). |
| **34** | 04-05-2026 | Deep cleaning service | 2500 | Rohan | `❌ FLAGGED` | Ambiguous date format. | Parked in queue to clarify if April 5th or May 4th. |
| **35** | 01-04-2026 | April rent | 48000 | Aisha | `✅ INSERTED` | *None* | Split using relative shares (Meera left). |
| **36** | 02-04-2026 | Groceries BigBasket | 2640 | Priya | `❌ FLAGGED` | Meera was not active. | Meera left March 31st (time-travel limit violation). |
| **37** | 05-04-2026 | Wifi bill Apr | 1199 | Rohan | `✅ INSERTED` | *None* | Split equally (Sam not joined yet). |
| **38** | 08-04-2026 | Sam deposit share | 15000 | Sam | `❌ FLAGGED` | Sam was not active. | Date (April 8) before Sam's join date (April 15). |
| **39** | 10-04-2026 | Housewarming drinks | 3100 | Sam | `❌ FLAGGED` | Sam was not active. | Date (April 10) before Sam's join date (April 15). |
| **40** | 12-04-2026 | Electricity Apr | 1380 | Aisha | `❌ FLAGGED` | Sam was not active. | Date (April 12) before Sam's join date (April 15). |
| **41** | 15-04-2026 | Groceries DMart | 1990 | Sam | `❌ FLAGGED` | Sam was not active. | Date (April 15) before Sam's join date (April 15). |
| **42** | 18-04-2026 | Furniture for common room | 12000 | Aisha | `✅ INSERTED` | Manual details ignored for Equal split. | Split equally among active April flatmates. |
| **43** | 20-04-2026 | Maid salary Apr | 3000 | Priya | `✅ INSERTED` | *None* | Split equally. |

---

## 🛠️ Anomaly Resolution Strategies

* **Casing Correction:** Auto-resolved spelling/casing variations (e.g. `priya` ➔ `Priya`).
* **Currency Conversion:** Auto-converted USD amounts to INR at `83.4` (saving original details for audit).
* **Formatting Repairs:** Stripped quoted string decorators and formatting (e.g., `"1,200"` ➔ `1200`).
* **Precision Rounding:** Truncated/rounded floats to standard 2-decimal currencies (e.g. `899.995` ➔ `900.00`).
* **Time-Travel Limits:** Safeguarded members' balances by checking active dates (e.g., Meera leaving Mar 31, Sam joining Apr 15).
* **Oversight Queue Routing:** Parked conflicts (duplicates, typos, zero amounts, percentage failures) safely in the approval queue.
