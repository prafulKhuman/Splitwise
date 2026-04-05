"use client";
import { useState } from "react";
import {
  Box, Paper, Typography, TextField, Button,
  InputAdornment, IconButton, CircularProgress, Divider,
} from "@mui/material";
import { Visibility, VisibilityOff, Email, Lock, Person, AccountBalanceWallet, Google } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { auth, googleProvider } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithPopup } from "firebase/auth";

const floatingKeyframes = `
@keyframes float1 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
@keyframes float2 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-30px) rotate(-5deg); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,138,0.4); } 50% { box-shadow: 0 0 0 15px rgba(255,107,138,0); } }
`;

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) { showToast("Please fill in all fields", "warning"); return; }
    if (form.password.length < 6) { showToast("Password must be at least 6 characters", "warning"); return; }
    if (form.password !== form.confirmPassword) { showToast("Passwords do not match", "warning"); return; }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name });
      await sendEmailVerification(cred.user);
      await auth.signOut();
      showToast("🎉 Registration successful! Please check your email to verify.", "info");
      setTimeout(() => router.push("/auth/login"), 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      showToast(msg.includes("email-already-in-use") ? "Email already in use" : msg, "error");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      showToast("Account created!", "success");
      setTimeout(() => router.push("/"), 1000);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Google signup failed", "error");
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{floatingKeyframes}</style>
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1B1B3A 0%, #3A1B50 35%, #FF6B8A 100%)", position: "relative", overflow: "hidden", p: 2 }}>
        <Box sx={{ position: "absolute", top: "8%", right: "12%", width: 130, height: 130, borderRadius: "50%", background: "rgba(255,107,138,0.15)", animation: "float1 6s ease-in-out infinite" }} />
        <Box sx={{ position: "absolute", bottom: "20%", left: "8%", width: 90, height: 90, borderRadius: "30%", background: "rgba(108,99,255,0.12)", animation: "float2 8s ease-in-out infinite" }} />

        <Paper elevation={24} sx={{ maxWidth: 440, width: "100%", p: { xs: 3, sm: 5 }, borderRadius: { xs: 3, sm: 4 }, animation: "slideUp 0.6s ease-out", position: "relative", overflow: "hidden" }}>
          <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #FF6B8A, #6C63FF, #1DC9B7)" }} />

          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: 3, background: "linear-gradient(135deg, #FF6B8A, #FF8FA8)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, animation: "pulse 2s ease-in-out infinite" }}>
              <AccountBalanceWallet sx={{ fontSize: 32, color: "#fff" }} />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ background: "linear-gradient(135deg, #FF6B8A, #6C63FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Create Account</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Start tracking your expenses today</Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required sx={{ mb: 2 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Person sx={{ color: "#B5B5C3" }} /></InputAdornment> } }} />
            <TextField fullWidth label="Email Address" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required sx={{ mb: 2 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Email sx={{ color: "#B5B5C3" }} /></InputAdornment> } }} />
            <TextField fullWidth label="Password" type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required sx={{ mb: 2 }}
              slotProps={{ input: {
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: "#B5B5C3" }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">{showPw ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
              } }} />
            <TextField fullWidth label="Confirm Password" type={showPw ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required sx={{ mb: 3 }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Lock sx={{ color: "#B5B5C3" }} /></InputAdornment> } }} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
              sx={{ py: 1.5, fontSize: "1rem", background: "linear-gradient(135deg, #FF6B8A, #FF8FA8)", boxShadow: "0 4px 20px rgba(255,107,138,0.4)", "&:hover": { background: "linear-gradient(135deg, #CC5570, #FF6B8A)" } }}>
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Create Account"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}><Typography variant="body2" color="text.secondary">OR</Typography></Divider>

          <Button fullWidth variant="outlined" size="large" startIcon={<Google />} onClick={handleGoogle} disabled={loading}
            sx={{ py: 1.2, borderColor: "#E4E6EF", color: "#3F4254", "&:hover": { borderColor: "#FF6B8A", bgcolor: "#FF6B8A08" } }}>
            Continue with Google
          </Button>

          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 3 }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "#FF6B8A", fontWeight: 600, textDecoration: "none" }}>Sign In</Link>
          </Typography>
        </Paper>
      </Box>
    </>
  );
}
