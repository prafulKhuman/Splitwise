"use client";
import { useState, useEffect, useCallback } from "react";
import { Transaction } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
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
        const { id: _id, created_at: _ca, user_id: _uid, ...rest } = data as Transaction;
        await updateDoc(doc(db, "transactions", editingId), rest);
        showToast("Transaction updated", "success");
      } else {
        await addDoc(collection(db, "transactions"), {
          ...data,
          type: data.type || "expense",
          notes: data.notes || "",
          user_id: user.uid,
          created_at: new Date().toISOString(),
        });
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
