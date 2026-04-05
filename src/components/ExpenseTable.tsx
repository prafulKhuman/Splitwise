"use client";
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Chip, Box, Typography, useMediaQuery, useTheme,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { Transaction } from "@/lib/types";

type Props = {
  expenses: Transaction[];
  onEdit: (e: Transaction) => void;
  onDelete: (id: string) => void;
};

function MobileCard({ exp, onEdit, onDelete }: { exp: Transaction; onEdit: () => void; onDelete: () => void }) {
  const isIncome = exp.type === "income";
  return (
    <Paper sx={{ p: 2, mb: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>{exp.title}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
          <Chip label={exp.category} size="small"
            sx={{ fontWeight: 600, height: 22, fontSize: "0.7rem", bgcolor: isIncome ? "#1DC9B715" : "#6C63FF15", color: isIncome ? "#1DC9B7" : "#6C63FF" }} />
          <Typography variant="caption" color="text.secondary">{exp.date}</Typography>
        </Box>
      </Box>
      <Typography variant="body1" fontWeight={700} sx={{ whiteSpace: "nowrap", color: isIncome ? "#1DC9B7" : "#FD397A" }}>
        {isIncome ? "+" : "-"}₹{exp.amount.toFixed(2)}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <IconButton size="small" sx={{ color: "#6C63FF", p: 0.5 }} onClick={onEdit}><Edit sx={{ fontSize: 18 }} /></IconButton>
        <IconButton size="small" sx={{ color: "#FD397A", p: 0.5 }} onClick={onDelete}><Delete sx={{ fontSize: 18 }} /></IconButton>
      </Box>
    </Paper>
  );
}

export default function ExpenseTable({ expenses, onEdit, onDelete }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (expenses.length === 0) {
    return (
      <Paper sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">No transactions found</Typography>
      </Paper>
    );
  }

  if (isMobile) {
    return <Box>{expenses.map((exp) => <MobileCard key={exp.id} exp={exp} onEdit={() => onEdit(exp)} onDelete={() => onDelete(exp.id)} />)}</Box>;
  }

  return (
    <TableContainer component={Paper} sx={{ overflow: "hidden" }}>
      <Table>
        <TableHead>
          <TableRow sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)" }}>
            {["Title", "Amount", "Type", "Category", "Date", "Actions"].map((h) => (
              <TableCell key={h} sx={{ color: "white", fontWeight: 700, fontSize: "0.875rem" }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((exp) => {
            const isIncome = exp.type === "income";
            return (
              <TableRow key={exp.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{exp.title}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: isIncome ? "#1DC9B7" : "#FD397A" }}>
                  {isIncome ? "+" : "-"}₹{exp.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Chip label={exp.type} size="small"
                    sx={{ fontWeight: 600, bgcolor: isIncome ? "#1DC9B715" : "#FD397A15", color: isIncome ? "#1DC9B7" : "#FD397A" }} />
                </TableCell>
                <TableCell><Chip label={exp.category} size="small" sx={{ fontWeight: 600 }} /></TableCell>
                <TableCell>{exp.date}</TableCell>
                <TableCell>
                  <IconButton size="small" sx={{ color: "#6C63FF" }} onClick={() => onEdit(exp)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" sx={{ color: "#FD397A" }} onClick={() => onDelete(exp.id)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
