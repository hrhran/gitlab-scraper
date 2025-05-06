// src/renderer/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import darkTheme from './theme';

import TitleBar from './components/TitleBar';
import NavBar from './components/Navbar';
import Footer from './components/Footer';

import RunPage from './pages/RunPage';
import GroupsPage from './pages/GroupsPage';
import HistoryPage from './pages/HistoryPage';
import JsonRendererPage from './pages/JsonRendererPage';

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <TitleBar />
        <NavBar />
        {/* Main content area: margin top for TitleBar + NavBar */}
        <Box sx={{ mt: '76px', mb: '150px', px: 2 }}>
          <Routes>
            <Route path="/" element={<RunPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/report/:id" element={<JsonRendererPage />} />
          </Routes>
        </Box>
        <Footer />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
