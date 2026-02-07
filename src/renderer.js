// ================= NAVIGATION =================
const navButtons = document.querySelectorAll('.nav-btn')
const pages = document.querySelectorAll('.page')

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.getAttribute('data-page')

    navButtons.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')

    pages.forEach(p => p.classList.remove('active'))
    document.getElementById(`page-${page}`).classList.add('active')
  })
})


// ================= TRADUCTIONS =================
const translations = {
  fr: {
    nav_dashboard: 'Dashboard',
    nav_bot: 'Bot Manager',
    nav_settings: 'Paramètres',

    dashboard_title: 'Dashboard',
    dashboard_bot_status: 'Statut du bot',
    dashboard_uptime: 'Uptime',
    dashboard_ping: 'Ping',

    bot_title: 'Bot Discord Manager',
    bot_logs_title: 'Logs du bot',

    status_prefix: 'Statut : ',
    status_unknown: 'inconnu',
    status_running: 'en cours',
    status_stopped: 'arrêté',

    log_filter_all: 'Tous',
    log_filter_errors: 'Erreurs',
    log_filter_normal: 'Normal',

    update_button: 'Mettre à jour le bot (Git pull)',

    settings_title: 'Paramètres',
    settings_language: 'Langue',
    settings_theme: 'Thème',
    settings_theme_toggle: 'Basculer clair/sombre'
  },

  en: {
    nav_dashboard: 'Dashboard',
    nav_bot: 'Bot Manager',
    nav_settings: 'Settings',

    dashboard_title: 'Dashboard',
    dashboard_bot_status: 'Bot status',
    dashboard_uptime: 'Uptime',
    dashboard_ping: 'Ping',

    bot_title: 'Discord Bot Manager',
    bot_logs_title: 'Bot logs',

    status_prefix: 'Status: ',
    status_unknown: 'unknown',
    status_running: 'running',
    status_stopped: 'stopped',

    log_filter_all: 'All',
    log_filter_errors: 'Errors',
    log_filter_normal: 'Normal',

    update_button: 'Update bot (Git pull)',

    settings_title: 'Settings',
    settings_language: 'Language',
    settings_theme: 'Theme',
    settings_theme_toggle: 'Toggle light/dark'
  }
}

let currentLang = localStorage.getItem('bee_lang') || 'fr'

function applyTranslations() {
  const dict = translations[currentLang]

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    if (dict[key]) el.textContent = dict[key]
  })

  const prefix = document.querySelector('[data-i18n-static="status_prefix"]')
  if (prefix) prefix.textContent = dict.status_prefix
}


// ================= THÈME =================
let currentTheme = localStorage.getItem('bee_theme') || 'dark'

if (currentTheme === 'light') {
  document.body.classList.add('light')
}

function toggleTheme() {
  document.body.classList.toggle('light')

  currentTheme = document.body.classList.contains('light') ? 'light' : 'dark'
  localStorage.setItem('bee_theme', currentTheme)
}

document.getElementById('btn-toggle-theme').onclick = toggleTheme


// ================= BOT MANAGER =================
const btnStartBot = document.getElementById('btn-start-bot')
const btnStopBot = document.getElementById('btn-stop-bot')
const botStatusSpan = document.getElementById('bot-status')
const botLogsPre = document.getElementById('bot-logs')

let allLogs = []
let logFilter = 'all'

function renderLogs() {
  botLogsPre.textContent = ''

  allLogs
    .filter(line => {
      if (logFilter === 'errors') return line.includes('[ERR]')
      if (logFilter === 'normal') return !line.includes('[ERR]')
      return true
    })
    .forEach(line => botLogsPre.textContent += line)

  botLogsPre.scrollTop = botLogsPre.scrollHeight
}

window.beeAPI.getBotStatus().then(res => {
  const dict = translations[currentLang]
  let label = dict.status_unknown

  if (res.status === 'running') label = dict.status_running
  if (res.status === 'stopped') label = dict.status_stopped

  botStatusSpan.textContent = dict.status_prefix + label
})

window.beeAPI.onBotStatus(status => {
  const dict = translations[currentLang]
  let label = dict.status_unknown

  if (status === 'running') label = dict.status_running
  if (status === 'stopped') label = dict.status_stopped

  botStatusSpan.textContent = dict.status_prefix + label
})

window.beeAPI.onBotLog(line => {
  allLogs.push(line)
  renderLogs()
})

btnStartBot.onclick = async () => {
  const res = await window.beeAPI.startBot()
  allLogs.push(`[APP] Bot start: ${res.status}\n`)
  renderLogs()
}

btnStopBot.onclick = async () => {
  const res = await window.beeAPI.stopBot()
  allLogs.push(`[APP] Bot stop: ${res.status}\n`)
  renderLogs()
}


// ================= FILTRES LOGS =================
document.getElementById('log-filter-all').onclick = () => { logFilter = 'all'; renderLogs() }
document.getElementById('log-filter-errors').onclick = () => { logFilter = 'errors'; renderLogs() }
document.getElementById('log-filter-normal').onclick = () => { logFilter = 'normal'; renderLogs() }


// ================= UPDATE BOT =================
document.getElementById('btn-update-bot').onclick = async () => {
  allLogs.push('[APP] Mise à jour du bot...\n')
  renderLogs()

  const res = await window.beeAPI.updateBot()

  if (res.status === 'ok') allLogs.push('[APP] Mise à jour terminée.\n')
  else allLogs.push('[APP] Erreur pendant la mise à jour.\n')

  renderLogs()
}


// ================= DASHBOARD =================
function updateDashboard() {
  fetch("../bot/status.json")
    .then(res => res.json())
    .then(data => {
      document.getElementById("dash-status").textContent = data.status;
      document.getElementById("dash-uptime").textContent = data.uptime;
      document.getElementById("dash-ping").textContent = data.ping + " ms";
    })
    .catch(() => {});
}

setInterval(updateDashboard, 2000);
updateDashboard();


// ================= PARAMÈTRES =================
document.getElementById('select-language').onchange = e => {
  currentLang = e.target.value
  localStorage.setItem('bee_lang', currentLang)
  applyTranslations()
}

applyTranslations()
renderLogs()