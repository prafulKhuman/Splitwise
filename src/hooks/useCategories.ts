"use client";
import { useState, useEffect } from "react";
import { Category, TransactionType } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";

export function useCategories() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "categories"), where("user_id", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(list);
      setLoading(false);
      setError(false);
    }, () => {
      setError(true);
      setLoading(false);
    });
    return () => unsub();
  }, [user, authLoading]);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const handleSave = async (data: Partial<Category>, editingId?: string) => {
    if (!user) return;
    try {
      if (editingId) {
        await updateDoc(doc(db, "categories", editingId), {
          name: data.name,
          color: data.color,
          type: data.type || "expense",
          kind: data.kind || "variable",
        });
        showToast("Category updated", "success");
      } else {
        await addDoc(collection(db, "categories"), {
          name: data.name,
          color: data.color || "#6C63FF",
          type: data.type || "expense",
          kind: data.kind || "variable",
          user_id: user.uid,
          created_at: new Date().toISOString(),
        });
        showToast("Category added", "success");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Something went wrong", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      showToast("Category deleted", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  };

  const getCategoriesByType = (type: TransactionType) =>
    categories.filter((c) => c.type === type);

  return {
    categories, expenseCategories, incomeCategories,
    loading, error, handleSave, handleDelete, getCategoriesByType,
    fetchCategories: () => {},
  };
}
