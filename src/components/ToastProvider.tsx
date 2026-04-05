"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Snackbar, Alert } from "@mui/material";

type Severity = "success" | "warning" | "error" | "info";
type ToastState = { open: boolean; msg: string; severity: Severity };
type ToastCtx = { showToast: (msg: string, severity?: Severity) => void };

const ToastContext = createContext<ToastCtx>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ open: false, msg: "", severity: "info" });

  const showToast = useCallback((msg: string, severity: Severity = "success") => {
    setToast({ open: true, msg, severity });
  }, []);

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setToast((prev) => ({ ...prev, open: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 3, fontWeight: 600, minWidth: 280 }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
