// src/renderer/pages/GroupsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Delete, Edit, Add, ManageAccounts } from '@mui/icons-material';

function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [repos, setRepos] = useState([]);

  // Group dialog
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState('');

  // Manage repos for a specific group
  const [openRepoDialog, setOpenRepoDialog] = useState(false);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupRepos, setGroupRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');

  // Create new repo
  const [openNewRepoDialog, setOpenNewRepoDialog] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [repoPath, setRepoPath] = useState('');

  // All Repositories modal
  const [openAllReposDialog, setOpenAllReposDialog] = useState(false);

  // Edit repo dialog
  const [openEditRepoDialog, setOpenEditRepoDialog] = useState(false);
  const [editingRepo, setEditingRepo] = useState(null);
  const [editRepoName, setEditRepoName] = useState('');
  const [editRepoPath, setEditRepoPath] = useState('');

  useEffect(() => {
    loadGroups();
    loadRepos();
  }, []);

  async function loadGroups() {
    const result = await window.electronAPI.invoke('group:getAll');
    setGroups(result);
  }
  async function loadRepos() {
    const r = await window.electronAPI.invoke('repo:getAll');
    setRepos(r);
  }
  async function loadGroupRepos(groupId) {
    const r = await window.electronAPI.invoke('group:getRepos', groupId);
    setGroupRepos(r);
  }

  // Group CRUD
  async function handleSaveGroup() {
    if (editingGroup) {
      await window.electronAPI.invoke('group:update', { id: editingGroup.id, name: groupName });
    } else {
      await window.electronAPI.invoke('group:create', { name: groupName });
    }
    setOpenGroupDialog(false);
    setGroupName('');
    setEditingGroup(null);
    loadGroups();
  }
  function handleEditGroup(g) {
    setEditingGroup(g);
    setGroupName(g.name);
    setOpenGroupDialog(true);
  }
  async function handleDeleteGroup(g) {
    if (window.confirm(`Delete group "${g.name}"?`)) {
      await window.electronAPI.invoke('group:delete', g.id);
      loadGroups();
    }
  }

  // Manage Repositories for group
  function handleManageRepos(g) {
    setCurrentGroup(g);
    loadGroupRepos(g.id);
    setOpenRepoDialog(true);
  }
  async function handleAddRepoToGroup() {
    if (!selectedRepo) return;
    await window.electronAPI.invoke('group:addRepo', { groupId: currentGroup.id, repoId: selectedRepo });
    loadGroupRepos(currentGroup.id);
    setSelectedRepo('');
  }
  async function handleRemoveRepoFromGroup(repoId) {
    await window.electronAPI.invoke('group:removeRepo', { groupId: currentGroup.id, repoId });
    loadGroupRepos(currentGroup.id);
  }

  // Create a new repo
  async function handleCreateNewRepo() {
    if (!repoName.trim() || !repoPath.trim()) return;
    await window.electronAPI.invoke('repo:create', { name: repoName.trim(), gitlabPath: repoPath.trim() });
    setOpenNewRepoDialog(false);
    setRepoName('');
    setRepoPath('');
    loadRepos();
  }

  // All Repos modal: we can edit or delete repos from DB
  function openAllRepos() {
    setOpenAllReposDialog(true);
  }
  function closeAllRepos() {
    setOpenAllReposDialog(false);
  }
  function openEditRepoModal(repo) {
    setEditingRepo(repo);
    setEditRepoName(repo.name);
    setEditRepoPath(repo.gitlabPath);
    setOpenEditRepoDialog(true);
  }
  async function handleSaveRepoEdit() {
    if (!editingRepo) return;
    await window.electronAPI.invoke('repo:update', {
      id: editingRepo.id,
      name: editRepoName.trim(),
      gitlabPath: editRepoPath.trim()
    });
    setOpenEditRepoDialog(false);
    setEditingRepo(null);
    loadRepos();
  }
  async function handleDeleteRepoFromDB(repo) {
    if (
      window.confirm(
        `Delete repository "${repo.name}" from DB?\nThis also removes it from all groups.`
      )
    ) {
      await window.electronAPI.invoke('repo:delete', repo.id);
      loadRepos();
    }
  }

  return (
    <Box sx={{ width: '100%', minHeight: 'calc(100vh - 160px)', overflowY: 'auto', p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Groups & Repositories
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenGroupDialog(true)}
            size="small"
          >
            Add Group
          </Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setOpenNewRepoDialog(true)}
            size="small"
          >
            Add Repository
          </Button>
          <Button
            variant="outlined"
            onClick={openAllRepos}
            size="small"
          >
            All Repositories
          </Button>
        </Box>

        {/* Groups List */}
        <List dense sx={{ border: '1px solid #555', borderRadius: 1, maxHeight: 300, overflowY: 'auto' }}>
          {groups.map((group) => (
            <ListItem
              key={group.id}
              secondaryAction={
                <>
                  <IconButton onClick={() => handleManageRepos(group)} size="small">
                    <ManageAccounts fontSize="inherit" />
                  </IconButton>
                  <IconButton onClick={() => handleEditGroup(group)} size="small">
                    <Edit fontSize="inherit" />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteGroup(group)} size="small">
                    <Delete fontSize="inherit" />
                  </IconButton>
                </>
              }
            >
              <ListItemText primary={group.name} />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Group Dialog */}
      <Dialog open={openGroupDialog} onClose={() => setOpenGroupDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingGroup ? 'Edit Group' : 'Add Group'}</DialogTitle>
        <DialogContent sx={{ maxHeight: 300, overflowY: 'auto' }}>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            size="small"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGroupDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveGroup}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Manage Repos for a Group */}
      <Dialog open={openRepoDialog} onClose={() => setOpenRepoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Repositories for {currentGroup?.name}</DialogTitle>
        <DialogContent sx={{ maxHeight: 400, overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Repository</InputLabel>
              <Select
                value={selectedRepo}
                label="Select Repository"
                onChange={(e) => setSelectedRepo(e.target.value)}
              >
                {repos.map((repo) => (
                  <MenuItem key={repo.id} value={repo.id}>
                    {repo.name} - {repo.gitlabPath}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" onClick={handleAddRepoToGroup} size="small">
              Add
            </Button>
          </Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Current Repositories in Group:
          </Typography>
          <List dense sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #555', borderRadius: 1 }}>
            {groupRepos.map((repo) => (
              <ListItem
                key={repo.id}
                secondaryAction={
                  <IconButton onClick={() => handleRemoveRepoFromGroup(repo.id)} size="small">
                    <Delete fontSize="inherit" />
                  </IconButton>
                }
              >
                <ListItemText primary={`${repo.name} - ${repo.gitlabPath}`} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRepoDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create New Repository Dialog */}
      <Dialog open={openNewRepoDialog} onClose={() => setOpenNewRepoDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Repository</DialogTitle>
        <DialogContent sx={{ maxHeight: 300, overflowY: 'auto' }}>
          <TextField
            margin="dense"
            label="Repository Name"
            fullWidth
            size="small"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="GitLab Path"
            fullWidth
            size="small"
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            helperText="e.g., tekion/development/tap/im/be/tap-crm-implementations-backend"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewRepoDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateNewRepo}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* All Repositories Dialog (Edit/Delete from DB) */}
      <Dialog open={openAllReposDialog} onClose={closeAllRepos} maxWidth="sm" fullWidth>
        <DialogTitle>All Repositories (DB)</DialogTitle>
        <DialogContent sx={{ maxHeight: 400, overflowY: 'auto' }}>
          <List dense sx={{ border: '1px solid #555', borderRadius: 1 }}>
            {repos.map((repo) => (
              <ListItem
                key={repo.id}
                secondaryAction={
                  <>
                    <IconButton
                      onClick={() => openEditRepoModal(repo)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteRepoFromDB(repo)} size="small">
                      <Delete fontSize="inherit" />
                    </IconButton>
                  </>
                }
              >
                <ListItemText primary={`${repo.name} - ${repo.gitlabPath}`} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAllRepos}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Repo Dialog */}
      <Dialog open={openEditRepoDialog} onClose={() => setOpenEditRepoDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Repository</DialogTitle>
        <DialogContent sx={{ maxHeight: 300, overflowY: 'auto' }}>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            size="small"
            value={editRepoName}
            onChange={(e) => setEditRepoName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="GitLab Path"
            fullWidth
            size="small"
            value={editRepoPath}
            onChange={(e) => setEditRepoPath(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditRepoDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRepoEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GroupsPage;
