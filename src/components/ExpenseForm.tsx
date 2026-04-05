"use client";
import TransactionForm from "./TransactionForm";
import { Transaction } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Transaction>) => void;
  expense?: Transaction | null;
};

export default function ExpenseForm({ open, onClose, onSave, expense }: Props) {
  return <TransactionForm open={open} onClose={onClose} onSave={onSave} transaction={expense} />;
}
