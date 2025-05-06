// src/logger.js
let mainWindow = null;

function setMainWindow(win) {
  mainWindow = win;
}

function logToRenderer(message) {
  if (mainWindow) {
    mainWindow.webContents.send('console:log', message);
  }
}

module.exports = { setMainWindow, logToRenderer };
