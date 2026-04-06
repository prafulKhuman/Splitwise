"use client";
import { useState } from "react";
import { Box, TextField, MenuItem, Button, Paper, ToggleButtonGroup, ToggleButton } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import PageSkeleton from "@/components/PageSkeleton";
import NoData from "@/components/NoData";
import ExpenseTable from "@/components/ExpenseTable";
import TransactionForm from "@/components/TransactionForm";
import { Transaction, TransactionType } from "@/lib/types";

export default function ExpensesPage() {
  const { transactions, loading, error, handleSave, handleDelete } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [catFilter, setCatFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  if (loading || catLoading) return <PageSkeleton variant="table" />;

  const data = error ? [] : transactions;
  const filtered = data
    .filter((e) => typeFilter === "all" || e.type === typeFilter)
    .filter((e) => catFilter === "All" || e.category === catFilter);

  const catNames = ["All", ...new Set(data.map((e) => e.category))];
  const handleEdit = (exp: Transaction) => { setEditing(exp); setDialogOpen(true); };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 1 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
          <ToggleButtonGroup value={typeFilter} exclusive onChange={(_, v) => v && setTypeFilter(v)} size="small">
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="expense" sx={{ "&.Mui-selected": { color: "#FD397A" } }}>Expense</ToggleButton>
            <ToggleButton value="income" sx={{ "&.Mui-selected": { color: "#1DC9B7" } }}>Income</ToggleButton>
          </ToggleButtonGroup>
          <TextField select size="small" label="Category" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} sx={{ minWidth: 120, display: { xs: "none", sm: "flex" } }}>
            {catNames.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditing(null); setDialogOpen(true); }}
          sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)", "&:hover": { background: "linear-gradient(135deg, #4B44CC, #6C63FF)" }, whiteSpace: "nowrap", minWidth: "auto", px: { xs: 2, sm: 3 } }}>
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Add Transaction</Box>
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>Add</Box>
        </Button>
      </Box>

      {data.length === 0 ? (
        <NoData message="No transactions yet" sub="Click 'Add Transaction' to get started." />
      ) : filtered.length === 0 ? (
        <NoData message="No matching transactions" sub="Try a different filter." />
      ) : (
        <Paper sx={{ overflow: "hidden" }}>
          <ExpenseTable expenses={filtered} onEdit={handleEdit} onDelete={handleDelete} />
        </Paper>
      )}

      <TransactionForm
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSave={(data) => { handleSave(data, editing?.id); setEditing(null); }}
        transaction={editing}
      />
    </>
  );
}
