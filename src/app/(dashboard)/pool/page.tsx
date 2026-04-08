"use client";
import {
  Box, Paper, Typography, Chip, Avatar, AvatarGroup, LinearProgress,
} from "@mui/material";
import { Savings, ArrowForward, CheckCircle, Schedule } from "@mui/icons-material";
import Link from "next/link";
import { useGroups } from "@/hooks/useGroups";
import { useAllPools } from "@/hooks/useAllPools";
import { formatCurrency, getMonthLabel, getCurrentMonth } from "@/lib/settlements";
import PageSkeleton from "@/components/PageSkeleton";
import NoData from "@/components/NoData";

export default function PoolPage() {
  const { groups, loading: gLoading } = useGroups();
  const { pools, loading: pLoading } = useAllPools(groups);

  if (gLoading || pLoading) return <PageSkeleton variant="cards" />;

  if (groups.length === 0) {
    return <NoData message="No groups yet" sub="Create a group first to use the monthly pool feature." />;
  }

  if (pools.length === 0) {
    return (
      <>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Monthly Pools</Typography>
        <NoData message="No pools yet" sub="Go to a group and create a monthly pool to get started." />
      </>
    );
  }

  const currentMonth = getCurrentMonth();
  const activePools = pools.filter((p) => p.is_active && p.month === currentMonth);
  const pastPools = pools.filter((p) => !activePools.includes(p));

  return (
    <>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Monthly Pools</Typography>

      {/* Active Pools */}
      {activePools.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 1.5 }}>
            Active This Month
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
            {activePools.map((pool) => {
              const paid = pool.contributions.filter((c) => c.paid).length;
              const total = pool.contributions.length;
              const collected = pool.contributions.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);
              return (
                <Paper key={pool.id} component={Link} href={`/pool/${pool.id}`}
                  sx={{
                    p: { xs: 2, sm: 2.5 }, textDecoration: "none", color: "inherit",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" },
                    display: "flex", flexDirection: "column", gap: 1.5,
                  }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, background: "linear-gradient(135deg, #1DC9B7, #4DD9CB)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Savings sx={{ color: "#fff", fontSize: 22 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" fontWeight={700} noWrap>{pool.groupName}</Typography>
                      <Typography variant="caption" color="text.secondary">{getMonthLabel(pool.month)}</Typography>
                    </Box>
                    <ArrowForward sx={{ color: "#B5B5C3", fontSize: 20 }} />
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" fontWeight={800} color="primary">
                      {formatCurrency(collected)}
                    </Typography>
                    <Chip label="Active" size="small" icon={<Schedule sx={{ fontSize: 14 }} />}
                      sx={{ fontWeight: 600, bgcolor: "#1DC9B715", color: "#1DC9B7" }} />
                  </Box>

                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">₹{pool.contribution_amount}/person</Typography>
                      <Typography variant="caption" color="text.secondary">{paid}/{total} received</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={(paid / total) * 100}
                      sx={{ height: 6, borderRadius: 3, bgcolor: "#F2F3F8", "& .MuiLinearProgress-bar": { borderRadius: 3, background: "linear-gradient(90deg, #1DC9B7, #4DD9CB)" } }} />
                  </Box>

                  <AvatarGroup max={5} sx={{ justifyContent: "flex-start", "& .MuiAvatar-root": { width: 26, height: 26, fontSize: 11 } }}>
                    {pool.contributions.map((c) => (
                      <Avatar key={c.uid} sx={{ bgcolor: c.paid ? "#1DC9B7" : "#B5B5C3" }}>
                        {c.displayName.charAt(0).toUpperCase()}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                </Paper>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Past / Archived Pools */}
      {pastPools.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 1.5 }}>
            Past Pools
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
            {pastPools.map((pool) => {
              const paid = pool.contributions.filter((c) => c.paid).length;
              const total = pool.contributions.length;
              const totalSpent = pool.expenses.reduce((s, e) => s + e.amount, 0);
              return (
                <Paper key={pool.id} component={Link} href={`/pool/${pool.id}`}
                  sx={{
                    p: { xs: 2, sm: 2.5 }, textDecoration: "none", color: "inherit",
                    transition: "transform 0.2s, box-shadow 0.2s", opacity: pool.is_active ? 1 : 0.8,
                    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 15px rgba(0,0,0,0.08)" },
                    display: "flex", flexDirection: "column", gap: 1,
                  }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: "#F2F3F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Savings sx={{ color: "#B5B5C3", fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>{pool.groupName}</Typography>
                      <Typography variant="caption" color="text.secondary">{getMonthLabel(pool.month)}</Typography>
                    </Box>
                    <Chip label={pool.is_active ? "Active" : "Closed"} size="small"
                      sx={{ fontWeight: 600, fontSize: 10, height: 20, bgcolor: pool.is_active ? "#1DC9B715" : "#B5B5C315", color: pool.is_active ? "#1DC9B7" : "#B5B5C3" }} />
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">{paid}/{total} paid</Typography>
                    <Typography variant="caption" fontWeight={600}>{pool.expenses.length} expenses • {formatCurrency(totalSpent)}</Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        </Box>
      )}
    </>
  );
}
