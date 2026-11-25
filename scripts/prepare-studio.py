"""Build the studio WebP cutouts and hit outlines from the catalog with Pillow and NumPy."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

assets = Path('dist/assets')
out = assets / 'studio'
out.mkdir(exist_ok=True)
names = 'maroon green flight coast pearl fig yard stallion stripe cornflower zigzag plum cream brown anchor ash forest wrath'.split()

def rgba(rgb, alpha):
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 255)]).astype('uint8'))

for index, name in enumerate(names):
    image = Image.open(assets / f'{name}.jpg').convert('RGB')
    rgb = np.array(image, dtype=np.float32)
    height, width = rgb.shape[:2]
    background = (rgb[:, 12:45].mean(axis=1) + rgb[:, -45:-12].mean(axis=1)) / 2
    delta = rgb - background[:, None]
    pale = name in ('pearl', 'cream', 'wrath')
    if pale:
        # Neutral gray background and the garment’s warm white fabric have
        # similar luminance. Segment on the red/blue separation as well.
        chroma = delta[:,:,0] - delta[:,:,2]
        error = np.maximum(chroma * 2.0, np.max(np.abs(delta), axis=2) * .40)
        if name == 'wrath':
            error = delta.mean(axis=2)
        mask = np.clip((error - 3) / 5, 0, 1)
        mask[:, :int(width * .19)] = mask[:, int(width * .81):] = 0
        mask[:int(height * .19)] = mask[int(height * .81):] = 0
        for row in mask:
            inside = np.flatnonzero(row > .72)
            if len(inside) > 18:
                row[inside[0]:inside[-1]+1] = 1
    else:
        error = -delta.min(axis=2)
        mask = np.clip((error - 20) / 20, 0, 1)
    if name == 'stripe':
        # The two ivory panels connect to the hem and match the background.
        # Bridge them between the existing burgundy and navy panel edges.
        for row in mask:
            inside = np.flatnonzero(row > .72)
            if len(inside) > 18:
                row[inside[0]:inside[-1]+1] = 1
    denim = name in ('yard', 'stallion', 'anchor')
    if not pale:
        # Openings that connect to the catalog background stay transparent.
        # Pad with a known transparent border for the exterior flood fill.
        solid = mask > .57
        solid[:int(height * .12)] = solid[int(height * .90):] = False
        solid[:, :int(width * .10)] = solid[:, int(width * .90):] = False
        silhouette = Image.fromarray(np.pad(np.uint8(solid) * 255, 1)).copy()
        ImageDraw.floodfill(silhouette, (0, 0), 100)
        mask = (np.asarray(silhouette)[1:-1, 1:-1] != 100)
    mask = np.array(Image.fromarray(np.uint8(mask * 255)).filter(ImageFilter.MinFilter(5))) / 255.
    ys, xs = np.where(mask > .78)
    x0, x1 = xs.min(), xs.max() + 1
    y0, y1 = ys.min(), ys.max() + 1
    rgb, mask = rgb[y0:y1, x0:x1], mask[y0:y1, x0:x1]
    h, w = mask.shape
    # Fold the lower length underneath. Sleeves become narrower towards
    # the shoulder on the knits, leaving the collar and chest artwork intact.
    length = round(h * (.58 if denim else [.68,.74,.70,.72,.73,.69,.65,.69,.76,.69,.70,.71,.73,.72,.64,.70,.72,.68][index]))
    y, x = np.mgrid[:length + 16, :w]
    u = (x - w / 2) / w
    v = y / length
    hem = length - 4 + 5 * np.sin(u * 8 + index) + 2 * np.sin(u * 21)
    ripple = (2 + index % 3) * np.sin(u * 15 + v * 5) * np.sin(np.pi * np.clip(v, 0, 1))
    sample_y = np.clip(np.rint(y + ripple + 9 * np.exp(-((y - hem) / 15) ** 2)), 0, h - 1).astype(int)
    tuck = 1 if denim else 1 + .12 * np.exp(-((v - .36) / .25) ** 2)
    sample_x = np.clip(np.rint(w / 2 + (x - w / 2) * tuck + 3 * np.sin(v * 6 + index)), 0, w - 1).astype(int)
    alpha = mask[sample_y, sample_x]
    if not denim:
        width_limit = w * (.326 + .024 * np.sin(v * 4.5 + index) + .016 * (index % 3))
        shift = w * .016 * np.sin(v * 3 + index)
        edge = width_limit - abs(x - w / 2 - shift)
        # Turn both sleeves under along their fold line and round the rolled hem.
        distance = edge - 8 * np.exp(-((hem - y) / 9) ** 2)
        alpha *= np.clip(distance / 1.8, 0, 1)
    alpha *= np.clip((hem - y) / 1.5, 0, 1)
    if denim:
        # The lower legs are doubled underneath the fold, closing the gap at the hem.
        gap = np.exp(-((u + .012) / .095) ** 2) * np.clip((v - .66) * 14, 0, 1)
        other_x = np.clip(sample_x - int(w * .16), 0, w - 1)
        layer = mask[sample_y, other_x] * gap * np.clip((hem - y - 3) / 1.5, 0, 1) * (1 - alpha)
        sampled = np.where(layer[..., None] > alpha[..., None], rgb[sample_y, other_x] * .65, rgb[sample_y, sample_x])
        alpha = np.maximum(alpha, layer)
    else:
        sampled = rgb[sample_y, sample_x]
    crease = v - (.60 + .12 * np.sin(u * 6 + index))
    fold_light = 1 + .10 * np.exp(-((crease + .023) / .031) ** 2) - .13 * np.exp(-((crease - .026) / .024) ** 2)
    fold_light *= 1 - .29 * np.exp(-((hem - y) / 6) ** 2) + .06 * np.exp(-((hem - y - 12) / 6) ** 2)
    if not denim:
        fold_light *= 1 - .23 * np.exp(-((distance - 1) / 5.8) ** 2) + .065 * np.exp(-((distance - 10) / 6) ** 2)
    result = rgba(sampled * fold_light[..., None], alpha * 255)
    bounds = result.getchannel('A').point(lambda p: 255 if p > 24 else 0).getbbox()
    result = result.crop((bounds[0]-7, bounds[1]-7, bounds[2]+7, bounds[3]+7))
    if result.width < 180 or result.width > width * .78 or result.height < 170:
        raise ValueError(f'Check the catalog mask for {name}: {result.size}')
    result.save(out / f'{name}.webp', quality=92, method=4)

camera = Image.open(assets / 'floor-camera.jpg').convert('RGB')
mask = Image.new('L', camera.size)
points = [(0,56),(3,41),(73,1),(77,0),(81,3),(85,11),(88,15),(94,38),(99,60),(99,64),(23,100),(19,97),(4,64)]
ImageDraw.Draw(mask).polygon([(round(x * 2.93), round(y * 2.32)) for x,y in points], fill=255)
camera.putalpha(mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.55)))
camera.save(out / 'camera.webp', quality=94, method=6)

# Reflect an unobstructed patch of the original concrete at its edges.
# High-pass the photographed patch so scene lighting can set the large gradients.
patch = Image.open(assets / 'flat-floor.jpg').convert('RGB').crop((939,336,1163,560)).resize((256,256))
rgb = np.array(patch, dtype=float) - np.array(patch.filter(ImageFilter.GaussianBlur(15)), dtype=float)
rgb = np.concatenate([rgb,rgb[:,::-1]], axis=1)
rgb = np.concatenate([rgb,rgb[::-1]], axis=0)
rng = np.random.default_rng(27)
grain = rng.normal(0, 1.9, rgb.shape[:2])
pores = (rng.random(rgb.shape[:2]) < .013) * rng.uniform(1, 10, rgb.shape[:2])
base = np.array([154,149,141]) + rgb * 1.25 + (grain - pores)[...,None]
Image.fromarray(np.uint8(np.clip(base,0,255))).save(out / 'cement.webp', quality=91, method=6)



# Match pointer hit regions to the visible cutouts.
import json
textures = {}
for name in names:
    img = Image.open(out / f'{name}.webp')
    points_left, points_right = [], []
    alpha = np.array(img.getchannel('A'))
    ys = np.flatnonzero((alpha > 140).any(axis=1))
    for y in np.linspace(ys[0], ys[-1], 26, dtype=int):
        xs = np.flatnonzero(alpha[y] > 140)
        if len(xs):
            points_left.append(f'{100 * xs[0] / img.width:.1f}% {100 * y / img.height:.1f}%')
            points_right.append(f'{100 * xs[-1] / img.width:.1f}% {100 * y / img.height:.1f}%')
    textures[name] = {'aspect': round(img.width / img.height, 5), 'outline': ', '.join(points_left + points_right[::-1])}
Path('dist/studio-textures.js').write_text('export const textures = ' + json.dumps(textures, indent=2) + ';\n', encoding='utf8')






