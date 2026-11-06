const APP_VERSION = '1.1.2';
let deferredInstallPrompt = null;
let swRegistration = null;
let updateReady = false;
let installEventReceived = false;

const pwaEl = id => document.getElementById(id);
const showPwa = id => pwaEl(id)?.classList.remove('hidden');
const hidePwa = id => pwaEl(id)?.classList.add('hidden');

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function browserName(){
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//.test(ua)) return 'Google Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  return 'seu navegador';
}

function setInstallText(text){
  const el = pwaEl('pwaInstallText');
  if (el) el.textContent = text;
}

function statusRow(label, ok, detail=''){
  const symbol = ok ? '✓' : '✕';
  return `<div class="pwa-status-row ${ok ? 'ok' : 'bad'}"><span class="pwa-status-icon">${symbol}</span><div><b>${label}</b>${detail ? `<small>${detail}</small>` : ''}</div></div>`;
}

async function getManifestStatus(){
  try {
    const response = await fetch('./manifest.webmanifest?t=' + Date.now(), {cache:'no-store'});
    if (!response.ok) return {ok:false, detail:'manifest.webmanifest não foi encontrado.'};
    const m = await response.json();
    const icons = Array.isArray(m.icons) ? m.icons : [];
    const has192 = icons.some(i => String(i.sizes || '').split(/\s+/).includes('192x192'));
    const has512 = icons.some(i => String(i.sizes || '').split(/\s+/).includes('512x512'));
    const valid = !!(m.name || m.short_name) && !!m.start_url && !!(m.display || m.display_override) && has192 && has512;
    return {ok:valid, detail:valid ? 'nome, start_url, display e ícones 192/512 encontrados.' : 'faltam campos obrigatórios do manifesto.'};
  } catch (e) {
    return {ok:false, detail:'não foi possível ler o manifesto.'};
  }
}

async function getPwaDiagnostics(){
  const secure = window.isSecureContext && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  const manifest = await getManifestStatus();
  const sw = 'serviceWorker' in navigator;
  let swDetail = sw ? 'API disponível.' : 'API de Service Worker não disponível.';
  if (sw && navigator.serviceWorker.controller) swDetail = 'Service Worker está controlando esta página.';
  else if (sw) swDetail = 'API disponível; aguardando o Service Worker assumir o controle.';
  const prompt = !!deferredInstallPrompt;
  return {secure, manifest, sw, swDetail, standalone:isStandalone(), prompt};
}

async function renderPwaDiagnostics(){
  const box = pwaEl('pwaDiagnostics');
  if (!box) return;
  box.innerHTML = '<div class="pwa-diagnostic-loading">Verificando instalação...</div>';
  const d = await getPwaDiagnostics();
  box.innerHTML = [
    statusRow('HTTPS / ambiente seguro', d.secure, d.secure ? location.origin : 'A instalação precisa de HTTPS, localhost ou 127.0.0.1.'),
    statusRow('Manifesto PWA', d.manifest.ok, d.manifest.detail),
    statusRow('Service Worker', d.sw && !!swRegistration, swRegistration ? d.swDetail : 'Ainda não foi registrado nesta sessão.'),
    statusRow('Modo aplicativo', d.standalone, d.standalone ? 'O sistema já está aberto como aplicativo.' : 'Ainda está aberto no navegador.'),
    statusRow('Prompt nativo disponível', d.prompt, d.prompt ? 'O navegador liberou a instalação pelo botão.' : 'O navegador ainda não liberou beforeinstallprompt.')
  ].join('');
}

function showInstallModal(){
  if (isStandalone()) return;
  showPwa('pwaInstallModal');
  renderPwaDiagnostics();
  if (deferredInstallPrompt) {
    setInstallText('O navegador liberou a instalação. Clique em “Instalar aplicativo” para abrir a confirmação nativa.');
    const btn = pwaEl('pwaInstallBtn');
    if (btn) { btn.textContent = 'Instalar aplicativo'; btn.disabled = false; }
  } else {
    setInstallText(`O ${browserName()} ainda não disponibilizou o botão de instalação para esta página. Veja o diagnóstico abaixo e, se necessário, use o botão de instalação que o navegador mostrar na barra de endereço ou no menu.`);
    const btn = pwaEl('pwaInstallBtn');
    if (btn) { btn.textContent = 'Verificar novamente'; btn.disabled = false; }
  }
}

function showUpdatePrompt(){
  updateReady = true;
  showPwa('pwaUpdateBanner');
}

async function activateUpdate(){
  try {
    if (swRegistration) await swRegistration.update();
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage('SKIP_WAITING');
      return;
    }
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('gestao-comercial-') && k !== `gestao-comercial-${APP_VERSION}`).map(k => caches.delete(k)));
  } catch (_) {}
  location.reload();
}

async function checkAppVersion(){
  try {
    const response = await fetch('./version.json?t=' + Date.now(), {cache:'no-store'});
    if (!response.ok) return;
    const data = await response.json();
    if (data.version && data.version !== APP_VERSION) showUpdatePrompt();
  } catch (_) {}
}

async function registerPWA(){
  if (!('serviceWorker' in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register('./sw.js?v=' + encodeURIComponent(APP_VERSION), {scope:'./', updateViaCache:'none'});
    await swRegistration.update();
    if (swRegistration.waiting) showUpdatePrompt();
    swRegistration.addEventListener('updatefound', () => {
      const worker = swRegistration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdatePrompt();
        renderPwaDiagnostics();
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (updateReady) location.reload();
      renderPwaDiagnostics();
    });
    setTimeout(checkAppVersion, 1500);
    setInterval(checkAppVersion, 5 * 60 * 1000);
    renderPwaDiagnostics();
  } catch (err) {
    console.warn('PWA não pôde ser inicializado:', err);
    renderPwaDiagnostics();
  }
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installEventReceived = true;
  setTimeout(showInstallModal, 250);
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  hidePwa('pwaInstallModal');
});

document.addEventListener('DOMContentLoaded', () => {
  pwaEl('pwaInstallBtn')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      setInstallText('Ainda não há uma confirmação nativa disponível. O diagnóstico foi atualizado. Se o navegador considerar o site instalável, o botão de instalação aparecerá na barra de endereço ou no menu do navegador.');
      await renderPwaDiagnostics();
      return;
    }
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch (_) {}
    deferredInstallPrompt = null;
    hidePwa('pwaInstallModal');
  });

  pwaEl('pwaInstallClose')?.addEventListener('click', () => hidePwa('pwaInstallModal'));
  pwaEl('pwaUpdateBtn')?.addEventListener('click', activateUpdate);
  pwaEl('pwaDiagnosticsRefresh')?.addEventListener('click', renderPwaDiagnostics);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hidePwa('pwaInstallModal'); });

  registerPWA();
  if (!isStandalone()) {
    setTimeout(() => {
      if (!isStandalone()) showInstallModal();
    }, 1600);
  }
});
