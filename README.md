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
| Vídeos do celular | `assets/video/` (ver abaixo) |
| Cache | subir o `?v=` nos `<link>`/`<script>` dos HTML depois de mudar CSS/JS |

## Animação de fundo

- **PC e tablet:** WebGL ao vivo (`assets/js/tinta.js`).
- **Celular** (tela de toque com lado menor que 600 px): vídeos em loop em `assets/video/`, porque GPUs de
  celular (principalmente Android) não têm precisão para o shader e a arte saía serrilhada.
  - `tinta.mp4`: abertura (o nome inverte por cima).
  - `tinta-final.mp4`: "Conte a sua história", obrigado e 404, com a faixa do meio livre.
  - `tinta-agendar.mp4`: cabeçalho do agendamento, com a área do título livre.
- **Para regravar** depois de mexer no shader: com o servidor local na 8781, rode
  `node tools/gravar_video.mjs <pasta> <tipo> <largura> <altura>` (abertura e final: 540 960; agendar: 540 540)
  e depois `ffmpeg -framerate 30 -i <pasta>/%04d.png -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -tune animation -movflags +faststart -an assets/video/<nome>.mp4`.
  O loop fecha sozinho (24 s), sem emenda visível.

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
- [ ] Campos novos que não existiam no Forms: e-mail (obrigatório, para o FormSubmit entregar a resposta) e Instagram (opcional). Locais do corpo e dias da semana viraram opções clicáveis.
- [ ] Limite de 3 imagens no envio (o Forms não tinha limite declarado).
- [ ] Idade mínima: atende menores com autorização? (hoje o campo só pede a idade).
- [ ] Locais do corpo sugeridos no formulário (lista em `agendar.html`).
- [ ] Versão em inglês para os pedidos da Europa 2027.
- [ ] Domínio. Hoje está em GitHub Pages com `noindex`; trocar `robots.txt`, a meta robots,
      o `<base>` do `404.html` e o `og:image` quando houver domínio.
