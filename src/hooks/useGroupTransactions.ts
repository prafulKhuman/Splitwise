"use client";
import { useState, useEffect } from "react";
import { GroupTransaction } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, writeBatch,
} from "firebase/firestore";
import { formatCurrency } from "@/lib/settlements";

export function useGroupTransactions(groupId: string | null) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<GroupTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId || !user) { setLoading(false); return; }
    const q = query(collection(db, "group_transactions"), where("group_id", "==", groupId));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupTransaction));
      list.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [groupId, user]);

  const notifyParticipants = async (
    participantUids: string[],
    title: string,
    message: string,
    gId: string
  ) => {
    if (!user) return;
    const others = participantUids.filter((uid) => uid !== user.uid);
    if (others.length === 0) return;
    const batch = writeBatch(db);
    const colRef = collection(db, "notifications");
    for (const uid of others) {
      const ref = doc(colRef);
      batch.set(ref, {
        user_id: uid,
        type: "expense",
        title,
        message,
        read: false,
        group_id: gId,
        created_at: new Date().toISOString(),
      });
    }
    await batch.commit();
  };

  const addTransaction = async (data: Omit<GroupTransaction, "id" | "created_at" | "created_by">) => {
    if (!user) return;
    await addDoc(collection(db, "group_transactions"), {
      ...data,
      created_by: user.uid,
      created_at: new Date().toISOString(),
    });
    // Notify participants
    const participantUids = data.participants.map((p) => p.uid);
    await notifyParticipants(
      participantUids,
      "New Group Expense",
      `${data.paid_by_name} added "${data.title}" (${formatCurrency(data.amount)})`,
      data.group_id
    );
    showToast("Group expense added", "success");
  };

  const updateTransaction = async (id: string, data: Partial<GroupTransaction>) => {
    const { id: _id, created_at: _ca, created_by: _cb, ...rest } = data as GroupTransaction;
    await updateDoc(doc(db, "group_transactions", id), rest);
    showToast("Group expense updated", "success");
  };

  const deleteTransaction = async (id: string) => {
    await deleteDoc(doc(db, "group_transactions", id));
    showToast("Group expense deleted", "success");
  };

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction };
}
