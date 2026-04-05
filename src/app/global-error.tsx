"use client";
import { Box, Typography, Button } from "@mui/material";
import { ReportProblem, Refresh } from "@mui/icons-material";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Roboto, sans-serif" }}>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #fce4ec 0%, #fff3e0 100%)",
            p: 3,
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              bgcolor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 3,
              boxShadow: 3,
            }}
          >
            <ReportProblem sx={{ fontSize: 52, color: "#e65100" }} />
          </Box>

          <Typography variant="h4" fontWeight={700} gutterBottom>
            Critical Error
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1, textAlign: "center", maxWidth: 400 }}>
            The application encountered a critical error and couldn&apos;t recover automatically.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, textAlign: "center", maxWidth: 400 }}>
            {error.message || "Please try refreshing the page."}
          </Typography>

          <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<Refresh />}
            onClick={reset}
            sx={{ borderRadius: 3, px: 4, textTransform: "none", fontWeight: 600 }}
          >
            Refresh Page
          </Button>
        </Box>
      </body>
    </html>
  );
}
