"use client";
import { useAuth } from "@/context/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  useEffect(() => {
    if (loading) return;
    if (!user && !isAuthPage) router.replace("/auth/login");
    if (user && isAuthPage) router.replace("/");
  }, [user, loading, isAuthPage, router]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (!user && !isAuthPage) return null;
  if (user && isAuthPage) return null;

  return <>{children}</>;
}
