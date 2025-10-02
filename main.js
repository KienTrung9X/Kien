
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Path to the JSON database file
// In production, place the database file next to the executable.
const dbPath = process.env.NODE_ENV === 'development'
  ? path.join(__dirname, 'database.json')
  : path.join(path.dirname(app.getPath('exe')), 'database.json');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile('index.html');
  win.setMenuBarVisibility(false); // Hide the default menu bar
}

app.whenReady().then(() => {
  // Ensure the database file exists on first run
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([]), 'utf-8');
  }

  // IPC handler to load data from the JSON file
  ipcMain.handle('load-data', async () => {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to read database file:', error);
      return []; // Return empty array on error
    }
  });

  // IPC handler to save data to the JSON file
  ipcMain.handle('save-data', async (event, data) => {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Failed to write to database file:', error);
      return { success: false, error: error.message };
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
