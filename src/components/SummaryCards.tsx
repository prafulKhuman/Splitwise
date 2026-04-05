"use client";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { AccountBalanceWallet, TrendingUp, TrendingDown, Receipt } from "@mui/icons-material";
import { Transaction } from "@/lib/types";

type Props = { expenses: Transaction[] };

const animKeyframes = `
@keyframes countUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function SummaryCards({ expenses }: Props) {
  const totalExpense = expenses.filter((e) => e.type !== "income").reduce((s, e) => s + e.amount, 0);
  const totalIncome = expenses.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const net = totalIncome - totalExpense;
  const thisMonth = expenses.filter((e) => {
    const d = new Date(e.date), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const cards = [
    {
      icon: <TrendingUp />, label: "Total Income", value: `₹${totalIncome.toFixed(2)}`,
      sub: `${expenses.filter((e) => e.type === "income").length} transactions`,
      gradient: "linear-gradient(135deg, #1DC9B7, #4DD9CB)",
    },
    {
      icon: <TrendingDown />, label: "Total Expenses", value: `₹${totalExpense.toFixed(2)}`,
      sub: `${expenses.filter((e) => e.type !== "income").length} transactions`,
      gradient: "linear-gradient(135deg, #FD397A, #FF6B8A)",
    },
    {
      icon: <AccountBalanceWallet />, label: "Net Balance", value: `₹${net.toFixed(2)}`,
      sub: net >= 0 ? "You're in profit" : "You're in loss",
      gradient: "linear-gradient(135deg, #6C63FF, #8B83FF)",
    },
    {
      icon: <Receipt />, label: "This Month", value: `${thisMonth.length}`,
      sub: `₹${thisMonth.reduce((s, e) => s + (e.type === "income" ? e.amount : -e.amount), 0).toFixed(2)} net`,
      gradient: "linear-gradient(135deg, #FFB822, #FFCF5C)",
    },
  ];

  return (
    <>
      <style>{animKeyframes}</style>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: { xs: 1.5, sm: 2.5 }, mb: 3 }}>
        {cards.map((c, i) => (
          <Card key={c.label} sx={{ overflow: "visible", transition: "transform 0.2s, box-shadow 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }, animation: `countUp 0.5s ease ${i * 0.1}s both` }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2.5 }, "&:last-child": { pb: { xs: 1.5, sm: 2.5 } } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: { xs: "0.6rem", sm: "0.75rem" } }}>{c.label}</Typography>
                  <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ mt: 0.5, lineHeight: 1.2, fontSize: { xs: "1rem", sm: "1.5rem" } }}>{c.value}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", fontSize: { xs: "0.6rem", sm: "0.75rem" } }}>{c.sub}</Typography>
                </Box>
                <Box sx={{ background: c.gradient, color: "#fff", borderRadius: 2, p: { xs: 0.8, sm: 1.2 }, display: "flex", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>{c.icon}</Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  );
}
