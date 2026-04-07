"use client";
import { useRef, useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, MenuItem,
  LinearProgress, Chip, IconButton, Alert, Paper,
} from "@mui/material";
import {
  CloudUpload, CameraAlt, CheckCircle, Close,
  Receipt, Edit, AccessTime, CalendarMonth,
} from "@mui/icons-material";
import { useUpiScan } from "@/hooks/useUpiScan";
import { useCategories } from "@/hooks/useCategories";
import { UpiTransaction } from "@/lib/types";

const FALLBACK_CATS = [
  "Food", "Transport", "Shopping", "Bills", "Entertainment",
  "Health", "Education", "Rent", "Travel", "Investment", "Transfer", "Other",
];

const APP_COLORS: Record<string, string> = {
  "Google Pay": "#4285F4",
  "PhonePe": "#5F259F",
  "Paytm": "#00BAF2",
  "BHIM": "#00796B",
  "Amazon Pay": "#FF9900",
  "CRED": "#1A1A2E",
  "WhatsApp Pay": "#25D366",
  "MobiKwik": "#E91E63",
  "SBI YONO": "#1A237E",
  "ICICI iMobile": "#F57C00",
  "HDFC Bank": "#004B87",
  "Axis Bank": "#97144D",
  "Union Bank": "#E53935",
  UPI: "#6C63FF",
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function UpiScanDialog({ open, onClose }: Props) {
  const { state, parsed, setParsed, preview, error, rawOcr, scanImage, saveAsExpense, reset } = useUpiScan();
  const [showRawOcr, setShowRawOcr] = useState(false);
  const { getCategoriesByType } = useCategories();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editMode, setEditMode] = useState(false);

  const cats = getCategoriesByType("expense");
  const catNames = cats.length > 0 ? cats.map((c) => c.name) : FALLBACK_CATS;

  useEffect(() => {
    if (!open) { reset(); setEditMode(false); setShowRawOcr(false); }
  }, [open, reset]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) scanImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) scanImage(file);
  };

  const updateField = (field: keyof UpiTransaction, value: string | number) => {
    if (parsed) setParsed({ ...parsed, [field]: value });
  };

  const handleClose = () => { reset(); onClose(); };

  const appColor = APP_COLORS[parsed?.upiApp || "UPI"] || "#6C63FF";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Receipt sx={{ color: "#6C63FF" }} />
          UPI Screenshot Scanner
        </Box>
        <IconButton size="small" onClick={handleClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: "8px !important" }}>
        {/* Upload Area */}
        {state === "idle" && (
          <Paper
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            sx={{
              border: "2px dashed", borderColor: "#6C63FF40",
              borderRadius: 3, p: 4, textAlign: "center", cursor: "pointer",
              bgcolor: "#6C63FF08", transition: "all 0.2s",
              "&:hover": { borderColor: "#6C63FF", bgcolor: "#6C63FF12" },
            }}
          >
            <CloudUpload sx={{ fontSize: 48, color: "#6C63FF", mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Upload UPI Payment Screenshot
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Drag & drop or click to select
            </Typography>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mb: 2 }}>
              <Button variant="outlined" startIcon={<CloudUpload />} size="small"
                sx={{ textTransform: "none", borderColor: "#6C63FF", color: "#6C63FF" }}>
                Choose File
              </Button>
              <Button variant="outlined" startIcon={<CameraAlt />} size="small"
                sx={{ textTransform: "none", borderColor: "#6C63FF", color: "#6C63FF" }}>
                Camera
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, justifyContent: "center" }}>
              {["Google Pay", "PhonePe", "Paytm", "BHIM", "Amazon Pay", "CRED", "WhatsApp Pay", "Bank Apps"].map((app) => (
                <Chip key={app} label={app} size="small"
                  sx={{ height: 22, fontSize: 10, fontWeight: 600, bgcolor: `${APP_COLORS[app] || "#6C63FF"}15`, color: APP_COLORS[app] || "#6C63FF" }} />
              ))}
            </Box>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
          </Paper>
        )}

        {/* Scanning */}
        {state === "scanning" && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <LinearProgress sx={{ mb: 2, borderRadius: 2, "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #6C63FF, #8B83FF)" } }} />
            <Typography variant="subtitle2" fontWeight={600}>Scanning screenshot...</Typography>
            <Typography variant="body2" color="text.secondary">Extracting amount, merchant, date & transaction ID</Typography>
            {preview && (
              <Box component="img" src={preview} alt="preview"
                sx={{ mt: 2, maxHeight: 150, borderRadius: 2, opacity: 0.6 }} />
            )}
          </Box>
        )}

        {/* Error */}
        {state === "error" && (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>
            {parsed && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Partial data extracted. Click the edit icon ✏️ to enter amount manually.
              </Typography>
            )}
            {!parsed && (
              <Button variant="outlined" onClick={reset} sx={{ textTransform: "none" }}>
                Try Another Screenshot
              </Button>
            )}
            {rawOcr && (
              <Box sx={{ mt: 1 }}>
                <Button size="small" onClick={() => setShowRawOcr(!showRawOcr)}
                  sx={{ textTransform: "none", fontSize: 11, color: "text.secondary" }}>
                  {showRawOcr ? "Hide" : "Show"} OCR raw text (debug)
                </Button>
                {showRawOcr && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1, maxHeight: 150, overflow: "auto", borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 10, color: "text.secondary" }}>
                      {rawOcr}
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Parsed Result */}
        {(state === "parsed" || (state === "error" && parsed)) && parsed && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {state === "parsed" && (
              <Alert severity="success" icon={<CheckCircle />}>
                Transaction detected — {parsed.confidence}% confidence
              </Alert>
            )}

            {preview && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box component="img" src={preview} alt="screenshot"
                  sx={{ maxHeight: 120, borderRadius: 2, border: "1px solid", borderColor: "divider" }} />
              </Box>
            )}

            {/* App + Edit toggle */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Chip label={parsed.upiApp} size="small"
                  sx={{ bgcolor: `${appColor}15`, color: appColor, fontWeight: 700 }} />
                {parsed.time && (
                  <Chip icon={<AccessTime sx={{ fontSize: 14 }} />} label={parsed.time} size="small" variant="outlined"
                    sx={{ height: 24, fontSize: 11 }} />
                )}
              </Box>
              <IconButton size="small" onClick={() => setEditMode(!editMode)}
                sx={{ color: editMode ? "#6C63FF" : "text.secondary" }}>
                <Edit fontSize="small" />
              </IconButton>
            </Box>

            {/* Amount - always editable when amount is 0 or in edit mode */}
            <Paper variant="outlined" sx={{ p: 2, textAlign: "center", borderRadius: 2, bgcolor: `${appColor}08` }}>
              {editMode || parsed.amount <= 0 ? (
                <TextField label="Amount (₹)" type="number" value={parsed.amount || ""}
                  onChange={(e) => updateField("amount", Number(e.target.value))}
                  fullWidth variant="standard" autoFocus={parsed.amount <= 0}
                  placeholder="Enter amount"
                  sx={{ "& input": { textAlign: "center", fontSize: 24, fontWeight: 700 } }} />
              ) : (
                <Typography variant="h4" fontWeight={800} sx={{ color: appColor }}>
                  ₹{parsed.amount.toLocaleString("en-IN")}
                </Typography>
              )}
            </Paper>

            <TextField label="Merchant / Receiver"
              value={parsed.merchant} disabled={!editMode}
              onChange={(e) => updateField("merchant", e.target.value)}
              fullWidth size="small" />

            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField label="Category" select
                value={catNames.includes(parsed.category) ? parsed.category : "Other"}
                onChange={(e) => updateField("category", e.target.value)}
                fullWidth size="small">
                {catNames.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField label="Date" type="date"
                value={parsed.date} disabled={!editMode}
                onChange={(e) => updateField("date", e.target.value)}
                fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            </Box>

            {parsed.txnId && (
              <TextField label="Transaction ID" value={parsed.txnId} disabled fullWidth size="small"
                sx={{ "& .MuiInputBase-input": { fontSize: 12, fontFamily: "monospace", letterSpacing: 0.5 } }} />
            )}
          </Box>
        )}

        {/* Saved */}
        {state === "saved" && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircle sx={{ fontSize: 56, color: "#1DC9B7", mb: 1 }} />
            <Typography variant="h6" fontWeight={700}>Expense Saved!</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              ₹{parsed?.amount?.toLocaleString("en-IN")} • {parsed?.merchant} • {parsed?.category}
            </Typography>
            <Button variant="outlined" onClick={reset} sx={{ textTransform: "none", mr: 1 }}>
              Scan Another
            </Button>
            <Button variant="contained" onClick={handleClose}
              sx={{ textTransform: "none", background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
              Done
            </Button>
          </Box>
        )}

        {/* Saving */}
        {state === "saving" && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="subtitle2">Saving expense...</Typography>
          </Box>
        )}
      </DialogContent>

      {(state === "parsed" || (state === "error" && parsed)) && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={reset} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={() => parsed && saveAsExpense(parsed)}
            disabled={!parsed?.amount}
            sx={{ textTransform: "none", background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
            Save as Expense
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
