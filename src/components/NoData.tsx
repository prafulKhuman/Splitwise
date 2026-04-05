"use client";
import { Box, Typography, Paper } from "@mui/material";
import { InboxOutlined } from "@mui/icons-material";

type Props = { message?: string; sub?: string };

export default function NoData({ message = "No data found", sub = "Start adding data to see it here." }: Props) {
  return (
    <Paper sx={{ py: 8, px: 3, textAlign: "center" }}>
      <Box
        sx={{
          width: 80, height: 80, borderRadius: "50%",
          bgcolor: "#F2F3F8", display: "flex", alignItems: "center",
          justifyContent: "center", mx: "auto", mb: 2,
        }}
      >
        <InboxOutlined sx={{ fontSize: 40, color: "#B5B5C3" }} />
      </Box>
      <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
        {message}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mx: "auto" }}>
        {sub}
      </Typography>
    </Paper>
  );
}
