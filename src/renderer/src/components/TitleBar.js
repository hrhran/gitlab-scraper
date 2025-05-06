// src/renderer/components/TitleBar.jsx
import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import MinimizeIcon from '@mui/icons-material/Minimize';
import CloseIcon from '@mui/icons-material/Close';
import CropSquareIcon from '@mui/icons-material/CropSquare'; // or a different icon
import { Link as RouterLink } from 'react-router-dom';

/**
 * A custom title bar for a frameless window.
 * The container has -webkit-app-region: drag for dragging.
 * The buttons have -webkit-app-region: no-drag to remain clickable.
 */
function TitleBar() {
  const handleClose = () => {
    window.electronAPI.invoke('app:close');
  };

  const handleMinimize = () => {
    window.electronAPI.invoke('app:minimize');
  };

  const handleMaximize = () => {
    window.electronAPI.invoke('app:maximize');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: 40,
        backgroundColor: '#333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 9999,
        WebkitAppRegion: 'drag',
      }}
    >

      {/* Right side (window buttons) */}
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
        <Typography variant="subtitle1" sx={{ mx: 2 }}>
          <RouterLink to="/" style={{ textDecoration: 'none', color: '#fff' }}>
            Gitlab Scrapper
          </RouterLink>
        </Typography>
        <Typography variant="body2" sx={{ color: '#aaa' }}>
          TAP
        </Typography>
      </Box>

    </Box>
  );
}

export default TitleBar;
