"use client";
import { useState } from "react";
import { Box, Paper, Typography, Button, IconButton, Chip, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { Add, Edit, Delete, Category as CategoryIcon } from "@mui/icons-material";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import PageSkeleton from "@/components/PageSkeleton";
import NoData from "@/components/NoData";
import CategoryForm from "@/components/CategoryForm";
import { Category, TransactionType } from "@/lib/types";

export default function CategoriesPage() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading, handleSave, handleDelete } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");

  if (txLoading || catLoading) return <PageSkeleton variant="cards" />;

  const filtered = typeFilter === "all" ? categories : categories.filter((c) => c.type === typeFilter);

  const breakdown = transactions.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 1 }}>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flex: 1, minWidth: 0, flexWrap: "wrap" }}>
          <Typography variant="h6" fontWeight={700} sx={{ display: { xs: "none", sm: "block" } }}>Categories</Typography>
          <ToggleButtonGroup value={typeFilter} exclusive onChange={(_, v) => v && setTypeFilter(v)} size="small">
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="expense">Expense</ToggleButton>
            <ToggleButton value="income">Income</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setDialogOpen(true); }}
          sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)", "&:hover": { background: "linear-gradient(135deg, #4B44CC, #6C63FF)" }, minWidth: "auto" }}>
          Add
        </Button>
      </Box>

      {filtered.length === 0 ? (
        <NoData message="No categories yet" sub="Click 'Add' to create one." />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: { xs: 1.5, sm: 2 } }}>
          {filtered.map((cat) => (
            <Paper key={cat.id} sx={{ p: { xs: 2, sm: 3 }, display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 }, transition: "transform 0.2s, box-shadow 0.2s", "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 25px rgba(0,0,0,0.08)" } }}>
              <Box sx={{ width: 48, height: 48, borderRadius: 2, background: `linear-gradient(135deg, ${cat.color}, ${cat.color}CC)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CategoryIcon sx={{ color: "#fff" }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600}>{cat.name}</Typography>
                <Box sx={{ display: "flex", gap: 0.5, mt: 0.3 }}>
                  <Chip label={cat.type || "expense"} size="small"
                    sx={{ fontSize: 10, height: 20, bgcolor: cat.type === "income" ? "#1DC9B715" : "#FD397A15", color: cat.type === "income" ? "#1DC9B7" : "#FD397A" }} />
                  <Chip label={cat.kind || "variable"} size="small" sx={{ fontSize: 10, height: 20 }} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  ₹{(breakdown[cat.name] || 0).toFixed(2)} · {transactions.filter((e) => e.category === cat.name).length} txns
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <IconButton size="small" onClick={() => { setEditing(cat); setDialogOpen(true); }}><Edit fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(cat.id)}><Delete fontSize="small" /></IconButton>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <CategoryForm open={dialogOpen} onClose={() => { setDialogOpen(false); setEditing(null); }} onSave={handleSave} category={editing} />
    </>
  );
}
