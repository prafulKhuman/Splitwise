"use client";
import { useState } from "react";
import { Box, Paper, Typography, TextField, MenuItem, Button, Chip, Avatar } from "@mui/material";
import { Receipt, TrendingUp, TrendingDown, PieChart, BarChart as BarChartIcon, Download, PictureAsPdf } from "@mui/icons-material";
import { useTransactions } from "@/hooks/useTransactions";
import { useGroups } from "@/hooks/useGroups";
import { useGroupTransactions } from "@/hooks/useGroupTransactions";
import { useMonthlyPool } from "@/hooks/useMonthlyPool";
import PageSkeleton from "@/components/PageSkeleton";
import { formatCurrency } from "@/lib/settlements";
import { exportTransactionsCSV, exportTransactionsPDF } from "@/lib/export";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["#6C63FF", "#FF6B8A", "#1DC9B7", "#FFB822", "#8950FC", "#F64E60", "#3699FF", "#00B8D9"];

export default function ReportsPage() {
  const { transactions, loading } = useTransactions();
  const { groups } = useGroups();
  const [selectedGroup, setSelectedGroup] = useState("");
  const { transactions: groupTx } = useGroupTransactions(selectedGroup || null);
  const { currentPool, pools } = useMonthlyPool(selectedGroup || null);

  if (loading) return <PageSkeleton variant="reports" />;

  const expenses = transactions.filter((t) => t.type !== "income");
  const incomes = transactions.filter((t) => t.type === "income");
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomes.reduce((s, e) => s + e.amount, 0);

  const catBreakdown = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const incomeCatBreakdown = incomes.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const m = d.getMonth(), y = d.getFullYear();
    const mExpenses = expenses.filter((e) => { const ed = new Date(e.date); return ed.getMonth() === m && ed.getFullYear() === y; });
    const mIncomes = incomes.filter((e) => { const ed = new Date(e.date); return ed.getMonth() === m && ed.getFullYear() === y; });
    return { label: MONTHS[m], expense: mExpenses.reduce((s, e) => s + e.amount, 0), income: mIncomes.reduce((s, e) => s + e.amount, 0) };
  });
  const maxMonthly = Math.max(...monthlyData.map((m) => Math.max(m.expense, m.income)), 1);

  const groupTotal = groupTx.reduce((s, t) => s + t.amount, 0);

  // Contribution vs Usage for selected group pool
  const pool = currentPool || (pools.length > 0 ? pools[0] : null);
  const contributionData = pool ? pool.contributions.map((c) => {
    const contributed = c.paid ? c.amount : 0;
    const used = pool.expenses
      .filter((e) => e.participants.includes(c.uid))
      .reduce((s, e) => s + e.amount / e.participants.length, 0);
    return { name: c.displayName, contributed, used, net: contributed - used };
  }) : [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Export Buttons */}
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
        <Button size="small" variant="outlined" startIcon={<Download />}
          onClick={() => exportTransactionsCSV(transactions)} sx={{ textTransform: "none", flex: { xs: 1, sm: "none" } }}>
          CSV
        </Button>
        <Button size="small" variant="outlined" startIcon={<PictureAsPdf />}
          onClick={() => exportTransactionsPDF(transactions)} sx={{ textTransform: "none", flex: { xs: 1, sm: "none" } }}>
          PDF
        </Button>
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
        {[
          { label: "Income", value: formatCurrency(totalIncome), color: "#1DC9B7", icon: <TrendingUp /> },
          { label: "Expenses", value: formatCurrency(totalExpense), color: "#FD397A", icon: <TrendingDown /> },
          { label: "Savings", value: formatCurrency(totalIncome - totalExpense), color: "#6C63FF", icon: <PieChart /> },
          { label: "Count", value: transactions.length, color: "#FFB822", icon: <Receipt /> },
        ].map((s) => (
          <Paper key={s.label} sx={{ p: { xs: 1.5, sm: 2 }, display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, borderRadius: 2, bgcolor: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>
              {s.icon}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: 10, sm: 12 } }}>{s.label}</Typography>
              <Typography variant="body1" fontWeight={700} noWrap sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}>{s.value}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
        {/* Monthly Income vs Expense */}
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
            <BarChartIcon sx={{ color: "#6C63FF" }} /> Monthly Overview
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>Income vs Expenses (last 6 months)</Typography>
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 160 }}>
            {monthlyData.map((m, i) => (
              <Box key={m.label} sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ display: "flex", gap: "2px", alignItems: "flex-end", width: "100%", justifyContent: "center" }}>
                  <Box sx={{ width: "40%", maxWidth: 16, height: Math.max(4, (m.income / maxMonthly) * 120), bgcolor: "#1DC9B7", borderRadius: "3px 3px 0 0" }} />
                  <Box sx={{ width: "40%", maxWidth: 16, height: Math.max(4, (m.expense / maxMonthly) * 120), bgcolor: "#FD397A", borderRadius: "3px 3px 0 0" }} />
                </Box>
                <Typography variant="caption" sx={{ fontSize: 10, color: i === 5 ? "#6C63FF" : "text.secondary", fontWeight: i === 5 ? 700 : 500 }}>{m.label}</Typography>
              </Box>
            ))}
          </Box>
          <Box sx={{ display: "flex", gap: 2, mt: 1.5, justifyContent: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#1DC9B7" }} /><Typography variant="caption">Income</Typography></Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#FD397A" }} /><Typography variant="caption">Expense</Typography></Box>
          </Box>
        </Paper>

        {/* Expense Category Breakdown */}
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
            <Receipt sx={{ color: "#FD397A" }} /> Expense by Category
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>Spending distribution</Typography>
          {Object.keys(catBreakdown).length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>No data</Typography>
          ) : Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amount], i) => {
            const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
            return (
              <Box key={cat} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={500}>{cat}</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatCurrency(amount)} ({pct.toFixed(0)}%)</Typography>
                </Box>
                <Box sx={{ height: 8, bgcolor: "action.hover", borderRadius: 4, overflow: "hidden" }}>
                  <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: COLORS[i % COLORS.length], borderRadius: 4, transition: "width 0.5s ease" }} />
                </Box>
              </Box>
            );
          })}
        </Paper>

        {/* Income Category Breakdown */}
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUp sx={{ color: "#1DC9B7" }} /> Income by Category
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>Income sources</Typography>
          {Object.keys(incomeCatBreakdown).length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>No income data</Typography>
          ) : Object.entries(incomeCatBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => {
            const pct = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
            return (
              <Box key={cat} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={500}>{cat}</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatCurrency(amount)} ({pct.toFixed(0)}%)</Typography>
                </Box>
                <Box sx={{ height: 8, bgcolor: "action.hover", borderRadius: 4, overflow: "hidden" }}>
                  <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: "#1DC9B7", borderRadius: 4, transition: "width 0.5s ease" }} />
                </Box>
              </Box>
            );
          })}
        </Paper>

        {/* Group vs Personal */}
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <PieChart sx={{ color: "#8950FC" }} /> Group vs Personal
          </Typography>
          {groups.length > 0 && (
            <TextField select size="small" label="Group" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} fullWidth sx={{ mb: 2 }}>
              {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
            </TextField>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={500}>Personal Expenses</Typography>
              <Typography variant="body1" fontWeight={700}>{formatCurrency(totalExpense)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, bgcolor: "action.hover", borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={500}>Group Expenses</Typography>
              <Typography variant="body1" fontWeight={700}>{formatCurrency(groupTotal)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, bgcolor: "#6C63FF08", borderRadius: 2, border: "1px solid", borderColor: "#6C63FF20" }}>
              <Typography variant="body2" fontWeight={600}>Combined Total</Typography>
              <Typography variant="body1" fontWeight={800} color="primary">{formatCurrency(totalExpense + groupTotal)}</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Contribution vs Usage Analysis */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, gridColumn: { md: "1 / -1" } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, display: "flex", alignItems: "center", gap: 1 }}>
            <BarChartIcon sx={{ color: "#FFB822" }} /> Contribution vs Usage Analysis
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Pool member contributions compared to actual usage
          </Typography>
          {!selectedGroup ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>Select a group above to see contribution analysis</Typography>
          ) : contributionData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>No pool data for this group</Typography>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
              {contributionData.map((m) => {
                const maxVal = Math.max(m.contributed, m.used, 1);
                return (
                  <Paper key={m.name} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: "#6C63FF", fontSize: 12 }}>{m.name.charAt(0).toUpperCase()}</Avatar>
                      <Typography variant="body2" fontWeight={600}>{m.name}</Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
                        <Typography variant="caption" color="text.secondary">Contributed</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#1DC9B7" }}>{formatCurrency(m.contributed)}</Typography>
                      </Box>
                      <Box sx={{ height: 6, bgcolor: "action.hover", borderRadius: 3, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${(m.contributed / maxVal) * 100}%`, bgcolor: "#1DC9B7", borderRadius: 3 }} />
                      </Box>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
                        <Typography variant="caption" color="text.secondary">Used</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: "#FD397A" }}>{formatCurrency(m.used)}</Typography>
                      </Box>
                      <Box sx={{ height: 6, bgcolor: "action.hover", borderRadius: 3, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${(m.used / maxVal) * 100}%`, bgcolor: "#FD397A", borderRadius: 3 }} />
                      </Box>
                    </Box>
                    <Chip
                      label={m.net >= 0 ? `Refund: ${formatCurrency(m.net)}` : `Owes: ${formatCurrency(Math.abs(m.net))}`}
                      size="small"
                      sx={{ mt: 0.5, fontWeight: 700, bgcolor: m.net >= 0 ? "#1DC9B715" : "#FD397A15", color: m.net >= 0 ? "#1DC9B7" : "#FD397A" }}
                    />
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
