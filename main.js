const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let botProcess = null
let manualStop = false

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    backgroundColor: '#111827',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (botProcess) botProcess.kill()
  app.quit()
})

// ---------- BOT START ----------
ipcMain.handle('bot-start', async () => {
  if (botProcess) return { status: 'already-running' }

  manualStop = false
  const botPath = path.join(__dirname, 'bot', 'index.js')

  botProcess = spawn(process.execPath, [botPath], {
    cwd: path.join(__dirname, 'bot'),
    env: { ...process.env }
  })

  botProcess.stdout.on('data', data => {
    mainWindow.webContents.send('bot-log', data.toString())
  })

  botProcess.stderr.on('data', data => {
    mainWindow.webContents.send('bot-log', '[ERR] ' + data.toString())
  })

  botProcess.on('close', code => {
    mainWindow.webContents.send('bot-status', 'stopped')
    mainWindow.webContents.send('bot-log', `Bot stopped with code ${code}\n`)
    botProcess = null

    if (!manualStop && code !== 0) {
      mainWindow.webContents.send('bot-log', '[APP] Crash détecté, redémarrage dans 3s...\n')
      setTimeout(() => ipcMain.emit('bot-start'), 3000)
    }
  })

  mainWindow.webContents.send('bot-status', 'running')
  return { status: 'started' }
})

// ---------- BOT STOP ----------
ipcMain.handle('bot-stop', async () => {
  if (!botProcess) return { status: 'not-running' }

  manualStop = true
  botProcess.kill()
  botProcess = null
  mainWindow.webContents.send('bot-status', 'stopped')
  return { status: 'stopped' }
})

// ---------- BOT STATUS ----------
ipcMain.handle('bot-status', async () => {
  return { status: botProcess ? 'running' : 'stopped' }
})

// ---------- UPDATE (GIT PULL) ----------
ipcMain.handle('bot-update', async () => {
  return new Promise(resolve => {
    const git = spawn('git', ['pull'], {
      cwd: path.join(__dirname, 'bot')
    })

    git.stdout.on('data', data => {
      mainWindow.webContents.send('bot-log', '[GIT] ' + data.toString())
    })

    git.stderr.on('data', data => {
      mainWindow.webContents.send('bot-log', '[GIT-ERR] ' + data.toString())
    })

    git.on('close', code => {
      resolve({ status: code === 0 ? 'ok' : 'error' })
    })
  })
})