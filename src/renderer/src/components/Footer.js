// src/renderer/components/Footer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

function Footer() {
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);
  const isListenerSet = useRef(false);

  useEffect(() => {
    if (!isListenerSet.current) {
      const handleConsoleLog = (_event, message) => {
        setLogs(prev => [...prev, message]);
      };
      window.electronAPI.on('console:log', handleConsoleLog);
      isListenerSet.current = true;
      return () => {
        window.electronAPI.removeListener('console:log', handleConsoleLog);
        isListenerSet.current = false;
      };
    }
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => setLogs([]);

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        backgroundColor: '#1e1e1e',
        borderTop: '1px solid #333',
        color: '#ccc',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        fontSize: '0.8rem',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, backgroundColor: '#2d2d2d' }}>
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          Console
        </Typography>
        <IconButton onClick={clearLogs} size="small" sx={{ color: '#ccc' }}>
          <ClearIcon fontSize="inherit" />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }} ref={logContainerRef}>
        {logs.map((log, idx) => (
          <Typography key={idx} variant="body2" sx={{ fontFamily: 'monospace' }}>
            {log}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default Footer;
