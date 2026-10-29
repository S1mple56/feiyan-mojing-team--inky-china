"""Repair stale PNG paths only when an existing JPEG counterpart is present."""
from pathlib import Path
import re

web = Path(__file__).resolve().parents[1] / '2d'
repaired = []
for file in list((web / 'yuntaishan').glob('*.html')) + [web / 'yinxu_royal.html']:
    text = file.read_text(encoding='utf-8')
    def replace(match):
        original = match.group(0)
        destination = original[:-4] + '.jpg'
        if not (file.parent / original).is_file() and (file.parent / destination).is_file():
            repaired.append({'page': file.name, 'old': original, 'new': destination})
            return destination
        return original
    updated = re.sub(r"(?:\.\./)?province/[^\s'\"()<>]+\.png", replace, text)
    prefix = '../' if file.parent.name == 'yuntaishan' else ''
    updated = updated.replace('https://cdn.jsdelivr.net/npm/phaser@3.55.2/dist/phaser.min.js', prefix + 'vendor/phaser-3.55.2.min.js')
    if updated != text:
        file.write_text(updated, encoding='utf-8')
print('Repaired', len(repaired), 'image references across', len(set(x['page'] for x in repaired)), 'pages.')
for entry in repaired:
    print(entry['page'], entry['old'], '->', entry['new'])
