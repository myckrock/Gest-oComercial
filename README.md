# Gestão Comercial — PWA 1.1.2

Esta versão mantém o sistema comercial e reforça a instalação como aplicativo.

## O que foi corrigido
- A janela de instalação aparece automaticamente quando o site ainda não está instalado.
- O botão usa `beforeinstallprompt` quando o navegador disponibiliza a instalação nativa.
- Quando o navegador ainda não disponibiliza o prompt, a janela continua aberta e mostra um diagnóstico.
- O diagnóstico verifica HTTPS/ambiente seguro, manifesto, Service Worker, modo standalone e disponibilidade do prompt nativo.
- O Service Worker agora inclui `pwa.js` no shell e usa cache versionado 1.1.2.
- O Service Worker faz `clients.claim()` após atualização.
- A atualização do PWA pode ser verificada e aplicada pelo próprio sistema.

## Publicação
Publique todos os arquivos na raiz do GitHub Pages, mantendo a pasta `icons`.

O endereço deve ser HTTPS. Chrome e Edge também precisam considerar o site instalável para disponibilizar o `beforeinstallprompt`; a janela personalizada não consegue obrigar o navegador a abrir o prompt nativo se ele não tiver liberado o evento.

## Teste
Depois de publicar:
1. Abra o endereço do GitHub Pages.
2. Faça Ctrl+Shift+R.
3. Aguarde a janela de instalação.
4. Veja o diagnóstico dentro da janela.
5. Se existir Service Worker antigo, abra DevTools > Application > Service Workers e use "Update" ou "Bypass for network" durante o teste.
