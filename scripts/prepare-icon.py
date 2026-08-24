#!/usr/bin/env python3
"""Render the Taskapp icon from geometry so every size stays sharp."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / "resources" / "fonts" / "Corinthia-Bold.ttf"
MASTER = 2048
OUTPUTS = [
    (ROOT / "resources" / "icon.png", 1024),
    (ROOT / "resources" / "icons" / "icon-512.png", 512),
    (ROOT / "resources" / "icons" / "icon-256.png", 256),
    (ROOT / "resources" / "icons" / "icon-128.png", 128),
    (ROOT / "resources" / "icons" / "icon-64.png", 64),
    (ROOT / "resources" / "icons" / "icon-48.png", 48),
    (ROOT / "src" / "renderer" / "src" / "assets" / "icon.png", 512),
]

BLACK = (10, 10, 10, 255)
GOLD = (212, 160, 90, 255)
# Breathing room around the mark; the OS dock adds more padding of its own.
PAD = 80
# Rounded-rect radius as a fraction of the plate. A plain rounded rect looks
# rounder than Apple's squircle at the same percentage, so this stays conservative.
CORNER = 0.155


def render_master() -> Image.Image:
    canvas = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    scale = MASTER / 1024
    pad = int(PAD * scale)
    plate = (pad, pad, MASTER - pad, MASTER - pad)
    radius = int(round((MASTER - 2 * pad) * CORNER))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(plate, radius=radius, fill=GOLD)

    font = ImageFont.truetype(str(FONT), int(560 * scale))
    glyph = "T"
    bbox = draw.textbbox((0, 0), glyph, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    cx = (plate[0] + plate[2]) / 2
    cy = (plate[1] + plate[3]) / 2 + 14 * scale
    x = cx - width / 2 - bbox[0]
    y = cy - height / 2 - bbox[1]
    draw.text((x, y), glyph, font=font, fill=BLACK)
    return canvas


def main() -> None:
    if not FONT.exists():
        raise SystemExit(f"Missing icon font: {FONT}")
    master = render_master()
    for destination, size in OUTPUTS:
        destination.parent.mkdir(parents=True, exist_ok=True)
        resized = master.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(destination, format="PNG", optimize=True)
        print(f"wrote {destination} {size}x{size}")


if __name__ == "__main__":
    main()
