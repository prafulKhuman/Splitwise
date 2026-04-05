"use client";
import { Box, Paper, Typography, LinearProgress } from "@mui/material";
import { Transaction } from "@/lib/types";

const COLORS = ["#6C63FF", "#FF6B8A", "#1DC9B7", "#FFB822", "#8950FC", "#F64E60", "#3699FF"];

type Props = { expenses: Transaction[] };

export default function CategoryProgress({ expenses }: Props) {
  const expOnly = expenses.filter((e) => e.type !== "income");
  const total = expOnly.reduce((s, e) => s + e.amount, 0);
  const breakdown = Object.entries(
    expOnly.reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] || 0) + e.amount }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Category Breakdown</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>Spending distribution</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        {breakdown.map(([cat, amount], i) => {
          const pct = total > 0 ? (amount / total) * 100 : 0;
          const color = COLORS[i % COLORS.length];
          return (
            <Box key={cat}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
                  <Typography variant="body2" fontWeight={500}>{cat}</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" fontWeight={700}>₹{amount.toFixed(2)}</Typography>
                  <Typography variant="caption" sx={{ bgcolor: `${color}15`, color, px: 1, py: 0.2, borderRadius: 1, fontWeight: 700, fontSize: 11 }}>{pct.toFixed(0)}%</Typography>
                </Box>
              </Box>
              <LinearProgress variant="determinate" value={pct}
                sx={{ height: 8, borderRadius: 4, bgcolor: "#F2F3F8", "& .MuiLinearProgress-bar": { borderRadius: 4, background: `linear-gradient(90deg, ${color}, ${color}CC)` } }} />
            </Box>
          );
        })}
        {breakdown.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>No expenses yet</Typography>
        )}
      </Box>
    </Paper>
  );
}
