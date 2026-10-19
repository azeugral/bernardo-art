"""Gera a versão em inglês (pasta en/) a partir das páginas em português.

Uso: python tools/traduzir.py

- As páginas em português são a fonte. Mudou um texto lá, atualize a tradução aqui e rode de novo.
- Se um trecho em português não for encontrado, o script para e mostra qual (assim a versão em
  inglês nunca fica desatualizada sem ninguém perceber).
- No fim, lista linhas que ainda parecem português, para revisar.
- Os valores dos campos do formulário continuam em português: o e-mail que o Bernardo recebe
  é igual nas duas versões, com o campo "Idioma" indicando English.
"""
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
BASE = "https://azeugral.github.io/bernardo-art/"
PAGINAS = {  # pt -> en
    "index.html": "index.html",
    "agendar.html": "book.html",
    "trabalhos.html": "work.html",
    "obrigado.html": "thanks.html",
}
URL_EN = {"index.html": "", "book.html": "book.html", "work.html": "work.html", "thanks.html": "thanks.html"}
URL_PT = {"index.html": "", "agendar.html": "agendar.html", "trabalhos.html": "trabalhos.html", "obrigado.html": "obrigado.html"}

# ---------------------------------------------------------------- comuns a todas as páginas
COMUNS = [
    ('<html lang="pt-BR">', '<html lang="en">'),
    ('<meta property="og:locale" content="pt_BR">\n<meta property="og:locale:alternate" content="en_US">',
     '<meta property="og:locale" content="en_US">\n<meta property="og:locale:alternate" content="pt_BR">'),
    ('content="Bernardo Lacerda, abstract tattoos, sobre mármore de tinta preta"', 'content="Bernardo Lacerda, abstract tattoos, on black ink marble"'),
    ('aria-label="Bernardo Art, início"', 'aria-label="Bernardo Art, home"'),
    ('<nav aria-label="Principal">', '<nav aria-label="Main">'),
    ('>Trabalhos</a></li>', '>Work</a></li>'),
    ('>Agenda</a></li>', '>Dates</a></li>'),
    ('>Valores</a></li>', '>Pricing</a></li>'),
    ('>Agendar</a></li>', '>Book</a></li>'),
    ('<h4>Contato</h4>', '<h4>Contact</h4>'),
    ('<h4>Atendo em</h4>', '<h4>Where I work</h4>'),
    ('<li>Europa (2027)</li>', '<li>Europe (2027)</li>'),
    ('<h4>Também</h4>', '<h4>Also</h4>'),
    ('>Cofundador do Vulcão</a>', '>Co-founder of Vulcão</a>'),
    ('<span>Site por <a href="https://lrgz.com.br"', '<span>Site by <a href="https://lrgz.com.br"'),
    ('<dialog class="luz" data-luz aria-label="Foto ampliada">', '<dialog class="luz" data-luz aria-label="Enlarged photo">'),
    ('data-luz-fechar>Fechar</button>', 'data-luz-fechar>Close</button>'),
    ('aria-label="Foto anterior"', 'aria-label="Previous photo"'),
    ('aria-label="Próxima foto"', 'aria-label="Next photo"'),
]

