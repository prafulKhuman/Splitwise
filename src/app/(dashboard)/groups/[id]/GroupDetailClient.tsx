"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Paper, Typography, Button, Chip, Avatar, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, Divider, useMediaQuery, useTheme, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import {
  Add, Delete, PersonAdd, Settings, ArrowBack, Download,
  Savings, Close, CheckCircle, Cancel, ArrowForward, Lock, Schedule,
  Archive, RestoreFromTrash, DeleteForever, WarningAmber,
} from "@mui/icons-material";
import Link from "next/link";
import { useGroups } from "@/hooks/useGroups";
import { useGroupTransactions } from "@/hooks/useGroupTransactions";
import { useMonthlyPool } from "@/hooks/useMonthlyPool";
import { useAuth } from "@/context/AuthProvider";
import GroupExpenseForm from "@/components/groups/GroupExpenseForm";
import AddMemberDialog from "@/components/groups/AddMemberDialog";
import CreatePoolDialog from "@/components/groups/CreatePoolDialog";
import SettlementCard from "@/components/groups/SettlementCard";
import { calculateSettlements, formatCurrency, getCurrentMonth, getMonthLabel } from "@/lib/settlements";
import { exportGroupTransactionsCSV } from "@/lib/export";
import PageSkeleton from "@/components/PageSkeleton";

