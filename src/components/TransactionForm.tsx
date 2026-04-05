"use client";
import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Box, ToggleButtonGroup, ToggleButton,
  Typography, IconButton, Divider,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { Transaction, TransactionType, TransactionSplit } from "@/lib/types";
import { useCategories } from "@/hooks/useCategories";

const FALLBACK_EXPENSE = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Other"];
const FALLBACK_INCOME = ["Salary", "Freelance", "Investment", "Other"];

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  transaction?: Transaction | null;
};

export default function TransactionForm({ open, onClose, onSave, transaction }: Props) {
  const { getCategoriesByType } = useCategories();
  const [type, setType] = useState<TransactionType>("expense");
  const [form, setForm] = useState({ title: "", amount: "", category: "", date: "", notes: "" });
  const [splits, setSplits] = useState<TransactionSplit[]>([]);
  const [useSplit, setUseSplit] = useState(false);

  const cats = getCategoriesByType(type);
  const catNames = cats.length > 0 ? cats.map((c) => c.name) : (type === "expense" ? FALLBACK_EXPENSE : FALLBACK_INCOME);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type || "expense");
      setForm({
        title: transaction.title,
        amount: String(transaction.amount),
        category: transaction.category,
        date: transaction.date,
        notes: transaction.notes || "",
      });
      if (transaction.splits?.length) {
        setSplits(transaction.splits);
        setUseSplit(true);
      } else {
        setSplits([]);
        setUseSplit(false);
      }
    } else {
      setType("expense");
      setForm({ title: "", amount: "", category: catNames[0] || "", date: new Date().toISOString().split("T")[0], notes: "" });
      setSplits([]);
      setUseSplit(false);
    }
  }, [transaction, open]);

  useEffect(() => {
    if (!transaction && catNames.length > 0 && !form.category) {
      setForm((f) => ({ ...f, category: catNames[0] }));
    }
  }, [type, catNames]);

  const handleSubmit = () => {
    if (!form.title || !form.amount || !form.date) return;
    onSave({
      ...form,
      amount: Number(form.amount),
      type,
      splits: useSplit && splits.length > 0 ? splits : undefined,
    });
    onClose();
  };

  const addSplit = () => setSplits([...splits, { category: catNames[0] || "", amount: 0 }]);
  const removeSplit = (i: number) => setSplits(splits.filter((_, idx) => idx !== i));
  const updateSplit = (i: number, field: keyof TransactionSplit, val: string | number) =>
    setSplits(splits.map((s, idx) => idx === i ? { ...s, [field]: field === "amount" ? Number(val) : val } : s));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{transaction ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        <ToggleButtonGroup
          value={type}
          exclusive
          onChange={(_, v) => v && setType(v)}
          fullWidth
          size="small"
        >
          <ToggleButton value="expense" sx={{ "&.Mui-selected": { bgcolor: "#FD397A15", color: "#FD397A" } }}>
            Expense
          </ToggleButton>
          <ToggleButton value="income" sx={{ "&.Mui-selected": { bgcolor: "#1DC9B715", color: "#1DC9B7" } }}>
            Income
          </ToggleButton>
        </ToggleButtonGroup>

        <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <TextField label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} fullWidth />
        <TextField label="Category" select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} fullWidth>
          {catNames.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} fullWidth multiline rows={2} />

        <Box>
          <Button size="small" onClick={() => setUseSplit(!useSplit)} sx={{ textTransform: "none", mb: 1 }}>
            {useSplit ? "Remove Split" : "Split into categories"}
          </Button>
          {useSplit && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {splits.map((s, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField select size="small" value={s.category} onChange={(e) => updateSplit(i, "category", e.target.value)} sx={{ flex: 1 }}>
                    {catNames.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                  <TextField size="small" type="number" value={s.amount} onChange={(e) => updateSplit(i, "amount", e.target.value)} sx={{ width: 100 }} />
                  <IconButton size="small" onClick={() => removeSplit(i)}><Delete fontSize="small" /></IconButton>
                </Box>
              ))}
              <Button size="small" startIcon={<Add />} onClick={addSplit} sx={{ textTransform: "none" }}>Add Split</Button>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}
          sx={{ background: type === "income" ? "linear-gradient(135deg, #1DC9B7, #4DD9CB)" : "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
          {transaction ? "Update" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
