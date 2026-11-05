import { Prisma } from '../../generated/client/client.js';

/** One EXPENSE row to post: signed amount (negative = money out). */
export interface ExpensePosting {
  accountCode: string;
  amount: Prisma.Decimal;
}

/** Create posts the full amount out of the chosen account (nothing when 0). */
export function createPostings(
  amount: number,
  accountCode: string,
): ExpensePosting[] {
  const a = new Prisma.Decimal(amount);
  return a.isZero() ? [] : [{ accountCode, amount: a.negated() }];
}

/**
 * What an edit posts to keep the ledger truthful without ever rewriting a row.
 *  - Pre-ledger expense (no EXPENSE rows): only the amount difference, on CASH;
 *    an account move has nothing to move, so it posts nothing.
 *  - Same account: the signed difference.
 *  - Account moved: reverse the whole old amount on the old account and post
 *    the whole new amount on the new one.
 */
export function updatePostings(input: {
  oldAmount: Prisma.Decimal;
  newAmount: Prisma.Decimal;
  currentAccount: string | null;
  newAccountCode?: string;
}): ExpensePosting[] {
  const { oldAmount, newAmount, currentAccount, newAccountCode } = input;
  const diff = oldAmount.minus(newAmount); // = -(new - old)
  if (currentAccount === null) {
    return diff.isZero() ? [] : [{ accountCode: 'CASH', amount: diff }];
  }
  const accountChanged =
    newAccountCode !== undefined && newAccountCode !== currentAccount;
  if (!accountChanged) {
    return diff.isZero() ? [] : [{ accountCode: currentAccount, amount: diff }];
  }
  const out: ExpensePosting[] = [];
  if (!oldAmount.isZero()) {
    out.push({ accountCode: currentAccount, amount: oldAmount });
  }
  if (!newAmount.isZero()) {
    out.push({ accountCode: newAccountCode, amount: newAmount.negated() });
  }
  return out;
}

/** Soft delete reverses the whole amount back onto its account (none if pre-ledger). */
export function deletePostings(
  currentAmount: Prisma.Decimal,
  currentAccount: string | null,
): ExpensePosting[] {
  if (currentAccount === null || currentAmount.isZero()) return [];
  return [{ accountCode: currentAccount, amount: currentAmount }];
}