export default function GroupDetailClient() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { user } = useAuth();
  const { groups, isAdmin, canAdd, canEdit, addMember, removeMember, updateSettings, archiveGroup, restoreGroup, deleteGroup } = useGroups();
  const { transactions, loading: txLoading, addTransaction, updateTransaction, deleteTransaction } = useGroupTransactions(groupId);
  const { pools, createPool } = useMonthlyPool(groupId);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [poolDialogOpen, setPoolDialogOpen] = useState(false);
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const group = groups.find((g) => g.id === groupId);
  if (!group) return <PageSkeleton variant="dashboard" />;

  const admin = isAdmin(group);
  const isDisabled = group.is_disabled === true;
  const settlements = calculateSettlements(transactions, group.members);
  const hasActivePool = pools.some((p) => p.is_active);

  const handleCreatePool = async (amount: number) => {
    const poolId = await createPool(amount, group.members);
    if (poolId) {
      setPoolDialogOpen(false);
      router.push(`/pool/${poolId}`);
    }
  };

  const memberBalances = group.members.map((m) => {
    const paid = transactions.filter((t) => t.paid_by === m.uid).reduce((s, t) => s + t.amount, 0);
    const owes = transactions.reduce((s, t) => s + (t.participants.find((p) => p.uid === m.uid)?.amount || 0), 0);
    return { ...m, paid, owes, net: paid - owes };
  });

  const handleArchive = async () => {
    setSettingsOpen(false);
    await archiveGroup(groupId);
  };

  const handleRestore = async () => {
    await restoreGroup(groupId);
  };

  const handleHardDelete = async () => {
    setHardDeleteConfirm(false);
    setSettingsOpen(false);
    await deleteGroup(groupId);
    router.push("/groups");
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton component={Link} href="/groups" size="small"><ArrowBack /></IconButton>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1, opacity: isDisabled ? 0.5 : 1 }}>{group.name}</Typography>
        {isDisabled && admin && (
          <Button variant="contained" size="small" startIcon={<RestoreFromTrash />}
            onClick={handleRestore}
            sx={{ textTransform: "none", background: "linear-gradient(135deg, #1DC9B7, #4DD9CB)", mr: 0.5 }}>
            Restore
          </Button>
        )}
        {admin && (
          <IconButton onClick={() => setSettingsOpen(true)} size="small" sx={{ color: "text.secondary" }}>
            <Settings />
          </IconButton>
        )}
      </Box>

      {/* Disabled banner */}
      {isDisabled && (
        <Alert severity="warning" icon={<Archive />} sx={{ mb: 2 }}>
          This group is archived. All features are disabled.{admin ? " Restore it from settings to re-enable." : ""}
        </Alert>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <Box sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)", px: 3, py: 2.5, color: "#fff" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Group Settings</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>{group.name}</Typography>
            </Box>
            <IconButton size="small" onClick={() => setSettingsOpen(false)} sx={{ color: "#fff", mt: -0.5, mr: -1 }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {/* Permissions */}
          <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1.2, fontSize: 10 }}>
            Permissions
          </Typography>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Paper variant="outlined" sx={{ px: 2, py: 1.2, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>Add Transactions</Typography>
                <Typography variant="caption" color="text.secondary">Allow members to add new transactions</Typography>
              </Box>
              <Switch checked={group.settings?.members_can_add ?? true} size="small"
                onChange={(e) => updateSettings(groupId, { ...group.settings, members_can_add: e.target.checked })} />
            </Paper>
            <Paper variant="outlined" sx={{ px: 2, py: 1.2, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>Edit Transactions</Typography>
                <Typography variant="caption" color="text.secondary">Allow members to edit or delete entries</Typography>
              </Box>
              <Switch checked={group.settings?.members_can_edit ?? false} size="small"
                onChange={(e) => updateSettings(groupId, { ...group.settings, members_can_edit: e.target.checked })} />
            </Paper>
          </Box>

          {/* Danger Zone */}
          <Typography variant="overline" color="error" fontWeight={700} sx={{ letterSpacing: 1.2, fontSize: 10, mt: 3, display: "block" }}>
            Danger Zone
          </Typography>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Soft Delete — Archive */}
            <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, borderColor: "warning.light", bgcolor: "#FFB82208" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Archive sx={{ fontSize: 16, color: "warning.main" }} />
                    <Typography variant="body2" fontWeight={600} color="warning.dark">
                      {isDisabled ? "Restore Group" : "Archive Group"}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {isDisabled ? "Re-enable this group and all its features" : "Disable all features but keep data intact"}
                  </Typography>
                </Box>
                <Button color={isDisabled ? "success" : "warning"} size="small" variant="contained" disableElevation
                  onClick={isDisabled ? () => { setSettingsOpen(false); handleRestore(); } : handleArchive}
                  sx={{ textTransform: "none", borderRadius: 1.5, minWidth: 80, fontSize: 12 }}>
                  {isDisabled ? "Restore" : "Archive"}
                </Button>
              </Box>
            </Paper>

            {/* Hard Delete — Permanent */}
            <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, borderColor: "error.light", bgcolor: "#FD397A08" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <DeleteForever sx={{ fontSize: 16, color: "error.main" }} />
                    <Typography variant="body2" fontWeight={600} color="error">Delete Permanently</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">Remove group and all data from system forever</Typography>
                </Box>
                <Button color="error" size="small" variant="contained" disableElevation
                  onClick={() => setHardDeleteConfirm(true)}
                  sx={{ textTransform: "none", borderRadius: 1.5, minWidth: 80, fontSize: 12 }}>
                  Delete
                </Button>
              </Box>
            </Paper>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation */}
      <Dialog open={hardDeleteConfirm} onClose={() => setHardDeleteConfirm(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "#FD397A12", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <WarningAmber sx={{ color: "#FD397A" }} />
          </Box>
          Permanently Delete Group
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete <strong>{group.name}</strong>? This will remove the group, all members, transactions, and pools. This action <strong>cannot be undone</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setHardDeleteConfirm(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleHardDelete} disableElevation
            sx={{ textTransform: "none", borderRadius: 1.5 }}>
            Delete Forever
          </Button>
        </DialogActions>
      </Dialog>

      {/* Content — disabled overlay when archived */}
      <Box sx={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? "none" : "auto" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Members ({group.members.length})</Typography>
              {admin && <Button size="small" startIcon={<PersonAdd />} onClick={() => setMemberOpen(true)}>Add</Button>}
            </Box>
            {memberBalances.map((m) => (
              <Box key={m.uid} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "#6C63FF", fontSize: 14 }}>{m.displayName.charAt(0).toUpperCase()}</Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {m.displayName} {m.uid === user?.uid && "(You)"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Paid: {formatCurrency(m.paid)} · Owes: {formatCurrency(m.owes)}
                  </Typography>
                </Box>
                <Chip label={m.net >= 0 ? `+${formatCurrency(m.net)}` : formatCurrency(m.net)} size="small"
                  sx={{ fontWeight: 700, bgcolor: m.net >= 0 ? "#1DC9B715" : "#FD397A15", color: m.net >= 0 ? "#1DC9B7" : "#FD397A" }} />
                {admin && m.uid !== user?.uid && (
                  <IconButton size="small" onClick={() => removeMember(groupId, m.uid)}><Delete fontSize="small" /></IconButton>
                )}
              </Box>
            ))}
          </Paper>

          <SettlementCard settlements={settlements} />
        </Box>

        {/* Pools Section */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Savings sx={{ color: "#6C63FF", fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={700}>Monthly Pools</Typography>
            </Box>
            {admin && !hasActivePool && (
              <Button variant="contained" size="small" startIcon={<Add />}
                onClick={() => setPoolDialogOpen(true)}
                sx={{ textTransform: "none", background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
                Create Pool
              </Button>
            )}
          </Box>
          {pools.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 2 }}>
              No pools yet{admin ? " — create one to start collecting contributions." : "."}
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {pools.map((p) => {
                const paid = p.contributions.filter((c) => c.paid).length;
                const total = p.contributions.length;
                const collected = p.contributions.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);
                const isPoolActive = p.is_active;
                return (
                  <Paper key={p.id} component={Link} href={`/pool/${p.id}`} variant="outlined"
                    sx={{
                      p: 2, textDecoration: "none", color: "inherit", borderRadius: 2,
                      transition: "all 0.2s", cursor: "pointer",
                      borderColor: isPoolActive ? "#1DC9B740" : "divider",
                      bgcolor: isPoolActive ? "#1DC9B706" : "transparent",
                      "&:hover": { borderColor: "#6C63FF", boxShadow: "0 2px 12px rgba(108,99,255,0.1)" },
                    }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center",
                        background: isPoolActive ? "linear-gradient(135deg, #1DC9B7, #4DD9CB)" : "#F2F3F8",
                      }}>
                        {isPoolActive ? <Savings sx={{ color: "#fff", fontSize: 18 }} /> : <Lock sx={{ color: "#B5B5C3", fontSize: 18 }} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" fontWeight={700}>{getMonthLabel(p.month)}</Typography>
                          <Chip label={isPoolActive ? "Active" : "Closed"} size="small"
                            icon={isPoolActive ? <Schedule sx={{ fontSize: 12 }} /> : <Lock sx={{ fontSize: 12 }} />}
                            sx={{ height: 20, fontSize: 10, fontWeight: 600, bgcolor: isPoolActive ? "#1DC9B715" : "#B5B5C315", color: isPoolActive ? "#1DC9B7" : "#B5B5C3" }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          ₹{p.contribution_amount}/person · {paid}/{total} received · {formatCurrency(collected)} collected
                        </Typography>
                      </Box>
                      <ArrowForward sx={{ color: "#B5B5C3", fontSize: 18 }} />
                    </Box>
                    {isPoolActive && (
                      <Box sx={{ mt: 0.5 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.3 }}>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {p.contributions.map((c) => (
                              <Avatar key={c.uid} sx={{ width: 20, height: 20, fontSize: 9, bgcolor: c.paid ? "#1DC9B7" : "#E0E0E0" }}>
                                {c.displayName.charAt(0)}
                              </Avatar>
                            ))}
                          </Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {Math.round((paid / total) * 100)}%
                          </Typography>
                        </Box>
                        <Box sx={{ height: 4, borderRadius: 2, bgcolor: "#F2F3F8", overflow: "hidden" }}>
                          <Box sx={{ height: "100%", borderRadius: 2, width: `${(paid / total) * 100}%`, background: "linear-gradient(90deg, #1DC9B7, #4DD9CB)", transition: "width 0.3s" }} />
                        </Box>
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>Group Expenses</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {transactions.length > 0 && (
                <Button size="small" variant="outlined" startIcon={<Download />}
                  onClick={() => exportGroupTransactionsCSV(transactions, `${group.name}-expenses.csv`)}
                  sx={{ textTransform: "none" }}>
                  CSV
                </Button>
              )}
              {canAdd(group) && (
                <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setExpenseOpen(true)}
                  sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
                  Add
                </Button>
              )}
            </Box>
          </Box>

          {transactions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>No expenses yet</Typography>
          ) : isMobile ? (
            <Box>
              {transactions.map((tx) => (
                <Box key={tx.id} sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{tx.title}</Typography>
                      <Typography variant="caption" color="text.secondary">Paid by {tx.paid_by_name} · {tx.date}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{formatCurrency(tx.amount)}</Typography>
                        <Chip label={tx.split_method} size="small" sx={{ fontSize: 10, height: 20 }} />
                      </Box>
                      {(admin || canEdit(group)) && (
                        <IconButton size="small" onClick={() => deleteTransaction(tx.id)}><Delete fontSize="small" /></IconButton>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}>
                    {tx.participants.map((p) => (
                      <Chip key={p.uid} label={`${p.displayName}: ${formatCurrency(p.amount)}`} size="small"
                        sx={{ fontSize: 10, height: 20, bgcolor: "action.hover" }} />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "action.hover" }}>
                    {["Title", "Amount", "Paid By", "Split", "Date", "Participants", ""].map((h) => (
                      <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{tx.title}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>{tx.paid_by_name}</TableCell>
                      <TableCell><Chip label={tx.split_method} size="small" sx={{ fontWeight: 600, fontSize: 11 }} /></TableCell>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 0.3, flexWrap: "wrap" }}>
                          {tx.participants.map((p) => (
                            <Chip key={p.uid} label={`${p.displayName}: ${formatCurrency(p.amount)}`} size="small" sx={{ fontSize: 10, height: 20 }} />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {(admin || canEdit(group)) && (
                          <IconButton size="small" onClick={() => deleteTransaction(tx.id)}><Delete fontSize="small" /></IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      <GroupExpenseForm open={expenseOpen} onClose={() => setExpenseOpen(false)} onSave={addTransaction} members={group.members} groupId={groupId} />
      <AddMemberDialog open={memberOpen} onClose={() => setMemberOpen(false)} onAdd={(email) => addMember(groupId, email)} />
      <CreatePoolDialog open={poolDialogOpen} onClose={() => setPoolDialogOpen(false)}
        onCreate={handleCreatePool} members={group.members} groupName={group.name}
        hasActivePool={hasActivePool} />
    </>
  );
}
