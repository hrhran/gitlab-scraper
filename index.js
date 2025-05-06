const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Import your backend services or just the needed calls
const repoService = require('./src/backend/services/repoService');
const groupService = require('./src/backend/services/groupService');
const testPatternService = require('./src/backend/services/testPatternService');
const historyService = require('./src/backend/services/historyService');
const cookieService = require('./src/backend/services/cookieService');
const reportService = require('./src/backend/services/reportService');
const { setMainWindow } = require('./src/logger');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(__dirname, 'src', 'assets', 'scaper.png'),
    frame: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#222222',
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'renderer', 'preload.js')
    }
  });

  setMainWindow(mainWindow);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'build', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Basic app events
app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC for custom window controls
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('app:close', () => {
  if (mainWindow) mainWindow.close();
});
ipcMain.handle('app:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.handle('app:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handlers: Repos, Groups, Test Patterns, History
// ─────────────────────────────────────────────────────────────────────────────

// Repos
ipcMain.handle('repo:getAll', async () => repoService.getAllRepos());
ipcMain.handle('repo:create', async (_event, data) => repoService.createRepo(data));
ipcMain.handle('repo:update', async (_event, data) => repoService.updateRepo(data));
ipcMain.handle('repo:delete', async (_event, id) => repoService.deleteRepo(id));

// Groups
ipcMain.handle('group:getAll', async () => groupService.getAllGroups());
ipcMain.handle('group:create', async (_event, data) => groupService.createGroup(data));
ipcMain.handle('group:update', async (_event, data) => groupService.updateGroup(data));
ipcMain.handle('group:delete', async (_event, groupId) => groupService.deleteGroup(groupId));
ipcMain.handle('group:addRepo', async (_event, { groupId, repoId }) => groupService.addRepoToGroup(groupId, repoId));
ipcMain.handle('group:removeRepo', async (_event, { groupId, repoId }) => groupService.removeRepoFromGroup(groupId, repoId));

// This is the missing handler for 'group:getRepos':
ipcMain.handle('group:getRepos', async (_event, groupId) => groupService.getReposForGroup(groupId));

// Test Patterns
ipcMain.handle('testPattern:getAll', async () => testPatternService.getAllPatterns());
ipcMain.handle('testPattern:create', async (_event, pattern) => testPatternService.createPattern(pattern));
ipcMain.handle('testPattern:delete', async (_event, id) => testPatternService.deletePattern(id));

// History
ipcMain.handle('history:getAll', async () => historyService.getAllHistory());
ipcMain.handle('history:getById', async (_event, id) => historyService.getHistoryById(id));

// ─────────────────────────────────────────────────────────────────────────────
// IPC Handler: Run the "report"
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.handle('report:run', async (_event, runParams) => {
  try {
    const result = await reportService.runReport(runParams);
    if (result && result.error) {
      throw new Error(result.error);
    }
    const historyEntry = await historyService.saveRunHistory(runParams, result);
    return { result, historyEntry };
  } catch (err) {
    console.error('report:run error =>', err);
    return { error: err.message };
  }
});

// Optional: Refresh cookie from Chrome
ipcMain.handle('cookie:refreshFromChrome', async () => {
  try {
    const cookieObj = await cookieService.fetchCookieFromChrome();
    return { success: true, cookie: cookieObj };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('report:cancel', async () => {
  const { cancelReportRun } = require('./src/backend/services/reportService');
  cancelReportRun();
  return { success: true };
});




