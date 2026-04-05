"use client";
import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, ToggleButtonGroup, ToggleButton, Typography,
} from "@mui/material";
import { Category, TransactionType, CategoryKind } from "@/lib/types";

const COLORS = ["#6C63FF", "#FF6B8A", "#1DC9B7", "#FFB822", "#36B37E", "#FF5630", "#6554C0", "#00B8D9"];

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Category>, id?: string) => void;
  category?: Category | null;
};

export default function CategoryForm({ open, onClose, onSave, category }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [type, setType] = useState<TransactionType>("expense");
  const [kind, setKind] = useState<CategoryKind>("variable");

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setType(category.type || "expense");
      setKind(category.kind || "variable");
    } else {
      setName("");
      setColor(COLORS[0]);
      setType("expense");
      setKind("variable");
    }
  }, [category, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, type, kind }, category?.id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        <TextField label="Category Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Type</Typography>
          <ToggleButtonGroup value={type} exclusive onChange={(_, v) => v && setType(v)} fullWidth size="small">
            <ToggleButton value="expense" sx={{ "&.Mui-selected": { bgcolor: "#FD397A15", color: "#FD397A" } }}>Expense</ToggleButton>
            <ToggleButton value="income" sx={{ "&.Mui-selected": { bgcolor: "#1DC9B715", color: "#1DC9B7" } }}>Income</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>Kind</Typography>
          <ToggleButtonGroup value={kind} exclusive onChange={(_, v) => v && setKind(v)} fullWidth size="small">
            <ToggleButton value="fixed">Fixed</ToggleButton>
            <ToggleButton value="variable">Variable</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>Color</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {COLORS.map((c) => (
              <Box key={c} onClick={() => setColor(c)}
                sx={{
                  width: 32, height: 32, borderRadius: "50%", bgcolor: c, cursor: "pointer",
                  border: color === c ? "3px solid #333" : "3px solid transparent",
                  transition: "border 0.15s",
                }}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>{category ? "Update" : "Add"}</Button>
      </DialogActions>
    </Dialog>
  );
}
