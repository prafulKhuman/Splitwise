"use client";
import { Box, Paper, Typography } from "@mui/material";
import { Transaction } from "@/lib/types";

const COLORS = ["#6C63FF", "#FF6B8A", "#1DC9B7", "#FFB822", "#8950FC", "#F64E60", "#3699FF"];

type Props = { expenses: Transaction[] };

export default function CategoryDonut({ expenses }: Props) {
  const expOnly = expenses.filter((e) => e.type !== "income");
  const total = expOnly.reduce((s, e) => s + e.amount, 0);
  const breakdown = Object.entries(
    expOnly.reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] || 0) + e.amount }), {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const r = 60, c = 2 * Math.PI * r;
  let cumOffset = 0;

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Expense Breakdown</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>By category</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, sm: 3 }, flexWrap: "wrap", justifyContent: "center" }}>
        <Box sx={{ position: "relative", width: { xs: 120, sm: 150 }, height: { xs: 120, sm: 150 }, flexShrink: 0 }}>
          <svg width="100%" height="100%" viewBox="0 0 150 150">
            <circle cx="75" cy="75" r={r} fill="none" stroke="#F2F3F8" strokeWidth="18" />
            {breakdown.map(([, amount], i) => {
              const pct = total > 0 ? amount / total : 0;
              const dash = pct * c;
              const seg = (
                <circle key={i} cx="75" cy="75" r={r} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="18"
                  strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-cumOffset} transform="rotate(-90 75 75)"
                  style={{ transition: "all 0.8s ease" }} />
              );
              cumOffset += dash;
              return seg;
            })}
          </svg>
          <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>₹{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>Total</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {breakdown.slice(0, 5).map(([cat, amount], i) => (
            <Box key={cat} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: COLORS[i % COLORS.length], flexShrink: 0 }} />
              <Typography variant="caption" sx={{ minWidth: 70 }}>{cat}</Typography>
              <Typography variant="caption" fontWeight={700}>₹{amount.toFixed(0)}</Typography>
            </Box>
          ))}
          {breakdown.length === 0 && <Typography variant="caption" color="text.secondary">No data</Typography>}
        </Box>
      </Box>
    </Paper>
  );
}
