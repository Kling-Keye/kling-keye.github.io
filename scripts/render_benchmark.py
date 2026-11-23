"""Render the desktop and mobile editions of Keye-VL 2.0 report Figure 1.

Source: https://arxiv.org/html/2606.10651v1#S0.F1
Run from any directory with Python, Matplotlib and Pillow installed.
"""
from io import BytesIO
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
from matplotlib import pyplot as plt
from matplotlib.font_manager import FontProperties
from matplotlib.patches import Rectangle
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MODELS = (
    ("Keye-VL-2.0-30B-A3B", "#c95622"),
    ("Qwen3.5-35B-A3B", "#659991"),
    ("Qwen3-VL-235B-A22B", "#758ba7"),
    ("Gemini-3-Flash", "#aea182"),
)
BENCHMARKS = (
    ("ActivityNet", "TimeLens · mIoU", (58.5, 53.2, 52.1, 57.0)),
    ("QVHighlights", "TimeLens · mIoU", (70.1, 65.7, 64.6, 49.5)),
    ("Charades", "TimeLens · mIoU", (58.4, 49.1, 47.8, 61.2)),
    ("LongVideoBench", "Overall", (74.1, 61.6, 70.5, 81.1)),
    ("Video-MME-v2", "Overall", (42.4, 28.5, 36.8, 52.4)),
    ("Video-MME-v2", "Non-linear score", (24.2, 12.2, 28.1, 32.9)),
)

BACKGROUND = "#f5f7f4"
INK = "#192e25"
MUTED = "#495c51"


def render(filename, width, columns):
    rows = len(BENCHMARKS) // columns
    header_height = 102
    row_height = 135
    height = header_height + rows * row_height + 12
    # Coordinates below are logical pixels. Export at triple resolution for zoom.
    fig = plt.figure(figsize=(width / 96, height / 96), dpi=96, facecolor=BACKGROUND)

    def label(x, y, value, size, color=INK, bold=False, family="DejaVu Sans"):
        font = FontProperties(family=family, weight="bold" if bold else "normal")
        fig.text(x / width, 1 - y / height, value, fontproperties=font,
                 fontsize=size * 72 / 96, color=color, va="top")

    label(0, 0, "Video benchmarks", 25, bold=True)
    legend_width = min(width * .55, 231)
    for index, (name, color) in enumerate(MODELS):
        x = index % 2 * legend_width
        y = 42 + index // 2 * 21
        fig.add_artist(Rectangle((x / width, 1 - (y + 10) / height), 8 / width, 8 / height,
                                 transform=fig.transFigure, facecolor=color, linewidth=0))
        label(x + 14, y, name, 12.4, color="#9c3e12" if index == 0 else INK, bold=index == 0)

    gap = 22 if columns == 3 else 16
    group_width = (width - gap * (columns - 1)) / columns
    for i, (title, measure, values) in enumerate(BENCHMARKS):
        left = (i % columns) * (group_width + gap)
        top = header_height + (i // columns) * row_height
        label(left, top, title, 15, bold=True)
        label(left, top + 20, measure, 12.5, MUTED)
        axes = fig.add_axes((left / width, 1 - (top + 120) / height,
                             group_width / width, 84 / height), facecolor="none")
        axes.set(xlim=(-.55, 3.55), ylim=(0, 100))
        axes.set_axis_off()
        # All six panels share the same zero baseline and score scale.
        axes.axhline(50, color="#9daea2", linewidth=.55, linestyle=(0, (2, 4)))
        axes.axhline(0, color="#829486", linewidth=1)
        for j, (score, (_, color)) in enumerate(zip(values, MODELS)):
            axes.bar(j, score, width=.65, color=color, linewidth=0)
            axes.annotate(f"{score:.1f}", (j, score), xytext=(0, 3), textcoords="offset points",
                          ha="center", va="bottom", fontsize=9.5, color="#9c3e12" if j == 0 else INK,
                          weight="bold" if j == 0 else "normal", family="DejaVu Sans")

    label(0, height - 15, "Shared scale 0–100 · dotted line at 50", 12, MUTED)

    buf = BytesIO()
    fig.savefig(buf, format="png", dpi=288, facecolor=BACKGROUND)
    plt.close(fig)
    buf.seek(0)
    with Image.open(buf) as image:
        image.convert("RGB").save(ROOT / "asset" / "reports" / filename, lossless=True, method=6)


if __name__ == "__main__":
    render("keye-vl-2.0-benchmarks.webp", 640, 3)
    render("keye-vl-2.0-benchmarks-compact.webp", 322, 2)
