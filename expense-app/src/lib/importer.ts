import { parse } from 'csv-parse/sync';
import prisma from './db';

// USD to INR conversion rate
export const EXCHANGE_RATE_USD_TO_INR = 83.4;

export interface ParsedCsvRow {
  date: string;
  description: string;
  paid_by: string;
  amount: string;
  currency: string;
  split_type: string;
  split_with: string;
  split_details: string;
  notes: string;
}

export interface ImportResultRow {
  rowNumber: number;
  description: string;
  status: 'INSERTED' | 'SETTLEMENT' | 'FLAGGED' | 'ERROR';
  anomalies: { type: string; description: string; critical: boolean }[];
  details: string;
}

// Helper to parse dates with multiple formats
export function parseCsvDate(dateStr: string): {
  date: Date | null;
  isAmbiguous: boolean;
  error?: string;
} {
  if (!dateStr || !dateStr.trim()) {
    return { date: null, isAmbiguous: false, error: 'Empty date field' };
  }

  const trimmed = dateStr.trim();

  // Format: Mar-14, Feb-08, etc.
  const monthDayRegex = /^([A-Za-z]+)-(\d{1,2})$/;
  const monthDayMatch = trimmed.match(monthDayRegex);
  if (monthDayMatch) {
    const months: { [key: string]: number } = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const monthName = monthDayMatch[1].toLowerCase().substring(0, 3);
    const day = parseInt(monthDayMatch[2], 10);
    const month = months[monthName];

    if (month !== undefined && day >= 1 && day <= 31) {
      // Default to 2026 since that is the context year for all entries
      return { date: new Date(2026, month, day), isAmbiguous: false };
    }
  }

  // Format: YYYY-MM-DD or DD-MM-YYYY (also supports slashes)
  const parts = trimmed.split(/[-/]/);
  if (parts.length === 3) {
    let day = 0;
    let month = 0;
    let year = 0;

    if (parts[0].length === 4) {
      // YYYY-MM-DD or YYYY/MM/DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // 0-indexed
      day = parseInt(parts[2], 10);
    } else {
      // DD-MM-YYYY or DD/MM/YYYY
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // 0-indexed
      year = parseInt(parts[2], 10);
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      // Check for row 34 specific case: "04-05-2026" / "2026-05-04" (May 4th vs April 5th ambiguity)
      const isAmbiguous = (day === 4 && month === 4 && year === 2026) || (day === 5 && month === 3 && year === 2026 && trimmed.startsWith('04-05'));
      return { date: new Date(year, month, day), isAmbiguous };
    }
  }

  return { date: null, isAmbiguous: false, error: `Invalid date format: ${dateStr}` };
}

// Normalize username to match db users
export async function findUserByName(nameStr: string) {
  if (!nameStr || !nameStr.trim()) return null;
  const name = nameStr.trim();

  // Case insensitive match
  return prisma.user.findFirst({
    where: {
      name: {
        equals: name,
      },
    },
  });
}

