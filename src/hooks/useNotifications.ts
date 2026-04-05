"use client";
import { useState, useEffect } from "react";
import { AppNotification, NotificationType } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot, orderBy,
  addDoc, updateDoc, doc, writeBatch, getDocs, limit,
} from "firebase/firestore";

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", user.uid),
      orderBy("created_at", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  };

  const sendNotification = async (
    targetUserId: string,
    type: NotificationType,
    title: string,
    message: string,
    groupId?: string
  ) => {
    await addDoc(collection(db, "notifications"), {
      user_id: targetUserId,
      type,
      title,
      message,
      read: false,
      group_id: groupId || null,
      created_at: new Date().toISOString(),
    });
  };

  const sendToMultiple = async (
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    groupId?: string
  ) => {
    const batch = writeBatch(db);
    const colRef = collection(db, "notifications");
    for (const uid of userIds) {
      const docRef = doc(colRef);
      batch.set(docRef, {
        user_id: uid,
        type,
        title,
        message,
        read: false,
        group_id: groupId || null,
        created_at: new Date().toISOString(),
      });
    }
    await batch.commit();
  };

  return {
    notifications, unreadCount, loading,
    markAsRead, markAllRead, sendNotification, sendToMultiple,
  };
}
