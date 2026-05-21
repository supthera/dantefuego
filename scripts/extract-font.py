#!/usr/bin/env python3
"""Extract embedded BertholdFraktur base64 from a single-file HTML into assets/."""

import base64
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
HTML_PATH = ROOT / "original.html"


def main() -> None:
    html_path = Path(sys.argv[1]) if len(sys.argv) > 1 else HTML_PATH
    if not html_path.exists():
        print(f"Place your single-file HTML at {html_path} or pass a path argument.")
        sys.exit(1)

    html = html_path.read_text(encoding="utf-8")
    match = re.search(
        r"url\('data:font/truetype;base64,([A-Za-z0-9+/=]+)'\)",
        html,
    )
    if not match:
        print("No embedded BertholdFraktur base64 font found in HTML.")
        sys.exit(1)

    ASSETS.mkdir(exist_ok=True)
    out = ASSETS / "BertholdFraktur.ttf"
    out.write_bytes(base64.b64decode(match.group(1)))
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
