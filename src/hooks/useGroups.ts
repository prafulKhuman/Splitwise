"use client";
import { useState, useEffect } from "react";
import { Group, GroupMember, GroupSettings } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch,
} from "firebase/firestore";

export function useGroups() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(collection(db, "groups"), where("member_uids", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Group)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  const notifyUser = async (targetUid: string, title: string, message: string, groupId?: string) => {
    await addDoc(collection(db, "notifications"), {
      user_id: targetUid,
      type: "group",
      title,
      message,
      read: false,
      group_id: groupId || null,
      created_at: new Date().toISOString(),
    });
  };

  const createGroup = async (name: string, description: string) => {
    if (!user) return;
    const member: GroupMember = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      role: "admin",
      joined_at: new Date().toISOString(),
    };
    await addDoc(collection(db, "groups"), {
      name, description,
      created_by: user.uid,
      members: [member],
      member_uids: [user.uid],
      settings: { members_can_add: true, members_can_edit: false },
      created_at: new Date().toISOString(),
    });
    showToast("Group created", "success");
  };

  const addMember = async (groupId: string, email: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    if (group.members.some((m) => m.email === email)) {
      showToast("Member already in group", "warning");
      return;
    }
    const usersQ = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(usersQ);
    let newMember: GroupMember;
    if (!snap.empty) {
      const userData = snap.docs[0].data();
      newMember = {
        uid: snap.docs[0].id,
        email,
        displayName: userData.displayName || email.split("@")[0],
        role: "member",
        joined_at: new Date().toISOString(),
      };
    } else {
      newMember = {
        uid: email,
        email,
        displayName: email.split("@")[0],
        role: "member",
        joined_at: new Date().toISOString(),
      };
    }
    const updatedMembers = [...group.members, newMember];
    const updatedUids = [...(group.member_uids || group.members.map(m => m.uid)), newMember.uid];
    await updateDoc(doc(db, "groups", groupId), {
      members: updatedMembers,
      member_uids: updatedUids,
    });
    // Notify the new member
    if (!snap.empty) {
      await notifyUser(
        newMember.uid,
        "Added to Group",
        `You were added to "${group.name}" by ${user?.displayName || "someone"}`,
        groupId
      );
    }
    showToast("Member added", "success");
  };

  const removeMember = async (groupId: string, uid: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    await updateDoc(doc(db, "groups", groupId), {
      members: group.members.filter((m) => m.uid !== uid),
      member_uids: group.members.filter((m) => m.uid !== uid).map((m) => m.uid),
    });
    await notifyUser(uid, "Removed from Group", `You were removed from "${group.name}"`, groupId);
    showToast("Member removed", "success");
  };

  const updateSettings = async (groupId: string, settings: GroupSettings) => {
    await updateDoc(doc(db, "groups", groupId), { settings });
    showToast("Settings updated", "success");
  };

  const deleteGroup = async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) {
      const others = group.members.filter((m) => m.uid !== user?.uid);
      const batch = writeBatch(db);
      const colRef = collection(db, "notifications");
      for (const m of others) {
        const ref = doc(colRef);
        batch.set(ref, {
          user_id: m.uid,
          type: "group",
          title: "Group Deleted",
          message: `"${group.name}" was deleted by the admin`,
          read: false,
          group_id: null,
          created_at: new Date().toISOString(),
        });
      }
      await batch.commit();
    }
    await deleteDoc(doc(db, "groups", groupId));
    showToast("Group deleted", "success");
  };

  const isAdmin = (group: Group) => user?.uid === group.created_by;

  const canAdd = (group: Group) =>
    isAdmin(group) || group.settings?.members_can_add;

  const canEdit = (group: Group) =>
    isAdmin(group) || group.settings?.members_can_edit;

  return {
    groups, loading, createGroup, addMember, removeMember,
    updateSettings, deleteGroup, isAdmin, canAdd, canEdit,
  };
}