# ---------------------------------------------------------------- por página
PAGINA = {
"index.html": [
    ('<meta name="description" content="Tatuagens abstratas e originais de Bernardo Lacerda. Agenda 2026 no Rio de Janeiro (outubro) e em São Paulo (novembro); 2027 na Europa. Peça seu agendamento pelo site.">',
     '<meta name="description" content="Original abstract tattoos by Bernardo Lacerda. 2026: Rio de Janeiro (October) and São Paulo (November); 2027: Europe. Request your booking online.">'),
    ('<meta property="og:description" content="Abstract tattoos. Histórias em forma de tatuagem.">',
     '<meta property="og:description" content="Abstract tattoos. Stories told as tattoos.">'),
    ('<a class="pular" href="#conteudo">Pular para o conteúdo</a>', '<a class="pular" href="#conteudo">Skip to content</a>'),
    ('<section class="abertura" data-tinta-area aria-label="Abertura">', '<section class="abertura" data-tinta-area aria-label="Intro">'),
    ('<p class="frase">Histórias em forma de tatuagem.</p>', '<p class="frase">Stories told as tattoos.</p>'),
    ('<span class="rotulo">2026 · Brasil</span>', '<span class="rotulo">2026 · Brazil</span>'),
    ('<p><span class="sublinha">Rio de Janeiro em outubro, São Paulo em novembro</span></p>',
     '<p><span class="sublinha">Rio de Janeiro in October, São Paulo in November</span></p>'),
    ('<span class="rotulo">2027 · Europa</span>', '<span class="rotulo">2027 · Europe</span>'),
    ('<p><span class="sublinha">Paris em setembro. Agenda aberta</span></p>', '<p><span class="sublinha">Paris in September. Bookings open</span></p>'),
    ('<span class="rotulo">Trabalhos</span>\n        <h2>Trabalhos recentes</h2>\n        <p>Somente trabalhos originais, criados a partir da ideia de cada pessoa.</p>',
     '<span class="rotulo">Work</span>\n        <h2>Recent work</h2>\n        <p>Original work only, created from each person\'s idea.</p>'),
    ('<p><span data-obras-total></span> trabalhos no arquivo completo, dos mais recentes aos mais antigos.</p>',
     '<p><span data-obras-total></span> pieces in the full archive, newest to oldest.</p>'),
    ('>Ver todos <span class="seta"', '>See all <span class="seta"'),
    ('alt="Bernardo Lacerda tatuando"', 'alt="Bernardo Lacerda tattooing"'),
    ('<span class="rotulo">Antes de pedir</span>\n        <h2>Só trabalhos originais</h2>',
     '<span class="rotulo">Before you book</span>\n        <h2>Original work only</h2>'),
    ('<p>No processo de criação é muito importante que você confie 100% no meu trabalho: você me traz a ideia e o conceito da tatuagem, e a criação e a parte estética ficam comigo.</p>',
     '<p>In the creative process, it is very important that you trust my work 100%: you bring me the idea and the concept of the tattoo, and the creation and the aesthetics are up to me.</p>'),
    ('<p>Não faço cópias (principalmente dos meus próprios trabalhos), reformas, retoques de outras tatuagens nem coberturas, a não ser algo combinado previamente.</p>',
     '<p>I don\'t do copies (especially of my own work), reworks, touch-ups on other tattoos or cover-ups, unless agreed beforehand.</p>'),
    ('<h2 data-revela>Agenda</h2>', '<h2 data-revela>Dates</h2>'),
    ('<noscript><p>Agenda aberta: outubro de 2026 no Rio de Janeiro, novembro de 2026 em São Paulo e setembro de 2027 em Paris. <a href="agendar.html">Pedir agendamento</a>.</p></noscript>',
     '<noscript><p>Open dates: October 2026 in Rio de Janeiro, November 2026 in São Paulo and September 2027 in Paris. <a href="agendar.html">Request a booking</a>.</p></noscript>'),
    ('<span class="rotulo">Valores</span>\n        <h2>Orçamento e sinal</h2>\n        <p>Valores fechados, avaliados por tamanho, complexidade e quantidade de sessões.</p>',
     '<span class="rotulo">Pricing</span>\n        <h2>Quote and deposit</h2>\n        <p>Fixed prices, based on size, complexity and number of sessions.</p>'),
    ('<h3>Fechamentos</h3>', '<h3>Full sleeves</h3>'),
    ('<p>Quando um projeto grande, como um fechamento de braço, é pensado de uma vez só, as coisas costumam se encaixar melhor e o todo fica mais harmônico. Por isso há um desconto especial para fechamentos desenvolvidos de uma vez, e os projetos maiores acabam tendo valores relativamente mais em conta.</p>',
     '<p>When a large project, such as a full arm sleeve, is planned all at once, things tend to fit together better and the whole becomes more harmonious. That is why there is a special discount for sleeves developed all at once, and larger projects end up being relatively more affordable.</p>'),
    ('>Se no dia combinado houver mudança de tamanho ou de local do corpo, o valor é reajustado. Por isso, seja realista ao informar o tamanho.</p>',
     '>If the size or body placement changes on the agreed day, the price is adjusted. So please be realistic about the size.</p>'),
    ('<h3>Pagamento</h3>', '<h3>Payment</h3>'),
    ('<li><span>Dinheiro</span><span></span></li>', '<li><span>Cash</span><span></span></li>'),
    ('<li><span>Transferência</span><span>PIX</span></li>', '<li><span>Bank transfer</span><span>PIX</span></li>'),
    ('<li><span>Cartão de crédito</span><span>juros da máquina</span></li>', '<li><span>Credit card</span><span>card fees apply</span></li>'),
    ('<div class="sinal-numero">R$ 500<small>de sinal por dia de projeto</small></div>',
     '<div class="sinal-numero">R$ 500<small>deposit per project day (Brazilian reais)</small></div>'),
    ('<p>O sinal é pago antecipadamente e abatido do valor total acordado. Ele <strong>não é retornável em nenhuma hipótese</strong>, pois os dias ficam inteiramente reservados para você.</p>',
     '<p>The deposit is paid in advance and deducted from the total agreed price. It is <strong>non-refundable under any circumstances</strong>, as the days are reserved entirely for you.</p>'),
    ('<p>Remarcações precisam de aviso prévio de, no mínimo, 72 horas.</p>', '<p>Rescheduling requires at least 72 hours\' notice.</p>'),
    ('<p style="margin:0">Nenhuma data é agendada sem o envio do comprovante do sinal.</p>',
     '<p style="margin:0">No date is booked until the deposit receipt has been sent.</p>'),
    ('<section class="final" data-tinta-area aria-label="Pedir agendamento">', '<section class="final" data-tinta-area aria-label="Request a booking">'),
    ('<span class="rotulo">Pedido de agendamento</span>\n        <h2>Conte a sua história</h2>\n        <p>Seja o mais detalhista possível. Se a tatuagem tiver um significado, me conte; se não tiver, preciso de um tema bem definido.</p>',
     '<span class="rotulo">Booking request</span>\n        <h2>Tell me your story</h2>\n        <p>Be as detailed as possible. If the tattoo has a meaning, tell me; if it doesn\'t, I need a well-defined theme.</p>'),
    ('>Começar o pedido <span class="seta"', '>Start your request <span class="seta"'),
    ('<span class="sublinha">Dúvidas por e-mail</span>', '<span class="sublinha">Questions by email</span>'),
],
"agendar.html": [
    ('<title>Agendar · Bernardo Lacerda</title>', '<title>Book · Bernardo Lacerda</title>'),
    ('<meta name="description" content="Pedido de agendamento de tatuagem com Bernardo Lacerda: ideia, local do corpo, tamanho, cidade e mês.">',
     '<meta name="description" content="Tattoo booking request with Bernardo Lacerda: idea, body placement, size, city and month.">'),
    ('<meta property="og:title" content="Agendamento · Bernardo Lacerda">', '<meta property="og:title" content="Booking · Bernardo Lacerda">'),
    ('<meta property="og:description" content="Conte a sua história: ideia, local, tamanho, cidade e mês.">',
     '<meta property="og:description" content="Tell me your story: idea, placement, size, city and month.">'),
    ('<a class="pular" href="#pedido">Pular para o formulário</a>', '<a class="pular" href="#pedido">Skip to the form</a>'),
    ('<span class="rotulo">Pedido de agendamento</span>\n        <h1>Conte a sua história</h1>',
     '<span class="rotulo">Booking request</span>\n        <h1>Tell me your story</h1>'),
    ('data-ir="0">Você</button>', 'data-ir="0">You</button>'),
    ('data-ir="1">O projeto</button>', 'data-ir="1">The project</button>'),
    ('data-ir="2">Quando</button>', 'data-ir="2">When</button>'),
    ('data-ir="3">Valores e sinal</button>', 'data-ir="3">Pricing and deposit</button>'),
    ('data-ir="4">Revisar e enviar</button>', 'data-ir="4">Review and send</button>'),
    ('<nav class="etapas-mob" aria-label="Etapas do pedido" data-etapas-mob>', '<nav class="etapas-mob" aria-label="Request steps" data-etapas-mob>'),
    ('<span class="etapas-mob__nome" data-etapa-nome>Você</span>', '<span class="etapas-mob__nome" data-etapa-nome>You</span>'),
    ('<span class="etapas-mob__abrir">Etapas</span>', '<span class="etapas-mob__abrir">Steps</span>'),
    ('<span>01</span>Você</button>', '<span>01</span>You</button>'),
    ('<span>02</span>O projeto</button>', '<span>02</span>The project</button>'),
    ('<span>03</span>Quando</button>', '<span>03</span>When</button>'),
    ('<span>04</span>Valores e sinal</button>', '<span>04</span>Pricing and deposit</button>'),
    ('<span>05</span>Revisar e enviar</button>', '<span>05</span>Review and send</button>'),
    ('data-obrigado="obrigado.html"', 'data-obrigado="thanks.html"'),
    ('<input type="hidden" name="Idioma" value="Português">', '<input type="hidden" name="Idioma" value="English">'),
    ('<legend class="rotulo">01 de 05</legend>\n        <h2>Sobre você</h2>\n        <p class="intro">Para facilitar e organizar a comunicação, preciso de algumas informações sobre você.</p>',
     '<legend class="rotulo">01 of 05</legend>\n        <h2>About you</h2>\n        <p class="intro">To make communication easier and more organized, I need some information about you.</p>'),
    ('<label for="nome">Nome completo</label>', '<label for="nome">Full name</label>'),
    ('<p class="msg-erro">Escreva o seu nome completo.</p>', '<p class="msg-erro">Please write your full name.</p>'),
    ('<label for="idade">Idade</label>', '<label for="idade">Age</label>'),
    ('<p class="msg-erro">Informe a sua idade.</p>', '<p class="msg-erro">Please enter your age.</p>'),
    ('<label for="cidade">Estado e cidade onde mora</label>', '<label for="cidade">City and country where you live</label>'),
    ('placeholder="RJ, Niterói"', 'placeholder="Lisbon, Portugal"'),
    ('<p class="ajuda">Eu atendo no Rio de Janeiro e em São Paulo.</p>', '<p class="ajuda">In 2026 I work in Rio de Janeiro and São Paulo; in 2027, in Paris.</p>'),
    ('<p class="msg-erro">Informe onde você mora.</p>', '<p class="msg-erro">Please tell me where you live.</p>'),
    ('<label for="telefone">Telefone com DDD</label>', '<label for="telefone">Phone with country code</label>'),
    ('placeholder="(21) 99999-9999"', 'placeholder="+351 912 345 678"'),
    ('<p class="ajuda">Fora do Brasil, inclua o código do país.</p>', '<p class="ajuda">Include the country and area code.</p>'),
    ('<p class="msg-erro">Informe um telefone com DDD.</p>', '<p class="msg-erro">Please enter a phone number with country code.</p>'),
    ('<label for="email">E-mail</label>', '<label for="email">Email</label>'),
    ('<p class="msg-erro">Confira o seu e-mail.</p>', '<p class="msg-erro">Please check your email.</p>'),
    ('<label for="insta">Instagram <span class="opc">(opcional)</span></label>', '<label for="insta">Instagram <span class="opc">(optional)</span></label>'),
    ('placeholder="@seuperfil"', 'placeholder="@yourprofile"'),
    ('<legend class="rotulo">02 de 05</legend>\n        <h2>O projeto</h2>\n        <p class="intro">Eu gosto de me envolver ao máximo no projeto de cada cliente e, por isso, preciso saber o motivo ou o significado dessa tatuagem para você.</p>',
     '<legend class="rotulo">02 of 05</legend>\n        <h2>The project</h2>\n        <p class="intro">I like to get as involved as possible in each client\'s project, so I need to know the reason or the meaning behind this tattoo for you.</p>'),
    ('<legend>A tatuagem tem um significado para você?</legend>', '<legend>Does the tattoo have a meaning for you?</legend>'),
    ('<span><b>Tem uma história</b><em>Me conte o motivo e o significado dela.</em></span>',
     '<span><b>It has a story</b><em>Tell me the reason and its meaning.</em></span>'),
    ('<span><b>Tema livre</b><em>Não tem problema, mas o processo é diferente: preciso de um tema bem definido.</em></span>',
     '<span><b>Open theme</b><em>That\'s fine, but the process is different: I need a well-defined theme.</em></span>'),
    ('<p class="msg-erro">Escolha uma das opções.</p>', '<p class="msg-erro">Please choose one of the options.</p>'),
    ('<label for="ideia">Ideia e conceito</label>', '<label for="ideia">Idea and concept</label>'),
    ('<p class="ajuda" data-ajuda-ideia>Seja o mais detalhista possível e, caso se sinta à vontade, conte um pouco da sua história.</p>',
     '<p class="ajuda" data-ajuda-ideia>Be as detailed as possible and, if you feel comfortable, tell me a little about your story.</p>'),
    ('<span class="contador" data-contador>0 caracteres</span>', '<span class="contador" data-contador>0 characters</span>'),
    ('<p class="msg-erro">Conte um pouco mais sobre a ideia (pelo menos algumas linhas).</p>', '<p class="msg-erro">Tell me a bit more about the idea (at least a few lines).</p>'),
    ('<legend>Local do corpo</legend>', '<legend>Body placement</legend>'),
    ('<p class="ajuda">Nesse primeiro contato, basta dizer onde você quer ser tatuado. Se eu tiver alguma dúvida, peço algumas fotos do local.</p>',
     '<p class="ajuda">For this first contact, just tell me where you want to be tattooed. If I have any questions, I\'ll ask for a few photos of the area.</p>'),
    ('<span>Antebraço</span>', '<span>Forearm</span>'),
    ('<span>Braço</span>', '<span>Arm</span>'),
    ('<span>Fechamento de braço</span>', '<span>Full arm sleeve</span>'),
    ('<span>Ombro</span>', '<span>Shoulder</span>'),
    ('<span>Peito</span>', '<span>Chest</span>'),
    ('<span>Costas</span>', '<span>Back</span>'),
    ('<span>Costela</span>', '<span>Ribs</span>'),
    ('<span>Coxa</span>', '<span>Thigh</span>'),
    ('<span>Perna</span>', '<span>Leg</span>'),
    ('<span>Fechamento de perna</span>', '<span>Full leg sleeve</span>'),
    ('<span>Pé</span>', '<span>Foot</span>'),
    ('placeholder="Outro local ou detalhe: lado de dentro do antebraço esquerdo…"', 'placeholder="Other placement or detail: inner left forearm…"'),
    ('aria-label="Detalhe do local"', 'aria-label="Placement detail"'),
    ('<p class="msg-erro">Marque ou escreva onde você quer tatuar.</p>', '<p class="msg-erro">Select or write where you want the tattoo.</p>'),
    ('<label for="tamanho">Tamanho aproximado em centímetros</label>', '<label for="tamanho">Approximate size in centimeters</label>'),
    ('<p class="ajuda">Para ajudar: um palmo de uma pessoa adulta tem em média 20 a 25 cm. Seja realista, porque mudanças de tamanho no dia reajustam o valor.</p>',
     '<p class="ajuda">To help: an adult\'s hand span is on average 20 to 25 cm. Please be realistic, because size changes on the day adjust the price.</p>'),
    ('<div class="regua__leitura" data-regua-leitura>Digite um tamanho</div>', '<div class="regua__leitura" data-regua-leitura>Enter a size</div>'),
    ('<p class="msg-erro">Informe um tamanho aproximado.</p>', '<p class="msg-erro">Please enter an approximate size.</p>'),
    ('<span class="campo__titulo">Referências ou fotos do local <span class="opc">(opcional, até 3 imagens)</span></span>',
     '<span class="campo__titulo">References or photos of the area <span class="opc">(optional, up to 3 images)</span></span>'),
    ('<p>Referências para a ideia ou fotos do local a ser tatuado.</p>', '<p>References for the idea or photos of the area to be tattooed.</p>'),
    ('for="arquivos">Escolher imagens</label>', 'for="arquivos">Choose images</label>'),
    ('<legend class="rotulo">03 de 05</legend>\n        <h2>Quando</h2>\n        <p class="intro">Em que cidade e mês você gostaria de agendar o seu horário?</p>',
     '<legend class="rotulo">03 of 05</legend>\n        <h2>When</h2>\n        <p class="intro">In which city and month would you like to book your session?</p>'),
    ('<legend>Cidade e mês</legend>', '<legend>City and month</legend>'),
    ('placeholder="Qual cidade e mês?"', 'placeholder="Which city and month?"'),
    ('aria-label="Outra cidade e mês"', 'aria-label="Other city and month"'),
    ('<p class="msg-erro">Escolha uma cidade e um mês.</p>', '<p class="msg-erro">Please choose a city and a month.</p>'),
    ('<legend>Dias da semana em que você pode passar comigo</legend>', '<legend>Days of the week you can spend with me</legend>'),
    ('<p class="ajuda">Normalmente das 14h às 20h, mas o horário pode mudar de acordo com a sua disponibilidade.</p>',
     '<p class="ajuda">Usually from 2 pm to 8 pm, but the time can change according to your availability.</p>'),
    ('<span>Seg</span>', '<span>Mon</span>'), ('<span>Ter</span>', '<span>Tue</span>'), ('<span>Qua</span>', '<span>Wed</span>'),
    ('<span>Qui</span>', '<span>Thu</span>'), ('<span>Sex</span>', '<span>Fri</span>'), ('<span>Sáb</span>', '<span>Sat</span>'),
    ('<span>Qualquer dia</span>', '<span>Any day</span>'),
    ('placeholder="Observação sobre horários (opcional)"', 'placeholder="Notes about times (optional)"'),
    ('aria-label="Observação sobre horários"', 'aria-label="Notes about times"'),
    ('<p class="msg-erro">Marque pelo menos um dia.</p>', '<p class="msg-erro">Please select at least one day.</p>'),
    ('<legend class="rotulo">04 de 05</legend>\n        <h2>Valores e sinal</h2>\n        <p class="intro">Eu cobro valores fechados, avaliados por tamanho, complexidade e quantidade de sessões. Fechamentos desenvolvidos de uma vez têm desconto especial.</p>',
     '<legend class="rotulo">04 of 05</legend>\n        <h2>Pricing and deposit</h2>\n        <p class="intro">I charge fixed prices, based on size, complexity and number of sessions. Sleeves developed all at once have a special discount.</p>'),
    ('<span class="rotulo">Sinal</span>', '<span class="rotulo">Deposit</span>'),
    ('<p style="margin:10px 0 0;font-size:.95rem">por dia de projeto, pago antecipadamente e abatido do valor total acordado.</p>',
     '<p style="margin:10px 0 0;font-size:.95rem">per project day (Brazilian reais), paid in advance and deducted from the total agreed price.</p>'),
    ('<span class="rotulo">Pagamento</span>', '<span class="rotulo">Payment</span>'),
    ('<li>Dinheiro</li>', '<li>Cash</li>'),
    ('<li>Transferência (PIX)</li>', '<li>Bank transfer (PIX)</li>'),
    ('<li>Cartão de crédito (juros da máquina)</li>', '<li>Credit card (card fees apply)</li>'),
    ('<span>Entendi que o Bernardo faz <strong>somente trabalhos originais</strong>: não faz cópias (principalmente dos próprios trabalhos), reformas, retoques de outras tatuagens nem coberturas, a não ser algo combinado previamente. A criação e a parte estética ficam com ele.</span>',
     '<span>I understand that Bernardo does <strong>original work only</strong>: no copies (especially of his own work), reworks, touch-ups on other tattoos or cover-ups, unless agreed beforehand. The creation and the aesthetics are up to him.</span>'),
    ('<span>Entendi que o <strong>sinal de R$ 500 por dia não é retornável</strong> em nenhuma hipótese, que remarcações precisam de aviso prévio de, no mínimo, 72 horas e que nenhuma data é agendada sem o envio do comprovante do sinal.</span>',
     '<span>I understand that the <strong>R$ 500 deposit per day is non-refundable</strong> under any circumstances, that rescheduling requires at least 72 hours\' notice, and that no date is booked until the deposit receipt has been sent.</span>'),
    ('<span>Entendi que, se no dia combinado houver mudança de tamanho ou de local do corpo, o valor será reajustado.</span>',
     '<span>I understand that if the size or body placement changes on the agreed day, the price will be adjusted.</span>'),
    ('<legend class="rotulo">05 de 05</legend>\n        <h2>Revisar e enviar</h2>\n        <p class="intro">Confira se está tudo certo antes de enviar.</p>',
     '<legend class="rotulo">05 of 05</legend>\n        <h2>Review and send</h2>\n        <p class="intro">Check that everything is right before sending.</p>'),
    ('<label for="duvidas">Dúvidas finais <span class="opc">(opcional)</span></label>', '<label for="duvidas">Final questions <span class="opc">(optional)</span></label>'),
    ('placeholder="Se ainda tiver algo que você não entendeu, pergunte aqui."', 'placeholder="If there is anything you didn\'t understand, ask here."'),
    ('data-voltar hidden>Voltar</button>', 'data-voltar hidden>Back</button>'),
    ('data-avancar>Continuar <span', 'data-avancar>Continue <span'),
    ('data-enviar hidden>Enviar pedido <span', 'data-enviar hidden>Send request <span'),
    ('<span>Dúvidas: <a href="mailto:', '<span>Questions: <a href="mailto:'),
],
"trabalhos.html": [
    ('<title>Trabalhos · Bernardo Lacerda</title>', '<title>Work · Bernardo Lacerda</title>'),
    ('<meta name="description" content="Arquivo de tatuagens abstratas e originais de Bernardo Lacerda, das mais recentes às mais antigas.">',
     '<meta name="description" content="Archive of original abstract tattoos by Bernardo Lacerda, newest to oldest.">'),
    ('<meta property="og:title" content="Trabalhos · Bernardo Lacerda">', '<meta property="og:title" content="Work · Bernardo Lacerda">'),
    ('<meta property="og:description" content="Arquivo de tatuagens abstratas e originais.">', '<meta property="og:description" content="Archive of original abstract tattoos.">'),
    ('<a class="pular" href="#conteudo">Pular para o conteúdo</a>', '<a class="pular" href="#conteudo">Skip to content</a>'),
    ('<span class="rotulo">Arquivo</span>\n        <h1 style="margin-top:14px">Trabalhos</h1>\n        <p>Do mais recente ao mais antigo. Toque numa foto para ampliar.</p>',
     '<span class="rotulo">Archive</span>\n        <h1 style="margin-top:14px">Work</h1>\n        <p>Newest to oldest. Tap a photo to enlarge.</p>'),
    ('alt="Bernardo Lacerda segurando um cartucho de agulha"', 'alt="Bernardo Lacerda holding a needle cartridge"'),
    ('<p>Eu faço somente trabalhos originais e não faço cópias, principalmente dos meus próprios trabalhos.</p>',
     '<p>I do original work only and I don\'t do copies, especially of my own work.</p>'),
    ('>Pedir agendamento <span class="seta"', '>Request a booking <span class="seta"'),
],
"obrigado.html": [
    ('<title>Pedido enviado · Bernardo Lacerda</title>', '<title>Request sent · Bernardo Lacerda</title>'),
    ('<span class="rotulo">Pedido enviado</span>\n      <h2 data-obrigado>Recebi o seu pedido</h2>',
     '<span class="rotulo">Request sent</span>\n      <h2 data-obrigado>I received your request</h2>'),
    ('<p>Muito obrigado por escolher o meu trabalho! Fico aqui aguardando o seu próximo contato.</p>',
     '<p>Thank you so much for choosing my work! I\'ll be waiting for your next message.</p>'),
    ('<p>Lembrando: nenhuma data é agendada sem o envio do comprovante do sinal de R$ 500,00 por dia de projeto.</p>',
     '<p>A reminder: no date is booked until the receipt for the R$ 500.00 deposit per project day has been sent.</p>'),
    ('>Caso haja alguma dúvida, fale comigo pelo Instagram ou pelo e-mail <a href="mailto:',
     '>If you have any questions, reach me on Instagram or by email at <a href="mailto:'),
    ('<a class="botao" href="./">Voltar ao site</a>', '<a class="botao" href="./">Back to the site</a>'),
    ('textContent="Obrigado, "+n;', 'textContent="Thank you, "+n;'),
],
}

