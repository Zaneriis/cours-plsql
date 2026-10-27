#!/usr/bin/env python3
"""Assemble index.html et assets/data.js à partir de src/.

Usage : python3 tools/build.py [dossier_sortie]   (défaut : racine du dépôt)
"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
ORDER = ["accueil"] + [f"ch{i:02d}" for i in range(14)]


def build(out: pathlib.Path) -> None:
    parts = [(SRC / "_head.html").read_text(encoding="utf-8")]
    for name in ORDER:
        parts.append((SRC / "chapters" / f"{name}.html").read_text(encoding="utf-8").strip() + "\n\n")
    parts.append((SRC / "_foot.html").read_text(encoding="utf-8"))
    (out / "assets").mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text("".join(parts), encoding="utf-8")

    data = [(SRC / "data" / "_init.js").read_text(encoding="utf-8")]
    for name in ORDER[1:]:
        f = SRC / "data" / f"{name}.js"
        if f.exists():
            data.append(f"\n/* ---- {name} ---- */\n" + f.read_text(encoding="utf-8"))
    (out / "assets" / "data.js").write_text("".join(data), encoding="utf-8")


if __name__ == "__main__":
    target = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT
    build(target)
    print(f"Construit dans {target}")
