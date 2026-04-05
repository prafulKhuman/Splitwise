"use client";
import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (email: string) => void;
};

export default function AddMemberDialog({ open, onClose, onAdd }: Props) {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!email.trim()) return;
    onAdd(email.trim());
    setEmail("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Member</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <TextField label="Member Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}
          sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}
