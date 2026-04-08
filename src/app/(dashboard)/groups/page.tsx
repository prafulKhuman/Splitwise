"use client";
import { useState } from "react";
import {
  Box, Paper, Typography, Button, Chip, Avatar, AvatarGroup,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import {
  Add, Group as GroupIcon, ArrowForward, Delete,
  WarningAmber, Archive, DeleteForever, RestoreFromTrash,
} from "@mui/icons-material";
import { useGroups } from "@/hooks/useGroups";
import CreateGroupDialog from "@/components/groups/CreateGroupDialog";
import PageSkeleton from "@/components/PageSkeleton";
import NoData from "@/components/NoData";
import Link from "next/link";

export default function GroupsPage() {
  const { groups, loading, createGroup, archiveGroup, restoreGroup, deleteGroup, isAdmin } = useGroups();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; isDisabled: boolean } | null>(null);

  if (loading) return <PageSkeleton variant="cards" />;

  const handleArchive = async () => {
    if (!deleteTarget) return;
    await archiveGroup(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleRestore = async () => {
    if (!deleteTarget) return;
    await restoreGroup(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleHardDelete = async () => {
    if (!deleteTarget) return;
    await deleteGroup(deleteTarget.id);
    setDeleteTarget(null);
  };

  const activeGroups = groups.filter((g) => !g.is_disabled);
  const archivedGroups = groups.filter((g) => g.is_disabled);

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>My Groups</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}
          sx={{ background: "linear-gradient(135deg, #6C63FF, #8B83FF)", "&:hover": { background: "linear-gradient(135deg, #4B44CC, #6C63FF)" }, minWidth: "auto" }}>
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Create Group</Box>
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>Create</Box>
        </Button>
      </Box>

      {groups.length === 0 ? (
        <NoData message="No groups yet" sub="Create a group to start splitting expenses with friends." />
      ) : (
        <>
          {/* Active Groups */}
          {activeGroups.length > 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2, mb: archivedGroups.length > 0 ? 3 : 0 }}>
              {activeGroups.map((group) => (
                <Paper key={group.id} component={Link} href={`/groups/${group.id}`}
                  sx={{
                    p: { xs: 2, sm: 3 }, textDecoration: "none", color: "inherit",
                    transition: "transform 0.2s, box-shadow 0.2s", position: "relative",
                    "&:hover": { transform: "translateY(-4px)", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" },
                    display: "flex", flexDirection: "column", gap: 1.5,
                  }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, background: "linear-gradient(135deg, #6C63FF, #8B83FF)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <GroupIcon sx={{ color: "#fff" }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body1" fontWeight={700} noWrap>{group.name}</Typography>
                      {group.description && <Typography variant="caption" color="text.secondary" noWrap>{group.description}</Typography>}
                    </Box>
                    {isAdmin(group) ? (
                      <Tooltip title="Manage group" arrow>
                        <IconButton size="small"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget({ id: group.id, name: group.name, isDisabled: false }); }}
                          sx={{ color: "#B5B5C3", "&:hover": { color: "#FD397A", bgcolor: "#FD397A10" } }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <ArrowForward sx={{ color: "#B5B5C3", fontSize: 20 }} />
                    )}
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

          {/* Archived Groups */}
          {archivedGroups.length > 0 && (
            <>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 1.5 }}>
                Archived Groups
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2 }}>
                {archivedGroups.map((group) => (
                  <Paper key={group.id} component={Link} href={`/groups/${group.id}`}
                    sx={{
                      p: { xs: 2, sm: 3 }, textDecoration: "none", color: "inherit", opacity: 0.6,
                      transition: "transform 0.2s, box-shadow 0.2s", position: "relative",
                      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 15px rgba(0,0,0,0.06)", opacity: 0.8 },
                      display: "flex", flexDirection: "column", gap: 1.5,
                    }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: "#E0E0E0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Archive sx={{ color: "#999" }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={700} noWrap>{group.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Archived</Typography>
                      </Box>
                      {isAdmin(group) && (
                        <Tooltip title="Manage group" arrow>
                          <IconButton size="small"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget({ id: group.id, name: group.name, isDisabled: true }); }}
                            sx={{ color: "#B5B5C3", "&:hover": { color: "#FD397A", bgcolor: "#FD397A10" } }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <AvatarGroup max={4} sx={{ "& .MuiAvatar-root": { width: 28, height: 28, fontSize: 12 } }}>
                        {group.members.map((m) => (
                          <Avatar key={m.uid} sx={{ bgcolor: "#B5B5C3" }}>{m.displayName.charAt(0).toUpperCase()}</Avatar>
                        ))}
                      </AvatarGroup>
                      <Chip label="Archived" size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: "#B5B5C315", color: "#B5B5C3" }} />
                    </Box>
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </>
      )}

      {/* Delete / Archive Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <Box sx={{ background: "linear-gradient(135deg, #FD397A, #FF6B8A)", px: 3, py: 2, color: "#fff" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <WarningAmber />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>Manage Group</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>{deleteTarget?.name}</Typography>
            </Box>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {/* Restore option for archived groups */}
            {deleteTarget?.isDisabled && (
              <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, borderColor: "success.light", bgcolor: "#1DC9B708" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <RestoreFromTrash sx={{ fontSize: 16, color: "success.main" }} />
                      <Typography variant="body2" fontWeight={600} color="success.dark">Restore Group</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">Re-enable this group and all features</Typography>
                  </Box>
                  <Button color="success" size="small" variant="contained" disableElevation
                    onClick={handleRestore}
                    sx={{ textTransform: "none", borderRadius: 1.5, minWidth: 80, fontSize: 12 }}>
                    Restore
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Archive option for active groups */}
            {!deleteTarget?.isDisabled && (
              <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, borderColor: "warning.light", bgcolor: "#FFB82208" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Archive sx={{ fontSize: 16, color: "warning.main" }} />
                      <Typography variant="body2" fontWeight={600} color="warning.dark">Archive Group</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">Disable all features, keep data safe</Typography>
                  </Box>
                  <Button color="warning" size="small" variant="contained" disableElevation
                    onClick={handleArchive}
                    sx={{ textTransform: "none", borderRadius: 1.5, minWidth: 80, fontSize: 12 }}>
                    Archive
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Hard delete */}
            <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, borderColor: "error.light", bgcolor: "#FD397A08" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <DeleteForever sx={{ fontSize: 16, color: "error.main" }} />
                    <Typography variant="body2" fontWeight={600} color="error">Delete Permanently</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">Remove everything forever, cannot undo</Typography>
                </Box>
                <Button color="error" size="small" variant="contained" disableElevation
                  onClick={handleHardDelete}
                  sx={{ textTransform: "none", borderRadius: 1.5, minWidth: 80, fontSize: 12 }}>
                  Delete
                </Button>
              </Box>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <CreateGroupDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={createGroup} />
    </>
  );
}