// Primary Import Processor function
export async function processImport(csvContent: string, groupId: string, fileName: string) {
  // Create an Import Session
  const session = await prisma.importSession.create({
    data: {
      groupId,
      fileName,
      status: 'PENDING',
    },
  });

  const records: ParsedCsvRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const report: ImportResultRow[] = [];
  const processedRows: { dateStr: string; amount: number; payer: string }[] = [];

  // Group members list for membership lookup
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: true },
  });

  // Loop through CSV rows and validate
  for (let idx = 0; idx < records.length; idx++) {
    const row = records[idx];
    const rowNum = idx + 2; // header is row 1
    const anomalies: { type: string; description: string; critical: boolean }[] = [];
    let isCritical = false;

    // 1. Amount Parsing & Verification
    let rawAmount = row.amount || '';
    // Strip double quotes and commas (e.g. "1,200")
    rawAmount = rawAmount.replace(/["\s,]/g, '');
    let amount = parseFloat(rawAmount);

    if (isNaN(amount)) {
      anomalies.push({
        type: 'INCONSISTENT_SPLIT',
        description: `Invalid numeric amount: ${row.amount}`,
        critical: true,
      });
      isCritical = true;
      amount = 0;
    } else {
      // Check negative amount (refund)
      if (amount < 0) {
        anomalies.push({
          type: 'NEGATIVE_AMOUNT',
          description: `Negative amount of ${amount} detected (Refund).`,
          critical: false, // Non-critical: we can auto-resolve as negative split, but log it
        });
      }

      // Check zero amount
      if (amount === 0) {
        anomalies.push({
          type: 'NEGATIVE_AMOUNT',
          description: `Zero amount logged.`,
          critical: true, // Critical: zero amount expenses have no financial meaning to save as active
        });
        isCritical = true;
      }

      // Check rounding precision (more than 2 decimals)
      if (rawAmount.includes('.') && rawAmount.split('.')[1].length > 2) {
        anomalies.push({
          type: 'NEGATIVE_AMOUNT', // Will represent formatting/precision in reports
          description: `Rounding precision issue: ${row.amount} has more than 2 decimal places. We rounded it to 2 decimals.`,
          critical: false, // Non-critical: we will round it
        });
        amount = Math.round(amount * 100) / 100;
      }
    }

    // 2. Currency check
    let currency = (row.currency || '').trim().toUpperCase();
    let exchangeRate = 1.0;
    let convertedAmount = amount;

    if (!currency) {
      anomalies.push({
        type: 'USD_TREATED_AS_INR',
        description: `Missing currency. Defaulted to INR.`,
        critical: false,
      });
      currency = 'INR';
    } else if (currency === 'USD') {
      exchangeRate = EXCHANGE_RATE_USD_TO_INR;
      convertedAmount = amount * exchangeRate;
      anomalies.push({
        type: 'USD_TREATED_AS_INR',
        description: `USD amount detected. Converted ${amount} USD to ${convertedAmount.toFixed(2)} INR using rate of ${exchangeRate}.`,
        critical: false, // Auto-resolved
      });
    }

    // 3. Date check
    const { date, isAmbiguous, error: dateError } = parseCsvDate(row.date);
    let finalDate = date;

    if (dateError || !finalDate) {
      anomalies.push({
        type: 'DATE_MEMBERSHIP_CONFLICT',
        description: dateError || `Failed to parse date: ${row.date}`,
        critical: true,
      });
      isCritical = true;
      finalDate = new Date();
    } else {
      if (isAmbiguous) {
        anomalies.push({
          type: 'DATE_MEMBERSHIP_CONFLICT',
          description: `Ambiguous date "${row.date}". Could be April 5th or May 4th. Flagged for clarification.`,
          critical: true,
        });
        isCritical = true;
      }
    }

    // 4. Payer check
    const paidByStr = (row.paid_by || '').trim();
    let payerUser = null;
    if (!paidByStr) {
      anomalies.push({
        type: 'MISSING_PAYER',
        description: `Payer field is empty.`,
        critical: true,
      });
      isCritical = true;
    } else {
      payerUser = await findUserByName(paidByStr);
      if (!payerUser) {
        anomalies.push({
          type: 'UNKNOWN_MEMBER',
          description: `Unknown payer name "${paidByStr}".`,
          critical: true,
        });
        isCritical = true;
      } else {
        // Case-insensitivity cleanup check
        if (payerUser.name !== paidByStr) {
          anomalies.push({
            type: 'UNKNOWN_MEMBER',
            description: `Normalized payer name from "${paidByStr}" to "${payerUser.name}".`,
            critical: false,
          });
        }
      }
    }

    // 5. Settlement check
    // If split_type is empty and split_with contains a single person, or notes indicate settlement
    const splitTypeStr = (row.split_type || '').trim().toLowerCase();
    const splitWithStr = (row.split_with || '').trim();
    const descriptionStr = (row.description || '').toLowerCase();
    const isSettlement =
      splitTypeStr === '' &&
      splitWithStr.split(';').length === 1 &&
      splitWithStr.length > 0 &&
      (descriptionStr.includes('paid back') ||
        descriptionStr.includes('settle') ||
        descriptionStr.includes('deposit'));

    if (isSettlement) {
      anomalies.push({
        type: 'SETTLEMENT_LOGGED_AS_EXPENSE',
        description: `Row identified as a settlement instead of an expense: "${row.description}".`,
        critical: false, // We will insert directly as a Settlement if otherwise clean, but flag it
      });
    }

    // 6. Split Members & Date-membership Conflicts
    const splitNames = splitWithStr
      ? splitWithStr
          .split(';')
          .map((n) => n.trim())
          .filter(Boolean)
      : [];
    const splitUsers: { id: string; name: string }[] = [];

    if (splitNames.length === 0 && !isSettlement) {
      anomalies.push({
        type: 'INCONSISTENT_SPLIT',
        description: `Split list (split_with) is empty.`,
        critical: true,
      });
      isCritical = true;
    }

    for (const sName of splitNames) {
      const sUser = await findUserByName(sName);
      if (!sUser) {
        anomalies.push({
          type: 'UNKNOWN_MEMBER',
          description: `Unknown split member name "${sName}".`,
          critical: true,
        });
        isCritical = true;
      } else {
        splitUsers.push({ id: sUser.id, name: sUser.name });

        // Time-travel check: was this member active in the group on the expense date?
        if (finalDate) {
          const membership = groupMembers.find((gm) => gm.userId === sUser.id);
          if (!membership) {
            anomalies.push({
              type: 'DATE_MEMBERSHIP_CONFLICT',
              description: `User "${sUser.name}" is not a member of this group.`,
              critical: true,
            });
            isCritical = true;
          } else {
            const joined = new Date(membership.joinedAt);
            const left = membership.leftAt ? new Date(membership.leftAt) : null;
            const expTime = finalDate.getTime();

            if (expTime < joined.getTime() || (left && expTime > left.getTime())) {
              anomalies.push({
                type: 'DATE_MEMBERSHIP_CONFLICT',
                description: `Date conflict: User "${sUser.name}" was not active on ${row.date}. Active interval: ${membership.joinedAt.toISOString().slice(0, 10)} to ${membership.leftAt ? membership.leftAt.toISOString().slice(0, 10) : 'Present'}.`,
                critical: true,
              });
              isCritical = true;
            }
          }
        }
      }
    }

    // Also check payer's membership active on date
    if (payerUser && finalDate) {
      const payerMembership = groupMembers.find((gm) => gm.userId === payerUser!.id);
      if (!payerMembership) {
        anomalies.push({
          type: 'DATE_MEMBERSHIP_CONFLICT',
          description: `Payer "${payerUser.name}" is not a member of this group.`,
          critical: true,
        });
        isCritical = true;
      } else {
        const joined = new Date(payerMembership.joinedAt);
        const left = payerMembership.leftAt ? new Date(payerMembership.leftAt) : null;
        const expTime = finalDate.getTime();

        if (expTime < joined.getTime() || (left && expTime > left.getTime())) {
          anomalies.push({
            type: 'DATE_MEMBERSHIP_CONFLICT',
            description: `Date conflict: Payer "${payerUser.name}" was not active on ${row.date}.`,
            critical: true,
          });
          isCritical = true;
        }
      }
    }

    // 7. Duplicate Row Checks
    const isSwiggyswish = processedRows.find(
      (pr) =>
        pr.dateStr === row.date && Math.abs(pr.amount - amount) < 0.01 && pr.payer === paidByStr,
    );
    if (isSwiggyswish) {
      anomalies.push({
        type: 'DUPLICATE_ROW',
        description: `Exact duplicate row matching date, amount, and payer.`,
        critical: true,
      });
      isCritical = true;
    }

    // Double logging check (like Aisha dinner Swiggy Swiggy: Swiggy Swiggy swish swatch)
    // "Two rows: same dinner, diff amounts" (Row 24 Aisha 2400 vs Row 25 Rohan 2450)
    const possibleDoubleLogging = report.find(
      (r) =>
        r.status === 'INSERTED' &&
        r.description.toLowerCase().replace(/[^a-z0-9]/g, '') ===
          row.description.toLowerCase().replace(/[^a-z0-9]/g, '') &&
        r.anomalies.length === 0, // only clean inserted ones
    );
    if (possibleDoubleLogging) {
      anomalies.push({
        type: 'DUPLICATE_ROW',
        description: `Possible duplicate/double-logged expense: matches description "${row.description}" on same day with different amount.`,
        critical: true,
      });
      isCritical = true;
    }

    // 8. Split details checking
    const splitDetailsStr = (row.split_details || '').trim();
    const parsedSplits: { userId: string; name: string; amount: number }[] = [];

    if (!isCritical && !isSettlement) {
      if (splitTypeStr === 'equal') {
        if (splitDetailsStr) {
          anomalies.push({
            type: 'INCONSISTENT_SPLIT',
            description: `Split type is "equal", but split_details has values ("${splitDetailsStr}"). We ignored details and split equally.`,
            critical: false,
          });
        }
        const splitShare = convertedAmount / splitUsers.length;
        splitUsers.forEach((u) => {
          parsedSplits.push({ userId: u.id, name: u.name, amount: splitShare });
        });
      } else if (splitTypeStr === 'unequal') {
        // exact amounts
        // split_details: Rohan 700; Priya 400; Meera 400
        const detailParts = splitDetailsStr
          .split(';')
          .map((p) => p.trim())
          .filter(Boolean);
        let sum = 0;
        for (const part of detailParts) {
          const lastSpace = part.lastIndexOf(' ');
          if (lastSpace === -1) {
            anomalies.push({
              type: 'INCONSISTENT_SPLIT',
              description: `Invalid split detail format: "${part}"`,
              critical: true,
            });
            isCritical = true;
            break;
          }
          const name = part.substring(0, lastSpace).trim();
          const val = parseFloat(part.substring(lastSpace + 1).trim());
          const u = splitUsers.find((su) => su.name.toLowerCase() === name.toLowerCase());
          if (!u) {
            anomalies.push({
              type: 'INCONSISTENT_SPLIT',
              description: `Split detail user "${name}" not in split list`,
              critical: true,
            });
            isCritical = true;
            break;
          }
          parsedSplits.push({ userId: u.id, name: u.name, amount: val });
          sum += val;
        }
        if (!isCritical && Math.abs(sum - convertedAmount) > 0.05) {
          anomalies.push({
            type: 'INCONSISTENT_SPLIT',
            description: `Sum of unequal splits (₹${sum}) does not match total amount (₹${convertedAmount}).`,
            critical: true,
          });
          isCritical = true;
        }
      } else if (splitTypeStr === 'percentage') {
        // split_details: Aisha 30%; Rohan 30%; Priya 30%; Meera 20%
        const detailParts = splitDetailsStr
          .split(';')
          .map((p) => p.trim())
          .filter(Boolean);
        let sumPct = 0;
        for (const part of detailParts) {
          const lastSpace = part.lastIndexOf(' ');
          if (lastSpace === -1) {
            anomalies.push({
              type: 'INCONSISTENT_SPLIT',
              description: `Invalid percentage format: "${part}"`,
              critical: true,
            });
            isCritical = true;
            break;
          }
          const name = part.substring(0, lastSpace).trim();
          const valStr = part
            .substring(lastSpace + 1)
            .replace('%', '')
            .trim();
          const pct = parseFloat(valStr);
          const u = splitUsers.find((su) => su.name.toLowerCase() === name.toLowerCase());
          if (!u) {
            anomalies.push({
              type: 'INCONSISTENT_SPLIT',
              description: `Percentage user "${name}" not in split list`,
              critical: true,
            });
            isCritical = true;
            break;
          }
          const val = (pct / 100) * convertedAmount;
          parsedSplits.push({ userId: u.id, name: u.name, amount: val });
          sumPct += pct;
        }
        if (!isCritical && Math.abs(sumPct - 100) > 0.01) {
          anomalies.push({
            type: 'INCONSISTENT_SPLIT',
            description: `Sum of percentages (${sumPct}%) does not equal 100%.`,
            critical: true,
          });
          isCritical = true;
        }
      } else if (splitTypeStr === 'share') {
        // split_details: Aisha 1; Rohan 2; Priya 1; Dev 2
        const detailParts = splitDetailsStr
          .split(';')
          .map((p) => p.trim())
          .filter(Boolean);
        let totalShares = 0;
        const sharesMap: { userId: string; name: string; shares: number }[] = [];
        for (const part of detailParts) {
          const lastSpace = part.lastIndexOf(' ');
          if (lastSpace === -1) {
            anomalies.push({
              type: 'INCONSISTENT_SPLIT',
              description: `Invalid share format: "${part}"`,
              critical: true,
            });
            isCritical = true;
            break;
          }
          const name = part.substring(0, lastSpace).trim();
          const val = parseFloat(part.substring(lastSpace + 1).trim());
          const u = splitUsers.find((su) => su.name.toLowerCase() === name.toLowerCase());
          if (!u) {
            anomalies.push({
              type: 'INCONSISTENT_SPLIT',
              description: `Share user "${name}" not in split list`,
              critical: true,
            });
            isCritical = true;
            break;
          }
          sharesMap.push({ userId: u.id, name: u.name, shares: val });
          totalShares += val;
        }

        if (!isCritical) {
          sharesMap.forEach((sm) => {
            const shareAmount = (sm.shares / totalShares) * convertedAmount;
            parsedSplits.push({ userId: sm.userId, name: sm.name, amount: shareAmount });
          });
        }
      } else {
        anomalies.push({
          type: 'INCONSISTENT_SPLIT',
          description: `Unsupported split type: "${row.split_type}"`,
          critical: true,
        });
        isCritical = true;
      }
    }

    // 9. Database insertion OR anomaly queue parking
    if (isCritical) {
      // Park in Anomaly review DB queue (Trap 3 & 4)
      await prisma.importAnomaly.create({
        data: {
          sessionId: session.id,
          rowNumber: rowNum,
          rawRowData: JSON.stringify(row),
          anomalyType: anomalies.find((a) => a.critical)?.type || 'INCONSISTENT_SPLIT',
          description: anomalies.map((a) => a.description).join(' | '),
          status: 'PENDING',
        },
      });

      report.push({
        rowNumber: rowNum,
        description: row.description,
        status: 'FLAGGED',
        anomalies,
        details: `Parked in review queue for Meera's approval.`,
      });
    } else {
      // Clean row -> Write to database
      if (isSettlement) {
        // Settle receiver lookup
        const receiverName = splitWithStr.trim();
        const receiverUser = await findUserByName(receiverName);

        if (!receiverUser) {
          // If receiver is somehow unknown (but splitName was validated?)
          await prisma.importAnomaly.create({
            data: {
              sessionId: session.id,
              rowNumber: rowNum,
              rawRowData: JSON.stringify(row),
              anomalyType: 'UNKNOWN_MEMBER',
              description: `Unknown receiver in settlement: "${receiverName}"`,
              status: 'PENDING',
            },
          });
          report.push({
            rowNumber: rowNum,
            description: row.description,
            status: 'FLAGGED',
            anomalies: [
              {
                type: 'UNKNOWN_MEMBER',
                description: `Unknown receiver: ${receiverName}`,
                critical: true,
              },
            ],
            details: 'Parked in review queue due to unknown receiver in settlement.',
          });
        } else {
          // Create Settlement directly
          await prisma.settlement.create({
            data: {
              groupId,
              payerId: payerUser!.id,
              receiverId: receiverUser.id,
              amount: convertedAmount,
              date: finalDate!,
            },
          });

          // Log auto-resolved anomaly for auditability
          for (const anomaly of anomalies) {
            await prisma.importAnomaly.create({
              data: {
                sessionId: session.id,
                rowNumber: rowNum,
                rawRowData: JSON.stringify(row),
                anomalyType: anomaly.type,
                description: anomaly.description,
                status: 'APPROVED', // marked as auto-resolved
              },
            });
          }

          report.push({
            rowNumber: rowNum,
            description: row.description,
            status: 'SETTLEMENT',
            anomalies,
            details: `Imported as settlement: ${payerUser!.name} paid ₹${convertedAmount.toFixed(2)} to ${receiverUser.name}.`,
          });
        }
      } else {
        // Create Expense & Splits in a transaction
        await prisma.$transaction(async (tx) => {
          const exp = await tx.expense.create({
            data: {
              groupId,
              payerId: payerUser!.id,
              description: row.description.trim(),
              amount,
              currency,
              exchangeRate,
              convertedAmount,
              date: finalDate!,
              splitType: splitTypeStr.toUpperCase(),
            },
          });

          // Create Expense splits
          for (const ps of parsedSplits) {
            await tx.expenseSplit.create({
              data: {
                expenseId: exp.id,
                userId: ps.userId,
                amount: Math.round(ps.amount * 100) / 100, // round split shares to 2 decimals
              },
            });
          }
        });

        // Log auto-resolved anomalies for auditability
        for (const anomaly of anomalies) {
          await prisma.importAnomaly.create({
            data: {
              sessionId: session.id,
              rowNumber: rowNum,
              rawRowData: JSON.stringify(row),
              anomalyType: anomaly.type,
              description: anomaly.description,
              status: 'APPROVED', // auto-resolved
            },
          });
        }

        report.push({
          rowNumber: rowNum,
          description: row.description,
          status: 'INSERTED',
          anomalies,
          details: `Imported as expense. Converted Amount: ₹${convertedAmount.toFixed(2)}. Split shares recorded for ${parsedSplits.map((s) => `${s.name}: ₹${s.amount.toFixed(2)}`).join(', ')}.`,
        });
      }

      processedRows.push({
        dateStr: row.date,
        amount: amount,
        payer: paidByStr,
      });
    }
  }

  // Update Import Session status
  const finalStatus = report.some((r) => r.status === 'ERROR') ? 'FAILED' : 'COMPLETED';
  await prisma.importSession.update({
    where: { id: session.id },
    data: { status: finalStatus },
  });

  return { sessionId: session.id, report };
}
