"use client";
import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Checkbox, FormControlLabel,
} from "@mui/material";
import { GroupMember } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: { title: string; amount: number; date: string; paid_by: string; participants: string[] }) => void;
  members: GroupMember[];
};

export default function PoolExpenseForm({ open, onClose, onSave, members }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", amount: "", date: "" });
  const [participants, setParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setForm({ title: "", amount: "", date: new Date().toISOString().split("T")[0] });
      setParticipants(members.map((m) => m.uid));
    }
  }, [open, members]);

  const toggle = (uid: string) =>
    setParticipants((p) => p.includes(uid) ? p.filter((u) => u !== uid) : [...p, uid]);

  const handleSubmit = () => {
    if (!form.title || !form.amount || participants.length === 0) return;
    onSave({
      title: form.title,
      amount: Number(form.amount),
      date: form.date,
      paid_by: user?.uid || "",
      participants,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Pool Expense</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <TextField label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} fullWidth />
        <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Participants</Typography>
          {members.map((m) => (
            <FormControlLabel key={m.uid}
              control={<Checkbox checked={participants.includes(m.uid)} onChange={() => toggle(m.uid)} size="small" />}
              label={<Typography variant="body2">{m.displayName}</Typography>}
            />
          ))}
          {participants.length > 0 && form.amount && (
            <Typography variant="caption" color="primary">
              ₹{(Number(form.amount) / participants.length).toFixed(2)} per person
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}
          sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
