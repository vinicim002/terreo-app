# /// script
# requires-python = ">=3.10"
# dependencies = ["markdown>=3.5", "weasyprint>=62"]
# ///
"""Gera docs/pdf/terreo-documentacao.pdf a partir de docs/.

Uso: uv run scripts/gerar_pdf.py
"""

import subprocess
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import markdown
from weasyprint import HTML

RAIZ = Path(__file__).resolve().parent.parent
DOCS = RAIZ / "docs"
SAIDA = DOCS / "pdf" / "terreo-documentacao.pdf"
LOGO = DOCS / "assets" / "terreo-logo-horizontal-laranja.svg"

CAPITULOS = sorted((DOCS / "documentacao").glob("*.md")) + [
    DOCS / "backlog.md",
    DOCS / "changelog.md",
]

CSS = """
@page {
  size: A4;
  margin: 2cm 1.8cm;
  @bottom-right { content: counter(page); font-family: "DejaVu Sans", sans-serif; font-size: 9pt; color: #64748b; }
  @bottom-left { content: "Térreo — Documentação do projeto"; font-family: "DejaVu Sans", sans-serif; font-size: 9pt; color: #64748b; }
}
@page :first { @bottom-left { content: none; } @bottom-right { content: none; } }
body { font-family: "Plus Jakarta Sans", "DejaVu Sans", sans-serif; font-size: 10.5pt; line-height: 1.5; color: #0f172a; }
.capa { page-break-after: always; text-align: center; padding-top: 7cm; }
.capa img { width: 9cm; }
.capa .subtitulo { font-size: 16pt; color: #C2410C; margin-top: 1cm; font-weight: bold; }
.capa .data { color: #64748b; margin-top: 0.5cm; }
.sumario { page-break-after: always; }
.sumario li { margin: 4pt 0; }
.capitulo { page-break-before: always; }
h1 { color: #C2410C; font-size: 20pt; border-bottom: 2px solid #E8590C; padding-bottom: 4pt; }
h2 { color: #C2410C; font-size: 14pt; margin-top: 18pt; }
h3 { font-size: 12pt; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9.5pt; }
th { background: #C2410C; color: #fff; text-align: left; }
th, td { border: 1px solid #cbd5e1; padding: 4pt 6pt; vertical-align: top; }
tr:nth-child(even) td { background: #F4EEE2; }
code { font-family: "DejaVu Sans Mono", monospace; font-size: 9pt; background: #f1f5f9; padding: 0 2pt; }
pre { background: #f1f5f9; padding: 6pt; }
a { color: #C2410C; text-decoration: none; }
.commits td:first-child { font-family: "DejaVu Sans Mono", monospace; white-space: nowrap; }
"""


def commits_recentes(limite: int = 30) -> str:
    try:
        saida = subprocess.run(
            ["git", "log", f"-{limite}", "--date=short", "--format=%h%x1f%ad%x1f%an%x1f%s"],
            cwd=RAIZ, capture_output=True, text=True, check=True,
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""
    linhas = [l.split("\x1f") for l in saida.strip().splitlines() if l]
    if not linhas:
        return ""
    corpo = "".join(
        f"<tr><td>{h}</td><td>{d}</td><td>{a}</td><td>{s}</td></tr>" for h, d, a, s in linhas
    )
    return (
        '<section class="capitulo"><h1>Commits recentes</h1>'
        f"<p>Últimos {len(linhas)} commits do repositório.</p>"
        '<table class="commits"><tr><th>Commit</th><th>Data</th><th>Autor</th><th>Mensagem</th></tr>'
        f"{corpo}</table></section>"
    )


def main() -> None:
    agora = datetime.now(ZoneInfo("America/Sao_Paulo")).strftime("%d/%m/%Y %H:%M")
    secoes, titulos = [], []
    for arquivo in CAPITULOS:
        texto = arquivo.read_text(encoding="utf-8")
        primeira = next((l for l in texto.splitlines() if l.startswith("# ")), arquivo.stem)
        titulos.append(primeira.lstrip("# ").strip())
        html = markdown.markdown(texto, extensions=["tables", "fenced_code", "sane_lists"])
        secoes.append(f'<section class="capitulo">{html}</section>')

    commits = commits_recentes()
    if commits:
        titulos.append("Commits recentes")

    sumario = "".join(f"<li>{t}</li>" for t in titulos)
    logo = f'<img src="{LOGO.as_uri()}">' if LOGO.exists() else "<h1>Térreo</h1>"
    documento = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Térreo — Documentação do projeto</title><style>{CSS}</style></head><body>
<div class="capa">{logo}<div class="subtitulo">Documentação do projeto</div>
<div class="data">Atualizada em {agora}</div></div>
<div class="sumario"><h1>Sumário</h1><ol>{sumario}</ol></div>
{''.join(secoes)}{commits}</body></html>"""

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    HTML(string=documento, base_url=str(RAIZ)).write_pdf(SAIDA)
    print(f"PDF gerado: {SAIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
