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

function buildBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [{ label: "Dashboard", href: "/" }];
  if (pathname === "/") return crumbs;

  const segments = pathname.split("/").filter(Boolean);
  let path = "";
  for (let i = 0; i < segments.length; i++) {
    path += "/" + segments[i];
    const title = ROUTE_TITLES[path];
    if (title) {
      crumbs.push({ label: title, href: path });
    } else if (i > 0) {
      // Dynamic segment like [id] — show as "Details"
      const parentPath = "/" + segments.slice(0, i).join("/");
      const parentTitle = ROUTE_TITLES[parentPath];
      if (parentTitle) {
        crumbs.push({ label: "Details", href: path });
      }
    }
  }
  return crumbs;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();
  const title = ROUTE_TITLES[pathname] || Object.entries(ROUTE_TITLES).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] || "Dashboard";
  const breadcrumbs = buildBreadcrumbs(pathname);
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
        <TopBar title={title} breadcrumbs={breadcrumbs} activeNav={pathname} onMenuClick={() => setMobileDrawerOpen(true)} showMenuButton={isMobile} />
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, pb: { xs: "calc(env(safe-area-inset-bottom) + 80px)", md: 3 }, overflow: "auto" }}>
          {children}
        </Box>
        {isMobile && <MobileBottomNav />}
      </Box>
    </Box>
  );
}
