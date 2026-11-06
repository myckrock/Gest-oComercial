const APP_VERSION = '1.1.0';
let deferredInstallPrompt = null;
let swRegistration = null;
let updateReady = false;

const pwaEl = id => document.getElementById(id);
const showPwa = id => pwaEl(id)?.classList.remove('hidden');
const hidePwa = id => pwaEl(id)?.classList.add('hidden');

function showUpdatePrompt(){
  updateReady = true;
  showPwa('pwaUpdateBanner');
}

async function activateUpdate(){
  if (!swRegistration) return location.reload();
  if (swRegistration.waiting) {
    swRegistration.waiting.postMessage('SKIP_WAITING');
    return;
  }
  try {
    await swRegistration.update();
    if (swRegistration.waiting) {
      swRegistration.waiting.postMessage('SKIP_WAITING');
    } else {
      // Se a atualização foi detectada pelo version.json, limpa o cache antigo
      // antes de recarregar para garantir que app.js/styles.css sejam novos.
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.startsWith('gestao-comercial-')).map(k => caches.delete(k)));
      location.reload();
    }
  } catch (_) {
    location.reload();
  }
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
    swRegistration = await navigator.serviceWorker.register('./sw.js', {scope:'./'});

    if (swRegistration.waiting) showUpdatePrompt();
    swRegistration.addEventListener('updatefound', () => {
      const worker = swRegistration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdatePrompt();
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (updateReady) location.reload();
    });

    // Verifica uma versão publicada mesmo quando o sw.js não mudou.
    setTimeout(checkAppVersion, 1500);
    setInterval(checkAppVersion, 5 * 60 * 1000);
  } catch (err) {
    console.warn('PWA não pôde ser inicializado:', err);
  }
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showPwa('pwaInstallBanner');
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  hidePwa('pwaInstallBanner');
});

document.addEventListener('DOMContentLoaded', () => {
  pwaEl('pwaInstallBtn')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    hidePwa('pwaInstallBanner');
  });
  pwaEl('pwaInstallClose')?.addEventListener('click', () => hidePwa('pwaInstallBanner'));
  pwaEl('pwaUpdateBtn')?.addEventListener('click', activateUpdate);
  registerPWA();
});
