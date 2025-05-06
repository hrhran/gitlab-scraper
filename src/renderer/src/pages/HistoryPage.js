// src/renderer/pages/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const result = await window.electronAPI.invoke('history:getAll');
    setHistory(result);
  }

  return (
    <Box sx={{ width: '100%', minHeight: 'calc(100vh - 160px)', overflowY: 'auto', p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom>
          Run History
        </Typography>
        <Grid container spacing={1}>
          {history.map((entry) => {
            const rp = entry.runParams || {};
            const groupName = rp.groupName || 'N/A';
            const dateRange = `${rp.startDate || ''} - ${rp.endDate || ''}`;
            // Local time
            const createdAt = new Date(entry.createdAt).toLocaleString();

            return (
              <Grid item xs={12} key={entry.id}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {groupName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ccc' }}>
                      {dateRange}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {rp.ticketMode && (
                        <Chip
                          label="Task Only"
                          size="small"
                          variant="outlined"
                          sx={{
                            mr: 0.5,
                            borderColor: '#aaa',
                            color: '#aaa',
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                      {rp.avoidTest && (
                        <Chip
                          label="Exclude Test"
                          size="small"
                          variant="outlined"
                          sx={{
                            mr: 0.5,
                            borderColor: '#aaa',
                            color: '#aaa',
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: '#888', display: 'block', mt: 0.5 }}
                    >
                      {createdAt}
                    </Typography>
                  </CardContent>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate(`/report/${entry.id}`)}
                    sx={{ ml: 1 }}
                  >
                    View Report
                  </Button>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );
}

export default HistoryPage;
