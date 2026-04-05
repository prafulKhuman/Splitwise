"use client";
import { Box, Paper, Typography, Chip } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { Settlement } from "@/lib/types";
import { formatCurrency } from "@/lib/settlements";

type Props = { settlements: Settlement[]; title?: string };

export default function SettlementCard({ settlements, title = "Settlements" }: Props) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>{title}</Typography>
      {settlements.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
          All settled up! 🎉
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {settlements.map((s, i) => (
            <Box key={i} sx={{
              display: "flex", alignItems: "center", gap: 1, p: 1.5,
              bgcolor: "#F2F3F8", borderRadius: 2, flexWrap: "wrap",
            }}>
              <Chip label={s.fromName} size="small" sx={{ fontWeight: 600, bgcolor: "#FD397A15", color: "#FD397A" }} />
              <ArrowForward sx={{ fontSize: 16, color: "#B5B5C3" }} />
              <Chip label={s.toName} size="small" sx={{ fontWeight: 600, bgcolor: "#1DC9B715", color: "#1DC9B7" }} />
              <Typography variant="body2" fontWeight={700} sx={{ ml: "auto" }}>
                {formatCurrency(s.amount)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
