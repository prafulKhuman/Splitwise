"use client";
import { Box, Paper, Typography } from "@mui/material";
import { Transaction } from "@/lib/types";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Props = { expenses: Transaction[] };

export default function WeeklyTrend({ expenses }: Props) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const dailyTotals = DAY_LABELS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = d.toISOString().split("T")[0];
    return expenses.filter((e) => e.date === ds && e.type !== "income").reduce((s, e) => s + e.amount, 0);
  });

  const max = Math.max(...dailyTotals, 1);
  const weekTotal = dailyTotals.reduce((s, v) => s + v, 0);

  const w = 280, h = 100, px = 10;
  const usableW = w - px * 2;
  const points = dailyTotals.map((v, i) => ({
    x: px + (i / 6) * usableW,
    y: h - 10 - (v / max) * (h - 25),
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[6].x} ${h - 5} L ${points[0].x} ${h - 5} Z`;

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>This Week</Typography>
          <Typography variant="caption" color="text.secondary">Daily spending trend</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>₹{weekTotal.toFixed(0)}</Typography>
          <Typography variant="caption" color="text.secondary">total</Typography>
        </Box>
      </Box>
      <svg width="100%" viewBox={`0 0 ${w} ${h + 20}`} style={{ overflow: "visible", maxWidth: "100%" }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6C63FF" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />
        <path d={linePath} fill="none" stroke="#6C63FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#6C63FF" strokeWidth="2" />
            <text x={p.x} y={h + 15} textAnchor="middle" fontSize="10" fill="#B5B5C3" fontWeight="500">{DAY_LABELS[i]}</text>
          </g>
        ))}
      </svg>
    </Paper>
  );
}
