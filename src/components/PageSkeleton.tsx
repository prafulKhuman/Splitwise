"use client";
import { Box, Skeleton, Paper } from "@mui/material";

type Props = { variant?: "dashboard" | "table" | "cards" | "reports" };

export default function PageSkeleton({ variant = "dashboard" }: Props) {
  if (variant === "dashboard") {
    return (
      <Box>
        {/* Summary cards skeleton */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2.5, mb: 2.5 }}>
          {[...Array(4)].map((_, i) => (
            <Paper key={i} sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Box sx={{ flex: 1 }}>
                  <Skeleton width={80} height={14} sx={{ mb: 1 }} />
                  <Skeleton width={120} height={32} sx={{ mb: 0.5 }} />
                  <Skeleton width={100} height={12} />
                </Box>
                <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 2 }} />
              </Box>
            </Paper>
          ))}
        </Box>
        {/* Charts skeleton */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2.5, mb: 2.5 }}>
          <Paper sx={{ p: 3 }}>
            <Skeleton width={150} height={22} sx={{ mb: 0.5 }} />
            <Skeleton width={120} height={14} sx={{ mb: 3 }} />
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 180 }}>
              {[60, 80, 45, 90, 70, 100].map((h, i) => (
                <Skeleton key={i} variant="rounded" sx={{ flex: 1, height: `${h}%`, borderRadius: "6px 6px 2px 2px" }} />
              ))}
            </Box>
          </Paper>
          <Paper sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Skeleton width={130} height={22} sx={{ mb: 0.5, alignSelf: "flex-start" }} />
            <Skeleton width={80} height={14} sx={{ mb: 2, alignSelf: "flex-start" }} />
            <Skeleton variant="circular" width={150} height={150} sx={{ mb: 2 }} />
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
              {[...Array(3)].map((_, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Skeleton variant="circular" width={10} height={10} />
                  <Skeleton width={60} height={14} />
                  <Skeleton width={40} height={14} />
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
        {/* Bottom row skeleton */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
          {[...Array(2)].map((_, i) => (
            <Paper key={i} sx={{ p: 3 }}>
              <Skeleton width={140} height={22} sx={{ mb: 0.5 }} />
              <Skeleton width={100} height={14} sx={{ mb: 2.5 }} />
              {[...Array(4)].map((_, j) => (
                <Box key={j} sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Skeleton width={80} height={14} />
                  <Skeleton width={60} height={14} />
                </Box>
              ))}
            </Paper>
          ))}
        </Box>
      </Box>
    );
  }

  if (variant === "table") {
    return (
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2.5 }}>
          <Skeleton variant="rounded" width={200} height={40} />
          <Skeleton variant="rounded" width={150} height={40} />
        </Box>
        <Paper sx={{ overflow: "hidden" }}>
          <Box sx={{ p: 0 }}>
            <Skeleton variant="rectangular" height={48} sx={{ mb: 0.5 }} />
            {[...Array(6)].map((_, i) => (
              <Box key={i} sx={{ display: "flex", gap: 2, px: 2, py: 1.5, borderBottom: "1px solid #F1F1F4" }}>
                <Skeleton width="25%" height={20} />
                <Skeleton width="15%" height={20} />
                <Skeleton variant="rounded" width={70} height={24} sx={{ borderRadius: 3 }} />
                <Skeleton width="15%" height={20} />
                <Skeleton width="10%" height={20} />
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    );
  }

  if (variant === "cards") {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
        {[...Array(6)].map((_, i) => (
          <Paper key={i} sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width={80} height={14} sx={{ mb: 0.5 }} />
              <Skeleton width={100} height={28} />
            </Box>
            <Skeleton variant="rounded" width={60} height={24} sx={{ borderRadius: 1 }} />
          </Paper>
        ))}
      </Box>
    );
  }

  if (variant === "reports") {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
        {[...Array(2)].map((_, i) => (
          <Paper key={i} sx={{ p: 3 }}>
            <Skeleton width={180} height={22} sx={{ mb: 2 }} />
            {[...Array(5)].map((_, j) => (
              <Box key={j} sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                  <Skeleton width={80} height={14} />
                  <Skeleton width={100} height={14} />
                </Box>
                <Skeleton variant="rounded" height={8} sx={{ borderRadius: 4 }} />
              </Box>
            ))}
          </Paper>
        ))}
      </Box>
    );
  }

  return null;
}
