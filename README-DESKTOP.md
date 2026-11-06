# Gestão Comercial — versão Desktop Windows

Esta versão transforma o sistema em um aplicativo Windows independente, com janela própria e instalador `.exe`.

## O que muda

- Não depende de uma aba do Chrome/Edge para abrir.
- Cria atalho no Desktop e no Menu Iniciar.
- Possui instalador Windows.
- O aplicativo pode verificar novas versões e perguntar se deseja atualizar.
- O mecanismo de atualização usa releases do GitHub.

## Gerar o instalador no Windows

1. Instale Node.js 22 ou superior.
2. Coloque esta pasta no computador Windows.
3. Execute `build-windows.bat`.
4. O instalador será criado em `dist/`.

## Atualizações automáticas

Para que o aplicativo instalado encontre versões novas automaticamente, publique cada nova versão como uma Release do GitHub com uma tag no formato `v1.2.1`, `v1.2.2`, etc.

A atualização usa `electron-updater`. O workflow `.github/workflows/windows-release.yml` também pode gerar e publicar o instalador automaticamente quando uma tag `v*` for enviada ao GitHub.

O aplicativo precisa ser compilado novamente a cada nova versão, aumentando o número em `package.json`.

## Observação

A versão PWA continua podendo existir para celular/navegador, mas a versão Desktop é a opção recomendada para computadores Windows quando a intenção é ter um programa instalado.
