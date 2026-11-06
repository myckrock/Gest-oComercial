# Gestão Comercial

Aplicação web de gestão comercial com clientes, produtos, estoque, vendas, contas a receber, despesas, fornecedores e sócios.

## PWA / instalação
A aplicação agora pode ser instalada como aplicativo no navegador. Em navegadores compatíveis, aparece um aviso **Instalar**.

Também existe verificação automática de atualização. Quando uma versão nova for publicada, o sistema mostra **Nova versão disponível** e o usuário pode tocar em **Atualizar agora**.

### Para publicar uma nova versão
1. Altere `APP_VERSION` em `pwa.js`.
2. Altere `version` em `version.json` para o mesmo número.
3. Altere `CACHE_NAME` em `sw.js` para a nova versão.
4. Publique os arquivos no GitHub Pages.

Exemplo: `1.1.0` → `1.1.1`.

> O navegador precisa acessar o site por HTTPS para o Service Worker/PWA funcionar. GitHub Pages já fornece HTTPS.
