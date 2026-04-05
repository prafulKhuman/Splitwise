"use client";
import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button,
} from "@mui/material";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
};

export default function CreateGroupDialog({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), desc.trim());
    setName("");
    setDesc("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Create Group</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        <TextField label="Group Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        <TextField label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} fullWidth multiline rows={2} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}
          sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
