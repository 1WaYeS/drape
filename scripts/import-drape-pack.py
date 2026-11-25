"""Import DЯAPE's folded pack PNGs and make neutral seamless cement swatches."""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

source = Path(sys.argv[1])
destination = Path('dist/assets/studio')
textures = {}
for path in sorted((source / 'garments').glob('*.png')):
    garment = Image.open(path).convert('RGBA')
    alpha = garment.getchannel('A').point(lambda value: min(255, round(max(0, value - 16) * 255 / 232)))
    # Remove detached specks while preserving soft, anti-aliased garment edges.
    solid = alpha.point(lambda value: 255 if value > 115 else 0)
    seed = next((x, y) for y in range(solid.height // 3, 2 * solid.height // 3)
                for x in range(solid.width // 3, 2 * solid.width // 3) if solid.getpixel((x, y)))
    ImageDraw.floodfill(solid, seed, 128)
    mask = np.asarray(solid) == 128
    border = Image.fromarray(np.uint8(mask) * 255).filter(ImageFilter.MaxFilter(11))
    alpha = Image.fromarray(np.minimum(np.asarray(alpha), np.asarray(border)))
    garment.putalpha(alpha)
    left, top, right, bottom = alpha.getbbox()
    garment = garment.crop((left - 6, top - 6, right + 6, bottom + 6))
    # Apply a small luminance-only correction to the photographed fibres.
    # Keep the alpha and original garment colours independent of sharpening.
    luma, cb, cr = garment.convert('RGB').convert('YCbCr').split()
    luma = luma.filter(ImageFilter.UnsharpMask(radius=1.05, percent=38, threshold=3))
    corrected = Image.merge('YCbCr', (luma, cb, cr)).convert('RGB')
    corrected.putalpha(garment.getchannel('A'))
    garment = corrected
    name = path.stem
    garment.save(destination / f'pack-{name}.webp', quality=96, method=5)
    alpha = np.asarray(garment.getchannel('A'))
    rows = np.flatnonzero((alpha > 128).any(axis=1))
    left_points, right_points = [], []
    for y in np.linspace(rows[0], rows[-1], 32, dtype=int):
        xs = np.flatnonzero(alpha[y] > 128)
        if xs.size:
            left_points.append(f'{100 * xs[0] / garment.width:.1f}% {100 * y / garment.height:.1f}%')
            right_points.append(f'{100 * xs[-1] / garment.width:.1f}% {100 * y / garment.height:.1f}%')
    textures[name] = {'aspect': round(garment.width / garment.height, 5),
                      'outline': ', '.join(left_points + list(reversed(right_points)))}
Path('dist/pack-textures.js').write_text(
    'export const packTextures = ' + json.dumps(textures, indent=2) + ';\n', encoding='utf8')

cement = Image.open(source / 'environment/cement-floor.png').convert('RGB')
for index, box in enumerate(((899, 245, 1667, 941), (467, 430, 1235, 941))):
    size = 768
    patch = cement.crop(box).resize((size, size), Image.Resampling.LANCZOS)
    rgb = np.asarray(patch, dtype=np.float32)
    base = np.array([115, 106, 98], dtype=np.float32)
    broad = np.asarray(patch.filter(ImageFilter.GaussianBlur(28)), dtype=np.float32)
    fine = np.asarray(patch.filter(ImageFilter.GaussianBlur(3)), dtype=np.float32)
    neutral = np.clip(base + (rgb - fine) * 1.52 + (fine - broad) * 1.04, 0, 255)
    # Crossfade opposite edges with a roll to keep all four sides periodic.
    for axis in (0, 1):
        neutral = np.swapaxes(neutral, 0, axis)
        weight = np.clip((84 - np.minimum(np.arange(size), np.arange(size - 1, -1, -1))) / 84, 0, 1)
        weight = (.25 - .25 * np.cos(np.pi * weight))[:, None, None]
        neutral = neutral * (1 - weight) + np.roll(neutral, size // 2, axis=0) * weight
        neutral = np.swapaxes(neutral, 0, axis)
    # Force the final pair of texels to agree after the crossfade.
    neutral[0] = neutral[-1] = (neutral[0] + neutral[-1]) / 2
    neutral[:, 0] = neutral[:, -1] = (neutral[:, 0] + neutral[:, -1]) / 2
    Image.fromarray(np.uint8(neutral)).save(destination / f'pack-cement-{index}.webp', quality=94, method=5)

