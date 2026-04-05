"use client";
import { Box, Paper, Typography } from "@mui/material";
import { Transaction } from "@/lib/types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Props = { expenses: Transaction[] };

export default function MonthlyChart({ expenses }: Props) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const m = d.getMonth(), y = d.getFullYear();
    const monthTx = expenses.filter((e) => { const ed = new Date(e.date); return ed.getMonth() === m && ed.getFullYear() === y; });
    return {
      label: MONTH_LABELS[m],
      expense: monthTx.filter((e) => e.type !== "income").reduce((s, e) => s + e.amount, 0),
      income: monthTx.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0),
    };
  });

  const max = Math.max(...months.map((m) => Math.max(m.expense, m.income)), 1);

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Monthly Overview</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2.5, display: "block" }}>Last 6 months</Typography>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: { xs: 1, sm: 1.5 }, height: { xs: 140, sm: 180 }, mt: 2 }}>
        {months.map((m, i) => {
          const isCurrent = i === months.length - 1;
          return (
            <Box key={m.label} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
              <Box sx={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
                <Box sx={{ width: 14, height: Math.max(4, (m.income / max) * 130), bgcolor: "#1DC9B7", borderRadius: "4px 4px 0 0", transition: "height 0.5s" }} />
                <Box sx={{ width: 14, height: Math.max(4, (m.expense / max) * 130), bgcolor: isCurrent ? "#6C63FF" : "#E4E6EF", borderRadius: "4px 4px 0 0", transition: "height 0.5s" }} />
              </Box>
              <Typography variant="caption" sx={{ fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "#6C63FF" : "#B5B5C3" }}>{m.label}</Typography>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", gap: 2, mt: 1.5, justifyContent: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#1DC9B7" }} /><Typography variant="caption">Income</Typography></Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#6C63FF" }} /><Typography variant="caption">Expense</Typography></Box>
      </Box>
    </Paper>
  );
}
