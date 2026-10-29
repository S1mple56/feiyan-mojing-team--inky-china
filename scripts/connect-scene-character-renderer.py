from pathlib import Path
import re

web = Path(__file__).resolve().parents[1] / '2d'
files = list(web.glob('*.html')) + list((web / 'yuntaishan').glob('*_scene.html'))
changed = []
for file in files:
    text = file.read_text(encoding='utf-8')
    if 'npcData' not in text or not re.search(r'function create\s*\(\s*\)\s*\{', text):
        continue
    if 'SceneCharacterRenderer.attach(this)' in text:
        continue
    prefix = '../' if file.parent.name == 'yuntaishan' else ''
    scripts = '<script src="' + prefix + 'landmark-renderer.js"></script>\n<script src="' + prefix + 'scene-character-renderer.js"></script>\n'
    text = text.replace('</head>', scripts + '</head>', 1)
    text = re.sub(r'(function create\s*\(\s*\)\s*\{)', r'\1\n    SceneCharacterRenderer.attach(this);', text, count=1)
    file.write_text(text, encoding='utf-8')
    changed.append(file.relative_to(web).as_posix())
print('Connected NPC compositing:', len(changed), changed)
