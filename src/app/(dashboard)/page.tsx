"use client";
import { useState } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { useTransactions } from "@/hooks/useTransactions";
import PageSkeleton from "@/components/PageSkeleton";
import SummaryCards from "@/components/SummaryCards";
import MonthlyChart from "@/components/dashboard/MonthlyChart";
import CategoryDonut from "@/components/dashboard/CategoryDonut";
import WeeklyTrend from "@/components/dashboard/WeeklyTrend";
import CategoryProgress from "@/components/dashboard/CategoryProgress";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ExpenseTable from "@/components/ExpenseTable";
import TransactionForm from "@/components/TransactionForm";
import { Transaction } from "@/lib/types";

export default function DashboardPage() {
  const { transactions, loading, error, handleSave, handleDelete } = useTransactions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  if (loading) return <PageSkeleton variant="dashboard" />;

  const data = error ? [] : transactions;
  const handleEdit = (exp: Transaction) => { setEditing(exp); setDialogOpen(true); };

  return (
    <>
      <SummaryCards expenses={data} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: { xs: 2, md: 2.5 }, mb: { xs: 2, md: 2.5 } }}>
        <MonthlyChart expenses={data} />
        <CategoryDonut expenses={data} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 2, md: 2.5 }, mb: { xs: 2, md: 2.5 } }}>
        <WeeklyTrend expenses={data} />
        <CategoryProgress expenses={data} />
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: { xs: 2, md: 2.5 } }}>
        <RecentActivity expenses={data} />
        <Paper sx={{ p: { xs: 2, sm: 2.5 }, overflow: "hidden", display: { xs: "none", md: "block" } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>Recent Transactions</Typography>
            <Button size="small" href="/expenses" sx={{ textTransform: "none", fontWeight: 600, color: "#6C63FF" }}>View All</Button>
          </Box>
          <ExpenseTable expenses={data.slice(0, 5)} onEdit={handleEdit} onDelete={handleDelete} />
        </Paper>
      </Box>

      <TransactionForm
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSave={(data) => { handleSave(data, editing?.id); setEditing(null); }}
        transaction={editing}
      />
    </>
  );
}
