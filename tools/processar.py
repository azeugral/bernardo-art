"""Gera assets/obras/*.webp e assets/js/obras.js a partir das fotos em ../_ref/portfolio.

Uso: python tools/processar.py
- A ordem do site é a ordem alfabética dos arquivos (01.jpg, 02.jpg...).
- Legenda opcional: o que vier depois de "__" no nome vira a legenda,
  ex.: "03__Fechamento de braço.jpg" → "Fechamento de braço".
"""
import json
from pathlib import Path
from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parents[1]
ORIGEM = RAIZ.parent / "_ref" / "portfolio"
DESTINO = RAIZ / "assets" / "obras"
LARGURA = 1200
PROPORCAO = 5 / 4  # altura / largura (4:5)

DESTINO.mkdir(parents=True, exist_ok=True)
for antigo in DESTINO.glob("*.webp"):
    antigo.unlink()

obras = []
arquivos = sorted(p for p in ORIGEM.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
for i, arq in enumerate(arquivos, 1):
    im = ImageOps.exif_transpose(Image.open(arq)).convert("RGB")
    alvo_h = round(LARGURA * PROPORCAO)
    im = ImageOps.fit(im, (LARGURA, alvo_h), Image.LANCZOS, centering=(0.5, 0.45))
    nome = f"{i:02d}.webp"
    im.save(DESTINO / nome, "WEBP", quality=80, method=6)
    legenda = arq.stem.split("__", 1)[1].replace("-", " ") if "__" in arq.stem else ""
    obras.append({
        "src": f"assets/obras/{nome}",
        "w": LARGURA, "h": alvo_h,
        "alt": f"Tatuagem abstrata de Bernardo Lacerda{': ' + legenda if legenda else ''}",
        "legenda": legenda,
    })

(RAIZ / "assets" / "js" / "obras.js").write_text(
    "/* Gerado por tools/processar.py — não editar à mão. */\nwindow.OBRAS = "
    + json.dumps(obras, ensure_ascii=False, indent=2) + ";\n",
    encoding="utf-8",
)
print(f"{len(obras)} fotos processadas")
