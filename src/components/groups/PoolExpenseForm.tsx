"use client";
import { useRef, useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, TextField, Button, Box, Typography,
  MenuItem, Checkbox, Avatar, Chip, IconButton, ToggleButtonGroup, ToggleButton,
  Paper, LinearProgress, Alert, InputAdornment, Divider, Tooltip,
} from "@mui/material";
import {
  Close, Receipt, CloudUpload, CameraAlt, Category as CategoryIcon,
  CalendarMonth, Person, Notes, AttachMoney, QrCodeScanner,
  CheckCircle, Percent, PieChart, Functions,
} from "@mui/icons-material";
import { GroupMember, PoolSplitMethod } from "@/lib/types";
import { useAuth } from "@/context/AuthProvider";
import { useCategories } from "@/hooks/useCategories";
import { useUpiScan } from "@/hooks/useUpiScan";

const FALLBACK_CATS = [
  "Food", "Transport", "Shopping", "Bills", "Entertainment",
  "Health", "Education", "Rent", "Travel", "Investment", "Transfer", "Other",
];

const SPLIT_OPTIONS: { value: PoolSplitMethod; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "equal", label: "Equal", icon: <Functions sx={{ fontSize: 16 }} />, desc: "Split equally among selected" },
  { value: "exact", label: "Exact", icon: <AttachMoney sx={{ fontSize: 16 }} />, desc: "Enter exact amount per person" },
  { value: "percentage", label: "Percent", icon: <Percent sx={{ fontSize: 16 }} />, desc: "Split by percentage" },
  { value: "shares", label: "Shares", icon: <PieChart sx={{ fontSize: 16 }} />, desc: "Split by share ratio" },
];

type ExpenseData = {
  title: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
  paid_by: string;
  paid_by_name: string;
  receipt_url: string;
  split_method: PoolSplitMethod;
  participants: string[];
  split_details: Record<string, number>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: ExpenseData) => void;
  members: GroupMember[];
};

