// src/renderer/components/NavBar.jsx
import React from 'react';
import { Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

function NavBar() {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 40, // Below the TitleBar's 40px height
        left: 0,
        width: '100%',
        height: 36,
        backgroundColor: '#222',
        display: 'flex',
        alignItems: 'center',
        px: 2,
        gap: 2,
        zIndex: 9998,
      }}
    >
      <Button
        component={RouterLink}
        to="/"
        size="small"
        sx={{ color: '#ccc', minWidth: 60 }}
      >
        Run
      </Button>
      <Button
        component={RouterLink}
        to="/groups"
        size="small"
        sx={{ color: '#ccc', minWidth: 60 }}
      >
        Groups
      </Button>
      <Button
        component={RouterLink}
        to="/history"
        size="small"
        sx={{ color: '#ccc', minWidth: 60 }}
      >
        History
      </Button>
    </Box>
  );
}

export default NavBar;
