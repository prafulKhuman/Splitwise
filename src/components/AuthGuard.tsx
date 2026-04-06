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

  const isVerified = user?.emailVerified || user?.providerData[0]?.providerId === "google.com";

  useEffect(() => {
    if (loading) return;
    if (!isVerified && !isAuthPage) router.replace("/auth/login");
    if (isVerified && isAuthPage) router.replace("/");
  }, [isVerified, loading, isAuthPage, router]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (!isVerified && !isAuthPage) return null;
  if (isVerified && isAuthPage) return null;

  return <>{children}</>;
}
