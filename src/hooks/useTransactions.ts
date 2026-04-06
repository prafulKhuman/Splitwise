"use client";
import { useState, useEffect, useCallback } from "react";
import { Transaction } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, deleteField,
} from "firebase/firestore";

export function useTransactions() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "transactions"), where("user_id", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
      list.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(list);
      setLoading(false);
      setError(false);
    }, () => {
      setError(true);
      setLoading(false);
    });
    return () => unsub();
  }, [user, authLoading]);

  const expenses = transactions.filter((t) => t.type === "expense");
  const incomes = transactions.filter((t) => t.type === "income");

  const handleSave = async (data: Partial<Transaction>, editingId?: string) => {
    if (!user) return;
    try {
      if (editingId) {
        const clean: Record<string, unknown> = {};
        if (data.title !== undefined) clean.title = data.title;
        if (data.amount !== undefined) clean.amount = data.amount;
        if (data.type !== undefined) clean.type = data.type;
        if (data.category !== undefined) clean.category = data.category;
        if (data.date !== undefined) clean.date = data.date;
        clean.notes = data.notes || "";
        clean.splits = data.splits ?? deleteField();
        await updateDoc(doc(db, "transactions", editingId), clean);
        showToast("Transaction updated", "success");
      } else {
        const payload: Record<string, unknown> = {
          title: data.title,
          amount: data.amount,
          type: data.type || "expense",
          category: data.category,
          date: data.date,
          notes: data.notes || "",
          user_id: user.uid,
          created_at: new Date().toISOString(),
        };
        if (data.splits) payload.splits = data.splits;
        await addDoc(collection(db, "transactions"), payload);
        showToast("Transaction added", "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
      showToast("Transaction deleted", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  };

  return { transactions, expenses, incomes, loading, error, handleSave, handleDelete, authLoading };
}

// Backward compat
export function useExpenses() {
  const hook = useTransactions();
  return { ...hook, expenses: hook.expenses, fetchExpenses: () => {} };
}