# palavras que denunciam português esquecido (nomes próprios ficam de fora)
SUSPEITAS = re.compile(r"\b(você|não|para|com|sobre|seu|sua|dos|das|pedido|agenda(?!r)|valores|trabalhos|orçamento|tatuagem|enviar|voltar)\b", re.I)
PERMITIDAS = ("gmail.com", "São Paulo", "Vulcão", "name=\"", "value=\"", "data-", "Agendamento", "<!--", "Idioma", "ENVIO", "formsubmit")


def caminhos(html):
    """Ajusta caminhos para a pasta en/ e troca os nomes das páginas."""
    def troca(m):
        attr, val = m.group(1), m.group(2)
        if re.match(r"^(https?:|mailto:|#|data:)", val):
            return m.group(0)
        pagina, resto = re.match(r"^([^?#]*)(.*)$", val).groups()
        if pagina in PAGINAS:
            return f'{attr}="{PAGINAS[pagina]}{resto}"'
        if pagina.startswith("assets/") or pagina == "favicon.ico":
            return f'{attr}="../{val}"'
        return m.group(0)
    return re.sub(r'\b(href|src)="([^"]*)"', troca, html)


def gerar():
    saida = RAIZ / "en"
    saida.mkdir(exist_ok=True)
    erros = []
    for pt, en in PAGINAS.items():
        html = (RAIZ / pt).read_text(encoding="utf-8")
        for a, b in COMUNS + PAGINA[pt]:
            if a not in html:
                if (a, b) in COMUNS:
                    continue  # nem toda página tem todos os trechos comuns
                erros.append(f"{pt}: não encontrei → {a[:110]}")
                continue
            html = html.replace(a, b)
        html = caminhos(html)
        # seletor de idioma, links alternativos e endereço canônico da versão em inglês
        html = re.sub(r'<div class="idioma"[^>]*>.*?</div>',
                      f'<div class="idioma" role="group" aria-label="Language / Idioma"><a href="../{URL_PT[pt]}" hreflang="pt-BR" lang="pt-BR">PT</a><span aria-current="true">EN</span></div>',
                      html, count=1, flags=re.S)
        html = html.replace(f'<meta property="og:url" content="{BASE}{URL_PT[pt]}">', f'<meta property="og:url" content="{BASE}en/{URL_EN[en]}">')
        (saida / en).write_text(html, encoding="utf-8")

        corpo = re.sub(r"<script.*?</script>", "", html, flags=re.S)
        for n, linha in enumerate(corpo.splitlines(), 1):
            texto = re.sub(r"<[^>]+>", " ", linha)
            if SUSPEITAS.search(texto) and not any(p in linha for p in PERMITIDAS):
                print(f"  revisar en/{en}:{n}: {texto.strip()[:100]}")

    if erros:
        print("\n".join(erros))
        sys.exit(1)
    print("en/ gerado:", ", ".join(PAGINAS.values()))


if __name__ == "__main__":
    gerar()
