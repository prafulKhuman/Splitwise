"use client";
import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Box, Typography,
  ToggleButtonGroup, ToggleButton, Checkbox, FormControlLabel,
} from "@mui/material";
import { GroupMember, SplitMethod, SplitParticipant, GroupTransaction } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<GroupTransaction, "id" | "created_at" | "created_by">) => void;
  members: GroupMember[];
  groupId: string;
};

export default function GroupExpenseForm({ open, onClose, onSave, members, groupId }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", amount: "", category: "General", date: "", notes: "" });
  const [paidBy, setPaidBy] = useState("");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("equal");
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({ title: "", amount: "", category: "General", date: new Date().toISOString().split("T")[0], notes: "" });
      setPaidBy(user?.uid || "");
      setSplitMethod("equal");
      setSelectedUids(members.map((m) => m.uid));
      setCustomAmounts({});
    }
  }, [open, members, user]);

  const toggleMember = (uid: string) => {
    setSelectedUids((prev) => prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]);
  };

  const getParticipants = (): SplitParticipant[] => {
    const amount = Number(form.amount);
    if (splitMethod === "equal") {
      const perPerson = amount / selectedUids.length;
      return selectedUids.map((uid) => ({
        uid,
        displayName: members.find((m) => m.uid === uid)?.displayName || "Unknown",
        amount: Math.round(perPerson * 100) / 100,
      }));
    }
    if (splitMethod === "selected") {
      const perPerson = amount / selectedUids.length;
      return selectedUids.map((uid) => ({
        uid,
        displayName: members.find((m) => m.uid === uid)?.displayName || "Unknown",
        amount: Math.round(perPerson * 100) / 100,
      }));
    }
    return members.filter((m) => customAmounts[m.uid]).map((m) => ({
      uid: m.uid,
      displayName: m.displayName,
      amount: Number(customAmounts[m.uid]) || 0,
    }));
  };

  const handleSubmit = () => {
    if (!form.title || !form.amount || !form.date) return;
    const payer = members.find((m) => m.uid === paidBy);
    onSave({
      group_id: groupId,
      title: form.title,
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      notes: form.notes,
      paid_by: paidBy,
      paid_by_name: payer?.displayName || "Unknown",
      split_method: splitMethod,
      participants: getParticipants(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Group Expense</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <TextField label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} fullWidth />
        <TextField label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth />
        <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} />

        <TextField label="Paid By" select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} fullWidth>
          {members.map((m) => <MenuItem key={m.uid} value={m.uid}>{m.displayName}</MenuItem>)}
        </TextField>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Split Method</Typography>
          <ToggleButtonGroup value={splitMethod} exclusive onChange={(_, v) => v && setSplitMethod(v)} fullWidth size="small">
            <ToggleButton value="equal">Equal</ToggleButton>
            <ToggleButton value="selected">Selected</ToggleButton>
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {(splitMethod === "equal" || splitMethod === "selected") && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Participants</Typography>
            {members.map((m) => (
              <FormControlLabel key={m.uid}
                control={<Checkbox checked={selectedUids.includes(m.uid)} onChange={() => toggleMember(m.uid)} size="small" />}
                label={<Typography variant="body2">{m.displayName}</Typography>}
              />
            ))}
            {selectedUids.length > 0 && form.amount && (
              <Typography variant="caption" color="primary" sx={{ display: "block", mt: 0.5 }}>
                ₹{(Number(form.amount) / selectedUids.length).toFixed(2)} per person
              </Typography>
            )}
          </Box>
        )}

        {splitMethod === "custom" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {members.map((m) => (
              <TextField key={m.uid} label={m.displayName} type="number" size="small"
                value={customAmounts[m.uid] || ""}
                onChange={(e) => setCustomAmounts({ ...customAmounts, [m.uid]: e.target.value })}
              />
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}
          sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
          Add Expense
        </Button>
      </DialogActions>
    </Dialog>
  );
}
