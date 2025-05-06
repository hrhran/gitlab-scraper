// src/renderer/pages/JsonRendererPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Avatar,
  Tooltip
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

function JsonRendererPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    (async () => {
      const entry = await window.electronAPI.invoke('history:getById', parseInt(id));
      if (entry) {
        setReportData(entry.resultJSON);
      }
    })();
  }, [id]);

  if (!reportData) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading report...</Typography>
      </Box>
    );
  }

  const { overall_total, overall_total_excluding_unassigned, ...repos } = reportData;

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 'calc(100vh - 160px)',
        overflowY: 'auto',
        p: 2
      }}
    >
      <Paper sx={{ p: 2, position: 'relative' }}>
        {/* Back Button */}
        <IconButton
          size="small"
          onClick={() => navigate(-1)}
          sx={{
            color: '#fff',
            backgroundColor: '#444',
            '&:hover': { backgroundColor: '#666' },
            mb: 2
          }}
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </IconButton>


        {/* Overall Totals */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box
            sx={{
              border: '1px solid #555',
              borderRadius: 1,
              p: 1,
              minWidth: 160
            }}
          >
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Excl. Unassigned
            </Typography>
            <Typography variant="body1">
              <span style={{ color: 'lightgreen' }}>
                +{overall_total_excluding_unassigned.total_additions}
              </span>{' '}
              <span style={{ color: 'salmon' }}>
                -{overall_total_excluding_unassigned.total_deletions}
              </span>
            </Typography>
          </Box>
          <Box
            sx={{
              border: '1px solid #555',
              borderRadius: 1,
              p: 1,
              minWidth: 160
            }}
          >
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Overall
            </Typography>
            <Typography variant="body1">
              <span style={{ color: 'lightgreen' }}>
                +{overall_total.total_additions}
              </span>{' '}
              <span style={{ color: 'salmon' }}>
                -{overall_total.total_deletions}
              </span>
            </Typography>
          </Box>
        </Box>

        {/* Repo-wise stats */}
        {Object.keys(repos).map((repoName) => {
          if (
            repoName === 'overall_total' ||
            repoName === 'overall_total_excluding_unassigned' ||
            repoName === 'user_wise'
          ) {
            return null;
          }
          const assignees = repos[repoName];

          return (
            <Box key={repoName} sx={{ borderTop: '1px solid #555', pt: 2, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                {repoName}
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(assignees).map(([assignee, stats]) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={assignee}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        backgroundColor: '#2e2e2e'
                      }}
                    >
                      {assignee === 'Unassigned' ? (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: '#555',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.8rem'
                          }}
                        >
                          ?
                        </Box>
                      ) : (
                        <Tooltip title={assignee}>
                          <Avatar
                            sx={{ width: 32, height: 32 }}
                            src={
                              stats.avatarUrl?.startsWith('/uploads/-/')
                                ? `https://gitlab.com${stats.avatarUrl}`
                                : stats.avatarUrl || ''
                            }
                          />
                        </Tooltip>
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {assignee}
                        </Typography>
                        <Typography variant="body2">
                          <span style={{ color: 'lightgreen' }}>+{stats.additions}</span>{' '}
                          <span style={{ color: 'salmon' }}>-{stats.deletions}</span>
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Paper>
    </Box>
  );
}

export default JsonRendererPage;
