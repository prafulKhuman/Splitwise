"use client";
import { useState } from "react";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, IconButton, Tooltip,
} from "@mui/material";
import {
  Dashboard, Receipt, Category, BarChart,
  ChevronLeft, ChevronRight, AccountBalanceWallet,
  Logout, Settings, Group, Savings, HelpOutline,
} from "@mui/icons-material";
import HelpGuide from "@/components/HelpGuide";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const navItems = [
  { label: "Dashboard", icon: <Dashboard />, href: "/", hint: "कुल आय-खर्च देखें" },
  { label: "Transactions", icon: <Receipt />, href: "/expenses", hint: "आय/खर्च जोड़ें" },
  { label: "Categories", icon: <Category />, href: "/categories", hint: "खर्च के प्रकार बनाएं" },
  { label: "Groups", icon: <Group />, href: "/groups", hint: "दोस्तों से खर्चा बाँटें" },
  { label: "Pool", icon: <Savings />, href: "/pool", hint: "मंथली पैसे इकट्ठा करें" },
  { label: "Reports", icon: <BarChart />, href: "/reports", hint: "खर्च की रिपोर्ट देखें" },
];

type Props = {
  open: boolean;
  onToggle: () => void;
  variant?: "permanent" | "temporary";
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export default function Sidebar({ open, onToggle, variant = "permanent", mobileOpen = false, onMobileClose }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [hovered, setHovered] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const userName = user?.displayName || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const width = open ? DRAWER_WIDTH : COLLAPSED_WIDTH;

  const handleLogout = async () => {
    const { signOut } = await import("firebase/auth");
    const { auth } = await import("@/lib/firebase");
    await signOut(auth);
    showToast("Logged out successfully", "info");
    setTimeout(() => router.push("/auth/login"), 500);
  };

  const handleNavClick = () => {
    if (variant === "temporary" && onMobileClose) onMobileClose();
  };

  const drawerContent = (
    <>
      <Box sx={{ height: 64, display: "flex", alignItems: "center", px: open ? 2.5 : 0, justifyContent: open ? "flex-start" : "center", gap: 1.5 }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 2, background: "linear-gradient(135deg, #6C63FF, #8B83FF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <AccountBalanceWallet sx={{ fontSize: 22, color: "#fff" }} />
        </Box>
        {open && <Typography variant="h6" fontWeight={800} noWrap sx={{ color: "#fff" }}>ExpTracker</Typography>}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 1.5 }} />

      <List sx={{ px: 1, py: 2, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const isHovered = hovered === item.href;
          return (
            <Tooltip key={item.href} title={open ? "" : item.label} placement="right" arrow>
              <ListItemButton
                component={Link} href={item.href} onClick={handleNavClick}
                onMouseEnter={() => setHovered(item.href)} onMouseLeave={() => setHovered(null)}
                sx={{
                  borderRadius: 2, mb: 0.5, px: open ? 2 : 0,
                  justifyContent: open ? "flex-start" : "center", minHeight: 46,
                  textDecoration: "none",
                  background: isActive ? "linear-gradient(135deg, #6C63FF, #8B83FF)" : isHovered ? "rgba(108,99,255,0.12)" : "transparent",
                  boxShadow: isActive ? "0 4px 15px rgba(108,99,255,0.3)" : "none",
                  transition: "all 0.2s ease",
                  "&:hover": { background: isActive ? "linear-gradient(135deg, #6C63FF, #8B83FF)" : "rgba(108,99,255,0.12)" },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? "#fff" : "#8C8CA1", minWidth: open ? 40 : "unset", justifyContent: "center" }}>{item.icon}</ListItemIcon>
                {open && <ListItemText primary={item.label} secondary={item.hint} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 600 : 500, color: isActive ? "#fff" : "#8C8CA1" }} secondaryTypographyProps={{ fontSize: 11, color: isActive ? "rgba(255,255,255,0.7)" : "#6C6C80" }} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 1.5 }} />

      <Box sx={{ px: 1, pb: 0.5 }}>
        <Tooltip title={open ? "" : "Help Guide"} placement="right" arrow>
          <ListItemButton
            onClick={() => { setHelpOpen(true); handleNavClick(); }}
            sx={{
              borderRadius: 2, px: open ? 2 : 0,
              justifyContent: open ? "flex-start" : "center", minHeight: 46,
              background: "rgba(255,107,138,0.08)",
              "&:hover": { background: "rgba(255,107,138,0.15)" },
            }}
          >
            <ListItemIcon sx={{ color: "#FF6B8A", minWidth: open ? 40 : "unset", justifyContent: "center" }}><HelpOutline /></ListItemIcon>
            {open && <ListItemText primary="Help Guide" primaryTypographyProps={{ fontSize: 14, fontWeight: 600, color: "#FF6B8A" }} />}
          </ListItemButton>
        </Tooltip>
      </Box>

      <Box sx={{ p: open ? 2 : 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: open ? 1.5 : 0.5, borderRadius: 2, background: "rgba(255,255,255,0.04)", justifyContent: open ? "flex-start" : "center" }}>
          <Avatar sx={{ width: 36, height: 36, background: "linear-gradient(135deg, #FF6B8A, #FF8FA8)", fontSize: 15, fontWeight: 700, borderRadius: "50%" }}>{userInitial}</Avatar>
          {open && (
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="body2" fontWeight={600} noWrap sx={{ color: "#fff", lineHeight: 1.3 }}>{userName}</Typography>
              <Typography variant="caption" noWrap sx={{ color: "#8C8CA1", fontSize: 11 }}>{user?.email}</Typography>
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", justifyContent: open ? "space-between" : "center", gap: 0.5 }}>
          <Tooltip title="Settings" placement="top">
            <IconButton size="small" sx={{ color: "#8C8CA1", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.08)" } }}>
              <Settings fontSize="small" />
            </IconButton>
          </Tooltip>
          {open && (
            <Tooltip title="Logout" placement="top">
              <IconButton size="small" onClick={handleLogout} sx={{ color: "#8C8CA1", "&:hover": { color: "#FD397A", bgcolor: "rgba(253,57,122,0.1)" } }}>
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {variant === "permanent" && (
        <Box sx={{ display: "flex", justifyContent: "center", pb: 1.5 }}>
          <IconButton onClick={onToggle} size="small" sx={{ color: "#8C8CA1", bgcolor: "rgba(255,255,255,0.05)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)", color: "#fff" } }}>
            {open ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        </Box>
      )}

      <HelpGuide open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );

  const paperSx = {
    boxSizing: "border-box",
    background: "linear-gradient(180deg, #1E1E2D 0%, #1A1A2E 100%)",
    color: "#fff",
    borderRight: "none",
    overflow: "hidden",
    borderRadius: 0,
  };

  if (variant === "temporary") {
    return (
      <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose} ModalProps={{ keepMounted: true }}
        sx={{ "& .MuiDrawer-paper": { ...paperSx, width: DRAWER_WIDTH } }}>
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer variant="permanent"
      sx={{ width, flexShrink: 0, "& .MuiDrawer-paper": { ...paperSx, width, transition: "width 0.3s ease" } }}>
      {drawerContent}
    </Drawer>
  );
}
