"""
Run this once to generate PNG icons from logo-icon.svg
Usage: python generate-icons.py
Requires: pip install cairosvg pillow
"""
import subprocess, sys

# Install deps if needed
subprocess.run([sys.executable, "-m", "pip", "install", "cairosvg", "pillow"], check=True)

import cairosvg
from PIL import Image
from pathlib import Path

PUBLIC = Path(__file__).parent / "public"
SVG = PUBLIC / "logo-icon.svg"

sizes = {
    "favicon-16.png": 16,
    "favicon-32.png": 32,
    "logo-icon-64.png": 64,
    "logo-icon-180.png": 180,
    "logo-icon-192.png": 192,
    "logo-icon-512.png": 512,
    "logo-icon.png": 512,
}

for filename, size in sizes.items():
    out = PUBLIC / filename
    cairosvg.svg2png(url=str(SVG), write_to=str(out), output_width=size, output_height=size)
    print(f"✓ {filename} ({size}x{size})")

# favicon.ico (multi-size)
imgs = [Image.open(PUBLIC / f"favicon-{s}.png").convert("RGBA") for s in [16, 32]]
imgs[0].save(
    PUBLIC / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32)],
    append_images=imgs[1:]
)
print("✓ favicon.ico")
print("\nAll icons generated in /public!")
