"""Gera as fotos do site a partir de ../_ref/portfolio.

Uso: python tools/processar.py

- Todas as fotos da pasta entram em trabalhos.html, das mais recentes para as mais antigas
  (o número no nome do arquivo do Instagram cresce com o tempo).
- As listadas em _ref/portfolio/destaques.txt aparecem na home, na ordem do arquivo.
- Saída: assets/obras/NNN.webp (até 1600 px, proporção original, para ampliar),
  assets/obras/NNN-p.webp (miniatura 4:5 de 640 px) e assets/js/obras.js.
"""
import json
import re
from pathlib import Path
from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parents[1]
ORIGEM = RAIZ.parent / "_ref" / "portfolio"
DESTINO = RAIZ / "assets" / "obras"
GRANDE, MINI = 1600, 640

DESTINO.mkdir(parents=True, exist_ok=True)
for antigo in DESTINO.glob("*.webp"):
    antigo.unlink()


def chave(p):
    m = re.match(r"(\d+)_(\d+)", p.stem)
    return int(m.group(2)) if m else 0


arquivos = sorted((p for p in ORIGEM.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}),
                  key=chave, reverse=True)
lista_dest = ORIGEM / "destaques.txt"
destaques = [l.strip() for l in lista_dest.read_text(encoding="utf-8").splitlines()
             if l.strip() and not l.startswith("#")] if lista_dest.exists() else []

obras, por_nome = [], {}
for i, arq in enumerate(arquivos, 1):
    im = ImageOps.exif_transpose(Image.open(arq)).convert("RGB")
    nome = f"{i:03d}"
    g = im.copy()
    g.thumbnail((GRANDE, GRANDE * 2), Image.LANCZOS)
    g.save(DESTINO / f"{nome}.webp", "WEBP", quality=80, method=6)
    p = ImageOps.fit(im, (MINI, round(MINI * 5 / 4)), Image.LANCZOS, centering=(0.5, 0.45))
    p.save(DESTINO / f"{nome}-p.webp", "WEBP", quality=78, method=6)
    obras.append({"src": f"assets/obras/{nome}.webp", "mini": f"assets/obras/{nome}-p.webp", "w": g.width, "h": g.height})
    por_nome[arq.name] = i - 1

home = [por_nome[n] for n in destaques if n in por_nome]
for n in destaques:
    if n not in por_nome:
        print("Não encontrei em portfolio/:", n)

(RAIZ / "assets" / "js" / "obras.js").write_text(
    "/* Gerado por tools/processar.py — não editar à mão. */\nwindow.OBRAS = "
    + json.dumps(obras, ensure_ascii=False) + ";\nwindow.OBRAS_HOME = " + json.dumps(home) + ";\n",
    encoding="utf-8",
)
print(f"{len(obras)} fotos, {len(home)} na home")
