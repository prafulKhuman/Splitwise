"use client";
import { useState } from "react";
import {
  Box, Paper, Typography, Button, Chip, Avatar, TextField, MenuItem,
  LinearProgress, IconButton, Divider,
} from "@mui/material";
import { Add, CheckCircle, Cancel, Archive, AccountBalanceWallet, NotificationsActive } from "@mui/icons-material";
import { useGroups } from "@/hooks/useGroups";
import { useMonthlyPool } from "@/hooks/useMonthlyPool";
import { useAuth } from "@/context/AuthProvider";
import PoolExpenseForm from "@/components/groups/PoolExpenseForm";
import SettlementCard from "@/components/groups/SettlementCard";
import { calculatePoolSettlements, formatCurrency, getMonthLabel } from "@/lib/settlements";
import PageSkeleton from "@/components/PageSkeleton";
import NoData from "@/components/NoData";

export default function PoolPage() {
  const { user } = useAuth();
  const { groups, loading: gLoading } = useGroups();
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [createAmount, setCreateAmount] = useState("");
  const [expenseOpen, setExpenseOpen] = useState(false);

  const groupId = selectedGroup || groups[0]?.id || null;
  const { currentPool, archivedPools, loading: pLoading, createPool, markContribution, addPoolExpense, closePool, getPoolBalance, getMemberBalance, sendContributionReminders } = useMonthlyPool(groupId);
  const group = groups.find((g) => g.id === groupId);

  if (gLoading) return <PageSkeleton variant="dashboard" />;

  if (groups.length === 0) {
    return <NoData message="No groups yet" sub="Create a group first to use the monthly pool feature." />;
  }

  const pool = currentPool;
  const settlements = pool && group ? calculatePoolSettlements(pool, group.members) : [];

  return (
    <>
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField select size="small" label="Select Group" value={groupId || ""} onChange={(e) => setSelectedGroup(e.target.value)} sx={{ minWidth: 200 }}>
          {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
        </TextField>
      </Box>

      {!pool ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <AccountBalanceWallet sx={{ fontSize: 48, color: "#B5B5C3", mb: 1 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>No Active Pool</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Create a monthly pool for this group</Typography>
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", alignItems: "center" }}>
            <TextField size="small" label="Contribution per member (₹)" type="number" value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} sx={{ width: 220 }} />
            <Button variant="contained" onClick={() => { if (createAmount && group) { createPool(Number(createAmount), group.members); setCreateAmount(""); } }}
              sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
              Create Pool
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          {/* Pool Overview */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 2 }}>
            <Paper sx={{ p: 2.5, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>POOL BALANCE</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: getPoolBalance(pool) >= 0 ? "#1DC9B7" : "#FD397A" }}>
                {formatCurrency(getPoolBalance(pool))}
              </Typography>
              <Typography variant="caption" color="text.secondary">{getMonthLabel(pool.month)}</Typography>
            </Paper>
            <Paper sx={{ p: 2.5, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>TOTAL CONTRIBUTED</Typography>
              <Typography variant="h5" fontWeight={800} color="primary">
                {formatCurrency(pool.contributions.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0))}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pool.contributions.filter((c) => c.paid).length}/{pool.contributions.length} paid
              </Typography>
            </Paper>
            <Paper sx={{ p: 2.5, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>TOTAL SPENT</Typography>
              <Typography variant="h5" fontWeight={800} sx={{ color: "#FD397A" }}>
                {formatCurrency(pool.expenses.reduce((s, e) => s + e.amount, 0))}
              </Typography>
              <Typography variant="caption" color="text.secondary">{pool.expenses.length} expenses</Typography>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
            {/* Contributions */}
            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Contributions (₹{pool.contribution_amount}/person)</Typography>
              {pool.contributions.map((c) => (
                <Box key={c.uid} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid #F1F1F4" }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: c.paid ? "#1DC9B7" : "#B5B5C3", fontSize: 14 }}>
                    {c.displayName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{c.displayName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Balance: {formatCurrency(getMemberBalance(pool, c.uid))}
                    </Typography>
                  </Box>
                  <Chip label={c.paid ? "Paid" : "Pending"} size="small"
                    icon={c.paid ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
                    sx={{ fontWeight: 600, bgcolor: c.paid ? "#1DC9B715" : "#FFB82215", color: c.paid ? "#1DC9B7" : "#FFB822" }} />
                  {group && groups.find((g) => g.id === groupId)?.created_by === user?.uid && (
                    <IconButton size="small" onClick={() => markContribution(pool.id, c.uid, !c.paid)}>
                      {c.paid ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" sx={{ color: "#1DC9B7" }} />}
                    </IconButton>
                  )}
                </Box>
              ))}
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate"
                  value={(pool.contributions.filter((c) => c.paid).length / pool.contributions.length) * 100}
                  sx={{ height: 8, borderRadius: 4, bgcolor: "#F2F3F8", "& .MuiLinearProgress-bar": { borderRadius: 4, background: "linear-gradient(90deg, #1DC9B7, #4DD9CB)" } }} />
              </Box>
            </Paper>

            {/* Settlements */}
            <SettlementCard settlements={settlements} title="Pool Settlements" />
          </Box>

          {/* Pool Expenses */}
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Pool Expenses</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setExpenseOpen(true)}
                  sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
                  Add
                </Button>
                <Button variant="outlined" size="small" startIcon={<NotificationsActive />}
                  onClick={() => sendContributionReminders(pool.id)} color="info">
                  Remind
                </Button>
                <Button variant="outlined" size="small" startIcon={<Archive />} onClick={() => closePool(pool.id)} color="warning">
                  Close Month
                </Button>
              </Box>
            </Box>
            {pool.expenses.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>No expenses yet</Typography>
            ) : (
              pool.expenses.map((exp) => (
                <Box key={exp.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, borderBottom: "1px solid #F1F1F4" }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{exp.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {exp.date} · {exp.participants.length}/{pool.contributions.length} members
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#FD397A" }}>
                    {formatCurrency(exp.amount)}
                  </Typography>
                </Box>
              ))
            )}
          </Paper>

          {/* Archived Pools */}
          {archivedPools.length > 0 && (
            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Archived Months</Typography>
              {archivedPools.map((ap) => (
                <Box key={ap.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1, borderBottom: "1px solid #F1F1F4" }}>
                  <Typography variant="body2" fontWeight={600}>{getMonthLabel(ap.month)}</Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Chip label={`${ap.expenses.length} expenses`} size="small" />
                    <Chip label={formatCurrency(ap.expenses.reduce((s, e) => s + e.amount, 0))} size="small" sx={{ fontWeight: 700 }} />
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </>
      )}

      {group && (
        <PoolExpenseForm open={expenseOpen} onClose={() => setExpenseOpen(false)}
          onSave={(data) => pool && addPoolExpense(pool.id, data)} members={group.members} />
      )}
    </>
  );
}
