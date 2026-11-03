# Gestão Comercial — versão corrigida

Correções principais:
- `app.js` agora é carregado como script normal (`defer`), evitando o problema de escopo/módulo ao abrir o HTML localmente.
- Eventos dos botões de navegação são registrados após o DOM estar pronto.
- Funções usadas pelos `onclick` do HTML continuam expostas em `window`.
- `crypto.randomUUID()` ganhou fallback para ambientes que não oferecem essa API.
- Mantidas as funcionalidades de clientes, produtos, estoque, vendas, contas a receber e importação CSV.

Abra o `index.html`.
