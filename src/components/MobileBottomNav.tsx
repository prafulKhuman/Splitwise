"use client";
import { Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";
import { Dashboard, Receipt, Group, BarChart, Savings, QrCodeScanner } from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { label: "Home", icon: <Dashboard />, href: "/" },
  { label: "Transactions", icon: <Receipt />, href: "/expenses" },
  { label: "Groups", icon: <Group />, href: "/groups" },
  { label: "Pool", icon: <Savings />, href: "/pool" },
  { label: "Reports", icon: <BarChart />, href: "/reports" },
  { label: "UPI Scan", icon: <QrCodeScanner />, href: "/upi-scan" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const current = navItems.findIndex((n) => n.href === pathname || (n.href !== "/" && pathname.startsWith(n.href)));

  return (
    <Paper elevation={8} sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200, borderRadius: "16px 16px 0 0", pb: "env(safe-area-inset-bottom)" }}>
      <BottomNavigation value={current} onChange={(_, idx) => router.push(navItems[idx].href)} showLabels
        sx={{
          height: 60,
          "& .MuiBottomNavigationAction-root": { minWidth: 0, py: 0.8, gap: 0.3, color: "#B5B5C3", "&.Mui-selected": { color: "#6C63FF" } },
          "& .MuiBottomNavigationAction-label": { fontSize: "0.65rem", fontWeight: 600, "&.Mui-selected": { fontSize: "0.65rem" } },
        }}>
        {navItems.map((item) => <BottomNavigationAction key={item.href} label={item.label} icon={item.icon} />)}
      </BottomNavigation>
    </Paper>
  );
}
