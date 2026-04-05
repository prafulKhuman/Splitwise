"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box, Paper, Typography, Button, Chip, Avatar, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, Divider, useMediaQuery, useTheme,
} from "@mui/material";
import { Add, Delete, Edit, PersonAdd, Settings, ArrowBack, Download } from "@mui/icons-material";
import Link from "next/link";
import { useGroups } from "@/hooks/useGroups";
import { useGroupTransactions } from "@/hooks/useGroupTransactions";
import { useAuth } from "@/context/AuthProvider";
import GroupExpenseForm from "@/components/groups/GroupExpenseForm";
import AddMemberDialog from "@/components/groups/AddMemberDialog";
import SettlementCard from "@/components/groups/SettlementCard";
import { calculateSettlements, formatCurrency } from "@/lib/settlements";
import { exportGroupTransactionsCSV } from "@/lib/export";
import PageSkeleton from "@/components/PageSkeleton";

export default function GroupDetailClient() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const { user } = useAuth();
  const { groups, isAdmin, canAdd, canEdit, addMember, removeMember, updateSettings, deleteGroup } = useGroups();
  const { transactions, loading: txLoading, addTransaction, updateTransaction, deleteTransaction } = useGroupTransactions(groupId);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const group = groups.find((g) => g.id === groupId);
  if (!group) return <PageSkeleton variant="dashboard" />;

  const admin = isAdmin(group);
  const settlements = calculateSettlements(transactions, group.members);

  const memberBalances = group.members.map((m) => {
    const paid = transactions.filter((t) => t.paid_by === m.uid).reduce((s, t) => s + t.amount, 0);
    const owes = transactions.reduce((s, t) => s + (t.participants.find((p) => p.uid === m.uid)?.amount || 0), 0);
    return { ...m, paid, owes, net: paid - owes };
  });

  const handleDeleteGroup = async () => {
    await deleteGroup(groupId);
    router.push("/groups");
  };

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton component={Link} href="/groups" size="small"><ArrowBack /></IconButton>
        <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>{group.name}</Typography>
        {admin && (
          <IconButton onClick={() => setShowSettings(!showSettings)} size="small" sx={{ color: showSettings ? "#6C63FF" : "text.secondary" }}>
            <Settings />
          </IconButton>
        )}
      </Box>

      {showSettings && admin && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Group Settings</Typography>
          <FormControlLabel
            control={<Switch checked={group.settings?.members_can_add ?? true} onChange={(e) => updateSettings(groupId, { ...group.settings, members_can_add: e.target.checked })} />}
            label="Members can add transactions"
          />
          <FormControlLabel
            control={<Switch checked={group.settings?.members_can_edit ?? false} onChange={(e) => updateSettings(groupId, { ...group.settings, members_can_edit: e.target.checked })} />}
            label="Members can edit transactions"
          />
          <Divider sx={{ my: 1 }} />
          <Button color="error" size="small" onClick={handleDeleteGroup}>Delete Group</Button>
        </Paper>
      )}

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

      <GroupExpenseForm open={expenseOpen} onClose={() => setExpenseOpen(false)} onSave={addTransaction} members={group.members} groupId={groupId} />
      <AddMemberDialog open={memberOpen} onClose={() => setMemberOpen(false)} onAdd={(email) => addMember(groupId, email)} />
    </>
  );
}
