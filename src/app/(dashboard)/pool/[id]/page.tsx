"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Paper, Typography, Button, Chip, Avatar, IconButton,
  LinearProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import {
  ArrowBack, CheckCircle, Cancel, Archive, Delete,
  NotificationsActive, Add, Lock, WarningAmber,
} from "@mui/icons-material";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider";
import { useGroups } from "@/hooks/useGroups";
import { useMonthlyPool } from "@/hooks/useMonthlyPool";
import { formatCurrency, getMonthLabel, calculatePoolSettlements } from "@/lib/settlements";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import PoolExpenseForm from "@/components/groups/PoolExpenseForm";
import SettlementCard from "@/components/groups/SettlementCard";
import PageSkeleton from "@/components/PageSkeleton";
import NoData from "@/components/NoData";

export default function PoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const poolId = params.id as string;
  const { user } = useAuth();
  const { groups, loading: gLoading } = useGroups();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Resolve groupId by directly fetching the pool doc
  const [groupId, setGroupId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (!poolId) return;
    let cancelled = false;
    const resolve = async () => {
      try {
        const snap = await getDoc(doc(db, "monthly_pools", poolId));
        if (!cancelled) {
          if (snap.exists()) {
            setGroupId(snap.data().group_id);
          }
          setResolving(false);
        }
      } catch {
        if (!cancelled) setResolving(false);
      }
    };
    resolve();
    return () => { cancelled = true; };
  }, [poolId]);

  const { pools, loading: pLoading, markContribution, addPoolExpense, closePool, deletePool, getPoolBalance, getMemberBalance, sendContributionReminders } = useMonthlyPool(groupId);

  const pool = pools.find((p) => p.id === poolId);
  const group = groups.find((g) => g.id === groupId);
  const isAdmin = group?.created_by === user?.uid;
  const isActive = pool?.is_active ?? false;

  if (gLoading || resolving || pLoading) return <PageSkeleton variant="dashboard" />;
  if (!pool) return <NoData message="Pool not found" sub="This pool may have been deleted." />;

  const settlements = group ? calculatePoolSettlements(pool, group.members) : [];
  const paidCount = pool.contributions.filter((c) => c.paid).length;
  const totalMembers = pool.contributions.length;
  const totalContributed = pool.contributions.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);
  const totalSpent = pool.expenses.reduce((s, e) => s + e.amount, 0);

  const handleClose = async () => {
    await closePool(pool.id);
  };

  const handleHardDelete = async () => {
    setDeleteDialogOpen(false);
    await deletePool(pool.id);
    router.push("/pool");
  };

  return (
    <>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton component={Link} href="/pool" size="small"><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            {group?.name || "Pool"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {getMonthLabel(pool.month)} • {isActive ? "Active" : "Closed"}
          </Typography>
        </Box>
        {isActive && isAdmin && (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button variant="outlined" size="small" onClick={() => sendContributionReminders(pool.id)}
              color="info" sx={{ minWidth: "auto", px: 1.5 }}>
              <NotificationsActive sx={{ fontSize: 18 }} />
            </Button>
            <Button variant="outlined" size="small" onClick={handleClose}
              color="warning" sx={{ minWidth: "auto", px: 1.5 }}>
              <Archive sx={{ fontSize: 18 }} />
            </Button>
          </Box>
        )}
        {!isActive && isAdmin && (
          <Button variant="outlined" size="small" color="error" startIcon={<Delete />}
            onClick={() => setDeleteDialogOpen(true)} sx={{ textTransform: "none" }}>
            Delete
          </Button>
        )}
      </Box>

      {/* Hard Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "#FD397A12", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <WarningAmber sx={{ color: "#FD397A" }} />
          </Box>
          Delete Pool Permanently
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete this pool for <strong>{getMonthLabel(pool.month)}</strong>? All contribution records and expenses will be removed. This action <strong>cannot be undone</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleHardDelete} disableElevation
            sx={{ textTransform: "none", borderRadius: 1.5 }}>
            Delete Forever
          </Button>
        </DialogActions>
      </Dialog>

      {/* Closed banner */}
      {!isActive && (
        <Alert severity="info" icon={<Lock />} sx={{ mb: 2 }}>
          This pool is closed and in read-only mode.
        </Alert>
      )}

      {/* Status chip */}
      <Box sx={{ mb: 2 }}>
        <Chip label={isActive ? "Active" : "Closed"} size="small"
          sx={{ fontWeight: 700, bgcolor: isActive ? "#1DC9B715" : "#B5B5C315", color: isActive ? "#1DC9B7" : "#B5B5C3" }} />
      </Box>

      {/* Overview Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 2 }}>
        <Paper sx={{ p: 2.5, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>POOL BALANCE</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ color: getPoolBalance(pool) >= 0 ? "#1DC9B7" : "#FD397A" }}>
            {formatCurrency(getPoolBalance(pool))}
          </Typography>
          <Typography variant="caption" color="text.secondary">₹{pool.contribution_amount}/person</Typography>
        </Paper>
        <Paper sx={{ p: 2.5, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>COLLECTED</Typography>
          <Typography variant="h5" fontWeight={800} color="primary">
            {formatCurrency(totalContributed)}
          </Typography>
          <Typography variant="caption" color="text.secondary">{paidCount}/{totalMembers} received</Typography>
        </Paper>
        <Paper sx={{ p: 2.5, textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>SPENT</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ color: "#FD397A" }}>
            {formatCurrency(totalSpent)}
          </Typography>
          <Typography variant="caption" color="text.secondary">{pool.expenses.length} expenses</Typography>
        </Paper>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
        {/* Members & Contributions */}
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Members ({totalMembers})
          </Typography>
          {pool.contributions.map((c) => (
            <Box key={c.uid} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid #F1F1F4" }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: c.paid ? "#1DC9B7" : "#B5B5C3", fontSize: 14 }}>
                {c.displayName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {c.displayName} {c.uid === user?.uid && "(You)"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(c.amount)} • {c.paid && c.paid_at ? `Received ${new Date(c.paid_at).toLocaleDateString()}` : "Pending"}
                </Typography>
              </Box>
              <Chip label={c.paid ? "Received" : "Pending"} size="small"
                icon={c.paid ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
                sx={{ fontWeight: 600, bgcolor: c.paid ? "#1DC9B715" : "#FFB82215", color: c.paid ? "#1DC9B7" : "#FFB822" }} />
              {isActive && isAdmin && (
                <IconButton size="small" onClick={() => markContribution(pool.id, c.uid, !c.paid)}>
                  {c.paid ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" sx={{ color: "#1DC9B7" }} />}
                </IconButton>
              )}
            </Box>
          ))}
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={(paidCount / totalMembers) * 100}
              sx={{ height: 8, borderRadius: 4, bgcolor: "#F2F3F8", "& .MuiLinearProgress-bar": { borderRadius: 4, background: "linear-gradient(90deg, #1DC9B7, #4DD9CB)" } }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", textAlign: "center" }}>
              {paidCount} of {totalMembers} members paid
            </Typography>
          </Box>
        </Paper>

        {/* Settlements */}
        <SettlementCard settlements={settlements} title="Pool Settlements" />
      </Box>

      {/* Pool Expenses */}
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>Pool Expenses</Typography>
          {isActive && isAdmin && (
            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setExpenseOpen(true)}
              sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
              Add
            </Button>
          )}
        </Box>
        {pool.expenses.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>No expenses yet</Typography>
        ) : (
          pool.expenses.map((exp) => (
            <Box key={exp.id} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, borderBottom: "1px solid #F1F1F4" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" fontWeight={600}>{exp.title}</Typography>
                  {exp.category && <Chip label={exp.category} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 600 }} />}
                  {exp.split_method && exp.split_method !== "equal" && (
                    <Chip label={exp.split_method} size="small" variant="outlined" sx={{ height: 18, fontSize: 9, fontWeight: 600, textTransform: "capitalize" }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {exp.date} · {exp.paid_by_name || "Unknown"} · {exp.participants.length}/{totalMembers} members
                </Typography>
                {exp.notes && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2 }}>{exp.notes}</Typography>}
              </Box>
              <Typography variant="body2" fontWeight={700} sx={{ color: "#FD397A", flexShrink: 0, ml: 1 }}>
                {formatCurrency(exp.amount)}
              </Typography>
            </Box>
          ))
        )}
      </Paper>

      {isActive && group && (
        <PoolExpenseForm open={expenseOpen} onClose={() => setExpenseOpen(false)}
          onSave={(data) => addPoolExpense(pool.id, data)} members={group.members} />
      )}
    </>
  );
}
