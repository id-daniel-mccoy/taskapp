#!/usr/bin/env python3
"""Turn the generated icon into RGBA PNGs with a real alpha channel."""

from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(
    "/home/secure-dev/.cursor/projects/home-secure-dev-dev-production-taskapp/assets/taskapp-icon-hd.png"
)
OUTPUTS = [
    (ROOT / "resources" / "icon.png", 1024),
    (ROOT / "resources" / "icons" / "icon-512.png", 512),
    (ROOT / "resources" / "icons" / "icon-256.png", 256),
    (ROOT / "src" / "renderer" / "src" / "assets" / "icon.png", 512),
]


def similar(pixel: tuple[int, int, int, int], seed: tuple[int, int, int], threshold: int) -> bool:
    return sum(abs(pixel[i] - seed[i]) for i in range(3)) <= threshold


def knockout_background(image: Image.Image, threshold: int = 36) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    seeds = [
        pixels[0, 0][:3],
        pixels[width - 1, 0][:3],
        pixels[0, height - 1][:3],
        pixels[width - 1, height - 1][:3],
    ]
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if visited[index]:
            return
        pixel = pixels[x, y]
        if any(similar(pixel, seed, threshold) for seed in seeds):
            visited[index] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        if x > 0:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y > 0:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    alpha = rgba.getchannel("A").filter(ImageFilter.GaussianBlur(0.8))
    rgba.putalpha(alpha)
    return rgba


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source icon: {SOURCE}")

    prepared = knockout_background(Image.open(SOURCE))
    extrema = prepared.getextrema()
    if extrema[3][0] == 255:
        raise SystemExit("Icon is still fully opaque after processing.")

    for destination, size in OUTPUTS:
        destination.parent.mkdir(parents=True, exist_ok=True)
        resized = prepared.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(destination, format="PNG", optimize=True)
        print(f"wrote {destination} {size}x{size} mode={resized.mode}")


if __name__ == "__main__":
    main()
