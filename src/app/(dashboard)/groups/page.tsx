"use client";
import { useState } from "react";
import { Box, Paper, Typography, Button, Chip, Avatar, AvatarGroup } from "@mui/material";
import { Add, Group as GroupIcon, ArrowForward } from "@mui/icons-material";
import { useGroups } from "@/hooks/useGroups";
import CreateGroupDialog from "@/components/groups/CreateGroupDialog";
import PageSkeleton from "@/components/PageSkeleton";
import NoData from "@/components/NoData";
import Link from "next/link";

export default function GroupsPage() {
  const { groups, loading, createGroup, isAdmin } = useGroups();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) return <PageSkeleton variant="cards" />;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>My Groups</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
          sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)", "&:hover": { background: "linear-gradient(135deg, #4B44CC, #6C63FF)" } }}>
          Create Group
        </Button>
      </Box>

      {groups.length === 0 ? (
        <NoData message="No groups yet" sub="Create a group to start splitting expenses with friends." />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
          {groups.map((group) => (
            <Paper key={group.id} component={Link} href={`/groups/${group.id}`}
              sx={{
                p: 3, textDecoration: "none", color: "inherit",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" },
                display: "flex", flexDirection: "column", gap: 1.5,
              }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, background: "linear-gradient(135deg, #6C63FF, #8B83FF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GroupIcon sx={{ color: "#fff" }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" fontWeight={700} noWrap>{group.name}</Typography>
                  {group.description && <Typography variant="caption" color="text.secondary" noWrap>{group.description}</Typography>}
                </Box>
                <ArrowForward sx={{ color: "#B5B5C3", fontSize: 20 }} />
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 28, height: 28, fontSize: 12 } }}>
                  {group.members.map((m) => (
                    <Avatar key={m.uid} sx={{ bgcolor: "#6C63FF" }}>{m.displayName.charAt(0).toUpperCase()}</Avatar>
                  ))}
                </AvatarGroup>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Chip label={`${group.members.length} members`} size="small" sx={{ fontWeight: 600, fontSize: 11 }} />
                  {isAdmin(group) && <Chip label="Admin" size="small" color="primary" sx={{ fontWeight: 600, fontSize: 11 }} />}
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <CreateGroupDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={createGroup} />
    </>
  );
}
