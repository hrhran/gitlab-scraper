// src/renderer/pages/RunPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate } from 'react-router-dom';

function RunPage() {
  const navigate = useNavigate();

  // Form state
  const [mergeType, setMergeType] = useState('all');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groupRepos, setGroupRepos] = useState([]);

  const [startDate, setStartDate] = useState(todayString());
  const [endDate, setEndDate] = useState(todayString());
  const [ticketMode, setTicketMode] = useState(true);
  const [avoidTest, setAvoidTest] = useState(false);

  // Test pattern state
  const [testPatterns, setTestPatterns] = useState([]);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [newPattern, setNewPattern] = useState('');

  // Running state
  const [running, setRunning] = useState(false);

  useEffect(() => {
    loadGroups();
    loadTestPatterns();
  }, []);

  // Reload repos when selectedGroup changes
  useEffect(() => {
    if (selectedGroup) {
      loadGroupRepos(parseInt(selectedGroup, 10));
    } else {
      setGroupRepos([]);
    }
  }, [selectedGroup]);

  async function loadGroups() {
    const grp = await window.electronAPI.invoke('group:getAll');
    setGroups(grp);
  }

  async function loadTestPatterns() {
    const patterns = await window.electronAPI.invoke('testPattern:getAll');
    setTestPatterns(patterns);
  }

  async function loadGroupRepos(groupId) {
    const repos = await window.electronAPI.invoke('group:getRepos', groupId);
    setGroupRepos(repos);
  }

  async function handleDeletePattern(id) {
    await window.electronAPI.invoke('testPattern:delete', id);
    loadTestPatterns();
  }

  async function handleAddPattern() {
    if (!newPattern.trim()) return;
    await window.electronAPI.invoke('testPattern:create', newPattern.trim());
    setNewPattern('');
    setShowPatternModal(false);
    loadTestPatterns();
  }

  function isFormValid() {
    return selectedGroup && startDate && endDate;
  }

  async function handleRun() {
    if (!isFormValid()) return;
    setRunning(true);

    // Find group name for display in history
    const groupObj = groups.find((g) => g.id === parseInt(selectedGroup, 10));
    const groupName = groupObj ? groupObj.name : 'Unknown';

    const runParams = {
      groupId: selectedGroup,
      groupName,
      startDate: toDDMMYYYY(startDate),
      endDate: toDDMMYYYY(endDate),
      mergeRequestType: mergeType,
      ticketMode,
      avoidTest,
      useFileDiff: true // always true
    };

    const result = await window.electronAPI.invoke('report:run', runParams);
    setRunning(false);

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      navigate(`/report/${result.historyEntry.id}`);
    }
  }

  async function handleCancel() {
    await window.electronAPI.invoke('report:cancel');
    setRunning(false);
  }

  function todayString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function toDDMMYYYY(isoDate) {
    const [yyyy, mm, dd] = isoDate.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Grid container spacing={2}>
        {/* Left Column: Full width on smaller screens, 8/12 on md+ */}
        <Grid item xs={12} md={8}>
          <Box>
            {/* First Row: Dropdowns */}
            <Grid container spacing={1}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={mergeType}
                    label="Type"
                    onChange={(e) => setMergeType(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="opened">Opened</MenuItem>
                    <MenuItem value="merged">Merged</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Group</InputLabel>
                  <Select
                    value={selectedGroup}
                    label="Select Group"
                    onChange={(e) => setSelectedGroup(e.target.value)}
                  >
                    {groups.map((grp) => (
                      <MenuItem key={grp.id} value={grp.id}>
                        {grp.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Second Row: Toggles */}
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <FormControlLabel
                  label="Task Only (#)"
                  control={
                    <Switch
                      size="small"
                      checked={ticketMode}
                      onChange={(e) => setTicketMode(e.target.checked)}
                    />
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  label="Exclude Test"
                  control={
                    <Switch
                      size="small"
                      checked={avoidTest}
                      onChange={(e) => setAvoidTest(e.target.checked)}
                    />
                  }
                />
              </Grid>
            </Grid>

            {/* Repo List */}
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Repositories in Group:
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                mt: 1,
                minHeight: 320,
                maxHeight: 300,
                overflowY: 'auto',
                p: 1,
              }}
            >
              {groupRepos.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  None
                </Typography>
              ) : (
                groupRepos.map((repo) => (
                  <Typography key={repo.id} variant="body2" sx={{ color: '#ccc' }}>
                    {repo.name}
                  </Typography>
                ))
              )}
            </Paper>
          </Box>
        </Grid>

        {/* Right Column: Test Patterns and Run/Cancel Buttons */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Test Patterns */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Test File Patterns</Typography>
                <IconButton size="small" onClick={() => setShowPatternModal(true)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
              <Paper
                variant="outlined"
                sx={{
                  mt: 1,
                  minHeight: 380,
                  maxHeight: 300,
                  overflowY: 'auto',
                }}
              >
                <List dense disablePadding>
                  {testPatterns.map((p) => (
                    <ListItem
                      key={p.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleDeletePattern(p.id)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={p.pattern} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>

            {/* Run and Cancel Buttons */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              {running ? (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCancel}
                    sx={{ height: 60, flex: 1 }}
                    startIcon={<CancelIcon />}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled
                    sx={{ height: 60, flex: 1 }}
                    endIcon={<CircularProgress size={24} color="inherit" />}
                  >
                    Running...
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!isFormValid()}
                  onClick={handleRun}
                  sx={{ height: 60, width: '100%' }}
                  endIcon={<ArrowForwardIosIcon />}
                >
                  Run
                </Button>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Modal to Add Pattern */}
      <Dialog open={showPatternModal} onClose={() => setShowPatternModal(false)}>
        <DialogTitle>Add Test Pattern</DialogTitle>
        <DialogContent>
          <TextField
            label="Pattern"
            fullWidth
            size="small"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPatternModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddPattern}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toDDMMYYYY(isoDate) {
  const [yyyy, mm, dd] = isoDate.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

export default RunPage;
