import { Settlement, GroupTransaction, GroupMember, MonthlyPool } from "./types";

export function calculateSettlements(
  transactions: GroupTransaction[],
  members: GroupMember[]
): Settlement[] {
  const balances: Record<string, number> = {};
  members.forEach((m) => (balances[m.uid] = 0));

  transactions.forEach((tx) => {
    balances[tx.paid_by] = (balances[tx.paid_by] || 0) + tx.amount;
    tx.participants.forEach((p) => {
      balances[p.uid] = (balances[p.uid] || 0) - p.amount;
    });
  });

  return simplifyDebts(balances, members);
}

export function calculatePoolSettlements(pool: MonthlyPool, members: GroupMember[]): Settlement[] {
  const balances: Record<string, number> = {};
  members.forEach((m) => (balances[m.uid] = 0));

  pool.contributions.forEach((c) => {
    if (c.paid) balances[c.uid] = (balances[c.uid] || 0) + c.amount;
  });

  pool.expenses.forEach((exp) => {
    const perPerson = exp.amount / exp.participants.length;
    exp.participants.forEach((uid) => {
      balances[uid] = (balances[uid] || 0) - perPerson;
    });
  });

  return simplifyDebts(balances, members);
}

function simplifyDebts(balances: Record<string, number>, members: GroupMember[]): Settlement[] {
  const nameMap: Record<string, string> = {};
  members.forEach((m) => (nameMap[m.uid] = m.displayName));

  const debtors: { uid: string; amount: number }[] = [];
  const creditors: { uid: string; amount: number }[] = [];

  Object.entries(balances).forEach(([uid, bal]) => {
    if (bal < -0.01) debtors.push({ uid, amount: -bal });
    else if (bal > 0.01) creditors.push({ uid, amount: bal });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    if (amount > 0.01) {
      settlements.push({
        from: debtors[i].uid,
        fromName: nameMap[debtors[i].uid] || "Unknown",
        to: creditors[j].uid,
        toName: nameMap[creditors[j].uid] || "Unknown",
        amount: Math.round(amount * 100) / 100,
      });
    }
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return settlements;
}

export function formatCurrency(amount: number, symbol = "₹"): string {
  return `${symbol}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
