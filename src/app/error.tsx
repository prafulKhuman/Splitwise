"use client";
import { Box, Typography, Button, Paper } from "@mui/material";
import { ErrorOutline, Refresh, Home } from "@mui/icons-material";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f5",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          p: 5,
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #ef5350, #f44336, #e53935)",
          }}
        />

        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "#ffebee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
          }}
        >
          <ErrorOutline sx={{ fontSize: 44, color: "#e53935" }} />
        </Box>

        <Typography variant="h4" fontWeight={700} gutterBottom>
          Oops!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, px: 2 }}>
          {error.message || "An unexpected error occurred. Please try again or go back to the home page."}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<Refresh />}
            onClick={reset}
            sx={{ borderRadius: 3, px: 3, textTransform: "none", fontWeight: 600 }}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            startIcon={<Home />}
            href="/"
            sx={{ borderRadius: 3, px: 3, textTransform: "none", fontWeight: 600 }}
          >
            Go Home
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
