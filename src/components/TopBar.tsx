"use client";
import {
  Box, Typography, Avatar, IconButton, InputBase, Badge, Tooltip,
  Menu, MenuItem as MuiMenuItem, ListItemIcon, Divider, Breadcrumbs, Link,
  Popover, List, ListItem, ListItemText, Button, Chip,
} from "@mui/material";
import {
  Search, Notifications, Logout, Person, Home, NavigateNext,
  Menu as MenuIcon, DarkMode, LightMode, DoneAll, Circle, HelpOutline,
} from "@mui/icons-material";
import HelpGuide from "@/components/HelpGuide";
import { useAuth } from "@/context/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { useThemeMode } from "@/theme/ThemeRegistry";
import { useNotifications } from "@/hooks/useNotifications";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

type Props = {
  title: string;
  activeNav: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
};

const NOTIF_COLORS: Record<string, string> = {
  settlement: "#FFB822",
  contribution: "#1DC9B7",
  expense: "#FD397A",
  group: "#6C63FF",
  reminder: "#FF6B8A",
};

export default function TopBar({ title, activeNav, onMenuClick, showMenuButton }: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { mode, toggleMode } = useThemeMode();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const userName = user?.displayName || user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const isDark = mode === "dark";

  const handleLogout = async () => {
    setAnchorEl(null);
    await signOut(auth);
    showToast("Logged out successfully", "info");
    setTimeout(() => router.push("/auth/login"), 500);
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Box
      sx={{
        height: { xs: 56, md: 64 },
        display: "flex", alignItems: "center", justifyContent: "space-between",
        px: { xs: 1.5, md: 3 },
        bgcolor: "background.paper",
        borderBottom: 1, borderColor: "divider",
        position: "sticky", top: 0, zIndex: 10, gap: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        {showMenuButton && (
          <IconButton onClick={onMenuClick} size="small" sx={{ color: "text.primary" }}>
            <MenuIcon />
          </IconButton>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Breadcrumbs
            separator={<NavigateNext sx={{ fontSize: 14, color: "text.secondary" }} />}
            sx={{ display: { xs: "none", sm: "flex" }, mb: 0.3, "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" } }}
          >
            <Link underline="hover" onClick={() => router.push("/dashboard")}
              sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", "&:hover": { color: "#6C63FF" } }}>
              <Home sx={{ fontSize: 16 }} /> Home
            </Link>
            <Typography sx={{ fontSize: 13, color: "text.primary", fontWeight: 600, whiteSpace: "nowrap" }}>{title}</Typography>
          </Breadcrumbs>
          <Typography variant="h6" fontWeight={700} color="text.primary" noWrap sx={{ lineHeight: 1.2, fontSize: { xs: "1rem", md: "1.25rem" } }}>
            {title}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 1 }, flexShrink: 0 }}>
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#F2F3F8", borderRadius: 2, px: 1.5, py: 0.5, width: 200 }}>
          <Search sx={{ color: "text.secondary", fontSize: 20, mr: 0.5 }} />
          <InputBase placeholder="Search..." sx={{ fontSize: 14, flex: 1, color: "text.primary" }} />
        </Box>

        <Tooltip title="Help Guide">
          <IconButton size="small" onClick={() => setHelpOpen(true)} sx={{ color: "text.secondary" }}>
            <HelpOutline fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={isDark ? "Light Mode" : "Dark Mode"}>
          <IconButton size="small" onClick={toggleMode} sx={{ color: "text.secondary" }}>
            {isDark ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton size="small" onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ color: "text.secondary" }}>
            <Badge badgeContent={unreadCount} color="error" sx={{ "& .MuiBadge-badge": { fontSize: 10, height: 18, minWidth: 18 } }}>
              <Notifications fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Notification Popover */}
        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { width: { xs: 300, sm: 360 }, maxHeight: 420, mt: 1, borderRadius: 3 } } }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" startIcon={<DoneAll sx={{ fontSize: 14 }} />} onClick={markAllRead}
                sx={{ textTransform: "none", fontSize: 12, fontWeight: 600 }}>
                Mark all read
              </Button>
            )}
          </Box>
          <Divider />
          {notifications.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">No notifications yet</Typography>
            </Box>
          ) : (
            <List sx={{ py: 0, maxHeight: 340, overflow: "auto" }}>
              {notifications.slice(0, 20).map((n) => (
                <ListItem key={n.id} onClick={() => { markAsRead(n.id); if (n.group_id) router.push(`/groups/${n.group_id}`); }}
                  sx={{
                    cursor: "pointer", py: 1.5, px: 2,
                    bgcolor: n.read ? "transparent" : isDark ? "rgba(108,99,255,0.06)" : "#6C63FF06",
                    "&:hover": { bgcolor: "action.hover" },
                    borderBottom: "1px solid", borderColor: "divider",
                  }}>
                  <Box sx={{ display: "flex", gap: 1.5, width: "100%" }}>
                    {!n.read && <Circle sx={{ fontSize: 8, color: "#6C63FF", mt: 0.8, flexShrink: 0 }} />}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" fontWeight={n.read ? 500 : 700} noWrap>{n.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontSize: 10 }}>
                          {getRelativeTime(n.created_at)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2 }}>{n.message}</Typography>
                      <Chip label={n.type} size="small"
                        sx={{ mt: 0.5, height: 18, fontSize: 10, fontWeight: 600, bgcolor: `${NOTIF_COLORS[n.type] || "#6C63FF"}15`, color: NOTIF_COLORS[n.type] || "#6C63FF" }} />
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Popover>

        <Avatar onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ width: 32, height: 32, background: "linear-gradient(135deg, #6C63FF, #8B83FF)", cursor: "pointer", fontSize: 14, fontWeight: 700, borderRadius: "50%", "&:hover": { boxShadow: "0 0 0 3px rgba(108,99,255,0.2)" } }}>
          {userInitial}
        </Avatar>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{ paper: { sx: { mt: 1, minWidth: 200, borderRadius: 0 } } }}>
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>{userName}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider />
          <MuiMenuItem disabled>
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            Profile
          </MuiMenuItem>
          <MuiMenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
            <ListItemIcon><Logout fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
            Logout
          </MuiMenuItem>
        </Menu>

        <HelpGuide open={helpOpen} onClose={() => setHelpOpen(false)} />
      </Box>
    </Box>
  );
}
