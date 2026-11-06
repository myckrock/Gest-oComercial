# Gestão Comercial — PWA

Esta versão mostra automaticamente a janela de instalação.

Importante: o botão de instalação só pode chamar a confirmação nativa quando Chrome/Edge fornecerem o evento `beforeinstallprompt`. Nenhum JavaScript pode contornar a segurança do navegador e forçar a instalação se o site não estiver elegível.

Requisitos:
- HTTPS (GitHub Pages atende)
- manifest.webmanifest válido
- service worker em `/sw.js`
- ícones 192x192 e 512x512
- abrir pelo servidor, não por `file://`

A janela aparece mesmo quando o evento ainda não foi liberado, explicando o motivo. Quando o navegador libera a instalação, o botão abre diretamente a confirmação nativa.
