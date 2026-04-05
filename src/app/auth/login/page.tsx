"use client";
import { useState } from "react";
import {
  Box, Paper, Typography, TextField, Button,
  InputAdornment, IconButton, CircularProgress, Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Lock, AccountBalanceWallet, Google } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

const floatingKeyframes = `
@keyframes float1 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
@keyframes float2 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-30px) rotate(-5deg); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(108,99,255,0.4); } 50% { box-shadow: 0 0 0 15px rgba(108,99,255,0); } }
`;

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { showToast("Please fill in all fields", "warning"); return; }
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
      if (!cred.user.emailVerified) {
        await auth.signOut();
        showToast("📧 Please verify your email first.", "warning");
        return;
      }
      showToast("Login successful!", "success");
      setTimeout(() => router.push("/"), 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      showToast(msg.includes("invalid-credential") ? "Invalid email or password" : msg, "error");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast("Login successful!", "success");
      setTimeout(() => router.push("/"), 1000);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Google login failed", "error");
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{floatingKeyframes}</style>
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1B1B3A 0%, #2D1B69 35%, #6C63FF 100%)", position: "relative", overflow: "hidden", p: 2 }}>
        <Box sx={{ position: "absolute", top: "10%", left: "8%", width: 120, height: 120, borderRadius: "50%", background: "rgba(108,99,255,0.15)", animation: "float1 6s ease-in-out infinite" }} />
        <Box sx={{ position: "absolute", top: "60%", right: "10%", width: 80, height: 80, borderRadius: "30%", background: "rgba(255,107,138,0.12)", animation: "float2 8s ease-in-out infinite" }} />

        <Paper elevation={24} sx={{ maxWidth: 440, width: "100%", p: { xs: 3, sm: 5 }, borderRadius: { xs: 3, sm: 4 }, animation: "slideUp 0.6s ease-out", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #6C63FF, #FF6B8A, #1DC9B7)" }} />

          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: 3, background: "linear-gradient(135deg, #6C63FF, #8B83FF)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, animation: "pulse 2s ease-in-out infinite" }}>
              <AccountBalanceWallet sx={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ background: "linear-gradient(135deg, #6C63FF, #FF6B8A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Welcome Back</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Sign in to manage your expenses</Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required sx={{ mb: 2.5 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email sx={{ color: "#B5B5C3" }} /></InputAdornment> } }} />
            <TextField fullWidth label="Password" type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required sx={{ mb: 3 }}
              slotProps={{ input: {
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: "#B5B5C3" }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">{showPw ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
              } }} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{ py: 1.5, fontSize: "1rem", background: "linear-gradient(135deg, #6C63FF, #8B83FF)", boxShadow: "0 4px 20px rgba(108,99,255,0.4)", "&:hover": { background: "linear-gradient(135deg, #4B44CC, #6C63FF)" } }}>
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Sign In"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}><Typography variant="body2" color="text.secondary">OR</Typography></Divider>

          <Button fullWidth variant="outlined" size="large" startIcon={<Google />} onClick={handleGoogle} disabled={loading}
            sx={{ py: 1.2, borderColor: "#E4E6EF", color: "#3F4254", "&:hover": { borderColor: "#6C63FF", bgcolor: "#6C63FF08" } }}>
            Continue with Google
          </Button>

          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 3 }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" style={{ color: "#6C63FF", fontWeight: 600, textDecoration: "none" }}>Create Account</Link>
          </Typography>
        </Paper>
      </Box>
    </>
  );
}
