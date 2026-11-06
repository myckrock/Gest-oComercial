const APP_VERSION = '1.1.2';
let deferredInstallPrompt = null;
let swRegistration = null;
let updateReady = false;
let installModalShown = false;

const el = id => document.getElementById(id);
const show = id => el(id)?.classList.remove('hidden');
const hide = id => el(id)?.classList.add('hidden');

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function openInstallModal() {
  if (!isStandalone() && !installModalShown) {
    installModalShown = true;
    show('pwaInstallModal');
  }
}

function setInstallMessage(available) {
  const msg = el('pwaInstallMessage');
  const btn = el('pwaInstallBtn');
  if (!msg || !btn) return;
  if (available) {
    msg.textContent = 'Instale o sistema neste computador para abrir como um aplicativo, sem precisar procurar a opção de instalação no navegador.';
    btn.textContent = 'Instalar aplicativo';
    btn.disabled = false;
  } else {
    msg.textContent = 'O navegador ainda não liberou a instalação automática. Isso normalmente acontece quando o site não está em HTTPS ou ainda não atende aos requisitos de aplicativo instalável.';
    btn.textContent = 'Verificar novamente';
    btn.disabled = false;
  }
}

function showInstallModal() {
  if (isStandalone()) return;
  setInstallMessage(!!deferredInstallPrompt);
  openInstallModal();
}

function showUpdatePrompt() {
  updateReady = true;
  show('pwaUpdateBanner');
}

async function activateUpdate() {
  try {
    if (swRegistration) {
      await swRegistration.update();
      if (swRegistration.waiting) {
        swRegistration.waiting.postMessage({type:'SKIP_WAITING'});
        return;
      }
    }
    location.reload();
  } catch (_) {
    location.reload();
  }
}

async function checkAppVersion() {
  try {
    const response = await fetch('./version.json?t=' + Date.now(), {cache:'no-store'});
    if (!response.ok) return;
    const data = await response.json();
    if (data.version && data.version !== APP_VERSION) showUpdatePrompt();
  } catch (_) {}
}

async function registerPWA() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register('./sw.js', {scope:'./'});
    await swRegistration.update();

    if (swRegistration.waiting) showUpdatePrompt();

    swRegistration.addEventListener('updatefound', () => {
      const worker = swRegistration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdatePrompt();
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (updateReady) location.reload();
    });

    setTimeout(checkAppVersion, 1200);
    setInterval(checkAppVersion, 5 * 60 * 1000);
  } catch (err) {
    console.warn('PWA não pôde ser inicializado:', err);
  }
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  setInstallMessage(true);
  setTimeout(showInstallModal, 300);
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  hide('pwaInstallModal');
});

document.addEventListener('DOMContentLoaded', () => {
  el('pwaInstallBtn')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      // Não existe API pública para forçar a instalação se o navegador não
      // concedeu beforeinstallprompt. Apenas tentamos registrar novamente.
      await registerPWA();
      setInstallMessage(!!deferredInstallPrompt);
      if (!deferredInstallPrompt) return;
    }
    deferredInstallPrompt.prompt();
    try { await deferredInstallPrompt.userChoice; } catch (_) {}
    deferredInstallPrompt = null;
    hide('pwaInstallModal');
  });

  el('pwaInstallClose')?.addEventListener('click', () => hide('pwaInstallModal'));
  el('pwaUpdateBtn')?.addEventListener('click', activateUpdate);

  // Mostra a janela automaticamente mesmo se o navegador ainda não tiver
  // emitido beforeinstallprompt, deixando claro por que a instalação não foi liberada.
  setTimeout(showInstallModal, 2500);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hide('pwaInstallModal');
  });

  registerPWA();
});
