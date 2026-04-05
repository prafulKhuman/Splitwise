"use client";
import { useState, useEffect } from "react";
import { MonthlyPool, PoolExpense, PoolContribution, GroupMember } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { db } from "@/lib/firebase";
import { getCurrentMonth, formatCurrency } from "@/lib/settlements";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, doc, writeBatch,
} from "firebase/firestore";
import { v4 as uuid } from "uuid";

export function useMonthlyPool(groupId: string | null) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pools, setPools] = useState<MonthlyPool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !user) { setLoading(false); return; }
    const q = query(collection(db, "monthly_pools"), where("group_id", "==", groupId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MonthlyPool));
      list.sort((a, b) => b.month.localeCompare(a.month));
      setPools(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [groupId, user]);

  const currentPool = pools.find((p) => p.month === getCurrentMonth() && p.is_active);
  const archivedPools = pools.filter((p) => p !== currentPool);

  const notifyMembers = async (memberUids: string[], title: string, message: string, gId: string) => {
    if (!user) return;
    const others = memberUids.filter((uid) => uid !== user.uid);
    if (others.length === 0) return;
    const batch = writeBatch(db);
    const colRef = collection(db, "notifications");
    for (const uid of others) {
      const ref = doc(colRef);
      batch.set(ref, {
        user_id: uid,
        type: "contribution",
        title,
        message,
        read: false,
        group_id: gId,
        created_at: new Date().toISOString(),
      });
    }
    await batch.commit();
  };

  const createPool = async (contributionAmount: number, members: GroupMember[]) => {
    if (!groupId) return;
    const month = getCurrentMonth();
    const existing = pools.find((p) => p.month === month);
    if (existing) {
      showToast("Pool already exists for this month", "warning");
      return;
    }
    const contributions: PoolContribution[] = members.map((m) => ({
      uid: m.uid,
      displayName: m.displayName,
      amount: contributionAmount,
      paid: false,
    }));
    await addDoc(collection(db, "monthly_pools"), {
      group_id: groupId,
      month,
      contribution_amount: contributionAmount,
      contributions,
      expenses: [],
      is_active: true,
      created_at: new Date().toISOString(),
    });
    // Notify all members about new pool
    await notifyMembers(
      members.map((m) => m.uid),
      "Monthly Pool Created",
      `New pool created! Contribute ${formatCurrency(contributionAmount)} each.`,
      groupId
    );
    showToast("Monthly pool created", "success");
  };

  const markContribution = async (poolId: string, uid: string, paid: boolean) => {
    const pool = pools.find((p) => p.id === poolId);
    if (!pool) return;
    const updated = pool.contributions.map((c) =>
      c.uid === uid ? { ...c, paid, paid_at: paid ? new Date().toISOString() : undefined } : c
    );
    await updateDoc(doc(db, "monthly_pools", poolId), { contributions: updated });
    // Notify the user whose contribution was marked
    if (uid !== user?.uid && groupId) {
      const batch = writeBatch(db);
      const ref = doc(collection(db, "notifications"));
      batch.set(ref, {
        user_id: uid,
        type: "contribution",
        title: paid ? "Contribution Confirmed" : "Contribution Unmarked",
        message: paid
          ? `Your contribution of ${formatCurrency(pool.contribution_amount)} has been confirmed`
          : "Your contribution status was updated",
        read: false,
        group_id: groupId,
        created_at: new Date().toISOString(),
      });
      await batch.commit();
    }
    showToast(paid ? "Contribution marked as paid" : "Contribution unmarked", "success");
  };

  const sendContributionReminders = async (poolId: string) => {
    const pool = pools.find((p) => p.id === poolId);
    if (!pool || !groupId) return;
    const unpaid = pool.contributions.filter((c) => !c.paid);
    if (unpaid.length === 0) {
      showToast("All contributions are paid!", "info");
      return;
    }
    await notifyMembers(
      unpaid.map((c) => c.uid),
      "Contribution Reminder",
      `Please contribute ${formatCurrency(pool.contribution_amount)} for this month's pool.`,
      groupId
    );
    showToast(`Reminders sent to ${unpaid.length} member(s)`, "success");
  };

  const addPoolExpense = async (poolId: string, expense: Omit<PoolExpense, "id" | "created_at">) => {
    const pool = pools.find((p) => p.id === poolId);
    if (!pool) return;
    const newExpense: PoolExpense = {
      ...expense,
      id: uuid(),
      created_at: new Date().toISOString(),
    };
    await updateDoc(doc(db, "monthly_pools", poolId), {
      expenses: [...pool.expenses, newExpense],
    });
    // Notify participants
    if (groupId) {
      await notifyMembers(
        expense.participants,
        "Pool Expense Added",
        `"${expense.title}" (${formatCurrency(expense.amount)}) was added to the pool`,
        groupId
      );
    }
    showToast("Pool expense added", "success");
  };

  const closePool = async (poolId: string) => {
    const pool = pools.find((p) => p.id === poolId);
    await updateDoc(doc(db, "monthly_pools", poolId), { is_active: false });
    // Notify members about pool closure
    if (pool && groupId) {
      await notifyMembers(
        pool.contributions.map((c) => c.uid),
        "Monthly Pool Closed",
        `The pool for ${pool.month} has been closed and archived.`,
        groupId
      );
    }
    showToast("Pool closed and archived", "success");
  };

  const getPoolBalance = (pool: MonthlyPool) => {
    const totalContributed = pool.contributions.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);
    const totalSpent = pool.expenses.reduce((s, e) => s + e.amount, 0);
    return totalContributed - totalSpent;
  };

  const getMemberBalance = (pool: MonthlyPool, uid: string) => {
    const contribution = pool.contributions.find((c) => c.uid === uid);
    const contributed = contribution?.paid ? contribution.amount : 0;
    const spent = pool.expenses
      .filter((e) => e.participants.includes(uid))
      .reduce((s, e) => s + e.amount / e.participants.length, 0);
    return contributed - spent;
  };

  return {
    pools, currentPool, archivedPools, loading,
    createPool, markContribution, addPoolExpense, closePool,
    getPoolBalance, getMemberBalance, sendContributionReminders,
  };
}
