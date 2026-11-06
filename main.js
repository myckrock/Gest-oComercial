const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');

let autoUpdater;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch (_) {
  autoUpdater = null;
}

const APP_VERSION = app.getVersion();
const UPDATE_CONFIG = {
  owner: process.env.UPDATE_OWNER || '',
  repo: process.env.UPDATE_REPO || '',
};

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Gestão Comercial',
    backgroundColor: '#f6f7fb',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    show: false
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => win.show());
}

function setupAutoUpdate() {
  if (!autoUpdater || !UPDATE_CONFIG.owner || !UPDATE_CONFIG.repo) return;

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: UPDATE_CONFIG.owner,
    repo: UPDATE_CONFIG.repo,
    private: false
  });

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', async (info) => {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Nova atualização disponível',
      message: `A versão ${info.version} do Gestão Comercial está disponível.`,
      detail: 'Deseja baixar e instalar a atualização agora?',
      buttons: ['Atualizar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1
    });
    if (result.response === 0) autoUpdater.downloadUpdate();
  });

  autoUpdater.on('update-downloaded', async () => {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'Atualização pronta',
      message: 'A nova versão foi baixada.',
      detail: 'O aplicativo será reiniciado para concluir a atualização.',
      buttons: ['Reiniciar e atualizar', 'Depois'],
      defaultId: 0,
      cancelId: 1
    });
    if (result.response === 0) {
      setImmediate(() => autoUpdater.quitAndInstall(false, true));
    }
  });

  autoUpdater.on('error', (error) => {
    console.error('Erro no atualizador:', error);
  });

  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5000);
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdate();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app-version', () => APP_VERSION);
ipcMain.handle('open-external', (_event, url) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) return shell.openExternal(url);
});
