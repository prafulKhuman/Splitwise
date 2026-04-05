import { Box, Typography, Button, Paper } from "@mui/material";
import { SearchOff, Home } from "@mui/icons-material";

export default function NotFound() {
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
            background: "linear-gradient(90deg, #1976d2, #42a5f5, #90caf9)",
          }}
        />

        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "#e3f2fd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 3,
          }}
        >
          <SearchOff sx={{ fontSize: 44, color: "#1976d2" }} />
        </Box>

        <Typography variant="h1" fontWeight={800} color="primary" sx={{ fontSize: "5rem", lineHeight: 1 }}>
          404
        </Typography>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 1 }}>
          Page Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, px: 2 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </Typography>

        <Button
          variant="contained"
          startIcon={<Home />}
          href="/"
          sx={{ borderRadius: 3, px: 4, textTransform: "none", fontWeight: 600 }}
        >
          Back to Home
        </Button>
      </Paper>
    </Box>
  );
}
