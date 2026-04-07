"use client";
import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Paper, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip,
} from "@mui/material";
import { CameraAlt, Delete, Receipt, QrCodeScanner } from "@mui/icons-material";
import UpiScanDialog from "@/components/UpiScanDialog";
import PageSkeleton from "@/components/PageSkeleton";
import NoData from "@/components/NoData";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { db } from "@/lib/firebase";
import { Transaction } from "@/lib/types";
import {
  collection, query, where, onSnapshot, deleteDoc, doc, orderBy,
} from "firebase/firestore";

export default function UpiScanPage() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [scanOpen, setScanOpen] = useState(false);
  const [upiExpenses, setUpiExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) { if (!authLoading) setLoading(false); return; }
    const q = query(
      collection(db, "transactions"),
      where("user_id", "==", user.uid),
      where("source", "==", "upi_scan")
    );
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Transaction))
        .sort((a, b) => b.date.localeCompare(a.date));
      setUpiExpenses(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
      showToast("Deleted", "success");
    } catch { showToast("Delete failed", "error"); }
  };

  if (loading) return <PageSkeleton variant="dashboard" />;

  return (
    <>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <QrCodeScanner sx={{ color: "#6C63FF" }} /> UPI Auto Scanner
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload UPI payment screenshots to auto-record expenses
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<CameraAlt />} onClick={() => setScanOpen(true)}
          sx={{ textTransform: "none", fontWeight: 600, background: "linear-gradient(135deg, #6C63FF, #8B83FF)", borderRadius: 2, px: 3 }}>
          Scan Screenshot
        </Button>
      </Box>

      {/* How it works */}
      <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>How it works</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
          {[
            { step: "1", title: "Upload Screenshot", desc: "Take or upload a UPI payment screenshot" },
            { step: "2", title: "Auto Extract", desc: "OCR extracts amount, merchant, date & txn ID" },
            { step: "3", title: "Save Expense", desc: "Review, edit category & save to your tracker" },
          ].map((s) => (
            <Box key={s.step} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #6C63FF, #8B83FF)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 700,
              }}>{s.step}</Box>
              <Box>
                <Typography variant="body2" fontWeight={600}>{s.title}</Typography>
                <Typography variant="caption" color="text.secondary">{s.desc}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Scanned History */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box sx={{ px: 2.5, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Scanned Transactions ({upiExpenses.length})
          </Typography>
        </Box>

        {upiExpenses.length === 0 ? (
          <NoData message="No UPI scans yet. Upload a screenshot to get started!" />
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: "none", sm: "table-cell" } }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, display: { xs: "none", md: "table-cell" } }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upiExpenses.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Receipt sx={{ fontSize: 16, color: "#6C63FF" }} />
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{tx.title}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="error.main">
                        ₹{tx.amount.toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                      <Chip label={tx.category} size="small"
                        sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                      <Typography variant="body2" color="text.secondary">{tx.date}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(tx.id)}
                          sx={{ color: "text.secondary", "&:hover": { color: "#FD397A" } }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <UpiScanDialog open={scanOpen} onClose={() => setScanOpen(false)} />
    </>
  );
}
