# Bernardo Lacerda · Abstract Tattoos

Site de @bernardo_art com o pedido de agendamento que substitui o Google Forms.
HTML, CSS e JS puros. Feito por [L R G Z](https://lrgz.com.br).

## Onde mexer

| O quê | Onde |
|---|---|
| Abrir ou fechar meses da agenda | `assets/js/agenda.js` (alimenta a home e o formulário) |
| Fotos do portfólio | todas em `../_ref/portfolio` (vão para `trabalhos.html`, mais recentes primeiro); as da home ficam listadas em `../_ref/portfolio/destaques.txt`. Depois rodar `python tools/processar.py` |
| Fotos dele | `../_ref/ele` → `assets/img/bernardo-*.webp` |
| Destino do formulário | `assets/js/agendar.js`, objeto `ENVIO` |
| Textos | `index.html`, `trabalhos.html` e `agendar.html` |
| Cache | subir o `?v=` nos `<link>`/`<script>` dos HTML depois de mudar CSS/JS |

## Envio do formulário (FormSubmit)

O pedido é um POST multipart para `formsubmit.co/bernardoart2019@gmail.com`, com até 3 imagens
comprimidas no navegador (1600 px, JPEG). Os campos chegam numa tabela no e-mail; o "responder"
vai direto para o e-mail do cliente.

1. **Ativação:** o primeiro envio dispara um e-mail do FormSubmit para o Bernardo. Ele precisa
   clicar em "Activate Form". Até isso acontecer, nenhum pedido é entregue.
2. Depois da ativação, o FormSubmit mostra um endereço aleatório (`formsubmit.co/xxxxxxxx`).
   Trocar em `ENVIO.destino` para não expor o e-mail no código.
3. Para testar sem disparar nada, use o site local; o envio só acontece no botão "Enviar pedido".

## CONFIRMAR com o Bernardo

- [ ] Ativação do FormSubmit (passo 1 acima) ou outro destino (planilha via Apps Script, se ele quiser manter a planilha do Forms).
- [ ] Setembro/2026 no Rio aparecia aberto no Forms; já passou, então está como fechado.
- [ ] Idade mínima: atende menores com autorização? (hoje o campo só pede a idade).
- [ ] Locais do corpo sugeridos no formulário (lista em `agendar.html`).
- [ ] Versão em inglês para os pedidos da Europa 2027.
- [ ] Domínio. Hoje está em GitHub Pages com `noindex`; trocar `robots.txt`, a meta robots,
      o `<base>` do `404.html` e o `og:image` quando houver domínio.
