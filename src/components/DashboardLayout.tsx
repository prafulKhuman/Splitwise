"use client";
import { useState } from "react";
import { Box, CircularProgress, useMediaQuery, useTheme } from "@mui/material";
import { useAuth } from "@/context/AuthProvider";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { usePathname } from "next/navigation";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/expenses": "Transactions",
  "/categories": "Categories",
  "/groups": "Groups",
  "/pool": "Monthly Pool",
  "/reports": "Reports & Insights",
  "/upi-scan": "UPI Scanner",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();
  const title = ROUTE_TITLES[pathname] || Object.entries(ROUTE_TITLES).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] || "Dashboard";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (authLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar
        open={isMobile ? true : sidebarOpen}
        onToggle={() => isMobile ? setMobileDrawerOpen(false) : setSidebarOpen(!sidebarOpen)}
        variant={isMobile ? "temporary" : "permanent"}
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
      />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar title={title} activeNav={pathname} onMenuClick={() => setMobileDrawerOpen(true)} showMenuButton={isMobile} />
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, pb: { xs: "calc(env(safe-area-inset-bottom) + 80px)", md: 3 }, overflow: "auto" }}>
          {children}
        </Box>
        {isMobile && <MobileBottomNav />}
      </Box>
    </Box>
  );
}