export default function PoolExpenseForm({ open, onClose, onSave, members }: Props) {
  const { user } = useAuth();
  const { getCategoriesByType } = useCategories();
  const { state: scanState, parsed, error: scanError, scanImage, reset: resetScan } = useUpiScan();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ title: "", amount: "", category: "Other", date: "", notes: "", paid_by: "" });
  const [splitMethod, setSplitMethod] = useState<PoolSplitMethod>("equal");
  const [participants, setParticipants] = useState<string[]>([]);
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});
  const [receiptPreview, setReceiptPreview] = useState("");
  const [showScan, setShowScan] = useState(false);

  const cats = getCategoriesByType("expense");
  const catNames = [...new Set([...cats.map((c) => c.name), ...FALLBACK_CATS])];
  const totalAmount = Number(form.amount) || 0;

  useEffect(() => {
    if (open) {
      setForm({ title: "", amount: "", category: "Other", date: new Date().toISOString().split("T")[0], notes: "", paid_by: user?.uid || "" });
      setSplitMethod("equal");
      setParticipants(members.map((m) => m.uid));
      setSplitValues({});
      setReceiptPreview("");
      setShowScan(false);
      resetScan();
    }
  }, [open, members, user, resetScan]);

  useEffect(() => {
    if (scanState === "parsed" && parsed) {
      setForm((f) => ({
        ...f,
        title: parsed.merchant !== "Unknown" ? `${parsed.upiApp} - ${parsed.merchant}` : f.title,
        amount: parsed.amount > 0 ? String(parsed.amount) : f.amount,
        category: parsed.category || f.category,
        date: parsed.date || f.date,
        notes: parsed.txnId ? `UPI Txn: ${parsed.txnId}` : f.notes,
      }));
      setShowScan(false);
    }
  }, [scanState, parsed]);

  // Reset split values when method or participants change
  useEffect(() => {
    const defaults: Record<string, string> = {};
    participants.forEach((uid) => {
      if (splitMethod === "equal") defaults[uid] = "";
      else if (splitMethod === "percentage") defaults[uid] = String(Math.round(100 / participants.length * 100) / 100);
      else if (splitMethod === "shares") defaults[uid] = "1";
      else defaults[uid] = splitValues[uid] || "";
    });
    setSplitValues(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitMethod, participants.length]);

  const toggle = (uid: string) =>
    setParticipants((p) => p.includes(uid) ? p.filter((u) => u !== uid) : [...p, uid]);

  const handleScanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) scanImage(file);
    e.target.value = "";
  };

  const handleReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Compute resolved amounts per person
  const resolvedSplit = useMemo(() => {
    const result: Record<string, number> = {};
    if (participants.length === 0 || totalAmount <= 0) return result;

    if (splitMethod === "equal") {
      const each = totalAmount / participants.length;
      participants.forEach((uid) => (result[uid] = Math.round(each * 100) / 100));
    } else if (splitMethod === "exact") {
      participants.forEach((uid) => (result[uid] = Number(splitValues[uid]) || 0));
    } else if (splitMethod === "percentage") {
      participants.forEach((uid) => {
        const pct = Number(splitValues[uid]) || 0;
        result[uid] = Math.round((totalAmount * pct / 100) * 100) / 100;
      });
    } else if (splitMethod === "shares") {
      const totalShares = participants.reduce((s, uid) => s + (Number(splitValues[uid]) || 0), 0);
      participants.forEach((uid) => {
        const share = Number(splitValues[uid]) || 0;
        result[uid] = totalShares > 0 ? Math.round((totalAmount * share / totalShares) * 100) / 100 : 0;
      });
    }
    return result;
  }, [splitMethod, splitValues, participants, totalAmount]);

  const splitTotal = Object.values(resolvedSplit).reduce((s, v) => s + v, 0);
  const splitDiff = Math.round((totalAmount - splitTotal) * 100) / 100;
  const isSplitValid = splitMethod === "equal" || (Math.abs(splitDiff) < 0.02 && splitTotal > 0);

  const paidByMember = members.find((m) => m.uid === form.paid_by);
  const canSubmit = form.title && totalAmount > 0 && participants.length > 0 && form.paid_by && isSplitValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({
      title: form.title,
      amount: totalAmount,
      category: form.category,
      date: form.date,
      notes: form.notes,
      paid_by: form.paid_by,
      paid_by_name: paidByMember?.displayName || "Unknown",
      receipt_url: receiptPreview,
      split_method: splitMethod,
      participants,
      split_details: resolvedSplit,
    });
    onClose();
  };

  const getSplitLabel = () => {
    if (splitMethod === "exact") return "₹";
    if (splitMethod === "percentage") return "%";
    if (splitMethod === "shares") return "×";
    return "";
  };

  const pctTotal = splitMethod === "percentage" ? participants.reduce((s, uid) => s + (Number(splitValues[uid]) || 0), 0) : 0;
  const sharesTotal = splitMethod === "shares" ? participants.reduce((s, uid) => s + (Number(splitValues[uid]) || 0), 0) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", maxHeight: "92vh" } }}>

      {/* Header */}
      <Box sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)", px: 3, py: 2.5, color: "#fff", flexShrink: 0 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Receipt sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Add Pool Expense</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>Record a new expense from the pool</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: "#fff", mt: -0.5, mr: -1 }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {/* UPI Scan */}
        {showScan ? (
          <Box sx={{ mb: 2 }}>
            {scanState === "idle" && (
              <Paper variant="outlined" sx={{ p: 2.5, textAlign: "center", borderRadius: 2, borderStyle: "dashed", borderColor: "#6C63FF40" }}>
                <QrCodeScanner sx={{ fontSize: 36, color: "#6C63FF", mb: 1 }} />
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>Scan UPI Screenshot</Typography>
                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                  <Button variant="outlined" size="small" startIcon={<CloudUpload />} onClick={() => fileRef.current?.click()}
                    sx={{ textTransform: "none", borderColor: "#6C63FF", color: "#6C63FF" }}>Upload</Button>
                  <Button variant="outlined" size="small" startIcon={<CameraAlt />} onClick={() => cameraRef.current?.click()}
                    sx={{ textTransform: "none", borderColor: "#6C63FF", color: "#6C63FF" }}>Camera</Button>
                  <Button size="small" onClick={() => setShowScan(false)} sx={{ textTransform: "none" }}>Cancel</Button>
                </Box>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleScanFile} />
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleScanFile} />
              </Paper>
            )}
            {scanState === "scanning" && (
              <Box sx={{ textAlign: "center", py: 2 }}>
                <LinearProgress sx={{ mb: 1.5, borderRadius: 2, "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #6C63FF, #8B83FF)" } }} />
                <Typography variant="body2" fontWeight={600}>Scanning screenshot...</Typography>
              </Box>
            )}
            {scanState === "parsed" && <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 1 }}>Details extracted! Fields auto-filled below.</Alert>}
            {scanState === "error" && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                {scanError || "Could not extract details."}{" "}
                <Button size="small" onClick={resetScan} sx={{ textTransform: "none", ml: 1 }}>Retry</Button>
              </Alert>
            )}
          </Box>
        ) : (
          <Box sx={{ mb: 2 }}>
            <Button variant="text" size="small" startIcon={<QrCodeScanner />} onClick={() => setShowScan(true)}
              sx={{ textTransform: "none", color: "#6C63FF", fontWeight: 600 }}>
              Auto-fill from UPI Screenshot
            </Button>
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Title */}
          <TextField label="Expense Title" value={form.title} required onChange={(e) => setForm({ ...form, title: e.target.value })}
            fullWidth size="small" placeholder="e.g. Groceries, Electricity Bill"
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Receipt sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> } }} />

          {/* Amount + Category */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField label="Amount (₹)" type="number" value={form.amount} required onChange={(e) => setForm({ ...form, amount: e.target.value })}
              fullWidth size="small" placeholder="0.00"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><AttachMoney sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> } }} />
            <TextField label="Category" select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth size="small"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><CategoryIcon sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> } }}>
              {catNames.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Box>

          {/* Date + Paid By */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              fullWidth size="small" slotProps={{ inputLabel: { shrink: true }, input: { startAdornment: <InputAdornment position="start"><CalendarMonth sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> } }} />
            <TextField label="Paid By" select value={form.paid_by} onChange={(e) => setForm({ ...form, paid_by: e.target.value })}
              fullWidth size="small" required
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> } }}>
              {members.map((m) => <MenuItem key={m.uid} value={m.uid}>{m.displayName}{m.uid === user?.uid ? " (You)" : ""}</MenuItem>)}
            </TextField>
          </Box>

          {/* Notes */}
          <TextField label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            fullWidth size="small" multiline rows={2} placeholder="Add any details..."
            slotProps={{ input: { startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}><Notes sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> } }} />

          {/* Receipt */}
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1.2, fontSize: 10 }}>Receipt / Bill</Typography>
            {receiptPreview ? (
              <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box component="img" src={receiptPreview} alt="receipt" sx={{ width: 60, height: 60, borderRadius: 1.5, objectFit: "cover", border: "1px solid", borderColor: "divider" }} />
                <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>Receipt attached</Typography>
                <Button size="small" color="error" onClick={() => setReceiptPreview("")} sx={{ textTransform: "none" }}>Remove</Button>
              </Box>
            ) : (
              <Box sx={{ mt: 0.5 }}>
                <Button variant="outlined" size="small" startIcon={<CloudUpload />} onClick={() => receiptRef.current?.click()}
                  sx={{ textTransform: "none", borderColor: "divider", color: "text.secondary" }}>Upload Receipt</Button>
                <input ref={receiptRef} type="file" accept="image/*" hidden onChange={handleReceiptFile} />
              </Box>
            )}
          </Box>

          <Divider />

          {/* ─── SPLIT SECTION ─── */}
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1.2, fontSize: 10, mb: 1, display: "block" }}>
              Split Method
            </Typography>

            {/* Split method toggle */}
            <ToggleButtonGroup value={splitMethod} exclusive
              onChange={(_, v) => { if (v) setSplitMethod(v as PoolSplitMethod); }}
              size="small" fullWidth sx={{ mb: 1.5 }}>
              {SPLIT_OPTIONS.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value}
                  sx={{
                    textTransform: "none", py: 0.8, gap: 0.5, fontSize: 12, fontWeight: 600,
                    "&.Mui-selected": { bgcolor: "#6C63FF12", color: "#6C63FF", borderColor: "#6C63FF" },
                  }}>
                  {opt.icon} {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
              {SPLIT_OPTIONS.find((o) => o.value === splitMethod)?.desc}
            </Typography>

            {/* Member list with split inputs */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {members.map((m) => {
                const selected = participants.includes(m.uid);
                const resolved = resolvedSplit[m.uid] || 0;
                return (
                  <Paper key={m.uid} variant="outlined" sx={{
                    px: 1.5, py: 1, borderRadius: 2, display: "flex", alignItems: "center", gap: 1,
                    borderColor: selected ? "#6C63FF30" : "divider",
                    bgcolor: selected ? "#6C63FF04" : "transparent",
                    transition: "all 0.15s",
                  }}>
                    <Checkbox checked={selected} size="small" onChange={() => toggle(m.uid)}
                      sx={{ p: 0.3, color: "#6C63FF", "&.Mui-checked": { color: "#6C63FF" } }} />
                    <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: selected ? "#6C63FF" : "#B5B5C3" }}>
                      {m.displayName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={selected ? 600 : 400} sx={{ flex: 1, minWidth: 0 }} noWrap>
                      {m.displayName}{m.uid === user?.uid ? " (You)" : ""}
                    </Typography>

                    {selected && splitMethod !== "equal" && (
                      <TextField size="small" type="number" value={splitValues[m.uid] || ""}
                        onChange={(e) => setSplitValues((v) => ({ ...v, [m.uid]: e.target.value }))}
                        sx={{ width: 90, "& input": { textAlign: "right", py: 0.5, fontSize: 13 } }}
                        slotProps={{ input: { endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">{getSplitLabel()}</Typography></InputAdornment> } }} />
                    )}

                    {selected && totalAmount > 0 && (
                      <Chip label={`₹${resolved.toFixed(2)}`} size="small"
                        sx={{ height: 22, fontSize: 11, fontWeight: 700, minWidth: 65,
                          bgcolor: resolved > 0 ? "#6C63FF10" : "#FD397A10",
                          color: resolved > 0 ? "#6C63FF" : "#FD397A" }} />
                    )}
                  </Paper>
                );
              })}
            </Box>

            {/* Split summary */}
            {totalAmount > 0 && participants.length > 0 && (
              <Paper variant="outlined" sx={{
                mt: 1.5, px: 2, py: 1.2, borderRadius: 2, textAlign: "center",
                borderColor: isSplitValid ? "#1DC9B730" : "#FD397A30",
                bgcolor: isSplitValid ? "#1DC9B706" : "#FD397A06",
              }}>
                {splitMethod === "equal" && (
                  <Typography variant="body2">
                    <Typography component="span" variant="caption" color="text.secondary">
                      ₹{totalAmount.toLocaleString("en-IN")} ÷ {participants.length} ={" "}
                    </Typography>
                    <Typography component="span" fontWeight={800} color="primary">
                      ₹{(totalAmount / participants.length).toFixed(2)} per person
                    </Typography>
                  </Typography>
                )}
                {splitMethod === "percentage" && (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Total:</Typography>
                    <Typography variant="body2" fontWeight={700} color={Math.abs(pctTotal - 100) < 0.1 ? "primary" : "error"}>
                      {pctTotal.toFixed(1)}%
                    </Typography>
                    {Math.abs(pctTotal - 100) >= 0.1 && (
                      <Chip label={`${pctTotal < 100 ? "Under" : "Over"} by ${Math.abs(pctTotal - 100).toFixed(1)}%`}
                        size="small" color="error" sx={{ height: 20, fontSize: 10 }} />
                    )}
                  </Box>
                )}
                {splitMethod === "shares" && (
                  <Typography variant="body2">
                    <Typography component="span" variant="caption" color="text.secondary">Total shares: </Typography>
                    <Typography component="span" fontWeight={700} color="primary">{sharesTotal}</Typography>
                    <Typography component="span" variant="caption" color="text.secondary">
                      {" "}· ₹{sharesTotal > 0 ? (totalAmount / sharesTotal).toFixed(2) : "0"} per share
                    </Typography>
                  </Typography>
                )}
                {splitMethod === "exact" && (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">Assigned:</Typography>
                    <Typography variant="body2" fontWeight={700} color={isSplitValid ? "primary" : "error"}>
                      ₹{splitTotal.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">of ₹{totalAmount.toLocaleString("en-IN")}</Typography>
                    {!isSplitValid && splitTotal > 0 && (
                      <Chip label={`${splitDiff > 0 ? "Remaining" : "Over"}: ₹${Math.abs(splitDiff).toFixed(2)}`}
                        size="small" color="error" sx={{ height: 20, fontSize: 10 }} />
                    )}
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Footer */}
      <Box sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "text.secondary" }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit} disableElevation
          sx={{ textTransform: "none", borderRadius: 2, px: 3, background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
          Add Expense
        </Button>
      </Box>
    </Dialog>
  );
}
