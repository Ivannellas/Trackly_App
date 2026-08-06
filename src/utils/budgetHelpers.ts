import { BucketName, Transaction, TransactionType } from '../types';

export interface BucketTotals {
  needs: number;
  wants: number;
  others: number;
}

export interface BudgetTotals {
  totalBalance: number;
  buckets: BucketTotals;
}

const bucketKeys: BucketName[] = ['needs', 'wants', 'others'];

const toNumber = (value: unknown) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTransactionType = (transaction: Transaction): TransactionType => {
  if (transaction.type) {
    return transaction.type;
  }

  return toNumber(transaction.amount) < 0 ? 'expense' : 'income';
};

const getSignedAmount = (transaction: Transaction) => {
  const amount = Math.abs(toNumber(transaction.amount));
  const type = getTransactionType(transaction);

  if (type === 'expense') {
    return -amount;
  }

  if (type === 'transfer') {
    return toNumber(transaction.amount);
  }

  return amount;
};

export const formatMoney = (amount: number) => {
  const absolute = Math.abs(toNumber(amount));
  return absolute.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const createGroupId = (): string => {
  const cryptoObject = globalThis as typeof globalThis & {
    crypto?: {
      randomUUID?: () => string;
    };
  };

  if (typeof cryptoObject.crypto?.randomUUID === 'function') {
    try {
      return cryptoObject.crypto.randomUUID();
    } catch {
      // Fall through if randomUUID fails at runtime
    }
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const calculateAutoSplit = (
  amount: number,
  needsPct: number,
  wantsPct: number,
  othersPct: number
) => {
  const safeAmount = Math.max(0, toNumber(amount));
  const totalCents = Math.round(safeAmount * 100);

  const needsCents = Math.round((totalCents * toNumber(needsPct)) / 100);
  const wantsCents = Math.round((totalCents * toNumber(wantsPct)) / 100);
  const othersCents = Math.max(0, totalCents - needsCents - wantsCents);

  return {
    needs: needsCents / 100,
    wants: wantsCents / 100,
    others: othersCents / 100,
  };
};

export const calculateTotals = (transactions: Transaction[]): BudgetTotals => {
  const buckets: BucketTotals = {
    needs: 0,
    wants: 0,
    others: 0,
  };

  let totalBalance = 0;

  transactions.forEach((transaction) => {
    const signedAmount = getSignedAmount(transaction);
    totalBalance += signedAmount;

    const bucket = bucketKeys.includes(transaction.bucket as BucketName)
      ? (transaction.bucket as BucketName)
      : 'needs';

    buckets[bucket] += signedAmount;
  });

  return {
    totalBalance,
    buckets,
  };
};