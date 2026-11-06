const APP_VERSION = '1.1.1';
let deferredInstallPrompt = null;
let swRegistration = null;
let updateReady = false;

const pwaEl = id => document.getElementById(id);
const showPwa = id => pwaEl(id)?.classList.remove('hidden');
const hidePwa = id => pwaEl(id)?.classList.add('hidden');

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function showInstallModal(){
  if (!isStandalone() && deferredInstallPrompt) showPwa('pwaInstallModal');
}

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

    setTimeout(checkAppVersion, 1500);
    setInterval(checkAppVersion, 5 * 60 * 1000);
  } catch (err) {
    console.warn('PWA não pôde ser inicializado:', err);
  }
}

// O navegador entrega este evento somente quando a página atende aos requisitos
// de instalação. Guardamos o evento para abrir a confirmação a partir do nosso botão.
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  // Dá um pequeno intervalo para a interface carregar antes de mostrar a janela.
  setTimeout(showInstallModal, 900);
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  hidePwa('pwaInstallModal');
});

document.addEventListener('DOMContentLoaded', () => {
  pwaEl('pwaInstallBtn')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      hidePwa('pwaInstallModal');
      return;
    }
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch (_) {}
    deferredInstallPrompt = null;
    hidePwa('pwaInstallModal');
  });

  pwaEl('pwaInstallClose')?.addEventListener('click', () => hidePwa('pwaInstallModal'));
  pwaEl('pwaUpdateBtn')?.addEventListener('click', activateUpdate);

  // ESC fecha a janela sem instalar.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hidePwa('pwaInstallModal');
  });

  registerPWA();
});
