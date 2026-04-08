"use client";
import { useState, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Typography, Box, Avatar, Chip,
} from "@mui/material";
import { Savings } from "@mui/icons-material";
import { GroupMember } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (amount: number) => void;
  members: GroupMember[];
  groupName: string;
  hasActivePool: boolean;
};

export default function CreatePoolDialog({ open, onClose, onCreate, members, groupName, hasActivePool }: Props) {
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) setAmount("");
  }, [open]);

  const handleSubmit = () => {
    const val = Number(amount);
    if (val <= 0) return;
    onCreate(val);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Savings sx={{ color: "#6C63FF" }} />
        Create Monthly Pool
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        {hasActivePool ? (
          <Typography color="warning.main" variant="body2">
            An active pool already exists for this group. Close it first to create a new one.
          </Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Pool for <strong>{groupName}</strong> with {members.length} members
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {members.map((m) => (
                <Chip key={m.uid} size="small"
                  avatar={<Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>{m.displayName.charAt(0)}</Avatar>}
                  label={m.displayName} sx={{ fontSize: 11 }} />
              ))}
            </Box>
            <TextField label="Contribution Amount (₹ per member)" type="number" value={amount}
              onChange={(e) => setAmount(e.target.value)} fullWidth autoFocus
              helperText={amount && Number(amount) > 0 ? `Total collection: ₹${(Number(amount) * members.length).toLocaleString("en-IN")}` : ""} />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {!hasActivePool && (
          <Button variant="contained" onClick={handleSubmit} disabled={!amount || Number(amount) <= 0}
            sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
            Create Pool
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
