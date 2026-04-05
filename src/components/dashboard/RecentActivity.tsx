"use client";
import { Box, Paper, Typography, Chip } from "@mui/material";
import { Transaction } from "@/lib/types";

const CAT_COLORS: Record<string, string> = {
  Food: "#1DC9B7", Transport: "#3699FF", Shopping: "#FF6B8A",
  Bills: "#FFB822", Entertainment: "#6C63FF", Health: "#F64E60", Other: "#8950FC",
  Salary: "#1DC9B7", Freelance: "#36B37E", Investment: "#6C63FF",
};

type Props = { expenses: Transaction[] };

export default function RecentActivity({ expenses }: Props) {
  const recent = expenses.slice(0, 6);

  const getRelativeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, height: "100%" }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Recent Activity</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>Latest transactions</Typography>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {recent.map((exp, i) => {
          const isIncome = exp.type === "income";
          const color = CAT_COLORS[exp.category] || "#8950FC";
          return (
            <Box key={exp.id} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, borderBottom: i < recent.length - 1 ? "1px solid #F1F1F4" : "none" }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: isIncome ? "#1DC9B7" : color, boxShadow: `0 0 0 3px ${isIncome ? "#1DC9B7" : color}25` }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{exp.title}</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                  <Chip label={exp.category} size="small"
                    sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: `${color}15`, color, "& .MuiChip-label": { px: 1 } }} />
                  <Typography variant="caption" color="text.secondary">{getRelativeDate(exp.date)}</Typography>
                </Box>
              </Box>
              <Typography variant="body2" fontWeight={700} sx={{ color: isIncome ? "#1DC9B7" : "#FD397A", whiteSpace: "nowrap" }}>
                {isIncome ? "+" : "-"}₹{exp.amount.toFixed(2)}
              </Typography>
            </Box>
          );
        })}
        {recent.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>No recent activity</Typography>
        )}
      </Box>
    </Paper>
  );
}
