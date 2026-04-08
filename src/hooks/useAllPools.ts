"use client";
import { useState, useEffect } from "react";
import { MonthlyPool } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export type PoolWithGroup = MonthlyPool & { groupName: string };

export function useAllPools(groups: { id: string; name: string }[]) {
  const { user } = useAuth();
  const [pools, setPools] = useState<PoolWithGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || groups.length === 0) { setLoading(false); return; }
    const groupIds = groups.map((g) => g.id);
    const nameMap: Record<string, string> = {};
    groups.forEach((g) => (nameMap[g.id] = g.name));

    // Firestore 'in' supports max 30 items
    const chunks: string[][] = [];
    for (let i = 0; i < groupIds.length; i += 30) {
      chunks.push(groupIds.slice(i, i + 30));
    }

    const unsubs: (() => void)[] = [];
    const allPools: Record<string, PoolWithGroup[]> = {};

    let loaded = 0;
    chunks.forEach((chunk, idx) => {
      const q = query(collection(db, "monthly_pools"), where("group_id", "in", chunk));
      const unsub = onSnapshot(q, (snap) => {
        allPools[idx] = snap.docs.map((d) => {
          const data = d.data() as MonthlyPool;
          return { ...data, id: d.id, groupName: nameMap[data.group_id] || "Unknown" };
        });
        loaded++;
        if (loaded >= chunks.length) {
          const merged = Object.values(allPools).flat();
          merged.sort((a, b) => b.created_at.localeCompare(a.created_at));
          setPools(merged);
          setLoading(false);
        }
      });
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((u) => u());
  }, [user, groups]);

  return { pools, loading };
}
